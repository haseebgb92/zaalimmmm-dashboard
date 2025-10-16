'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function POSAnalyticsPage() {
  const [loading, setLoading] = useState(true)
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

      setLoading(false)
    }
  }, [router])

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
        <div className="text-xl">Loading Analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📈</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Analytics & Reports
              </h1>
            </div>
            <div className="flex space-x-3">
              <Link 
                href="/pos" 
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 shadow-md transition-all duration-200 transform hover:scale-105"
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
        {/* Coming Soon Message */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-4xl">📊</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Analytics Coming Soon!</h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            We're working on comprehensive analytics and reporting features for your POS system. 
            This will include detailed sales reports, customer insights, product performance, and more.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales Analytics</h3>
              <p className="text-sm text-gray-600">
                Track sales trends, peak hours, and revenue patterns
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Insights</h3>
              <p className="text-sm text-gray-600">
                Analyze customer behavior and loyalty patterns
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🍽️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Performance</h3>
              <p className="text-sm text-gray-600">
                Monitor best-selling items and inventory insights
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <Link
              href="/pos/dashboard"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md transition-all duration-200 transform hover:scale-105"
            >
              <span className="mr-2">📊</span>
              View Current Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

