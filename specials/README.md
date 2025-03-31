# FunnyMachine

A comprehensive comedy analysis and generation system.

## Project Structure

```
FunnyMachine/
├── core_app/              # Main application code
│   ├── comedy_detector.py
│   ├── optimized-detector.py
│   └── test_detector.py
├── specials/             # Comedy specials processing
│   ├── server.js
│   ├── process_and_analyze.py
│   └── process_remaining_specials.py
├── llama/               # Llama integration
├── data/               # All data directories
│   ├── mp3_files/
│   ├── mp4_files/
│   ├── segmented_bits/
│   ├── tracklists/
│   ├── processed_data/
│   └── training_data/
├── utils/              # Shared utilities
│   ├── setup-script.py
│   └── bit-segmenter.py
└── config/            # Configuration files
    ├── .env
    └── guidelines/
```

## Setup

1. Install dependencies:
```bash
npm install
pip install -r requirements.txt
```

2. Configure environment variables in `config/.env`:
```
API_ENDPOINT=http://localhost:4321/api/analyze-jokes-batch
MODEL_TO_USE=gpt-4
```

3. Start the server:
```bash
node specials/server.js
```

4. Process comedy specials:
```bash
python specials/process_and_analyze.py
```

## Components

- **Core App**: Main comedy detection and analysis engine
- **Specials**: Processing and analysis of comedy specials
- **Llama**: Integration with Llama for advanced language processing
- **Utils**: Shared utilities and helper functions
- **Data**: All data files and processed outputs
- **Config**: Configuration files and environment settings

## Development

1. Open the project in Cursor
2. Set up your environment variables
3. Start the server
4. Run the processing scripts

## Notes

- The server runs on port 4321 by default
- All processed data is saved in `data/processed_data/`
- Training data is stored in `data/training_data/`
- Configuration files are in `config/` 