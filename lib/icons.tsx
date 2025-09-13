import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  Archive,
  Folder,
  LucideProps
} from 'lucide-react';
import { ComponentType } from 'react';

/**
 * Type for icon component with predefined styling
 */
type IconComponent = ComponentType<LucideProps>;

/**
 * File type categories for better organization
 */
const FILE_TYPES = {
  IMAGE: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico'] as readonly string[],
  VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'] as readonly string[],
  AUDIO: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'] as readonly string[],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'] as readonly string[],
  SPREADSHEET: ['xls', 'xlsx', 'csv', 'ods'] as readonly string[],
  CODE: [
    'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'sass', 'less',
    'json', 'xml', 'yaml', 'yml', 'py', 'java', 'cpp', 'c', 'h',
    'php', 'rb', 'go', 'rs', 'swift', 'kt', 'dart', 'vue', 'svelte'
  ] as readonly string[],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'] as readonly string[]
};

/**
 * Icon configurations with colors and components
 */
const ICON_CONFIG = {
  IMAGE: { component: FileImage, color: 'text-green-500' },
  VIDEO: { component: FileVideo, color: 'text-red-500' },
  AUDIO: { component: FileAudio, color: 'text-purple-500' },
  DOCUMENT: { component: FileText, color: 'text-blue-500' },
  SPREADSHEET: { component: FileSpreadsheet, color: 'text-green-600' },
  CODE: { component: FileCode, color: 'text-orange-500' },
  ARCHIVE: { component: Archive, color: 'text-yellow-500' },
  DEFAULT: { component: File, color: 'text-gray-500' }
} as const;

/**
 * Special file extensions with custom colors
 */
const SPECIAL_EXTENSIONS = {
  'pdf': { component: FileText, color: 'text-red-600' }
} as const;

/**
 * Determines the file type category based on extension
 * Used internally to categorize files for appropriate icon selection
 * @param extension - The file extension (without dot)
 * @returns The file type category from ICON_CONFIG
 * @example
 * getFileTypeCategory('jpg') // returns 'IMAGE'
 * getFileTypeCategory('pdf') // returns 'DOCUMENT'
 */
function getFileTypeCategory(extension: string): keyof typeof ICON_CONFIG {
  const ext = extension.toLowerCase();
  
  for (const [category, extensions] of Object.entries(FILE_TYPES)) {
    if (extensions.includes(ext)) {
      return category as keyof typeof ICON_CONFIG;
    }
  }
  
  return 'DEFAULT';
}

/**
 * Gets the appropriate icon component for a file based on its name
 * @param filename - The name of the file
 * @returns A React component that renders the appropriate icon
 */
export function getFileIcon(filename: string): IconComponent {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // Check for special extensions first
  if (extension in SPECIAL_EXTENSIONS) {
    const { component: IconComponent, color } = SPECIAL_EXTENSIONS[extension as keyof typeof SPECIAL_EXTENSIONS];
    return (props: LucideProps) => <IconComponent {...props} className={`${color} ${props.className || ''}`} />;
  }
  
  // Use category-based icon
  const category = getFileTypeCategory(extension);
  const { component: IconComponent, color } = ICON_CONFIG[category];
  
  return (props: LucideProps) => <IconComponent {...props} className={`${color} ${props.className || ''}`} />;
}

/**
 * Gets the folder icon component
 * @returns A React component that renders a folder icon
 */
export function getFolderIcon(): IconComponent {
  return (props: LucideProps) => <Folder {...props} className={`text-blue-500 ${props.className || ''}`} />;
}

/**
 * Utility function to get file extension from filename
 * @param filename - The filename to extract extension from
 * @returns The lowercase file extension without the dot
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
}

/**
 * Checks if a file is of a specific type category
 * @param filename - The filename to check
 * @param category - The category to check against
 * @returns True if the file belongs to the specified category
 */
export function isFileType(filename: string, category: keyof typeof FILE_TYPES): boolean {
  const extension = getFileExtension(filename);
  return FILE_TYPES[category].includes(extension);
}