# WebRTCshare

1window 1 画面の画面共有 software?

Work on: https://web-rtc-share.aatomu.workers.dev/

Cloudflare Pages Config:

- Env:
  - `appID`: CallAPI `app ID`
  - `token`: CallAPI `access token`
  - `turnID`: CallAPI `Turn Token ID`
  - `turnToken`: CallAPI `Turn token`
- Binding:
  - KV Name-space
    - `KV`: caching `sessions`
