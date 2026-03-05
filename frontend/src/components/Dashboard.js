import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FIELD_LABELS } from '../constants';

const Dashboard = ({ forms, onOpenForm }) => {
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllEntries = useCallback(async () => {
    try {
      const res = await axios.get('/api/all-entries');
      setAllEntries(res.data);
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEntries();
  }, [fetchAllEntries]);

  // Calculations
  const totalEntries = allEntries.length;
  const currentMonthEntries = allEntries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  });

  const totalAmount = currentMonthEntries.reduce((sum, e) => {
    try {
      const data = JSON.parse(e.data || '{}');
      return sum + (parseFloat(data.amount) || 0);
    } catch { return sum; }
  }, 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1 className="gradient-text">✨ Dashboard</h1>
          <p className="subtitle">Overview of your activity across all trackers.</p>
        </div>
      </header>

      <div className="dashboard-stats-grid">
        <div className="stat-card glass-panel purple">
          <div className="stat-icon">📈</div>
          <div>
            <p className="stat-label">Active Trackers</p>
            <p className="stat-value">{forms.length}</p>
          </div>
        </div>
        <div className="stat-card glass-panel blue">
          <div className="stat-icon">📝</div>
          <div>
            <p className="stat-label">Total Logs</p>
            <p className="stat-value">{totalEntries}</p>
          </div>
        </div>
        <div className="stat-card glass-panel green">
          <div className="stat-icon">💰</div>
          <div>
            <p className="stat-label">Monthly Spend</p>
            <p className="stat-value">₹{totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <section className="dashboard-section activity-card glass-panel">
          <div className="section-header">
            <h3>🕒 Recent Activity</h3>
            <p className="section-hint">Latest 10 entries</p>
          </div>
          <div className="activity-list">
            {allEntries.slice(0, 10).map((entry, i) => {
              let data = {};
              try { data = JSON.parse(entry.data || '{}'); } catch { data = {}; }
              const formName = entry.form?.name || 'Unknown Form';
              const date = new Date(entry.date).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short'
              });

              return (
                <div key={entry.id} className="activity-item">
                  <div className="activity-meta">
                    <span className="activity-form-badge">{formName}</span>
                    <span className="activity-date">{date}</span>
                  </div>
                  <div className="activity-data">
                    {Object.entries(data).slice(0, 2).map(([k, v]) => (
                      <span key={k} className="data-chip">
                        <strong>{FIELD_LABELS[k] || k}:</strong> {v}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            {allEntries.length === 0 && <p className="empty-msg">No activity yet. Start logging!</p>}
          </div>
        </section>

        <section className="dashboard-section trackers-card glass-panel">
          <div className="section-header">
            <h3>📂 Your Trackers</h3>
            <p className="section-hint">Quick Access</p>
          </div>
          <div className="quick-forms-grid">
            {forms.slice(0, 6).map(f => (
              <button key={f.id} className="quick-form-btn" onClick={() => onOpenForm(f)}>
                <span className="qf-icon">📄</span>
                <span className="qf-name">{f.name}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
