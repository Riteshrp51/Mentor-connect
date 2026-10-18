import MentorProfile from '../models/MentorProfile.js';
import User from '../models/User.js';

export const getMentorList = async (req, res, next) => {
  try {
    const {
      search,
      skills,
      domain,
      minExperience,
      maxExperience,
      minRating,
      company,
      page = 1,
      limit = 12,
      sort = '-rating.average',
    } = req.query;

    const filter = { profileCompletion: { $gte: 60 } };

    if (search && search.trim() !== '') {
      const trimmedSearch = search.trim();

      // Find users whose name matches the search term (case-insensitive regex)
      const matchingUsers = await User.find({
        name: { $regex: trimmedSearch, $options: 'i' },
        role: 'mentor',
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { $text: { $search: trimmedSearch } },
        { userId: { $in: userIds } },
      ];
    }

    if (skills && skills.trim() !== '') {
      const skillList = skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);

      if (skillList.length) {
        filter.expertise = { $in: skillList };
      }
    }

    if (domain && domain.trim() !== '') {
      filter.domain = new RegExp(domain.trim(), 'i');
    }

    if (
      (minExperience !== undefined && minExperience !== null && minExperience !== '') ||
      (maxExperience !== undefined && maxExperience !== null && maxExperience !== '')
    ) {
      filter.experienceYears = {};

      if (minExperience !== undefined && minExperience !== null && minExperience !== '') {
        filter.experienceYears.$gte = Number(minExperience);
      }

      if (maxExperience !== undefined && maxExperience !== null && maxExperience !== '') {
        filter.experienceYears.$lte = Number(maxExperience);
      }
    }

    if (minRating !== undefined && minRating !== null && minRating !== '') {
      filter['rating.average'] = { $gte: Number(minRating) };
    }

    if (company && company.trim() !== '') {
      filter.company = new RegExp(company.trim(), 'i');
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(50, Math.max(1, Number(limit) || 12));
    const skip = (pageNumber - 1) * limitNumber;

    const mentorsQuery = MentorProfile.find(filter)
      .populate('userId', 'name profileImage')
      .sort(sort || '-rating.average')
      .skip(skip)
      .limit(limitNumber);

    const [mentors, total] = await Promise.all([
      mentorsQuery.exec(),
      MentorProfile.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limitNumber));

    res.status(200).json({
      status: 'success',
      data: {
        mentors: mentors.map((mentor) => ({
          _id: mentor._id,
          userId: mentor.userId,
          bio: mentor.bio,
          expertise: mentor.expertise,
          mentorshipAreas: mentor.mentorshipAreas,
          domain: mentor.domain,
          company: mentor.company,
          experienceYears: mentor.experienceYears,
          profileCompletion: mentor.profileCompletion,
          location: mentor.location,
          rating: mentor.rating,
          isAvailable: mentor.isAvailable,
          matchPercentage: 0,
        })),
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
