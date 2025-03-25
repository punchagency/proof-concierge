import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Only available in dev mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Debug routes only available in development' },
        { status: 403 }
      );
    }
    
    // Extract the ID from the URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    // Access any query parameters if needed
    const { searchParams } = new URL(request.url);
    
    // Get the auth token from cookies
    const token = request.cookies.get('auth_token')?.value;
    
    // Construct and log the request that would be made
    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005/api/v1';
    const url = `${API_BASE_URL}/donor-queries/${id}`;
    
    // Get details about the current query
    let queryDetails = null;
    
    try {
      if (token) {
        const detailsResponse = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (detailsResponse.ok) {
          queryDetails = await detailsResponse.json();
        } else {
          console.error(`[DEBUG] Failed to fetch query details: ${detailsResponse.status}`);
        }
      }
    } catch (error) {
      console.error(`[DEBUG] Error fetching query details:`, error);
    }
    
    // Return debug information
    return NextResponse.json({
      debug: {
        timestamp: new Date().toISOString(),
        queryId: id,
        apiUrl: url,
        searchParams: Object.fromEntries(searchParams.entries()),
        tokenPresent: !!token,
        environment: process.env.NODE_ENV,
      },
      queryDetails
    });
  } catch (error) {
    console.error('[DEBUG] Error in debug route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 