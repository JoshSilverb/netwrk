from app.models.contact import Contact
from app.models.user import User
from app.models.socials import Social, SocialLabel
from app.models.tags import Tag, TagLabel

from sqlalchemy import insert, func, select, and_, or_, text, update
from sqlalchemy.orm import joinedload
from app.db.session import db
from geoalchemy2 import Geography
from dateutil.relativedelta import relativedelta
from sqlalchemy.exc import IntegrityError
from datetime import date
from enum import Enum

import bcrypt
import uuid
import logging

logger = logging.getLogger(__name__)


class SortOptions(Enum):
    DATE_ADDED = 'Date added'
    LAST_CONTACT_NEWEST = 'Last contacted (newest)'
    LAST_CONTACT_OLDEST = 'Last contacted (oldest)'
    ALPHABETICAL = 'Alphabetical'
    DISTANCE = 'Distance'
    RELEVANCE = 'Relevance'
    NEXT_CONTACT_DATE = 'Next contact date'
    

def get_sort_option(value: str) -> SortOptions | None:
    """Return an enum option from 'SortOptions' whose value matches that of the 
    specified 'value', or return 'none' if 'value' is not in 'SortOptions'."""

    for opt in SortOptions:
        if opt.value == value:
            return opt
    return None


def get_contact_by_id(
    user_token: str,
    contact_id: int
):
    """
    Search the database for the details of the contact with the contact ID 
        given in the args
    Returns:
        A dict representing a contact from the database, with keys equal to 
            the columns of the database
    """
    
    # Step 1: Verify user exists and owns the contact
    contact = (
        db.session.query(Contact)
        .join(User)
        .filter(and_(
            User.user_token == user_token,
            Contact.contact_id == contact_id
        ))
        .options(
            joinedload(Contact.socials).joinedload(Social.social_label),
            joinedload(Contact.tags).joinedload(Tag.tag_label)
        )
        .first()
    )

    if not contact:
        return []

    # Step 2: Build contact dict
    contact_dict = {
        "contact_id": contact.contact_id,
        "fullname": contact.fullname,
        "location": contact.location,
        "metthrough": contact.metthrough,
        "userbio": contact.userbio,
        "lastcontact": contact.lastcontact.strftime('%d %b, %Y') if contact.lastcontact else None,
        "remind_in_weeks": contact.remind_in_weeks,
        "remind_in_months": contact.remind_in_months,
        "profile_pic_object_name": contact.profile_pic_object_name if contact.profile_pic_object_name else "",
    }

    # Step 3: Handle nextcontact
    if contact.nextcontact:
        contact_dict["nextcontact"] = contact.nextcontact.strftime('%d %b, %Y')
    else:
        contact_dict["nextcontact"] = None

    # Step 4: Get socials
    contact_dict["socials"] = [
        {
            "label": social.social_label.label,
            "address": social.address
        }
        for social in contact.socials
    ]

    # Step 5: Get tags
    contact_dict["tags"] = [tag.tag_label.label for tag in contact.tags]

    return contact_dict

def add_contact(
    user_token: str,
    fullname: str,
    location: str | None,
    coordinate: dict | None,  # Optional: expects {'lng': float, 'lat': float}
    met_through: str | None,
    user_bio: str | None,
    last_contact: date | None,
    reminder_period_weeks: int | None,
    reminder_period_months: int | None,
    embedding_vector: list[float],
    socials: list[dict] | None,
    tags: list[str] | None,
    image_object_key: str | None = None
) -> int:
    """
    Add the contact defined by the given args to the database
    Returns:
        The contact ID of the newly added contact as an int
    """

    # Step 1: Look up user_id from user_token
    user = db.session.query(User).where(User.user_token == user_token).first()
    
    if user is None:
        raise ValueError("Invalid user_token — user not found.")

    # Prepare coordinate field
    if coordinate and "lng" in coordinate and "lat" in coordinate:
        point_wkt = f'SRID=4326;POINT({coordinate["lng"]} {coordinate["lat"]})'
        geo_point = func.ST_GeogFromText(point_wkt)
    else:
        geo_point = None  # Will be inserted as NULL in the DB

    # Prepare nextcontact field
    if (not reminder_period_months and not reminder_period_weeks) or not last_contact:
        next_contact = None
    else:
        reminderPeriod_days = reminder_period_weeks * 7 if reminder_period_weeks else 0
        reminderPeriod_months = reminder_period_months if reminder_period_months else 0
        next_contact = last_contact + relativedelta(months=+reminderPeriod_months, days=+reminderPeriod_days)


    # Insert new contact
    stmt = (
        insert(Contact)
        .values(
            user_id=user.user_id,
            fullname=fullname,
            location=location,
            coordinates=geo_point,
            metthrough=met_through,
            userbio=user_bio,
            lastcontact=last_contact,
            remind_in_weeks=reminder_period_weeks,
            remind_in_months=reminder_period_months,
            nextcontact=next_contact,
            embedding=embedding_vector,
            profile_pic_object_name=image_object_key,
        )
        .returning(Contact.contact_id)
    )

    result = db.session.execute(stmt)
    new_contact_id = result.scalar_one()
    
    logger.info("Successfully inserted new contact")

    # Insert socials

    if socials:
        social_labels = [s["label"] for s in socials]
        addresses = [s["address"] for s in socials]

        # Step 1: Query existing social labels
        existing_labels = (
            db.session.query(SocialLabel)
            .filter(SocialLabel.label.in_(social_labels))
            .all()
        )
        existing_label_map = {label.label: label.id for label in existing_labels}

        # Step 2: Insert missing labels
        new_labels = [
            SocialLabel(label=label)
            for label in social_labels
            if label not in existing_label_map
        ]
        db.session.add_all(new_labels)
        db.session.flush()  # assign IDs without committing

        # Update label map with newly inserted IDs
        for label in new_labels:
            existing_label_map[label.label] = label.id

        # Step 3: Insert into socials table
        social_entries = [
            Social(
                contact_id=new_contact_id,
                social_id=existing_label_map[s["label"]],
                address=s["address"],
            )
            for s in socials
        ]
        db.session.add_all(social_entries)

    if tags:
        # Step 1: Query existing tags for this user
        existing_tags = (
            db.session.query(TagLabel)
            .filter(
                TagLabel.user_id == user.user_id,
                TagLabel.label.in_(tags)
            )
            .all()
        )
        existing_tag_map = {tag.label: tag.id for tag in existing_tags}

        # Step 2: Insert missing taglabels
        new_taglabels = [
            TagLabel(user_id=user.user_id, label=label)
            for label in tags
            if label not in existing_tag_map
        ]
        db.session.add_all(new_taglabels)
        db.session.flush()  # Assign IDs for new taglabels

        # Update map with newly inserted tags
        for taglabel in new_taglabels:
            existing_tag_map[taglabel.label] = taglabel.id

        # Step 3: Insert into tags table
        tag_entries = [
            Tag(contact_id=new_contact_id, tag_id=existing_tag_map[label])
            for label in tags
        ]
        db.session.add_all(tag_entries)

    # Increment user's num_contacts

    user.num_contacts = user.num_contacts + 1

    db.session.commit()

    return new_contact_id


def delete_contact(user_token: str, contact_id: int):
    """
    Remove the contact defined by the given args from the database
    Returns:
        none
    """

    # Look up user by token and join with contact to verify ownership
    user = db.session.query(User).options(joinedload(User.contacts)).filter_by(user_token=user_token).first()

    if not user:
        raise Exception(f"Unable to remove contact - invalid user_token {user_token}")

    # Find the contact that matches both contact_id and belongs to the user
    contact = next((c for c in user.contacts if c.contact_id == contact_id), None)

    if not contact:
        raise Exception(f"Unable to remove contact - no contact with ID '{contact_id}' for user_token {user_token}")

    # Delete the contact
    db.session.delete(contact)
    db.session.flush()  # flush to ensure delete is counted before updating user

    # Update user's num_contacts
    user.num_contacts = user.num_contacts - 1

    # Commit the changes
    db.session.commit()


def update_contact(
    user_token: str,
    contact_id: int,
    fullname: str,
    location: str | None,
    coordinate: dict | None,  # Optional: expects {'lng': float, 'lat': float}
    met_through: str | None,
    user_bio: str | None,
    last_contact: date | None,  
    reminder_period_weeks: int | None,
    reminder_period_months: int | None,
    embedding_vector: list[float],
    socials: list[dict] | None,
    tags: list[str] | None,
    image_object_key: str | None = None
):
    """
    Add the contact defined by the given args to the database
    Returns:
        The contact ID of the updated contact as an int
    """
    # 1. Get the user
    user = db.session.query(User).filter_by(user_token=user_token).first()
    if not user:
        raise Exception(f"Invalid user_token: {user_token}")

    # 2. Get the contact, make sure it belongs to the user
    contact = db.session.query(Contact).filter_by(contact_id=contact_id, user_id=user.user_id).first()
    if not contact:
        raise Exception(f"No contact with ID {contact_id} found for user")

    # 3. Update fields on the contact
    contact.fullname = fullname
    contact.location = location
    contact.metthrough = met_through
    contact.userbio = user_bio
    contact.lastcontact = last_contact
    contact.remind_in_weeks = reminder_period_weeks
    contact.remind_in_months = reminder_period_months
    contact.embedding = embedding_vector


    # Prepare nextcontact field

    if (not reminder_period_months and not reminder_period_weeks) or not last_contact:
        contact.nextcontact = None
    else:
        reminderPeriod_days = reminder_period_weeks * 7 if reminder_period_weeks else 0
        reminderPeriod_months = reminder_period_months if reminder_period_months else 0
        contact.nextcontact = last_contact + relativedelta(months=+reminderPeriod_months, days=+reminderPeriod_days)

    logger.info(f"Contact's next contact date set to {contact.nextcontact}")
    
    # Only update profile picture if a new one is provided
    if image_object_key:
        contact.profile_pic_object_name = image_object_key

    # Coordinate update (assuming PostGIS or JSON field)
    if coordinate:
        contact.longitude = coordinate.get('lng')
        contact.latitude = coordinate.get('lat')
    else:
        contact.longitude = None
        contact.latitude = None

    # 4. Update socials
    if socials is not None:
        # Clear existing socials
        db.session.query(Social).filter_by(contact_id=contact_id).delete()

        for social_dict in socials:
            label_name = social_dict["label"]
            address = social_dict["address"]

            # Get or create social label
            social_label = db.session.query(SocialLabel).filter_by(label=label_name).first()
            if not social_label:
                social_label = SocialLabel(label=label_name)
                db.session.add(social_label)
                db.session.flush()  # ensure ID is available

            # Add new social entry
            new_social = Social(
                contact_id=contact_id,
                social_id=social_label.id,
                address=address
            )
            db.session.add(new_social)

    # 5. Update tags
    if tags is not None:
        # Clear existing tags
        db.session.query(Tag).filter_by(contact_id=contact_id).delete()

        for tag_name in tags:
            # Get or create tag label
            tag_label = db.session.query(TagLabel).filter_by(label=tag_name).first()
            if not tag_label:
                tag_label = TagLabel(user_id=user.user_id, label=tag_name)
                db.session.add(tag_label)
                db.session.flush()

            # Add tag association
            tag = Tag(contact_id=contact_id, tag_id=tag_label.id)
            db.session.add(tag)

    # 6. Commit changes
    db.session.commit()
    return contact_id


def get_tags_for_user(user_token: str):
    """
    Get the tags associatd with the user with the user ID in the given args.
    Returns:
        The tags associated with the user with the user ID given in the args.
    """

    labels = db.session.query(TagLabel.label).join(User).filter(User.user_token == user_token).all()

    user_tags = [label[0] for label in labels]
    return user_tags


def create_user(username: str, password: str):
    """
    Store the user credentials defined in the given args, and generate and store a new user token.
    Returns:
        The new user token associated with this user.
    """
    # Check for existing user with the same username
    existing_user = db.session.query(User).filter_by(username=username).first()
    if existing_user:
        raise NameError("Username already taken")

    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    user_token = uuid.uuid4().hex.strip()

    # Create and add new user
    new_user = User(
        username=username,
        password=hashed_password.decode('utf-8'),
        user_token=user_token,
        num_contacts=0
    )

    db.session.add(new_user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise Exception("Failed to store user credentials due to DB integrity error.")

    logger.info(f"Successfully created user profile for username={username}")
    return user_token


def validate_user_credentials_and_regenerate_token(username: str, password: str):
    """
    Validate the user credentials defined in the given args against the stored credentials in the database, and generate and store a new user token.
    Returns:
        The new user token associated with this user.
    """
    # Fetch the user by username
    user = db.session.query(User).filter_by(username=username).first()
    if not user:
        logger.warning(f"Authentication failed: No user profile found for username={username}")
        raise NameError("Invalid credentials")

    # Check password
    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        logger.warning(f"Authentication failed: Incorrect password for username={username}")
        raise NameError("Invalid credentials")

    # Generate new token
    # new_user_token = uuid.uuid4().hex
    # user.user_token = new_user_token

    # Commit the update
    # db.session.commit()

    logger.info(f"Successfully authenticated user: {username}")
    return user.user_token


def validate_token(user_token: str):
    """
    Validate that the specified 'user_token' corresponds to a user in the database.
    Returns:
        A bool reflecting if the username/pwd are valid.
    """
    # Fetch the user by username
    user = db.session.query(User).filter_by(user_token=user_token).first()
    if not user:
        logger.warning(f"Authentication failed: No user profile found for user token={user_token}")
        return False

    logger.info(f"Successfully authenticated user with token: {user_token}")
    return True



def delete_user(user_token: str):
    """
    Delete the user associated with the user token defined in the given args.
    Returns:
        None.
    """
    user = db.session.query(User).filter_by(user_token=user_token).first()

    if not user:
        logger.warning(f"No profile found for user token: {user_token}")
        raise NameError("No profiles matching the specified user token")

    logger.info(f"Found user to delete: username={user.username}, user_token={user_token}")
    db.session.delete(user)
    db.session.commit()
    logger.info(f"Successfully deleted user: username={user.username}, user_token={user_token}")


def get_user_details(user_token: str):
    """
    Get the details of the user associated with the user token defined in the given args.
    Returns:
        The details of the specified user.
    """

    user = db.session.query(User).filter_by(user_token=user_token).first()

    if not user:
        logger.warning(f"No profile found for user token: {user_token}")
        raise NameError("No profiles matching the specified user token")

    user_dict = {
        "username": user.username,
        "num_contacts": user.num_contacts,
        "bio": user.bio if user.bio else "",
        "profile_pic_object_name": user.profile_pic_object_name if user.profile_pic_object_name else ""
    }

    return user_dict


def update_user_details(user_token: str, username: str, bio: str, profile_pic_object_name: str):
    
    """
    Add the specified 'username', 'bio' and 'profile_pic_object_name' to the 
    database entry  for the user with the specified 'user_token'.
    """

    logger.info(f"About to update user with token: '{user_token}' " + \
                 f"to have new username: '{username}' and bio: '{bio}'")

    user = db.session.query(User).filter_by(user_token=user_token).first()
    if not user:
        raise Exception(f"No user with token {user_token} found")
    
    users_with_username = db.session.query(User).filter_by(username=username).all()
    
    if (len(users_with_username) > 1) or (len(users_with_username) == 1 and users_with_username[0].user_token != user_token):
        raise Exception(f"Username already taken")

    logger.info(f"Got user with username: '{user.username}' and bio: '{user.bio}'")

    user.username = username
    user.bio = bio

    # Only set new profile pic object name if one is given.

    if profile_pic_object_name:
        user.profile_pic_object_name = profile_pic_object_name

    logger.info(f"Set user fields, now bio: '{user.bio}'")
    
    logger.info("Committing user profile update")
    
    db.session.commit()


def search_contacts_and_sort(
    user_token:        str,
    query_string:      str,
    embedding_string:  str | None,
    sort_option:       str, # this should probably come from an enum later
    tags:              list[str],
    lower_bound_date:  date  | None,
    upper_bound_date:  date  | None,
    user_latitude:     float | None,
    user_longitude:    float | None
):
    """
    Search the database for contacts matching the requirements in the given 
        args and sorted by the given sort operation.
    Returns:
        A list of contacts matching the given args
    """

    sort_option_enum = get_sort_option(sort_option)

    # Fallbacks for invalid sorting
    if sort_option_enum == SortOptions.RELEVANCE and not embedding_string:
        logger.error("Search failed: Cannot search by relevance without an embedding")
        sort_option_enum = SortOptions.DATE_ADDED

    if sort_option_enum == SortOptions.DISTANCE and (not user_latitude or not user_longitude):
        logger.error("Search failed: Cannot sort by distance without coordinates")
        sort_option_enum = SortOptions.DATE_ADDED

    # Base query
    query = (
        db.session.query(
            Contact.contact_id.label("contact_id"),
            Contact.fullname,
            Contact.location,
            func.ST_AsText(Contact.coordinates).label("coordinate"),
            Contact.userbio,
            Contact.profile_pic_object_name
        )
        .join(User, Contact.user_id == User.user_id)
        .filter(User.user_token == user_token)
        .filter(Contact.lastcontact >= lower_bound_date)
        .filter(Contact.lastcontact <= upper_bound_date)
    )

    # If sorting by relevance, ignore entries without embeddings
    if sort_option_enum == SortOptions.RELEVANCE:
        query = query.filter(Contact.embedding.isnot(None))

    # Add search filter if not sorting by relevance
    if sort_option_enum != SortOptions.RELEVANCE and query_string:
        like_term = f"%{query_string}%"
        query = query.filter(or_(
            Contact.userbio.ilike(like_term),
            Contact.fullname.ilike(like_term)
        ))

    # Add tag filter if needed
    if tags:
        query = query.join(Tag, Tag.contact_id == Contact.contact_id)
        query = query.join(TagLabel, Tag.tag_id == TagLabel.id)
        query = query.filter(TagLabel.label.in_(tags))

    logging.info(f"Embedding string: {embedding_string}")

    # Add ordering
    if sort_option_enum == SortOptions.DATE_ADDED:
        query = query.order_by(Contact.contact_id.desc())
    elif sort_option_enum == SortOptions.LAST_CONTACT_NEWEST:
        query = query.order_by(Contact.lastcontact.desc())
    elif sort_option_enum == SortOptions.LAST_CONTACT_OLDEST:
        query = query.order_by(Contact.lastcontact.asc())
    elif sort_option_enum == SortOptions.ALPHABETICAL:
        query = query.order_by(Contact.fullname.asc())
    elif sort_option_enum == SortOptions.DISTANCE:
        user_point = func.ST_MakePoint(user_longitude, user_latitude)
        query = query.order_by(Contact.coordinates.distance_centroid(user_point))
    elif sort_option_enum == SortOptions.RELEVANCE:
        vector_str = '[' + ','.join(map(str, embedding_string)) + ']'
        query = query.order_by(text(f"embedding <-> '{vector_str}'")).limit(15)
    elif sort_option_enum == SortOptions.NEXT_CONTACT_DATE:
        query = query.filter(Contact.nextcontact.isnot(None))
        query = query.order_by(Contact.nextcontact.asc())

    logger.info(f"Executing contact search - Sort: {sort_option_enum}, Query: '{query_string}'")
    logger.info(f"Generated SQL query:\n{str(query.statement.compile(compile_kwargs={'literal_binds': True}))}")

    contacts_raw = query.all()
    logger.info(f"Search completed: Found {len(contacts_raw)} contacts")

    contact_dicts = [dict(row._mapping) for row in contacts_raw]
    contact_ids = [c['contact_id'] for c in contact_dicts]

    if not contact_ids:
        return []

    # --- Fetch socials and attach to contacts ---
    socials_rows = (
        db.session.query(
            Social.contact_id,
            Social.address,
            SocialLabel.label
        )
        .join(SocialLabel, Social.social_id == SocialLabel.id)
        .filter(Social.contact_id.in_(contact_ids))
        .all()
    )

    # Group socials by contact_id
    socials_by_contact: dict[str, list[str]] = {}
    for s in socials_rows:
        socials_by_contact.setdefault(s.contact_id, []).append({
            'label': s.label,
            'address': s.address
        })

    # Attach socials to contact dicts
    for c in contact_dicts:
        c['socials'] = socials_by_contact.get(c['contact_id'], [])

    return contact_dicts

