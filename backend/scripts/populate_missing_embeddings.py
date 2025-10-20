#!/usr/bin/env python3
"""
Script to populate missing embeddings for contacts in the database.

This script connects to the database, finds all contacts without embeddings,
generates embeddings using OpenAI's Batch API (50% cost savings), and updates
the database with the generated embeddings.

Uses OpenAI Batch API with ~10-20min processing time (max 24 hours).

Usage:
    python populate_missing_embeddings.py --db-url <database_url>

    Or use environment variable:
    DATABASE_URL=<database_url> python populate_missing_embeddings.py
"""

import argparse
import os
import sys
import logging
import json
import time
from typing import Optional
from datetime import datetime

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from openai import OpenAI

# Add the parent directory to the path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.contact import Contact

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def populate_missing_embeddings(db_url: str, openai_api_key: str, poll_interval: int = 30):
    """
    Populate missing embeddings using OpenAI Batch API.

    Args:
        db_url: Database connection URL
        openai_api_key: OpenAI API key for generating embeddings
        poll_interval: Seconds to wait between status checks (default: 30)
    """
    openai_client = OpenAI(api_key=openai_api_key)
    engine = create_engine(db_url)

    # Step 1: Query for contacts without embeddings
    with Session(engine) as session:
        stmt = select(Contact).where(Contact.embedding.is_(None))
        contacts_without_embeddings = session.execute(stmt).scalars().all()

        total_contacts = len(contacts_without_embeddings)
        logger.info(f"Found {total_contacts} contacts without embeddings")

        if total_contacts == 0:
            logger.info("No contacts need embeddings. Exiting.")
            return

        # Step 2: Create batch request file in JSONL format
        batch_requests = []
        contact_id_map = {}  # Map custom_id to contact_id for later retrieval

        for idx, contact in enumerate(contacts_without_embeddings):
            location = contact.location or ""
            bio = contact.userbio or ""
            embedding_text = f"location='{location}'; bio='{bio}'"

            custom_id = f"contact_{contact.contact_id}"
            contact_id_map[custom_id] = contact.contact_id

            batch_requests.append({
                "custom_id": custom_id,
                "method": "POST",
                "url": "/v1/embeddings",
                "body": {
                    "model": "text-embedding-3-small",
                    "input": embedding_text,
                    "encoding_format": "float"
                }
            })

        # Step 3: Write batch file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        batch_file_path = f"/tmp/embeddings_batch_{timestamp}.jsonl"

        with open(batch_file_path, 'w') as f:
            for request in batch_requests:
                f.write(json.dumps(request) + '\n')

        logger.info(f"Created batch file with {len(batch_requests)} requests: {batch_file_path}")

    # Step 4: Upload batch file to OpenAI
    logger.info("Uploading batch file to OpenAI...")
    with open(batch_file_path, 'rb') as f:
        batch_input_file = openai_client.files.create(
            file=f,
            purpose="batch"
        )
    logger.info(f"Batch file uploaded: {batch_input_file.id}")

    # Step 5: Create batch job
    logger.info("Creating batch job...")
    batch_job = openai_client.batches.create(
        input_file_id=batch_input_file.id,
        endpoint="/v1/embeddings",
        completion_window="24h"
    )
    logger.info(f"Batch job created: {batch_job.id}")
    logger.info(f"Status: {batch_job.status}")

    # Step 6: Poll for completion
    logger.info(f"Waiting for batch to complete (polling every {poll_interval}s)...")
    logger.info("This typically takes 10-20 minutes but can take up to 24 hours")

    while batch_job.status not in ["completed", "failed", "expired", "cancelled"]:
        time.sleep(poll_interval)
        batch_job = openai_client.batches.retrieve(batch_job.id)
        logger.info(f"Status: {batch_job.status} | Progress: {batch_job.request_counts.completed}/{batch_job.request_counts.total}")

    if batch_job.status != "completed":
        logger.error(f"Batch job failed with status: {batch_job.status}")
        return

    logger.info("Batch job completed successfully!")

    # Step 7: Download results
    logger.info("Downloading results...")
    result_file_id = batch_job.output_file_id
    result_content = openai_client.files.content(result_file_id)
    result_file_path = f"/tmp/embeddings_results_{timestamp}.jsonl"

    with open(result_file_path, 'wb') as f:
        f.write(result_content.content)

    logger.info(f"Results downloaded to: {result_file_path}")

    # Step 8: Parse results and update database
    logger.info("Updating database with embeddings...")
    updated_count = 0
    failed_count = 0

    with Session(engine) as session:
        with open(result_file_path, 'r') as f:
            for line in f:
                result = json.loads(line)

                if result.get("error"):
                    logger.error(f"Error for {result['custom_id']}: {result['error']}")
                    failed_count += 1
                    continue

                try:
                    custom_id = result["custom_id"]
                    contact_id = contact_id_map[custom_id]
                    embedding = result["response"]["body"]["data"][0]["embedding"]

                    # Update contact
                    contact = session.execute(
                        select(Contact).where(Contact.contact_id == contact_id)
                    ).scalar_one()
                    contact.embedding = embedding
                    updated_count += 1

                    if updated_count % 100 == 0:
                        session.commit()
                        logger.info(f"Committed {updated_count} embeddings")

                except Exception as e:
                    logger.error(f"Failed to update contact {custom_id}: {e}")
                    failed_count += 1

        # Final commit
        session.commit()
        logger.info(f"Completed: {updated_count} embeddings updated, {failed_count} failed")

    # Step 9: Cleanup
    logger.info("Cleaning up temporary files...")
    os.remove(batch_file_path)
    os.remove(result_file_path)
    logger.info("Cleanup complete")


def main():
    parser = argparse.ArgumentParser(
        description="Populate missing contact embeddings using OpenAI Batch API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Using CLI argument
  python populate_missing_embeddings.py --db-url "postgresql://..."

  # Using environment variables
  DATABASE_URL="postgresql://..." OPENAI_API_KEY="sk-..." python populate_missing_embeddings.py

  # With custom poll interval
  python populate_missing_embeddings.py --db-url "postgresql://..." --poll-interval 60
        """
    )
    parser.add_argument(
        "--db-url",
        type=str,
        help="Database URL (can also be set via DATABASE_URL environment variable)"
    )
    parser.add_argument(
        "--openai-api-key",
        type=str,
        help="OpenAI API key (can also be set via OPENAI_API_KEY environment variable)"
    )
    parser.add_argument(
        "--poll-interval",
        type=int,
        default=30,
        help="Seconds between status checks (default: 30)"
    )

    args = parser.parse_args()

    # Get database URL from args or environment
    db_url = args.db_url #or os.getenv("DATABASE_URL")
    # if not db_url:
    #     logger.error("Database URL not provided. Use --db-url or set DATABASE_URL environment variable.")
    #     sys.exit(1)

    # # Get OpenAI API key from args or environment
    openai_api_key = args.openai_api_key #or os.getenv("OPENAI_API_KEY")
    # if not openai_api_key:
    #     logger.error("OpenAI API key not provided. Use --openai-api-key or set OPENAI_API_KEY environment variable.")
    #     sys.exit(1)

    logger.info("Starting embedding population process using OpenAI Batch API...")
    logger.info("Batch API provides 50% cost savings with ~10-20min processing time")
    logger.info(f"Database URL: {db_url[:20]}...")  # Log partial URL for security

    try:
        populate_missing_embeddings(db_url, openai_api_key, args.poll_interval)
        logger.info("Embedding population completed successfully!")
    except Exception as e:
        logger.error(f"Error during embedding population: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
