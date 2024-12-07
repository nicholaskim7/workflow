import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

const StudySessionsPage = () => {
  const [studySessions, setStudySessions] = useState([]);

  useEffect(() => {
    const fetchStudySessions = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('https://workflowbackend.onrender.com/sessions', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch study sessions');
        }

        const sessionsData = await response.json();
        setStudySessions(sessionsData);
      } catch (err) {
        console.error('Error fetching study sessions:', err);
      }
    };

    fetchStudySessions();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Box sx={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
      <Typography variant="h4" align="center" gutterBottom>
        Study Sessions
      </Typography>
      <Paper sx={{ p: 2 }}>
        {studySessions.length === 0 ? (
          <Typography>No study sessions recorded.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell align="center"><strong>Duration</strong></TableCell>
                  <TableCell align="right"><strong>Date Added</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studySessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.text}</TableCell>
                    <TableCell align="center">{session.formatted_duration}</TableCell>
                    <TableCell align="right">{formatDate(session.date_added)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default StudySessionsPage;
