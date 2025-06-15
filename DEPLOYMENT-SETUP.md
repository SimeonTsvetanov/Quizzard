# Deployment Setup Guide

## GitHub Pages Deployment with Gemini AI Integration

This guide explains how to set up the deployment for the Quizzard PWA with Google Gemini AI integration.

### Prerequisites

1. Google Gemini API Key
2. GitHub repository with Pages enabled
3. GitHub Actions enabled

### Setup Instructions

#### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key (starts with `AIzaSy...`)

#### 2. Configure GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `VITE_GEMINI_API_KEY`
5. Value: Your Google Gemini API key
6. Click **Add secret**

#### 3. Verify Deployment

1. Push changes to the `main` branch
2. Check the **Actions** tab for deployment status
3. Once deployed, visit your GitHub Pages URL
4. The Final Question tool should show "Online - AI Ready" status

### Troubleshooting

#### API Key Not Working

- Verify the secret name is exactly `VITE_GEMINI_API_KEY`
- Check that the API key is valid and has Gemini API access
- Ensure the key hasn't expired or reached quota limits

#### Deployment Fails

- Check the Actions logs for specific error messages
- Verify all dependencies are properly installed
- Ensure the build process completes successfully

#### App Shows "AI service temporarily unavailable"

- This indicates the API key is not properly configured
- Double-check the GitHub secret configuration
- Redeploy after fixing the secret

### Environment Variables

The app uses the following environment variables:

- `VITE_GEMINI_API_KEY`: Google Gemini API key (required for AI features)

### Security Notes

- API keys are securely stored as GitHub secrets
- Keys are only exposed during the build process
- Production builds do not log sensitive information
- Rate limiting is implemented to prevent API abuse

### Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your internet connection
3. Ensure the API key has proper permissions
4. Contact support if problems persist
