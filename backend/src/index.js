import dotenv from 'dotenv';
import http from 'http';
import {app} from './app.js';
import connectDB from './db/connectDB.js';
import {initializeSocket} from './socket/socket.js';

dotenv.config({
  path: './env'
});

const PORT = process.env.PORT || 8000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io and attach middleware to Express
initializeSocket(server, app);

app.get('/',(req, res) =>{
  res.send('Server is running successfully')
});
// Connect to single MongoDB database and start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(` Server is running at: http://localhost:${PORT}`);
      console.log(` Socket.io initialized on port: ${PORT}`);
      console.log(` Health check endpoint: http://localhost:${PORT}/health\n`);
    });
  })
  .catch((err) => {
    console.error(' Failed to start server due to MongoDB error:', err.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
