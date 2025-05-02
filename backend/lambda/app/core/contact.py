from datetime import date

class Contact:
    contact_id: int
    user_id:    int
    fullname:   str
    location:   str
    coordinates: tuple[float, float]
    met_through: str
    user_bio:    str
    last_contact: date
    remind_in_weeks: int
    remind_in_months: int
    nextcontact:  date
