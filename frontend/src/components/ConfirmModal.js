import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel", type = "danger" }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel confirm-modal">
                <div className="modal-header">
                    <h2 className={`gradient-text ${type === 'danger' ? 'danger' : ''}`}>{title}</h2>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`btn-primary ${type === 'danger' ? 'btn-danger' : ''}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
