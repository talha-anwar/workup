import { apiRequest, parseJwtUserId } from './client';
import { getUser } from './users';
export async function register(name, email, password, role) { return apiRequest('/auth/register', { method: 'POST', body: { name, email, password, role } }); }
export async function login(email, password) {
  const tokenData = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
  const userId = parseJwtUserId(tokenData.access_token);
  const user = userId ? await getUser(userId) : null;
  return { ...tokenData, user };
}
