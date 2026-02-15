import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { BlobServiceClient, BlobSASPermissions } from '@azure/storage-blob';

const prisma = new PrismaClient();
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    console.log('=== VIDEO API DEBUG ===');
    console.log('Requested userId:', userId);

    let videos = await prisma.videoUpload.findMany({
      orderBy: { createdAt: 'desc' },
    });

    console.log('Total videos in DB:', videos.length);
    if (videos.length > 0) {
      console.log('Sample video userIds:', videos.slice(0, 3).map(v => ({ id: v.id, userId: v.userId, fileName: v.fileName, blobUrl: v.blobUrl })));
    }

    // Filter by userId if provided
    let filteredVideos;
    if (userId) {
      const beforeFilter = videos.length;
      videos = videos.filter(v => v.userId === userId);
      console.log(`Filtered from ${beforeFilter} to ${videos.length} videos for userId: ${userId}`);
      // If userId is provided, show all videos (public and private) for that user
      filteredVideos = videos;
    } else {
      // Return ALL videos regardless of isPublic status
      filteredVideos = videos;
    }

    console.log('Final filtered count:', filteredVideos.length);
    console.log('Sample filtered video:', filteredVideos[0] ? {
      id: filteredVideos[0].id,
      fileName: filteredVideos[0].fileName,
      blobUrl: filteredVideos[0].blobUrl,
      hasValidUrl: filteredVideos[0].blobUrl?.startsWith('http'),
    } : 'No videos');
    console.log('======================');

    // Normalize blobUrl helper function
    const normalizeBlobUrl = (blobUrl: any): string => {
      // Handle null/undefined
      if (blobUrl === null || blobUrl === undefined) return '';
      
      // Already a valid string
      if (typeof blobUrl === 'string') {
        return blobUrl.trim().length > 0 ? blobUrl.trim() : '';
      }
      
      // Handle object - might be serialization issue
      if (typeof blobUrl === 'object') {
        // Try common object properties
        if (blobUrl.url && typeof blobUrl.url === 'string') return blobUrl.url.trim();
        if (blobUrl.href && typeof blobUrl.href === 'string') return blobUrl.href.trim();
        if (blobUrl.value && typeof blobUrl.value === 'string') return blobUrl.value.trim();
        
        // Try to get any string property
        for (const key in blobUrl) {
          const val = blobUrl[key];
          if (typeof val === 'string' && val.trim().length > 0) {
            return val.trim();
          }
        }
        
        // Empty object - return empty string
        return '';
      }
      
      // For any other type, try to convert to string
      const strVal = String(blobUrl).trim();
      return strVal && strVal !== '[object Object]' ? strVal : '';
    };

    // Create plain objects with normalized fields
    const plainVideos = filteredVideos.map(video => ({
      id: String(video.id),
      userId: video.userId ? String(video.userId) : null,
      cohort: Number(video.cohort),
      firstName: String(video.firstName),
      lastName: String(video.lastName),
      week: Number(video.week),
      day: Number(video.day),
      fileName: String(video.fileName),
      fileType: String(video.fileType),
      blobUrl: normalizeBlobUrl(video.blobUrl),
      isPublic: Boolean(video.isPublic),
      createdAt: video.createdAt ? new Date(video.createdAt).toISOString() : null,
      updatedAt: video.updatedAt ? new Date(video.updatedAt).toISOString() : null,
    }));

    if (!connectionString) {
      console.log('No Azure connection string, returning videos as-is');
      return NextResponse.json(plainVideos);
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    const videosWithReadUrls = await Promise.all(plainVideos.map(async (video) => {
      const normalizedBlobUrl = video.blobUrl;

      // If we don't have a valid URL, just return the video as-is (will use fileName fallback)
      if (!normalizedBlobUrl || (!normalizedBlobUrl.startsWith('http://') && !normalizedBlobUrl.startsWith('https://'))) {
        console.warn('Video has invalid/empty blobUrl, will use fallback:', video.id, 'fileName:', video.fileName);
        return video;
      }

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