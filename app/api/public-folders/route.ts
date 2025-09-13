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
 * Returns all folders in the public directory
 */
export async function GET() {
  try {
    const publicDir = join(process.cwd(), 'public');
    const items = await readItemsRecursive(publicDir);
    
    return NextResponse.json({
      id: 'public-root',
      name: 'Public Files',
      type: 'folder',
      path: '',
      children: items
    });
  } catch (error) {
    console.error('Error reading public items:', error);
    return NextResponse.json(
      { error: 'Failed to read items' },
      { status: 500 }
    );
  }
}