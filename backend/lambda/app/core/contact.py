from datetime import date

class Contact:
    contact_id: int | None
    user_id:    int | None
    fullname:   str | None
    location:   str | None
    coordinates: tuple[float, float] | None
    met_through: str | None
    user_bio:    str | None
    last_contact: date | None
    remind_in_weeks: int | None
    remind_in_months: int | None
    nextcontact:  date | None

    def __init__(self, 
                 contact_id_: int | None, \
                 user_id_:    int | None, \
                 fullname_:   str | None, \
                 location_:   str | None, \
                 coordinates_: tuple[float, float] | None, \
                 met_through_: str | None, \
                 user_bio_:    str | None, \
                 last_contact_: date | None, \
                 remind_in_weeks_: int | None, \
                 remind_in_months_: int | None, \
                 nextcontact_:  date | None):
        self.contact_id = contact_id_
        self.user_id = user_id_
        self.fullname = fullname_
        self.location = location_
        self.coordinates = coordinates_
        self.met_through = met_through_
        self.user_bio = user_bio_
        self.last_contact = last_contact_
        self.remind_in_weeks = remind_in_weeks_
        self.remind_in_months = remind_in_months_
        self.nextcontact = nextcontact_