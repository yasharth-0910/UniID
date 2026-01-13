import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

let initialized = false;

export async function GET() {
  try {
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const result = await query('SELECT * FROM policies ORDER BY service_type');
    
    // If no policies in DB, return defaults
    if (result.rows.length === 0) {
      return NextResponse.json([
        { service_type: 'attendance', cost: 0, requires_payment: false },
        { service_type: 'library', cost: 0, requires_payment: false },
        { service_type: 'mess', cost: 50, requires_payment: true },
        { service_type: 'transport', cost: 20, requires_payment: true },
      ]);
    }
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Policies API error:', error);
    return NextResponse.json([
      { service_type: 'attendance', cost: 0, requires_payment: false },
      { service_type: 'library', cost: 0, requires_payment: false },
      { service_type: 'mess', cost: 50, requires_payment: true },
      { service_type: 'transport', cost: 20, requires_payment: true },
    ]);
  }
}
