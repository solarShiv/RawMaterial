import React, { useState, useEffect } from 'react'
import Api from '../../auth/Api'
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  MapPinIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

const ActiveDeactivateCompany = () => {
  const [companies, setCompanies] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingCompany, setUpdatingCompany] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [actionType, setActionType] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    filterAndSortCompanies()
  }, [companies, searchTerm, statusFilter, sortConfig])

  const fetchCompanies = async () => {
    try {
      const res = await Api.get('/purchase/companies/data')
      setCompanies(res?.data?.data || [])
    } catch {
      setError('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCompanies = () => {
    let data = [...companies]

    if (searchTerm) {
      const t = searchTerm.toLowerCase()
      data = data.filter(c =>
        c.name?.toLowerCase().includes(t) ||
        c.gstNumber?.toLowerCase().includes(t) ||
        c.state?.toLowerCase().includes(t)
      )
    }

    if (statusFilter !== 'all') {
      data = data.filter(c =>
        statusFilter === 'active' ? c.isActive : !c.isActive
      )
    }

    data.sort((a, b) => {
      const aVal = a[sortConfig.key]?.toString().toLowerCase() || ''
      const bVal = b[sortConfig.key]?.toString().toLowerCase() || ''
      return sortConfig.direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    })

    setFilteredCompanies(data)
  }

  const handleSort = key => {
    setSortConfig(prev => ({
      key,
      direction: prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const updateStatus = async () => {
    try {
      setUpdatingCompany(selectedCompany.id)
      const newStatus = actionType === 'activate'
      await Api.put(`/common/update/${selectedCompany.id}/${newStatus}`)

      setCompanies(prev =>
        prev.map(c =>
          c.id === selectedCompany.id ? { ...c, isActive: newStatus } : c
        )
      )

      setSuccessMessage(`Company ${actionType}d successfully`)
    } catch {
      setError('Status update failed')
    } finally {
      setShowConfirmModal(false)
      setUpdatingCompany(null)
    }
  }

  const badge = active => (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2 ${
        active
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4">
      {/* Success / Error */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-300 p-3 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-100 border border-green-300 p-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-lg shadow mb-4">

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-full border rounded-lg p-2"
              placeholder="Search company..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border rounded-lg p-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              {['Company', 'GST', 'Location', 'Country', 'Status', 'Action'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-sm font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredCompanies.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{c.name}</td>
                <td className="px-6 py-4 font-mono">{c.gstNumber}</td>
                <td className="px-6 py-4">{c.state}</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <GlobeAltIcon className="h-4 w-4 text-green-600" /> {c.country}
                </td>
                <td className="px-6 py-4">{badge(c.isActive)}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      setSelectedCompany(c)
                      setActionType(c.isActive ? 'deactivate' : 'activate')
                      setShowConfirmModal(true)
                    }}
                    className={`px-4 py-2 rounded text-white ${
                      c.isActive ? 'bg-red-600' : 'bg-green-600'
                    }`}
                  >
                    {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-3">
              Confirm {actionType}
            </h2>
            <p className="mb-4">{selectedCompany?.name}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={updateStatus}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActiveDeactivateCompany
