// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get all notifications for logged-in user
router.get('/', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort('-createdAt')
            .populate('relatedEvent', 'title date time');
        
        res.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const notification = await Notification.findOne({ 
            _id: req.params.id,
            recipient: req.user.id
        });
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        notification.isRead = true;
        await notification.save();
        
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );
        
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const notification = await Notification.findOne({ 
            _id: req.params.id,
            recipient: req.user.id
        });
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        await Notification.deleteOne({ _id: req.params.id });
        
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;