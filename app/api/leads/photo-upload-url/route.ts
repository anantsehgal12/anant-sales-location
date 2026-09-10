import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL, isR2Configured } from "@/lib/r2";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, error: "Storage is not configured. Please check R2 environment variables." },
        { status: 500 }
      );
    }

    const { fileName, contentType } = await req.json();

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ success: false, error: "fileName is required" }, { status: 400 });
    }

    const safeContentType = ALLOWED_CONTENT_TYPES.has(contentType) ? contentType : "application/octet-stream";

    // Namespace uploads by user + date to keep the bucket tidy and avoid collisions
    const key = `client-locations/${userId}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: safeContentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 }); // 5 minutes
    const publicUrl = `${R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({ success: true, uploadUrl, publicUrl });
  } catch (err: any) {
    console.error("Failed to create R2 presigned URL:", err);
    return NextResponse.json(
      { success: false, error: "Could not generate an upload URL. Please try again." },
      { status: 500 }
    );
  }
}
