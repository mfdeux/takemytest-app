import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";
import { z } from "zod";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

const systemBasePromptImage = `You are an expert exam assistant. You receive ONE image and must:
(1) detect whether it contains a test/exam question,
(2) if it is a question, extract the stem and any choices,
(3) answer strictly from visible content (allow basic stable knowledge only if explicitly required),
(4) return JSON matching the schema exactly (no extra text).

Rules:
- If the image is NOT a question (e.g., random photo, page header, unrelated diagram), set classification to "not_a_question".
- If the question requires a short/open-ended answer (no options), use type="short_answer" and provide a concise answer string.
- If the question is True/False, use type="boolean".
- If it has multiple choices and says "select all that apply", use type="multi".
- Be careful with NEGATIONS (NOT/EXCEPT) and units.
- Do NOT reveal chain-of-thought. Just give a brief, verifiable justification (≤2 short sentences).

TASKS:
1) Classify the image: "question" or "not_a_question".
2) If "question": extract the stem and any options; then answer.
3) Return ONLY JSON that matches the schema.

CONSTRAINTS:
- Use letters A/B/C/D... for options if present; else auto-assign A,B,C... in reading order.
- "confidence" is a probability in [0,1].
- If no options and a short textual answer is needed → type="short_answer".

SCHEMA (JSON):
{
  "classification": "question|not_a_question",
  "question_text": "string|null",
  "options": [
    { "id": "A", "text": "string" }
    // ... empty array if no options
  ],
  "answer": {
    "type": "single|multi|numeric|boolean|short_answer",
    "selected": ["A","C"],       // for single/multi only; [] otherwise
    "numeric_answer": null,      // number for numeric else null
    "boolean_answer": null,      // true/false for boolean else null
    "short_answer": null,        // short string for short_answer else null
    "confidence": 0.0
  },
  "justification": "string (<= 2 short sentences, no chain-of-thought).",
  "image_quality": "good|fair|poor",
  "metadata": {
    "multi_select_instructions_found": true|false,
    "negation_detected": true|false,
    "units_key": "string|null",
    "requires_counting_or_geometry": true|false
  }
}`;

const systemBasePromptText = `You are an expert exam assistant. You receive text from a user and must:
(1) detect whether it contains a test/exam question,
(2) if it is a question, extract the stem and any choices,
(3) answer strictly from visible content (allow basic stable knowledge only if explicitly required),
(4) return JSON matching the schema exactly (no extra text).

Rules:
- If the text is NOT a question (e.g., random photo, page header, unrelated diagram), set classification to "not_a_question".
- If the question requires a short/open-ended answer (no options), use type="short_answer" and provide a concise answer string.
- If the question is True/False, use type="boolean".
- If it has multiple choices and says "select all that apply", use type="multi".
- Be careful with NEGATIONS (NOT/EXCEPT) and units.
- Do NOT reveal chain-of-thought. Just give a brief, verifiable justification (≤2 short sentences).

TASKS:
1) Classify the text: "question" or "not_a_question".
2) If "question": extract the stem and any options; then answer.
3) Return ONLY JSON that matches the schema.

CONSTRAINTS:
- Use letters A/B/C/D... for options if present; else auto-assign A,B,C... in reading order.
- "confidence" is a probability in [0,1].
- If no options and a short textual answer is needed → type="short_answer".

SCHEMA (JSON):
{
  "classification": "question|not_a_question",
  "question_text": "string|null",
  "options": [
    { "id": "A", "text": "string" }
    // ... empty array if no options
  ],
  "answer": {
    "type": "single|multi|numeric|boolean|short_answer",
    "selected": ["A","C"],       // for single/multi only; [] otherwise
    "numeric_answer": null,      // number for numeric else null
    "boolean_answer": null,      // true/false for boolean else null
    "short_answer": null,        // short string for short_answer else null
    "confidence": 0.0
  },
  "justification": "string (<= 2 short sentences, no chain-of-thought).",
  "metadata": {
    "multi_select_instructions_found": true|false,
    "negation_detected": true|false,
    "units_key": "string|null",
    "requires_counting_or_geometry": true|false
  }
}`;

const systemBasePrompt_Quick = `You are an expert exam assistant. You receive ONE image and must:
(1) detect whether it contains a test/exam question,
(2) if it is a question, extract the stem and any choices,
(3) answer strictly from visible content (allow basic stable knowledge only if explicitly required),
(4) return JSON matching the schema exactly (no extra text).

Rules:
- If the image is NOT a question (e.g., random photo, page header, unrelated diagram), set classification to "not_a_question".
- If the question requires a short/open-ended answer (no options), use type="short_answer" and provide a concise answer string.
- If the question is True/False, use type="boolean".
- If it has multiple choices and says "select all that apply", use type="multi".
- Be careful with NEGATIONS (NOT/EXCEPT) and units.
- Do NOT reveal chain-of-thought. Just give a brief, verifiable justification (≤2 short sentences).

TASKS:
1) Classify the image: "question" or "not_a_question".
2) If "question": extract the stem and any options; then answer.
3) Return ONLY JSON that matches the schema.

CONSTRAINTS:
- Use letters A/B/C/D... for options if present; else auto-assign A,B,C... in reading order.
- "confidence" is a probability in [0,1].
- If no options and a short textual answer is needed → type="short_answer".

SCHEMA (JSON):
{
  "classification": "question|not_a_question",
  "answer": {
    "type": "single|multi|numeric|boolean|short_answer",
    "selected": ["A","C"],       // for single/multi only; [] otherwise
    "numeric_answer": null,      // number for numeric else null
    "boolean_answer": null,      // true/false for boolean else null
    "short_answer": null,        // short string for short_answer else null
    "confidence": 0.0
  },
  "justification": "string (<= 2 short sentences, no chain-of-thought).",
}`;

export async function analyzeTestQuestionImage({
  imageUrl,
}: {
  imageUrl: string;
}) {
  const { output, usage } = await generateText({
    model: openrouter.chat("x-ai/grok-4-fast"),
    output: Output.object({
      schema: z.object({
        classification: z.enum(["question", "not_a_question"]),
        question_text: z.string().nullable(),
        options: z.array(
          z.object({
            id: z.string(),
            text: z.string(),
          })
        ),
        answer: z.object({
          type: z.enum([
            "single",
            "multi",
            "numeric",
            "boolean",
            "short_answer",
            "abstain",
          ]),
          selected: z.array(z.string()),
          numeric_answer: z.number().nullable(),
          boolean_answer: z.boolean().nullable(),
          short_answer: z.string().nullable(),
          confidence: z.number(),
        }),
        justification: z.string(),
        image_quality: z.enum(["good", "fair", "poor"]),
        metadata: z.object({
          multi_select_instructions_found: z.boolean(),
          negation_detected: z.boolean(),
          units_key: z.string().nullable(),
          requires_counting_or_geometry: z.boolean(),
        }),
      }),
    }),
    messages: [
      { role: "system", content: systemBasePromptImage },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Please analyze the image attached.`,
          },
          {
            type: "image",
            image: imageUrl,
          },
        ],
      },
    ],
  });
  return { output, usage };
}

export async function analyzeTestQuestionText({ text }: { text: string }) {
  const { output, usage } = await generateText({
    model: openrouter.chat("x-ai/grok-4-fast"),
    output: Output.object({
      schema: z.object({
        classification: z.enum(["question", "not_a_question"]),
        question_text: z.string().nullable(),
        options: z.array(
          z.object({
            id: z.string(),
            text: z.string(),
          })
        ),
        answer: z.object({
          type: z.enum([
            "single",
            "multi",
            "numeric",
            "boolean",
            "short_answer",
            "abstain",
          ]),
          selected: z.array(z.string()),
          numeric_answer: z.number().nullable(),
          boolean_answer: z.boolean().nullable(),
          short_answer: z.string().nullable(),
          confidence: z.number(),
        }),
        justification: z.string(),
        metadata: z.object({
          multi_select_instructions_found: z.boolean(),
          negation_detected: z.boolean(),
          units_key: z.string().nullable(),
          requires_counting_or_geometry: z.boolean(),
        }),
      }),
    }),
    messages: [
      { role: "system", content: systemBasePromptText },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Please analyze the following text.`,
          },
          {
            type: "text",
            text: text,
          },
        ],
      },
    ],
  });
  return { output, usage };
}

export async function analyzeTestQuestionImage_Quick({
  imageUrl,
}: {
  imageUrl: string;
}) {
  const { output, usage } = await generateText({
    model: openrouter.chat("x-ai/grok-4-fast"),
    output: Output.object({
      schema: z.object({
        classification: z.enum(["question", "not_a_question"]),
        answer: z.object({
          type: z.enum([
            "single",
            "multi",
            "numeric",
            "boolean",
            "short_answer",
            "abstain",
          ]),
          selected: z.array(z.string()),
          numeric_answer: z.number().nullable(),
          boolean_answer: z.boolean().nullable(),
          short_answer: z.string().nullable(),
          confidence: z.number(),
        }),
        justification: z.string(),
      }),
    }),
    messages: [
      { role: "system", content: systemBasePrompt_Quick },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Please analyze the image attached.`,
          },
          {
            type: "image",
            image: imageUrl,
          },
        ],
      },
    ],
  });
  return { output, usage };
}
