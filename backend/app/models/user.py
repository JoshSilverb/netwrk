import uuid as _uuid
from app.db.session import db
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography

class User(db.Model):
    __tablename__ = "users"

    user_id   = db.Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    user_token = db.Column(db.String(33))
    username  = db.Column(db.String(128), nullable=False, unique=True)
    fullname  = db.Column(db.String(128), nullable=False)
    email     = db.Column(db.String(256), nullable=True, unique=True)
    password  = db.Column(db.Text, nullable=False)
    num_contacts = db.Column(db.Integer, default=0)
    bio       = db.Column(db.Text)
    profile_pic_object_name = db.Column(db.String(128))
    location  = db.Column(db.String(128))
    is_public   = db.Column(db.Boolean, nullable=False, default=False)
    coordinates = db.Column(Geography(geometry_type='POINT', srid=4326))

    contacts = db.relationship("Contact",
                               back_populates="user",
                               foreign_keys="Contact.user_id",
                               cascade="all, delete-orphan")

    tag_label = db.relationship("TagLabel",
                                back_populates="user",
                                cascade="all, delete-orphan")
