import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface RecentFile {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: string;
  extension: string;
  accessedAt?: string;
}

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
    return [];
  }
}

// Helper function to get all files recursively
async function getAllFilesRecursive(dir: string, basePath: string = ''): Promise<RecentFile[]> {
  const files: RecentFile[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      // Skip hidden files and directories
      if (entry.name.startsWith('.')) continue;
      
      const fullPath = path.join(dir, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      
      if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        const extension = path.extname(entry.name).slice(1).toLowerCase();
        
        files.push({
          id: relativePath,
          name: entry.name,
          path: relativePath,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          extension
        });
      } else if (entry.isDirectory()) {
        // Recursively get files from subdirectories
        const subFiles = await getAllFilesRecursive(fullPath, relativePath);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    
    // First, try to get recently accessed files from access log
    const accessLogs = await readAccessLog();
    
    if (accessLogs.length > 0) {
      // Convert access logs to recent files format
      const recentFiles: RecentFile[] = [];
      
      for (const log of accessLogs.slice(0, 20)) {
        try {
          const fullPath = path.join(publicDir, log.filePath);
          const stats = await fs.stat(fullPath);
          const extension = path.extname(log.fileName).slice(1).toLowerCase();
          
          recentFiles.push({
            id: log.filePath,
            name: log.fileName,
            path: log.filePath,
            size: log.size || stats.size,
            lastModified: stats.mtime.toISOString(),
            extension,
            accessedAt: log.accessedAt
          });
        } catch (error) {
          // File might have been deleted, skip it
          console.warn(`File ${log.filePath} no longer exists`);
        }
      }
      
      if (recentFiles.length > 0) {
        return NextResponse.json(recentFiles);
      }
    }
    
    // Fallback: if no access log or no valid files, use file modification times
    const allFiles = await getAllFilesRecursive(publicDir);
    const recentFiles = allFiles
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      .slice(0, 20);
    
    return NextResponse.json(recentFiles);
  } catch (error) {
    console.error('Error fetching recent files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent files' },
      { status: 500 }
    );
  }
}