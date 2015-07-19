CREATE TABLE album (
  id serial primary key,
  description varchar(255)
);

CREATE TABLE photo (
  id serial primary key,
  album_id integer,
  description varchar(255),
  filepath varchar(255)
);

CREATE TABLE users (
    u_id serial primary key,
    name text,
    email text,
    password text
);
