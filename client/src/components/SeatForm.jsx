import { React, useEffect, useState } from "react";
import { Button, Container, Row, Col, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { API } from "../API";

function SeatForm(props) {
  const [numSeatsToReserve, setNumSeatsToReserve] = useState(0); // State for number of seats to reserve
  const [discount, setDiscount] = useState();
  const numRows = props.selectedTheatre ? props.selectedTheatre.rows : 6; // Example fallback
  const numCols = props.selectedTheatre ? props.selectedTheatre.columns : 6; // Example fallback
  const totalSeats = numRows * numCols;

  const availableSeats = totalSeats - props.occupiedSeats.length;

  useEffect(() => {
    if (props.selectedConcert) {
      fetchOccupiedSeats();
    }
  }, [props.selectedConcert]);

  const fetchOccupiedSeats = () => {
    if (!props.selectedConcert) return;
    API.fetchOccupiedSeats(props.selectedConcert.id_c)
      .then((seats) => props.setOccupiedSeats(seats))
      .catch(() => setError("Failed to fetch occupied seats"));
  };

  const getReservation = async (id) => {
    try {
      const res = await API.fetchReservation(id);
      return res;
    } catch (err) {
      console.error("Failed to fetch reservations: ", err);
      return [];
    }
  };

  const handleReserveSeats = async () => {
    if (numSeatsToReserve <= availableSeats && numSeatsToReserve > 0) {
      try {
        // Reservation of random seats
        const response = await API.reserveRandomSeats(
          props.selectedConcert.id_c,
          numSeatsToReserve
        );

        // logic for the computation of the discount
        const val = response.reservedSeats.map((seat) => seat.row);
        const disc = await API.getDiscount(props.authToken, val);
        console.log("This is the discount recived:" + disc.discount);
        setDiscount(disc);

        // Fetching the new reserved seats
        const seats = await API.fetchOccupiedSeats(props.selectedConcert.id_c);
        props.setOccupiedSeats(seats);

        // Adds the concert into the set of concert reserved by teh user
        props.setBooked((prevBooked) => {
          const newBooked = new Set(prevBooked);
          newBooked.add(props.selectedConcert.id_c);
          return newBooked;
        });

        // Getting the reservation of the user
        const reserv = await getReservation(props.user.id);
        props.setReservation(reserv);
      } catch (error) {
        console.error("Failed to reserve seats or refresh data:", props.errors);
      }
    } else {
      console.error("Invalid number of seat to reserve");
    }
  };

  return (
    <>
      {!props.booked.has(props.selectedConcert.id_c) && props.loggedIn ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "14vh" }}
        >
          <Form className="mt-4 w-50">
            <Form.Group as={Row} controlId="formSeatsToReserve">
              <Form.Label column sm="4">
                Number of Seats to Reserve:
              </Form.Label>
              <Col sm="4">
                <Form.Control
                  type="number"
                  min="1"
                  max={availableSeats}
                  value={numSeatsToReserve}
                  onChange={(e) => setNumSeatsToReserve(Number(e.target.value))}
                />
              </Col>
              <Col sm="4">
                <Button
                  variant="success"
                  onClick={handleReserveSeats}
                  disabled={numSeatsToReserve > availableSeats}
                >
                  Reserve Seats
                </Button>
              </Col>
            </Form.Group>
          </Form>

          {props.errors && <p className="text-danger mt-3">{props.errors}</p>}
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
    </>
  );
}

export { SeatForm };
