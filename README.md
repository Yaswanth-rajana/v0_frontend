# Khel Club – Frontend (v0_frontend)

Next.js (App Router) user and referee portal for the Khel Club tournament management system.

## Overview

This repository provides tournament visualization, match fixtures, interactive knockout brackets, and referee scoring interfaces, including full support for Walkover match outcomes.

## Key Features

- **Tournament Fixture Views**:
  - Pool-wise and Round-Robin views.
  - Interactive Knockout Brackets (Single Elimination with SVG pan-zoom and alternate bracket representations).
  - Dynamic default fixture view selection: elimination tournaments open the bracket view by default.
- **Walkover Management & Visualization**:
  - Referee Walkover declaration workflow with team selection and confirmation dialogs.
  - Distinct amber `WALKOVER` badge on fixture cards, referee tables, and brackets.
  - Winner highlighting with crown `👑` and conceded team status.
  - Suppresses numerical scores for Walkovers (`W/O` vs `-`).
  - Pending / unplayed matches display neutral `—` instead of deceptive placeholder zeroes (`0–0`).
  - Immutability enforcement: finalized matches cannot be edited or overridden from the referee interface.
- **Production Resilience**:
  - Server Component dynamic route wrappers for Next.js 15 App Router (`[id]`).
  - Global error handling suppressing raw browser/extension unhandled event rejections.

## Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- Running backend service (`v0_backend` on `http://localhost:5001`)

### Environment Configuration

Create a local environment file from `.env.example`:

```bash
cp .env.example .env.local
```

### Installation

```bash
npm install
```

### Development Server

Run the development server on `http://localhost:3000`:

```bash
npm run dev
```

### Production Build

Create an optimized production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Library**: React 18
- **Styling**: SCSS Modules, Material UI (@mui/material, @mui/icons-material)
- **Brackets**: `@g-loot/react-tournament-brackets`, `react-brackets`
- **Realtime**: `socket.io-client`
- **Notifications**: `react-hot-toast`
- **Form Management**: Formik & Yup

## Future Improvements

### Scalability and Future Match Outcomes

The current implementation introduces a `result_type` field to distinguish regular matches from non-scoring outcomes such as Walkover.

The architecture separates match outcome state from numerical scoring and reuses the existing knockout progression mechanism to advance winners.

The current implementation is partially extensible. However, some backend serialization and frontend presentation logic still contain Walkover-specific conditions.

Future improvements include:

- Generalizing outcome declaration into a reusable API supporting multiple result types.
- Centralizing winner validation, finalization and progression rules.
- Replacing Walkover-specific frontend conditions with shared outcome-rendering utilities.
- Supporting Forfeit as another non-scoring match outcome.
- Supporting Bye during knockout bracket generation with automatic winner advancement.
- Reducing redundant state by using `result_type` as the primary source of truth instead of maintaining a separate Walkover boolean.

For this submission, Forfeit and Bye are considered future extensions and have not been implemented.

