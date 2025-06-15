# 🧠 Quizzard - AI-Powered Quiz Application

A modern Progressive Web App (PWA) built with React, TypeScript, and Material-UI that generates quiz questions using Google Gemini AI.

## ✨ Features

- **AI-Powered Question Generation** - Uses Google Gemini AI for intelligent question creation
- **Multilingual Support** - English and Bulgarian language options
- **Difficulty Levels** - Easy, Medium, Hard, and Random difficulty settings
- **Category Selection** - Custom categories or random topic selection
- **Progressive Web App** - Installable with offline capabilities
- **Modern UI** - Clean, responsive design with Material-UI components
- **Real-time Status** - Online/offline detection with connection status

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Quizzard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   **Get your Gemini API key:**

   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
   - Copy the key to your `.env` file

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

| Variable              | Description                                      | Required |
| --------------------- | ------------------------------------------------ | -------- |
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI question generation | Yes      |

### API Limits

The app uses Google Gemini's free tier:

- **15 requests per minute**
- **1 million tokens per day**
- Perfect for personal use and small teams

## 🏗️ Build & Deploy

### Development Build

```bash
npm run build
```

### Production Deployment

The app automatically deploys to GitHub Pages when changes are pushed to the main branch.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Material-UI
- **Build Tool**: Vite
- **AI Service**: Google Gemini API
- **PWA**: Service Worker, Web App Manifest
- **Deployment**: GitHub Pages

## 📱 PWA Features

- **Installable** - Add to home screen on mobile devices
- **Offline Detection** - Shows connection status
- **Service Worker** - Caches static assets for faster loading

## 🌐 Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with PWA support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**"Internet connection required"**

- Check your internet connection
- Verify your Gemini API key is correct
- Ensure the API key has proper permissions

**API Rate Limits**

- Free tier allows 15 requests/minute
- Wait a moment before generating more questions
- Consider upgrading to paid tier for higher limits

**Build Errors**

- Ensure all environment variables are set
- Run `npm install` to update dependencies
- Check TypeScript errors with `npm run type-check`
