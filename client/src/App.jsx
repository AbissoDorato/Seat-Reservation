import { React, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Link,
  useParams,
  Navigate,
  useNavigate,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import "./App.css";

import ListGroup from "react-bootstrap/ListGroup";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Button,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";
import {
  MyNavbar,
  NotFoundPage,
  Reservation,
} from "./components/Miscellaneous";
import { LoginForm } from "./components/LoginForm";
import { API } from "./API";
import { Theatre, Concert } from "./components/Theater";
import { ConcertList } from "./components/ConcertList";
import { SeatSelector } from "./components/SeatSelector";
import { SeatForm } from "./components/SeatForm";

import { ErrorsAlert } from "./components/ErrorsAlert";

import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  return (
    <BrowserRouter>
      <Main />
    </BrowserRouter>
  );
}

function Main() {
  /**User using the application */
  const navigate = useNavigate();

  // This state keeps track if the user is currently logged-in.
  const [loggedIn, setLoggedIn] = useState(false);
  // This state contains the user's info.
  const [user, setUser] = useState(null);

  /**Theatre loaded from the server */
  const [theater, setTheatre] = useState([]);

  const [dirty, setDirty] = useState(false);

  /** Authentication Token */
  const [authToken, setAuthToken] = useState(undefined);

  //state to pass to the seat selector to check if a concert has a reservation
  const [booked, setBooked] = useState(new Set([]));
  /**Concert loaded from the server */
  const [concert, setConcert] = useState([]);

  //concert selected by the user
  const [selectedConcert, setSelectedConcert] = useState(null);

  //theater of the concert selected by the user
  const [selectedTheater, setSelectedTheater] = useState(null);

  //reservation of the user
  const [reservation, setReservation] = useState([]);

  /** Flags initial loading of the app */
  const [loading, setLoading] = useState(true);

  /** A list of errors */
  const [errors, setErrors] = useState([]);

  //seats that are non aviable to be purchased by the user
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  /** Network-related waiting, like after pressing save or delete study plan. When waiting all controls are disabled. */
  const [waiting, setWaiting] = useState(false);

  const renewToken = () => {
    API.getAuthToken()
      .then((resp) => {
        //console.log(resp.token);
        setAuthToken(resp.token);
      })
      .catch((err) => {
        console.log("DEBUG: renewToken err: ", err);
      });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Caricamento dei dati dei teatri e dei concerti dal server
        const [theatersData, concertsData] = await Promise.all([
          API.fetchTheaters(),
          API.fetchConcerts(),
        ]);

        //console.log("Raw theaters data:", theatersData);
        //console.log("Raw concerts data:", concertsData);

        // Mapping into object
        const mappedTheaters = theatersData.map(
          (theatre) =>
            new Theatre(
              theatre.id,
              theatre.name,
              theatre.rows,
              theatre.columns,
              theatre.type
            )
        );

        setTheatre(mappedTheaters);

        // Mapping into object
        const mappedConcerts = concertsData.map(
          (concert) =>
            new Concert(
              concert.id_concert, // Assicurati che questo sia il nome corretto della proprietà
              concert.theater_id, // Assicurati che questo sia il nome corretto della proprietà
              concert.concert_name
            )
        );

        setConcert(mappedConcerts);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err); // Log dell'errore per il debug
        setErrors((prevErrors) => [...prevErrors, err.message]);
        setLoading(false);
      }
    };

    const checkAuth = async () => {
      try {
        const user = await API.fetchCurrentUser();
        setLoggedIn(true);
        setUser(user);
        API.getAuthToken().then((resp) => {
          setAuthToken(resp.token);
        });

        // If there are reservation i load them
        if (!reservation.length) {
          const reserv = await API.fetchReservation(user.id);
          setReservation(reserv);
        }
      } catch (err) {
        // NO need to do anything: user is simply not yet authenticated
      }
    };

    fetchData();
    checkAuth();
  }, []);

  const handleErrors = (err) => {
    console.log("DEBUG: err: " + JSON.stringify(err));
    let msg = "";
    if (err.error) msg = err.error;
    else if (err.errors) {
      if (err.errors[0].msg)
        msg = err.errors[0].msg + " : " + err.errors[0].path;
    } else if (Array.isArray(err)) msg = err[0].msg + " : " + err[0].path;
    else if (typeof err === "string") msg = String(err);
    else msg = "Unknown Error";
    console.log(err);

    setTimeout(() => setDirty(true), 2000);
  };

  const onConcertSelect = (conc) => {
    const id_t = conc.id_t;
    const selectedTheater = theater.find((th) => th.id_t === id_t); // Use find() to get a single object
    setSelectedTheater(selectedTheater);
    setSelectedConcert(conc);
  };

  /**
   * This function handles the login process.
   * It requires a username and a password inside a "credentials" object.
   */

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);

      if (user && user.id) {
        const reserv = await API.fetchReservation(user.id);

        if (reserv) {
          // I want to filter the concert to have a set of all the concerts in which the user has a reservation
          const bookedConcerts = new Set(
            reserv
              .filter((reservation) => reservation.id_concert)
              .map((reservation) => reservation.id_concert)
          );

          setBooked(bookedConcerts); // has to be a set
          setReservation(reserv);
          setUser(user);
          setLoggedIn(true);
          renewToken();
          setErrors("");
          navigate("/");
        } else {
          setErrors((prevErrors) => [
            ...prevErrors,
            "Failed to fetch reservation data.",
          ]);
        }
      } else {
        setErrors((prevErrors) => [
          ...prevErrors,
          "Login failed: Invalid user data.",
        ]);
      }
    } catch (err) {
      console.error("Error occurred: ", err);
      const errorMessage = err.error || "Unknown error occurred";
      setErrors((prevErrors) => [...prevErrors, errorMessage]);
    }
  };

  const deleteReservation = async (res_id) => {
    try {
      // deletese the reservation
      await API.deleteReservation(res_id);

      // reloads all the reservation of the user
      const reserv = await API.fetchReservation(user.id);

      // sets again the concert where the user has a reservation
      const bookedConcerts = new Set(
        reserv
          .filter((reservation) => reservation.id_concert)
          .map((reservation) => reservation.id_concert)
      );

      //checking if the user has booked a seat for that concert
      setBooked(bookedConcerts);

      setReservation(reserv);
    } catch (err) {
      // Gestione dell'errore
      handleErrors(err);
    }
  };

  /**
   * Perform the logout
   */
  const logout = () => {
    API.logOut()
      .then(() => {
        setUser(undefined);
        setLoggedIn(false);
        setAuthToken(undefined);
        setBooked(new Set());
        setReservation([]);
      })
      .catch((err) => {
        // Remove eventual 401 Unauthorized errors from the list
        setErrors(err.filter((e) => e !== "Not authenticated"));
      });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={<Header user={user} errors={errors} logoutCbk={logout} />}
      >
        <Route
          path=""
          element={
            loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <HomePage
                  user={user}
                  theater={theater}
                  concert={concert}
                  errorAlertActive={errors.length > 0}
                  waiting={waiting}
                  loggedIn={loggedIn}
                  reservation={reservation}
                  deleteReservation={deleteReservation}
                  onConcertSelect={onConcertSelect} // Pass function to update selected concert
                />
              </>
            )
          }
        />
        <Route
          path="login"
          element={
            loading ? (
              <LoadingSpinner />
            ) : (
              <LoginForm
                errorAlertActive={errors.length > 0}
                loginCbk={handleLogin}
              />
            )
          }
        />
      </Route>
      <Route
        path="/concerts/:id_c/seats"
        element={
          <>
            <Header user={user} errors={errors} logoutCbk={logout} />
            <SeatSelector
              selectedConcert={selectedConcert}
              setBooked={setBooked}
              booked={booked}
              selectedTheatre={selectedTheater}
              setReservation={setReservation}
              loggedIn={loggedIn}
              user={user}
              authToken={authToken}
              renewToken={renewToken}
              setOccupiedSeats={setOccupiedSeats}
              occupiedSeats={occupiedSeats}
            />
            <SeatForm
              selectedConcert={selectedConcert}
              setBooked={setBooked}
              booked={booked}
              loggedIn={loggedIn}
              selectedTheatre={selectedTheater}
              setReservation={setReservation}
              setOccupiedSeats={setOccupiedSeats}
              occupiedSeats={occupiedSeats}
              user={user}
              authToken={authToken}
              renewToken={renewToken}
              errors={errors}
            />
          </>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function Header(props) {
  return (
    <>
      <MyNavbar user={props.user} logoutCbk={props.logoutCbk} />
      {props.errors.length > 0 ? (
        <ErrorsAlert errors={props.errors} clear={props.clearErrors} />
      ) : (
        false
      )}
      <Outlet />
    </>
  );
}

function HomePage(props) {
  return (
    <Container
      fluid
      style={{
        paddingLeft: "3rem",
        paddingRight: "2rem",
        paddingBottom: "4rem",
        marginTop: props.errorAlertActive ? "2rem" : "6rem",
      }}
    >
      <Row className="justify-content-center">
        <Col
          lg
          style={{
            borderRight: props.user && "1px solid #dfdfdf",
            maxWidth: "80%",
          }}
        >
          <ConcertList
            theater={props.theater}
            concert={props.concert}
            onConcertSelect={props.onConcertSelect}
          />
        </Col>
        {props.loggedIn && (
          <Reservation
            reservation={props.reservation}
            deleteReservation={props.deleteReservation}
            user={props.user}
          />
        )}
      </Row>
    </Container>
  );
}

/**
 * A loading spinner shown on first loading of the app
 */
function LoadingSpinner() {
  return (
    <div className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
}

export default App;
