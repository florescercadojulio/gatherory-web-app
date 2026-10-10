import { o as __toESM } from "./_runtime.mjs";
import { bt as require_react, yt as require_jsx_runtime } from "./_libs/@base-ui/react+[...].mjs";
import { t as cn } from "./_libs/cn.mjs";
import { A as CircleX, E as EyeOff, L as Check, T as Eye, a as Sparkles, j as CircleCheck, r as TriangleAlert } from "./_libs/lucide-react.mjs";
import { A as Ye, B as pe, C as Re, F as je, O as We, R as me, S as Qe, T as Te, _ as Le, _t as e, f as De, g as Ke, m as Ge, p as Ee } from "./_libs/@better-auth-ui/core+[...].mjs";
import { _ as D, a as Je, c as Te$1, g as n, i as Be, l as We$1, m as ze, u as Ye$1, y as S } from "./_libs/@better-auth-ui/react+[...].mjs";
import { t as useIsMutating } from "./_libs/tanstack__react-query.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { C as FieldGroup, F as CardHeader, H as authClient, I as CardTitle, L as Button$1, N as CardContent, O as Checkbox$1, P as CardDescription, R as Input$1, S as FieldError, T as FieldSeparator, _ as InputGroupInput, b as Field, c as ProviderButtons, d as getAuthAdditionalFieldValidators, f as isAuthFormFieldInvalid, g as InputGroupButton, h as InputGroupAddon, j as Card, l as LastUsedBadge, m as InputGroup, o as useIsHydrated, p as useAuthForm, r as Route$1, s as ReauthenticationNotice, u as OpenEmailButton, v as Spinner, w as FieldLabel, x as FieldDescription, y as useSignInContinuation } from "./_ssr/router-Dz7FCRyI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_path-wCtqYMgg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Redirects authenticated users to a validated same-origin target.
*
* Signed-out users are sent through the sign-in view first. The redirect view
* is preserved as the post-authentication destination so API callbacks receive
* a full-page request after the session is established.
*
* @param className - Optional additional class names applied to the spinner
* @returns The centered spinner shown while the session and redirect resolve
*/
function AuthRedirect({ className }) {
	const { authClient, basePaths, viewPaths } = D();
	const { data: session, isPending } = n(authClient);
	const hasRedirected = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (isPending || hasRedirected.current) return;
		hasRedirected.current = true;
		const action = je(new URL(window.location.href), Boolean(session), `${basePaths.auth}/${viewPaths.auth.signIn}`);
		window.location.replace(action.to);
	}, [
		basePaths.auth,
		isPending,
		session,
		viewPaths.auth.signIn
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { className: cn("mx-auto my-auto", className) });
}
function AuthResultView({ className, fallbackIntent }) {
	const { basePaths, localization, navigate, viewPaths } = D();
	const [result, setResult] = (0, import_react.useState)(() => Le("", fallbackIntent));
	(0, import_react.useEffect)(() => {
		setResult(Le(window.location.search, fallbackIntent));
	}, [fallbackIntent]);
	const message = Re(result, localization);
	const action = (() => {
		switch (result.action) {
			case "accountSettings": return {
				label: localization.auth.callbackViewAccountSettings,
				to: `${basePaths.settings}/${viewPaths.settings.security}`
			};
			case "continue": return {
				label: localization.auth.callbackContinue,
				to: result.redirectTo ?? "/"
			};
			case "forgotPassword": return {
				label: localization.auth.forgotPassword,
				to: `${basePaths.auth}/${viewPaths.auth.forgotPassword}`
			};
			case "signUp": return {
				label: localization.auth.signUp,
				to: `${basePaths.auth}/${viewPaths.auth.signUp}`
			};
			case "verifyEmail": return {
				label: localization.auth.verifyEmail,
				to: `${basePaths.auth}/${viewPaths.auth.verifyEmail}`
			};
			default: return {
				label: localization.auth.signIn,
				to: `${basePaths.auth}/${viewPaths.auth.signIn}`
			};
		}
	})();
	const Icon = result.intent === "success" ? CircleCheck : result.intent === "warning" ? TriangleAlert : CircleX;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: cn("w-full max-w-sm", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
			className: "justify-items-center text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					"aria-hidden": "true",
					className: cn("mb-1 size-10", result.intent === "success" ? "text-primary" : result.intent === "warning" ? "text-amber-600 dark:text-amber-400" : "text-destructive")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-xl",
					children: message.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: message.description })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, {
			className: "w-full",
			onClick: () => navigate({ to: action.to }),
			children: action.label
		}) })]
	});
}
function AuthCallback(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthResultView, {
		...props,
		fallbackIntent: "success"
	});
}
function AuthError(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthResultView, {
		...props,
		fallbackIntent: "danger"
	});
}
/** `sessionStorage` key the forgot-password form stores the submitted email under. */
var RESET_LINK_SENT_STORAGE_KEY = "better-auth-ui.reset-link-sent";
/**
* Render a card confirming that a password-reset email was sent, with a
* button to open the user's email provider.
*
* The target email is read from `sessionStorage` (set when the forgot-password
* form redirects here); the OpenEmail button is only shown when an email is
* stored and resolves to a known provider.
*
* @param className - Additional CSS classes applied to the card
* @returns The reset-link-sent card React element
*/
function ResetLinkSent({ className }) {
	const { basePaths, localization, redirectTo, viewPaths, Link } = D();
	const isHydrated = useIsHydrated();
	const [email, setEmail] = (0, import_react.useState)(isHydrated && sessionStorage.getItem("better-auth-ui.reset-link-sent") || "");
	(0, import_react.useEffect)(() => {
		setEmail(sessionStorage.getItem("better-auth-ui.reset-link-sent") ?? "");
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: cn("w-full max-w-sm", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
			className: "text-xl font-semibold",
			children: localization.auth.checkYourEmailTitle
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldDescription, { children: email ? localization.auth.resetLinkSentTo.replace("{{email}}", email) : localization.auth.passwordResetEmailSent }), email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenEmailButton, { email })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-3 items-center w-full mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldDescription, {
				className: "text-center",
				children: [
					localization.auth.rememberYourPassword,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						href: De(`${basePaths.auth}/${viewPaths.auth.signIn}`, redirectTo),
						className: "underline underline-offset-4",
						children: localization.auth.signIn
					})
				]
			})
		})] })]
	});
}
/**
* Render a card-based "Forgot Password" form that sends a password-reset email.
*
* The form displays an email input, submit button, and a link back to sign-in.
* After a successful request the submitted email is stored in `sessionStorage`
* and the user is redirected to the reset-link-sent view, which offers to open
* their email provider.
*
* @param className - Optional additional CSS class names applied to the card
* @returns The forgot-password form UI as a JSX element
*/
function ForgotPassword({ className }) {
	const { authClient, baseURL, basePaths, localization, navigate, plugins, viewPaths, Link } = D();
	const { fetchOptions, resetFetchOptions } = S();
	const { mutateAsync: requestPasswordReset, isPending } = ze(authClient, {
		onError: () => {
			resetFetchOptions();
		},
		onSuccess: (_data, { email }) => {
			sessionStorage.setItem(RESET_LINK_SENT_STORAGE_KEY, email);
			navigate({ to: `${basePaths.auth}/${viewPaths.auth.resetLinkSent}` });
		}
	});
	const form = useAuthForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => await requestPasswordReset({
			email: value.email,
			redirectTo: Ee(baseURL, basePaths.auth, viewPaths.auth.resetPassword),
			fetchOptions
		})
	});
	const Captcha = plugins.find((plugin) => plugin.captchaComponent)?.captchaComponent;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: cn("w-full max-w-sm", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
			className: "text-xl font-semibold",
			children: localization.auth.forgotPassword
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppForm, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormRoot, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldGroup, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
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
								placeholder: localization.auth.emailPlaceholder,
								required: true,
								disabled: isPending,
								value: field.state.value,
								onBlur: field.handleBlur,
								onChange: (event) => field.handleChange(event.target.value),
								"aria-invalid": isInvalid
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormFieldError, {})
						]
					});
				}
			}),
			Captcha && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center",
				children: Captcha
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormSubmitButton, {
					isPending,
					disabled: isPending,
					children: localization.auth.sendResetLink
				})
			})
		] }) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-3 items-center w-full mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldDescription, {
				className: "text-center",
				children: [
					localization.auth.rememberYourPassword,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						href: `${basePaths.auth}/${viewPaths.auth.signIn}`,
						className: "underline underline-offset-4",
						children: localization.auth.signIn
					})
				]
			})
		})] })]
	});
}
/** Fixed segment identities, so the bars keep their own React keys. */
var STRENGTH_SEGMENTS = [
	1,
	2,
	3,
	4
];
var segmentColors = {
	weak: "bg-destructive",
	fair: "bg-amber-500",
	good: "bg-sky-500",
	strong: "bg-emerald-500"
};
/**
* Four-segment strength hint shown while someone picks a new password.
*
* Renders nothing when `emailAndPassword.strengthMeter` is off or the field is
* empty. The score never gates submission: your server rules stay the
* authority on what is acceptable.
*/
function PasswordStrengthMeter({ password, className }) {
	const { emailAndPassword, localization } = D();
	if (!emailAndPassword?.strengthMeter) return null;
	const { score, level } = Qe(password, { minLength: emailAndPassword.minPasswordLength });
	if (level === "empty") return null;
	const levelLabels = {
		weak: localization.auth.passwordWeak,
		fair: localization.auth.passwordFair,
		good: localization.auth.passwordGood,
		strong: localization.auth.passwordStrong
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col gap-1.5", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"aria-hidden": "true",
			className: "flex gap-1",
			children: STRENGTH_SEGMENTS.map((segment) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("h-1 flex-1 rounded-full bg-muted transition-colors", segment <= score && segmentColors[level]) }, segment))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			"aria-live": "polite",
			className: "text-muted-foreground text-xs",
			children: [
				localization.auth.passwordStrength,
				":",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium text-foreground",
					children: levelLabels[level]
				})
			]
		})]
	});
}
/**
* Render a password reset form that validates the reset token from the URL, accepts a new password (and optional confirmation), and submits it to the auth client.
*
* The component checks for a `token` query parameter on mount and, if missing, shows an error toast and navigates to the sign-in page. It exposes per-field validation messages, toggles for password visibility, and disables inputs while the reset request is pending.
*
* @returns The password reset form UI ready to be mounted in the app layout.
*/
function ResetPassword({ className }) {
	const { authClient, basePaths, emailAndPassword, localization, navigate, redirectTo, viewPaths, Link } = D();
	const signInURL = De(`${basePaths.auth}/${viewPaths.auth.signIn}`, redirectTo);
	const { mutateAsync: resetPassword, isPending } = Be(authClient, {
		onError: (error) => {
			if (Ye(error)) setIsCompromised(true);
		},
		onSuccess: () => {
			toast.success(localization.auth.passwordResetSuccess);
			navigate({ to: signInURL });
		}
	});
	const [isPasswordVisible, setIsPasswordVisible] = (0, import_react.useState)(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = (0, import_react.useState)(false);
	const [isCompromised, setIsCompromised] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!new URLSearchParams(window.location.search).get("token")) {
			toast.error(localization.auth.invalidResetPasswordToken);
			navigate({ to: signInURL });
		}
	}, [
		localization.auth.invalidResetPasswordToken,
		navigate,
		signInURL
	]);
	const form = useAuthForm({
		defaultValues: {
			confirmPassword: "",
			password: ""
		},
		onSubmit: async ({ value }) => {
			const token = new URLSearchParams(window.location.search).get("token");
			if (!token) {
				toast.error(localization.auth.invalidResetPasswordToken);
				navigate({ to: signInURL });
				return;
			}
			try {
				await resetPassword({
					token,
					newPassword: value.password
				});
			} catch {}
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: cn("w-full max-w-sm", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
			className: "text-xl font-semibold",
			children: localization.auth.resetPassword
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppForm, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormRoot, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldGroup, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
				name: "password",
				validators: { onChange: ({ value }) => We(value, {
					maxLength: emailAndPassword?.maxPasswordLength,
					maxLengthMessage: localization.auth.tooLong.replace("{{max}}", String(emailAndPassword?.maxPasswordLength)),
					minLength: emailAndPassword?.minPasswordLength,
					minLengthMessage: localization.auth.tooShort.replace("{{min}}", String(emailAndPassword?.minPasswordLength)),
					requiredMessage: localization.auth.fieldRequired
				}) },
				children: (field) => {
					const isInvalid = isAuthFormFieldInvalid(field.state.meta) || isCompromised;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						"data-invalid": isInvalid,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
								htmlFor: "password",
								children: localization.auth.password
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputGroup, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupInput, {
								id: "password",
								type: isPasswordVisible ? "text" : "password",
								autoComplete: "new-password",
								placeholder: localization.auth.newPasswordPlaceholder,
								required: true,
								minLength: emailAndPassword?.minPasswordLength,
								maxLength: emailAndPassword?.maxPasswordLength,
								disabled: isPending,
								name: field.name,
								onBlur: field.handleBlur,
								onChange: (e) => {
									field.handleChange(e.target.value);
									setIsCompromised(false);
								},
								"aria-invalid": isInvalid,
								value: field.state.value
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupAddon, {
								align: "inline-end",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupButton, {
									size: "icon-xs",
									"aria-label": isPasswordVisible ? localization.auth.hidePassword : localization.auth.showPassword,
									title: isPasswordVisible ? localization.auth.hidePassword : localization.auth.showPassword,
									onClick: () => {
										setIsPasswordVisible((visible) => !visible);
									},
									children: isPasswordVisible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {})
								})
							})] }),
							isCompromised ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { children: localization.auth.passwordCompromised }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormFieldError, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordStrengthMeter, { password: field.state.value })
						]
					});
				}
			}),
			emailAndPassword?.confirmPassword && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
				name: "confirmPassword",
				validators: {
					onChangeListenTo: ["password"],
					onChange: ({ fieldApi, value }) => We(value, {
						maxLength: emailAndPassword?.maxPasswordLength,
						maxLengthMessage: localization.auth.tooLong.replace("{{max}}", String(emailAndPassword?.maxPasswordLength)),
						minLength: emailAndPassword?.minPasswordLength,
						minLengthMessage: localization.auth.tooShort.replace("{{min}}", String(emailAndPassword?.minPasswordLength)),
						requiredMessage: localization.auth.fieldRequired
					}) ?? Ke(value, fieldApi.form.getFieldValue("password"), localization.auth.passwordsDoNotMatch)
				},
				children: (field) => {
					const isInvalid = isAuthFormFieldInvalid(field.state.meta);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						"data-invalid": isInvalid,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
								htmlFor: "confirmPassword",
								children: localization.auth.confirmPassword
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputGroup, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupInput, {
								id: "confirmPassword",
								name: field.name,
								type: isConfirmPasswordVisible ? "text" : "password",
								autoComplete: "new-password",
								placeholder: localization.auth.confirmPasswordPlaceholder,
								required: true,
								minLength: emailAndPassword?.minPasswordLength,
								maxLength: emailAndPassword?.maxPasswordLength,
								disabled: isPending,
								onBlur: field.handleBlur,
								onChange: (event) => field.handleChange(event.target.value),
								"aria-invalid": isInvalid,
								value: field.state.value
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupAddon, {
								align: "inline-end",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupButton, {
									size: "icon-xs",
									"aria-label": isConfirmPasswordVisible ? localization.auth.hidePassword : localization.auth.showPassword,
									title: isConfirmPasswordVisible ? localization.auth.hidePassword : localization.auth.showPassword,
									onClick: () => {
										setIsConfirmPasswordVisible((visible) => !visible);
									},
									children: isConfirmPasswordVisible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {})
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormFieldError, {})
						]
					});
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormSubmitButton, {
					disabled: isPending,
					children: localization.auth.resetPassword
				})
			})
		] }) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-3 items-center w-full mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldDescription, {
				className: "text-center",
				children: [
					localization.auth.rememberYourPassword,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						href: De(`${basePaths.auth}/${viewPaths.auth.signIn}`, redirectTo),
						className: "underline underline-offset-4",
						children: localization.auth.signIn
					})
				]
			})
		})] })]
	});
}
/**
* Render the sign-in form UI with email/password, magic link, and social provider options.
*
* @param className - Optional additional container class names
* @param socialLayout - Layout style for social provider buttons
* @param socialPosition - Position of social provider buttons; `"top"` or `"bottom"`. Defaults to `"bottom"`.
* @returns The rendered sign-in UI as a JSX element
*/
function SignIn({ className, socialLayout, socialPosition = "bottom" }) {
	const { basePaths, emailAndPassword, localization, navigate, plugins, redirectTo, socialProviders, viewPaths, Link } = D();
	const continueSignIn = useSignInContinuation();
	const isPending = useIsMutating({ mutationKey: e.signIn.all }) + useIsMutating({ mutationKey: e.signUp.all }) > 0;
	const Captcha = plugins.find((plugin) => plugin.captchaComponent)?.captchaComponent;
	const [isPasswordVisible, setIsPasswordVisible] = (0, import_react.useState)(false);
	const form = useAuthForm({
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false
		},
		onSubmit: async ({ value }) => {
			const { data, error } = await authClient.signIn.email({
				email: value.email.trim(),
				password: value.password,
				...emailAndPassword?.rememberMe ? { rememberMe: value.rememberMe } : {}
			});
			if (error) {
				form.setFieldValue("password", "");
				if (error.code === "EMAIL_NOT_VERIFIED") {
					sessionStorage.setItem("better-auth-ui.verify-email", value.email.trim());
					navigate({ to: De(`${basePaths.auth}/${viewPaths.auth.verifyEmail}`, redirectTo) });
					return;
				}
				throw error;
			}
			continueSignIn(data);
		}
	});
	const showSeparator = emailAndPassword?.enabled && socialProviders && socialProviders.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: cn("w-full max-w-sm", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Te$1, { view: "signIn" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReauthenticationNotice, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-xl font-semibold",
				children: localization.auth.signIn
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-6",
				children: [
					socialPosition === "top" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [socialProviders && socialProviders.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderButtons, {
						socialLayout,
						view: "signIn"
					}), showSeparator && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSeparator, {
						className: "*:data-[slot=field-separator-content]:bg-card m-0 text-xs flex items-center",
						children: localization.auth.or
					})] }),
					emailAndPassword?.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppForm, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormRoot, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldGroup, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
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
											autoCapitalize: "none",
											autoComplete: "email",
											spellCheck: false,
											placeholder: localization.auth.emailPlaceholder,
											required: true,
											disabled: isPending,
											value: field.state.value,
											onBlur: field.handleBlur,
											onChange: (event) => field.handleChange(event.target.value),
											"aria-invalid": isInvalid
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormFieldError, {})
									]
								});
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
							name: "password",
							validators: { onChange: ({ value }) => We(value, {
								maxLength: emailAndPassword?.maxPasswordLength,
								maxLengthMessage: localization.auth.tooLong.replace("{{max}}", String(emailAndPassword?.maxPasswordLength)),
								minLength: emailAndPassword?.minPasswordLength,
								minLengthMessage: localization.auth.tooShort.replace("{{min}}", String(emailAndPassword?.minPasswordLength)),
								requiredMessage: localization.auth.fieldRequired
							}) },
							children: (field) => {
								const isInvalid = isAuthFormFieldInvalid(field.state.meta);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
									"data-invalid": isInvalid,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
											htmlFor: "password",
											children: localization.auth.password
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputGroup, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupInput, {
											id: "password",
											name: field.name,
											type: isPasswordVisible ? "text" : "password",
											autoComplete: "current-password",
											value: field.state.value,
											onBlur: field.handleBlur,
											onChange: (event) => field.handleChange(event.target.value),
											placeholder: localization.auth.passwordPlaceholder,
											required: true,
											minLength: emailAndPassword?.minPasswordLength,
											maxLength: emailAndPassword?.maxPasswordLength,
											disabled: isPending,
											"aria-invalid": isInvalid
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupAddon, {
											align: "inline-end",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupButton, {
												size: "icon-xs",
												"aria-label": isPasswordVisible ? localization.auth.hidePassword : localization.auth.showPassword,
												title: isPasswordVisible ? localization.auth.hidePassword : localization.auth.showPassword,
												onClick: () => {
													setIsPasswordVisible((visible) => !visible);
												},
												children: isPasswordVisible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {})
											})
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormFieldError, {})
									]
								});
							}
						}),
						emailAndPassword.rememberMe && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
							name: "rememberMe",
							children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								className: "my-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
										id: "rememberMe",
										name: field.name,
										checked: field.state.value,
										disabled: isPending,
										onCheckedChange: (checked) => field.handleChange(checked === true)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
										htmlFor: "rememberMe",
										className: "cursor-pointer text-sm font-normal",
										children: localization.auth.rememberMe
									})]
								})
							})
						}),
						Captcha && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-center",
							children: Captcha
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(form.AuthFormSubmitButton, {
								className: "relative overflow-visible",
								disabled: isPending,
								children: [localization.auth.signIn, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LastUsedBadge, {
									method: "email",
									floating: true
								})]
							}), plugins.flatMap((plugin) => (plugin.authButtons ?? []).map((AuthButton, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthButton, { view: "signIn" }, `${plugin.id}-${index.toString()}`)))]
						})
					] }) }) }),
					socialPosition === "bottom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [showSeparator && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSeparator, {
						className: "*:data-[slot=field-separator-content]:bg-card text-xs flex items-center",
						children: localization.auth.or
					}), socialProviders && socialProviders.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderButtons, {
						socialLayout,
						view: "signIn"
					})] })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 items-center w-full mt-4",
				children: [emailAndPassword?.enabled && emailAndPassword?.forgotPassword && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					href: `${basePaths.auth}/${viewPaths.auth.forgotPassword}`,
					className: "self-center text-sm underline-offset-4 hover:underline",
					children: localization.auth.forgotPasswordLink
				}), emailAndPassword?.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldDescription, {
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
				})]
			})] })
		]
	});
}
/**
* Signs the current user out on mount and renders a centered spinner while the operation completes.
*
* @param className - Optional additional class names appended to the root element
* @returns The spinner shown during sign-out
*/
function SignOut({ className }) {
	const { authClient, basePaths, navigate, viewPaths } = D();
	const { mutate: signOut } = Je(authClient, {
		onError: () => {
			navigate({
				to: `${basePaths.auth}/${viewPaths.auth.signIn}`,
				replace: true
			});
		},
		onSuccess: () => navigate({
			to: `${basePaths.auth}/${viewPaths.auth.signIn}`,
			replace: true
		})
	});
	const hasSignedOut = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (hasSignedOut.current) return;
		hasSignedOut.current = true;
		signOut();
	}, [signOut]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { className: cn("mx-auto my-auto", className) });
}
/**
* Renders a sign-up form with name, email, and password fields, optional social provider buttons, and submission handling.
*
* Submits credentials to the configured auth client and handles the response:
* - If email verification is required, shows a notification and navigates to sign-in
* - On success, refreshes the session and navigates to the configured redirect path
* - On failure, displays error toasts
* - Manages a pending state while the request is in-flight
*
* @param className - Additional CSS classes applied to the outer container
* @param socialLayout - Social layout to apply to the component
* @param socialPosition - Social position to apply to the component
* @param onSignUpSuccess - Replaces the post-sign-up redirect when the new account is immediately usable
* @returns The sign-up form React element.
*/
function SignUp({ className, socialLayout, socialPosition = "bottom", onSignUpSuccess }) {
	const { additionalFields, authClient, basePaths, baseURL, emailAndPassword, localization, plugins, redirectTo, socialProviders, viewPaths, navigate, Link } = D();
	const { fetchOptions, resetFetchOptions } = S();
	const { mutateAsync: signUpEmail } = Ye$1(authClient, {
		onError: (error) => {
			if (Ye(error)) setIsCompromised(true);
			form.setFieldValue("password", "");
			form.setFieldValue("confirmPassword", "");
			resetFetchOptions();
		},
		onSuccess: (_data, { email }) => {
			if (emailAndPassword?.requireEmailVerification) {
				sessionStorage.setItem("better-auth-ui.verify-email", email);
				navigate({ to: De(`${basePaths.auth}/${viewPaths.auth.verifyEmail}`, redirectTo) });
			} else if (onSignUpSuccess) onSignUpSuccess();
			else navigate({ to: redirectTo });
		}
	});
	const isPending = useIsMutating({ mutationKey: e.signIn.all }) + useIsMutating({ mutationKey: e.signUp.all }) > 0;
	const Captcha = plugins.find((plugin) => plugin.captchaComponent)?.captchaComponent;
	const [isPasswordVisible, setIsPasswordVisible] = (0, import_react.useState)(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = (0, import_react.useState)(false);
	const [isCompromised, setIsCompromised] = (0, import_react.useState)(false);
	const signUpFields = (0, import_react.useMemo)(() => additionalFields?.filter((field) => field.signUp) ?? [], [additionalFields]);
	const form = useAuthForm({
		defaultValues: {
			additionalFields: pe(signUpFields),
			confirmPassword: "",
			email: "",
			name: "",
			password: ""
		},
		onSubmit: async ({ value }) => {
			try {
				await signUpEmail({
					name: emailAndPassword?.name === false ? "" : value.name,
					email: value.email.trim(),
					password: value.password,
					...me(signUpFields, value.additionalFields),
					callbackURL: Te(baseURL, redirectTo),
					fetchOptions
				});
			} catch {}
		}
	});
	const showSeparator = emailAndPassword?.enabled && socialProviders && socialProviders.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: cn("w-full max-w-sm", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Te$1, { view: "signUp" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-xl font-semibold",
				children: localization.auth.signUp
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-6",
				children: [
					socialPosition === "top" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [socialProviders && socialProviders.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderButtons, {
						socialLayout,
						view: "signUp"
					}), showSeparator && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSeparator, {
						className: "*:data-[slot=field-separator-content]:bg-card text-xs flex items-center",
						children: localization.auth.or
					})] }),
					emailAndPassword?.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppForm, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormRoot, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldGroup, { children: [
						emailAndPassword.name !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
							name: "name",
							validators: { onChange: ({ value }) => We(value, {
								requiredMessage: localization.auth.fieldRequired,
								trim: true
							}) },
							children: (field) => {
								const isInvalid = isAuthFormFieldInvalid(field.state.meta);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
									"data-invalid": isInvalid,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
											htmlFor: "name",
											children: localization.auth.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
											id: "name",
											name: field.name,
											type: "text",
											autoComplete: "name",
											placeholder: localization.auth.namePlaceholder,
											required: true,
											disabled: isPending,
											value: field.state.value,
											onBlur: field.handleBlur,
											onChange: (event) => field.handleChange(event.target.value),
											"aria-invalid": isInvalid
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormFieldError, {})
									]
								});
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
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
											placeholder: localization.auth.emailPlaceholder,
											required: true,
											disabled: isPending,
											value: field.state.value,
											onBlur: field.handleBlur,
											onChange: (event) => field.handleChange(event.target.value),
											"aria-invalid": isInvalid
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormFieldError, {})
									]
								});
							}
						}),
						signUpFields.map((configuredField) => configuredField.signUp === "above" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
							name: `additionalFields.${configuredField.name}`,
							validators: getAuthAdditionalFieldValidators(configuredField, localization.auth.fieldRequired),
							children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormAdditionalField, {
								field: configuredField,
								isPending,
								optionalLabel: localization.auth.optional
							})
						}, configuredField.name)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
							name: "password",
							validators: { onChange: ({ value }) => We(value, {
								maxLength: emailAndPassword?.maxPasswordLength,
								maxLengthMessage: localization.auth.tooLong.replace("{{max}}", String(emailAndPassword?.maxPasswordLength)),
								minLength: emailAndPassword?.minPasswordLength,
								minLengthMessage: localization.auth.tooShort.replace("{{min}}", String(emailAndPassword?.minPasswordLength)),
								requiredMessage: localization.auth.fieldRequired
							}) },
							children: (field) => {
								const isInvalid = isAuthFormFieldInvalid(field.state.meta) || isCompromised;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
									"data-invalid": isInvalid,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
											htmlFor: "password",
											children: localization.auth.password
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputGroup, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupInput, {
											id: "password",
											name: field.name,
											type: isPasswordVisible ? "text" : "password",
											autoComplete: "new-password",
											value: field.state.value,
											onBlur: field.handleBlur,
											onChange: (e) => {
												field.handleChange(e.target.value);
												setIsCompromised(false);
											},
											placeholder: localization.auth.passwordPlaceholder,
											required: true,
											minLength: emailAndPassword?.minPasswordLength,
											maxLength: emailAndPassword?.maxPasswordLength,
											disabled: isPending,
											"aria-invalid": isInvalid
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupAddon, {
											align: "inline-end",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupButton, {
												size: "icon-xs",
												"aria-label": isPasswordVisible ? localization.auth.hidePassword : localization.auth.showPassword,
												title: isPasswordVisible ? localization.auth.hidePassword : localization.auth.showPassword,
												onClick: () => {
													setIsPasswordVisible((visible) => !visible);
												},
												children: isPasswordVisible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {})
											})
										})] }),
										isCompromised ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { children: localization.auth.passwordCompromised }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormFieldError, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordStrengthMeter, { password: field.state.value })
									]
								});
							}
						}),
						emailAndPassword?.confirmPassword && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
							name: "confirmPassword",
							validators: {
								onChangeListenTo: ["password"],
								onChange: ({ fieldApi, value }) => We(value, {
									maxLength: emailAndPassword?.maxPasswordLength,
									maxLengthMessage: localization.auth.tooLong.replace("{{max}}", String(emailAndPassword?.maxPasswordLength)),
									minLength: emailAndPassword?.minPasswordLength,
									minLengthMessage: localization.auth.tooShort.replace("{{min}}", String(emailAndPassword?.minPasswordLength)),
									requiredMessage: localization.auth.fieldRequired
								}) ?? Ke(value, fieldApi.form.getFieldValue("password"), localization.auth.passwordsDoNotMatch)
							},
							children: (field) => {
								const isInvalid = isAuthFormFieldInvalid(field.state.meta);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
									"data-invalid": isInvalid,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
											htmlFor: "confirmPassword",
											children: localization.auth.confirmPassword
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputGroup, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupInput, {
											id: "confirmPassword",
											name: field.name,
											type: isConfirmPasswordVisible ? "text" : "password",
											autoComplete: "new-password",
											value: field.state.value,
											onBlur: field.handleBlur,
											onChange: (e) => field.handleChange(e.target.value),
											placeholder: localization.auth.confirmPasswordPlaceholder,
											required: true,
											minLength: emailAndPassword?.minPasswordLength,
											maxLength: emailAndPassword?.maxPasswordLength,
											disabled: isPending,
											"aria-invalid": isInvalid
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupAddon, {
											align: "inline-end",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputGroupButton, {
												size: "icon-xs",
												"aria-label": isConfirmPasswordVisible ? localization.auth.hidePassword : localization.auth.showPassword,
												title: isConfirmPasswordVisible ? localization.auth.hidePassword : localization.auth.showPassword,
												onClick: () => setIsConfirmPasswordVisible((visible) => !visible),
												children: isConfirmPasswordVisible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {})
											})
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormFieldError, {})
									]
								});
							}
						}),
						signUpFields.map((configuredField) => configuredField.signUp !== "above" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, {
							name: `additionalFields.${configuredField.name}`,
							validators: getAuthAdditionalFieldValidators(configuredField, localization.auth.fieldRequired),
							children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(field.AuthFormAdditionalField, {
								field: configuredField,
								isPending,
								optionalLabel: localization.auth.optional
							})
						}, configuredField.name)),
						Captcha && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-center",
							children: Captcha
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AuthFormSubmitButton, {
								disabled: isPending,
								children: localization.auth.signUp
							}), plugins.flatMap((plugin) => (plugin.authButtons ?? []).map((AuthButton, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthButton, { view: "signUp" }, `${plugin.id}-${index.toString()}`)))]
						})
					] }) }) }),
					socialPosition === "bottom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [showSeparator && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSeparator, {
						className: "*:data-[slot=field-separator-content]:bg-card text-xs flex items-center",
						children: localization.auth.or
					}), socialProviders && socialProviders.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderButtons, {
						socialLayout,
						view: "signUp"
					})] })
				]
			}), emailAndPassword?.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-3 items-center w-full mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldDescription, {
					className: "text-center",
					children: [
						localization.auth.alreadyHaveAnAccount,
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: De(`${basePaths.auth}/${viewPaths.auth.signIn}`, redirectTo),
							className: "underline underline-offset-4",
							children: localization.auth.signIn
						})
					]
				})
			})] })
		]
	});
}
/** Seconds the resend button stays disabled to prevent spamming the endpoint. */
var RESEND_COOLDOWN_SECONDS = 60;
/**
* Render a card prompting the user to verify their email, with a resend button
* that is rate-limited by a cooldown timer.
*
* The target email is read from `sessionStorage` (set when sign-up or sign-in
* redirects here); the OpenEmail/Resend controls are only shown when an email
* is stored. The resend button is disabled while a cooldown is active and shows
* the remaining seconds.
*
* @param className - Additional CSS classes applied to the card
* @returns The verify-email card React element
*/
function VerifyEmail({ className }) {
	const { authClient, basePaths, baseURL, localization, redirectTo, viewPaths, Link } = D();
	const isHydrated = useIsHydrated();
	const [email, setEmail] = (0, import_react.useState)(isHydrated && sessionStorage.getItem("better-auth-ui.verify-email") || "");
	const [cooldown, setCooldown] = (0, import_react.useState)(RESEND_COOLDOWN_SECONDS);
	(0, import_react.useEffect)(() => {
		setEmail(sessionStorage.getItem("better-auth-ui.verify-email") ?? "");
	}, []);
	(0, import_react.useEffect)(() => {
		if (cooldown <= 0 || !email) return;
		const interval = setInterval(() => {
			setCooldown((current) => current > 0 ? current - 1 : 0);
		}, 1e3);
		return () => clearInterval(interval);
	}, [cooldown, email]);
	const { mutate: sendVerificationEmail, isPending } = We$1(authClient, { onSuccess: () => {
		toast.success(localization.auth.verificationEmailSent);
		setCooldown(RESEND_COOLDOWN_SECONDS);
	} });
	const isCoolingDown = cooldown > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: cn("w-full max-w-sm", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
			className: "text-xl font-semibold",
			children: localization.auth.verifyEmail
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldDescription, { children: localization.auth.checkYourEmail }), email && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenEmailButton, { email }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button$1, {
					type: "button",
					variant: "outline",
					disabled: !email || isCoolingDown || isPending,
					onClick: () => sendVerificationEmail({
						email,
						callbackURL: `${baseURL}${redirectTo}`
					}),
					children: [isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, {}), isCoolingDown ? localization.auth.resendIn.replace("{{seconds}}", String(cooldown)) : localization.auth.resend]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-3 items-center w-full mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldDescription, {
				className: "text-center",
				children: [
					localization.auth.alreadyVerifiedYourEmail,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						href: `${basePaths.auth}/${viewPaths.auth.signIn}`,
						className: "underline underline-offset-4",
						children: localization.auth.signIn
					})
				]
			})
		})] })]
	});
}
/**
* Built-in views that only make sense when email + password auth is enabled.
* When it's disabled, the `<Auth>` router redirects these to `signIn` so a
* plugin's `fallbackViews.auth.signIn` (e.g. magic link) takes over.
*/
var PASSWORD_ONLY_VIEWS = [
	"signUp",
	"forgotPassword",
	"resetPassword",
	"resetLinkSent"
];
var AUTH_VIEWS = {
	callback: AuthCallback,
	error: AuthError,
	redirect: AuthRedirect,
	signIn: SignIn,
	signOut: SignOut,
	signUp: SignUp,
	forgotPassword: ForgotPassword,
	resetPassword: ResetPassword,
	resetLinkSent: ResetLinkSent,
	verifyEmail: VerifyEmail
};
/**
* Render the appropriate authentication view based on the provided `view` or `path`.
*
* Resolution order:
*   1. Plugin overrides (`plugin.views.auth[currentView]`) — first registered wins.
*   2. Plugin fallbacks (`plugin.fallbackViews.auth.signIn`) when password auth is off.
*   3. Built-in views.
*
* @param path - Route path used to resolve an auth view when `view` is not provided
* @param socialLayout - Social layout to apply to sign-in/sign-up/magic-link views
* @param socialPosition - Position for social buttons (`"top"` or `"bottom"`)
* @param view - Explicit auth view to render (e.g., `"signIn"`, `"signUp"`)
* @returns The React element for the resolved authentication view
*/
function Auth({ className, path, socialLayout, socialPosition, view }) {
	const { basePaths, emailAndPassword, plugins, viewPaths, navigate } = D();
	if (!view && !path) throw new Error("[Better Auth UI] Either `view` or `path` must be provided");
	const authView = view || Object.keys(viewPaths.auth).find((key) => viewPaths.auth[key] === path);
	const shouldRedirectToSignIn = !emailAndPassword?.enabled && authView && PASSWORD_ONLY_VIEWS.includes(authView);
	(0, import_react.useEffect)(() => {
		if (shouldRedirectToSignIn) navigate({
			to: `${basePaths.auth}/${viewPaths.auth.signIn}`,
			replace: true
		});
	}, [
		shouldRedirectToSignIn,
		navigate,
		basePaths.auth,
		viewPaths.auth.signIn
	]);
	if (shouldRedirectToSignIn) return null;
	for (const plugin of plugins) {
		const pluginAuthPaths = plugin.viewPaths?.auth;
		const pluginView = view ?? authView ?? (pluginAuthPaths && Object.keys(pluginAuthPaths).find((key) => pluginAuthPaths[key] === path));
		if (!pluginView) continue;
		const PluginView = plugin.views?.auth?.[pluginView];
		if (!PluginView) continue;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PluginView, {
			className,
			socialLayout,
			socialPosition
		});
	}
	if (authView === "signIn" && !emailAndPassword?.enabled) {
		const Fallback = plugins.find((plugin) => plugin.fallbackViews?.auth?.signIn)?.fallbackViews?.auth?.signIn;
		if (Fallback) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fallback, {
			className,
			socialLayout,
			socialPosition
		});
	}
	const AuthView = authView ? AUTH_VIEWS[authView] : void 0;
	if (!AuthView) throw new Error(`[Better Auth UI] Unknown view "${authView}". Valid views are: ${Object.keys(AUTH_VIEWS).join(", ")}`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthView, {
		className,
		socialLayout,
		socialPosition
	});
}
function AuthPage() {
	const { path } = Route$1.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "auth-page min-h-svh px-4 py-6 sm:px-6 sm:py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "auth-shell mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/74 lg:grid-cols-[1.05fr_0.95fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "auth-story relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "auth-orb auth-orb-one" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "auth-orb auth-orb-two" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "size-11 overflow-hidden rounded-2xl border border-white/35 shadow-lg shadow-blue-950/15",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "/gatherory-icon.png",
								alt: "",
								className: "size-full object-cover"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-lg font-semibold tracking-tight text-white",
							children: "Gatherory"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 max-w-xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-sm font-medium text-blue-50 backdrop-blur-xl",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
									className: "size-4",
									"aria-hidden": "true"
								}), "One place for every gathering"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "max-w-lg text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white",
								children: "Bring the plan and the people together."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 max-w-lg text-base leading-7 text-blue-50/80",
								children: "Shape the main event, collect ideas, make decisions, and keep every collaborator moving in the same direction."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-8 grid gap-3 text-sm text-white/90",
								children: [
									"A shared planning space for every event",
									"Decisions, schedules, and guests in context",
									"Designed for planning together"
								].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid size-6 place-items-center rounded-full bg-white/15",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
											className: "size-3.5",
											"aria-hidden": "true"
										})
									}), item]
								}, item))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "relative z-10 text-xs text-blue-100/65",
						children: "Gatherory keeps the story of an event connected from first idea to final memory."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-8 flex flex-col items-center gap-3 text-center lg:items-start lg:text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "size-12 overflow-hidden rounded-2xl shadow-lg lg:hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/gatherory-icon.png",
									alt: "",
									className: "size-full object-cover"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xl font-semibold tracking-tight text-foreground lg:hidden",
								children: "Gatherory"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm leading-6 text-muted-foreground",
								children: "Sign in to continue planning, or create a new account."
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Auth, {
							path,
							className: "auth-card max-w-none",
							socialPosition: "bottom",
							socialLayout: "grid"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mx-auto mt-6 max-w-sm text-center text-xs leading-5 text-muted-foreground",
							children: "By continuing, you agree to Gatherory's Terms and acknowledge the Privacy Policy."
						})
					]
				})
			})]
		})
	});
}
//#endregion
export { AuthPage as component };
