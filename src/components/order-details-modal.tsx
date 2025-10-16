'use client'

import { useState, useEffect } from 'react'
import { X, Printer, CheckCircle, XCircle } from 'lucide-react'

interface OrderItem {
  id: number
  productId: number
  quantity: number
  unitPrice: string
  subTotal: string
  product_name: string
  product_category: string
  product_price: string
}

interface OrderDetails {
  id: number
  orderNumber: string
  customerId: number | null
  riderId: number | null
  totalAmount: string
  discountAmount: string
  finalAmount: string
  status: string
  orderType: string
  paymentMethod: string
  transactionId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  customer_address: string | null
  rider_name: string | null
  rider_phone: string | null
}

interface OrderDetailsModalProps {
  orderId: number
  isOpen: boolean
  onClose: () => void
  onStatusUpdate?: () => void
}

export default function OrderDetailsModal({ orderId, isOpen, onClose, onStatusUpdate }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails()
    }
  }, [isOpen, orderId])

  const fetchOrderDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pos/orders/${orderId}`)
      const data = await response.json()
      setOrder(data.order)
      setItems(data.items)
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/pos/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        if (order) {
          setOrder({ ...order, status: newStatus })
        }
        onStatusUpdate?.()
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const printReceipt = () => {
    // Create a printable receipt
    const printWindow = window.open('', '_blank')
    if (printWindow && order) {
      const receiptContent = `
        <html>
          <head>
            <title>Receipt - ${order.orderNumber}</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .order-info { margin-bottom: 15px; }
              .items { margin-bottom: 15px; }
              .total { border-top: 1px solid #000; padding-top: 10px; }
              .footer { text-align: center; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Zaalimmmm Shawarma</h2>
              <p>Receipt #${order.orderNumber}</p>
            </div>
            
            <div class="order-info">
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
              <p><strong>Type:</strong> ${order.orderType}</p>
              <p><strong>Payment:</strong> ${order.paymentMethod}</p>
              ${order.customer_name ? `<p><strong>Customer:</strong> ${order.customer_name}</p>` : ''}
              ${order.customer_phone ? `<p><strong>Phone:</strong> ${order.customer_phone}</p>` : ''}
            </div>
            
            <div class="items">
              <h3>Items:</h3>
              ${items.map(item => `
                <p>${item.product_name} x${item.quantity} = ₨${item.subTotal}</p>
              `).join('')}
            </div>
            
            <div class="total">
              <p><strong>Subtotal:</strong> ₨${order.totalAmount}</p>
              ${Number(order.discountAmount) > 0 ? `<p><strong>Discount:</strong> -₨${order.discountAmount}</p>` : ''}
              <p><strong>Total:</strong> ₨${order.finalAmount}</p>
            </div>
            
            <div class="footer">
              <p>Thank you for your order!</p>
            </div>
          </body>
        </html>
      `
      printWindow.document.write(receiptContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Order Details - {order?.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : order ? (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Order #:</span> {order.orderNumber}</p>
                    <p><span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleString()}</p>
                    <p><span className="font-medium">Type:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        order.orderType === 'delivery' ? 'bg-orange-100 text-orange-800' :
                        order.orderType === 'takeaway' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {order.orderType}
                      </span>
                    </p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </p>
                    <p><span className="font-medium">Payment:</span> {order.paymentMethod}</p>
                    {order.transactionId && (
                      <p><span className="font-medium">Transaction ID:</span> {order.transactionId}</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    {order.customer_name ? (
                      <p><span className="font-medium">Name:</span> {order.customer_name}</p>
                    ) : (
                      <p className="text-gray-500">No customer information</p>
                    )}
                    {order.customer_phone && (
                      <p><span className="font-medium">Phone:</span> {order.customer_phone}</p>
                    )}
                    {order.customer_email && (
                      <p><span className="font-medium">Email:</span> {order.customer_email}</p>
                    )}
                    {order.customer_address && (
                      <p><span className="font-medium">Address:</span> {order.customer_address}</p>
                    )}
                    {order.rider_name && (
                      <p><span className="font-medium">Rider:</span> {order.rider_name}</p>
                    )}
                    {order.rider_phone && (
                      <p><span className="font-medium">Rider Phone:</span> {order.rider_phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.product_category}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">₨{item.unitPrice}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">₨{item.subTotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₨{order.totalAmount}</span>
                  </div>
                  {Number(order.discountAmount) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-₨{order.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t border-gray-300 pt-2">
                    <span>Total:</span>
                    <span>₨{order.finalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Failed to load order details
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={printReceipt}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </button>
          </div>
          
          <div className="flex space-x-3">
            {order?.status === 'pending' && (
              <button
                onClick={() => updateOrderStatus('completed')}
                disabled={updating}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {updating ? 'Updating...' : 'Complete Order'}
              </button>
            )}
            {order?.status === 'completed' && (
              <button
                onClick={() => updateOrderStatus('cancelled')}
                disabled={updating}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {updating ? 'Updating...' : 'Cancel Order'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
