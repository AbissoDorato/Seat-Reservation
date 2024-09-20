const SERVER_HOST = "http://localhost";
const SERVER2_HOST = "http://localhost";
const SERVER_PORT = 3001;
const SERVER2_PORT = 3002;

const SERVER_BASE = `${SERVER_HOST}:${SERVER_PORT}/api/`;
const SERVER2_BASE = `${SERVER2_HOST}:${SERVER2_PORT}/api/`;

const getJson = (httpResponsePromise) => {
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {
          response.json()
            .then(json => resolve(json))
            .catch(err => reject({ error: "Cannot parse server response" }));
        } else {
          response.json()
            .then(obj => reject(obj))
            .catch(err => reject({ error: "Cannot parse server response" }));
        }
      })
      .catch(err => reject({ error: "Cannot communicate" }));
  });
};

const fetchCurrentUser = async () => {
  return getJson(fetch(SERVER_BASE + 'sessions/current', {
    credentials: 'include'
  }));
};

const logOut = async () => {
  return getJson(fetch(SERVER_BASE + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  }));
};

const logIn = async (credentials) => {
  return getJson(fetch(SERVER_BASE + 'sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  }));
};

const APICall = async (
  endpoint,
  method = "GET",
  body = undefined,
  headers = undefined,
  expectResponse = true,
  server_base_url = SERVER_BASE
) => {
  let errors = [];

  try {
    const response = await fetch(new URL(endpoint, server_base_url), {
      method,
      body,
      headers: headers || {},
      credentials: "include",
    });

    if (response.ok) {
      if (expectResponse) {
        try {
          return await response.json();
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError);
          throw ["Failed to parse server response"];
        }
      }
    } else {
      try {
        const errorResponse = await response.json();
        errors = errorResponse.errors || ["Unknown error occurred"];
      } catch (jsonError) {
        console.error("Error parsing JSON from error response:", jsonError);
        errors = ["Failed to parse error response from server"];
      }
    }
  } catch (networkError) {
    console.error("Network or fetch error:", networkError);
    throw ["Failed to contact the server"];
  }

  if (errors.length !== 0) throw errors;
};

async function getAuthToken() {
  return getJson(fetch(SERVER_BASE + 'auth-token', {
    // this parameter specifies that authentication cookie must be forwared
    credentials: 'include'
  })
  )
}

/**
 * Fetches all the theaters from the server
 *
 * @returns list of theaters
 */
const fetchTheaters = async () => {
  try {
    return await APICall("theaters");
  } catch (err) {
    console.error("Error fetching theaters:", err);
    throw err;
  }
};

/**
 * Fetches all the theaters from the server
 *
 * @returns list of concerts
 */

const fetchConcerts = async () => {
  try {
    return await APICall("concerts");
  } catch (err) {
    console.error("Error fetching concerts:", err);
    throw err; // Rilancia l'errore per la gestione dell'errore chiamante
  }
};



/**
 * @returns given an id of a concert the occupied seats for that concert
 */

const fetchOccupiedSeats = async (id) => {
  try {
    return await APICall(`concerts/${id}/occupied-seats`); // Replace :id with the actual ID
  } catch (err) {
    console.error("Error fetching occupied seats:", err);
    throw err; // Rethrow the error for the calling code to handle
  }
};

/** Deletes the reservation for a seat */
const deleteReservation = async (id_res) => await APICall(
  `reservation/${id_res}/`,
  "DELETE",
  undefined,
  undefined,
  false
);

/*** Authentication functions ***/


// returns the reservation of the user 
const fetchReservation = async (userId) => {
  try {

    const endpoint = `reservation/${userId}`;
    return await APICall(endpoint);
  } catch (err) {
    console.error("Error fetching reservation of the user:", err);
    throw err; // Rethrow the error for the calling code to handle
  }
};

const reserveRandomSeats = async (concertId, numSeats) => {
  try {
    const response = await fetch(SERVER_BASE + 'reserverandomseats/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        concertId: concertId,
        numSeats: numSeats,
      }),
      credentials: 'include',
    });

    // Checks if response is ok
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to reserve seats');
    }

    // Restituisce i dati dei posti prenotati
    return await response.json(); // Questo conterrà i posti prenotati
  } catch (error) {
    console.error('Error in reserveRandomSeats:', error);
    throw error;
  }
};

function reserveSelectedSeats(reservation) {
  console.log(reservation);
  return getJson(
    fetch(SERVER_BASE + "reservation/", {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservation)
    })
  );
}

async function getDiscount(authToken, seats) {
  return getJson(fetch(SERVER2_BASE + 'discount', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ seats: seats }),
  })
  );
}

async function checkSeatAvailability(selectedSeats) {
  const response = await fetch(SERVER_BASE + "checkSeats/", {
    method: "POST",
    body: JSON.stringify(selectedSeats),
    headers: { "Content-Type": "application/json" },
  });
  return response.json(); // Gives back an array of all the seats with the corrisponding status 
}


const API = {
  fetchTheaters,
  fetchConcerts,
  fetchOccupiedSeats,
  fetchReservation,
  deleteReservation,
  logIn,
  logOut,
  checkSeatAvailability,
  fetchCurrentUser,
  reserveSelectedSeats,
  reserveRandomSeats,
  getAuthToken,
  getDiscount
};

export { API };
