import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

let initialized = false;

export async function GET() {
  try {
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const result = await query('SELECT * FROM students ORDER BY id');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Students API error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
