import { applyUpdate, canAutoUpdate, checkForUpdates, relaunchCli } from "./updater";
import { runCli } from "./cli-main";

async function main() {
  const args = process.argv.slice(2);

  if (canAutoUpdate(args)) {
    const result = await checkForUpdates({
      allowCache: true,
      force: false,
    });

    if (result.updateAvailable) {
      try {
        const applyResult = await applyUpdate(result);

        if (applyResult.applied) {
          await relaunchCli(args);
          return;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to apply automatic updates.";
        console.error(`[instagram-insights:update] ${message}`);
      }
    }
  }

  runCli();
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : "CLI execution failed.";
  console.error(message);
  process.exit(1);
});
