import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';

const region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const UserPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID as string;
const ClientSecret = process.env.COGNITO_CLIENT_SECRET as string;

function generateSecretHash(username: string): string {
	if (!ClientSecret) throw new Error('COGNITO_CLIENT_SECRET not set');
	const hmac = crypto.createHmac('SHA256', ClientSecret);
	hmac.update(username + UserPoolClientId);
	return hmac.digest('base64');
}

export async function POST(req: NextRequest) {
	try {
		const { preferredUsername, email, password, name } = await req.json();
		if (!preferredUsername || !email || !password || !name) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		const client = new CognitoIdentityProviderClient({ region });
		const command = new SignUpCommand({
			ClientId: UserPoolClientId,
			Username: preferredUsername,
			Password: password,
			UserAttributes: [
				{ Name: 'email', Value: email },
				{ Name: 'name', Value: name },
				{ Name: 'preferred_username', Value: preferredUsername },
			],
			SecretHash: generateSecretHash(preferredUsername),
		});

		const result = await client.send(command);
		return NextResponse.json({ success: true, userSub: result.UserSub });
	} catch (err: any) {
		return NextResponse.json({ success: false, error: err?.message || 'Signup failed' }, { status: 400 });
	}
}
