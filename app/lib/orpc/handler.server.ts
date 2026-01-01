import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch"; // or '@orpc/server/node'
import { CORSPlugin } from "@orpc/server/plugins";
import router from "./router.server";

const handler = new RPCHandler(router, {
  plugins: [new CORSPlugin()],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export default handler;
