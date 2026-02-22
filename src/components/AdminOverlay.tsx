import React, { useState, useEffect } from 'react';
import { API } from '@/utils/api';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  createdAt: string;
  lastLoginAt: string;
  diagramCount: number;
}

interface AdminNotification {
  type: 'new_signup' | 'returning_login';
  user: { name: string; email: string; picture: string | null };
  time: string;
  message: string;
}

interface AdminOverlayProps {
  visible: boolean;
  onClose: () => void;
  authToken: string | null;
}

type AdminTab = 'notifications' | 'users';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function AdminOverlay({ visible, onClose, authToken }: AdminOverlayProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<{ totalUsers: number; totalDiagrams: number } | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [newSignupCount, setNewSignupCount] = useState(0);
  const [activeTab, setActiveTab] = useState<AdminTab>('notifications');

  useEffect(() => {
    if (!visible || !authToken) return;

    API.getAdminUsers().then(setUsers).catch(console.error);
    API.getAdminStats().then(setStats).catch(console.error);
    API.getAdminNotifications().then(data => {
      setNotifications(data.notifications || []);
      setNewSignupCount(data.newSignupCount || 0);
    }).catch(console.error);
  }, [visible, authToken]);

  if (!visible) return null;

  return (
    <div className="admin-overlay" id="adminOverlay" style={{ display: 'flex' }}>
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button className="action-btn btn-save" onClick={onClose}>Back to App</button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="admin-stats" id="adminStats">
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.totalUsers}</div>
              <div className="admin-stat-label">Total Users</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.totalDiagrams}</div>
              <div className="admin-stat-label">Total Diagrams</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value" style={{ color: newSignupCount > 0 ? 'var(--accent-green)' : undefined }}>
                {newSignupCount}
              </div>
              <div className="admin-stat-label">New This Week</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
            {newSignupCount > 0 && <span className="admin-tab-badge">{newSignupCount}</span>}
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            All Users
          </button>
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="admin-notifications">
            {notifications.length === 0 ? (
              <div className="admin-empty">
                <span style={{ fontSize: 32, opacity: 0.5 }}>🔔</span>
                <p>No new activity in the last 7 days</p>
              </div>
            ) : (
              <div className="admin-notification-list">
                {notifications.map((n, i) => (
                  <div key={i} className={`admin-notification-item ${n.type}`}>
                    <div className="admin-notif-icon">
                      {n.type === 'new_signup' ? '🆕' : '🔄'}
                    </div>
                    <div className="admin-notif-avatar">
                      {n.user.picture ? (
                        <img src={n.user.picture} alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="admin-notif-avatar-placeholder">
                          {n.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="admin-notif-content">
                      <div className="admin-notif-message">
                        <strong>{n.user.name}</strong>
                        {n.type === 'new_signup' ? ' signed up for the first time' : ' logged in'}
                      </div>
                      <div className="admin-notif-meta">
                        {n.user.email} &middot; {timeAgo(n.time)}
                      </div>
                    </div>
                    {n.type === 'new_signup' && (
                      <span className="admin-notif-tag new">NEW</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <table className="admin-table">
            <thead>
              <tr><th>User</th><th>Diagrams</th><th>First Login</th><th>Last Active</th></tr>
            </thead>
            <tbody id="adminUserList">
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {u.picture && <img src={u.picture} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} referrerPolicy="no-referrer" />}
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.diagramCount}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>{timeAgo(u.lastLoginAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
