'use strict';

const Database = require("./database");
const userDao = require('./dao-users');
const express = require('express');
const cors = require("cors");
const { body, validationResult, check } = require("express-validator");

const app = new express();
const db = new Database("original_database.db");
const port = 3001;

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

const jsonwebtoken = require('jsonwebtoken');

const jwtSecret = 'qTX6walIEr47p7iXtTgLxDTXJRZYDC9egFjGLIn0rRiahB4T24T4d5f59CtyQmH8';
const expireTime = 60; //seconds


const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function (username, password, done) {
    console.log('Authenticating user:', username);
    userDao.getUser(username, password).then(user => {
      if (!user) {
        console.log('Authentication failed: Incorrect username or password');
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      console.log('Authentication successful:', user);
      return done(null, user);
    }).catch(err => {
      console.error('Error during authentication:', err.message);
      return done(err);
    });
  }
));

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log('Deserializing user with id:', id);
  userDao.getUserById(id).then(user => {
    if (!user) {
      console.log('Deserialization failed: User not found');
    } else {
      console.log('Deserialization successful:', user);
    }
    done(null, user);
  }).catch(err => {
    console.error('Error during deserialization:', err.message);
    done(err, null);
  });
});

app.use(require('express-session')({
  secret: 'CQRBRBJWRWLANMRKUNBNLANCWXXWNFRUUMRBLXENACQNTN',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('session'));



const isLoggedIn = (req, res, next) => {
  console.log('Checking if user is authenticated'); // Debugging line

  // Prints information about the current session
  //console.log('Session:', req.session);

  // Check if user is authenticated
  if (req.isAuthenticated()) {
    // console.log('User is authenticated:', req.user); // Debugging line
    return next();
  }

  // Se non autenticato, stampa un log e restituisci un errore 401
  //console.log('User is not authenticated'); // Debugging line
  return res.status(401).json({ error: 'Not authorized' });
};

app.post('/api/sessions', (req, res, next) => {
  //console.log('Received login request:', req.body); 
  //console.log('Session:', req.session);  
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      //console.error('Error in authentication:', err.message); 
      return next(err);
    }
    if (!user) {
      //console.log('Authentication failed:', info.message); 
      return res.status(401).json({ error: info.message });
    }
    req.login(user, err => {
      if (err) {
        //console.error('Error logging in:', err.message); 
        return next(err);
      }
      //console.log('Login successful, user:', req.user); // Debugging line
      return res.json(req.user);
    });
  })(req, res, next);
});


app.delete('/api/sessions/current', (req, res) => {
  //console.log('Received logout request'); // Debugging line
  req.logout(() => {
    //console.log('Logout successful'); // Debugging line
    res.status(200).json({});
  });
});

app.get('/api/sessions/current', isLoggedIn, async (req, res) => {
  //console.log('Fetching current session for user:', req.user); // Debugging line
  try {
    const user = await userDao.getUserById(req.user.id);
    //console.log('User fetched:', user); // Debugging line
    res.json({ user });
  } catch (err) {
    // console.error('Error fetching user:', err.message); // Debugging line
    res.status(500).json({ errors: [{ msg: err.message }] });
  }
});

/*** Utility Functions ***/

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};

/**
 * Get all the theathres and also computes the total number of aviable sits
 */
app.get("/api/theaters", async (req, res) => {
  try {
    const theaters = await db.getTheaters();
    res.json(theaters);
  } catch {
    console.error('Error fetching theaters'); // Debugging line
    res.status(500).json({ errors: ["Database error"] });
  }
});


/**
 * Get all the concerts from the database
 */
app.get("/api/concerts", async (req, res) => {
  try {
    const concerts = await db.getConcerts();
    res.json(concerts);
  } catch {
    console.error('Error fetching concerts'); // Debugging line
    res.status(500).json({ errors: ["Database error"] });
  }
});

/* Given the Id of a concert i can restrive all the occupied seats 
 */

app.get("/api/concerts/:id/occupied-seats", async (req, res) => {
  const concertId = req.params.id;

  try {
    const occupiedSeats = await db.getOccupiedSeats(concertId);
    res.json(occupiedSeats);
  } catch (err) {
    console.error('Error fetching occupied seats', err.message);
    res.status(500).json({ errors: ["Database error"] });
  }
});




/**
 * Given the id of a user i retrive all the reservation for that user for all the concerts
 */
app.get("/api/reservation/:id", [check('id').isInt({ min: 1 })], isLoggedIn, async (req, res) => {
  const resId = req.user.id;
  try {
    const reservation = await db.getReservationUser(resId);
    res.json(reservation);
  } catch {
    res.status(500).json({ errors: ["Database error"] });
  }
});

/** given the id of a reservation deltetes it from the database  */

app.delete("/api/reservation/:id_res", [check('id_res').isInt({ min: 1 })], isLoggedIn, async (req, res) => {
  try {
    const numChanges = await db.deleteReservation(req.params.id_res);
    res.status(200).json(numChanges);
  } catch (err) {
    res.status(503).json({ error: `Database error during the deletion of reservation ${req.params.id_res}: ${err} ` });
  }
});

//POST /api/reservation
// this route adds a reservation for a seat

app.post('/api/reservation', isLoggedIn, [
  // Validation checks
  check('concertId').isInt().withMessage('Concert ID must be an integer'),
  check('theatreId').isInt().withMessage('Theatre ID must be an integer'),
  check('row').isInt().withMessage('Row must be an integer'),
  check('col').isInt().withMessage('Column must be an integer')
], async (req, res) => {
  // Is there any validation error?
  const errors = validationResult(req).formatWith(errorFormatter); // format error message
  if (!errors.isEmpty()) {
    return res.status(422).json(errors.errors); // error message is sent back as a json with the error info
  }

  const occupation = {
    id_concert: req.body.concertId,
    theatre_id: req.body.theatreId,
    user_id: req.user.id,
    row_occupied: req.body.row,
    column_occupied: req.body.col
  };

  //console.log("FROM ROUTE " + occupation);

  try {
    const result = await db.createOccupation(occupation);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: `Database error during the creation of new occupation: ${err}` });
  }

}
);

app.post('/api/reserverandomseats', isLoggedIn, async (req, res) => {
  const { concertId, numSeats } = req.body; // Estrarre ID concerto e numero di posti da riservare

  try {
    // occupied seats for that concert 
    const occupiedSeats = await db.getOccupiedSeats(concertId);


    const theater = await db.getTheaterByConcert(concertId); // theater addociated with the concert
    const totalSeats = theater.rows * theater.columns;

    // finds occupied seats 
    const occupiedSeatSet = new Set(
      occupiedSeats.map((seat) => `${seat.row_occupied}-${seat.column_occupied}`)
    );

    const availableSeats = [];
    for (let row = 1; row <= theater.rows; row++) {
      for (let col = 1; col <= theater.columns; col++) {
        const seatId = `${row}-${col}`;
        if (!occupiedSeatSet.has(seatId)) {
          availableSeats.push({ row, col });
        }
      }
    }

    if (availableSeats.length < numSeats) {
      return res
        .status(400)
        .json({ error: "Not enough available seats to reserve." });
    }

    // Selects random seats from the avialbe ones
    const reservedSeats = [];
    for (let i = 0; i < numSeats; i++) {
      const randomIndex = Math.floor(Math.random() * availableSeats.length);
      const selectedSeat = availableSeats.splice(randomIndex, 1)[0];
      reservedSeats.push(selectedSeat);
    }


    const promises = reservedSeats.map((seat) =>
      db.createOccupation({
        id_concert: concertId,
        theatre_id: theater.id,
        user_id: req.user.id,
        row_occupied: seat.row,
        column_occupied: seat.col,
      })
    );

    await Promise.all(promises);

    // Gives bak the seat reserved by the user 
    res.status(200).json({
      message: `Successfully reserved ${numSeats} seat(s).`,
      reservedSeats: reservedSeats,
    });
  } catch (err) {
    console.error('Failed to reserve random seats:', err);
    res.status(500).json({ error: 'Failed to reserve random seats.' });
  }
});


app.post("/api/checkSeats", async (req, res) => {
  const selectedSeats = req.body; // array of seats selected by the user 
  console.log(selectedSeats);

  try {
    // in the selected seats there is all you need (theater, concert row and column)
    const seatStatuses = await db.checkSeatAvailability(selectedSeats);
    console.log(seatStatuses);

    // Response
    res.json(seatStatuses);
  } catch (err) {
    console.error("Error checking seat availability", err);
    res.status(500).json({ message: "Failed to check seat availability" });
  }
});




/*** Token ***/

// GET /api/auth-token
app.get('/api/auth-token', isLoggedIn, (req, res) => {
  //console.log("this is the user: ", JSON.stringify(req.user, null, 2));
  let authLevel = req.user.loyal;

  const payloadToSign = { access: authLevel, authId: 1234 };
  const jwtToken = jsonwebtoken.sign(payloadToSign, jwtSecret, { expiresIn: expireTime });
  res.json({ token: jwtToken, authLevel: authLevel });  // authLevel is just for debug. Anyway it is in the JWT payload
});


/*** Users APIs ***/

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
