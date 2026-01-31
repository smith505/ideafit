import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/ask-gpt.ts "your message" [image_path]')
    process.exit(1)
  }

  const message = args[0]
  const imagePath = args[1]

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  // System prompt for design collaboration
  messages.push({
    role: 'system',
    content: `You are a senior product designer and developer reviewing a SaaS product called IdeaFit.
IdeaFit helps aspiring founders find their best startup idea through a quiz that matches them to validated ideas from a curated library.

The flow is: Landing → Quiz (8 questions) → Email gate → Preview (shows top match) → Paywall ($49) → Full Report

When reviewing designs or code:
- Be specific and actionable
- Focus on conversion, clarity, and user experience
- Suggest concrete improvements with examples
- Keep responses concise but thorough`
  })

  // Build user message with optional image
  if (imagePath && fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath)
    const base64Image = imageBuffer.toString('base64')
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg'

    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: message },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`,
          },
        },
      ],
    })
  } else {
    messages.push({
      role: 'user',
      content: message,
    })
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 2000,
    })

    console.log(response.choices[0].message.content)
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message)
    }
    process.exit(1)
  }
}

main()
