import { redirect } from 'next/navigation';
import { requireUserId } from '@/lib/auth/require-user';
import { createServerClient } from '@/lib/supabase/server';
import { getTodayWorkouts } from '@/lib/plans/today-workouts';
import { getLatestRecovery } from '@/lib/whoop/recovery';
import { getRecoveryStatus } from '@/services/recovery';
import {
  toWorkoutCardData,
  formatPhaseLabel,
  type RawWorkoutRow,
} from '@/lib/workouts/workout-view';
import type { TrainingPhase } from '@/services/plan-engine';
import { getRestDayMessage } from '@/lib/copy/rest-day-messages';
import { SceneBackdrop } from '@/components/layout/scene-backdrop';
import { TabBar } from '@/components/layout/tab-bar';
import { GlassCard } from '@/components/ui/glass-card';
import { WorkoutCard } from '@/components/workout/workout-card';
import { RecoveryBadge } from '@/components/workout/recovery-badge';
import { Button } from '@/components/ui/button';

// Home ("Today") — the daily "what do I do today" screen. Server Component:
// fetches today's workout(s) + recovery directly (no self-fetching our own
// API routes over HTTP), then hands the scene-dependent header/greeting off
// to the one Client Component boundary that actually needs the browser's
// clock (see components/layout/scene-backdrop.tsx for why).
//
// Known simplifications for this first pass (flagged, not silently done):
// - No week-at-a-glance strip yet — it needs GET /api/plans/current (shared
//   with the Plan screen, per its handoff README) plus services/
//   activity-matcher for done/not-done state, which is still an empty stub.
//   Revisit once Plan screen work starts.
// - "Start workout" is a static, non-functional button — there's no session
//   -tracking feature/endpoint built yet. The ".zwo" button isn't wired
//   either: POST /api/zwift/generate expects a full structured ZWO segment
//   list, not just a workout id — mapping a workout's power/duration into
//   ZWO segments is real, separate work this pass didn't include.
// - No sign-out control on this screen (the old placeholder Home had one) —
//   per the design, that belongs on Profile, which isn't built yet.
export default async function Home() {
  const userId = await requireUserId();
  if (!userId) {
    redirect('/login');
  }

  const db = createServerClient();
  const { weekNumber, workouts } = await getTodayWorkouts(db, userId);

  // Whoop not connected (or any other Whoop failure) degrades to "no
  // recovery card" rather than a hard error for this page specifically —
  // the API route itself still surfaces the real error to API consumers.
  const recovery = await getLatestRecovery().catch(() => null);
  const recoveryScore = recovery?.score ?? null;

  const workoutCards = workouts.map((row) => {
    const data = toWorkoutCardData(row as unknown as RawWorkoutRow);
    const phase = (row as { phase?: TrainingPhase }).phase;
    return { ...data, meta: phase ? `TODAY · ${formatPhaseLabel(phase)}` : 'TODAY' };
  });

  return (
    <>
      <SceneBackdrop weekNumber={weekNumber}>
        {recoveryScore ? (
          <GlassCard opacity={46} className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-wider text-(--glass-foreground)/75">
                RECOVERY · WHOOP
              </span>
              <RecoveryBadge status={getRecoveryStatus(recoveryScore.recovery_score)} />
            </div>
            <div className="flex items-baseline gap-6 font-mono">
              <span className="text-[40px] font-medium">
                {Math.round(recoveryScore.recovery_score)}
                <span className="text-[18px] text-(--glass-foreground)/60">%</span>
              </span>
              <div className="flex gap-5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px]">
                    {Math.round(recoveryScore.hrv_rmssd_milli)}
                    <span className="text-[11px] text-(--glass-foreground)/60">ms</span>
                  </span>
                  <span className="text-[10px] text-(--glass-foreground)/60">HRV</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px]">
                    {Math.round(recoveryScore.resting_heart_rate)}
                  </span>
                  <span className="text-[10px] text-(--glass-foreground)/60">RHR</span>
                </div>
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard opacity={46} className="flex flex-col gap-2.5">
            <span className="font-mono text-[11px] tracking-wider text-(--glass-foreground)/75">
              RECOVERY · WHOOP
            </span>
            <p className="text-sm text-(--glass-foreground)/80">
              Connect WHOOP to see your recovery and get session recommendations.
            </p>
            <Button asChild size="sm" className="w-fit">
              <a href="/api/whoop/connect">Connect WHOOP</a>
            </Button>
          </GlassCard>
        )}

        {workoutCards.length > 0 ? (
          workoutCards.map((card, i) => (
            <WorkoutCard
              key={`${card.sport}-${i}`}
              sport={card.sport}
              title={card.title}
              meta={card.meta}
              stats={card.stats}
              description={card.description}
              cutCorner={i === 0}
              actions={<Button className="flex-1">Start workout</Button>}
            />
          ))
        ) : (
          <GlassCard opacity={46} className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] tracking-wider text-(--glass-foreground)/75">
              TODAY
            </span>
            <p className="text-base">{getRestDayMessage()}</p>
          </GlassCard>
        )}
      </SceneBackdrop>
      <TabBar />
    </>
  );
}
