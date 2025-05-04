
class User:
    username:     str
    password:     str
    num_contacts: int | None

    def __init__(self, username_, password_, num_contacts_):
        self.username = username_
        self.password = password_
        self.num_contacts = num_contacts_