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

### Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Start the backend (in a separate terminal)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Open [http://localhost:3000](http://localhost:3000) to view the application.
