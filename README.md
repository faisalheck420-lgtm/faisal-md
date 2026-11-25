# FAISAL MD — Backend starter

This is the first backend foundation. It is **not yet a working WhatsApp bot** and does not connect personal WhatsApp accounts.

## Requirements
- Node.js 20 or newer
- A terminal / command line

## Run locally
1. Extract this ZIP.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Run `npm run dev`.
6. Open `http://localhost:3000/health`.

Expected response:
```json
{"ok":true,"service":"faisal-md-backend"}
```

## Deploy
Deploy this folder as a Node web service on a Node-compatible host such as Render.
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables from `.env.example` in the hosting dashboard.
- Set `FRONTEND_ORIGIN` to the exact deployed frontend origin.

Never commit `.env` or paste access tokens, app secrets, passwords, or verification codes into chat.

## Next implementation steps
1. Create a Supabase project and configure server-side access using environment variables.
2. Add user authentication and per-user authorization before exposing user data.
3. Configure Meta's official WhatsApp Business Platform app and webhook.
4. Add message sending only after permissions, business setup, and webhook verification are complete.
5. Add audit logs, retention rules, and per-user rate limits.

The `/webhooks/whatsapp` POST route validates Meta's `X-Hub-Signature-256` using the app secret. It intentionally does not store or print message contents.
