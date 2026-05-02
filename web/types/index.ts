export interface Social {
  label: string;
  address: string;
}

export interface Contact {
  contact_id: number;
  fullname: string;
  location: string;
  metthrough: string;
  userbio: string;
  lastcontact: string | null;   // returned as "DD Mon, YYYY"
  nextcontact: string | null;   // returned as "DD Mon, YYYY"
  remind_in_weeks: number | null;
  remind_in_months: number | null;
  profile_pic_object_name: string;
  profile_pic_url?: string;
  socials: Social[];
  tags: string[];
  coordinate?: string | null; // WKT format: "POINT(lng lat)"
}

export interface User {
  username: string;
  bio: string;
  location: string;
  num_contacts: number;
  profile_pic_object_name: string;
  profile_pic_url?: string;
}

// Shape sent to backend when creating/updating a contact
export interface ContactPayload {
  fullname: string;
  location: string;
  userbio: string;
  metthrough: string;
  socials: Social[];
  lastcontact: string;          // "YYYY-MM-DD"
  tags: string[];
  reminderPeriod: {
    weeks: number | null;
    months: number | null;
  };
  image_object_key?: string;
}
