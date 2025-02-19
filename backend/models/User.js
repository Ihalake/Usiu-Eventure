// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  schoolId: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student'
  },
  initials: String
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate initials from name
userSchema.pre('save', function(next) {
  if (this.name && !this.initials) {
    this.initials = this.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);