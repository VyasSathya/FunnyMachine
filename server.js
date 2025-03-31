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
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// --- Ensure Uploads Directory Exists ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    console.log(`Creating uploads directory at: ${UPLOADS_DIR}`);
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR); // Save files to the 'uploads' directory
    },
    filename: function (req, file, cb) {
        // Generate unique filename: uuid + original extension
        const uniqueSuffix = uuidv4();
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // Example: 100MB file size limit
}); 

// --- Helper Functions ---
const generateId = (prefix = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// --- REVISED: Robust JSON String Extraction ---
function extractJsonString(rawText) {
    if (!rawText || typeof rawText !== 'string') return null;

    console.log("Attempting to extract JSON from raw text:", rawText.substring(0, 200) + (rawText.length > 200 ? "..." : ""));

    // Attempt 1: Look for JSON within markdown code fences (```json ... ```)
    const markdownMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        const potentialJson = markdownMatch[1].trim();
        try {
            JSON.parse(potentialJson); // Validate syntax
            console.log("Extracted JSON from markdown fence.");
            return potentialJson;
        } catch (e) {
            console.warn("Text inside markdown fence was not valid JSON.");
            // Proceed to other methods
        }
    }

    // Attempt 2: Find the first opening bracket/brace and last closing bracket/brace
    let firstBracket = rawText.indexOf('[');
    let firstBrace = rawText.indexOf('{');
    let start = -1;

    if (firstBracket === -1 && firstBrace === -1) {
        console.error("No JSON start characters ([ or {) found.");
        return null; // No JSON structure found
    }

    if (firstBracket === -1) start = firstBrace;
    else if (firstBrace === -1) start = firstBracket;
    else start = Math.min(firstBracket, firstBrace);

    let lastBracket = rawText.lastIndexOf(']');
    let lastBrace = rawText.lastIndexOf('}');
    let end = -1;

    if (lastBracket === -1 && lastBrace === -1) {
        console.error("No JSON end characters (] or }) found after start.");
        return null; // No JSON end found
    }

    // Determine the correct last character based on the start character
    if (rawText[start] === '[') {
        end = lastBracket;
    } else { // rawText[start] === '{'
        end = lastBrace;
    }

    if (end === -1 || end < start) {
       // If the expected closing char wasn't found, take the latest brace/bracket after start
       end = Math.max(lastBracket, lastBrace); 
       if (end < start) { // Still no valid end
           console.error("Valid JSON end character not found after start character.");
           return null; 
       }
       console.warn("Mismatch between start/end characters, trying best match.");
    }
    
    const potentialJson = rawText.substring(start, end + 1);
    try {
        JSON.parse(potentialJson); // Validate syntax
        console.log("Successfully extracted JSON using start/end bracket matching.");
        return potentialJson;
    } catch (e) {
        console.error("Failed to parse extracted JSON substring:", e.message);
        console.error("Substring attempted:", potentialJson.substring(0, 200) + (potentialJson.length > 200 ? "..." : ""));
        // Fallback: Try parsing the original text as a last resort
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

// --- Prompt Engineering Functions ---
function createPunchlinePrompt(setup, punchline) { /* ... (Keep definition) ... */ }
function createOrganizePrompt(text) { /* ... (Keep definition) ... */ }
function createBatchAnalyzePrompt(jokesArray) { /* ... (Keep definition with internal try/catch) ... */ }

// --- NEW: Prompt for single text selection analysis ---
function createAnalyzeSelectionPrompt(textSnippet) {
    if (!textSnippet || typeof textSnippet !== 'string' || !textSnippet.trim()) {
        throw new Error("Invalid text snippet provided to prompt function");
    }
    // Simple prompt asking for Setup, Punchline, and Tags in JSON
    const prompt = `
Analyze the following text snippet for its potential as a standalone joke. Identify:
1. The Setup: The introductory part that establishes the premise.
2. The Punchline: The concluding part that delivers the comedic twist or resolution.
3. Potential Tags: A few relevant keywords or themes (as a JSON array of strings).

Text Snippet:
"${textSnippet}"

Please return ONLY a single JSON object with the following structure:
{
  "suggestedSetup": "string",
  "suggestedPunchline": "string",
  "suggestedTags": ["string", ...]
}
Ensure the setup and punchline together roughly reconstruct the original snippet.
`;
    return prompt;
}

// --- NEW: Prompt for parsing multiple jokes from a block of text ---
function createParseTextPrompt(rawText) {
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        throw new Error("Invalid raw text provided to prompt function");
    }
    const prompt = `
Analyze the following block of text, which likely represents a comedy bit or transcript segment. 
Identify distinct joke structures within the text. For each potential joke, determine its setup and punchline. 
Also, suggest a few relevant tags (keywords or themes) for each joke.

Text Block:
"""
${rawText}
"""

Return your findings as a JSON array, where each element is an object representing one identified joke. 
Each object MUST have the following structure:
{
  "suggestedSetup": "The identified setup text.",
  "suggestedPunchline": "The identified punchline text.",
  "suggestedTags": ["tag1", "tag2", ...], // Array of strings
  "originalSnippet": "The approximate portion of the original text this joke was derived from (for context)."
}

Focus on clear setup/punchline pairs. If a section doesn't seem like a structured joke, omit it. Aim for 3-7 distinct jokes if possible, but prioritize quality over quantity. Ensure the output is ONLY the JSON array, starting with [ and ending with ].
`;
    return prompt;
}

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
async function callGoogleAI(prompt, modelName = 'gemini-1.5-pro-latest') {
    console.log("--- Entering callGoogleAI ---");
    console.log(`Prompt Type: ${typeof prompt}, Is Empty: ${!prompt}`);
    if (typeof prompt !== 'string' || !prompt) throw new Error('Invalid prompt passed to callGoogleAI.');
    console.log(`Attempting Google AI API Call (${modelName})...`);
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

        // We don't need to parse here if we return the string, but validation is good
        JSON.parse(jsonString); 
        return jsonString; // Return the cleaned JSON string

    } catch (error) {
        console.error("!!! Google AI Interaction FAILED !!!");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        // Log specific details if available (structure might vary)
        console.error("Full Error Object:", error);
        throw new Error(`Google AI API Error: ${error.message || "Unknown Google AI error"}`);
    }
}


// --- API Endpoints ---
app.post('/api/optimize-punchline', async (req, res) => { /* ... (Keep unchanged) ... */ });
app.post('/api/organize', async (req, res) => { /* ... (Keep unchanged) ... */ });
app.post('/api/find-similar-joke', async (req, res) => { /* ... (Keep unchanged) ... */ });

// --- NEW: Media Upload Endpoint ---
// Expects a single file upload with the field name 'mediaFile'
app.post('/api/upload-media', upload.single('mediaFile'), (req, res) => {
    console.log('\n--- Received request /api/upload-media ---');
    if (!req.file) {
        console.error('Upload Error: No file received.');
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    console.log(`File uploaded successfully: ${req.file.filename}`);
    console.log(`Original name: ${req.file.originalname}`);
    console.log(`Size: ${req.file.size} bytes`);
    console.log(`Stored at: ${req.file.path}`);

    // Respond with essential file info
    // The client will likely need the 'filename' to reference the file later (e.g., for transcription)
    res.json({ 
        message: 'File uploaded successfully.', 
        filename: req.file.filename, // The unique filename generated
        originalName: req.file.originalname,
        // Consider security before sending back the full path
        // path: req.file.path 
    });
    // Next step: Trigger transcription from here using req.file.path or req.file.filename
});

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

// --- NEW: Endpoint for analyzing a single text selection ---
app.post('/api/analyze-selection', async (req, res) => {
    console.log("\n--- Received request /api/analyze-selection ---");
    const { text, model = 'gemini-1.5-pro-latest' } = req.body; // <-- Update default model name

    if (!text || typeof text !== 'string' || !text.trim()) {
        console.error("Analyze Selection Error: Invalid text received.");
        return res.status(400).json({ error: 'Text snippet is required.' });
    }

    console.log(`Analyzing selection (length: ${text.length}), Model: ${model}`);
    
    let prompt;
    let rawResultJson;
    let analysisResult = {};

    try {
        // 1. Generate Prompt
        prompt = createAnalyzeSelectionPrompt(text);
        console.log("Generated Analyze Selection Prompt.");

        // 2. Call AI Service (Using default model logic)
        console.log(`Routing to AI call for model: ${model}`);
        if (model.toLowerCase().startsWith('gemini') && googleAI) {
             rawResultJson = await callGoogleAI(prompt, model);
        } else if (model.toLowerCase().startsWith('gpt') && openai) {
             rawResultJson = await callOpenAI(prompt, model);
        } else if (model.toLowerCase().startsWith('claude') && anthropic) {
             rawResultJson = await callAnthropic(prompt, model);
        } else {
             if (!googleAI) throw new Error('Default Google AI model unavailable.');
             console.warn(`Model ${model} not found or key missing, falling back to gemini-1.5-pro-latest.`); // <-- Update fallback model
             rawResultJson = await callGoogleAI(prompt, 'gemini-1.5-pro-latest'); // <-- Update fallback model
        }
        
        // 3. Extract & Parse JSON Response
        const jsonString = extractJsonString(rawResultJson);
        if (!jsonString) {
            console.error("Raw AI Response (selection) failed extraction:", rawResultJson);
            throw new Error("Could not extract JSON content from AI response for selection.");
        }

        analysisResult = JSON.parse(jsonString);

        // Basic validation of expected structure
        if (typeof analysisResult.suggestedSetup === 'undefined' || typeof analysisResult.suggestedPunchline === 'undefined') {
            console.error("Parsed JSON missing expected fields:", analysisResult);
            throw new Error("AI response JSON structure invalid (missing setup/punchline).");
        }

        console.log(`Successfully processed selection analysis.`);

        // 4. Send Success Response (Add original text back for context)
        res.json({ 
            originalSelection: text, 
            ...analysisResult 
        });

    } catch (error) {
        console.error(`--- SELECTION ANALYSIS FAILED ---`);
        console.error(`Error Message: ${error.message}`);
        if (prompt) console.error("Prompt (start) when error occurred:", prompt.substring(0, 300) + "...");
        if (rawResultJson) console.error("Raw Result JSON when error occurred:", rawResultJson);
        res.status(500).json({ error: error.message || 'Selection analysis failed due to an internal server error.' });
    }
});

// --- NEW: Endpoint for parsing multiple jokes from raw text ---
app.post('/api/parse-text-for-jokes', async (req, res) => {
    console.log("\n--- Received request /api/parse-text-for-jokes ---");
    const { text, model = 'gemini-1.5-pro-latest' } = req.body; // <-- Update default model name

    if (!text || typeof text !== 'string' || !text.trim()) {
        console.error("Parse Text Error: Invalid text received.");
        return res.status(400).json({ error: 'Raw text block is required.' });
    }

    console.log(`Parsing text block (length: ${text.length}), Model: ${model}`);
    
    let prompt;
    let rawResultJson;
    let suggestedJokes = [];

    try {
        // 1. Generate Prompt
        prompt = createParseTextPrompt(text);
        console.log("Generated Parse Text Prompt.");

        // 2. Call AI Service (Using default model logic)
        console.log(`Routing to AI call for model: ${model}`);
        // Reusing the routing logic from analyze-selection endpoint
        if (model.toLowerCase().startsWith('gemini') && googleAI) {
             rawResultJson = await callGoogleAI(prompt, model);
        } else if (model.toLowerCase().startsWith('gpt') && openai) {
             rawResultJson = await callOpenAI(prompt, model);
        } else if (model.toLowerCase().startsWith('claude') && anthropic) {
             rawResultJson = await callAnthropic(prompt, model);
        } else {
             if (!googleAI) throw new Error('Default Google AI model unavailable.');
             console.warn(`Model ${model} not found or key missing, falling back to gemini-1.5-pro-latest.`); // <-- Update fallback model
             rawResultJson = await callGoogleAI(prompt, 'gemini-1.5-pro-latest'); // <-- Update fallback model
        }
        
        // 3. Extract & Parse JSON Array Response
        const jsonString = extractJsonString(rawResultJson);
        if (!jsonString) {
            console.error("Raw AI Response (parse text) failed extraction:", rawResultJson);
            throw new Error("Could not extract JSON array content from AI response for parsing text.");
        }

        parsedResponse = JSON.parse(jsonString);
        
        // Expecting an array
        if (!Array.isArray(parsedResponse)) {
            console.error("Parsed JSON is not an array:", parsedResponse);
            throw new Error("AI response JSON structure invalid (expected an array of jokes).");
        }

        // Basic validation of array items (optional but good)
        suggestedJokes = parsedResponse.filter(joke => 
            joke && typeof joke.suggestedSetup === 'string' && typeof joke.suggestedPunchline === 'string'
        );

        console.log(`Successfully parsed text: Found ${suggestedJokes.length} potential jokes.`);

        // 4. Send Success Response
        res.json({ 
            suggestions: suggestedJokes 
        });

    } catch (error) {
        console.error(`--- TEXT PARSING FAILED ---`);
        console.error(`Error Message: ${error.message}`);
        if (prompt) console.error("Prompt (start) when error occurred:", prompt.substring(0, 300) + "...");
        if (rawResultJson) console.error("Raw Result JSON when error occurred:", rawResultJson);
        res.status(500).json({ error: error.message || 'Text parsing failed due to an internal server error.' });
    }
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log('** Ensure API keys in .env & SDKs installed! **');
});

// --- End of server.js ---