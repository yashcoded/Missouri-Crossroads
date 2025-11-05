import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../lib/utils/database_service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const creator = searchParams.get('creator');
    const search = searchParams.get('search');
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius = searchParams.get('radius');

    if (id) {
      const note = await DatabaseService.getNoteById(id);
      if (!note) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }
      return NextResponse.json({ note });
    }

    if (creator) {
      const notes = await DatabaseService.getNotesByUser(creator);
      return NextResponse.json({ notes });
    }

    if (search) {
      const notes = await DatabaseService.searchNotes(search);
      return NextResponse.json({ notes });
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = radius ? parseFloat(radius) : 10;
      
      const notes = await DatabaseService.getNotesByLocation(lat, lng, radiusKm);
      return NextResponse.json({ notes });
    }

    const notes = await DatabaseService.getAllNotes();
    return NextResponse.json({ notes });

  } catch (error) {
    console.error('Error in GET /api/database/notes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const noteData = await request.json();
    
    // Remove id, createdAt, and updatedAt from request data if present (they'll be generated)
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...cleanNoteData } = noteData;
    
    const note = await DatabaseService.createNote(cleanNoteData);
    
    return NextResponse.json({ 
      message: 'Note created successfully',
      note 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/database/notes:', error);
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
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Don't allow updating createdAt
    const { createdAt: _createdAt, ...cleanUpdates } = updates;

    const note = await DatabaseService.updateNote(id, cleanUpdates);
    
    return NextResponse.json({ 
      message: 'Note updated successfully',
      note 
    });

  } catch (error) {
    console.error('Error in PUT /api/database/notes:', error);
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
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    await DatabaseService.deleteNote(id);
    
    return NextResponse.json({ 
      message: 'Note deleted successfully' 
    });

  } catch (error) {
    console.error('Error in DELETE /api/database/notes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
