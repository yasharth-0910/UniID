import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase, logAttendance, getAttendanceRecords } from '@/lib/db';

let initialized = false;

// GET - Fetch attendance records with optional filters
export async function GET(request: NextRequest) {
  try {
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || undefined;
    const section = searchParams.get('section') || undefined;
    const program = searchParams.get('program') || undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;

    const result = await getAttendanceRecords({ branch, section, program, year });
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

// POST - Mark attendance via RFID tap
export async function POST(request: NextRequest) {
  try {
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const body = await request.json();
    const { rfid_uid, service_context = 'general' } = body;

    if (!rfid_uid) {
      return NextResponse.json(
        { success: false, error: 'Missing rfid_uid' },
        { status: 400 }
      );
    }

    // Step 1: Identity Verification
    const studentResult = await query(
      'SELECT * FROM students WHERE rfid_uid = $1',
      [rfid_uid]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Card - Identity Not Found',
      });
    }

    const student = studentResult.rows[0];

    // Step 2: Check if student is active
    if (student.status !== 'active') {
      return NextResponse.json({
        success: false,
        student: student.name,
        error: 'Student account is not active',
      });
    }

    // Step 3: Log attendance (no wallet interaction)
    const logged = await logAttendance(student.id, service_context);

    if (!logged) {
      return NextResponse.json({
        success: false,
        student: student.name,
        error: 'Failed to log attendance',
      });
    }

    // Return structured response with academic details
    return NextResponse.json({
      success: true,
      student: student.name,
      branch: student.branch,
      section: student.section,
      year: student.year,
      program: student.program,
      attendance: 'Marked',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
