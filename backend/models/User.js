const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  // Athletic profile
  primarySport: {
    type: String,
    enum: ['basketball', 'football', 'soccer', 'tennis', 'baseball', 'track_and_field', 'other'],
    default: 'other',
  },
  position: {
    type: String,
    trim: true,
  },
  // Physical Attributes
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  height: { type: Number }, // in cm
  weight: { type: Number }, // in kg
  wingspan: { type: Number }, // in cm
  dominantHand: { type: String, enum: ['left', 'right', 'ambidextrous'], default: 'right' },

  profileComplete: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
