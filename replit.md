# Overview

OPHTHALMOS is a research application designed to evaluate personalized adaptive user interfaces for individuals with color vision deficiency (CVD). It assesses users' cone sensitivities, allows for customization of RGB hue adjustments, and compares the performance of custom adaptive filters against standard OS-level preset filters (protanopia, deuteranopia, tritanopia, grayscale) on visual tasks. The application collects quantitative metrics (time, accuracy, interactions) to measure the effectiveness of these color adaptation strategies. The business vision is to provide a robust platform for researching and developing advanced, personalized color correction technologies, potentially leading to improved accessibility and visual experiences for millions globally.

# Recent Changes (November 19, 2025)

**Advanced Filter Recommendation System:**
- Added `getRecommendedFilter()` function to determine optimal colorblind filter based on user-reported type and/or cone test scores
- Implements intelligent blending when scores are close across multiple CVD axes (< 4 point difference on 0-40 scale)
- Returns normalized severity (0-1) with weighted contributions from secondary axes when applicable
- Handles all edge cases: missing user type, undefined scores, close multi-axis scores
- Fully typed with TypeScript interfaces: `ConeTestScores` and `RecommendedFilter`

**Confusion Matrix Filter Implementation:**
- Replaced simple hue shift approach with scientifically accurate Brettel et al., 1997 confusion matrices
- Separate matrices for protanopia, deuteranopia, and tritanopia with severity-based scaling
- Fixed severity normalization from 0-40 scale to 0-1 for consistent matrix intensity
- Added tolerance-based achromatic guard (ε=0.01) to prevent grayscale color shifts
- RGB clamping after matrix transformation prevents invalid color values
- Safe HSL conversion with division-by-zero guards for grayscale inputs
- CVD Results page updated with confusion axis explanations and matrix intensity visualization

**Task Accuracy System Overhaul:**
- Extended TaskPerformance schema with optional `accuracy` field (0-1 ratio) for precise performance measurement
- Updated all three task games (Tile Matching, Color Scroll, Card Matching) to pass structured `{correct, accuracy}` objects to onComplete
- Statistics page now displays real accuracy percentages instead of just pass/fail status
- Tile Matching: accuracy = correctRounds/totalRounds (3 rounds)
- Color Scroll: accuracy = 1 or 0 (single attempt)
- Card Matching: accuracy = correctMatches/totalAttempts

**Normal Vision Filter Handling:**
- Added conditional logic to skip all filter transformations (both custom adaptive and OS presets) when user's detected CVD type is "normal"
- Ensures users with normal color vision see unaltered colors during task games

**Professional UI Redesign (Myers-Briggs Style):**
- Implemented professional teal (#0d9488) primary and purple (#8b5cf6) secondary color scheme
- Redesigned buttons with larger sizes (14px/28px padding), hover elevations, and color-matched shadows
- Enhanced card styling with subtle borders and layered shadows
- Improved typography with better letter spacing, weights, and hierarchy
- Added professional gradient background (light blue to white)
- Better input focus states with ring animations matching primary color
- Improved tile hover interactions with scale transforms and border highlights
- **Start game buttons**: White background with teal text/border, uppercase styling, 16px/40px padding for prominence
- **Cone test progress bar**: Blue (teal) progress indicator with grey remainder track
- **Task game page enhancements**: Added teal-gradient game container, centered titles, better spacing, teal-accented stats badges

**Enhanced Tile Matching Game Randomization:**
- Each of the 3 rounds now generates completely fresh random colors using new HSL seed values instead of reusing a pre-generated color pool
- Ensures visual variety and prevents pattern memorization across rounds

**Statistics Page Enhancements:**
- Added average accuracy summary metrics to Total sections for both Custom and OS Preset filter columns
- Calculates average by aggregating accuracy across all three task games

**CVD Results Page Enhancements:**
- Added confusion axis-aware hue shift explanations based on CVD type:
  - Protanopia: Reds shift toward green/brown, Purples shift toward blue
  - Deuteranopia: Greens shift toward red/brown, Oranges/yellows affected
  - Tritanopia: Blues shift toward green, Yellows shift toward pink/light gray
- Implemented visual color spectrum gradient bar displaying the full 0°-360° hue wheel with labeled markers at key positions
- Uses non-overlapping hue ranges for accurate color name mapping

**Tile Matching OS Preset Compatibility Fix:**
- Increased hue shift from 15° to 75° for creating the odd tile
- Added 15% saturation boost and ±10 brightness adjustment
- Ensures odd tiles remain visually distinguishable after OS preset filter transformations

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for development. It features a multi-page client-side routing managed by Wouter, guiding users through a sequence of questionnaire, cone test, CVD results, task games, and statistics. UI components are sourced from shadcn/ui (Radix UI primitives) and styled with Tailwind CSS, adhering to a modern, minimal aesthetic with a neutral color palette and CSS variables for them. Global application state, including session data, task performance, and filter selections, is managed via React Context API. Data fetching utilizes TanStack Query with a custom API request wrapper. Custom color utility functions handle hex/RGB/HSL conversions, WCAG contrast calculations, adaptive cone-based transformations, and OS preset filter simulations.

## Backend Architecture

The backend is a Node.js Express server written in TypeScript. It provides a RESTful API with endpoints for session management, cone test results, RGB adjustments, and task performance recording. Zod schemas ensure data validation across client and server. The current storage strategy uses an in-memory solution, designed with an interface for future integration with a persistent database like PostgreSQL via Drizzle ORM.

## Data Architecture

Shared schema definitions between client and server include structures for Questionnaire, ConeTestResult, RGBAdjustment, TaskPerformance, and comprehensive SessionData. The application implements an advanced colorblind filter that generates personalized parameters based on L/M/S cone thresholds, determining deficient cone type, severity, and applying confusion line-aware hue shifts, saturation boosts, and luminance gains.

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
- Staircase threshold calculator (reversal detection, threshold estimation)