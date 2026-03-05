import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FIELD_META } from '../constants';
import EditEntryModal from './EditEntryModal';
import CreateEntryScreen from './CreateEntryScreen';
import ConfirmModal from './ConfirmModal';

const FormView = ({ form, onBack }) => {
    let parsedFields = [];
    try { parsedFields = JSON.parse(form.fields || '[]'); } catch { parsedFields = []; }
    const fields = parsedFields;
    const [entries, setEntries] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [activeView, setActiveView] = useState('list'); // list, add
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, entryId: null });

    const fetchEntries = useCallback(async () => {
        try {
            const res = await axios.get(`/api/forms/${form.id}/entries`);
            setEntries(res.data);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load entries.');
        } finally {
            setLoading(false);
        }
    }, [form.id]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleSubmitEntry = async (formData) => {
        const date = formData.date || new Date().toISOString().split('T')[0];
        setSubmitting(true);
        try {
            const res = await axios.post(`/api/forms/${form.id}/entries`, {
                data: formData,
                date
            });
            const newEntry = { ...res.data, data: JSON.stringify(formData) };
            setEntries([newEntry, ...entries]);
            setActiveView('list');
            toast.success('Entry added!');
        } catch (e) {
            console.error('Submit entry failed:', e.response?.data || e.message);
            toast.error('Failed to add entry. Check connection.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateEntry = async (updatedEntry) => {
        try {
            const res = await axios.put(`/api/entries/${updatedEntry.id}`, {
                data: updatedEntry.data,
                date: updatedEntry.date
            });
            setEntries(entries.map(e => e.id === updatedEntry.id ? { ...res.data, data: JSON.stringify(updatedEntry.data) } : e));
            setEditingEntry(null);
            toast.success('Entry updated.');
        } catch (e) {
            console.error('Error updating entry', e);
            toast.error('Failed to update entry.');
        }
    };

    const requestDeleteEntry = (id) => {
        setConfirmModal({ isOpen: true, entryId: id });
    };

    const deleteEntry = async () => {
        const id = confirmModal.entryId;
        try {
            await axios.delete(`/api/entries/${id}`);
            setEntries(entries.filter(e => e.id !== id));
            toast.success('Entry removed.');
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete entry.');
        } finally {
            setConfirmModal({ isOpen: false, entryId: null });
        }
    };

    if (activeView === 'add') {
        return (
            <CreateEntryScreen
                form={form}
                fields={fields}
                onBack={() => setActiveView('list')}
                onSubmit={handleSubmitEntry}
                submitting={submitting}
            />
        );
    }

    return (
        <div className="form-view">
            {/* Header */}
            <div className="form-view-header">
                <div className="header-left">
                    <button className="btn-back" onClick={onBack}>← Back</button>
                    <h1>{form.name}</h1>
                </div>
                <button className="btn-primary btn-new" onClick={() => setActiveView('add')}>
                    ＋ &nbsp;Add Entry
                </button>
            </div>

            <div className="form-view-content">
                {/* Entries List */}
                <div className="entries-list card glass-panel">
                    <div className="list-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ marginBottom: 0 }}>📋 Entries ({entries.length})</h2>
                    </div>
                    {loading ? (
                        <div className="spinner" style={{ margin: '2rem auto' }}></div>
                    ) : entries.length === 0 ? (
                        <p className="empty-msg">No entries yet. Add your first one!</p>
                    ) : (
                        <div className="entries-table-wrap">
                            <table className="entries-table">
                                <thead>
                                    <tr>
                                        {fields.map(f => (
                                            <th key={f}>{FIELD_META[f]?.label || f}</th>
                                        ))}
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map(entry => {
                                        let data = {};
                                        try { data = JSON.parse(entry.data || '{}'); } catch { data = {}; }
                                        return (
                                            <tr key={entry.id}>
                                                {fields.map(f => (
                                                    <td key={f}>{data[f] ?? '-'}</td>
                                                ))}
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="btn-icon-hover"
                                                            onClick={() => setEditingEntry(entry)}
                                                            title="Edit"
                                                        >✎</button>
                                                        <button
                                                            className="btn-delete"
                                                            onClick={() => requestDeleteEntry(entry.id)}
                                                        >🗑</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {editingEntry && (
                <EditEntryModal
                    entry={editingEntry}
                    fields={fields}
                    onClose={() => setEditingEntry(null)}
                    onUpdate={handleUpdateEntry}
                />
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Delete Entry"
                message="Are you sure you want to delete this log entry? This cannot be undone."
                onConfirm={deleteEntry}
                onCancel={() => setConfirmModal({ isOpen: false, entryId: null })}
            />
        </div>
    );
};

export default FormView;
