import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FIELD_LABELS = {
    date: 'Date', amount: 'Amount', count: 'Count', title: 'Title',
    category: 'Category', note: 'Note', vendor: 'Vendor',
    person: 'Person', location: 'Location'
};

const ReportsPage = ({ forms }) => {
    const [selectedForm, setSelectedForm] = useState(forms[0] || null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    // Years dropdown: last 5 years
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        if (selectedForm) fetchEntries(selectedForm.id);
    }, [selectedForm, selectedMonth, selectedYear]);

    const fetchEntries = async (formId) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/forms/${formId}/entries`);
            setEntries(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    let formFields = [];
    try { formFields = selectedForm ? JSON.parse(selectedForm.fields || '[]') : []; } catch { formFields = []; }

    // Filter entries for selected month/year
    const filteredEntries = entries.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    // Compute totals for numeric fields
    const totals = {};
    formFields.forEach(f => {
        if (f === 'amount' || f === 'count') {
            totals[f] = filteredEntries.reduce((sum, e) => {
                try {
                    const data = JSON.parse(e.data || '{}');
                    return sum + (parseFloat(data[f]) || 0);
                } catch { return sum; }
            }, 0);
        }
    });

    // Monthly breakdown (all months for chart)
    const monthlyTotals = Array.from({ length: 12 }, (_, m) => {
        const monthEntries = entries.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === m && d.getFullYear() === selectedYear;
        });
        const numericField = formFields.find(f => f === 'amount' || f === 'count');
        const val = numericField
            ? monthEntries.reduce((sum, e) => {
                try {
                    const data = JSON.parse(e.data || '{}');
                    return sum + (parseFloat(data[numericField]) || 0);
                } catch { return sum; }
            }, 0)
            : monthEntries.length;
        return { month: MONTHS[m], val, count: monthEntries.length };
    });

    const maxVal = Math.max(...monthlyTotals.map(m => m.val), 1);

    // Download CSV
    const downloadCSV = () => {
        const headers = [...formFields.map(f => FIELD_LABELS[f] || f)];
        const rows = filteredEntries.map(e => {
            let data = {};
            try { data = JSON.parse(e.data || '{}'); } catch { data = {}; }
            return formFields.map(f => data[f] ?? '');
        });
        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedForm.name}_${MONTHS[selectedMonth]}_${selectedYear}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Download PDF
    const downloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(11, 4, 50);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(192, 132, 252);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Smart Tracker Report', 14, 18);
        doc.setFontSize(11);
        doc.setTextColor(148, 163, 184);
        doc.text(`Form: ${selectedForm.name}`, 14, 28);
        doc.text(`Period: ${MONTHS[selectedMonth]} ${selectedYear}`, 14, 36);

        // Summary cards
        let y = 52;
        doc.setTextColor(30, 30, 60);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 80);
        doc.text('Summary', 14, y);
        y += 6;

        const summaryData = [
            ['Total Entries', filteredEntries.length.toString()],
            ...Object.entries(totals).map(([k, v]) => [
                FIELD_LABELS[k] || k,
                k === 'amount' ? `₹${v.toFixed(2)}` : v.toString()
            ])
        ];

        autoTable(doc, {
            startY: y,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 243, 255] },
            styles: { fontSize: 11, cellPadding: 6 },
            margin: { left: 14, right: 14 },
            tableWidth: 100,
        });

        // Entries table
        y = doc.lastAutoTable.finalY + 14;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 80);
        doc.text(`Entries — ${MONTHS[selectedMonth]} ${selectedYear}`, 14, y);

        const tableHeaders = formFields.map(f => FIELD_LABELS[f] || f);
        const tableRows = filteredEntries.map(e => {
            let data = {};
            try { data = JSON.parse(e.data || '{}'); } catch { data = {}; }
            return formFields.map(f => data[f] ?? '-');
        });

        autoTable(doc, {
            startY: y + 5,
            head: [tableHeaders],
            body: tableRows.length > 0 ? tableRows : [['No entries for this period.']],
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 243, 255] },
            styles: { fontSize: 10, cellPadding: 5 },
            margin: { left: 14, right: 14 },
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(
                `Generated by Smart Tracker | Page ${i} of ${pageCount}`,
                pageWidth / 2, doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        doc.save(`${selectedForm.name}_${MONTHS[selectedMonth]}_${selectedYear}_Report.pdf`);
    };

    if (forms.length === 0) {
        return (
            <div className="reports-empty">
                <div className="empty-icon">📊</div>
                <h3>No forms yet</h3>
                <p>Create a form first to generate reports.</p>
            </div>
        );
    }

    return (
        <div className="reports-page">
            {/* Page Header */}
            <div className="reports-header">
                <div>
                    <h1 className="gradient-text">📊 Monthly Reports</h1>
                    <p className="subtitle">Track totals and download your records.</p>
                </div>
                <div className="download-btns">
                    <button className="btn-download csv" onClick={downloadCSV}>⬇ Download CSV</button>
                    <button className="btn-download pdf" onClick={downloadPDF}>📄 Download PDF</button>
                </div>
            </div>

            {/* Filters */}
            <div className="report-filters glass-panel">
                <div className="filter-group">
                    <label>Form</label>
                    <select
                        value={selectedForm?.id || ''}
                        onChange={e => setSelectedForm(forms.find(f => f.id === parseInt(e.target.value)))}
                    >
                        {forms.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Month</label>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Year</label>
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="report-summary-cards">
                <div className="report-stat-card purple">
                    <div className="rsc-icon">📋</div>
                    <div>
                        <p className="rsc-label">Total Entries</p>
                        <p className="rsc-value">{filteredEntries.length}</p>
                    </div>
                </div>
                {Object.entries(totals).map(([k, v]) => (
                    <div key={k} className={`report-stat-card ${k === 'amount' ? 'green' : 'blue'}`}>
                        <div className="rsc-icon">{k === 'amount' ? '💰' : '🔢'}</div>
                        <div>
                            <p className="rsc-label">Total {FIELD_LABELS[k]}</p>
                            <p className="rsc-value">{k === 'amount' ? `₹${v.toFixed(2)}` : v}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bar Chart — Full Year */}
            <div className="chart-card glass-panel">
                <div className="chart-card-header">
                    <h3>📈 &nbsp;{selectedYear} — Monthly Overview</h3>
                    <span className="chart-hint">Click a bar to select that month</span>
                </div>
                <div className="bar-chart">
                    {monthlyTotals.map(({ month, val, count }) => {
                        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                        const isActive = MONTHS.indexOf(month) === selectedMonth;
                        return (
                            <div
                                key={month}
                                className={`bar-col ${isActive ? 'active-col' : ''}`}
                                onClick={() => setSelectedMonth(MONTHS.indexOf(month))}
                                title={`${month}: ${val} (${count} entries)`}
                            >
                                <div className="bar-val">{val > 0 ? val : ''}</div>
                                <div className="bar-wrap">
                                    <div className="bar-fill-chart" style={{ height: `${Math.max(pct, val > 0 ? 8 : 0)}%` }}></div>
                                </div>
                                <div className="bar-month">{month}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Entries Table */}
            <div className="entries-card glass-panel">
                <div className="entries-card-header">
                    <h3>🗂 Entries — {MONTHS[selectedMonth]} {selectedYear}</h3>
                    <span className="entry-count-badge">{filteredEntries.length} records</span>
                </div>
                {loading ? (
                    <div className="spinner" style={{ margin: '2rem auto' }}></div>
                ) : filteredEntries.length === 0 ? (
                    <p className="empty-msg">No entries for this period.</p>
                ) : (
                    <div className="entries-table-wrap">
                        <table className="entries-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    {formFields.map(f => <th key={f}>{FIELD_LABELS[f] || f}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((entry, idx) => {
                                    let data = {};
                                    try { data = JSON.parse(entry.data || '{}'); } catch { data = {}; }
                                    return (
                                        <tr key={entry.id}>
                                            <td className="row-num">{idx + 1}</td>
                                            {formFields.map(f => (
                                                <td key={f}>
                                                    {f === 'amount' ? `₹${parseFloat(data[f] || 0).toFixed(2)}`
                                                        : data[f] ?? '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {/* Totals row */}
                            {Object.keys(totals).length > 0 && (
                                <tfoot>
                                    <tr className="totals-row">
                                        <td><strong>Total</strong></td>
                                        {formFields.map(f => (
                                            <td key={f}>
                                                {totals[f] !== undefined
                                                    ? <strong>{f === 'amount' ? `₹${totals[f].toFixed(2)}` : totals[f]}</strong>
                                                    : ''}
                                            </td>
                                        ))}
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
