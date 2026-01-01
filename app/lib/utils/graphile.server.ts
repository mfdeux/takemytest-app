import { makeWorkerUtils } from "graphile-worker";

const graphileWorker = await makeWorkerUtils({
  connectionString: process.env.DATABASE_URL, // Your Postgres database connection string
});

export default graphileWorker;
