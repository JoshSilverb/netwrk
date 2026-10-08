import uuid as _uuid
from app.db.session import db
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography

class User(db.Model):
    __tablename__ = "users"

    user_id   = db.Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4,
                          server_default=text("gen_random_uuid()"))
    user_token = db.Column(db.CHAR(32))
    username  = db.Column(db.String(128), nullable=False)
    fullname  = db.Column(db.String(128), nullable=False)
    email     = db.Column(db.String(256), nullable=True)
    password  = db.Column(db.Text, nullable=False)
    num_contacts = db.Column(db.Integer, default=0, server_default=text("0"))
    bio       = db.Column(db.Text)
    profile_pic_object_name = db.Column(db.String(128))
    location  = db.Column(db.String(128))
    is_public   = db.Column(db.Boolean, nullable=False, default=False,
                            server_default=text("false"))
    coordinates = db.Column(Geography(geometry_type='POINT', srid=4326, spatial_index=False))

    contacts = db.relationship("Contact",
                               back_populates="user",
                               foreign_keys="Contact.user_id",
                               cascade="all, delete-orphan")

    tag_label = db.relationship("TagLabel",
                                back_populates="user",
                                cascade="all, delete-orphan")

    __table_args__ = (
        db.Index('users_username_uq', 'username', unique=True),
        db.Index(
            'users_email_uq', 'email',
            unique=True,
            postgresql_where=text('email IS NOT NULL'),
        ),
        db.Index('users_coordinates_gix', 'coordinates', postgresql_using='gist'),
    )
