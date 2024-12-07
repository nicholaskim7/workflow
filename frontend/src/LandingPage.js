import React from "react";
import { Box, Button, Container, Typography, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f7f9fc",
        padding: 2,
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: "center" }}>
        {/* Logo Placeholder */}
        <Box
          sx={{
            width: 80,
            height: 80,
            backgroundColor: "#007BFF",
            borderRadius: "50%",
            margin: "0 auto 16px auto",
          }}
        ></Box>

        {/* Title */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: "bold",
            marginBottom: 2,
            color: "#333333",
          }}
        >
          Productivity Made Simple
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="subtitle1"
          sx={{
            color: "#555555",
            marginBottom: 4,
          }}
        >
          Stay organized, increase focus, and get things done effortlessly with
          our intuitive productivity tools.
        </Typography>

        {/* Call-to-Action Buttons */}
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
          <Button
            onClick={() => navigate("/our-mission")}
            variant="outlined"
            sx={{
              borderColor: "#007BFF",
              color: "#007BFF",
              "&:hover": { backgroundColor: "#e6f2ff" },
            }}
          >
            Learn More
          </Button>
        </Stack>
      </Container>

      {/* Footer */}
      <Typography variant="body2" sx={{ color: "#999999", marginTop: 2 }}>
        © 2024 Workflow, by Nicholas Kim. All rights reserved.
      </Typography>
    </Box>
  );
};

export default LandingPage;
