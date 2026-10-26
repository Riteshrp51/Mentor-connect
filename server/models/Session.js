import mongoose from 'mongoose';

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: [true, 'Session topic is required'],
      trim: true,
    },
    agenda: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Session date is required'],
    },
    time: {
      type: String,
      default: '15:00',
    },
    durationMinutes: {
      type: Number,
      default: 45,
    },
    format: {
      type: String,
      enum: ['video', 'interview', 'review'],
      default: 'video',
    },
    formatLabel: {
      type: String,
      default: '1:1 Video Mentorship',
    },
    roomCode: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'expired', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    meetingNotes: {
      type: String,
      default: '',
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ studentId: 1, status: 1, date: 1 });
sessionSchema.index({ mentorId: 1, status: 1, date: 1 });

export default mongoose.model('Session', sessionSchema);
