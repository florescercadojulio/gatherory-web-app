//#region node_modules/.pnpm/@better-auth-ui+core@1.7.27_17797606c8ca7fa6484a48add331f83f/node_modules/@better-auth-ui/core/dist/lib/view-paths.js
var e$5 = {
	admin: { users: "users" },
	auth: {
		callback: "callback",
		error: "error",
		redirect: "redirect",
		signIn: "sign-in",
		signUp: "sign-up",
		forgotPassword: "forgot-password",
		resetPassword: "reset-password",
		resetLinkSent: "reset-link-sent",
		signOut: "sign-out",
		verifyEmail: "verify-email"
	},
	settings: {
		account: "account",
		security: "security"
	}
};
//#endregion
//#region node_modules/.pnpm/@better-auth-ui+core@1.7.27_17797606c8ca7fa6484a48add331f83f/node_modules/@better-auth-ui/core/dist/auth-config-DNZHJA55.js
var t$2 = {
	errors: {
		generic: "Something went wrong. Please try again.",
		invalidCredentials: "The sign-in details are incorrect. Please try again.",
		invalidCode: "This code is invalid or has expired. Request a new code.",
		sessionExpired: "Please sign in again to continue.",
		permissionDenied: "You don't have permission to do this.",
		rateLimited: "Too many attempts. Please wait and try again.",
		passwordTooShort: "Your password is too short.",
		passwordTooLong: "Your password is too long.",
		accountExists: "An account with these details already exists. Try signing in.",
		popupBlocked: "Allow popups in your browser, then try signing in again.",
		popupTimeout: "Sign-in timed out. Please try again.",
		passkeyFailed: "Couldn't sign in with your passkey. Try again or use another sign-in method.",
		walletFailed: "Couldn't complete the wallet request. Check your wallet and try again.",
		copyFailed: "Couldn't copy. Try again.",
		imageUploadFailed: "Couldn't upload this image. Try another image.",
		imageDeleteFailed: "Couldn't delete the image. Please try again.",
		roleHasMembers: "Move members to another role before deleting this role."
	},
	auth: {
		callbackAccountLinkedTitle: "Account linked",
		callbackAccountLinkedDescription: "Your account is now connected.",
		callbackAccountLinkConflictTitle: "This account is already connected",
		callbackAccountLinkConflictDescription: "The provider account belongs to a different user or cannot be linked safely.",
		callbackCancelledTitle: "Authentication was cancelled",
		callbackCancelledDescription: "No changes were made. You can try again when you are ready.",
		callbackFailedTitle: "We could not complete authentication",
		callbackFailedDescription: "The callback could not be verified. Return to sign in and try again.",
		callbackContinue: "Continue",
		callbackEmailVerifiedTitle: "Email verified",
		callbackEmailVerifiedDescription: "Your email address is verified. You can continue to your account.",
		callbackEmailNotVerifiedTitle: "Verify your email first",
		callbackEmailNotVerifiedDescription: "Check your inbox for a verification link before you sign in.",
		callbackExpiredLinkTitle: "This link has expired",
		callbackExpiredLinkDescription: "Request a new link and use the most recent message in your inbox.",
		callbackGenericErrorTitle: "Something went wrong",
		callbackGenericErrorDescription: "We could not finish this request. Return to sign in and try again.",
		callbackGenericSuccessTitle: "All set",
		callbackGenericSuccessDescription: "Authentication completed successfully.",
		callbackMissingEmailTitle: "Email address unavailable",
		callbackMissingEmailDescription: "The provider did not share an email address. Try another sign-in method.",
		callbackPasswordResetTitle: "Password reset",
		callbackPasswordResetDescription: "Your password was reset. Sign in with your new password.",
		callbackSignupCompleteTitle: "Account created",
		callbackSignupCompleteDescription: "Your account is ready. You can continue.",
		callbackSignupDisabledTitle: "Sign-up is unavailable",
		callbackSignupDisabledDescription: "New accounts cannot be created with this sign-in method. Try signing in instead.",
		callbackViewAccountSettings: "Account settings",
		account: "Account",
		alreadyHaveAnAccount: "Already have an account?",
		alreadyVerifiedYourEmail: "Already verified your email?",
		confirmPassword: "Confirm password",
		confirmPasswordPlaceholder: "Confirm your password",
		checkYourEmail: "Check your email for a verification link",
		checkYourEmailTitle: "Check your email",
		continueWith: "Continue with {{provider}}",
		email: "Email",
		emailPlaceholder: "m@example.com",
		fieldRequired: "This field is required",
		forgotPassword: "Forgot Password",
		forgotPasswordLink: "Forgot password?",
		hidePassword: "Hide password",
		invalidEmail: "Please enter a valid email address",
		invalidResetPasswordToken: "Invalid reset password token",
		name: "Name",
		namePlaceholder: "Name",
		needToCreateAnAccount: "Need to create an account?",
		newPassword: "New password",
		newPasswordPlaceholder: "New password",
		openEmailProvider: "Open {{provider}}",
		or: "OR",
		optional: " (optional)",
		password: "Password",
		passwordCompromised: "This password has appeared in a data breach. Pick a different one.",
		passwordFair: "Fair",
		passwordGood: "Good",
		passwordPlaceholder: "Password",
		passwordResetEmailSent: "Password reset email sent",
		passwordResetErrorDescription: "Unable to reset your password. Try again.",
		passwordResetSuccess: "Password reset successfully",
		passwordResetSuccessDescription: "Password reset successfully. You can sign in with your new password.",
		passwordStrength: "Password strength",
		passwordStrong: "Strong",
		passwordWeak: "Weak",
		passwordsDoNotMatch: "Passwords do not match",
		rememberMe: "Remember me",
		tooLong: "Must be at most {{max}} characters",
		tooShort: "Must be at least {{min}} characters",
		rememberYourPassword: "Remember your password?",
		resend: "Resend",
		resendIn: "Resend in {{seconds}}s",
		resetLinkSentTo: "We sent a password reset link to {{email}}",
		resetPassword: "Reset Password",
		sendResetLink: "Send reset link",
		scanToOpenEmailProvider: "Scan to open {{provider}} on your phone",
		showPassword: "Show password",
		signIn: "Sign In",
		signOut: "Sign Out",
		signUp: "Sign Up",
		verificationEmailSent: "Verification email sent!",
		verifyEmail: "Verify Email"
	},
	settings: {
		account: "Account",
		accountUnlinked: "Account unlinked",
		active: "Active",
		activeSessions: "Active sessions",
		reauthenticationTitle: "Sign in again",
		reauthenticationDescription: "Please sign in again to verify it’s you before continuing.",
		reauthenticationAction: "Sign in again",
		avatar: "Avatar",
		currentSession: "Current session",
		avatarChangedSuccess: "Avatar changed successfully",
		avatarDeletedSuccess: "Avatar deleted successfully",
		changeAvatar: "Change avatar",
		deleteAvatar: "Delete avatar",
		link: "Link",
		linkedAccounts: "Linked accounts",
		lastAccountUnlinkingDisabled: "Link another sign-in method before unlinking this account.",
		linkProvider: "Link your {{provider}} account",
		cancel: "Cancel",
		copyToClipboard: "Copy to clipboard",
		copiedToClipboard: "Copied to clipboard",
		changeEmail: "Change email",
		changeEmailSuccess: "Check your email to confirm the change",
		changePassword: "Change password",
		changePasswordSuccess: "Password changed successfully",
		currentPassword: "Current password",
		currentPasswordPlaceholder: "Enter your current password",
		dangerZone: "Danger zone",
		delete: "Delete",
		optional: "Optional",
		profileUpdatedSuccess: "Profile updated successfully",
		revoke: "Revoke",
		revokeSession: "Revoke session",
		revokeSessionSuccess: "Session revoked successfully",
		signOutOtherDevices: "Sign out other devices",
		signOutOtherDevicesDescription: "This signs you out on every device except this one.",
		signOutOtherDevicesSuccess: "Other devices signed out successfully",
		signOutEverywhere: "Sign out everywhere",
		signOutEverywhereDescription: "This signs you out on this device and every other device.",
		saveChanges: "Save changes",
		setPassword: "Set password",
		setPasswordDescription: "You don't have a password yet. Request a reset link to set one up.",
		security: "Security",
		settings: "Settings",
		time: "Time",
		unlinkProvider: "Unlink {{provider}}",
		updateEmail: "Update email",
		updatePassword: "Update password",
		uploadAvatar: "Upload avatar",
		userProfile: "User profile"
	}
};
function o$2(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function s$2(e) {
	return !(!o$2(e) || e instanceof Date || e instanceof RegExp);
}
function c$1(e, t = 256, n = "png") {
	let r = t, i = n === "inherit" ? e.name.split(".").pop() : n, a = n === "inherit" ? e.type : `image/${n === "jpg" ? "jpeg" : n}`;
	return new Promise((t, n) => {
		let o = new Image(), s = URL.createObjectURL(e);
		o.onload = () => {
			URL.revokeObjectURL(s);
			let { naturalWidth: c, naturalHeight: l } = o, u = Math.min(c, l), d = (c - u) / 2, f = (l - u) / 2, p = Math.min(u, r), m = document.createElement("canvas");
			m.width = p, m.height = p;
			let h = m.getContext("2d");
			if (!h) {
				n(/* @__PURE__ */ Error("Could not get canvas context"));
				return;
			}
			h.drawImage(o, d, f, u, u, 0, 0, p, p), m.toBlob((r) => {
				if (!r) {
					n(/* @__PURE__ */ Error("Could not create blob from canvas"));
					return;
				}
				t(new File([r], e.name.replace(/\.[^.]+$/, `.${i}`), { type: a }));
			}, a, 1);
		}, o.onerror = () => {
			URL.revokeObjectURL(s), n(/* @__PURE__ */ Error("Failed to load image"));
		}, o.src = s;
	});
}
function m(e, t) {
	if (s$2(e) && s$2(t)) {
		let n = { ...e };
		for (let [r, i] of Object.entries(t)) i !== void 0 && (n[r] = r in e ? m(e[r], i) : i);
		return n;
	}
	return t;
}
var h = {
	languageTag: "en-US",
	direction: "ltr",
	localization: t$2
};
function b$1(e, t) {
	return e.map((e) => {
		let n = t.plugins?.[e.id] ?? {}, r = e._localizationResolver;
		if (Object.keys(n).length === 0 && !r) return e;
		let i = m(m(e.localization ?? {}, n), e._localizationOverrides ?? {}), a = {
			...e,
			localization: i
		};
		return r?.(a, {
			direction: t.direction ?? "ltr",
			languageTag: t.languageTag,
			localization: i
		}) ?? a;
	});
}
var S$1 = {
	allowUnlinkingAllAccounts: !1,
	avatar: {
		enabled: !0,
		resize: c$1,
		size: 256,
		extension: "png"
	},
	basePaths: {
		admin: "/admin",
		auth: "/auth",
		settings: "/settings",
		organization: "/organization"
	},
	baseURL: "",
	emailAndPassword: {
		enabled: !0,
		forgotPassword: !0,
		name: !0,
		rememberMe: !1,
		strengthMeter: !0,
		minPasswordLength: 8,
		maxPasswordLength: 128
	},
	plugins: [],
	profile: { name: !0 },
	redirectTo: "/",
	socialSignInMode: "redirect",
	viewPaths: e$5,
	localization: t$2,
	locale: h,
	navigate: ({ to: e, replace: t }) => {
		t ? window.location.replace(e) : window.location.href = e;
	}
};
function C$1(e) {
	let n = e.locale ?? h, r = m(m(t$2, n.localization), e.localization ?? {}), i = b$1(e.plugins ?? [], n), a = m(S$1, {
		...e,
		locale: n,
		localization: r,
		plugins: i
	}), o = /* @__PURE__ */ new Map();
	for (let e of i) for (let t of e.additionalFields ?? []) o.set(t.name, t);
	for (let e of a.additionalFields ?? []) o.set(e.name, e);
	return a.additionalFields = Array.from(o.values()), {
		...a,
		authClient: e.authClient
	};
}
//#endregion
//#region node_modules/.pnpm/@better-auth-ui+core@1.7.27_17797606c8ca7fa6484a48add331f83f/node_modules/@better-auth-ui/core/dist/auth-mutation-keys-DCWERLqI.js
var e$4 = {
	all: ["auth"],
	signIn: {
		all: ["auth", "signIn"],
		email: [
			"auth",
			"signIn",
			"email"
		],
		social: [
			"auth",
			"signIn",
			"social"
		],
		popup: [
			"auth",
			"signIn",
			"popup"
		]
	},
	signUp: {
		all: ["auth", "signUp"],
		email: [
			"auth",
			"signUp",
			"email"
		]
	},
	signOut: ["auth", "signOut"],
	requestPasswordReset: ["auth", "requestPasswordReset"],
	resetPassword: ["auth", "resetPassword"],
	sendVerificationEmail: ["auth", "sendVerificationEmail"],
	changeEmail: ["auth", "changeEmail"],
	changePassword: ["auth", "changePassword"],
	linkSocial: ["auth", "linkSocial"],
	revokeSession: ["auth", "revokeSession"],
	revokeOtherSessions: ["auth", "revokeOtherSessions"],
	revokeSessions: ["auth", "revokeSessions"],
	unlinkAccount: ["auth", "unlinkAccount"],
	updateSession: ["auth", "updateSession"],
	updateUser: ["auth", "updateUser"]
};
//#endregion
//#region node_modules/.pnpm/@better-auth-ui+core@1.7.27_17797606c8ca7fa6484a48add331f83f/node_modules/@better-auth-ui/core/dist/auth-query-keys-B_bcsA3s.js
var e$3 = {
	all: ["auth"],
	session: ["auth", "getSession"],
	users: () => [...e$3.all, "user"],
	user: (t) => [...e$3.users(), t],
	accountInfo: (t, n) => [
		...e$3.user(t),
		"accountInfo",
		n ?? null
	],
	listAccounts: (t, n) => [
		...e$3.user(t),
		"listAccounts",
		n ?? null
	],
	listSessions: (t, n) => [
		...e$3.user(t),
		"listSessions",
		n ?? null
	]
};
//#endregion
//#region node_modules/.pnpm/@better-auth-ui+core@1.7.27_17797606c8ca7fa6484a48add331f83f/node_modules/@better-auth-ui/core/dist/auth-query-retry-Dyv0hsPy.js
var e$2 = /* @__PURE__ */ new Set([
	408,
	429,
	500,
	502,
	503,
	504
]);
var r$2 = class extends Error {
	status;
	statusText;
	error;
	retryAfterMs;
	constructor(e, t, n, r) {
		super(t || String(e), { cause: n }), this.status = e, this.statusText = t, this.error = n, this.retryAfterMs = r;
	}
};
function i$2(e, t) {
	if (typeof e != "object" || !e) return;
	let n = e[t];
	return typeof n == "number" ? n : void 0;
}
function a$1(e) {
	let t = Number(e);
	if (Number.isFinite(t) && t >= 0) return t * 1e3;
	let n = Date.parse(e);
	if (!Number.isNaN(n)) return Math.max(0, n - Date.now());
}
function o$1(e) {
	let t = e.headers.get("Retry-After"), n = t === null ? void 0 : a$1(t);
	if (n !== void 0) return n;
	let r = e.headers.get("X-Retry-After");
	return r === null ? void 0 : a$1(r);
}
var s$1 = {
	id: "better-auth-ui-query-retry",
	name: "Better Auth UI query retry",
	hooks: { onError: async (e) => {
		let t = o$1(e.response);
		if (t !== void 0) throw new r$2(e.response.status, e.response.statusText, e.error, t);
	} }
};
function c(e, t) {
	return {
		...e,
		signal: t,
		throw: !0,
		plugins: [...e?.plugins ?? [], s$1]
	};
}
function l(t) {
	let n = i$2(t, "status");
	return n === void 0 || e$2.has(n);
}
function u$1(e, t) {
	return e < 3 && l(t);
}
function d$1(e, t) {
	let n = i$2(t, "retryAfterMs");
	return n !== void 0 && Number.isFinite(n) && n >= 0 ? n : Math.min(1e3 * 2 ** e, 3e4);
}
function f$2(e) {
	return {
		retry: (t, n) => !e() && u$1(t, n),
		retryDelay: d$1
	};
}
//#endregion
//#region node_modules/.pnpm/@better-auth-ui+core@1.7.27_17797606c8ca7fa6484a48add331f83f/node_modules/@better-auth-ui/core/dist/create-auth-plugin-BXWyolC8.js
function e$1(e, t) {
	return Object.assign((...n) => {
		let r = {
			...t(...n),
			id: e
		}, i = n[0], a = i && typeof i == "object" && "localization" in i ? i.localization : void 0;
		return a && Object.defineProperty(r, "_localizationOverrides", {
			configurable: !1,
			enumerable: !1,
			value: a
		}), r;
	}, { id: e });
}
//#endregion
//#region node_modules/.pnpm/uqr@0.1.3/node_modules/uqr/dist/index.mjs
var QrCodeDataType = /* @__PURE__ */ ((QrCodeDataType2) => {
	QrCodeDataType2[QrCodeDataType2["Border"] = -1] = "Border";
	QrCodeDataType2[QrCodeDataType2["Data"] = 0] = "Data";
	QrCodeDataType2[QrCodeDataType2["Function"] = 1] = "Function";
	QrCodeDataType2[QrCodeDataType2["Position"] = 2] = "Position";
	QrCodeDataType2[QrCodeDataType2["Timing"] = 3] = "Timing";
	QrCodeDataType2[QrCodeDataType2["Alignment"] = 4] = "Alignment";
	return QrCodeDataType2;
})(QrCodeDataType || {});
var LOW = [0, 1];
var MEDIUM = [1, 0];
var QUARTILE = [2, 3];
var HIGH = [3, 2];
var EccMap = {
	L: LOW,
	M: MEDIUM,
	Q: QUARTILE,
	H: HIGH
};
var NUMERIC_REGEX = /^\d*$/;
var ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+./:-]*$/;
var ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
var MIN_VERSION = 1;
var MAX_VERSION = 40;
var PENALTY_N1 = 3;
var PENALTY_N2 = 3;
var PENALTY_N3 = 40;
var PENALTY_N4 = 10;
var ECC_CODEWORDS_PER_BLOCK = [
	[
		-1,
		7,
		10,
		15,
		20,
		26,
		18,
		20,
		24,
		30,
		18,
		20,
		24,
		26,
		30,
		22,
		24,
		28,
		30,
		28,
		28,
		28,
		28,
		30,
		30,
		26,
		28,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	],
	[
		-1,
		10,
		16,
		26,
		18,
		24,
		16,
		18,
		22,
		22,
		26,
		30,
		22,
		22,
		24,
		24,
		28,
		28,
		26,
		26,
		26,
		26,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28
	],
	[
		-1,
		13,
		22,
		18,
		26,
		18,
		24,
		18,
		22,
		20,
		24,
		28,
		26,
		24,
		20,
		30,
		24,
		28,
		28,
		26,
		30,
		28,
		30,
		30,
		30,
		30,
		28,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	],
	[
		-1,
		17,
		28,
		22,
		16,
		22,
		28,
		26,
		26,
		24,
		28,
		24,
		28,
		22,
		24,
		24,
		30,
		28,
		28,
		26,
		28,
		30,
		24,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	]
];
var NUM_ERROR_CORRECTION_BLOCKS = [
	[
		-1,
		1,
		1,
		1,
		1,
		1,
		2,
		2,
		2,
		2,
		4,
		4,
		4,
		4,
		4,
		6,
		6,
		6,
		6,
		7,
		8,
		8,
		9,
		9,
		10,
		12,
		12,
		12,
		13,
		14,
		15,
		16,
		17,
		18,
		19,
		19,
		20,
		21,
		22,
		24,
		25
	],
	[
		-1,
		1,
		1,
		1,
		2,
		2,
		4,
		4,
		4,
		5,
		5,
		5,
		8,
		9,
		9,
		10,
		10,
		11,
		13,
		14,
		16,
		17,
		17,
		18,
		20,
		21,
		23,
		25,
		26,
		28,
		29,
		31,
		33,
		35,
		37,
		38,
		40,
		43,
		45,
		47,
		49
	],
	[
		-1,
		1,
		1,
		2,
		2,
		4,
		4,
		6,
		6,
		8,
		8,
		8,
		10,
		12,
		16,
		12,
		17,
		16,
		18,
		21,
		20,
		23,
		23,
		25,
		27,
		29,
		34,
		34,
		35,
		38,
		40,
		43,
		45,
		48,
		51,
		53,
		56,
		59,
		62,
		65,
		68
	],
	[
		-1,
		1,
		1,
		2,
		4,
		4,
		4,
		5,
		6,
		8,
		8,
		11,
		11,
		16,
		16,
		18,
		16,
		19,
		21,
		25,
		25,
		25,
		34,
		30,
		32,
		35,
		37,
		40,
		42,
		45,
		48,
		51,
		54,
		57,
		60,
		63,
		66,
		70,
		74,
		77,
		81
	]
];
var QrCode = class {
	constructor(version, ecc, dataCodewords, msk) {
		this.version = version;
		this.ecc = ecc;
		if (version < MIN_VERSION || version > MAX_VERSION) throw new RangeError("Version value out of range");
		if (msk < -1 || msk > 7) throw new RangeError("Mask value out of range");
		this.size = version * 4 + 17;
		const row = Array.from({ length: this.size }).fill(false);
		for (let i = 0; i < this.size; i++) {
			this.modules.push(row.slice());
			this.types.push(row.map(() => 0));
		}
		this.drawFunctionPatterns();
		const allCodewords = this.addEccAndInterleave(dataCodewords);
		this.drawCodewords(allCodewords);
		if (msk === -1) {
			let minPenalty = 1e9;
			for (let i = 0; i < 8; i++) {
				this.applyMask(i);
				this.drawFormatBits(i);
				const penalty = this.getPenaltyScore();
				if (penalty < minPenalty) {
					msk = i;
					minPenalty = penalty;
				}
				this.applyMask(i);
			}
		}
		this.mask = msk;
		this.applyMask(msk);
		this.drawFormatBits(msk);
	}
	size;
	mask;
	modules = [];
	types = [];
	getModule(x, y) {
		return x >= 0 && x < this.size && y >= 0 && y < this.size && this.modules[y][x];
	}
	drawFunctionPatterns() {
		for (let i = 0; i < this.size; i++) {
			this.setFunctionModule(6, i, i % 2 === 0, QrCodeDataType.Timing);
			this.setFunctionModule(i, 6, i % 2 === 0, QrCodeDataType.Timing);
		}
		this.drawFinderPattern(3, 3);
		this.drawFinderPattern(this.size - 4, 3);
		this.drawFinderPattern(3, this.size - 4);
		const alignPatPos = this.getAlignmentPatternPositions();
		const numAlign = alignPatPos.length;
		for (let i = 0; i < numAlign; i++) for (let j = 0; j < numAlign; j++) if (!(i === 0 && j === 0 || i === 0 && j === numAlign - 1 || i === numAlign - 1 && j === 0)) this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
		this.drawFormatBits(0);
		this.drawVersion();
	}
	drawFormatBits(mask) {
		const data = this.ecc[1] << 3 | mask;
		let rem = data;
		for (let i = 0; i < 10; i++) rem = rem << 1 ^ (rem >>> 9) * 1335;
		const bits = (data << 10 | rem) ^ 21522;
		for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
		this.setFunctionModule(8, 7, getBit(bits, 6));
		this.setFunctionModule(8, 8, getBit(bits, 7));
		this.setFunctionModule(7, 8, getBit(bits, 8));
		for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));
		for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
		for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
		this.setFunctionModule(8, this.size - 8, true);
	}
	drawVersion() {
		if (this.version < 7) return;
		let rem = this.version;
		for (let i = 0; i < 12; i++) rem = rem << 1 ^ (rem >>> 11) * 7973;
		const bits = this.version << 12 | rem;
		for (let i = 0; i < 18; i++) {
			const color = getBit(bits, i);
			const a = this.size - 11 + i % 3;
			const b = Math.floor(i / 3);
			this.setFunctionModule(a, b, color);
			this.setFunctionModule(b, a, color);
		}
	}
	drawFinderPattern(x, y) {
		for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
			const dist = Math.max(Math.abs(dx), Math.abs(dy));
			const xx = x + dx;
			const yy = y + dy;
			if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4, QrCodeDataType.Position);
		}
	}
	drawAlignmentPattern(x, y) {
		for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1, QrCodeDataType.Alignment);
	}
	setFunctionModule(x, y, isDark, type = QrCodeDataType.Function) {
		this.modules[y][x] = isDark;
		this.types[y][x] = type;
	}
	addEccAndInterleave(data) {
		const ver = this.version;
		const ecl = this.ecc;
		if (data.length !== getNumDataCodewords(ver, ecl)) throw new RangeError("Invalid argument");
		const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver];
		const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver];
		const rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
		const numShortBlocks = numBlocks - rawCodewords % numBlocks;
		const shortBlockLen = Math.floor(rawCodewords / numBlocks);
		const blocks = [];
		const rsDiv = reedSolomonComputeDivisor(blockEccLen);
		for (let i = 0, k = 0; i < numBlocks; i++) {
			const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
			k += dat.length;
			const ecc = reedSolomonComputeRemainder(dat, rsDiv);
			if (i < numShortBlocks) dat.push(0);
			blocks.push(dat.concat(ecc));
		}
		const result = [];
		for (let i = 0; i < blocks[0].length; i++) blocks.forEach((block, j) => {
			if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
		});
		return result;
	}
	drawCodewords(data) {
		if (data.length !== Math.floor(getNumRawDataModules(this.version) / 8)) throw new RangeError("Invalid argument");
		let i = 0;
		for (let right = this.size - 1; right >= 1; right -= 2) {
			if (right === 6) right = 5;
			for (let vert = 0; vert < this.size; vert++) for (let j = 0; j < 2; j++) {
				const x = right - j;
				const y = (right + 1 & 2) === 0 ? this.size - 1 - vert : vert;
				if (!this.types[y][x] && i < data.length * 8) {
					this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
					i++;
				}
			}
		}
	}
	applyMask(mask) {
		if (mask < 0 || mask > 7) throw new RangeError("Mask value out of range");
		for (let y = 0; y < this.size; y++) for (let x = 0; x < this.size; x++) {
			let invert;
			switch (mask) {
				case 0:
					invert = (x + y) % 2 === 0;
					break;
				case 1:
					invert = y % 2 === 0;
					break;
				case 2:
					invert = x % 3 === 0;
					break;
				case 3:
					invert = (x + y) % 3 === 0;
					break;
				case 4:
					invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
					break;
				case 5:
					invert = x * y % 2 + x * y % 3 === 0;
					break;
				case 6:
					invert = (x * y % 2 + x * y % 3) % 2 === 0;
					break;
				case 7:
					invert = ((x + y) % 2 + x * y % 3) % 2 === 0;
					break;
				default: throw new Error("Unreachable");
			}
			if (!this.types[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
		}
	}
	getPenaltyScore() {
		let result = 0;
		for (let y = 0; y < this.size; y++) {
			let runColor = false;
			let runX = 0;
			const runHistory = [
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (let x = 0; x < this.size; x++) if (this.modules[y][x] === runColor) {
				runX++;
				if (runX === 5) result += PENALTY_N1;
				else if (runX > 5) result++;
			} else {
				this.finderPenaltyAddHistory(runX, runHistory);
				if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
				runColor = this.modules[y][x];
				runX = 1;
			}
			result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3;
		}
		for (let x = 0; x < this.size; x++) {
			let runColor = false;
			let runY = 0;
			const runHistory = [
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (let y = 0; y < this.size; y++) if (this.modules[y][x] === runColor) {
				runY++;
				if (runY === 5) result += PENALTY_N1;
				else if (runY > 5) result++;
			} else {
				this.finderPenaltyAddHistory(runY, runHistory);
				if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
				runColor = this.modules[y][x];
				runY = 1;
			}
			result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3;
		}
		for (let y = 0; y < this.size - 1; y++) for (let x = 0; x < this.size - 1; x++) {
			const color = this.modules[y][x];
			if (color === this.modules[y][x + 1] && color === this.modules[y + 1][x] && color === this.modules[y + 1][x + 1]) result += PENALTY_N2;
		}
		let dark = 0;
		for (const row of this.modules) dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark);
		const total = this.size * this.size;
		const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
		result += k * PENALTY_N4;
		return result;
	}
	getAlignmentPatternPositions() {
		if (this.version === 1) return [];
		else {
			const numAlign = Math.floor(this.version / 7) + 2;
			const step = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
			const result = [6];
			for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
			return result;
		}
	}
	finderPenaltyCountPatterns(runHistory) {
		const n = runHistory[1];
		const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
		return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
	}
	finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
		if (currentRunColor) {
			this.finderPenaltyAddHistory(currentRunLength, runHistory);
			currentRunLength = 0;
		}
		currentRunLength += this.size;
		this.finderPenaltyAddHistory(currentRunLength, runHistory);
		return this.finderPenaltyCountPatterns(runHistory);
	}
	finderPenaltyAddHistory(currentRunLength, runHistory) {
		if (runHistory[0] === 0) currentRunLength += this.size;
		runHistory.pop();
		runHistory.unshift(currentRunLength);
	}
};
function appendBits(val, len, bb) {
	if (len < 0 || len > 31 || val >>> len !== 0) throw new RangeError("Value out of range");
	for (let i = len - 1; i >= 0; i--) bb.push(val >>> i & 1);
}
function getBit(x, i) {
	return (x >>> i & 1) !== 0;
}
var QrSegment = class {
	constructor(mode, numChars, bitData) {
		this.mode = mode;
		this.numChars = numChars;
		this.bitData = bitData;
		if (numChars < 0) throw new RangeError("Invalid argument");
		this.bitData = bitData.slice();
	}
	getData() {
		return this.bitData.slice();
	}
};
var MODE_NUMERIC = [
	1,
	10,
	12,
	14
];
var MODE_ALPHANUMERIC = [
	2,
	9,
	11,
	13
];
var MODE_BYTE = [
	4,
	8,
	16,
	16
];
function numCharCountBits(mode, ver) {
	return mode[Math.floor((ver + 7) / 17) + 1];
}
function makeBytes(data) {
	const bb = [];
	for (const b of data) appendBits(b, 8, bb);
	return new QrSegment(MODE_BYTE, data.length, bb);
}
function makeNumeric(digits) {
	if (!isNumeric(digits)) throw new RangeError("String contains non-numeric characters");
	const bb = [];
	for (let i = 0; i < digits.length;) {
		const n = Math.min(digits.length - i, 3);
		appendBits(Number.parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
		i += n;
	}
	return new QrSegment(MODE_NUMERIC, digits.length, bb);
}
function makeAlphanumeric(text) {
	if (!isAlphanumeric(text)) throw new RangeError("String contains unencodable characters in alphanumeric mode");
	const bb = [];
	let i = 0;
	for (; i + 2 <= text.length; i += 2) {
		let temp = ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
		temp += ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
		appendBits(temp, 11, bb);
	}
	if (i < text.length) appendBits(ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
	return new QrSegment(MODE_ALPHANUMERIC, text.length, bb);
}
function makeSegments(text) {
	if (text === "") return [];
	else if (isNumeric(text)) return [makeNumeric(text)];
	else if (isAlphanumeric(text)) return [makeAlphanumeric(text)];
	else return [makeBytes(toUtf8ByteArray(text))];
}
function isNumeric(text) {
	return NUMERIC_REGEX.test(text);
}
function isAlphanumeric(text) {
	return ALPHANUMERIC_REGEX.test(text);
}
function getTotalBits(segs, version) {
	let result = 0;
	for (const seg of segs) {
		const ccbits = numCharCountBits(seg.mode, version);
		if (seg.numChars >= 1 << ccbits) return Number.POSITIVE_INFINITY;
		result += 4 + ccbits + seg.bitData.length;
	}
	return result;
}
function toUtf8ByteArray(str) {
	str = encodeURI(str);
	const result = [];
	for (let i = 0; i < str.length; i++) if (str.charAt(i) !== "%") result.push(str.charCodeAt(i));
	else {
		result.push(Number.parseInt(str.substring(i + 1, i + 3), 16));
		i += 2;
	}
	return result;
}
function getNumRawDataModules(ver) {
	if (ver < MIN_VERSION || ver > MAX_VERSION) throw new RangeError("Version number out of range");
	let result = (16 * ver + 128) * ver + 64;
	if (ver >= 2) {
		const numAlign = Math.floor(ver / 7) + 2;
		result -= (25 * numAlign - 10) * numAlign - 55;
		if (ver >= 7) result -= 36;
	}
	return result;
}
function getNumDataCodewords(ver, ecl) {
	return Math.floor(getNumRawDataModules(ver) / 8) - ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver];
}
function reedSolomonComputeDivisor(degree) {
	if (degree < 1 || degree > 255) throw new RangeError("Degree out of range");
	const result = [];
	for (let i = 0; i < degree - 1; i++) result.push(0);
	result.push(1);
	let root = 1;
	for (let i = 0; i < degree; i++) {
		for (let j = 0; j < result.length; j++) {
			result[j] = reedSolomonMultiply(result[j], root);
			if (j + 1 < result.length) result[j] ^= result[j + 1];
		}
		root = reedSolomonMultiply(root, 2);
	}
	return result;
}
function reedSolomonComputeRemainder(data, divisor) {
	const result = divisor.map((_) => 0);
	for (const b of data) {
		const factor = b ^ result.shift();
		result.push(0);
		divisor.forEach((coef, i) => result[i] ^= reedSolomonMultiply(coef, factor));
	}
	return result;
}
function reedSolomonMultiply(x, y) {
	if (x >>> 8 !== 0 || y >>> 8 !== 0) throw new RangeError("Byte out of range");
	let z = 0;
	for (let i = 7; i >= 0; i--) {
		z = z << 1 ^ (z >>> 7) * 285;
		z ^= (y >>> i & 1) * x;
	}
	return z;
}
function encodeSegments(segs, ecl, minVersion = 1, maxVersion = 40, mask = -1, boostEcl = true) {
	if (!(MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= MAX_VERSION) || mask < -1 || mask > 7) throw new RangeError("Invalid value");
	let version;
	let dataUsedBits;
	for (version = minVersion;; version++) {
		const dataCapacityBits2 = getNumDataCodewords(version, ecl) * 8;
		const usedBits = getTotalBits(segs, version);
		if (usedBits <= dataCapacityBits2) {
			dataUsedBits = usedBits;
			break;
		}
		if (version >= maxVersion) throw new RangeError("Data too long");
	}
	for (const newEcl of [
		MEDIUM,
		QUARTILE,
		HIGH
	]) if (boostEcl && dataUsedBits <= getNumDataCodewords(version, newEcl) * 8) ecl = newEcl;
	const bb = [];
	for (const seg of segs) {
		appendBits(seg.mode[0], 4, bb);
		appendBits(seg.numChars, numCharCountBits(seg.mode, version), bb);
		for (const b of seg.getData()) bb.push(b);
	}
	const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
	appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
	appendBits(0, (8 - bb.length % 8) % 8, bb);
	for (let padByte = 236; bb.length < dataCapacityBits; padByte ^= 253) appendBits(padByte, 8, bb);
	const dataCodewords = Array.from({ length: Math.ceil(bb.length / 8) }, () => 0);
	bb.forEach((b, i) => dataCodewords[i >>> 3] |= b << 7 - (i & 7));
	return new QrCode(version, ecl, dataCodewords, mask);
}
function encode(data, options) {
	const { ecc = "L", boostEcc = false, minVersion = 1, maxVersion = 40, maskPattern = -1, border = 1 } = options || {};
	const segment = typeof data === "string" ? makeSegments(data) : Array.isArray(data) ? [makeBytes(data)] : void 0;
	if (!segment) throw new Error(`uqr only supports encoding string and binary data, but got: ${typeof data}`);
	const qr = encodeSegments(segment, EccMap[ecc], minVersion, maxVersion, maskPattern, boostEcc);
	const result = addBorder({
		version: qr.version,
		maskPattern: qr.mask,
		size: qr.size,
		data: qr.modules,
		types: qr.types
	}, border);
	if (options?.invert) result.data = result.data.map((row) => row.map((mod) => !mod));
	options?.onEncoded?.(result);
	return result;
}
function addBorder(input, border = 1) {
	if (!border) return input;
	const { size } = input;
	const newSize = size + border * 2;
	input.size = newSize;
	input.data.forEach((row) => {
		for (let i = 0; i < border; i++) {
			row.unshift(false);
			row.push(false);
		}
	});
	for (let i = 0; i < border; i++) {
		input.data.unshift(Array.from({ length: newSize }, (_) => false));
		input.data.push(Array.from({ length: newSize }, (_) => false));
	}
	const b = QrCodeDataType.Border;
	input.types.forEach((row) => {
		for (let i = 0; i < border; i++) {
			row.unshift(b);
			row.push(b);
		}
	});
	for (let i = 0; i < border; i++) {
		input.types.unshift(Array.from({ length: newSize }, (_) => b));
		input.types.push(Array.from({ length: newSize }, (_) => b));
	}
	return input;
}
//#endregion
//#region node_modules/.pnpm/@tanstack+query-core@5.104.1/node_modules/@tanstack/query-core/build/modern/timeoutManager.js
var defaultTimeoutProvider = {
	setTimeout: (callback, delay) => setTimeout(callback, delay),
	clearTimeout: (timeoutId) => clearTimeout(timeoutId),
	setInterval: (callback, delay) => setInterval(callback, delay),
	clearInterval: (intervalId) => clearInterval(intervalId)
};
/**
* Allows customization of how timeouts are created.
*
* @tanstack/query-core makes liberal use of timeouts to implement `staleTime`
* and `gcTime`. The default TimeoutManager provider uses the platform's global
* `setTimeout` implementation, which is known to have scalability issues with
* thousands of timeouts on the event loop.
*
* If you hit this limitation, consider providing a custom TimeoutProvider that
* coalesces timeouts.
*/
var TimeoutManager = class {
	#provider = defaultTimeoutProvider;
	#providerCalled = false;
	/**
	* `setTimeoutProvider` can be used to set a custom implementation of the
	* `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` functions,
	* called a `TimeoutProvider`.
	*
	* This may be useful if you notice event loop performance issues with
	* thousands of queries. A custom TimeoutProvider could also support timer
	* delays longer than the global `setTimeout` maximum delay value of about
	* 24 days.
	*
	* It is important to call `setTimeoutProvider` before creating a
	* QueryClient or queries, so that the same provider is used consistently
	* for all timers in the application, since different TimeoutProviders
	* cannot cancel each others' timers.
	*
	* @example
	* ```ts
	* import { timeoutManager, QueryClient } from '@tanstack/query-core'
	* import { CustomTimeoutProvider } from './CustomTimeoutProvider'
	*
	* timeoutManager.setTimeoutProvider(new CustomTimeoutProvider())
	*
	* export const queryClient = new QueryClient()
	* ```
	*/
	setTimeoutProvider(provider) {
		this.#provider = provider;
	}
	/**
	* `setTimeout` schedules a callback to run after approximately `delay`
	* milliseconds, like the global `setTimeout` function. The callback can be
	* canceled with `clearTimeout`.
	*
	* It returns a timer ID, which may be a number or an object that can be
	* coerced to a number via `Symbol.toPrimitive`.
	*
	* @example
	* ```ts
	* import { timeoutManager } from '@tanstack/query-core'
	*
	* const timeoutId = timeoutManager.setTimeout(
	*   () => console.log('ran at:', new Date()),
	*   1000,
	* )
	*
	* const timeoutIdNumber: number = Number(timeoutId)
	* ```
	*/
	setTimeout(callback, delay) {
		return this.#provider.setTimeout(callback, delay);
	}
	/**
	* `clearTimeout` cancels a timeout callback scheduled with `setTimeout`,
	* like the global `clearTimeout` function. It should be called with a
	* timer ID returned by `setTimeout`.
	*
	* @example
	* ```ts
	* import { timeoutManager } from '@tanstack/query-core'
	*
	* const timeoutId = timeoutManager.setTimeout(
	*   () => console.log('ran at:', new Date()),
	*   1000,
	* )
	*
	* timeoutManager.clearTimeout(timeoutId)
	* ```
	*/
	clearTimeout(timeoutId) {
		this.#provider.clearTimeout(timeoutId);
	}
	/**
	* `setInterval` schedules a callback to be called approximately every
	* `delay` milliseconds, like the global `setInterval` function.
	*
	* Like `setTimeout`, it returns a timer ID, which may be a number or an
	* object that can be coerced to a number via `Symbol.toPrimitive`.
	*
	* @example
	* ```ts
	* import { timeoutManager } from '@tanstack/query-core'
	*
	* const intervalId = timeoutManager.setInterval(
	*   () => console.log('ran at:', new Date()),
	*   1000,
	* )
	* ```
	*/
	setInterval(callback, delay) {
		return this.#provider.setInterval(callback, delay);
	}
	/**
	* `clearInterval` can be used to cancel an interval, like the global
	* `clearInterval` function. It should be called with an interval ID
	* returned by `setInterval`.
	*
	* @example
	* ```ts
	* import { timeoutManager } from '@tanstack/query-core'
	*
	* const intervalId = timeoutManager.setInterval(
	*   () => console.log('ran at:', new Date()),
	*   1000,
	* )
	*
	* timeoutManager.clearInterval(intervalId)
	* ```
	*/
	clearInterval(intervalId) {
		this.#provider.clearInterval(intervalId);
	}
};
/**
* Singleton instance of {@link TimeoutManager}, used throughout TanStack Query to schedule and cancel timers.
*/
var timeoutManager = new TimeoutManager();
/**
* In many cases code wants to delay to the next event loop tick; this is not
* mediated by {@link timeoutManager}.
*
* This function is provided to make auditing the `tanstack/query-core` for
* incorrect use of system `setTimeout` easier.
*/
function systemSetTimeoutZero(callback) {
	setTimeout(callback, 0);
}
//#endregion
//#region node_modules/.pnpm/@tanstack+query-core@5.104.1/node_modules/@tanstack/query-core/build/modern/utils.js
/** @deprecated
* use `environmentManager.isServer()` instead.
*/
var isServer = typeof window === "undefined" || "Deno" in globalThis;
function noop() {}
function functionalUpdate(updater, input) {
	return typeof updater === "function" ? updater(input) : updater;
}
function isValidTimeout(value) {
	return typeof value === "number" && value >= 0 && value !== Infinity;
}
function timeUntilStale(updatedAt, staleTime) {
	return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0);
}
function resolveQueryValue(value, query) {
	return typeof value === "function" ? value(query) : value;
}
/**
* Checks whether a query matches the given {@link QueryFilters}.
* Every filter that is specified must match; filters that are left unspecified are ignored.
*
* @example
* ```ts
* const queryCache = queryClient.getQueryCache()
*
* const matchingQueries = queryCache
*   .getAll()
*   .filter((query) => matchQuery({ queryKey: ['posts'] }, query))
* ```
*/
function matchQuery(filters, query) {
	const { type = "all", exact, fetchStatus, predicate, queryKey, stale } = filters;
	if (queryKey) {
		if (exact) {
			if (query.queryHash !== hashQueryKeyByOptions(queryKey, query.options)) return false;
		} else if (!partialMatchKey(query.queryKey, queryKey)) return false;
	}
	if (type !== "all") {
		const isActive = query.isActive();
		if (type === "active" && !isActive) return false;
		if (type === "inactive" && isActive) return false;
	}
	if (typeof stale === "boolean" && query.isStale() !== stale) return false;
	if (fetchStatus && fetchStatus !== query.state.fetchStatus) return false;
	if (predicate && !predicate(query)) return false;
	return true;
}
/**
* Checks whether a mutation matches the given {@link MutationFilters}.
* Every filter that is specified must match; filters that are left unspecified are ignored.
* If a `mutationKey` filter is provided but the mutation has no `mutationKey` of its own, it does not match.
*
* @example
* ```ts
* const mutationCache = queryClient.getMutationCache()
*
* const matchingMutations = mutationCache
*   .getAll()
*   .filter((mutation) => matchMutation({ mutationKey: ['addPost'] }, mutation))
* ```
*/
function matchMutation(filters, mutation) {
	const { exact, status, predicate, mutationKey } = filters;
	if (mutationKey) {
		if (!mutation.options.mutationKey) return false;
		if (exact) {
			if (hashKey(mutation.options.mutationKey) !== hashKey(mutationKey)) return false;
		} else if (!partialMatchKey(mutation.options.mutationKey, mutationKey)) return false;
	}
	if (status && mutation.state.status !== status) return false;
	if (predicate && !predicate(mutation)) return false;
	return true;
}
function hashQueryKeyByOptions(queryKey, options) {
	return (options?.queryKeyHashFn || hashKey)(queryKey);
}
/**
* Default query & mutation keys hash function.
* Hashes the value into a stable hash.
*
* @example
* ```ts
* // Object keys are sorted, so key order doesn't affect the hash:
* hashKey(['todos', { page: 1, filter: 'done' }]) // === '["todos",{"filter":"done","page":1}]'
* ```
*/
function hashKey(queryKey) {
	return JSON.stringify(queryKey, (_, val) => isPlainObject(val) ? Object.keys(val).sort().reduce((result, key) => {
		result[key] = val[key];
		return result;
	}, {}) : val);
}
function partialMatchKey(a, b) {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (a && b && typeof a === "object" && typeof b === "object") {
		if (Array.isArray(a) && Array.isArray(b)) {
			if (b.length > a.length) return false;
			for (let i = 0; i < b.length; i++) if (!partialMatchKey(a[i], b[i])) return false;
			return true;
		}
		const bKeys = Object.keys(b);
		for (const key of bKeys) if (!partialMatchKey(a[key], b[key])) return false;
		return true;
	}
	return false;
}
var hasOwn = Object.prototype.hasOwnProperty;
function replaceEqualDeep(a, b, depth = 0) {
	if (a === b) return a;
	if (depth > 500) return b;
	const array = isPlainArray(a) && isPlainArray(b);
	if (!array && !(isPlainObject(a) && isPlainObject(b))) return b;
	const aSize = (array ? a : Object.keys(a)).length;
	const bItems = array ? b : Object.keys(b);
	const bSize = bItems.length;
	const copy = array ? new Array(bSize) : {};
	let equalItems = 0;
	for (let i = 0; i < bSize; i++) {
		const key = array ? i : bItems[i];
		const aItem = a[key];
		const bItem = b[key];
		if (aItem === bItem) {
			copy[key] = aItem;
			if (array ? i < aSize : hasOwn.call(a, key)) equalItems++;
			continue;
		}
		if (aItem === null || bItem === null || typeof aItem !== "object" || typeof bItem !== "object") {
			copy[key] = bItem;
			continue;
		}
		const v = replaceEqualDeep(aItem, bItem, depth + 1);
		copy[key] = v;
		if (v === aItem) equalItems++;
	}
	return aSize === bSize && equalItems === aSize ? a : copy;
}
/**
* Shallow compare objects.
*/
function shallowEqualObjects(a, b) {
	if (!b || Object.keys(a).length !== Object.keys(b).length) return false;
	for (const key in a) if (a[key] !== b[key]) return false;
	return true;
}
function isPlainArray(value) {
	return Array.isArray(value) && value.length === Object.keys(value).length;
}
function isPlainObject(o) {
	if (!hasObjectPrototype(o)) return false;
	const objectPrototype = Object.getPrototypeOf(o);
	const ctor = objectPrototype?.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return false;
	const prot = ctor.prototype;
	if (!hasObjectPrototype(prot)) return false;
	if (!prot.hasOwnProperty("isPrototypeOf")) return false;
	if (objectPrototype !== Object.prototype) return false;
	return true;
}
function hasObjectPrototype(o) {
	return Object.prototype.toString.call(o) === "[object Object]";
}
function sleep(timeout) {
	return new Promise((resolve) => {
		timeoutManager.setTimeout(resolve, timeout);
	});
}
function replaceData(prevData, data, options) {
	if (typeof options.structuralSharing === "function") return options.structuralSharing(prevData, data);
	else if (options.structuralSharing !== false) return replaceEqualDeep(prevData, data);
	return data;
}
function addToEnd(items, item, max = 0) {
	const newItems = [...items, item];
	return max && newItems.length > max ? newItems.slice(1) : newItems;
}
function addToStart(items, item, max = 0) {
	const newItems = [item, ...items];
	return max && newItems.length > max ? newItems.slice(0, -1) : newItems;
}
/**
* Sentinel value that can be passed as a query's `queryFn` to conditionally disable the query (equivalent
* to `enabled: false`) while preserving full type inference for the query's data. Unlike `enabled: false`,
* a query disabled via `skipToken` cannot be triggered with `refetch`.
*
* @example
* ```ts
* new QueryObserver(queryClient, {
*   queryKey: ['post', postId],
*   queryFn: postId != null ? () => fetchPost(postId) : skipToken,
* })
* ```
*/
var skipToken = Symbol();
function ensureQueryFn(options, fetchOptions) {
	if (!options.queryFn && fetchOptions?.initialPromise) return () => fetchOptions.initialPromise;
	if (!options.queryFn || options.queryFn === skipToken) return () => Promise.reject(/* @__PURE__ */ new Error(`Missing queryFn: '${options.queryHash}'`));
	return options.queryFn;
}
/**
* Resolves a `throwOnError` option to a boolean.
* If `throwOnError` is a function, it is called with `params` (e.g. the error and, depending on the caller,
* additional context such as the query or mutation) and its result is returned, allowing the throwing
* behavior to be decided per error. Otherwise, `throwOnError` itself is coerced to a boolean (`undefined`
* resolves to `false`).
*
* @example
* ```ts
* const throwOnError =
*   query.state.error && typeof options.throwOnError === 'function'
*     ? shouldThrowError(options.throwOnError, [query.state.error, query])
*     : options.throwOnError
* ```
*/
function shouldThrowError(throwOnError, params) {
	if (typeof throwOnError === "function") return throwOnError(...params);
	return !!throwOnError;
}
function addConsumeAwareSignal(object, getSignal, onCancelled) {
	let consumed = false;
	let signal;
	Object.defineProperty(object, "signal", {
		enumerable: true,
		get: () => {
			signal ??= getSignal();
			if (consumed) return signal;
			consumed = true;
			if (signal.aborted) onCancelled();
			else signal.addEventListener("abort", onCancelled, { once: true });
			return signal;
		}
	});
	return object;
}
//#endregion
//#region node_modules/.pnpm/@better-auth-ui+core@1.7.27_17797606c8ca7fa6484a48add331f83f/node_modules/@better-auth-ui/core/dist/index.js
function g(e) {
	return e.defaultValue == null ? e.type !== "boolean" && null : e.defaultValue;
}
function pe(e) {
	return Object.fromEntries(e.map((e) => [e.name, g(e)]));
}
function me(e, t) {
	let n = {};
	for (let r of e) !r.readOnly && r.name in t && (n[r.name] = t[r.name] ?? null);
	return n;
}
function he(e, t, n) {
	if (e.required) return t == null || t === "" || e.type === "boolean" && t !== !0 || typeof t == "number" && !Number.isFinite(t) || t instanceof Date && Number.isNaN(t.getTime()) ? n : void 0;
}
async function ge(e, t) {
	try {
		await e.validate?.(t);
		return;
	} catch (e) {
		return e instanceof Error ? e.message : String(e);
	}
}
function be(e) {
	if (e.inputType) return e.inputType;
	switch (e.type) {
		case "number": return "number";
		case "boolean": return "switch";
		case "date": return "date";
		default: return "input";
	}
}
var v = (e) => typeof e == "string" ? e : e.id;
var y = (e) => typeof e != "string";
function b(e) {
	return typeof e == "object" && e ? e : void 0;
}
function xe(e) {
	let t = [], n = b(e);
	for (; n && !t.includes(n) && t.length < 8;) t.push(n), n = b(n.error) ?? b(n.cause);
	return t;
}
function x(e) {
	let t = b(b(e)?.error) ?? b(e);
	return typeof t?.code == "string" ? t.code.toUpperCase() : void 0;
}
var S = {
	INVALID_EMAIL_OR_PASSWORD: "invalidCredentials",
	INVALID_USERNAME_OR_PASSWORD: "invalidCredentials",
	INVALID_PHONE_NUMBER_OR_PASSWORD: "invalidCredentials",
	INVALID_PASSWORD: "invalidCredentials",
	INVALID_CODE: "invalidCode",
	INVALID_BACKUP_CODE: "invalidCode",
	TOO_MANY_ATTEMPTS: "rateLimited",
	INVALID_OTP: "invalidCode",
	OTP_EXPIRED: "invalidCode",
	INVALID_TWO_FACTOR_COOKIE: "sessionExpired",
	SESSION_EXPIRED: "sessionExpired",
	SESSION_NOT_FRESH: "sessionExpired",
	UNAUTHORIZED: "sessionExpired",
	FORBIDDEN: "permissionDenied",
	TOO_MANY_REQUESTS: "rateLimited",
	PASSWORD_TOO_SHORT: "passwordTooShort",
	PASSWORD_TOO_LONG: "passwordTooLong",
	USER_ALREADY_EXISTS: "accountExists",
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "accountExists",
	POPUP_BLOCKED: "popupBlocked",
	POPUP_TIMEOUT: "popupTimeout",
	ROLE_HAS_MEMBERS: "roleHasMembers"
};
function Se(e, t, n = []) {
	let r = xe(e), i = b(b(e)?.error) ?? b(e), a = x(e), o = n[0] === "auth", s = o && n[1] === "signIn" && n[2] === "popup", c = o && n[1] === "signIn" && n[2] === "passkey", l = o && n[1] === "siwe" && (n[2] === "signIn" || n[2] === "link");
	if (s && a === "POPUP_CLOSED" || c && r.some((e) => e.code === "ERROR_CEREMONY_ABORTED" || e.name === "AbortError") || l && r.some((e) => e.code === 4001 || e.code === "4001")) return null;
	if (a && Object.hasOwn(S, a)) return t.errors[S[a]];
	if (a === "EMAIL_NOT_VERIFIED") return t.auth.callbackEmailNotVerifiedDescription;
	if (a === "INVALID_EMAIL") return t.auth.invalidEmail;
	if (a === "INVALID_TOKEN" || a === "TOKEN_EXPIRED") return t.auth.callbackExpiredLinkDescription;
	let u = i?.status ?? b(e)?.status;
	return u === 429 ? t.errors.rateLimited : u === 401 ? t.errors.sessionExpired : u === 403 ? t.errors.permissionDenied : c ? t.errors.passkeyFailed : l ? t.errors.walletFailed : t.errors.generic;
}
function Ce(e) {
	let t = e?.errorPresentation;
	return t === "inline" || t === "silent" ? t : "toast";
}
var C = /^https?:\/\//i;
var w = "reauthenticate";
function Te(e, t) {
	return !e || C.test(t) ? t : `${e.replace(/\/+$/, "")}/${t.replace(/^\/+/, "")}`;
}
function Ee(e, t, n) {
	return `${e.replace(/\/+$/, "")}/${[t, n].map((e) => e.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/")}`;
}
function De(e, t) {
	let n = e.indexOf("#"), r = n === -1 ? "" : e.slice(n), i = n === -1 ? e : e.slice(0, n), a = i.indexOf("?"), o = a === -1 ? i : i.slice(0, a), s = new URLSearchParams(a === -1 ? "" : i.slice(a + 1));
	return s.set("redirectTo", t), `${o}?${s}${r}`;
}
function ke(e) {
	return e.searchParams.get(w) === "true";
}
function Ae(e) {
	for (let t of e) {
		let e = t.codePointAt(0);
		if (t === "\\" || e === void 0 || e <= 31 || e === 127) return !0;
	}
	return !1;
}
function T(e, t) {
	if (!e || Ae(e)) return "/";
	let n = e.trim();
	if (!n || n.startsWith("//") || !n.startsWith("/") && !C.test(n)) return "/";
	try {
		let e = new URL(t), r = new URL(n, e);
		return r.origin !== e.origin || r.username || r.password ? "/" : `${r.pathname}${r.search}${r.hash}`;
	} catch {
		return "/";
	}
}
function je(e, t, n) {
	let r = T(e.searchParams.get("redirectTo"), e.origin), i = new URL(r, e.origin).pathname === e.pathname ? "/" : r;
	if (t) return {
		type: "redirect",
		to: i
	};
	let a = new URL(n, e.origin);
	return a.searchParams.set("redirectTo", `${e.pathname}${e.search}${e.hash}`), {
		type: "signIn",
		to: `${a.pathname}${a.search}${a.hash}`
	};
}
var Me = /* @__PURE__ */ new Set([
	"access_denied",
	"authorization_declined",
	"cancelled",
	"canceled",
	"user_cancelled",
	"user_canceled"
]);
var Ne = /* @__PURE__ */ new Set([
	"expired_token",
	"invalid_token",
	"token_expired"
]);
var Pe = /* @__PURE__ */ new Set([
	"account_already_linked_to_different_user",
	"account_not_linked",
	"email_does_not_match",
	"unable_to_link_account"
]);
var Fe = /* @__PURE__ */ new Set([
	"internal_server_error",
	"invalid_callback_request",
	"invalid_code",
	"issuer_mismatch",
	"issuer_missing",
	"no_callback_url",
	"no_code",
	"nonce_binding_missing",
	"oauth_provider_not_found",
	"provider_not_found",
	"state_mismatch",
	"state_not_found",
	"unable_to_get_user_info"
]);
var E = (e) => e?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
function Ie(e) {
	let t = E(e.get("flow") ?? e.get("source"));
	return [
		"account_link",
		"account_linking",
		"link_account"
	].includes(t) ? "accountLinking" : [
		"email",
		"email_verification",
		"verify_email"
	].includes(t) ? "emailVerification" : [
		"password",
		"password_reset",
		"reset_password"
	].includes(t) ? "passwordReset" : [
		"oauth",
		"social",
		"social_sign_in"
	].includes(t) ? "oauth" : "unknown";
}
var D = "https://better-auth-ui.local";
function O(e) {
	let t = e?.trim();
	if (t?.startsWith("/")) try {
		return new URL(t, D).origin === D ? t : void 0;
	} catch {
		return;
	}
}
function Le(e, t = "success") {
	let n = typeof e == "string" ? new URLSearchParams(e.startsWith("?") ? e.slice(1) : e) : e, r = E(n.get("error")) || E(n.get("code")), i = E(n.get("result")) || E(n.get("status")), a = Ie(n), o = O(n.get("redirectTo") ?? n.get("returnTo"));
	return r ? Me.has(r) ? {
		action: "signIn",
		code: r,
		flow: a === "unknown" ? "oauth" : a,
		intent: "warning",
		reason: "cancelled"
	} : Ne.has(r) ? {
		action: a === "passwordReset" ? "forgotPassword" : a === "emailVerification" ? "verifyEmail" : "signIn",
		code: r,
		flow: a,
		intent: "danger",
		reason: "expiredLink"
	} : Pe.has(r) ? {
		action: "accountSettings",
		code: r,
		flow: "accountLinking",
		intent: "danger",
		reason: "accountLinkConflict"
	} : r === "signup_disabled" ? {
		action: "signIn",
		code: r,
		flow: a,
		intent: "danger",
		reason: "signupDisabled"
	} : r === "email_not_verified" ? {
		action: "verifyEmail",
		code: r,
		flow: a,
		intent: "warning",
		reason: "emailNotVerified"
	} : r === "email_not_found" ? {
		action: "signIn",
		code: r,
		flow: a,
		intent: "danger",
		reason: "missingEmail"
	} : Fe.has(r) ? {
		action: "signIn",
		code: r,
		flow: a === "unknown" ? "oauth" : a,
		intent: "danger",
		reason: "callbackFailed"
	} : {
		action: "signIn",
		code: r,
		flow: a,
		intent: "danger",
		reason: "genericError"
	} : ["cancelled", "canceled"].includes(i) ? {
		action: "signIn",
		flow: a,
		intent: "warning",
		reason: "cancelled"
	} : ["email_verified", "verified"].includes(i) || i === "success" && a === "emailVerification" ? {
		action: o ? "continue" : "signIn",
		flow: "emailVerification",
		intent: "success",
		reason: "emailVerified",
		redirectTo: o
	} : i === "account_linked" || i === "success" && a === "accountLinking" ? {
		action: o ? "continue" : "accountSettings",
		flow: "accountLinking",
		intent: "success",
		reason: "accountLinked",
		redirectTo: o
	} : i === "password_reset" || i === "success" && a === "passwordReset" ? {
		action: "signIn",
		flow: "passwordReset",
		intent: "success",
		reason: "passwordReset"
	} : ["signup_complete", "signed_up"].includes(i) ? {
		action: o ? "continue" : "signIn",
		flow: a,
		intent: "success",
		reason: "signupComplete",
		redirectTo: o
	} : t === "danger" ? {
		action: "signIn",
		flow: a,
		intent: "danger",
		reason: "genericError"
	} : {
		action: o ? "continue" : "signIn",
		flow: a,
		intent: "success",
		reason: "genericSuccess",
		redirectTo: o
	};
}
function Re(e, t) {
	let n = t.auth;
	return {
		accountLinkConflict: {
			description: n.callbackAccountLinkConflictDescription,
			title: n.callbackAccountLinkConflictTitle
		},
		accountLinked: {
			description: n.callbackAccountLinkedDescription,
			title: n.callbackAccountLinkedTitle
		},
		callbackFailed: {
			description: n.callbackFailedDescription,
			title: n.callbackFailedTitle
		},
		cancelled: {
			description: n.callbackCancelledDescription,
			title: n.callbackCancelledTitle
		},
		emailNotVerified: {
			description: n.callbackEmailNotVerifiedDescription,
			title: n.callbackEmailNotVerifiedTitle
		},
		emailVerified: {
			description: n.callbackEmailVerifiedDescription,
			title: n.callbackEmailVerifiedTitle
		},
		expiredLink: {
			description: n.callbackExpiredLinkDescription,
			title: n.callbackExpiredLinkTitle
		},
		genericError: {
			description: n.callbackGenericErrorDescription,
			title: n.callbackGenericErrorTitle
		},
		genericSuccess: {
			description: n.callbackGenericSuccessDescription,
			title: n.callbackGenericSuccessTitle
		},
		missingEmail: {
			description: n.callbackMissingEmailDescription,
			title: n.callbackMissingEmailTitle
		},
		passwordReset: {
			description: n.callbackPasswordResetDescription,
			title: n.callbackPasswordResetTitle
		},
		signupComplete: {
			description: n.callbackSignupCompleteDescription,
			title: n.callbackSignupCompleteTitle
		},
		signupDisabled: {
			description: n.callbackSignupDisabledDescription,
			title: n.callbackSignupDisabledTitle
		}
	}[e.reason];
}
var Be = {
	version: "2.0",
	providers: [
		{
			id: "aamra",
			domains: ["aamra.com.bd"],
			type: "public_provider",
			companyProvider: "Aamra Mail",
			loginUrl: "https://mail.aamra.com.bd"
		},
		{
			id: "abvbg",
			type: "public_provider",
			companyProvider: "abv.bg",
			domains: ["abv.bg"],
			mx: ["pmx.abv.bg", "smx.abv.bg"],
			loginUrl: "https://passport.abv.bg/app/profiles/login"
		},
		{
			id: "alibab",
			domains: [
				"aliyun.com",
				"alibaba.com",
				"taobao.com",
				"tmall.com"
			],
			mx: [
				"mx1.qiye.aliyun.com",
				"mx2.qiye.aliyun.com",
				"mx3.qiye.aliyun.com"
			],
			txt: ["spf:spf.qiye.aliyun.com"],
			type: "public_provider",
			companyProvider: "Alibaba Mail",
			loginUrl: "https://mail.aliyun.com"
		},
		{
			id: "amazon",
			mx: [
				"awsapps.com",
				"inbound-smtp.us-east-1.awsapps.com",
				"inbound-smtp.us-west-2.awsapps.com",
				"inbound-smtp.eu-west-1.awsapps.com",
				"inbound-smtp.ap-southeast-2.awsapps.com",
				"workmail.amazonaws.com"
			],
			txt: [
				"amazonses:workmail",
				"spf:amazonses.com",
				"spf:workmail.us-east-1.amazonaws.com"
			],
			type: "custom_provider",
			companyProvider: "Amazon WorkMail",
			loginUrl: "https://workmail.aws.amazon.com/"
		},
		{
			id: "anonad",
			domains: ["anonaddy.com"],
			type: "public_provider",
			companyProvider: "AnonAddy",
			loginUrl: "https://anonaddy.com"
		},
		{
			id: "aol",
			domains: [
				"aol.com",
				"love.com",
				"ygm.com",
				"wow.com",
				"aim.com"
			],
			type: "public_provider",
			companyProvider: "AOL Mail",
			loginUrl: "https://mail.aol.com",
			alias: {
				dots: {
					ignore: !1,
					strip: !1
				},
				plus: {
					ignore: !1,
					strip: !1
				},
				case: {
					ignore: !0,
					strip: !0
				}
			}
		},
		{
			id: "apple_relay",
			domains: ["privaterelay.appleid.com"],
			mx: ["privaterelay.appleid.com"],
			txt: ["_spf.relay.apple.com"],
			type: "proxy_service",
			companyProvider: "Apple Private Relay",
			loginUrl: null
		},
		{
			id: "att",
			domains: [
				"ameritech.net",
				"att.net",
				"flash.net",
				"pacbell.net",
				"sbcglobal.net",
				"snet.net"
			],
			type: "public_provider",
			companyProvider: "AT&T Mail",
			loginUrl: "https://currently.att.yahoo.com"
		},
		{
			id: "autistici",
			domains: ["autistici.org"],
			mx: ["mx.autistici.org"],
			txt: ["spf1:mx a ~all"],
			type: "public_provider",
			companyProvider: "Autistici.org",
			loginUrl: "https://accounts.autistici.org/"
		},
		{
			id: "bbox",
			domains: ["bbox.fr"],
			type: "public_provider",
			mx: ["mx.bbox.fr"],
			companyProvider: "Bouygues Telecom Mail",
			loginUrl: "https://www.bbox.fr/webmail"
		},
		{
			id: "bd",
			domains: ["bdmail.net"],
			type: "public_provider",
			companyProvider: "BD Mail",
			loginUrl: "https://bdmail.net"
		},
		{
			id: "bell",
			domains: ["bell.net", "sympatico.ca"],
			type: "public_provider",
			mx: ["mx.bell.net"],
			companyProvider: "Bell Mail",
			loginUrl: "https://webmail.bell.net"
		},
		{
			id: "bg",
			domains: ["mail.bg"],
			type: "public_provider",
			companyProvider: "Mail.bg",
			loginUrl: "https://www.mail.bg"
		},
		{
			id: "biglob",
			domains: ["biglobe.ne.jp"],
			mx: ["bgmgate1.biglobe.ne.jp", "bgmgate2.biglobe.ne.jp"],
			txt: ["spf:spf01.biglobe.ne.jp include:spf04.biglobe.ne.jp include:spf06.biglobe.ne.jp ~all"],
			type: "public_provider",
			companyProvider: "Biglobe",
			loginUrl: "https://mail.biglobe.ne.jp"
		},
		{
			id: "bigpond",
			domains: ["bigpond.com", "bigpond.net.au"],
			type: "public_provider",
			mx: ["mx.bigpond.com", "mx.bigpond.net.au"],
			companyProvider: "BigPond Mail",
			loginUrl: "https://www.my.telstra.com.au/myaccount/home/email"
		},
		{
			id: "blueho",
			mx: ["bluehost.com", "mailchannels.net"],
			txt: ["spf:spf.bluehost.com"],
			type: "custom_provider",
			companyProvider: "Bluehost Email",
			loginUrl: "https://webmail.bluehost.com"
		},
		{
			id: "bluewi",
			domains: ["bluewin.ch"],
			type: "public_provider",
			companyProvider: "Bluewin Mail",
			loginUrl: "https://webmail.bluewin.ch"
		},
		{
			id: "bol",
			domains: ["bol.com.br"],
			type: "public_provider",
			companyProvider: "BOL Mail",
			loginUrl: "https://email.bol.com.br"
		},
		{
			id: "bsnl",
			domains: ["bsnl.in"],
			type: "public_provider",
			mx: ["mx.bsnl.in"],
			companyProvider: "BSNL Mail",
			loginUrl: "https://mail.bsnl.in"
		},
		{
			id: "bt",
			domains: ["bt.com", "btinternet.com"],
			type: "public_provider",
			mx: ["mx.btinternet.com"],
			companyProvider: "BT Internet Mail",
			loginUrl: "https://signin1.bt.com"
		},
		{
			id: "centru",
			domains: ["centrum.cz", "centrum.sk"],
			type: "public_provider",
			companyProvider: "Centrum Mail",
			loginUrl: "https://www.centrum.cz"
		},
		{
			id: "centurylink",
			domains: ["centurylink.net", "q.com"],
			type: "public_provider",
			mx: ["mx.centurylink.net", "mx.q.com"],
			companyProvider: "CenturyLink Email",
			loginUrl: "https://webmail.centurylink.net"
		},
		{
			id: "charter",
			domains: [
				"charter.net",
				"spectrum.net",
				"twc.com",
				"rr.com"
			],
			type: "public_provider",
			mx: [
				"mx.charter.net",
				"mx.spectrum.net",
				"mx.twc.com",
				"mx.rr.com"
			],
			companyProvider: "Charter/Spectrum Email",
			loginUrl: "https://mail.twc.com"
		},
		{
			id: "cloudflare",
			mx: [
				"mx.cloudflare.com",
				"route1.mx.cloudflare.net",
				"route2.mx.cloudflare.net",
				"route3.mx.cloudflare.net"
			],
			txt: ["spf:_spf.cloudflare.com", "cloudflare-verify="],
			type: "proxy_service",
			companyProvider: "Cloudflare Email Routing",
			loginUrl: null
		},
		{
			id: "com",
			domains: [
				"consultant.com",
				"email.com",
				"europe.com",
				"inbox.com",
				"mail.com",
				"myself.com",
				"usa.com"
			],
			type: "public_provider",
			companyProvider: "Mail.com",
			loginUrl: "https://www.mail.com"
		},
		{
			id: "comcas",
			domains: ["comcast.net"],
			type: "public_provider",
			companyProvider: "Comcast/Xfinity",
			loginUrl: "https://connect.xfinity.com/appsuite/"
		},
		{
			id: "counte",
			domains: ["countermail.com"],
			type: "public_provider",
			companyProvider: "CounterMail",
			loginUrl: "https://countermail.com"
		},
		{
			id: "cox",
			domains: ["cox.net"],
			type: "public_provider",
			mx: ["mx.coxmail.com"],
			companyProvider: "Cox Email",
			loginUrl: "https://webmail.cox.net"
		},
		{
			id: "daum",
			domains: ["daum.net"],
			mx: ["hanmail.net"],
			txt: ["spf:_spf.daum.net ~all"],
			type: "public_provider",
			companyProvider: "Daum",
			loginUrl: "https://mail.daum.net/"
		},
		{
			id: "disroot",
			domains: ["disroot.org"],
			mx: ["mx.disroot.org"],
			txt: ["spf1:mx ~all"],
			type: "public_provider",
			companyProvider: "Disroot",
			loginUrl: "https://mail.disroot.org"
		},
		{
			id: "duck",
			domains: ["duck.com"],
			type: "proxy_service",
			companyProvider: "DuckDuckGo Email Protection",
			loginUrl: "https://duckduckgo.com/email/",
			mx: ["duck.com"]
		},
		{
			id: "earthlink",
			type: "public_provider",
			companyProvider: "EarthLink",
			domains: ["earthlink.net"],
			mx: [
				"mx01.earthlink-vadesecure.net",
				"mx02.earthlink-vadesecure.net",
				"mx03.earthlink-vadesecure.net",
				"mx04.earthlink-vadesecure.net"
			],
			loginUrl: "https://webmail1.earthlink.net/login"
		},
		{
			id: "eircom",
			domains: ["eircom.net"],
			type: "public_provider",
			companyProvider: "Eircom Mail",
			loginUrl: "https://webmail.eircom.net"
		},
		{
			id: "fast",
			domains: ["fastmail.com", "fastmail.fm"],
			mx: [
				"messagingengine.com",
				"in1-smtp.messagingengine.com",
				"in2-smtp.messagingengine.com"
			],
			txt: ["spf:spf.messagingengine.com"],
			type: "public_provider",
			companyProvider: "FastMail",
			loginUrl: "https://www.fastmail.com",
			alias: {
				dots: {
					ignore: !1,
					strip: !1
				},
				plus: {
					ignore: !0,
					strip: !0
				},
				case: {
					ignore: !0,
					strip: !0
				}
			}
		},
		{
			id: "fence",
			domains: ["mailfence.com"],
			mx: [
				"mailfence.com",
				"smtp1.mailfence.com",
				"smtp2.mailfence.com"
			],
			txt: ["mailfence-verification"],
			type: "public_provider",
			companyProvider: "Mailfence",
			loginUrl: "https://mailfence.com"
		},
		{
			id: "freefr",
			domains: ["free.fr"],
			type: "public_provider",
			companyProvider: "Free.fr",
			loginUrl: "https://webmail.free.fr/"
		},
		{
			id: "freemailhu",
			type: "public_provider",
			companyProvider: "Freemail",
			domains: ["freemail.hu"],
			mx: ["fmx.freemail.hu"],
			loginUrl: "https://accounts.freemail.hu/a/login"
		},
		{
			id: "freenet",
			domains: ["freenet.de"],
			type: "public_provider",
			mx: ["mx.freenet.de"],
			companyProvider: "Freenet Mail",
			loginUrl: "https://mail.freenet.de"
		},
		{
			id: "frontier",
			domains: ["frontier.com"],
			type: "public_provider",
			mx: ["mx.frontier.com"],
			companyProvider: "Frontier Mail",
			loginUrl: "https://login.frontier.com/webmail"
		},
		{
			id: "g",
			domains: ["gmail.com", "googlemail.com"],
			type: "public_provider",
			companyProvider: "Gmail",
			loginUrl: "https://mail.google.com/mail/",
			alias: {
				dots: {
					ignore: !0,
					strip: !0
				},
				plus: {
					ignore: !0,
					strip: !0
				},
				case: {
					ignore: !0,
					strip: !0
				}
			}
		},
		{
			id: "globo",
			domains: ["globo.com"],
			type: "public_provider",
			companyProvider: "Globo Mail",
			loginUrl: "https://email.globo.com"
		},
		{
			id: "gmx",
			domains: [
				"gmx.com",
				"gmx.net",
				"gmx.de",
				"gmx.at",
				"gmx.ch",
				"gmx.org"
			],
			type: "public_provider",
			companyProvider: "GMX",
			loginUrl: "https://www.gmx.net"
		},
		{
			id: "godadd",
			domains: ["godaddy.com", "secureserver.net"],
			mx: [
				"smtp.secureserver.net",
				"mailstore1.secureserver.net",
				"mailstore2.secureserver.net",
				"mx1.secureserver.net",
				"mx2.secureserver.net",
				"domain-com.mail.protection.outlook.com"
			],
			txt: [
				"spf:secureserver.net",
				"spf:spf.protection.outlook.com",
				"godaddy-verification="
			],
			type: "public_provider",
			companyProvider: "GoDaddy",
			loginUrl: "https://sso.godaddy.com/?realm=pass&app=email"
		},
		{
			id: "gworks",
			mx: [
				"google.com",
				"googlemail.com",
				"aspmx.l.google.com",
				"aspmx2.googlemail.com",
				"aspmx3.googlemail.com"
			],
			txt: ["spf:_spf.google.com", "gsv:"],
			type: "custom_provider",
			companyProvider: "Google Workspace",
			loginUrl: "https://mail.google.com"
		},
		{
			id: "han",
			domains: ["hanmail.net"],
			type: "public_provider",
			companyProvider: "Hanmail",
			loginUrl: "https://mail.hanmail.net"
		},
		{
			id: "hey",
			domains: ["hey.com"],
			type: "public_provider",
			companyProvider: "HEY (37signals)",
			loginUrl: "https://app.hey.com"
		},
		{
			id: "hostga",
			domains: ["hostgator.com"],
			mx: ["mail.yourdomain.com"],
			txt: ["spf:websitewelcome.com"],
			type: "public_provider",
			companyProvider: "HostGator",
			loginUrl: "https://portal.hostgator.com/login"
		},
		{
			id: "hostin",
			domains: ["hostinger.com"],
			mx: [
				"mx1.hostinger.com",
				"mx2.hostinger.com",
				"mx3.hostinger.com"
			],
			txt: ["spf:spf.hostinger.com", "hostinger-verification="],
			type: "public_provider",
			companyProvider: "Hostinger",
			loginUrl: "https://mail.hostinger.com"
		},
		{
			id: "hush",
			domains: ["hushmail.com"],
			mx: ["plsmtp1.hushmail.com", "plsmtp2.hushmail.com"],
			txt: ["spf:4429584.spf01.hubspotemail.net ip4:65.39.178.0/24 ip4:64.69.70.192/28 -all"],
			type: "public_provider",
			companyProvider: "Hushmail",
			loginUrl: "https://www.hushmail.com/signin/"
		},
		{
			id: "icloud",
			domains: [
				"icloud.com",
				"me.com",
				"mac.com"
			],
			mx: ["mx01.mail.icloud.com", "mx02.mail.icloud.com"],
			txt: ["apple-domain-verification=", "spf:icloud.com"],
			type: "public_provider",
			companyProvider: "iCloud Mail",
			loginUrl: "https://www.icloud.com/mail",
			alias: {
				dots: {
					ignore: !1,
					strip: !1
				},
				plus: {
					ignore: !0,
					strip: !0
				},
				case: {
					ignore: !0,
					strip: !0
				}
			}
		},
		{
			id: "iij",
			domains: ["iij.ad.jp"],
			type: "public_provider",
			companyProvider: "IIJ",
			loginUrl: "https://mail.iij.ad.jp"
		},
		{
			id: "indiat",
			domains: ["indiatimes.com"],
			type: "public_provider",
			companyProvider: "IndiatTimes Mail",
			loginUrl: "https://mail.indiatimes.com"
		},
		{
			id: "interi",
			domains: ["interia.pl"],
			type: "public_provider",
			companyProvider: "Interia Mail",
			loginUrl: "https://poczta.interia.pl"
		},
		{
			id: "ionos",
			domains: [
				"ionos.com",
				"1and1.com",
				"ionos.de"
			],
			mx: [
				"mx00.ionos.com",
				"mx01.ionos.com",
				"mx00.1and1.com",
				"mx01.1and1.com",
				"mx00.kundenserver.de",
				"mx01.kundenserver.de"
			],
			txt: [
				"spf:_spf.perfora.net",
				"spf:_spf.kundenserver.de",
				"spf:_spf.ionos.com",
				"ionos-domain-verification="
			],
			type: "public_provider",
			companyProvider: "IONOS",
			loginUrl: "https://mail.ionos.com"
		},
		{
			id: "juno",
			domains: ["juno.com"],
			type: "public_provider",
			companyProvider: "Juno Mail",
			loginUrl: "https://webmail.juno.com"
		},
		{
			id: "kolabn",
			domains: ["kolabnow.com"],
			type: "public_provider",
			companyProvider: "Kolab Now",
			loginUrl: "https://kolabnow.com"
		},
		{
			id: "kpn",
			domains: ["kpnmail.nl", "hetnet.nl"],
			type: "public_provider",
			companyProvider: "KPN Mail",
			loginUrl: "https://www.kpn.nl/webmail"
		},
		{
			id: "lapost",
			domains: ["laposte.net"],
			mx: ["smtpz4.laposte.net"],
			txt: ["spf:_spfbloc2.laposte.net include:_spf.lpn.as8677.net -all"],
			type: "public_provider",
			companyProvider: "La Poste",
			loginUrl: "https://laposte.net/"
		},
		{
			id: "libero",
			domains: ["libero.it"],
			type: "public_provider",
			companyProvider: "Libero",
			loginUrl: "https://login.libero.it/"
		},
		{
			id: "link3",
			domains: ["link3.net"],
			type: "public_provider",
			companyProvider: "Link3 Mail",
			loginUrl: "https://mail.link3.net"
		},
		{
			id: "livejp",
			domains: ["live.jp"],
			type: "public_provider",
			companyProvider: "Live.jp",
			loginUrl: "https://login.live.com"
		},
		{
			id: "lycos",
			domains: ["lycos.com"],
			type: "public_provider",
			companyProvider: "Lycos Mail",
			loginUrl: "https://mail.lycos.com"
		},
		{
			id: "mailboxorg",
			domains: ["mailbox.org"],
			mx: ["mx.mailbox.org"],
			txt: ["spf:mailbox.org -all"],
			type: "public_provider",
			companyProvider: "Mailbox.org",
			loginUrl: "https://mailbox.org"
		},
		{
			id: "migadu",
			domains: ["migadu.com"],
			type: "public_provider",
			companyProvider: "Migadu",
			loginUrl: "https://migadu.com"
		},
		{
			id: "movist",
			domains: ["movistar.es"],
			type: "public_provider",
			companyProvider: "Movistar Mail",
			loginUrl: "https://webmail.movistar.es"
		},
		{
			id: "ms365b",
			mx: [
				"outlook.com",
				"microsoft.com",
				"office365.com",
				"protection.outlook.com",
				"mail.protection.outlook.com"
			],
			txt: [
				"spf:spf.protection.outlook.com",
				"ms",
				"microsoft-domain-verification"
			],
			type: "custom_provider",
			companyProvider: "Microsoft 365 (Business)",
			loginUrl: "https://outlook.office365.com"
		},
		{
			id: "msol",
			domains: [
				"hotmail.ca",
				"hotmail.co.jp",
				"hotmail.co.uk",
				"hotmail.com",
				"hotmail.com.au",
				"hotmail.de",
				"hotmail.es",
				"hotmail.fr",
				"hotmail.it",
				"hotmail.nl",
				"hotmail.se",
				"live.ca",
				"live.co.uk",
				"live.com",
				"live.com.au",
				"live.fr",
				"live.it",
				"live.nl",
				"msn.cn",
				"msn.com",
				"outlook.cn",
				"outlook.com",
				"outlook.jp",
				"outlook.sa"
			],
			type: "public_provider",
			companyProvider: "Microsoft Outlook",
			loginUrl: "https://outlook.office365.com",
			alias: {
				dots: {
					ignore: !1,
					strip: !1
				},
				plus: {
					ignore: !0,
					strip: !0
				},
				case: {
					ignore: !0,
					strip: !0
				}
			}
		},
		{
			id: "mtn",
			domains: ["mtnonline.com"],
			type: "public_provider",
			companyProvider: "MTN Mail",
			loginUrl: "https://webmail.mtnonline.com"
		},
		{
			id: "mxrecord_io",
			domains: ["mxrecord.io"],
			mx: ["mx1.mxrecord.io", "mx2.mxrecord.io"],
			txt: ["v=spf1 include:_spf.mxrecord.io -all"],
			type: "proxy_service",
			companyProvider: "MXRecord.io",
			loginUrl: null
		},
		{
			id: "mxrecord_mx",
			domains: ["mxrecord.mx"],
			mx: ["mx1.mxrecord.mx", "mx2.mxrecord.mx"],
			txt: ["v=spf1 include:_spf.mxrecord.mx -all"],
			type: "proxy_service",
			companyProvider: "MXRecord.mx",
			loginUrl: null
		},
		{
			id: "namech",
			domains: ["namecheap.com", "privateemail.com"],
			mx: ["mx1.privateemail.com", "mx2.privateemail.com"],
			txt: ["spf:spf.privateemail.com"],
			type: "public_provider",
			companyProvider: "Namecheap Private Email",
			loginUrl: "https://privateemail.com"
		},
		{
			id: "nat",
			domains: ["nate.com"],
			type: "public_provider",
			companyProvider: "Nate Mail",
			loginUrl: "https://mail.nate.com"
		},
		{
			id: "naver",
			domains: ["naver.com"],
			type: "public_provider",
			companyProvider: "Naver",
			loginUrl: "https://mail.naver.com/"
		},
		{
			id: "neospa",
			domains: ["neo.space"],
			mx: [
				"neo.space",
				"mx0001.neo.space",
				"mx0002.neo.space"
			],
			txt: ["neo-space-verification"],
			type: "public_provider",
			companyProvider: "Neo.space Email",
			loginUrl: "https://neo.space/mail"
		},
		{
			id: "neteas",
			domains: [
				"126.com",
				"163.com",
				"188.com",
				"yeah.net"
			],
			type: "public_provider",
			companyProvider: "NetEase Mail",
			loginUrl: "https://mail.126.com"
		},
		{
			id: "netzero",
			domains: ["netzero.net", "netzero.com"],
			type: "public_provider",
			companyProvider: "NetZero Mail",
			loginUrl: "https://webmail.netzero.net"
		},
		{
			id: "nifty",
			domains: ["nifty.com"],
			type: "public_provider",
			companyProvider: "Nifty Mail",
			loginUrl: "https://mail.nifty.com"
		},
		{
			id: "numericable",
			domains: ["numericable.fr"],
			type: "public_provider",
			mx: ["mx.numericable.fr"],
			companyProvider: "Numericable Mail",
			loginUrl: "https://webmail.numericable.fr"
		},
		{
			id: "ocn",
			domains: ["ocn.ne.jp"],
			type: "public_provider",
			companyProvider: "OCN",
			loginUrl: "https://mail.ocn.jp/"
		},
		{
			id: "oi",
			domains: ["oi.com.br"],
			type: "public_provider",
			mx: ["mx.oi.com.br"],
			companyProvider: "Oi Mail",
			loginUrl: "https://email.oi.com.br"
		},
		{
			id: "onecom",
			mx: [
				"one.com",
				"mailpod12-cph3.one.com",
				"pub.mailpod12-cph3.one.com"
			],
			txt: ["include:_spf.one.com"],
			type: "custom_provider",
			companyProvider: "One.com Email",
			loginUrl: "https://www.one.com/mail/"
		},
		{
			id: "onet",
			domains: [
				"onet.pl",
				"poczta.onet.pl",
				"op.pl"
			],
			type: "public_provider",
			companyProvider: "Onet Mail",
			loginUrl: "https://poczta.onet.pl"
		},
		{
			id: "onlinemail",
			mx: ["onlinemail.io"],
			type: "custom_provider",
			companyProvider: "Onlinemail",
			loginUrl: "https://www.onlinemail.io/"
		},
		{
			id: "optimum",
			type: "public_provider",
			companyProvider: "Optimum",
			domains: ["optimum.net", "optonline.net"],
			mx: ["mx.altice.prod.cloud.openwave.ai"],
			loginUrl: "https://webmail.optimum.net"
		},
		{
			id: "optus",
			domains: ["optusnet.com.au"],
			type: "public_provider",
			mx: ["mx.optusnet.com.au"],
			companyProvider: "OptusNet Mail",
			loginUrl: "https://webmail.optusnet.com.au"
		},
		{
			id: "orange",
			domains: ["orange.fr", "wanadoo.fr"],
			mx: ["orange.fr"],
			txt: ["spf:_spf_gp.wanadoo.fr include:spffed-ip.orange.com include:_spf_other.wanadoo.fr ~all"],
			type: "public_provider",
			companyProvider: "Orange",
			loginUrl: "https://login.orange.fr/"
		},
		{
			id: "planet",
			domains: ["planet.nl"],
			type: "public_provider",
			companyProvider: "Planet.nl",
			loginUrl: "https://webmail.planet.nl"
		},
		{
			id: "plusnet",
			domains: ["plus.com", "plusnet.com"],
			type: "public_provider",
			companyProvider: "Plusnet Mail",
			loginUrl: "https://webmail.plus.net"
		},
		{
			id: "posteo",
			domains: ["posteo.de", "posteo.net"],
			type: "public_provider",
			companyProvider: "Posteo",
			loginUrl: "https://posteo.de"
		},
		{
			id: "privatemail",
			domains: ["privatemail.com"],
			mx: ["mx.privatemail.com"],
			txt: ["spf:spf.privatemail.com -all"],
			type: "public_provider",
			companyProvider: "PrivateMail",
			loginUrl: "https://mail.privatemail.com/"
		},
		{
			id: "proton",
			domains: [
				"proton.me",
				"protonmail.com",
				"protonmail.ch",
				"pm.me"
			],
			mx: [
				"protonmail.ch",
				"mail.protonmail.ch",
				"mailsec.protonmail.ch"
			],
			txt: ["spf:_spf.protonmail.ch", "protonmail-verification="],
			type: "public_provider",
			companyProvider: "ProtonMail",
			loginUrl: "https://mail.proton.me",
			alias: {
				dots: {
					ignore: !1,
					strip: !1
				},
				plus: {
					ignore: !0,
					strip: !0
				},
				case: {
					ignore: !0,
					strip: !0
				}
			}
		},
		{
			id: "proximus",
			mx: ["mx.glb.proximus.be"],
			txt: [
				"spf:ispmail.spf.secure-mail.be",
				"spf:bgc.spf.secure-mail.be",
				"spf:pxspartners.spf.secure-mail.be",
				"spf:pxspartners2.spf.secure-mail.be"
			],
			type: "custom_provider",
			companyProvider: "Proximus Mail",
			loginUrl: "https://www.proximus.be/login/en/webmail.html"
		},
		{
			id: "qq",
			domains: ["qq.com", "foxmail.com"],
			type: "public_provider",
			companyProvider: "QQ Mail",
			loginUrl: "https://mail.qq.com"
		},
		{
			id: "racksp",
			mx: [
				"emailsrvr.com",
				"rackspace.com",
				"rackspacecloud.com"
			],
			txt: ["spf:emailsrvr.com"],
			type: "custom_provider",
			companyProvider: "Rackspace Email",
			loginUrl: "https://apps.rackspace.com/index.php"
		},
		{
			id: "rakute",
			domains: ["rakuten.co.jp"],
			type: "public_provider",
			companyProvider: "Rakuten Mail",
			loginUrl: "https://mail.rakuten.co.jp"
		},
		{
			id: "ramble",
			domains: [
				"rambler.ru",
				"lenta.ru",
				"autorambler.ru"
			],
			type: "public_provider",
			companyProvider: "Rambler Mail",
			loginUrl: "https://mail.rambler.ru"
		},
		{
			id: "rediff",
			domains: ["rediffmail.com", "rediff.com"],
			type: "public_provider",
			companyProvider: "Rediffmail",
			loginUrl: "https://mail.rediff.com"
		},
		{
			id: "rogers",
			domains: ["rogers.com"],
			type: "public_provider",
			mx: ["mx.rogers.com"],
			companyProvider: "Rogers Email",
			loginUrl: "https://rogersmembercentre.com/rmcapp/remc.html#/signin"
		},
		{
			id: "ru",
			domains: [
				"mail.ru",
				"bk.ru",
				"list.ru",
				"inbox.ru"
			],
			type: "public_provider",
			companyProvider: "Mail.ru",
			loginUrl: "https://mail.ru/",
			alias: {
				dots: {
					ignore: !1,
					strip: !1
				},
				plus: {
					ignore: !0,
					strip: !0
				},
				case: {
					ignore: !0,
					strip: !0
				}
			}
		},
		{
			id: "runbox",
			domains: ["runbox.com"],
			type: "public_provider",
			companyProvider: "Runbox",
			loginUrl: "https://runbox.com/mail"
		},
		{
			id: "seznam",
			domains: [
				"seznam.cz",
				"email.cz",
				"post.cz"
			],
			type: "public_provider",
			companyProvider: "Seznam.cz",
			loginUrl: "https://email.seznam.cz"
		},
		{
			id: "sfr",
			domains: ["sfr.fr"],
			type: "public_provider",
			mx: ["mx.sfr.fr"],
			companyProvider: "SFR Mail",
			loginUrl: "https://webmail.sfr.fr"
		},
		{
			id: "shaw",
			domains: ["shaw.ca"],
			type: "public_provider",
			mx: ["mx.shaw.ca"],
			companyProvider: "Shaw Email",
			loginUrl: "https://webmail.shaw.ca"
		},
		{
			id: "sify",
			domains: ["sify.com", "sifymail.com"],
			type: "public_provider",
			companyProvider: "Sify Mail",
			loginUrl: "https://mail.sify.com"
		},
		{
			id: "simple",
			domains: [
				"8alias.com",
				"8shield.net",
				"aleeas.com",
				"dralias.com",
				"silomails.com",
				"simplelogin.com",
				"simplelogin.fr",
				"simplelogin.io",
				"slmail.me",
				"slmails.com"
			],
			type: "public_provider",
			companyProvider: "SimpleLogin",
			loginUrl: "https://app.simplelogin.io"
		},
		{
			id: "simply",
			mx: ["spamfilter.io", "mx.spamfilter.io"],
			txt: ["include:spf.key-systems.net"],
			type: "custom_provider",
			companyProvider: "Simply.com Email",
			loginUrl: "https://www.simply.com/en/email"
		},
		{
			id: "sina",
			domains: [
				"sina.com",
				"sina.cn",
				"sina.com.cn"
			],
			type: "public_provider",
			companyProvider: "Sina Mail",
			loginUrl: "https://mail.sina.com.cn"
		},
		{
			id: "sitegr",
			domains: ["siteground.com"],
			mx: [
				"mx10.antispam.mailspamprotection.com",
				"mx20.antispam.mailspamprotection.com",
				"mx30.antispam.mailspamprotection.com"
			],
			txt: ["spf:_spf.mailspamprotection.com"],
			type: "custom_provider",
			companyProvider: "SiteGround",
			loginUrl: "https://tools.siteground.com/email"
		},
		{
			id: "sky",
			domains: ["sky.com"],
			type: "public_provider",
			mx: ["mx.sky.com"],
			companyProvider: "Sky Mail",
			loginUrl: "https://skyid.sky.com/signin/email"
		},
		{
			id: "skynet",
			domains: ["skynet.be", "proximus.be"],
			type: "public_provider",
			companyProvider: "Proximus Mail",
			loginUrl: "https://www.proximus.be/login/en/webmail.html"
		},
		{
			id: "startmail",
			domains: ["startmail.com"],
			mx: ["mx.startmail.com"],
			txt: ["spf:spf.startmail.com -all"],
			type: "public_provider",
			companyProvider: "StartMail",
			loginUrl: "https://startmail.com"
		},
		{
			id: "talktalk",
			domains: ["talktalk.net"],
			type: "public_provider",
			mx: ["mx.talktalk.net"],
			companyProvider: "TalkTalk Mail",
			loginUrl: "https://apps.talktalk.co.uk/appsuite/"
		},
		{
			id: "teleko",
			domains: ["magenta.de", "telekom.de"],
			type: "public_provider",
			companyProvider: "Telekom Mail",
			loginUrl: "https://email.magenta.de"
		},
		{
			id: "telene",
			domains: ["telenet.be"],
			type: "public_provider",
			companyProvider: "Telenet Mail",
			loginUrl: "https://webmail.telenet.be"
		},
		{
			id: "telkom",
			domains: ["telkom.co.za"],
			type: "public_provider",
			companyProvider: "Telkom Mail",
			loginUrl: "https://webmail.telkom.co.za"
		},
		{
			id: "telus",
			domains: ["telus.net"],
			type: "public_provider",
			mx: ["mx.telus.net"],
			companyProvider: "Telus Email",
			loginUrl: "https://email.telus.net"
		},
		{
			id: "terra",
			domains: ["terra.com.br"],
			type: "public_provider",
			companyProvider: "Terra Mail",
			loginUrl: "https://webmail.terra.com.br"
		},
		{
			id: "tiscal",
			domains: ["tiscali.it"],
			type: "public_provider",
			companyProvider: "Tiscali Mail",
			loginUrl: "https://mail.tiscali.it"
		},
		{
			id: "titan",
			domains: ["titan.email"],
			mx: ["mx1.titan.email", "mx2.titan.email"],
			txt: ["spf:spf.titan.email"],
			type: "public_provider",
			companyProvider: "Titan Email",
			loginUrl: "https://app.titan.email"
		},
		{
			id: "tonlin",
			domains: ["t-online.de"],
			type: "public_provider",
			companyProvider: "T-Online",
			loginUrl: "https://email.t-online.de/"
		},
		{
			id: "tutano",
			domains: [
				"tutanota.com",
				"tutanota.de",
				"tutamail.com",
				"tuta.io",
				"keemail.me",
				"tuta.com"
			],
			mx: ["tutanota.de", "mail.tutanota.de"],
			txt: ["tutanota-verification="],
			type: "public_provider",
			companyProvider: "Tutanota",
			loginUrl: "https://mail.tutanota.com",
			alias: {
				dots: {
					ignore: !1,
					strip: !1
				},
				plus: {
					ignore: !1,
					strip: !1
				},
				case: {
					ignore: !0,
					strip: !0
				}
			}
		},
		{
			id: "ukrnet",
			type: "public_provider",
			companyProvider: "ukr.net",
			domains: ["ukr.net"],
			mx: ["mxs.ukr.net"],
			loginUrl: "https://accounts.ukr.net/"
		},
		{
			id: "uol",
			domains: ["uol.com.br"],
			type: "public_provider",
			companyProvider: "UOL Mail",
			loginUrl: "https://email.uol.com.br"
		},
		{
			id: "verizo",
			domains: ["verizon.net"],
			type: "public_provider",
			companyProvider: "Verizon",
			loginUrl: "https://login.verizon.com/"
		},
		{
			id: "videotron",
			domains: ["videotron.ca", "videotron.com"],
			type: "public_provider",
			companyProvider: "Videotron Mail",
			loginUrl: "https://webmail.videotron.com"
		},
		{
			id: "virgil",
			domains: [
				"virgilio.it",
				"alice.it",
				"tin.it"
			],
			type: "public_provider",
			companyProvider: "Virgilio Mail",
			loginUrl: "https://mail.virgilio.it"
		},
		{
			id: "virginmedia",
			domains: ["virginmedia.com"],
			type: "public_provider",
			companyProvider: "Virgin Media Mail",
			loginUrl: "https://mail.virginmedia.com",
			mx: ["virginmedia.com"]
		},
		{
			id: "vodaco",
			domains: ["vodacom.co.za"],
			type: "public_provider",
			companyProvider: "Vodacom Mail",
			loginUrl: "https://webmail.vodacom.co.za"
		},
		{
			id: "vodafonede",
			type: "public_provider",
			companyProvider: "Vodafone Germany",
			domains: ["vodafone.de", "arcor.de"],
			mx: [
				"mx2.vodafonemail.de",
				"mx3.vodafonemail.de",
				"mx1.vodafonemail.de"
			],
			loginUrl: "https://live.vodafone.de/partners/mail"
		},
		{
			id: "vsnl",
			domains: ["vsnl.net"],
			type: "public_provider",
			mx: ["mx.vsnl.net", "mx.vsnl.com"],
			companyProvider: "VSNL Mail (Tata)",
			loginUrl: "https://webmail.vsnl.com"
		},
		{
			id: "webde",
			domains: ["web.de"],
			type: "public_provider",
			companyProvider: "Web.de",
			loginUrl: "https://web.de/"
		},
		{
			id: "windstream",
			type: "public_provider",
			companyProvider: "Windstream",
			domains: ["windstream.net"],
			mx: ["mx01.windstream.net"],
			loginUrl: "https://webmail.windstream.net/"
		},
		{
			id: "wppl",
			type: "public_provider",
			companyProvider: "Wp.pl",
			domains: ["wp.pl"],
			mx: ["mx.wp.pl", "mx5.wp.pl"],
			loginUrl: "https://poczta.wp.pl/login/login.html"
		},
		{
			id: "xs4all",
			domains: ["xs4all.nl"],
			type: "public_provider",
			companyProvider: "Xs4All",
			loginUrl: "https://webmail.xs4all.nl"
		},
		{
			id: "xtra",
			domains: ["xtra.co.nz"],
			type: "public_provider",
			companyProvider: "Xtra Mail",
			loginUrl: "https://www.xtra.co.nz/email"
		},
		{
			id: "y",
			domains: [
				"yahoo.com",
				"yahoo.co.uk",
				"yahoo.fr",
				"yahoo.co.in",
				"yahoo.com.br",
				"yahoo.co.jp",
				"yahoo.it",
				"yahoo.de",
				"yahoo.in",
				"yahoo.es",
				"yahoo.ca",
				"yahoo.com.au",
				"yahoo.com.ar",
				"yahoo.com.mx",
				"yahoo.co.id",
				"yahoo.com.sg",
				"ymail.com",
				"rocketmail.com",
				"myyahoo.com"
			],
			type: "public_provider",
			companyProvider: "Yahoo Mail",
			loginUrl: "https://login.yahoo.com",
			alias: {
				dots: {
					ignore: !1,
					strip: !1
				},
				plus: {
					ignore: !0,
					strip: !0
				},
				case: {
					ignore: !0,
					strip: !0
				}
			}
		},
		{
			id: "yandex",
			domains: ["yandex.ru", "yandex.com"],
			alias: {
				dots: {
					ignore: !1,
					strip: !1
				},
				plus: {
					ignore: !0,
					strip: !0
				},
				case: {
					ignore: !0,
					strip: !0
				}
			},
			type: "public_provider",
			companyProvider: "Yandex Mail",
			loginUrl: "https://mail.yandex.com"
		},
		{
			id: "ziggo",
			domains: ["ziggo.nl", "home.nl"],
			type: "public_provider",
			companyProvider: "Ziggo Mail",
			loginUrl: "https://www.ziggo.nl/mail"
		},
		{
			id: "zoho",
			domains: ["zohomail.com", "zoho.com"],
			type: "public_provider",
			companyProvider: "Zoho Mail",
			loginUrl: "https://mail.zoho.com",
			alias: {
				dots: {
					ignore: !1,
					strip: !1
				},
				plus: {
					ignore: !0,
					strip: !0
				},
				case: {
					ignore: !0,
					strip: !0
				}
			}
		},
		{
			id: "zohoeu",
			domains: ["zoho.eu"],
			type: "public_provider",
			companyProvider: "Zoho Mail EU",
			loginUrl: "https://mail.zoho.eu"
		}
	],
	meta: {
		count: 140,
		domains: 259,
		generated: "2026-07-13T02:59:27.245Z"
	}
};
var k;
function Ve() {
	if (k) return k;
	k = /* @__PURE__ */ new Map();
	let { providers: e } = Be;
	for (let t of e) if (t.loginUrl) for (let e of t.domains ?? []) k.set(e.toLowerCase(), {
		companyProvider: t.companyProvider,
		loginUrl: t.loginUrl
	});
	return k;
}
function He(e) {
	let t = e.lastIndexOf("@");
	if (t === -1) return null;
	let n = e.slice(t + 1).trim().toLowerCase();
	return n ? Ve().get(n) ?? null : null;
}
function A(e) {
	return e ? { message: e } : void 0;
}
function j(e) {
	return M(e)[0]?.message;
}
function M(e) {
	return e.flatMap((e) => typeof e == "string" && e ? [{ message: e }] : e && typeof e == "object" && "message" in e && typeof e.message == "string" && e.message ? [{ message: e.message }] : []);
}
function N(e) {
	if (typeof e == "string") return e || void 0;
	if (!(!e || typeof e != "object")) {
		if ("message" in e && typeof e.message == "string" && e.message) return e.message;
		if ("statusText" in e && typeof e.statusText == "string" && e.statusText) return e.statusText;
	}
}
function P(e) {
	if (!e || typeof e != "object") return;
	let t = "fieldErrors" in e ? e.fieldErrors : "fields" in e ? e.fields : void 0;
	if (!(!t || typeof t != "object")) return Object.fromEntries(Object.entries(t).flatMap(([e, t]) => {
		let n = Array.isArray(t) ? j(t) : N(t);
		return n ? [[e, { message: n }]] : [];
	}));
}
function Ue(e, t) {
	let n = e && typeof e == "object" && "body" in e && e.body && typeof e.body == "object" ? e.body : void 0;
	return {
		fields: P(e) ?? P(n) ?? void 0,
		form: A(N(e) ?? N(n) ?? t)
	};
}
function We(e, { maxLength: t, maxLengthMessage: n, minLength: r, minLengthMessage: i, requiredMessage: a, trim: o = !1 }) {
	let s = o ? e.trim() : e;
	if (!s && a) return A(a);
	if (r !== void 0 && s.length < r) return A(i);
	if (t !== void 0 && s.length > t) return A(n);
}
function Ge(e, { invalidMessage: t, requiredMessage: n }) {
	let r = e.trim();
	if (!r) return n ? A(n) : void 0;
	let i = r.lastIndexOf("@"), a = r.indexOf("@"), o = r.slice(i + 1);
	return i > 0 && i === a && i < r.length - 1 && !r.includes(" ") && o.includes(".") && !o.startsWith(".") && !o.endsWith(".") ? void 0 : A(t);
}
function Ke(e, t, n) {
	return e === t ? void 0 : A(n);
}
var I = "PASSWORD_COMPROMISED";
function Ye(e) {
	if (typeof e != "object" || !e) return !1;
	if (e.code === "PASSWORD_COMPROMISED") return !0;
	let t = e.error;
	return typeof t != "object" || !t ? !1 : t.code === I;
}
var Xe = [
	"abcdefghijklmnopqrstuvwxyz",
	"0123456789",
	"qwertyuiop"
];
function Ze(e, t = 4) {
	for (let n of Xe) {
		let r = [...n].reverse().join("");
		for (let i of [n, r]) for (let n = 0; n + t <= i.length; n++) if (e.includes(i.slice(n, n + t))) return !0;
	}
	return !1;
}
function Qe(e, t = {}) {
	if (!e) return {
		score: 0,
		level: "empty"
	};
	let n = t.minLength ?? 8, r = e.toLowerCase(), i = 0;
	e.length >= n && (i += 1), e.length >= n + 4 && (i += 1), e.length >= 16 && (i += 1);
	let a = [
		/[a-z]/.test(e),
		/[A-Z]/.test(e),
		/\d/.test(e),
		/[^a-zA-Z\d]/.test(e)
	].filter(Boolean).length;
	if (a >= 3 && (i += 1), a === 4 && (i += 1), new Set(e).size <= 2 && (i -= 2), Ze(r) && --i, e.length < n) return {
		score: 1,
		level: "weak"
	};
	let o = Math.min(4, Math.max(1, i));
	return {
		score: o,
		level: [
			"weak",
			"fair",
			"good",
			"strong"
		][o - 1]
	};
}
var L = {
	apple: "Apple",
	atlassian: "Atlassian",
	cognito: "Cognito",
	discord: "Discord",
	dropbox: "Dropbox",
	facebook: "Facebook",
	figma: "Figma",
	github: "GitHub",
	gitlab: "GitLab",
	google: "Google",
	huggingface: "Hugging Face",
	kakao: "Kakao",
	kick: "Kick",
	line: "LINE",
	linear: "Linear",
	linkedin: "LinkedIn",
	microsoft: "Microsoft",
	naver: "Naver",
	notion: "Notion",
	paybin: "Paybin",
	paypal: "PayPal",
	polar: "Polar",
	railway: "Railway",
	reddit: "Reddit",
	roblox: "Roblox",
	salesforce: "Salesforce",
	slack: "Slack",
	spotify: "Spotify",
	tiktok: "TikTok",
	twitch: "Twitch",
	twitter: "X",
	vercel: "Vercel",
	vk: "VK",
	wechat: "WeChat",
	zoom: "Zoom"
};
function $e(e) {
	if (typeof e != "string" && y(e)) return e.label;
	let t = typeof e == "string" ? e : v(e);
	return L[t] || t.charAt(0).toUpperCase() + t.slice(1);
}
var et = (e) => {
	let t = [];
	for (let [n, r] of e.entries()) {
		let e;
		for (let i = 0; i <= r.length; i += 1) {
			let a = r[i] ?? !1;
			if (a && e === void 0) {
				e = i;
				continue;
			}
			!a && e !== void 0 && (t.push(`M${e} ${n}h${i - e}v1H${e}z`), e = void 0);
		}
	}
	return t.join("");
};
function tt(e) {
	let t = encode(e, {
		border: 4,
		ecc: "M"
	});
	return {
		path: et(t.data),
		size: t.size
	};
}
function nt(e) {
	let t = e.getMutationCache(), n = t.config.onSuccess;
	return t.config.onSuccess = async (t, r, i, a, o) => {
		if (await n?.(t, r, i, a, o), !matchMutation({ mutationKey: e$4.all }, a)) return;
		let { invalidates: s, awaits: c, removes: l } = a.meta ?? {};
		if (l?.length && e.removeQueries({ predicate: (e) => l.some((t) => matchQuery({ queryKey: t }, e)) }), s?.length && e.invalidateQueries({ predicate: (e) => s.some((t) => matchQuery({ queryKey: t }, e)) }), c?.length) return e.invalidateQueries({ predicate: (e) => c.some((t) => matchQuery({ queryKey: t }, e)) }, { cancelRefetch: !1 });
	}, () => {
		t.config.onSuccess = n;
	};
}
function bt(e) {
	return {
		mutationKey: e$4.requestPasswordReset,
		mutationFn: (t) => e.requestPasswordReset({
			...t,
			fetchOptions: {
				...t?.fetchOptions,
				throw: !0
			}
		})
	};
}
function xt(e) {
	return {
		mutationKey: e$4.resetPassword,
		mutationFn: (t) => e.resetPassword({
			...t,
			fetchOptions: {
				...t?.fetchOptions,
				throw: !0
			}
		})
	};
}
function Tt(e) {
	return {
		mutationKey: e$4.sendVerificationEmail,
		mutationFn: (t) => e.sendVerificationEmail({
			...t,
			fetchOptions: {
				...t?.fetchOptions,
				throw: !0
			}
		})
	};
}
function X(e, t) {
	return {
		queryKey: e$3.session,
		queryFn: ({ signal: n }) => e.getSession({
			...t,
			fetchOptions: c(t?.fetchOptions, n)
		})
	};
}
var kt = (e, t, n) => {
	let { fetchOptions: r, query: i, ...a } = n ?? {};
	return e.fetchQuery({
		...X(t, {
			query: i,
			fetchOptions: r
		}),
		...a
	});
};
function jt(e) {
	return {
		mutationKey: e$4.signIn.popup,
		mutationFn: async (t, { client: n }) => {
			let r = await e.signIn.popup(t);
			if (r.error) throw r.error;
			return await n.cancelQueries({ queryKey: e$3.session }), await kt(n, e, { staleTime: 0 }), r;
		}
	};
}
function Mt(e) {
	return {
		mutationKey: e$4.signIn.social,
		mutationFn: (t) => e.signIn.social({
			...t,
			fetchOptions: {
				...t?.fetchOptions,
				throw: !0
			}
		})
	};
}
function Nt(e) {
	return {
		mutationKey: e$4.signOut,
		mutationFn: (t) => e.signOut({
			...t ?? {},
			fetchOptions: {
				...t?.fetchOptions,
				throw: !0
			}
		}),
		meta: { removes: [e$3.all] }
	};
}
function Pt(e) {
	return {
		mutationKey: e$4.signUp.email,
		mutationFn: (t) => e.signUp.email({
			...t,
			fetchOptions: {
				...t?.fetchOptions,
				throw: !0
			}
		}),
		meta: { awaits: [e$3.session] }
	};
}
//#endregion
//#region node_modules/.pnpm/@better-auth-ui+core@1.7.27_17797606c8ca7fa6484a48add331f83f/node_modules/@better-auth-ui/core/dist/plugins/last-login-method/index.js
var t$1 = {
	lastUsed: "Last used",
	lastUsedShort: "Last"
};
var n$2 = e$1("lastLoginMethod", (e = {}) => ({ localization: {
	...t$1,
	...e.localization
} }));
//#endregion
//#region node_modules/.pnpm/@better-auth-ui+core@1.7.27_17797606c8ca7fa6484a48add331f83f/node_modules/@better-auth-ui/core/dist/plugins/one-tap/index.js
var e = { prompt: [
	"auth",
	"oneTap",
	"prompt"
] };
//#endregion
//#region node_modules/.pnpm/@better-auth-ui+core@1.7.27_17797606c8ca7fa6484a48add331f83f/node_modules/@better-auth-ui/core/dist/plugins/email-otp/index.js
var n$1 = {
	signIn: [
		"auth",
		"signIn",
		"emailOtp"
	],
	sendVerificationOtp: [
		"auth",
		"emailOtp",
		"sendVerificationOtp"
	],
	verifyEmail: [
		"auth",
		"emailOtp",
		"verifyEmail"
	],
	requestPasswordReset: [
		"auth",
		"emailOtp",
		"requestPasswordReset"
	],
	resetPassword: [
		"auth",
		"emailOtp",
		"resetPassword"
	],
	requestEmailChange: [
		"auth",
		"emailOtp",
		"requestEmailChange"
	],
	changeEmail: [
		"auth",
		"emailOtp",
		"changeEmail"
	]
};
var i$1 = {
	emailOtp: "Email Code",
	sendCode: "Send code",
	code: "Code",
	verifyCode: "Verify code",
	codeSentTo: "We sent a code to {{email}}",
	codeLengthMismatch: "Enter the {{length}}-digit code",
	useDifferentEmail: "Use a different email",
	codeSent: "Code sent",
	emailVerified: "Email verified",
	confirmCurrentEmail: "Confirm your current email",
	confirmNewEmail: "Confirm your new email",
	confirmEmailDescription: "Enter the code we sent to {{email}} to finish the change"
};
var a = 6;
function o(e) {
	return e === void 0 || !Number.isFinite(e) ? a : Math.max(1, Math.floor(e));
}
var s = e$1("emailOtp", (e = {}) => ({
	localization: {
		...i$1,
		...e.localization
	},
	otpLength: o(e.otpLength),
	signIn: e.signIn ?? !0,
	emailVerification: e.emailVerification ?? !1,
	passwordReset: e.passwordReset ?? !1,
	changeEmail: e.changeEmail ?? !1,
	verifyCurrentEmail: e.verifyCurrentEmail ?? !1,
	disableSignUp: e.disableSignUp ?? !0,
	viewPaths: { auth: { emailOtp: e.path ?? "email-otp" } }
}));
function d(e) {
	return {
		mutationKey: n$1.sendVerificationOtp,
		mutationFn: (t) => e.emailOtp.sendVerificationOtp({
			...t,
			fetchOptions: {
				...t?.fetchOptions,
				throw: !0
			}
		})
	};
}
function f$1(t) {
	return {
		mutationKey: n$1.signIn,
		mutationFn: (e) => t.signIn.emailOtp({
			...e,
			fetchOptions: {
				...e?.fetchOptions,
				throw: !0
			}
		}),
		meta: { awaits: [e$3.session] }
	};
}
[...e$4.signIn.all], [...e$4.signIn.all];
function u() {
	try {
		return typeof sessionStorage > "u" ? "" : sessionStorage.getItem("better-auth-ui.sso-email") ?? "";
	} catch {
		return "";
	}
}
var f = {
	addProvider: "Add SSO provider",
	cancel: "Cancel",
	clientId: "Client ID",
	clientSecret: "Client secret",
	continueWithEmail: "Continue with email",
	continueWithSso: "Continue with SSO",
	copyDnsHost: "Copy DNS host",
	copyDnsValue: "Copy DNS value",
	domain: "Email domain",
	domainVerification: "Domain verification",
	domainVerificationDescription: "Publish the TXT record for every configured domain, then verify it.",
	domainVerificationRequested: "A new verification token was created.",
	domainVerified: "The provider domain is verified.",
	deleteProvider: "Delete provider",
	deleteProviderDescription: "Users will no longer be able to sign in through this provider.",
	discoveryEndpoint: "Discovery endpoint",
	editProvider: "Edit provider",
	emailFirstDescription: "Enter your work email to continue.",
	entryPoint: "SSO URL",
	identityProviderMetadata: "Identity provider metadata XML",
	invalidUrl: "Enter a valid absolute URL.",
	issuer: "Issuer URL",
	oidc: "OIDC",
	organizationId: "Organization ID",
	noProviders: "No SSO providers",
	noProvidersDescription: "Add an identity provider to enable organization sign-in.",
	providerDeleted: "The SSO provider was deleted.",
	providerList: "Organization SSO",
	providerListDescription: "Manage identity providers and verified domains for this organization.",
	providerAccessDenied: "Only organization owners and administrators can manage SSO providers.",
	providerLoadError: "SSO providers could not be loaded.",
	providerUpdated: "The SSO provider was updated.",
	providerCreated: "The SSO provider was added.",
	providerId: "Provider ID",
	providerSetup: "SSO provider setup",
	providerSetupDescription: "Connect an OpenID Connect or SAML identity provider.",
	requestNewToken: "Create new token",
	retry: "Retry",
	saveProvider: "Save provider",
	saml: "SAML",
	txtRecordHost: "TXT record host",
	txtRecordValue: "TXT record value",
	useDifferentEmail: "Use a different email",
	verifyDomain: "Verify domain",
	noProvider: "No organization sign-in was found. Choose another way to continue.",
	ssoUnavailable: "Organization sign-in is unavailable. Try another sign-in method."
};
e$1("sso", (e = {}) => ({
	emailFirst: e.emailFirst ?? !0,
	localization: {
		...f,
		...e.localization
	},
	organization: e.organization ?? !0,
	path: e.path ?? "sso"
}));
//#endregion
//#region node_modules/.pnpm/@better-auth-ui+core@1.7.27_17797606c8ca7fa6484a48add331f83f/node_modules/@better-auth-ui/core/dist/plugins/magic-link/index.js
var t = {
	magicLink: "Magic Link",
	sendMagicLink: "Send Magic Link",
	magicLinkSent: "Check your email for the magic link",
	magicLinkSentTo: "We sent a magic link to {{email}}"
};
var n = { signIn: [
	"auth",
	"signIn",
	"magicLink"
] };
var r = e$1("magicLink", (e = {}) => ({
	localization: {
		...t,
		...e.localization
	},
	viewPaths: { auth: {
		magicLink: e.path ?? "magic-link",
		magicLinkSent: e.sentPath ?? "magic-link-sent"
	} }
}));
function i(e) {
	return {
		mutationKey: n.signIn,
		mutationFn: (t) => e.signIn.magicLink({
			...t,
			fetchOptions: {
				...t?.fetchOptions,
				throw: !0
			}
		})
	};
}
//#endregion
export { isValidTimeout as $, Ye as A, pe as B, Re as C, Ue as D, Tt as E, je as F, addConsumeAwareSignal as G, v as H, jt as I, ensureQueryFn as J, addToEnd as K, ke as L, bt as M, ge as N, We as O, he as P, isServer as Q, me as R, Qe as S, Te as T, x as U, tt as V, xt as W, hashKey as X, functionalUpdate as Y, hashQueryKeyByOptions as Z, Le as _, e$4 as _t, f$1 as a, replaceEqualDeep as at, Nt as b, n$2 as c, shouldThrowError as ct, Ce as d, timeUntilStale as dt, matchMutation as et, De as f, systemSetTimeoutZero as ft, Ke as g, e$3 as gt, He as h, f$2 as ht, d as i, replaceData as it, be as j, X as k, t$1 as l, skipToken as lt, Ge as m, e$1 as mt, r as n, noop as nt, s as o, resolveQueryValue as ot, Ee as p, timeoutManager as pt, addToStart as q, u as r, partialMatchKey as rt, e as s, shallowEqualObjects as st, i as t, matchQuery as tt, $e as u, sleep as ut, M as v, C$1 as vt, Se as w, Pt as x, Mt as y, e$5 as yt, nt as z };
