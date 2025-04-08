// backend/routes/student.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get student dashboard data
router.get('/dashboard', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const userId = req.user.id;
        
        // Get user with populated bookmarks
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get upcoming events (limit to 5)
        const upcomingEvents = await Event.find({ 
            status: 'upcoming',
            date: { $gte: new Date() }
        })
        .sort({ date: 1 })
        .limit(5);
        
        // Get volunteering events for this user
        const volunteeringEvents = await Event.find({
            'volunteers.user': userId
        });
        
        // Ensure bookmarkedEvents is an array
        if (!user.bookmarkedEvents) {
            user.bookmarkedEvents = [];
        }
        
        // Stats
        const stats = {
            upcomingEvents: upcomingEvents.length,
            volunteering: volunteeringEvents.length,
            bookmarked: user.bookmarkedEvents.length
        };
        
        res.json({
            stats,
            upcomingEvents
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get events with filters for students
router.get('/events/filtered', auth, async (req, res) => {
    try {
        const { period, topic, search } = req.query;
        const userId = req.user.id;
        
        // Build query
        let query = {};
        
        // Period filter
        if (period) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (period === 'today') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                query.date = { $gte: today, $lt: tomorrow };
            } else if (period === 'week') {
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);
                query.date = { $gte: today, $lt: nextWeek };
            } else if (period === 'month') {
                const nextMonth = new Date(today);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                query.date = { $gte: today, $lt: nextMonth };
            }
        }
        
        // Topic filter
        if (topic) {
            query.topics = topic;
        }
        
        // Search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Get user's bookmarked events
        const user = await User.findById(userId);
        const bookmarkedEventIds = user.bookmarkedEvents || [];
        
        // Get events
        const events = await Event.find(query).sort({ date: 1 });
        
        // Add isBookmarked field to events
        const eventsWithBookmarkStatus = events.map(event => {
            const eventObj = event.toObject();
            eventObj.isBookmarked = bookmarkedEventIds.some(id => id.toString() === event._id.toString());
            return eventObj;
        });
        
        res.json({ events: eventsWithBookmarkStatus });
    } catch (error) {
        console.error('Event filter error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's relationship with an event
router.get('/events/:id/relationship', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const eventId = req.params.id;
        const userId = req.user.id;
        
        // Get user's bookmarked events
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const isBookmarked = user.bookmarkedEvents && 
            user.bookmarkedEvents.some(id => id && id.toString() === eventId);
        
        // Get event to check if user is volunteering
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        let isVolunteering = false;
        let volunteerRole = null;
        let volunteerStatus = null;
        
        // Check if event has volunteers array
        if (event.volunteers && event.volunteers.length > 0) {
            const volunteerInfo = event.volunteers.find(v => 
                v.user && v.user.toString() === userId
            );
            
            if (volunteerInfo) {
                isVolunteering = true;
                volunteerRole = volunteerInfo.role || 'Not specified';
                volunteerStatus = volunteerInfo.status || 'pending';
            }
        }
        
        res.json({
            isBookmarked: !!isBookmarked,
            isVolunteering,
            volunteerRole,
            volunteerStatus
        });
    } catch (error) {
        console.error('Relationship error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's volunteering activities
router.get('/volunteering', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const userId = req.user.id.toString(); // Ensure string format
        const { status } = req.query;
        
        console.log(`Fetching volunteering data for user ${userId}`);
        
        // Instead of using the query with volunteers.user, fetch all events and filter
        const allEvents = await Event.find({});
        console.log(`Found ${allEvents.length} total events`);
        
        // Filter events where the user is a volunteer
        const userEvents = allEvents.filter(event => {
            return event.volunteers && event.volunteers.some(volunteer => {
                // Ensure we're comparing strings
                return volunteer.user && volunteer.user.toString() === userId;
            });
        });
        
        console.log(`After filtering, found ${userEvents.length} events where user volunteered`);
        
        // Format the response to include role and status
        const volunteering = [];
        
        // Process each event
        for (const event of userEvents) {
            // Find this user's volunteer record in the event
            const volunteerInfo = event.volunteers.find(v => 
                v.user && v.user.toString() === userId
            );
            
            // Only add to results if we found valid volunteer info
            if (volunteerInfo) {
                // Check status filter if specified
                if (status && status !== 'all' && volunteerInfo.status !== status) {
                    continue; // Skip this record if status doesn't match
                }
                
                volunteering.push({
                    event: {
                        _id: event._id,
                        title: event.title,
                        description: event.description,
                        date: event.date,
                        time: event.time,
                        location: event.location,
                        imageUrl: event.imageUrl,
                        status: event.status
                    },
                    role: volunteerInfo.role || 'Not specified',
                    status: volunteerInfo.status || 'pending',
                    note: volunteerInfo.note || ''
                });
            }
        }
        
        console.log(`Returning ${volunteering.length} volunteering entries`);
        
        res.json({ volunteering });
    } catch (error) {
        console.error('Error fetching volunteering data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's bookmarked events
router.get('/bookmarks', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const userId = req.user.id;
        
        // Get user with bookmarked events
        const user = await User.findById(userId).populate({
            path: 'bookmarkedEvents',
            select: 'title description date time location imageUrl topics status'
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Filter to only upcoming and ongoing events
        const bookmarkedEvents = user.bookmarkedEvents.filter(event => 
            event.status === 'upcoming' || event.status === 'ongoing'
        );
        
        res.json({ bookmarkedEvents });
    } catch (error) {
        console.error('Error fetching bookmarked events:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Test endpoint for debugging
router.get('/volunteering-test', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const userId = req.user.id;
        
        console.log(`Test endpoint called for user ${userId}`);
        
        // Find all events
        const events = await Event.find();
        console.log(`Found ${events.length} total events`);
        
        // Find events where this user is in the volunteers array
        const userEvents = events.filter(event => {
            return event.volunteers && event.volunteers.some(v => {
                if (!v.user) return false;
                const matches = v.user.toString() === userId;
                console.log(`Event ${event.title}: volunteer user ${v.user.toString()}, current user ${userId}, matches: ${matches}`);
                return matches;
            });
        });
        
        console.log(`Found ${userEvents.length} events with this user as volunteer`);
        
        // Create a sample volunteering entry for testing
        const testData = {
            volunteering: [
                {
                    event: {
                        _id: "test123",
                        title: "Test Event",
                        description: "This is a test event",
                        date: new Date(),
                        time: "10:00",
                        location: "Test Location",
                        imageUrl: "/assets/images/usiu-africa.jpg",
                        status: "upcoming"
                    },
                    role: "Test Role",
                    status: "pending",
                    note: "Test note"
                }
            ],
            debug: {
                totalEvents: events.length,
                userEvents: userEvents.map(e => ({
                    id: e._id,
                    title: e.title,
                    volunteers: e.volunteers.map(v => ({
                        userId: v.user ? v.user.toString() : 'none',
                        role: v.role,
                        match: v.user && v.user.toString() === userId
                    }))
                }))
            }
        };
        
        res.json(testData);
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Toggle bookmark for an event
router.post('/events/:id/bookmark', auth, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        
        // Get user
        const user = await User.findById(userId);
        
        // Check if event is already bookmarked
        const isBookmarked = user.bookmarkedEvents && user.bookmarkedEvents.some(id => id.toString() === eventId);
        
        if (isBookmarked) {
            // Remove bookmark
            user.bookmarkedEvents = user.bookmarkedEvents.filter(id => id.toString() !== eventId);
            await user.save();
            res.json({ message: 'Event removed from bookmarks', isBookmarked: false });
        } else {
            // Add bookmark
            if (!user.bookmarkedEvents) {
                user.bookmarkedEvents = [];
            }
            user.bookmarkedEvents.push(eventId);
            await user.save();
            res.json({ message: 'Event added to bookmarks', isBookmarked: true });
        }
    } catch (error) {
        console.error('Bookmark error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Volunteer for an event
router.post('/events/:id/volunteer', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const eventId = req.params.id;
        const userId = req.user.id;
        const { role, note } = req.body;
        
        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }
        
        // Get event
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Ensure volunteers array exists
        if (!event.volunteers) {
            event.volunteers = [];
        }
        
        // Check if user is already volunteering
        const existingVolunteer = event.volunteers.findIndex(v => 
            v.user && v.user.toString() === userId
        );
        
        if (existingVolunteer >= 0) {
            // Update existing volunteer entry instead of creating duplicate
            event.volunteers[existingVolunteer] = {
                ...event.volunteers[existingVolunteer],
                role,
                note,
                status: 'pending' // Reset to pending if they're applying again
            };
            
            await event.save();
            return res.json({ 
                message: 'Your volunteer role has been updated successfully',
                updated: true
            });
        }
        
        // Add volunteer
        event.volunteers.push({
            user: userId,
            role,
            note: note || '',
            status: 'pending'
        });
        
        await event.save();
        
        res.json({ message: 'Volunteer request submitted successfully', updated: false });
    } catch (error) {
        console.error('Volunteer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;