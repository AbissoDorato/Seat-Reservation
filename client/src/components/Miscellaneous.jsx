import ListGroup from "react-bootstrap/ListGroup";
import { createContext } from "react";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Button,
  Row,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../API";

function MyNavbar(props) {
  const navigate = useNavigate();
  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="#home">Tomodachi Events</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto"></Nav>

            {props.user ? (
              <Navbar.Text>
                Logged in as: {props.user.name} |{" "}
                <a
                  href="/logout"
                  onClick={(event) => {
                    event.preventDefault();
                    props.logoutCbk();
                  }}
                >
                  Logout
                </a>
              </Navbar.Text>
            ) : (
              <Nav.Link
                href="/login"
                active={false}
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/login");
                }}
              >
                Login <i className="bi bi-person-fill" />
              </Nav.Link>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}

function NotFoundPage() {
  return (
    <>
      <div style={{ textAlign: "center", paddingTop: "5rem" }}>
        <h1>
          <i className="bi bi-exclamation-circle-fill" /> The page cannot be
          found <i className="bi bi-exclamation-circle-fill" />
        </h1>
        <br />
        <p>
          The requested page does not exist, please head back to the{" "}
          <Link to={"/"}>app</Link>.
        </p>
      </div>
    </>
  );
}

function ReservationRow({ reservation, deleteReservation }) {
  return (
    <div className="row align-items-center mb-2">
      <div className="col">{reservation.concert_name}</div>
      <div className="col">
        {`Row: ${reservation.row_occupied}, Column: ${reservation.column_occupied}`}
      </div>
      <div className="col-auto">
        <Button
          variant="danger"
          onClick={() => deleteReservation(reservation.id).then()}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

function Reservation(props) {
  const reservation = props.reservation;
  const userName = props.user?.name || "Unknown";

  return (
    <Container className="mt-5">
      <h2>Reservation for: {userName}</h2>{" "}
      {reservation && reservation.length > 0 ? (
        reservation.map((res) => (
          <ReservationRow
            key={res.id}
            reservation={res}
            deleteReservation={props.deleteReservation}
          />
        ))
      ) : (
        <p>No reservations available</p>
      )}
    </Container>
  );
}
export { MyNavbar, NotFoundPage, Reservation };
