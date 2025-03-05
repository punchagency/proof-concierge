import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, queryId } = body;
    
    if (!requestId || !queryId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('Accepting call request:', { requestId, queryId });
    const callRequests: any[] = ((globalThis as any).callRequests) || [];
    
    const callRequestIndex = callRequests.findIndex(
      (request: any) => request.id === requestId && request.queryId === parseInt(queryId)
    );
    
    if (callRequestIndex === -1) {
      return NextResponse.json(
        { message: 'Call request not found' },
        { status: 404 }
      );
    }
    
    // Update the call request status
    callRequests[callRequestIndex].status = 'ACCEPTED';
    
    // Call the backend API to create a room and tokens
    try {
      const backendResponse = await fetch('http://localhost:5005/api/v1/communication/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // This would be the user ID in a real implementation
          mode: callRequests[callRequestIndex].mode.toLowerCase(), // Convert to lowercase for backend API
          expiryMinutes: 60,
          customRoomName: `test-room-${Date.now()}`,
        }),
      });
      
      if (!backendResponse.ok) {
        throw new Error(`Backend API returned ${backendResponse.status}: ${await backendResponse.text()}`);
      }
      
      const backendData = await backendResponse.json();
      console.log('Backend API response:', backendData);
      
      if (!backendData.data || !backendData.data.user) {
        throw new Error('Invalid response from backend API');
      }
      
      // Get the room URLs and tokens from the backend response
      const userRoomUrl = backendData.data.user.roomUrl;
      const userRoomToken = backendData.data.user.roomToken;
      const adminRoomUrl = backendData.data.admin.roomUrl;
      const adminRoomToken = backendData.data.admin.roomToken;
      
      // Store the admin room info in the call request
      callRequests[callRequestIndex].adminRoomInfo = {
        roomUrl: adminRoomUrl,
        roomToken: adminRoomToken,
      };
      
      // Create a redirect URL to the video call page
      const videoCallUrl = `/test-call/video?url=${encodeURIComponent(userRoomUrl)}&token=${encodeURIComponent(userRoomToken)}`;
      
      console.log('Generated video call data:', {
        userRoomUrl,
        userRoomToken: userRoomToken.substring(0, 20) + '...',
        adminRoomUrl,
        adminRoomToken: adminRoomToken.substring(0, 20) + '...',
        videoCallUrl
      });
      
      return NextResponse.json({
        success: true,
        message: 'Call request accepted successfully',
        roomUrl: videoCallUrl,
        directRoomUrl: userRoomUrl,
        roomToken: userRoomToken,
        callRequest: callRequests[callRequestIndex],
      });
    } catch (backendError) {
      console.error('Error calling backend API:', backendError);
      
      // Fallback to mock data if backend API call fails
      console.warn('Using fallback mock data for room and token');
      
      // Create a mock room URL and token
      const roomName = `test-room-${Math.floor(Math.random() * 1000)}`;
      const roomUrl = `https://prooftest.daily.co/${roomName}`;
      const roomToken = `mock-token-for-${roomName}-${Date.now()}`;
      
      // Create a redirect URL to the video call page
      const videoCallUrl = `/test-call/video?url=${encodeURIComponent(roomUrl)}&token=${encodeURIComponent(roomToken)}`;
      
      console.log('Generated fallback video call data:', {
        roomName,
        roomUrl,
        roomToken: roomToken.substring(0, 20) + '...',
        videoCallUrl
      });
      
      return NextResponse.json({
        success: true,
        message: 'Call request accepted successfully (using fallback)',
        roomUrl: videoCallUrl,
        directRoomUrl: roomUrl,
        roomToken,
        callRequest: callRequests[callRequestIndex],
        fallback: true,
        error: backendError instanceof Error ? backendError.message : String(backendError),
      });
    }
  } catch (error: any) {
    console.error('Error accepting call request:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to accept call request' },
      { status: 500 }
    );
  }
} 