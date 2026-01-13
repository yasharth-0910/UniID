import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

let initialized = false;

export async function GET(request: NextRequest) {
  try {
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const { searchParams } = new URL(request.url);
    const rfid_uid = searchParams.get('rfid_uid');

    if (rfid_uid) {
      // Get specific student by RFID
      const result = await query(
        'SELECT id, name, roll_no, rfid_uid, wallet_balance, status, branch, section, program, year FROM students WHERE rfid_uid = $1',
        [rfid_uid]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Also get last attendance
      const attendanceResult = await query(
        'SELECT timestamp FROM attendance WHERE student_id = $1 ORDER BY timestamp DESC LIMIT 1',
        [result.rows[0].id]
      );

      const student = result.rows[0];
      student.last_attendance = attendanceResult.rows[0]?.timestamp || null;

      return NextResponse.json(student);
    }

    // Get all students with their last attendance
    const result = await query(`
      SELECT s.id, s.name, s.roll_no, s.rfid_uid, s.wallet_balance, s.status, 
             s.branch, s.section, s.program, s.year,
             (SELECT MAX(timestamp) FROM attendance WHERE student_id = s.id) as last_attendance
      FROM students s
      ORDER BY s.id
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Students API error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
