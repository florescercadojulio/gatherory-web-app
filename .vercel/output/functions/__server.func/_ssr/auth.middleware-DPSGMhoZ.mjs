import { yt as require_jsx_runtime } from "../_libs/@base-ui/react+[...].mjs";
import { v as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createMiddleware, o as getRequestHeaders, s as __exportAll } from "./ssr.mjs";
import { c as sql, i as getPostgresSchema, n as getKyselyDatabaseType, o as toIntrospectedTables, r as getMssqlSchema, s as toPhysicalSchema, t as createKyselyAdapter } from "../_libs/@better-auth/kysely-adapter+[...].mjs";
import { $n as generateId, A as createRouter$1, An as email, B as importPKCS8, Bn as union, C as runWithRequestState, Ct as encode, D as appendQueryParams, Dn as array, E as tryGetCurrentAuthEndpointContext, En as any, F as userSchema, Fn as object, Gn as safeJSONParse, Hn as url, I as sessionSchema, In as optional, Jn as getDatabaseFieldIndexName, Kn as getAuthTables, Ln as record, M as serializeCookie, Mn as literal, N as serializeSignedCookie, Nn as looseObject, On as boolean$1, P as filterOutputFields, Pn as number, Qn as initGetFieldName, R as base64Url, Rn as strictObject, S as hasRequestState, Sn as string$1, T as runWithEndpointContext, V as jwtVerify, Vn as unknown, Wn as xor, Xn as getPortableDatabaseIdentifierKey, Yn as getDatabaseIndexStringLength, Zn as initGetModelName, _ as getCurrentAdapter, _n as ATTR_OPERATION_ID, ar as env, b as runWithTransaction, bn as boolean, c as mergeScopes, cn as SchemaMismatchError, cr as isDevelopment, d as findInvalidTrustedProxies, dr as getBetterAuthVersion, er as createRandomStringGenerator, f as getIP, fn as whereOperators, fr as APIError, g as isAPIError, gn as ATTR_HOOK_TYPE, gr as defineErrorCodes, h as createAuthMiddleware, hn as ATTR_CONTEXT, hr as BASE_ERROR_CODES, i as verifyProviderIdToken, in as invalidateSchemaChecks, j as toResponse, jn as json, jt as JWTExpired, k as normalizePathname, kn as date, l as isLoopbackHost, ln as diffSchema, lr as isProduction, m as createAuthEndpoint, mn as createWithSpan, mr as kAPIErrorHeaderSymbol, n as socialProviders, nr as logger, on as runtimeSchemaCheckFor, p as deprecate, pr as BetterAuthError, qn as getAuthTablesWithResolvedIndexes, r as supportsIdTokenSignIn, rr as shouldPublishLog, s as additionalAuthorizationParamsSchema, sn as schemaCheckFor, t as SocialProviderListEnum, tr as createLogger, u as createRateLimitKey, un as formatSchemaFinding, ur as isTest, v as queueAfterTransactionHook, vn as import_src, w as getCurrentAuthEndpointContext, wn as _enum, x as defineRequestState, xn as number$1, y as runWithAdapter, yn as zod_exports, z as decodeProtectedHeader, zn as string } from "../_libs/@better-auth/core+[...].mjs";
import { J as sql$1, t as drizzleAdapter } from "../_libs/@better-auth/drizzle-adapter+[...].mjs";
import { _ as bigint, a as uniqueIndex, c as pgTable, d as text, f as numeric, g as boolean$2, h as doublePrecision, i as index, l as uuid, m as integer, n as Pool, o as check, p as jsonb, r as pgEnum, s as primaryKey, t as drizzle, u as timestamp, v as foreignKey, y as defineRelationsPart } from "../_libs/drizzle-orm.mjs";
import { t as require_functions } from "../_libs/vercel__functions.mjs";
import { i as utf8ToBytes, n as hkdf, r as bytesToHex, t as sha256 } from "../_libs/noble__hashes.mjs";
import { i as jwtDecrypt, n as EncryptJWT, r as SignJWT, t as calculateJwkThumbprint } from "../_libs/jose.mjs";
import { i as verifyPassword, n as binary, r as hashPassword, t as createHMAC } from "../_libs/better-auth__utils.mjs";
import { n as createHash, t as createTelemetry } from "../_libs/@better-auth/telemetry+[...].mjs";
import { a as utf8ToBytes$1, i as managedNonce, n as bytesToHex$1, r as hexToBytes, t as xchacha20poly1305 } from "../_libs/noble__ciphers.mjs";
import { n as defu, t as createDefu } from "../_libs/defu.mjs";
import { t as createEnv } from "../_libs/t3-oss__env-core.mjs";
import { t as require_dist } from "../_libs/dotenv.mjs";
import { C as Service, S as TaggedError, a as gen, b as isFailReason, c as provide, d as runPromiseExit, f as succeed, i as fail, l as runFork, m as tryPromise, o as logError, p as tapError, r as catch_, t as annotateLogs, u as runPromise, v as sync, x as pretty, y as isSuccess } from "../_libs/effect.mjs";
import { a as Preview, c as Hr, d as Container, f as Button, i as Section, l as Heading, n as Tailwind, o as Link, p as Body, r as pixelBasedPreset, s as Html, t as Text, u as Head } from "../_libs/react-email+tailwindcss.mjs";
import { t as Resend } from "../_libs/resend+standardwebhooks.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.middleware-DPSGMhoZ.js
var import_jsx_runtime = require_jsx_runtime();
var import_functions = require_functions();
var import_dist = require_dist();
/**
* Escapes a character if it has a special meaning in regular expressions
* and returns the character as is if it doesn't
*/
function escapeRegExpChar(char) {
	if (char === "-" || char === "^" || char === "$" || char === "+" || char === "." || char === "(" || char === ")" || char === "|" || char === "[" || char === "]" || char === "{" || char === "}" || char === "*" || char === "?" || char === "\\") return `\\${char}`;
	else return char;
}
/**
* Escapes all characters in a given string that have a special meaning in regular expressions
*/
function escapeRegExpString(str) {
	let result = "";
	for (let i = 0; i < str.length; i++) result += escapeRegExpChar(str[i]);
	return result;
}
/**
* Transforms one or more glob patterns into a RegExp pattern
*/
function transform(pattern, separator = true) {
	if (Array.isArray(pattern)) return `(?:${pattern.map((p) => `^${transform(p, separator)}$`).join("|")})`;
	let separatorSplitter = "";
	let separatorMatcher = "";
	let wildcard = ".";
	if (separator === true) {
		separatorSplitter = "/";
		separatorMatcher = "[/\\\\]";
		wildcard = "[^/\\\\]";
	} else if (separator) {
		separatorSplitter = separator;
		separatorMatcher = escapeRegExpString(separatorSplitter);
		if (separatorMatcher.length > 1) {
			separatorMatcher = `(?:${separatorMatcher})`;
			wildcard = `((?!${separatorMatcher}).)`;
		} else wildcard = `[^${separatorMatcher}]`;
	}
	const requiredSeparator = separator ? `${separatorMatcher}+?` : "";
	const optionalSeparator = separator ? `${separatorMatcher}*?` : "";
	const segments = separator ? pattern.split(separatorSplitter) : [pattern];
	let result = "";
	for (let s = 0; s < segments.length; s++) {
		const segment = segments[s];
		const nextSegment = segments[s + 1];
		let currentSeparator = "";
		if (!segment && s > 0) continue;
		if (separator) if (s === segments.length - 1) currentSeparator = optionalSeparator;
		else if (nextSegment !== "**") currentSeparator = requiredSeparator;
		else currentSeparator = "";
		if (separator && segment === "**") {
			if (currentSeparator) {
				result += s === 0 ? "" : currentSeparator;
				result += `(?:${wildcard}*?${currentSeparator})*?`;
			}
			continue;
		}
		for (let c = 0; c < segment.length; c++) {
			const char = segment[c];
			if (char === "\\") {
				if (c < segment.length - 1) {
					result += escapeRegExpChar(segment[c + 1]);
					c++;
				}
			} else if (char === "?") result += wildcard;
			else if (char === "*") result += `${wildcard}*?`;
			else result += escapeRegExpChar(char);
		}
		result += currentSeparator;
	}
	return result;
}
function isMatch(regexp, sample) {
	if (typeof sample !== "string") throw new TypeError(`Sample must be a string, but ${typeof sample} given`);
	return regexp.test(sample);
}
/**
* Compiles one or more glob patterns into a RegExp and returns an isMatch function.
* The isMatch function takes a sample string as its only argument and returns `true`
* if the string matches the pattern(s).
*
* ```js
* wildcardMatch('src/*.js')('src/index.js') //=> true
* ```
*
* ```js
* const isMatch = wildcardMatch('*.example.com', '.')
* isMatch('foo.example.com') //=> true
* isMatch('foo.bar.com') //=> false
* ```
*/
function wildcardMatch(pattern, options) {
	if (typeof pattern !== "string" && !Array.isArray(pattern)) throw new TypeError(`The first argument must be a single pattern string or an array of patterns, but ${typeof pattern} given`);
	if (typeof options === "string" || typeof options === "boolean") options = { separator: options };
	if (arguments.length === 2 && !(typeof options === "undefined" || typeof options === "object" && options !== null && !Array.isArray(options))) throw new TypeError(`The second argument must be an options object or a string/boolean separator, but ${typeof options} given`);
	options = options || {};
	if (options.separator === "\\") throw new Error("\\ is not a valid separator because it is used for escaping. Try setting the separator to `true` instead");
	const regexpPattern = transform(pattern, options.separator);
	const regexp = new RegExp(`^${regexpPattern}$`, options.flags);
	const fn = isMatch.bind(null, regexp);
	fn.options = options;
	fn.pattern = pattern;
	fn.regexp = regexp;
	return fn;
}
var SLASH_CHAR_CODE = "/".charCodeAt(0);
/**
* Minimal loopback check for dev scheme inference only. Reachable from
* `client/config.ts` via `getBaseURL`, so we MUST NOT import the full
* `@better-auth/core/utils/host` classifier here: its `utils/ip` dependency
* on zod would leak into the client bundle (see `e2e/smoke/test/vite.spec.ts`).
*
* Server-side SSRF/loopback checks (oauth redirect matching, trusted-origin
* resolution, electron fetch gate) continue to use the authoritative
* `isLoopbackHost` from `@better-auth/core/utils/host`. This helper's only
* job is picking `http` vs `https` for dev ergonomics.
*/
function isLoopbackForDevScheme(host) {
	const hostname = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "").toLowerCase();
	return hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "::1" || hostname.startsWith("127.");
}
function trimTrailingSlashes(value) {
	let end = value.length;
	while (end > 0 && value.charCodeAt(end - 1) === SLASH_CHAR_CODE) end--;
	return end === value.length ? value : value.slice(0, end);
}
function checkHasPath(url) {
	try {
		return (trimTrailingSlashes(new URL(url).pathname) || "/") !== "/";
	} catch {
		throw new BetterAuthError(`Invalid base URL: ${url}. Please provide a valid base URL.`);
	}
}
function assertHasProtocol(url) {
	try {
		const parsedUrl = new URL(url);
		if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") throw new BetterAuthError(`Invalid base URL: ${url}. URL must include 'http://' or 'https://'`);
	} catch (error) {
		if (error instanceof BetterAuthError) throw error;
		throw new BetterAuthError(`Invalid base URL: ${url}. Please provide a valid base URL.`, { cause: error });
	}
}
function withPath(url, path = "/api/auth") {
	assertHasProtocol(url);
	if (checkHasPath(url)) return url;
	const trimmedUrl = trimTrailingSlashes(url);
	if (!path || path === "/") return trimmedUrl;
	path = path.startsWith("/") ? path : `/${path}`;
	return `${trimmedUrl}${path}`;
}
function validateProxyHeader(header, type) {
	if (!header || header.trim() === "") return false;
	if (type === "proto") return header === "http" || header === "https";
	if (type === "host") {
		if ([
			/\.\./,
			/\0/,
			/[\s]/,
			/^[.]/,
			/[<>'"]/,
			/javascript:/i,
			/file:/i,
			/data:/i
		].some((pattern) => pattern.test(header))) return false;
		return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(:[0-9]{1,5})?$/.test(header) || /^(\d{1,3}\.){3}\d{1,3}(:[0-9]{1,5})?$/.test(header) || /^\[[0-9a-fA-F:]+\](:[0-9]{1,5})?$/.test(header) || /^localhost(:[0-9]{1,5})?$/i.test(header);
	}
	return false;
}
function getBaseURL(url, path, request, loadEnv, trustedProxyHeaders) {
	if (url) return withPath(url, path);
	if (loadEnv !== false) {
		const fromEnv = env.BETTER_AUTH_URL || env.NEXT_PUBLIC_BETTER_AUTH_URL || env.PUBLIC_BETTER_AUTH_URL || env.NUXT_PUBLIC_BETTER_AUTH_URL || env.NUXT_PUBLIC_AUTH_URL || (env.BASE_URL !== "/" ? env.BASE_URL : void 0);
		if (fromEnv) return withPath(fromEnv, path);
	}
	const fromRequest = request?.headers.get("x-forwarded-host");
	const fromRequestProto = request?.headers.get("x-forwarded-proto");
	if (fromRequest && fromRequestProto && trustedProxyHeaders) {
		if (validateProxyHeader(fromRequestProto, "proto") && validateProxyHeader(fromRequest, "host")) try {
			return withPath(`${fromRequestProto}://${fromRequest}`, path);
		} catch (_error) {}
	}
	if (request) {
		const url = getOrigin(request.url);
		if (!url) throw new BetterAuthError("Could not get origin from request. Please provide a valid base URL.");
		return withPath(url, path);
	}
	if (typeof window !== "undefined" && window.location) return withPath(window.location.origin, path);
}
function getOrigin(url) {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl.origin === "null" ? null : parsedUrl.origin;
	} catch {
		return null;
	}
}
function getProtocol(url) {
	try {
		return new URL(url).protocol;
	} catch {
		return null;
	}
}
function getHost(url) {
	try {
		return new URL(url).host;
	} catch {
		return null;
	}
}
/**
* Checks if the baseURL config is a dynamic config object
*/
function isDynamicBaseURLConfig(config) {
	return typeof config === "object" && config !== null && "allowedHosts" in config && Array.isArray(config.allowedHosts);
}
/**
* Check if a value is a `Request`
* - `instanceof`: works for native Request instances
* - `toString`: handles where instanceof check fails but the object is still a
*   valid Request (e.g. cross-realm, polyfills). Paired with a shape check so
*   an object that only spoofs `Symbol.toStringTag` without the real shape is
*   rejected before downstream code tries to read `.headers` / `.url`.
*
* @param value The value to check
* @returns `true` if the value is a Request instance
*/
function isRequestLike(value) {
	if (value instanceof Request) return true;
	if (typeof value !== "object" || value === null || Object.prototype.toString.call(value) !== "[object Request]") return false;
	const v = value;
	return typeof v.url === "string" && typeof v.headers === "object" && v.headers !== null && typeof v.headers.get === "function";
}
/**
* Extracts the host from a `Request` or `Headers`.
* Honors `x-forwarded-host` only when `trustedProxyHeaders` is enabled,
* then falls back to the `host` header and finally the request URL.
*/
function getHostFromSource(source, trustedProxyHeaders) {
	const headers = isRequestLike(source) ? source.headers : source;
	if (trustedProxyHeaders) {
		const forwardedHost = headers.get("x-forwarded-host");
		if (forwardedHost && validateProxyHeader(forwardedHost, "host")) return forwardedHost;
	}
	const host = headers.get("host");
	if (host && validateProxyHeader(host, "host")) return host;
	if (isRequestLike(source)) try {
		return new URL(source.url).host;
	} catch {
		return null;
	}
	return null;
}
/**
* Extracts the protocol from a `Request` or `Headers`.
* Honors `x-forwarded-proto` only when `trustedProxyHeaders` is enabled,
* then falls back to the request URL, then to "https".
*/
function getProtocolFromSource(source, configProtocol, trustedProxyHeaders) {
	if (configProtocol === "http" || configProtocol === "https") return configProtocol;
	const headers = isRequestLike(source) ? source.headers : source;
	if (trustedProxyHeaders) {
		const forwardedProto = headers.get("x-forwarded-proto");
		if (forwardedProto && validateProxyHeader(forwardedProto, "proto")) return forwardedProto;
	}
	if (isRequestLike(source)) try {
		const url = new URL(source.url);
		if (url.protocol === "http:" || url.protocol === "https:") return url.protocol.slice(0, -1);
	} catch {}
	const host = getHostFromSource(source, trustedProxyHeaders);
	if (host && isLoopbackForDevScheme(host)) return "http";
	return "https";
}
/**
* Matches a hostname against a host pattern.
* Supports wildcard patterns like `*.vercel.app` or `preview-*.myapp.com`.
*
* @param host The hostname to test (e.g., "myapp.com", "preview-123.vercel.app")
* @param pattern The host pattern (e.g., "myapp.com", "*.vercel.app")
* @returns {boolean} true if the host matches the pattern, false otherwise.
*
* @example
* ```ts
* matchesHostPattern("myapp.com", "myapp.com") // true
* matchesHostPattern("preview-123.vercel.app", "*.vercel.app") // true
* matchesHostPattern("preview-123.myapp.com", "preview-*.myapp.com") // true
* matchesHostPattern("evil.com", "myapp.com") // false
* ```
*/
var matchesHostPattern = (host, pattern) => {
	if (!host || !pattern) return false;
	const normalizedHost = host.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
	const normalizedPattern = pattern.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
	if (normalizedPattern.includes("*") || normalizedPattern.includes("?")) return wildcardMatch(normalizedPattern)(normalizedHost);
	return normalizedHost.toLowerCase() === normalizedPattern.toLowerCase();
};
/**
* Resolves the base URL from a dynamic config based on the incoming request.
* Validates the derived host against the allowedHosts allowlist.
*
* @param config The dynamic base URL config
* @param request The incoming request
* @param basePath The base path to append
* @returns The resolved base URL with path
* @throws BetterAuthError if host is not in allowedHosts and no fallback is set
*/
function resolveDynamicBaseURL(config, source, basePath, trustedProxyHeaders) {
	const host = getHostFromSource(source, trustedProxyHeaders);
	if (!host) {
		if (config.fallback) return withPath(config.fallback, basePath);
		throw new BetterAuthError("Could not determine host from request headers. Please provide a fallback URL in your baseURL config.");
	}
	if (config.allowedHosts.some((pattern) => matchesHostPattern(host, pattern))) return withPath(`${getProtocolFromSource(source, config.protocol, trustedProxyHeaders)}://${host}`, basePath);
	if (config.fallback) return withPath(config.fallback, basePath);
	throw new BetterAuthError(`Host "${host}" is not in the allowed hosts list. Allowed hosts: ${config.allowedHosts.join(", ")}. Add this host to your allowedHosts config or provide a fallback URL.`);
}
/**
* Resolves the base URL from any config type (static string or dynamic object).
* This is the main entry point for base URL resolution.
*
* @param config The base URL config (string or object)
* @param basePath The base path to append
* @param request Optional request for dynamic resolution
* @param loadEnv Whether to load from environment variables
* @param trustedProxyHeaders Whether to trust proxy headers (for legacy behavior)
* @returns The resolved base URL with path
*/
function resolveBaseURL(config, basePath, source, loadEnv, trustedProxyHeaders) {
	if (isDynamicBaseURLConfig(config)) {
		if (source) return resolveDynamicBaseURL(config, source, basePath, trustedProxyHeaders);
		if (config.fallback) return withPath(config.fallback, basePath);
		return getBaseURL(void 0, basePath, void 0, loadEnv, trustedProxyHeaders);
	}
	const request = isRequestLike(source) ? source : void 0;
	if (typeof config === "string") return getBaseURL(config, basePath, request, loadEnv, trustedProxyHeaders);
	return getBaseURL(void 0, basePath, request, loadEnv, trustedProxyHeaders);
}
var generateRandomString = createRandomStringGenerator("a-z", "0-9", "A-Z", "-_");
async function signJWT(payload, secret, expiresIn = 3600) {
	return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(Math.floor(Date.now() / 1e3) + expiresIn).sign(new TextEncoder().encode(secret));
}
async function verifyJWT(token, secret) {
	try {
		return (await jwtVerify(token, new TextEncoder().encode(secret))).payload;
	} catch {
		return null;
	}
}
var info = new Uint8Array([
	66,
	101,
	116,
	116,
	101,
	114,
	65,
	117,
	116,
	104,
	46,
	106,
	115,
	32,
	71,
	101,
	110,
	101,
	114,
	97,
	116,
	101,
	100,
	32,
	69,
	110,
	99,
	114,
	121,
	112,
	116,
	105,
	111,
	110,
	32,
	75,
	101,
	121
]);
var now = () => Date.now() / 1e3 | 0;
var alg = "dir";
var enc = "A256CBC-HS512";
function deriveEncryptionSecret(secret, salt) {
	return hkdf(sha256, new TextEncoder().encode(secret), new TextEncoder().encode(salt), info, 64);
}
function getCurrentSecret(secret) {
	if (typeof secret === "string") return secret;
	const value = secret.keys.get(secret.currentVersion);
	if (!value) throw new Error(`Secret version ${secret.currentVersion} not found in keys`);
	return value;
}
function getAllSecrets(secret) {
	if (typeof secret === "string") return [{
		version: 0,
		value: secret
	}];
	const result = [];
	for (const [version, value] of secret.keys) result.push({
		version,
		value
	});
	if (secret.legacySecret && !result.some((s) => s.value === secret.legacySecret)) result.push({
		version: -1,
		value: secret.legacySecret
	});
	return result;
}
async function symmetricEncodeJWT(payload, secret, salt, expiresIn = 3600) {
	const encryptionSecret = deriveEncryptionSecret(getCurrentSecret(secret), salt);
	const thumbprint = await calculateJwkThumbprint({
		kty: "oct",
		k: encode(encryptionSecret)
	}, "sha256");
	return await new EncryptJWT(payload).setProtectedHeader({
		alg,
		enc,
		kid: thumbprint
	}).setIssuedAt().setExpirationTime(now() + expiresIn).setJti(crypto.randomUUID()).encrypt(encryptionSecret);
}
var jwtDecryptOpts = {
	clockTolerance: 15,
	keyManagementAlgorithms: [alg],
	contentEncryptionAlgorithms: [enc, "A256GCM"]
};
async function symmetricDecodeJWT(token, secret, salt) {
	if (!token) return null;
	let hasKid = false;
	try {
		hasKid = decodeProtectedHeader(token).kid !== void 0;
	} catch {
		return null;
	}
	try {
		const secrets = getAllSecrets(secret);
		const { payload } = await jwtDecrypt(token, async (protectedHeader) => {
			const kid = protectedHeader.kid;
			if (kid !== void 0) {
				for (const s of secrets) {
					const encryptionSecret = deriveEncryptionSecret(s.value, salt);
					if (kid === await calculateJwkThumbprint({
						kty: "oct",
						k: encode(encryptionSecret)
					}, "sha256")) return encryptionSecret;
				}
				throw new Error("no matching decryption secret");
			}
			if (secrets.length === 1) return deriveEncryptionSecret(secrets[0].value, salt);
			return deriveEncryptionSecret(secrets[0].value, salt);
		}, jwtDecryptOpts);
		return payload;
	} catch {
		if (hasKid) return null;
		const secrets = getAllSecrets(secret);
		if (secrets.length <= 1) return null;
		for (let i = 1; i < secrets.length; i++) try {
			const s = secrets[i];
			const { payload } = await jwtDecrypt(token, deriveEncryptionSecret(s.value, salt), jwtDecryptOpts);
			return payload;
		} catch {
			continue;
		}
		return null;
	}
}
/**
* Compare two buffers in constant time.
*/
function constantTimeEqual(a, b) {
	if (typeof a === "string") a = new TextEncoder().encode(a);
	if (typeof b === "string") b = new TextEncoder().encode(b);
	const aBuffer = new Uint8Array(a);
	const bBuffer = new Uint8Array(b);
	let c = aBuffer.length ^ bBuffer.length;
	const length = Math.max(aBuffer.length, bBuffer.length);
	for (let i = 0; i < length; i++) c |= (i < aBuffer.length ? aBuffer[i] : 0) ^ (i < bBuffer.length ? bBuffer[i] : 0);
	return c === 0;
}
/**
* `@better-auth/utils/password` uses the "node" export condition in package.json
* to automatically pick the right implementation:
*   - Node.js / Bun / Deno → `node:crypto scrypt` (libuv thread pool, non-blocking)
*   - Unsupported runtimes → `@noble/hashes scrypt` (pure JS fallback)
*/
var hashPassword$1 = hashPassword;
var verifyPassword$1$1 = async ({ hash, password }) => {
	return verifyPassword(hash, password);
};
var ENVELOPE_PREFIX = "$ba$";
function parseEnvelope(data) {
	if (!data.startsWith(ENVELOPE_PREFIX)) return null;
	const firstSep = 4;
	const secondSep = data.indexOf("$", firstSep);
	if (secondSep === -1) return null;
	const version = parseInt(data.slice(firstSep, secondSep), 10);
	if (!Number.isInteger(version) || version < 0) return null;
	return {
		version,
		ciphertext: data.slice(secondSep + 1)
	};
}
function formatEnvelope(version, ciphertext) {
	return `${ENVELOPE_PREFIX}${version}$${ciphertext}`;
}
async function rawEncrypt(secret, data) {
	const keyAsBytes = await createHash("SHA-256").digest(secret);
	const dataAsBytes = utf8ToBytes$1(data);
	return bytesToHex$1(managedNonce(xchacha20poly1305)(new Uint8Array(keyAsBytes)).encrypt(dataAsBytes));
}
async function rawDecrypt(secret, hex) {
	const keyAsBytes = await createHash("SHA-256").digest(secret);
	const dataAsBytes = hexToBytes(hex);
	const chacha = managedNonce(xchacha20poly1305)(new Uint8Array(keyAsBytes));
	return new TextDecoder().decode(chacha.decrypt(dataAsBytes));
}
var symmetricEncrypt = async ({ key, data }) => {
	if (typeof key === "string") return rawEncrypt(key, data);
	const secret = key.keys.get(key.currentVersion);
	if (!secret) throw new Error(`Secret version ${key.currentVersion} not found in keys`);
	const ciphertext = await rawEncrypt(secret, data);
	return formatEnvelope(key.currentVersion, ciphertext);
};
var symmetricDecrypt = async ({ key, data }) => {
	if (typeof key === "string") return rawDecrypt(key, data);
	const envelope = parseEnvelope(data);
	if (envelope) {
		const secret = key.keys.get(envelope.version);
		if (!secret) throw new Error(`Secret version ${envelope.version} not found in keys (key may have been retired)`);
		return rawDecrypt(secret, envelope.ciphertext);
	}
	if (key.legacySecret) return rawDecrypt(key.legacySecret, data);
	throw new Error("Cannot decrypt legacy bare-hex payload: no legacy secret available. Set BETTER_AUTH_SECRET for backwards compatibility.");
};
function hasServerSessionStore(options) {
	return !!options.database || !!options.secondaryStorage;
}
function hasServerAccountStore(options) {
	return !!options.database;
}
function shouldBindAccountCookieToSessionUser(options) {
	return hasServerAccountStore(options);
}
var cache = /* @__PURE__ */ new WeakMap();
function getFields(options, modelName, mode) {
	const cacheKey = `${modelName}:${mode}`;
	if (!cache.has(options)) cache.set(options, /* @__PURE__ */ new Map());
	const tableCache = cache.get(options);
	if (tableCache.has(cacheKey)) return tableCache.get(cacheKey);
	const coreSchema = mode === "output" ? getAuthTables(options)[modelName]?.fields ?? {} : {};
	const additionalFields = modelName === "user" || modelName === "session" || modelName === "account" ? options[modelName]?.additionalFields : void 0;
	let schema = {
		...coreSchema,
		...additionalFields ?? {}
	};
	for (const plugin of options.plugins || []) if (plugin.schema && plugin.schema[modelName]) schema = {
		...schema,
		...plugin.schema[modelName].fields
	};
	tableCache.set(cacheKey, schema);
	return schema;
}
function parseUserOutput(options, user) {
	return filterOutputFields(user, getFields(options, "user", "output"));
}
/**
* Builds a synthetic user object that matches the shape of a real user
* returned from the database. This ensures enumeration protection works
* correctly by making synthetic and real user responses indistinguishable.
*
* The function iterates over the user output schema and:
* - Includes all fields that should be returned (returned !== false)
* - Uses provided values when available
* - Sets optional fields to null when no value is provided
* - Applies default values where defined
* - Always includes the 'id' field (not part of schema but always present)
*/
function buildSyntheticUserOutput(options, data) {
	const schema = getFields(options, "user", "output");
	const result = {};
	for (const key in schema) {
		const fieldAttr = schema[key];
		if (fieldAttr.returned === false) continue;
		if (key in data && data[key] !== void 0) result[key] = data[key];
		else if (fieldAttr.defaultValue !== void 0) result[key] = typeof fieldAttr.defaultValue === "function" ? fieldAttr.defaultValue() : fieldAttr.defaultValue;
		else if (!fieldAttr.required) result[key] = null;
	}
	if ("id" in data) result.id = data.id;
	return result;
}
function parseSessionOutput(options, session) {
	return filterOutputFields(session, getFields(options, "session", "output"));
}
function parseAccountOutput(options, account) {
	const { accessToken: _accessToken, refreshToken: _refreshToken, idToken: _idToken, accessTokenExpiresAt: _accessTokenExpiresAt, refreshTokenExpiresAt: _refreshTokenExpiresAt, password: _password, ...rest } = filterOutputFields(account, getFields(options, "account", "output"));
	return rest;
}
function parseInputData(data, schema) {
	const action = schema.action || "create";
	const fields = schema.fields;
	const parsedData = Object.create(null);
	for (const key in fields) {
		if (key in data) {
			if (fields[key].input === false) {
				if (fields[key].defaultValue !== void 0) {
					if (action !== "update") {
						parsedData[key] = fields[key].defaultValue;
						continue;
					}
				}
				if (data[key]) throw APIError.from("BAD_REQUEST", {
					...BASE_ERROR_CODES.FIELD_NOT_ALLOWED,
					message: `${key} is not allowed to be set`
				});
				continue;
			}
			if (fields[key].validator?.input && data[key] !== void 0) {
				const result = fields[key].validator.input["~standard"].validate(data[key]);
				if (result instanceof Promise) throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.ASYNC_VALIDATION_NOT_SUPPORTED);
				if ("issues" in result && result.issues) throw APIError.from("BAD_REQUEST", {
					...BASE_ERROR_CODES.VALIDATION_ERROR,
					message: result.issues[0]?.message || "Validation Error"
				});
				parsedData[key] = result.value;
				continue;
			}
			if (fields[key].transform?.input && data[key] !== void 0) {
				parsedData[key] = fields[key].transform?.input(data[key]);
				continue;
			}
			parsedData[key] = data[key];
			continue;
		}
		if (fields[key].defaultValue !== void 0 && action === "create") {
			if (typeof fields[key].defaultValue === "function") {
				parsedData[key] = fields[key].defaultValue();
				continue;
			}
			parsedData[key] = fields[key].defaultValue;
			continue;
		}
		if (fields[key].required && action === "create") throw APIError.from("BAD_REQUEST", {
			...BASE_ERROR_CODES.MISSING_FIELD,
			message: `${key} is required`
		});
	}
	return parsedData;
}
function parseUserInput(options, user = {}, action) {
	return parseInputData(user, {
		fields: getFields(options, "user", "input"),
		action
	});
}
function parseAdditionalUserInputFromProviderProfile(options, profile = {}, action) {
	const schema = getFields(options, "user", "input");
	const allowedProfileFields = Object.create(null);
	for (const key of Object.keys(profile)) {
		if (schema[key]?.input === false) continue;
		allowedProfileFields[key] = profile[key];
	}
	return parseInputData(allowedProfileFields, {
		fields: schema,
		action
	});
}
function parseSessionInput(options, session, action) {
	return parseInputData(session, {
		fields: getFields(options, "session", "input"),
		action
	});
}
function getSessionDefaultFields(options) {
	const fields = getFields(options, "session", "input");
	const defaults = {};
	for (const key in fields) if (fields[key].defaultValue !== void 0) defaults[key] = typeof fields[key].defaultValue === "function" ? fields[key].defaultValue() : fields[key].defaultValue;
	return defaults;
}
var getDate = (span, unit = "ms") => {
	return new Date(Date.now() + (unit === "sec" ? span * 1e3 : span));
};
function isPromise(obj) {
	return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";
}
var SEC = 1e3;
var MIN = SEC * 60;
var HOUR = MIN * 60;
var DAY = HOUR * 24;
var WEEK = DAY * 7;
var MONTH = DAY * 30;
var YEAR = DAY * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|months?|mo|years?|yrs?|y)(?: (ago|from now))?$/i;
function parse(value) {
	const match = REGEX.exec(value);
	if (!match || match[4] && match[1]) throw new TypeError(`Invalid time string format: "${value}". Use formats like "7d", "30m", "1 hour", etc.`);
	const n = parseFloat(match[2]);
	const unit = match[3].toLowerCase();
	let result;
	switch (unit) {
		case "years":
		case "year":
		case "yrs":
		case "yr":
		case "y":
			result = n * YEAR;
			break;
		case "months":
		case "month":
		case "mo":
			result = n * MONTH;
			break;
		case "weeks":
		case "week":
		case "w":
			result = n * WEEK;
			break;
		case "days":
		case "day":
		case "d":
			result = n * DAY;
			break;
		case "hours":
		case "hour":
		case "hrs":
		case "hr":
		case "h":
			result = n * HOUR;
			break;
		case "minutes":
		case "minute":
		case "mins":
		case "min":
		case "m":
			result = n * MIN;
			break;
		case "seconds":
		case "second":
		case "secs":
		case "sec":
		case "s":
			result = n * SEC;
			break;
		default: throw new TypeError(`Unknown time unit: "${unit}"`);
	}
	if (match[1] === "-" || match[4] === "ago") return -result;
	return result;
}
/**
* Parse a time string and return the value in seconds.
*
* @param value - A time string like "7d", "30m", "1 hour", "2 hours ago"
* @returns The parsed value in seconds (rounded)
* @throws TypeError if the string format is invalid
*
* @example
* sec("1d")          // 86400
* sec("2 hours")     // 7200
* sec("-30s")        // -30
* sec("2 hours ago") // -7200
*/
function sec(value) {
	return Math.round(parse(value) / 1e3);
}
var cookieCachePayloadSchema = looseObject({
	session: sessionSchema.loose(),
	user: userSchema.loose(),
	updatedAt: number(),
	version: string().optional()
});
var compactCookieCacheSchema = object({
	session: record(string(), unknown()),
	expiresAt: number(),
	signature: string()
});
function parseCookieCachePayload(value) {
	const parsed = safeJSONParse(value);
	if (parsed === null) return null;
	const result = cookieCachePayloadSchema.safeParse(parsed);
	if (result.success) return result.data;
	logger.warn("Cookie cache payload failed schema validation", { issues: result.error.issues.map(({ code, path }) => ({
		code,
		path
	})) });
	return null;
}
function parseCompactCookieCache(value) {
	const result = compactCookieCacheSchema.safeParse(value);
	return result.success ? result.data : null;
}
function tryDecode$1(str) {
	if (str.indexOf("%") === -1) return str;
	try {
		return decodeURIComponent(str);
	} catch {
		return str;
	}
}
var SECURE_COOKIE_PREFIX = "__Secure-";
/**
* Split a comma-joined `Set-Cookie` header string into individual cookies.
*/
function splitSetCookieHeader(setCookie) {
	if (!setCookie) return [];
	const result = [];
	let start = 0;
	let i = 0;
	while (i < setCookie.length) {
		if (setCookie[i] === ",") {
			let j = i + 1;
			while (j < setCookie.length && setCookie[j] === " ") j++;
			while (j < setCookie.length && setCookie[j] !== "=" && setCookie[j] !== ";" && setCookie[j] !== ",") j++;
			if (j < setCookie.length && setCookie[j] === "=") {
				const part = setCookie.slice(start, i).trim();
				if (part) result.push(part);
				start = i + 1;
				while (start < setCookie.length && setCookie[start] === " ") start++;
				i = start;
				continue;
			}
		}
		i++;
	}
	const last = setCookie.slice(start).trim();
	if (last) result.push(last);
	return result;
}
function parseSetCookieHeader(setCookie) {
	const cookies = /* @__PURE__ */ new Map();
	splitSetCookieHeader(setCookie).forEach((cookieString) => {
		const [nameValue, ...attributes] = cookieString.split(";").map((part) => part.trim());
		const [name, ...valueParts] = (nameValue || "").split("=");
		const value = unquoteCookieValue(valueParts.join("="));
		if (!name) return;
		const attrObj = { value: tryDecode$1(value) };
		attributes.forEach((attribute) => {
			const [attrName, ...attrValueParts] = attribute.split("=");
			const attrValue = attrValueParts.join("=");
			const normalizedAttrName = attrName.trim().toLowerCase();
			switch (normalizedAttrName) {
				case "max-age":
					attrObj["max-age"] = attrValue ? parseInt(attrValue.trim(), 10) : void 0;
					break;
				case "expires":
					attrObj.expires = attrValue ? new Date(attrValue.trim()) : void 0;
					break;
				case "domain":
					attrObj.domain = attrValue ? attrValue.trim() : void 0;
					break;
				case "path":
					attrObj.path = attrValue ? attrValue.trim() : void 0;
					break;
				case "secure":
					attrObj.secure = true;
					break;
				case "httponly":
					attrObj.httponly = true;
					break;
				case "samesite":
					attrObj.samesite = attrValue ? attrValue.trim().toLowerCase() : void 0;
					break;
				case "partitioned":
					attrObj.partitioned = true;
					break;
				default: attrObj[normalizedAttrName] = attrValue ? attrValue.trim() : true;
			}
		});
		cookies.set(name, attrObj);
	});
	return cookies;
}
function toCookieOptions(attributes) {
	return {
		maxAge: attributes["max-age"],
		expires: attributes.expires,
		domain: attributes.domain,
		path: attributes.path,
		secure: attributes.secure,
		httpOnly: attributes.httponly,
		sameSite: attributes.samesite,
		partitioned: attributes.partitioned
	};
}
/**
* Cookie-name token char set per RFC 7230 §3.2.6.
*
* @see https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.6
*/
var cookieNameRegex = /^[\x21\x23-\x27\x2A\x2B\x2D\x2E\x30-\x39\x41-\x5A\x5E\x5F\x60\x61-\x7A\x7C\x7E]+$/;
/**
* Cookie-value char set per RFC 6265 §4.1.1, plus space and comma.
*
* @see https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1
* @see https://github.com/golang/go/issues/7243
*/
var cookieValueRegex = /^[\x20\x21\x23-\x3A\x3C-\x5B\x5D-\x7E]*$/;
/**
* Strip surrounding double-quotes per RFC 6265 §4.1.1 quoted-string form.
*
* @see https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1
*/
function unquoteCookieValue(value) {
	if (value.length < 2 || !value.startsWith("\"") || !value.endsWith("\"")) return value;
	return value.slice(1, -1);
}
/**
* Trim leading/trailing OWS (space / horizontal tab) per RFC 7230 §3.2.3.
* Narrower than `String.prototype.trim()`, which strips CR/LF and other
* whitespace and would let CTLs escape `cookieValueRegex`.
*
* @see https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.3
*/
function trimOWS(s) {
	let start = 0;
	let end = s.length;
	while (start < end) {
		const c = s.charCodeAt(start);
		if (c !== 32 && c !== 9) break;
		start++;
	}
	while (end > start) {
		const c = s.charCodeAt(end - 1);
		if (c !== 32 && c !== 9) break;
		end--;
	}
	return start === 0 && end === s.length ? s : s.slice(start, end);
}
/**
* Tolerates `;` separators without the SP that RFC 6265 §4.2.1 mandates,
* since proxies and runtimes commonly strip it. Silently drops entries
* whose name violates RFC 7230 token or whose value violates RFC 6265
* cookie-octet (plus space and comma). Strips optional surrounding
* double-quotes per RFC 6265 §4.1.1.
*/
function parseCookies(cookie) {
	const cookieMap = /* @__PURE__ */ new Map();
	if (cookie.length < 2) return cookieMap;
	for (const chunk of cookie.split(";")) {
		const eq = chunk.indexOf("=");
		if (eq === -1) continue;
		const key = trimOWS(chunk.slice(0, eq));
		const val = unquoteCookieValue(trimOWS(chunk.slice(eq + 1)));
		if (cookieNameRegex.test(key) && cookieValueRegex.test(val)) cookieMap.set(key, tryDecode$1(val));
	}
	return cookieMap;
}
/**
* Add or replace a cookie in the request `Cookie` header.
*
* Cookie pairs are joined with `; `, but `headers.append("cookie", ...)`
* joins with `, ` in some runtimes (e.g. Deno, Cloudflare Workers) and
* breaks downstream cookie parsing. This builds the header value via
* parse-mutate-serialize.
*/
function setRequestCookie(headers, name, value) {
	const cookieMap = parseCookies(headers.get("cookie") || "");
	if (cookieNameRegex.test(name)) cookieMap.set(name, value);
	headers.set("cookie", Array.from(cookieMap, ([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; "));
}
/**
* Per-cookie byte ceiling.
* Safari's ~4093 floor is the lowest among browsers.
* Kept a little under it for attributes added after sizing.
*
* @see https://datatracker.ietf.org/doc/html/rfc6265#section-6.1
* @see https://github.com/dotnet/aspnetcore/blob/aa5493528640932601bb82ef3295e4d8ca7e11c5/src/Shared/ChunkingCookieManager/ChunkingCookieManager.cs#L40
*/
var MAX_COOKIE_SIZE = 4050;
/**
* Max chunks per cookie.
* A larger value does not belong in a cookie.
*/
var MAX_COOKIE_CHUNKS = 100;
/**
* Largest value that keeps the serialized cookie within {@link MAX_COOKIE_SIZE},
* measured with the real `serializeCookie` writer so it stays in sync with the
* wire. Non-positive when the name and attributes alone overflow.
*/
function getMaxCookieValueSize(name, options) {
	return MAX_COOKIE_SIZE - serializeCookie(name, "", { ...options }).length;
}
function parseCookieChunkIndex(cookieName, name) {
	const prefix = `${cookieName}.`;
	if (!name.startsWith(prefix)) return null;
	const suffix = name.slice(prefix.length);
	const index = Number(suffix);
	if (!Number.isSafeInteger(index) || index < 0 || String(index) !== suffix) return null;
	return index;
}
/**
* Read all existing chunks from cookies
*/
function readExistingChunks(cookieName, ctx) {
	const chunks = {};
	const cookies = parseCookies(ctx.headers?.get("cookie") || "");
	for (const [name, value] of cookies) {
		if (name !== cookieName && parseCookieChunkIndex(cookieName, name) === null) continue;
		chunks[name] = value;
	}
	return chunks;
}
/**
* Split a cookie value into chunks if needed
*/
function chunkCookie(storeName, cookie, chunks, logger) {
	const chunkSize = getMaxCookieValueSize(`${cookie.name}.99`, cookie.attributes);
	const chunkCount = chunkSize > 0 ? Math.ceil(cookie.value.length / chunkSize) : Infinity;
	if (chunkCount <= 1) {
		chunks[cookie.name] = cookie.value;
		return [cookie];
	}
	if (chunkCount > MAX_COOKIE_CHUNKS) {
		logger.warn(`${storeName} cookie is too large to store even after chunking, so the cookie cache was skipped. Reduce the cached data size or avoid storing this data in cookies.`);
		return [];
	}
	const cookies = [];
	for (let i = 0; i < chunkCount; i++) {
		const name = `${cookie.name}.${i}`;
		const start = i * chunkSize;
		const value = cookie.value.substring(start, start + chunkSize);
		cookies.push({
			...cookie,
			name,
			value
		});
		chunks[name] = value;
	}
	logger.debug(`CHUNKING_${storeName.toUpperCase()}_COOKIE`, {
		message: `${storeName} cookie exceeds the ${MAX_COOKIE_SIZE} byte limit and was split into ${chunkCount} chunks.`,
		valueSize: cookie.value.length,
		chunkCount,
		chunkSizes: cookies.map((c) => c.value.length)
	});
	return cookies;
}
/**
* Get all cookies that should be cleaned (removed)
*/
function getCleanCookies(chunks, cookieOptions) {
	const cleanedChunks = {};
	for (const name in chunks) cleanedChunks[name] = {
		name,
		value: "",
		attributes: {
			...cookieOptions,
			maxAge: 0
		}
	};
	return cleanedChunks;
}
/**
* Store that splits a cookie into numbered chunks when its serialized form
* would exceed the per-cookie byte limit, expiring stale chunks as needed.
*
* @see https://github.com/nextauthjs/next-auth/blob/27b2519b84b8eb9cf053775dea29d577d2aa0098/packages/next-auth/src/core/lib/cookie.ts
*/
var storeFactory = (storeName) => (cookieName, cookieOptions, ctx) => {
	const chunks = readExistingChunks(cookieName, ctx);
	const logger = ctx.context.logger;
	const expireExistingChunks = () => {
		const expired = getCleanCookies(chunks, cookieOptions);
		for (const name in chunks) delete chunks[name];
		return expired;
	};
	return {
		chunk(value, options) {
			const cookies = expireExistingChunks();
			const chunked = chunkCookie(storeName, {
				name: cookieName,
				value,
				attributes: {
					...cookieOptions,
					...options
				}
			}, chunks, logger);
			for (const chunk of chunked) cookies[chunk.name] = chunk;
			return Object.values(cookies);
		},
		clean() {
			return Object.values(expireExistingChunks());
		},
		setCookies(cookies) {
			for (const cookie of cookies) ctx.setCookie(cookie.name, cookie.value, cookie.attributes);
		}
	};
};
var createSessionStore = storeFactory("Session");
var createAccountStore = storeFactory("Account");
function getChunkedCookie(ctx, cookieName) {
	const value = ctx.getCookie(cookieName);
	if (value) return value;
	const chunks = [];
	const cookieHeader = ctx.headers?.get("cookie");
	if (!cookieHeader) return null;
	for (const [name, val] of parseCookies(cookieHeader)) {
		const index = parseCookieChunkIndex(cookieName, name);
		if (index === null) continue;
		chunks.push({
			index,
			value: val
		});
	}
	if (chunks.length > 0) {
		chunks.sort((a, b) => a.index - b.index);
		return chunks.map((c) => c.value).join("");
	}
	return null;
}
async function setAccountCookie(c, accountData) {
	const accountDataCookie = c.context.authCookies.accountData;
	const options = {
		maxAge: 300,
		...accountDataCookie.attributes
	};
	const data = await symmetricEncodeJWT(accountData, c.context.secretConfig, "better-auth-account", options.maxAge);
	const accountStore = createAccountStore(accountDataCookie.name, options, c);
	accountStore.setCookies(accountStore.chunk(data, options));
}
async function getAccountCookie(c) {
	const accountCookie = getChunkedCookie(c, c.context.authCookies.accountData.name);
	if (accountCookie) {
		const accountData = safeJSONParse(await symmetricDecodeJWT(accountCookie, c.context.secretConfig, "better-auth-account"));
		if (accountData) return accountData;
	}
	return null;
}
var getSessionQuerySchema = optional(object({
	/**
	* If cookie cache is enabled, it will disable the cache
	* and fetch the session from the database
	*/
	disableCookieCache: boolean().meta({ description: "Disable cookie cache and fetch session from database" }).optional(),
	disableRefresh: boolean().meta({ description: "Disable session refresh. Useful for checking session status, without updating the session" }).optional()
}));
function createCookieGetter(options) {
	const baseURLString = typeof options.baseURL === "string" ? options.baseURL : void 0;
	const dynamicProtocol = typeof options.baseURL === "object" && options.baseURL !== null ? options.baseURL.protocol : void 0;
	const secureCookiePrefix = (options.advanced?.useSecureCookies !== void 0 ? options.advanced?.useSecureCookies : dynamicProtocol === "https" ? true : dynamicProtocol === "http" ? false : baseURLString ? baseURLString.startsWith("https://") : isProduction) ? SECURE_COOKIE_PREFIX : "";
	const crossSubdomainEnabled = !!options.advanced?.crossSubDomainCookies?.enabled;
	const domain = crossSubdomainEnabled ? options.advanced?.crossSubDomainCookies?.domain || (baseURLString ? new URL(baseURLString).hostname : void 0) : void 0;
	if (crossSubdomainEnabled && !domain && !isDynamicBaseURLConfig(options.baseURL)) throw new BetterAuthError("baseURL is required when crossSubdomainCookies are enabled.");
	function createCookie(cookieName, overrideAttributes = {}) {
		const prefix = options.advanced?.cookiePrefix || "better-auth";
		const name = options.advanced?.cookies?.[cookieName]?.name || `${prefix}.${cookieName}`;
		const attributes = options.advanced?.cookies?.[cookieName]?.attributes ?? {};
		return {
			name: `${secureCookiePrefix}${name}`,
			attributes: {
				secure: !!secureCookiePrefix,
				sameSite: "lax",
				path: "/",
				httpOnly: true,
				...crossSubdomainEnabled ? { domain } : {},
				...options.advanced?.defaultCookieAttributes,
				...overrideAttributes,
				...attributes
			}
		};
	}
	return createCookie;
}
function getCookies(options) {
	const createCookie = createCookieGetter(options);
	const sessionToken = createCookie("session_token", { maxAge: options.session?.expiresIn || sec("7d") });
	const sessionData = createCookie("session_data", { maxAge: options.session?.cookieCache?.maxAge || 300 });
	const accountData = createCookie("account_data", { maxAge: options.session?.cookieCache?.maxAge || 300 });
	const dontRememberToken = createCookie("dont_remember");
	return {
		sessionToken: {
			name: sessionToken.name,
			attributes: sessionToken.attributes
		},
		/**
		* This cookie is used to store the session data in the cookie
		* This is useful for when you want to cache the session in the cookie
		*/
		sessionData: {
			name: sessionData.name,
			attributes: sessionData.attributes
		},
		dontRememberToken: {
			name: dontRememberToken.name,
			attributes: dontRememberToken.attributes
		},
		accountData: {
			name: accountData.name,
			attributes: accountData.attributes
		}
	};
}
async function setCookieCache(ctx, session, dontRememberMe) {
	if (!ctx.context.options.session?.cookieCache?.enabled) return;
	const filteredSession = filterOutputFields(session.session, ctx.context.options.session?.additionalFields);
	const filteredUser = parseUserOutput(ctx.context.options, session.user);
	const versionConfig = ctx.context.options.session?.cookieCache?.version;
	let version = "1";
	if (versionConfig) {
		if (typeof versionConfig === "string") version = versionConfig;
		else if (typeof versionConfig === "function") {
			const result = versionConfig(session.session, session.user);
			version = isPromise(result) ? await result : result;
		}
	}
	const sessionData = {
		session: filteredSession,
		user: filteredUser,
		updatedAt: Date.now(),
		version
	};
	const options = {
		...ctx.context.authCookies.sessionData.attributes,
		maxAge: dontRememberMe ? void 0 : ctx.context.authCookies.sessionData.attributes.maxAge
	};
	const expiresAtDate = getDate(options.maxAge || 60, "sec").getTime();
	const strategy = ctx.context.options.session?.cookieCache?.strategy || "compact";
	let data;
	if (strategy === "jwe") data = await symmetricEncodeJWT(sessionData, ctx.context.secretConfig, "better-auth-session", options.maxAge || 300);
	else if (strategy === "jwt") {
		const cookieCacheSigner = ctx.context.sessionConfig.cookieCacheSigner;
		data = cookieCacheSigner ? await cookieCacheSigner.sign(ctx, sessionData, options.maxAge || 300) : await signJWT(sessionData, ctx.context.secret, options.maxAge || 300);
	} else data = base64Url.encode(JSON.stringify({
		session: sessionData,
		expiresAt: expiresAtDate,
		signature: await createHMAC("SHA-256", "base64urlnopad").sign(ctx.context.secret, JSON.stringify({
			...sessionData,
			expiresAt: expiresAtDate
		}))
	}), { padding: false });
	const sessionStore = createSessionStore(ctx.context.authCookies.sessionData.name, options, ctx);
	sessionStore.setCookies(sessionStore.chunk(data, options));
	if (ctx.context.options.account?.storeAccountCookie && !hasPendingSetCookie(ctx, ctx.context.authCookies.accountData.name)) {
		const accountData = await getAccountCookie(ctx);
		if (accountData) if (!shouldBindAccountCookieToSessionUser(ctx.context.options) || accountData.userId === session.user.id) await setAccountCookie(ctx, accountData);
		else {
			expireCookie(ctx, ctx.context.authCookies.accountData);
			const accountStore = createAccountStore(ctx.context.authCookies.accountData.name, ctx.context.authCookies.accountData.attributes, ctx);
			accountStore.setCookies(accountStore.clean());
		}
	}
}
async function decodeCookieCache(ctx, value) {
	const strategy = ctx.context.options.session?.cookieCache?.strategy || "compact";
	if (strategy === "jwe") {
		const decoded = await symmetricDecodeJWT(value, ctx.context.secretConfig, "better-auth-session");
		const payload = parseCookieCachePayload(decoded);
		if (!payload) return null;
		return {
			session: payload,
			expiresAt: decoded?.exp ? decoded.exp * 1e3 : Date.now()
		};
	}
	if (strategy === "jwt") {
		const cookieCacheSigner = ctx.context.sessionConfig.cookieCacheSigner;
		if (cookieCacheSigner) {
			const verified = await cookieCacheSigner.verify(ctx, value);
			if (!verified) return null;
			return {
				session: verified.payload,
				expiresAt: verified.expiresAt
			};
		}
		const decoded = await verifyJWT(value, ctx.context.secret);
		const payload = parseCookieCachePayload(decoded);
		if (!payload) return null;
		return {
			session: payload,
			expiresAt: decoded?.exp ? decoded.exp * 1e3 : Date.now()
		};
	}
	const parsed = parseCompactCookieCache(safeJSONParse(binary.decode(base64Url.decode(value))));
	if (!parsed) return null;
	if (!await createHMAC("SHA-256", "base64urlnopad").verify(ctx.context.secret, JSON.stringify({
		...parsed.session,
		expiresAt: parsed.expiresAt
	}), parsed.signature)) return null;
	const payload = parseCookieCachePayload(parsed.session);
	return payload ? {
		session: payload,
		expiresAt: parsed.expiresAt
	} : null;
}
async function setSessionCookie(ctx, session, dontRememberMe, overrides) {
	const dontRememberMeCookie = await ctx.getSignedCookie(ctx.context.authCookies.dontRememberToken.name, ctx.context.secret);
	dontRememberMe = dontRememberMe !== void 0 ? dontRememberMe : !!dontRememberMeCookie;
	const options = ctx.context.authCookies.sessionToken.attributes;
	const maxAge = dontRememberMe ? void 0 : ctx.context.sessionConfig.expiresIn;
	await ctx.setSignedCookie(ctx.context.authCookies.sessionToken.name, session.session.token, ctx.context.secret, {
		...options,
		maxAge,
		...overrides
	});
	if (dontRememberMe) await ctx.setSignedCookie(ctx.context.authCookies.dontRememberToken.name, "true", ctx.context.secret, ctx.context.authCookies.dontRememberToken.attributes);
	await setCookieCache(ctx, session, dontRememberMe);
	ctx.context.setNewSession(session);
}
/**
* Remove any prior `Set-Cookie` entries on the current response whose cookie
* name matches `cookieName` or any chunked variant (`${cookieName}.0`, etc.).
*
* Prevents a valid cookie value from leaking on the wire when the same cookie
* is set and then expired within a single request (e.g. `/sign-in/email`
* writes credential session cookies and the 2FA after-hook expires them).
* Browsers honor the expiring entry, but anything reading the raw response
* headers — proxy/LB logs, server-side SDK consumers, observability tools —
* sees the earlier valid value and could replay it (bypassing the 2FA gate
* when the cookie cache is enabled).
*
* Scrubs both the local middleware scope's `responseHeaders` and the outer
* endpoint scope's `ctx.context.responseHeaders`, because plugin after-hooks
* run in a fresh local scope while accumulated response headers live on the
* outer one. `scoped.context` is required by {@link GenericEndpointContext}
* but unit-test mocks pass a minimal object via `as any`, so we use optional
* chaining defensively. The `Set` collapses the case where both scopes
* reference the same `Headers`.
*/
function removeSetCookieEntries(ctx, cookieName) {
	const scoped = ctx;
	const targets = /* @__PURE__ */ new Set();
	if (scoped.responseHeaders) targets.add(scoped.responseHeaders);
	if (scoped.context?.responseHeaders) targets.add(scoped.context.responseHeaders);
	const exact = `${cookieName}=`;
	const chunk = `${cookieName}.`;
	for (const headers of targets) {
		const existing = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : splitSetCookieHeader(headers.get("set-cookie") || "");
		if (!existing.length) continue;
		const survivors = existing.filter((entry) => !entry.startsWith(exact) && !entry.startsWith(chunk));
		if (survivors.length === existing.length) continue;
		headers.delete("set-cookie");
		for (const entry of survivors) headers.append("set-cookie", entry);
	}
}
/**
* Whether the response already has a pending `Set-Cookie` for `cookieName`
* or a chunked variant.
*/
function hasPendingSetCookie(ctx, cookieName) {
	const scoped = ctx;
	const targets = /* @__PURE__ */ new Set();
	if (scoped.responseHeaders) targets.add(scoped.responseHeaders);
	if (scoped.context?.responseHeaders) targets.add(scoped.context.responseHeaders);
	const exact = `${cookieName}=`;
	const chunk = `${cookieName}.`;
	for (const headers of targets) if ((typeof headers.getSetCookie === "function" ? headers.getSetCookie() : splitSetCookieHeader(headers.get("set-cookie") || "")).some((entry) => entry.startsWith(exact) || entry.startsWith(chunk))) return true;
	return false;
}
/**
* Expires a cookie by setting `maxAge: 0` while preserving its attributes
*/
function expireCookie(ctx, cookie) {
	removeSetCookieEntries(ctx, cookie.name);
	ctx.setCookie(cookie.name, "", {
		...cookie.attributes,
		maxAge: 0
	});
}
function deleteSessionCookie(ctx, skipDontRememberMe) {
	expireCookie(ctx, ctx.context.authCookies.sessionToken);
	expireCookie(ctx, ctx.context.authCookies.sessionData);
	if (ctx.context.options.account?.storeAccountCookie) {
		expireCookie(ctx, ctx.context.authCookies.accountData);
		const accountStore = createAccountStore(ctx.context.authCookies.accountData.name, ctx.context.authCookies.accountData.attributes, ctx);
		const cleanCookies = accountStore.clean();
		accountStore.setCookies(cleanCookies);
	}
	if (ctx.context.oauthConfig.storeStateStrategy === "cookie") expireCookie(ctx, ctx.context.createAuthCookie("oauth_state"));
	const sessionStore = createSessionStore(ctx.context.authCookies.sessionData.name, ctx.context.authCookies.sessionData.attributes, ctx);
	const cleanCookies = sessionStore.clean();
	sessionStore.setCookies(cleanCookies);
	if (!skipDontRememberMe) expireCookie(ctx, ctx.context.authCookies.dontRememberToken);
}
var salt = utf8ToBytes("better-auth:oauth-encryption:v1");
function deriveSecret(secret, purpose) {
	return bytesToHex(hkdf(sha256, utf8ToBytes(secret), salt, utf8ToBytes(`better-auth:${purpose}:v1`), 32));
}
/** Derive an isolated key for one OAuth ciphertext purpose, retaining rotation versions. */
function derivePurposeKey(secret, purpose) {
	if (typeof secret === "string") return deriveSecret(secret, purpose);
	return {
		keys: new Map(Array.from(secret.keys, ([version, value]) => [version, deriveSecret(value, purpose)])),
		currentVersion: secret.currentVersion,
		...secret.legacySecret && { legacySecret: deriveSecret(secret.legacySecret, purpose) }
	};
}
var stateDataSchema = looseObject({
	callbackURL: string(),
	codeVerifier: string(),
	errorURL: string().optional(),
	newUserURL: string().optional(),
	expiresAt: number(),
	/**
	* CSRF nonce returned to the OAuth provider. When using cookie state storage,
	* this must match the callback `state` query parameter.
	*/
	oauthState: string().optional(),
	link: object({
		email: string(),
		userId: string$1()
	}).optional(),
	requestSignUp: boolean$1().optional(),
	/**
	* OIDC nonce sent as the authorization request `nonce` parameter when the
	* provider requires an ID token to be bound to this redirect flow.
	*/
	idTokenNonce: string().optional(),
	/**
	* Server-controlled values that ride the state across the provider redirect.
	* Populated only by `generateState` from `addOAuthServerContext`, never from
	* the request body, so it is safe to trust on the callback.
	*/
	serverContext: record(string(), unknown()).optional()
});
/** Verification key for database-backed OAuth and SAML relay state. */
var getAuthStateVerificationIdentifier = (state) => `auth-state:${state}`;
new Set(Object.keys(stateDataSchema.shape));
var StateError = class extends BetterAuthError {
	code;
	details;
	/**
	* The per-flow `errorCallbackURL` recovered from the parsed state, when the
	* failure happened after the state was successfully parsed (for example a
	* nonce or state-cookie mismatch). It was origin-validated at sign-in, so
	* the callback can safely redirect there instead of the default error page.
	* Absent when the state could not be parsed at all.
	*/
	errorURL;
	constructor(message, options) {
		super(message, options);
		this.code = options.code;
		this.details = options.details;
		this.errorURL = options.errorURL;
	}
};
async function generateGenericState(c, stateData, settings) {
	const state = generateRandomString(32);
	if (c.context.oauthConfig.storeStateStrategy === "cookie") {
		const payload = {
			...stateData,
			oauthState: state
		};
		const encryptedData = await symmetricEncrypt({
			key: derivePurposeKey(c.context.secretConfig, "oauth-state-cookie"),
			data: JSON.stringify(payload)
		});
		const stateCookie = c.context.createAuthCookie(settings?.cookieName ?? "oauth_state", { maxAge: 600 });
		c.setCookie(stateCookie.name, encryptedData, stateCookie.attributes);
		return {
			state,
			codeVerifier: stateData.codeVerifier
		};
	}
	const stateCookie = c.context.createAuthCookie(settings?.cookieName ?? "state", { maxAge: 300 });
	await c.setSignedCookie(stateCookie.name, state, c.context.secret, stateCookie.attributes);
	const expiresAt = /* @__PURE__ */ new Date();
	expiresAt.setMinutes(expiresAt.getMinutes() + 10);
	if (!await c.context.internalAdapter.createVerificationValue({
		value: JSON.stringify({
			...stateData,
			oauthState: state
		}),
		identifier: getAuthStateVerificationIdentifier(state),
		expiresAt
	})) throw new StateError("Unable to create verification. Make sure the database adapter is properly working and there is a verification table in the database", { code: "state_generation_error" });
	return {
		state,
		codeVerifier: stateData.codeVerifier
	};
}
async function parseGenericState(c, state, settings) {
	if (!state) throw new StateError("State not found in OAuth callback", { code: "state_not_found" });
	const storeStateStrategy = c.context.oauthConfig.storeStateStrategy;
	let parsedData;
	if (storeStateStrategy === "cookie") {
		const stateCookie = c.context.createAuthCookie(settings?.cookieName ?? "oauth_state");
		const encryptedData = c.getCookie(stateCookie.name);
		if (!encryptedData) throw new StateError("State mismatch: auth state cookie not found", {
			code: "state_mismatch",
			details: { state }
		});
		try {
			const decryptedData = await symmetricDecrypt({
				key: derivePurposeKey(c.context.secretConfig, "oauth-state-cookie"),
				data: encryptedData
			});
			parsedData = stateDataSchema.parse(JSON.parse(decryptedData));
		} catch (error) {
			throw new StateError("State invalid: Failed to decrypt or parse auth state", {
				code: "state_invalid",
				details: { state },
				cause: error
			});
		}
		if (!parsedData.oauthState || parsedData.oauthState !== state) throw new StateError("State mismatch: OAuth state parameter does not match stored state", {
			code: "state_security_mismatch",
			details: { state },
			errorURL: parsedData.errorURL
		});
		expireCookie(c, stateCookie);
	} else {
		const data = await c.context.internalAdapter.findVerificationValue(getAuthStateVerificationIdentifier(state));
		if (!data) throw new StateError("State mismatch: verification not found", {
			code: "state_mismatch",
			details: { state }
		});
		parsedData = stateDataSchema.parse(JSON.parse(data.value));
		if (parsedData.oauthState !== void 0 && parsedData.oauthState !== state) throw new StateError("State mismatch: OAuth state parameter does not match stored state", {
			code: "state_security_mismatch",
			details: { state },
			errorURL: parsedData.errorURL
		});
		const stateCookie = c.context.createAuthCookie(settings?.cookieName ?? "state");
		const stateCookieValue = await c.getSignedCookie(stateCookie.name, c.context.secret);
		if (!(settings?.skipStateCookieCheck ?? c.context.oauthConfig.skipStateCookieCheck) && (!stateCookieValue || stateCookieValue !== state)) throw new StateError("State mismatch: State not persisted correctly", {
			code: "state_security_mismatch",
			details: { state },
			errorURL: parsedData.errorURL
		});
		expireCookie(c, stateCookie);
		await c.context.internalAdapter.deleteVerificationByIdentifier(getAuthStateVerificationIdentifier(state));
	}
	if (parsedData.expiresAt < Date.now()) throw new StateError("Invalid state: request expired", {
		code: "state_mismatch",
		details: { expiresAt: parsedData.expiresAt },
		errorURL: parsedData.errorURL
	});
	return parsedData;
}
/**
* Error codes used in OAuth callback redirects (`?error=<code>`). These are
* URL-safe strings, not API error objects. Some also serve as the OAuth seam's
* machine-readable `result.error` value, which non-redirect callers (e.g.
* id-token sign-in) remap to an API error code.
*/
var OAUTH_CALLBACK_ERROR_CODES = {
	NO_CODE: "no_code",
	PROVIDER_NOT_FOUND: "oauth_provider_not_found",
	ISSUER_MISSING: "issuer_missing",
	ISSUER_MISMATCH: "issuer_mismatch",
	INVALID_CODE: "invalid_code",
	NONCE_BINDING_MISSING: "nonce_binding_missing",
	UNABLE_TO_GET_USER_INFO: "unable_to_get_user_info",
	NO_CALLBACK_URL: "no_callback_url",
	UNABLE_TO_LINK_ACCOUNT: "unable_to_link_account",
	EMAIL_DOES_NOT_MATCH: "email_does_not_match",
	ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_USER: "account_already_linked_to_different_user",
	EMAIL_NOT_FOUND: "email_not_found",
	EMAIL_NOT_VERIFIED: "email_not_verified"
};
var HANDLING_DOCS_URL = "https://www.better-auth.com/docs/concepts/oauth#handling-providers-without-email";
/**
* Redirect the user to the OAuth error page with a machine-readable `error`
* code (and optional `error_description`).
*
* Every OAuth callback path routes its failures through this helper so the
* query parameter name, the `?`/`&` separator, and URL encoding are decided in
* one place. The error page reads the `error` query parameter, so callers must
* never hand-build the redirect with a different parameter name.
*/
function redirectOnError(ctx, errorURL, error, description) {
	const params = new URLSearchParams({ error });
	if (description) params.set("error_description", description);
	const redirectURL = appendQueryParams(errorURL, params);
	throw ctx.redirect(redirectURL);
}
/**
* Build the logger message shown when an OAuth provider does not return an
* email address. Kept in one place so every rejection site points users at
* the same workaround docs.
*/
function missingEmailLogMessage(providerId, options) {
	return `${options?.source === "generic" ? `Generic OAuth provider "${providerId}"` : `Provider "${providerId}"`} did not return an email${options?.source === "id_token" ? " in the id token" : ""}. Either request the provider's email scope, or create a placeholder via \`mapProfileToUser\`. See ${HANDLING_DOCS_URL}`;
}
var { get: getRawOAuthState, set: setOAuthState } = defineRequestState(() => null);
/**
* @internal Read accumulated server context to embed during state generation.
*/
var { get: getOAuthServerContext, set: setOAuthServerContext } = defineRequestState(() => null);
/**
* Mint the OIDC `nonce` for the redirect flow, or `undefined` when the provider
* does not require ID-token nonce binding. Every redirect entrypoint (social
* sign-in, account linking, IDP-initiated bounce, and the OAuth popup) mints
* through this helper, so the value sent on the authorization URL and the value
* persisted in state are produced one way and cannot drift apart.
*/
function generateIdTokenNonce(provider) {
	return provider.requiresIdTokenNonce ? generateRandomString(32) : void 0;
}
async function generateState(c, options) {
	const callbackURL = c.body?.callbackURL || c.context.options.baseURL;
	if (!callbackURL) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.CALLBACK_URL_REQUIRED);
	const codeVerifier = options?.codeVerifier ?? generateRandomString(128);
	const pendingServerContext = await getOAuthServerContext();
	const serverContext = pendingServerContext && Object.keys(pendingServerContext).length ? pendingServerContext : void 0;
	const stateData = {
		...options?.additionalData ? options.additionalData : {},
		callbackURL,
		codeVerifier,
		errorURL: c.body?.errorCallbackURL,
		newUserURL: c.body?.newUserCallbackURL,
		link: options?.link,
		serverContext,
		expiresAt: Date.now() + 6e5,
		requestSignUp: c.body?.requestSignUp,
		idTokenNonce: options?.idTokenNonce
	};
	await setOAuthState(stateData);
	try {
		return generateGenericState(c, stateData);
	} catch (error) {
		c.context.logger.error("Failed to create verification", error);
		throw new APIError("INTERNAL_SERVER_ERROR", {
			message: "Unable to create verification",
			cause: error
		});
	}
}
async function parseState(c) {
	const state = c.query.state || c.body?.state;
	const errorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
	let parsedData;
	try {
		parsedData = await parseGenericState(c, state);
	} catch (error) {
		c.context.logger.error("Failed to parse state", error);
		let code = "internal_server_error";
		let redirectErrorURL = errorURL;
		if (error instanceof StateError) {
			code = error.code === "state_security_mismatch" ? "state_mismatch" : error.code;
			redirectErrorURL = error.errorURL || errorURL;
		}
		redirectOnError(c, redirectErrorURL, code);
	}
	if (!parsedData.errorURL) parsedData.errorURL = errorURL;
	if (parsedData) await setOAuthState(parsedData);
	return parsedData;
}
var HIDE_METADATA = { scope: "server" };
var CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/;
var RELATIVE_URL_PARSER_ORIGIN = "https://better-auth.invalid";
var ENCODED_PATH_SEPARATOR_PATTERN = /%2[fF]|%5[cC]/;
/**
* Resolves `.` and `..` segments in a path after percent-decoding so a
* path-pinned pattern cannot be bypassed with traversal: e.g.
* `myapp://host/cb/../evil` must not satisfy pattern `myapp://host/cb`.
* Returns "" for an empty or root path.
*/
var normalizePath = (path) => {
	let decoded = path;
	try {
		decoded = decodeURIComponent(path);
	} catch {}
	const segments = [];
	for (const segment of decoded.split("/")) if (segment === "..") segments.pop();
	else if (segment !== "." && segment !== "") segments.push(segment);
	return segments.length > 0 ? `/${segments.join("/")}` : "";
};
/**
* Splits a custom-scheme origin into its scheme, authority and path using
* plain string operations.
*
* `new URL()` is deliberately avoided here: its parsing of non-special schemes
* (e.g. `myapp://`, `exp://`) is not consistent across the runtimes Better Auth
* targets (Node, Bun, Deno, Cloudflare Workers), and the result of an origin
* check must not depend on which engine extracts the authority.
*
* Scheme and authority are lower-cased (matching how a URL canonicalizes its
* host); the path is percent-decoded and resolved so traversal cannot bypass
* a path-pinned pattern.
*/
var parseCustomSchemeOrigin = (value) => {
	if (CONTROL_CHARACTER_PATTERN.test(value)) return null;
	const schemeEnd = value.indexOf(":");
	if (schemeEnd <= 0) return null;
	const scheme = value.slice(0, schemeEnd).toLowerCase();
	let rest = value.slice(schemeEnd + 1);
	let authority = "";
	if (rest.startsWith("//")) {
		rest = rest.slice(2);
		const authorityEnd = rest.search(/[/?#]/);
		if (authorityEnd === -1) {
			authority = rest;
			rest = "";
		} else {
			authority = rest.slice(0, authorityEnd);
			rest = rest.slice(authorityEnd);
		}
	}
	const pathEnd = rest.search(/[?#]/);
	const path = normalizePath(pathEnd === -1 ? rest : rest.slice(0, pathEnd));
	return {
		scheme,
		authority: authority.toLowerCase(),
		path
	};
};
/**
* Validates root-relative redirects against ambiguous browser and router parsing.
*
* @see https://www.rfc-editor.org/rfc/rfc3986.html#section-4.2
* @see https://url.spec.whatwg.org/#concept-basic-url-parser
*/
var isSafeRelativeURL = (value) => {
	if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || CONTROL_CHARACTER_PATTERN.test(value)) return false;
	const pathEnd = value.search(/[?#]/);
	const path = pathEnd === -1 ? value : value.slice(0, pathEnd);
	if (ENCODED_PATH_SEPARATOR_PATTERN.test(path)) return false;
	try {
		return new URL(value, RELATIVE_URL_PARSER_ORIGIN).origin === RELATIVE_URL_PARSER_ORIGIN;
	} catch {
		return false;
	}
};
/**
* Matches the given url against an origin or origin pattern
* See "options.trustedOrigins" for details of supported patterns
*
* @param url The url to test
* @param pattern The origin pattern
* @param [settings] Specify supported pattern matching settings
* @returns {boolean} true if the URL matches the origin pattern, false otherwise.
*/
var matchesOriginPattern = (url, pattern, settings) => {
	if (url.startsWith("/")) return settings?.allowRelativePaths === true && isSafeRelativeURL(url);
	if (pattern.includes("*") || pattern.includes("?")) {
		if (pattern.includes("://")) return wildcardMatch(pattern)(getOrigin(url) || url);
		const host = getHost(url);
		if (!host) return false;
		return wildcardMatch(pattern)(host);
	}
	const protocol = getProtocol(url);
	if (protocol === "http:" || protocol === "https:" || !protocol) return pattern === getOrigin(url);
	const parsed = parseCustomSchemeOrigin(url);
	const parsedPattern = parseCustomSchemeOrigin(pattern);
	if (!parsed || !parsedPattern || parsed.scheme !== parsedPattern.scheme) return false;
	if (parsedPattern.authority && parsed.authority !== parsedPattern.authority) return false;
	if (!parsedPattern.path) return true;
	return parsed.path === parsedPattern.path || parsed.path.startsWith(`${parsedPattern.path}/`);
};
/**
* Checks if CSRF should be skipped for backward compatibility.
* Previously, disableOriginCheck also disabled CSRF checks.
* This maintains that behavior when disableCSRFCheck isn't explicitly set.
* Only triggers for skipOriginCheck === true, not for path arrays.
*/
function shouldSkipCSRFForBackwardCompat(ctx) {
	return ctx.context.skipOriginCheck === true && ctx.context.options.advanced?.disableCSRFCheck === void 0;
}
/**
* Checks if the origin check should be skipped for the current request.
* Handles both boolean (skip all) and array (skip specific paths) configurations.
*/
function shouldSkipOriginCheck(ctx) {
	const skipOriginCheck = ctx.context.skipOriginCheck;
	if (skipOriginCheck === true) return true;
	if (Array.isArray(skipOriginCheck) && ctx.request) try {
		const basePath = new URL(ctx.context.baseURL).pathname;
		const currentPath = normalizePathname(ctx.request.url, basePath);
		return skipOriginCheck.some((skipPath) => {
			const normalizedSkipPath = skipPath.replace(/\/+$/, "");
			return currentPath === normalizedSkipPath || currentPath.startsWith(`${normalizedSkipPath}/`);
		});
	} catch {}
	return false;
}
/**
* Logs deprecation warning for users relying on coupled behavior.
* Only logs if user explicitly set disableOriginCheck (not test environment default).
*/
var logBackwardCompatWarning = deprecate(function logBackwardCompatWarning() {}, "disableOriginCheck: true currently also disables CSRF checks. In a future version, disableOriginCheck will ONLY disable URL validation. To keep CSRF disabled, add disableCSRFCheck: true to your config.");
/**
* A middleware to validate callbackURL and origin against trustedOrigins.
* Also handles CSRF protection using Fetch Metadata for first-login scenarios.
*/
var originCheckMiddleware = createAuthMiddleware(async (ctx) => {
	if (ctx.request?.method === "GET" || ctx.request?.method === "OPTIONS" || ctx.request?.method === "HEAD" || !ctx.request) return;
	await validateOrigin(ctx);
	if (shouldSkipOriginCheck(ctx)) return;
	const { body, query } = ctx;
	const callbackURL = body?.callbackURL || query?.callbackURL;
	const redirectURL = body?.redirectTo;
	const errorCallbackURL = body?.errorCallbackURL;
	const newUserCallbackURL = body?.newUserCallbackURL;
	const validateURL = (url, label) => {
		if (!url) return;
		if (typeof url !== "string") throw APIError.fromStatus("BAD_REQUEST", { message: `Invalid ${label}: expected a string` });
		if (!ctx.context.isTrustedOrigin(url, { allowRelativePaths: label !== "origin" })) {
			ctx.context.logger.error(`Invalid ${label}: ${url}`);
			ctx.context.logger.info(`If it's a valid URL, please add ${url} to trustedOrigins in your auth config\n`, `Current list of trustedOrigins: ${ctx.context.trustedOrigins}`);
			if (label === "origin") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_ORIGIN);
			if (label === "callbackURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_CALLBACK_URL);
			if (label === "redirectURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_REDIRECT_URL);
			if (label === "errorCallbackURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_ERROR_CALLBACK_URL);
			if (label === "newUserCallbackURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_NEW_USER_CALLBACK_URL);
			throw APIError.fromStatus("FORBIDDEN", { message: `Invalid ${label}` });
		}
	};
	callbackURL && validateURL(callbackURL, "callbackURL");
	redirectURL && validateURL(redirectURL, "redirectURL");
	errorCallbackURL && validateURL(errorCallbackURL, "errorCallbackURL");
	newUserCallbackURL && validateURL(newUserCallbackURL, "newUserCallbackURL");
});
var originCheck = (getValue) => createAuthMiddleware(async (ctx) => {
	if (!ctx.request) return;
	if (shouldSkipOriginCheck(ctx)) return;
	const callbackURL = getValue(ctx);
	const validateURL = (url, label) => {
		if (!url) return;
		if (!ctx.context.isTrustedOrigin(url, { allowRelativePaths: label !== "origin" })) {
			ctx.context.logger.error(`Invalid ${label}: ${url}`);
			ctx.context.logger.info(`If it's a valid URL, please add ${url} to trustedOrigins in your auth config\n`, `Current list of trustedOrigins: ${ctx.context.trustedOrigins}`);
			if (label === "origin") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_ORIGIN);
			if (label === "callbackURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_CALLBACK_URL);
			if (label === "redirectURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_REDIRECT_URL);
			if (label === "errorCallbackURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_ERROR_CALLBACK_URL);
			if (label === "newUserCallbackURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_NEW_USER_CALLBACK_URL);
			throw APIError.fromStatus("FORBIDDEN", { message: `Invalid ${label}` });
		}
	};
	const callbacks = Array.isArray(callbackURL) ? callbackURL : [callbackURL];
	for (const url of callbacks) validateURL(url, "callbackURL");
});
/**
* Validates origin header against trusted origins.
* @param ctx - The endpoint context
* @param forceValidate - If true, always validate origin regardless of cookies/skip flags
*/
async function validateOrigin(ctx, forceValidate = false) {
	const headers = ctx.request?.headers;
	if (!headers || !ctx.request) return;
	const origin = headers.get("origin");
	const originHeader = origin || headers.get("referer") || "";
	const useCookies = headers.has("cookie");
	if (ctx.context.skipCSRFCheck) return;
	if (shouldSkipCSRFForBackwardCompat(ctx)) {
		ctx.context.options.advanced?.disableOriginCheck === true && logBackwardCompatWarning();
		return;
	}
	if (shouldSkipOriginCheck(ctx)) return;
	if (!(forceValidate || useCookies)) return;
	const inferredBaseURL = origin === "null" && headers.get("sec-fetch-site") === "same-origin" ? getBaseURL(void 0, ctx.context.options.basePath, ctx.request, false, ctx.context.options.advanced?.trustedProxyHeaders) : void 0;
	const originToValidate = (inferredBaseURL ? getOrigin(inferredBaseURL) : void 0) ?? originHeader;
	if (!originToValidate || originToValidate === "null") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.MISSING_OR_NULL_ORIGIN);
	const trustedOrigins = Array.isArray(ctx.context.options.trustedOrigins) ? ctx.context.trustedOrigins : [...ctx.context.trustedOrigins, ...(await ctx.context.options.trustedOrigins?.(ctx.request))?.filter((v) => Boolean(v)) || []];
	if (!trustedOrigins.some((origin) => matchesOriginPattern(originToValidate, origin))) {
		ctx.context.logger.error(`Invalid origin: ${originToValidate}`);
		ctx.context.logger.info(`If it's a valid URL, please add ${originToValidate} to trustedOrigins in your auth config\n`, `Current list of trustedOrigins: ${trustedOrigins}`);
		throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_ORIGIN);
	}
}
/**
* Middleware for CSRF protection using Fetch Metadata headers.
* This prevents cross-site navigation login attacks while supporting progressive enhancement.
*/
var formCsrfMiddleware = createAuthMiddleware(async (ctx) => {
	if (!ctx.request) return;
	await validateFormCsrf(ctx);
});
/**
* Validates CSRF protection for first-login scenarios using Fetch Metadata headers.
* This prevents cross-site form submission attacks while supporting progressive enhancement.
*/
async function validateFormCsrf(ctx) {
	const req = ctx.request;
	if (!req) return;
	if (ctx.context.skipCSRFCheck) return;
	if (shouldSkipCSRFForBackwardCompat(ctx)) return;
	const headers = req.headers;
	if (headers.has("cookie")) return await validateOrigin(ctx);
	const site = headers.get("Sec-Fetch-Site");
	const mode = headers.get("Sec-Fetch-Mode");
	const dest = headers.get("Sec-Fetch-Dest");
	if (Boolean(site && site.trim() || mode && mode.trim() || dest && dest.trim())) {
		if (site === "cross-site" && mode === "navigate") {
			ctx.context.logger.error("Blocked cross-site navigation login attempt (CSRF protection)", {
				secFetchSite: site,
				secFetchMode: mode,
				secFetchDest: dest
			});
			throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.CROSS_SITE_NAVIGATION_LOGIN_BLOCKED);
		}
		return await validateOrigin(ctx, true);
	}
	if (headers.get("origin") || headers.get("referer")) return await validateOrigin(ctx, true);
}
var memory = /* @__PURE__ */ new Map();
var MEMORY_STORE_MAX_ENTRIES = 1e5;
function pruneMemoryStore() {
	const now = Date.now();
	for (const [key, entry] of memory) if (now >= entry.expiresAt) memory.delete(key);
	if (memory.size <= MEMORY_STORE_MAX_ENTRIES) return;
	const overflow = memory.size - MEMORY_STORE_MAX_ENTRIES;
	let removed = 0;
	for (const key of memory.keys()) {
		memory.delete(key);
		if (++removed >= overflow) break;
	}
}
/**
* Decide an atomic rate-limit step against an in-memory `RateLimit` snapshot
* for the rolling `window` (seconds) and `max`. Shared by the memory backend
* (read-decide-write is atomic under single-threaded JS) and as the fallback
* for storages lacking an atomic primitive.
*/
function decideConsume(data, rule, now) {
	const windowInMs = rule.window * 1e3;
	if (!data) return {
		next: {
			key: "",
			count: 1,
			lastRequest: now
		},
		update: false,
		allowed: true,
		retryAfter: null
	};
	if (now - data.lastRequest >= windowInMs) return {
		next: {
			...data,
			count: 1,
			lastRequest: now
		},
		update: true,
		allowed: true,
		retryAfter: null
	};
	if (data.count >= rule.max) return {
		next: data,
		update: true,
		allowed: false,
		retryAfter: getRetryAfter(data.lastRequest, rule.window)
	};
	return {
		next: {
			...data,
			count: data.count + 1,
			lastRequest: now
		},
		update: true,
		allowed: true,
		retryAfter: null
	};
}
function rateLimitResponse(retryAfter) {
	return new Response(JSON.stringify({ message: "Too many requests. Please try again later." }), {
		status: 429,
		statusText: "Too Many Requests",
		headers: {
			"Content-Type": "application/json",
			"X-Retry-After": retryAfter.toString()
		}
	});
}
function getRetryAfter(lastRequest, window) {
	const now = Date.now();
	const windowInMs = window * 1e3;
	return Math.ceil((lastRequest + windowInMs - now) / 1e3);
}
function createDatabaseStorageWrapper(ctx) {
	const model = "rateLimit";
	const db = ctx.adapter;
	let longestObservedWindow = Math.max(...getConfiguredRateLimitWindows(ctx));
	const readRow = async (key) => {
		const data = (await db.findMany({
			model,
			where: [{
				field: "key",
				value: key
			}]
		}))[0];
		if (typeof data?.lastRequest === "bigint") data.lastRequest = Number(data.lastRequest);
		return data;
	};
	const consume = async (key, rule) => {
		if (rule.window > longestObservedWindow) longestObservedWindow = rule.window;
		const windowInMs = rule.window * 1e3;
		const data = await readRow(key);
		const now = Date.now();
		if (!data) try {
			await db.create({
				model,
				data: {
					key,
					count: 1,
					lastRequest: now
				}
			});
			return {
				allowed: true,
				retryAfter: null
			};
		} catch (error) {
			if (!await readRow(key)) throw error;
			return consume(key, rule);
		}
		if (now - data.lastRequest >= windowInMs) {
			if (await db.incrementOne({
				model,
				where: [{
					field: "key",
					value: key
				}, {
					field: "lastRequest",
					operator: "lte",
					value: data.lastRequest
				}],
				increment: {},
				set: {
					count: 1,
					lastRequest: now
				}
			})) {
				await deleteExpiredRows(now);
				return {
					allowed: true,
					retryAfter: null
				};
			}
			return consume(key, rule);
		}
		const windowStart = now - windowInMs;
		if (await db.incrementOne({
			model,
			where: [
				{
					field: "key",
					value: key
				},
				{
					field: "lastRequest",
					operator: "gt",
					value: windowStart
				},
				{
					field: "count",
					operator: "lt",
					value: rule.max
				}
			],
			increment: { count: 1 },
			set: { lastRequest: now }
		})) return {
			allowed: true,
			retryAfter: null
		};
		const fresh = await readRow(key);
		if (!fresh) return consume(key, rule);
		if (now - fresh.lastRequest >= windowInMs) return consume(key, rule);
		return {
			allowed: false,
			retryAfter: getRetryAfter(fresh.lastRequest, rule.window)
		};
	};
	const deleteExpiredRows = async (now) => {
		const cutoff = now - longestObservedWindow * 1e3;
		await ctx.runInBackgroundOrAwait(db.deleteMany({
			model,
			where: [{
				field: "lastRequest",
				operator: "lt",
				value: cutoff
			}]
		}).then(() => void 0).catch((e) => ctx.logger.error("Error pruning rate limit rows", e)));
	};
	return { consume };
}
function getConfiguredRateLimitWindows(ctx) {
	const windows = [ctx.rateLimit.window, ...getDefaultSpecialRules().map((rule) => rule.window)];
	for (const plugin of ctx.options.plugins || []) if (plugin.rateLimit) windows.push(...plugin.rateLimit.map((rule) => rule.window));
	if (ctx.rateLimit.customRules) {
		for (const customRule of Object.values(ctx.rateLimit.customRules)) if (customRule && typeof customRule !== "function") windows.push(customRule.window);
	}
	const validWindows = windows.filter((window) => Number.isFinite(window) && window > 0);
	return validWindows.length > 0 ? validWindows : [ctx.rateLimit.window];
}
function getRateLimitStorage(ctx, rateLimitSettings) {
	if (ctx.options.rateLimit?.customStorage) return ctx.options.rateLimit.customStorage;
	const storage = ctx.rateLimit.storage;
	if (storage === "secondary-storage") {
		const ttlFor = (window) => window ?? ctx.options.rateLimit?.window ?? 10;
		const increment = ctx.options.secondaryStorage?.increment;
		if (!increment) throw new BetterAuthError("Secondary-storage rate limiting requires SecondaryStorage.increment.");
		return { consume: async (key, rule) => {
			if (await increment(key, ttlFor(rule.window)) <= rule.max) return {
				allowed: true,
				retryAfter: null
			};
			return {
				allowed: false,
				retryAfter: rule.window
			};
		} };
	} else if (storage === "memory") {
		const ttlFor = (window) => window ?? ctx.options.rateLimit?.window ?? 10;
		return { async consume(key, rule) {
			pruneMemoryStore();
			const now = Date.now();
			const entry = memory.get(key);
			const decision = decideConsume(entry && now < entry.expiresAt ? entry.data : void 0, rule, now);
			if (decision.allowed) memory.set(key, {
				data: {
					...decision.next,
					key
				},
				expiresAt: now + ttlFor(rule.window) * 1e3
			});
			return {
				allowed: decision.allowed,
				retryAfter: decision.retryAfter
			};
		} };
	}
	return createDatabaseStorageWrapper(ctx);
}
var ipWarningLogged = false;
var NO_TRUSTED_IP_KEY = "no-trusted-ip";
async function resolveRateLimitConfig(req, ctx) {
	const basePath = new URL(ctx.baseURL).pathname;
	const path = normalizePathname(req.url, basePath);
	let currentWindow = ctx.rateLimit.window;
	let currentMax = ctx.rateLimit.max;
	const ip = getIP(req, ctx.options);
	if (!ip && ctx.options.advanced?.ipAddress?.disableIpTracking) return null;
	if (!ip && !ipWarningLogged) {
		ctx.logger.warn("Rate limiting could not determine a client IP and is falling back to a single shared per-path bucket. Ensure your runtime forwards a trusted client IP header, then set `advanced.ipAddress.ipAddressHeaders` or `advanced.ipAddress.trustedProxies` so the address can be resolved.");
		ipWarningLogged = true;
	}
	const key = createRateLimitKey(ip ?? NO_TRUSTED_IP_KEY, path);
	const specialRule = getDefaultSpecialRules().find((rule) => rule.pathMatcher(path));
	if (specialRule) {
		currentWindow = specialRule.window;
		currentMax = specialRule.max;
	}
	for (const plugin of ctx.options.plugins || []) if (plugin.rateLimit) {
		const matchedRule = plugin.rateLimit.find((rule) => rule.pathMatcher(path));
		if (matchedRule) {
			currentWindow = matchedRule.window;
			currentMax = matchedRule.max;
			break;
		}
	}
	if (ctx.rateLimit.customRules) {
		const _path = Object.keys(ctx.rateLimit.customRules).find((p) => {
			if (p.includes("*")) return wildcardMatch(p)(path);
			return p === path;
		});
		if (_path) {
			const customRule = ctx.rateLimit.customRules[_path];
			const resolved = typeof customRule === "function" ? await customRule(req, {
				window: currentWindow,
				max: currentMax
			}) : customRule;
			if (resolved) {
				currentWindow = resolved.window;
				currentMax = resolved.max;
			}
			if (resolved === false) return null;
		}
	}
	return {
		key,
		currentWindow,
		currentMax
	};
}
/**
* Decides the rate limit for the request in a single atomic step. The whole
* check-and-increment happens here in the request phase; there is no separate
* response-phase write-back, so concurrent requests cannot all pass a stale
* read before any increment lands.
*/
async function onRequestRateLimit(req, ctx) {
	if (!ctx.rateLimit.enabled) return;
	const config = await resolveRateLimitConfig(req, ctx);
	if (!config) return;
	const { key, currentWindow, currentMax } = config;
	const storage = getRateLimitStorage(ctx, { window: currentWindow });
	const rule = {
		window: currentWindow,
		max: currentMax
	};
	const { allowed, retryAfter } = await storage.consume(key, rule);
	if (!allowed) return rateLimitResponse(retryAfter ?? currentWindow);
}
function getDefaultSpecialRules() {
	return [{
		pathMatcher(path) {
			return path.startsWith("/sign-in") || path.startsWith("/sign-up") || path.startsWith("/change-password") || path.startsWith("/change-email");
		},
		window: 10,
		max: 3
	}, {
		pathMatcher(path) {
			return path === "/request-password-reset" || path === "/send-verification-email" || path.startsWith("/forget-password") || path === "/email-otp/send-verification-otp" || path === "/email-otp/request-password-reset";
		},
		window: 60,
		max: 3
	}];
}
/**
* State for skipping session refresh
*
* In some cases, such as when using server-side rendering (SSR) or when dealing with
* certain types of requests, it may be necessary to skip session refresh to prevent
* potential inconsistencies between the session data in the database and the session
* data stored in cookies.
*/
var { get: getShouldSkipSessionRefresh, set: setShouldSkipSessionRefresh } = defineRequestState(() => false);
var getSession = () => createAuthEndpoint("/get-session", {
	method: ["GET", "POST"],
	operationId: "getSession",
	query: getSessionQuerySchema,
	requireHeaders: true,
	metadata: { openapi: {
		operationId: "getSession",
		description: "Get the current session",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: ["object", "null"],
				properties: {
					session: { $ref: "#/components/schemas/Session" },
					user: { $ref: "#/components/schemas/User" }
				},
				required: ["session", "user"]
			} } }
		} }
	} }
}, async (ctx) => {
	ctx.setHeader("cache-control", "no-store");
	ctx.setHeader("pragma", "no-cache");
	const deferSessionRefresh = ctx.context.options.session?.deferSessionRefresh;
	const isPostRequest = ctx.method === "POST";
	if (isPostRequest && !deferSessionRefresh) throw APIError.from("METHOD_NOT_ALLOWED", BASE_ERROR_CODES.METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED);
	try {
		const cookieCacheEnabled = ctx.context.options.session?.cookieCache?.enabled === true;
		const sessionCookieToken = await ctx.getSignedCookie(ctx.context.authCookies.sessionToken.name, ctx.context.secret);
		if (!sessionCookieToken && cookieCacheEnabled) return null;
		const sessionDataCookie = getChunkedCookie(ctx, ctx.context.authCookies.sessionData.name);
		if (sessionDataCookie && !cookieCacheEnabled) {
			const sessionStore = createSessionStore(ctx.context.authCookies.sessionData.name, ctx.context.authCookies.sessionData.attributes, ctx);
			sessionStore.setCookies(sessionStore.clean());
		}
		if (!sessionCookieToken) return null;
		const shouldUseCookieCache = cookieCacheEnabled && !ctx.query?.disableCookieCache;
		const sessionDataPayload = shouldUseCookieCache && sessionDataCookie ? await decodeCookieCache(ctx, sessionDataCookie) : null;
		if (shouldUseCookieCache && sessionDataCookie && !sessionDataPayload) expireCookie(ctx, ctx.context.authCookies.sessionData);
		const dontRememberMe = await ctx.getSignedCookie(ctx.context.authCookies.dontRememberToken.name, ctx.context.secret);
		/**
		* If session data is present in the cookie, check if it should be used or refreshed
		*/
		if (sessionDataPayload?.session) {
			const session = sessionDataPayload.session;
			let shouldExpireCookieCache = session.session.token !== sessionCookieToken;
			if (!shouldExpireCookieCache) {
				const versionConfig = ctx.context.options.session?.cookieCache?.version;
				let expectedVersion = "1";
				if (versionConfig) {
					if (typeof versionConfig === "string") expectedVersion = versionConfig;
					else if (typeof versionConfig === "function") {
						const result = versionConfig(session.session, session.user);
						expectedVersion = result instanceof Promise ? await result : result;
					}
				}
				shouldExpireCookieCache = (session.version || "1") !== expectedVersion;
			}
			if (!shouldExpireCookieCache) {
				const now = Date.now();
				const cachedSessionExpiresAt = new Date(session.session.expiresAt).getTime();
				shouldExpireCookieCache = sessionDataPayload.expiresAt < now || !Number.isFinite(cachedSessionExpiresAt) || cachedSessionExpiresAt < now;
			}
			if (shouldExpireCookieCache) expireCookie(ctx, ctx.context.authCookies.sessionData);
			else {
				const cookieRefreshCache = ctx.context.sessionConfig.cookieRefreshCache;
				if (cookieRefreshCache === false) {
					ctx.context.session = session;
					const parsedSession = parseSessionOutput(ctx.context.options, {
						...session.session,
						expiresAt: new Date(session.session.expiresAt),
						createdAt: new Date(session.session.createdAt),
						updatedAt: new Date(session.session.updatedAt)
					});
					const parsedUser = parseUserOutput(ctx.context.options, {
						...session.user,
						createdAt: new Date(session.user.createdAt),
						updatedAt: new Date(session.user.updatedAt)
					});
					return ctx.json({
						session: parsedSession,
						user: parsedUser
					});
				}
				const timeUntilExpiry = sessionDataPayload.expiresAt - Date.now();
				const updateAge = cookieRefreshCache.updateAge * 1e3;
				const shouldSkipSessionRefresh = await getShouldSkipSessionRefresh();
				if (timeUntilExpiry < updateAge && !shouldSkipSessionRefresh) {
					const refreshedSession = {
						session: { ...session.session },
						user: session.user,
						updatedAt: Date.now()
					};
					await setCookieCache(ctx, refreshedSession, false);
					const sessionTokenOptions = ctx.context.authCookies.sessionToken.attributes;
					const sessionTokenMaxAge = dontRememberMe ? void 0 : ctx.context.sessionConfig.expiresIn;
					await ctx.setSignedCookie(ctx.context.authCookies.sessionToken.name, session.session.token, ctx.context.secret, {
						...sessionTokenOptions,
						maxAge: sessionTokenMaxAge
					});
					const parsedRefreshedSession = parseSessionOutput(ctx.context.options, {
						...refreshedSession.session,
						expiresAt: new Date(refreshedSession.session.expiresAt),
						createdAt: new Date(refreshedSession.session.createdAt),
						updatedAt: new Date(refreshedSession.session.updatedAt)
					});
					const parsedRefreshedUser = parseUserOutput(ctx.context.options, {
						...refreshedSession.user,
						createdAt: new Date(refreshedSession.user.createdAt),
						updatedAt: new Date(refreshedSession.user.updatedAt)
					});
					ctx.context.session = {
						session: parsedRefreshedSession,
						user: parsedRefreshedUser
					};
					return ctx.json({
						session: parsedRefreshedSession,
						user: parsedRefreshedUser
					});
				}
				const parsedSession = parseSessionOutput(ctx.context.options, {
					...session.session,
					expiresAt: new Date(session.session.expiresAt),
					createdAt: new Date(session.session.createdAt),
					updatedAt: new Date(session.session.updatedAt)
				});
				const parsedUser = parseUserOutput(ctx.context.options, {
					...session.user,
					createdAt: new Date(session.user.createdAt),
					updatedAt: new Date(session.user.updatedAt)
				});
				ctx.context.session = {
					session: parsedSession,
					user: parsedUser
				};
				return ctx.json({
					session: parsedSession,
					user: parsedUser
				});
			}
		}
		const session = await ctx.context.internalAdapter.findSession(sessionCookieToken);
		ctx.context.session = session;
		if (!session || session.session.expiresAt < /* @__PURE__ */ new Date()) {
			deleteSessionCookie(ctx);
			if (session) {
				/**
				* if session expired clean up the session
				* Only delete on POST when deferSessionRefresh is enabled
				*/
				if (!deferSessionRefresh || isPostRequest) await ctx.context.internalAdapter.deleteSession(session.session.token);
			}
			return ctx.json(null);
		}
		/**
		* We don't need to update the session if the user doesn't want to be remembered
		* or if the session refresh is disabled
		*/
		if (dontRememberMe || ctx.query?.disableRefresh) {
			const parsedSession = parseSessionOutput(ctx.context.options, session.session);
			const parsedUser = parseUserOutput(ctx.context.options, session.user);
			return ctx.json({
				session: parsedSession,
				user: parsedUser
			});
		}
		const expiresIn = ctx.context.sessionConfig.expiresIn;
		const updateAge = ctx.context.sessionConfig.updateAge;
		const shouldBeUpdated = session.session.expiresAt.valueOf() - expiresIn * 1e3 + updateAge * 1e3 <= Date.now();
		const disableRefresh = ctx.query?.disableRefresh || ctx.context.options.session?.disableSessionRefresh;
		const shouldSkipSessionRefresh = await getShouldSkipSessionRefresh();
		const needsRefresh = shouldBeUpdated && !disableRefresh && !shouldSkipSessionRefresh;
		/**
		* When deferSessionRefresh is enabled and this is a GET request,
		* return the session without performing writes, but include needsRefresh flag
		*/
		if (deferSessionRefresh && !isPostRequest) {
			await setCookieCache(ctx, session, !!dontRememberMe);
			const parsedSession = parseSessionOutput(ctx.context.options, session.session);
			const parsedUser = parseUserOutput(ctx.context.options, session.user);
			return ctx.json({
				session: parsedSession,
				user: parsedUser,
				needsRefresh
			});
		}
		if (needsRefresh) {
			const updatedSession = await ctx.context.internalAdapter.updateSession(session.session.token, {
				expiresAt: getDate(ctx.context.sessionConfig.expiresIn, "sec"),
				updatedAt: /* @__PURE__ */ new Date()
			});
			if (!updatedSession) {
				/**
				* Handle case where session update fails (e.g., concurrent deletion)
				*/
				deleteSessionCookie(ctx);
				throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.FAILED_TO_GET_SESSION);
			}
			const maxAge = ctx.context.sessionConfig.expiresIn;
			await setSessionCookie(ctx, {
				session: updatedSession,
				user: session.user
			}, false, { maxAge });
			const parsedUpdatedSession = parseSessionOutput(ctx.context.options, updatedSession);
			const parsedUser = parseUserOutput(ctx.context.options, session.user);
			return ctx.json({
				session: parsedUpdatedSession,
				user: parsedUser
			});
		}
		await setCookieCache(ctx, session, !!dontRememberMe);
		const parsedSession = parseSessionOutput(ctx.context.options, session.session);
		const parsedUser = parseUserOutput(ctx.context.options, session.user);
		return ctx.json({
			session: parsedSession,
			user: parsedUser
		});
	} catch (error) {
		if (isAPIError(error)) throw error;
		ctx.context.logger.error("INTERNAL_SERVER_ERROR", error);
		throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.FAILED_TO_GET_SESSION);
	}
});
/**
* Whether the deployment keeps sessions in a durable server-side store
* (a database or secondary storage) rather than only in the signed cookie.
*
* Sensitive operations use this to decide whether the cookie cache is merely an
* optimization that must be bypassed for an authoritative read (`true`), or the
* only place the session lives and therefore the authority itself (`false`, for
* stateless / DB-less deployments). Pass the result as `disableCookieCache` so a
* revoked-but-cached session cannot authorize a sensitive action.
*/
var isStateful = (ctx) => hasServerSessionStore(ctx.context.options);
var getSessionFromCtx = async (ctx, config) => {
	if (ctx.context.session) return ctx.context.session;
	const session = await getSession()({
		...ctx,
		method: "GET",
		asResponse: false,
		headers: ctx.headers,
		returnHeaders: true,
		returnStatus: false,
		query: {
			...config,
			...ctx.query,
			disableCookieCache: config?.disableCookieCache || ctx.query?.disableCookieCache,
			disableRefresh: config?.disableRefresh || ctx.query?.disableRefresh
		}
	}).catch(() => {
		return null;
	});
	if (!session) {
		ctx.context.session = null;
		return null;
	}
	if (session.headers) session.headers.forEach((value, key) => {
		const lowerKey = key.toLowerCase();
		if (lowerKey === "cache-control" || lowerKey === "pragma") return;
		if (lowerKey === "set-cookie") ctx.responseHeaders.append(key, value);
		else ctx.responseHeaders.set(key, value);
	});
	ctx.context.session = session.response;
	return session.response;
};
/**
* Reads the session from the source that can authorize sensitive work.
*
* Stateful deployments must re-read the server-side session store because an
* earlier hook may have populated `ctx.context.session` from cookie cache.
* Stateless deployments keep the signed cookie as the session record.
*/
var getAuthoritativeSessionFromCtx = async (ctx) => {
	if (!isStateful(ctx)) return getSessionFromCtx(ctx);
	ctx.context.session = null;
	return getSessionFromCtx(ctx, { disableCookieCache: true });
};
/**
* The middleware forces the endpoint to require a valid session.
*/
var sessionMiddleware = createAuthMiddleware(async (ctx) => {
	const session = await getSessionFromCtx(ctx);
	if (!session?.session) throw APIError.from("UNAUTHORIZED", {
		message: "Unauthorized",
		code: "UNAUTHORIZED"
	});
	return { session };
});
/**
* This middleware forces the endpoint to require a valid authoritative session.
* This should be used for sensitive operations like password changes, account deletion, etc.
*/
var sensitiveSessionMiddleware = createAuthMiddleware(async (ctx) => {
	const session = await getAuthoritativeSessionFromCtx(ctx);
	if (!session?.session) throw APIError.from("UNAUTHORIZED", {
		message: "Unauthorized",
		code: "UNAUTHORIZED"
	});
	return { session };
});
/**
* This middleware allows you to call the endpoint on the client if session is valid.
* However, if called on the server, no session is required.
*/
var requestOnlySessionMiddleware = createAuthMiddleware(async (ctx) => {
	const session = await getSessionFromCtx(ctx);
	if (!session?.session && (ctx.request || ctx.headers)) throw APIError.from("UNAUTHORIZED", {
		message: "Unauthorized",
		code: "UNAUTHORIZED"
	});
	return { session };
});
/**
* This middleware forces the endpoint to require a valid session,
* as well as making sure the session is fresh before proceeding.
*
* Session freshness check will be skipped if the session config's freshAge
* is set to 0
*/
var freshSessionMiddleware = createAuthMiddleware(async (ctx) => {
	const session = await getSessionFromCtx(ctx);
	if (!session?.session) throw APIError.from("UNAUTHORIZED", {
		message: "Unauthorized",
		code: "UNAUTHORIZED"
	});
	if (ctx.context.sessionConfig.freshAge !== 0) {
		const createdAt = new Date(session.session.createdAt).getTime();
		const freshAge = ctx.context.sessionConfig.freshAge * 1e3;
		if (Date.now() - createdAt >= freshAge) throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.SESSION_NOT_FRESH);
	}
	return { session };
});
/**
* user active sessions list
*/
var listSessions = () => createAuthEndpoint("/list-sessions", {
	method: "GET",
	operationId: "listUserSessions",
	use: [freshSessionMiddleware],
	requireHeaders: true,
	metadata: { openapi: {
		operationId: "listUserSessions",
		description: "List all active sessions for the user",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "array",
				items: { $ref: "#/components/schemas/Session" }
			} } }
		} }
	} }
}, async (ctx) => {
	try {
		const activeSessions = (await ctx.context.internalAdapter.listSessions(ctx.context.session.user.id, { onlyActiveSessions: true })).filter((session) => {
			return session.expiresAt > /* @__PURE__ */ new Date();
		});
		return ctx.json(activeSessions.map((session) => parseSessionOutput(ctx.context.options, session)));
	} catch (e) {
		ctx.context.logger.error(e);
		throw ctx.error("INTERNAL_SERVER_ERROR");
	}
});
/**
* revoke a single session
*/
var revokeSession = createAuthEndpoint("/revoke-session", {
	method: "POST",
	body: object({ token: string().meta({ description: "The token to revoke" }) }),
	use: [sensitiveSessionMiddleware],
	requireHeaders: true,
	metadata: { openapi: {
		description: "Revoke a single session",
		requestBody: { content: { "application/json": { schema: {
			type: "object",
			properties: { token: {
				type: "string",
				description: "The token to revoke"
			} },
			required: ["token"]
		} } } },
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { status: {
					type: "boolean",
					description: "Indicates if the session was revoked successfully"
				} },
				required: ["status"]
			} } }
		} }
	} }
}, async (ctx) => {
	const token = ctx.body.token;
	if ((await ctx.context.internalAdapter.findSession(token))?.session.userId === ctx.context.session.user.id) try {
		await ctx.context.internalAdapter.deleteSession(token);
	} catch (error) {
		ctx.context.logger.error(error && typeof error === "object" && "name" in error ? error.name : "", error);
		throw APIError.from("INTERNAL_SERVER_ERROR", {
			message: "Internal Server Error",
			code: "INTERNAL_SERVER_ERROR"
		});
	}
	return ctx.json({ status: true });
});
/**
* revoke all user sessions
*/
var revokeSessions = createAuthEndpoint("/revoke-sessions", {
	method: "POST",
	use: [sensitiveSessionMiddleware],
	requireHeaders: true,
	metadata: { openapi: {
		description: "Revoke all sessions for the user",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { status: {
					type: "boolean",
					description: "Indicates if all sessions were revoked successfully"
				} },
				required: ["status"]
			} } }
		} }
	} }
}, async (ctx) => {
	try {
		await ctx.context.internalAdapter.deleteUserSessions(ctx.context.session.user.id);
	} catch (error) {
		ctx.context.logger.error(error && typeof error === "object" && "name" in error ? error.name : "", error);
		throw APIError.from("INTERNAL_SERVER_ERROR", {
			message: "Internal Server Error",
			code: "INTERNAL_SERVER_ERROR"
		});
	}
	return ctx.json({ status: true });
});
var revokeOtherSessions = createAuthEndpoint("/revoke-other-sessions", {
	method: "POST",
	requireHeaders: true,
	use: [sensitiveSessionMiddleware],
	metadata: { openapi: {
		description: "Revoke all other sessions for the user except the current one",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { status: {
					type: "boolean",
					description: "Indicates if all other sessions were revoked successfully"
				} },
				required: ["status"]
			} } }
		} }
	} }
}, async (ctx) => {
	const session = ctx.context.session;
	if (!session.user) throw APIError.from("UNAUTHORIZED", {
		message: "Unauthorized",
		code: "UNAUTHORIZED"
	});
	const otherSessions = (await ctx.context.internalAdapter.listSessions(session.user.id)).filter((session) => {
		return session.expiresAt > /* @__PURE__ */ new Date();
	}).filter((session) => session.token !== ctx.context.session.session.token);
	await Promise.all(otherSessions.map((session) => ctx.context.internalAdapter.deleteSession(session.token)));
	return ctx.json({ status: true });
});
function assertValidUserInfoSource(source) {
	if (!source?.method) throw new APIError("FORBIDDEN", {
		code: "validation_source_missing",
		message: "User validation source is required"
	});
	if (source.method === "oauth" && !source.oauth?.providerId) throw new APIError("FORBIDDEN", {
		code: "validation_source_missing",
		message: "OAuth user validation source requires oauth.providerId"
	});
	if ((source.method === "sso-oidc" || source.method === "sso-saml") && !source.sso?.providerId) throw new APIError("FORBIDDEN", {
		code: "validation_source_missing",
		message: "SSO user validation source requires sso.providerId"
	});
}
/**
* Invoke the application's `user.validateUserInfo` gate and throw a `403`
* {@link APIError} if it rejects.
*
* Fails closed: if the hook throws, provisioning is rejected rather than
* silently allowed.
*/
async function assertValidUserInfo(ctx, data) {
	const validate = ctx.context.options.user?.validateUserInfo;
	if (!validate) return;
	assertValidUserInfoSource(data.source);
	let result;
	try {
		result = await validate(data, ctx);
	} catch (error) {
		ctx.context.logger.error("validateUserInfo callback threw", error);
		throw new APIError("FORBIDDEN", {
			code: "validation_failed",
			message: "User validation failed"
		});
	}
	if (result?.error) throw new APIError("FORBIDDEN", {
		code: result.error,
		message: result.errorDescription || result.error
	});
}
var defaultKeyHasher$2 = async (identifier) => {
	const hash = await createHash("SHA-256").digest(new TextEncoder().encode(identifier));
	return base64Url.encode(new Uint8Array(hash), { padding: false });
};
async function processIdentifier(identifier, option) {
	if (!option || option === "plain") return identifier;
	if (option === "hashed") return defaultKeyHasher$2(identifier);
	if (typeof option === "object" && "hash" in option) return option.hash(identifier);
	return identifier;
}
function getStorageOption(identifier, config) {
	if (!config) return;
	if (typeof config === "object" && "default" in config) {
		if (config.overrides) {
			for (const [prefix, option] of Object.entries(config.overrides)) if (identifier.startsWith(prefix)) return option;
		}
		return config.default;
	}
	return config;
}
function getWithHooks(adapter, ctx) {
	const withSpan = createWithSpan(ctx.options);
	const hooksEntries = ctx.hooks;
	async function createWithHooks(data, model, customCreateFn) {
		const context = tryGetCurrentAuthEndpointContext();
		let actualData = data;
		for (const { source, hooks } of hooksEntries) {
			const toRun = hooks[model]?.create?.before;
			if (toRun) {
				const result = await withSpan(`db create.before ${model}`, {
					[ATTR_HOOK_TYPE]: "create.before",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					[ATTR_CONTEXT]: source
				}, () => toRun(actualData, context));
				if (result === false) return null;
				if (typeof result === "object" && "data" in result) actualData = {
					...actualData,
					...result.data
				};
			}
		}
		let created = null;
		if (!customCreateFn || customCreateFn.executeMainFn) created = await (await getCurrentAdapter(adapter)).create({
			model,
			data: actualData,
			forceAllowId: true
		});
		if (customCreateFn?.fn) created = await customCreateFn.fn(created ?? actualData);
		for (const { source, hooks } of hooksEntries) {
			const toRun = hooks[model]?.create?.after;
			if (toRun) await queueAfterTransactionHook(async () => {
				await withSpan(`db create.after ${model}`, {
					[ATTR_HOOK_TYPE]: "create.after",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					[ATTR_CONTEXT]: source
				}, () => toRun(created, context));
			});
		}
		return created;
	}
	async function updateWithHooks(data, where, model, customUpdateFn) {
		const context = tryGetCurrentAuthEndpointContext();
		let actualData = data;
		for (const { source, hooks } of hooksEntries) {
			const toRun = hooks[model]?.update?.before;
			if (toRun) {
				const result = await withSpan(`db update.before ${model}`, {
					[ATTR_HOOK_TYPE]: "update.before",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					[ATTR_CONTEXT]: source
				}, () => toRun(data, context));
				if (result === false) return null;
				if (typeof result === "object" && "data" in result) actualData = {
					...actualData,
					...result.data
				};
			}
		}
		const customUpdated = customUpdateFn ? await customUpdateFn.fn(actualData) : null;
		const updated = !customUpdateFn || customUpdateFn.executeMainFn ? await (await getCurrentAdapter(adapter)).update({
			model,
			update: actualData,
			where
		}) : customUpdated;
		for (const { source, hooks } of hooksEntries) {
			const toRun = hooks[model]?.update?.after;
			if (toRun) await queueAfterTransactionHook(async () => {
				await withSpan(`db update.after ${model}`, {
					[ATTR_HOOK_TYPE]: "update.after",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					[ATTR_CONTEXT]: source
				}, () => toRun(updated, context));
			});
		}
		return updated;
	}
	async function updateManyWithHooks(data, where, model, customUpdateFn) {
		const context = tryGetCurrentAuthEndpointContext();
		let actualData = data;
		for (const { source, hooks } of hooksEntries) {
			const toRun = hooks[model]?.update?.before;
			if (toRun) {
				const result = await withSpan(`db updateMany.before ${model}`, {
					[ATTR_HOOK_TYPE]: "updateMany.before",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					[ATTR_CONTEXT]: source
				}, () => toRun(data, context));
				if (result === false) return null;
				if (typeof result === "object" && "data" in result) actualData = {
					...actualData,
					...result.data
				};
			}
		}
		const customUpdated = customUpdateFn ? await customUpdateFn.fn(actualData) : null;
		const updated = !customUpdateFn || customUpdateFn.executeMainFn ? await (await getCurrentAdapter(adapter)).updateMany({
			model,
			update: actualData,
			where
		}) : customUpdated;
		for (const { source, hooks } of hooksEntries) {
			const toRun = hooks[model]?.update?.after;
			if (toRun) await queueAfterTransactionHook(async () => {
				await withSpan(`db updateMany.after ${model}`, {
					[ATTR_HOOK_TYPE]: "updateMany.after",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					[ATTR_CONTEXT]: source
				}, () => toRun(updated, context));
			});
		}
		return updated;
	}
	async function deleteWithHooks(where, model, customDeleteFn) {
		const context = tryGetCurrentAuthEndpointContext();
		let entityToDelete = null;
		try {
			entityToDelete = (await (await getCurrentAdapter(adapter)).findMany({
				model,
				where,
				limit: 1
			}))[0] || null;
		} catch {}
		if (entityToDelete) for (const { source, hooks } of hooksEntries) {
			const toRun = hooks[model]?.delete?.before;
			if (toRun) {
				if (await withSpan(`db delete.before ${model}`, {
					["better_auth.hook.type"]: "delete.before",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					["better_auth.context"]: source
				}, () => toRun(entityToDelete, context)) === false) return null;
			}
		}
		const customDeleted = customDeleteFn ? await customDeleteFn.fn(where) : null;
		const deleted = (!customDeleteFn || customDeleteFn.executeMainFn) && entityToDelete ? await (await getCurrentAdapter(adapter)).delete({
			model,
			where
		}) : customDeleted;
		if (entityToDelete) for (const { source, hooks } of hooksEntries) {
			const toRun = hooks[model]?.delete?.after;
			if (toRun) await queueAfterTransactionHook(async () => {
				await withSpan(`db delete.after ${model}`, {
					[ATTR_HOOK_TYPE]: "delete.after",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					[ATTR_CONTEXT]: source
				}, () => toRun(entityToDelete, context));
			});
		}
		return deleted;
	}
	async function deleteManyWithHooks(where, model, customDeleteFn) {
		const context = tryGetCurrentAuthEndpointContext();
		let entitiesToDelete = [];
		try {
			entitiesToDelete = await (await getCurrentAdapter(adapter)).findMany({
				model,
				where
			});
		} catch {}
		for (const entity of entitiesToDelete) for (const { source, hooks } of hooksEntries) {
			const toRun = hooks[model]?.delete?.before;
			if (toRun) {
				if (await withSpan(`db delete.before ${model}`, {
					["better_auth.hook.type"]: "delete.before",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					["better_auth.context"]: source
				}, () => toRun(entity, context)) === false) return null;
			}
		}
		const customDeleted = customDeleteFn ? await customDeleteFn.fn(where) : null;
		const deleted = !customDeleteFn || customDeleteFn.executeMainFn ? await (await getCurrentAdapter(adapter)).deleteMany({
			model,
			where
		}) : customDeleted;
		for (const entity of entitiesToDelete) for (const { source, hooks } of hooksEntries) {
			const toRun = hooks[model]?.delete?.after;
			if (toRun) await queueAfterTransactionHook(async () => {
				await withSpan(`db delete.after ${model}`, {
					[ATTR_HOOK_TYPE]: "delete.after",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					[ATTR_CONTEXT]: source
				}, () => toRun(entity, context));
			});
		}
		return deleted;
	}
	/**
	* Wraps an atomic consume operation in the plugin `delete.before` and
	* `delete.after` hook lifecycle. The caller supplies a `consumeFn` that
	* performs the actual single-row delete-and-return (typically the
	* adapter's `consumeOne`). The first concurrent caller wins, subsequent
	* racers resolve to `null` without firing `delete.after` hooks.
	*
	* `preSnapshot` lets the caller hand in a row it already fetched so
	* `delete.before` hooks don't trigger a second read. Without it, the
	* helper falls back to a best-effort `findMany` against `hookWhere`.
	* The snapshot only feeds `delete.before`; the `consumeFn` return value
	* is the race gate.
	*
	* Returning `false` from a `delete.before` hook aborts the consume and
	* the helper resolves to `null` (no `consumeFn` call, no after hooks).
	*/
	async function consumeOneWithHooks(model, hookWhere, consumeFn, preSnapshot) {
		const context = tryGetCurrentAuthEndpointContext();
		const beforeHooks = hooksEntries.flatMap(({ source, hooks }) => {
			const fn = hooks[model]?.delete?.before;
			return fn ? [{
				source,
				fn
			}] : [];
		});
		let snapshot = preSnapshot ?? null;
		if (beforeHooks.length) {
			if (!snapshot) try {
				snapshot = (await (await getCurrentAdapter(adapter)).findMany({
					model,
					where: hookWhere,
					limit: 1
				}))[0] || null;
			} catch {}
			if (snapshot) {
				for (const { source, fn } of beforeHooks) if (await withSpan(`db delete.before ${model}`, {
					["better_auth.hook.type"]: "delete.before",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					["better_auth.context"]: source
				}, () => fn(snapshot, context)) === false) return null;
			}
		}
		const consumed = await consumeFn();
		if (!consumed) return null;
		for (const { source, hooks } of hooksEntries) {
			const toRun = hooks[model]?.delete?.after;
			if (toRun) await queueAfterTransactionHook(async () => {
				await withSpan(`db delete.after ${model}`, {
					[ATTR_HOOK_TYPE]: "delete.after",
					[import_src.ATTR_DB_COLLECTION_NAME]: model,
					[ATTR_CONTEXT]: source
				}, () => toRun(consumed, context));
			});
		}
		return consumed;
	}
	return {
		createWithHooks,
		updateWithHooks,
		updateManyWithHooks,
		deleteWithHooks,
		deleteManyWithHooks,
		consumeOneWithHooks
	};
}
function getTTLSeconds(expiresAt, now = Date.now()) {
	const expiresMs = typeof expiresAt === "number" ? expiresAt : expiresAt.getTime();
	return Math.max(Math.floor((expiresMs - now) / 1e3), 0);
}
var createInternalAdapter = (adapter, ctx) => {
	const logger = ctx.logger;
	const options = ctx.options;
	const secondaryStorage = options.secondaryStorage;
	const verificationConsumeLocks = /* @__PURE__ */ new Map();
	const sessionExpiration = options.session?.expiresIn || 604800;
	const { createWithHooks, updateWithHooks, updateManyWithHooks, deleteWithHooks, deleteManyWithHooks, consumeOneWithHooks } = getWithHooks(adapter, ctx);
	/**
	* Ends the live session rows matched by `where` without physically deleting
	* them.
	*
	* Used for `secondaryStorage` + `preserveSessionInDatabase`, where the row is
	* kept for audit. The session-delete hooks still run (so OAuth token
	* revocation and back-channel logout fire on session end), and the preserved
	* row's `expiresAt` is set to now so every liveness check that keys off the
	* session row (introspection, `/userinfo`) treats it as ended.
	*
	* Matching is restricted to still-live rows. The preserved row outlives the
	* session, so without this a later delete call (a repeated `deleteSession`,
	* or `deleteUserSessions` sweeping a user's accumulated preserved rows) would
	* re-match it and re-fire the hooks, re-dispatching back-channel logout.
	*/
	const endPreservedSessions = (where) => {
		const liveSessions = [...where, {
			field: "expiresAt",
			value: /* @__PURE__ */ new Date(),
			operator: "gt"
		}];
		return deleteManyWithHooks(liveSessions, "session", {
			fn: async () => {
				await (await getCurrentAdapter(adapter)).updateMany({
					model: "session",
					where: liveSessions,
					update: { expiresAt: /* @__PURE__ */ new Date() }
				});
			},
			executeMainFn: false
		});
	};
	async function refreshUserSessions(user) {
		if (!secondaryStorage) return;
		const listRaw = await secondaryStorage.get(`active-sessions-${user.id}`);
		if (!listRaw) return;
		const now = Date.now();
		const validSessions = (safeJSONParse(listRaw) || []).filter((s) => s.expiresAt > now);
		await Promise.all(validSessions.map(async ({ token }) => {
			const cached = await secondaryStorage.get(token);
			if (!cached) return;
			const parsed = safeJSONParse(cached);
			if (!parsed) return;
			const sessionTTL = getTTLSeconds(parsed.session.expiresAt, now);
			await secondaryStorage.set(token, JSON.stringify({
				session: parsed.session,
				user
			}), Math.floor(sessionTTL));
		}));
	}
	async function getActiveSessionReferences(userId) {
		if (!secondaryStorage) return [];
		const activeSessions = await secondaryStorage.get(`active-sessions-${userId}`);
		return activeSessions ? safeJSONParse(activeSessions) || [] : [];
	}
	async function deleteCachedUserSessions(userId, sessionReferences) {
		if (!secondaryStorage) return;
		const deletedTokens = new Set(sessionReferences.map((session) => session.token));
		for (const { token } of sessionReferences) await secondaryStorage.delete(token);
		const activeSessionsKey = `active-sessions-${userId}`;
		const currentSessionReferences = await getActiveSessionReferences(userId);
		const now = Date.now();
		const remainingSessionReferences = currentSessionReferences.filter((session) => session.expiresAt > now && !deletedTokens.has(session.token));
		remainingSessionReferences.sort((a, b) => a.expiresAt - b.expiresAt);
		const furthestExpiration = remainingSessionReferences.at(-1)?.expiresAt;
		if (furthestExpiration) {
			await secondaryStorage.set(activeSessionsKey, JSON.stringify(remainingSessionReferences), getTTLSeconds(furthestExpiration, now));
			return;
		}
		await secondaryStorage.delete(activeSessionsKey);
	}
	async function queueCachedUserSessionDeletion(userId, sessionReferences) {
		if (!secondaryStorage) return;
		const references = sessionReferences ?? await getActiveSessionReferences(userId);
		await queueAfterTransactionHook(() => deleteCachedUserSessions(userId, references), { onError(error) {
			logger.error("Failed to delete committed user sessions from secondary storage", error);
		} });
	}
	async function withVerificationConsumeLock(key, fn) {
		const previous = verificationConsumeLocks.get(key) ?? Promise.resolve();
		let release;
		const current = new Promise((resolve) => {
			release = resolve;
		});
		const next = previous.catch(() => {}).then(() => current);
		verificationConsumeLocks.set(key, next);
		await previous.catch(() => {});
		try {
			return await fn();
		} finally {
			release();
			if (verificationConsumeLocks.get(key) === next) verificationConsumeLocks.delete(key);
		}
	}
	return {
		createOAuthUser: async (user, account) => {
			return runWithTransaction(adapter, async () => {
				const createdUser = await createWithHooks({
					createdAt: /* @__PURE__ */ new Date(),
					updatedAt: /* @__PURE__ */ new Date(),
					...user,
					email: user.email?.toLowerCase()
				}, "user", void 0);
				if (!createdUser) throw new APIError("BAD_REQUEST", { message: "Failed to create user" });
				return {
					user: createdUser,
					account: await createWithHooks({
						...account,
						userId: createdUser.id,
						createdAt: /* @__PURE__ */ new Date(),
						updatedAt: /* @__PURE__ */ new Date()
					}, "account", void 0)
				};
			});
		},
		createUser: async (user, source) => {
			const data = {
				createdAt: /* @__PURE__ */ new Date(),
				updatedAt: /* @__PURE__ */ new Date(),
				...user,
				email: user.email?.toLowerCase()
			};
			if (options.user?.validateUserInfo) {
				const validationSource = {
					...source,
					action: "create-user"
				};
				assertValidUserInfoSource(validationSource);
				let endpointContext;
				try {
					endpointContext = getCurrentAuthEndpointContext();
				} catch (error) {
					logger.error("Unable to run validateUserInfo: missing endpoint context", error);
					throw new APIError("FORBIDDEN", {
						code: "validation_context_missing",
						message: "User validation requires an endpoint context"
					});
				}
				await assertValidUserInfo(endpointContext, {
					user: data,
					source: validationSource
				});
			}
			return await createWithHooks(data, "user", void 0);
		},
		createAccount: async (account) => {
			return await createWithHooks({
				createdAt: /* @__PURE__ */ new Date(),
				updatedAt: /* @__PURE__ */ new Date(),
				...account
			}, "account", void 0);
		},
		listSessions: async (userId, options) => {
			if (secondaryStorage) {
				const currentList = await secondaryStorage.get(`active-sessions-${userId}`);
				if (!currentList) return [];
				const list = safeJSONParse(currentList) || [];
				const now = Date.now();
				const seenTokens = /* @__PURE__ */ new Set();
				const sessions = [];
				for (const { token, expiresAt } of list) {
					if (expiresAt <= now || seenTokens.has(token)) continue;
					seenTokens.add(token);
					const data = await secondaryStorage.get(token);
					if (!data) continue;
					try {
						const parsed = typeof data === "string" ? JSON.parse(data) : data;
						if (!parsed?.session) continue;
						sessions.push(parseSessionOutput(ctx.options, {
							...parsed.session,
							expiresAt: new Date(parsed.session.expiresAt)
						}));
					} catch {
						continue;
					}
				}
				return sessions;
			}
			return await (await getCurrentAdapter(adapter)).findMany({
				model: "session",
				where: [{
					field: "userId",
					value: userId
				}, ...options?.onlyActiveSessions ? [{
					field: "expiresAt",
					value: /* @__PURE__ */ new Date(),
					operator: "gt"
				}] : []]
			});
		},
		listUsers: async (limit, offset, sortBy, where) => {
			return await (await getCurrentAdapter(adapter)).findMany({
				model: "user",
				limit,
				offset,
				sortBy,
				where
			});
		},
		countTotalUsers: async (where) => {
			const total = await (await getCurrentAdapter(adapter)).count({
				model: "user",
				where
			});
			if (typeof total === "string") return parseInt(total);
			return total;
		},
		deleteUser: async (userId) => {
			const sessionReferences = await getActiveSessionReferences(userId);
			if (!secondaryStorage || options.session?.storeSessionInDatabase) await deleteManyWithHooks([{
				field: "userId",
				value: userId
			}], "session", void 0);
			await deleteManyWithHooks([{
				field: "userId",
				value: userId
			}], "account", void 0);
			if (await deleteWithHooks([{
				field: "id",
				value: userId
			}], "user", void 0) !== null) await queueCachedUserSessionDeletion(userId, sessionReferences);
		},
		createSession: async (userId, dontRememberMe, override, overrideAll, storageOptions) => {
			const headers = await (async () => {
				const ctx = tryGetCurrentAuthEndpointContext();
				return ctx?.headers || ctx?.request?.headers;
			})();
			const storeInDb = options.session?.storeSessionInDatabase;
			const databaseSessionFallbackEnabled = storeInDb === true && options.session?.preserveSessionInDatabase !== true;
			const { id: _, ...rest } = override || {};
			let sessionId;
			if (secondaryStorage && !storeInDb) {
				const generatedId = ctx.generateId({ model: "session" });
				sessionId = generatedId !== false ? generatedId : generateId();
			}
			const defaultAdditionalFields = getSessionDefaultFields(options);
			const data = {
				...sessionId ? { id: sessionId } : {},
				ipAddress: headers ? getIP(headers, options) || "" : "",
				userAgent: headers?.get("user-agent") || "",
				...rest,
				/**
				* If the user doesn't want to be remembered
				* set the session to expire in 1 day.
				* The cookie will be set to expire at the end of the session
				*/
				expiresAt: dontRememberMe ? getDate(86400, "sec") : getDate(sessionExpiration, "sec"),
				userId,
				token: generateId(32),
				createdAt: /* @__PURE__ */ new Date(),
				updatedAt: /* @__PURE__ */ new Date(),
				...defaultAdditionalFields,
				...overrideAll ? rest : {}
			};
			const mirrorSessionToSecondaryStorage = async (sessionData) => {
				if (!secondaryStorage) return sessionData;
				const currentList = await secondaryStorage.get(`active-sessions-${userId}`);
				let list = [];
				const now = Date.now();
				if (currentList) {
					list = safeJSONParse(currentList) || [];
					list = list.filter((session) => session.expiresAt > now && session.token !== data.token);
				}
				const sorted = [...list, {
					token: data.token,
					expiresAt: data.expiresAt.getTime()
				}].sort((a, b) => a.expiresAt - b.expiresAt);
				const furthestSessionTTL = getTTLSeconds(sorted.at(-1)?.expiresAt ?? data.expiresAt.getTime(), now);
				if (furthestSessionTTL > 0) await secondaryStorage.set(`active-sessions-${userId}`, JSON.stringify(sorted), furthestSessionTTL);
				const user = await (await getCurrentAdapter(adapter)).findOne({
					model: "user",
					where: [{
						field: "id",
						value: userId
					}]
				});
				const sessionTTL = getTTLSeconds(data.expiresAt, now);
				if (sessionTTL > 0) await secondaryStorage.set(data.token, JSON.stringify({
					session: sessionData,
					user
				}), sessionTTL);
				return sessionData;
			};
			const res = await createWithHooks(data, "session", secondaryStorage ? {
				fn: async (sessionData) => {
					return storageOptions?.deferSecondaryStorageWrites ? sessionData : mirrorSessionToSecondaryStorage(sessionData);
				},
				executeMainFn: storeInDb
			} : void 0);
			if (secondaryStorage && storageOptions?.deferSecondaryStorageWrites && res) await queueAfterTransactionHook(async () => {
				await mirrorSessionToSecondaryStorage(res);
			}, databaseSessionFallbackEnabled ? { onError(error) {
				logger.error("Failed to mirror committed session to secondary storage", error);
			} } : void 0);
			return res;
		},
		findSession: async (token) => {
			if (secondaryStorage) {
				const sessionStringified = await secondaryStorage.get(token);
				if (!sessionStringified && (!options.session?.storeSessionInDatabase || ctx.options.session?.preserveSessionInDatabase)) return null;
				if (sessionStringified) {
					const s = safeJSONParse(sessionStringified);
					if (!s) return null;
					return {
						session: parseSessionOutput(ctx.options, {
							...s.session,
							expiresAt: new Date(s.session.expiresAt),
							createdAt: new Date(s.session.createdAt),
							updatedAt: new Date(s.session.updatedAt)
						}),
						user: parseUserOutput(ctx.options, {
							...s.user,
							createdAt: new Date(s.user.createdAt),
							updatedAt: new Date(s.user.updatedAt)
						})
					};
				}
			}
			const result = await (await getCurrentAdapter(adapter)).findOne({
				model: "session",
				where: [{
					value: token,
					field: "token"
				}],
				join: { user: true }
			});
			if (!result) return null;
			const { user, ...session } = result;
			if (!user) return null;
			return {
				session: parseSessionOutput(ctx.options, session),
				user: parseUserOutput(ctx.options, user)
			};
		},
		findSessions: async (sessionTokens, options) => {
			if (secondaryStorage) {
				const sessions = [];
				for (const sessionToken of sessionTokens) {
					const sessionStringified = await secondaryStorage.get(sessionToken);
					if (sessionStringified) try {
						const s = typeof sessionStringified === "string" ? JSON.parse(sessionStringified) : sessionStringified;
						if (!s) continue;
						const expiresAt = new Date(s.session.expiresAt);
						if (options?.onlyActiveSessions && expiresAt <= /* @__PURE__ */ new Date()) continue;
						const session = {
							session: {
								...s.session,
								expiresAt: new Date(s.session.expiresAt)
							},
							user: {
								...s.user,
								createdAt: new Date(s.user.createdAt),
								updatedAt: new Date(s.user.updatedAt)
							}
						};
						sessions.push(session);
					} catch {
						continue;
					}
				}
				return sessions;
			}
			const sessions = await (await getCurrentAdapter(adapter)).findMany({
				model: "session",
				where: [{
					field: "token",
					value: sessionTokens,
					operator: "in"
				}, ...options?.onlyActiveSessions ? [{
					field: "expiresAt",
					value: /* @__PURE__ */ new Date(),
					operator: "gt"
				}] : []],
				join: { user: true }
			});
			if (!sessions.length) return [];
			if (sessions.some((session) => !session.user)) return [];
			return sessions.map((_session) => {
				const { user, ...session } = _session;
				return {
					session,
					user
				};
			});
		},
		updateSession: async (sessionToken, session) => {
			return await updateWithHooks(session, [{
				field: "token",
				value: sessionToken
			}], "session", secondaryStorage ? {
				async fn(data) {
					const currentSession = await secondaryStorage.get(sessionToken);
					if (!currentSession) return null;
					const parsedSession = safeJSONParse(currentSession);
					if (!parsedSession) return null;
					const mergedSession = {
						...parsedSession.session,
						...data,
						expiresAt: new Date(data.expiresAt ?? parsedSession.session.expiresAt),
						createdAt: new Date(parsedSession.session.createdAt),
						updatedAt: new Date(data.updatedAt ?? parsedSession.session.updatedAt)
					};
					const updatedSession = parseSessionOutput(ctx.options, mergedSession);
					const now = Date.now();
					const expiresMs = new Date(updatedSession.expiresAt).getTime();
					const sessionTTL = getTTLSeconds(expiresMs, now);
					if (sessionTTL > 0) {
						await secondaryStorage.set(sessionToken, JSON.stringify({
							session: updatedSession,
							user: parsedSession.user
						}), sessionTTL);
						const listKey = `active-sessions-${updatedSession.userId}`;
						const listRaw = await secondaryStorage.get(listKey);
						const sorted = (listRaw ? safeJSONParse(listRaw) || [] : []).filter((s) => s.token !== sessionToken && s.expiresAt > now).concat([{
							token: sessionToken,
							expiresAt: expiresMs
						}]).sort((a, b) => a.expiresAt - b.expiresAt);
						const furthestSessionExp = sorted.at(-1)?.expiresAt;
						if (furthestSessionExp && furthestSessionExp > now) await secondaryStorage.set(listKey, JSON.stringify(sorted), getTTLSeconds(furthestSessionExp, now));
						else await secondaryStorage.delete(listKey);
					}
					return updatedSession;
				},
				executeMainFn: options.session?.storeSessionInDatabase
			} : void 0);
		},
		deleteSession: async (token) => {
			if (secondaryStorage) {
				const data = await secondaryStorage.get(token);
				if (data) {
					const { session } = safeJSONParse(data) ?? {};
					if (!session) {
						logger.error("Session not found in secondary storage");
						return;
					}
					const userId = session.userId;
					const currentList = await secondaryStorage.get(`active-sessions-${userId}`);
					if (currentList) {
						const list = safeJSONParse(currentList) || [];
						const now = Date.now();
						const filtered = list.filter((session) => session.expiresAt > now && session.token !== token);
						const furthestSessionExp = filtered.sort((a, b) => a.expiresAt - b.expiresAt).at(-1)?.expiresAt;
						if (filtered.length > 0 && furthestSessionExp && furthestSessionExp > Date.now()) await secondaryStorage.set(`active-sessions-${userId}`, JSON.stringify(filtered), getTTLSeconds(furthestSessionExp, now));
						else await secondaryStorage.delete(`active-sessions-${userId}`);
					} else logger.error("Active sessions list not found in secondary storage");
				}
				await secondaryStorage.delete(token);
				if (!options.session?.storeSessionInDatabase) return;
				if (ctx.options.session?.preserveSessionInDatabase) {
					await endPreservedSessions([{
						field: "token",
						value: token
					}]);
					return;
				}
			}
			await deleteWithHooks([{
				field: "token",
				value: token
			}], "session", void 0);
		},
		deleteAccounts: async (userId) => {
			await deleteManyWithHooks([{
				field: "userId",
				value: userId
			}], "account", void 0);
		},
		/**
		* Delete an account by its primary key.
		*
		* @param id - The account row's primary key, not its accountId.
		*/
		deleteAccount: async (id) => {
			await deleteWithHooks([{
				field: "id",
				value: id
			}], "account", void 0);
		},
		deleteUserSessions: async (userId) => {
			const sessionReferences = await getActiveSessionReferences(userId);
			if (secondaryStorage) {
				if (!options.session?.storeSessionInDatabase) {
					await queueCachedUserSessionDeletion(userId, sessionReferences);
					return;
				}
				if (ctx.options.session?.preserveSessionInDatabase) {
					if (await endPreservedSessions([{
						field: "userId",
						value: userId
					}]) !== null) await queueCachedUserSessionDeletion(userId, sessionReferences);
					return;
				}
			}
			if (await deleteManyWithHooks([{
				field: "userId",
				value: userId
			}], "session", void 0) !== null) await queueCachedUserSessionDeletion(userId, sessionReferences);
		},
		deleteSessions: async (sessionTokens) => {
			if (secondaryStorage) {
				await Promise.all(sessionTokens.map((token) => secondaryStorage.delete(token)));
				if (!options.session?.storeSessionInDatabase) return;
				if (ctx.options.session?.preserveSessionInDatabase) {
					await endPreservedSessions([{
						field: "token",
						value: sessionTokens,
						operator: "in"
					}]);
					return;
				}
			}
			await deleteManyWithHooks([{
				field: "token",
				value: sessionTokens,
				operator: "in"
			}], "session", void 0);
		},
		findAccountOwnerByKey: async ({ providerId, accountId }) => {
			const accountsWithUsers = await (await getCurrentAdapter(adapter)).findMany({
				model: "account",
				where: [{
					field: "providerId",
					value: providerId
				}, {
					field: "accountId",
					value: accountId
				}],
				limit: 2,
				join: { user: true }
			});
			if (accountsWithUsers.length > 1) throw new BetterAuthError(`Multiple accounts match the same accountId for provider ${JSON.stringify(providerId)}. Resolve duplicate account identities before continuing.`);
			const accountWithUser = accountsWithUsers[0];
			if (!accountWithUser) return null;
			const { user, ...account } = accountWithUser;
			return user ? {
				kind: "owned",
				user,
				account
			} : {
				kind: "orphaned",
				account
			};
		},
		findUserByEmail: async (email, options) => {
			const result = await (await getCurrentAdapter(adapter)).findOne({
				model: "user",
				where: [{
					value: email.toLowerCase(),
					field: "email"
				}],
				join: { ...options?.includeAccounts ? { account: true } : {} }
			});
			if (!result) return null;
			const { account: accounts, ...user } = result;
			return {
				user,
				accounts: accounts ?? []
			};
		},
		findUserById: async (userId) => {
			if (!userId) return null;
			return await (await getCurrentAdapter(adapter)).findOne({
				model: "user",
				where: [{
					field: "id",
					value: userId
				}]
			});
		},
		linkAccount: async (account) => {
			return await createWithHooks({
				createdAt: /* @__PURE__ */ new Date(),
				updatedAt: /* @__PURE__ */ new Date(),
				...account
			}, "account", void 0);
		},
		updateUser: async (userId, data) => {
			const user = await updateWithHooks({
				...data,
				...data.email ? { email: data.email.toLowerCase() } : {}
			}, [{
				field: "id",
				value: userId
			}], "user", void 0);
			await queueAfterTransactionHook(() => refreshUserSessions(user), { onError(error) {
				logger.error("Failed to refresh committed user sessions in secondary storage", error);
			} });
			return user;
		},
		updateUserByEmail: async (email, data) => {
			const user = await updateWithHooks({
				...data,
				...data.email ? { email: data.email.toLowerCase() } : {}
			}, [{
				field: "email",
				value: email.toLowerCase()
			}], "user", void 0);
			await queueAfterTransactionHook(() => refreshUserSessions(user), { onError(error) {
				logger.error("Failed to refresh committed user sessions in secondary storage", error);
			} });
			return user;
		},
		updatePassword: async (userId, password) => {
			await updateManyWithHooks({ password }, [
				{
					field: "userId",
					value: userId
				},
				{
					field: "providerId",
					value: "credential"
				},
				{
					field: "accountId",
					value: userId
				}
			], "account", void 0);
		},
		findAccounts: async (userId) => {
			return await (await getCurrentAdapter(adapter)).findMany({
				model: "account",
				where: [{
					field: "userId",
					value: userId
				}]
			});
		},
		findCredentialAccount: async (userId) => {
			return (await getCurrentAdapter(adapter)).findOne({
				model: "account",
				where: [
					{
						field: "userId",
						value: userId
					},
					{
						field: "providerId",
						value: "credential"
					},
					{
						field: "accountId",
						value: userId
					}
				]
			});
		},
		findAccountByKey: async ({ providerId, accountId }) => {
			const accounts = await (await getCurrentAdapter(adapter)).findMany({
				model: "account",
				limit: 2,
				where: [{
					field: "providerId",
					value: providerId
				}, {
					field: "accountId",
					value: accountId
				}]
			});
			if (accounts.length > 1) throw new BetterAuthError(`Multiple accounts match the same accountId for provider ${JSON.stringify(providerId)}. Resolve duplicate account identities before continuing.`);
			return accounts[0] ?? null;
		},
		findAccountByUserId: async (userId) => {
			return await (await getCurrentAdapter(adapter)).findMany({
				model: "account",
				where: [{
					field: "userId",
					value: userId
				}]
			});
		},
		updateAccount: async (id, data) => {
			return await updateWithHooks(data, [{
				field: "id",
				value: id
			}], "account", void 0);
		},
		createVerificationValue: async (data) => {
			const storageOption = getStorageOption(data.identifier, options.verification?.storeIdentifier);
			const storedIdentifier = await processIdentifier(data.identifier, storageOption);
			return await createWithHooks({
				createdAt: /* @__PURE__ */ new Date(),
				updatedAt: /* @__PURE__ */ new Date(),
				...data,
				identifier: storedIdentifier
			}, "verification", secondaryStorage ? {
				async fn(verificationData) {
					const ttl = getTTLSeconds(verificationData.expiresAt);
					if (ttl > 0) await secondaryStorage.set(`verification:${storedIdentifier}`, JSON.stringify(verificationData), ttl);
					return verificationData;
				},
				executeMainFn: options.verification?.storeInDatabase
			} : void 0);
		},
		findVerificationValue: async (identifier) => {
			const storageOption = getStorageOption(identifier, options.verification?.storeIdentifier);
			const storedIdentifier = await processIdentifier(identifier, storageOption);
			if (secondaryStorage) {
				const cached = await secondaryStorage.get(`verification:${storedIdentifier}`);
				if (cached) {
					const parsed = safeJSONParse(cached);
					if (parsed) return parsed;
				}
				if (storageOption && storageOption !== "plain") {
					const plainCached = await secondaryStorage.get(`verification:${identifier}`);
					if (plainCached) {
						const parsed = safeJSONParse(plainCached);
						if (parsed) return parsed;
					}
				}
				if (!options.verification?.storeInDatabase) return null;
			}
			const currentAdapter = await getCurrentAdapter(adapter);
			async function findByIdentifier(id) {
				return currentAdapter.findMany({
					model: "verification",
					where: [{
						field: "identifier",
						value: id
					}],
					sortBy: {
						field: "createdAt",
						direction: "desc"
					},
					limit: 1
				});
			}
			let verification = await findByIdentifier(storedIdentifier);
			if (!verification.length && storageOption && storageOption !== "plain") verification = await findByIdentifier(identifier);
			if (!options.verification?.disableCleanup) await deleteManyWithHooks([{
				field: "expiresAt",
				value: /* @__PURE__ */ new Date(),
				operator: "lt"
			}], "verification", void 0);
			return verification[0] || null;
		},
		deleteVerificationByIdentifier: async (identifier) => {
			const storedIdentifier = await processIdentifier(identifier, getStorageOption(identifier, options.verification?.storeIdentifier));
			if (secondaryStorage) await secondaryStorage.delete(`verification:${storedIdentifier}`);
			if (!secondaryStorage || options.verification?.storeInDatabase) await deleteWithHooks([{
				field: "identifier",
				value: storedIdentifier
			}], "verification", void 0);
		},
		/**
		* Atomically consume a single-use verification row by `identifier` and
		* return it. The first concurrent caller receives the latest row for the
		* identifier; every other caller racing against it receives `null`.
		*
		* Race-safe replacement for the `findVerificationValue` then
		* `deleteVerificationByIdentifier` pair. Callers MUST gate any state
		* change (issue session, mint token, change password) on a non-null
		* return value, because consuming one row invalidates the whole
		* identifier and stale rows cannot be replayed.
		*
		* Rows past their `expiresAt` are treated as already invalid: the row
		* is still deleted (so it cannot be replayed later) but `null` is
		* returned. Callers do not need their own `expiresAt` gate.
		*
		* The secondary-storage-only path (`storeInDatabase: false`) consumes
		* through `getAndDelete`, which is required on `SecondaryStorage` so
		* single-use values are not read and deleted as separate operations.
		*/
		consumeVerificationValue: async (identifier) => {
			const storageOption = getStorageOption(identifier, options.verification?.storeIdentifier);
			const storedIdentifier = await processIdentifier(identifier, storageOption);
			const identifiersToTry = storageOption && storageOption !== "plain" ? [storedIdentifier, identifier] : [storedIdentifier];
			const hydrateCachedVerification = (raw) => {
				if (!raw) return null;
				const candidate = typeof raw === "string" ? safeJSONParse(raw) : typeof raw === "object" ? raw : null;
				if (!candidate) return null;
				const expiresAt = new Date(candidate.expiresAt);
				if (!Number.isFinite(expiresAt.getTime())) return null;
				return {
					...candidate,
					expiresAt
				};
			};
			let consumed = null;
			if (secondaryStorage && !options.verification?.storeInDatabase) {
				const consumeCacheKey = async (key) => {
					return hydrateCachedVerification(await secondaryStorage.getAndDelete(key));
				};
				for (const stored of identifiersToTry) {
					const cached = await consumeCacheKey(`verification:${stored}`);
					if (!cached) continue;
					await Promise.all(identifiersToTry.filter((candidate) => candidate !== stored).map((candidate) => secondaryStorage.delete(`verification:${candidate}`)));
					consumed = cached;
					break;
				}
			} else {
				const consumeByIdentifier = async (id) => withVerificationConsumeLock(`verification:${id}`, () => runWithTransaction(adapter, async () => {
					const txAdapter = await getCurrentAdapter(adapter);
					const where = [{
						field: "identifier",
						value: id
					}];
					const latest = (await txAdapter.findMany({
						model: "verification",
						where,
						sortBy: {
							field: "createdAt",
							direction: "desc"
						},
						limit: 1
					}))[0] ?? null;
					if (!latest) return null;
					return consumeOneWithHooks("verification", [{
						field: "id",
						value: latest.id
					}], async () => {
						const row = await txAdapter.consumeOne({
							model: "verification",
							where: [{
								field: "id",
								value: latest.id
							}]
						});
						if (!row) return null;
						await txAdapter.deleteMany({
							model: "verification",
							where
						});
						return row;
					}, latest);
				}));
				for (const stored of identifiersToTry) {
					consumed = await consumeByIdentifier(stored);
					if (consumed) break;
				}
				if (consumed && secondaryStorage) await Promise.all(identifiersToTry.map((stored) => secondaryStorage.delete(`verification:${stored}`)));
			}
			if (!consumed || consumed.expiresAt < /* @__PURE__ */ new Date()) return null;
			return consumed;
		},
		/**
		* First-writer-wins create keyed by a deterministic primary key derived
		* from `identifier`. Returns `true` when this caller created the row and
		* `false` when a row for the same identifier already existed.
		*
		* The dual of `consumeVerificationValue`: where consume races to delete a
		* marker exactly once, reserve races to create a marker exactly once. Use
		* it for replay tombstones (a SAML assertion id, a JWT `jti`) where the
		* first caller wins and every later caller must observe that the marker is
		* already taken.
		*
		* The `verification.identifier` column is non-unique, so uniqueness comes
		* from a deterministic primary key (`SHA-256` of `reserve:<identifier>`).
		* The database path is atomic: the primary key turns the INSERT into the
		* first-writer-wins gate, and a duplicate is detected portably by
		* re-reading the row rather than matching adapter-specific errors.
		* Secondary-storage-only verification cannot enforce the deterministic
		* primary-key gate, so this operation fails closed unless verification is
		* backed by the database.
		*
		* The atomic guarantee requires the configured adapter to reject a
		* duplicate primary key on insert, which every real database enforces. The
		* in-memory adapter does not enforce primary-key uniqueness, so reservation
		* is best-effort there (it is intended for development and tests).
		*/
		reserveVerificationValue: async (data) => {
			const reservationId = base64Url.encode(new Uint8Array(await createHash("SHA-256").digest(new TextEncoder().encode("reserve:" + data.identifier))), { padding: false });
			const storageOption = getStorageOption(data.identifier, options.verification?.storeIdentifier);
			const storedIdentifier = await processIdentifier(data.identifier, storageOption);
			if (secondaryStorage && !options.verification?.storeInDatabase) throw new BetterAuthError("reserveVerificationValue requires database-backed verification storage. Set verification.storeInDatabase to true for flows that reserve verification values.");
			try {
				await adapter.create({
					model: "verification",
					data: {
						id: reservationId,
						identifier: storedIdentifier,
						value: data.value,
						expiresAt: data.expiresAt,
						createdAt: /* @__PURE__ */ new Date(),
						updatedAt: /* @__PURE__ */ new Date()
					},
					forceAllowId: true
				});
			} catch (error) {
				if (await adapter.findOne({
					model: "verification",
					where: [{
						field: "id",
						value: reservationId
					}]
				})) return false;
				throw error;
			}
			if (secondaryStorage) {
				const ttl = getTTLSeconds(data.expiresAt);
				if (ttl > 0) await secondaryStorage.set(`verification:${storedIdentifier}`, JSON.stringify({
					id: reservationId,
					identifier: storedIdentifier,
					value: data.value,
					expiresAt: data.expiresAt
				}), ttl);
			}
			return true;
		},
		updateVerificationByIdentifier: async (identifier, data) => {
			const storedIdentifier = await processIdentifier(identifier, getStorageOption(identifier, options.verification?.storeIdentifier));
			if (secondaryStorage) {
				const cached = await secondaryStorage.get(`verification:${storedIdentifier}`);
				if (cached) {
					const parsed = safeJSONParse(cached);
					if (parsed) {
						const updated = {
							...parsed,
							...data
						};
						const expiresAt = updated.expiresAt ?? parsed.expiresAt;
						const ttl = getTTLSeconds(expiresAt instanceof Date ? expiresAt : new Date(expiresAt));
						if (ttl > 0) await secondaryStorage.set(`verification:${storedIdentifier}`, JSON.stringify(updated), ttl);
						if (!options.verification?.storeInDatabase) return updated;
					}
				}
			}
			if (!secondaryStorage || options.verification?.storeInDatabase) return await updateWithHooks(data, [{
				field: "identifier",
				value: storedIdentifier
			}], "verification", void 0);
			return data;
		},
		refreshUserSessions
	};
};
async function runPluginInit(context) {
	let options = context.options;
	const plugins = options.plugins || [];
	const pluginTrustedOrigins = [];
	const dbHooks = [];
	for (const plugin of plugins) if (plugin.init) {
		const initPromise = plugin.init(context);
		let result;
		if (isPromise(initPromise)) result = await initPromise;
		else result = initPromise;
		if (typeof result === "object") {
			if (result.options) {
				const { databaseHooks, trustedOrigins, ...restOpts } = result.options;
				if (databaseHooks) dbHooks.push({
					source: `plugin:${plugin.id}`,
					hooks: databaseHooks
				});
				if (trustedOrigins) pluginTrustedOrigins.push(trustedOrigins);
				options = defu(options, restOpts);
			}
			if (result.context) Object.assign(context, result.context);
		}
	}
	if (pluginTrustedOrigins.length > 0) {
		const allSources = [...options.trustedOrigins ? [options.trustedOrigins] : [], ...pluginTrustedOrigins];
		const staticOrigins = allSources.filter(Array.isArray).flat();
		const dynamicOrigins = allSources.filter((s) => typeof s === "function");
		if (dynamicOrigins.length > 0) options.trustedOrigins = async (request) => {
			const resolved = await Promise.all(dynamicOrigins.map((fn) => fn(request)));
			return [...staticOrigins, ...resolved.flat()].filter((v) => typeof v === "string" && v !== "");
		};
		else options.trustedOrigins = staticOrigins;
	}
	if (options.databaseHooks) dbHooks.push({
		source: "user",
		hooks: options.databaseHooks
	});
	context.internalAdapter = createInternalAdapter(context.adapter, {
		options,
		logger: context.logger,
		hooks: dbHooks,
		generateId: context.generateId
	});
	context.options = options;
}
function getInternalPlugins(options) {
	const plugins = [];
	if (options.advanced?.crossSubDomainCookies?.enabled) {}
	return plugins;
}
async function getTrustedOrigins(options, request) {
	const trustedOrigins = [];
	if (isDynamicBaseURLConfig(options.baseURL)) {
		const allowedHosts = options.baseURL.allowedHosts;
		const proto = options.baseURL.protocol;
		for (const host of allowedHosts) if (!host.includes("://")) {
			if (!proto || proto === "https" || proto === "auto") trustedOrigins.push(`https://${host}`);
			if (proto === "http" || proto === "auto" || isLoopbackHost(host)) trustedOrigins.push(`http://${host}`);
		} else trustedOrigins.push(host);
		if (options.baseURL.fallback) try {
			trustedOrigins.push(new URL(options.baseURL.fallback).origin);
		} catch {}
	} else {
		const baseURL = getBaseURL(typeof options.baseURL === "string" ? options.baseURL : void 0, options.basePath, request);
		if (baseURL) trustedOrigins.push(new URL(baseURL).origin);
	}
	if (options.trustedOrigins) {
		if (Array.isArray(options.trustedOrigins)) trustedOrigins.push(...options.trustedOrigins);
		if (typeof options.trustedOrigins === "function") {
			const validOrigins = await options.trustedOrigins(request);
			trustedOrigins.push(...validOrigins);
		}
	}
	const envTrustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS;
	if (envTrustedOrigins) trustedOrigins.push(...envTrustedOrigins.split(","));
	return trustedOrigins.filter((v) => Boolean(v));
}
/**
* Picks a `Request`-like or `Headers` value from a direct `auth.api` call.
* Headers are only accepted when they carry a host: without one, host
* resolution would fall back to `null` and the caller should use `fallback`
* or pass a `Request` instead.
*/
function pickSource(input) {
	if (isRequestLike(input?.request)) return input.request;
	if (!input?.headers) return void 0;
	const headers = input.headers instanceof Headers ? input.headers : new Headers(input.headers);
	if (!headers.has("host") && !headers.has("x-forwarded-host")) return;
	return headers;
}
/**
* Returns the effective `trustedProxyHeaders` value for dynamic `baseURL`
* resolution. Proxy headers (`x-forwarded-host` / `x-forwarded-proto`) are
* ignored unless the user opts in with `advanced.trustedProxyHeaders: true`,
* matching the static-config path. Deployments behind a reverse proxy that
* only exposes the public host via `x-forwarded-host` must set the flag.
*/
function resolveDynamicTrustedProxyHeaders(options) {
	return options.advanced?.trustedProxyHeaders ?? false;
}
/**
* Per-request clone with `baseURL`, `trustedOrigins`, `trustedProviders`
* and cookies rehydrated for the resolved host. Throws `BetterAuthError`
* when the URL cannot be resolved; callers on the direct-API path convert
* this to `APIError`.
*/
async function resolveRequestContext(ctx, source, trustedProxyHeaders) {
	const dynamicBaseURLConfig = ctx.options.baseURL;
	const baseURL = resolveBaseURL(dynamicBaseURLConfig, ctx.options.basePath || "/api/auth", source, void 0, trustedProxyHeaders);
	if (!baseURL) throw new BetterAuthError("Could not resolve base URL from request. Check your allowedHosts config.");
	const resolved = Object.create(Object.getPrototypeOf(ctx), Object.getOwnPropertyDescriptors(ctx));
	resolved.baseURL = baseURL;
	resolved.options = {
		...ctx.options,
		baseURL: getOrigin(baseURL) || void 0
	};
	const trustedOriginOptions = {
		...resolved.options,
		baseURL: dynamicBaseURLConfig
	};
	const needsRequest = typeof ctx.options.trustedOrigins === "function" || typeof ctx.options.account?.accountLinking?.trustedProviders === "function";
	let callbackRequest;
	if (needsRequest) if (isRequestLike(source)) callbackRequest = source;
	else if (source) callbackRequest = new Request(baseURL, { headers: source });
	else callbackRequest = void 0;
	else callbackRequest = void 0;
	resolved.trustedOrigins = await getTrustedOrigins(trustedOriginOptions, callbackRequest);
	resolved.trustedProviders = await getTrustedProviders(resolved.options, callbackRequest);
	if (ctx.options.advanced?.crossSubDomainCookies?.enabled) {
		resolved.authCookies = getCookies(resolved.options);
		resolved.createAuthCookie = createCookieGetter(resolved.options);
	}
	return resolved;
}
async function getAwaitableValue(arr, item) {
	if (!arr) return void 0;
	for (const val of arr) {
		const value = typeof val === "function" ? await val() : val;
		if (value[item.field ?? "id"] === item.value) return value;
	}
}
async function getTrustedProviders(options, request) {
	const trustedProviders = options.account?.accountLinking?.trustedProviders;
	if (!trustedProviders) return [];
	if (Array.isArray(trustedProviders)) return trustedProviders.filter((v) => Boolean(v));
	return (await trustedProviders(request) ?? []).filter((v) => Boolean(v));
}
/**
* Exposes a provider-declared profile as the raw claim record used by
* provisioning hooks. Provider profile interfaces are object-shaped but do
* not need an index signature solely to satisfy this erased boundary.
*/
function toOAuthProfileRecord(profile) {
	return profile;
}
/**
* Resolves the stable account key established by an OAuth provider response.
*/
async function resolveOAuthAccountKey(provider, tokens, profile) {
	const accountKeyContext = {
		tokens,
		profile
	};
	const accountSubject = provider.accountSubject;
	const resolvedSubject = await accountSubject(accountKeyContext);
	const accountId = String(resolvedSubject);
	if (typeof resolvedSubject === "number" && !Number.isFinite(resolvedSubject) || accountId.trim().length === 0 || accountId === "undefined" || accountId === "null") throw new BetterAuthError("OAUTH_ACCOUNT_SUBJECT_INVALID");
	return {
		providerId: provider.id,
		accountId
	};
}
/**
* Resolves an OAuth account key at a direct HTTP authentication boundary.
*
* Provider resolvers are application code and can reject or return malformed
* values. Direct sign-in and linking expose all such failures as one stable
* authentication error instead of leaking implementation details or a 500.
*/
async function resolveOAuthAccountKeyForAPI(provider, tokens, profile) {
	try {
		return await resolveOAuthAccountKey(provider, tokens, profile);
	} catch {
		throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.FAILED_TO_GET_USER_INFO);
	}
}
/**
* Check if a string looks like encrypted data
*/
function isLikelyEncrypted(token) {
	if (token.startsWith("$ba$")) return true;
	return token.length % 2 === 0 && /^[0-9a-f]+$/i.test(token);
}
function decryptOAuthToken(token, ctx) {
	if (!token) return token;
	if (ctx.options.account?.encryptOAuthTokens) {
		if (!isLikelyEncrypted(token)) return token;
		return symmetricDecrypt({
			key: ctx.secretConfig,
			data: token
		});
	}
	return token;
}
function setTokenUtil(token, ctx) {
	if (ctx.options.account?.encryptOAuthTokens && token) return symmetricEncrypt({
		key: ctx.secretConfig,
		data: token
	});
	return token;
}
function getOAuthCallbackPath(provider) {
	if (!provider.callbackPath) return `/callback/${provider.id}`;
	return provider.callbackPath.startsWith("/") ? provider.callbackPath : `/${provider.callbackPath}`;
}
function safeCloneRequest(request) {
	if (!request) return;
	try {
		return request.clone();
	} catch {
		return new Request(request.url, {
			cache: request.cache,
			credentials: request.credentials,
			headers: request.headers,
			integrity: request.integrity,
			keepalive: request.keepalive,
			method: request.method,
			mode: request.mode,
			redirect: request.redirect,
			referrer: request.referrer,
			referrerPolicy: request.referrerPolicy,
			signal: request.signal
		});
	}
}
async function createEmailVerificationToken(secret, email, updateTo, expiresIn = 3600, extraPayload) {
	return await signJWT({
		email: email.toLowerCase(),
		updateTo: updateTo?.toLowerCase(),
		...extraPayload
	}, secret, expiresIn);
}
/**
* A function to send a verification email to the user
*/
async function sendVerificationEmailFn(ctx, user) {
	if (!ctx.context.options.emailVerification?.sendVerificationEmail) {
		ctx.context.logger.error("Verification email isn't enabled.");
		throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.VERIFICATION_EMAIL_NOT_ENABLED);
	}
	const token = await createEmailVerificationToken(ctx.context.secret, user.email, void 0, ctx.context.options.emailVerification?.expiresIn);
	const callbackURL = ctx.body.callbackURL ? encodeURIComponent(ctx.body.callbackURL) : encodeURIComponent("/");
	const url = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;
	await ctx.context.options.emailVerification.sendVerificationEmail({
		user,
		url,
		token
	}, ctx.request);
}
var sendVerificationEmail = createAuthEndpoint("/send-verification-email", {
	method: "POST",
	operationId: "sendVerificationEmail",
	cloneRequest: true,
	body: object({
		email: email().meta({ description: "The email to send the verification email to" }),
		callbackURL: string().meta({ description: "The URL to use for email verification callback" }).optional()
	}),
	metadata: { openapi: {
		operationId: "sendVerificationEmail",
		description: "Send a verification email to the user",
		requestBody: { content: { "application/json": { schema: {
			type: "object",
			properties: {
				email: {
					type: "string",
					description: "The email to send the verification email to",
					example: "user@example.com"
				},
				callbackURL: {
					type: "string",
					description: "The URL to use for email verification callback",
					example: "https://example.com/callback",
					nullable: true
				}
			},
			required: ["email"]
		} } } },
		responses: {
			"200": {
				description: "Success",
				content: { "application/json": { schema: {
					type: "object",
					properties: { status: {
						type: "boolean",
						description: "Indicates if the email was sent successfully",
						example: true
					} }
				} } }
			},
			"400": {
				description: "Bad Request",
				content: { "application/json": { schema: {
					type: "object",
					properties: { message: {
						type: "string",
						description: "Error message",
						example: "Verification email isn't enabled"
					} }
				} } }
			}
		}
	} }
}, async (ctx) => {
	if (!ctx.context.options.emailVerification?.sendVerificationEmail) {
		ctx.context.logger.error("Verification email isn't enabled.");
		throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.VERIFICATION_EMAIL_NOT_ENABLED);
	}
	const { email } = ctx.body;
	const session = await getSessionFromCtx(ctx);
	if (!session) {
		/**
		* Enforce a constant-time floor so an attacker cannot distinguish
		* "email not found / already verified" (fast local JWT sign) from
		* "email found and unverified" (slow external email-send) by
		* comparing response times.
		*/
		const MINIMUM_MS = 500;
		const start = Date.now();
		const user = await ctx.context.internalAdapter.findUserByEmail(email);
		let error;
		if (!user || user.user.emailVerified) await createEmailVerificationToken(ctx.context.secret, email, void 0, ctx.context.options.emailVerification?.expiresIn);
		else try {
			await sendVerificationEmailFn(ctx, user.user);
		} catch (e) {
			error = e;
		}
		const remaining = MINIMUM_MS - (Date.now() - start);
		if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
		if (error) throw error;
		return ctx.json({ status: true });
	}
	if (session?.user.email.toLowerCase() !== email.toLowerCase()) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.EMAIL_MISMATCH);
	if (session?.user.emailVerified) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.EMAIL_ALREADY_VERIFIED);
	await sendVerificationEmailFn(ctx, session.user);
	return ctx.json({ status: true });
});
var verifyEmail = createAuthEndpoint("/verify-email", {
	method: "GET",
	operationId: "verifyEmail",
	query: object({
		token: string().meta({ description: "The token to verify the email" }),
		callbackURL: string().meta({ description: "The URL to redirect to after email verification" }).optional()
	}),
	use: [originCheck((ctx) => ctx.query.callbackURL)],
	metadata: { openapi: {
		description: "Verify the email of the user",
		parameters: [{
			name: "token",
			in: "query",
			description: "The token to verify the email",
			required: true,
			schema: { type: "string" }
		}, {
			name: "callbackURL",
			in: "query",
			description: "The URL to redirect to after email verification",
			required: false,
			schema: { type: "string" }
		}],
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					user: {
						type: "object",
						$ref: "#/components/schemas/User"
					},
					status: {
						type: "boolean",
						description: "Indicates if the email was verified successfully"
					}
				},
				required: ["user", "status"]
			} } }
		} }
	} }
}, async (ctx) => {
	function redirectOnError(error) {
		if (ctx.query.callbackURL) {
			const params = new URLSearchParams({ error: error.code });
			const redirectURL = appendQueryParams(ctx.query.callbackURL, params);
			throw ctx.redirect(redirectURL);
		}
		throw APIError.from("UNAUTHORIZED", error);
	}
	const { token } = ctx.query;
	let jwt;
	try {
		jwt = await jwtVerify(token, new TextEncoder().encode(ctx.context.secret), { algorithms: ["HS256"] });
	} catch (e) {
		if (e instanceof JWTExpired) return redirectOnError(BASE_ERROR_CODES.TOKEN_EXPIRED);
		return redirectOnError(BASE_ERROR_CODES.INVALID_TOKEN);
	}
	const parsed = object({
		email: email(),
		updateTo: string().optional(),
		requestType: string().optional()
	}).parse(jwt.payload);
	const user = await ctx.context.internalAdapter.findUserByEmail(parsed.email);
	if (!user) return redirectOnError(BASE_ERROR_CODES.USER_NOT_FOUND);
	if (parsed.updateTo) {
		const session = await getSessionFromCtx(ctx);
		if (session && session.user.email !== parsed.email) return redirectOnError(BASE_ERROR_CODES.INVALID_USER);
		switch (parsed.requestType) {
			/**
			* User clicks confirmation -> sends verification to new email
			*/
			case "change-email-confirmation": {
				const newToken = await createEmailVerificationToken(ctx.context.secret, parsed.email, parsed.updateTo, ctx.context.options.emailVerification?.expiresIn, { requestType: "change-email-verification" });
				const updateCallbackURL = ctx.query.callbackURL ? encodeURIComponent(ctx.query.callbackURL) : encodeURIComponent("/");
				const url = `${ctx.context.baseURL}/verify-email?token=${newToken}&callbackURL=${updateCallbackURL}`;
				if (ctx.context.options.emailVerification?.sendVerificationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
					user: {
						...user.user,
						email: parsed.updateTo
					},
					url,
					token: newToken
				}, safeCloneRequest(ctx.request)));
				if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
				return ctx.json({ status: true });
			}
			/**
			* User clicks verification -> updates email
			*/
			case "change-email-verification": {
				let activeSession = session;
				if (!activeSession) {
					const newSession = await ctx.context.internalAdapter.createSession(user.user.id);
					if (!newSession) throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION);
					activeSession = {
						session: newSession,
						user: user.user
					};
				}
				const updatedUser = await ctx.context.internalAdapter.updateUserByEmail(parsed.email, {
					email: parsed.updateTo,
					emailVerified: true
				});
				if (ctx.context.options.emailVerification?.afterEmailVerification) await ctx.context.options.emailVerification.afterEmailVerification(updatedUser, ctx.request);
				await setSessionCookie(ctx, {
					session: activeSession.session,
					user: {
						...activeSession.user,
						email: parsed.updateTo,
						emailVerified: true
					}
				});
				if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
				return ctx.json({
					status: true,
					user: parseUserOutput(ctx.context.options, updatedUser)
				});
			}
			/**
			* Legacy flow
			*
			* - skips two-step verification
			* - updates email immediately
			*/
			default: {
				let activeSession = session;
				if (!activeSession) {
					const newSession = await ctx.context.internalAdapter.createSession(user.user.id);
					if (!newSession) throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION);
					activeSession = {
						session: newSession,
						user: user.user
					};
				}
				const updatedUser = await ctx.context.internalAdapter.updateUserByEmail(parsed.email, {
					email: parsed.updateTo,
					emailVerified: false
				});
				const newToken = await createEmailVerificationToken(ctx.context.secret, parsed.updateTo);
				const updateCallbackURL = ctx.query.callbackURL ? encodeURIComponent(ctx.query.callbackURL) : encodeURIComponent("/");
				if (ctx.context.options.emailVerification?.sendVerificationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
					user: updatedUser,
					url: `${ctx.context.baseURL}/verify-email?token=${newToken}&callbackURL=${updateCallbackURL}`,
					token: newToken
				}, safeCloneRequest(ctx.request)));
				await setSessionCookie(ctx, {
					session: activeSession.session,
					user: {
						...activeSession.user,
						email: parsed.updateTo,
						emailVerified: false
					}
				});
				if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
				return ctx.json({
					status: true,
					user: parseUserOutput(ctx.context.options, updatedUser)
				});
			}
		}
	}
	if (user.user.emailVerified) {
		if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
		return ctx.json({
			status: true,
			user: null
		});
	}
	if (ctx.context.options.emailVerification?.beforeEmailVerification) await ctx.context.options.emailVerification.beforeEmailVerification(user.user, ctx.request);
	const updatedUser = await ctx.context.internalAdapter.updateUserByEmail(parsed.email, { emailVerified: true });
	if (ctx.context.options.emailVerification?.afterEmailVerification) await ctx.context.options.emailVerification.afterEmailVerification(updatedUser, ctx.request);
	if (ctx.context.options.emailVerification?.autoSignInAfterVerification) {
		const currentSession = await getSessionFromCtx(ctx);
		if (!currentSession || currentSession.user.email !== parsed.email) {
			const session = await ctx.context.internalAdapter.createSession(user.user.id);
			if (!session) throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION);
			await setSessionCookie(ctx, {
				session,
				user: {
					...user.user,
					emailVerified: true
				}
			});
		} else await setSessionCookie(ctx, {
			session: currentSession.session,
			user: {
				...currentSession.user,
				emailVerified: true
			}
		});
	}
	if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
	return ctx.json({
		status: true,
		user: null
	});
});
function linkOAuthAccountFailure(code, message) {
	return {
		linked: false,
		error: {
			code,
			message
		}
	};
}
async function linkOAuthAccount(c, { link, userInfo, account, profile, scopes }) {
	try {
		await assertValidUserInfo(c, {
			user: {
				...userInfo,
				id: link.userId,
				email: userInfo.email ?? void 0
			},
			source: {
				action: "link-account",
				method: "oauth",
				oauth: {
					providerId: account.providerId,
					profile
				}
			}
		});
	} catch (error) {
		if (!isAPIError(error) || !error.body?.code) throw error;
		return linkOAuthAccountFailure(error.body.code, error.body.message);
	}
	if (!c.context.trustedProviders.includes(account.providerId) && !userInfo.emailVerified || c.context.options.account?.accountLinking?.enabled === false) {
		c.context.logger.error("Unable to link account - untrusted provider");
		return linkOAuthAccountFailure(OAUTH_CALLBACK_ERROR_CODES.UNABLE_TO_LINK_ACCOUNT);
	}
	if (userInfo.email?.toLowerCase() !== link.email.toLowerCase() && c.context.options.account?.accountLinking?.allowDifferentEmails !== true) return linkOAuthAccountFailure(OAUTH_CALLBACK_ERROR_CODES.EMAIL_DOES_NOT_MATCH);
	const existingAccount = await c.context.internalAdapter.findAccountByKey(account);
	if (existingAccount) {
		if (existingAccount.userId.toString() !== link.userId.toString()) return linkOAuthAccountFailure(OAUTH_CALLBACK_ERROR_CODES.ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_USER);
		const mergedScope = mergeScopes(existingAccount.scope, scopes);
		const updateData = Object.fromEntries(Object.entries({
			providerId: account.providerId,
			accessToken: await setTokenUtil(account.accessToken, c.context),
			refreshToken: await setTokenUtil(account.refreshToken, c.context),
			idToken: account.idToken,
			accessTokenExpiresAt: account.accessTokenExpiresAt,
			refreshTokenExpiresAt: account.refreshTokenExpiresAt,
			scope: mergedScope || void 0
		}).filter(([_, value]) => value !== void 0));
		await c.context.internalAdapter.updateAccount(existingAccount.id, updateData);
	} else if (!await c.context.internalAdapter.createAccount({
		userId: link.userId,
		...account,
		accessToken: await setTokenUtil(account.accessToken, c.context),
		refreshToken: await setTokenUtil(account.refreshToken, c.context),
		scope: scopes?.join(",") ?? account.scope
	})) return linkOAuthAccountFailure(OAUTH_CALLBACK_ERROR_CODES.UNABLE_TO_LINK_ACCOUNT);
	await applyUpdateUserInfoOnLink(c, link.userId, userInfo);
	return { linked: true };
}
async function handleOAuthUserInfo(c, opts) {
	const { userInfo, account, callbackURL, disableSignUp, overrideUserInfo } = opts;
	const source = opts.source ?? {
		method: "oauth",
		oauth: { providerId: account.providerId }
	};
	const requireExactAccountBinding = !!opts.selectedUser || opts.requireExactAccountBinding === true;
	let pendingAccountCookie = null;
	const accountOwner = await c.context.internalAdapter.findAccountOwnerByKey({
		providerId: account.providerId,
		accountId: account.accountId
	}).catch((e) => {
		c.context.logger.error("Better auth was unable to query your database.\nError: ", e);
		redirectOnError(c, c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`, "internal_server_error");
	});
	if (accountOwner?.kind === "orphaned") {
		c.context.logger.error("OAuth account references a missing user. Repair the account before retrying authentication.");
		return {
			error: "unable to link account",
			data: null,
			isRegister: false
		};
	}
	const dbUser = await (async () => {
		if (accountOwner?.kind === "owned") {
			if (opts.selectedUser && accountOwner.user.id !== opts.selectedUser.userId) throw new APIError("CONFLICT", {
				code: "account_ownership_conflict",
				message: "Account is already linked to another user"
			});
			return {
				user: accountOwner.user,
				linkedAccount: accountOwner.account,
				accounts: [accountOwner.account]
			};
		}
		if (opts.selectedUser) {
			const selectedUser = await c.context.internalAdapter.findUserById(opts.selectedUser.userId);
			if (!selectedUser) throw new APIError("NOT_FOUND", {
				code: "user_not_found",
				message: "User not found"
			});
			return {
				user: selectedUser,
				linkedAccount: null,
				accounts: []
			};
		}
		const emailMatch = await c.context.internalAdapter.findUserByEmail(userInfo.email.toLowerCase(), { includeAccounts: true });
		if (!emailMatch) return null;
		return {
			user: emailMatch.user,
			linkedAccount: null,
			accounts: emailMatch.accounts
		};
	})().catch((e) => {
		if (isAPIError(e)) throw e;
		c.context.logger.error("Better auth was unable to query your database.\nError: ", e);
		redirectOnError(c, c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`, "internal_server_error");
	});
	let user = dbUser?.user;
	const isRegister = !user;
	if (dbUser) {
		const linkedAccount = dbUser.linkedAccount ?? dbUser.accounts.find((acc) => acc.providerId === account.providerId && acc.accountId === account.accountId);
		if (!linkedAccount) {
			const accountLinking = c.context.options.account?.accountLinking;
			const isTrustedProvider = opts.isTrustedProvider || opts.trustProviderByName !== false && c.context.trustedProviders.includes(account.providerId);
			const requireLocalEmailVerified = accountLinking?.requireLocalEmailVerified ?? true;
			if (!opts.selectedUser && (!isTrustedProvider && !userInfo.emailVerified || requireLocalEmailVerified && !dbUser.user.emailVerified || accountLinking?.enabled === false || accountLinking?.disableImplicitLinking === true)) {
				if (isDevelopment()) c.context.logger.warn(`User already exist but account isn't linked to ${account.providerId}. To read more about how account linking works in Better Auth see https://www.better-auth.com/docs/concepts/users-accounts#account-linking.`);
				return {
					error: "account not linked",
					data: null
				};
			}
			try {
				const { id: _accountId, ...providerUserInfo } = userInfo;
				await assertValidUserInfo(c, {
					user: {
						...providerUserInfo,
						id: dbUser.user.id,
						email: userInfo.email.toLowerCase()
					},
					source: {
						...source,
						action: "link-account"
					}
				});
				const createdAccount = await c.context.internalAdapter.linkAccount({
					providerId: account.providerId,
					accountId: account.accountId,
					userId: dbUser.user.id,
					accessToken: await setTokenUtil(account.accessToken, c.context),
					refreshToken: await setTokenUtil(account.refreshToken, c.context),
					idToken: account.idToken,
					accessTokenExpiresAt: account.accessTokenExpiresAt,
					refreshTokenExpiresAt: account.refreshTokenExpiresAt,
					scope: account.scope
				});
				if (!createdAccount) return {
					error: "unable to link account",
					data: null
				};
				if (requireExactAccountBinding && (createdAccount.accountId !== account.accountId || createdAccount.providerId !== account.providerId || createdAccount.userId !== dbUser.user.id)) throw new APIError("CONFLICT", {
					code: "account_hook_binding_conflict",
					message: "Account hook changed the selected authentication binding"
				});
				if (c.context.options.account?.storeAccountCookie) if (opts.deferNonDatabaseWrites) pendingAccountCookie = createdAccount;
				else await setAccountCookie(c, createdAccount);
			} catch (e) {
				if (isAPIError(e)) throw e;
				c.context.logger.error("Unable to link account", e);
				return {
					error: "unable to link account",
					data: null
				};
			}
			if (!opts.selectedUser && userInfo.emailVerified && !dbUser.user.emailVerified && userInfo.email.toLowerCase() === dbUser.user.email) await c.context.internalAdapter.updateUser(dbUser.user.id, { emailVerified: true });
			if (!opts.selectedUser) user = await applyUpdateUserInfoOnLink(c, dbUser.user.id, userInfo) ?? user;
		} else {
			const { id: _accountId, ...providerUserInfo } = userInfo;
			await assertValidUserInfo(c, {
				user: {
					...providerUserInfo,
					id: dbUser.user.id,
					email: userInfo.email.toLowerCase()
				},
				source: {
					...source,
					action: "sign-in"
				}
			});
			/**
			* `scope` intentionally omitted. Updated only via linkSocial.
			*
			* @see {@link Account.scope}
			*/
			const freshTokens = c.context.options.account?.updateAccountOnSignIn !== false ? Object.fromEntries(Object.entries({
				providerId: account.providerId,
				idToken: account.idToken,
				accessToken: await setTokenUtil(account.accessToken, c.context),
				refreshToken: await setTokenUtil(account.refreshToken, c.context),
				accessTokenExpiresAt: account.accessTokenExpiresAt,
				refreshTokenExpiresAt: account.refreshTokenExpiresAt
			}).filter(([_, value]) => value !== void 0)) : {};
			if (c.context.options.account?.storeAccountCookie) {
				const accountCookie = {
					...linkedAccount,
					...freshTokens
				};
				if (opts.deferNonDatabaseWrites) pendingAccountCookie = accountCookie;
				else await setAccountCookie(c, accountCookie);
			}
			if (Object.keys(freshTokens).length > 0) {
				const updatedAccount = await c.context.internalAdapter.updateAccount(linkedAccount.id, freshTokens);
				if (!updatedAccount) return {
					error: "unable to update account",
					data: null
				};
				if (requireExactAccountBinding && (updatedAccount.accountId !== account.accountId || updatedAccount.providerId !== account.providerId || updatedAccount.userId !== dbUser.user.id)) throw new APIError("CONFLICT", {
					code: "account_hook_binding_conflict",
					message: "Account hook changed the selected authentication binding"
				});
				if (opts.deferNonDatabaseWrites && pendingAccountCookie) pendingAccountCookie = updatedAccount;
			}
			if (!opts.selectedUser && userInfo.emailVerified && !dbUser.user.emailVerified && userInfo.email.toLowerCase() === dbUser.user.email) await c.context.internalAdapter.updateUser(dbUser.user.id, { emailVerified: true });
		}
		if (opts.selectedUser ? opts.selectedUser.profile === "update" : overrideUserInfo) {
			const { id: _id, email: _email, emailVerified: _emailVerified, name, image, ...providerProfile } = userInfo;
			const additionalUserFields = parseAdditionalUserInputFromProviderProfile(c.context.options, providerProfile, "update");
			const updatedUser = await c.context.internalAdapter.updateUser(dbUser.user.id, {
				name,
				image,
				...additionalUserFields,
				email: userInfo.email.toLowerCase(),
				emailVerified: userInfo.email.toLowerCase() === dbUser.user.email ? dbUser.user.emailVerified || userInfo.emailVerified : userInfo.emailVerified
			});
			if (updatedUser == null) c.context.logger.warn("Could not update user info during OAuth sign in; preserving existing user for session.");
			if (opts.selectedUser && updatedUser && updatedUser.id !== opts.selectedUser.userId) throw new APIError("CONFLICT", {
				code: "user_hook_selection_conflict",
				message: "User hook changed the selected user"
			});
			user = updatedUser ?? user;
		}
	} else {
		if (disableSignUp) return {
			error: "signup disabled",
			data: null,
			isRegister: false
		};
		try {
			const { id: _id, email: _email, emailVerified: _emailVerified, name, image, ...providerProfile } = userInfo;
			const additionalUserFields = parseAdditionalUserInputFromProviderProfile(c.context.options, providerProfile, "create");
			const accountData = {
				accessToken: await setTokenUtil(account.accessToken, c.context),
				refreshToken: await setTokenUtil(account.refreshToken, c.context),
				idToken: account.idToken,
				accessTokenExpiresAt: account.accessTokenExpiresAt,
				refreshTokenExpiresAt: account.refreshTokenExpiresAt,
				scope: account.scope,
				providerId: account.providerId,
				accountId: account.accountId
			};
			const { createdUser, createdAccount } = await runWithTransaction(c.context.adapter, async () => {
				const createdUser = await c.context.internalAdapter.createUser({
					name,
					image,
					...additionalUserFields,
					email: userInfo.email.toLowerCase(),
					emailVerified: userInfo.emailVerified
				}, source);
				return {
					createdUser,
					createdAccount: await c.context.internalAdapter.createAccount({
						...accountData,
						userId: createdUser.id
					})
				};
			});
			if (requireExactAccountBinding && (createdAccount.accountId !== account.accountId || createdAccount.providerId !== account.providerId || createdAccount.userId !== createdUser.id)) throw new APIError("CONFLICT", {
				code: "account_hook_binding_conflict",
				message: "Account hook changed the selected authentication binding"
			});
			user = createdUser;
			if (c.context.options.account?.storeAccountCookie) if (opts.deferNonDatabaseWrites) pendingAccountCookie = createdAccount;
			else await setAccountCookie(c, createdAccount);
		} catch (e) {
			if (isAPIError(e)) throw e;
			c.context.logger.error("Unable to create OAuth user", e);
			return {
				error: "unable to create user",
				data: null,
				isRegister: false
			};
		}
	}
	if (!user) return {
		error: "unable to create user",
		data: null,
		isRegister: false
	};
	const requireEmailVerification = c.context.socialProviders.find((p) => p.id === account.providerId)?.options?.requireEmailVerification;
	if (isRegister && !user.emailVerified && (c.context.options.emailVerification?.sendOnSignUp ?? requireEmailVerification)) await dispatchVerificationEmail(c, user, callbackURL, opts.deferNonDatabaseWrites);
	if (requireEmailVerification && !user.emailVerified) {
		if (!isRegister && c.context.options.emailVerification?.sendOnSignIn) await dispatchVerificationEmail(c, user, callbackURL, opts.deferNonDatabaseWrites);
		return {
			error: OAUTH_CALLBACK_ERROR_CODES.EMAIL_NOT_VERIFIED,
			data: null,
			isRegister
		};
	}
	const session = await c.context.internalAdapter.createSession(user.id, void 0, void 0, void 0, { deferSecondaryStorageWrites: opts.deferNonDatabaseWrites === true });
	if (!session) return {
		error: "unable to create session",
		data: null,
		isRegister: false
	};
	if (requireExactAccountBinding && session.userId !== (opts.selectedUser?.userId ?? user.id)) throw new APIError("CONFLICT", {
		code: "session_hook_user_conflict",
		message: "Session hook changed the selected user"
	});
	return {
		data: {
			session,
			user
		},
		error: null,
		isRegister,
		accountCookie: pendingAccountCookie
	};
}
async function dispatchVerificationEmail(c, user, callbackURL, deferUntilAfterTransaction) {
	const sendVerificationEmail = c.context.options.emailVerification?.sendVerificationEmail;
	if (!sendVerificationEmail) return;
	const send = async () => {
		try {
			const token = await createEmailVerificationToken(c.context.secret, user.email, void 0, c.context.options.emailVerification?.expiresIn);
			const url = `${c.context.baseURL}/verify-email?token=${token}&callbackURL=${encodeURIComponent(callbackURL || "/")}`;
			await c.context.runInBackgroundOrAwait(sendVerificationEmail({
				user,
				url,
				token
			}, c.request));
		} catch (e) {
			c.context.logger.error("Failed to send OAuth verification email", e);
		}
	};
	if (deferUntilAfterTransaction) await queueAfterTransactionHook(send);
	else await send();
}
/**
* Apply the `account.accountLinking.updateUserInfoOnLink` policy: when enabled,
* copy the freshly linked provider's profile onto the local user, matching the
* field set persisted on sign-up. The local `email` and `emailVerified` are
* never changed, so a link can't rebind the account's identity, and
* `updateUser` drops `undefined` fields, so a provider that omits one leaves
* the existing column intact.
*
* Returns the updated user so a caller that issues a session can seed the
* cookie cache with the fresh row. Returns `undefined` when the policy is
* disabled or the update fails: a failed profile sync must not abort the link.
*/
async function applyUpdateUserInfoOnLink(c, userId, userInfo) {
	if (c.context.options.account?.accountLinking?.updateUserInfoOnLink !== true) return;
	try {
		const { email: _email, emailVerified: _emailVerified, name, image, ...providerProfile } = userInfo;
		const additionalUserFields = parseAdditionalUserInputFromProviderProfile(c.context.options, providerProfile, "update");
		return await c.context.internalAdapter.updateUser(userId, {
			name,
			image,
			...additionalUserFields
		});
	} catch (e) {
		c.context.logger.warn("Could not update user info on account link", e);
		return;
	}
}
function parseStoredScopes(scope) {
	if (!scope) return [];
	return scope.split(",").map((s) => s.trim()).filter(Boolean);
}
var listUserAccounts = createAuthEndpoint("/list-accounts", {
	method: "GET",
	use: [sessionMiddleware],
	metadata: { openapi: {
		operationId: "listUserAccounts",
		description: "List all accounts linked to the user",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "array",
				items: {
					type: "object",
					properties: {
						id: { type: "string" },
						providerId: { type: "string" },
						createdAt: {
							type: "string",
							format: "date-time"
						},
						updatedAt: {
							type: "string",
							format: "date-time"
						},
						accountId: { type: "string" },
						userId: { type: "string" },
						scopes: {
							type: "array",
							items: { type: "string" }
						}
					},
					required: [
						"id",
						"providerId",
						"createdAt",
						"updatedAt",
						"accountId",
						"userId",
						"scopes"
					]
				}
			} } }
		} }
	} }
}, async (c) => {
	const session = c.context.session;
	const accounts = await c.context.internalAdapter.findAccounts(session.user.id);
	return c.json(accounts.map((a) => {
		const { scope, ...parsed } = parseAccountOutput(c.context.options, a);
		return {
			...parsed,
			scopes: parseStoredScopes(scope)
		};
	}));
});
var linkSocialAccount = createAuthEndpoint("/link-social", {
	method: "POST",
	requireHeaders: true,
	body: object({
		/**
		* Callback URL to redirect to after the user has signed in.
		*/
		callbackURL: string().meta({ description: "The URL to redirect to after the user has signed in" }).optional(),
		/**
		* OAuth2 provider to use
		*/
		provider: SocialProviderListEnum,
		/**
		* ID Token for direct authentication without redirect
		*/
		idToken: object({
			token: string(),
			nonce: string().optional(),
			accessToken: string().optional(),
			refreshToken: string().optional()
		}).optional(),
		/**
		* Whether to allow sign up for new users
		*/
		requestSignUp: boolean$1().optional(),
		/**
		* Additional scopes to request when linking the account.
		* This is useful for requesting additional permissions when
		* linking a social account compared to the initial authentication.
		*/
		scopes: array(string()).meta({ description: "Additional scopes to request from the provider" }).optional(),
		/**
		* The URL to redirect to if there is an error during the link process.
		*/
		errorCallbackURL: string().meta({ description: "The URL to redirect to if there is an error during the link process" }).optional(),
		/**
		* Disable automatic redirection to the provider
		*
		* This is useful if you want to handle the redirection
		* yourself like in a popup or a different tab.
		*/
		disableRedirect: boolean$1().meta({ description: "Disable automatic redirection to the provider. Useful for handling the redirection yourself" }).optional(),
		/**
		* The login hint to forward to the provider authorization endpoint.
		*/
		loginHint: string().meta({ description: "The login hint to use for the authorization code request" }).optional(),
		/**
		* Extra query parameters to append to the provider authorization URL.
		* Reserved OAuth keys (state, client_id, redirect_uri, response_type,
		* code_challenge, code_challenge_method, nonce, scope) are rejected.
		*/
		additionalParams: additionalAuthorizationParamsSchema,
		/**
		* Any additional data to pass through the oauth flow.
		*/
		additionalData: record(string(), any()).optional()
	}),
	use: [sessionMiddleware],
	metadata: { openapi: {
		description: "Link a social account to the user",
		operationId: "linkSocialAccount",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					url: {
						type: "string",
						description: "The authorization URL to redirect the user to"
					},
					redirect: {
						type: "boolean",
						description: "Indicates if the user should be redirected to the authorization URL"
					},
					status: { type: "boolean" }
				},
				required: ["redirect"]
			} } }
		} }
	} }
}, async (c) => {
	const session = c.context.session;
	const provider = await getAwaitableValue(c.context.socialProviders, { value: c.body.provider });
	if (!provider) {
		c.context.logger.error("Provider not found. Make sure to add the provider in your auth config", { provider: c.body.provider });
		throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.PROVIDER_NOT_FOUND);
	}
	if (c.body.idToken) {
		if (!supportsIdTokenSignIn(provider)) {
			c.context.logger.error("Provider does not support id token verification", { provider: c.body.provider });
			throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.ID_TOKEN_NOT_SUPPORTED);
		}
		const { token, nonce } = c.body.idToken;
		if (!await verifyProviderIdToken(provider, token, nonce, c)) {
			c.context.logger.warn("Invalid id token", { provider: c.body.provider });
			throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_TOKEN);
		}
		const linkingUserInfo = await provider.getUserInfo({
			idToken: token,
			accessToken: c.body.idToken.accessToken,
			refreshToken: c.body.idToken.refreshToken
		});
		if (!linkingUserInfo || !linkingUserInfo?.user) {
			c.context.logger.error("Failed to get user info", { provider: c.body.provider });
			throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.FAILED_TO_GET_USER_INFO);
		}
		if (!linkingUserInfo.user.email) {
			c.context.logger.error(missingEmailLogMessage(c.body.provider, { source: "id_token" }), { provider: c.body.provider });
			throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.USER_EMAIL_NOT_FOUND);
		}
		const accountKey = await resolveOAuthAccountKeyForAPI(provider, {
			idToken: token,
			accessToken: c.body.idToken.accessToken,
			refreshToken: c.body.idToken.refreshToken
		}, linkingUserInfo.data);
		const linkedAccount = await c.context.internalAdapter.findAccountByKey(accountKey);
		if (linkedAccount?.userId === session.user.id) {
			const updateData = Object.fromEntries(Object.entries({
				providerId: provider.id,
				accessToken: await setTokenUtil(c.body.idToken.accessToken, c.context),
				idToken: token,
				refreshToken: await setTokenUtil(c.body.idToken.refreshToken, c.context)
			}).filter(([_, value]) => value !== void 0));
			await c.context.internalAdapter.updateAccount(linkedAccount.id, updateData);
			await applyUpdateUserInfoOnLink(c, session.user.id, linkingUserInfo.user);
			return c.json({
				url: "",
				status: true,
				redirect: false
			});
		}
		if (linkedAccount) throw APIError.from("CONFLICT", BASE_ERROR_CODES.SOCIAL_ACCOUNT_ALREADY_LINKED);
		if (!c.context.trustedProviders.includes(provider.id) && !linkingUserInfo.user.emailVerified || c.context.options.account?.accountLinking?.enabled === false) throw APIError.from("UNAUTHORIZED", {
			message: "Account not linked - linking not allowed",
			code: "LINKING_NOT_ALLOWED"
		});
		if (linkingUserInfo.user.email?.toLowerCase() !== session.user.email.toLowerCase() && c.context.options.account?.accountLinking?.allowDifferentEmails !== true) throw APIError.from("UNAUTHORIZED", {
			message: "Account not linked - different emails not allowed",
			code: "LINKING_DIFFERENT_EMAILS_NOT_ALLOWED"
		});
		try {
			await c.context.internalAdapter.createAccount({
				userId: session.user.id,
				...accountKey,
				accessToken: await setTokenUtil(c.body.idToken.accessToken, c.context),
				idToken: token,
				refreshToken: await setTokenUtil(c.body.idToken.refreshToken, c.context)
			});
		} catch {
			throw APIError.from("EXPECTATION_FAILED", {
				message: "Account not linked - unable to create account",
				code: "LINKING_FAILED"
			});
		}
		await applyUpdateUserInfoOnLink(c, session.user.id, linkingUserInfo.user);
		return c.json({
			url: "",
			status: true,
			redirect: false
		});
	}
	const idTokenNonce = generateIdTokenNonce(provider);
	const state = await generateState(c, {
		link: {
			userId: session.user.id,
			email: session.user.email
		},
		additionalData: c.body.additionalData,
		idTokenNonce
	});
	const url = await provider.createAuthorizationURL({
		state: state.state,
		codeVerifier: state.codeVerifier,
		idTokenNonce,
		redirectURI: `${c.context.baseURL}${getOAuthCallbackPath(provider)}`,
		scopes: c.body.scopes,
		loginHint: c.body.loginHint,
		additionalParams: c.body.additionalParams
	});
	if (!c.body.disableRedirect) c.setHeader("Location", url.toString());
	return c.json({
		url: url.toString(),
		redirect: !c.body.disableRedirect
	});
});
var unlinkAccount = createAuthEndpoint("/unlink-account", {
	method: "POST",
	body: object({ accountId: string().meta({ description: "The Better Auth account ID to unlink" }) }),
	use: [freshSessionMiddleware],
	metadata: { openapi: {
		description: "Unlink an account",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { status: { type: "boolean" } }
			} } }
		} }
	} }
}, async (ctx) => {
	const { accountId } = ctx.body;
	const accounts = await ctx.context.internalAdapter.findAccounts(ctx.context.session.user.id);
	if (accounts.length === 1 && !ctx.context.options.account?.accountLinking?.allowUnlinkingAll) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.FAILED_TO_UNLINK_LAST_ACCOUNT);
	const accountExist = accounts.find((account) => account.id === accountId);
	if (!accountExist) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.ACCOUNT_NOT_FOUND);
	await ctx.context.internalAdapter.deleteAccount(accountExist.id);
	return ctx.json({ status: true });
});
/**
* Resolves the user id an account-token operation should act on.
*
* A caller reaching the server over HTTP (a request or session headers are
* present) must have a valid session, and that session's user always wins.
* A trusted server-side `auth.api` caller with no session may instead name a
* `userId` directly. Throws `UNAUTHORIZED` when an HTTP caller is
* unauthenticated, and `USER_ID_OR_SESSION_REQUIRED` when neither a session
* nor a `userId` is available.
*
* When a durable store is authoritative, bypasses the cookie cache: these
* routes mint or refresh provider access tokens, so a server-side session
* revocation must take effect immediately rather than waiting for the cached
* cookie to expire. DB-less deployments keep the session in the cookie itself,
* so the cache is left in place for them.
*/
async function resolveUserId(ctx, userId) {
	const session = await getSessionFromCtx(ctx, { disableCookieCache: isStateful(ctx) });
	if (!session && (ctx.request || ctx.headers)) throw ctx.error("UNAUTHORIZED");
	const resolvedUserId = session?.user?.id || userId;
	if (!resolvedUserId) throw APIError.from("BAD_REQUEST", {
		message: "Either userId or session is required",
		code: "USER_ID_OR_SESSION_REQUIRED"
	});
	return resolvedUserId;
}
var accountSelectionSchema = union([strictObject({
	accountId: string().meta({ description: "The Better Auth account ID" }),
	userId: string().meta({ description: "The user ID associated with the account" }).optional()
}), strictObject({
	useAccountCookie: literal(true).meta({ description: "Select the current OAuth account from its signed cookie" }),
	userId: string().meta({ description: "The user ID associated with the account" }).optional()
})]);
function matchesAccountSelection(ctx, account, { resolvedUserId, selection }) {
	return (!shouldBindAccountCookieToSessionUser(ctx.context.options) || account.userId === resolvedUserId) && ("accountId" in selection ? account.id === selection.accountId : true);
}
/**
* Resolves an account from exactly one explicit source.
*
* A local account ID is resolved from the database. A signed account cookie is
* used only when the caller explicitly selects it, which keeps stateless OAuth
* flows usable without letting cached cookie data satisfy a row-ID lookup.
*/
async function resolveUserAccount(ctx, { resolvedUserId, selection }) {
	if ("accountId" in selection) {
		const account = (await ctx.context.internalAdapter.findAccounts(resolvedUserId)).find((candidate) => candidate.id === selection.accountId);
		if (account) return {
			account,
			accountCookie: null
		};
	} else if (ctx.context.options.account?.storeAccountCookie) {
		const accountCookie = await getAccountCookie(ctx);
		if (accountCookie && matchesAccountSelection(ctx, accountCookie, {
			resolvedUserId,
			selection
		})) return {
			account: accountCookie,
			accountCookie
		};
	}
	throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.ACCOUNT_NOT_FOUND);
}
/**
* Fetches a currently-valid access token for a user's provider account,
* refreshing and persisting it when it is within five seconds of expiry.
* Shared by the `/get-access-token` endpoint and `/account-info` so both
* resolve and refresh tokens through one path.
*/
async function getValidAccessToken(ctx, { resolvedUserId, selection, account: resolvedAccount }) {
	const account = resolvedAccount ?? (await resolveUserAccount(ctx, {
		resolvedUserId,
		selection
	})).account;
	if (!matchesAccountSelection(ctx, account, {
		resolvedUserId,
		selection
	})) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.ACCOUNT_NOT_FOUND);
	const provider = await getAwaitableValue(ctx.context.socialProviders, { value: account.providerId });
	if (!provider) throw APIError.from("BAD_REQUEST", {
		message: `Provider ${account.providerId} is not supported.`,
		code: "PROVIDER_NOT_SUPPORTED"
	});
	try {
		let newTokens = null;
		const accessTokenExpired = account.accessTokenExpiresAt && new Date(account.accessTokenExpiresAt).getTime() - Date.now() < 5e3;
		if (account.refreshToken && accessTokenExpired && provider.refreshAccessToken) {
			const refreshToken = await decryptOAuthToken(account.refreshToken, ctx.context);
			newTokens = await provider.refreshAccessToken(refreshToken, ctx);
			const updatedData = {
				accessToken: await setTokenUtil(newTokens?.accessToken, ctx.context),
				accessTokenExpiresAt: newTokens?.accessTokenExpiresAt,
				refreshToken: newTokens?.refreshToken ? await setTokenUtil(newTokens.refreshToken, ctx.context) : account.refreshToken,
				refreshTokenExpiresAt: newTokens?.refreshTokenExpiresAt ?? account.refreshTokenExpiresAt,
				idToken: newTokens?.idToken || account.idToken
			};
			let updatedAccount = null;
			if (account.id) updatedAccount = await ctx.context.internalAdapter.updateAccount(account.id, updatedData);
			if (ctx.context.options.account?.storeAccountCookie) await setAccountCookie(ctx, {
				...account,
				...updatedAccount ?? updatedData
			});
		}
		const accessTokenExpiresAt = (() => {
			if (newTokens?.accessTokenExpiresAt) {
				if (typeof newTokens.accessTokenExpiresAt === "string") return new Date(newTokens.accessTokenExpiresAt);
				return newTokens.accessTokenExpiresAt;
			}
			if (account.accessTokenExpiresAt) {
				if (typeof account.accessTokenExpiresAt === "string") return new Date(account.accessTokenExpiresAt);
				return account.accessTokenExpiresAt;
			}
		})();
		return {
			accessToken: newTokens?.accessToken ?? await decryptOAuthToken(account.accessToken ?? "", ctx.context),
			accessTokenExpiresAt,
			scopes: parseStoredScopes(account.scope),
			idToken: newTokens?.idToken ?? account.idToken ?? void 0
		};
	} catch (_error) {
		throw APIError.from("BAD_REQUEST", {
			message: "Failed to get a valid access token",
			code: "FAILED_TO_GET_ACCESS_TOKEN"
		});
	}
}
var getAccessToken = createAuthEndpoint("/get-access-token", {
	method: "POST",
	body: accountSelectionSchema,
	metadata: { openapi: {
		description: "Get a valid access token, doing a refresh if needed",
		responses: {
			200: {
				description: "A Valid access token",
				content: { "application/json": { schema: {
					type: "object",
					properties: {
						tokenType: { type: "string" },
						idToken: { type: "string" },
						accessToken: { type: "string" },
						accessTokenExpiresAt: {
							type: "string",
							format: "date-time"
						}
					}
				} } }
			},
			400: { description: "Invalid refresh token or provider configuration" }
		}
	} }
}, async (ctx) => {
	const { userId } = ctx.body;
	const tokens = await getValidAccessToken(ctx, {
		resolvedUserId: await resolveUserId(ctx, userId),
		selection: ctx.body
	});
	return ctx.json(tokens);
});
var refreshToken = createAuthEndpoint("/refresh-token", {
	method: "POST",
	body: accountSelectionSchema,
	metadata: { openapi: {
		description: "Refresh the access token using a refresh token",
		responses: {
			200: {
				description: "Access token refreshed successfully",
				content: { "application/json": { schema: {
					type: "object",
					properties: {
						tokenType: { type: "string" },
						idToken: { type: "string" },
						accessToken: { type: "string" },
						refreshToken: { type: "string" },
						accessTokenExpiresAt: {
							type: "string",
							format: "date-time"
						},
						refreshTokenExpiresAt: {
							type: "string",
							format: "date-time"
						}
					}
				} } }
			},
			400: { description: "Invalid refresh token or provider configuration" }
		}
	} }
}, async (ctx) => {
	const { userId } = ctx.body;
	const { account, accountCookie } = await resolveUserAccount(ctx, {
		resolvedUserId: await resolveUserId(ctx, userId),
		selection: ctx.body
	});
	const provider = await getAwaitableValue(ctx.context.socialProviders, { value: account.providerId });
	if (!provider) throw APIError.from("BAD_REQUEST", {
		message: `Provider ${account.providerId} is not supported.`,
		code: "PROVIDER_NOT_SUPPORTED"
	});
	if (!provider.refreshAccessToken) throw APIError.from("BAD_REQUEST", {
		message: `Provider ${account.providerId} does not support token refreshing.`,
		code: "TOKEN_REFRESH_NOT_SUPPORTED"
	});
	const refreshToken = account.refreshToken ?? void 0;
	if (!refreshToken) throw APIError.from("BAD_REQUEST", {
		message: "Refresh token not found",
		code: "REFRESH_TOKEN_NOT_FOUND"
	});
	try {
		const decryptedRefreshToken = await decryptOAuthToken(refreshToken, ctx.context);
		const tokens = await provider.refreshAccessToken(decryptedRefreshToken, ctx);
		const resolvedRefreshToken = tokens.refreshToken ? await setTokenUtil(tokens.refreshToken, ctx.context) : refreshToken;
		const resolvedRefreshTokenExpiresAt = tokens.refreshTokenExpiresAt ?? account.refreshTokenExpiresAt;
		const updatedTokenData = {
			accessToken: await setTokenUtil(tokens.accessToken, ctx.context),
			refreshToken: resolvedRefreshToken,
			accessTokenExpiresAt: tokens.accessTokenExpiresAt,
			refreshTokenExpiresAt: resolvedRefreshTokenExpiresAt,
			idToken: tokens.idToken || account.idToken
		};
		let updatedAccount = null;
		if (account.id)
 /**
		* `scope` intentionally omitted. Refresh response may be narrower.
		*
		* @see {@link Account.scope}
		*/
		updatedAccount = await ctx.context.internalAdapter.updateAccount(account.id, updatedTokenData);
		if (accountCookie?.id === account.id && ctx.context.options.account?.storeAccountCookie) await setAccountCookie(ctx, {
			...accountCookie,
			...updatedAccount ?? updatedTokenData
		});
		const responseScope = updatedAccount?.scope ?? account.scope;
		return ctx.json({
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken ?? decryptedRefreshToken,
			accessTokenExpiresAt: tokens.accessTokenExpiresAt,
			refreshTokenExpiresAt: resolvedRefreshTokenExpiresAt,
			scope: responseScope,
			idToken: tokens.idToken || account.idToken,
			providerId: account.providerId,
			accountId: account.id
		});
	} catch (_error) {
		throw APIError.from("BAD_REQUEST", {
			message: "Failed to refresh access token",
			code: "FAILED_TO_REFRESH_ACCESS_TOKEN"
		});
	}
});
var accountInfo = createAuthEndpoint("/account-info", {
	method: "GET",
	metadata: { openapi: {
		description: "Get the account info provided by the provider",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					user: {
						type: "object",
						properties: {
							name: { type: "string" },
							email: {
								type: "string",
								nullable: true
							},
							image: { type: "string" },
							emailVerified: { type: "boolean" }
						},
						required: ["emailVerified"]
					},
					account: {
						type: "object",
						properties: {
							id: { type: "string" },
							providerId: { type: "string" },
							accountId: { type: "string" }
						},
						required: [
							"id",
							"providerId",
							"accountId"
						],
						additionalProperties: false
					},
					data: {
						type: "object",
						properties: {},
						additionalProperties: true
					}
				},
				required: [
					"user",
					"data",
					"account"
				],
				additionalProperties: false
			} } }
		} }
	} },
	query: accountSelectionSchema
}, async (ctx) => {
	const { userId } = ctx.query;
	const resolvedUserId = await resolveUserId(ctx, userId);
	const { account } = await resolveUserAccount(ctx, {
		resolvedUserId,
		selection: ctx.query
	});
	const provider = await getAwaitableValue(ctx.context.socialProviders, { value: account.providerId });
	if (!provider) throw APIError.from("BAD_REQUEST", {
		message: "Account is not associated with a configured social provider.",
		code: "PROVIDER_NOT_CONFIGURED"
	});
	const tokens = await getValidAccessToken(ctx, {
		resolvedUserId,
		selection: ctx.query,
		account
	});
	if (!tokens.accessToken) throw APIError.from("BAD_REQUEST", {
		message: "Access token not found",
		code: "ACCESS_TOKEN_NOT_FOUND"
	});
	const info = await provider.getUserInfo({
		...tokens,
		accessToken: tokens.accessToken
	});
	if (!info) throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.FAILED_TO_GET_USER_INFO);
	return ctx.json({
		...info,
		account: {
			id: account.id,
			providerId: account.providerId,
			accountId: account.accountId
		}
	});
});
var schema = object({
	code: string().optional(),
	error: string().optional(),
	device_id: string().optional(),
	error_description: string().optional(),
	state: string().optional(),
	user: string().optional(),
	iss: string().optional()
});
var callbackOAuth = createAuthEndpoint("/callback/:id", {
	method: ["GET", "POST"],
	operationId: "handleOAuthCallback",
	body: schema.optional(),
	query: schema.optional(),
	metadata: {
		...HIDE_METADATA,
		allowedMediaTypes: ["application/x-www-form-urlencoded", "application/json"]
	}
}, async (c) => {
	let queryOrBody;
	const defaultErrorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
	if (c.method === "POST") {
		const postData = c.body ? schema.parse(c.body) : {};
		const queryData = c.query ? schema.parse(c.query) : {};
		const mergedData = schema.parse({
			...postData,
			...queryData
		});
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(mergedData)) if (value !== void 0 && value !== null) params.set(key, String(value));
		const redirectURL = `${c.context.baseURL}/callback/${c.params.id}?${params.toString()}`;
		throw c.redirect(redirectURL);
	}
	try {
		if (c.method === "GET") queryOrBody = schema.parse(c.query);
		else if (c.method === "POST") queryOrBody = schema.parse(c.body);
		else throw new Error("Unsupported method");
	} catch (e) {
		c.context.logger.error("INVALID_CALLBACK_REQUEST", e);
		const redirectURL = appendQueryParams(defaultErrorURL, new URLSearchParams({ error: "invalid_callback_request" }));
		throw c.redirect(redirectURL);
	}
	const { code, error, state, error_description, device_id, user: userData, iss } = queryOrBody;
	if (state === void 0 && code) {
		const provider = await getAwaitableValue(c.context.socialProviders, { value: c.params.id });
		if (provider?.allowIdpInitiated) {
			const idTokenNonce = generateIdTokenNonce(provider);
			const { state: freshState, codeVerifier } = await generateState(c, { idTokenNonce });
			const authUrl = await provider.createAuthorizationURL({
				state: freshState,
				codeVerifier,
				idTokenNonce,
				redirectURI: `${c.context.baseURL}${getOAuthCallbackPath(provider)}`
			});
			throw c.redirect(authUrl.toString());
		}
	}
	if (!state) {
		c.context.logger.error("State not found", error);
		const redirectURL = appendQueryParams(defaultErrorURL, new URLSearchParams({ error: "state_not_found" }));
		throw c.redirect(redirectURL);
	}
	const { codeVerifier, callbackURL, link, errorURL, newUserURL, requestSignUp, idTokenNonce } = await parseState(c);
	function redirectOnError(error, description) {
		const baseURL = errorURL ?? defaultErrorURL;
		const params = new URLSearchParams({ error });
		if (description) params.set("error_description", description);
		const redirectURL = appendQueryParams(baseURL, params);
		throw c.redirect(redirectURL);
	}
	if (error) redirectOnError(error, error_description);
	if (!code) {
		c.context.logger.warn("Code not found");
		throw redirectOnError(OAUTH_CALLBACK_ERROR_CODES.NO_CODE);
	}
	const provider = await getAwaitableValue(c.context.socialProviders, { value: c.params.id });
	if (!provider) {
		c.context.logger.warn("OAuth provider not found", { providerId: c.params.id });
		throw redirectOnError(OAUTH_CALLBACK_ERROR_CODES.PROVIDER_NOT_FOUND);
	}
	if (iss && provider.issuer && iss !== provider.issuer) {
		c.context.logger.error("OAuth issuer mismatch", {
			expected: provider.issuer,
			received: iss
		});
		throw redirectOnError(OAUTH_CALLBACK_ERROR_CODES.ISSUER_MISMATCH);
	}
	if (provider.requiresIdTokenNonce && !idTokenNonce) {
		c.context.logger.error("OAuth id_token nonce binding required but no expected nonce was found in state", { providerId: provider.id });
		throw redirectOnError(OAUTH_CALLBACK_ERROR_CODES.NONCE_BINDING_MISSING);
	}
	let tokens;
	try {
		tokens = await provider.validateAuthorizationCode({
			code,
			codeVerifier,
			deviceId: device_id,
			redirectURI: `${c.context.baseURL}${getOAuthCallbackPath(provider)}`
		});
	} catch (e) {
		c.context.logger.error("", e);
		throw redirectOnError(OAUTH_CALLBACK_ERROR_CODES.INVALID_CODE);
	}
	if (!tokens) throw redirectOnError(OAUTH_CALLBACK_ERROR_CODES.INVALID_CODE);
	const parsedUserData = userData ? safeJSONParse(userData) : null;
	const providerResult = await provider.getUserInfo({
		...tokens,
		...idTokenNonce ? { expectedIdTokenNonce: idTokenNonce } : {},
		/**
		* The user object from the provider
		* This is only available for some providers like Apple
		*/
		user: parsedUserData ?? void 0
	});
	if (!providerResult?.user) {
		c.context.logger.error("Unable to get user info");
		return redirectOnError(OAUTH_CALLBACK_ERROR_CODES.UNABLE_TO_GET_USER_INFO);
	}
	const userInfo = providerResult.user;
	const providerProfile = toOAuthProfileRecord(providerResult.data);
	let accountKey;
	try {
		accountKey = await resolveOAuthAccountKey(provider, tokens, providerResult.data);
	} catch (error) {
		c.context.logger.error("Unable to derive provider account identity", {
			providerId: provider.id,
			error
		});
		return redirectOnError(OAUTH_CALLBACK_ERROR_CODES.UNABLE_TO_GET_USER_INFO);
	}
	const { accountId } = accountKey;
	if (!callbackURL) {
		c.context.logger.error("No callback URL found");
		throw redirectOnError(OAUTH_CALLBACK_ERROR_CODES.NO_CALLBACK_URL);
	}
	const accountData = {
		...accountKey,
		...tokens,
		scope: tokens.scopes?.join(",")
	};
	if (link) {
		const linkResult = await linkOAuthAccount(c, {
			link,
			userInfo,
			account: accountData,
			profile: providerProfile,
			scopes: tokens.scopes
		});
		if (!linkResult.linked) return redirectOnError(linkResult.error.code, linkResult.error.message);
		throw c.redirect(callbackURL);
	}
	if (!userInfo.email) {
		c.context.logger.error(missingEmailLogMessage(provider.id));
		return redirectOnError(OAUTH_CALLBACK_ERROR_CODES.EMAIL_NOT_FOUND);
	}
	let result;
	try {
		result = await handleOAuthUserInfo(c, {
			userInfo: {
				...userInfo,
				id: accountId,
				email: userInfo.email,
				name: userInfo.name || ""
			},
			account: accountData,
			callbackURL,
			disableSignUp: provider.disableImplicitSignUp && !requestSignUp || provider.options?.disableSignUp,
			overrideUserInfo: provider.options?.overrideUserInfoOnSignIn,
			source: {
				method: "oauth",
				oauth: {
					providerId: provider.id,
					profile: providerProfile
				}
			}
		});
	} catch (e) {
		if (isAPIError(e) && e.body?.code) redirectOnError(e.body.code, e.body.message);
		throw e;
	}
	if (result.error) {
		c.context.logger.error(result.error.split(" ").join("_"));
		return redirectOnError(result.error.split(" ").join("_"));
	}
	const { session, user } = result.data;
	await setSessionCookie(c, {
		session,
		user
	});
	let toRedirectTo;
	try {
		toRedirectTo = (result.isRegister ? newUserURL || callbackURL : callbackURL).toString();
	} catch {
		toRedirectTo = result.isRegister ? newUserURL || callbackURL : callbackURL;
	}
	throw c.redirect(toRedirectTo);
});
function sanitize(input) {
	return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/&(?!amp;|lt;|gt;|quot;|#39;|#x[0-9a-fA-F]+;|#[0-9]+;)/g, "&amp;");
}
var html = (options, code = "Unknown", description = null) => {
	const custom = options.onAPIError?.customizeDefaultErrorPage;
	return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Error</title>
    <style>
      * {
        box-sizing: border-box;
      }
      body {
        font-family: ${custom?.font?.defaultFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"};
        background: ${custom?.colors?.background || "var(--background)"};
        color: var(--foreground);
        margin: 0;
      }
      :root,
      :host {
        --spacing: 0.25rem;
        --container-md: 28rem;
        --text-sm: ${custom?.size?.textSm || "0.875rem"};
        --text-sm--line-height: calc(1.25 / 0.875);
        --text-2xl: ${custom?.size?.text2xl || "1.5rem"};
        --text-2xl--line-height: calc(2 / 1.5);
        --text-4xl: ${custom?.size?.text4xl || "2.25rem"};
        --text-4xl--line-height: calc(2.5 / 2.25);
        --text-6xl: ${custom?.size?.text6xl || "3rem"};
        --text-6xl--line-height: 1;
        --font-weight-medium: 500;
        --font-weight-semibold: 600;
        --font-weight-bold: 700;
        --default-transition-duration: 150ms;
        --default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        --radius: ${custom?.size?.radiusSm || "0.625rem"};
        --default-mono-font-family: ${custom?.font?.monoFamily || "var(--font-geist-mono)"};
        --primary: ${custom?.colors?.primary || "black"};
        --primary-foreground: ${custom?.colors?.primaryForeground || "white"};
        --background: ${custom?.colors?.background || "white"};
        --foreground: ${custom?.colors?.foreground || "oklch(0.271 0 0)"};
        --border: ${custom?.colors?.border || "oklch(0.89 0 0)"};
        --destructive: ${custom?.colors?.destructive || "oklch(0.55 0.15 25.723)"};
        --muted-foreground: ${custom?.colors?.mutedForeground || "oklch(0.545 0 0)"};
        --corner-border: ${custom?.colors?.cornerBorder || "#404040"};
      }

      button, .btn {
        cursor: pointer;
        background: none;
        border: none;
        color: inherit;
        font: inherit;
        transition: all var(--default-transition-duration)
          var(--default-transition-timing-function);
      }
      button:hover, .btn:hover {
        opacity: 0.8;
      }

      @media (prefers-color-scheme: dark) {
        :root,
        :host {
          --primary: ${custom?.colors?.primary || "white"};
          --primary-foreground: ${custom?.colors?.primaryForeground || "black"};
          --background: ${custom?.colors?.background || "oklch(0.15 0 0)"};
          --foreground: ${custom?.colors?.foreground || "oklch(0.98 0 0)"};
          --border: ${custom?.colors?.border || "oklch(0.27 0 0)"};
          --destructive: ${custom?.colors?.destructive || "oklch(0.65 0.15 25.723)"};
          --muted-foreground: ${custom?.colors?.mutedForeground || "oklch(0.65 0 0)"};
          --corner-border: ${custom?.colors?.cornerBorder || "#a0a0a0"};
        }
      }
      @media (max-width: 640px) {
        :root, :host {
          --text-6xl: 2.5rem;
          --text-2xl: 1.25rem;
          --text-sm: 0.8125rem;
        }
      }
      @media (max-width: 480px) {
        :root, :host {
          --text-6xl: 2rem;
          --text-2xl: 1.125rem;
        }
      }
    </style>
  </head>
  <body style="width: 100vw; min-height: 100vh; overflow-x: hidden; overflow-y: auto;">
    <div
        style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
            position: relative;
            width: 100%;
            min-height: 100vh;
            padding: 1rem;
        "
        >
${custom?.disableBackgroundGrid ? "" : `
      <div
        style="
          position: absolute;
          inset: 0;
          background-image: linear-gradient(to right, ${custom?.colors?.gridColor || "var(--border)"} 1px, transparent 1px),
            linear-gradient(to bottom, ${custom?.colors?.gridColor || "var(--border)"} 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.6;
          pointer-events: none;
          width: 100vw;
          height: 100vh;
        "
      ></div>
      <div
        style="
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${custom?.colors?.background || "var(--background)"};
          mask-image: radial-gradient(ellipse at center, transparent 20%, black);
          -webkit-mask-image: radial-gradient(ellipse at center, transparent 20%, black);
          pointer-events: none;
        "
      ></div>
`}

<div
  style="
    position: relative;
    z-index: 10;
    border: 2px solid var(--border);
    background: ${custom?.colors?.cardBackground || "var(--background)"};
    padding: 1.5rem;
    max-width: 42rem;
    width: 100%;
  "
>
    ${custom?.disableCornerDecorations ? "" : `
        <!-- Corner decorations -->
        <div
          style="
            position: absolute;
            top: -2px;
            left: -2px;
            width: 2rem;
            height: 2rem;
            border-top: 4px solid var(--corner-border);
            border-left: 4px solid var(--corner-border);
          "
        ></div>
        <div
          style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 2rem;
            height: 2rem;
            border-top: 4px solid var(--corner-border);
            border-right: 4px solid var(--corner-border);
          "
        ></div>
  
        <div
          style="
            position: absolute;
            bottom: -2px;
            left: -2px;
            width: 2rem;
            height: 2rem;
            border-bottom: 4px solid var(--corner-border);
            border-left: 4px solid var(--corner-border);
          "
        ></div>
        <div
          style="
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 2rem;
            height: 2rem;
            border-bottom: 4px solid var(--corner-border);
            border-right: 4px solid var(--corner-border);
          "
        ></div>`}

        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="margin-bottom: 1.5rem;">
            <div
              style="
                display: inline-block;
                border: 2px solid ${custom?.disableTitleBorder ? "transparent" : custom?.colors?.titleBorder || "var(--destructive)"};
                padding: 0.375rem 1rem;
              "
            >
              <h1
                style="
                  font-size: var(--text-6xl);
                  font-weight: var(--font-weight-semibold);
                  color: ${custom?.colors?.titleColor || "var(--foreground)"};
                  letter-spacing: -0.02em;
                  margin: 0;
                "
              >
                ERROR
              </h1>
            </div>
            <div
              style="
                height: 2px;
                background-color: var(--border);
                width: calc(100% + 3rem);
                margin-left: -1.5rem;
                margin-top: 1.5rem;
              "
            ></div>
          </div>

          <h2
            style="
              font-size: var(--text-2xl);
              font-weight: var(--font-weight-semibold);
              color: var(--foreground);
              margin: 0 0 1rem;
            "
          >
            Something went wrong
          </h2>

          <div
            style="
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                border: 2px solid var(--border);
                background-color: var(--muted);
                padding: 0.375rem 0.75rem;
                margin: 0 0 1rem;
                flex-wrap: wrap;
                justify-content: center;
            "
            >
            <span
                style="
                font-size: 0.75rem;
                color: var(--muted-foreground);
                font-weight: var(--font-weight-semibold);
                "
            >
                CODE:
            </span>
            <span
                style="
                font-size: var(--text-sm);
                font-family: var(--default-mono-font-family, monospace);
                color: var(--foreground);
                word-break: break-all;
                "
            >
                ${sanitize(code)}
            </span>
            </div>

          <p
            style="
              color: var(--muted-foreground);
              max-width: 28rem;
              margin: 0 auto;
              font-size: var(--text-sm);
              line-height: 1.5;
              text-wrap: pretty;
            "
          >
            ${!description ? `We encountered an unexpected error. Please try again or return to the home page. If you're a developer, you can find <a href='https://better-auth.com/docs/reference/errors/${encodeURIComponent(code)}' target='_blank' rel="noopener noreferrer" style='color: var(--foreground); text-decoration: underline;'>more information about the error</a>.` : description}
          </p>
        </div>

        <div
          style="
            display: flex;
            gap: 0.75rem;
            margin-top: 1.5rem;
            justify-content: center;
            flex-wrap: wrap;
          "
        >
          <a
            href="/"
            style="
              text-decoration: none;
            "
          >
            <div
              style="
                border: 2px solid var(--border);
                background: var(--primary);
                color: var(--primary-foreground);
                padding: 0.5rem 1rem;
                border-radius: 0;
                white-space: nowrap;
              "
              class="btn"
            >
              Go Home
            </div>
          </a>
          <a
            href="https://better-auth.com/docs/reference/errors/${encodeURIComponent(code)}?askai=${encodeURIComponent(`What does the error code ${code} mean?`)}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              text-decoration: none;
            "
          >
            <div
              style="
                border: 2px solid var(--border);
                background: transparent;
                color: var(--foreground);
                padding: 0.5rem 1rem;
                border-radius: 0;
                white-space: nowrap;
              "
              class="btn"
            >
              Ask AI
            </div>
          </a>
        </div>
      </div>
    </div>
  </body>
</html>`;
};
var error = createAuthEndpoint("/error", {
	method: "GET",
	metadata: {
		...HIDE_METADATA,
		openapi: {
			description: "Displays an error page",
			responses: { "200": {
				description: "Success",
				content: { "text/html": { schema: {
					type: "string",
					description: "The HTML content of the error page"
				} } }
			} }
		}
	}
}, async (c) => {
	const url = new URL(c.request?.url || "");
	const unsanitizedCode = url.searchParams.get("error") || "UNKNOWN";
	const unsanitizedDescription = url.searchParams.get("error_description") || null;
	const safeCode = /^[\'A-Za-z0-9_-]+$/.test(unsanitizedCode || "") ? unsanitizedCode : "UNKNOWN";
	const safeDescription = unsanitizedDescription ? sanitize(unsanitizedDescription) : null;
	const params = new URLSearchParams();
	params.set("error", safeCode);
	if (unsanitizedDescription) params.set("error_description", unsanitizedDescription);
	const options = c.context.options;
	const errorURL = options.onAPIError?.errorURL;
	if (errorURL) {
		const redirectURL = appendQueryParams(errorURL, params);
		return new Response(null, {
			status: 302,
			headers: { Location: redirectURL }
		});
	}
	if (isProduction && !options.onAPIError?.customizeDefaultErrorPage) return new Response(null, {
		status: 302,
		headers: { Location: `/?${params.toString()}` }
	});
	return new Response(html(c.context.options, safeCode, safeDescription), { headers: { "Content-Type": "text/html" } });
});
var ok = createAuthEndpoint("/ok", {
	method: "GET",
	metadata: {
		...HIDE_METADATA,
		openapi: {
			description: "Check if the API is working",
			responses: { "200": {
				description: "API is working",
				content: { "application/json": { schema: {
					type: "object",
					properties: { ok: {
						type: "boolean",
						description: "Indicates if the API is working"
					} },
					required: ["ok"]
				} } }
			} }
		}
	}
}, async (ctx) => {
	return ctx.json({ ok: true });
});
function assertPasswordNotTooShort(ctx, password) {
	if (password.length < ctx.context.password.config.minPasswordLength) {
		ctx.context.logger.warn("Password is too short");
		throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_TOO_SHORT);
	}
}
function assertPasswordNotTooLong(ctx, password) {
	if (password.length > ctx.context.password.config.maxPasswordLength) {
		ctx.context.logger.warn("Password is too long");
		throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_TOO_LONG);
	}
}
async function validatePassword(ctx, data) {
	assertPasswordNotTooLong(ctx, data.password);
	const credentialAccount = await ctx.context.internalAdapter.findCredentialAccount(data.userId);
	const currentPassword = credentialAccount?.password;
	if (!credentialAccount || !currentPassword) return false;
	return await ctx.context.password.verify({
		hash: currentPassword,
		password: data.password
	});
}
async function checkPassword(userId, c) {
	const password = c.body.password;
	if (typeof password === "string") assertPasswordNotTooLong(c, password);
	const credentialAccount = await c.context.internalAdapter.findCredentialAccount(userId);
	const currentPassword = credentialAccount?.password;
	if (!credentialAccount || !currentPassword || !password) {
		if (password) await c.context.password.hash(password);
		throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
	}
	if (!await c.context.password.verify({
		hash: currentPassword,
		password
	})) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
	return true;
}
function redirectError(ctx, callbackURL, query) {
	const url = callbackURL ? new URL(callbackURL, ctx.baseURL) : new URL(`${ctx.baseURL}/error`);
	if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
	return url.href;
}
function redirectCallback(ctx, callbackURL, query) {
	const url = new URL(callbackURL, ctx.baseURL);
	if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
	return url.href;
}
var requestPasswordReset = createAuthEndpoint("/request-password-reset", {
	method: "POST",
	body: object({
		/**
		* The email address of the user to send a password reset email to.
		*/
		email: email().meta({ description: "The email address of the user to send a password reset email to" }),
		/**
		* The URL to redirect the user to reset their password.
		* If the token isn't valid or expired, it'll be redirected with a query parameter `?
		* error=INVALID_TOKEN`. If the token is valid, it'll be redirected with a query parameter `?
		* token=VALID_TOKEN
		*/
		redirectTo: string().meta({ description: "The URL to redirect the user to reset their password. If the token isn't valid or expired, it'll be redirected with a query parameter `?error=INVALID_TOKEN`. If the token is valid, it'll be redirected with a query parameter `?token=VALID_TOKEN" }).optional()
	}),
	metadata: { openapi: {
		operationId: "requestPasswordReset",
		description: "Send a password reset email to the user",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					status: { type: "boolean" },
					message: { type: "string" }
				}
			} } }
		} }
	} },
	use: [originCheck((ctx) => ctx.body.redirectTo)]
}, async (ctx) => {
	if (!ctx.context.options.emailAndPassword?.sendResetPassword) {
		ctx.context.logger.error("Reset password isn't enabled.Please pass an emailAndPassword.sendResetPassword function in your auth config!");
		throw APIError.from("BAD_REQUEST", {
			message: "Reset password isn't enabled",
			code: "RESET_PASSWORD_DISABLED"
		});
	}
	const { email, redirectTo } = ctx.body;
	const user = await ctx.context.internalAdapter.findUserByEmail(email, { includeAccounts: true });
	if (!user) {
		/**
		* We simulate the verification token generation and the database lookup
		* to mitigate timing attacks.
		*/
		generateId(24);
		await ctx.context.internalAdapter.findVerificationValue("dummy-verification-token");
		ctx.context.logger.warn("Reset Password: User not found");
		return ctx.json({
			status: true,
			message: "If this email exists in our system, check your email for the reset link"
		});
	}
	const expiresAt = getDate(ctx.context.options.emailAndPassword.resetPasswordTokenExpiresIn || 3600, "sec");
	const verificationToken = generateId(24);
	await ctx.context.internalAdapter.createVerificationValue({
		value: user.user.id,
		identifier: `reset-password:${verificationToken}`,
		expiresAt
	});
	const callbackURL = redirectTo ? encodeURIComponent(redirectTo) : "";
	const url = `${ctx.context.baseURL}/reset-password/${verificationToken}?callbackURL=${callbackURL}`;
	await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailAndPassword.sendResetPassword({
		user: user.user,
		url,
		token: verificationToken
	}, ctx.request));
	return ctx.json({
		status: true,
		message: "If this email exists in our system, check your email for the reset link"
	});
});
var requestPasswordResetCallback = createAuthEndpoint("/reset-password/:token", {
	method: "GET",
	operationId: "resetPasswordCallback",
	query: object({ callbackURL: string().meta({ description: "The URL to redirect the user to reset their password" }) }),
	use: [originCheck((ctx) => ctx.query.callbackURL)],
	metadata: { openapi: {
		operationId: "resetPasswordCallback",
		description: "Redirects the user to the callback URL with the token",
		parameters: [{
			name: "token",
			in: "path",
			required: true,
			description: "The token to reset the password",
			schema: { type: "string" }
		}, {
			name: "callbackURL",
			in: "query",
			required: true,
			description: "The URL to redirect the user to reset their password",
			schema: { type: "string" }
		}],
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { token: { type: "string" } }
			} } }
		} }
	} }
}, async (ctx) => {
	const { token } = ctx.params;
	const { callbackURL } = ctx.query;
	if (!token || !callbackURL) throw ctx.redirect(redirectError(ctx.context, callbackURL, { error: "INVALID_TOKEN" }));
	const verification = await ctx.context.internalAdapter.findVerificationValue(`reset-password:${token}`);
	if (!verification || verification.expiresAt < /* @__PURE__ */ new Date()) throw ctx.redirect(redirectError(ctx.context, callbackURL, { error: "INVALID_TOKEN" }));
	throw ctx.redirect(redirectCallback(ctx.context, callbackURL, { token }));
});
var resetPassword = createAuthEndpoint("/reset-password", {
	method: "POST",
	operationId: "resetPassword",
	query: object({ token: string().optional() }).optional(),
	body: object({
		newPassword: string().meta({ description: "The new password to set" }),
		token: string().meta({ description: "The token to reset the password" }).optional()
	}),
	metadata: { openapi: {
		operationId: "resetPassword",
		description: "Reset the password for a user",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { status: { type: "boolean" } }
			} } }
		} }
	} }
}, async (ctx) => {
	const token = ctx.body.token || ctx.query?.token;
	if (!token) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_TOKEN);
	const { newPassword } = ctx.body;
	assertPasswordNotTooShort(ctx, newPassword);
	assertPasswordNotTooLong(ctx, newPassword);
	const id = `reset-password:${token}`;
	const verification = await ctx.context.internalAdapter.consumeVerificationValue(id);
	if (!verification) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_TOKEN);
	const userId = verification.value;
	const user = await ctx.context.internalAdapter.findUserById(userId);
	if (!user) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.USER_NOT_FOUND);
	const hashedPassword = await ctx.context.password.hash(newPassword);
	if (!await ctx.context.internalAdapter.findCredentialAccount(userId)) await ctx.context.internalAdapter.createAccount({
		userId,
		providerId: "credential",
		accountId: user.id,
		password: hashedPassword
	});
	else await ctx.context.internalAdapter.updatePassword(userId, hashedPassword);
	if (ctx.context.options.emailAndPassword?.onPasswordReset) await ctx.context.options.emailAndPassword.onPasswordReset({ user }, ctx.request);
	if (ctx.context.options.emailAndPassword?.revokeSessionsOnPasswordReset) await ctx.context.internalAdapter.deleteUserSessions(userId);
	return ctx.json({ status: true });
});
var verifyPassword$1 = createAuthEndpoint("/verify-password", {
	method: "POST",
	body: object({ 
	/**
	* The password to verify
	*/
password: string().meta({ description: "The password to verify" }) }),
	metadata: {
		scope: "server",
		openapi: {
			operationId: "verifyPassword",
			description: "Verify the current user's password",
			responses: { "200": {
				description: "Success",
				content: { "application/json": { schema: {
					type: "object",
					properties: { status: { type: "boolean" } }
				} } }
			} }
		}
	},
	use: [sensitiveSessionMiddleware]
}, async (ctx) => {
	const { password } = ctx.body;
	const session = ctx.context.session;
	if (!await validatePassword(ctx, {
		password,
		userId: session.user.id
	})) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
	return ctx.json({ status: true });
});
var socialSignInBodySchema = object({
	/**
	* Callback URL to redirect to after the user
	* has signed in.
	*/
	callbackURL: string().meta({ description: "Callback URL to redirect to after the user has signed in" }).optional(),
	/**
	* callback url to redirect if the user is newly registered.
	*
	* useful if you have different routes for existing users and new users
	*/
	newUserCallbackURL: string().optional(),
	/**
	* Callback url to redirect to if an error happens
	*
	* If it's initiated from the client sdk this defaults to
	* the current url.
	*/
	errorCallbackURL: string().meta({ description: "Callback URL to redirect to if an error happens" }).optional(),
	/**
	* OAuth2 provider to use`
	*/
	provider: SocialProviderListEnum,
	/**
	* Disable automatic redirection to the provider
	*
	* This is useful if you want to handle the redirection
	* yourself like in a popup or a different tab.
	*/
	disableRedirect: boolean$1().meta({ description: "Disable automatic redirection to the provider. Useful for handling the redirection yourself" }).optional(),
	/**
	* ID token from the provider
	*
	* This is used to sign in the user
	* if the user is already signed in with the
	* provider in the frontend.
	*
	* Only applicable if the provider supports
	* it. Currently only `apple` and `google` is
	* supported out of the box.
	*/
	idToken: optional(object({
		/**
		* ID token from the provider
		*/
		token: string().meta({ description: "ID token from the provider" }),
		/**
		* The nonce used to generate the token
		*/
		nonce: string().meta({ description: "Nonce used to generate the token" }).optional(),
		/**
		* Access token from the provider
		*/
		accessToken: string().meta({ description: "Access token from the provider" }).optional(),
		/**
		* Refresh token from the provider
		*/
		refreshToken: string().meta({ description: "Refresh token from the provider" }).optional(),
		/**
		* Expiry date of the token
		*/
		expiresAt: number().meta({ description: "Expiry date of the token" }).optional(),
		/**
		* The user object from the provider.
		* This is only available for some providers like Apple.
		*/
		user: object({
			name: object({
				firstName: string().optional(),
				lastName: string().optional()
			}).optional(),
			email: string().optional()
		}).meta({ description: "The user object from the provider. Only available for some providers like Apple." }).optional()
	})),
	scopes: array(string()).meta({ description: "Array of scopes to request from the provider. This will override the default scopes passed." }).optional(),
	/**
	* Explicitly request sign-up
	*
	* Should be used to allow sign up when
	* disableImplicitSignUp for this provider is
	* true
	*/
	requestSignUp: boolean$1().meta({ description: "Explicitly request sign-up. Useful when disableImplicitSignUp is true for this provider" }).optional(),
	/**
	* The login hint to use for the authorization code request
	*/
	loginHint: string().meta({ description: "The login hint to use for the authorization code request" }).optional(),
	/**
	* Extra query parameters to append to the provider authorization URL.
	* Reserved OAuth keys (state, client_id, redirect_uri, response_type,
	* code_challenge, code_challenge_method, nonce, scope) are rejected.
	*/
	additionalParams: additionalAuthorizationParamsSchema,
	/**
	* Additional data to be passed through the OAuth flow
	*/
	additionalData: record(string(), any()).optional().meta({ description: "Additional data to be passed through the OAuth flow" })
});
var signInSocial = () => createAuthEndpoint("/sign-in/social", {
	method: "POST",
	operationId: "socialSignIn",
	body: socialSignInBodySchema,
	metadata: {
		$Infer: {
			body: {},
			returned: {}
		},
		openapi: {
			description: "Sign in with a social provider",
			operationId: "socialSignIn",
			responses: { "200": {
				description: "Success - Returns session details (idToken branch) or an authorize URL (redirect branch)",
				content: { "application/json": { schema: {
					type: "object",
					description: "Returns session details when idToken is provided, or an authorize URL otherwise",
					properties: {
						token: { type: "string" },
						user: {
							type: "object",
							$ref: "#/components/schemas/User"
						},
						url: { type: "string" },
						redirect: { type: "boolean" }
					},
					required: ["redirect"]
				} } }
			} }
		}
	}
}, async (c) => {
	const provider = await getAwaitableValue(c.context.socialProviders, { value: c.body.provider });
	if (!provider) {
		c.context.logger.error("Provider not found. Make sure to add the provider in your auth config", { provider: c.body.provider });
		throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.PROVIDER_NOT_FOUND);
	}
	if (c.body.idToken) {
		if (!supportsIdTokenSignIn(provider)) {
			c.context.logger.error("Provider does not support id token verification", { provider: c.body.provider });
			throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.ID_TOKEN_NOT_SUPPORTED);
		}
		const { token, nonce } = c.body.idToken;
		if (!await verifyProviderIdToken(provider, token, nonce, c)) {
			c.context.logger.warn("Invalid id token", { provider: c.body.provider });
			throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_TOKEN);
		}
		const oauthTokens = {
			idToken: token,
			accessToken: c.body.idToken.accessToken,
			refreshToken: c.body.idToken.refreshToken,
			user: c.body.idToken.user
		};
		const userInfo = await provider.getUserInfo(oauthTokens);
		if (!userInfo || !userInfo?.user) {
			c.context.logger.error("Failed to get user info", { provider: c.body.provider });
			throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.FAILED_TO_GET_USER_INFO);
		}
		if (!userInfo.user.email) {
			c.context.logger.error(missingEmailLogMessage(c.body.provider, { source: "id_token" }), { provider: c.body.provider });
			throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.USER_EMAIL_NOT_FOUND);
		}
		const accountKey = await resolveOAuthAccountKeyForAPI(provider, oauthTokens, userInfo.data);
		const providerProfile = toOAuthProfileRecord(userInfo.data);
		const data = await handleOAuthUserInfo(c, {
			userInfo: {
				...userInfo.user,
				email: userInfo.user.email,
				id: accountKey.accountId,
				name: userInfo.user.name || "",
				image: userInfo.user.image,
				emailVerified: userInfo.user.emailVerified || false
			},
			account: {
				...accountKey,
				accessToken: c.body.idToken.accessToken,
				idToken: token
			},
			callbackURL: c.body.callbackURL,
			disableSignUp: provider.disableImplicitSignUp && !c.body.requestSignUp || provider.options?.disableSignUp || provider.disableSignUp,
			source: {
				method: "oauth",
				oauth: {
					providerId: provider.id,
					profile: providerProfile
				}
			}
		});
		if (data.error) {
			if (data.error === OAUTH_CALLBACK_ERROR_CODES.EMAIL_NOT_VERIFIED) throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.EMAIL_NOT_VERIFIED);
			throw APIError.from("UNAUTHORIZED", {
				message: data.error,
				code: "OAUTH_LINK_ERROR"
			});
		}
		await setSessionCookie(c, data.data);
		return c.json({
			redirect: false,
			token: data.data.session.token,
			url: void 0,
			user: parseUserOutput(c.context.options, data.data.user)
		});
	}
	const idTokenNonce = generateIdTokenNonce(provider);
	const { codeVerifier, state } = await generateState(c, {
		additionalData: c.body.additionalData,
		idTokenNonce
	});
	const url = await provider.createAuthorizationURL({
		state,
		codeVerifier,
		idTokenNonce,
		redirectURI: `${c.context.baseURL}${getOAuthCallbackPath(provider)}`,
		scopes: c.body.scopes,
		loginHint: c.body.loginHint,
		additionalParams: c.body.additionalParams
	});
	if (!c.body.disableRedirect) c.setHeader("Location", url.toString());
	return c.json({
		url: url.toString(),
		redirect: !c.body.disableRedirect
	});
});
var signInEmail = () => createAuthEndpoint("/sign-in/email", {
	method: "POST",
	operationId: "signInEmail",
	use: [formCsrfMiddleware],
	cloneRequest: true,
	body: object({
		/**
		* Email of the user
		*/
		email: string().meta({ description: "Email of the user" }),
		/**
		* Password of the user
		*/
		password: string().meta({ description: "Password of the user" }),
		/**
		* Callback URL to use as a redirect for email
		* verification and for possible redirects
		*/
		callbackURL: string().meta({ description: "Callback URL to use as a redirect for email verification" }).optional(),
		/**
		* If this is false, the session will not be remembered
		* @default true
		*/
		rememberMe: boolean$1().meta({ description: "If this is false, the session will not be remembered. Default is `true`." }).default(true).optional()
	}),
	metadata: {
		allowedMediaTypes: ["application/x-www-form-urlencoded", "application/json"],
		$Infer: {
			body: {},
			returned: {}
		},
		openapi: {
			operationId: "signInEmail",
			description: "Sign in with email and password",
			responses: { "200": {
				description: "Success - Returns either session details or redirect URL",
				content: { "application/json": { schema: {
					type: "object",
					description: "Session response when idToken is provided",
					properties: {
						redirect: {
							type: "boolean",
							enum: [false]
						},
						token: {
							type: "string",
							description: "Session token"
						},
						url: {
							type: "string",
							nullable: true
						},
						user: {
							type: "object",
							$ref: "#/components/schemas/User"
						}
					},
					required: [
						"redirect",
						"token",
						"user"
					]
				} } }
			} }
		}
	}
}, async (ctx) => {
	if (!ctx.context.options?.emailAndPassword?.enabled) {
		ctx.context.logger.error("Email and password is not enabled. Make sure to enable it in the options on you `auth.ts` file. Check `https://better-auth.com/docs/authentication/email-password` for more!");
		throw APIError.from("BAD_REQUEST", {
			code: "EMAIL_PASSWORD_DISABLED",
			message: "Email and password is not enabled"
		});
	}
	const { email: email$6, password } = ctx.body;
	if (!email().safeParse(email$6).success) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_EMAIL);
	assertPasswordNotTooLong(ctx, password);
	const userRecord = await ctx.context.internalAdapter.findUserByEmail(email$6.toLowerCase(), { includeAccounts: true });
	const credentialAccount = userRecord?.accounts.find((account) => account.providerId === "credential" && account.accountId === userRecord.user.id);
	if (!userRecord || !credentialAccount) {
		await ctx.context.password.hash(password);
		ctx.context.logger.warn("User not found");
		throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD);
	}
	const user = userRecord.user;
	const currentPassword = credentialAccount.password;
	if (!currentPassword) {
		await ctx.context.password.hash(password);
		ctx.context.logger.warn("Password not found");
		throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD);
	}
	if (!await ctx.context.password.verify({
		hash: currentPassword,
		password
	})) {
		ctx.context.logger.warn("Invalid password");
		throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD);
	}
	if (ctx.context.options?.emailAndPassword?.requireEmailVerification && !user.emailVerified) {
		if (!ctx.context.options?.emailVerification?.sendVerificationEmail) throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.EMAIL_NOT_VERIFIED);
		if (ctx.context.options?.emailVerification?.sendOnSignIn) {
			const token = await createEmailVerificationToken(ctx.context.secret, user.email, void 0, ctx.context.options.emailVerification?.expiresIn);
			const callbackURL = ctx.body.callbackURL ? encodeURIComponent(ctx.body.callbackURL) : encodeURIComponent("/");
			const url = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;
			await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
				user,
				url,
				token
			}, safeCloneRequest(ctx.request)));
		}
		throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.EMAIL_NOT_VERIFIED);
	}
	const session = await ctx.context.internalAdapter.createSession(user.id, ctx.body.rememberMe === false);
	if (!session) {
		ctx.context.logger.error("Failed to create session");
		throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION);
	}
	await setSessionCookie(ctx, {
		session,
		user
	}, ctx.body.rememberMe === false);
	if (ctx.body.callbackURL) ctx.setHeader("Location", ctx.body.callbackURL);
	return ctx.json({
		redirect: !!ctx.body.callbackURL,
		token: session.token,
		url: ctx.body.callbackURL,
		user: parseUserOutput(ctx.context.options, user)
	});
});
var signOutBodySchema = object({
	callbackURL: string().meta({ description: "The URL to redirect to after provider logout" }).optional(),
	disableRedirect: boolean$1().meta({ description: "Return the provider logout URL without redirecting" }).optional(),
	state: string().meta({ description: "State to pass to the provider logout endpoint" }).optional()
}).optional();
var signOutResponse = (providerLogout) => ({
	success: true,
	url: providerLogout?.url,
	redirect: providerLogout?.redirect
});
var signOut = createAuthEndpoint("/sign-out", {
	method: "POST",
	body: signOutBodySchema,
	operationId: "signOut",
	requireHeaders: true,
	metadata: { openapi: {
		operationId: "signOut",
		description: "Sign out the current user",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					success: { type: "boolean" },
					url: {
						type: "string",
						description: "Provider logout URL when RP-initiated logout is available"
					},
					redirect: {
						type: "boolean",
						description: "Whether the client should redirect to the provider logout URL"
					}
				}
			} } }
		} }
	} }
}, async (ctx) => {
	const sessionCookieToken = await ctx.getSignedCookie(ctx.context.authCookies.sessionToken.name, ctx.context.secret);
	let currentSession = null;
	if (sessionCookieToken) try {
		currentSession = await ctx.context.internalAdapter.findSession(sessionCookieToken);
	} catch (e) {
		ctx.context.logger.error("Failed to read session from database", e);
	}
	if (sessionCookieToken) try {
		await ctx.context.internalAdapter.deleteSession(sessionCookieToken);
	} catch (e) {
		ctx.context.logger.error("Failed to delete session from database", e);
	}
	deleteSessionCookie(ctx);
	const providerLogoutResult = await (async () => {
		try {
			if (!currentSession) return null;
			const accounts = await ctx.context.internalAdapter.findAccounts(currentSession.user.id);
			const providersById = new Map(ctx.context.socialProviders.map((provider) => [provider.id, provider]));
			const logoutAccounts = accounts.filter((account) => Boolean(providersById.get(account.providerId)?.createEndSessionURL)).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
			if (logoutAccounts.length === 0) return null;
			const seenProviderIds = /* @__PURE__ */ new Set();
			const postLogoutRedirectURI = ctx.body?.callbackURL ? new URL(ctx.body.callbackURL, ctx.context.baseURL).toString() : void 0;
			for (const account of logoutAccounts) {
				if (seenProviderIds.has(account.providerId)) continue;
				seenProviderIds.add(account.providerId);
				const provider = providersById.get(account.providerId);
				try {
					const url = await provider?.createEndSessionURL?.({
						idToken: account.idToken,
						postLogoutRedirectURI,
						state: ctx.body?.state
					});
					if (url) return url.toString();
				} catch (e) {
					ctx.context.logger.error(`Failed to create logout URL for provider "${account.providerId}"`, e);
				}
			}
			return null;
		} catch (e) {
			ctx.context.logger.error("Failed to create provider logout URL", e);
			return null;
		}
	})();
	if (providerLogoutResult) {
		const shouldRedirect = !ctx.body?.disableRedirect;
		if (shouldRedirect) ctx.setHeader("Location", providerLogoutResult);
		return ctx.json(signOutResponse({
			url: providerLogoutResult,
			redirect: shouldRedirect
		}));
	}
	return ctx.json(signOutResponse());
});
var signUpEmailBodySchema = object({
	name: string(),
	email: email(),
	password: string().nonempty(),
	image: string().optional(),
	callbackURL: string().optional(),
	rememberMe: boolean$1().optional()
}).and(record(string(), any()));
var signUpEmail = () => createAuthEndpoint("/sign-up/email", {
	method: "POST",
	operationId: "signUpWithEmailAndPassword",
	use: [formCsrfMiddleware],
	body: signUpEmailBodySchema,
	cloneRequest: true,
	metadata: {
		allowedMediaTypes: ["application/x-www-form-urlencoded", "application/json"],
		$Infer: {
			body: {},
			returned: {}
		},
		openapi: {
			operationId: "signUpWithEmailAndPassword",
			description: "Sign up a user using email and password",
			requestBody: { content: { "application/json": { schema: {
				type: "object",
				properties: {
					name: {
						type: "string",
						description: "The name of the user"
					},
					email: {
						type: "string",
						description: "The email of the user"
					},
					password: {
						type: "string",
						description: "The password of the user"
					},
					image: {
						type: "string",
						description: "The profile image URL of the user"
					},
					callbackURL: {
						type: "string",
						description: "The URL to use for email verification callback"
					},
					rememberMe: {
						type: "boolean",
						description: "If this is false, the session will not be remembered. Default is `true`."
					}
				},
				required: [
					"name",
					"email",
					"password"
				]
			} } } },
			responses: {
				"200": {
					description: "Successfully created user",
					content: { "application/json": { schema: {
						type: "object",
						properties: {
							token: {
								type: "string",
								nullable: true,
								description: "Authentication token for the session"
							},
							user: {
								type: "object",
								properties: {
									id: {
										type: "string",
										description: "The unique identifier of the user"
									},
									email: {
										type: "string",
										format: "email",
										description: "The email address of the user"
									},
									name: {
										type: "string",
										description: "The name of the user"
									},
									image: {
										type: "string",
										format: "uri",
										nullable: true,
										description: "The profile image URL of the user"
									},
									emailVerified: {
										type: "boolean",
										description: "Whether the email has been verified"
									},
									createdAt: {
										type: "string",
										format: "date-time",
										description: "When the user was created"
									},
									updatedAt: {
										type: "string",
										format: "date-time",
										description: "When the user was last updated"
									}
								},
								required: [
									"id",
									"email",
									"name",
									"emailVerified",
									"createdAt",
									"updatedAt"
								]
							}
						},
						required: ["user"]
					} } }
				},
				"422": {
					description: "Unprocessable Entity. User already exists or failed to create user.",
					content: { "application/json": { schema: {
						type: "object",
						properties: { message: { type: "string" } }
					} } }
				}
			}
		}
	}
}, async (ctx) => {
	return runWithTransaction(ctx.context.adapter, async () => {
		if (!ctx.context.options.emailAndPassword?.enabled || ctx.context.options.emailAndPassword?.disableSignUp) throw APIError.from("BAD_REQUEST", {
			message: "Email and password sign up is not enabled",
			code: "EMAIL_PASSWORD_SIGN_UP_DISABLED"
		});
		const body = ctx.body;
		const { name, email: email$5, password, image, callbackURL: _callbackURL, rememberMe, ...rest } = body;
		if (!email().safeParse(email$5).success) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_EMAIL);
		if (!password || typeof password !== "string") throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
		assertPasswordNotTooShort(ctx, password);
		assertPasswordNotTooLong(ctx, password);
		const shouldReturnGenericDuplicateResponse = ctx.context.options.emailAndPassword.requireEmailVerification || ctx.context.options.emailAndPassword.autoSignIn === false;
		const shouldSkipAutoSignIn = ctx.context.options.emailAndPassword.autoSignIn === false || shouldReturnGenericDuplicateResponse;
		const additionalUserFields = parseUserInput(ctx.context.options, rest, "create");
		const normalizedEmail = email$5.toLowerCase();
		const buildGenericDuplicateResponse = () => {
			const now = /* @__PURE__ */ new Date();
			const generatedId = ctx.context.generateId({ model: "user" }) || generateId();
			const coreFields = {
				name,
				email: normalizedEmail,
				emailVerified: false,
				image: image ?? null,
				createdAt: now,
				updatedAt: now
			};
			const customSyntheticUser = ctx.context.options.emailAndPassword?.customSyntheticUser;
			let syntheticUser;
			if (customSyntheticUser) {
				const additionalFieldKeys = Object.keys(ctx.context.options.user?.additionalFields ?? {});
				const additionalFields = {};
				for (const key of additionalFieldKeys) if (key in additionalUserFields) additionalFields[key] = additionalUserFields[key];
				const customResult = customSyntheticUser({
					coreFields,
					additionalFields,
					id: generatedId
				});
				syntheticUser = buildSyntheticUserOutput(ctx.context.options, customResult);
			} else syntheticUser = buildSyntheticUserOutput(ctx.context.options, {
				...coreFields,
				...additionalUserFields,
				id: generatedId
			});
			return ctx.json({
				token: null,
				user: parseUserOutput(ctx.context.options, syntheticUser)
			});
		};
		const dbUser = await ctx.context.internalAdapter.findUserByEmail(normalizedEmail);
		if (dbUser?.user) {
			ctx.context.logger.info(`Sign-up attempt for existing email: ${email$5}`);
			if (shouldReturnGenericDuplicateResponse) {
				/**
				* Hash the password to reduce timing differences
				* between existing and non-existing emails.
				*/
				await ctx.context.password.hash(password);
				if (ctx.context.options.emailAndPassword?.onExistingUserSignUp) await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailAndPassword.onExistingUserSignUp({ user: dbUser.user }, safeCloneRequest(ctx.request)));
				return buildGenericDuplicateResponse();
			}
			throw APIError.from("UNPROCESSABLE_ENTITY", BASE_ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL);
		}
		/**
		* Hash the password
		*
		* This is done prior to creating the user
		* to ensure that any plugin that
		* may break the hashing should break
		* before the user is created.
		*/
		const hash = await ctx.context.password.hash(password);
		let createdUser;
		try {
			createdUser = await ctx.context.internalAdapter.createUser({
				email: normalizedEmail,
				name,
				image,
				...additionalUserFields,
				emailVerified: false
			}, { method: "email-password" });
			if (!createdUser) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.FAILED_TO_CREATE_USER);
		} catch (e) {
			if (isAPIError(e)) {
				if (e.statusCode === 403 && shouldReturnGenericDuplicateResponse) return buildGenericDuplicateResponse();
				throw e;
			}
			if (isDevelopment()) ctx.context.logger.error("Failed to create user", e);
			ctx.context.logger?.error("Failed to create user", e);
			throw APIError.from("UNPROCESSABLE_ENTITY", BASE_ERROR_CODES.FAILED_TO_CREATE_USER);
		}
		if (!createdUser) throw APIError.from("UNPROCESSABLE_ENTITY", BASE_ERROR_CODES.FAILED_TO_CREATE_USER);
		await ctx.context.internalAdapter.linkAccount({
			userId: createdUser.id,
			providerId: "credential",
			accountId: createdUser.id,
			password: hash
		});
		if (ctx.context.options.emailVerification?.sendOnSignUp ?? ctx.context.options.emailAndPassword.requireEmailVerification) {
			const token = await createEmailVerificationToken(ctx.context.secret, createdUser.email, void 0, ctx.context.options.emailVerification?.expiresIn);
			const callbackURL = body.callbackURL ? encodeURIComponent(body.callbackURL) : encodeURIComponent("/");
			const url = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;
			if (ctx.context.options.emailVerification?.sendVerificationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
				user: createdUser,
				url,
				token
			}, safeCloneRequest(ctx.request)));
		}
		if (shouldSkipAutoSignIn) return ctx.json({
			token: null,
			user: parseUserOutput(ctx.context.options, createdUser)
		});
		const session = await ctx.context.internalAdapter.createSession(createdUser.id, rememberMe === false);
		if (!session) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION);
		await setSessionCookie(ctx, {
			session,
			user: createdUser
		}, rememberMe === false);
		return ctx.json({
			token: session.token,
			user: parseUserOutput(ctx.context.options, createdUser)
		});
	});
});
var updateSessionBodySchema = record(string().meta({ description: "Field name must be a string" }), any());
var updateSession = () => createAuthEndpoint("/update-session", {
	method: "POST",
	operationId: "updateSession",
	body: updateSessionBodySchema,
	use: [sessionMiddleware],
	metadata: {
		$Infer: { body: {} },
		openapi: {
			operationId: "updateSession",
			description: "Update the current session",
			responses: { "200": {
				description: "Success",
				content: { "application/json": { schema: {
					type: "object",
					properties: { session: {
						type: "object",
						$ref: "#/components/schemas/Session"
					} }
				} } }
			} }
		}
	}
}, async (ctx) => {
	const body = ctx.body;
	if (typeof body !== "object" || Array.isArray(body)) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.BODY_MUST_BE_AN_OBJECT);
	const session = ctx.context.session;
	const additionalFields = parseSessionInput(ctx.context.options, body, "update");
	if (Object.keys(additionalFields).length === 0) throw APIError.fromStatus("BAD_REQUEST", { message: "No fields to update" });
	const updatedSession = await ctx.context.internalAdapter.updateSession(session.session.token, {
		...additionalFields,
		updatedAt: /* @__PURE__ */ new Date()
	});
	if (!updatedSession && isStateful(ctx)) {
		deleteSessionCookie(ctx);
		throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.FAILED_TO_GET_SESSION);
	}
	const newSession = updatedSession ?? {
		...session.session,
		...additionalFields,
		updatedAt: /* @__PURE__ */ new Date()
	};
	await setSessionCookie(ctx, {
		session: newSession,
		user: session.user
	});
	return ctx.json({ session: parseSessionOutput(ctx.context.options, newSession) });
});
var updateUserBodySchema = record(string().meta({ description: "Field name must be a string" }), any());
var updateUser = () => createAuthEndpoint("/update-user", {
	method: "POST",
	operationId: "updateUser",
	body: updateUserBodySchema,
	use: [sessionMiddleware],
	metadata: {
		$Infer: { body: {} },
		openapi: {
			operationId: "updateUser",
			description: "Update the current user",
			requestBody: { content: { "application/json": { schema: {
				type: "object",
				properties: {
					name: {
						type: "string",
						description: "The name of the user"
					},
					image: {
						type: "string",
						description: "The image of the user",
						nullable: true
					}
				}
			} } } },
			responses: { "200": {
				description: "Success",
				content: { "application/json": { schema: {
					type: "object",
					properties: { user: {
						type: "object",
						$ref: "#/components/schemas/User"
					} }
				} } }
			} }
		}
	}
}, async (ctx) => {
	const body = ctx.body;
	if (typeof body !== "object" || Array.isArray(body)) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.BODY_MUST_BE_AN_OBJECT);
	if (body.email) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.EMAIL_CAN_NOT_BE_UPDATED);
	const { name, image, ...rest } = body;
	const session = ctx.context.session;
	const additionalFields = parseUserInput(ctx.context.options, rest, "update");
	if (image === void 0 && name === void 0 && Object.keys(additionalFields).length === 0) throw APIError.fromStatus("BAD_REQUEST", { message: "No fields to update" });
	const updatedUser = await ctx.context.internalAdapter.updateUser(session.user.id, {
		name,
		image,
		...additionalFields
	}) ?? {
		...session.user,
		...name !== void 0 && { name },
		...image !== void 0 && { image },
		...additionalFields
	};
	/**
	* Update the session cookie with the new user data
	*/
	await setSessionCookie(ctx, {
		session: session.session,
		user: updatedUser
	});
	return ctx.json({ status: true });
});
var changePassword = createAuthEndpoint("/change-password", {
	method: "POST",
	operationId: "changePassword",
	body: object({
		/**
		* The new password to set
		*/
		newPassword: string().meta({ description: "The new password to set" }),
		/**
		* The current password of the user
		*/
		currentPassword: string().meta({ description: "The current password is required" }),
		/**
		* revoke all sessions that are not the
		* current one logged in by the user
		*/
		revokeOtherSessions: boolean$1().meta({ description: "Must be a boolean value" }).optional()
	}),
	use: [sensitiveSessionMiddleware],
	metadata: { openapi: {
		operationId: "changePassword",
		description: "Change the password of the user",
		responses: { "200": {
			description: "Password successfully changed",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					token: {
						type: "string",
						nullable: true,
						description: "New session token if other sessions were revoked"
					},
					user: {
						type: "object",
						properties: {
							id: {
								type: "string",
								description: "The unique identifier of the user"
							},
							email: {
								type: "string",
								format: "email",
								description: "The email address of the user"
							},
							name: {
								type: "string",
								description: "The name of the user"
							},
							image: {
								type: "string",
								format: "uri",
								nullable: true,
								description: "The profile image URL of the user"
							},
							emailVerified: {
								type: "boolean",
								description: "Whether the email has been verified"
							},
							createdAt: {
								type: "string",
								format: "date-time",
								description: "When the user was created"
							},
							updatedAt: {
								type: "string",
								format: "date-time",
								description: "When the user was last updated"
							}
						},
						required: [
							"id",
							"email",
							"name",
							"emailVerified",
							"createdAt",
							"updatedAt"
						]
					}
				},
				required: ["user"]
			} } }
		} }
	} }
}, async (ctx) => {
	const { newPassword, currentPassword, revokeOtherSessions } = ctx.body;
	const session = ctx.context.session;
	assertPasswordNotTooShort(ctx, newPassword);
	assertPasswordNotTooLong(ctx, newPassword);
	assertPasswordNotTooLong(ctx, currentPassword);
	const account = await ctx.context.internalAdapter.findCredentialAccount(session.user.id);
	if (!account || !account.password) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.CREDENTIAL_ACCOUNT_NOT_FOUND);
	const passwordHash = await ctx.context.password.hash(newPassword);
	if (!await ctx.context.password.verify({
		hash: account.password,
		password: currentPassword
	})) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
	await ctx.context.internalAdapter.updateAccount(account.id, { password: passwordHash });
	let token = null;
	if (revokeOtherSessions) {
		await ctx.context.internalAdapter.deleteUserSessions(session.user.id);
		const newSession = await ctx.context.internalAdapter.createSession(session.user.id);
		if (!newSession) throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.FAILED_TO_GET_SESSION);
		await setSessionCookie(ctx, {
			session: newSession,
			user: session.user
		});
		token = newSession.token;
	}
	return ctx.json({
		token,
		user: parseUserOutput(ctx.context.options, session.user)
	});
});
var setPassword = createAuthEndpoint.serverOnly({
	method: "POST",
	body: object({ 
	/**
	* The new password to set
	*/
newPassword: string().meta({ description: "The new password to set is required" }) }),
	use: [sensitiveSessionMiddleware]
}, async (ctx) => {
	const { newPassword } = ctx.body;
	const session = ctx.context.session;
	assertPasswordNotTooShort(ctx, newPassword);
	assertPasswordNotTooLong(ctx, newPassword);
	const account = await ctx.context.internalAdapter.findCredentialAccount(session.user.id);
	const passwordHash = await ctx.context.password.hash(newPassword);
	if (!account) {
		await ctx.context.internalAdapter.linkAccount({
			userId: session.user.id,
			providerId: "credential",
			accountId: session.user.id,
			password: passwordHash
		});
		return ctx.json({ status: true });
	}
	if (!account.password) {
		await ctx.context.internalAdapter.updateAccount(account.id, { password: passwordHash });
		return ctx.json({ status: true });
	}
	throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_ALREADY_SET);
});
var deleteUser = createAuthEndpoint("/delete-user", {
	method: "POST",
	use: [sensitiveSessionMiddleware],
	body: object({
		/**
		* The callback URL to redirect to after the user is deleted
		* this is only used on delete user callback
		*/
		callbackURL: string().meta({ description: "The callback URL to redirect to after the user is deleted" }).optional(),
		/**
		* The password of the user. If the password isn't provided, session freshness
		* will be checked.
		*/
		password: string().meta({ description: "The password of the user is required to delete the user" }).optional(),
		/**
		* The token to delete the user. If the token is provided, the user will be deleted
		*/
		token: string().meta({ description: "The token to delete the user is required" }).optional()
	}),
	metadata: { openapi: {
		operationId: "deleteUser",
		description: "Delete the user",
		requestBody: { content: { "application/json": { schema: {
			type: "object",
			properties: {
				callbackURL: {
					type: "string",
					description: "The callback URL to redirect to after the user is deleted"
				},
				password: {
					type: "string",
					description: "The user's password. Required if session is not fresh"
				},
				token: {
					type: "string",
					description: "The deletion verification token"
				}
			}
		} } } },
		responses: { "200": {
			description: "User deletion processed successfully",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					success: {
						type: "boolean",
						description: "Indicates if the operation was successful"
					},
					message: {
						type: "string",
						enum: ["User deleted", "Verification email sent"],
						description: "Status message of the deletion process"
					}
				},
				required: ["success", "message"]
			} } }
		} }
	} }
}, async (ctx) => {
	if (!ctx.context.options.user?.deleteUser?.enabled) {
		ctx.context.logger.error("Delete user is disabled. Enable it in the options");
		throw APIError.fromStatus("NOT_FOUND");
	}
	const session = ctx.context.session;
	if (ctx.body.password) {
		assertPasswordNotTooLong(ctx, ctx.body.password);
		const account = await ctx.context.internalAdapter.findCredentialAccount(session.user.id);
		if (!account || !account.password) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.CREDENTIAL_ACCOUNT_NOT_FOUND);
		if (!await ctx.context.password.verify({
			hash: account.password,
			password: ctx.body.password
		})) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
	}
	if (ctx.body.token) {
		await deleteUserCallback({
			...ctx,
			query: { token: ctx.body.token }
		});
		return ctx.json({
			success: true,
			message: "User deleted"
		});
	}
	if (ctx.context.options.user.deleteUser?.sendDeleteAccountVerification) {
		const token = generateRandomString(32, "0-9", "a-z");
		await ctx.context.internalAdapter.createVerificationValue({
			value: session.user.id,
			identifier: `delete-account-${token}`,
			expiresAt: new Date(Date.now() + (ctx.context.options.user.deleteUser?.deleteTokenExpiresIn || 86400) * 1e3)
		});
		const url = `${ctx.context.baseURL}/delete-user/callback?token=${token}&callbackURL=${encodeURIComponent(ctx.body.callbackURL || "/")}`;
		await ctx.context.runInBackgroundOrAwait(ctx.context.options.user.deleteUser.sendDeleteAccountVerification({
			user: session.user,
			url,
			token
		}, ctx.request));
		return ctx.json({
			success: true,
			message: "Verification email sent"
		});
	}
	if (!ctx.body.password && ctx.context.sessionConfig.freshAge !== 0) {
		const createdAt = new Date(session.session.createdAt).getTime();
		const freshAge = ctx.context.sessionConfig.freshAge * 1e3;
		if (Date.now() - createdAt >= freshAge) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.SESSION_EXPIRED);
	}
	const beforeDelete = ctx.context.options.user.deleteUser?.beforeDelete;
	if (beforeDelete) await beforeDelete(session.user, ctx.request);
	await ctx.context.internalAdapter.deleteUser(session.user.id);
	await ctx.context.internalAdapter.deleteUserSessions(session.user.id);
	deleteSessionCookie(ctx);
	const afterDelete = ctx.context.options.user.deleteUser?.afterDelete;
	if (afterDelete) await afterDelete(session.user, ctx.request);
	return ctx.json({
		success: true,
		message: "User deleted"
	});
});
var deleteUserCallback = createAuthEndpoint("/delete-user/callback", {
	method: "GET",
	query: object({
		token: string().meta({ description: "The token to verify the deletion request" }),
		callbackURL: string().meta({ description: "The URL to redirect to after deletion" }).optional()
	}),
	use: [originCheck((ctx) => ctx.query.callbackURL)],
	metadata: { openapi: {
		description: "Callback to complete user deletion with verification token",
		responses: { "200": {
			description: "User successfully deleted",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					success: {
						type: "boolean",
						description: "Indicates if the deletion was successful"
					},
					message: {
						type: "string",
						enum: ["User deleted"],
						description: "Confirmation message"
					}
				},
				required: ["success", "message"]
			} } }
		} }
	} }
}, async (ctx) => {
	if (!ctx.context.options.user?.deleteUser?.enabled) {
		ctx.context.logger.error("Delete user is disabled. Enable it in the options");
		throw APIError.from("NOT_FOUND", {
			message: "Not found",
			code: "NOT_FOUND"
		});
	}
	const session = await getSessionFromCtx(ctx, { disableCookieCache: isStateful(ctx) });
	if (!session) throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.FAILED_TO_GET_USER_INFO);
	const token = await ctx.context.internalAdapter.consumeVerificationValue(`delete-account-${ctx.query.token}`);
	if (!token || token.value !== session.user.id) throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.INVALID_TOKEN);
	const beforeDelete = ctx.context.options.user.deleteUser?.beforeDelete;
	if (beforeDelete) await beforeDelete(session.user, ctx.request);
	await ctx.context.internalAdapter.deleteUser(session.user.id);
	await ctx.context.internalAdapter.deleteUserSessions(session.user.id);
	await ctx.context.internalAdapter.deleteAccounts(session.user.id);
	deleteSessionCookie(ctx);
	const afterDelete = ctx.context.options.user.deleteUser?.afterDelete;
	if (afterDelete) await afterDelete(session.user, ctx.request);
	if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL || "/");
	return ctx.json({
		success: true,
		message: "User deleted"
	});
});
var changeEmail = createAuthEndpoint("/change-email", {
	method: "POST",
	body: object({
		newEmail: email().meta({ description: "The new email address to set must be a valid email address" }),
		callbackURL: string().meta({ description: "The URL to redirect to after email verification" }).optional()
	}),
	use: [sensitiveSessionMiddleware],
	metadata: { openapi: {
		operationId: "changeEmail",
		responses: { "200": {
			description: "Email change request processed successfully",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					user: {
						type: "object",
						$ref: "#/components/schemas/User"
					},
					status: {
						type: "boolean",
						description: "Indicates if the request was successful"
					},
					message: {
						type: "string",
						enum: ["Email updated", "Verification email sent"],
						description: "Status message of the email change process",
						nullable: true
					}
				},
				required: ["status"]
			} } }
		} }
	} }
}, async (ctx) => {
	if (!ctx.context.options.user?.changeEmail?.enabled) {
		ctx.context.logger.error("Change email is disabled.");
		throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.CHANGE_EMAIL_DISABLED);
	}
	const newEmail = ctx.body.newEmail.toLowerCase();
	if (newEmail === ctx.context.session.user.email) {
		ctx.context.logger.warn("Email is the same");
		throw APIError.fromStatus("BAD_REQUEST", { message: "Email is the same" });
	}
	/**
	* Early config check: ensure at least one email-change flow is
	* available for the current session state. Without this, an
	* existing-email lookup would return 200 while a non-existing
	* email would later throw 400, leaking email existence.
	*/
	const canUpdateWithoutVerification = ctx.context.session.user.emailVerified !== true && ctx.context.options.user.changeEmail.updateEmailWithoutVerification;
	const canSendVerification = ctx.context.options.emailVerification?.sendVerificationEmail;
	const canSendConfirmation = canSendVerification && ctx.context.session.user.emailVerified && ctx.context.options.user.changeEmail.sendChangeEmailConfirmation;
	if (!canUpdateWithoutVerification && !canSendConfirmation && !canSendVerification) {
		ctx.context.logger.error("Verification email isn't enabled.");
		throw APIError.fromStatus("BAD_REQUEST", { message: "Verification email isn't enabled" });
	}
	if (await ctx.context.internalAdapter.findUserByEmail(newEmail)) {
		await createEmailVerificationToken(ctx.context.secret, ctx.context.session.user.email, newEmail, ctx.context.options.emailVerification?.expiresIn);
		ctx.context.logger.info("Change email attempt for existing email");
		return ctx.json({ status: true });
	}
	/**
	* If the email is not verified, we can update the email if the option is enabled
	*/
	if (canUpdateWithoutVerification) {
		await ctx.context.internalAdapter.updateUser(ctx.context.session.user.id, { email: newEmail });
		await setSessionCookie(ctx, {
			session: ctx.context.session.session,
			user: {
				...ctx.context.session.user,
				email: newEmail
			}
		});
		if (canSendVerification) {
			const token = await createEmailVerificationToken(ctx.context.secret, newEmail, void 0, ctx.context.options.emailVerification?.expiresIn);
			const url = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${encodeURIComponent(ctx.body.callbackURL || "/")}`;
			await ctx.context.runInBackgroundOrAwait(canSendVerification({
				user: {
					...ctx.context.session.user,
					email: newEmail
				},
				url,
				token
			}, ctx.request));
		}
		return ctx.json({ status: true });
	}
	/**
	* If the email is verified, we need to send a verification email
	*/
	if (canSendConfirmation) {
		const token = await createEmailVerificationToken(ctx.context.secret, ctx.context.session.user.email, newEmail, ctx.context.options.emailVerification?.expiresIn, { requestType: "change-email-confirmation" });
		const url = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${encodeURIComponent(ctx.body.callbackURL || "/")}`;
		await ctx.context.runInBackgroundOrAwait(canSendConfirmation({
			user: ctx.context.session.user,
			newEmail,
			url,
			token
		}, ctx.request));
		return ctx.json({ status: true });
	}
	if (!canSendVerification) {
		ctx.context.logger.error("Verification email isn't enabled.");
		throw APIError.fromStatus("BAD_REQUEST", { message: "Verification email isn't enabled" });
	}
	const token = await createEmailVerificationToken(ctx.context.secret, ctx.context.session.user.email, newEmail, ctx.context.options.emailVerification?.expiresIn, { requestType: "change-email-verification" });
	const url = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${encodeURIComponent(ctx.body.callbackURL || "/")}`;
	await ctx.context.runInBackgroundOrAwait(canSendVerification({
		user: {
			...ctx.context.session.user,
			email: newEmail
		},
		url,
		token
	}, ctx.request));
	return ctx.json({ status: true });
});
var defuReplaceArrays = createDefu((obj, key, value) => {
	if (Array.isArray(obj[key]) && Array.isArray(value)) {
		obj[key] = value;
		return true;
	}
});
var hooksSourceWeakMap = /* @__PURE__ */ new WeakMap();
/**
* Resolves the operation id used for spans, preferring an explicit
* `operationId`, then the OpenAPI one, then the caller's `fallback` (the
* `auth.api.*` map key), and finally the route path.
*/
function getOperationId(endpoint, fallback) {
	const opts = endpoint.options;
	return opts?.operationId ?? opts?.metadata?.openapi?.operationId ?? fallback ?? endpoint.path ?? "/:virtual";
}
/**
* Merge a set of response headers onto the dispatch's accumulator, appending
* `set-cookie` (multiple cookies are legal) and replacing everything else.
*/
function mergeResponseHeaders(context, headers) {
	if (!headers) return;
	headers.forEach((value, key) => {
		if (!context.responseHeaders) context.responseHeaders = new Headers({ [key]: value });
		else if (key.toLowerCase() === "set-cookie") context.responseHeaders.append(key, value);
		else context.responseHeaders.set(key, value);
	});
}
/**
* Combine the two header sources an `APIError` can carry into one set:
* - `kAPIErrorHeaderSymbol`: `ctx.responseHeaders` accumulated via
*   `c.setCookie` / `c.setHeader` before the throw.
* - `e.headers`: explicit headers on the error (e.g. `location` from
*   `c.redirect`).
*
* `c.redirect()` reuses `ctx.responseHeaders` as `e.headers`, so when both
* point at the same object iterating each would duplicate every `set-cookie`;
* the identity check skips that copy. Explicit error headers override
* accumulated ones, while cookies from both accumulate.
*/
function mergeAPIErrorHeaders(error) {
	const ctxHeaders = error[kAPIErrorHeaderSymbol];
	const errHeaders = error.headers && error.headers !== ctxHeaders ? new Headers(error.headers) : null;
	if (!ctxHeaders && !errHeaders) return null;
	const headers = new Headers();
	ctxHeaders?.forEach((value, key) => {
		headers.append(key, value);
	});
	errHeaders?.forEach((value, key) => {
		if (key.toLowerCase() === "set-cookie") headers.append(key, value);
		else headers.set(key, value);
	});
	return headers;
}
async function runBeforeHooks(context, hooks, endpoint, operationId) {
	const withSpan = createWithSpan(context.context.options);
	let modifiedContext = {};
	for (const hook of hooks) {
		let matched = false;
		try {
			matched = hook.matcher(context);
		} catch (error) {
			const hookSource = hooksSourceWeakMap.get(hook.handler) ?? "unknown";
			context.context.logger.error(`An error occurred during ${hookSource} hook matcher execution:`, error);
			throw new APIError("INTERNAL_SERVER_ERROR", { message: "An error occurred during hook matcher execution. Check the logs for more details." });
		}
		if (!matched) continue;
		const hookSource = hooksSourceWeakMap.get(hook.handler) ?? "unknown";
		const route = endpoint.path ?? "/:virtual";
		const result = await withSpan(`hook before ${route} ${hookSource}`, {
			[ATTR_HOOK_TYPE]: "before",
			[import_src.ATTR_HTTP_ROUTE]: route,
			[ATTR_CONTEXT]: hookSource,
			[ATTR_OPERATION_ID]: operationId
		}, () => hook.handler({
			...context,
			returnHeaders: true
		})).catch((e) => {
			if (isAPIError(e) && shouldPublishLog(context.context.logger.level, "debug")) e.stack = e.errorStack;
			throw e;
		});
		mergeResponseHeaders(context.context, result?.headers);
		const hookReturn = result?.response;
		if (hookReturn && typeof hookReturn === "object") {
			if ("context" in hookReturn && typeof hookReturn.context === "object") {
				const { headers, ...rest } = hookReturn.context;
				if (headers instanceof Headers) if (modifiedContext.headers) headers.forEach((value, key) => {
					modifiedContext.headers?.set(key, value);
				});
				else modifiedContext.headers = headers;
				modifiedContext = defuReplaceArrays(rest, modifiedContext);
				continue;
			}
			return hookReturn;
		}
	}
	return { context: modifiedContext };
}
async function runAfterHooks(context, hooks, endpoint, operationId) {
	const withSpan = createWithSpan(context.context.options);
	for (const hook of hooks) {
		if (!hook.matcher(context)) continue;
		const hookSource = hooksSourceWeakMap.get(hook.handler) ?? "unknown";
		const route = endpoint.path ?? "/:virtual";
		const result = await withSpan(`hook after ${route} ${hookSource}`, {
			[ATTR_HOOK_TYPE]: "after",
			[import_src.ATTR_HTTP_ROUTE]: route,
			[ATTR_CONTEXT]: hookSource,
			[ATTR_OPERATION_ID]: operationId
		}, () => hook.handler(context)).catch((e) => {
			if (isAPIError(e)) {
				if (shouldPublishLog(context.context.logger.level, "debug")) e.stack = e.errorStack;
				return {
					response: e,
					headers: mergeAPIErrorHeaders(e)
				};
			}
			throw e;
		});
		mergeResponseHeaders(context.context, result.headers);
		if (result.response !== void 0) context.context.returned = result.response;
	}
	return {
		response: context.context.returned,
		headers: context.context.responseHeaders
	};
}
function getHooks(authContext) {
	const plugins = authContext.options.plugins || [];
	const beforeHooks = [];
	const afterHooks = [];
	const beforeHookHandler = authContext.options.hooks?.before;
	if (beforeHookHandler) {
		hooksSourceWeakMap.set(beforeHookHandler, "user");
		beforeHooks.push({
			matcher: () => true,
			handler: beforeHookHandler
		});
	}
	const afterHookHandler = authContext.options.hooks?.after;
	if (afterHookHandler) {
		hooksSourceWeakMap.set(afterHookHandler, "user");
		afterHooks.push({
			matcher: () => true,
			handler: afterHookHandler
		});
	}
	const pluginBeforeHooks = plugins.flatMap((plugin) => (plugin.hooks?.before ?? []).map((h) => {
		hooksSourceWeakMap.set(h.handler, `plugin:${plugin.id}`);
		return h;
	}));
	const pluginAfterHooks = plugins.flatMap((plugin) => (plugin.hooks?.after ?? []).map((h) => {
		hooksSourceWeakMap.set(h.handler, `plugin:${plugin.id}`);
		return h;
	}));
	if (pluginBeforeHooks.length) beforeHooks.push(...pluginBeforeHooks);
	if (pluginAfterHooks.length) afterHooks.push(...pluginAfterHooks);
	return {
		beforeHooks,
		afterHooks
	};
}
/**
* Run a single endpoint through the configured `hooks.before` / `hooks.after`
* pipeline, normalizing the response, headers, and `APIError`s the same way a
* router or `auth.api.*` dispatch does.
*
* This is the canonical hook runner. The HTTP router and `auth.api.*` reach it
* through {@link toAuthEndpoints}. Plugins call it directly when they need to
* re-enter the pipeline on purpose, such as resuming `/oauth2/authorize` after
* a fresh sign-in. Calling an endpoint as a plain function deliberately skips
* hooks; `dispatchAuthEndpoint` is the supported way to opt back in.
*
* @param endpoint The endpoint to dispatch.
* @param input Input context whose `context` is an already-resolved `AuthContext`.
*/
async function dispatchAuthEndpoint(endpoint, input) {
	const withSpan = createWithSpan(input.context.options);
	const operationId = input.operationId ?? getOperationId(endpoint);
	const route = endpoint.path ?? "/:virtual";
	const endpointMethod = endpoint.options?.method;
	const defaultMethod = Array.isArray(endpointMethod) ? endpointMethod[0] : endpointMethod;
	const methodName = input.method ?? input.request?.method ?? defaultMethod ?? "?";
	const shouldReturnResponse = input.asResponse ?? isRequestLike(input.request);
	let internalContext = {
		...input,
		context: {
			...input.context,
			returned: void 0,
			responseHeaders: void 0,
			session: input.context.session ?? null
		},
		path: endpoint.path,
		headers: input.headers ? new Headers(input.headers) : void 0
	};
	return withSpan(`${methodName} ${route}`, {
		[import_src.ATTR_HTTP_ROUTE]: route,
		[ATTR_OPERATION_ID]: operationId
	}, async () => runWithEndpointContext(internalContext, async () => {
		const { beforeHooks, afterHooks } = getHooks(internalContext.context);
		const before = await runBeforeHooks(internalContext, beforeHooks, endpoint, operationId);
		if ("context" in before && before.context && typeof before.context === "object") {
			const { headers, ...rest } = before.context;
			if (headers) {
				if (!internalContext.headers) internalContext.headers = new Headers();
				const requestHeaders = internalContext.headers;
				headers.forEach((value, key) => {
					requestHeaders.set(key, value);
				});
			}
			internalContext = defuReplaceArrays(rest, internalContext);
		} else if (before) {
			const responseHeaders = internalContext.context.responseHeaders;
			return shouldReturnResponse ? toResponse(before, { headers: responseHeaders }) : input.returnHeaders ? {
				headers: responseHeaders,
				response: before
			} : before;
		}
		internalContext.asResponse = false;
		internalContext.returnHeaders = true;
		internalContext.returnStatus = true;
		const result = await runWithEndpointContext(internalContext, () => withSpan(`handler ${route}`, {
			[import_src.ATTR_HTTP_ROUTE]: route,
			[ATTR_OPERATION_ID]: operationId
		}, () => endpoint(internalContext))).catch((e) => {
			if (isAPIError(e)) return {
				response: e,
				status: e.statusCode,
				headers: mergeAPIErrorHeaders(e)
			};
			throw e;
		});
		if (result instanceof Response) return result;
		internalContext.context.returned = result.response;
		internalContext.context.responseHeaders = result.headers ?? void 0;
		const after = await runAfterHooks(internalContext, afterHooks, endpoint, operationId);
		if (after.response !== void 0) result.response = after.response;
		result.headers = after.headers ?? result.headers;
		if (isAPIError(result.response) && shouldPublishLog(internalContext.context.logger.level, "debug")) result.response.stack = result.response.errorStack;
		if (isAPIError(result.response) && !shouldReturnResponse) {
			if (result.headers) Object.defineProperty(result.response, kAPIErrorHeaderSymbol, {
				enumerable: false,
				configurable: true,
				writable: false,
				value: result.headers
			});
			throw result.response;
		}
		return shouldReturnResponse ? toResponse(result.response, {
			headers: result.headers ?? void 0,
			status: result.status
		}) : input.returnHeaders ? input.returnStatus ? {
			headers: result.headers,
			response: result.response,
			status: result.status
		} : {
			headers: result.headers,
			response: result.response
		} : input.returnStatus ? {
			response: result.response,
			status: result.status
		} : result.response;
	}));
}
/**
* Resolves the per-call `AuthContext` for endpoints with a dynamic `baseURL`.
*
* - `rawCtx.baseURL` already set: HTTP handler rehydrated upstream; return as-is.
* - Direct `auth.api` call with a source or a configured `fallback`: resolve here.
* - Neither: throw `APIError` with a helpful message. Leaving `baseURL = ""`
*   would let plugins build `new URL("")` and crash cryptically downstream.
*/
async function resolveDynamicContext(rawCtx, input) {
	if (rawCtx.baseURL) return rawCtx;
	const source = pickSource(input);
	const config = rawCtx.options.baseURL;
	const hasFallback = isDynamicBaseURLConfig(config) && Boolean(config.fallback);
	if (source === void 0 && !hasFallback) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Dynamic baseURL could not be resolved for this direct auth.api call. Pass `headers: request.headers` (or `request`) to the call, or add `fallback` to your baseURL config." });
	try {
		return await resolveRequestContext(rawCtx, source, resolveDynamicTrustedProxyHeaders(rawCtx.options));
	} catch (err) {
		if (err instanceof BetterAuthError) throw new APIError("INTERNAL_SERVER_ERROR", { message: err.message });
		throw err;
	}
}
/**
* Wraps each raw endpoint so a router or `auth.api.*` call runs it through the
* configured hook pipeline. Per-call work that is specific to this entry point
* (dynamic `baseURL` resolution, request-state initialization) happens here;
* the hook pipeline itself lives in {@link dispatchAuthEndpoint}.
*/
function toAuthEndpoints(endpoints, ctx) {
	const api = {};
	for (const [key, endpoint] of Object.entries(endpoints)) {
		api[key] = async (context) => {
			const operationId = getOperationId(endpoint, key);
			const run = async () => {
				const rawContext = await ctx;
				const pendingSchemaCheck = rawContext.checkSchema?.();
				if (pendingSchemaCheck) await pendingSchemaCheck;
				const authContext = isDynamicBaseURLConfig(rawContext.options.baseURL) ? await resolveDynamicContext(rawContext, context) : rawContext;
				return dispatchAuthEndpoint(endpoint, {
					...context,
					context: authContext,
					operationId,
					asResponse: context?.asResponse ?? isRequestLike(context?.request)
				});
			};
			if (await hasRequestState()) return run();
			return runWithRequestState(/* @__PURE__ */ new WeakMap(), run);
		};
		api[key].path = endpoint.path;
		api[key].options = endpoint.options;
	}
	return api;
}
function checkEndpointConflicts(options, logger) {
	const endpointRegistry = /* @__PURE__ */ new Map();
	options.plugins?.forEach((plugin) => {
		if (plugin.endpoints) {
			for (const [key, endpoint] of Object.entries(plugin.endpoints)) if (endpoint && "path" in endpoint && typeof endpoint.path === "string") {
				const path = endpoint.path;
				let methods = [];
				if (endpoint.options && "method" in endpoint.options) {
					if (Array.isArray(endpoint.options.method)) methods = endpoint.options.method;
					else if (typeof endpoint.options.method === "string") methods = [endpoint.options.method];
				}
				if (methods.length === 0) methods = ["*"];
				if (!endpointRegistry.has(path)) endpointRegistry.set(path, []);
				endpointRegistry.get(path).push({
					pluginId: plugin.id,
					endpointKey: key,
					methods
				});
			}
		}
	});
	const conflicts = [];
	for (const [path, entries] of endpointRegistry.entries()) if (entries.length > 1) {
		const methodMap = /* @__PURE__ */ new Map();
		let hasConflict = false;
		for (const entry of entries) for (const method of entry.methods) {
			if (!methodMap.has(method)) methodMap.set(method, []);
			methodMap.get(method).push(entry.pluginId);
			if (methodMap.get(method).length > 1) hasConflict = true;
			if (method === "*" && entries.length > 1) hasConflict = true;
			else if (method !== "*" && methodMap.has("*")) hasConflict = true;
		}
		if (hasConflict) {
			const uniquePlugins = [...new Set(entries.map((e) => e.pluginId))];
			const conflictingMethods = [];
			for (const [method, plugins] of methodMap.entries()) if (plugins.length > 1 || method === "*" && entries.length > 1 || method !== "*" && methodMap.has("*")) conflictingMethods.push(method);
			conflicts.push({
				path,
				plugins: uniquePlugins,
				conflictingMethods
			});
		}
	}
	if (conflicts.length > 0) {
		const conflictMessages = conflicts.map((conflict) => `  - "${conflict.path}" [${conflict.conflictingMethods.join(", ")}] used by plugins: ${conflict.plugins.join(", ")}`).join("\n");
		logger.error(`Endpoint path conflicts detected! Multiple plugins are trying to use the same endpoint paths with conflicting HTTP methods:
${conflictMessages}

To resolve this, you can:
	1. Use only one of the conflicting plugins
	2. Configure the plugins to use different paths (if supported)
	3. Ensure plugins use different HTTP methods for the same path
`);
	}
}
function getEndpoints(ctx, options) {
	const withSpan = createWithSpan(options);
	const pluginEndpoints = options.plugins?.reduce((acc, plugin) => {
		return {
			...acc,
			...plugin.endpoints
		};
	}, {}) ?? {};
	const middlewares = options.plugins?.map((plugin) => plugin.middlewares?.map((m) => {
		const middleware = (async (context) => {
			const authContext = await ctx;
			return withSpan(`middleware ${m.path} ${plugin.id}`, {
				["better_auth.hook.type"]: "middleware",
				[import_src.ATTR_HTTP_ROUTE]: m.path,
				["better_auth.context"]: `plugin:${plugin.id}`
			}, () => m.middleware({
				...context,
				context: {
					...authContext,
					...context.context
				}
			}));
		});
		middleware.options = m.middleware.options;
		return {
			path: m.path,
			middleware
		};
	})).filter((plugin) => plugin !== void 0).flat() || [];
	return {
		api: toAuthEndpoints({
			signInSocial: signInSocial(),
			callbackOAuth,
			getSession: getSession(),
			signOut,
			signUpEmail: signUpEmail(),
			signInEmail: signInEmail(),
			resetPassword,
			verifyPassword: verifyPassword$1,
			verifyEmail,
			sendVerificationEmail,
			changeEmail,
			changePassword,
			setPassword,
			updateSession: updateSession(),
			updateUser: updateUser(),
			deleteUser,
			requestPasswordReset,
			requestPasswordResetCallback,
			listSessions: listSessions(),
			revokeSession,
			revokeSessions,
			revokeOtherSessions,
			linkSocialAccount,
			listUserAccounts,
			deleteUserCallback,
			unlinkAccount,
			refreshToken,
			getAccessToken,
			accountInfo,
			...pluginEndpoints,
			ok,
			error
		}, ctx),
		middlewares
	};
}
var router = (ctx, options) => {
	const withSpan = createWithSpan(options);
	const { api, middlewares } = getEndpoints(ctx, options);
	const basePath = new URL(ctx.baseURL).pathname;
	return createRouter$1(api, {
		routerContext: ctx,
		openapi: { disabled: true },
		basePath,
		routerMiddleware: [{
			path: "/**",
			middleware: originCheckMiddleware
		}, ...middlewares],
		allowedMediaTypes: ["application/json"],
		skipTrailingSlashes: options.advanced?.skipTrailingSlashes ?? false,
		async onRequest(req) {
			const disabledPaths = ctx.options.disabledPaths || [];
			const normalizedPath = normalizePathname(req.url, basePath);
			if (disabledPaths.includes(normalizedPath)) return new Response("Not Found", { status: 404 });
			const pendingSchemaCheck = ctx.checkSchema?.();
			if (pendingSchemaCheck) await pendingSchemaCheck;
			let currentRequest = req;
			const rateLimitResponse = await onRequestRateLimit(currentRequest, ctx);
			if (rateLimitResponse) return rateLimitResponse;
			for (const plugin of ctx.options.plugins || []) if (plugin.onRequest) {
				const response = await withSpan(`onRequest ${plugin.id}`, {
					[ATTR_HOOK_TYPE]: "onRequest",
					[ATTR_CONTEXT]: `plugin:${plugin.id}`
				}, () => plugin.onRequest(currentRequest, ctx));
				if (response && "response" in response) return response.response;
				if (response && "request" in response) currentRequest = response.request;
			}
			return currentRequest;
		},
		async onResponse(res, req) {
			for (const plugin of ctx.options.plugins || []) if (plugin.onResponse) {
				const response = await withSpan(`onResponse ${plugin.id}`, {
					[ATTR_HOOK_TYPE]: "onResponse",
					[ATTR_CONTEXT]: `plugin:${plugin.id}`,
					[import_src.ATTR_HTTP_RESPONSE_STATUS_CODE]: res.status
				}, () => plugin.onResponse(res, ctx));
				if (response) return response.response;
			}
			return res;
		},
		onError(e) {
			if (isAPIError(e) && e.status === "FOUND") return;
			if (options.onAPIError?.throw) throw e;
			if (options.onAPIError?.onError) {
				options.onAPIError.onError(e, ctx);
				return;
			}
			const optLogLevel = options.logger?.level;
			const log = optLogLevel === "error" || optLogLevel === "warn" || optLogLevel === "debug" ? logger : void 0;
			if (options.logger?.disabled !== true) {
				if (e && typeof e === "object" && "message" in e && typeof e.message === "string") {
					if (e.message.includes("no column") || e.message.includes("column") || e.message.includes("relation") || e.message.includes("table") || e.message.includes("does not exist")) {
						ctx.logger?.error(e.message);
						return;
					}
				}
				if (isAPIError(e)) {
					if (e.status === "INTERNAL_SERVER_ERROR") ctx.logger.error(e.status, e);
					log?.error(e.message);
				} else ctx.logger?.error(e && typeof e === "object" && "name" in e ? e.name : "", e);
			}
		}
	});
};
async function getBaseAdapter(options, handleDirectDatabase) {
	let adapter;
	if (!options.database) {
		const tables = getAuthTables(options);
		const memoryDB = Object.keys(tables).reduce((acc, key) => {
			acc[key] = [];
			return acc;
		}, {});
		const { memoryAdapter } = await import("../_libs/better-auth__memory-adapter.mjs").then((n) => n.t);
		adapter = memoryAdapter(memoryDB)(options);
	} else if (typeof options.database === "function") adapter = options.database(options);
	else adapter = await handleDirectDatabase(options);
	if (!adapter.transaction) {
		logger.warn("Adapter does not correctly implement transaction function, patching it automatically. Please update your adapter implementation.");
		adapter.transaction = async (cb) => {
			return cb(adapter);
		};
	}
	return adapter;
}
async function getAdapter(options) {
	return getBaseAdapter(options, async (opts) => {
		const { createKyselyAdapter, kyselyAdapter } = await import("./kysely-adapter-Cj_QZw5p.mjs");
		const { kysely, databaseType, transaction } = await createKyselyAdapter(opts);
		if (!kysely) throw new BetterAuthError("Failed to initialize database adapter");
		return kyselyAdapter(kysely, {
			type: databaseType || "sqlite",
			debugLogs: opts.database && "debugLogs" in opts.database ? opts.database.debugLogs : false,
			transaction
		})(opts);
	});
}
function getSchema(config) {
	const { indexesByTable, tables } = getAuthTablesWithResolvedIndexes(config);
	const schema = {};
	for (const key in tables) {
		const table = tables[key];
		const fields = table.fields;
		const actualFields = {};
		Object.entries(fields).forEach(([key, field]) => {
			actualFields[field.fieldName || key] = field;
			if (field.references) {
				const refTable = tables[field.references.model];
				if (refTable) actualFields[field.fieldName || key].references = {
					...field.references,
					model: refTable.modelName,
					field: field.references.field
				};
			}
		});
		if (schema[table.modelName]) {
			schema[table.modelName].fields = {
				...schema[table.modelName].fields,
				...actualFields
			};
			if (table.disableMigrations) schema[table.modelName].disableMigrations = true;
			continue;
		}
		schema[table.modelName] = {
			fields: actualFields,
			order: table.order || Infinity,
			disableMigrations: table.disableMigrations
		};
	}
	for (const [tableName, indexes] of indexesByTable) if (schema[tableName]) schema[tableName].indexes = indexes;
	return schema;
}
var map = {
	postgres: {
		string: [
			"character varying",
			"varchar",
			"text",
			"uuid"
		],
		number: [
			"int4",
			"integer",
			"bigint",
			"smallint",
			"numeric",
			"real",
			"double precision"
		],
		boolean: ["bool", "boolean"],
		date: [
			"timestamptz",
			"timestamp",
			"date"
		],
		json: ["json", "jsonb"]
	},
	mysql: {
		string: [
			"varchar",
			"text",
			"uuid"
		],
		number: [
			"integer",
			"int",
			"bigint",
			"smallint",
			"decimal",
			"float",
			"double"
		],
		boolean: ["boolean", "tinyint"],
		date: [
			"timestamp",
			"datetime",
			"date"
		],
		json: ["json"]
	},
	sqlite: {
		string: ["TEXT"],
		number: [
			"INTEGER",
			"REAL",
			"BIGINT"
		],
		boolean: ["INTEGER", "BOOLEAN"],
		date: ["DATE", "INTEGER"],
		json: ["TEXT"]
	},
	mssql: {
		string: [
			"varchar",
			"nvarchar",
			"uniqueidentifier"
		],
		number: [
			"int",
			"bigint",
			"smallint",
			"decimal",
			"float",
			"double"
		],
		boolean: ["bit", "smallint"],
		date: [
			"datetime2",
			"date",
			"datetime"
		],
		json: ["varchar", "nvarchar"]
	}
};
function createDatabaseIndexKey(tableName, indexName) {
	return `${getPortableDatabaseIdentifierKey(tableName)}\u0000${getPortableDatabaseIdentifierKey(indexName)}`;
}
function createDatabaseColumnKey(tableName, columnName) {
	return `${tableName}\u0000${columnName}`;
}
function databaseIndexMatches(existing, configured) {
	return existing.unique === (configured.unique ?? false) && existing.validFullColumns && existing.columns.length === configured.columns.length && existing.columns.every((column, position) => column === configured.columns[position]);
}
function databaseValueIsTrue(value) {
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value !== 0;
	return value === "1" || value?.toLowerCase() === "true" || value === "t";
}
function toDatabaseIndexMap(indexes) {
	return new Map(indexes.map((index) => {
		const columns = [...index.columns].sort((left, right) => left.position - right.position);
		return [createDatabaseIndexKey(index.table, index.name), {
			columns: columns.flatMap((column) => column.name === null ? [] : [column.name]),
			name: index.name,
			table: index.table,
			unique: index.unique,
			validFullColumns: index.valid && !index.partial && columns.length > 0 && columns.every((column) => column.name !== null && column.fullLength)
		}];
	}));
}
async function getDatabaseIndexMap(db, target, tableNames, introspectIndexes) {
	if (introspectIndexes) return toDatabaseIndexMap(await introspectIndexes(tableNames));
	let rows;
	switch (target.type) {
		case "sqlite":
			rows = (await sql`
				SELECT
					tables.name AS "tableName",
					index_list.name AS "indexName",
					index_info.name AS "columnName",
					index_list."unique" AS "isUnique",
					index_list.partial AS "isPartial",
					index_info.seqno AS "columnPosition"
				FROM sqlite_master AS tables
				INNER JOIN pragma_index_list(tables.name) AS index_list
				INNER JOIN pragma_index_info(index_list.name) AS index_info
				WHERE tables.type = 'table'
			`.execute(db)).rows;
			break;
		case "postgres":
			rows = (await sql`
				SELECT
					table_class.relname AS "tableName",
					index_class.relname AS "indexName",
					index_attribute.attname AS "columnName",
					index_data.indisunique AS "isUnique",
					index_data.indisvalid AS "isValid",
					(index_data.indpred IS NOT NULL) AS "isPartial",
					index_column.ordinality AS "columnPosition"
				FROM pg_class AS table_class
				INNER JOIN pg_namespace AS table_namespace
					ON table_namespace.oid = table_class.relnamespace
				INNER JOIN pg_index AS index_data
					ON index_data.indrelid = table_class.oid
				INNER JOIN pg_class AS index_class
					ON index_class.oid = index_data.indexrelid
				INNER JOIN LATERAL unnest(index_data.indkey)
					WITH ORDINALITY AS index_column(attribute_number, ordinality)
					ON TRUE
				LEFT JOIN pg_attribute AS index_attribute
					ON index_attribute.attrelid = table_class.oid
					AND index_attribute.attnum = index_column.attribute_number
				WHERE table_namespace.nspname = ${target.schema}
					AND table_class.relkind = 'r'
					AND index_column.ordinality <= index_data.indnkeyatts
			`.execute(db)).rows;
			break;
		case "mysql":
			rows = (await sql`
				SELECT
					table_name AS tableName,
					index_name AS indexName,
					column_name AS columnName,
					non_unique AS nonUnique,
					seq_in_index AS columnPosition,
					sub_part AS prefixLength,
					COALESCE(LOWER(comment) = 'disabled', FALSE) AS isDisabled
				FROM information_schema.statistics
				WHERE table_schema = DATABASE()
			`.execute(db)).rows;
			break;
		case "mssql": rows = (await sql`
				SELECT
					tables.name AS "tableName",
					indexes.name AS "indexName",
					columns.name AS "columnName",
					indexes.is_unique AS "isUnique",
					indexes.is_disabled AS "isDisabled",
					indexes.is_hypothetical AS "isHypothetical",
					indexes.has_filter AS "isPartial",
					index_columns.key_ordinal AS "columnPosition"
				FROM sys.indexes AS indexes
				INNER JOIN sys.tables AS tables
					ON indexes.object_id = tables.object_id
				INNER JOIN sys.schemas AS table_schemas
					ON table_schemas.schema_id = tables.schema_id
				INNER JOIN sys.index_columns AS index_columns
					ON index_columns.object_id = indexes.object_id
					AND index_columns.index_id = indexes.index_id
				INNER JOIN sys.columns AS columns
					ON columns.object_id = index_columns.object_id
					AND columns.column_id = index_columns.column_id
				WHERE table_schemas.name = ${target.schema}
					AND indexes.name IS NOT NULL
					AND index_columns.key_ordinal > 0
			`.execute(db)).rows;
	}
	const indexMetadata = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const table = row.tableName ?? row.table_name ?? row.TABLE_NAME ?? row.tablename ?? row.tbl_name;
		const name = row.indexName ?? row.index_name ?? row.INDEX_NAME ?? row.name;
		const column = row.columnName ?? row.column_name ?? row.COLUMN_NAME;
		if (!table || !name) continue;
		const key = createDatabaseIndexKey(table, name);
		const nonUnique = row.nonUnique ?? row.non_unique ?? row.NON_UNIQUE;
		const unique = nonUnique === void 0 ? databaseValueIsTrue(row.isUnique ?? row.is_unique) : !databaseValueIsTrue(nonUnique);
		const position = Number(row.columnPosition ?? row.column_position ?? row.keyOrdinal ?? row.key_ordinal ?? row.ordinality ?? row.seqInIndex ?? row.seq_in_index ?? row.SEQ_IN_INDEX ?? row.seqno ?? 0);
		const indexColumn = {
			fullLength: column !== void 0 && column !== null && (row.prefixLength === void 0 || row.prefixLength === null),
			name: column ?? null,
			position
		};
		const partial = databaseValueIsTrue(row.isPartial);
		const valid = !databaseValueIsTrue(row.isDisabled) && !databaseValueIsTrue(row.isHypothetical) && (row.isValid === void 0 || databaseValueIsTrue(row.isValid));
		const existing = indexMetadata.get(key);
		indexMetadata.set(key, existing ? {
			...existing,
			columns: [...existing.columns, indexColumn],
			partial: existing.partial || partial,
			valid: existing.valid && valid
		} : {
			columns: [indexColumn],
			name,
			partial,
			table,
			unique,
			valid
		});
	}
	return toDatabaseIndexMap([...indexMetadata.values()]);
}
async function getDatabaseColumnBounds(db, target) {
	let rows;
	switch (target.type) {
		case "postgres":
		case "sqlite": return /* @__PURE__ */ new Map();
		case "mysql":
			rows = (await sql`
				SELECT
					table_name AS tableName,
					column_name AS columnName,
					character_octet_length AS maxIndexBytes
				FROM information_schema.columns
				WHERE table_schema = DATABASE()
			`.execute(db)).rows;
			break;
		case "mssql": rows = (await sql`
				SELECT
					tables.name AS "tableName",
					columns.name AS "columnName",
					columns.max_length AS "maxIndexBytes"
				FROM sys.columns AS columns
				INNER JOIN sys.tables AS tables
					ON tables.object_id = columns.object_id
				INNER JOIN sys.schemas AS table_schemas
					ON table_schemas.schema_id = tables.schema_id
				WHERE table_schemas.name = ${target.schema}
			`.execute(db)).rows;
	}
	const bounds = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const table = row.tableName ?? row.TABLE_NAME;
		const column = row.columnName ?? row.COLUMN_NAME;
		if (!table || !column) continue;
		const maxIndexBytes = Number(row.maxIndexBytes ?? row.MAX_INDEX_BYTES ?? -1);
		bounds.set(createDatabaseColumnKey(table, column), { maxIndexBytes: maxIndexBytes < 0 ? null : maxIndexBytes });
	}
	return bounds;
}
function assertExistingTableIndexFits({ columnBounds, dbType, existingColumns, fields, indexes, index, table }) {
	const byteBudget = dbType === "mysql" ? 3072 : 1700;
	let requiredBytes = 0;
	for (const column of index.columns) {
		const field = fields[column];
		if (!field) continue;
		if (field.type === "string" || Array.isArray(field.type)) {
			if (!existingColumns.has(column)) {
				const generatedLength = getDatabaseIndexStringLength({
					columnName: column,
					dialect: dbType,
					fields,
					indexes
				});
				requiredBytes += (generatedLength ?? 0) * (dbType === "mysql" ? 4 : 1);
				continue;
			}
			const bound = columnBounds.get(createDatabaseColumnKey(table, column));
			if (!bound?.maxIndexBytes) throw new BetterAuthError(`Cannot create database index "${index.name}" on existing table "${table}" because column "${column}" is not bounded for ${dbType === "mysql" ? "MySQL" : "SQL Server"}. Change it to a bounded string column, resolve oversized values, then run the migration again.`);
			requiredBytes += bound.maxIndexBytes;
		} else requiredBytes += 16;
	}
	if (requiredBytes > byteBudget) throw new BetterAuthError(`Cannot create database index "${index.name}" on existing table "${table}" because its columns can exceed ${dbType === "mysql" ? "MySQL" : "SQL Server"}'s ${byteBudget}-byte index-key limit. Bound the indexed string columns to the generated schema lengths, resolve oversized values, then run the migration again.`);
}
/**
* Thrown when {@link getMigrations} refuses to add a required column with no
* default value to a populated table. Distinct from the plain
* {@link BetterAuthError} thrown for index-definition conflicts, so callers
* can tell the two apart without matching on message text.
*/
var UnsafeMigrationError = class extends BetterAuthError {};
function hasTimestampColumnDefault(field, dbType) {
	return field.type === "date" && typeof field.defaultValue === "function" && (dbType === "postgres" || dbType === "mysql" || dbType === "mssql");
}
function hasStaticColumnDefault(field) {
	return !(field.unique && field.required === false) && (field.type === "string" || field.type === "number" || field.type === "boolean") && field.defaultValue !== void 0 && field.defaultValue !== null && typeof field.defaultValue !== "function";
}
async function tableHasRows(db, dbType, table) {
	const probe = db.selectFrom(table).select(sql`1`.as("present"));
	return (await (dbType === "mssql" ? probe.top(1) : probe.limit(1)).execute()).length > 0;
}
function matchType(columnDataType, fieldType, dbType) {
	function normalize(type) {
		return type.toLowerCase().split("(")[0].trim();
	}
	if (fieldType === "string[]" || fieldType === "number[]") return columnDataType.toLowerCase().includes("json");
	const types = map[dbType];
	return (Array.isArray(fieldType) ? types["string"].map((t) => t.toLowerCase()) : types[fieldType].map((t) => t.toLowerCase())).includes(normalize(columnDataType));
}
/**
* Build the migration plan that `auth migrate` executes and `auth generate`
* prints for the Kysely adapter.
*
* Adding a required column without a default to a populated table is refused:
* existing rows have no value to backfill. `throwOnUnsafe` picks how that
* refusal is delivered: executing callers get an {@link UnsafeMigrationError},
* read-only callers get the plan plus the same message in `unsafeChanges`.
*
* @throws {UnsafeMigrationError} when a required column cannot be migrated
* safely and `throwOnUnsafe` is left on.
* @throws {BetterAuthError} when an index definition conflicts with an
* existing or already-planned index.
*/
async function getMigrations(config, { throwOnUnsafe = true } = {}) {
	const betterAuthSchema = getSchema(config);
	const authTables = getAuthTables(config);
	const logger = createLogger(config.logger);
	const unsafeChanges = [];
	const reportUnsafeChange = (message) => {
		if (throwOnUnsafe) throw new UnsafeMigrationError(message);
		unsafeChanges.push(message);
	};
	let { kysely: db, databaseType: dbType, introspectIndexes, schemaName } = await createKyselyAdapter(config);
	if (!dbType) {
		logger.warn("Could not determine database type, defaulting to sqlite. Please provide a type in the database options to avoid this.");
		dbType = "sqlite";
	}
	if (!db) {
		logger.error("Only kysely adapter is supported for migrations. You can use `generate` command to generate the schema, if you're using a different adapter.");
		process.exit(1);
	}
	const allTableMetadata = await db.introspection.getTables();
	let target;
	let tableMetadata = allTableMetadata;
	switch (dbType) {
		case "postgres": {
			const schema = schemaName ?? await getPostgresSchema(db);
			target = {
				type: "postgres",
				schema
			};
			logger.debug(`PostgreSQL migration: Using schema '${schema}' (${schemaName ? "from database.schemaName" : "from search_path"})`);
			try {
				if (!(await db.introspection.getSchemas()).some(({ name }) => name === schema)) if (schemaName) logger.debug(`Schema '${schema}' does not exist yet. The migration creates it before creating tables.`);
				else logger.warn(`Schema '${schema}' does not exist. Create it before running migrations or check your database configuration.`);
			} catch (error) {
				logger.debug(`Could not verify schema existence: ${error instanceof Error ? error.message : String(error)}`);
			}
			/**
			* Kysely 0.28 does not expose `isForeign`, while 0.29 adds foreign table metadata.
			* @see https://github.com/kysely-org/kysely/pull/1494
			*/
			tableMetadata = allTableMetadata.filter((table) => table.schema === schema && !table.isView && !("isForeign" in table && table.isForeign));
			logger.debug(`Found ${tableMetadata.length} table(s) in schema '${schema}': ${tableMetadata.map((table) => table.name).join(", ") || "(none)"}`);
			break;
		}
		case "mssql": {
			const schema = await getMssqlSchema(db);
			target = {
				type: "mssql",
				schema
			};
			logger.debug(`SQL Server migration: Using schema '${schema}' (from the current user's default schema)`);
			tableMetadata = allTableMetadata.filter((table) => table.schema === schema);
			break;
		}
		case "mysql":
			target = { type: "mysql" };
			break;
		case "sqlite": target = { type: "sqlite" };
	}
	const databaseIndexMap = await getDatabaseIndexMap(db, target, allTableMetadata.map((table) => table.name), introspectIndexes);
	const databaseColumnBounds = await getDatabaseColumnBounds(db, target);
	const schemaProblems = diffSchema(toPhysicalSchema(db, betterAuthSchema), toIntrospectedTables(tableMetadata)).filter((finding) => finding.kind === "unexpected-required-column").map((finding) => formatSchemaFinding(finding, "database"));
	const toBeCreated = [];
	const toBeAdded = [];
	const toBeAddedIndexes = [];
	const plannedIndexes = /* @__PURE__ */ new Map();
	for (const [key, value] of Object.entries(betterAuthSchema)) {
		if (value.disableMigrations) continue;
		const table = tableMetadata.find((table) => table.name === key);
		for (const index of value.indexes ?? []) {
			const name = index.name;
			const indexKey = createDatabaseIndexKey(key, name);
			const existingIndex = databaseIndexMap.get(indexKey);
			if (existingIndex) {
				if (!databaseIndexMatches(existingIndex, index)) throw new BetterAuthError(`Database index "${name}" on table "${key}" does not match the configured fields and uniqueness. Rename or replace the existing index, then run the migration again.`);
				continue;
			}
			if (dbType === "sqlite" || dbType === "postgres") {
				const indexOnAnotherTable = [...databaseIndexMap.values()].find((databaseIndex) => getPortableDatabaseIdentifierKey(databaseIndex.name) === getPortableDatabaseIdentifierKey(name) && getPortableDatabaseIdentifierKey(databaseIndex.table) !== getPortableDatabaseIdentifierKey(key));
				if (indexOnAnotherTable) throw new BetterAuthError(`Database index name "${name}" is already used by table "${indexOnAnotherTable.table}". Index names must be unique across the schema.`);
			}
			const plannedIndex = plannedIndexes.get(indexKey);
			if (plannedIndex) {
				if (!databaseIndexMatches({
					columns: plannedIndex.columns,
					name: plannedIndex.name,
					table: key,
					unique: plannedIndex.unique ?? false,
					validFullColumns: true
				}, index)) throw new BetterAuthError(`Database index name "${name}" identifies more than one index on table "${key}".`);
				continue;
			}
			if (table && (dbType === "mysql" || dbType === "mssql")) assertExistingTableIndexFits({
				columnBounds: databaseColumnBounds,
				dbType,
				existingColumns: new Set(table.columns.map((column) => column.name)),
				fields: value.fields,
				index,
				indexes: value.indexes ?? [],
				table: key
			});
			plannedIndexes.set(indexKey, index);
			toBeAddedIndexes.push({
				table: key,
				index,
				name
			});
		}
		if (!table) {
			const tIndex = toBeCreated.findIndex((t) => t.table === key);
			const tableData = {
				table: key,
				fields: value.fields,
				order: value.order || Infinity
			};
			const insertIndex = toBeCreated.findIndex((t) => (t.order || Infinity) > tableData.order);
			if (insertIndex === -1) if (tIndex === -1) toBeCreated.push(tableData);
			else toBeCreated[tIndex].fields = {
				...toBeCreated[tIndex].fields,
				...value.fields
			};
			else toBeCreated.splice(insertIndex, 0, tableData);
			continue;
		}
		const toBeAddedFields = {};
		for (const [fieldName, field] of Object.entries(value.fields)) {
			const column = table.columns.find((c) => c.name === fieldName);
			if (!column) {
				toBeAddedFields[fieldName] = field;
				continue;
			}
			if (field.required !== false && column.isNullable) logger.warn(`Column "${fieldName}" on table "${key}" stays nullable while the schema declares the field required, so existing rows can still hold null. Backfill every row for this column and enforce NOT NULL to remove the drift.`);
			if (matchType(column.dataType, field.type, dbType)) continue;
			else logger.warn(`Field ${fieldName} in table ${key} has a different type in the database. Expected ${field.type} but got ${column.dataType}.`);
		}
		if (Object.keys(toBeAddedFields).length > 0) toBeAdded.push({
			table: key,
			fields: toBeAddedFields,
			order: value.order || Infinity
		});
	}
	const migrations = [];
	if (schemaName && toBeCreated.length > 0) migrations.push(db.schema.createSchema(schemaName).ifNotExists());
	const useUUIDs = config.advanced?.database?.generateId === "uuid";
	const useNumberId = config.advanced?.database?.generateId === "serial";
	function getType(field, fieldName, tableIndexStringLength) {
		const type = field.type;
		const provider = dbType || "sqlite";
		const typeMap = {
			string: {
				sqlite: "text",
				postgres: "text",
				mysql: tableIndexStringLength ? `varchar(${tableIndexStringLength})` : field.unique ? "varchar(255)" : field.references ? "varchar(36)" : field.sortable ? "varchar(255)" : field.index ? "varchar(255)" : "text",
				mssql: tableIndexStringLength ? `varchar(${tableIndexStringLength})` : field.unique || field.sortable ? "varchar(255)" : field.references ? "varchar(36)" : "varchar(8000)"
			},
			boolean: {
				sqlite: "integer",
				postgres: "boolean",
				mysql: "boolean",
				mssql: "smallint"
			},
			number: {
				sqlite: field.bigint ? "bigint" : "integer",
				postgres: field.bigint ? "bigint" : "integer",
				mysql: field.bigint ? "bigint" : "integer",
				mssql: field.bigint ? "bigint" : "integer"
			},
			date: {
				sqlite: "date",
				postgres: "timestamptz",
				mysql: "timestamp(3)",
				mssql: sql`datetime2(3)`
			},
			json: {
				sqlite: "text",
				postgres: "jsonb",
				mysql: "json",
				mssql: "varchar(8000)"
			},
			id: {
				postgres: useNumberId ? sql`integer GENERATED BY DEFAULT AS IDENTITY` : useUUIDs ? "uuid" : "text",
				mysql: useNumberId ? "integer" : useUUIDs ? "varchar(36)" : "varchar(36)",
				mssql: useNumberId ? "integer" : useUUIDs ? "varchar(36)" : "varchar(36)",
				sqlite: useNumberId ? "integer" : "text"
			},
			foreignKeyId: {
				postgres: useNumberId ? "integer" : useUUIDs ? "uuid" : "text",
				mysql: useNumberId ? "integer" : useUUIDs ? "varchar(36)" : "varchar(36)",
				mssql: useNumberId ? "integer" : useUUIDs ? "varchar(36)" : "varchar(36)",
				sqlite: useNumberId ? "integer" : "text"
			},
			"string[]": {
				sqlite: "text",
				postgres: "jsonb",
				mysql: "json",
				mssql: "varchar(8000)"
			},
			"number[]": {
				sqlite: "text",
				postgres: "jsonb",
				mysql: "json",
				mssql: "varchar(8000)"
			}
		};
		if (fieldName === "id" || field.references?.field === "id") {
			if (fieldName === "id") return typeMap.id[provider];
			return typeMap.foreignKeyId[provider];
		}
		if (Array.isArray(type)) return "text";
		if (!(type in typeMap)) throw new Error(`Unsupported field type '${String(type)}' for field '${fieldName}'. Allowed types are: string, number, boolean, date, string[], number[]. If you need to store structured data, store it as a JSON string (type: "string") or split it into primitive fields. See https://better-auth.com/docs/advanced/schema#additional-fields`);
		return typeMap[type][provider];
	}
	const getModelName = initGetModelName({
		schema: authTables,
		usePlural: false
	});
	const getFieldName = initGetFieldName({
		schema: authTables,
		usePlural: false
	});
	function getReferencePath(model, field) {
		try {
			return `${getModelName(model)}.${getFieldName({
				model,
				field
			})}`;
		} catch {
			return `${model}.${field}`;
		}
	}
	const deferredIndexes = [];
	const getTableIndexStringLength = (tableName, fieldName) => {
		if (dbType !== "mysql" && dbType !== "mssql") return void 0;
		const table = betterAuthSchema[tableName];
		if (!table) return void 0;
		return getDatabaseIndexStringLength({
			columnName: fieldName,
			dialect: dbType,
			fields: table.fields,
			indexes: table.indexes ?? []
		});
	};
	if (toBeAdded.length) {
		const populatedTables = /* @__PURE__ */ new Map();
		for (const table of toBeAdded) for (const [fieldName, field] of Object.entries(table.fields)) {
			const timestampDefault = hasTimestampColumnDefault(field, dbType);
			const staticDefault = hasStaticColumnDefault(field);
			if (field.required !== false && !timestampDefault && !staticDefault) {
				let populated = populatedTables.get(table.table);
				if (populated === void 0) {
					populated = await tableHasRows(db, dbType, table.table);
					populatedTables.set(table.table, populated);
				}
				if (populated) {
					const textDetail = field.type === "string" ? " For a text column, every existing row ends up with the same empty string." : "";
					reportUnsafeChange(`Cannot add required column "${fieldName}" to populated table "${table.table}": the schema declares no default value, so existing rows have no value to backfill. MySQL accepts this statement instead of rejecting it and fills every existing row with an implicit default for the column type, reporting a successful migration over corrupted data.${textDetail} Add the column as nullable, backfill a correct value for every row, then make it NOT NULL.`);
				}
			}
			const type = getType(field, fieldName, getTableIndexStringLength(table.table, fieldName));
			const builder = db.schema.alterTable(table.table);
			if (field.index || field.unique) {
				const indexName = getDatabaseFieldIndexName(table.table, fieldName, field.unique ?? false);
				let indexBuilder = db.schema.createIndex(indexName).on(table.table).columns([fieldName]);
				if (field.unique) {
					indexBuilder = indexBuilder.unique();
					if (field.required === false && dbType === "mssql") indexBuilder = indexBuilder.where(fieldName, "is not", null);
					if (field.required !== false && field.defaultValue !== void 0 && field.defaultValue !== null && typeof field.defaultValue !== "function") logger.warn(`Adding unique column "${fieldName}" to existing table "${table.table}" backfills every existing row with its default value. If the table has more than one row, creating the unique index "${indexName}" will fail; backfill distinct values manually, then re-run the migration or create the index yourself.`);
				}
				deferredIndexes.push(indexBuilder);
			}
			const built = builder.addColumn(fieldName, type, (col) => {
				col = field.required !== false ? col.notNull() : col;
				if (field.references) col = col.references(getReferencePath(field.references.model, field.references.field)).onDelete(field.references.onDelete || "cascade");
				if (timestampDefault) if (dbType === "mysql") col = col.defaultTo(sql`CURRENT_TIMESTAMP(3)`);
				else col = col.defaultTo(sql`CURRENT_TIMESTAMP`);
				else if (staticDefault) col = col.defaultTo(typeof field.defaultValue === "boolean" && (dbType === "sqlite" || dbType === "mssql") ? field.defaultValue ? 1 : 0 : field.defaultValue);
				return col;
			});
			migrations.push(built);
		}
	}
	if (toBeCreated.length) for (const table of toBeCreated) {
		const idType = getType({ type: useNumberId ? "number" : "string" }, "id");
		let dbT = db.schema.createTable(table.table).addColumn("id", idType, (col) => {
			if (useNumberId) {
				if (dbType === "postgres") return col.primaryKey().notNull();
				else if (dbType === "sqlite") return col.primaryKey().notNull();
				else if (dbType === "mssql") return col.identity().primaryKey().notNull();
				return col.autoIncrement().primaryKey().notNull();
			}
			if (useUUIDs) {
				if (dbType === "postgres") return col.primaryKey().defaultTo(sql`pg_catalog.gen_random_uuid()`).notNull();
				return col.primaryKey().notNull();
			}
			return col.primaryKey().notNull();
		});
		for (const [fieldName, field] of Object.entries(table.fields)) {
			const type = getType(field, fieldName, getTableIndexStringLength(table.table, fieldName));
			dbT = dbT.addColumn(fieldName, type, (col) => {
				col = field.required !== false ? col.notNull() : col;
				if (field.references) col = col.references(getReferencePath(field.references.model, field.references.field)).onDelete(field.references.onDelete || "cascade");
				if (field.unique) col = col.unique();
				if (field.type === "date" && typeof field.defaultValue === "function" && (dbType === "postgres" || dbType === "mysql" || dbType === "mssql")) if (dbType === "mysql") col = col.defaultTo(sql`CURRENT_TIMESTAMP(3)`);
				else col = col.defaultTo(sql`CURRENT_TIMESTAMP`);
				return col;
			});
			if (field.index && !field.unique) {
				const builder = db.schema.createIndex(getDatabaseFieldIndexName(table.table, fieldName, false)).on(table.table).columns([fieldName]);
				deferredIndexes.push(builder);
			}
		}
		migrations.push(dbT);
	}
	for (const { table, index, name } of toBeAddedIndexes) {
		let builder = db.schema.createIndex(name).on(table).columns([...index.columns]);
		if (index.unique) builder = builder.unique();
		deferredIndexes.push(builder);
	}
	for (const index of deferredIndexes) migrations.push(index);
	async function runMigrations() {
		try {
			for (const migration of migrations) await migration.execute();
		} finally {
			if (migrations.length && config.database) invalidateSchemaChecks(config.database);
		}
	}
	async function compileMigrations() {
		return migrations.map((m) => m.compile().sql).join(";\n\n") + ";";
	}
	return {
		toBeCreated,
		toBeAdded,
		toBeAddedIndexes,
		unsafeChanges,
		schemaProblems,
		runMigrations,
		compileMigrations
	};
}
var DEFAULT_SECRET = "better-auth-secret-12345678901234567890";
/**
* Estimates the entropy of a string in bits.
* This is a simple approximation that helps detect low-entropy secrets.
*/
function estimateEntropy$1(str) {
	const unique = new Set(str).size;
	if (unique === 0) return 0;
	return Math.log2(Math.pow(unique, str.length));
}
function parseSecretsEnv(envValue) {
	if (!envValue) return null;
	return envValue.split(",").map((entry) => {
		entry = entry.trim();
		const colonIdx = entry.indexOf(":");
		if (colonIdx === -1) throw new BetterAuthError(`Invalid BETTER_AUTH_SECRETS entry: "${entry}". Expected format: "<version>:<secret>"`);
		const version = parseInt(entry.slice(0, colonIdx), 10);
		if (!Number.isInteger(version) || version < 0) throw new BetterAuthError(`Invalid version in BETTER_AUTH_SECRETS: "${entry.slice(0, colonIdx)}". Version must be a non-negative integer.`);
		const value = entry.slice(colonIdx + 1).trim();
		if (!value) throw new BetterAuthError(`Empty secret value for version ${version} in BETTER_AUTH_SECRETS.`);
		return {
			version,
			value
		};
	});
}
function validateSecretsArray(secrets, logger) {
	if (secrets.length === 0) throw new BetterAuthError("`secrets` array must contain at least one entry.");
	const seen = /* @__PURE__ */ new Set();
	for (const s of secrets) {
		const version = parseInt(String(s.version), 10);
		if (!Number.isInteger(version) || version < 0 || String(version) !== String(s.version).trim()) throw new BetterAuthError(`Invalid version ${s.version} in \`secrets\`. Version must be a non-negative integer.`);
		if (!s.value) throw new BetterAuthError(`Empty secret value for version ${version} in \`secrets\`.`);
		if (seen.has(version)) throw new BetterAuthError(`Duplicate version ${version} in \`secrets\`. Each version must be unique.`);
		seen.add(version);
	}
	const current = secrets[0];
	if (current.value.length < 32) logger.warn(`[better-auth] Warning: the current secret (version ${current.version}) should be at least 32 characters long for adequate security.`);
	if (estimateEntropy$1(current.value) < 120) logger.warn("[better-auth] Warning: the current secret appears low-entropy. Use a randomly generated secret for production.");
}
function buildSecretConfig(secrets, legacySecret) {
	const keys = /* @__PURE__ */ new Map();
	for (const s of secrets) keys.set(parseInt(String(s.version), 10), s.value);
	return {
		keys,
		currentVersion: parseInt(String(secrets[0].version), 10),
		legacySecret: legacySecret && legacySecret !== "better-auth-secret-12345678901234567890" ? legacySecret : void 0
	};
}
/**
* Estimates the entropy of a string in bits.
* This is a simple approximation that helps detect low-entropy secrets.
*/
function estimateEntropy(str) {
	const unique = new Set(str).size;
	if (unique === 0) return 0;
	return Math.log2(Math.pow(unique, str.length));
}
/**
* Validates that the secret meets minimum security requirements.
* Throws BetterAuthError if the secret is invalid.
* Skips validation for DEFAULT_SECRET in test environments only.
* Only throws for DEFAULT_SECRET in production environment.
*/
function validateSecret(secret, logger) {
	const isDefaultSecret = secret === DEFAULT_SECRET;
	if (isTest()) return;
	if (isDefaultSecret && isProduction) throw new BetterAuthError("You are using the default secret. Please set `BETTER_AUTH_SECRET` in your environment variables or pass `secret` in your auth config.");
	if (!secret) throw new BetterAuthError("BETTER_AUTH_SECRET is missing. Set it in your environment or pass `secret` to betterAuth({ secret }).");
	if (secret.length < 32) logger.warn(`[better-auth] Warning: your BETTER_AUTH_SECRET should be at least 32 characters long for adequate security. Generate one with \`npx auth secret\` or \`openssl rand -base64 32\`.`);
	if (estimateEntropy(secret) < 120) logger.warn("[better-auth] Warning: your BETTER_AUTH_SECRET appears low-entropy. Use a randomly generated secret for production.");
}
async function createAuthContext(adapter, options, getDatabaseType) {
	const isStateful = hasServerSessionStore(options);
	if (!isStateful) options = defu(options, { session: { cookieCache: {
		enabled: true,
		strategy: "jwe",
		refreshCache: true,
		maxAge: options.session?.expiresIn || 604800
	} } });
	if (!options.database) options = defu(options, { account: { storeAccountCookie: true } });
	const plugins = options.plugins || [];
	const internalPlugins = getInternalPlugins(options);
	const logger = createLogger(options.logger);
	const isDynamicConfig = isDynamicBaseURLConfig(options.baseURL);
	if (isDynamicBaseURLConfig(options.baseURL)) {
		const { allowedHosts } = options.baseURL;
		if (!allowedHosts || allowedHosts.length === 0) throw new BetterAuthError("baseURL.allowedHosts cannot be empty. Provide at least one allowed host pattern (e.g., [\"myapp.com\", \"*.vercel.app\"]).");
	}
	const baseURL = isDynamicConfig ? void 0 : getBaseURL(typeof options.baseURL === "string" ? options.baseURL : void 0, options.basePath);
	if (!baseURL && !isDynamicConfig) logger.warn(`[better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.`);
	if (adapter.id === "memory" && options.advanced?.database?.generateId === false) logger.error(`[better-auth] Misconfiguration detected.
You are using the memory DB with generateId: false.
This will cause no id to be generated for any model.
Most of the features of Better Auth will not work correctly.`);
	const secretsArray = options.secrets ?? parseSecretsEnv(env.BETTER_AUTH_SECRETS);
	const legacySecret = options.secret || env.BETTER_AUTH_SECRET || env.AUTH_SECRET || "";
	let secret;
	let secretConfig;
	if (secretsArray) {
		validateSecretsArray(secretsArray, logger);
		secret = secretsArray[0].value;
		secretConfig = buildSecretConfig(secretsArray, legacySecret);
	} else {
		secret = legacySecret || "better-auth-secret-12345678901234567890";
		validateSecret(secret, logger);
		secretConfig = secret;
	}
	options = {
		...options,
		secret,
		baseURL: isDynamicConfig ? options.baseURL : baseURL ? new URL(baseURL).origin : "",
		basePath: options.basePath || "/api/auth",
		plugins: plugins.concat(internalPlugins)
	};
	checkEndpointConflicts(options, logger);
	const trustedProxies = options.advanced?.ipAddress?.trustedProxies;
	if (trustedProxies && trustedProxies.length > 0) {
		const invalid = findInvalidTrustedProxies(trustedProxies);
		if (invalid.length > 0) logger.warn(`Ignoring invalid \`advanced.ipAddress.trustedProxies\` entries: ${invalid.join(", ")}. Each entry must be an IP address or CIDR range.`);
	}
	const cookies = getCookies(options);
	const tables = getAuthTables(options);
	const providers = (await Promise.all(Object.entries(options.socialProviders || {}).map(async ([key, originalConfig]) => {
		const config = typeof originalConfig === "function" ? await originalConfig() : originalConfig;
		if (config == null) return null;
		if (config.enabled === false) return null;
		if (!config.clientId) logger.warn(`Social provider ${key} is missing clientId or clientSecret`);
		const provider = socialProviders[key](config);
		provider.disableImplicitSignUp = config.disableImplicitSignUp;
		return provider;
	}))).filter((x) => x !== null);
	const generateIdFunc = ({ model, size }) => {
		if (typeof options.advanced?.generateId === "function") return options.advanced.generateId({
			model,
			size
		});
		const dbGenerateId = options?.advanced?.database?.generateId;
		if (typeof dbGenerateId === "function") return dbGenerateId({
			model,
			size
		});
		if (dbGenerateId === "uuid") return crypto.randomUUID();
		if (dbGenerateId === "serial" || dbGenerateId === false) return false;
		return generateId(size);
	};
	const { publish } = await createTelemetry(options, {
		adapter: adapter.id,
		database: typeof options.database === "function" ? "adapter" : getDatabaseType(options.database)
	});
	const pluginIds = new Set(options.plugins.map((p) => p.id));
	const getPluginFn = (id) => options.plugins.find((p) => p.id === id) ?? null;
	const hasPluginFn = (id) => pluginIds.has(id);
	const trustedOrigins = await getTrustedOrigins(options);
	const trustedProviders = await getTrustedProviders(options);
	const ctx = {
		appName: options.appName || "Better Auth",
		baseURL: baseURL || "",
		version: getBetterAuthVersion(),
		socialProviders: providers,
		options,
		oauthConfig: {
			storeStateStrategy: options.account?.storeStateStrategy || (isStateful ? "database" : "cookie"),
			skipStateCookieCheck: !!options.account?.skipStateCookieCheck
		},
		tables,
		trustedOrigins,
		trustedProviders,
		isTrustedOrigin(url, settings) {
			return this.trustedOrigins.some((origin) => matchesOriginPattern(url, origin, settings));
		},
		sessionConfig: {
			updateAge: options.session?.updateAge !== void 0 ? options.session.updateAge : 86400,
			expiresIn: options.session?.expiresIn || 604800,
			freshAge: options.session?.freshAge === void 0 ? 86400 : options.session.freshAge,
			cookieRefreshCache: (() => {
				const refreshCache = options.session?.cookieCache?.refreshCache;
				const maxAge = options.session?.cookieCache?.maxAge || 300;
				if (isStateful && refreshCache) {
					logger.warn("[better-auth] `session.cookieCache.refreshCache` is enabled while `database` or `secondaryStorage` is configured. `refreshCache` is meant for stateless (DB-less) setups. Disabling `refreshCache` — remove it from your config to silence this warning.");
					return false;
				}
				if (refreshCache === false || refreshCache === void 0) return false;
				if (refreshCache === true) return {
					enabled: true,
					updateAge: Math.floor(maxAge * .2)
				};
				return {
					enabled: true,
					updateAge: refreshCache.updateAge !== void 0 ? refreshCache.updateAge : Math.floor(maxAge * .2)
				};
			})()
		},
		secret,
		secretConfig,
		rateLimit: {
			...options.rateLimit,
			enabled: options.rateLimit?.enabled ?? isProduction,
			window: options.rateLimit?.window || 10,
			max: options.rateLimit?.max || 100,
			storage: options.rateLimit?.storage || (options.secondaryStorage ? "secondary-storage" : "memory")
		},
		authCookies: cookies,
		logger,
		generateId: generateIdFunc,
		session: null,
		secondaryStorage: options.secondaryStorage,
		password: {
			hash: options.emailAndPassword?.password?.hash || hashPassword$1,
			verify: options.emailAndPassword?.password?.verify || verifyPassword$1$1,
			config: {
				minPasswordLength: options.emailAndPassword?.minPasswordLength || 8,
				maxPasswordLength: options.emailAndPassword?.maxPasswordLength || 128
			},
			checkPassword
		},
		setNewSession(session) {
			this.newSession = session;
		},
		newSession: null,
		adapter,
		internalAdapter: createInternalAdapter(adapter, {
			options,
			logger,
			hooks: options.databaseHooks ? [{
				source: "user",
				hooks: options.databaseHooks
			}] : [],
			generateId: generateIdFunc
		}),
		createAuthCookie: createCookieGetter(options),
		async runMigrations() {
			throw new BetterAuthError("runMigrations will be set by the specific init implementation");
		},
		publishTelemetry: publish,
		skipCSRFCheck: !!options.advanced?.disableCSRFCheck,
		skipOriginCheck: options.advanced?.disableOriginCheck !== void 0 ? options.advanced.disableOriginCheck : isTest() ? true : false,
		runInBackground: options.advanced?.backgroundTasks?.handler ?? ((p) => {
			p.catch(() => {});
		}),
		async runInBackgroundOrAwait(promise) {
			try {
				if (options.advanced?.backgroundTasks?.handler) {
					if (promise instanceof Promise) options.advanced.backgroundTasks.handler(promise.catch((e) => {
						logger.error("Failed to run background task:", e);
					}));
				} else await promise;
			} catch (e) {
				logger.error("Failed to run background task:", e);
			}
		},
		getPlugin: getPluginFn,
		hasPlugin: hasPluginFn
	};
	const initOrPromise = runPluginInit(ctx);
	if (isPromise(initOrPromise)) await initOrPromise;
	ctx.checkSchema = runtimeSchemaCheckFor(ctx.adapter);
	ctx.explicitSchemaCheck = schemaCheckFor(ctx.adapter);
	return ctx;
}
var init = async (options) => {
	const adapter = await getAdapter(options);
	const getDatabaseType = (database) => getKyselyDatabaseType(database) || "unknown";
	const ctx = await createAuthContext(adapter, options, getDatabaseType);
	ctx.runMigrations = async function() {
		if (!options.database || "updateMany" in options.database) throw new BetterAuthError("Database is not provided or it's an adapter. Migrations are only supported with a database instance.");
		const { runMigrations } = await getMigrations(options);
		await runMigrations();
	};
	return ctx;
};
var createBetterAuth = (options, initFn) => {
	const authContext = initFn(options).then((ctx) => {
		const validateSchema = ctx.options.advanced?.database?.validateSchema;
		if (!ctx.checkSchema && validateSchema !== false) {
			const level = validateSchema === true ? "warn" : "debug";
			ctx.logger[level](`Schema validation is not available for adapter "${ctx.adapter.id}". Skipping schema validation. Database operations will proceed normally.`);
		}
		const pendingSchemaCheck = ctx.checkSchema?.();
		if (pendingSchemaCheck) pendingSchemaCheck.catch((error) => {
			ctx.logger.error(error instanceof SchemaMismatchError ? error.message : "Could not validate the database schema. Check your database connection.");
		});
		return ctx;
	});
	const { api } = getEndpoints(authContext, options);
	const errorCodes = options.plugins?.reduce((acc, plugin) => {
		if (plugin.$ERROR_CODES) return {
			...acc,
			...plugin.$ERROR_CODES
		};
		return acc;
	}, {});
	const handler = async (request) => {
		const ctx = await authContext;
		const basePath = ctx.options.basePath || "/api/auth";
		let handlerCtx;
		if (isDynamicBaseURLConfig(options.baseURL)) handlerCtx = await resolveRequestContext(ctx, request, resolveDynamicTrustedProxyHeaders(ctx.options));
		else {
			handlerCtx = Object.create(Object.getPrototypeOf(ctx), Object.getOwnPropertyDescriptors(ctx));
			let trustOptions = ctx.options;
			if (!ctx.options.baseURL) {
				const baseURL = getBaseURL(void 0, basePath, request, void 0, ctx.options.advanced?.trustedProxyHeaders);
				if (!baseURL) throw new BetterAuthError("Could not get base URL from request. Please provide a valid base URL.");
				handlerCtx.baseURL = baseURL;
				handlerCtx.options = {
					...ctx.options,
					baseURL: getOrigin(baseURL) || void 0
				};
				trustOptions = handlerCtx.options;
			}
			handlerCtx.trustedOrigins = await getTrustedOrigins(trustOptions, request);
			handlerCtx.trustedProviders = await getTrustedProviders(trustOptions, request);
		}
		const { handler } = router(handlerCtx, options);
		return runWithAdapter(handlerCtx.adapter, () => handler(request));
	};
	return {
		handler,
		fetch: handler,
		api,
		options,
		$context: authContext,
		$ERROR_CODES: {
			...errorCodes,
			...BASE_ERROR_CODES
		}
	};
};
/**
* Better Auth initializer for full mode (with Kysely)
*
* @example
* ```ts
* import { betterAuth } from "better-auth";
*
* const auth = betterAuth({
* 	database: new PostgresDialect({ connection: process.env.DATABASE_URL }),
* });
* ```
*
* For minimal mode (without Kysely), import from `better-auth/minimal` instead
* @example
* ```ts
* import { betterAuth } from "better-auth/minimal";
*
* const auth = betterAuth({
*	  database: drizzleAdapter(db, { provider: "pg" }),
* });
*/
var betterAuth = (options) => {
	return createBetterAuth(options, init);
};
var PACKAGE_VERSION = "1.7.7";
var BEARER_SCHEME = "bearer ";
function tryDecode(str) {
	try {
		return decodeURIComponent(str);
	} catch {
		return str;
	}
}
/**
* Converts bearer token to session cookie
*/
var bearer = (options) => {
	return {
		id: "bearer",
		version: PACKAGE_VERSION,
		hooks: {
			before: [{
				matcher(context) {
					return Boolean(context.request?.headers.get("authorization") || context.headers?.get("authorization"));
				},
				handler: createAuthMiddleware(async (c) => {
					const authHeader = c.request?.headers.get("authorization") || c.headers?.get("Authorization");
					if (!authHeader) return;
					if (authHeader.slice(0, 7).toLowerCase() !== BEARER_SCHEME) return;
					const token = authHeader.slice(7).trim();
					if (!token) return;
					let decodedToken;
					if (token.includes(".")) decodedToken = token.includes("%") ? tryDecode(token) : token;
					else {
						if (options?.requireSignature) return;
						decodedToken = tryDecode((await serializeSignedCookie("", token, c.context.secret)).replace("=", ""));
					}
					try {
						if (!await createHMAC("SHA-256", "base64urlnopad").verify(c.context.secret, decodedToken.split(".")[0], decodedToken.split(".")[1])) return;
					} catch {
						return;
					}
					const existingHeaders = c.request?.headers || c.headers;
					const headers = new Headers({ ...Object.fromEntries(existingHeaders?.entries()) });
					setRequestCookie(headers, c.context.authCookies.sessionToken.name, decodedToken);
					return { context: { headers } };
				})
			}],
			after: [{
				matcher(context) {
					return true;
				},
				handler: createAuthMiddleware(async (ctx) => {
					const setCookie = ctx.context.responseHeaders?.get("set-cookie");
					if (!setCookie) return;
					const parsedCookies = parseSetCookieHeader(setCookie);
					const cookieName = ctx.context.authCookies.sessionToken.name;
					const sessionCookie = parsedCookies.get(cookieName);
					if (!sessionCookie || !sessionCookie.value || sessionCookie["max-age"] === 0) return;
					const token = sessionCookie.value;
					const exposedHeaders = ctx.context.responseHeaders?.get("access-control-expose-headers") || "";
					const headersSet = new Set(exposedHeaders.split(",").map((header) => header.trim()).filter(Boolean));
					headersSet.add("set-auth-token");
					ctx.setHeader("set-auth-token", token);
					ctx.setHeader("Access-Control-Expose-Headers", Array.from(headersSet).join(", "));
				})
			}]
		},
		options
	};
};
var EMAIL_OTP_ERROR_CODES = defineErrorCodes({
	OTP_EXPIRED: "OTP expired",
	INVALID_OTP: "Invalid OTP",
	TOO_MANY_ATTEMPTS: "Too many attempts"
});
var getEndpointResponse = async (ctx) => {
	const returned = ctx.context.returned;
	if (!returned) return null;
	if (returned instanceof Response) {
		if (returned.status !== 200) return null;
		return await returned.clone().json();
	}
	if (isAPIError(returned)) return null;
	return returned;
};
function toOTPIdentifier(type, email) {
	return `${type}-otp-${email}`;
}
var defaultKeyHasher$1 = async (otp) => {
	const hash = await createHash("SHA-256").digest(new TextEncoder().encode(otp));
	return base64Url.encode(new Uint8Array(hash), { padding: false });
};
function splitAtLastColon(input) {
	const idx = input.lastIndexOf(":");
	if (idx === -1) return [input, ""];
	return [input.slice(0, idx), input.slice(idx + 1)];
}
async function storeOTP(ctx, opts, otp) {
	if (opts.storeOTP === "encrypted") return await symmetricEncrypt({
		key: ctx.context.secretConfig,
		data: otp
	});
	if (opts.storeOTP === "hashed") return await defaultKeyHasher$1(otp);
	if (typeof opts.storeOTP === "object" && "hash" in opts.storeOTP) return await opts.storeOTP.hash(otp);
	if (typeof opts.storeOTP === "object" && "encrypt" in opts.storeOTP) return await opts.storeOTP.encrypt(otp);
	return otp;
}
async function verifyStoredOTP(ctx, opts, storedOtp, otp) {
	if (opts.storeOTP === "encrypted") return constantTimeEqual(await symmetricDecrypt({
		key: ctx.context.secretConfig,
		data: storedOtp
	}), otp);
	if (opts.storeOTP === "hashed") return constantTimeEqual(await defaultKeyHasher$1(otp), storedOtp);
	if (typeof opts.storeOTP === "object" && "hash" in opts.storeOTP) return constantTimeEqual(await opts.storeOTP.hash(otp), storedOtp);
	if (typeof opts.storeOTP === "object" && "decrypt" in opts.storeOTP) return constantTimeEqual(await opts.storeOTP.decrypt(storedOtp), otp);
	return constantTimeEqual(otp, storedOtp);
}
/**
* Retrieves the plain-text OTP from a stored value.
* Returns `null` if the OTP is hashed and cannot be recovered.
*/
async function retrieveOTP(ctx, opts, storedOtp) {
	if (opts.storeOTP === "plain" || opts.storeOTP === void 0) return storedOtp;
	if (opts.storeOTP === "encrypted") return await symmetricDecrypt({
		key: ctx.context.secretConfig,
		data: storedOtp
	});
	if (typeof opts.storeOTP === "object" && "decrypt" in opts.storeOTP) return await opts.storeOTP.decrypt(storedOtp);
	return null;
}
/**
* Tries to reuse an existing unexpired OTP.
* Returns the plain-text OTP if reusable, `null` otherwise.
*/
async function tryReuseOTP(ctx, opts, identifier) {
	const existing = await ctx.context.internalAdapter.findVerificationValue(identifier);
	if (!existing || existing.expiresAt < /* @__PURE__ */ new Date()) return null;
	const [storedOtpValue, attempts] = splitAtLastColon(existing.value);
	const allowedAttempts = opts.allowedAttempts || 3;
	if (attempts && parseInt(attempts) >= allowedAttempts) return null;
	const plainOtp = await retrieveOTP(ctx, opts, storedOtpValue);
	if (!plainOtp) return null;
	await ctx.context.internalAdapter.updateVerificationByIdentifier(identifier, { expiresAt: getDate(opts.expiresIn, "sec") });
	return plainOtp;
}
var cleanupLockExpiresInMs = 5e3;
var cleanupLockWaitMs = 2e3;
var cleanupLockPollMs = 250;
var cleanupLockIdentifier = (userId) => `revoke-unproven-account-access:${userId}`;
async function waitForCleanupLock(ctx, identifier) {
	const deadline = Date.now() + cleanupLockWaitMs;
	while (Date.now() < deadline) {
		const lock = await ctx.context.internalAdapter.findVerificationValue(identifier);
		if (!lock) return;
		if (lock.expiresAt <= /* @__PURE__ */ new Date()) {
			await ctx.context.internalAdapter.deleteVerificationByIdentifier(identifier);
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, cleanupLockPollMs));
	}
}
/**
* Strip every account link and session a pre-existing account accrued before
* control of its email was proven.
*
* An `emailVerified: false` row carries no proof that linked access belongs
* to the mailbox owner. When an email-primary proof (magic link, email OTP)
* resolves to such a row, deleting accounts and revoking standing sessions
* makes the verified owner inherit no password, OAuth link, or session that
* predates the proof. This helper also flips `emailVerified` after cleanup and
* returns the current user for the caller to use when minting the owner's
* session.
*
* @param userId - The pre-existing, not-yet-verified user being promoted.
*/
async function revokeUnprovenAccountAccess(ctx, userId) {
	const lockIdentifier = cleanupLockIdentifier(userId);
	if (!await ctx.context.internalAdapter.reserveVerificationValue({
		identifier: lockIdentifier,
		value: userId,
		expiresAt: new Date(Date.now() + cleanupLockExpiresInMs)
	}).catch((error) => {
		if (error instanceof BetterAuthError && error.message.includes("requires database-backed verification storage")) return true;
		throw error;
	})) {
		await waitForCleanupLock(ctx, lockIdentifier);
		return ctx.context.internalAdapter.findUserById(userId);
	}
	try {
		const user = await ctx.context.internalAdapter.findUserById(userId);
		if (!user || user.emailVerified) return user;
		const accounts = await ctx.context.internalAdapter.findAccounts(userId);
		for (const account of accounts) await ctx.context.internalAdapter.deleteAccount(account.id);
		await ctx.context.internalAdapter.deleteUserSessions(userId);
		return await ctx.context.internalAdapter.updateUser(userId, { emailVerified: true });
	} finally {
		await ctx.context.internalAdapter.deleteVerificationByIdentifier(lockIdentifier).catch(() => {});
	}
}
var types = [
	"email-verification",
	"sign-in",
	"forget-password",
	"change-email"
];
/**
* Resolves the OTP to send: reuses an existing one if possible,
* otherwise generates and stores a new one.
*
* @internal
*/
async function resolveOTP(ctx, opts, email, type) {
	const identifier = toOTPIdentifier(type, email);
	if (opts.resendStrategy === "reuse") {
		const reused = await tryReuseOTP(ctx, opts, identifier);
		if (reused) return reused;
	}
	const otp = opts.generateOTP({
		email,
		type
	}, ctx) || defaultOTPGenerator$1(opts);
	const storedOTP = await storeOTP(ctx, opts, otp);
	await ctx.context.internalAdapter.createVerificationValue({
		value: `${storedOTP}:0`,
		identifier,
		expiresAt: getDate(opts.expiresIn, "sec")
	}).catch(async () => {
		await ctx.context.internalAdapter.deleteVerificationByIdentifier(identifier);
		await ctx.context.internalAdapter.createVerificationValue({
			value: `${storedOTP}:0`,
			identifier,
			expiresAt: getDate(opts.expiresIn, "sec")
		});
	});
	return otp;
}
var sendVerificationOTPBodySchema = object({
	email: string({}).meta({ description: "Email address to send the OTP" }),
	type: _enum(types).meta({ description: "Type of the OTP" })
});
/**
* ### Endpoint
*
* POST `/email-otp/send-verification-otp`
*
* ### API Methods
*
* **server:**
* `auth.api.sendVerificationOTP`
*
* **client:**
* `authClient.emailOtp.sendVerificationOtp`
*
* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/email-otp#api-method-email-otp-send-verification-otp)
*/
var sendVerificationOTP = (opts) => createAuthEndpoint("/email-otp/send-verification-otp", {
	method: "POST",
	use: [formCsrfMiddleware],
	body: sendVerificationOTPBodySchema,
	metadata: { openapi: {
		operationId: "sendEmailVerificationOTP",
		description: "Send a verification OTP to an email",
		responses: { 200: {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { success: { type: "boolean" } }
			} } }
		} }
	} }
}, async (ctx) => {
	if (!opts?.sendVerificationOTP) {
		ctx.context.logger.error("send email verification is not implemented");
		throw APIError.fromStatus("BAD_REQUEST", { message: "send email verification is not implemented" });
	}
	const email$4 = ctx.body.email.toLowerCase();
	if (!email().safeParse(email$4).success) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_EMAIL);
	if (ctx.body.type === "change-email") {
		ctx.context.logger.error("Use the /email-otp/request-email-change endpoint to send OTP for changing email");
		throw APIError.fromStatus("BAD_REQUEST", { message: "Invalid OTP type" });
	}
	const identifier = toOTPIdentifier(ctx.body.type, email$4);
	const otp = await resolveOTP(ctx, opts, email$4, ctx.body.type);
	const shouldSendOTP = ctx.body.type === "sign-in" && !opts.disableSignUp;
	if (!await ctx.context.internalAdapter.findUserByEmail(email$4) && !shouldSendOTP) {
		await ctx.context.internalAdapter.deleteVerificationByIdentifier(identifier);
		return ctx.json({ success: true });
	}
	await ctx.context.runInBackgroundOrAwait(opts.sendVerificationOTP({
		email: email$4,
		otp,
		type: ctx.body.type
	}, ctx));
	return ctx.json({ success: true });
});
var createVerificationOTPBodySchema = object({
	email: string({}).meta({ description: "Email address to send the OTP" }),
	type: _enum(types).meta({
		required: true,
		description: "Type of the OTP"
	})
});
var createVerificationOTP = (opts) => createAuthEndpoint.serverOnly({
	method: "POST",
	body: createVerificationOTPBodySchema,
	metadata: { openapi: {
		operationId: "createEmailVerificationOTP",
		description: "Create a verification OTP for an email",
		responses: { 200: {
			description: "Success",
			content: { "application/json": { schema: { type: "string" } } }
		} }
	} }
}, async (ctx) => {
	const email = ctx.body.email.toLowerCase();
	const otp = opts.generateOTP({
		email,
		type: ctx.body.type
	}, ctx) || defaultOTPGenerator$1(opts);
	const storedOTP = await storeOTP(ctx, opts, otp);
	await ctx.context.internalAdapter.createVerificationValue({
		value: `${storedOTP}:0`,
		identifier: toOTPIdentifier(ctx.body.type, email),
		expiresAt: getDate(opts.expiresIn, "sec")
	});
	return otp;
});
var getVerificationOTPBodySchema = object({
	email: string({}).meta({ description: "Email address the OTP was sent to" }),
	type: _enum(types).meta({
		required: true,
		description: "Type of the OTP"
	})
});
/**
* ### Endpoint
*
* GET `/email-otp/get-verification-otp`
*
* ### API Methods
*
* **server:**
* `auth.api.getVerificationOTP`
*
* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/email-otp#api-method-email-otp-get-verification-otp)
*/
var getVerificationOTP = (opts) => createAuthEndpoint.serverOnly({
	method: "GET",
	query: getVerificationOTPBodySchema,
	metadata: { openapi: {
		operationId: "getEmailVerificationOTP",
		description: "Get a verification OTP for an email",
		responses: { "200": {
			description: "OTP retrieved successfully or not found/expired",
			content: { "application/json": { schema: {
				type: "object",
				properties: { otp: {
					type: "string",
					nullable: true,
					description: "The stored OTP, or null if not found or expired"
				} },
				required: ["otp"]
			} } }
		} }
	} }
}, async (ctx) => {
	const email = ctx.query.email.toLowerCase();
	const verificationValue = await ctx.context.internalAdapter.findVerificationValue(toOTPIdentifier(ctx.query.type, email));
	if (!verificationValue || verificationValue.expiresAt < /* @__PURE__ */ new Date()) return ctx.json({ otp: null });
	if (opts.storeOTP === "hashed" || typeof opts.storeOTP === "object" && "hash" in opts.storeOTP) throw APIError.fromStatus("BAD_REQUEST", { message: "OTP is hashed, cannot return the plain text OTP" });
	const [storedOtp, _attempts] = splitAtLastColon(verificationValue.value);
	let otp = storedOtp;
	if (opts.storeOTP === "encrypted") otp = await symmetricDecrypt({
		key: ctx.context.secretConfig,
		data: storedOtp
	});
	if (typeof opts.storeOTP === "object" && "decrypt" in opts.storeOTP) otp = await opts.storeOTP.decrypt(storedOtp);
	return ctx.json({ otp });
});
var checkVerificationOTPBodySchema = object({
	email: string().meta({ description: "Email address the OTP was sent to" }),
	type: _enum(types).meta({
		required: true,
		description: "Type of the OTP"
	}),
	otp: string().meta({
		required: true,
		description: "OTP to verify"
	})
});
/**
* ### Endpoint
*
* GET `/email-otp/check-verification-otp`
*
* ### API Methods
*
* **server:**
* `auth.api.checkVerificationOTP`
*
* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/email-otp#api-method-email-otp-check-verification-otp)
*/
var checkVerificationOTP = (opts) => createAuthEndpoint("/email-otp/check-verification-otp", {
	method: "POST",
	body: checkVerificationOTPBodySchema,
	metadata: { openapi: {
		operationId: "verifyEmailWithOTP",
		description: "Verify an email with an OTP",
		responses: { 200: {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { success: { type: "boolean" } }
			} } }
		} }
	} }
}, async (ctx) => {
	const email$3 = ctx.body.email.toLowerCase();
	if (!email().safeParse(email$3).success) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_EMAIL);
	const identifier = toOTPIdentifier(ctx.body.type, email$3);
	const verificationValue = await ctx.context.internalAdapter.findVerificationValue(identifier);
	if (!verificationValue) throw APIError.from("BAD_REQUEST", EMAIL_OTP_ERROR_CODES.INVALID_OTP);
	if (verificationValue.expiresAt < /* @__PURE__ */ new Date()) {
		await ctx.context.internalAdapter.deleteVerificationByIdentifier(identifier);
		throw APIError.from("BAD_REQUEST", EMAIL_OTP_ERROR_CODES.OTP_EXPIRED);
	}
	const [otpValue, attempts] = splitAtLastColon(verificationValue.value);
	const allowedAttempts = opts?.allowedAttempts || 3;
	if (attempts && parseInt(attempts) >= allowedAttempts) {
		await ctx.context.internalAdapter.deleteVerificationByIdentifier(identifier);
		throw APIError.from("FORBIDDEN", EMAIL_OTP_ERROR_CODES.TOO_MANY_ATTEMPTS);
	}
	if (!await verifyStoredOTP(ctx, opts, otpValue, ctx.body.otp)) {
		await ctx.context.internalAdapter.updateVerificationByIdentifier(identifier, { value: `${otpValue}:${parseInt(attempts || "0") + 1}` });
		throw APIError.from("BAD_REQUEST", EMAIL_OTP_ERROR_CODES.INVALID_OTP);
	}
	if (!await ctx.context.internalAdapter.findUserByEmail(email$3))
 /**
	* safe to leak the existence of a user, given the user has already the OTP from the
	* email
	*/
	throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.USER_NOT_FOUND);
	return ctx.json({ success: true });
});
var verifyEmailOTPBodySchema = object({
	email: string({}).meta({ description: "Email address to verify" }),
	otp: string().meta({
		required: true,
		description: "OTP to verify"
	})
});
/**
* ### Endpoint
*
* POST `/email-otp/verify-email`
*
* ### API Methods
*
* **server:**
* `auth.api.verifyEmailOTP`
*
* **client:**
* `authClient.emailOtp.verifyEmail`
*
* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/email-otp#api-method-email-otp-verify-email)
*/
var verifyEmailOTP = (opts) => createAuthEndpoint("/email-otp/verify-email", {
	method: "POST",
	body: verifyEmailOTPBodySchema,
	metadata: { openapi: {
		description: "Verify email with OTP",
		responses: { 200: {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					status: {
						type: "boolean",
						description: "Indicates if the verification was successful",
						enum: [true]
					},
					token: {
						type: "string",
						nullable: true,
						description: "Session token if autoSignInAfterVerification is enabled, otherwise null"
					},
					user: { $ref: "#/components/schemas/User" }
				},
				required: [
					"status",
					"token",
					"user"
				]
			} } }
		} }
	} }
}, async (ctx) => {
	const email$8 = ctx.body.email.toLowerCase();
	if (!email().safeParse(email$8).success) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_EMAIL);
	await atomicVerifyOTP(ctx, opts, toOTPIdentifier("email-verification", email$8), ctx.body.otp);
	const user = await ctx.context.internalAdapter.findUserByEmail(email$8);
	if (!user)
 /**
	* safe to leak the existence of a user, given the user has already the OTP from the
	* email
	*/
	throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.USER_NOT_FOUND);
	if (ctx.context.options.emailVerification?.beforeEmailVerification) await ctx.context.options.emailVerification.beforeEmailVerification(user.user, ctx.request);
	const updatedUser = await ctx.context.internalAdapter.updateUser(user.user.id, {
		email: email$8,
		emailVerified: true
	});
	await ctx.context.options.emailVerification?.afterEmailVerification?.(updatedUser, ctx.request);
	if (ctx.context.options.emailVerification?.autoSignInAfterVerification) {
		const session = await ctx.context.internalAdapter.createSession(updatedUser.id);
		await setSessionCookie(ctx, {
			session,
			user: updatedUser
		});
		return ctx.json({
			status: true,
			token: session.token,
			user: parseUserOutput(ctx.context.options, updatedUser)
		});
	}
	const currentSession = await getSessionFromCtx(ctx);
	if (currentSession && updatedUser.emailVerified && currentSession.user.id === updatedUser.id) {
		const dontRememberMeCookie = await ctx.getSignedCookie(ctx.context.authCookies.dontRememberToken.name, ctx.context.secret);
		await setCookieCache(ctx, {
			session: currentSession.session,
			user: {
				...currentSession.user,
				emailVerified: true
			}
		}, !!dontRememberMeCookie);
	}
	return ctx.json({
		status: true,
		token: null,
		user: parseUserOutput(ctx.context.options, updatedUser)
	});
});
var signInEmailOTPBodySchema = object({
	email: string({}).meta({ description: "Email address to sign in" }),
	otp: string().meta({
		required: true,
		description: "OTP sent to the email"
	}),
	name: string().meta({ description: "User display name. Only used if the user is registering for the first time. Eg: \"my-name\"" }).optional(),
	image: string().meta({ description: "User profile image URL. Only used if the user is registering for the first time." }).optional()
}).and(record(string(), any()));
/**
* ### Endpoint
*
* POST `/sign-in/email-otp`
*
* ### API Methods
*
* **server:**
* `auth.api.signInEmailOTP`
*
* **client:**
* `authClient.signIn.emailOtp`
*
* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/email-otp#api-method-sign-in-email-otp)
*/
var signInEmailOTP = (opts) => createAuthEndpoint("/sign-in/email-otp", {
	method: "POST",
	body: signInEmailOTPBodySchema,
	metadata: { openapi: {
		operationId: "signInWithEmailOTP",
		description: "Sign in with email and OTP",
		responses: { 200: {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					token: {
						type: "string",
						description: "Session token for the authenticated session"
					},
					user: { $ref: "#/components/schemas/User" }
				},
				required: ["token", "user"]
			} } }
		} }
	} }
}, async (ctx) => {
	const { email: rawEmail, otp, name, image, ...rest } = ctx.body;
	const email = rawEmail.toLowerCase();
	await atomicVerifyOTP(ctx, opts, toOTPIdentifier("sign-in", email), otp);
	const user = await ctx.context.internalAdapter.findUserByEmail(email);
	if (!user) {
		if (opts.disableSignUp) throw APIError.from("BAD_REQUEST", EMAIL_OTP_ERROR_CODES.INVALID_OTP);
		const additionalFields = parseUserInput(ctx.context.options, rest, "create");
		const newUser = await ctx.context.internalAdapter.createUser({
			...additionalFields,
			email,
			emailVerified: true,
			name: name || "",
			image
		}, { method: "email-otp" });
		const session = await ctx.context.internalAdapter.createSession(newUser.id);
		await setSessionCookie(ctx, {
			session,
			user: newUser
		});
		return ctx.json({
			token: session.token,
			user: parseUserOutput(ctx.context.options, newUser)
		});
	}
	let verifiedUser = user.user;
	if (!verifiedUser.emailVerified) {
		const promotedUser = await revokeUnprovenAccountAccess(ctx, verifiedUser.id);
		if (!promotedUser) throw APIError.from("BAD_REQUEST", EMAIL_OTP_ERROR_CODES.INVALID_OTP);
		verifiedUser = promotedUser;
	}
	const session = await ctx.context.internalAdapter.createSession(verifiedUser.id);
	await setSessionCookie(ctx, {
		session,
		user: verifiedUser
	});
	return ctx.json({
		token: session.token,
		user: parseUserOutput(ctx.context.options, verifiedUser)
	});
});
var requestPasswordResetEmailOTPBodySchema = object({ email: string().meta({ description: "Email address to send the OTP" }) });
/**
* ### Endpoint
*
* POST `/email-otp/request-password-reset`
*
* ### API Methods
*
* **server:**
* `auth.api.requestPasswordResetEmailOTP`
*
* **client:**
* `authClient.emailOtp.requestPasswordReset`
*
* @see [Read our docs to learn more.](https://www.better-auth.com/docs/plugins/email-otp#reset-password-with-otp)
*/
var requestPasswordResetEmailOTP = (opts) => createAuthEndpoint("/email-otp/request-password-reset", {
	method: "POST",
	body: requestPasswordResetEmailOTPBodySchema,
	metadata: { openapi: {
		operationId: "requestPasswordResetWithEmailOTP",
		description: "Request password reset with email and OTP",
		responses: { 200: {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { success: {
					type: "boolean",
					description: "Indicates if the OTP was sent successfully"
				} }
			} } }
		} }
	} }
}, async (ctx) => {
	const email = ctx.body.email.toLowerCase();
	const identifier = toOTPIdentifier("forget-password", email);
	const otp = await resolveOTP(ctx, opts, email, "forget-password");
	if (!await ctx.context.internalAdapter.findUserByEmail(email)) {
		await ctx.context.internalAdapter.deleteVerificationByIdentifier(identifier);
		return ctx.json({ success: true });
	}
	await ctx.context.runInBackgroundOrAwait(opts.sendVerificationOTP({
		email,
		otp,
		type: "forget-password"
	}, ctx));
	return ctx.json({ success: true });
});
var forgetPasswordEmailOTPBodySchema = object({ email: string().meta({ description: "Email address to send the OTP" }) });
/**
* ### Endpoint
*
* POST `/forget-password/email-otp`
*
* ### API Methods
*
* **server:**
* `auth.api.forgetPasswordEmailOTP`
*
* **client:**
* `authClient.forgetPassword.emailOtp`
*
* @deprecated Use `/email-otp/request-password-reset` instead.
* @see [Read our docs to learn more.](https://www.better-auth.com/docs/plugins/email-otp#reset-password-with-otp)
*/
var forgetPasswordEmailOTP = (opts) => {
	const warnDeprecation = deprecate(() => {}, "The \"/forget-password/email-otp\" endpoint is deprecated. Please use \"/email-otp/request-password-reset\" instead. This endpoint will be removed in the next major version.");
	return createAuthEndpoint("/forget-password/email-otp", {
		method: "POST",
		body: forgetPasswordEmailOTPBodySchema,
		metadata: { openapi: {
			operationId: "forgetPasswordWithEmailOTP",
			description: "Deprecated: Use /email-otp/request-password-reset instead.",
			responses: { 200: {
				description: "Success",
				content: { "application/json": { schema: {
					type: "object",
					properties: { success: {
						type: "boolean",
						description: "Indicates if the OTP was sent successfully"
					} }
				} } }
			} }
		} }
	}, async (ctx) => {
		warnDeprecation();
		const email = ctx.body.email.toLowerCase();
		const identifier = toOTPIdentifier("forget-password", email);
		const otp = await resolveOTP(ctx, opts, email, "forget-password");
		if (!await ctx.context.internalAdapter.findUserByEmail(email)) {
			await ctx.context.internalAdapter.deleteVerificationByIdentifier(identifier);
			return ctx.json({ success: true });
		}
		await ctx.context.runInBackgroundOrAwait(opts.sendVerificationOTP({
			email,
			otp,
			type: "forget-password"
		}, ctx));
		return ctx.json({ success: true });
	});
};
var resetPasswordEmailOTPBodySchema = object({
	email: string().meta({ description: "Email address to reset the password" }),
	otp: string().meta({ description: "OTP sent to the email" }),
	password: string().meta({ description: "New password" })
});
/**
* ### Endpoint
*
* POST `/email-otp/reset-password`
*
* ### API Methods
*
* **server:**
* `auth.api.resetPasswordEmailOTP`
*
* **client:**
* `authClient.emailOtp.resetPassword`
*
* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/email-otp#api-method-email-otp-reset-password)
*/
var resetPasswordEmailOTP = (opts) => createAuthEndpoint("/email-otp/reset-password", {
	method: "POST",
	body: resetPasswordEmailOTPBodySchema,
	metadata: { openapi: {
		operationId: "resetPasswordWithEmailOTP",
		description: "Reset password with email and OTP",
		responses: { 200: {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { success: { type: "boolean" } }
			} } }
		} }
	} }
}, async (ctx) => {
	const email = ctx.body.email.toLowerCase();
	assertPasswordNotTooShort(ctx, ctx.body.password);
	assertPasswordNotTooLong(ctx, ctx.body.password);
	await atomicVerifyOTP(ctx, opts, toOTPIdentifier("forget-password", email), ctx.body.otp);
	const user = await ctx.context.internalAdapter.findUserByEmail(email);
	if (!user) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.USER_NOT_FOUND);
	const passwordHash = await ctx.context.password.hash(ctx.body.password);
	if (!await ctx.context.internalAdapter.findCredentialAccount(user.user.id)) await ctx.context.internalAdapter.createAccount({
		userId: user.user.id,
		providerId: "credential",
		accountId: user.user.id,
		password: passwordHash
	});
	else await ctx.context.internalAdapter.updatePassword(user.user.id, passwordHash);
	if (ctx.context.options.emailAndPassword?.onPasswordReset) await ctx.context.options.emailAndPassword.onPasswordReset({ user: user.user }, ctx.request);
	if (!user.user.emailVerified) await ctx.context.internalAdapter.updateUser(user.user.id, { emailVerified: true });
	if (ctx.context.options.emailAndPassword?.revokeSessionsOnPasswordReset) await ctx.context.internalAdapter.deleteUserSessions(user.user.id);
	return ctx.json({ success: true });
});
var requestEmailChangeEmailOTPBodySchema = object({
	newEmail: string().meta({ description: "New email address to send the OTP" }),
	otp: string().optional().meta({ description: "OTP sent to the current email. This is required if changeEmail.verifyCurrentEmail option is set to true" })
});
/**
* ### Endpoint
*
* POST `/email-otp/request-email-change`
*
* ### API Methods
*
* **server:**
* `auth.api.requestEmailChangeEmailOTP`
*
* **client:**
* `authClient.emailOtp.requestEmailChange`
*
* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/email-otp#change-email-with-otp)
*/
var requestEmailChangeEmailOTP = (opts) => createAuthEndpoint("/email-otp/request-email-change", {
	method: "POST",
	body: requestEmailChangeEmailOTPBodySchema,
	use: [sensitiveSessionMiddleware],
	metadata: { openapi: {
		operationId: "requestEmailChangeWithEmailOTP",
		description: "Request email change with verification OTP sent to the new email",
		responses: { 200: {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { success: { type: "boolean" } }
			} } }
		} }
	} }
}, async (ctx) => {
	if (!opts.changeEmail?.enabled) {
		ctx.context.logger.error("Change email with OTP is disabled.");
		throw APIError.fromStatus("BAD_REQUEST", { message: "Change email with OTP is disabled" });
	}
	const email$7 = ctx.context.session.user.email.toLowerCase();
	const newEmail = ctx.body.newEmail.toLowerCase();
	if (!email().safeParse(newEmail).success) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_EMAIL);
	if (newEmail === email$7) {
		ctx.context.logger.error("Email is the same");
		throw APIError.fromStatus("BAD_REQUEST", { message: "Email is the same" });
	}
	if (opts.changeEmail?.verifyCurrentEmail) {
		if (!ctx.body.otp) throw APIError.fromStatus("BAD_REQUEST", { message: "OTP is required to verify current email" });
		await atomicVerifyOTP(ctx, opts, toOTPIdentifier("email-verification", email$7), ctx.body.otp);
	} else if (ctx.body.otp) ctx.context.logger.warn("OTP provided but not required for verifying current email. If you want to require OTP verification for current email, please set the changeEmail.verifyCurrentEmail option to true in the configuration");
	const otp = opts.generateOTP({
		email: newEmail,
		type: "change-email"
	}, ctx) || defaultOTPGenerator$1(opts);
	const storedOTP = await storeOTP(ctx, opts, otp);
	await ctx.context.internalAdapter.createVerificationValue({
		value: `${storedOTP}:0`,
		identifier: toOTPIdentifier("change-email", `${email$7}-${newEmail}`),
		expiresAt: getDate(opts.expiresIn, "sec")
	});
	if (await ctx.context.internalAdapter.findUserByEmail(newEmail)) {
		await ctx.context.internalAdapter.deleteVerificationByIdentifier(toOTPIdentifier("change-email", `${email$7}-${newEmail}`));
		return ctx.json({ success: true });
	}
	await ctx.context.runInBackgroundOrAwait(opts.sendVerificationOTP({
		email: newEmail,
		otp,
		type: "change-email"
	}, ctx));
	return ctx.json({ success: true });
});
var changeEmailEmailOTPBodySchema = object({
	newEmail: string().meta({ description: "New email address to verify and change to" }),
	otp: string().meta({ description: "OTP sent to the new email" })
});
/**
* ### Endpoint
*
* POST `/email-otp/change-email`
*
* ### API Methods
*
* **server:**
* `auth.api.changeEmailEmailOTP`
*
* **client:**
* `authClient.emailOtp.changeEmail`
*
* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/email-otp#change-email-with-otp)
*/
var changeEmailEmailOTP = (opts) => createAuthEndpoint("/email-otp/change-email", {
	method: "POST",
	body: changeEmailEmailOTPBodySchema,
	use: [sensitiveSessionMiddleware],
	metadata: { openapi: {
		operationId: "changeEmailWithEmailOTP",
		description: "Verify new email with OTP and change the email if verification is successful",
		responses: { 200: {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { success: { type: "boolean" } }
			} } }
		} }
	} }
}, async (ctx) => {
	if (!opts.changeEmail?.enabled) {
		ctx.context.logger.error("Change email with OTP is disabled.");
		throw APIError.fromStatus("BAD_REQUEST", { message: "Change email with OTP is disabled" });
	}
	const session = ctx.context.session;
	const email$2 = session.user.email.toLowerCase();
	const newEmail = ctx.body.newEmail.toLowerCase();
	if (!email().safeParse(newEmail).success) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_EMAIL);
	if (newEmail === email$2) {
		ctx.context.logger.error("Email is the same");
		throw APIError.fromStatus("BAD_REQUEST", { message: "Email is the same" });
	}
	await atomicVerifyOTP(ctx, opts, toOTPIdentifier("change-email", `${email$2}-${newEmail}`), ctx.body.otp);
	const currentUser = await ctx.context.internalAdapter.findUserByEmail(email$2);
	if (!currentUser)
 /**
	* safe to leak the existence of a user as a valid OTP has been provided
	*/
	throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.USER_NOT_FOUND);
	if (await ctx.context.internalAdapter.findUserByEmail(newEmail))
 /**
	* safe to leak the existence of a user as a valid OTP has been provided
	*/
	throw APIError.fromStatus("BAD_REQUEST", { message: "Email already in use" });
	if (ctx.context.options.emailVerification?.beforeEmailVerification) await ctx.context.options.emailVerification.beforeEmailVerification(currentUser.user, ctx.request);
	const updatedUser = await ctx.context.internalAdapter.updateUser(currentUser.user.id, {
		email: newEmail,
		emailVerified: true
	});
	if (ctx.context.options.emailVerification?.afterEmailVerification) await ctx.context.options.emailVerification.afterEmailVerification(updatedUser, ctx.request);
	await setSessionCookie(ctx, {
		session: session.session,
		user: {
			...session.user,
			email: newEmail,
			emailVerified: true
		}
	});
	return ctx.json({ success: true });
});
var defaultOTPGenerator$1 = (options) => generateRandomString(options.otpLength ?? 6, "0-9");
/**
* Verifies a single-use OTP with race-condition protection.
*
* The atomic consume is the single gate: only the first concurrent caller
* receives the record, every later racer receives `null` and is rejected, so
* a correct OTP can only ever be accepted once. When the submitted code is
* wrong the record is recreated with the same value and expiry and an
* incremented attempt count so the next try can still find it; the budget is
* enforced before verification, and a record whose attempts are exhausted is
* left consumed (no recreate), locking the identifier out.
*/
async function atomicVerifyOTP(ctx, opts, identifier, providedOTP) {
	const existing = await ctx.context.internalAdapter.findVerificationValue(identifier);
	if (existing && existing.expiresAt < /* @__PURE__ */ new Date()) {
		await ctx.context.internalAdapter.deleteVerificationByIdentifier(identifier);
		throw APIError.from("BAD_REQUEST", EMAIL_OTP_ERROR_CODES.OTP_EXPIRED);
	}
	const consumed = await ctx.context.internalAdapter.consumeVerificationValue(identifier);
	if (!consumed) throw APIError.from("BAD_REQUEST", EMAIL_OTP_ERROR_CODES.INVALID_OTP);
	const [otpValue, attempts] = splitAtLastColon(consumed.value);
	const allowedAttempts = opts?.allowedAttempts || 3;
	const usedAttempts = parseInt(attempts || "0");
	if (usedAttempts >= allowedAttempts) throw APIError.from("FORBIDDEN", EMAIL_OTP_ERROR_CODES.TOO_MANY_ATTEMPTS);
	if (!await verifyStoredOTP(ctx, opts, otpValue, providedOTP)) {
		await ctx.context.internalAdapter.createVerificationValue({
			value: `${otpValue}:${usedAttempts + 1}`,
			identifier,
			expiresAt: consumed.expiresAt
		});
		throw APIError.from("BAD_REQUEST", EMAIL_OTP_ERROR_CODES.INVALID_OTP);
	}
}
var defaultOTPGenerator = (options) => generateRandomString(options.otpLength ?? 6, "0-9");
var emailOTP = (options) => {
	const opts = {
		expiresIn: 300,
		generateOTP: () => defaultOTPGenerator(options),
		storeOTP: "plain",
		...options
	};
	const sendVerificationOTPAction = sendVerificationOTP(opts);
	return {
		id: "email-otp",
		version: PACKAGE_VERSION,
		init(ctx) {
			if (!opts.overrideDefaultEmailVerification) return;
			return { options: { emailVerification: { async sendVerificationEmail(data, request) {
				await ctx.runInBackgroundOrAwait(sendVerificationOTPAction({
					context: ctx,
					request,
					body: {
						email: data.user.email,
						type: "email-verification"
					},
					ctx
				}));
			} } } };
		},
		endpoints: {
			sendVerificationOTP: sendVerificationOTPAction,
			createVerificationOTP: createVerificationOTP(opts),
			getVerificationOTP: getVerificationOTP(opts),
			checkVerificationOTP: checkVerificationOTP(opts),
			verifyEmailOTP: verifyEmailOTP(opts),
			signInEmailOTP: signInEmailOTP(opts),
			requestPasswordResetEmailOTP: requestPasswordResetEmailOTP(opts),
			forgetPasswordEmailOTP: forgetPasswordEmailOTP(opts),
			resetPasswordEmailOTP: resetPasswordEmailOTP(opts),
			requestEmailChangeEmailOTP: requestEmailChangeEmailOTP(opts),
			changeEmailEmailOTP: changeEmailEmailOTP(opts)
		},
		hooks: { after: [{
			matcher(context) {
				return !!(context.path?.startsWith("/sign-up") && opts.sendVerificationOnSignUp && !opts.overrideDefaultEmailVerification);
			},
			handler: createAuthMiddleware(async (ctx) => {
				const email = (await getEndpointResponse(ctx))?.user.email;
				if (email) {
					const otp = opts.generateOTP({
						email,
						type: "email-verification"
					}, ctx) || defaultOTPGenerator(opts);
					const storedOTP = await storeOTP(ctx, opts, otp);
					await ctx.context.internalAdapter.createVerificationValue({
						value: `${storedOTP}:0`,
						identifier: toOTPIdentifier("email-verification", email),
						expiresAt: getDate(opts.expiresIn, "sec")
					});
					await ctx.context.runInBackgroundOrAwait(options.sendVerificationOTP({
						email,
						otp,
						type: "email-verification"
					}, ctx));
				}
			})
		}] },
		rateLimit: [
			{
				pathMatcher(path) {
					return path === "/email-otp/send-verification-otp";
				},
				window: opts.rateLimit?.window || 60,
				max: opts.rateLimit?.max || 3
			},
			{
				pathMatcher(path) {
					return path === "/email-otp/check-verification-otp";
				},
				window: opts.rateLimit?.window || 60,
				max: opts.rateLimit?.max || 3
			},
			{
				pathMatcher(path) {
					return path === "/email-otp/verify-email";
				},
				window: opts.rateLimit?.window || 60,
				max: opts.rateLimit?.max || 3
			},
			{
				pathMatcher(path) {
					return path === "/sign-in/email-otp";
				},
				window: opts.rateLimit?.window || 60,
				max: opts.rateLimit?.max || 3
			},
			{
				pathMatcher(path) {
					return path === "/email-otp/request-password-reset";
				},
				window: opts.rateLimit?.window || 60,
				max: opts.rateLimit?.max || 3
			},
			{
				pathMatcher(path) {
					return path === "/email-otp/reset-password";
				},
				window: opts.rateLimit?.window || 60,
				max: opts.rateLimit?.max || 3
			},
			{
				pathMatcher(path) {
					return path === "/forget-password/email-otp";
				},
				window: opts.rateLimit?.window || 60,
				max: opts.rateLimit?.max || 3
			},
			{
				pathMatcher(path) {
					return path === "/email-otp/request-email-change";
				},
				window: opts.rateLimit?.window || 60,
				max: opts.rateLimit?.max || 3
			},
			{
				pathMatcher(path) {
					return path === "/email-otp/change-email";
				},
				window: opts.rateLimit?.window || 60,
				max: opts.rateLimit?.max || 3
			}
		],
		options,
		$ERROR_CODES: EMAIL_OTP_ERROR_CODES
	};
};
var defaultKeyHasher = async (otp) => {
	const hash = await createHash("SHA-256").digest(new TextEncoder().encode(otp));
	return base64Url.encode(new Uint8Array(hash), { padding: false });
};
var signInMagicLinkBodySchema = object({
	email: email().meta({ description: "Email address to send the magic link" }),
	name: string().meta({ description: "User display name. Only used if the user is registering for the first time. Eg: \"my-name\"" }).optional(),
	callbackURL: string().meta({ description: "URL to redirect after magic link verification" }).optional(),
	newUserCallbackURL: string().meta({ description: "URL to redirect after new user signup. Only used if the user is registering for the first time." }).optional(),
	errorCallbackURL: string().meta({ description: "URL to redirect after error." }).optional(),
	metadata: record(string(), any()).meta({ description: "Additional metadata to pass to sendMagicLink." }).optional()
});
var magicLinkVerifyQuerySchema = object({
	token: string().meta({ description: "Verification token" }),
	callbackURL: string().meta({ description: "URL to redirect after magic link verification, if not provided the user will be redirected to the root URL. Eg: \"/dashboard\"" }).optional(),
	errorCallbackURL: string().meta({ description: "URL to redirect after error." }).optional(),
	newUserCallbackURL: string().meta({ description: "URL to redirect after new user signup. Only used if the user is registering for the first time." }).optional()
});
var magicLinkRecordSchema = object({
	type: literal("magic-link"),
	email: email(),
	name: string().optional()
}).strict();
function parseMagicLinkRecord(value) {
	try {
		const parsed = JSON.parse(value);
		return magicLinkRecordSchema.safeParse(parsed);
	} catch {
		return null;
	}
}
var magicLinkIdentifier = (storedToken) => `magic-link:${storedToken}`;
var magicLink = (options) => {
	const opts = {
		storeToken: "plain",
		allowedAttempts: 1,
		...options
	};
	if (options.allowedAttempts !== void 0 && options.allowedAttempts !== 1) console.warn("[better-auth/magic-link] `allowedAttempts` is ignored: tokens are consumed atomically on the first verification call. Any value other than `1` has no effect; remove the option to silence this warning.");
	async function storeToken(ctx, token) {
		if (opts.storeToken === "hashed") return await defaultKeyHasher(token);
		if (typeof opts.storeToken === "object" && "type" in opts.storeToken && opts.storeToken.type === "custom-hasher") return await opts.storeToken.hash(token);
		return token;
	}
	return {
		id: "magic-link",
		version: PACKAGE_VERSION,
		endpoints: {
			/**
			* ### Endpoint
			*
			* POST `/sign-in/magic-link`
			*
			* ### API Methods
			*
			* **server:**
			* `auth.api.signInMagicLink`
			*
			* **client:**
			* `authClient.signIn.magicLink`
			*
			* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/sign-in#api-method-sign-in-magic-link)
			*/
			signInMagicLink: createAuthEndpoint("/sign-in/magic-link", {
				method: "POST",
				requireHeaders: true,
				use: [formCsrfMiddleware],
				body: signInMagicLinkBodySchema,
				metadata: { openapi: {
					operationId: "signInWithMagicLink",
					description: "Sign in with magic link",
					responses: { 200: {
						description: "Success",
						content: { "application/json": { schema: {
							type: "object",
							properties: { status: { type: "boolean" } }
						} } }
					} }
				} }
			}, async (ctx) => {
				const { email, metadata } = ctx.body;
				const verificationToken = opts?.generateToken ? await opts.generateToken(email) : generateRandomString(32, "a-z", "A-Z");
				const storedToken = await storeToken(ctx, verificationToken);
				await ctx.context.internalAdapter.createVerificationValue({
					identifier: magicLinkIdentifier(storedToken),
					value: JSON.stringify({
						type: "magic-link",
						email,
						name: ctx.body.name
					}),
					expiresAt: new Date(Date.now() + (opts.expiresIn || 300) * 1e3)
				});
				const realBaseURL = new URL(ctx.context.baseURL);
				const pathname = realBaseURL.pathname === "/" ? "" : realBaseURL.pathname;
				const basePath = pathname ? "" : ctx.context.options.basePath || "";
				const url = new URL(`${pathname}${basePath}/magic-link/verify`, realBaseURL.origin);
				url.searchParams.set("token", verificationToken);
				url.searchParams.set("callbackURL", ctx.body.callbackURL || "/");
				if (ctx.body.newUserCallbackURL) url.searchParams.set("newUserCallbackURL", ctx.body.newUserCallbackURL);
				if (ctx.body.errorCallbackURL) url.searchParams.set("errorCallbackURL", ctx.body.errorCallbackURL);
				await options.sendMagicLink({
					email,
					url: url.toString(),
					token: verificationToken,
					metadata
				}, ctx);
				return ctx.json({ status: true });
			}),
			/**
			* ### Endpoint
			*
			* GET `/magic-link/verify`
			*
			* ### API Methods
			*
			* **server:**
			* `auth.api.magicLinkVerify`
			*
			* **client:**
			* `authClient.magicLink.verify`
			*
			* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/magic-link#api-method-magic-link-verify)
			*/
			magicLinkVerify: createAuthEndpoint("/magic-link/verify", {
				method: "GET",
				query: magicLinkVerifyQuerySchema,
				use: [
					originCheck((ctx) => {
						return ctx.query.callbackURL ? decodeURIComponent(ctx.query.callbackURL) : "/";
					}),
					originCheck((ctx) => {
						return ctx.query.newUserCallbackURL ? decodeURIComponent(ctx.query.newUserCallbackURL) : "/";
					}),
					originCheck((ctx) => {
						return ctx.query.errorCallbackURL ? decodeURIComponent(ctx.query.errorCallbackURL) : "/";
					})
				],
				requireHeaders: true,
				metadata: { openapi: {
					operationId: "verifyMagicLink",
					description: "Verify magic link",
					responses: { 200: {
						description: "Success",
						content: { "application/json": { schema: {
							type: "object",
							properties: {
								session: { $ref: "#/components/schemas/Session" },
								user: { $ref: "#/components/schemas/User" }
							}
						} } }
					} }
				} }
			}, async (ctx) => {
				const token = ctx.query.token;
				const callbackURL = new URL(ctx.query.callbackURL ? decodeURIComponent(ctx.query.callbackURL) : "/", ctx.context.baseURL).toString();
				const errorCallbackURL = new URL(ctx.query.errorCallbackURL ? decodeURIComponent(ctx.query.errorCallbackURL) : callbackURL, ctx.context.baseURL);
				function redirectWithError(error, description) {
					errorCallbackURL.searchParams.set("error", error);
					if (description) errorCallbackURL.searchParams.set("error_description", description);
					throw ctx.redirect(errorCallbackURL.toString());
				}
				const newUserCallbackURL = new URL(ctx.query.newUserCallbackURL ? decodeURIComponent(ctx.query.newUserCallbackURL) : callbackURL, ctx.context.baseURL).toString();
				const identifier = magicLinkIdentifier(await storeToken(ctx, token));
				const pendingValue = await ctx.context.internalAdapter.findVerificationValue(identifier);
				if (!pendingValue || !parseMagicLinkRecord(pendingValue.value)?.success) redirectWithError("INVALID_TOKEN");
				const tokenValue = await ctx.context.internalAdapter.consumeVerificationValue(identifier);
				if (!tokenValue) redirectWithError("INVALID_TOKEN");
				const record = parseMagicLinkRecord(tokenValue.value);
				if (!record?.success) redirectWithError("INVALID_TOKEN");
				const { email, name } = record.data;
				let isNewUser = false;
				let user = await ctx.context.internalAdapter.findUserByEmail(email).then((res) => res?.user);
				if (!user) if (!opts.disableSignUp) {
					let newUser;
					try {
						newUser = await ctx.context.internalAdapter.createUser({
							email,
							emailVerified: true,
							name: name || ""
						}, { method: "magic-link" });
					} catch (e) {
						if (isAPIError(e) && e.body?.code) redirectWithError(e.body.code, e.body.message);
						throw e;
					}
					isNewUser = true;
					user = newUser;
					if (!user) redirectWithError("failed_to_create_user");
				} else redirectWithError("new_user_signup_disabled");
				if (!user.emailVerified) {
					const promotedUser = await revokeUnprovenAccountAccess(ctx, user.id);
					if (!promotedUser) redirectWithError("user_not_found");
					user = promotedUser;
				}
				const session = await ctx.context.internalAdapter.createSession(user.id);
				if (!session) redirectWithError("failed_to_create_session");
				await setSessionCookie(ctx, {
					session,
					user
				});
				if (!ctx.query.callbackURL) return ctx.json({
					token: session.token,
					user: parseUserOutput(ctx.context.options, user),
					session: parseSessionOutput(ctx.context.options, session)
				});
				if (isNewUser) throw ctx.redirect(newUserCallbackURL);
				throw ctx.redirect(callbackURL);
			})
		},
		rateLimit: [{
			pathMatcher(path) {
				return path.startsWith("/sign-in/magic-link") || path.startsWith("/magic-link/verify");
			},
			window: opts.rateLimit?.window || 60,
			max: opts.rateLimit?.max || 5
		}],
		options
	};
};
var PROTO_POLLUTION_PATTERNS = {
	proto: /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/,
	constructor: /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/,
	protoShort: /"__proto__"\s*:/,
	constructorShort: /"constructor"\s*:/
};
var JSON_SIGNATURE = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
var SPECIAL_VALUES = {
	true: true,
	false: false,
	null: null,
	undefined: void 0,
	nan: NaN,
	infinity: Number.POSITIVE_INFINITY,
	"-infinity": Number.NEGATIVE_INFINITY
};
var ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,7}))?(?:Z|([+-])(\d{2}):(\d{2}))$/;
function isValidDate(date) {
	return date instanceof Date && !isNaN(date.getTime());
}
function parseISODate(value) {
	const match = ISO_DATE_REGEX.exec(value);
	if (!match) return null;
	const [, year, month, day, hour, minute, second, ms, offsetSign, offsetHour, offsetMinute] = match;
	const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(hour, 10), parseInt(minute, 10), parseInt(second, 10), ms ? parseInt(ms.padEnd(3, "0"), 10) : 0));
	if (offsetSign) {
		const offset = (parseInt(offsetHour, 10) * 60 + parseInt(offsetMinute, 10)) * (offsetSign === "+" ? -1 : 1);
		date.setUTCMinutes(date.getUTCMinutes() + offset);
	}
	return isValidDate(date) ? date : null;
}
function betterJSONParse(value, options = {}) {
	const { strict = false, warnings = false, reviver, parseDates = true } = options;
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	const lowerValue = trimmed.toLowerCase();
	if (lowerValue.length <= 9 && lowerValue in SPECIAL_VALUES) return SPECIAL_VALUES[lowerValue];
	if (!JSON_SIGNATURE.test(trimmed)) {
		if (strict) throw new SyntaxError("[better-json] Invalid JSON");
		return value;
	}
	if (Object.entries(PROTO_POLLUTION_PATTERNS).some(([key, pattern]) => {
		const matches = pattern.test(trimmed);
		if (matches && warnings) console.warn(`[better-json] Detected potential prototype pollution attempt using ${key} pattern`);
		return matches;
	}) && strict) throw new Error("[better-json] Potential prototype pollution attempt detected");
	try {
		const secureReviver = (key, value) => {
			if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
				if (warnings) console.warn(`[better-json] Dropping "${key}" key to prevent prototype pollution`);
				return;
			}
			if (parseDates && typeof value === "string") {
				const date = parseISODate(value);
				if (date) return date;
			}
			return reviver ? reviver(key, value) : value;
		};
		return JSON.parse(trimmed, secureReviver);
	} catch (error) {
		if (strict) throw error;
		return value;
	}
}
function parseJSON(value, options = { strict: true }) {
	return betterJSONParse(value, options);
}
async function computeTeamMembershipKey(data) {
	const digest = await createHash("SHA-256").digest(new TextEncoder().encode(JSON.stringify([data.teamId, data.userId])));
	return base64Url.encode(new Uint8Array(digest), { padding: false });
}
async function findTeamMemberByKeyOrPair(adapter, data) {
	const memberByKey = await adapter.findOne({
		model: "teamMember",
		where: [{
			field: "membershipKey",
			value: data.membershipKey
		}]
	});
	if (memberByKey) return memberByKey;
	return adapter.findOne({
		model: "teamMember",
		where: [{
			field: "teamId",
			value: data.teamId
		}, {
			field: "userId",
			value: data.userId
		}]
	});
}
async function syncTeamMemberCount(adapter, teamId) {
	const memberCount = await adapter.count({
		model: "teamMember",
		where: [{
			field: "teamId",
			value: teamId
		}]
	});
	await adapter.incrementOne({
		model: "team",
		where: [{
			field: "id",
			value: teamId
		}, {
			field: "memberCount",
			operator: "lt",
			value: memberCount
		}],
		increment: {},
		set: { memberCount }
	});
}
async function reserveTeamSeat(adapter, data) {
	const team = await adapter.incrementOne({
		model: "team",
		where: [{
			field: "id",
			value: data.teamId
		}, {
			field: "memberCount",
			operator: "lt",
			value: data.maximumMembersPerTeam
		}],
		increment: { memberCount: 1 }
	});
	return Boolean(team);
}
async function incrementTeamMemberCount(adapter, teamId) {
	await adapter.incrementOne({
		model: "team",
		where: [{
			field: "id",
			value: teamId
		}],
		increment: { memberCount: 1 }
	});
}
async function releaseTeamSeats(adapter, teamId, count) {
	if (count <= 0) return;
	await adapter.incrementOne({
		model: "team",
		where: [{
			field: "id",
			value: teamId
		}, {
			field: "memberCount",
			operator: "gte",
			value: count
		}],
		increment: { memberCount: -count }
	});
}
async function createTeamMemberWithKey(adapter, data) {
	try {
		return {
			status: "created",
			member: await adapter.create({
				model: "teamMember",
				data: {
					teamId: data.teamId,
					userId: data.userId,
					membershipKey: data.membershipKey,
					createdAt: /* @__PURE__ */ new Date()
				}
			})
		};
	} catch (error) {
		const existing = await findTeamMemberByKeyOrPair(adapter, data);
		if (existing) return {
			status: "existing",
			member: existing
		};
		throw error;
	}
}
function stripTeamMembershipKey(member) {
	const { membershipKey: _membershipKey, ...output } = member;
	return output;
}
function stripTeamMembershipKeys(members) {
	return members.map(stripTeamMembershipKey);
}
var getOrgAdapter = (context, options) => {
	const baseAdapter = context.adapter;
	const orgAdditionalFields = options?.schema?.organization?.additionalFields;
	const memberAdditionalFields = options?.schema?.member?.additionalFields;
	const invitationAdditionalFields = options?.schema?.invitation?.additionalFields;
	const teamAdditionalFields = options?.schema?.team?.additionalFields;
	return {
		findOrganizationBySlug: async (slug) => {
			return filterOutputFields(await (await getCurrentAdapter(baseAdapter)).findOne({
				model: "organization",
				where: [{
					field: "slug",
					value: slug
				}]
			}), orgAdditionalFields);
		},
		createOrganization: async (data) => {
			const organization = await (await getCurrentAdapter(baseAdapter)).create({
				model: "organization",
				data: {
					...data.organization,
					metadata: data.organization.metadata ? JSON.stringify(data.organization.metadata) : void 0
				},
				forceAllowId: true
			});
			return filterOutputFields({
				...organization,
				metadata: organization.metadata && typeof organization.metadata === "string" ? JSON.parse(organization.metadata) : void 0
			}, orgAdditionalFields);
		},
		findMemberByEmail: async (data) => {
			const adapter = await getCurrentAdapter(baseAdapter);
			const user = await adapter.findOne({
				model: "user",
				where: [{
					field: "email",
					value: data.email.toLowerCase()
				}]
			});
			if (!user) return null;
			const member = await adapter.findOne({
				model: "member",
				where: [{
					field: "organizationId",
					value: data.organizationId
				}, {
					field: "userId",
					value: user.id
				}]
			});
			if (!member) return null;
			return {
				...member,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image
				}
			};
		},
		listMembers: async (data) => {
			const adapter = await getCurrentAdapter(baseAdapter);
			const members = await Promise.all([adapter.findMany({
				model: "member",
				where: [{
					field: "organizationId",
					value: data.organizationId
				}, ...data.filter?.field ? [{
					field: data.filter?.field,
					value: data.filter?.value,
					...data.filter.operator ? { operator: data.filter.operator } : {}
				}] : []],
				limit: data.limit || (typeof options?.membershipLimit === "number" ? options.membershipLimit : 100) || 100,
				offset: data.offset || 0,
				sortBy: data.sortBy ? {
					field: data.sortBy,
					direction: data.sortOrder || "asc"
				} : void 0
			}), adapter.count({
				model: "member",
				where: [{
					field: "organizationId",
					value: data.organizationId
				}, ...data.filter?.field ? [{
					field: data.filter?.field,
					value: data.filter?.value,
					...data.filter.operator ? { operator: data.filter.operator } : {}
				}] : []]
			})]);
			const users = await adapter.findMany({
				model: "user",
				where: [{
					field: "id",
					value: members[0].map((member) => member.userId),
					operator: "in"
				}],
				limit: members[0].length
			});
			return {
				members: members[0].map((member) => {
					const user = users.find((user) => user.id === member.userId);
					if (!user) throw new BetterAuthError("Unexpected error: User not found for member");
					return {
						...member,
						user: {
							id: user.id,
							name: user.name,
							email: user.email,
							image: user.image
						}
					};
				}),
				total: members[1]
			};
		},
		findMemberByOrgId: async (data) => {
			const result = await (await getCurrentAdapter(baseAdapter)).findOne({
				model: "member",
				where: [{
					field: "userId",
					value: data.userId
				}, {
					field: "organizationId",
					value: data.organizationId
				}],
				join: { user: true }
			});
			if (!result || !result.user) return null;
			const { user, ...member } = result;
			return {
				...member,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image
				}
			};
		},
		findMemberById: async (memberId) => {
			const result = await (await getCurrentAdapter(baseAdapter)).findOne({
				model: "member",
				where: [{
					field: "id",
					value: memberId
				}],
				join: { user: true }
			});
			if (!result) return null;
			const { user, ...member } = result;
			return {
				...member,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image
				}
			};
		},
		createMember: async (data) => {
			return await (await getCurrentAdapter(baseAdapter)).create({
				model: "member",
				data: {
					...data,
					createdAt: /* @__PURE__ */ new Date()
				}
			});
		},
		updateMember: async (memberId, role) => {
			return await (await getCurrentAdapter(baseAdapter)).update({
				model: "member",
				where: [{
					field: "id",
					value: memberId
				}],
				update: { role }
			});
		},
		deleteMember: async ({ memberId, organizationId, userId: _userId }) => {
			return runWithTransaction(baseAdapter, async () => {
				const adapter = await getCurrentAdapter(baseAdapter);
				let userId;
				if (!_userId) {
					const member = await adapter.findOne({
						model: "member",
						where: [{
							field: "id",
							value: memberId
						}]
					});
					if (!member) throw new BetterAuthError("Member not found");
					userId = member.userId;
				} else userId = _userId;
				const member = await adapter.delete({
					model: "member",
					where: [{
						field: "id",
						value: memberId
					}]
				});
				if (options?.teams?.enabled) {
					const teams = await adapter.findMany({
						model: "team",
						where: [{
							field: "organizationId",
							value: organizationId
						}]
					});
					for (const team of teams) {
						const deleted = await adapter.deleteMany({
							model: "teamMember",
							where: [{
								field: "userId",
								value: userId
							}, {
								field: "teamId",
								value: team.id
							}]
						});
						await releaseTeamSeats(adapter, team.id, deleted);
					}
				}
				return member;
			});
		},
		updateOrganization: async (organizationId, data) => {
			const organization = await (await getCurrentAdapter(baseAdapter)).update({
				model: "organization",
				where: [{
					field: "id",
					value: organizationId
				}],
				update: {
					...data,
					metadata: typeof data.metadata === "object" ? JSON.stringify(data.metadata) : data.metadata
				}
			});
			if (!organization) return null;
			return filterOutputFields({
				...organization,
				metadata: organization.metadata ? parseJSON(organization.metadata) : void 0
			}, orgAdditionalFields);
		},
		deleteOrganization: async (organizationId) => {
			return runWithTransaction(baseAdapter, async () => {
				const adapter = await getCurrentAdapter(baseAdapter);
				await adapter.deleteMany({
					model: "member",
					where: [{
						field: "organizationId",
						value: organizationId
					}]
				});
				await adapter.deleteMany({
					model: "invitation",
					where: [{
						field: "organizationId",
						value: organizationId
					}]
				});
				await adapter.delete({
					model: "organization",
					where: [{
						field: "id",
						value: organizationId
					}]
				});
				return organizationId;
			});
		},
		setActiveOrganization: async (sessionToken, organizationId, ctx) => {
			return await context.internalAdapter.updateSession(sessionToken, { activeOrganizationId: organizationId });
		},
		findOrganizationById: async (organizationId) => {
			return filterOutputFields(await (await getCurrentAdapter(baseAdapter)).findOne({
				model: "organization",
				where: [{
					field: "id",
					value: organizationId
				}]
			}), orgAdditionalFields);
		},
		checkMembership: async ({ userId, organizationId }) => {
			return await (await getCurrentAdapter(baseAdapter)).findOne({
				model: "member",
				where: [{
					field: "userId",
					value: userId
				}, {
					field: "organizationId",
					value: organizationId
				}]
			});
		},
		/**
		* @requires db
		*/
		findFullOrganization: async ({ organizationId, isSlug, includeTeams, membersLimit }) => {
			const adapter = await getCurrentAdapter(baseAdapter);
			const result = await adapter.findOne({
				model: "organization",
				where: [{
					field: isSlug ? "slug" : "id",
					value: organizationId
				}],
				join: {
					invitation: true,
					member: membersLimit ? { limit: membersLimit } : true,
					...includeTeams ? { team: true } : {}
				}
			});
			if (!result) return null;
			const { invitation: invitations, member: members, team: teams, ...org } = result;
			const userIds = members.map((member) => member.userId);
			const users = userIds.length > 0 ? await adapter.findMany({
				model: "user",
				where: [{
					field: "id",
					value: userIds,
					operator: "in"
				}],
				limit: (typeof options?.membershipLimit === "number" ? options.membershipLimit : 100) || 100
			}) : [];
			const userMap = new Map(users.map((user) => [user.id, user]));
			const membersWithUsers = members.map((member) => {
				const user = userMap.get(member.userId);
				if (!user) throw new BetterAuthError("Unexpected error: User not found for member");
				return {
					...filterOutputFields(member, memberAdditionalFields),
					user: {
						id: user.id,
						name: user.name,
						email: user.email,
						image: user.image
					}
				};
			});
			const filteredOrg = filterOutputFields(org, orgAdditionalFields);
			const filteredInvitations = invitations.map((inv) => filterOutputFields(inv, invitationAdditionalFields));
			const filteredTeams = teams?.map((team) => filterOutputFields(team, teamAdditionalFields));
			return {
				...filteredOrg,
				invitations: filteredInvitations,
				members: membersWithUsers,
				teams: filteredTeams
			};
		},
		listOrganizations: async (userId) => {
			const result = await (await getCurrentAdapter(baseAdapter)).findMany({
				model: "member",
				where: [{
					field: "userId",
					value: userId
				}],
				join: { organization: true }
			});
			if (!result || result.length === 0) return [];
			return result.map((member) => filterOutputFields(member.organization, orgAdditionalFields));
		},
		createTeam: async (data) => {
			const { memberCount: _memberCount, ...output } = await (await getCurrentAdapter(baseAdapter)).create({
				model: "team",
				data: {
					...data,
					memberCount: 0
				},
				forceAllowId: true
			});
			return filterOutputFields(output, teamAdditionalFields);
		},
		findTeamById: async ({ teamId, organizationId, includeTeamMembers }) => {
			const result = await (await getCurrentAdapter(baseAdapter)).findOne({
				model: "team",
				where: [{
					field: "id",
					value: teamId
				}, ...organizationId ? [{
					field: "organizationId",
					value: organizationId
				}] : []],
				join: { ...includeTeamMembers ? { teamMember: true } : {} }
			});
			if (!result) return null;
			const { teamMember, memberCount: _memberCount, ...team } = result;
			return {
				...filterOutputFields(team, teamAdditionalFields),
				...includeTeamMembers ? { members: stripTeamMembershipKeys(teamMember ?? []) } : {}
			};
		},
		updateTeam: async (teamId, data) => {
			const adapter = await getCurrentAdapter(baseAdapter);
			if ("id" in data) data.id = void 0;
			const team = await adapter.update({
				model: "team",
				where: [{
					field: "id",
					value: teamId
				}],
				update: { ...data }
			});
			if (!team) return team;
			const { memberCount: _memberCount, ...output } = team;
			return filterOutputFields(output, teamAdditionalFields);
		},
		deleteTeam: async (teamId) => {
			const adapter = await getCurrentAdapter(baseAdapter);
			await adapter.deleteMany({
				model: "teamMember",
				where: [{
					field: "teamId",
					value: teamId
				}]
			});
			return await adapter.delete({
				model: "team",
				where: [{
					field: "id",
					value: teamId
				}]
			});
		},
		listTeams: async (organizationId) => {
			return (await (await getCurrentAdapter(baseAdapter)).findMany({
				model: "team",
				where: [{
					field: "organizationId",
					value: organizationId
				}]
			})).map((team) => {
				const { memberCount: _memberCount, ...output } = team;
				return filterOutputFields(output, teamAdditionalFields);
			});
		},
		createTeamInvitation: async ({ email, role, teamId, organizationId, inviterId, expiresIn = 1728e5 }) => {
			const adapter = await getCurrentAdapter(baseAdapter);
			const expiresAt = getDate(expiresIn);
			return await adapter.create({
				model: "invitation",
				data: {
					email,
					role,
					organizationId,
					teamId,
					inviterId,
					status: "pending",
					expiresAt
				}
			});
		},
		setActiveTeam: async (sessionToken, teamId, ctx) => {
			return await context.internalAdapter.updateSession(sessionToken, { activeTeamId: teamId });
		},
		listTeamMembers: async (data) => {
			return stripTeamMembershipKeys(await (await getCurrentAdapter(baseAdapter)).findMany({
				model: "teamMember",
				where: [{
					field: "teamId",
					value: data.teamId
				}]
			}));
		},
		countTeamMembers: async (data) => {
			return await (await getCurrentAdapter(baseAdapter)).count({
				model: "teamMember",
				where: [{
					field: "teamId",
					value: data.teamId
				}]
			});
		},
		countMembers: async (data) => {
			return await (await getCurrentAdapter(baseAdapter)).count({
				model: "member",
				where: [{
					field: "organizationId",
					value: data.organizationId
				}]
			});
		},
		listTeamsByUser: async (data) => {
			return (await (await getCurrentAdapter(baseAdapter)).findMany({
				model: "teamMember",
				where: [{
					field: "userId",
					value: data.userId
				}],
				join: { team: true }
			})).map((result) => {
				const { memberCount: _memberCount, ...team } = result.team;
				return filterOutputFields(team, teamAdditionalFields);
			});
		},
		findTeamMember: async (data) => {
			const member = await (await getCurrentAdapter(baseAdapter)).findOne({
				model: "teamMember",
				where: [{
					field: "teamId",
					value: data.teamId
				}, {
					field: "userId",
					value: data.userId
				}]
			});
			return member ? stripTeamMembershipKey(member) : null;
		},
		findOrCreateTeamMember: async (data) => {
			return runWithTransaction(baseAdapter, async () => {
				const adapter = await getCurrentAdapter(baseAdapter);
				const membershipKey = await computeTeamMembershipKey(data);
				const existing = await findTeamMemberByKeyOrPair(adapter, {
					...data,
					membershipKey
				});
				if (existing) return stripTeamMembershipKey(existing);
				await syncTeamMemberCount(adapter, data.teamId);
				const result = await createTeamMemberWithKey(adapter, {
					...data,
					membershipKey
				});
				if (result.status === "created") await incrementTeamMemberCount(adapter, data.teamId);
				return stripTeamMembershipKey(result.member);
			});
		},
		/**
		* Adds a user to a team by reserving capacity on the team row before
		* creating the membership row. The durable team counter is the aggregate
		* capacity boundary; the membership key is the single-column uniqueness
		* boundary for a user within a team.
		*/
		addTeamMemberWithLimit: async (data) => {
			return runWithTransaction(baseAdapter, async () => {
				const adapter = await getCurrentAdapter(baseAdapter);
				const membershipKey = await computeTeamMembershipKey(data);
				const existing = await findTeamMemberByKeyOrPair(adapter, {
					teamId: data.teamId,
					userId: data.userId,
					membershipKey
				});
				if (existing) return {
					status: "added",
					member: stripTeamMembershipKey(existing)
				};
				await syncTeamMemberCount(adapter, data.teamId);
				if (!await reserveTeamSeat(adapter, {
					teamId: data.teamId,
					maximumMembersPerTeam: data.maximumMembersPerTeam
				})) return { status: "limitReached" };
				let result;
				try {
					result = await createTeamMemberWithKey(adapter, {
						teamId: data.teamId,
						userId: data.userId,
						membershipKey
					});
				} catch (error) {
					await releaseTeamSeats(adapter, data.teamId, 1);
					throw error;
				}
				if (result.status === "existing") await releaseTeamSeats(adapter, data.teamId, 1);
				return {
					status: "added",
					member: stripTeamMembershipKey(result.member)
				};
			});
		},
		removeTeamMember: async (data) => {
			const adapter = await getCurrentAdapter(baseAdapter);
			const deleted = await adapter.deleteMany({
				model: "teamMember",
				where: [{
					field: "teamId",
					value: data.teamId
				}, {
					field: "userId",
					value: data.userId
				}]
			});
			await releaseTeamSeats(adapter, data.teamId, deleted);
		},
		findInvitationsByTeamId: async (teamId) => {
			return await (await getCurrentAdapter(baseAdapter)).findMany({
				model: "invitation",
				where: [{
					field: "teamId",
					value: teamId
				}]
			});
		},
		listUserInvitations: async (email) => {
			return (await (await getCurrentAdapter(baseAdapter)).findMany({
				model: "invitation",
				where: [{
					field: "email",
					value: email.toLowerCase()
				}],
				join: { organization: true }
			})).filter(Boolean).map(({ organization, ...inv }) => ({
				...inv,
				organizationName: organization?.name
			}));
		},
		createInvitation: async ({ invitation, user }) => {
			const adapter = await getCurrentAdapter(baseAdapter);
			const expiresAt = getDate(options?.invitationExpiresIn || 172800, "sec");
			return await adapter.create({
				model: "invitation",
				data: {
					status: "pending",
					expiresAt,
					createdAt: /* @__PURE__ */ new Date(),
					inviterId: user.id,
					...invitation,
					teamId: invitation.teamIds.length > 0 ? invitation.teamIds.join(",") : null
				},
				forceAllowId: true
			});
		},
		findInvitationById: async (id) => {
			return await (await getCurrentAdapter(baseAdapter)).findOne({
				model: "invitation",
				where: [{
					field: "id",
					value: id
				}]
			});
		},
		findPendingInvitation: async (data) => {
			return (await (await getCurrentAdapter(baseAdapter)).findMany({
				model: "invitation",
				where: [
					{
						field: "email",
						value: data.email.toLowerCase()
					},
					{
						field: "organizationId",
						value: data.organizationId
					},
					{
						field: "status",
						value: "pending"
					}
				]
			})).filter((invite) => new Date(invite.expiresAt) > /* @__PURE__ */ new Date());
		},
		findPendingInvitations: async (data) => {
			return (await (await getCurrentAdapter(baseAdapter)).findMany({
				model: "invitation",
				where: [{
					field: "organizationId",
					value: data.organizationId
				}, {
					field: "status",
					value: "pending"
				}]
			})).filter((invite) => new Date(invite.expiresAt) > /* @__PURE__ */ new Date());
		},
		listInvitations: async (data) => {
			return await (await getCurrentAdapter(baseAdapter)).findMany({
				model: "invitation",
				where: [{
					field: "organizationId",
					value: data.organizationId
				}]
			});
		},
		updateInvitation: async (data) => {
			const adapter = await getCurrentAdapter(baseAdapter);
			const where = [{
				field: "id",
				value: data.invitationId
			}];
			if (data.fromStatus) where.push({
				field: "status",
				value: data.fromStatus
			});
			return await adapter.incrementOne({
				model: "invitation",
				where,
				increment: {},
				set: { status: data.status }
			});
		}
	};
};
function unknownResourceResponse(requestedResource) {
	return {
		success: false,
		error: `You are not allowed to access resource: ${requestedResource}`
	};
}
function unauthorizedResourceResponse(requestedResource) {
	return {
		success: false,
		error: `unauthorized to access resource "${requestedResource}"`
	};
}
function normalizeConnector(connector) {
	return connector === "OR" ? "OR" : "AND";
}
function isActionList(actions) {
	return Array.isArray(actions);
}
function normalizeActionRequest(requestedActions) {
	if (isActionList(requestedActions)) return {
		actions: requestedActions,
		connector: "AND"
	};
	if (!requestedActions || typeof requestedActions !== "object") throw new BetterAuthError("Invalid access control request");
	const { actions, connector } = requestedActions;
	if (!isActionList(actions)) return {
		actions: [],
		connector: normalizeConnector(connector)
	};
	return {
		actions,
		connector: normalizeConnector(connector)
	};
}
function hasAllowedAction(allowedActions, requestedAction) {
	return typeof requestedAction === "string" && allowedActions.includes(requestedAction);
}
function isResourceAuthorized(allowedActions, { actions, connector }) {
	if (actions.length === 0) return false;
	if (connector === "OR") return actions.some((requestedAction) => hasAllowedAction(allowedActions, requestedAction));
	return actions.every((requestedAction) => hasAllowedAction(allowedActions, requestedAction));
}
function role(statements) {
	return {
		authorize(request, connector = "AND") {
			let hasAuthorizedResource = false;
			for (const [requestedResource, requestedActions] of Object.entries(request)) {
				const allowedActions = statements[requestedResource];
				if (!allowedActions) {
					if (connector === "AND") return unknownResourceResponse(requestedResource);
					continue;
				}
				const isAuthorized = isResourceAuthorized(allowedActions, normalizeActionRequest(requestedActions));
				if (isAuthorized) hasAuthorizedResource = true;
				if (isAuthorized && connector === "OR") return { success: true };
				if (!isAuthorized && connector === "AND") return unauthorizedResourceResponse(requestedResource);
			}
			if (hasAuthorizedResource) return { success: true };
			return {
				success: false,
				error: "Not authorized"
			};
		},
		statements
	};
}
function createAccessControl(s) {
	return {
		newRole(statements) {
			return role(statements);
		},
		statements: s
	};
}
var defaultAc = createAccessControl({
	organization: ["update", "delete"],
	member: [
		"create",
		"update",
		"delete"
	],
	invitation: ["create", "cancel"],
	team: [
		"create",
		"update",
		"delete"
	],
	ac: [
		"create",
		"read",
		"update",
		"delete"
	]
});
var adminAc = defaultAc.newRole({
	organization: ["update"],
	invitation: ["create", "cancel"],
	member: [
		"create",
		"update",
		"delete"
	],
	team: [
		"create",
		"update",
		"delete"
	],
	ac: [
		"create",
		"read",
		"update",
		"delete"
	]
});
var ownerAc = defaultAc.newRole({
	organization: ["update", "delete"],
	member: [
		"create",
		"update",
		"delete"
	],
	invitation: ["create", "cancel"],
	team: [
		"create",
		"update",
		"delete"
	],
	ac: [
		"create",
		"read",
		"update",
		"delete"
	]
});
var memberAc = defaultAc.newRole({
	organization: [],
	member: [],
	invitation: [],
	team: [],
	ac: ["read"]
});
var defaultRoles$1 = {
	admin: adminAc,
	owner: ownerAc,
	member: memberAc
};
var hasPermissionFn = (input, acRoles) => {
	if (!input.permissions) return false;
	const roles = input.role.split(",");
	const creatorRole = input.options.creatorRole || "owner";
	const isCreator = roles.includes(creatorRole);
	const allowCreatorsAllPermissions = input.allowCreatorAllPermissions || false;
	if (isCreator && allowCreatorsAllPermissions) return true;
	for (const role of roles) if ((acRoles[role]?.authorize(input.permissions))?.success) return true;
	return false;
};
var cacheAllRoles = /* @__PURE__ */ new Map();
var rolePermissionsSchema = record(string(), array(string()));
var hasPermission = async (input, ctx) => {
	let acRoles = { ...input.options.roles || defaultRoles$1 };
	if (ctx && input.organizationId && input.options.dynamicAccessControl?.enabled && input.options.ac && !input.useMemoryCache) {
		const roles = await ctx.context.adapter.findMany({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: input.organizationId
			}]
		});
		for (const { role, permission: permissionsString } of roles) {
			const permissions = JSON.parse(permissionsString);
			const result = rolePermissionsSchema.safeParse(permissions);
			if (!result.success) {
				ctx.context.logger.error("[hasPermission] Invalid permissions for role " + role, { permissions });
				throw new APIError("INTERNAL_SERVER_ERROR", { message: "Invalid permissions for role " + role });
			}
			const merged = { ...acRoles[role]?.statements };
			for (const [key, actions] of Object.entries(result.data)) merged[key] = [.../* @__PURE__ */ new Set([...merged[key] ?? [], ...actions])];
			acRoles[role] = input.options.ac.newRole(merged);
		}
	}
	if (input.useMemoryCache) acRoles = cacheAllRoles.get(input.organizationId) || acRoles;
	cacheAllRoles.set(input.organizationId, acRoles);
	return hasPermissionFn(input, acRoles);
};
var ORGANIZATION_ERROR_CODES = defineErrorCodes({
	YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION: "You are not allowed to create a new organization",
	YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS: "You have reached the maximum number of organizations",
	ORGANIZATION_ALREADY_EXISTS: "Organization already exists",
	ORGANIZATION_SLUG_ALREADY_TAKEN: "Organization slug already taken",
	ORGANIZATION_NOT_FOUND: "Organization not found",
	USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION: "User is not a member of the organization",
	YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION: "You are not allowed to update this organization",
	YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION: "You are not allowed to delete this organization",
	NO_ACTIVE_ORGANIZATION: "No active organization",
	USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION: "User is already a member of this organization",
	MEMBER_NOT_FOUND: "Member not found",
	ROLE_NOT_FOUND: "Role not found",
	YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_TEAM: "You are not allowed to create a new team",
	TEAM_ALREADY_EXISTS: "Team already exists",
	TEAM_NOT_FOUND: "Team not found",
	YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER: "You cannot leave the organization as the only owner",
	YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER: "You cannot leave the organization without an owner",
	YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER: "You are not allowed to delete this member",
	YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION: "You are not allowed to invite users to this organization",
	USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION: "User is already invited to this organization",
	INVITATION_NOT_FOUND: "Invitation not found",
	YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION: "You are not the recipient of the invitation",
	EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION: "Email verification required before accepting or rejecting invitation",
	EMAIL_VERIFICATION_REQUIRED_FOR_INVITATION: "Email verification required to view or list invitations for the session email",
	YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION: "You are not allowed to cancel this invitation",
	INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION: "Inviter is no longer a member of the organization",
	YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE: "You are not allowed to invite a user with this role",
	FAILED_TO_RETRIEVE_INVITATION: "Failed to retrieve invitation",
	YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_TEAMS: "You have reached the maximum number of teams",
	UNABLE_TO_REMOVE_LAST_TEAM: "Unable to remove last team",
	YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER: "You are not allowed to update this member",
	ORGANIZATION_MEMBERSHIP_LIMIT_REACHED: "Organization membership limit reached",
	YOU_ARE_NOT_ALLOWED_TO_CREATE_TEAMS_IN_THIS_ORGANIZATION: "You are not allowed to create teams in this organization",
	YOU_ARE_NOT_ALLOWED_TO_DELETE_TEAMS_IN_THIS_ORGANIZATION: "You are not allowed to delete teams in this organization",
	YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_TEAM: "You are not allowed to update this team",
	YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_TEAM: "You are not allowed to delete this team",
	INVITATION_LIMIT_REACHED: "Invitation limit reached",
	TEAM_MEMBER_LIMIT_REACHED: "Team member limit reached",
	USER_IS_NOT_A_MEMBER_OF_THE_TEAM: "User is not a member of the team",
	YOU_CAN_NOT_ACCESS_THE_MEMBERS_OF_THIS_TEAM: "You are not allowed to list the members of this team",
	YOU_DO_NOT_HAVE_AN_ACTIVE_TEAM: "You do not have an active team",
	YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_TEAM_MEMBER: "You are not allowed to create a new member",
	YOU_ARE_NOT_ALLOWED_TO_REMOVE_A_TEAM_MEMBER: "You are not allowed to remove a team member",
	YOU_ARE_NOT_ALLOWED_TO_ACCESS_THIS_ORGANIZATION: "You are not allowed to access this organization as an owner",
	YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION: "You are not a member of this organization",
	MISSING_AC_INSTANCE: "Dynamic Access Control requires a pre-defined ac instance on the server auth plugin. Read server logs for more information",
	YOU_MUST_BE_IN_AN_ORGANIZATION_TO_CREATE_A_ROLE: "You must be in an organization to create a role",
	YOU_ARE_NOT_ALLOWED_TO_CREATE_A_ROLE: "You are not allowed to create a role",
	YOU_ARE_NOT_ALLOWED_TO_UPDATE_A_ROLE: "You are not allowed to update a role",
	YOU_ARE_NOT_ALLOWED_TO_DELETE_A_ROLE: "You are not allowed to delete a role",
	YOU_ARE_NOT_ALLOWED_TO_READ_A_ROLE: "You are not allowed to read a role",
	YOU_ARE_NOT_ALLOWED_TO_LIST_A_ROLE: "You are not allowed to list a role",
	YOU_ARE_NOT_ALLOWED_TO_GET_A_ROLE: "You are not allowed to get a role",
	TOO_MANY_ROLES: "This organization has too many roles",
	INVALID_RESOURCE: "The provided permission includes an invalid resource",
	ROLE_NAME_IS_ALREADY_TAKEN: "That role name is already taken",
	CANNOT_DELETE_A_PRE_DEFINED_ROLE: "Cannot delete a pre-defined role",
	ROLE_IS_ASSIGNED_TO_MEMBERS: "Cannot delete a role that is assigned to members. Please reassign the members to a different role first",
	INVALID_TEAM_ID: "Team id contains a reserved character"
});
var shimContext = (originalObject, newContext) => {
	const shimmedObj = {};
	for (const [key, value] of Object.entries(originalObject)) {
		shimmedObj[key] = (ctx) => {
			return value({
				...ctx,
				context: {
					...newContext,
					...ctx.context
				}
			});
		};
		shimmedObj[key].path = value.path;
		shimmedObj[key].method = value.method;
		shimmedObj[key].options = value.options;
		shimmedObj[key].headers = value.headers;
	}
	return shimmedObj;
};
var orgMiddleware = createAuthMiddleware(async () => {
	return {};
});
/**
* The middleware forces the endpoint to require a valid session by utilizing the `sessionMiddleware`.
* It also appends additional types to the session type regarding organizations.
*/
var orgSessionMiddleware = createAuthMiddleware({ use: [sessionMiddleware] }, async (ctx) => {
	return { session: ctx.context.session };
});
function toZodSchema({ fields, isClientSide }) {
	const zodFields = Object.keys(fields).reduce((acc, key) => {
		const field = fields[key];
		if (!field) return acc;
		if (isClientSide && field.input === false) return acc;
		let schema;
		if (field.type === "json") schema = json ? json() : any();
		else if (field.type === "string[]" || field.type === "number[]") schema = array(field.type === "string[]" ? string() : number());
		else if (Array.isArray(field.type)) schema = any();
		else schema = zod_exports[field.type]();
		if (field?.required === false) schema = schema.nullish();
		if (!isClientSide && field?.returned === false) return acc;
		return {
			...acc,
			[key]: schema
		};
	}, {});
	return object(zodFields);
}
var normalizeRoleName = (role) => role.toLowerCase();
var DEFAULT_MAXIMUM_ROLES_PER_ORGANIZATION = Number.POSITIVE_INFINITY;
var getAdditionalFields = (options, shouldBePartial = false) => {
	const additionalFields = options?.schema?.organizationRole?.additionalFields || {};
	if (shouldBePartial) for (const key in additionalFields) additionalFields[key].required = false;
	return {
		additionalFieldsSchema: toZodSchema({
			fields: additionalFields,
			isClientSide: true
		}),
		$AdditionalFields: {},
		$ReturnAdditionalFields: {}
	};
};
var baseCreateOrgRoleSchema = object({
	organizationId: string().optional().meta({ description: "The id of the organization to create the role in. If not provided, the user's active organization will be used." }),
	role: string().meta({ description: "The name of the role to create" }),
	permission: record(string(), array(string())).meta({ description: "The permission to assign to the role" })
});
var createOrgRole = (options) => {
	const { additionalFieldsSchema, $AdditionalFields, $ReturnAdditionalFields } = getAdditionalFields(options, false);
	return createAuthEndpoint("/organization/create-role", {
		method: "POST",
		body: baseCreateOrgRoleSchema.safeExtend({ additionalFields: object({ ...additionalFieldsSchema.shape }).optional() }),
		metadata: { $Infer: { body: {} } },
		requireHeaders: true,
		use: [orgSessionMiddleware]
	}, async (ctx) => {
		const { session, user } = ctx.context.session;
		let roleName = ctx.body.role;
		const permission = ctx.body.permission;
		const additionalFields = ctx.body.additionalFields;
		const ac = options.ac;
		if (!ac) {
			ctx.context.logger.error(`[Dynamic Access Control] The organization plugin is missing a pre-defined ac instance.`, `\nPlease refer to the documentation here: https://better-auth.com/docs/plugins/organization#dynamic-access-control`);
			throw APIError.from("NOT_IMPLEMENTED", ORGANIZATION_ERROR_CODES.MISSING_AC_INSTANCE);
		}
		const organizationId = ctx.body.organizationId ?? session.activeOrganizationId;
		if (!organizationId) {
			ctx.context.logger.error(`[Dynamic Access Control] The session is missing an active organization id to create a role. Either set an active org id, or pass an organizationId in the request body.`);
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.YOU_MUST_BE_IN_AN_ORGANIZATION_TO_CREATE_A_ROLE);
		}
		roleName = normalizeRoleName(roleName);
		await checkIfRoleNameIsTakenByPreDefinedRole({
			role: roleName,
			organizationId,
			options,
			ctx
		});
		const member = await ctx.context.adapter.findOne({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, {
				field: "userId",
				value: user.id,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (!member) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not a member of the organization to create a role.`, {
				userId: user.id,
				organizationId
			});
			throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION);
		}
		if (!await hasPermission({
			options,
			organizationId,
			permissions: { ac: ["create"] },
			role: member.role
		}, ctx)) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not permitted to create a role. If this is unexpected, please make sure the role associated to that member has the "ac" resource with the "create" permission.`, {
				userId: user.id,
				organizationId,
				role: member.role
			});
			throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_CREATE_A_ROLE);
		}
		const maximumRolesPerOrganization = typeof options.dynamicAccessControl?.maximumRolesPerOrganization === "function" ? await options.dynamicAccessControl.maximumRolesPerOrganization(organizationId) : options.dynamicAccessControl?.maximumRolesPerOrganization ?? DEFAULT_MAXIMUM_ROLES_PER_ORGANIZATION;
		const rolesInDB = await ctx.context.adapter.count({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (rolesInDB >= maximumRolesPerOrganization) {
			ctx.context.logger.error(`[Dynamic Access Control] Failed to create a new role, the organization has too many roles. Maximum allowed roles is ${maximumRolesPerOrganization}.`, {
				organizationId,
				maximumRolesPerOrganization,
				rolesInDB
			});
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.TOO_MANY_ROLES);
		}
		await checkForInvalidResources({
			ac,
			ctx,
			permission
		});
		await checkIfMemberHasPermission({
			ctx,
			member,
			options,
			organizationId,
			permissionRequired: permission,
			user,
			action: "create"
		});
		await checkIfRoleNameIsTakenByRoleInDB({
			ctx,
			organizationId,
			role: roleName
		});
		const newRole = ac.newRole(permission);
		const data = {
			...await ctx.context.adapter.create({
				model: "organizationRole",
				data: {
					createdAt: /* @__PURE__ */ new Date(),
					organizationId,
					permission: JSON.stringify(permission),
					role: roleName,
					...additionalFields
				}
			}),
			permission
		};
		return ctx.json({
			success: true,
			roleData: data,
			statements: newRole.statements
		});
	});
};
var deleteOrgRoleBodySchema = object({ organizationId: string().optional().meta({ description: "The id of the organization to create the role in. If not provided, the user's active organization will be used." }) }).and(union([object({ roleName: string().nonempty().meta({ description: "The name of the role to delete" }) }), object({ roleId: string().nonempty().meta({ description: "The id of the role to delete" }) })]));
var deleteOrgRole = (options) => {
	return createAuthEndpoint("/organization/delete-role", {
		method: "POST",
		body: deleteOrgRoleBodySchema,
		requireHeaders: true,
		use: [orgSessionMiddleware],
		metadata: { $Infer: { body: {} } }
	}, async (ctx) => {
		const { session, user } = ctx.context.session;
		const organizationId = ctx.body.organizationId ?? session.activeOrganizationId;
		if (!organizationId) {
			ctx.context.logger.error(`[Dynamic Access Control] The session is missing an active organization id to delete a role. Either set an active org id, or pass an organizationId in the request body.`);
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
		}
		const member = await ctx.context.adapter.findOne({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, {
				field: "userId",
				value: user.id,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (!member) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not a member of the organization to delete a role.`, {
				userId: user.id,
				organizationId
			});
			throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION);
		}
		if (!await hasPermission({
			options,
			organizationId,
			permissions: { ac: ["delete"] },
			role: member.role
		}, ctx)) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not permitted to delete a role. If this is unexpected, please make sure the role associated to that member has the "ac" resource with the "delete" permission.`, {
				userId: user.id,
				organizationId,
				role: member.role
			});
			throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_DELETE_A_ROLE);
		}
		if (ctx.body.roleName) {
			const roleName = ctx.body.roleName;
			const defaultRoles = options.roles ? Object.keys(options.roles) : [
				"owner",
				"admin",
				"member"
			];
			if (defaultRoles.includes(roleName)) {
				ctx.context.logger.error(`[Dynamic Access Control] Cannot delete a pre-defined role.`, {
					roleName,
					organizationId,
					defaultRoles
				});
				throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.CANNOT_DELETE_A_PRE_DEFINED_ROLE);
			}
		}
		let condition;
		if (ctx.body.roleName) condition = {
			field: "role",
			value: ctx.body.roleName,
			operator: "eq",
			connector: "AND"
		};
		else if (ctx.body.roleId) condition = {
			field: "id",
			value: ctx.body.roleId,
			operator: "eq",
			connector: "AND"
		};
		else {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id is not provided in the request body.`);
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND);
		}
		const existingRoleInDB = await ctx.context.adapter.findOne({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, condition]
		});
		if (!existingRoleInDB) {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id does not exist in the database.`, {
				..."roleName" in ctx.body ? { roleName: ctx.body.roleName } : { roleId: ctx.body.roleId },
				organizationId
			});
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND);
		}
		existingRoleInDB.permission = JSON.parse(existingRoleInDB.permission);
		const roleToDelete = existingRoleInDB.role;
		if ((await ctx.context.adapter.findMany({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, {
				field: "role",
				value: roleToDelete,
				operator: "contains"
			}]
		})).find((member) => {
			return member.role.split(",").map((r) => r.trim()).includes(roleToDelete);
		})) {
			ctx.context.logger.error(`[Dynamic Access Control] Cannot delete a role that is assigned to members.`, {
				role: existingRoleInDB.role,
				organizationId
			});
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ROLE_IS_ASSIGNED_TO_MEMBERS);
		}
		await ctx.context.adapter.delete({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, condition]
		});
		return ctx.json({ success: true });
	});
};
var listOrgRolesQuerySchema = object({ organizationId: string().optional().meta({ description: "The id of the organization to list roles for. If not provided, the user's active organization will be used." }) }).optional();
var listOrgRoles = (options) => {
	const { $ReturnAdditionalFields } = getAdditionalFields(options, false);
	return createAuthEndpoint("/organization/list-roles", {
		method: "GET",
		requireHeaders: true,
		use: [orgSessionMiddleware],
		query: listOrgRolesQuerySchema
	}, async (ctx) => {
		const { session, user } = ctx.context.session;
		const organizationId = ctx.query?.organizationId ?? session.activeOrganizationId;
		if (!organizationId) {
			ctx.context.logger.error(`[Dynamic Access Control] The session is missing an active organization id to list roles. Either set an active org id, or pass an organizationId in the request query.`);
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
		}
		const member = await ctx.context.adapter.findOne({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, {
				field: "userId",
				value: user.id,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (!member) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not a member of the organization to list roles.`, {
				userId: user.id,
				organizationId
			});
			throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION);
		}
		if (!await hasPermission({
			options,
			organizationId,
			permissions: { ac: ["read"] },
			role: member.role
		}, ctx)) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not permitted to list roles.`, {
				userId: user.id,
				organizationId,
				role: member.role
			});
			throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_LIST_A_ROLE);
		}
		let roles = await ctx.context.adapter.findMany({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}]
		});
		roles = roles.map((x) => ({
			...x,
			permission: JSON.parse(x.permission)
		}));
		return ctx.json(roles);
	});
};
var getOrgRoleQuerySchema = object({ organizationId: string().optional().meta({ description: "The id of the organization to read a role for. If not provided, the user's active organization will be used." }) }).and(union([object({ roleName: string().nonempty().meta({ description: "The name of the role to read" }) }), object({ roleId: string().nonempty().meta({ description: "The id of the role to read" }) })])).optional();
var getOrgRole = (options) => {
	const { $ReturnAdditionalFields } = getAdditionalFields(options, false);
	return createAuthEndpoint("/organization/get-role", {
		method: "GET",
		requireHeaders: true,
		use: [orgSessionMiddleware],
		query: getOrgRoleQuerySchema,
		metadata: { $Infer: { query: {} } }
	}, async (ctx) => {
		const { session, user } = ctx.context.session;
		const organizationId = ctx.query?.organizationId ?? session.activeOrganizationId;
		if (!organizationId) {
			ctx.context.logger.error(`[Dynamic Access Control] The session is missing an active organization id to read a role. Either set an active org id, or pass an organizationId in the request query.`);
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
		}
		const member = await ctx.context.adapter.findOne({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, {
				field: "userId",
				value: user.id,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (!member) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not a member of the organization to read a role.`, {
				userId: user.id,
				organizationId
			});
			throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION);
		}
		if (!await hasPermission({
			options,
			organizationId,
			permissions: { ac: ["read"] },
			role: member.role
		}, ctx)) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not permitted to read a role.`, {
				userId: user.id,
				organizationId,
				role: member.role
			});
			throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_READ_A_ROLE);
		}
		let condition;
		if (ctx.query.roleName) condition = {
			field: "role",
			value: ctx.query.roleName,
			operator: "eq",
			connector: "AND"
		};
		else if (ctx.query.roleId) condition = {
			field: "id",
			value: ctx.query.roleId,
			operator: "eq",
			connector: "AND"
		};
		else {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id is not provided in the request query.`);
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND);
		}
		const role = await ctx.context.adapter.findOne({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, condition]
		});
		if (!role) {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id does not exist in the database.`, {
				..."roleName" in ctx.query ? { roleName: ctx.query.roleName } : { roleId: ctx.query.roleId },
				organizationId
			});
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND);
		}
		role.permission = JSON.parse(role.permission);
		return ctx.json(role);
	});
};
var roleNameOrIdSchema = union([object({ roleName: string().nonempty().meta({ description: "The name of the role to update" }) }), object({ roleId: string().nonempty().meta({ description: "The id of the role to update" }) })]);
var updateOrgRole = (options) => {
	const { additionalFieldsSchema, $AdditionalFields, $ReturnAdditionalFields } = getAdditionalFields(options, true);
	return createAuthEndpoint("/organization/update-role", {
		method: "POST",
		body: object({
			organizationId: string().optional().meta({ description: "The id of the organization to update the role in. If not provided, the user's active organization will be used." }),
			data: object({
				permission: record(string(), array(string())).optional().meta({ description: "The permission to update the role with" }),
				roleName: string().optional().meta({ description: "The name of the role to update" }),
				...additionalFieldsSchema.shape
			})
		}).and(roleNameOrIdSchema),
		metadata: { $Infer: { body: {} } },
		requireHeaders: true,
		use: [orgSessionMiddleware]
	}, async (ctx) => {
		const { session, user } = ctx.context.session;
		const ac = options.ac;
		if (!ac) {
			ctx.context.logger.error(`[Dynamic Access Control] The organization plugin is missing a pre-defined ac instance.`, `\nPlease refer to the documentation here: https://better-auth.com/docs/plugins/organization#dynamic-access-control`);
			throw APIError.from("NOT_IMPLEMENTED", ORGANIZATION_ERROR_CODES.MISSING_AC_INSTANCE);
		}
		const organizationId = ctx.body.organizationId ?? session.activeOrganizationId;
		if (!organizationId) {
			ctx.context.logger.error(`[Dynamic Access Control] The session is missing an active organization id to update a role. Either set an active org id, or pass an organizationId in the request body.`);
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
		}
		const member = await ctx.context.adapter.findOne({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, {
				field: "userId",
				value: user.id,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (!member) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not a member of the organization to update a role.`, {
				userId: user.id,
				organizationId
			});
			throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION);
		}
		if (!await hasPermission({
			options,
			organizationId,
			role: member.role,
			permissions: { ac: ["update"] }
		}, ctx)) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not permitted to update a role.`);
			throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_A_ROLE);
		}
		let condition;
		if (ctx.body.roleName) condition = {
			field: "role",
			value: ctx.body.roleName,
			operator: "eq",
			connector: "AND"
		};
		else if (ctx.body.roleId) condition = {
			field: "id",
			value: ctx.body.roleId,
			operator: "eq",
			connector: "AND"
		};
		else {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id is not provided in the request body.`);
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND);
		}
		const role = await ctx.context.adapter.findOne({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, condition]
		});
		if (!role) {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id does not exist in the database.`, {
				..."roleName" in ctx.body ? { roleName: ctx.body.roleName } : { roleId: ctx.body.roleId },
				organizationId
			});
			throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND);
		}
		role.permission = role.permission ? JSON.parse(role.permission) : void 0;
		const { permission: _, roleName: __, ...additionalFields } = ctx.body.data;
		const updateData = { ...additionalFields };
		if (ctx.body.data.permission) {
			const newPermission = ctx.body.data.permission;
			await checkForInvalidResources({
				ac,
				ctx,
				permission: newPermission
			});
			await checkIfMemberHasPermission({
				ctx,
				member,
				options,
				organizationId,
				permissionRequired: newPermission,
				user,
				action: "update"
			});
			updateData.permission = newPermission;
		}
		if (ctx.body.data.roleName) {
			let newRoleName = ctx.body.data.roleName;
			newRoleName = normalizeRoleName(newRoleName);
			await checkIfRoleNameIsTakenByPreDefinedRole({
				role: newRoleName,
				organizationId,
				options,
				ctx
			});
			await checkIfRoleNameIsTakenByRoleInDB({
				role: newRoleName,
				organizationId,
				ctx
			});
			updateData.role = newRoleName;
		}
		const update = {
			...updateData,
			...updateData.permission ? { permission: JSON.stringify(updateData.permission) } : {}
		};
		await ctx.context.adapter.updateMany({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, condition],
			update
		});
		return ctx.json({
			success: true,
			roleData: {
				...role,
				...update,
				permission: updateData.permission || role.permission || null
			}
		});
	});
};
async function checkForInvalidResources({ ac, ctx, permission }) {
	const validResources = Object.keys(ac.statements);
	const providedResources = Object.keys(permission);
	if (providedResources.some((r) => !validResources.includes(r))) {
		ctx.context.logger.error(`[Dynamic Access Control] The provided permission includes an invalid resource.`, {
			providedResources,
			validResources
		});
		throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.INVALID_RESOURCE);
	}
}
async function checkIfMemberHasPermission({ ctx, permissionRequired: permission, options, organizationId, member, user, action }) {
	const hasNecessaryPermissions = [];
	const permissionEntries = Object.entries(permission);
	for await (const [resource, permissions] of permissionEntries) for await (const perm of permissions) hasNecessaryPermissions.push({
		resource: { [resource]: [perm] },
		hasPermission: await hasPermission({
			options,
			organizationId,
			permissions: { [resource]: [perm] },
			useMemoryCache: true,
			role: member.role
		}, ctx)
	});
	const missingPermissions = hasNecessaryPermissions.filter((x) => x.hasPermission === false).map((x) => {
		const key = Object.keys(x.resource)[0];
		return `${key}:${x.resource[key][0]}`;
	});
	if (missingPermissions.length > 0) {
		ctx.context.logger.error(`[Dynamic Access Control] The user is missing permissions necessary to ${action} a role with those set of permissions.\n`, {
			userId: user.id,
			organizationId,
			role: member.role,
			missingPermissions
		});
		let error;
		if (action === "create") error = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_CREATE_A_ROLE;
		else if (action === "update") error = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_A_ROLE;
		else if (action === "delete") error = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_DELETE_A_ROLE;
		else if (action === "read") error = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_READ_A_ROLE;
		else if (action === "list") error = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_LIST_A_ROLE;
		else error = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_GET_A_ROLE;
		throw APIError.fromStatus("FORBIDDEN", {
			message: error.message,
			code: error.code,
			missingPermissions
		});
	}
}
async function checkIfRoleNameIsTakenByPreDefinedRole({ options, organizationId, role, ctx }) {
	const defaultRoles = options.roles ? Object.keys(options.roles) : [
		"owner",
		"admin",
		"member"
	];
	if (defaultRoles.includes(role)) {
		ctx.context.logger.error(`[Dynamic Access Control] The role name "${role}" is already taken by a pre-defined role.`, {
			role,
			organizationId,
			defaultRoles
		});
		throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ROLE_NAME_IS_ALREADY_TAKEN);
	}
}
async function checkIfRoleNameIsTakenByRoleInDB({ organizationId, role, ctx }) {
	if (await ctx.context.adapter.findOne({
		model: "organizationRole",
		where: [{
			field: "organizationId",
			value: organizationId,
			operator: "eq",
			connector: "AND"
		}, {
			field: "role",
			value: role,
			operator: "eq",
			connector: "AND"
		}]
	})) {
		ctx.context.logger.error(`[Dynamic Access Control] The role name "${role}" is already taken by a role in the database.`, {
			role,
			organizationId
		});
		throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ROLE_NAME_IS_ALREADY_TAKEN);
	}
}
var baseInvitationSchema = object({
	email: string().meta({ description: "The email address of the user to invite" }),
	role: union([string().meta({ description: "The role to assign to the user" }), array(string().meta({ description: "The roles to assign to the user" }))]).meta({ description: "The role(s) to assign to the user. It can be `admin`, `member`, owner. Eg: \"member\"" }),
	organizationId: string().meta({ description: "The organization ID to invite the user to" }).optional(),
	resend: boolean$1().meta({ description: "Resend the invitation email, if the user is already invited. Eg: true" }).optional(),
	teamId: union([string().meta({ description: "The team ID to invite the user to" }).optional(), array(string()).meta({ description: "The team IDs to invite the user to" }).optional()])
});
var getAdvancedGenerateId = (advancedOptions) => {
	if (typeof advancedOptions !== "object" || advancedOptions === null) return;
	const generateId = advancedOptions.generateId;
	if (typeof generateId !== "function") return;
	return generateId;
};
var hasBuiltInOpaqueInvitationIdGeneration = ({ advancedGenerateId, databaseGenerateId }) => advancedGenerateId === void 0 && (databaseGenerateId === void 0 || databaseGenerateId === "uuid");
var shouldRequireVerifiedEmailForInvitationIdAction = ({ organizationOptions, advancedGenerateId, databaseGenerateId }) => {
	if (organizationOptions.requireEmailVerificationOnInvitation !== void 0) return organizationOptions.requireEmailVerificationOnInvitation;
	return !hasBuiltInOpaqueInvitationIdGeneration({
		advancedGenerateId,
		databaseGenerateId
	});
};
var createInvitation = (option) => {
	const additionalFieldsSchema = toZodSchema({
		fields: option?.schema?.invitation?.additionalFields || {},
		isClientSide: true
	});
	return createAuthEndpoint("/organization/invite-member", {
		method: "POST",
		requireHeaders: true,
		use: [orgMiddleware, orgSessionMiddleware],
		body: object({
			...baseInvitationSchema.shape,
			...additionalFieldsSchema.shape
		}),
		metadata: {
			$Infer: { body: {} },
			openapi: {
				operationId: "createOrganizationInvitation",
				description: "Create an invitation to an organization",
				responses: { "200": {
					description: "Success",
					content: { "application/json": { schema: {
						type: "object",
						properties: {
							id: { type: "string" },
							email: { type: "string" },
							role: { type: "string" },
							organizationId: { type: "string" },
							inviterId: { type: "string" },
							status: { type: "string" },
							expiresAt: { type: "string" },
							createdAt: { type: "string" }
						},
						required: [
							"id",
							"email",
							"role",
							"organizationId",
							"inviterId",
							"status",
							"expiresAt",
							"createdAt"
						]
					} } }
				} }
			}
		}
	}, async (ctx) => {
		const session = ctx.context.session;
		const organizationId = ctx.body.organizationId || session.session.activeOrganizationId;
		if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
		const email$1 = ctx.body.email.toLowerCase();
		if (!email().safeParse(email$1).success) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_EMAIL);
		const adapter = getOrgAdapter(ctx.context, option);
		const member = await adapter.findMemberByOrgId({
			userId: session.user.id,
			organizationId
		});
		if (!member) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND);
		if (!await hasPermission({
			role: member.role,
			options: ctx.context.orgOptions,
			permissions: { invitation: ["create"] },
			organizationId
		}, ctx)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION);
		const creatorRole = ctx.context.orgOptions.creatorRole || "owner";
		const roles = parseRoles(ctx.body.role);
		const rolesArray = roles.split(",").map((r) => r.trim()).filter(Boolean);
		const defaults = Object.keys(defaultRoles$1);
		const customRoles = Object.keys(ctx.context.orgOptions.roles || {});
		const validStaticRoles = /* @__PURE__ */ new Set([...defaults, ...customRoles]);
		const unknownRoles = rolesArray.filter((role) => !validStaticRoles.has(role));
		if (unknownRoles.length > 0) if (ctx.context.orgOptions.dynamicAccessControl?.enabled) {
			const foundRoleNames = (await ctx.context.adapter.findMany({
				model: "organizationRole",
				where: [{
					field: "organizationId",
					value: organizationId
				}, {
					field: "role",
					value: unknownRoles,
					operator: "in"
				}]
			})).map((r) => r.role);
			const stillInvalid = unknownRoles.filter((r) => !foundRoleNames.includes(r));
			if (stillInvalid.length > 0) throw new APIError("BAD_REQUEST", { message: `${ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND}: ${stillInvalid.join(", ")}` });
		} else throw new APIError("BAD_REQUEST", { message: `${ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND}: ${unknownRoles.join(", ")}` });
		if (!member.role.split(",").map((r) => r.trim()).includes(creatorRole) && roles.split(",").includes(creatorRole)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE);
		if (await adapter.findMemberByEmail({
			email: email$1,
			organizationId
		})) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION);
		const alreadyInvited = await adapter.findPendingInvitation({
			email: email$1,
			organizationId
		});
		if (alreadyInvited.length && !ctx.body.resend && !ctx.context.orgOptions.cancelPendingInvitationsOnReInvite) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION);
		const organization = await adapter.findOrganizationById(organizationId);
		if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
		if (alreadyInvited.length && ctx.body.resend) {
			const existingInvitation = alreadyInvited[0];
			const newExpiresAt = getDate(ctx.context.orgOptions.invitationExpiresIn || 172800, "sec");
			await ctx.context.adapter.update({
				model: "invitation",
				where: [{
					field: "id",
					value: existingInvitation.id
				}],
				update: { expiresAt: newExpiresAt }
			});
			const updatedInvitation = {
				...existingInvitation,
				expiresAt: newExpiresAt
			};
			if (ctx.context.orgOptions.sendInvitationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.orgOptions.sendInvitationEmail({
				id: updatedInvitation.id,
				role: updatedInvitation.role,
				email: updatedInvitation.email.toLowerCase(),
				organization,
				inviter: {
					...member,
					user: session.user
				},
				invitation: updatedInvitation
			}, ctx.request));
			return ctx.json(updatedInvitation);
		}
		if (alreadyInvited.length && ctx.context.orgOptions.cancelPendingInvitationsOnReInvite) await adapter.updateInvitation({
			invitationId: alreadyInvited[0].id,
			status: "canceled"
		});
		const invitationLimit = typeof ctx.context.orgOptions.invitationLimit === "function" ? await ctx.context.orgOptions.invitationLimit({
			user: session.user,
			organization,
			member
		}, ctx.context) : ctx.context.orgOptions.invitationLimit ?? 100;
		if ((await adapter.findPendingInvitations({ organizationId })).length >= invitationLimit) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.INVITATION_LIMIT_REACHED);
		if (ctx.context.orgOptions.teams?.enabled && "teamId" in ctx.body && ctx.body.teamId) {
			const requestedTeamIds = typeof ctx.body.teamId === "string" ? [ctx.body.teamId] : ctx.body.teamId;
			if (requestedTeamIds.some((id) => id.includes(","))) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.INVALID_TEAM_ID);
			for (const teamId of requestedTeamIds) if (!await adapter.findTeamById({
				teamId,
				organizationId
			})) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.TEAM_NOT_FOUND);
		}
		if (ctx.context.orgOptions.teams && ctx.context.orgOptions.teams.enabled && typeof ctx.context.orgOptions.teams.maximumMembersPerTeam !== "undefined" && "teamId" in ctx.body && ctx.body.teamId) {
			const teamIds = typeof ctx.body.teamId === "string" ? [ctx.body.teamId] : ctx.body.teamId;
			for (const teamId of teamIds) {
				const team = await adapter.findTeamById({
					teamId,
					organizationId,
					includeTeamMembers: true
				});
				if (!team) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.TEAM_NOT_FOUND);
				const maximumMembersPerTeam = typeof ctx.context.orgOptions.teams.maximumMembersPerTeam === "function" ? await ctx.context.orgOptions.teams.maximumMembersPerTeam({
					teamId,
					session,
					organizationId
				}) : ctx.context.orgOptions.teams.maximumMembersPerTeam;
				if (team.members.length >= maximumMembersPerTeam) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.TEAM_MEMBER_LIMIT_REACHED);
			}
		}
		const teamIds = "teamId" in ctx.body ? typeof ctx.body.teamId === "string" ? [ctx.body.teamId] : ctx.body.teamId ?? [] : [];
		const { email: _, role: __, organizationId: ___, resend: ____, ...additionalFields } = ctx.body;
		let invitationData = {
			role: roles,
			email: email$1,
			organizationId,
			teamIds,
			...additionalFields ? additionalFields : {}
		};
		if (option?.organizationHooks?.beforeCreateInvitation) {
			const response = await option?.organizationHooks.beforeCreateInvitation({
				invitation: {
					...invitationData,
					inviterId: session.user.id,
					teamId: teamIds.length > 0 ? teamIds[0] : void 0
				},
				inviter: session.user,
				organization
			});
			if (response && typeof response === "object" && "data" in response) invitationData = {
				...invitationData,
				...response.data
			};
		}
		const invitation = await adapter.createInvitation({
			invitation: invitationData,
			user: session.user
		});
		if (ctx.context.orgOptions.sendInvitationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.orgOptions.sendInvitationEmail({
			id: invitation.id,
			role: invitation.role,
			email: invitation.email.toLowerCase(),
			organization,
			inviter: {
				...member,
				user: session.user
			},
			invitation
		}, ctx.request));
		if (option?.organizationHooks?.afterCreateInvitation) await option?.organizationHooks.afterCreateInvitation({
			invitation,
			inviter: session.user,
			organization
		});
		return ctx.json(invitation);
	});
};
var acceptInvitationBodySchema = object({ invitationId: string().meta({ description: "The ID of the invitation to accept" }) });
var acceptInvitation = (options) => createAuthEndpoint("/organization/accept-invitation", {
	method: "POST",
	body: acceptInvitationBodySchema,
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	metadata: { openapi: {
		description: "Accept an invitation to an organization",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					invitation: { type: "object" },
					member: { type: "object" }
				}
			} } }
		} }
	} }
}, async (ctx) => {
	const session = ctx.context.session;
	const adapter = getOrgAdapter(ctx.context, options);
	const invitation = await adapter.findInvitationById(ctx.body.invitationId);
	if (!invitation || invitation.expiresAt < /* @__PURE__ */ new Date() || invitation.status !== "pending") throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.INVITATION_NOT_FOUND);
	if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION);
	if (shouldRequireVerifiedEmailForInvitationIdAction({
		organizationOptions: ctx.context.orgOptions,
		advancedGenerateId: getAdvancedGenerateId(ctx.context.options.advanced),
		databaseGenerateId: ctx.context.options.advanced?.database?.generateId
	}) && !session.user.emailVerified) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION);
	const membershipLimit = ctx.context.orgOptions?.membershipLimit || 100;
	const membersCount = await adapter.countMembers({ organizationId: invitation.organizationId });
	const organization = await adapter.findOrganizationById(invitation.organizationId);
	if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
	if (membersCount >= (typeof membershipLimit === "number" ? membershipLimit : await membershipLimit(session.user, organization))) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.ORGANIZATION_MEMBERSHIP_LIMIT_REACHED);
	if (options?.organizationHooks?.beforeAcceptInvitation) await options?.organizationHooks.beforeAcceptInvitation({
		invitation,
		user: session.user,
		organization
	});
	const acceptedI = await adapter.updateInvitation({
		invitationId: ctx.body.invitationId,
		status: "accepted",
		fromStatus: "pending"
	});
	if (!acceptedI) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.INVITATION_NOT_FOUND);
	const member = await runWithTransaction(ctx.context.adapter, async () => {
		if (ctx.context.orgOptions.teams && ctx.context.orgOptions.teams.enabled && "teamId" in acceptedI && acceptedI.teamId) {
			const teamIds = acceptedI.teamId.split(",");
			const onlyOne = teamIds.length === 1;
			for (const teamId of teamIds) {
				if (!await adapter.findTeamById({
					teamId,
					organizationId: acceptedI.organizationId
				})) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.TEAM_NOT_FOUND);
				if (typeof ctx.context.orgOptions.teams.maximumMembersPerTeam !== "undefined") {
					const maximumMembersPerTeam = typeof ctx.context.orgOptions.teams.maximumMembersPerTeam === "function" ? await ctx.context.orgOptions.teams.maximumMembersPerTeam({
						teamId,
						session,
						organizationId: acceptedI.organizationId
					}) : ctx.context.orgOptions.teams.maximumMembersPerTeam;
					if ((await adapter.addTeamMemberWithLimit({
						teamId,
						userId: session.user.id,
						maximumMembersPerTeam
					})).status === "limitReached") throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.TEAM_MEMBER_LIMIT_REACHED);
				} else await adapter.findOrCreateTeamMember({
					teamId,
					userId: session.user.id
				});
			}
			if (onlyOne) {
				const teamId = teamIds[0];
				await setSessionCookie(ctx, {
					session: await adapter.setActiveTeam(session.session.token, teamId, ctx),
					user: session.user
				});
			}
		}
		const createdMember = await adapter.createMember({
			organizationId: acceptedI.organizationId,
			userId: session.user.id,
			role: acceptedI.role,
			createdAt: /* @__PURE__ */ new Date()
		});
		await adapter.setActiveOrganization(session.session.token, acceptedI.organizationId, ctx);
		return createdMember;
	}).catch(async (error) => {
		await adapter.updateInvitation({
			invitationId: ctx.body.invitationId,
			status: "pending",
			fromStatus: "accepted"
		});
		throw error;
	});
	if (options?.organizationHooks?.afterAcceptInvitation) await options?.organizationHooks.afterAcceptInvitation({
		invitation: acceptedI,
		member,
		user: session.user,
		organization
	});
	return ctx.json({
		invitation: acceptedI,
		member
	});
});
var rejectInvitationBodySchema = object({ invitationId: string().meta({ description: "The ID of the invitation to reject" }) });
var rejectInvitation = (options) => createAuthEndpoint("/organization/reject-invitation", {
	method: "POST",
	body: rejectInvitationBodySchema,
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	metadata: { openapi: {
		description: "Reject an invitation to an organization",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					invitation: { type: "object" },
					member: {
						type: "object",
						nullable: true
					}
				}
			} } }
		} }
	} }
}, async (ctx) => {
	const session = ctx.context.session;
	const adapter = getOrgAdapter(ctx.context, ctx.context.orgOptions);
	const invitation = await adapter.findInvitationById(ctx.body.invitationId);
	if (!invitation || invitation.status !== "pending") throw APIError.from("BAD_REQUEST", {
		message: "Invitation not found!",
		code: "INVITATION_NOT_FOUND"
	});
	if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION);
	if (shouldRequireVerifiedEmailForInvitationIdAction({
		organizationOptions: ctx.context.orgOptions,
		advancedGenerateId: getAdvancedGenerateId(ctx.context.options.advanced),
		databaseGenerateId: ctx.context.options.advanced?.database?.generateId
	}) && !session.user.emailVerified) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION);
	const organization = await adapter.findOrganizationById(invitation.organizationId);
	if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
	if (options?.organizationHooks?.beforeRejectInvitation) await options?.organizationHooks.beforeRejectInvitation({
		invitation,
		user: session.user,
		organization
	});
	const rejectedI = await adapter.updateInvitation({
		invitationId: ctx.body.invitationId,
		status: "rejected"
	});
	if (options?.organizationHooks?.afterRejectInvitation) await options?.organizationHooks.afterRejectInvitation({
		invitation: rejectedI || invitation,
		user: session.user,
		organization
	});
	return ctx.json({
		invitation: rejectedI,
		member: null
	});
});
var cancelInvitationBodySchema = object({ invitationId: string().meta({ description: "The ID of the invitation to cancel" }) });
var cancelInvitation = (options) => createAuthEndpoint("/organization/cancel-invitation", {
	method: "POST",
	body: cancelInvitationBodySchema,
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	openapi: {
		operationId: "cancelOrganizationInvitation",
		description: "Cancel an invitation to an organization",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { invitation: { type: "object" } }
			} } }
		} }
	}
}, async (ctx) => {
	const session = ctx.context.session;
	const adapter = getOrgAdapter(ctx.context, options);
	const invitation = await adapter.findInvitationById(ctx.body.invitationId);
	if (!invitation) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.INVITATION_NOT_FOUND);
	const member = await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId: invitation.organizationId
	});
	if (!member) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND);
	if (!await hasPermission({
		role: member.role,
		options: ctx.context.orgOptions,
		permissions: { invitation: ["cancel"] },
		organizationId: invitation.organizationId
	}, ctx)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION);
	const organization = await adapter.findOrganizationById(invitation.organizationId);
	if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
	if (options?.organizationHooks?.beforeCancelInvitation) await options?.organizationHooks.beforeCancelInvitation({
		invitation,
		cancelledBy: session.user,
		organization
	});
	const canceledI = await adapter.updateInvitation({
		invitationId: ctx.body.invitationId,
		status: "canceled"
	});
	if (options?.organizationHooks?.afterCancelInvitation) await options?.organizationHooks.afterCancelInvitation({
		invitation: canceledI || invitation,
		cancelledBy: session.user,
		organization
	});
	return ctx.json(canceledI);
});
var getInvitationQuerySchema = object({ id: string().meta({ description: "The ID of the invitation to get" }) });
var getInvitation = (options) => createAuthEndpoint("/organization/get-invitation", {
	method: "GET",
	use: [orgMiddleware],
	requireHeaders: true,
	query: getInvitationQuerySchema,
	metadata: { openapi: {
		description: "Get an invitation by ID",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					id: { type: "string" },
					email: { type: "string" },
					role: { type: "string" },
					organizationId: { type: "string" },
					inviterId: { type: "string" },
					status: { type: "string" },
					expiresAt: { type: "string" },
					organizationName: { type: "string" },
					organizationSlug: { type: "string" },
					inviterEmail: { type: "string" }
				},
				required: [
					"id",
					"email",
					"role",
					"organizationId",
					"inviterId",
					"status",
					"expiresAt",
					"organizationName",
					"organizationSlug",
					"inviterEmail"
				]
			} } }
		} }
	} }
}, async (ctx) => {
	const session = await getSessionFromCtx(ctx);
	if (!session) throw APIError.fromStatus("UNAUTHORIZED", { message: "Not authenticated" });
	const adapter = getOrgAdapter(ctx.context, options);
	const invitation = await adapter.findInvitationById(ctx.query.id);
	if (!invitation || invitation.status !== "pending" || invitation.expiresAt < /* @__PURE__ */ new Date()) throw APIError.fromStatus("BAD_REQUEST", { message: "Invitation not found!" });
	if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION);
	if (shouldRequireVerifiedEmailForInvitationIdAction({
		organizationOptions: ctx.context.orgOptions,
		advancedGenerateId: getAdvancedGenerateId(ctx.context.options.advanced),
		databaseGenerateId: ctx.context.options.advanced?.database?.generateId
	}) && !session.user.emailVerified) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED_FOR_INVITATION);
	const organization = await adapter.findOrganizationById(invitation.organizationId);
	if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
	const member = await adapter.findMemberByOrgId({
		userId: invitation.inviterId,
		organizationId: invitation.organizationId
	});
	if (!member) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION);
	return ctx.json({
		...invitation,
		organizationName: organization.name,
		organizationSlug: organization.slug,
		inviterEmail: member.user.email
	});
});
var listInvitationQuerySchema = object({ organizationId: string().meta({ description: "The ID of the organization to list invitations for" }).optional() }).optional();
var listInvitations = (options) => createAuthEndpoint("/organization/list-invitations", {
	method: "GET",
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	query: listInvitationQuerySchema
}, async (ctx) => {
	const session = await getSessionFromCtx(ctx);
	if (!session) throw APIError.fromStatus("UNAUTHORIZED", { message: "Not authenticated" });
	const orgId = ctx.query?.organizationId || session.session.activeOrganizationId;
	if (!orgId) throw APIError.fromStatus("BAD_REQUEST", { message: "Organization ID is required" });
	const adapter = getOrgAdapter(ctx.context, options);
	if (!await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId: orgId
	})) throw APIError.fromStatus("FORBIDDEN", { message: "You are not a member of this organization" });
	const invitations = await adapter.listInvitations({ organizationId: orgId });
	return ctx.json(invitations);
});
/**
* List all invitations a user has received
*/
var listUserInvitations = (options) => createAuthEndpoint("/organization/list-user-invitations", {
	method: "GET",
	use: [orgMiddleware],
	query: object({ email: string().meta({ description: "The email of the user to list invitations for. This only works for server side API calls." }).optional() }).optional(),
	metadata: { openapi: {
		description: "List all invitations a user has received",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "array",
				items: {
					type: "object",
					properties: {
						id: { type: "string" },
						email: { type: "string" },
						role: { type: "string" },
						organizationId: { type: "string" },
						organizationName: { type: "string" },
						inviterId: {
							type: "string",
							description: "The ID of the user who created the invitation"
						},
						teamId: {
							type: "string",
							description: "The ID of the team associated with the invitation",
							nullable: true
						},
						status: { type: "string" },
						expiresAt: { type: "string" },
						createdAt: { type: "string" }
					},
					required: [
						"id",
						"email",
						"role",
						"organizationId",
						"organizationName",
						"inviterId",
						"status",
						"expiresAt",
						"createdAt"
					]
				}
			} } }
		} }
	} }
}, async (ctx) => {
	const session = await getSessionFromCtx(ctx);
	if (ctx.request && ctx.query?.email) throw APIError.fromStatus("BAD_REQUEST", { message: "User email cannot be passed for client side API calls." });
	if (session && !session.user.emailVerified) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED_FOR_INVITATION);
	const userEmail = session?.user.email || ctx.query?.email;
	if (!userEmail) throw APIError.fromStatus("BAD_REQUEST", { message: "Missing session headers, or email query parameter." });
	const pendingInvitations = (await getOrgAdapter(ctx.context, options).listUserInvitations(userEmail)).filter((inv) => inv.status === "pending");
	return ctx.json(pendingInvitations);
});
var baseMemberSchema = object({
	userId: string$1().meta({ description: "The user Id which represents the user to be added as a member. If `null` is provided, then it's expected to provide session headers. Eg: \"user-id\"" }),
	role: union([string(), array(string())]).meta({ description: "The role(s) to assign to the new member. Eg: [\"admin\", \"sale\"]" }),
	organizationId: string().meta({ description: "An optional organization ID to pass. If not provided, will default to the user's active organization. Eg: \"org-id\"" }).optional(),
	teamId: string().meta({ description: "An optional team ID to add the member to. Eg: \"team-id\"" }).optional()
});
var addMember = (option) => {
	const additionalFieldsSchema = toZodSchema({
		fields: option?.schema?.member?.additionalFields || {},
		isClientSide: true
	});
	return createAuthEndpoint({
		method: "POST",
		body: object({
			...baseMemberSchema.shape,
			...additionalFieldsSchema.shape
		}),
		use: [orgMiddleware],
		metadata: {
			$Infer: { body: {} },
			openapi: {
				operationId: "addOrganizationMember",
				description: "Add a member to an organization"
			}
		}
	}, async (ctx) => {
		const session = ctx.body.userId ? await getSessionFromCtx(ctx).catch((e) => null) : null;
		const orgId = ctx.body.organizationId || session?.session.activeOrganizationId;
		if (!orgId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
		const teamId = "teamId" in ctx.body ? ctx.body.teamId : void 0;
		if (teamId && !ctx.context.orgOptions.teams?.enabled) {
			ctx.context.logger.error("Teams are not enabled");
			throw APIError.fromStatus("BAD_REQUEST", { message: "Teams are not enabled" });
		}
		const adapter = getOrgAdapter(ctx.context, option);
		const user = await ctx.context.internalAdapter.findUserById(ctx.body.userId);
		if (!user) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.USER_NOT_FOUND);
		if (await adapter.findMemberByEmail({
			email: user.email,
			organizationId: orgId
		})) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION);
		if (teamId) {
			const team = await adapter.findTeamById({
				teamId,
				organizationId: orgId
			});
			if (!team || team.organizationId !== orgId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.TEAM_NOT_FOUND);
		}
		const membershipLimit = ctx.context.orgOptions?.membershipLimit || 100;
		const count = await adapter.countMembers({ organizationId: orgId });
		const organization = await adapter.findOrganizationById(orgId);
		if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
		if (count >= (typeof membershipLimit === "number" ? membershipLimit : await membershipLimit(user, organization))) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.ORGANIZATION_MEMBERSHIP_LIMIT_REACHED);
		const { role: _, userId: __, organizationId: ___, ...additionalFields } = ctx.body;
		let memberData = {
			organizationId: orgId,
			userId: user.id,
			role: parseRoles(ctx.body.role),
			createdAt: /* @__PURE__ */ new Date(),
			...additionalFields ? additionalFields : {}
		};
		if (option?.organizationHooks?.beforeAddMember) {
			const response = await option?.organizationHooks.beforeAddMember({
				member: {
					userId: user.id,
					organizationId: orgId,
					role: parseRoles(ctx.body.role),
					...additionalFields
				},
				user,
				organization
			});
			if (response && typeof response === "object" && "data" in response) memberData = {
				...memberData,
				...response.data
			};
		}
		const createdMember = await adapter.createMember(memberData);
		if (teamId) try {
			if (typeof ctx.context.orgOptions.teams?.maximumMembersPerTeam !== "undefined") {
				const configuredMaximumMembersPerTeam = ctx.context.orgOptions.teams.maximumMembersPerTeam;
				let maximumMembersPerTeam;
				if (typeof configuredMaximumMembersPerTeam === "function") {
					if (!session) throw APIError.fromStatus("UNAUTHORIZED");
					maximumMembersPerTeam = await configuredMaximumMembersPerTeam({
						teamId,
						session: {
							user: session.user,
							session: session.session
						},
						organizationId: orgId
					});
				} else maximumMembersPerTeam = configuredMaximumMembersPerTeam;
				if ((await adapter.addTeamMemberWithLimit({
					userId: user.id,
					teamId,
					maximumMembersPerTeam
				})).status === "limitReached") throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.TEAM_MEMBER_LIMIT_REACHED);
			} else await adapter.findOrCreateTeamMember({
				userId: user.id,
				teamId
			});
		} catch (error) {
			await adapter.deleteMember({
				memberId: createdMember.id,
				organizationId: orgId,
				userId: user.id
			});
			throw error;
		}
		if (option?.organizationHooks?.afterAddMember) await option?.organizationHooks.afterAddMember({
			member: createdMember,
			user,
			organization
		});
		return ctx.json(createdMember);
	});
};
var removeMemberBodySchema = object({
	memberIdOrEmail: string().meta({ description: "The ID or email of the member to remove" }),
	/**
	* If not provided, the active organization will be used
	*/
	organizationId: string().meta({ description: "The ID of the organization to remove the member from. If not provided, the active organization will be used. Eg: \"org-id\"" }).optional()
});
var removeMember = (options) => createAuthEndpoint("/organization/remove-member", {
	method: "POST",
	body: removeMemberBodySchema,
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	metadata: { openapi: {
		description: "Remove a member from an organization",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { member: {
					type: "object",
					properties: {
						id: { type: "string" },
						userId: { type: "string" },
						organizationId: { type: "string" },
						role: { type: "string" }
					},
					required: [
						"id",
						"userId",
						"organizationId",
						"role"
					]
				} },
				required: ["member"]
			} } }
		} }
	} }
}, async (ctx) => {
	const session = ctx.context.session;
	const organizationId = ctx.body.organizationId || session.session.activeOrganizationId;
	if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
	const adapter = getOrgAdapter(ctx.context, options);
	const member = await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId
	});
	if (!member) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND);
	let toBeRemovedMember = null;
	if (ctx.body.memberIdOrEmail.includes("@")) toBeRemovedMember = await adapter.findMemberByEmail({
		email: ctx.body.memberIdOrEmail,
		organizationId
	});
	else {
		const result = await adapter.findMemberById(ctx.body.memberIdOrEmail);
		if (!result) toBeRemovedMember = null;
		else {
			const { user: _user, ...member } = result;
			toBeRemovedMember = member;
		}
	}
	if (!toBeRemovedMember) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND);
	const roles = toBeRemovedMember.role.split(",");
	const creatorRole = ctx.context.orgOptions?.creatorRole || "owner";
	if (roles.includes(creatorRole)) {
		if (!member.role.split(",").map((r) => r.trim()).includes(creatorRole)) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER);
		const { members } = await adapter.listMembers({ organizationId });
		if (members.filter((member) => {
			return member.role.split(",").includes(creatorRole);
		}).length <= 1) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER);
	}
	if (!await hasPermission({
		role: member.role,
		options: ctx.context.orgOptions,
		permissions: { member: ["delete"] },
		organizationId
	}, ctx)) throw APIError.from("UNAUTHORIZED", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER);
	if (toBeRemovedMember?.organizationId !== organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND);
	const organization = await adapter.findOrganizationById(organizationId);
	if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
	const userBeingRemoved = await ctx.context.internalAdapter.findUserById(toBeRemovedMember.userId);
	if (!userBeingRemoved) throw APIError.fromStatus("BAD_REQUEST", { message: "User not found" });
	if (options?.organizationHooks?.beforeRemoveMember) await options?.organizationHooks.beforeRemoveMember({
		member: toBeRemovedMember,
		user: userBeingRemoved,
		organization
	});
	await adapter.deleteMember({
		memberId: toBeRemovedMember.id,
		organizationId,
		userId: toBeRemovedMember.userId
	});
	if (session.user.id === toBeRemovedMember.userId && session.session.activeOrganizationId === toBeRemovedMember.organizationId) await adapter.setActiveOrganization(session.session.token, null, ctx);
	if (options?.organizationHooks?.afterRemoveMember) await options?.organizationHooks.afterRemoveMember({
		member: toBeRemovedMember,
		user: userBeingRemoved,
		organization
	});
	return ctx.json({ member: toBeRemovedMember });
});
var updateMemberRoleBodySchema = object({
	role: union([string(), array(string())]).meta({ description: "The new role to be applied. This can be a string or array of strings representing the roles. Eg: [\"admin\", \"sale\"]" }),
	memberId: string().meta({ description: "The member id to apply the role update to. Eg: \"member-id\"" }),
	organizationId: string().meta({ description: "An optional organization ID which the member is a part of to apply the role update. If not provided, you must provide session headers to get the active organization. Eg: \"organization-id\"" }).optional()
});
var updateMemberRole = (option) => createAuthEndpoint("/organization/update-member-role", {
	method: "POST",
	body: updateMemberRoleBodySchema,
	use: [orgMiddleware, orgSessionMiddleware],
	requireHeaders: true,
	metadata: {
		$Infer: { body: {} },
		openapi: {
			operationId: "updateOrganizationMemberRole",
			description: "Update the role of a member in an organization",
			responses: { "200": {
				description: "Success",
				content: { "application/json": { schema: {
					type: "object",
					properties: { member: {
						type: "object",
						properties: {
							id: { type: "string" },
							userId: { type: "string" },
							organizationId: { type: "string" },
							role: { type: "string" }
						},
						required: [
							"id",
							"userId",
							"organizationId",
							"role"
						]
					} },
					required: ["member"]
				} } }
			} }
		}
	}
}, async (ctx) => {
	const session = ctx.context.session;
	if (!ctx.body.role) throw APIError.fromStatus("BAD_REQUEST");
	const organizationId = ctx.body.organizationId || session.session.activeOrganizationId;
	if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
	const adapter = getOrgAdapter(ctx.context, ctx.context.orgOptions);
	const roleToSet = (Array.isArray(ctx.body.role) ? ctx.body.role : [ctx.body.role]).flatMap((role) => role.split(",")).map((role) => role.trim()).filter(Boolean);
	if (roleToSet.length === 0) throw APIError.fromStatus("BAD_REQUEST");
	const member = await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId
	});
	if (!member) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND);
	const toBeUpdatedMember = member.id !== ctx.body.memberId ? await adapter.findMemberById(ctx.body.memberId) : member;
	if (!toBeUpdatedMember) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND);
	if (!(toBeUpdatedMember.organizationId === organizationId)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER);
	const creatorRole = ctx.context.orgOptions?.creatorRole || "owner";
	const updatingMemberRoles = member.role.split(",");
	const isUpdatingCreator = toBeUpdatedMember.role.split(",").includes(creatorRole);
	const updaterIsCreator = updatingMemberRoles.includes(creatorRole);
	const isSettingCreatorRole = roleToSet.includes(creatorRole);
	const memberIsUpdatingThemselves = member.id === toBeUpdatedMember.id;
	if (isUpdatingCreator && !updaterIsCreator || isSettingCreatorRole && !updaterIsCreator) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER);
	if (updaterIsCreator && memberIsUpdatingThemselves) {
		if ((await ctx.context.adapter.findMany({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId
			}]
		})).filter((member) => {
			return member.role.split(",").includes(creatorRole);
		}).length <= 1 && !isSettingCreatorRole) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER);
	}
	if (!await hasPermission({
		role: member.role,
		options: ctx.context.orgOptions,
		permissions: { member: ["update"] },
		allowCreatorAllPermissions: true,
		organizationId
	}, ctx)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER);
	const validStaticRoles = /* @__PURE__ */ new Set([...Object.keys(defaultRoles$1), ...Object.keys(ctx.context.orgOptions.roles || {})]);
	const unknownRoles = roleToSet.filter((role) => !validStaticRoles.has(role));
	if (unknownRoles.length > 0) if (ctx.context.orgOptions.dynamicAccessControl?.enabled) {
		const foundRoleNames = (await ctx.context.adapter.findMany({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId
			}, {
				field: "role",
				value: unknownRoles,
				operator: "in"
			}]
		})).map((role) => role.role);
		const stillInvalid = unknownRoles.filter((role) => !foundRoleNames.includes(role));
		if (stillInvalid.length > 0) throw new APIError("BAD_REQUEST", {
			code: ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND.code,
			message: `${ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND.code}: ${stillInvalid.join(", ")}`
		});
	} else throw new APIError("BAD_REQUEST", {
		code: ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND.code,
		message: `${ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND.code}: ${unknownRoles.join(", ")}`
	});
	const organization = await adapter.findOrganizationById(organizationId);
	if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
	const userBeingUpdated = await ctx.context.internalAdapter.findUserById(toBeUpdatedMember.userId);
	if (!userBeingUpdated) throw APIError.fromStatus("BAD_REQUEST", { message: "User not found" });
	const previousRole = toBeUpdatedMember.role;
	const newRole = parseRoles(roleToSet);
	if (option?.organizationHooks?.beforeUpdateMemberRole) {
		const response = await option?.organizationHooks.beforeUpdateMemberRole({
			member: toBeUpdatedMember,
			newRole,
			user: userBeingUpdated,
			organization
		});
		if (response && typeof response === "object" && "data" in response) {
			const updatedMember = await adapter.updateMember(ctx.body.memberId, response.data.role || newRole);
			if (!updatedMember) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND);
			if (option?.organizationHooks?.afterUpdateMemberRole) await option?.organizationHooks.afterUpdateMemberRole({
				member: updatedMember,
				previousRole,
				user: userBeingUpdated,
				organization
			});
			return ctx.json(updatedMember);
		}
	}
	const updatedMember = await adapter.updateMember(ctx.body.memberId, newRole);
	if (!updatedMember) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND);
	if (option?.organizationHooks?.afterUpdateMemberRole) await option?.organizationHooks.afterUpdateMemberRole({
		member: updatedMember,
		previousRole,
		user: userBeingUpdated,
		organization
	});
	return ctx.json(updatedMember);
});
var getActiveMember = (options) => createAuthEndpoint("/organization/get-active-member", {
	method: "GET",
	use: [orgMiddleware, orgSessionMiddleware],
	requireHeaders: true,
	metadata: { openapi: {
		description: "Get the member details of the active organization",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					id: { type: "string" },
					userId: { type: "string" },
					organizationId: { type: "string" },
					role: { type: "string" }
				},
				required: [
					"id",
					"userId",
					"organizationId",
					"role"
				]
			} } }
		} }
	} }
}, async (ctx) => {
	const session = ctx.context.session;
	const organizationId = session.session.activeOrganizationId;
	if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
	const member = await getOrgAdapter(ctx.context, options).findMemberByOrgId({
		userId: session.user.id,
		organizationId
	});
	if (!member) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND);
	return ctx.json(member);
});
var leaveOrganizationBodySchema = object({ organizationId: string().meta({ description: "The organization Id for the member to leave. Eg: \"organization-id\"" }) });
var leaveOrganization = (options) => createAuthEndpoint("/organization/leave", {
	method: "POST",
	body: leaveOrganizationBodySchema,
	requireHeaders: true,
	use: [sessionMiddleware, orgMiddleware]
}, async (ctx) => {
	const session = ctx.context.session;
	const adapter = getOrgAdapter(ctx.context, options);
	const member = await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId: ctx.body.organizationId
	});
	if (!member) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND);
	const creatorRole = ctx.context.orgOptions?.creatorRole || "owner";
	if (member.role.split(",").includes(creatorRole)) {
		if ((await ctx.context.adapter.findMany({
			model: "member",
			where: [{
				field: "organizationId",
				value: ctx.body.organizationId
			}]
		})).filter((member) => member.role.split(",").includes(creatorRole)).length <= 1) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER);
	}
	await adapter.deleteMember({
		memberId: member.id,
		organizationId: ctx.body.organizationId,
		userId: session.user.id
	});
	if (session.session.activeOrganizationId === ctx.body.organizationId) await adapter.setActiveOrganization(session.session.token, null, ctx);
	return ctx.json(member);
});
var listMembers = (options) => createAuthEndpoint("/organization/list-members", {
	method: "GET",
	query: object({
		limit: string().meta({ description: "The number of users to return" }).or(number()).optional(),
		offset: string().meta({ description: "The offset to start from" }).or(number()).optional(),
		sortBy: string().meta({ description: "The field to sort by" }).optional(),
		sortDirection: _enum(["asc", "desc"]).meta({ description: "The direction to sort by" }).optional(),
		filterField: string().meta({ description: "The field to filter by" }).optional(),
		filterValue: string().meta({ description: "The value to filter by" }).or(number()).or(boolean$1()).or(array(string())).or(array(number())).optional(),
		filterOperator: _enum(whereOperators).meta({ description: "The operator to use for the filter" }).optional(),
		organizationId: string().meta({ description: "The organization ID to list members for. If not provided, will default to the user's active organization. Eg: \"organization-id\"" }).optional(),
		organizationSlug: string().meta({ description: "The organization slug to list members for. If not provided, will default to the user's active organization. Eg: \"organization-slug\"" }).optional()
	}).optional(),
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware]
}, async (ctx) => {
	const session = ctx.context.session;
	let organizationId = ctx.query?.organizationId || session.session.activeOrganizationId;
	const adapter = getOrgAdapter(ctx.context, options);
	if (ctx.query?.organizationSlug) {
		const organization = await adapter.findOrganizationBySlug(ctx.query?.organizationSlug);
		if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
		organizationId = organization.id;
	}
	if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
	if (!await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId
	})) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION);
	const { members, total } = await adapter.listMembers({
		organizationId,
		limit: ctx.query?.limit ? Number(ctx.query.limit) : void 0,
		offset: ctx.query?.offset ? Number(ctx.query.offset) : void 0,
		sortBy: ctx.query?.sortBy,
		sortOrder: ctx.query?.sortDirection,
		filter: ctx.query?.filterField ? {
			field: ctx.query?.filterField,
			operator: ctx.query.filterOperator,
			value: ctx.query.filterValue
		} : void 0
	});
	return ctx.json({
		members,
		total
	});
});
var getActiveMemberRoleQuerySchema = object({
	userId: string().meta({ description: "The user ID to get the role for. If not provided, will default to the current user's" }).optional(),
	organizationId: string().meta({ description: "The organization ID to list members for. If not provided, will default to the user's active organization. Eg: \"organization-id\"" }).optional(),
	organizationSlug: string().meta({ description: "The organization slug to list members for. If not provided, will default to the user's active organization. Eg: \"organization-slug\"" }).optional()
}).optional();
var getActiveMemberRole = (options) => createAuthEndpoint("/organization/get-active-member-role", {
	method: "GET",
	query: getActiveMemberRoleQuerySchema,
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware]
}, async (ctx) => {
	const session = ctx.context.session;
	let organizationId = ctx.query?.organizationId || session.session.activeOrganizationId;
	const adapter = getOrgAdapter(ctx.context, options);
	if (ctx.query?.organizationSlug) {
		const organization = await adapter.findOrganizationBySlug(ctx.query?.organizationSlug);
		if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
		organizationId = organization.id;
	}
	if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
	const isMember = await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId
	});
	if (!isMember) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION);
	if (!ctx.query?.userId) return ctx.json({ role: isMember.role });
	const userIdToGetRole = ctx.query?.userId;
	const member = await adapter.findMemberByOrgId({
		userId: userIdToGetRole,
		organizationId
	});
	if (!member) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION);
	return ctx.json({ role: member?.role });
});
var baseOrganizationSchema = object({
	name: string().min(1).meta({ description: "The name of the organization" }),
	slug: string().min(1).meta({ description: "The slug of the organization" }),
	userId: string$1().meta({ description: "The user id of the organization creator. If not provided, the current user will be used. Should only be used by admins or when called by the server. server-only. Eg: \"user-id\"" }).optional(),
	logo: string().meta({ description: "The logo of the organization" }).nullish(),
	metadata: record(string(), any()).meta({ description: "The metadata of the organization" }).optional(),
	keepCurrentActiveOrganization: boolean$1().meta({ description: "Whether to keep the current active organization active after creating a new one. Eg: true" }).optional()
});
var createOrganization = (options) => {
	const additionalFieldsSchema = toZodSchema({
		fields: options?.schema?.organization?.additionalFields || {},
		isClientSide: true
	});
	return createAuthEndpoint("/organization/create", {
		method: "POST",
		body: object({
			...baseOrganizationSchema.shape,
			...additionalFieldsSchema.shape
		}),
		use: [orgMiddleware],
		metadata: {
			$Infer: { body: {} },
			openapi: {
				description: "Create an organization",
				responses: { "200": {
					description: "Success",
					content: { "application/json": { schema: {
						type: "object",
						description: "The organization that was created",
						$ref: "#/components/schemas/Organization"
					} } }
				} }
			}
		}
	}, async (ctx) => {
		const session = await getSessionFromCtx(ctx);
		if (!session && (ctx.request || ctx.headers)) throw APIError.fromStatus("UNAUTHORIZED");
		let user = session?.user || null;
		if (!user) {
			if (!ctx.body.userId) throw APIError.fromStatus("UNAUTHORIZED");
			user = await ctx.context.internalAdapter.findUserById(ctx.body.userId);
		}
		if (!user) throw APIError.fromStatus("UNAUTHORIZED");
		const options = ctx.context.orgOptions;
		const canCreateOrg = typeof options?.allowUserToCreateOrganization === "function" ? await options.allowUserToCreateOrganization(user) : options?.allowUserToCreateOrganization === void 0 ? true : options.allowUserToCreateOrganization;
		const isSystemAction = !session && ctx.body.userId;
		if (!canCreateOrg && !isSystemAction) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION);
		const adapter = getOrgAdapter(ctx.context, options);
		const userOrganizations = await adapter.listOrganizations(user.id);
		if (typeof options.organizationLimit === "number" ? userOrganizations.length >= options.organizationLimit : typeof options.organizationLimit === "function" ? await options.organizationLimit(user) : false) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS);
		if (await adapter.findOrganizationBySlug(ctx.body.slug)) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_ALREADY_EXISTS);
		let { keepCurrentActiveOrganization: _, userId: __, ...orgData } = ctx.body;
		if (options?.organizationHooks?.beforeCreateOrganization) {
			const response = await options?.organizationHooks.beforeCreateOrganization({
				organization: orgData,
				user
			});
			if (response && typeof response === "object" && "data" in response) orgData = {
				...ctx.body,
				...response.data
			};
		}
		const organization = await adapter.createOrganization({ organization: {
			...orgData,
			createdAt: /* @__PURE__ */ new Date()
		} });
		let member;
		let teamMember = null;
		let data = {
			userId: user.id,
			organizationId: organization.id,
			role: ctx.context.orgOptions.creatorRole || "owner"
		};
		if (options?.organizationHooks?.beforeAddMember) {
			const response = await options?.organizationHooks.beforeAddMember({
				member: {
					userId: user.id,
					organizationId: organization.id,
					role: ctx.context.orgOptions.creatorRole || "owner"
				},
				user,
				organization
			});
			if (response && typeof response === "object" && "data" in response) data = {
				...data,
				...response.data
			};
		}
		member = await adapter.createMember(data);
		if (options?.organizationHooks?.afterAddMember) await options?.organizationHooks.afterAddMember({
			member,
			user,
			organization
		});
		if (options?.teams?.enabled && options.teams.defaultTeam?.enabled !== false) {
			let teamData = {
				organizationId: organization.id,
				name: `${organization.name}`,
				createdAt: /* @__PURE__ */ new Date()
			};
			if (options?.organizationHooks?.beforeCreateTeam) {
				const response = await options?.organizationHooks.beforeCreateTeam({
					team: {
						organizationId: organization.id,
						name: `${organization.name}`
					},
					user,
					organization
				});
				if (response && typeof response === "object" && "data" in response) teamData = {
					...teamData,
					...response.data
				};
			}
			const defaultTeam = await options.teams.defaultTeam?.customCreateDefaultTeam?.(organization, ctx) || await adapter.createTeam(teamData);
			teamMember = await adapter.findOrCreateTeamMember({
				teamId: defaultTeam.id,
				userId: user.id
			});
			if (options?.organizationHooks?.afterCreateTeam) await options?.organizationHooks.afterCreateTeam({
				team: defaultTeam,
				user,
				organization
			});
		}
		if (options?.organizationHooks?.afterCreateOrganization) await options?.organizationHooks.afterCreateOrganization({
			organization,
			user,
			member
		});
		if (ctx.context.session && !ctx.body.keepCurrentActiveOrganization) await adapter.setActiveOrganization(ctx.context.session.session.token, organization.id, ctx);
		if (teamMember && ctx.context.session && !ctx.body.keepCurrentActiveOrganization) await adapter.setActiveTeam(ctx.context.session.session.token, teamMember.teamId, ctx);
		return ctx.json({
			...organization,
			metadata: organization.metadata && typeof organization.metadata === "string" ? JSON.parse(organization.metadata) : organization.metadata,
			members: [member]
		});
	});
};
var checkOrganizationSlugBodySchema = object({ slug: string().meta({ description: "The organization slug to check. Eg: \"my-org\"" }) });
var checkOrganizationSlug = (options) => createAuthEndpoint("/organization/check-slug", {
	method: "POST",
	body: checkOrganizationSlugBodySchema,
	use: [requestOnlySessionMiddleware, orgMiddleware]
}, async (ctx) => {
	if (!await getOrgAdapter(ctx.context, options).findOrganizationBySlug(ctx.body.slug)) return ctx.json({ status: true });
	throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_SLUG_ALREADY_TAKEN);
});
var baseUpdateOrganizationSchema = object({
	name: string().min(1).meta({ description: "The name of the organization" }).optional(),
	slug: string().min(1).meta({ description: "The slug of the organization" }).optional(),
	logo: string().meta({ description: "The logo of the organization" }).nullish(),
	metadata: record(string(), any()).meta({ description: "The metadata of the organization" }).optional()
});
var updateOrganization = (options) => {
	const additionalFieldsSchema = toZodSchema({
		fields: options?.schema?.organization?.additionalFields || {},
		isClientSide: true
	});
	return createAuthEndpoint("/organization/update", {
		method: "POST",
		body: object({
			data: object({
				...additionalFieldsSchema.shape,
				...baseUpdateOrganizationSchema.shape
			}).partial(),
			organizationId: string().meta({ description: "The organization ID. Eg: \"org-id\"" }).optional()
		}),
		requireHeaders: true,
		use: [orgMiddleware],
		metadata: {
			$Infer: { body: {} },
			openapi: {
				description: "Update an organization",
				responses: { "200": {
					description: "Success",
					content: { "application/json": { schema: {
						type: "object",
						description: "The updated organization",
						$ref: "#/components/schemas/Organization"
					} } }
				} }
			}
		}
	}, async (ctx) => {
		const session = await ctx.context.getSession(ctx);
		if (!session) throw APIError.fromStatus("UNAUTHORIZED", { message: "User not found" });
		const organizationId = ctx.body.organizationId || session.session.activeOrganizationId;
		if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
		const adapter = getOrgAdapter(ctx.context, options);
		const member = await adapter.findMemberByOrgId({
			userId: session.user.id,
			organizationId
		});
		if (!member) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION);
		if (!await hasPermission({
			permissions: { organization: ["update"] },
			role: member.role,
			options: ctx.context.orgOptions,
			organizationId
		}, ctx)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION);
		if (typeof ctx.body.data.slug === "string") {
			const existingOrganization = await adapter.findOrganizationBySlug(ctx.body.data.slug);
			if (existingOrganization && existingOrganization.id !== organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_SLUG_ALREADY_TAKEN);
		}
		if (options?.organizationHooks?.beforeUpdateOrganization) {
			const response = await options.organizationHooks.beforeUpdateOrganization({
				organization: ctx.body.data,
				user: session.user,
				member
			});
			if (response && typeof response === "object" && "data" in response) ctx.body.data = {
				...ctx.body.data,
				...response.data
			};
		}
		const updatedOrg = await adapter.updateOrganization(organizationId, ctx.body.data);
		if (options?.organizationHooks?.afterUpdateOrganization) await options.organizationHooks.afterUpdateOrganization({
			organization: updatedOrg,
			user: session.user,
			member
		});
		return ctx.json(updatedOrg);
	});
};
var deleteOrganizationBodySchema = object({ organizationId: string().meta({ description: "The organization id to delete" }) });
var deleteOrganization = (options) => {
	return createAuthEndpoint("/organization/delete", {
		method: "POST",
		body: deleteOrganizationBodySchema,
		requireHeaders: true,
		use: [orgMiddleware],
		metadata: { openapi: {
			description: "Delete an organization",
			responses: { "200": {
				description: "Success",
				content: { "application/json": { schema: {
					type: "string",
					description: "The organization id that was deleted"
				} } }
			} }
		} }
	}, async (ctx) => {
		if (ctx.context.orgOptions.disableOrganizationDeletion) throw APIError.from("NOT_FOUND", {
			message: "Organization deletion is disabled",
			code: "ORGANIZATION_DELETION_DISABLED"
		});
		const session = await ctx.context.getSession(ctx);
		if (!session) throw APIError.fromStatus("UNAUTHORIZED");
		const organizationId = ctx.body.organizationId;
		if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
		const adapter = getOrgAdapter(ctx.context, options);
		const member = await adapter.findMemberByOrgId({
			userId: session.user.id,
			organizationId
		});
		if (!member) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION);
		if (!await hasPermission({
			role: member.role,
			permissions: { organization: ["delete"] },
			organizationId,
			options: ctx.context.orgOptions
		}, ctx)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION);
		if (organizationId === session.session.activeOrganizationId)
 /**
		* If the organization is deleted, we set the active organization to null
		*/
		await adapter.setActiveOrganization(session.session.token, null, ctx);
		const org = await adapter.findOrganizationById(organizationId);
		if (!org) throw APIError.fromStatus("BAD_REQUEST");
		if (options?.organizationHooks?.beforeDeleteOrganization) await options.organizationHooks.beforeDeleteOrganization({
			organization: org,
			user: session.user
		}, ctx);
		await adapter.deleteOrganization(organizationId);
		if (options?.organizationHooks?.afterDeleteOrganization) await options.organizationHooks.afterDeleteOrganization({
			organization: org,
			user: session.user
		}, ctx);
		return ctx.json(org);
	});
};
var getOrganizationQuerySchema = optional(object({
	organizationId: string().meta({ description: "The organization id to get" }).optional(),
	organizationSlug: string().meta({ description: "The organization slug to get" }).optional()
}));
var getOrganization = (options) => createAuthEndpoint("/organization/get-organization", {
	method: "GET",
	query: getOrganizationQuerySchema,
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	metadata: { openapi: {
		operationId: "getOrganization",
		description: "Get the organization metadata",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				description: "The organization",
				$ref: "#/components/schemas/Organization"
			} } }
		} }
	} }
}, async (ctx) => {
	const session = ctx.context.session;
	const organizationId = ctx.query?.organizationSlug || ctx.query?.organizationId || session.session.activeOrganizationId;
	if (!organizationId) return ctx.json(null, { status: 200 });
	const adapter = getOrgAdapter(ctx.context, options);
	const organization = ctx.query?.organizationSlug ? await adapter.findOrganizationBySlug(organizationId) : await adapter.findOrganizationById(organizationId);
	if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
	if (!await adapter.checkMembership({
		userId: session.user.id,
		organizationId: organization.id
	})) {
		await adapter.setActiveOrganization(session.session.token, null, ctx);
		throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION);
	}
	return ctx.json(organization);
});
var getFullOrganizationQuerySchema = optional(object({
	organizationId: string().meta({ description: "The organization id to get" }).optional(),
	organizationSlug: string().meta({ description: "The organization slug to get" }).optional(),
	membersLimit: number().or(string().transform((val) => parseInt(val))).meta({ description: "The limit of members to get. By default, it uses the membershipLimit option." }).optional()
}));
var getFullOrganization = (options) => createAuthEndpoint("/organization/get-full-organization", {
	method: "GET",
	query: getFullOrganizationQuerySchema,
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	metadata: { openapi: {
		operationId: "getFullOrganization",
		description: "Get the full organization",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				description: "The organization",
				$ref: "#/components/schemas/Organization"
			} } }
		} }
	} }
}, async (ctx) => {
	const session = ctx.context.session;
	const organizationId = ctx.query?.organizationSlug || ctx.query?.organizationId || session.session.activeOrganizationId;
	if (!organizationId) return ctx.json(null, { status: 200 });
	const adapter = getOrgAdapter(ctx.context, options);
	const organization = await adapter.findFullOrganization({
		organizationId,
		isSlug: !!ctx.query?.organizationSlug,
		includeTeams: ctx.context.orgOptions.teams?.enabled,
		membersLimit: ctx.query?.membersLimit
	});
	if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
	if (!await adapter.checkMembership({
		userId: session.user.id,
		organizationId: organization.id
	})) {
		await adapter.setActiveOrganization(session.session.token, null, ctx);
		throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION);
	}
	return ctx.json(organization);
});
var setActiveOrganizationBodySchema = object({
	organizationId: string().meta({ description: "The organization id to set as active. It can be null to unset the active organization. Eg: \"org-id\"" }).nullable().optional(),
	organizationSlug: string().meta({ description: "The organization slug to set as active. It can be null to unset the active organization if organizationId is not provided. Eg: \"org-slug\"" }).optional()
});
var setActiveOrganization = (options) => {
	return createAuthEndpoint("/organization/set-active", {
		method: "POST",
		body: setActiveOrganizationBodySchema,
		use: [orgSessionMiddleware, orgMiddleware],
		requireHeaders: true,
		metadata: { openapi: {
			operationId: "setActiveOrganization",
			description: "Set the active organization",
			responses: { "200": {
				description: "Success",
				content: { "application/json": { schema: {
					type: "object",
					description: "The organization",
					$ref: "#/components/schemas/Organization"
				} } }
			} }
		} }
	}, async (ctx) => {
		const adapter = getOrgAdapter(ctx.context, options);
		const session = ctx.context.session;
		let organizationId = ctx.body.organizationId;
		const organizationSlug = ctx.body.organizationSlug;
		if (organizationId === null) {
			if (!session.session.activeOrganizationId) return ctx.json(null);
			await setSessionCookie(ctx, {
				session: await adapter.setActiveOrganization(session.session.token, null, ctx),
				user: session.user
			});
			return ctx.json(null);
		}
		if (!organizationId && !organizationSlug) {
			const sessionOrgId = session.session.activeOrganizationId;
			if (!sessionOrgId) return ctx.json(null);
			organizationId = sessionOrgId;
		}
		if (organizationSlug && !organizationId) {
			const organization = await adapter.findOrganizationBySlug(organizationSlug);
			if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
			organizationId = organization.id;
		}
		if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
		if (!await adapter.checkMembership({
			userId: session.user.id,
			organizationId
		})) {
			await adapter.setActiveOrganization(session.session.token, null, ctx);
			throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION);
		}
		const organization = await adapter.findOrganizationById(organizationId);
		if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
		await setSessionCookie(ctx, {
			session: await adapter.setActiveOrganization(session.session.token, organization.id, ctx),
			user: session.user
		});
		return ctx.json(organization);
	});
};
var listOrganizations = (options) => createAuthEndpoint("/organization/list", {
	method: "GET",
	use: [orgMiddleware, orgSessionMiddleware],
	requireHeaders: true,
	metadata: { openapi: {
		description: "List all organizations",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "array",
				items: { $ref: "#/components/schemas/Organization" }
			} } }
		} }
	} }
}, async (ctx) => {
	const organizations = await getOrgAdapter(ctx.context, options).listOrganizations(ctx.context.session.user.id);
	return ctx.json(organizations);
});
var roleSchema = string();
var invitationStatus = _enum([
	"pending",
	"accepted",
	"rejected",
	"canceled"
]).default("pending");
object({
	id: string().default(generateId),
	name: string(),
	slug: string(),
	logo: string().nullish().optional(),
	metadata: record(string(), unknown()).or(string().transform((v) => JSON.parse(v))).optional(),
	createdAt: date()
});
object({
	id: string().default(generateId),
	organizationId: string(),
	userId: string$1(),
	role: roleSchema,
	createdAt: date().default(() => /* @__PURE__ */ new Date())
});
object({
	id: string().default(generateId),
	organizationId: string(),
	email: string(),
	role: roleSchema,
	status: invitationStatus,
	teamId: string().nullish(),
	inviterId: string(),
	expiresAt: date(),
	createdAt: date().default(() => /* @__PURE__ */ new Date())
});
var teamSchema = object({
	id: string().default(generateId),
	name: string().min(1),
	organizationId: string(),
	createdAt: date(),
	updatedAt: date().optional()
});
object({
	id: string().default(generateId),
	teamId: string(),
	userId: string(),
	createdAt: date().default(() => /* @__PURE__ */ new Date())
});
object({
	id: string().default(generateId),
	organizationId: string(),
	role: string(),
	permission: record(string(), array(string())),
	createdAt: date().default(() => /* @__PURE__ */ new Date()),
	updatedAt: date().optional()
});
var defaultRoles = [
	"admin",
	"member",
	"owner"
];
union([_enum(defaultRoles), array(_enum(defaultRoles))]);
var teamBaseSchema = object({
	name: string().meta({ description: "The name of the team. Eg: \"my-team\"" }),
	organizationId: string().meta({ description: "The organization ID which the team will be created in. Defaults to the active organization. Eg: \"organization-id\"" }).optional()
});
var createTeam = (options) => {
	const additionalFieldsSchema = toZodSchema({
		fields: options?.schema?.team?.additionalFields ?? {},
		isClientSide: true
	});
	return createAuthEndpoint("/organization/create-team", {
		method: "POST",
		body: object({
			...teamBaseSchema.shape,
			...additionalFieldsSchema.shape
		}),
		use: [orgMiddleware],
		metadata: {
			$Infer: { body: {} },
			openapi: {
				description: "Create a new team within an organization",
				responses: { "200": {
					description: "Team created successfully",
					content: { "application/json": { schema: {
						type: "object",
						properties: {
							id: {
								type: "string",
								description: "Unique identifier of the created team"
							},
							name: {
								type: "string",
								description: "Name of the team"
							},
							organizationId: {
								type: "string",
								description: "ID of the organization the team belongs to"
							},
							createdAt: {
								type: "string",
								format: "date-time",
								description: "Timestamp when the team was created"
							},
							updatedAt: {
								type: "string",
								format: "date-time",
								description: "Timestamp when the team was last updated"
							}
						},
						required: [
							"id",
							"name",
							"organizationId",
							"createdAt",
							"updatedAt"
						]
					} } }
				} }
			}
		}
	}, async (ctx) => {
		const session = await getSessionFromCtx(ctx);
		const organizationId = ctx.body.organizationId || session?.session.activeOrganizationId;
		if (!session && (ctx.request || ctx.headers)) throw APIError.fromStatus("UNAUTHORIZED");
		if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
		const adapter = getOrgAdapter(ctx.context, options);
		if (session) {
			const member = await adapter.findMemberByOrgId({
				userId: session.user.id,
				organizationId
			});
			if (!member) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION);
			if (!await hasPermission({
				role: member.role,
				options: ctx.context.orgOptions,
				permissions: { team: ["create"] },
				organizationId
			}, ctx)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_CREATE_TEAMS_IN_THIS_ORGANIZATION);
		}
		const existingTeams = await adapter.listTeams(organizationId);
		const maximum = typeof ctx.context.orgOptions.teams?.maximumTeams === "function" ? await ctx.context.orgOptions.teams?.maximumTeams({
			organizationId,
			session
		}, ctx) : ctx.context.orgOptions.teams?.maximumTeams;
		if (maximum ? existingTeams.length >= maximum : false) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_TEAMS);
		const { name, organizationId: _, ...additionalFields } = ctx.body;
		const organization = await adapter.findOrganizationById(organizationId);
		if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
		let teamData = {
			name,
			organizationId,
			createdAt: /* @__PURE__ */ new Date(),
			updatedAt: /* @__PURE__ */ new Date(),
			...additionalFields
		};
		if (options?.organizationHooks?.beforeCreateTeam) {
			const response = await options?.organizationHooks.beforeCreateTeam({
				team: {
					name,
					organizationId,
					...additionalFields
				},
				user: session?.user,
				organization
			});
			if (response && typeof response === "object" && "data" in response) teamData = {
				...teamData,
				...response.data
			};
		}
		const createdTeam = await adapter.createTeam(teamData);
		if (options?.organizationHooks?.afterCreateTeam) await options?.organizationHooks.afterCreateTeam({
			team: createdTeam,
			user: session?.user,
			organization
		});
		return ctx.json(createdTeam);
	});
};
var removeTeamBodySchema = object({
	teamId: string().meta({ description: `The team ID of the team to remove. Eg: "team-id"` }),
	organizationId: string().meta({ description: `The organization ID which the team falls under. If not provided, it will default to the user's active organization. Eg: "organization-id"` }).optional()
});
var removeTeam = (options) => createAuthEndpoint("/organization/remove-team", {
	method: "POST",
	body: removeTeamBodySchema,
	use: [orgMiddleware],
	metadata: { openapi: {
		description: "Remove a team from an organization",
		responses: { "200": {
			description: "Team removed successfully",
			content: { "application/json": { schema: {
				type: "object",
				properties: { message: {
					type: "string",
					description: "Confirmation message indicating successful removal",
					enum: ["Team removed successfully."]
				} },
				required: ["message"]
			} } }
		} }
	} }
}, async (ctx) => {
	const session = await getSessionFromCtx(ctx);
	const organizationId = ctx.body.organizationId || session?.session.activeOrganizationId;
	if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
	if (!session && (ctx.request || ctx.headers)) throw APIError.fromStatus("UNAUTHORIZED");
	const adapter = getOrgAdapter(ctx.context, options);
	if (session) {
		const member = await adapter.findMemberByOrgId({
			userId: session.user.id,
			organizationId
		});
		if (!member || session.session?.activeTeamId === ctx.body.teamId) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_TEAM);
		if (!await hasPermission({
			role: member.role,
			options: ctx.context.orgOptions,
			permissions: { team: ["delete"] },
			organizationId
		}, ctx)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_DELETE_TEAMS_IN_THIS_ORGANIZATION);
	}
	const team = await adapter.findTeamById({
		teamId: ctx.body.teamId,
		organizationId
	});
	if (!team || team.organizationId !== organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.TEAM_NOT_FOUND);
	if (!ctx.context.orgOptions.teams?.allowRemovingAllTeams) {
		if ((await adapter.listTeams(organizationId)).length <= 1) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.UNABLE_TO_REMOVE_LAST_TEAM);
	}
	const organization = await adapter.findOrganizationById(organizationId);
	if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
	if (options?.organizationHooks?.beforeDeleteTeam) await options?.organizationHooks.beforeDeleteTeam({
		team,
		user: session?.user,
		organization
	});
	await runWithTransaction(ctx.context.adapter, async () => {
		await adapter.deleteTeam(team.id);
		const pendingInvitations = await adapter.findPendingInvitations({ organizationId });
		const trx = await getCurrentAdapter(ctx.context.adapter);
		for (const invitation of pendingInvitations) {
			if (!("teamId" in invitation) || !invitation.teamId) continue;
			const teamIds = invitation.teamId.split(",");
			if (!teamIds.includes(team.id)) continue;
			const remainingTeamIds = teamIds.filter((id) => id !== team.id);
			await trx.update({
				model: "invitation",
				where: [{
					field: "id",
					value: invitation.id
				}],
				update: { teamId: remainingTeamIds.length > 0 ? remainingTeamIds.join(",") : null }
			});
		}
	});
	if (options?.organizationHooks?.afterDeleteTeam) await options?.organizationHooks.afterDeleteTeam({
		team,
		user: session?.user,
		organization
	});
	return ctx.json({ message: "Team removed successfully." });
});
var updateTeam = (options) => {
	const additionalFieldsSchema = toZodSchema({
		fields: options?.schema?.team?.additionalFields ?? {},
		isClientSide: true
	});
	return createAuthEndpoint("/organization/update-team", {
		method: "POST",
		body: object({
			teamId: string().meta({ description: `The ID of the team to be updated. Eg: "team-id"` }),
			data: object({
				...teamSchema.omit({
					id: true,
					createdAt: true,
					updatedAt: true
				}).shape,
				...additionalFieldsSchema.shape
			}).partial()
		}),
		requireHeaders: true,
		use: [orgMiddleware, orgSessionMiddleware],
		metadata: {
			$Infer: { body: {} },
			openapi: {
				description: "Update an existing team in an organization",
				responses: { "200": {
					description: "Team updated successfully",
					content: { "application/json": { schema: {
						type: "object",
						properties: {
							id: {
								type: "string",
								description: "Unique identifier of the updated team"
							},
							name: {
								type: "string",
								description: "Updated name of the team"
							},
							organizationId: {
								type: "string",
								description: "ID of the organization the team belongs to"
							},
							createdAt: {
								type: "string",
								format: "date-time",
								description: "Timestamp when the team was created"
							},
							updatedAt: {
								type: "string",
								format: "date-time",
								description: "Timestamp when the team was last updated"
							}
						},
						required: [
							"id",
							"name",
							"organizationId",
							"createdAt",
							"updatedAt"
						]
					} } }
				} }
			}
		}
	}, async (ctx) => {
		const session = ctx.context.session;
		const organizationId = ctx.body.data.organizationId || session.session.activeOrganizationId;
		if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
		const adapter = getOrgAdapter(ctx.context, options);
		const member = await adapter.findMemberByOrgId({
			userId: session.user.id,
			organizationId
		});
		if (!member) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_TEAM);
		if (!await hasPermission({
			role: member.role,
			options: ctx.context.orgOptions,
			permissions: { team: ["update"] },
			organizationId
		}, ctx)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_TEAM);
		const team = await adapter.findTeamById({
			teamId: ctx.body.teamId,
			organizationId
		});
		if (!team || team.organizationId !== organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.TEAM_NOT_FOUND);
		const { name, organizationId: __, ...additionalFields } = ctx.body.data;
		const organization = await adapter.findOrganizationById(organizationId);
		if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
		const updates = {
			name,
			...additionalFields
		};
		if (options?.organizationHooks?.beforeUpdateTeam) {
			const response = await options?.organizationHooks.beforeUpdateTeam({
				team,
				updates,
				user: session.user,
				organization
			});
			if (response && typeof response === "object" && "data" in response) {
				const modifiedUpdates = response.data;
				const updatedTeam = await adapter.updateTeam(team.id, modifiedUpdates);
				if (options?.organizationHooks?.afterUpdateTeam) await options?.organizationHooks.afterUpdateTeam({
					team: updatedTeam,
					user: session.user,
					organization
				});
				return ctx.json(updatedTeam);
			}
		}
		const updatedTeam = await adapter.updateTeam(team.id, updates);
		if (options?.organizationHooks?.afterUpdateTeam) await options?.organizationHooks.afterUpdateTeam({
			team: updatedTeam,
			user: session.user,
			organization
		});
		return ctx.json(updatedTeam);
	});
};
var listOrganizationTeamsQuerySchema = optional(object({ organizationId: string().meta({ description: `The organization ID which the teams are under to list. Defaults to the users active organization. Eg: "organization-id"` }).optional() }));
var listOrganizationTeams = (options) => createAuthEndpoint("/organization/list-teams", {
	method: "GET",
	query: listOrganizationTeamsQuerySchema,
	metadata: { openapi: {
		description: "List all teams in an organization",
		responses: { "200": {
			description: "Teams retrieved successfully",
			content: { "application/json": { schema: {
				type: "array",
				items: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Unique identifier of the team"
						},
						name: {
							type: "string",
							description: "Name of the team"
						},
						organizationId: {
							type: "string",
							description: "ID of the organization the team belongs to"
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Timestamp when the team was created"
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Timestamp when the team was last updated"
						}
					},
					required: [
						"id",
						"name",
						"organizationId",
						"createdAt",
						"updatedAt"
					]
				},
				description: "Array of team objects within the organization"
			} } }
		} }
	} },
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware]
}, async (ctx) => {
	const session = ctx.context.session;
	const organizationId = ctx.query?.organizationId || session?.session.activeOrganizationId;
	if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
	const adapter = getOrgAdapter(ctx.context, options);
	if (!await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId: organizationId || ""
	})) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_ACCESS_THIS_ORGANIZATION);
	const teams = await adapter.listTeams(organizationId);
	return ctx.json(teams);
});
var setActiveTeamBodySchema = object({ teamId: string().meta({ description: "The team id to set as active. It can be null to unset the active team" }).nullable().optional() });
var setActiveTeam = (options) => createAuthEndpoint("/organization/set-active-team", {
	method: "POST",
	body: setActiveTeamBodySchema,
	requireHeaders: true,
	use: [orgSessionMiddleware, orgMiddleware],
	metadata: { openapi: {
		description: "Set the active team for the current active organization",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				description: "The team",
				$ref: "#/components/schemas/Team"
			} } }
		} }
	} }
}, async (ctx) => {
	const adapter = getOrgAdapter(ctx.context, ctx.context.orgOptions);
	const session = ctx.context.session;
	if (ctx.body.teamId === null) {
		if (!session.session.activeTeamId) return ctx.json(null);
		await setSessionCookie(ctx, {
			session: await adapter.setActiveTeam(session.session.token, null, ctx),
			user: session.user
		});
		return ctx.json(null);
	}
	let teamId;
	if (!ctx.body.teamId) {
		const sessionTeamId = session.session.activeTeamId;
		if (!sessionTeamId) return ctx.json(null);
		else teamId = sessionTeamId;
	} else teamId = ctx.body.teamId;
	const activeOrganizationId = session.session.activeOrganizationId;
	if (!activeOrganizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
	const team = await adapter.findTeamById({
		teamId,
		organizationId: activeOrganizationId
	});
	if (!team) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.TEAM_NOT_FOUND);
	if (!await adapter.findTeamMember({
		teamId,
		userId: session.user.id
	})) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_TEAM);
	await setSessionCookie(ctx, {
		session: await adapter.setActiveTeam(session.session.token, team.id, ctx),
		user: session.user
	});
	return ctx.json(team);
});
var listUserTeams = (options) => createAuthEndpoint("/organization/list-user-teams", {
	method: "GET",
	query: object({
		userId: string().optional().meta({ description: "The user ID to list teams for. Defaults to the current session user." }),
		organizationId: string().optional().meta({ description: "The organization ID to scope the team list to. When omitted on a self-query, teams are returned across every organization the user belongs to. When querying another user, falls back to the session's active organization and is required if there is no active organization." })
	}).optional(),
	metadata: { openapi: {
		description: "List teams for a user. Without parameters, returns teams for the current user across every organization they belong to. Pass `organizationId` to scope the result to a specific organization. Pass `userId` to list teams for another member; this requires `member:update` permission in the target organization (the explicit `organizationId` if provided, otherwise the session's active organization).",
		responses: { "200": {
			description: "Teams retrieved successfully",
			content: { "application/json": { schema: {
				type: "array",
				items: {
					type: "object",
					description: "The team",
					$ref: "#/components/schemas/Team"
				},
				description: "Array of team objects within the organization"
			} } }
		} }
	} },
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware]
}, async (ctx) => {
	const session = ctx.context.session;
	const adapter = getOrgAdapter(ctx.context, ctx.context.orgOptions);
	const targetUserId = ctx.query?.userId || session.user.id;
	const isSelf = targetUserId === session.user.id;
	const organizationId = ctx.query?.organizationId || session.session.activeOrganizationId;
	const isExplicitOrg = Boolean(ctx.query?.organizationId);
	if (!isSelf) {
		if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
		const requesterMember = await adapter.findMemberByOrgId({
			userId: session.user.id,
			organizationId
		});
		if (!requesterMember) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION);
		if (!await hasPermission({
			role: requesterMember.role,
			options: ctx.context.orgOptions,
			permissions: { member: ["update"] },
			organizationId
		}, ctx)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER);
		if (!await adapter.findMemberByOrgId({
			userId: targetUserId,
			organizationId
		})) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION);
		const teams = await adapter.listTeamsByUser({ userId: targetUserId });
		return ctx.json(teams.filter((t) => t.organizationId === organizationId));
	}
	if (isExplicitOrg && organizationId) {
		if (!await adapter.findMemberByOrgId({
			userId: session.user.id,
			organizationId
		})) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION);
		const teams = await adapter.listTeamsByUser({ userId: session.user.id });
		return ctx.json(teams.filter((t) => t.organizationId === organizationId));
	}
	const teams = await adapter.listTeamsByUser({ userId: session.user.id });
	const orgIds = [...new Set(teams.map((team) => team.organizationId))];
	const memberships = await Promise.all(orgIds.map((organizationId) => adapter.checkMembership({
		userId: session.user.id,
		organizationId
	})));
	const memberOrgIds = new Set(orgIds.filter((_, index) => memberships[index]));
	return ctx.json(teams.filter((team) => memberOrgIds.has(team.organizationId)));
});
var listTeamMembersQuerySchema = optional(object({ teamId: string().optional().meta({ description: "The team whose members we should return. If this is not provided the members of the current active team get returned." }) }));
var listTeamMembers = (options) => createAuthEndpoint("/organization/list-team-members", {
	method: "GET",
	query: listTeamMembersQuerySchema,
	metadata: { openapi: {
		description: "List the members of the given team.",
		responses: { "200": {
			description: "Teams retrieved successfully",
			content: { "application/json": { schema: {
				type: "array",
				items: {
					type: "object",
					description: "The team member",
					properties: {
						id: {
							type: "string",
							description: "Unique identifier of the team member"
						},
						userId: {
							type: "string",
							description: "The user ID of the team member"
						},
						teamId: {
							type: "string",
							description: "The team ID of the team the team member is in"
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Timestamp when the team member was created"
						}
					},
					required: [
						"id",
						"userId",
						"teamId",
						"createdAt"
					]
				},
				description: "Array of team member objects within the team"
			} } }
		} }
	} },
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware]
}, async (ctx) => {
	const session = ctx.context.session;
	const adapter = getOrgAdapter(ctx.context, ctx.context.orgOptions);
	const teamId = ctx.query?.teamId || session?.session.activeTeamId;
	if (!teamId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.YOU_DO_NOT_HAVE_AN_ACTIVE_TEAM);
	const team = await adapter.findTeamById({ teamId });
	if (!team) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.TEAM_NOT_FOUND);
	if (!await adapter.checkMembership({
		userId: session.user.id,
		organizationId: team.organizationId
	})) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_TEAM);
	if (!await adapter.findTeamMember({
		userId: session.user.id,
		teamId
	})) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_TEAM);
	const members = await adapter.listTeamMembers({ teamId });
	return ctx.json(members);
});
var addTeamMemberBodySchema = object({
	teamId: string().meta({ description: "The team the user should be a member of." }),
	userId: string$1().meta({ description: "The user Id which represents the user to be added as a member." }),
	organizationId: string().meta({ description: "The organization ID which the team falls under. If not provided, it will default to the user's active organization." }).optional()
});
var addTeamMember = (options) => createAuthEndpoint("/organization/add-team-member", {
	method: "POST",
	body: addTeamMemberBodySchema,
	metadata: { openapi: {
		description: "The newly created member",
		responses: { "200": {
			description: "Team member created successfully",
			content: { "application/json": { schema: {
				type: "object",
				description: "The team member",
				properties: {
					id: {
						type: "string",
						description: "Unique identifier of the team member"
					},
					userId: {
						type: "string",
						description: "The user ID of the team member"
					},
					teamId: {
						type: "string",
						description: "The team ID of the team the team member is in"
					},
					createdAt: {
						type: "string",
						format: "date-time",
						description: "Timestamp when the team member was created"
					}
				},
				required: [
					"id",
					"userId",
					"teamId",
					"createdAt"
				]
			} } }
		} }
	} },
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware]
}, async (ctx) => {
	const session = ctx.context.session;
	const adapter = getOrgAdapter(ctx.context, ctx.context.orgOptions);
	const organizationId = ctx.body.organizationId || session.session.activeOrganizationId;
	if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
	const currentMember = await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId
	});
	if (!currentMember) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION);
	if (!await hasPermission({
		role: currentMember.role,
		options: ctx.context.orgOptions,
		permissions: { member: ["update"] },
		organizationId
	}, ctx)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_TEAM_MEMBER);
	if (!await adapter.findMemberByOrgId({
		userId: ctx.body.userId,
		organizationId
	})) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION);
	const team = await adapter.findTeamById({
		teamId: ctx.body.teamId,
		organizationId
	});
	if (!team) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.TEAM_NOT_FOUND);
	const organization = await adapter.findOrganizationById(organizationId);
	if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
	const userBeingAdded = await ctx.context.internalAdapter.findUserById(ctx.body.userId);
	if (!userBeingAdded) throw APIError.fromStatus("BAD_REQUEST", { message: "User not found" });
	if (options?.organizationHooks?.beforeAddTeamMember) {
		const response = await options?.organizationHooks.beforeAddTeamMember({
			teamMember: {
				teamId: ctx.body.teamId,
				userId: ctx.body.userId
			},
			team,
			user: userBeingAdded,
			organization
		});
		if (response && typeof response === "object" && "data" in response) {}
	}
	let teamMember;
	if (typeof ctx.context.orgOptions.teams?.maximumMembersPerTeam !== "undefined") {
		const maximumMembersPerTeam = typeof ctx.context.orgOptions.teams.maximumMembersPerTeam === "function" ? await ctx.context.orgOptions.teams.maximumMembersPerTeam({
			teamId: ctx.body.teamId,
			session,
			organizationId
		}) : ctx.context.orgOptions.teams.maximumMembersPerTeam;
		const result = await adapter.addTeamMemberWithLimit({
			teamId: ctx.body.teamId,
			userId: ctx.body.userId,
			maximumMembersPerTeam
		});
		if (result.status === "limitReached") throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.TEAM_MEMBER_LIMIT_REACHED);
		teamMember = result.member;
	} else teamMember = await adapter.findOrCreateTeamMember({
		teamId: ctx.body.teamId,
		userId: ctx.body.userId
	});
	if (options?.organizationHooks?.afterAddTeamMember) await options?.organizationHooks.afterAddTeamMember({
		teamMember,
		team,
		user: userBeingAdded,
		organization
	});
	return ctx.json(teamMember);
});
var removeTeamMemberBodySchema = object({
	teamId: string().meta({ description: "The team the user should be removed from." }),
	userId: string$1().meta({ description: "The user which should be removed from the team." }),
	organizationId: string().meta({ description: "The organization ID which the team falls under. If not provided, it will default to the user's active organization." }).optional()
});
var removeTeamMember = (options) => createAuthEndpoint("/organization/remove-team-member", {
	method: "POST",
	body: removeTeamMemberBodySchema,
	metadata: { openapi: {
		description: "Remove a member from a team",
		responses: { "200": {
			description: "Team member removed successfully",
			content: { "application/json": { schema: {
				type: "object",
				properties: { message: {
					type: "string",
					description: "Confirmation message indicating successful removal",
					enum: ["Team member removed successfully."]
				} },
				required: ["message"]
			} } }
		} }
	} },
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware]
}, async (ctx) => {
	const session = ctx.context.session;
	const adapter = getOrgAdapter(ctx.context, ctx.context.orgOptions);
	const organizationId = ctx.body.organizationId || session.session.activeOrganizationId;
	if (!organizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
	const currentMember = await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId
	});
	if (!currentMember) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION);
	if (!await hasPermission({
		role: currentMember.role,
		options: ctx.context.orgOptions,
		permissions: { member: ["delete"] },
		organizationId
	}, ctx)) throw APIError.from("FORBIDDEN", ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_REMOVE_A_TEAM_MEMBER);
	if (!await adapter.findMemberByOrgId({
		userId: ctx.body.userId,
		organizationId
	})) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION);
	const team = await adapter.findTeamById({
		teamId: ctx.body.teamId,
		organizationId
	});
	if (!team) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.TEAM_NOT_FOUND);
	const organization = await adapter.findOrganizationById(organizationId);
	if (!organization) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND);
	const userBeingRemoved = await ctx.context.internalAdapter.findUserById(ctx.body.userId);
	if (!userBeingRemoved) throw APIError.fromStatus("BAD_REQUEST", { message: "User not found" });
	const teamMember = await adapter.findTeamMember({
		teamId: ctx.body.teamId,
		userId: ctx.body.userId
	});
	if (!teamMember) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_TEAM);
	if (options?.organizationHooks?.beforeRemoveTeamMember) await options?.organizationHooks.beforeRemoveTeamMember({
		teamMember,
		team,
		user: userBeingRemoved,
		organization
	});
	await adapter.removeTeamMember({
		teamId: ctx.body.teamId,
		userId: ctx.body.userId
	});
	if (options?.organizationHooks?.afterRemoveTeamMember) await options?.organizationHooks.afterRemoveTeamMember({
		teamMember,
		team,
		user: userBeingRemoved,
		organization
	});
	return ctx.json({ message: "Team member removed successfully." });
});
function parseRoles(roles) {
	return Array.isArray(roles) ? roles.join(",") : roles;
}
var createHasPermissionBodySchema = object({ organizationId: string().optional() }).and(xor([object({ permission: record(string(), array(string())) }), object({ permissions: record(string(), array(string())) })]));
var createHasPermission = (options) => {
	return createAuthEndpoint("/organization/has-permission", {
		method: "POST",
		requireHeaders: true,
		body: createHasPermissionBodySchema,
		use: [orgSessionMiddleware],
		metadata: {
			$Infer: { body: {} },
			openapi: {
				description: "Check if the user has permission",
				requestBody: { content: { "application/json": { schema: {
					type: "object",
					properties: {
						permission: {
							type: "object",
							description: "The permission to check",
							deprecated: true
						},
						permissions: {
							type: "object",
							description: "The permission to check"
						}
					},
					required: ["permissions"]
				} } } },
				responses: { "200": {
					description: "Success",
					content: { "application/json": { schema: {
						type: "object",
						properties: {
							error: { type: "string" },
							success: { type: "boolean" }
						},
						required: ["success"]
					} } }
				} }
			}
		}
	}, async (ctx) => {
		const activeOrganizationId = ctx.body.organizationId || ctx.context.session.session.activeOrganizationId;
		if (!activeOrganizationId) throw APIError.from("BAD_REQUEST", ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION);
		const member = await getOrgAdapter(ctx.context, options).findMemberByOrgId({
			userId: ctx.context.session.user.id,
			organizationId: activeOrganizationId
		});
		if (!member) throw APIError.from("UNAUTHORIZED", ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION);
		const result = await hasPermission({
			role: member.role,
			options,
			permissions: ctx.body.permissions,
			organizationId: activeOrganizationId
		}, ctx);
		return ctx.json({
			error: null,
			success: result
		});
	});
};
function organization$1(options) {
	const opts = options || {};
	let endpoints = {
		/**
		* ### Endpoint
		*
		* POST `/organization/create`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.createOrganization`
		*
		* **client:**
		* `authClient.organization.create`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-create)
		*/
		createOrganization: createOrganization(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/update`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.updateOrganization`
		*
		* **client:**
		* `authClient.organization.update`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-update)
		*/
		updateOrganization: updateOrganization(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/delete`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.deleteOrganization`
		*
		* **client:**
		* `authClient.organization.delete`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-delete)
		*/
		deleteOrganization: deleteOrganization(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/set-active`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.setActiveOrganization`
		*
		* **client:**
		* `authClient.organization.setActive`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-set-active)
		*/
		setActiveOrganization: setActiveOrganization(opts),
		/**
		* ### Endpoint
		*
		* GET `/organization/get-organization`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.getOrganization`
		*
		* **client:**
		* `authClient.organization.getOrganization`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-get-organization)
		*/
		getOrganization: getOrganization(opts),
		/**
		* ### Endpoint
		*
		* GET `/organization/get-full-organization`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.getFullOrganization`
		*
		* **client:**
		* `authClient.organization.getFullOrganization`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-get-full-organization)
		*/
		getFullOrganization: getFullOrganization(opts),
		/**
		* ### Endpoint
		*
		* GET `/organization/list`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.listOrganizations`
		*
		* **client:**
		* `authClient.organization.list`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-list)
		*/
		listOrganizations: listOrganizations(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/invite-member`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.createInvitation`
		*
		* **client:**
		* `authClient.organization.inviteMember`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-invite-member)
		*/
		createInvitation: createInvitation(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/cancel-invitation`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.cancelInvitation`
		*
		* **client:**
		* `authClient.organization.cancelInvitation`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-cancel-invitation)
		*/
		cancelInvitation: cancelInvitation(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/accept-invitation`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.acceptInvitation`
		*
		* **client:**
		* `authClient.organization.acceptInvitation`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-accept-invitation)
		*/
		acceptInvitation: acceptInvitation(opts),
		/**
		* ### Endpoint
		*
		* GET `/organization/get-invitation`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.getInvitation`
		*
		* **client:**
		* `authClient.organization.getInvitation`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-get-invitation)
		*/
		getInvitation: getInvitation(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/reject-invitation`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.rejectInvitation`
		*
		* **client:**
		* `authClient.organization.rejectInvitation`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-reject-invitation)
		*/
		rejectInvitation: rejectInvitation(opts),
		/**
		* ### Endpoint
		*
		* GET `/organization/list-invitations`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.listInvitations`
		*
		* **client:**
		* `authClient.organization.listInvitations`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-list-invitations)
		*/
		listInvitations: listInvitations(opts),
		/**
		* ### Endpoint
		*
		* GET `/organization/get-active-member`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.getActiveMember`
		*
		* **client:**
		* `authClient.organization.getActiveMember`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-get-active-member)
		*/
		getActiveMember: getActiveMember(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/check-slug`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.checkOrganizationSlug`
		*
		* **client:**
		* `authClient.organization.checkSlug`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-check-slug)
		*/
		checkOrganizationSlug: checkOrganizationSlug(opts),
		/**
		* Add a member to an organization directly, bypassing the invitation flow.
		*
		* **Server-only:** callable as `auth.api.addMember` from trusted server
		* code. It is not registered as an HTTP route and has no client method, so
		* it runs no session or permission check of its own; the caller is
		* responsible for authorizing the request.
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.addMember`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-add-member)
		*/
		addMember: addMember(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/remove-member`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.removeMember`
		*
		* **client:**
		* `authClient.organization.removeMember`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-remove-member)
		*/
		removeMember: removeMember(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/update-member-role`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.updateMemberRole`
		*
		* **client:**
		* `authClient.organization.updateMemberRole`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-update-member-role)
		*/
		updateMemberRole: updateMemberRole(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/leave`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.leaveOrganization`
		*
		* **client:**
		* `authClient.organization.leave`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-leave)
		*/
		leaveOrganization: leaveOrganization(opts),
		listUserInvitations: listUserInvitations(opts),
		/**
		* ### Endpoint
		*
		* GET `/organization/list-members`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.listMembers`
		*
		* **client:**
		* `authClient.organization.listMembers`
		*/
		listMembers: listMembers(opts),
		/**
		* ### Endpoint
		*
		* GET `/organization/get-active-member-role`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.getActiveMemberRole`
		*
		* **client:**
		* `authClient.organization.getActiveMemberRole`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-get-active-member-role)
		*/
		getActiveMemberRole: getActiveMemberRole(opts)
	};
	const teamSupport = opts.teams?.enabled;
	const teamEndpoints = {
		/**
		* ### Endpoint
		*
		* POST `/organization/create-team`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.createTeam`
		*
		* **client:**
		* `authClient.organization.createTeam`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-create-team)
		*/
		createTeam: createTeam(opts),
		/**
		* ### Endpoint
		*
		* GET `/organization/list-teams`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.listOrganizationTeams`
		*
		* **client:**
		* `authClient.organization.listTeams`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-list-teams)
		*/
		listOrganizationTeams: listOrganizationTeams(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/remove-team`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.removeTeam`
		*
		* **client:**
		* `authClient.organization.removeTeam`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-remove-team)
		*/
		removeTeam: removeTeam(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/update-team`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.updateTeam`
		*
		* **client:**
		* `authClient.organization.updateTeam`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-method-organization-update-team)
		*/
		updateTeam: updateTeam(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/set-active-team`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.setActiveTeam`
		*
		* **client:**
		* `authClient.organization.setActiveTeam`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-set-active-team)
		*/
		setActiveTeam: setActiveTeam(opts),
		/**
		* ### Endpoint
		*
		* GET `/organization/list-user-teams`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.listUserTeams`
		*
		* **client:**
		* `authClient.organization.listUserTeams`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-set-active-team)
		*/
		listUserTeams: listUserTeams(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/list-team-members`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.listTeamMembers`
		*
		* **client:**
		* `authClient.organization.listTeamMembers`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-set-active-team)
		*/
		listTeamMembers: listTeamMembers(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/add-team-member`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.addTeamMember`
		*
		* **client:**
		* `authClient.organization.addTeamMember`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-add-team-member)
		*/
		addTeamMember: addTeamMember(opts),
		/**
		* ### Endpoint
		*
		* POST `/organization/remove-team-member`
		*
		* ### API Methods
		*
		* **server:**
		* `auth.api.removeTeamMember`
		*
		* **client:**
		* `authClient.organization.removeTeamMember`
		*
		* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/organization#api-remove-team-member)
		*/
		removeTeamMember: removeTeamMember(opts)
	};
	if (teamSupport) endpoints = {
		...endpoints,
		...teamEndpoints
	};
	const dynamicAccessControlEndpoints = {
		createOrgRole: createOrgRole(opts),
		deleteOrgRole: deleteOrgRole(opts),
		listOrgRoles: listOrgRoles(opts),
		getOrgRole: getOrgRole(opts),
		updateOrgRole: updateOrgRole(opts)
	};
	if (opts.dynamicAccessControl?.enabled) endpoints = {
		...endpoints,
		...dynamicAccessControlEndpoints
	};
	const roles = {
		...defaultRoles$1,
		...opts.roles
	};
	const teamSchema = teamSupport ? {
		team: {
			modelName: opts.schema?.team?.modelName,
			fields: {
				name: {
					type: "string",
					required: true,
					fieldName: opts.schema?.team?.fields?.name
				},
				memberCount: {
					type: "number",
					required: true,
					defaultValue: 0,
					input: false,
					returned: false,
					fieldName: opts.schema?.team?.fields?.memberCount
				},
				organizationId: {
					type: "string",
					required: true,
					references: {
						model: "organization",
						field: "id"
					},
					fieldName: opts.schema?.team?.fields?.organizationId,
					index: true
				},
				createdAt: {
					type: "date",
					required: true,
					fieldName: opts.schema?.team?.fields?.createdAt
				},
				updatedAt: {
					type: "date",
					required: false,
					fieldName: opts.schema?.team?.fields?.updatedAt,
					onUpdate: () => /* @__PURE__ */ new Date()
				},
				...opts.schema?.team?.additionalFields || {}
			}
		},
		teamMember: {
			modelName: opts.schema?.teamMember?.modelName,
			fields: {
				teamId: {
					type: "string",
					required: true,
					references: {
						model: "team",
						field: "id"
					},
					fieldName: opts.schema?.teamMember?.fields?.teamId,
					index: true
				},
				userId: {
					type: "string",
					required: true,
					references: {
						model: "user",
						field: "id"
					},
					fieldName: opts.schema?.teamMember?.fields?.userId,
					index: true
				},
				membershipKey: {
					type: "string",
					required: false,
					unique: true,
					input: false,
					returned: false,
					fieldName: opts.schema?.teamMember?.fields?.membershipKey
				},
				createdAt: {
					type: "date",
					required: false,
					fieldName: opts.schema?.teamMember?.fields?.createdAt
				}
			}
		}
	} : {};
	const organizationRoleSchema = opts.dynamicAccessControl?.enabled ? { organizationRole: {
		fields: {
			organizationId: {
				type: "string",
				required: true,
				references: {
					model: "organization",
					field: "id"
				},
				fieldName: opts.schema?.organizationRole?.fields?.organizationId,
				index: true
			},
			role: {
				type: "string",
				required: true,
				fieldName: opts.schema?.organizationRole?.fields?.role,
				index: true
			},
			permission: {
				type: "string",
				required: true,
				fieldName: opts.schema?.organizationRole?.fields?.permission
			},
			createdAt: {
				type: "date",
				required: true,
				defaultValue: () => /* @__PURE__ */ new Date(),
				fieldName: opts.schema?.organizationRole?.fields?.createdAt
			},
			updatedAt: {
				type: "date",
				required: false,
				fieldName: opts.schema?.organizationRole?.fields?.updatedAt,
				onUpdate: () => /* @__PURE__ */ new Date()
			},
			...opts.schema?.organizationRole?.additionalFields || {}
		},
		modelName: opts.schema?.organizationRole?.modelName
	} } : {};
	const schema = {
		organization: {
			modelName: opts.schema?.organization?.modelName,
			fields: {
				name: {
					type: "string",
					required: true,
					sortable: true,
					fieldName: opts.schema?.organization?.fields?.name
				},
				slug: {
					type: "string",
					required: true,
					unique: true,
					sortable: true,
					fieldName: opts.schema?.organization?.fields?.slug,
					index: true
				},
				logo: {
					type: "string",
					required: false,
					fieldName: opts.schema?.organization?.fields?.logo
				},
				createdAt: {
					type: "date",
					required: true,
					fieldName: opts.schema?.organization?.fields?.createdAt
				},
				metadata: {
					type: "string",
					required: false,
					fieldName: opts.schema?.organization?.fields?.metadata
				},
				...opts.schema?.organization?.additionalFields || {}
			}
		},
		...organizationRoleSchema,
		...teamSchema,
		member: {
			modelName: opts.schema?.member?.modelName,
			fields: {
				organizationId: {
					type: "string",
					required: true,
					references: {
						model: "organization",
						field: "id"
					},
					fieldName: opts.schema?.member?.fields?.organizationId,
					index: true
				},
				userId: {
					type: "string",
					required: true,
					fieldName: opts.schema?.member?.fields?.userId,
					references: {
						model: "user",
						field: "id"
					},
					index: true
				},
				role: {
					type: "string",
					required: true,
					sortable: true,
					defaultValue: "member",
					fieldName: opts.schema?.member?.fields?.role
				},
				createdAt: {
					type: "date",
					required: true,
					fieldName: opts.schema?.member?.fields?.createdAt
				},
				...opts.schema?.member?.additionalFields || {}
			}
		},
		invitation: {
			modelName: opts.schema?.invitation?.modelName,
			fields: {
				organizationId: {
					type: "string",
					required: true,
					references: {
						model: "organization",
						field: "id"
					},
					fieldName: opts.schema?.invitation?.fields?.organizationId,
					index: true
				},
				email: {
					type: "string",
					required: true,
					sortable: true,
					fieldName: opts.schema?.invitation?.fields?.email,
					index: true
				},
				role: {
					type: "string",
					required: false,
					sortable: true,
					fieldName: opts.schema?.invitation?.fields?.role
				},
				...teamSupport ? { teamId: {
					type: "string",
					required: false,
					sortable: true,
					fieldName: opts.schema?.invitation?.fields?.teamId
				} } : {},
				status: {
					type: "string",
					required: true,
					sortable: true,
					defaultValue: "pending",
					fieldName: opts.schema?.invitation?.fields?.status
				},
				expiresAt: {
					type: "date",
					required: true,
					fieldName: opts.schema?.invitation?.fields?.expiresAt
				},
				createdAt: {
					type: "date",
					required: true,
					fieldName: opts.schema?.invitation?.fields?.createdAt,
					defaultValue: () => /* @__PURE__ */ new Date()
				},
				inviterId: {
					type: "string",
					references: {
						model: "user",
						field: "id"
					},
					fieldName: opts.schema?.invitation?.fields?.inviterId,
					required: true
				},
				...opts.schema?.invitation?.additionalFields || {}
			}
		}
	};
	return {
		id: "organization",
		version: PACKAGE_VERSION,
		endpoints: {
			...shimContext(endpoints, {
				orgOptions: opts,
				roles,
				getSession: async (context) => {
					return await getSessionFromCtx(context);
				}
			}),
			hasPermission: createHasPermission(opts)
		},
		schema: {
			...schema,
			session: { fields: {
				activeOrganizationId: {
					type: "string",
					required: false,
					input: false,
					fieldName: opts.schema?.session?.fields?.activeOrganizationId
				},
				...teamSupport ? { activeTeamId: {
					type: "string",
					required: false,
					input: false,
					fieldName: opts.schema?.session?.fields?.activeTeamId
				} } : {}
			} }
		},
		$Infer: {
			Organization: {},
			Invitation: {},
			Member: {},
			Team: teamSupport ? {} : {},
			TeamMember: teamSupport ? {} : {},
			ActiveOrganization: {}
		},
		$ERROR_CODES: ORGANIZATION_ERROR_CODES,
		options: opts
	};
}
/**
* Warns when a cookie integration plugin is not effectively last.
*
* A plugin is considered misordered when there is at least one other plugin
* after it in the `plugins` array that declares `hooks.after`, since those
* hooks can set cookies that this integration will not see.
*/
function warnIfCookiePluginNotLast(ctx, pluginId) {
	const plugins = ctx.options.plugins || [];
	if (plugins.length === 0) return;
	const index = plugins.findIndex((p) => p.id === pluginId);
	if (index === -1) return;
	if (!plugins.slice(index + 1).some((p) => p.hooks && Array.isArray(p.hooks.after) && p.hooks.after.length > 0)) return;
	ctx.logger.warn(`[better-auth] Cookie integration plugin "${pluginId}" should be placed last in the plugins array. Plugins with \`hooks.after\` running after it may set cookies that are not forwarded to the framework cookie store. Move your cookie integration plugin to the end of the \`plugins\` array to avoid missing \`Set-Cookie\` headers.`);
}
/**
* TanStack Start cookie plugin for React.
*
* This plugin automatically handles cookie setting for TanStack Start with React.
* It uses `@tanstack/react-start-server` to set cookies.
*
* For Solid.js, use `better-auth/tanstack-start/solid` instead.
*
* @example
* ```ts
* import { tanstackStartCookies } from "better-auth/tanstack-start";
*
* const auth = betterAuth({
*   plugins: [tanstackStartCookies()],
* });
* ```
*/
var tanstackStartCookies = () => {
	let hasWarned = false;
	return {
		id: "tanstack-start-cookies",
		version: PACKAGE_VERSION,
		hooks: { after: [{
			matcher(ctx) {
				return true;
			},
			handler: createAuthMiddleware(async (ctx) => {
				if (!hasWarned) {
					warnIfCookiePluginNotLast(ctx.context, "tanstack-start-cookies");
					hasWarned = true;
				}
				const returned = ctx.context.responseHeaders;
				if ("_flag" in ctx && ctx._flag === "router") return;
				if (returned instanceof Headers) {
					const setCookies = returned?.get("set-cookie");
					if (!setCookies) return;
					const parsed = parseSetCookieHeader(setCookies);
					const { setCookie } = await import("./ssr.mjs").then((n) => n.c).then((n) => n.t);
					parsed.forEach((value, key) => {
						if (!key) return;
						try {
							setCookie(key, value.value, toCookieOptions(value));
						} catch {}
					});
					return;
				}
			})
		}] }
	};
};
(0, import_dist.config)({
	path: [".env.local", ".env"],
	quiet: true
});
var env$1 = createEnv({
	server: {
		DATABASE_URL: string().min(1),
		DATABASE_POOL_MAX: number$1().int().min(1).max(20).default(5),
		BETTER_AUTH_URL: url(),
		BETTER_AUTH_SECRET: string().min(32),
		GOOGLE_CLIENT_ID: string().min(1).optional(),
		GOOGLE_CLIENT_SECRET: string().min(1).optional(),
		APPLE_CLIENT_ID: string().min(1).optional(),
		APPLE_TEAM_ID: string().min(1).optional(),
		APPLE_KEY_ID: string().min(1).optional(),
		APPLE_PRIVATE_KEY: string().min(1).optional(),
		APPLE_APP_BUNDLE_IDENTIFIER: string().min(1).optional(),
		RESEND_API_KEY: string().startsWith("re_").optional(),
		EMAIL_FROM: string().min(3).optional(),
		EMAIL_REPLY_TO: email().optional(),
		CLOUDFLARE_ACCOUNT_ID: string().min(1),
		CLOUDFLARE_R2_ACCESS_KEY_ID: string().min(1),
		CLOUDFLARE_R2_SECRET_ACCESS_KEY: string().min(1),
		CLOUDFLARE_R2_PRIVATE_BUCKET_NAME: string().min(1),
		CLOUDFLARE_R2_PUBLIC_BUCKET_NAME: string().min(1),
		NODE_ENV: _enum([
			"development",
			"production",
			"test"
		]).default("development"),
		VERCEL_ENV: _enum([
			"development",
			"preview",
			"production"
		]).optional(),
		SERVER_URL: url().optional()
	},
	/**
	* The prefix that client-side variables must have. This is enforced both at
	* a type-level and at runtime.
	*/
	clientPrefix: "VITE_",
	client: {
		VITE_APP_TITLE: string().min(1).optional(),
		VITE_PUBLIC_ASSET_URL: url()
	},
	/**
	* What object holds the environment variables at runtime. This is usually
	* `process.env` or `import.meta.env`.
	*/
	runtimeEnv: process.env,
	/**
	* By default, this library will feed the environment variables directly to
	* the Zod validator.
	*
	* This means that if you have an empty string for a value that is supposed
	* to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	* it as a type mismatch violation. Additionally, if you have an empty string
	* for a value that is supposed to be a string with a default value (e.g.
	* `DOMAIN=` in an ".env" file), the default value will never be applied.
	*
	* In order to solve these issues, we recommend that all new projects
	* explicitly specify this option as true.
	*/
	emptyStringAsUndefined: true
});
if (env$1.VERCEL_ENV === "production" && /(^|[-_.])dev($|[-_.])/.test(env$1.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME.toLowerCase())) throw new Error("Production must use a dedicated R2 private bucket, not the development bucket.");
var auth_schema_exports = /* @__PURE__ */ __exportAll({
	account: () => account,
	authRelations: () => authRelations,
	invitation: () => invitation,
	member: () => member,
	organization: () => organization,
	session: () => session,
	team: () => team,
	teamMember: () => teamMember,
	user: () => user,
	verification: () => verification
});
var user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean$2("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
});
var session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	activeOrganizationId: text("active_organization_id"),
	activeTeamId: text("active_team_id")
}, (table) => [index("session_userId_idx").on(table.userId)]);
var account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("account_userId_idx").on(table.userId)]);
var verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);
var organization = pgTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	logo: text("logo"),
	createdAt: timestamp("created_at").notNull(),
	metadata: text("metadata"),
	workspaceType: text("workspace_type").default("personal").notNull()
}, (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)]);
var team = pgTable("team", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	memberCount: integer("member_count").default(0).notNull(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date())
}, (table) => [index("team_organizationId_idx").on(table.organizationId)]);
var teamMember = pgTable("team_member", {
	id: text("id").primaryKey(),
	teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	membershipKey: text("membership_key").unique(),
	createdAt: timestamp("created_at")
}, (table) => [index("teamMember_teamId_idx").on(table.teamId), index("teamMember_userId_idx").on(table.userId)]);
var member = pgTable("member", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	role: text("role").default("member").notNull(),
	createdAt: timestamp("created_at").notNull()
}, (table) => [index("member_organizationId_idx").on(table.organizationId), index("member_userId_idx").on(table.userId)]);
var invitation = pgTable("invitation", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	role: text("role"),
	teamId: text("team_id"),
	status: text("status").default("pending").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	inviterId: text("inviter_id").notNull().references(() => user.id, { onDelete: "cascade" })
}, (table) => [index("invitation_organizationId_idx").on(table.organizationId), index("invitation_email_idx").on(table.email)]);
var authRelations = defineRelationsPart({
	user,
	session,
	account,
	verification,
	organization,
	team,
	teamMember,
	member,
	invitation
}, (r) => ({
	user: {
		sessions: r.many.session({
			from: r.user.id,
			to: r.session.userId
		}),
		accounts: r.many.account({
			from: r.user.id,
			to: r.account.userId
		}),
		teamMembers: r.many.teamMember({
			from: r.user.id,
			to: r.teamMember.userId
		}),
		members: r.many.member({
			from: r.user.id,
			to: r.member.userId
		}),
		invitations: r.many.invitation({
			from: r.user.id,
			to: r.invitation.inviterId
		})
	},
	session: { user: r.one.user({
		from: r.session.userId,
		to: r.user.id
	}) },
	account: { user: r.one.user({
		from: r.account.userId,
		to: r.user.id
	}) },
	organization: {
		teams: r.many.team({
			from: r.organization.id,
			to: r.team.organizationId
		}),
		members: r.many.member({
			from: r.organization.id,
			to: r.member.organizationId
		}),
		invitations: r.many.invitation({
			from: r.organization.id,
			to: r.invitation.organizationId
		})
	},
	team: {
		organization: r.one.organization({
			from: r.team.organizationId,
			to: r.organization.id
		}),
		teamMembers: r.many.teamMember({
			from: r.team.id,
			to: r.teamMember.teamId
		})
	},
	teamMember: {
		team: r.one.team({
			from: r.teamMember.teamId,
			to: r.team.id
		}),
		user: r.one.user({
			from: r.teamMember.userId,
			to: r.user.id
		})
	},
	member: {
		organization: r.one.organization({
			from: r.member.organizationId,
			to: r.organization.id
		}),
		user: r.one.user({
			from: r.member.userId,
			to: r.user.id
		})
	},
	invitation: {
		organization: r.one.organization({
			from: r.invitation.organizationId,
			to: r.organization.id
		}),
		user: r.one.user({
			from: r.invitation.inviterId,
			to: r.user.id
		})
	}
}));
var event_schema_exports = /* @__PURE__ */ __exportAll({
	event: () => event,
	eventAttendanceStatus: () => eventAttendanceStatus,
	eventCategory: () => eventCategory,
	eventCompletionStatus: () => eventCompletionStatus,
	eventInvitation: () => eventInvitation,
	eventInvitationStatus: () => eventInvitationStatus,
	eventParticipant: () => eventParticipant,
	eventParticipantRole: () => eventParticipantRole,
	eventPlanningMode: () => eventPlanningMode,
	eventPlanningPermission: () => eventPlanningPermission,
	eventPlanningStatus: () => eventPlanningStatus,
	eventPurpose: () => eventPurpose,
	eventSchedulingState: () => eventSchedulingState,
	eventStatus: () => eventStatus
});
var eventStatus = pgEnum("event_status", [
	"draft",
	"ongoing",
	"finished"
]);
var eventPurpose = pgEnum("event_purpose", ["planning_scouting", "part_of_event"]);
var eventPlanningStatus = pgEnum("event_planning_status", [
	"draft",
	"approved",
	"not_sure",
	"rejected",
	"archived"
]);
var eventCompletionStatus = pgEnum("event_completion_status", ["upcoming", "complete"]);
var eventSchedulingState = pgEnum("event_scheduling_state", ["scheduled", "unscheduled"]);
var eventCategory = pgEnum("event_category", [
	"venue",
	"food_tasting",
	"photography",
	"honeymoon",
	"attire_fitting",
	"wedding_shower",
	"bachelor_bachelorette",
	"rehearsal",
	"ceremony",
	"reception",
	"other"
]);
var eventPlanningMode = pgEnum("event_planning_mode", [
	"open_to_ideas",
	"help_me_decide",
	"quiet_planning",
	"decision_made"
]);
var eventParticipantRole = pgEnum("event_participant_role", [
	"host",
	"collaborator",
	"guest"
]);
var eventPlanningPermission = pgEnum("event_planning_permission", [
	"manage",
	"contribute",
	"view_only"
]);
var eventAttendanceStatus = pgEnum("event_attendance_status", [
	"pending",
	"going",
	"not_sure",
	"not_going"
]);
var eventInvitationStatus = pgEnum("event_invitation_status", [
	"pending",
	"accepted",
	"declined",
	"revoked",
	"expired"
]);
var event = pgTable("event", {
	id: uuid("id").defaultRandom().primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	parentEventId: uuid("parent_event_id"),
	title: text("title").notNull(),
	description: text("description"),
	dressCode: text("dress_code"),
	imageUrl: text("image_url"),
	status: eventStatus("status"),
	planningStatus: eventPlanningStatus("planning_status"),
	completionStatus: eventCompletionStatus("completion_status").default("upcoming").notNull(),
	schedulingState: eventSchedulingState("scheduling_state").default("scheduled").notNull(),
	category: eventCategory("category"),
	purpose: eventPurpose("purpose"),
	planningMode: eventPlanningMode("planning_mode").default("open_to_ideas").notNull(),
	startsAt: timestamp("starts_at", { withTimezone: true }),
	endsAt: timestamp("ends_at", { withTimezone: true }),
	isAllDay: boolean$2("is_all_day").default(false).notNull(),
	timeZone: text("time_zone").notNull(),
	locationName: text("location_name"),
	locationAddress: text("location_address"),
	locationAddressLine2: text("location_address_line_2"),
	locationLatitude: doublePrecision("location_latitude"),
	locationLongitude: doublePrecision("location_longitude"),
	mapItemIdentifier: text("map_item_identifier"),
	budgetCap: numeric("budget_cap", {
		precision: 14,
		scale: 2
	}),
	createdByUserId: text("created_by_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	uniqueIndex("event_organization_id_id_uidx").on(table.organizationId, table.id),
	index("event_organization_id_idx").on(table.organizationId),
	index("event_parent_event_id_idx").on(table.parentEventId),
	index("event_organization_starts_at_idx").on(table.organizationId, table.startsAt),
	uniqueIndex("event_one_main_per_workspace_uidx").on(table.organizationId).where(sql$1`${table.parentEventId} is null`),
	foreignKey({
		name: "event_parent_same_workspace_fk",
		columns: [table.organizationId, table.parentEventId],
		foreignColumns: [table.organizationId, table.id]
	}).onDelete("cascade"),
	check("event_end_after_start_check", sql$1`${table.endsAt} is null or ${table.startsAt} is null or ${table.endsAt} >= ${table.startsAt}`),
	check("event_purpose_matches_hierarchy_check", sql$1`(${table.parentEventId} is null and ${table.purpose} is null) or (${table.parentEventId} is not null and ${table.purpose} is not null)`),
	check("event_child_metadata_matches_hierarchy_check", sql$1`(${table.parentEventId} is null and ${table.category} is null and ${table.planningStatus} is null) or (${table.parentEventId} is not null and ${table.category} is not null and ${table.planningStatus} is not null)`),
	check("event_lifecycle_matches_hierarchy_check", sql$1`(${table.parentEventId} is null and ${table.status} is not null) or (${table.parentEventId} is not null and ${table.status} is null)`),
	check("event_location_coordinate_pair_check", sql$1`(${table.locationLatitude} is null and ${table.locationLongitude} is null) or (${table.locationLatitude} is not null and ${table.locationLongitude} is not null and ${table.locationLatitude} between -90 and 90 and ${table.locationLongitude} between -180 and 180)`),
	check("event_budget_cap_check", sql$1`${table.budgetCap} is null or ${table.budgetCap} >= 0`)
]);
var eventParticipant = pgTable("event_participant", {
	id: uuid("id").defaultRandom().primaryKey(),
	eventId: uuid("event_id").notNull().references(() => event.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	role: eventParticipantRole("role").notNull(),
	planningPermission: eventPlanningPermission("planning_permission").default("view_only").notNull(),
	attendanceStatus: eventAttendanceStatus("attendance_status").default("pending").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [uniqueIndex("event_participant_event_user_uidx").on(table.eventId, table.userId), index("event_participant_user_id_idx").on(table.userId)]);
var eventInvitation = pgTable("event_invitation", {
	id: uuid("id").defaultRandom().primaryKey(),
	eventId: uuid("event_id").notNull().references(() => event.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	token: uuid("token").defaultRandom().notNull().unique(),
	role: eventParticipantRole("role").notNull(),
	planningPermission: eventPlanningPermission("planning_permission").default("view_only").notNull(),
	status: eventInvitationStatus("status").default("pending").notNull(),
	invitedByUserId: text("invited_by_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	acceptedByUserId: text("accepted_by_user_id").references(() => user.id, { onDelete: "set null" }),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("event_invitation_event_id_idx").on(table.eventId),
	index("event_invitation_email_idx").on(table.email),
	uniqueIndex("event_invitation_pending_email_uidx").on(table.eventId, table.email).where(sql$1`${table.status} = 'pending'`)
]);
var planning_schema_exports = /* @__PURE__ */ __exportAll({
	eventExpense: () => eventExpense,
	eventNote: () => eventNote,
	expenseCategory: () => expenseCategory,
	expenseStatus: () => expenseStatus,
	idea: () => idea,
	ideaCategory: () => ideaCategory,
	ideaDecision: () => ideaDecision,
	ideaDecisionChoice: () => ideaDecisionChoice,
	ideaMusicTrack: () => ideaMusicTrack,
	ideaStatus: () => ideaStatus,
	musicTrack: () => musicTrack,
	registryCategory: () => registryCategory,
	registryCommitment: () => registryCommitment,
	registryCommitmentStatus: () => registryCommitmentStatus,
	registryItem: () => registryItem,
	workspacePlanningSettings: () => workspacePlanningSettings
});
var ideaCategory = pgEnum("idea_category", [
	"event",
	"registry",
	"venue",
	"attire",
	"flowers",
	"food",
	"photography",
	"music",
	"decor",
	"invitations",
	"honeymoon",
	"other"
]);
var ideaStatus = pgEnum("idea_status", [
	"new",
	"maybe",
	"shortlisted",
	"approved",
	"passed",
	"archived"
]);
var ideaDecisionChoice = pgEnum("idea_decision_choice", [
	"pass",
	"maybe",
	"love"
]);
var registryCategory = pgEnum("registry_category", [
	"home",
	"kitchen",
	"travel",
	"experience",
	"cash_fund"
]);
var registryCommitmentStatus = pgEnum("registry_commitment_status", ["active", "cancelled"]);
var expenseStatus = pgEnum("expense_status", [
	"estimated",
	"committed",
	"paid"
]);
var expenseCategory = pgEnum("expense_category", [
	"venue",
	"food_and_drink",
	"attire",
	"decor",
	"entertainment",
	"photography",
	"stationery",
	"travel",
	"gifts",
	"other"
]);
var workspacePlanningSettings = pgTable("workspace_planning_settings", {
	organizationId: text("organization_id").primaryKey().references(() => organization.id, { onDelete: "cascade" }),
	budgetCap: numeric("budget_cap", {
		precision: 14,
		scale: 2
	}),
	registryShared: boolean$2("registry_shared").default(false).notNull(),
	collaboratorLinkEnabled: boolean$2("collaborator_link_enabled").default(true).notNull(),
	requiresCollaboratorApproval: boolean$2("requires_collaborator_approval").default(true).notNull(),
	defaultCollaboratorPermission: eventPlanningPermission("default_collaborator_permission").default("contribute").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [check("workspace_planning_budget_cap_check", sql$1`${table.budgetCap} is null or ${table.budgetCap} >= 0`)]);
var idea = pgTable("idea", {
	id: uuid("id").defaultRandom().primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	eventId: uuid("event_id").notNull(),
	category: ideaCategory("category").notNull(),
	status: ideaStatus("status").default("new").notNull(),
	title: text("title"),
	note: text("note"),
	estimatedCost: numeric("estimated_cost", {
		precision: 14,
		scale: 2
	}),
	configuration: jsonb("configuration").$type().notNull(),
	submittedByUserId: text("submitted_by_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	uniqueIndex("idea_organization_id_id_uidx").on(table.organizationId, table.id),
	foreignKey({
		name: "idea_event_same_workspace_fk",
		columns: [table.organizationId, table.eventId],
		foreignColumns: [event.organizationId, event.id]
	}).onDelete("cascade"),
	index("idea_event_status_created_idx").on(table.eventId, table.status, table.createdAt),
	index("idea_submitted_by_user_id_idx").on(table.submittedByUserId),
	check("idea_estimated_cost_check", sql$1`${table.estimatedCost} is null or ${table.estimatedCost} >= 0`)
]);
var ideaDecision = pgTable("idea_decision", {
	ideaId: uuid("idea_id").notNull().references(() => idea.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	choice: ideaDecisionChoice("choice").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [primaryKey({ columns: [table.ideaId, table.userId] }), index("idea_decision_user_id_idx").on(table.userId)]);
var musicTrack = pgTable("music_track", {
	id: uuid("id").defaultRandom().primaryKey(),
	provider: text("provider").notNull(),
	providerTrackId: text("provider_track_id").notNull(),
	title: text("title").notNull(),
	artistName: text("artist_name").notNull(),
	albumTitle: text("album_title"),
	artworkUrl: text("artwork_url"),
	providerUrl: text("provider_url"),
	durationMs: integer("duration_ms"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [uniqueIndex("music_track_provider_id_uidx").on(table.provider, table.providerTrackId), check("music_track_duration_check", sql$1`${table.durationMs} is null or ${table.durationMs} >= 0`)]);
var ideaMusicTrack = pgTable("idea_music_track", {
	ideaId: uuid("idea_id").notNull().references(() => idea.id, { onDelete: "cascade" }),
	musicTrackId: uuid("music_track_id").notNull().references(() => musicTrack.id, { onDelete: "restrict" }),
	sortOrder: integer("sort_order").default(0).notNull()
}, (table) => [primaryKey({ columns: [table.ideaId, table.musicTrackId] }), index("idea_music_track_sort_idx").on(table.ideaId, table.sortOrder)]);
var eventExpense = pgTable("event_expense", {
	id: uuid("id").defaultRandom().primaryKey(),
	organizationId: text("organization_id").notNull(),
	eventId: uuid("event_id").notNull(),
	sourceIdeaId: uuid("source_idea_id"),
	title: text("title").notNull(),
	amount: numeric("amount", {
		precision: 14,
		scale: 2
	}).notNull(),
	category: expenseCategory("category").default("other").notNull(),
	status: expenseStatus("status").default("estimated").notNull(),
	createdByUserId: text("created_by_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	foreignKey({
		name: "event_expense_event_same_workspace_fk",
		columns: [table.organizationId, table.eventId],
		foreignColumns: [event.organizationId, event.id]
	}).onDelete("cascade"),
	foreignKey({
		name: "event_expense_idea_same_workspace_fk",
		columns: [table.organizationId, table.sourceIdeaId],
		foreignColumns: [idea.organizationId, idea.id]
	}).onDelete("restrict"),
	index("event_expense_event_status_idx").on(table.eventId, table.status),
	uniqueIndex("event_expense_source_idea_uidx").on(table.sourceIdeaId).where(sql$1`${table.sourceIdeaId} is not null`),
	check("event_expense_amount_check", sql$1`${table.amount} >= 0`)
]);
var eventNote = pgTable("event_note", {
	id: uuid("id").defaultRandom().primaryKey(),
	organizationId: text("organization_id").notNull(),
	eventId: uuid("event_id").notNull(),
	authorUserId: text("author_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	body: text("body").notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	foreignKey({
		name: "event_note_event_same_workspace_fk",
		columns: [table.organizationId, table.eventId],
		foreignColumns: [event.organizationId, event.id]
	}).onDelete("cascade"),
	index("event_note_event_sent_at_idx").on(table.eventId, table.sentAt),
	check("event_note_body_length_check", sql$1`char_length(${table.body}) between 1 and 750`)
]);
var registryItem = pgTable("registry_item", {
	id: uuid("id").defaultRandom().primaryKey(),
	organizationId: text("organization_id").notNull(),
	eventId: uuid("event_id").notNull(),
	sourceIdeaId: uuid("source_idea_id"),
	title: text("title").notNull(),
	note: text("note"),
	category: registryCategory("category").notNull(),
	price: numeric("price", {
		precision: 14,
		scale: 2
	}),
	quantity: integer("quantity").default(1).notNull(),
	createdByUserId: text("created_by_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	uniqueIndex("registry_item_organization_id_id_uidx").on(table.organizationId, table.id),
	foreignKey({
		name: "registry_item_event_same_workspace_fk",
		columns: [table.organizationId, table.eventId],
		foreignColumns: [event.organizationId, event.id]
	}).onDelete("cascade"),
	foreignKey({
		name: "registry_item_idea_same_workspace_fk",
		columns: [table.organizationId, table.sourceIdeaId],
		foreignColumns: [idea.organizationId, idea.id]
	}).onDelete("restrict"),
	index("registry_item_event_category_idx").on(table.eventId, table.category),
	uniqueIndex("registry_item_source_idea_uidx").on(table.sourceIdeaId).where(sql$1`${table.sourceIdeaId} is not null`),
	check("registry_item_price_check", sql$1`${table.price} is null or ${table.price} >= 0`),
	check("registry_item_quantity_check", sql$1`${table.quantity} > 0`)
]);
var registryCommitment = pgTable("registry_commitment", {
	id: uuid("id").defaultRandom().primaryKey(),
	registryItemId: uuid("registry_item_id").notNull().references(() => registryItem.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	quantity: integer("quantity").default(1).notNull(),
	status: registryCommitmentStatus("status").default("active").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	uniqueIndex("registry_commitment_item_user_uidx").on(table.registryItemId, table.userId),
	index("registry_commitment_user_id_idx").on(table.userId),
	check("registry_commitment_quantity_check", sql$1`${table.quantity} > 0`)
]);
var media_schema_exports = /* @__PURE__ */ __exportAll({
	eventMedia: () => eventMedia,
	eventMediaRole: () => eventMediaRole,
	ideaMedia: () => ideaMedia,
	mediaAsset: () => mediaAsset,
	mediaKind: () => mediaKind,
	mediaStatus: () => mediaStatus,
	mediaVisibility: () => mediaVisibility,
	planningMediaRole: () => planningMediaRole,
	registryItemMedia: () => registryItemMedia
});
var mediaKind = pgEnum("media_kind", [
	"image",
	"video",
	"audio"
]);
var mediaStatus = pgEnum("media_status", [
	"pending",
	"uploaded",
	"processing",
	"ready",
	"failed",
	"deleted"
]);
var mediaVisibility = pgEnum("media_visibility", ["private", "public"]);
var eventMediaRole = pgEnum("event_media_role", [
	"cover",
	"background",
	"gallery"
]);
var planningMediaRole = pgEnum("planning_media_role", ["cover", "gallery"]);
/**
* Storage metadata is intentionally independent from where media is displayed.
* The immutable object key can therefore be reused as a cover, background, or
* gallery item without copying or renaming the underlying object.
*/
var mediaAsset = pgTable("media_asset", {
	id: uuid("id").defaultRandom().primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	uploadedByUserId: text("uploaded_by_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	kind: mediaKind("kind").notNull(),
	status: mediaStatus("status").default("pending").notNull(),
	visibility: mediaVisibility("visibility").default("private").notNull(),
	storageProvider: text("storage_provider").default("r2").notNull(),
	bucket: text("bucket").notNull(),
	storageKey: text("storage_key").notNull(),
	originalFilename: text("original_filename").notNull(),
	displayName: text("display_name"),
	altText: text("alt_text"),
	contentType: text("content_type").notNull(),
	byteSize: bigint("byte_size", { mode: "number" }).notNull(),
	width: integer("width"),
	height: integer("height"),
	durationMs: integer("duration_ms"),
	checksum: text("checksum"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true })
}, (table) => [
	uniqueIndex("media_asset_storage_key_uidx").on(table.storageKey),
	uniqueIndex("media_asset_organization_id_id_uidx").on(table.organizationId, table.id),
	index("media_asset_organization_status_idx").on(table.organizationId, table.status),
	index("media_asset_uploaded_by_user_id_idx").on(table.uploadedByUserId),
	check("media_asset_byte_size_check", sql$1`${table.byteSize} > 0`),
	check("media_asset_dimensions_check", sql$1`(${table.width} is null or ${table.width} > 0) and (${table.height} is null or ${table.height} > 0)`),
	check("media_asset_duration_check", sql$1`${table.durationMs} is null or ${table.durationMs} >= 0`)
]);
/** Event-specific presentation data. Other domains receive their own typed
* association tables as their schemas land, preserving foreign-key integrity.
*/
var eventMedia = pgTable("event_media", {
	id: uuid("id").defaultRandom().primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	eventId: uuid("event_id").notNull(),
	mediaAssetId: uuid("media_asset_id").notNull(),
	role: eventMediaRole("role").default("gallery").notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	foreignKey({
		name: "event_media_event_same_workspace_fk",
		columns: [table.organizationId, table.eventId],
		foreignColumns: [event.organizationId, event.id]
	}).onDelete("cascade"),
	foreignKey({
		name: "event_media_asset_same_workspace_fk",
		columns: [table.organizationId, table.mediaAssetId],
		foreignColumns: [mediaAsset.organizationId, mediaAsset.id]
	}).onDelete("cascade"),
	uniqueIndex("event_media_event_asset_role_uidx").on(table.eventId, table.mediaAssetId, table.role),
	index("event_media_event_sort_idx").on(table.eventId, table.role, table.sortOrder),
	index("event_media_asset_id_idx").on(table.mediaAssetId)
]);
var ideaMedia = pgTable("idea_media", {
	id: uuid("id").defaultRandom().primaryKey(),
	organizationId: text("organization_id").notNull(),
	ideaId: uuid("idea_id").notNull(),
	mediaAssetId: uuid("media_asset_id").notNull(),
	role: planningMediaRole("role").default("gallery").notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	foreignKey({
		name: "idea_media_idea_same_workspace_fk",
		columns: [table.organizationId, table.ideaId],
		foreignColumns: [idea.organizationId, idea.id]
	}).onDelete("cascade"),
	foreignKey({
		name: "idea_media_asset_same_workspace_fk",
		columns: [table.organizationId, table.mediaAssetId],
		foreignColumns: [mediaAsset.organizationId, mediaAsset.id]
	}).onDelete("cascade"),
	uniqueIndex("idea_media_idea_asset_role_uidx").on(table.ideaId, table.mediaAssetId, table.role),
	index("idea_media_idea_sort_idx").on(table.ideaId, table.role, table.sortOrder)
]);
var registryItemMedia = pgTable("registry_item_media", {
	id: uuid("id").defaultRandom().primaryKey(),
	organizationId: text("organization_id").notNull(),
	registryItemId: uuid("registry_item_id").notNull(),
	mediaAssetId: uuid("media_asset_id").notNull(),
	role: planningMediaRole("role").default("gallery").notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	foreignKey({
		name: "registry_media_item_same_workspace_fk",
		columns: [table.organizationId, table.registryItemId],
		foreignColumns: [registryItem.organizationId, registryItem.id]
	}).onDelete("cascade"),
	foreignKey({
		name: "registry_media_asset_same_workspace_fk",
		columns: [table.organizationId, table.mediaAssetId],
		foreignColumns: [mediaAsset.organizationId, mediaAsset.id]
	}).onDelete("cascade"),
	uniqueIndex("registry_media_item_asset_role_uidx").on(table.registryItemId, table.mediaAssetId, table.role),
	index("registry_media_item_sort_idx").on(table.registryItemId, table.role, table.sortOrder)
]);
var databaseRelations = defineRelationsPart({
	...auth_schema_exports,
	...event_schema_exports,
	...media_schema_exports,
	...planning_schema_exports
}, (r) => ({
	user: {
		sessions: r.many.session({
			from: r.user.id,
			to: r.session.userId
		}),
		accounts: r.many.account({
			from: r.user.id,
			to: r.account.userId
		}),
		members: r.many.member({
			from: r.user.id,
			to: r.member.userId
		}),
		teamMembers: r.many.teamMember({
			from: r.user.id,
			to: r.teamMember.userId
		}),
		invitations: r.many.invitation({
			from: r.user.id,
			to: r.invitation.inviterId
		}),
		eventParticipants: r.many.eventParticipant({
			from: r.user.id,
			to: r.eventParticipant.userId
		}),
		uploadedMedia: r.many.mediaAsset({
			from: r.user.id,
			to: r.mediaAsset.uploadedByUserId
		}),
		submittedIdeas: r.many.idea({
			from: r.user.id,
			to: r.idea.submittedByUserId
		}),
		ideaDecisions: r.many.ideaDecision({
			from: r.user.id,
			to: r.ideaDecision.userId
		}),
		registryCommitments: r.many.registryCommitment({
			from: r.user.id,
			to: r.registryCommitment.userId
		})
	},
	session: { user: r.one.user({
		from: r.session.userId,
		to: r.user.id
	}) },
	account: { user: r.one.user({
		from: r.account.userId,
		to: r.user.id
	}) },
	organization: {
		members: r.many.member({
			from: r.organization.id,
			to: r.member.organizationId
		}),
		teams: r.many.team({
			from: r.organization.id,
			to: r.team.organizationId
		}),
		invitations: r.many.invitation({
			from: r.organization.id,
			to: r.invitation.organizationId
		}),
		events: r.many.event({
			from: r.organization.id,
			to: r.event.organizationId
		}),
		mediaAssets: r.many.mediaAsset({
			from: r.organization.id,
			to: r.mediaAsset.organizationId
		}),
		planningSettings: r.one.workspacePlanningSettings({
			from: r.organization.id,
			to: r.workspacePlanningSettings.organizationId
		}),
		ideas: r.many.idea({
			from: r.organization.id,
			to: r.idea.organizationId
		})
	},
	member: {
		organization: r.one.organization({
			from: r.member.organizationId,
			to: r.organization.id
		}),
		user: r.one.user({
			from: r.member.userId,
			to: r.user.id
		})
	},
	team: {
		organization: r.one.organization({
			from: r.team.organizationId,
			to: r.organization.id
		}),
		teamMembers: r.many.teamMember({
			from: r.team.id,
			to: r.teamMember.teamId
		})
	},
	teamMember: {
		team: r.one.team({
			from: r.teamMember.teamId,
			to: r.team.id
		}),
		user: r.one.user({
			from: r.teamMember.userId,
			to: r.user.id
		})
	},
	invitation: {
		organization: r.one.organization({
			from: r.invitation.organizationId,
			to: r.organization.id
		}),
		user: r.one.user({
			from: r.invitation.inviterId,
			to: r.user.id
		})
	},
	event: {
		workspace: r.one.organization({
			from: r.event.organizationId,
			to: r.organization.id
		}),
		parent: r.one.event({
			from: r.event.parentEventId,
			to: r.event.id,
			alias: "event_parent"
		}),
		children: r.many.event({
			from: r.event.id,
			to: r.event.parentEventId,
			alias: "event_children"
		}),
		participants: r.many.eventParticipant({
			from: r.event.id,
			to: r.eventParticipant.eventId
		}),
		invitations: r.many.eventInvitation({
			from: r.event.id,
			to: r.eventInvitation.eventId
		}),
		media: r.many.eventMedia({
			from: r.event.id,
			to: r.eventMedia.eventId
		}),
		ideas: r.many.idea({
			from: r.event.id,
			to: r.idea.eventId
		}),
		expenses: r.many.eventExpense({
			from: r.event.id,
			to: r.eventExpense.eventId
		}),
		notes: r.many.eventNote({
			from: r.event.id,
			to: r.eventNote.eventId
		}),
		registryItems: r.many.registryItem({
			from: r.event.id,
			to: r.registryItem.eventId
		})
	},
	eventParticipant: {
		event: r.one.event({
			from: r.eventParticipant.eventId,
			to: r.event.id
		}),
		user: r.one.user({
			from: r.eventParticipant.userId,
			to: r.user.id
		})
	},
	eventInvitation: {
		event: r.one.event({
			from: r.eventInvitation.eventId,
			to: r.event.id
		}),
		inviter: r.one.user({
			from: r.eventInvitation.invitedByUserId,
			to: r.user.id,
			alias: "event_invitation_inviter"
		}),
		acceptedBy: r.one.user({
			from: r.eventInvitation.acceptedByUserId,
			to: r.user.id,
			alias: "event_invitation_acceptor"
		})
	},
	mediaAsset: {
		workspace: r.one.organization({
			from: r.mediaAsset.organizationId,
			to: r.organization.id
		}),
		uploadedBy: r.one.user({
			from: r.mediaAsset.uploadedByUserId,
			to: r.user.id
		}),
		eventPlacements: r.many.eventMedia({
			from: r.mediaAsset.id,
			to: r.eventMedia.mediaAssetId
		}),
		ideaPlacements: r.many.ideaMedia({
			from: r.mediaAsset.id,
			to: r.ideaMedia.mediaAssetId
		}),
		registryPlacements: r.many.registryItemMedia({
			from: r.mediaAsset.id,
			to: r.registryItemMedia.mediaAssetId
		})
	},
	eventMedia: {
		event: r.one.event({
			from: r.eventMedia.eventId,
			to: r.event.id
		}),
		asset: r.one.mediaAsset({
			from: r.eventMedia.mediaAssetId,
			to: r.mediaAsset.id
		})
	},
	workspacePlanningSettings: { workspace: r.one.organization({
		from: r.workspacePlanningSettings.organizationId,
		to: r.organization.id
	}) },
	idea: {
		workspace: r.one.organization({
			from: r.idea.organizationId,
			to: r.organization.id
		}),
		event: r.one.event({
			from: r.idea.eventId,
			to: r.event.id
		}),
		submittedBy: r.one.user({
			from: r.idea.submittedByUserId,
			to: r.user.id
		}),
		decisions: r.many.ideaDecision({
			from: r.idea.id,
			to: r.ideaDecision.ideaId
		}),
		musicTracks: r.many.ideaMusicTrack({
			from: r.idea.id,
			to: r.ideaMusicTrack.ideaId
		}),
		media: r.many.ideaMedia({
			from: r.idea.id,
			to: r.ideaMedia.ideaId
		})
	},
	ideaDecision: {
		idea: r.one.idea({
			from: r.ideaDecision.ideaId,
			to: r.idea.id
		}),
		user: r.one.user({
			from: r.ideaDecision.userId,
			to: r.user.id
		})
	},
	musicTrack: { ideas: r.many.ideaMusicTrack({
		from: r.musicTrack.id,
		to: r.ideaMusicTrack.musicTrackId
	}) },
	ideaMusicTrack: {
		idea: r.one.idea({
			from: r.ideaMusicTrack.ideaId,
			to: r.idea.id
		}),
		track: r.one.musicTrack({
			from: r.ideaMusicTrack.musicTrackId,
			to: r.musicTrack.id
		})
	},
	eventExpense: {
		event: r.one.event({
			from: r.eventExpense.eventId,
			to: r.event.id
		}),
		sourceIdea: r.one.idea({
			from: r.eventExpense.sourceIdeaId,
			to: r.idea.id
		})
	},
	eventNote: {
		event: r.one.event({
			from: r.eventNote.eventId,
			to: r.event.id
		}),
		author: r.one.user({
			from: r.eventNote.authorUserId,
			to: r.user.id
		})
	},
	registryItem: {
		event: r.one.event({
			from: r.registryItem.eventId,
			to: r.event.id
		}),
		sourceIdea: r.one.idea({
			from: r.registryItem.sourceIdeaId,
			to: r.idea.id
		}),
		commitments: r.many.registryCommitment({
			from: r.registryItem.id,
			to: r.registryCommitment.registryItemId
		}),
		media: r.many.registryItemMedia({
			from: r.registryItem.id,
			to: r.registryItemMedia.registryItemId
		})
	},
	registryCommitment: {
		item: r.one.registryItem({
			from: r.registryCommitment.registryItemId,
			to: r.registryItem.id
		}),
		user: r.one.user({
			from: r.registryCommitment.userId,
			to: r.user.id
		})
	},
	ideaMedia: {
		idea: r.one.idea({
			from: r.ideaMedia.ideaId,
			to: r.idea.id
		}),
		asset: r.one.mediaAsset({
			from: r.ideaMedia.mediaAssetId,
			to: r.mediaAsset.id
		})
	},
	registryItemMedia: {
		item: r.one.registryItem({
			from: r.registryItemMedia.registryItemId,
			to: r.registryItem.id
		}),
		asset: r.one.mediaAsset({
			from: r.registryItemMedia.mediaAssetId,
			to: r.mediaAsset.id
		})
	}
}));
var globalDatabase = globalThis;
var pool = globalDatabase.gatheroryPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (env$1.NODE_ENV !== "production") globalDatabase.gatheroryPool = pool;
var db = drizzle({
	client: pool,
	relations: databaseRelations
});
function AuthEmailLayout({ preview, eyebrow, heading, actionLabel, actionUrl, children, footer }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Html, {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Head, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tailwind, {
			config: { presets: [pixelBasedPreset] },
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Body, {
				className: "m-0 bg-[#f3f6fb] px-[16px] py-[40px] font-sans text-[#172033]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Preview, { children: preview }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Container, {
					className: "mx-auto w-full max-w-[520px] rounded-[24px] border border-solid border-[#dce4f0] bg-white px-[40px] py-[40px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
							className: "m-0 text-[13px] font-bold uppercase tracking-[1.6px] text-[#007aff]",
							children: "Gatherory"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
							className: "mb-[12px] mt-[28px] text-[13px] font-semibold uppercase tracking-[1.2px] text-[#526176]",
							children: eyebrow
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, {
							className: "m-0 text-[32px] font-semibold leading-[38px] tracking-[-0.8px] text-[#172033]",
							children: heading
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							className: "mt-[22px]",
							children
						}),
						actionLabel && actionUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								href: actionUrl,
								className: "box-border w-full rounded-[12px] bg-[#007aff] px-[20px] py-[14px] text-center text-[16px] font-semibold text-white",
								children: actionLabel
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
								className: "mb-0 mt-[24px] text-[13px] leading-[20px] text-[#526176]",
								children: "If the button does not work, copy and paste this link into your browser:"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								href: actionUrl,
								className: "break-all text-[13px] leading-[20px] text-[#0066cc] underline",
								children: actionUrl
							})
						] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hr, { className: "my-[28px] border-0 border-t border-solid border-[#dce4f0]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
							className: "m-0 text-[12px] leading-[18px] text-[#66758a]",
							children: footer
						})
					]
				})]
			})
		})]
	});
}
function PasswordResetEmail({ name = "Alex", resetUrl = "https://app.gatherory.example/auth/reset-password?token=preview" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthEmailLayout, {
		preview: "Choose a new password for your Gatherory account.",
		eyebrow: "Account security",
		heading: "Reset your password",
		actionLabel: "Choose a new password",
		actionUrl: resetUrl,
		footer: "This password reset link expires in 60 minutes. If you did not request it, you can safely ignore this email. Your password will not change.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Text, {
			className: "mb-[12px] mt-0 text-[16px] leading-[26px] text-[#263449]",
			children: [
				"Hi ",
				name,
				","
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
			className: "mb-[24px] mt-0 text-[16px] leading-[26px] text-[#263449]",
			children: "We received a request to reset your Gatherory password. Use the secure link below to choose a new one."
		})]
	});
}
PasswordResetEmail.PreviewProps = {
	name: "Alex",
	resetUrl: "https://app.gatherory.example/auth/reset-password?token=preview"
};
function EmailOtpEmail({ code = "482913", purpose = "sign in" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthEmailLayout, {
		preview: `Your Gatherory code is ${code}`,
		eyebrow: "One-time code",
		heading: `Use this code to ${purpose}`,
		footer: "This code expires in 10 minutes. You have three attempts to enter it. If you did not request it, you can ignore this email.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
			className: "m-0 text-[16px] leading-[26px] text-[#526176]",
			children: "Enter this six-digit code in Gatherory. Never share it with anyone."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
			className: "my-[24px] rounded-[16px] border border-solid border-[#dce4f0] bg-[#f3f6fb] px-[24px] py-[20px] text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
				className: "m-0 text-[36px] font-bold leading-[44px] tracking-[8px] text-[#172033]",
				children: code
			})
		})]
	});
}
EmailOtpEmail.PreviewProps = {
	code: "482913",
	purpose: "sign in"
};
function MagicLinkEmail({ magicLinkUrl = "https://app.gatherory.com/api/auth/magic-link/verify?token=preview" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthEmailLayout, {
		preview: "Your secure Gatherory sign-in link",
		eyebrow: "Passwordless sign in",
		heading: "Sign in to Gatherory",
		actionLabel: "Sign in to Gatherory",
		actionUrl: magicLinkUrl,
		footer: "This link expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
			className: "m-0 text-[16px] leading-[26px] text-[#526176]",
			children: "Use the secure link below to sign in without entering your password."
		})
	});
}
MagicLinkEmail.PreviewProps = { magicLinkUrl: "https://app.gatherory.com/api/auth/magic-link/verify?token=preview" };
function VerifyEmail({ name = "Alex", verificationUrl = "https://app.gatherory.example/api/auth/verify-email?token=preview" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthEmailLayout, {
		preview: "Verify your email to finish setting up Gatherory.",
		eyebrow: "Confirm your account",
		heading: "Verify your email",
		actionLabel: "Verify email address",
		actionUrl: verificationUrl,
		footer: "This verification link expires in 60 minutes. If you did not create a Gatherory account, you can safely ignore this email.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Text, {
			className: "mb-[12px] mt-0 text-[16px] leading-[26px] text-[#263449]",
			children: [
				"Hi ",
				name,
				","
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
			className: "mb-[24px] mt-0 text-[16px] leading-[26px] text-[#263449]",
			children: "Confirm that this email belongs to you so you can start planning and collaborating in Gatherory."
		})]
	});
}
VerifyEmail.PreviewProps = {
	name: "Alex",
	verificationUrl: "https://app.gatherory.example/api/auth/verify-email?token=preview"
};
var EmailConnector = class extends Service()("EmailConnector") {};
var InvalidInputError = class extends TaggedError("InvalidInputError") {};
var ForbiddenError = class extends TaggedError("ForbiddenError") {};
var EntityNotFoundError = class extends TaggedError("EntityNotFoundError") {};
var ConflictError = class extends TaggedError("ConflictError") {};
var PersistenceError = class extends TaggedError("PersistenceError") {};
var ExternalServiceError = class extends TaggedError("ExternalServiceError") {};
var defaultMessage = {
	validation: "The request could not be processed.",
	authorization: "You are not allowed to perform this action.",
	not_found: "The requested resource was not found.",
	conflict: "This action cannot be completed in its current state.",
	external: "A required service is temporarily unavailable.",
	system: "Something went wrong."
};
function findDomainError(cause) {
	for (const reason of cause.reasons) if (isFailReason(reason) && typeof reason.error === "object" && reason.error !== null && "category" in reason.error && "code" in reason.error) return reason.error;
}
function debugMessage(cause) {
	if (cause instanceof Error) return cause.message;
	if (typeof cause === "string") return cause;
	return cause === void 0 ? void 0 : String(cause);
}
/**
* The only Effect-to-transport boundary used by server functions. Domain and
* infrastructure failures are logged with a correlation ID; clients receive
* only deliberately safe product copy.
*/
async function runServerEffect(program) {
	const traceId = crypto.randomUUID();
	const exit = await runPromiseExit(program.pipe(annotateLogs({ traceId })));
	if (isSuccess(exit)) return {
		ok: true,
		data: exit.value
	};
	const domainError = findDomainError(exit.cause);
	const errorId = crypto.randomUUID();
	const category = domainError?.category ?? "system";
	runFork(logError("Server operation failed").pipe(annotateLogs({
		traceId,
		errorId,
		category,
		code: domainError?.code ?? "UNEXPECTED_SERVER_ERROR",
		debugMessage: domainError?.debugMessage ?? debugMessage(domainError?.cause) ?? "none",
		cause: pretty(exit.cause)
	})));
	return {
		ok: false,
		error: {
			userMessage: domainError?.userMessage ?? defaultMessage[category],
			errorId
		}
	};
}
function tryPersistence(code, operation) {
	return tryPromise({
		try: operation,
		catch: (cause) => new PersistenceError({
			category: "system",
			code,
			cause,
			debugMessage: debugMessage(cause)
		})
	});
}
function deliveryError(code, cause) {
	return new ExternalServiceError({
		category: "external",
		code,
		userMessage: "We could not send the email. Please try again later.",
		cause,
		debugMessage: cause instanceof Error ? cause.message : void 0
	});
}
var EmailConnectorLive = sync(EmailConnector, () => {
	const resend = env$1.RESEND_API_KEY ? new Resend(env$1.RESEND_API_KEY) : null;
	return { send: (input) => {
		if (!resend || !env$1.EMAIL_FROM) return fail(deliveryError("EMAIL_NOT_CONFIGURED"));
		return tryPromise({
			try: async () => {
				const { data, error } = await resend.emails.send({
					from: env$1.EMAIL_FROM,
					to: input.to,
					subject: input.subject,
					text: input.text,
					react: input.react,
					...env$1.EMAIL_REPLY_TO ? { replyTo: env$1.EMAIL_REPLY_TO } : {}
				});
				if (error) throw error;
				if (!data) throw new Error("Resend returned no delivery receipt.");
				return { messageId: data.id };
			},
			catch: (cause) => deliveryError("EMAIL_DELIVERY_FAILED", cause)
		});
	} };
});
function recipientName(name) {
	return name?.trim() || "there";
}
var otpCopy = {
	"sign-in": {
		purpose: "sign in",
		subject: "Your Gatherory sign-in code"
	},
	"email-verification": {
		purpose: "verify your email",
		subject: "Verify your Gatherory email"
	},
	"forget-password": {
		purpose: "reset your password",
		subject: "Your Gatherory password reset code"
	},
	"change-email": {
		purpose: "change your email",
		subject: "Confirm your Gatherory email change"
	}
};
function schedule(program) {
	const delivery = runPromise(program.pipe(provide(EmailConnectorLive), tapError((error) => logError("Authentication email delivery failed").pipe(annotateLogs({ error: String(error) }))), catch_(() => succeed(void 0))));
	(0, import_functions.waitUntil)(delivery);
}
function scheduleVerificationEmail(input) {
	const name = recipientName(input.name);
	const text = [
		`Hi ${name},`,
		"",
		"Verify your email address to finish setting up your Gatherory account:",
		input.verificationUrl,
		"",
		"This link expires in 60 minutes. If you did not create a Gatherory account, you can ignore this email."
	].join("\n");
	schedule(gen(function* () {
		return yield* (yield* EmailConnector).send({
			to: input.to,
			subject: "Verify your Gatherory email",
			text,
			react: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerifyEmail, {
				name,
				verificationUrl: input.verificationUrl
			})
		});
	}));
}
function schedulePasswordResetEmail(input) {
	const name = recipientName(input.name);
	const text = [
		`Hi ${name},`,
		"",
		"Use this link to choose a new password for your Gatherory account:",
		input.resetUrl,
		"",
		"This link expires in 60 minutes. If you did not request a password reset, you can ignore this email."
	].join("\n");
	schedule(gen(function* () {
		return yield* (yield* EmailConnector).send({
			to: input.to,
			subject: "Reset your Gatherory password",
			text,
			react: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordResetEmail, {
				name,
				resetUrl: input.resetUrl
			})
		});
	}));
}
function scheduleEmailOtp(input) {
	const copy = otpCopy[input.type];
	const text = [
		`Use this code to ${copy.purpose} in Gatherory:`,
		"",
		input.otp,
		"",
		"This code expires in 10 minutes. You have three attempts to enter it. Never share it with anyone."
	].join("\n");
	schedule(gen(function* () {
		return yield* (yield* EmailConnector).send({
			to: input.to,
			subject: copy.subject,
			text,
			react: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmailOtpEmail, {
				code: input.otp,
				purpose: copy.purpose
			})
		});
	}));
}
function scheduleMagicLinkEmail(input) {
	const text = [
		"Use this secure link to sign in to Gatherory:",
		input.magicLinkUrl,
		"",
		"This link expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email."
	].join("\n");
	schedule(gen(function* () {
		return yield* (yield* EmailConnector).send({
			to: input.to,
			subject: "Sign in to Gatherory",
			text,
			react: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MagicLinkEmail, { magicLinkUrl: input.magicLinkUrl })
		});
	}));
}
var google = env$1.GOOGLE_CLIENT_ID && env$1.GOOGLE_CLIENT_SECRET ? {
	clientId: env$1.GOOGLE_CLIENT_ID,
	clientSecret: env$1.GOOGLE_CLIENT_SECRET
} : void 0;
var appleCredentialValues = [
	env$1.APPLE_CLIENT_ID,
	env$1.APPLE_TEAM_ID,
	env$1.APPLE_KEY_ID,
	env$1.APPLE_PRIVATE_KEY
];
var hasAnyAppleCredential = appleCredentialValues.some(Boolean);
var hasAllAppleCredentials = appleCredentialValues.every(Boolean);
if (hasAnyAppleCredential && !hasAllAppleCredentials) throw new Error("Apple authentication requires APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY.");
async function generateAppleClientSecret({ clientId, teamId, keyId, privateKey }) {
	const signingKey = await importPKCS8(privateKey.replace(/\\n/g, "\n").trim(), "ES256");
	const now = Math.floor(Date.now() / 1e3);
	return new SignJWT({}).setProtectedHeader({
		alg: "ES256",
		kid: keyId
	}).setIssuer(teamId).setSubject(clientId).setAudience("https://appleid.apple.com").setIssuedAt(now).setExpirationTime(now + 15552e3).sign(signingKey);
}
var apple = hasAllAppleCredentials ? async () => {
	const clientId = env$1.APPLE_CLIENT_ID;
	return {
		clientId,
		clientSecret: await generateAppleClientSecret({
			clientId,
			teamId: env$1.APPLE_TEAM_ID,
			keyId: env$1.APPLE_KEY_ID,
			privateKey: env$1.APPLE_PRIVATE_KEY
		}),
		...env$1.APPLE_APP_BUNDLE_IDENTIFIER ? { appBundleIdentifier: env$1.APPLE_APP_BUNDLE_IDENTIFIER } : {}
	};
} : void 0;
var auth = betterAuth({
	appName: "Gatherory",
	baseURL: env$1.BETTER_AUTH_URL,
	secret: env$1.BETTER_AUTH_SECRET,
	trustedOrigins: [new URL(env$1.BETTER_AUTH_URL).origin, "https://appleid.apple.com"],
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: auth_schema_exports,
		transaction: true
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		revokeSessionsOnPasswordReset: true,
		resetPasswordTokenExpiresIn: 3600,
		sendResetPassword: async ({ user, url }) => {
			schedulePasswordResetEmail({
				to: user.email,
				name: user.name,
				resetUrl: url
			});
		}
	},
	emailVerification: {
		expiresIn: 3600,
		sendOnSignUp: true,
		sendOnSignIn: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			scheduleVerificationEmail({
				to: user.email,
				name: user.name,
				verificationUrl: url
			});
		}
	},
	socialProviders: {
		...google ? { google } : {},
		...apple ? { apple } : {}
	},
	advanced: {
		backgroundTasks: { handler: import_functions.waitUntil },
		database: { joins: true }
	},
	plugins: [
		bearer(),
		emailOTP({
			otpLength: 6,
			expiresIn: 600,
			allowedAttempts: 3,
			disableSignUp: true,
			storeOTP: "hashed",
			resendStrategy: "rotate",
			sendVerificationOTP: async ({ email, otp, type }) => {
				scheduleEmailOtp({
					to: email,
					otp,
					type
				});
			}
		}),
		magicLink({
			expiresIn: 600,
			disableSignUp: true,
			storeToken: "hashed",
			sendMagicLink: async ({ email, url }) => {
				scheduleMagicLinkEmail({
					to: email,
					magicLinkUrl: url
				});
			}
		}),
		organization$1({
			teams: {
				enabled: true,
				allowRemovingAllTeams: false
			},
			schema: { organization: { additionalFields: { workspaceType: {
				type: "string",
				required: true,
				defaultValue: "personal",
				input: false
			} } } },
			organizationHooks: {
				beforeCreateOrganization: async ({ organization: workspace }) => ({ data: {
					...workspace,
					slug: workspace.slug?.trim().toLowerCase()
				} }),
				beforeCreateTeam: async ({ team }) => ({ data: {
					...team,
					name: team.name.trim()
				} })
			}
		}),
		tanstackStartCookies()
	]
});
/**
* Establishes identity for a server function. Event membership and capability
* checks belong to event-scoped authorization middleware, not this middleware.
*/
var requireSessionMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
	const session = await auth.api.getSession({ headers: getRequestHeaders() });
	if (!session) throw redirect({
		to: "/auth/$path",
		params: { path: "sign-in" }
	});
	return next({ context: {
		session: session.session,
		user: session.user
	} });
});
//#endregion
export { requireSessionMiddleware as C, user as D, tryPersistence as E, workspacePlanningSettings as O, parseJSON as S, teamMember as T, hasPermissionFn as _, InvalidInputError as a, organization as b, adminAc as c, db as d, defaultRoles$1 as f, getBaseURL as g, eventParticipant as h, ForbiddenError as i, auth as l, eventInvitation as m, EMAIL_OTP_ERROR_CODES as n, ORGANIZATION_ERROR_CODES as o, event as p, EntityNotFoundError as r, PACKAGE_VERSION as s, ConflictError as t, createAccessControl as u, member as v, runServerEffect as w, ownerAc as x, memberAc as y };
