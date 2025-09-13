'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useState } from 'react';
import './globals.css';
import { RefreshProvider } from '@/lib/refreshContext';
import { Menu, X } from 'lucide-react';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:w-56 xl:w-64
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:justify-center">
              <h2 className="text-lg font-semibold text-gray-800">File Explorer</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="p-4 space-y-1">
              <Link 
                href="/" 
                className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
                onClick={() => setSidebarOpen(false)}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2v0z" />
                </svg>
                <span className="truncate">My Files</span>
              </Link>
              <Link 
                href="/recent" 
                className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
                onClick={() => setSidebarOpen(false)}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="truncate">Recent</span>
              </Link>
            </nav>
          </aside>
          
          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 lg:hidden">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold text-gray-800">File Explorer</h1>
                <div className="w-9" /> {/* Spacer for centering */}
              </div>
            </header>
            
            {/* Main content area */}
            <main className="flex-1 overflow-auto">
              <div className="container-responsive py-4 sm:py-6 lg:py-8">
                <RefreshProvider>
                  {children}
                </RefreshProvider>
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
