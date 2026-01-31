import ResultsClient from './results-client'

// Force dynamic rendering to prevent edge caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ResultsPage() {
  return <ResultsClient />
}
