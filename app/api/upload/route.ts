import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string || '';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Sanitize the path
    const sanitizedPath = path.replace(/\.\./g, '').replace(/^\/+/, '');
    
    // Build the full file path
    const publicDir = join(process.cwd(), 'public');
    const fullPath = join(publicDir, sanitizedPath, file.name);
    
    // Security check: ensure the path is within public directory
    if (!fullPath.startsWith(publicDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      );
    }
    
    // Create directory if it doesn't exist
    const parentDir = dirname(fullPath);
    try {
      await mkdir(parentDir, { recursive: true });
    } catch (error) {
      // Directory might already exist or we're in a read-only environment
      console.log('Could not create physical directory:', error);
    }
    
    // Convert file to buffer and write to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      await writeFile(fullPath, buffer);
    } catch (error) {
      console.error('Error writing file:', error);
      return NextResponse.json(
        { error: 'Failed to save file' },
        { status: 500 }
      );
    }
    
    // Revalidate the path to update the UI
    revalidatePath('/public-folders');
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileName: file.name,
      path: sanitizedPath
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}