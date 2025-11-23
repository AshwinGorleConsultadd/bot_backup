// index.js - Vercel Serverless Node API
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    try {
        const { prompt, knowledgeBase, summary } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Missing prompt" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
                topK: 40,
                topP: 0.95
            }
        });

        const systemPrompt = `
You are a helpful university assistant chatbot.

UNIVERSITY CONTEXT:
${summary}

KNOWLEDGE BASE:
${knowledgeBase}

INSTRUCTIONS:
0. Output in clean structured Markdown with headings, bullets, lists.
1. First answer using KNOWLEDGE BASE.
2. If info missing, use UNIVERSITY CONTEXT.
3. If still not found, say you don't know.
4. Keep answers friendly & precise.
5. Prefer bullet points always.
User Question: ${prompt}
        `;

        const result = await model.generateContent(systemPrompt);
        const text = result.response.text();

        return res.status(200).json({ reply: text });

    } catch (error) {
        console.error("Gemini Server Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
