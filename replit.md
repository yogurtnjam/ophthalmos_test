# Overview

OPHTHALMOS is a research application designed to evaluate personalized adaptive user interfaces for individuals with color vision deficiency (CVD). It assesses users' cone sensitivities, allows for customization of RGB hue adjustments, and compares the performance of custom adaptive filters against standard OS-level preset filters on visual tasks. The application collects quantitative metrics (time, accuracy, interactions) to measure the effectiveness of these color adaptation strategies. The business vision is to provide a robust platform for researching and developing advanced, personalized color correction technologies, potentially leading to improved accessibility and visual experiences for millions globally.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for development. It features a multi-page client-side routing managed by Wouter, guiding users through a sequence of questionnaire, cone test, CVD results, task games, and statistics. UI components are sourced from shadcn/ui (Radix UI primitives) and styled with Tailwind CSS, adhering to a modern, minimal aesthetic with a neutral color palette. Global application state, including session data, task performance, and filter selections, is managed via React Context API. Data fetching utilizes TanStack Query with a custom API request wrapper. Custom color utility functions handle hex/RGB/HSL conversions, WCAG contrast calculations, adaptive cone-based transformations, and OS preset filter simulations.

## Backend Architecture

The backend is a Node.js Express server written in TypeScript. It provides a RESTful API with endpoints for session management, cone test results, RGB adjustments, and task performance recording. Zod schemas ensure data validation across client and server. The current storage strategy uses an in-memory solution, designed with an interface for future integration with a persistent database like PostgreSQL via Drizzle ORM.

## Data Architecture

Shared schema definitions between client and server include structures for Questionnaire, ConeTestResult, RGBAdjustment, TaskPerformance, and comprehensive SessionData. The application implements an advanced colorblind filter that generates personalized parameters based on L/M/S cone thresholds, determining deficient cone type, severity, and applying confusion line-aware hue shifts, saturation boosts, and luminance gains. A hybrid filter system detects mismatches between self-reported and CCT-detected CVD types, applying a combination of OS preset filters and confusion axis-specific hue adjustments.

## UI/UX Decisions

The UI features a clean white background throughout all pages with a sticky navigation header. Panels and cards utilize a consistent light grey theme with subtle borders and shadows. Buttons have a universal white background, black text, and hover effects. Typography is enhanced with improved letter spacing and hierarchy. Professional teal and purple accents are used for primary and secondary color schemes in specific components like progress bars and interactive elements.

## Feature Specifications

- **CVD Mismatch Detection & Hybrid Filter System:** Detects discrepancies between user-reported and CCT-detected CVD types. Upon persistent mismatch, a hybrid filter is activated, combining an OS preset with CCT-measured confusion axis adjustments.
- **Advanced Filter Recommendation System:** Determines optimal colorblind filters based on user-reported type and cone test scores, implementing intelligent blending for close scores.
- **Confusion Matrix Filter Implementation:** Replaces simple hue shifts with scientifically accurate Brettel et al., 1997 confusion matrices for protanopia, deuteranopia, and tritanopia, with severity-based scaling and achromatic guards.
- **Task Accuracy System:** Extends `TaskPerformance` schema with an `accuracy` field, providing precise performance measurement for all task games.
- **Normal Vision Handling:** Skips all filter transformations for users with detected normal color vision.
- **Enhanced Randomization:** Tile Matching game generates fresh random colors for each round using new HSL seed values.
- **Participant Profile:** The results page displays a comprehensive participant profile including name, age, self-reported CVD type, screen time, and detected CVD type.

# External Dependencies

**UI & Styling:**
- React 18+
- Wouter
- shadcn/ui (Radix UI primitives)
- Tailwind CSS
- PostCSS

**Data Management:**
- TanStack Query
- Zod
- React Hook Form

**Development Tools:**
- Vite
- TypeScript
- tsx

**Database (Configured, not actively used):**
- Drizzle ORM (PostgreSQL dialect)
- Neon (serverless Postgres driver)

**Replit Integration:**
- Custom Vite plugins for Replit environment (cartographer, dev banner, runtime error overlay)

**Color Science & Psychophysics:**
- Custom colorimetric transformations
- Heuristic-based cone adaptation algorithms
- WCAG contrast ratio calculations
- Staircase threshold calculator