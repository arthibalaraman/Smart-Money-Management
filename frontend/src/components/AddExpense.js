import React, { useState } from 'react';

const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Other'];
const REGISTRY_CATEGORIES = ['Tea', 'Water', 'Coffee', 'Snacks', 'Stationery', 'Other'];

const AddExpense = ({ onAddExpense, activeTab }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(activeTab === 'EXPENSE' ? 'Food' : 'Tea');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const isExpense = activeTab === 'EXPENSE';
    const categories = isExpense ? EXPENSE_CATEGORIES : REGISTRY_CATEGORIES;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !amount || !date) {
            alert('Please fill all fields');
            return;
        }
        onAddExpense({
            title,
            amount: parseFloat(amount),
            category,
            date,
            type: activeTab,
            unit: isExpense ? '₹' : 'pcs'
        });
        setTitle('');
        setAmount('');
        setCategory(isExpense ? 'Food' : 'Tea');
    };

    return (
        <div className="add-expense card glass-panel">
            <h2>{isExpense ? '💰 Add Expense' : '📋 Add Registry Entry'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>{isExpense ? 'Title' : 'Item Name'}</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={isExpense ? 'What did you spend on?' : 'e.g. Tea, Water, Coffee'}
                    />
                </div>
                <div className="form-group">
                    <label>{isExpense ? 'Amount (₹)' : 'Count'}</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={isExpense ? '0.00' : 'e.g. 5'}
                        min="0"
                    />
                </div>
                <div className="form-group">
                    <label>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn-primary">
                    {isExpense ? '+ Add Expense' : '+ Add Entry'}
                </button>
            </form>
        </div>
    );
};

export default AddExpense;
