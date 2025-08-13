from app.db.session import db

class SocialLabel(db.Model):
    __tablename__ = "sociallabels"

    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(16), unique=True)

    socials = db.relationship(
        "Social",
        back_populates="social_label",
        cascade="all, delete-orphan"
    )


class Social(db.Model):
    __tablename__ = "socials"
    
    contact_id = db.Column(
        db.Integer,
        db.ForeignKey("contacts.contact_id", ondelete="CASCADE"),
        primary_key=True
    )
    social_id = db.Column(
        db.Integer,
        db.ForeignKey("sociallabels.id", ondelete="CASCADE"),
        primary_key=True
    )
    address = db.Column(db.String(64))

    # Backref to SocialLabel
    social_label = db.relationship("SocialLabel", back_populates="socials")
