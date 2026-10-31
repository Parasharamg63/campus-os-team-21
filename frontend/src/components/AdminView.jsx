import React, { useState, useEffect } from 'react';
import {
  Shield, BarChart3, Users, Wrench, AlertTriangle, CheckCircle2,
  Clock, Trash2, FolderPlus, Search, RefreshCw, Send,
  ArrowRight, Check, Eye, MapPin, Phone, Mail, Download, Image,
  ClipboardList, Calendar, LayoutGrid, List, Copy, ExternalLink, X
} from 'lucide-react';
import {
  apiGetTickets, apiGetIssueTypes, apiDeleteTicket, apiUpdateTicketStatus, downloadComplaintImage
} from '../api';

export default function AdminView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | all_cmp | new_cmp | existing_cmp | issue_types
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected ticket for modal / view
  const [selectedTicket, setSelectedTicket] = useState(null);

  // All Complaints Directory State
  const [allSearchQuery, setAllSearchQuery] = useState('');
  const [allStatusFilter, setAllStatusFilter] = useState('all');
  const [allCategoryFilter, setAllCategoryFilter] = useState('all');
  const [allDeptFilter, setAllDeptFilter] = useState('all');
  const [allSortBy, setAllSortBy] = useState('newest');
  const [allViewMode, setAllViewMode] = useState('grid'); // 'grid' | 'table'
  const [copiedId, setCopiedId] = useState('');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);

  // Admin status update
  const [adminStatus, setAdminStatus] = useState('resolved');
  const [adminNote, setAdminNote] = useState('');

  // Auto-refresh & Real-time sync states
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Initial load & Periodic Auto-Refresh Polling (every 5 seconds)
  useEffect(() => {
    loadAll();
    if (!autoRefreshEnabled) return;

    const intervalId = setInterval(() => {
      loadAll(true); // Silent background auto-refresh
    }, 5000);

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled]);

  // 2. Auto-fetch on browser tab / window focus & visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAll(true);
      }
    };

    const handleFocus = () => {
      loadAll(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 3. Auto-fetch when admin switches tabs within AdminView
  useEffect(() => {
    loadAll(true);
  }, [activeTab]);

  const loadAll = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setIsRefreshing(true);
      const [ticketsRes, issueTypesRes] = await Promise.all([
        apiGetTickets({ limit: 100 }),
        apiGetIssueTypes().catch(() => null),
      ]);

      if (ticketsRes) {
        const freshTickets = ticketsRes.items || [];
        setTickets(freshTickets);

        // Derive metrics directly from GET /tickets (Row 2 of spec: CM and admin see all)
        const total = freshTickets.length;
        const open = freshTickets.filter(t => t.status === 'open').length;
        const resolved = freshTickets.filter(t => t.status === 'resolved' || t.status === 'acknowledged').length;
        const overdue = freshTickets.filter(t => t.overdue).length;
        setStats({
          totalComplaints: total,
          openComplaints: open,
          resolvedComplaints: resolved,
          overdueComplaints: overdue,
        });

        // Keep inspecting modal up-to-date if admin is viewing a ticket
        setSelectedTicket(prev => {
          if (!prev) return null;
          const fresh = freshTickets.find(t => t.ticket_id === prev.ticket_id);
          return fresh || prev;
        });
      }
      if (issueTypesRes) setIssueTypes(issueTypesRes.items || []);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Error during live sync:', err);
    } finally {
      if (!isSilent) setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async (ticket_id) => {
    if (!window.confirm(`Delete ticket ${ticket_id}?`)) return;
    try {
      await apiDeleteTicket(ticket_id);
      setSelectedTicket(null);
      setSuccessMsg(`Ticket ${ticket_id} deleted.`);
      loadAll();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Admin Update Status
  const handleAdminStatusSubmit = async (e) => {
    e.preventDefault();
    if (!adminNote.trim()) return;
    try {
      setLoading(true);
      await apiUpdateTicketStatus(selectedTicket.ticket_id, {
        status: adminStatus,
        note: adminNote,
      });
      setSuccessMsg('Status updated successfully');
      loadAll();
      setSelectedTicket(null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter lists matching wireframes
  const newComplaints = tickets.filter(t => t.status === 'open');
  const existingComplaints = tickets.filter(t => t.status === 'resolved' || t.status === 'acknowledged');

  // Copy track ID helper
  const handleCopyTrackId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Filtered complaints for All Complaints Directory
  const filteredAllComplaints = tickets.filter(t => {
    // Status filter
    if (allStatusFilter === 'overdue' && !t.overdue) return false;
    if (allStatusFilter !== 'all' && allStatusFilter !== 'overdue' && t.status !== allStatusFilter) return false;

    // Category filter
    if (allCategoryFilter !== 'all' && t.issue_type_id !== allCategoryFilter) return false;

    // Department filter
    if (allDeptFilter !== 'all') {
      const d = (t.reported_by_dept || '').toLowerCase();
      if (!d.includes(allDeptFilter.toLowerCase())) return false;
    }

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
        t.assigned_to?.name?.toLowerCase().includes(q) ||
        t.assigned_to?.email_id?.toLowerCase().includes(q);
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

  // Export CSV Report
  const handleExportCSV = () => {
    if (filteredAllComplaints.length === 0) {
      alert('No complaints to export.');
      return;
    }
    const headers = [
      'Ticket ID', 'Status', 'Category', 'Title', 'Location',
      'Reporter Name', 'Department', 'Phone', 'Filed Date',
      'TAT Deadline', 'Assigned CM', 'Overdue', 'Description'
    ];
    const rows = filteredAllComplaints.map(t => [
      t.ticket_id,
      t.status,
      t.issue_type_name || 'General',
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.location || '').replace(/"/g, '""')}"`,
      `"${(t.reported_by_name || '').replace(/"/g, '""')}"`,
      `"${(t.reported_by_dept || '').replace(/"/g, '""')}"`,
      t.reported_by_phone_number || '',
      new Date(t.created_at).toLocaleDateString(),
      t.tat?.expected_by || 'Not Set',
      t.assigned_to?.name || 'Unassigned',
      t.overdue ? 'Yes' : 'No',
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campus-complaints-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-container">
      {/* Top Banner with Real-Time Live Sync Status */}
      <div className="admin-header-banner">
        <div className="admin-banner-main">
          <div className="admin-badge-tag">
            <Shield size={16} />
            <span>Campus Administration Console</span>
          </div>
          <h2>Admin Oversight & Grievance Control</h2>
          <p className="admin-subtitle">
            Institution: <b>Team 21 Engineering College</b> · Domain: <b>@team21.com</b> · Team OTP: <b>681305</b>
          </p>
        </div>

        {/* Live Auto-Refresh & Background Sync Bar */}
        <div className="admin-live-sync-bar">
          <div className="live-status-pill">
            <span className={`live-pulse-dot ${autoRefreshEnabled ? 'pulse-green' : 'pulse-amber'}`}></span>
            <div className="live-text-group">
              <span className="live-primary-label">
                {autoRefreshEnabled ? 'Live Auto-Sync (5s)' : 'Auto-Sync Paused'}
              </span>
              <span className="live-time-label">
                Updated {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString() : 'just now'}
              </span>
            </div>
          </div>

          <div className="live-controls-group">
            <button
              type="button"
              className={`btn-sync-toggle ${autoRefreshEnabled ? 'active-on' : 'active-off'}`}
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              title={autoRefreshEnabled ? 'Pause automatic 5-second polling' : 'Resume automatic live polling'}
            >
              {autoRefreshEnabled ? 'Pause' : 'Resume'}
            </button>

            <button
              type="button"
              className="btn-sync-action"
              onClick={() => loadAll(false)}
              disabled={isRefreshing}
              title="Force fetch all complaints & metrics from server now"
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Nav Tabs matching Wireframe Page 5 & 6 & 7 */}
      <div className="admin-nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dashboard'); setErrorMsg(''); setSuccessMsg(''); }}
        >
          <BarChart3 size={16} />
          <span>Dashboard</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'all_cmp' ? 'active' : ''}`}
          onClick={() => { setActiveTab('all_cmp'); setErrorMsg(''); setSuccessMsg(''); }}
        >
          <ClipboardList size={16} />
          <span>All Complaints ({tickets.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'new_cmp' ? 'active' : ''}`}
          onClick={() => { setActiveTab('new_cmp'); setErrorMsg(''); setSuccessMsg(''); }}
        >
          <Clock size={16} />
          <span>New Complaints ({newComplaints.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'existing_cmp' ? 'active' : ''}`}
          onClick={() => { setActiveTab('existing_cmp'); setErrorMsg(''); setSuccessMsg(''); }}
        >
          <CheckCircle2 size={16} />
          <span>Existing / Resolved ({existingComplaints.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'issue_types' ? 'active' : ''}`}
          onClick={() => { setActiveTab('issue_types'); setErrorMsg(''); setSuccessMsg(''); }}
        >
          <FolderPlus size={16} />
          <span>Issue Types ({issueTypes.length})</span>
        </button>
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

      {/* TAB 1: ADMIN DASHBOARD (Wireframe Page 5 top) */}
      {activeTab === 'dashboard' && (
        <div className="admin-dashboard-content">
          <div className="admin-stats-grid">
            <div className="stat-card" onClick={() => { setActiveTab('all_cmp'); setAllStatusFilter('all'); }}>
              <span className="stat-label">Total Complaints</span>
              <span className="stat-number highlight-blue">{stats?.totalComplaints || tickets.length || 0}</span>
              <span className="stat-sub">Across all campus blocks (Click to audit)</span>
            </div>

            <div className="stat-card" onClick={() => { setActiveTab('all_cmp'); setAllStatusFilter('resolved'); }}>
              <span className="stat-label">Solved Complaints</span>
              <span className="stat-number highlight-green">{stats?.solvedComplaints || tickets.filter(t => t.status === 'resolved' || t.status === 'acknowledged').length}</span>
              <span className="stat-sub">Resolved and verified</span>
            </div>

            <div className="stat-card" onClick={() => { setActiveTab('all_cmp'); setAllStatusFilter('open'); }}>
              <span className="stat-label">In Progress</span>
              <span className="stat-number highlight-amber">{stats?.inProgressComplaints || newComplaints.length}</span>
              <span className="stat-sub">Active work orders</span>
            </div>

            <div className="stat-card" onClick={() => { setActiveTab('all_cmp'); setAllStatusFilter('overdue'); }}>
              <span className="stat-label">Overdue Alerts</span>
              <span className="stat-number highlight-red">{stats?.overdueComplaints || tickets.filter(t => t.overdue).length}</span>
              <span className="stat-sub">Exceeded turnaround time</span>
            </div>
          </div>

          {/* Category Distribution Chart / Grid */}
          <div className="category-breakdown-card card">
            <h3>Complaints by Issue Category (FixIt Track 4)</h3>
            <div className="cat-bars-list">
              {issueTypes.map(it => {
                const count = tickets.filter(t => t.issue_type_id === it.issue_type_id).length;
                const percent = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
                return (
                  <div key={it.issue_type_id} className="cat-bar-item">
                    <div className="cat-bar-head">
                      <span className="cat-name">{it.name}</span>
                      <span className="cat-count">{count} tickets ({percent}%)</span>
                    </div>
                    <div className="cat-progress-track">
                      <div className="cat-progress-fill" style={{ width: `${Math.max(percent, 5)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL COMPLAINTS DIRECTORY (Campus-wide Oversight & Audit) */}
      {activeTab === 'all_cmp' && (
        <div className="admin-all-complaints-content">
          {/* Header & Audit Controls Card */}
          <div className="admin-dir-head-card card">
            <div className="admin-dir-header-flex">
              <div>
                <span className="badge badge-accent" style={{ marginBottom: 6, display: 'inline-block' }}>
                  Institutional Oversight & Audit
                </span>
                <h3>Campus-Wide Complaints Directory</h3>
                <p className="card-sub-p">
                  Supervisory directory of all complaints across campus blocks, academic departments, and facility stages.
                </p>
              </div>

              <div className="admin-dir-actions-group">
                {/* View Mode Toggle: Grid vs Table */}
                <div className="view-mode-toggle">
                  <button
                    type="button"
                    className={`mode-btn ${allViewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setAllViewMode('grid')}
                    title="Grid Cards View"
                  >
                    <LayoutGrid size={15} />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${allViewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setAllViewMode('table')}
                    title="Audit Table View"
                  >
                    <List size={15} />
                    <span>Table</span>
                  </button>
                </div>

                {/* Export CSV Report */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportCSV}
                  title="Download CSV report of all complaints for institutional audit"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>

                {/* Refresh */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={loadAll}
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
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
                <span className="pill-val">{newComplaints.length}</span>
              </div>
              <div
                className={`cm-stat-pill pill-ack ${allStatusFilter === 'acknowledged' ? 'active' : ''}`}
                onClick={() => setAllStatusFilter('acknowledged')}
              >
                <span className="pill-label">In Progress</span>
                <span className="pill-val">{tickets.filter(t => t.status === 'acknowledged').length}</span>
              </div>
              <div
                className={`cm-stat-pill pill-resolved ${allStatusFilter === 'resolved' ? 'active' : ''}`}
                onClick={() => setAllStatusFilter('resolved')}
              >
                <span className="pill-label">Fixed & Resolved</span>
                <span className="pill-val">{tickets.filter(t => t.status === 'resolved').length}</span>
              </div>
              {tickets.filter(t => t.overdue).length > 0 && (
                <div
                  className={`cm-stat-pill pill-overdue ${allStatusFilter === 'overdue' ? 'active' : ''}`}
                  onClick={() => setAllStatusFilter('overdue')}
                >
                  <span className="pill-label">⚠️ Overdue TAT</span>
                  <span className="pill-val">{tickets.filter(t => t.overdue).length}</span>
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
                placeholder="Search by Track ID, student name, department, title, room/location, technician..."
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
                  <option value="open">Open ({newComplaints.length})</option>
                  <option value="acknowledged">In Progress ({tickets.filter(t => t.status === 'acknowledged').length})</option>
                  <option value="resolved">Resolved ({tickets.filter(t => t.status === 'resolved').length})</option>
                  <option value="overdue">⚠️ Overdue ({tickets.filter(t => t.overdue).length})</option>
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
                    <option key={it.id || it.issue_type_id || it._id} value={it.id || it.issue_type_id || it._id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Department:</label>
                <select
                  value={allDeptFilter}
                  onChange={(e) => setAllDeptFilter(e.target.value)}
                  className="dir-select"
                >
                  <option value="all">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="EEE">EEE</option>
                  <option value="Hostel">Hostel</option>
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

              {(allSearchQuery || allStatusFilter !== 'all' || allCategoryFilter !== 'all' || allDeptFilter !== 'all') && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setAllSearchQuery('');
                    setAllStatusFilter('all');
                    setAllCategoryFilter('all');
                    setAllDeptFilter('all');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Directory Count Indicator */}
          <div className="cm-dir-results-info">
            <span>Showing <b>{filteredAllComplaints.length}</b> of <b>{tickets.length}</b> institutional complaints</span>
            {filteredAllComplaints.length === 0 && !loading && (
              <span className="no-match-alert">No complaints match your search or filter criteria.</span>
            )}
          </div>

          {/* VIEW MODE 1: GRID CARDS VIEW */}
          {allViewMode === 'grid' && (
            <div className="cm-dir-grid">
              {filteredAllComplaints.map((t) => (
                <div
                  key={t.ticket_id}
                  className={`cm-complaint-card card ${t.overdue ? 'card-overdue' : ''} ${t.status === 'resolved' ? 'card-resolved' : ''}`}
                >
                  {/* Card Top Strip */}
                  <div className="cm-card-top-strip">
                    <div className="cm-id-row">
                      <span className="ticket-id-tag">#{t.ticket_id}</span>
                      <button
                        type="button"
                        className="copy-id-btn"
                        title="Copy Track ID"
                        onClick={() => handleCopyTrackId(t.ticket_id)}
                      >
                        {copiedId === t.ticket_id ? (
                          <Check size={12} className="text-success" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{copiedId === t.ticket_id ? 'Copied' : 'Copy'}</span>
                      </button>
                      {t.overdue && (
                        <span className="badge badge-overdue-tag">
                          <AlertTriangle size={12} /> Overdue
                        </span>
                      )}
                    </div>
                    <div className="cm-badges-row">
                      <span className="badge badge-type">
                        {t.issue_type_name || 'General'}
                      </span>
                      <span className={`status-badge status-${t.status}`}>
                        {t.status === 'open' && 'Open'}
                        {t.status === 'acknowledged' && 'In Progress'}
                        {t.status === 'resolved' && 'Resolved'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h4 className="cm-card-title">{t.title}</h4>
                  <p className="cm-card-desc">{t.description}</p>

                  {/* Reporter & Location Meta */}
                  <div className="cm-card-meta-list">
                    <div className="cm-meta-item">
                      <UserIcon size={14} className="meta-icon" />
                      <span><b>{t.reported_by_name}</b> {t.reported_by_dept && `(${t.reported_by_dept})`}</span>
                    </div>
                    {t.reported_by_phone_number && (
                      <div className="cm-meta-item">
                        <Phone size={14} className="meta-icon" />
                        <span>{t.reported_by_phone_number}</span>
                      </div>
                    )}
                    <div className="cm-meta-item">
                      <MapPin size={14} className="meta-icon" />
                      <span>{t.location}</span>
                    </div>
                    <div className="cm-meta-item">
                      <Clock size={14} className="meta-icon" />
                      <span>Filed: {new Date(t.created_at).toLocaleString()}</span>
                    </div>
                    {t.tat?.expected_by && (
                      <div className="cm-meta-item tat-highlight">
                        <Calendar size={14} className="meta-icon" />
                        <span>TAT: <b>{new Date(t.tat.expected_by).toLocaleDateString()}</b></span>
                      </div>
                    )}
                    {t.assigned_to?.name && (
                      <div className="cm-meta-item assigned-highlight">
                        <Wrench size={14} className="meta-icon" />
                        <span>Technician: <b>{t.assigned_to.name}</b></span>
                      </div>
                    )}
                  </div>

                  {/* Photos Row with Download capability */}
                  {(t.photo?.url || t.photo_url || t.resolution_photo?.url || t.proof_of_resolution_url) && (
                    <div className="cm-card-photos-strip">
                      {(t.photo?.url || t.photo_url) && (
                        <div className="photo-thumb-wrap">
                          <div
                            className="photo-thumb-inner"
                            onClick={() => setPreviewPhotoUrl(t.photo?.url || t.photo_url)}
                            title="Click to view full defect photo"
                          >
                            <img src={t.photo?.url || t.photo_url} alt="Defect" className="photo-thumb" />
                            <span className="photo-label">Defect Photo</span>
                          </div>
                          <button
                            type="button"
                            className="thumb-download-icon-btn"
                            title="Download Defect Photo"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadComplaintImage(t.ticket_id, `${t.ticket_id}-defect.jpg`, 'defect');
                            }}
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      )}
                      {(t.resolution_photo?.url || t.proof_of_resolution_url) && (
                        <div className="photo-thumb-wrap proof-thumb-wrap">
                          <div
                            className="photo-thumb-inner"
                            onClick={() => setPreviewPhotoUrl(t.resolution_photo?.url || t.proof_of_resolution_url)}
                            title="Click to view resolution proof photo"
                          >
                            <img src={t.resolution_photo?.url || t.proof_of_resolution_url} alt="Proof" className="photo-thumb" />
                            <span className="photo-label proof-label">Proof of Work</span>
                          </div>
                          <button
                            type="button"
                            className="thumb-download-icon-btn"
                            title="Download Proof Photo"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadComplaintImage(t.ticket_id, `${t.ticket_id}-resolution-proof.jpg`, 'resolution');
                            }}
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="cm-card-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedTicket(t)}
                    >
                      <Eye size={14} />
                      <span>Inspect & Update</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setAssignTicketId(t.ticket_id);
                        setActiveTab('assign_cm');
                      }}
                    >
                      <Wrench size={14} />
                      <span>Assign CM</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger btn-sm icon-btn"
                      title="Delete Ticket"
                      onClick={() => handleDeleteTicket(t.ticket_id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE 2: TABLE AUDIT VIEW */}
          {allViewMode === 'table' && (
            <div className="admin-table-audit-card card">
              <div className="table-responsive">
                <table className="custom-table admin-audit-table">
                  <thead>
                    <tr>
                      <th>Track ID</th>
                      <th>Category & Title</th>
                      <th>Reporter</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>TAT</th>
                      <th>Assigned CM</th>
                      <th>Photos</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllComplaints.map((t) => (
                      <tr key={t.ticket_id} className={t.overdue ? 'row-overdue' : ''}>
                        <td className="mono font-bold">
                          <div className="table-id-flex">
                            <span>#{t.ticket_id}</span>
                            <button
                              type="button"
                              className="copy-mini-btn"
                              title="Copy ID"
                              onClick={() => handleCopyTrackId(t.ticket_id)}
                            >
                              {copiedId === t.ticket_id ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="table-title-cell">
                            <span className="badge badge-type table-badge">{t.issue_type_name || 'General'}</span>
                            <span className="table-t-title">{t.title}</span>
                          </div>
                        </td>
                        <td>
                          <div className="table-rep-cell">
                            <b>{t.reported_by_name}</b>
                            <span className="text-muted">{t.reported_by_dept || 'Student'}</span>
                          </div>
                        </td>
                        <td>{t.location}</td>
                        <td>
                          <div className="table-status-cell">
                            <span className={`status-badge status-${t.status}`}>{t.status}</span>
                            {t.overdue && <span className="badge-overdue-tag">⚠️ Overdue</span>}
                          </div>
                        </td>
                        <td>{t.tat?.expected_by ? new Date(t.tat.expected_by).toLocaleDateString() : '-'}</td>
                        <td>
                          {t.assigned_to?.name ? (
                            <span className="cm-assigned-pill">{t.assigned_to.name}</span>
                          ) : (
                            <span className="cm-unassigned-pill">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <div className="table-photos-cell">
                            {(t.photo?.url || t.photo_url) && (
                              <button
                                type="button"
                                className="table-photo-btn"
                                title="Download Defect Photo"
                                onClick={() => downloadComplaintImage(t.ticket_id, `${t.ticket_id}-defect.jpg`, 'defect')}
                              >
                                <Download size={12} />
                                <span>Defect</span>
                              </button>
                            )}
                            {(t.resolution_photo?.url || t.proof_of_resolution_url) && (
                              <button
                                type="button"
                                className="table-photo-btn proof-btn"
                                title="Download Proof Photo"
                                onClick={() => downloadComplaintImage(t.ticket_id, `${t.ticket_id}-resolution-proof.jpg`, 'resolution')}
                              >
                                <Download size={12} />
                                <span>Proof</span>
                              </button>
                            )}
                            {!(t.photo?.url || t.photo_url) && !(t.resolution_photo?.url || t.proof_of_resolution_url) && (
                              <span className="text-muted">-</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="table-actions-cell">
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => setSelectedTicket(t)}
                              title="Inspect Details"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              onClick={() => {
                                setAssignTicketId(t.ticket_id);
                                setActiveTab('assign_cm');
                              }}
                              title="Assign CM"
                            >
                              <Wrench size={12} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-outline btn-xs"
                              onClick={() => handleDeleteTicket(t.ticket_id)}
                              title="Delete Ticket"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NEW COMPLAINTS (Wireframe Page 5 bottom) */}
      {activeTab === 'new_cmp' && (
        <div className="complaints-list-view">
          <div className="view-header-row">
            <div>
              <h3>New & Open Complaints</h3>
              <p className="sub-desc">Select any complaint to view student proof, assign technicians or update status</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadAll}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="complaints-grid-cards">
            {newComplaints.length === 0 ? (
              <div className="empty-box card">
                <CheckCircle2 size={36} color="#10b981" />
                <p>No open complaints pending! Campus facilities are fully operational.</p>
              </div>
            ) : (
              newComplaints.map((t, idx) => (
                <div key={t.ticket_id} className="admin-ticket-card card" onClick={() => setSelectedTicket(t)}>
                  <div className="admin-card-head">
                    <span className="mono ticket-badge-num">Complaint #{idx + 1}</span>
                    <span className="mono track-small-id">{t.ticket_id}</span>
                    {t.overdue && <span className="badge badge-overdue">⚠️ Overdue</span>}
                  </div>

                  <h4>{t.title}</h4>
                  <p className="ticket-desc-clip">{t.description}</p>

                  <div className="ticket-tags-flex">
                    <span className="badge badge-type">{t.issue_type_name}</span>
                    <span className="meta-loc"><MapPin size={12} /> {t.location}</span>
                  </div>

                  {/* Attached Photos Chips */}
                  {(t.photo?.url || t.photo_url || t.resolution_photo?.url || t.proof_of_resolution_url) && (
                    <div className="admin-card-photos-strip">
                      {(t.photo?.url || t.photo_url) && (
                        <div className="admin-photo-chip">
                          <img src={t.photo?.url || t.photo_url} alt="Defect" className="tiny-chip-thumb" />
                          <span className="chip-name">Defect Photo</span>
                          <button
                            type="button"
                            className="chip-download-btn"
                            title="Download Defect Photo"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadComplaintImage(t.ticket_id, `${t.ticket_id}-defect.jpg`, 'defect');
                            }}
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      )}
                      {(t.resolution_photo?.url || t.proof_of_resolution_url) && (
                        <div className="admin-photo-chip chip-proof">
                          <img src={t.resolution_photo?.url || t.proof_of_resolution_url} alt="Proof" className="tiny-chip-thumb" />
                          <span className="chip-name">Resolution Proof</span>
                          <button
                            type="button"
                            className="chip-download-btn"
                            title="Download Resolution Proof Photo"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadComplaintImage(t.ticket_id, `${t.ticket_id}-resolution-proof.jpg`, 'resolution');
                            }}
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="card-bottom-bar">
                    <span className="reported-by-info">
                      By: {t.reported_by_name} ({t.reported_by_dept || 'Student'})
                    </span>
                    <button className="btn btn-primary btn-sm">
                      <Eye size={13} />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EXISTING COMPLAINTS (Wireframe Page 6 top) */}
      {activeTab === 'existing_cmp' && (
        <div className="complaints-list-view">
          <div className="view-header-row">
            <div>
              <h3>Existing & Resolved Complaints</h3>
              <p className="sub-desc">Historical archive of resolved and student-acknowledged tickets</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadAll}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="complaints-grid-cards">
            {existingComplaints.length === 0 ? (
              <div className="empty-box card">
                <p>No resolved complaints yet.</p>
              </div>
            ) : (
              existingComplaints.map((t, idx) => (
                <div key={t.ticket_id} className="admin-ticket-card card resolved-card" onClick={() => setSelectedTicket(t)}>
                  <div className="admin-card-head">
                    <span className="mono ticket-badge-num">Complaint #{idx + 1}</span>
                    <span className="mono track-small-id">{t.ticket_id}</span>
                    <span className={`badge badge-${t.status}`}>{t.status}</span>
                  </div>

                  <h4>{t.title}</h4>
                  <p className="ticket-desc-clip">{t.description}</p>

                  {t.update?.note && (
                    <div className="res-note-preview">
                      <span className="note-lead">Fix Note:</span> "{t.update.note}"
                    </div>
                  )}

                  {/* Attached Photos Chips */}
                  {(t.photo?.url || t.photo_url || t.resolution_photo?.url || t.proof_of_resolution_url) && (
                    <div className="admin-card-photos-strip">
                      {(t.photo?.url || t.photo_url) && (
                        <div className="admin-photo-chip">
                          <img src={t.photo?.url || t.photo_url} alt="Defect" className="tiny-chip-thumb" />
                          <span className="chip-name">Defect Photo</span>
                          <button
                            type="button"
                            className="chip-download-btn"
                            title="Download Defect Photo"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadComplaintImage(t.ticket_id, `${t.ticket_id}-defect.jpg`, 'defect');
                            }}
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      )}
                      {(t.resolution_photo?.url || t.proof_of_resolution_url) && (
                        <div className="admin-photo-chip chip-proof">
                          <img src={t.resolution_photo?.url || t.proof_of_resolution_url} alt="Proof" className="tiny-chip-thumb" />
                          <span className="chip-name">Resolution Proof</span>
                          <button
                            type="button"
                            className="chip-download-btn"
                            title="Download Resolution Proof Photo"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadComplaintImage(t.ticket_id, `${t.ticket_id}-resolution-proof.jpg`, 'resolution');
                            }}
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="card-bottom-bar">
                    <span className="reported-by-info">By: {t.reported_by_name}</span>
                    <button className="btn btn-secondary btn-sm">View Archive</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ISSUE TYPES DIRECTORY (GET /api/v1/fixit/issue-types) */}
      {activeTab === 'issue_types' && (
        <div className="issue-types-wrapper">
          <div className="types-table-card card">
            <div className="section-head-row" style={{ marginBottom: 14 }}>
              <div>
                <h3>Active Maintenance Categories ({issueTypes.length})</h3>
                <p className="card-sub">Official campus categories fetched via GET /api/v1/fixit/issue-types</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={loadAll}>
                <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
                <span>Refresh Categories</span>
              </button>
            </div>

            <div className="types-list">
              {issueTypes.map(it => (
                <div key={it.issue_type_id} className="type-row-item">
                  <div>
                    <div className="type-name-row">
                      <span className="type-name-txt">{it.name}</span>
                      <span className="mono type-id-small">{it.issue_type_id}</span>
                    </div>
                    <p className="type-desc-p">{it.description || 'General maintenance category for campus premises.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TICKET INSPECTION & STATUS MODAL (Wireframe Page 5 bottom right) */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="mono modal-id-badge">{selectedTicket.ticket_id}</span>
                <h3>{selectedTicket.title}</h3>
              </div>
              <button className="close-btn" onClick={() => setSelectedTicket(null)}>×</button>
            </div>

            <div className="modal-body">
              <p className="ticket-full-desc">{selectedTicket.description}</p>

              <div className="ticket-modal-meta">
                <div><span>Location:</span> <b>{selectedTicket.location}</b></div>
                <div><span>Category:</span> <b>{selectedTicket.issue_type_name}</b></div>
                <div><span>Reporter:</span> <b>{selectedTicket.reported_by_name} ({selectedTicket.reported_by_dept})</b></div>
                <div><span>Contact:</span> <b>{selectedTicket.reported_by_phone_number}</b></div>
                <div><span>Status:</span> <span className={`badge badge-${selectedTicket.status}`}>{selectedTicket.status}</span></div>
              </div>

              {/* Photo Evidence Section in Admin Modal */}
              {((selectedTicket.photo?.url || selectedTicket.photo_url) || (selectedTicket.resolution_photo?.url || selectedTicket.proof_of_resolution_url)) && (
                <div className="admin-modal-photos-grid">
                  {(selectedTicket.photo?.url || selectedTicket.photo_url) && (
                    <div className="modal-photo-section">
                      <div className="photo-card-head-row">
                        <span className="photo-label">📸 Student Attached Photo:</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs download-photo-btn"
                          onClick={() => downloadComplaintImage(selectedTicket.ticket_id, `${selectedTicket.ticket_id}-defect.jpg`, 'defect')}
                          title="Download Defect Photo"
                        >
                          <Download size={13} />
                          <span>Download Image</span>
                        </button>
                      </div>
                      <img src={selectedTicket.photo?.url || selectedTicket.photo_url} alt="Defect" className="modal-photo-img" />
                    </div>
                  )}

                  {(selectedTicket.resolution_photo?.url || selectedTicket.proof_of_resolution_url) && (
                    <div className="modal-photo-section proof-section">
                      <div className="photo-card-head-row">
                        <span className="photo-label proof-label">✅ Resolution Proof Photo:</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs download-photo-btn"
                          onClick={() => downloadComplaintImage(selectedTicket.ticket_id, `${selectedTicket.ticket_id}-resolution-proof.jpg`, 'resolution')}
                          title="Download Resolution Proof Photo"
                        >
                          <Download size={13} />
                          <span>Download Proof</span>
                        </button>
                      </div>
                      <img src={selectedTicket.resolution_photo?.url || selectedTicket.proof_of_resolution_url} alt="Resolution" className="modal-photo-img" />
                    </div>
                  )}
                </div>
              )}

              {/* Status Update Form inside Modal matching Page 5 bottom right */}
              <div className="modal-action-box">
                <h4>Upload Complaint Status / Action</h4>
                <form onSubmit={handleAdminStatusSubmit}>
                  <div className="form-group">
                    <label className="form-label">New Status</label>
                    <select
                      className="form-select"
                      value={adminStatus}
                      onChange={e => setAdminStatus(e.target.value)}
                    >
                      <option value="open">In Progress (Open)</option>
                      <option value="resolved">Completed (Resolved)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Action Description / Note</label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g. Electrician sent, part repaired..."
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      required
                    />
                  </div>

                  <div className="modal-btn-row">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      Update Status
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDeleteTicket(selectedTicket.ticket_id)}
                    >
                      Delete Ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => downloadComplaintImage(previewPhotoUrl, 'complaint-evidence.jpg')}
              >
                <Download size={14} />
                <span>Download Image</span>
              </button>
              <a
                href={previewPhotoUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={14} />
                <span>Open Original</span>
              </a>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewPhotoUrl(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
