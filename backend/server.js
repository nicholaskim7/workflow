const http = require('http');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Use dynamic port from environment (Render will provide it)
const hostname = 'localhost';
const port = process.env.PORT || 5000;

// JWT secret key from environment variable
const JWT_SECRET = process.env.JWT_SECRET; 

// MySQL connection using environment variables
const connection = mysql.createConnection({
    host: process.env.DB_HOST, // MySQL host (RDS endpoint)
    user: process.env.DB_USER, // MySQL username
    password: process.env.DB_PASSWORD, // MySQL password
    database: process.env.DB_NAME, // Database name
    port: process.env.DB_PORT || 3306, // MySQL port, default to 3306 if not set
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    process.exit(1); // Exit on failure
  }
  console.log('Connected to MySQL database as id ' + connection.threadId);
});

// Helper to parse request body data
const getRequestData = async (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));
    req.on('end', () => resolve(JSON.parse(body || '{}')));
    req.on('error', reject);
  });
};

// Middleware to authenticate JWT token
const authenticateToken = (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'No token provided' }));
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Invalid token' }));
    return null;
  }
};


const convertDurationToSeconds = (durationString) => {
  const [hours, minutes, seconds] = durationString.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds; // Convert to total seconds
};


// Create an HTTP server
const server = http.createServer(async (req, res) => {
  //res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Origin', 'https://resplendent-flan-5b58bf.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  console.log(`Incoming request: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // SignUp Route
    if (req.method === 'POST' && req.url === '/SignUp') {
      const user = await getRequestData(req);
      if (!user.username || !user.email || !user.password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Missing required fields' }));
        return;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      const insertSql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
      const values = [user.username, user.email, hashedPassword];

      connection.query(insertSql, values, (err) => {
        if (err) {
          console.error('Error inserting user data:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Error inserting user data: ${err.message}` }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User Information Added Successfully' }));
      });
    }

    // SignIn Route
    else if (req.method === 'POST' && req.url === '/SignIn') {
      const { email, password } = await getRequestData(req);

      if (!email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Missing email or password' }));
        return;
      }

      connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Database query error' }));
          return;
        }

        if (results.length === 0) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid email or password' }));
          return;
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid email or password' }));
          return;
        }

        const token = jwt.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Login successful', token }));
      });
    }

    // ProfilePage2 Route
    else if (req.method === 'GET' && req.url === '/ProfilePage2') {
      const decoded = authenticateToken(req, res);
      if (!decoded) return;

      const query = 'SELECT user_id, username, email FROM users WHERE email = ?';
      connection.query(query, [decoded.email], (err, results) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Database error' }));
          return;
        }

        if (results.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'User not found' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(results[0]));
        }
      });
    }

    // Fetch tasks for the authenticated user
    else if (req.method === 'GET' && req.url === '/tasks') {
        const decoded = authenticateToken(req, res);
        if (!decoded) return;
    
        const query = 'SELECT * FROM tasks WHERE user_id = ? AND flagged = FALSE';
        connection.query(query, [decoded.user_id], (err, results) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Database error' }));
            return;
        }
    
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
        });
    }


    // Fetch archived tasks for the authenticated user
    else if (req.method === 'GET' && req.url === '/archived-tasks') {
        const decoded = authenticateToken(req, res);
        if (!decoded) return;
    
        const query = 'SELECT * FROM tasks WHERE user_id = ? AND flagged = TRUE';
        connection.query(query, [decoded.user_id], (err, results) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Database error' }));
            return;
        }
    
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
        });
    }


    // Add a new task
    else if (req.method === 'POST' && req.url === '/tasks') {
        const decoded = authenticateToken(req, res);
        if (!decoded) return;

        console.log('Decoded token:', decoded);
    
        const taskData = await getRequestData(req);
        if (!taskData.text) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Task text is required' }));
        return;
        }
    
        const insertSql = 'INSERT INTO tasks (user_id, text, completed, flagged) VALUES (?, ?, ?, ?)';
        const values = [decoded.user_id, taskData.text, false, false];

        console.log("Executing query:", insertSql, values);
    
        connection.query(insertSql, values, (err, results) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `Error adding task: ${err.message}` }));
            return;
        }
    
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: results.insertId, ...taskData }));
        });
    }


    // Flag a task by ID instead of deleting it
    else if (req.method === 'DELETE' && req.url.startsWith('/tasks/')) {
        const decoded = authenticateToken(req, res);
        if (!decoded) return;
    
        const taskId = req.url.split('/')[2];
    
        // Update the task's 'flagged' status to true
        const flagSql = 'UPDATE tasks SET flagged = TRUE WHERE id = ? AND user_id = ?';
    
        connection.query(flagSql, [taskId, decoded.user_id], (err, results) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error flagging task' }));
                return;
            }
    
            if (results.affectedRows === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Task not found or not authorized' }));
                return;
            }
    
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Task flagged successfully' }));
        });
    }

        
    // Update task status (e.g., mark as completed)
    else if (req.method === 'PATCH' && req.url.startsWith('/tasks/complete/')) {
        const decoded = authenticateToken(req, res);
        if (!decoded) return;
    
        const taskId = req.url.split('/')[3];
        const taskData = await getRequestData(req);
        const completed = taskData.completed !== undefined ? taskData.completed : false;
    
        const updateSql = 'UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?';
        connection.query(updateSql, [completed, taskId, decoded.user_id], (err, results) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error updating task' }));
            return;
        }
    
        if (results.affectedRows === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Task not found or not authorized' }));
            return;
        }
    
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Task updated successfully' }));
        });
    }


    // Update the flagged status of a task (Unarchive)
    else if (req.method === 'PATCH' && req.url.startsWith('/tasks/unarchive/')) {
        const decoded = authenticateToken(req, res);
        if (!decoded) return;
    
        // Extract taskId using regex for better clarity
        const taskIdMatch = req.url.match(/\/tasks\/unarchive\/(\d+)/);
        if (!taskIdMatch) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Invalid task ID format' }));
            return;
        }
        const taskId = taskIdMatch[1];
    
        const { flagged } = req.body; // Expecting flagged to be a boolean value (false for unarchive)
    
        if (typeof flagged !== 'boolean') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Invalid value for flagged, expected a boolean' }));
            return;
        }
    
        const updateSql = 'UPDATE tasks SET flagged = ? WHERE id = ? AND user_id = ?';
    
        connection.query(updateSql, [flagged, taskId, decoded.user_id], (err, results) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error updating task in database', error: err }));
                return;
            }
    
            if (results.affectedRows === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Task not found or not authorized to update this task' }));
                return;
            }
    
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Task unarchived successfully' }));
        });
    }

        
    //fetch users study session history
    else if (req.method === 'GET' && req.url === '/sessions') {
      const decoded = authenticateToken(req, res);
      if (!decoded) return;
    
      // Modify the query to include SEC_TO_TIME for duration formatting
      const query = 'SELECT id, text, SEC_TO_TIME(duration) AS formatted_duration, date_added FROM sessions WHERE user_id = ?';
      connection.query(query, [decoded.user_id], (err, results) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Database error' }));
          return;
        }
    
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
      });
    }


    //add completed study session to users history upon logout or reset of timer
    else if (req.method === 'POST' && req.url === '/sessions') {
      const decoded = authenticateToken(req, res);
      if (!decoded) return;
    
      const studyData = await getRequestData(req);
      console.log("Received duration:", studyData.duration);
      if (!studyData.text || !studyData.duration) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Study text and duration are required' }));
        return;
      }
    
      // Convert duration to seconds if it's a time string (e.g., '00:45:00')
      let durationInSeconds = studyData.duration;
      if (typeof durationInSeconds === 'string') {
        durationInSeconds = convertDurationToSeconds(studyData.duration);
      }
      console.log("Converted to seconds:", durationInSeconds);
    
      // Insert session into the database with the duration in seconds
      const insertSql = 'INSERT INTO sessions (user_id, text, duration, date_added) VALUES (?, ?, ?, NOW())';
      const values = [decoded.user_id, studyData.text, durationInSeconds];
    
      connection.query(insertSql, values, (err, results) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error adding study session: ' + err.message }));
          return;
        }
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: results.insertId, text: studyData.text, duration: durationInSeconds }));
      });
    }


    // Default route
    else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Route not found' }));
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Internal server error' }));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});
