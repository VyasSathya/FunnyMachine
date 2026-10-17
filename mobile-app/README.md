# FunnyMachine Mobile App

Mobile application for the FunnyMachine comedy analysis system.

## Features

- Real-time comedy analysis
- Integration with Llama models
- User interface for comedy insights
- Specials processing and analysis
- Offline capabilities

## Tech Stack

- React Native / Expo
- TypeScript
- Native modules for performance
- Secure API integration

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Run on your device:
- iOS: `npm run ios`
- Android: `npm run android`

## Project Structure

```
mobile-app/
├── src/              # Source code
│   ├── components/   # Reusable components
│   ├── screens/      # App screens
│   ├── services/     # API and business logic
│   ├── utils/        # Helper functions
│   └── types/        # TypeScript types
├── assets/          # Static assets
└── config/          # Configuration files
```

## API Integration

The mobile app communicates with the FunnyMachine backend through secure APIs:
- Comedy analysis endpoints
- Specials processing
- User authentication
- Real-time updates

## Contributing

See the main project's CONTRIBUTING.md for guidelines. 