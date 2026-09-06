import type { ReadingRun, YearlyGoal } from "@/lib/reading/types";

export function calculateGoalProgress(runs: ReadingRun[], goal: YearlyGoal | null): number {
  if (!goal) return 0;
  return runs.filter((run) =>
    run.status === "completed"
    && run.finishedOn?.startsWith(`${goal.year}-`)
    && (goal.includeRereads || !run.isReread)
  ).length;
}
