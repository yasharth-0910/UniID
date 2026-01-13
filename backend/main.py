from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = FastAPI(
    title="UniID API",
    description="Smart Campus Identity & Access System Backend",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection string
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_Ar4eP3csfbDG@ep-blue-recipe-ah7v9sg7-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
)


# ==================== MODELS ====================

class TapRequest(BaseModel):
    rfid_uid: str
    service: str


class TapResponse(BaseModel):
    success: bool
    student: str
    service: str
    action: str
    balance_remaining: float
    amount_deducted: Optional[float] = None


class Student(BaseModel):
    id: int
    name: str
    roll_no: str
    rfid_uid: str
    wallet_balance: float
    status: str


class Transaction(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    service_type: str
    amount: float
    timestamp: datetime


class Policy(BaseModel):
    service_type: str
    cost: float
    requires_payment: bool


# ==================== DATABASE FUNCTIONS ====================

def get_db_connection():
    """Create a database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None


def init_database():
    """Initialize database tables and seed data"""
    conn = get_db_connection()
    if not conn:
        print("Could not connect to database for initialization")
        return False
    
    try:
        cur = conn.cursor()
        
        # Create students table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                roll_no VARCHAR(50) UNIQUE NOT NULL,
                rfid_uid VARCHAR(50) UNIQUE NOT NULL,
                wallet_balance DECIMAL(10, 2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'active'
            )
        """)
        
        # Create transactions table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id),
                service_type VARCHAR(50) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create policies table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS policies (
                service_type VARCHAR(50) PRIMARY KEY,
                cost DECIMAL(10, 2) NOT NULL,
                requires_payment BOOLEAN DEFAULT FALSE
            )
        """)
        
        # Check if we need to seed data
        cur.execute("SELECT COUNT(*) as count FROM students")
        result = cur.fetchone()
        
        if result['count'] == 0:
            # Seed students
            students_data = [
                ('Yasharth Singh', 'ROLL001', 'RFID_001', 500),
                ('Mohammad Ali', 'ROLL002', 'RFID_002', 300),
                ('Vaibhav Katariya', 'ROLL003', 'RFID_003', 200),
                ('Saniya Khan', 'ROLL004', 'RFID_004', 400),
            ]
            
            for name, roll_no, rfid_uid, balance in students_data:
                cur.execute(
                    """INSERT INTO students (name, roll_no, rfid_uid, wallet_balance) 
                       VALUES (%s, %s, %s, %s) ON CONFLICT (rfid_uid) DO NOTHING""",
                    (name, roll_no, rfid_uid, balance)
                )
            
            # Seed policies
            policies_data = [
                ('attendance', 0, False),
                ('library', 0, False),
                ('mess', 50, True),
                ('transport', 20, True),
            ]
            
            for service_type, cost, requires_payment in policies_data:
                cur.execute(
                    """INSERT INTO policies (service_type, cost, requires_payment) 
                       VALUES (%s, %s, %s) ON CONFLICT (service_type) DO NOTHING""",
                    (service_type, cost, requires_payment)
                )
        
        conn.commit()
        cur.close()
        conn.close()
        print("Database initialized successfully")
        return True
        
    except Exception as e:
        print(f"Database initialization error: {e}")
        conn.rollback()
        conn.close()
        return False


# ==================== POLICY ENGINE ====================

def get_policy(service_type: str) -> Optional[dict]:
    """Get policy for a service type"""
    conn = get_db_connection()
    if not conn:
        # Fallback to default policies
        default_policies = {
            'attendance': {'service_type': 'attendance', 'cost': 0, 'requires_payment': False},
            'library': {'service_type': 'library', 'cost': 0, 'requires_payment': False},
            'mess': {'service_type': 'mess', 'cost': 50, 'requires_payment': True},
            'transport': {'service_type': 'transport', 'cost': 20, 'requires_payment': True},
        }
        return default_policies.get(service_type.lower())
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM policies WHERE service_type = %s", (service_type.lower(),))
        policy = cur.fetchone()
        cur.close()
        conn.close()
        return dict(policy) if policy else None
    except Exception as e:
        print(f"Error getting policy: {e}")
        conn.close()
        return None


def check_permission(student: dict, service_type: str) -> tuple[bool, str]:
    """Check if a student has permission to use a service"""
    # Check if student is active
    if student.get('status') != 'active':
        return False, "Student account is not active"
    
    # Get policy
    policy = get_policy(service_type)
    if not policy:
        return False, f"Unknown service: {service_type}"
    
    # Check wallet balance if payment required
    if policy['requires_payment']:
        if float(student.get('wallet_balance', 0)) < float(policy['cost']):
            return False, "Insufficient Balance"
    
    return True, "Access Granted" if not policy['requires_payment'] else "Payment Approved"


# ==================== WALLET LOGIC (UNIPAY) ====================

def debit_wallet(student_id: int, amount: float, service_type: str) -> bool:
    """Debit amount from student wallet and log transaction"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        # Update wallet balance
        cur.execute(
            """UPDATE students 
               SET wallet_balance = wallet_balance - %s 
               WHERE id = %s AND wallet_balance >= %s
               RETURNING wallet_balance""",
            (amount, student_id, amount)
        )
        
        result = cur.fetchone()
        if not result:
            conn.rollback()
            cur.close()
            conn.close()
            return False
        
        # Log transaction
        cur.execute(
            """INSERT INTO transactions (student_id, service_type, amount) 
               VALUES (%s, %s, %s)""",
            (student_id, service_type, amount)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Wallet debit error: {e}")
        conn.rollback()
        conn.close()
        return False


def get_student_balance(student_id: int) -> float:
    """Get current wallet balance for a student"""
    conn = get_db_connection()
    if not conn:
        return 0
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT wallet_balance FROM students WHERE id = %s", (student_id,))
        result = cur.fetchone()
        cur.close()
        conn.close()
        return float(result['wallet_balance']) if result else 0
    except Exception as e:
        print(f"Error getting balance: {e}")
        conn.close()
        return 0


# ==================== API ENDPOINTS ====================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_database()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "UniID API - Smart Campus Identity & Access System",
        "version": "1.0.0",
        "endpoints": {
            "tap": "POST /tap - Simulate RFID card tap",
            "students": "GET /students - Get all students",
            "transactions": "GET /transactions - Get all transactions",
            "policies": "GET /policies - Get all policies"
        }
    }


@app.post("/tap", response_model=TapResponse)
async def handle_tap(request: TapRequest):
    """
    Handle RFID card tap
    
    This endpoint:
    1. Validates the RFID UID against the student database
    2. Checks the policy for the requested service
    3. Verifies permissions and wallet balance
    4. Debits wallet if required
    5. Returns the action result
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cur = conn.cursor()
        
        # Step 1: Identity Verification
        cur.execute("SELECT * FROM students WHERE rfid_uid = %s", (request.rfid_uid,))
        student = cur.fetchone()
        
        if not student:
            cur.close()
            conn.close()
            return TapResponse(
                success=False,
                student="Unknown",
                service=request.service.capitalize(),
                action="Invalid Card - Identity Not Found",
                balance_remaining=0
            )
        
        student = dict(student)
        
        # Step 2: Policy & Permission Check
        allowed, action_message = check_permission(student, request.service)
        
        if not allowed:
            cur.close()
            conn.close()
            return TapResponse(
                success=False,
                student=student['name'],
                service=request.service.capitalize(),
                action=action_message,
                balance_remaining=float(student['wallet_balance'])
            )
        
        # Step 3: Get policy for amount
        policy = get_policy(request.service)
        amount_deducted = None
        
        # Step 4: Wallet debit if required
        if policy and policy['requires_payment'] and float(policy['cost']) > 0:
            amount = float(policy['cost'])
            success = debit_wallet(student['id'], amount, request.service)
            
            if not success:
                cur.close()
                conn.close()
                return TapResponse(
                    success=False,
                    student=student['name'],
                    service=request.service.capitalize(),
                    action="Transaction Failed",
                    balance_remaining=float(student['wallet_balance'])
                )
            
            amount_deducted = amount
        else:
            # Log free service access as transaction with 0 amount
            cur.execute(
                """INSERT INTO transactions (student_id, service_type, amount) 
                   VALUES (%s, %s, %s)""",
                (student['id'], request.service, 0)
            )
            conn.commit()
        
        # Get updated balance
        new_balance = get_student_balance(student['id'])
        
        cur.close()
        conn.close()
        
        return TapResponse(
            success=True,
            student=student['name'],
            service=request.service.capitalize(),
            action=action_message,
            balance_remaining=new_balance,
            amount_deducted=amount_deducted
        )
        
    except Exception as e:
        print(f"Tap handling error: {e}")
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/students", response_model=List[Student])
async def get_students():
    """Get all students"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM students ORDER BY id")
        students = cur.fetchall()
        cur.close()
        conn.close()
        return [dict(s) for s in students]
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/students/{rfid_uid}")
async def get_student_by_rfid(rfid_uid: str):
    """Get student by RFID UID"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM students WHERE rfid_uid = %s", (rfid_uid,))
        student = cur.fetchone()
        cur.close()
        conn.close()
        
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        return dict(student)
    except HTTPException:
        raise
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/transactions", response_model=List[Transaction])
async def get_transactions():
    """Get all transactions with student names"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT t.*, s.name as student_name 
            FROM transactions t 
            JOIN students s ON t.student_id = s.id 
            ORDER BY t.timestamp DESC
            LIMIT 100
        """)
        transactions = cur.fetchall()
        cur.close()
        conn.close()
        return [dict(t) for t in transactions]
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/policies", response_model=List[Policy])
async def get_policies():
    """Get all service policies"""
    conn = get_db_connection()
    if not conn:
        # Return default policies
        return [
            Policy(service_type='attendance', cost=0, requires_payment=False),
            Policy(service_type='library', cost=0, requires_payment=False),
            Policy(service_type='mess', cost=50, requires_payment=True),
            Policy(service_type='transport', cost=20, requires_payment=True),
        ]
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM policies ORDER BY service_type")
        policies = cur.fetchall()
        cur.close()
        conn.close()
        return [dict(p) for p in policies]
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reset-demo")
async def reset_demo_data():
    """Reset demo data to initial state"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cur = conn.cursor()
        
        # Reset wallet balances
        demo_balances = [
            ('RFID_001', 500),
            ('RFID_002', 300),
            ('RFID_003', 200),
            ('RFID_004', 400),
        ]
        
        for rfid_uid, balance in demo_balances:
            cur.execute(
                "UPDATE students SET wallet_balance = %s WHERE rfid_uid = %s",
                (balance, rfid_uid)
            )
        
        # Clear transactions
        cur.execute("DELETE FROM transactions")
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {"message": "Demo data reset successfully"}
        
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
