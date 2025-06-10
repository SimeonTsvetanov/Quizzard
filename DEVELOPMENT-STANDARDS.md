# 📘 **QUIZZARD DEVELOPMENT STANDARDS**

**Version:** 2.2  
**Last Updated:** December 18, 2025  
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
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false
}) => {
  // Implementation
};
```

### **Typography & Font Standards**

#### **1. Google Fonts Integration (REQUIRED)**

```html
<!-- ✅ REQUIRED: Poppins font preload in index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link 
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" 
  rel="stylesheet"
>
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
    h1: { fontSize: 'clamp(2rem, 5vw, 3.5rem)' },
    h5: { fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' },
    body1: { fontSize: 'clamp(0.9rem, 2vw, 1rem)' },
    button: { fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)' },
    
    // Custom quiz-specific variants
    quizTitle: { fontSize: 'clamp(1.5rem, 3.5vw, 2rem)' },
    quizQuestion: { fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' },
    quizOption: { fontSize: 'clamp(0.9rem, 2vw, 1rem)' },
    quizFeedback: { fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)' },
    quizInstructions: { fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)' },
    quizCounter: { fontSize: 'clamp(0.75rem, 1.2vw, 0.8rem)' },
    quizScore: { fontSize: 'clamp(1.2rem, 2.8vw, 1.6rem)' },
  }
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
    height: '100%',
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute content evenly
    gap: { xs: 1, sm: 1.5, md: 1.2 },
  }}
>
  {/* Icon Section - Top */}
  <Box sx={{ flexShrink: 0 }}>{icon}</Box>
  
  {/* Text Content - Center with flex: 1 */}
  <Box sx={{ 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center' 
  }}>
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
  header: { fontSize: { xs: '1.75rem', sm: '2.1rem' } },
  
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
import { useTheme } from '../shared/hooks/useTheme';
import type { Theme } from '@mui/material/styles';

// ✅ REQUIRED: Type-safe custom variants
declare module '@mui/material/styles' {
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
  "display": "standalone",           // Balanced PWA experience without aggressive browser features
  "start_url": "/Quizzard/",
  "scope": "/Quizzard/",
  "orientation": "any",              // All device orientations
  "background_color": "#1976D2",     // Theme primary color
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
    <HomeRoundedIcon sx={{ fontSize: { xs: '1.75rem', sm: '2.1rem' } }} />
  </IconButton>
  
  {/* Center: Dynamic text (non-clickable, route-based) */}
  <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
    <Typography sx={{ fontSize: dynamicHeader.fontSize }}>
      {dynamicHeader.text}
    </Typography>
  </Box>
  
  {/* Right: Menu icon (always visible, opens drawer) */}
  <IconButton onClick={handleDrawerToggle} aria-label="menu">
    <MenuOpenRoundedIcon sx={{ fontSize: { xs: '1.75rem', sm: '2.1rem' } }} />
  </IconButton>
</Toolbar>

// ✅ REQUIRED: Dynamic header text system
const getDynamicHeaderText = (pathname: string) => {
  // Strip base path for universal compatibility
  const cleanPath = pathname.replace('/Quizzard', '');
  
  // Character-based responsive font sizing
  const getFontSize = (chars: number) => {
    if (chars <= 8) return { xs: '1.75rem', sm: '2.1rem' };      // Standard
    else if (chars <= 14) return { xs: '1.4rem', sm: '1.8rem' }; // Medium  
    else return { xs: '1.2rem', sm: '1.6rem' };                 // Compact
  };
  
  return { text: mapping.text, fontSize: getFontSize(mapping.chars) };
};

// ✅ REQUIRED: Route mappings for all tools
const textMappings = {
  '/': { text: 'QUIZZARD', chars: 8 },
  '/random-team-generator': { text: 'RANDOM GENERATOR', chars: 16 },
  '/points-counter': { text: 'POINTS COUNTER', chars: 14 },
  '/quizzes': { text: 'QUIZZES', chars: 7 },
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
  standard: { xs: '1.75rem', sm: '2.1rem' },
  
  // Medium text (9-14 characters): POINTS COUNTER  
  medium: { xs: '1.4rem', sm: '1.8rem' },
  
  // Long text (≥15 characters): RANDOM GENERATOR
  compact: { xs: '1.2rem', sm: '1.6rem' }
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
  '/new-tool': { text: 'NEW TOOL NAME', chars: 13 }, // Specify character count
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
import { STORAGE_KEYS } from '../constants/storage';

// Save data
localStorage.setItem(STORAGE_KEYS.RTG_PARTICIPANTS, JSON.stringify(data));

// Load data
const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.RTG_PARTICIPANTS) || '[]');
```

#### **2. Auto-save Implementation**

```typescript
// ✅ REQUIRED: 500ms debounced auto-save
useEffect(() => {
  const timeoutId = setTimeout(() => {
    localStorage.setItem(STORAGE_KEYS.RTG_PARTICIPANTS, JSON.stringify(participants));
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
    const legacyData = localStorage.getItem('quizzard-random-team-generator-participants');
    if (legacyData) {
      localStorage.setItem(STORAGE_KEYS.RTG_PARTICIPANTS, legacyData);
      localStorage.removeItem('quizzard-random-team-generator-participants');
      data = legacyData;
    }
  }
  
  return data ? JSON.parse(data) : [];
};
```

#### **4. useLocalStoragePersistence Hook Pattern**

```typescript
// ✅ PREFERRED: Use the standardized localStorage persistence hook
import { useLocalStoragePersistence } from '../../../shared/hooks/useLocalStoragePersistence';
import { STORAGE_KEYS } from '../../../shared/utils/storageKeys';

// In your component or custom hook:
const { value: teamCount, setValue: setTeamCountValue } = useLocalStoragePersistence<number>(
  STORAGE_KEYS.RTG_TEAM_COUNT,
  CONSTANTS.MIN_TEAMS, // default value
  { 
    debounceMs: 500,      // 500ms auto-save debounce
    iosCompatMode: true   // iOS storage safety checks
  }
);

// Use just like useState:
const handleIncrement = () => setTeamCountValue(prev => prev + 1);
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

```typescript
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
```

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
  const data = JSON.parse(localStorage.getItem(key) || '[]');
  return data;
} catch (error) {
  console.error('Failed to parse localStorage data:', error);
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

**Last Updated:** December 18, 2025  
**Next Review:** January 18, 2026
