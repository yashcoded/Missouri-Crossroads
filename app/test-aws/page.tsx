'use client';

import React from 'react';
import NoteCreator from '../components/NoteCreator';
import AuthForm from '../components/AuthForm';
import NotesViewer from '../components/NotesViewer';
import CSVUploader from '../components/CSVUploader';

export default function TestAWSPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">
        AWS Integration Test
      </h1>
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            Setup Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>Configure your AWS environment variables in <code>.env.local</code></li>
            <li>Set up AWS Cognito User Pool and get your credentials</li>
            <li>Set up API Gateway and connect it to your Lambda function</li>
            <li>Configure S3 bucket CORS and permissions</li>
            <li>Test authentication and file uploads below</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
            <AuthForm />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Note Creator</h2>
            <NoteCreator />
          </div>
        </div>
        
        <div className="mt-8">
          <NotesViewer />
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">Admin Tools</h2>
          <CSVUploader />
        </div>
      </div>
    </div>
  );
} 