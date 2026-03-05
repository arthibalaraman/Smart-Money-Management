import React, { useState } from 'react';
import { FIELD_META, CATEGORIES } from '../constants';

const CreateEntryScreen = ({ form, fields, onBack, onSubmit, submitting }) => {
    const [formData, setFormData] = useState(
        fields.reduce((acc, f) => ({
            ...acc,
            [f]: f === 'date' ? new Date().toISOString().split('T')[0]
                : f === 'category' ? CATEGORIES[0]
                    : ''
        }), {})
    );
    const [errors, setErrors] = useState({});

    // Sort fields so 'note' is always last
    const sortedFields = [...fields].sort((a, b) => {
        if (a === 'note') return 1;
        if (b === 'note') return -1;
        return 0;
    });

    const handleChange = (key, val) => {
        const meta = FIELD_META[key];
        let formattedVal = val;

        // Auto-formatting for string fields
        if (meta?.type === 'text' || key === 'note') {
            if (formattedVal.length > 0) {
                formattedVal = formattedVal.charAt(0).toUpperCase() + formattedVal.slice(1);
            }
            formattedVal = formattedVal.replace(/\s\s+/g, ' ');
        }

        setFormData(prev => ({ ...prev, [key]: formattedVal }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        sortedFields.forEach(f => {
            const meta = FIELD_META[f];
            const val = formData[f] ? String(formData[f]).trim() : '';

            if (meta?.required && !val) {
                newErrors[f] = `${meta.label} is required.`;
            }

            if (meta?.type === 'number' && val !== '' && isNaN(val)) {
                newErrors[f] = `Please enter a valid number for ${meta.label}.`;
            }

            // Capitalization and space check for text and textarea fields
            if ((meta?.type === 'text' || f === 'note') && val !== '') {
                if (val[0] !== val[0].toUpperCase()) {
                    newErrors[f] = 'First letter must be capital.';
                } else if (val.includes('  ')) {
                    newErrors[f] = 'Multiple spaces are not allowed.';
                }
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit(formData);
    };

    return (
        <div className="create-entry-screen">
            <div className="page-header">
                <div className="header-left">
                    <button className="btn-back" onClick={onBack}>← Back</button>
                    <div>
                        <h1 className="gradient-text">Add Entry to {form.name}</h1>
                        <p className="subtitle">Fill out the fields below to record your data.</p>
                    </div>
                </div>
            </div>

            <div className="screen-form-wrap glass-panel card">
                <form onSubmit={handleSubmit}>
                    <div className="form-fields-grid">
                        {sortedFields.map(fieldKey => {
                            const meta = FIELD_META[fieldKey] || { label: fieldKey, type: 'text' };
                            return (
                                <div className="form-group" key={fieldKey}>
                                    <label>{meta.label}</label>
                                    {meta.type === 'select' ? (
                                        <select
                                            className={errors[fieldKey] ? 'error-input' : ''}
                                            value={formData[fieldKey]}
                                            onChange={e => handleChange(fieldKey, e.target.value)}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    ) : fieldKey === 'note' ? (
                                        <textarea
                                            className={errors[fieldKey] ? 'error-input' : ''}
                                            value={formData[fieldKey]}
                                            onChange={e => handleChange(fieldKey, e.target.value)}
                                            placeholder={meta.label}
                                            rows={3}
                                        />
                                    ) : (
                                        <input
                                            className={errors[fieldKey] ? 'error-input' : ''}
                                            type={meta.type}
                                            value={formData[fieldKey]}
                                            onChange={e => handleChange(fieldKey, e.target.value)}
                                            placeholder={meta.label}
                                        />
                                    )}
                                    {errors[fieldKey] && <p className="validation-msg">⚠️ {errors[fieldKey]}</p>}
                                </div>
                            );
                        })}
                    </div>
                    <div className="screen-actions">
                        <button type="button" className="btn-secondary" onClick={onBack}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEntryScreen;
