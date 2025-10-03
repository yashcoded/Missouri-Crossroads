import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../lib/utils/database_service';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, we'll allow access but this should be protected in production
    
    const stats = await DatabaseService.getAdminStats();
    
    return NextResponse.json({ 
      message: 'Admin stats retrieved successfully',
      stats 
    });

  } catch (error) {
    console.error('Error in GET /api/admin/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
