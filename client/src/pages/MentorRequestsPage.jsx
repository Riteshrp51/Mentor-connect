import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  MessageSquare,
  UserCheck,
  UserX,
  User,
} from 'lucide-react';
import api from '../api/axios';
import StudentProfileModal from '../components/StudentProfileModal';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Requests' },
  { key: 'pending', label: 'Pending Review' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Declined' },
];

const MentorRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);

  const fetchReceivedRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/requests/received');
      if (res.data && res.data.status === 'success') {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch mentor requests:', err);
      setError('Unable to load incoming requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivedRequests();
  }, []);

  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/api/requests/${requestId}/accept`);
      if (res.data && res.data.status === 'success') {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === requestId
              ? { ...r, status: 'accepted', respondedAt: new Date() }
              : r
          )
        );
        setToastMessage('Mentorship request accepted! A conversation has been initiated.');
        setTimeout(() => setToastMessage(''), 5000);
      }
    } catch (err) {
      console.error('Failed to accept request:', err);
      alert(err.response?.data?.message || 'Failed to accept mentorship request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to decline this mentorship request?')) {
      return;
    }

    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/api/requests/${requestId}/reject`);
      if (res.data && res.data.status === 'success') {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === requestId
              ? { ...r, status: 'rejected', respondedAt: new Date() }
              : r
          )
        );
        setToastMessage('Mentorship request declined.');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to reject request:', err);
      alert(err.response?.data?.message || 'Failed to decline request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesFilter = activeFilter === 'all' || req.status === activeFilter;
    const studentName = req.studentId?.name || '';
    const topic = req.topic || '';
    const matchesSearch =
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <Clock size={13} />
            Needs Review
          </span>
        );
      case 'accepted':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <CheckCircle2 size={13} />
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            <XCircle size={13} />
            Declined
          </span>
        );
      case 'cancelled':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: 'rgba(100, 116, 139, 0.12)',
              color: '#64748b',
              border: '1px solid rgba(100, 116, 139, 0.25)',
            }}
          >
            Cancelled by Student
          </span>
        );
      default:
        return null;
    }
  };

  const getCountByStatus = (statusKey) => {
    if (statusKey === 'all') return requests.length;
    return requests.filter((r) => r.status === statusKey).length;
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Incoming Mentorship Requests
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Review applications from students seeking your mentorship, accept proposals, and begin guiding them.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchReceivedRequests}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {toastMessage && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div
        className="dashboard-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((tab) => {
            const count = getCountByStatus(tab.key);
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--primary)' : 'var(--border-light)',
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '999px',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--border-light)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 200px', maxWidth: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search student or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '34px',
              paddingRight: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="dashboard-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <p>Loading incoming mentorship requests...</p>
        </div>
      ) : error ? (
        <div className="dashboard-card" style={{ padding: '32px', textAlign: 'center', color: '#ef4444' }}>
          <AlertTriangle size={28} style={{ margin: '0 auto 8px auto' }} />
          <p>{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={fetchReceivedRequests} style={{ marginTop: '12px' }}>
            Retry
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="dashboard-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.7 }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
            {requests.length === 0 ? 'No Incoming Requests Yet' : 'No requests matching your filters'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 0 auto' }}>
            {requests.length === 0
              ? 'When students discover your profile and request your mentorship, their proposals will appear here for your review.'
              : 'Try selecting a different status filter or clearing your search.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRequests.map((req) => {
            const student = req.studentId;
            const createdFormatted = new Date(req.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={req._id}
                className="dashboard-card"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={
                        student?.profileImage ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={student?.name || 'Student'}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>
                        {student?.name || 'Student Applicant'}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {student?.email || ''}
                      </p>
                    </div>
                  </div>

                  <div>{getStatusBadge(req.status)}</div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    Proposed Mentorship Focus
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: req.message ? '8px' : '0' }}>
                    {req.topic}
                  </div>

                  {req.message && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '6px' }}>
                      "{req.message}"
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedStudentForModal({ student: req.studentId, request: req })}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                    >
                      <User size={14} style={{ color: 'var(--primary)' }} />
                      View Student Profile
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} />
                      <span>Received on {createdFormatted}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {req.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRejectRequest(req._id)}
                          disabled={actionLoadingId === req._id}
                          style={{
                            color: '#ef4444',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <UserX size={14} />
                          Decline
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAcceptRequest(req._id)}
                          disabled={actionLoadingId === req._id}
                          style={{
                            backgroundColor: '#10b981',
                            borderColor: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <UserCheck size={14} />
                          {actionLoadingId === req._id ? 'Accepting...' : 'Accept Mentorship'}
                        </button>
                      </>
                    )}

                    {req.status === 'accepted' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/mentor/messages?requestId=${req._id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <MessageSquare size={13} />
                        Open Conversation
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Profile Modal */}
      <StudentProfileModal
        isOpen={Boolean(selectedStudentForModal)}
        student={selectedStudentForModal?.student}
        request={selectedStudentForModal?.request}
        onClose={() => setSelectedStudentForModal(null)}
        onAccept={handleAcceptRequest}
        onDecline={handleRejectRequest}
      />
    </div>
  );
};

export default MentorRequestsPage;
