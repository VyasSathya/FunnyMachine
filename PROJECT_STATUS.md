# FunnyMachine Project Status

## Current Goals
1. Process and analyze comedy specials using AI to extract:
   - Individual jokes/bits
   - Laughter timestamps
   - Audience reactions
   - Comedy techniques
   - Themes and callbacks

2. Fix Server Issues:
   - OpenAI constructor error in server.js
   - JSON parsing errors from AI responses
   - Port conflict (4321 already in use)

## Recent Progress
- Successfully processed several comedy bits:
  - Bit 2: 93 laughs, 149.00s total laughter
  - Bit 3: 78 laughs, 146.50s total laughter
  - Bit 4: 87 laughs, 169.00s total laughter
  - Bit 5: 101 laughs, 147.75s total laughter

## Current Issues
1. OpenAI Response Parsing:
   - Server receiving non-JSON responses from OpenAI
   - Need to improve JSON extraction from AI responses
   - Common error patterns:
     - "Unexpected token" errors for responses starting with natural language
     - Unexpected characters after valid JSON

2. Server Configuration:
   - OpenAI client initialization failing
   - Port 4321 conflicts
   - Need to ensure proper API key setup in .env

## Next Steps
1. Fix OpenAI client initialization:
   ```javascript
   import OpenAI from 'openai';
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
     dangerouslyAllowBrowser: true
   });
   ```

2. Improve JSON parsing with better error handling:
   - Add JSON validation
   - Implement robust extraction of JSON from AI responses
   - Add fallback parsing strategies

3. Update server configuration:
   - Change default port to 3001
   - Add better error handling for port conflicts
   - Implement graceful shutdown

## Project Structure
```
FunnyMachine/
├── core_app/         # Core application code
├── data/            # Data storage
│   ├── mp3_files/
│   ├── mp4_files/
│   ├── segmented_bits/
│   ├── processed_data/
│   └── training_data/
├── utils/           # Utility functions
├── config/          # Configuration files
└── llama/          # Llama integration
```

## Environment Setup
1. Required API keys in `.env`:
   - OPENAI_API_KEY
   - ANTHROPIC_API_KEY
   - GOOGLE_API_KEY

2. Dependencies:
   - Node.js packages in package.json
   - Python requirements in requirements.txt

## Notes
- The server uses multiple AI providers (OpenAI, Anthropic, Google) for redundancy
- JSON parsing needs to be more robust to handle various AI response formats
- Consider implementing rate limiting and batch size controls 