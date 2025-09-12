# Voice Activity Detection for JavaScript (v6)

[![npm vad-web](https://img.shields.io/npm/v/@realtimex/vad-web?color=blue&label=%40realtimex%2Fvad-web&style=flat-square)](https://www.npmjs.com/package/@realtimex/vad-web)
[![npm vad-react](https://img.shields.io/npm/v/@realtimex/vad-react?color=blue&label=%40realtimex%2Fvad-react&style=flat-square)](https://www.npmjs.com/package/@realtimex/vad-react)

> Run callbacks on segments of audio with user speech in a few lines of code

This package provides an accurate, user-friendly voice activity detector (VAD) that runs in the browser. It is v6-only (Silero VAD v6) and focuses on client‑side use.

* Browse the docs on GitHub Pages (this repo)
* Try the interactive test site: https://therealtimex.github.io/vad/test-site/
* Contributions welcome — see AGENTS.md and docs/developer-guide

Under the hood, this runs [Silero VAD](https://github.com/snakers4/silero-vad) using [ONNX Runtime Web](https://github.com/microsoft/onnxruntime/tree/main/js/web).

## Node support

This fork focuses on browser usage only; node/server packages are not supported.

## Quick Start

To use the VAD via a script tag in the browser, include the following script tags:

```html
<script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@realtimex/vad-web@0.1.1/dist/bundle.min.js"></script>
<script>
  async function main() {
    const myvad = await vad.MicVAD.new({
      onSpeechStart: () => {
        console.log("Speech start detected")
      },
      onSpeechEnd: (audio) => {
        // do something with `audio` (Float32Array of audio samples at sample rate 16000)...
      },
      onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
      baseAssetPath: "https://cdn.jsdelivr.net/npm/@realtimex/vad-web@0.1.1/dist/",
    })
    myvad.start()
  }
  main()
</script>
```

For bundler/React usage, see examples/ and docs.

## References

<a id="1">[1]</a>
Silero Team. (2021).
Silero VAD: pre-trained enterprise-grade Voice Activity Detector (VAD), Number Detector and Language Classifier.
GitHub, GitHub repository, https://github.com/snakers4/silero-vad
