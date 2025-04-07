const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Event = require('../models/Event');
const { protect, restrictTo } = require('../middleware/auth');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'frontend/public/uploads/events');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Get events management page
router.get('/events', protect, restrictTo('admin'), async (req, res) => {
    try {
        const events = await Event.find().sort('-createdAt');
        res.render('admin/events', {
            layout: 'main',
            pageTitle: 'Manage Events',
            events,
            user: req.user
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Error loading events' });
    }
});

// Create event page
router.get('/events/create', protect, restrictTo('admin'), (req, res) => {
    res.render('admin/create-event', {
        layout: 'main',
        pageTitle: 'Create Event',
        user: req.user
    });
});

// Create event handler
router.post('/events/create', protect, restrictTo('admin'), upload.single('image'), async (req, res) => {
    try {
        const { title, description, date, time, location, topics } = req.body;
        
        // Validate input
        if (!title || !description || !date || !time || !location || !topics) {
            return res.render('admin/create-event', {
                layout: 'main',
                pageTitle: 'Create Event',
                error: 'All fields are required',
                user: req.user,
                formData: req.body
            });
        }

        // Create event
        const event = await Event.create({
            title,
            description,
            date,
            time,
            location,
            image: `/uploads/events/${req.file.filename}`,
            topics: Array.isArray(topics) ? topics : [topics],
            createdBy: req.user._id
        });

        res.redirect('/admin/events');
    } catch (error) {
        console.error('Error creating event:', error);
        res.render('admin/create-event', {
            layout: 'main',
            pageTitle: 'Create Event',
            error: 'Error creating event',
            user: req.user,
            formData: req.body
        });
    }
});

// Delete event
router.delete('/events/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;