import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
// IMPORTANT: AWS credentials are server-side only and should NEVER use NEXT_PUBLIC_ prefix
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const dynamoDB = DynamoDBDocumentClient.from(client);

// Table names from environment variables
const USERS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'missouri-crossroads-users';
const NOTES_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_NOTES_TABLE || 'missouri-crossroads-notes';
const ADMIN_LOGS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE || 'missouri-crossroads-admin-logs';

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
  updatedAt: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  details: string;
  timestamp: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalNotes: number;
  recentNotes: number;
  adminLogs: number;
}

export class DatabaseService {
  // User operations
  static async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      ...userData,
      id,
      createdAt: new Date().toISOString(),
    };

    await dynamoDB.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
    }));

    return user;
  }

  static async getUserById(id: string): Promise<User | null> {
    const result = await dynamoDB.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id },
    }));

    return result.Item as User || null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await dynamoDB.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    }));

    return result.Items?.[0] as User || null;
  }

  static async getAllUsers(): Promise<User[]> {
    const result = await dynamoDB.send(new ScanCommand({
      TableName: USERS_TABLE,
    }));

    return result.Items as User[] || [];
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const updateExpression: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpression.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpression.length === 0) {
      throw new Error('No updates provided');
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await dynamoDB.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes as User;
  }

  static async deleteUser(id: string): Promise<void> {
    await dynamoDB.send(new DeleteCommand({
      TableName: USERS_TABLE,
      Key: { id },
    }));
  }

  // Note operations
  static async createNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const id = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const note: Note = {
      ...noteData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDB.send(new PutCommand({
      TableName: NOTES_TABLE,
      Item: note,
    }));

    return note;
  }

  static async getNoteById(id: string): Promise<Note | null> {
    const result = await dynamoDB.send(new GetCommand({
      TableName: NOTES_TABLE,
      Key: { id },
    }));

    return result.Item as Note || null;
  }

  static async getAllNotes(): Promise<Note[]> {
    const result = await dynamoDB.send(new ScanCommand({
      TableName: NOTES_TABLE,
    }));

    return result.Items as Note[] || [];
  }

  static async getNotesByUser(creator: string): Promise<Note[]> {
    const result = await dynamoDB.send(new ScanCommand({
      TableName: NOTES_TABLE,
      FilterExpression: 'creator = :creator',
      ExpressionAttributeValues: {
        ':creator': creator,
      },
    }));

    return result.Items as Note[] || [];
  }

  static async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const updateExpression: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpression.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpression.length === 0) {
      throw new Error('No updates provided');
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await dynamoDB.send(new UpdateCommand({
      TableName: NOTES_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes as Note;
  }

  static async deleteNote(id: string): Promise<void> {
    await dynamoDB.send(new DeleteCommand({
      TableName: NOTES_TABLE,
      Key: { id },
    }));
  }

  // Admin operations
  static async createAdminLog(logData: Omit<AdminLog, 'id' | 'timestamp'>): Promise<AdminLog> {
    const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const log: AdminLog = {
      ...logData,
      id,
      timestamp: new Date().toISOString(),
    };

    await dynamoDB.send(new PutCommand({
      TableName: ADMIN_LOGS_TABLE,
      Item: log,
    }));

    return log;
  }

  static async getAllAdminLogs(): Promise<AdminLog[]> {
    const result = await dynamoDB.send(new ScanCommand({
      TableName: ADMIN_LOGS_TABLE,
    }));

    return result.Items as AdminLog[] || [];
  }

  static async getAdminStats(): Promise<AdminStats> {
    // Get all users
    const usersResult = await dynamoDB.send(new ScanCommand({
      TableName: USERS_TABLE,
    }));
    const users = usersResult.Items as User[] || [];

    // Get all notes
    const notesResult = await dynamoDB.send(new ScanCommand({
      TableName: NOTES_TABLE,
    }));
    const notes = notesResult.Items as Note[] || [];

    // Get all admin logs
    const logsResult = await dynamoDB.send(new ScanCommand({
      TableName: ADMIN_LOGS_TABLE,
    }));
    const logs = logsResult.Items as AdminLog[] || [];

    // Calculate stats
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;
    const totalNotes = notes.length;
    
    // Recent notes (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentNotes = notes.filter(note => 
      new Date(note.createdAt) > thirtyDaysAgo
    ).length;

    const adminLogs = logs.length;

    return {
      totalUsers,
      activeUsers,
      totalNotes,
      recentNotes,
      adminLogs,
    };
  }

  // Data editing and re-upload operations
  static async bulkUpdateNotes(notes: Note[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const note of notes) {
      try {
        await dynamoDB.send(new PutCommand({
          TableName: NOTES_TABLE,
          Item: note,
        }));
        success++;
      } catch (error) {
        console.error(`Failed to update note ${note.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  static async bulkDeleteNotes(noteIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of noteIds) {
      try {
        await dynamoDB.send(new DeleteCommand({
          TableName: NOTES_TABLE,
          Key: { id },
        }));
        success++;
      } catch (error) {
        console.error(`Failed to delete note ${id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  static async searchNotes(query: string): Promise<Note[]> {
    const result = await dynamoDB.send(new ScanCommand({
      TableName: NOTES_TABLE,
      FilterExpression: 'contains(title, :query) OR contains(bodyText, :query)',
      ExpressionAttributeValues: {
        ':query': query,
      },
    }));

    return result.Items as Note[] || [];
  }

  static async getNotesByLocation(latitude: number, longitude: number, radiusKm: number = 10): Promise<Note[]> {
    // Note: This is a simplified location search
    // For production, consider using a geospatial index or external service
    const allNotes = await this.getAllNotes();
    
    return allNotes.filter(note => {
      if (!note.latitude || !note.longitude) return false;
      
      const distance = this.calculateDistance(
        latitude, longitude,
        note.latitude, note.longitude
      );
      
      return distance <= radiusKm;
    });
  }

  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
