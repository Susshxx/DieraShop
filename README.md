# Diera Shop

Nepal-based clothing e-commerce with React frontend and Express + MongoDB backend.

## Project structure

```
DieraShop/
├── frontend/     # React + Vite + TypeScript
├── backend/      # Express + Mongoose + Socket.io
└── package.json  # Root scripts to run both
```

## Setup

### 1. MongoDB Atlas

Create a cluster and copy your connection string into `backend/.env`:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-long-random-secret
PORT=5000
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
ADMIN_SIGNUP_CODE=diera-admin-2026
EMAIL_PROVIDER=console
EMAILJS_SERVICE_ID=
EMAILJS_TEMPLATE_ID=
EMAILJS_PUBLIC_KEY=
EMAILJS_PRIVATE_KEY=
```

### 2. Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/):

1. Create OAuth 2.0 Web Client ID
2. Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
3. Copy Client ID and Secret into `backend/.env`

### 3. Install & seed

```bash
npm run install:all
cp backend/.env.example backend/.env   # then edit values
npm run seed
```

### 4. Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000

## Auth

- **Google**: "Continue with Google" redirects to backend OAuth, then back to `/auth/callback`
- **Email/password**: Signup sends OTP via EmailJS (or logs to console when `EMAIL_PROVIDER=console`)
- **Admin**: `/admin/signup` requires `ADMIN_SIGNUP_CODE` from `.env`

## Features

- MongoDB-native image storage (Base64 site images, product images in DB)
- Real-time chat & notifications via Socket.io
- Global search with MongoDB text index
- Admin inline image editing (`EditableImage` component)
- NPR currency, light pink theme with theme switcher
