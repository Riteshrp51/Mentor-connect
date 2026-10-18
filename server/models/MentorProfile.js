import mongoose from 'mongoose';

const MentorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    expertise: {
      type: [String],
      default: [],
    },
    mentorshipAreas: {
      type: [String],
      default: [],
    },
    serviceCategories: {
      type: [String],
      default: [],
    },
    experienceLevel: {
      type: String,
      trim: true,
      default: 'Senior Engineer',
    },
    domain: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

MentorProfileSchema.index({ expertise: 1 });
MentorProfileSchema.index({ mentorshipAreas: 1 });
MentorProfileSchema.index({ 'rating.average': -1 });
MentorProfileSchema.index(
  { bio: 'text', expertise: 'text', company: 'text' },
  {
    weights: { bio: 2, expertise: 3, company: 1 },
    name: 'mentor_search_index',
  }
);

export default mongoose.model('MentorProfile', MentorProfileSchema);
