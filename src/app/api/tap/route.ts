import { NextRequest, NextResponse } from 'next/server';
import { query, getPolicy, checkPermission, debitWallet, initDatabase, logAttendance } from '@/lib/db';

// Initialize database on first request
let initialized = false;

export async function POST(request: NextRequest) {
  try {
    // Initialize database if not done
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const body = await request.json();
    const { rfid_uid, service } = body;

    if (!rfid_uid || !service) {
      return NextResponse.json(
        { success: false, error: 'Missing rfid_uid or service' },
        { status: 400 }
      );
    }

    // Step 1: Identity Verification
    const studentResult = await query('SELECT * FROM students WHERE rfid_uid = $1', [rfid_uid]);

    if (studentResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        student: 'Unknown',
        service: service.charAt(0).toUpperCase() + service.slice(1),
        action: 'Invalid Card - Identity Not Found',
        balance_remaining: 0,
      });
    }

    const student = studentResult.rows[0];

    // ATTENDANCE SERVICE - Identity-only verification, no wallet logic
    if (service.toLowerCase() === 'attendance') {
      // Check if student is active
      if (student.status !== 'active') {
        return NextResponse.json({
          success: false,
          student: student.name,
          service: 'Attendance',
          action: 'Student account is not active',
          balance_remaining: parseFloat(student.wallet_balance),
        });
      }

      // Log attendance (no wallet interaction)
      const logged = await logAttendance(student.id, 'attendance');

      if (!logged) {
        return NextResponse.json({
          success: false,
          student: student.name,
          service: 'Attendance',
          action: 'Failed to log attendance',
          balance_remaining: parseFloat(student.wallet_balance),
        });
      }

      // Return attendance response with academic details
      return NextResponse.json({
        success: true,
        student: student.name,
        service: 'Attendance',
        action: 'Attendance Marked',
        balance_remaining: parseFloat(student.wallet_balance),
        branch: student.branch,
        section: student.section,
        year: student.year,
        program: student.program,
        attendance_timestamp: new Date().toISOString(),
      });
    }

    // OTHER SERVICES - Standard payment flow

    // Step 2: Get Policy
    const policy = await getPolicy(service);
    if (!policy) {
      return NextResponse.json({
        success: false,
        student: student.name,
        service: service.charAt(0).toUpperCase() + service.slice(1),
        action: `Unknown service: ${service}`,
        balance_remaining: parseFloat(student.wallet_balance),
      });
    }

    // Step 3: Check Permission
    const { allowed, message } = checkPermission(student, policy);

    if (!allowed) {
      return NextResponse.json({
        success: false,
        student: student.name,
        service: service.charAt(0).toUpperCase() + service.slice(1),
        action: message,
        balance_remaining: parseFloat(student.wallet_balance),
      });
    }

    // Step 4: Process payment if required
    let amountDeducted: number | undefined;

    if (policy.requires_payment && policy.cost > 0) {
      const success = await debitWallet(student.id, policy.cost, service);

      if (!success) {
        return NextResponse.json({
          success: false,
          student: student.name,
          service: service.charAt(0).toUpperCase() + service.slice(1),
          action: 'Transaction Failed',
          balance_remaining: parseFloat(student.wallet_balance),
        });
      }

      amountDeducted = policy.cost;
    } else {
      // Log free service access
      await query(
        `INSERT INTO transactions (student_id, service_type, amount) VALUES ($1, $2, $3)`,
        [student.id, service, 0]
      );
    }

    // Get updated balance
    const balanceResult = await query('SELECT wallet_balance FROM students WHERE id = $1', [student.id]);
    const newBalance = parseFloat(balanceResult.rows[0]?.wallet_balance || student.wallet_balance);

    return NextResponse.json({
      success: true,
      student: student.name,
      service: service.charAt(0).toUpperCase() + service.slice(1),
      action: message,
      balance_remaining: newBalance,
      amount_deducted: amountDeducted,
      branch: student.branch,
      section: student.section,
      year: student.year,
      program: student.program,
    });
  } catch (error) {
    console.error('Tap API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
