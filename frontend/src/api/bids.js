import { apiRequest } from './client';

export const BID_STATUSES = ['pending', 'accepted', 'rejected'];

export function getProjectBids(projectId, token) {
  return apiRequest(`/projects/${projectId}/bids`, { token });
}

export function getMyBids(token) {
  return apiRequest('/users/me/bids', { token });
}

export function submitBid(projectId, data, token) {
  return apiRequest(`/projects/${projectId}/bids`, { method: 'POST', token, body: data });
}

export function updateBidStatus(bidId, status, token) {
  return apiRequest(`/bids/${bidId}/status`, { method: 'PATCH', token, body: { status } });
}
