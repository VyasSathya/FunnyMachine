# Project Structure

This document outlines the main directories within the FunnyMachine workspace.

- **/api**: Contains the Node.js Express backend API.
  - Handles core business logic, user authentication, database interactions (PostgreSQL), and Redis caching/rate limiting.
- **/comedy-construction-engine**: Contains the React-based frontend web application and its associated Node.js server.
  - Provides the user interface for comedy analysis and construction.
  - Includes a small server component (details TBD).
- **/mobile-app**: Contains the code for the mobile application (details TBD).
- **/scripts**: Utility scripts for various tasks.
- **/config**: Configuration files (contents TBD).
- **/specials**: Data related to comedy specials (contents TBD).
- **ports.md**: Documents the network ports used by each component.
- **package.json**: Root workspace configuration for running scripts across sub-projects. 