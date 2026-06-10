import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateZwo } from '@/lib/zwift/zwo';
import { ZwoWorkoutSchema } from '@/lib/schemas/zwift';

// Strips characters invalid in filenames across macOS, Windows, and Linux.
function toSafeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

// POST /api/zwift/generate
// Accepts a workout definition as JSON, returns a downloadable .zwo file.
// The user saves the file and drops it into ~/Documents/Zwift/Workouts/<user_id>/
// — it then appears in Zwift's custom workout list.
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const workout = ZwoWorkoutSchema.parse(body);

    const xml = generateZwo(workout);
    const filename = `${toSafeFilename(workout.name) || 'workout'}.zwo`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid workout definition', details: err.issues },
        { status: 400 }
      );
    }
    console.error('[zwift/generate] error:', err);
    return NextResponse.json({ error: 'Failed to generate workout file' }, { status: 500 });
  }
}
