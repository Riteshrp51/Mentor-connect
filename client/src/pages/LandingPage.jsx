import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MessageSquare,
  Briefcase,
  TrendingUp,
  Star,
  Check,
  ArrowRight,
  Search,
  Zap,
  GraduationCap
} from 'lucide-react';
import MentorProfileModal from '../components/MentorProfileModal';
import RequestMentorshipModal from '../components/RequestMentorshipModal';

function LandingPage() {
  const navigate = useNavigate();
  const [selectedMentorForPreview, setSelectedMentorForPreview] = useState(null);
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState(null);
  const [requestToast, setRequestToast] = useState('');
  const stats = [
    { value: 1000, suffix: '+', label: 'Students', decimals: 0 },
    { value: 200, suffix: '+', label: 'Mentors', decimals: 0 },
    { value: 500, suffix: '+', label: 'Mentorship Sessions', decimals: 0 },
    { value: 4.8, suffix: '/5', label: 'Average Rating', decimals: 1 }
  ];

  function AnimatedCounter({ value, suffix = '', decimals = 0, duration = 1400 }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      let frameId;
      const startTime = performance.now();

      const updateValue = (timestamp) => {
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(value * easedProgress);

        if (progress < 1) {
          frameId = requestAnimationFrame(updateValue);
        }
      };

      frameId = requestAnimationFrame(updateValue);

      return () => cancelAnimationFrame(frameId);
    }, [value, duration]);

    const formattedValue = displayValue.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return <div className="stats-number">{formattedValue}{suffix}</div>;
  }

  // Mock Mentor Data (4 Fixed Mentors)
  const sampleMentors = [
    {
      id: 1,
      _id: 'mentor-1',
      name: 'Dr. Sarah Jenkins',
      role: 'CSE Tech Doubt Solver & Senior Scientist',
      domain: 'CSE Tech Doubt Solver',
      company: 'Google',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      skills: ['C++', 'Python', 'Core CS (OS/DBMS)', 'DSA'],
      expertise: ['C++', 'Java', 'Python', 'Core CS (OS/DBMS)', 'Data Structures (DSA)', 'PyTorch'],
      experience: '8+ years experience',
      experienceYears: 8,
      rating: 4.9,
      bio: 'Specializes in resolving deep CSE tech doubts, core CS fundamentals (OS, DBMS, Networks), Python, and full-stack coding architecture.',
      location: 'New York, NY',
      isAvailable: true,
    },
    {
      id: 2,
      _id: 'mentor-2',
      name: 'Alex Rivera',
      role: 'Mock Interview Specialist & Lead Engineer',
      domain: 'Mock Interviews',
      company: 'Netflix',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      skills: ['Mock Interviews', 'System Design', 'React', 'DSA'],
      expertise: ['Coding/DSA Mock Interviews', 'System Design Mock', 'Behavioral STAR Method', 'React', 'Live Code Debugging'],
      experience: '6+ years experience',
      experienceYears: 6,
      rating: 4.8,
      bio: 'Conducts realistic mock interview rounds including technical DSA live-coding, System Design walkthroughs, and behavioral HR prep.',
      location: 'San Francisco, CA',
      isAvailable: true,
    },
    {
      id: 3,
      _id: 'mentor-3',
      name: 'Priya Patel',
      role: 'Principal Career Counselor & Strategist',
      domain: 'Career Counseling',
      company: 'Airbnb',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      skills: ['Career Roadmapping', 'Resume Review', 'Higher Studies'],
      expertise: ['Career Roadmapping', 'Resume Roasting', 'LinkedIn Optimization', 'Higher Studies Prep', 'Portfolio Strategy'],
      experience: '7+ years experience',
      experienceYears: 7,
      rating: 5.0,
      bio: 'Dedicated career counselor guiding students on goal setting, roadmap design, resume reviews, portfolio critique, and higher education paths.',
      location: 'Seattle, WA',
      isAvailable: true,
    },
    {
      id: 4,
      _id: 'mentor-4',
      name: 'Marcus Chen',
      role: 'VP of Enterprise Sales & Strategy',
      domain: 'Sales & Business Strategy',
      company: 'AWS',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      skills: ['B2B Sales', 'Pitching & Discovery', 'Cloud Strategy'],
      expertise: ['B2B Tech Sales', 'Cold Outreach & Pitching', 'Deal Negotiation', 'Enterprise Cloud Growth', 'Go-To-Market Strategy'],
      experience: '9+ years experience',
      experienceYears: 9,
      rating: 4.7,
      bio: 'Sales and business strategy mentor helping students master B2B client acquisition, discovery calls, outreach, and commercial growth.',
      location: 'Austin, TX',
      isAvailable: true,
    },
  ];

  // Mock Testimonial Data
  const testimonials = [
    {
      id: 1,
      name: 'Sneha Kapoor',
      role: 'CS Student',
      college: 'IIT Delhi',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
      text: 'MentorConnect completely changed how I approached my software engineering internships. My mentor helped me ace my coding interviews!'
    },
    {
      id: 2,
      name: 'Rohan Verma',
      role: 'SDE-1',
      college: 'Amazon (Alumnus)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
      text: 'Having a senior guide me through my final year project and resume prep was invaluable. Now I am mentoring other students to give back.'
    },
    {
      id: 3,
      name: 'Priya Sen',
      role: 'ECE Student',
      college: 'BITS Pilani',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80',
      text: 'The structured sessions kept me accountable. Finding a mentor who actually works in my dream domain made all the difference.'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="badge">Connect • Learn • Grow</span>
            <h1>Find the Right Mentor. Build the Right Future.</h1>
            <p>
              Connect with experienced seniors, alumni, teachers, and industry professionals 
              who can guide you toward your academic and career goals.
            </p>
            <div className="hero-actions">
              <a href="#mentors" className="btn btn-primary">
                Find a Mentor
                <ArrowRight size={18} />
              </a>
              <Link to="/register?role=mentor" className="btn btn-secondary">
                Become a Mentor
              </Link>
            </div>
          </div>

          {/* Interactive Abstract Visual */}
          <div className="hero-visual">
            <div className="visual-canvas">
              {/* Abstract circular guides */}
              <div className="visual-bg-circle circle-lg"></div>
              <div className="visual-bg-circle circle-md"></div>
              
              {/* Connecting lines via SVG */}
              <svg className="visual-lines" viewBox="0 0 400 400">
                {/* Line: Student to Mentor */}
                <path d="M 80,105 Q 200,100 300,210" className="svg-connection-line" />
                {/* Line: Mentor to Career */}
                <path d="M 300,210 Q 220,300 110,310" className="svg-connection-line" />
                {/* Line: Student to Career */}
                <path d="M 80,105 L 110,310" className="svg-connection-line" />
                
                {/* Glowing flow dots */}
                <circle r="4" className="svg-pulse-dot">
                  <animateMotion dur="6s" repeatCount="indefinite" path="M 80,105 Q 200,100 300,210" />
                </circle>
                <circle r="4" className="svg-pulse-dot">
                  <animateMotion dur="8s" repeatCount="indefinite" path="M 300,210 Q 220,300 110,310" />
                </circle>
              </svg>

              {/* Student Card */}
              <div className="visual-card card-student">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                  alt="Student Profile" 
                  className="node-avatar"
                />
                <div className="node-info">
                  <h4>Neha Gupta</h4>
                  <p>Student • Looking for SDE guidance</p>
                </div>
              </div>

              {/* Mentor Card */}
              <div className="visual-card card-mentor">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" 
                  alt="Mentor Profile" 
                  className="node-avatar"
                />
                <div className="node-info">
                  <h4>Vikas Kumar</h4>
                  <p>Senior SDE at Google • Mentor</p>
                </div>
              </div>

              {/* Career Goal Card */}
              <div className="visual-card card-career">
                <div className="node-icon-wrapper">
                  <Briefcase size={18} />
                </div>
                <div className="node-info">
                  <h4>Career Goal</h4>
                  <p>Software Engineer</p>
                </div>
              </div>

              {/* Float Skill Chips */}
              <div className="visual-chip chip-skill-1">
                <Zap size={12} className="text-primary" />
                <span>React & Node.js</span>
              </div>
              <div className="visual-chip chip-skill-2">
                <Zap size={12} className="text-accent" />
                <span>System Design</span>
              </div>
              <div className="visual-chip chip-goal-1">
                <span>Mock Interview</span>
              </div>
              <div className="visual-chip chip-goal-2">
                <span>Resume Review</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Statistics Section */}
      <section className="stats-section">
        <div className="container stats-grid">
          {stats.map((stat) => (
            <div className="stats-card" key={stat.label}>
              <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
              <div className="stats-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why MentorConnect Section */}
      <section className="section" id="why-us">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose MentorConnect?</h2>
            <p>We build structured paths to connect ambition with experience, delivering frictionless mentorship.</p>
          </div>
          
          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon-box">
                <Search size={22} />
              </div>
              <h3>Find the Right Mentor</h3>
              <p>Discover mentors based on your interests, skills, career goals, and expertise.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon-box">
                <MessageSquare size={22} />
              </div>
              <h3>Real-Time Communication</h3>
              <p>Communicate with mentors instantly through real-time messaging and notifications.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon-box">
                <Calendar size={22} />
              </div>
              <h3>Structured Mentorship</h3>
              <p>Schedule mentorship sessions, share resources, and keep track of your learning journey.</p>
            </div>
            
            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon-box">
                <TrendingUp size={22} />
              </div>
              <h3>Grow Your Career</h3>
              <p>Receive personalized guidance, feedback, and practical career advice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section section-bg" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Get started in minutes and streamline your professional growth in 4 simple steps.</p>
          </div>

          <div className="timeline-outer">
            <div className="timeline-line">
              <div className="timeline-progress"></div>
            </div>

            <div className="timeline-steps">
              {/* Step 1 */}
              <div className="step-item">
                <div className="step-number-node">01</div>
                <h3>Create Your Profile</h3>
                <p>Tell us about your skills, interests, and career goals.</p>
              </div>

              {/* Step 2 */}
              <div className="step-item">
                <div className="step-number-node">02</div>
                <h3>Find a Mentor</h3>
                <p>Discover mentors who match your requirements.</p>
              </div>

              {/* Step 3 */}
              <div className="step-item">
                <div className="step-number-node">03</div>
                <h3>Connect & Learn</h3>
                <p>Send a request and communicate with your mentor in real time.</p>
              </div>

              {/* Step 4 */}
              <div className="step-item">
                <div className="step-number-node">04</div>
                <h3>Grow Together</h3>
                <p>Attend sessions, access resources, track progress, and receive feedback.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Mentors Section */}
      <section className="section" id="mentors">
        <div className="container">
          <div className="section-header">
            <h2>Meet Our Mentors</h2>
            <p>Get guidance from highly experienced peers and industry veterans already working in leading roles.</p>
          </div>

          <div className="mentors-grid">
            {sampleMentors.map((mentor) => (
              <div className="mentor-card" key={mentor.id}>
                <div className="mentor-card-header">
                  <img src={mentor.avatar} alt={mentor.name} className="mentor-avatar" />
                  <div className="mentor-title">
                    <h3>{mentor.name}</h3>
                    <p>{mentor.role} at <strong>{mentor.company}</strong></p>
                  </div>
                </div>

                <div className="mentor-meta">
                  <span className="mentor-rating">
                    <Star size={14} fill="currentColor" /> {mentor.rating}
                  </span>
                  <span className="mentor-exp">{mentor.experience}</span>
                </div>

                <div className="skills-list">
                  {mentor.skills.map((skill, index) => (
                    <span className="skill-tag" key={index}>{skill}</span>
                  ))}
                </div>

                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={() => setSelectedMentorForPreview(mentor)}
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>

          <div className="mentors-footer">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate('/login')}
            >
              Explore All Mentors
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Student Benefits & Premium Dashboard Visual Section */}
      <section className="section section-bg" id="benefits">
        <div className="container benefits-grid">
          <div className="benefits-content">
            <span className="badge">Student Benefits</span>
            <h2>What you can achieve through the platform</h2>
            <p>
              By bridging the gap between student aspirations and mentor insights, we enable 
              growth that translates directly into academic success and dream career offers.
            </p>

            <div className="benefits-list">
              {/* Benefit 1 */}
              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div className="benefit-info">
                  <h3>Career Guidance</h3>
                  <p>Navigate job searches and career transitions.</p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div className="benefit-info">
                  <h3>Resume & Interview Prep</h3>
                  <p>Get actionable advice on resume building and mock interviews.</p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div className="benefit-info">
                  <h3>Industry Insights</h3>
                  <p>Learn what companies look for directly from employees.</p>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div className="benefit-info">
                  <h3>Skill Development</h3>
                  <p>Acquire high-demand technical and soft skills.</p>
                </div>
              </div>

              {/* Benefit 5 */}
              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div className="benefit-info">
                  <h3>Academic Guidance</h3>
                  <p>Select the right courses, projects, and specializations.</p>
                </div>
              </div>

              {/* Benefit 6 */}
              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div className="benefit-info">
                  <h3>Networking Opportunities</h3>
                  <p>Open doors to internships and job referrals.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Dashboard Mockup UI */}
          <div className="dashboard-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
              </div>
              <span className="mockup-tab">Mentorship Dashboard</span>
              <div style={{ width: '30px' }}></div>
            </div>
            
            <div className="mockup-body">
              {/* Mockup Sidebar */}
              <div className="mockup-sidebar">
                <div className="sidebar-item sidebar-item-active"></div>
                <div className="sidebar-item"></div>
                <div className="sidebar-item"></div>
                <div className="sidebar-item"></div>
              </div>
              
              {/* Mockup Content */}
              <div className="mockup-main">
                {/* Chat Mockup */}
                <div className="mockup-card">
                  <div className="mockup-chat-bubble">
                    <div className="bubble-avatar">VS</div>
                    <div className="bubble-text">
                      Hey Sneha! Let's schedule our mock coding session for this Saturday.
                    </div>
                  </div>
                  <div className="mockup-chat-bubble" style={{ justifyContent: 'flex-end' }}>
                    <div className="bubble-text right">
                      Perfect! I have revised React and Data Structures. Thanks Vikas!
                    </div>
                    <div className="bubble-avatar" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>SK</div>
                  </div>
                </div>
                
                {/* Active Session Status */}
                <div className="mockup-card mockup-session-status">
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '2px' }}>Next Session</h4>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mock Tech Interview • Sat, 3 PM</p>
                  </div>
                  <div className="status-indicator">
                    <div className="status-dot"></div>
                    <span>Active Connection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section" id="testimonials">
        <div className="container">
          <div className="section-header">
            <h2>What Students Say</h2>
            <p>Read about the transformations, career moves, and growth student peers experienced.</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((test) => (
              <div className="testimonial-card" key={test.id}>
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" stroke="none" />
                  ))}
                </div>
                <p className="testimonial-text">"{test.text}"</p>
                <div className="testimonial-user">
                  <img src={test.avatar} alt={test.name} className="testimonial-avatar" />
                  <div className="testimonial-user-info">
                    <h4>{test.name}</h4>
                    <p>{test.role} • <strong>{test.college}</strong></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call To Action Banner */}
      <section className="section container" style={{ paddingBottom: '80px' }}>
        <div className="cta-banner">
          <div className="cta-banner-bg"></div>
          <h2>Your next opportunity could start with the right mentor.</h2>
          <p>Connect with experienced mentors and take the next step toward your goals.</p>
          <div className="hero-actions">
            <a href="#mentors" className="btn btn-primary" style={{ backgroundColor: 'white', color: 'var(--primary)' }}>
              Find a Mentor
            </a>
            <Link to="/register?role=mentor" className="btn btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}>
              Become a Mentor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <h3>
              <div className="logo-icon-wrapper" style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: '6px' }}>
                <GraduationCap size={18} strokeWidth={2.5} />
              </div>
              MentorConnect
            </h3>
            <p>
              Connecting students with suitable mentors to bridge the gap between academic 
              learning and real-world career success.
            </p>
            <div className="social-links">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="Twitter">
                <svg className="lucide lucide-twitter" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="LinkedIn">
                <svg className="lucide lucide-linkedin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" rx="1" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="GitHub">
                <svg className="lucide lucide-github" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.2 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <div className="footer-links">
              <a href="#mentors">Find Mentors</a>
              <a href="#how-it-works">How It Works</a>
              <Link to="/register?role=mentor">Become a Mentor</Link>
              <a href="#benefits">Resources</a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <div className="footer-links">
              <a href="#benefits">About</a>
              <a href="#why-us">Help Center</a>
              <a href="#testimonials">Contact</a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <div className="footer-links">
              <a href="#why-us">Privacy Policy</a>
              <a href="#why-us">Terms of Service</a>
            </div>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>© 2026 MentorConnect. All rights reserved.</p>
        </div>
      </footer>

      {/* Detailed Mentor Profile Modal */}
      <MentorProfileModal
        mentor={selectedMentorForPreview}
        isOpen={Boolean(selectedMentorForPreview)}
        onClose={() => setSelectedMentorForPreview(null)}
        onRequestMentorship={(mentor) => {
          setSelectedMentorForPreview(null);
          navigate('/login');
        }}
      />

      {/* Mentorship Request Modal */}
      <RequestMentorshipModal
        mentor={selectedMentorForRequest}
        isOpen={Boolean(selectedMentorForRequest)}
        onClose={() => setSelectedMentorForRequest(null)}
        onSuccess={() => {
          setRequestToast('Mentorship request sent successfully!');
          setTimeout(() => setRequestToast(''), 4000);
        }}
      />
    </>
  );
}

export default LandingPage;
