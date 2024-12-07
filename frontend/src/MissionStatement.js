import React from "react";
import { Box, Button, Typography, Container, CssBaseline, createTheme, ThemeProvider, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

const theme = createTheme({
  palette: {
    primary: {
      main: "#007BFF",
    },
    text: {
      primary: "#333",
    },
    background: {
      default: "#fff",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: {
      fontWeight: 600,
      marginBottom: "16px",
    },
    body1: {
      fontSize: "1.2rem",
      lineHeight: "1.6",
    },
  },
});

const MissionStatement = () => {
  const navigate = useNavigate();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container component="main" maxWidth="md" sx={{ py: 8 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Typography variant="h4" color="primary">
            Our Mission
          </Typography>
          <Typography variant="body1" color="textPrimary" sx={{ mt: 2, mb: 4 }}>
            At <strong>Workflow</strong>, our mission is to make learning cool and productivity simple.
            We strive to create tools that simplify the day to day lives of students, business professionals, and hobbyists.
            In today's loud, technology-driven world, we strive to enhance productivity while cutting through the noise.
          </Typography>
          <Typography variant="body1" color="textPrimary">
            Together, let's build a world where productivity is simple and learning is cool!
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ marginBottom: 4 }}
          >
            <Button
              onClick={() => navigate("/signup")}
              variant="contained"
              sx={{
                backgroundColor: "#007BFF",
                color: "#ffffff",
                "&:hover": { backgroundColor: "#0056b3" },
              }}
            >
              Get Started
            </Button>
          </Stack>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default MissionStatement;
