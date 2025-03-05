import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queryId, adminId, mode, message } = body;
    
    // Validate required fields
    if (!queryId || !adminId || !mode) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('Creating call request:', { queryId, adminId, mode, message });
    
    // In a real implementation, this would call the backend API
    // For testing, we'll simulate a successful response
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a mock call request
    const callRequest = {
      id: Math.floor(Math.random() * 1000),
      queryId,
      adminId,
      mode,
      message,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      admin: {
        name: 'Test Admin',
      },
    };
    // Store the call request in memory (for testing purposes)
    (global as any).callRequests = (global as any).callRequests || [];
    (global as any).callRequests.push(callRequest);
    return NextResponse.json({
      success: true,
      message: `${mode} call request sent successfully`,
      data: callRequest,
    });
  } catch (error: any) {
    console.error('Error creating call request:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create call request' },
      { status: 500 }
    );
  }
} 