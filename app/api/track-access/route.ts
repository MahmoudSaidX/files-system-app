import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface AccessLog {
  filePath: string;
  fileName: string;
  accessedAt: string;
  size: number;
}

const ACCESS_LOG_FILE = path.join(process.cwd(), 'access-log.json');

// Helper function to read access log
async function readAccessLog(): Promise<AccessLog[]> {
  try {
    const data = await fs.readFile(ACCESS_LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Helper function to write access log
async function writeAccessLog(logs: AccessLog[]): Promise<void> {
  await fs.writeFile(ACCESS_LOG_FILE, JSON.stringify(logs, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const { filePath, fileName, size } = await request.json();
    
    if (!filePath || !fileName) {
      return NextResponse.json(
        { error: 'File path and name are required' },
        { status: 400 }
      );
    }

    // Read existing access log
    const accessLogs = await readAccessLog();
    
    // Create new access entry
    const newAccess: AccessLog = {
      filePath,
      fileName,
      accessedAt: new Date().toISOString(),
      size: size || 0
    };
    
    // Remove any existing entry for the same file to avoid duplicates
    const filteredLogs = accessLogs.filter(log => log.filePath !== filePath);
    
    // Add new access at the beginning (most recent first)
    filteredLogs.unshift(newAccess);
    
    // Keep only the last 100 access records to prevent the file from growing too large
    const trimmedLogs = filteredLogs.slice(0, 100);
    
    // Write back to file
    await writeAccessLog(trimmedLogs);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking file access:', error);
    return NextResponse.json(
      { error: 'Failed to track file access' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const accessLogs = await readAccessLog();
    return NextResponse.json(accessLogs);
  } catch (error) {
    console.error('Error reading access log:', error);
    return NextResponse.json(
      { error: 'Failed to read access log' },
      { status: 500 }
    );
  }
}