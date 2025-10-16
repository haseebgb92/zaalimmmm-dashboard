'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, Package } from 'lucide-react'

interface OrderItem {
  product_name: string
  product_category: string
  quantity: number
  unitPrice: string
  subTotal: string
}

interface Order {
  id: number
  orderNumber: string
  totalAmount: string
  discountAmount: string
  finalAmount: string
  orderType: string
  paymentMethod: string
  status: string
  createdAt: string
  items: OrderItem[]
}

interface CustomerHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: number
  customerName: string
}

export default function CustomerHistoryModal({ 
  isOpen, 
  onClose, 
  customerId, 
  customerName 
}: CustomerHistoryModalProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [totalSpent, setTotalSpent] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerHistory()
    }
  }, [isOpen, customerId])

  const fetchCustomerHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pos/customers/${customerId}/history`)
      const data = await response.json()
      setOrders(data.orders)
      setTotalSpent(data.totalSpent)
      setOrderCount(data.orderCount)
    } catch (error) {
      console.error('Error fetching customer history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Customer History
              </h2>
              <p className="text-sm text-gray-600">
                {customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-600">{orderCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Spent</p>
                      <p className="text-2xl font-bold text-green-600">₨{totalSpent.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Average Order</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ₨{orderCount > 0 ? (totalSpent / orderCount).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order History</h3>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No orders found for this customer.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{order.orderNumber}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">₨{order.finalAmount}</p>
                            <p className="text-sm text-gray-500">{order.orderType}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><span className="font-medium">Payment:</span> {order.paymentMethod}</p>
                            <p><span className="font-medium">Status:</span> 
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p><span className="font-medium">Items:</span> {order.items.length}</p>
                            {Number(order.discountAmount) > 0 && (
                              <p><span className="font-medium">Discount:</span> -₨{order.discountAmount}</p>
                            )}
                          </div>
                        </div>

                        {/* Order Items */}
                        {order.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Items:</h5>
                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>{item.product_name} x{item.quantity}</span>
                                  <span>₨{item.subTotal}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
