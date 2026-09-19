# Tap to Cash prank demo

A phone-sized, animated **simulation** of a Tap to Cash receiving moment. It includes a customizable amount, manual or timed reveal, a synthesized two-note ding, and optional vibration on supported phones. No payment is made, and the site does not connect to Apple or any payment service.

## Use

Open the [live demo](https://mattmcdole.com/applepay-prank/) on a phone. Tap **Set amount & timing** to choose an amount, reveal delay, and sound preference. Tap **Start prank**, then tap the screen to play the reveal. With a delay selected, the reveal starts automatically after the chosen time. Tap **Done** to reset.

Sound must be enabled on the phone and started by a tap because mobile browsers block audio until user interaction. Add the website to your home screen for a more immersive full-screen view.

## Develop

This is plain HTML, CSS, and JavaScript with no build step. Serve the `site` directory locally, for example:

```sh
python3 -m http.server 8000 --directory site
```

The [GitHub Actions workflow](.github/workflows/pages.yml) publishes `site/` to GitHub Pages on pushes to `main`. In repository Settings → Pages, select **GitHub Actions** as the build and deployment source if Pages has not been initialized.

This project is an unofficial parody/demo and is not affiliated with or endorsed by Apple. Apple Pay and Apple Cash are trademarks of Apple Inc.
