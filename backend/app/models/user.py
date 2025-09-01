from app.db.session import db

class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True, unique=True)
    user_token = db.Column(db.String(33))
    username = db.Column(db.String(128), nullable=False)
    password = db.Column(db.Text, nullable=False)
    num_contacts = db.Column(db.Integer, default=0)
    bio = db.Column(db.Text)
    profile_pic_object_name = db.Column(db.String(128))

    contacts = db.relationship("Contact", 
                               back_populates="user", 
                               cascade="all, delete-orphan")

    tag_label = db.relationship("TagLabel",
                                 back_populates="user",
                                 cascade="all, delete-orphan")