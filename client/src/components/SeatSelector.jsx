import React, { useEffect, useState } from "react";
import { Button, Container, Row, Col, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { API } from "../API"; // Import your API helper functions
import { propTypes } from "react-bootstrap/esm/Image";
import { SeatForm } from "./SeatForm";

// Shared Hook, used because at first the random reserve seat and the select seat where suppost to be in the same file, kept it even if the two components are separated
const useSeatData = (selectedConcert, setOccupiedSeats) => {
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedConcert) {
      fetchOccupiedSeats();
    }
  }, [selectedConcert]);

  const fetchOccupiedSeats = () => {
    if (!selectedConcert) return;
    API.fetchOccupiedSeats(selectedConcert.id_c)
      .then((seats) => setOccupiedSeats(seats))
      .catch(() => setError("Failed to fetch occupied seats"));
  };

  const reserveSeats = async (selectedSeats, totalSeats, occupiedSeats) => {
    if (!selectedConcert) return Promise.reject();

    const availableSeats = totalSeats - occupiedSeats.length;

    if (selectedSeats.length <= availableSeats) {
      const promises = selectedSeats.map((seat) =>
        API.reserveSelectedSeats(seat)
          .then(() => {
            console.log(
              `Successfully reserved seat at row ${seat.row}, col ${seat.col} for user ${seat.user} for the concert ${seat.concertId}.`
            );
          })
          .catch((err) =>
            setError(
              `Failed to reserve seat at row ${seat.row}, col ${seat.col}. \n error: ${err}`
            )
          )
      );

      // Wait far all the promises to end
      return Promise.all(promises)
        .then(() => {
          fetchOccupiedSeats(); // Fetches the occupied seats after each reservation
        })
        .catch(() => setError("Some reservations failed"));
    } else {
      setError("Not enough available seats to reserve that many.");
      return Promise.reject();
    }
  };

  return {
    setError,
    error,
    reserveSeats,
    fetchOccupiedSeats,
  };
};

function SeatSelector({
  selectedConcert,
  selectedTheatre,
  loggedIn,
  user,
  setReservation,
  setBooked,
  booked,
  authToken,
  renewToken,
  setOccupiedSeats,
  occupiedSeats,
}) {
  const numRows = selectedTheatre ? selectedTheatre.rows : 6;
  const numCols = selectedTheatre ? selectedTheatre.columns : 6;
  const totalSeats = numRows * numCols;

  const { error, reserveSeats, setError } = useSeatData(
    selectedConcert,
    setOccupiedSeats
  ); // Estraction of reserveSeats

  // State for selected seats
  const [selectedSeats, setSelectedSeats] = useState([]);
  // discount that will be displayed after each reservation
  const [discount, setDiscount] = useState();

  const availableSeats = totalSeats - occupiedSeats.length;

  const getReservation = async (id) => {
    try {
      const res = await API.fetchReservation(id);
      return res;
    } catch (err) {
      console.error("Failed to fetch reservations: ", err);
      return []; // In caso di errore, ritorna un array vuoto
    }
  };

  const handleSubmitSeats = async () => {
    try {
      // Check seat availability before reserving
      const availableSeats = await API.checkSeatAvailability(selectedSeats);

      if (availableSeats.every((seat) => seat.isAvailable)) {
        await reserveSeats(selectedSeats, totalSeats, occupiedSeats); // Complete all reservations
        const val = selectedSeats.map((seat) => seat.row);
        const disc = await API.getDiscount(authToken, val);
        console.log(disc);
        setSelectedSeats([]); // Clear the list once all reservations are completed
        setDiscount(disc);
        renewToken();

        const reserv = await getReservation(user.id); // Update reservation state
        setReservation(reserv);

        // Update the booked state by adding the concert ID if it's not already present
        setBooked((prevBooked) => {
          const newBooked = new Set(prevBooked);
          newBooked.add(selectedConcert.id_c); // Add current concert ID to the set
          return newBooked;
        });
        setError("");
      } else {
        // If some seats are not available, highlight the occupied seats in blue, then turn them red (already occupied), and no seats should be reserved
        const ocSeats = availableSeats.filter((seat) => !seat.isAvailable);
        console.log(ocSeats);
        setSelectedSeats([]); // Reset selected seats
        setError(
          "Those seats were already reserved: " +
            ocSeats
              .map((seat) => "row: " + seat.row + " column: " + seat.col)
              .join(", ") // Showing an error
        );
        setTimeout(() => {
          setError("");
        }, 3000);
        highlightOccupiedSeats(ocSeats);
      }
    } catch (err) {
      console.error("Failed to reserve some or all of the seats: ", err);
    }
  };

  const highlightOccupiedSeats = async (occupiedSeats) => {
    try {
      // Fetch the currently occupied seats from the API
      const seats = await API.fetchOccupiedSeats(selectedConcert.id_c);

      // Highlight only the seats that are in `occupiedSeats`
      setOccupiedSeats((prevOccupied) =>
        seats.map((seat) => {
          // Check if the seat is in the `occupiedSeats` array
          const isHighlighted = occupiedSeats.some(
            (ocSeat) =>
              ocSeat.row === seat.row_occupied &&
              ocSeat.col === seat.column_occupied
          );
          return { ...seat, highlight: isHighlighted }; // Highlight only if in `occupiedSeats`
        })
      );

      // Remove highlight after 5 seconds
      setTimeout(() => {
        setOccupiedSeats((prevOccupied) =>
          prevOccupied.map((seat) => ({ ...seat, highlight: false }))
        );
      }, 5000);
    } catch (error) {
      setError("Failed to fetch and highlight occupied seats");
    }
  };

  const toggleSeatSelection = (row, col) => {
    // Check if the seat at the given row and column is already selected
    const isAlreadySelected = selectedSeats.some(
      (seat) => seat.row === row && seat.col === col
    );

    // If the seat is already selected, remove it from the selectedSeats array
    if (isAlreadySelected) {
      setSelectedSeats(
        selectedSeats.filter((seat) => seat.row !== row || seat.col !== col)
      );
    }
    // If the seat is not selected, add it to the selectedSeats array
    else {
      // Create a new array that includes all previously selected seats
      setSelectedSeats([
        ...selectedSeats, // spread operator to keep existing selected seats
        {
          theatreId: selectedTheatre.id_t,
          concertId: selectedConcert.id_c,
          row,
          col,
        },
      ]);
    }

    //console.log(selectedSeats);
  };

  // Function to generate the seating layout
  const generateSeats = () => {
    const seats = [];
    // Loop through rows in reverse order
    for (let row = numRows; row >= 1; row--) {
      const rowSeats = [];
      // Loop through columns
      for (let col = 1; col <= numCols; col++) {
        // Create seat ID (e.g., "1A", "1B")
        const seatId = `${row}${String.fromCharCode(64 + col)}`;

        // Check if the seat is occupied
        const isOccupied = occupiedSeats.some(
          (seat) => seat.row_occupied === row && seat.column_occupied === col
        );

        // Check if the seat is highlighted
        const isHighlighted = occupiedSeats.some(
          (seat) =>
            seat.row_occupied === row &&
            seat.column_occupied === col &&
            seat.highlight
        );

        // Check if the seat is selected by the user
        const isSelected = selectedSeats.some(
          (seat) => seat.row === row && seat.col === col
        );

        // Add the seat button to the row
        rowSeats.push(
          <Col key={seatId} xs="auto">
            <Button
              variant={
                isHighlighted
                  ? "primary" // Blue for highlighted seats
                  : isOccupied
                  ? "danger" // Red for occupied seats
                  : isSelected && loggedIn
                  ? "warning" // Yellow for selected seats
                  : "success" // Green for available seats
              }
              className="w-100"
              disabled={
                isOccupied || !loggedIn || booked.has(selectedConcert.id_c)
              }
              onClick={() => toggleSeatSelection(row, col)} // Toggle seat selection
            >
              {seatId}
            </Button>
          </Col>
        );
      }
      // Add the row of seats to the seating layout
      seats.push(
        <Row key={row} className="mb-2 justify-content-center">
          {rowSeats}
        </Row>
      );
    }
    return seats;
  };

  return (
    <>
      <Col md="5" style={{ paddingLeft: "4rem", paddingTop: "2rem" }}>
        <Link to="/">
          <i className="bi bi-arrow-left" />
          back
        </Link>
      </Col>
      <Container
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ marginTop: "5px" }}
      >
        <div className="text-center mb-4">
          <h3>Theater: {selectedTheatre ? selectedTheatre.name : "None"}</h3>
          <h4>
            Selected Concert: {selectedConcert ? selectedConcert.id : "None"}
          </h4>
        </div>

        {generateSeats()}

        <Row className="mt-4">
          <Col md="auto">
            <h5>Total seats: {totalSeats}</h5>
          </Col>
          <Col md="auto">
            <h5>Available seats: {availableSeats}</h5>
          </Col>
          <Col md="auto">
            <h5>Requested seats: {selectedSeats.length}</h5>
          </Col>
        </Row>

        {selectedSeats.length > 0 && loggedIn && (
          <>
            {booked.has(selectedConcert.id_c) ? (
              // Banner per indicare che l'utente ha già una prenotazione
              <div className="alert alert-warning mt-3" role="alert">
                You already got a reservation for this concert
              </div>
            ) : (
              // Form per selezionare i posti
              <div className="mt-3">
                <h5>Selected Seats:</h5>
                <Row>
                  {selectedSeats.map((seat, index) => (
                    <Col key={index} xs="auto">
                      {seat.row}
                      {String.fromCharCode(64 + seat.col)}
                    </Col>
                  ))}
                  <Col xs="auto"></Col>
                </Row>
                <Button className="w-10 mt-5" onClick={handleSubmitSeats}>
                  Send Request
                </Button>
              </div>
            )}
          </>
        )}

        {booked.has(selectedConcert.id_c) ? (
          // Banner per indicare che l'utente ha già una prenotazione
          <div className="alert alert-warning mt-3" role="alert">
            You already got a reservation for this concert
          </div>
        ) : (
          <></>
        )}

        {discount && (
          <Row className="my-3 p-3 bg-light text-center rounded">
            <p className="mb-0">
              You are a{" "}
              <span
                className={`font-weight-bold text-${
                  discount.authLevel === 1 ? "success" : "secondary"
                }`}
              >
                {discount.authLevel === 1 ? "loyal" : "normal"}
              </span>{" "}
              user, and the value of your discount is
              <span className="font-weight-bold text-primary">
                {" "}
                {discount.discount}%
              </span>
              .
            </p>
          </Row>
        )}

        {error && <p className="text-danger mt-3">{error}</p>}
      </Container>
    </>
  );
}

export { SeatSelector };
