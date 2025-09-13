import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileSystemItem[];
}

/**
 * Recursively reads a directory and returns all files and folders
 * @param dirPath - The directory path to read
 * @param maxDepth - Maximum depth to traverse (default: 3)
 * @returns Promise<FileSystemItem[]> - Array of files and directories
 */
export async function readDirectoryRecursive(
  dirPath: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<FileSystemItem[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const items = await readdir(dirPath);
    const result: FileSystemItem[] = [];

    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stats = await stat(fullPath);
      
      const fileSystemItem: FileSystemItem = {
        name: item,
        path: fullPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.isFile() ? stats.size : undefined
      };

      if (stats.isDirectory()) {
        fileSystemItem.children = await readDirectoryRecursive(
          fullPath,
          maxDepth,
          currentDepth + 1
        );
      }

      result.push(fileSystemItem);
    }

    return result;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

/**
 * Gets all files and folders from the public directory
 * @returns Promise<FileSystemItem[]> - Array of files and directories in public folder
 */
export async function getPublicDirectoryContents(): Promise<FileSystemItem[]> {
  const publicPath = join(process.cwd(), 'public');
  return readDirectoryRecursive(publicPath);
}

/**
 * Flattens the directory structure to get all files only
 * @param items - Array of FileSystemItem
 * @returns FileSystemItem[] - Flattened array of files only
 */
export function flattenToFiles(items: FileSystemItem[]): FileSystemItem[] {
  const files: FileSystemItem[] = [];
  
  for (const item of items) {
    if (item.type === 'file') {
      files.push(item);
    }
    if (item.children) {
      files.push(...flattenToFiles(item.children));
    }
  }
  
  return files;
}