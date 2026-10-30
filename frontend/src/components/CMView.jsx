import React, { useState, useEffect } from 'react';
import {
  Wrench, CheckCircle, Clock, AlertTriangle, RefreshCw, Upload,
  Calendar, Check, Search, Filter, ShieldCheck, ChevronRight, User, MapPin,
  Plus, Trash2, Edit2, Tag, Layers, Zap, Droplets, CheckCircle2, X, PlusCircle,
  ClipboardList, Eye, FileText, ExternalLink, Copy
} from 'lucide-react';
import {
  apiGetTickets, apiUpdateTicketStatus, apiSetTAT, apiGetIssueTypes, apiDeleteTicket,
  apiCreateIssueType, apiUpdateIssueType, apiDeleteIssueType
} from '../api';

export default function CMView({ currentUser, onOpenNotifications }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tab State: 'tasks' (Work Orders) | 'all_complaints' (All Complaints Directory) | 'categories' (Issue Types CRUD)
  const [cmTab, setCmTab] = useState('tasks');
  const [issueTypes, setIssueTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // All Complaints Directory State
  const [allSearchQuery, setAllSearchQuery] = useState('');
  const [allStatusFilter, setAllStatusFilter] = useState('all');
  const [allCategoryFilter, setAllCategoryFilter] = useState('all');
  const [allSortBy, setAllSortBy] = useState('newest');
  const [inspectingTicket, setInspectingTicket] = useState(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [copiedId, setCopiedId] = useState('');

  // New Issue Type Form
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [submittingType, setSubmittingType] = useState(false);

  // Edit Issue Type Form
  const [editingType, setEditingType] = useState(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDesc, setEditTypeDesc] = useState('');

  // Status Update Form State (Wireframe Page 7 bottom right)
  const [statusVal, setStatusVal] = useState('resolved');
  const [statusNote, setStatusNote] = useState('');
  const [tatDate, setTatDate] = useState('');
  const [tatNote, setTatNote] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    loadTickets();
    loadIssueTypes();
  }, [filterStatus]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const res = await apiGetTickets(params);
      setTickets(res.items || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadIssueTypes = async () => {
    try {
      setLoadingTypes(true);
      const res = await apiGetIssueTypes();
      setIssueTypes(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setStatusVal(ticket.status === 'open' ? 'resolved' : 'open');
    setStatusNote('');
    setProofPhoto(null);
    setProofPreview(null);
    setTatDate(ticket.tat?.expected_by || '');
    setTatNote(ticket.tat?.note || '');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofPhoto(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  // Submit Status Update (Wireframe Page 7 bottom right)
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusNote.trim()) {
      setErrorMsg('Please enter an update note / work description (1-280 chars).');
      return;
    }

    try {
      setSubmittingAction(true);
      setErrorMsg('');

      const form = new FormData();
      form.append('status', statusVal);
      form.append('note', statusNote.trim());
      if (proofPhoto) {
        form.append('photo', proofPhoto);
      }

      const updated = await apiUpdateTicketStatus(selectedTicket.ticket_id, form);
      setSelectedTicket(updated);
      setSuccessMsg(`Ticket status updated to "${statusVal}" successfully!`);
      loadTickets();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update ticket status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Set TAT (Turnaround Time)
  const handleTatSubmit = async (e) => {
    e.preventDefault();
    if (!tatDate) {
      setErrorMsg('Please pick a Turnaround Date (expected_by).');
      return;
    }

    try {
      setSubmittingAction(true);
      setErrorMsg('');
      const updated = await apiSetTAT(selectedTicket.ticket_id, {
        expected_by: tatDate,
        note: tatNote || 'Maintenance repair scheduled',
      });
      setSelectedTicket(updated);
      setSuccessMsg('Turnaround Time (TAT) saved successfully!');
      loadTickets();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to set Turnaround Time.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Create Issue Type (Spec Option 8: POST /api/v1/fixit/issue-types by CM)
  const handleCreateIssueType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim() || newTypeName.trim().length < 3) {
      setErrorMsg('Complaint category name must be at least 3 characters.');
      return;
    }

    try {
      setSubmittingType(true);
      setErrorMsg('');
      const created = await apiCreateIssueType({
        name: newTypeName.trim(),
        description: newTypeDesc.trim(),
      });
      setSuccessMsg(`New complaint type "${created.name}" created successfully!`);
      setNewTypeName('');
      setNewTypeDesc('');
      setShowTypeModal(false);
      loadIssueTypes();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create complaint type.');
    } finally {
      setSubmittingType(false);
    }
  };

  const handleOpenEditType = (type) => {
    setEditingType(type);
    setEditTypeName(type.name);
    setEditTypeDesc(type.description || '');
    setErrorMsg('');
  };

  const handleUpdateIssueType = async (e) => {
    e.preventDefault();
    if (!editTypeName.trim() || editTypeName.trim().length < 3) {
      setErrorMsg('Category name must be at least 3 characters.');
      return;
    }

    try {
      setSubmittingType(true);
      setErrorMsg('');
      await apiUpdateIssueType(editingType.issue_type_id, {
        name: editTypeName.trim(),
        description: editTypeDesc.trim(),
      });
      setSuccessMsg(`Complaint type "${editTypeName.trim()}" updated successfully!`);
      setEditingType(null);
      loadIssueTypes();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update complaint type.');
    } finally {
      setSubmittingType(false);
    }
  };

  const handleDeleteIssueType = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"? Existing tickets with this category will retain their category name.`)) {
      return;
    }

    try {
      setErrorMsg('');
      await apiDeleteIssueType(id);
      setSuccessMsg(`Complaint category "${name}" deleted.`);
      loadIssueTypes();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete complaint type.');
    }
  };

  const handleApplyPreset = (name, desc) => {
    setNewTypeName(name);
    setNewTypeDesc(desc);
  };

  const handleCopyTrackId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleDeleteTicket = async (ticket_id) => {
    if (!window.confirm(`Are you sure you want to delete ticket ${ticket_id}? This action cannot be undone.`)) {
      return;
    }
    try {
      setLoading(true);
      await apiDeleteTicket(ticket_id);
      setSuccessMsg(`Ticket ${ticket_id} deleted successfully.`);
      if (selectedTicket?.ticket_id === ticket_id) setSelectedTicket(null);
      if (inspectingTicket?.ticket_id === ticket_id) setInspectingTicket(null);
      loadTickets();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete ticket.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered tickets for Work Orders tab
  const filteredTickets = tickets.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.ticket_id.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.location.toLowerCase().includes(q) ||
      t.reported_by_name.toLowerCase().includes(q)
    );
  });

  const openCount = tickets.filter(t => t.status === 'open').length;
  const overdueCount = tickets.filter(t => t.overdue).length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  const acknowledgedCount = tickets.filter(t => t.status === 'acknowledged').length;
  const totalSolvedCount = resolvedCount + acknowledgedCount;

  // Filtered complaints for All Complaints Directory
  const filteredAllComplaints = tickets.filter(t => {
    // Status filter
    if (allStatusFilter === 'overdue' && !t.overdue) return false;
    if (allStatusFilter !== 'all' && allStatusFilter !== 'overdue' && t.status !== allStatusFilter) return false;

    // Category filter
    if (allCategoryFilter !== 'all' && t.issue_type_id !== allCategoryFilter) return false;

    // Search query
    if (allSearchQuery) {
      const q = allSearchQuery.toLowerCase();
      const match =
        t.ticket_id?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.reported_by_name?.toLowerCase().includes(q) ||
        t.reported_by_dept?.toLowerCase().includes(q) ||
        t.issue_type_name?.toLowerCase().includes(q) ||
        t.assigned_to?.name?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  }).sort((a, b) => {
    if (allSortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (allSortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (allSortBy === 'tat') {
      if (!a.tat?.expected_by) return 1;
      if (!b.tat?.expected_by) return -1;
      return new Date(a.tat.expected_by) - new Date(b.tat.expected_by);
    }
    return 0;
  });

  return (
    <div className="cm-container">
      {/* CM Header */}
      <div className="cm-header-banner">
        <div className="cm-header-flex-top">
          <div>
            <div className="cm-badge-tag">
              <Wrench size={16} />
              <span>Campus Maintenance (FixIt) Portal</span>
            </div>
            <h2>CM Facility Workboard</h2>
            <p className="cm-subtitle">
              Signed in as: <b>{currentUser?.name || 'Kumar Gowda'}</b> ({currentUser?.designation || 'Supervisor'}, {currentUser?.dept || 'Campus Maintenance'})
            </p>
          </div>

          <div className="cm-header-actions-right">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setShowTypeModal(true);
                setNewTypeName('');
                setNewTypeDesc('');
              }}
            >
              <PlusCircle size={16} />
              <span>+ New Complaint Type</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Work Orders vs All Complaints vs Complaint Types */}
        <div className="cm-nav-tabs">
          <button
            type="button"
            className={`tab-btn ${cmTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setCmTab('tasks')}
          >
            <Wrench size={16} />
            <span>Active Work Orders ({openCount})</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${cmTab === 'all_complaints' ? 'active' : ''}`}
            onClick={() => setCmTab('all_complaints')}
          >
            <ClipboardList size={16} />
            <span>All Complaints ({tickets.length})</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${cmTab === 'categories' ? 'active' : ''}`}
            onClick={() => setCmTab('categories')}
          >
            <Layers size={16} />
            <span>Complaint Types ({issueTypes.length})</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="alert-box alert-error">
          <span>{errorMsg}</span>
          <button className="alert-close" onClick={() => setErrorMsg('')}>×</button>
        </div>
      )}
      {successMsg && (
        <div className="alert-box alert-success">
          <span>{successMsg}</span>
          <button className="alert-close" onClick={() => setSuccessMsg('')}>×</button>
        </div>
      )}

      {/* TAB 1: WORK ORDERS */}
      {cmTab === 'tasks' && (
        <>
          {/* Metrics Row */}
          <div className="cm-metrics-grid">
            <div className="cm-metric-card" onClick={() => setFilterStatus('open')}>
              <div className="metric-icon-wrap blue">
                <Clock size={22} />
              </div>
              <div>
                <span className="cm-stat-val">{openCount}</span>
                <span className="cm-stat-name">Pending Work Orders</span>
              </div>
            </div>

            <div className="cm-metric-card alert" onClick={() => setFilterStatus('open')}>
              <div className="metric-icon-wrap red">
                <AlertTriangle size={22} />
              </div>
              <div>
                <span className="cm-stat-val highlight-red">{overdueCount}</span>
                <span className="cm-stat-name">Overdue Tickets</span>
              </div>
            </div>

            <div className="cm-metric-card" onClick={() => setFilterStatus('resolved')}>
              <div className="metric-icon-wrap green">
                <CheckCircle size={22} />
              </div>
              <div>
                <span className="cm-stat-val">{resolvedCount}</span>
                <span className="cm-stat-name">Completed Fixes</span>
              </div>
            </div>
          </div>

      {/* Layout: Tasks List on left, Action Panel on right */}
      <div className="cm-workspace-layout">
        {/* Left: Tasks List (Wireframe Page 7 bottom left) */}
        <div className="cm-tasks-panel card">
          <div className="panel-top-controls">
            <div className="search-box-cm">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search ticket ID, title, room..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-chips-row">
              <button
                className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All
              </button>
              <button
                className={`filter-chip ${filterStatus === 'open' ? 'active' : ''}`}
                onClick={() => setFilterStatus('open')}
              >
                Open ({openCount})
              </button>
              <button
                className={`filter-chip ${filterStatus === 'resolved' ? 'active' : ''}`}
                onClick={() => setFilterStatus('resolved')}
              >
                Resolved
              </button>
            </div>
          </div>

          <div className="tasks-scroll-list">
            {loading ? (
              <div className="loading-state">
                <RefreshCw size={22} className="spin-icon" />
                <span>Loading maintenance tasks...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="empty-state">
                <p>No maintenance tasks matching current filter.</p>
              </div>
            ) : (
              filteredTickets.map((t, idx) => {
                const isSelected = selectedTicket?.ticket_id === t.ticket_id;
                return (
                  <div
                    key={t.ticket_id}
                    className={`cm-task-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectTicket(t)}
                  >
                    <div className="task-row-1">
                      <span className="task-serial-badge">Task #{idx + 1}</span>
                      <span className="mono task-id-txt">{t.ticket_id}</span>
                      <span className={`badge badge-${t.status}`}>{t.status}</span>
                      {t.overdue && <span className="badge badge-overdue">⚠️ Overdue</span>}
                    </div>

                    <h4 className="task-title-h4">{t.title}</h4>

                    <div className="task-row-meta">
                      <span className="task-loc">
                        <MapPin size={13} />
                        {t.location || 'Campus'}
                      </span>
                      <span className="badge badge-type">{t.issue_type_name}</span>
                    </div>

                    {t.update?.note && (
                      <p className="task-preview-note">Note: "{t.update.note}"</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Task Detail & Action Screen (Wireframe Page 7 bottom right) */}
        <div className="cm-action-panel card">
          {selectedTicket ? (
            <div className="task-detail-container">
              <div className="task-action-header">
                <div>
                  <span className="task-act-tag">Work Order Details</span>
                  <h3 className="mono act-id-title">{selectedTicket.ticket_id}</h3>
                </div>
                <span className={`badge badge-${selectedTicket.status}`}>{selectedTicket.status}</span>
              </div>

              <div className="task-summary-box">
                <h4>{selectedTicket.title}</h4>
                <p className="task-desc-txt">{selectedTicket.description}</p>

                <div className="reporter-chip-grid">
                  <div className="rep-cell">
                    <span className="rep-k">Reported By:</span>
                    <span className="rep-v">{selectedTicket.reported_by_name} ({selectedTicket.reported_by_dept || 'Student'})</span>
                  </div>
                  <div className="rep-cell">
                    <span className="rep-k">Phone:</span>
                    <span className="rep-v">{selectedTicket.reported_by_phone_number || 'N/A'}</span>
                  </div>
                  <div className="rep-cell">
                    <span className="rep-k">Location:</span>
                    <span className="rep-v">{selectedTicket.location}</span>
                  </div>
                  <div className="rep-cell">
                    <span className="rep-k">Category:</span>
                    <span className="rep-v">{selectedTicket.issue_type_name}</span>
                  </div>
                </div>

                {selectedTicket.photo?.url && (
                  <div className="original-photo-wrap">
                    <span className="photo-label">Student Attached Photo:</span>
                    <img src={selectedTicket.photo.url} alt="Attached" className="task-proof-img" />
                  </div>
                )}
              </div>

              {/* Turnaround Time (TAT) Form */}
              {selectedTicket.status === 'open' && (
                <div className="tat-form-card">
                  <div className="tat-header-row">
                    <Calendar size={17} />
                    <h4>Set Turnaround Time (Expected Fix Date)</h4>
                  </div>
                  <form onSubmit={handleTatSubmit} className="tat-form-flex">
                    <input
                      type="date"
                      className="form-input"
                      value={tatDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setTatDate(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Note e.g. Waiting for capacitor spare part"
                      value={tatNote}
                      onChange={e => setTatNote(e.target.value)}
                    />
                    <button type="submit" className="btn btn-secondary btn-sm" disabled={submittingAction}>
                      Update TAT
                    </button>
                  </form>
                </div>
              )}

              {/* Update Complaint Status Form (Wireframe Page 7 bottom right: "Upload complaint status") */}
              <div className="status-update-form-section">
                <h4 className="sec-title">Update Complaint Status & Progress</h4>
                <form onSubmit={handleStatusSubmit}>
                  <div className="form-group">
                    <label className="form-label">Select Action / Status</label>
                    <select
                      className="form-select"
                      value={statusVal}
                      onChange={e => setStatusVal(e.target.value)}
                    >
                      <option value="open">In Progress / Reopen (Ticket stays open)</option>
                      <option value="resolved">Mark Completed / Resolved</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Progress Note / Work Description (Required)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g. Electrician assigned. Replaced motor coil and calibrated switches..."
                      value={statusNote}
                      onChange={e => setStatusNote(e.target.value)}
                      maxLength={280}
                      required
                    />
                    <span className="char-count">{statusNote.length} / 280 chars</span>
                  </div>

                  {/* Upload Image Proof matching wireframe Page 7 */}
                  <div className="form-group">
                    <label className="form-label">Upload Proof Image (Optional)</label>
                    <div
                      className="file-dropzone"
                      onClick={() => document.getElementById('cm-proof-input').click()}
                    >
                      <input
                        id="cm-proof-input"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleProofChange}
                      />
                      {proofPreview ? (
                        <div className="photo-preview-wrap">
                          <img src={proofPreview} alt="Proof" className="preview-img" />
                          <span className="change-img-text">Click to change</span>
                        </div>
                      ) : (
                        <div className="dropzone-inner">
                          <Upload size={24} className="upload-icon" />
                          <p>Click to attach resolution photo proof</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg submit-act-btn"
                    disabled={submittingAction}
                  >
                    {submittingAction ? 'Updating...' : `Submit Status (${statusVal === 'resolved' ? 'Mark Fixed' : 'Post Progress'})`}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="select-placeholder-box">
              <Wrench size={42} className="placeholder-icon" />
              <h3>Select a Maintenance Task</h3>
              <p>Click on any ticket from the work order list on the left to inspect details, set turnaround times, and post repair updates.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )}

  {/* TAB 2: ALL COMPLAINTS DIRECTORY (Option 2: CM and admin see all campus complaints) */}
  {cmTab === 'all_complaints' && (
    <div className="cm-all-complaints-workspace">
      {/* Top Summary Banner */}
      <div className="cm-dir-summary-card card">
        <div className="cm-dir-summary-header">
          <div>
            <span className="badge badge-accent" style={{ marginBottom: 6, display: 'inline-block' }}>
              Option 2: Campus-Wide Complaints Directory
            </span>
            <h3>All Campus Grievances & Tickets</h3>
            <p className="card-sub-p">
              Central directory of all tickets filed by students across campus. Filter, search, audit TAT compliance, and manage repairs.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadTickets}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh Directory</span>
          </button>
        </div>

        {/* Quick Metrics Bar */}
        <div className="cm-dir-stats-strip">
          <div
            className={`cm-stat-pill ${allStatusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setAllStatusFilter('all')}
          >
            <span className="pill-label">Total Filed</span>
            <span className="pill-val">{tickets.length}</span>
          </div>
          <div
            className={`cm-stat-pill pill-open ${allStatusFilter === 'open' ? 'active' : ''}`}
            onClick={() => setAllStatusFilter('open')}
          >
            <span className="pill-label">Open / Pending</span>
            <span className="pill-val">{openCount}</span>
          </div>
          <div
            className={`cm-stat-pill pill-ack ${allStatusFilter === 'acknowledged' ? 'active' : ''}`}
            onClick={() => setAllStatusFilter('acknowledged')}
          >
            <span className="pill-label">In Progress</span>
            <span className="pill-val">{acknowledgedCount}</span>
          </div>
          <div
            className={`cm-stat-pill pill-resolved ${allStatusFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setAllStatusFilter('resolved')}
          >
            <span className="pill-label">Fixed & Resolved</span>
            <span className="pill-val">{resolvedCount}</span>
          </div>
          {overdueCount > 0 && (
            <div
              className={`cm-stat-pill pill-overdue ${allStatusFilter === 'overdue' ? 'active' : ''}`}
              onClick={() => setAllStatusFilter('overdue')}
            >
              <span className="pill-label">⚠️ Overdue TAT</span>
              <span className="pill-val">{overdueCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="cm-dir-toolbar card">
        <div className="cm-dir-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Track ID, student name, department, title, room/location..."
            value={allSearchQuery}
            onChange={(e) => setAllSearchQuery(e.target.value)}
            className="dir-search-input"
          />
          {allSearchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setAllSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="cm-dir-filters-row">
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={allStatusFilter}
              onChange={(e) => setAllStatusFilter(e.target.value)}
              className="dir-select"
            >
              <option value="all">All Statuses ({tickets.length})</option>
              <option value="open">Open ({openCount})</option>
              <option value="acknowledged">In Progress / Ack ({acknowledgedCount})</option>
              <option value="resolved">Resolved ({resolvedCount})</option>
              <option value="overdue">⚠️ Overdue ({overdueCount})</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category:</label>
            <select
              value={allCategoryFilter}
              onChange={(e) => setAllCategoryFilter(e.target.value)}
              className="dir-select"
            >
              <option value="all">All Categories</option>
              {issueTypes.map(it => (
                <option key={it.id || it._id} value={it.id || it._id}>
                  {it.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By:</label>
            <select
              value={allSortBy}
              onChange={(e) => setAllSortBy(e.target.value)}
              className="dir-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="tat">TAT Deadline</option>
            </select>
          </div>

          {(allSearchQuery || allStatusFilter !== 'all' || allCategoryFilter !== 'all') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setAllSearchQuery('');
                setAllStatusFilter('all');
                setAllCategoryFilter('all');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Directory Count Indicator */}
      <div className="cm-dir-results-info">
        <span>Showing <b>{filteredAllComplaints.length}</b> of <b>{tickets.length}</b> total campus tickets</span>
        {filteredAllComplaints.length === 0 && !loading && (
          <span className="no-match-alert">No tickets match your search or filter criteria.</span>
        )}
      </div>

      {/* Complaints Grid */}
      <div className="cm-dir-grid">
        {filteredAllComplaints.map((ticket) => (
          <div
            key={ticket.ticket_id}
            className={`cm-complaint-card card ${ticket.overdue ? 'card-overdue' : ''} ${ticket.status === 'resolved' ? 'card-resolved' : ''}`}
          >
            {/* Card Top Strip */}
            <div className="cm-card-top-strip">
              <div className="cm-id-row">
                <span className="ticket-id-tag">#{ticket.ticket_id}</span>
                <button
                  type="button"
                  className="copy-id-btn"
                  title="Copy Track ID"
                  onClick={() => handleCopyTrackId(ticket.ticket_id)}
                >
                  {copiedId === ticket.ticket_id ? (
                    <Check size={12} className="text-success" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedId === ticket.ticket_id ? 'Copied' : 'Copy'}</span>
                </button>
                {ticket.overdue && (
                  <span className="badge badge-overdue-tag">
                    <AlertTriangle size={12} /> Overdue
                  </span>
                )}
              </div>
              <div className="cm-badges-row">
                <span className="badge badge-type">
                  {ticket.issue_type_name || 'General'}
                </span>
                <span className={`status-badge status-${ticket.status}`}>
                  {ticket.status === 'open' && 'Open'}
                  {ticket.status === 'acknowledged' && 'In Progress'}
                  {ticket.status === 'resolved' && 'Resolved'}
                </span>
              </div>
            </div>

            {/* Title & Desc */}
            <h4 className="cm-card-title">{ticket.title}</h4>
            <p className="cm-card-desc">{ticket.description}</p>

            {/* Reporter & Location Meta */}
            <div className="cm-card-meta-list">
              <div className="cm-meta-item">
                <User size={14} className="meta-icon" />
                <span><b>{ticket.reported_by_name}</b> {ticket.reported_by_dept && `(${ticket.reported_by_dept})`}</span>
              </div>
              <div className="cm-meta-item">
                <MapPin size={14} className="meta-icon" />
                <span>{ticket.location}</span>
              </div>
              <div className="cm-meta-item">
                <Clock size={14} className="meta-icon" />
                <span>Filed: {new Date(ticket.created_at).toLocaleString()}</span>
              </div>
              {ticket.tat?.expected_by && (
                <div className="cm-meta-item tat-highlight">
                  <Calendar size={14} className="meta-icon" />
                  <span>
                    TAT: <b>{new Date(ticket.tat.expected_by).toLocaleDateString()}</b>
                    {ticket.tat.note ? ` — "${ticket.tat.note}"` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Photos Row (Defect / Resolution) */}
            {(ticket.photo_url || ticket.proof_of_resolution_url) && (
              <div className="cm-card-photos-strip">
                {ticket.photo_url && (
                  <div
                    className="photo-thumb-wrap"
                    onClick={() => setPreviewPhotoUrl(ticket.photo_url)}
                    title="Click to view full student defect photo"
                  >
                    <img src={ticket.photo_url} alt="Student Defect" className="photo-thumb" />
                    <span className="photo-label">Defect Photo</span>
                  </div>
                )}
                {ticket.proof_of_resolution_url && (
                  <div
                    className="photo-thumb-wrap proof-thumb-wrap"
                    onClick={() => setPreviewPhotoUrl(ticket.proof_of_resolution_url)}
                    title="Click to view resolution proof photo"
                  >
                    <img src={ticket.proof_of_resolution_url} alt="Resolution Proof" className="photo-thumb" />
                    <span className="photo-label proof-label">Proof of Work</span>
                  </div>
                )}
              </div>
            )}

            {/* Resolution Note if available */}
            {ticket.status_history?.length > 0 && ticket.status_history[ticket.status_history.length - 1]?.note && (
              <div className="cm-card-note-box">
                <span className="note-author">Latest Update:</span>
                <p>"{ticket.status_history[ticket.status_history.length - 1].note}"</p>
              </div>
            )}

            {/* Card Actions */}
            <div className="cm-card-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setInspectingTicket(ticket)}
              >
                <Eye size={14} />
                <span>Inspect</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  handleSelectTicket(ticket);
                  setCmTab('tasks');
                }}
              >
                <Wrench size={14} />
                <span>Work On Ticket</span>
              </button>

              <button
                type="button"
                className="btn btn-danger btn-sm icon-btn"
                title="Delete Ticket"
                onClick={() => handleDeleteTicket(ticket.ticket_id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* TAB 3: MANAGE COMPLAINT TYPES (Spec Option 8: POST/PATCH/DELETE /issue-types by CM) */}
  {cmTab === 'categories' && (
    <div className="cm-categories-workspace">
      {/* Header Card */}
      <div className="categories-header-card card">
        <div className="card-head-flex">
          <div>
            <span className="badge badge-type" style={{ marginBottom: 6, display: 'inline-block' }}>Option 8: CM Issue Types CRUD</span>
            <h3>Campus Maintenance Complaint Types</h3>
            <p className="card-sub-p">
              Create and manage complaint categories (e.g., Electrical, Plumbing, Carpentry). These categories automatically populate in the student complaint form and tracking dashboards.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setShowTypeModal(true);
              setNewTypeName('');
              setNewTypeDesc('');
            }}
          >
            <PlusCircle size={17} />
            <span>+ Create Complaint Type</span>
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="presets-banner">
          <span className="presets-label">⚡ Quick Presets (Click to add):</span>
          <div className="preset-chips-flex">
            <button
              type="button"
              className="preset-chip"
              onClick={() => {
                handleApplyPreset('Electrical', 'Issues with wiring, switchboards, MCB tripping, fans, light fixtures, or power sockets');
                setShowTypeModal(true);
              }}
            >
              <Zap size={13} color="#f59e0b" />
              <span>+ Electrical</span>
            </button>

            <button
              type="button"
              className="preset-chip"
              onClick={() => {
                handleApplyPreset('Plumbing', 'Water leakage, dripping taps, washbasin clog, broken flush, or restroom pipeline breakdown');
                setShowTypeModal(true);
              }}
            >
              <Droplets size={13} color="#06b6d4" />
              <span>+ Plumbing</span>
            </button>

            <button
              type="button"
              className="preset-chip"
              onClick={() => {
                handleApplyPreset('Carpentry & Furniture', 'Broken desks, classroom chairs, damaged door handles, window latch, or podium repair');
                setShowTypeModal(true);
              }}
            >
              <span>🪑 + Carpentry & Furniture</span>
            </button>

            <button
              type="button"
              className="preset-chip"
              onClick={() => {
                handleApplyPreset('HVAC / Air Conditioning', 'Classroom or lab AC not cooling, abnormal noise, water dripping, or thermostat faults');
                setShowTypeModal(true);
              }}
            >
              <span>❄️ + Air Conditioning</span>
            </button>

            <button
              type="button"
              className="preset-chip"
              onClick={() => {
                handleApplyPreset('Wi-Fi & Network', 'Hostel or campus Wi-Fi access point down, slow speed, or broken Ethernet wall ports');
                setShowTypeModal(true);
              }}
            >
              <span>📶 + Wi-Fi & Network</span>
            </button>

            <button
              type="button"
              className="preset-chip"
              onClick={() => {
                handleApplyPreset('Housekeeping & Sanitation', 'Restroom cleaning, waste bin disposal, classroom cleanliness, and floor sanitation');
                setShowTypeModal(true);
              }}
            >
              <span>🧹 + Housekeeping</span>
            </button>
          </div>
        </div>
      </div>

      {/* Issue Types Grid */}
      <div className="categories-grid">
        {loadingTypes ? (
          <div className="loading-state card">
            <RefreshCw size={24} className="spin-icon" />
            <span>Loading complaint categories...</span>
          </div>
        ) : issueTypes.length === 0 ? (
          <div className="empty-box card">
            <Tag size={36} color="#6366f1" />
            <h4>No complaint categories defined</h4>
            <p>Click "Create Complaint Type" or use a quick preset above to add your first category.</p>
          </div>
        ) : (
          issueTypes.map(it => {
            const count = tickets.filter(t => t.issue_type_id === it.issue_type_id).length;
            return (
              <div key={it.issue_type_id} className="category-item-card card">
                <div className="cat-card-top">
                  <div className="cat-icon-bubble">
                    {it.name.toLowerCase().includes('electric') ? (
                      <Zap size={20} color="#f59e0b" />
                    ) : it.name.toLowerCase().includes('plumb') ? (
                      <Droplets size={20} color="#06b6d4" />
                    ) : (
                      <Tag size={20} color="#6366f1" />
                    )}
                  </div>
                  <div className="cat-id-badge mono">{it.issue_type_id}</div>
                </div>

                <h4 className="cat-card-name">{it.name}</h4>
                <p className="cat-card-desc">{it.description || 'No description provided.'}</p>

                <div className="cat-card-meta">
                  <span className="cat-tickets-count">
                    <b>{count}</b> tickets reported
                  </span>
                  <div className="cat-actions-row">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleOpenEditType(it)}
                      title="Edit Category"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => handleDeleteIssueType(it.issue_type_id, it.name)}
                      title="Delete Category"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )}

  {/* CREATE COMPLAINT TYPE MODAL (Spec Option 8) */}
  {showTypeModal && (
    <div className="modal-backdrop" onClick={() => setShowTypeModal(false)}>
      <div className="modal-card modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge badge-open" style={{ marginBottom: 6, display: 'inline-block' }}>Option 8: CM Feature</span>
            <h3>Create New Complaint Type</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={() => setShowTypeModal(false)}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateIssueType}>
          <div className="preset-suggestions-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Quick Suggestions (Click to fill):</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button
                type="button"
                className="preset-chip"
                onClick={() => handleApplyPreset('Electrical', 'Wiring, switchboards, MCB tripping, fan and lighting defects')}
              >
                ⚡ Electrical
              </button>
              <button
                type="button"
                className="preset-chip"
                onClick={() => handleApplyPreset('Plumbing', 'Water leakage, pipe burst, tap failure, washbasin block')}
              >
                🚰 Plumbing
              </button>
              <button
                type="button"
                className="preset-chip"
                onClick={() => handleApplyPreset('Carpentry & Furniture', 'Desks, benches, door locks, blackboard and window repairs')}
              >
                🪑 Carpentry
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category Name (Required, e.g. Electrical, Plumbing)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Electrical or Plumbing"
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              maxLength={80}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Scope of Work</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe the issues covered under this complaint type..."
              value={newTypeDesc}
              onChange={e => setNewTypeDesc(e.target.value)}
              maxLength={280}
            />
            <span className="char-count">{newTypeDesc.length} / 280 chars</span>
          </div>

          <div className="modal-actions-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowTypeModal(false)}
              disabled={submittingType}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingType}
            >
              {submittingType ? (
                <>
                  <RefreshCw size={16} className="spin-icon" />
                  <span>Creating Category...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Create Complaint Type</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* EDIT COMPLAINT TYPE MODAL (Spec Option 8) */}
  {editingType && (
    <div className="modal-backdrop" onClick={() => setEditingType(null)}>
      <div className="modal-card modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge badge-type" style={{ marginBottom: 6, display: 'inline-block' }}>Edit Category</span>
            <h3>Modify Complaint Type</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={() => setEditingType(null)}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpdateIssueType}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-input"
              value={editTypeName}
              onChange={e => setEditTypeName(e.target.value)}
              maxLength={80}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={editTypeDesc}
              onChange={e => setEditTypeDesc(e.target.value)}
              maxLength={280}
            />
            <span className="char-count">{editTypeDesc.length} / 280 chars</span>
          </div>

          <div className="modal-actions-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingType(null)}
              disabled={submittingType}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingType}
            >
              {submittingType ? (
                <>
                  <RefreshCw size={16} className="spin-icon" />
                  <span>Updating...</span>
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

  {/* PHOTO PREVIEW LIGHTBOX MODAL */}
  {previewPhotoUrl && (
    <div className="modal-backdrop" onClick={() => setPreviewPhotoUrl(null)}>
      <div className="lightbox-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-header">
          <h4>Photo Evidence Preview</h4>
          <button
            type="button"
            className="btn-close-modal"
            onClick={() => setPreviewPhotoUrl(null)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="lightbox-body">
          <img src={previewPhotoUrl} alt="Evidence full preview" className="lightbox-full-img" />
        </div>
        <div className="lightbox-footer">
          <a
            href={previewPhotoUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={14} />
            <span>Open Original Image</span>
          </a>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setPreviewPhotoUrl(null)}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )}

  {/* INSPECT TICKET DETAIL MODAL */}
  {inspectingTicket && (
    <div className="modal-backdrop" onClick={() => setInspectingTicket(null)}>
      <div className="cm-inspect-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="inspect-modal-header">
          <div>
            <div className="inspect-id-row">
              <span className="ticket-id-tag">#{inspectingTicket.ticket_id}</span>
              <span className={`status-badge status-${inspectingTicket.status}`}>
                {inspectingTicket.status === 'open' && 'Open'}
                {inspectingTicket.status === 'acknowledged' && 'In Progress'}
                {inspectingTicket.status === 'resolved' && 'Resolved'}
              </span>
              {inspectingTicket.overdue && (
                <span className="badge badge-overdue-tag">
                  <AlertTriangle size={12} /> Overdue TAT
                </span>
              )}
            </div>
            <h3>{inspectingTicket.title}</h3>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            onClick={() => setInspectingTicket(null)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="inspect-modal-body">
          <div className="inspect-grid">
            {/* Left Column: Details */}
            <div className="inspect-details-col">
              <div className="inspect-section">
                <h5>Complaint Description</h5>
                <p className="inspect-desc-text">{inspectingTicket.description}</p>
              </div>

              <div className="inspect-section">
                <h5>Reporter Details</h5>
                <div className="inspect-info-list">
                  <div className="inspect-info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-val"><b>{inspectingTicket.reported_by_name}</b></span>
                  </div>
                  <div className="inspect-info-row">
                    <span className="info-label">Department:</span>
                    <span className="info-val">{inspectingTicket.reported_by_dept || 'Student'}</span>
                  </div>
                  {inspectingTicket.reported_by_phone_number && (
                    <div className="inspect-info-row">
                      <span className="info-label">Phone:</span>
                      <span className="info-val">{inspectingTicket.reported_by_phone_number}</span>
                    </div>
                  )}
                  <div className="inspect-info-row">
                    <span className="info-label">Location / Room:</span>
                    <span className="info-val"><b>{inspectingTicket.location}</b></span>
                  </div>
                  <div className="inspect-info-row">
                    <span className="info-label">Category:</span>
                    <span className="info-val">{inspectingTicket.issue_type_name || 'General'}</span>
                  </div>
                  <div className="inspect-info-row">
                    <span className="info-label">Filed On:</span>
                    <span className="info-val">{new Date(inspectingTicket.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* TAT Section */}
              <div className="inspect-section">
                <h5>Turnaround Time (TAT)</h5>
                {inspectingTicket.tat?.expected_by ? (
                  <div className="tat-info-card">
                    <div className="tat-row">
                      <Clock size={16} className="text-warning" />
                      <span>Deadline: <b>{new Date(inspectingTicket.tat.expected_by).toLocaleDateString()}</b></span>
                    </div>
                    {inspectingTicket.tat.note && (
                      <p className="tat-note-p">Note: "{inspectingTicket.tat.note}"</p>
                    )}
                    {inspectingTicket.tat.set_by && (
                      <span className="tat-set-by">Set by: {inspectingTicket.tat.set_by.name || 'Campus Maintenance'}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-muted">No TAT has been committed yet for this complaint.</p>
                )}
              </div>

              {/* Timeline History */}
              {inspectingTicket.status_history?.length > 0 && (
                <div className="inspect-section">
                  <h5>Status & Progress History</h5>
                  <div className="inspect-timeline">
                    {inspectingTicket.status_history.map((hist, i) => (
                      <div key={i} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-head">
                            <span className={`status-badge status-${hist.status}`}>{hist.status}</span>
                            <span className="timeline-date">{new Date(hist.changed_at).toLocaleString()}</span>
                          </div>
                          {hist.note && <p className="timeline-note">"{hist.note}"</p>}
                          {hist.changed_by && (
                            <span className="timeline-by">Updated by: {hist.changed_by.name || 'Staff'}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Photos */}
            <div className="inspect-photos-col">
              <h5>Attached Photos</h5>
              
              {inspectingTicket.photo_url ? (
                <div className="inspect-photo-card">
                  <span className="photo-card-label">📸 Student Defect Photo</span>
                  <img
                    src={inspectingTicket.photo_url}
                    alt="Defect Photo"
                    className="inspect-img"
                    onClick={() => setPreviewPhotoUrl(inspectingTicket.photo_url)}
                  />
                </div>
              ) : (
                <div className="no-photo-box">
                  <span>No student defect photo uploaded</span>
                </div>
              )}

              {inspectingTicket.proof_of_resolution_url ? (
                <div className="inspect-photo-card proof-card">
                  <span className="photo-card-label">✅ Resolution Proof Photo</span>
                  <img
                    src={inspectingTicket.proof_of_resolution_url}
                    alt="Resolution Proof"
                    className="inspect-img"
                    onClick={() => setPreviewPhotoUrl(inspectingTicket.proof_of_resolution_url)}
                  />
                </div>
              ) : (
                <div className="no-photo-box">
                  <span>No resolution proof photo uploaded yet</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="inspect-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setInspectingTicket(null)}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => handleDeleteTicket(inspectingTicket.ticket_id)}
          >
            <Trash2 size={16} />
            <span>Delete Ticket</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              handleSelectTicket(inspectingTicket);
              setInspectingTicket(null);
              setCmTab('tasks');
            }}
          >
            <Wrench size={16} />
            <span>Open in Work Orders</span>
          </button>
        </div>
      </div>
    </div>
  )}
    </div>
  );
}
