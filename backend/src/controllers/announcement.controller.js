import {Announcement} from '../models/announcement.model.js';

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, eventId, priority, isPublished } = req.body;
    const userId = req.user.id;
    
    let creatorName = req.body.creatorName;
    if (!creatorName && req.user && req.user.firstName && req.user.lastName) {
      creatorName = `${req.user.firstName} ${req.user.lastName}`;
    }
    if (!creatorName) {
      creatorName = 'System';
    }
    
    const announcement = await Announcement.create({
      title,
      content,
      eventId: eventId || null,
      createdBy: userId,
      creatorName,
      priority: priority || 'medium',
      isPublished: isPublished !== undefined ? isPublished : true
    });
    
    // Broadcast real-time announcement
    if (req.io) {
      req.io.emit('newAnnouncement', { announcement });
    }
    
    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};


const getAllAnnouncements = async (req, res, next) => {
  try {
    const query = {};
    
    if (req.query.eventId) {
      query.eventId = req.query.eventId;
    }
    
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    
    if (req.user && (req.user.role === 'admin' || req.user.role === 'organizer')) {
      if (req.query.isPublished !== undefined) {
        query.isPublished = req.query.isPublished === 'true';
      }
    } else {
      query.isPublished = true;
    }
    
    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    next(error);
  }
};


const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    if (!announcement.isPublished && 
        (!req.user || (req.user.role !== 'admin' && req.user.role !== 'organizer'))) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this announcement'
      });
    }
    
    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};


const updateAnnouncement = async (req, res, next) => {
  try {
    let announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    if (announcement.createdBy.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this announcement'
      });
    }
    
    announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (req.io) {
      req.io.emit('updateAnnouncement', { announcement });
    }
    
    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};


const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    if (announcement.createdBy.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this announcement'
      });
    }
    
    await announcement.deleteOne();
    
    if (req.io) {
      req.io.emit('deleteAnnouncement', { id: req.params.id });
    }
    
    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};


const getAnnouncementsByEvent = async (req, res, next) => {
  try {
    const query = {
      eventId: req.params.eventId,
      isPublished: true
    };
    
    if (req.user && (req.user.role === 'admin' || req.user.role === 'organizer')) {
      delete query.isPublished;
    }
    
    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    next(error);
  }
};

export {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementsByEvent,
};
