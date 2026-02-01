import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quick Fit Quiz | IdeaMatch',
  description:
    'Take our ~7 minute quiz about your time, skills, and goals to find your best startup idea match. Free, no account required.',
  openGraph: {
    title: 'Quick Fit Quiz | IdeaMatch',
    description:
      'Take our ~7 minute quiz to find your best startup idea match. Free, no account required.',
    type: 'website',
  },
  twitter: {
    title: 'Quick Fit Quiz | IdeaMatch',
    description:
      'Take our ~7 minute quiz to find your best startup idea match. Free, no account required.',
  },
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children
}
