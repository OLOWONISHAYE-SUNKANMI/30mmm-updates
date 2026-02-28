import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        const currentUserId = session?.user?.id;
        const { id: commentId } = await params;

        const replies = await prisma.comment.findMany({
            where: {
                parentId: commentId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                _count: {
                    select: {
                        likes: true
                    }
                },
                likes: currentUserId ? {
                    where: {
                        userId: currentUserId
                    },
                    select: {
                        id: true
                    }
                } : false
            },
            orderBy: { createdAt: 'asc' } // Replies usually oldest first
        });

        // Format for frontend
        const formattedReplies = replies.map(reply => ({
            ...reply,
            hasLiked: currentUserId ? reply.likes.length > 0 : false,
            likesCount: reply._count.likes,
            // Remove raw likes array
            likes: undefined,
            _count: undefined
        }));

        return NextResponse.json(formattedReplies);
    } catch (error) {
        console.error('Replies fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }
}
