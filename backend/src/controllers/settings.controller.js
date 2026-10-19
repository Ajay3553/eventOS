import {UserSettings} from '../models/userSettings.model.js';
import {SystemSettings} from '../models/systemSettings.model.js'


const getUserSettings = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = await UserSettings.create({ userId });
    }

    res.status(200).json({
      success: true,
      data: userSettings
    });
  } catch (error) {
    next(error);
  }
};


const updateUserSettings = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = await UserSettings.create({
        userId,
        ...req.body
      });
    } else {
      if (req.body.notification) userSettings.notification = req.body.notification;
      if (req.body.theme) userSettings.theme = req.body.theme;
      if (req.body.language) userSettings.language = req.body.language;
      if (req.body.privacy) userSettings.privacy = req.body.privacy;

      await userSettings.save();
    }

    res.status(200).json({
      success: true,
      data: userSettings
    });
  } catch (error) {
    next(error);
  }
};


const getSystemSettings = async (req, res, next) => {
  try {
    let systemSettings = await SystemSettings.findOne({});

    if (!systemSettings) {
      systemSettings = await SystemSettings.create({});
    }

    res.status(200).json({
      success: true,
      data: systemSettings
    });
  } catch (error) {
    next(error);
  }
};


const updateSystemSettings = async (req, res, next) => {
  try {
    let systemSettings = await SystemSettings.findOne({});

    if (!systemSettings) {
      systemSettings = await SystemSettings.create({
        ...req.body,
        updatedBy: req.user.id
      });
    } else {
      Object.keys(req.body).forEach(key => {
        if (key !== 'updatedAt' && key !== 'updatedBy') {
          systemSettings[key] = req.body[key];
        }
      });

      systemSettings.updatedBy = req.user.id;
      await systemSettings.save();
    }

    res.status(200).json({
      success: true,
      data: systemSettings
    });
  } catch (error) {
    next(error);
  }
};

export{
  getUserSettings,
  updateSystemSettings,
  getSystemSettings,
  updateUserSettings,
};
