import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Recursive function to delete all contents of a directory but keep the directory itself
async function clearDirectoryContents(dirPath: string): Promise<void> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively delete subdirectory and all its contents
        await clearDirectoryContents(fullPath);
        await fs.rmdir(fullPath);
      } else {
        // Delete file
        await fs.unlink(fullPath);
      }
    }
  } catch (error) {
    throw new Error(`Failed to clear directory contents: ${error}`);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    
    // Check if public directory exists
    try {
      const stats = await fs.stat(publicDir);
      if (!stats.isDirectory()) {
        return NextResponse.json(
          { error: 'Public directory not found' },
          { status: 404 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Public directory not found' },
        { status: 404 }
      );
    }

    // Clear all contents of the public directory
    await clearDirectoryContents(publicDir);
    
    // Clear the access log
    try {
      const accessLogPath = path.join(process.cwd(), 'access-log.json');
      await fs.writeFile(accessLogPath, JSON.stringify([], null, 2));
    } catch (error) {
      // Access log clearing is not critical, continue
      console.warn('Could not clear access log:', error);
    }

    return NextResponse.json(
      { 
        message: 'All files and folders removed successfully',
        cleared: 'public directory contents'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing all files:', error);
    return NextResponse.json(
      { error: 'Failed to remove all files and folders' },
      { status: 500 }
    );
  }
}