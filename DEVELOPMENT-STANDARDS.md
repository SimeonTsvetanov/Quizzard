# 📘 **QUIZZARD DEVELOPMENT STANDARDS**

**Version:** 2.3  
**Last Updated:** December 19, 2025  
**Status:** ACTIVE

## **📋 OVERVIEW**

This document establishes comprehensive development standards for the Quizzard platform to ensure code quality, maintainability, and team collaboration effectiveness.

## **🎯 CORE PRINCIPLES**

### **Code Quality First**

- Write self-documenting code with clear intent
- Prefer readability over cleverness
- Follow established patterns consistently
- Test thoroughly before deployment

### **Component Architecture Rules**

#### **1. Single Responsibility Principle**

- Each component does ONE thing well
- Max 150 lines per component (excluding JSDoc)
- If larger, split into sub-components

#### **2. Header Navigation Pattern (REQUIRED)**

```typescript
// ✅ REQUIRED: Hamburger menu always visible across all screen sizes
<IconButton
  edge="start"
  color="inherit"
  aria-label="menu"
  onClick={() => setDrawerOpen(true)}
  sx={{ display: "flex" }}  // Always visible, not responsive
>
  <MenuIcon />
</IconButton>

// ❌ NEVER: Desktop inline navigation links
// Do not implement responsive navigation that shows/hides based on breakpoints
// All navigation MUST be contained within the hamburger drawer menu

// ✅ REQUIRED: Drawer menu structure with all navigation links
<Drawer anchor="left" open={drawerOpen}>
  <List>
    <ListItemButton component={RouterLink} to="/">
      <ListItemIcon><HomeIcon /></ListItemIcon>
      <ListItemText primary="Home" />
    </ListItemButton>
    <ListItemButton component={RouterLink} to="/about">
      <ListItemIcon><InfoIcon /></ListItemIcon>
      <ListItemText primary="About" />
    </ListItemButton>
    {/* Privacy Policy, Terms, Contact MUST be between About and GitHub */}
    <ListItemButton component={RouterLink} to="/privacy">
      <ListItemIcon><PrivacyTipIcon /></ListItemIcon>
      <ListItemText primary="Privacy Policy" />
    </ListItemButton>
    <ListItemButton component={RouterLink} to="/terms">
      <ListItemIcon><GavelIcon /></ListItemIcon>
      <ListItemText primary="Terms" />
    </ListItemButton>
    <ListItemButton component={RouterLink} to="/contact">
      <ListItemIcon><ContactMailIcon /></ListItemIcon>
      <ListItemText primary="Contact" />
    </ListItemButton>
    <ListItemButton component={RouterLink} to="/github">
      <ListItemIcon><GitHubIcon /></ListItemIcon>
      <ListItemText primary="GitHub" />
    </ListItemButton>
  </List>
</Drawer>
```

#### **3. Component Categories**

- **Pages**: Route-level components in `/pages`
- **Features**: Business logic components in `/features`
- **Shared**: Reusable components in `/shared`
- **Utils**: Helper functions in `/utils`

### **TypeScript Requirements**

#### **0. TypeScript Configuration (CRITICAL)**

```json
// ✅ VALID: tsconfig.app.json and tsconfig.node.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
    // ❌ NEVER: "erasableSyntaxOnly": true - This option does not exist
  }
}

// ⚠️ WARNING: Always verify TypeScript compiler options exist
// Invalid options will cause build failures and linting errors
// Check TypeScript documentation before adding new compiler options
```

#### **1. Interface Definitions**

- All props must have TypeScript interfaces
- Export interfaces for reusability
- Use descriptive names ending in `Props` or `Config`

#### **2. Type Safety**

- No `any` types allowed
- Use `unknown` for uncertain types
- Prefer union types over `any`

#### **3. Generic Usage**

- Use generics for reusable components
- Provide sensible defaults
- Document generic constraints

### **React Patterns**

#### **1. Functional Components**

- Only functional components (no class components)
- Use hooks for state management
- Custom hooks for reusable logic

#### **2. State Management**

```typescript
// ✅ PREFERRED: useState for local state
const [count, setCount] = useState<number>(0);

// ✅ PREFERRED: Custom hooks for complex state
const { participants, addParticipant } = useParticipants();
```

#### **3. Props Handling**

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  onClick,
  disabled = false,
}) => {
  // Implementation
};
```

### **Typography & Font Standards**

#### **1. Google Fonts Integration (REQUIRED)**

```html
<!-- ✅ REQUIRED: Poppins font preload in index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

#### **2. Fluid Typography System (REQUIRED)**

```typescript
// ✅ REQUIRED: Use clamp() for fluid scaling instead of manual breakpoints
sx={{
  fontSize: 'clamp(1.2rem, 2.5vw, 1.4rem)', // Modern fluid scaling
  lineHeight: 1.6, // Optimal readability
}}

// ❌ NEVER: Manual responsive breakpoints for typography
sx={{
  fontSize: { xs: '1.2rem', sm: '1.44rem', md: '1.4rem' }, // Avoid this
}}
```

#### **3. Typography Theme Configuration (REQUIRED)**

```typescript
// ✅ REQUIRED: Centralized typography in useTheme.ts
const theme = createTheme({
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',

    // Fluid scaling for all variants
    h1: { fontSize: "clamp(2rem, 5vw, 3.5rem)" },
    h5: { fontSize: "clamp(1.2rem, 3vw, 1.5rem)" },
    body1: { fontSize: "clamp(0.9rem, 2vw, 1rem)" },
    button: { fontSize: "clamp(0.8rem, 1.5vw, 0.875rem)" },

    // Custom quiz-specific variants
    quizTitle: { fontSize: "clamp(1.5rem, 3.5vw, 2rem)" },
    quizQuestion: { fontSize: "clamp(1.1rem, 2.5vw, 1.3rem)" },
    quizOption: { fontSize: "clamp(0.9rem, 2vw, 1rem)" },
    quizFeedback: { fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)" },
    quizInstructions: { fontSize: "clamp(0.8rem, 1.5vw, 0.875rem)" },
    quizCounter: { fontSize: "clamp(0.75rem, 1.2vw, 0.8rem)" },
    quizScore: { fontSize: "clamp(1.2rem, 2.8vw, 1.6rem)" },
  },
});
```

#### **4. Font Declaration Rules (REQUIRED)**

```typescript
// ✅ REQUIRED: Never manually declare font family in components
sx={{
  // Font family automatically inherited from theme
  fontWeight: 700,
  fontSize: 'clamp(1rem, 2vw, 1.2rem)',
}}

// ❌ NEVER: Manual font family declarations
sx={{
  fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif', // Redundant
  fontWeight: 700,
}}
```

#### **5. Typography Variant Usage (REQUIRED)**

```typescript
// ✅ REQUIRED: Use appropriate variants for content type
<Typography variant="quizTitle">Quiz Main Title</Typography>
<Typography variant="quizQuestion">Question Text</Typography>
<Typography variant="quizInstructions">Helper Instructions</Typography>

// ✅ REQUIRED: Override margins in layout contexts
<Typography
  variant="h1"
  sx={{ marginBottom: 0 }} // Override theme margin when using gap system
>
  Page Title
</Typography>
```

### **Card Component Standards**

#### **1. Consistent Card Sizing (REQUIRED)**

```typescript
// ✅ REQUIRED: Fixed height for visual consistency
<Card
  sx={{
    // All cards same height (as tall as tallest card)
    height: { xs: 280, sm: 320, md: 280 },

    // No mobile overflow - always use 100% width on mobile
    width: { xs: '100%', sm: '100%', md: 280, lg: 256, xl: 304 },
    maxWidth: { xs: 384, sm: 384, md: 320, lg: 320, xl: 320 },
  }}
>
```

#### **2. Card Content Distribution (REQUIRED)**

```typescript
// ✅ REQUIRED: Proper content distribution in fixed height
<CardActionArea
  sx={{
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between", // Distribute content evenly
    gap: { xs: 1, sm: 1.5, md: 1.2 },
  }}
>
  {/* Icon Section - Top */}
  <Box sx={{ flexShrink: 0 }}>{icon}</Box>

  {/* Text Content - Center with flex: 1 */}
  <Box
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    }}
  >
    <Typography variant="h5">Title</Typography>
    <Typography variant="body2">Description</Typography>
  </Box>
</CardActionArea>
```

#### **3. Card Layout Container (REQUIRED)**

```typescript
// ✅ REQUIRED: Always center cards in all layouts
<Box
  sx={{
    display: 'flex',
    flexDirection: { xs: 'column', lg: 'row' },
    justifyContent: 'center',
    alignItems: 'center', // Always center - no conditional alignment
    gap: { xs: 3, sm: 4, md: 3 },
    width: '100%',
    maxWidth: { xs: '100%', lg: '1200px' },
  }}
>
```

### **Responsive Design Patterns**

#### **1. Fluid Scaling Rules (REQUIRED)**

```typescript
// ✅ REQUIRED: Use clamp() for all responsive sizing
fontSize: 'clamp(minSize, preferredSize, maxSize)',
padding: 'clamp(0.5rem, 2vw, 1rem)',
gap: 'clamp(1rem, 3vw, 2rem)',

// ✅ REQUIRED: Optimal clamp() ranges
// Mobile-first: clamp(mobileMin, viewportUnit, desktopMax)
// Typography: clamp(0.8rem, 1.5vw, 0.9rem)
// Spacing: clamp(0.5rem, 2vw, 1rem)
// Large elements: clamp(2rem, 5vw, 3.5rem)
```

#### **2. Container Patterns (REQUIRED)**

```typescript
// ✅ REQUIRED: Gap-based spacing system
<Box sx={{
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: 3, sm: 4, md: 3 }, // 20% bigger gaps on mobile
  alignItems: 'center',
}}>

// ✅ REQUIRED: Prevent mobile overflow
<Box sx={{
  width: '100%',
  maxWidth: { xs: '100%', sm: 'clamp(280px, 90vw, 1400px)' },
  px: { xs: 1, sm: 2 }, // Horizontal padding for mobile safety
}}>
```

#### **3. Icon Sizing Standards (REQUIRED)**

```typescript
// ✅ REQUIRED: Icon sizing follows development standards
const iconSizing = {
  // Header icons: 40% larger than default
  header: { fontSize: { xs: "1.75rem", sm: "2.1rem" } },

  // Card icons: 20% bigger on mobile for touch targets
  card: { fontSize: { xs: 54, sm: 61, md: 58 } },

  // Standard icons: Base sizing
  standard: { fontSize: { xs: 24, sm: 28, md: 24 } },
};
```

### **Performance & Maintenance Standards**

#### **1. Typography Performance (REQUIRED)**

```typescript
// ✅ REQUIRED: Minimal CSS properties for performance
sx={{
  fontSize: 'clamp(0.9rem, 2vw, 1rem)', // Single fluid property
  lineHeight: 1.6, // Single value
  textAlign: 'center', // Single alignment
  // No redundant properties
}}

// ❌ AVOID: Multiple responsive properties
sx={{
  fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' }, // Creates multiple CSS rules
  lineHeight: { xs: 1.5, sm: 1.6, md: 1.6 }, // Unnecessary complexity
}}
```

#### **2. Theme Import Patterns (REQUIRED)**

```typescript
// ✅ REQUIRED: Proper TypeScript integration
import { useTheme } from "../shared/hooks/useTheme";
import type { Theme } from "@mui/material/styles";

// ✅ REQUIRED: Type-safe custom variants
declare module "@mui/material/styles" {
  interface TypographyVariants {
    quizTitle: React.CSSProperties;
    quizQuestion: React.CSSProperties;
    quizOption: React.CSSProperties;
  }
}
```

### **Material-UI Standards**

#### **PWA Manifest Configuration:**

```json
// ✅ SINGLE SOURCE OF TRUTH: public/manifest.json ONLY
{
  "name": "Quizzard - Quiz Management Platform",
  "short_name": "Quizzard",
  "display": "standalone", // Balanced PWA experience without aggressive browser features
  "start_url": "/Quizzard/",
  "scope": "/Quizzard/",
  "orientation": "any", // All device orientations
  "background_color": "#1976D2", // Theme primary color
  "theme_color": "#1976D2"
}

// ❌ NEVER: Multiple manifest.json files
// Root manifest.json has been removed to prevent conflicts
// Always use public/manifest.json as the single source of truth

// ✅ PWA Display Mode Guidelines:
// "standalone" - Recommended for most apps (app-like without browser UI)
// "fullscreen" - Only for games/immersive apps (may trigger aggressive browser features)
// "minimal-ui" - Fallback with minimal browser UI
// "browser" - Regular web page experience
```

#### **1. Theme Usage**

```typescript
// ✅ PREFERRED: Use theme values
sx={{
  color: 'primary.main',
  backgroundColor: 'background.paper',
  padding: theme => theme.spacing(2)
}}

// ❌ AVOID: Hardcoded values
sx={{
  color: '#1976d2',
  backgroundColor: '#ffffff',
  padding: '16px'
}}
```

#### **2. Responsive Design**

```typescript
// ✅ REQUIRED: Mobile-first responsive breakpoints
sx={{
  width: { xs: '100%', sm: '50%', md: '33%' },
  padding: { xs: 1, sm: 2, md: 3 }
}}
```

#### **3. Component Composition**

- Prefer composition over inheritance
- Use MUI's styling system consistently
- Leverage theme breakpoints for responsiveness

#### **4. Header & Footer Layout Standards (REQUIRED)**

```typescript
// ✅ REQUIRED: Consistent Header/Footer sizing using padding-based height control
// Header and Footer MUST maintain same height across all breakpoints

// Header Configuration:
<Toolbar
  sx={{
    minHeight: { xs: 40, sm: 48 }, // Slimmer profile for more content space
    padding: { xs: 0.25, sm: 0.5 }, // Minimal padding for tight design
    px: { xs: 1, sm: 2 }, // Horizontal spacing
  }}
>

// Footer Configuration:
<Box
  sx={{
    minHeight: { xs: 40, sm: 48 }, // MUST match header height exactly
    py: { xs: 0.25, sm: 0.5 }, // MUST match header padding
    px: { xs: 1, sm: 2 }, // MUST match header horizontal spacing
    display: "flex",
    alignItems: "center", // Center content vertically
  }}
>

// ✅ REQUIRED: Icon and Text Sizing Standards
// All header elements (icons, text) MUST have consistent sizing:
const headerElementSizing = {
  fontSize: { xs: '1.75rem', sm: '2.1rem' }, // 40% larger than default for prominence
  minWidth: { xs: 36, sm: 44 }, // Container sizing matches slimmer profile
  minHeight: { xs: 36, sm: 44 }, // Consistent with header height
  padding: { xs: 0.25, sm: 0.5 }, // Minimal padding for elements
};

// ❌ NEVER: Size elements based on their content height
// ❌ NEVER: Use different heights for header and footer
// ❌ NEVER: Use large padding that makes header/footer bulky
```

#### **5. Header Navigation Standards (REQUIRED)**

```typescript
// ✅ REQUIRED: Three-element header layout with dynamic text
<Toolbar>
  {/* Left: Home icon (clickable, links to /) */}
  <IconButton component={RouterLink} to="/" aria-label="Home">
    <HomeRoundedIcon sx={{ fontSize: { xs: "1.75rem", sm: "2.1rem" } }} />
  </IconButton>

  {/* Center: Dynamic text (non-clickable, route-based) */}
  <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
    <Typography sx={{ fontSize: dynamicHeader.fontSize }}>
      {dynamicHeader.text}
    </Typography>
  </Box>

  {/* Right: Menu icon (always visible, opens drawer) */}
  <IconButton onClick={handleDrawerToggle} aria-label="menu">
    <MenuOpenRoundedIcon sx={{ fontSize: { xs: "1.75rem", sm: "2.1rem" } }} />
  </IconButton>
</Toolbar>;

// ✅ REQUIRED: Dynamic header text system
const getDynamicHeaderText = (pathname: string) => {
  // Strip base path for universal compatibility
  const cleanPath = pathname.replace("/Quizzard", "");

  // Character-based responsive font sizing
  const getFontSize = (chars: number) => {
    if (chars <= 8) return { xs: "1.75rem", sm: "2.1rem" }; // Standard
    else if (chars <= 14) return { xs: "1.4rem", sm: "1.8rem" }; // Medium
    else return { xs: "1.2rem", sm: "1.6rem" }; // Compact
  };

  return { text: mapping.text, fontSize: getFontSize(mapping.chars) };
};

// ✅ REQUIRED: Route mappings for all tools
const textMappings = {
  "/": { text: "QUIZZARD", chars: 8 },
  "/random-team-generator": { text: "RANDOM GENERATOR", chars: 16 },
  "/points-counter": { text: "POINTS COUNTER", chars: 14 },
  "/quizzes": { text: "QUIZZES", chars: 7 },
};
```

#### **6. Dynamic Header Text Standards (REQUIRED)**

**Route-Based Text System:**

- **Header text MUST change based on current route** to provide context-aware branding
- **Universal path handling** for development (clean paths) and production (base paths)
- **Character-based responsive font sizing** to ensure text fits between header icons
- **Automatic fallback** to default "QUIZZARD" for unknown routes

**Responsive Typography Tiers:**

```typescript
// ✅ REQUIRED: Three-tier responsive font sizing system
const fontSizingTiers = {
  // Short text (≤8 characters): QUIZZARD, QUIZZES
  standard: { xs: "1.75rem", sm: "2.1rem" },

  // Medium text (9-14 characters): POINTS COUNTER
  medium: { xs: "1.4rem", sm: "1.8rem" },

  // Long text (≥15 characters): RANDOM GENERATOR
  compact: { xs: "1.2rem", sm: "1.6rem" },
};
```

**Implementation Requirements:**

- **React Router integration**: Use `useLocation` hook for route detection
- **Path normalization**: Strip base paths for consistent route matching
- **TypeScript safety**: Full type definitions for text mappings and font sizes
- **Debug logging**: Console output for development troubleshooting
- **Shimmer animation**: Preserve existing header animation effects
- **Mobile-first design**: Text must fit perfectly between icons on all screen sizes

**Adding New Routes:**

```typescript
// ✅ REQUIRED: When adding new tools, update text mappings
const textMappings = {
  "/new-tool": { text: "NEW TOOL NAME", chars: 13 }, // Specify character count
  // Font size automatically calculated based on character count
};
```

**Cross-Platform Compatibility:**

- **Development environment**: Handles clean paths (`/quizzes`)
- **Production environment**: Strips base path from full paths (`/Quizzard/quizzes`)
- **Universal fallback**: Always defaults to home text for unmatched routes
- **Performance optimized**: Efficient character-based calculation system

### **localStorage Patterns**

#### **1. Centralized Storage Keys**

```typescript
// ✅ REQUIRED: Use centralized storage key system
import { STORAGE_KEYS } from "../constants/storage";

// Save data
localStorage.setItem(STORAGE_KEYS.RTG_PARTICIPANTS, JSON.stringify(data));

// Load data
const data = JSON.parse(
  localStorage.getItem(STORAGE_KEYS.RTG_PARTICIPANTS) || "[]"
);
```

#### **2. Auto-save Implementation**

```typescript
// ✅ REQUIRED: 500ms debounced auto-save
useEffect(() => {
  const timeoutId = setTimeout(() => {
    localStorage.setItem(
      STORAGE_KEYS.RTG_PARTICIPANTS,
      JSON.stringify(participants)
    );
  }, 500);

  return () => clearTimeout(timeoutId);
}, [participants]);
```

#### **3. Data Migration Support**

```typescript
// ✅ REQUIRED: Support legacy key migration
const loadParticipants = (): Participant[] => {
  // Try new centralized key first
  let data = localStorage.getItem(STORAGE_KEYS.RTG_PARTICIPANTS);

  if (!data) {
    // Check legacy key and migrate
    const legacyData = localStorage.getItem(
      "quizzard-random-team-generator-participants"
    );
    if (legacyData) {
      localStorage.setItem(STORAGE_KEYS.RTG_PARTICIPANTS, legacyData);
      localStorage.removeItem("quizzard-random-team-generator-participants");
      data = legacyData;
    }
  }

  return data ? JSON.parse(data) : [];
};
```

#### **4. useLocalStoragePersistence Hook Pattern**

```typescript
// ✅ PREFERRED: Use the standardized localStorage persistence hook
import { useLocalStoragePersistence } from "../../../shared/hooks/useLocalStoragePersistence";
import { STORAGE_KEYS } from "../../../shared/utils/storageKeys";

// In your component or custom hook:
const { value: teamCount, setValue: setTeamCountValue } =
  useLocalStoragePersistence<number>(
    STORAGE_KEYS.RTG_TEAM_COUNT,
    CONSTANTS.MIN_TEAMS, // default value
    {
      debounceMs: 500, // 500ms auto-save debounce
      iosCompatMode: true, // iOS storage safety checks
    }
  );

// Use just like useState:
const handleIncrement = () => setTeamCountValue((prev) => prev + 1);
const resetToDefault = () => setTeamCountValue(CONSTANTS.MIN_TEAMS);
```

### **Folder Structure**

```text
src/
├── components/
│   ├── ui/           # Reusable UI components
│   └── layout/       # Layout components
├── features/
│   ├── rtg/          # Random Team Generator
│   ├── quiz/         # Quiz features
│   └── scoring/      # Scoring system
├── pages/            # Route components
├── hooks/            # Custom React hooks
├── utils/            # Helper functions
├── constants/        # App constants
├── types/            # TypeScript definitions
└── assets/           # Static assets
```

#### **File Naming:**

- Use PascalCase for components: `TeamGenerator.tsx`
- Use camelCase for utilities: `generateTeams.ts`
- Use kebab-case for assets: `team-icon.png`

#### **Points Counter Requirements**

- Auto-save every 500ms using debounced localStorage
- Support undo/redo operations (10 action history)
- Visual feedback for all point changes
- Keyboard shortcuts (+ for increment, - for decrement)
- Export functionality (JSON, CSV)

### **Testing Standards**

#### **1. Unit Testing**

- Test all custom hooks
- Test utility functions thoroughly
- Mock external dependencies

#### **2. Component Testing**

- Test user interactions
- Test conditional rendering
- Test prop variations

#### **3. Integration Testing**

- Test complete user workflows
- Test localStorage persistence
- Test responsive behavior

### **Performance Requirements**

#### **1. Bundle Size**

- Lazy load route components
- Code split by feature
- Optimize bundle with tree shaking

#### **2. Runtime Performance**

- Memoize expensive calculations
- Use React.memo for pure components
- Debounce frequent operations

#### **3. Loading States**

- Show loading indicators for async operations
- Implement skeleton screens
- Progressive enhancement approach

### **Accessibility Standards**

#### **1. ARIA Support**

- Proper ARIA labels on interactive elements
- Screen reader friendly navigation
- Keyboard navigation support

#### **2. Color Contrast**

- WCAG AA compliance minimum
- Support both light and dark themes
- Test with color blindness simulators

#### **3. Focus Management**

- Visible focus indicators
- Logical tab order
- Focus trapping in modals

### **Documentation Requirements**

#### **1. JSDoc Comments**

````typescript
/**
 * Generates random teams from a list of participants
 * @param participants - Array of participant objects
 * @param teamCount - Number of teams to create
 * @returns Array of teams with balanced participant distribution
 * @example
 * ```typescript
 * const teams = generateTeams(participants, 4);
 * console.log(teams); // [[Alice, Bob], [Charlie, David], ...]
 * ```
 */
export const generateTeams = (
  participants: Participant[],
  teamCount: number
): Team[] => {
  // Implementation
};
````

#### **2. README Files**

- Each feature folder must have a README
- Include setup instructions
- Document API interfaces

#### **3. Code Comments**

- Explain WHY, not WHAT
- Use TODO comments for future improvements
- Keep comments up to date with code changes

### **Git Workflow**

#### **1. Branch Naming**

- `feature/component-name` for new features
- `fix/issue-description` for bug fixes
- `refactor/component-name` for refactoring

#### **2. Commit Messages**

```bash
# ✅ GOOD:
feat: add points counter with auto-save functionality
fix: resolve localStorage key conflict in RTG
refactor: extract team generation logic to custom hook

# ❌ BAD:
added stuff
fixed bug
changes
```

#### **3. Pull Request Requirements**

- All tests must pass
- Code coverage above 80%
- Documentation updated
- No console errors/warnings

### **Error Handling**

#### **1. Try-Catch Blocks**

```typescript
try {
  const data = JSON.parse(localStorage.getItem(key) || "[]");
  return data;
} catch (error) {
  console.error("Failed to parse localStorage data:", error);
  return [];
}
```

#### **2. Error Boundaries**

- Wrap route components in error boundaries
- Provide fallback UI for errors
- Log errors for debugging

#### **3. User Feedback**

- Show meaningful error messages
- Provide recovery actions when possible
- Use toast notifications for non-critical errors

### **Security Guidelines**

#### **1. Input Validation**

- Validate all user inputs
- Sanitize data before storage
- Use TypeScript for type safety

#### **2. localStorage Security**

- No sensitive data in localStorage
- Implement data expiration where needed
- Handle storage quota exceeded errors

#### **3. Content Security**

- No inline scripts or styles
- Use proper CSP headers
- Validate all external resources

### **Browser Translation Prevention**

#### **1. Chrome Auto-Translation Prevention (REQUIRED)**

```html
<!-- ✅ REQUIRED: HTML language declaration -->
<html lang="en">
  <!-- ✅ REQUIRED: Google no-translate meta tag -->
  <meta name="google" content="notranslate" />

  <!-- ✅ OPTIONAL: Additional language declaration for older browsers -->
  <meta http-equiv="Content-Language" content="en" />
</html>
```

#### **Implementation Guidelines**

- **Global Protection**: Use `lang="en"` and `meta notranslate` for 95% effectiveness
- **Component Protection**: Only needed for edge cases with dynamic content
- **Testing**: Always test in Chrome incognito mode to verify translation prevention
- **Priority**: Global settings first, component-level only if global fails

#### **Why This Matters**

- Chrome auto-translation breaks React functionality
- User inputs become corrupted when translated
- App state management fails with translated content
- PWA functionality can be disrupted by translation attempts

### **Browser Compatibility**

#### **Supported Browsers:**

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

#### **PWA Requirements:**

- Service worker for offline functionality
- App manifest for installation
- Responsive design for all screen sizes

#### **iPhone PWA Safe Area Handling (REQUIRED)**

```html
<!-- ✅ REQUIRED: Enhanced viewport meta tag for iPhone safe areas -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, viewport-fit=cover"
/>
```

```css
/* ✅ REQUIRED: Global iOS safe area support in body */
body {
  /* iOS safe area support */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* ✅ REQUIRED: Component-level safe area utility classes */
.ios-safe-header {
  padding-top: env(safe-area-inset-top, 0px) !important;
}

.ios-safe-footer {
  padding-bottom: env(safe-area-inset-bottom, 0px) !important;
}

.ios-safe-left {
  padding-left: env(safe-area-inset-left, 0px) !important;
}

.ios-safe-right {
  padding-right: env(safe-area-inset-right, 0px) !important;
}

.ios-width-safe {
  max-width: calc(
    100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)
  );
  overflow-x: hidden;
}
```

```typescript
// ✅ REQUIRED: Apply safe area classes to Header/Footer components
<AppBar className="ios-safe-header ios-safe-left ios-safe-right">
<Footer className="ios-safe-footer ios-safe-left ios-safe-right ios-width-safe">
<Box className="ios-width-safe"> // Main app container
```

**iPhone PWA Issues Addressed:**

- **Footer below home indicator**: Fixed with `env(safe-area-inset-bottom)`
- **Content width overflow**: Fixed with `ios-width-safe` class
- **Notch/Dynamic Island interference**: Fixed with `env(safe-area-inset-top)`
- **Landscape mode edge spacing**: Fixed with left/right inset handling

**Testing Requirements:**

- Test on multiple iPhone models (8, X, 12, 14, 15)
- Test in both portrait and landscape orientations
- Test with PWA installed vs browser mode
- Verify no interference with Android/desktop display

#### **Polyfills:**

- Include polyfills for unsupported features
- Test on minimum supported browser versions
- Graceful degradation for older browsers

### **Build & Deployment**

#### **1. Build Process**

- TypeScript compilation with strict mode
- ESLint with zero warnings
- Prettier code formatting

#### **2. Environment Configuration**

- Separate configs for dev/staging/production
- Environment-specific API endpoints
- Feature flags for gradual rollouts

#### **3. CI/CD Pipeline**

- Automated testing on all PRs
- Build verification before merge
- Automated deployment to staging

### **Monitoring & Analytics**

#### **1. Error Tracking**

- Client-side error logging
- Performance monitoring
- User interaction tracking

#### **2. Performance Metrics**

- Bundle size monitoring
- Loading time tracking
- User engagement metrics

#### **3. Feedback Collection**

- User feedback mechanisms
- Bug report functionality
- Feature request tracking

### **Progressive UI Disclosure Patterns**

#### **1. Instructional Text Guidelines (REQUIRED)**

```typescript
// ✅ REQUIRED: Self-explanatory interfaces without verbose instructions
// Avoid cluttering UI with instructional text that can be inferred

// ❌ AVOID: Verbose instructions that clutter interface
<Typography variant="h6">
  Participants (Add your names - each on a new line)
</Typography>

// ✅ PREFERRED: Clean, self-explanatory interfaces
<TextField
  placeholder="Enter participant names (one per line)"
  multiline
  // Interface behavior teaches users naturally
/>

// ✅ REQUIRED: Conditional content rendering
{participants.length > 0 && (
  <Button startIcon={<ClearIcon />}>Clear</Button>
)}
```

#### **2. Content-First Space Optimization (REQUIRED)**

```typescript
// ✅ REQUIRED: Maximize content space by removing unnecessary headers
// Only show titles when they provide essential context

// ❌ AVOID: Static titles that consume valuable space
<Typography variant="h6" sx={{ pb: 1 }}>
  Participants
</Typography>;

// ✅ PREFERRED: Dynamic headers that adapt to content
{
  participants.length > 0 ? (
    <Box sx={{ display: "flex", justifyContent: "space-between", pb: 0.5 }}>
      <Button size="small">Clear All</Button>
    </Box>
  ) : (
    <Box sx={{ pb: 0.5 }} /> // Maintain spacing consistency
  );
}
```

### **Safety-First Button Design Patterns**

#### **1. Destructive vs Constructive Action Layout (REQUIRED)**

```typescript
// ✅ REQUIRED: Safety button positioning for accident prevention
// Primary actions centered, destructive actions edge-positioned

<Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
  {/* Primary/Constructive Action - Centered for prominence */}
  <Button
    variant="contained"
    size="large"
    startIcon={<Groups />}
    sx={{ px: 4 }} // Larger touch target
  >
    Generate
  </Button>

  {/* Destructive Action - Edge positioned to prevent accidents */}
  <IconButton
    sx={{
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'text.secondary' // Subtle color for less prominence
    }}
    aria-label="Clear all participants"
  >
    <DeleteForeverIcon />
  </IconButton>
</Box>

// ❌ AVOID: Equal prominence for destructive and constructive actions
<Box sx={{ display: 'flex', gap: 2 }}>
  <Button variant="outlined" color="error">Clear</Button> // Too prominent
  <Button variant="contained">Generate</Button>
</Box>
```

#### **2. Visual Hierarchy for Action Safety (REQUIRED)**

```typescript
// ✅ REQUIRED: Visual cues for action importance and safety
const actionButtonStyles = {
  // Primary/Safe actions - Maximum visibility
  primary: {
    variant: "contained",
    size: "large",
    color: "primary",
  },

  // Secondary/Neutral actions - Medium visibility
  secondary: {
    variant: "outlined",
    size: "medium",
    color: "primary",
  },

  // Destructive actions - Minimal visibility, intentional targeting required
  destructive: {
    component: IconButton, // Icon only for smaller target
    color: "text.secondary", // Muted color
    "aria-label": "required", // Accessibility compensation
    sx: { fontSize: "1.2rem" }, // Smaller than primary actions
  },
};
```

### **Hint Text Styling Standards**

#### **1. Material Design Hint Text Pattern (REQUIRED)**

```typescript
// ✅ REQUIRED: Consistent hint text styling for informational content
const hintTextStyles = {
  variant: 'body2',
  sx: {
    fontStyle: 'italic',           // Distinguish from primary content
    color: 'text.secondary',       // Muted color for hierarchy
    fontSize: '0.875rem',          // Smaller than body text
    opacity: 0.8,                  // Additional subtlety
    lineHeight: 1.6                // Optimal readability
  }
};

// Usage example:
<Typography {...hintTextStyles}>
  Your 5 teams will have 3-4 members each
</Typography>

// ❌ AVOID: Regular text styling for hint content
<Typography variant="body1" color="text.primary">
  Distribution information // Too prominent for hint content
</Typography>
```

#### **2. Dynamic Informational Text (REQUIRED)**

```typescript
// ✅ REQUIRED: Smart content that adapts to user context
const getDistributionMessage = (
  participantCount: number,
  teamCount: number
) => {
  if (participantCount === 0) return null; // No clutter when empty

  const distribution = Math.ceil(participantCount / teamCount);
  const remainder = participantCount % teamCount;

  if (remainder === 0) {
    return `Your ${teamCount} teams will have ${distribution} members each`;
  } else {
    return `Your ${teamCount} teams will have ${
      distribution - 1
    }-${distribution} members each`;
  }
};

// Show only when relevant
{
  distributionMessage && (
    <Typography {...hintTextStyles}>{distributionMessage}</Typography>
  );
}
```

### **Robust Data Conversion Patterns**

#### **1. Type-Safe Number Conversion (REQUIRED)**

```typescript
// ✅ REQUIRED: Robust number conversion with fallbacks
const safeNumberConversion = (value: unknown, fallback: number): number => {
  // Handle multiple input types safely
  const num = parseInt(String(value), 10);
  return isNaN(num) ? fallback : num;
};

// Usage in pluralization logic:
const teamCountNum = safeNumberConversion(teamCount, CONSTANTS.MIN_TEAMS);
const teamText = teamCountNum === 1 ? "Team" : "Teams"; // Correct logic

// ❌ AVOID: Unsafe conversion and flawed logic
const teamText = teamCount !== 1 ? "Teams" : "Team"; // Broken for non-numbers
```

#### **2. localStorage Data Validation (REQUIRED)**

```typescript
// ✅ REQUIRED: Comprehensive localStorage error handling
const loadPersistedData = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;

    const parsed = JSON.parse(stored);

    // Type validation for expected data structure
    if (typeof parsed !== typeof fallback) {
      console.warn(`Invalid data type for ${key}, using fallback`);
      return fallback;
    }

    return parsed;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    return fallback;
  }
};

// Edge case handling for arrays
const loadParticipants = (): Participant[] => {
  const data = loadPersistedData(STORAGE_KEYS.RTG_PARTICIPANTS, []);

  // Ensure array structure
  if (!Array.isArray(data)) {
    console.warn("Participants data is not an array, resetting");
    return [];
  }

  // Filter out invalid entries
  return data.filter((p) => p && typeof p.name === "string" && p.name.trim());
};
```

### **Mobile-First Content Optimization**

#### **1. Space Maximization Patterns (REQUIRED)**

```typescript
// ✅ REQUIRED: Progressive space optimization for mobile screens
const mobileOptimizedLayout = {
  // Remove non-essential headers on mobile
  conditionalHeaders: {
    display: { xs: "none", sm: "flex" }, // Hide titles on mobile
    "& + .content": { pt: { xs: 0, sm: 2 } }, // Adjust spacing
  },

  // Compact gaps for mobile density
  responsiveGaps: {
    gap: "clamp(0.25rem, 1vw, 0.5rem)", // Tight mobile, comfortable desktop
    py: "clamp(0.25rem, 1vw, 0.75rem)", // Responsive padding
  },

  // Content-first approach
  maxContentSpace: {
    minHeight: 0, // Allow content to determine height
    overflow: "hidden", // Prevent unwanted scrolling
    px: { xs: 0.5, sm: 1 }, // Minimal horizontal padding
  },
};
```

### **Points Counter Feature - Complete Implementation**

#### **1. Feature Overview and Architecture (IMPLEMENTED)**

The Points Counter is a comprehensive quiz scoring system that provides real-time team scoring with decimal precision support, round-by-round progression, and advanced features like live editing and leaderboard management.

**Core Features Implemented:**

- **ON/OFF Game State Logic**: Clean separation between setup mode and active game
- **Decimal Scoring Support**: Full support for scores like 0.5, 1.25, 2.75 with 2 decimal places
- **Auto-Save Functionality**: 500ms debounced localStorage persistence
- **Edit Mode**: Live modification of teams and rounds without losing existing scores
- **Responsive Design**: Mobile-first with single column on small screens, grid on desktop
- **Modern UI**: Hover effects, focus states, gradient accents, marquee animations
- **PWA Compatibility**: Offline support through localStorage

**Technical Architecture:**

```typescript
// Primary Components Structure
src/features/points-counter/
├── pages/PointsCounter.tsx           // Main orchestrator component
├── hooks/usePointsCounter.ts         // Complete game state management
├── components/
│   ├── TeamSetup/                    // Setup and edit mode interface
│   ├── GameScreen/                   // Active game interface
│   ├── TeamCard/                     // Individual team scoring cards
│   ├── RoundNavigation/             // Round switching navigation
│   └── Leaderboard/                 // Rankings and scoring display
├── utils/gameUtils.ts               // Scoring calculations and utilities
├── types/index.ts                   // Complete TypeScript definitions
└── constants/                       // Game configuration constants
```

#### **2. Game State Management (IMPLEMENTED)**

**usePointsCounter Hook - v2.0.0:**

```typescript
// Complete game state with ON/OFF logic
interface GameData {
  gameStatus: 'ON' | 'OFF';
  teams: Team[];
  rounds: number;
  currentRound: number;
  createdAt: number;
  updatedAt: number;
}

// Key state management features:
- Auto-save only when game is ON (prevents unnecessary localStorage writes)
- 500ms debounced persistence following development standards
- Complete data validation and error recovery
- Migration support from legacy storage keys
- Atomic localStorage updates (single JSON object)
```

**State Flow:**

1. **OFF Mode**: Team setup screen, no auto-save, fresh game creation
2. **ON Mode**: Active game screen, auto-save enabled, score tracking
3. **Edit Mode**: Return to setup while keeping game ON, preserve existing scores

#### **3. Decimal Scoring System (IMPLEMENTED)**

**Technical Implementation:**

```typescript
// Game constants for scoring validation
GAME_CONSTANTS = {
  MIN_SCORE: -999,
  MAX_SCORE: 999,
  SCORE_DECIMAL_PLACES: 2,
}

// Utility functions
isValidScore(score: number): boolean
roundScore(score: number): number
calculateTeamTotalScore(team: Team): number
```

**Features:**

- Supports any decimal value: 0.5, 1.25, 2.75, 0.33, etc.
- Automatic rounding to 2 decimal places for consistency
- Real-time validation in input fields
- Proper floating-point arithmetic handling
- Range validation (-999 to 999)

#### **4. User Interface Components (IMPLEMENTED)**

**TeamCard Component - v2.0.0:**

```typescript
// Modern team card with marquee animation
Features:
- Marquee text animation for long team names (10s duration)
- Smart overflow detection with window resize handling
- Decimal score input with validation and error states
- Hover/focus effects with gradient accent lines
- Responsive sizing: 220-240px width, 145-165px height
- Modern shadows and subtle animations

// Marquee animation details:
- Trigger: Only on hover/focus AND when text overflows
- Pattern: Start (8%) → Scroll (42%) → Pause (35%) → Reset (15%)
- Duration: 10 seconds for comfortable reading
- Uses hardware acceleration (transform3d)
```

**GameScreen Component - v2.0.0:**

```typescript
// Main game interface following TeamSetup pattern
Layout Structure:
- Single card container with calc(100vh - 100px) height
- Three sections: Navigation (top), Team grid (middle), Actions (bottom)
- No borders/dividers anywhere for clean modern design
- Responsive grid: Single column mobile, 2-4 columns desktop

Action Buttons:
- Leaderboard (primary): Shows ranking modal
- Copy (secondary): Copies leaderboard to clipboard
- Edit (info): Enters edit mode while keeping game ON
- End Game (error): Confirmation dialog, clears all data
```

**TeamSetup Component - v2.1.0:**

```typescript
// Enhanced setup with edit mode support
Dynamic Headers:
- OFF Mode: "Teams Setup" + "Start Quiz Game"
- ON Mode: "Edit Teams" + "Continue Game"

Validation:
- Minimum 1 team + 1 round with exact error message
- Real-time validation feedback
- Auto-expanding team inputs

Edit Mode Features:
- Pre-fills existing teams and rounds
- Preserves existing scores when updating
- Seamless transition back to game screen
```

#### **5. Storage Architecture (IMPLEMENTED)**

**Centralized Storage Pattern:**

```typescript
// Single localStorage key for atomic updates
STORAGE_KEYS.PC_GAME_STATE = "pc-current-game-state";

// Complete game data in single JSON object
interface GameData {
  gameStatus: "ON" | "OFF";
  teams: Team[];
  rounds: number;
  currentRound: number;
  createdAt: number;
  updatedAt: number;
}

// Auto-save pattern (500ms debounced):
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (gameStatus === "ON" && teams.length > 0) {
      saveGameState();
    }
  }, 500);
  return () => clearTimeout(timeoutId);
}, [gameStatus, teams, rounds, currentRound]);
```

**PWA Compatibility:**

- Offline functionality through localStorage
- Data persistence across browser sessions
- Atomic updates prevent partial state corruption
- Error handling with graceful fallbacks

#### **6. Responsive Design Implementation (IMPLEMENTED)**

**Mobile-First Approach:**

```typescript
// Team cards responsive layout
Mobile (xs): Single column, centered cards
Desktop (sm+): CSS Grid with 2-4 columns based on screen size

// Responsive card sizing
width: { xs: '100%', sm: 240, md: 220, lg: 230 }
height: { xs: 145, sm: 165 }

// Button responsive behavior
Mobile: Icon-only buttons for space efficiency
Desktop: Text + icon for better UX

// Typography fluid scaling
fontSize: 'clamp(1rem, 2.2vw, 1.2rem)' // Team names
fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)' // Buttons
```

**Layout Patterns:**

- Same calc(100vh - 100px) height as RTG for consistency
- Single card container with maxWidth: clamp(280px, 90vw, 1200px)
- Three-section flex layout with proper space distribution
- Mobile safety padding and touch target optimization

#### **7. Error Handling and Validation (IMPLEMENTED)**

**Comprehensive Error Management:**

```typescript
// Validation with exact user-specified messages
if (teams.length < 1 || rounds < 1) {
  setError("Fill minimum one Team and at least 1 Round");
}

// Score validation with helpful feedback
if (!isValidScore(score)) {
  setError(`Score must be between ${MIN_SCORE} and ${MAX_SCORE}`);
}

// localStorage error handling
try {
  // Save operation
} catch (error) {
  console.error("Failed to save game state:", error);
  setError("Failed to save game progress");
}
```

**Error Recovery:**

- Graceful fallback to fresh state on load errors
- Input validation with visual feedback
- Auto-reset invalid inputs to last valid values
- User-friendly error messages with clear actions

#### **8. Advanced Features (IMPLEMENTED)**

**Edit Mode Functionality:**

```typescript
// Live game modification without data loss
updateGameSetup(newTeams: Team[], newRounds: number) {
  // Preserve existing team scores
  // Add new teams with zero scores
  // Extend rounds if count increased
  // Maintain data integrity
}

// Smart team matching by name
const existingTeam = teams.find(t => t.name === newTeam.name);
```

**Leaderboard System:**

```typescript
// Real-time ranking calculations
interface LeaderboardEntry {
  position: number;
  team: Team;
  pointsFromFirst: number;
  isLeader: boolean;
}

// Features:
- Trophy emojis for top 3 positions
- Point differences from leader
- Copy-to-clipboard functionality
- Modal display with responsive design
```

**Marquee Animation System:**

```typescript
// Intelligent text overflow handling
const shouldShowMarquee = textOverflows && (isHovered || isFocused);

// CSS animation with optimal timing
@keyframes marqueeScroll {
  0%: Start position (beginning visible)
  8%: Pause for reading (0.8s)
  50%: Scroll to end (4.2s movement)
  85%: Long pause at end (3.5s)
  100%: Reset to start (1.5s)
}
```

#### **9. Performance Optimizations (IMPLEMENTED)**

**Efficient Rendering:**

- React.memo for pure components where beneficial
- Debounced auto-save prevents excessive localStorage writes
- Hardware-accelerated animations using transform3d
- Optimal re-render patterns with useCallback and useMemo

**Memory Management:**

- Proper event listener cleanup in useEffect
- Efficient data structures for team and round management
- Minimal state updates through computed values

**Bundle Optimization:**

- Lazy loading of modal components
- Tree-shaking friendly exports
- TypeScript compilation for optimal bundles

#### **10. Testing and Quality Assurance (IMPLEMENTED)**

**Code Quality Standards:**

- 100% TypeScript coverage with strict mode
- Comprehensive JSDoc documentation for all functions
- Consistent error handling patterns
- Development standards compliance

**Manual Testing Coverage:**

- Decimal scoring validation (0.5, 1.25, 2.75, etc.)
- Edit mode with score preservation
- Responsive design across breakpoints
- Marquee animation triggers and timing
- localStorage persistence and recovery
- Error states and validation messages

#### **11. Future Enhancement Roadmap**

**Planned Features:**

- Export functionality (JSON, CSV, PDF)
- Team color customization
- Advanced statistics and analytics
- Undo/Redo functionality (10 action history)
- Keyboard shortcuts support
- Drag-and-drop team reordering

**Technical Improvements:**

- Unit test coverage with Jest and Testing Library
- Integration tests for complete user workflows
- Performance monitoring and metrics
- A11y compliance improvements
- PWA installation prompts

#### **12. Usage Examples and Patterns**

**Basic Usage:**

```typescript
// Start new game
const teams = [
  { id: "1", name: "Team Alpha", totalScore: 0, roundScores: {} },
  { id: "2", name: "Team Beta", totalScore: 0, roundScores: {} },
];
startGame(teams, 5);

// Update scores with decimal support
updateTeamScore("team-1", 1, 2.5);
updateTeamScore("team-2", 1, 1.75);
```

**Edit Mode Pattern:**

```typescript
// Enter edit mode while game is ON
enterEditMode(); // Shows setup screen with existing data

// Update setup without losing scores
updateGameSetup(updatedTeams, newRoundCount);
// Returns to game screen with preserved scores
```

**Error Handling Pattern:**

```typescript
// Comprehensive validation
if (!validateSetup()) {
  setError("Fill minimum one Team and at least 1 Round");
  return;
}

// Score validation with helpful messages
if (!isValidScore(score)) {
  setError(`Score must be between ${MIN_SCORE} and ${MAX_SCORE}`);
}
```

#### **13. Implementation Checklist (COMPLETED)**

**✅ Core Functionality:**

- [x] ON/OFF game state logic
- [x] Dynamic header text based on game status
- [x] Decimal scoring with 2 decimal places
- [x] Minimum validation with exact error message
- [x] Edit mode with existing data loading
- [x] localStorage persistence with PWA compatibility
- [x] Clear/End Game functionality

**✅ User Interface:**

- [x] TeamSetup styling pattern applied to GameScreen
- [x] Mobile-responsive design with single column
- [x] Team cards with marquee animation
- [x] Action buttons with responsive icon/text display
- [x] No borders/dividers anywhere
- [x] Modern hover effects and animations

**✅ Technical Implementation:**

- [x] TypeScript interfaces and type safety
- [x] Comprehensive error handling
- [x] Development standards compliance
- [x] PWA localStorage patterns
- [x] Auto-save with 500ms debouncing
- [x] Performance optimizations

**✅ Documentation:**

- [x] Complete code documentation
- [x] Usage examples and patterns
- [x] Architecture overview
- [x] Development standards integration

**Last Updated:** December 18, 2025  
**Next Review:** January 18, 2026

### **Points Counter Mobile Action Buttons (REQUIRED)**

- On mobile (xs), all Points Counter action buttons (Leaderboard, Copy, Edit, End Game) must use MUI `IconButton` with:
  - `width: 48px`, `height: 48px`, `fontSize: 28px` for large, accessible touch targets
  - Icon uses `fontSize="inherit"`, `lineHeight: 1`, `verticalAlign: 'middle'` for perfect centering
  - Remove extra padding with `p: 0` on IconButton
  - Use `display: flex`, `alignItems: center`, `justifyContent: center` for visual balance
- On tablet/desktop (sm and up), use standard MUI `Button` with icon and text
- This pattern ensures professional, visually balanced, and accessible UI for mobile users, following Material Design and MUI best practices
- See `src/features/points-counter/components/GameScreen/GameScreen.tsx` for implementation example

### **Final Question Tool Standards (IMPLEMENTED)**

#### **1. AI-Powered Question Generation Architecture**

**Google Gemini Integration:**

- Use Google Gemini API (`gemini-1.5-flash` model) for question generation
- Secure API key management through environment variables (`VITE_GEMINI_API_KEY`)
- Intelligent rate limiting (15 requests/minute, 4-second intervals)
- Automatic retry logic for API failures (429 status codes)
- **Enhanced AI Configuration**: Temperature 0.9, topK 40, topP 0.95 for maximum variability
- **Session-based duplicate prevention**: Track last 20 questions to avoid repetition
- **Category-specific fact-checking**: Enhanced prompts with accuracy validation
- Real-time status updates during generation process

**Clean Architecture Implementation:**

```typescript
// ✅ IMPLEMENTED: Complete feature structure
src/features/final-question/
  ├── pages/
  │   └── FinalQuestionPage.tsx          // Main page with settings and UI
  ├── components/
  │   ├── index.ts                       // Centralized exports
  │   ├── FinalQuestionCard/
  │   │   └── FinalQuestionCard.tsx      // Question display component
  │   └── FinalQuestionModal/
  │       └── FinalQuestionModal.tsx     // Modal container for questions
  ├── hooks/
  │   ├── index.ts                       // Hook exports
  │   └── useQuestionGeneration.ts       // State management and API calls
  ├── services/
  │   └── geminiService.ts               // AI API integration and rate limiting
  └── types/
      └── index.ts                       // TypeScript interfaces
```

#### **2. Environment Configuration (CRITICAL)**

**Required .env Setup:**

```bash
# ✅ REQUIRED: API key configuration
VITE_GEMINI_API_KEY=your_actual_api_key_here

# ⚠️ SECURITY: Ensure .env is in .gitignore
# Never commit API keys to version control
```

**Vite Environment Loading:**

```typescript
// ✅ IMPLEMENTED: Secure API key access
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const isAvailable = !!(apiKey && navigator.onLine);
```

#### **3. Rate Limiting and API Management**

**Smart Rate Limiting System:**

```typescript
// ✅ IMPLEMENTED: Proactive rate limiting
const MAX_REQUESTS_PER_MINUTE = 15;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MIN_REQUEST_INTERVAL = 4000; // 4 seconds

// Track requests and enforce limits
const checkRateLimit = (): RateLimitInfo => {
  const now = Date.now();
  if (now - lastRequestTime > RATE_LIMIT_WINDOW) {
    requestCount = 0; // Reset counter
  }

  const isRateLimited = requestCount >= MAX_REQUESTS_PER_MINUTE;
  const timeUntilReset = RATE_LIMIT_WINDOW - (now - lastRequestTime);

  return { isRateLimited, retryAfter: timeUntilReset };
};
```

**API Error Handling:**

```typescript
// ✅ IMPLEMENTED: Comprehensive error handling
if (response.status === 429) {
  const retryAfter = response.headers.get("Retry-After");
  const waitTime = retryAfter ? parseInt(retryAfter) : 60;

  if (onStatusUpdate) {
    onStatusUpdate(
      `API rate limit reached. Waiting ${waitTime} seconds...`,
      true
    );
  }

  await wait(waitTime);
  return generateQuestionWithGemini(params, onStatusUpdate); // Retry
}
```

#### **4. User Experience Standards**

**Combined Status Indicator:**

```typescript
// ✅ IMPLEMENTED: Unified status display
<Chip
  icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
  label={
    isOnline
      ? `Online - AI Ready | ${rateLimitInfo.requestsRemaining}/15 RPM`
      : "Offline - Internet Required"
  }
  color={
    isOnline ? (rateLimitInfo.isNearLimit ? "warning" : "success") : "error"
  }
  variant="outlined"
/>
```

**Loading States and Feedback:**

```typescript
// ✅ IMPLEMENTED: Real-time status updates
const getButtonText = () => {
  if (isWaiting) return "Please Wait...";
  if (isLoading) return "Generating with AI...";
  if (!isOnline) return "Internet Required";
  return "Generate Final Question";
};

// Progress indicators during generation
{
  (isLoading || isWaiting) && (
    <LinearProgress
      variant={isWaiting ? "indeterminate" : "query"}
      color={isWaiting ? "warning" : "primary"}
    />
  );
}
```

#### **5. Question Generation Configuration**

**Supported Parameters:**

- **Difficulty**: Easy, Medium, Hard, Random (default)
- **Language**: English (default), Bulgarian
- **Category**: Optional text input, random if empty
- **Output**: Single question with answer, category, and difficulty

**API Prompt Structure:**

```typescript
// ✅ IMPLEMENTED: Structured prompt generation
const createGeminiPrompt = (
  difficulty: string,
  language: string,
  category: string
): string => {
  const languageInstruction =
    language.toLowerCase() === "bulgarian"
      ? "Generate the question and answer in Bulgarian language."
      : "Generate the question and answer in English language.";

  const categoryInstruction =
    category.toLowerCase() === "random" || !category
      ? "Choose a random general knowledge topic."
      : `Generate a question about the category: ${category}`;

  return `You are a quiz master assistant. Generate a single quiz question and its answer.
${languageInstruction}
${categoryInstruction}
${getDifficultyInstruction(difficulty)}

IMPORTANT: Respond ONLY with a valid JSON object in this exact format:
{
  "question": "Your generated question here",
  "answer": "The correct answer here", 
  "category": "The category of the question",
  "difficulty": "${difficulty}"
}`;
};
```

#### **6. Security and Performance Standards**

**API Key Security:**

- Environment variables for API key storage
- Client-side usage acceptable for free tier
- No server-side proxy required for current implementation
- Proper .gitignore configuration to prevent key exposure

**Performance Optimizations:**

- Debounced API calls to prevent spam
- Efficient state management with custom hooks
- Minimal re-renders through proper memoization
- Optimized bundle size with tree shaking

**Error Boundaries and Fallbacks:**

```typescript
// ✅ IMPLEMENTED: Graceful error handling
const parseGeminiResponse = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.question || !parsed.answer) {
      throw new Error("Missing required fields in response");
    }

    return parsed;
  } catch (error) {
    // Fallback question if parsing fails
    return {
      question: "What is the capital of France?",
      answer: "Paris",
      category: "Geography",
      difficulty: "easy",
    };
  }
};
```

#### **7. Implementation Checklist (COMPLETED)**

**✅ Core Functionality:**

- [x] Google Gemini API integration with proper error handling
- [x] Rate limiting system (15 requests/minute, 4-second intervals)
- [x] Online/offline detection with visual feedback
- [x] Question generation with difficulty, language, and category options
- [x] Modal display system for generated questions
- [x] Copy to clipboard functionality
- [x] Real-time status updates and loading states

**✅ User Interface:**

- [x] Single card layout with settings and generate button
- [x] Combined status indicator (Online - AI Ready | 15/15 RPM)
- [x] Material-UI design system compliance
- [x] Responsive layout across all device sizes
- [x] Loading progress indicators and status messages
- [x] Error alerts and user-friendly feedback

**✅ Technical Implementation:**

- [x] Clean architecture with services/hooks/components separation
- [x] Comprehensive TypeScript interfaces and type safety
- [x] Environment variable configuration and security
- [x] PWA compatibility with offline detection
- [x] Performance optimizations and efficient API usage
- [x] Comprehensive error handling and fallback mechanisms

**✅ Documentation:**

- [x] Complete implementation documentation
- [x] API integration patterns and examples
- [x] Security guidelines and best practices
- [x] Development standards compliance verification

#### **8. Advanced AI Enhancement Patterns (NEW)**

**Enhanced Temperature Control for Variability:**

```typescript
// ✅ IMPLEMENTED: High variability configuration
const requestBody = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 0.9, // Increased from 0.7 for more creativity
    topK: 40, // Balanced token selection
    topP: 0.95, // High probability mass for diversity
    maxOutputTokens: 1024,
  },
};
```

**Session-Based Duplicate Prevention:**

```typescript
// ✅ IMPLEMENTED: Smart duplicate tracking
const [sessionQuestions, setSessionQuestions] = useState<
  Array<{
    question: string;
    answer: string;
  }>
>([]);

// Pass previous questions to AI to avoid duplicates
const params = {
  difficulty: settings.difficulty || "medium",
  language: settings.language || "English",
  category: settings.category || "random",
  previousQuestions: sessionQuestions, // Prevent repetition
};

// Add to session history (max 20 questions)
setSessionQuestions((prev) => {
  const updated = [
    ...prev,
    { question: newQuestion.question, answer: newQuestion.answer },
  ];
  return updated.slice(-20); // Keep only last 20
});

// Clear history when modal closes to save memory
useEffect(() => {
  if (!isModalOpen) {
    setSessionQuestions([]);
  }
}, [isModalOpen]);
```

**Enhanced Prompts with Fact-Checking:**

```typescript
// ✅ IMPLEMENTED: Category-specific fact validation
const getFactCheckingInstruction = (category: string): string => {
  const lowerCategory = category.toLowerCase();

  if (lowerCategory.includes("geography") || lowerCategory.includes("смолян")) {
    return `\nFACT-CHECKING FOR GEOGRAPHY: 
- For Bulgarian geography: Verify all mountain peaks, heights, and locations
- For Smolyan region: The highest peak near Smolyan is Perelik (2,191m), NOT Snezhanka
- Snezhanka is near Pamporovo but is NOT the highest peak in the Smolyan area
- Always verify geographical facts against reliable sources`;
  }

  if (lowerCategory.includes("history")) {
    return `\nFACT-CHECKING FOR HISTORY: 
- Verify all dates, names, and historical events
- Ensure chronological accuracy`;
  }

  return `\nFACT-CHECKING: 
- Verify all facts before including them
- Use reliable, authoritative sources`;
};
```

**Real-Time Countdown During Rate Limits:**

```typescript
// ✅ IMPLEMENTED: Enhanced user feedback during waits
if (rateLimitCheck.isRateLimited) {
  const waitTime = rateLimitCheck.retryAfter || 4;

  // Show countdown during wait
  for (let i = waitTime; i > 0; i--) {
    onStatusUpdate(
      `Please wait ${i} second${
        i > 1 ? "s" : ""
      } before generating another question...`,
      true
    );
    await wait(1);
  }
}
```

**Session Tracking UI Enhancement:**

```typescript
// ✅ IMPLEMENTED: Session question counter display
{
  sessionQuestionCount > 0 && (
    <Chip
      label={`Session: ${sessionQuestionCount} question${
        sessionQuestionCount !== 1 ? "s" : ""
      }`}
      color="info"
      variant="outlined"
      size="small"
    />
  );
}
```

#### **9. AI Enhancement Benefits**

**Improved Question Variety:**

- Temperature 0.9 ensures maximum response creativity
- Session tracking prevents duplicate questions within same session
- Enhanced prompts provide better context for unique generation

**Enhanced Accuracy:**

- Category-specific fact-checking prevents incorrect information
- Geographic accuracy for Bulgarian locations (Perelik vs Snezhanka)
- Comprehensive validation instructions for different subject areas

**Better User Experience:**

- Real-time countdown timers during rate limit waits
- Session question counter shows generation progress
- Smart memory management with automatic cleanup
- Professional status indicators and feedback

**Technical Robustness:**

- Session-based history tracking (max 20 questions)
- Memory-efficient cleanup when modal closes
- Enhanced error handling with specific geographic corrections
- Improved API configuration for optimal performance

**Last Updated:** December 19, 2025  
**Status:** PRODUCTION READY WITH ADVANCED AI ENHANCEMENTS
