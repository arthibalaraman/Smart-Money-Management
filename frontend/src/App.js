import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import './App.css';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import FormsList from './components/FormsList';
import CreateFormScreen from './components/CreateFormScreen';
import FormView from './components/FormView';
import ReportsPage from './components/ReportsPage';
import Dashboard from './components/Dashboard';
import ConfirmModal from './components/ConfirmModal';
import AuthPage from './components/AuthPage';

// API URL routing
const GET_API_URL = () => {
  if (Capacitor.getPlatform() === 'android') {
    // Using ADB reverse tcp:5000 tcp:5000 for direct USB connection
    console.log(`[Android] Attempting connection via localhost (via ADB)`);
    return `http://localhost:5000`;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const API_URL = GET_API_URL();
axios.defaults.baseURL = API_URL;
console.log('--- AXIOS BASE URL SET ---', axios.defaults.baseURL);

// Bypass localtunnel warning page
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';

// Attach JWT token to every request automatically
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('smm_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// All API requests will now use this base URL.

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('smm_user')); } catch { return null; }
  });
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, formId: null });

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('smm_token');
    localStorage.removeItem('smm_user');
    setUser(null);
    setForms([]);
    setActiveView('dashboard');
  };

  // All hooks must be called unconditionally (Rules of Hooks)
  useEffect(() => {
    if (user) fetchForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchForms = async () => {
    try {
      const res = await axios.get('/api/forms');
      setForms(res.data);
    } catch (e) {
      console.error('--- FETCH FORMS ERROR ---');
      const errorDetail = e.response?.data?.message || e.message;
      const fullUrl = (axios.defaults.baseURL || '') + '/api/forms';
      console.error('URL:', fullUrl);
      console.error('Status:', e.response?.status);
      console.error('Message:', e.message);

      if (e.message === 'Network Error') {
        toast.error(`Network Error: Cannot reach server at ${axios.defaults.baseURL}. Ensure your PC and mobile are on same WiFi and firewall is off.`);
      } else {
        toast.error(`Fetch Error: ${errorDetail}`);
      }
    }
    finally { setLoading(false); }
  };

  const createForm = async ({ name, fields }) => {
    setSubmitting(true);
    try {
      console.log('Creating form:', { name, fields });
      const res = await axios.post('/api/forms', { name, fields });
      setForms([res.data, ...forms]);
      toast.success('Form created successfully!');
      goHome();
    } catch (e) {
      console.error('--- CREATE FORM ERROR ---');
      const errorDetail = e.response?.data?.message || e.message;
      console.error('URL:', axios.defaults.baseURL + '/api/forms');
      console.error('Status:', e.response?.status);
      console.error('Message:', e.message);

      if (e.message === 'Network Error') {
        toast.error(`Network Error: Cannot reach server at ${axios.defaults.baseURL}`);
      } else {
        toast.error(`Create Error: ${errorDetail}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = async ({ id, name, fields }) => {
    try {
      const res = await axios.put(`/api/forms/${id}`, { name, fields });
      setForms(forms.map(f => f.id === id ? res.data : f));
      setEditingForm(null);
      if (activeForm && activeForm.id === id) setActiveForm(res.data);
      toast.success('Form updated successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update form.');
    }
  };

  const requestDeleteForm = (eOrId, id) => {
    // FormsList calls onDelete(form.id) with just an ID (no event).
    // Sidebar may call it with (event, id). Handle both cases.
    if (typeof eOrId === 'object' && eOrId !== null && typeof eOrId.stopPropagation === 'function') {
      eOrId.stopPropagation();
      setConfirmModal({ isOpen: true, formId: id });
    } else {
      // eOrId is actually the id (number)
      setConfirmModal({ isOpen: true, formId: eOrId });
    }
  };

  const deleteForm = async () => {
    const id = confirmModal.formId;
    if (!id) return;
    try {
      await axios.delete(`/api/forms/${id}`);
      setForms(forms.filter(f => f.id !== id));
      if (activeForm && activeForm.id === id) setActiveForm(null);
      toast.success('Form deleted.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete form.');
    } finally {
      setConfirmModal({ isOpen: false, formId: null });
    }
  };

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>Loading...</p>
      </div>
    );
  }

  const goDashboard = () => { setActiveForm(null); setEditingForm(null); setActiveView('dashboard'); setSidebarOpen(false); };
  const goHome = () => { setActiveForm(null); setEditingForm(null); setActiveView('home'); setSidebarOpen(false); };
  const goReports = () => { setActiveForm(null); setEditingForm(null); setActiveView('reports'); setSidebarOpen(false); };
  const goCreate = () => { setActiveForm(null); setEditingForm(null); setActiveView('create'); setSidebarOpen(false); };
  const openForm = (f) => { setActiveForm(f); setEditingForm(null); setActiveView('form'); setSidebarOpen(false); };
  const openEditForm = (f) => { setEditingForm(f); setActiveView('edit'); setSidebarOpen(false); };
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="app-shell">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          className: 'glass-toast',
        }}
      />
      {/* ─── Mobile Header ─── */}
      <header className="mobile-header">
        <button className={`hamburger ${sidebarOpen ? 'open' : ''}`} onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="mobile-logo">SmartTracker</div>
      </header>

      {/* ─── Sidebar Backdrop ─── */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">📋</div>
            <div>
              <div className="sidebar-logo-text">SmartTracker</div>
              <div className="sidebar-logo-sub">Hi, {user?.username || 'User'} 👋</div>
            </div>
          </div>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={goDashboard}
          >
            ✨&nbsp; Dashboard
          </button>
          <button
            className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={goHome}
          >
            🏠&nbsp; My Forms
          </button>
          <button
            className={`nav-item ${activeView === 'reports' ? 'active' : ''}`}
            onClick={goReports}
          >
            📊&nbsp; Monthly Reports
          </button>
        </nav>

        {forms.length > 0 && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">My Forms</div>
            <nav className="sidebar-nav sidebar-forms-list">
              {forms.map(f => (
                <button
                  key={f.id}
                  className={`nav-item ${activeForm && activeForm.id === f.id ? 'active' : ''}`}
                  onClick={() => openForm(f)}
                  title={f.name}
                >
                  📄&nbsp; {f.name}
                </button>
              ))}
            </nav>
          </>
        )}

        <button className="btn-create-form" onClick={goCreate}>
          ＋ &nbsp;New Form
        </button>
        <button className="btn-logout" onClick={handleLogout} title="Logout">
          🚪 &nbsp;Logout
        </button>
      </aside>

      {/* ─── Main ─── */}
      <main className="main-content">
        {activeView === 'dashboard' ? (
          <Dashboard forms={forms} onOpenForm={openForm} />
        ) : activeView === 'reports' ? (
          <ReportsPage forms={forms} />
        ) : activeView === 'form' && activeForm ? (
          <FormView form={activeForm} onBack={goHome} />
        ) : activeView === 'create' || activeView === 'edit' ? (
          <CreateFormScreen
            editingForm={editingForm}
            onBack={goHome}
            onCreate={createForm}
            onUpdate={updateForm}
            submitting={submitting}
          />
        ) : (
          <FormsList
            forms={forms}
            onOpen={openForm}
            onDelete={requestDeleteForm}
            onEdit={openEditForm}
            onCreate={goCreate}
          />
        )}
      </main>

      {/* ─── Bottom Navigation (Mobile Only) ─── */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <button
            className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={goDashboard}
          >
            <span className="nav-tab-icon">✨</span>
            <span className="nav-tab-label">Home</span>
          </button>
          <button
            className={`nav-tab ${activeView === 'home' ? 'active' : ''}`}
            onClick={goHome}
          >
            <span className="nav-tab-icon">🏠</span>
            <span className="nav-tab-label">Forms</span>
          </button>
          <button
            className={`nav-tab ${activeView === 'reports' ? 'active' : ''}`}
            onClick={goReports}
          >
            <span className="nav-tab-icon">📊</span>
            <span className="nav-tab-label">Reports</span>
          </button>
          <button className="nav-tab" onClick={goCreate}>
            <span className="nav-tab-icon">➕</span>
            <span className="nav-tab-label">New</span>
          </button>
        </div>
      </nav>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Form"
        message="Are you sure you want to delete this form and all its entries? This action cannot be undone."
        onConfirm={deleteForm}
        onCancel={() => setConfirmModal({ isOpen: false, formId: null })}
      />
    </div>
  );
}

export default App;
