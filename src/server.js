require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const http = require('http');
const socketConfig = require('./config/socket');

const PORT = process.env.PORT || 5000;

// Connect to database then start server
connectDB().then(() => {
  const server = http.createServer(app);
  
  // Initialize Socket.io
  socketConfig.init(server);

  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});
