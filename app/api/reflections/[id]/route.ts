import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db';
import { auth } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { isPublic } = await request.json();

        const reflection = await prisma.reflectionResponse.update({
            where: { id, userId: session.user.id },
            data: { isPublic }
        });

        return NextResponse.json(reflection);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update reflection visibility' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await prisma.reflectionResponse.delete({
            where: { id, userId: session.user.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete reflection' }, { status: 500 });
    }
}
