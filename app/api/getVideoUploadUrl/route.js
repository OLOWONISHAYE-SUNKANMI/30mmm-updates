import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { filename, contentType, cohort, firstName, lastName, week, day } =
      await request.json();
    let extension;

    // Validate that the content type is a video
    if (contentType && !contentType.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only video files are allowed" },
        { status: 400 },
      );
    }

    // Azure Storage account details from environment variables
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

    if (!accountName || !accountKey || !containerName) {
      return NextResponse.json(
        { error: "Azure Storage configuration missing" },
        { status: 500 },
      );
    }

    if (filename) {
      // Extract extension from the original filename if available
      const fileExtMatch = filename.match(/\.[^.]+$/);
      if (fileExtMatch) {
        extension = fileExtMatch[0];
      } else if (contentType) {
        // Set extension based on content type
        switch (contentType) {
          case "video/mp4":
            extension = ".mp4";
            break;
          case "video/webm":
            extension = ".webm";
            break;
          case "video/ogg":
            extension = ".ogv";
            break;
          case "video/quicktime":
            extension = ".mov";
            break;
          default:
            extension = ".mp4"; // Default fallback
        }
      }
    }

    // cohort, firstName, lastName, week, day
    const blobName = `${cohort}/${firstName}_${lastName}/wk-${week}/day-${day}/video-${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extension}`;

    // Create Credentials
    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey,
    );

    // Set Permissions and Expiry
    const sasPermissions = new BlobSASPermissions();
    sasPermissions.write = true; // Allow write permissions
    sasPermissions.create = true; // Allow create permissions (needed for block blobs)
    sasPermissions.add = true; // Allow add permissions

    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - 15); // Adjust for potential clock skew (15 mins back)
    
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 60); // Token valid for 60mins

    // Generate SAS token
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: sasPermissions,
        startsOn: startDate,
        expiresOn: expiryDate,
      },
      sharedKeyCredential,
    ).toString();

    // Construct full upload URL
    const uploadUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;

    // Return upload URL and blob details to the client
    return NextResponse.json({
      uploadUrl,
      blobName,
      containerUrl: `https://${accountName}.blob.core.windows.net/${containerName}`,
      sasToken,
    });
  } catch (error) {
    console.error("Error generating SAS token:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}

// Enable CORS by specifying allowed HTTP methods
export const OPTIONS = async () => {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
};
