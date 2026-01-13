## UniID — Smart Campus Identity & Access System

UniID is a unified campus identity platform that enables attendance,
access, and payments using a single RFID-based ID card.

### Key Principle
The card is identity. All intelligence lives on the server.

### Demo Note
RFID interactions are simulated for the hackathon demo.
The backend APIs mirror real RFID reader integration.

### Tech Stack
Next.js, Tailwind CSS, Chakra UI, FastAPI, PostgreSQL (Neon.tech)

### Getting Started (Local Development)

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Start the backend (in a separate terminal)
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🚀 Deployment Guide

### Option 1: Deploy Frontend to Vercel + Backend to Railway

#### Step 1: Deploy Backend to Railway

1. Go to [Railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account and select this repository
4. Set the root directory to `backend`
5. Add environment variable:
   - `DATABASE_URL` = `postgresql://neondb_owner:npg_Ar4eP3csfbDG@ep-blue-recipe-ah7v9sg7-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`
6. Deploy! Copy the generated URL (e.g., `https://uniid-backend.up.railway.app`)

#### Step 2: Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign up/login
2. Click "Add New" → "Project" → Import from GitHub
3. Select this repository
4. Set environment variable:
   - `NEXT_PUBLIC_API_URL` = Your Railway backend URL from Step 1
5. Deploy!

### Option 2: Deploy Both to Render

#### Backend
1. Go to [Render.com](https://render.com) → New Web Service
2. Connect GitHub and select this repo
3. Set root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `DATABASE_URL`

#### Frontend
1. New Static Site on Render
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variable: `NEXT_PUBLIC_API_URL`

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```
DATABASE_URL=postgresql://neondb_owner:npg_Ar4eP3csfbDG@ep-blue-recipe-ah7v9sg7-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/tap` | POST | Simulate RFID card tap |
| `/students` | GET | Get all students |
| `/transactions` | GET | Get all transactions |
| `/policies` | GET | Get service policies |
| `/reset-demo` | POST | Reset demo data |
