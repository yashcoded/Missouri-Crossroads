import { cognitoClient, cognitoConfig } from '../config/aws';
import { 
  GlobalSignOutCommand,
  GetUserCommand,
  UpdateUserAttributesCommand
} from '@aws-sdk/client-cognito-identity-provider';

export interface UserProfile {
  sub: string;
  email: string;
  username: string;
  email_verified: boolean;
  custom_attributes?: { [key: string]: string };
}

export interface AuthTokens {
  AccessToken?: string;
  IdToken?: string;
  RefreshToken?: string;
  ExpiresIn?: number;
  TokenType?: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  session?: any;
}

const TOKEN_STORAGE_KEY = 'cognito_tokens';

function getStoredTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

function storeTokens(tokens: AuthTokens | null) {
  try {
    if (tokens) localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {}
}

export async function registerUser(
  preferredUsername: string,
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredUsername, email, password, name }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Registration failed' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error)?.message || 'Registration failed' };
  }
}

export async function confirmRegistration(username: string, confirmationCode: string): Promise<AuthResult> {
  try {
    const res = await fetch('/api/auth/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code: confirmationCode }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Confirmation failed' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error)?.message || 'Confirmation failed' };
  }
}

export async function signInUser(username: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Sign in failed' };
    }

    storeTokens({
      AccessToken: data.auth?.AccessToken,
      IdToken: data.auth?.IdToken,
      RefreshToken: data.auth?.RefreshToken,
      ExpiresIn: data.auth?.ExpiresIn,
      TokenType: data.auth?.TokenType,
    });

    const userResult = await getUserDetails();
    return { success: true, user: userResult.user, session: data.auth };
  } catch (error) {
    return { success: false, error: (error as Error)?.message || 'Sign in failed' };
  }
}

export async function signOutUser(): Promise<AuthResult> {
  try {
    const tokens = getStoredTokens();
    if (tokens?.AccessToken) {
      const command = new GlobalSignOutCommand({ AccessToken: tokens.AccessToken });
      await cognitoClient.send(command);
    }
    storeTokens(null);
    return { success: true };
  } catch (error) {
    storeTokens(null);
    return { success: true };
  }
}

export function getCurrentUser(): UserProfile | null {
  return null;
}

export async function getUserDetails(): Promise<AuthResult> {
  try {
    const tokens = getStoredTokens();
    if (!tokens?.AccessToken) return { success: false, error: 'No active session' };

    const command = new GetUserCommand({ AccessToken: tokens.AccessToken });
    const result = await cognitoClient.send(command);

    const user: UserProfile = {
      sub: result.UserAttributes?.find(a => a.Name === 'sub')?.Value || '',
      email: result.UserAttributes?.find(a => a.Name === 'email')?.Value || '',
      username: result.UserAttributes?.find(a => a.Name === 'preferred_username')?.Value || '',
      email_verified: result.UserAttributes?.find(a => a.Name === 'email_verified')?.Value === 'true',
      custom_attributes: {},
    };

    result.UserAttributes?.forEach(attr => {
      if (attr.Name?.startsWith('custom:')) {
        const key = attr.Name.replace('custom:', '');
        user.custom_attributes![key] = attr.Value || '';
      }
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: (error as Error)?.message || 'Failed to get user details' };
  }
}

export async function updateUserAttributes(attributes: { [key: string]: string }): Promise<AuthResult> {
  try {
    const tokens = getStoredTokens();
    if (!tokens?.AccessToken) return { success: false, error: 'No active session' };

    const userAttributes = Object.entries(attributes).map(([key, value]) => ({
      Name: key.startsWith('custom:') ? key : `custom:${key}`,
      Value: value
    }));

    const command = new UpdateUserAttributesCommand({
      AccessToken: tokens.AccessToken,
      UserAttributes: userAttributes,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error)?.message || 'Update failed' };
  }
}

export function isAuthenticated(): boolean {
  try {
    const tokens = getStoredTokens();
    return !!tokens?.AccessToken;
  } catch {
    return false;
  }
} 