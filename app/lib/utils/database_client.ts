// Client-side functions for database operations
// These functions make API calls to our Next.js API routes

export interface User {
  id: string;
  email: string;
  name: string;
  preferredUsername: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  role?: 'user' | 'admin';
}

export interface Note {
  id: string;
  title: string;
  bodyText: string;
  creator: string;
  creatorEmail?: string;
  type?: string;
  media?: string[];
  audio?: string[];
  latitude?: number;
  longitude?: number;
  published?: boolean;
  tags?: string[];
  time?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalNotes: number;
  recentNotes: number;
  adminLogs: number;
}

// Generic API call function
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `/api${endpoint}`;
  
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

// User operations
export async function createUser(userData: {
  email: string;
  name: string;
  preferredUsername: string;
}): Promise<{ message: string; user: User }> {
  return apiCall('/database/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function getUserById(id: string): Promise<{ user: User }> {
  return apiCall(`/database/users?id=${id}`, {
    method: 'GET',
  });
}

export async function getUserByEmail(email: string): Promise<{ user: User }> {
  return apiCall(`/database/users?email=${email}`, {
    method: 'GET',
  });
}

export async function getAllUsers(): Promise<{ users: User[] }> {
  return apiCall('/database/users', {
    method: 'GET',
  });
}

export async function updateUser(id: string, updates: Partial<User>): Promise<{ message: string; user: User }> {
  return apiCall(`/database/users?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Note operations
export async function createNoteInDatabase(noteData: {
  title: string;
  bodyText: string;
  creator: string;
  creatorEmail?: string;
  type?: string;
  media?: string[];
  audio?: string[];
  latitude?: number;
  longitude?: number;
  published?: boolean;
  tags?: string[];
  time?: string;
}): Promise<{ message: string; note: Note }> {
  return apiCall('/database/notes', {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
}

export async function getNoteById(id: string): Promise<{ note: Note }> {
  return apiCall(`/database/notes?id=${id}`, {
    method: 'GET',
  });
}

export async function getAllNotesFromDatabase(): Promise<{ notes: Note[] }> {
  return apiCall('/database/notes', {
    method: 'GET',
  });
}

export async function getNotesByUser(creator: string): Promise<{ notes: Note[] }> {
  return apiCall(`/database/notes?creator=${creator}`, {
    method: 'GET',
  });
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<{ message: string; note: Note }> {
  return apiCall(`/database/notes?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteNote(id: string): Promise<{ message: string }> {
  return apiCall(`/database/notes?id=${id}`, {
    method: 'DELETE',
  });
}

// Admin operations
export async function getAdminStats(): Promise<{ message: string; stats: AdminStats }> {
  return apiCall('/admin/stats', {
    method: 'GET',
  });
}

export async function getAllAdminLogs(): Promise<{ message: string; logs: any[] }> {
  return apiCall('/admin/logs', {
    method: 'GET',
  });
}

export async function createAdminLog(logData: {
  adminId: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  details: string;
}): Promise<{ message: string; log: any }> {
  return apiCall('/admin/logs', {
    method: 'POST',
    body: JSON.stringify(logData),
  });
}

export async function promoteUserToAdmin(userId: string, adminId: string, adminEmail: string): Promise<{ message: string; success: boolean }> {
  return apiCall('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      action: 'promote',
      userId,
      adminId,
      adminEmail
    }),
  });
}

export async function deactivateUser(userId: string, adminId: string, adminEmail: string): Promise<{ message: string; success: boolean }> {
  return apiCall('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      action: 'deactivate',
      userId,
      adminId,
      adminEmail
    }),
  });
}

