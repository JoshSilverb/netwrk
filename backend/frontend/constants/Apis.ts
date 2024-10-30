// This file contains URLs for APIs used in this app

const baseURL = 'https://x8bhwx3sva.execute-api.us-east-2.amazonaws.com';
const tier = '/default';
export const getContactsForUserURL   = baseURL + tier + '/getContactsForUser';
export const addContactForUserURL    = baseURL + tier + '/addContactForUser';
export const getContactByIdURL       = baseURL + tier + '/getContact';
export const removeContactForUserURL =  baseURL + tier + '/removeContactForUser';