# AI Observability Platform - Frontend

This is the frontend for the AI Observability Platform, built with React, TypeScript, and TailwindCSS.

## Features

- **Mock Data Mode**: Works without backend - perfect for demos
- **Live Data Mode**: Connect to backend API for real-time monitoring
- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Dynatrace-inspired dark theme

## Local Development

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm run preview
```

## Deployment

This project is configured for easy deployment on Vercel, Netlify, or any static hosting service.

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Deploy automatically

### Manual Deployment

Build the project and upload the `dist` folder to any static hosting service.

## Environment Variables

No environment variables required - the app works with mock data by default.

For live data mode, configure your backend API URL in the API client.
