import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { BlobServiceClient, BlobSASPermissions } from '@azure/storage-blob';
import { auth } from '@/lib/auth';
import { filterVideosByUserProgress } from '@/lib/video-filtering-utility';

const prisma = new PrismaClient();
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

export async function GET(request: Request) {
  try {
    // Get user session for progress filtering
    const session = await auth();
    
    const videos = await prisma.videoUpload.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true,
      }
    });

    // Filter videos based on user's progress if user is authenticated
    let filteredVideos = videos;
    if (session?.user?.id) {
      try {
        const userProgress = await prisma.userProgress.findUnique({
          where: { userId: session.user.id },
        });

        if (userProgress) {
          filteredVideos = filterVideosByUserProgress(videos, {
            currentWeek: userProgress.currentWeek,
            currentDay: userProgress.currentDay,
          }) as typeof videos;
        }
      } catch (error) {
        console.error('Error filtering videos by user progress:', error);
        // If filtering fails, return all videos (fallback)
      }
    } else {
      // If not authenticated, return no videos (security measure)
      filteredVideos = [];
    }

    if (!connectionString) {
      return NextResponse.json(filteredVideos);
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    const videosWithReadUrls = filteredVideos.map((video) => {
      if (!video.blobUrl) return video;
      
      try {
        const url = new URL(normalizedBlobUrl);
        const pathParts = url.pathname
          .split('/')
          .filter(Boolean)
          .map(part => decodeURIComponent(part)); // Decode each path component
        const containerName = pathParts[0];
        const blobName = pathParts.slice(1).join('/');
        
        console.log('Extracting blob path:', {
          originalUrl: normalizedBlobUrl,
          containerName,
          blobName,
          pathParts,
        });
        
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(blobName);
        
        const readUrl = await blobClient.generateSasUrl({
          permissions: BlobSASPermissions.parse('r'),
          expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        
        console.log('Successfully generated SAS URL for video:', video.id);
        return { ...video, blobUrl: readUrl };
      } catch (error) {
        console.error('Error generating read URL for video:', video.id, 'blob name:', video.fileName, error);
        // Return with original normalized URL on error
        return video;
      }
    }));

    // Log what we're returning
    console.log('Returning videos from API - Total:', videosWithReadUrls.length);
    if (videosWithReadUrls.length > 0) {
      const sample = videosWithReadUrls[0];
      console.log('Sample video being returned:', {
        id: sample.id,
        fileName: sample.fileName,
        blobUrl: sample.blobUrl,
        blobUrlType: typeof sample.blobUrl,
        blobUrlLength: sample.blobUrl ? sample.blobUrl.length : 0,
      });
    }

    return NextResponse.json(videosWithReadUrls);
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch videos', details: error.message },
      { status: 500 }
    );
  }
}