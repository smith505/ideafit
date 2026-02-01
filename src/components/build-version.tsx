'use client'

export function BuildVersion() {
  const sha = process.env.NEXT_PUBLIC_BUILD_SHA || process.env.RAILWAY_GIT_COMMIT_SHA || 'dev'
  const shortSha = sha.slice(0, 7)

  return (
    <span className="text-gray-500 text-xs">
      Build: {shortSha}
    </span>
  )
}
