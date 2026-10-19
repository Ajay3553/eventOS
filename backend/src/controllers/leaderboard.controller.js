import { Leaderboard } from '../models/leaderboard.model.js';


const getEventLeaderboard = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    const leaderboard = await Leaderboard.find({ eventId })
      .sort({ score: -1 })
      .limit(100);
    
    const rankedLeaderboard = leaderboard.map((entry, index) => {
      return {
        ...entry.toObject(),
        rank: index + 1
      };
    });
    
    res.status(200).json({
      success: true,
      count: rankedLeaderboard.length,
      data: rankedLeaderboard
    });
  } catch (error) {
    next(error);
  }
};


const getParticipantScore = async (req, res, next) => {
  try {
    const { eventId, userId } = req.params;
    
    const scoreEntry = await Leaderboard.findOne({ eventId, userId });
    
    if (!scoreEntry) {
      return res.status(404).json({
        success: false,
        message: 'No score found for this participant in this event'
      });
    }
    
    const higherScores = await Leaderboard.countDocuments({
      eventId,
      score: { $gt: scoreEntry.score }
    });
    
    const rank = higherScores + 1;
    
    res.status(200).json({
      success: true,
      data: {
        ...scoreEntry.toObject(),
        rank
      }
    });
  } catch (error) {
    next(error);
  }
};


const updateScore = async (req, res, next) => {
  try {
    const { eventId, userId } = req.params;
    const { points, achievements } = req.body;
    
    let scoreEntry = await Leaderboard.findOne({ eventId, userId });
    
    if (!scoreEntry) {
      if (!req.body.userName) {
        return res.status(400).json({
          success: false,
          message: 'userName is required when creating a new score entry'
        });
      }
      
      const existingUserEntry = await Leaderboard.findOne({ userId });
      let organization = '';
      if (existingUserEntry && existingUserEntry.organization) {
        organization = existingUserEntry.organization;
      } else if (req.body.organization) {
        organization = req.body.organization;
      }
      
      scoreEntry = await Leaderboard.create({
        eventId,
        userId,
        userName: req.body.userName,
        score: points || 0,
        achievements: achievements || [],
        organization: organization
      });
    } else {
      if (points) {
        scoreEntry.score += points;
      }
      
      if (achievements && achievements.length > 0) {
        achievements.forEach(achievement => {
          if (!scoreEntry.achievements.includes(achievement)) {
            scoreEntry.achievements.push(achievement);
          }
        });
      }
      
      scoreEntry.lastUpdated = Date.now();
      await scoreEntry.save();
    }
    
    const higherScores = await Leaderboard.countDocuments({
      eventId,
      score: { $gt: scoreEntry.score }
    });
    
    const rank = higherScores + 1;
    scoreEntry.rank = rank;
    await scoreEntry.save();
    
    const updatedData = {
      ...scoreEntry.toObject(),
      rank
    };

    // Broadcast real-time leaderboard update
    if (req.leaderboardIO) {
      req.leaderboardIO.to(`event-${eventId}`).emit('score-updated', updatedData);
    } else if (req.io) {
      req.io.to(`event-${eventId}`).emit('score-updated', updatedData);
    }
    
    res.status(200).json({
      success: true,
      message: 'Score updated successfully',
      data: updatedData
    });
  } catch (error) {
    next(error);
  }
};


const getTopPerformers = async (req, res, next) => {
  try {
    const topPerformers = await Leaderboard.aggregate([
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$score' },
          userName: { $first: '$userName' },
          organization: { $first: '$organization' },
          eventCount: { $sum: 1 },
          achievements: { $push: '$achievements' }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          userName: 1,
          organization: 1,
          totalScore: 1,
          eventCount: 1,
          achievements: {
            $reduce: {
              input: { $setUnion: [{ $reduce: { input: '$achievements', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } }] },
              initialValue: [],
              in: { $concatArrays: ['$$value', ['$$this']] }
            }
          }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      count: topPerformers.length,
      data: topPerformers
    });
  } catch (error) {
    next(error);
  }
};


const getOrganizationLeaderboard = async (req, res, next) => {
  try {
    const eventLeaderboard = await Leaderboard.aggregate([
      { $match: { organization: { $exists: true, $ne: '', $ne: null } } },
      {
        $group: {
          _id: '$organization',
          totalScore: { $sum: '$score' },
          participantCount: { $addToSet: '$userId' },
          eventCount: { $addToSet: '$eventId' }
        }
      },
      {
        $project: {
          _id: 0,
          organization: '$_id',
          totalScore: 1,
          participantCount: { $size: '$participantCount' },
          eventCount: { $size: '$eventCount' }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 20 }
    ]);
    
    res.status(200).json({
      success: true,
      count: eventLeaderboard.length,
      data: eventLeaderboard
    });
  } catch (error) {
    next(error);
  }
};

export {
    getEventLeaderboard, getOrganizationLeaderboard, getParticipantScore,
    getTopPerformers,
    updateScore
};
