import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AuthPage.css';

const EyeIcon = ({ open }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {open ? (
            <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ) : (
            <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
            </>
        )}
    </svg>
);

const AuthPage = ({ onAuthSuccess }) => {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    // Common validation logic
    const validate = (name, value) => {
        let err = '';
        if (!value) {
            err = `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
        } else if (name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) err = 'Invalid email address.';
        } else if (name === 'password') {
            if (value.length < 6) err = 'Password must be at least 6 characters.';
        } else if (name === 'username' && mode === 'register') {
            if (value.length < 3) err = 'Username must be at least 3 characters.';
        }
        return err;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        // Real-time validation
        const err = validate(name, value);
        setValidationErrors(prev => ({ ...prev, [name]: err }));

        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final check for all fields
        const newErrors = {};
        if (mode === 'register') newErrors.username = validate('username', form.username);
        newErrors.email = validate('email', form.email);
        newErrors.password = validate('password', form.password);

        // Filter out empty errors
        const hasErrors = Object.values(newErrors).some(err => err !== '');
        if (hasErrors) {
            setValidationErrors(newErrors);
            setError('Please fix the errors above.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
            const payload = mode === 'login'
                ? { email: form.email, password: form.password }
                : { username: form.username, email: form.email, password: form.password };

            const res = await axios.post(endpoint, payload);
            localStorage.setItem('smm_token', res.data.token);
            localStorage.setItem('smm_user', JSON.stringify(res.data.user));
            onAuthSuccess(res.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Connection failed. Please check if your backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (m) => {
        setMode(m);
        setError('');
        setValidationErrors({});
        setShowPassword(false);
        setForm({ username: '', email: '', password: '' });
    };

    return (
        <div className="auth-bg">
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
            <div className="auth-orb auth-orb-3" />

            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo-wrap">
                        <div className="auth-logo-icon">📋</div>
                    </div>
                    <h1 className="auth-title">SmartTracker</h1>
                    <p className="auth-subtitle">
                        {mode === 'login' ? 'Welcome back! Sign in to manage your money.' : 'Create an account to start tracking.'}
                    </p>
                </div>

                <div className="auth-tabs">
                    <button
                        type="button"
                        className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => switchMode('login')}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => switchMode('register')}
                    >
                        Register
                    </button>
                </div>

                {/* noValidate prevents the browser's default "Please fill out this field" bubble */}
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    {mode === 'register' && (
                        <div className="auth-field">
                            <label htmlFor="auth-username">
                                <span className="field-icon">👤</span> Username
                            </label>
                            <input
                                id="auth-username"
                                name="username"
                                type="text"
                                placeholder="Pick a display name"
                                value={form.username}
                                onChange={handleChange}
                                autoComplete="off"
                                className={validationErrors.username ? 'input-error' : ''}
                            />
                            {validationErrors.username && <span className="inline-error">{validationErrors.username}</span>}
                        </div>
                    )}

                    <div className="auth-field">
                        <label htmlFor="auth-email">
                            <span className="field-icon">✉️</span> Email Address
                        </label>
                        <input
                            id="auth-email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="off"
                            className={validationErrors.email ? 'input-error' : ''}
                        />
                        {validationErrors.email && <span className="inline-error">{validationErrors.email}</span>}
                    </div>

                    <div className="auth-field">
                        <label htmlFor="auth-password">
                            <span className="field-icon">🔑</span> Password
                        </label>
                        <div className="auth-password-wrap">
                            <input
                                id="auth-password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="At least 6 characters"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="off"
                                className={validationErrors.password ? 'input-error' : ''}
                            />
                            <button
                                type="button"
                                className="auth-eye-btn"
                                onClick={() => setShowPassword(v => !v)}
                                tabIndex={-1}
                            >
                                <EyeIcon open={showPassword} />
                            </button>
                        </div>
                        {validationErrors.password && <span className="inline-error">{validationErrors.password}</span>}
                    </div>

                    {error && <div className="auth-error-banner">{error}</div>}

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? <span className="auth-spinner" /> : (mode === 'login' ? '🔓 Sign In' : '🚀 Create Account')}
                    </button>
                </form>

                <p className="auth-footer">
                    {mode === 'login' ? "New here?" : "Already joined?"}{' '}
                    <button type="button" className="auth-link" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                        {mode === 'login' ? 'Create Account' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
