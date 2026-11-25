import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";

const app = express();
const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(helmet());

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server requests and configured frontend origins.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Hub-Signature-256"]
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

app.get("/", (_req, res) => {
  res.json({ name: "FAISAL MD API", status: "running" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "faisal-md-backend" });
});

// Webhook verification endpoint for the official WhatsApp Business Platform.
// Configure the same verify token in Meta and in the hosting environment.
app.get("/webhooks/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    process.env.WHATSAPP_VERIFY_TOKEN &&
    token === process.env.WHATSAPP_VERIFY_TOKEN &&
    typeof challenge === "string"
  ) {
    return res.status(200).type("text/plain").send(challenge);
  }

  return res.sendStatus(403);
});

// Keep the raw request body so the Meta signature can be checked before parsing.
app.post(
  "/webhooks/whatsapp",
  express.raw({ type: "application/json", limit: "1mb" }),
  (req, res) => {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const signature = req.get("X-Hub-Signature-256");

    if (!appSecret) {
      return res.status(503).json({ error: "Webhook is not configured yet." });
    }

    if (!signature || !signature.startsWith("sha256=")) {
      return res.sendStatus(401);
    }

    const expected = "sha256=" + crypto
      .createHmac("sha256", appSecret)
      .update(req.body)
      .digest("hex");

    const suppliedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      return res.sendStatus(401);
    }

    // TODO: Parse verified event and process it without logging private message content.
    // Acknowledge quickly; move longer work to a queue in the production version.
    return res.sendStatus(200);
  }
);

app.use(express.json({ limit: "100kb" }));

app.use((err, _req, res, _next) => {
  if (err?.message === "Origin not allowed") {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  console.error("Request error:", err?.message || "unknown");
  return res.status(400).json({ error: "Bad request" });
});

app.listen(port, () => {
  console.log(`FAISAL MD API listening on port ${port}`);
});
