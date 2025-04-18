INSERT INTO users (username, password) VALUES ('josh', '$2b$12$icpnD3q8iX3eQxXXBLcXa.8Su2FP3BEcBIW4t/PXY5TByaabExary');

INSERT INTO contacts (user_id, fullname, location, coordinates, userbio, metthrough, remind_in_weeks, remind_in_months) VALUES
(1, 'Alice Allison', 'San Francisco, CA, USA', ST_GeogFromText('SRID=4326;POINT(-122.4194 37.7749)'), 'Alice is a software engineer in the bay', 'met in college', 3, 0),
(1, 'Bob Bobby', 'New York, NY, USA', ST_GeogFromText('SRID=4326;POINT(-74.0060 40.7128)'), 'Bob works in finance and enjoys baseball.', 'met in college', 0, 1),
(1, 'Cam Smith', 'Chicago, IL, USA', ST_GeogFromText('SRID=4326;POINT(-87.6298 41.8781)'), 'Cam does contracting and plays a lot of baseball which he really likes', 'met in college', 2, 0),
(1, 'Big Dawg', 'New York, NY, USA', ST_GeogFromText('SRID=4326;POINT(-74.0060 40.7128)'), 'Gig concert guitarist', 'met in college', 0, 12),
(1, 'David Daniels', 'Los Angeles, CA, USA', ST_GeogFromText('SRID=4326;POINT(-118.2437 34.0522)'), 'David is a filmmaker and loves surfing.', 'met in college', 0, 3),
(1, 'Evelyn Edwards', 'Miami, FL, USA', ST_GeogFromText('SRID=4326;POINT(-80.1918 25.7617)'), 'Evelyn is a marine biologist who enjoys scuba diving.', 'met in college', 0, 3),
(1, 'Frank Foster', 'Austin, TX, USA', ST_GeogFromText('SRID=4326;POINT(-97.7431 30.2672)'), 'Frank is a musician and a BBQ enthusiast.', 'met in college', 0, 3),
(1, 'Grace Green', 'Seattle, WA, USA', ST_GeogFromText('SRID=4326;POINT(-122.3321 47.6062)'), 'Grace is a software developer and an avid hiker.', 'met in college', 2, 0),
(1, 'Henry Hughes', 'Boston, MA, USA', ST_GeogFromText('SRID=4326;POINT(-71.0589 42.3601)'), 'Henry is a historian who enjoys reading and writing.', 'met in college', 0, 18),
(1, 'Ivy Ingram', 'Denver, CO, USA', ST_GeogFromText('SRID=4326;POINT(-104.9903 39.7392)'), 'Ivy is a graphic designer who loves skiing.', 'met in college', 0, 12),
(1, 'Jack Johnson', 'Portland, OR, USA', ST_GeogFromText('SRID=4326;POINT(-122.6765 45.5152)'), 'Jack is a photographer and a nature enthusiast.', 'met in college', 0, 2),
(1, 'Katie King', 'San Diego, CA, USA', ST_GeogFromText('SRID=4326;POINT(-117.1611 32.7157)'), 'Katie is a chef who loves to explore new cuisines.', 'met in college', 0, 0),
(1, 'Leo Lewis', 'Las Vegas, NV, USA', ST_GeogFromText('SRID=4326;POINT(-115.1398 36.1699)'), 'Leo is a casino manager who enjoys poker and gaming.', 'met in college', 0, 6),
(1, 'Mia Martinez', 'Phoenix, AZ, USA', ST_GeogFromText('SRID=4326;POINT(-112.0740 33.4484)'), 'Mia is a teacher who loves to paint and draw.', 'met in college', 0, 3),
(1, 'Nina Nelson', 'Dallas, TX, USA', ST_GeogFromText('SRID=4326;POINT(-96.7970 32.7767)'), 'Nina is a marketing professional who enjoys yoga and meditation.', 'met in college', 0, 4);

INSERT INTO sociallabels (label) VALUES
('Email Address'),
('Phone Number'),
('LinkedIn'),
('Instagram');

INSERT INTO socials (contact_id, social_id, address) VALUES
(1, 1, 'alice@email.com'),
(1, 2, '123456789'),
(2, 1, 'bob@bobbymail.com'),
(2, 2, '987654321'),
(3, 1, 'cam@email.com'),
(3, 2, '6666666666'),
(4, 1, 'big@dawg.com'),
(4, 2, '555555555'),
(5, 1, 'david.daniels@mail.com'),
(5, 2, '7777777777'),
(6, 1, 'evelyn.edwards@mail.com'),
(6, 2, '8888888888'),
(7, 1, 'frank.foster@mail.com'),
(7, 2, '9999999999'),
(8, 1, 'grace.green@mail.com'),
(8, 2, '1111111111'),
(9, 1, 'henry.hughes@mail.com'),
(9, 2, '2222222222'),
(10, 1, 'ivy.ingram@mail.com'),
(10, 2, '3333333333'),
(11, 1, 'jack.johnson@mail.com'),
(11, 2, '4444444444'),
(12, 1, 'katie.king@mail.com'),
(12, 2, '5555555555'),
(13, 1, 'leo.lewis@mail.com'),
(13, 2, '6666666666'),
(14, 1, 'mia.martinez@mail.com'),
(14, 2, '7777777777'),
(15, 1, 'nina.nelson@mail.com'),
(15, 2, '8888888888');

INSERT INTO taglabels (user_id, label) VALUES
(1, 'Friends'),
(1, 'Work');

INSERT INTO tags (contact_id, tag_id) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1),
(8, 1),
(9, 2),
(10, 2),
(11, 2),
(12, 2),
(13, 2),
(14, 2),
(15, 2);
