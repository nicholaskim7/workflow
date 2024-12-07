import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, List, ListItem, IconButton, Typography, Box, Paper, Divider, Checkbox, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { PlayArrow, Pause, Replay, Add, Delete, ExpandMore } from "@mui/icons-material";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState({ seconds: 0, isRunning: false });
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  //const [studySessions, setStudySessions] = useState([]);
  const [sessionText, setSessionText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You are not logged in. Redirecting to login...");
      setTimeout(() => navigate("/signin"), 2000);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("https://workflowbackend.onrender.com/ProfilePage2", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError("Session expired. Please log in again.");
            localStorage.removeItem("token");
            setTimeout(() => navigate("/signin"), 2000);
          } else {
            setError("Failed to fetch profile. Please try again later.");
          }
          return;
        }

        const data = await response.json();
        setProfile(data);
        fetchTasks();  // Fetch tasks once profile is loaded
        //fetchStudySessions();
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("An error occurred while fetching your profile.");
      }
    };

    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("https://workflowbackend.onrender.com/tasks", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const tasksData = await response.json();
        setTasks(tasksData);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    // const fetchStudySessions = async () => {
    //   const token = localStorage.getItem("token");
    //   try {
    //     const response = await fetch("https://workflowbackend.onrender.com/sessions", {
    //       method: "GET",
    //       headers: { Authorization: `Bearer ${token}` },
    //     });

    //     if (!response.ok) {
    //       throw new Error("Failed to fetch study sessions");
    //     }

    //     const sessionsData = await response.json();
    //     console.log(sessionsData);  // Log to see the response
    //     setStudySessions(sessionsData);
    //   } catch (err) {
    //     console.error("Error fetching study sessions:", err);
    //   }
    // };

    fetchProfile();
    //fetchStudySessions();
  }, [navigate]);


  // Timer logic with persistence
  useEffect(() => {
    const savedTimer = JSON.parse(localStorage.getItem("timer"));
    if (savedTimer) {
      const { isRunning, seconds, startTime } = savedTimer;
      if (isRunning) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setTimer({
          ...savedTimer,
          seconds: seconds + elapsed,
        });
      } else {
        setTimer(savedTimer);
      }
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem(
      "timer",
      JSON.stringify({
        ...timer,
        startTime: timer.isRunning ? Date.now() : null,
      })
    );
  }, [timer]);

  
  // Persist session text
  useEffect(() => {
    const savedSessionText = localStorage.getItem("sessionText");
    if (savedSessionText) setSessionText(savedSessionText);
  }, []);

  useEffect(() => {
    localStorage.setItem("sessionText", sessionText);
  }, [sessionText]);
  


  // Timer logic
  useEffect(() => {
    let interval;
    if (timer.isRunning) {
      interval = setInterval(() => setTimer((prev) => ({ ...prev, seconds: prev.seconds + 1 })), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning]);

  const handleTaskAdd = async () => {
    if (newTask.trim()) {
      const token = localStorage.getItem("token");
      const taskData = { text: newTask, completed: false };
  
      try {
        console.log("Adding task:", taskData);  // Log the task data
        const response = await fetch("https://workflowbackend.onrender.com/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        });
  
        if (response.ok) {
          const newTaskData = await response.json();
          console.log("New task added:", newTaskData);  // Log the response
          setTasks([...tasks, newTaskData]);
          setNewTask(""); // Reset input field
        } else {
          console.error("Failed to add task:", response.statusText);
          throw new Error("Failed to add task");
        }
      } catch (err) {
        console.error("Error adding task:", err);
      }
    }
  };

  const handleTaskDelete = async (id) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`https://workflowbackend.onrender.com/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== id));
      } else {
        throw new Error("Failed to delete task");
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleTaskCompletionToggle = async (id, completed) => {
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch(`https://workflowbackend.onrender.com/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !completed }),
      });
  
      if (response.ok) {
        const updatedTasks = tasks.map((task) =>
          task.id === id ? { ...task, completed: !completed } : task
        );
        setTasks(updatedTasks);
      } else {
        throw new Error("Failed to update task completion");
      }
    } catch (err) {
      console.error("Error updating task completion:", err);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
  
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleTimerReset = async () => {
    const token = localStorage.getItem("token");
    const savedTimer = JSON.parse(localStorage.getItem("timer")) || { seconds: 0 };
    //const secondsDuration = timer.seconds;
    const secondsDuration = savedTimer.seconds || timer.seconds;
    console.log("Seconds duration sent to backend:", secondsDuration);
    
  
    const sessionData = { text: sessionText || "Study session", duration: secondsDuration };
  
    try {
      const response = await fetch("https://workflowbackend.onrender.com/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });
      if (response.ok) {
        console.log("Session data successfully recorded");
      } else {
        console.error("Error recording study session");
      }
    } catch (err) {
      console.error("Error posting session data:", err);
    }
    setTimer({ seconds: 0, isRunning: false });
    setSessionText("");
  };

  // const formatDate = (dateString) => {
  //   const date = new Date(dateString);
  //   const options = {
  //     year: "numeric",
  //     month: "2-digit",
  //     day: "2-digit",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //     second: "2-digit",
  //   };
  //   return date.toLocaleString(undefined, options);
  // };


  if (error) {
    return <div style={{ textAlign: "center", marginTop: "20px", color: "red" }}>{error}</div>;
  }

  if (!profile) {
    return <div style={{ textAlign: "center", marginTop: "20px" }}>Loading your profile...</div>;
  }

  return (
    <Box sx={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <Typography variant="h4" align="center" gutterBottom>
        Welcome, {profile.username}!
      </Typography>
      {/* <Typography variant="body1" align="center" gutterBottom>
        Email: {profile.email}
      </Typography> */}
      <Divider sx={{ my: 3 }} />

      {/* Study Sessions History (Expandable) */}
      {/* <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Study Sessions</Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Click to view Study Sessions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {studySessions.length === 0 ? (
              <Typography variant="body1">No study sessions recorded.</Typography>
            ) : (
              <List>
                {studySessions.map((session) => (
                  <ListItem key={session.id}>
                    {session.text} - {session.formatted_duration} - {formatDate(session.date_added)}
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>
      </Paper> */}

      {/* Timer Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Study Timer</Typography>
        <Typography variant="h3" align="center" gutterBottom>
          {formatDuration(timer.seconds)}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={() => setTimer({ ...timer, isRunning: true })}
            disabled={timer.isRunning}
          >
            Start
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Pause />}
            onClick={() => setTimer({ ...timer, isRunning: false })}
            disabled={!timer.isRunning}
          >
            Pause
          </Button>
          <Button
            onClick={handleTimerReset}
            variant="contained"
            startIcon={<Replay />}
          >
            Record & Reset
          </Button>
        </Box>
        
        <TextField
          fullWidth
          label="Session Description"
          value={sessionText}
          onChange={(e) => setSessionText(e.target.value)}
          variant="outlined"
          margin="normal"
        />
      </Paper>

      {/* To-Do List Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">To-Do List</Typography>
        <Box sx={{ display: "flex", mt: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="New Task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <IconButton color="primary" onClick={handleTaskAdd}>
            <Add />
          </IconButton>
        </Box>
        <List>
          {tasks.map((task) => (
            <ListItem
              key={task.id}
              secondaryAction={
                <IconButton edge="end" color="error" onClick={() => handleTaskDelete(task.id)}>
                  <Delete />
                </IconButton>
              }
              style={task.completed ? { textDecoration: "line-through", color: "gray" } : {}}
            >
              <Checkbox
                checked={task.completed}
                onChange={() => handleTaskCompletionToggle(task.id, task.completed)}
                color="primary"
              />
              {task.text}
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Logout Button */}
      <Button
        fullWidth
        variant="contained"
        color="error"
        onClick={() => {
          localStorage.removeItem("token");
          navigate("/signin");
        }}
      >
        Log Out
      </Button>
    </Box>
  );
};

export default ProfilePage;
