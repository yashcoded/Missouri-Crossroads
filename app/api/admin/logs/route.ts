import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../lib/utils/database_service';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, we'll allow access but this should be protected in production
    
    const logs = await DatabaseService.getAllAdminLogs();
    
    return NextResponse.json({ 
      message: 'Admin logs retrieved successfully',
      logs 
    });

  } catch (error) {
    console.error('Error in GET /api/admin/logs:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();
    
    // Remove id and timestamp from request data if present (they'll be generated)
    const { id, timestamp, ...cleanLogData } = logData;
    
    const log = await DatabaseService.createAdminLog(cleanLogData);
    
    return NextResponse.json({ 
      message: 'Admin log created successfully',
      log 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/logs:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
