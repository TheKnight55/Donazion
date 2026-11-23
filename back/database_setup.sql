DROP DATABASE IF EXISTS donazion;
CREATE DATABASE donazion;
USE donazion;

drop table if exists inventory;
drop table if exists wishlist;
drop table if exists category_item;
drop table if exists category;
drop table if exists location;
drop table if exists donation_center;
drop table if exists organization_login;

create table organization_login ( -- There is only 1 organization with 1 login
    email varchar(50),
    password varchar(60) NOT NULL, -- For every password, I made the max length 60 characters
    -- Idk if that will be enough, could change later if needed
    constraint organization_login_email_pk PRIMARY KEY (email)
);

create table donation_center (
    name varchar(50),
    email varchar(50) NOT NULL,
    password varchar(60) NOT NULL,
    CONSTRAINT donation_center_name_pk PRIMARY KEY (name),
    CONSTRAINT donation_center_email_uq UNIQUE (email)
);

create table location (
    donation_center_name varchar(50),
    street varchar(50) NOT NULL,
    city varchar(50) NOT NULL,
    state varchar(50) NOT NULL,
    zipcode char(5) NOT NULL,
    latitude  decimal(8,6) NOT NULL, -- between -90 and 90
    longitude decimal(9,6) NOT NULL, -- between -180 and 180
    -- Coordinate format is xx.xxxxxx, xxx.xxxxxx
    constraint location_donation_center_name_pk PRIMARY KEY (donation_center_name),
    CONSTRAINT location_donation_center_name_fk FOREIGN KEY (donation_center_name)
        REFERENCES donation_center(name) ON DELETE CASCADE, -- If a donation center is removed, the location is removed automatically
    CONSTRAINT location_uq UNIQUE (street, city, state, zipcode), -- a location can only be added if the combination of street, city, state, and zipcode is unique
    CONSTRAINT location_coordinate_uq UNIQUE (latitude, longitude), -- a specific coordinate can only have 1 donation center
    CONSTRAINT location_lat_chk CHECK (latitude BETWEEN -90 AND 90), -- enforces that the added values are between -90 and 90
    CONSTRAINT location_lon_chk CHECK (longitude BETWEEN -180 AND 180)
);

create table category ( -- Literally just a list of categories, but if something is changed,
                        -- it reflects in the tables that use that category as a foreign key
    name varchar(50) NOT NULL,
    CONSTRAINT category_name_pk PRIMARY KEY (name)
);

create table category_item (
    category varchar(50) NOT NULL,
    name varchar(50) NOT NULL,
    min_price decimal(6,2) NOT NULL, -- for all decimals, I made the max $9999.99
    max_price decimal(6,2) NOT NULL, -- could change if too small
    CONSTRAINT category_item_pk PRIMARY KEY (category, name), -- the combination of category and name is the primary key
    CONSTRAINT category_item_category_fk FOREIGN KEY (category)
        REFERENCES category(name) ON DELETE CASCADE ON UPDATE CASCADE, -- If a category is removed, it automatically removes all the category items
    -- If a category name is updated, the name also updates in category item
    CONSTRAINT category_item_ck CHECK (min_price <= max_price) -- enforces the min price to be smaller, or at least equal, to the max price
);

create table wishlist (
    donation_center_name varchar(50) NOT NULL,
    item_name varchar(50) NOT NULL,
    market_value decimal(6,2) NOT NULL,
    CONSTRAINT wishlist_pk PRIMARY KEY (donation_center_name, item_name), -- a donation center cannot have 2 of the same item in their wishlist
    CONSTRAINT wishlist_donation_center_name_fk FOREIGN KEY (donation_center_name)
        REFERENCES donation_center(name) ON DELETE CASCADE -- If a donation center is removed, it's wishlist is automatically deleted
);

create table inventory (
    donation_center_name varchar(50) NOT NULL,
    item_name varchar(50) NOT NULL,
    market_value decimal(6,2) NOT NULL,
    quantity int NOT NULL,
    CONSTRAINT inventory_item_name_pk PRIMARY KEY (donation_center_name, item_name), -- If a donation center has multiple of the same item in their inventory, just adjust the quantity
    CONSTRAINT inventory_donation_center_name_fk FOREIGN KEY (donation_center_name)
        REFERENCES donation_center(name) ON DELETE CASCADE, -- If a donation center is deleted, it's inventory is automatically deleted
    CONSTRAINT inventory_quantity_ck CHECK (quantity >= 0) -- The quantity can never be negative
);

select * from organization_login;
select * from donation_center;
select * from location;
select * from category;
select * from category_item;
select * from wishlist;
select * from inventory;