import { apiRequest } from './client';

export function getUser(userId) {
  return apiRequest(`/users/${userId}`);
}

export function getUserProfileStats(userId) {
  return apiRequest(`/users/${userId}/stats`);
}

export function updateUser(userId, data, token) {
  return apiRequest(`/users/${userId}`, { method: 'PATCH', token, body: data });
}

export function deleteOwnUser(userId, token) {
  return apiRequest(`/users/${userId}`, { method: 'DELETE', token });
}

export function getFreelancerProfile(userId) {
  return apiRequest(`/users/${userId}/freelancer`);
}

export function updateFreelancerProfile(userId, data, token) {
  return apiRequest(`/users/${userId}/freelancer`, { method: 'PATCH', token, body: data });
}
