import { config } from "dotenv";
import type {} from "graphile-config";
import type {} from "graphile-worker";
import { WorkerPreset } from "graphile-worker";
import { graphileLogger } from "~/lib/utils/logger.server";

config();

const preset: GraphileConfig.Preset = {
  extends: [WorkerPreset],
  worker: {
    connectionString: process.env.DATABASE_URL,
    maxPoolSize: 10,
    logger: graphileLogger,
    pollInterval: 2000,
    preparedStatements: true,
    schema: "graphile_worker",
    crontabFile: process.cwd() + "/tasks/crontab",
    concurrentJobs: 5,
    fileExtensions: [
      ".js",
      ".cjs",
      ".mjs",
      ".ts",
      ".cts",
      ".mts",
      ".jsx",
      ".tsx",
    ],
  },
};

export default preset;
