/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "rectangular-labs",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile:
            input.stage === "production"
              ? "rectangular-production"
              : "rectangular-dev",
        },
      },
    };
  },
  async run() {
    const { parseServerEnv } = await import("@rectangular-labs/env");
    const { Buffer } = await import("node:buffer");

    if (!process.env.CLOUDFLARE_ZONE_ID) {
      throw new Error("CLOUDFLARE_ZONE_ID is not set");
    }

    const serverEnv = parseServerEnv(process.env);
    // const clientEnv = parseClientEnv(process.env);

    const dns = sst.cloudflare.dns({
      zone: process.env.CLOUDFLARE_ZONE_ID,
    });

    const api = new sst.aws.Function("Hono", {
      handler: "apps/backend/src/routes/index.handler",
      environment: serverEnv,
      url: true,
      streaming: !$dev,
      timeout: "120 seconds",
    });

    const basicAuth = $resolve([
      process.env.BASIC_AUTH_USERNAME,
      process.env.BASIC_AUTH_PASSWORD,
    ]).apply(([username, password]) =>
      Buffer.from(`${username}:${password}`).toString("base64"),
    );
    const router = new sst.aws.Router("AppRouter", {
      domain: {
        name:
          $app.stage === "production"
            ? "scalenelab.com"
            : `${$app.stage}.dev.scalenelab.com`,
        dns,
      },
      edge: {
        viewerRequest: {
          injection: $interpolate`
            if (
                !event.request.headers.authorization
                  || event.request.headers.authorization.value !== "Basic ${basicAuth}"
               ) {
              return {
                statusCode: 401,
                headers: {
                  "www-authenticate": { value: "Basic" }
                }
              };
            }`,
        },
      },
    });
    router.route("/api", api.url, {
      readTimeout: "60 seconds",
      keepAliveTimeout: "60 seconds",
    });

    new sst.aws.StaticSite("WWW", {
      path: "apps/www",
      build: {
        command:
          $app.stage === "production"
            ? "pnpm build:prod"
            : "pnpm build:preview",
        output: "dist",
      },
      dev: {
        command: "pnpm dev",
      },
      // environment: clientEnv,
      route: { router, path: "/" },
    });

    const authRouter = new sst.aws.Router("AuthRouter", {
      domain: {
        name:
          $app.stage === "production"
            ? "auth.scalenelab.com"
            : `${$app.stage}.auth.scalenelab.com`,
        dns,
      },
    });
    const table = new sst.aws.Dynamo("OpenAuthStorage", {
      fields: { pk: "string", sk: "string" },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
      ttl: "expiry",
    });
    new sst.aws.Function("OpenAuthIssuer", {
      handler: "packages/auth/src/index.handler",
      link: [table],
      environment: {
        ...serverEnv,
        OPENAUTH_STORAGE: $jsonStringify({
          type: "dynamo",
          options: { table: table.name },
        }),
      },
      url: {
        router: {
          instance: authRouter,
        },
        cors: false,
      },
    });

    new sst.x.DevCommand("Packages", {
      dev: {
        autostart: true,
        command: "pnpm dev:packages",
      },
    });
  },
});
