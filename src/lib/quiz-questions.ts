export interface QuizOption {
  value: string
  label: string
}

export interface QuizQuestion {
  id: string
  question: string
  type: 'single' | 'multi' | 'text'
  options?: QuizOption[]
  skippable?: boolean
  maxSelections?: number
  placeholder?: string
  maxLength?: number
  helperText?: string
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'audience_mode',
    question: 'What are you here for?',
    type: 'single',
    helperText: 'Why we ask: This determines whether we match you to personal productivity tools (consumer) or business ideas you can monetize (builder). Choose carefully — it significantly changes your results.',
    options: [
      { value: 'consumer', label: 'A simple tool for my personal life (normal user)' },
      { value: 'builder', label: 'A product idea I can build and sell (builder)' },
    ],
  },
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
    question: "What's your comfort level with coding or no-code tools?",
    type: 'single',
    options: [
      { value: 'none', label: "I can't code and don't want to learn" },
      { value: 'nocode', label: 'I can use no-code tools (Webflow, Bubble, etc.)' },
      { value: 'some', label: 'I can code simple things or copy/paste code' },
      { value: 'dev', label: "I'm a developer" },
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
    question: "What's your revenue goal in the next 6 months?",
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
      { value: 'freelance', label: "I'll outsource dev/design work" },
      { value: 'cofounder', label: 'Looking for a cofounder' },
    ],
  },
  {
    id: 'interest_themes',
    question: 'What topics interest you most?',
    type: 'multi',
    maxSelections: 3,
    skippable: true,
    options: [
      { value: 'money', label: 'Money / budgeting / saving' },
      { value: 'health', label: 'Health / fitness' },
      { value: 'career', label: 'Career / productivity' },
      { value: 'tech', label: 'Tech / tools' },
      { value: 'gaming', label: 'Gaming' },
      { value: 'shopping', label: 'Shopping / deals' },
      { value: 'home', label: 'Home / DIY' },
      { value: 'learning', label: 'Learning / education' },
      { value: 'travel', label: 'Travel' },
      { value: 'none', label: 'No preference' },
    ],
  },
  {
    id: 'avoid_list',
    question: 'What do you want to avoid in your business?',
    type: 'multi',
    maxSelections: 4,
    skippable: true,
    options: [
      { value: 'calls', label: 'Calls / demos' },
      { value: 'social', label: 'Social media posting' },
      { value: 'support', label: 'Customer support' },
      { value: 'content', label: 'Writing content / SEO' },
      { value: 'ads', label: 'Ads management' },
      { value: 'community', label: 'Building a community' },
      { value: 'integrations', label: 'Integrations / APIs' },
      { value: 'none', label: 'No strong avoids' },
    ],
  },
  {
    id: 'quit_reason',
    question: 'What usually makes you quit a side project?',
    type: 'single',
    options: [
      { value: 'motivation', label: 'I lose motivation after the initial excitement' },
      { value: 'stuck', label: 'I get stuck on technical problems' },
      { value: 'no_users', label: "I can't find users or customers" },
      { value: 'time', label: 'Life gets busy and I run out of time' },
      { value: 'never', label: "I usually don't quit - I ship things" },
    ],
  },
  {
    id: 'distribution_comfort',
    question: 'How comfortable are you getting customers?',
    type: 'single',
    options: [
      { value: 'seo', label: 'SEO / Content - I can write and wait for organic traffic' },
      { value: 'communities', label: 'Communities - I can engage in Reddit, Discord, forums' },
      { value: 'ads', label: 'Paid ads - I can spend money to test demand' },
      { value: 'partnerships', label: 'Partnerships - I can reach out to influencers/businesses' },
      { value: 'unsure', label: "I'm not sure - this is my weak spot" },
    ],
  },
  {
    id: 'audience_access',
    question: 'Do you have access to any of these audiences already?',
    type: 'multi',
    maxSelections: 3,
    skippable: true,
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
    question: "What's your risk tolerance for launching?",
    type: 'single',
    options: [
      { value: 'low', label: 'Low - I need validation before building anything' },
      { value: 'medium', label: "Medium - I'll build a quick MVP to test" },
      { value: 'high', label: "High - I'll ship fast and figure it out" },
    ],
  },
  {
    id: 'existing_skills',
    question: 'What skills do you bring to the table?',
    type: 'multi',
    maxSelections: 3,
    skippable: true,
    options: [
      { value: 'design', label: 'Design / UI' },
      { value: 'marketing', label: 'Marketing / Growth' },
      { value: 'sales', label: 'Sales' },
      { value: 'writing', label: 'Writing / Content' },
      { value: 'coding', label: 'Coding' },
      { value: 'ops', label: 'Operations / Systems' },
    ],
  },
  {
    id: 'optional_notes',
    question: 'Anything you absolutely want to avoid or include?',
    type: 'text',
    skippable: true,
    placeholder: 'e.g., "No subscriptions", "Chrome extension only", "Needs to work with FB ads", "No B2B"',
    maxLength: 200,
  },
]

export type QuizAnswers = {
  [key: string]: string | string[]
}
