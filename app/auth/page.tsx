'use client';

import React from 'react';
import AuthForm from '../components/AuthForm';

export default function AuthPage() {
	return (
		<div className="container mx-auto py-8 px-4 max-w-3xl">
			<h1 className="text-3xl font-bold text-center mb-8">Sign in or Create an Account</h1>
			<AuthForm />
		</div>
	);
}
