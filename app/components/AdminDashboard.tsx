'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalNotes: number;
  recentNotes: number;
  adminLogs: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  preferredUsername: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  role?: 'user' | 'admin';
}

interface Note {
  id: string;
  title: string;
  bodyText: string;
  creator: string;
  creatorEmail?: string;
  type?: string;
  createdAt: string;
  published?: boolean;
}

interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  details: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'notes' | 'logs'>('stats');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, usersResponse, notesResponse, logsResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/database/users'),
        fetch('/api/database/notes'),
        fetch('/api/admin/logs')
      ]);

      if (!statsResponse.ok) throw new Error('Failed to load stats');
      if (!usersResponse.ok) throw new Error('Failed to load users');
      if (!notesResponse.ok) throw new Error('Failed to load notes');
      if (!logsResponse.ok) throw new Error('Failed to load logs');

      const [statsData, usersData, notesData, logsData] = await Promise.all([
        statsResponse.json(),
        usersResponse.json(),
        notesResponse.json(),
        logsResponse.json()
      ]);

      setStats(statsData.stats);
      setUsers(usersData.users || []);
      setNotes(notesData.notes || []);
      setLogs(logsData.logs || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'promote' | 'deactivate') => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId,
          adminId: 'current-admin-id', // TODO: Get from auth context
          adminEmail: 'admin@example.com' // TODO: Get from auth context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform user action');
      }

      const result = await response.json();
      alert(result.message);
      loadAdminData(); // Reload data
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading admin data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={loadAdminData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Admin Dashboard</CardTitle>
        <div className="flex space-x-4 mt-4">
          <Button
            variant={activeTab === 'stats' ? 'default' : 'outline'}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
          >
            Users ({users.length})
          </Button>
          <Button
            variant={activeTab === 'notes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('notes')}
          >
            Notes ({notes.length})
          </Button>
          <Button
            variant={activeTab === 'logs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('logs')}
          >
            Admin Logs ({logs.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalNotes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentNotes}</div>
                <p className="text-xs text-gray-600">Last 7 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Admin Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.adminLogs}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">All Users</h3>
              <Button onClick={loadAdminData} size="sm">
                Refresh
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Username</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                      <td className="border border-gray-300 px-4 py-2">{user.preferredUsername}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex space-x-2">
                          {user.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user.id, 'promote')}
                            >
                              Promote
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUserAction(user.id, 'deactivate')}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">All Notes</h3>
              <Button onClick={loadAdminData} size="sm">
                Refresh
              </Button>
            </div>
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-lg font-semibold">{note.title}</h4>
                  <p className="text-gray-700 mt-2">{note.bodyText}</p>
                  <div className="mt-3 text-sm text-gray-500 flex space-x-4">
                    <span>Type: {note.type || 'note'}</span>
                    <span>Creator: {note.creator}</span>
                    <span>Created: {new Date(note.createdAt).toLocaleString()}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      note.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {note.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Admin Activity Logs</h3>
              <Button onClick={loadAdminData} size="sm">
                Refresh
              </Button>
            </div>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{log.action}</span>
                      <span className="text-gray-600 ml-2">by {log.adminEmail}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                  {log.targetId && (
                    <p className="text-xs text-gray-500 mt-1">Target ID: {log.targetId}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

