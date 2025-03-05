import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Use the public environment variable
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the backend
    const backendUrl = `${BACKEND_URL.replace(/\/+$/, '')}/api/v1/communication/rooms`;
    console.log('Forwarding request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
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
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying rooms request:', error);
    return NextResponse.json(
      { error: 'Failed to list rooms' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Log the request for debugging
    console.log('Deleting all rooms');
    
    // Forward the request to the backend
    const response = await axios.delete(`${API_BASE_URL}/communication/rooms`);
    
    // Log the response for debugging
    console.log('All rooms deleted successfully:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error deleting rooms:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to delete rooms', details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
} 