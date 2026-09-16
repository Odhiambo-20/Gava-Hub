import { pool, stores, newId, now } from '../database/index.js';

const validate = (input) => {
  if (!input.userId) throw new Error('userId is required');
  if (!input.givenName || !input.familyName) throw new Error('givenName and familyName are required');
  return { ...input, givenName: String(input.givenName).trim(), familyName: String(input.familyName).trim(), profileStatus: input.profileStatus || 'DRAFT' };
};

const columns = `id, user_id as "userId", given_name as "givenName", family_name as "familyName", date_of_birth as "dateOfBirth", headline, profile_status as "profileStatus", created_at as "createdAt"`;

export async function listCandidates(userId) {
  if (pool) { const result = await pool.query(`select ${columns} from gavahub.candidate_profile ${userId ? 'where user_id=$1' : ''} order by created_at desc`, userId ? [userId] : []); return result.rows; }
  return stores.candidates.filter((candidate) => !userId || candidate.userId === userId);
}
export async function getCandidate(id) {
  if (pool) { const result = await pool.query(`select ${columns} from gavahub.candidate_profile where id=$1`, [id]); return result.rows[0] || null; }
  return stores.candidates.find((candidate) => candidate.id === id) || null;
}
export async function createCandidate(input) {
  const value = validate(input); const candidate = { id: newId(), ...value, createdAt: now(), updatedAt: now() };
  if (pool) await pool.query(`insert into gavahub.candidate_profile (id,user_id,given_name,family_name,date_of_birth,headline,profile_status) values ($1,$2,$3,$4,$5,$6,$7)`, [candidate.id,candidate.userId,candidate.givenName,candidate.familyName,candidate.dateOfBirth || null,candidate.headline || null,candidate.profileStatus]);
  else stores.candidates.push(candidate);
  return candidate;
}
export async function updateCandidate(id, input) {
  const current = await getCandidate(id); if (!current) return null;
  const value = validate({ ...current, ...input });
  if (pool) { const result = await pool.query(`update gavahub.candidate_profile set given_name=$1,family_name=$2,date_of_birth=$3,headline=$4,profile_status=$5 where id=$6 returning ${columns}`, [value.givenName,value.familyName,value.dateOfBirth || null,value.headline || null,value.profileStatus,id]); return result.rows[0]; }
  Object.assign(current, value, { updatedAt: now() }); return current;
}
export async function archiveCandidate(id) {
  const candidate = await getCandidate(id); if (!candidate) return false;
  if (pool) await pool.query(`update gavahub.candidate_profile set profile_status='ARCHIVED' where id=$1`, [id]); else Object.assign(candidate, { profileStatus: 'ARCHIVED', updatedAt: now() });
  return true;
}
