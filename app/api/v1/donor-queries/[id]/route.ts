import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to fix the error
    const id = await params.id;
    const body = await request.json();
    
    // Log the request for debugging
    console.log(`Updating query ${id} with data:`, body);
    
    // Forward the request to the backend
    const response = await axios.patch(`${API_BASE_URL}/donor-queries/${id}`, body);
    
    // Log the response for debugging
    console.log('Query updated successfully:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error updating query:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to update query', details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
} 