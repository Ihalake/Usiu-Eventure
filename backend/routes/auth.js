// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Find user by either email or schoolId
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { schoolId: identifier }
      ]
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        schoolId: user.schoolId,
        role: user.role,
        initials: user.initials
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Student registration
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, schoolId, password } = req.body;
    
    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Check if school ID already exists
    const schoolIdExists = await User.findOne({ schoolId });
    if (schoolIdExists) {
      return res.status(400).json({ message: 'School ID already registered' });
    }
    
    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      schoolId,
      password,
      role: 'student'
    });
    
    await user.save();
    
    res.status(201).json({ 
      message: 'Registration successful! You can now log in.',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        schoolId: user.schoolId,
        role: user.role,
        initials: user.initials
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Admin route to create student
router.post('/create-student', auth, isAdmin, async (req, res) => {
  try {
    const { name, schoolId, password } = req.body;
    
    if (await User.findOne({ schoolId })) {
      return res.status(400).json({ message: 'School ID already exists' });
    }

    const user = new User({
      name,
      schoolId,
      password,
      role: 'student'
    });

    await user.save();

    res.status(201).json({
      message: 'Student created successfully',
      user: {
        name: user.name,
        schoolId: user.schoolId,
        initials: user.initials
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all students
router.get('/students', auth, isAdmin, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('-password')
            .sort('-createdAt');
        res.json({ students });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete student
router.delete('/students/:id', auth, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;