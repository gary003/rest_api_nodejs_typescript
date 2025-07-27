CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON `${MYSQL_DATABASE}`.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;

drop table if exists wallet;
drop table if exists customer;

create table customer(
  customer_id varchar(50) primary key,
  firstname varchar(50),
  lastname varchar(50)
);

insert into customer(customer_id, firstname, lastname) 
  values 
  ("22ef5564-0234-11ed-b939-0242ac120002", "Carol", "Peletier"),
  ("35269564-0234-11ed-b939-0242ac120002", "Beth", "Greene"),
  ("14523564-0234-11ed-b939-0242ac120002", "Glen", "Rhee"),
  ("68965564-0234-11ed-b939-0242ac120002", "Rick", "Grimes");

create table wallet(
  wallet_id varchar(50) primary key,
  customer_id varchar(50),
  hard_currency int,
  soft_currency int,
  INDEX idx_wallet_customer_id (customer_id),
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

insert into wallet(wallet_id, customer_id, hard_currency, soft_currency) 
  values 
  ("515f73c2-027d-11ed-b939-0242ac120002", "22ef5564-0234-11ed-b939-0242ac120002", 1000, 1240),
  ("698f73c2-027d-11ed-b939-0242ac120002", "35269564-0234-11ed-b939-0242ac120002", 250, 450),
  ("412cddd2-027d-11ed-b939-0242ac120002", "14523564-0234-11ed-b939-0242ac120002", 850, 750),
  ("96373dc2-027d-11ed-b939-0242ac120002", "68965564-0234-11ed-b939-0242ac120002", 950, 650);

