# Loopwits — handoff

What was actually run, and what is still unknown. **Unverified is `UNKNOWN`,
never a pass** — a green build is not a verification.

Last updated: 2026-09-15

## Verification state

| Gate | State | Evidence |
|---|---|---|
| Lint | ✅ | `npm run lint` — clean |
| Typecheck | ✅ | `npx tsc --noEmit` — clean |
| Unit tests | ✅ | 378 passing, 30 suites |
| i18n completeness (14 locales) | ✅ | `check-i18n: 14 locales × 91 keys — complete` |
| UI rules (colour tokens, `t()`) | ✅ | `check-ui-rules: 19 files clean` |
| iOS + Android bundle export | ✅ | both `expo export` runs succeeded; iOS bundle 5.5 MB |
| Every generated puzzle uniquely solvable | ✅ | asserted per type and for whole days in `daily.test.ts` |
| CI green on a self-hosted runner | ⬜ | not yet run |
| `check:release` with real identifiers | ⬜ | identifiers are in repo secrets; not yet exercised in a build |
| Builds, installs, launches on the iOS simulator | ✅ | `Build Succeeded, 0 error(s)`; launched on iPhone 17, PID alive, hub rendered |
| Builds, installs, launches on the Android emulator | ✅ | build exit code checked (a first attempt failed in seconds and installed nothing); `pm list packages` confirms |
| Renders in light **and** dark on device | ✅ | screenshots in both appearances on both platforms |
| Tap interaction driven on the Android emulator | ✅ | a Rulers cell cycles empty → crossed → marker → empty, screenshotted at each step |
| **Drag-to-draw driven on the Android emulator** | ✅ | swiping from dot 1 draws the path across the cells the finger crossed; no "Remote Function" error in logcat |
| Puzzle generation runs on device | ✅ | an 8×8 Rulers region map and a 6×6 OneLine board with ten dots both rendered from the on-device generator |
| Purchase flow exercised against a real offering | ⬜ | RevenueCat catalogue exists; no store product yet |
| Ads served under real consent | ⬜ | units exist; no consent message published yet |

## Store and service state

| | State | Id |
|---|---|---|
| Bundle id registered | ✅ | `com.altixcode.loopwits` (`Z5BM7AQV3T`) |
| App Store Connect record | ⬜ | needs a browser login |
| iOS IAP created and priced | ⬜ | blocked on the ASC record |
| Play Console app | ⬜ | |
| Play AAB uploaded (internal) | ⬜ | |
| Play in-app product | ⬜ | blocked until the first AAB is uploaded |
| AdMob app id reaches the binary | ✅ | `GADApplicationIdentifier` in the built app reads `ca-app-pub-2504845459806550~5555146751` |
| AdMob app (iOS) | ✅ | `ca-app-pub-2504845459806550~5555146751` |
| AdMob app (Android) | ✅ | `ca-app-pub-2504845459806550~4327668870` |
| AdMob ad units (6) | ✅ | banner / interstitial / rewarded per platform |
| AdMob GDPR + US-states messages | ⬜ | **must be published by hand** — without one the SDK has no message to present and serves no ads in the EEA |
| RevenueCat project | ✅ | `projc63c253e` (a stray duplicate `projf8cc9e68` needs deleting in the dashboard) |
| RevenueCat entitlement / offering / package | ✅ | `remove_ads` / `default` / `$rc_lifetime` |
| RevenueCat SDK keys in repo secrets | ✅ | iOS + Android |

## Decisions the owner owns

- Publish on altixcode.com and itsata.com? **Not yet asked.**

## Known UNKNOWNs

- **The purchase flow has never been exercised.** RevenueCat has the catalogue
  but no store product exists yet, so the paywall has nothing to price.
- **Ads have never been served.** The units exist, but no AdMob consent message
  is published, and the SDK can only present a message that exists — so in the
  EEA the app would show no ads at all. That is a console task, by hand.
- **The iOS ATT prompt could not be dismissed**, so iOS verification stops at
  build / install / launch / render, exactly as the playbook says it must:
  Simulator.app is missing from this Xcode install, `simctl` has no tap, and
  `simctl privacy … user-tracking` returns "Operation not permitted".
- Generation cost was not measured on a low-end device. It is a few hundred
  milliseconds for a hard day on this laptop, and the boards rendered without a
  visible stall on the emulator, but that is not a measurement.

### A false alarm worth remembering

The first launch check reported "UIScene adoption missing". It was wrong: the
`log show` predicate matched **its own command line** in the device log, because
the argument string contains the phrase being searched for. The app was alive
the whole time. Match on the app's process, not on a substring that the query
itself puts into the log.
