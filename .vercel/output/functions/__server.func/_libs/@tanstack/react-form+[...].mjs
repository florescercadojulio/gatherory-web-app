import { o as __toESM } from "../../_runtime.mjs";
import { bt as require_react, vt as require_with_selector, yt as require_jsx_runtime } from "../@base-ui/react+[...].mjs";
import { a as FormApi, i as FieldApi, n as FieldGroupApi, o as functionalUpdate, r as FormGroupApi, s as uuid, t as mergeAndUpdate } from "./form-core+[...].mjs";
//#region node_modules/.pnpm/@tanstack+react-store@0.11.2_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@tanstack/react-store/dist/useSelector.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_with_selector = require_with_selector();
function defaultCompare(a, b) {
	return a === b;
}
/**
* Selects a slice of state from an atom or store and subscribes the component
* to that selection.
*
* This is the primary React read hook for TanStack Store. It works with any
* source that exposes `get()` and `subscribe()`, including atoms, readonly
* atoms, stores, and readonly stores.
*
* Omit the selector to subscribe to the whole value.
*
* @example
* ```tsx
* const count = useSelector(counterStore, (state) => state.count)
* ```
*
* @example
* ```tsx
* const value = useSelector(countAtom)
* ```
*/
function useSelector(source, selector = (s) => s, options) {
	const compare = options?.compare ?? defaultCompare;
	const subscribe = (0, import_react.useCallback)((handleStoreChange) => {
		const { unsubscribe } = source.subscribe(handleStoreChange);
		return unsubscribe;
	}, [source]);
	const getSnapshot = (0, import_react.useCallback)(() => source.get(), [source]);
	return (0, import_with_selector.useSyncExternalStoreWithSelector)(subscribe, getSnapshot, getSnapshot, selector, compare);
}
//#endregion
//#region node_modules/.pnpm/@tanstack+react-form@1.33.5_@tanstack+react-start@1.168.60_crossws@0.4.15_srvx@0.11.22__b424ce3c069596ef22ac747cd677e974/node_modules/@tanstack/react-form/dist/esm/useIsomorphicLayoutEffect.js
var import_jsx_runtime = require_jsx_runtime();
var useIsomorphicLayoutEffect = typeof window !== "undefined" ? import_react.useLayoutEffect : import_react.useEffect;
//#endregion
//#region node_modules/.pnpm/@tanstack+react-form@1.33.5_@tanstack+react-start@1.168.60_crossws@0.4.15_srvx@0.11.22__b424ce3c069596ef22ac747cd677e974/node_modules/@tanstack/react-form/dist/esm/useField.js
function useField(opts) {
	const [prevOptions, setPrevOptions] = (0, import_react.useState)(() => ({
		form: opts.form,
		name: opts.name
	}));
	const [fieldApiState, setFieldApi] = (0, import_react.useState)(() => {
		return new FieldApi({ ...opts });
	});
	let fieldApi = fieldApiState;
	if (prevOptions.form !== opts.form || prevOptions.name !== opts.name) {
		fieldApi = new FieldApi({ ...opts });
		setFieldApi(fieldApi);
		setPrevOptions({
			form: opts.form,
			name: opts.name
		});
	}
	const reactiveStateValue = useSelector(fieldApi.store, opts.mode === "array" ? (state) => state.meta._arrayVersion || 0 : (state) => state.value);
	const reactiveMetaIsTouched = useSelector(fieldApi.store, (state) => state.meta.isTouched);
	const reactiveMetaIsBlurred = useSelector(fieldApi.store, (state) => state.meta.isBlurred);
	const reactiveMetaIsDirty = useSelector(fieldApi.store, (state) => state.meta.isDirty);
	const reactiveMetaErrorMap = useSelector(fieldApi.store, (state) => state.meta.errorMap);
	const reactiveMetaErrorSourceMap = useSelector(fieldApi.store, (state) => state.meta.errorSourceMap);
	const reactiveMetaIsValidating = useSelector(fieldApi.store, (state) => state.meta.isValidating);
	const extendedFieldApi = (0, import_react.useMemo)(() => {
		return {
			...fieldApi,
			get state() {
				return {
					value: opts.mode === "array" ? fieldApi.state.value : reactiveStateValue,
					get meta() {
						return {
							...fieldApi.state.meta,
							isTouched: reactiveMetaIsTouched,
							isBlurred: reactiveMetaIsBlurred,
							isDirty: reactiveMetaIsDirty,
							errorMap: reactiveMetaErrorMap,
							errorSourceMap: reactiveMetaErrorSourceMap,
							isValidating: reactiveMetaIsValidating
						};
					}
				};
			}
		};
	}, [
		fieldApi,
		opts.mode,
		reactiveStateValue,
		reactiveMetaIsTouched,
		reactiveMetaIsBlurred,
		reactiveMetaIsDirty,
		reactiveMetaErrorMap,
		reactiveMetaErrorSourceMap,
		reactiveMetaIsValidating
	]);
	useIsomorphicLayoutEffect(fieldApi.mount, [fieldApi]);
	useIsomorphicLayoutEffect(() => {
		fieldApi.update(opts);
	});
	return extendedFieldApi;
}
var Field = (({ children, ...fieldOptions }) => {
	const fieldApi = useField(fieldOptions);
	const jsxToDisplay = (0, import_react.useMemo)(() => functionalUpdate(children, fieldApi), [children, fieldApi]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: jsxToDisplay });
});
//#endregion
//#region node_modules/.pnpm/@tanstack+react-form@1.33.5_@tanstack+react-start@1.168.60_crossws@0.4.15_srvx@0.11.22__b424ce3c069596ef22ac747cd677e974/node_modules/@tanstack/react-form/dist/esm/useUUID.js
function useUUID() {
	return (0, import_react.useState)(() => uuid())[0];
}
//#endregion
//#region node_modules/.pnpm/@tanstack+react-form@1.33.5_@tanstack+react-start@1.168.60_crossws@0.4.15_srvx@0.11.22__b424ce3c069596ef22ac747cd677e974/node_modules/@tanstack/react-form/dist/esm/useFormId.js
var _React = import_react;
var useFormId = "19.3.0".split(".")[0] === "17" ? useUUID : _React.useId;
//#endregion
//#region node_modules/.pnpm/@tanstack+react-form@1.33.5_@tanstack+react-start@1.168.60_crossws@0.4.15_srvx@0.11.22__b424ce3c069596ef22ac747cd677e974/node_modules/@tanstack/react-form/dist/esm/useFormGroup.js
function useFormGroup(opts) {
	const [prevOptions, setPrevOptions] = (0, import_react.useState)(() => ({
		form: opts.form,
		name: opts.name
	}));
	const [formGroupApi, setFormGroupApi] = (0, import_react.useState)(() => {
		return new FormGroupApi({ ...opts });
	});
	if (prevOptions.form !== opts.form || prevOptions.name !== opts.name) {
		setFormGroupApi(new FormGroupApi({ ...opts }));
		setPrevOptions({
			form: opts.form,
			name: opts.name
		});
	}
	const reactiveStateValue = useSelector(formGroupApi.store, (state) => state.value);
	const reactiveMetaIsTouched = useSelector(formGroupApi.store, (state) => state.meta.isTouched);
	const reactiveMetaIsBlurred = useSelector(formGroupApi.store, (state) => state.meta.isBlurred);
	const reactiveMetaIsDirty = useSelector(formGroupApi.store, (state) => state.meta.isDirty);
	const reactiveMetaErrorMap = useSelector(formGroupApi.store, (state) => state.meta.errorMap);
	const reactiveMetaErrorSourceMap = useSelector(formGroupApi.store, (state) => state.meta.errorSourceMap);
	const reactiveMetaIsValidating = useSelector(formGroupApi.store, (state) => state.meta.isValidating);
	const reactiveMetaIsSubmitting = useSelector(formGroupApi.store, (state) => state.meta.isSubmitting);
	const reactiveMetaIsSubmitted = useSelector(formGroupApi.store, (state) => state.meta.isSubmitted);
	const reactiveMetaSubmissionAttempts = useSelector(formGroupApi.store, (state) => state.meta.submissionAttempts);
	const reactiveMetaIsSubmitSuccessful = useSelector(formGroupApi.store, (state) => state.meta.isSubmitSuccessful);
	const reactiveMetaCanSubmit = useSelector(formGroupApi.store, (state) => state.meta.canSubmit);
	const reactiveMetaIsValid = useSelector(formGroupApi.store, (state) => state.meta.isValid);
	const reactiveMetaIsFieldsValid = useSelector(formGroupApi.store, (state) => state.meta.isFieldsValid);
	const reactiveMetaIsFieldsValidating = useSelector(formGroupApi.store, (state) => state.meta.isFieldsValidating);
	const reactiveMetaIsGroupValid = useSelector(formGroupApi.store, (state) => state.meta.isGroupValid);
	const extendedFieldApi = (0, import_react.useMemo)(() => {
		return {
			...formGroupApi,
			handleSubmit: ((...props) => {
				return formGroupApi._handleSubmit(...props);
			}),
			get state() {
				return {
					...formGroupApi.state,
					value: reactiveStateValue,
					get meta() {
						return {
							...formGroupApi.state.meta,
							isTouched: reactiveMetaIsTouched,
							isBlurred: reactiveMetaIsBlurred,
							isDirty: reactiveMetaIsDirty,
							errorMap: reactiveMetaErrorMap,
							errorSourceMap: reactiveMetaErrorSourceMap,
							isValidating: reactiveMetaIsValidating,
							isSubmitting: reactiveMetaIsSubmitting,
							isSubmitted: reactiveMetaIsSubmitted,
							submissionAttempts: reactiveMetaSubmissionAttempts,
							isSubmitSuccessful: reactiveMetaIsSubmitSuccessful,
							canSubmit: reactiveMetaCanSubmit,
							isValid: reactiveMetaIsValid,
							isFieldsValid: reactiveMetaIsFieldsValid,
							isFieldsValidating: reactiveMetaIsFieldsValidating,
							isGroupValid: reactiveMetaIsGroupValid
						};
					}
				};
			}
		};
	}, [
		formGroupApi,
		reactiveStateValue,
		reactiveMetaIsTouched,
		reactiveMetaIsBlurred,
		reactiveMetaIsDirty,
		reactiveMetaErrorMap,
		reactiveMetaErrorSourceMap,
		reactiveMetaIsValidating,
		reactiveMetaIsSubmitting,
		reactiveMetaIsSubmitted,
		reactiveMetaSubmissionAttempts,
		reactiveMetaIsSubmitSuccessful,
		reactiveMetaCanSubmit,
		reactiveMetaIsValid,
		reactiveMetaIsFieldsValid,
		reactiveMetaIsFieldsValidating,
		reactiveMetaIsGroupValid
	]);
	useIsomorphicLayoutEffect(formGroupApi.mount, [formGroupApi]);
	useIsomorphicLayoutEffect(() => {
		formGroupApi.update(opts);
	});
	return extendedFieldApi;
}
var FormGroup = (({ children, ...formGroupOptions }) => {
	const formGroupApi = useFormGroup(formGroupOptions);
	const jsxToDisplay = (0, import_react.useMemo)(() => functionalUpdate(children, formGroupApi), [children, formGroupApi]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: jsxToDisplay });
});
//#endregion
//#region node_modules/.pnpm/@tanstack+react-form@1.33.5_@tanstack+react-start@1.168.60_crossws@0.4.15_srvx@0.11.22__b424ce3c069596ef22ac747cd677e974/node_modules/@tanstack/react-form/dist/esm/useForm.js
function LocalSubscribe$1({ form, selector = (state) => state, children }) {
	const data = useSelector(form.store, selector);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: functionalUpdate(children, data) });
}
function useForm(opts) {
	const fallbackFormId = useFormId();
	const [prevFormId, setPrevFormId] = (0, import_react.useState)(opts?.formId);
	const [formApi, setFormApi] = (0, import_react.useState)(() => {
		return new FormApi({
			...opts,
			formId: opts?.formId ?? fallbackFormId
		});
	});
	if (prevFormId !== opts?.formId) {
		const formId = opts?.formId ?? fallbackFormId;
		setFormApi(new FormApi({
			...opts,
			formId
		}));
		setPrevFormId(formId);
	}
	const extendedFormApi = (0, import_react.useMemo)(() => {
		const extendedApi = {
			...formApi,
			handleSubmit: ((...props) => {
				return formApi._handleSubmit(...props);
			}),
			get formId() {
				return formApi._formId;
			},
			get state() {
				return formApi.store.state;
			}
		};
		extendedApi.Field = function APIField(props) {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				...props,
				form: formApi
			});
		};
		extendedApi.FormGroup = function APIFormGroup(props) {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormGroup, {
				...props,
				form: formApi
			});
		};
		extendedApi.Subscribe = function Subscribe(props) {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocalSubscribe$1, {
				form: formApi,
				selector: props.selector,
				children: props.children
			});
		};
		return extendedApi;
	}, [formApi]);
	useIsomorphicLayoutEffect(formApi.mount, []);
	useIsomorphicLayoutEffect(() => {
		formApi.update(opts);
	});
	const hasRan = (0, import_react.useRef)(false);
	useIsomorphicLayoutEffect(() => {
		if (!hasRan.current) return;
		if (!opts?.transform) return;
		mergeAndUpdate(formApi, opts.transform);
	}, [formApi, opts?.transform]);
	useIsomorphicLayoutEffect(() => {
		hasRan.current = true;
	});
	return extendedFormApi;
}
//#endregion
//#region node_modules/.pnpm/@tanstack+react-form@1.33.5_@tanstack+react-start@1.168.60_crossws@0.4.15_srvx@0.11.22__b424ce3c069596ef22ac747cd677e974/node_modules/@tanstack/react-form/dist/esm/useFieldGroup.js
function LocalSubscribe({ lens, selector = (state) => state, children }) {
	const data = useSelector(lens.store, selector);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: functionalUpdate(children, data) });
}
function useFieldGroup(opts) {
	const [formLensApi] = (0, import_react.useState)(() => {
		const api = new FieldGroupApi(opts);
		const form = opts.form instanceof FieldGroupApi ? opts.form.form : opts.form;
		const extendedApi = api;
		extendedApi.AppForm = function AppForm(appFormProps) {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppForm, { ...appFormProps });
		};
		extendedApi.AppField = function AppField(props) {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.AppField, { ...formLensApi.getFormFieldOptions(props) });
		};
		extendedApi.Field = function Field(props) {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Field, { ...formLensApi.getFormFieldOptions(props) });
		};
		extendedApi.Subscribe = function Subscribe(props) {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocalSubscribe, {
				lens: formLensApi,
				selector: props.selector,
				children: props.children
			});
		};
		return Object.assign(extendedApi, { ...opts.formComponents });
	});
	useIsomorphicLayoutEffect(formLensApi.mount, [formLensApi]);
	return formLensApi;
}
//#endregion
//#region node_modules/.pnpm/@tanstack+react-form@1.33.5_@tanstack+react-start@1.168.60_crossws@0.4.15_srvx@0.11.22__b424ce3c069596ef22ac747cd677e974/node_modules/@tanstack/react-form/dist/esm/createFormHook.js
var fieldContext = (0, import_react.createContext)(null);
var formContext = (0, import_react.createContext)(null);
function useFormContext() {
	const form = (0, import_react.useContext)(formContext);
	if (!form) throw new Error("`formContext` only works when within a `formComponent` passed to `createFormHook`");
	return form;
}
function createFormHookContexts() {
	function useFieldContext() {
		const field = (0, import_react.useContext)(fieldContext);
		if (!field) throw new Error("`fieldContext` only works when within a `fieldComponent` passed to `createFormHook`");
		return field;
	}
	return {
		fieldContext,
		useFieldContext,
		useFormContext,
		formContext
	};
}
function createFormHook({ fieldComponents, fieldContext: fieldContext2, formContext: formContext2, formComponents }) {
	function useAppForm(props) {
		const form = useForm(props);
		const AppForm = (0, import_react.useMemo)(() => {
			return ({ children }) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(formContext2.Provider, {
					value: form,
					children
				});
			};
		}, [form]);
		const AppField = (0, import_react.useMemo)(() => {
			const AppField2 = (({ children, ...props2 }) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Field, {
					...props2,
					children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(fieldContext2.Provider, {
						value: field,
						children: children(Object.assign(field, fieldComponents))
					})
				});
			});
			return AppField2;
		}, [form]);
		return (0, import_react.useMemo)(() => {
			return Object.assign(form, {
				AppField,
				AppForm,
				...formComponents
			});
		}, [
			form,
			AppField,
			AppForm
		]);
	}
	function withForm({ render, props }) {
		return function Render(innerProps) {
			return render({
				...props,
				...innerProps
			});
		};
	}
	function withFieldGroup({ render, props, defaultValues }) {
		return function Render(innerProps) {
			const fieldGroupApi = useFieldGroup((0, import_react.useMemo)(() => {
				return {
					form: innerProps.form,
					fields: innerProps.fields,
					defaultValues,
					formComponents
				};
			}, [innerProps.form, innerProps.fields]));
			return render({
				...props,
				...innerProps,
				group: fieldGroupApi
			});
		};
	}
	function useTypedAppFormContext(_props) {
		return useFormContext();
	}
	function extendForm(extension) {
		return createFormHook({
			fieldContext: fieldContext2,
			formContext: formContext2,
			fieldComponents: {
				...fieldComponents,
				...extension.fieldComponents
			},
			formComponents: {
				...formComponents,
				...extension.formComponents
			}
		});
	}
	return {
		useAppForm,
		withForm,
		withFieldGroup,
		useTypedAppFormContext,
		extendForm
	};
}
//#endregion
export { useSelector as i, createFormHookContexts as n, useForm as r, createFormHook as t };
