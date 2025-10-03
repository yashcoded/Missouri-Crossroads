'use client';

import React, { useEffect } from 'react';
import NoteCreator from '../../components/NoteCreator';
import { isAuthenticated } from '../../lib/utils/auth_service';

export default function NewNotePage() {
  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/auth';
    }
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Create a New Note</h1>
      <div className="max-w-4xl mx-auto">
        <NoteCreator />
      </div>
    </div>
  );
}
