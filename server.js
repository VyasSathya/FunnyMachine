// server.js (Full Code - Simplified Endpoint Error Handling & Detailed API Call Logging)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Joke = require('./models/joke-model');
const Bit = require('./models/bit-model');
const Set = require('./models/set-model');
const Special = require('./models/special-model');
const analyzer = require('./services/analyzer');
const { processJokeData } = require('./scripts/process-jokes');
const { groupJokesIntoBitsAndSets } = require('./scripts/group-bits');

const app = express();
const port = 3001;
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Initialize API Clients ---
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const googleAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

if (!openai) console.warn("OpenAI Key Missing/Invalid?"); else console.log("OpenAI client OK.");
if (!anthropic) console.warn("Anthropic Key Missing/Invalid?"); else console.log("Anthropic client OK.");
if (!googleAI) console.warn("Google AI Key Missing/Invalid?"); else console.log("Google AI client OK.");

// --- Helper Functions ---
const generateId = (prefix = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
function extractJsonString(rawText) { /* ... (Keep definition) ... */ return null; }

// --- Prompt Engineering Functions ---
function createPunchlinePrompt(setup, punchline) { /* ... (Keep definition) ... */ }
function createOrganizePrompt(text) { /* ... (Keep definition) ... */ }
function createBatchAnalyzePrompt(jokesArray) { /* ... (Keep definition with internal try/catch) ... */ }

// --- AI Model Interaction Modules (Enhanced Logging in callOpenAI) ---

async function callOpenAI(prompt, modelName = 'gpt-4') {
    console.log("--- Entering callOpenAI ---");
    console.log(`Prompt Type: ${typeof prompt}, Is Empty: ${!prompt}`);
    if (typeof prompt !== 'string' || !prompt) throw new Error('Invalid prompt passed to callOpenAI.');
    console.log(`Attempting OpenAI API Call (${modelName})...`);
    if (!openai) throw new Error('OpenAI client not initialized.');

    let completion; // To store the raw API response object
    try {
        completion = await openai.chat.completions.create({
            model: modelName,
            messages: [{ role: 'user', content: prompt }], // Content MUST be string
            temperature: 0.5,
            max_tokens: 3000,
        });

        // Log success immediately after successful call
        console.log(">>> OpenAI API Call SUCCEEDED.");

        const rawResultText = completion.choices[0]?.message?.content?.trim();
        console.log(">>> OpenAI RAW Response Text Received:", rawResultText ? rawResultText.substring(0, 150)+"..." : rawResultText); // Log actual content

        if (!rawResultText) throw new Error("OpenAI returned an empty response string.");

        const jsonString = extractJsonString(rawResultText);
        if (!jsonString) throw new Error("Could not extract valid JSON structure from OpenAI response.");

        JSON.parse(jsonString); // Validate syntax
        return jsonString; // Return the cleaned JSON string

    } catch (error) {
        // *** Log the DETAILED error from the OpenAI library ***
        console.error("!!! OpenAI Interaction FAILED !!!");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        // OpenAI library often includes useful details in error.response or error.status
        if (error.response) {
            console.error("Error Response Status:", error.response.status);
            console.error("Error Response Data:", error.response.data);
        } else {
            console.error("Full Error Object:", error); // Log full error if no response property
        }

        // Re-throw a user-friendly error (or the specific one if informative)
        const apiErrorMsg = error.response?.data?.error?.message || error.message || "Unknown OpenAI API error";
        // Prepend source for clarity
        throw new Error(`OpenAI API Error: ${apiErrorMsg}`);
    }
}

function extractJsonString(rawText) {
    if (!rawText) return null;
    
    // First, check if the entire response is valid JSON
    try {
      JSON.parse(rawText);
      return rawText; // If it's already valid JSON, return as is
    } catch (e) {
      // Not valid JSON, try to extract JSON from text
    }
  
    // Look for JSON array
    const arrayMatch = rawText.match(/(\[[\s\S]*\])/);
    if (arrayMatch && arrayMatch[1]) {
      try {
        JSON.parse(arrayMatch[1]); // Validate it's valid JSON
        return arrayMatch[1];
      } catch (e) {
        // Not valid JSON array
      }
    }
  
    // Look for JSON object
    const objectMatch = rawText.match(/(\{[\s\S]*\})/);
    if (objectMatch && objectMatch[1]) {
      try {
        JSON.parse(objectMatch[1]); // Validate it's valid JSON
        return objectMatch[1];
      } catch (e) {
        // Not valid JSON object
      }
    }
  
    // More aggressive approach: find longest string that might be JSON
    let openBrackets = 0;
    let jsonStart = -1;
    let possibleJson = '';
  
    // Try to find array pattern
    for (let i = 0; i < rawText.length; i++) {
      if (rawText[i] === '[' && jsonStart === -1) {
        jsonStart = i;
        openBrackets = 1;
      } else if (jsonStart !== -1) {
        if (rawText[i] === '[') openBrackets++;
        if (rawText[i] === ']') openBrackets--;
        
        if (openBrackets === 0) {
          possibleJson = rawText.substring(jsonStart, i + 1);
          try {
            JSON.parse(possibleJson);
            return possibleJson;
          } catch (e) {
            // Not valid JSON, continue searching
            jsonStart = -1;
          }
        }
      }
    }
  
    // Try to find object pattern if array pattern failed
    jsonStart = -1;
    openBrackets = 0;
    
    for (let i = 0; i < rawText.length; i++) {
      if (rawText[i] === '{' && jsonStart === -1) {
        jsonStart = i;
        openBrackets = 1;
      } else if (jsonStart !== -1) {
        if (rawText[i] === '{') openBrackets++;
        if (rawText[i] === '}') openBrackets--;
        
        if (openBrackets === 0) {
          possibleJson = rawText.substring(jsonStart, i + 1);
          try {
            JSON.parse(possibleJson);
            return possibleJson;
          } catch (e) {
            // Not valid JSON, continue searching
            jsonStart = -1;
          }
        }
      }
    }
  
    // If nothing worked, log and return null
    console.error("Could not extract valid JSON from:", rawText.substring(0, 200) + "...");
    return null;
  }

function createBatchAnalyzePrompt(jokesArray) {
    try {
      if (!Array.isArray(jokesArray) || jokesArray.length === 0) {
        throw new Error("Invalid jokes array provided to prompt function");
      }
      
      const jokesForPrompt = jokesArray.map(joke => {
        return {
          id: joke.tempId,
          text: joke.text,
          laughter: joke.laughter
        };
      });
      
      const prompt = `
      Analyze the following jokes for their comedy structure and characteristics. For each joke, identify key elements like:
      
      1. Comedy Techniques Used (e.g., misdirection, callback, act-out, exaggeration)
      2. Joke Structure (setup, punchline, tags)
      3. Subject Matter/Theme
      4. Tone (e.g., observational, self-deprecating, dark)
      5. Identify any act-outs or physical comedy elements described in the text
      
      Here are the jokes to analyze, with their audience reactions included:
      
      ${JSON.stringify(jokesForPrompt, null, 2)}
      
      For each joke, provide your analysis in structured JSON format with this schema:
      {
        "tempId": "id-from-input", 
        "analysis": {
          "jokeType": "string - primary joke type",
          "techniques": ["array of techniques used"],
          "structure": {
            "setup": "string - identified setup portion",
            "punchline": "string - identified punchline portion",
            "tags": ["array of any tags or followup jokes"]
          },
          "actOut": "string - any identified act-out or null",
          "subject": "string - primary subject matter",
          "tone": "string - primary tone",
          "strengthAssessment": "string - assessment of joke strength"
        }
      }
      
      Return an array of these analysis objects, one for each input joke.
      `;
      
      return prompt;
    } catch (error) {
      console.error("Error in prompt creation:", error);
      throw error; // Re-throw so the endpoint can handle it
    }
  }

// Add similar detailed logging to callAnthropic and callGoogleAI if needed
async function callAnthropic(prompt, modelName = 'claude-3-opus-20240229') { /* ... */ }
async function callGoogleAI(prompt, modelName = 'gemini-pro') { /* ... */ }


// --- API Endpoints ---
app.post('/api/optimize-punchline', async (req, res) => { /* ... (Keep unchanged) ... */ });
app.post('/api/organize', async (req, res) => { /* ... (Keep unchanged) ... */ });
app.post('/api/find-similar-joke', async (req, res) => { /* ... (Keep unchanged) ... */ });

// Batch Analyze Jokes Endpoint (Simplified Error Handling)
app.post('/api/analyze-jokes-batch', async (req, res) => {
    console.log("\n--- Received request /api/analyze-jokes-batch ---");
    const { jokes, selectedModel = 'gpt-4' } = req.body;

    // --- Input Validation ---
    if (!Array.isArray(jokes) || jokes.length === 0) { console.error("Batch Error: Invalid/empty jokes."); return res.status(400).json({ error: 'Requires non-empty jokes array.' }); }
    if (!selectedModel) { console.error("Batch Error: Model missing."); return res.status(400).json({ error: 'Model selection required.' }); }
    console.log(`Batch: ${jokes.length} jokes. Model: ${selectedModel}`);
    const hasInvalidText = jokes.some(j => j?.text == null);
    if (hasInvalidText) { console.error("Batch Error: Null text found."); return res.status(400).json({ error: 'Invalid joke data: text cannot be null.' }); }

    // --- Main Logic with Single Try/Catch ---
    let prompt;
    let rawResultJson;
    let analysisResults = [];

    try {
        // 1. Generate Prompt
        const jokesWithTempIds = jokes.map((joke, index) => ({ ...joke, tempId: joke.tempId || `batch-${index}-${uuidv4()}` }));
        prompt = createBatchAnalyzePrompt(jokesWithTempIds);
        console.log("Generated Batch Prompt Type:", typeof prompt, "Length:", prompt.length);
        if (typeof prompt !== 'string' || !prompt) {
            throw new Error("Prompt generation returned invalid value.");
        }
        // console.log("Prompt Start:", prompt.substring(0, 300) + "..."); // Optional log

        // 2. Call AI Service
        console.log(`Routing to AI call for model: ${selectedModel}`);
         if (selectedModel.toLowerCase().startsWith('gpt') && openai) { rawResultJson = await callOpenAI(prompt, selectedModel); }
         else if (selectedModel.toLowerCase().startsWith('claude') && anthropic) { rawResultJson = await callAnthropic(prompt, selectedModel); }
         else if (selectedModel.toLowerCase().startsWith('gemini') && googleAI) { rawResultJson = await callGoogleAI(prompt, selectedModel); }
         else { throw new Error(`Model ${selectedModel} not supported or key missing.`); }

        // 3. Extract & Parse JSON Response
        const jsonString = extractJsonString(rawResultJson); // Clean JSON string
        if (!jsonString) {
            console.error("Raw AI Response that failed extraction:", rawResultJson); // Log the problematic raw response
            throw new Error("Could not extract JSON content from AI response.");
        }

        const parsedResponse = JSON.parse(jsonString); // Parse the cleaned string
        if (Array.isArray(parsedResponse)) { analysisResults = parsedResponse; }
        else if (parsedResponse && Array.isArray(parsedResponse.results)) { analysisResults = parsedResponse.results; }
        else { throw new Error("AI response structure invalid (expected array or {results:[]})."); }

        console.log(`Successfully processed batch: Parsed ${analysisResults.length} results.`);

        // 4. Send Success Response
        res.json({ results: analysisResults });

    } catch (error) {
        // Catch ANY error from prompt gen, AI call, extraction, or parsing
        console.error(`--- BATCH ANALYSIS FAILED ---`);
        console.error(`Error Message: ${error.message}`);
        // Log intermediate values if they exist to help debug
        if (prompt) console.error("Prompt (start) when error occurred:", prompt.substring(0, 300) + "...");
        if (rawResultJson) console.error("Raw Result JSON when error occurred:", rawResultJson);
        // Send specific error back to client
        res.status(500).json({ error: error.message || 'Batch analysis failed due to an internal server error.' });
    }
});

// Add this to your server.js file
app.post('/api/convert-data', async (req, res) => {
    try {
      const { filePath } = req.body;
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }
      
      const { convertExistingData } = require('./scripts/convert-existing-data');
      const result = await convertExistingData(filePath);
      
      res.json({
        message: 'Data conversion successful',
        counts: {
          jokes: result.processedJokes.length,
          bits: result.processedBits.length,
          sets: result.processedSets.length,
          specials: result.processedSpecials.length
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error converting data', details: error.message });
    }
  });

  
// ----- Comedy Construction Engine Endpoints -----

// GET all jokes
app.get('/api/jokes', async (req, res) => {
    try {
      const jokesPath = path.join(__dirname, 'data/processed/jokes.json');
      const jokesData = await fs.readFile(jokesPath, 'utf8');
      const jokes = JSON.parse(jokesData);
      res.json(jokes);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching jokes', details: error.message });
    }
  });
  
  // GET a specific joke
  app.get('/api/jokes/:id', async (req, res) => {
    try {
      const jokesPath = path.join(__dirname, 'data/processed/jokes.json');
      const jokesData = await fs.readFile(jokesPath, 'utf8');
      const jokes = JSON.parse(jokesData);
      const joke = jokes.find(j => j.id === req.params.id);
      
      if (!joke) {
        return res.status(404).json({ error: 'Joke not found' });
      }
      
      res.json(joke);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching joke', details: error.message });
    }
  });
  
  // Similar endpoints for GET /api/bits, GET /api/bits/:id, GET /api/sets, etc.
  
  // Analyze a joke locally (without external AI)
  app.post('/api/analyze-joke-local', async (req, res) => {
    try {
      const { text, laughData } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Joke text is required' });
      }
      
      const technique = await analyzer.analyzeJokeTechnique(text, laughData);
      const structure = analyzer.analyzeJokeStructure(text);
      const wordEconomy = analyzer.analyzeWordEconomy(text);
      
      res.json({
        text,
        analysis: {
          primary_technique: technique.primary_technique,
          techniques: technique.techniques,
          structure,
          metrics: {
            word_economy: wordEconomy
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error analyzing joke', details: error.message });
    }
  });
  
  // Process joke data locally
  app.post('/api/process-jokes-local', async (req, res) => {
    try {
      const result = await processJokeData();
      res.json({
        message: 'Jokes processed successfully',
        count: result.processedJokes.length,
        bits: Object.keys(result.jokesGroupedByBit).length
      });
    } catch (error) {
      res.status(500).json({ error: 'Error processing jokes', details: error.message });
    }
  });


// --- Start Server ---
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log('** Ensure API keys in .env & SDKs installed! **');
});

// --- End of server.js ---