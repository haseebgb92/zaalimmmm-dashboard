'use client'

import { useState } from 'react'
import { X, MessageCircle, CheckCircle, User } from 'lucide-react'
import { PosProduct } from '@/lib/db/schema'

interface CartItem {
  product: PosProduct
  quantity: number
}

interface OrderCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  orderData: {
    orderNumber: string
    cart: CartItem[]
    total: number
    customerName: string
    customerPhone: string
    customerAddress: string
    selectedRider: string
    orderType: string
    paymentMethod: string
  }
}

export default function OrderCompletionModal({ isOpen, onClose, orderData }: OrderCompletionModalProps) {
  const [sendingToRider, setSendingToRider] = useState(false)
  const [sendingToCustomer, setSendingToCustomer] = useState(false)

  if (!isOpen) return null

  const generateRiderMessage = () => {
    const items = orderData.cart.map(item => 
      `• ${item.product.name} x${item.quantity} = ₨${(Number(item.product.price) * item.quantity).toFixed(2)}`
    ).join('\n')
    
    return `🚚 *NEW DELIVERY ORDER* 🚚

📋 *Order #${orderData.orderNumber}*

👤 *Customer Details:*
Name: ${orderData.customerName}
Phone: ${orderData.customerPhone}
Address: ${orderData.customerAddress}

📦 *Order Items:*
${items}

💰 *Total Amount: ₨${orderData.total}*
💳 *Payment: ${orderData.paymentMethod}*

⏰ *Order Time:* ${new Date().toLocaleString()}

Please confirm pickup and delivery! 🎯`
  }

  const generateCustomerMessage = () => {
    const items = orderData.cart.map(item => 
      `• ${item.product.name} x${item.quantity} = ₨${(Number(item.product.price) * item.quantity).toFixed(2)}`
    ).join('\n')
    
    return `🍽️ *ORDER CONFIRMED* 🍽️

📋 *Order #${orderData.orderNumber}*

📦 *Your Order:*
${items}

💰 *Total Amount: ₨${orderData.total}*
💳 *Payment: ${orderData.paymentMethod}*

🚚 *Delivery Details:*
Rider: ${orderData.selectedRider}
Type: ${orderData.orderType}

⏰ *Order Time:* ${new Date().toLocaleString()}

Thank you for choosing Zaalimmmm Shawarma! 🙏`
  }

  const sendToRider = () => {
    setSendingToRider(true)
    const message = generateRiderMessage()
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${orderData.customerPhone.replace(/\D/g, '')}?text=${encodedMessage}`
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank')
    
    setTimeout(() => {
      setSendingToRider(false)
    }, 2000)
  }

  const sendToCustomer = () => {
    setSendingToCustomer(true)
    const message = generateCustomerMessage()
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${orderData.customerPhone.replace(/\D/g, '')}?text=${encodedMessage}`
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank')
    
    setTimeout(() => {
      setSendingToCustomer(false)
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Order Completed Successfully!
              </h2>
              <p className="text-sm text-gray-600">
                Order #{orderData.orderNumber} has been created
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
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {orderData.customerName}</p>
                <p><span className="font-medium">Phone:</span> {orderData.customerPhone}</p>
                {orderData.customerAddress && (
                  <p><span className="font-medium">Address:</span> {orderData.customerAddress}</p>
                )}
                <p><span className="font-medium">Order Type:</span> {orderData.orderType}</p>
                <p><span className="font-medium">Payment:</span> {orderData.paymentMethod}</p>
                {orderData.selectedRider && (
                  <p><span className="font-medium">Rider:</span> {orderData.selectedRider}</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-2">
                {orderData.cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-500">{item.product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">x{item.quantity}</p>
                      <p className="text-sm text-gray-500">₨{(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-xl font-bold text-green-600">₨{orderData.total}</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Actions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Send WhatsApp Messages
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Send to Rider */}
                <button
                  onClick={sendToRider}
                  disabled={sendingToRider || !orderData.selectedRider}
                  className="flex items-center justify-center p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">Send to Rider</p>
                    <p className="text-sm text-gray-500">
                      {sendingToRider ? 'Sending...' : 'Order details & customer info'}
                    </p>
                  </div>
                </button>

                {/* Send to Customer */}
                <button
                  onClick={sendToCustomer}
                  disabled={sendingToCustomer || !orderData.customerPhone}
                  className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">Send to Customer</p>
                    <p className="text-sm text-gray-500">
                      {sendingToCustomer ? 'Sending...' : 'Order confirmation & rider info'}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
