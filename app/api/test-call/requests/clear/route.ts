import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId } = body;
    
    if (!adminId) {
      return NextResponse.json(
        { message: 'Missing adminId parameter' },
        { status: 400 }
      );
    }
    // Get the call requests from memory (for testing purposes)
    const callRequests = (global as any).callRequests || [];
    
    // Remove all requests for this admin
    (global as any).callRequests = callRequests.filter(
      (request: any) => request.adminId !== parseInt(adminId, 10)
    );
    
    return NextResponse.json({
      success: true,
      message: 'All call requests cleared successfully',
    });
  } catch (error: any) {
    console.error('Error clearing call requests:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to clear call requests' },
      { status: 500 }
    );
  }
} 