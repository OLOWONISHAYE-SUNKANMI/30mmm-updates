import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const currentUserId = session?.user?.id;

        // You don't HAVE to be logged in to see comments, but being logged in means we can see if you liked them
        const { searchParams } = new URL(request.url);
        const weekStr = searchParams.get('week');
        const dayStr = searchParams.get('day');

        if (!weekStr || !dayStr) {
            return NextResponse.json({ error: 'Week and day required' }, { status: 400 });
        }

        const week = parseInt(weekStr, 10);
        const rawDay = parseInt(dayStr, 10);
        const day = rawDay > 7 ? ((rawDay - 1) % 7) + 1 : rawDay;

        // Fetch top level comments (parentId is null)
        const comments = await prisma.comment.findMany({
            where: {
                OR: [
                    { week: { lt: week } },
                    { week: week, day: { lte: day } }
                ],
                parentId: null
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
                        replies: true,
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
            orderBy: { createdAt: 'desc' }
        });

        // Format for frontend
        const formattedComments = comments.map(comment => ({
            ...comment,
            hasLiked: currentUserId ? comment.likes.length > 0 : false,
            likesCount: comment._count.likes,
            repliesCount: comment._count.replies,
            // Remove raw likes array
            likes: undefined,
            _count: undefined
        }));

        return NextResponse.json(formattedComments);
    } catch (error) {
        console.error('Comments fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { week, day, text, parentId } = await request.json();

        if (!week || !day || !text?.trim()) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const parsedWeek = parseInt(week, 10);
        const parsedDay = parseInt(day, 10);
        const finalDay = parsedDay > 7 ? ((parsedDay - 1) % 7) + 1 : parsedDay;

        const comment = await prisma.comment.create({
            data: {
                userId: session.user.id,
                week: parsedWeek,
                day: finalDay,
                text: text.trim(),
                parentId: parentId || null
            },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        });

        return NextResponse.json({
            ...comment,
            hasLiked: false,
            likesCount: 0,
            repliesCount: 0
        });
    } catch (error) {
        console.error('Comment create error:', error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}
