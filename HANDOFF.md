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
| Builds, installs, launches on the iOS simulator | 🔨 | prebuild in progress |
| Renders in light **and** dark on device | ⬜ | |
| Every feature driven on the Android emulator | ⬜ | |
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

- Nothing has run on a device. Worklets are invisible to Jest, and the OneLine
  drag is the most likely place for a runtime-only failure — its hit-testing is
  deliberately on the JS thread for that reason, but that is an argument, not a
  measurement.
- Generation cost is bounded but not trivial: a hard day takes a few hundred
  milliseconds on a laptop. It has not been measured on a low-end Android.
