const API_BASE_URL = '/api';

export interface NoteData {
  title: string;
  BodyText: string;
  type?: string;
  creator: string;
  media?: string[];
  latitude?: number;
  longitude?: number;
  audio?: string[];
  published?: boolean;
  tags?: string[];
  time?: string;
}

export interface NoteResponse {
  message: string;
  noteId?: string;
  error?: string;
}

// Generic API call function
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Create a new note
export async function createNote(noteData: NoteData): Promise<NoteResponse> {
  return apiCall('/notes', {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
}

// Get a note by ID
export async function getNote(noteId: string): Promise<any> {
  return apiCall(`/notes?id=${noteId}`, {
    method: 'GET',
  });
}

// Update an existing note
export async function updateNote(noteId: string, noteData: NoteData): Promise<NoteResponse> {
  return apiCall(`/notes?id=${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(noteData),
  });
}

// Delete a note
export async function deleteNote(noteId: string): Promise<NoteResponse> {
  return apiCall(`/notes?id=${noteId}`, {
    method: 'DELETE',
  });
}

// Get all notes (you might want to add this to your Lambda)
export async function getAllNotes(): Promise<any[]> {
  return apiCall('/notes', {
    method: 'GET',
  });
} 