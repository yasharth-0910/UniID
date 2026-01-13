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
    // Create students table with academic fields
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        roll_no VARCHAR(50) UNIQUE NOT NULL,
        rfid_uid VARCHAR(50) UNIQUE NOT NULL,
        wallet_balance DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        branch VARCHAR(20),
        section VARCHAR(10),
        program VARCHAR(20),
        year INTEGER
      )
    `);

    // Add academic columns if they don't exist (for existing databases)
    try {
      await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS branch VARCHAR(20)`);
      await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(10)`);
      await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS program VARCHAR(20)`);
      await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS year INTEGER`);
    } catch {
      // Columns might already exist, ignore error
    }

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

    // Create attendance table
    await query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        date DATE DEFAULT CURRENT_DATE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        service_context VARCHAR(50) DEFAULT 'general'
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
      // Seed students with academic details
      const studentsData = [
        ['Yasharth Singh', 'ROLL001', 'RFID_001', 500, 'CSE', 'F3', 'B.Tech', 3],
        ['Mohammad Ali', 'ROLL002', 'RFID_002', 300, 'CSE', 'F5', 'B.Tech', 2],
        ['Vaibhav Katariya', 'ROLL003', 'RFID_003', 200, 'ECS', 'E15', 'B.Tech', 3],
        ['Saniya Khan', 'ROLL004', 'RFID_004', 400, 'CSE', 'F1', 'B.Sc', 1],
      ];

      for (const [name, roll_no, rfid_uid, balance, branch, section, program, year] of studentsData) {
        await query(
          `INSERT INTO students (name, roll_no, rfid_uid, wallet_balance, branch, section, program, year) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (rfid_uid) DO NOTHING`,
          [name, roll_no, rfid_uid, balance, branch, section, program, year]
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
    } else {
      // Update existing students with academic details if missing
      const updateData = [
        ['RFID_001', 'CSE', 'F3', 'B.Tech', 3],
        ['RFID_002', 'CSE', 'F5', 'B.Tech', 2],
        ['RFID_003', 'ECS', 'E15', 'B.Tech', 3],
        ['RFID_004', 'CSE', 'F1', 'B.Sc', 1],
      ];

      for (const [rfid_uid, branch, section, program, year] of updateData) {
        await query(
          `UPDATE students SET branch = $2, section = $3, program = $4, year = $5 
           WHERE rfid_uid = $1 AND (branch IS NULL OR branch = '')`,
          [rfid_uid, branch, section, program, year]
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

// Log attendance
export async function logAttendance(studentId: number, serviceContext: string = 'general'): Promise<boolean> {
  try {
    await query(
      `INSERT INTO attendance (student_id, service_context) VALUES ($1, $2)`,
      [studentId, serviceContext]
    );
    return true;
  } catch (error) {
    console.error('Attendance log error:', error);
    return false;
  }
}

// Get attendance records
export async function getAttendanceRecords(filters?: {
  branch?: string;
  section?: string;
  program?: string;
  year?: number;
}) {
  let queryText = `
    SELECT a.*, s.name as student_name, s.rfid_uid, s.branch, s.section, s.program, s.year
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.branch) {
    queryText += ` AND s.branch = $${paramIndex}`;
    params.push(filters.branch);
    paramIndex++;
  }
  if (filters?.section) {
    queryText += ` AND s.section = $${paramIndex}`;
    params.push(filters.section);
    paramIndex++;
  }
  if (filters?.program) {
    queryText += ` AND s.program = $${paramIndex}`;
    params.push(filters.program);
    paramIndex++;
  }
  if (filters?.year) {
    queryText += ` AND s.year = $${paramIndex}`;
    params.push(filters.year);
    paramIndex++;
  }

  queryText += ` ORDER BY a.timestamp DESC LIMIT 100`;

  return await query(queryText, params);
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
