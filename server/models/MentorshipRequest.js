import mongoose from 'mongoose';

const { Schema } = mongoose;

const mentorshipRequestSchema = new Schema(
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
      required: [true, 'Please specify a mentorship topic or subject'],
      trim: true,
    },
    message: {
      type: String,
      maxlength: [800, 'Message cannot exceed 800 characters'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'cancelled'],
        message: 'Status must be pending, accepted, rejected, or cancelled',
      },
      default: 'pending',
      index: true,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate open (pending) requests to the same mentor from the same student
mentorshipRequestSchema.index(
  { studentId: 1, mentorId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

export default mongoose.model('MentorshipRequest', mentorshipRequestSchema);
