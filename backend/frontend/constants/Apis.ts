// This file contains URLs for APIs used in this app

const baseURL = 'https://x8bhwx3sva.execute-api.us-east-2.amazonaws.com';
const tier = '/default';
export const getContactsForUserURL   = baseURL + tier + '/getContactsForUser';
export const addContactForUserURL    = baseURL + tier + '/addContactForUser';
export const getContactByIdURL       = baseURL + tier + '/getContactById';
export const removeContactForUserURL =  baseURL + tier + '/removeContactForUser';
export const updateContactForUserURL =  baseURL + tier + '/updateContactForUser';
export const validateUserCredentialsURL =  baseURL + tier + '/validateUserCredentials';
export const storeUserCredentialsURL =  baseURL + tier + '/storeUserCredentials';
export const deleteUserURL =  baseURL + tier + '/deleteUser';
