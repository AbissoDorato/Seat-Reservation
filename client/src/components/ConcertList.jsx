import { useState } from "react";
import { Badge, Col, Container, Row, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function ConcertList({ theater, concert, onConcertSelect }) {
  const [openConcerts, setOpenConcerts] = useState([]); // Track multiple open concerts

  const handleToggleConcert = (concertId) => {
    setOpenConcerts((prev) => {
      if (prev.includes(concertId)) {
        return prev.filter((id) => id !== concertId); // Remove concert from the open list if clicked again
      } else {
        return [...prev, concertId]; // Add concert to the open list
      }
    });
  };

  if (!Array.isArray(concert)) {
    return <p>No concerts available.</p>; // Handle case where concert is not an array
  }

  return (
    <Container>
      {concert.map((c) => {
        const associatedTheatre = theater.find((th) => th.id_t === c.id_t);

        return (
          <ConcertItem
            key={c.id_c}
            concert={c}
            theatre={associatedTheatre}
            onConcertSelect={onConcertSelect}
            handleToggleConcert={handleToggleConcert}
            isOpen={openConcerts.includes(c.id_c)} // Check if concert is open
          />
        );
      })}
    </Container>
  );
}

function ConcertItem({
  concert,
  theatre,
  onConcertSelect,
  handleToggleConcert,
  isOpen,
}) {
  const navigate = useNavigate();

  const handleViewSeats = () => {
    onConcertSelect(concert); // Update the selected concert state in App
    navigate(`/concerts/${concert.id_c}/seats`);
  };

  return (
    <Card className="mb-3">
      <Card.Header onClick={() => handleToggleConcert(concert.id_c)}>
        <Row className="align-items-center">
          <Col md="auto">
            <Badge bg="secondary">
              <tt>{concert.id}</tt>
            </Badge>
          </Col>
          <Col
            md="auto"
            style={{ borderLeft: "1px solid grey", paddingLeft: "10px" }}
          >
            <h6 className="mb-0">{concert.title}</h6>
          </Col>
          <Col className="text-end">
            <Button variant="primary" size="sm" onClick={handleViewSeats}>
              Reserve Seats
            </Button>
          </Col>
        </Row>
      </Card.Header>
      {isOpen && theatre && (
        <Card.Body>
          <TheatreDetails theatre={theatre} />
        </Card.Body>
      )}
    </Card>
  );
}

function TheatreDetails({ theatre }) {
  return (
    <Card className="mt-3">
      <Card.Body>
        <Card.Title className="text-muted">{theatre.name}</Card.Title>
        <Row className="mb-2">
          <Col>
            <strong>Type:</strong> {theatre.type}
          </Col>
        </Row>
        <Row className="mb-2">
          <Col>
            <strong>Rows:</strong> {theatre.rows}
          </Col>
          <Col>
            <strong>Columns:</strong> {theatre.columns}
          </Col>
        </Row>
        <Row>
          <Col>
            <strong>Total Seats:</strong> {theatre.columns * theatre.rows}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export { ConcertList };
