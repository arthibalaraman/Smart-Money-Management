import React from 'react';

const ExpenseList = ({ expenses, onDeleteExpense, activeTab }) => {
    const isExpense = activeTab === 'EXPENSE';

    return (
        <div className="expense-list card glass-panel">
            <h2>{isExpense ? '💳 Transactions' : '📋 Registry Entries'}</h2>
            {expenses.length === 0 ? (
                <p className="empty-msg">
                    {isExpense ? 'No expenses yet. Add one!' : 'No entries yet. Add one!'}
                </p>
            ) : (
                <ul>
                    {expenses.map(exp => (
                        <li key={exp.id} className="expense-item">
                            <div className="expense-info">
                                <span className="expense-title">{exp.title}</span>
                                <span className={`badge badge-${exp.category.toLowerCase()}`}>{exp.category}</span>
                                <span className="expense-date">{exp.date}</span>
                            </div>
                            <div className="expense-right">
                                <span className="expense-amount">
                                    {isExpense ? `₹${exp.amount.toFixed(2)}` : `${exp.amount} pcs`}
                                </span>
                                <button
                                    className="btn-delete"
                                    onClick={() => onDeleteExpense(exp.id)}
                                    title="Delete"
                                >
                                    🗑
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ExpenseList;
