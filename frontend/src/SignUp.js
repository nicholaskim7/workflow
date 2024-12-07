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
  Grid,
  Paper,
} from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#007BFF", // Facebook-like blue
    },
  },
});

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
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
      const response = await fetch("https://workflowbackend.onrender.com/SignUp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSnackbar({ open: true, message: "Sign-up successful! Redirecting...", severity: "success" });
        setTimeout(() => {
          navigate("/signin");
        }, 2000); // Redirect after 2 seconds
      } else {
        setSnackbar({ open: true, message: result.message || "Sign-up failed. Try again.", severity: "error" });
      }
    } catch (error) {
      console.error("Error during sign-up:", error);
      setSnackbar({ open: true, message: "Server error. Please try again later.", severity: "error" });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container component="main" maxWidth="lg" sx={{ mt: 5 }}>
        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid item xs={12} md={6}>
            <Typography variant="h2" color="primary" gutterBottom>
              Join Workflow Today
            </Typography>
            <Typography variant="h6" gutterBottom>
              Manage your tasks, stay organized, and achieve your goals effortlessly.
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Sign up now and take the first step toward productivity!
            </Typography>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Typography component="h1" variant="h5" align="center" gutterBottom>
                Sign Up
              </Typography>
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  margin="normal"
                />
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                />
                <TextField
                  required
                  fullWidth
                  id="password"
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  sx={{ mt: 3, mb: 2, fontWeight: "bold" }}
                >
                  Sign Up
                </Button>
                <Button
                  onClick={() => navigate("/signin")}
                  variant="outlined"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2, fontWeight: "bold" }}
                >
                  Already have an account? Sign In
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

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

export default SignUp;
