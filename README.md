# Tap to Cash prank demo

A phone-sized, animated **simulation** of a Tap to Cash receiving moment. It includes a customizable amount, manual or timed reveal, a sampled payment chime, and optional vibration on supported phones. No payment is made, and the site does not connect to Apple or any payment service.

## Use

Open the [live demo](https://mattmcdole.com/applepay-prank/) on a phone. Tap the **•••** menu to choose an amount, reveal delay, and sound preference. Tap **Receive**, then tap the screen to play the reveal. With a delay selected, the reveal starts automatically after the chosen time. Tap **Done** to reset.

Sound must be enabled on the phone. The first tap unlocks audio because mobile browsers block sound until user interaction. In the **•••** menu, choose **Open full screen**. On iPhone, Safari does not allow a web page to enter full screen directly; use **Share → Add to Home Screen**, then open the new icon. The site includes a web app manifest and home screen icon for this.

## Develop

This is plain HTML, CSS, and JavaScript with no build step. Serve the `site` directory locally, for example:

```sh
python3 -m http.server 8000 --directory site
```

The [GitHub Actions workflow](.github/workflows/pages.yml) publishes `site/` to GitHub Pages on pushes to `main`. In repository Settings → Pages, select **GitHub Actions** as the build and deployment source if Pages has not been initialized.

This project is an unofficial parody/demo and is not affiliated with or endorsed by Apple. Apple Pay and Apple Cash are trademarks of Apple Inc.

## Audio credit

The payment chime is from [Free Sounds Library](https://www.freesoundslibrary.com/apple-pay-sound-effect/), which publishes it under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The source describes it as an Apple Pay-style effect; its provenance as an original Apple system recording has not been independently verified.
