import config from '../config.ts'

export async function loadHouseholds(getToken: any) {
  const token = await getToken()
  const response = await fetch(`${config.apiBaseUrl}/api/households`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch households')
  }

  return response.json()
}
