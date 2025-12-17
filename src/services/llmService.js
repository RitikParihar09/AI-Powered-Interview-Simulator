/* src/services/llmService.js */

// ------------------------------------------------------------------
// 🔴 PASTE YOUR OPENROUTER KEY HERE
// ------------------------------------------------------------------
const OPENROUTER_API_KEY = "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";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001"; // Fast & Smart

// Fallback questions if API fails
const FALLBACK_QUESTIONS = [
  "Tell me about a challenging project you worked on recently.",
  "How do you handle debugging complex issues?",
  "What is your favorite programming language and why?",
  "Describe a time you disagreed with a teammate.",
  "How do you stay updated with the latest tech trends?"
];

/**
 * HELPER: Call OpenRouter API
 */
const callOpenRouter = async (messages) => {
  if (!OPENROUTER_API_KEY) {
    console.warn("⚠️ No API Key. Returning fallback.");
    return null;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Optional: Site URL and Name for OpenRouter rankings
        "HTTP-Referer": "http://localhost:5173", 
        "X-Title": "Interview Buddy" 
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("🚨 OpenRouter Error:", data.error.message);
      return null;
    }

    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error("🚨 Network Error:", error);
    return null;
  }
};

// ------------------------------------------------------------------
// 🚀 EXPORTED FUNCTIONS
// ------------------------------------------------------------------

export const getInitialQuestion = async (role) => {
  const messages = [
    {
      role: "system",
      content: `You are an expert technical interviewer. Ask exactly one short, professional opening question for a "${role}" position. Do NOT say "Hello" or "Welcome". Just ask the question.`
    }
  ];
  
  const response = await callOpenRouter(messages);
  return response || "Tell me about yourself and your background.";
};

export const getNextQuestion = async ({ lastAnswer, history }) => {
  // Convert your app's history format to OpenRouter format
  // App uses: { role: 'model' | 'user', parts: [{ text: '...' }] }
  // OpenRouter needs: { role: 'assistant' | 'user', content: '...' }
  
  const contextMessages = history.map(h => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0].text
  }));

  const messages = [
    {
      role: "system",
      content: `You are a technical interviewer. 
      Task: Ask exactly ONE concise follow-up technical question based on the candidate's last answer.
      Constraints: 
      - Keep it under 20 words.
      - No greetings (e.g., "That's great", "Okay").
      - If the candidate says "stop" or "end", reply with: <<END_INTERVIEW>>.`
    },
    ...contextMessages,
    {
      role: "user",
      content: lastAnswer
    }
  ];

  const response = await callOpenRouter(messages);
  
  if (!response) {
    return FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
  }

  // Clean up prefixes if any
  return response.replace(/^AI:\s*/i, "").replace(/^Interviewer:\s*/i, "");
};