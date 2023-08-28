CREATE DATABASE recordcollection_online;

USE recordcollection_online;

CREATE TABLE IF NOT EXISTS users (
    id int(11) NOT NULL AUTO_INCREMENT,
    username varchar(50) NOT NULL,
    password varchar(255) NOT NULL,
    email varchar(100) NOT NULL,
    dateCreated date NOT NULL,
    activationCode varchar(50) DEFAULT '',
    recoveryToken varchar(255) DEFAULT '',
    firstLogin boolean DEFAULT FALSE,
    
    PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS releases (
    id int(11) NOT NULL AUTO_INCREMENT,
    releaseID int(11) NOT NULL,
    artist varchar(50) NOT NULL,
    title varchar(50) NOT NULL,
    dateAdded date NOT NULL,
    
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS collections (
    id int(11) NOT NULL AUTO_INCREMENT,
    userID int(11) NOT NULL,
    releaseID int(11) NOT NULL,
    dateAdded date NOT NULL,

    PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

INSERT INTO users (username, password, email, dateCreated) VALUES ('demo', '$2a$10$Wj8g7fDPciK4eQkP1M/QE.xJ1YOJxaO5WGf.sPV4D7ZXHwOJll7Xi', 'test@test.com', now());

