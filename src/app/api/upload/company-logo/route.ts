import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { uploadFile, getFileUrl } from "@/lib/minio";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const companyId = parseInt(session.user.companyId.toString());
    
    // Check if the request is multipart/form-data
    const formData = await req.formData();
    const file = formData.get("logo") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }
    
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, GIF, SVG" },
        { status: 400 }
      );
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload file to Minio
    const fileName = await uploadFile(
      buffer,
      file.name,
      file.type,
      companyId,
      "logos" // Use a different folder for logos
    );
    
    // Get the file URL
    const fileUrl = getFileUrl(fileName);
    
    return NextResponse.json({
      message: "Logo uploaded successfully",
      url: fileUrl,
      fileName: fileName
    }, { status: 201 });
  } catch (error) {
    console.error("Error processing logo upload:", error);
    return NextResponse.json(
      { error: "Failed to process the logo upload" },
      { status: 500 }
    );
  }
} 