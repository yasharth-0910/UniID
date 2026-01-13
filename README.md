## UniID — Smart Campus Identity & Access System

UniID is a unified campus identity platform that enables attendance,
access, and payments using a single RFID-based ID card.

### Key Principle
The card is identity. All intelligence lives on the server.

### Demo Note
RFID interactions are simulated for the hackathon demo.
The backend APIs mirror real RFID reader integration.

### Tech Stack
Next.js 14, Tailwind CSS, Chakra UI, PostgreSQL (Neon.tech)

---

## 🚀 Quick Deploy to Vercel (One Click!)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Add environment variable:
   ```
   DATABASE_URL = postgresql://neondb_owner:npg_Ar4eP3csfbDG@ep-blue-recipe-ah7v9sg7-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Deploy! ✅

That's it! Everything runs on Vercel - frontend AND backend API routes.

---

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local with DATABASE_URL
echo 'DATABASE_URL="postgresql://neondb_owner:npg_Ar4eP3csfbDG@ep-blue-recipe-ah7v9sg7-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"' > .env.local

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tap` | POST | Simulate RFID card tap |
| `/api/students` | GET | Get all students |
| `/api/transactions` | GET | Get all transactions |
| `/api/policies` | GET | Get service policies |
| `/api/reset-demo` | POST | Reset demo data |
| `/reset-demo` | POST | Reset demo data |
