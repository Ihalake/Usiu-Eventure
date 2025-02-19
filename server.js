// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./backend/routes/auth');
const User = require('./backend/models/User');

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
          role: 'admin'
        });
        console.log('Admin user initialized');
      }
    } catch (error) {
      console.error('Admin initialization error:', error);
    }
  };
  

// Routes
app.use('/api/auth', authRoutes);

// Serve login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/views/auth/login.html'));
});

//Serve admin dashboard
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/admin/dashboard.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));