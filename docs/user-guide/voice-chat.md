---
title: Voice Chat (Hands‑Free)
---

This guide shows how to wire a hands‑free “voice chat” loop using the VAD with your STT (e.g., Whisper) and optional TTS.

What you’ll build

- A `VoiceChatController` that:
  - uses `MicVAD` to auto‑endpoint speech
  - calls your STT on each final segment
  - emits simple status/transcript events to drive UI
  - briefly pauses the mic while TTS plays to avoid barge‑in
- A small React panel UI that listens to events and lets the user Pause/Resume/End.

Install

- `npm i @realtimex/vad-web` (or `@realtimex/vad-react` if you want hook ergonomics).
- Ensure assets are served (see “Assets” below).

Controller (framework‑agnostic)

```ts
// voice-chat-controller.ts
import { MicVAD } from "@realtimex/vad-web"

type Status = "loading" | "listening" | "processing" | "idle"

// Minimal event emitter using EventTarget
export class Emitter<TEvents extends Record<string, any>> {
  private target = new EventTarget()
  on<K extends keyof TEvents & string>(type: K, handler: (e: TEvents[K]) => void) {
    const wrapped = (evt: Event) => handler((evt as CustomEvent).detail)
    this.target.addEventListener(type, wrapped as EventListener)
    return () => this.target.removeEventListener(type, wrapped as EventListener)
  }
  emit<K extends keyof TEvents & string>(type: K, detail: TEvents[K]) {
    this.target.dispatchEvent(new CustomEvent(type, { detail }))
  }
}

export type VoiceChatEvents = {
  VOICECHAT_STATUS: { status: Status }
  VOICECHAT_TRANSCRIPT: { text: string; isFinal: boolean }
  VOICECHAT_SEND: { text: string }
}

export type STT = {
  // Called with a 16kHz, mono Float32Array (−1..1)
  transcribe: (audio: Float32Array) => Promise<{ text: string }>
}

type Options = {
  // Where to load assets from (see Assets section)
  baseAssetPath?: string
  onnxWASMBasePath?: string
  // TTS coordination hooks (optional)
  onTTSStart?: () => void
  onTTSEnd?: () => void
}

export class VoiceChatController extends Emitter<VoiceChatEvents> {
  private vad?: MicVAD
  private running = false
  private paused = false
  private stt: STT
  private savedVADOptions?: Partial<Parameters<typeof MicVAD.new>[0]>

  constructor(stt: STT, private opts: Options = {}) {
    super()
    this.stt = stt
  }

  async start() {
    if (this.running) return
    this.running = true
    this.paused = false
    this.emit("VOICECHAT_STATUS", { status: "loading" })

    // Configure VAD (Silero V6) with voice‑chat‑friendly thresholds
    this.vad = await MicVAD.new({
      baseAssetPath: this.opts.baseAssetPath ?? "https://cdn.jsdelivr.net/npm/@realtimex/vad-web@latest/dist/",
      onnxWASMBasePath: this.opts.onnxWASMBasePath ?? "https://cdn.jsdelivr.net/npm/@realtimex/vad-web@latest/dist/onnxruntime-web/",
      positiveSpeechThreshold: 0.5,
      negativeSpeechThreshold: 0.35,
      minSpeechMs: 250,
      redemptionMs: 800,
      preSpeechPadMs: 200,
      onSpeechStart: () => {
        this.emit("VOICECHAT_STATUS", { status: "listening" })
      },
      onSpeechRealStart: () => {
        this.emit("VOICECHAT_TRANSCRIPT", { text: "", isFinal: false })
      },
      onSpeechEnd: async (audio) => {
        if (!this.running) return
        this.emit("VOICECHAT_STATUS", { status: "processing" })
        try {
          const { text } = await this.stt.transcribe(audio)
          if (text && text.trim().length > 0) {
            this.emit("VOICECHAT_TRANSCRIPT", { text, isFinal: true })
            this.emit("VOICECHAT_SEND", { text })
          }
        } catch (e) {
          console.error("STT error", e)
        } finally {
          if (this.running && !this.paused) {
            await this.vad?.start()
            this.emit("VOICECHAT_STATUS", { status: "listening" })
          } else if (this.running) {
            this.emit("VOICECHAT_STATUS", { status: "idle" })
          }
        }
      },
    })

    await this.vad.start()
    this.emit("VOICECHAT_STATUS", { status: "listening" })
  }

  async pause() {
    if (!this.running || this.paused) return
    this.paused = true
    this.vad?.pause(() => {})
    this.emit("VOICECHAT_STATUS", { status: "idle" })
  }

  async resume() {
    if (!this.running || !this.paused) return
    this.paused = false
    await this.vad?.start()
    this.emit("VOICECHAT_STATUS", { status: "listening" })
  }

  async stop() {
    if (!this.running) return
    this.running = false
    this.paused = false
    this.vad?.destroy()
    this.vad = undefined
    this.emit("VOICECHAT_STATUS", { status: "idle" })
  }

  // Call these around TTS playback to avoid barge‑in
  async handleTTSStart() {
    await this.pause()
  }
  async handleTTSEnd() {
    if (this.running) await this.resume()
  }
}
```

React panel UI (example)

```tsx
// VoiceChatPanel.tsx
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { VoiceChatController, STT } from "./voice-chat-controller"

export function VoiceChatPanel({ open, onClose, stt }: { open: boolean; onClose: () => void; stt: STT }) {
  const controller = useMemo(() => new VoiceChatController(stt), [stt])
  const [status, setStatus] = useState<"loading" | "listening" | "processing" | "idle">("idle")
  const [lastText, setLastText] = useState("")

  useEffect(() => {
    const off1 = controller.on("VOICECHAT_STATUS", ({ status }) => setStatus(status))
    const off2 = controller.on("VOICECHAT_TRANSCRIPT", ({ text, isFinal }) => {
      setLastText(text)
      // You could also stream partials to an input UI here
    })
    if (open) controller.start()
    return () => {
      off1()
      off2()
      controller.stop()
    }
  }, [open, controller])

  if (!open) return null
  return createPortal(
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 1000, background: "#111", color: "#fff", padding: 16, borderRadius: 12, width: 360 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div aria-hidden style={{ width: 32, height: 32, borderRadius: 9999, background: status === "listening" ? "#ff4d4f" : "#666", boxShadow: status === "listening" ? "0 0 0 8px rgba(255,77,79,0.2)" : undefined }} />
        <div>
          <div style={{ fontWeight: 600 }}>Voice chat</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{status}</div>
        </div>
      </div>
      <div style={{ marginTop: 12, minHeight: 40, fontSize: 14, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{lastText || (status === "listening" ? "Listening…" : "")}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {status !== "listening" ? (
          <button onClick={() => controller.resume()}>Resume</button>
        ) : (
          <button onClick={() => controller.pause()}>Pause</button>
        )}
        <button onClick={() => { controller.stop(); onClose() }}>End</button>
      </div>
    </div>,
    document.body
  )
}
```

Wire to chat input

- Listen for `VOICECHAT_SEND` and submit the text to your chat handler.
- Optionally reflect partials into your input for consistency.

```ts
controller.on("VOICECHAT_SEND", ({ text }) => {
  // update your prompt input UI if desired
  // sendCommand(text, /* autoSubmit */ true)
})
```

STT stub (replace with your Whisper client)

```ts
// Example STT that returns a fake transcript. Replace with Whisper/OpenAI/etc.
export const fakeSTT: STT = {
  async transcribe(_audio: Float32Array) {
    await new Promise((r) => setTimeout(r, 400))
    return { text: "hello there" }
  },
}
```

TTS coordination

- If you have TTS start/end events, call `controller.handleTTSStart()` and `controller.handleTTSEnd()` accordingly.
- This pauses the mic while TTS plays, then resumes after playback.

Assets

- When bundling, ensure the following from `@realtimex/vad-web/dist/` are available at runtime:
  - `vad.worklet.bundle.min.js`
  - `silero_vad_v6.onnx`
  - `onnxruntime-web` WASM assets under a base path
- Easiest path during development: point to the CDN in controller options.

```ts
new VoiceChatController(stt, {
  baseAssetPath: "https://cdn.jsdelivr.net/npm/@realtimex/vad-web@latest/dist/",
  onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/@realtimex/vad-web@latest/dist/onnxruntime-web/",
})
```

Recommended thresholds (starting points)

- positiveSpeechThreshold: `0.5`
- negativeSpeechThreshold: `0.35`
- minSpeechMs: `250`
- redemptionMs: `800`
- preSpeechPadMs: `200`

Notes

- Manual “Speak Prompt” can still use your existing recorder; the above controller is only for the hands‑free mode.
- If you see build errors about missing assets, confirm your bundler copies the files listed in Assets.
- If STT callbacks throw, wrap them in try/catch as above to keep the loop resilient.

