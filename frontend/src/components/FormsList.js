import React from 'react';

const FormsList = ({ forms, onOpen, onDelete, onEdit, onCreate }) => {
    return (
        <div className="forms-list-page">
            <div className="page-header">
                <div>
                    <h1 className="gradient-text">My Forms</h1>
                    <p className="subtitle">Create custom trackers for anything you want to measure.</p>
                </div>
            </div>

            {forms.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <h3>No forms yet</h3>
                    <p>Create your first form to start tracking anything.</p>
                    {/* <button className="btn-primary" onClick={onCreate}>＋ &nbsp;Create New Form</button> */}
                </div>
            ) : (
                <div className="forms-grid">
                    {forms.map((form, i) => {
                        const fields = JSON.parse(form.fields || '[]');
                        return (
                            <div
                                key={form.id}
                                className="form-card glass-panel"
                                onClick={() => onOpen(form)}
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <div className="form-card-header">
                                    <h3>{form.name}</h3>
                                    <div className="form-card-actions">
                                        <button
                                            className="btn-icon-hover"
                                            onClick={e => { e.stopPropagation(); onEdit(form); }}
                                            title="Edit"
                                        >✎</button>
                                        <button
                                            className="btn-icon-delete"
                                            onClick={e => { e.stopPropagation(); onDelete(form.id); }}
                                            title="Delete"
                                        >✕</button>
                                    </div>
                                </div>
                                <div className="form-fields-preview">
                                    {fields.map(f => (
                                        <span key={f} className="field-chip">{f}</span>
                                    ))}
                                </div>
                                <p className="form-card-cta">Open to add entries →</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FormsList;
