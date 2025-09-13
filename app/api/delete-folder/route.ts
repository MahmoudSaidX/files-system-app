import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface FolderStructure {
  [key: string]: {
    type: 'folder';
    name: string;
    path: string;
    children?: FolderStructure;
    createdAt: string;
  };
}

// Recursive function to delete directory and all its contents
async function deleteDirectoryRecursive(dirPath: string): Promise<void> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await deleteDirectoryRecursive(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }
    
    // Remove the empty directory
    await fs.rmdir(dirPath);
  } catch (error) {
    throw new Error(`Failed to delete directory: ${error}`);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderPath = searchParams.get('path');
    
    if (!folderPath) {
      return NextResponse.json(
        { error: 'Folder path is required' },
        { status: 400 }
      );
    }

    // First, try to delete from virtual folder structure
    const structureFilePath = path.join(process.cwd(), 'folder-structure.json');
    let folderStructure: FolderStructure = {};
    let isVirtualFolder = false;
    
    try {
      const existingData = await fs.readFile(structureFilePath, 'utf-8');
      folderStructure = JSON.parse(existingData);
      
      // Check if this is a virtual folder
      if (folderStructure[folderPath]) {
        isVirtualFolder = true;
        
        // Remove the virtual folder and any subfolders
        const foldersToDelete = Object.keys(folderStructure).filter(key => 
          key === folderPath || key.startsWith(folderPath + '/')
        );
        
        foldersToDelete.forEach(key => {
          delete folderStructure[key];
        });
        
        // Save updated structure
        await fs.writeFile(structureFilePath, JSON.stringify(folderStructure, null, 2));
      }
    } catch (error) {
      // File doesn't exist, continue with physical folder deletion
      console.log('No virtual folder structure found');
    }

    // If it's not a virtual folder, try to delete physical folder
    if (!isVirtualFolder) {
      // Ensure the folder is within the public directory
      const publicDir = path.join(process.cwd(), 'public');
      const fullPath = path.join(publicDir, folderPath);
      
      // Security check: ensure the path is within public directory
      if (!fullPath.startsWith(publicDir)) {
        return NextResponse.json(
          { error: 'Invalid folder path' },
          { status: 403 }
        );
      }

      // Prevent deletion of the entire public directory
      if (fullPath === publicDir) {
        return NextResponse.json(
          { error: 'Cannot delete the entire public directory' },
          { status: 403 }
        );
      }

      // Check if physical folder exists
      try {
        const stats = await fs.stat(fullPath);
        if (!stats.isDirectory()) {
          return NextResponse.json(
            { error: 'Path is not a directory' },
            { status: 400 }
          );
        }
        
        // Delete the physical folder and all its contents
        await deleteDirectoryRecursive(fullPath);
      } catch (error) {
        // If neither virtual nor physical folder exists, return error
        if (!isVirtualFolder) {
          return NextResponse.json(
            { error: 'Folder not found' },
            { status: 404 }
          );
        }
      }
    }
    
    // Remove related entries from access log
    try {
      const accessLogPath = path.join(process.cwd(), 'access-log.json');
      const accessLogData = await fs.readFile(accessLogPath, 'utf-8');
      const accessLog = JSON.parse(accessLogData);
      
      // Filter out files that were in the deleted folder
      const updatedLog = accessLog.filter((entry: any) => 
        !entry.filePath.startsWith(folderPath + '/') && entry.filePath !== folderPath
      );
      
      await fs.writeFile(accessLogPath, JSON.stringify(updatedLog, null, 2));
    } catch (error) {
      // Access log update is not critical, continue
      console.warn('Could not update access log:', error);
    }

    return NextResponse.json(
      { message: 'Folder deleted successfully', path: folderPath },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}