import React from 'react';
import { AppBar, Box, Toolbar, Typography, Button, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          {/* <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton> */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Workflow
          </Typography>
          <Button color="inherit" component={Link} to="/profile">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/study-sessions">
            Study History
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
