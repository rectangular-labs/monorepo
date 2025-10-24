import { Container, type StopParams } from "@cloudflare/containers";
import { userVmApiEnv } from "./env";

export class UserVMContainer extends Container {
  defaultPort = parseInt(userVmApiEnv().USER_VM_PORT ?? "3000", 10);
  sleepAfter = "5m";

  override onStart() {
    console.log("Container successfully started.");
  }

  override onStop({ exitCode, reason }: StopParams) {
    console.log("Container successfully shut down.", { exitCode, reason });
  }

  override onError(error: unknown) {
    console.error("Something went wrong in the container:", error);
  }
}
