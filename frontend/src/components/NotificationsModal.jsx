import React from 'react';
import { Bell, CheckCircle2, Clock, Wrench, Shield, Check } from 'lucide-react';
import { apiMarkNotificationRead } from '../api';

export default function NotificationsModal({ isOpen, onClose, notifications, onRefresh }) {
  if (!isOpen) return null;

  const handleMarkRead = async (id) => {
    try {
      await apiMarkNotificationRead(id);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content notifications-modal" onClick={e => e.stopPropagation()}>
        <div className="notif-modal-header">
          <div className="notif-title-row">
            <Bell size={20} color="#818cf8" />
            <h3>Campus Notifications</h3>
            <span className="notif-count-pill">{notifications.length}</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="notif-list-body">
          {notifications.length === 0 ? (
            <div className="empty-notif-box">
              <Bell size={36} className="empty-icon" />
              <p>No new notifications at this time.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n._id}
                className={`notif-card-item ${!n.read ? 'unread' : ''}`}
                onClick={() => handleMarkRead(n._id)}
              >
                <div className="notif-type-icon">
                  {n.type === 'status_updated' || n.type === 'acknowledged' ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : n.type === 'tat_updated' ? (
                    <Clock size={18} color="#f59e0b" />
                  ) : (
                    <Wrench size={18} color="#6366f1" />
                  )}
                </div>

                <div className="notif-text-wrap">
                  <div className="notif-head-line">
                    <span className="notif-item-title">{n.title}</span>
                    {!n.read && <span className="unread-dot"></span>}
                  </div>
                  <p className="notif-item-msg">{n.message}</p>
                  <span className="notif-item-time">
                    {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
