'use client'

import Link from 'next/link'
import { POSHamburgerMenu } from './pos-hamburger-menu'

interface POSHeaderProps {
  title: string
  icon: string
  onLogout: () => void
  currentPage: string
  showAddButton?: boolean
  onAddClick?: () => void
  addButtonLabel?: string
  showLastUpdated?: boolean
  lastUpdated?: string
  onRefresh?: () => void
}

export function POSHeader({ 
  title, 
  icon, 
  onLogout, 
  currentPage, 
  showAddButton = false, 
  onAddClick, 
  addButtonLabel = "Add",
  showLastUpdated = false,
  lastUpdated,
  onRefresh
}: POSHeaderProps) {

  return (
    <>
      {/* Top Bar */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Page Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{icon}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {title}
              </h1>
            </div>
            
            {/* Right: Hamburger Menu */}
            <div className="relative">
              <POSHamburgerMenu onLogout={onLogout} currentPage={currentPage} />
            </div>
          </div>
        </div>
      </header>

      {/* Action Bar Below Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Left side - Last Updated info (if dashboard) */}
            {showLastUpdated && lastUpdated && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            
            {/* Right side - Action buttons */}
            <div className="flex items-center gap-2">
              {/* Add Button (if needed) */}
              {showAddButton && onAddClick && (
                <button
                  onClick={onAddClick}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-lg">➕</span>
                  <span className="hidden sm:inline">{addButtonLabel}</span>
                </button>
              )}
              
              {/* Back to POS Button */}
              <Link 
                href="/pos" 
                className="flex items-center space-x-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <span className="text-lg">←</span>
                <span className="hidden sm:inline">Back to POS</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
