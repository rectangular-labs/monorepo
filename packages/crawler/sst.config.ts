/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "rl-site-crawler",
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
    const vpc = new sst.aws.Vpc("MyVpc");
    const cluster = new sst.aws.Cluster("MyCluster", { vpc });
    const task = new sst.aws.Task("MyTask", {
      cluster,
      image: {
        context: "../../",
        dockerfile: "../../Dockerfile",
      },
    });

    return await Promise.resolve({
      task,
    });
  },
});
