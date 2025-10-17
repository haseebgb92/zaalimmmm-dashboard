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

      {/* Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col bg-white">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">POS Navigation</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Menu Items */}
              <div className="flex-1 p-4 bg-white overflow-y-auto">
              
                <div className="space-y-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleMenuItemClick(item.href)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        currentPage === item.href
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                  
                  <div className="border-t border-gray-200 my-4"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                  >
                    <span className="text-lg">🚪</span>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
