import React from "react";
import { Alert } from "react-bootstrap";

function ErrorsAlert(props) {
  return (
    <Alert variant="danger" onClose={props.clear} dismissible>
      <ul>
        {props.errors.map((error, idx) => (
          <li key={idx}>{error.toString()}</li>
        ))}
      </ul>
    </Alert>
  );
}

export { ErrorsAlert };
