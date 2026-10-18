import { useState } from 'react';
import {
  X,
  Star,
  Briefcase,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  UserCheck,
} from 'lucide-react';

const MentorProfileModal = ({ mentor, isOpen, onClose, onRequestMentorship, connectionStatus }) => {
  const [activeTab, setActiveTab] = useState('about'); // 'about', 'experience', 'reviews', 'availability'

  if (!isOpen || !mentor) return null;

  const mentorName = mentor.userId?.name || mentor.name || 'Mentor Profile';
  const mentorAvatar =
    mentor.userId?.profileImage ||
    mentor.profileImage ||
    mentor.avatar ||
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80';
  const mentorCompany = mentor.company || mentor.userId?.company || mentor.title || 'Top Tech Company';
  const mentorDomain = mentor.domain || mentor.title || 'Software & Product Engineering';
  const mentorLocation = mentor.location || 'Remote (Global)';
  const mentorExp = mentor.experienceYears ? `${mentor.experienceYears} Years Experience` : (mentor.experience || '5+ Years Experience');
  const mentorRating = mentor.rating?.average || mentor.rating || 4.9;
  const mentorReviewCount = mentor.rating?.count || mentor.reviews || 36;
  const mentorBio =
    mentor.bio ||
    'Senior engineering mentor dedicated to helping aspiring developers, engineering students, and career switchers navigate tech careers, ace technical interviews, and build scalable distributed systems.';
  const expertiseList = mentor.expertise || mentor.skills || ['React', 'Node.js', 'System Design', 'TypeScript', 'Career Growth'];
  const mentorshipAreas = mentor.mentorshipAreas || ['Career Strategy', 'Technical Architecture', 'Resume & Mock Interviews', 'Coding Best Practices'];

  const sampleWorkHistory = [
    {
      role: `Senior Staff Engineer`,
      company: mentorCompany,
      period: '2022 - Present',
      description: 'Leading core product infrastructure, mentoring mid-level and junior engineers, and driving system scalability.'
    },
    {
      role: 'Full Stack Engineer',
      company: 'High-Growth Tech Startup',
      period: '2019 - 2022',
      description: 'Built customer-facing web applications, optimized frontend latency by 45%, and architected microservices.'
    },
    {
      role: 'B.S. in Computer Science',
      company: 'Top Tier University',
      period: '2015 - 2019',
      description: 'Focus in Software Engineering, Algorithms & Distributed Computing.'
    }
  ];

  const sampleReviews = [
    {
      id: 1,
      name: 'Rohan Sharma',
      role: 'Frontend Intern at Razorpay',
      date: '2 weeks ago',
      rating: 5,
      text: 'The mock technical interview was exceptionally insightful. Provided direct, actionable feedback on my code structure and helped me land an offer!'
    },
    {
      id: 2,
      name: 'Ananya Verma',
      role: 'CS Final Year Student',
      date: '1 month ago',
      rating: 5,
      text: 'Super clear explanations on system design concepts. Patient, encouraging, and gave great guidance on preparing my resume for top tech companies.'
    },
    {
      id: 3,
      name: 'Karan Mehra',
      role: 'Associate Software Engineer',
      date: '2 months ago',
      rating: 5,
      text: 'Outstanding mentor. Guided me through complex React patterns and best practices that I use daily in my work now.'
    }
  ];

  const sampleSlots = [
    { day: 'Tuesday', time: '6:00 PM - 7:00 PM EST', available: true },
    { day: 'Thursday', time: '5:30 PM - 6:30 PM EST', available: true },
    { day: 'Saturday', time: '11:00 AM - 12:00 PM EST', available: true },
    { day: 'Sunday', time: '3:00 PM - 4:00 PM EST', available: false }
  ];

  const handleRequestClick = () => {
    onClose();
    if (onRequestMentorship) {
      onRequestMentorship(mentor);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="dashboard-card"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-light)'
        }}
      >
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0,0,0,0.3)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'background 0.2s'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
            padding: '28px 28px 20px 28px',
            color: '#fff',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={mentorAvatar}
                alt={mentorName}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  backgroundColor: '#10b981',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: '2px solid #fff'
                }}
                title="Active & Available"
              />
            </div>

            <div style={{ flex: '1 1 280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>{mentorName}</h2>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCircle2 size={12} />
                  Verified Mentor
                </span>
              </div>

              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={14} />
                <span>{mentorDomain} at <strong>{mentorCompany}</strong></span>
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.85)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} />
                  {mentorLocation}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={14} />
                  {mentorExp}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                  <Star size={13} fill="#fbbf24" color="#fbbf24" />
                  <strong>{mentorRating}</strong>
                  <span style={{ opacity: 0.8 }}>({mentorReviewCount} reviews)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation in Header */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginTop: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.15)',
              paddingBottom: '2px'
            }}
          >
            {[
              { id: 'about', label: 'Overview & Skills' },
              { id: 'experience', label: 'Experience & Background' },
              { id: 'reviews', label: `Reviews (${mentorReviewCount})` },
              { id: 'availability', label: 'Availability' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontSize: '13px',
                  fontWeight: activeTab === tab.id ? '700' : '500',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '3px solid #fff' : '3px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            flex: '1 1 auto',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          {/* TAB 1: ABOUT & SKILLS */}
          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  About the Mentor
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {mentorBio}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  Core Expertise & Technical Skills
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {expertiseList.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(79, 70, 229, 0.2)'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  Mentorship Focus Areas
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {mentorshipAreas.map((area, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <Sparkles size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPERIENCE & BACKGROUND */}
          {activeTab === 'experience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Career & Education Journey
              </h4>

              <div style={{ position: 'relative', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '7px',
                    top: '6px',
                    bottom: '6px',
                    width: '2px',
                    backgroundColor: 'var(--border-light)'
                  }}
                />

                {sampleWorkHistory.map((item, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '4px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        border: '3px solid var(--bg-primary)'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
                      <h5 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                        {item.role}
                      </h5>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {item.period}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', marginTop: '2px' }}>
                      {item.company}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {mentorRating} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ 5.0</span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} fill="#fbbf24" color="#fbbf24" />
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <strong>100%</strong> positive mentee recommendation rate
                  <br />
                  <span>Based on {mentorReviewCount} completed sessions</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sampleReviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{review.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>• {review.role}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{review.date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={12} fill="#fbbf24" color="#fbbf24" />
                      ))}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                      "{review.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AVAILABILITY */}
          {activeTab === 'availability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: 'var(--primary)' }} />
                <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>
                  Weekly Mentoring Schedule (Typical Openings)
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {sampleSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: slot.available ? 'var(--bg-secondary)' : 'rgba(0,0,0,0.03)',
                      opacity: slot.available ? 1 : 0.6
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {slot.day}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {slot.time}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: slot.available ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          color: slot.available ? '#10b981' : '#64748b'
                        }}
                      >
                        {slot.available ? 'Available' : 'Booked'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                💡 <em>Note:</em> Send a mentorship request specifying your preferred agenda. Once accepted, you can coordinate specific 1:1 call timings directly.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Average response time: <strong>&lt; 24 hours</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {connectionStatus === 'connected' ? (
              <>
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: '700',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={15} />
                  Already Connected
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                >
                  Close
                </button>
              </>
            ) : connectionStatus === 'pending' ? (
              <>
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: '700',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Clock size={15} />
                  Request Pending
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleRequestClick}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserCheck size={15} />
                  Request Mentorship
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorProfileModal;
