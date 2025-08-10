// File: app/api/validate/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  // Returns the same validation object as before
  const phoneNumber = {
    number: "+919876543210", // Remember to replace with your number
  };
  return NextResponse.json(phoneNumber);
}
