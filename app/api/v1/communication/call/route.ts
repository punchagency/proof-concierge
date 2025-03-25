import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5005/api/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the request to the backend
    const response = await axios.post(
      `${API_BASE_URL}/communication/call`,
      body
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const errorResponse = error as {
      response?: { data?: unknown; status?: number };
      message?: string;
    };
    console.error(
      "Error creating call:",
      errorResponse.response?.data || errorResponse.message
    );
    return NextResponse.json(
      {
        error: "Failed to create call",
        details: errorResponse.response?.data || errorResponse.message,
      },
      { status: errorResponse.response?.status || 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get("roomName");

    if (!roomName) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    const response = await axios.delete(
      `${API_BASE_URL}/communication/call/${roomName}`
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const errorResponse = error as {
      response?: { data?: unknown; status?: number };
      message?: string;
    };
    console.error(
      "Error deleting room:",
      errorResponse.response?.data || errorResponse.message
    );
    return NextResponse.json(
      {
        error: "Failed to delete room",
        details: errorResponse.response?.data || errorResponse.message,
      },
      { status: errorResponse.response?.status || 500 }
    );
  }
}
