import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { setLastCallData } from '../last-call/route';

// Use the public environment variable
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the request for debugging
    console.log('Creating call with data:', body);
    
    // Forward the request to the backend
    const response = await axios.post(`${API_BASE_URL}/communication/call`, body);
    
    // Log the response for debugging
    console.log('Call created successfully:', response.data);
    
    // Store the call data for the test page
    setLastCallData(response.data.data);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error creating call:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to create call', details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { roomName: string } }) {
  try {
    const roomName = params.roomName;
    
    // Log the request for debugging
    console.log('Deleting room:', roomName);
    
    // Forward the request to the backend
    const response = await axios.delete(`${API_BASE_URL}/communication/call/${roomName}`);
    
    // Log the response for debugging
    console.log('Room deleted successfully:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error deleting room:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to delete room', details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
} 