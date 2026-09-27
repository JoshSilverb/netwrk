#!/usr/bin/env python3
"""
Fill in NULL embeddings for local dev seed contacts, synchronously.

Unlike populate_missing_embeddings.py (which uses the OpenAI Batch API and
takes 10-20 minutes), this hits the regular embeddings endpoint directly and
finishes in seconds — meant to run once against a freshly seeded local
Postgres, e.g. from `./dev.sh reset-db`.

Refuses to run against Neon.

Usage:
    DATABASE_URL=postgresql://postgres:postgres@localhost:5433/netwrkdb \\
    OPENAI_API_KEY=... GOOGLE_API_KEY=... S3_BUCKET_NAME=... \\
        python scripts/dev_embed_missing.py
"""

import os
import sys
import logging

# Put backend/ on sys.path so `app.*` imports work when run as a script.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def _check_not_neon():
    db_url = os.getenv("DATABASE_URL", "")
    if "neon.tech" in db_url:
        logger.error(
            "DATABASE_URL points at neon.tech. This script only runs against "
            "a local dev database — refusing to continue."
        )
        sys.exit(1)


def main():
    _check_not_neon()

    from sqlalchemy.orm import joinedload

    from app import create_app
    from app.db.session import db
    from app.models.contact import Contact
    from app.models.tags import Tag
    from app.routes.contacts import _get_contact_embedding

    app = create_app()
    with app.app_context():
        contacts = (
            db.session.query(Contact)
            .options(joinedload(Contact.tags).joinedload(Tag.tag_label))
            .filter(Contact.embedding.is_(None))
            .all()
        )

        logger.info(f"Found {len(contacts)} contacts with missing embeddings")

        for contact in contacts:
            tag_labels = [tag.tag_label.label for tag in contact.tags if tag.tag_label]
            embedding = _get_contact_embedding(
                contact.fullname or "",
                contact.location or "",
                contact.metthrough or "",
                contact.userbio or "",
                tag_labels,
            )
            contact.embedding = embedding
            logger.info(f"Embedded contact_id={contact.contact_id} ({contact.fullname})")

        db.session.commit()
        logger.info(f"Done. Embedded {len(contacts)} contacts.")


if __name__ == "__main__":
    main()
