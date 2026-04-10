import { runUpdaterHelperMain } from "./updater-helper";

void runUpdaterHelperMain().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Updater helper execution failed.";
  console.error(message);
  process.exit(1);
});
