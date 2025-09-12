import config from '../config.ts'
import { getHeaders } from './get-headers.ts'

export async function loadHouseholds(getToken: any) {
  const token = await getToken()
  const response = await fetch(`${config.apiBaseUrl}/api/households`, {
    method: 'GET',
    headers: getHeaders(token),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch households')
  }

  return response.json()
}
