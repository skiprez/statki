import Clerk from '@clerk/clerk-sdk-node';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { userIds } = await request.json();
  if (!Array.isArray(userIds)) {
    return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 });
  }
  const result: Record<string, string> = {};
  for (const userId of userIds) {
    try {
      const user = await Clerk.users.getUser(userId);
  result[userId] = user.username ? user.username : `Gracz_${userId.slice(0, 8)}`;
    } catch (e) {
      result[userId] = `Gracz_${userId.slice(0, 8)}`;
    }
  }
  return NextResponse.json(result);
}
