'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function CSVUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Metadata CSV</CardTitle>
        <p className="text-sm text-gray-600">
          Upload your CSV metadata file to make it publicly accessible
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-md"
            disabled={uploading}
          />
          {error && (
            <p className="text-red-600 text-sm mt-1">{error}</p>
          )}
        </div>

        {file && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm">
              <strong>Selected file:</strong> {file.name}
            </p>
            <p className="text-sm text-gray-600">
              Size: {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </Button>

        {uploadResult && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-green-800 font-medium">Upload Successful!</h3>
            <div className="mt-2 space-y-1 text-sm text-green-700">
              <p><strong>File:</strong> {uploadResult.filename}</p>
              <p><strong>Public URL:</strong> 
                <a 
                  href={uploadResult.publicUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  {uploadResult.publicUrl}
                </a>
              </p>
              <p><strong>Size:</strong> {(uploadResult.size / 1024).toFixed(2)} KB</p>
              <p><strong>Uploaded:</strong> {new Date(uploadResult.uploadedAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
