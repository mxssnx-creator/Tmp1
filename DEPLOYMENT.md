# CTS v3 Deployment Guide

## Environment Variables Required

The application requires specific environment variables to function properly in production. All environment variables must be set in your deployment platform (Vercel, Netlify, etc.).

### Required Variables

#### App Configuration
```bash
NEXT_PUBLIC_APP_URL=https://your-deployment-url.com
```
- **Purpose**: Used for API calls, redirects, and WebSocket connections
- **Production**: Set to your actual deployment domain
- **Development**: `http://localhost:3001`

#### Database (Redis)
For production deployment, you must configure external Redis:

**Option 1: Vercel KV (Recommended for Vercel)**
```bash
KV_REST_API_URL=https://your-redis-endpoint.upstash.io
KV_REST_API_TOKEN=your-redis-token
```

**Option 2: Upstash Redis**
```bash
REDIS_URL=redis://default:your-token@your-endpoint.upstash.io:6379
```

**Option 3: Redis Cloud or other providers**
```bash
REDIS_URL=redis://username:password@host:port
```

#### Authentication
```bash
JWT_SECRET=your-very-secure-random-jwt-secret-at-least-32-characters
```

### Optional Variables

#### Exchange API Keys
For live trading functionality:
```bash
BYBIT_API_KEY=your-bybit-api-key
BYBIT_API_SECRET=your-bybit-api-secret
BINGX_API_KEY=your-bingx-api-key
BINGX_API_SECRET=your-bingx-api-secret
```

#### Admin Access
```bash
ADMIN_SECRET=secure-admin-password-for-system-operations
```

## Deployment Steps

### Vercel Deployment

1. **Connect Repository**
   - Import your GitHub repository to Vercel
   - Vercel will automatically detect Next.js

2. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above
   - For `NEXT_PUBLIC_APP_URL`, use your Vercel domain

3. **Redis Setup (Vercel KV)**
   - In Vercel dashboard, go to Storage → Create Database → KV
   - Copy the environment variables provided by Vercel
   - Add them to your project environment variables

4. **Deploy**
   - Push to main branch or trigger manual deployment
   - Vercel will build and deploy automatically

### Troubleshooting Deployment Issues

#### Build Fails
- Check that all dependencies are installed: `bun install`
- Verify TypeScript compilation: `bun run typecheck`
- Check for linting errors: `bun run lint`

#### Runtime Errors
- **Missing NEXT_PUBLIC_APP_URL**: Set to your deployment domain
- **Redis Connection Failed**: Ensure Redis environment variables are correctly set
- **API Route Errors**: Check that environment variables are accessible in server-side code

#### Common Issues
- Environment variables are case-sensitive
- Some platforms require variable names to be uppercase
- Restart deployment after adding new environment variables

## Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in the required values
3. Run `bun run dev`

## Production Checklist

- [ ] NEXT_PUBLIC_APP_URL set correctly
- [ ] Redis database configured and accessible
- [ ] JWT_SECRET set to secure random value
- [ ] Exchange API keys added (if using live trading)
- [ ] Build completes successfully
- [ ] Application loads without runtime errors