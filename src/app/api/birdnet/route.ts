import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const birdnetUrl = process.env.BIRDNET_URL
  if (!birdnetUrl) {
    return Response.json({ error: "BirdNET not configured. Set BIRDNET_URL in .env.local." }, { status: 503 })
  }

  const formData = await req.formData()
  const audio = formData.get("audio") as File | null
  if (!audio) return Response.json({ error: "No audio provided." }, { status: 400 })

  // Convert File to Buffer so Node's fetch can serialize it correctly
  const audioBuffer = Buffer.from(await audio.arrayBuffer())
  const filename = audio.name || "recording.wav"

  const upstream = new FormData()
  upstream.append("audio", new Blob([audioBuffer], { type: audio.type || "audio/wav" }), filename)
  upstream.append("meta", JSON.stringify({ lat: -1, lon: -1, week: -1, overlap: 0, sensitivity: 1.0 }))

  let res: Response
  try {
    res = await fetch(`${birdnetUrl}/analyze`, { method: "POST", body: upstream })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `Could not reach BirdNET server: ${msg}` }, { status: 502 })
  }

  let data: Record<string, unknown>
  try {
    data = await res.json()
  } catch {
    return Response.json({ error: `BirdNET returned invalid response (status ${res.status})` }, { status: 502 })
  }

  if (!res.ok || data.msg !== "success") {
    return Response.json({ error: `BirdNET error: ${data.msg ?? res.status}` }, { status: 502 })
  }

  // BirdNET result format: "Common Name_Scientific Name"
  const suggestions = ((data.results ?? []) as [string, number][])
    .slice(0, 5)
    .map(([name, confidence]) => {
      const idx = name.indexOf("_")
      const comName = idx !== -1 ? name.slice(0, idx) : name
      const sciName = idx !== -1 ? name.slice(idx + 1) : name
      return { sciName, comName, confidence: Math.round(confidence * 100) }
    })

  return Response.json({ suggestions })
}
