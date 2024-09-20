"use strict"

const sqlite = require("sqlite3");
const crypto = require("crypto");

//used to make querries to the database

/**
 * Wrapper around db.all
 */
const dbAllAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

/**
 * Wrapper around db.run
 */
const dbRunAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, err => {
        if (err) reject(err);
        else resolve();
    });
});

/**
 * Wrapper around db.get
 */
const dbGetAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});


/**
 * Interface to the sqlite database for the application
 *
 * @param dbname name of the sqlite3 database file to open
 */
function Database(dbname) {
    this.db = new sqlite.Database(dbname, err => {
        if (err) throw err;
    });


    this.getTheaters = async () => {
        try {
            const theaters = await dbAllAsync(this.db, "SELECT * FROM THEATERS");
            return theaters;
        } catch (err) {
            console.error('Error fetching theaters', err.message);
            throw err;
        }
    };


    this.getTheaterByConcert = async (concertId) => {
        try {
            const sql = `
            SELECT t.id, t.name, t.rows, t.columns, t.type
            FROM concerts c
            JOIN theaters t ON c.theater_id = t.id
            WHERE c.id_concert = ?
          `;
            const theater = await dbGetAsync(this.db, sql, [concertId]);
            return theater;
        } catch (err) {
            console.error("Error fetching theater by concert ID:", err.message);
            throw err;
        }
    };

    this.getConcerts = async () => {
        try {
            const concerts = await dbAllAsync(this.db, "SELECT * FROM CONCERTS");
            return concerts;
        } catch (err) {
            console.error('Error fetching Concerts', err.message);
            throw err;
        }
    };

    this.getOccupiedSeats = async (concertId) => {
        try {
            const query = "SELECT row_occupied, column_occupied FROM occupied_seats WHERE id_concert = ?";
            const occupiedSeats = await dbAllAsync(this.db, query, [concertId]);  // Usa dbAllAsync e passa this.db

            console.log(occupiedSeats);
            return occupiedSeats;
        } catch (err) {
            console.error('Error fetching occupied seats:', err.message);
            throw err;
        }
    };

    this.deleteReservation = async (id) => {

        const sql = 'DELETE FROM occupied_seats WHERE id = ?';
        dbRunAsync(
            this.db,
            sql,
            [id]
        );

    }

    // if the seat has been ovvupied the database will reject it due to the uniques that seat, concert and theater should have
    this.createOccupation = (occupation) => {
        return new Promise((resolve, reject) => {
            const sql =
                'INSERT INTO occupied_seats (id_concert, theater_id, user_id, row_occupied, column_occupied) VALUES(?, ?, ?, ?, ?)';


            this.db.run(
                sql,
                [
                    occupation.id_concert,
                    occupation.theatre_id,
                    occupation.user_id,
                    occupation.row_occupied,
                    occupation.column_occupied
                ],
                function (err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            // Restituisci un messaggio di errore più user-friendly
                            reject(new Error('You booked a seat that has alreafy been occupied.'));
                        }
                        console.log(err);
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    };

    // Funzione che verifica se un posto è già occupato
    this.isSeatOccupied = (theatreId, concertId, row, col) => {
        return new Promise((resolve, reject) => {
            // Query per verificare se il posto esiste nella tabella occupied_seats
            const query = `
            SELECT COUNT(*) AS count
            FROM occupied_seats
            WHERE theater_id = ? AND id_concert = ? AND row_occupied = ? AND column_occupied = ?
          `;

            // Esegui la query
            this.db.get(query, [theatreId, concertId, row, col], (err, row) => {
                if (err) {
                    return reject(err); // Gestione dell'errore
                }

                // Assicurati che row.count sia un numero e non una stringa
                const count = Number(row.count);
                console.log("the counte that i get is: " + count);

                // Se il conteggio è maggiore di 0, il posto è occupato
                resolve((count > 0));
            });
        });
    };

    // Funzione che controlla la disponibilità dei posti
    this.checkSeatAvailability = async (selectedSeats) => {
        // Array per salvare i risultati delle verifiche
        const seatAvailabilityPromises = selectedSeats.map(async (seat) => {
            // Attendi il risultato della funzione asincrona isSeatOccupied
            const isAvailable = !(await this.isSeatOccupied(seat.theatreId, seat.concertId, seat.row, seat.col));

            // Ritorna lo stato del posto (disponibile o no)
            return {
                row: seat.row,
                col: seat.col,
                isAvailable
            };
        });

        // Attendi che tutte le promesse siano risolte
        const seatAvailability = await Promise.all(seatAvailabilityPromises);
        return seatAvailability;
    };

    // selects the reservation for a concert given a certain ID 
    this.getReservationUser = async (userId) => {
        try {
            const query = "SELECT oc.id, oc.id_concert, cn.concert_name, t.name AS theater_name, oc.row_occupied, oc.column_occupied FROM occupied_seats oc JOIN concerts cn ON oc.id_concert = cn.id_concert JOIN theaters t ON cn.theater_id = t.id WHERE oc.user_id = ?";
            console.log(userId);
            const reserved = await dbAllAsync(this.db, query, [userId]);
            console.log(reserved);
            return reserved
        } catch (err) {
            console.error('Error fetching occupied seats:', err.message);
            throw err;
        }
    };

}

module.exports = Database;