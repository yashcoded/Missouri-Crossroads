'use client';

import React, { useState, useRef } from 'react';
import { createNote } from '../lib/utils/aws_api';
import { uploadImage, uploadVideo, uploadAudio } from '../lib/utils/s3_upload';
import { getCurrentUser, isAuthenticated } from '../lib/utils/auth_service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface NoteFormData {
  title: string;
  BodyText: string;
  type: string;
  media: string[];
  audio: string[];
  latitude?: number;
  longitude?: number;
  tags: string[];
  time: string;
}

export default function NoteCreator() {
  const [formData, setFormData] = useState<NoteFormData>({
    title: '',
    BodyText: '',
    type: 'note',
    media: [],
    audio: [],
    tags: [],
    time: new Date().toISOString(),
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof NoteFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (files: FileList, type: 'media' | 'audio') => {
    if (!isAuthenticated()) {
      alert('Please sign in to upload files');
      return;
    }

    setIsLoading(true);
    const uploadedUrls: string[] = [];
    const newFiles = Array.from(files);

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      try {
        let result;
        if (type === 'media') {
          if (file.type.startsWith('image/')) {
            result = await uploadImage(file);
          } else if (file.type.startsWith('video/')) {
            result = await uploadVideo(file);
          } else {
            result = await uploadImage(file); // Default to image upload
          }
        } else {
          result = await uploadAudio(file);
        }

        if (result.success && result.url) {
          uploadedUrls.push(result.url);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } else {
          console.error('Upload failed for:', file.name, result.error);
        }
      } catch (error) {
        console.error('Upload error for:', file.name, error);
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
      }
    }

    // Update form data with new URLs
    if (type === 'media') {
      handleInputChange('media', [...formData.media, ...uploadedUrls]);
    } else {
      handleInputChange('audio', [...formData.audio, ...uploadedUrls]);
    }

    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      alert('Please sign in to create a note');
      return;
    }

    if (!formData.title || !formData.BodyText) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const currentUser = getCurrentUser();
      const noteData = {
        ...formData,
        creator: currentUser?.sub || 'unknown',
        published: false,
      };

      const result = await createNote(noteData);
      
      if (result.noteId) {
        alert('Note created successfully!');
        // Reset form
        setFormData({
          title: '',
          BodyText: '',
          type: 'note',
          media: [],
          audio: [],
          tags: [],
          time: new Date().toISOString(),
        });
        setUploadProgress({});
      } else {
        alert('Failed to create note: ' + result.error);
      }
    } catch (error) {
      console.error('Create note error:', error);
      alert('Failed to create note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (type: 'media' | 'audio', index: number) => {
    if (type === 'media') {
      handleInputChange('media', formData.media.filter((_, i) => i !== index));
    } else {
      handleInputChange('audio', formData.audio.filter((_, i) => i !== index));
    }
  };

  if (!isAuthenticated()) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 mb-4">
            Please sign in to create notes and upload files.
          </p>
          <Button className="w-full" onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Note</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter note title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content *</label>
            <Textarea
              value={formData.BodyText}
              onChange={(e) => handleInputChange('BodyText', e.target.value)}
              placeholder="Enter note content"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="note">Note</option>
              <option value="story">Story</option>
              <option value="memory">Memory</option>
              <option value="event">Event</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Media Files</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'media')}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              variant="outline"
            >
              Upload Media
            </Button>
            
            {formData.media.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.media.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate">{url}</span>
                    <Button
                      type="button"
                      onClick={() => removeFile('media', index)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Audio Files</label>
            <input
              ref={audioInputRef}
              type="file"
              multiple
              accept="audio/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'audio')}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              disabled={isLoading}
              variant="outline"
            >
              Upload Audio
            </Button>
            
            {formData.audio.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.audio.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate">{url}</span>
                    <Button
                      type="button"
                      onClick={() => removeFile('audio', index)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <Input
              value={formData.tags.join(', ')}
              onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
              placeholder="Enter tags separated by commas"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating...' : 'Create Note'}
          </Button>
        </form>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Upload Progress</h4>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="flex items-center space-x-2">
                <span className="text-sm flex-1">{fileName}</span>
                {progress === -1 ? (
                  <span className="text-red-500 text-sm">Failed</span>
                ) : progress === 100 ? (
                  <span className="text-green-500 text-sm">Complete</span>
                ) : (
                  <span className="text-blue-500 text-sm">{progress}%</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 