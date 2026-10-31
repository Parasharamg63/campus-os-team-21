import React, { useState } from 'react';
import {
  LogIn, Key, Mail, Shield, Users, Wrench, Sparkles,
  AlertCircle, GraduationCap, BookOpen, Briefcase
} from 'lucide-react';
import { apiLoginUser, apiLoginAdmin } from '../api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [mainTab, setMainTab] = useState('non_admin'); // 'non_admin' | 'cm' | 'admin'
  const [nonAdminSubRole, setNonAdminSubRole] = useState('student'); // 'student' | 'faculty' | 'office_staff'
  const [emailId, setEmailId] = useState('asha@team21.com');
  const [otp, setOtp] = useState('730792');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleMainTabChange = (tab) => {
    setMainTab(tab);
    setErrorMsg('');
    if (tab === 'non_admin') {
      applySubRoleCredentials(nonAdminSubRole);
    } else if (tab === 'cm') {
      setEmailId('kumar@team21.com');
    } else if (tab === 'admin') {
      setEmailId('admin@team21.com');
    }
    setOtp('730792');
  };

  const applySubRoleCredentials = (subRole) => {
    setNonAdminSubRole(subRole);
    if (subRole === 'student') {
      setEmailId('asha@team21.com');
    } else if (subRole === 'faculty') {
      setEmailId('meera@team21.com');
    } else if (subRole === 'office_staff') {
      setEmailId('priya@team21.com');
    }
    setOtp('730792');
  };

  const handleSubRoleChange = (subRole) => {
    setMainTab('non_admin');
    setErrorMsg('');
    applySubRoleCredentials(subRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let res;
      let targetRole = mainTab;

      if (mainTab === 'admin') {
        res = await apiLoginAdmin(emailId.trim(), otp.trim());
        targetRole = 'admin';
      } else {
        res = await apiLoginUser(emailId.trim(), otp.trim());
        if (mainTab === 'cm') {
          targetRole = 'cm';
        } else {
          // Resolve non-admin subrole
          if (res.profile?.role === 'faculty') targetRole = 'faculty';
          else if (res.profile?.role === 'office_staff') targetRole = 'office_staff';
          else targetRole = 'student';
        }
      }

      onLoginSuccess(res.profile, targetRole);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const getSubmitLabel = () => {
    if (loading) return 'Authenticating...';
    if (mainTab === 'admin') return 'Login as Admin';
    if (mainTab === 'cm') return 'Login as CM (FixIt)';
    if (nonAdminSubRole === 'faculty') return 'Login as Non-Admin (Faculty)';
    if (nonAdminSubRole === 'office_staff') return 'Login as Non-Admin (Office Staff)';
    return 'Login as Non-Admin (Student)';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-header">
          <div className="auth-logo-badge">
            <span className="hindi-badge">आवाज</span>
          </div>
          <h2>Portal Login</h2>
          <p className="auth-modal-sub">Campus Grievance Cell & Facility Operations</p>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Primary Role Selector Tabs: Non-Admin, CM, Admin */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mainTab === 'non_admin' ? 'active' : ''}`}
            onClick={() => handleMainTabChange('non_admin')}
          >
            <Users size={15} />
            <span>Non-Admin</span>
          </button>

          <button
            type="button"
            className={`auth-tab-btn ${mainTab === 'cm' ? 'active' : ''}`}
            onClick={() => handleMainTabChange('cm')}
          >
            <Wrench size={15} />
            <span>CM (FixIt)</span>
          </button>

          <button
            type="button"
            className={`auth-tab-btn ${mainTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleMainTabChange('admin')}
          >
            <Shield size={15} />
            <span>Admin</span>
          </button>
        </div>

        {/* Sub-options for Non-Admin: Student, Faculty, Office Staff */}
        {mainTab === 'non_admin' && (
          <div className="nonadmin-subtabs-wrapper">
            <div className="subtabs-caption">Select Non-Admin Category:</div>
            <div className="nonadmin-subtabs-row">
              <button
                type="button"
                className={`subtab-btn ${nonAdminSubRole === 'student' ? 'active' : ''}`}
                onClick={() => handleSubRoleChange('student')}
              >
                <GraduationCap size={14} />
                <span>Student</span>
              </button>

              <button
                type="button"
                className={`subtab-btn ${nonAdminSubRole === 'faculty' ? 'active' : ''}`}
                onClick={() => handleSubRoleChange('faculty')}
              >
                <BookOpen size={14} />
                <span>Faculty</span>
              </button>

              <button
                type="button"
                className={`subtab-btn ${nonAdminSubRole === 'office_staff' ? 'active' : ''}`}
                onClick={() => handleSubRoleChange('office_staff')}
              >
                <Briefcase size={14} />
                <span>Office Staff</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Demo Credentials Info Banner */}
        <div className="demo-credentials-box">
          <div className="demo-head">
            <Sparkles size={14} color="#f59e0b" />
            <span>Quick Demo Institutional Accounts (@team21.com)</span>
          </div>
          <div className="demo-pills-row">
            <button
              type="button"
              className={`quick-demo-pill ${mainTab === 'non_admin' && nonAdminSubRole === 'student' ? 'active-pill' : ''}`}
              onClick={() => handleSubRoleChange('student')}
            >
              🎓 Student: asha@team21.com
            </button>
            <button
              type="button"
              className={`quick-demo-pill ${mainTab === 'non_admin' && nonAdminSubRole === 'faculty' ? 'active-pill' : ''}`}
              onClick={() => handleSubRoleChange('faculty')}
            >
              👨‍🏫 Faculty: meera@team21.com
            </button>
            <button
              type="button"
              className={`quick-demo-pill ${mainTab === 'non_admin' && nonAdminSubRole === 'office_staff' ? 'active-pill' : ''}`}
              onClick={() => handleSubRoleChange('office_staff')}
            >
              💼 Staff: priya@team21.com
            </button>
            <button
              type="button"
              className={`quick-demo-pill ${mainTab === 'cm' ? 'active-pill' : ''}`}
              onClick={() => handleMainTabChange('cm')}
            >
              🔧 CM: kumar@team21.com
            </button>
            <button
              type="button"
              className={`quick-demo-pill ${mainTab === 'admin' ? 'active-pill' : ''}`}
              onClick={() => handleMainTabChange('admin')}
            >
              🛡️ Admin: admin@team21.com
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="alert-box alert-error" style={{ marginBottom: 14 }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              <Mail size={14} />
              <span>Campus Email ID (@team21.com)</span>
            </label>
            <input
              type="email"
              className="form-input"
              value={emailId}
              onChange={e => setEmailId(e.target.value)}
              placeholder="e.g. asha@team21.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Key size={14} />
              <span>Team Login OTP</span>
            </label>
            <input
              type="text"
              className="form-input mono"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="e.g. 730792"
              required
            />
            <span className="form-hint">Team 21 default institutional OTP is <b>730792</b></span>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit-btn" disabled={loading}>
            <LogIn size={18} />
            <span>{getSubmitLabel()}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
