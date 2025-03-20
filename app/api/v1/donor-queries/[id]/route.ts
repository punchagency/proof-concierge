import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://proof-concierge-fcbe8069aebb.herokuapp.com/api/v1';

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Log the request for debugging
    console.log(`Updating query ${id} with data:`, body);
    
    // Forward the request to the backend
    const response = await axios.patch(`${API_BASE_URL}/donor-queries/${id}`, body);
    
    // Log the response for debugging
    console.log('Query updated successfully:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const errorResponse = error as { response?: { data?: unknown, status?: number }, message?: string };
    console.error('Error updating query:', errorResponse.response?.data || errorResponse.message);
    return NextResponse.json(
      { error: 'Failed to update query', details: errorResponse.response?.data || errorResponse.message },
      { status: errorResponse.response?.status || 500 }
    );
  }
}