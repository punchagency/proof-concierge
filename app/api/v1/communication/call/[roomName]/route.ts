import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName');

    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    // Construct the backend URL for deletion
    const backendUrl = `${BACKEND_URL.replace(/\/+$/, '')}/api/v1/communication/call/${roomName}`;
    console.log('Forwarding delete request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });
    
    if (!response.ok) {
      console.error('Backend response error:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response body:', text);
      return NextResponse.json(
        { error: `Backend returned ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Return the response with no content
    return new NextResponse(null, { status: response.status });
  } catch (error) {
    console.error('Error proxying call deletion request:', error);
    return NextResponse.json(
      { error: 'Failed to delete call' },
      { status: 500 }
    );
  }
}