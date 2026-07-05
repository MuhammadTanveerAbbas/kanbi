import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '3.1.0',
    },
    { status: 200 }
  )
}
