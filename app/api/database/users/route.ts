import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../lib/utils/database_service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (id) {
      const user = await DatabaseService.getUserById(id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user });
    }

    if (email) {
      const user = await DatabaseService.getUserByEmail(email);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user });
    }

    const users = await DatabaseService.getAllUsers();
    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error in GET /api/database/users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // Remove id and createdAt from request data if present (they'll be generated)
    const { id, createdAt, ...cleanUserData } = userData;
    
    const user = await DatabaseService.createUser(cleanUserData);
    
    return NextResponse.json({ 
      message: 'User created successfully',
      user 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/database/users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await DatabaseService.updateUser(id, updates);
    
    return NextResponse.json({ 
      message: 'User updated successfully',
      user 
    });

  } catch (error) {
    console.error('Error in PUT /api/database/users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await DatabaseService.deleteUser(id);
    
    return NextResponse.json({ 
      message: 'User deleted successfully' 
    });

  } catch (error) {
    console.error('Error in DELETE /api/database/users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
