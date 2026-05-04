import { signRequest } from "./sign"

export async function deliverActivity(
  activity: Record<string, unknown>,
  inboxUrl: string,
  privateKeyPem: string,
  keyId: string
): Promise<boolean> {
  const body = JSON.stringify(activity)

  try {
    const headers = signRequest("POST", inboxUrl, body, privateKeyPem, keyId)
    const res = await fetch(inboxUrl, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/activity+json" },
      body,
    })
    return res.ok
  } catch (err) {
    console.error(`[AP] Delivery failed to ${inboxUrl}:`, err)
    return false
  }
}

// Fetch a remote AP object (actor JSON) — used to resolve inbox URLs
export async function fetchRemoteActor(
  actorUrl: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(actorUrl, {
      headers: { Accept: "application/activity+json" },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
