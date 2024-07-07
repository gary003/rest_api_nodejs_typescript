drop table if exists wallet;
drop table if exists user;

create table user(
  userId varchar(50) primary key,
  firstname varchar(50),
  lastname varchar(50)
);

insert into user(userId, firstname, lastname) 
  values 
  ("22ef5564-0234-11ed-b939-0242ac120002", "Carol", "Peletier"),
  ("35269564-0234-11ed-b939-0242ac120002", "Beth", "Greene"),
  ("14523564-0234-11ed-b939-0242ac120002", "Glen", "Rhee"),
  ("68965564-0234-11ed-b939-0242ac120002", "Rick", "Grimes");

create table wallet(
  walletId varchar(50) primary key,
  userId varchar(50),
  hardCurrency int,
  softCurrency int,
  FOREIGN KEY (userId) REFERENCES user(userId)
);

insert into wallet(walletId, userId, hardCurrency, softCurrency) 
  values 
  ("515f73c2-027d-11ed-b939-0242ac120002", "22ef5564-0234-11ed-b939-0242ac120002", 1000, 1240),
  ("698f73c2-027d-11ed-b939-0242ac120002", "35269564-0234-11ed-b939-0242ac120002", 250, 450),
  ("412cddd2-027d-11ed-b939-0242ac120002", "14523564-0234-11ed-b939-0242ac120002", 850, 750),
  ("96373dc2-027d-11ed-b939-0242ac120002", "68965564-0234-11ed-b939-0242ac120002", 950, 650);

