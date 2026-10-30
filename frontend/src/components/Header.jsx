import React from 'react';
import { Megaphone, Smartphone, Monitor, Bell, LogIn, LogOut, UserCheck, Shield, Wrench, GraduationCap } from 'lucide-react';

export default function Header({
  currentUser,
  activeRole,
  onSwitchRole,
  onOpenLogin,
  onLogout,
  isMobileView,
  setIsMobileView,
  unreadCount,
  onOpenNotifications,
}) {
  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand Logo & Name */}
        <div className="brand-group" onClick={() => onSwitchRole(activeRole)}>
          <div className="logo-icon-bubble">
            <Megaphone className="brand-icon" size={24} />
          </div>
          <div className="brand-texts">
            <div className="brand-title-row">
              <span className="brand-title-hi">आवाज</span>
              <span className="brand-title-en">AVAAJ</span>
            </div>
            <span className="brand-subtitle">Student Grievance Cell · FixIt Track 4</span>
          </div>
        </div>

        {/* Quick Role Switcher Bar */}
        <div className="role-switcher-bar">
          <button
            className={`role-pill ${activeRole === 'student' ? 'active' : ''}`}
            onClick={() => onSwitchRole('student')}
            title="Switch to Student Portal"
          >
            <GraduationCap size={16} />
            <span>Student</span>
          </button>

          <button
            className={`role-pill ${activeRole === 'cm' ? 'active' : ''}`}
            onClick={() => onSwitchRole('cm')}
            title="Switch to Campus Maintenance"
          >
            <Wrench size={16} />
            <span>CM (FixIt)</span>
          </button>

          <button
            className={`role-pill ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => onSwitchRole('admin')}
            title="Switch to Admin Console"
          >
            <Shield size={16} />
            <span>Admin</span>
          </button>
        </div>

        {/* Right Controls: View Switcher, Notifications, Auth */}
        <div className="header-actions">
          {/* View Toggle */}
          <button
            className="view-toggle-btn"
            onClick={() => setIsMobileView(!isMobileView)}
            title={isMobileView ? "Switch to Wide Desktop View" : "Switch to Mobile Phone Sketch View"}
          >
            {isMobileView ? <Monitor size={17} /> : <Smartphone size={17} />}
            <span className="view-toggle-text">{isMobileView ? "Desktop View" : "Phone View"}</span>
          </button>

          {/* Notifications Bell */}
          <button
            className="notification-btn"
            onClick={onOpenNotifications}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {/* User Account / Login */}
          {currentUser ? (
            <div className="user-profile-chip">
              <div className="user-avatar">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div className="user-info-text">
                <span className="user-display-name">{currentUser.name || currentUser.email_id}</span>
                <span className="user-display-role">{currentUser.role === 'office_staff' ? 'Maintenance' : currentUser.role}</span>
              </div>
              <button className="logout-btn" onClick={onLogout} title="Log Out">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onOpenLogin}>
              <LogIn size={15} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
