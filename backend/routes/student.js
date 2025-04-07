// backend/routes/student.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const Event = require('../models/Event');

// Student dashboard with upcoming events
router.get('/dashboard', protect, restrictTo('student'), async (req, res) => {
    try {
        // Get upcoming events
        const upcomingEvents = await Event.find({
            date: { $gte: new Date() },
            status: 'upcoming'
        })
        .sort('date')
        .limit(5);

        // Get user's volunteering events
        const volunteeringEvents = await Event.find({
            'volunteers.user': req.user._id
        });

        // Get user's bookmarked events
        const bookmarkedEvents = await Event.find({
            bookmarks: req.user._id
        });

        res.render('student/dashboard', {
            layout: 'main',
            pageTitle: 'Student Dashboard',
            user: req.user,
            upcomingEvents,
            stats: {
                upcoming: upcomingEvents.length,
                volunteering: volunteeringEvents.length,
                bookmarked: bookmarkedEvents.length
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { 
            message: 'Error loading dashboard',
            layout: 'main'
        });
    }
});

// Events browsing page
router.get('/events', protect, restrictTo('student'), async (req, res) => {
    try {
        const { topic, period } = req.query;
        let dateFilter = {};
        
        // Handle date filtering
        if (period) {
            const today = new Date();
            switch(period) {
                case 'today':
                    dateFilter = {
                        $gte: new Date(today.setHours(0,0,0,0)),
                        $lt: new Date(today.setHours(23,59,59,999))
                    };
                    break;
                case 'week':
                    const weekEnd = new Date(today);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    dateFilter = { $gte: today, $lt: weekEnd };
                    break;
                case 'month':
                    const monthEnd = new Date(today);
                    monthEnd.setMonth(monthEnd.getMonth() + 1);
                    dateFilter = { $gte: today, $lt: monthEnd };
                    break;
            }
        }

        // Build query
        let query = { status: 'upcoming' };
        if (Object.keys(dateFilter).length > 0) {
            query.date = dateFilter;
        }
        if (topic) {
            query.topics = topic;
        }

        const events = await Event.find(query)
            .sort('date')
            .populate('createdBy', 'fullName');

        res.render('student/events', {
            layout: 'main',
            pageTitle: 'Events',
            user: req.user,
            events,
            filters: { topic, period }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { 
            message: 'Error loading events',
            layout: 'main'
        });
    }
});

// Bookmark event
router.post('/events/:id/bookmark', protect, restrictTo('student'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const isBookmarked = event.bookmarks.includes(req.user._id);
        if (isBookmarked) {
            // Remove bookmark
            event.bookmarks = event.bookmarks.filter(id => !id.equals(req.user._id));
        } else {
            // Add bookmark
            event.bookmarks.push(req.user._id);
        }
        await event.save();

        res.json({ success: true, isBookmarked: !isBookmarked });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error updating bookmark' });
    }
});

// Register as volunteer
router.post('/events/:id/volunteer', protect, restrictTo('student'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Check if already volunteered
        const alreadyVolunteered = event.volunteers.some(v => v.user.equals(req.user._id));
        if (alreadyVolunteered) {
            return res.status(400).json({ success: false, message: 'Already volunteered for this event' });
        }

        event.volunteers.push({
            user: req.user._id,
            role: req.body.role || 'general',
            status: 'pending'
        });
        await event.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error registering as volunteer' });
    }
});

module.exports = router;