'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface ParsedUser {
  email: string;
  name: string;
  preferredUsername: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  processed: number;
  inserted: number;
  errors: string[];
  preview?: ParsedUser[];
}

export default function ExcelUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        setFile(selectedFile);
        setError(null);
        setUploadResult(null);
        setShowPreview(false);
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        setFile(null);
      }
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setPreviewing(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preview', 'true');

      const response = await fetch('/api/admin/upload-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Preview failed');
      }

      const result = await response.json();
      setUploadResult(result);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
      setShowPreview(false);
      
      if (result.success) {
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/upload-excel');
      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Users from Excel</CardTitle>
        <p className="text-sm text-gray-600">
          Upload an Excel file to bulk import users into the database
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Template Download */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            📋 Download Template
          </h3>
          <p className="text-blue-700 text-sm mb-3">
            Download our Excel template with the correct column headers and sample data.
          </p>
          <Button onClick={downloadTemplate} variant="outline" size="sm">
            📥 Download Template
          </Button>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Excel File
          </label>
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-md"
            disabled={uploading || previewing}
          />
          {error && (
            <p className="text-red-600 text-sm mt-1">{error}</p>
          )}
        </div>

        {/* File Info */}
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

        {/* Action Buttons */}
        {file && (
          <div className="flex space-x-4">
            <Button
              onClick={handlePreview}
              disabled={uploading || previewing}
              variant="outline"
            >
              {previewing ? 'Previewing...' : '👁️ Preview Data'}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || previewing}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploading ? 'Uploading...' : '📤 Upload Users'}
            </Button>
          </div>
        )}

        {/* Preview Results */}
        {showPreview && uploadResult && uploadResult.preview && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              📊 Data Preview ({uploadResult.preview.length} of {uploadResult.processed} rows)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-yellow-100">
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Username</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.preview.map((user, index) => (
                    <tr key={index} className="border-b border-yellow-200">
                      <td className="px-3 py-2">{user.email}</td>
                      <td className="px-3 py-2">{user.name}</td>
                      <td className="px-3 py-2">{user.preferredUsername}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {uploadResult.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-red-700">Errors found:</p>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {uploadResult.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {uploadResult.errors.length > 5 && (
                    <li>... and {uploadResult.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upload Results */}
        {uploadResult && !showPreview && (
          <div className={`border rounded-lg p-4 ${
            uploadResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-3 ${
              uploadResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {uploadResult.success ? '✅ Upload Successful!' : '❌ Upload Failed'}
            </h3>
            
            <div className="space-y-2 text-sm">
              <p><strong>Message:</strong> {uploadResult.message}</p>
              <p><strong>Rows Processed:</strong> {uploadResult.processed}</p>
              <p><strong>Users Inserted:</strong> {uploadResult.inserted}</p>
              
              {uploadResult.errors.length > 0 && (
                <div>
                  <p className="font-medium text-red-700">Errors:</p>
                  <ul className="text-red-600 list-disc list-inside max-h-32 overflow-y-auto">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            📝 Instructions
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Required Columns:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Email:</strong> Valid email address (required)</li>
              <li><strong>Name:</strong> Full name or first name (required)</li>
              <li><strong>Preferred Username:</strong> Username (optional, will be generated from email if not provided)</li>
            </ul>
            <p><strong>Supported Column Names:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Email: "Email", "Email Address", "Mail"</li>
              <li>Name: "Name", "Full Name", "Display Name", "First Name", "Last Name"</li>
              <li>Username: "Preferred Username", "Username", "User", "Login", "Handle"</li>
            </ul>
            <p><strong>Tips:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Use the preview function before uploading to check your data</li>
              <li>Ensure all email addresses are valid and unique</li>
              <li>Maximum file size: 10MB</li>
              <li>Existing users with the same email will be skipped</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

