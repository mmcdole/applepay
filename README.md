# Tap to Cash prank

An unofficial visual joke inspired by Apple Cash. No money moves and no payment service is connected.

[Open the site](https://mattmcdole.com/applepay-prank/?v=3).

## Use

Open **••• → Settings** to set the amount, choose a tap or timed trigger, and preview the payment sound. **Done** saves changes; **Cancel** discards them. Tap **Continue** to arm the animation, then tap the screen or wait for the selected delay. The particles form the amount, followed by the received checkmark and sound. **Done** resets it.

Audio loads and unlocks during the initial tap. A visible error appears if it cannot load. Use the phone's media volume for loudness. Muting sound in Settings disables it for the reveal; Preview sound still lets you audition it. Canceling or hiding an armed page cancels its pending reveal.

## Full screen

In supported browsers, **Settings → Open full screen** uses the browser's Fullscreen API. On iPhone Safari, the menu instead offers **Add to Home Screen** instructions: **Share → Add to Home Screen**, then launch the new icon. A website cannot force Safari on iPhone into the same full-screen mode as an installed web app.

## Develop

Plain HTML, CSS, JavaScript and a WAV file; no production dependencies or build step:

```sh
python3 -m http.server 8000 --directory site
```

The [Pages workflow](.github/workflows/pages.yml) publishes `site/` on pushes to `main`. Versioned script and stylesheet URLs prevent previous revisions from being served from a browser's cache.

## Audio provenance

`site/payment-success-ios.wav` contains the unaltered PCM audio from the archived iOS 18 `payment_success.caf` at [André Louis's phone-tone archive](http://onj3.andrelouis.com/phonetones/unzipped/Apple/iOS-18/System/Library/Audio/UISounds/payment_success.caf). It was converted from CAF to WAV without changing the samples: mono, 44,100 Hz, signed 16-bit PCM, 1.40746 seconds. No gain, pitch, speed, normalization, or effects are applied.

Decoded PCM SHA-256 for both source and WAV:

`64f2399f55f10b21053de1829c046e4c86fa7ccc10b77403ae8a9d67fc65ec21`

The source is a third-party archive, not an official Apple distribution. Apple's sound and trademarks remain Apple's property; this repository does not assert a Creative Commons license over them. This is an unofficial parody project, unaffiliated with Apple.
