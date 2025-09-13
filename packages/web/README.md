# Voice Activity Detector for the Browser

Prompt your user for microphone permissions and run callbacks on segments of audio with user speech in a few lines of code.

Quick start:
```html
<script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@realtimex/vad-web@0.1.3/dist/bundle.min.js"></script>
<script>
  async function main() {
    const myvad = await vad.MicVAD.new({
      onSpeechEnd: (audio) => {
        // do something with `audio` (Float32Array of audio samples at sample rate 16000)...
      }
    })
    myvad.start()
  }
  main()
</script>
```

See the [project home](https://github.com/therealtimex/vad) for more details.
