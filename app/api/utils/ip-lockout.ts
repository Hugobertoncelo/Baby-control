interface FailedAttempt {
  count: number;
  lockoutUntil: number | null;
}

const failedAttempts: Record<string, FailedAttempt> = {};

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000;

export function checkIpLockout(ip: string): {
  locked: boolean;
  remainingTime: number;
} {
  const attempt = failedAttempts[ip];
  if (!attempt) {
    return { locked: false, remainingTime: 0 };
  }
  if (attempt.lockoutUntil && attempt.lockoutUntil > Date.now()) {
    return {
      locked: true,
      remainingTime: attempt.lockoutUntil - Date.now(),
    };
  }
  if (attempt.lockoutUntil && attempt.lockoutUntil <= Date.now()) {
    attempt.count = 0;
    attempt.lockoutUntil = null;
    return { locked: false, remainingTime: 0 };
  }
  return { locked: false, remainingTime: 0 };
}

export function recordFailedAttempt(ip: string): {
  locked: boolean;
  remainingTime: number;
} {
  const attempt = failedAttempts[ip] || { count: 0, lockoutUntil: null };
  if (attempt.lockoutUntil && attempt.lockoutUntil > Date.now()) {
    return {
      locked: true,
      remainingTime: attempt.lockoutUntil - Date.now(),
    };
  }
  attempt.count += 1;
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockoutUntil = Date.now() + LOCKOUT_DURATION;
    attempt.count = 0;
  }
  failedAttempts[ip] = attempt;
  return {
    locked: attempt.lockoutUntil !== null && attempt.lockoutUntil > Date.now(),
    remainingTime: attempt.lockoutUntil ? attempt.lockoutUntil - Date.now() : 0,
  };
}

export function resetFailedAttempts(ip: string): void {
  if (failedAttempts[ip]) {
    failedAttempts[ip].count = 0;
    failedAttempts[ip].lockoutUntil = null;
  }
}
