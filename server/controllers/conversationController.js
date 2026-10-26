import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Notification from '../models/Notification.js';
import MentorProfile from '../models/MentorProfile.js';

/**
 * Helper to enrich conversation object with mentor profile details
 */
const enrichConversation = async (conv, currentUserId) => {
  const convObj = conv && conv.toObject ? conv.toObject() : (conv || {});

  if (convObj.participants && Array.isArray(convObj.participants)) {
    for (const p of convObj.participants) {
      if (p && p.role === 'mentor') {
        const mentorProfile = await MentorProfile.findOne({ userId: p._id }).lean();
        if (mentorProfile) {
          p.mentorProfile = mentorProfile;
          p.company = mentorProfile.company;
          p.domain = mentorProfile.domain;
          p.bio = mentorProfile.bio;
          p.expertise = mentorProfile.expertise || [];
          p.mentorshipAreas = mentorProfile.mentorshipAreas || [];
          p.experienceYears = mentorProfile.experienceYears || 0;
          p.rating = mentorProfile.rating || { average: 5.0, count: 0 };
          p.location = mentorProfile.location || '';
          p.isAvailable = mentorProfile.isAvailable !== false;
        }
      }
    }
  }

  if (currentUserId && convObj._id) {
    const unreadCount = await Message.countDocuments({
      conversationId: convObj._id,
      sender: { $ne: currentUserId },
      readBy: { $ne: currentUserId },
    });
    convObj.unreadCount = unreadCount;
  }

  return convObj;
};

/**
 * @desc    Get all conversations for the authenticated user
 * @route   GET /api/conversations
 * @access  Private
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email role profileImage')
      .populate({
        path: 'mentorshipRequestId',
        select: 'topic message status studentId mentorId createdAt respondedAt',
        populate: [
          { path: 'studentId', select: 'name email profileImage' },
          { path: 'mentorId', select: 'name email profileImage' }
        ]
      })
      .sort({ updatedAt: -1, 'lastMessage.sentAt': -1 });

    // Deduplicate conversation entries per unique contact
    const seenParticipants = new Set();
    const uniqueConversations = [];

    for (const conv of conversations) {
      const other = (conv.participants || []).find(
        (p) => p && p._id && p._id.toString() !== userId.toString()
      );
      const otherId = other ? other._id.toString() : conv._id.toString();

      if (!seenParticipants.has(otherId)) {
        seenParticipants.add(otherId);
        uniqueConversations.push(conv);
      }
    }

    const enriched = await Promise.all(
      uniqueConversations.map((conv) => enrichConversation(conv, userId))
    );

    return res.status(200).json({
      status: 'success',
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get conversation by ID
 * @route   GET /api/conversations/:id
 * @access  Private
 */
export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid conversation ID format',
      });
    }

    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email role profileImage')
      .populate({
        path: 'mentorshipRequestId',
        select: 'topic message status studentId mentorId createdAt respondedAt',
        populate: [
          { path: 'studentId', select: 'name email profileImage' },
          { path: 'mentorId', select: 'name email profileImage' }
        ]
      });

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You are not a participant in this conversation.',
      });
    }

    const enriched = await enrichConversation(conversation, req.user._id);

    return res.status(200).json({
      status: 'success',
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Find or create a conversation for a specific accepted MentorshipRequest
 * @route   GET /api/conversations/request/:requestId
 * @access  Private
 */
export const getConversationByRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request ID format',
      });
    }

    const request = await MentorshipRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentorship request not found',
      });
    }

    const isParticipant =
      request.studentId.toString() === req.user._id.toString() ||
      request.mentorId.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You are not part of this mentorship request.',
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [request.studentId, request.mentorId] },
    })
      .populate('participants', 'name email role profileImage')
      .populate({
        path: 'mentorshipRequestId',
        select: 'topic message status studentId mentorId createdAt respondedAt',
        populate: [
          { path: 'studentId', select: 'name email profileImage' },
          { path: 'mentorId', select: 'name email profileImage' }
        ]
      });

    if (!conversation) {
      // Create one if request was accepted
      const newConv = await Conversation.create({
        participants: [request.studentId, request.mentorId],
        mentorshipRequestId: request._id,
        lastMessage: {
          text: `Mentorship accepted for "${request.topic}". Conversation is open.`,
          sender: req.user._id,
          sentAt: new Date(),
        },
      });

      conversation = await Conversation.findById(newConv._id)
        .populate('participants', 'name email role profileImage')
        .populate({
          path: 'mentorshipRequestId',
          select: 'topic message status studentId mentorId createdAt respondedAt',
          populate: [
            { path: 'studentId', select: 'name email profileImage' },
            { path: 'mentorId', select: 'name email profileImage' }
          ]
        });
    }

    const enriched = await enrichConversation(conversation, req.user._id);

    return res.status(200).json({
      status: 'success',
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get message history for a conversation and mark as read
 * @route   GET /api/conversations/:id/messages
 * @access  Private
 */
export const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid conversation ID format',
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You are not a participant in this conversation.',
      });
    }

    // Mark messages from other participants as read
    await Message.updateMany(
      {
        conversationId: id,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      }
    );

    const messages = await Message.find({ conversationId: id })
      .populate('sender', 'name email role profileImage')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      status: 'success',
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message in a conversation (REST API)
 * @route   POST /api/conversations/:id/messages
 * @access  Private
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, attachments = [] } = req.body;

    const trimmedText = typeof text === 'string' ? text.trim() : '';

    if (!trimmedText && (!Array.isArray(attachments) || attachments.length === 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Message must contain text or at least one attachment',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid conversation ID format',
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You are not a participant in this conversation.',
      });
    }

    // Determine summary text for lastMessage
    let summaryText = trimmedText;
    if (!summaryText && attachments.length > 0) {
      const firstAtt = attachments[0];
      if (firstAtt.mediaType === 'image') summaryText = '📷 Photo';
      else if (firstAtt.mediaType === 'video') summaryText = '🎥 Video';
      else if (firstAtt.mediaType === 'pdf') summaryText = '📄 PDF Document';
      else summaryText = `📎 ${firstAtt.fileName || 'Attachment'}`;
    }

    // Create message
    const newMessage = await Message.create({
      conversationId: id,
      sender: req.user._id,
      text: trimmedText,
      attachments: Array.isArray(attachments) ? attachments : [],
      readBy: [req.user._id],
    });

    // Update conversation's lastMessage and timestamp
    conversation.lastMessage = {
      text: summaryText,
      sender: req.user._id,
      sentAt: new Date(),
    };
    await conversation.save();

    // Find recipient to potentially notify
    const recipientId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    if (recipientId) {
      try {
        await Notification.create({
          recipient: recipientId,
          sender: req.user._id,
          type: 'new_message',
          title: `New message from ${req.user.name}`,
          message: summaryText.length > 80 ? `${summaryText.substring(0, 77)}...` : summaryText,
          relatedId: conversation._id,
          relatedModel: 'Conversation',
        });
      } catch (notifErr) {
        console.error('Notification creation failed for new message:', notifErr.message);
      }
    }

    const populatedMessage = await Message.findById(newMessage._id).populate(
      'sender',
      'name email role profileImage'
    );

    // Emit real-time message via socket.io to the room
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${id}`).emit('receive_message', populatedMessage);
      io.emit('conversation_updated', {
        conversationId: id,
        lastMessage: conversation.lastMessage,
        message: populatedMessage,
      });
    }

    return res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get summary of unread messages & unread chats count for authenticated user
 * @route   GET /api/conversations/unread-summary
 * @access  Private
 */
export const getUnreadSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all conversations where current user is a participant
    const userConversations = await Conversation.find({ participants: userId }).select('_id');
    const convIds = userConversations.map((c) => c._id);

    if (convIds.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          unreadChatsCount: 0,
          totalUnreadMessages: 0,
        },
      });
    }

    // Total unread messages across all conversations
    const totalUnreadMessages = await Message.countDocuments({
      conversationId: { $in: convIds },
      sender: { $ne: userId },
      readBy: { $ne: userId },
    });

    // Count distinct conversations having unread messages
    const unreadChatsAggregate = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: convIds },
          sender: { $ne: userId },
          readBy: { $ne: userId },
        },
      },
      {
        $group: {
          _id: '$conversationId',
        },
      },
      {
        $count: 'unreadChatsCount',
      },
    ]);

    const unreadChatsCount =
      unreadChatsAggregate.length > 0 ? unreadChatsAggregate[0].unreadChatsCount : 0;

    return res.status(200).json({
      status: 'success',
      data: {
        unreadChatsCount,
        totalUnreadMessages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all messages in a conversation as read by current user
 * @route   PATCH /api/conversations/:id/read
 * @access  Private
 */
export const markConversationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid conversation ID format',
      });
    }

    await Message.updateMany(
      {
        conversationId: id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${id}`).emit('messages_read', {
        conversationId: id,
        userId: userId.toString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Conversation marked as read',
    });
  } catch (error) {
    next(error);
  }
};