import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Snackbar,
  Alert,
  Box,
  Typography,
  Container,
  CssBaseline,
  createTheme,
  ThemeProvider,
} from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#007BFF",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://workflowbackend.onrender.com/SignIn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSnackbar({ open: true, message: "Login successful! Redirecting...", severity: "success" });
        localStorage.setItem("token", result.token); // Save token
        setTimeout(() => {
          navigate("/profile");
        }, 2000); // Redirect after 2 seconds
      } else {
        setSnackbar({ open: true, message: result.message || "Invalid email or password.", severity: "error" });
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
      setSnackbar({ open: true, message: "Server error. Please try again later.", severity: "error" });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container component="main" maxWidth="xs" sx={{ textAlign: "center" }}>
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography component="h1" variant="h4" sx={{ color: "#007BFF", fontWeight: 700 }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, color: "#555" }}>
            Please log in to your account
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              sx={{ bgcolor: "#f9f9f9", borderRadius: 1 }}
            />
            <TextField
              required
              fullWidth
              id="password"
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              sx={{ bgcolor: "#f9f9f9", borderRadius: 1 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{
                mt: 3,
                mb: 2,
                fontWeight: "bold",
                textTransform: "none",
                py: 1.5,
              }}
            >
              Log In
            </Button>
          </Box>
          <Button
                  onClick={() => navigate("/signup")}
                  variant="outlined"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2, fontWeight: "bold" }}
                >
                  Create new account
                </Button>
        </Box>
        {/* Snackbar for feedback */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default SignIn;
