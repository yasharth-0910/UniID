import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // Reset wallet balances
    const demoBalances = [
      ['RFID_001', 500],
      ['RFID_002', 300],
      ['RFID_003', 200],
      ['RFID_004', 400],
    ];

    for (const [rfid_uid, balance] of demoBalances) {
      await query('UPDATE students SET wallet_balance = $1 WHERE rfid_uid = $2', [balance, rfid_uid]);
    }

    // Clear transactions
    await query('DELETE FROM transactions');

    return NextResponse.json({ message: 'Demo data reset successfully' });
  } catch (error) {
    console.error('Reset API error:', error);
    return NextResponse.json({ error: 'Failed to reset demo data' }, { status: 500 });
  }
}
