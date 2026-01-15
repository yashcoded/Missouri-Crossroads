'use client';

import React from 'react';
import AuthForm from '../components/AuthForm';

export default function AuthPage() {
	return (
		<div className="container mx-auto py-4 sm:py-8 px-4 max-w-3xl min-h-[calc(100vh-60px)]">
			<h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 px-2">Sign in or Create an Account</h1>
			<AuthForm />
		</div>
	);
}
