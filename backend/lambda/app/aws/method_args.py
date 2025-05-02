


from typing import TypedDict
from datetime import date

class RouteKey(TypedDict):
    method: str
    path: str


class Social(TypedDict):
    address: str
    label:   str


class GetContactByIdArgs(TypedDict):
    user_token: str
    contact_id: int


class SearchContactsArgs(TypedDict):
    user_token:        str
    query_string:      str 
    order_by:          str # this should probably come from an enum later
    tags:              list[str]
    lower_bound_date:  date  | None
    upper_bound_date:  date  | None
    user_latitude:     float | None
    user_longitude:    float | None


class AddNewContactArgs(TypedDict):
    user_token:             str
    fullname:               str
    location:               str
    user_bio:               str
    last_contact:           date
    met_through:            str
    socials:                list[Social]
    reminder_period_weeks:   int
    reminder_period_months: int
    tags:                   list[str]


class RemoveContactArgs(TypedDict):
    user_token: str
    contact_id: int


class UpdateContactArgs(TypedDict):
    user_token:             str
    contact_id:             int
    fullname:               str
    location:               str
    user_bio:               str
    last_contact:           date
    met_through:            str
    socials:                list[Social]
    reminder_period_days:   int
    reminder_period_months: int
    tags:                   list[str]

class GetTagsForUserArgs(TypedDict):
    user_token: str


class StoreUserCredentialsArgs(TypedDict):
    username: str
    password: str

class ValidateUserCredentialsArgs(TypedDict):
    username: str
    password: str


class DeleteUserArgs(TypedDict):
    user_token: str


class GetUserDetailsArgs(TypedDict):
    user_token: str
