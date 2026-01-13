import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // Reset wallet balances and academic details
    const demoData = [
      ['RFID_001', 500, 'CSE', 'F3', 'B.Tech', 3],
      ['RFID_002', 300, 'CSE', 'F5', 'B.Tech', 2],
      ['RFID_003', 200, 'ECS', 'E15', 'B.Tech', 3],
      ['RFID_004', 400, 'CSE', 'F1', 'B.Sc', 1],
    ];

    for (const [rfid_uid, balance, branch, section, program, year] of demoData) {
      await query(
        'UPDATE students SET wallet_balance = $1, branch = $2, section = $3, program = $4, year = $5 WHERE rfid_uid = $6', 
        [balance, branch, section, program, year, rfid_uid]
      );
    }

    // Clear transactions
    await query('DELETE FROM transactions');
    
    // Clear attendance
    await query('DELETE FROM attendance');

    return NextResponse.json({ message: 'Demo data reset successfully' });
  } catch (error) {
    console.error('Reset API error:', error);
    return NextResponse.json({ error: 'Failed to reset demo data' }, { status: 500 });
  }
}
