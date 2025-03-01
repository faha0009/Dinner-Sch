import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function POST(request: Request) {
  try {
    const { user, dates } = await request.json();
    
    // Validate input
    if (!user || !Array.isArray(dates)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    // Get existing data
    const data = await redis.get('dinner-selections');
    const selections = data ? JSON.parse(data) : {
      Jason: [],
      Arthur: [],
      Cameron: [],
      George: []
    };
    
    // Update user selections
    selections[user] = dates;
    
    // Save back to Redis
    await redis.set('dinner-selections', JSON.stringify(selections));
    
    return NextResponse.json({ success: true, selections });
  } catch (error) {
    console.error('Error updating selections:', error);
    return NextResponse.json({ error: 'Failed to update selections' }, { status: 500 });
  }
}