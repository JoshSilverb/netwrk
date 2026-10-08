from app.db.session import db
from geoalchemy2 import Geography
from pgvector.sqlalchemy import Vector
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID
from datetime import date

class Contact(db.Model):
    __tablename__ = "contacts"

    contact_id = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey('users.user_id', ondelete='CASCADE'),
        nullable=False
    )
    fullname   = db.Column(db.String(128), nullable=False)
    location   = db.Column(db.String(128))
    coordinates = db.Column(Geography(geometry_type='POINT', srid=4326, spatial_index=False))
    metthrough = db.Column(db.String(256))
    userbio    = db.Column(db.String(500))
    lastcontact = db.Column(db.Date, default=date.today, server_default=text("CURRENT_DATE"))
    remind_in_weeks  = db.Column(db.Integer, default=0, server_default=text("0"))
    remind_in_months = db.Column(db.Integer, default=0, server_default=text("0"))
    nextcontact = db.Column(db.Date)
    embedding   = db.Column(Vector(1536))
    profile_pic_object_name = db.Column(db.String(128))
    linked_user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey('users.user_id', ondelete='SET NULL'),
        nullable=True
    )

    user        = db.relationship("User", back_populates="contacts", foreign_keys=[user_id])
    linked_user = db.relationship("User", foreign_keys=[linked_user_id])
    socials     = db.relationship("Social", backref="contact", cascade="all, delete-orphan")
    tags        = db.relationship("Tag",    backref="contact", cascade="all, delete-orphan")

    __table_args__ = (
        db.Index(
            'contacts_embedding_idx', 'embedding',
            postgresql_using='hnsw',
            postgresql_ops={'embedding': 'vector_cosine_ops'},
        ),
        db.Index(
            'contacts_linked_user_unique', 'user_id', 'linked_user_id',
            unique=True,
            postgresql_where=text('linked_user_id IS NOT NULL'),
        ),
        db.Index('locations_gix', 'coordinates', postgresql_using='gist'),
    )
