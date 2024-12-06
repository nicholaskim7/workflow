import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, List, ListItem, IconButton, Typography, Box, Paper, Divider, Checkbox } from "@mui/material";
import { PlayArrow, Pause, Replay, Add, Delete } from "@mui/icons-material";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState({ seconds: 0, isRunning: false });
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
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
        const response = await fetch("http://localhost:5000/ProfilePage2", {
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
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("An error occurred while fetching your profile.");
      }
    };

    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("http://localhost:5000/tasks", {
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

    fetchProfile();
  }, [navigate]);

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
        const response = await fetch("http://localhost:5000/tasks", {
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
      const response = await fetch(`http://localhost:5000/tasks/${id}`, {
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
      const response = await fetch(`http://localhost:5000/tasks/${id}`, {
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

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
      <Typography variant="body1" align="center" gutterBottom>
        Email: {profile.email}
      </Typography>
      <Divider sx={{ my: 3 }} />

      {/* Timer Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Study Timer</Typography>
        <Typography variant="h3" align="center" gutterBottom>
          {formatTime(timer.seconds)}
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
            variant="contained"
            startIcon={<Replay />}
            onClick={() => setTimer({ seconds: 0, isRunning: false })}
          >
            Reset
          </Button>
        </Box>
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
