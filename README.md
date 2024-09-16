# WebRTCshare

1window 1 画面の画面共有 software?

Work on: `https://web-share.pages.dev/`

Cloudflare Pages Config:

- Env:
  - `appID`: CallAPI `app ID`
  - `token`: CallAPI `access token`
  - `turnID`: CallAPI `Turn Token ID`
  - `turnToken`: CallAPI `Turn token`
- Functions:
  - KV Name-space Binding
    - `KV`: sessionID caching KV name-space
