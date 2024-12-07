import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import SignUp from "./SignUp";
import SignIn from "./SignIn";
import ProfilePage from "./ProfilePage";
import LandingPage from "./LandingPage";
import MissionStatement from "./MissionStatement";
import StudySessionsPage from './StudySessionsPage';
import NavBar from "./NavBar";

function App() {
  return (
    <Router>
      <ConditionalNavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/our-mission" element={<MissionStatement />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/study-sessions" element={<StudySessionsPage />} />
      </Routes>
    </Router>
  );
}

// ConditionalNavBar Component
function ConditionalNavBar() {
  const location = useLocation();

  // Only render the NavBar on the ProfilePage route
  if (location.pathname === "/profile" || location.pathname === "/study-sessions") {
    return <NavBar />;
  }

  return null; // Don't render NavBar on other pages
}

export default App;
