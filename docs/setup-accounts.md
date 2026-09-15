# Loopwits — accounts and identifiers

Everything here was read back from the service that owns it, not from the
response to the call that created it.

## Identity

| | |
|---|---|
| Bundle id / package | `com.altixcode.loopwits` |
| App Store name | Loopwits |
| Scheme | `loopwits://` |
| GitHub | `AltixCode/loopwits` |

## App Store Connect

| | |
|---|---|
| App id | `6812275480` |
| SKU | `loopwits-ios` |
| Bundle id resource | `Z5BM7AQV3T` |
| App info | `271d205b-2ae7-4ed6-b3e8-33658f8b386b` |
| Version 1.0 | `24c7cd57-c29c-4f92-8012-5e46eeecb7d2` |
| en-US version localization | `1ec192f0-f56b-430e-ac2a-c69e329f0fb4` |
| en-US app info localization | `55957844-e04a-4ab2-a0a6-67a1d70f998b` |
| Category | Games → Puzzle, Board (secondary Entertainment) |
| Age rating | 4+ (declared: contains advertising, nothing else) |
| Privacy policy | https://altixcode.com/legal/app-privacy |
| Support URL | https://altixcode.com/contact |
| Marketing URL | https://altixcode.com/work |
| Screenshots | 6 × iPhone 6.9" (1320×2868), 3 × iPad 13" (2064×2752), all `COMPLETE` |
| Distribution profile | `Loopwits App Store`, `JD6Q7QHC28`, uuid `44c82807-bbad-4b4d-9cfa-2231d1706f2c` |
| Distribution certificate | `XBA853F78N` (the one whose private key is on this Mac) |

### In-app purchase

| | |
|---|---|
| IAP id | `6812276658` |
| Product id | `com.altixcode.loopwits.removeads` |
| Type | Non-consumable. **Never a subscription.** |
| Price | $3.99 USA base, auto-equalized across territories |
| Display name | Remove Ads & Unlock All |

## RevenueCat

| | |
|---|---|
| Project | `projc63c253e` |
| iOS app | `app2e6e207887` |
| Android app | `app661d587d1f` |
| Entitlement | `entla127c6b79f` — `remove_ads` |
| Offering | `ofrng66b7ab802e` — `default` |
| Package | `pkgea52ad63f3b` — `$rc_lifetime` |

**Not finished:** no product is attached to the package yet — the store product
must exist on both stores first — and `rc apps keys` reports the iOS app as
*partial* Apple credentials. `rc setup apple app2e6e207887` needs an interactive
Apple sign-in with 2FA, so a person has to run it. Until then RevenueCat cannot
validate an App Store purchase.

## AdMob

| | |
|---|---|
| Publisher | `ca-app-pub-2504845459806550` |
| iOS app | `~5555146751` |
| Android app | `~4327668870` |
| Ad units | banner, interstitial, rewarded, per platform |

Identifiers are in `/Volumes/ExtremePro/Dev/.admob-ids/loopwits.env` and as the
ten repo secrets. **No GDPR or US-states consent message is published**, and the
UMP SDK can only present a message that exists — so in the EEA the app requests
no ad at all. That is the fail-closed path working, not a bug, but it also means
zero EEA revenue until someone publishes the messages by hand in the console.

## Google Play

Nothing exists yet. Play has no API for creating an app record, and an app has
no package name until its first bundle is uploaded — so the order is: create the
app in the console, upload an AAB to internal testing, then create the in-app
product. `gplay apps list` currently fails with the Play Developer Reporting API
disabled on project `1013025269741`.
