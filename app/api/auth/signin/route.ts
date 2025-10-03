import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
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
		const { username, password } = await req.json();
		if (!username || !password) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		const client = new CognitoIdentityProviderClient({ region });
		const command = new InitiateAuthCommand({
			AuthFlow: 'USER_PASSWORD_AUTH',
			ClientId: UserPoolClientId,
			AuthParameters: {
				USERNAME: username,
				PASSWORD: password,
				SECRET_HASH: generateSecretHash(username),
			},
		});

		const result = await client.send(command);
		return NextResponse.json({ success: true, auth: result.AuthenticationResult });
	} catch (err: any) {
		return NextResponse.json({ success: false, error: err?.message || 'Sign in failed' }, { status: 400 });
	}
}
