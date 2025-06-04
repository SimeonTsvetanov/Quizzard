```mermaid
graph TD
  A[public/index.html] -->|mounts| B[src/main.tsx]
  B -->|renders| C[src/App.tsx]
  C -->|imports| D[App.css]
  C -->|imports| E[index.css]
  C -->|uses| F[ThemeProvider (MUI)]
  F -->|wraps| G[AppBar (MUI) - Header]
  F -->|wraps| H[Container (MUI)]
  F -->|wraps| I[Paper (MUI)]
  F -->|wraps| J[Footer (Box, Typography, responsive, dynamic year, links)]
  H --> I
  I --> K[Typography: Welcome]
  I --> L[Typography: Subtitle]
  I --> M[Button: Random Team Generator]
  I --> N[Button: Points Counter]
  G --> O[Toolbar]
  O --> P[Typography: Quizzard]
  O --> Q[IconButton: Theme Toggle]
  G --> R[Drawer: Mobile Menu (focus trap, ARIA, blur, animation)]
  J --> S[Links: Privacy, Terms, About, Contact, GitHub, Support]
```

---

**How to read this diagram:**

- The app starts at `public/index.html`, which loads `src/main.tsx`.
- `main.tsx` renders the root React component: `App.tsx`.
- `App.tsx` uses Material UI's `ThemeProvider` for theming and imports global styles.
- The main UI is structured with an AppBar (Header, top), a centered Container with a Paper card (middle), and a Footer (bottom).
- The Paper card contains the welcome text and two main tool buttons (placeholders, always responsive).
- The AppBar contains the app name, navigation, theme toggle, and a responsive Drawer menu (with focus trap, ARIA, blur, and animation).
- The Footer is fully responsive, always at the bottom, and includes dynamic year, logo, navigation, GitHub, and support links.
- All overlays (Drawer, Dialog, etc.) use a global MUI backdrop blur (1.5px) for focus effect.

This structure ensures a clean, professional, accessible, and scalable layout for your app, following all current project requirements and best practices.
