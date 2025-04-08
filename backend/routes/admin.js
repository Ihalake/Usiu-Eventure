// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

// Get admin dashboard stats
router.get('/stats', auth, isAdmin, async (req, res) => {
    try {
        // Get total events count
        const totalEvents = await Event.countDocuments();
        
        // Get registered students count
        const registeredStudents = await User.countDocuments({ role: 'student' });
        
        // Get total volunteers count (unique students who've volunteered)
        const events = await Event.find({});
        let volunteerIds = new Set();
        
        events.forEach(event => {
            if (event.volunteers && event.volunteers.length > 0) {
                event.volunteers.forEach(volunteer => {
                    if (volunteer.user) {
                        volunteerIds.add(volunteer.user.toString());
                    }
                });
            }
        });
        
        const totalVolunteers = volunteerIds.size;
        
        res.json({
            totalEvents,
            registeredStudents,
            totalVolunteers
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all volunteers with event and student details
router.get('/volunteers', auth, isAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        
        // Get all events with populated user data for volunteers
        const events = await Event.find({})
            .populate('volunteers.user', 'firstName lastName schoolId');
        
        // Extract all volunteers from events
        let volunteers = [];
        
        events.forEach(event => {
            if (event.volunteers && event.volunteers.length > 0) {
                event.volunteers.forEach(volunteer => {
                    if (volunteer.user) {
                        volunteers.push({
                            _id: volunteer._id,
                            student: volunteer.user,
                            event: {
                                _id: event._id,
                                title: event.title,
                                date: event.date,
                                time: event.time
                            },
                            role: volunteer.role,
                            status: volunteer.status,
                            note: volunteer.note,
                            createdAt: volunteer.createdAt || event.createdAt
                        });
                    }
                });
            }
        });
        
        // Filter by status if specified
        if (status && status !== 'all') {
            volunteers = volunteers.filter(v => v.status === status);
        }
        
        // Sort by date (most recent first)
        volunteers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({ volunteers });
    } catch (error) {
        console.error('Error fetching volunteers:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update volunteer status
router.put('/volunteers/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        // Find which event contains this volunteer
        const events = await Event.find({ 'volunteers._id': id });
        
        if (events.length === 0) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }
        
        const event = events[0];
        
        // Find and update the volunteer's status
        const volunteerIndex = event.volunteers.findIndex(v => v._id.toString() === id);
        
        if (volunteerIndex === -1) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }
        
        const volunteer = event.volunteers[volunteerIndex];
        volunteer.status = status;
        await event.save();
        
        // Create notification for the student
        if (volunteer.user) {
            // Create status-specific message
            let title, message;
            
            switch(status) {
                case 'approved':
                    title = 'Volunteer Request Approved';
                    message = `Your request to volunteer as ${volunteer.role} for "${event.title}" has been approved.`;
                    break;
                case 'rejected':
                    title = 'Volunteer Request Not Approved';
                    message = `Your request to volunteer as ${volunteer.role} for "${event.title}" was not approved. Please check other volunteering opportunities.`;
                    break;
                default:
                    title = 'Volunteer Status Update';
                    message = `Your volunteer status for "${event.title}" has been updated to ${status}.`;
            }
            
            await Notification.create({
                recipient: volunteer.user,
                type: 'volunteer_status',
                title,
                message,
                relatedEvent: event._id
            });
        }
        
        res.json({ 
            message: `Volunteer status updated to ${status}`,
            volunteer
        });
    } catch (error) {
        console.error('Error updating volunteer status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;