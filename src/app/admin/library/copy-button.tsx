'use client'

import { useState } from 'react'

interface CopyButtonProps {
  data: Record<string, unknown>
}

export function CopyButton({ data }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs transition-colors"
    >
      {copied ? 'Copied!' : 'Copy JSON'}
    </button>
  )
}
