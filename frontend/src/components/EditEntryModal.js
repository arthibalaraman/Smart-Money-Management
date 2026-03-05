import React, { useState } from 'react';
import { FIELD_META, CATEGORIES } from '../constants';

const EditEntryModal = ({ entry, fields, onClose, onUpdate }) => {
    let parsedData = {};
    try { parsedData = JSON.parse(entry.data || '{}'); } catch { parsedData = {}; }
    const [formData, setFormData] = useState(parsedData);
    const [entryDate, setEntryDate] = useState(entry.date || new Date().toISOString().split('T')[0]);

    const handleChange = (key, val) => {
        setFormData(prev => ({ ...prev, [key]: val }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate({ id: entry.id, data: formData, date: entryDate });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box glass-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>✏️ Edit Entry</h2>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {fields.map(fieldKey => {
                        const meta = FIELD_META[fieldKey] || { label: fieldKey, type: 'text' };
                        return (
                            <div className="form-group" key={fieldKey}>
                                <label>{meta.label}</label>
                                {meta.type === 'select' ? (
                                    <select value={formData[fieldKey]} onChange={e => handleChange(fieldKey, e.target.value)}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type={meta.type}
                                        value={formData[fieldKey] || ''}
                                        onChange={e => {
                                            handleChange(fieldKey, e.target.value);
                                            // Keep entryDate in sync when the date field changes
                                            if (fieldKey === 'date') setEntryDate(e.target.value);
                                        }}
                                        placeholder={meta.label}
                                    />
                                )}
                            </div>
                        );
                    })}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">Update Entry</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEntryModal;
