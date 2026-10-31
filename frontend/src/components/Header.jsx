import React, { useState, useRef, useEffect } from 'react';
import {
  Megaphone, Smartphone, Monitor, LogIn, LogOut,
  Shield, Wrench, GraduationCap, Users, ChevronDown, BookOpen, Briefcase, Check
} from 'lucide-react';

export default function Header({
  currentUser,
  activeRole,
  onSwitchRole,
  onOpenLogin,
  onLogout,
  isMobileView,
  setIsMobileView,
}) {
  const [showNonAdminMenu, setShowNonAdminMenu] = useState(false);
  const dropdownRef = useRef(null);

  const isNonAdmin = ['student', 'faculty', 'office_staff'].includes(activeRole);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNonAdminMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNonAdminLabel = () => {
    if (activeRole === 'faculty') return 'Non-Admin (Faculty)';
    if (activeRole === 'office_staff') return 'Non-Admin (Staff)';
    if (activeRole === 'student') return 'Non-Admin (Student)';
    return 'Non-Admin';
  };

  const handleSelectNonAdmin = (subRole) => {
    onSwitchRole(subRole);
    setShowNonAdminMenu(false);
  };

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
            <span className="brand-subtitle">Campus Grievance Cell · FixIt Track 4</span>
          </div>
        </div>

        {/* Quick Role Switcher Bar */}
        <div className="role-switcher-bar">
          {/* Non-Admin with 3 Sub-Options (Student, Faculty, Office Staff) */}
          <div className="role-dropdown-container" ref={dropdownRef}>
            <button
              className={`role-pill nonadmin-pill ${isNonAdmin ? 'active' : ''}`}
              onClick={() => setShowNonAdminMenu(!showNonAdminMenu)}
              title="Non-Admin Logins: Student, Faculty, Office Staff"
              aria-haspopup="true"
              aria-expanded={showNonAdminMenu}
            >
              <Users size={16} />
              <span>{getNonAdminLabel()}</span>
              <ChevronDown size={14} className={`dropdown-caret ${showNonAdminMenu ? 'open' : ''}`} />
            </button>

            {showNonAdminMenu && (
              <div className="nonadmin-dropdown-menu">
                <div className="dropdown-menu-header">
                  <span>Non-Admin Options</span>
                </div>

                <button
                  type="button"
                  className={`dropdown-menu-item ${activeRole === 'student' ? 'active-item' : ''}`}
                  onClick={() => handleSelectNonAdmin('student')}
                >
                  <div className="item-icon-wrapper student-icon">
                    <GraduationCap size={16} />
                  </div>
                  <div className="item-text-group">
                    <div className="item-title-row">
                      <span className="item-title">Student Login</span>
                      {activeRole === 'student' && <Check size={14} className="active-check" />}
                    </div>
                    <span className="item-sub">Asha Kumar · CSE</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`dropdown-menu-item ${activeRole === 'faculty' ? 'active-item' : ''}`}
                  onClick={() => handleSelectNonAdmin('faculty')}
                >
                  <div className="item-icon-wrapper faculty-icon">
                    <BookOpen size={16} />
                  </div>
                  <div className="item-text-group">
                    <div className="item-title-row">
                      <span className="item-title">Faculty Login</span>
                      {activeRole === 'faculty' && <Check size={14} className="active-check" />}
                    </div>
                    <span className="item-sub">Dr. Meera Rao · Professor</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`dropdown-menu-item ${activeRole === 'office_staff' ? 'active-item' : ''}`}
                  onClick={() => handleSelectNonAdmin('office_staff')}
                >
                  <div className="item-icon-wrapper staff-icon">
                    <Briefcase size={16} />
                  </div>
                  <div className="item-text-group">
                    <div className="item-title-row">
                      <span className="item-title">Office Staff Login</span>
                      {activeRole === 'office_staff' && <Check size={14} className="active-check" />}
                    </div>
                    <span className="item-sub">Priya Nair · Superintendent</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            className={`role-pill ${activeRole === 'cm' ? 'active' : ''}`}
            onClick={() => {
              setShowNonAdminMenu(false);
              onSwitchRole('cm');
            }}
            title="Switch to Campus Maintenance"
          >
            <Wrench size={16} />
            <span>CM (FixIt)</span>
          </button>

          <button
            className={`role-pill ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setShowNonAdminMenu(false);
              onSwitchRole('admin');
            }}
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


          {/* User Account / Login */}
          {currentUser ? (
            <div className="user-profile-chip">
              <div className="user-avatar">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div className="user-info-text">
                <span className="user-display-name">{currentUser.name || currentUser.email_id}</span>
                <span className="user-display-role">
                  {currentUser.role === 'office_staff'
                    ? ((currentUser.dept || '').toLowerCase().includes('maintenance') ? 'Maintenance' : 'Office Staff')
                    : currentUser.role === 'faculty'
                    ? 'Faculty'
                    : currentUser.role === 'student'
                    ? 'Student'
                    : currentUser.role === 'admin'
                    ? 'Admin'
                    : currentUser.role}
                </span>
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
