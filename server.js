// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./backend/routes/auth');
const eventsRoutes = require('./backend/routes/events'); 
const User = require('./backend/models/User');
const studentRoutes = require('./backend/routes/student');
const adminRoutes = require('./backend/routes/admin');
const notificationRoutes = require('./backend/routes/notifications');
const { startEventStatusUpdater } = require('./backend/jobs/eventStatusUpdater');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      initializeAdmin();
      startEventStatusUpdater();
    })
    .catch(err => console.error('MongoDB connection error:', err));


// Admin Initialization if they dont exist
const initializeAdmin = async () => {
  try {
      const adminExists = await User.findOne({ schoolId: process.env.ADMIN_ID });
      if (!adminExists) {
          await User.create({
              name: 'System Admin',
              schoolId: process.env.ADMIN_ID,
              password: process.env.ADMIN_PASSWORD,
              role: 'admin',
              email: 'admin@example.com', // Add a valid email
              firstName: 'System',       // Add a first name
              lastName: 'Admin'          // Add a last name
          });
          console.log('Admin user initialized');
      }
  } catch (error) {
      console.error('Admin initialization error:', error);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/events', eventsRoutes); 
app.use('/api/notifications', notificationRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'frontend/uploads')));

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/welcome.html'));
});

// Add route for login page 
app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/auth/login.html'));
});

// Registration page route
app.get('/auth/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/auth/register.html'));
});

// Add route for event details page
app.get('/event-details', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/event-details.html'));
});

// Routes for student pages
app.get('/student/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/student/dashboard.html'));
});

app.get('/student/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/student/events.html'));
});

app.get('/student/event/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/student/event-detail.html'));
});

app.get('/student/volunteering', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/student/volunteering.html'));
});

// Route for bookmarks page
app.get('/student/bookmarks', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/student/bookmarks.html'));
});

// Notification page
app.get('/student/notifications', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/student/notifications.html'));
});

app.get('/student/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/student/dashboard.html')); // We can create this later
});

// Admin dashboard route
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/admin/dashboard.html'));
});

// Admin manage student route
app.get('/admin/students', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/admin/students.html'));
});

// Admin event routes 
app.get('/admin/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/admin/events.html'));
});

app.get('/admin/create-event', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/admin/create-event.html'));
});

// Event detail route
app.get('/admin/event-detail', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/admin/event-detail.html'));
});

// Edit event route
app.get('/admin/edit-event', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/admin/edit-event.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));