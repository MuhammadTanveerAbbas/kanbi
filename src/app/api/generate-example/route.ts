import { NextRequest, NextResponse } from 'next/server';

const fallbackExample = `- Review quarterly budget report by Friday
- Call dentist to schedule appointment
- Fix login bug in user dashboard - high priority
- Plan team meeting for next week
- Update project documentation`;

export async function POST(request: NextRequest) {
  return NextResponse.json({ example: fallbackExample });
}
