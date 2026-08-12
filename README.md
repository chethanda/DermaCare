# 🏥 DermaCare Skin Care Hospital Application

A complete full-stack web application for a luxury Dermatology & Skin Care Hospital with user authentication, live camera selfie snapshot diagnostic upload, exact GPS geolocation (Latitude/Longitude) tracking, Node.js REST API, and Supabase PostgreSQL database integration.

---

## 📁 Repository Architecture

```
.
├── package.json          👈 Monorepo root manager (Run both frontend & backend concurrently)
├── vercel.json           👈 Vercel SPA deployment configuration
├── supabase.sql          👈 Database SQL schema script for Supabase
├── backend/              👈 Node.js + Express REST API (Production ready for Render)
│   ├── server.js
│   ├── package.json
│   ├── render.yaml       👈 Render 1-Click Web Service Blueprint
│   ├── .env.example
│   └── .env
├── frontend/             👈 React + Vite + Tailwind SPA (Production ready for Vercel)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   ├── .env.example
│   └── .env
└── README.md
```

---

## ⚡ Quick Start (Local Environment)

To run **both Frontend and Backend concurrently** on your local machine with a single command:

1. **Install all dependencies** (root, backend, and frontend):
   ```bash
   npm run install-all
   ```

2. **Start the local development environment**:
   ```bash
   npm run dev
   ```
   - 🚀 **Backend API**: Runs at [http://localhost:5000](http://localhost:5000)
   - 📡 **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - 💻 **Frontend App**: Opens at [http://localhost:3000](http://localhost:3000)

---

## 🚀 Production Hosting Guide

### 1. Database Hosting (Supabase)

1. Log in to [Supabase Console](https://app.supabase.com/) and create a new project.
2. Open the **SQL Editor** tab in your Supabase dashboard.
3. Copy and run the entire contents of [supabase.sql](file:///c:/Users/Chethan/Downloads/DermaCare-Hospital-main/DermaCare-Hospital-main/supabase.sql).
4. Navigate to **Project Settings -> API** and copy your **Project URL** (`SUPABASE_URL`) and **Anon API Key** (`SUPABASE_KEY`).

---

### 2. Backend Hosting (Render)

1. Log in to [Render Console](https://dashboard.render.com/).
2. Click **New +** -> **Web Service** and connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `dermacare-backend-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Set Environment Variables under **Environment**:
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_KEY`: `your-supabase-anon-key`
   - `PORT`: `5000` (Render will automatically assign its external port)
5. Click **Create Web Service**. Save your live Render URL (e.g. `https://dermacare-backend-api.onrender.com`).

---

### 3. Frontend Hosting (Vercel)

1. Log in to [Vercel Console](https://vercel.com).
2. Click **Add New** -> **Project** and import your repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `frontend` (or leave as root `/`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable under **Environment Variables**:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://dermacare-backend-api.onrender.com` (Your Render Backend URL)
5. Click **Deploy**. Vercel will build and host your production React SPA.

---

## ✨ Key Features

1. **Luxury Dermatology UI**: Custom Teal, Gold, and Emerald palette with responsive glassmorphism containers.
2. **User Registration & Login**: Full auth flow with persistent session storage.
3. **Live Camera Selfie Capture**: Takes real-time webcam photos for dermatology assessments with instant preview and retake option.
4. **GPS Latitude & Longitude Location**: Fetches exact HTML5 geolocation coordinates with Google Maps pin integration.
5. **Real-time Database Connection**: Synchronizes appointments and doctors with Supabase PostgreSQL, with seamless local memory fallback mode.
