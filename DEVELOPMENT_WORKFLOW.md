# Development Workflow

This document describes the basic steps to set up and run the FunnyMachine project locally.

## Prerequisites

1.  **Node.js & npm**: Ensure Node.js (which includes npm) is installed.
2.  **Git**: For cloning and managing the repository.
3.  **PostgreSQL**: Install PostgreSQL. Set the `postgres` user password during installation (default expected is `funnymachine`).
4.  **Redis**: Install and ensure Redis is running.

## Setup

1.  **Clone the repository**: `git clone <repository_url>`
2.  **Navigate to root**: `cd FunnyMachine`
3.  **Install root dependencies**: `npm install` (This may not be strictly necessary if only using scripts, but good practice).
4.  **Install API dependencies**: `cd api && npm install`
5.  **Install Frontend dependencies**: `cd ../comedy-construction-engine && npm install`
6.  **(TODO)** Install Mobile App dependencies: `cd ../mobile-app && npm install`
7.  **Configure Environment Variables**: Create `.env` files in `/api` and `/comedy-construction-engine` based on any `.env.example` files or required settings (e.g., database credentials, API keys).
8.  **Database Setup**: From the root directory (`FunnyMachine`), run: `npm run api:db:setup`

## Running the Application

All commands should be run from the **root directory** (`FunnyMachine`).

-   **Run API Server (dev mode)**: `npm run api:dev` (Defaults to port 3000)
-   **Run Frontend (dev mode)**: `npm run frontend:start` (Defaults to port 5173)
-   **Run Comedy Engine Server**: `npm run comedy-engine:start` (Defaults to port 3001)
-   **(TODO)** Run Mobile App:
    -   `npm run mobile:start` (or specific commands like `mobile:ios`, `mobile:android`)

## Running Tests

-   **Run API Tests**: `npm run api:test`
-   **Run Frontend Tests**: `npm run frontend:test`
-   **(TODO)** Run Mobile App Tests: `npm run mobile:test` 