require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 4321;

// --- CORS Configuration ---
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'], // Allow specific methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
    maxAge: 86400 // Cache preflight requests for 24 hours
}));

// --- Body Parser Configuration ---
app.use(express.json({ 
    limit: '50mb', // Increase limit for large joke batches
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch(e) {
            res.status(400).json({ error: 'Invalid JSON in request body' });
        }
    }
}));

// --- Initialize API Clients ---
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const googleAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

if (!openai) console.warn("OpenAI Key Missing/Invalid?"); else console.log("OpenAI client OK.");
if (!anthropic) console.warn("Anthropic Key Missing/Invalid?"); else console.log("Anthropic client OK.");
if (!googleAI) console.warn("Google AI Key Missing/Invalid?"); else console.log("Google AI client OK.");

// --- Helper Functions ---
const generateId = (prefix = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// --- Robust JSON String Extraction ---
function extractJsonString(rawText) {
    if (!rawText || typeof rawText !== 'string') return null;

    console.log("Attempting to extract JSON from raw text:", rawText.substring(0, 200) + (rawText.length > 200 ? "..." : ""));

    // Attempt 1: Look for JSON within markdown code fences
    const markdownMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        const potentialJson = markdownMatch[1].trim();
        try {
            JSON.parse(potentialJson);
            console.log("Extracted JSON from markdown fence.");
            return potentialJson;
        } catch (e) {
            console.warn("Text inside markdown fence was not valid JSON.");
        }
    }

    // Attempt 2: Find the first opening bracket/brace and last closing bracket/brace
    let firstBracket = rawText.indexOf('[');
    let firstBrace = rawText.indexOf('{');
    let start = -1;

    if (firstBracket === -1 && firstBrace === -1) {
        console.error("No JSON start characters ([ or {) found.");
        return null;
    }

    if (firstBracket === -1) start = firstBrace;
    else if (firstBrace === -1) start = firstBracket;
    else start = Math.min(firstBracket, firstBrace);

    let lastBracket = rawText.lastIndexOf(']');
    let lastBrace = rawText.lastIndexOf('}');
    let end = -1;

    if (lastBracket === -1 && lastBrace === -1) {
        console.error("No JSON end characters (] or }) found after start.");
        return null;
    }

    if (rawText[start] === '[') {
        end = lastBracket;
    } else {
        end = lastBrace;
    }

    if (end === -1 || end < start) {
        end = Math.max(lastBracket, lastBrace);
        if (end < start) {
            console.error("Valid JSON end character not found after start character.");
            return null;
        }
        console.warn("Mismatch between start/end characters, trying best match.");
    }
    
    const potentialJson = rawText.substring(start, end + 1);
    try {
        JSON.parse(potentialJson);
        console.log("Successfully extracted JSON using start/end bracket matching.");
        return potentialJson;
    } catch (e) {
        console.error("Failed to parse extracted JSON substring:", e.message);
        console.error("Substring attempted:", potentialJson.substring(0, 200) + (potentialJson.length > 200 ? "..." : ""));
        try {
            JSON.parse(rawText.trim());
            console.log("Fallback successful: Original trimmed text was valid JSON.");
            return rawText.trim();
        } catch (finalError) {
            console.error("Final fallback failed: Could not parse original text either.");
            return null;
        }
    }
}

// --- AI Model Interaction Functions ---
async function callOpenAI(prompt, modelName = 'gpt-4') {
    console.log("--- Entering callOpenAI ---");
    console.log(`Prompt Type: ${typeof prompt}, Is Empty: ${!prompt}`);
    if (typeof prompt !== 'string' || !prompt) throw new Error('Invalid prompt passed to callOpenAI.');
    console.log(`Attempting OpenAI API Call (${modelName})...`);
    if (!openai) throw new Error('OpenAI client not initialized.');

    try {
        const completion = await openai.chat.completions.create({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 3000,
        });

        console.log(">>> OpenAI API Call SUCCEEDED.");
        const rawResultText = completion.choices[0]?.message?.content?.trim();
        console.log(">>> OpenAI RAW Response Text Received:", rawResultText ? rawResultText.substring(0, 150)+"..." : rawResultText);

        if (!rawResultText) throw new Error("OpenAI returned an empty response string.");

        const jsonString = extractJsonString(rawResultText);
        if (!jsonString) throw new Error("Could not extract valid JSON structure from OpenAI response.");

        JSON.parse(jsonString);
        return jsonString;

    } catch (error) {
        console.error("!!! OpenAI Interaction FAILED !!!");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        if (error.response) {
            console.error("Error Response Status:", error.response.status);
            console.error("Error Response Data:", error.response.data);
        } else {
            console.error("Full Error Object:", error);
        }
        throw new Error(`OpenAI API Error: ${error.response?.data?.error?.message || error.message || "Unknown OpenAI API error"}`);
    }
}

async function callAnthropic(prompt, modelName = 'claude-3-opus-20240229') {
    console.log("--- Entering callAnthropic ---");
    if (!anthropic) throw new Error('Anthropic client not initialized.');
    
    try {
        const message = await anthropic.messages.create({
            model: modelName,
            max_tokens: 3000,
            messages: [{ role: 'user', content: prompt }]
        });

        const rawResultText = message.content[0].text;
        const jsonString = extractJsonString(rawResultText);
        if (!jsonString) throw new Error("Could not extract valid JSON structure from Anthropic response.");
        
        return jsonString;
    } catch (error) {
        console.error("!!! Anthropic Interaction FAILED !!!");
        console.error("Error:", error);
        throw new Error(`Anthropic API Error: ${error.message || "Unknown Anthropic API error"}`);
    }
}

async function callGoogleAI(prompt, modelName = 'gemini-1.5-pro-latest') {
    console.log("--- Entering callGoogleAI ---");
    if (!googleAI) throw new Error('Google AI client not initialized.');

    try {
        const model = googleAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawResultText = await response.text();

        console.log(">>> Google AI API Call SUCCEEDED.");
        console.log(">>> Google AI RAW Response Text Received:", rawResultText ? rawResultText.substring(0, 150)+"..." : rawResultText);

        if (!rawResultText) throw new Error("Google AI returned an empty response string.");

        const jsonString = extractJsonString(rawResultText);
        if (!jsonString) throw new Error("Could not extract valid JSON structure from Google AI response.");

        JSON.parse(jsonString);
        return jsonString;

    } catch (error) {
        console.error("!!! Google AI Interaction FAILED !!!");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Full Error Object:", error);
        throw new Error(`Google AI API Error: ${error.message || "Unknown Google AI error"}`);
    }
}

// --- Batch Analysis Endpoint ---
app.post('/api/analyze-jokes-batch', async (req, res) => {
    console.log("\n--- Received request /api/analyze-jokes-batch ---");
    const { jokes, selectedModel = 'gpt-4' } = req.body;

    // Input Validation
    if (!Array.isArray(jokes) || jokes.length === 0) {
        console.error("Batch Error: Invalid/empty jokes.");
        return res.status(400).json({ error: 'Requires non-empty jokes array.' });
    }
    if (!selectedModel) {
        console.error("Batch Error: Model missing.");
        return res.status(400).json({ error: 'Model selection required.' });
    }
    console.log(`Batch: ${jokes.length} jokes. Model: ${selectedModel}`);
    
    const hasInvalidText = jokes.some(j => j?.text == null);
    if (hasInvalidText) {
        console.error("Batch Error: Null text found.");
        return res.status(400).json({ error: 'Invalid joke data: text cannot be null.' });
    }

    let prompt;
    let rawResultJson;
    let analysisResults = [];

    try {
        // Generate Prompt
        const jokesWithTempIds = jokes.map((joke, index) => ({
            ...joke,
            tempId: joke.tempId || `batch-${index}-${uuidv4()}`
        }));

        prompt = `You are a comedy analysis API. Your response MUST be valid JSON. Analyze these jokes and provide structured analysis:

${JSON.stringify(jokesWithTempIds, null, 2)}

IMPORTANT: Your response must be ONLY a JSON array containing analysis objects. No other text or explanation.
Each analysis object MUST follow this EXACT format:
{
    "tempId": "id-from-input",
    "analysis": {
        "setup": "text before punchline",
        "punchline": "main punchline",
        "techniques": ["list", "of", "comedy", "techniques"],
        "themes": ["list", "of", "themes"],
        "callbacks": ["any", "callbacks", "to", "previous", "jokes"],
        "crowd_work": boolean,
        "physical_comedy": boolean,
        "rating": {
            "originality": number,
            "delivery": number,
            "impact": number
        }
    }
}

CRITICAL REQUIREMENTS:
1. Response must be a valid JSON array starting with [ and ending with ]
2. Each object must have all fields shown above
3. No trailing commas
4. No comments or text outside the JSON
5. Use double quotes for strings
6. Use true/false for booleans
7. Use numbers without quotes
8. Arrays must be properly terminated
9. No markdown code fences or other formatting`;

        console.log("Generated Batch Prompt Type:", typeof prompt, "Length:", prompt.length);

        // Call AI Service
        console.log(`Routing to AI call for model: ${selectedModel}`);
        try {
            if (selectedModel.toLowerCase().startsWith('gpt') && openai) {
                rawResultJson = await callOpenAI(prompt, selectedModel);
            } else if (selectedModel.toLowerCase().startsWith('claude') && anthropic) {
                rawResultJson = await callAnthropic(prompt, selectedModel);
            } else if (selectedModel.toLowerCase().startsWith('gemini') && googleAI) {
                rawResultJson = await callGoogleAI(prompt, selectedModel);
            } else {
                throw new Error(`Model ${selectedModel} not supported or key missing.`);
            }

            // Extract & Parse JSON Response
            const jsonString = extractJsonString(rawResultJson);
            if (!jsonString) {
                console.error("Raw AI Response that failed extraction:", rawResultJson);
                throw new Error("Could not extract JSON content from AI response.");
            }

            // Try to parse the JSON
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(jsonString);
                if (!Array.isArray(parsedResponse)) {
                    throw new Error("Response is not a JSON array");
                }
                // Validate each analysis object
                parsedResponse.forEach((item, index) => {
                    if (!item.tempId || !item.analysis) {
                        throw new Error(`Invalid analysis object at index ${index}`);
                    }
                });
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError);
                console.error("Failed JSON string:", jsonString);
                throw new Error("Invalid JSON format in AI response");
            }

            analysisResults = parsedResponse;
            console.log(`Successfully processed batch: Parsed ${analysisResults.length} results.`);
            res.json({ results: analysisResults });

        } catch (error) {
            console.error(`--- BATCH ANALYSIS FAILED ---`);
            console.error(`Error Message: ${error.message}`);
            if (prompt) console.error("Prompt (start):", prompt.substring(0, 300) + "...");
            if (rawResultJson) console.error("Raw Result JSON:", rawResultJson);
            res.status(500).json({ error: error.message || 'Batch analysis failed.' });
        }
    } catch (error) {
        console.error(`--- BATCH ANALYSIS FAILED ---`);
        console.error(`Error Message: ${error.message}`);
        if (prompt) console.error("Prompt (start):", prompt.substring(0, 300) + "...");
        if (rawResultJson) console.error("Raw Result JSON:", rawResultJson);
        res.status(500).json({ error: error.message || 'Batch analysis failed.' });
    }
});

// --- Health Check Endpoint ---
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log('** Ensure API keys in .env & SDKs installed! **');
});