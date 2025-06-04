# PROJECT-CHARTER.md

## Quizzard Project Charter & Workflow Guide

### 1. Project Rules & Standards

- **Framework:** React (web) / React Native (future), TypeScript
- **UI:** Google Material Design (MUI), no custom UI libraries unless essential
- **Styling:**
  - All global and component styles must be defined before feature development
  - Light and dark themes must be fully implemented and switchable
  - Pixel-perfect, device-consistent appearance (strict responsive rules)
  - Use only built-in or native solutions; avoid unnecessary dependencies
  - Footer and header must be fully responsive and accessible on all devices
  - Main menu and landing page buttons must never overflow viewport on any device
  - MUI modal backdrops (Drawer, Dialog, etc.) must have a subtle blur (1.5px) for focus effect
- **Structure:**
  - Each main tool (Random Team Generator, Points Counter, etc.) is a separate feature/project
  - Landing page (main) lists all tools as primary navigation/entry points
  - Footer must include copyright, navigation, social, and support links
- **Hosting:**
  - Hosted on GitHub Pages
  - Auto-update via GitHub Actions (to be set up)
- **Database:**
  - Plan for persistent storage (Points Counter, future features)
  - Use local storage or IndexedDB for now; design for easy migration
- **Terminal/Automation:**
  - Do not use `&&` to chain commands in terminal scripts or documentation. Use separate lines or platform-appropriate alternatives for cross-platform compatibility.

### 2. Progress Tracker

- [x] Project initialized (React + TypeScript + MUI)
- [x] All base styles and themes complete
- [x] Landing page with navigation to tools
- [x] Responsive, pixel-perfect layout (including mobile menu and footer)
- [x] GitHub repository created and code pushed (private)
- [x] Footer implemented: dynamic year, logo, navigation, GitHub/support links, responsive
- [x] Drawer accessibility: focus trap, ARIA, keyboard nav, subtle animation, blur backdrop
- [x] Main menu buttons always fit viewport (no overflow on mobile)
- [x] About page navigation (hash-based routing with proper state management)
- [ ] Random Team Generator (placeholder)
- [ ] Points Counter (placeholder)
- [ ] GitHub Pages deploy set up
- [ ] Auto-update workflow

#### **Main Tools (Landing Page)**

- [ ] Random Team Generator (future: full feature)
- [ ] Points Counter (future: full feature)
- [ ] (Add more tools here as needed)

### 3. Main Points & Priorities

- Professional, minimal, and consistent UI/UX
- All styles and themes ready before features
- No unnecessary dependencies or folders
- Device consistency is mandatory
- Landing page is the current focus
- Footer and header must always be accessible and responsive
- All overlays (Drawer, Dialog, etc.) must blur background for focus

### 4. Change Log / Decisions

- **2025-06-04:** Project charter created. Decided to focus on landing page and tool placeholders first. All styles/themes must be ready before feature work.
- **2025-06-04:** Initialized git, created private GitHub repo, and pushed code. Local development and private remote workflow established. Will make public and enable GitHub Pages when ready.
- **2025-06-04:** Implemented global MUI backdrop blur (1.5px) for all modals/drawers. Fixed main menu button overflow on mobile. Footer now includes copyright, navigation, GitHub, and support links, and is fully responsive.

---

## Color Palette Reference

### Light Theme

- primary: #FF6F61 (coral red)
- secondary: #FFD166 (warm yellow)
- error: #D7263D (crimson red)
- warning: #F29E4C (orange)
- info: #3A86FF (vivid blue)
- success: #43AA8B (teal green)
- background: #FFF8F0 (very light warm beige)
- paper: #FFFFFF (white)
- text primary: #2D3142 (dark blue-grey)
- text secondary: #595260 (muted purple-grey)

### Dark Theme

- primary: #FFB4A2 (peach)
- secondary: #B5838D (warm mauve)
- error: #FF6F61 (coral red)
- warning: #FFD166 (warm yellow)
- info: #3A86FF (vivid blue)
- success: #43AA8B (teal green)
- background: #2D3142 (dark blue-grey)
- paper: #22223B (deep indigo)
- text primary: #FFF8F0 (very light warm beige)
- text secondary: #B5B5B5 (soft grey)

---

**Always update this file with new rules, progress, and decisions. This is the single source of truth for the project.**

**AI/Automation Workflow Rule:**

- This file must be referenced and updated after every significant project change, decision, or milestone.
- If using an AI assistant, always instruct it to check and update this file as part of your workflow.
- Pin this file in your editor for visibility, but also make it a habit to review and update it regularly.
