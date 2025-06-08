# DEVELOPMENT STANDARDS & ARCHITECTURE GUIDE

## 🎯 **Project Overview**

**Quizzard** is a comprehensive quiz creation and management platform designed for interactive quiz experiences like bar quiz nights with quizmasters and competing teams. Built with React, TypeScript, Material-UI following clean architecture principles, and optimized for PWA deployment to all platforms including future Android APK distribution.

**Live URL:** [https://simeontsvetanov.github.io/Quizzard/](https://simeontsvetanov.github.io/Quizzard/)

### **App Purpose & Vision**

**Main Goal:** Create and play quizzes just like traditional bar quiz nights - with a quizmaster, multiple teams, rounds, scoring, and interactive gameplay.

**Target Users:** Quizmasters, event organizers, teachers, friends groups, bar owners, and anyone running interactive quiz events.

**Platform Strategy:** 
- **Phase 1:** PWA web application (current)
- **Phase 2:** Android APK deployment via PWA packaging
- **Phase 3:** Cross-platform mobile apps (React Native)

### **Current Status & Roadmap**

#### **✅ COMPLETED TOOLS**

**1. Random Team Generator** (LIVE)
- Participant input with auto-creation and keyboard navigation
- Team count selection (2-10 teams) with smart distribution
- Cheat code easter egg ("the followers")
- Teams modal with refresh, copy, and close actions
- localStorage persistence for participant names
- Clear all with confirmation dialog
- Responsive design across all devices
- Complete clean architecture implementation

#### **🚧 IN DEVELOPMENT**

**2. Points Counter** (NEXT PRIORITY)
- **Purpose:** Help quizmasters track team scores during quiz games
- **Setup Phase:** 
  - Teams count input (1-20 teams)
  - Rounds count input (1-50 rounds)
  - Auto-generated funny team names (editable by users)
  - Default names from curated funny team names list
- **Game Phase:**
  - Round-by-round scoring with card-based layout
  - Each team card shows: Team name, round points input, total score
  - Simple navigation between rounds (Previous/Next)
  - Real-time score calculation and leaderboard updates
- **Features:**
  - **Leaderboard popup:** Ranked teams with 1st/2nd/3rd...Nth place styling
  - **Copy function:** Styled leaderboard to clipboard with emojis/formatting
  - **Edit mode:** Return to setup while preserving current game state
  - **Clear/Start Over:** Full reset with confirmation dialog
  - **localStorage persistence:** Full game state saved automatically
  - **Responsive design:** Works on 4K TVs to mobile phones

#### **📋 FUTURE DEVELOPMENT**

**3. Quizzes - Quizz Builder & Presentation Software** (PLANNED)
- **Purpose:** Full quiz creation and live presentation platform
- **Features:** 
  - PowerPoint-like quiz builder with multiple question formats
  - Live presentation mode with timer functionality
  - Screen sharing capabilities for remote participants
  - Advanced scoring systems and real-time leaderboards
  - Question bank management and quiz templates
  - Separate advanced storage system
  - Export/import functionality
- **Target:** Professional quiz events, corporate training, educational use

---

## 🏛️ **Architecture Standards**

### **Core Principles**

1. **Clean Architecture** - Separation of concerns with clear boundaries
2. **Feature-Based Organization** - Each tool is self-contained
3. **Component Composition** - Small, reusable, single-purpose components
4. **Type Safety** - Comprehensive TypeScript usage
5. **Accessibility First** - WCAG compliant, keyboard navigation, ARIA support
6. **PWA-First Design** - ⚡ **PRIORITY** - Optimized for Progressive Web App and future Android APK deployment
7. **Universal Device Support** - Pixel-perfect responsive design from 4K 70-inch TVs to mobile phones
8. **State Persistence** - Automatic localStorage for all user data and application state

### **Folder Structure (MANDATORY)**

```
src/
├── features/                    # Feature-specific modules
│   ├── {feature-name}/         # kebab-case naming
│   │   ├── components/         # UI components (grouped by purpose)
│   │   │   ├── {ComponentGroup}/  # PascalCase folders
│   │   │   │   ├── ComponentName.tsx     # PascalCase files
│   │   │   │   └── index.ts              # Named exports
│   │   ├── hooks/              # Custom hooks
│   │   │   └── use{HookName}.ts          # camelCase with 'use' prefix
│   │   ├── utils/              # Pure functions
│   │   │   └── {utilityName}.ts          # camelCase files
│   │   ├── types/              # TypeScript definitions
│   │   │   └── index.ts                  # Single types file per feature
│   │   └── pages/              # Main page components
│   │       └── {FeatureName}Page.tsx     # PascalCase with 'Page' suffix
├── shared/                     # Cross-feature resources
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # Global custom hooks
│   ├── utils/                  # Global utilities
│   ├── assets/                 # Static files (images, icons)
│   └── types/                  # Global type definitions
├── pages/                      # Route-level pages
└── App.tsx                     # Root component
```

### **Component Architecture Rules**

#### **1. Single Responsibility Principle**
- Each component does ONE thing well
- Max 150 lines per component (excluding JSDoc)
- If larger, split into sub-components

#### **2. Component Categories**

**Container Components** (orchestrators):
```tsx
// ParticipantsList.tsx - manages participant collection
const ParticipantsList: React.FC<Props> = ({ participants, onAction }) => {
  return (
    <Box>
      {participants.map(p => (
        <ParticipantInput key={p.id} participant={p} onChange={onAction} />
      ))}
    </Box>
  );
};
```

**Presentation Components** (pure UI):
```tsx
// ParticipantInput.tsx - renders single input
const ParticipantInput: React.FC<Props> = ({ participant, onChange }) => {
  return (
    <TextField 
      value={participant.value}
      onChange={(e) => onChange(participant.id, e.target.value)}
    />
  );
};
```

**Hook Components** (logic extraction):
```tsx
// useParticipants.ts - encapsulates participant logic
export const useParticipants = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  // ... logic
  return { participants, addParticipant, removeParticipant };
};
```

---

## 🛠️ **Tech Stack (LOCKED)**

### **Core Framework**
- **React 18+** - Component library
- **TypeScript 5+** - Type safety and developer experience
- **Vite** - Build tool and dev server

### **UI & Styling**
- **Material-UI (MUI) v5+** - Component library (NO custom UI libraries)
- **Material Icons** - Icon system
- **Google Material Design Palette** - Color system

### **Routing & State**
- **React Router v6** - Client-side routing with BrowserRouter
- **React Hooks** - State management (useState, useEffect, custom hooks)
- **localStorage** - Persistence layer

### **Development Tools**
- **ESLint + TypeScript** - Code quality
- **Git** - Version control
- **GitHub Actions** - CI/CD pipeline (main → GitHub Pages auto-deployment)
- **GitHub Pages** - Production hosting
- **PWA Manifest** - Progressive Web App configuration
- **Service Worker** - Offline functionality and auto-updates

### **NO ADDITIONS WITHOUT APPROVAL**
- No state management libraries (Redux, Zustand, etc.)
- No styling libraries beyond MUI
- No utility libraries (lodash, etc.) - use native JS
- No additional routing libraries

---

## 📝 **Naming Conventions (MANDATORY)**

### **Files & Folders**
```bash
# Folders
kebab-case/                    # feature-names, utility-groups
PascalCase/                    # component-groups

# TypeScript Files
PascalCase.tsx                 # React components
camelCase.ts                   # utilities, hooks, types
useCamelCase.ts               # custom hooks (use prefix)
```

### **Variables & Functions**
```typescript
// Variables
const participantNames = ['Alice', 'Bob'];          // camelCase
const MAX_PARTICIPANTS = 50;                        // SCREAMING_SNAKE_CASE (constants)

// Functions
const handleParticipantChange = () => {};           // camelCase with action prefix
const generateTeams = () => {};                     // camelCase, verb-oriented

// Types & Interfaces
interface ParticipantInput {                        // PascalCase
  id: number;
  value: string;
}

type TeamMember = {                                 // PascalCase
  name: string;
  role: string;
};
```

### **Component Patterns**
```typescript
// Props interface naming
interface ComponentNameProps {                     // ComponentName + Props
  children?: React.ReactNode;
  onAction: (data: Data) => void;                  // on + Action naming
}

// Component declaration
const ComponentName: React.FC<ComponentNameProps> = ({ 
  children, 
  onAction 
}) => {
  // Component logic
};

export default ComponentName;
```

---

## 🎨 **Styling Standards**

### **🎨 QUIZZARD VISUAL DESIGN SYSTEM**

#### **❌ NEVER USE:**
- **Borders** on any elements (buttons, cards, menus, inputs)
- **Sharp corners** - all elements must have rounded corners
- **Hardcoded colors** - always use theme palette
- **Fixed pixel values** - always use responsive breakpoints

#### **✅ ALWAYS USE:**
- **Background colors** with contrasting text (theme-dependent)
- **MUI elevation/shadows** for floating effect on cards and popups
- **Blur background** when popups/menus are in focus
- **Smooth animations** for all state transitions
- **Rounded corners** on all interactive elements

### **MUI Theming & Color System**
```typescript
// ✅ CORRECT: Quizzard styling pattern
<Button sx={{
  bgcolor: 'primary.main',            // Theme background
  color: 'primary.contrastText',      // Contrasting text
  borderRadius: 2,                    // Rounded corners
  border: 'none',                     // NO BORDERS
  elevation: 2,                       // Floating shadow effect
  '&:hover': {
    bgcolor: 'primary.dark',          // Theme hover state
    elevation: 4                      // Enhanced shadow on hover
  }
}}>

// ✅ CORRECT: Card with floating effect
<Card sx={{
  bgcolor: 'background.paper',
  border: 'none',                     // NO BORDERS
  borderRadius: 3,                    // Rounded corners
  elevation: 3,                       // Floating shadow
  '&:hover': { elevation: 6 }         // Enhanced shadow on hover
}}>

// ✅ CORRECT: Modal/Popup with background blur
<Modal sx={{
  '& .MuiBackdrop-root': {
    backdropFilter: 'blur(4px)',      // Blur background when focused
    backgroundColor: 'rgba(0,0,0,0.3)' // Semi-transparent overlay
  }
}}>

// ❌ NEVER: Hardcoded values or borders
<Box sx={{
  backgroundColor: '#ffffff',         // ❌ Hardcoded color
  border: '1px solid #ccc',          // ❌ Border
  borderRadius: '0px',               // ❌ Sharp corners
  padding: '16px'                    // ❌ Fixed padding
}}>
```

### **🖥️ UNIVERSAL DEVICE SUPPORT (MANDATORY)**

#### **Target Device Range:**
- **Mobile phones:** 320px - 768px (portrait & landscape)
- **Tablets:** 768px - 1200px (portrait & landscape)  
- **Laptops/Desktops:** 1200px - 2560px
- **Large displays/TVs:** 2560px - 7680px (4K/8K TVs up to 70+ inches)

#### **PWA & APK Deployment Requirements:**
```typescript
// MANDATORY: All components must be fully responsive
const DEVICE_BREAKPOINTS = {
  xs: 0,      // Mobile phones (portrait)
  sm: 600,    // Mobile phones (landscape) / Small tablets
  md: 900,    // Tablets (portrait) / Small laptops
  lg: 1200,   // Laptops / Desktop monitors
  xl: 1536,   // Large desktops / Small TVs
  xxl: 2560   // 4K TVs and large displays
};

// ✅ CORRECT: Pixel-perfect responsive design
sx={{
  // Font sizes that scale across ALL devices
  fontSize: { 
    xs: 14,    // Mobile
    sm: 16,    // Tablet
    md: 18,    // Laptop
    lg: 20,    // Desktop
    xl: 24     // Large displays
  },
  // Padding that works on touch screens AND TV remotes
  p: { 
    xs: 1,     // Tight on mobile
    sm: 2,     // Comfortable on tablet
    md: 3,     // Spacious on desktop
    lg: 4,     // Extra space on large displays
    xl: 6      // TV-friendly spacing
  },
  // Touch targets minimum 48px on mobile, larger on TV
  minHeight: { xs: 48, sm: 52, md: 56, lg: 60, xl: 72 },
  minWidth: { xs: 48, sm: 52, md: 56, lg: 60, xl: 72 }
}}
```

#### **PWA Performance Requirements:**
- **Load time:** < 3 seconds on 3G networks
- **Touch targets:** Minimum 48px on mobile, 72px+ on TV interfaces
- **Text readability:** Minimum 16px font size on mobile
- **Offline capability:** Core functionality works without internet
- **Install prompt:** Native app-like installation experience

### **Layout Patterns**
```typescript
// Page Layout Pattern (use everywhere)
<Box sx={{ 
  bgcolor: 'background.default',
  py: 3,
  px: { xs: 1, sm: 2 },
  display: 'flex',
  justifyContent: 'center'
}}>
  <Box sx={{ 
    width: '100%',
    maxWidth: { xs: 'calc(100vw - 16px)', sm: 'clamp(280px, 50vw, 600px)' },
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  }}>
    {/* Content */}
  </Box>
</Box>
```

---

## 🗂️ **Data Management & Persistence**

### **📱 LOCAL STORAGE SYSTEM (CRITICAL)**

#### **Current Implementation:**
```typescript
// ✅ CURRENT: Theme persistence
const THEME_KEY = 'user-settings-theme-selection';
localStorage.setItem(THEME_KEY, 'dark');

// ✅ CURRENT: Random Team Generator state
const RTG_PARTICIPANTS_KEY = 'rtg-participants';
localStorage.setItem(RTG_PARTICIPANTS_KEY, JSON.stringify(participants));
```

#### **🔄 AUTOMATIC STATE PERSISTENCE PATTERN:**
```typescript
// ✅ REQUIRED: All tools must auto-save state
export const useLocalStoragePersistence = <T>(
  key: string,
  defaultValue: T,
  debounceMs: number = 500
) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Auto-save with debounce
  const debouncedSave = useMemo(
    () => debounce((newValue: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Failed to save to localStorage: ${key}`, error);
      }
    }, debounceMs),
    [key, debounceMs]
  );

  useEffect(() => {
    debouncedSave(value);
  }, [value, debouncedSave]);

  return [value, setValue] as const;
};
```

#### **🗂️ STORAGE KEY CONVENTIONS:**
```typescript
// Feature-based key naming
const STORAGE_KEYS = {
  // Global app settings
  THEME: 'user-settings-theme-selection',
  PWA_INSTALL_PROMPT: 'user-settings-pwa-install-dismissed',
  
  // Random Team Generator
  RTG_PARTICIPANTS: 'rtg-participants',
  RTG_TEAM_COUNT: 'rtg-team-count',
  
  // Points Counter (FUTURE)
  PC_GAME_STATE: 'pc-current-game-state',
  PC_TEAMS: 'pc-teams-data',
  PC_ROUNDS: 'pc-rounds-data',
  PC_SETTINGS: 'pc-game-settings',
  
  // Quiz Builder (FUTURE)
  QB_QUIZZES: 'qb-saved-quizzes',
  QB_TEMPLATES: 'qb-quiz-templates',
  QB_SETTINGS: 'qb-builder-settings'
} as const;
```

#### **⚡ CRITICAL: Tool State Persistence Rules**

**1. AUTO-SAVE Everything:**
- User input is saved every 500ms (debounced)
- Page refresh/exit preserves all data
- Only explicit "Clear/Reset" actions remove data

**2. POINTS COUNTER Requirements:**
- Current game state must persist through browser refresh
- Team names, scores, current round all auto-saved
- Only "Clear Game" button removes localStorage data
- Edit mode preserves all existing game progress

**3. Error Handling:**
```typescript
// Always handle localStorage failures gracefully
const saveGameState = (gameData: GameState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PC_GAME_STATE, JSON.stringify(gameData));
  } catch (error) {
    // Show user-friendly error, don't crash app
    showSnackbar('Unable to save game progress. Storage may be full.', 'warning');
  }
};
```

#### **💾 Adding New Storage for Future Features:**

**Step 1: Add to STORAGE_KEYS**
```typescript
const STORAGE_KEYS = {
  // ... existing keys
  NEW_FEATURE_DATA: 'nf-feature-data',  // Use feature prefix
} as const;
```

**Step 2: Create Custom Hook**
```typescript
export const useNewFeaturePersistence = () => {
  const [data, setData] = useLocalStoragePersistence(
    STORAGE_KEYS.NEW_FEATURE_DATA,
    DEFAULT_FEATURE_STATE,
    500 // 500ms debounce
  );
  
  return { data, setData };
};
```

**Step 3: Add Clear Function**
```typescript
const clearFeatureData = () => {
  localStorage.removeItem(STORAGE_KEYS.NEW_FEATURE_DATA);
  setData(DEFAULT_FEATURE_STATE);
};
```

---

## 🚀 **Deployment & GitHub Workflow**

### **📤 DEPLOYMENT PROCESS (AUTOMATED)**

#### **Push to Main = Auto-Deploy to GitHub Pages**
```bash
# 1. Make changes locally and test
npm run dev                    # Test locally
npm run build                  # Test production build

# 2. Commit and push to main branch (SOURCE CODE ONLY)
git add .
git commit -m "Add new feature: Points Counter setup phase"
git push origin main

# 3. GitHub Actions automatically:
#    - Builds the app (npm run build)
#    - Deploys to gh-pages branch
#    - Updates live site at: https://simeontsvetanov.github.io/Quizzard/
```

#### **❌ NEVER:**
- Push built files (`dist/`, `build/`) to main branch
- Edit files directly in gh-pages branch
- Deploy manually unless GitHub Actions fails

#### **✅ ALWAYS:**
- Push only source code to main
- Let GitHub Actions handle builds and deployment
- Test locally before pushing
- Update documentation with changes

### **🔄 GitHub Actions Workflow (Automated)**
```yaml
# .github/workflows/pages.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: ["main"]           # Triggers on main branch pushes
    
permissions:
  contents: write                # Required for gh-pages deployment
  pages: write
  id-token: write

# Process: main branch → build → gh-pages branch → live site
```

### **⚡ PWA Deployment Requirements**

#### **Service Worker Auto-Versioning:**
- Service worker only registers in production (`import.meta.env.PROD`)
- Auto-updates on deployment for immediate user refresh
- Offline capability for core app functionality

#### **PWA Manifest Configuration:**
```json
{
  "name": "Quizzard - Quiz Management Platform",
  "short_name": "Quizzard",
  "display": "fullscreen",           // Full PWA experience
  "start_url": "/Quizzard/",
  "scope": "/Quizzard/",
  "orientation": "any",              // All device orientations
  "background_color": "#1976D2",     // Theme primary color
  "theme_color": "#1976D2"
}
```

#### **APK Deployment Strategy (Future):**
- **Phase 1:** PWA packaging using tools like PWABuilder
- **Phase 2:** React Native cross-platform apps
- **Target:** Google Play Store, Samsung Galaxy Store, Amazon Appstore

---

## 📋 **Code Standards**

### **TypeScript Requirements**

#### **1. Interface Definitions**
```typescript
// ALWAYS define comprehensive interfaces
interface ParticipantInput {
  /** Unique identifier for the participant */
  id: number;
  /** Current input value */
  value: string;
  /** Optional validation state */
  isValid?: boolean;
}

// Group related types in feature/types/index.ts
export interface ParticipantInput { /* */ }
export interface Team { /* */ }
export interface ValidationResult { /* */ }
export const CONSTANTS = {
  MAX_PARTICIPANTS: 50,
  MIN_TEAM_SIZE: 2
} as const;
```

#### **2. Function Signatures**
```typescript
// ALWAYS type function parameters and returns
const generateTeams = (
  participants: string[], 
  teamCount: number
): Team[] => {
  // Implementation
};

// Use proper return types for hooks
const useParticipants = (): {
  participants: ParticipantInput[];
  addParticipant: (name: string) => void;
  removeParticipant: (id: number) => void;
} => {
  // Implementation
};
```

### **JSDoc Documentation (MANDATORY)**

#### **Component Documentation**
```typescript
/**
 * ParticipantInput Component
 * 
 * Renders a single participant input field with auto-focus management,
 * validation, and removal capabilities. Supports keyboard navigation
 * and responsive design across all device sizes.
 * 
 * @example
 * <ParticipantInput
 *   participant={{ id: 1, value: 'Alice' }}
 *   isOnlyInput={false}
 *   inputRef={inputRefs.current.get(1)}
 *   onChange={(id, value) => updateParticipant(id, value)}
 *   onKeyDown={handleKeyNavigation}
 *   onRemove={(id) => removeParticipant(id)}
 * />
 */
const ParticipantInput: React.FC<ParticipantInputProps> = ({
  participant,
  isOnlyInput,
  // ... props
}) => {
  // Implementation
};
```

#### **Hook Documentation**
```typescript
/**
 * useParticipants Hook
 * 
 * Custom hook for managing participant state in team generation.
 * Handles participant input management, cheat codes, auto-cleanup,
 * localStorage persistence, and validation.
 * 
 * Features:
 * - Auto-save to localStorage with 500ms debounce
 * - Cheat code detection ("the followers")
 * - Automatic empty input cleanup
 * - Keyboard navigation support
 * 
 * @returns Object containing participant state and management functions
 */
export const useParticipants = (): UseParticipantsReturn => {
  // Implementation
};
```

### **Error Handling Patterns**
```typescript
// ALWAYS use try-catch for external operations
const saveToLocalStorage = (data: any): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Error saving to localStorage:', error);
    // Graceful degradation - app continues working
  }
};

// ALWAYS validate external data
const loadFromLocalStorage = (): ParticipantData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      
      // Validate data structure
      if (data.participants && Array.isArray(data.participants)) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Error loading from localStorage:', error);
  }
  
  return null; // Return null, let caller handle default
};
```

---

## 🔄 **Git Workflow & Standards**

### **Branch Strategy**
```bash
main                           # Production-ready code
├── feature/participant-persistence    # Feature branches
├── fix/layout-spacing-issue          # Bug fix branches
└── refactor/clean-architecture       # Refactoring branches
```

### **Commit Message Format (MANDATORY)**
```bash
# Format: TYPE: Description
# Types: FEATURE, FIX, REFACTOR, UX, DOCS, STYLE

FEATURE: Add localStorage persistence for participant names
FIX: Remove excessive spacing between content and footer
REFACTOR: Complete Random Team Generator clean architecture
UX: Move snackbar notifications from bottom to top
DOCS: Add comprehensive development standards guide
STYLE: Update button hover states to match design system
```

### **Pull Request Process**
1. **Create feature branch** from main
2. **Implement changes** following all standards
3. **Test locally** - `npm run build` must pass
4. **Document changes** in PROJECT-CHARTER.md
5. **Commit** with proper message format
6. **Push to main** (no PR needed for single developer)

---

## 📚 **Development Workflow**

### **Before Every Feature**
1. **Read this guide** - Ensure you understand current standards
2. **Check PROJECT-CHARTER.md** - Review project status
3. **Plan architecture** - How does this fit our patterns?
4. **Define interfaces** - TypeScript types first

### **During Development**
1. **Follow folder structure** - No exceptions
2. **Write JSDoc** - Document as you go
3. **Use TypeScript** - No `any` types
4. **Test locally** - `npm run dev` and `npm run build`

### **After Implementation**
1. **Update PROJECT-CHARTER.md** - Document what was built
2. **Test all functionality** - Including existing features
3. **Commit with proper message** - Follow format
4. **Deploy and verify** - Check GitHub Pages

### **File Creation Checklist**
- [ ] Follows naming conventions
- [ ] In correct folder location
- [ ] Has TypeScript interfaces
- [ ] Includes JSDoc documentation
- [ ] Uses MUI theming
- [ ] Responsive design implemented
- [ ] Error handling included

---

## 🏗️ **Architecture Decision Records (ADR)**

### **ADR-001: Feature-Based Architecture**
**Date:** 2025-12-07  
**Status:** Accepted  
**Decision:** Organize code by feature rather than by file type  
**Rationale:** Better scalability, clearer boundaries, easier maintenance  

### **ADR-002: MUI-Only Styling**
**Date:** 2025-06-05  
**Status:** Accepted  
**Decision:** Use only Material-UI for styling, no custom CSS libraries  
**Rationale:** Consistency, accessibility, maintenance burden  

### **ADR-003: localStorage for Persistence**
**Date:** 2025-12-07  
**Status:** Accepted  
**Decision:** Use localStorage for client-side data persistence  
**Rationale:** Simple, no backend required, good user experience  

### **ADR-004: TypeScript Everywhere**
**Date:** 2025-06-04  
**Status:** Accepted  
**Decision:** Mandatory TypeScript with comprehensive type definitions  
**Rationale:** Developer experience, catch errors early, self-documenting code  

---

## 📋 **Quality Gates**

### **Pre-Commit Checklist**
- [ ] `npm run build` passes without errors
- [ ] All TypeScript interfaces defined
- [ ] JSDoc documentation added
- [ ] Responsive design tested
- [ ] Follows naming conventions
- [ ] Error handling implemented
- [ ] PROJECT-CHARTER.md updated

### **Code Review Points**
- Does it follow our folder structure?
- Are TypeScript types comprehensive?
- Is JSDoc documentation complete?
- Does it use MUI theming correctly?
- Is responsive design implemented?
- Are error cases handled gracefully?

---

## 🔧 **Tools & Commands**

### **Development Commands**
```bash
npm run dev          # Start development server
npm run build        # Production build (must pass)
npm run preview      # Test production build locally
npm run deploy       # Build and deploy to GitHub Pages
```

### **Debugging LocalStorage**
```javascript
// Browser console commands
localStorage.getItem('quizzard-random-team-generator-participants')
localStorage.getItem('user-settings-theme-selection')
localStorage.clear() // Reset all app data
```

### **Git Shortcuts**
```bash
git add . && git commit -m "TYPE: Description" && git push origin main
```

---

## 📈 **Future Considerations**

### **When Project Grows**
- Consider **React Query** for server state (if backend added)
- Consider **Storybook** for component documentation
- Consider **Jest/Testing Library** for automated testing
- Consider **Prettier** for code formatting

### **When Team Grows**
- Add **ESLint rules** enforcement
- Add **Husky** pre-commit hooks
- Add **conventional commits** linting
- Add **PR template** requirements

---

## 📞 **Questions & Changes**

**Before making ANY architectural changes:**
1. Document the proposed change
2. Update this standards guide
3. Update PROJECT-CHARTER.md
4. Ensure consistency across existing code

**This document is the source of truth for all development decisions.**

---

## 📖 **HOW TO USE THIS DOCUMENT**

### **🎯 For All Development Work:**

#### **BEFORE Starting Any Task:**
1. **READ THIS DOCUMENT FIRST** - Review relevant sections for your task
2. **Check PROJECT-CHARTER.md** - Understand current progress and context
3. **Follow Patterns Exactly** - Use existing code as reference
4. **Understand PWA Requirements** - Every component must work on all devices

#### **DURING Development:**
1. **Reference Style Guidelines** - Copy styling patterns from this document
2. **Use localStorage Patterns** - Follow auto-save requirements
3. **Follow Naming Conventions** - Consistent file and variable naming
4. **Apply Visual Design System** - No borders, floating effects, blur backgrounds

#### **AFTER Development:**
1. **Update This Document** - Add new patterns or decisions
2. **Update PROJECT-CHARTER.md** - Record progress and changes
3. **Test on Multiple Devices** - Ensure responsive design works
4. **Push to Main** - Automatic deployment handles the rest

### **🚨 CRITICAL REMINDERS:**

#### **For PWA & APK Success:**
- **Test on phones AND large TVs** - 320px to 7680px screen sizes
- **Touch targets 48px minimum** - Accessible on all devices
- **Auto-save everything** - Browser refresh should never lose data
- **No borders anywhere** - Use background colors and shadows only
- **Blur popups/modals** - Background blur when focused

#### **For Team Collaboration:**
- **This document is law** - All team members must follow exactly
- **One source of truth** - Don't create conflicting documentation
- **Regular updates** - Keep this document current with changes
- **Reference in PRs** - Link to relevant sections in pull requests

### **📋 Quick Reference Checklist:**

```typescript
// ✅ Before creating any component:
// 1. Does it follow the visual design system? (no borders, shadows, blur)
// 2. Is it responsive across all device sizes? (xs to xxl breakpoints)
// 3. Does it auto-save to localStorage if needed? (useLocalStoragePersistence)
// 4. Is it properly typed with JSDoc? (interfaces + documentation)
// 5. Does it handle errors gracefully? (try-catch + user feedback)

// ✅ Before pushing to main:
// 1. npm run build (successful production build)
// 2. Test on mobile AND desktop
// 3. Update DEVELOPMENT-STANDARDS.md if new patterns added
// 4. Update PROJECT-CHARTER.md with progress
// 5. Push to main (auto-deployment to GitHub Pages)
```

### **🔗 Document Workflow:**

#### **1. Starting Development Session:**
```bash
# Always start here
1. Open DEVELOPMENT-STANDARDS.md (this file)
2. Open PROJECT-CHARTER.md 
3. npm run dev
4. Review relevant sections for your task
```

#### **2. During Development:**
```bash
# Keep these open and reference frequently
- DEVELOPMENT-STANDARDS.md → Technical patterns
- PROJECT-CHARTER.md → Progress tracking
- Browser DevTools → Test responsive design
```

#### **3. Finishing Development:**
```bash
# Update documentation before pushing
1. Update PROJECT-CHARTER.md with progress
2. Update DEVELOPMENT-STANDARDS.md if new patterns
3. npm run build (must pass)
4. git push origin main (auto-deploys)
```

---

*This document is the **SINGLE SOURCE OF TRUTH** for Quizzard development standards. All contributors must follow these guidelines strictly to ensure consistent, high-quality, and scalable code across the entire platform.*

**📍 Document Hierarchy:**
1. **DEVELOPMENT-STANDARDS.md** (this file) - Primary technical guide
2. **PROJECT-CHARTER.md** - Progress tracking and high-level decisions
3. **Feature README files** - Feature-specific documentation

---

**Last Updated:** 2025-12-07  
**Version:** 1.0  
**Next Review:** When adding new major features 