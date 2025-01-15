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

      const query = 'SELECT user_id, username, email, user_level FROM users WHERE email = ?';
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


    // Update account information
    else if (req.method === 'PATCH' && req.url === '/update-account') {
        const decoded = authenticateToken(req, res);
        if (!decoded) return;
    
        const userData = await getRequestData(req);
        const { username, email, password } = userData;
    
        if (!username && !email && !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'No fields provided to update.' }));
            return;
        }
    
        // Prepare fields and values for the SQL query
        const fields = [];
        const values = [];
    
        if (username) {
            fields.push('username = ?');
            values.push(username);
        }
        if (email) {
            fields.push('email = ?');
            values.push(email);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            fields.push('password = ?');
            values.push(hashedPassword);
        }
    
        if (fields.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'No valid fields to update.' }));
            return;
        }
    
        values.push(decoded.user_id); // Add user_id for the WHERE clause
    
        const updateSql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    
        connection.query(updateSql, values, (err, results) => {
            if (err) {
                console.error('Error updating user data:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Failed to update account information.' }));
                return;
            }
    
            if (results.affectedRows === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'User not found.' }));
                return;
            }
    
            // Create a new JWT token for the updated user
            const newToken = jwt.sign(
                { user_id: decoded.user_id, username: decoded.username, email: email || decoded.email },
                'your-secret-key', // Replace with your actual secret key
                { expiresIn: '1h' } // Set the token expiry time
            );
    
            // Return the updated token in the response
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: 'Account information updated successfully.',
                newToken: newToken, // Include the new token
            }));
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
    
        const taskId = req.url.split('/')[3];
        const taskData = await getRequestData(req);
        const flagged = taskData.flagged !== undefined ? taskData.flagged : false;  // Use false for unarchiving (flagged = 0)
    
        const updateSql = 'UPDATE tasks SET flagged = ? WHERE id = ? AND user_id = ?';
    
        connection.query(updateSql, [flagged ? 1 : 0, taskId, decoded.user_id], (err, results) => {
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


    // Fetch top locked-in users based on total study hours
    else if (req.method === 'GET' && req.url.startsWith('/top-users')) {
      const decoded = authenticateToken(req, res);
    
      // Check if the user is authenticated
      if (!decoded) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unauthorized' }));
        return;
      }
    
      // Extract timeframe from query parameters
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      const timeframe = parsedUrl.searchParams.get('timeframe') || 'all-time'; // Default to 'all-time'
    
      // Validate timeframe
      const validTimeframes = ['today', 'this-month', 'this-year', 'all-time'];
      if (!validTimeframes.includes(timeframe)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid timeframe parameter' }));
        return;
      }
    
      // Build SQL query and parameters
      let query;
      const params = [];
    
      if (timeframe === 'this-month') {
        query = `
          SELECT users.user_id, users.username, users.user_level,
                 IFNULL(SUM(sessions.duration) / 3600, 0) AS total_hours
          FROM users
          LEFT JOIN sessions ON users.user_id = sessions.user_id
          WHERE MONTH(sessions.date_added) = MONTH(CURRENT_DATE())
            AND YEAR(sessions.date_added) = YEAR(CURRENT_DATE())
          GROUP BY users.user_id
          ORDER BY total_hours DESC
          LIMIT 20;
        `;
      } else if (timeframe === 'this-year') {
        query = `
          SELECT users.user_id, users.username, users.user_level,
                 IFNULL(SUM(sessions.duration) / 3600, 0) AS total_hours
          FROM users
          LEFT JOIN sessions ON users.user_id = sessions.user_id
          WHERE YEAR(sessions.date_added) = YEAR(CURRENT_DATE())
          GROUP BY users.user_id
          ORDER BY total_hours DESC
          LIMIT 20;
        `;
      } else if (timeframe === 'today') {
        query = `
          SELECT users.user_id, users.username, users.user_level,
                 IFNULL(SUM(sessions.duration) / 3600, 0) AS total_hours
          FROM users
          LEFT JOIN sessions ON users.user_id = sessions.user_id
          WHERE DATE(sessions.date_added) = CURRENT_DATE()
          GROUP BY users.user_id
          ORDER BY total_hours DESC
          LIMIT 20;
        `;
      } else {
        // Default: All-time
        query = `
          SELECT users.user_id, users.username, users.user_level,
                 IFNULL(SUM(sessions.duration) / 3600, 0) AS total_hours
          FROM users
          LEFT JOIN sessions ON users.user_id = sessions.user_id
          GROUP BY users.user_id
          ORDER BY total_hours DESC
          LIMIT 20;
        `;
      }
    
      // Execute the query
      connection.query(query, params, (err, results) => {
        if (err) {
          console.error('Database error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Database error', error: err.message }));
          return;
        }
    
        // Ensure total_hours is never null or undefined
        results = results.map(user => ({
          ...user,
          total_hours: user.total_hours ? user.total_hours : 0
        }));
    
        // Send results
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

    else if (req.method === 'POST' && req.url === '/blog') {
    const decoded = authenticateToken(req, res);
    if (!decoded) return;

    const { topic, title, text } = await getRequestData(req);
    if (!topic || !title || !text) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Missing topic, title, or text' }));
        return;
    }

    // Add CURDATE() for created_at to insert the current date automatically
    const insertSql = 'INSERT INTO blogs (user_id, topic, title, text, created_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP())';
    const values = [decoded.user_id, topic, title, text];

    connection.query(insertSql, values, (err) => {
        if (err) {
            console.error('Error inserting blog post:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Database error' }));
            return;
        }

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Blog post created successfully' }));
    });
}

//fetch blog posts
  else if (req.method === 'GET' && req.url === '/blog') {
    const decoded = authenticateToken(req, res);
    if (!decoded) return;
  
    
    const query = 'SELECT blog_id, topic, text, title, created_at FROM blogs WHERE user_id = ? AND flagged = FALSE';
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

  //fetch blog post to update
  if (req.method === 'GET' && req.url.startsWith('/post/')) {
    const blogId = req.url.split('/')[2];  // Extract the blog_id from the URL

    if (!blogId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Blog ID is required.' }));
        return;
    }

    try {
        // Query to get the blog post by blog_id
        const query = 'SELECT * FROM blogs WHERE blog_id = ?';
        const result = await executeQuery(query, [blogId]);

        if (result.length > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result[0])); // Send the blog data as response
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Post not found.' }));
        }
    } catch (err) {
        console.error('Error fetching post:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Failed to fetch post.' }));
    }
}


//update blog post
if (req.method === 'PATCH' && req.url.startsWith('/post/')) {
    const blogId = req.url.split('/')[2];  // Extract the blog_id from the URL

    const decoded = authenticateToken(req, res);
    if (!decoded) return;

    const PostData = await getRequestData(req);
    const { topic, title, text } = PostData;

    if (!topic && !title && !text) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'No fields provided to update.' }));
        return;
    }

    const fields = [];
    const values = [];

    if (topic) {
        fields.push('topic = ?');
        values.push(topic);
    }
    if (title) {
        fields.push('title = ?');
        values.push(title);
    }
    if (text) {
        fields.push('text = ?');
        values.push(text);
    }

    values.push(blogId);
    values.push(decoded.user_id);

    const query = `UPDATE blogs SET ${fields.join(', ')} WHERE blog_id = ? AND user_id = ?`;

    try {
        const result = await executeQuery(query, values);

        if (result.affectedRows > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Post updated successfully.' }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Post not found or unauthorized.' }));
        }
    } catch (err) {
        console.error('Error updating post:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Failed to update post.' }));
    }
}


  //fetch all blog posts
  else if (req.method === 'GET' && req.url === '/blog-all') {
    const decoded = authenticateToken(req, res);

    if (!decoded) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Unauthorized' }));
      return;
    }
    
    const query = `
        SELECT 
            b.blog_id, 
            b.topic, 
            b.text, 
            b.title, 
            b.created_at, 
            u.username
        FROM 
            blogs b
        JOIN 
            users u 
        ON 
            b.user_id = u.user_id
        WHERE 
            b.flagged = FALSE;
    `;
    connection.query(query, (err, results) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Database error' }));
        return;
      }
  
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
  }

      
  else if (req.method === 'GET' && req.url.startsWith('/blog-search')) {
  const decoded = authenticateToken(req, res);

  if (!decoded) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Unauthorized' }));
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const topic = url.searchParams.get('topic');
  const username = url.searchParams.get('username');
  const title = url.searchParams.get('title');

  let query = `
      SELECT 
          b.blog_id, 
          b.topic, 
          b.text, 
          b.title, 
          b.created_at, 
          u.username
      FROM 
          blogs b
      JOIN 
          users u 
      ON 
          b.user_id = u.user_id
      WHERE 
          b.flagged = FALSE
  `;

  const conditions = [];
  const params = [];
  if (topic) {
    conditions.push('b.topic LIKE ?');
    params.push(`%${topic}%`);
  }
  if (username) {
    conditions.push('u.username LIKE ?');
    params.push(`%${username}%`);
  }
  if (title) {
    conditions.push('b.title LIKE ?');
    params.push(`%${title}%`);
  }

  if (conditions.length > 0) {
    query += ` AND (${conditions.join(' OR ')})`;
  }

  connection.query(query, params, (err, results) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Database error' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
  });
}

  // Flag a post by ID instead of deleting it
    else if (req.method === 'DELETE' && req.url.startsWith('/post/')) {
        const decoded = authenticateToken(req, res);
        if (!decoded) return;
    
        const postId = req.url.split('/')[2];
    
        // Update the task's 'flagged' status to true
        const flagSql = 'UPDATE blogs SET flagged = TRUE WHERE blog_id = ? AND user_id = ?';
    
        connection.query(flagSql, [postId, decoded.user_id], (err, results) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error flagging post' }));
                return;
            }
    
            if (results.affectedRows === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Post not found or not authorized' }));
                return;
            }
    
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Post flagged successfully' }));
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
