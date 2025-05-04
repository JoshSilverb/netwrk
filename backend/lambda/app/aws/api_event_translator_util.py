"""api_event_translator_util.py"""

"""
@purpose: pulls relevant data out of API Gateway request events.
"""

import json
from app.aws import method_args
from datetime import date, datetime


class ApiEventTranslatorUtil:
    """
    Util class containing functions for pulling relevant data out of API 
    Gateway request events.
    """

    @staticmethod
    def extract_routeKey(event: dict) -> method_args.RouteKey:
        """
        Parse the specified 'event' dictionary for the request method and path.
        Args:
            event: dictionary representation of an API Gateway request event
        Returns:
            A RouteKey
        """

        route_key: list[str] = event['routeKey'].split(' ')
        request_method: str = route_key[0]
        request_path: str = route_key[1]

        return method_args.RouteKey(method=request_method, path=request_path)


    @staticmethod
    def extract_getContactByIdArgs(event: dict) -> method_args.GetContactByIdArgs:
        """
        Parse the specified 'event' dictionary for the details required for 
        getting a contact by its ID.
        Args:
            event: dictionary representation of an API Gateway request event
        Returns:
            GetContactByIdArgs
        """

        data = json.loads(event['body'])
        user_token: str = data['user_token']
        contact_id: int = int(data['contact_id'])

        return method_args.GetContactByIdArgs(user_token=user_token, contact_id=contact_id)
    

    @staticmethod
    def extract_searchContactsArgs(event: dict) -> method_args.SearchContactsArgs:
        """
        Parse the specified 'event' dictionary for the details required for 
        getting a contact by its ID.
        Args:
            event: dictionary representation of an API Gateway request event
        Returns:
            SearchContactsArgs
        """

        data = json.loads(event['body'])
        user_token: str = data['user_token']
        search_params: dict = data['search_params']

        query_string: str = search_params['query_string']
        order_by: str     = search_params['order_by']
        tags: list[str]   = search_params['tags']

        lower_bound_date_str  = search_params['lower_bound_date'].split('T')[0]
        upper_bound_date_str  = search_params['upper_bound_date'].split('T')[0]

        lower_bound_date = datetime.strptime(lower_bound_date_str, "%Y-%m-%d").date()
        upper_bound_date = datetime.strptime(upper_bound_date_str, "%Y-%m-%d").date()
        
        user_lat = search_params['user_lat'] if 'user_lat' in search_params else None
        user_lon = search_params['user_lon'] if 'user_lon' in search_params else None

        return method_args.SearchContactsArgs(user_token=user_token, \
                                              query_string=query_string, \
                                              order_by=order_by, \
                                              tags=tags, \
                                              lower_bound_date=lower_bound_date, \
                                              upper_bound_date=upper_bound_date, \
                                              user_latitude=user_lat, \
                                              user_longitude=user_lon)


    @staticmethod
    def extract_addNewContactArgs(event: dict) -> method_args.AddNewContactArgs:
        """
        Parse the specified 'event' dictionary for the details required for 
        adding a new contact.
        Args:
            event: dictionary representation of an API Gateway request event
        Returns:
            AddNewContactArgs
        """

        data = json.loads(event['body'])
        newcontact: dict = data['newContact']

        user_token: str = data['user_token']
        fullname: str = newcontact['fullname']
        location: str = newcontact['location']
        userbio: str = newcontact['userbio']
        metthrough: str = newcontact['metthrough']
        socials: list[method_args.Social] = newcontact['socials']

        lastcontact_str  = newcontact['lastcontact'].split('T')[0]
        lastcontact = datetime.strptime(lastcontact_str, "%Y-%M-%d").date()
        
        tags: list[str] = newcontact['tags']
        reminder_weeks: int = int(newcontact['reminderPeriod']['weeks'])
        reminder_months: int = int(newcontact['reminderPeriod']['months'])

        return method_args.AddNewContactArgs(user_token=user_token, \
                                            fullname=fullname, \
                                            location=location, \
                                            user_bio=userbio, \
                                            met_through=metthrough, \
                                            socials=socials, \
                                            last_contact=lastcontact, \
                                            tags=tags, \
                                            reminder_period_weeks=reminder_weeks, \
                                            reminder_period_months=reminder_months)


    @staticmethod
    def extract_removeContactArgs(event: dict) -> method_args.RemoveContactArgs:
        """
        Parse the specified 'event' dictionary for the details required for 
        removing a contact.
        Args:
            event: dictionary representation of an API Gateway request event
        Returns:
            RemoveContactArgs
        """

        data = json.loads(event['body'])
        user_token: str = data['user_token']
        contact_id: int = int(data['contactId'])

        return method_args.RemoveContactArgs(user_token=user_token, contact_id=contact_id)


    @staticmethod
    def extract_updateContactArgs(event: dict) -> method_args.UpdateContactArgs:
        """
        Parse the specified 'event' dictionary for the details required for 
        updating a specific contact.
        Args:
            event: dictionary representation of an API Gateway request event
        Returns:
            UpdateContactArgs
        """

        data = json.loads(event['body'])
        newcontact: dict = data['newContact']

        user_token: str = data['user_token']
        contact_id: int = newcontact['contact_id']
        fullname: str = newcontact['fullname']
        location: str = newcontact['location']
        userbio: str = newcontact['userbio']
        metthrough: str = newcontact['metthrough']
        socials: list[method_args.Social] = newcontact['socials']

        lastcontact_str  = newcontact['lastcontact'].split('T')[0]
        lastcontact = datetime.strptime(lastcontact_str, "%Y-%M-%d").date()
        
        tags: list[str] = newcontact['tags']
        reminder_weeks: int = int(newcontact['reminderPeriod']['weeks'])
        reminder_months: int = int(newcontact['reminderPeriod']['months'])

        return method_args.UpdateContactArgs(user_token=user_token, \
                                            contact_id=contact_id, \
                                            fullname=fullname, \
                                            location=location, \
                                            user_bio=userbio, \
                                            met_through=metthrough, \
                                            socials=socials, \
                                            last_contact=lastcontact, \
                                            tags=tags, \
                                            reminder_period_weeks=reminder_weeks, \
                                            reminder_period_months=reminder_months)


    @staticmethod
    def extract_getTagsForUserArgs(event: dict) -> method_args.GetTagsForUserArgs:
        """
        Parse the specified 'event' dictionary for the details required for 
        getting tags associated with a user.
        Args:
            event: dictionary representation of an API Gateway request event
        Returns:
            GetTagsForUserArgs
        """

        data = json.loads(event['body'])
        user_token: str = data['user_token']

        return method_args.GetTagsForUserArgs(user_token=user_token)
    

    @staticmethod
    def extract_storeUserCredentialsArgs(event: dict) -> method_args.StoreUserCredentialsArgs:
        """
        Parse the specified 'event' dictionary for the details required for 
        storing a new user's credentials.
        Args:
            event: dictionary representation of an API Gateway request event
        Returns:
            StoreUserCredentialsArgs
        """

        data = json.loads(event['body'])
        username: str = data['username']
        password: str = data['password']

        return method_args.StoreUserCredentialsArgs(username=username, password=password)


    @staticmethod
    def extract_validateUserCredentialsArgs(event: dict) -> method_args.ValidateUserCredentialsArgs:
        """
        Parse the specified 'event' dictionary for the details required for 
        validating a user's credentials.
        Args:
            event: dictionary representation of an API Gateway request event
        Returns:
            ValidateUserCredentialsArgs
        """

        data = json.loads(event['body'])
        username: str = data['username']
        password: str = data['password']

        return method_args.ValidateUserCredentialsArgs(username=username, password=password)


    @staticmethod
    def extract_deleteUserArgs(event: dict) -> method_args.DeleteUserArgs:
        """
        Parse the specified 'event' dictionary for the details required for 
        deleting a user.
        Args:
            event: dictionary representation of an API Gateway request event
        Returns:
            DeleteUserArgs
        """

        data = json.loads(event['body'])
        user_token: str = data['user_token']

        return method_args.DeleteUserArgs(user_token=user_token)
    

    @staticmethod
    def extract_getUserDetailsArgs(event: dict) -> method_args.GetUserDetailsArgs:
        """
        Parse the specified 'event' dictionary for the details required for 
        getting a specific user's details.
        Args:
            event: dictionary representation of an API Gateway request event
        Returns:
            GetUserDetailsArgs
        """

        data = json.loads(event['body'])
        user_token: str = data['user_token']

        return method_args.GetUserDetailsArgs(user_token=user_token)
    