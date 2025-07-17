// This file contains URLs for APIs used in this app

const baseURL = 'https://netwrk-env.eba-megsk2ie.us-east-2.elasticbeanstalk.com';
const tier = '';
export const addContactForUserURL       = baseURL + tier + '/addContactForUser';
export const getContactByIdURL          = baseURL + tier + '/getContactById';
export const removeContactForUserURL    = baseURL + tier + '/removeContactForUser';
export const updateContactForUserURL    = baseURL + tier + '/updateContactForUser';
export const validateUserCredentialsURL = baseURL + tier + '/validateUserCredentials';
export const storeUserCredentialsURL    = baseURL + tier + '/storeUserCredentials';
export const deleteUserURL              = baseURL + tier + '/deleteUser';
export const searchContactsURL          = baseURL + tier + '/searchContacts';
export const getUserDetailsURL          = baseURL + tier + '/getUserDetails';
export const getTagsForUserURL          = baseURL + tier + '/getTagsForUser';
