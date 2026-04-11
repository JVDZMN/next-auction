import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

const allowedStatuses = [
  'active',
  'completed',
  'cancelled',
  'reserve_not_met',
];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` }, { status: 400 });
    }

    // Fetch car to check ownership/admin
    const car = await prisma.car.findUnique({ where: { id: params.id }, select: { ownerId: true } });
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    // Only admin can set any status, owner can only cancel or pause their own car
    const isAdmin = session.user.role === 'Admin';
    const isOwner = car.ownerId === session.user.id;
    if (!isAdmin && !(isOwner && (status === 'cancelled' || status === 'paused'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.car.update({
      where: { id: params.id },
      data: { status },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return serverError('Failed to update car status', error)
  }
}
