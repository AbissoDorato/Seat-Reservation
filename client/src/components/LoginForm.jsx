import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import validator from "validator";

/**
 * The login page displayed on "/login"
 *
 * @param props.login callback to perform the actual login
 * @param props.errorAlertActive true when the error alert on the top is active and showing, false otherwise
 */
function LoginForm(props) {
  const [username, setUsername] = useState("s123456@example.com");
  const [password, setPassword] = useState("pwd");

  const [emailError, setEmailError] = useState("");
  const [passwordValid, setPasswordValid] = useState(true);

  const [waiting, setWaiting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const credentials = { username, password };

    // Validate form
    const trimmedEmail = username.trim();
    const emailError = validator.isEmpty(trimmedEmail)
      ? "Email must not be empty"
      : !validator.isEmail(trimmedEmail)
      ? "Not a valid email"
      : "";
    const passwordValid = !validator.isEmpty(password);

    if (!emailError && passwordValid) {
      setWaiting(true);
      setLoginError(""); // Resetta l'errore di login
      props
        .loginCbk(credentials)
        .then(() => setWaiting(false))
        .catch((err) => {
          setWaiting(false);
          setLoginError(
            err.error ||
              "Login failed. Please check your credentials and try again."
          );
        });
    } else {
      setEmailError(emailError);
      setPasswordValid(passwordValid);
    }
  };

  return (
    <Container
      fluid
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: "70vh", backgroundColor: "#ffffff" }}
    >
      <Row className="w-100 mb-3">
        <Col md="3" className="d-flex align-items-center justify-content-start">
          <Link
            to="/"
            className="btn btn-outline-secondary d-flex align-items-center"
          >
            <i
              className="bi bi-arrow-left-circle"
              style={{ fontSize: "1.5rem", marginRight: "0.5rem" }}
            />
            <span style={{ fontSize: "1.2rem" }}>Back to Home</span>
          </Link>
        </Col>
      </Row>
      <Row className="w-100 justify-content-center">
        <Col md="6">
          <Card
            className="shadow-lg"
            style={{
              borderRadius: "1rem",
              overflow: "hidden",
              border: "none",
              boxShadow: "0 0 15px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Card.Header
              className="text-center bg-light text-dark py-4"
              style={{
                fontSize: "1.5rem",
                backgroundColor: "#f8f9fa",
                color: "#000000",
              }}
            >
              Login
            </Card.Header>
            <Card.Body className="p-4">
              <Form noValidate onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    isInvalid={!!emailError}
                    type="email"
                    placeholder="mail@provider.com"
                    value={username}
                    autoFocus
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setEmailError("");
                      setLoginError("");
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {emailError}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    isInvalid={!passwordValid}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordValid(true);
                      setLoginError("");
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    Password must not be empty
                  </Form.Control.Feedback>
                </Form.Group>
                {loginError && (
                  <div className="alert alert-danger" role="alert">
                    {loginError}
                  </div>
                )}
                <div className="d-grid">
                  <Button
                    type="submit"
                    variant="dark"
                    size="lg"
                    disabled={waiting}
                  >
                    {waiting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />{" "}
                        Loading...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export { LoginForm };
