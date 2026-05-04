import { createSign, createVerify } from "crypto"

// Build and sign an HTTP Signature for a POST to a remote inbox.
export function signRequest(
  method: string,
  url: string,
  body: string,
  privateKeyPem: string,
  keyId: string
): Record<string, string> {
  const parsedUrl = new URL(url)
  const date = new Date().toUTCString()
  const digest = `SHA-256=${Buffer.from(
    require("crypto").createHash("sha256").update(body).digest()
  ).toString("base64")}`

  const headersToSign = "(request-target) host date digest"
  const signingString = [
    `(request-target): ${method.toLowerCase()} ${parsedUrl.pathname}`,
    `host: ${parsedUrl.host}`,
    `date: ${date}`,
    `digest: ${digest}`,
  ].join("\n")

  const signer = createSign("sha256")
  signer.update(signingString)
  const signature = signer.sign(privateKeyPem, "base64")

  return {
    Date: date,
    Digest: digest,
    Signature: `keyId="${keyId}",algorithm="rsa-sha256",headers="${headersToSign}",signature="${signature}"`,
    "Content-Type": "application/activity+json",
  }
}

// Verify an incoming HTTP Signature using the sender's public key PEM.
export function verifySignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  publicKeyPem: string
): boolean {
  try {
    const parsedUrl = new URL(url)
    const sigHeader = headers["signature"]
    if (!sigHeader) return false

    const params: Record<string, string> = {}
    sigHeader.split(",").forEach((part) => {
      const [k, ...rest] = part.split("=")
      params[k.trim()] = rest.join("=").replace(/^"|"$/g, "")
    })

    const headerNames = (params["headers"] || "date").split(" ")
    const signingString = headerNames
      .map((h) => {
        if (h === "(request-target)")
          return `(request-target): ${method.toLowerCase()} ${parsedUrl.pathname}`
        return `${h}: ${headers[h] ?? ""}`
      })
      .join("\n")

    const verifier = createVerify("sha256")
    verifier.update(signingString)
    return verifier.verify(publicKeyPem, params["signature"], "base64")
  } catch {
    return false
  }
}
