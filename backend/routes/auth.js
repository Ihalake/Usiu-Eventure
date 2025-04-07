const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Login page render
router.get('/login', (req, res) => {
    res.render('auth/login', {
        layout: 'main',  
        pageTitle: 'Login',
        showHeader: false,
        showFooter: false
    });
});

//Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
});

// Login handler
router.post('/login', async (req, res) => {
    try {
        const { schoolId, password } = req.body;
        const user = await User.findOne({ schoolId });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render('auth/login', {
                error: 'Invalid credentials',
                pageTitle: 'Login',
                showHeader: false,
                showFooter: false
            });
        }

        // Create token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1d'
        });

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else {
            res.redirect('/student/dashboard');
        }
    } catch (error) {
        res.render('auth/login', {
            error: 'An error occurred',
            pageTitle: 'Login',
            showHeader: false,
            showFooter: false
        });
    }
});

module.exports = router;