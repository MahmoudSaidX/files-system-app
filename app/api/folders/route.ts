import { NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/folders
 * Creates a new folder in the public directory
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
    
    // Build the full path in public directory
    const publicDir = join(process.cwd(), 'public');
    const targetPath = parentPath 
      ? join(publicDir, parentPath, sanitizedName)
      : join(publicDir, sanitizedName);
    
    // Create the directory
    await mkdir(targetPath, { recursive: true });
    
    // Revalidate relevant paths
    revalidatePath('/public-files');
    revalidatePath('/');
    
    return NextResponse.json({ 
      success: true, 
      folderName: sanitizedName,
      path: parentPath ? `${parentPath}/${sanitizedName}` : sanitizedName
    });
    
  } catch (error) {
    console.error('Error creating folder:', error);
    
    if (error instanceof Error && error.message.includes('EEXIST')) {
      return NextResponse.json(
        { error: 'Folder already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}