import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../lib/utils/database_service';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, we'll allow access but this should be protected in production
    
    const { action, notes, noteIds } = await request.json();
    
    if (action === 'bulk-update' && notes) {
      const result = await DatabaseService.bulkUpdateNotes(notes);
      
      return NextResponse.json({ 
        message: 'Bulk update completed',
        result 
      });
    }
    
    if (action === 'bulk-delete' && noteIds) {
      const result = await DatabaseService.bulkDeleteNotes(noteIds);
      
      return NextResponse.json({ 
        message: 'Bulk delete completed',
        result 
      });
    }
    
    return NextResponse.json({ 
      error: 'Invalid action or missing data' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/admin/bulk-notes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
