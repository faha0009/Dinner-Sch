import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function GET() {
  try {
    // Get all selections from Redis
    const data = await redis.get('dinner-selections');
    const selections = data ? JSON.parse(data) : {
      Jason: [],
      Arthur: [],
      Cameron: [],
      George: []
    };
    
    return NextResponse.json({ selections });
  } catch (error) {
    console.error('Error fetching selections:', error);
    return NextResponse.json({ error: 'Failed to fetch selections' }, { status: 500 });
  }
}