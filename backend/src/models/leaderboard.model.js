import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  userName: {
    type: String,
    required: [true, 'User name is required']
  },
  score: {
    type: Number,
    default: 0,
    min: [0, 'Score cannot be negative']
  },
  rank: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  achievements: [{
    type: String,
    trim: true
  }],
  organization: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create a compound index on eventId and userId to ensure uniqueness
leaderboardSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// Update the lastUpdated field on save
leaderboardSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Method to update score
leaderboardSchema.methods.updateScore = async function(points) {
  this.score += points;
  this.lastUpdated = Date.now();
  return this.save();
};

export const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

