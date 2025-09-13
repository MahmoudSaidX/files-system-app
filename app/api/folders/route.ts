import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { revalidatePath } from 'next/cache';

interface FolderStructure {
  [key: string]: {
    type: 'folder';
    name: string;
    path: string;
    children?: FolderStructure;
    createdAt: string;
  };
}

/**
 * POST /api/folders
 * Creates a new virtual folder entry (Vercel-compatible)
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
    
    // Build the virtual folder path
    const folderPath = parentPath 
      ? `${parentPath}/${sanitizedName}`
      : sanitizedName;
    
    // Read existing folder structure from JSON file
    const structureFilePath = join(process.cwd(), 'folder-structure.json');
    let folderStructure: FolderStructure = {};
    
    try {
      const existingData = await readFile(structureFilePath, 'utf-8');
      folderStructure = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist yet, start with empty structure
      console.log('Creating new folder structure file');
    }
    
    // Check if folder already exists
    if (folderStructure[folderPath]) {
      return NextResponse.json(
        { error: 'Folder already exists' },
        { status: 409 }
      );
    }
    
    // Add new folder to structure
    folderStructure[folderPath] = {
      type: 'folder',
      name: sanitizedName,
      path: folderPath,
      createdAt: new Date().toISOString()
    };
    
    // Save updated structure
    await writeFile(structureFilePath, JSON.stringify(folderStructure, null, 2));
    
    // Revalidate relevant paths
    revalidatePath('/public-files');
    revalidatePath('/');
    
    return NextResponse.json({ 
      success: true, 
      folderName: sanitizedName,
      path: folderPath
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
          { error: 'File system is read-only. This app requires a database or external storage for folder management in production.' },
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