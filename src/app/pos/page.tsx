'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PosProduct } from '@/lib/db/schema'

interface CartItem {
  product: PosProduct
  quantity: number
}

export default function POSPage() {
  const [products, setProducts] = useState<PosProduct[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [loading, setLoading] = useState(true)
  const [riders, setRiders] = useState<{id: number, name: string, phoneNumber: string}[]>([])
  const [selectedRider, setSelectedRider] = useState<{id: number, name: string, phoneNumber: string} | null>(null)
  const [orderType, setOrderType] = useState<'takeaway' | 'delivery'>('takeaway')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [showRiderModal, setShowRiderModal] = useState(false)
  const [newRider, setNewRider] = useState({ name: '', phoneNumber: '' })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'jazzcash' | 'easypaisa'>('cash')
  const [transactionId, setTransactionId] = useState('')
  // const [appliedCoupon] = useState<{code: string, discount: number, type: string} | null>(null)
  interface HistoryItemProduct { id: number; name: string }
  interface HistoryItem { quantity: number; product?: HistoryItemProduct }
  interface HistoryOrder { orderNumber: string; createdAt: string; finalAmount: number; orderType: string; orderItems?: HistoryItem[] }

  const [customerHistory, setCustomerHistory] = useState<HistoryOrder[]>([])
  const [showCustomerHistory, setShowCustomerHistory] = useState(false)
  const [showOrderActionsModal, setShowOrderActionsModal] = useState(false)
  const [currentOrderData, setCurrentOrderData] = useState<OrderActionsData | null>(null)

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

      // Load data
      fetchProducts()
      fetchRiders()
    }
  }, [router])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/pos/products')
      const data = await response.json()
      
      // Check if data is an array, if not, it's likely an error response
      if (Array.isArray(data)) {
        setProducts(data)
      } else {
        console.error('API returned non-array data:', data)
        setProducts([]) // Set empty array to prevent crashes
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([]) // Set empty array to prevent crashes
    } finally {
      setLoading(false)
    }
  }

  const fetchRiders = async () => {
    try {
      const response = await fetch('/api/pos/riders')
      const data = await response.json()
      if (Array.isArray(data)) {
        setRiders(data)
      }
    } catch (error) {
      console.error('Error fetching riders:', error)
    }
  }

  const lookupCustomerByPhone = async (phone: string) => {
    if (phone.length < 10) return
    
    try {
      const response = await fetch(`/api/pos/customers/lookup?phone=${encodeURIComponent(phone)}`)
      const data = await response.json()
      
      if (data.customer) {
        setCustomerName(data.customer.name)
        setCustomerAddress(data.customer.address || '')
        setCustomerHistory((data.history || []) as HistoryOrder[])
        setShowCustomerHistory(true)
      } else {
        setCustomerName('')
        setCustomerAddress('')
        setCustomerHistory([])
        setShowCustomerHistory(false)
      }
    } catch (error) {
      console.error('Error looking up customer:', error)
    }
  }

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))]

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const addToCart = (product: PosProduct) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id)
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0)
  }

  const getDiscountAmount = () => {
    const subtotal = getSubtotal()
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100
    }
    return Math.min(discount, subtotal)
  }

  const getTotal = () => {
    return getSubtotal() - getDiscountAmount()
  }

  const clearCart = () => {
    setCart([])
    setDiscount(0)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerAddress('')
    setSelectedRider(null)
    setCustomerHistory([])
    setShowCustomerHistory(false)
  }

  const createRider = async () => {
    try {
      const response = await fetch('/api/pos/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRider)
      })
      
      if (response.ok) {
        await fetchRiders()
        setNewRider({ name: '', phoneNumber: '' })
        setShowRiderModal(false)
      }
    } catch (error) {
      console.error('Error creating rider:', error)
    }
  }

  const processOrder = async () => {
    if (cart.length === 0) return

    try {
      // Auto-save customer if name and phone provided
      let customerId = null
      if (customerName && customerPhone) {
        try {
          const customerResponse = await fetch('/api/pos/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: customerName,
              phoneNumber: customerPhone,
              address: customerAddress || null
            })
          })
          
          if (customerResponse.ok) {
            const newCustomer = await customerResponse.json()
            customerId = newCustomer.id
          }
        } catch (error) {
          console.error('Error saving customer:', error)
        }
      }

      const orderData = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: Number(item.product.price),
          subTotal: Number(item.product.price) * item.quantity
        })),
        totalAmount: getSubtotal(),
        discountAmount: getDiscountAmount(),
        finalAmount: getTotal(),
        discountType,
        discount,
        customerId,
        riderId: selectedRider?.id,
        orderType,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        paymentMethod,
        transactionId: transactionId || null
      }

      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Show success message
        alert(`Order #${result.orderNumber} created successfully!`)
        
        // Store order data for action buttons
        const orderData = {
          orderNumber: result.orderNumber,
          cart: cart,
          total: getTotal(),
          customerName: customerName,
          customerPhone: customerPhone,
          customerAddress: customerAddress,
          selectedRider: selectedRider
        }
        
        // Show action buttons
        showOrderActions(orderData)
        
        clearCart()
      } else {
        throw new Error('Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    }
  }

  const generateWhatsAppMessage = (orderNumber: string, cartItems: CartItem[], total: number, customerName: string, recipient: 'customer' | 'rider', riderInfo?: { id: number; name: string; phoneNumber: string } | null, customerPhone?: string, customerAddress?: string) => {
    const itemsList = cartItems.map(item => 
      `${item.quantity}x ${item.product.name} - ₨${(Number(item.product.price) * item.quantity).toFixed(2)}`
    ).join('\n')
    
    if (recipient === 'customer') {
      return `🍽️ *Zaalimmmm Shawarma Order Receipt*

Order #: ${orderNumber}
Customer: ${customerName || 'Walk-in Customer'}
Date: ${new Date().toLocaleDateString()}
Type: ${orderType === 'delivery' ? 'Delivery' : 'Takeaway'}
${riderInfo ? `Delivery Rider: ${riderInfo.name} (${riderInfo.phoneNumber})` : ''}

*Items:*
${itemsList}

*Total: ₨${total.toFixed(2)}*

Thank you for choosing Zaalimmmm! 🥙`
    } else {
      return `🚚 *Delivery Order - Zaalimmmm Shawarma*

Order #: ${orderNumber}
Customer: ${customerName || 'Walk-in Customer'}
${customerPhone ? `Customer Phone: ${customerPhone}` : ''}
${customerAddress ? `Delivery Address: ${customerAddress}` : ''}
Date: ${new Date().toLocaleDateString()}

*Items:*
${itemsList}

*Total: ₨${total.toFixed(2)}*

Please deliver this order. Thank you! 🥙`
    }
  }

  interface OrderActionsData {
    orderNumber: string
    cart: CartItem[]
    total: number
    customerName: string
    customerPhone?: string
    customerAddress?: string
    selectedRider?: { id: number; name: string; phoneNumber: string } | null
  }

  const showOrderActions = (orderData: OrderActionsData) => {
    setCurrentOrderData(orderData)
    setShowOrderActionsModal(true)
  }

  const sendWhatsAppToCustomer = () => {
    if (currentOrderData && currentOrderData.customerPhone) {
      const customerMessage = generateWhatsAppMessage(
        currentOrderData.orderNumber, 
        currentOrderData.cart, 
        currentOrderData.total, 
        currentOrderData.customerName, 
        'customer', 
        currentOrderData.selectedRider
      )
      const customerWhatsappUrl = `https://wa.me/${currentOrderData.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(customerMessage)}`
      window.open(customerWhatsappUrl, '_blank')
    }
  }

  const sendWhatsAppToRider = () => {
    if (currentOrderData && currentOrderData.selectedRider) {
      const rider = currentOrderData.selectedRider
      const riderMessage = generateWhatsAppMessage(
        currentOrderData.orderNumber, 
        currentOrderData.cart, 
        currentOrderData.total, 
        currentOrderData.customerName, 
        'rider', 
        undefined, 
        currentOrderData.customerPhone, 
        currentOrderData.customerAddress
      )
      const riderWhatsappUrl = `https://wa.me/${rider.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(riderMessage)}`
      window.open(riderWhatsappUrl, '_blank')
    }
  }

  const handlePrintReceipt = () => {
    if (currentOrderData) {
      printThermalReceipt(currentOrderData.orderNumber, currentOrderData.cart, currentOrderData.total, currentOrderData.customerName)
    }
  }

  const closeOrderActionsModal = () => {
    setShowOrderActionsModal(false)
    setCurrentOrderData(null)
  }

  const printThermalReceipt = (orderNumber: string, cartItems: CartItem[], total: number, customerName: string) => {
    const itemsList = cartItems.map(item => 
      `${item.quantity}x ${item.product.name} - ₨${(Number(item.product.price) * item.quantity).toFixed(2)}`
    ).join('\n')
    
    const receiptContent = `
================================
    ZAALIMMMM SHAWARMA
================================

Order #: ${orderNumber}
Customer: ${customerName || 'Walk-in Customer'}
Date: ${new Date().toLocaleString()}
Type: ${orderType === 'delivery' ? 'Delivery' : 'Takeaway'}

--------------------------------
ITEMS:
${itemsList}
--------------------------------

TOTAL: ₨${total.toFixed(2)}

Thank you for choosing Zaalimmmm!
================================
    `
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${orderNumber}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                line-height: 1.4;
                margin: 0;
                padding: 20px;
                white-space: pre-line;
              }
              @media print {
                body { margin: 0; padding: 10px; }
              }
            </style>
          </head>
          <body>${receiptContent}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
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
        <div className="text-xl">Loading POS System...</div>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Zaalimmmm POS
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex flex-wrap gap-2">
              <a 
                href="/pos/dashboard" 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105"
              >
                📊 Dashboard
              </a>
              <a 
                href="/pos/menu" 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-600 text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105"
              >
                📋 Menu
              </a>
              <a 
                href="/pos/orders" 
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105"
              >
                📦 Orders
              </a>
              <a 
                href="/pos/analytics" 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-600 text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105"
              >
                📈 Analytics
              </a>
              <a 
                href="/pos/customers" 
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105"
              >
                👥 Customers
              </a>
              <a
                href="/pos/riders" 
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105"
              >
                🚚 Riders
              </a>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105"
              >
                🚪 Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              {/* Cart Button */}
              {cart.length > 0 && (
                <button
                  onClick={() => setShowCartModal(true)}
                  className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-lg shadow-md"
                >
                  <span className="text-lg">🛒</span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </button>
              )}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-3 space-y-2">
              <a 
                href="/pos/dashboard" 
                className="flex items-center space-x-3 bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700 px-4 py-3 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-lg">📊</span>
                <span className="font-medium">Dashboard</span>
              </a>
              <a 
                href="/pos/menu" 
                className="flex items-center space-x-3 bg-gradient-to-r from-yellow-50 to-orange-50 text-gray-700 px-4 py-3 rounded-lg hover:from-yellow-100 hover:to-orange-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-lg">📋</span>
                <span className="font-medium">Menu Management</span>
              </a>
              <a 
                href="/pos/orders" 
                className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 text-gray-700 px-4 py-3 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-lg">📦</span>
                <span className="font-medium">Orders</span>
              </a>
              <a 
                href="/pos/analytics" 
                className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-cyan-50 text-gray-700 px-4 py-3 rounded-lg hover:from-blue-100 hover:to-cyan-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-lg">📈</span>
                <span className="font-medium">Analytics</span>
              </a>
              <a 
                href="/pos/customers" 
                className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-pink-50 text-gray-700 px-4 py-3 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-lg">👥</span>
                <span className="font-medium">Customers</span>
              </a>
              <a
                href="/pos/riders" 
                className="flex items-center space-x-3 bg-gradient-to-r from-orange-50 to-red-50 text-gray-700 px-4 py-3 rounded-lg hover:from-orange-100 hover:to-red-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-lg">🚚</span>
                <span className="font-medium">Riders</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-colors w-full text-left"
              >
                <span className="text-lg">🚪</span>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Customer & Rider Management */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-sm">👤</span>
            </span>
            Order Details
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Order Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrderType('takeaway')}
                  className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                    orderType === 'takeaway'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🥡 Takeaway
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                    orderType === 'delivery'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🚚 Delivery
                </button>
              </div>
            </div>

            {/* Rider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rider (for delivery)</label>
              <div className="flex space-x-2">
                <select
                  value={selectedRider?.id || ''}
                  onChange={(e) => {
                    const rider = riders.find(r => r.id === parseInt(e.target.value))
                    setSelectedRider(rider || null)
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  disabled={orderType !== 'delivery'}
                >
                  <option value="">Select Rider</option>
                  {riders.map(rider => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name} ({rider.phoneNumber})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowRiderModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-md transition-all duration-200"
                >
                  ➕
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                placeholder="Enter customer name"
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value)
                  if (e.target.value.length >= 10) {
                    lookupCustomerByPhone(e.target.value)
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                placeholder="Phone number (auto-fills name if exists)"
              />
            </div>
          </div>

          {/* Customer Address (for delivery) */}
          {orderType === 'delivery' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  placeholder="Enter delivery address"
                />
                <button
                  onClick={() => {
                    if (customerAddress) {
                      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customerAddress)}`
                      window.open(mapsUrl, '_blank')
                    }
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md transition-all duration-200"
                  disabled={!customerAddress}
                >
                  🗺️
                </button>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                  paymentMethod === 'cash'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💵 Cash
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                  paymentMethod === 'card'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💳 Card
              </button>
              <button
                onClick={() => setPaymentMethod('jazzcash')}
                className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                  paymentMethod === 'jazzcash'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📱 JazzCash
              </button>
              <button
                onClick={() => setPaymentMethod('easypaisa')}
                className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                  paymentMethod === 'easypaisa'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📱 EasyPaisa
              </button>
            </div>
            
            {/* Transaction ID for digital payments */}
            {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa' || paymentMethod === 'card') && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  placeholder={`Enter ${paymentMethod} transaction ID`}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white text-xs">🏷️</span>
                </span>
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white/80 backdrop-blur-sm p-3 md:p-4 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left group"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2 bg-gray-100 px-2 py-1 rounded-full inline-block">
                          {product.category}
                        </p>
                      </div>
                      <div className="mt-auto">
                        <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                          ₨{product.price.toString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📦</span>
                  </div>
                  <p className="text-gray-500 mb-4 text-lg">No products found</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Please set up the database to get started
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg max-w-md mx-auto">
                    <p className="text-xs text-gray-600 font-mono">
                      Run migration to add POS tables
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Cart - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white text-xs">🛒</span>
                </span>
                Current Order
              </h2>
              
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items in cart</p>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">{item.product.name}</h4>
                          <p className="text-xs text-gray-500">₨{item.product.price.toString()} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-gradient-to-r from-red-400 to-red-500 text-white flex items-center justify-center text-sm hover:from-red-500 hover:to-red-600 transition-all duration-200"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-gradient-to-r from-green-400 to-green-500 text-white flex items-center justify-center text-sm hover:from-green-500 hover:to-green-600 transition-all duration-200"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="w-7 h-7 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 text-white flex items-center justify-center text-sm hover:from-gray-500 hover:to-gray-600 transition-all duration-200 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Discount Section */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-3 text-gray-800">Discount</h4>
                    <div className="flex space-x-2 mb-3">
                      <button
                        onClick={() => setDiscountType('percentage')}
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                          discountType === 'percentage' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        %
                      </button>
                      <button
                        onClick={() => setDiscountType('fixed')}
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                          discountType === 'fixed' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        ₨
                      </button>
                    </div>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Discount amount"
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-3 mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₨{getSubtotal().toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Discount:</span>
                        <span className="font-medium">-₨{getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-3">
                      <span className="text-gray-800">Total:</span>
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                        ₨{getTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={processOrder}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 shadow-md transition-all duration-200 transform hover:scale-105"
                    >
                      💳 Process Order
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2 rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 shadow-md transition-all duration-200"
                    >
                      🗑️ Clear Cart
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Customer History */}
            {showCustomerHistory && customerHistory.length > 0 && (
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">📋 Last Orders for {customerName}</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                      {customerHistory.slice(0, 3).map((order: HistoryOrder, index: number) => (
                    <div key={index} className="bg-white rounded p-3 text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Order #{order.orderNumber}</p>
                          <p className="text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">
                                {order.orderItems?.map((item: HistoryItem) => `${item.quantity}x ${item.product?.name}`).join(', ')}
                              </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">₨{Number(order.finalAmount).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{order.orderType}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rider Modal */}
      {showRiderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Rider</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newRider.name}
                  onChange={(e) => setNewRider({ ...newRider, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Rider name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newRider.phoneNumber}
                  onChange={(e) => setNewRider({ ...newRider, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={createRider}
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
              >
                Add Rider
              </button>
              <button
                onClick={() => setShowRiderModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Actions Modal */}
      {showOrderActionsModal && currentOrderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-green-700">✅ Order Created Successfully!</h3>
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="font-medium">Order #{currentOrderData.orderNumber}</p>
              <p className="text-sm text-gray-600">Total: ₨{currentOrderData.total.toFixed(2)}</p>
              {currentOrderData.customerName && (
                <p className="text-sm text-gray-600">Customer: {currentOrderData.customerName}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Choose actions:</p>
              
              {currentOrderData.customerPhone && (
                <button
                  onClick={sendWhatsAppToCustomer}
                  className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  📱 Send WhatsApp to Customer
                </button>
              )}
              
              {currentOrderData.selectedRider && (
                <button
                  onClick={sendWhatsAppToRider}
                  className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  🚚 Send WhatsApp to Rider
                </button>
              )}
              
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                🖨️ Print Receipt
              </button>
              
              <button
                onClick={closeOrderActionsModal}
                className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 lg:hidden">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-2">
                    <span className="text-white text-xs">🛒</span>
                  </span>
                  Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </h3>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🛒</span>
                  </div>
                  <p className="text-gray-500">No items in cart</p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3 mb-4">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">{item.product.name}</h4>
                          <p className="text-xs text-gray-500">₨{item.product.price.toString()} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gradient-to-r from-red-400 to-red-500 text-white flex items-center justify-center text-sm hover:from-red-500 hover:to-red-600 transition-all duration-200"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-green-500 text-white flex items-center justify-center text-sm hover:from-green-500 hover:to-green-600 transition-all duration-200"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 text-white flex items-center justify-center text-sm hover:from-gray-500 hover:to-gray-600 transition-all duration-200 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Discount Section */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-3 text-gray-800">Discount</h4>
                    <div className="flex space-x-2 mb-3">
                      <button
                        onClick={() => setDiscountType('percentage')}
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                          discountType === 'percentage' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        %
                      </button>
                      <button
                        onClick={() => setDiscountType('fixed')}
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                          discountType === 'fixed' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        ₨
                      </button>
                    </div>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Discount amount"
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-3 mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₨{getSubtotal().toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Discount:</span>
                        <span className="font-medium">-₨{getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-3">
                      <span className="text-gray-800">Total:</span>
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                        ₨{getTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pb-4">
                    <button
                      onClick={() => {
                        processOrder()
                        setShowCartModal(false)
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 shadow-md transition-all duration-200 transform hover:scale-105"
                    >
                      💳 Process Order
                    </button>
                    <button
                      onClick={() => {
                        clearCart()
                        setShowCartModal(false)
                      }}
                      className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 shadow-md transition-all duration-200"
                    >
                      🗑️ Clear Cart
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-40 lg:hidden">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => setShowCartModal(true)}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <div className="relative">
              <span className="text-2xl">🛒</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Cart</span>
          </button>
          
          <a
            href="/pos/dashboard"
            className="flex flex-col items-center p-2 text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <span className="text-xs mt-1">Dashboard</span>
          </a>
          
          <a
            href="/pos/menu"
            className="flex flex-col items-center p-2 text-gray-600 hover:text-yellow-600 transition-colors"
          >
            <span className="text-2xl">📋</span>
            <span className="text-xs mt-1">Menu</span>
          </a>
          
          <a
            href="/pos/orders"
            className="flex flex-col items-center p-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <span className="text-2xl">📦</span>
            <span className="text-xs mt-1">Orders</span>
          </a>
        </div>
      </div>
    </div>
    </>
  )
}