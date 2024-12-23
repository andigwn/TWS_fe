import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Form, Button, Alert } from "react-bootstrap";

const AuthLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUserName = (inputUsername) => {
    setUsername(inputUsername);
    setError("");
  };

  const handlePassword = (inputPassword) => {
    setPassword(inputPassword);
    setError("");
  };

  const userLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    const API_URL = import.meta.env.VITE_APP_API_URL;
    try {
      const response = await axios({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        url: `${API_URL}/api/users/login`,
        data: {
          username,
          password,
        },
      });

      // Check what we actually receive
      const token =
        response.data.data.token ||
        response.data.data.accessToken ||
        response.data.data.jwt;

      if (token) {
        // Store token
        localStorage.setItem("authToken", token);

        // If there's user data, store it
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        // Set axios default header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        console.log("Login successful, token stored:", token);
        navigate("/home");
      } else {
        console.log(
          "Token not found in response. Response structure:",
          response.data
        );
        // Check if we have any other authentication data
        if (typeof response.data === "object") {
          // Look for any property that might contain the token
          const possibleTokenKeys = Object.keys(response.data);
          console.log("Available response data keys:", possibleTokenKeys);
        }
        setError("Could not find authentication token in response");
      }
      const role = response.data.data.role;
      if (role !== "ADMIN") {
        setError("Something went wrong. Please try again.");
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response:", err.response.data);

      setError(
        err.response?.data?.errors ||
          err.errors ||
          "An error occurred during login. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div>
      {error && (
        <Alert variant="danger" className="w-50 mx-auto mb-4">
          {error}
        </Alert>
      )}
      <Form className="w-50 mx-auto my-4" onSubmit={userLogin}>
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(event) => handleUserName(event.target.value)}
            required
          />
        </Form.Group>
        <Form.Group>
          <Form.Label className="fw-bold">Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(event) => handlePassword(event.target.value)}
            required
          />
        </Form.Group>
        <Button
          className="mt-4 w-100"
          variant="primary"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </Form>
    </div>
  );
};

export default AuthLogin;
