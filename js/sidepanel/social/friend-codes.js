import { readSocial, patchSocial, socialUid, sessionVersion, assertSession } from './api.js';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;

export function parseFriendCode(value) {
  const code = String(value || '').trim().replace(/^CC-/i, '').replace(/[\s-]/g, '').toUpperCase();
  if (!CODE_PATTERN.test(code)) throw new Error('Enter an eight-character friend code, such as CC-ABCD2345.');
  return code;
}
async function candidate(uid, attempt) {
  const data = new TextEncoder().encode(`cconnect-friend-code:${uid}:${attempt}`);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  return Array.from(hash.slice(0, 8), byte => ALPHABET[byte & 31]).join('');
}
export async function ensureFriendCode(nickname) {
  const version = sessionVersion();
  const uid = socialUid();
  const existing = await readSocial(`profiles/${uid}`);
  assertSession(version);
  if (CODE_PATTERN.test(existing?.friendCode || '')) {
    const owner = await readSocial(`codes/${existing.friendCode}`);
    assertSession(version);
    if (owner !== uid) throw new Error('Your friend code could not be verified. Please try again later.');
    await patchSocial({ [`profiles/${uid}/nickname`]: nickname });
    return existing.friendCode;
  }
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = await candidate(uid, attempt);
    assertSession(version);
    const owner = await readSocial(`codes/${code}`);
    assertSession(version);
    if (owner && owner !== uid) continue;
    try {
      // The rules reserve the code and set the profile together; an existing
      // code cannot be reassigned, including when two users claim it at once.
      await patchSocial({ [`codes/${code}`]: uid, [`profiles/${uid}`]: { nickname, friendCode: code } });
      return code;
    } catch (error) {
      assertSession(version);
      // Retry only actual collisions; setup/permission failures remain visible.
      const newOwner = await readSocial(`codes/${code}`);
      assertSession(version);
      if (!newOwner || newOwner === uid) throw error;
    }
  }
  throw new Error('Could not create your friend code. Please try again later.');
}
export async function resolveFriendCode(value) {
  const uid = await readSocial(`codes/${parseFriendCode(value)}`);
  if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{6,128}$/.test(uid)) {
    throw new Error('User not found. Check their friend code.');
  }
  return uid;
}
