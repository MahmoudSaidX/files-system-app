import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export interface PublicItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  children?: PublicItem[];
  size?: number;
}

/**
 * Recursively reads folders from a directory
 */
async function readItemsRecursive(
  dirPath: string,
  relativePath: string = ''
): Promise<PublicItem[]> {
  try {
    const items = await readdir(dirPath);
    const result: PublicItem[] = [];
    
    for (const item of items) {
      // Skip hidden files and .gitignore
      if (item.startsWith('.')) continue;
      
      const fullPath = join(dirPath, item);
      const itemStat = await stat(fullPath);
      const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
      
      if (itemStat.isDirectory()) {
        const children = await readItemsRecursive(fullPath, itemRelativePath);
        
        result.push({
          id: itemRelativePath || item,
          name: item,
          type: 'folder',
          path: itemRelativePath,
          children
        });
      } else {
        result.push({
          id: itemRelativePath || item,
          name: item,
          type: 'file',
          path: itemRelativePath,
          size: itemStat.size
        });
      }
    }
    
    return result.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}

/**
 * GET /api/public-folders
 * Returns all folders and files from the public directory
 */
export async function GET() {
  try {
    const publicDir = join(process.cwd(), 'public');
    
    // Read files from public directory
    let items: PublicItem[] = [];
    try {
      items = await readItemsRecursive(publicDir);
    } catch (error) {
      console.log('Public directory not accessible, returning empty structure');
    }
    
    // Create the root structure
    const root: PublicItem = {
      id: 'public-root',
      name: 'Public Files',
      type: 'folder',
      path: '',
      children: items
    };
    
    return NextResponse.json(root);
  } catch (error) {
    console.error('Error reading public items:', error);
    return NextResponse.json(
      { error: 'Failed to read items' },
      { status: 500 }
    );
  }
}