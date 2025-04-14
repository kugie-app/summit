import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const companyId = session.user.companyId;
    
    // Check if the request is multipart/form-data
    const formData = await req.formData();
    const file = formData.get("receipt") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }
    
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, GIF, PDF" },
        { status: 400 }
      );
    }
    
    // Create a unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Get file extension
    const originalName = file.name;
    const fileExt = originalName.split(".").pop();
    
    // Generate a unique ID and create the new filename
    const uniqueId = uuidv4();
    const newFilename = `receipt-${uniqueId}.${fileExt}`;
    
    // Create company-specific directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", "receipts", companyId.toString());
    
    try {
      // Create directory recursively if it doesn't exist
      // Note: In production, you'd typically use a cloud storage solution
      await writeFile(join(uploadDir, newFilename), buffer);
    } catch (error) {
      console.error("Error writing file:", error);
      // If there's an error creating the directory or writing the file,
      // it's likely a permissions issue with the local filesystem
      return NextResponse.json(
        { error: "Failed to save file. Please try again." },
        { status: 500 }
      );
    }
    
    // Return the URL to the uploaded file
    const fileUrl = `/uploads/receipts/${companyId}/${newFilename}`;
    
    return NextResponse.json({
      message: "File uploaded successfully",
      url: fileUrl,
      fileName: newFilename
    }, { status: 201 });
  } catch (error) {
    console.error("Error processing file upload:", error);
    return NextResponse.json(
      { error: "Failed to process the file upload" },
      { status: 500 }
    );
  }
} 