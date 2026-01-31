export interface QuizOption {
  value: string
  label: string
}

export interface QuizQuestion {
  id: string
  question: string
  type: 'single' | 'multi'
  options: QuizOption[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'time_weekly',
    question: 'How many hours per week can you dedicate to building?',
    type: 'single',
    options: [
      { value: '2-5', label: '2-5 hours' },
      { value: '6-10', label: '6-10 hours' },
      { value: '11-20', label: '11-20 hours' },
      { value: '20+', label: '20+ hours (nearly full-time)' },
    ],
  },
  {
    id: 'tech_comfort',
    question: 'What\'s your comfort level with coding or no-code tools?',
    type: 'single',
    options: [
      { value: 'none', label: 'I can\'t code and don\'t want to learn' },
      { value: 'nocode', label: 'I can use no-code tools (Webflow, Bubble, etc.)' },
      { value: 'some', label: 'I can code simple things or copy/paste code' },
      { value: 'dev', label: 'I\'m a developer' },
    ],
  },
  {
    id: 'support_tolerance',
    question: 'How much customer support are you willing to do?',
    type: 'single',
    options: [
      { value: 'none', label: 'Zero - I want something passive' },
      { value: 'low', label: 'Minimal - async email only' },
      { value: 'medium', label: 'Some - a few hours per week' },
      { value: 'high', label: 'Whatever it takes to grow' },
    ],
  },
  {
    id: 'revenue_goal',
    question: 'What\'s your revenue goal in the next 6 months?',
    type: 'single',
    options: [
      { value: 'side', label: '$500-1k/mo (side income)' },
      { value: 'ramen', label: '$2-5k/mo (ramen profitable)' },
      { value: 'salary', label: '$5-10k/mo (replace salary)' },
      { value: 'scale', label: '$10k+/mo (scale mode)' },
    ],
  },
  {
    id: 'build_preference',
    question: 'How do you prefer to build?',
    type: 'single',
    options: [
      { value: 'solo', label: 'Solo - I do everything myself' },
      { value: 'ai', label: 'Solo + AI assistants (ChatGPT, Claude, etc.)' },
      { value: 'freelance', label: 'I\'ll outsource dev/design work' },
      { value: 'cofounder', label: 'Looking for a cofounder' },
    ],
  },
  {
    id: 'audience_access',
    question: 'Do you have access to any of these audiences already?',
    type: 'multi',
    options: [
      { value: 'developers', label: 'Developers / tech people' },
      { value: 'smb', label: 'Small business owners' },
      { value: 'creators', label: 'Creators / influencers' },
      { value: 'enterprise', label: 'Enterprise / corporate contacts' },
      { value: 'none', label: 'No existing audience' },
    ],
  },
  {
    id: 'risk_tolerance',
    question: 'What\'s your risk tolerance for launching?',
    type: 'single',
    options: [
      { value: 'low', label: 'Low - I need validation before building anything' },
      { value: 'medium', label: 'Medium - I\'ll build a quick MVP to test' },
      { value: 'high', label: 'High - I\'ll ship fast and figure it out' },
    ],
  },
  {
    id: 'existing_skills',
    question: 'What skills do you bring to the table? (select all that apply)',
    type: 'multi',
    options: [
      { value: 'design', label: 'Design / UI' },
      { value: 'marketing', label: 'Marketing / Growth' },
      { value: 'sales', label: 'Sales' },
      { value: 'writing', label: 'Writing / Content' },
      { value: 'coding', label: 'Coding' },
      { value: 'ops', label: 'Operations / Systems' },
    ],
  },
]

export type QuizAnswers = {
  [key: string]: string | string[]
}
