import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryId = searchParams.get('queryId');
    const adminId = searchParams.get('adminId');
    
    if (!queryId && !adminId) {
      return NextResponse.json(
        { message: 'Missing queryId or adminId parameter' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would fetch from the backend API
    // For testing, we'll return the in-memory call requests
    // Get the call requests from memory (for testing purposes)
    const callRequests = (globalThis as any).callRequests || [];
    
    // Filter by queryId or adminId
    const filteredRequests = callRequests.filter((request: any) => {
      if (queryId) {
        return request.queryId === parseInt(queryId);
      }
      if (adminId) {
        return request.adminId === parseInt(adminId);
      }
      return false;
    });
    
    return NextResponse.json({
      success: true,
      requests: filteredRequests,
    });
  } catch (error: any) {
    console.error('Error fetching call requests:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch call requests' },
      { status: 500 }
    );
  }
} 