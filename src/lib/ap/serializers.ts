import { apUrls, AP_PUBLIC } from "./urls"
import type { Sighting, User } from "@/lib/db/schema"

const AS_CONTEXT = "https://www.w3.org/ns/activitystreams"
const W3_SECURITY = "https://w3id.org/security/v1"

export function serializeActor(
  user: Pick<User, "username" | "name">,
  publicKey: string
) {
  const username = user.username!
  return {
    "@context": [AS_CONTEXT, W3_SECURITY],
    type: "Person",
    id: apUrls.actor(username),
    preferredUsername: username,
    name: user.name ?? username,
    inbox: apUrls.inbox(username),
    outbox: apUrls.outbox(username),
    followers: apUrls.followers(username),
    following: apUrls.following(username),
    publicKey: {
      id: apUrls.publicKey(username),
      owner: apUrls.actor(username),
      publicKeyPem: publicKey,
    },
  }
}

export function serializeNote(
  sighting: Pick<
    Sighting,
    | "id"
    | "speciesName"
    | "commonName"
    | "rating"
    | "notes"
    | "locationName"
    | "latFuzzy"
    | "lngFuzzy"
    | "sightedAt"
  >,
  username: string,
  photos: { url: string }[] = []
) {
  const stars = "⭐".repeat(sighting.rating)
  const displayName = sighting.commonName ?? sighting.speciesName
  const location = sighting.locationName ? ` in ${sighting.locationName}` : ""

  let content = `${stars} <strong>${displayName}</strong>`
  if (sighting.commonName) content += ` <em>(${sighting.speciesName})</em>`
  content += `${location}`
  if (sighting.notes) content += `\n\n${sighting.notes}`

  const tags = [
    { type: "Hashtag", name: "#BirdWatching" },
    {
      type: "Hashtag",
      name: `#${displayName.replace(/\s+/g, "")}`,
    },
  ]

  const attachment = photos.map((p) => ({
    type: "Document",
    mediaType: "image/jpeg",
    url: p.url,
    name: displayName,
  }))

  return {
    "@context": AS_CONTEXT,
    type: "Note",
    id: apUrls.sighting(sighting.id),
    attributedTo: apUrls.actor(username),
    content,
    tag: tags,
    attachment: attachment.length > 0 ? attachment : undefined,
    published: new Date(sighting.sightedAt).toISOString(),
    to: [AP_PUBLIC],
    cc: [apUrls.followers(username)],
  }
}

export function serializeCreate(note: ReturnType<typeof serializeNote>, username: string) {
  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Create",
    id: apUrls.activity(note.id.split("/").pop()!),
    actor: apUrls.actor(username),
    published: note.published,
    to: note.to,
    cc: note.cc,
    object: note,
  }
}

export function serializeAccept(followActivity: Record<string, unknown>, username: string) {
  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Accept",
    id: apUrls.activity(crypto.randomUUID()),
    actor: apUrls.actor(username),
    object: followActivity,
  }
}
