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
    
    // Check if public directory exists and clear it
    try {
      const stats = await fs.stat(publicDir);
      if (stats.isDirectory()) {
        // Clear all contents of the public directory
        await clearDirectoryContents(publicDir);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Public directory not found' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    // Clear access log
    try {
      const accessLogPath = path.join(process.cwd(), 'access-log.json');
      await fs.writeFile(accessLogPath, JSON.stringify([], null, 2));
    } catch (error) {
      // Access log cleanup is optional, don't fail the request
      console.log('Could not clear access log:', error);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'All folders and files removed successfully' 
    });
    
  } catch (error) {
    console.error('Error removing all folders:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('EROFS') || error.message.includes('read-only')) {
        return NextResponse.json(
          { error: 'File system is read-only. Physical folder removal not supported in this environment.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to remove all folders' },
      { status: 500 }
    );
  }
}