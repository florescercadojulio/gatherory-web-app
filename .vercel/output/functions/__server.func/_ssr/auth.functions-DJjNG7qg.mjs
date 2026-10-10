import { o as getRequestHeaders, r as createServerFn } from "./ssr.mjs";
import { C as requireSessionMiddleware, l as auth } from "./auth.middleware-DPSGMhoZ.mjs";
import { t as createServerRpc } from "./createServerRpc-Bb8AUJau.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.functions-DJjNG7qg.js
/** Returns the current cookie-backed session without requiring authentication. */
var getSession_createServerFn_handler = createServerRpc({
	id: "753fb13391a5b0328ea3344426a11caf1f07e6f28fcdc91937757498d31af961",
	name: "getSession",
	filename: "src/lib/auth.functions.ts"
}, (opts) => getSession.__executeServer(opts));
var getSession = createServerFn({ method: "GET" }).handler(getSession_createServerFn_handler, () => auth.api.getSession({ headers: getRequestHeaders() }));
var ensureSession_createServerFn_handler = createServerRpc({
	id: "320b20df46a897fdac7b4c0604c8114f427784a2e4bb7478c59ae0d8a3d9d1b3",
	name: "ensureSession",
	filename: "src/lib/auth.functions.ts"
}, (opts) => ensureSession.__executeServer(opts));
var ensureSession = createServerFn({ method: "GET" }).middleware([requireSessionMiddleware]).handler(ensureSession_createServerFn_handler, ({ context }) => context);
//#endregion
export { ensureSession_createServerFn_handler, getSession_createServerFn_handler };
