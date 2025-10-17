'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
  ordersCount: number
  totalRevenue: number
  totalDiscounts: number
  averageOrderValue: number
  peakHour: number
  peakHourOrders: number
  paymentMethods: {
    cash: number
    card: number
    jazzcash: number
    easypaisa: number
  }
}

interface TopItem {
  id?: number
  name: string
  category: string
  price: string
  total_quantity: number
  total_amount: number
  order_count: number
}

interface DateRange {
  start: string
  end: string
  filter: string
}

interface HourlyData {
  hour: number
  orders: number
  revenue: number
}

export default function POSDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [selectedFilter, setSelectedFilter] = useState('thisWeek')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const router = useRouter()

  const fetchDashboardData = useCallback(async (filter = selectedFilter) => {
    try {
      setLoading(true)
      // Add cache-busting parameter to ensure fresh data
      const url = filter === 'custom' ? 
        `/api/pos/dashboard?filter=${filter}&t=${Date.now()}` : 
        `/api/pos/dashboard?filter=${filter}&t=${Date.now()}`
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      setStats(data.stats)
      setHourlyData(data.hourlyData)
      setTopItems(data.topItems || [])
      setDateRange(data.dateRange)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedFilter])

  // Check authentication (only on client side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      
      if (!token || role !== 'pos') {
        router.push('/login');
        return;
      }

      // Load dashboard data
      fetchDashboardData()
      // Update every 30 seconds
      const interval = setInterval(() => fetchDashboardData(), 30000)
      return () => clearInterval(interval)
    }
  }, [router, fetchDashboardData])

  const formatCurrency = (amount: number) => {
    return `₨${amount.toFixed(2)}`
  }

  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userName')
      router.push('/login')
    }
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">📊</span>
          </div>
          <p className="text-xl text-gray-600">Loading Dashboard...</p>
        </div>
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
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📊</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Real-time Dashboard
              </h1>
            </div>
            {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 lg:items-center">
              <div className="text-sm text-gray-500 mb-2 lg:mb-0">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <button
                onClick={() => fetchDashboardData()}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors self-start lg:self-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <Link 
                href="/pos" 
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 shadow-md transition-all duration-200 transform hover:scale-105 text-center"
              >
                ← Back to POS
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 shadow-md transition-all duration-200 transform hover:scale-105"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white text-xs">📅</span>
            </span>
            Date Filter
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: 'thisWeek', label: 'This Week' },
              { key: 'previousWeek', label: 'Previous Week' },
              { key: 'thisMonth', label: 'This Month' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  setSelectedFilter(filter.key)
                  setCurrentPage(1) // Reset pagination when filter changes
                  fetchDashboardData(filter.key)
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedFilter === filter.key
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {dateRange && (
            <div className="mt-4 text-sm text-gray-600">
              Showing data from {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Live Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  {stats?.ordersCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Average Order</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {formatCurrency(stats?.averageOrderValue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Peak Hour</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  {formatTime(stats?.peakHour || 0)}
                </p>
                <p className="text-xs text-gray-500">{stats?.peakHourOrders || 0} orders</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🔥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        {topItems.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white text-xs">🏆</span>
                </span>
                Top Selling Items ({topItems.length} total)
              </h3>
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, topItems.length)} of {topItems.length}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {topItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                return (
                  <div key={item.id || index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">#{globalIndex + 1}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">Qty: {item.total_quantity}</span>
                      <span className="text-blue-600 font-medium">₨{item.total_amount}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{item.order_count} orders</div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            {topItems.length > itemsPerPage && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.ceil(topItems.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(topItems.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(topItems.length / itemsPerPage)}
                  className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Hourly Sales Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white text-xs">📊</span>
              </span>
              Hourly Sales Trend
            </h3>
            <div className="space-y-3">
              {hourlyData.slice(0, 8).map((hour) => (
                <div key={hour.hour} className="flex items-center space-x-3">
                  <div className="w-12 text-sm text-gray-600 font-medium">
                    {formatTime(hour.hour)}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, (hour.orders / Math.max(...hourlyData.map(h => h.orders), 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {hour.orders} orders
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white text-xs">💳</span>
              </span>
              Payment Methods
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">💵</span>
                  <span className="font-medium">Cash</span>
                </div>
                <span className="font-bold text-green-600">{stats?.paymentMethods.cash || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">💳</span>
                  <span className="font-medium">Card</span>
                </div>
                <span className="font-bold text-blue-600">{stats?.paymentMethods.card || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📱</span>
                  <span className="font-medium">JazzCash</span>
                </div>
                <span className="font-bold text-purple-600">{stats?.paymentMethods.jazzcash || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📱</span>
                  <span className="font-medium">EasyPaisa</span>
                </div>
                <span className="font-bold text-orange-600">{stats?.paymentMethods.easypaisa || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white text-xs">⚡</span>
            </span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/pos"
              className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-md transition-all duration-200 transform hover:scale-105 text-center"
            >
              <div className="text-2xl mb-2">🛒</div>
              <div className="font-medium">New Order</div>
            </Link>
            <Link
              href="/pos/orders"
              className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md transition-all duration-200 transform hover:scale-105 text-center"
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="font-medium">View Orders</div>
            </Link>
            <Link
              href="/pos/analytics"
              className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 shadow-md transition-all duration-200 transform hover:scale-105 text-center"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">Analytics</div>
            </Link>
            <Link
              href="/pos/menu"
              className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 shadow-md transition-all duration-200 transform hover:scale-105 text-center"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-medium">Menu</div>
            </Link>
            <Link
              href="/pos/customers"
              className="p-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 shadow-md transition-all duration-200 transform hover:scale-105 text-center"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="font-medium">Customers</div>
            </Link>
            <Link
              href="/pos/riders"
              className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 shadow-md transition-all duration-200 transform hover:scale-105 text-center"
            >
              <div className="text-2xl mb-2">🚚</div>
              <div className="font-medium">Riders</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
