import type { DetectionResult, GenerateFlag, ProfileResult, VerifyReport } from '../types.js';

export function summarize(
  profiles: ProfileResult[],
  detection: DetectionResult | undefined,
  flags: GenerateFlag[],
): VerifyReport['summary'] {
  const liteActions = profiles.flatMap((p) => p.lite.actions);
  const fullActions = profiles.flatMap((p) => p.full.actions);
  const liteSmallerOnEveryRoute = profiles.every((p) =>
    Object.keys(p.full.pages).every(
      (route) => (p.lite.pages[route]?.bytes ?? Infinity) < (p.full.pages[route]?.bytes ?? 0),
    ),
  );
  const liteActionsPassed = liteActions.filter((a) => a.passed).length;
  const detectionTriggered = detection ? detection.redirected : null;
  const hasErrors = flags.some((f) => f.severity === 'error');
  return {
    liteActionsPassed,
    liteActionsTotal: liteActions.length,
    fullActionsPassed: fullActions.filter((a) => a.passed).length,
    fullActionsTotal: fullActions.length,
    liteSmallerOnEveryRoute,
    detectionTriggered,
    ok:
      liteActionsPassed === liteActions.length &&
      liteSmallerOnEveryRoute &&
      detectionTriggered !== false &&
      !hasErrors,
  };
}
