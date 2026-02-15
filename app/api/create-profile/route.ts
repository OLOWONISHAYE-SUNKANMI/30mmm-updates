// app/api/profile/route.js
import prisma from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BlobServiceClient, BlobSASPermissions } from "@azure/storage-blob";

// POST - Create/Update profile (initial creation)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to update your profile" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 },
      );
    }

    // Check if request is FormData (with image) or JSON
    const contentType = request.headers.get('content-type') || '';
    let profileData: any;
    let imageFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const profileDataStr = formData.get("profileData") as string;
      imageFile = formData.get("profileImage") as File | null;
      profileData = profileDataStr ? JSON.parse(profileDataStr) : {};
    } else {
      const raw = await request.json();
      profileData = {
        ...raw,
        birthDate: raw.birthDate || raw.birthdate || null,
        phoneNumber: raw.phoneNumber || raw.telephone || null,
      };
    }

    // Handle image upload to Azure if provided
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

      if (connectionString && containerName) {
        try {
          const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
          const containerClient = blobServiceClient.getContainerClient(containerName);

          const extension = imageFile.name.split(".").pop();
          const blobName = `profiles/${userId}-${Date.now()}.${extension}`;

          const blockBlobClient = containerClient.getBlockBlobClient(blobName);

          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);

          await blockBlobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: { blobContentType: imageFile.type }
          });

          imageUrl = blockBlobClient.url;
          console.log('✅ Profile image uploaded to Azure:', imageUrl);
        } catch (azureError: any) {
          console.error('❌ Azure upload failed:', azureError.message);
        }
      }
    }

    // Accept either `birthdate` or `birthDate` and `telephone` or `phoneNumber` for compatibility
    if (!contentType.includes('multipart/form-data')) {
      profileData = {
        ...profileData,
        birthDate: profileData.birthDate || profileData.birthdate || null,
        phoneNumber: profileData.phoneNumber || profileData.telephone || null,
      };
    }

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: userId },
      update: {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        birthDate: profileData.birthDate ? new Date(profileData.birthDate) : null,
        maritalStatus: profileData.maritalStatus,
        childrenCount: parseInt(profileData.childrenCount) || 0,
        churchAffiliation: profileData.churchAffiliation,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        zipcode: profileData.zipcode,
      },
      create: {
        userId: userId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        birthDate: profileData.birthDate ? new Date(profileData.birthDate) : null,
        maritalStatus: profileData.maritalStatus,
        childrenCount: parseInt(profileData.childrenCount) || 0,
        churchAffiliation: profileData.churchAffiliation,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        zipcode: profileData.zipcode,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        profileCompleted: true,
        ...(imageUrl && { image: imageUrl }),
      },
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      imageUrl,
    });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 },
    );
  }
}

// GET - Fetch profile
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view your profile" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 },
      );
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });

    // Generate SAS token for Azure blob image if it exists
    let imageWithSAS = user?.image || null;
    if (user?.image && typeof user.image === 'string' && user.image.includes('blob.core.windows.net')) {
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if (connectionString) {
        try {
          const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
          const url = new URL(user.image);
          const pathParts = url.pathname.split('/').filter(Boolean);
          const containerName = pathParts[0];
          const blobName = pathParts.slice(1).join('/');

          const containerClient = blobServiceClient.getContainerClient(containerName);
          const blobClient = containerClient.getBlobClient(blobName);

          const permissions = BlobSASPermissions.parse("r");
          const sasUrl = await blobClient.generateSasUrl({
            permissions,
            expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000),
          });
          imageWithSAS = sasUrl;
          console.log('✅ Generated SAS URL for profile image');
        } catch (error) {
          console.error('Error generating SAS for profile image:', error);
          // Keep the original URL if SAS generation fails
          imageWithSAS = user.image;
        }
      }
    }

    console.log('GET /api/create-profile - Returning image:', imageWithSAS);
    return NextResponse.json({
      profile: userProfile,
      user: { image: imageWithSAS }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PUT - Update profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to update your profile" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const profileDataStr = formData.get("profileData") as string;
    const imageFile = formData.get("profileImage") as File | null;

    const data = profileDataStr ? JSON.parse(profileDataStr) : {};

    // Handle image upload to Azure (optional)
    let imageUrl: string | null = null;
    let blobServiceClient: BlobServiceClient | null = null;
    console.log('=== PROFILE IMAGE UPLOAD DEBUG ===');
    console.log('Image file received:', imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'No image');

    if (imageFile && imageFile.size > 0) {
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

      console.log('Azure config:', {
        hasConnectionString: !!connectionString,
        containerName
      });

      if (connectionString && containerName) {
        try {
          console.log('Starting Azure upload...');
          blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
          const containerClient = blobServiceClient.getContainerClient(containerName);

          const extension = imageFile.name.split(".").pop();
          const blobName = `profiles/${userId}-${Date.now()}.${extension}`;
          console.log('Blob name:', blobName);

          const blockBlobClient = containerClient.getBlockBlobClient(blobName);

          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);

          await blockBlobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: { blobContentType: imageFile.type }
          });

          imageUrl = blockBlobClient.url;
          console.log('✅ Image uploaded successfully to Azure:', imageUrl);
        } catch (azureError: any) {
          console.error('❌ Azure upload failed:', azureError.message);
          console.error('Full error:', azureError);
        }
      } else {
        console.warn('⚠️ Azure Storage not configured, skipping image upload');
      }
    }
    console.log('=================================');

    // Convert empty strings to null for optional fields
    const profileData = {
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      maritalStatus: data.maritalStatus || null,
      childrenCount: data.childrenCount ? parseInt(data.childrenCount) : null,
      churchAffiliation: data.churchAffiliation || null,
      email: data.email || null,
      phoneNumber: data.phoneNumber || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipcode: data.zipcode || null,
    };

    const userProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData,
      },
    });

    // Update user image if uploaded and generate SAS URL
    let imageWithSAS = imageUrl;
    if (imageUrl && blobServiceClient) {
      console.log('Updating user image in database:', imageUrl);
      await prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl },
      });
      console.log('✅ User image updated in database');

      // Generate SAS token for the uploaded image
      try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/').filter(Boolean);
        // const containerName = pathParts[0]; // Already have checking above or URL parsing might be safer
        const blobName = pathParts.slice(1).join('/');

        // Use existing client or container logic. Re-using blobServiceClient is safer.
        // Assuming containerName is accessible or we parse from URL which is what original code did.
        // original code: const containerName = pathParts[0];

        const containerNameFromUrl = pathParts[0];
        const containerClient = blobServiceClient.getContainerClient(containerNameFromUrl);
        const blobClient = containerClient.getBlobClient(blobName);

        const permissions = BlobSASPermissions.parse("r");
        const sasUrl = await blobClient.generateSasUrl({
          permissions,
          expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        imageWithSAS = sasUrl;
        console.log('✅ Generated SAS URL for uploaded image');
      } catch (error) {
        console.error('Error generating SAS for uploaded image:', error);
      }
    } else {
      console.log('No image URL to update in database');
    }

    return NextResponse.json({
      success: true,
      profile: userProfile,
      imageUrl: imageWithSAS,
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    console.error("Error details:", error.message, error.stack);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 },
    );
  }
}
