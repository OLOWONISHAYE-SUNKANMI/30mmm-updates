import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: commentId } = await params;
        const userId = session.user.id;

        // Use upsert or try/catch to handle unique constraint (user already liked)
        try {
            await prisma.commentLike.create({
                data: {
                    userId,
                    commentId
                }
            });
        } catch (e: any) {
            // 2002 is unique constraint violation in prisma mongodb
            // If it already exists, just return success
            if (e.code !== 'P2002') {
                throw e;
            }
        }

        const likesCount = await prisma.commentLike.count({ where: { commentId } });

        return NextResponse.json({ success: true, likesCount, hasLiked: true });
    } catch (error) {
        console.error('Comment like error:', error);
        return NextResponse.json({ error: 'Failed to like comment' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: commentId } = await params;
        const userId = session.user.id;

        try {
            // Use deleteMany so it doesn't throw if it doesn't exist
            await prisma.commentLike.deleteMany({
                where: {
                    userId,
                    commentId
                }
            });
        } catch (e) {
            // Ignore not found errors
        }

        const likesCount = await prisma.commentLike.count({ where: { commentId } });

        return NextResponse.json({ success: true, likesCount, hasLiked: false });
    } catch (error) {
        console.error('Comment unlike error:', error);
        return NextResponse.json({ error: 'Failed to unlike comment' }, { status: 500 });
    }
}
