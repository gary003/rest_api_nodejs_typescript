CREATE USER 'mysql'@'%' IDENTIFIED BY 'mypass';
GRANT ALL PRIVILEGES ON mydbuser.* TO 'mysql'@'%';
FLUSH PRIVILEGES;

