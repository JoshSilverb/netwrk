// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.

export const BackendUrl = 'http://127.0.0.1:8000/'
export const Months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type Contact = {
  id: number;
  fullname: string;
  location: string;
  emailaddress: string;
  phonenumber: string;
  userbio: string;
}

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};
