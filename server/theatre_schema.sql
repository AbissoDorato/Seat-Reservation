BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "theaters" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "columns" INTEGER NOT NULL CHECK("columns" <= 26),
    "type" TEXT
);

CREATE TABLE IF NOT EXISTS "concerts" (
    "id_concert" INTEGER PRIMARY KEY AUTOINCREMENT,
    "concert_name" TEXT NOT NULL,
    "theater_id" INTEGER NOT NULL,
    FOREIGN KEY("theater_id") REFERENCES "theaters"("id")
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "loyal" INTEGER CHECK("loyal" IN (0, 1))
);

-- Modifica della tabella "occupied_seats" per aggiungere una chiave primaria autonumerica "id"
CREATE TABLE IF NOT EXISTS "occupied_seats" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "id_concert" INTEGER NOT NULL,
    "theater_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "row_occupied" INTEGER NOT NULL,
    "column_occupied" INTEGER NOT NULL,
    FOREIGN KEY("id_concert") REFERENCES "concerts"("id_concert"),
    FOREIGN KEY("theater_id") REFERENCES "theaters"("id"),
    FOREIGN KEY("user_id") REFERENCES "users"("id"),
    UNIQUE("id_concert", "theater_id", "row_occupied", "column_occupied") -- Vincolo di unicità
);

CREATE VIEW concert_seating_info AS
SELECT
    c.id_concert AS ConcertID,
    c.concert_name AS ConcertName,
    t.rows * t.columns AS TotalSeats,
    COUNT(os.row_occupied) AS OccupiedSeats
FROM concerts c
JOIN theaters t ON c.theater_id = t.id
LEFT JOIN occupied_seats os ON c.id_concert = os.id_concert
GROUP BY c.id_concert;

-- Inserimenti nelle tabelle
INSERT INTO "theaters" ("name", "rows", "columns", "type") VALUES ('Teatro alla Scala', 4, 8, 'Small');
INSERT INTO "theaters" ("name", "rows", "columns", "type") VALUES ('Teatro Massimo Bellini', 6, 10, 'Medium');
INSERT INTO "theaters" ("name", "rows", "columns", "type") VALUES ('Teatro Colosseo', 9, 14, 'Large');
INSERT INTO "theaters" ("name", "rows", "columns", "type") VALUES ('Teatro Regio', 9, 14, 'Large');

INSERT INTO "concerts" ("concert_name", "theater_id") VALUES ('Locura- Lazza', 1);
INSERT INTO "concerts" ("concert_name", "theater_id") VALUES ('Persona- Marracash', 2);
INSERT INTO "concerts" ("concert_name", "theater_id") VALUES ('Anime Sympo Show', 3);
INSERT INTO "concerts" ("concert_name", "theater_id") VALUES ('New Year Concert', 4);
INSERT INTO "concerts" ("concert_name", "theater_id") VALUES ('Lùnapop- ..Squèrez?', 4);
INSERT INTO "concerts" ("concert_name", "theater_id") VALUES ('GUTS- Olivia Rodrigo', 4);

INSERT INTO "users" ("email", "name", "hash", "salt", "loyal") VALUES ('s123456@example.com', 'Monkey D. Luffy', '2ad9552dde8a4aaf6601ae91018d14b8c67d96d50f33e67f16f2cb26ebc396ca02fd274a231619b222002ded41eb5a7f886b6e6a20f91356b2821ef6d01111fc', '96a0f4e845fc918f5400b4e92ed0d345', 1);
INSERT INTO "users" ("email", "name", "hash", "salt", "loyal") VALUES ('yuta.okkotsu@example.com', 'Yuta Okkotsu', '9584a70eeea020bae751e6b39c72dfeb08a61973bbbb49da4be8456eb4b3fed1d3bee83aea6a2cddd61bf6501690d275f79642975889dd086c143591c8de655d', 'cef0009f306c0743825d0a4d82b936cd', 0);
INSERT INTO "users" ("email", "name", "hash", "salt", "loyal") VALUES ('satoru.gojo@example.com', 'Satoru Gojo', '93183e7b3c30c4bc9d54afa76378e0ecca37fd391d6b40495dcf46180609777e38ee3b9baf7358e1f05cd58cd4d3997ee3ee4433cdaf20d988f017421397f3c0', 'cc87df425167e7e0d33555d096e11c2b', 1);
INSERT INTO "users" ("email", "name", "hash", "salt", "loyal") VALUES ('mario.rossi@example.it', 'Mario Rossi', '137f1002cc0239cc319984e22a8351ca310e44bc4396a326d2cae914d8c82bac74a35e25e2432aeb371482450edbbb73507b2488d9cf7a32960d9bb7b5e16c53', '2cafabadd7d7fadf9c8e41c65133e45f', 0);


INSERT INTO "occupied_seats" ("id_concert", "theater_id", "user_id", "row_occupied", "column_occupied") VALUES (1, 1, 1, 1, 3);
INSERT INTO "occupied_seats" ("id_concert", "theater_id", "user_id", "row_occupied", "column_occupied") VALUES (1, 1, 1, 1, 2);
INSERT INTO "occupied_seats" ("id_concert", "theater_id", "user_id", "row_occupied", "column_occupied") VALUES (3, 3, 1, 2, 4);
INSERT INTO "occupied_seats" ("id_concert", "theater_id", "user_id", "row_occupied", "column_occupied") VALUES (3, 3, 1, 2, 5);
INSERT INTO "occupied_seats" ("id_concert", "theater_id", "user_id", "row_occupied", "column_occupied") VALUES (2, 2, 3, 1, 4);
INSERT INTO "occupied_seats" ("id_concert", "theater_id", "user_id", "row_occupied", "column_occupied") VALUES (2, 2, 3, 1, 5);
INSERT INTO "occupied_seats" ("id_concert", "theater_id", "user_id", "row_occupied", "column_occupied") VALUES (4, 4, 3, 4, 6);
INSERT INTO "occupied_seats" ("id_concert", "theater_id", "user_id", "row_occupied", "column_occupied") VALUES (4, 4, 3, 4, 7);


COMMIT;