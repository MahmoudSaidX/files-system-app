import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Ensure the file is within the public directory
    const publicDir = path.join(process.cwd(), 'public');
    const fullPath = path.join(publicDir, filePath);
    
    // Security check: ensure the path is within public directory
    if (!fullPath.startsWith(publicDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      const stats = await fs.stat(fullPath);
      if (!stats.isFile()) {
        return NextResponse.json(
          { error: 'Path is not a file' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete the file
    await fs.unlink(fullPath);
    
    // Also remove from access log if it exists
    try {
      const accessLogPath = path.join(process.cwd(), 'access-log.json');
      const accessLogData = await fs.readFile(accessLogPath, 'utf-8');
      const accessLog = JSON.parse(accessLogData);
      
      // Filter out the deleted file
      const updatedLog = accessLog.filter((entry: any) => entry.filePath !== filePath);
      
      await fs.writeFile(accessLogPath, JSON.stringify(updatedLog, null, 2));
    } catch (error) {
      // Access log update is not critical, continue
      console.warn('Could not update access log:', error);
    }

    return NextResponse.json(
      { message: 'File deleted successfully', path: filePath },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}