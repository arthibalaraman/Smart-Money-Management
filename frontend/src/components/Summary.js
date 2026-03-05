import React from 'react';

const COLORS = {
    Food: '#f97316', Travel: '#06b6d4', Shopping: '#8b5cf6',
    Bills: '#ef4444', Other: '#64748b',
    Tea: '#f97316', Water: '#06b6d4', Coffee: '#92400e',
    Snacks: '#8b5cf6', Stationery: '#22c55e'
};

const Summary = ({ records, activeTab }) => {
    const isExpense = activeTab === 'EXPENSE';
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthly = records.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const total = monthly.reduce((sum, r) => sum + r.amount, 0);

    const byCategory = monthly.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + r.amount;
        return acc;
    }, {});

    return (
        <div className="summary card glass-panel">
            <h2>{isExpense ? '📊 Monthly Summary' : '📋 Monthly Registry'}</h2>
            {Object.keys(byCategory).length === 0 ? (
                <p className="empty-msg">No entries this month.</p>
            ) : (
                Object.entries(byCategory).map(([cat, val]) => {
                    const pct = total > 0 ? (val / total) * 100 : 0;
                    const color = COLORS[cat] || '#6366f1';
                    return (
                        <div key={cat} className="summary-item">
                            <div className="summary-label">
                                <span>{cat}</span>
                                <span>{isExpense ? `₹${val.toFixed(2)}` : `${val} pcs`}</span>
                            </div>
                            <div className="bar-bg">
                                <div
                                    className="bar-fill"
                                    style={{ width: `${pct}%`, background: color }}
                                />
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default Summary;
