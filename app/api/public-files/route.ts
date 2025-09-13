import { NextResponse } from 'next/server';
import { getPublicDirectoryContents, flattenToFiles } from '@/lib/fileSystem';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const flat = searchParams.get('flat') === 'true';
    
    const contents = await getPublicDirectoryContents();
    
    if (flat) {
      // Return only files in a flat structure
      const files = flattenToFiles(contents);
      return NextResponse.json({
        success: true,
        type: 'flat',
        data: files
      });
    }
    
    // Return hierarchical structure
    return NextResponse.json({
      success: true,
      type: 'hierarchical',
      data: contents
    });
  } catch (error) {
    console.error('Error reading public directory:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to read public directory contents' 
      },
      { status: 500 }
    );
  }
}