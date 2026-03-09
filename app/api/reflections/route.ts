import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const currentUserId = session?.user?.id;

        const { searchParams } = new URL(request.url);
        const weekStr = searchParams.get('week');
        const dayStr = searchParams.get('day');
        const getUserId = searchParams.get('userId'); // Added to fetch user's own reflections
        const getAll = searchParams.get('all') === 'true'; // Allow fetching all (including private) if requested

        if (getUserId) {
            // Fetch specific user's reflections
            const whereClause: any = { userId: getUserId };

            // If the request doesn't explicitly ask for all, only return public ones
            if (!getAll) {
                whereClause.isPublic = true;
            }

            const reflections = await prisma.reflectionResponse.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            profile: true, // Needed for cohort, firstName, lastName
                            userProgress: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const formattedReflections = reflections.map(reflection => ({
                ...reflection,
                firstName: reflection.user.profile?.firstName,
                lastName: reflection.user.profile?.lastName,
                cohort: reflection.user.userProgress?.cohortNumber
            }));

            return NextResponse.json(formattedReflections);
        }

        if (!weekStr || !dayStr) {
            return NextResponse.json({ error: 'Week and day required' }, { status: 400 });
        }

        const week = parseInt(weekStr, 10);
        const day = parseInt(dayStr, 10);

        // Fetch public reflections for the specific day
        const reflections = await prisma.reflectionResponse.findMany({
            where: {
<<<<<<< HEAD
                OR: [
                    { week: { lt: week } },
                    { week: week, day: { lte: day } }
                ],
=======
                week: week,
                day: day,
>>>>>>> a469c3c221f469a63598086c4907ef57ad7919fc
                isPublic: true // ONLY public
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
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
            orderBy: { createdAt: 'desc' }
        });

        // Format for frontend
        const formattedReflections = reflections.map(reflection => ({
            ...reflection,
            hasLiked: currentUserId ? reflection.likes.length > 0 : false,
            likesCount: reflection._count.likes,
            // Remove raw likes array
            likes: undefined,
            _count: undefined
        }));

        return NextResponse.json(formattedReflections);
    } catch (error) {
        console.error('Reflections fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch reflections' }, { status: 500 });
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> a469c3c221f469a63598086c4907ef57ad7919fc
