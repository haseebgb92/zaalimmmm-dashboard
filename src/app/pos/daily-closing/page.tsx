'use client'

import { useState, useEffect, useCallback } from 'react'
import { POSHeader } from '@/components/pos-header'

interface DailyClosingData {
  id?: number
  date: string
  agentId: number
  agentName: string
  totalCashOrders: number
  totalCardOrders: number
  totalJazzcashOrders: number
  totalEasypaisaOrders: number
  totalCreditOrders: number
  cashReceived: number
  currencyNotes5000: number
  currencyNotes1000: number
  currencyNotes500: number
  currencyNotes100: number
  currencyNotes50: number
  currencyNotes20: number
  currencyNotes10: number
  calculatedCashTotal: number
  cashDifference: number
  status: string
  notes?: string
}

export default function DailyClosingPage() {
  const [closingData, setClosingData] = useState<DailyClosingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agentName, setAgentName] = useState('')
  const [notes, setNotes] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const handleLogout = () => {
    // Handle logout logic here
    window.location.href = '/login'
  }

  const fetchDailyClosingData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pos/daily-closing?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setClosingData(data)
        setAgentName(data?.agentName || '')
        setNotes(data?.notes || '')
      } else {
        // Initialize new closing data for the day
        const newData: DailyClosingData = {
          date: selectedDate,
          agentId: 1, // Default agent ID
          agentName: '',
          totalCashOrders: 0,
          totalCardOrders: 0,
          totalJazzcashOrders: 0,
          totalEasypaisaOrders: 0,
          totalCreditOrders: 0,
          cashReceived: 0,
          currencyNotes5000: 0,
          currencyNotes1000: 0,
          currencyNotes500: 0,
          currencyNotes100: 0,
          currencyNotes50: 0,
          currencyNotes20: 0,
          currencyNotes10: 0,
          calculatedCashTotal: 0,
          cashDifference: 0,
          status: 'pending'
        }
        setClosingData(newData)
      }
    } catch (error) {
      console.error('Error fetching daily closing data:', error)
    } finally {
      setLoading(false)
      setLastUpdated(new Date().toLocaleTimeString())
    }
  }, [selectedDate])

  useEffect(() => {
    fetchDailyClosingData()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchDailyClosingData()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [selectedDate, fetchDailyClosingData])

  const calculateCashTotal = () => {
    if (!closingData) return 0
    return (
      closingData.currencyNotes5000 * 5000 +
      closingData.currencyNotes1000 * 1000 +
      closingData.currencyNotes500 * 500 +
      closingData.currencyNotes100 * 100 +
      closingData.currencyNotes50 * 50 +
      closingData.currencyNotes20 * 20 +
      closingData.currencyNotes10 * 10
    )
  }

  const calculateDifference = () => {
    if (!closingData) return 0
    return closingData.totalCashOrders - calculateCashTotal()
  }

  const updateCurrencyNote = (denomination: string, value: number) => {
    if (!closingData) return
    
    const updatedData = {
      ...closingData,
      [`currencyNotes${denomination}`]: value
    }
    updatedData.calculatedCashTotal = calculateCashTotal()
    updatedData.cashDifference = calculateDifference()
    setClosingData(updatedData)
  }

  const saveDailyClosing = async () => {
    if (!closingData || !agentName.trim()) {
      alert('Please enter agent name')
      return
    }

    try {
      setSaving(true)
      const dataToSave = {
        ...closingData,
        agentName: agentName.trim(),
        notes: notes.trim(),
        calculatedCashTotal: calculateCashTotal(),
        cashDifference: calculateDifference()
      }

      const response = await fetch('/api/pos/daily-closing', {
        method: closingData.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      })

      if (response.ok) {
        const result = await response.json()
        setClosingData(result)
        alert('Daily closing saved successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error saving daily closing:', error)
      alert('Error saving daily closing')
    } finally {
      setSaving(false)
    }
  }

  const completeDailyClosing = async () => {
    if (!closingData || !agentName.trim()) {
      alert('Please enter agent name')
      return
    }

    if (Math.abs(calculateDifference()) > 0.01) {
      const confirmComplete = confirm(
        `There is a cash difference of Rs. ${calculateDifference().toFixed(2)}. Are you sure you want to complete the daily closing?`
      )
      if (!confirmComplete) return
    }

    try {
      setSaving(true)
      const dataToSave = {
        ...closingData,
        agentName: agentName.trim(),
        notes: notes.trim(),
        calculatedCashTotal: calculateCashTotal(),
        cashDifference: calculateDifference(),
        status: 'completed'
      }

      const response = await fetch('/api/pos/daily-closing', {
        method: closingData.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      })

      if (response.ok) {
        const result = await response.json()
        setClosingData(result)
        alert('Daily closing completed successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error completing daily closing:', error)
      alert('Error completing daily closing')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <POSHeader 
          title="Daily Closing" 
          icon="💰" 
          onLogout={handleLogout} 
          currentPage="/pos/daily-closing" 
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading daily closing data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <POSHeader 
        title="Daily Closing" 
        icon="💰" 
        onLogout={handleLogout} 
        currentPage="/pos/daily-closing" 
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Daily Closing</h1>
                <p className="text-gray-600">Reconcile daily payments and cash received</p>
                {lastUpdated && (
                  <p className="text-sm text-gray-500 mt-1">
                    Last updated: {lastUpdated} 🔄
                  </p>
                )}
              </div>
              <div className="mt-4 md:mt-0">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mr-3"
                />
                <button
                  onClick={fetchDailyClosingData}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white text-xs">💰</span>
                </span>
                Payment Summary
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Cash Orders</span>
                  <span className="font-bold text-green-600">Rs. {closingData?.totalCashOrders.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Card Payments</span>
                  <span className="font-bold text-blue-600">Rs. {closingData?.totalCardOrders.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">JazzCash</span>
                  <span className="font-bold text-purple-600">Rs. {closingData?.totalJazzcashOrders.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">EasyPaisa</span>
                  <span className="font-bold text-orange-600">Rs. {closingData?.totalEasypaisaOrders.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Credit</span>
                  <span className="font-bold text-yellow-600">Rs. {closingData?.totalCreditOrders.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Cash Reconciliation */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white text-xs">💵</span>
                </span>
                Cash Reconciliation
              </h2>
              
              <div className="space-y-4">
                {/* Currency Notes Input */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { denom: '5000', label: 'Rs. 5000', color: 'bg-red-100 border-red-300' },
                    { denom: '1000', label: 'Rs. 1000', color: 'bg-orange-100 border-orange-300' },
                    { denom: '500', label: 'Rs. 500', color: 'bg-yellow-100 border-yellow-300' },
                    { denom: '100', label: 'Rs. 100', color: 'bg-green-100 border-green-300' },
                    { denom: '50', label: 'Rs. 50', color: 'bg-blue-100 border-blue-300' },
                    { denom: '20', label: 'Rs. 20', color: 'bg-purple-100 border-purple-300' },
                    { denom: '10', label: 'Rs. 10', color: 'bg-pink-100 border-pink-300' }
                  ].map(({ denom, label, color }) => (
                    <div key={denom} className={`p-3 rounded-lg border ${color}`}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input
                        type="number"
                        min="0"
                        value={closingData?.[`currencyNotes${denom}` as keyof DailyClosingData] as number || 0}
                        onChange={(e) => updateCurrencyNote(denom, parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>

                {/* Cash Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Calculated Cash Total:</span>
                      <span className="font-bold text-green-600">Rs. {calculateCashTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Expected Cash:</span>
                      <span className="font-bold text-blue-600">Rs. {closingData?.totalCashOrders.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Difference:</span>
                      <span className={`font-bold ${calculateDifference() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Rs. {calculateDifference().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Information and Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white text-xs">👤</span>
              </span>
              Agent Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name *</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Enter agent name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={saveDailyClosing}
                disabled={saving || !agentName.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={completeDailyClosing}
                disabled={saving || !agentName.trim()}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? 'Completing...' : 'Complete Daily Closing'}
              </button>
            </div>

            {closingData?.status === 'completed' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-600 text-lg mr-2">✅</span>
                  <span className="text-green-800 font-medium">Daily closing completed successfully!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
