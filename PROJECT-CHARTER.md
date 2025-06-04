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
- **Structure:**
  - Each main tool (Random Team Generator, Points Counter, etc.) is a separate feature/project
  - Landing page (main) lists all tools as primary navigation/entry points
- **Hosting:**
  - Hosted on GitHub Pages
  - Auto-update via GitHub Actions (to be set up)
- **Database:**
  - Plan for persistent storage (Points Counter, future features)
  - Use local storage or IndexedDB for now; design for easy migration

### 2. Progress Tracker

- [ ] Project initialized (React + TypeScript + MUI)
- [ ] All base styles and themes complete
- [ ] Landing page with navigation to tools
- [ ] Random Team Generator (placeholder)
- [ ] Points Counter (placeholder)
- [ ] Responsive, pixel-perfect layout
- [ ] GitHub Pages deploy set up
- [ ] Auto-update workflow

#### **Main Tools (Landing Page)**

- [ ] Random Team Generator (future: full feature)
- [ ] Points Counter (future: full feature)
- [ ] (Add more tools here as needed)

### 3. Main Points & Priorities

- Professional, minimal, and consistent UI/UX
- All styles and themes ready before features
- No unnecessary dependencies or folders
- Device consistency is mandatory
- Landing page is the current focus

### 4. Change Log / Decisions

- **2025-06-04:** Project charter created. Decided to focus on landing page and tool placeholders first. All styles/themes must be ready before feature work.

---

**Always update this file with new rules, progress, and decisions. This is the single source of truth for the project.**

**AI/Automation Workflow Rule:**

- This file must be referenced and updated after every significant project change, decision, or milestone.
- If using an AI assistant, always instruct it to check and update this file as part of your workflow.
- Pin this file in your editor for visibility, but also make it a habit to review and update it regularly.
