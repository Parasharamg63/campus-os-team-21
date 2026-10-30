import React, { useState } from 'react';
import { LogIn, Key, Mail, Shield, User, Wrench, Sparkles, AlertCircle } from 'lucide-react';
import { apiLoginUser, apiLoginAdmin } from '../api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [roleTab, setRoleTab] = useState('student'); // student | cm | admin
  const [emailId, setEmailId] = useState('asha@team21.com');
  const [otp, setOtp] = useState('730792');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleRoleTabChange = (role) => {
    setRoleTab(role);
    setErrorMsg('');
    if (role === 'student') {
      setEmailId('asha@team21.com');
    } else if (role === 'cm') {
      setEmailId('kumar@team21.com');
    } else if (role === 'admin') {
      setEmailId('admin@team21.com');
    }
    setOtp('730792');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let res;
      if (roleTab === 'admin') {
        res = await apiLoginAdmin(emailId.trim(), otp.trim());
      } else {
        res = await apiLoginUser(emailId.trim(), otp.trim());
      }
      onLoginSuccess(res.profile, roleTab);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-header">
          <div className="auth-logo-badge">
            <span className="hindi-badge">आवाज</span>
          </div>
          <h2>Portal Login</h2>
          <p className="auth-modal-sub">Student Grievance Cell & Campus Maintenance</p>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Role Selector Tabs (Matches wireframe Page 1 & 2 buttons: Admin, Student, CM) */}
        <div className="auth-role-tabs">
          <button
            className={`auth-tab-btn ${roleTab === 'student' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('student')}
          >
            <User size={15} />
            <span>Student</span>
          </button>

          <button
            className={`auth-tab-btn ${roleTab === 'cm' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('cm')}
          >
            <Wrench size={15} />
            <span>CM (Staff)</span>
          </button>

          <button
            className={`auth-tab-btn ${roleTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('admin')}
          >
            <Shield size={15} />
            <span>Admin</span>
          </button>
        </div>

        {/* Quick Demo Credentials Info Banner */}
        <div className="demo-credentials-box">
          <div className="demo-head">
            <Sparkles size={14} color="#f59e0b" />
            <span>Demo Institution Credentials (Team 21)</span>
          </div>
          <div className="demo-pills-row">
            <button
              type="button"
              className="quick-demo-pill"
              onClick={() => { handleRoleTabChange('student'); }}
            >
              Student: asha@team21.com
            </button>
            <button
              type="button"
              className="quick-demo-pill"
              onClick={() => { handleRoleTabChange('cm'); }}
            >
              CM: kumar@team21.com
            </button>
            <button
              type="button"
              className="quick-demo-pill"
              onClick={() => { handleRoleTabChange('admin'); }}
            >
              Admin: admin@team21.com
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
            <span className="form-hint">Team 21 default OTP is <b>730792</b></span>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit-btn" disabled={loading}>
            <LogIn size={18} />
            <span>{loading ? 'Authenticating...' : `Login as ${roleTab.toUpperCase()}`}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
