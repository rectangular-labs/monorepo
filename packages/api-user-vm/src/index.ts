import { createServer } from "node:http";
import { createNodeOpenAPIHandler } from "@rectangular-labs/api-core/lib/handlers";
import { initAuthHandler } from "@rectangular-labs/auth";
import { createDb } from "@rectangular-labs/db";
import { userVmApiEnv } from "./env";
import { router } from "./routes";

const PORT = process.env.PORT || 3000;

const handler = (apiUrl: string) =>
  createNodeOpenAPIHandler({
    router,
    openApiOptions: {
      specGenerateOptions: {
        info: {
          title: "User VM Open API",
          version: "0.0.0",
        },
        servers: [{ url: apiUrl }],
        commonSchemas: {
          UndefinedError: { error: "UndefinedError" },
        },
      },
    },
  });

const server = createServer(async (req, res) => {
  const url = new URL(`http://${process.env.HOST ?? "localhost"}${req.url}`);

  const db = createDb();
  const env = userVmApiEnv();

  const result = await handler(url.href).handle(req, res, {
    context: {
      db,
      url,
      reqHeaders: new Headers(req.headers as Record<string, string>),
      auth: initAuthHandler({
        baseURL: url.origin,
        db,
        encryptionKey: env.AUTH_SEO_ENCRYPTION_KEY,
        fromEmail: env.AUTH_SEO_FROM_EMAIL,
        inboundApiKey: env.SEO_INBOUND_API_KEY,
        credentialVerificationType: env.AUTH_SEO_CREDENTIAL_VERIFICATION_TYPE,
        discordClientId: env.AUTH_SEO_DISCORD_ID,
        discordClientSecret: env.AUTH_SEO_DISCORD_SECRET,
        githubClientId: env.AUTH_SEO_GITHUB_ID,
        githubClientSecret: env.AUTH_SEO_GITHUB_SECRET,
        googleClientId: env.AUTH_SEO_GOOGLE_CLIENT_ID,
        googleClientSecret: env.AUTH_SEO_GOOGLE_CLIENT_SECRET,
      }),
    },
  });

  if (!result.matched) {
    res.statusCode = 404;
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`API User VM server listening on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
