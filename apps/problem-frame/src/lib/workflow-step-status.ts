import type { getFrameForOrg } from "@/actions/frames";

export type FrameModel = NonNullable<Awaited<ReturnType<typeof getFrameForOrg>>>;

export type StepState = "not_started" | "in_progress" | "complete";

export function stepLabel(state: StepState): string {
  switch (state) {
    case "not_started":
      return "Not started";
    case "in_progress":
      return "In progress";
    case "complete":
      return "Complete";
    default:
      return "";
  }
}

function step1(frame: FrameModel): StepState {
  const title = frame.frameTitle?.trim();
  const stmt = frame.problemStatement?.trim();
  if (title && stmt && frame.personaId) return "complete";
  if (title || stmt) return "in_progress";
  return "not_started";
}

function step2(frame: FrameModel): StepState {
  const b = frame.barriers.length;
  const e = frame.emotionalImpacts.length;
  if (b >= 1 && e >= 1) return "complete";
  if (b >= 1 || e >= 1) return "in_progress";
  return "not_started";
}

function step3(frame: FrameModel): StepState {
  if (frame.outcomes.length >= 1) return "complete";
  return "not_started";
}

function step4(frame: FrameModel): StepState {
  const c = frame.constraints.length;
  const a = frame.assumptions.length;
  if (c >= 1 && a >= 1) return "complete";
  if (c >= 1 || a >= 1) return "in_progress";
  return "not_started";
}

function step5(frame: FrameModel): StepState {
  if (frame.hypotheses.length >= 1) return "complete";
  return "not_started";
}

function step6(feedbackCount: number): StepState {
  if (feedbackCount >= 1) return "complete";
  return "not_started";
}

export function stepStates(
  frame: FrameModel,
  feedbackCount: number,
): StepState[] {
  return [
    step1(frame),
    step2(frame),
    step3(frame),
    step4(frame),
    step5(frame),
    step6(feedbackCount),
  ];
}

export function completedStepCount(frame: FrameModel, feedbackCount: number): number {
  return stepStates(frame, feedbackCount).filter((s) => s === "complete").length;
}
