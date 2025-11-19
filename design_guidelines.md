# Design Guidelines: CVD Research Assessment Application

## Design Approach
**System-Based Approach**: Inspired by clinical research platforms and healthcare applications (MyChart, NIH research portals), combined with modern assessment tools (Typeform, Cambridge Brain Sciences). The design prioritizes clarity, trustworthiness, and scientific credibility while maintaining approachability for diverse users.

## Typography
- **Primary Font**: Inter (Google Fonts) - clean, highly legible for data and forms
- **Hierarchy**:
  - Assessment titles: text-4xl to text-5xl, font-bold, tracking-tight
  - Section headers: text-2xl to text-3xl, font-semibold
  - Question text: text-xl, font-medium (high readability priority)
  - Body/instructions: text-base to text-lg, font-normal, leading-relaxed
  - Data labels: text-sm, font-medium, uppercase tracking-wide
  - Results/metrics: text-3xl to text-6xl, font-bold (tabular-nums for consistency)

## Layout System
**Spacing**: Tailwind units of 4, 6, 8, 12, 16, 20, 24 for generous breathing room
- Page padding: py-12 md:py-20
- Container: max-w-4xl mx-auto px-6 (narrower for better readability)
- Assessment containers: max-w-3xl (optimal for questionnaires)
- Card/component gaps: gap-8 to gap-12

## Component Library

### Hero Section (70vh)
- Professional photograph backdrop: researcher/laboratory/vision science imagery establishing credibility
- Centered content overlay with blurred-background container
- Primary headline: "Professional Color Vision Assessment"
- Subheading: Clear explanation of research purpose and time commitment
- Single prominent CTA button with blurred background: "Begin Assessment"
- Trust indicators below: "Research-backed • 15-20 minutes • Confidential"

### Progress Tracker
- Fixed top bar showing assessment stages: "Profile → Questionnaire → Sensitivity Tests → Task Games → Results"
- Visual progress bar with completed/current/upcoming states
- Step numbers and titles clearly labeled
- Sticky positioning during scroll

### Assessment Dashboard
- Clean card-based layout introducing assessment structure
- 4-card grid (grid-cols-1 md:grid-cols-2) showing:
  - Demographic Questionnaire (5 min)
  - Cone Sensitivity Tests (5 min)
  - Adaptive Task Games (8 min)
  - Results & Recommendations (2 min)
- Each card includes icon (Heroicons: clipboard, beaker, puzzle, chart-bar), time estimate, brief description

### Questionnaire Interface
- Single-question-per-screen approach for focus
- Large, clear question text at top
- Answer options as large touch-friendly cards/buttons (min-height sufficient for accessibility)
- Previous/Next navigation at bottom
- Question counter: "Question 3 of 12"
- Optional skip functionality where appropriate

### Test Interface Components
**Cone Sensitivity Tests**:
- Full-screen canvas area for visual tests
- Clear instructions panel above test area
- Sample/calibration screens before actual tests
- Response buttons positioned consistently (bottom or sides)
- Timer display when applicable

**Task-Based Games**:
- Game canvas centered with adequate margins
- Score/performance metrics in corner (non-intrusive)
- Pause/restart controls easily accessible
- Instructions toggle button

### Results Dashboard
- Hero results card: Primary CVD classification (large, clear typography)
- Multi-section breakdown:
  - Visual data representation (charts using simple geometric shapes)
  - Cone sensitivity profile (horizontal bar charts)
  - Task performance metrics (grid of stat cards)
  - Personalized recommendations section
- Export/share results button
- "Retake Assessment" secondary action

### Form Elements
- Input fields: Generous padding (py-4 px-5), clear focus states with border emphasis
- Radio buttons: Large clickable cards rather than tiny circles
- Checkboxes: Custom styled for better visibility
- Dropdowns: Clean select menus with adequate height
- All form elements include clear labels above, helper text below when needed

### Navigation
- Minimal header: Logo/title left, "Save & Exit" button right
- During assessment: No main navigation to prevent distraction
- Breadcrumb trail for multi-step processes
- Footer (post-assessment only): Research info, privacy policy, contact

### Cards & Containers
- Consistent treatment: rounded-xl, generous padding (p-8 to p-10)
- Elevation: shadow-sm for standard cards, shadow-lg for active/focused elements
- Clear visual hierarchy through spacing and borders

### Button States
**Primary Actions**: Large (px-8 py-4), rounded-lg, font-semibold
**Secondary Actions**: Outlined style, same sizing
**Button Hierarchy**: 
  - One primary per screen
  - Secondary for alternative actions
  - Text buttons for tertiary actions
All buttons include clear hover states (subtle transform, shadow increase) and active states (slight scale down)

### Data Visualization
- Bar charts: Horizontal orientation for easier reading
- Progress rings: Large (min 120px diameter) for key metrics
- Color-blind safe patterns: Use texture/pattern fills in addition to distinguishing visual treatment
- Data tables: Zebra striping, adequate row height (py-4), clear column headers

## Images

### Hero Section Image
**Placement**: Full-width background image (70vh height)
**Description**: Professional photograph of vision research - options include: close-up of eye examination equipment, researcher conducting colorimetry tests, abstract artistic representation of color spectrum through scientific lens, or laboratory setting with color calibration tools. Image should convey expertise and scientific rigor while remaining approachable. Subtle overlay gradient to ensure text readability.

### Trust-Building Section Images
**Placement**: About/methodology section (if included)
**Description**: Supporting imagery showing research process, team credentials, or institutional partnerships. Use sparingly - only where they enhance credibility.

**No decorative images elsewhere** - maintain clinical focus throughout assessment interface. Icons from Heroicons library for all UI elements.

## Accessibility & Clinical Requirements
- WCAG AAA contrast ratios for all text (especially critical for CVD users)
- Large touch targets (minimum 44x44px) throughout
- Clear keyboard navigation paths
- Screen reader optimized labels and instructions
- No time pressure on tests unless scientifically required
- Consistent button positioning across all assessment screens