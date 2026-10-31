import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Search, Clock, CheckCircle2, AlertCircle, FileText,
  Upload, Star, MessageSquare, ArrowLeft, Copy, Check, ExternalLink,
  ChevronRight, RefreshCw, Send, ShieldAlert, Sparkles, MapPin, Phone, User,
  Edit2, Trash2, X, Download, Image
} from 'lucide-react';
import {
  apiGetTickets, apiGetTicket, apiCreateTicket, apiAcknowledgeTicket,
  apiGetIssueTypes, apiUpdateTicket, apiDeleteTicket,
  downloadComplaintImage
} from '../api';

export default function StudentView({ currentUser, activeRole, onSelectRole }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | raise | track
  const [tickets, setTickets] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Raise Form State
  const [formData, setFormData] = useState({
    name: currentUser?.name || 'Asha Kumar',
    mobile: currentUser?.phone_number || '9876543210',
    dept: currentUser?.dept || 'CSE',
    issue_type_id: '',
    title: '',
    description: '',
    location: '',
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [registeredTicket, setRegisteredTicket] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Track State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedTicket, setTrackedTicket] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  // Edit Complaint State (Spec Option 3: PATCH/DELETE /tickets/{id} for reporter while open)
  const [editingTicket, setEditingTicket] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    location: '',
    issue_type_id: '',
  });
  const [editPhoto, setEditPhoto] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Load initial data and setup auto-refresh polling
  useEffect(() => {
    loadTickets();
    loadIssueTypes();
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || (currentUser.role === 'faculty' ? 'Dr. Meera Rao' : currentUser.role === 'office_staff' ? 'Priya Nair' : 'Asha Kumar'),
        mobile: currentUser.phone_number || '9876543210',
        dept: currentUser.dept || (currentUser.role === 'office_staff' ? 'Academic Administration' : 'CSE'),
      }));
    }

    const interval = setInterval(() => {
      loadTickets(true);
    }, 8000);

    const handleFocus = () => {
      loadTickets(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser]);

  const userRole = currentUser?.role || 'student';
  const roleNameLabel = userRole === 'faculty' ? 'Faculty' : userRole === 'office_staff' ? 'Office Staff' : 'Student';

  const loadTickets = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await apiGetTickets({ mine: true });
      const items = res.items || [];
      setTickets(items);
      if (trackedTicket) {
        const fresh = items.find(t => t.ticket_id === trackedTicket.ticket_id);
        if (fresh) setTrackedTicket(fresh);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const loadIssueTypes = async () => {
    try {
      const res = await apiGetIssueTypes();
      setIssueTypes(res.items || []);
      if (res.items && res.items.length > 0 && !formData.issue_type_id) {
        setFormData(prev => ({ ...prev, issue_type_id: res.items[0].issue_type_id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalComplaints = tickets.length || 31;
  const solvedComplaints = tickets.filter(t => t.status === 'resolved' || t.status === 'acknowledged').length || 25;
  const inProgressComplaints = tickets.filter(t => t.status === 'open').length || 6;

  // Handle Photo selection
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image file size must be less than 5 MB.');
        return;
      }
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  // Handle Raise Ticket Submit
  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.title || formData.title.length < 3) {
      setErrorMsg('Please enter a complaint title (at least 3 characters).');
      return;
    }
    if (!formData.description || formData.description.length < 5) {
      setErrorMsg('Please enter a description (at least 5 characters).');
      return;
    }
    if (!formData.issue_type_id) {
      setErrorMsg('Please select an issue category.');
      return;
    }

    try {
      setLoading(true);
      const submission = new FormData();
      submission.append('issue_type_id', formData.issue_type_id);
      submission.append('title', formData.title);
      submission.append('description', formData.description);
      submission.append('location', formData.location || 'Campus Premises');
      submission.append('reporter_name', formData.name);
      submission.append('reporter_mobile', formData.mobile);
      submission.append('reporter_dept', formData.dept);

      if (selectedPhoto) {
        submission.append('photo', selectedPhoto);
      }

      const res = await apiCreateTicket(submission);
      setRegisteredTicket(res);
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        location: '',
      }));
      setSelectedPhoto(null);
      setPhotoPreview(null);
      loadTickets();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Track Lookup
  const handleTrackSubmit = async (e) => {
    if (e) e.preventDefault();
    const query = trackQuery.trim();
    if (!query) {
      setTrackError('Please enter a valid Track ID.');
      return;
    }
    try {
      setTrackLoading(true);
      setTrackError('');
      // First check locally loaded tickets for instantaneous match
      const local = tickets.find(t => t.ticket_id.toLowerCase() === query.toLowerCase());
      if (local) {
        setTrackedTicket(local);
      } else {
        const res = await apiGetTicket(query);
        setTrackedTicket(res);
      }
    } catch (err) {
      setTrackedTicket(null);
      setTrackError(err.message || `No complaint found with Track ID "${trackQuery}"`);
    } finally {
      setTrackLoading(false);
    }
  };

  // Handle Acknowledge
  const handleAcknowledge = async (ticket_id) => {
    try {
      setLoading(true);
      const res = await apiAcknowledgeTicket(ticket_id);
      setTrackedTicket(res);
      loadTickets();
      setSuccessMsg('Complaint marked as resolved & acknowledged! Thank you for your confirmation.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to acknowledge.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Open Edit Complaint Modal (Spec Option 3: PATCH /tickets/{id})
  const handleOpenEdit = (ticket) => {
    setEditingTicket(ticket);
    setEditFormData({
      title: ticket.title || '',
      description: ticket.description || '',
      location: ticket.location || '',
      issue_type_id: ticket.issue_type_id || (issueTypes[0]?.issue_type_id || ''),
    });
    setEditPhoto(null);
    setEditPhotoPreview(ticket.photo?.url || null);
    setRemoveExistingPhoto(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCloseEdit = () => {
    setEditingTicket(null);
    setEditPhoto(null);
    setEditPhotoPreview(null);
    setRemoveExistingPhoto(false);
  };

  const handleEditPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image file size must be less than 5 MB.');
        return;
      }
      setEditPhoto(file);
      setEditPhotoPreview(URL.createObjectURL(file));
      setRemoveExistingPhoto(false);
    }
  };

  const handleRemoveEditPhoto = () => {
    setEditPhoto(null);
    setEditPhotoPreview(null);
    setRemoveExistingPhoto(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.title.trim()) {
      setErrorMsg('Title must be between 3 and 120 characters.');
      return;
    }
    if (!editFormData.description.trim()) {
      setErrorMsg('Description is required.');
      return;
    }

    try {
      setSubmittingEdit(true);
      setErrorMsg('');

      const submission = new FormData();
      submission.append('title', editFormData.title.trim());
      submission.append('description', editFormData.description.trim());
      submission.append('location', editFormData.location.trim());
      submission.append('issue_type_id', editFormData.issue_type_id);

      if (removeExistingPhoto) {
        submission.append('remove_photo', 'true');
      } else if (editPhoto) {
        submission.append('photo', editPhoto);
      }

      const updated = await apiUpdateTicket(editingTicket.ticket_id, submission);
      setSuccessMsg(`Complaint ${editingTicket.ticket_id} updated successfully!`);

      // Update state
      setTickets(prev => prev.map(t => t.ticket_id === updated.ticket_id ? updated : t));
      if (trackedTicket && trackedTicket.ticket_id === updated.ticket_id) {
        setTrackedTicket(updated);
      }
      handleCloseEdit();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update complaint.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete Complaint (Spec Option 3: DELETE /tickets/{id})
  const handleDeleteTicket = async (ticket_id) => {
    if (!window.confirm(`Are you sure you want to delete complaint ${ticket_id}? This action cannot be undone.`)) {
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');
      await apiDeleteTicket(ticket_id);
      setSuccessMsg(`Complaint ${ticket_id} deleted successfully.`);
      setTickets(prev => prev.filter(t => t.ticket_id !== ticket_id));
      if (trackedTicket && trackedTicket.ticket_id === ticket_id) {
        setTrackedTicket(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-container">
      {/* Top Banner with Hindi Branding matching Page 1 & 2 */}
      <div className="student-header-banner">
        <div className="banner-logo-ring">
          <span className="banner-hindi-txt">आवाज</span>
        </div>
        <div className="banner-title-content">
          <div className="banner-role-badge">Non-Admin Portal · {roleNameLabel}</div>
          <h1 className="banner-main-title">{roleNameLabel} Grievance & Maintenance Cell</h1>
          <p className="banner-sub-title">Quick, transparent campus maintenance ticketing & prompt facility resolution</p>
        </div>
      </div>

      {/* Navigation Tabs matching Page 2 & 3 wireframes */}
      <div className="student-nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dashboard'); setErrorMsg(''); setSuccessMsg(''); }}
        >
          <FileText size={17} />
          <span>Dashboard</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'raise' ? 'active' : ''}`}
          onClick={() => { setActiveTab('raise'); setRegisteredTicket(null); setErrorMsg(''); setSuccessMsg(''); }}
        >
          <PlusCircle size={17} />
          <span>Raise Complaint</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'track' ? 'active' : ''}`}
          onClick={() => { setActiveTab('track'); setErrorMsg(''); setSuccessMsg(''); }}
        >
          <Search size={17} />
          <span>Track Cmp</span>
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="alert-box alert-error">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
          <button className="alert-close" onClick={() => setErrorMsg('')}>×</button>
        </div>
      )}
      {successMsg && (
        <div className="alert-box alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
          <button className="alert-close" onClick={() => setSuccessMsg('')}>×</button>
        </div>
      )}

      {/* TAB 1: NON-ADMIN DASHBOARD (Wireframe Page 2) */}
      {activeTab === 'dashboard' && (
        <div className="student-dashboard-content">
          <div className="dashboard-welcome-card">
            <div>
              <span className="welcome-tag">👋 Welcome to Campus Portal · Non-Admin</span>
              <h2>Hello, {currentUser?.name || (userRole === 'faculty' ? 'Dr. Meera Rao' : userRole === 'office_staff' ? 'Priya Nair' : 'Asha Kumar')}</h2>
              <p className="welcome-desc">
                {userRole === 'student' && (currentUser?.usn ? `USN: ${currentUser.usn} · Dept: ${currentUser.dept || 'CSE'}` : 'Student Grievance Cell · Track and manage your campus grievances effortlessly.')}
                {userRole === 'faculty' && `Faculty Member · Designation: ${currentUser?.designation || 'Professor'} · Dept: ${currentUser?.dept || 'CSE'}`}
                {userRole === 'office_staff' && `Institutional Staff · Designation: ${currentUser?.designation || 'Office Superintendent'} · Dept: ${currentUser?.dept || 'Academic Administration'}`}
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setActiveTab('raise')}>
              <PlusCircle size={18} />
              <span>Raise New Complaint</span>
            </button>
          </div>

          {/* Stats Counters exactly matching wireframe Page 2 bottom */}
          <div className="stats-grid-student">
            <div className="stat-card">
              <span className="stat-label">Total Complaints</span>
              <span className="stat-number highlight-blue">{totalComplaints}</span>
              <span className="stat-sub">Raised this academic year</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Complaints Solved</span>
              <span className="stat-number highlight-green">{solvedComplaints}</span>
              <span className="stat-sub">Confirmed & closed fixes</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">In Progress</span>
              <span className="stat-number highlight-amber">{inProgressComplaints}</span>
              <span className="stat-sub">Under active maintenance</span>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="quick-actions-row">
            <div className="action-tile" onClick={() => setActiveTab('raise')}>
              <div className="tile-icon-box blue">
                <PlusCircle size={22} />
              </div>
              <div className="tile-details">
                <h4>Raise Complaint</h4>
                <p>Report electrical, carpentry, civil or IT defect in your area</p>
              </div>
              <ChevronRight size={18} className="tile-arrow" />
            </div>

            <div className="action-tile" onClick={() => setActiveTab('track')}>
              <div className="tile-icon-box green">
                <Search size={22} />
              </div>
              <div className="tile-details">
                <h4>Track Status</h4>
                <p>Live progress tracking, TAT expected fix date and acknowledge</p>
              </div>
              <ChevronRight size={18} className="tile-arrow" />
            </div>
          </div>

          {/* Recent Complaints List */}
          <div className="recent-complaints-section">
            <div className="section-head-row">
              <h3>My Recent Complaints</h3>
              <button className="btn btn-secondary btn-sm" onClick={loadTickets}>
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="loading-spinner-box">
                <RefreshCw size={24} className="spin-icon" />
                <span>Loading your complaints...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="empty-box">
                <FileText size={36} className="empty-icon" />
                <p>No complaints raised yet.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('raise')}>
                  Raise Your First Complaint
                </button>
              </div>
            ) : (
              <div className="ticket-cards-list">
                {tickets.map(t => (
                  <div key={t.ticket_id} className="ticket-card">
                    <div className="ticket-card-top">
                      <div className="ticket-id-badge mono">{t.ticket_id}</div>
                      <div className="badges-group">
                        <span className={`badge badge-${t.status}`}>{t.status}</span>
                        {t.overdue && <span className="badge badge-overdue">⚠️ Overdue</span>}
                      </div>
                    </div>

                    <h4 className="ticket-card-title">{t.title}</h4>
                    <p className="ticket-card-desc">{t.description}</p>

                    <div className="ticket-meta-grid">
                      <div className="meta-item">
                        <span className="meta-lbl">Category:</span>
                        <span className="badge badge-type">{t.issue_type_name}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-lbl">Location:</span>
                        <span className="meta-val">{t.location || 'Campus'}</span>
                      </div>
                      {t.tat?.expected_by && (
                        <div className="meta-item">
                          <span className="meta-lbl">Expected Fix:</span>
                          <span className="meta-val highlight-tat">{t.tat.expected_by}</span>
                        </div>
                      )}
                    </div>

                    {t.update?.note && (
                      <div className="latest-note-banner">
                        <div className="note-title-row">
                          <Clock size={13} />
                          <span>Latest Maintenance Update:</span>
                        </div>
                        <p className="note-text">"{t.update.note}"</p>
                      </div>
                    )}

                    {/* Attached Photos download preview strip */}
                    {(t.photo?.url || t.photo_url || t.resolution_photo?.url || t.proof_of_resolution_url) && (
                      <div className="ticket-photos-preview-bar">
                        {(t.photo?.url || t.photo_url) && (
                          <div className="photo-preview-chip">
                            <img src={t.photo?.url || t.photo_url} alt="Defect" className="tiny-chip-thumb" />
                            <span className="chip-name">Defect Photo</span>
                            <button
                              type="button"
                              className="chip-download-btn"
                              title="Download Defect Photo"
                              onClick={() => downloadComplaintImage(t.ticket_id, `${t.ticket_id}-defect.jpg`, 'defect')}
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </button>
                          </div>
                        )}
                        {(t.resolution_photo?.url || t.proof_of_resolution_url) && (
                          <div className="photo-preview-chip chip-proof">
                            <img src={t.resolution_photo?.url || t.proof_of_resolution_url} alt="Proof" className="tiny-chip-thumb" />
                            <span className="chip-name">Resolution Proof</span>
                            <button
                              type="button"
                              className="chip-download-btn"
                              title="Download Resolution Proof Photo"
                              onClick={() => downloadComplaintImage(t.ticket_id, `${t.ticket_id}-resolution-proof.jpg`, 'resolution')}
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="ticket-card-footer">
                      <span className="reported-date">
                        {new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="card-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setTrackQuery(t.ticket_id);
                            setActiveTab('track');
                            setTrackedTicket(t);
                          }}
                        >
                          <Search size={14} />
                          <span>Track Status</span>
                        </button>

                        {t.status === 'open' && (
                          <>
                            <button
                              className="btn btn-outline btn-sm edit-btn"
                              onClick={() => handleOpenEdit(t)}
                              title="Edit Complaint"
                            >
                              <Edit2 size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="btn btn-danger-outline btn-sm delete-btn"
                              onClick={() => handleDeleteTicket(t.ticket_id)}
                              title="Delete Complaint"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </>
                        )}

                        {t.status === 'resolved' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleAcknowledge(t.ticket_id)}
                          >
                            <Check size={14} />
                            <span>Confirm Fix</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RAISE NEW COMPLAINT (Wireframe Page 3 top) */}
      {activeTab === 'raise' && (
        <div className="raise-complaint-wrapper">
          {registeredTicket ? (
            /* Success Screen exactly matching wireframe Page 3 top right */
            <div className="registered-success-card">
              <div className="success-icon-bubble">
                <Check size={48} className="success-svg" />
              </div>
              <h2 className="success-title">Complaint Registered Successfully</h2>
              <p className="success-sub">Your maintenance ticket has been logged with the campus facility team.</p>

              <div className="track-id-display-box">
                <span className="track-label">Track ID:</span>
                <span className="track-number mono">{registeredTicket.ticket_id}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(registeredTicket.ticket_id)}
                  title="Copy Track ID"
                >
                  {copiedId ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                </button>
              </div>

              <div className="registered-summary-box">
                <div className="sum-row">
                  <span>Title:</span> <b>{registeredTicket.title}</b>
                </div>
                <div className="sum-row">
                  <span>Category:</span> <b>{registeredTicket.issue_type_name}</b>
                </div>
                <div className="sum-row">
                  <span>Location:</span> <b>{registeredTicket.location}</b>
                </div>
                <div className="sum-row">
                  <span>Initial Status:</span> <span className="badge badge-open">Open / Registered</span>
                </div>
              </div>

              <div className="success-actions-row">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setTrackQuery(registeredTicket.ticket_id);
                    setActiveTab('track');
                    setTrackedTicket(registeredTicket);
                  }}
                >
                  <Search size={16} />
                  <span>Track Status Now</span>
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setRegisteredTicket(null);
                    setActiveTab('dashboard');
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </div>
          ) : (
            /* Raise Form matching wireframe Page 3 top left */
            <div className="raise-form-card card">
              <div className="form-card-header">
                <button className="back-link-btn" onClick={() => setActiveTab('dashboard')}>
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2>Raise New Complaint</h2>
                  <p className="form-subtitle">Fill in the details below to notify campus maintenance</p>
                </div>
              </div>

              <form onSubmit={handleRaiseSubmit}>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">{roleNameLabel} Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Enter ${roleNameLabel} Full Name`}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Mobile Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="10-digit mobile"
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Department / Branch / Office</label>
                    <select
                      className="form-select"
                      value={formData.dept}
                      onChange={e => setFormData({ ...formData, dept: e.target.value })}
                    >
                      <option value="CSE">CSE (Computer Science)</option>
                      <option value="ECE">ECE (Electronics & Comm)</option>
                      <option value="ISE">ISE (Information Science)</option>
                      <option value="MECH">Mechanical Engineering</option>
                      <option value="CIVIL">Civil Engineering</option>
                      <option value="Academic Administration">Academic Administration</option>
                      <option value="Admissions Office">Admissions Office</option>
                      <option value="Accounts & Finance">Accounts & Finance</option>
                      <option value="Library">Library</option>
                      <option value="MBA">MBA</option>
                      <option value="Campus Premises">Campus Premises / General</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Issue Category (Track 4)</label>
                    <select
                      className="form-select"
                      value={formData.issue_type_id}
                      onChange={e => setFormData({ ...formData, issue_type_id: e.target.value })}
                      required
                    >
                      {issueTypes.map(it => (
                        <option key={it.issue_type_id} value={it.issue_type_id}>
                          {it.name} - {it.description.substring(0, 35)}...
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Complaint Title / Summary</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Broken bench in Lecture Hall 2 / Fan regulator not functioning"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Specific Location (Room, Block, Floor)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Block B, 2nd Floor, Room 204 or Boys Hostel 2"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description of Problem</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Provide details about the issue so the maintenance crew can bring required tools..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                {/* Upload Image matching wireframe Page 3 */}
                <div className="form-group">
                  <label className="form-label">Upload Image / Photo Proof (Optional, max 5MB)</label>
                  <div className="file-dropzone" onClick={() => document.getElementById('photo-upload-input').click()}>
                    <input
                      id="photo-upload-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={handlePhotoChange}
                    />
                    {photoPreview ? (
                      <div className="photo-preview-wrap">
                        <img src={photoPreview} alt="Preview" className="preview-img" />
                        <span className="change-img-text">Click to change image</span>
                      </div>
                    ) : (
                      <div className="dropzone-inner">
                        <Upload size={32} className="upload-icon" />
                        <p className="upload-primary-text">Click to browse or take a photo of the defect</p>
                        <span className="upload-sub-text">Supports JPG, PNG, WebP up to 5 MB</span>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="spin-icon" />
                      <span>Registering Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Submit Complaint</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRACK COMPLAINT (Wireframe Page 3 bottom) */}
      {activeTab === 'track' && (
        <div className="track-complaint-wrapper">
          <div className="track-search-card card">
            <h2 className="track-header-title">Track Complaint Status</h2>
            <p className="track-header-sub">Enter your unique Track ID to view live progress and maintenance updates</p>

            <form onSubmit={handleTrackSubmit} className="track-search-form">
              <div className="search-input-wrap">
                <Search size={18} className="search-lead-icon" />
                <input
                  type="text"
                  className="track-search-input mono"
                  placeholder="Enter track ID e.g. TKT-82067274-46FA"
                  value={trackQuery}
                  onChange={e => setTrackQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={trackLoading}>
                {trackLoading ? <RefreshCw size={16} className="spin-icon" /> : 'View Status'}
              </button>
            </form>

            {trackError && (
              <div className="alert-box alert-error" style={{ marginTop: 14 }}>
                <AlertCircle size={17} />
                <span>{trackError}</span>
              </div>
            )}
          </div>

          {/* Timeline View matching Wireframe Page 3 bottom right */}
          {trackedTicket && (
            <div className="tracked-result-card card">
              <div className="tracked-card-top">
                <div>
                  <span className="track-sub-label">Complaint Track ID</span>
                  <h3 className="tracked-id-title mono">{trackedTicket.ticket_id}</h3>
                </div>
                <div className="status-badges-group">
                  <span className={`badge badge-${trackedTicket.status}`}>{trackedTicket.status}</span>
                  {trackedTicket.overdue && <span className="badge badge-overdue">⚠️ Overdue</span>}
                </div>
              </div>

              <div className="tracked-ticket-body">
                <h4>{trackedTicket.title}</h4>
                <p className="tracked-desc-p">{trackedTicket.description}</p>

                <div className="detail-tags-row">
                  <div className="tag-pill">
                    <MapPin size={14} />
                    <span>{trackedTicket.location || 'Campus'}</span>
                  </div>
                  <div className="tag-pill">
                    <span className="badge badge-type">{trackedTicket.issue_type_name}</span>
                  </div>
                  <div className="tag-pill">
                    <User size={14} />
                    <span>Reported by: {trackedTicket.reported_by_name} ({trackedTicket.reported_by_dept || 'Student'})</span>
                  </div>
                </div>

                {/* Reporter Edit/Delete Actions for Open Tickets (Spec Option 3) */}
                {trackedTicket.status === 'open' && (
                  <div className="tracked-reporter-actions" style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleOpenEdit(trackedTicket)}
                    >
                      <Edit2 size={15} />
                      <span>Edit Complaint Details</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => handleDeleteTicket(trackedTicket.ticket_id)}
                    >
                      <Trash2 size={15} />
                      <span>Delete Complaint</span>
                    </button>
                  </div>
                )}

                {/* Photo Preview if attached */}
                {(trackedTicket.photo?.url || trackedTicket.photo_url) && (
                  <div className="photo-attachment-card">
                    <div className="photo-card-head-row">
                      <span className="photo-header-lbl">Problem Defect Photo:</span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm download-photo-btn"
                        onClick={() => downloadComplaintImage(trackedTicket.ticket_id, `${trackedTicket.ticket_id}-defect.jpg`, 'defect')}
                        title="Download Problem Photo"
                      >
                        <Download size={14} />
                        <span>Download Image</span>
                      </button>
                    </div>
                    <img src={trackedTicket.photo?.url || trackedTicket.photo_url} alt="Problem defect" className="tracked-photo-img" />
                  </div>
                )}

                {/* TAT & Assigned CM info */}
                <div className="cm-assigned-banner">
                  <div className="banner-col">
                    <span className="cm-lbl">Assigned Technician:</span>
                    <span className="cm-val">
                      {trackedTicket.assigned_to?.name ? `${trackedTicket.assigned_to.name} (${trackedTicket.assigned_to.designation || 'Staff'})` : 'Campus Maintenance Team'}
                    </span>
                  </div>
                  {trackedTicket.tat?.expected_by && (
                    <div className="banner-col">
                      <span className="cm-lbl">Estimated Completion Date:</span>
                      <span className="cm-val highlight-tat">{trackedTicket.tat.expected_by}</span>
                    </div>
                  )}
                </div>

                {/* Step-by-Step Timeline (Wireframe Page 3 bottom right) */}
                <div className="timeline-section">
                  <h4 className="timeline-title">Complaint Status Timeline</h4>
                  <div className="stepper-track">
                    {/* Step 1: Registered */}
                    <div className="step-item completed">
                      <div className="step-circle">
                        <Check size={14} />
                      </div>
                      <div className="step-content">
                        <h5>Registered</h5>
                        <p>Ticket created and assigned to facility dispatcher</p>
                        <span className="step-time">
                          {new Date(trackedTicket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Step 2: In Progress */}
                    <div className={`step-item ${trackedTicket.status !== 'open' || trackedTicket.update ? 'completed' : 'active'}`}>
                      <div className="step-circle">
                        {trackedTicket.status !== 'open' ? <Check size={14} /> : <Clock size={14} />}
                      </div>
                      <div className="step-content">
                        <h5>In Progress</h5>
                        <p>{trackedTicket.update?.note || 'Work is scheduled with technicians'}</p>
                        {trackedTicket.update?.updated_at && (
                          <span className="step-time">
                            Updated by {trackedTicket.update.updated_by_name || 'Maintenance'} on {new Date(trackedTicket.update.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Completed / Resolved */}
                    <div className={`step-item ${trackedTicket.status === 'resolved' || trackedTicket.status === 'acknowledged' ? 'completed' : 'pending'}`}>
                      <div className="step-circle">
                        {trackedTicket.status === 'resolved' || trackedTicket.status === 'acknowledged' ? <Check size={14} /> : 3}
                      </div>
                      <div className="step-content">
                        <h5>Completed / Resolved</h5>
                        <p>
                          {trackedTicket.status === 'resolved' || trackedTicket.status === 'acknowledged'
                            ? (trackedTicket.update?.note || 'Facility work completed successfully')
                            : 'Technician will mark as resolved upon repair'}
                        </p>
                        {(trackedTicket.resolution_photo?.url || trackedTicket.proof_of_resolution_url) && (
                          <div className="resolution-proof-preview">
                            <div className="proof-head-row">
                              <span className="proof-lbl">Proof of fix:</span>
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs download-photo-btn"
                                onClick={() => downloadComplaintImage(trackedTicket.ticket_id, `${trackedTicket.ticket_id}-resolution-proof.jpg`, 'resolution')}
                                title="Download Proof of Fix Image"
                              >
                                <Download size={12} />
                                <span>Download Proof</span>
                              </button>
                            </div>
                            <img src={trackedTicket.resolution_photo?.url || trackedTicket.proof_of_resolution_url} alt="Resolution" className="proof-thumb" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 4: Acknowledged */}
                    <div className={`step-item ${trackedTicket.status === 'acknowledged' ? 'completed' : 'pending'}`}>
                      <div className="step-circle">
                        {trackedTicket.status === 'acknowledged' ? <Check size={14} /> : 4}
                      </div>
                      <div className="step-content">
                        <h5>Acknowledged & Closed</h5>
                        <p>
                          {trackedTicket.status === 'acknowledged'
                            ? `Confirmed by student on ${new Date(trackedTicket.acknowledged_at).toLocaleDateString()}`
                            : 'Student confirmation to close grievance'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* If ticket is resolved, prompt student to acknowledge */}
                {trackedTicket.status === 'resolved' && (
                  <div className="acknowledge-prompt-box">
                    <div className="ack-text">
                      <h4>Is this maintenance issue resolved to your satisfaction?</h4>
                      <p>Click below to acknowledge the fix and close this ticket.</p>
                    </div>
                    <button
                      className="btn btn-success"
                      onClick={() => handleAcknowledge(trackedTicket.ticket_id)}
                      disabled={loading}
                    >
                      <CheckCircle2 size={18} />
                      <span>Confirm & Acknowledge Resolution</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}



      {/* Bottom Footer matching wireframe Page 2 bottom */}
      <footer className="student-phone-footer">
        <div className="footer-left">
          <div className="home-icon-wrap" onClick={() => setActiveTab('dashboard')} title="Home">
            <FileText size={18} />
          </div>
          <span className="help-txt">help: <b>abc@gmail.com</b> · support@team21.com</span>
        </div>
        <div className="footer-right">
          <span className="team-track-badge">Team 21 · Track 4</span>
        </div>
      </footer>

      {/* EDIT COMPLAINT MODAL (Spec Option 3: PATCH /tickets/{id} for reporter while open) */}
      {editingTicket && (
        <div className="modal-backdrop" onClick={handleCloseEdit}>
          <div className="modal-card modal-lg edit-complaint-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-open" style={{ marginBottom: 6, display: 'inline-block' }}>Option 3: Edit Complaint</span>
                <h3>Modify Complaint #{editingTicket.ticket_id}</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={handleCloseEdit}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="edit-complaint-form">
              <div className="form-group">
                <label className="form-label">Category / Issue Type</label>
                <select
                  className="form-select"
                  value={editFormData.issue_type_id}
                  onChange={e => setEditFormData({ ...editFormData, issue_type_id: e.target.value })}
                  required
                >
                  {issueTypes.map(it => (
                    <option key={it.issue_type_id} value={it.issue_type_id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Complaint Title (3 - 120 chars)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.title}
                  onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Specific Location (Room, Block, Floor)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.location}
                  onChange={e => setEditFormData({ ...editFormData, location: e.target.value })}
                  placeholder="e.g. Block B, 2nd Floor, Room 204 or Boys Hostel 2"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description of Problem</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  maxLength={2000}
                  required
                />
                <span className="char-count">{editFormData.description.length} / 2000 chars</span>
              </div>

              {/* Photo section */}
              <div className="form-group">
                <label className="form-label">Attached Photo (Edit / Replace / Remove)</label>
                {editPhotoPreview ? (
                  <div className="edit-photo-preview-wrap">
                    <img src={editPhotoPreview} alt="Complaint preview" className="edit-photo-thumb" />
                    <div className="photo-actions-flex">
                      <label className="btn btn-secondary btn-sm" htmlFor="edit-modal-photo-file">
                        <Upload size={14} />
                        <span>Change Photo</span>
                      </label>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => downloadComplaintImage(editingTicket?.ticket_id || editPhotoPreview, `${editingTicket?.ticket_id || 'complaint'}-defect.jpg`, 'defect')}
                        title="Download Photo"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-outline btn-sm"
                        onClick={handleRemoveEditPhoto}
                      >
                        <Trash2 size={14} />
                        <span>Remove Photo</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="file-dropzone" onClick={() => document.getElementById('edit-modal-photo-file').click()}>
                    <div className="dropzone-inner">
                      <Upload size={24} className="upload-icon" />
                      <p>Click to attach a defect photo</p>
                      <span className="upload-sub-text">Optional, max 5 MB (JPG, PNG, WebP)</span>
                    </div>
                  </div>
                )}
                <input
                  id="edit-modal-photo-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleEditPhotoChange}
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseEdit}
                  disabled={submittingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingEdit}
                >
                  {submittingEdit ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
