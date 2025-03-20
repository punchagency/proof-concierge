import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://proof-concierge-fcbe8069aebb.herokuapp.com/api/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the request for debugging
    console.log('Creating call with data:', body);
    
    // Forward the request to the backend
    const response = await axios.post(`${API_BASE_URL}/communication/call`, body);
    
    // Log the response for debugging
    console.log('Call created successfully:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const errorResponse = error as { response?: { data?: unknown, status?: number }, message?: string };
    console.error('Error creating call:', errorResponse.response?.data || errorResponse.message);
    return NextResponse.json(
      { error: 'Failed to create call', details: errorResponse.response?.data || errorResponse.message },
      { status: errorResponse.response?.status || 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName');
    
    if (!roomName) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    console.log('Deleting room:', roomName);
    const response = await axios.delete(`${API_BASE_URL}/communication/call/${roomName}`);

    console.log('Room deleted successfully:', response.data);
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const errorResponse = error as { response?: { data?: unknown, status?: number }, message?: string };
    console.error('Error deleting room:', errorResponse.response?.data || errorResponse.message);
    return NextResponse.json(
      { error: 'Failed to delete room', details: errorResponse.response?.data || errorResponse.message },
      { status: errorResponse.response?.status || 500 }
    );
  }
}