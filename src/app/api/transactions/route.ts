import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

let initialized = false;

export async function GET() {
  try {
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const result = await query(`
      SELECT t.*, s.name as student_name 
      FROM transactions t 
      JOIN students s ON t.student_id = s.id 
      ORDER BY t.timestamp DESC
      LIMIT 100
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
