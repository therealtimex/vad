import { interpolateInferno } from "d3-scale-chromatic"
import { MicVAD, utils } from "@realtimex/vad-web"

const loading = setInterval(() => {
  const indicator = document.getElementById("indicator")
  const [message, ...dots] = indicator.innerHTML.split(".")
  indicator.innerHTML = message + ".".repeat((dots.length + 1) % 7)
}, 200)

function addAudio(audioUrl) {
  const entry = document.createElement("li")
  const audio = document.createElement("audio")
  audio.controls = true
  audio.src = audioUrl
  entry.classList.add("newItem")
  entry.appendChild(audio)
  return entry
}

async function main() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true,
      },
    })
    const myvad = await MicVAD.new({
      stream,
      model: "v6",
      baseAssetPath: "/",
      onnxWASMBasePath: "/",
      positiveSpeechThreshold: 0.4,
      negativeSpeechThreshold: 0.4,
      minSpeechFrames: 15,
      preSpeechPadFrames: 30,
      onFrameProcessed: (probs, frame) => {
        const indicatorColor = interpolateInferno(probs.isSpeech / 2)
        document.body.style.setProperty("--indicator-color", indicatorColor)
      },
      onSpeechEnd: (arr) => {
        const wavBuffer = utils.encodeWAV(arr)
        const base64 = utils.arrayBufferToBase64(wavBuffer)
        const url = `data:audio/wav;base64,${base64}`
        const el = addAudio(url)
        const speechList = document.getElementById("playlist")
        speechList.prepend(el)
      },
    })
    window.myvad = myvad

    clearInterval(loading)
    window.toggleVAD = () => {
      console.log("ran toggle vad")
      if (myvad.listening === false) {
        myvad.start()
        document.getElementById("toggle_vad_button").textContent = "STOP VAD"
        document.getElementById("indicator").textContent = "VAD is running"
      } else {
        myvad.pause()
        document.getElementById("toggle_vad_button").textContent = "START VAD"
        document.getElementById(
          "indicator"
        ).innerHTML = `VAD is <span style="color:red">stopped</span>`
        const indicatorColor = interpolateInferno(0)
        document.body.style.setProperty("--indicator-color", indicatorColor)
      }
    }
    window.toggleVAD()
    document.getElementById("toggle_vad_button").disabled = false
  } catch (e) {
    console.error("Failed:", e)
    clearInterval(loading)
    document.getElementById(
      "indicator"
    ).innerHTML = `<span style="color:red">VAD failed to load</span>`
  }
}

main()
