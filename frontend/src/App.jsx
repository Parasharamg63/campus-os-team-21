import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PhoneFrame from './components/PhoneFrame';
import StudentView from './components/StudentView';
import CMView from './components/CMView';
import AdminView from './components/AdminView';
import LoginModal from './components/LoginModal';
import NotificationsModal from './components/NotificationsModal';
import { getCurrentUser, setCurrentUser, removeCurrentUser, removeToken, apiGetNotifications, apiLoginUser, apiLoginAdmin } from './api';
import './App.css';

export default function App() {
  const [activeRole, setActiveRole] = useState('student'); // 'student' | 'cm' | 'admin'
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [isMobileView, setIsMobileView] = useState(false); // Toggle between mobile frame & desktop view
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Auto-seed or detect current user
  useEffect(() => {
    // If no user in localStorage, default to Asha (student) for instant demo
    if (!currentUser) {
      autoLoginDefault('student');
    } else {
      syncRoleWithUser(currentUser);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser, activeRole]);

  const syncRoleWithUser = (user) => {
    if (!user) return;
    if (user.role === 'admin') {
      setActiveRole('admin');
    } else if (user.role === 'office_staff' && (user.dept || '').toLowerCase().includes('maintenance')) {
      setActiveRole('cm');
    } else if (user.role === 'faculty') {
      setActiveRole('faculty');
    } else if (user.role === 'office_staff') {
      setActiveRole('office_staff');
    } else {
      setActiveRole('student');
    }
  };

  const autoLoginDefault = async (role) => {
    try {
      if (role === 'student') {
        const res = await apiLoginUser('asha@team21.com', '730792');
        setCurrentUserState(res.profile);
        setActiveRole('student');
      } else if (role === 'faculty') {
        const res = await apiLoginUser('meera@team21.com', '730792');
        setCurrentUserState(res.profile);
        setActiveRole('faculty');
      } else if (role === 'office_staff') {
        const res = await apiLoginUser('priya@team21.com', '730792');
        setCurrentUserState(res.profile);
        setActiveRole('office_staff');
      } else if (role === 'cm') {
        const res = await apiLoginUser('kumar@team21.com', '730792');
        setCurrentUserState(res.profile);
        setActiveRole('cm');
      } else if (role === 'admin') {
        const res = await apiLoginAdmin('admin@team21.com', '730792');
        setCurrentUserState(res.profile);
        setActiveRole('admin');
      }
    } catch (e) {
      console.warn('Auto login note:', e.message);
    }
  };

  const loadNotifications = async () => {
    try {
      const email = currentUser?.email_id || (activeRole === 'cm' ? 'cm@team21.com' : 'asha@team21.com');
      const list = await apiGetNotifications(email);
      setNotifications(list || []);
    } catch (e) {
      // non-blocking
    }
  };

  // Switch role with instant credential switch
  const handleSwitchRole = async (newRole) => {
    setActiveRole(newRole);
    // Automatically switch active session to corresponding default account for smooth experience
    await autoLoginDefault(newRole);
  };

  const handleLoginSuccess = (profile, role) => {
    setCurrentUserState(profile);
    setActiveRole(role);
  };

  const handleLogout = () => {
    removeToken();
    removeCurrentUser();
    setCurrentUserState(null);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const isNonAdmin = ['student', 'faculty', 'office_staff'].includes(activeRole);

  return (
    <div className={`app-root ${isMobileView ? 'mode-mobile-frame' : 'mode-desktop'}`}>
      {/* Universal Top Header */}
      <Header
        currentUser={currentUser}
        activeRole={activeRole}
        onSwitchRole={handleSwitchRole}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        isMobileView={isMobileView}
        setIsMobileView={setIsMobileView}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      {/* Main Container wrapped in PhoneFrame (toggleable) */}
      <main className="main-viewport">
        <PhoneFrame
          isMobileView={isMobileView}
          role={activeRole}
          onHomeClick={() => {}}
        >
          {isNonAdmin && (
            <StudentView
              currentUser={currentUser}
              activeRole={activeRole}
              onOpenNotifications={() => setIsNotifOpen(true)}
              onSelectRole={handleSwitchRole}
            />
          )}

          {activeRole === 'cm' && (
            <CMView
              currentUser={currentUser}
              onOpenNotifications={() => setIsNotifOpen(true)}
            />
          )}

          {activeRole === 'admin' && (
            <AdminView
              currentUser={currentUser}
            />
          )}
        </PhoneFrame>
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <NotificationsModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onRefresh={loadNotifications}
      />
    </div>
  );
}
