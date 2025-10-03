'use client';

import { useState, useEffect } from 'react';
import { getAllNotes } from '../lib/utils/aws_api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface Note {
  id: string;
  title: string;
  BodyText: string;
  creator: string;
  createdAt?: string;
  media?: string[];
  audio?: string[];
  tags?: string[];
  type?: string;
}

export default function NotesViewer() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesData = await getAllNotes();
      
      // Handle different response formats
      let notesArray: Note[] = [];
      
      if (Array.isArray(notesData)) {
        notesArray = notesData;
      } else if (notesData && typeof notesData === 'object' && 'notes' in notesData && Array.isArray((notesData as any).notes)) {
        notesArray = (notesData as any).notes;
      } else if (notesData && typeof notesData === 'object' && 'message' in notesData) {
        // If it's just a success message, set empty array
        notesArray = [];
        console.log('Notes API response:', (notesData as any).message);
      } else {
        console.warn('Unexpected notes data format:', notesData);
        notesArray = [];
      }
      
      setNotes(notesArray);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Loading Notes...</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-white border border-gray-200 shadow-md">
              <CardHeader className="pb-3 bg-white">
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent className="pt-0 bg-white">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Error Loading Notes</h2>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
              <button 
                onClick={loadNotes}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Notes ({notes.length})</h2>
        <button 
          onClick={loadNotes}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Refresh
        </button>
      </div>
      
      {notes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 text-lg">No notes found. Create your first note above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Card key={note.id} className="h-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3 bg-white">
                <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">
                  {note.title || 'Untitled Note'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 bg-white">
                <div className="space-y-3">
                  <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
                    {note.BodyText || 'No content available'}
                  </p>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {note.type || 'note'}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {note.creator || 'Unknown'}
                      </span>
                    </div>
                    
                    {note.createdAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                  
                  {note.media && note.media.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-600 mb-2">Media Files:</p>
                      <div className="flex flex-wrap gap-1">
                        {note.media.map((url, index) => (
                          <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {url.split('/').pop()?.substring(0, 20)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-600 mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {note.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
