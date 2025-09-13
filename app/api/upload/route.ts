import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/upload
 * Uploads a file to the public directory
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const customName = formData.get('name') as string;
    const parentPath = formData.get('parentPath') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Use custom name if provided, otherwise use original filename
    const fileName = customName?.trim() || file.name;
    
    // Sanitize filename (remove invalid characters)
    const sanitizedFileName = fileName.replace(/[<>:"/\\|?*]/g, '');
    if (!sanitizedFileName) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }
    
    // Build the full path in public directory
    const publicDir = join(process.cwd(), 'public');
    const targetPath = parentPath 
      ? join(publicDir, parentPath, sanitizedFileName)
      : join(publicDir, sanitizedFileName);
    
    // Convert file to buffer and write to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(targetPath, buffer);
    
    // Revalidate relevant paths
    revalidatePath('/public-files');
    revalidatePath('/');
    if (parentPath) {
      revalidatePath(`/public-folder/${parentPath}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      fileName: sanitizedFileName,
      path: parentPath ? `${parentPath}/${sanitizedFileName}` : sanitizedFileName
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    
    if (error instanceof Error && error.message.includes('EEXIST')) {
      return NextResponse.json(
        { error: 'File already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}