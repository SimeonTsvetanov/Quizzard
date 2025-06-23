<div align="center">

# 🧠 Quizzard

### **AI-Powered Quiz Management Platform**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20App-blue?style=for-the-badge&logo=github)](https://simeontsvetanov.github.io/quizzard/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-green?style=for-the-badge&logo=pwa)](https://simeontsvetanov.github.io/quizzard/)
[![React](https://img.shields.io/badge/React-18.0+-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.0+-blue?style=for-the-badge&logo=mui)](https://mui.com/)

**A comprehensive quiz creation and management platform with AI-powered question generation, team building tools, and scoring systems.**

[🚀 **Try Quizzard Now**](https://simeontsvetanov.github.io/quizzard/) | [📧 **Contact Creator**](mailto:tsvetanov.simeon@gmail.com) | [🐛 **Report Issues**](https://github.com/SimeonTsvetanov/Quizzard/issues)

---

</div>

## 📋 Table of Contents

- [🌟 About Quizzard](#-about-quizzard)
- [🎯 Core Features](#-core-features)
- [🛠️ Tools Overview](#️-tools-overview)
- [🚀 Quick Start](#-quick-start)
- [💻 Tech Stack](#-tech-stack)
- [📱 PWA Features](#-pwa-features)
- [🎨 UI/UX Features](#-uiux-features)
- [🔧 Development](#-development)
- [📦 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📞 Support](#-support)
- [📄 License](#-license)

---

## 🌟 About Quizzard

**Quizzard** is a modern, AI-powered quiz management platform designed for quiz nights, educational institutions, and team-building events. Built as a Progressive Web App (PWA), it provides a seamless experience across all devices with offline capabilities and professional-grade features.

### 🎯 **Primary Focus: Quiz Creation & Management**

The platform's core strength lies in its comprehensive **quiz creation system** that allows users to build professional quizzes with AI assistance, manage rounds and questions, and export content for presentations.

---

## 🎯 Core Features

### 📚 **Advanced Quiz Creation System**
- **🎨 Visual Quiz Wizard** - Intuitive 2-step creation process
- **🤖 AI-Powered Questions** - Google Gemini AI integration for intelligent question generation
- **📊 Round Management** - Organize questions into themed rounds with custom settings
- **⏱️ Time Controls** - Flexible timing for questions and breaks
- **💾 Auto-Save** - IndexedDB storage with 30-second auto-save intervals
- **📱 Mobile-Optimized** - Touch-friendly interface for all devices

### 🎮 **Quiz Types & Formats**
- **Mixed Questions** - Single answer and multiple choice in one round
- **Picture Rounds** - Image-based questions (Phase 3 ready)
- **Audio Rounds** - Sound-based questions (Phase 3 ready)
- **Video Rounds** - Video-based questions (Phase 3 ready)
- **Golden Pyramid** - Progressive answer structure (1→2→3→4 correct answers)

### 🏆 **Professional Features**
- **📊 Export System** - PowerPoint export functionality (Phase 3)
- **🎯 Difficulty Levels** - Easy, Medium, Hard, and Random settings
- **🌍 Multilingual** - English and Bulgarian language support
- **📈 Analytics** - Quiz statistics and performance tracking
- **🔄 Version Control** - Draft management and revision history

---

## 🛠️ Tools Overview

### 🧠 **Final Question Generator** *(Secondary Tool)*
AI-powered question generation for quick quiz content:
- **🤖 Google Gemini AI** - Intelligent question creation
- **🎯 Category Selection** - Custom topics or random selection
- **🌍 Multilingual** - English and Bulgarian support
- **⏱️ Rate Limiting** - 15 requests/minute with smart queuing
- **📱 Offline Detection** - Graceful degradation when offline

### 👥 **Random Team Generator** *(Secondary Tool)*
Professional team building for events:
- **👤 Participant Management** - Add, edit, and organize participants
- **🎲 Smart Distribution** - Algorithm-based team balancing
- **🎮 Cheat Codes** - Easter egg functionality ("the followers")
- **📋 Clipboard Export** - One-click team copying
- **💾 Persistent Storage** - Cross-session participant saving

### 🏆 **Points Counter** *(Secondary Tool)*
Real-time scoring system for quiz competitions:
- **👥 Team Management** - Dynamic team creation and management
- **📊 Live Scoring** - Real-time point tracking and updates
- **🏅 Leaderboard** - Dynamic ranking with tie-breakers
- **🎮 Game Controls** - Start, pause, end game functionality
- **💾 Auto-Save** - Persistent game state across sessions

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Google Gemini API key** (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/SimeonTsvetanov/Quizzard.git
cd Quizzard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your VITE_GEMINI_API_KEY

# Start development server
npm run dev
```

### Environment Setup

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Get your Gemini API key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

---

## 💻 Tech Stack

### **Frontend Framework**
- **React 18** - Modern component-based architecture
- **TypeScript 5.0+** - Type-safe development
- **Material-UI (MUI) 5.0+** - Professional design system
- **React Router 6** - Client-side routing with BrowserRouter

### **Build & Development**
- **Vite 5.0+** - Fast build tool and dev server
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

### **Storage & State Management**
- **IndexedDB** - Client-side database for quiz storage
- **localStorage** - Cross-session persistence
- **React Hooks** - Custom state management
- **Context API** - Global state management

### **PWA & Performance**
- **Service Worker** - Offline functionality and caching
- **Web App Manifest** - PWA installation support
- **Lazy Loading** - Route-based code splitting
- **Bundle Optimization** - Tree shaking and minification

### **AI & External Services**
- **Google Gemini API** - AI question generation
- **Rate Limiting** - Client-side request management
- **Error Handling** - Graceful degradation

### **Deployment & Hosting**
- **GitHub Pages** - Static site hosting
- **GitHub Actions** - Automated deployment workflow
- **PWA Support** - Full progressive web app capabilities

---

## 📱 PWA Features

### **Installation & Offline**
- **📱 Installable** - Add to home screen on all devices
- **🔄 Offline Support** - Works without internet connection
- **⚡ Fast Loading** - Service worker caching
- **🔄 Auto-Updates** - Seamless version updates

### **Mobile Optimization**
- **📱 Responsive Design** - Perfect on all screen sizes
- **👆 Touch-Friendly** - Optimized for mobile interaction
- **🎨 Native Feel** - App-like experience
- **🔒 Secure** - HTTPS and secure storage

---

## 🎨 UI/UX Features

### **Design System**
- **🎨 Material Design 3** - Modern, accessible design
- **🌙 Dark/Light Themes** - User preference support
- **📱 Responsive Layout** - 320px to 7680px support
- **♿ Accessibility** - WCAG AA compliance

### **User Experience**
- **🚀 Fast Navigation** - Instant page transitions
- **💾 Auto-Save** - Never lose work
- **🎯 Intuitive Interface** - Self-explanatory design
- **📊 Visual Feedback** - Clear status indicators

---

## 🔧 Development

### **Project Structure**
```
src/
├── features/           # Feature-based architecture
│   ├── quizzes/       # Main quiz platform
│   ├── final-question/ # AI question generator
│   ├── points-counter/ # Scoring system
│   └── random-team-generator/ # Team builder
├── shared/            # Shared components & utilities
├── pages/             # Route components
└── theme.ts           # Material-UI theme
```

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

---

## 📦 Deployment

### **Automatic Deployment**
The app automatically deploys to GitHub Pages when changes are pushed to the main branch.

### **Manual Deployment**
```bash
npm run build
npm run deploy
```

### **Environment Variables**
- **Development**: `http://localhost:5173`
- **Production**: `https://simeontsvetanov.github.io/quizzard/`

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Standards**
- Follow the established code style and architecture
- Add comprehensive JSDoc documentation
- Include TypeScript types for all new features
- Test thoroughly before submitting

---

## 📞 Support

### **Creator Information**
- **👨‍💻 Creator**: Simeon Tsvetanov
- **📧 Email**: [tsvetanov.simeon@gmail.com](mailto:tsvetanov.simeon@gmail.com)
- **🐛 Issues**: [GitHub Issues](https://github.com/SimeonTsvetanov/Quizzard/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/SimeonTsvetanov/Quizzard/discussions)

### **Support the Project**
This project is developed and maintained for free. If you find it useful, please consider supporting the development:

[☕ **Buy Me a Coffee**](https://www.buymeacoffee.com/simeontsvetanov)

Your support helps maintain and improve Quizzard for everyone!

### **Common Issues**

**API Rate Limits**
- Free tier: 15 requests/minute
- Wait between requests or upgrade to paid tier

**PWA Installation Issues**
- Ensure HTTPS is enabled
- Clear browser cache and try again
- Check browser PWA support

**Build Errors**
- Verify all environment variables are set
- Run `npm install` to update dependencies
- Check TypeScript errors with `npm run type-check`

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by [Simeon Tsvetanov](mailto:tsvetanov.simeon@gmail.com)**

[🚀 **Try Quizzard Now**](https://simeontsvetanov.github.io/quizzard/) | [📧 **Contact Creator**](mailto:tsvetanov.simeon@gmail.com) | [🐛 **Report Issues**](https://github.com/SimeonTsvetanov/Quizzard/issues)

</div> 