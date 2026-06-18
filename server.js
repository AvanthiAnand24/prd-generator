import express from 'express'
import cors from 'cors'
import Groq from 'groq-sdk'
import { Client } from '@notionhq/client'
import * as dotenv from 'dotenv'
dotenv.config()

const app = express()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const notion = new Client({ auth: process.env.NOTION_TOKEN })

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ status: 'PRD Generator API is running' })
})

const PRD_SYSTEM_PROMPT = `You are an expert Product Manager who writes world-class Product Requirements Documents (PRDs).

When given a rough idea, bullet points, or voice note transcript, you produce a structured PRD with these exact sections:

## 1. Problem Statement
What problem does this solve? Who has this problem?

## 2. Target Users
Primary user personas with their goals and pain points.

## 3. Product Overview
One paragraph describing the solution clearly.

## 4. User Stories
Format: "As a [user type], I want to [action] so that [benefit]"
Write 5-8 user stories covering the core flows.

## 5. Functional Requirements
Numbered list of specific features the product must have.

## 6. Edge Cases & Error States
Things that could go wrong and how the product should handle them.

## 7. Success Metrics
3-5 measurable KPIs to track if this product is working.

## 8. Open Questions
Unresolved decisions the team needs to make before building.

## 9. Out of Scope (v1)
What you're explicitly NOT building in the first version.

Be specific, actionable, and think like a senior PM.`

app.post('/generate', async (req, res) => {
  const { idea } = req.body

  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter an idea before generating.' })
  }

  if (idea.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide a bit more detail about your idea.' })
  }

  if (idea.length > 5000) {
    return res.status(400).json({ error: 'Idea is too long. Please keep it under 5000 characters.' })
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: PRD_SYSTEM_PROMPT },
        { role: 'user', content: `Here's my rough idea. Turn it into a full PRD:\n\n${idea}\n\nAlso, before the PRD content, output a single line in this exact format:\nTITLE: [a clean 4-8 word product name based on the idea]\n\nThen output the PRD sections after that.` }
      ],
      max_tokens: 2000,
    })

    const fullResponse = response.choices[0].message.content

    // Split the title from the PRD content
    const lines = fullResponse.split('\n')
    const titleLine = lines.find(line => line.startsWith('TITLE:'))
    const title = titleLine 
      ? titleLine.replace('TITLE:', '').trim() 
      : 'Generated PRD'
    
    const prd = lines
      .filter(line => !line.startsWith('TITLE:'))
      .join('\n')
      .trim()

    res.json({ prd, title })

  // } catch (err) {
  //   console.error(err)
  //   res.status(500).json({ error: 'Failed to generate PRD' })
  // }

} catch (err) {
  console.error('Generate error:', err.message)

  // Groq-specific errors often have a status code we can check
  if (err.status === 429) {
    return res.status(429).json({ 
      error: 'Rate limit reached. Please wait a moment and try again.' 
    })
  }

  if (err.status === 401) {
    return res.status(500).json({ 
      error: 'Server configuration error. Please contact the developer.' 
    })
  }

  res.status(500).json({ 
    error: 'Something went wrong generating your PRD. Please try again.' 
  })
}
})

app.post('/export-notion', async (req, res) => {
  const { prd, title } = req.body

  if (!prd || typeof prd !== 'string' || prd.trim().length === 0) {
    return res.status(400).json({ error: 'No PRD content to export. Generate a PRD first.' })
  }

  try {
    // Split the PRD into sections so Notion renders it nicely
    const lines = prd.split('\n').filter(line => line.trim() !== '')

    const blocks = lines.map(line => {
      // If the line starts with ## it's a heading
      if (line.startsWith('## ')) {
        return {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: line.replace('## ', '') } }]
          }
        }
      }
      // Everything else is a paragraph
      return {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line } }]
        }
      }
    })

    const response = await notion.pages.create({
      parent: { page_id: process.env.NOTION_PAGE_ID },
      properties: {
        title: {
          title: [{ text: { content: title || 'Generated PRD' } }]
        }
      },
      children: blocks
    })

    res.json({ url: response.url })

  } catch (err) {
    console.error('Notion export error:', err.message)

    if (err.code === 'unauthorized') {
      return res.status(500).json({ 
        error: 'Notion connection issue. Please contact the developer.' 
      })
    }

    res.status(500).json({ 
      error: 'Failed to export to Notion. Please try again.' 
    })
}
})

app.listen(3001, () => {
  console.log('✅ Server running on http://localhost:3001')
})