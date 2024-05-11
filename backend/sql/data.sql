INSERT INTO users (username, password) VALUES ('josh', 'asdf');

INSERT INTO contacts (user_id, fullname, location, emailaddress, phonenumber, userbio)
            VALUES (1, 'Alice Allison', 'San Francisco', 'alice@email.com', '123456789',
                    'Alice is a software engineer in the bay');
INSERT INTO contacts (user_id, fullname, location, emailaddress, phonenumber, userbio)
            VALUES (1, 'Bob Bobby', 'New York', 'bob@bobbymail.com', '987654321',
                    'Bob works in finance and enjoys baseball.');
INSERT INTO contacts (user_id, fullname, location, emailaddress, phonenumber, userbio)
            VALUES (1, 'Cam Smith', 'Chicago', 'cam@email.com', '555555555',
                    'Cam does contracting and plays a lot of baseball which he really likes');
INSERT INTO contacts (user_id, fullname, location, emailaddress, phonenumber, userbio)
            VALUES (1, 'Big Dawg', 'New York', 'big@dawg.com', '6666666666',
                    'Gig concert guitarist');