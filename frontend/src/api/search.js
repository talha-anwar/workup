import { apiRequest, toQuery } from './client';
export function searchProjects(params = {}) { return apiRequest(`/search/projects${toQuery(params)}`); }
export function searchFreelancers(params = {}) { return apiRequest(`/search/freelancers${toQuery(params)}`); }
