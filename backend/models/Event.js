// backend/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    topics: [{
        type: String,
        enum: [
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
        ]
    }],
    duration: {
        type: Number,
        default: 24, // Default duration in hours
        min: 1,
        max: 168 // Max one week
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    volunteers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    }],
    bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);