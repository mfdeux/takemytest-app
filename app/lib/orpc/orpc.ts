import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { type RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { type Router } from "./types";

const locationObj =
  typeof window !== "undefined"
    ? window.location
    : typeof document !== "undefined"
      ? document.location
      : undefined;

const rpcUrl = locationObj
  ? `${locationObj.protocol}//${locationObj.hostname}${locationObj.port ? `:${locationObj.port}` : ""}/rpc`
  : `http://localhost:5173/rpc`;

const link = new RPCLink({
  url: rpcUrl,
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

const client: RouterClient<Router> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);

export default client;
