'use strict';


const express = require('express');
const morgan = require('morgan'); // logging middleware
const cors = require('cors');

const { body, validationResult } = require("express-validator");

const { expressjwt: jwt } = require('express-jwt');

const jwtSecret = 'qTX6walIEr47p7iXtTgLxDTXJRZYDC9egFjGLIn0rRiahB4T24T4d5f59CtyQmH8';

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

const app = express();
const port = 3002;

// THIS IS FOR DEBUGGING ONLY: when you start the server, generate a valid token to do tests, and print it to the console
//This is used to create the token
const jsonwebtoken = require('jsonwebtoken');
const expireTime = 60;
//const token = jsonwebtoken.sign( { access: 'premium', authId: 1234 }, jwtSecret, {expiresIn: expireTime});
//console.log(token);

// Check token validity
app.use(jwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
  // token from HTTP Authorization: header
})
);


const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));


// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json()); // To automatically decode incoming json

// Check token validity
app.use(jwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
  // token from HTTP Authorization: header
})
);

// To return a better object in case of errors
app.use(function (err, req, res, next) {
  //console.log("DEBUG: error handling function executed");
  console.log(err);
  if (err.name === 'UnauthorizedError') {
    // Example of err content:  {"code":"invalid_token","status":401,"name":"UnauthorizedError","inner":{"name":"TokenExpiredError","message":"jwt expired","expiredAt":"2024-05-23T19:23:58.000Z"}}
    res.status(401).json({ errors: [{ 'param': 'Server', 'msg': 'Authorization error', 'path': err.code }] });
  } else {
    next();
  }
});


/*** APIs ***/

// POST /api/discount
app.post('/api/discount',
  body('seats', 'Invalid list of seats').isArray({ min: 1 }),  // Ensures that at least one seat is provided
  (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array().map(error => error.msg) });
    }

    //console.log("DEBUG: auth: ", req.auth);

    const { access: authLevel } = req.auth;
    const { seats } = req.body;
    const rnd = getRandomInt(5, 20);
    //console.log("random is: " + rnd);

    // Calculate total seat count
    const seatCount = seats.reduce((total, seat) => total + seat, 0);
    // console.log("seat count is:" + seatCount);

    // Calculate discount based on user auth level
    let discount = authLevel === 1
      ? Math.ceil(seatCount + rnd)
      : Math.ceil((seatCount / 3) + rnd);

    // Cap discount between 5 and 50
    discount = Math.min(Math.max(discount, 5), 50);

    res.json({ discount: discount, authLevel: authLevel });
  }
);



// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
