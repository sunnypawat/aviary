import { generateKeyPairSync } from "crypto"
import { db } from "./db"
import { actors } from "./db/schema"

export async function createActor(userId: string, username: string) {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  })

  await db.insert(actors).values({ userId, username, publicKey, privateKey })
}
