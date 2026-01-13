import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Initialize database tables
export async function initDatabase() {
  try {
    // Create students table
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        roll_no VARCHAR(50) UNIQUE NOT NULL,
        rfid_uid VARCHAR(50) UNIQUE NOT NULL,
        wallet_balance DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active'
      )
    `);

    // Create transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        service_type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create policies table
    await query(`
      CREATE TABLE IF NOT EXISTS policies (
        service_type VARCHAR(50) PRIMARY KEY,
        cost DECIMAL(10, 2) NOT NULL,
        requires_payment BOOLEAN DEFAULT FALSE
      )
    `);

    // Check if we need to seed data
    const result = await query('SELECT COUNT(*) as count FROM students');
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      // Seed students
      const studentsData = [
        ['Yasharth Singh', 'ROLL001', 'RFID_001', 500],
        ['Mohammad Ali', 'ROLL002', 'RFID_002', 300],
        ['Vaibhav Katariya', 'ROLL003', 'RFID_003', 200],
        ['Saniya Khan', 'ROLL004', 'RFID_004', 400],
      ];

      for (const [name, roll_no, rfid_uid, balance] of studentsData) {
        await query(
          `INSERT INTO students (name, roll_no, rfid_uid, wallet_balance) 
           VALUES ($1, $2, $3, $4) ON CONFLICT (rfid_uid) DO NOTHING`,
          [name, roll_no, rfid_uid, balance]
        );
      }

      // Seed policies
      const policiesData = [
        ['attendance', 0, false],
        ['library', 0, false],
        ['mess', 50, true],
        ['transport', 20, true],
      ];

      for (const [service_type, cost, requires_payment] of policiesData) {
        await query(
          `INSERT INTO policies (service_type, cost, requires_payment) 
           VALUES ($1, $2, $3) ON CONFLICT (service_type) DO NOTHING`,
          [service_type, cost, requires_payment]
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

// Get policy for a service
export async function getPolicy(serviceType: string) {
  const defaultPolicies: Record<string, { service_type: string; cost: number; requires_payment: boolean }> = {
    attendance: { service_type: 'attendance', cost: 0, requires_payment: false },
    library: { service_type: 'library', cost: 0, requires_payment: false },
    mess: { service_type: 'mess', cost: 50, requires_payment: true },
    transport: { service_type: 'transport', cost: 20, requires_payment: true },
  };

  try {
    const result = await query('SELECT * FROM policies WHERE service_type = $1', [serviceType.toLowerCase()]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return defaultPolicies[serviceType.toLowerCase()] || null;
  } catch {
    return defaultPolicies[serviceType.toLowerCase()] || null;
  }
}

// Check permission
export function checkPermission(
  student: { status: string; wallet_balance: number | string },
  policy: { requires_payment: boolean; cost: number | string }
): { allowed: boolean; message: string } {
  if (student.status !== 'active') {
    return { allowed: false, message: 'Student account is not active' };
  }

  const balance = parseFloat(String(student.wallet_balance));
  const cost = parseFloat(String(policy.cost));

  if (policy.requires_payment && balance < cost) {
    return { allowed: false, message: 'Insufficient Balance' };
  }

  return {
    allowed: true,
    message: policy.requires_payment ? 'Payment Approved' : 'Access Granted',
  };
}

// Debit wallet
export async function debitWallet(studentId: number, amount: number, serviceType: string): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE students 
       SET wallet_balance = wallet_balance - $1 
       WHERE id = $2 AND wallet_balance >= $1
       RETURNING wallet_balance`,
      [amount, studentId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    await query(
      `INSERT INTO transactions (student_id, service_type, amount) VALUES ($1, $2, $3)`,
      [studentId, serviceType, amount]
    );

    return true;
  } catch (error) {
    console.error('Wallet debit error:', error);
    return false;
  }
}

export default pool;
