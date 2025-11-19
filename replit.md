# Overview

OPHTHALMOS is a color vision deficiency (CVD) adaptive UI research application. It tests users' cone sensitivity through interactive assessments, allows customization of RGB hue adjustments, and compares performance on visual tasks between custom adaptive filters and OS-level preset filters (protanopia, deuteranopia, tritanopia, grayscale). The application collects quantitative metrics (time, accuracy, interactions) to evaluate the effectiveness of personalized color adaptation strategies.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, built using Vite for development and bundling.

**Routing**: Wouter-based client-side routing with multi-page flow:
- Questionnaire → Cone Test → CVD Results (RGB adjustment) → Task Games → Statistics

**UI Components**: shadcn/ui component library (Radix UI primitives) with Tailwind CSS for styling. Custom design system follows modern minimal aesthetic inspired by Linear/Vercel with neutral color palette and CSS variables for theming.

**State Management**: React Context API (`AppContext`) manages global application state including:
- Session data (questionnaire responses, cone test results, RGB adjustments)
- Task performance metrics (time, swipes, clicks, accuracy)
- Current filter mode selection (custom vs. OS presets)
- Navigation/step tracking

**Data Fetching**: TanStack Query (React Query) for server state management with custom `apiRequest` wrapper for API calls.

**Color Processing**: Custom color utility functions for:
- Hex/RGB/HSL conversions
- Contrast ratio calculations (WCAG compliance)
- Adaptive cone-based color transformations
- OS preset filter simulations (protanopia, deuteranopia, tritanopia, grayscale)

## Backend Architecture

**Runtime**: Node.js with Express server, TypeScript compiled via esbuild.

**API Design**: RESTful endpoints following resource-oriented patterns:
- `POST /api/sessions` - Create session with questionnaire data
- `GET /api/sessions/:id` - Retrieve session
- `PUT /api/sessions/:id/cone-test` - Update cone test results
- `PUT /api/sessions/:id/rgb-adjustment` - Update RGB adjustments
- `POST /api/sessions/:id/tasks` - Record task performance

**Data Validation**: Zod schemas in `shared/schema.ts` for runtime type validation and serialization between client/server.

**Storage Strategy**: In-memory storage (`MemStorage` class) with interface (`IStorage`) designed for easy swap to persistent database (Postgres with Drizzle ORM configuration present but not actively used).

**Development Features**: Vite middleware integration for HMR, custom logging middleware for API request tracking.

## Data Architecture

**Schema Definitions** (shared between client/server):

1. **Questionnaire**: User demographics (name, age, CVD type, screen time)
2. **ConeTestResult**: L/M/S cone sensitivity values (0-1) and detected deficiency type
3. **RGBAdjustment**: Custom hue rotation values for red/green/blue channels (0-360°)
4. **TaskPerformance**: Metrics for each task attempt (taskId, filterType, time, interactions, accuracy)
5. **SessionData**: Complete user session containing all above data structures

**Data Flow**: Questionnaire → Cone Test → RGB Adjustment → Task Performance Collection → Statistical Analysis

## External Dependencies

**UI Framework**:
- React 18.3+ for component architecture
- Wouter for lightweight routing
- shadcn/ui component library (23+ Radix UI components)

**Styling**:
- Tailwind CSS with custom design tokens
- CSS variables for theme customization
- PostCSS for processing

**Data Management**:
- TanStack Query for async state management
- Zod for schema validation
- React Hook Form with Zod resolvers for form handling

**Development Tools**:
- Vite for build tooling and dev server
- TypeScript for type safety
- tsx for server-side TypeScript execution

**Database (Configured but not active)**:
- Drizzle ORM with PostgreSQL dialect
- Neon serverless driver for Postgres
- Migration support via drizzle-kit

**Replit Integration**:
- Custom Vite plugins for Replit environment (cartographer, dev banner, runtime error overlay)
- Configured for seamless deployment on Replit platform

**Color Science & Psychophysics**:
- Custom implementations of colorimetric transformations
- Heuristic-based cone adaptation algorithms
- WCAG contrast ratio calculations
- Staircase threshold calculator for adaptive psychophysical testing
  - Reversal detection algorithm
  - Threshold estimation from fixed-level test data
  - Psychometric function analysis

**Note**: The application uses an in-memory storage implementation for rapid prototyping. Database configuration (Drizzle + Postgres) is present for future migration to persistent storage when needed.

## Recent Updates (November 15, 2025)

**Cone Test Improvements:**
- Simplified from adaptive staircase to fixed contrast levels: [1%, 5%, 10%, 25%, 50%, 100%]
- Reduced total trials from 60 to 18 (6 per color × 3 colors)
- Test completion time: ~5 minutes
- Smaller Landolt C design (radius 30, stroke 12)
- All 4 tick marks now visible with gap alignment at each rotation
- Removed fixation cross from test panel

**Threshold Calculator Implementation:**
- Added `client/src/lib/staircaseThreshold.ts` with TypeScript implementation
- Functions:
  - `thresholdFromReversals()` - Analyzes adaptive staircase sequences
  - `thresholdFromFixedLevels()` - Calculates thresholds from fixed-level test data
  - Reversal point detection with direction change tracking
- New demo page at `/staircase-demo` for testing and visualization
- Integrated into ConeTest results calculation for more accurate threshold estimation
- Replaces simple averaging with psychometric analysis (geometric mean between highest incorrect and lowest correct levels)

## Recent Updates (November 19, 2025 - Part 2)

**Randomized Color System for Filter Verification:**

**Problem:** Users couldn't easily verify if filters were actually working, as both custom and OS preset phases used the same base colors.

**Solution:** Implemented phase-specific color randomization - custom phase and OS preset phase now use completely different randomized colors.

**Implementation (`client/src/context/AppContext.tsx`):**
- New `PhaseColors` interface defines color sets for each phase:
  - `tileColors`: Array of 6 random colors for tile game
  - `colorMatchTarget`: Single target color for color matcher
  - `cardColors`: Array of 6 unique card colors
- `generatePhaseColors()` function creates randomized color palettes:
  - Tile colors: Random hues (0-360°), 60-90% saturation, 40-60% lightness
  - Color match target: Random hue, 75% saturation, 55% lightness
  - Card colors: Well-separated hues (60° apart + randomness), 65-90% saturation, 45-65% lightness
- State fields added:
  - `customPhaseColors`: Generated when starting custom tasks
  - `presetPhaseColors`: Generated when switching to OS preset tasks
- Color regeneration triggers:
  - Custom phase: When clicking "Continue to Task Comparison" in CVDResults
  - OS preset phase: When clicking "Start OS Preset Tasks" in TaskGames

**Game Updates:**
- All three games now accept phase-specific colors as props
- `TileGame`: Uses `colorPool` from phase colors
- `ColorScrollMatcher`: Uses `targetColor` from phase colors
- `CardMatchingGame`: Uses `cardColors` from phase colors
- Removed hardcoded `CARD_COLORS` constant

**How to Verify Filters Are Working:**

1. **Visual Comparison Method:**
   - Complete questionnaire and cone test
   - Start custom phase tasks - note the colors (e.g., card game might show reds, greens, blues)
   - Complete all 3 custom games
   - Start OS preset tasks - **the colors will be completely different!** (e.g., purples, oranges, teals)
   - This proves both filter systems are transforming different base colors

2. **Statistics Page Verification:**
   - Navigate to `/statistics` after completing both phases
   - Check "Custom Adaptive Filter" column - should show data for all 3 games
   - Check OS preset column (e.g., "Deuteranopia") - should show different data
   - Both columns should have non-zero totals (time, swipes, clicks)
   - Confirms both filter types are being saved correctly

3. **Browser Console Verification:**
   - Open browser console (F12)
   - Look for `[TaskGames] Saving task performance:` logs
   - Custom phase tasks will show `filterType: "custom"`
   - OS preset phase tasks will show `filterType: "protanopia"` (or deuteranopia/tritanopia/grayscale)
   - Confirms filter mode is correctly applied during task execution

4. **API Verification:**
   - GET `/api/sessions/<session-id>` after completing both phases
   - Check `taskPerformances` array should contain 6 entries:
     - 3 with `filterType: "custom"`
     - 3 with `filterType: "<selected-preset>"` (e.g., "deuteranopia")
   - Confirms backend is correctly persisting filter data

**Expected Behavior:**
- Custom phase: Adaptive filter applies hue shifts, saturation boost, luminance gain to randomized Set A colors
- OS preset phase: iOS matrix transformations apply to completely different randomized Set B colors
- Different base colors + different filter algorithms = clear visual proof both systems work independently

## Recent Updates (November 19, 2025 - Part 1)

**Advanced Colorblind Filter Implementation:**
Replaced simple RGB hue rotation system with research-grade adaptive filter based on cone test results.

**Algorithm (`client/src/lib/advancedFilter.ts`):**
- `createAdvancedColorblindFilter()` - Generates personalized filter parameters from L/M/S cone thresholds
- Determines deficient cone type (red/green/blue) from highest threshold deviation
- Calculates severity score (0-40 range, relative to normal threshold ~7%)
- Generates confusion line-aware hue shifts (0-25° max)
- Computes saturation boost (0-80%) and luminance gain (0-25%) scaled by severity
- Implements distinct strategies for each CVD type:
  - **Deutan (M-cone/green)**: Shifts green toward yellow, red opposite to widen separation
  - **Protan (L-cone/red)**: Shifts red toward magenta to break red-green confusion
  - **Tritan (S-cone/blue)**: Shifts blue toward cyan, reduces yellow components

**Filter Application (`client/src/utils/filters.ts`):**
- `applyAdvancedColorblindFilter()` - Applies filter transformations to hex colors
- Maps colors to hue regions (red-yellow 0-60°, green-cyan 60-180°, blue-magenta 180-300°)
- Applies region-specific hue shifts based on confusion line modeling
- Boosts saturation and luminance for deficient cone channels
- Preserves achromatic colors (grays) unchanged

**Schema Updates (`shared/schema.ts`):**
- New `AdvancedFilterParams` schema with typed structure:
  - `type`: Deficient cone ('red' | 'green' | 'blue')
  - `severity`: Numeric deficiency score
  - `hueShift`: Per-channel rotation values (degrees)
  - `saturationBoost`: Channel-specific saturation multipliers
  - `luminanceGain`: Channel-specific brightness increases
  - `metadata`: Source threshold values for traceability
- Updated `SessionData` to include optional `advancedFilterParams` field
- Retained deprecated `RGBAdjustment` for backwards compatibility

**UI Changes (`client/src/pages/CVDResults.tsx`):**
- Replaced manual RGB adjustment sliders with read-only filter parameter display
- Shows auto-generated filter specifications:
  - Deficient cone type and severity badge (Minimal/Mild/Moderate/Severe)
  - Hue shift values for each color channel
  - Saturation boost percentages
  - Brightness increase percentages
- Explains filter methodology (confusion lines, saturation/brightness adaptation, severity scaling)

**Integration:**
- AppContext automatically generates filter params when cone test completes
- Backend routes handle advanced filter parameter persistence (`POST /api/sessions/:id/advanced-filter`)
- TaskGames applies filter based on mode: custom uses advanced filter, OS presets use simulation matrices
- Navigation allows direct switching between custom and OS preset filter modes for A/B comparison