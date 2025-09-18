/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "rl-tasks",
      removal: input?.stage === "production" ? "remove" : "remove",
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
    const vpc = new sst.aws.Vpc("TasksVpc");
    const cluster = new sst.aws.Cluster("TasksCluster", { vpc });
    const task = new sst.aws.Task("SiteCrawler", {
      cluster,
      image: {
        context: "../../",
        dockerfile: "./Dockerfile",
      },
    });

    const queue = new sst.aws.Queue("TasksQueue");
    queue.subscribe({
      handler: "./src/subscriber.handler",
      link: [task],
    });

    const app = new sst.aws.Function("TasksAPI", {
      handler: "./src/server.handler",
      link: [queue],
      url: true,
    });

    return await Promise.resolve({
      enqueueUrl: app.url,
    });
  },
});
