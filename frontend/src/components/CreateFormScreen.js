import React, { useState, useEffect } from 'react';
import { AVAILABLE_FIELDS } from '../constants';

const CreateFormScreen = ({ onBack, onCreate, onUpdate, editingForm, submitting }) => {
    const [formName, setFormName] = useState('');
    const [selectedFields, setSelectedFields] = useState(['date']);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (editingForm) {
            setFormName(editingForm.name);
            try {
                setSelectedFields(JSON.parse(editingForm.fields || '[]'));
            } catch (e) {
                console.error('Error parsing form fields', e);
            }
        }
    }, [editingForm]);

    const toggleField = (key) => {
        if (key === 'date') return; // date is always required
        setSelectedFields(prev =>
            prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formName.trim()) {
            newErrors.formName = 'Please enter a form name.';
        } else if (formName.trim()[0] !== formName.trim()[0].toUpperCase()) {
            newErrors.formName = 'First letter must be capital (e.g. "M" in "Monthly").';
        } else if (formName.includes('  ')) {
            newErrors.formName = 'Multiple spaces are not allowed.';
        }

        if (selectedFields.length < 2) {
            newErrors.fields = 'Please select at least one field besides Date.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        if (editingForm) {
            onUpdate({ id: editingForm.id, name: formName.trim(), fields: selectedFields });
        } else {
            onCreate({ name: formName.trim(), fields: selectedFields });
        }
    };

    return (
        <div className="create-form-screen">
            <div className="page-header">
                <div className="header-left">
                    <button className="btn-back" onClick={onBack}>← Back</button>
                    <div>
                        <h1 className="gradient-text">{editingForm ? 'Edit Form' : 'Create New Form'}</h1>
                        <p className="subtitle">Define the fields you want to track for this form.</p>
                    </div>
                </div>
            </div>

            <div className="screen-form-wrap glass-panel card">
                <form onSubmit={handleSubmit}>
                    <div className="form-fields-grid">
                        <div className="form-column">
                            <div className="form-group">
                                <label>Form Name / Purpose</label>
                                <input
                                    type="text"
                                    className={errors.formName ? 'error-input' : ''}
                                    value={formName}
                                    onChange={e => {
                                        let val = e.target.value;
                                        // Auto-capitalize first letter
                                        if (val.length > 0) {
                                            val = val.charAt(0).toUpperCase() + val.slice(1);
                                        }
                                        // Auto-collapse multiple spaces
                                        val = val.replace(/\s\s+/g, ' ');

                                        setFormName(val);
                                        if (errors.formName) setErrors(prev => ({ ...prev, formName: null }));
                                    }}
                                    placeholder="e.g. Monthly Savings, Tea Count, Shop Debit..."
                                    autoFocus
                                />
                                {errors.formName && <p className="validation-msg">⚠️ {errors.formName}</p>}
                                <p className="field-hint" style={{ marginTop: '0.5rem' }}>Give your tracker a clear name.</p>
                            </div>
                        </div>

                        <div className="form-column">
                            <div className="form-group">
                                <label>Select Fields to Include</label>
                                <p className="field-hint">📅 Date is always included. Pick the fields you need:</p>
                                <div className={`field-checkbox-list ${errors.fields ? 'error-container' : ''}`}>
                                    {AVAILABLE_FIELDS.map(f => (
                                        <label
                                            key={f.key}
                                            className={`field-checkbox-item ${selectedFields.includes(f.key) ? 'checked' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedFields.includes(f.key)}
                                                onChange={() => {
                                                    toggleField(f.key);
                                                    if (errors.fields) setErrors(prev => ({ ...prev, fields: null }));
                                                }}
                                                disabled={f.key === 'date'}
                                            />
                                            <span>{f.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.fields && <p className="validation-msg">⚠️ {errors.fields}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="screen-actions">
                        <button type="button" className="btn-secondary" onClick={onBack}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? 'Creating...' : (editingForm ? 'Update Form' : 'Create Form')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFormScreen;
