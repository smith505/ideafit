'use client'

import { useState } from 'react'

interface CheckoutButtonProps {
  reportId: string
  email: string
}

export default function CheckoutButton({ reportId, email }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, email }),
      })

      if (!res.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await res.json()
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full py-4 rounded-xl font-semibold text-lg transition-all bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:bg-gray-200 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Processing...
        </span>
      ) : (
        'Unlock Full Report — $49'
      )}
    </button>
  )
}
