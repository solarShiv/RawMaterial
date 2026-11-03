import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Package,
  Users,
  UserCheck,
  Boxes,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Api from '../../../../auth/Api';
import { getInitials } from '../../../../components/SidebarMenu/menuConfig';

const EMPTY_FILTERS = {
  issuedTo: '',
  issuedBy: '',
  startDate: '',
  endDate: ''
};

const MAX_VISIBLE_ITEMS = 3;

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTimeAgo = (dateString) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (Number.isNaN(diffMs)) return '';
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return '';
};

// yyyy-mm-dd in local time, for <input type="date">
const toInputDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const DATE_PRESETS = [
  { key: 'today', label: 'Today', days: 0 },
  { key: '7d', label: 'Last 7 days', days: 6 },
  { key: '30d', label: 'Last 30 days', days: 29 },
];

const getPresetRange = (days) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
};

const ItemChips = ({ items, expanded, onToggle }) => {
  const list = items || [];
  const visible = expanded ? list : list.slice(0, MAX_VISIBLE_ITEMS);
  const hidden = list.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((item, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-ink-50 px-2 py-1 text-xs"
        >
          <span className="font-medium text-ink-900">{item.rawMaterialName}</span>
          <span className="font-bold tabular-nums text-green-700">
            {item.quantity} {item.unit}
          </span>
        </span>
      ))}
      {(hidden > 0 || (expanded && list.length > MAX_VISIBLE_ITEMS)) && (
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md px-2 py-1 text-xs font-semibold text-ink-700 underline-offset-2 hover:bg-brand-100 hover:underline"
        >
          {hidden > 0 ? `+${hidden} more` : 'Show less'}
        </button>
      )}
    </div>
  );
};

const DirectItemIssueHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const fetchDirectIssueHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await Api.get('/store-keeper/directItemIssue/history');

      if (response.data.success) {
        setTransactions(response.data.data || []);
      } else {
        setError('Failed to fetch transaction history');
        setTransactions([]);
      }
    } catch (err) {
      setError('Error fetching transaction history');
      console.error('Error fetching direct issue history:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectIssueHistory();
  }, []);

  // Unique users for filter dropdowns
  const uniqueUsers = useMemo(() => {
    const issuedToSet = new Set();
    const issuedBySet = new Set();
    transactions.forEach((transaction) => {
      if (transaction.issuedToName) issuedToSet.add(transaction.issuedToName);
      if (transaction.issuedByName) issuedBySet.add(transaction.issuedByName);
    });
    return {
      issuedTo: Array.from(issuedToSet).sort(),
      issuedBy: Array.from(issuedBySet).sort()
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const startDate = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
    const endDate = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999`) : null;

    return transactions
      .filter((transaction) => {
        if (term) {
          const matches =
            transaction.issuedToName?.toLowerCase().includes(term) ||
            transaction.issuedByName?.toLowerCase().includes(term) ||
            transaction.remarks?.toLowerCase().includes(term) ||
            (transaction.rawMaterialIssued || []).some((item) =>
              item.rawMaterialName?.toLowerCase().includes(term)
            );
          if (!matches) return false;
        }
        if (filters.issuedTo && transaction.issuedToName !== filters.issuedTo) return false;
        if (filters.issuedBy && transaction.issuedByName !== filters.issuedBy) return false;

        const issuedAt = new Date(transaction.issuedAt);
        if (startDate && issuedAt < startDate) return false;
        if (endDate && issuedAt > endDate) return false;
        return true;
      })
      .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
  }, [transactions, searchTerm, filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setExpandedRows(new Set());
  }, [searchTerm, filters, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const pageStart = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredTransactions.slice(pageStart, pageStart + itemsPerPage);

  const stats = useMemo(() => {
    const recipients = new Set();
    const issuers = new Set();
    let lines = 0;
    filteredTransactions.forEach((t) => {
      if (t.issuedToName) recipients.add(t.issuedToName);
      if (t.issuedByName) issuers.add(t.issuedByName);
      lines += (t.rawMaterialIssued || []).length;
    });
    return { recipients: recipients.size, issuers: issuers.size, lines };
  }, [filteredTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters(EMPTY_FILTERS);
  };

  const hasFilters = searchTerm || Object.values(filters).some(Boolean);

  const activePreset = DATE_PRESETS.find((p) => {
    const range = getPresetRange(p.days);
    return filters.startDate === range.startDate && filters.endDate === range.endDate;
  })?.key;

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
    const pages = [];
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const statCards = [
    { label: 'Transactions', value: filteredTransactions.length, icon: Package, tone: 'bg-ink-950 text-brand-400' },
    { label: 'Recipients', value: stats.recipients, icon: Users, tone: 'bg-brand-300 text-ink-950' },
    { label: 'Issuers', value: stats.issuers, icon: UserCheck, tone: 'bg-ink-200 text-ink-800' },
    { label: 'Item lines issued', value: stats.lines, icon: Boxes, tone: 'bg-green-200 text-green-900' },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-wider text-ink-600">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-ink-950">{loading ? '–' : card.value}</p>
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))_auto] lg:items-end">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="label">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  placeholder="Item, person or remarks…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </div>
            <div>
              <label className="label">Issued to</label>
              <select
                value={filters.issuedTo}
                onChange={(e) => handleFilterChange('issuedTo', e.target.value)}
                className="input"
              >
                <option value="">All recipients</option>
                {uniqueUsers.issuedTo.map((user) => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Issued by</label>
              <select
                value={filters.issuedBy}
                onChange={(e) => handleFilterChange('issuedBy', e.target.value)}
                className="input"
              >
                <option value="">All issuers</option>
                {uniqueUsers.issuedBy.map((user) => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">From</label>
              <input
                type="date"
                value={filters.startDate}
                max={filters.endDate || undefined}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">To</label>
              <input
                type="date"
                value={filters.endDate}
                min={filters.startDate || undefined}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input"
              />
            </div>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="btn-outline">
                <X className="h-4 w-4" /> Clear
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, ...getPresetRange(preset.days) }))}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activePreset === preset.key
                    ? 'bg-ink-950 text-brand-400'
                    : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-ink-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-950">Direct issue transactions</h2>
              <p className="text-xs text-ink-500">
                {filteredTransactions.length === 0
                  ? 'No results'
                  : `Showing ${pageStart + 1}–${Math.min(pageStart + itemsPerPage, filteredTransactions.length)} of ${filteredTransactions.length}`}
                {hasFilters && transactions.length > 0 && ` (filtered from ${transactions.length})`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-ink-500">
                Rows
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="input h-8 w-20 py-0 text-xs"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={fetchDirectIssueHistory}
                disabled={loading}
                aria-label="Refresh"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-300 text-ink-700 hover:bg-ink-100 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-ink-500">
              <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-ink-200 border-t-brand-400" />
              Loading transactions…
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="font-semibold text-ink-900">{error}</p>
              <button type="button" onClick={fetchDirectIssueHistory} className="btn-outline mt-4">
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
                <Package className="h-6 w-6" />
              </div>
              <p className="font-semibold text-ink-800">No transactions found</p>
              <p className="text-sm text-ink-500">
                {hasFilters ? 'Try adjusting your search or filters.' : 'No direct item issues have been recorded yet.'}
              </p>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="btn-outline mt-4">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-48">Date &amp; time</th>
                      <th>Issued to</th>
                      <th>Issued by</th>
                      <th>Items issued</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="whitespace-nowrap">
                          <div className="font-semibold text-ink-950">{formatDate(transaction.issuedAt)}</div>
                          <div className="text-xs text-ink-500">{formatTimeAgo(transaction.issuedAt)}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-300 text-[11px] font-bold text-ink-950">
                              {getInitials(transaction.issuedToName || '?')}
                            </span>
                            <span className="whitespace-nowrap font-semibold text-ink-950">
                              {transaction.issuedToName || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap font-medium text-ink-800">{transaction.issuedByName || 'N/A'}</td>
                        <td className="min-w-[280px]">
                          <ItemChips
                            items={transaction.rawMaterialIssued}
                            expanded={expandedRows.has(transaction.id)}
                            onToggle={() => toggleRow(transaction.id)}
                          />
                        </td>
                        <td className="min-w-[160px] max-w-[260px] break-words text-ink-700">
                          {transaction.remarks || <span className="text-ink-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablet cards */}
              <div className="grid gap-3 p-3 md:grid-cols-2 lg:hidden">
                {currentItems.map((transaction) => (
                  <div key={transaction.id} className="rounded-xl border border-ink-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-ink-950">{formatDate(transaction.issuedAt)}</div>
                        <div className="text-xs text-ink-500">{formatTimeAgo(transaction.issuedAt)}</div>
                      </div>
                      <span className="badge-gray shrink-0 tabular-nums">
                        {(transaction.rawMaterialIssued || []).length} item(s)
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="truncate font-medium text-ink-700">{transaction.issuedByName || 'N/A'}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-400" />
                      <span className="truncate font-bold text-ink-950">{transaction.issuedToName || 'N/A'}</span>
                    </div>

                    <div className="mt-3">
                      <ItemChips
                        items={transaction.rawMaterialIssued}
                        expanded={expandedRows.has(transaction.id)}
                        onToggle={() => toggleRow(transaction.id)}
                      />
                    </div>

                    {transaction.remarks && (
                      <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-700">{transaction.remarks}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-200 px-4 py-3 sm:flex-row">
                <span className="text-xs text-ink-500">
                  Page <span className="font-semibold text-ink-900">{currentPage}</span> of{' '}
                  <span className="font-semibold text-ink-900">{totalPages}</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="flex h-8 items-center gap-1 rounded-md border border-ink-200 px-2 text-xs font-semibold text-ink-700 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Prev</span>
                  </button>
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-current={currentPage === page ? 'page' : undefined}
                      className={`h-8 min-w-8 rounded-md px-2.5 text-xs font-semibold ${
                        currentPage === page
                          ? 'bg-ink-950 text-brand-400'
                          : 'border border-ink-200 text-ink-700 hover:bg-ink-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="flex h-8 items-center gap-1 rounded-md border border-ink-200 px-2 text-xs font-semibold text-ink-700 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectItemIssueHistory;
