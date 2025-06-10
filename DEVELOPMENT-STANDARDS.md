# 📘 **QUIZZARD DEVELOPMENT STANDARDS**

**Version:** 2.1  
**Last Updated:** December 7, 2025  
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

### **Material-UI Standards**

#### **PWA Manifest Configuration:**

```json
// ✅ SINGLE SOURCE OF TRUTH: public/manifest.json ONLY
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

// ❌ NEVER: Multiple manifest.json files
// Root manifest.json has been removed to prevent conflicts
// Always use public/manifest.json as the single source of truth
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

**Last Updated:** December 7, 2025  
**Next Review:** January 7, 2026
