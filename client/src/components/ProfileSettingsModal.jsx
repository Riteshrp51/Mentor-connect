import { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  CheckCircle2,
  Save,
  Camera,
  Upload,
  Trash2,
  Target,
  AlertTriangle,
  Award,
  Layers,
  Briefcase,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STUDENT_GOAL_OPTIONS = [
  { id: 'Mock Interviews', title: 'Mock Interviews', desc: 'Coding/DSA & Behavioral HR rounds prep' },
  { id: 'Résumé & Portfolio Review', title: 'Résumé & Portfolio Review', desc: 'Live line-by-line feedback & LinkedIn audit' },
  { id: 'CSE Tech Doubt Clearing', title: 'CSE Tech Doubt Clearing', desc: 'Core CS (OS/DBMS/Networks) & Frameworks' },
  { id: 'Career Counseling & Roadmaps', title: 'Career Counseling & Roadmaps', desc: 'Role transitions, goal setting & industry guidance' },
  { id: 'Sales & Non-Tech Tracks', title: 'Sales & Business Strategy', desc: 'Outreach pitching, client SDR & growth' },
  { id: 'Higher Studies Guidance', title: 'Higher Studies Guidance', desc: 'MS/PhD applications & university selection' },
];

const MENTOR_SERVICE_OPTIONS = [
  {
    id: 'Career Counseling',
    title: 'Career Counseling',
    desc: 'Goal setting, roadmap design, higher studies guidance, industry transition.',
    icon: Target,
  },
  {
    id: 'Résumé & Portfolio Review',
    title: 'Résumé & Portfolio Review',
    desc: 'Async video feedback, live line-by-line review, LinkedIn optimization.',
    icon: Layers,
  },
  {
    id: 'Mock Interviews',
    title: 'Mock Interviews',
    desc: 'Coding/DSA, System Design, Behavioral, HR, Mock HR rounds.',
    icon: Award,
  },
  {
    id: 'CSE Tech Doubt Solver',
    title: 'CSE Tech Doubt Solver',
    desc: 'Languages (C++, Java, Python, JS), Core CS (OS, DBMS, Networks), Frameworks (React, Node, PyTorch).',
    icon: HelpCircle,
  },
];

const EXPERIENCE_LEVELS = [
  'Junior Engineer / Associate',
  'Mid-Level Software Engineer',
  'Senior Software Engineer',
  'Tech Lead / Principal Architect',
  'Engineering Manager / Director',
  'Career Coach & Tech Recruiter',
  'Founder / Executive',
];

const ProfileSettingsModal = ({ isOpen, onClose, onSaveSuccess }) => {
  const { user, updateProfile } = useAuth();

  // Basic info
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [headline, setHeadline] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [timezone, setTimezone] = useState('UTC-5 (Eastern Time)');

  // Student specific
  const [mentorshipGoals, setMentorshipGoals] = useState([]);
  const [challengeAreas, setChallengeAreas] = useState('');
  const [skillMatrix, setSkillMatrix] = useState([]);
  const [newMatrixSkill, setNewMatrixSkill] = useState('');
  const [newMatrixLevel, setNewMatrixLevel] = useState('Intermediate');

  // Mentor specific
  const [serviceCategories, setServiceCategories] = useState([]);
  const [experienceLevel, setExperienceLevel] = useState('Senior Software Engineer');
  const [skills, setSkills] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize from user or local storage
  useEffect(() => {
    if (user && isOpen) {
      const saved = JSON.parse(localStorage.getItem(`user_profile_${user._id || user.id}`) || '{}');

      setName(user.name || saved.name || '');
      setProfileImage(user.profileImage || saved.profileImage || '');
      setHeadline(user.headline || saved.headline || '');
      setCompany(user.company || saved.company || '');
      setBio(user.bio || saved.bio || '');
      setGithub(user.github || saved.github || '');
      setLinkedin(user.linkedin || saved.linkedin || '');
      setPortfolio(user.portfolio || saved.portfolio || '');
      setTimezone(user.timezone || saved.timezone || 'UTC-5 (Eastern Time)');

      // Student fields
      setMentorshipGoals(
        (user.mentorshipGoals && user.mentorshipGoals.length > 0)
          ? user.mentorshipGoals
          : (saved.mentorshipGoals || ['Mock Interviews', 'Résumé & Portfolio Review'])
      );
      setChallengeAreas(user.challengeAreas || saved.challengeAreas || '');
      setSkillMatrix(
        (user.skillMatrix && user.skillMatrix.length > 0)
          ? user.skillMatrix
          : (saved.skillMatrix || [
              { skill: 'Python', level: 'Intermediate' },
              { skill: 'Data Structures (LeetCode)', level: '150+ solved' },
            ])
      );

      // Mentor fields
      setServiceCategories(
        (user.serviceCategories && user.serviceCategories.length > 0)
          ? user.serviceCategories
          : (saved.serviceCategories || ['Mock Interviews', 'Résumé & Portfolio Review', 'CSE Tech Doubt Solver'])
      );
      setExperienceLevel(user.experienceLevel || saved.experienceLevel || 'Senior Software Engineer');
      setSkills(
        (user.skills && user.skills.length > 0)
          ? user.skills
          : (saved.skills || ['React', 'System Design', 'Node.js', 'Python', 'DSA'])
      );

      setSavedSuccess(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isStudent = user.role === 'student';

  // File upload from PC/Drive
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setProfileImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle student mentorship goal
  const toggleStudentGoal = (goalId) => {
    if (mentorshipGoals.includes(goalId)) {
      setMentorshipGoals(mentorshipGoals.filter((g) => g !== goalId));
    } else {
      setMentorshipGoals([...mentorshipGoals, goalId]);
    }
  };

  // Toggle mentor service category
  const toggleMentorService = (serviceId) => {
    if (serviceCategories.includes(serviceId)) {
      setServiceCategories(serviceCategories.filter((s) => s !== serviceId));
    } else {
      setServiceCategories([...serviceCategories, serviceId]);
    }
  };

  // Skill matrix operations (Student)
  const handleAddMatrixEntry = (e) => {
    e.preventDefault();
    if (!newMatrixSkill.trim()) return;
    setSkillMatrix([
      ...skillMatrix,
      { skill: newMatrixSkill.trim(), level: newMatrixLevel.trim() || 'Intermediate' },
    ]);
    setNewMatrixSkill('');
    setNewMatrixLevel('Intermediate');
  };

  const handleRemoveMatrixEntry = (index) => {
    setSkillMatrix(skillMatrix.filter((_, i) => i !== index));
  };

  // Technical skills tag operations (Mentor)
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    const trimmed = newSkillInput.trim();
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedProfile = {
      name,
      profileImage,
      headline,
      company,
      bio,
      github,
      linkedin,
      portfolio,
      timezone,
      isProfileCompleted: true,
      updatedAt: new Date().toISOString(),
      ...(isStudent
        ? {
            mentorshipGoals,
            challengeAreas,
            skillMatrix,
          }
        : {
            serviceCategories,
            experienceLevel,
            skills,
            expertise: skills,
            mentorshipAreas: serviceCategories,
          }),
    };

    localStorage.setItem(`user_profile_${user._id || user.id}`, JSON.stringify(updatedProfile));
    localStorage.setItem(`profile_completed_${user._id || user.id}`, 'true');

    try {
      if (updateProfile) {
        await updateProfile(updatedProfile);
      }
    } catch (err) {
      console.warn('Profile save note:', err);
    }

    setIsSaving(false);
    setSavedSuccess(true);
    if (onSaveSuccess) {
      onSaveSuccess(updatedProfile);
    }
    setTimeout(() => {
      onClose();
    }, 850);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
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
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border-light)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isStudent ? <GraduationCap size={22} /> : <Briefcase size={22} />}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                {isStudent ? 'Student Profile & Goals' : 'Mentor Profile & Services'}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {isStudent
                  ? 'Configure mentorship needs, skill matrix, and challenge focus areas'
                  : 'Configure service offerings, seniority level, and technical domain expertise'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSave}
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {savedSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Profile details updated and saved successfully!</span>
            </div>
          )}

          {/* Section 1: Profile Picture Upload from PC / Drive */}
          <div
            style={{
              padding: '18px 20px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
            }}
          >
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Profile Picture
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              <div
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to choose image from your computer/drive"
              >
                <img
                  src={
                    profileImage ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={name || 'Profile'}
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--primary)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--surface)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <Camera size={13} />
                </div>
              </div>

              <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '600' }}
                  >
                    <Upload size={14} style={{ color: 'var(--primary)' }} />
                    Upload from PC / Drive
                  </button>

                  {profileImage && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setProfileImage('')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12.5px',
                        color: '#ef4444',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <Trash2 size={13} />
                      Remove Photo
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                  Select an image file from your computer or Google Drive sync. JPG, PNG, WebP supported (max 5MB).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Full Name and Degree/Job Title & Institution/Company */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {isStudent ? 'Current Major / Degree Program' : 'Current Job Title / Domain'} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder={isStudent ? 'e.g., Computer Science Sophomore' : 'e.g., Senior Data Scientist / Tech Lead'}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {isStudent ? 'University / College / Institution' : 'Company / Organization'} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder={isStudent ? 'e.g., State University' : 'e.g., Google, Amazon, Netflix'}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* STUDENT ONLY: Mentorship Goals (Primary Focus) */}
          {isStudent && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Mentorship Goals (What I'm Looking For)
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Select your active needs so mentors can tailor sessions directly to your objectives:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {STUDENT_GOAL_OPTIONS.map((goal) => {
                  const isSelected = mentorshipGoals.includes(goal.id);
                  return (
                    <div
                      key={goal.id}
                      onClick={() => toggleStudentGoal(goal.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {goal.title}
                        </span>
                        {isSelected && <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />}
                      </div>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                        {goal.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STUDENT ONLY: Key Challenge Areas (Friction Points) */}
          {isStudent && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Key Challenge Areas (Specific Friction Points)
                </label>
              </div>
              <textarea
                rows={3}
                placeholder="What specific roadblocks are you facing? (e.g., 'Failing System Design and Dynamic Programming rounds', 'Getting no interview callbacks', 'Struggling with resume bullet points')..."
                value={challengeAreas}
                onChange={(e) => setChallengeAreas(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {/* STUDENT ONLY: Academic & Technical Background (Technical Skill Matrix) */}
          {isStudent && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Layers size={15} style={{ color: 'var(--primary)' }} />
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Technical Skill Matrix (Proficiency & Metrics)
                </label>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Add your self-assessed proficiency levels or metrics (e.g., Python: Intermediate, LeetCode: 200+ solved):
              </p>

              {/* Add Skill Row */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Skill / Topic (e.g. Python, LeetCode, React)"
                  value={newMatrixSkill}
                  onChange={(e) => setNewMatrixSkill(e.target.value)}
                  style={{
                    flex: '1 1 180px',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                  }}
                />
                <input
                  type="text"
                  placeholder="Level / Metric (e.g. Intermediate, 200+ solved)"
                  value={newMatrixLevel}
                  onChange={(e) => setNewMatrixLevel(e.target.value)}
                  style={{
                    flex: '1 1 160px',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddMatrixEntry}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '38px' }}
                >
                  <Plus size={14} />
                  Add Skill
                </button>
              </div>

              {/* Matrix List */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skillMatrix.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)' }}>{item.skill}:</strong>
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{item.level}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMatrixEntry(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Remove skill"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MENTOR ONLY: Service Categories (Multi-select) */}
          {!isStudent && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Service Categories (Mentorship Offerings)
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Select all services you provide to students:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {MENTOR_SERVICE_OPTIONS.map((service) => {
                  const isSelected = serviceCategories.includes(service.id);
                  const IconComp = service.icon;
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleMentorService(service.id)}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <IconComp size={16} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }} />
                          <span style={{ fontSize: '13.5px', fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                            {service.title}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        {service.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MENTOR ONLY: Experience Level / Seniority */}
          {!isStudent && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Experience Level / Seniority
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              >
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* MENTOR ONLY: Technical & Core Expertise (Core Skills & Tech Stack) */}
          {!isStudent && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Technical Expertise & Core Tech Stack (Interactive Tags)
              </label>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Add skill or topic (e.g. DSA, System Design, React, Kubernetes, B2B Sales)..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(e);
                    }
                  }}
                  style={{
                    flex: 1,
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddSkill}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio / About */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {isStudent ? 'Bio & Learning Background' : 'Bio & Mentoring Philosophy'}
            </label>
            <textarea
              rows={3}
              placeholder={
                isStudent
                  ? 'Briefly introduce yourself and what you aspire to achieve...'
                  : 'Tell students about your industry journey, mentoring background, and how you conduct sessions...'
              }
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Social Links */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Portfolio & Social Links
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <input
                type="url"
                placeholder="LinkedIn profile URL"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                style={{
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
              <input
                type="url"
                placeholder="GitHub profile URL"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                style={{
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
              <input
                type="url"
                placeholder="Portfolio / Resume URL"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                style={{
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
            </div>
          </div>

          {/* MENTOR ONLY: Timezone for Scheduling */}
          {!isStudent && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Availability Timezone for Scheduling
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              >
                <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time - Los Angeles / SF)</option>
                <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time - New York / Boston)</option>
                <option value="UTC+0 (GMT / London)">UTC+0 (GMT / London)</option>
                <option value="UTC+5:30 (IST - India)">UTC+5:30 (IST - India Standard Time)</option>
                <option value="UTC+8 (SGT - Singapore)">UTC+8 (SGT - Singapore / Tokyo)</option>
              </select>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={14} />
            {isSaving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
