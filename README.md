# FunnyMachine

A comprehensive comedy analysis and processing system that combines various tools and models for analyzing comedy specials and generating insights.

## Project Structure

- `comedy-construction-engine/`: Main application server and services
- `specials/`: Processing pipeline for comedy specials
- `llama-models/`: LLM models and training data (submodule)
- `mobile-app/`: Mobile application for comedy analysis
- `config/`: Configuration files
- `scripts/`: Processing and utility scripts

## Components

### Backend
- Server implementation in Node.js
- Python processing scripts
- Llama model integration
- Comedy specials analysis pipeline

### Mobile App
- Native mobile application
- Real-time comedy analysis
- Integration with backend services
- User interface for comedy insights

## Setup

1. Clone the repository:
```bash
git clone [your-repo-url]
cd FunnyMachine
git submodule update --init --recursive
```

2. Install dependencies:
```bash
# Python dependencies
pip install -r requirements.txt

# Node.js dependencies
npm install

# Mobile app dependencies
cd mobile-app
npm install  # or yarn install
```

3. Set up environment variables:
- Copy `.env.example` to `.env`
- Update the variables as needed

## Development

### Backend Development
- Python scripts are in the `scripts/` directory
- Main server code is in `comedy-construction-engine/`
- Processing scripts for specials are in `specials/`

### Mobile App Development
- Mobile app code is in `mobile-app/`
- Follow the mobile app's README for specific setup instructions

## License

[Your chosen license]

## Contributing

See CONTRIBUTING.md for guidelines. 