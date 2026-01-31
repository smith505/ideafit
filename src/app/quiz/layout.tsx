import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quick Fit Quiz | IdeaFit',
  description:
    'Answer 8 quick questions about your time, skills, and goals to find your best startup idea match. Free quiz, no account required.',
  openGraph: {
    title: 'Quick Fit Quiz | IdeaFit',
    description:
      'Answer 8 quick questions to find your best startup idea match. Free quiz, no account required.',
    type: 'website',
  },
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children
}
