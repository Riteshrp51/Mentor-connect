import {
  X,
  GraduationCap,
  Building,
  Target,
  AlertTriangle,
  Layers,
  Globe,
  Mail,
  CheckCircle2,
  UserCheck,
  UserX,
  ExternalLink,
} from 'lucide-react';

const LinkedinIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GithubIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const StudentProfileModal = ({
  isOpen,
  onClose,
  student,
  request,
  onAccept,
  onDecline,
}) => {
  if (!isOpen || !student) return null;

  const studentName = student.name || 'Student Applicant';
  const studentAvatar =
    student.profileImage ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  const studentHeadline = student.headline || 'Student / Aspiring Engineer';
  const studentInstitution = student.company || 'University / Institution not specified';
  const studentBio = student.bio || 'Passionate student eager to learn, grow, and connect with experienced industry mentors.';
  const mentorshipGoals = student.mentorshipGoals || ['Mock Interviews', 'Résumé & Portfolio Review'];
  const challengeAreas = student.challengeAreas || '';
  const skillMatrix = student.skillMatrix || [];

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
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border-light)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0,0,0,0.35)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
            padding: '28px 28px 20px 28px',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
            <img
              src={studentAvatar}
              alt={studentName}
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(255,255,255,0.85)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              }}
            />

            <div style={{ flex: '1 1 260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>
                  {studentName}
                </h2>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}
                >
                  Student Applicant
                </span>
              </div>

              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.92)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GraduationCap size={15} />
                <span>{studentHeadline}</span>
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.85)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Building size={14} />
                  {studentInstitution}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} />
                  {student.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          {/* Proposed Request Topic (if opened from request) */}
          {request?.topic && (
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '10px',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Mentorship Request Focus
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {request.topic}
              </div>
              {request.message && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4, margin: '6px 0 0 0' }}>
                  "{request.message}"
                </p>
              )}
            </div>
          )}

          {/* Mentorship Goals */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Target size={16} style={{ color: 'var(--primary)' }} />
              <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', margin: 0 }}>
                Mentorship Goals (What Student is Looking For)
              </h4>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {mentorshipGoals.map((goal, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CheckCircle2 size={13} />
                  {goal}
                </span>
              ))}
            </div>
          </div>

          {/* Key Challenge Areas */}
          {challengeAreas && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
                <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', margin: 0 }}>
                  Key Challenge Areas (Friction Points)
                </h4>
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                {challengeAreas}
              </div>
            </div>
          )}

          {/* Technical Skill Matrix */}
          {skillMatrix.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Layers size={16} style={{ color: 'var(--primary)' }} />
                <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', margin: 0 }}>
                  Technical Skill Matrix
                </h4>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skillMatrix.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)' }}>{item.skill}:</strong>
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{item.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '8px' }}>
              About Student
            </h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {studentBio}
            </p>
          </div>

          {/* Social / Portfolio Links */}
          {(student.linkedin || student.github || student.portfolio) && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Profiles & Portfolio
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {student.linkedin && (
                  <a
                    href={student.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                  >
                    <LinkedinIcon size={14} />
                    LinkedIn
                  </a>
                )}
                {student.github && (
                  <a
                    href={student.github}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                  >
                    <GithubIcon size={14} />
                    GitHub
                  </a>
                )}
                {student.portfolio && (
                  <a
                    href={student.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                  >
                    <Globe size={14} style={{ color: 'var(--primary)' }} />
                    Portfolio / Resume
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>

          {request?.status === 'pending' && onAccept && onDecline && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onDecline(request._id);
                }}
                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <UserX size={14} />
                Decline
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onAccept(request._id);
                }}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <UserCheck size={14} />
                Accept Mentorship
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
