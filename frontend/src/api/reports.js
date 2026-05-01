import { apiRequest } from './client';
export const REPORT_REASONS = ['spam', 'fake_review', 'inappropriate_content', 'payment_fraud', 'harassment', 'other'];
export function createReport(data, token) { return apiRequest('/reports/', { method: 'POST', token, body: data }); }
export function getMyReports(token) { return apiRequest('/reports/my', { token }); }
