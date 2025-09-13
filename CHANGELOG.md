# Changelog

## 0.1.3 - 2025-09-13

- Fixed: MicVAD.destroy no longer calls `pauseStream` twice. When listening it calls `pause()`, otherwise it only calls `pauseStream` if the stream is still active. Added tests to validate behavior. (Commit 4aa9639, integrated from PR #2)
- Docs: Updated README and examples to @realtimex scope and CDN version 0.1.3.

## 0.1.2 - 2025-09-13

- Meta: Correct package homepage/repository to therealtimex/vad.
- Docs: Updated README/example links and CDN to 0.1.2.

## 0.1.1 - 2025-09-13

- Version bump to republish under @realtimex scope.

## 0.1.0 - 2025-09-13

- Initial @realtimex release. v6-only Silero VAD support, React hook wrapper, examples, and test site.
