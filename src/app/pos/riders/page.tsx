'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { POSHamburgerMenu } from '@/components/pos-hamburger-menu'
import { PosRider } from '@/lib/db/schema'

export default function POSRidersPage() {
  const [riders, setRiders] = useState<PosRider[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRider, setEditingRider] = useState<PosRider | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    isActive: true
  })
  const router = useRouter()

  // Check authentication (only on client side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      
      if (!token || role !== 'pos') {
        router.push('/login');
        return;
      }

      // Load riders
      fetchRiders()
    }
  }, [router])

  const fetchRiders = async () => {
    try {
      const response = await fetch('/api/pos/riders')
      const data = await response.json()
      if (Array.isArray(data)) {
        setRiders(data)
      }
    } catch (error) {
      console.error('Error fetching riders:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingRider(null)
    setFormData({
      name: '',
      phoneNumber: '',
      isActive: true
    })
    setShowModal(true)
  }

  const openEditModal = (rider: PosRider) => {
    setEditingRider(rider)
    setFormData({
      name: rider.name,
      phoneNumber: rider.phoneNumber || '',
      isActive: rider.isActive
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingRider 
        ? `/api/pos/riders/${editingRider.id}`
        : '/api/pos/riders'
      
      const method = editingRider ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchRiders()
        setShowModal(false)
        alert(editingRider ? 'Rider updated successfully!' : 'Rider added successfully!')
      } else {
        throw new Error('Failed to save rider')
      }
    } catch (error) {
      console.error('Error saving rider:', error)
      alert('Failed to save rider. Please try again.')
    }
  }

  const toggleRiderStatus = async (rider: PosRider) => {
    try {
      const response = await fetch(`/api/pos/riders/${rider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rider.name,
          phoneNumber: rider.phoneNumber,
          isActive: !rider.isActive
        })
      })

      if (response.ok) {
        await fetchRiders()
      }
    } catch (error) {
      console.error('Error updating rider status:', error)
      alert('Failed to update rider status.')
    }
  }

  const deleteRider = async (riderId: number) => {
    if (!confirm('Are you sure you want to delete this rider?')) {
      return
    }

    try {
      const response = await fetch(`/api/pos/riders/${riderId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchRiders()
        alert('Rider deleted successfully!')
      } else {
        throw new Error('Failed to delete rider')
      }
    } catch (error) {
      console.error('Error deleting rider:', error)
      alert('Failed to delete rider. Please try again.')
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userName')
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading Riders...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 lg:py-0 lg:h-16">
            <div className="flex items-center space-x-3 mb-4 lg:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🚚</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Riders Management
              </h1>
            </div>
            {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 lg:items-center">
              <button
                onClick={openAddModal}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-md transition-all duration-200 transform hover:scale-105 text-center"
              >
                ➕ Add Rider
              </button>
              <Link 
                href="/pos" 
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 shadow-md transition-all duration-200 transform hover:scale-105 text-center"
              >
                ← Back to POS
              </Link>
              <POSHamburgerMenu onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Riders</h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              {riders.length}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Riders</h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              {riders.filter(r => r.isActive).length}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Inactive Riders</h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">
              {riders.filter(r => !r.isActive).length}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">With Phone</h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {riders.filter(r => r.phoneNumber).length}
            </p>
          </div>
        </div>

        {/* Riders Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              All Riders ({riders.length})
            </h2>
          </div>

          {riders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No riders found. Add your first rider to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {riders.map((rider) => (
                    <tr key={rider.id} className={!rider.isActive ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{rider.name}</div>
                        <div className="text-sm text-gray-500">
                          ID: {rider.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {rider.phoneNumber || 'N/A'}
                        </div>
                        {rider.phoneNumber && (
                          <a
                            href={`tel:${rider.phoneNumber}`}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            📞 Call
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRiderStatus(rider)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            rider.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rider.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(rider.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(rider.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(rider)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteRider(rider.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Rider Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingRider ? 'Edit Rider' : 'Add New Rider'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rider Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Ahmed Ali"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 03001234567"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active (available for deliveries)
                  </label>
                </div>
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                >
                  {editingRider ? 'Update' : 'Add'} Rider
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

