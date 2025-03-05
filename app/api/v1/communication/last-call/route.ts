import { NextResponse } from "next/server";

// Variable to store the last call data
let lastCallData: any = null;

// Export a function to set the last call data (to be used by the call creation endpoint)
export function setLastCallData(data: any) {
  lastCallData = data;
}

export async function GET() {
  try {
    if (!lastCallData) {
      return NextResponse.json(
        { error: "No call data available" },
        { status: 404 }
      );
    }

    return NextResponse.json(lastCallData);
  } catch (error) {
    console.error("Error retrieving last call data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve call data" },
      { status: 500 }
    );
  }
} 