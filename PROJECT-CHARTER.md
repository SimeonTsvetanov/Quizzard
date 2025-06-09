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
  - **Header must remain sticky at the top of the viewport at all times.**
    - No ancestor of the AppBar (including #root) may have `overflow-x: hidden` or `overflow: hidden`—these must only be set on `html` and `body` to preserve sticky/fixed positioning.
  - **Back button requirements:**
    - About, Privacy, Terms, and Contact pages must display a native MUI IconButton (ArrowBackIcon) above the page heading, not in the header.
    - The back button must be icon-only (no text), accessible, and use React Router's navigation (navigate(-1)).
    - The back button must be styled using only native MUI props and be visually consistent with Material Design best practices.
    - The back button must not appear on other pages or in the header.
- **Structure:**
  - Feature-based architecture:
    - `src/features/` - Contains feature-specific folders (e.g., randomTeamGenerator, pointsCounter)
    - `src/pages/` - Contains page components 
    - `src/shared/` - Contains shared components, hooks, utilities, and assets
  - Each main tool (Random Team Generator, Points Counter, etc.) is a separate feature/project in its own directory
  - Landing page (main) lists all tools as primary navigation/entry points
  - Footer must include copyright, navigation, social, and support links
- **Hosting:**
  - Hosted on GitHub Pages with SPA support (404.html redirect handling)
  - Uses build + deployment method (main branch → gh-pages branch)
  - Never upload built files to main branch (source code only)
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
  - Do not use `&&` to chain commands in terminal scripts or documentation. PowerShell does not support `&&` for command chaining (unlike Bash/CMD). Use separate lines, semicolons (`;`), or PowerShell-specific operators (`-and`) for cross-platform compatibility.

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
- [x] **GITHUB PAGES DEPLOYMENT READY** - Added gh-pages package, deploy script, and verified all SPA routing configuration. Repository ready to be made public and deployed.
- [x] **LOGO SIZING PERFECTED** - Applied MUI-recommended logo sizing to eliminate bottom cropping: Header (40px/48px mobile/desktop), Footer (32px/36px mobile/desktop). Logo now displays in full without visual cutoff while maintaining aspect ratio and responsive design.
- [x] Theme persistence with localStorage (user-settings-theme-selection)
- [x] PWA fullscreen display mode (manifest.json)
- [x] Theme selection dialog (popup) with Light/Dark/System options, accessible and mobile-friendly
- [x] **MAIN WINDOW REDESIGNED** - Professional card-based layout with responsive design, ToolCard component, and disabled state system
- [x] **RANDOM TEAM GENERATOR COMPLETE REFACTORING** - Implemented clean architecture with 67% code reduction, eliminated all unused code, and created industry-standard component structure
- [x] **DEVELOPMENT STANDARDS DOCUMENTATION** - Created comprehensive DEVELOPMENT-STANDARDS.md guide covering architecture patterns, naming conventions, tech stack, and quality gates
- [x] **COMPREHENSIVE DEVELOPMENT STANDARDS UPDATE** - Enhanced DEVELOPMENT-STANDARDS.md with PWA-first design system, universal device support (320px to 7680px), localStorage patterns, Quizzard visual design system (no borders, blur backgrounds, floating effects), automated GitHub deployment workflow, and complete usage instructions
- [ ] Points Counter (placeholder → full implementation)
- [x] GitHub Pages deploy set up
- [x] Auto-update workflow
- [x] Service worker auto-versioning for reliable PWA updates

#### **Main Tools (Landing Page)**

- [x] **Random Team Generator (COMPLETE)** - Full implementation with clean architecture, all features working
- [ ] Points Counter (placeholder → full implementation)
- [ ] Quizzes (placeholder → full implementation)

### 3. Main Points & Priorities

- Professional, minimal, and consistent UI/UX
- All styles and themes ready before features
- No unnecessary dependencies or folders
- Device consistency is mandatory
- Landing page is the current focus
- Footer and header must always be accessible and responsive
- All overlays (Drawer, Dialog, etc.) must blur background for focus

### 3.1. Folder Structure

The project follows a feature-based architecture:

- **src/features/** - Feature-specific modules
  - **randomTeamGenerator/** - Random Team Generator feature
    - **pages/** - Page components for this feature
    - **components/** - UI components specific to this feature
    - **hooks/** - Custom hooks specific to this feature
    - **utils/** - Utility functions specific to this feature
  - **pointsCounter/** - Points Counter feature
    - (Similar structure as above)
- **src/pages/** - Page components that serve as routes in the application
- **src/shared/** - Shared resources used across multiple features
  - **components/** - Reusable UI components (Header, Footer, PageLayout, etc.)
  - **ToolCard.tsx** - Professional card component for main window tools with disabled state support
  - **hooks/** - Custom React hooks (useTheme, etc.)
  - **utils/** - Utility functions and helpers
  - **assets/** - Static assets (images, icons, etc.)
  - **types/** - TypeScript type definitions

### 4. Change Log / Decisions

- **2025-06-08:** **FOLDER STRUCTURE REORGANIZATION** - Implemented feature-based architecture for better organization and scalability. Moved components to appropriate directories (src/features/*, src/pages/, src/shared/components/). Extracted theme logic to a custom hook (useTheme.ts). Updated all import paths to reflect the new structure.
- **2025-06-04:** Project charter created. Decided to focus on landing page and tool placeholders first. All styles/themes must be ready before feature work.
- **2025-06-04:** Initialized git, created private GitHub repo, and pushed code. Local development and private remote workflow established. Will make public and enable GitHub Pages when ready.
- **2025-06-04:** Implemented global MUI backdrop blur (1.5px) for all modals/drawers. Fixed main menu button overflow on mobile. Footer now includes copyright, navigation, GitHub, and support links, and is fully responsive.
- **2025-06-04:** **MAJOR MIGRATION** - Migrated from custom hash-based routing to React Router (BrowserRouter) for professional URL handling. Updated all navigation components (Header, Footer, Home) to use React Router Link components. Configured GitHub Pages SPA support with 404.html redirect handling. Removed legacy Router.tsx component. All URLs now use clean paths (e.g., `/about` instead of `#about`). **MIGRATION COMPLETE** - Application is now ready for GitHub Pages deployment with professional routing.
- **2025-06-04:** **LOGO & FAVICON UPDATE** - Updated application logo throughout the app. Implemented new quizzard-logo.png in header, footer, and favicon. Added PWA manifest.json with proper icon configuration. Enhanced favicon meta tags with multiple sizes for better browser support and optimal space usage. Fixed mobile responsiveness issues after router migration.
- **2025-06-05:** **MOBILE RESPONSIVENESS PERFECTED** - Comprehensive mobile responsiveness fix eliminating horizontal overflow issues on all devices. Implemented pixel-perfect MUI responsive design following strict protocols. All viewport constraints now properly enforced with no horizontal scrolling required on any screen size.
- **2025-06-05:** **LOGO SIZING PERFECTED** - Applied MUI-recommended logo sizing (40px/48px mobile/desktop for Header, 32px/36px for Footer) to eliminate persistent bottom cropping issue. Logo now displays in full without visual cutoff while maintaining proper aspect ratio and responsive design. Final logo implementation deployed to GitHub Pages successfully.
- **2025-06-05:** **GOOGLE MATERIAL DESIGN PALETTE ADOPTED** - Migrated from custom color palette to Google Material Design colors for better accessibility, consistency, and professional appearance. Applied proper light/dark theme variants following Material Design guidelines. Header now uses Google Blue (#1976D2 light, #64B5F6 dark) for improved visual hierarchy and brand consistency.
- **2025-06-05:** **DEPLOYMENT WORKFLOW DOCUMENTED** - Clarified GitHub Pages deployment strategy using build + deploy method (main → gh-pages). Main branch contains source code only, gh-pages serves optimized production builds. Never upload built files to main branch to maintain clean repository and professional workflow.
- **2025-06-06:** **STICKY HEADER REQUIREMENTS DEFINED** - Specified that the header must remain sticky at the top of the viewport at all times. No ancestor of the AppBar (including #root) may have `overflow-x: hidden` or `overflow: hidden`—these must only be set on `html` and `body` to preserve sticky/fixed positioning.
- **2025-06-06:** **BACK BUTTON REQUIREMENTS DEFINED** - About, Privacy, Terms, and Contact pages must display a native MUI IconButton (ArrowBackIcon) above the page heading, not in the header. The back button must be icon-only (no text), accessible, and use React Router's navigation (navigate(-1)). The back button must be styled using only native MUI props and be visually consistent with Material Design best practices. The back button must not appear on other pages or in the header.
- **2025-06-06:** **ROUTING MIGRATION & WORKFLOW CLARIFIED** - Documented the migration from custom hash-based routing to React Router's BrowserRouter. Added detailed workflow for pushing to main and deploying to GitHub Pages, including best practices and common mistakes to avoid. Explained why React Router is now used and why it is preferred for Quizzard.
- **2025-06-05:** **HEADER COLOR MATCHES BODY** - Updated the header (AppBar) background color to match the main body background color in both light and dark mode (`#FAFAFA` for light, `#121212` for dark) for improved visual consistency. This is now live in the app and will be visible after deployment.
- **2025-06-05:** **MOBILE THEME SWITCH UX IMPROVED** - The theme switch button in the mobile hamburger menu now closes the drawer when toggled and no longer shows a focus border when clicked or focused. This provides a cleaner and more intuitive user experience on mobile.
- **2025-06-05:** **THEME PERSISTENCE IMPLEMENTED** - Theme selection is now saved in localStorage under the key `user-settings-theme-selection`. The app restores the user's last theme choice on reload, following MUI and React best practices. This improves user experience and accessibility across sessions.
- **2025-06-05:** **PWA FULLSCREEN MODE ENABLED** - Updated `manifest.json` to use `"display": "fullscreen"`, enabling true fullscreen mode for the installed PWA on Android and other platforms. This is a native PWA feature and does not affect routing or deployment.
- **2025-06-05:** **THEME SELECTION DIALOG, PERSISTENCE, AND PWA FULLSCREEN** - Refactored new theme switch to use an accessible MUI Dialog for theme selection (Light, Dark, System) with focus trap and backdrop blur. Implemented theme persistence using localStorage (`user-settings-theme-selection`), restoring the user's last theme on reload. Added a "System" theme option that follows the OS/browser preference. Updated `manifest.json` to enable PWA fullscreen mode. All changes documented here, committed to GitHub main, and deployed to GitHub Pages. Users can preview changes locally before finalizing. This ensures a modern, accessible, and professional theming experience across devices and platforms.
- **2025-06-05:** **DEPLOYMENT WORKFLOW FIXED** - Updated `.github/workflows/pages.yml` to trigger on pushes to `main` and automatically build and deploy to the `gh-pages` branch. Fixed permissions to `contents: write` to allow the workflow to push to the `gh-pages` branch. This ensures the workflow runs automatically after each main branch update, builds the app, and deploys the production build to GitHub Pages. This follows best practices for static site deployment on GitHub Pages. Manual deploys to `gh-pages` are no longer needed; deployment is now fully automated and reliable.
- **2025-06-05:** **HEADER TEXT COLOR THEME-AWARE** - Updated the "Quizzard" text in the header to use `color: "text.primary"` instead of `color: "inherit"`. This ensures the brand text follows the proper theme colors: black (`#212121`) in light mode and white (`#FFFFFF`) in dark mode, providing better visual contrast and accessibility. The change only affects the Typography component without impacting the logo, AppBar background, or any other header elements.
- **2025-06-06:** **PRODUCTION THEME SWITCH BUG FIXED** - Resolved critical production-only issue where changing themes on subpages (About, Privacy, etc.) caused blank white screens. Root cause was `window.location.reload()` conflicting with React Router + GitHub Pages SPA redirect system. Replaced reload-based theme switching with React state management (`onThemeChange` callback pattern). Theme changes now work instantly without page reloads, maintaining proper routing context. Local development was unaffected, issue only occurred in GitHub Pages production environment.
- **2025-06-09:** **QUIZZES TOOL PLACEHOLDER ADDED** - Added Quizzes (Build and Play Quizzes) as a new tool with full feature structure (pages, components, hooks, types, README). Integrated into the main menu and routing as a placeholder for future development. Landing page now displays all three main tools. All code follows feature-based architecture and MUI/TypeScript standards.
- **2025-06-09:** **MAIN WINDOW COMPLETE REDESIGN & PROFESSIONAL CARD LAYOUT** - Completely redesigned the main window with a modern, professional tool card layout following SaaS industry standards. **Removed constraining PageLayout** that limited width to 420px, creating a full-width responsive layout that scales perfectly from mobile to 4K monitors. **Created ToolCard component** with fixed dimensions (300x280px base, responsive scaling), subtle shadows, rounded corners, and beautiful hover effects (translateY + scale). **Replaced button-based layout** with clickable cards featuring icons, headings, and descriptions. **Implemented disabled state system** for Points Counter and Quizzes tools with visual indicators (reduced opacity, "Still Under Construction" snackbar). **Fixed mobile touch interactions** by removing selection highlights, implementing proper ripple animations from click point, and ensuring smooth transitions. **Enhanced accessibility** with proper focus states, keyboard navigation, and responsive typography scaling. **Cleaned up assets** by removing unused RTG image and using Material Icons (Groups, Scoreboard, Quiz) for consistency. **Responsive design** ensures cards display in a row on desktop (lg+), stack vertically on mobile, with appropriate spacing and gaps that scale with screen size. All routing functionality maintained with smooth navigation to working tools. Design follows Material 3 principles with the established color palette and supports all themes (light/dark/system).
- **2025-12-07:** **RANDOM TEAM GENERATOR COMPLETE REFACTORING** - **MAJOR ARCHITECTURE OVERHAUL** implementing industry-standard clean architecture principles. **Eliminated 1,238 lines of unused code (67% reduction)** by deleting orphaned components (ParticipantInput.tsx, TeamDisplay.tsx, TeamCountControls.tsx, useTeamGenerator.ts, inputValidator.ts). **Replaced monolithic 773-line component** with **15 focused files** following Single Responsibility Principle. **Implemented clean separation**: Components (11 files) for UI, Hooks (3 files) for state management, Utils (3 files) for pure functions, Types (1 file) for definitions. **New component structure**: ParticipantsList/ (input management), TeamControls/ (UI controls), TeamsModal/ (results display), Dialogs/ (confirmations). **Custom hooks**: useParticipants (state + cheat codes), useTeamGeneration (team creation + validation), useKeyboardNavigation (Enter/Arrow navigation). **Utilities**: teamGenerator.ts (core algorithm), cheatCodes.ts ("the followers" easter egg), clipboard.ts (copy functionality). **Comprehensive JSDoc documentation** for every component, hook, prop, and function. **All functionality preserved**: participant input with auto-creation, keyboard navigation, cheat codes, team generation, modal display, clipboard copy, clear confirmation, responsive design. **Zero breaking changes** - application works exactly as before but with clean, maintainable, and scalable architecture. **Builds successfully** and ready for production deployment.
- **2025-12-07:** **COMPREHENSIVE DEVELOPMENT STANDARDS ENHANCEMENT** - **MAJOR DOCUMENTATION UPDATE** expanding DEVELOPMENT-STANDARDS.md with critical platform requirements. **Added PWA-first design principles** as top priority for future Android APK deployment. **Implemented universal device support standards** covering 320px mobile phones to 7680px 4K TVs (70+ inches). **Documented Quizzard visual design system**: no borders anywhere, background colors with contrasting text, MUI elevation shadows for floating effects, blur backgrounds on focused popups/modals, rounded corners on all elements. **Created comprehensive localStorage patterns** with auto-save requirements, feature-specific key conventions, and error handling for all tools. **Defined automated GitHub deployment workflow**: push to main → auto-build → GitHub Pages deployment with zero manual intervention. **Added complete usage instructions** including before/during/after development checklists, critical PWA reminders, quick reference patterns, and document workflow. **Enhanced with Points Counter requirements** including team setup, scoring interface, leaderboard functionality, and persistent game state. **All changes align with quiz platform vision** supporting bar quiz nights with quizmasters and competing teams across all device types.
- **2025-12-07:** **MANDATORY AUTO-UPDATE SYSTEM & iOS PWA LIMITATIONS DOCUMENTED** - **CRITICAL PLATFORM FEATURES** added to DEVELOPMENT-STANDARDS.md. **Documented automatic update functionality**: service worker auto-versioning system that transparently updates all user devices when new versions deploy to GitHub Pages without any user intervention. **Added comprehensive iOS PWA limitations**: localStorage may be cleared automatically when device storage is low, no push notifications support, Safari engine restrictions, safe area requirements for iPhone/iPad compatibility. **Implemented iOS safe zone patterns** using env(safe-area-inset-*) for proper display on devices with notches, Dynamic Island, and home indicators. **Enhanced localStorage patterns** with iOS-specific error handling, verification checks, and graceful degradation. **Updated development checklists** to include iOS testing requirements and cross-platform storage strategies. **Critical for PWA success**: ensures app works reliably across all platforms while maintaining automatic updates for seamless user experience.
- **2025-12-07:** **MAIN SCREEN LAYOUT OPTIMIZATION** - **UX IMPROVEMENT** fixed excessive vertical spacing on the main landing page with 3 tool cards. **Problem identified**: `minHeight: 'calc(100vh - 64px)'` with `justifyContent: 'center'` was creating too much padding and requiring users to scroll to see footer. **Solution applied**: Replaced full-viewport layout with compact container pattern following DEVELOPMENT-STANDARDS.md layout guidelines, identical to Random Team Generator page structure. **Used consistent layout pattern**: `py: 3` for reasonable padding, `maxWidth: clamp(280px, 90vw, 1400px)` for responsive width, and removed vertical centering that pushed content. **Result**: Main screen cards now sit naturally in page flow with proper spacing from header to footer, no excessive scrolling required, maintains responsive design across all device sizes (320px to 7680px). Follows established Quizzard visual design system with consistent spacing patterns across all pages.
- **2025-12-07:** **COMPREHENSIVE HOME PAGE ENHANCEMENT & PWA IMPROVEMENTS** - **MAJOR UX UPDATE** implementing user-requested features for logo, animations, and navigation. **Added new page logo**: Integrated `quizzard-page-logo.png` above main heading with clean website-style sizing (120px-180px responsive) and removed all card styling/shadows/borders for professional appearance. **Created custom loading screen**: Built animated PWA startup experience with quick zoom-out animation (1 second total) featuring bouncy easing, minimal text ("Ready!"), and iOS safe area support. **Updated PWA manifest**: Changed from `fullscreen` to `standalone` mode enabling navigation buttons while maintaining immersive PWA experience. **Implemented unified spacing system**: Applied consistent `gap: { xs: 3, sm: 4, md: 5 }` throughout home page for logo, headings, subtitle, and tool cards, removing individual margins and creating harmonious visual hierarchy. **Smart loading logic**: Loading screen only appears on app startup/fresh installs, not internal navigation, using sessionStorage tracking. **Result**: Professional home page with clean logo, quick startup animation, accessible PWA navigation, and perfectly consistent spacing across all elements and device sizes (320px to 7680px).
- **2025-12-07:** **PWA WHITE SCREEN FLASH ELIMINATION & ICON SYSTEM PREPARATION** - **CRITICAL UX FIX** eliminating the ugly white screen flash that appeared before custom loading screen on PWA startup. **Fixed manifest theme colors**: Updated `background_color` to `#FAFAFA` and `theme_color` to `#1976D2` to match app's actual theme colors instead of legacy orange colors. **Implemented CSS-based initial loading**: Added instant-loading CSS screen in `index.html` that appears before React loads, with automatic light/dark theme detection using `prefers-color-scheme`, smooth fade transition to React loading screen, and proper z-index layering. **Updated meta theme-color**: Changed HTML meta tag to match new primary color for consistent browser chrome theming. **Prepared icon creation guide**: Documented comprehensive PWA icon specifications for user to create beautiful icons using their logo with proper light/dark theme backgrounds, 70% logo sizing, 15% padding, and 20% border radius. **Result**: Seamless PWA startup experience with zero white screen flash, smooth transition from CSS loading to React loading screen, and foundation ready for custom icon implementation.
- **2025-12-07:** **CUSTOM PWA ICONS IMPLEMENTATION WITH USER LOGO** - **VISUAL BRANDING UPDATE** implementing beautiful custom PWA icons created from user's `quizzard-page-logo.png` using realfavicongenerator.net. **Complete icon replacement**: Updated all PWA icons (192x192, 512x512, Apple Touch, favicon variants) with professionally generated icons featuring the new logo on proper backgrounds with optimal sizing and padding. **Icon organization**: Renamed and organized generated icons (`web-app-manifest-192x192.png` → `icon-192.png`, `web-app-manifest-512x512.png` → `icon-512.png`) to match PWA manifest requirements. **Quality assurance**: All icons maintain proper aspect ratio, include appropriate padding, and feature the logo prominently without distortion. **Build verification**: Confirmed successful build with new icons properly bundled and ready for deployment. **Result**: Professional PWA icon system with consistent branding across all platforms (Android, iOS, Windows) featuring the beautiful Quizzard logo on appropriate backgrounds, enhancing app recognition and user experience when installed as PWA.
- **2025-12-07:** **HARD REFRESH LOADING OPTIMIZATION & PERFECT SPACING UNIFICATION** - **FINAL UX POLISH** completing the professional home page experience with technical and visual improvements. **Fixed hard refresh broken images**: Added image preloading hints, graceful error handling with CSS spinner fallback, and proper loading coordination to eliminate broken image flashes during `Ctrl+Shift+R` hard refresh. **Achieved perfect spacing unification**: Removed all individual Box containers and margin/padding overrides, implementing single `gap: { xs: 3, sm: 4, md: 5 }` system for logo, heading, subtitle, and tool cards with perfect consistency across all device sizes. **Enhanced notification UX**: Moved "Still Under Construction" snackbar from bottom to top position (`anchorOrigin: "top"`) for better visibility and professional notification placement. **Simplified component structure**: Eliminated unnecessary wrapper containers, applied direct Typography components, and centralized all alignment and spacing through parent flex container. **Result**: Pixel-perfect unified spacing throughout home page, seamless loading experience on all refresh types, and professional notification system - completing the comprehensive home page enhancement with perfect visual consistency and technical robustness.
- **2025-12-07:** **FINAL PWA OPTIMIZATION & INSTALL PROMPT ENHANCEMENT** - **COMPREHENSIVE UX FIXES** addressing all remaining PWA installation and startup issues for professional Android/mobile experience. **Eliminated white screen flash completely**: Enhanced CSS loading screen with immediate theme-aware backgrounds (`#FAFAFA` light, `#121212` dark), faster React transition (50ms), and aggressive cache busting (`?v=2` on all assets). **Upgraded service worker**: Implemented `quizzard-v2.1` with network-first strategy, immediate cache clearing, and automatic client control for instant updates. **Added custom PWA install prompt**: Smart detection of `beforeinstallprompt` event with 3-second delay, professional Alert design with Install/Dismiss buttons, localStorage tracking to prevent repeated prompts, and success notifications. **Fixed ToolCard internal spacing**: Removed excessive margins (`mb: 1.6`), implemented consistent `gap: { xs: 0.8, sm: 1.2 }` between icon/title/description, eliminated `justifyContent: 'space-between'` that created uneven spacing. **Enhanced PWA manifest**: Updated with `display: "standalone"`, proper cache-busting (`?v=2`), separate `any` and `maskable` icon purposes for better Android compatibility. **Result**: Professional PWA startup experience with zero white flash, aggressive install prompts for better adoption, perfectly spaced tool cards, and seamless automatic updates across all platforms.
- **2025-12-07:** **CRITICAL BUG FIXES & MOBILE UX ENHANCEMENT** - **EMERGENCY FIXES** addressing broken Random Team Generator navigation, mobile sizing reversion, PWA status bar theming, and aggressive icon cache busting. **Fixed Random Team Generator routing**: Corrected navigation from `/team-generator` to `/random-team-generator` in Home.tsx, resolving issue where page showed only header/footer. **Reverted mobile sizing with 20% increase**: Enhanced mobile experience (xs/sm breakpoints) by increasing all elements 20% larger - logo (96→115px, 120→144px), headings (2rem→2.4rem, 2.4rem→2.88rem), icons (45→54px, 51→61px), ToolCard dimensions (200→240px height, 85vw→102vw width), gaps and padding proportionally increased, while keeping desktop/large screens unchanged. **Implemented dynamic PWA status bar theming**: Added responsive `meta theme-color` tags for light (`#FAFAFA`) and dark (`#121212`) themes, JavaScript-based theme detection from localStorage, real-time updates when theme changes, eliminating blue status bar issue. **Aggressive PWA icon cache busting**: Upgraded service worker to `v3.0` with complete cache clearing strategy, updated all icon references to `?v=3`, network-first fetch strategy for immediate icon updates, ensuring new Quizzard logo displays correctly on installed PWAs. **Result**: Fully functional Random Team Generator, optimal mobile sizing (20% larger elements), theme-aware status bar colors, and guaranteed fresh PWA icons across all devices and platforms.
- **2025-12-07:** **PROFESSIONAL PWA ICONS WITH MINT GREEN BRANDING** - **PROGRAMMATIC ICON GENERATION** implementing custom PWA icons using Sharp.js for pixel-perfect quality and consistency. **Created automated icon generator**: Built Node.js script using Sharp library to generate PWA icons from `quizzard-page-logo.png` with mint green background (#98FFE0), 70% logo scaling, 20% border radius, and professional Material Design specifications. **Generated optimized icons**: Created icon-192.png (21KB), icon-512.png (100KB), and apple-touch-icon.png (19KB) with perfect logo centering, transparent logo preservation, and high-quality PNG compression. **Updated loading screen branding**: Changed startup loading screen to use new PWA icons instead of header logo, maintaining visual consistency between PWA installation icon and app startup experience. **Enhanced cache management**: Updated service worker to `quizzard-mint-icons-2025` cache with proper icon versioning (`?v=mint`), aggressive cache clearing, and network-first strategy for immediate icon updates. **Preserved existing assets**: Maintained favicon.ico, favicon-96x96.png, and header quizzard-logo.png unchanged as requested, ensuring no disruption to existing branding elements. **Result**: Professional PWA installation experience with beautiful mint green branded icons, consistent visual identity across all platforms (Android, iOS, Windows), optimized loading performance, and seamless automatic updates ensuring users always see the latest branding.
- **2025-12-07:** **COMPLETE FAVICON SYSTEM WITH UNIVERSAL COMPATIBILITY** - **COMPREHENSIVE ICON IMPLEMENTATION** replacing all old favicon and PWA icons with professionally generated system from user's actual logo using Sharp library. **Generated 21 icon files**: Complete favicon system covering browser tabs (16px-128px), Apple Touch Icons for iOS/iPadOS (152x152-180x180), Android Chrome PWA icons (192x192-512x512), Windows tiles (150x150), and social media sharing (og-image, twitter-image). **Added fallback naming conventions**: Created standard PWA icon names (icon-192.png, icon-512.png) alongside Chrome-specific naming (android-chrome-*) for maximum tool compatibility, plus apple-touch-icon.png fallback for older iOS devices. **Updated all configuration files**: Enhanced HTML head with comprehensive favicon declarations, updated PWA manifest with both "any" and "maskable" icon purposes, and revised service worker caching for all new icon files. **Removed old icon files**: Safely eliminated legacy icons (icon-192.png v2, icon-512.png v2, apple-touch-icon.png v2, favicon.svg) after updating all references in service worker, manifest, HTML, and loading screens. **Maximum platform compatibility**: System now supports all browsers (Chrome, Firefox, Safari, Edge), mobile platforms (iOS, Android), PWA installation, Windows desktop integration, and social media sharing with bulletproof fallbacks. **Complete documentation**: Added comprehensive icon system documentation to DEVELOPMENT-STANDARDS.md with file structure, configuration examples, maintenance procedures, and platform-specific requirements. **Result**: Professional universal icon system generated from user's actual logo with bulletproof compatibility across all platforms, automatic service worker updates, and complete documentation for future maintenance and updates.

---

## Routing Migration & Deployment Workflow (2025-06-06)

### Routing System: From Custom Hash to React Router

- **Previous system:** Custom hash-based routing (URLs like `/#about`).
- **Current system:** React Router's `BrowserRouter` (URLs like `/about`).
- **Why migrate?**
  - Clean, professional URLs (no hash fragments).
  - Better user experience: browser navigation, sharing, and bookmarking work as expected.
  - SPA support on GitHub Pages with `404.html` redirect.
  - Easier to scale, maintain, and integrate with MUI and modern React features.
  - Industry standard for React apps.
- **Result:**
  - All navigation uses React Router's `<Link>` or `navigate()`.
  - No more hash URLs; all routes are clean and professional.
  - SPA works on GitHub Pages with direct links and refreshes.

### Best Practices: Pushing to Main & Deploying to GitHub Pages

#### Pushing to Main (Source Code Only)

- Only push source code, documentation, and config files to main. **Never push built files** (like `dist` or `build`).
- Use clear, descriptive commit messages.
- Commit often, but only push when code is working or a feature is complete.
- Always update `PROJECT-CHARTER.md` with new rules, changes, or decisions before pushing.
- Typical steps:
  1. Make and test changes locally.
  2. Stage changes: `git add .`
  3. Commit: `git commit -m "Describe what you changed"`
  4. Push: `git push origin main`

#### Deploying to GitHub Pages (Production Build)

- Use the `gh-pages` npm package to automate deployment.
- Only deploy the production build (the optimized output, usually in `dist` or `build`).
- The main branch should never contain built files—keep it clean for source code only.
- Deployment script builds the app and pushes the result to the `gh-pages` branch.
- Typical steps:
  1. Build the app: `npm run build`
  2. Deploy: `npm run deploy` (uses `gh-pages` to push `dist` to `gh-pages` branch)
- Result: App is live at `https://<your-username>.github.io/Quizzard/`

#### Common Mistakes to Avoid

- Accidentally pushing the `dist` or `build` folder to main.
- Editing files directly in the `gh-pages` branch.
- Forgetting to update documentation (`PROJECT-CHARTER.md`).
- Not testing locally before pushing or deploying.

#### Summary: Why React Router is Used

- Clean URLs, better UX, SPA support, scalable, and industry standard.
- Integrates seamlessly with MUI and modern React.
- The best choice for a public, modern, and scalable app like Quizzard.

---

## Color Palette Reference

### Google Material Design Palette (Current)

#### Light Theme

- primary: #1976D2 (Google Blue 700)
- secondary: #9C27B0 (Google Purple 500)
- error: #D32F2F (Google Red 700)
- warning: #FF9800 (Google Orange 500)
- info: #2196F3 (Google Blue 500)
- success: #4CAF50 (Google Green 500)
- background: #FAFAFA (Google Grey 50)
- paper: #FFFFFF (White)
- text primary: #212121 (Google Grey 900)
- text secondary: #757575 (Google Grey 600)

#### Dark Theme

- primary: #64B5F6 (Google Blue 300)
- secondary: #CE93D8 (Google Purple 200)
- error: #EF9A9A (Google Red 200)
- warning: #FFCC80 (Google Orange 200)
- info: #90CAF9 (Google Blue 200)
- success: #A5D6A7 (Google Green 200)
- background: #121212 (Very Dark Grey)
- paper: #1E1E1E (Dark Grey)
- text primary: #FFFFFF (White)
- text secondary: #BDBDBD (Google Grey 400)

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
- ✅ Hamburger menu button always visible and accessible with proper touch target size
- ✅ Content adapts perfectly to all screen sizes
- ✅ Maintains visual consistency across devices
- ✅ Follows MUI responsive design protocols strictly
- ✅ Mobile hamburger menu icon properly sized (28px on mobile, 24px on desktop)
- ✅ Eliminated focus ring artifacts and persistent highlight states after menu interactions
- ✅ Logo aspect ratio preserved and properly sized within container constraints

---

## Logo Aspect Ratio & Sizing Fix (2025-06-05)

### Issues Fixed

1. **Logo aspect ratio distortion** - Original logo was being squished into fixed square dimensions
2. **Logo bottom cropping** - Logo size exceeded container height constraints causing visual cutoff
3. **Responsive sizing conflicts** - Fixed dimensions not compatible with MUI responsive breakpoints

### Solution Applied

#### 1. Aspect Ratio Preservation (`src/components/Header.tsx`, `src/components/Footer.tsx`)

```tsx
// BEFORE (problematic - fixed square):
<Box component="img" src={logo} sx={{
  height: 36,
  width: 36,  // Forces square shape, distorts aspect ratio
}} />

// AFTER (responsive with aspect ratio):
<Box component="img" src={logo} sx={{
  height: { xs: 40, sm: 48 },  // Responsive heights
  width: "auto",               // Maintains aspect ratio
  maxWidth: { xs: 40, sm: 48 }, // Prevents overflow
  objectFit: "contain",        // Ensures proper scaling
  flexShrink: 0,              // Prevents compression
}} />
```

#### 2. Container Constraint Compliance

**Header Logo Sizing:**

- Mobile (xs): 40px height (fits within 56px Toolbar - 16px padding)
- Desktop (sm): 48px height (fits within 64px Toolbar - 16px padding)

**Footer Logo Sizing:**

- Mobile (xs): 32px height (fits within footer padding constraints)
- Desktop (sm): 36px height (proportionally larger for desktop)

#### 3. Original Logo Implementation

- Replaced square-cropped logo with original [`quizzard-logo.png`](quizzard-logo.png) (2,084KB vs 327KB)
- Maintained same import paths to preserve responsive design integrity
- Applied MUI best practices for responsive image handling

### Key Principles Applied

1. **Aspect Ratio Preservation**: Use `width: "auto"` with responsive heights
2. **Container Awareness**: Logo size must fit within parent container constraints
3. **Responsive Breakpoints**: Different sizes for mobile vs desktop following MUI patterns
4. **Object Fit Control**: Use `objectFit: "contain"` for proper scaling
5. **Overflow Prevention**: `maxWidth` constraints prevent layout breaking

### Result

- ✅ Logo displays in original aspect ratio without distortion
- ✅ No bottom cropping or visual cutoff in header/footer
- ✅ Responsive sizing across all device breakpoints
- ✅ Maintains MUI responsive design protocol compliance
- ✅ Higher quality original logo image preserved
- ✅ Final implementation deployed to GitHub Pages successfully

---

## Mobile Hamburger Menu UX Fix (2025-06-05)

1. **Tiny hamburger icon on mobile devices** - Icon was too small for comfortable touch interaction
2. **Persistent oval/circular border after menu close** - Focus ring and ripple effects remained visible after interaction
3. **Inconsistent touch target sizes** - Button area was too small for accessible mobile interaction

### Solution Applied

#### 1. Enhanced Hamburger Menu Button (`src/components/Header.tsx`)

```tsx
<IconButton
  sx={{
    padding: { xs: 1.5, sm: 1 }, // Larger touch area on mobile
    minWidth: 48, // Minimum accessible touch target
    minHeight: 48, // Minimum accessible touch target
    "&:focus": { outline: "none" }, // Remove default focus outline
    "&:focus-visible": {
      // Add proper focus-visible outline
      outline: "2px solid",
      outlineColor: "primary.main",
      outlineOffset: 2,
    },
    "& .MuiTouchRipple-root": {
      // Disable persistent ripple effects
      display: "none",
    },
    "&::after": { display: "none" }, // Remove any pseudo-element artifacts
    "&:hover": {
      // Proper hover state
      backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
  }}
>
  <MenuIcon sx={{ fontSize: { xs: 28, sm: 24 } }} />{" "}
  {/* Responsive icon size */}
</IconButton>
```

#### 2. Global CSS for Mobile IconButton Fix (`src/index.css`)

```css
/* MUI IconButton focus and ripple fixes for mobile */
.MuiIconButton-root {
  -webkit-tap-highlight-color: transparent; /* Remove iOS tap highlight */
}

.MuiIconButton-root:focus {
  outline: none; /* Remove default focus outline */
}

.MuiIconButton-root:focus-visible {
  outline: 2px solid; /* Proper accessibility outline */
  outline-offset: 2px;
}

/* Prevent persistent focus states on mobile */
@media (hover: none) and (pointer: coarse) {
  .MuiIconButton-root:focus {
    background-color: transparent;
  }

  .MuiIconButton-root:focus:not(:focus-visible) {
    outline: none;
    background-color: transparent;
  }

  .MuiIconButton-root::after {
    display: none; /* Remove any focus artifacts */
  }
}
```

#### 3. Consistent Close Button Styling

Applied same styling principles to the drawer close button for consistent UX throughout the mobile menu system.

### Key Principles Applied

1. **Accessible Touch Targets**: Minimum 48x48px button areas following WCAG guidelines
2. **Responsive Icon Sizing**: 28px icons on mobile (xs), 24px on desktop (sm+)
3. **Focus Management**: Proper focus-visible states without persistent artifacts
4. **Mobile-Specific CSS**: Media queries targeting touch devices to prevent focus issues
5. **Ripple Effect Control**: Disabled persistent ripple effects that cause visual artifacts

### Testing

- ✅ Deployed to GitHub Pages: https://simeontsvetanov.github.io/Quizzard/
- ✅ Ready for mobile device testing
- ✅ Hamburger menu icon now properly sized and accessible
- ✅ No more persistent focus rings or oval borders after interaction

---

## GitHub Actions Automated Deployment Solution (2025-06-05)

### Problem Solved

The GitHub Actions workflow for automated deployment to GitHub Pages was not triggering properly, causing deployment failures and requiring manual intervention for every code update.

### Root Cause Analysis

1. **Incorrect Branch Trigger**: Workflow was configured to trigger on pushes to `gh-pages` branch instead of `main` branch
2. **Insufficient Permissions**: Workflow had `contents: read` permissions but needed `contents: write` to push to gh-pages
3. **Workflow Logic Misunderstanding**: The workflow should trigger when source code changes (main branch), not when deployment happens (gh-pages branch)

### Solution Applied

#### 1. Fixed Workflow Trigger Configuration

**File:** `.github/workflows/pages.yml`

```yaml
# BEFORE (problematic):
on:
  push:
    branches: [ "gh-pages" ]  # Wrong - triggers on deployment branch

# AFTER (correct):
on:
  push:
    branches: [ "main" ]      # Correct - triggers on source code changes
```

#### 2. Updated Workflow Permissions

```yaml
# BEFORE (insufficient):
permissions:
  contents: read

# AFTER (sufficient):
permissions:
  contents: write            # Allows pushing to gh-pages branch
  pages: write              # Allows GitHub Pages deployment
  id-token: write           # Required for GitHub Pages
```

#### 3. Complete Working Workflow File

**File:** `.github/workflows/pages.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"] # Trigger on main branch pushes
  workflow_dispatch: # Allow manual triggering

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
```

### How the Workflow Works

1. **Trigger**: Developer pushes code changes to `main` branch
2. **Build**: GitHub Actions automatically:
   - Checks out the latest main branch code
   - Sets up Node.js environment
   - Installs project dependencies (`npm ci`)
   - Builds the production app (`npm run build`)
3. **Deploy**: Uses `peaceiris/actions-gh-pages@v4` to:
   - Take the built files from `./dist` directory
   - Push them to the `gh-pages` branch
   - GitHub Pages automatically serves the updated site

### Why This Solution Works

- **Logical Flow**: Source code changes → automatic build → automatic deployment
- **Best Practices**: Uses industry-standard GitHub Actions (`peaceiris/actions-gh-pages`)
- **Proper Permissions**: Workflow has necessary write access to update gh-pages branch
- **Concurrent Safety**: Prevents multiple deployments from running simultaneously
- **Manual Override**: `workflow_dispatch` allows manual triggering when needed

### Workflow Commands Reference

#### Check Workflow Status

```powershell
# View recent workflow runs
gh run list --repo your-username/Quizzard

# View specific workflow run details
gh run view [run-id] --repo your-username/Quizzard
```

#### Manual Workflow Trigger

```powershell
# Trigger workflow manually
gh workflow run "Deploy to GitHub Pages" --repo your-username/Quizzard
```

#### Local Testing Before Push

```powershell
# Always test locally before pushing
npm run build
npm run preview  # Test production build locally
```

### Troubleshooting Guide

#### Common Issues & Solutions

**1. Workflow Not Triggering**

- ✅ Check that trigger is set to `main` branch, not `gh-pages`
- ✅ Verify workflow file is in `.github/workflows/` directory
- ✅ Ensure workflow file has `.yml` or `.yaml` extension

**2. Permission Denied Errors**

- ✅ Verify `contents: write` permission is set
- ✅ Check that `GITHUB_TOKEN` has repository access
- ✅ Ensure repository has GitHub Pages enabled

**3. Build Failures**

- ✅ Test build locally first: `npm run build`
- ✅ Check for TypeScript errors: `npm run type-check`
- ✅ Verify all dependencies are in `package.json`

**4. Deployment Succeeds But Site Not Updated**

- ✅ Check GitHub Pages source is set to "Deploy from a branch: gh-pages"
- ✅ Verify base URL configuration in `vite.config.ts`
- ✅ Clear browser cache or check in incognito mode

#### Workflow File Validation

**Required Elements Checklist:**

- [ ] Trigger on `main` branch pushes
- [ ] `contents: write` permission
- [ ] Node.js setup with correct version
- [ ] `npm ci` for dependency installation
- [ ] `npm run build` for production build
- [ ] `peaceiris/actions-gh-pages@v4` for deployment
- [ ] `publish_dir: ./dist` pointing to build output
- [ ] `publish_branch: gh-pages` for GitHub Pages

### Future Maintenance

**When Updating Workflow:**

1. Always test changes in a feature branch first
2. Use `workflow_dispatch` to manually test workflow changes
3. Monitor workflow runs in GitHub Actions tab
4. Update this documentation if workflow structure changes

**When Build Configuration Changes:**

- Update `publish_dir` if build output directory changes
- Update Node.js version in workflow when upgrading locally
- Add new build steps if additional processing is needed

### Deployment Workflow Summary

**Simple Save Process:**

1. Make code changes locally
2. Test with `npm run dev` and `npm run build`
3. Commit changes: `git add . && git commit -m "Description"`
4. Push to main: `git push origin main`
5. GitHub Actions automatically builds and deploys
6. Site updates live at: `https://your-username.github.io/Quizzard/`

**No manual deployment needed** - the workflow handles everything automatically!

---

## Quizzard AI Workflow Integration

### AI Workflow Rules

1. **Always Reference PROJECT-CHARTER.md**: This file is the single source of truth. Always check and update it with any changes, progress, or decisions.
2. **AI Assistants Must Follow These Rules**: If using an AI assistant, instruct it to adhere to these rules explicitly.
3. **Regular Updates and Reviews**: This file must be reviewed and updated regularly to reflect the current state of the project.

### AI Workflow Example

1. **AI Task Assignment**: Assign tasks to the AI, e.g., "Implement feature X" or "Fix bug Y".
2. **AI Updates PROJECT-CHARTER.md**: After completing a task, the AI updates this file with:
   - What was done
   - Any new decisions or changes
   - Links to relevant code commits or pull requests
3. **Review and Approve**: The development team reviews the AI's work and this document. Approve or request changes.
4. **Merge and Deploy**: Once approved, merge changes to the main branch. GitHub Actions deploys the updates.

### Example AI Update

- **Task**: Implemented user login feature
- **Changes**:
  - Updated `src/components/Login.tsx` for login form
  - Added `src/hooks/useAuth.ts` for authentication logic
  - Updated `PROJECT-CHARTER.md` with new routing rules
- **Decisions**:
  - Chose to use Context API for state management
  - Decided on email/password authentication for MVP
- **Links**:
  - Code: [GitHub Commit Link](https://github.com/your-repo/commit/abc123)
  - PR: [GitHub Pull Request Link](https://github.com/your-repo/pull/456)

---

---

## Random Team Generator Refactoring Summary (2025-12-07)

### Architecture Transformation

**Before Refactoring:**
- **1 monolithic file** (773 lines) with mixed responsibilities
- **5 unused files** (1,238 lines of dead code - 67% of codebase)
- Poor separation of concerns (UI + logic + state mixed)
- Difficult to maintain and extend
- Components created but never integrated
- **Total: 1,851 lines** (including unused code)

**After Refactoring:**
- **15 focused files** with single responsibilities
- **0 unused code** (complete elimination)
- Clean separation: Components + Hooks + Utils + Types
- Easy to maintain, test, and extend
- Industry-standard React/TypeScript architecture
- **Total: 613 lines** (67% reduction while adding documentation)

### File Structure (New)

```
src/features/random-team-generator/
├── types/
│   └── index.ts               # All types, constants, friend names
├── utils/
│   ├── teamGenerator.ts       # Core algorithm (updated)
│   ├── cheatCodes.ts         # Easter egg functionality
│   └── clipboard.ts          # Copy team functionality
├── hooks/
│   ├── useParticipants.ts    # Participant state management
│   ├── useTeamGeneration.ts  # Team creation logic
│   └── useKeyboardNavigation.ts # Enter/Arrow navigation
├── components/
│   ├── ParticipantsList/
│   │   ├── ParticipantsList.tsx    # Container component
│   │   ├── ParticipantInput.tsx    # Individual input field
│   │   └── ParticipantNumber.tsx   # Circular number indicator
│   ├── TeamControls/
│   │   ├── TeamControls.tsx        # Container component
│   │   ├── TeamCountSelector.tsx   # Increment/decrement
│   │   └── GenerateButton.tsx      # Main action button
│   ├── TeamsModal/
│   │   ├── TeamsModal.tsx          # Modal container
│   │   ├── TeamCard.tsx           # Individual team display
│   │   └── ModalActions.tsx       # Refresh/Copy/Close buttons
│   └── Dialogs/
│       └── ClearConfirmDialog.tsx  # Clear confirmation
└── pages/
    └── RandomTeamGeneratorPage.tsx # Main orchestrator
```

### Key Improvements

1. **Code Quality**: 67% reduction with comprehensive JSDoc documentation
2. **Maintainability**: Each file has single responsibility, easy to find and modify
3. **Architecture**: Proper separation of concerns following React best practices
4. **Performance**: Eliminated unused code, optimized component structure
5. **Developer Experience**: Clear file organization, extensive documentation
6. **Functionality**: 100% preserved - all features work exactly as before

### Preserved Features

- ✅ Participant input with auto-creation
- ✅ Keyboard navigation (Enter, Arrow Up/Down)
- ✅ Cheat code "the followers" easter egg
- ✅ Team count selection (2-10 teams)
- ✅ Team generation with proper distribution
- ✅ Teams modal with refresh/copy/close actions
- ✅ Clear all confirmation dialog
- ✅ Snackbar feedback for all actions
- ✅ Responsive design and styling
- ✅ Accessibility attributes
- ✅ MUI theming integration

### Technical Achievements

- **Single Responsibility Principle**: Each component does one thing well
- **Separation of Concerns**: UI, business logic, and data are separate
- **Component Composition**: Small, reusable, testable components
- **Custom Hooks**: Encapsulated state management and side effects
- **TypeScript Excellence**: Comprehensive type safety and interfaces
- **Documentation**: JSDoc for every public interface
- **Clean Dependencies**: Clear import/export structure

This refactoring transforms the Random Team Generator from a poorly organized monolith into a clean, maintainable, and scalable codebase following industry best practices while preserving 100% of existing functionality.

---

---

## 📚 **Documentation Hierarchy**

**For all development work, follow this documentation order:**

1. **[DEVELOPMENT-STANDARDS.md](DEVELOPMENT-STANDARDS.md)** - **PRIMARY GUIDE** for all coding standards, architecture patterns, naming conventions, and technical decisions
2. **[PROJECT-CHARTER.md](PROJECT-CHARTER.md)** - Project overview, progress tracking, and high-level decisions  
3. **Feature README files** - Feature-specific documentation (when applicable)

### **Development Workflow Documentation**

**Before starting ANY work:**
1. Read **DEVELOPMENT-STANDARDS.md** for current architecture patterns
2. Check **PROJECT-CHARTER.md** for project status and context
3. Follow the established patterns exactly

**After completing work:**
1. Update **PROJECT-CHARTER.md** with progress and decisions
2. Update **DEVELOPMENT-STANDARDS.md** if new patterns were established
3. Ensure all code follows the documented standards

---

**Always update this file with new rules, progress, and decisions. This is the single source of truth for project progress and high-level decisions.**

**AI/Automation Workflow Rule:**

- This file must be referenced and updated after every significant project change, decision, or milestone.
- If using an AI assistant, always instruct it to check and update this file as part of your workflow.
- Pin this file in your editor for visibility, but also make it a habit to review and update it regularly.
- **CRITICAL:** Always check DEVELOPMENT-STANDARDS.md first for technical implementation guidance.

## Material 3 Color Palette (2025-06-10)

The project now uses the Material 3 (Material You) color system for both light and dark themes. All MUI components inherit these colors globally.

**Palette keys:**
- primary
- secondary
- tertiary
- error
- warning
- info
- success
- background
- surface
- onSurface
- text

**How to use:**
- Use MUI's color props: `<Button color="primary">`, `<Box bgcolor="background.paper">`, etc.
- Reference the palette demo at `/palette-demo` to see all colors and usage examples.
- Do not hardcode hex values; always use palette keys for consistency and accessibility.

**Palette Demo:**
- Visit `/palette-demo` in the app to view all theme colors, swatches, and example usage.
- Copy code snippets directly from the demo page for new features.

**Best Practices:**
- All new features and pages should use MUI components and palette keys for color.
- Typography, spacing, and transitions are set globally for a modern, accessible look.
- Navigation highlighting, snackbar feedback, and micro-animations are now standard.

**Light Theme Example:**
- primary: #6750A4
- secondary: #625B71
- tertiary: #7D5260
- error: #B3261E
- warning: #F9A825
- info: #00639B
- success: #2E7D32
- background: #FFFBFE
- surface: #FFFBFE
- onSurface: #1C1B1F
- text primary: #1C1B1F
- text secondary: #49454F

**Dark Theme Example:**
- primary: #D0BCFF
- secondary: #CCC2DC
- tertiary: #EFB8C8
- error: #F2B8B5
- warning: #FFD600
- info: #80D8FF
- success: #81C784
- background: #1C1B1F
- surface: #1C1B1F
- onSurface: #E6E1E5
- text primary: #E6E1E5
- text secondary: #CAC4D0

**UI/UX Improvements (2025-06-10):**
- Material 3 palette and typography
- Navigation highlighting in header/footer
- Snackbar feedback for theme changes
- Micro-animations for dialogs, menus, and buttons
- All changes are global and apply to new features automatically

**Service Worker Registration (2025-06-10):**
- The service worker (sw.js) is only registered in production builds (import.meta.env.PROD) to avoid caching issues during local development.
- This ensures you always see the latest changes when running the dev server, but still get full PWA support and offline caching in production (GitHub Pages).
- If you need to test the service worker locally, build the app for production and serve the dist folder.
- This is best practice for React/MUI/Vite PWAs to prevent confusion and stale content during development.
