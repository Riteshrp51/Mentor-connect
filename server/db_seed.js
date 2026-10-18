import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import User from './models/User.js';
import MentorProfile from './models/MentorProfile.js';
import MentorshipRequest from './models/MentorshipRequest.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';

const mentorsData = [
  {
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    headline: 'Senior CSE Tech Mentor & Data Scientist',
    company: 'Google',
    serviceCategories: ['CSE Tech Doubt Solver', 'Languages & Frameworks', 'Core CS Coaching'],
    mentorProfile: {
      company: 'Google',
      domain: 'CSE Tech Doubt Solver',
      expertise: ['C++', 'Java', 'Python', 'Core CS (OS/DBMS)', 'Data Structures (DSA)', 'PyTorch'],
      mentorshipAreas: ['CSE Tech Doubt Solver', 'Core CS Fundamentals', 'Code Debugging'],
      serviceCategories: ['CSE Tech Doubt Solver', 'Languages & Frameworks', 'Core CS Coaching'],
      experienceLevel: 'Tech Lead / Principal Architect',
      experienceYears: 8,
      profileCompletion: 100,
      location: 'New York, NY',
      rating: { average: 4.9, count: 42 },
      bio: 'Specializes in resolving deep CSE tech doubts, core CS fundamentals (OS, DBMS, Networks), Python, and full-stack coding architecture.',
      isAvailable: true,
    }
  },
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    headline: 'Mock Interview Coach & Lead Frontend Engineer',
    company: 'Netflix',
    serviceCategories: ['Mock Interviews', 'Live Coding Rounds', 'Behavioral HR Prep'],
    mentorProfile: {
      company: 'Netflix',
      domain: 'Mock Interviews',
      expertise: ['Coding/DSA Mock Interviews', 'System Design Mock', 'Behavioral STAR Method', 'React', 'Live Code Debugging'],
      mentorshipAreas: ['Mock Interviews', 'System Design', 'Technical Coding Prep'],
      serviceCategories: ['Mock Interviews', 'Live Coding Rounds', 'Behavioral HR Prep'],
      experienceLevel: 'Senior Software Engineer',
      experienceYears: 6,
      profileCompletion: 100,
      location: 'San Francisco, CA',
      rating: { average: 4.8, count: 29 },
      bio: 'Conducts realistic mock interview rounds including technical DSA live-coding, System Design walkthroughs, and behavioral HR prep.',
      isAvailable: true,
    }
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    headline: 'Principal Career Counselor & Strategist',
    company: 'Airbnb',
    serviceCategories: ['Career Counseling', 'Résumé & Portfolio Review', 'Higher Studies Guidance'],
    mentorProfile: {
      company: 'Airbnb',
      domain: 'Career Counseling',
      expertise: ['Career Roadmapping', 'Resume Roasting', 'LinkedIn Optimization', 'Higher Studies Prep', 'Portfolio Strategy'],
      mentorshipAreas: ['Career Counseling', 'Resume Review', 'Career Growth'],
      serviceCategories: ['Career Counseling', 'Résumé & Portfolio Review', 'Higher Studies Guidance'],
      experienceLevel: 'Career Coach & Tech Recruiter',
      experienceYears: 7,
      profileCompletion: 100,
      location: 'Seattle, WA',
      rating: { average: 5.0, count: 51 },
      bio: 'Dedicated career counselor guiding students on goal setting, roadmap design, resume reviews, portfolio critique, and higher education paths.',
      isAvailable: true,
    }
  },
  {
    name: 'Marcus Chen',
    email: 'marcus.chen@example.com',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    headline: 'VP of Enterprise Sales & Business Strategy',
    company: 'AWS',
    serviceCategories: ['Sales & Business Strategy', 'Client Pitching & Discovery', 'Enterprise Growth'],
    mentorProfile: {
      company: 'AWS',
      domain: 'Sales & Business Strategy',
      expertise: ['B2B Tech Sales', 'Cold Outreach & Pitching', 'Deal Negotiation', 'Enterprise Cloud Growth', 'Go-To-Market Strategy'],
      mentorshipAreas: ['Sales & Business Strategy', 'Enterprise Sales', 'Client Pitching'],
      serviceCategories: ['Sales & Business Strategy', 'Client Pitching & Discovery', 'Enterprise Growth'],
      experienceLevel: 'Founder / Executive',
      experienceYears: 9,
      profileCompletion: 100,
      location: 'Austin, TX',
      rating: { average: 4.7, count: 38 },
      bio: 'Sales and business strategy mentor helping students master B2B client acquisition, discovery calls, outreach, and commercial growth.',
      isAvailable: true,
    }
  }
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Full Reset: Clear all requests, conversations, messages, notifications, profiles, and users
    await MentorshipRequest.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await MentorProfile.deleteMany({});
    await User.deleteMany({});
    console.log('Cleaned up all previous requests, conversations, messages, notifications, and users.');

    // Seed data with password '123456'
    // Do NOT pre-hash here because UserSchema.pre('save') will hash it automatically!
    for (const data of mentorsData) {
      const user = await User.create({
        name: data.name,
        email: data.email,
        password: '123456',
        role: 'mentor',
        profileImage: data.profileImage,
        headline: data.headline,
        company: data.company,
        skills: data.mentorProfile.expertise,
        serviceCategories: data.serviceCategories,
        experienceLevel: data.mentorProfile.experienceLevel,
        bio: data.mentorProfile.bio,
        isProfileCompleted: true,
      });

      await MentorProfile.create({
        ...data.mentorProfile,
        userId: user._id,
      });

      console.log(`Seeded mentor: ${data.name}`);
    }

    console.log('Database seeded successfully!');
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seed();
