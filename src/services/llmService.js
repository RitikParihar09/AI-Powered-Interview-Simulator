/* src/services/llmService.js */

import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../firebase/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

// Configure PDF.js worker - use local package instead of CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// 🗝️ UNKILLABLE KEY ROTATION SYSTEM (Security-First)
const OPENROUTER_KEYS = [
  (import.meta.env.VITE_OPENROUTER_API_KEY || "").trim(),
  (import.meta.env.VITE_OPENROUTER_API_KEY_2 || "").trim(),
  (import.meta.env.VITE_OPENROUTER_API_KEY_3 || "").trim(),
  (import.meta.env.VITE_OPENROUTER_API_KEY_4 || "").trim(),
].filter(k => k !== "");

let currentKeyIndex = 0;
console.log("🛡️ Ironclad Engine initialized with", OPENROUTER_KEYS.length, "security-loaded keys.");

const API_URL = "/api/aicredits/v1/chat/completions";
const MODEL = "gpt-4o-mini"; // Premium OpenAI model via AICredits - extremely fast and cheap

// Fallback questions if API fails
const FALLBACK_QUESTIONS = [
  "Tell me about a challenging project you worked on recently.",
  "How do you handle debugging complex issues?",
  "What is your favorite programming language and why?",
  "Describe a time you disagreed with a teammate.",
  "How do you stay updated with the latest tech trends?"
];

/**
 * HELPER: Parse resume text from PDF file
 */
export const parseResumeText = async (file) => {
  if (!file) return null;

  try {
    // Only handle PDF files for now
    if (file.type !== 'application/pdf') {
      console.warn("⚠️ Only PDF files are supported for resume parsing");
      return null;
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    console.log("✅ Resume parsed successfully:", fullText.substring(0, 200) + "...");
    return fullText.trim();

  } catch (error) {
    console.error("🚨 Resume parsing error:", error);
    return null;
  }
};

/**
 * 📄 STEP 1: PARSE RESUME TO STRUCTURED JSON
 */
export const parseResumeToJSON = async (rawText) => {
  if (!rawText) return null;
  const prompt = `Analyze this raw resume text and extract key information into a structured JSON format.
  
  FORMAT:
  {
    "skills": [string],
    "experience": [{ "role": string, "company": string, "highlights": [string] }],
    "projects": [{ "title": string, "technologies": [string], "description": string }],
    "summary": string
  }

  RESUME TEXT:
  ${rawText}`;

  try {
    console.log("🧠 Converting resume text to structured JSON...");
    // 🚩 Switching to callOpenRouter to use the fresh key (it will still fallback to Studio if needed)
    const response = await callOpenRouter([{ role: "user", content: prompt }], 2500); 
    const data = safeParseJSON(response);
    return data || { skills: [], experience: [], projects: [], summary: "Failed to parse" };
  } catch (error) {
    console.error("Resume Parsing Failed:", error);
    return { skills: [], experience: [], projects: [], summary: "Failed to parse" };
  }
};

/**
 * 🎯 STEP 2: GENERATE BATCH QUESTIONS (RESUME + ROLE + COMPANY)
 */
export const generateResumeBasedQuestions = async (parsedResume, role, company) => {
  const prompt = `You are an expert interviewer for ${company} hiring for a ${role} position.
  Based on the candidate's structured resume, generate a batch of 5-6 high-quality technical questions.
  
  For EACH question, provide:
  1. The main question
  2. A potential follow-up question
  3. The expected answer for both (briefly)
  
  CANDIDATE PROFILE:
  ${JSON.stringify(parsedResume, null, 2)}

  OUTPUT FORMAT (JSON ONLY):
  {
    "questions": [
      {
        "question": "string",
        "expectedAnswer": "string",
        "followUp": {
          "question": "string",
          "expectedAnswer": "string"
        }
      }
    ]
  }`;

  try {
    console.log("🎯 Generating batch of 5-6 resume-based questions...");
    // 🚩 Switching to callOpenRouter to use the fresh key
    const response = await callOpenRouter([{ role: "user", content: prompt }], 2000); 
    const data = safeParseJSON(response);
    if (!data || !data.questions) return [];
    return data.questions.map(q => ({ ...q, source: 'ai_resume' }));
  } catch (error) {
    console.error("Batch Question Generation Failed:", error);
    return [];
  }
};

/**
 * HELPER: Call Gemini directly via Google AI Studio as fallback
 */
const callGeminiDirect = async (messages, maxTokens = 500) => {
  const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
  if (!GEMINI_API_KEY) {
    console.warn("⚠️ No Gemini API Key found for fallback.");
    return null;
  }
  
  console.log("🔄 Initiating Fallback to Google AI Studio (Gemini directly)");
  
  try {
    // Separate system prompt from user/assistant messages for Gemini format
    let systemInstruction = null;
    const contents = [];
    
    for (const msg of messages) {
      if (msg.role === "system") {
        systemInstruction = { parts: [{ text: msg.content }] };
      } else {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }
    }
    // Use standard 2.0 flash URL for the free tier
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = { contents };
    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }
    
    requestBody.generationConfig = { maxOutputTokens: maxTokens };

    let response;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        
        if (response.status === 429) {
            console.warn(`⏳ Gemini Rate Limited (429). Cooling down for 2 seconds... (Attempt ${attempt}/${maxRetries})`);
            await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds to retry
            continue;
        }
        
        // Break out of the loop if it's a success or a non-retryable error
        break;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`🚨 Gemini Fallback Error (${response.status}):`, errorData);
      return null;
    }
    
    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    return null;
  } catch (error) {
    console.error("🚨 Gemini Fallback Network Error:", error);
    return null;
  }
};

/**
 * HELPER: Call OpenRouter API with UNKILLABLE Key Rotation
 */
export const callOpenRouter = async (messages, maxTokens = 1000, systemInstruction = null) => {
  // 🔄 Try every available key in the rotation before giving up
  for (let i = 0; i < OPENROUTER_KEYS.length; i++) {
    const keyIndex = (currentKeyIndex + i) % OPENROUTER_KEYS.length;
    const activeKey = OPENROUTER_KEYS[keyIndex];

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeKey}`,
          "HTTP-Referer": window.location.href,
          "X-Title": "AI Interview Simulator",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          max_tokens: maxTokens,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`⚠️ Key #${keyIndex + 1} failed (${response.status}):`, errorData.error?.message || "Unknown error");
        continue; // Try next key
      }

      currentKeyIndex = keyIndex; // Stick with the working key
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error(`🚨 Network error with Key #${keyIndex + 1}:`, error);
    }
  }

  // 🛡️ FINAL FALLBACK: If all OpenRouter keys fail, try Google Direct
  console.warn("🛡️ All OpenRouter keys exhausted. Initiating Final Fallback to Google AI Studio...");
  return await callGeminiDirect(messages, maxTokens, systemInstruction);
};

/**
 * HELPER: Clean and Parse JSON from AI response
 * Handles markdown backticks and common formatting issues
 */
const safeParseJSON = (text) => {
  if (!text) return null;
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    try {
      // 2. Try cleaning markdown backticks
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e2) {
      // 3. Last resort: Extract anything between the first { and last }
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e3) {
          console.error("Final JSON parse attempt failed", e3);
          return null;
        }
      }
      return null;
    }
  }
};

/**
 * 🗄️ TIERED DATABASE FALLBACK SYSTEM
 * Fetches questions from Firestore using a prioritized search strategy
 */
export const getQuestionBankQuestions = async (company, role, difficulty = 'Medium') => {
  try {
    const questionsRef = collection(db, 'questions');
    const snapshot = await getDocs(questionsRef);
    const allQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const targetDifficulty = difficulty?.toLowerCase() || 'medium';
    const targetRole = role?.toLowerCase();
    const targetCompany = company?.toLowerCase();

    // --- TIER 1: Perfect Match (Role + Company) ---
    let results = allQuestions.filter(q => 
      q.role?.toLowerCase() === targetRole && 
      q.company?.toLowerCase() === targetCompany &&
      q.difficulty?.toLowerCase() === targetDifficulty
    );

    // --- TIER 2: Role Match (Any Company) ---
    if (results.length < 5) {
      const roleMatches = allQuestions.filter(q => 
        q.role?.toLowerCase() === targetRole && 
        q.difficulty?.toLowerCase() === targetDifficulty &&
        !results.find(r => r.id === q.id) // No duplicates
      );
      results = [...results, ...roleMatches];
    }

    // --- TIER 3: Company Match (Any Role) ---
    if (results.length < 8) {
      const companyMatches = allQuestions.filter(q => 
        q.company?.toLowerCase() === targetCompany && 
        q.difficulty?.toLowerCase() === targetDifficulty &&
        !results.find(r => r.id === q.id)
      );
      results = [...results, ...companyMatches];
    }

    // --- TIER 4: Fundamentals Fallback (OS, DBMS, DSA) ---
    if (results.length < 10) {
      const fundamentalTopics = ['os', 'dbms', 'dsa', 'oops', 'sql', 'system design'];
      const fundamentalMatches = allQuestions.filter(q => 
        fundamentalTopics.some(topic => q.tags?.map(t => t.toLowerCase()).includes(topic)) &&
        q.difficulty?.toLowerCase() === targetDifficulty &&
        !results.find(r => r.id === q.id)
      );
      results = [...results, ...fundamentalMatches];
    }

    console.log(`✅ Tiered Search found ${results.length} questions from bank.`);
    return results.sort(() => 0.5 - Math.random()); // Randomize for variety
  } catch (error) {
    console.error("🚨 Tiered Database Fetch error:", error);
    return [];
  }
};

/**
 * HELPER: Fetch unique role names from question bank (Firestore)
 */
export const getRoleSuggestions = async (searchQuery = '') => {
  try {
    const questionsRef = collection(db, 'questions');
    const snapshot = await getDocs(questionsRef);
    
    const rolesSet = new Set();
    snapshot.docs.forEach(doc => {
      const role = doc.data().role;
      if (role && role.toLowerCase().includes(searchQuery.toLowerCase())) {
        rolesSet.add(role);
      }
    });

    return Array.from(rolesSet).sort().slice(0, 10); // Limit to top 10
  } catch (error) {
    console.error("🚨 Error fetching role suggestions:", error);
    return [];
  }
};

/**
 * HELPER: Fetch unique company names from question bank (Firestore)
 */
export const getCompanySuggestions = async (searchQuery = '') => {
  try {
    const questionsRef = collection(db, 'questions');
    const snapshot = await getDocs(questionsRef);
    
    const companiesSet = new Set();
    snapshot.docs.forEach(doc => {
      const company = doc.data().company;
      if (company && company.toLowerCase().includes(searchQuery.toLowerCase())) {
        companiesSet.add(company);
      }
    });

    return Array.from(companiesSet).sort().slice(0, 10); // Limit to top 10
  } catch (error) {
    console.error("🚨 Error fetching company suggestions:", error);
    return [];
  }
};

// ------------------------------------------------------------------
// 🚀 EXPORTED FUNCTIONS
// ------------------------------------------------------------------

/**
 * 🎯 EVALUATE CANDIDATE ANSWER
 */
export const evaluateAnswer = async (question, answer, expectedAnswer = "") => {
  const prompt = `You are a technical interview evaluator.
Evaluate the candidate's answer based on the question and the expected model answer.

QUESTION: ${question}
CANDIDATE ANSWER: ${answer}
EXPECTED MODEL ANSWER: ${expectedAnswer}

Provide:
1. A score from 0-10
2. Constructive feedback (max 2 sentences)
3. A better version of the answer (modelAnswer)

Only output JSON.

OUTPUT FORMAT:
{
  "score": number,
  "feedback": "string",
  "modelAnswer": "string"
}`;

  try {
    // 🚩 Reverting to OpenRouter as requested.
    const response = await callOpenRouter([{ role: "user", content: prompt }], 1000); 
    const data = safeParseJSON(response);
    return data || { score: 5, feedback: "Keep practicing!", modelAnswer: "Not available" };
  } catch (error) {
    console.error("🚨 Evaluation Failed:", error);
    return { score: 5, feedback: "Keep practicing!", modelAnswer: "Not available" };
  }
};


/**
 * 🧠 OPTIMIZED AI PROMPT (Follow-up Generator)
 * Generates follow-up questions in JSON format.
 */
export const generateFollowUpQuestions = async (question, answer, tags = []) => {
  const prompt = `You are an AI interview assistant.
Your job is to generate follow-up questions based on a candidate's answer.

INPUT:
Question: ${question}
User Answer: ${answer}
Expected Topics: ${tags?.join(', ') || ''}

IMPORTANT RULES:
- Generate maximum 2 follow-up questions
- For each question, provide a short "expectedAnswer" (model answer)
- Questions must be short, clear, and interview-style
- Only output JSON

OUTPUT FORMAT:
{
  "followups": [
    {
      "question": "Question text",
      "expectedAnswer": "Brief model answer"
    }
  ]
}`;

  try {
    // 🚩 Reverting to OpenRouter as requested.
    const response = await callOpenRouter([{ role: "user", content: prompt }], 1000); 
    const data = safeParseJSON(response);
    return data?.followups || []; // Returns array of {question, expectedAnswer}
  } catch (error) {
    console.error("🚨 Error in generateFollowUpQuestions:", error);
    return [];
  }
};

export const getInitialQuestion = async (role, resumeText = null, difficulty = 'Medium') => {
  let systemPrompt = `You are an expert technical interviewer. Ask exactly one short, professional opening question for a "${role}" position at a ${difficulty} difficulty level. Do NOT say "Hello" or "Welcome". Just ask the question.`;

  // If resume text is provided, include it in the context
  if (resumeText) {
    // Limit resume text to avoid token limits (first 2000 chars should be enough)
    const truncatedResume = resumeText.substring(0, 2000);
    console.log("🎯 Using resume context for initial question. Resume length:", resumeText.length, "chars");
    console.log("📋 Resume preview:", truncatedResume.substring(0, 300) + "...");

    systemPrompt = `You are an expert technical interviewer conducting an interview for a "${role}" position at a ${difficulty} difficulty level.

CANDIDATE'S RESUME:
${truncatedResume}

IMPORTANT: You MUST ask your opening question based on specific details from the candidate's resume above. Reference their actual experience, projects, skills, or achievements mentioned in the resume. Do NOT ask generic questions. Be specific and personalized.

Ask exactly ONE short, professional opening question based on their resume. Do NOT say "Hello" or "Welcome". Just ask the question.`;
  }

  const messages = [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user",
      content: "Please start the interview by asking your first question."
    }
  ];

  console.log("📤 Sending request to LLM with system prompt length:", systemPrompt.length);
  const response = await callOpenRouter(messages);
  console.log("📥 Received response:", response);
  return response || "Tell me about yourself and your background.";
};

/**
 * 📊 Generate Final Interview Report
 */
export const generateFinalReport = async (conversationHistory, difficulty = "Medium") => {
  const systemPrompt = `
    You are an expert technical interviewer and career coach.
    Analyze the provided interview transcript and generate a structured JSON report.
    
    DIFFICULTY LEVEL: ${difficulty}
    Strictness Guidelines:
    - EASY: Focus on core conceptual understanding. Be lenient and encouraging. A basic correct answer deserves a high score.
    - MEDIUM: Expect solid technical explanations and some real-world application. Standard industry strictness.
    - HARD: Expect deep technical precision, architectural understanding, and edge-case handling. Be very strict and critical.
    
    RESPONSE FORMAT (Strict JSON):
    {
      "overall_score": (integer 1-10),
      "summary": "Professional executive summary of performance",
      "strengths": ["Strength 1", "Strength 2"],
      "improvements": ["Improvement 1", "Improvement 2"],
      "recommendations": ["Next Step 1", "Next Step 2"],
      "category_scores": {
        "Technical Skills": (1-10),
        "Communication": (1-10),
        "Problem Solving": (1-10)
      },
      "questions_analysis": [
        {
          "question": "The question asked",
          "expected_answer": "What a perfect answer should contain",
          "user_answer": "Summary of what user said",
          "feedback": "Specific feedback on this answer",
          "improvement": "One clear tip to make this answer better",
          "score": (1-10)
        }
      ]
    }
  `;

  try {
    console.log(`📊 Requesting final report analysis (${difficulty} mode) via Unkillable AI Engine...`);
    // 🚩 FIX: History structure uses 'parts[0].text'
    const transcript = conversationHistory.map(h => {
      const speaker = h.role === 'user' ? 'Candidate' : 'Interviewer';
      const text = h.parts?.[0]?.text || "[Silence]";
      return `${speaker}: ${text}`;
    }).join("\n");
    
    const response = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here is the interview transcript:\n\n${transcript}` }
    ]);

    return safeParseJSON(response);
  } catch (error) {
    console.error("🚨 Final Report Generation failed:", error);
    throw error;
  }
};

export const getNextQuestion = async ({ lastAnswer, history, resumeText = null, difficulty = 'Medium', forceTopicChange = false }) => {
  // Convert your app's history format to OpenRouter format
  // App uses: { role: 'model' | 'user', parts: [{ text: '...' }] }
  // OpenRouter needs: { role: 'assistant' | 'user', content: '...' }

  const contextMessages = history.map(h => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0].text
  }));

  let systemPrompt = `You are a technical interviewer conducting an ongoing interview at a ${difficulty} difficulty level.

IMPORTANT RULES:
- Ask exactly ONE concise follow-up technical question based on the candidate's last answer
- Keep questions under 20 words
- The question difficulty MUST be strictly ${difficulty}.
- NO greetings, pleasantries, or acknowledgments (e.g., "That's great", "Okay", "Good answer")
- NEVER end the interview early - the system will handle timing
- Continue asking relevant technical questions throughout the interview
- Build on previous answers to go deeper into topics
- If the candidate gives a weak answer, ask a different question to give them another chance`;

  // Add instruction to force topic change if needed
  if (forceTopicChange) {
    systemPrompt += `\n\n🔄 CRITICAL: You have asked 3 follow-up questions on the current topic. NOW YOU MUST:
1. Switch to a completely different technical topic (NOT related to the previous one)
2. Start fresh with an opening question about this new topic
3. Do NOT ask any follow-up on the previous topic
4. Choose from skills mentioned in the resume or general technical areas`;
  }

  // If resume text is provided, include it in the context
  if (resumeText) {
    const truncatedResume = resumeText.substring(0, 2000);
    console.log("🎯 Using resume context for follow-up question");

    systemPrompt += `\n\nCANDIDATE'S RESUME:\n${truncatedResume}\n\nYou can reference their resume when asking follow-up questions. If their answer relates to something on their resume, dig deeper into that specific experience or project.`;
  }

  const messages = [
    {
      role: "system",
      content: systemPrompt
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