import { apiRequest } from './client';

export const PROJECT_STATUSES = ['open', 'in_progress', 'completed', 'cancelled'];

export function getProjects() {
  return apiRequest('/projects/');
}

export function getProject(id) {
  return apiRequest(`/projects/${id}`);
}

export function getMyProjects(token) {
  return apiRequest('/users/me/projects', { token });
}

export function createProject(data, token) {
  return apiRequest('/projects/', { method: 'POST', token, body: data });
}

export function updateProjectStatus(id, status, token) {
  return apiRequest(`/projects/${id}/status`, { method: 'PATCH', token, body: { status } });
}
