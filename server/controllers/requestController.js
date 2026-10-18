import mongoose from 'mongoose';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import MentorProfile from '../models/MentorProfile.js';

// Explicit State Machine Transition Rules
const STATE_TRANSITIONS = {
  pending: {
    accepted: {
      requiredRole: 'mentor',
      actorField: 'mentorId',
      description: 'Mentor accepts pending request',
    },
    rejected: {
      requiredRole: 'mentor',
      actorField: 'mentorId',
      description: 'Mentor rejects pending request',
    },
    cancelled: {
      requiredRole: 'student',
      actorField: 'studentId',
      description: 'Student cancels pending request',
    },
  },
  accepted: {},
  rejected: {},
  cancelled: {},
};

/**
 * Helper to validate a status transition against the state machine
 */
const validateTransition = (request, targetStatus, user) => {
  const currentStatus = request.status;
  const allowedTransitionsForCurrent = STATE_TRANSITIONS[currentStatus];

  if (!allowedTransitionsForCurrent || !allowedTransitionsForCurrent[targetStatus]) {
    return {
      isValid: false,
      statusCode: 400,
      message: `Invalid state transition. Cannot move request from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  const rule = allowedTransitionsForCurrent[targetStatus];

  // Role validation
  if (user.role !== rule.requiredRole) {
    return {
      isValid: false,
      statusCode: 403,
      message: `Unauthorized. Only users with role '${rule.requiredRole}' can transition status to '${targetStatus}'.`,
    };
  }

  // Ownership validation (e.g. mentorId or studentId must match user._id)
  const requiredUserId = request[rule.actorField]?.toString();
  if (requiredUserId !== user._id.toString()) {
    return {
      isValid: false,
      statusCode: 403,
      message: `Forbidden. You are not the authorized ${rule.requiredRole} for this request.`,
    };
  }

  return { isValid: true };
};

/**
 * @desc    Student sends a new mentorship request
 * @route   POST /api/requests
 * @access  Private (Student only)
 */
export const createRequest = async (req, res, next) => {
  try {
    const { mentorId, topic, message } = req.body;

    if (!mentorId || !topic) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide both mentorId and topic',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid mentorId provided',
      });
    }

    if (mentorId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot send a mentorship request to yourself',
      });
    }

    let targetMentorUserId = mentorId;
    let mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      const mentorDoc = await MentorProfile.findById(mentorId);
      if (mentorDoc && mentorDoc.userId) {
        targetMentorUserId = mentorDoc.userId;
        mentor = await User.findById(mentorDoc.userId);
      }
    }

    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found or user is not registered as a mentor',
      });
    }

    // Check for existing pending or accepted request from this student to this mentor
    const existingRequest = await MentorshipRequest.findOne({
      studentId: req.user._id,
      mentorId: targetMentorUserId,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingRequest) {
      const isAccepted = existingRequest.status === 'accepted';
      return res.status(409).json({
        status: 'error',
        message: isAccepted
          ? 'You are already connected with this mentor.'
          : 'You already have an active pending mentorship request with this mentor.',
        data: existingRequest,
      });
    }

    // Create the mentorship request
    const newRequest = await MentorshipRequest.create({
      studentId: req.user._id,
      mentorId: targetMentorUserId,
      topic,
      message: message || '',
      status: 'pending',
    });

    // Create notification for the mentor
    try {
      await Notification.create({
        recipient: targetMentorUserId,
        sender: req.user._id,
        type: 'new_request',
        title: 'New Mentorship Request',
        message: `${req.user.name} sent you a mentorship request on "${topic}".`,
        relatedId: newRequest._id,
        relatedModel: 'MentorshipRequest',
      });
    } catch (notifErr) {
      console.error('Notification creation failed on new request:', notifErr.message);
      // Don't fail the request creation if notification write fails
    }

    const populatedRequest = await MentorshipRequest.findById(newRequest._id)
      .populate('mentorId', 'name email profileImage')
      .populate('studentId', 'name email profileImage');

    return res.status(201).json({
      status: 'success',
      message: 'Mentorship request sent successfully',
      data: populatedRequest,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: 'You already have an active pending mentorship request with this mentor.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Student views their sent mentorship requests
 * @route   GET /api/requests/sent
 * @access  Private (Student only)
 */
export const getSentRequests = async (req, res, next) => {
  try {
    const requests = await MentorshipRequest.find({ studentId: req.user._id })
      .populate('mentorId', 'name email profileImage')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mentor views their incoming mentorship requests
 * @route   GET /api/requests/received
 * @access  Private (Mentor only)
 */
export const getReceivedRequests = async (req, res, next) => {
  try {
    const requests = await MentorshipRequest.find({ mentorId: req.user._id })
      .populate('studentId', 'name email profileImage headline company bio skills mentorshipGoals challengeAreas skillMatrix github linkedin portfolio')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mentor accepts a mentorship request
 * @route   PATCH /api/requests/:id/accept
 * @access  Private (Mentor only)
 */
export const acceptRequest = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid request ID format',
    });
  }

  const mentorshipRequest = await MentorshipRequest.findById(id);

  if (!mentorshipRequest) {
    return res.status(404).json({
      status: 'error',
      message: 'Mentorship request not found',
    });
  }

  // Validate state machine rule
  const validation = validateTransition(mentorshipRequest, 'accepted', req.user);
  if (!validation.isValid) {
    return res.status(validation.statusCode).json({
      status: 'error',
      message: validation.message,
    });
  }

  // Execute State Transition + Conversation Creation + Notification Write
  // Wrapped in a transaction with fallback for standalone MongoDB instances
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    try {
      session.startTransaction();
      useTransaction = true;
    } catch (txStartErr) {
      // Standalone MongoDB without replica set does not support transactions
      useTransaction = false;
      await session.endSession();
      session = null;
    }
  } catch (sessionErr) {
    useTransaction = false;
    session = null;
  }

  try {
    const sessionOpt = useTransaction && session ? { session } : {};

    // 1. Update MentorshipRequest status
    mentorshipRequest.status = 'accepted';
    mentorshipRequest.respondedAt = new Date();
    await mentorshipRequest.save(sessionOpt);

    // 2. Create or verify Conversation between student and mentor
    let conversation = await Conversation.findOne({
      participants: { $all: [mentorshipRequest.studentId, mentorshipRequest.mentorId] },
    }).session(useTransaction && session ? session : null);

    if (!conversation) {
      const initialText = `Mentorship request accepted for "${mentorshipRequest.topic}". You can start chatting here!`;
      const convArray = await Conversation.create(
        [
          {
            participants: [mentorshipRequest.studentId, mentorshipRequest.mentorId],
            mentorshipRequestId: mentorshipRequest._id,
            lastMessage: {
              text: initialText,
              sender: req.user._id,
              sentAt: new Date(),
            },
          },
        ],
        sessionOpt
      );
      conversation = convArray[0];

      await Message.create(
        [
          {
            conversationId: conversation._id,
            sender: req.user._id,
            text: initialText,
            readBy: [req.user._id],
          },
        ],
        sessionOpt
      );
    } else {
      // If conversation already exists between this pair, update its request link
      conversation.mentorshipRequestId = mentorshipRequest._id;
      await conversation.save(sessionOpt);
    }

    // 3. Create Notification for the student
    await Notification.create(
      [
        {
          recipient: mentorshipRequest.studentId,
          sender: req.user._id,
          type: 'request_accepted',
          title: 'Mentorship Request Accepted!',
          message: `${req.user.name} accepted your mentorship request on "${mentorshipRequest.topic}". A new conversation has been opened.`,
          relatedId: mentorshipRequest._id,
          relatedModel: 'MentorshipRequest',
        },
      ],
      sessionOpt
    );

    if (useTransaction && session) {
      await session.commitTransaction();
    }

    const populatedRequest = await MentorshipRequest.findById(mentorshipRequest._id)
      .populate('studentId', 'name email profileImage')
      .populate('mentorId', 'name email profileImage');

    return res.status(200).json({
      status: 'success',
      message: 'Mentorship request accepted successfully',
      data: {
        request: populatedRequest,
        conversationId: conversation?._id,
      },
    });
  } catch (err) {
    if (useTransaction && session) {
      await session.abortTransaction();
    }
    console.error('Error during mentorship acceptance transaction:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to accept mentorship request. Changes were rolled back.',
      error: err.message,
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * @desc    Mentor rejects a mentorship request
 * @route   PATCH /api/requests/:id/reject
 * @access  Private (Mentor only)
 */
export const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request ID format',
      });
    }

    const mentorshipRequest = await MentorshipRequest.findById(id);

    if (!mentorshipRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentorship request not found',
      });
    }

    // Validate state machine rule
    const validation = validateTransition(mentorshipRequest, 'rejected', req.user);
    if (!validation.isValid) {
      return res.status(validation.statusCode).json({
        status: 'error',
        message: validation.message,
      });
    }

    // Update status
    mentorshipRequest.status = 'rejected';
    mentorshipRequest.respondedAt = new Date();
    await mentorshipRequest.save();

    // Create notification for student
    try {
      await Notification.create({
        recipient: mentorshipRequest.studentId,
        sender: req.user._id,
        type: 'request_rejected',
        title: 'Mentorship Request Update',
        message: `${req.user.name} is currently unavailable for mentorship on "${mentorshipRequest.topic}".`,
        relatedId: mentorshipRequest._id,
        relatedModel: 'MentorshipRequest',
      });
    } catch (notifErr) {
      console.error('Notification creation error on reject:', notifErr.message);
    }

    const populatedRequest = await MentorshipRequest.findById(mentorshipRequest._id)
      .populate('studentId', 'name email profileImage')
      .populate('mentorId', 'name email profileImage');

    return res.status(200).json({
      status: 'success',
      message: 'Mentorship request rejected',
      data: populatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student cancels a pending mentorship request
 * @route   PATCH /api/requests/:id/cancel
 * @access  Private (Student only)
 */
export const cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request ID format',
      });
    }

    const mentorshipRequest = await MentorshipRequest.findById(id);

    if (!mentorshipRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentorship request not found',
      });
    }

    // Validate state machine rule
    const validation = validateTransition(mentorshipRequest, 'cancelled', req.user);
    if (!validation.isValid) {
      return res.status(validation.statusCode).json({
        status: 'error',
        message: validation.message,
      });
    }

    // Update status
    mentorshipRequest.status = 'cancelled';
    mentorshipRequest.respondedAt = new Date();
    await mentorshipRequest.save();

    // Create notification for mentor
    try {
      await Notification.create({
        recipient: mentorshipRequest.mentorId,
        sender: req.user._id,
        type: 'request_cancelled',
        title: 'Mentorship Request Cancelled',
        message: `${req.user.name} cancelled their pending request on "${mentorshipRequest.topic}".`,
        relatedId: mentorshipRequest._id,
        relatedModel: 'MentorshipRequest',
      });
    } catch (notifErr) {
      console.error('Notification creation error on cancel:', notifErr.message);
    }

    const populatedRequest = await MentorshipRequest.findById(mentorshipRequest._id)
      .populate('studentId', 'name email profileImage')
      .populate('mentorId', 'name email profileImage');

    return res.status(200).json({
      status: 'success',
      message: 'Mentorship request cancelled successfully',
      data: populatedRequest,
    });
  } catch (error) {
    next(error);
  }
};
