import { NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/folders
 * Creates a new physical folder in the public directory
 */
export async function POST(req: Request) {
  try {
    const { name, parentPath } = await req.json();
    
    // Validate input
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }
    
    // Sanitize folder name (remove invalid characters)
    const sanitizedName = name.trim().replace(/[<>:"/\\|?*]/g, '');
    if (!sanitizedName) {
      return NextResponse.json(
        { error: 'Invalid folder name' },
        { status: 400 }
      );
    }
    
    // Build the physical folder path
    const publicDir = join(process.cwd(), 'public');
    const folderPath = parentPath 
      ? join(publicDir, parentPath, sanitizedName)
      : join(publicDir, sanitizedName);
    
    // Security check: ensure the path is within public directory
    if (!folderPath.startsWith(publicDir)) {
      return NextResponse.json(
        { error: 'Invalid folder path' },
        { status: 403 }
      );
    }
    
    // Create the physical folder
    try {
      await mkdir(folderPath, { recursive: true });
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        return NextResponse.json(
          { error: 'Folder already exists' },
          { status: 409 }
        );
      }
      throw error;
    }
    
    // Build relative path for response
    const relativePath = parentPath 
      ? `${parentPath}/${sanitizedName}`
      : sanitizedName;
    
    // Revalidate relevant paths
    revalidatePath('/public-files');
    revalidatePath('/');
    
    return NextResponse.json({ 
      success: true, 
      folderName: sanitizedName,
      path: relativePath
    });
    
  } catch (error) {
    console.error('Error creating folder:', error);
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Check for specific Vercel/serverless errors
      if (error.message.includes('EROFS') || error.message.includes('read-only')) {
        return NextResponse.json(
          { error: 'File system is read-only. Physical folder creation not supported in this environment.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}