"use client"

import { useState, useRef, useEffect } from "react"

type Suggestion = { sciName: string; comName: string; confidence: number }

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, "WAVE")
  writeStr(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, "data")
  view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true)
  }
  return new Blob([buffer], { type: "audio/wav" })
}

async function sendAudio(blob: Blob, filename: string): Promise<Suggestion[]> {
  const form = new FormData()
  form.append("audio", blob, filename)
  const res = await fetch("/api/birdnet", { method: "POST", body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? "Analysis failed.")
  return data.suggestions as Suggestion[]
}

function WaveformCanvas({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyser) return
    const ctx = canvas.getContext("2d")!
    const c = canvas
    const a = analyser
    const bufferLength = a.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      a.getByteTimeDomainData(dataArray)
      ctx.fillStyle = "#fafaf8"
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.lineWidth = 2
      ctx.strokeStyle = "#111111"
      ctx.beginPath()
      const sliceWidth = c.width / bufferLength
      let x = 0
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * c.height) / 2
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        x += sliceWidth
      }
      ctx.lineTo(c.width, c.height / 2)
      ctx.stroke()
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={60}
      className="w-full h-16 border border-black"
    />
  )
}

export function BirdNetRecorder({ onSelect }: { onSelect: (sciName: string, comName: string) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "analyzing" | "done" | "error">("idle")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const samplesRef = useRef<Float32Array[]>([])
  const contextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      contextRef.current = ctx
      samplesRef.current = []

      const source = ctx.createMediaStreamSource(stream)
      const analyserNode = ctx.createAnalyser()
      analyserNode.fftSize = 2048
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        samplesRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)))
      }

      source.connect(analyserNode)
      source.connect(processor)
      processor.connect(ctx.destination)
      setAnalyser(analyserNode)

      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
      setState("recording")

      ctx.onstatechange = () => {
        if (ctx.state === "closed") stream.getTracks().forEach((t) => t.stop())
      }
    } catch {
      setErrorMsg("Microphone access denied.")
      setState("error")
    }
  }

  async function stopRecording() {
    clearTimer()
    setAnalyser(null)
    setState("analyzing")
    processorRef.current?.disconnect()
    await contextRef.current?.close()

    const sampleRate = contextRef.current?.sampleRate ?? 44100
    const total = samplesRef.current.reduce((n, a) => n + a.length, 0)
    const merged = new Float32Array(total)
    let offset = 0
    for (const chunk of samplesRef.current) { merged.set(chunk, offset); offset += chunk.length }

    try {
      const wav = encodeWav(merged, sampleRate)
      const results = await sendAudio(wav, "recording.wav")
      setSuggestions(results)
      setState("done")
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Analysis failed.")
      setState("error")
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setState("analyzing")
    try {
      const results = await sendAudio(file, file.name)
      setSuggestions(results)
      setState("done")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Analysis failed.")
      setState("error")
    }
  }

  function reset() {
    clearTimer()
    setElapsed(0)
    setAnalyser(null)
    setSuggestions([])
    setErrorMsg("")
    setState("idle")
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="border border-black p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-black">🎙 Identify by sound</p>
        {state === "recording" && (
          <span className="text-xs font-mono text-red-500 tabular-nums">{formatTime(elapsed)}</span>
        )}
      </div>

      {state === "idle" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 text-sm border-2 border-black bg-black hover:bg-[#1a3a2a] hover:border-[#1a3a2a] text-white px-4 py-2 transition-colors font-medium"
          >
            ● Record
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm border border-black text-black hover:bg-gray-50 px-4 py-2 transition-colors"
          >
            ↑ Upload audio
          </button>
          <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
        </div>
      )}

      {state === "recording" && (
        <div className="space-y-2">
          <WaveformCanvas analyser={analyser} />
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 text-sm border-2 border-black bg-black hover:bg-red-700 hover:border-red-700 text-white px-4 py-2 transition-colors font-medium"
          >
            ■ Stop & Analyze
          </button>
        </div>
      )}

      {state === "analyzing" && (
        <div className="flex items-center gap-3 py-2">
          <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin" />
          <p className="text-sm text-gray-600">Analyzing with BirdNET…</p>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{errorMsg}</p>
          <button type="button" onClick={reset} className="text-xs text-gray-500 underline">Try again</button>
        </div>
      )}

      {state === "done" && (
        <div className="space-y-2">
          {suggestions.length === 0 ? (
            <p className="text-sm text-gray-500">No species detected. Try a longer or clearer recording.</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Top matches — tap to use</p>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <button
                    key={s.sciName}
                    type="button"
                    onClick={() => { onSelect(s.sciName, s.comName); reset() }}
                    className="w-full text-left border border-black hover:bg-gray-50 transition-colors overflow-hidden"
                  >
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-black">
                          {i + 1}. {s.comName}
                        </span>
                        <span className="text-xs font-semibold text-black">{s.confidence}%</span>
                      </div>
                      <p className="text-xs text-gray-500 italic mb-1.5">{s.sciName}</p>
                      <div className="w-full bg-gray-200 h-1">
                        <div
                          className="bg-black h-1 transition-all"
                          style={{ width: `${s.confidence}%` }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          <button type="button" onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 underline mt-1">
            Record again
          </button>
        </div>
      )}
    </div>
  )
}
