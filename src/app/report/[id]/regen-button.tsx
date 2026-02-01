'use client'

import { useRouter } from 'next/navigation'

interface RegenButtonProps {
  reportId: string
  remaining: number
}

export default function RegenButton({ reportId, remaining }: RegenButtonProps) {
  const router = useRouter()

  const handleRegen = () => {
    if (remaining <= 0) {
      alert('No regenerations remaining')
      return
    }

    // Clear any existing quiz state and start fresh
    localStorage.removeItem('ideamatch-quiz-answers')

    // Store report ID for regeneration
    sessionStorage.setItem('ideamatch-regen-report', reportId)

    router.push('/quiz')
  }

  return (
    <button
      onClick={handleRegen}
      disabled={remaining <= 0}
      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
        remaining > 0
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
      }`}
    >
      Retake Quiz ({remaining} left)
    </button>
  )
}
