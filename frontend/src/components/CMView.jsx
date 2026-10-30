import React, { useState, useEffect } from 'react';
import {
  Wrench, CheckCircle, Clock, AlertTriangle, RefreshCw, Upload,
  Calendar, Check, Search, Filter, ShieldCheck, ChevronRight, User, MapPin,
  Plus, Trash2, Edit2, Tag, Layers, Zap, Droplets, CheckCircle2, X, PlusCircle
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

  // Tab State: 'tasks' (Work Orders) | 'categories' (Spec Option 8: Issue Types CRUD)
  const [cmTab, setCmTab] = useState('tasks');
  const [issueTypes, setIssueTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

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
      const params = {};
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

  // Filtered tickets
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
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'acknowledged').length;

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

        {/* Tab Switcher: Work Orders vs Complaint Types (Option 8) */}
        <div className="cm-nav-tabs">
          <button
            type="button"
            className={`tab-btn ${cmTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setCmTab('tasks')}
          >
            <Wrench size={16} />
            <span>Work Orders ({tickets.length})</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${cmTab === 'categories' ? 'active' : ''}`}
            onClick={() => setCmTab('categories')}
          >
            <Layers size={16} />
            <span>Complaint Types & Categories ({issueTypes.length})</span>
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

  {/* TAB 2: MANAGE COMPLAINT TYPES (Spec Option 8: POST/PATCH/DELETE /issue-types by CM) */}
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
    </div>
  );
}
