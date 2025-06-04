```mermaid
graph TD
  A[public/index.html] -->|mounts| B[src/main.tsx]
  B -->|renders| C[src/App.tsx]
  C -->|imports| D[App.css]
  C -->|imports| E[index.css]
  C -->|uses| F[ThemeProvider (MUI)]
  F -->|wraps| G[AppBar (MUI)]
  F -->|wraps| H[Container (MUI)]
  F -->|wraps| I[Paper (MUI)]
  F -->|wraps| J[Footer (Box, Typography)]
  H --> I
  I --> K[Typography: Welcome]
  I --> L[Typography: Subtitle]
  I --> M[Button: Random Team Generator]
  I --> N[Button: Points Counter]
  G --> O[Toolbar]
  O --> P[Typography: Quizzard]
  O --> Q[IconButton: Theme Toggle]
```

---

**How to read this diagram:**
- The app starts at `public/index.html`, which loads `src/main.tsx`.
- `main.tsx` renders the root React component: `App.tsx`.
- `App.tsx` uses Material UI's `ThemeProvider` for theming and imports global styles.
- The main UI is structured with an AppBar (top), a centered Container with a Paper card (middle), and a Footer (bottom).
- The Paper card contains the welcome text and two main tool buttons (placeholders).
- The AppBar contains the app name and a theme toggle button.

This structure ensures a clean, professional, and scalable layout for your app.
