import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getPresignedUrl } from "@/lib/minio";

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
    
    // Security check: ensure the file belongs to the current company and is in the logos folder
    if (!fileName.includes(`${companyId}/logos/`)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    
    const presignedUrl = await getPresignedUrl(fileName);
    return NextResponse.json({
      url: presignedUrl
    });
    
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate URL" },
      { status: 500 }
    );
  }
} 