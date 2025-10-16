'use client'

import { useState } from 'react'
import { X, AlertTriangle, DollarSign } from 'lucide-react'

interface RefundModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: number
  orderNumber: string
  orderTotal: number
  onRefundSuccess?: () => void
}

export default function RefundModal({ 
  isOpen, 
  onClose, 
  orderId, 
  orderNumber, 
  orderTotal, 
  onRefundSuccess 
}: RefundModalProps) {
  const [refundAmount, setRefundAmount] = useState(orderTotal)
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)

  if (!isOpen) return null

  const handleRefund = async () => {
    if (refundAmount <= 0 || refundAmount > orderTotal) {
      alert('Invalid refund amount')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/pos/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundAmount,
          reason,
          refundType
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert(`Refund of ₨${refundAmount} processed successfully!`)
        onRefundSuccess?.()
        onClose()
      } else {
        alert(result.error || 'Failed to process refund')
      }
    } catch (error) {
      console.error('Refund error:', error)
      alert('Failed to process refund')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Process Refund
              </h2>
              <p className="text-sm text-gray-600">
                Order #{orderNumber}
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
        <div className="p-6 space-y-6">
          {/* Order Total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Order Total:</span>
              <span className="text-lg font-bold text-gray-900">₨{orderTotal}</span>
            </div>
          </div>

          {/* Refund Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Refund Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="refundType"
                  value="full"
                  checked={refundType === 'full'}
                  onChange={(e) => {
                    setRefundType(e.target.value as 'full' | 'partial')
                    setRefundAmount(orderTotal)
                  }}
                  className="mr-3"
                />
                <span>Full Refund (₨{orderTotal})</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="refundType"
                  value="partial"
                  checked={refundType === 'partial'}
                  onChange={(e) => setRefundType(e.target.value as 'full' | 'partial')}
                  className="mr-3"
                />
                <span>Partial Refund</span>
              </label>
            </div>
          </div>

          {/* Refund Amount */}
          {refundType === 'partial' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  min="0"
                  max={orderTotal}
                  step="0.01"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum: ₨{orderTotal}
              </p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Refund
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter reason for refund..."
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Warning:</p>
                <p>This action cannot be undone. The order will be marked as refunded.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRefund}
            disabled={processing || refundAmount <= 0 || refundAmount > orderTotal}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : `Process ₨${refundAmount} Refund`}
          </button>
        </div>
      </div>
    </div>
  )
}
