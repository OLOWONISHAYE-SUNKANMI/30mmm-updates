import prisma from "@/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;
    console.log('Storing video with userId:', userId);

    const {
      cohort,
      firstName,
      lastName,
      week,
      day,
      fileName,
      fileType,
      blobUrl,
    } = await request.json();

    const video = await prisma.videoUpload.create({
      data: {
        userId,
        cohort: parseInt(cohort),
        firstName,
        lastName,
        week: parseInt(week),
        day: parseInt(day),
        fileName,
        fileType,
        blobUrl,
      },
    });

    console.log('Video created with ID:', video.id, 'userId:', video.userId);

    return NextResponse.json(
      {
        message: `${Date.now()} - Data saved for ${cohort} - ${firstName} ${lastName}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.log("error in storing metadata: ", error);
    return NextResponse.json(
      {
        message: "Data not saved for ${cohort} - ${firstName} ${lastName}",
        error,
      },
      { status: 500 },
    );
  }
}
