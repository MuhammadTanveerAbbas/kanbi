import { NextRequest, NextResponse } from 'next/server';
import type { z } from 'zod';
import { AppError, ValidationError } from '@/lib/errors/AppError';

/**
 * One controlled error shape for every failure path in the notes routes.
 * Keeping it here means the three routes cannot drift apart.
 */
export function fail(error: AppError) {
  return NextResponse.json(
    {
      ok: false,
      error: { message: error.message, code: error.code },
      code: error.code,
      statusCode: error.statusCode,
      errorId: error.errorId,
    },
    { status: error.statusCode }
  );
}

export function invalid(message: string) {
  return fail(new ValidationError(message));
}

export function payloadTooLarge(message: string) {
  return fail(new AppError(message, 413, 'PAYLOAD_TOO_LARGE'));
}

export function notFound(message: string) {
  return fail(new AppError(message, 404, 'NOT_FOUND'));
}

export function parseError(error: z.ZodError): string {
  return error.errors[0]?.message ?? 'Invalid input';
}

export async function readJson(request: NextRequest): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
