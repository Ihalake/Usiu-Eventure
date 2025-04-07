const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    schoolId: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'student'],
        default: 'student'
    },
    initials: {
        type: String
    }
}, { timestamps: true });

// Generate initials before saving
userSchema.pre('save', function(next) {
    if (this.fullName) {
        this.initials = this.fullName
            .split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase();
    }
    next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

module.exports = mongoose.model('User', userSchema);