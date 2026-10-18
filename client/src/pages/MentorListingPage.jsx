import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Star, Briefcase, MapPin, FilterX, ChevronLeft, ChevronRight, UserCheck, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import RequestMentorshipModal from '../components/RequestMentorshipModal';
import MentorProfileModal from '../components/MentorProfileModal';

const defaultFilters = {
  search: '',
  skills: '',
  domain: '',
  minExperience: '',
  maxExperience: '',
  company: '',
  minRating: '',
  page: 1,
  limit: 12,
};

const sampleMentors = [
  {
    _id: 'mentor-1',
    userId: { name: 'Dr. Sarah Jenkins', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80' },
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
    matchPercentage: 96,
  },
  {
    _id: 'mentor-2',
    userId: { name: 'Alex Rivera', profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
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
    matchPercentage: 92,
  },
  {
    _id: 'mentor-3',
    userId: { name: 'Priya Patel', profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80' },
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
    matchPercentage: 94,
  },
  {
    _id: 'mentor-4',
    userId: { name: 'Marcus Chen', profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
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
    matchPercentage: 88,
  }
];

const buildQueryParams = (filters) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  });

  return params.toString();
};

const MentorListingPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mentors, setMentors] = useState(sampleMentors);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 12 });
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState(null);
  const [selectedMentorForPreview, setSelectedMentorForPreview] = useState(null);
  const [requestToast, setRequestToast] = useState('');
  
  // Track raw inputs locally to avoid immediate API requests on every keystroke
  const [localInputs, setLocalInputs] = useState(() => ({
    search: searchParams.get('search') || '',
    skills: searchParams.get('skills') || '',
    domain: searchParams.get('domain') || '',
    minExperience: searchParams.get('minExperience') || '',
    maxExperience: searchParams.get('maxExperience') || '',
    company: searchParams.get('company') || '',
  }));

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    skills: searchParams.get('skills') || '',
    domain: searchParams.get('domain') || '',
    minExperience: searchParams.get('minExperience') || '',
    maxExperience: searchParams.get('maxExperience') || '',
    company: searchParams.get('company') || '',
    minRating: searchParams.get('minRating') || '',
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 12,
  }));

  // Sync localState and filters when URL search parameters change (e.g. on navigation back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlSkills = searchParams.get('skills') || '';
    const urlDomain = searchParams.get('domain') || '';
    const urlMinExp = searchParams.get('minExperience') || '';
    const urlMaxExp = searchParams.get('maxExperience') || '';
    const urlCompany = searchParams.get('company') || '';
    const urlMinRating = searchParams.get('minRating') || '';
    const urlPage = Number(searchParams.get('page')) || 1;
    const urlLimit = Number(searchParams.get('limit')) || 12;

    if (
      urlSearch !== filters.search ||
      urlSkills !== filters.skills ||
      urlDomain !== filters.domain ||
      urlMinExp !== filters.minExperience ||
      urlMaxExp !== filters.maxExperience ||
      urlCompany !== filters.company ||
      urlMinRating !== filters.minRating ||
      urlPage !== filters.page ||
      urlLimit !== filters.limit
    ) {
      setFilters({
        search: urlSearch,
        skills: urlSkills,
        domain: urlDomain,
        minExperience: urlMinExp,
        maxExperience: urlMaxExp,
        company: urlCompany,
        minRating: urlMinRating,
        page: urlPage,
        limit: urlLimit,
      });

      setLocalInputs({
        search: urlSearch,
        skills: urlSkills,
        domain: urlDomain,
        minExperience: urlMinExp,
        maxExperience: urlMaxExp,
        company: urlCompany,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Sync URL search parameters with filter state
  useEffect(() => {
    const params = buildQueryParams(filters);
    const nextUrl = params ? `?${params}` : '';
    setSearchParams(nextUrl, { replace: true });
  }, [filters, setSearchParams]);

  // Debounce typing inputs: update filters state 350ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        if (
          prev.search === localInputs.search &&
          prev.skills === localInputs.skills &&
          prev.domain === localInputs.domain &&
          prev.minExperience === localInputs.minExperience &&
          prev.maxExperience === localInputs.maxExperience &&
          prev.company === localInputs.company
        ) {
          return prev;
        }
        return {
          ...prev,
          search: localInputs.search,
          skills: localInputs.skills,
          domain: localInputs.domain,
          minExperience: localInputs.minExperience,
          maxExperience: localInputs.maxExperience,
          company: localInputs.company,
          page: 1,
        };
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [localInputs]);

  // Fetch mentors from backend API based on current filter state
  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      setError('');

      try {
        const params = {};
        if (filters.search) params.search = filters.search.trim();
        if (filters.skills) params.skills = filters.skills;
        if (filters.domain) params.domain = filters.domain.trim();
        if (filters.minExperience) params.minExperience = filters.minExperience;
        if (filters.maxExperience) params.maxExperience = filters.maxExperience;
        if (filters.company) params.company = filters.company.trim();
        if (filters.minRating) params.minRating = filters.minRating;
        params.page = filters.page;
        params.limit = filters.limit;
        params.sort = '-rating.average';

        const response = await api.get('/api/mentors', { params });

        if (response.data?.status === 'success') {
          const resultMentors = response.data.data.mentors || [];
          setMentors(resultMentors);
          setPagination(response.data.data.pagination || { page: 1, totalPages: 1, total: resultMentors.length, limit: filters.limit });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load mentors right now.');
        setMentors([]);
        setPagination({ page: filters.page, totalPages: 1, total: 0, limit: filters.limit });
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [filters.search, filters.skills, filters.domain, filters.minExperience, filters.maxExperience, filters.company, filters.minRating, filters.page, filters.limit]);

  const fetchSentRequests = async () => {
    if (!user || user.role !== 'student') return;
    try {
      const res = await api.get('/api/requests/sent');
      if (res.data && res.data.status === 'success') {
        setSentRequests(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load sent requests in mentor directory:', err);
    }
  };

  useEffect(() => {
    fetchSentRequests();
  }, [user]);

  const getMentorConnectionStatus = (mentor) => {
    if (!mentor || !user || user.role !== 'student' || !sentRequests.length) return null;
    const mentorUserId =
      typeof mentor.userId === 'object' && mentor.userId !== null
        ? String(mentor.userId._id || mentor.userId.id || '')
        : String(mentor.userId || mentor._id || mentor.id || '');
    const mentorProfileId = String(mentor._id || mentor.id || '');

    const matchingReq = sentRequests.find((req) => {
      const reqMentorId =
        typeof req.mentorId === 'object' && req.mentorId !== null
          ? String(req.mentorId._id || req.mentorId.id || '')
          : String(req.mentorId || '');
      return (
        (reqMentorId && reqMentorId === mentorUserId) ||
        (reqMentorId && reqMentorId === mentorProfileId)
      );
    });

    if (!matchingReq) return null;
    if (matchingReq.status === 'accepted') return 'connected';
    if (matchingReq.status === 'pending') return 'pending';
    return null;
  };

  const totalMatches = useMemo(() => mentors.length, [mentors]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const resetFilters = () => {
    setLocalInputs({
      search: '',
      skills: '',
      domain: '',
      minExperience: '',
      maxExperience: '',
      company: '',
    });
    setFilters({ ...defaultFilters });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setFilters((prev) => ({ ...prev, page: nextPage }));
  };

  return (
    <div className="dashboard-content" style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '8px' }}>
            Mentor Directory
          </p>
          <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Find the right mentor for your next growth step
          </h1>
        </div>

        {requestToast && (
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            {requestToast}
          </div>
        )}

        <div className="dashboard-card" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 2.2fr) minmax(150px, 1fr) minmax(130px, 1fr) minmax(120px, 0.8fr) minmax(130px, 0.8fr)', gap: '12px', alignItems: 'end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Search</span>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={localInputs.search}
                  onChange={(e) => setLocalInputs((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by name, skill, company"
                  style={{ width: '100%', height: '44px', padding: '0 14px 0 36px', borderRadius: '12px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Skills</span>
              <input
                value={localInputs.skills}
                onChange={(e) => setLocalInputs((prev) => ({ ...prev, skills: e.target.value }))}
                placeholder="e.g. react,node"
                style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '12px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Domain</span>
              <input
                value={localInputs.domain}
                onChange={(e) => setLocalInputs((prev) => ({ ...prev, domain: e.target.value }))}
                placeholder="Domain"
                style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '12px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Min Rating</span>
              <select
                value={filters.minRating}
                onChange={(e) => updateFilter('minRating', e.target.value)}
                style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '12px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="">Any</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
                <option value="4.8">4.8+</option>
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="btn btn-secondary btn-sm"
              style={{ height: '44px', width: '100%' }}
            >
              <FilterX size={14} />
              Reset
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))', gap: '12px', marginTop: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Min Experience</span>
              <input
                type="number"
                min="0"
                value={localInputs.minExperience}
                onChange={(e) => setLocalInputs((prev) => ({ ...prev, minExperience: e.target.value }))}
                placeholder="Min years"
                style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '12px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Max Experience</span>
              <input
                type="number"
                min="0"
                value={localInputs.maxExperience}
                onChange={(e) => setLocalInputs((prev) => ({ ...prev, maxExperience: e.target.value }))}
                placeholder="Max years"
                style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '12px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Company</span>
              <input
                value={localInputs.company}
                onChange={(e) => setLocalInputs((prev) => ({ ...prev, company: e.target.value }))}
                placeholder="Google"
                style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '12px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px' }}>
              <SlidersHorizontal size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                {totalMatches} mentors found
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="api-error-state" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="dashboard-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading mentors...
        </div>
      ) : (
        <>
          <div className="mentor-directory-grid">
            {mentors.map((mentor) => {
              const connectionStatus = getMentorConnectionStatus(mentor);

              return (
                <div
                  key={mentor._id}
                  className="dashboard-card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={mentor.userId?.profileImage || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80'}
                      alt={mentor.userId?.name || 'Mentor'}
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--border-light)',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {mentor.userId?.name || 'Mentor Profile'}
                        </h3>
                        {connectionStatus === 'connected' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            Already Connected
                          </span>
                        )}
                        {connectionStatus === 'pending' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            <Clock size={12} />
                            Request Pending
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--primary)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {mentor.domain || 'General Mentorship'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontWeight: '500' }}>{mentor.company || 'Company not listed'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span>{mentor.location || 'Remote'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {mentor.experienceYears || 0} Years Experience
                        {mentor.experienceLevel ? ` (${mentor.experienceLevel})` : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" style={{ flexShrink: 0 }} />
                      <strong style={{ color: 'var(--text-primary)' }}>{mentor.rating?.average || 0}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>({mentor.rating?.count || 0} reviews)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '30px', alignItems: 'center' }}>
                    {(mentor.expertise || []).slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      marginTop: 'auto',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-light)',
                    }}
                  >
                    {connectionStatus ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedMentorForPreview(mentor)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        View Profile
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedMentorForPreview(mentor)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12.5px',
                            fontWeight: '600',
                          }}
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedMentorForRequest(mentor)}
                          style={{
                            flex: 1.25,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                          }}
                        >
                          <UserCheck size={14} />
                          Request Mentorship
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{ opacity: pagination.page <= 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                style={{ opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detailed Mentor Profile Modal */}
      <MentorProfileModal
        mentor={selectedMentorForPreview}
        isOpen={Boolean(selectedMentorForPreview)}
        onClose={() => setSelectedMentorForPreview(null)}
        connectionStatus={selectedMentorForPreview ? getMentorConnectionStatus(selectedMentorForPreview) : null}
        onRequestMentorship={(mentor) => {
          setSelectedMentorForPreview(null);
          setSelectedMentorForRequest(mentor);
        }}
      />

      {/* Interactive Mentorship Request Modal */}
      <RequestMentorshipModal
        mentor={selectedMentorForRequest}
        isOpen={Boolean(selectedMentorForRequest)}
        onClose={() => setSelectedMentorForRequest(null)}
        connectionStatus={selectedMentorForRequest ? getMentorConnectionStatus(selectedMentorForRequest) : null}
        onSuccess={() => {
          setRequestToast('Mentorship request sent successfully!');
          fetchSentRequests();
          setTimeout(() => setRequestToast(''), 4000);
        }}
      />
    </div>
  );
};

export default MentorListingPage;
