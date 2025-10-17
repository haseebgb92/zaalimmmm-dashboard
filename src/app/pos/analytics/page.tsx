'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { POSHamburgerMenu } from '@/components/pos-hamburger-menu'

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

interface HourlyData {
  hour: number
  orders: number
  revenue: number
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

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('thisWeek')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const router = useRouter()

  const fetchAnalyticsData = useCallback(async (filter = selectedFilter) => {
    try {
      setLoading(true)
      // Add cache-busting parameter to ensure fresh data
      const url = `/api/pos/dashboard?filter=${filter}&t=${Date.now()}`
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
    } catch (error) {
      console.error('Error fetching analytics data:', error)
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

      // Load analytics data
      fetchAnalyticsData()
    }
  }, [router, fetchAnalyticsData])

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
          <p className="text-xl text-gray-600">Loading Analytics...</p>
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
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📊</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Advanced Analytics
              </h1>
            </div>
            {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 lg:items-center">
              <Link 
                href="/pos/dashboard" 
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 shadow-md transition-all duration-200 transform hover:scale-105 text-center"
              >
                ← Dashboard
              </Link>
              <POSHamburgerMenu onLogout={handleLogout} currentPage="/pos/analytics" />
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
                  fetchAnalyticsData(filter.key)
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

        {/* Key Metrics */}
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
            <div className="overflow-x-auto mb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, index) => {
                    const globalIndex = (currentPage - 1) * itemsPerPage + index;
                    return (
                      <tr key={item.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold">
                            {globalIndex + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800">{item.name}</td>
                        <td className="py-3 px-4 text-gray-600">{item.category}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">{item.total_quantity}</td>
                        <td className="py-3 px-4 text-right font-semibold text-blue-600">{formatCurrency(item.total_amount)}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{item.order_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
              {hourlyData.slice(0, 12).map((hour) => (
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
                  <div className="w-20 text-sm text-green-600 text-right font-medium">
                    {formatCurrency(hour.revenue)}
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
              Payment Methods Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(stats?.paymentMethods || {}).map(([method, count]) => {
                const total = Object.values(stats?.paymentMethods || {}).reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                const colors = {
                  cash: 'from-green-500 to-emerald-500',
                  card: 'from-blue-500 to-indigo-500',
                  jazzcash: 'from-purple-500 to-pink-500',
                  easypaisa: 'from-orange-500 to-red-500'
                }
                const icons = {
                  cash: '💵',
                  card: '💳',
                  jazzcash: '📱',
                  easypaisa: '📱'
                }
                
                return (
                  <div key={method} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{icons[method as keyof typeof icons]}</span>
                        <span className="font-medium capitalize">{method}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-800">{count}</span>
                        <span className="text-sm text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`bg-gradient-to-r ${colors[method as keyof typeof colors]} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Category Performance */}
        {topItems.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white text-xs">📈</span>
              </span>
              Category Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(
                topItems.reduce((acc, item) => {
                  if (!acc[item.category]) {
                    acc[item.category] = { quantity: 0, revenue: 0, items: 0 }
                  }
                  acc[item.category].quantity += item.total_quantity
                  acc[item.category].revenue += item.total_amount
                  acc[item.category].items += 1
                  return acc
                }, {} as Record<string, { quantity: number; revenue: number; items: number }>)
              ).map(([category, data]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{category}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-medium">{data.items}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium text-green-600">{data.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-medium text-blue-600">{formatCurrency(data.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}