import { apiRequest } from './client';

export function getContract(contractId, token) {
  return apiRequest(`/contracts/${contractId}`, { token });
}

export function getMyContracts(token) {
  return apiRequest('/users/me/contracts', { token });
}

export function submitContractWork(contractId, data, token) {
  return apiRequest(`/contracts/${contractId}/submit`, {
    method: 'PATCH',
    token,
    body: data,
  });
}

export function completeContractWork(contractId, token) {
  return apiRequest(`/contracts/${contractId}/complete`, {
    method: 'PATCH',
    token,
  });
}
