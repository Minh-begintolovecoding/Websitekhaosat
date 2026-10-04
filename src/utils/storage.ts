export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = '; expires=' + date.toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
}

export const STORAGE_KEYS = {
  PARTICIPANT_UUID: 'imt_participant_uuid',
  ASSIGNED_GROUP: 'imt_assigned_group',
  SUBMITTED: 'imt_has_submitted',
  TIMINGS: 'imt_timing_metrics',
  SURVEY_DRAFT: 'imt_survey_draft',
  AUTH_TOKEN: 'imt_admin_token',
};

export function getStoredParticipantUuid(): string | null {
  if (typeof window === 'undefined') return null;
  // Try cookie first, then localStorage
  const cookieVal = getCookie(STORAGE_KEYS.PARTICIPANT_UUID);
  if (cookieVal) return cookieVal;

  return localStorage.getItem(STORAGE_KEYS.PARTICIPANT_UUID);
}

export function storeParticipantUuid(uuid: string) {
  if (typeof window === 'undefined') return;
  setCookie(STORAGE_KEYS.PARTICIPANT_UUID, uuid);
  localStorage.setItem(STORAGE_KEYS.PARTICIPANT_UUID, uuid);
}
