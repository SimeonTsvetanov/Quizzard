# 📘 **QUIZZARD DEVELOPMENT STANDARDS**

**Version:** 2.4  
**Last Updated:** December 20, 2025  
**Status:** PRODUCTION READY WITH COMPREHENSIVE DOCUMENTATION STANDARDS

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

### **🎨 UI COMPONENT STANDARDS**

#### **1. Button Consistency & Responsive Design (REQUIRED)**

```typescript
// ✅ REQUIRED: Consistent button sizing with responsive behavior
<Button
  variant="outlined"
  color="error"
  onClick={onDeleteQuiz}
  startIcon={<DeleteIcon />}
  size="large"
  sx={{
    minWidth: { xs: "auto", sm: 150 }, // Mobile: auto-width, Desktop: fixed
    height: 48, // Consistent height across all devices
    borderColor: "error.main",
    color: "error.main",
    "&:hover": {
      borderColor: "error.dark",
      backgroundColor: "error.light",
      color: "error.dark",
    },
  }}
  aria-label="Delete quiz" // Accessibility compliance
>
  {/* Mobile: Icon only, Desktop: Icon + Text */}
  <Box sx={{ display: { xs: "none", sm: "inline" } }}>Delete Quiz</Box>
</Button>

<Button
  variant="contained"
  color="primary"
  onClick={onContinue}
  endIcon={<ArrowForwardIcon />}
  size="large"
  sx={{
    minWidth: { xs: "auto", sm: 150 }, // Consistent with other buttons
    height: 48, // Same height for visual consistency
    backgroundColor: "primary.main",
    "&:hover": {
      backgroundColor: "primary.dark",
    },
  }}
  aria-label="Continue to questions"
>
  {/* Mobile: Shortened text, Desktop: Full text */}
  <Box sx={{ display: { xs: "inline", sm: "none" } }}>Continue</Box>
  <Box sx={{ display: { xs: "none", sm: "inline" } }}>Continue to Questions</Box>
</Button>
```

#### **2. Mobile-First Button Text Strategy (REQUIRED)**

- **Desktop (sm+)**: Full descriptive text with icons
- **Mobile (xs)**: Shortened text or icon-only with proper ARIA labels
- **Consistent heights**: All buttons in the same row must use identical `height` values
- **Responsive minWidth**: Use `{ xs: "auto", sm: 150 }` pattern for flexible mobile sizing

#### **3. Professional Visual Hierarchy (REQUIRED)**

```typescript
// ✅ REQUIRED: Button groups with consistent spacing and alignment
<Box
  sx={{
    mt: 4,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 2, // Consistent spacing between buttons
  }}
>
  {/* Primary Action Button */}
  <Button
    variant="contained"
    color="primary"
    sx={{
      minWidth: { xs: "auto", sm: 150 },
      height: 48,
    }}
  >
    Primary Action
  </Button>

  {/* Secondary Action Button */}
  <Button
    variant="outlined"
    color="secondary"
    sx={{
      minWidth: { xs: "auto", sm: 150 },
      height: 48, // Same height as primary
    }}
  >
    Secondary Action
  </Button>
</Box>
```

#### **4. Accessibility Requirements (REQUIRED)**

- **ARIA Labels**: All icon-only buttons must have `aria-label` attributes
- **Keyboard Navigation**: Ensure proper tab order and focus management
- **Screen Reader Compatibility**: Use semantic button elements, not divs
- **Color Contrast**: Follow WCAG AA standards for text/background contrast
- **Touch Targets**: Minimum 44px height for mobile accessibility

#### **5. Button State Management (REQUIRED)**

```typescript
// ✅ REQUIRED: Proper disabled and loading states
<Button
  variant="contained"
  disabled={isLoading || !isValid}
  startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
  sx={{
    minWidth: { xs: "auto", sm: 150 },
    height: 48,
    opacity: isLoading || !isValid ? 0.6 : 1,
    "&.Mui-disabled": {
      backgroundColor: "action.disabledBackground",
      color: "action.disabled",
    },
  }}
>
  {isLoading ? "Saving..." : "Save Quiz"}
</Button>
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
  "start_url": "/quizzard/",
  "scope": "/quizzard/",
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
  const cleanPath = pathname.replace("/quizzard", "");

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
- **Production environment**: Strips base path from full paths (`/quizzard/quizzes`)
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

#### **1. JSDoc Comments (REQUIRED)**

All functions, components, interfaces, and modules MUST have comprehensive JSDoc documentation:

````typescript
/**
 * Component Header Documentation
 *
 * Brief description of the component's purpose and responsibilities.
 * Include specific details about what it manages and how it integrates
 * with other parts of the application.
 *
 * @fileoverview Brief file description and purpose
 * @version Version number for tracking changes
 * @since Date when component was created
 */

/**
 * Interface Documentation
 *
 * Detailed description of the interface purpose and usage context.
 * Explain when and how this interface should be used.
 */
export interface ComponentProps {
  /** Brief description of the prop and its purpose */
  title: string;
  /** Optional prop with default behavior explanation */
  isVisible?: boolean;
  /** Callback function with parameter and return value explanation */
  onAction: (data: string) => void;
}

/**
 * Function Documentation with comprehensive details
 *
 * Detailed explanation of what the function does, including:
 * - Prerequisites and validation performed
 * - Side effects or state changes
 * - Error conditions and how they're handled
 * - Integration with other systems (APIs, services, etc.)
 *
 * @param participants - Array of participant objects to organize into teams
 * @param teamCount - Number of teams to create (must be > 0)
 * @returns Array of teams with balanced participant distribution
 * @throws Error if teamCount is invalid or participants array is empty
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
  // Implementation with inline comments explaining complex logic
};

/**
 * Hook Documentation
 *
 * Comprehensive description of the hook's purpose, state management,
 * and integration patterns. Include all returned values and their purposes.
 *
 * @returns Object containing all state and control functions for the feature
 */
export const useFeatureLogic = (): FeatureHookReturn => {
  // Implementation
};
````

#### **2. File Headers (REQUIRED)**

Every TypeScript file must start with a comprehensive header:

```typescript
/**
 * Feature Name - Component/Service/Hook Description
 *
 * Detailed description of the file's purpose and responsibilities.
 * Include information about:
 * - Main functionality provided
 * - Integration with other features
 * - External dependencies (APIs, services)
 * - State management approach
 * - Special considerations or limitations
 *
 * @fileoverview Brief one-line description
 * @version 2.0.0
 * @since December 2025
 */
```

#### **3. Type Definitions (REQUIRED)**

All TypeScript interfaces and types must be thoroughly documented:

```typescript
/**
 * Core data structure description
 *
 * Explain the purpose of this interface and when it should be used.
 * Include information about required vs optional fields and their validation.
 */
export interface DataStructure {
  /** Unique identifier (generated automatically) */
  id: string;
  /** User-provided name with validation requirements */
  name: string;
  /** Optional metadata for additional context */
  metadata?: Record<string, unknown>;
}
```

#### **4. Inline Comments (REQUIRED)**

Use strategic inline comments for complex logic:

```typescript
// Validate prerequisites before processing
if (!isOnline) {
  setError("Internet connection required");
  return;
}

// Prepare parameters with session context to prevent duplicates
const params = {
  difficulty: settings.difficulty || "medium",
  previousQuestions: sessionQuestions, // Last 20 questions for duplicate prevention
};

// Handle rate limiting with real-time user feedback
if (rateLimitCheck.isRateLimited) {
  // Show countdown timer during wait period
  for (let i = waitTime; i > 0; i--) {
    onStatusUpdate(`Please wait ${i} seconds...`, true);
    await wait(1);
  }
}
```

#### **5. README Files (REQUIRED)**

Each feature folder must have a comprehensive README:

```markdown
# Feature Name

## Overview

Brief description of the feature and its purpose.

## Components

- **ComponentName**: Description and responsibility
- **HookName**: State management and logic

## Usage

Code examples showing how to integrate the feature.

## API Integration

Details about external services and rate limiting.

## State Management

Explanation of local state, persistence, and session handling.
```

#### **6. Production Code Standards**

- **No debug console.log**: Remove all development logging from production code
- **Professional comments**: All comments should be meaningful and helpful for new developers
- **Error handling**: Comprehensive error handling with user-friendly messages
- **Type safety**: Use proper TypeScript types throughout, no `any` types

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

### **Quiz Feature - Comprehensive Implementation (PHASE 1 COMPLETE)**

#### **1. Feature Overview and Architecture (IMPLEMENTED)**

The Quiz Feature is a comprehensive quiz creation and management system that provides a complete workflow from quiz creation through storage and management. Phase 1 implements the full creation/editing/management pipeline with IndexedDB storage and professional UX.

**Core Features Implemented:**

- **Two-Step Creation Wizard**: Streamlined basic info collection followed by rounds/questions management
- **IndexedDB Storage**: Complete database layer with auto-save, draft management, and storage monitoring
- **Professional Time Input System**: Minutes-based number input with validation (1 minute default, 0.5-60 range)
- **Round-Based Architecture**: Questions organized into rounds with individual settings and types
- **Draft Management**: Auto-save functionality with recovery and edit mode detection
- **Mobile-First Design**: Responsive interface supporting 320px to 7680px screen sizes

**Technical Architecture:**

```typescript
// Primary Feature Structure (67 files implemented)
src/features/quizzes/
├── creation-editing/                  # Quiz creation and editing system
│   ├── components/QuizWizardModal/   # Main 2-step creation wizard
│   ├── hooks/                        # 8 custom hooks for wizard logic
│   ├── steps/                        # BasicInfo and Questions steps
│   │   ├── components/              # Question editor, round navigation
│   │   └── hooks/                   # Step-specific state management
│   └── types/                       # Creation-specific interfaces
├── management/                       # Quiz management and storage
│   ├── components/                  # Quiz grid, cards, actions, storage status
│   ├── hooks/                       # 6 hooks for CRUD operations
│   ├── services/indexedDBService.ts # Complete IndexedDB implementation
│   └── types/                       # Management-specific interfaces
├── exporting/                       # Export functionality (future Phase 3)
├── playing/                         # Quiz playing interface (future Phase 2)
├── pages/Quizzes.tsx               # Main integrated page
├── services/                       # AI question generation
└── types/                          # Global quiz type definitions
```

#### **2. IndexedDB Storage Architecture (IMPLEMENTED)**

**Complete Database Service:**

```typescript
// indexedDBService.ts - Comprehensive database layer
class IndexedDBService {
  // Database operations
  saveQuiz(quiz: Quiz): Promise<string>;
  getQuiz(id: string): Promise<Quiz | null>;
  getAllQuizzes(): Promise<Quiz[]>;
  deleteQuiz(id: string): Promise<void>;

  // Draft management
  saveDraft(draft: DraftQuiz): Promise<string>;
  getDraft(id: string): Promise<DraftQuiz | null>;
  getAllDrafts(): Promise<DraftQuiz[]>;
  deleteDraft(id: string): Promise<void>;

  // Storage monitoring
  getStorageStats(): Promise<StorageStats>;
  cleanupOldDrafts(): Promise<number>;
}

// Storage patterns following development standards
AUTO_SAVE_DELAY = 30000; // 30 seconds (longer than typical 500ms for large drafts)
DRAFT_CLEANUP_DAYS = 7; // Auto-cleanup after 7 days
DATABASE_NAME = "QuizzardDB";
DATABASE_VERSION = 1;
```

**Storage Implementation Standards:**

- **Atomic Operations**: Complete quiz objects stored as single transactions
- **Auto-Save Pattern**: 30-second debounced persistence during creation
- **Draft Management**: Separate storage for incomplete quizzes with auto-cleanup
- **Error Recovery**: Graceful fallbacks with user-friendly error messages
- **Storage Monitoring**: Real-time usage tracking and cleanup utilities

#### **3. Quiz Creation Wizard (IMPLEMENTED)**

**Two-Step Wizard Architecture:**

```typescript
// Step 1: BasicInfoStep.tsx - Essential quiz information
interface BasicInfoStepProps {
  draftQuiz: DraftQuiz;
  updateDraft: (updates: Partial<DraftQuiz>) => void;
  validation: ValidationResult;
  onDeleteQuiz?: () => void;        // Only in edit mode
  isEditMode: boolean;
  onContinue: () => void;
}

// Key features implemented:
- Quiz title (required) with validation
- Description (optional) for quiz context
- Time input: Minutes-based number field with "1 Minute by Default" hint
- Delete button: Trash icon on left side, edit mode only
- Validation: Real-time feedback with red borders and error messages
```

**Time Input System Standards:**

```typescript
// Modern time input replacing legacy slider system
<TextField
  type="number"
  label="1 Minute by Default"
  placeholder="1 Minute by Default"
  value={displayTime}  // Empty string when undefined
  inputProps={{
    step: 0.5,         // Supports 0.5, 1, 1.5, 2, etc.
    min: undefined,    // No restrictions - user freedom
    max: undefined,    // No restrictions - user freedom
  }}
  InputProps={{
    endAdornment: <InputAdornment position="end">minutes</InputAdornment>
  }}
/>

// Validation logic:
- Default: 60 seconds (1 minute) when field is empty
- Range: 1 second to 3600 seconds (1 hour) for user input
- Conversion: User input in minutes * 60 = stored seconds
- Display: Stored seconds / 60 = displayed minutes
- Error: Red border + "Time must be > 0 minutes" for invalid input
```

**Step Navigation Standards:**

```typescript
// Fixed bottom navigation following development standards
<Box
  sx={{
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    bgcolor: "background.paper",
    borderTop: 1,
    borderColor: "divider",
    p: 2,
    zIndex: 1000,
  }}
>
  // Back button, step indicators, forward/complete buttons // Responsive: Icon
  + text on desktop, icon-only on mobile
</Box>
```

#### **4. Question Management System (IMPLEMENTED)**

**Round-Based Architecture:**

```typescript
// Round interface with comprehensive settings
interface Round {
  id: string;
  level?: string; // Optional round level/name
  description?: string; // Round description
  type: RoundType; // mixed | single-answer | multiple-choice
  answerRevealMode: AnswerRevealMode; // after-question | after-round | after-all
  defaultTimePerQuestion: number; // In minutes (converted from seconds)
  questions: Question[];
}

// Question interface with flexible answer system
interface Question {
  id: string;
  text: string;
  answers: Answer[];
  correctAnswerIds: string[];
  timeLimit?: number; // Override round default (in seconds)
  points: number; // Default 1 point
}
```

**Question Editor Standards:**

```typescript
// Dynamic question creation and editing
Features Implemented:
- Real-time question text editing with auto-save
- Dynamic answer management (add/remove answers)
- Correct answer selection with visual indicators
- Point assignment with number input validation
- Time override system with minutes conversion
- Question deletion with confirmation dialogs

// Answer management patterns:
- Minimum 1 answer required
- Maximum configurable based on round type
- Drag-and-drop reordering (future enhancement)
- Rich text support ready for Phase 3 media integration
```

#### **5. Draft Management and Auto-Save (IMPLEMENTED)**

**Auto-Save Implementation:**

```typescript
// useQuizWizardPersistence.ts - Draft management hook
const AUTO_SAVE_DELAY = 30000; // 30 seconds

useEffect(() => {
  const timeoutId = setTimeout(async () => {
    if (draftQuiz.title?.trim()) {
      // Only save if title exists
      try {
        await indexedDBService.saveDraft(draftQuiz);
        setLastSaved(Date.now());
        setAutoSaveStatus("saved");
      } catch (error) {
        setAutoSaveStatus("error");
        // User-friendly error handling
      }
    }
  }, AUTO_SAVE_DELAY);

  return () => clearTimeout(timeoutId);
}, [draftQuiz, isEditMode]);
```

**Draft Recovery Standards:**

```typescript
// Automatic draft detection and recovery
useEffect(() => {
  const loadDraft = async () => {
    if (quizId && isEditMode) {
      // Load existing quiz for editing
      const quiz = await indexedDBService.getQuiz(quizId);
      if (quiz) {
        setDraftQuiz(convertQuizToDraft(quiz));
      }
    } else {
      // Check for existing draft
      const drafts = await indexedDBService.getAllDrafts();
      const existingDraft = drafts.find(d => /* matching logic */);
      if (existingDraft) {
        // Prompt user for recovery
        setShowRecoveryDialog(true);
      }
    }
  };
  loadDraft();
}, [quizId, isEditMode]);
```

#### **6. User Interface Standards (IMPLEMENTED)**

**Floating Action Button System:**

```typescript
// Professional FAB pattern for quiz actions
<SpeedDial
  ariaLabel="Quiz Actions"
  sx={{ position: "fixed", bottom: 16, right: 16 }}
  icon={<SpeedDialIcon />}
>
  {/* Edit Quiz FAB - Pen icon */}
  <SpeedDialAction
    icon={<EditIcon />}
    tooltipTitle="Edit Quiz"
    onClick={handleEditQuiz}
    sx={{
      // Desktop: Icon + text
      // Mobile: Icon only for space efficiency
      display: { xs: "icon-only", sm: "icon-text" },
    }}
  />

  {/* Save Quiz FAB - Save icon */}
  <SpeedDialAction
    icon={<SaveIcon />}
    tooltipTitle="Save Quiz"
    onClick={handleSaveQuiz}
  />
</SpeedDial>
```

**Responsive Layout Standards:**

```typescript
// Quiz grid layout following development standards
<Grid
  container
  spacing={3}
  sx={{
    maxWidth: "clamp(280px, 90vw, 1400px)",
    mx: "auto",
    py: 3,
  }}
>
  {/* Quiz cards with consistent sizing */}
  <Grid item xs={12} sm={6} lg={4}>
    <QuizCard
      sx={{
        height: 280, // Fixed height for consistent grid
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px) scale(1.02)",
          boxShadow: 4,
        },
      }}
    />
  </Grid>
</Grid>
```

#### **7. Validation System (IMPLEMENTED)**

**Lenient Validation Pattern:**

```typescript
// Quiz validation with user-friendly approach
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validation rules implemented:
- Title is required (only strict requirement)
- Time must be > 0 and <= 3600 seconds if provided
- Questions can be empty (allows saving incomplete quizzes)
- Rounds can be empty (allows iterative development)
- Answers validation only on final save, not during editing

// Real-time validation feedback:
const getFieldError = useCallback((fieldName: string) => {
  return validation.errors.find(error =>
    error.toLowerCase().includes(fieldName.toLowerCase())
  );
}, [validation.errors]);
```

**Error Display Standards:**

```typescript
// User-friendly error presentation
<TextField
  error={!!timeError}
  helperText={
    timeError ||
    "This will be the default time limit for each new question. You can override it per question."
  }
  sx={{
    "& .MuiOutlinedInput-root.Mui-error": {
      "& fieldset": { borderColor: "error.main" },
    },
  }}
/>
```

#### **8. Storage Status Monitoring (IMPLEMENTED)**

**Real-Time Storage Tracking:**

```typescript
// StorageStatus component for main quiz page
interface StorageStats {
  totalQuizzes: number;
  totalDrafts: number;
  estimatedSize: string;
  lastCleanup?: Date;
}

// Storage monitoring features:
- Real-time quiz and draft counting
- Storage size estimation
- Auto-cleanup status display
- Manual cleanup utilities
- Error detection and recovery
```

**Storage Management UI:**

```typescript
// Storage status display with actions
<Card sx={{ mb: 3 }}>
  <CardContent>
    <Typography variant="h6">Storage Status</Typography>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography>Quizzes: {stats.totalQuizzes}</Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography>Drafts: {stats.totalDrafts}</Typography>
      </Grid>
    </Grid>
    <Box sx={{ mt: 2 }}>
      <Button onClick={handleCleanup}>Clean Old Drafts</Button>
    </Box>
  </CardContent>
</Card>
```

#### **9. TypeScript Integration (IMPLEMENTED)**

**Comprehensive Type System:**

```typescript
// Core quiz interfaces with strict typing
interface Quiz {
  id: string;
  title: string;
  description?: string;
  defaultTimeLimit: number; // Seconds (internal storage)
  rounds: Round[];
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  isTemplate?: boolean;
}

interface DraftQuiz {
  id?: string; // Optional for new drafts
  title?: string; // Optional during creation
  description?: string;
  defaultTimeLimit?: number; // Optional with 60s default
  rounds: Round[];
  lastSaved?: Date;
  isTemplate?: boolean;
}

// Hook return types for consistency
interface UseQuizWizardReturn {
  draftQuiz: DraftQuiz;
  updateDraft: (updates: Partial<DraftQuiz>) => void;
  saveDraft: () => Promise<void>;
  saveQuiz: () => Promise<string>;
  validation: ValidationResult;
  isLoading: boolean;
  autoSaveStatus: "idle" | "saving" | "saved" | "error";
}
```

#### **10. Performance Optimizations (IMPLEMENTED)**

**Efficient State Management:**

```typescript
// Optimized quiz wizard state management
const QuizWizardModal = React.memo(
  ({ isOpen, onClose, quizId, isEditMode }) => {
    // Lazy initialization of draft state
    const [draftQuiz, setDraftQuiz] = useState<DraftQuiz>(() => ({
      rounds: [],
      defaultTimeLimit: 60, // 1 minute default
    }));

    // Memoized update function to prevent unnecessary re-renders
    const updateDraft = useCallback((updates: Partial<DraftQuiz>) => {
      setDraftQuiz((prev) => ({ ...prev, ...updates }));
    }, []);

    // Debounced auto-save to prevent excessive IndexedDB writes
    const debouncedSave = useMemo(
      () => debounce(saveDraft, AUTO_SAVE_DELAY),
      [saveDraft]
    );
  }
);
```

**IndexedDB Optimization:**

```typescript
// Efficient database operations
class IndexedDBService {
  // Batch operations for multiple records
  async saveMultipleQuizzes(quizzes: Quiz[]): Promise<string[]> {
    const transaction = this.db.transaction(["quizzes"], "readwrite");
    const promises = quizzes.map((quiz) =>
      transaction.objectStore("quizzes").add(quiz)
    );
    return Promise.all(promises);
  }

  // Indexed queries for fast retrieval
  async getQuizzesByTag(tag: string): Promise<Quiz[]> {
    // Uses IndexedDB index for optimal performance
  }

  // Connection pooling and transaction reuse
  private getTransaction(mode: "readonly" | "readwrite") {
    return this.db.transaction(["quizzes", "drafts"], mode);
  }
}
```

#### **11. Mobile UX Standards (IMPLEMENTED)**

**Touch-Friendly Interface:**

```typescript
// Mobile-optimized quiz creation
Mobile Design Patterns:
- Large touch targets (minimum 44px)
- Simplified navigation with clear back buttons
- Reduced information density
- Gesture-friendly interactions
- iOS safe area handling for PWA compatibility

// Responsive floating action buttons
<SpeedDialAction
  sx={{
    // Mobile: Icon only for space efficiency
    '& .MuiSpeedDialAction-staticTooltipLabel': {
      display: { xs: 'none', sm: 'block' }
    },
    // Larger touch targets on mobile
    width: { xs: 56, sm: 48 },
    height: { xs: 56, sm: 48 },
  }}
/>
```

**Mobile Layout Optimization:**

```typescript
// Single-column layout on mobile for quiz creation
<Grid container spacing={{ xs: 2, sm: 3 }}>
  <Grid item xs={12} sm={6} md={4}>
    {/* Quiz card with mobile-friendly dimensions */}
    <Card sx={{
      minHeight: { xs: 200, sm: 280 },
      '& .MuiCardContent-root': {
        padding: { xs: 2, sm: 3 }
      }
    }}>
  </Grid>
</Grid>
```

#### **12. Future Phase Roadmap (DOCUMENTED)**

**Phase 2 - Quiz Playing & Presentation (TO DO):**

```typescript
// Planned implementation for quiz gameplay
Features:
- Team setup integration with Points Counter
- Full-screen question presentation
- Quiz master interface for big screen display
- Real-time scoring and leaderboard integration
- Round management with break timers
- Answer collection workflow (paper/pen + manual scoring)

// Technical requirements:
- Connection to existing Points Counter state management
- Presentation mode with auto/manual question progression
- Timer integration with visual countdown displays
- Score integration maintaining decimal precision support
```

**Phase 3 - Media Integration & Export (TO DO):**

```typescript
// Planned advanced features
Features:
- File upload system (drag-and-drop interface)
- Media support: Pictures (10MB), Audio (20MB), Video (100MB)
- PowerPoint export with embedded media
- Advanced question types: Picture/Audio/Video rounds
- Golden Pyramid round format (1→2→3→4 correct answers)

// Technical requirements:
- IndexedDB binary file storage expansion
- PowerPoint-compatible format validation
- Media preview and processing
- Export service integration
```

#### **13. Development Standards Compliance (IMPLEMENTED)**

**Code Quality Standards Met:**

- ✅ **Single Responsibility Principle**: 67 focused files, each with clear purpose
- ✅ **TypeScript Coverage**: 100% with strict mode, no `any` types
- ✅ **JSDoc Documentation**: Comprehensive documentation for all functions and components
- ✅ **Error Handling**: Graceful fallbacks with user-friendly messages
- ✅ **Mobile-First Design**: Responsive across 320px to 7680px screen sizes
- ✅ **Performance Optimization**: Debounced operations, memoization, efficient state management
- ✅ **PWA Compatibility**: Offline support through IndexedDB, works without network
- ✅ **Accessibility**: ARIA labels, keyboard navigation, screen reader support

**Architecture Standards Met:**

- ✅ **Feature-Based Structure**: Clean separation of concerns across modules
- ✅ **Hook-Based Logic**: 24+ custom hooks following React best practices
- ✅ **Storage Patterns**: Centralized IndexedDB service with atomic operations
- ✅ **Component Hierarchy**: Logical parent/child relationships with prop drilling minimization
- ✅ **State Management**: Local state with hooks, no unnecessary global state
- ✅ **Import/Export**: Clean module boundaries with proper encapsulation

#### **14. Implementation Statistics (COMPLETE)**

**Phase 1 Implementation Complete:**

- **67 TypeScript files** with comprehensive JSDoc documentation
- **24+ custom React hooks** implementing clean architecture patterns
- **15+ UI components** with Material-UI integration and responsive design
- **Full IndexedDB integration** with auto-save, draft management, and storage monitoring
- **100% TypeScript coverage** with strict typing and interface definitions
- **Complete accessibility** with ARIA labels and keyboard navigation
- **Mobile-first responsive design** supporting 320px to 7680px screen sizes
- **Zero breaking changes** during implementation with backward compatibility maintained
- **Production-ready state** with comprehensive error handling and user feedback systems

**Ready for Production Deployment:**

- Quiz creation wizard with comprehensive question management
- IndexedDB storage with auto-save and draft recovery
- Mobile-responsive design supporting all device sizes
- Professional Material-UI interface with accessibility compliance
- Comprehensive error handling and user feedback systems
- Foundation ready for Phase 2 (Playing) and Phase 3 (Media/Export) implementation

## **🗄️ INDEXEDDB INTEGRATION STANDARDS**

### **IndexedDB Service Architecture (REQUIRED)**

#### **1. Database Service Layer**

```typescript
// ✅ REQUIRED: Centralized IndexedDB service following singleton pattern
interface IndexedDBService {
  // Database lifecycle
  initializeDB(): Promise<void>;
  closeDB(): void;

  // Quiz operations
  saveQuiz(quiz: Quiz): Promise<string>;
  getQuiz(id: string): Promise<Quiz | null>;
  getAllQuizzes(): Promise<Quiz[]>;
  deleteQuiz(id: string): Promise<void>;

  // Draft operations
  saveDraft(draft: QuizDraft): Promise<string>;
  getDraft(id: string): Promise<QuizDraft | null>;
  getAllDrafts(): Promise<QuizDraft[]>;
  deleteDraft(id: string): Promise<void>;

  // Storage monitoring
  getStorageUsage(): Promise<StorageUsage>;
  cleanupOldDrafts(olderThanDays: number): Promise<number>;
}

// ✅ REQUIRED: Database schema versioning
const DB_NAME = "QuizzardDB";
const DB_VERSION = 2; // Increment for schema changes
const STORES = {
  QUIZZES: "quizzes",
  DRAFTS: "drafts",
  TEMPLATES: "templates",
} as const;
```

#### **2. Auto-Save Implementation (REQUIRED)**

```typescript
// ✅ REQUIRED: Auto-save with debouncing for performance
const useAutoSave = (data: QuizDraft, interval: number = 30000) => {
  const debouncedSave = useMemo(
    () =>
      debounce(async (draft: QuizDraft) => {
        try {
          await indexedDBService.saveDraft(draft);
          setLastSaved(new Date());
        } catch (error) {
          console.error("Auto-save failed:", error);
          // Fallback to localStorage if IndexedDB fails
          localStorage.setItem(`draft_${draft.id}`, JSON.stringify(draft));
        }
      }, 3000), // 3 second debounce
    []
  );

  useEffect(() => {
    if (data) {
      debouncedSave(data);
    }
  }, [data, debouncedSave]);
};
```

#### **3. Error Handling & Fallbacks (REQUIRED)**

```typescript
// ✅ REQUIRED: Graceful degradation when IndexedDB unavailable
const useStorageWithFallback = () => {
  const [isIndexedDBAvailable, setIsIndexedDBAvailable] = useState(true);

  const saveData = async (key: string, data: any): Promise<void> => {
    try {
      if (isIndexedDBAvailable) {
        await indexedDBService.saveQuiz(data);
      } else {
        // Fallback to localStorage
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.warn("IndexedDB failed, falling back to localStorage:", error);
      setIsIndexedDBAvailable(false);
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  return { saveData, isIndexedDBAvailable };
};
```

### **Storage Performance Standards (REQUIRED)**

#### **1. Data Compression**

```typescript
// ✅ REQUIRED: Compress large quiz data before storage
const compressQuizData = (quiz: Quiz): CompressedQuiz => {
  return {
    ...quiz,
    rounds: quiz.rounds.map((round) => ({
      ...round,
      questions: round.questions.map((q) => ({
        id: q.id,
        text: q.text,
        answers: q.answers,
        // Remove unnecessary whitespace and format
        text: q.text.trim().replace(/\s+/g, " "),
      })),
    })),
  };
};
```

#### **2. Storage Monitoring**

```typescript
// ✅ REQUIRED: Monitor storage usage and cleanup
interface StorageMetrics {
  totalQuizzes: number;
  totalDrafts: number;
  estimatedSize: number; // bytes
  oldestDraft: Date | null;
  quota: number; // Available storage quota
  usage: number; // Current usage
}

const useStorageMonitoring = (): StorageMetrics => {
  const [metrics, setMetrics] = useState<StorageMetrics>({
    totalQuizzes: 0,
    totalDrafts: 0,
    estimatedSize: 0,
    oldestDraft: null,
    quota: 0,
    usage: 0,
  });

  useEffect(() => {
    const updateMetrics = async () => {
      try {
        const usage = await indexedDBService.getStorageUsage();
        setMetrics(usage);
      } catch (error) {
        console.error("Failed to get storage metrics:", error);
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return metrics;
};
```

## **🌐 SPA ARCHITECTURE STANDARDS**

### **React Router Integration (REQUIRED)**

#### **1. Router Configuration**

```typescript
// ✅ REQUIRED: BrowserRouter with proper base path for GitHub Pages
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const App: React.FC = () => {
  return (
    <Router basename="/Quizzard">
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/quizzes/create" element={<QuizCreator />} />
            <Route path="/quizzes/edit/:id" element={<QuizEditor />} />
            <Route
              path="/random-team-generator"
              element={<RandomTeamGenerator />}
            />
            <Route path="/points-counter" element={<PointsCounter />} />
            <Route path="/final-question" element={<FinalQuestion />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ThemeProvider>
      </ErrorBoundary>
    </Router>
  );
};
```

#### **2. GitHub Pages SPA Configuration (REQUIRED)**

```html
<!-- ✅ REQUIRED: public/404.html for SPA redirect support -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Quizzard</title>
    <script type="text/javascript">
      // GitHub Pages SPA redirect
      var pathSegmentsToKeep = 1; // For /Quizzard/ base path
      var l = window.location;
      l.replace(
        l.protocol +
          "//" +
          l.hostname +
          (l.port ? ":" + l.port : "") +
          l.pathname
            .split("/")
            .slice(0, 1 + pathSegmentsToKeep)
            .join("/") +
          "/?/" +
          l.pathname
            .slice(1)
            .split("/")
            .slice(pathSegmentsToKeep)
            .join("/")
            .replace(/&/g, "~and~") +
          (l.search ? "&" + l.search.slice(1).replace(/&/g, "~and~") : "") +
          l.hash
      );
    </script>
  </head>
  <body></body>
</html>
```

#### **3. URL State Management (REQUIRED)**

```typescript
// ✅ REQUIRED: Quiz editor with URL state preservation
const useQuizEditorWithURL = (quizId?: string) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Preserve editing state in URL parameters
  const updateURLState = (state: Partial<QuizEditState>) => {
    const searchParams = new URLSearchParams(location.search);

    if (state.currentStep) {
      searchParams.set("step", state.currentStep.toString());
    }
    if (state.currentRound) {
      searchParams.set("round", state.currentRound.toString());
    }

    navigate(
      {
        pathname: location.pathname,
        search: searchParams.toString(),
      },
      { replace: true }
    );
  };

  return { updateURLState };
};
```

### **Navigation Standards (REQUIRED)**

#### **1. Breadcrumb Navigation**

```typescript
// ✅ REQUIRED: Breadcrumb support for deep navigation
interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ComponentType;
}

const useBreadcrumbs = (): BreadcrumbItem[] => {
  const location = useLocation();

  const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", path: "/", icon: HomeIcon },
    ];

    if (pathSegments.includes("quizzes")) {
      breadcrumbs.push({ label: "Quizzes", path: "/quizzes", icon: QuizIcon });

      if (pathSegments.includes("create")) {
        breadcrumbs.push({ label: "Create Quiz", path: "/quizzes/create" });
      } else if (pathSegments.includes("edit")) {
        breadcrumbs.push({
          label: "Edit Quiz",
          path: `/quizzes/edit/${pathSegments[2]}`,
        });
      }
    }

    return breadcrumbs;
  };

  return generateBreadcrumbs(location.pathname);
};
```

## **⚠️ ERROR BOUNDARY INTEGRATION**

### **Global Error Handling (REQUIRED)**

#### **1. Error Boundary Component**

```typescript
// ✅ REQUIRED: Comprehensive error boundary with user feedback
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);

    // Log to external service in production
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Implementation for error logging service
    console.error("Logging error to service:", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={() =>
            this.setState({ hasError: false, error: null, errorInfo: null })
          }
        />
      );
    }

    return this.props.children;
  }
}
```

#### **2. Error Fallback UI (REQUIRED)**

```typescript
// ✅ REQUIRED: User-friendly error fallback with recovery options
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onReset();
    navigate("/");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        textAlign: "center",
        p: 3,
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />

      <Typography variant="h4" gutterBottom>
        Oops! Something went wrong
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 600 }}
      >
        We're sorry for the inconvenience. The application encountered an
        unexpected error. Your data has been preserved, and you can try the
        following options:
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh Page
        </Button>

        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={handleGoHome}
        >
          Go to Home
        </Button>
      </Stack>

      {import.meta.env.DEV && error && (
        <Accordion sx={{ mt: 3, maxWidth: "100%" }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              Error Details (Development)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              component="pre"
              variant="caption"
              sx={{
                whiteSpace: "pre-wrap",
                fontSize: "0.75rem",
                backgroundColor: "grey.100",
                p: 2,
                borderRadius: 1,
              }}
            >
              {error.message}
              {"\n\n"}
              {error.stack}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};
```

### **Feature-Level Error Handling (REQUIRED)**

#### **1. Quiz Feature Error Boundaries**

```typescript
// ✅ REQUIRED: Feature-specific error boundaries for isolated failures
const QuizFeatureErrorBoundary: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <QuizErrorFallback
          error={error}
          onReset={reset}
          feature="Quiz Creation System"
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

// ✅ REQUIRED: Feature-specific error recovery
const QuizErrorFallback: React.FC<{
  error: Error;
  onReset: () => void;
  feature: string;
}> = ({ error, onReset, feature }) => {
  const [hasRecovered, setHasRecovered] = useState(false);

  const handleRecovery = async () => {
    try {
      // Attempt to recover quiz data from IndexedDB
      const drafts = await indexedDBService.getAllDrafts();
      if (drafts.length > 0) {
        setHasRecovered(true);
        // Show recovery UI
      }
    } catch (recoveryError) {
      console.error("Failed to recover data:", recoveryError);
    }

    onReset();
  };

  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={handleRecovery}>
          Try Recovery
        </Button>
      }
      sx={{ m: 2 }}
    >
      <AlertTitle>{feature} Error</AlertTitle>
      An error occurred in the {feature.toLowerCase()}. Your draft data may be recoverable.
    </Alert>
  );
};
```

## **🎨 COMPONENT ARCHITECTURE STANDARDS**

### **Quiz Component Structure (REQUIRED)**

#### **1. Wizard Component Pattern**

```typescript
// ✅ REQUIRED: Multi-step wizard with proper state management
interface WizardStep {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  validation?: (data: any) => ValidationResult;
  canProceed?: (data: any) => boolean;
}

const useWizardNavigation = (steps: WizardStep[], initialData: any) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [wizardData, setWizardData] = useState(initialData);
  const [stepValidation, setStepValidation] = useState<
    Record<string, ValidationResult>
  >({});

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const validateCurrentStep = useCallback(() => {
    if (currentStep.validation) {
      const result = currentStep.validation(wizardData);
      setStepValidation((prev) => ({
        ...prev,
        [currentStep.id]: result,
      }));
      return result.isValid;
    }
    return true;
  }, [currentStep, wizardData]);

  const goToNext = useCallback(() => {
    if (validateCurrentStep() && !isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [validateCurrentStep, isLastStep]);

  const goToPrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [isFirstStep]);

  return {
    currentStep,
    currentStepIndex,
    wizardData,
    setWizardData,
    stepValidation,
    isFirstStep,
    isLastStep,
    goToNext,
    goToPrevious,
    validateCurrentStep,
  };
};
```

#### **2. Validation System (REQUIRED)**

```typescript
// ✅ REQUIRED: Comprehensive validation with user feedback
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

const useQuizValidation = () => {
  const validateBasicInfo = (quiz: Partial<Quiz>): ValidationResult => {
    const errors: ValidationError[] = [];

    if (!quiz.title?.trim()) {
      errors.push({
        field: "title",
        message: "Quiz title is required",
        severity: "error",
      });
    }

    if (quiz.timeLimit && (quiz.timeLimit < 0.5 || quiz.timeLimit > 60)) {
      errors.push({
        field: "timeLimit",
        message: "Time limit must be between 0.5 and 60 minutes",
        severity: "error",
      });
    }

    return {
      isValid: errors.filter((e) => e.severity === "error").length === 0,
      errors,
      warnings: [],
    };
  };

  const validateQuestions = (rounds: Round[]): ValidationResult => {
    const errors: ValidationError[] = [];

    rounds.forEach((round, roundIndex) => {
      if (round.questions.length === 0) {
        errors.push({
          field: `round_${roundIndex}`,
          message: `Round ${roundIndex + 1} must have at least one question`,
          severity: "warning",
        });
      }

      round.questions.forEach((question, questionIndex) => {
        if (!question.text.trim()) {
          errors.push({
            field: `question_${roundIndex}_${questionIndex}`,
            message: `Question ${questionIndex + 1} in Round ${
              roundIndex + 1
            } is empty`,
            severity: "error",
          });
        }

        if (question.answers.length < 2) {
          errors.push({
            field: `answers_${roundIndex}_${questionIndex}`,
            message: `Question ${questionIndex + 1} needs at least 2 answers`,
            severity: "error",
          });
        }
      });
    });

    return {
      isValid: errors.filter((e) => e.severity === "error").length === 0,
      errors,
      warnings: errors.filter((e) => e.severity === "warning"),
    };
  };

  return { validateBasicInfo, validateQuestions };
};
```

### **🔄 Export Functionality Standards**

#### **1. Export Format Handlers**

```typescript
// ✅ REQUIRED: Export handler interface
interface ExportHandler<T = unknown> {
  /** Unique identifier for the export format */
  readonly format: string;
  /** Whether this format is currently available */
  readonly isAvailable: boolean;
  /** Export the quiz to the specified format */
  export: (quiz: Quiz, settings?: T) => Promise<void>;
}

// ✅ REQUIRED: Export settings validation
interface ExportSettings {
  includePresenterNotes: boolean;
  slideTemplate: string;
  questionFontSize: number;
  optionFontSize: number;
  includeMetadata: boolean;
  includeAnswerKey: boolean;
  compressImages: boolean;
  imageQuality: number;
}

// ❌ NEVER: Direct file system access
// Do not use Node.js fs module or other direct file system access
// Always use browser's native file system API
```

#### **2. Export UI Components**

```typescript
// ✅ REQUIRED: Export dialog structure
<Dialog
  open={open}
  onClose={onClose}
  maxWidth="sm"
  fullWidth
  aria-labelledby="export-format-dialog-title"
>
  <DialogTitle>
    {/* Title must include quiz name */}
    Export Quiz: {quiz.title}
  </DialogTitle>
  <DialogContent>
    {/* Must show format options */}
    <List>
      {exportOptions.map((option) => (
        <ListItemButton
          key={option.id}
          disabled={!option.isAvailable}
          onClick={() => handleExport(option.id)}
        >
          <ListItemIcon>{option.icon}</ListItemIcon>
          <ListItemText primary={option.label} secondary={option.description} />
        </ListItemButton>
      ))}
    </List>
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
  </DialogActions>
</Dialog>

// ❌ NEVER: Inline export logic
// Export logic must be in separate handlers
// UI components should only handle user interaction
```

#### **3. Export Error Handling**

```typescript
// ✅ REQUIRED: Error boundaries for export operations
try {
  await exportHandler.export(quiz, settings);
} catch (error) {
  // Must handle specific error types
  if (error instanceof ValidationError) {
    showValidationError(error);
  } else if (error instanceof ExportError) {
    showExportError(error);
  } else {
    // Generic error handling
    console.error("Export failed:", error);
    showGenericError();
  }
}

// ❌ NEVER: Silent failures
// All export errors must be logged and displayed to user
```

#### **4. Export Format Dialog (REQUIRED)**

```typescript
// ✅ REQUIRED: Export format dialog with consistent styling
<Dialog
  open={open}
  onClose={onClose}
  aria-labelledby="export-format-dialog-title"
  maxWidth="sm"
  fullWidth
>
  <DialogTitle id="export-format-dialog-title">
    Export Quiz: {quiz.title}
  </DialogTitle>
  <DialogContent>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Choose an export format below. Currently, only PowerPoint export is
      available.
    </Typography>
    <List>
      {EXPORT_OPTIONS.map((option) => (
        <ListItemButton
          key={option.id}
          onClick={() => handleExport(option.id)}
          disabled={option.disabled}
        >
          <ListItemIcon>
            <option.icon />
          </ListItemIcon>
          <ListItemText
            primary={option.label}
            secondary={option.disabled ? "(Coming Soon)" : option.description}
          />
        </ListItemButton>
      ))}
    </List>
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
  </DialogActions>
</Dialog>
```

#### **5. Export Data Validation (REQUIRED)**

```typescript
// ✅ REQUIRED: Quiz data validation before export
const validateQuizForExport = (quiz: Quiz | null): string | null => {
  if (!quiz) {
    return "Quiz data is missing";
  }
  if (!quiz.rounds || !Array.isArray(quiz.rounds)) {
    return "Quiz rounds are missing or invalid";
  }
  if (quiz.rounds.length === 0) {
    return "Quiz has no rounds";
  }
  if (!quiz.rounds.every((round) => round && Array.isArray(round.questions))) {
    return "One or more quiz rounds have invalid questions";
  }
  return null;
};

// ❌ NEVER: Skip validation before export
// Always validate quiz data structure before attempting export
// Handle validation errors gracefully with user-friendly messages
```

#### **6. PowerPoint Export Standards**

- **Slide Layout:**

  - Title slide with quiz metadata
  - Round title slides
  - Question slides with proper formatting
  - Answer slides with correct answer highlighting
  - Presenter notes with explanations
  - Answer key slide (optional)

- **Formatting:**

  - Consistent font sizes (title: 36px, questions: 24px, options: 18px)
  - Professional color scheme matching quiz difficulty
  - Proper slide dimensions (16:9 aspect ratio)
  - Clean, readable layouts

- **Error Handling:**
  - Validate quiz data before export
  - Show user-friendly error messages
  - Provide recovery options
  - Log errors for debugging

### **🔄 Update Functionality Standards**

#### **1. Update Dialog Implementation (REQUIRED)**

```typescript
// ✅ REQUIRED: Professional update dialog with smooth transitions
interface UpdateDialogProps {
  open: boolean;
  onClose: () => void;
  checking: boolean;
  updateAvailable: boolean;
  error: string | null;
  onCheckUpdate: () => void;
  onApplyUpdate: () => void;
}

// ✅ REQUIRED: Smooth state transitions
<Box
  sx={{
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    opacity: checking ? 1 : 0,
    transform: checking ? "translateY(0)" : "translateY(-20px)",
    transition: "all 0.3s ease-in-out",
    visibility: checking ? "visible" : "hidden",
  }}
>
  <CircularProgress size={56} thickness={4} />
  <Typography
    variant="body1"
    sx={{
      mt: 3,
      fontWeight: 500,
      opacity: checking ? 1 : 0,
      transform: checking ? "translateY(0)" : "translateY(10px)",
      transition: "all 0.2s ease-in-out",
      transitionDelay: "0.1s",
    }}
  >
    Checking for updates...
  </Typography>
</Box>;
```

#### **2. Update Hook Standards (REQUIRED)**

```typescript
// ✅ REQUIRED: Comprehensive update hook implementation
interface UpdateState {
  checking: boolean;
  updateAvailable: boolean;
  error: string | null;
}

// ✅ REQUIRED: Service worker integration
const checkForUpdate = useCallback(async () => {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return !!registration.waiting;
  }
  throw new Error("Service Worker not supported");
}, []);

// ✅ REQUIRED: Update application
const applyUpdate = useCallback(async () => {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  }
}, []);
```

#### **3. Navigation Integration (REQUIRED)**

```typescript
// ✅ REQUIRED: Update option in navigation drawer
<ListItem disablePadding>
  <ListItemButton onClick={handleUpdateClick}>
    <ListItemIcon>
      <SystemUpdateIcon />
    </ListItemIcon>
    <ListItemText primary="Check for Updates" />
  </ListItemButton>
</ListItem>

// ✅ REQUIRED: Position after divider, before theme selector
<Divider />
<List>
  <ListItem disablePadding>
    <ListItemButton onClick={handleUpdateClick}>
      <ListItemIcon><SystemUpdateIcon /></ListItemIcon>
      <ListItemText primary="Check for Updates" />
    </ListItemButton>
  </ListItem>
  <ListItemButton onClick={onThemeDialogOpen}>
    <ListItemIcon>{themeIcon}</ListItemIcon>
    <ListItemText primary="Theme" />
  </ListItemButton>
</List>
```

#### **4. Error Handling Standards (REQUIRED)**

```typescript
// ✅ REQUIRED: Comprehensive error handling
try {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  } else {
    throw new Error("Service Worker not supported");
  }
} catch (error) {
  setState({
    checking: false,
    error: "Failed to check for updates",
    updateAvailable: false,
  });
}

// ✅ REQUIRED: User-friendly error messages
<Typography
  variant="body1"
  color="error"
  sx={{ mt: 3, fontWeight: 500, textAlign: "center" }}
>
  {error}
</Typography>;
```

#### **5. Visual Feedback Standards (REQUIRED)**

```typescript
// ✅ REQUIRED: Status-based icons and colors
{
  error ? (
    <ErrorIcon color="error" sx={{ fontSize: 56 }} />
  ) : updateAvailable ? (
    <SystemUpdateIcon color="primary" sx={{ fontSize: 56 }} />
  ) : (
    <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
  );
}

// ✅ REQUIRED: Consistent button styling
<Button
  onClick={onApplyUpdate}
  variant="contained"
  color="primary"
  size="large"
  startIcon={<SystemUpdateIcon />}
  sx={{ minWidth: 120 }}
>
  Update Now
</Button>;
```
