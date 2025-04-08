// backend/routes/events.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const { determineEventStatus } = require('../utils/eventStatus');

// Get all events
router.get('/', async (req, res) => {
  try {
      const events = await Event.find().sort('-createdAt');
      
      // Update event statuses in real-time
      for (const event of events) {
          // Skip cancelled events
          if (event.status === 'cancelled') continue;
          
          const newStatus = determineEventStatus(event);
          if (event.status !== newStatus) {
              event.status = newStatus;
              await event.save();
          }
      }
      
      res.json({ events });
  } catch (error) {
      res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
        .populate('volunteers.user', 'firstName lastName schoolId');
        
    if (!event) {
        return res.status(404).json({ message: 'Event not found' });
    }
    
    // Update event status in real-time (if not cancelled)
    if (event.status !== 'cancelled') {
        const newStatus = determineEventStatus(event);
        if (event.status !== newStatus) {
            event.status = newStatus;
            await event.save();
        }
    }
    
    res.json({ event });
  } catch (error) {
      res.status(500).json({ message: 'Server error' });
  }
});

// Get all events for students (simplified endpoint)
router.get('/all', async (req, res) => {
  try {
      const events = await Event.find({ status: { $in: ['upcoming', 'ongoing'] } })
          .sort({ date: 1 });
      
      // Update event statuses in real-time
      for (const event of events) {
          // Skip cancelled events
          if (event.status === 'cancelled') continue;
          
          const newStatus = determineEventStatus(event);
          if (event.status !== newStatus) {
              event.status = newStatus;
              await event.save();
          }
      }
      
      res.json({ events });
  } catch (error) {
      console.error('Error fetching all events:', error);
      res.status(500).json({ message: 'Server error' });
  }
});

// Public routes for welcome page
// Get all topics for filtering
router.get('/topics', async (req, res) => {
    try {
        const topics = [
            'Academics',
            'Research',
            'Athletics',
            'Art & Culture',
            'Public Service',
            'Health',
            'Sustainability',
            'Diversity Equity & Inclusion',
            'Global',
            'Alumni',
            'Giving',
            'News'
        ];
        
        res.json({ topics });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get public events (no auth required)
router.get('/public', async (req, res) => {
    try {
        let query = { status: { $in: ['upcoming', 'ongoing'] } };
        
        // Filter by topic if provided
        if (req.query.topic) {
            query.topics = req.query.topic;
        }
        
        const events = await Event.find(query)
            .sort({ date: 1 })
            .limit(10);
        
        // Update event statuses in real-time
        for (const event of events) {
            // Skip cancelled events
            if (event.status === 'cancelled') continue;
            
            const newStatus = determineEventStatus(event);
            if (event.status !== newStatus) {
                event.status = newStatus;
                await event.save();
            }
        }
            
        res.json({ events });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single public event
router.get('/public/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Update event status in real-time (if not cancelled)
        if (event.status !== 'cancelled') {
            const newStatus = determineEventStatus(event);
            if (event.status !== newStatus) {
                event.status = newStatus;
                await event.save();
            }
        }
        
        res.json({ event });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create event (admin only)
router.post('/', auth, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, time, location, topics, status, duration } = req.body;
    
    // Generate image URL from the uploaded file
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/events/${req.file.filename}`;
    } else {
      return res.status(400).json({ message: 'Please upload an image' });
    }
    
    // Validate duration
    let parsedDuration = parseInt(duration);
    if (isNaN(parsedDuration) || parsedDuration < 1) {
      parsedDuration = 24; // Default to 24 hours if invalid
    } else if (parsedDuration > 168) {
      parsedDuration = 168; // Cap at 168 hours (1 week)
    }
    
    const newEvent = new Event({
      title,
      description,
      date,
      time,
      location,
      imageUrl,
      topics: Array.isArray(topics) ? topics : [topics], // Handle single or multiple topics
      duration: parsedDuration,
      status: status || 'upcoming',
      createdBy: req.user.id
    });

    await newEvent.save();

    // Create notifications for students based on topics they've shown interest in
    // For now, we'll send to all students, but in the future this could be improved
    // to only send to students interested in specific topics
    const students = await User.find({ role: 'student' });
    
    // Create notifications in bulk for all students
    const notifications = students.map(student => ({
      recipient: student._id,
      type: 'new_event',
      title: 'New Event Available',
      message: `A new event "${title}" has been added that might interest you.`,
      relatedEvent: newEvent._id
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event (admin only)
router.put('/:id', auth, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, time, location, topics, status, duration } = req.body;
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Store old title for notification
    const oldTitle = event.title;

    // Update image if a new one is uploaded
    if (req.file) {
      // Delete old image if it exists
      if (event.imageUrl) {
        const oldImagePath = path.join(__dirname, '../../frontend', event.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      event.imageUrl = `/uploads/events/${req.file.filename}`;
    }

    // Validate duration
    if (duration) {
      let parsedDuration = parseInt(duration);
      if (isNaN(parsedDuration) || parsedDuration < 1) {
        parsedDuration = 24; // Default to 24 hours if invalid
      } else if (parsedDuration > 168) {
        parsedDuration = 168; // Cap at 168 hours (1 week)
      }
      event.duration = parsedDuration;
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.time = time || event.time;
    event.location = location || event.location;
    event.topics = Array.isArray(topics) ? topics : [topics];
    event.status = status || event.status;

    await event.save();
    
    // Get all users who have bookmarked or volunteered for this event
    const interestedUserIds = new Set();
    
    // Add volunteers
    if (event.volunteers && event.volunteers.length > 0) {
      event.volunteers.forEach(volunteer => {
        if (volunteer.user) {
          interestedUserIds.add(volunteer.user.toString());
        }
      });
    }
    
    // Add users who bookmarked the event
    if (event.bookmarks && event.bookmarks.length > 0) {
      event.bookmarks.forEach(userId => {
        interestedUserIds.add(userId.toString());
      });
    }
    
    // Create notifications for interested users
    if (interestedUserIds.size > 0) {
      const notifications = Array.from(interestedUserIds).map(userId => ({
        recipient: userId,
        type: 'event_update',
        title: 'Event Updated',
        message: `The event "${oldTitle}" has been updated with new information.`,
        relatedEvent: event._id
      }));
      
      await Notification.insertMany(notifications);
    }
    
    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;