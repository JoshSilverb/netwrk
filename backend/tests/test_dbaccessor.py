from lambda.database_accessor import get_contacts_for_user
import logging
# import pytest

logger = logging.getLogger(__name__)



def test_get_contacts(populate_database, db_accessor_fake_embedder):
    contacts = db_accessor_fake_embedder.get_contacts(1, '')
    logger.debug(f"Retrieved contacts for test: {contacts}")
    assert len(contacts) == 2
    assert contacts[0]['fullname'] == 'Alice A'
    assert contacts[1]['fullname'] == 'Bob B'


# def test_add_contact(db_accessor_fake_embedder, clear_database):
#     db_accessor_fake_embedder.add_contact(2, 
#                                           "testcontact", 
#                                           "location1", 
#                                           "me@email.com", 
#                                           "123456789", 
#                                           "Test user")
    
#     cur = model.get_db()
#     cur.execute("""
#         SELECT * FROM contacts 
#         WHERE creator_id=%s 
#               fullname=%s
#               location=%s
#               emailaddress=%s
#               phonenumber=%s
#               userbio=%s
#     """, (2, "testcontact", "location1", "me@email.com", "123456789", "Test user"))
#     contacts = cur.fetchall()

#     assert len(contacts) == 1
#     assert contacts[0]['fullname'] == "testcontact"

