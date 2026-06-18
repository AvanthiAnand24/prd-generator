import Groq from "groq-sdk";
import * as dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

Be specific, actionable, and think like a senior PM.`;

async function generatePRD(roughIdea) {
  console.log("\n⏳ Generating your PRD...\n");
  console.log("=".repeat(60));

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: PRD_SYSTEM_PROMPT },
      { role: "user", content: `Here's my rough idea. Turn it into a full PRD:\n\n${roughIdea}` }
    ],
    max_tokens: 2000,
  });

  console.log(response.choices[0].message.content);
  console.log("\n" + "=".repeat(60));
  console.log("✅ PRD generated!");
}

const myIdea = `
a product requirement document generator using groq API
if I give any idea for a product as rough notes or voice or a file, 
I want the compelete written prd for that rough idea
`;

generatePRD(myIdea);