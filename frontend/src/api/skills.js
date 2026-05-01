import { apiRequest } from './client';

export function getSkills() {
  return apiRequest('/skills/');
}
