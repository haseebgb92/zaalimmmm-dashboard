'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface POSHamburgerMenuProps {
  onLogout: () => void
  currentPage?: string
}

export function POSHamburgerMenu({ onLogout, currentPage }: POSHamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    onLogout()
    setIsOpen(false)
  }

  const menuItems = [
    { href: "/pos/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/pos/analytics", label: "Analytics", icon: "📈" },
    { href: "/pos/orders", label: "Orders", icon: "📦" },
    { href: "/pos/menu", label: "Menu", icon: "📋" },
    { href: "/pos/customers", label: "Customers", icon: "👥" },
    { href: "/pos/riders", label: "Riders", icon: "🚚" },
  ]

  const handleMenuItemClick = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Menu - Same as main page */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg fixed top-16 left-0 right-0 z-50">
          <div className="px-4 py-3 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleMenuItemClick(item.href)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.href
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 transition-colors"
            >
              <span className="text-lg">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
