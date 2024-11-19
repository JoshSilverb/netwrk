from db_accessor import Db_config, \
                        get_contacts_for_user, \
                        add_contact_for_user, \
                        get_contact_by_id, \
                        remove_contact_for_user


def test_get_contacts():
    config = Db_config(db_host="localhost", 
                        db_name="netwrk",
                        db_user="testuser",
                        db_pwd="test",
                        db_port="5432")

    error, contacts = get_contacts_for_user("josh", config)

    if error:
        print(error)
    print(contacts)

    assert contacts[0]['fullname'] == 'Alice Allison'

def test_get_contact_by_id():
    config = Db_config(db_host="localhost", 
                       db_name="netwrk",
                       db_user="testuser",
                       db_pwd="test",
                       db_port="5432")

    username = "josh"
    contact_id = 1

    error, contact = get_contact_by_id(username, contact_id, config)
    
    if error:
        print(error)
        exit(1)
    print(contact)

    assert contact["fullname"] == "Alice Allison"


def test_add_delete_contact():
    config = Db_config(db_host="localhost", 
                        db_name="netwrk",
                        db_user="testuser",
                        db_pwd="test",
                        db_port="5432")
    
    error, contacts = get_contacts_for_user("josh", config)
    num_contacts_initial = len(contacts)
    print("Inital number of contacts:", num_contacts_initial)
    
    contact = {"user_id": 1, "fullname": "testperson", "location": "testlocaysh", "emailaddress": "test@email.com", "phonenumber": 000000000, "userbio": "testbio"}
    success, message = add_contact_for_user("josh", contact, config)

    if not success:
        print("Add contact failed with message:", message)
    
    assert success

    contact_id = message
    print("ID of new contact:", contact_id)
    
    error, contacts = get_contacts_for_user("josh", config)
    num_contacts_middle = len(contacts)
    print("Number of contacts after adding a contact:", num_contacts_middle)

    assert num_contacts_middle == num_contacts_initial + 1

    result, success = remove_contact_for_user("josh", contact_id, config)

    if not success:
        print(result)

    assert result == 1

    error, contacts = get_contacts_for_user("josh", config)
    num_contacts_final = len(contacts)
    print("Number of contacts after deleting added contact:", num_contacts_final)
    assert num_contacts_final == num_contacts_initial



if __name__ == "__main__":
    test_get_contacts()
    test_get_contact_by_id()
    test_add_delete_contact()