import React from "react";
import { Container } from "react-bootstrap";
import AuthLogin from "../hooks/auth";

function Login({ title }) {
  return (
    <Container>
      <div className="d-flex justify-content-center fw-bold h3 my-4">
        {title}
      </div>
      <AuthLogin />
    </Container>
  );
}

export default Login;
