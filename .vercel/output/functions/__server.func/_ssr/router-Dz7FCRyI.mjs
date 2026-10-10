import { o as __toESM } from "../_runtime.mjs";
import { C as PopoverPositioner, E as PopoverRoot, G as ComboboxPortal, H as ComboboxItem$1, I as ComboboxItemIndicator, J as ComboboxInput$1, K as ComboboxList$1, L as ComboboxRoot, S as PopoverPopup, T as PopoverTrigger$1, U as ComboboxPopup, V as ComboboxEmpty$1, W as ComboboxPositioner, Y as ComboboxTrigger$1, _ as SelectPortal, a as SliderTrack, at as CheckboxRoot, b as SelectTrigger$1, bt as require_react, c as SelectGroup$1, ct as TooltipArrow, d as SelectItemText, dt as TooltipPortal, f as SelectItemIndicator, ft as TooltipTrigger$1, g as SelectPositioner, gt as mergeProps, h as SelectPopup, ht as Button, i as SliderThumb, it as CheckboxIndicator, l as SelectScrollUpArrow, lt as TooltipPopup, m as SelectList, mt as Input, n as SwitchRoot, o as SliderControl, ot as useRender, p as SelectItem$1, pt as TooltipRoot, q as ComboboxClear$1, r as SliderIndicator, rt as Separator, s as SliderRoot, st as TooltipProvider$1, t as SwitchThumb, u as SelectScrollDownArrow, ut as TooltipPositioner, v as SelectIcon, w as PopoverPortal, x as SelectRoot, y as SelectValue$1, yt as require_jsx_runtime } from "../_libs/@base-ui/react+[...].mjs";
import { a as HeadContent, c as createRouter, d as createFileRoute, f as createRootRouteWithContext, g as ClientOnly, i as Scripts, m as useNavigate, p as Link, u as lazyRouteComponent, v as redirect, y as notFound } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useSelector, n as createFormHookContexts, t as createFormHook } from "../_libs/@tanstack/react-form+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn, s as __exportAll } from "./ssr.mjs";
import { Cn as datetime, Fn as object, O as isSafeUrlScheme, On as boolean, en as capitalizeFirstLetter, o as createFetch, tn as toKebabCase, zn as string } from "../_libs/@better-auth/core+[...].mjs";
import { n as defu } from "../_libs/defu.mjs";
import { C as requireSessionMiddleware, S as parseJSON, _ as hasPermissionFn, c as adminAc, f as defaultRoles$1, g as getBaseURL, l as auth, n as EMAIL_OTP_ERROR_CODES, o as ORGANIZATION_ERROR_CODES, s as PACKAGE_VERSION, x as ownerAc, y as memberAc } from "./auth.middleware-DPSGMhoZ.mjs";
import { a as atom, i as onSet, n as STORE_UNMOUNT_DELAY, r as onMount, t as listenKeys } from "../_libs/nanostores.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "../_libs/cn.mjs";
import { C as House, D as Copy, F as ChevronLeft, H as ArrowLeft, I as ChevronDown, L as Check, N as ChevronUp, P as ChevronRight, R as Calendar$1, _ as LoaderCircle, b as KeyRound, d as OctagonX, g as Lock, j as CircleCheck, o as RefreshCw, p as Mail, r as TriangleAlert, s as QrCode, t as X, x as Info, z as CalendarDays } from "../_libs/lucide-react.mjs";
import { a as ListEventsInputSchema, i as InviteEventParticipantInputSchema, n as CreateEventInputSchema, t as AcceptEventInvitationInputSchema } from "./event.service-BzanlUfC.mjs";
import { n as _c, t as PostHogProvider } from "../_libs/posthog-js+posthog__react.mjs";
import { n as z, t as J } from "../_libs/next-themes.mjs";
import { A as Ye, D as Ue, H as v, L as ke, N as ge, P as he, U as x, V as tt, _t as e$1, d as Ce, et as matchMutation, f as De, gt as e, h as He, j as be, m as Ge, mt as e$3, n as r, o as s, r as u, s as e$2, tt as matchQuery, u as $e, v as M, w as Se, yt as e$4 } from "../_libs/@better-auth-ui/core+[...].mjs";
import { S as QueryClient, _ as D, d as at, f as ft, h as t, n as f, o as Ke, p as qe, r as p, s as Ne, t as n, v as E, x as useQueryClient, y as S } from "../_libs/@better-auth-ui/react+[...].mjs";
import { t as useIsMutating } from "../_libs/tanstack__react-query.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { l as format } from "../_libs/date-fns.mjs";
import { n as getDefaultClassNames, t as DayPicker } from "../_libs/react-day-picker.mjs";
import { n as Nt, r as Qt, t as $t } from "../_libs/input-otp.mjs";
import { t as setupRouterSsrQueryIntegration } from "../_libs/@tanstack/react-router-ssr-query+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tooltip-D4_CKJpj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var redirectPlugin = {
	id: "redirect",
	name: "Redirect",
	hooks: { onSuccess(context) {
		if (context.data?.url && context.data?.redirect && isSafeUrlScheme(context.data.url)) {
			if (typeof window !== "undefined" && window.location) {
				if (window.location) try {
					window.location.href = context.data.url;
				} catch {}
			}
		}
	} }
};
function isPlainObject(value) {
	if (typeof value !== "object" || value === null) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
/**
* Deep structural equality for JSON-serializable values.
* Handles: primitives, null, arrays, and plain objects.
* Short-circuits on referential equality at every recursion level.
*/
function isJsonEqual(a, b) {
	if (a === b) return true;
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) if (!isJsonEqual(a[i], b[i])) return false;
		return true;
	}
	if (isPlainObject(a) && isPlainObject(b)) {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		if (keysA.length !== keysB.length) return false;
		for (const key of keysA) if (!(key in b) || !isJsonEqual(a[key], b[key])) return false;
		return true;
	}
	return false;
}
/**
* Attach an equality gate to a nanostores atom via `onSet`.
* When `isEqual(currentValue, newValue)` returns true, the `set()` call
* is aborted: no listeners fire, no framework re-renders occur.
*
* Returns the unsubscribe function from `onSet`.
*/
function withEquality(store, isEqual) {
	return onSet(store, ({ newValue, abort }) => {
		if (isEqual(store.value, newValue)) abort();
	});
}
var kAuthQuery = Symbol.for("better-auth:auth-query");
function isAuthQueryStore(store) {
	return kAuthQuery in store && store[kAuthQuery] === true;
}
function createAuthQueryAtom(initialValue) {
	const queryAtom = /* @__PURE__ */ atom(initialValue);
	Object.defineProperty(queryAtom, kAuthQuery, { value: true });
	return queryAtom;
}
var kBroadcastChannel = Symbol.for("better-auth:broadcast-channel");
var now$1 = () => Math.floor(Date.now() / 1e3);
var WindowBroadcastChannel = class {
	listeners = /* @__PURE__ */ new Set();
	name;
	constructor(name = "better-auth.message") {
		this.name = name;
	}
	subscribe(listener) {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
	post(message) {
		if (typeof window === "undefined") return;
		try {
			localStorage.setItem(this.name, JSON.stringify({
				...message,
				timestamp: now$1()
			}));
		} catch {}
	}
	setup() {
		if (typeof window === "undefined" || typeof window.addEventListener === "undefined") return () => {};
		const handler = (event) => {
			if (event.key !== this.name) return;
			const message = JSON.parse(event.newValue ?? "{}");
			if (message?.event !== "session" || !message?.data) return;
			this.listeners.forEach((listener) => listener(message));
		};
		window.addEventListener("storage", handler);
		return () => {
			window.removeEventListener("storage", handler);
		};
	}
};
function getGlobalBroadcastChannel(name = "better-auth.message") {
	if (!globalThis[kBroadcastChannel]) globalThis[kBroadcastChannel] = new WindowBroadcastChannel(name);
	return globalThis[kBroadcastChannel];
}
var kFocusManager = Symbol.for("better-auth:focus-manager");
var WindowFocusManager = class {
	listeners = /* @__PURE__ */ new Set();
	subscribe(listener) {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
	setFocused(focused) {
		this.listeners.forEach((listener) => listener(focused));
	}
	setup() {
		if (typeof window === "undefined" || typeof document === "undefined" || typeof window.addEventListener === "undefined") return () => {};
		const visibilityHandler = () => {
			if (document.visibilityState === "visible") this.setFocused(true);
		};
		document.addEventListener("visibilitychange", visibilityHandler, false);
		return () => {
			document.removeEventListener("visibilitychange", visibilityHandler, false);
		};
	}
};
function getGlobalFocusManager() {
	if (!globalThis[kFocusManager]) globalThis[kFocusManager] = new WindowFocusManager();
	return globalThis[kFocusManager];
}
var kOnlineManager = Symbol.for("better-auth:online-manager");
var WindowOnlineManager = class {
	listeners = /* @__PURE__ */ new Set();
	isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
	subscribe(listener) {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
	setOnline(online) {
		this.isOnline = online;
		this.listeners.forEach((listener) => listener(online));
	}
	setup() {
		if (typeof window === "undefined" || typeof window.addEventListener === "undefined") return () => {};
		const onOnline = () => this.setOnline(true);
		const onOffline = () => this.setOnline(false);
		window.addEventListener("online", onOnline, false);
		window.addEventListener("offline", onOffline, false);
		return () => {
			window.removeEventListener("online", onOnline, false);
			window.removeEventListener("offline", onOffline, false);
		};
	}
};
function getGlobalOnlineManager() {
	if (!globalThis[kOnlineManager]) globalThis[kOnlineManager] = new WindowOnlineManager();
	return globalThis[kOnlineManager];
}
var now = () => Math.floor(Date.now() / 1e3);
/**
* Rate limit: don't refetch on focus if a session request was made within this many seconds
*/
var FOCUS_REFETCH_RATE_LIMIT_SECONDS = 5;
function createSessionRefreshManager(opts) {
	const { fetchSession, shouldPollSession = () => true, sessionSignal, options = {} } = opts;
	const refetchInterval = options.sessionOptions?.refetchInterval ?? 0;
	const refetchOnWindowFocus = options.sessionOptions?.refetchOnWindowFocus ?? true;
	const refetchWhenOffline = options.sessionOptions?.refetchWhenOffline ?? false;
	const state = {
		isInitialized: false,
		lastSessionRequest: 0
	};
	const shouldRefetch = () => {
		return refetchWhenOffline || getGlobalOnlineManager().isOnline;
	};
	const triggerRefetch = (event) => {
		if (!shouldRefetch()) return;
		if (event?.event === "storage") {
			fetchSession();
			return;
		}
		if (event?.event === "poll") {
			state.lastSessionRequest = now();
			fetchSession();
			return;
		}
		if (event?.event === "visibilitychange") {
			if (now() - state.lastSessionRequest < FOCUS_REFETCH_RATE_LIMIT_SECONDS) return;
			state.lastSessionRequest = now();
			fetchSession();
			return;
		}
		fetchSession();
	};
	const broadcastSessionUpdate = (trigger) => {
		getGlobalBroadcastChannel().post({
			event: "session",
			data: { trigger },
			clientId: Math.random().toString(36).substring(7)
		});
	};
	const setupPolling = () => {
		if (refetchInterval && refetchInterval > 0) state.pollInterval = setInterval(() => {
			if (shouldPollSession()) triggerRefetch({ event: "poll" });
		}, refetchInterval * 1e3);
	};
	const setupBroadcast = () => {
		state.unsubscribeBroadcast = getGlobalBroadcastChannel().subscribe(() => {
			triggerRefetch({ event: "storage" });
		});
	};
	const setupFocusRefetch = () => {
		if (!refetchOnWindowFocus) return;
		state.unsubscribeFocus = getGlobalFocusManager().subscribe(() => {
			triggerRefetch({ event: "visibilitychange" });
		});
	};
	const setupOnlineRefetch = () => {
		state.unsubscribeOnline = getGlobalOnlineManager().subscribe((online) => {
			if (online) triggerRefetch({ event: "visibilitychange" });
		});
	};
	const setupSignalSubscription = () => {
		state.unsubscribeSignal = sessionSignal.listen(() => {
			fetchSession();
		});
	};
	const init = () => {
		if (state.isInitialized) return;
		state.isInitialized = true;
		setupPolling();
		setupBroadcast();
		setupFocusRefetch();
		setupOnlineRefetch();
		setupSignalSubscription();
		state.cleanupBroadcastSetup = getGlobalBroadcastChannel().setup();
		state.cleanupFocusSetup = getGlobalFocusManager().setup();
		state.cleanupOnlineSetup = getGlobalOnlineManager().setup();
	};
	const cleanup = () => {
		if (!state.isInitialized) return;
		if (state.pollInterval) {
			clearInterval(state.pollInterval);
			state.pollInterval = void 0;
		}
		if (state.unsubscribeBroadcast) {
			state.unsubscribeBroadcast();
			state.unsubscribeBroadcast = void 0;
		}
		if (state.unsubscribeFocus) {
			state.unsubscribeFocus();
			state.unsubscribeFocus = void 0;
		}
		if (state.unsubscribeOnline) {
			state.unsubscribeOnline();
			state.unsubscribeOnline = void 0;
		}
		if (state.unsubscribeSignal) {
			state.unsubscribeSignal();
			state.unsubscribeSignal = void 0;
		}
		if (state.cleanupBroadcastSetup) {
			state.cleanupBroadcastSetup();
			state.cleanupBroadcastSetup = void 0;
		}
		if (state.cleanupFocusSetup) {
			state.cleanupFocusSetup();
			state.cleanupFocusSetup = void 0;
		}
		if (state.cleanupOnlineSetup) {
			state.cleanupOnlineSetup();
			state.cleanupOnlineSetup = void 0;
		}
		state.isInitialized = false;
		state.lastSessionRequest = 0;
	};
	return {
		init,
		cleanup,
		triggerRefetch,
		broadcastSessionUpdate
	};
}
var isServer$1 = () => typeof window === "undefined";
var SESSION_MOUNT_DEDUPE_INTERVAL = STORE_UNMOUNT_DELAY;
function hydrateSessionAtom(sessionAtom, session) {
	if (typeof window === "undefined") return;
	const currentSession = sessionAtom.get();
	if (currentSession.data !== null || session === null) return;
	sessionAtom.set({
		...currentSession,
		data: session,
		error: null,
		isPending: false
	});
}
/**
* Normalize $fetch response: `throw: true` returns data directly,
* otherwise `{ data, error }`.
*/
function normalizeSessionResponse(res) {
	if (typeof res === "object" && res !== null && "data" in res && "error" in res) return res;
	return {
		data: res,
		error: null
	};
}
function normalizeSessionData(data) {
	if (!data) return null;
	if (data.session === null && data.user === null) return null;
	return data;
}
function isSessionAtomEqual(a, b) {
	return isJsonEqual(a.data, b.data) && a.error === b.error && a.isPending === b.isPending && a.isRefetching === b.isRefetching && a.refetch === b.refetch;
}
function getSessionAtom($fetch, options) {
	const $signal = /* @__PURE__ */ atom(false);
	let flight;
	let freshUntil = 0;
	let sessionRevision = 0;
	$signal.listen(() => {
		sessionRevision++;
		freshUntil = 0;
	});
	const refetch = (queryParams) => fetchSession(queryParams);
	const session = createAuthQueryAtom({
		data: null,
		error: null,
		isPending: true,
		isRefetching: false,
		refetch
	});
	withEquality(session, isSessionAtomEqual);
	const executeSessionFetch = async (signal, queryParams) => {
		const current = session.value;
		session.set({
			...current,
			isPending: current.data === null,
			isRefetching: true,
			error: null,
			refetch
		});
		if (signal.aborted) return "aborted";
		try {
			const res = await $fetch("/get-session", {
				method: "GET",
				query: queryParams?.query,
				signal
			});
			if (signal.aborted) return "aborted";
			let { data, error } = normalizeSessionResponse(res);
			let outcome = "fresh";
			if (data?.needsRefresh) try {
				const refreshRes = await $fetch("/get-session", {
					method: "POST",
					signal
				});
				if (signal.aborted) return "aborted";
				({data, error} = normalizeSessionResponse(refreshRes));
			} catch {
				if (signal.aborted) return "aborted";
				outcome = "stale";
			}
			if (error) {
				const latest = session.value;
				const isUnauthorized = error?.status === 401;
				session.set({
					data: isUnauthorized ? null : latest.data,
					error,
					isPending: false,
					isRefetching: false,
					refetch
				});
				return "failed";
			}
			const sessionData = normalizeSessionData(data);
			const current = session.value;
			const stableData = current.data != null && sessionData != null && isJsonEqual(current.data, sessionData) ? current.data : sessionData;
			session.set({
				data: stableData,
				error: null,
				isPending: false,
				isRefetching: false,
				refetch
			});
			return outcome;
		} catch (fetchError) {
			if (signal.aborted) return "aborted";
			const latest = session.value;
			session.set({
				data: latest.data,
				error: fetchError,
				isPending: false,
				isRefetching: false,
				refetch
			});
			return "failed";
		}
	};
	const getFreshUntil = () => {
		const expiresAt = session.value.data?.session?.expiresAt;
		const sessionExpiresAt = expiresAt instanceof Date ? expiresAt.getTime() : Number.POSITIVE_INFINITY;
		return Math.min(Date.now() + SESSION_MOUNT_DEDUPE_INTERVAL, sessionExpiresAt);
	};
	const fetchSession = (queryParams) => {
		freshUntil = 0;
		flight?.cancel();
		const controller = new AbortController();
		const request = {
			cancel: () => controller.abort(),
			promise: Promise.resolve().then(() => {
				if (controller.signal.aborted) return "aborted";
				return executeSessionFetch(controller.signal, queryParams);
			}),
			revision: sessionRevision
		};
		flight = request;
		const settleFlight = (outcome) => {
			if (flight !== request) return;
			flight = void 0;
			if (outcome === "fresh" && request.revision === sessionRevision) freshUntil = getFreshUntil();
		};
		request.promise.then(settleFlight, () => settleFlight("failed"));
		return request.promise.then(() => void 0);
	};
	const fetchSessionOnMount = () => {
		if (flight?.revision === sessionRevision) return flight.promise.then(() => void 0);
		if (Date.now() < freshUntil) return Promise.resolve();
		return fetchSession();
	};
	let broadcastSessionUpdate = () => {};
	onMount(session, () => {
		let timeoutId;
		if (!isServer$1()) timeoutId = setTimeout(() => {
			fetchSessionOnMount();
		}, 0);
		const refreshManager = createSessionRefreshManager({
			fetchSession,
			shouldPollSession: () => session.value.data != null,
			sessionSignal: $signal,
			options
		});
		refreshManager.init();
		broadcastSessionUpdate = refreshManager.broadcastSessionUpdate;
		return () => {
			if (timeoutId) clearTimeout(timeoutId);
			refreshManager.cleanup();
		};
	});
	return {
		session,
		$sessionSignal: $signal,
		broadcastSessionUpdate: (trigger) => broadcastSessionUpdate(trigger)
	};
}
var resolvePublicAuthUrl = (basePath) => {
	if (typeof process === "undefined") return void 0;
	const path = basePath ?? "/api/auth";
	if (process.env.NEXT_PUBLIC_AUTH_URL) return process.env.NEXT_PUBLIC_AUTH_URL;
	if (typeof window === "undefined") {
		if (process.env.NEXTAUTH_URL) try {
			return process.env.NEXTAUTH_URL;
		} catch {}
		if (process.env.VERCEL_URL) try {
			const protocol = process.env.VERCEL_URL.startsWith("http") ? "" : "https://";
			return `${new URL(`${protocol}${process.env.VERCEL_URL}`).origin}${path}`;
		} catch {}
	}
};
var matchesSessionSignal = (path) => path === "/sign-out" || path === "/update-user" || path === "/update-session" || path === "/sign-up/email" || path === "/sign-in/email" || path === "/delete-user" || path === "/verify-email" || path === "/revoke-sessions" || path === "/revoke-session" || path === "/revoke-other-sessions" || path === "/change-email" || path === "/change-password";
var getClientConfig = (options, loadEnv) => {
	const isCredentialsSupported = "credentials" in Request.prototype;
	const baseURL = getBaseURL(options?.baseURL, options?.basePath, void 0, loadEnv) ?? resolvePublicAuthUrl(options?.basePath) ?? "/api/auth";
	const pluginsFetchPlugins = options?.plugins?.flatMap((plugin) => plugin.fetchPlugins).filter((pl) => pl !== void 0) || [];
	const lifeCyclePlugin = {
		id: "lifecycle-hooks",
		name: "lifecycle-hooks",
		hooks: {
			onSuccess: options?.fetchOptions?.onSuccess,
			onError: options?.fetchOptions?.onError,
			onRequest: options?.fetchOptions?.onRequest,
			onResponse: options?.fetchOptions?.onResponse
		}
	};
	const { onSuccess: _onSuccess, onError: _onError, onRequest: _onRequest, onResponse: _onResponse, ...restOfFetchOptions } = options?.fetchOptions || {};
	const $fetch = createFetch({
		baseURL,
		...isCredentialsSupported ? { credentials: "include" } : {},
		method: "GET",
		jsonParser(text) {
			if (!text) return null;
			return parseJSON(text, { strict: false });
		},
		customFetchImpl: fetch,
		...restOfFetchOptions,
		plugins: [
			lifeCyclePlugin,
			...restOfFetchOptions.plugins || [],
			...options?.disableDefaultFetchPlugins ? [] : [redirectPlugin],
			...pluginsFetchPlugins
		]
	});
	const { $sessionSignal, session, broadcastSessionUpdate } = getSessionAtom($fetch, options);
	let hasHydrated = false;
	const hydrateSession = (sessionData) => {
		if (hasHydrated || sessionData === null) return;
		hasHydrated = true;
		hydrateSessionAtom(session, sessionData);
	};
	const plugins = options?.plugins || [];
	let pluginsActions = {};
	const pluginsAtoms = {
		$sessionSignal,
		session
	};
	const pluginPathMethods = {
		"/sign-out": "POST",
		"/revoke-sessions": "POST",
		"/revoke-other-sessions": "POST",
		"/delete-user": "POST"
	};
	const atomListeners = [{
		signal: "$sessionSignal",
		matcher: matchesSessionSignal,
		callback(path) {
			if (path === "/sign-out") broadcastSessionUpdate("signout");
			else if (path === "/update-user" || path === "/update-session") broadcastSessionUpdate("updateUser");
		}
	}];
	for (const plugin of plugins) {
		if (plugin.getAtoms) Object.assign(pluginsAtoms, plugin.getAtoms?.($fetch));
		if (plugin.pathMethods) Object.assign(pluginPathMethods, plugin.pathMethods);
		if (plugin.atomListeners) atomListeners.push(...plugin.atomListeners);
	}
	const $store = {
		notify: (signal) => {
			pluginsAtoms[signal].set(!pluginsAtoms[signal].get());
		},
		listen: (signal, listener) => {
			pluginsAtoms[signal].subscribe(listener);
		},
		atoms: pluginsAtoms
	};
	for (const plugin of plugins) if (plugin.getActions) pluginsActions = defu(plugin.getActions?.($fetch, $store, options) ?? {}, pluginsActions);
	return {
		get baseURL() {
			return baseURL;
		},
		pluginsActions,
		pluginsAtoms,
		pluginPathMethods,
		atomListeners,
		hydrateSession,
		$sessionSignal,
		$fetch,
		$store
	};
};
function isAtom(value) {
	return typeof value === "object" && value !== null && "get" in value && typeof value.get === "function" && "lc" in value && typeof value.lc === "number";
}
function getMethod(path, knownPathMethods, args) {
	const method = knownPathMethods[path];
	const { fetchOptions, query: _query, ...body } = args || {};
	if (method) return method;
	if (fetchOptions?.method) return fetchOptions.method;
	if (body && Object.keys(body).length > 0) return "POST";
	return "GET";
}
function createDynamicPathProxy(routes, client, knownPathMethods, atoms, atomListeners) {
	function createProxy(path = []) {
		return new Proxy(function() {}, {
			get(_, prop) {
				if (typeof prop !== "string") return;
				if (prop === "then" || prop === "catch" || prop === "finally") return;
				const fullPath = [...path, prop];
				let current = routes;
				for (const segment of fullPath) if (current && typeof current === "object" && segment in current) current = current[segment];
				else {
					current = void 0;
					break;
				}
				if (typeof current === "function") return current;
				if (isAtom(current)) return current;
				return createProxy(fullPath);
			},
			apply: async (_, __, args) => {
				const routePath = "/" + path.map(toKebabCase).join("/");
				const arg = args[0] || {};
				const fetchOptions = args[1] || {};
				const { query, fetchOptions: argFetchOptions, ...body } = arg;
				const options = {
					...fetchOptions,
					...argFetchOptions
				};
				const method = getMethod(routePath, knownPathMethods, arg);
				return await client(routePath, {
					...options,
					body: method === "GET" ? void 0 : {
						...body,
						...options?.body || {}
					},
					query: query || options?.query,
					method,
					async onSuccess(context) {
						await options?.onSuccess?.(context);
						if (!atomListeners || options.disableSignal) return;
						/**
						* We trigger listeners
						*/
						const matches = atomListeners.filter((s) => s.matcher(routePath));
						if (!matches.length) return;
						const visited = /* @__PURE__ */ new Set();
						for (const match of matches) {
							const signal = atoms[match.signal];
							if (!signal) return;
							if (visited.has(match.signal)) continue;
							visited.add(match.signal);
							/**
							* To avoid race conditions we set the signal in a setTimeout
							*/
							const val = signal.get();
							setTimeout(() => {
								signal.set(!val);
							}, 10);
							match.callback?.(routePath);
						}
					}
				});
			}
		});
	}
	return createProxy();
}
/**
* Subscribe to store changes and get store's value.
*
* Can be used with store builder too.
*
* ```js
* import { useStore } from 'nanostores/react'
*
* import { router } from '../store/router'
*
* export const Layout = () => {
*   let page = useStore(router)
*   if (page.route === 'home') {
*     return <HomePage />
*   } else {
*     return <Error404 />
*   }
* }
* ```
*
* @param store Store instance.
* @returns Store value.
*/
function useStore(store, options = {}) {
	const snapshotRef = (0, import_react.useRef)(store.get());
	const { keys, deps = [store, keys] } = options;
	const subscribe = (0, import_react.useCallback)((onChange) => {
		const emitChange = (value) => {
			if (snapshotRef.current === value) return;
			snapshotRef.current = value;
			onChange();
		};
		emitChange(store.value);
		if (keys?.length) return listenKeys(store, keys, emitChange);
		return store.listen(emitChange);
	}, deps);
	const get = () => snapshotRef.current;
	return (0, import_react.useSyncExternalStore)(subscribe, get, isAuthQueryStore(store) ? () => store.init : get);
}
function getAtomKey(str) {
	return `use${capitalizeFirstLetter(str)}`;
}
function createAuthClient(options) {
	const { pluginPathMethods, pluginsActions, pluginsAtoms, hydrateSession, $fetch, $store, atomListeners } = getClientConfig(options);
	const resolvedHooks = {};
	for (const [key, value] of Object.entries(pluginsAtoms)) resolvedHooks[getAtomKey(key)] = () => useStore(value);
	return createDynamicPathProxy({
		...pluginsActions,
		...resolvedHooks,
		hydrateSession,
		$fetch,
		$store
	}, $fetch, pluginPathMethods, pluginsAtoms, atomListeners);
}
var emailOTPClient = () => {
	return {
		id: "email-otp",
		version: PACKAGE_VERSION,
		$InferServerPlugin: {},
		atomListeners: [{
			matcher: (path) => path === "/email-otp/verify-email" || path === "/sign-in/email-otp" || path === "/email-otp/request-email-change",
			signal: "$sessionSignal"
		}],
		$ERROR_CODES: EMAIL_OTP_ERROR_CODES
	};
};
var magicLinkClient = () => {
	return {
		id: "magic-link",
		version: PACKAGE_VERSION,
		$InferServerPlugin: {}
	};
};
var isServer = () => typeof window === "undefined";
function isAuthQueryStateEqual(a, b) {
	return isJsonEqual(a.data, b.data) && a.error === b.error && a.isPending === b.isPending && a.isRefetching === b.isRefetching && a.refetch === b.refetch;
}
var useAuthQuery = (initializedAtom, path, $fetch, options) => {
	const value = createAuthQueryAtom({
		data: null,
		error: null,
		isPending: true,
		isRefetching: false,
		refetch: (queryParams) => fn(queryParams)
	});
	onMount(value, () => withEquality(value, isAuthQueryStateEqual));
	let latestRequestId = 0;
	const fn = async (queryParams) => {
		const requestId = ++latestRequestId;
		return new Promise((resolve) => {
			const opts = typeof options === "function" ? options({
				data: value.get().data,
				error: value.get().error,
				isPending: value.get().isPending
			}) : options;
			$fetch(path, {
				...opts,
				query: {
					...opts?.query,
					...queryParams?.query
				},
				async onSuccess(context) {
					if (requestId === latestRequestId) {
						const current = value.get();
						const stableData = current.data != null && context.data != null && isJsonEqual(current.data, context.data) ? current.data : context.data;
						value.set({
							data: stableData,
							error: null,
							isPending: false,
							isRefetching: false,
							refetch: value.value.refetch
						});
					}
					await opts?.onSuccess?.(context);
				},
				async onError(context) {
					const { request } = context;
					const retryAttempts = typeof request.retry === "number" ? request.retry : request.retry?.attempts;
					const retryAttempt = request.retryAttempt || 0;
					if (retryAttempts && retryAttempt < retryAttempts) return;
					if (requestId === latestRequestId) {
						const isUnauthorized = context.error.status === 401;
						value.set({
							error: context.error,
							data: isUnauthorized ? null : value.get().data,
							isPending: false,
							isRefetching: false,
							refetch: value.value.refetch
						});
					}
					await opts?.onError?.(context);
				},
				async onRequest(context) {
					if (requestId === latestRequestId) {
						const currentValue = value.get();
						value.set({
							isPending: currentValue.data === null,
							data: currentValue.data,
							error: null,
							isRefetching: true,
							refetch: value.value.refetch
						});
					}
					await opts?.onRequest?.(context);
				}
			}).catch((error) => {
				if (requestId !== latestRequestId) return;
				value.set({
					error,
					data: value.get().data,
					isPending: false,
					isRefetching: false,
					refetch: value.value.refetch
				});
			}).finally(() => {
				resolve(void 0);
			});
		});
	};
	initializedAtom = Array.isArray(initializedAtom) ? initializedAtom : [initializedAtom];
	let isMountFetchPending = false;
	let isMounted = false;
	let shouldRefetchAfterPending = false;
	const fetchOnMount = () => {
		if (isMountFetchPending) {
			shouldRefetchAfterPending = true;
			return;
		}
		isMountFetchPending = true;
		fn().finally(() => {
			isMountFetchPending = false;
			const shouldRefetch = shouldRefetchAfterPending && isMounted;
			shouldRefetchAfterPending = false;
			if (shouldRefetch) fetchOnMount();
		});
	};
	onMount(value, () => {
		if (isServer()) return;
		isMounted = true;
		let isInitialized = false;
		let timeoutId;
		const cleanups = initializedAtom.map((initAtom) => initAtom.listen(() => {
			if (isInitialized) fn();
			else {
				isInitialized = true;
				clearTimeout(timeoutId);
				fetchOnMount();
			}
		}));
		timeoutId = setTimeout(() => {
			isInitialized = true;
			fetchOnMount();
		}, 0);
		return () => {
			isMounted = false;
			for (const cleanup of cleanups) cleanup();
			clearTimeout(timeoutId);
		};
	});
	return value;
};
/**
* Using the same `hasPermissionFn` function, but without the need for a `ctx` parameter or the `organizationId` parameter.
*/
var clientSideHasPermission = (input) => {
	return hasPermissionFn(input, input.options.roles || defaultRoles$1);
};
var organizationClient = (options) => {
	const $listOrg = /* @__PURE__ */ atom(false);
	const $activeOrgSignal = /* @__PURE__ */ atom(false);
	const $activeMemberSignal = /* @__PURE__ */ atom(false);
	const $activeMemberRoleSignal = /* @__PURE__ */ atom(false);
	const roles = {
		admin: adminAc,
		member: memberAc,
		owner: ownerAc,
		...options?.roles
	};
	return {
		id: "organization",
		version: PACKAGE_VERSION,
		$InferServerPlugin: {},
		getActions: ($fetch, _$store, co) => ({
			$Infer: {
				ActiveOrganization: {},
				Organization: {},
				Invitation: {},
				Member: {},
				Team: {}
			},
			organization: { checkRolePermission: (data) => {
				return clientSideHasPermission({
					role: data.role,
					options: {
						ac: options?.ac,
						roles
					},
					permissions: data.permissions
				});
			} }
		}),
		getAtoms: ($fetch) => {
			const listOrganizations = useAuthQuery($listOrg, "/organization/list", $fetch, { method: "GET" });
			return {
				$listOrg,
				$activeOrgSignal,
				$activeMemberSignal,
				$activeMemberRoleSignal,
				activeOrganization: useAuthQuery([$activeOrgSignal], "/organization/get-full-organization", $fetch, () => ({ method: "GET" })),
				listOrganizations,
				activeMember: useAuthQuery([$activeOrgSignal, $activeMemberSignal], "/organization/get-active-member", $fetch, { method: "GET" }),
				activeMemberRole: useAuthQuery([$activeOrgSignal, $activeMemberRoleSignal], "/organization/get-active-member-role", $fetch, { method: "GET" })
			};
		},
		pathMethods: {
			"/organization/get-full-organization": "GET",
			"/organization/list-user-teams": "GET"
		},
		atomListeners: [
			{
				matcher(path) {
					return path === "/organization/create" || path === "/organization/delete" || path === "/organization/update";
				},
				signal: "$listOrg"
			},
			{
				matcher(path) {
					return matchesSessionSignal(path) || path.startsWith("/organization");
				},
				signal: "$activeOrgSignal"
			},
			{
				matcher(path) {
					return path.startsWith("/organization/set-active") || path === "/organization/create" || path === "/organization/delete" || path === "/organization/remove-member" || path === "/organization/leave" || path === "/organization/accept-invitation";
				},
				signal: "$sessionSignal"
			},
			{
				matcher(path) {
					return path.includes("/organization/update-member-role") || path.startsWith("/organization/set-active");
				},
				signal: "$activeMemberSignal"
			},
			{
				matcher(path) {
					return path.includes("/organization/update-member-role") || path.startsWith("/organization/set-active");
				},
				signal: "$activeMemberRoleSignal"
			}
		],
		$ERROR_CODES: ORGANIZATION_ERROR_CODES
	};
};
var authClient = createAuthClient({ plugins: [
	emailOTPClient(),
	magicLinkClient(),
	organizationClient({
		teams: { enabled: true },
		schema: { organization: { additionalFields: { workspaceType: {
			type: "string",
			required: true,
			defaultValue: "personal",
			input: false
		} } } }
	})
] });
var buttonVariants = cva("group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/80",
			outline: "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
			secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
			ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
			destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
			sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
			lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			icon: "size-8",
			"icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
			"icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
			"icon-lg": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button$1({ className, variant = "default", size = "default", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		"data-slot": "button",
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function Input$1({ className, type, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
		type,
		"data-slot": "input",
		className: cn("h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", className),
		...props
	});
}
function TooltipProvider({ delay = 0, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider$1, {
		"data-slot": "tooltip-provider",
		delay,
		...props
	});
}
function Tooltip$1({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipRoot, {
		"data-slot": "tooltip",
		...props
	});
}
function TooltipTrigger({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger$1, {
		"data-slot": "tooltip-trigger",
		...props
	});
}
function TooltipContent({ className, side = "top", sideOffset = 4, align = "center", alignOffset = 0, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipPositioner, {
		align,
		alignOffset,
		side,
		sideOffset,
		className: "isolate z-50",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipPopup, {
			"data-slot": "tooltip-content",
			className: cn("z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
			...props,
			children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipArrow, { className: "z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" })]
		})
	}) });
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/badge-7-E6RaaD.js
function Card({ className, size = "default", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "card",
		"data-size": size,
		className: cn("group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl", className),
		...props
	});
}
function CardHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "card-header",
		className: cn("group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)", className),
		...props
	});
}
function CardTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "card-title",
		className: cn("font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm", className),
		...props
	});
}
function CardDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "card-description",
		className: cn("text-sm text-muted-foreground", className),
		...props
	});
}
function CardAction({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "card-action",
		className: cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className),
		...props
	});
}
function CardContent({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "card-content",
		className: cn("px-(--card-spacing)", className),
		...props
	});
}
var badgeVariants = cva("group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!", {
	variants: { variant: {
		default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
		secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
		destructive: "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
		outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
		ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
		link: "text-primary underline-offset-4 hover:underline"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant = "default", render, ...props }) {
	return useRender({
		defaultTagName: "span",
		props: mergeProps({ className: cn(badgeVariants({ variant }), className) }, props),
		render,
		state: {
			slot: "badge",
			variant
		}
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/checkbox-B2uzvFOi.js
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		"data-slot": "label",
		className: cn("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50", className),
		...props
	});
}
function Checkbox$1({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxRoot, {
		"data-slot": "checkbox",
		className: cn("peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground group-has-[:focus-visible]/field-label:data-checked:border-primary dark:data-checked:bg-primary", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
			"data-slot": "checkbox-indicator",
			className: "grid place-content-center text-current transition-none [&>svg]:size-3.5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {})
		})
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/createSsrRpc-DdzRRl-m.js
function Separator$1({ className, orientation = "horizontal", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {
		"data-slot": "separator",
		orientation,
		className: cn("shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch", className),
		...props
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/workspace.handlers-CCbiMIOv.js
var CreateWorkspaceInputSchema = object({
	eventName: string().trim().min(2).max(120),
	startsAt: datetime(),
	endsAt: datetime().optional(),
	isAllDay: boolean().default(false),
	timeZone: string().trim().min(1).max(100),
	locationName: string().trim().max(160).optional(),
	locationAddress: string().trim().max(500).optional(),
	budgetCap: string().trim().regex(/^\d+(?:\.\d{1,2})?$/).optional()
}).refine((value) => !value.endsAt || new Date(value.endsAt) >= new Date(value.startsAt), {
	message: "The event end must be after its start.",
	path: ["endsAt"]
});
var ensurePersonalWorkspace = createServerFn({ method: "GET" }).middleware([requireSessionMiddleware]).handler(createSsrRpc("0f444619df00ce59304dff2c1a3a5f9ad15c1d4aca70b224159cf0398f9a4640"));
var createWorkspace = createServerFn({ method: "POST" }).middleware([requireSessionMiddleware]).validator(CreateWorkspaceInputSchema).handler(createSsrRpc("32887a17f4d4edaba479ed42a689f75cee09e3a8940db35488dff7996f08564b"));
var ResolveWorkspaceInputSchema = object({ slug: string().trim().min(1).max(160) });
var resolveWorkspace = createServerFn({ method: "GET" }).middleware([requireSessionMiddleware]).validator(ResolveWorkspaceInputSchema).handler(createSsrRpc("1888708c164f08e135af180def1b4b9b4b4098e34201b5b48b60b5e524b2a441"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-Dz7FCRyI.js
if (typeof window !== "undefined" && "phc_xxx") _c.init("phc_xxx", {
	api_host: "https://us.i.posthog.com",
	person_profiles: "identified_only",
	capture_pageview: false,
	defaults: "2025-11-30"
});
function PostHogProvider$1({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PostHogProvider, {
		client: _c,
		children
	});
}
var styles_default = "/assets/styles-aEJFWUpZ.css";
function ErrorToaster() {
	const { localization } = D();
	const queryClient = useQueryClient();
	(0, import_react.useEffect)(() => {
		const queryCache = queryClient.getQueryCache();
		const previousQueryOnError = queryCache.config.onError;
		queryCache.config.onError = (error, query) => {
			previousQueryOnError?.(error, query);
			if (!matchQuery({ queryKey: e.all }, query)) return;
			if (Ce(query.meta) !== "toast") return;
			if (x(error) === "EMAIL_NOT_VERIFIED") return;
			const message = Se(error, localization);
			if (message) {
				console.error("[Better Auth UI]", error);
				toast.error(message);
			}
		};
		const mutationCache = queryClient.getMutationCache();
		const previousMutationOnError = mutationCache.config.onError;
		mutationCache.config.onError = (error, variables, onMutateResult, mutation, context) => {
			previousMutationOnError?.(error, variables, onMutateResult, mutation, context);
			if (!matchMutation({ mutationKey: e$1.all }, mutation)) return;
			if (Ce(mutation.meta) !== "toast") return;
			if (Ye(error)) return;
			if (x(error) === "EMAIL_NOT_VERIFIED" && !matchMutation({ mutationKey: e$2.prompt }, mutation)) return;
			const message = Se(error, localization, mutation.options.mutationKey);
			if (message) {
				console.error("[Better Auth UI]", error);
				toast.error(message);
			}
		};
		return () => {
			queryCache.config.onError = previousQueryOnError;
			mutationCache.config.onError = previousMutationOnError;
		};
	}, [queryClient, localization]);
	return null;
}
/**
* Provides an authentication context by rendering an auth provider with the sonner toast handler injected, forwarding remaining configuration and rendering `children` inside it.
*
* @param children - React nodes to render inside the authentication provider
* @returns A React element that renders an authentication provider configured with the provided props and toast handler
*/
function AuthProvider$1({ children, ...config }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(E, {
		...config,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorToaster, {})]
	});
}
var Toaster$1 = ({ ...props }) => {
	const { theme = "system" } = z();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		theme,
		className: "toaster group",
		icons: {
			success: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }),
			info: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-4" }),
			warning: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4" }),
			error: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OctagonX, { className: "size-4" }),
			loading: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" })
		},
		style: {
			"--normal-bg": "var(--popover)",
			"--normal-text": "var(--popover-foreground)",
			"--normal-border": "var(--border)",
			"--border-radius": "var(--radius)"
		},
		toastOptions: { classNames: { toast: "cn-toast" } },
		...props
	});
};
function EmailOtpButton({ view }) {
	const { basePaths, emailAndPassword, localization, redirectTo, viewPaths, Link } = D();
	const { localization: emailOtpLocalization, viewPaths: emailOtpViewPaths } = t(emailOtpPlugin$1);
	const isPending = useIsMutating({ mutationKey: e$1.signIn.all }) + useIsMutating({ mutationKey: e$1.signUp.all }) > 0;
	const isEmailOtpView = view === "emailOtp";
	if (isEmailOtpView && !emailAndPassword?.enabled) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		href: De(`${basePaths.auth}/${isEmailOtpView ? viewPaths.auth.signIn : emailOtpViewPaths.auth.emailOtp}`, redirectTo),
		"aria-disabled": isPending || void 0,
		tabIndex: isPending ? -1 : void 0,
		onClick: (event) => {
			if (isPending) event.preventDefault();
		},
		className: cn(buttonVariants({ variant: "outline" }), "w-full", isPending && "opacity-50 pointer-events-none"),
		children: [isEmailOtpView ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {}), localization.auth.continueWith.replace("{{provider}}", isEmailOtpView ? localization.auth.password : emailOtpLocalization.emailOtp)]
	});
}
function FieldGroup({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "field-group",
		className: cn("group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4", className),
		...props
	});
}
var fieldVariants = cva("group/field flex w-full gap-2 data-[invalid=true]:text-destructive", {
	variants: { orientation: {
		vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
		horizontal: "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
		responsive: "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px"
	} },
	defaultVariants: { orientation: "vertical" }
});
function Field({ className, orientation = "vertical", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "group",
		"data-slot": "field",
		"data-orientation": orientation,
		className: cn(fieldVariants({ orientation }), className),
		...props
	});
}
function FieldContent({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "field-content",
		className: cn("group/field-content flex flex-1 flex-col gap-0.5 leading-snug", className),
		...props
	});
}
function FieldLabel({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
		"data-slot": "field-label",
		className: cn("group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 *:data-[slot=field]:p-2.5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10", "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col", className),
		...props
	});
}
function FieldDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		"data-slot": "field-description",
		className: cn("text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5", "last:mt-0 nth-last-2:-mt-1", "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary", className),
		...props
	});
}
function FieldSeparator({ children, className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-slot": "field-separator",
		"data-content": !!children,
		className: cn("relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator$1, { className: "absolute inset-0 top-1/2" }), children && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "relative mx-auto block w-fit bg-background px-2 text-muted-foreground",
			"data-slot": "field-separator-content",
			children
		})]
	});
}
function FieldError({ className, children, errors, ...props }) {
	const content = (0, import_react.useMemo)(() => {
		if (children) return children;
		if (!errors?.length) return null;
		const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];
		if (uniqueErrors?.length == 1) return uniqueErrors[0]?.message;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "ml-4 flex list-disc flex-col gap-1",
			children: uniqueErrors.map((error, index) => error?.message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: error.message }, index))
		});
	}, [children, errors]);
	if (!content) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "alert",
		"data-slot": "field-error",
		className: cn("text-sm font-normal text-destructive", className),
		...props,
		children: content
	});
}
function useResendCooldown(initialSeconds = 0) {
	const [cooldown, setCooldown] = (0, import_react.useState)(initialSeconds);
	(0, import_react.useEffect)(() => {
		if (cooldown <= 0) return;
		const interval = setInterval(() => {
			setCooldown((current) => current > 0 ? current - 1 : 0);
		}, 1e3);
		return () => clearInterval(interval);
	}, [cooldown]);
	const startCooldown = (0, import_react.useCallback)((seconds = 60) => setCooldown(seconds), []);
	return {
		cooldown,
		isCoolingDown: cooldown > 0,
		startCooldown
	};
}
var TWO_FACTOR_METHODS = ["totp", "otp"];
/** Auth plugin id used by Better Auth UI's two-factor integration. */
var TWO_FACTOR_PLUGIN_ID = "twoFactor";
/**
* `sessionStorage` key holding the methods reported by the sign-in response.
*
* Only the non-sensitive method names are stored, never a code, token, or the
* two-factor cookie, which stays HTTP-only.
*/
var TWO_FACTOR_METHODS_STORAGE_KEY = "better-auth-ui.two-factor-methods";
/** Detect the redirect payload Better Auth returns before a second factor. */
function isTwoFactorRedirect(data) {
	return typeof data === "object" && data !== null && data.twoFactorRedirect === true;
}
/** Narrow arbitrary method names to the challenge views this UI supports. */
function parseTwoFactorMethods(methods) {
	if (!Array.isArray(methods)) return [];
	return TWO_FACTOR_METHODS.filter((method) => methods.includes(method));
}
/** Persist the enabled method names without blocking sign-in on storage errors. */
function storeTwoFactorMethods(methods) {
	if (typeof sessionStorage === "undefined") return;
	try {
		sessionStorage.setItem(TWO_FACTOR_METHODS_STORAGE_KEY, JSON.stringify(parseTwoFactorMethods(methods)));
	} catch {}
}
/**
* Resolve what happens after a sign-in request succeeds.
*
* Better Auth withholds the session when a second factor is required and
* answers with `{ twoFactorRedirect: true, twoFactorMethods }` instead, so no
* sign-in strategy may navigate to `redirectTo` unconditionally. This hook is
* the single place that decision lives — every password-based form calls it
* from `onSuccess`.
*
* The enabled methods are stashed in session storage (names only, never a
* code or token) and `redirectTo` rides along in the query string so the
* challenge view can finish the original navigation.
*
* The two-factor plugin is looked up by its stable id, so sign-in forms stay
* installable without either the two-factor components or a matching release
* of `@better-auth-ui/core`.
*
* @returns A callback taking the resolved data of a sign-in mutation.
*/
function useSignInContinuation() {
	const { basePaths, navigate, plugins, redirectTo } = D();
	const twoFactorPath = plugins.find((plugin) => plugin.id === TWO_FACTOR_PLUGIN_ID)?.viewPaths?.auth?.twoFactor;
	return (0, import_react.useCallback)((data) => {
		if (twoFactorPath && isTwoFactorRedirect(data)) {
			storeTwoFactorMethods(data.twoFactorMethods);
			navigate({ to: `${basePaths.auth}/${twoFactorPath}?redirectTo=${encodeURIComponent(redirectTo)}` });
			return;
		}
		navigate({ to: redirectTo });
	}, [
		basePaths.auth,
		navigate,
		redirectTo,
		twoFactorPath
	]);
}
function Spinner({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
		"data-slot": "spinner",
		role: "status",
		"aria-label": "Loading",
		className: cn("size-4 animate-spin", className),
		...props
	});
}
function Calendar({ className, classNames, showOutsideDays = true, captionLayout = "label", buttonVariant = "ghost", locale, formatters, components, ...props }) {
	const defaultClassNames = getDefaultClassNames();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayPicker, {
		showOutsideDays,
		className: cn("group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent", String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`, String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`, className),
		captionLayout,
		locale,
		formatters: {
			formatMonthDropdown: (date) => date.toLocaleString(locale?.code, { month: "short" }),
			...formatters
		},
		classNames: {
			root: cn("w-fit", defaultClassNames.root),
			months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
			month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
			nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", defaultClassNames.nav),
			button_previous: cn(buttonVariants({ variant: buttonVariant }), "size-(--cell-size) p-0 select-none aria-disabled:opacity-50", defaultClassNames.button_previous),
			button_next: cn(buttonVariants({ variant: buttonVariant }), "size-(--cell-size) p-0 select-none aria-disabled:opacity-50", defaultClassNames.button_next),
			month_caption: cn("flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)", defaultClassNames.month_caption),
			dropdowns: cn("flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium", defaultClassNames.dropdowns),
			dropdown_root: cn("relative rounded-(--cell-radius)", defaultClassNames.dropdown_root),
			dropdown: cn("absolute inset-0 bg-popover opacity-0", defaultClassNames.dropdown),
			caption_label: cn("font-medium select-none", captionLayout === "label" ? "text-sm" : "flex items-center gap-1 rounded-(--cell-radius) text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground", defaultClassNames.caption_label),
			month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
			weekdays: cn("flex", defaultClassNames.weekdays),
			weekday: cn("flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none", defaultClassNames.weekday),
			week: cn("mt-2 flex w-full", defaultClassNames.week),
			week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
			week_number: cn("text-[0.8rem] text-muted-foreground select-none", defaultClassNames.week_number),
			day: cn("group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)", props.showWeekNumber ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)" : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)", defaultClassNames.day),
			range_start: cn("relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted", defaultClassNames.range_start),
			range_middle: cn("rounded-none", defaultClassNames.range_middle),
			range_end: cn("relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted", defaultClassNames.range_end),
			today: cn("rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none", defaultClassNames.today),
			outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
			disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
			hidden: cn("invisible", defaultClassNames.hidden),
			...classNames
		},
		components: {
			Root: ({ className, rootRef, ...props }) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-slot": "calendar",
					ref: rootRef,
					className: cn(className),
					...props
				});
			},
			Chevron: ({ className, orientation, ...props }) => {
				if (orientation === "left") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
					className: cn("size-4", className),
					...props
				});
				if (orientation === "right") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
					className: cn("size-4", className),
					...props
				});
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
					className: cn("size-4", className),
					...props
				});
			},
			DayButton: ({ ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDayButton, {
				locale,
				...props
			}),
			WeekNumber: ({ children, ...props }) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					...props,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex size-(--cell-size) items-center justify-center text-center",
						children
					})
				});
			},
			...components
		},
		...props
	});
}
function CalendarDayButton({ className, day, modifiers, locale, ...props }) {
	const defaultClassNames = getDefaultClassNames();
	const ref = import_react.useRef(null);
	import_react.useEffect(() => {
		if (modifiers.focused) ref.current?.focus();
	}, [modifiers.focused]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, {
		variant: "ghost",
		size: "icon",
		"data-day": day.date.toLocaleDateString(locale?.code),
		"data-selected-single": modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle,
		"data-range-start": modifiers.range_start,
		"data-range-end": modifiers.range_end,
		"data-range-middle": modifiers.range_middle,
		className: cn("relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70", defaultClassNames.day, className),
		...props
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		"data-slot": "textarea",
		className: cn("flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", className),
		...props
	});
}
function InputGroup({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "input-group",
		role: "group",
		className: cn("group/input-group relative flex h-8 w-full min-w-0 items-center rounded-lg border border-input transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:bg-input/50 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:bg-input/30 dark:has-disabled:bg-input/80 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5", className),
		...props
	});
}
var inputGroupAddonVariants = cva("flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4", {
	variants: { align: {
		"inline-start": "order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
		"inline-end": "order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
		"block-start": "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
		"block-end": "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2"
	} },
	defaultVariants: { align: "inline-start" }
});
function InputGroupAddon({ className, align = "inline-start", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "group",
		"data-slot": "input-group-addon",
		"data-align": align,
		className: cn(inputGroupAddonVariants({ align }), className),
		onClick: (e) => {
			if (e.target.closest("button")) return;
			e.currentTarget.parentElement?.querySelector("input")?.focus();
		},
		...props
	});
}
var inputGroupButtonVariants = cva("flex items-center gap-2 text-sm shadow-none", {
	variants: { size: {
		xs: "h-6 gap-1 rounded-[calc(var(--radius)-3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
		sm: "",
		"icon-xs": "size-6 rounded-[calc(var(--radius)-3px)] p-0 has-[>svg]:p-0",
		"icon-sm": "size-8 p-0 has-[>svg]:p-0"
	} },
	defaultVariants: { size: "xs" }
});
function InputGroupButton({ className, type = "button", variant = "ghost", size = "xs", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, {
		type,
		"data-size": size,
		variant,
		className: cn(inputGroupButtonVariants({ size }), className),
		...props
	});
}
function InputGroupInput({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
		"data-slot": "input-group-control",
		className: cn("flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent", className),
		...props
	});
}
var Combobox$1 = ComboboxRoot;
function ComboboxTrigger({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComboboxTrigger$1, {
		"data-slot": "combobox-trigger",
		className: cn("[&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "pointer-events-none size-4 text-muted-foreground" })]
	});
}
function ComboboxClear({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxClear$1, {
		"data-slot": "combobox-clear",
		render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupButton, {
			variant: "ghost",
			size: "icon-xs"
		}),
		className: cn(className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "pointer-events-none" })
	});
}
function ComboboxInput({ className, children, disabled = false, showTrigger = true, showClear = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputGroup, {
		className: cn("w-auto", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxInput$1, {
				render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupInput, { disabled }),
				...props
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputGroupAddon, {
				align: "inline-end",
				children: [showTrigger && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupButton, {
					size: "icon-xs",
					variant: "ghost",
					render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxTrigger, {}),
					"data-slot": "input-group-button",
					className: "group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent",
					disabled
				}), showClear && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxClear, { disabled })]
			}),
			children
		]
	});
}
function ComboboxContent({ className, side = "bottom", sideOffset = 6, align = "start", alignOffset = 0, anchor, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxPositioner, {
		side,
		sideOffset,
		align,
		alignOffset,
		anchor,
		className: "isolate z-50",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxPopup, {
			"data-slot": "combobox-content",
			"data-chips": !!anchor,
			className: cn("group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
			...props
		})
	}) });
}
function ComboboxList({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxList$1, {
		"data-slot": "combobox-list",
		className: cn("no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0", className),
		...props
	});
}
function ComboboxItem({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComboboxItem$1, {
		"data-slot": "combobox-item",
		className: cn("relative flex w-full cursor-default items-center gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxItemIndicator, {
			render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute right-2 flex size-4 items-center justify-center" }),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "pointer-events-none" })
		})]
	});
}
function ComboboxEmpty({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxEmpty$1, {
		"data-slot": "combobox-empty",
		className: cn("hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex", className),
		...props
	});
}
function Popover$1({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverRoot, {
		"data-slot": "popover",
		...props
	});
}
function PopoverTrigger({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger$1, {
		"data-slot": "popover-trigger",
		...props
	});
}
function PopoverContent({ className, align = "center", alignOffset = 0, side = "bottom", sideOffset = 4, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverPositioner, {
		align,
		alignOffset,
		side,
		sideOffset,
		className: "isolate z-50",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverPopup, {
			"data-slot": "popover-content",
			className: cn("z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
			...props
		})
	}) });
}
var Select$1 = SelectRoot;
function SelectGroup({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectGroup$1, {
		"data-slot": "select-group",
		className: cn("scroll-my-1 p-1", className),
		...props
	});
}
function SelectValue({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue$1, {
		"data-slot": "select-value",
		className: cn("flex flex-1 text-left", className),
		...props
	});
}
function SelectTrigger({ className, size = "default", children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
		"data-slot": "select-trigger",
		"data-size": size,
		className: cn("flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, { render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "pointer-events-none size-4 text-muted-foreground" }) })]
	});
}
function SelectContent({ className, children, side = "bottom", sideOffset = 4, align = "center", alignOffset = 0, alignItemWithTrigger = true, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPositioner, {
		side,
		sideOffset,
		align,
		alignOffset,
		alignItemWithTrigger,
		className: "isolate z-50",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectPopup, {
			"data-slot": "select-content",
			"data-align-trigger": alignItemWithTrigger,
			className: cn("relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
			...props,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectList, { children }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton, {})
			]
		})
	}) });
}
function SelectItem({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
		"data-slot": "select-item",
		className: cn("relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, {
			className: "flex flex-1 shrink-0 gap-2 whitespace-nowrap",
			children
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, {
			render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute right-2 flex size-4 items-center justify-center" }),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "pointer-events-none" })
		})]
	});
}
function SelectScrollUpButton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpArrow, {
		"data-slot": "select-scroll-up-button",
		className: cn("top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, {})
	});
}
function SelectScrollDownButton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownArrow, {
		"data-slot": "select-scroll-down-button",
		className: cn("bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {})
	});
}
function Slider$1({ className, defaultValue, value, min = 0, max = 100, ...props }) {
	const _values = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRoot, {
		className: cn("data-horizontal:w-full data-vertical:h-full", className),
		"data-slot": "slider",
		defaultValue,
		value,
		min,
		max,
		thumbAlignment: "edge",
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SliderControl, {
			className: "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
				"data-slot": "slider-track",
				className: "relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderIndicator, {
					"data-slot": "slider-range",
					className: "bg-primary select-none data-horizontal:h-full data-vertical:w-full"
				})
			}), Array.from({ length: _values.length }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, {
				"data-slot": "slider-thumb",
				className: "relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
			}, index))]
		})
	});
}
function Switch$1({ className, size = "default", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchRoot, {
		"data-slot": "switch",
		"data-size": size,
		className: cn("peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, {
			"data-slot": "switch-thumb",
			className: "pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
		})
	});
}
function valueToString(value) {
	if (value == null) return "";
	return value instanceof Date ? value.toISOString() : String(value);
}
/** Convert a `defaultValue` into a `Date` for the calendar. */
function toDate(value) {
	if (value instanceof Date) return value;
	if (typeof value === "string") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? void 0 : parsed;
	}
}
/** Format a Date as `HH:mm:ss` for an `<input type="time">`. */
function formatTime(date) {
	const pad = (n) => n.toString().padStart(2, "0");
	return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
/**
* Icon-only copy button used as an `InputGroupAddon`. `getValue` is invoked
* lazily on click so the button copies the input's *live* value rather than a
* stale snapshot — important when paired with editable inputs.
*/
function CopyButton({ getValue, isDisabled }) {
	const { localization } = D();
	const { copied, copy } = at({ onError: (error) => {
		console.error("[Better Auth UI] Copy failed", error);
		toast.error(localization.errors.copyFailed);
	} });
	async function handleCopy() {
		const value = getValue();
		if (!value) return;
		await copy(value);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupButton, {
		"aria-label": copied ? localization.settings.copiedToClipboard : localization.settings.copyToClipboard,
		title: copied ? localization.settings.copiedToClipboard : localization.settings.copyToClipboard,
		onClick: handleCopy,
		disabled: isDisabled,
		children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {})
	});
}
/** Renders a single additional user field via shadcn primitives. */
function AdditionalField({ name, field: configuredField, value, onBlur, onChange, isInvalid, errors, isPending, optionalLabel }) {
	const field = optionalLabel && !configuredField.required ? {
		...configuredField,
		label: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [configuredField.label, optionalLabel] })
	} : configuredField;
	const inputType = be(field);
	const fieldErrors = M(errors ?? []);
	if (field.render) {
		const FieldRenderer = field.render;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldRenderer, {
			name,
			field,
			value,
			onBlur,
			onChange,
			isInvalid,
			errors,
			isPending,
			optionalLabel
		});
	}
	if (inputType === "hidden") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type: "hidden",
		name,
		value: valueToString(value),
		readOnly: true
	});
	if (inputType === "textarea") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		"data-invalid": isInvalid,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
				htmlFor: name,
				children: field.label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				id: name,
				name,
				value: valueToString(value),
				onBlur,
				onChange: (event) => onChange(event.target.value || null),
				placeholder: field.placeholder,
				required: field.required,
				readOnly: field.readOnly,
				disabled: isPending,
				"aria-invalid": isInvalid
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors: fieldErrors })
		]
	});
	if (inputType === "number") {
		const maxFractionDigits = field.formatOptions?.maximumFractionDigits;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
			"data-invalid": isInvalid,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
					htmlFor: name,
					children: field.label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
					id: name,
					name,
					type: "number",
					inputMode: maxFractionDigits ? "decimal" : "numeric",
					min: field.min,
					max: field.max,
					step: field.step ?? (maxFractionDigits ? 1 / 10 ** maxFractionDigits : void 0),
					value: typeof value === "number" ? value : "",
					onBlur,
					onChange: (event) => onChange(event.target.value === "" ? null : event.target.valueAsNumber),
					placeholder: field.placeholder,
					required: field.required,
					readOnly: field.readOnly,
					disabled: isPending,
					"aria-invalid": isInvalid
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors: fieldErrors })
			]
		});
	}
	if (inputType === "slider") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderField, {
		name,
		field,
		value,
		onBlur,
		onChange,
		isInvalid,
		errors,
		isPending
	});
	if (inputType === "switch") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		"data-invalid": isInvalid,
		orientation: "horizontal",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
				id: name,
				name,
				checked: value === true,
				onBlur,
				onCheckedChange: onChange,
				disabled: isPending || field.readOnly,
				"aria-invalid": isInvalid
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
				htmlFor: name,
				children: field.label
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors: fieldErrors })
		]
	});
	if (inputType === "checkbox") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		"data-invalid": isInvalid,
		orientation: "horizontal",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
				id: name,
				name,
				checked: value === true,
				onBlur,
				onCheckedChange: (checked) => onChange(checked === true),
				required: field.required,
				disabled: isPending || field.readOnly,
				"aria-invalid": isInvalid
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
				htmlFor: name,
				children: field.label
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors: fieldErrors })
		]
	});
	if (inputType === "select") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		"data-invalid": isInvalid,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
				htmlFor: name,
				children: field.label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select$1, {
				items: field.options ?? [],
				name,
				value: valueToString(value) || void 0,
				onValueChange: (nextValue) => onChange(nextValue),
				required: field.required,
				disabled: isPending || field.readOnly,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
					id: name,
					className: "w-full",
					onBlur,
					"aria-invalid": isInvalid,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: field.placeholder })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectGroup, { children: field.options?.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
					value: option.value,
					children: option.label
				}, option.value)) }) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors: fieldErrors })
		]
	});
	if (inputType === "combobox") {
		const selectedOption = field.options?.find((option) => option.value === valueToString(value));
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
			"data-invalid": isInvalid,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
					htmlFor: name,
					children: field.label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Combobox$1, {
					items: field.options ?? [],
					name,
					value: selectedOption ?? null,
					onValueChange: (option) => onChange(option?.value ?? null),
					required: field.required,
					disabled: isPending || field.readOnly,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxInput, {
						placeholder: field.placeholder,
						id: name,
						onBlur,
						"aria-invalid": isInvalid
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComboboxContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxEmpty, { children: "No items found." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxList, { children: (option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboboxItem, {
						value: option,
						children: option.label
					}, option.value) })] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors: fieldErrors })
			]
		});
	}
	if (inputType === "date" || inputType === "datetime") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateInput, {
		name,
		field,
		value,
		onBlur,
		onChange,
		isInvalid,
		errors,
		isPending
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputField, {
		name,
		field,
		value,
		onBlur,
		onChange,
		isInvalid,
		errors,
		isPending
	});
}
function InputField({ name, field, value, onBlur, onChange, isInvalid, errors, isPending }) {
	const inputRef = (0, import_react.useRef)(null);
	const fieldErrors = M(errors ?? []);
	const hasPrefix = field.prefix != null;
	const hasSuffix = field.suffix != null || field.copyable;
	const isNumeric = field.type === "number";
	const maxFractionDigits = field.formatOptions?.maximumFractionDigits;
	const nativeInputType = isNumeric ? "number" : void 0;
	const nativeInputMode = isNumeric ? maxFractionDigits ? "decimal" : "numeric" : void 0;
	const nativeStep = maxFractionDigits ? 1 / 10 ** maxFractionDigits : void 0;
	if (hasPrefix || hasSuffix) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		"data-invalid": isInvalid,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
				htmlFor: name,
				children: field.label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputGroup, { children: [
				hasPrefix && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupAddon, {
					align: "inline-start",
					children: field.prefix
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupInput, {
					ref: inputRef,
					id: name,
					name,
					type: nativeInputType,
					inputMode: nativeInputMode,
					step: nativeStep,
					value: valueToString(value),
					onBlur,
					onChange: (event) => onChange(event.target.value || null),
					placeholder: field.placeholder,
					required: field.required,
					readOnly: field.readOnly,
					disabled: isPending,
					"aria-invalid": isInvalid
				}),
				field.copyable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupAddon, {
					align: "inline-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, {
						getValue: () => inputRef.current?.value,
						isDisabled: isPending
					})
				}) : field.suffix != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupAddon, {
					align: "inline-end",
					children: field.suffix
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors: fieldErrors })
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		"data-invalid": isInvalid,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
				htmlFor: name,
				children: field.label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
				id: name,
				name,
				type: nativeInputType,
				inputMode: nativeInputMode,
				step: nativeStep,
				value: valueToString(value),
				onBlur,
				onChange: (event) => onChange(event.target.value || null),
				placeholder: field.placeholder,
				required: field.required,
				readOnly: field.readOnly,
				disabled: isPending,
				"aria-invalid": isInvalid
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors: fieldErrors })
		]
	});
}
/**
* Slider field. Radix Slider doesn't render the current value, so we render
* it next to the label and control the state to keep the displayed value in
* sync. The selected value is submitted via the underlying Radix `name` prop.
*/
function SliderField({ name, field, value, onBlur, onChange, isInvalid, errors, isPending }) {
	const maxFractionDigits = field.formatOptions?.maximumFractionDigits;
	const min = field.min ?? 0;
	const max = field.max ?? 100;
	const step = field.step ?? (maxFractionDigits ? 1 / 10 ** maxFractionDigits : 1);
	const numericValue = typeof value === "number" ? value : min;
	const fieldErrors = M(errors ?? []);
	const formatter = new Intl.NumberFormat(void 0, field.formatOptions);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		"data-invalid": isInvalid,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
					htmlFor: name,
					children: field.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm text-muted-foreground tabular-nums",
					children: formatter.format(numericValue)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider$1, {
				id: name,
				name,
				value: [numericValue],
				onBlur,
				onValueChange: (nextValue) => onChange((Array.isArray(nextValue) ? nextValue[0] : nextValue) ?? min),
				min,
				max,
				step,
				disabled: isPending || field.readOnly,
				"aria-invalid": isInvalid
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors: fieldErrors })
		]
	});
}
/**
* Date / datetime input. Composes `Popover` + `Calendar` for the date and
* (optionally) `<input type="time">` for the time. Submits the combined ISO
* value via a hidden `<input>` so it shows up in `FormData`.
*/
function DateInput({ name, field, value, onBlur, onChange, isInvalid, errors, isPending }) {
	const { localization } = D();
	const isDateTime = be(field) === "datetime";
	const fieldErrors = M(errors ?? []);
	const date = toDate(value);
	const [time, setTime] = (0, import_react.useState)(isDateTime && date ? formatTime(date) : "");
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		"data-invalid": isInvalid,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
				htmlFor: `${name}-date`,
				children: field.label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover$1, {
					open,
					onOpenChange: setOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PopoverTrigger, {
						type: "button",
						id: `${name}-date`,
						"data-empty": !date,
						"aria-invalid": isInvalid,
						"aria-required": field.required,
						onBlur,
						disabled: isPending || field.readOnly,
						className: cn(buttonVariants({ variant: "outline" }), "flex-1 justify-between font-normal", "data-[empty=true]:text-muted-foreground"),
						children: [date ? format(date, "PPP") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: field.placeholder }), isDateTime ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar$1, {})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
						className: "w-auto overflow-hidden p-0",
						align: "start",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, {
							mode: "single",
							selected: date,
							defaultMonth: date,
							captionLayout: "dropdown",
							onSelect: (value) => {
								if (!value) onChange(null);
								else {
									const nextValue = new Date(value);
									if (isDateTime && time.trim()) {
										const [hours = "0", minutes = "0", seconds = "0"] = time.split(":");
										nextValue.setHours(Number(hours), Number(minutes), Number(seconds), 0);
									} else nextValue.setHours(0, 0, 0, 0);
									onChange(nextValue);
								}
								if (!isDateTime) setOpen(false);
							}
						})
					})]
				}), isDateTime && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
					className: "w-32",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
						htmlFor: `${name}-time`,
						className: "sr-only",
						children: localization.settings.time
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
						type: "time",
						id: `${name}-time`,
						step: "1",
						value: time,
						onChange: (event) => {
							const nextTime = event.target.value;
							setTime(nextTime);
							if (!date) return;
							const nextValue = new Date(date);
							const [hours = "0", minutes = "0", seconds = "0"] = nextTime.split(":");
							nextValue.setHours(Number(hours), Number(minutes), Number(seconds), 0);
							onChange(nextValue);
						},
						disabled: isPending || field.readOnly,
						className: "appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors: fieldErrors })
		]
	});
}
var { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();
var DEFAULT_AUTH_FORM_SERVER_ERROR = "Unable to submit this form. Try again.";
function focusFirstInvalidAuthFormControl(form) {
	requestAnimationFrame(() => {
		form.querySelector("[aria-invalid=\"true\"]:not([disabled]), :invalid:not([disabled])")?.focus();
	});
}
function AuthFormFieldError() {
	const field = useFieldContext();
	if (!(field.state.meta.isTouched && !field.state.meta.isValid)) return null;
	const errors = M(field.state.meta.errors);
	return errors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors }) : null;
}
function AuthFormServerError() {
	const form = useFormContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Subscribe, {
		selector: (state) => state.errorMap.onServer,
		children: (error) => {
			const formError = error && typeof error === "object" && "form" in error ? error.form : error;
			const errors = M(formError ? [formError] : []);
			return errors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { errors }) : null;
		}
	});
}
function setAuthFormServerError(form, error, fallbackMessage) {
	const normalized = Ue(error, fallbackMessage);
	form.setErrorMap({ onServer: {
		fields: normalized.fields ?? {},
		form: normalized.form
	} });
}
function clearAuthFormServerError(form) {
	form.setErrorMap({ onServer: { fields: {} } });
}
function clearAuthFormFieldServerError(form, fieldName) {
	form.setErrorMap({ onServer: void 0 });
	if (!fieldName) return;
	const fieldMeta = form.getFieldMeta(fieldName);
	if (!fieldMeta?.errorMap.onServer) return;
	form.setFieldMeta(fieldName, (current = fieldMeta) => ({
		...current,
		errorMap: {
			...current.errorMap,
			onServer: void 0
		},
		errorSourceMap: {
			...current.errorSourceMap,
			onServer: void 0
		}
	}));
}
async function runAuthFormAction(form, action, serverErrorMessage = DEFAULT_AUTH_FORM_SERVER_ERROR) {
	clearAuthFormServerError(form);
	try {
		await action();
		return true;
	} catch (error) {
		if (!form.state.errorMap.onServer) setAuthFormServerError(form, error, serverErrorMessage);
		return false;
	}
}
async function submitAuthForm(form, serverErrorMessage = DEFAULT_AUTH_FORM_SERVER_ERROR) {
	clearAuthFormServerError(form);
	try {
		await form.handleSubmit();
		return form.state.isValid;
	} catch (error) {
		if (!form.state.errorMap.onServer) setAuthFormServerError(form, error, serverErrorMessage);
		return false;
	}
}
function AuthFormRoot({ children, onBeforeSubmit, onInput, serverErrorMessage = DEFAULT_AUTH_FORM_SERVER_ERROR, ...props }) {
	const form = useFormContext();
	const submittingRef = (0, import_react.useRef)(false);
	async function submit(event) {
		event.preventDefault();
		if (submittingRef.current || form.state.isSubmitting) return;
		const formElement = event.currentTarget;
		onBeforeSubmit?.();
		submittingRef.current = true;
		try {
			if (!await submitAuthForm(form, serverErrorMessage)) focusFirstInvalidAuthFormControl(formElement);
		} finally {
			submittingRef.current = false;
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
		...props,
		onInvalid: (event) => focusFirstInvalidAuthFormControl(event.currentTarget),
		onInput: (event) => {
			const target = event.target;
			const fieldName = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement ? target.name : "";
			clearAuthFormFieldServerError(form, fieldName);
			onInput?.(event);
		},
		onSubmit: submit,
		children
	});
}
function AuthFormTextField({ description, id, label, ...props }) {
	const field = useFieldContext();
	const form = useFormContext();
	const isInvalid = isAuthFormFieldInvalid(field.state.meta);
	const inputId = id ?? field.name;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		"data-invalid": isInvalid,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
				htmlFor: inputId,
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
				...props,
				"aria-busy": field.state.meta.isValidating || void 0,
				"aria-invalid": isInvalid,
				id: inputId,
				name: field.name,
				onBlur: field.handleBlur,
				onChange: (event) => {
					clearAuthFormFieldServerError(form, field.name);
					field.handleChange(event.target.value);
				},
				value: field.state.value
			}),
			description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldDescription, { children: description }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthFormFieldError, {})
		]
	});
}
function AuthFormSubmitButton({ children, disabled, isPending, ...props }) {
	const form = useFormContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Subscribe, {
		selector: (state) => [state.isSubmitting, state.isValidating],
		children: ([isSubmitting, isValidating]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button$1, {
			...props,
			"aria-busy": isPending || isSubmitting || void 0,
			"aria-disabled": disabled || isPending || isSubmitting || isValidating || void 0,
			disabled: disabled || isPending || isSubmitting || isValidating,
			type: "submit",
			children: [isPending || isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { "data-icon": "inline-start" }) : null, children]
		})
	});
}
function AuthFormAdditionalField(props) {
	const field = useFieldContext();
	const form = useFormContext();
	const isInvalid = isAuthFormFieldInvalid(field.state.meta);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdditionalField, {
		...props,
		errors: isInvalid ? M(field.state.meta.errors) : void 0,
		isInvalid,
		name: field.name,
		onBlur: field.handleBlur,
		onChange: (value) => {
			clearAuthFormFieldServerError(form, field.name);
			field.handleChange(value);
		},
		value: field.state.value
	});
}
var { useAppForm: useAuthForm, withFieldGroup: withAuthFieldGroup, withForm: withAuthForm } = createFormHook({
	fieldComponents: {
		AuthFormAdditionalField,
		AuthFormFieldError,
		AuthFormTextField
	},
	fieldContext,
	formComponents: {
		AuthFormRoot,
		AuthFormServerError,
		AuthFormSubmitButton
	},
	formContext
});
function isAuthFormFieldInvalid({ isTouched, isValid }) {
	return isTouched && !isValid;
}
function getAuthAdditionalFieldValidators(field, requiredMessage) {
	return {
		onChange: ({ value }) => he(field, value, requiredMessage),
		onChangeAsync: field.validate ? ({ value }) => ge(field, value) : void 0,
		onChangeAsyncDebounceMs: field.validate ? field.validateDebounceMs ?? 300 : void 0
	};
}
/**
* Render a button that opens the user's email provider login page in a new
* tab. Hovering or focusing the button reveals a QR code for opening the same
* provider on another device.
*
* The provider is resolved from the email domain via the curated
* `@mikkelscheike/email-provider-links` dataset (Gmail, Outlook, GMX, etc.).
* Renders nothing when the domain is empty or not a known provider.
*
* @param email - Email address to resolve the provider from.
* @param className - Additional CSS classes applied to the button.
* @param variant - Button variant. Defaults to the primary style.
* @returns The open-email button, or `null` when no provider matches.
*/
function OpenEmailButton({ email, className, variant }) {
	const { localization } = D();
	const provider = He(email);
	const loginUrl = provider?.loginUrl;
	const qrCode = (0, import_react.useMemo)(() => loginUrl ? tt(loginUrl) : null, [loginUrl]);
	if (!provider || !qrCode) return null;
	const scanLabel = localization.auth.scanToOpenEmailProvider.replace("{{provider}}", provider.companyProvider);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip$1, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipTrigger, {
		type: "button",
		className: cn(buttonVariants({ variant }), "w-full", className),
		onClick: () => window.open(provider.loginUrl, "_blank", "noopener,noreferrer"),
		children: [localization.auth.openEmailProvider.replace("{{provider}}", provider.companyProvider), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { "data-icon": "inline-end" })]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipContent, {
		sideOffset: 8,
		className: "flex-col items-center gap-2 p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: `0 0 ${qrCode.size} ${qrCode.size}`,
			"aria-hidden": "true",
			focusable: "false",
			className: "size-40",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "white",
				d: `M0 0h${qrCode.size}v${qrCode.size}H0z`
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "black",
				d: qrCode.path,
				shapeRendering: "crispEdges"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-40 text-center leading-snug",
			children: scanLabel
		})]
	})] }) });
}
function InputOTP({ className, containerClassName, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)($t, {
		"data-slot": "input-otp",
		containerClassName: cn("cn-input-otp flex items-center has-disabled:opacity-50", containerClassName),
		spellCheck: false,
		className: cn("disabled:cursor-not-allowed", className),
		...props
	});
}
function InputOTPGroup({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "input-otp-group",
		className: cn("flex items-center rounded-lg has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40", className),
		...props
	});
}
function InputOTPSlot({ index, className, ...props }) {
	const { char, hasFakeCaret, isActive } = import_react.useContext(Nt)?.slots[index] ?? {};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-slot": "input-otp-slot",
		"data-active": isActive,
		className: cn("relative flex size-8 items-center justify-center border-y border-r border-input text-sm transition-all outline-none first:rounded-l-lg first:border-l last:rounded-r-lg aria-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40", className),
		...props,
		children: [char, hasFakeCaret && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-0 flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-px animate-caret-blink bg-foreground duration-1000" })
		})]
	});
}
function normalizeCode(value) {
	return value.replace(/\D/g, "");
}
function OtpField({ autoFocus, className, disabled, errorMessage, label, length, name, onChange, onComplete, value }) {
	const inputId = (0, import_react.useId)();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		className: cn(className),
		"data-invalid": !!errorMessage,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
				htmlFor: inputId,
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTP, {
				"aria-invalid": !!errorMessage,
				"aria-label": label,
				autoComplete: "one-time-code",
				autoFocus,
				containerClassName: "w-full justify-center",
				disabled,
				id: inputId,
				inputMode: "numeric",
				maxLength: length,
				name,
				pasteTransformer: normalizeCode,
				pattern: Qt,
				value,
				onChange: (next) => onChange(normalizeCode(next)),
				onComplete: (completedCode) => onComplete?.(normalizeCode(completedCode)),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTPGroup, { children: Array.from({ length }, (_, slotIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTPSlot, { index: slotIndex }, `otp-slot-${String(slotIndex + 1)}`)) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { children: errorMessage })
		]
	});
}
/**
* Displays an indicator when one of the supplied method IDs matches Better
* Auth's stored last login method.
*/
function LastUsedBadge({ method, compact, floating }) {
	const { method: lastLoginMethod, localization } = Ne();
	if (!lastLoginMethod || !(Array.isArray(method) ? method : [method]).includes(lastLoginMethod)) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		className: floating ? "pointer-events-none absolute top-0 right-0 z-10 translate-x-1/4 -translate-y-1/2 shadow-sm" : void 0,
		variant: "secondary",
		children: compact || floating ? localization.lastUsedShort : localization.lastUsed
	});
}
/**
* Social provider sign-in button.
*
* @param provider - Provider to sign in with.
* @param display - `"full"` (e.g. "Continue with Google"), `"name"` (just the provider name), or `"icon"` (icon only).
*/
function ProviderButton({ provider, display = "full", view = "signIn", variant = "outline", className, ...props }) {
	const { authClient, baseURL, localization, navigate, redirectTo, socialSignInMode } = D();
	const callbackURL = `${baseURL}${redirectTo}`;
	const { fetchOptions, resetFetchOptions } = S();
	const { mutate: signInSocial, isPending: signInSocialPending } = qe(authClient, { onError: resetFetchOptions });
	const { mutate: signInPopup, isPending: signInPopupPending } = Ke(authClient, { onError: resetFetchOptions });
	const providerId = v(provider);
	const providerIcon = ft(provider);
	const isPending = useIsMutating({ mutationKey: e$1.signIn.all }) + useIsMutating({ mutationKey: e$1.signUp.all }) > 0;
	const handleSignIn = () => {
		if (socialSignInMode === "popup") {
			signInPopup({
				provider: providerId,
				callbackURL,
				requestSignUp: view === "signUp"
			}, { onSuccess: () => navigate({ to: redirectTo }) });
			return;
		}
		signInSocial({
			provider: providerId,
			callbackURL,
			fetchOptions
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button$1, {
		type: "button",
		variant,
		disabled: isPending,
		onClick: handleSignIn,
		className: cn("relative overflow-visible", className),
		...props,
		children: [
			signInSocialPending || signInPopupPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, {}) : providerIcon,
			display === "full" ? localization.auth.continueWith.replace("{{provider}}", $e(provider)) : display === "name" ? $e(provider) : null,
			display === "icon" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: $e(provider)
			}),
			view !== "signUp" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LastUsedBadge, {
				method: providerId,
				floating: true
			})
		]
	});
}
/**
* Render sign-in buttons for configured social providers. Each button owns its own sign-in mutation
* and reads the shared sign-in pending state from React Query.
*
* @param socialLayout - Preferred layout for the provider buttons; `"auto"` chooses based on the number of providers.
*/
function ProviderButtons({ socialLayout = "auto", view = "signIn" }) {
	const { socialProviders } = D();
	const resolvedSocialLayout = (0, import_react.useMemo)(() => {
		if (socialLayout === "auto") {
			if (socialProviders?.length && socialProviders.length >= 4) return "horizontal";
			return "vertical";
		}
		return socialLayout;
	}, [socialLayout, socialProviders?.length]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("gap-3", resolvedSocialLayout === "grid" && "grid grid-cols-2", resolvedSocialLayout === "vertical" && "flex flex-col", resolvedSocialLayout === "horizontal" && "flex flex-row flex-wrap"),
		children: socialProviders?.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderButton, {
			provider,
			view,
			display: resolvedSocialLayout === "vertical" ? "full" : resolvedSocialLayout === "grid" ? "name" : "icon",
			className: cn(resolvedSocialLayout === "horizontal" && "flex-1")
		}, v(provider)))
	});
}
var alertVariants = cva("group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4", {
	variants: { variant: {
		default: "bg-card text-card-foreground",
		destructive: "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current"
	} },
	defaultVariants: { variant: "default" }
});
function Alert({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "alert",
		role: "alert",
		className: cn(alertVariants({ variant }), className),
		...props
	});
}
function AlertTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "alert-title",
		className: cn("font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground", className),
		...props
	});
}
function AlertDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "alert-description",
		className: cn("text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4", className),
		...props
	});
}
var subscribeToLocation = () => () => void 0;
function useIsReauthenticationSignIn() {
	return (0, import_react.useSyncExternalStore)(subscribeToLocation, () => ke(new URL(window.location.href)), () => false);
}
function ReauthenticationNotice() {
	const auth = D();
	if (!useIsReauthenticationSignIn()) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Alert, {
		className: "mx-4 w-auto group-data-[size=sm]/card:mx-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertTitle, { children: auth.localization.settings.reauthenticationTitle }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDescription, { children: auth.localization.settings.reauthenticationDescription })]
	});
}
function EmailOtp({ className, socialLayout, socialPosition = "bottom" }) {
	const { authClient, basePaths, emailAndPassword, localization, plugins, socialProviders, viewPaths, Link } = D();
	const { localization: emailOtpLocalization, otpLength } = t(emailOtpPlugin$1);
	const otpClient = authClient;
	const continueSignIn = useSignInContinuation();
	const { cooldown, isCoolingDown, startCooldown } = useResendCooldown();
	const [codeSent, setCodeSent] = (0, import_react.useState)(false);
	const { mutateAsync: sendVerificationOtp, isPending: isSending } = f(otpClient, { onSuccess: () => {
		setCodeSent(true);
		startCooldown();
	} });
	const { mutateAsync: signInEmailOtp, isPending: isSigningIn } = p(otpClient, {
		onError: () => form.setFieldValue("code", ""),
		onSuccess: (data) => continueSignIn(data)
	});
	const isPending = useIsMutating({ mutationKey: e$1.signIn.all }) + useIsMutating({ mutationKey: e$1.signUp.all }) > 0 || isSending;
	const sendCode = async () => await sendVerificationOtp({
		email: form.state.values.email,
		type: "sign-in"
	});
	const verifyCode = async (completedCode) => {
		if (isPending || isSigningIn) return;
		await signInEmailOtp({
			email: form.state.values.email,
			otp: completedCode
		});
	};
	const form = useAuthForm({
		defaultValues: {
			code: "",
			email: u()
		},
		onSubmit: async ({ value }) => {
			if (!codeSent) {
				await sendVerificationOtp({
					email: value.email,
					type: "sign-in"
				});
				return;
			}
			await verifyCode(value.code);
		}
	});
	const codeComplete = useSelector(form.store, (state) => state.values.code.length === otpLength);
	const email = useSelector(form.store, (state) => state.values.email);
	const showSeparator = socialProviders && socialProviders.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: cn("w-full max-w-sm", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReauthenticationNotice, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-xl",
				children: localization.auth.signIn
			}), codeSent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: emailOtpLocalization.codeSentTo.replace("{{email}}", email) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-6",
				children: [
					socialPosition === "top" && !codeSent && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [socialProviders && socialProviders.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderButtons, {
						socialLayout,
						view: "emailOtp"
					}), showSeparator && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSeparator, {
						className: "*:data-[slot=field-separator-content]:bg-card m-0 text-xs flex items-center",
						children: localization.auth.or
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppForm, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormRoot, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldGroup, { children: [
						codeSent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
							name: "code",
							children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OtpField, {
								autoFocus: true,
								disabled: isPending || isSigningIn,
								label: emailOtpLocalization.code,
								length: otpLength,
								name: field.name,
								value: field.state.value,
								onChange: field.handleChange,
								onComplete: () => void submitAuthForm(form)
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
							name: "email",
							children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
									htmlFor: "email",
									children: localization.auth.email
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
									id: "email",
									name: field.name,
									type: "email",
									autoComplete: "email",
									value: field.state.value,
									onBlur: field.handleBlur,
									onChange: (event) => field.handleChange(event.target.value),
									placeholder: localization.auth.emailPlaceholder,
									required: true,
									disabled: isPending
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormFieldError, {})
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormServerError, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormSubmitButton, {
								isPending: isSending || isSigningIn,
								disabled: isPending || isSigningIn || codeSent && !codeComplete,
								children: codeSent ? emailOtpLocalization.verifyCode : emailOtpLocalization.sendCode
							}), codeSent ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenEmailButton, {
									email,
									variant: "secondary"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, {
									type: "button",
									variant: "outline",
									disabled: isPending || isSigningIn || isCoolingDown,
									onClick: () => void runAuthFormAction(form, sendCode),
									children: isCoolingDown ? localization.auth.resendIn.replace("{{seconds}}", String(cooldown)) : localization.auth.resend
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, {
									type: "button",
									variant: "ghost",
									disabled: isPending || isSigningIn,
									onClick: () => {
										setCodeSent(false);
										form.setFieldValue("code", "");
									},
									children: emailOtpLocalization.useDifferentEmail
								})
							] }) : plugins.flatMap((plugin) => (plugin.authButtons ?? []).map((AuthButton, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthButton, { view: "emailOtp" }, `${plugin.id}-${index.toString()}`)))]
						})
					] }) }) }),
					socialPosition === "bottom" && !codeSent && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [showSeparator && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSeparator, {
						className: "*:data-[slot=field-separator-content]:bg-card text-xs flex items-center",
						children: localization.auth.or
					}), socialProviders && socialProviders.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderButtons, {
						socialLayout,
						view: "emailOtp"
					})] })
				]
			}), emailAndPassword?.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-3 items-center w-full mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldDescription, {
					className: "text-center",
					children: [
						localization.auth.needToCreateAnAccount,
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: `${basePaths.auth}/${viewPaths.auth.signUp}`,
							className: "underline underline-offset-4",
							children: localization.auth.signUp
						})
					]
				})
			})] })
		]
	});
}
var emailOtpPlugin$1 = e$3(s.id, (options = {}) => {
	const plugin = s(options);
	return {
		...plugin,
		authButtons: plugin.signIn ? [EmailOtpButton] : [],
		views: { auth: { ...plugin.signIn && { emailOtp: EmailOtp } } },
		...plugin.signIn && { fallbackViews: { auth: { signIn: EmailOtp } } }
	};
});
function MagicLinkButton({ view }) {
	const { basePaths, emailAndPassword, viewPaths, localization, Link } = D();
	const { localization: magicLinkLocalization, viewPaths: magicLinkViewPaths } = t(magicLinkPlugin$1);
	const isPending = useIsMutating({ mutationKey: e$1.signIn.all }) + useIsMutating({ mutationKey: e$1.signUp.all }) > 0;
	const isMagicLinkView = view === "magicLink";
	if (isMagicLinkView && !emailAndPassword?.enabled) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		href: `${basePaths.auth}/${isMagicLinkView ? viewPaths.auth.signIn : magicLinkViewPaths.auth.magicLink}`,
		"aria-disabled": isPending || void 0,
		tabIndex: isPending ? -1 : void 0,
		onClick: (event) => {
			if (isPending) event.preventDefault();
		},
		className: cn(buttonVariants({ variant: "outline" }), "w-full", isPending && "opacity-50 pointer-events-none"),
		children: [isMagicLinkView ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {}), localization.auth.continueWith.replace("{{provider}}", isMagicLinkView ? localization.auth.password : magicLinkLocalization.magicLink)]
	});
}
/**
* Returns `true` once the component is mounted on the client (hydrated) and
* `false` while rendering on the server, so client-only reads (e.g.
* `sessionStorage`) stay safe during SSR.
*
* @returns Whether the component has hydrated on the client.
*/
function useIsHydrated() {
	const subscribe = () => () => {};
	return (0, import_react.useSyncExternalStore)(subscribe, () => true, () => false);
}
var MAGIC_LINK_SENT_STORAGE_KEY = "better-auth-ui.magic-link-sent";
function MagicLinkSent({ className }) {
	const { basePaths, emailAndPassword, localization, viewPaths, Link } = D();
	const { localization: magicLinkLocalization } = t(magicLinkPlugin$1);
	const isHydrated = useIsHydrated();
	const [email, setEmail] = (0, import_react.useState)(isHydrated && sessionStorage.getItem("better-auth-ui.magic-link-sent") || "");
	(0, import_react.useEffect)(() => {
		setEmail(sessionStorage.getItem("better-auth-ui.magic-link-sent") ?? "");
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: cn("w-full max-w-sm", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
			className: "text-xl font-semibold",
			children: localization.auth.checkYourEmailTitle
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldDescription, { children: email ? magicLinkLocalization.magicLinkSentTo.replace("{{email}}", email) : magicLinkLocalization.magicLinkSent }), email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenEmailButton, { email })]
		}), emailAndPassword?.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-3 items-center w-full mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldDescription, {
				className: "text-center",
				children: [
					localization.auth.needToCreateAnAccount,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						href: `${basePaths.auth}/${viewPaths.auth.signUp}`,
						className: "underline underline-offset-4",
						children: localization.auth.signUp
					})
				]
			})
		})] })]
	});
}
function MagicLink({ className, socialLayout, socialPosition = "bottom" }) {
	const { authClient, basePaths, baseURL, emailAndPassword, localization, navigate, plugins, redirectTo, socialProviders, viewPaths, Link } = D();
	const { localization: magicLinkLocalization, viewPaths: magicLinkViewPaths } = t(magicLinkPlugin$1);
	const { mutateAsync: signInMagicLink, isPending: signInMagicLinkPending } = n(authClient, { onSuccess: (_data, variables) => {
		sessionStorage.setItem(MAGIC_LINK_SENT_STORAGE_KEY, variables.email);
		navigate({ to: `${basePaths.auth}/${magicLinkViewPaths.auth.magicLinkSent}` });
	} });
	const isPending = useIsMutating({ mutationKey: e$1.signIn.all }) + useIsMutating({ mutationKey: e$1.signUp.all }) > 0;
	const form = useAuthForm({
		defaultValues: { email: u() },
		onSubmit: async ({ value }) => await signInMagicLink({
			callbackURL: `${baseURL}${redirectTo}`,
			email: value.email
		})
	});
	const showSeparator = socialProviders && socialProviders.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: cn("w-full max-w-sm", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReauthenticationNotice, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-xl",
				children: localization.auth.signIn
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-6",
				children: [
					socialPosition === "top" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [socialProviders && socialProviders.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderButtons, {
						socialLayout,
						view: "magicLink"
					}), showSeparator && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSeparator, {
						className: "*:data-[slot=field-separator-content]:bg-card m-0 text-xs flex items-center",
						children: localization.auth.or
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppForm, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormRoot, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldGroup, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
						name: "email",
						validators: { onChange: ({ value }) => Ge(value, {
							invalidMessage: localization.auth.invalidEmail,
							requiredMessage: localization.auth.fieldRequired
						}) },
						children: (field) => {
							const isInvalid = isAuthFormFieldInvalid(field.state.meta);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
								"data-invalid": isInvalid,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
										htmlFor: "email",
										children: localization.auth.email
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
										id: "email",
										name: field.name,
										type: "email",
										autoComplete: "email",
										value: field.state.value,
										onBlur: field.handleBlur,
										onChange: (event) => field.handleChange(event.target.value),
										placeholder: localization.auth.emailPlaceholder,
										required: true,
										disabled: isPending,
										"aria-invalid": isInvalid
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormFieldError, {})
								]
							});
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormSubmitButton, {
							isPending: signInMagicLinkPending,
							disabled: isPending,
							children: magicLinkLocalization.sendMagicLink
						}), plugins.flatMap((plugin) => (plugin.authButtons ?? []).map((AuthButton, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthButton, { view: "magicLink" }, `${plugin.id}-${index.toString()}`)))]
					})] }) }) }),
					socialPosition === "bottom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [showSeparator && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSeparator, {
						className: "*:data-[slot=field-separator-content]:bg-card text-xs flex items-center",
						children: localization.auth.or
					}), socialProviders && socialProviders.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderButtons, {
						socialLayout,
						view: "magicLink"
					})] })
				]
			}), emailAndPassword?.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-3 items-center w-full mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldDescription, {
					className: "text-center",
					children: [
						localization.auth.needToCreateAnAccount,
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: `${basePaths.auth}/${viewPaths.auth.signUp}`,
							className: "underline underline-offset-4",
							children: localization.auth.signUp
						})
					]
				})
			})] })
		]
	});
}
var magicLinkPlugin$1 = e$3(r.id, (options = {}) => ({
	...r(options),
	authButtons: [MagicLinkButton],
	views: { auth: {
		magicLink: MagicLink,
		magicLinkSent: MagicLinkSent
	} },
	fallbackViews: { auth: { signIn: MagicLink } }
}));
function Providers({ children }) {
	const navigate = useNavigate();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(J, {
		attribute: "class",
		defaultTheme: "system",
		enableSystem: true,
		disableTransitionOnChange: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider$1, {
			authClient,
			redirectTo: "/",
			socialProviders: [...["google"], ...["apple"]],
			emailAndPassword: {
				enabled: true,
				forgotPassword: true,
				requireEmailVerification: true
			},
			plugins: [magicLinkPlugin$1(), emailOtpPlugin$1({
				disableSignUp: true,
				otpLength: 6,
				signIn: true
			})],
			navigate,
			Link: ({ href, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: href,
				...props
			}),
			children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})]
		})
	});
}
function NotFoundPage() {
	const goBack = () => {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}
		window.location.assign("/workspaces");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-svh place-items-center px-6 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-auto flex max-w-md flex-col items-center text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, {
						className: "size-7",
						"aria-hidden": "true"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-sm font-medium text-primary",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-3xl font-semibold tracking-tight",
					children: "This page isn't on the itinerary."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-pretty leading-7 text-muted-foreground",
					children: "The link may be outdated, or the page may have moved to another workspace."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-7 flex flex-wrap justify-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button$1, {
							render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/workspaces" }),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { "aria-hidden": "true" }), "Home"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button$1, {
							variant: "outline",
							onClick: goBack,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { "aria-hidden": "true" }), "Go back"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button$1, {
							variant: "outline",
							onClick: () => window.location.reload(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { "aria-hidden": "true" }), "Try again"]
						})
					]
				})
			]
		})
	});
}
var Route$7 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Gatherory" }
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "256x256",
				href: "/favicon.png"
			},
			{
				rel: "apple-touch-icon",
				href: "/gatherory-icon.png"
			}
		]
	}),
	notFoundComponent: NotFoundPage,
	shellComponent: RootDocument
});
function RootDocument({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PostHogProvider$1, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Providers, { children }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientOnly, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	});
}
/** Returns the current cookie-backed session without requiring authentication. */
var getSession = createServerFn({ method: "GET" }).handler(createSsrRpc("753fb13391a5b0328ea3344426a11caf1f07e6f28fcdc91937757498d31af961"));
createServerFn({ method: "GET" }).middleware([requireSessionMiddleware]).handler(createSsrRpc("320b20df46a897fdac7b4c0604c8114f427784a2e4bb7478c59ae0d8a3d9d1b3"));
var Route$6 = createFileRoute("/")({ beforeLoad: async () => {
	if (!await getSession()) throw redirect({
		to: "/auth/$path",
		params: { path: "sign-in" },
		replace: true
	});
	throw redirect({
		to: "/workspaces",
		replace: true
	});
} });
var $$splitComponentImporter$4 = () => import("./route-SoVOBHvG.mjs");
var Route$5 = createFileRoute("/_protected")({
	beforeLoad: async () => ({ defaultWorkspaceContext: await ensurePersonalWorkspace() }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./workspaces-DUqEtbYH.mjs");
var Route$4 = createFileRoute("/_protected/workspaces/")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./route-Czo6A-3J.mjs");
var Route$3 = createFileRoute("/_protected/workspaces/$workspaceSlug")({
	beforeLoad: async ({ params }) => {
		const workspaceContext = await resolveWorkspace({ data: { slug: params.workspaceSlug } });
		if (!workspaceContext) throw notFound();
		return { workspaceContext };
	},
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var Route$2 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var $$splitComponentImporter$1 = () => import("../_path-wCtqYMgg.mjs");
var passwordlessAuthPaths = [
	"email-otp",
	"magic-link",
	"magic-link-sent"
];
var validAuthPaths = /* @__PURE__ */ new Set([...Object.values(e$4.auth), ...passwordlessAuthPaths]);
var signedOutOnlyPaths = /* @__PURE__ */ new Set([
	e$4.auth.signIn,
	e$4.auth.signUp,
	...passwordlessAuthPaths
]);
var Route$1 = createFileRoute("/auth/$path/")({
	beforeLoad: async ({ params: { path } }) => {
		if (!validAuthPaths.has(path)) throw redirect({
			to: "/auth/$path",
			params: { path: "sign-in" }
		});
		if (signedOutOnlyPaths.has(path)) {
			if (await getSession()) throw redirect({ to: "/" });
		}
	},
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
createServerFn({ method: "POST" }).middleware([requireSessionMiddleware]).validator(CreateEventInputSchema).handler(createSsrRpc("054ea92b101a12b86c34af60651e01d28b976a8b4d1d95a6702f73857bac4827"));
var listEvents = createServerFn({ method: "GET" }).middleware([requireSessionMiddleware]).validator(ListEventsInputSchema).handler(createSsrRpc("8b204c21af0fc3a1cb1f8bb66c3641607f7537a11efa75aa1ad779f25b3d8cbb"));
createServerFn({ method: "POST" }).middleware([requireSessionMiddleware]).validator(InviteEventParticipantInputSchema).handler(createSsrRpc("39460b0515c6d8af169b8173348b107dadf82cfffc185ff78134676ec21a0d7c"));
createServerFn({ method: "POST" }).middleware([requireSessionMiddleware]).validator(AcceptEventInvitationInputSchema).handler(createSsrRpc("ea9c3ccd684a3ab6408182521f7361b9fd69b5bd20aeea57d33337e1626e4056"));
var $$splitComponentImporter = () => import("../_workspaceSlug-BcXegcl5.mjs");
var Route = createFileRoute("/_protected/workspaces/$workspaceSlug/")({
	loader: ({ context }) => listEvents({ data: { organizationId: context.workspaceContext.workspace.id } }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$6.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$7
});
var ProtectedRouteRoute = Route$5.update({
	id: "/_protected",
	getParentRoute: () => Route$7
});
var ProtectedWorkspacesIndexRoute = Route$4.update({
	id: "/workspaces/",
	path: "/workspaces/",
	getParentRoute: () => ProtectedRouteRoute
});
var ProtectedWorkspacesWorkspaceSlugRouteRoute = Route$3.update({
	id: "/workspaces/$workspaceSlug",
	path: "/workspaces/$workspaceSlug",
	getParentRoute: () => ProtectedRouteRoute
});
var ApiAuthSplatRouteRoute = Route$2.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$7
});
var AuthPathIndexRoute = Route$1.update({
	id: "/auth/$path/",
	path: "/auth/$path/",
	getParentRoute: () => Route$7
});
var ProtectedWorkspacesWorkspaceSlugRouteRouteChildren = { ProtectedWorkspacesWorkspaceSlugIndexRoute: Route.update({
	id: "/",
	path: "/",
	getParentRoute: () => ProtectedWorkspacesWorkspaceSlugRouteRoute
}) };
var ProtectedRouteRouteChildren = {
	ProtectedWorkspacesWorkspaceSlugRouteRoute: ProtectedWorkspacesWorkspaceSlugRouteRoute._addFileChildren(ProtectedWorkspacesWorkspaceSlugRouteRouteChildren),
	ProtectedWorkspacesIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	ProtectedRouteRoute: ProtectedRouteRoute._addFileChildren(ProtectedRouteRouteChildren),
	ApiAuthSplatRouteRoute,
	AuthPathIndexRoute
};
var routeTree = Route$7._addFileChildren(rootRouteChildren)._addFileTypes();
function getContext() {
	return { queryClient: new QueryClient() };
}
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	const context = getContext();
	const router = createRouter({
		routeTree,
		context,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0
	});
	setupRouterSsrQueryIntegration({
		router,
		queryClient: context.queryClient
	});
	return router;
}
//#endregion
export { Badge as A, TooltipContent as B, FieldGroup as C, Separator$1 as D, createWorkspace as E, CardHeader as F, authClient as H, CardTitle as I, Button$1 as L, CardAction as M, CardContent as N, Checkbox$1 as O, CardDescription as P, Input$1 as R, FieldError as S, FieldSeparator as T, TooltipTrigger as V, InputGroupInput as _, Route$4 as a, Field as b, ProviderButtons as c, getAuthAdditionalFieldValidators as d, isAuthFormFieldInvalid as f, InputGroupButton as g, InputGroupAddon as h, Route$3 as i, Card as j, Label as k, LastUsedBadge as l, InputGroup as m, Route as n, useIsHydrated as o, useAuthForm as p, Route$1 as r, ReauthenticationNotice as s, router_exports as t, OpenEmailButton as u, Spinner as v, FieldLabel as w, FieldDescription as x, useSignInContinuation as y, Tooltip$1 as z };
