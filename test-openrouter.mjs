import fs from 'fs';

// Read API key from .env
const envContent = fs.readFileSync('.env', 'utf-8');
const keyLine = envContent.split('\n').find(line => line.startsWith('VITE_OPENROUTER_API_KEY='));
const apiKey = keyLine ? keyLine.split('=')[1].trim() : null;

if (!apiKey) {
    console.error("No API key found in .env");
    process.exit(1);
}

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-flash-1.5";

async function test() {
    try {
        console.log(`Testing with key: ${apiKey.substring(0, 15)}...`);
        console.log(`Model: ${MODEL}`);
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Interview Buddy Test"
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert technical interviewer."
                    },
                    {
                        role: "user",
                        content: "Please start the interview by asking your first question."
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("HTTP ERROR:", response.status);
            console.error(JSON.stringify(data, null, 2));
        } else {
            console.log("SUCCESS!");
            console.log(JSON.stringify(data.choices[0].message, null, 2));
        }
    } catch (e) {
        console.error("NETWORK ERROR:", e);
    }
}

test();
