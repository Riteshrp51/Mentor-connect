import User from '../models/User.js';
import MentorProfile from '../models/MentorProfile.js';

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    status: 'success',
    token,
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      bio: user.bio,
      headline: user.headline,
      company: user.company,
      skills: user.skills,
      github: user.github,
      linkedin: user.linkedin,
      portfolio: user.portfolio,
      timezone: user.timezone,
      mentorshipGoals: user.mentorshipGoals || [],
      challengeAreas: user.challengeAreas || '',
      skillMatrix: user.skillMatrix || [],
      serviceCategories: user.serviceCategories || [],
      experienceLevel: user.experienceLevel || '',
      isProfileCompleted: user.isProfileCompleted,
    },
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // 1. Basic validation
    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields (name, email, password, confirmPassword, role) are required',
      });
    }

    // 2. Role validation (Student and Mentor only)
    if (role !== 'student' && role !== 'mentor') {
      return res.status(400).json({
        status: 'error',
        message: 'Role must be student or mentor',
      });
    }

    // 3. Password match validation
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords do not match',
      });
    }

    // 4. Password strength validation (min 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters',
      });
    }

    // 5. Email format validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please add a valid email',
      });
    }

    // 6. Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        status: 'error',
        message: 'Email is already registered',
      });
    }

    // 7. Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // 8. If role is mentor, automatically initialize MentorProfile so the mentor is immediately visible and searchable on student side
    if (role === 'mentor') {
      try {
        await MentorProfile.create({
          userId: user._id,
          bio: 'Experienced engineering and tech mentor available for guidance, technical doubt solving, and mock interviews.',
          company: 'Tech Industry Professional',
          domain: 'Software Engineering & Mentorship',
          expertise: ['Software Development', 'Career Guidance', 'Mock Interviews'],
          mentorshipAreas: ['Career Counseling', 'Mock Interviews'],
          serviceCategories: ['Career Counseling', 'Mock Interviews'],
          experienceLevel: 'Senior Software Engineer',
          experienceYears: 4,
          location: 'Remote',
          profileCompletion: 75,
          rating: { average: 5.0, count: 0 },
          isAvailable: true,
        });
      } catch (profileErr) {
        console.error('Initial MentorProfile creation notice:', profileErr.message);
      }
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validation for email and password presence
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password',
      });
    }

    // 2. Check for user in database
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Avoid revealing whether the email exists
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // 3. Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // 4. Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account has been deactivated',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    // req.user was populated in protect middleware
    res.status(200).json({
      status: 'success',
      user: {
        id: req.user._id,
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profileImage: req.user.profileImage,
        bio: req.user.bio || '',
        headline: req.user.headline || '',
        company: req.user.company || '',
        skills: req.user.skills || [],
        github: req.user.github || '',
        linkedin: req.user.linkedin || '',
        portfolio: req.user.portfolio || '',
        timezone: req.user.timezone || '',
        mentorshipGoals: req.user.mentorshipGoals || [],
        challengeAreas: req.user.challengeAreas || '',
        skillMatrix: req.user.skillMatrix || [],
        serviceCategories: req.user.serviceCategories || [],
        experienceLevel: req.user.experienceLevel || '',
        isProfileCompleted: Boolean(req.user.isProfileCompleted),
        isActive: req.user.isActive,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      headline,
      company,
      bio,
      skills,
      expertise,
      mentorshipAreas,
      serviceCategories,
      experienceLevel,
      mentorshipGoals,
      challengeAreas,
      skillMatrix,
      domain,
      experienceYears,
      location,
      github,
      linkedin,
      portfolio,
      timezone,
      profileImage,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (headline !== undefined) user.headline = headline.trim();
    if (company !== undefined) user.company = company.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (skills !== undefined) user.skills = Array.isArray(skills) ? skills : [];
    if (mentorshipGoals !== undefined) user.mentorshipGoals = Array.isArray(mentorshipGoals) ? mentorshipGoals : [];
    if (challengeAreas !== undefined) user.challengeAreas = typeof challengeAreas === 'string' ? challengeAreas.trim() : '';
    if (skillMatrix !== undefined) user.skillMatrix = Array.isArray(skillMatrix) ? skillMatrix : [];
    if (serviceCategories !== undefined) user.serviceCategories = Array.isArray(serviceCategories) ? serviceCategories : [];
    if (experienceLevel !== undefined) user.experienceLevel = experienceLevel.trim();
    if (github !== undefined) user.github = github.trim();
    if (linkedin !== undefined) user.linkedin = linkedin.trim();
    if (portfolio !== undefined) user.portfolio = portfolio.trim();
    if (timezone !== undefined) user.timezone = timezone.trim();
    if (profileImage !== undefined) user.profileImage = profileImage.trim();
    user.isProfileCompleted = true;

    await user.save();

    // If role is mentor, sync or update MentorProfile as well
    if (user.role === 'mentor') {
      let mentorProfile = await MentorProfile.findOne({ userId: user._id });
      const skillsToUse = expertise || skills || [];
      const servicesToUse = serviceCategories || mentorshipAreas || [];
      if (!mentorProfile) {
        mentorProfile = await MentorProfile.create({
          userId: user._id,
          bio: bio || '',
          company: company || '',
          domain: domain || headline || '',
          expertise: Array.isArray(skillsToUse) ? skillsToUse : [],
          mentorshipAreas: Array.isArray(servicesToUse) ? servicesToUse : [],
          serviceCategories: Array.isArray(servicesToUse) ? servicesToUse : [],
          experienceLevel: experienceLevel || 'Senior Engineer',
          experienceYears: experienceYears || 5,
          location: location || 'Remote',
          profileCompletion: 100,
          isAvailable: true,
        });
      } else {
        if (bio !== undefined) mentorProfile.bio = bio.trim();
        if (company !== undefined) mentorProfile.company = company.trim();
        if (domain || headline) mentorProfile.domain = (domain || headline).trim();
        if (skillsToUse) mentorProfile.expertise = Array.isArray(skillsToUse) ? skillsToUse : [];
        if (servicesToUse) {
          mentorProfile.mentorshipAreas = Array.isArray(servicesToUse) ? servicesToUse : [];
          mentorProfile.serviceCategories = Array.isArray(servicesToUse) ? servicesToUse : [];
        }
        if (experienceLevel !== undefined) mentorProfile.experienceLevel = experienceLevel.trim();
        if (experienceYears !== undefined) mentorProfile.experienceYears = Number(experienceYears);
        if (location !== undefined) mentorProfile.location = location.trim();
        mentorProfile.profileCompletion = 100;
        await mentorProfile.save();
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        headline: user.headline,
        company: user.company,
        skills: user.skills,
        github: user.github,
        linkedin: user.linkedin,
        portfolio: user.portfolio,
        timezone: user.timezone,
        mentorshipGoals: user.mentorshipGoals,
        challengeAreas: user.challengeAreas,
        skillMatrix: user.skillMatrix,
        serviceCategories: user.serviceCategories,
        experienceLevel: user.experienceLevel,
        isProfileCompleted: user.isProfileCompleted,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user (clear state client-side)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    // With client-side JWT stored in localStorage, logout is mostly handled client-side.
    // However, we return success response.
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};
