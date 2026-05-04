const BASE = process.env.NEXT_PUBLIC_APP_URL!

export const apUrls = {
  actor: (username: string) => `${BASE}/users/${username}`,
  inbox: (username: string) => `${BASE}/users/${username}/inbox`,
  outbox: (username: string) => `${BASE}/users/${username}/outbox`,
  followers: (username: string) => `${BASE}/users/${username}/followers`,
  following: (username: string) => `${BASE}/users/${username}/following`,
  publicKey: (username: string) => `${BASE}/users/${username}#main-key`,
  sighting: (id: string) => `${BASE}/sightings/${id}`,
  activity: (id: string) => `${BASE}/activities/${id}`,
}

export const AP_PUBLIC = "https://www.w3.org/ns/activitystreams#Public"
