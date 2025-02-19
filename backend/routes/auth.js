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
    const { schoolId, password } = req.body;
    const user = await User.findOne({ schoolId });
    
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
        name: user.name,
        schoolId: user.schoolId,
        role: user.role,
        initials: user.initials
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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