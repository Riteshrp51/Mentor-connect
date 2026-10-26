import mongoose from 'mongoose';
import Session from '../models/Session.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import MentorProfile from '../models/MentorProfile.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Conversation from '../models/Conversation.js';

/**
 * Helper to generate a unique room code
 */
const generateUniqueRoomCode = async () => {
  let isUnique = false;
  let code = '';
  while (!isUnique) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    code = `mc-${randomDigits}`;
    const existing = await Session.findOne({ roomCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
};

/**
 * Helper to enrich mentor details on populated sessions
 */
const enrichSessionData = async (sessionDoc) => {
  const session = sessionDoc.toObject ? sessionDoc.toObject() : { ...sessionDoc };

  if (session.mentorId && typeof session.mentorId === 'object') {
    const mentorProfile = await MentorProfile.findOne({ userId: session.mentorId._id }).lean();
    if (mentorProfile) {
      session.mentorCompany = mentorProfile.company || 'MentorConnect';
      session.mentorDomain = mentorProfile.domain || 'Technology';
      session.mentorRating = mentorProfile.rating?.average || 5.0;
    } else {
      session.mentorCompany = session.mentorId.headline || 'Senior Mentor';
      session.mentorDomain = 'Tech & Career';
      session.mentorRating = 5.0;
    }
  }

  return session;
};

/**
 * @desc    Create a new scheduled mentorship session
 * @route   POST /api/sessions
 * @access  Private
 */
export const createSession = async (req, res, next) => {
  try {
    const {
      participantId,
      topic,
      agenda,
      date,
      time,
      durationMinutes = 45,
      format = 'video',
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Session topic is required',
      });
    }

    if (!participantId) {
      return res.status(400).json({
        status: 'error',
        message: 'Please select a participant for this session',
      });
    }

    if (!date) {
      return res.status(400).json({
        status: 'error',
        message: 'Session date is required',
      });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        status: 'error',
        message: 'Participant user not found',
      });
    }

    const isStudent = req.user.role === 'student';
    const studentId = isStudent ? req.user._id : participant._id;
    const mentorId = isStudent ? participant._id : req.user._id;

    const roomCode = await generateUniqueRoomCode();

    const formatLabels = {
      video: '1:1 Video Mentorship',
      interview: 'Mock Technical Interview',
      review: 'Resume & Portfolio Review',
    };

    const sessionDateTime = new Date(`${date.split('T')[0]}T${time || '15:00'}:00`);

    const newSession = await Session.create({
      studentId,
      mentorId,
      topic: topic.trim(),
      agenda: agenda ? agenda.trim() : 'General 1-on-1 mentorship session and discussion.',
      date: isNaN(sessionDateTime.getTime()) ? new Date(date) : sessionDateTime,
      time: time || '15:00',
      durationMinutes: Number(durationMinutes) || 45,
      format: ['video', 'interview', 'review'].includes(format) ? format : 'video',
      formatLabel: formatLabels[format] || '1:1 Video Mentorship',
      roomCode,
      status: 'upcoming',
      createdBy: req.user._id,
    });

    const populatedSession = await Session.findById(newSession._id)
      .populate('studentId', 'name email profileImage headline')
      .populate('mentorId', 'name email profileImage headline');

    const enriched = await enrichSessionData(populatedSession);

    // Format human readable date for notification message
    const formattedDateStr = new Date(newSession.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    // Create Notification for the other participant
    let notificationDoc = null;
    try {
      notificationDoc = await Notification.create({
        recipient: participantId,
        sender: req.user._id,
        type: 'session_scheduled',
        title: `Meeting Scheduled: ${topic.trim()}`,
        message: `${req.user.name} (${isStudent ? 'Student' : 'Mentor'}) scheduled a session on ${formattedDateStr} at ${time || '15:00'}. Room Code: ${roomCode}`,
        relatedId: newSession._id,
        relatedModel: 'Session',
      });
    } catch (notifErr) {
      console.error('Failed to create notification for session:', notifErr.message);
    }

    // Broadcast real-time events via Socket.io
    const io = req.app.get('io');
    if (io) {
      // Notify recipient
      if (notificationDoc) {
        const populatedNotification = await Notification.findById(notificationDoc._id).populate(
          'sender',
          'name email role profileImage'
        );
        io.to(`user_${participantId}`).emit('new_notification', populatedNotification);
      }
      io.to(`user_${participantId}`).emit('session_created', enriched);
      // Also notify creator socket room so their other tabs/devices sync
      io.to(`user_${req.user._id}`).emit('session_created', enriched);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Session scheduled successfully and notification sent',
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all sessions for the authenticated user
/**
 * Helper to auto-update sessions whose scheduled time + duration has passed
 */
export const autoUpdateExpiredSessions = async (userId) => {
  try {
    const filter = { status: 'upcoming' };
    if (userId) {
      filter.$or = [{ studentId: userId }, { mentorId: userId }];
    }
    const upcomingSessions = await Session.find(filter);
    const now = new Date();
    const expiredIds = [];

    for (const sess of upcomingSessions) {
      const d = new Date(sess.date);
      let hours = 15;
      let mins = 0;
      if (sess.time && typeof sess.time === 'string' && sess.time.includes(':')) {
        const parts = sess.time.split(':');
        hours = parseInt(parts[0], 10) || 0;
        mins = parseInt(parts[1], 10) || 0;
      } else {
        hours = d.getHours();
        mins = d.getMinutes();
      }
      const startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, mins, 0, 0);
      const duration = Number(sess.durationMinutes) || 45;
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      if (now > endTime) {
        expiredIds.push(sess._id);
      }
    }

    if (expiredIds.length > 0) {
      await Session.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { status: 'completed' } }
      );
    }
  } catch (err) {
    console.error('Error auto-updating expired sessions:', err);
  }
};

/**
 * @desc    Get all sessions for the authenticated user
 * @route   GET /api/sessions
 * @access  Private
 */
export const getSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check and auto-update any past session whose duration has elapsed
    await autoUpdateExpiredSessions(userId);

    const rawSessions = await Session.find({
      $or: [{ studentId: userId }, { mentorId: userId }],
    })
      .populate('studentId', 'name email profileImage headline')
      .populate('mentorId', 'name email profileImage headline')
      .populate('createdBy', 'name email role')
      .sort({ date: 1, createdAt: -1 });

    const enrichedSessions = await Promise.all(
      rawSessions.map((s) => enrichSessionData(s))
    );

    return res.status(200).json({
      status: 'success',
      count: enrichedSessions.length,
      data: enrichedSessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get contacts available to schedule a session with
 * @route   GET /api/sessions/contacts
 * @access  Private
 */
export const getScheduleContacts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isStudent = req.user.role === 'student';
    const contactsMap = new Map();

    if (isStudent) {
      // 1. Mentors from accepted requests
      const acceptedRequests = await MentorshipRequest.find({
        studentId: userId,
        status: 'accepted',
      }).populate('mentorId', 'name email role profileImage headline');

      for (const reqItem of acceptedRequests) {
        if (reqItem.mentorId) {
          const mentor = reqItem.mentorId;
          const mentorProfile = await MentorProfile.findOne({ userId: mentor._id }).lean();
          contactsMap.set(mentor._id.toString(), {
            _id: mentor._id,
            name: mentor.name,
            email: mentor.email,
            role: 'mentor',
            profileImage: mentor.profileImage || '',
            headline: mentorProfile?.domain || mentor.headline || 'Mentor',
            company: mentorProfile?.company || 'MentorConnect',
            relationship: 'Connected Mentor',
          });
        }
      }

      // 2. Mentors from conversations
      const conversations = await Conversation.find({ participants: userId })
        .populate('participants', 'name email role profileImage headline');

      for (const conv of conversations) {
        for (const p of conv.participants || []) {
          if (p && p._id.toString() !== userId.toString() && p.role === 'mentor') {
            if (!contactsMap.has(p._id.toString())) {
              const mentorProfile = await MentorProfile.findOne({ userId: p._id }).lean();
              contactsMap.set(p._id.toString(), {
                _id: p._id,
                name: p.name,
                email: p.email,
                role: 'mentor',
                profileImage: p.profileImage || '',
                headline: mentorProfile?.domain || p.headline || 'Mentor',
                company: mentorProfile?.company || 'MentorConnect',
                relationship: 'Chat Contact',
              });
            }
          }
        }
      }

      // 3. Fallback: all active registered mentors so student can schedule anytime
      const allMentors = await User.find({ role: 'mentor' })
        .select('name email role profileImage headline')
        .limit(20);

      for (const m of allMentors) {
        if (!contactsMap.has(m._id.toString())) {
          const mentorProfile = await MentorProfile.findOne({ userId: m._id }).lean();
          contactsMap.set(m._id.toString(), {
            _id: m._id,
            name: m.name,
            email: m.email,
            role: 'mentor',
            profileImage: m.profileImage || '',
            headline: mentorProfile?.domain || m.headline || 'Expert Mentor',
            company: mentorProfile?.company || 'Available Mentor',
            relationship: 'Featured Mentor',
          });
        }
      }
    } else {
      // Current user is mentor:
      // 1. Students from accepted requests
      const acceptedRequests = await MentorshipRequest.find({
        mentorId: userId,
        status: 'accepted',
      }).populate('studentId', 'name email role profileImage headline');

      for (const reqItem of acceptedRequests) {
        if (reqItem.studentId) {
          const student = reqItem.studentId;
          contactsMap.set(student._id.toString(), {
            _id: student._id,
            name: student.name,
            email: student.email,
            role: 'student',
            profileImage: student.profileImage || '',
            headline: student.headline || 'Mentee Student',
            company: 'Student',
            relationship: 'Accepted Mentee',
          });
        }
      }

      // 2. Students from conversations
      const conversations = await Conversation.find({ participants: userId })
        .populate('participants', 'name email role profileImage headline');

      for (const conv of conversations) {
        for (const p of conv.participants || []) {
          if (p && p._id.toString() !== userId.toString() && p.role === 'student') {
            if (!contactsMap.has(p._id.toString())) {
              contactsMap.set(p._id.toString(), {
                _id: p._id,
                name: p.name,
                email: p.email,
                role: 'student',
                profileImage: p.profileImage || '',
                headline: p.headline || 'Mentee Student',
                company: 'Student',
                relationship: 'Chat Mentee',
              });
            }
          }
        }
      }

      // 3. Any students who sent requests
      const anyRequests = await MentorshipRequest.find({ mentorId: userId })
        .populate('studentId', 'name email role profileImage headline');

      for (const reqItem of anyRequests) {
        if (reqItem.studentId && !contactsMap.has(reqItem.studentId._id.toString())) {
          const student = reqItem.studentId;
          contactsMap.set(student._id.toString(), {
            _id: student._id,
            name: student.name,
            email: student.email,
            role: 'student',
            profileImage: student.profileImage || '',
            headline: student.headline || 'Mentee Student',
            company: 'Student',
            relationship: 'Applicant Mentee',
          });
        }
      }

      // 4. Fallback: registered students
      const allStudents = await User.find({ role: 'student' })
        .select('name email role profileImage headline')
        .limit(15);

      for (const s of allStudents) {
        if (!contactsMap.has(s._id.toString())) {
          contactsMap.set(s._id.toString(), {
            _id: s._id,
            name: s.name,
            email: s.email,
            role: 'student',
            profileImage: s.profileImage || '',
            headline: s.headline || 'Student',
            company: 'Student',
            relationship: 'Platform Mentee',
          });
        }
      }
    }

    return res.status(200).json({
      status: 'success',
      data: Array.from(contactsMap.values()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get session details by room code
 * @route   GET /api/sessions/room/:roomCode
 * @access  Private
 */
export const getSessionByRoom = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    if (!roomCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Room code is required',
      });
    }

    const session = await Session.findOne({ roomCode: roomCode.trim().toLowerCase() })
      .populate('studentId', 'name email profileImage headline')
      .populate('mentorId', 'name email profileImage headline')
      .populate('createdBy', 'name email role');

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found for this room code',
      });
    }

    const enriched = await enrichSessionData(session);

    return res.status(200).json({
      status: 'success',
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a scheduled session
 * @route   PATCH /api/sessions/:id/cancel
 * @access  Private
 */
export const cancelSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid session ID',
      });
    }

    const session = await Session.findById(id)
      .populate('studentId', 'name email profileImage')
      .populate('mentorId', 'name email profileImage');

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }

    const userIdStr = req.user._id.toString();
    const isStudent = session.studentId?._id?.toString() === userIdStr;
    const isMentor = session.mentorId?._id?.toString() === userIdStr;

    if (!isStudent && !isMentor) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized. You are not a participant of this session.',
      });
    }

    session.status = 'cancelled';
    await session.save();

    const otherParticipantId = isStudent ? session.mentorId?._id : session.studentId?._id;

    if (otherParticipantId) {
      try {
        const notif = await Notification.create({
          recipient: otherParticipantId,
          sender: req.user._id,
          type: 'general',
          title: `Session Cancelled: ${session.topic}`,
          message: `${req.user.name} cancelled the scheduled session on ${session.topic}.`,
          relatedId: session._id,
          relatedModel: 'Session',
        });

        const io = req.app.get('io');
        if (io) {
          io.to(`user_${otherParticipantId}`).emit('new_notification', notif);
          io.to(`user_${otherParticipantId}`).emit('session_cancelled', { sessionId: session._id });
          io.to(`user_${req.user._id}`).emit('session_cancelled', { sessionId: session._id });
        }
      } catch (notifErr) {
        console.error('Notification write failed on cancel session:', notifErr.message);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Session cancelled successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};
