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
- [x] **MOBILE RESPONSIVENESS PERFECTED** - Comprehensive fix for horizontal overflow issues on all mobile devices (portrait and landscape). Implemented pixel-perfect MUI responsive design following strict protocols.
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
- **2025-06-05:** **MOBILE RESPONSIVENESS PERFECTED** - Comprehensive mobile responsiveness fix eliminating horizontal overflow issues on all devices. Implemented pixel-perfect MUI responsive design following strict protocols. All viewport constraints now properly enforced with no horizontal scrolling required on any screen size.

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

## Mobile Responsiveness Solution (2025-06-05)

### Problem Solved

Fixed horizontal overflow issues on mobile devices where content extended beyond viewport width, requiring horizontal scrolling to access navigation elements (hamburger menu button).

### Root Causes Identified

1. **MUI width properties conflict**: Using `width: 1, maxWidth: 1` instead of proper responsive values
2. **Missing overflow constraints**: No global `overflow-x: hidden` enforcement
3. **Fixed container widths**: Components using fixed pixel widths without responsive alternatives
4. **Header flex layout issues**: Logo/title section expanding beyond available space
5. **Missing responsive padding**: Components not adapting padding for mobile screens

### Solution Applied

#### 1. Global CSS Foundation (`src/index.css`)

```css
html {
  box-sizing: border-box;
  overflow-x: hidden;
  width: 100%;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: none;
  display: block;
  overflow-x: hidden;
  width: 100%;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  width: 100%;
  overflow-x: hidden;
}
```

#### 2. App Container Fix (`src/App.tsx`)

```tsx
// BEFORE (problematic):
<Box sx={{
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  width: 1,           // MUI responsive conflict
  maxWidth: 1,        // MUI responsive conflict
  overflowX: "hidden",
}}>

// AFTER (responsive):
<Box sx={{
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  width: "100%",      // Proper responsive width
  overflowX: "hidden",
}}>
```

#### 3. Theme Breakpoints Configuration (`src/App.tsx`)

```tsx
const theme = useMemo(
  () =>
    createTheme({
      breakpoints: {
        values: {
          xs: 0,
          sm: 600,
          md: 900,
          lg: 1200,
          xl: 1536,
        },
      },
      // ...rest of theme
    }),
  [mode]
);
```

#### 4. Header Responsive Layout (`src/components/Header.tsx`)

```tsx
// Toolbar with responsive constraints
<Toolbar sx={{
  width: "100%",
  maxWidth: "100%",
  px: { xs: 1, sm: 2 },           // Responsive padding
  minHeight: { xs: 56, sm: 64 }   // Responsive height
}}>

// Logo section with overflow protection
<Box sx={{
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  flex: 1,                    // Takes available space
  minWidth: 0,               // Allows shrinking
  overflow: "hidden"         // Prevents expansion
}} component={RouterLink} to="/">

  <Box component="img" src={quizzardLogo} sx={{
    height: 36, width: 36, mr: 1,
    flexShrink: 0             // Logo never shrinks
  }} />

  <Typography sx={{
    fontWeight: 700,
    whiteSpace: "nowrap",     // Prevents text wrapping
    overflow: "hidden",       // Hides overflow
    textOverflow: "ellipsis"  // Shows ... if truncated
  }}>
    Quizzard
  </Typography>
</Box>

// Desktop navigation with proper flex behavior
<Box sx={{
  display: { xs: "none", md: "flex" },
  alignItems: "center",
  gap: 1,
  flexShrink: 0              // Never shrinks on mobile
}}>

// Mobile hamburger with controlled spacing
<Box sx={{
  display: { xs: "flex", md: "none" },
  flexShrink: 0,             // Never shrinks
  ml: 1                      // Controlled margin
}}>
```

#### 5. PageLayout Responsive Container (`src/components/PageLayout.tsx`)

```tsx
// BEFORE (fixed width):
<Container maxWidth={maxWidth} disableGutters sx={{ mt: 6, width: 1 }}>
  <Paper sx={{
    p: { xs: 2, sm: 4 },
    textAlign,
    width: 1,
    maxWidth: 420,        // Fixed pixel width problematic on mobile
    mx: "auto",
  }}>

// AFTER (responsive):
<Container maxWidth={maxWidth} disableGutters sx={{
  mt: 6,
  px: { xs: 1, sm: 2 },   // Responsive padding
  width: "100%"
}}>
  <Paper sx={{
    p: { xs: 2, sm: 4 },
    textAlign,
    width: "100%",
    maxWidth: { xs: "100%", sm: 420 },  // Responsive max-width
    mx: "auto",
    boxSizing: "border-box",
  }}>
```

#### 6. Footer Responsive Constraints (`src/components/Footer.tsx`)

```tsx
<Box component="footer" sx={{
  mt: 8,
  py: 3,
  px: { xs: 1, sm: 2 },      // Responsive padding
  bgcolor: "background.paper",
  borderTop: 1,
  borderColor: "divider",
  color: "text.secondary",
  fontSize: { xs: 13, sm: 15 },
  width: "100%",             // Full width
  overflowX: "hidden",       // Prevent overflow
}}>
```

### Key Principles Applied

1. **Use `width: "100%"` instead of `width: 1`** for MUI responsive compatibility
2. **Apply `overflow-x: hidden`** at all container levels (html, body, #root, components)
3. **Use responsive padding** `px: { xs: 1, sm: 2 }` instead of fixed values
4. **Implement flex constraints** (`flexShrink: 0`, `minWidth: 0`) for proper space distribution
5. **Use responsive max-widths** `{ xs: "100%", sm: 420 }` instead of fixed pixel values
6. **Apply proper text overflow handling** (`whiteSpace: "nowrap"`, `textOverflow: "ellipsis"`)

### Result

- ✅ Zero horizontal scrolling on any device (mobile portrait/landscape, tablet, desktop)
- ✅ Hamburger menu button always visible and accessible
- ✅ Content adapts perfectly to all screen sizes
- ✅ Maintains visual consistency across devices
- ✅ Follows MUI responsive design protocols strictly

---

**Always update this file with new rules, progress, and decisions. This is the single source of truth for the project.**

**AI/Automation Workflow Rule:**

- This file must be referenced and updated after every significant project change, decision, or milestone.
- If using an AI assistant, always instruct it to check and update this file as part of your workflow.
- Pin this file in your editor for visibility, but also make it a habit to review and update it regularly.
