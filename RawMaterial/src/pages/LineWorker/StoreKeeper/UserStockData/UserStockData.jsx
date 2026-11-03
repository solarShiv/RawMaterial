import React, { useState, useEffect, useRef } from 'react';
import Api from '../../../../auth/Api';
import { getInitials } from '../../../../components/SidebarMenu/menuConfig';
import {
  Search,
  Users,
  Package,
  Send,
  ClipboardList,
  AlertCircle,
  UserRound,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const EMPTY_STOCK = {
  balanceSummary: [],
  directItemsIssued: [],
  itemsRequested: []
};

const TABS = [
  { key: 'currentStock', label: 'Current stock', icon: Package, dataKey: 'balanceSummary' },
  { key: 'directIssued', label: 'Direct issued', icon: Send, dataKey: 'directItemsIssued' },
  { key: 'requests', label: 'Item requests', icon: ClipboardList, dataKey: 'itemsRequested' },
];

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

const getRequestStatusClass = (status) => {
  switch (status) {
    case 'APPROVED':
      return 'badge-green';
    case 'PENDING':
      return 'badge-yellow';
    default:
      return 'badge-red';
  }
};

const toText = (value) => (value == null ? '' : String(value)).toLowerCase();

const itemsMatch = (items, term) =>
  (items || []).some((item) => toText(item.rawMaterialName).includes(term));

// Compact list of "item · qty unit" chips used by the issue and request tables
const ItemChips = ({ items }) => (
  <div className="flex flex-wrap gap-1.5">
    {(items || []).map((item, idx) => (
      <span
        key={idx}
        className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-ink-50 px-2 py-1 text-xs"
      >
        <span className="font-medium text-ink-900">{item.rawMaterialName}</span>
        <span className="font-bold tabular-nums text-ink-950">
          {item.quantity} {item.unit}
        </span>
      </span>
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, title, text }) => (
  <div className="py-16 text-center">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
      <Icon className="h-6 w-6" />
    </div>
    <p className="font-semibold text-ink-800">{title}</p>
    {text && <p className="text-sm text-ink-500">{text}</p>}
  </div>
);

const UserStockData = () => {
  const [lineWorkers, setLineWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [stockData, setStockData] = useState(EMPTY_STOCK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableLoading, setTableLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('currentStock');
  const [workerSearch, setWorkerSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');

  // Ignore responses for a worker that is no longer selected
  const latestRequest = useRef(null);

  const fetchLineWorkers = async () => {
    try {
      setLoading(true);
      const response = await Api.get(`/store-keeper/getLineWorkerList`);
      if (response.data.success) {
        setLineWorkers(response.data.data || []);
      }
    } catch (err) {
      setError('Error fetching line workers');
      console.error('Error fetching line workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStock = async (empId) => {
    latestRequest.current = empId;
    if (!empId) {
      setStockData(EMPTY_STOCK);
      return;
    }

    try {
      setTableLoading(true);
      setError('');
      const response = await Api.get(`/store-keeper/getUserItemStock?empId=${empId}`);
      if (latestRequest.current !== empId) return;

      if (response.data.success) {
        setStockData({ ...EMPTY_STOCK, ...(response.data.data || {}) });
      } else {
        setStockData(EMPTY_STOCK);
        setError('Failed to fetch stock data');
      }
    } catch (err) {
      if (latestRequest.current !== empId) return;
      setError('Error fetching stock data');
      setStockData(EMPTY_STOCK);
      console.error('Error fetching stock data:', err);
    } finally {
      if (latestRequest.current === empId) setTableLoading(false);
    }
  };

  const handleWorkerSelect = (workerId) => {
    if (workerId === selectedWorker) return;
    setSelectedWorker(workerId);
    setActiveTab('currentStock'); // Reset to default tab
    setTableSearch('');
    fetchUserStock(workerId);
  };

  useEffect(() => {
    fetchLineWorkers();
  }, []);

  const selected = lineWorkers.find((worker) => worker.id === selectedWorker);

  const workerTerm = workerSearch.trim().toLowerCase();
  const visibleWorkers = workerTerm
    ? lineWorkers.filter(
        (w) => toText(w.name).includes(workerTerm) || toText(w.role?.name).includes(workerTerm)
      )
    : lineWorkers;

  const term = tableSearch.trim().toLowerCase();
  const currentStock = term
    ? stockData.balanceSummary.filter(
        (item) => toText(item.rawMaterialName).includes(term) || toText(item.unit).includes(term)
      )
    : stockData.balanceSummary;
  const directIssued = term
    ? stockData.directItemsIssued.filter(
        (issue) =>
          itemsMatch(issue.items, term) ||
          toText(issue.issuedBy).includes(term) ||
          toText(issue.remarks).includes(term)
      )
    : stockData.directItemsIssued;
  const requests = term
    ? stockData.itemsRequested.filter(
        (request) =>
          itemsMatch(request.items, term) ||
          toText(request.status).includes(term) ||
          toText(request.approvedBy).includes(term)
      )
    : stockData.itemsRequested;

  const renderCurrentStockTable = () =>
    currentStock.length === 0 ? (
      <EmptyState
        icon={Package}
        title={term ? 'No matching items' : 'No stock in hand'}
        text={term ? 'Try a different search.' : 'This worker has no current stock balance.'}
      />
    ) : (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="w-12">#</th>
              <th>Item</th>
              <th className="!text-right">Quantity</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {currentStock.map((item, index) => (
              <tr key={item.rawMaterialId || index}>
                <td className="text-xs tabular-nums text-ink-400">{index + 1}</td>
                <td className="font-semibold text-ink-950">{item.rawMaterialName || 'N/A'}</td>
                <td className="text-right text-base font-bold tabular-nums text-green-700">
                  {item.quantity || 0}
                </td>
                <td className="text-ink-700">{item.unit || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  const renderDirectIssuedTable = () =>
    directIssued.length === 0 ? (
      <EmptyState
        icon={Send}
        title={term ? 'No matching issues' : 'No direct issues'}
        text={term ? 'Try a different search.' : 'No items have been issued directly to this worker.'}
      />
    ) : (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="w-44">Issued on</th>
              <th>Items</th>
              <th>Issued by</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {directIssued.map((issue, index) => (
              <tr key={issue.id || index}>
                <td className="whitespace-nowrap font-medium text-ink-900">{formatDate(issue.issuedDate)}</td>
                <td className="min-w-[260px]">
                  <ItemChips items={issue.items} />
                </td>
                <td className="whitespace-nowrap font-medium text-ink-900">{issue.issuedBy || 'N/A'}</td>
                <td className="min-w-[160px] max-w-[280px] break-words text-ink-700">
                  {issue.remarks || <span className="text-ink-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  const renderRequestedItemsTable = () =>
    requests.length === 0 ? (
      <EmptyState
        icon={ClipboardList}
        title={term ? 'No matching requests' : 'No item requests'}
        text={term ? 'Try a different search.' : 'This worker has not requested any items.'}
      />
    ) : (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="w-44">Requested on</th>
              <th>Items</th>
              <th>Status</th>
              <th>Approved by</th>
              <th>Material given</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request, index) => (
              <tr key={request.id || index}>
                <td className="whitespace-nowrap font-medium text-ink-900">{formatDate(request.requestedDate)}</td>
                <td className="min-w-[260px]">
                  <ItemChips items={request.items} />
                </td>
                <td>
                  <span className={`whitespace-nowrap ${getRequestStatusClass(request.status)}`}>
                    {request.status || 'N/A'}
                  </span>
                </td>
                <td className="whitespace-nowrap font-medium text-ink-900">{request.approvedBy || 'N/A'}</td>
                <td>
                  {request.materialGiven ? (
                    <span className="badge-green">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="badge-gray">
                      <XCircle className="h-3.5 w-3.5" /> No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto grid max-w-[1600px] gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        {/* Worker list */}
        <aside className="card overflow-hidden lg:sticky lg:top-4">
          <div className="border-b border-ink-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink-950">Line workers</h2>
              <span className="badge-gray tabular-nums">{lineWorkers.length}</span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                placeholder="Search name or role…"
                className="input pl-9"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-2 lg:max-h-[calc(100vh-14rem)]">
            {loading ? (
              <div className="space-y-2 p-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-ink-100" />
                ))}
              </div>
            ) : visibleWorkers.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-500">
                {lineWorkers.length === 0 ? 'No line workers found' : 'No matching workers'}
              </p>
            ) : (
              <ul className="space-y-1">
                {visibleWorkers.map((worker) => {
                  const active = worker.id === selectedWorker;
                  return (
                    <li key={worker.id}>
                      <button
                        type="button"
                        onClick={() => handleWorkerSelect(worker.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                          active ? 'bg-ink-950 text-white' : 'hover:bg-brand-50'
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            active ? 'bg-brand-400 text-ink-950' : 'bg-ink-200 text-ink-800'
                          }`}
                        >
                          {getInitials(worker.name)}
                        </span>
                        <span className="min-w-0">
                          <span className={`block truncate text-sm font-semibold ${active ? 'text-white' : 'text-ink-950'}`}>
                            {worker.name}
                          </span>
                          <span className={`block truncate text-xs ${active ? 'text-brand-400' : 'text-ink-500'}`}>
                            {worker.role?.name || '—'}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Details */}
        <section className="min-w-0 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {!selectedWorker ? (
            <div className="card">
              <EmptyState
                icon={Users}
                title="Select a line worker"
                text="Pick a worker from the list to see their stock, direct issues and item requests."
              />
            </div>
          ) : (
            <>
              {/* Worker header + summary tiles (also act as tabs) */}
              <div className="card p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-950 text-base font-bold text-brand-400">
                    {selected ? getInitials(selected.name) : <UserRound className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-ink-950">{selected?.name || 'N/A'}</h2>
                    <p className="text-sm font-medium text-ink-600">{selected?.role?.name || '—'}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.key);
                          setTableSearch('');
                        }}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition ${
                          active
                            ? 'border-ink-950 bg-ink-950 text-white'
                            : 'border-ink-300 bg-white hover:border-ink-400'
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-wider ${active ? 'text-brand-400' : 'text-ink-600'}`}>
                            {tab.label}
                          </p>
                          <p className={`mt-0.5 text-2xl font-bold tabular-nums ${active ? 'text-white' : 'text-ink-950'}`}>
                            {tableLoading ? '–' : stockData[tab.dataKey].length}
                          </p>
                        </div>
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            active ? 'bg-brand-400 text-ink-950' : 'bg-ink-100 text-ink-700'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab content */}
              <div className="card overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-ink-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-bold text-ink-950">
                    {TABS.find((t) => t.key === activeTab)?.label}
                  </h3>
                  <div className="relative sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder={activeTab === 'currentStock' ? 'Search items…' : 'Search items, people, remarks…'}
                      className="input pl-9"
                    />
                  </div>
                </div>

                {tableLoading ? (
                  <div className="flex items-center justify-center gap-3 py-16 text-sm text-ink-500">
                    <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-ink-200 border-t-brand-400" />
                    Loading stock data…
                  </div>
                ) : (
                  <>
                    {activeTab === 'currentStock' && renderCurrentStockTable()}
                    {activeTab === 'directIssued' && renderDirectIssuedTable()}
                    {activeTab === 'requests' && renderRequestedItemsTable()}
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserStockData;
