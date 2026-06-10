import type { WorkoutBlock, ZwoWorkout } from '@/lib/schemas/zwift';

// Serialises a single workout block to its .zwo XML element.
// Power values are passed through as-is — they are FTP fractions set by the caller.
function serializeBlock(block: WorkoutBlock): string {
  switch (block.type) {
    case 'Warmup':
      return `    <Warmup Duration="${block.duration}" PowerLow="${block.powerLow}" PowerHigh="${block.powerHigh}"/>`;
    case 'Cooldown':
      return `    <Cooldown Duration="${block.duration}" PowerLow="${block.powerLow}" PowerHigh="${block.powerHigh}"/>`;
    case 'SteadyState':
      return `    <SteadyState Duration="${block.duration}" Power="${block.power}"/>`;
    case 'IntervalsT':
      return `    <IntervalsT Repeat="${block.repeat}" OnDuration="${block.onDuration}" OffDuration="${block.offDuration}" OnPower="${block.onPower}" OffPower="${block.offPower}"/>`;
    case 'FreeRide':
      return `    <FreeRide Duration="${block.duration}" FlatRoad="1"/>`;
  }
}

// Generates a valid Zwift .zwo XML string from a workout definition.
// Drop the output into ~/Documents/Zwift/Workouts/<user_id>/ and
// the workout appears in Zwift's custom workout list.
export function generateZwo(workout: ZwoWorkout): string {
  const blocks = workout.blocks.map(serializeBlock).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<workout_file>
  <author>Triathlon Training App</author>
  <name>${workout.name}</name>
  <description>${workout.description ?? ''}</description>
  <sportType>bike</sportType>
  <tags/>
  <workout>
${blocks}
  </workout>
</workout_file>`;
}
