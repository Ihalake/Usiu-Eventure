const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

// Admin dashboard
router.get('/dashboard', protect, restrictTo('admin'), async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).sort('-createdAt');
        res.render('admin/dashboard', {
            layout: 'main',
            pageTitle: 'Admin Dashboard',
            students,
            user: req.user
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Error loading dashboard' });
    }
});

// Create student
router.post('/students/create', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { fullName, schoolId, password } = req.body;
        
        // Validate input
        if (!fullName || !schoolId || !password) {
            const students = await User.find({ role: 'student' }).sort('-createdAt');
            return res.render('admin/dashboard', {
                layout: 'main',
                pageTitle: 'Admin Dashboard',
                error: 'All fields are required',
                students,
                user: req.user
            });
        }

        // Check if student ID already exists
        const existingStudent = await User.findOne({ schoolId });
        if (existingStudent) {
            const students = await User.find({ role: 'student' }).sort('-createdAt');
            return res.render('admin/dashboard', {
                layout: 'main',
                pageTitle: 'Admin Dashboard',
                error: 'School ID already exists',
                students,
                user: req.user
            });
        }

        // Create new student
        await User.create({
            fullName,
            schoolId,
            password,
            role: 'student'
        });

        // Fetch updated student list
        const students = await User.find({ role: 'student' }).sort('-createdAt');
        
        res.render('admin/dashboard', {
            layout: 'main',
            pageTitle: 'Admin Dashboard',
            success: 'Student added successfully',
            students,
            user: req.user
        });
    } catch (error) {
        console.error('Error creating student:', error);
        const students = await User.find({ role: 'student' }).sort('-createdAt');
        res.render('admin/dashboard', {
            layout: 'main',
            pageTitle: 'Admin Dashboard',
            error: 'Error creating student',
            students,
            user: req.user
        });
    }
});

// Delete student
router.delete('/students/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;