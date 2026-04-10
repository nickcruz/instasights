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
      const applyResult = await applyUpdate(result);

      if (applyResult.applied) {
        await relaunchCli(args);
        return;
      }
    }
  }

  runCli();
}

void main();
