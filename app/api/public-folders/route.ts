import { NextResponse } from 'next/server';
import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';

export interface PublicItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  children?: PublicItem[];
  size?: number;
}

interface FolderStructure {
  [key: string]: {
    type: 'folder';
    name: string;
    path: string;
    children?: FolderStructure;
    createdAt: string;
  };
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
 * Reads virtual folders from JSON file
 */
async function readVirtualFolders(): Promise<FolderStructure> {
  try {
    const structureFilePath = join(process.cwd(), 'folder-structure.json');
    const data = await readFile(structureFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty
    return {};
  }
}

/**
 * Merges virtual folders with actual files
 */
function mergeVirtualAndActualItems(
  actualItems: PublicItem[],
  virtualFolders: FolderStructure,
  currentPath: string = ''
): PublicItem[] {
  const result: PublicItem[] = [...actualItems];
  
  // Add virtual folders that match the current path level
  Object.values(virtualFolders).forEach(folder => {
    const folderParentPath = folder.path.includes('/') 
      ? folder.path.substring(0, folder.path.lastIndexOf('/'))
      : '';
    
    // Only add folders that belong to the current path level
    if (folderParentPath === currentPath) {
      const existingFolder = result.find(item => 
        item.type === 'folder' && item.name === folder.name
      );
      
      if (!existingFolder) {
        result.push({
          id: folder.path,
          name: folder.name,
          type: 'folder',
          path: folder.path,
          children: [] // Will be populated recursively if needed
        });
      }
    }
  });
  
  return result.sort((a, b) => {
    // Folders first, then files
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * GET /api/public-folders
 * Returns all folders and files, including virtual folders
 */
export async function GET() {
  try {
    const publicDir = join(process.cwd(), 'public');
    const virtualFolders = await readVirtualFolders();
    
    // Read actual files from public directory
    let actualItems: PublicItem[] = [];
    try {
      actualItems = await readItemsRecursive(publicDir);
    } catch (error) {
      console.log('Public directory not accessible, using virtual folders only');
    }
    
    // Merge virtual folders with actual items
    const mergedItems = mergeVirtualAndActualItems(actualItems, virtualFolders);
    
    return NextResponse.json({
      id: 'public-root',
      name: 'Public Files',
      type: 'folder',
      path: '',
      children: mergedItems
    });
  } catch (error) {
    console.error('Error reading public items:', error);
    return NextResponse.json(
      { error: 'Failed to read items' },
      { status: 500 }
    );
  }
}