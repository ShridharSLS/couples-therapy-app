# Couples Therapy App

A Next.js application for couples therapy exercises, featuring a clean, modern interface for interactive therapy sessions.

## Overview

This application provides a platform for couples to engage in therapeutic exercises together in a secure, isolated session. Each couple creates their own "room" with a unique session ID, allowing multiple couples to use the platform simultaneously without any data overlap.

## Features

- **Session-based architecture**: Create private rooms for each couple
- **Exercise library**: Interactive therapy exercises
- **No data persistence**: All inputs are reset after the session ends
- **Clean, modern UI**: Soothing design suitable for mental health applications

## Technology Stack

| Layer       | Technology                             |
| ----------- | -------------------------------------- |
| UI          | Next.js                                |
| Styling     | Tailwind CSS                           |
| State       | React `useState` / `useContext`        |
| Data        | Static JSON                            |
| Room System | Random URL session codes               |

## Getting Started

### Prerequisites

- Node.js 16.x or higher (recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Homepage**: Click "Create New Session" to generate a unique room
2. **Exercise List**: Select an exercise to begin
3. **Exercise**: Follow the prompts and input your responses
4. **Complete**: Click "Back to Exercises" to try another exercise or "Leave Session" to end

## Project Structure

```
couples-therapy-app/
├── src/
│   ├── app/                 # Next.js App Router 
│   ├── components/          # React components
│   ├── context/             # React Context providers
│   └── data/                # Static data files
├── public/                  # Static assets
└── ...config files
```

## Privacy

This application does not store or persist any user data beyond the current session. All inputs are cleared when the session ends.
