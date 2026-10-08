from app.db.session import db
from sqlalchemy.dialects.postgresql import UUID

class TagLabel(db.Model):
    __tablename__ = "taglabels"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )
    label = db.Column(db.String(16), nullable=False)

    tags = db.relationship(
        "Tag",
        back_populates="tag_label",
        cascade="all, delete-orphan"
    )
    user = db.relationship("User", back_populates="tag_label")

    __table_args__ = (
        db.UniqueConstraint('user_id', 'label', name='taglabels_user_id_label_key'),
    )


class Tag(db.Model):
    __tablename__ = "tags"

    # Prod has no primary key on this table, only UNIQUE (contact_id, tag_id).
    # The ORM needs an identity, so the pair is declared as the primary key here.
    contact_id = db.Column(
        db.Integer,
        db.ForeignKey("contacts.contact_id", ondelete="CASCADE"),
        primary_key=True
    )
    tag_id = db.Column(
        db.Integer,
        db.ForeignKey("taglabels.id", ondelete="CASCADE"),
        primary_key=True
    )

    tag_label = db.relationship("TagLabel", back_populates="tags")
