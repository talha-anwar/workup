import { apiRequest, toQuery } from './client';

export function getAdminStats(token) {
  return apiRequest('/admin/stats', { token });
}

export function getAdminUsers(token, params = {}) {
  return apiRequest(`/admin/users${toQuery(params)}`, { token });
}

export function getAdminUserProfile(id, token) {
  return apiRequest(`/admin/users/${id}/profile`, { token });
}

export function getAdminProjects(token, params = {}) {
  return apiRequest(`/admin/projects${toQuery(params)}`, { token });
}

export function getAdminReports(token, params = {}) {
  return apiRequest(`/admin/reports${toQuery(params)}`, { token });
}

export function updateUserStatus(id, status, token) {
  return apiRequest(`/admin/users/${id}/status`, { method: 'PATCH', token, body: { status } });
}

export function updateAdminProjectStatus(id, status, token) {
  return apiRequest(`/admin/projects/${id}/status`, { method: 'PATCH', token, body: { status } });
}

export function updateReportStatus(id, status, token) {
  return apiRequest(`/admin/reports/${id}/status`, { method: 'PATCH', token, body: { status } });
}

export function deleteReview(id, token) {
  return apiRequest(`/admin/reviews/${id}`, { method: 'DELETE', token });
}
