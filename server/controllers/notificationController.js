import Notification from '../models/Notification.js';

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name email role profileImage')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all user's notifications as read
 * @route   PATCH /api/notifications/mark-read
 * @access  Private
 */
export const markNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all notifications for user
 * @route   DELETE /api/notifications
 * @access  Private
 */
export const clearNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ recipient: userId });

    return res.status(200).json({
      status: 'success',
      message: 'All notifications cleared',
    });
  } catch (error) {
    next(error);
  }
};
