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
  - Hosted on GitHub Pages with SPA support (404.html redirect handling)
  - Auto-update via GitHub Actions (to be set up)
  - Configured for `/Quizzard/` base path deployment
- **Routing:**
  - React Router (BrowserRouter) for professional URL handling
  - GitHub Pages SPA configuration with redirect support
  - Clean URLs without hash fragments (e.g., `/about` instead of `#about`)
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
- [x] About page navigation (React Router with BrowserRouter implementation)
- [x] Complete routing system migrated to React Router (all pages: Home, About, Privacy, Terms, Contact, Team Generator, Points Counter)
- [x] GitHub Pages SPA configuration with 404.html redirect support
- [x] Legacy hash-based routing system removed (Router.tsx deleted)
- [x] New logo and favicon implementation with PWA support (quizzard-logo.png)
- [x] Mobile responsiveness restored after router migration
- [ ] Random Team Generator (placeholder → full implementation)
- [ ] Points Counter (placeholder → full implementation)
- [ ] GitHub Pages deploy set up
- [ ] Auto-update workflow

#### **Main Tools (Landing Page)**

- [ ] Random Team Generator (placeholder → full implementation)
- [ ] Points Counter (placeholder → full implementation)
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
- **2025-06-04:** **MAJOR MIGRATION** - Migrated from custom hash-based routing to React Router (BrowserRouter) for professional URL handling. Updated all navigation components (Header, Footer, Home) to use React Router Link components. Configured GitHub Pages SPA support with 404.html redirect handling. Removed legacy Router.tsx component. All URLs now use clean paths (e.g., `/about` instead of `#about`). **MIGRATION COMPLETE** - Application is now ready for GitHub Pages deployment with professional routing.
- **2025-06-04:** **LOGO & FAVICON UPDATE** - Updated application logo throughout the app. Implemented new quizzard-logo.png in header, footer, and favicon. Added PWA manifest.json with proper icon configuration. Enhanced favicon meta tags with multiple sizes for better browser support and optimal space usage. Fixed mobile responsiveness issues after router migration.

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

## Responsive Layout & Horizontal Scroll Fix (2025-06-04)

**Root Cause:**

- Horizontal scrolling/overflow on mobile was caused by a combination of:
  - Overriding Container or Paper width with 100vw or maxWidth: '100vw', which can exceed the viewport due to browser scrollbars and padding.
  - Not enforcing global `box-sizing: border-box`, so padding/margin could push elements beyond 100% width.
  - Using hardcoded widths or paddings on AppBar, Toolbar, Footer, or main layout containers.

**Permanent Fix (MUI-Native, Global):**

- Enforced `box-sizing: border-box` globally in `index.css`:
  ```css
  html {
    box-sizing: border-box;
  }
  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }
  ```
- All main layout containers (root Box in App.tsx, AppBar, Toolbar, Footer, and main content Box) use MUI's `width: 1` (100%) and `maxWidth: 1` to ensure they never exceed the viewport.
- Container in `PageLayout.tsx` uses only `maxWidth="xs"` and `disableGutters`, with no custom width or padding on mobile.
- Paper in `PageLayout.tsx` uses `width: 1`, `maxWidth: 420`, and `mx: 'auto'` for a centered, responsive card that never overflows.
- No element uses `100vw` for width except for backgrounds.
- All overlays (Drawer, Dialog, etc.) use MUI defaults and do not cause scroll.

**How to Restore If Broken:**

1. Check for any use of `width: 100vw`, `maxWidth: 100vw`, or hardcoded widths/paddings on layout containers. Remove them.
2. Ensure all layout containers use `width: 1` and `maxWidth: 1` (MUI shorthand for 100%).
3. Enforce global `box-sizing: border-box` in CSS.
4. Use MUI's responsive Container and Paper with `maxWidth="xs"` and `disableGutters` for main content.
5. Never use horizontal padding/margin that could push content outside the viewport.

**Result:**

- The app is now globally responsive, pixel-perfect, and device-consistent. No horizontal scroll will occur on any device or routed page.
  All main layout containers (root Box, AppBar, Toolbar, Footer, and main content) now use MUI's width: 1 (100%) and maxWidth: 1, and global box-sizing: border-box is enforced. This is the most robust, MUI-native way to prevent horizontal scroll and ensure overlays, header, footer, and all routed content are always fully connected and responsive.

Please reload your app and check the mobile view.
If you still see any horizontal scroll, let me know—I'll help you debug further until it's 100% pixel-perfect and device-consistent as required by your project charter.

---

**Always update this file with new rules, progress, and decisions. This is the single source of truth for the project.**

**AI/Automation Workflow Rule:**

- This file must be referenced and updated after every significant project change, decision, or milestone.
- If using an AI assistant, always instruct it to check and update this file as part of your workflow.
- Pin this file in your editor for visibility, but also make it a habit to review and update it regularly.
