export const AVAILABLE_FIELDS = [
    { key: 'date', label: '📅 Date', type: 'date', required: true },
    { key: 'amount', label: '💰 Amount', type: 'number' },
    { key: 'count', label: '🔢 Count', type: 'number' },
    { key: 'title', label: '📝 Title/Name', type: 'text' },
    { key: 'category', label: '🏷️ Category', type: 'select' },
    { key: 'vendor', label: '🏪 Vendor/Shop', type: 'text' },
    { key: 'person', label: '👤 Person Name', type: 'text' },
    { key: 'location', label: '📍 Location', type: 'text' },
    { key: 'note', label: '💬 Note', type: 'text' },
];

export const FIELD_META = {
    date: { label: 'Date', type: 'date' },
    amount: { label: 'Amount', type: 'number' },
    count: { label: 'Count', type: 'number' },
    title: { label: 'Title/Name', type: 'text' },
    category: { label: 'Category', type: 'select' },
    note: { label: 'Note', type: 'text' },
    vendor: { label: 'Vendor/Shop', type: 'text' },
    person: { label: 'Person Name', type: 'text' },
    location: { label: 'Location', type: 'text' },
};

export const FIELD_LABELS = {
    date: 'Date', amount: 'Amount', count: 'Count', title: 'Title',
    category: 'Category', note: 'Note', vendor: 'Vendor',
    person: 'Person', location: 'Location'
};

export const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Savings', 'Other'];
