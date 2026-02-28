import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: reflectionId } = await params;
        const userId = session.user.id;

        // Use upsert or try/catch to handle unique constraint
        try {
            await prisma.reflectionLike.create({
                data: {
                    userId,
                    reflectionId
                }
            });
        } catch (e: any) {
            // 2002 is unique constraint violation in prisma mongodb
            if (e.code !== 'P2002') {
                throw e;
            }
        }

        const likesCount = await prisma.reflectionLike.count({ where: { reflectionId } });

        return NextResponse.json({ success: true, likesCount, hasLiked: true });
    } catch (error) {
        console.error('Reflection like error:', error);
        return NextResponse.json({ error: 'Failed to like reflection' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: reflectionId } = await params;
        const userId = session.user.id;

        try {
            // Use deleteMany so it doesn't throw if it doesn't exist
            await prisma.reflectionLike.deleteMany({
                where: {
                    userId,
                    reflectionId
                }
            });
        } catch (e) {
            // Ignore not found errors
        }

        const likesCount = await prisma.reflectionLike.count({ where: { reflectionId } });

        return NextResponse.json({ success: true, likesCount, hasLiked: false });
    } catch (error) {
        console.error('Reflection unlike error:', error);
        return NextResponse.json({ error: 'Failed to unlike reflection' }, { status: 500 });
    }
}
