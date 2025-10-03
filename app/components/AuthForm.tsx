'use client';

import React, { useState } from 'react';
import { 
  registerUser, 
  confirmRegistration, 
  signInUser, 
  signOutUser,
  isAuthenticated 
} from '../lib/utils/auth_service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'confirm'>('signin');
  const [preferredUsername, setPreferredUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const result = await registerUser(preferredUsername, email, password, name);
      if (result.success) {
        setMessage('Registration successful! Please check your email for the confirmation code.');
        setMode('confirm');
      } else {
        setMessage('Registration failed: ' + result.error);
      }
    } catch (error) {
      setMessage('Registration error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const result = await confirmRegistration(preferredUsername, confirmCode);
      if (result.success) {
        setMessage('Account confirmed! You can now sign in.');
        setMode('signin');
        setPreferredUsername('');
        setEmail('');
        setPassword('');
        setConfirmCode('');
        setName('');
      } else {
        setMessage('Confirmation failed: ' + result.error);
      }
    } catch (error) {
      setMessage('Confirmation error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const result = await signInUser(preferredUsername, password);
      if (result.success) {
        setMessage('Sign in successful!');
        window.location.href = '/notes/new';
      } else {
        setMessage('Sign in failed: ' + result.error);
      }
    } catch (error) {
      setMessage('Sign in error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOutUser();
      setMessage('Signed out successfully!');
      window.location.reload();
    } catch (error) {
      setMessage('Sign out error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated()) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Signed In</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 mb-4">
            You are currently signed in.
          </p>
          <Button 
            onClick={handleSignOut} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'signup' && 'Create Account'}
          {mode === 'signin' && 'Sign In'}
          {mode === 'confirm' && 'Confirm Account'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <div className={`p-3 rounded mb-4 text-sm ${
            message.includes('successful') || message.includes('confirmed') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preferred Username</label>
              <Input
                type="text"
                value={preferredUsername}
                onChange={(e) => setPreferredUsername(e.target.value)}
                placeholder="Enter preferred username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-blue-600 hover:underline text-sm"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}

        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preferred Username</label>
              <Input
                type="text"
                value={preferredUsername}
                onChange={(e) => setPreferredUsername(e.target.value)}
                placeholder="Enter preferred username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-blue-600 hover:underline text-sm"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>
        )}

        {mode === 'confirm' && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preferred Username</label>
              <Input
                type="text"
                value={preferredUsername}
                onChange={(e) => setPreferredUsername(e.target.value)}
                placeholder="Enter preferred username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirmation Code</label>
              <Input
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="Enter confirmation code from email"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Confirming...' : 'Confirm Account'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-blue-600 hover:underline text-sm"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
