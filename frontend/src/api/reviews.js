import { apiRequest } from './client';
export function getUserReviews(userId) { return apiRequest(`/users/${userId}/reviews`); }
export function createReview(contractId, data, token) { return apiRequest(`/contracts/${contractId}/reviews`, { method: 'POST', token, body: data }); }
