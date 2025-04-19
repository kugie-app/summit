import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getFile, getPresignedUrl } from "@/lib/minio";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");
    
    if (!fileName) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }
    const companyId = session.user.companyId;
    const bucketName = process.env.MINIO_BUCKET_NAME;
    if (!fileName.startsWith(`${bucketName}/${companyId}/receipts/`)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const sanitizedFileName = fileName.replace(`${bucketName}/`, "");
    
    const presignedUrl = await getPresignedUrl(sanitizedFileName);
    return NextResponse.json({
      url: presignedUrl
    });
    
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
} 