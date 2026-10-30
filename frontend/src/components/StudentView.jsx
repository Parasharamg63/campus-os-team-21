import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Search, Clock, CheckCircle2, AlertCircle, FileText,
  Upload, Star, MessageSquare, ArrowLeft, Copy, Check, ExternalLink,
  ChevronRight, RefreshCw, Send, ShieldAlert, Sparkles, MapPin, Phone, User
} from 'lucide-react';
import {
  apiGetTickets, apiCreateTicket, apiTrackTicket, apiAcknowledgeTicket,
  apiGetIssueTypes, apiSubmitFeedback, apiGetFeedbacks
} from '../api';

export default function StudentView({ currentUser, onOpenNotifications, onSelectRole }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | raise | track | reviews
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

  // Reviews & Feedback State
  const [feedbacks, setFeedbacks] = useState([]);
  const [rating, setRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('Classroom Infrastructure');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Load initial data
  useEffect(() => {
    loadTickets();
    loadIssueTypes();
    loadFeedbacks();
  }, [currentUser]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await apiGetTickets({ mine: true });
      setTickets(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const loadFeedbacks = async () => {
    try {
      const res = await apiGetFeedbacks();
      setFeedbacks(res || []);
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
    if (!trackQuery.trim()) {
      setTrackError('Please enter a valid Track ID.');
      return;
    }
    try {
      setTrackLoading(true);
      setTrackError('');
      const res = await apiTrackTicket(trackQuery.trim());
      setTrackedTicket(res);
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

  // Handle Feedback Submit
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;
    try {
      setSubmittingFeedback(true);
      await apiSubmitFeedback({
        rating,
        category: feedbackCategory,
        comment: feedbackComment,
        author_name: currentUser?.name || formData.name,
        author_email: currentUser?.email_id || 'asha@team21.com',
      });
      setFeedbackComment('');
      setSuccessMsg('Thank you for your valuable feedback!');
      loadFeedbacks();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="student-container">
      {/* Top Banner with Hindi Branding matching Page 1 & 2 */}
      <div className="student-header-banner">
        <div className="banner-logo-ring">
          <span className="banner-hindi-txt">आवाज</span>
        </div>
        <div className="banner-title-content">
          <h1 className="banner-main-title">Student Grievance Cell</h1>
          <p className="banner-sub-title">Quick, transparent campus maintenance ticketing & resolution</p>
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

        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => { setActiveTab('reviews'); setErrorMsg(''); setSuccessMsg(''); }}
        >
          <Star size={17} />
          <span>Reviews & Feedback</span>
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

      {/* TAB 1: STUDENT DASHBOARD (Wireframe Page 2) */}
      {activeTab === 'dashboard' && (
        <div className="student-dashboard-content">
          <div className="dashboard-welcome-card">
            <div>
              <span className="welcome-tag">👋 Welcome to Campus Portal</span>
              <h2>Hello, {currentUser?.name || 'Asha Kumar'}</h2>
              <p className="welcome-desc">
                {currentUser?.usn ? `USN: ${currentUser.usn} · Dept: ${currentUser.dept || 'CSE'}` : 'Track and manage your campus grievances effortlessly.'}
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

          {/* Quick Action Cards matching wireframe Page 2 */}
          <div className="quick-actions-row">
            <div className="action-tile" onClick={() => setActiveTab('reviews')}>
              <div className="tile-icon-box gold">
                <Star size={22} />
              </div>
              <div className="tile-details">
                <h4>Reviews</h4>
                <p>Check satisfaction ratings and feedback from campus peers</p>
              </div>
              <ChevronRight size={18} className="tile-arrow" />
            </div>

            <div className="action-tile" onClick={() => setActiveTab('reviews')}>
              <div className="tile-icon-box purple">
                <MessageSquare size={22} />
              </div>
              <div className="tile-details">
                <h4>Feedback</h4>
                <p>Share your suggestions or rate recently resolved issues</p>
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
                            apiTrackTicket(t.ticket_id).then(res => setTrackedTicket(res));
                          }}
                        >
                          <Search size={14} />
                          <span>Track Status</span>
                        </button>

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
                    <label className="form-label">Student Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter Full Name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
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
                    <label className="form-label">Department / Branch</label>
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
                      <option value="MBA">MBA</option>
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

                {/* Photo Preview if attached */}
                {trackedTicket.photo?.url && (
                  <div className="photo-attachment-card">
                    <span className="photo-header-lbl">Problem Photo:</span>
                    <img src={trackedTicket.photo.url} alt="Problem defect" className="tracked-photo-img" />
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
                        {trackedTicket.resolution_photo?.url && (
                          <div className="resolution-proof-preview">
                            <span className="proof-lbl">Proof of fix:</span>
                            <img src={trackedTicket.resolution_photo.url} alt="Resolution" className="proof-thumb" />
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

      {/* TAB 4: REVIEWS & FEEDBACK */}
      {activeTab === 'reviews' && (
        <div className="reviews-feedback-wrapper">
          <div className="feedback-form-card card">
            <h2>Share Your Experience / Review</h2>
            <p className="feedback-sub">Help us maintain quality campus facilities through your feedback.</p>

            <form onSubmit={handleFeedbackSubmit}>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <div className="star-rating-row">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`star-btn ${s <= rating ? 'filled' : ''}`}
                      onClick={() => setRating(s)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-label-num">{rating} of 5 Stars</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Facility Category</label>
                <select
                  className="form-select"
                  value={feedbackCategory}
                  onChange={e => setFeedbackCategory(e.target.value)}
                >
                  <option value="Classroom Infrastructure">Classroom Infrastructure</option>
                  <option value="IT & Computer Labs">IT & Computer Labs</option>
                  <option value="Sanitation & Washrooms">Sanitation & Washrooms</option>
                  <option value="Hostel Facilities">Hostel Facilities</option>
                  <option value="Campus Maintenance Speed">Maintenance Response Speed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Review / Feedback Comments</label>
                <textarea
                  className="form-textarea"
                  placeholder="Share details about the resolution or suggestions for improvement..."
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submittingFeedback}>
                {submittingFeedback ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          </div>

          <div className="existing-reviews-section">
            <h3 className="existing-reviews-title">Recent Campus Reviews ({feedbacks.length})</h3>
            <div className="reviews-list">
              {feedbacks.map(f => (
                <div key={f._id} className="review-card">
                  <div className="review-top-row">
                    <span className="author-name">{f.author_name}</span>
                    <div className="stars-display">
                      {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                    </div>
                  </div>
                  <span className="review-cat-tag">{f.category}</span>
                  <p className="review-comment-p">"{f.comment}"</p>
                  <span className="review-date-str">
                    {new Date(f.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
    </div>
  );
}
