import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { revalidatePath } from 'next/cache';

interface FolderStructure {
  [key: string]: FolderStructure;
}

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
    
    // Sanitize filename to prevent directory traversal
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Build the full path in public directory
    const publicDir = join(process.cwd(), 'public');
    const filePath = parentPath 
      ? join(publicDir, parentPath, sanitizedFileName)
      : join(publicDir, sanitizedFileName);
    
    // Create directory if it doesn't exist (for physical files)
    const dirPath = parentPath ? join(publicDir, parentPath) : publicDir;
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist or we're in a read-only environment
      console.log('Could not create physical directory:', error);
    }
    
    // Ensure virtual folder structure exists for the file path
    if (parentPath) {
      try {
        const structureFilePath = join(process.cwd(), 'folder-structure.json');
        let folderStructure: FolderStructure = {};
        
        try {
          const structureData = await readFile(structureFilePath, 'utf-8');
          folderStructure = JSON.parse(structureData);
        } catch (error) {
          // File doesn't exist yet, start with empty structure
        }
        
        // Create nested folder structure
        const pathParts = parentPath.split('/').filter(part => part.length > 0);
        let current = folderStructure;
        
        for (const part of pathParts) {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        
        await writeFile(structureFilePath, JSON.stringify(folderStructure, null, 2));
      } catch (error) {
        console.warn('Could not update virtual folder structure:', error);
      }
    }
    
    // Convert file to buffer and write to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);
    
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