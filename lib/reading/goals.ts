import type { ReadingRun, YearlyGoal } from "@/lib/reading/types";

export function selectGoalRuns(
  runs: ReadingRun[],
  goal: YearlyGoal | null,
): ReadingRun[] {
  if (!goal) return [];
  return runs
    .filter(
      (run) =>
        run.status === "completed" &&
        run.finishedOn?.startsWith(`${goal.year}-`) &&
        (goal.includeRereads || !run.isReread),
    )
    .sort((left, right) =>
      (right.finishedOn ?? "").localeCompare(left.finishedOn ?? ""),
    );
}

export function calculateGoalProgress(runs: ReadingRun[], goal: YearlyGoal | null): number {
  return selectGoalRuns(runs, goal).length;
}
