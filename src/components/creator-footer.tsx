'use client'

import { CREATOR_NAME, CREATOR_SITE, CREATOR_X, CREATOR_NEWSLETTER } from '@/lib/creator'
import { trackEvent } from '@/lib/analytics-client'

export function CreatorFooter() {
  const handleClick = (type: 'site' | 'x' | 'newsletter') => {
    const eventMap = {
      site: 'click_creator_site',
      x: 'click_creator_x',
      newsletter: 'click_creator_newsletter',
    } as const
    trackEvent(eventMap[type])
  }

  return (
    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
      <span>Built by</span>
      <a
        href={CREATOR_SITE}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleClick('site')}
        className="text-gray-600 hover:text-gray-900 transition-colors"
      >
        {CREATOR_NAME}
      </a>
      <span className="text-gray-300">·</span>
      <a
        href={CREATOR_X}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleClick('x')}
        className="text-gray-500 hover:text-gray-900 transition-colors"
      >
        X
      </a>
      <span className="text-gray-300">·</span>
      <a
        href={CREATOR_NEWSLETTER}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleClick('newsletter')}
        className="text-gray-500 hover:text-gray-900 transition-colors"
      >
        Newsletter
      </a>
    </div>
  )
}
