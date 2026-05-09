#!/usr/bin/env python3
"""
Backfill coordinates for users who have a location string but no coordinates.
Run from the backend/ directory:
  DATABASE_URL=... GOOGLE_API_KEY=... python scripts/backfill_user_coordinates.py
"""

import os
import sys
import time
import requests
import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

if not DATABASE_URL:
    sys.exit("ERROR: DATABASE_URL not set")
if not GOOGLE_API_KEY:
    sys.exit("ERROR: GOOGLE_API_KEY not set")


def geocode(location: str) -> tuple[float, float] | None:
    url = (
        f"https://maps.googleapis.com/maps/api/geocode/json"
        f"?address={'+'.join(location.split())}&key={GOOGLE_API_KEY}"
    )
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        results = resp.json().get("results", [])
        if not results:
            return None
        loc = results[0]["geometry"]["location"]
        return loc["lat"], loc["lng"]
    except Exception as e:
        print(f"  Geocode error for '{location}': {e}")
        return None


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT user_id, location
        FROM users
        WHERE location IS NOT NULL
          AND location != ''
          AND coordinates IS NULL
    """)
    rows = cur.fetchall()

    if not rows:
        print("No users need backfilling.")
        conn.close()
        return

    print(f"Found {len(rows)} user(s) to backfill.\n")
    success = 0
    skipped = 0

    for user_id, location in rows:
        print(f"  {user_id}  '{location}' ...", end=" ", flush=True)
        coords = geocode(location)
        if coords is None:
            print("no result, skipping")
            skipped += 1
        else:
            lat, lng = coords
            cur.execute("""
                UPDATE users
                SET coordinates = ST_GeogFromText('SRID=4326;POINT(%s %s)')
                WHERE user_id = %s
            """, (lng, lat, user_id))
            print(f"→ ({lat:.4f}, {lng:.4f})")
            success += 1
        time.sleep(0.1)  # stay well within geocoding rate limits

    conn.commit()
    cur.close()
    conn.close()
    print(f"\nDone. {success} updated, {skipped} skipped.")


if __name__ == "__main__":
    main()
