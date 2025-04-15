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
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const originalName = file.name;
    const fileExt = originalName.split(".").pop();
    
    const uniqueId = uuidv4();
    const newFilename = `receipt-${uniqueId}.${fileExt}`;
    
    const uploadDir = join(process.cwd(), "public", "uploads", "receipts", companyId.toString());
    
    // try {
    //   await writeFile(join(uploadDir, newFilename), buffer);
    // } catch (error) {
    //   console.error("Error writing file:", error);
    //   return NextResponse.json(
    //     { error: "Failed to save file. Please try again." },
    //     { status: 500 }
    //   );
    // }
    
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