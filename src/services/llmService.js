/* src/services/llmService.js */

import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../firebase/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

// Configure PDF.js worker - use local package instead of CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

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

/**
 * HELPER: Fetch questions from question bank (Firestore)
 * Filters by company, role, and difficulty level
 */
export const getQuestionBankQuestions = async (company, role, difficulty) => {
  try {
    if (!company || !role) {
      console.warn("⚠️ Company or role missing. Skipping question bank fetch.");
      return [];
    }

    const questionsRef = collection(db, 'questions');
    
    // Build query with filters
    const q = query(
      questionsRef,
      where('company', '==', company),
      where('role', '==', role),
      where('difficulty', '==', difficulty),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Fetched ${questions.length} questions from bank for ${company} - ${role} (${difficulty})`);
    return questions;
  } catch (error) {
    console.error("🚨 Question bank fetch error:", error);
    return [];
  }
};

/**
 * HELPER: Fetch unique company names from question bank (Firestore)
 * Returns list of all companies available in the database
 */
export const getCompanySuggestions = async (searchQuery = '') => {
  try {
    const questionsRef = collection(db, 'questions');
    const snapshot = await getDocs(questionsRef);
    
    // Extract unique companies and filter based on search query
    const companiesSet = new Set();
    snapshot.docs.forEach(doc => {
      const company = doc.data().company;
      if (company && company.toLowerCase().includes(searchQuery.toLowerCase())) {
        companiesSet.add(company);
      }
    });

    const companies = Array.from(companiesSet).sort();
    console.log(`✅ Found ${companies.length} companies matching "${searchQuery}"`);
    return companies;
  } catch (error) {
    console.error("🚨 Error fetching company suggestions:", error);
    return [];
  }
};

// ------------------------------------------------------------------
// 🚀 EXPORTED FUNCTIONS
// ------------------------------------------------------------------

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
    }
  ];

  console.log("📤 Sending request to LLM with system prompt length:", systemPrompt.length);
  const response = await callOpenRouter(messages);
  console.log("📥 Received response:", response);
  return response || "Tell me about yourself and your background.";
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