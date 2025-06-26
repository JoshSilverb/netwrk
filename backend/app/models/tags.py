from app.db.session import db

class TagLabel(db.Model):
    __tablename__ = "taglabels"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    label = db.Column(db.String(16), nullable=False)

    tags = db.relationship(
        "Tag",
        back_populates="tag_label",
        cascade="all, delete-orphan"
    )
    user = db.relationship(
        "User", 
        back_populates="tag_label",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        db.UniqueConstraint('user_id', 'label', name='uix_user_label'),
    )


class Tag(db.Model):
    __tablename__ = "tags"
    
    contact_id = db.Column(db.Integer, db.ForeignKey("contacts.contact_id"), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey("taglabels.id"), primary_key=True)
    
    tag_label = db.relationship("TagLabel", back_populates="tags")
