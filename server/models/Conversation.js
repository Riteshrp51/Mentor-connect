import mongoose from 'mongoose';

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    mentorshipRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'MentorshipRequest',
      required: true,
      index: true,
    },
    lastMessage: {
      text: {
        type: String,
        default: 'Mentorship request accepted. Start the conversation!',
      },
      sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      sentAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1 });

export default mongoose.model('Conversation', conversationSchema);
