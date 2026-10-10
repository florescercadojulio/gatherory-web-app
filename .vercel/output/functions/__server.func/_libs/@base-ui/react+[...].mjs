import { o as __toESM, t as __commonJSMin } from "../../_runtime.mjs";
//#region node_modules/.pnpm/react@19.3.0/node_modules/react/cjs/react.production.js
/**
* @license React
* react.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
	var REACT_PORTAL_TYPE = Symbol.for("react.portal");
	var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
	var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
	var REACT_CONSUMER_TYPE = Symbol.for("react.consumer");
	var REACT_CONTEXT_TYPE = Symbol.for("react.context");
	var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
	var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
	var REACT_MEMO_TYPE = Symbol.for("react.memo");
	var REACT_LAZY_TYPE = Symbol.for("react.lazy");
	var REACT_ACTIVITY_TYPE = Symbol.for("react.activity");
	var REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition");
	var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
	function getIteratorFn(maybeIterable) {
		if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
		maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
		return "function" === typeof maybeIterable ? maybeIterable : null;
	}
	var ReactNoopUpdateQueue = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	};
	var assign = Object.assign;
	var emptyObject = {};
	function Component(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	Component.prototype.isReactComponent = {};
	Component.prototype.setState = function(partialState, callback) {
		if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, partialState, callback, "setState");
	};
	Component.prototype.forceUpdate = function(callback) {
		this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
	};
	function ComponentDummy() {}
	ComponentDummy.prototype = Component.prototype;
	function PureComponent(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
	pureComponentPrototype.constructor = PureComponent;
	assign(pureComponentPrototype, Component.prototype);
	pureComponentPrototype.isPureReactComponent = !0;
	var isArrayImpl = Array.isArray;
	function noop() {}
	var ReactSharedInternals = {
		H: null,
		A: null,
		T: null,
		S: null
	};
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	function ReactElement(type, key, props) {
		var refProp = props.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== refProp ? refProp : null,
			props
		};
	}
	function cloneAndReplaceKey(oldElement, newKey) {
		return ReactElement(oldElement.type, newKey, oldElement.props);
	}
	function isValidElement(object) {
		return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
	}
	function escape(key) {
		var escaperLookup = {
			"=": "=0",
			":": "=2"
		};
		return "$" + key.replace(/[=:]/g, function(match) {
			return escaperLookup[match];
		});
	}
	var userProvidedKeyEscapeRegex = /\/+/g;
	function getElementKey(element, index) {
		return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
	}
	function resolveThenable(thenable) {
		switch (thenable.status) {
			case "fulfilled": return thenable.value;
			case "rejected": throw thenable.reason;
			default: switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
				"pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
			}, function(error) {
				"pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
			})), thenable.status) {
				case "fulfilled": return thenable.value;
				case "rejected": throw thenable.reason;
			}
		}
		throw thenable;
	}
	function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
		var type = typeof children;
		if ("undefined" === type || "boolean" === type) children = null;
		var invokeCallback = !1;
		if (null === children) invokeCallback = !0;
		else switch (type) {
			case "bigint":
			case "string":
			case "number":
				invokeCallback = !0;
				break;
			case "object": switch (children.$$typeof) {
				case REACT_ELEMENT_TYPE:
				case REACT_PORTAL_TYPE:
					invokeCallback = !0;
					break;
				case REACT_LAZY_TYPE: return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
			}
		}
		if (invokeCallback) return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
			return c;
		})) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(callback, escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + invokeCallback)), array.push(callback)), 1;
		invokeCallback = 0;
		var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
		if (isArrayImpl(children)) for (var i = 0; i < children.length; i++) nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if (i = getIteratorFn(children), "function" === typeof i) for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done;) nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if ("object" === type) {
			if ("function" === typeof children.then) return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
			array = String(children);
			throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
		}
		return invokeCallback;
	}
	function mapChildren(children, func, context) {
		if (null == children) return children;
		var result = [], count = 0;
		mapIntoArray(children, result, "", "", function(child) {
			return func.call(context, child, count++);
		});
		return result;
	}
	function lazyInitializer(payload) {
		if (-1 === payload._status) {
			var ctor = payload._result, thenable = ctor();
			thenable.then(function(moduleObject) {
				if (0 === payload._status || -1 === payload._status) payload._status = 1, payload._result = moduleObject, void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
			}, function(error) {
				if (0 === payload._status || -1 === payload._status) payload._status = 2, payload._result = error, void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
			});
			-1 === payload._status && (payload._status = 0, payload._result = thenable);
		}
		if (1 === payload._status) return payload._result.default;
		throw payload._result;
	}
	var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
		if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
			var event = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
				error
			});
			if (!window.dispatchEvent(event)) return;
		} else if ("object" === typeof process && "function" === typeof process.emit) {
			process.emit("uncaughtException", error);
			return;
		}
		console.error(error);
	};
	function startTransition(scope) {
		var prevTransition = ReactSharedInternals.T, currentTransition = {};
		currentTransition.types = null !== prevTransition ? prevTransition.types : null;
		ReactSharedInternals.T = currentTransition;
		try {
			var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
			null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
			"object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
		} catch (error) {
			reportGlobalError(error);
		} finally {
			null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
		}
	}
	function addTransitionType(type) {
		var transition = ReactSharedInternals.T;
		if (null !== transition) {
			var transitionTypes = transition.types;
			null === transitionTypes ? transition.types = [type] : -1 === transitionTypes.indexOf(type) && transitionTypes.push(type);
		} else startTransition(addTransitionType.bind(null, type));
	}
	var Children = {
		map: mapChildren,
		forEach: function(children, forEachFunc, forEachContext) {
			mapChildren(children, function() {
				forEachFunc.apply(this, arguments);
			}, forEachContext);
		},
		count: function(children) {
			var n = 0;
			mapChildren(children, function() {
				n++;
			});
			return n;
		},
		toArray: function(children) {
			return mapChildren(children, function(child) {
				return child;
			}) || [];
		},
		only: function(children) {
			if (!isValidElement(children)) throw Error("React.Children.only expected to receive a single React element child.");
			return children;
		}
	};
	exports.Activity = REACT_ACTIVITY_TYPE;
	exports.Children = Children;
	exports.Component = Component;
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.Profiler = REACT_PROFILER_TYPE;
	exports.PureComponent = PureComponent;
	exports.StrictMode = REACT_STRICT_MODE_TYPE;
	exports.Suspense = REACT_SUSPENSE_TYPE;
	exports.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
	exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
	exports.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(size) {
			return ReactSharedInternals.H.useMemoCache(size);
		}
	};
	exports.addTransitionType = addTransitionType;
	exports.cache = function(fn) {
		return function() {
			return fn.apply(null, arguments);
		};
	};
	exports.cacheSignal = function() {
		return null;
	};
	exports.cloneElement = function(element, config, children) {
		if (null === element || void 0 === element) throw Error("The argument must be a React element, but you passed " + element + ".");
		var props = assign({}, element.props), key = element.key;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
		var propName = arguments.length - 2;
		if (1 === propName) props.children = children;
		else if (1 < propName) {
			for (var childArray = Array(propName), i = 0; i < propName; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		return ReactElement(element.type, key, props);
	};
	exports.createContext = function(defaultValue) {
		defaultValue = {
			$$typeof: REACT_CONTEXT_TYPE,
			_currentValue: defaultValue,
			_currentValue2: defaultValue,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		};
		defaultValue.Provider = defaultValue;
		defaultValue.Consumer = {
			$$typeof: REACT_CONSUMER_TYPE,
			_context: defaultValue
		};
		return defaultValue;
	};
	exports.createElement = function(type, config, children) {
		var propName, props = {}, key = null;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
		var childrenLength = arguments.length - 2;
		if (1 === childrenLength) props.children = children;
		else if (1 < childrenLength) {
			for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		if (type && type.defaultProps) for (propName in childrenLength = type.defaultProps, childrenLength) void 0 === props[propName] && (props[propName] = childrenLength[propName]);
		return ReactElement(type, key, props);
	};
	exports.createRef = function() {
		return { current: null };
	};
	exports.forwardRef = function(render) {
		return {
			$$typeof: REACT_FORWARD_REF_TYPE,
			render
		};
	};
	exports.isValidElement = isValidElement;
	exports.lazy = function(ctor) {
		return {
			$$typeof: REACT_LAZY_TYPE,
			_payload: {
				_status: -1,
				_result: ctor
			},
			_init: lazyInitializer
		};
	};
	exports.memo = function(type, compare) {
		return {
			$$typeof: REACT_MEMO_TYPE,
			type,
			compare: void 0 === compare ? null : compare
		};
	};
	exports.startTransition = startTransition;
	exports.unstable_useCacheRefresh = function() {
		return ReactSharedInternals.H.useCacheRefresh();
	};
	exports.use = function(usable) {
		return ReactSharedInternals.H.use(usable);
	};
	exports.useActionState = function(action, initialState, permalink) {
		return ReactSharedInternals.H.useActionState(action, initialState, permalink);
	};
	exports.useCallback = function(callback, deps) {
		return ReactSharedInternals.H.useCallback(callback, deps);
	};
	exports.useContext = function(Context) {
		return ReactSharedInternals.H.useContext(Context);
	};
	exports.useDebugValue = function() {};
	exports.useDeferredValue = function(value, initialValue) {
		return ReactSharedInternals.H.useDeferredValue(value, initialValue);
	};
	exports.useEffect = function(create, deps) {
		return ReactSharedInternals.H.useEffect(create, deps);
	};
	exports.useEffectEvent = function(callback) {
		return ReactSharedInternals.H.useEffectEvent(callback);
	};
	exports.useId = function() {
		return ReactSharedInternals.H.useId();
	};
	exports.useImperativeHandle = function(ref, create, deps) {
		return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
	};
	exports.useInsertionEffect = function(create, deps) {
		return ReactSharedInternals.H.useInsertionEffect(create, deps);
	};
	exports.useLayoutEffect = function(create, deps) {
		return ReactSharedInternals.H.useLayoutEffect(create, deps);
	};
	exports.useMemo = function(create, deps) {
		return ReactSharedInternals.H.useMemo(create, deps);
	};
	exports.useOptimistic = function(passthrough, reducer) {
		return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
	};
	exports.useReducer = function(reducer, initialArg, init) {
		return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
	};
	exports.useRef = function(initialValue) {
		return ReactSharedInternals.H.useRef(initialValue);
	};
	exports.useState = function(initialState) {
		return ReactSharedInternals.H.useState(initialState);
	};
	exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
		return ReactSharedInternals.H.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	};
	exports.useTransition = function() {
		return ReactSharedInternals.H.useTransition();
	};
	exports.version = "19.3.0";
}));
//#endregion
//#region node_modules/.pnpm/react@19.3.0/node_modules/react/index.js
var require_react = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_production();
}));
//#endregion
//#region node_modules/.pnpm/react@19.3.0/node_modules/react/cjs/react-jsx-runtime.production.js
/**
* @license React
* react-jsx-runtime.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_jsx_runtime_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
	var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	function jsxProd(type, config, maybeKey) {
		var key = null;
		void 0 !== maybeKey && (key = "" + maybeKey);
		void 0 !== config.key && (key = "" + config.key);
		if ("key" in config) {
			maybeKey = {};
			for (var propName in config) "key" !== propName && (maybeKey[propName] = config[propName]);
		} else maybeKey = config;
		config = maybeKey.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== config ? config : null,
			props: maybeKey
		};
	}
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.jsx = jsxProd;
	exports.jsxs = jsxProd;
}));
//#endregion
//#region node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var require_jsx_runtime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_jsx_runtime_production();
}));
//#endregion
//#region node_modules/.pnpm/use-sync-external-store@1.7.0_react@19.3.0/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.production.js
/**
* @license React
* use-sync-external-store-shim.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_use_sync_external_store_shim_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React = require_react();
	function is(x, y) {
		return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
	}
	var objectIs = "function" === typeof Object.is ? Object.is : is;
	var useState = React.useState;
	var useEffect = React.useEffect;
	var useLayoutEffect = React.useLayoutEffect;
	var useDebugValue = React.useDebugValue;
	function useSyncExternalStore$2(subscribe, getSnapshot) {
		var value = getSnapshot(), _useState = useState({ inst: {
			value,
			getSnapshot
		} }), inst = _useState[0].inst, forceUpdate = _useState[1];
		useLayoutEffect(function() {
			inst.value = value;
			inst.getSnapshot = getSnapshot;
			checkIfSnapshotChanged(inst) && forceUpdate({ inst });
		}, [
			subscribe,
			value,
			getSnapshot
		]);
		useEffect(function() {
			checkIfSnapshotChanged(inst) && forceUpdate({ inst });
			return subscribe(function() {
				checkIfSnapshotChanged(inst) && forceUpdate({ inst });
			});
		}, [subscribe]);
		useDebugValue(value);
		return value;
	}
	function checkIfSnapshotChanged(inst) {
		var latestGetSnapshot = inst.getSnapshot;
		inst = inst.value;
		try {
			var nextValue = latestGetSnapshot();
			return !objectIs(inst, nextValue);
		} catch (error) {
			return !0;
		}
	}
	function useSyncExternalStore$1(subscribe, getSnapshot) {
		return getSnapshot();
	}
	var shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
	exports.useSyncExternalStore = void 0 !== React.useSyncExternalStore ? React.useSyncExternalStore : shim;
}));
//#endregion
//#region node_modules/.pnpm/use-sync-external-store@1.7.0_react@19.3.0/node_modules/use-sync-external-store/shim/index.js
var require_shim = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_use_sync_external_store_shim_production();
}));
//#endregion
//#region node_modules/.pnpm/use-sync-external-store@1.7.0_react@19.3.0/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.production.js
/**
* @license React
* use-sync-external-store-shim/with-selector.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_with_selector_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React = require_react();
	var shim = require_shim();
	function is(x, y) {
		return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
	}
	var objectIs = "function" === typeof Object.is ? Object.is : is;
	var useSyncExternalStore = shim.useSyncExternalStore;
	var useRef = React.useRef;
	var useEffect = React.useEffect;
	var useMemo = React.useMemo;
	var useDebugValue = React.useDebugValue;
	exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
		var instRef = useRef(null);
		if (null === instRef.current) {
			var inst = {
				hasValue: !1,
				value: null
			};
			instRef.current = inst;
		} else inst = instRef.current;
		instRef = useMemo(function() {
			function memoizedSelector(nextSnapshot) {
				if (!hasMemo) {
					hasMemo = !0;
					memoizedSnapshot = nextSnapshot;
					nextSnapshot = selector(nextSnapshot);
					if (void 0 !== isEqual && inst.hasValue) {
						var currentSelection = inst.value;
						if (isEqual(currentSelection, nextSnapshot)) return memoizedSelection = currentSelection;
					}
					return memoizedSelection = nextSnapshot;
				}
				currentSelection = memoizedSelection;
				if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
				var nextSelection = selector(nextSnapshot);
				if (void 0 !== isEqual && isEqual(currentSelection, nextSelection)) return memoizedSnapshot = nextSnapshot, currentSelection;
				memoizedSnapshot = nextSnapshot;
				return memoizedSelection = nextSelection;
			}
			var hasMemo = !1, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
			return [function() {
				return memoizedSelector(getSnapshot());
			}, null === maybeGetServerSnapshot ? void 0 : function() {
				return memoizedSelector(maybeGetServerSnapshot());
			}];
		}, [
			getSnapshot,
			getServerSnapshot,
			selector,
			isEqual
		]);
		var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
		useEffect(function() {
			inst.hasValue = !0;
			inst.value = value;
		}, [value]);
		useDebugValue(value);
		return value;
	};
}));
//#endregion
//#region node_modules/.pnpm/use-sync-external-store@1.7.0_react@19.3.0/node_modules/use-sync-external-store/shim/with-selector.js
var require_with_selector = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_with_selector_production();
}));
//#endregion
//#region node_modules/.pnpm/react-dom@19.3.0_react@19.3.0/node_modules/react-dom/cjs/react-dom.production.js
/**
* @license React
* react-dom.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_dom_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React = require_react();
	function formatProdErrorMessage(code) {
		var url = "https://react.dev/errors/" + code;
		if (1 < arguments.length) {
			url += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var i = 2; i < arguments.length; i++) url += "&args[]=" + encodeURIComponent(arguments[i]);
		}
		return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function noop() {}
	var Internals = {
		d: {
			f: noop,
			r: function() {
				throw Error(formatProdErrorMessage(522));
			},
			D: noop,
			C: noop,
			L: noop,
			m: noop,
			X: noop,
			S: noop,
			M: noop
		},
		p: 0,
		findDOMNode: null
	};
	var REACT_PORTAL_TYPE = Symbol.for("react.portal");
	var REACT_RECOVERABLE_TYPE = Symbol.for("react.recoverable");
	var REACT_OPTIMISTIC_KEY = Symbol.for("react.optimistic_key");
	function createPortal$1(children, containerInfo, implementation) {
		var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
		return {
			$$typeof: REACT_PORTAL_TYPE,
			key: null == key ? null : key === REACT_OPTIMISTIC_KEY ? REACT_OPTIMISTIC_KEY : "" + key,
			children,
			containerInfo,
			implementation
		};
	}
	var ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function getCrossOriginStringAs(as, input) {
		if ("font" === as) return "";
		if ("string" === typeof input) return "use-credentials" === input ? input : "";
	}
	exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
	exports.browser = function(reason) {
		return {
			$$typeof: REACT_RECOVERABLE_TYPE,
			_reason: reason
		};
	};
	exports.createPortal = function(children, container) {
		var key = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
		if (!container || 1 !== container.nodeType && 9 !== container.nodeType && 11 !== container.nodeType) throw Error(formatProdErrorMessage(299));
		return createPortal$1(children, container, null, key);
	};
	exports.flushSync = function(fn) {
		var previousTransition = ReactSharedInternals.T, previousUpdatePriority = Internals.p;
		try {
			if (ReactSharedInternals.T = null, Internals.p = 2, fn) return fn();
		} finally {
			ReactSharedInternals.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f();
		}
	};
	exports.preconnect = function(href, options) {
		"string" === typeof href && (options ? (options = options.crossOrigin, options = "string" === typeof options ? "use-credentials" === options ? options : "" : void 0) : options = null, Internals.d.C(href, options));
	};
	exports.prefetchDNS = function(href) {
		"string" === typeof href && Internals.d.D(href);
	};
	exports.preinit = function(href, options) {
		if ("string" === typeof href && options && "string" === typeof options.as) {
			var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin), integrity = "string" === typeof options.integrity ? options.integrity : void 0, fetchPriority = "string" === typeof options.fetchPriority ? options.fetchPriority : void 0;
			"style" === as ? Internals.d.S(href, "string" === typeof options.precedence ? options.precedence : void 0, {
				crossOrigin,
				integrity,
				fetchPriority
			}) : "script" === as && Internals.d.X(href, {
				crossOrigin,
				integrity,
				fetchPriority,
				nonce: "string" === typeof options.nonce ? options.nonce : void 0
			});
		}
	};
	exports.preinitModule = function(href, options) {
		if ("string" === typeof href) if ("object" === typeof options && null !== options) {
			if (null == options.as || "script" === options.as) {
				var crossOrigin = getCrossOriginStringAs(options.as, options.crossOrigin);
				Internals.d.M(href, {
					crossOrigin,
					integrity: "string" === typeof options.integrity ? options.integrity : void 0,
					nonce: "string" === typeof options.nonce ? options.nonce : void 0,
					fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0
				});
			}
		} else options ?? Internals.d.M(href);
	};
	exports.preload = function(href, options) {
		if ("string" === typeof href && "object" === typeof options && null !== options && "string" === typeof options.as) {
			var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin);
			Internals.d.L(href, as, {
				crossOrigin,
				integrity: "string" === typeof options.integrity ? options.integrity : void 0,
				nonce: "string" === typeof options.nonce ? options.nonce : void 0,
				type: "string" === typeof options.type ? options.type : void 0,
				fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0,
				referrerPolicy: "string" === typeof options.referrerPolicy ? options.referrerPolicy : void 0,
				imageSrcSet: "string" === typeof options.imageSrcSet ? options.imageSrcSet : void 0,
				imageSizes: "string" === typeof options.imageSizes ? options.imageSizes : void 0,
				media: "string" === typeof options.media ? options.media : void 0
			});
		}
	};
	exports.preloadModule = function(href, options) {
		if ("string" === typeof href) if (options) {
			var crossOrigin = getCrossOriginStringAs(options.as, options.crossOrigin);
			Internals.d.m(href, {
				as: "string" === typeof options.as && "script" !== options.as ? options.as : void 0,
				crossOrigin,
				integrity: "string" === typeof options.integrity ? options.integrity : void 0,
				nonce: "string" === typeof options.nonce ? options.nonce : void 0,
				fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0
			});
		} else Internals.d.m(href);
	};
	exports.requestFormReset = function(form) {
		Internals.d.r(form);
	};
	exports.unstable_batchedUpdates = function(fn, a) {
		return fn(a);
	};
	exports.useFormState = function(action, initialState, permalink) {
		return ReactSharedInternals.H.useFormState(action, initialState, permalink);
	};
	exports.useFormStatus = function() {
		return ReactSharedInternals.H.useHostTransitionStatus();
	};
	exports.version = "19.3.0";
}));
//#endregion
//#region node_modules/.pnpm/react-dom@19.3.0_react@19.3.0/node_modules/react-dom/index.js
var require_react_dom = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function checkDCE() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") return;
		try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
		} catch (err) {
			console.error(err);
		}
	}
	checkDCE();
	module.exports = require_react_dom_production();
}));
//#endregion
//#region node_modules/.pnpm/@floating-ui+utils@0.2.12/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function hasWindow() {
	return typeof window !== "undefined";
}
function getNodeName(node) {
	if (isNode(node)) return (node.nodeName || "").toLowerCase();
	return "#document";
}
function getWindow(node) {
	var _node$ownerDocument;
	return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
	var _ref;
	return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
	if (!hasWindow()) return false;
	return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
	if (!hasWindow()) return false;
	return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
	if (!hasWindow()) return false;
	return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
	if (!hasWindow() || typeof ShadowRoot === "undefined") return false;
	return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
function isOverflowElement(element) {
	const { overflow, overflowX, overflowY, display } = getComputedStyle$1(element);
	return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== "inline" && display !== "contents";
}
function isTableElement(element) {
	return /^(table|td|th)$/.test(getNodeName(element));
}
function isTopLayer(element) {
	try {
		if (element.matches(":popover-open")) return true;
	} catch (_e) {}
	try {
		return element.matches(":modal");
	} catch (_e) {
		return false;
	}
}
var willChangeRe = /transform|translate|scale|rotate|perspective|filter/;
var containRe = /paint|layout|strict|content/;
var isNotNone = (value) => !!value && value !== "none";
var isWebKitValue;
function isContainingBlock(elementOrCss) {
	const css = isElement(elementOrCss) ? getComputedStyle$1(elementOrCss) : elementOrCss;
	return isNotNone(css.transform) || isNotNone(css.translate) || isNotNone(css.scale) || isNotNone(css.rotate) || isNotNone(css.perspective) || !isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter)) || willChangeRe.test(css.willChange || "") || containRe.test(css.contain || "");
}
function getContainingBlock(element) {
	let currentNode = getParentNode(element);
	while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
		if (isContainingBlock(currentNode)) return currentNode;
		else if (isTopLayer(currentNode)) return null;
		currentNode = getParentNode(currentNode);
	}
	return null;
}
function isWebKit() {
	if (isWebKitValue == null) isWebKitValue = typeof CSS !== "undefined" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none");
	return isWebKitValue;
}
function isLastTraversableNode(node) {
	return /^(html|body|#document)$/.test(getNodeName(node));
}
function getComputedStyle$1(element) {
	return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
	if (isElement(element)) return {
		scrollLeft: element.scrollLeft,
		scrollTop: element.scrollTop
	};
	return {
		scrollLeft: element.scrollX,
		scrollTop: element.scrollY
	};
}
function getParentNode(node) {
	if (getNodeName(node) === "html") return node;
	const result = node.assignedSlot || node.parentNode || isShadowRoot(node) && node.host || getDocumentElement(node);
	return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
	const parentNode = getParentNode(node);
	if (isLastTraversableNode(parentNode)) return (node.ownerDocument || node).body;
	if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) return parentNode;
	return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
	var _node$ownerDocument2;
	if (list === void 0) list = [];
	if (traverseIframes === void 0) traverseIframes = true;
	const scrollableAncestor = getNearestOverflowAncestor(node);
	const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
	const win = getWindow(scrollableAncestor);
	if (isBody) {
		const frameElement = getFrameElement(win);
		return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
	} else return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
}
function getFrameElement(win) {
	return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/safeReact.mjs
/**
* A clone of the React namespace for reading APIs that may be missing in older
* supported React versions. Bundlers can rewrite direct `React.someNewApi`
* reads into named imports, which breaks React 17. Reading from this cloned
* object keeps those lookups optional.
*
* @see https://github.com/mui/material-ui/issues/41190#issuecomment-2040873379
*/
var SafeReact = { ...import_react };
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useRefWithInit.mjs
var UNINITIALIZED = {};
/**
* A React.useRef() that is initialized with a function. Note that it accepts an optional
* initialization argument, so the initialization function doesn't need to be an inline closure.
*
* @usage
*   const ref = useRefWithInit(sortColumns, columns)
*/
function useRefWithInit(init, initArg) {
	const ref = import_react.useRef(UNINITIALIZED);
	if (ref.current === UNINITIALIZED) ref.current = init(initArg);
	return ref;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useStableCallback.mjs
var useInsertionEffect = SafeReact.useInsertionEffect;
var useSafeInsertionEffect = useInsertionEffect && useInsertionEffect !== SafeReact.useLayoutEffect ? useInsertionEffect : (fn) => fn();
/**
* Stabilizes the function passed so it's always the same between renders.
*
* The function becomes non-reactive to any values it captures.
* It can safely be passed as a dependency of `React.useMemo` and `React.useEffect` without re-triggering them if its captured values change.
*
* The function must only be called inside effects and event handlers, never during render (which throws an error).
*
* This hook is a more permissive version of React 19.2's `React.useEffectEvent` in that it can be passed through contexts and called in event handler props, not just effects.
*/
function useStableCallback(callback) {
	const stable = useRefWithInit(createStableCallback).current;
	stable.next = callback;
	useSafeInsertionEffect(stable.effect);
	return stable.trampoline;
}
function createStableCallback() {
	const stable = {
		next: void 0,
		callback: assertNotCalled,
		trampoline: (...args) => stable.callback?.(...args),
		effect: () => {
			stable.callback = stable.next;
		}
	};
	return stable;
}
function assertNotCalled() {}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useIsoLayoutEffect.mjs
var noop = () => {};
var useIsoLayoutEffect = typeof document !== "undefined" ? import_react.useLayoutEffect : noop;
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/mergeObjects.mjs
function mergeObjects(a, b) {
	if (a && !b) return a;
	if (!a && b) return b;
	if (a || b) return {
		...a,
		...b
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/merge-props/mergeProps.mjs
var EMPTY_PROPS = {};
/**
* Merges multiple sets of React props. It follows the Object.assign pattern where the rightmost object's fields overwrite
* the conflicting ones from others. This doesn't apply to event handlers, `className` and `style` props.
*
* Event handlers are merged and called in right-to-left order (rightmost handler executes first, leftmost last).
* For React synthetic events, the rightmost handler can prevent prior (left-positioned) handlers from executing
* by calling `event.preventBaseUIHandler()`. For non-synthetic events (custom events with primitive/object values),
* all handlers always execute without prevention capability.
*
* The `className` prop is merged by concatenating classes in right-to-left order (rightmost class appears first in the string).
* The `style` prop is merged with rightmost styles overwriting the prior ones.
*
* Props can either be provided as objects or as functions that take the previous props as an argument.
* The function will receive the merged props up to that point (going from left to right):
* so in the case of `(obj1, obj2, fn, obj3)`, `fn` will receive the merged props of `obj1` and `obj2`.
* The function is responsible for chaining event handlers if needed (that is, we don't run the merge logic).
*
* Event handlers returned by the functions are not automatically prevented when `preventBaseUIHandler` is called.
* They must check `event.baseUIHandlerPrevented` themselves and bail out if it's true.
*
* @important **`ref` is not merged.**
* @param a Props object to merge.
* @param b Props object to merge. The function will overwrite conflicting props from `a`.
* @param c Props object to merge. The function will overwrite conflicting props from previous parameters.
* @param d Props object to merge. The function will overwrite conflicting props from previous parameters.
* @param e Props object to merge. The function will overwrite conflicting props from previous parameters.
* @returns The merged props.
* @public
*/
function mergeProps(a, b, c, d, e) {
	if (!c && !d && !e && !a) return createInitialMergedProps(b);
	let merged = createInitialMergedProps(a);
	if (b) merged = mergeInto(merged, b);
	if (c) merged = mergeInto(merged, c);
	if (d) merged = mergeInto(merged, d);
	if (e) merged = mergeInto(merged, e);
	return merged;
}
/**
* Merges an arbitrary number of React props using the same logic as {@link mergeProps}.
* This function accepts an array of props instead of individual arguments.
*
* This has slightly lower performance than {@link mergeProps} due to accepting an array
* instead of a fixed number of arguments. Prefer {@link mergeProps} when merging 5 or
* fewer prop sets for better performance.
*
* @param props Array of props to merge.
* @returns The merged props.
* @see mergeProps
* @public
*/
function mergePropsN(props) {
	if (props.length === 0) return EMPTY_PROPS;
	if (props.length === 1) return createInitialMergedProps(props[0]);
	let merged = createInitialMergedProps(props[0]);
	for (let i = 1; i < props.length; i += 1) merged = mergeInto(merged, props[i]);
	return merged;
}
function createInitialMergedProps(inputProps) {
	if (isPropsGetter(inputProps)) return { ...resolvePropsGetter(inputProps, EMPTY_PROPS) };
	return copyInitialProps(inputProps);
}
function mergeInto(merged, inputProps) {
	if (isPropsGetter(inputProps)) return resolvePropsGetter(inputProps, merged);
	return mutablyMergeInto(merged, inputProps);
}
function copyInitialProps(inputProps) {
	const copiedProps = { ...inputProps };
	for (const propName in copiedProps) {
		const propValue = copiedProps[propName];
		if (isEventHandler(propName, propValue)) copiedProps[propName] = wrapEventHandler(propValue);
	}
	return copiedProps;
}
/**
* Merges two sets of props. In case of conflicts, the external props take precedence.
*/
function mutablyMergeInto(mergedProps, externalProps) {
	if (!externalProps) return mergedProps;
	for (const propName in externalProps) {
		const externalPropValue = externalProps[propName];
		switch (propName) {
			case "style":
				mergedProps[propName] = mergeObjects(mergedProps.style, externalPropValue);
				break;
			case "className":
				mergedProps[propName] = mergeClassNames(mergedProps.className, externalPropValue);
				break;
			default: if (isEventHandler(propName, externalPropValue)) mergedProps[propName] = mergeEventHandlers(mergedProps[propName], externalPropValue);
			else mergedProps[propName] = externalPropValue;
		}
	}
	return mergedProps;
}
function isEventHandler(key, value) {
	const code0 = key.charCodeAt(0);
	const code1 = key.charCodeAt(1);
	const code2 = key.charCodeAt(2);
	return code0 === 111 && code1 === 110 && code2 >= 65 && code2 <= 90 && (typeof value === "function" || typeof value === "undefined");
}
function isPropsGetter(inputProps) {
	return typeof inputProps === "function";
}
function resolvePropsGetter(inputProps, previousProps) {
	if (isPropsGetter(inputProps)) return inputProps(previousProps);
	return inputProps ?? EMPTY_PROPS;
}
function mergeEventHandlers(ourHandler, theirHandler) {
	if (!theirHandler) return ourHandler;
	if (!ourHandler) return wrapEventHandler(theirHandler);
	return (...args) => {
		const event = args[0];
		if (isSyntheticEvent(event)) {
			const baseUIEvent = event;
			makeEventPreventable(baseUIEvent);
			const result = theirHandler(...args);
			if (!baseUIEvent.baseUIHandlerPrevented) ourHandler?.(...args);
			return result;
		}
		const result = theirHandler(...args);
		ourHandler?.(...args);
		return result;
	};
}
function wrapEventHandler(handler) {
	if (!handler) return handler;
	return (...args) => {
		const event = args[0];
		if (isSyntheticEvent(event)) makeEventPreventable(event);
		return handler(...args);
	};
}
function makeEventPreventable(event) {
	event.preventBaseUIHandler = () => {
		event.baseUIHandlerPrevented = true;
	};
	return event;
}
function mergeClassNames(ourClassName, theirClassName) {
	if (theirClassName) {
		if (ourClassName) return theirClassName + " " + ourClassName;
		return theirClassName;
	}
	return ourClassName;
}
function isSyntheticEvent(event) {
	return event != null && typeof event === "object" && "nativeEvent" in event;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/formatErrorMessage.mjs
/**
* Creates a formatErrorMessage function with a custom URL and prefix.
* @param baseUrl - The base URL for the error page (e.g., 'https://base-ui.com/production-error')
* @param prefix - The prefix for the error message (e.g., 'Base UI')
* @returns A function that formats error messages with the given URL and prefix
*/
function createFormatErrorMessage(baseUrl, prefix) {
	return function formatErrorMessage(code, ...args) {
		const url = new URL(baseUrl);
		url.searchParams.set("code", code.toString());
		args.forEach((arg) => url.searchParams.append("args[]", arg));
		return `${prefix} error #${code}; visit ${url} for the full message.`;
	};
}
/**
* WARNING: Don't import this directly. It's imported by the code generated by
* `@mui/internal-babel-plugin-minify-errors`. Make sure to always use string literals in `Error`
* constructors to ensure the plugin works as expected. Supported patterns include:
*   throw new Error('My message');
*   throw new Error(`My message: ${foo}`);
*   throw new Error(`My message: ${foo}` + 'another string');
*   ...
*/
var formatErrorMessage = createFormatErrorMessage("https://base-ui.com/production-error", "Base UI");
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/root/CompositeRootContext.mjs
var CompositeRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useCompositeRootContext(optional = false) {
	const context = import_react.useContext(CompositeRootContext);
	if (context === void 0 && !optional) throw new Error(formatErrorMessage(16));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useFocusableWhenDisabled.mjs
function useFocusableWhenDisabled(parameters) {
	const { focusableWhenDisabled, disabled, composite = false, tabIndex: tabIndexProp = 0, isNativeButton } = parameters;
	const isFocusableComposite = composite && focusableWhenDisabled !== false;
	const isNonFocusableComposite = composite && focusableWhenDisabled === false;
	return { props: import_react.useMemo(() => {
		const additionalProps = { onKeyDown(event) {
			if (disabled && focusableWhenDisabled && event.key !== "Tab") event.preventDefault();
		} };
		if (!composite) {
			additionalProps.tabIndex = tabIndexProp;
			if (!isNativeButton && disabled) additionalProps.tabIndex = focusableWhenDisabled ? tabIndexProp : -1;
		}
		if (isNativeButton && (focusableWhenDisabled || isFocusableComposite) || !isNativeButton && disabled) additionalProps["aria-disabled"] = disabled;
		if (isNativeButton && (!focusableWhenDisabled || isNonFocusableComposite)) additionalProps.disabled = disabled;
		return additionalProps;
	}, [
		composite,
		disabled,
		focusableWhenDisabled,
		isFocusableComposite,
		isNonFocusableComposite,
		isNativeButton,
		tabIndexProp
	]) };
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/owner.mjs
function ownerDocument(node) {
	return node?.ownerDocument || document;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/dispatchClickWithModifiers.mjs
/**
* Dispatches a constructed click on the target so it carries the source event's
* modifier state, which `click()` always reports as unpressed. Like `click()`,
* the untrusted click still runs native activation behavior (form submission,
* link navigation).
* `detail` defaults to 0 (the native convention for keyboard-generated clicks);
* pass `detail: 1` when the click represents a mouse gesture so consumers keying
* off `detail === 0` don't classify it as a keyboard activation.
*/
function dispatchClickWithModifiers(target, sourceEvent, { detail = 0 } = {}) {
	target.dispatchEvent(new (getWindow(target)).PointerEvent("click", {
		bubbles: true,
		cancelable: true,
		composed: true,
		detail,
		shiftKey: sourceEvent.shiftKey,
		ctrlKey: sourceEvent.ctrlKey,
		altKey: sourceEvent.altKey,
		metaKey: sourceEvent.metaKey
	}));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/use-button/useButton.mjs
function useButton(parameters = {}) {
	const { disabled = false, focusableWhenDisabled, tabIndex = 0, native: isNativeButton = true, composite: compositeProp } = parameters;
	const elementRef = import_react.useRef(null);
	const compositeRootContext = useCompositeRootContext(true);
	const isCompositeItem = compositeProp ?? compositeRootContext !== void 0;
	const { props: focusableWhenDisabledProps } = useFocusableWhenDisabled({
		focusableWhenDisabled,
		disabled,
		composite: isCompositeItem,
		tabIndex,
		isNativeButton
	});
	const updateDisabled = import_react.useCallback(() => {
		const element = elementRef.current;
		if (!isButtonElement(element)) return;
		if (isCompositeItem && disabled && focusableWhenDisabledProps.disabled === void 0 && element.disabled) element.disabled = false;
	}, [
		disabled,
		focusableWhenDisabledProps.disabled,
		isCompositeItem
	]);
	useIsoLayoutEffect(updateDisabled, [updateDisabled]);
	return {
		getButtonProps: import_react.useCallback((externalProps = {}) => {
			const { onClick: externalOnClick, onMouseDown: externalOnMouseDown, onKeyUp: externalOnKeyUp, onKeyDown: externalOnKeyDown, onPointerDown: externalOnPointerDown, ...otherExternalProps } = externalProps;
			return mergeProps({
				onClick(event) {
					if (disabled) {
						event.preventDefault();
						return;
					}
					externalOnClick?.(event);
				},
				onMouseDown(event) {
					if (!disabled) externalOnMouseDown?.(event);
				},
				onKeyDown(event) {
					if (disabled) return;
					makeEventPreventable(event);
					externalOnKeyDown?.(event);
					if (event.baseUIHandlerPrevented) return;
					const isCurrentTarget = event.target === event.currentTarget;
					const currentTarget = event.currentTarget;
					const isButton = isButtonElement(currentTarget);
					const isLink = !isNativeButton && isValidLinkElement(currentTarget);
					const shouldClick = isCurrentTarget && (isNativeButton ? isButton : !isLink);
					const isEnterKey = event.key === "Enter";
					const isSpaceKey = event.key === " ";
					const role = currentTarget.getAttribute("role");
					const isTextNavigationRole = role?.startsWith("menuitem") || role === "option" || role === "gridcell";
					if (isCurrentTarget && isCompositeItem && isSpaceKey) {
						if (event.defaultPrevented && isTextNavigationRole) return;
						event.preventDefault();
						if (!isNativeButton || isButton) {
							event.preventBaseUIHandler();
							dispatchClickWithModifiers(currentTarget, event);
						}
						return;
					}
					if (!shouldClick || isNativeButton || !isSpaceKey && !isEnterKey) {
						if (isCurrentTarget && isLink && isSpaceKey) event.preventDefault();
						return;
					}
					if (event.defaultPrevented) return;
					event.preventDefault();
					if (isEnterKey) {
						event.preventBaseUIHandler();
						dispatchClickWithModifiers(currentTarget, event);
					}
				},
				onKeyUp(event) {
					if (disabled) return;
					makeEventPreventable(event);
					externalOnKeyUp?.(event);
					if (event.target === event.currentTarget && isNativeButton && isCompositeItem && isButtonElement(event.currentTarget) && event.key === " ") {
						event.preventDefault();
						return;
					}
					if (event.baseUIHandlerPrevented) return;
					if (event.target === event.currentTarget && !isNativeButton && !isCompositeItem && !event.defaultPrevented && event.key === " ") {
						event.preventBaseUIHandler();
						dispatchClickWithModifiers(event.currentTarget, event);
					}
				},
				onPointerDown(event) {
					if (disabled) {
						event.preventDefault();
						return;
					}
					externalOnPointerDown?.(event);
				}
			}, isNativeButton ? { type: "button" } : { role: "button" }, focusableWhenDisabledProps, otherExternalProps);
		}, [
			disabled,
			focusableWhenDisabledProps,
			isCompositeItem,
			isNativeButton
		]),
		buttonRef: useStableCallback((element) => {
			elementRef.current = element;
			updateDisabled();
		})
	};
}
function isButtonElement(elem) {
	return isHTMLElement(elem) && elem.tagName === "BUTTON";
}
function isValidLinkElement(elem) {
	return isHTMLElement(elem) && elem.tagName === "A" && Boolean(elem.href);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useMergedRefs.mjs
/**
* Merges refs into a single memoized callback ref or `null`.
* This makes sure multiple refs are updated together and have the same value.
*
* This function accepts up to four refs. If you need to merge more, or have an unspecified number of refs to merge,
* use `useMergedRefsN` instead.
*/
function useMergedRefs(a, b, c, d) {
	const forkRef = useRefWithInit(createForkRef).current;
	if (didChange(forkRef, a, b, c, d)) update(forkRef, [
		a,
		b,
		c,
		d
	]);
	return forkRef.callback;
}
/**
* Merges an array of refs into a single memoized callback ref or `null`.
*
* If you need to merge a fixed number (up to four) of refs, use `useMergedRefs` instead for better performance.
*/
function useMergedRefsN(refs) {
	const forkRef = useRefWithInit(createForkRef).current;
	if (didChangeN(forkRef, refs)) update(forkRef, refs);
	return forkRef.callback;
}
function createForkRef() {
	return {
		callback: null,
		cleanup: null,
		refs: []
	};
}
function didChange(forkRef, a, b, c, d) {
	return forkRef.refs[0] !== a || forkRef.refs[1] !== b || forkRef.refs[2] !== c || forkRef.refs[3] !== d;
}
function didChangeN(forkRef, newRefs) {
	return forkRef.refs.length !== newRefs.length || forkRef.refs.some((ref, index) => ref !== newRefs[index]);
}
function update(forkRef, refs) {
	forkRef.refs = refs;
	if (refs.every((ref) => ref == null)) {
		forkRef.callback = null;
		return;
	}
	forkRef.callback = (instance) => {
		if (forkRef.cleanup) {
			forkRef.cleanup();
			forkRef.cleanup = null;
		}
		if (instance != null) {
			const cleanupCallbacks = Array(refs.length).fill(null);
			for (let i = 0; i < refs.length; i += 1) {
				const ref = refs[i];
				if (ref == null) continue;
				switch (typeof ref) {
					case "function": {
						const refCleanup = ref(instance);
						if (typeof refCleanup === "function") cleanupCallbacks[i] = refCleanup;
						break;
					}
					case "object": ref.current = instance;
				}
			}
			forkRef.cleanup = () => {
				for (let i = 0; i < refs.length; i += 1) {
					const ref = refs[i];
					if (ref == null) continue;
					switch (typeof ref) {
						case "function": {
							const cleanupCallback = cleanupCallbacks[i];
							if (typeof cleanupCallback === "function") cleanupCallback();
							else ref(null);
							break;
						}
						case "object": ref.current = null;
					}
				}
			};
		}
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/reactVersion.mjs
var majorVersion = parseInt("19.3.0", 10);
function isReactVersionAtLeast(reactVersionToCheck) {
	return majorVersion >= reactVersionToCheck;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/getReactElementRef.mjs
/**
* Extracts the `ref` from a React element, handling different React versions.
*/
function getReactElementRef(element) {
	if (!/*#__PURE__*/ import_react.isValidElement(element)) return null;
	const reactElement = element;
	const propsWithRef = reactElement.props;
	return (isReactVersionAtLeast(19) ? propsWithRef?.ref : reactElement.ref) ?? null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/empty.mjs
function NOOP() {}
var EMPTY_ARRAY = Object.freeze([]);
var EMPTY_OBJECT = Object.freeze({});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/getStateAttributesProps.mjs
function getStateAttributesProps(state, customMapping) {
	const props = {};
	for (const key in state) {
		const value = state[key];
		if (customMapping?.hasOwnProperty(key)) {
			const customProps = customMapping[key](value);
			if (customProps != null) Object.assign(props, customProps);
			continue;
		}
		if (value === true) props[`data-${key.toLowerCase()}`] = "";
		else if (value) props[`data-${key.toLowerCase()}`] = value.toString();
	}
	return props;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/resolveClassName.mjs
/**
* If the provided className is a string, it will be returned as is.
* Otherwise, the function will call the className function with the state as the first argument.
*
* @param className
* @param state
*/
function resolveClassName(className, state) {
	return typeof className === "function" ? className(state) : className;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/resolveStyle.mjs
/**
* If the provided style is an object, it will be returned as is.
* Otherwise, the function will call the style function with the state as the first argument.
*
* @param style
* @param state
*/
function resolveStyle(style, state) {
	return typeof style === "function" ? style(state) : style;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useRenderElement.mjs
/**
* Renders a Base UI element.
*
* @param element The default HTML element to render. Can be overridden by the `render` prop.
* @param componentProps An object containing the `render` and `className` props to be used for element customization. Other props are ignored.
* @param params Additional parameters for rendering the element.
*/
function useRenderElement(element, componentProps, params = {}) {
	let renderProp = componentProps.render;
	if (params.enabled !== false) renderProp = unwrapLazyRenderProp(renderProp);
	const outProps = useRenderElementProps(componentProps, params, renderProp);
	if (params.enabled === false) return null;
	const state = params.state ?? EMPTY_OBJECT;
	return evaluateRenderProp(element, renderProp, outProps, state);
}
/**
* Computes render element final props.
*/
function useRenderElementProps(componentProps, params, renderProp) {
	const { className: classNameProp, style: styleProp } = componentProps;
	const { state = EMPTY_OBJECT, ref, props, stateAttributesMapping, enabled = true } = params;
	const className = enabled ? resolveClassName(classNameProp, state) : void 0;
	const style = enabled ? resolveStyle(styleProp, state) : void 0;
	const stateProps = enabled ? getStateAttributesProps(state, stateAttributesMapping) : EMPTY_OBJECT;
	const resolvedProps = enabled && props ? resolveRenderFunctionProps(props) : void 0;
	const outProps = enabled ? mergeObjects(stateProps, resolvedProps) ?? {} : EMPTY_OBJECT;
	if (typeof document !== "undefined") {
		if (!enabled) useMergedRefs(null, null);
		else if (Array.isArray(ref)) outProps.ref = useMergedRefsN([
			outProps.ref,
			getReactElementRef(renderProp),
			...ref
		]);
		else outProps.ref = useMergedRefs(outProps.ref, getReactElementRef(renderProp), ref);
	}
	if (!enabled) return EMPTY_OBJECT;
	if (className !== void 0) outProps.className = mergeClassNames(outProps.className, className);
	if (style !== void 0) outProps.style = mergeObjects(outProps.style, style);
	return outProps;
}
function resolveRenderFunctionProps(props) {
	if (Array.isArray(props)) return mergePropsN(props);
	return mergeProps(void 0, props);
}
var REACT_LAZY_TYPE = Symbol.for("react.lazy");
function unwrapLazyRenderProp(render) {
	if (render?.$$typeof !== REACT_LAZY_TYPE) return render;
	const unwrapped = import_react.Children.toArray(render)[0];
	return /*#__PURE__*/ import_react.isValidElement(unwrapped) ? unwrapped : render;
}
function evaluateRenderProp(element, render, props, state) {
	if (render) {
		if (typeof render === "function") return render(props, state);
		const mergedProps = mergeProps(props, render.props);
		mergedProps.ref = props.ref;
		return /*#__PURE__*/ import_react.cloneElement(render, mergedProps);
	}
	if (element) {
		if (typeof element === "string") return renderTag(element, props);
	}
	throw new Error(formatErrorMessage(8));
}
function renderTag(Tag, props) {
	if (Tag === "button") return /*#__PURE__*/ (0, import_react.createElement)("button", {
		type: "button",
		...props,
		key: props.key
	});
	if (Tag === "img") return /*#__PURE__*/ (0, import_react.createElement)("img", {
		alt: "",
		...props,
		key: props.key
	});
	return /*#__PURE__*/ import_react.createElement(Tag, props);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/button/Button.mjs
/**
* A button component that can be used to trigger actions.
* Renders a `<button>` element.
*
* Documentation: [Base UI Button](https://base-ui.com/react/components/button)
*/
var Button = /*#__PURE__*/ import_react.forwardRef(function Button(componentProps, forwardedRef) {
	const { render, className, disabled = false, focusableWhenDisabled = false, nativeButton = true, style, ...elementProps } = componentProps;
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		focusableWhenDisabled,
		native: nativeButton
	});
	return useRenderElement("button", componentProps, {
		state: { disabled },
		ref: [forwardedRef, buttonRef],
		props: [elementProps, getButtonProps]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/field/control/FieldControlDataAttributes.mjs
/**
* Present when the field is in a valid state.
*/
var valid = "data-valid";
/**
* Present when the field is in an invalid state.
*/
var invalid = "data-invalid";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/field-constants/constants.mjs
var DEFAULT_VALIDITY_STATE = {
	badInput: false,
	customError: false,
	patternMismatch: false,
	rangeOverflow: false,
	rangeUnderflow: false,
	stepMismatch: false,
	tooLong: false,
	tooShort: false,
	typeMismatch: false,
	valid: null,
	valueMissing: false
};
var DEFAULT_FIELD_STATE_ATTRIBUTES = {
	valid: null,
	touched: false,
	dirty: false,
	filled: false,
	focused: false
};
var DEFAULT_FIELD_ROOT_STATE = {
	disabled: false,
	...DEFAULT_FIELD_STATE_ATTRIBUTES
};
var fieldValidityMapping = { valid(value) {
	if (value === null) return null;
	if (value) return { [valid]: "" };
	return { [invalid]: "" };
} };
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/field-root-context/FieldRootContext.mjs
var DEFAULT_FIELD_ROOT_CONTEXT = {
	invalid: void 0,
	name: void 0,
	validityData: {
		state: DEFAULT_VALIDITY_STATE,
		errors: [],
		error: "",
		value: "",
		initialValue: null
	},
	setValidityData: NOOP,
	disabled: void 0,
	setTouched: NOOP,
	setDirty: NOOP,
	setFilled: NOOP,
	setFocused: NOOP,
	validationMode: "onSubmit",
	shouldValidateOnChange: () => false,
	state: DEFAULT_FIELD_ROOT_STATE,
	registerFieldControl: NOOP,
	validation: {
		getValidationProps: (_disabled, props = EMPTY_OBJECT) => props,
		inputRef: { current: null },
		registeredInputs: /* @__PURE__ */ new Map(),
		registerInput: NOOP,
		getInputControl: () => null,
		commit: async () => {},
		change: NOOP
	}
};
var FieldRootContext = /*#__PURE__*/ import_react.createContext(DEFAULT_FIELD_ROOT_CONTEXT);
function useFieldRootContext(optional = true) {
	const context = import_react.useContext(FieldRootContext);
	if (context.setValidityData === NOOP && !optional) throw new Error(formatErrorMessage(28));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/form-context/FormContext.mjs
var FormContext = /*#__PURE__*/ import_react.createContext({
	elementRef: { current: null },
	formRef: { current: { fields: /* @__PURE__ */ new Map() } },
	errors: {},
	clearErrors: NOOP,
	validationMode: "onSubmit",
	submitCountRef: { current: 0 }
});
function useFormContext() {
	return import_react.useContext(FormContext);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useId.mjs
var globalId = 0;
function useGlobalId(idOverride, prefix = "mui") {
	const [defaultId, setDefaultId] = import_react.useState(idOverride);
	const id = idOverride || defaultId;
	import_react.useEffect(() => {
		if (defaultId == null) {
			globalId += 1;
			setDefaultId(`${prefix}-${globalId}`);
		}
	}, [defaultId, prefix]);
	return id;
}
var maybeReactUseId = SafeReact.useId;
/**
*
* @example <div id={useId()} />
* @param idOverride
* @returns {string}
*/
function useId(idOverride, prefix) {
	if (maybeReactUseId !== void 0) {
		const reactId = maybeReactUseId();
		return idOverride ?? (prefix ? `${prefix}-${reactId}` : reactId);
	}
	return useGlobalId(idOverride, prefix);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useBaseUiId.mjs
/**
* Wraps `useId` and prefixes generated `id`s with `base-ui-`
* @param {string | undefined} idOverride overrides the generated id when provided
* @returns {string | undefined}
*/
function useBaseUiId(idOverride) {
	return useId(idOverride, "base-ui");
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/labelable-provider/LabelableContext.mjs
/**
* A context for providing [labelable elements](https://html.spec.whatwg.org/multipage/forms.html#category-label)\
* with an accessible name (label) and description.
*/
var LabelableContext = /*#__PURE__*/ import_react.createContext({
	controlId: void 0,
	registerControlId: NOOP,
	resetControlId: NOOP,
	labelId: void 0,
	setLabelId: NOOP,
	messageIds: [],
	setMessageIds: NOOP,
	getDescriptionProps: (externalProps) => externalProps
});
function useLabelableContext() {
	return import_react.useContext(LabelableContext);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/labelable-provider/useAriaLabelledBy.mjs
var import_jsx_runtime = require_jsx_runtime();
var import_shim = require_shim();
var import_with_selector = require_with_selector();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom(), 1);
function useAriaLabelledBy(explicitAriaLabelledBy, labelId, labelSourceRef, enableFallback = true, labelSourceId) {
	const [fallbackAriaLabelledBy, setFallbackAriaLabelledBy] = import_react.useState();
	const generatedLabelId = useBaseUiId(labelSourceId ? `${labelSourceId}-label` : void 0);
	const ariaLabelledBy = explicitAriaLabelledBy ?? labelId ?? fallbackAriaLabelledBy;
	useIsoLayoutEffect(() => {
		const nextAriaLabelledBy = explicitAriaLabelledBy || labelId || !enableFallback ? void 0 : getAriaLabelledBy(labelSourceRef.current, generatedLabelId);
		if (fallbackAriaLabelledBy !== nextAriaLabelledBy) setFallbackAriaLabelledBy(nextAriaLabelledBy);
	});
	return ariaLabelledBy;
}
function getAriaLabelledBy(labelSource, generatedLabelId) {
	const label = findAssociatedLabel(labelSource);
	if (!label) return;
	if (!label.id && generatedLabelId) label.id = generatedLabelId;
	return label.id || void 0;
}
function findAssociatedLabel(labelSource) {
	if (!labelSource) return;
	const parent = labelSource.parentElement;
	if (parent && parent.tagName === "LABEL") return parent;
	const controlId = labelSource.id;
	if (controlId) {
		const nextSibling = labelSource.nextElementSibling;
		if (nextSibling && nextSibling.htmlFor === controlId) return nextSibling;
	}
	const labels = labelSource.labels;
	return labels && labels[0];
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/labelable-provider/useLabelableId.mjs
function useLabelableId(params = {}) {
	const { id, enabled = true } = params;
	const { controlId, registerControlId, resetControlId } = useLabelableContext();
	const defaultId = useBaseUiId();
	const controlSourceRef = useRefWithInit(() => Symbol());
	const hasRegisteredRef = import_react.useRef(false);
	const hadExplicitIdRef = import_react.useRef(false);
	const unregisterControlId = useStableCallback(() => {
		if (!hasRegisteredRef.current || registerControlId === NOOP) return;
		hasRegisteredRef.current = false;
		registerControlId(controlSourceRef.current, void 0);
	});
	useIsoLayoutEffect(() => {
		if (!enabled || registerControlId === NOOP) {
			unregisterControlId();
			return;
		}
		let nextId;
		if (id !== void 0) {
			hadExplicitIdRef.current = true;
			nextId = id;
		} else if (hadExplicitIdRef.current) nextId = defaultId;
		else {
			resetControlId();
			return;
		}
		if (nextId === void 0) {
			unregisterControlId();
			return;
		}
		hasRegisteredRef.current = true;
		registerControlId(controlSourceRef.current, nextId);
	}, [
		id,
		enabled,
		registerControlId,
		resetControlId,
		defaultId,
		controlSourceRef,
		unregisterControlId
	]);
	useIsoLayoutEffect(() => {
		return unregisterControlId;
	}, [unregisterControlId]);
	return (enabled ? controlId : void 0) ?? id ?? defaultId;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/platform/shared.mjs
/**
* Reads `navigator.userAgent` / `navigator.platform` (legacy but universally
* supported) into a normalized shape. In development, prefers the modern
* `navigator.userAgentData` API on Chromium to avoid DevTools warnings about
* the deprecated reads; that branch is dead-code-eliminated in production
* builds to keep the bundle small.
*
* Returns empty/zero values when `navigator` is undefined (SSR), so every
* derived flag safely evaluates to `false`.
*/
function readRawData() {
	if (typeof navigator === "undefined") return {
		userAgent: "",
		platform: "",
		maxTouchPoints: 0
	};
	return {
		userAgent: navigator.userAgent,
		platform: navigator.platform ?? "",
		maxTouchPoints: navigator.maxTouchPoints ?? 0
	};
}
var { userAgent, platform: platform$1, maxTouchPoints } = readRawData();
var lowerUserAgent = userAgent.toLowerCase();
var lowerPlatform = platform$1.toLowerCase();
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/platform/os.mjs
/** iPhone, iPad (including iPadOS 13+ reporting as macOS), iPod. */
var ios = /^i(os$|p)/.test(lowerPlatform) || lowerPlatform === "macintel" && maxTouchPoints > 1;
/** Android phones, tablets, and embedded Android browsers. */
var ANDROID_STRING = "android";
var android = lowerPlatform === ANDROID_STRING || lowerUserAgent.includes(ANDROID_STRING);
/** macOS desktop. Excludes iPadOS, which reports as `MacIntel`. */
var mac = !ios && lowerPlatform.startsWith("mac");
lowerPlatform.startsWith("win");
!android && /^(linux|chrome os)/.test(lowerPlatform);
/** Any Apple OS (`mac || ios`). */
var apple = mac || ios;
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/platform/engine.mjs
/** WebKit: Safari, all iOS browsers, GNOME Web. Excludes Blink. */
var webkit = typeof CSS !== "undefined" && !!CSS.supports?.("-webkit-backdrop-filter:none");
/** Gecko: Firefox. */
var gecko = !webkit && lowerUserAgent.includes("firefox");
!webkit && lowerUserAgent.includes("chrom");
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/platform/screen-reader.mjs
/**
* The user *may* be using VoiceOver — actual activation is not detectable.
* True on any Apple platform (macOS, iOS, iPadOS).
*/
var voiceOver = apple;
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/platform/env.mjs
/** Running in jsdom or HappyDOM (used by unit tests). */
var jsdom = /jsdom|happydom/.test(lowerUserAgent);
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/shadowDom.mjs
function activeElement(doc) {
	let element = doc.activeElement;
	while (element?.shadowRoot?.activeElement != null) element = element.shadowRoot.activeElement;
	return element;
}
function contains(parent, child) {
	if (!parent || !child) return false;
	const rootNode = child.getRootNode?.();
	if (parent.contains(child)) return true;
	if (rootNode && isShadowRoot(rootNode)) {
		let next = child;
		while (next) {
			if (parent === next) return true;
			next = next.parentNode || next.host;
		}
	}
	return false;
}
function getTarget(event) {
	if ("composedPath" in event) return event.composedPath()[0] ?? event.target;
	return event.target;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/constants.mjs
var FOCUSABLE_ATTRIBUTE = "data-base-ui-focusable";
var TYPEABLE_SELECTOR = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
var ARROW_LEFT$1 = "ArrowLeft";
var ARROW_RIGHT$1 = "ArrowRight";
var ARROW_UP$1 = "ArrowUp";
var ARROW_DOWN$1 = "ArrowDown";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/TransitionStatusDataAttributes.mjs
/**
* Present when the component begins animating in.
*/
var startingStyle$2 = "data-starting-style";
/**
* Present when the component is animating out.
*/
var endingStyle$2 = "data-ending-style";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/stateAttributesMapping.mjs
var STARTING_HOOK = { [startingStyle$2]: "" };
var ENDING_HOOK = { [endingStyle$2]: "" };
var transitionStatusMapping = { transitionStatus(value) {
	if (value === "starting") return STARTING_HOOK;
	if (value === "ending") return ENDING_HOOK;
	return null;
} };
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/CommonPopupDataAttributes.mjs
/**
* Present when the popup is open.
*/
var open$1 = "data-open";
/**
* Present when the popup is closed.
*/
var closed$1 = "data-closed";
/**
* Present when the anchor is hidden.
*/
var anchorHidden = "data-anchor-hidden";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/CommonTriggerDataAttributes.mjs
/**
* Present when the popup is open.
*/
var popupOpen$3 = "data-popup-open";
/**
* Present when a pressable trigger is pressed.
*/
var pressed$2 = "data-pressed";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popupStateMapping.mjs
var TRIGGER_HOOK = { [popupOpen$3]: "" };
var PRESSABLE_TRIGGER_HOOK = {
	[popupOpen$3]: "",
	[pressed$2]: ""
};
var POPUP_OPEN_HOOK = { [open$1]: "" };
var POPUP_CLOSED_HOOK = { [closed$1]: "" };
var ANCHOR_HIDDEN_HOOK = { [anchorHidden]: "" };
var triggerOpenStateMapping = { open(value) {
	if (value) return TRIGGER_HOOK;
	return null;
} };
var pressableTriggerOpenStateMapping = { open(value) {
	if (value) return PRESSABLE_TRIGGER_HOOK;
	return null;
} };
var popupStateMapping = {
	open(value) {
		if (value) return POPUP_OPEN_HOOK;
		return POPUP_CLOSED_HOOK;
	},
	anchorHidden(value) {
		if (value) return ANCHOR_HIDDEN_HOOK;
		return null;
	}
};
var popupTransitionStateMapping = {
	...popupStateMapping,
	...transitionStatusMapping
};
/**
* Present when the trigger is disabled, either by the `disabled` prop or by a parent `<Tooltip.Root>` component.
*/
var triggerDisabled = "data-trigger-disabled";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/element.mjs
function isTargetInsideEnabledTrigger(target, triggerElements) {
	if (!isElement(target)) return false;
	const targetElement = target;
	if (triggerElements.hasElement(targetElement)) return !targetElement.hasAttribute(triggerDisabled);
	for (const [, trigger] of triggerElements.entries()) if (contains(trigger, targetElement)) return !trigger.hasAttribute(triggerDisabled);
	return false;
}
function isEventTargetWithin(event, node) {
	if (node == null) return false;
	if ("composedPath" in event) return event.composedPath().includes(node);
	const eventAgain = event;
	return eventAgain.target != null && node.contains(eventAgain.target);
}
function isRootElement(element) {
	return element.matches("html,body");
}
function isTypeableElement(element) {
	return isHTMLElement(element) && element.matches("input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])");
}
function isInteractiveElement(element) {
	return element?.closest(`button,a[href],[role="button"],select,[tabindex]:not([tabindex="-1"]),${TYPEABLE_SELECTOR}`) != null;
}
function isTypeableCombobox(element) {
	if (!element) return false;
	return element.getAttribute("role") === "combobox" && isTypeableElement(element);
}
function matchesFocusVisible(element) {
	if (!element || jsdom) return true;
	try {
		return element.matches(":focus-visible");
	} catch (_e) {
		return true;
	}
}
function getFloatingFocusElement(floatingElement) {
	if (!floatingElement) return null;
	return floatingElement.hasAttribute("data-base-ui-focusable") ? floatingElement : floatingElement.querySelector(`[data-base-ui-focusable]`) || floatingElement;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/nodes.mjs
function getNodeChildren(nodes, id, onlyOpenChildren = true) {
	return nodes.filter((node) => node.parentId === id).flatMap((child) => [...!onlyOpenChildren || child.context?.open ? [child] : [], ...getNodeChildren(nodes, child.id, onlyOpenChildren)]);
}
function getNodeAncestors(nodes, id) {
	let allAncestors = [];
	let currentParentId = nodes.find((node) => node.id === id)?.parentId;
	while (currentParentId) {
		const currentNode = nodes.find((node) => node.id === currentParentId);
		currentParentId = currentNode?.parentId;
		if (currentNode) allAncestors = allAncestors.concat(currentNode);
	}
	return allAncestors;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/event.mjs
function stopEvent(event) {
	event.preventDefault();
	event.stopPropagation();
}
function isReactEvent(event) {
	return "nativeEvent" in event;
}
function isVirtualClick(event) {
	if (event.pointerType === "" && event.isTrusted) return true;
	if (android && event.pointerType) return event.type === "click" && event.buttons === 1;
	return event.detail === 0 && !event.pointerType;
}
function isVirtualPointerEvent(event) {
	if (jsdom) return false;
	return !android && event.width === 0 && event.height === 0 || android && event.width === 1 && event.height === 1 && event.pressure === 0 && event.detail === 0 && event.pointerType === "mouse" || event.width < 1 && event.height < 1 && event.pressure === 0 && event.detail === 0 && event.pointerType === "touch";
}
function isMouseLikePointerType(pointerType, strict) {
	const values = ["mouse", "pen"];
	if (!strict) values.push("", void 0);
	return values.includes(pointerType);
}
function isClickLikeEvent(event) {
	const type = event.type;
	return type === "click" || type === "mousedown" || type === "keydown" || type === "keyup";
}
//#endregion
//#region node_modules/.pnpm/@floating-ui+utils@0.2.12/node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var min = Math.min;
var max = Math.max;
var round = Math.round;
var floor = Math.floor;
var createCoords = (v) => ({
	x: v,
	y: v
});
var oppositeSideMap = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function clamp$1(start, value, end) {
	return max(start, min(value, end));
}
function evaluate(value, param) {
	return typeof value === "function" ? value(param) : value;
}
function getSide(placement) {
	return placement.split("-")[0];
}
function getAlignment(placement) {
	return placement.split("-")[1];
}
function getOppositeAxis(axis) {
	return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
	return axis === "y" ? "height" : "width";
}
function getSideAxis(placement) {
	const firstChar = placement[0];
	return firstChar === "t" || firstChar === "b" ? "y" : "x";
}
function getAlignmentAxis(placement) {
	return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
	if (rtl === void 0) rtl = false;
	const alignment = getAlignment(placement);
	const alignmentAxis = getAlignmentAxis(placement);
	const length = getAxisLength(alignmentAxis);
	let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
	if (rects.reference[length] > rects.floating[length]) mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
	return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
	const oppositePlacement = getOppositePlacement(placement);
	return [
		getOppositeAlignmentPlacement(placement),
		oppositePlacement,
		getOppositeAlignmentPlacement(oppositePlacement)
	];
}
function getOppositeAlignmentPlacement(placement) {
	return placement.includes("start") ? placement.replace("start", "end") : placement.replace("end", "start");
}
var lrPlacement = ["left", "right"];
var rlPlacement = ["right", "left"];
var tbPlacement = ["top", "bottom"];
var btPlacement = ["bottom", "top"];
function getSideList(side, isStart, rtl) {
	switch (side) {
		case "top":
		case "bottom":
			if (rtl) return isStart ? rlPlacement : lrPlacement;
			return isStart ? lrPlacement : rlPlacement;
		case "left":
		case "right": return isStart ? tbPlacement : btPlacement;
		default: return [];
	}
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
	const alignment = getAlignment(placement);
	let list = getSideList(getSide(placement), direction === "start", rtl);
	if (alignment) {
		list = list.map((side) => side + "-" + alignment);
		if (flipAlignment) list = list.concat(list.map(getOppositeAlignmentPlacement));
	}
	return list;
}
function getOppositePlacement(placement) {
	const side = getSide(placement);
	return oppositeSideMap[side] + placement.slice(side.length);
}
function expandPaddingObject(padding) {
	var _padding$top, _padding$right, _padding$bottom, _padding$left;
	return {
		top: (_padding$top = padding.top) != null ? _padding$top : 0,
		right: (_padding$right = padding.right) != null ? _padding$right : 0,
		bottom: (_padding$bottom = padding.bottom) != null ? _padding$bottom : 0,
		left: (_padding$left = padding.left) != null ? _padding$left : 0
	};
}
function getPaddingObject(padding) {
	return typeof padding !== "number" ? expandPaddingObject(padding) : {
		top: padding,
		right: padding,
		bottom: padding,
		left: padding
	};
}
function rectToClientRect(rect) {
	const { x, y, width, height } = rect;
	return {
		width,
		height,
		top: y,
		left: x,
		right: x + width,
		bottom: y + height,
		x,
		y
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/composite.mjs
function isDifferentGridRow(index, cols, prevRow) {
	return Math.floor(index / cols) !== prevRow;
}
function isIndexOutOfListBounds(list, index) {
	return index < 0 || index >= list.length;
}
function getMinListIndex(listRef, disabledIndices) {
	return findNonDisabledListIndex(listRef.current, { disabledIndices });
}
function getMaxListIndex(listRef, disabledIndices) {
	return findNonDisabledListIndex(listRef.current, {
		decrement: true,
		startingIndex: listRef.current.length,
		disabledIndices
	});
}
function findNonDisabledListIndex(list, { startingIndex = -1, decrement = false, disabledIndices, amount = 1 } = {}) {
	let index = startingIndex;
	do
		index += decrement ? -amount : amount;
	while (index >= 0 && index <= list.length - 1 && isListIndexDisabled(list, index, disabledIndices));
	return index;
}
function getGridNavigatedIndex(list, { event, orientation, loopFocus, onLoop, rtl, cols, disabledIndices, minIndex, maxIndex, prevIndex, stopEvent: stop = false }) {
	let nextIndex = prevIndex;
	let verticalDirection;
	if (event.key === "ArrowUp") verticalDirection = "up";
	else if (event.key === "ArrowDown") verticalDirection = "down";
	if (verticalDirection) {
		const rows = [];
		const rowIndexMap = [];
		let hasRoleRow = false;
		let visibleItemCount = 0;
		{
			let currentRowEl = null;
			let currentRowIndex = -1;
			list.forEach((el, idx) => {
				if (el == null) return;
				visibleItemCount += 1;
				const rowEl = el.closest("[role=\"row\"]");
				if (rowEl) hasRoleRow = true;
				if (rowEl !== currentRowEl || currentRowIndex === -1) {
					currentRowEl = rowEl;
					currentRowIndex += 1;
					rows[currentRowIndex] = [];
				}
				rows[currentRowIndex].push(idx);
				rowIndexMap[idx] = currentRowIndex;
			});
		}
		let hasDomRows = false;
		let inferredDomCols = 0;
		if (hasRoleRow) for (const row of rows) {
			const rowLength = row.length;
			if (rowLength > inferredDomCols) inferredDomCols = rowLength;
			if (rowLength !== cols) hasDomRows = true;
		}
		const hasVirtualizedGaps = hasDomRows && visibleItemCount < list.length;
		const verticalCols = inferredDomCols || cols;
		const navigateVertically = (direction) => {
			if (!hasDomRows || prevIndex === -1) return;
			const currentRow = rowIndexMap[prevIndex];
			if (currentRow == null) return;
			const colInRow = rows[currentRow].indexOf(prevIndex);
			const step = direction === "up" ? -1 : 1;
			for (let nextRow = currentRow + step, i = 0; i < rows.length; i += 1, nextRow += step) {
				if (nextRow < 0 || nextRow >= rows.length) {
					if (!loopFocus || hasVirtualizedGaps) return;
					nextRow = nextRow < 0 ? rows.length - 1 : 0;
					if (onLoop) {
						const clampedCol = Math.min(colInRow, rows[nextRow].length - 1);
						const returnedItemIndex = onLoop(event, prevIndex, rows[nextRow][clampedCol] ?? rows[nextRow][0]);
						nextRow = rowIndexMap[returnedItemIndex] ?? nextRow;
					}
				}
				const targetRow = rows[nextRow];
				for (let col = Math.min(colInRow, targetRow.length - 1); col >= 0; col -= 1) {
					const candidate = targetRow[col];
					if (!isListIndexDisabled(list, candidate, disabledIndices)) return candidate;
				}
			}
		};
		const navigateVerticallyWithInferredRows = (direction) => {
			if (!hasVirtualizedGaps || prevIndex === -1) return;
			const colInRow = prevIndex % verticalCols;
			const rowStep = direction === "up" ? -verticalCols : verticalCols;
			const lastRowStart = maxIndex - maxIndex % verticalCols;
			const rowCount = floor(maxIndex / verticalCols) + 1;
			for (let rowStart = prevIndex - colInRow + rowStep, i = 0; i < rowCount; i += 1, rowStart += rowStep) {
				if (rowStart < 0 || rowStart > maxIndex) {
					if (!loopFocus) return;
					rowStart = rowStart < 0 ? lastRowStart : 0;
				}
				const rowEnd = Math.min(rowStart + verticalCols - 1, maxIndex);
				for (let candidate = Math.min(rowStart + colInRow, rowEnd); candidate >= rowStart; candidate -= 1) if (!isListIndexDisabled(list, candidate, disabledIndices)) return candidate;
			}
		};
		if (stop) stopEvent(event);
		const verticalCandidate = navigateVertically(verticalDirection) ?? navigateVerticallyWithInferredRows(verticalDirection);
		if (verticalCandidate !== void 0) nextIndex = verticalCandidate;
		else if (prevIndex === -1) nextIndex = verticalDirection === "up" ? maxIndex : minIndex;
		else {
			nextIndex = findNonDisabledListIndex(list, {
				startingIndex: prevIndex,
				amount: verticalCols,
				decrement: verticalDirection === "up",
				disabledIndices
			});
			if (loopFocus) {
				if (verticalDirection === "up" && (prevIndex - verticalCols < minIndex || nextIndex < 0)) {
					const col = prevIndex % verticalCols;
					const maxCol = maxIndex % verticalCols;
					const offset = maxIndex - (maxCol - col);
					if (maxCol === col) nextIndex = maxIndex;
					else nextIndex = maxCol > col ? offset : offset - verticalCols;
					if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
				}
				if (verticalDirection === "down" && prevIndex + verticalCols > maxIndex) {
					nextIndex = findNonDisabledListIndex(list, {
						startingIndex: prevIndex % verticalCols - verticalCols,
						amount: verticalCols,
						disabledIndices
					});
					if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
				}
			}
		}
		if (isIndexOutOfListBounds(list, nextIndex)) nextIndex = prevIndex;
	}
	if (orientation === "both") {
		const prevRow = floor(prevIndex / cols);
		if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) {
			if (stop) stopEvent(event);
			if (prevIndex % cols !== cols - 1) {
				nextIndex = findNonDisabledListIndex(list, {
					startingIndex: prevIndex,
					disabledIndices
				});
				if (loopFocus && isDifferentGridRow(nextIndex, cols, prevRow)) {
					nextIndex = findNonDisabledListIndex(list, {
						startingIndex: prevIndex - prevIndex % cols - 1,
						disabledIndices
					});
					if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
				}
			} else if (loopFocus) {
				nextIndex = findNonDisabledListIndex(list, {
					startingIndex: prevIndex - prevIndex % cols - 1,
					disabledIndices
				});
				if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
			}
			if (isDifferentGridRow(nextIndex, cols, prevRow)) nextIndex = prevIndex;
		}
		if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) {
			if (stop) stopEvent(event);
			if (prevIndex % cols !== 0) {
				nextIndex = findNonDisabledListIndex(list, {
					startingIndex: prevIndex,
					decrement: true,
					disabledIndices
				});
				if (loopFocus && isDifferentGridRow(nextIndex, cols, prevRow)) {
					nextIndex = findNonDisabledListIndex(list, {
						startingIndex: prevIndex + (cols - prevIndex % cols),
						decrement: true,
						disabledIndices
					});
					if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
				}
			} else if (loopFocus) {
				nextIndex = findNonDisabledListIndex(list, {
					startingIndex: prevIndex + (cols - prevIndex % cols),
					decrement: true,
					disabledIndices
				});
				if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
			}
			if (isDifferentGridRow(nextIndex, cols, prevRow)) nextIndex = prevIndex;
		}
		const lastRow = floor(maxIndex / cols) === prevRow;
		if (isIndexOutOfListBounds(list, nextIndex)) {
			if (loopFocus && lastRow) {
				nextIndex = event.key === (rtl ? "ArrowRight" : "ArrowLeft") ? maxIndex : findNonDisabledListIndex(list, {
					startingIndex: prevIndex - prevIndex % cols - 1,
					disabledIndices
				});
				if (onLoop) nextIndex = onLoop(event, prevIndex, nextIndex);
			} else nextIndex = prevIndex;
		}
	}
	return nextIndex;
}
function isListIndexDisabled(list, index, disabledIndices) {
	if (typeof disabledIndices === "function" ? disabledIndices(index) : disabledIndices?.includes(index) ?? false) return true;
	const element = list[index];
	if (!element) return false;
	if (!isElementVisible(element)) return true;
	if (element.matches(":disabled")) return true;
	return !disabledIndices && (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true");
}
function isHiddenByStyles(styles) {
	return styles.visibility === "hidden" || styles.visibility === "collapse";
}
function isElementVisible(element, styles = element ? getComputedStyle$1(element) : null) {
	if (!element || !element.isConnected || !styles || isHiddenByStyles(styles)) return false;
	if (typeof element.checkVisibility === "function") return element.checkVisibility();
	return styles.display !== "none" && styles.display !== "contents";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/tabbable.mjs
var CANDIDATE_SELECTOR = "a[href],button,input,select,textarea,summary,details,iframe,object,embed,[tabindex],[contenteditable]:not([contenteditable=\"false\"]),audio[controls],video[controls]";
function getParentElement(element) {
	const assignedSlot = element.assignedSlot;
	if (assignedSlot) return assignedSlot;
	if (element.parentElement) return element.parentElement;
	const rootNode = element.getRootNode();
	return isShadowRoot(rootNode) ? rootNode.host : null;
}
function getDetailsSummary(details) {
	for (const child of Array.from(details.children)) if (getNodeName(child) === "summary") return child;
	return null;
}
function isWithinOpenDetailsSummary(element, details) {
	const summary = getDetailsSummary(details);
	return !!summary && (element === summary || contains(summary, element));
}
function isFocusableCandidate(element) {
	const nodeName = element ? getNodeName(element) : "";
	return element != null && element.matches(CANDIDATE_SELECTOR) && (nodeName !== "summary" || element.parentElement != null && getNodeName(element.parentElement) === "details" && getDetailsSummary(element.parentElement) === element) && (nodeName !== "details" || getDetailsSummary(element) == null) && (nodeName !== "input" || element.type !== "hidden");
}
function isFocusableElement(element) {
	if (!isFocusableCandidate(element) || !element.isConnected || element.matches(":disabled")) return false;
	for (let current = element; current; current = getParentElement(current)) {
		const isAncestor = current !== element;
		const isSlot = getNodeName(current) === "slot";
		if (current.hasAttribute("inert")) return false;
		if (isAncestor && getNodeName(current) === "details" && !current.open && !isWithinOpenDetailsSummary(element, current) || current.hasAttribute("hidden") || !isSlot && !isVisibleInTabbableTree(current, isAncestor)) return false;
	}
	return true;
}
function isVisibleInTabbableTree(element, isAncestor) {
	const styles = getComputedStyle$1(element);
	if (!isAncestor) return isElementVisible(element, styles);
	return styles.display !== "none";
}
function getTabIndex(element) {
	const tabIndex = element.tabIndex;
	if (tabIndex < 0) {
		const nodeName = getNodeName(element);
		if (nodeName === "details" || nodeName === "audio" || nodeName === "video" || isHTMLElement(element) && element.isContentEditable) return 0;
	}
	return tabIndex;
}
function getNamedRadioInput(element) {
	if (getNodeName(element) !== "input") return null;
	const input = element;
	return input.type === "radio" && input.name !== "" ? input : null;
}
function isTabbableRadio(element, candidates) {
	const input = getNamedRadioInput(element);
	if (!input) return true;
	const checkedRadio = candidates.find((candidate) => {
		const radio = getNamedRadioInput(candidate);
		return radio?.name === input.name && radio.form === input.form && radio.checked;
	});
	if (checkedRadio) return checkedRadio === input;
	return candidates.find((candidate) => {
		const radio = getNamedRadioInput(candidate);
		return radio?.name === input.name && radio.form === input.form;
	}) === input;
}
function getComposedChildren(container) {
	if (isHTMLElement(container) && getNodeName(container) === "slot") {
		const assignedElements = container.assignedElements({ flatten: true });
		if (assignedElements.length > 0) return assignedElements;
	}
	if (isHTMLElement(container) && container.shadowRoot) return Array.from(container.shadowRoot.children);
	return Array.from(container.children);
}
function appendCandidates(container, list) {
	getComposedChildren(container).forEach((child) => {
		if (isFocusableCandidate(child)) list.push(child);
		appendCandidates(child, list);
	});
}
function appendMatchingElements(container, selector, list) {
	getComposedChildren(container).forEach((child) => {
		if (isHTMLElement(child) && child.matches(selector)) list.push(child);
		appendMatchingElements(child, selector, list);
	});
}
function isTabbable(element) {
	return isFocusableElement(element) && getTabIndex(element) >= 0;
}
function focusable(container) {
	const candidates = [];
	appendCandidates(container, candidates);
	return candidates.filter(isFocusableElement);
}
function tabbable(container) {
	const candidates = focusable(container);
	return candidates.filter((element) => getTabIndex(element) >= 0 && isTabbableRadio(element, candidates));
}
function getTabbableIn(container, dir) {
	const list = tabbable(container);
	const len = list.length;
	if (len === 0) return;
	const active = activeElement(ownerDocument(container));
	const index = list.indexOf(active);
	return list[index === -1 ? dir === 1 ? 0 : len - 1 : index + dir];
}
function getNextTabbable(referenceElement) {
	return getTabbableIn(ownerDocument(referenceElement).body, 1) || referenceElement;
}
function getPreviousTabbable(referenceElement) {
	return getTabbableIn(ownerDocument(referenceElement).body, -1) || referenceElement;
}
function getTabbableNearElement(referenceElement, dir) {
	if (!referenceElement) return null;
	const list = tabbable(ownerDocument(referenceElement).body);
	const elementCount = list.length;
	if (elementCount === 0) return null;
	const index = list.indexOf(referenceElement);
	if (index === -1) return null;
	return list[(index + dir + elementCount) % elementCount];
}
function getTabbableAfterElement(referenceElement) {
	return getTabbableNearElement(referenceElement, 1);
}
function getTabbableBeforeElement(referenceElement) {
	return getTabbableNearElement(referenceElement, -1);
}
function isOutsideEvent(event, container) {
	const containerElement = container || event.currentTarget;
	const relatedTarget = event.relatedTarget;
	return !relatedTarget || !contains(containerElement, relatedTarget);
}
function disableFocusInside(container) {
	tabbable(container).forEach((element) => {
		element.dataset.tabindex = element.getAttribute("tabindex") || "";
		element.setAttribute("tabindex", "-1");
	});
}
function enableFocusInside(container) {
	const elements = [];
	appendMatchingElements(container, "[data-tabindex]", elements);
	elements.forEach((element) => {
		const tabindex = element.dataset.tabindex;
		delete element.dataset.tabindex;
		if (tabindex) element.setAttribute("tabindex", tabindex);
		else element.removeAttribute("tabindex");
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useOnMount.mjs
/**
* A React.useEffect equivalent that runs once, when the component is mounted.
*/
function useOnMount(fn) {
	import_react.useEffect(fn, EMPTY_ARRAY);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useTimeout.mjs
var EMPTY$1 = 0;
var Timeout = class Timeout {
	static create() {
		return new Timeout();
	}
	currentId = EMPTY$1;
	/**
	* Executes `fn` after `delay`, clearing any previously scheduled call.
	*/
	start(delay, fn) {
		this.clear();
		this.currentId = setTimeout(() => {
			this.currentId = EMPTY$1;
			fn();
		}, delay);
	}
	isStarted() {
		return this.currentId !== EMPTY$1;
	}
	clear = () => {
		if (this.currentId !== EMPTY$1) {
			clearTimeout(this.currentId);
			this.currentId = EMPTY$1;
		}
	};
	disposeEffect = () => {
		return this.clear;
	};
};
/**
* A `setTimeout` with automatic cleanup and guard.
*/
function useTimeout() {
	const timeout = useRefWithInit(Timeout.create).current;
	useOnMount(timeout.disposeEffect);
	return timeout;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/field/item/FieldItemContext.mjs
var FieldItemContext = /*#__PURE__*/ import_react.createContext({ disabled: false });
function useFieldItemContext() {
	return import_react.useContext(FieldItemContext);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useAnimationFrame.mjs
/** Unlike `setTimeout`, rAF doesn't guarantee a positive integer return value, so we can't have
* a monomorphic `uint` type with `0` meaning empty.
* See warning note at:
* https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame#return_value */
var EMPTY = null;
globalThis.requestAnimationFrame;
var Scheduler = class {
	callbacks = [];
	callbacksCount = 0;
	nextId = 1;
	startId = 1;
	isScheduled = false;
	tick = (timestamp) => {
		this.isScheduled = false;
		const currentCallbacks = this.callbacks;
		const currentCallbacksCount = this.callbacksCount;
		this.callbacks = [];
		this.callbacksCount = 0;
		this.startId = this.nextId;
		if (currentCallbacksCount > 0) for (let i = 0; i < currentCallbacks.length; i += 1) currentCallbacks[i]?.(timestamp);
	};
	request(fn) {
		const id = this.nextId;
		this.nextId += 1;
		this.callbacks.push(fn);
		this.callbacksCount += 1;
		if (!this.isScheduled || false) {
			requestAnimationFrame(this.tick);
			this.isScheduled = true;
		}
		return id;
	}
	cancel(id) {
		const index = id - this.startId;
		if (index < 0 || index >= this.callbacks.length) return;
		if (this.callbacks[index] === null) return;
		this.callbacks[index] = null;
		this.callbacksCount -= 1;
	}
};
var scheduler = new Scheduler();
var AnimationFrame = class AnimationFrame {
	static create() {
		return new AnimationFrame();
	}
	static request(fn) {
		return scheduler.request(fn);
	}
	static cancel(id) {
		return scheduler.cancel(id);
	}
	currentId = EMPTY;
	/**
	* Executes `fn` after `delay`, clearing any previously scheduled call.
	*/
	request(fn) {
		this.cancel();
		this.currentId = scheduler.request(() => {
			this.currentId = EMPTY;
			fn();
		});
	}
	cancel = () => {
		if (this.currentId !== EMPTY) {
			scheduler.cancel(this.currentId);
			this.currentId = EMPTY;
		}
	};
	disposeEffect = () => {
		return this.cancel;
	};
};
/**
* A `requestAnimationFrame` with automatic cleanup and guard.
*/
function useAnimationFrame() {
	const timeout = useRefWithInit(AnimationFrame.create).current;
	useOnMount(timeout.disposeEffect);
	return timeout;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/resolveRef.mjs
/**
* If the provided argument is a ref object, returns its `current` value.
* Otherwise, returns the argument itself.
*/
function resolveRef(maybeRef) {
	if (maybeRef == null) return maybeRef;
	return "current" in maybeRef ? maybeRef.current : maybeRef;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useAnimationsFinished.mjs
var pendingCallbacks = null;
/**
* Runs the callback in a synchronous flush before the browser paints, so that the
* browser doesn't paint an intermediate frame: https://github.com/mui/base-ui/issues/979
* Callbacks that become ready within the same microtask checkpoint (e.g. multiple elements
* whose animations finish together) are batched into a single commit:
* https://github.com/mui/base-ui/issues/5481
*/
function flushBeforePaint(fn) {
	if (!pendingCallbacks) {
		const callbacks = [];
		pendingCallbacks = callbacks;
		queueMicrotask(() => {
			pendingCallbacks = null;
			import_react_dom.flushSync(() => {
				for (const callback of callbacks) callback();
			});
		});
	}
	pendingCallbacks.push(fn);
}
/**
* Executes a function once all animations have finished on the provided element.
* If an animation is canceled, waits for any replacement animations before executing.
* @param elementOrRef - The element to watch for animations.
* @param waitForStartingStyleRemoved - Whether to wait for [data-starting-style] to be removed before checking for animations.
* @param batch - Whether completions ready in the same microtask may be coalesced into a single
* commit. A batched callback runs before earlier callbacks' React updates have committed, so only
* opt in when the callback doesn't read state that another completion can change.
* @returns A function that takes a callback to execute once all animations have finished, and an optional AbortSignal to abort the callback
*/
function useAnimationsFinished(elementOrRef, waitForStartingStyleRemoved = false, batch = false) {
	const frame = useAnimationFrame();
	return useStableCallback((fnToExecute, signal = null) => {
		frame.cancel();
		const element = resolveRef(elementOrRef);
		if (element == null) return;
		const resolvedElement = element;
		const done = () => {
			if (!batch) {
				import_react_dom.flushSync(fnToExecute);
				return;
			}
			flushBeforePaint(() => {
				if (!signal?.aborted) fnToExecute();
			});
		};
		if (typeof resolvedElement.getAnimations !== "function" || globalThis.BASE_UI_ANIMATIONS_DISABLED) {
			fnToExecute();
			return;
		}
		function exec() {
			Promise.all(resolvedElement.getAnimations().map((animation) => animation.finished)).then(() => {
				if (!signal?.aborted) done();
			}, () => {
				if (signal?.aborted) return;
				if (resolvedElement.getAnimations().some((animation) => animation.pending || animation.playState !== "finished")) {
					exec();
					return;
				}
				done();
			});
		}
		if (waitForStartingStyleRemoved) {
			const startingStyleAttribute = startingStyle$2;
			if (!resolvedElement.hasAttribute(startingStyleAttribute)) {
				frame.request(exec);
				return;
			}
			const attributeObserver = new MutationObserver(() => {
				if (!resolvedElement.hasAttribute(startingStyleAttribute)) {
					attributeObserver.disconnect();
					exec();
				}
			});
			attributeObserver.observe(resolvedElement, {
				attributes: true,
				attributeFilter: [startingStyleAttribute]
			});
			signal?.addEventListener("abort", () => attributeObserver.disconnect(), { once: true });
			return;
		}
		frame.request(exec);
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useOpenChangeComplete.mjs
/**
* Calls the provided function when the CSS open/close animation or transition completes.
*/
function useOpenChangeComplete(parameters) {
	const { enabled = true, open, ref, batch = false, onComplete: onCompleteParam } = parameters;
	const onComplete = useStableCallback(onCompleteParam);
	const runOnceAnimationsFinish = useAnimationsFinished(ref, open, batch);
	import_react.useEffect(() => {
		if (!enabled) return;
		const abortController = new AbortController();
		runOnceAnimationsFinish(onComplete, abortController.signal);
		return () => {
			abortController.abort();
		};
	}, [
		enabled,
		open,
		onComplete,
		runOnceAnimationsFinish
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useTransitionStatus.mjs
/**
* Provides a status string for CSS animations.
* @param open - a boolean that determines if the element is open.
* @param enableIdleState - a boolean that enables the `'idle'` state between `'starting'` and `'ending'`
* @param deferEndingState - a boolean that delays the `'ending'` state by a frame
* @param animateInitialOpen - a boolean that makes an element which mounts already open still go
*   through `'starting'`. Off by default so content that was open on the first render (a
*   `defaultOpen` popup on page load, SSR'd markup) doesn't animate in.
*/
function useTransitionStatus(open, enableIdleState = false, deferEndingState = false, animateInitialOpen = false) {
	const [transitionStatus, setTransitionStatus] = import_react.useState(open && enableIdleState ? "idle" : void 0);
	const [mounted, setMounted] = import_react.useState(open && !animateInitialOpen);
	if (open && !mounted) {
		setMounted(true);
		setTransitionStatus("starting");
	}
	if (!open && mounted && transitionStatus !== "ending" && !deferEndingState) setTransitionStatus("ending");
	if (!open && !mounted && transitionStatus === "ending") setTransitionStatus(void 0);
	useIsoLayoutEffect(() => {
		if (!open && mounted && transitionStatus !== "ending" && deferEndingState) {
			const frame = AnimationFrame.request(() => {
				setTransitionStatus("ending");
			});
			return () => {
				AnimationFrame.cancel(frame);
			};
		}
	}, [
		open,
		mounted,
		transitionStatus,
		deferEndingState
	]);
	useIsoLayoutEffect(() => {
		if (!open || enableIdleState) return;
		const frame = AnimationFrame.request(() => {
			setTransitionStatus(void 0);
		});
		return () => {
			AnimationFrame.cancel(frame);
		};
	}, [enableIdleState, open]);
	useIsoLayoutEffect(() => {
		if (!open || !enableIdleState) return;
		if (open && mounted && transitionStatus !== "idle") setTransitionStatus("starting");
		const frame = AnimationFrame.request(() => {
			setTransitionStatus("idle");
		});
		return () => {
			AnimationFrame.cancel(frame);
		};
	}, [
		enableIdleState,
		open,
		mounted,
		transitionStatus
	]);
	return {
		mounted,
		setMounted,
		transitionStatus
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useControlled.mjs
function useControlled({ controlled, default: defaultProp, name, state = "value" }) {
	const { current: isControlled } = import_react.useRef(controlled !== void 0);
	const [valueState, setValue] = import_react.useState(defaultProp);
	return [isControlled && controlled !== void 0 ? controlled : valueState, import_react.useCallback((newValue) => {
		if (!isControlled) setValue(newValue);
	}, [])];
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/field-register-control/useRegisterFieldControl.mjs
function useRegisterFieldControl(controlRef, id, value, getFormValueOverride, enabled = true, name) {
	const { registerFieldControl } = useFieldRootContext();
	const sourceRef = useRefWithInit(() => Symbol());
	useIsoLayoutEffect(() => {
		const source = sourceRef.current;
		if (!enabled) {
			registerFieldControl(source, void 0);
			return;
		}
		registerFieldControl(source, {
			controlRef,
			getValue: getFormValueOverride,
			id,
			name,
			value
		});
	}, [
		controlRef,
		enabled,
		getFormValueOverride,
		id,
		name,
		registerFieldControl,
		sourceRef,
		value
	]);
	useIsoLayoutEffect(() => {
		const source = sourceRef.current;
		return () => {
			registerFieldControl(source, void 0);
		};
	}, [registerFieldControl, sourceRef]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useValueChanged.mjs
function useValueChanged(value, onChange) {
	const valueRef = import_react.useRef(value);
	const onChangeCallback = useStableCallback(onChange);
	useIsoLayoutEffect(() => {
		if (valueRef.current !== value) onChangeCallback(valueRef.current);
		valueRef.current = value;
	}, [value, onChangeCallback]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/reason-parts.mjs
var none = "none";
var triggerPress = "trigger-press";
var triggerHover = "trigger-hover";
var triggerFocus = "trigger-focus";
var outsidePress = "outside-press";
var itemPress = "item-press";
var closePress = "close-press";
var clearPress = "clear-press";
var trackPress = "track-press";
var inputChange = "input-change";
var inputClear = "input-clear";
var inputPress = "input-press";
var focusOut = "focus-out";
var escapeKey = "escape-key";
var listNavigation = "list-navigation";
var keyboard = "keyboard";
var pointer = "pointer";
var drag = "drag";
var cancelOpen = "cancel-open";
var siblingOpen = "sibling-open";
var disabled = "disabled";
var imperativeAction = "imperative-action";
var windowResize = "window-resize";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/createBaseUIEventDetails.mjs
/**
* Maps a change `reason` string to the corresponding native event type.
*/
/**
* Details of custom change events emitted by Base UI components.
*/
/**
* Details of custom generic events emitted by Base UI components.
*/
/**
* Creates a Base UI event details object with the given reason and utilities
* for preventing Base UI's internal event handling.
*/
function createChangeEventDetails(reason, event, trigger, customProperties) {
	let canceled = false;
	let allowPropagation = false;
	const custom = customProperties ?? EMPTY_OBJECT;
	return {
		reason,
		event: event ?? new Event("base-ui"),
		cancel() {
			canceled = true;
		},
		allowPropagation() {
			allowPropagation = true;
		},
		get isCanceled() {
			return canceled;
		},
		get isPropagationAllowed() {
			return allowPropagation;
		},
		trigger,
		...custom
	};
}
function createGenericEventDetails(reason, event, customProperties) {
	const custom = customProperties ?? EMPTY_OBJECT;
	return {
		reason,
		event: event ?? new Event("base-ui"),
		...custom
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/field/control/FieldControl.mjs
/**
* The form control to label and validate.
* Renders an `<input>` element.
*
* You can omit this part and use any Base UI input component instead. For example,
* [Input](https://base-ui.com/react/components/input), [Checkbox](https://base-ui.com/react/components/checkbox),
* or [Select](https://base-ui.com/react/components/select), among others, will work with Field out of the box.
*
* Documentation: [Base UI Field](https://base-ui.com/react/components/field)
*/
var FieldControl = /*#__PURE__*/ import_react.forwardRef(function FieldControl(componentProps, forwardedRef) {
	const { render, className, id: idProp, name: nameProp, value: valueProp, disabled: disabledProp = false, onValueChange, defaultValue, autoFocus = false, style, ...elementProps } = componentProps;
	const { state: fieldState, name: fieldName, disabled: fieldDisabled, setTouched, setDirty, validityData, setFocused, setFilled, validationMode, validation } = useFieldRootContext();
	const { clearErrors, elementRef: formElementRef, submitCountRef } = useFormContext();
	const disabled = fieldDisabled || disabledProp;
	const name = fieldName ?? nameProp;
	const state = {
		...fieldState,
		disabled
	};
	const { labelId } = useLabelableContext();
	const id = useLabelableId({ id: idProp });
	const [valueUnwrapped] = useControlled({
		controlled: valueProp,
		default: defaultValue,
		name: "FieldControl",
		state: "value"
	});
	const isControlled = valueProp !== void 0;
	const value = isControlled ? valueUnwrapped : void 0;
	const serializedValue = value == null ? void 0 : String(value);
	const getValueFromInput = useStableCallback(() => validation.inputRef.current?.value);
	useRegisterFieldControl(validation.inputRef, id, serializedValue, getValueFromInput, !disabled, nameProp);
	useIsoLayoutEffect(() => {
		const currentValue = serializedValue ?? validation.inputRef.current?.value;
		if (currentValue !== void 0) setFilled(currentValue !== "");
	}, [
		serializedValue,
		validation.inputRef,
		setFilled
	]);
	useValueChanged(serializedValue, () => {
		if (serializedValue === void 0) return;
		clearErrors(name);
		setDirty(serializedValue !== (validityData.initialValue ?? ""));
		validation.change(serializedValue);
	});
	const inputRef = import_react.useRef(null);
	const enterValidationTimeout = useTimeout();
	useIsoLayoutEffect(() => {
		if (autoFocus && inputRef.current === activeElement(ownerDocument(inputRef.current))) setFocused(true);
	}, [autoFocus, setFocused]);
	return useRenderElement("input", componentProps, {
		ref: [forwardedRef, inputRef],
		state,
		props: [
			{
				id,
				disabled,
				name,
				ref: validation.inputRef,
				"aria-labelledby": labelId,
				autoFocus,
				...isControlled ? { value } : { defaultValue },
				onChange(event) {
					const inputValue = event.currentTarget.value;
					const details = createChangeEventDetails(none, event.nativeEvent);
					onValueChange?.(inputValue, details);
					if (isControlled) return;
					setDirty(inputValue !== (validityData.initialValue ?? ""));
					setFilled(inputValue !== "");
					if (!event.nativeEvent.defaultPrevented && !details.isCanceled) {
						clearErrors(name);
						validation.change(inputValue);
					}
				},
				onFocus() {
					setFocused(true);
				},
				onBlur(event) {
					setTouched(true);
					setFocused(false);
					if (validationMode === "onBlur") {
						const inputValue = event.currentTarget.value;
						validation.commit(inputValue);
						if (isControlled) queueMicrotask(() => {
							const nextValue = validation.inputRef.current?.value;
							if (nextValue !== void 0 && nextValue !== inputValue && nextValue !== (validityData.initialValue ?? "")) validation.commit(nextValue);
						});
					}
				},
				onKeyDown(event) {
					if (event.currentTarget.tagName === "INPUT" && event.key === "Enter") {
						setTouched(true);
						const value = event.currentTarget.value;
						const form = event.currentTarget.form;
						if (form && form === formElementRef.current && !event.defaultPrevented) {
							const input = event.currentTarget;
							const submitCount = submitCountRef.current;
							enterValidationTimeout.start(0, () => {
								if (submitCountRef.current === submitCount) validation.commit(input.value);
							});
						} else validation.commit(value);
					}
				}
			},
			elementProps,
			(props) => validation.getValidationProps(disabled, props)
		],
		stateAttributesMapping: fieldValidityMapping
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/input/Input.mjs
/**
* A native input element that automatically works with [Field](https://base-ui.com/react/components/field).
* Renders an `<input>` element.
*
* Documentation: [Base UI Input](https://base-ui.com/react/components/input)
*/
var Input = /*#__PURE__*/ import_react.forwardRef(function Input(props, forwardedRef) {
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FieldControl, {
		ref: forwardedRef,
		...props
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/fastHooks.mjs
var hooks = [];
var currentInstance = void 0;
function getInstance() {
	return currentInstance;
}
function register(hook) {
	hooks.push(hook);
}
/**
* Wraps a component function to enable performance optimizations for internal hooks.
*
* **Performance Optimization:**
* Components wrapped with `fastComponent` have access to a shared "instance" context that enables
* specialized hook implementations to batch operations and reduce overhead. The wrapper creates a
* stable instance object that persists across renders, sets it as the current context, calls
* registered hooks before and after rendering, then clears the context. The primary benefit is
* with `useStore`, where multiple store subscriptions within the same component are collapsed into
* a single `useSyncExternalStore` subscription per store, significantly reducing re-render overhead.
* This optimization is only active on React 19+; on earlier versions `useStore` falls back to a
* separate subscription per call.
*
* **Requirements:**
* - The component function should follow standard React component patterns
* - `useStore` calls must keep a stable order and count across renders, as batched hooks are
*   matched by call index
* - Do not rely on the instance context outside of specialized hooks
*
* @param fn - The component function to wrap
* @returns A wrapped component with the same signature as the input function
*
* @example
* ```tsx
* // Wrapping a component to enable optimized useStore batching
* export const TooltipRoot = fastComponent(function TooltipRoot(props) {
*   // These useStore calls share a single subscription
*   const open = useStore(store, (state) => state.open);
*   const disabled = useStore(store, (state) => state.disabled);
*   const value = useStore(store, (state) => state.value);
*   // ...
* });
* ```
*/
function fastComponent(fn) {
	const FastComponent = (props, forwardedRef) => {
		const instance = useRefWithInit(createInstance).current;
		let result;
		try {
			currentInstance = instance;
			for (const hook of hooks) hook.before(instance);
			result = fn(props, forwardedRef);
			for (const hook of hooks) hook.after(instance);
			instance.didInitialize = true;
		} finally {
			currentInstance = void 0;
		}
		return result;
	};
	FastComponent.displayName = fn.displayName || fn.name;
	return FastComponent;
}
/**
* Wraps a component function with ref forwarding to enable performance optimizations for internal hooks.
*
* This is a convenience wrapper that combines `fastComponent` with `React.forwardRef`, enabling
* both performance optimizations and proper ref forwarding. See `fastComponent` for details on
* the performance benefits.
*
* @param fn - The component function that accepts props and a forwarded ref
* @returns A wrapped component with ref forwarding enabled
*
* @example
* ```tsx
* // Wrapping a component with ref forwarding and optimized hooks
* export const TooltipTrigger = fastComponentRef(function TooltipTrigger(
*   props,
*   forwardedRef
* ) {
*   const store = useContext(TooltipContext);
*   const open = useStore(store, (state) => state.open);
*   // ... component logic with ref
*   return <button ref={forwardedRef} {...props} />;
* });
* ```
*/
function fastComponentRef(fn) {
	return /*#__PURE__*/ import_react.forwardRef(fastComponent(fn));
}
function createInstance() {
	return { didInitialize: false };
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/root/TooltipRootContext.mjs
var TooltipRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useTooltipRootContext(optional) {
	const context = import_react.useContext(TooltipRootContext);
	if (context === void 0 && !optional) throw new Error(formatErrorMessage(72));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useHoverShared.mjs
function resolveValue(value, pointerType) {
	if (pointerType != null && !isMouseLikePointerType(pointerType)) return 0;
	if (typeof value === "function") return value();
	return value;
}
function getDelay(value, prop, pointerType) {
	const result = resolveValue(value, pointerType);
	if (typeof result === "number") return result;
	return result?.[prop];
}
function getRestMs(value) {
	if (typeof value === "function") return value();
	return value;
}
function isClickLikeOpenEvent(openEventType, interactedInside) {
	return interactedInside || openEventType === "click" || openEventType === "mousedown";
}
function isHoverOpenEvent(openEventType) {
	return openEventType?.includes("mouse") && openEventType !== "mousedown";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/components/FloatingDelayGroup.mjs
var FloatingDelayGroupContext = /*#__PURE__*/ import_react.createContext({
	hasProvider: false,
	timeoutMs: 0,
	delayRef: { current: 0 },
	initialDelayRef: { current: 0 },
	timeout: new Timeout(),
	currentIdRef: { current: null },
	currentContextRef: { current: null }
});
function resetDelayRef(delayRef, initialDelayRef) {
	delayRef.current = initialDelayRef.current;
}
/**
* Experimental next version of `FloatingDelayGroup` to become the default
* in the future. This component is not yet stable.
* Provides context for a group of floating elements that should share a
* `delay`. Unlike `FloatingDelayGroup`, `useDelayGroup` with this
* component does not cause a re-render of unrelated consumers of the
* context when the delay changes.
* @see https://floating-ui.com/docs/FloatingDelayGroup
* @internal
*/
function FloatingDelayGroup(props) {
	const { children, delay, timeoutMs = 0 } = props;
	const delayRef = import_react.useRef(delay);
	const initialDelayRef = import_react.useRef(delay);
	const currentIdRef = import_react.useRef(null);
	const currentContextRef = import_react.useRef(null);
	const timeout = useTimeout();
	useIsoLayoutEffect(() => {
		initialDelayRef.current = delay;
		if (!currentIdRef.current) {
			delayRef.current = delay;
			return;
		}
		delayRef.current = {
			open: getDelay(delayRef.current, "open"),
			close: getDelay(delay, "close")
		};
	}, [
		delay,
		currentIdRef,
		delayRef,
		initialDelayRef
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingDelayGroupContext.Provider, {
		value: import_react.useMemo(() => ({
			hasProvider: true,
			delayRef,
			initialDelayRef,
			currentIdRef,
			timeoutMs,
			currentContextRef,
			timeout
		}), [timeoutMs, timeout]),
		children
	});
}
/**
* Enables grouping when called inside a component that's a child of a
* `FloatingDelayGroup`.
* @see https://floating-ui.com/docs/FloatingDelayGroup
* @internal
*/
function useDelayGroup(context, options = { open: false }) {
	const { open } = options;
	const store = "rootStore" in context ? context.rootStore : context;
	const floatingId = store.useState("floatingId");
	const { currentIdRef, delayRef, timeoutMs, initialDelayRef, currentContextRef, hasProvider, timeout } = import_react.useContext(FloatingDelayGroupContext);
	const [isInstantPhase, setIsInstantPhase] = import_react.useState(false);
	const openRef = import_react.useRef(open);
	useIsoLayoutEffect(() => {
		openRef.current = open;
	}, [open]);
	useIsoLayoutEffect(() => {
		function unset() {
			currentContextRef.current?.setIsInstantPhase(false);
			currentIdRef.current = null;
			currentContextRef.current = null;
			delayRef.current = initialDelayRef.current;
			timeout.clear();
		}
		if (!currentIdRef.current) return;
		if (!open && currentIdRef.current === floatingId) {
			setIsInstantPhase(false);
			if (timeoutMs) {
				const closingId = floatingId;
				timeout.start(timeoutMs, () => {
					if (store.select("open") || currentIdRef.current && currentIdRef.current !== closingId) return;
					unset();
				});
				return () => {
					if (openRef.current || currentIdRef.current !== closingId) timeout.clear();
				};
			}
			unset();
		}
	}, [
		open,
		floatingId,
		currentIdRef,
		delayRef,
		timeoutMs,
		initialDelayRef,
		currentContextRef,
		timeout,
		store
	]);
	useIsoLayoutEffect(() => {
		if (!open) return;
		const prevContext = currentContextRef.current;
		const prevId = currentIdRef.current;
		timeout.clear();
		currentContextRef.current = {
			onOpenChange: store.setOpen,
			setIsInstantPhase
		};
		currentIdRef.current = floatingId;
		delayRef.current = {
			open: 0,
			close: getDelay(initialDelayRef.current, "close")
		};
		if (prevId !== null && prevId !== floatingId) {
			setIsInstantPhase(true);
			prevContext?.setIsInstantPhase(true);
			prevContext?.onOpenChange(false, createChangeEventDetails(none));
		} else {
			setIsInstantPhase(false);
			prevContext?.setIsInstantPhase(false);
		}
	}, [
		open,
		floatingId,
		store,
		currentIdRef,
		delayRef,
		initialDelayRef,
		currentContextRef,
		timeout
	]);
	useIsoLayoutEffect(() => {
		return () => {
			if (currentIdRef.current === floatingId) {
				currentContextRef.current = null;
				if (!openRef.current) return;
				currentIdRef.current = null;
				resetDelayRef(delayRef, initialDelayRef);
				timeout.clear();
			}
		};
	}, [
		currentContextRef,
		currentIdRef,
		delayRef,
		floatingId,
		initialDelayRef,
		timeout
	]);
	return import_react.useMemo(() => ({
		activeIdRef: currentIdRef,
		hasProvider,
		delayRef,
		isInstantPhase
	}), [
		currentIdRef,
		hasProvider,
		delayRef,
		isInstantPhase
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/addEventListener.mjs
/**
* Adds an event listener and returns a cleanup function to remove it.
*/
function addEventListener(target, type, listener, options) {
	target.addEventListener(type, listener, options);
	return () => {
		target.removeEventListener(type, listener, options);
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/mergeCleanups.mjs
/**
* Combines multiple cleanup functions into a single cleanup function.
*/
function mergeCleanups(...cleanups) {
	return () => {
		for (let i = 0; i < cleanups.length; i += 1) {
			const cleanup = cleanups[i];
			if (cleanup) cleanup();
		}
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useValueAsRef.mjs
/**
* Untracks the provided value by turning it into a ref to remove its reactivity.
*
* Used to access the passed value inside `React.useEffect` without causing the effect to re-run when the value changes.
*/
function useValueAsRef(value) {
	const latest = useRefWithInit(createLatestRef, value).current;
	latest.next = value;
	useIsoLayoutEffect(latest.effect);
	return latest;
}
function createLatestRef(value) {
	const latest = {
		current: value,
		next: value,
		effect: () => {
			latest.current = latest.next;
		}
	};
	return latest;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/visuallyHidden.mjs
var visuallyHiddenBase = {
	clipPath: "inset(50%)",
	overflow: "hidden",
	whiteSpace: "nowrap",
	border: 0,
	padding: 0,
	width: 1,
	height: 1,
	margin: -1
};
var visuallyHidden = {
	...visuallyHiddenBase,
	position: "fixed",
	top: 0,
	left: 0
};
var visuallyHiddenInput = {
	...visuallyHiddenBase,
	position: "absolute"
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/FocusGuard.mjs
/**
* @internal
*/
var FocusGuard = /*#__PURE__*/ import_react.forwardRef(function FocusGuard(props, ref) {
	const [role, setRole] = import_react.useState();
	useIsoLayoutEffect(() => {
		if (voiceOver && webkit) setRole("button");
	}, []);
	const restProps = {
		tabIndex: 0,
		role
	};
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
		...props,
		ref,
		style: visuallyHidden,
		"aria-hidden": role ? void 0 : true,
		...restProps,
		"data-base-ui-focus-guard": ""
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/createAttribute.mjs
function createAttribute(name) {
	return `data-base-ui-${name}`;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/enqueueFocus.mjs
var rafId = 0;
function enqueueFocus(el, options = {}) {
	const { preventScroll = false, sync = false, shouldFocus } = options;
	cancelAnimationFrame(rafId);
	function exec() {
		if (shouldFocus && !shouldFocus()) return;
		el?.focus({ preventScroll });
	}
	if (sync) {
		exec();
		return NOOP;
	}
	const currentRafId = requestAnimationFrame(exec);
	rafId = currentRafId;
	return () => {
		if (rafId === currentRafId) {
			cancelAnimationFrame(currentRafId);
			rafId = 0;
		}
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/markOthers.mjs
var counters = {
	inert: /* @__PURE__ */ new WeakMap(),
	"aria-hidden": /* @__PURE__ */ new WeakMap()
};
var markerName = "data-base-ui-inert";
var uncontrolledElementsSets = {
	inert: /* @__PURE__ */ new WeakSet(),
	"aria-hidden": /* @__PURE__ */ new WeakSet()
};
var markerCounterMap = /* @__PURE__ */ new WeakMap();
var lockCount = 0;
function getUncontrolledElementsSet(controlAttribute) {
	return uncontrolledElementsSets[controlAttribute];
}
function unwrapHost(node) {
	if (!node) return null;
	return isShadowRoot(node) ? node.host : unwrapHost(node.parentNode);
}
var correctElements = (parent, targets) => targets.map((target) => {
	if (parent.contains(target)) return target;
	const correctedTarget = unwrapHost(target);
	if (parent.contains(correctedTarget)) return correctedTarget;
	return null;
}).filter((x) => x != null);
var buildKeepSet = (targets) => {
	const keep = /* @__PURE__ */ new Set();
	targets.forEach((target) => {
		let node = target;
		while (node && !keep.has(node)) {
			keep.add(node);
			node = node.parentNode;
		}
	});
	return keep;
};
var collectOutsideElements = (root, keepElements, stopElements) => {
	const outside = [];
	const walk = (parent) => {
		if (!parent || stopElements.has(parent)) return;
		Array.from(parent.children).forEach((node) => {
			if (getNodeName(node) === "script") return;
			if (keepElements.has(node)) walk(node);
			else outside.push(node);
		});
	};
	walk(root);
	return outside;
};
function applyAttributeToOthers(uncorrectedAvoidElements, body, ariaHidden, inert, { mark = true }) {
	let controlAttribute = null;
	if (inert) controlAttribute = "inert";
	else if (ariaHidden) controlAttribute = "aria-hidden";
	let counterMap = null;
	let uncontrolledElementsSet = null;
	const avoidElements = correctElements(body, uncorrectedAvoidElements);
	const markerTargets = mark ? collectOutsideElements(body, buildKeepSet(avoidElements), new Set(avoidElements)) : [];
	const hiddenElements = [];
	const markedElements = [];
	if (controlAttribute) {
		const map = counters[controlAttribute];
		const currentUncontrolledElementsSet = getUncontrolledElementsSet(controlAttribute);
		uncontrolledElementsSet = currentUncontrolledElementsSet;
		counterMap = map;
		const ariaLiveElements = correctElements(body, Array.from(body.querySelectorAll("[aria-live]")));
		const controlElements = avoidElements.concat(ariaLiveElements);
		collectOutsideElements(body, buildKeepSet(controlElements), new Set(controlElements)).forEach((node) => {
			const attr = node.getAttribute(controlAttribute);
			const alreadyHidden = attr !== null && attr !== "false";
			const counterValue = (map.get(node) || 0) + 1;
			map.set(node, counterValue);
			hiddenElements.push(node);
			if (counterValue === 1 && alreadyHidden) currentUncontrolledElementsSet.add(node);
			if (!alreadyHidden) node.setAttribute(controlAttribute, controlAttribute === "inert" ? "" : "true");
		});
	}
	if (mark) markerTargets.forEach((node) => {
		const markerValue = (markerCounterMap.get(node) || 0) + 1;
		markerCounterMap.set(node, markerValue);
		markedElements.push(node);
		if (markerValue === 1) node.setAttribute(markerName, "");
	});
	lockCount += 1;
	return () => {
		if (counterMap) hiddenElements.forEach((element) => {
			const counterValue = (counterMap.get(element) || 0) - 1;
			counterMap.set(element, counterValue);
			if (!counterValue) {
				if (!uncontrolledElementsSet?.has(element) && controlAttribute) element.removeAttribute(controlAttribute);
				uncontrolledElementsSet?.delete(element);
			}
		});
		if (mark) markedElements.forEach((element) => {
			const markerValue = (markerCounterMap.get(element) || 0) - 1;
			markerCounterMap.set(element, markerValue);
			if (!markerValue) element.removeAttribute(markerName);
		});
		lockCount -= 1;
		if (!lockCount) {
			counters.inert = /* @__PURE__ */ new WeakMap();
			counters["aria-hidden"] = /* @__PURE__ */ new WeakMap();
			uncontrolledElementsSets.inert = /* @__PURE__ */ new WeakSet();
			uncontrolledElementsSets["aria-hidden"] = /* @__PURE__ */ new WeakSet();
			markerCounterMap = /* @__PURE__ */ new WeakMap();
		}
	};
}
function markOthers(avoidElements, options = {}) {
	const { ariaHidden = false, inert = false, mark = true } = options;
	const body = ownerDocument(avoidElements[0]).body;
	return applyAttributeToOthers(avoidElements, body, ariaHidden, inert, { mark });
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/constants.mjs
var DISABLED_TRANSITIONS_STYLE = { style: { transition: "none" } };
var CLICK_TRIGGER_IDENTIFIER = "data-base-ui-click-trigger";
var BASE_UI_SWIPE_IGNORE_ATTRIBUTE = "data-base-ui-swipe-ignore";
var LEGACY_SWIPE_IGNORE_ATTRIBUTE = "data-swipe-ignore";
`${BASE_UI_SWIPE_IGNORE_ATTRIBUTE}`;
`${LEGACY_SWIPE_IGNORE_ATTRIBUTE}`;
/**
* Used for dropdowns that usually strictly prefer top/bottom placements and
* use `var(--available-height)` to limit their height.
*/
var DROPDOWN_COLLISION_AVOIDANCE = { fallbackAxisSide: "none" };
/**
* Used by regular popups that usually aren't scrollable and are allowed to
* freely flip to any axis of placement.
*/
var POPUP_COLLISION_AVOIDANCE = { fallbackAxisSide: "end" };
/**
* Special visually hidden styles for the aria-owns owner element to ensure owned element
* accessibility in iOS/Safari/VoiceControl.
* The owner element is an empty span, so most of the common visually hidden styles are not needed.
* @see https://github.com/floating-ui/floating-ui/issues/3403
*/
var ownerVisuallyHidden = {
	clipPath: "inset(50%)",
	position: "fixed",
	top: 0,
	left: 0
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/components/FloatingPortal.mjs
var PortalContext = /*#__PURE__*/ import_react.createContext(null);
var usePortalContext = () => import_react.useContext(PortalContext);
var attr = createAttribute("portal");
function useFloatingPortalNode(props = {}) {
	const { ref, container: containerProp, componentProps = EMPTY_OBJECT, elementProps } = props;
	const uniqueId = useId();
	const parentPortalNode = usePortalContext()?.portalNode;
	const [containerElement, setContainerElement] = import_react.useState(null);
	const [portalNode, setPortalNode] = import_react.useState(null);
	const setPortalNodeRef = useStableCallback((node) => {
		if (node !== null) setPortalNode(node);
	});
	const containerRef = import_react.useRef(null);
	useIsoLayoutEffect(() => {
		if (containerProp === null) {
			if (containerRef.current) {
				containerRef.current = null;
				setPortalNode(null);
				setContainerElement(null);
			}
			return;
		}
		const resolvedContainer = (containerProp && (isNode(containerProp) ? containerProp : containerProp.current)) ?? parentPortalNode ?? document.body;
		if (resolvedContainer == null) {
			if (containerRef.current) {
				containerRef.current = null;
				setPortalNode(null);
				setContainerElement(null);
			}
			return;
		}
		if (containerRef.current !== resolvedContainer) {
			containerRef.current = resolvedContainer;
			setPortalNode(null);
			setContainerElement(resolvedContainer);
		}
	}, [containerProp, parentPortalNode]);
	const portalElement = useRenderElement("div", componentProps, {
		ref: [ref, setPortalNodeRef],
		props: [{
			id: uniqueId,
			[attr]: ""
		}, elementProps]
	});
	const portalSubtree = containerElement && portalElement ? /*#__PURE__*/ import_react_dom.createPortal(portalElement, containerElement) : null;
	return {
		node: portalNode,
		nodeId: /*#__PURE__*/ import_react.isValidElement(portalElement) ? portalElement.props.id : void 0,
		subtree: portalSubtree
	};
}
/**
* Portals the floating element into a given container element — by default,
* outside of the app root and into the body.
* This is necessary to ensure the floating element can appear outside any
* potential parent containers that cause clipping (such as `overflow: hidden`),
* while retaining its location in the React tree.
* @see https://floating-ui.com/docs/FloatingPortal
* @internal
*/
var FloatingPortal = /*#__PURE__*/ import_react.forwardRef(function FloatingPortal(componentProps, forwardedRef) {
	const { render, className, style, children, container, portalOwnerRole, ...elementProps } = componentProps;
	const { node: portalNode, nodeId: portalNodeId, subtree: portalSubtree } = useFloatingPortalNode({
		container,
		ref: forwardedRef,
		componentProps,
		elementProps
	});
	const beforeOutsideRef = import_react.useRef(null);
	const afterOutsideRef = import_react.useRef(null);
	const beforeInsideRef = import_react.useRef(null);
	const afterInsideRef = import_react.useRef(null);
	const [focusManagerState, setFocusManagerState] = import_react.useState(null);
	const focusInsideDisabledRef = import_react.useRef(false);
	const modal = focusManagerState?.modal;
	const open = focusManagerState?.open;
	const shouldRenderGuards = !!focusManagerState && !focusManagerState.modal && focusManagerState.open && !!portalNode;
	import_react.useEffect(() => {
		if (!portalNode || modal) return;
		function onFocus(event) {
			if (portalNode && event.relatedTarget && isOutsideEvent(event)) {
				if (event.type === "focusin") {
					if (focusInsideDisabledRef.current) {
						enableFocusInside(portalNode);
						focusInsideDisabledRef.current = false;
					}
				} else {
					disableFocusInside(portalNode);
					focusInsideDisabledRef.current = true;
				}
			}
		}
		return mergeCleanups(addEventListener(portalNode, "focusin", onFocus, true), addEventListener(portalNode, "focusout", onFocus, true));
	}, [portalNode, modal]);
	useIsoLayoutEffect(() => {
		if (!portalNode || open !== true || !focusInsideDisabledRef.current) return;
		enableFocusInside(portalNode);
		focusInsideDisabledRef.current = false;
	}, [open, portalNode]);
	const portalContextValue = import_react.useMemo(() => ({
		beforeOutsideRef,
		afterOutsideRef,
		beforeInsideRef,
		afterInsideRef,
		portalNode,
		setFocusManagerState
	}), [portalNode]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [portalSubtree, /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(PortalContext.Provider, {
		value: portalContextValue,
		children: [
			shouldRenderGuards && portalNode && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
				"data-type": "outside",
				ref: beforeOutsideRef,
				onFocus: (event) => {
					if (isOutsideEvent(event, portalNode)) beforeInsideRef.current?.focus();
					else getPreviousTabbable(focusManagerState ? focusManagerState.domReference : null)?.focus();
				}
			}),
			shouldRenderGuards && portalNode && /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
				role: portalOwnerRole,
				"aria-owns": portalNodeId,
				style: ownerVisuallyHidden
			}),
			portalNode && /*#__PURE__*/ import_react_dom.createPortal(children, portalNode),
			shouldRenderGuards && portalNode && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
				"data-type": "outside",
				ref: afterOutsideRef,
				onFocus: (event) => {
					if (isOutsideEvent(event, portalNode)) afterInsideRef.current?.focus();
					else {
						getNextTabbable(focusManagerState ? focusManagerState.domReference : null)?.focus();
						if (focusManagerState?.closeOnFocusOut) focusManagerState?.onOpenChange(false, createChangeEventDetails("focus-out", event.nativeEvent));
					}
				}
			})
		]
	})] });
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/createEventEmitter.mjs
function createEventEmitter() {
	const map = /* @__PURE__ */ new Map();
	return {
		emit(event, data) {
			map.get(event)?.forEach((listener) => listener(data));
		},
		on(event, listener) {
			if (!map.has(event)) map.set(event, /* @__PURE__ */ new Set());
			map.get(event).add(listener);
		},
		off(event, listener) {
			map.get(event)?.delete(listener);
		}
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/components/FloatingTreeStore.mjs
/**
* Stores and manages floating elements in a tree structure.
* This is a backing store for the `FloatingTree` component.
*/
var FloatingTreeStore = class {
	nodesRef = { current: [] };
	events = createEventEmitter();
	addNode(node) {
		this.nodesRef.current.push(node);
	}
	removeNode(node) {
		const index = this.nodesRef.current.findIndex((n) => n === node);
		if (index !== -1) this.nodesRef.current.splice(index, 1);
	}
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/components/FloatingTree.mjs
var FloatingNodeContext = /*#__PURE__*/ import_react.createContext(null);
var FloatingTreeContext = /*#__PURE__*/ import_react.createContext(null);
var useFloatingParentNodeId = () => import_react.useContext(FloatingNodeContext)?.id || null;
/**
* Returns the nearest floating tree context, if available.
*/
var useFloatingTree = (externalTree) => {
	const contextTree = import_react.useContext(FloatingTreeContext);
	return externalTree ?? contextTree;
};
/**
* Registers a node into the `FloatingTree`, returning its id.
* @see https://floating-ui.com/docs/FloatingTree
*/
function useFloatingNodeId(externalTree) {
	const id = useId();
	const tree = useFloatingTree(externalTree);
	const parentId = useFloatingParentNodeId();
	useIsoLayoutEffect(() => {
		if (!id) return;
		const node = {
			id,
			parentId
		};
		tree?.addNode(node);
		return () => {
			tree?.removeNode(node);
		};
	}, [
		tree,
		id,
		parentId
	]);
	return id;
}
/**
* Provides parent node context for nested floating elements.
* @see https://floating-ui.com/docs/FloatingTree
* @internal
*/
function FloatingNode(props) {
	const { children, id } = props;
	const parentId = useFloatingParentNodeId();
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingNodeContext.Provider, {
		value: import_react.useMemo(() => ({
			id,
			parentId
		}), [id, parentId]),
		children
	});
}
/**
* Provides context for nested floating elements when they are not children of
* each other on the DOM.
* This is not necessary in all cases, except when there must be explicit communication between parent and child floating elements. It is necessary for:
* - The `bubbles` option in the `useDismiss()` Hook
* - Nested virtual list navigation
* - Nested floating elements that each open on hover
* - Custom communication between parent and child floating elements
* @see https://floating-ui.com/docs/FloatingTree
* @internal
*/
function FloatingTree(props) {
	const { children, externalTree } = props;
	const tree = useRefWithInit(() => externalTree ?? new FloatingTreeStore()).current;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingTreeContext.Provider, {
		value: tree,
		children
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/components/FloatingFocusManager.mjs
function getEventType(event, lastInteractionType) {
	const win = getWindow(getTarget(event));
	if (event instanceof win.KeyboardEvent) return "keyboard";
	if (event instanceof win.FocusEvent) return lastInteractionType || "keyboard";
	if ("pointerType" in event) return event.pointerType || "keyboard";
	if ("touches" in event) return "touch";
	if (event instanceof win.MouseEvent) return lastInteractionType || (event.detail === 0 ? "keyboard" : "mouse");
	return "";
}
var LIST_LIMIT = 20;
var previouslyFocusedElements = [];
function clearDisconnectedPreviouslyFocusedElements() {
	previouslyFocusedElements = previouslyFocusedElements.filter((entry) => {
		return entry.deref()?.isConnected;
	});
}
function addPreviouslyFocusedElement(element) {
	clearDisconnectedPreviouslyFocusedElements();
	if (element && getNodeName(element) !== "body") {
		previouslyFocusedElements.push(new WeakRef(element));
		if (previouslyFocusedElements.length > LIST_LIMIT) previouslyFocusedElements = previouslyFocusedElements.slice(-20);
	}
}
function getPreviouslyFocusedElement() {
	clearDisconnectedPreviouslyFocusedElements();
	return previouslyFocusedElements[previouslyFocusedElements.length - 1]?.deref();
}
function getFirstTabbableElement(container) {
	if (!container) return null;
	if (isTabbable(container)) return container;
	return tabbable(container)[0] || container;
}
function handleTabIndex(floatingFocusElement) {
	if (floatingFocusElement.hasAttribute("tabindex") && !floatingFocusElement.hasAttribute("data-tabindex")) return;
	if (!floatingFocusElement.getAttribute("role")?.includes("dialog")) return;
	const tabbableContent = focusable(floatingFocusElement).filter((element) => {
		const dataTabIndex = element.getAttribute("data-tabindex") || "";
		return isTabbable(element) || element.hasAttribute("data-tabindex") && !dataTabIndex.startsWith("-");
	});
	const tabIndex = floatingFocusElement.getAttribute("tabindex");
	if (tabbableContent.length === 0) {
		if (tabIndex !== "0") {
			floatingFocusElement.setAttribute("tabindex", "0");
			floatingFocusElement.setAttribute("data-tabindex", "0");
		}
	} else if (tabIndex !== "-1" || floatingFocusElement.hasAttribute("data-tabindex") && floatingFocusElement.getAttribute("data-tabindex") !== "-1") {
		floatingFocusElement.setAttribute("tabindex", "-1");
		floatingFocusElement.setAttribute("data-tabindex", "-1");
	}
}
/**
* Provides focus management for the floating element.
* @see https://floating-ui.com/docs/FloatingFocusManager
* @internal
*/
function FloatingFocusManager(props) {
	const { context, children, disabled = false, initialFocus = true, returnFocus = true, restoreFocus = false, modal = true, closeOnFocusOut = true, openInteractionType = "", nextFocusableElement, previousFocusableElement, beforeContentFocusGuardRef, externalTree, getInsideElements } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const open = store.useState("open");
	const domReference = store.useState("domReferenceElement");
	const floating = store.useState("floatingElement");
	const { events, dataRef } = store.context;
	const getNodeId = useStableCallback(() => dataRef.current.floatingContext?.nodeId);
	const ignoreInitialFocus = initialFocus === false;
	const isUntrappedTypeableCombobox = isTypeableCombobox(domReference) && ignoreInitialFocus;
	const initialFocusRef = useValueAsRef(initialFocus);
	const returnFocusRef = useValueAsRef(returnFocus);
	const openInteractionTypeRef = useValueAsRef(openInteractionType);
	const openRef = useValueAsRef(open);
	const tree = useFloatingTree(externalTree);
	const portalContext = usePortalContext();
	const preventReturnFocusRef = import_react.useRef(false);
	const isPointerDownRef = import_react.useRef(false);
	const pointerDownOutsideRef = import_react.useRef(false);
	const lastFocusedTabbableRef = import_react.useRef(null);
	const closeTypeRef = import_react.useRef("");
	const lastInteractionTypeRef = import_react.useRef("");
	const beforeGuardRef = import_react.useRef(null);
	const afterGuardRef = import_react.useRef(null);
	const mergedBeforeGuardRef = useMergedRefs(beforeGuardRef, beforeContentFocusGuardRef, portalContext?.beforeInsideRef);
	const mergedAfterGuardRef = useMergedRefs(afterGuardRef, portalContext?.afterInsideRef);
	const blurTimeout = useTimeout();
	const pointerDownTimeout = useTimeout();
	const restoreFocusFrame = useAnimationFrame();
	const isInsidePortal = portalContext != null;
	const floatingFocusElement = getFloatingFocusElement(floating);
	const getTabbableContent = useStableCallback((container = floatingFocusElement) => {
		return container ? tabbable(container) : [];
	});
	const getResolvedInsideElements = useStableCallback(() => getInsideElements?.().filter((element) => element != null) ?? []);
	import_react.useEffect(() => {
		if (disabled || !modal) return;
		function onKeyDown(event) {
			if (event.key === "Tab") {
				if (contains(floatingFocusElement, activeElement(ownerDocument(floatingFocusElement))) && getTabbableContent().length === 0 && !isUntrappedTypeableCombobox) stopEvent(event);
			}
		}
		return addEventListener(ownerDocument(floatingFocusElement), "keydown", onKeyDown);
	}, [
		disabled,
		floatingFocusElement,
		modal,
		isUntrappedTypeableCombobox,
		getTabbableContent
	]);
	import_react.useEffect(() => {
		if (disabled || !open) return;
		const doc = ownerDocument(floatingFocusElement);
		function clearPointerDownOutside() {
			pointerDownOutsideRef.current = false;
		}
		function onPointerDown(event) {
			const target = getTarget(event);
			const insideElements = getResolvedInsideElements();
			const pointerTargetInside = contains(floating, target) || contains(domReference, target) || contains(portalContext?.portalNode, target) || insideElements.some((element) => element === target || contains(element, target));
			pointerDownOutsideRef.current = !pointerTargetInside;
			lastInteractionTypeRef.current = event.pointerType || "keyboard";
			if (target?.closest(`[data-base-ui-click-trigger]`)) {
				isPointerDownRef.current = true;
				pointerDownTimeout.start(0, () => {
					isPointerDownRef.current = false;
				});
			}
		}
		function onKeyDown() {
			lastInteractionTypeRef.current = "keyboard";
		}
		return mergeCleanups(addEventListener(doc, "pointerdown", onPointerDown, true), addEventListener(doc, "pointerup", clearPointerDownOutside, true), addEventListener(doc, "pointercancel", clearPointerDownOutside, true), addEventListener(doc, "keydown", onKeyDown, true), clearPointerDownOutside);
	}, [
		disabled,
		floating,
		domReference,
		floatingFocusElement,
		open,
		portalContext,
		pointerDownTimeout,
		getResolvedInsideElements
	]);
	import_react.useEffect(() => {
		if (disabled || !closeOnFocusOut) return;
		const doc = ownerDocument(floatingFocusElement);
		function handlePointerDown() {
			isPointerDownRef.current = true;
			pointerDownTimeout.start(0, () => {
				isPointerDownRef.current = false;
			});
		}
		function handleFocusIn(event) {
			const target = getTarget(event);
			if (isTabbable(target)) lastFocusedTabbableRef.current = target;
		}
		function handleFocusOutside(event) {
			const relatedTarget = event.relatedTarget;
			const currentTarget = event.currentTarget;
			const target = getTarget(event);
			if (modal && relatedTarget == null && target != null && contains(floating, target)) addPreviouslyFocusedElement(target);
			queueMicrotask(() => {
				const nodeId = getNodeId();
				const triggers = store.context.triggerElements;
				const insideElements = getResolvedInsideElements();
				const isRelatedFocusGuard = relatedTarget?.hasAttribute(createAttribute("focus-guard")) && [
					beforeGuardRef.current,
					afterGuardRef.current,
					portalContext?.beforeInsideRef.current,
					portalContext?.afterInsideRef.current,
					portalContext?.beforeOutsideRef.current,
					portalContext?.afterOutsideRef.current,
					resolveRef(previousFocusableElement),
					resolveRef(nextFocusableElement)
				].includes(relatedTarget);
				const movedToUnrelatedNode = !(contains(domReference, relatedTarget) || contains(floating, relatedTarget) || contains(relatedTarget, floating) || contains(portalContext?.portalNode, relatedTarget) || insideElements.some((element) => element === relatedTarget || contains(element, relatedTarget)) || triggers.hasMatchingElement((trigger) => contains(trigger, relatedTarget)) || isRelatedFocusGuard || tree && (getNodeChildren(tree.nodesRef.current, nodeId).find((node) => contains(node.context?.elements.floating, relatedTarget) || contains(node.context?.elements.domReference, relatedTarget)) || getNodeAncestors(tree.nodesRef.current, nodeId).find((node) => [node.context?.elements.floating, getFloatingFocusElement(node.context?.elements.floating)].includes(relatedTarget) || node.context?.elements.domReference === relatedTarget)));
				if (currentTarget === domReference && floatingFocusElement) handleTabIndex(floatingFocusElement);
				if (restoreFocus && currentTarget !== domReference && !isElementVisible(target) && activeElement(doc) === doc.body) {
					if (isHTMLElement(floatingFocusElement)) {
						floatingFocusElement.focus();
						if (restoreFocus === "popup") {
							restoreFocusFrame.request(() => {
								floatingFocusElement.focus();
							});
							return;
						}
					}
					const tabbableContent = getTabbableContent();
					const prevTabbable = lastFocusedTabbableRef.current;
					const nodeToFocus = (prevTabbable && tabbableContent.includes(prevTabbable) ? prevTabbable : null) || tabbableContent[tabbableContent.length - 1] || floatingFocusElement;
					if (isHTMLElement(nodeToFocus)) nodeToFocus.focus();
				}
				if (dataRef.current.insideReactTree) {
					dataRef.current.insideReactTree = false;
					return;
				}
				if ((isUntrappedTypeableCombobox ? true : !modal) && relatedTarget && movedToUnrelatedNode && !isPointerDownRef.current && (isUntrappedTypeableCombobox || relatedTarget !== getPreviouslyFocusedElement())) {
					preventReturnFocusRef.current = true;
					store.setOpen(false, createChangeEventDetails(focusOut, event));
				}
			});
		}
		function markInsideReactTree() {
			if (pointerDownOutsideRef.current) return;
			dataRef.current.insideReactTree = true;
			blurTimeout.start(0, () => {
				dataRef.current.insideReactTree = false;
			});
		}
		const domReferenceElement = isHTMLElement(domReference) ? domReference : null;
		if (!floating && !domReferenceElement) return;
		return mergeCleanups(domReferenceElement && addEventListener(domReferenceElement, "focusout", handleFocusOutside), domReferenceElement && addEventListener(domReferenceElement, "pointerdown", handlePointerDown), floating && addEventListener(floating, "focusin", handleFocusIn), floating && addEventListener(floating, "focusout", handleFocusOutside), floating && portalContext && addEventListener(floating, "focusout", markInsideReactTree, true));
	}, [
		disabled,
		domReference,
		floating,
		floatingFocusElement,
		modal,
		tree,
		portalContext,
		store,
		closeOnFocusOut,
		restoreFocus,
		getTabbableContent,
		isUntrappedTypeableCombobox,
		getNodeId,
		dataRef,
		blurTimeout,
		pointerDownTimeout,
		restoreFocusFrame,
		nextFocusableElement,
		previousFocusableElement,
		getResolvedInsideElements
	]);
	import_react.useEffect(() => {
		if (disabled || !floating || !open) return;
		const portalNodes = Array.from(portalContext?.portalNode?.querySelectorAll(`[${createAttribute("portal")}]`) || []);
		const rootAncestorComboboxDomReference = (tree ? getNodeAncestors(tree.nodesRef.current, getNodeId()) : []).find((node) => isTypeableCombobox(node.context?.elements.domReference || null))?.context?.elements.domReference;
		const ariaHiddenCleanup = markOthers([
			...[
				floating,
				...portalNodes,
				beforeGuardRef.current,
				afterGuardRef.current,
				portalContext?.beforeOutsideRef.current,
				portalContext?.afterOutsideRef.current,
				...getResolvedInsideElements()
			],
			rootAncestorComboboxDomReference,
			resolveRef(previousFocusableElement),
			resolveRef(nextFocusableElement),
			isUntrappedTypeableCombobox ? domReference : null
		].filter((x) => x != null), {
			ariaHidden: modal || isUntrappedTypeableCombobox,
			mark: false
		});
		const markerCleanup = markOthers([floating, ...portalNodes].filter((x) => x != null));
		return () => {
			markerCleanup();
			ariaHiddenCleanup();
		};
	}, [
		open,
		disabled,
		domReference,
		floating,
		modal,
		portalContext,
		isUntrappedTypeableCombobox,
		tree,
		getNodeId,
		nextFocusableElement,
		previousFocusableElement,
		getResolvedInsideElements
	]);
	useIsoLayoutEffect(() => {
		if (!open || disabled || !isHTMLElement(floatingFocusElement)) return;
		closeTypeRef.current = "";
		lastInteractionTypeRef.current = "";
		const doc = ownerDocument(floatingFocusElement);
		const previouslyFocusedElement = activeElement(doc);
		queueMicrotask(() => {
			const initialFocusValueOrFn = initialFocusRef.current;
			const resolvedInitialFocus = typeof initialFocusValueOrFn === "function" ? initialFocusValueOrFn(openInteractionTypeRef.current || "") : initialFocusValueOrFn;
			if (resolvedInitialFocus === void 0 || resolvedInitialFocus === false) return;
			if (contains(floatingFocusElement, previouslyFocusedElement)) return;
			let focusableElements = null;
			const getDefaultFocusElement = () => {
				if (focusableElements == null) focusableElements = getTabbableContent(floatingFocusElement);
				return focusableElements[0] || floatingFocusElement;
			};
			let elToFocus;
			if (resolvedInitialFocus === true || resolvedInitialFocus === null) elToFocus = getDefaultFocusElement();
			else elToFocus = resolveRef(resolvedInitialFocus);
			elToFocus = elToFocus || getDefaultFocusElement();
			const hadFocusInside = contains(floatingFocusElement, activeElement(doc));
			enqueueFocus(elToFocus, {
				preventScroll: elToFocus === floatingFocusElement,
				shouldFocus() {
					if (!openRef.current) return false;
					if (hadFocusInside) return true;
					const currentActiveElement = activeElement(doc);
					return !(currentActiveElement !== elToFocus && contains(floatingFocusElement, currentActiveElement));
				}
			});
		});
	}, [
		disabled,
		open,
		floatingFocusElement,
		getTabbableContent,
		initialFocusRef,
		openInteractionTypeRef,
		openRef
	]);
	useIsoLayoutEffect(() => {
		if (disabled || !floatingFocusElement) return;
		const doc = ownerDocument(floatingFocusElement);
		const elementFocusedBeforeOpen = activeElement(doc);
		const preferPreviousFocus = openInteractionTypeRef.current == null;
		addPreviouslyFocusedElement(elementFocusedBeforeOpen);
		function onOpenChangeLocal(details) {
			if (!details.open) closeTypeRef.current = getEventType(details.nativeEvent, lastInteractionTypeRef.current);
			if (details.reason === "trigger-hover" && details.nativeEvent.type === "mouseleave") preventReturnFocusRef.current = true;
			if (details.reason !== "outside-press") return;
			if (details.nested) preventReturnFocusRef.current = false;
			else if (isVirtualClick(details.nativeEvent) || isVirtualPointerEvent(details.nativeEvent)) preventReturnFocusRef.current = false;
			else {
				let isPreventScrollSupported = false;
				ownerDocument(floatingFocusElement).createElement("div").focus({ get preventScroll() {
					isPreventScrollSupported = true;
					return false;
				} });
				if (isPreventScrollSupported) preventReturnFocusRef.current = false;
				else preventReturnFocusRef.current = true;
			}
		}
		events.on("openchange", onOpenChangeLocal);
		function getReturnElement(closeType) {
			const returnFocusValueOrFn = returnFocusRef.current;
			let resolvedReturnFocusValue = typeof returnFocusValueOrFn === "function" ? returnFocusValueOrFn(closeType) : returnFocusValueOrFn;
			if (resolvedReturnFocusValue === void 0 || resolvedReturnFocusValue === false) return null;
			if (resolvedReturnFocusValue === null) resolvedReturnFocusValue = true;
			const referenceReturnElement = domReference?.isConnected ? domReference : null;
			const previousReturnElement = elementFocusedBeforeOpen?.isConnected && getNodeName(elementFocusedBeforeOpen) !== "body" ? elementFocusedBeforeOpen : null;
			let defaultReturnElement = preferPreviousFocus ? previousReturnElement || referenceReturnElement : referenceReturnElement || previousReturnElement;
			if (!defaultReturnElement) defaultReturnElement = getPreviouslyFocusedElement() || null;
			if (typeof resolvedReturnFocusValue === "boolean") return defaultReturnElement;
			return resolveRef(resolvedReturnFocusValue) || defaultReturnElement || null;
		}
		return () => {
			events.off("openchange", onOpenChangeLocal);
			const activeEl = activeElement(doc);
			const insideElements = getResolvedInsideElements();
			const isFocusInsideFloatingTree = contains(floating, activeEl) || insideElements.some((element) => element === activeEl || contains(element, activeEl)) || tree && getNodeChildren(tree.nodesRef.current, getNodeId(), false).some((node) => contains(node.context?.elements.floating, activeEl));
			const returnFocusValueOrFn = returnFocusRef.current;
			const closeType = closeTypeRef.current;
			const returnElement = getReturnElement(closeType);
			queueMicrotask(() => {
				const tabbableReturnElement = getFirstTabbableElement(returnElement);
				const hasExplicitReturnFocus = typeof returnFocusValueOrFn !== "boolean";
				if (returnFocusValueOrFn && !preventReturnFocusRef.current && isHTMLElement(tabbableReturnElement) && (!hasExplicitReturnFocus && tabbableReturnElement !== activeEl && activeEl !== doc.body ? isFocusInsideFloatingTree : true)) {
					const focusOptions = { preventScroll: true };
					if (closeType === "keyboard") focusOptions.focusVisible = true;
					tabbableReturnElement.focus(focusOptions);
				}
				preventReturnFocusRef.current = false;
			});
		};
	}, [
		disabled,
		floating,
		floatingFocusElement,
		returnFocusRef,
		openInteractionTypeRef,
		events,
		tree,
		domReference,
		getNodeId,
		getResolvedInsideElements
	]);
	useIsoLayoutEffect(() => {
		if (!webkit || open || !floating) return;
		const activeEl = activeElement(ownerDocument(floating));
		if (!isHTMLElement(activeEl) || !isTypeableElement(activeEl)) return;
		if (contains(floating, activeEl)) activeEl.blur();
	}, [open, floating]);
	useIsoLayoutEffect(() => {
		if (disabled || !portalContext) return;
		portalContext.setFocusManagerState({
			modal,
			closeOnFocusOut,
			open,
			onOpenChange: store.setOpen,
			domReference
		});
		return () => {
			portalContext.setFocusManagerState(null);
		};
	}, [
		disabled,
		portalContext,
		modal,
		open,
		store,
		closeOnFocusOut,
		domReference
	]);
	useIsoLayoutEffect(() => {
		if (disabled || !floatingFocusElement) return;
		handleTabIndex(floatingFocusElement);
		return () => {
			queueMicrotask(clearDisconnectedPreviouslyFocusedElements);
		};
	}, [disabled, floatingFocusElement]);
	const shouldRenderGuards = !disabled && (modal ? !isUntrappedTypeableCombobox : true) && (isInsidePortal || modal);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
		shouldRenderGuards && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
			"data-type": "inside",
			ref: mergedBeforeGuardRef,
			onFocus: (event) => {
				if (modal) {
					const els = getTabbableContent();
					enqueueFocus(els[els.length - 1]);
				} else if (portalContext?.portalNode) {
					preventReturnFocusRef.current = false;
					if (isOutsideEvent(event, portalContext.portalNode)) getNextTabbable(domReference)?.focus();
					else resolveRef(previousFocusableElement ?? portalContext.beforeOutsideRef)?.focus();
				}
			}
		}),
		children,
		shouldRenderGuards && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
			"data-type": "inside",
			ref: mergedAfterGuardRef,
			onFocus: (event) => {
				if (modal) enqueueFocus(getTabbableContent()[0]);
				else if (portalContext?.portalNode) {
					if (closeOnFocusOut) preventReturnFocusRef.current = true;
					if (isOutsideEvent(event, portalContext.portalNode)) getPreviousTabbable(domReference)?.focus();
					else resolveRef(nextFocusableElement ?? portalContext.afterOutsideRef)?.focus();
				}
			}
		})
	] });
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useClick.mjs
/**
* Opens or closes the floating element when clicking the reference element.
* @see https://floating-ui.com/docs/useClick
*/
function useClick(context, props = {}) {
	const { enabled = true, event: eventOption = "click", toggle = true, ignoreMouse = false, stickIfOpen = true, touchOpenDelay = 0, reason = triggerPress } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const dataRef = store.context.dataRef;
	const pointerTypeRef = import_react.useRef(void 0);
	const frame = useAnimationFrame();
	const touchOpenTimeout = useTimeout();
	const reference = import_react.useMemo(() => {
		function setOpenWithTouchDelay(nextOpen, nativeEvent, target, pointerType) {
			const details = createChangeEventDetails(reason, nativeEvent, target);
			if (nextOpen && pointerType === "touch" && touchOpenDelay > 0) touchOpenTimeout.start(touchOpenDelay, () => {
				store.setOpen(true, details);
			});
			else store.setOpen(nextOpen, details);
		}
		function getNextOpen(open, currentTarget, isClickLikeOpenEvent) {
			const openEvent = dataRef.current.openEvent;
			const hasClickedOnInactiveTrigger = store.select("domReferenceElement") !== currentTarget;
			if (open && hasClickedOnInactiveTrigger) return true;
			if (!open) return true;
			if (!toggle) return true;
			if (openEvent && stickIfOpen) return !isClickLikeOpenEvent(openEvent.type);
			return false;
		}
		return {
			onPointerDown(event) {
				pointerTypeRef.current = isMouseLikePointerType(event.pointerType, true) && isVirtualPointerEvent(event.nativeEvent) ? "virtual" : event.pointerType;
			},
			onMouseDown(event) {
				const pointerType = pointerTypeRef.current;
				const nativeEvent = event.nativeEvent;
				const open = store.select("open");
				if (event.button !== 0 || eventOption === "click" || isMouseLikePointerType(pointerType, true) && ignoreMouse) return;
				const nextOpen = getNextOpen(open, event.currentTarget, (openEventType) => openEventType === "click" || openEventType === "mousedown");
				const target = getTarget(nativeEvent);
				if (isTypeableElement(target)) {
					setOpenWithTouchDelay(nextOpen, nativeEvent, target, pointerType);
					return;
				}
				const eventCurrentTarget = event.currentTarget;
				frame.request(() => {
					setOpenWithTouchDelay(nextOpen, nativeEvent, eventCurrentTarget, pointerType);
				});
			},
			onClick(event) {
				if (eventOption === "mousedown-only") return;
				const pointerType = pointerTypeRef.current;
				if (eventOption === "mousedown" && pointerType) {
					pointerTypeRef.current = void 0;
					return;
				}
				if (isMouseLikePointerType(pointerType, true) && ignoreMouse) return;
				setOpenWithTouchDelay(getNextOpen(store.select("open"), event.currentTarget, (openEventType) => openEventType === "click" || openEventType === "mousedown" || openEventType === "keydown" || openEventType === "keyup"), event.nativeEvent, event.currentTarget, pointerType);
			},
			onKeyDown() {
				pointerTypeRef.current = void 0;
			}
		};
	}, [
		dataRef,
		eventOption,
		ignoreMouse,
		reason,
		store,
		stickIfOpen,
		toggle,
		frame,
		touchOpenTimeout,
		touchOpenDelay
	]);
	return import_react.useMemo(() => enabled ? { reference } : EMPTY_OBJECT, [enabled, reference]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useClientPoint.mjs
function createVirtualElement(domElement, data) {
	let offsetX = null;
	let offsetY = null;
	let isAutoUpdateEvent = false;
	return {
		contextElement: domElement || void 0,
		getBoundingClientRect() {
			const domRect = domElement?.getBoundingClientRect() || {
				width: 0,
				height: 0,
				x: 0,
				y: 0
			};
			const isXAxis = data.axis === "x" || data.axis === "both";
			const isYAxis = data.axis === "y" || data.axis === "both";
			const canTrackCursorOnAutoUpdate = ["mouseenter", "mousemove"].includes(data.dataRef.current.openEvent?.type || "") && data.pointerType !== "touch";
			let width = domRect.width;
			let height = domRect.height;
			let x = domRect.x;
			let y = domRect.y;
			if (offsetX == null && data.x && isXAxis) offsetX = domRect.x - data.x;
			if (offsetY == null && data.y && isYAxis) offsetY = domRect.y - data.y;
			x -= offsetX || 0;
			y -= offsetY || 0;
			width = 0;
			height = 0;
			if (!isAutoUpdateEvent || canTrackCursorOnAutoUpdate) {
				width = data.axis === "y" ? domRect.width : 0;
				height = data.axis === "x" ? domRect.height : 0;
				x = isXAxis && data.x != null ? data.x : x;
				y = isYAxis && data.y != null ? data.y : y;
			} else if (isAutoUpdateEvent && !canTrackCursorOnAutoUpdate) {
				height = data.axis === "x" ? domRect.height : height;
				width = data.axis === "y" ? domRect.width : width;
			}
			isAutoUpdateEvent = true;
			return {
				width,
				height,
				x,
				y,
				top: y,
				right: x + width,
				bottom: y + height,
				left: x
			};
		}
	};
}
function isMouseBasedEvent(event) {
	return event != null && event.clientX != null;
}
/**
* Positions the floating element relative to a client point (in the viewport),
* such as the mouse position. By default, it follows the mouse cursor.
* @see https://floating-ui.com/docs/useClientPoint
*/
function useClientPoint(context, props = {}) {
	const { enabled = true, axis = "both" } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const open = store.useState("open");
	const floating = store.useState("floatingElement");
	const domReference = store.useState("domReferenceElement");
	const dataRef = store.context.dataRef;
	const initialRef = import_react.useRef(false);
	const cleanupListenerRef = import_react.useRef(null);
	const [pointerType, setPointerType] = import_react.useState();
	const [reactive, setReactive] = import_react.useState([]);
	const resetReference = useStableCallback((reference) => {
		store.set("positionReference", reference);
	});
	const setReference = useStableCallback((newX, newY, referenceElement) => {
		if (initialRef.current) return;
		if (dataRef.current.openEvent && !isMouseBasedEvent(dataRef.current.openEvent)) return;
		store.set("positionReference", createVirtualElement(referenceElement ?? domReference, {
			x: newX,
			y: newY,
			axis,
			dataRef,
			pointerType
		}));
	});
	const handleReferenceEnterOrMove = useStableCallback((event) => {
		if (!open) setReference(event.clientX, event.clientY, event.currentTarget);
		else if (!cleanupListenerRef.current) {
			setReference(event.clientX, event.clientY, event.currentTarget);
			setReactive([]);
		}
	});
	const openCheck = isMouseLikePointerType(pointerType) ? floating : open;
	import_react.useEffect(() => {
		if (!enabled) {
			resetReference(domReference);
			return;
		}
		if (!openCheck) return;
		function cleanupListener() {
			cleanupListenerRef.current?.();
			cleanupListenerRef.current = null;
		}
		const win = getWindow(floating);
		function handleMouseMove(event) {
			const target = getTarget(event);
			if (!contains(floating, target)) setReference(event.clientX, event.clientY);
			else cleanupListener();
		}
		if (!dataRef.current.openEvent || isMouseBasedEvent(dataRef.current.openEvent)) cleanupListenerRef.current = addEventListener(win, "mousemove", handleMouseMove);
		else resetReference(domReference);
		return cleanupListener;
	}, [
		openCheck,
		enabled,
		floating,
		dataRef,
		domReference,
		store,
		setReference,
		resetReference,
		reactive
	]);
	import_react.useEffect(() => () => {
		store.set("positionReference", null);
	}, [store]);
	import_react.useEffect(() => {
		if (enabled && !floating) initialRef.current = false;
	}, [enabled, floating]);
	import_react.useEffect(() => {
		if (!enabled && open) initialRef.current = true;
	}, [enabled, open]);
	const reference = import_react.useMemo(() => {
		function setPointerTypeRef(event) {
			setPointerType(event.pointerType);
		}
		return {
			onPointerDown: setPointerTypeRef,
			onPointerEnter: setPointerTypeRef,
			onMouseMove: handleReferenceEnterOrMove,
			onMouseEnter: handleReferenceEnterOrMove
		};
	}, [handleReferenceEnterOrMove]);
	return import_react.useMemo(() => enabled ? {
		reference,
		trigger: reference
	} : {}, [enabled, reference]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useDismiss.mjs
function alwaysFalse() {
	return false;
}
function normalizeProp(normalizable) {
	return {
		escapeKey: typeof normalizable === "boolean" ? normalizable : normalizable?.escapeKey ?? false,
		outsidePress: typeof normalizable === "boolean" ? normalizable : normalizable?.outsidePress ?? true
	};
}
/**
* Closes the floating element when a dismissal is requested — by default, when
* the user presses the `escape` key or outside of the floating element.
* @see https://floating-ui.com/docs/useDismiss
*/
function useDismiss(context, props = {}) {
	const { enabled = true, escapeKey: escapeKey$1 = true, outsidePress: outsidePressProp = true, outsidePressEvent = "sloppy", referencePress = alwaysFalse, bubbles, externalTree } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const open = store.useState("open");
	const floatingElement = store.useState("floatingElement");
	const { dataRef, events } = store.context;
	const tree = useFloatingTree(externalTree);
	const outsidePressFn = useStableCallback(typeof outsidePressProp === "function" ? outsidePressProp : () => false);
	const outsidePress$1 = typeof outsidePressProp === "function" ? outsidePressFn : outsidePressProp;
	const outsidePressEnabled = outsidePress$1 !== false;
	const getOutsidePressEventProp = useStableCallback(() => outsidePressEvent);
	const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } = normalizeProp(bubbles);
	const pressStartedInsideRef = import_react.useRef(false);
	const pressStartPreventedRef = import_react.useRef(false);
	const suppressNextOutsideClickRef = import_react.useRef(false);
	const sawPressWhileOpenRef = import_react.useRef(false);
	const isComposingRef = import_react.useRef(false);
	const currentPointerTypeRef = import_react.useRef("");
	const touchStateRef = import_react.useRef(null);
	const cancelDismissOnEndTimeout = useTimeout();
	const clearInsideReactTreeTimeout = useTimeout();
	const clearInsideReactTree = useStableCallback(() => {
		clearInsideReactTreeTimeout.clear();
		dataRef.current.insideReactTree = false;
	});
	const hasBlockingChild = useStableCallback((bubbleKey) => {
		const nodeId = dataRef.current.floatingContext?.nodeId;
		return (tree ? getNodeChildren(tree.nodesRef.current, nodeId) : []).some((child) => child.context?.open && !child.context.dataRef.current[bubbleKey]);
	});
	const isEventWithinOwnElements = useStableCallback((event) => {
		return isEventTargetWithin(event, store.select("floatingElement")) || isEventTargetWithin(event, store.select("domReferenceElement"));
	});
	const closeOnReferencePress = useStableCallback((event) => {
		if (!referencePress()) return;
		store.setOpen(false, createChangeEventDetails(triggerPress, event.nativeEvent));
	});
	const closeOnEscapeKeyDown = useStableCallback((event) => {
		if (!open || !enabled || !escapeKey$1 || event.key !== "Escape") return;
		if (isComposingRef.current) return;
		if (!escapeKeyBubbles && hasBlockingChild("__escapeKeyBubbles")) return;
		const eventDetails = createChangeEventDetails(escapeKey, isReactEvent(event) ? event.nativeEvent : event);
		store.setOpen(false, eventDetails);
		if (!eventDetails.isCanceled) event.preventDefault();
		if (!escapeKeyBubbles && !eventDetails.isPropagationAllowed) event.stopPropagation();
	});
	const markInsideReactTree = useStableCallback(() => {
		dataRef.current.insideReactTree = true;
		clearInsideReactTreeTimeout.start(0, clearInsideReactTree);
	});
	const markPressStartedInsideReactTree = useStableCallback((event) => {
		if (!open || !enabled || event.button !== 0) return;
		const target = getTarget(event.nativeEvent);
		if (!contains(store.select("floatingElement"), target)) return;
		if (!pressStartedInsideRef.current) {
			pressStartedInsideRef.current = true;
			pressStartPreventedRef.current = false;
		}
	});
	const markInsidePressStartPrevented = useStableCallback((event) => {
		if (!open || !enabled) return;
		if (!(event.defaultPrevented || event.nativeEvent.defaultPrevented)) return;
		if (pressStartedInsideRef.current) pressStartPreventedRef.current = true;
	});
	import_react.useEffect(() => {
		function handleOpenChange(details) {
			if (!details.open) sawPressWhileOpenRef.current = false;
		}
		events.on("openchange", handleOpenChange);
		return () => {
			events.off("openchange", handleOpenChange);
		};
	}, [events]);
	import_react.useEffect(() => {
		if (!open || !enabled) {
			if (!open) sawPressWhileOpenRef.current = false;
			return clearInsideReactTree;
		}
		dataRef.current.__escapeKeyBubbles = escapeKeyBubbles;
		dataRef.current.__outsidePressBubbles = outsidePressBubbles;
		const compositionTimeout = new Timeout();
		const preventedPressSuppressionTimeout = new Timeout();
		const doc = ownerDocument(floatingElement);
		function handleCompositionStart() {
			compositionTimeout.clear();
			isComposingRef.current = true;
		}
		function handleCompositionEnd() {
			compositionTimeout.start(webkit ? 5 : 0, () => {
				isComposingRef.current = false;
			});
		}
		function suppressImmediateOutsideClickAfterPreventedStart() {
			suppressNextOutsideClickRef.current = true;
			preventedPressSuppressionTimeout.start(0, () => {
				suppressNextOutsideClickRef.current = false;
			});
		}
		function resetPressStartState() {
			pressStartedInsideRef.current = false;
			pressStartPreventedRef.current = false;
		}
		function getOutsidePressEvent() {
			const type = currentPointerTypeRef.current;
			const computedType = type === "pen" || !type ? "mouse" : type;
			const outsidePressEventValue = getOutsidePressEventProp();
			const resolved = typeof outsidePressEventValue === "function" ? outsidePressEventValue() : outsidePressEventValue;
			if (typeof resolved === "string") return resolved;
			return resolved[computedType];
		}
		function shouldIgnoreEvent(event) {
			const computedOutsidePressEvent = getOutsidePressEvent();
			return computedOutsidePressEvent === "intentional" && event.type !== "click" || computedOutsidePressEvent === "sloppy" && event.type === "click";
		}
		function isEventWithinFloatingTree(event) {
			const nodeId = dataRef.current.floatingContext?.nodeId;
			const targetIsInsideChildren = tree && getNodeChildren(tree.nodesRef.current, nodeId).some((node) => isEventTargetWithin(event, node.context?.elements.floating));
			return isEventWithinOwnElements(event) || targetIsInsideChildren;
		}
		function closeOnPressOutside(event) {
			if (shouldIgnoreEvent(event)) {
				if (event.type !== "click" && !isEventWithinOwnElements(event)) {
					preventedPressSuppressionTimeout.clear();
					suppressNextOutsideClickRef.current = false;
				}
				clearInsideReactTree();
				return;
			}
			if (dataRef.current.insideReactTree) {
				clearInsideReactTree();
				return;
			}
			const target = getTarget(event);
			const inertSelector = `[${createAttribute("inert")}]`;
			const targetRoot = isElement(target) ? target.getRootNode() : null;
			const markers = Array.from((isShadowRoot(targetRoot) ? targetRoot : ownerDocument(store.select("floatingElement"))).querySelectorAll(inertSelector));
			const triggers = store.context.triggerElements;
			if (target && (triggers.hasElement(target) || triggers.hasMatchingElement((trigger) => contains(trigger, target)))) return;
			let targetRootAncestor = isElement(target) ? target : null;
			while (targetRootAncestor && !isLastTraversableNode(targetRootAncestor)) {
				const nextParent = getParentNode(targetRootAncestor);
				if (isLastTraversableNode(nextParent) || !isElement(nextParent)) break;
				targetRootAncestor = nextParent;
			}
			if (markers.length && isElement(target) && !isRootElement(target) && !contains(target, store.select("floatingElement")) && markers.every((marker) => !contains(targetRootAncestor, marker))) return;
			if (isHTMLElement(target) && !("touches" in event)) {
				const lastTraversableNode = isLastTraversableNode(target);
				const style = getComputedStyle$1(target);
				const scrollRe = /auto|scroll/;
				const isScrollableX = lastTraversableNode || scrollRe.test(style.overflowX);
				const isScrollableY = lastTraversableNode || scrollRe.test(style.overflowY);
				const canScrollX = isScrollableX && target.clientWidth > 0 && target.scrollWidth > target.clientWidth;
				const canScrollY = isScrollableY && target.clientHeight > 0 && target.scrollHeight > target.clientHeight;
				const isRTL = style.direction === "rtl";
				const pressedVerticalScrollbar = canScrollY && (isRTL ? event.offsetX <= target.offsetWidth - target.clientWidth : event.offsetX > target.clientWidth);
				const pressedHorizontalScrollbar = canScrollX && event.offsetY > target.clientHeight;
				if (pressedVerticalScrollbar || pressedHorizontalScrollbar) return;
			}
			if (isEventWithinFloatingTree(event)) return;
			if (getOutsidePressEvent() === "intentional") {
				if (event.detail !== 0 && !isVirtualClick(event) && !sawPressWhileOpenRef.current) return;
				if (suppressNextOutsideClickRef.current) {
					preventedPressSuppressionTimeout.clear();
					suppressNextOutsideClickRef.current = false;
					return;
				}
			}
			if (typeof outsidePress$1 === "function" && !outsidePress$1(event)) return;
			if (hasBlockingChild("__outsidePressBubbles")) return;
			store.setOpen(false, createChangeEventDetails(outsidePress, event));
			clearInsideReactTree();
		}
		function handlePointerDown(event) {
			if (getOutsidePressEvent() !== "sloppy" || event.pointerType === "touch" || !store.select("open") || !enabled || isEventWithinOwnElements(event)) return;
			closeOnPressOutside(event);
		}
		function handleTouchStart(event) {
			if (getOutsidePressEvent() !== "sloppy" || !store.select("open") || !enabled || isEventWithinOwnElements(event)) return;
			const touch = event.touches[0];
			if (touch) {
				touchStateRef.current = {
					startTime: Date.now(),
					startX: touch.clientX,
					startY: touch.clientY,
					dismissOnTouchEnd: false,
					dismissOnMouseDown: true
				};
				cancelDismissOnEndTimeout.start(1e3, () => {
					if (touchStateRef.current) {
						touchStateRef.current.dismissOnTouchEnd = false;
						touchStateRef.current.dismissOnMouseDown = false;
					}
				});
			}
		}
		function addTargetEventListenerOnce(event, listener) {
			const target = getTarget(event);
			if (!target) return;
			const unsubscribe = addEventListener(target, event.type, () => {
				listener(event);
				unsubscribe();
			});
		}
		function handleTouchStartCapture(event) {
			currentPointerTypeRef.current = "touch";
			addTargetEventListenerOnce(event, handleTouchStart);
		}
		function closeOnPressOutsideCapture(event) {
			cancelDismissOnEndTimeout.clear();
			if (event.type === "pointerdown") {
				if (event.button === 0) sawPressWhileOpenRef.current = true;
				currentPointerTypeRef.current = event.pointerType;
			}
			if (event.type === "mousedown" && touchStateRef.current && !touchStateRef.current.dismissOnMouseDown) return;
			addTargetEventListenerOnce(event, (targetEvent) => {
				if (targetEvent.type === "pointerdown") handlePointerDown(targetEvent);
				else closeOnPressOutside(targetEvent);
			});
		}
		function handlePressEndCapture(event) {
			if (event.type === "pointercancel") sawPressWhileOpenRef.current = false;
			if (!pressStartedInsideRef.current) return;
			const pressStartedInsideDefaultPrevented = pressStartPreventedRef.current;
			resetPressStartState();
			if (getOutsidePressEvent() !== "intentional") return;
			if (event.type === "pointercancel") {
				if (pressStartedInsideDefaultPrevented) suppressImmediateOutsideClickAfterPreventedStart();
				return;
			}
			if (isEventWithinFloatingTree(event)) return;
			if (pressStartedInsideDefaultPrevented) {
				suppressImmediateOutsideClickAfterPreventedStart();
				return;
			}
			if (typeof outsidePress$1 === "function" && !outsidePress$1(event)) return;
			preventedPressSuppressionTimeout.clear();
			suppressNextOutsideClickRef.current = true;
			clearInsideReactTree();
		}
		function handleTouchMove(event) {
			if (getOutsidePressEvent() !== "sloppy" || !touchStateRef.current || isEventWithinOwnElements(event)) return;
			const touch = event.touches[0];
			if (!touch) return;
			const deltaX = Math.abs(touch.clientX - touchStateRef.current.startX);
			const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
			if (distance > 5) touchStateRef.current.dismissOnTouchEnd = true;
			if (distance > 10) {
				closeOnPressOutside(event);
				cancelDismissOnEndTimeout.clear();
				touchStateRef.current = null;
			}
		}
		function handleTouchMoveCapture(event) {
			addTargetEventListenerOnce(event, handleTouchMove);
		}
		function handleTouchEnd(event) {
			if (getOutsidePressEvent() !== "sloppy" || !touchStateRef.current || isEventWithinOwnElements(event)) return;
			if (touchStateRef.current.dismissOnTouchEnd) closeOnPressOutside(event);
			cancelDismissOnEndTimeout.clear();
			touchStateRef.current = null;
		}
		function handleTouchEndCapture(event) {
			addTargetEventListenerOnce(event, handleTouchEnd);
		}
		const unsubscribe = mergeCleanups(escapeKey$1 && mergeCleanups(addEventListener(doc, "keydown", closeOnEscapeKeyDown), addEventListener(doc, "compositionstart", handleCompositionStart), addEventListener(doc, "compositionend", handleCompositionEnd)), outsidePressEnabled && mergeCleanups(addEventListener(doc, "click", closeOnPressOutsideCapture, true), addEventListener(doc, "pointerdown", closeOnPressOutsideCapture, true), addEventListener(doc, "pointerup", handlePressEndCapture, true), addEventListener(doc, "pointercancel", handlePressEndCapture, true), addEventListener(doc, "mousedown", closeOnPressOutsideCapture, true), addEventListener(doc, "mouseup", handlePressEndCapture, true), addEventListener(doc, "touchstart", handleTouchStartCapture, {
			capture: true,
			passive: true
		}), addEventListener(doc, "touchmove", handleTouchMoveCapture, {
			capture: true,
			passive: true
		}), addEventListener(doc, "touchend", handleTouchEndCapture, {
			capture: true,
			passive: true
		})));
		return () => {
			unsubscribe();
			compositionTimeout.clear();
			preventedPressSuppressionTimeout.clear();
			resetPressStartState();
			suppressNextOutsideClickRef.current = false;
			clearInsideReactTree();
		};
	}, [
		dataRef,
		floatingElement,
		escapeKey$1,
		outsidePressEnabled,
		outsidePress$1,
		open,
		enabled,
		escapeKeyBubbles,
		outsidePressBubbles,
		closeOnEscapeKeyDown,
		clearInsideReactTree,
		getOutsidePressEventProp,
		hasBlockingChild,
		isEventWithinOwnElements,
		tree,
		store,
		cancelDismissOnEndTimeout
	]);
	const reference = import_react.useMemo(() => ({
		onKeyDown: closeOnEscapeKeyDown,
		onPointerDown: closeOnReferencePress,
		onClick: closeOnReferencePress
	}), [closeOnEscapeKeyDown, closeOnReferencePress]);
	const floating = import_react.useMemo(() => ({
		onKeyDown: closeOnEscapeKeyDown,
		onPointerDown: markInsidePressStartPrevented,
		onMouseDown: markInsidePressStartPrevented,
		onClickCapture: markInsideReactTree,
		onMouseDownCapture(event) {
			markInsideReactTree();
			markPressStartedInsideReactTree(event);
		},
		onPointerDownCapture(event) {
			markInsideReactTree();
			markPressStartedInsideReactTree(event);
		},
		onMouseUpCapture: markInsideReactTree,
		onTouchEndCapture: markInsideReactTree,
		onTouchMoveCapture: markInsideReactTree
	}), [
		closeOnEscapeKeyDown,
		markInsideReactTree,
		markPressStartedInsideReactTree,
		markInsidePressStartPrevented
	]);
	return import_react.useMemo(() => enabled ? {
		reference,
		floating,
		trigger: reference
	} : {}, [
		enabled,
		reference,
		floating
	]);
}
//#endregion
//#region node_modules/.pnpm/@floating-ui+core@1.8.0/node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
	let { reference, floating } = _ref;
	const sideAxis = getSideAxis(placement);
	const alignmentAxis = getAlignmentAxis(placement);
	const alignLength = getAxisLength(alignmentAxis);
	const side = getSide(placement);
	const isVertical = sideAxis === "y";
	const commonX = reference.x + reference.width / 2 - floating.width / 2;
	const commonY = reference.y + reference.height / 2 - floating.height / 2;
	const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
	let coords;
	switch (side) {
		case "top":
			coords = {
				x: commonX,
				y: reference.y - floating.height
			};
			break;
		case "bottom":
			coords = {
				x: commonX,
				y: reference.y + reference.height
			};
			break;
		case "right":
			coords = {
				x: reference.x + reference.width,
				y: commonY
			};
			break;
		case "left":
			coords = {
				x: reference.x - floating.width,
				y: commonY
			};
			break;
		default: coords = {
			x: reference.x,
			y: reference.y
		};
	}
	const alignment = getAlignment(placement);
	if (alignment) coords[alignmentAxis] += commonAlign * (alignment === "end" ? 1 : -1) * (rtl && isVertical ? -1 : 1);
	return coords;
}
/**
* Resolves with an object of overflow side offsets that determine how much the
* element is overflowing a given clipping boundary on each side.
* - positive = overflowing the boundary by that number of pixels
* - negative = how many pixels left before it will overflow
* - 0 = lies flush with the boundary
* @see https://floating-ui.com/docs/detectOverflow
*/
async function detectOverflow(state, options) {
	var _await$platform$isEle;
	if (options === void 0) options = {};
	const { x, y, platform, rects, elements, strategy } = state;
	const { boundary = "clippingAncestors", rootBoundary = "viewport", elementContext = "floating", altBoundary = false, padding = 0 } = evaluate(options, state);
	const paddingObject = getPaddingObject(padding);
	const element = elements[altBoundary ? elementContext === "floating" ? "reference" : "floating" : elementContext];
	const clippingClientRect = rectToClientRect(await platform.getClippingRect({
		element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating)),
		boundary,
		rootBoundary,
		strategy
	}));
	const rect = elementContext === "floating" ? {
		x,
		y,
		width: rects.floating.width,
		height: rects.floating.height
	} : rects.reference;
	const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
	const offsetScale = await (platform.isElement == null ? void 0 : platform.isElement(offsetParent)) && await (platform.getScale == null ? void 0 : platform.getScale(offsetParent)) || {
		x: 1,
		y: 1
	};
	const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
		elements,
		rect,
		offsetParent,
		strategy
	}) : rect);
	return {
		top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
		bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
		left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
		right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
	};
}
var MAX_RESET_COUNT = 50;
/**
* Computes the `x` and `y` coordinates that will place the floating element
* next to a given reference element.
*
* This export does not have any `platform` interface logic. You will need to
* write one for the platform you are using Floating UI with.
*/
var computePosition$1 = async (reference, floating, config) => {
	const { placement = "bottom", strategy = "absolute", middleware = [], platform } = config;
	const platformWithDetectOverflow = platform.detectOverflow ? platform : {
		...platform,
		detectOverflow
	};
	const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
	let rects = await platform.getElementRects({
		reference,
		floating,
		strategy
	});
	let { x, y } = computeCoordsFromPlacement(rects, placement, rtl);
	let statefulPlacement = placement;
	let resetCount = 0;
	const middlewareData = {};
	for (let i = 0; i < middleware.length; i++) {
		const currentMiddleware = middleware[i];
		if (!currentMiddleware) continue;
		const { name, fn } = currentMiddleware;
		const { x: nextX, y: nextY, data, reset } = await fn({
			x,
			y,
			initialPlacement: placement,
			placement: statefulPlacement,
			strategy,
			middlewareData,
			rects,
			platform: platformWithDetectOverflow,
			elements: {
				reference,
				floating
			}
		});
		x = nextX != null ? nextX : x;
		y = nextY != null ? nextY : y;
		middlewareData[name] = {
			...middlewareData[name],
			...data
		};
		if (reset && resetCount < MAX_RESET_COUNT) {
			resetCount++;
			if (typeof reset === "object") {
				if (reset.placement) statefulPlacement = reset.placement;
				if (reset.rects) rects = reset.rects === true ? await platform.getElementRects({
					reference,
					floating,
					strategy
				}) : reset.rects;
				({x, y} = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
			}
			i = -1;
		}
	}
	return {
		x,
		y,
		placement: statefulPlacement,
		strategy,
		middlewareData
	};
};
/**
* Optimizes the visibility of the floating element by flipping the `placement`
* in order to keep it in view when the preferred placement(s) will overflow the
* clipping boundary. Alternative to `autoPlacement`.
* @see https://floating-ui.com/docs/flip
*/
var flip$2 = function(options) {
	if (options === void 0) options = {};
	return {
		name: "flip",
		options,
		async fn(state) {
			var _middlewareData$arrow, _middlewareData$flip;
			const { placement, middlewareData, rects, initialPlacement, platform, elements } = state;
			const { mainAxis: checkMainAxis = true, crossAxis: checkCrossAxis = true, fallbackPlacements: specifiedFallbackPlacements, fallbackStrategy = "bestFit", fallbackAxisSideDirection = "none", flipAlignment = true, ...detectOverflowOptions } = evaluate(options, state);
			if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) return {};
			const side = getSide(placement);
			const initialSideAxis = getSideAxis(initialPlacement);
			const isBasePlacement = getSide(initialPlacement) === initialPlacement;
			const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
			const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
			const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
			if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
			const placements = [initialPlacement, ...fallbackPlacements];
			const overflow = await platform.detectOverflow(state, detectOverflowOptions);
			const overflows = [];
			let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
			if (checkMainAxis) overflows.push(overflow[side]);
			if (checkCrossAxis) {
				const sides = getAlignmentSides(placement, rects, rtl);
				overflows.push(overflow[sides[0]], overflow[sides[1]]);
			}
			overflowsData = [...overflowsData, {
				placement,
				overflows
			}];
			if (!overflows.every((side) => side <= 0)) {
				var _middlewareData$flip2, _overflowsData$filter;
				const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
				const nextPlacement = placements[nextIndex];
				if (nextPlacement) {
					if (!(checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false) || overflowsData.every((d) => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) return {
						data: {
							index: nextIndex,
							overflows: overflowsData
						},
						reset: { placement: nextPlacement }
					};
				}
				let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
				if (!resetPlacement) switch (fallbackStrategy) {
					case "bestFit": {
						var _overflowsData$filter2;
						const placement = (_overflowsData$filter2 = overflowsData.filter((d) => {
							if (hasFallbackAxisSideDirection) {
								const currentSideAxis = getSideAxis(d.placement);
								return currentSideAxis === initialSideAxis || currentSideAxis === "y";
							}
							return true;
						}).map((d) => [d.placement, d.overflows.filter((overflow) => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
						if (placement) resetPlacement = placement;
						break;
					}
					case "initialPlacement": resetPlacement = initialPlacement;
				}
				if (placement !== resetPlacement) return { reset: { placement: resetPlacement } };
			}
			return {};
		}
	};
};
var originSides = /*#__PURE__*/ new Set(["left", "top"]);
async function convertValueToCoords(state, options) {
	const { placement, platform, elements } = state;
	const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
	const side = getSide(placement);
	const alignment = getAlignment(placement);
	const isVertical = getSideAxis(placement) === "y";
	const mainAxisMulti = originSides.has(side) ? -1 : 1;
	const crossAxisMulti = rtl && isVertical ? -1 : 1;
	const rawValue = evaluate(options, state);
	let { mainAxis, crossAxis, alignmentAxis } = typeof rawValue === "number" ? {
		mainAxis: rawValue,
		crossAxis: 0,
		alignmentAxis: null
	} : {
		mainAxis: rawValue.mainAxis || 0,
		crossAxis: rawValue.crossAxis || 0,
		alignmentAxis: rawValue.alignmentAxis
	};
	if (alignment && typeof alignmentAxis === "number") crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
	return isVertical ? {
		x: crossAxis * crossAxisMulti,
		y: mainAxis * mainAxisMulti
	} : {
		x: mainAxis * mainAxisMulti,
		y: crossAxis * crossAxisMulti
	};
}
/**
* Modifies the placement by translating the floating element along the
* specified axes.
* A number (shorthand for `mainAxis` or distance), or an axes configuration
* object may be passed.
* @see https://floating-ui.com/docs/offset
*/
var offset$2 = function(options) {
	if (options === void 0) options = 0;
	return {
		name: "offset",
		options,
		async fn(state) {
			var _middlewareData$offse, _middlewareData$arrow;
			const { x, y, placement, middlewareData } = state;
			const diffCoords = await convertValueToCoords(state, options);
			if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) return {};
			return {
				x: x + diffCoords.x,
				y: y + diffCoords.y,
				data: {
					...diffCoords,
					placement
				}
			};
		}
	};
};
/**
* Optimizes the visibility of the floating element by shifting it in order to
* keep it in view when it will overflow the clipping boundary.
* @see https://floating-ui.com/docs/shift
*/
var shift$2 = function(options) {
	if (options === void 0) options = {};
	return {
		name: "shift",
		options,
		async fn(state) {
			const { x, y, placement, platform } = state;
			const { mainAxis: checkMainAxis = true, crossAxis: checkCrossAxis = false, limiter = { fn: (_ref) => {
				let { x, y } = _ref;
				return {
					x,
					y
				};
			} }, ...detectOverflowOptions } = evaluate(options, state);
			const coords = {
				x,
				y
			};
			const overflow = await platform.detectOverflow(state, detectOverflowOptions);
			const crossAxis = getSideAxis(placement);
			const mainAxis = getOppositeAxis(crossAxis);
			let mainAxisCoord = coords[mainAxis];
			let crossAxisCoord = coords[crossAxis];
			const clampCoord = (axis, coord) => clamp$1(coord + overflow[axis === "y" ? "top" : "left"], coord, coord - overflow[axis === "y" ? "bottom" : "right"]);
			if (checkMainAxis) mainAxisCoord = clampCoord(mainAxis, mainAxisCoord);
			if (checkCrossAxis) crossAxisCoord = clampCoord(crossAxis, crossAxisCoord);
			const limitedCoords = limiter.fn({
				...state,
				[mainAxis]: mainAxisCoord,
				[crossAxis]: crossAxisCoord
			});
			return {
				...limitedCoords,
				data: {
					x: limitedCoords.x - x,
					y: limitedCoords.y - y,
					enabled: {
						[mainAxis]: checkMainAxis,
						[crossAxis]: checkCrossAxis
					}
				}
			};
		}
	};
};
/**
* Built-in `limiter` that will stop `shift()` at a certain point.
*/
var limitShift$2 = function(options) {
	if (options === void 0) options = {};
	return {
		options,
		fn(state) {
			var _rawOffset$mainAxis, _rawOffset$crossAxis;
			const { x, y, placement, rects, middlewareData } = state;
			const { offset = 0, mainAxis: checkMainAxis = true, crossAxis: checkCrossAxis = true } = evaluate(options, state);
			const coords = {
				x,
				y
			};
			const crossAxis = getSideAxis(placement);
			const mainAxis = getOppositeAxis(crossAxis);
			let mainAxisCoord = coords[mainAxis];
			let crossAxisCoord = coords[crossAxis];
			const rawOffset = evaluate(offset, state);
			const computedOffset = typeof rawOffset === "number" ? {
				mainAxis: rawOffset,
				crossAxis: 0
			} : {
				mainAxis: (_rawOffset$mainAxis = rawOffset.mainAxis) != null ? _rawOffset$mainAxis : 0,
				crossAxis: (_rawOffset$crossAxis = rawOffset.crossAxis) != null ? _rawOffset$crossAxis : 0
			};
			if (checkMainAxis) {
				const len = mainAxis === "y" ? "height" : "width";
				const limitMin = rects.reference[mainAxis] - rects.floating[len] + computedOffset.mainAxis;
				const limitMax = rects.reference[mainAxis] + rects.reference[len] - computedOffset.mainAxis;
				if (mainAxisCoord < limitMin) mainAxisCoord = limitMin;
				else if (mainAxisCoord > limitMax) mainAxisCoord = limitMax;
			}
			if (checkCrossAxis) {
				var _middlewareData$offse, _middlewareData$offse2;
				const len = mainAxis === "y" ? "width" : "height";
				const isOriginSide = originSides.has(getSide(placement));
				const limitMin = rects.reference[crossAxis] - rects.floating[len] + (isOriginSide ? ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse[crossAxis]) || 0 : 0) + (isOriginSide ? 0 : computedOffset.crossAxis);
				const limitMax = rects.reference[crossAxis] + rects.reference[len] + (isOriginSide ? 0 : ((_middlewareData$offse2 = middlewareData.offset) == null ? void 0 : _middlewareData$offse2[crossAxis]) || 0) - (isOriginSide ? computedOffset.crossAxis : 0);
				if (crossAxisCoord < limitMin) crossAxisCoord = limitMin;
				else if (crossAxisCoord > limitMax) crossAxisCoord = limitMax;
			}
			return {
				[mainAxis]: mainAxisCoord,
				[crossAxis]: crossAxisCoord
			};
		}
	};
};
/**
* Provides data that allows you to change the size of the floating element —
* for instance, prevent it from overflowing the clipping boundary or match the
* width of the reference element.
* @see https://floating-ui.com/docs/size
*/
var size$2 = function(options) {
	if (options === void 0) options = {};
	return {
		name: "size",
		options,
		async fn(state) {
			const { placement, rects, platform, elements } = state;
			const { apply = () => {}, ...detectOverflowOptions } = evaluate(options, state);
			const overflow = await platform.detectOverflow(state, detectOverflowOptions);
			const side = getSide(placement);
			const alignment = getAlignment(placement);
			const isYAxis = getSideAxis(placement) === "y";
			const { width, height } = rects.floating;
			let heightSide;
			let widthSide;
			if (side === "top" || side === "bottom") {
				heightSide = side;
				widthSide = alignment === (await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
			} else {
				widthSide = side;
				heightSide = alignment === "end" ? "top" : "bottom";
			}
			const maximumClippingHeight = height - overflow.top - overflow.bottom;
			const maximumClippingWidth = width - overflow.left - overflow.right;
			const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
			const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
			const shiftData = state.middlewareData.shift;
			const noShift = !shiftData;
			let availableHeight = overflowAvailableHeight;
			let availableWidth = overflowAvailableWidth;
			if (shiftData != null && shiftData.enabled.x) availableWidth = maximumClippingWidth;
			if (shiftData != null && shiftData.enabled.y) availableHeight = maximumClippingHeight;
			if (noShift && !alignment) {
				if (isYAxis) availableWidth = width - 2 * max(overflow.left, overflow.right);
				else availableHeight = height - 2 * max(overflow.top, overflow.bottom);
			}
			await apply({
				...state,
				availableWidth,
				availableHeight
			});
			const nextDimensions = await platform.getDimensions(elements.floating);
			if (width !== nextDimensions.width || height !== nextDimensions.height) return { reset: { rects: true } };
			return {};
		}
	};
};
//#endregion
//#region node_modules/.pnpm/@floating-ui+dom@1.8.0/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
	const css = getComputedStyle$1(element);
	let width = parseFloat(css.width) || 0;
	let height = parseFloat(css.height) || 0;
	const hasOffset = isHTMLElement(element);
	const offsetWidth = hasOffset ? element.offsetWidth : width;
	const offsetHeight = hasOffset ? element.offsetHeight : height;
	const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
	if (shouldFallback) {
		width = offsetWidth;
		height = offsetHeight;
	}
	return {
		width,
		height,
		$: shouldFallback
	};
}
function unwrapElement(element) {
	return !isElement(element) ? element.contextElement : element;
}
function getScale$1(element) {
	const domElement = unwrapElement(element);
	if (!isHTMLElement(domElement)) return createCoords(1);
	const rect = domElement.getBoundingClientRect();
	const { width, height, $ } = getCssDimensions(domElement);
	let x = ($ ? round(rect.width) : rect.width) / width;
	let y = ($ ? round(rect.height) : rect.height) / height;
	if (!x || !Number.isFinite(x)) x = 1;
	if (!y || !Number.isFinite(y)) y = 1;
	return {
		x,
		y
	};
}
var noOffsets = /*#__PURE__*/ createCoords(0);
function getVisualOffsets(element) {
	const win = getWindow(element);
	if (!isWebKit() || !win.visualViewport) return noOffsets;
	return {
		x: win.visualViewport.offsetLeft,
		y: win.visualViewport.offsetTop
	};
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
	if (isFixed === void 0) isFixed = false;
	return !!floatingOffsetParent && isFixed && floatingOffsetParent === getWindow(element);
}
function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
	if (includeScale === void 0) includeScale = false;
	if (isFixedStrategy === void 0) isFixedStrategy = false;
	const clientRect = element.getBoundingClientRect();
	const domElement = unwrapElement(element);
	let scale = createCoords(1);
	if (includeScale) {
		if (offsetParent) {
			if (isElement(offsetParent)) scale = getScale$1(offsetParent);
		} else scale = getScale$1(element);
	}
	const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
	let x = (clientRect.left + visualOffsets.x) / scale.x;
	let y = (clientRect.top + visualOffsets.y) / scale.y;
	let width = clientRect.width / scale.x;
	let height = clientRect.height / scale.y;
	if (domElement && offsetParent) {
		const win = getWindow(domElement);
		const offsetWin = isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
		let currentWin = win;
		let currentIFrame = getFrameElement(currentWin);
		while (currentIFrame && offsetWin !== currentWin) {
			const iframeScale = getScale$1(currentIFrame);
			const iframeRect = currentIFrame.getBoundingClientRect();
			const css = getComputedStyle$1(currentIFrame);
			const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
			const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
			x *= iframeScale.x;
			y *= iframeScale.y;
			width *= iframeScale.x;
			height *= iframeScale.y;
			x += left;
			y += top;
			currentWin = getWindow(currentIFrame);
			currentIFrame = getFrameElement(currentWin);
		}
	}
	return rectToClientRect({
		width,
		height,
		x,
		y
	});
}
function getWindowScrollBarX(element, rect) {
	const leftScroll = getNodeScroll(element).scrollLeft;
	if (!rect) return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
	return rect.left + leftScroll;
}
function getHTMLOffset(documentElement, scroll) {
	const htmlRect = documentElement.getBoundingClientRect();
	return {
		x: htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect),
		y: htmlRect.top + scroll.scrollTop
	};
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
	let { elements, rect, offsetParent, strategy } = _ref;
	const isFixed = strategy === "fixed";
	const documentElement = getDocumentElement(offsetParent);
	const topLayer = elements ? isTopLayer(elements.floating) : false;
	if (offsetParent === documentElement || topLayer && isFixed) return rect;
	let scroll = {
		scrollLeft: 0,
		scrollTop: 0
	};
	let scale = createCoords(1);
	const offsets = createCoords(0);
	const isOffsetParentAnElement = isHTMLElement(offsetParent);
	if (isOffsetParentAnElement || !isFixed) {
		if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) scroll = getNodeScroll(offsetParent);
		if (isOffsetParentAnElement) {
			const offsetRect = getBoundingClientRect(offsetParent);
			scale = getScale$1(offsetParent);
			offsets.x = offsetRect.x + offsetParent.clientLeft;
			offsets.y = offsetRect.y + offsetParent.clientTop;
		}
	}
	const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
	return {
		width: rect.width * scale.x,
		height: rect.height * scale.y,
		x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
		y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
	};
}
function getClientRects(element) {
	return element.getClientRects ? Array.from(element.getClientRects()) : [];
}
function getDocumentRect(html) {
	const scroll = getNodeScroll(html);
	const body = html.ownerDocument.body;
	const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
	const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
	let x = -scroll.scrollLeft + getWindowScrollBarX(html);
	const y = -scroll.scrollTop;
	if (getComputedStyle$1(body).direction === "rtl") x += max(html.clientWidth, body.clientWidth) - width;
	return {
		width,
		height,
		x,
		y
	};
}
var SCROLLBAR_MAX = 25;
function getViewportRect(element, strategy, rootBoundary) {
	if (rootBoundary === void 0) rootBoundary = "viewport";
	const isLayoutViewport = rootBoundary === "layoutViewport";
	const win = getWindow(element);
	const html = getDocumentElement(element);
	const visualViewport = win.visualViewport;
	let width = html.clientWidth;
	let height = html.clientHeight;
	let x = 0;
	let y = 0;
	if (visualViewport) {
		const layoutRelativeClientCoords = !isWebKit() || strategy === "fixed";
		if (isLayoutViewport) {
			if (!layoutRelativeClientCoords) {
				x = -visualViewport.offsetLeft;
				y = -visualViewport.offsetTop;
			}
		} else {
			width = visualViewport.width;
			height = visualViewport.height;
			if (layoutRelativeClientCoords) {
				x = visualViewport.offsetLeft;
				y = visualViewport.offsetTop;
			}
		}
	}
	if (getWindowScrollBarX(html) <= 0) {
		const doc = html.ownerDocument;
		const body = doc.body;
		const bodyStyles = getComputedStyle(body);
		const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
		const reservedWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
		const gutter = getComputedStyle(html).scrollbarGutter === "stable both-edges" ? reservedWidth / 2 : reservedWidth;
		if (gutter <= SCROLLBAR_MAX) width -= gutter;
	}
	return {
		width,
		height,
		x,
		y
	};
}
function getInnerBoundingClientRect(element, strategy) {
	const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
	const top = clientRect.top + element.clientTop;
	const left = clientRect.left + element.clientLeft;
	const scale = getScale$1(element);
	return {
		width: element.clientWidth * scale.x,
		height: element.clientHeight * scale.y,
		x: left * scale.x,
		y: top * scale.y
	};
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
	let rect;
	if (clippingAncestor === "viewport" || clippingAncestor === "layoutViewport") rect = getViewportRect(element, strategy, clippingAncestor);
	else if (clippingAncestor === "document") rect = getDocumentRect(getDocumentElement(element));
	else if (isElement(clippingAncestor)) rect = getInnerBoundingClientRect(clippingAncestor, strategy);
	else {
		const visualOffsets = getVisualOffsets(element);
		rect = {
			x: clippingAncestor.x - visualOffsets.x,
			y: clippingAncestor.y - visualOffsets.y,
			width: clippingAncestor.width,
			height: clippingAncestor.height
		};
	}
	return rectToClientRect(rect);
}
function getClippingElementAncestors(element, cache) {
	const cachedResult = cache.get(element);
	if (cachedResult) return cachedResult;
	let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
	let lastKeptComputedStyle = null;
	const elementIsFixed = getComputedStyle$1(element).position === "fixed";
	let currentNode = elementIsFixed ? getParentNode(element) : element;
	while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
		const computedStyle = getComputedStyle$1(currentNode);
		const currentNodeIsContaining = isContainingBlock(currentNode);
		const lastPosition = lastKeptComputedStyle ? lastKeptComputedStyle.position : elementIsFixed ? "fixed" : "";
		if (!currentNodeIsContaining && (lastPosition === "fixed" || lastPosition === "absolute" && computedStyle.position === "static")) result = result.filter((ancestor) => ancestor !== currentNode);
		else lastKeptComputedStyle = computedStyle;
		currentNode = getParentNode(currentNode);
	}
	cache.set(element, result);
	return result;
}
function getClippingRect(_ref) {
	let { element, boundary, rootBoundary, strategy } = _ref;
	const clippingAncestors = [...boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary), rootBoundary];
	const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy);
	let top = firstRect.top;
	let right = firstRect.right;
	let bottom = firstRect.bottom;
	let left = firstRect.left;
	for (let i = 1; i < clippingAncestors.length; i++) {
		const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy);
		top = max(rect.top, top);
		right = min(rect.right, right);
		bottom = min(rect.bottom, bottom);
		left = max(rect.left, left);
	}
	return {
		width: right - left,
		height: bottom - top,
		x: left,
		y: top
	};
}
function getDimensions(element) {
	const { width, height } = getCssDimensions(element);
	return {
		width,
		height
	};
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
	const isOffsetParentAnElement = isHTMLElement(offsetParent);
	const documentElement = getDocumentElement(offsetParent);
	const isFixed = strategy === "fixed";
	const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
	let scroll = {
		scrollLeft: 0,
		scrollTop: 0
	};
	const offsets = createCoords(0);
	if (isOffsetParentAnElement || !isFixed) {
		if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) scroll = getNodeScroll(offsetParent);
		if (isOffsetParentAnElement) {
			const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
			offsets.x = offsetRect.x + offsetParent.clientLeft;
			offsets.y = offsetRect.y + offsetParent.clientTop;
		}
	}
	if (!isOffsetParentAnElement && documentElement) offsets.x = getWindowScrollBarX(documentElement);
	const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
	return {
		x: rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x,
		y: rect.top + scroll.scrollTop - offsets.y - htmlOffset.y,
		width: rect.width,
		height: rect.height
	};
}
function isStaticPositioned(element) {
	return getComputedStyle$1(element).position === "static";
}
function getTrueOffsetParent(element, polyfill) {
	if (!isHTMLElement(element) || getComputedStyle$1(element).position === "fixed") return null;
	if (polyfill) return polyfill(element);
	let rawOffsetParent = element.offsetParent;
	if (getDocumentElement(element) === rawOffsetParent) rawOffsetParent = rawOffsetParent.ownerDocument.body;
	return rawOffsetParent;
}
function getOffsetParent(element, polyfill) {
	const win = getWindow(element);
	if (isTopLayer(element)) return win;
	if (!isHTMLElement(element)) {
		let svgOffsetParent = getParentNode(element);
		while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
			if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) return svgOffsetParent;
			svgOffsetParent = getParentNode(svgOffsetParent);
		}
		return win;
	}
	let offsetParent = getTrueOffsetParent(element, polyfill);
	while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) offsetParent = getTrueOffsetParent(offsetParent, polyfill);
	if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) return win;
	return offsetParent || getContainingBlock(element) || win;
}
var getElementRects = async function(data) {
	const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
	const getDimensionsFn = this.getDimensions;
	const floatingDimensions = await getDimensionsFn(data.floating);
	return {
		reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
		floating: {
			x: 0,
			y: 0,
			width: floatingDimensions.width,
			height: floatingDimensions.height
		}
	};
};
function isRTL(element) {
	return getComputedStyle$1(element).direction === "rtl";
}
var platform = {
	convertOffsetParentRelativeRectToViewportRelativeRect,
	getDocumentElement,
	getClippingRect,
	getOffsetParent,
	getElementRects,
	getClientRects,
	getDimensions,
	getScale: getScale$1,
	isElement,
	isRTL
};
function rectsAreEqual(a, b) {
	return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
function observeMove(element, onMove, ancestorResize) {
	let io = null;
	let timeoutId;
	const root = getDocumentElement(element);
	function cleanup() {
		var _io;
		clearTimeout(timeoutId);
		(_io = io) == null || _io.disconnect();
		io = null;
	}
	function refresh(skip, threshold) {
		if (skip === void 0) skip = false;
		if (threshold === void 0) threshold = 1;
		cleanup();
		const elementRectForRootMargin = element.getBoundingClientRect();
		const { left, top, width, height } = elementRectForRootMargin;
		if (!skip) onMove();
		if (!width || !height) return;
		const insetTop = floor(top);
		const insetRight = floor(root.clientWidth - (left + width));
		const insetBottom = floor(root.clientHeight - (top + height));
		const insetLeft = floor(left);
		const options = {
			rootMargin: -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px",
			threshold: max(0, min(1, threshold)) || 1
		};
		let isFirstUpdate = true;
		function handleObserve(entries) {
			const ratio = entries[0].intersectionRatio;
			if (!rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())) return refresh();
			if (ratio !== threshold) {
				if (!isFirstUpdate) return refresh();
				if (!ratio) timeoutId = setTimeout(() => {
					refresh(false, 1e-7);
				}, 1e3);
				else refresh(false, ratio);
			}
			isFirstUpdate = false;
		}
		try {
			io = new IntersectionObserver(handleObserve, {
				...options,
				root: root.ownerDocument
			});
		} catch (_e) {
			io = new IntersectionObserver(handleObserve, options);
		}
		io.observe(element);
	}
	const win = getWindow(element);
	const handleResize = () => refresh(ancestorResize);
	win.addEventListener("resize", handleResize);
	refresh(true);
	return () => {
		win.removeEventListener("resize", handleResize);
		cleanup();
	};
}
/**
* Automatically updates the position of the floating element when necessary.
* Should only be called when the floating element is mounted on the DOM or
* visible on the screen.
* @returns cleanup function that should be invoked when the floating element is
* removed from the DOM or hidden from the screen.
* @see https://floating-ui.com/docs/autoUpdate
*/
function autoUpdate(reference, floating, update, options) {
	if (options === void 0) options = {};
	const { ancestorScroll = true, ancestorResize = true, elementResize = typeof ResizeObserver === "function", layoutShift = typeof IntersectionObserver === "function", animationFrame = false } = options;
	const referenceEl = unwrapElement(reference);
	const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...floating ? getOverflowAncestors(floating) : []] : [];
	ancestors.forEach((ancestor) => {
		ancestorScroll && ancestor.addEventListener("scroll", update);
		ancestorResize && ancestor.addEventListener("resize", update);
	});
	const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update, ancestorResize) : null;
	let reobserveFrame = -1;
	let resizeObserver = null;
	if (elementResize) {
		resizeObserver = new ResizeObserver((_ref) => {
			let [firstEntry] = _ref;
			if (firstEntry && firstEntry.target === referenceEl && resizeObserver && floating) {
				resizeObserver.unobserve(floating);
				cancelAnimationFrame(reobserveFrame);
				reobserveFrame = requestAnimationFrame(() => {
					var _resizeObserver;
					(_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
				});
			}
			update();
		});
		if (referenceEl && !animationFrame) resizeObserver.observe(referenceEl);
		if (floating) resizeObserver.observe(floating);
	}
	let frameId;
	let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
	if (animationFrame) frameLoop();
	function frameLoop() {
		const nextRefRect = getBoundingClientRect(reference);
		if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) update();
		prevRefRect = nextRefRect;
		frameId = requestAnimationFrame(frameLoop);
	}
	update();
	return () => {
		var _resizeObserver2;
		ancestors.forEach((ancestor) => {
			ancestorScroll && ancestor.removeEventListener("scroll", update);
			ancestorResize && ancestor.removeEventListener("resize", update);
		});
		cleanupIo?.();
		(_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
		resizeObserver = null;
		if (animationFrame) cancelAnimationFrame(frameId);
	};
}
/**
* Modifies the placement by translating the floating element along the
* specified axes.
* A number (shorthand for `mainAxis` or distance), or an axes configuration
* object may be passed.
* @see https://floating-ui.com/docs/offset
*/
var offset$1 = offset$2;
/**
* Optimizes the visibility of the floating element by shifting it in order to
* keep it in view when it will overflow the clipping boundary.
* @see https://floating-ui.com/docs/shift
*/
var shift$1 = shift$2;
/**
* Optimizes the visibility of the floating element by flipping the `placement`
* in order to keep it in view when the preferred placement(s) will overflow the
* clipping boundary. Alternative to `autoPlacement`.
* @see https://floating-ui.com/docs/flip
*/
var flip$1 = flip$2;
/**
* Provides data that allows you to change the size of the floating element —
* for instance, prevent it from overflowing the clipping boundary or match the
* width of the reference element.
* @see https://floating-ui.com/docs/size
*/
var size$1 = size$2;
/**
* Built-in `limiter` that will stop `shift()` at a certain point.
*/
var limitShift$1 = limitShift$2;
/**
* Computes the `x` and `y` coordinates that will place the floating element
* next to a given reference element.
*/
var computePosition = (reference, floating, options) => {
	const cache = /* @__PURE__ */ new Map();
	const mergedOptions = options != null ? options : {};
	const platformWithCache = {
		...platform,
		...mergedOptions.platform,
		_c: cache
	};
	return computePosition$1(reference, floating, {
		...mergedOptions,
		platform: platformWithCache
	});
};
//#endregion
//#region node_modules/.pnpm/@floating-ui+react-dom@2.1.9_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@floating-ui/react-dom/dist/floating-ui.react-dom.mjs
var index$1 = typeof document !== "undefined" ? import_react.useLayoutEffect : function noop() {};
function deepEqual(a, b) {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (typeof a === "function" && a.toString() === b.toString()) return true;
	let length;
	let i;
	let keys;
	if (a && b && typeof a === "object") {
		if (Array.isArray(a)) {
			length = a.length;
			if (length !== b.length) return false;
			for (i = length; i-- !== 0;) if (!deepEqual(a[i], b[i])) return false;
			return true;
		}
		keys = Object.keys(a);
		length = keys.length;
		if (length !== Object.keys(b).length) return false;
		for (i = length; i-- !== 0;) if (!{}.hasOwnProperty.call(b, keys[i])) return false;
		for (i = length; i-- !== 0;) {
			const key = keys[i];
			if (key === "_owner" && a.$$typeof) continue;
			if (!deepEqual(a[key], b[key])) return false;
		}
		return true;
	}
	return a !== a && b !== b;
}
function getDPR(element) {
	if (typeof window === "undefined") return 1;
	return (element.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function roundByDPR(element, value) {
	const dpr = getDPR(element);
	return Math.round(value * dpr) / dpr;
}
function useLatestRef(value) {
	const ref = import_react.useRef(value);
	index$1(() => {
		ref.current = value;
	});
	return ref;
}
/**
* Provides data to position a floating element.
* @see https://floating-ui.com/docs/useFloating
*/
function useFloating(options) {
	if (options === void 0) options = {};
	const { placement = "bottom", strategy = "absolute", middleware = [], platform, elements: { reference: externalReference, floating: externalFloating } = {}, transform = true, whileElementsMounted, open } = options;
	const [data, setData] = import_react.useState({
		x: 0,
		y: 0,
		strategy,
		placement,
		middlewareData: {},
		isPositioned: false
	});
	const [latestMiddleware, setLatestMiddleware] = import_react.useState(middleware);
	if (!deepEqual(latestMiddleware, middleware)) setLatestMiddleware(middleware);
	const [_reference, _setReference] = import_react.useState(null);
	const [_floating, _setFloating] = import_react.useState(null);
	const setReference = import_react.useCallback((node) => {
		if (node !== referenceRef.current) {
			referenceRef.current = node;
			_setReference(node);
		}
	}, []);
	const setFloating = import_react.useCallback((node) => {
		if (node !== floatingRef.current) {
			floatingRef.current = node;
			_setFloating(node);
		}
	}, []);
	const referenceEl = externalReference || _reference;
	const floatingEl = externalFloating || _floating;
	const referenceRef = import_react.useRef(null);
	const floatingRef = import_react.useRef(null);
	const dataRef = import_react.useRef(data);
	const hasWhileElementsMounted = whileElementsMounted != null;
	const whileElementsMountedRef = useLatestRef(whileElementsMounted);
	const platformRef = useLatestRef(platform);
	const openRef = useLatestRef(open);
	const update = import_react.useCallback(() => {
		if (!referenceRef.current || !floatingRef.current) return;
		const config = {
			placement,
			strategy,
			middleware: latestMiddleware
		};
		if (platformRef.current) config.platform = platformRef.current;
		computePosition(referenceRef.current, floatingRef.current, config).then((data) => {
			const fullData = {
				...data,
				isPositioned: openRef.current !== false
			};
			if (isMountedRef.current && !deepEqual(dataRef.current, fullData)) {
				dataRef.current = fullData;
				import_react_dom.flushSync(() => {
					setData(fullData);
				});
			}
		});
	}, [
		latestMiddleware,
		placement,
		strategy,
		platformRef,
		openRef
	]);
	index$1(() => {
		if (open === false && dataRef.current.isPositioned) {
			dataRef.current.isPositioned = false;
			setData((data) => ({
				...data,
				isPositioned: false
			}));
		}
	}, [open]);
	const isMountedRef = import_react.useRef(false);
	index$1(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);
	index$1(() => {
		if (referenceEl) referenceRef.current = referenceEl;
		if (floatingEl) floatingRef.current = floatingEl;
		if (referenceEl && floatingEl) {
			if (whileElementsMountedRef.current) return whileElementsMountedRef.current(referenceEl, floatingEl, update);
			update();
		}
	}, [
		referenceEl,
		floatingEl,
		update,
		whileElementsMountedRef,
		hasWhileElementsMounted
	]);
	const refs = import_react.useMemo(() => ({
		reference: referenceRef,
		floating: floatingRef,
		setReference,
		setFloating
	}), [setReference, setFloating]);
	const elements = import_react.useMemo(() => ({
		reference: referenceEl,
		floating: floatingEl
	}), [referenceEl, floatingEl]);
	const floatingStyles = import_react.useMemo(() => {
		const initialStyles = {
			position: strategy,
			left: 0,
			top: 0
		};
		if (!elements.floating) return initialStyles;
		const x = roundByDPR(elements.floating, data.x);
		const y = roundByDPR(elements.floating, data.y);
		if (transform) return {
			...initialStyles,
			transform: "translate(" + x + "px, " + y + "px)",
			...getDPR(elements.floating) >= 1.5 && { willChange: "transform" }
		};
		return {
			position: strategy,
			left: x,
			top: y
		};
	}, [
		strategy,
		transform,
		elements.floating,
		data.x,
		data.y
	]);
	return import_react.useMemo(() => ({
		...data,
		update,
		refs,
		elements,
		floatingStyles
	}), [
		data,
		update,
		refs,
		elements,
		floatingStyles
	]);
}
/**
* Modifies the placement by translating the floating element along the
* specified axes.
* A number (shorthand for `mainAxis` or distance), or an axes configuration
* object may be passed.
* @see https://floating-ui.com/docs/offset
*/
var offset = (options, deps) => {
	const result = offset$1(options);
	return {
		name: result.name,
		fn: result.fn,
		options: [options, deps]
	};
};
/**
* Optimizes the visibility of the floating element by shifting it in order to
* keep it in view when it will overflow the clipping boundary.
* @see https://floating-ui.com/docs/shift
*/
var shift = (options, deps) => {
	const result = shift$1(options);
	return {
		name: result.name,
		fn: result.fn,
		options: [options, deps]
	};
};
/**
* Built-in `limiter` that will stop `shift()` at a certain point.
*/
var limitShift = (options, deps) => {
	return {
		fn: limitShift$1(options).fn,
		options: [options, deps]
	};
};
/**
* Optimizes the visibility of the floating element by flipping the `placement`
* in order to keep it in view when the preferred placement(s) will overflow the
* clipping boundary. Alternative to `autoPlacement`.
* @see https://floating-ui.com/docs/flip
*/
var flip = (options, deps) => {
	const result = flip$1(options);
	return {
		name: result.name,
		fn: result.fn,
		options: [options, deps]
	};
};
/**
* Provides data that allows you to change the size of the floating element —
* for instance, prevent it from overflowing the clipping boundary or match the
* width of the reference element.
* @see https://floating-ui.com/docs/size
*/
var size = (options, deps) => {
	const result = size$1(options);
	return {
		name: result.name,
		fn: result.fn,
		options: [options, deps]
	};
};
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/store/useStore.mjs
var useStoreImplementation = isReactVersionAtLeast(19) ? useStoreFast : useStoreLegacy;
function useStore(store, selector, a1, a2, a3) {
	return useStoreImplementation(store, selector, a1, a2, a3);
}
function useStoreR19(store, selector, a1, a2, a3) {
	const getSelection = import_react.useCallback(() => selector(store.getSnapshot(), a1, a2, a3), [
		store,
		selector,
		a1,
		a2,
		a3
	]);
	return (0, import_shim.useSyncExternalStore)(store.subscribe, getSelection, getSelection);
}
register({
	before(instance) {
		instance.syncIndex = 0;
		if (!instance.didInitialize) {
			instance.syncTick = 1;
			instance.syncHooks = [];
			instance.didChangeStore = true;
			instance.getSnapshot = () => {
				let didChange = false;
				for (let i = 0; i < instance.syncHooks.length; i += 1) {
					const hook = instance.syncHooks[i];
					const value = hook.selector(hook.store.state, hook.a1, hook.a2, hook.a3);
					if (!Object.is(hook.value, value)) {
						didChange = true;
						hook.value = value;
					}
				}
				if (didChange) instance.syncTick += 1;
				return instance.syncTick;
			};
		}
	},
	after(instance) {
		if (instance.syncHooks.length > 0) {
			if (instance.didChangeStore) {
				instance.didChangeStore = false;
				instance.subscribe = (onStoreChange) => {
					const stores = /* @__PURE__ */ new Set();
					for (const hook of instance.syncHooks) stores.add(hook.store);
					const unsubscribes = [];
					for (const store of stores) unsubscribes.push(store.subscribe(onStoreChange));
					return () => {
						for (const unsubscribe of unsubscribes) unsubscribe();
					};
				};
			}
			(0, import_shim.useSyncExternalStore)(instance.subscribe, instance.getSnapshot, instance.getSnapshot);
		}
	}
});
function useStoreFast(store, selector, a1, a2, a3) {
	const instance = getInstance();
	if (!instance) return useStoreR19(store, selector, a1, a2, a3);
	const index = instance.syncIndex;
	instance.syncIndex += 1;
	let hook;
	if (!instance.didInitialize) {
		hook = {
			store,
			selector,
			a1,
			a2,
			a3,
			value: selector(store.getSnapshot(), a1, a2, a3)
		};
		instance.syncHooks.push(hook);
	} else {
		hook = instance.syncHooks[index];
		if (hook.store !== store || hook.selector !== selector || !Object.is(hook.a1, a1) || !Object.is(hook.a2, a2) || !Object.is(hook.a3, a3)) {
			if (hook.store !== store) instance.didChangeStore = true;
			hook.store = store;
			hook.selector = selector;
			hook.a1 = a1;
			hook.a2 = a2;
			hook.a3 = a3;
			hook.value = selector(store.getSnapshot(), a1, a2, a3);
		}
	}
	return hook.value;
}
function useStoreLegacy(store, selector, a1, a2, a3) {
	return (0, import_with_selector.useSyncExternalStoreWithSelector)(store.subscribe, store.getSnapshot, store.getSnapshot, (state) => selector(state, a1, a2, a3));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/store/Store.mjs
/**
* A data store implementation that allows subscribing to state changes and updating the state.
* It uses an observer pattern to notify subscribers when the state changes.
*/
var Store = class {
	/**
	* Creates a store with the given initial state, constructing the class it is called on.
	* Calling it on a generic base class (e.g. `ReactStore.create(...)`) constructs that
	* class but degrades the inferred instance type to `Store`; use `new` there instead.
	*/
	static create(state) {
		return new this(state);
	}
	/**
	* The current state of the store.
	* This property is updated immediately when the state changes as a result of calling {@link setState}, {@link update}, or {@link set}.
	* To subscribe to state changes, use the {@link useState} method. The value returned by {@link useState} is updated after the component renders (similarly to React's useState).
	* The values can be used directly (to avoid subscribing to the store) in effects or event handlers.
	*
	* Do not modify properties in state directly. Instead, use the provided methods to ensure proper state management and listener notification.
	*/
	constructor(state) {
		this.state = state;
		this.listeners = /* @__PURE__ */ new Set();
		this.updateTick = 0;
	}
	/**
	* Registers a listener that will be called whenever the store's state changes.
	*
	* @param fn The listener function to be called on state changes.
	* @returns A function to unsubscribe the listener.
	*/
	subscribe = (fn) => {
		this.listeners.add(fn);
		return () => {
			this.listeners.delete(fn);
		};
	};
	/**
	* Returns the current state of the store.
	*/
	getSnapshot = () => {
		return this.state;
	};
	/**
	* Updates the entire store's state and notifies all registered listeners.
	*
	* @param newState The new state to set for the store.
	*/
	setState(newState) {
		if (this.state === newState) return;
		this.state = newState;
		this.updateTick += 1;
		const currentTick = this.updateTick;
		for (const listener of this.listeners) {
			if (currentTick !== this.updateTick) return;
			listener(newState);
		}
	}
	/**
	* Merges the provided changes into the current state and notifies listeners if there are changes.
	* Each value must match its state key. Pass an exact known subset rather than a broad
	* `Partial<State>`, which may contain `undefined` for required state fields.
	*
	* @param changes An object containing the changes to apply to the current state.
	*/
	update(changes) {
		for (const key in changes) if (!Object.is(this.state[key], changes[key])) {
			this.setState({
				...this.state,
				...changes
			});
			return;
		}
	}
	/**
	* Sets a specific key in the store's state to a new value and notifies listeners if the value has changed.
	*
	* @param key The key in the store's state to update.
	* @param value The new value to set for the specified key.
	*/
	set(key, value) {
		if (!Object.is(this.state[key], value)) this.setState({
			...this.state,
			[key]: value
		});
	}
	/**
	* Gives the state a new reference and updates all registered listeners.
	*/
	notifyAll() {
		const newState = { ...this.state };
		this.setState(newState);
	}
	use(selector, a1, a2, a3) {
		return useStore(this, selector, a1, a2, a3);
	}
};
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/store/ReactStore.mjs
/**
* A Store that supports controlled state keys, non-reactive values and provides utility methods for React.
*/
var ReactStore = class extends Store {
	/**
	* Creates a new ReactStore instance.
	*
	* @param state Initial state of the store.
	* @param context Non-reactive context values.
	* @param selectors Optional selectors for use with `useState`.
	*/
	constructor(state, context = {}, selectors) {
		super(state);
		this.context = context;
		this.selectors = selectors;
	}
	/**
	* Non-reactive values such as refs, callbacks, etc.
	*/
	/**
	* Synchronizes a single external value into the store.
	*
	* Note that the while the value in `state` is updated immediately, the value returned
	* by `useState` is updated before the next render (similarly to React's `useState`).
	*/
	useSyncedValue(key, value) {
		import_react.useDebugValue(key);
		const store = this;
		useIsoLayoutEffect(() => {
			if (store.state[key] !== value) store.set(key, value);
		}, [
			store,
			key,
			value
		]);
	}
	/**
	* Synchronizes a single external value into the store and
	* cleans it up (sets to `undefined`) on unmount.
	*
	* Note that the while the value in `state` is updated immediately, the value returned
	* by `useState` is updated before the next render (similarly to React's `useState`).
	*/
	useSyncedValueWithCleanup(key, value) {
		const store = this;
		useIsoLayoutEffect(() => {
			if (store.state[key] !== value) store.set(key, value);
			return () => {
				store.set(key, void 0);
			};
		}, [
			store,
			key,
			value
		]);
	}
	/**
	* Synchronizes multiple external values into the store.
	* Each value must match its state key. Pass an exact known subset rather than a broad
	* `Partial<State>`, which may contain `undefined` for required state fields.
	*
	* Note that the while the values in `state` are updated immediately, the values returned
	* by `useState` are updated before the next render (similarly to React's `useState`).
	*
	* @param statePart An exact subset of state fields to synchronize. Unknown keys are not accepted.
	*/
	useSyncedValues(statePart) {
		const store = this;
		useIsoLayoutEffect(() => {
			store.update(statePart);
		}, [store, ...Object.values(statePart)]);
	}
	/**
	* Registers a controllable prop pair (`controlled`, `defaultValue`) for a specific key. If `controlled`
	* is non-undefined, the store's state at `key` is updated to match `controlled`.
	*/
	useControlledProp(key, controlled) {
		import_react.useDebugValue(key);
		const store = this;
		const isControlled = controlled !== void 0;
		useIsoLayoutEffect(() => {
			if (isControlled && !Object.is(store.state[key], controlled)) store.setState({
				...store.state,
				[key]: controlled
			});
		}, [
			store,
			key,
			controlled,
			isControlled
		]);
	}
	/** Gets the current value from the store using a selector with the provided key.
	*
	* @param key Key of the selector to use.
	*/
	select(key, a1, a2, a3) {
		const selector = this.selectors[key];
		return selector(this.state, a1, a2, a3);
	}
	/**
	* Returns a value from the store's state using a selector function.
	* Used to subscribe to specific parts of the state.
	* This methods causes a rerender whenever the selected state changes.
	*
	* @param key Key of the selector to use.
	*/
	useState(key, a1, a2, a3) {
		import_react.useDebugValue(key);
		return useStore(this, this.selectors[key], a1, a2, a3);
	}
	/**
	* Wraps a function with `useStableCallback` to ensure it has a stable reference
	* and assigns it to the context.
	*
	* @param key Key of the event callback. Must be a function in the context.
	* @param fn Function to assign.
	*/
	useContextCallback(key, fn) {
		import_react.useDebugValue(key);
		const stableFunction = useStableCallback(fn ?? NOOP);
		this.context[key] = stableFunction;
	}
	/**
	* Returns a stable setter function for a specific key in the store's state.
	* It's commonly used to pass as a ref callback to React elements.
	*
	* @param key Key of the state to set.
	*/
	useStateSetter(key) {
		const ref = import_react.useRef(void 0);
		if (ref.current === void 0) ref.current = (value) => {
			this.set(key, value);
		};
		return ref.current;
	}
	/**
	* Observes changes derived from the store's selectors and calls the listener when the selected value changes.
	*
	* @param key Key of the selector to observe.
	* @param listener Listener function called when the selector result changes.
	*/
	observe(selector, listener) {
		let selectFn;
		if (typeof selector === "function") selectFn = selector;
		else selectFn = this.selectors[selector];
		let prevValue = selectFn(this.state);
		listener(prevValue, prevValue, this);
		return this.subscribe((nextState) => {
			const nextValue = selectFn(nextState);
			if (!Object.is(prevValue, nextValue)) {
				const oldValue = prevValue;
				prevValue = nextValue;
				listener(nextValue, oldValue, this);
			}
		});
	}
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/components/FloatingRootStore.mjs
var selectors$6 = {
	open: (state) => state.open,
	transitionStatus: (state) => state.transitionStatus,
	domReferenceElement: (state) => state.domReferenceElement,
	referenceElement: (state) => state.positionReference ?? state.referenceElement,
	floatingElement: (state) => state.floatingElement,
	floatingId: (state) => state.floatingId
};
var FloatingRootStore = class extends ReactStore {
	constructor(options) {
		const { syncOnly, nested, onOpenChange, triggerElements, ...initialState } = options;
		super({
			...initialState,
			positionReference: initialState.referenceElement,
			domReferenceElement: initialState.referenceElement
		}, {
			onOpenChange,
			dataRef: { current: {} },
			events: createEventEmitter(),
			nested,
			triggerElements
		}, selectors$6);
		this.syncOnly = syncOnly;
	}
	/**
	* Syncs the event used by hover logic to distinguish hover-open from click-like interaction.
	*/
	syncOpenEvent = (newOpen, event) => {
		if (!newOpen || !this.state.open || event != null && isClickLikeEvent(event)) this.context.dataRef.current.openEvent = newOpen ? event : void 0;
	};
	/**
	* Runs the root-owned side effects for an open state change.
	*/
	dispatchOpenChange = (newOpen, eventDetails) => {
		this.syncOpenEvent(newOpen, eventDetails.event);
		const details = {
			open: newOpen,
			reason: eventDetails.reason,
			nativeEvent: eventDetails.event,
			nested: this.context.nested,
			triggerElement: eventDetails.trigger
		};
		this.context.events.emit("openchange", details);
	};
	/**
	* Emits the `openchange` event through the internal event emitter and calls the `onOpenChange` handler with the provided arguments.
	*
	* @param newOpen The new open state.
	* @param eventDetails Details about the event that triggered the open state change.
	*/
	setOpen = (newOpen, eventDetails) => {
		if (this.syncOnly) {
			this.context.onOpenChange?.(newOpen, eventDetails);
			return;
		}
		this.dispatchOpenChange(newOpen, eventDetails);
		this.context.onOpenChange?.(newOpen, eventDetails);
	};
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useSyncedFloatingRootContext.mjs
/**
* Narrowed to the store members this hook uses so consumers do not need to provide
* unrelated store capabilities.
*/
/**
* Keeps a FloatingRootStore in sync with the provided PopupStore.
* Uses the provided FloatingRootStore when one exists, otherwise creates one once and updates it on every render.
*/
function useSyncedFloatingRootContext(options) {
	const { popupStore, treatPopupAsFloatingElement = false, floatingRootContext: floatingRootContextProp, floatingId, nested, onOpenChange } = options;
	const open = popupStore.useState("open");
	const referenceElement = popupStore.useState("activeTriggerElement");
	const floatingElement = popupStore.useState(treatPopupAsFloatingElement ? "popupElement" : "positionerElement");
	const triggerElements = popupStore.context.triggerElements;
	const handleOpenChange = onOpenChange;
	const internalStoreRef = import_react.useRef(null);
	if (floatingRootContextProp === void 0 && internalStoreRef.current === null) internalStoreRef.current = new FloatingRootStore({
		open,
		transitionStatus: void 0,
		referenceElement,
		floatingElement,
		triggerElements,
		onOpenChange: handleOpenChange,
		floatingId,
		syncOnly: true,
		nested
	});
	const store = floatingRootContextProp ?? internalStoreRef.current;
	popupStore.useSyncedValue("floatingId", floatingId);
	useIsoLayoutEffect(() => {
		const valuesToSync = {
			open,
			floatingId,
			referenceElement,
			floatingElement
		};
		if (isElement(referenceElement)) valuesToSync.domReferenceElement = referenceElement;
		if (store.state.positionReference === store.state.referenceElement) valuesToSync.positionReference = referenceElement;
		store.update(valuesToSync);
	}, [
		open,
		floatingId,
		referenceElement,
		floatingElement,
		store
	]);
	store.context.onOpenChange = handleOpenChange;
	store.context.nested = nested;
	return store;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/popupStoreUtils.mjs
var FOCUSABLE_POPUP_PROPS = {
	tabIndex: -1,
	[FOCUSABLE_ATTRIBUTE]: ""
};
/**
* Returns the default `initialFocus` resolver for a popup. When opened by touch it focuses the
* popup element itself to prevent the virtual keyboard from opening (required for Android
* specifically; iOS handles this automatically). Otherwise it falls back to the default behavior.
*/
function createDefaultInitialFocus(popupRef) {
	return (interactionType) => interactionType === "touch" ? popupRef.current : true;
}
/**
* The subset of a popup handle that a Root needs to bind its store to. Both the real handle classes
* and any test double satisfy it.
*/
/**
* Creates and owns a popup store on behalf of a Root part. The store is created exactly once, with
* controlled props and root state synced separately after creation. Sets up the synced floating
* root context and returns the store.
*
* @param createStore Factory that builds the store. Called exactly once, receiving the floating id
* and whether the popup is nested inside another floating element, both resolved on the first render.
* @param treatPopupAsFloatingElement Whether the popup element is passed to Floating UI as the
* floating element instead of the default positioner.
*/
function usePopupRootStore(createStore, treatPopupAsFloatingElement = false) {
	const floatingId = useId();
	const nested = useFloatingParentNodeId() != null;
	const store = useRefWithInit(() => createStore(floatingId, nested)).current;
	useSyncedFloatingRootContext({
		popupStore: store,
		treatPopupAsFloatingElement,
		floatingRootContext: store.state.floatingRootContext,
		floatingId,
		nested,
		onOpenChange: store.setOpen
	});
	return store;
}
/**
* Attaches a Root's store to a handle for this component's committed lifetime. Popup Roots render
* it before their interactions and user children so its layout effect runs before descendant layout
* effects. This lets descendants call the handle during the Root's initial commit without attaching
* during render, which would leak suspended or abandoned stores. Store subscribers are notified by
* `attachStore` in this ordinary layout phase, where React permits synchronous updates.
*
* Popup Roots must render this component only when a handle is present so handle-less Roots avoid
* mounting an extra fiber and layout effect.
*/
function PopupHandleAttachment({ handle, store }) {
	useIsoLayoutEffect(() => {
		return handle.attachStore(store);
	}, [handle, store]);
	return null;
}
function syncTriggerCount(store) {
	const triggerCount = store.context.triggerElements.size;
	if (store.select("open") && store.state.triggerCount !== triggerCount) store.set("triggerCount", triggerCount);
}
/**
* Returns a stable callback ref that registers/unregisters the trigger element in the store.
*
* Stable so a downstream ref merger that retains the callback it was first given still reaches the
* trigger's current store. The registration is tracked as a `(store, id, element)` triple, so
* unregistering targets the store the element was actually registered in.
*
* Since the callback never changes, the caller must re-run it from a layout effect keyed on
* `[store, id]` to migrate an already-registered element. That effect is also what registers the
* element in the first place when `id` only resolves after the first commit (React 17's `useId`
* fallback), because the register call made while the id is still `undefined` does nothing.
*
* @param id Id of the trigger.
* @param store The Store instance where the trigger should be registered.
*/
function useTriggerRegistration(id, store) {
	const registrationRef = import_react.useRef(null);
	return useStableCallback((element) => {
		const registration = registrationRef.current;
		if (registration !== null) {
			if (registration.element === element && registration.store === store && registration.id === id) return;
			registrationRef.current = null;
			const registeredStore = registration.store;
			if (registeredStore.context.triggerElements.getById(registration.id) === registration.element) {
				registeredStore.context.triggerElements.delete(registration.id);
				syncTriggerCount(registeredStore);
			}
		}
		if (element !== null && id !== void 0) {
			registrationRef.current = {
				store,
				id,
				element
			};
			store.context.triggerElements.add(id, element);
			syncTriggerCount(store);
		}
	});
}
function createPopupOpenState(state, open, trigger, preventUnmountOnClose = false) {
	let preventUnmountingOnClose = state.preventUnmountingOnClose;
	if (open) preventUnmountingOnClose = false;
	else if (preventUnmountOnClose) preventUnmountingOnClose = true;
	const triggerId = trigger?.id ?? null;
	let activeTriggerId = state.activeTriggerId;
	let activeTriggerElement = state.activeTriggerElement;
	if (triggerId || open) {
		activeTriggerId = triggerId;
		activeTriggerElement = trigger ?? null;
	}
	return {
		open,
		preventUnmountingOnClose,
		activeTriggerId,
		activeTriggerElement
	};
}
function attachPreventUnmountOnClose(eventDetails) {
	let preventUnmountOnClose = false;
	eventDetails.preventUnmountOnClose = () => {
		preventUnmountOnClose = true;
	};
	return () => preventUnmountOnClose;
}
/**
* Runs the shared open-change sequence for a popup store: notifies `onOpenChange`,
* honors cancellation, dispatches the floating root change, maps the reason to an
* `instantType`, and commits the state update (synchronously for hover so
* `getAnimations()` observes it). Stores supply their own differences via
* `extraState` (e.g. the last change reason) and `onBeforeDispatch` (e.g. updating
* inline-rect coordinates).
*/
function applyPopupOpenChange(store, nextOpen, eventDetails, options = {}) {
	const reason = eventDetails.reason;
	const isHover = reason === triggerHover;
	const isFocusOpen = nextOpen && reason === "trigger-focus";
	const isDismissClose = !nextOpen && (reason === "trigger-press" || reason === "escape-key");
	const shouldPreventUnmountOnClose = attachPreventUnmountOnClose(eventDetails);
	store.context.onOpenChange?.(nextOpen, eventDetails);
	if (eventDetails.isCanceled) return;
	options.onBeforeDispatch?.();
	store.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);
	const changeState = () => {
		const popupOpenState = createPopupOpenState(store.state, nextOpen, eventDetails.trigger, shouldPreventUnmountOnClose());
		const updatedState = {
			...options.extraState,
			...popupOpenState
		};
		if (isFocusOpen) updatedState.instantType = "focus";
		else if (isDismissClose) updatedState.instantType = "dismiss";
		else if (isHover) updatedState.instantType = void 0;
		store.update(updatedState);
	};
	if (isHover) import_react_dom.flushSync(changeState);
	else changeState();
}
/**
* Sets up trigger data forwarding to the store.
*
* @param triggerId Id of the trigger.
* @param triggerElementRef Ref for the trigger DOM element.
* @param store The Store instance managing the popup state.
* @param stateUpdates An object with state updates to apply when the trigger is active.
*/
function useTriggerDataForwarding(triggerId, triggerElementRef, store, stateUpdates) {
	const isMountedByThisTrigger = store.useState("isMountedByTrigger", triggerId);
	const baseRegisterTrigger = useTriggerRegistration(triggerId, store);
	const applyTriggerData = useStableCallback((element) => {
		const open = store.select("open");
		const activeTriggerId = store.select("activeTriggerId");
		if (activeTriggerId === triggerId) {
			const changes = {
				activeTriggerElement: element,
				...open ? stateUpdates : null
			};
			store.update(changes);
			return;
		}
		if (activeTriggerId == null && open) {
			const changes = {
				activeTriggerId: triggerId ?? null,
				activeTriggerElement: element,
				...stateUpdates
			};
			store.update(changes);
		}
	});
	const registerTrigger = useStableCallback((element) => {
		baseRegisterTrigger(element);
		if (element) applyTriggerData(element);
	});
	useIsoLayoutEffect(() => {
		registerTrigger(triggerElementRef.current);
		return () => registerTrigger(null);
	}, [
		registerTrigger,
		triggerElementRef,
		store,
		triggerId
	]);
	useIsoLayoutEffect(() => {
		if (isMountedByThisTrigger) {
			const changes = {
				activeTriggerElement: triggerElementRef.current,
				...stateUpdates
			};
			store.update(changes);
		}
	}, [
		isMountedByThisTrigger,
		store,
		triggerElementRef,
		...Object.values(stateUpdates)
	]);
	return {
		registerTrigger,
		isMountedByThisTrigger
	};
}
/**
* Keeps trigger registration state synchronized while the popup is open.
*
* When a popup opens without an explicit trigger id and exactly one trigger is registered, that
* trigger is claimed as the active trigger. When the active trigger id is still registered but its
* element changed, the active element is refreshed. When the active trigger id is missing from the
* registry but the same element is still registered under a different id (e.g. the rendered trigger
* carries its own DOM `id` that differs from Base UI's internal trigger id), the active id is
* reassociated to the registered id instead of being treated as lost. When the active trigger
* unregisters, the default path preserves existing ownership so non-closing popup families do not
* silently claim a different trigger while staying open.
*
* If `closeOnActiveTriggerUnmount` is enabled, unregistering a previously resolved active trigger
* requests a close after a microtask so a same-tick replacement trigger with the same id can
* register first. An active trigger id that has not matched a registered trigger yet is treated as
* pending and does not request a close.
*
* This should be called on the Root part.
*
* @param store The Store instance managing the popup state.
* @param options Options for active trigger unmount behavior.
*/
function useImplicitActiveTrigger(store, options = {}) {
	const { closeOnActiveTriggerUnmount = false } = options;
	const resolvedActiveTriggerIdRef = import_react.useRef(null);
	const open = store.useState("open");
	useIsoLayoutEffect(() => {
		if (!open) {
			resolvedActiveTriggerIdRef.current = null;
			if (store.state.triggerCount !== 0) store.set("triggerCount", 0);
			return;
		}
		const triggerCount = store.context.triggerElements.size;
		const stateUpdates = {};
		if (store.state.triggerCount !== triggerCount) stateUpdates.triggerCount = triggerCount;
		const currentActiveTriggerId = store.select("activeTriggerId");
		let lostActiveTriggerId = null;
		if (currentActiveTriggerId) {
			const activeTriggerElement = store.context.triggerElements.getById(currentActiveTriggerId);
			if (!activeTriggerElement) {
				for (const [triggerId, triggerElement] of store.context.triggerElements.entries()) if (triggerElement === store.state.activeTriggerElement) {
					stateUpdates.activeTriggerId = triggerId;
					stateUpdates.activeTriggerElement = triggerElement;
					resolvedActiveTriggerIdRef.current = triggerId;
					break;
				}
				if (stateUpdates.activeTriggerId === void 0) {
					if (resolvedActiveTriggerIdRef.current === currentActiveTriggerId) lostActiveTriggerId = currentActiveTriggerId;
					else resolvedActiveTriggerIdRef.current = null;
				}
			} else {
				resolvedActiveTriggerIdRef.current = currentActiveTriggerId;
				if (activeTriggerElement !== store.state.activeTriggerElement) stateUpdates.activeTriggerElement = activeTriggerElement;
			}
		} else resolvedActiveTriggerIdRef.current = null;
		if (!lostActiveTriggerId && !currentActiveTriggerId && triggerCount === 1) {
			const iteratorResult = store.context.triggerElements.entries().next();
			if (!iteratorResult.done) {
				const [implicitTriggerId, implicitTriggerElement] = iteratorResult.value;
				stateUpdates.activeTriggerId = implicitTriggerId;
				stateUpdates.activeTriggerElement = implicitTriggerElement;
				resolvedActiveTriggerIdRef.current = implicitTriggerId;
			}
		}
		if (stateUpdates.triggerCount !== void 0 || stateUpdates.activeTriggerId !== void 0 || stateUpdates.activeTriggerElement !== void 0) store.update(stateUpdates);
		if (lostActiveTriggerId) {
			if (closeOnActiveTriggerUnmount) queueMicrotask(() => {
				if (store.select("open") && store.select("activeTriggerId") === lostActiveTriggerId && !store.context.triggerElements.getById(lostActiveTriggerId)) {
					const eventDetails = createChangeEventDetails(none);
					store.setOpen(false, eventDetails);
					if (!eventDetails.isCanceled) store.update({
						activeTriggerId: null,
						activeTriggerElement: null
					});
				}
			});
		}
	}, [
		open,
		store,
		store.useState("triggerCount"),
		store.useState("activeTriggerId"),
		store.useState("activeTriggerElement"),
		closeOnActiveTriggerUnmount
	]);
}
/**
* Manages the mounted state of the popup.
* Sets up the transition status listeners and handles unmounting when needed.
* Updates the `mounted`, `transitionStatus`, and `preventUnmountingOnClose` states in the store.
*
* @param open Whether the popup is open.
* @param store The Store instance managing the popup state.
* @param onUnmount Optional callback to be called when the popup is unmounted.
* @param animateInitialOpen Whether a popup that mounts already open should still play its enter
*   transition. Defaults to `false`, so content that was open on the first render (a `defaultOpen`
*   popup on page load, SSR'd markup) appears without animating. Opt in for popups whose subtree
*   only mounts in response to something the user did, such as a submenu inside a menu popup.
*
* @returns A function to forcibly unmount the popup.
*/
function useOpenStateTransitions(open, store, onUnmount, animateInitialOpen) {
	const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, false, false, animateInitialOpen);
	const preventUnmountingOnClose = store.useState("preventUnmountingOnClose");
	const syncedPreventUnmountingOnClose = open ? false : preventUnmountingOnClose;
	store.useSyncedValues({
		mounted,
		transitionStatus,
		preventUnmountingOnClose: syncedPreventUnmountingOnClose
	});
	const forceUnmount = useStableCallback(() => {
		setMounted(false);
		store.update({
			activeTriggerId: null,
			activeTriggerElement: null,
			mounted: false,
			preventUnmountingOnClose: false
		});
		onUnmount?.();
		store.context.onOpenChangeComplete?.(false);
	});
	useOpenChangeComplete({
		enabled: mounted && !open && !syncedPreventUnmountingOnClose,
		open,
		ref: store.context.popupRef,
		onComplete() {
			if (!open) forceUnmount();
		}
	});
	return {
		forceUnmount,
		transitionStatus
	};
}
function usePopupInteractionProps(store, statePart) {
	store.useSyncedValues(statePart);
	useIsoLayoutEffect(() => () => {
		store.update({
			activeTriggerProps: EMPTY_OBJECT,
			inactiveTriggerProps: EMPTY_OBJECT,
			popupProps: EMPTY_OBJECT
		});
	}, [store]);
}
function usePopupRootSync(store, open) {
	useIsoLayoutEffect(() => {
		if (!open && store.state.openMethod !== null) store.set("openMethod", null);
	}, [open, store]);
	useIsoLayoutEffect(() => () => {
		if (store.state.openMethod !== null) store.set("openMethod", null);
	}, [store]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/popupTriggerMap.mjs
/**
* Data structure to keep track of popup trigger elements by their IDs.
*
* Element lookups iterate the id map rather than maintaining a parallel Set. Registration is O(1),
* while `hasElement` and `hasMatchingElement` are linear in the number of triggers.
*/
var PopupTriggerMap = class {
	constructor() {
		this.idMap = /* @__PURE__ */ new Map();
	}
	/**
	* Adds a trigger element with the given ID.
	*
	* Note: The provided element is assumed to not be registered under multiple IDs.
	*/
	add(id, element) {
		this.idMap.set(id, element);
	}
	/**
	* Removes the trigger element with the given ID.
	*/
	delete(id) {
		this.idMap.delete(id);
	}
	/**
	* Whether the given element is registered as a trigger.
	*/
	hasElement(element) {
		for (const registered of this.idMap.values()) if (registered === element) return true;
		return false;
	}
	/**
	* Whether there is a registered trigger element matching the given predicate.
	*/
	hasMatchingElement(predicate) {
		for (const element of this.idMap.values()) if (predicate(element)) return true;
		return false;
	}
	/**
	* Returns the trigger element associated with the given ID, or undefined if no such element exists.
	*/
	getById(id) {
		return this.idMap.get(id);
	}
	/**
	* Returns an iterable of all registered trigger entries, where each entry is a tuple of [id, element].
	*/
	entries() {
		return this.idMap.entries();
	}
	/**
	* Returns an iterable of all registered trigger elements.
	*/
	elements() {
		return this.idMap.values();
	}
	/**
	* Returns the number of registered trigger elements.
	*/
	get size() {
		return this.idMap.size;
	}
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/store.mjs
/**
* State common to all popup stores.
*/
function createInitialPopupStoreState(triggerElements, floatingId, nested = false) {
	return {
		open: false,
		openProp: void 0,
		mounted: false,
		transitionStatus: void 0,
		floatingRootContext: new FloatingRootStore({
			open: false,
			transitionStatus: void 0,
			floatingElement: null,
			referenceElement: null,
			triggerElements,
			floatingId,
			syncOnly: true,
			nested,
			onOpenChange: void 0
		}),
		floatingId,
		triggerCount: 0,
		preventUnmountingOnClose: false,
		payload: void 0,
		activeTriggerId: null,
		activeTriggerElement: null,
		triggerIdProp: void 0,
		popupElement: null,
		positionerElement: null,
		activeTriggerProps: EMPTY_OBJECT,
		inactiveTriggerProps: EMPTY_OBJECT,
		popupProps: EMPTY_OBJECT
	};
}
var activeTriggerIdSelector = (state) => state.triggerIdProp ?? state.activeTriggerId;
var openSelector = (state) => state.openProp ?? state.open;
var popupIdSelector = (state) => {
	return (state.popupElement?.id ?? state.floatingId) || void 0;
};
function triggerOwnsOpenPopup(state, triggerId) {
	return triggerId !== void 0 && openSelector(state) && activeTriggerIdSelector(state) === triggerId;
}
function triggerOwnsOpenPopupOrIsOnlyTrigger(state, triggerId) {
	if (triggerOwnsOpenPopup(state, triggerId)) return true;
	return triggerId !== void 0 && openSelector(state) && activeTriggerIdSelector(state) == null && state.triggerCount === 1;
}
var popupStoreSelectors = {
	open: openSelector,
	mounted: (state) => state.mounted,
	transitionStatus: (state) => state.transitionStatus,
	floatingRootContext: (state) => state.floatingRootContext,
	triggerCount: (state) => state.triggerCount,
	preventUnmountingOnClose: (state) => state.preventUnmountingOnClose,
	payload: (state) => state.payload,
	activeTriggerId: activeTriggerIdSelector,
	activeTriggerElement: (state) => state.mounted ? state.activeTriggerElement : null,
	popupId: popupIdSelector,
	/**
	* Whether the trigger with the given ID was used to open the popup.
	*/
	isTriggerActive: (state, triggerId) => triggerId !== void 0 && activeTriggerIdSelector(state) === triggerId,
	/**
	* Whether the popup is open and was activated by a trigger with the given ID.
	*/
	isOpenedByTrigger: (state, triggerId) => triggerOwnsOpenPopup(state, triggerId),
	/**
	* Whether the popup is mounted and was activated by a trigger with the given ID.
	*/
	isMountedByTrigger: (state, triggerId) => triggerId !== void 0 && activeTriggerIdSelector(state) === triggerId && state.mounted,
	triggerProps: (state, isActive) => isActive ? state.activeTriggerProps : state.inactiveTriggerProps,
	/**
	* Popup id for the trigger that currently owns the open popup.
	*/
	triggerPopupId: (state, triggerId) => triggerOwnsOpenPopupOrIsOnlyTrigger(state, triggerId) ? popupIdSelector(state) : void 0,
	popupProps: (state) => state.popupProps,
	popupElement: (state) => state.popupElement,
	positionerElement: (state) => state.positionerElement
};
/**
* Store members a detached handle-backed trigger reads or invokes for trigger registration and data
* forwarding. `set`/`update` are included only for trigger-count and trigger-data bookkeeping; on a
* detached (inert) store they are intentionally no-ops, so a write through them is not guaranteed to
* be durable. Component handle-store views Pick these from their concrete store (preserving its
* context and selectors) and add any component-specific trigger-invoked members such as `setOpen`.
*/
/**
* The subset of a popup store that trigger registration and data forwarding rely on. Narrow enough
* that an inert store can be passed while detached.
*/
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/usePopupHandleStore.mjs
/**
* Reads the store currently exposed by a popup handle and subscribes to store-pointer changes.
* Detached triggers use this to follow a handle as a root attaches or detaches: while no root is
* attached, the handle exposes its fallback store; once a root attaches, subscribers re-render and
* read from the live root store.
*
* Returns `undefined` when no handle is provided so callers can fall back to their root context.
*
* @param handle The popup handle to read from, or `undefined` when the trigger is not handle-bound.
*/
function usePopupHandleStore(handle) {
	const subscribe = import_react.useCallback((listener) => {
		if (handle === void 0) return NOOP;
		return handle.subscribeStore(listener);
	}, [handle]);
	const getSnapshot = import_react.useCallback(() => {
		return handle === void 0 ? void 0 : handle.store;
	}, [handle]);
	return (0, import_shim.useSyncExternalStore)(subscribe, getSnapshot, () => handle?.serverStore);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useFloatingRootContext.mjs
function useFloatingRootContext(options) {
	const { open = false, onOpenChange, elements = {} } = options;
	const floatingId = useId();
	const nested = useFloatingParentNodeId() != null;
	const store = useRefWithInit(() => new FloatingRootStore({
		open,
		transitionStatus: void 0,
		onOpenChange,
		referenceElement: elements.reference ?? null,
		floatingElement: elements.floating ?? null,
		triggerElements: new PopupTriggerMap(),
		floatingId,
		syncOnly: false,
		nested
	})).current;
	useIsoLayoutEffect(() => {
		const valuesToSync = {
			open,
			floatingId
		};
		if (elements.reference !== void 0) {
			valuesToSync.referenceElement = elements.reference;
			valuesToSync.domReferenceElement = isElement(elements.reference) ? elements.reference : null;
		}
		if (elements.floating !== void 0) valuesToSync.floatingElement = elements.floating;
		store.update(valuesToSync);
	}, [
		open,
		floatingId,
		elements.reference,
		elements.floating,
		store
	]);
	store.context.onOpenChange = onOpenChange;
	store.context.nested = nested;
	return store;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useFloating.mjs
/**
* Base UI's private `useFloating` path. The caller must supply the root store, so this skips the
* internal root-context hook used by the public Floating UI-compatible API.
*/
function useBaseUIFloating(options) {
	return useFloatingWithStore(options, options.rootContext);
}
function useFloatingWithStore(options, store) {
	const { nodeId, externalTree } = options;
	const referenceElement = store.useState("referenceElement");
	const floatingElement = store.useState("floatingElement");
	const domReferenceElement = store.useState("domReferenceElement");
	const open = store.useState("open");
	const floatingId = store.useState("floatingId");
	const [positionReference, setPositionReferenceRaw] = import_react.useState(null);
	const [localDomReference, setLocalDomReference] = import_react.useState(void 0);
	const [localFloatingElement, setLocalFloatingElement] = import_react.useState(void 0);
	const domReferenceRef = import_react.useRef(null);
	const tree = useFloatingTree(externalTree);
	const storeElements = import_react.useMemo(() => ({
		reference: referenceElement,
		floating: floatingElement,
		domReference: domReferenceElement
	}), [
		referenceElement,
		floatingElement,
		domReferenceElement
	]);
	const position = useFloating({
		...options,
		elements: {
			...storeElements,
			...positionReference && { reference: positionReference }
		}
	});
	const localDomReferenceElement = isElement(localDomReference) ? localDomReference : null;
	const syncedFloatingElement = localFloatingElement === void 0 ? store.state.floatingElement : localFloatingElement;
	store.useSyncedValue("referenceElement", localDomReference ?? null);
	store.useSyncedValue("domReferenceElement", localDomReference === void 0 ? domReferenceElement : localDomReferenceElement);
	store.useSyncedValue("floatingElement", syncedFloatingElement);
	const setPositionReference = import_react.useCallback((node) => {
		const computedPositionReference = isElement(node) ? {
			getBoundingClientRect: () => node.getBoundingClientRect(),
			getClientRects: () => node.getClientRects(),
			contextElement: node
		} : node;
		setPositionReferenceRaw(computedPositionReference);
		position.refs.setReference(computedPositionReference);
	}, [position.refs]);
	const setReference = import_react.useCallback((node) => {
		if (isElement(node) || node === null) {
			domReferenceRef.current = node;
			setLocalDomReference(node);
		}
		if (isElement(position.refs.reference.current) || position.refs.reference.current === null || node !== null && !isElement(node)) position.refs.setReference(node);
	}, [position.refs, setLocalDomReference]);
	const setFloating = import_react.useCallback((node) => {
		setLocalFloatingElement(node);
		position.refs.setFloating(node);
	}, [position.refs]);
	const refs = import_react.useMemo(() => ({
		...position.refs,
		setReference,
		setFloating,
		setPositionReference,
		domReference: domReferenceRef
	}), [
		position.refs,
		setReference,
		setFloating,
		setPositionReference
	]);
	const elements = import_react.useMemo(() => ({
		...position.elements,
		domReference: domReferenceElement
	}), [position.elements, domReferenceElement]);
	const context = import_react.useMemo(() => ({
		...position,
		dataRef: store.context.dataRef,
		open,
		onOpenChange: store.setOpen,
		events: store.context.events,
		floatingId,
		refs,
		elements,
		nodeId,
		rootStore: store
	}), [
		position,
		refs,
		elements,
		nodeId,
		store,
		open,
		floatingId
	]);
	useIsoLayoutEffect(() => {
		if (domReferenceElement) domReferenceRef.current = domReferenceElement;
	}, [domReferenceElement]);
	useIsoLayoutEffect(() => {
		store.context.dataRef.current.floatingContext = context;
		const node = tree?.nodesRef.current.find((n) => n.id === nodeId);
		if (node) node.context = context;
	});
	return import_react.useMemo(() => ({
		...position,
		context,
		refs,
		elements,
		rootStore: store
	}), [
		position,
		refs,
		elements,
		context,
		store
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useFocus.mjs
var isMacSafari = mac && webkit;
/**
* Opens the floating element while the reference element has focus, like CSS
* `:focus`.
* @see https://floating-ui.com/docs/useFocus
*/
function useFocus(context, props = {}) {
	const { enabled = true, delay } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const { events, dataRef } = store.context;
	const blockFocusRef = import_react.useRef(false);
	const blockedReferenceRef = import_react.useRef(null);
	const keyboardModalityRef = import_react.useRef(true);
	const timeout = useTimeout();
	import_react.useEffect(() => {
		const domReference = store.select("domReferenceElement");
		if (!enabled) return;
		const win = getWindow(domReference);
		function onBlur() {
			const currentDomReference = store.select("domReferenceElement");
			if (!store.select("open") && isHTMLElement(currentDomReference) && currentDomReference === activeElement(ownerDocument(currentDomReference))) {
				blockFocusRef.current = true;
				blockedReferenceRef.current = currentDomReference;
			}
		}
		function onKeyDown() {
			keyboardModalityRef.current = true;
		}
		function onPointerDown() {
			keyboardModalityRef.current = false;
		}
		return mergeCleanups(addEventListener(win, "blur", onBlur), isMacSafari && addEventListener(win, "keydown", onKeyDown, true), isMacSafari && addEventListener(win, "pointerdown", onPointerDown, true));
	}, [store, enabled]);
	import_react.useEffect(() => {
		if (!enabled) return;
		function onOpenChangeLocal(details) {
			if (details.reason === "trigger-press" || details.reason === "escape-key") {
				const referenceElement = store.select("domReferenceElement");
				if (isElement(referenceElement)) {
					blockedReferenceRef.current = referenceElement;
					blockFocusRef.current = true;
				}
			}
		}
		events.on("openchange", onOpenChangeLocal);
		return () => {
			events.off("openchange", onOpenChangeLocal);
		};
	}, [
		events,
		enabled,
		store
	]);
	const reference = import_react.useMemo(() => {
		function resetBlockedFocus() {
			blockFocusRef.current = false;
			blockedReferenceRef.current = null;
		}
		return {
			onMouseLeave() {
				resetBlockedFocus();
			},
			onFocus(event) {
				const focusTarget = event.currentTarget;
				if (blockFocusRef.current) {
					if (blockedReferenceRef.current === focusTarget) return;
					resetBlockedFocus();
				}
				const target = getTarget(event.nativeEvent);
				if (isElement(target)) {
					if (isMacSafari && !event.relatedTarget) {
						if (!keyboardModalityRef.current && !isTypeableElement(target)) return;
					} else if (!matchesFocusVisible(target)) return;
				}
				const movedFromOtherEnabledTrigger = isTargetInsideEnabledTrigger(event.relatedTarget, store.context.triggerElements);
				const { nativeEvent, currentTarget } = event;
				const delayValue = typeof delay === "function" ? delay() : delay;
				if (store.select("open") && movedFromOtherEnabledTrigger || delayValue === 0 || delayValue === void 0) {
					store.setOpen(true, createChangeEventDetails(triggerFocus, nativeEvent, currentTarget));
					return;
				}
				timeout.start(delayValue, () => {
					if (blockFocusRef.current) return;
					store.setOpen(true, createChangeEventDetails(triggerFocus, nativeEvent, currentTarget));
				});
			},
			onBlur(event) {
				resetBlockedFocus();
				const relatedTarget = event.relatedTarget;
				const nativeEvent = event.nativeEvent;
				const movedToFocusGuard = isElement(relatedTarget) && relatedTarget.hasAttribute(createAttribute("focus-guard")) && relatedTarget.getAttribute("data-type") === "outside";
				timeout.start(0, () => {
					const domReference = store.select("domReferenceElement");
					const activeEl = activeElement(ownerDocument(domReference));
					if (!relatedTarget && activeEl === domReference) return;
					if (contains(dataRef.current.floatingContext?.refs.floating.current, activeEl) || contains(domReference, activeEl) || movedToFocusGuard) return;
					if (isTargetInsideEnabledTrigger(relatedTarget ?? activeEl, store.context.triggerElements)) return;
					store.setOpen(false, createChangeEventDetails(triggerFocus, nativeEvent));
				});
			}
		};
	}, [
		dataRef,
		delay,
		store,
		timeout
	]);
	return import_react.useMemo(() => enabled ? {
		reference,
		trigger: reference
	} : {}, [enabled, reference]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useHoverInteractionSharedState.mjs
var HoverInteraction = class HoverInteraction {
	constructor() {
		this.pointerType = void 0;
		this.interactedInside = false;
		this.handler = void 0;
		this.blockMouseMove = true;
		this.performedPointerEventsMutation = false;
		this.pointerEventsScopeElement = null;
		this.pointerEventsReferenceElement = null;
		this.pointerEventsFloatingElement = null;
		this.restTimeoutPending = false;
		this.openChangeTimeout = new Timeout();
		this.restTimeout = new Timeout();
		this.handleCloseOptions = void 0;
	}
	static create() {
		return new HoverInteraction();
	}
	dispose = () => {
		this.openChangeTimeout.clear();
		this.restTimeout.clear();
	};
	disposeEffect = () => {
		return this.dispose;
	};
};
var pointerEventsMutationOwnerByScopeElement = /* @__PURE__ */ new WeakMap();
function clearSafePolygonPointerEventsMutation(instance) {
	if (!instance.performedPointerEventsMutation) return;
	const scopeElement = instance.pointerEventsScopeElement;
	if (scopeElement && pointerEventsMutationOwnerByScopeElement.get(scopeElement) === instance) {
		instance.pointerEventsScopeElement?.style.removeProperty("pointer-events");
		instance.pointerEventsReferenceElement?.style.removeProperty("pointer-events");
		instance.pointerEventsFloatingElement?.style.removeProperty("pointer-events");
		pointerEventsMutationOwnerByScopeElement.delete(scopeElement);
	}
	instance.performedPointerEventsMutation = false;
	instance.pointerEventsScopeElement = null;
	instance.pointerEventsReferenceElement = null;
	instance.pointerEventsFloatingElement = null;
}
function applySafePolygonPointerEventsMutation(instance, options) {
	const { scopeElement, referenceElement, floatingElement } = options;
	const existingOwner = pointerEventsMutationOwnerByScopeElement.get(scopeElement);
	if (existingOwner && existingOwner !== instance) clearSafePolygonPointerEventsMutation(existingOwner);
	clearSafePolygonPointerEventsMutation(instance);
	instance.performedPointerEventsMutation = true;
	instance.pointerEventsScopeElement = scopeElement;
	instance.pointerEventsReferenceElement = referenceElement;
	instance.pointerEventsFloatingElement = floatingElement;
	pointerEventsMutationOwnerByScopeElement.set(scopeElement, instance);
	scopeElement.style.pointerEvents = "none";
	referenceElement.style.pointerEvents = "auto";
	floatingElement.style.pointerEvents = "auto";
}
function useHoverInteractionSharedState(store) {
	const data = store.context.dataRef.current;
	const instance = useRefWithInit(() => data.hoverInteractionState ?? HoverInteraction.create()).current;
	if (!data.hoverInteractionState) data.hoverInteractionState = instance;
	useOnMount(data.hoverInteractionState.disposeEffect);
	return data.hoverInteractionState;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useHoverFloatingInteraction.mjs
/**
* Provides hover interactions that should be attached to the floating element.
*/
function useHoverFloatingInteraction(context, parameters = {}) {
	const { enabled = true, closeDelay: closeDelayProp = 0, nodeId: nodeIdProp } = parameters;
	const store = "rootStore" in context ? context.rootStore : context;
	const open = store.useState("open");
	const floatingElement = store.useState("floatingElement");
	const domReferenceElement = store.useState("domReferenceElement");
	const { dataRef } = store.context;
	const tree = useFloatingTree();
	const parentId = useFloatingParentNodeId();
	const instance = useHoverInteractionSharedState(store);
	const childClosedTimeout = useTimeout();
	const isClickLikeOpenEvent$2 = useStableCallback(() => {
		return isClickLikeOpenEvent(dataRef.current.openEvent?.type, instance.interactedInside);
	});
	const isHoverOpen = useStableCallback(() => {
		return isHoverOpenEvent(dataRef.current.openEvent?.type);
	});
	const clearPointerEvents = useStableCallback(() => {
		clearSafePolygonPointerEventsMutation(instance);
	});
	useIsoLayoutEffect(() => {
		if (!open) {
			instance.pointerType = void 0;
			instance.restTimeoutPending = false;
			instance.interactedInside = false;
			clearPointerEvents();
		}
	}, [
		open,
		instance,
		clearPointerEvents
	]);
	import_react.useEffect(() => {
		return clearPointerEvents;
	}, [clearPointerEvents]);
	useIsoLayoutEffect(() => {
		if (!enabled) return;
		if (open && instance.handleCloseOptions?.blockPointerEvents && isHoverOpen() && isElement(domReferenceElement) && floatingElement) {
			const ref = domReferenceElement;
			const floatingEl = floatingElement;
			const doc = ownerDocument(floatingElement);
			const parentFloating = tree?.nodesRef.current.find((node) => node.id === parentId)?.context?.elements.floating;
			if (parentFloating) parentFloating.style.pointerEvents = "";
			const cachedScopeElement = instance.pointerEventsScopeElement !== floatingEl ? instance.pointerEventsScopeElement : null;
			const parentScopeElement = parentFloating !== floatingEl ? parentFloating : null;
			const scopeElement = instance.handleCloseOptions?.getScope?.() ?? cachedScopeElement ?? parentScopeElement ?? ref.closest("[data-rootownerid]") ?? doc.body;
			applySafePolygonPointerEventsMutation(instance, {
				scopeElement,
				referenceElement: ref,
				floatingElement: floatingEl
			});
			return () => {
				clearPointerEvents();
			};
		}
	}, [
		enabled,
		open,
		domReferenceElement,
		floatingElement,
		instance,
		isHoverOpen,
		tree,
		parentId,
		clearPointerEvents
	]);
	import_react.useEffect(() => {
		if (!enabled) return;
		function hasParentChildren() {
			return !!(tree && parentId && getNodeChildren(tree.nodesRef.current, parentId).length > 0);
		}
		function closeWithDelay(event) {
			const closeDelay = getDelay(closeDelayProp, "close", instance.pointerType);
			const close = () => {
				store.setOpen(false, createChangeEventDetails(triggerHover, event));
				tree?.events.emit("floating.closed", event);
			};
			if (closeDelay) instance.openChangeTimeout.start(closeDelay, close);
			else {
				instance.openChangeTimeout.clear();
				close();
			}
		}
		function handleInteractInside(event) {
			const target = getTarget(event);
			if (!isInteractiveElement(target)) {
				instance.interactedInside = false;
				return;
			}
			instance.interactedInside = target?.closest("[aria-haspopup]") != null;
		}
		function onFloatingMouseEnter() {
			instance.openChangeTimeout.clear();
			childClosedTimeout.clear();
			tree?.events.off("floating.closed", onNodeClosed);
			clearPointerEvents();
		}
		function onFloatingMouseLeave(event) {
			if (hasParentChildren() && tree) {
				tree.events.on("floating.closed", onNodeClosed);
				return;
			}
			if (isTargetInsideEnabledTrigger(event.relatedTarget, store.context.triggerElements)) return;
			const currentNodeId = dataRef.current.floatingContext?.nodeId ?? nodeIdProp;
			const relatedTarget = event.relatedTarget;
			if (tree && currentNodeId && isElement(relatedTarget) && getNodeChildren(tree.nodesRef.current, currentNodeId, false).some((node) => contains(node.context?.elements.floating, relatedTarget))) return;
			if (instance.handler) {
				instance.handler(event);
				return;
			}
			clearPointerEvents();
			if (isHoverOpen() && !isClickLikeOpenEvent$2()) closeWithDelay(event);
		}
		function onNodeClosed(event) {
			if (!tree || !parentId || hasParentChildren()) return;
			childClosedTimeout.start(0, () => {
				tree.events.off("floating.closed", onNodeClosed);
				store.setOpen(false, createChangeEventDetails(triggerHover, event));
				tree.events.emit("floating.closed", event);
			});
		}
		const floating = floatingElement;
		return mergeCleanups(floating && addEventListener(floating, "mouseenter", onFloatingMouseEnter), floating && addEventListener(floating, "mouseleave", onFloatingMouseLeave), floating && addEventListener(floating, "pointerdown", handleInteractInside, true), () => {
			tree?.events.off("floating.closed", onNodeClosed);
		});
	}, [
		enabled,
		floatingElement,
		store,
		dataRef,
		closeDelayProp,
		nodeIdProp,
		isHoverOpen,
		isClickLikeOpenEvent$2,
		clearPointerEvents,
		instance,
		tree,
		parentId,
		childClosedTimeout
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useHoverReferenceInteraction.mjs
var EMPTY_REF = { current: null };
/**
* Provides hover interactions that should be attached to reference or trigger
* elements.
*/
function useHoverReferenceInteraction(context, props = {}) {
	const { enabled = true, delay = 0, handleClose = null, mouseOnly = false, restMs = 0, move = true, triggerElementRef = EMPTY_REF, externalTree, isActiveTrigger = true, getHandleCloseContext, isClosing, shouldOpen: shouldOpenProp, guardStaleOpen = false } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const { dataRef, events } = store.context;
	const tree = useFloatingTree(externalTree);
	const instance = useHoverInteractionSharedState(store);
	const isHoverCloseActiveRef = import_react.useRef(false);
	const handleCloseRef = useValueAsRef(handleClose);
	const delayRef = useValueAsRef(delay);
	const restMsRef = useValueAsRef(restMs);
	const enabledRef = useValueAsRef(enabled);
	const shouldOpenRef = useValueAsRef(shouldOpenProp);
	const isClosingRef = useValueAsRef(isClosing);
	const isClickLikeOpenEvent$1 = useStableCallback(() => {
		return isClickLikeOpenEvent(dataRef.current.openEvent?.type, instance.interactedInside);
	});
	const checkShouldOpen = useStableCallback(() => {
		return shouldOpenRef.current?.() !== false;
	});
	const isOverInactiveTrigger = useStableCallback((currentDomReference, currentTarget, target) => {
		const allTriggers = store.context.triggerElements;
		if (allTriggers.hasElement(currentTarget)) return !currentDomReference || !contains(currentDomReference, currentTarget);
		if (!isElement(target)) return false;
		const targetElement = target;
		return allTriggers.hasMatchingElement((trigger) => contains(trigger, targetElement)) && (!currentDomReference || !contains(currentDomReference, targetElement));
	});
	const cleanupMouseMoveHandler = useStableCallback(() => {
		if (!instance.handler) return;
		ownerDocument(store.select("domReferenceElement")).removeEventListener("mousemove", instance.handler);
		instance.handler = void 0;
	});
	const clearPointerEvents = useStableCallback(() => {
		clearSafePolygonPointerEventsMutation(instance);
	});
	if (isActiveTrigger) instance.handleCloseOptions = handleClose?.__options;
	import_react.useEffect(() => cleanupMouseMoveHandler, [cleanupMouseMoveHandler]);
	import_react.useEffect(() => {
		if (!enabled) return;
		function onOpenChangeLocal(details) {
			if (!details.open) {
				isHoverCloseActiveRef.current = details.reason === triggerHover;
				cleanupMouseMoveHandler();
				instance.openChangeTimeout.clear();
				instance.restTimeout.clear();
				instance.blockMouseMove = true;
				instance.restTimeoutPending = false;
			} else isHoverCloseActiveRef.current = false;
		}
		events.on("openchange", onOpenChangeLocal);
		return () => {
			events.off("openchange", onOpenChangeLocal);
		};
	}, [
		enabled,
		events,
		instance,
		cleanupMouseMoveHandler
	]);
	import_react.useEffect(() => {
		if (!enabled) return;
		function closeWithDelay(event, runElseBranch = true) {
			const closeDelay = getDelay(delayRef.current, "close", instance.pointerType);
			if (closeDelay) instance.openChangeTimeout.start(closeDelay, () => {
				store.setOpen(false, createChangeEventDetails(triggerHover, event));
				tree?.events.emit("floating.closed", event);
			});
			else if (runElseBranch) {
				instance.openChangeTimeout.clear();
				store.setOpen(false, createChangeEventDetails(triggerHover, event));
				tree?.events.emit("floating.closed", event);
			}
		}
		const trigger = triggerElementRef.current ?? (isActiveTrigger ? store.select("domReferenceElement") : null);
		if (!isElement(trigger)) return;
		function onMouseEnter(event) {
			instance.openChangeTimeout.clear();
			instance.blockMouseMove = false;
			if (mouseOnly && !isMouseLikePointerType(instance.pointerType)) return;
			const restMsValue = getRestMs(restMsRef.current);
			const openDelay = getDelay(delayRef.current, "open", instance.pointerType);
			const eventTarget = getTarget(event);
			const currentTarget = event.currentTarget ?? null;
			const currentDomReference = store.select("domReferenceElement");
			let triggerNode = currentTarget;
			if (isElement(eventTarget) && !store.context.triggerElements.hasElement(eventTarget)) {
				for (const triggerElement of store.context.triggerElements.elements()) if (contains(triggerElement, eventTarget)) {
					triggerNode = triggerElement;
					break;
				}
			}
			if (isElement(currentTarget) && isElement(currentDomReference) && !store.context.triggerElements.hasElement(currentTarget) && contains(currentTarget, currentDomReference)) triggerNode = currentDomReference;
			const isOverInactive = triggerNode == null ? false : isOverInactiveTrigger(currentDomReference, triggerNode, eventTarget);
			const isOpen = store.select("open");
			const isInClosingTransition = isClosingRef.current?.() ?? store.select("transitionStatus") === "ending";
			const isHoverCloseTransition = !isOpen && isInClosingTransition && isHoverCloseActiveRef.current;
			const isReenteringSameTriggerDuringCloseTransition = !isOverInactive && isElement(triggerNode) && isElement(currentDomReference) && contains(currentDomReference, triggerNode) && isHoverCloseTransition;
			const isRestOnlyDelay = restMsValue > 0 && !openDelay;
			const shouldOpenImmediately = isOverInactive && (isOpen || isHoverCloseTransition) || isReenteringSameTriggerDuringCloseTransition;
			const shouldOpen = !isOpen || isOverInactive;
			if (shouldOpenImmediately) {
				if (checkShouldOpen()) store.setOpen(true, createChangeEventDetails(triggerHover, event, triggerNode));
				return;
			}
			if (isRestOnlyDelay) return;
			if (openDelay) instance.openChangeTimeout.start(openDelay, () => {
				if (shouldOpen && checkShouldOpen()) store.setOpen(true, createChangeEventDetails(triggerHover, event, triggerNode));
			});
			else if (shouldOpen) {
				if (checkShouldOpen()) store.setOpen(true, createChangeEventDetails(triggerHover, event, triggerNode));
			}
		}
		function onMouseLeave(event) {
			if (isClickLikeOpenEvent$1()) {
				clearPointerEvents();
				return;
			}
			cleanupMouseMoveHandler();
			const doc = ownerDocument(store.select("domReferenceElement"));
			instance.restTimeout.clear();
			instance.restTimeoutPending = false;
			const handleCloseContextBase = dataRef.current.floatingContext ?? getHandleCloseContext?.();
			if (isTargetInsideEnabledTrigger(event.relatedTarget, store.context.triggerElements)) return;
			if (handleCloseRef.current && handleCloseContextBase) {
				if (!store.select("open")) instance.openChangeTimeout.clear();
				const currentTrigger = triggerElementRef.current;
				instance.handler = handleCloseRef.current({
					...handleCloseContextBase,
					tree,
					x: event.clientX,
					y: event.clientY,
					onClose() {
						clearPointerEvents();
						cleanupMouseMoveHandler();
						if (enabledRef.current && !isClickLikeOpenEvent$1() && currentTrigger === store.select("domReferenceElement")) closeWithDelay(event, true);
					}
				});
				doc.addEventListener("mousemove", instance.handler);
				instance.handler(event);
				return;
			}
			if (instance.pointerType === "touch" ? !contains(store.select("floatingElement"), event.relatedTarget) : true) closeWithDelay(event);
		}
		function onMouseOut(event) {
			if (contains(trigger, event.relatedTarget)) return;
			instance.openChangeTimeout.clear();
			instance.restTimeout.clear();
			instance.restTimeoutPending = false;
		}
		const staleOpenGuard = guardStaleOpen ? addEventListener(trigger, "mouseout", onMouseOut) : void 0;
		if (move) return mergeCleanups(addEventListener(trigger, "mousemove", onMouseEnter, { once: true }), addEventListener(trigger, "mouseenter", onMouseEnter), addEventListener(trigger, "mouseleave", onMouseLeave), staleOpenGuard);
		return mergeCleanups(addEventListener(trigger, "mouseenter", onMouseEnter), addEventListener(trigger, "mouseleave", onMouseLeave), staleOpenGuard);
	}, [
		cleanupMouseMoveHandler,
		clearPointerEvents,
		dataRef,
		delayRef,
		store,
		enabled,
		handleCloseRef,
		instance,
		isActiveTrigger,
		isOverInactiveTrigger,
		isClickLikeOpenEvent$1,
		mouseOnly,
		move,
		restMsRef,
		triggerElementRef,
		tree,
		enabledRef,
		getHandleCloseContext,
		isClosingRef,
		checkShouldOpen,
		guardStaleOpen
	]);
	return import_react.useMemo(() => {
		if (!enabled) return;
		function setPointerRef(event) {
			instance.pointerType = event.pointerType;
		}
		return {
			onPointerDown: setPointerRef,
			onPointerEnter: setPointerRef,
			onMouseMove(event) {
				const { nativeEvent } = event;
				const trigger = event.currentTarget;
				const currentDomReference = store.select("domReferenceElement");
				const currentOpen = store.select("open");
				const isOverInactive = isOverInactiveTrigger(currentDomReference, trigger, event.target);
				if (mouseOnly && !isMouseLikePointerType(instance.pointerType)) return;
				if (currentOpen && isOverInactive && instance.handleCloseOptions?.blockPointerEvents) {
					const floatingElement = store.select("floatingElement");
					if (floatingElement) {
						const scopeElement = instance.handleCloseOptions?.getScope?.() ?? trigger.ownerDocument.body;
						applySafePolygonPointerEventsMutation(instance, {
							scopeElement,
							referenceElement: trigger,
							floatingElement
						});
					}
				}
				const restMsValue = getRestMs(restMsRef.current);
				if (currentOpen && !isOverInactive || restMsValue === 0) return;
				if (!isOverInactive && instance.restTimeoutPending && event.movementX ** 2 + event.movementY ** 2 < 2) return;
				instance.restTimeout.clear();
				function handleMouseMove() {
					instance.restTimeoutPending = false;
					if (isClickLikeOpenEvent$1()) return;
					const latestOpen = store.select("open");
					if (!instance.blockMouseMove && (!latestOpen || isOverInactive) && checkShouldOpen()) store.setOpen(true, createChangeEventDetails(triggerHover, nativeEvent, trigger));
				}
				if (instance.pointerType === "touch") import_react_dom.flushSync(() => {
					handleMouseMove();
				});
				else if (isOverInactive && currentOpen) handleMouseMove();
				else {
					instance.restTimeoutPending = true;
					instance.restTimeout.start(restMsValue, handleMouseMove);
				}
			}
		};
	}, [
		enabled,
		instance,
		isClickLikeOpenEvent$1,
		isOverInactiveTrigger,
		mouseOnly,
		store,
		restMsRef,
		checkShouldOpen
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useListNavigation.mjs
var ESCAPE = "Escape";
function isStationaryWebKitPointer(event) {
	return webkit && event.movementX === 0 && event.movementY === 0;
}
function doSwitch(orientation, vertical, horizontal) {
	switch (orientation) {
		case "vertical": return vertical;
		case "horizontal": return horizontal;
		default: return vertical || horizontal;
	}
}
function isMainOrientationKey(key, orientation) {
	return doSwitch(orientation, key === "ArrowUp" || key === "ArrowDown", key === "ArrowLeft" || key === "ArrowRight");
}
function isMainOrientationToEndKey(key, orientation, rtl) {
	return doSwitch(orientation, key === "ArrowDown", rtl ? key === "ArrowLeft" : key === "ArrowRight") || key === "Enter" || key === " " || key === "";
}
function isCrossOrientationOpenKey(key, orientation, rtl) {
	return doSwitch(orientation, rtl ? key === ARROW_LEFT$1 : key === ARROW_RIGHT$1, key === ARROW_DOWN$1);
}
function isCrossOrientationCloseKey(key, orientation, rtl, grid) {
	const vertical = rtl ? key === ARROW_RIGHT$1 : key === ARROW_LEFT$1;
	const horizontal = key === ARROW_UP$1;
	if (orientation === "both" || orientation === "horizontal" && grid) return key === ESCAPE;
	return doSwitch(orientation, vertical, horizontal);
}
/**
* Adds arrow key-based navigation of a list of items, either using real DOM
* focus or virtual focus.
* @see https://floating-ui.com/docs/useListNavigation
*/
function useListNavigation(context, props) {
	const { listRef, activeIndex, onNavigate: onNavigateProp = () => {}, enabled = true, selectedIndex = null, allowEscape = false, loopFocus = false, nested = false, rtl = false, virtual = false, focusItemOnOpen = "auto", focusItemOnHover = true, openOnArrowKeyDown = true, disabledIndices = void 0, orientation = "vertical", parentOrientation, id, resetOnPointerLeave = true, externalTree, grid: navigateGrid } = props;
	const isGrid = navigateGrid != null;
	const store = "rootStore" in context ? context.rootStore : context;
	const open = store.useState("open");
	const floatingElement = store.useState("floatingElement");
	const domReferenceElement = store.useState("domReferenceElement");
	const dataRef = store.context.dataRef;
	const floatingFocusElement = getFloatingFocusElement(floatingElement);
	const typeableComboboxReference = isTypeableCombobox(domReferenceElement);
	const floatingFocusElementRef = useValueAsRef(floatingFocusElement);
	const parentId = useFloatingParentNodeId();
	const tree = useFloatingTree(externalTree);
	const focusItemOnOpenRef = import_react.useRef(focusItemOnOpen);
	const indexRef = import_react.useRef(selectedIndex ?? -1);
	const keyRef = import_react.useRef(null);
	const isPointerModalityRef = import_react.useRef(true);
	const onNavigate = useStableCallback((event) => {
		onNavigateProp(indexRef.current === -1 ? null : indexRef.current, event);
	});
	const previousMountedRef = import_react.useRef(!!floatingElement);
	const previousOpenRef = import_react.useRef(open);
	const forceSyncFocusRef = import_react.useRef(false);
	const forceScrollIntoViewRef = import_react.useRef(false);
	const cancelQueuedFocusRef = import_react.useRef(null);
	const disabledIndicesRef = useValueAsRef(disabledIndices);
	const latestOpenRef = useValueAsRef(open);
	const selectedIndexRef = useValueAsRef(selectedIndex);
	const resetOnPointerLeaveRef = useValueAsRef(resetOnPointerLeave);
	const focusFrame = useAnimationFrame();
	const waitForListPopulatedFrame = useAnimationFrame();
	const focusItem = useStableCallback(() => {
		function runFocus(item) {
			if (virtual) tree?.events.emit("virtualfocus", item);
			else cancelQueuedFocusRef.current = enqueueFocus(item, {
				sync: forceSyncFocusRef.current,
				preventScroll: true
			});
		}
		const initialItem = listRef.current[indexRef.current];
		const forceScrollIntoView = forceScrollIntoViewRef.current;
		if (initialItem) runFocus(initialItem);
		(forceSyncFocusRef.current ? (callback) => callback() : (callback) => focusFrame.request(callback))(() => {
			const waitedItem = listRef.current[indexRef.current] || initialItem;
			if (!waitedItem) return;
			if (!initialItem) runFocus(waitedItem);
			if (item && (forceScrollIntoView || !isPointerModalityRef.current)) waitedItem.scrollIntoView?.({
				block: "nearest",
				inline: "nearest"
			});
		});
	});
	useIsoLayoutEffect(() => {
		dataRef.current.orientation = orientation;
	}, [dataRef, orientation]);
	useIsoLayoutEffect(() => {
		if (!enabled) return;
		if (open && floatingElement) {
			indexRef.current = selectedIndex ?? -1;
			if (focusItemOnOpenRef.current && selectedIndex != null) {
				forceScrollIntoViewRef.current = true;
				onNavigate();
			}
		} else if (previousMountedRef.current) {
			indexRef.current = -1;
			onNavigate();
		}
	}, [
		enabled,
		open,
		floatingElement,
		selectedIndex,
		onNavigate
	]);
	useIsoLayoutEffect(() => {
		if (!enabled) return;
		if (!open) {
			forceSyncFocusRef.current = false;
			return;
		}
		if (!floatingElement) return;
		if (activeIndex == null) {
			forceSyncFocusRef.current = false;
			if (selectedIndexRef.current != null) return;
			if (previousMountedRef.current) {
				indexRef.current = -1;
				focusItem();
			}
			if ((!previousOpenRef.current || !previousMountedRef.current) && focusItemOnOpenRef.current && (keyRef.current != null || focusItemOnOpenRef.current === true && keyRef.current == null)) {
				let runs = 0;
				const waitForListPopulated = () => {
					if (listRef.current[0] == null) {
						if (runs < 2) (runs ? (callback) => waitForListPopulatedFrame.request(callback) : queueMicrotask)(waitForListPopulated);
						runs += 1;
					} else {
						indexRef.current = keyRef.current == null || isMainOrientationToEndKey(keyRef.current, orientation, rtl) || nested ? getMinListIndex(listRef) : getMaxListIndex(listRef);
						keyRef.current = null;
						onNavigate();
					}
				};
				waitForListPopulated();
			}
		} else if (!isIndexOutOfListBounds(listRef.current, activeIndex)) {
			indexRef.current = activeIndex;
			focusItem();
			forceScrollIntoViewRef.current = false;
		}
	}, [
		enabled,
		open,
		floatingElement,
		activeIndex,
		selectedIndexRef,
		nested,
		listRef,
		orientation,
		rtl,
		onNavigate,
		focusItem,
		waitForListPopulatedFrame
	]);
	useIsoLayoutEffect(() => {
		if (!enabled || floatingElement || !tree || virtual || !previousMountedRef.current) return;
		const nodes = tree.nodesRef.current;
		const parent = nodes.find((node) => node.id === parentId)?.context?.elements.floating;
		const activeEl = activeElement(ownerDocument(domReferenceElement ?? parent ?? null));
		const treeContainsActiveEl = nodes.some((node) => node.context && contains(node.context.elements.floating, activeEl));
		if (parent && !treeContainsActiveEl && isPointerModalityRef.current) parent.focus({ preventScroll: true });
	}, [
		enabled,
		floatingElement,
		domReferenceElement,
		tree,
		parentId,
		virtual
	]);
	useIsoLayoutEffect(() => {
		previousOpenRef.current = open;
		previousMountedRef.current = !!floatingElement;
	});
	useIsoLayoutEffect(() => {
		if (!open) {
			keyRef.current = null;
			focusItemOnOpenRef.current = focusItemOnOpen;
		}
	}, [open, focusItemOnOpen]);
	const hasActiveIndex = activeIndex != null;
	const syncCurrentTarget = useStableCallback((event) => {
		if (!latestOpenRef.current) return;
		const index = listRef.current.indexOf(event.currentTarget);
		if (index !== -1 && (indexRef.current !== index || activeIndex !== index)) {
			indexRef.current = index;
			onNavigate(event);
		}
	});
	const getParentOrientation = useStableCallback(() => {
		return parentOrientation ?? tree?.nodesRef.current.find((node) => node.id === parentId)?.context?.dataRef?.current.orientation;
	});
	const getMinEnabledIndex = useStableCallback(() => {
		return getMinListIndex(listRef, disabledIndicesRef.current);
	});
	const commonOnKeyDown = useStableCallback((event) => {
		isPointerModalityRef.current = false;
		forceSyncFocusRef.current = true;
		if (event.which === 229) return;
		if (!latestOpenRef.current && event.currentTarget === floatingFocusElementRef.current) return;
		if (nested && isCrossOrientationCloseKey(event.key, orientation, rtl, isGrid)) {
			if (!isMainOrientationKey(event.key, getParentOrientation())) stopEvent(event);
			store.setOpen(false, createChangeEventDetails(listNavigation, event.nativeEvent));
			if (isHTMLElement(domReferenceElement)) {
				if (virtual) tree?.events.emit("virtualfocus", domReferenceElement);
				else domReferenceElement.focus();
			}
			return;
		}
		const currentIndex = indexRef.current;
		const minIndex = getMinListIndex(listRef, disabledIndices);
		const maxIndex = getMaxListIndex(listRef, disabledIndices);
		if (!typeableComboboxReference) {
			if (event.key === "Home") {
				stopEvent(event);
				indexRef.current = minIndex;
				onNavigate(event);
			}
			if (event.key === "End") {
				stopEvent(event);
				indexRef.current = maxIndex;
				onNavigate(event);
			}
		}
		if (navigateGrid != null) {
			const index = navigateGrid(event, indexRef.current, listRef, orientation, loopFocus, rtl, disabledIndices, minIndex, maxIndex);
			if (index != null) {
				indexRef.current = index;
				onNavigate(event);
			}
			if (orientation === "both") return;
		}
		if (isMainOrientationKey(event.key, orientation)) {
			stopEvent(event);
			if (open && !virtual && activeElement(event.currentTarget.ownerDocument) === event.currentTarget) {
				indexRef.current = isMainOrientationToEndKey(event.key, orientation, rtl) ? minIndex : maxIndex;
				onNavigate(event);
				return;
			}
			if (isMainOrientationToEndKey(event.key, orientation, rtl)) {
				if (loopFocus) {
					if (currentIndex >= maxIndex) {
						if (allowEscape && currentIndex !== listRef.current.length) indexRef.current = -1;
						else {
							forceSyncFocusRef.current = false;
							indexRef.current = minIndex;
						}
					} else indexRef.current = findNonDisabledListIndex(listRef.current, {
						startingIndex: currentIndex,
						disabledIndices
					});
				} else indexRef.current = Math.min(maxIndex, findNonDisabledListIndex(listRef.current, {
					startingIndex: currentIndex,
					disabledIndices
				}));
			} else if (loopFocus) {
				if (currentIndex <= minIndex) {
					if (allowEscape && currentIndex !== -1) indexRef.current = listRef.current.length;
					else {
						forceSyncFocusRef.current = false;
						indexRef.current = maxIndex;
					}
				} else indexRef.current = findNonDisabledListIndex(listRef.current, {
					startingIndex: currentIndex,
					decrement: true,
					disabledIndices
				});
			} else indexRef.current = Math.max(minIndex, findNonDisabledListIndex(listRef.current, {
				startingIndex: currentIndex,
				decrement: true,
				disabledIndices
			}));
			if (isIndexOutOfListBounds(listRef.current, indexRef.current)) indexRef.current = -1;
			onNavigate(event);
		}
	});
	const item = import_react.useMemo(() => {
		return {
			onFocus(event) {
				forceSyncFocusRef.current = true;
				syncCurrentTarget(event);
			},
			onClick: ({ currentTarget }) => currentTarget.focus({ preventScroll: true }),
			onMouseMove(event) {
				if (isStationaryWebKitPointer(event)) return;
				forceSyncFocusRef.current = true;
				forceScrollIntoViewRef.current = false;
				if (focusItemOnHover) syncCurrentTarget(event);
			},
			onPointerLeave(event) {
				if (!latestOpenRef.current || !isPointerModalityRef.current || event.pointerType === "touch") return;
				forceSyncFocusRef.current = true;
				const relatedTarget = event.relatedTarget;
				if (!focusItemOnHover || listRef.current.includes(relatedTarget)) return;
				if (!resetOnPointerLeaveRef.current) return;
				cancelQueuedFocusRef.current?.();
				cancelQueuedFocusRef.current = null;
				indexRef.current = -1;
				onNavigate(event);
				if (!virtual) {
					const floatingFocusEl = floatingFocusElementRef.current;
					const activeEl = activeElement(ownerDocument(floatingFocusEl));
					if (floatingFocusEl && contains(floatingFocusEl, activeEl)) floatingFocusEl.focus({ preventScroll: true });
				}
			}
		};
	}, [
		syncCurrentTarget,
		latestOpenRef,
		floatingFocusElementRef,
		focusItemOnHover,
		listRef,
		onNavigate,
		resetOnPointerLeaveRef,
		virtual
	]);
	const ariaActiveDescendantProp = import_react.useMemo(() => {
		return virtual && open && hasActiveIndex && { "aria-activedescendant": `${id}-${activeIndex}` };
	}, [
		virtual,
		open,
		hasActiveIndex,
		id,
		activeIndex
	]);
	const floating = import_react.useMemo(() => {
		return {
			...!typeableComboboxReference ? ariaActiveDescendantProp : {},
			onKeyDown(event) {
				if (event.key === "Tab" && event.shiftKey && open && !virtual) {
					const target = getTarget(event.nativeEvent);
					if (target && !contains(floatingFocusElementRef.current, target)) return;
					stopEvent(event);
					store.setOpen(false, createChangeEventDetails(focusOut, event.nativeEvent));
					if (isHTMLElement(domReferenceElement)) domReferenceElement.focus();
					return;
				}
				commonOnKeyDown(event);
			},
			onPointerMove(event) {
				if (isStationaryWebKitPointer(event)) return;
				isPointerModalityRef.current = true;
			}
		};
	}, [
		ariaActiveDescendantProp,
		commonOnKeyDown,
		floatingFocusElementRef,
		typeableComboboxReference,
		store,
		open,
		virtual,
		domReferenceElement
	]);
	const trigger = import_react.useMemo(() => {
		function openOnNavigationKeyDown(event) {
			store.setOpen(true, createChangeEventDetails(listNavigation, event.nativeEvent, event.currentTarget));
		}
		function checkVirtualMouse(event) {
			if (focusItemOnOpen === "auto" && isVirtualClick(event.nativeEvent)) focusItemOnOpenRef.current = !virtual;
		}
		function checkVirtualPointer(event) {
			focusItemOnOpenRef.current = focusItemOnOpen;
			if (focusItemOnOpen === "auto" && isVirtualPointerEvent(event.nativeEvent)) focusItemOnOpenRef.current = true;
		}
		return {
			onKeyDown(event) {
				const currentOpen = store.select("open");
				isPointerModalityRef.current = false;
				const isArrowKey = event.key.startsWith("Arrow");
				const isParentCrossOpenKey = isCrossOrientationOpenKey(event.key, getParentOrientation(), rtl);
				const isMainKey = isMainOrientationKey(event.key, orientation);
				const isNavigationKey = (nested ? isParentCrossOpenKey : isMainKey) || event.key === "Enter" || event.key.trim() === "";
				if (virtual && currentOpen) return commonOnKeyDown(event);
				if (!currentOpen && !openOnArrowKeyDown && isArrowKey) return;
				if (isNavigationKey) {
					const isParentMainKey = isMainOrientationKey(event.key, getParentOrientation());
					keyRef.current = nested && isParentMainKey ? null : event.key;
				}
				if (nested) {
					if (isParentCrossOpenKey) {
						stopEvent(event);
						if (currentOpen) {
							indexRef.current = getMinEnabledIndex();
							onNavigate(event);
						} else openOnNavigationKeyDown(event);
					}
					return;
				}
				if (isMainKey) {
					if (selectedIndexRef.current != null) indexRef.current = selectedIndexRef.current;
					stopEvent(event);
					if (!currentOpen && openOnArrowKeyDown) openOnNavigationKeyDown(event);
					else commonOnKeyDown(event);
					if (currentOpen) onNavigate(event);
				}
			},
			onFocus(event) {
				if (store.select("open") && !virtual) {
					indexRef.current = -1;
					onNavigate(event);
				}
			},
			onPointerDown: checkVirtualPointer,
			onPointerEnter: checkVirtualPointer,
			onMouseDown: checkVirtualMouse,
			onClick: checkVirtualMouse
		};
	}, [
		commonOnKeyDown,
		focusItemOnOpen,
		getMinEnabledIndex,
		nested,
		onNavigate,
		store,
		openOnArrowKeyDown,
		orientation,
		getParentOrientation,
		rtl,
		selectedIndexRef,
		virtual
	]);
	const reference = import_react.useMemo(() => {
		return {
			...ariaActiveDescendantProp,
			...trigger
		};
	}, [ariaActiveDescendantProp, trigger]);
	return import_react.useMemo(() => enabled ? {
		reference,
		floating,
		item,
		trigger
	} : {}, [
		enabled,
		reference,
		floating,
		trigger,
		item
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useTypeahead.mjs
/**
* Provides a matching callback that can be used to focus an item as the user
* types, often used in tandem with `useListNavigation()`.
* @see https://floating-ui.com/docs/useTypeahead
*/
function useTypeahead(context, props) {
	const { listRef, elementsRef, activeIndex, onMatch: onMatchProp, disabledIndices, onTyping, enabled = true, resetMs = 750, selectedIndex = null } = props;
	const store = "rootStore" in context ? context.rootStore : context;
	const open = store.useState("open");
	const timeout = useTimeout();
	const stringRef = import_react.useRef("");
	const prevIndexRef = import_react.useRef(selectedIndex ?? activeIndex ?? -1);
	const matchIndexRef = import_react.useRef(null);
	const onKeyDown = useStableCallback((event) => {
		function getElement(index) {
			return elementsRef?.current[index];
		}
		function isItemAvailable(index) {
			const element = getElement(index);
			if (element && !isElementVisible(element) || element?.matches(":disabled")) return false;
			return disabledIndices == null || !isListIndexDisabled(EMPTY_ARRAY, index, disabledIndices);
		}
		function getMatchingIndex(list, string, startIndex = 0) {
			if (list.length === 0) return -1;
			const normalizedStartIndex = (startIndex % list.length + list.length) % list.length;
			const lowerString = string.toLowerCase();
			for (let offset = 0; offset < list.length; offset += 1) {
				const index = (normalizedStartIndex + offset) % list.length;
				if (!list[index]?.toLowerCase().startsWith(lowerString) || !isItemAvailable(index)) continue;
				return index;
			}
			return -1;
		}
		const listContent = listRef.current;
		if (stringRef.current.length > 0 && event.key === " ") {
			stopEvent(event);
			onTyping?.(true);
		}
		if (stringRef.current.length > 0 && stringRef.current[0] !== " ") {
			if (getMatchingIndex(listContent, stringRef.current) === -1 && event.key !== " ") onTyping?.(false);
		}
		if (listContent == null || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
		if (open && event.key !== " ") {
			stopEvent(event);
			onTyping?.(true);
		}
		const isNewSession = stringRef.current === "";
		if (isNewSession) prevIndexRef.current = selectedIndex ?? activeIndex ?? -1;
		if (listContent.every((text, index) => text && isItemAvailable(index) ? text[0]?.toLowerCase() !== text[1]?.toLowerCase() : true) && stringRef.current === event.key) {
			stringRef.current = "";
			prevIndexRef.current = matchIndexRef.current;
		}
		stringRef.current += event.key;
		timeout.start(resetMs, () => {
			stringRef.current = "";
			prevIndexRef.current = matchIndexRef.current;
			onTyping?.(false);
		});
		const startIndex = ((isNewSession ? selectedIndex ?? activeIndex ?? -1 : prevIndexRef.current) ?? 0) + 1;
		const index = getMatchingIndex(listContent, stringRef.current, startIndex);
		if (index !== -1) {
			onMatchProp?.(index);
			matchIndexRef.current = index;
		} else if (event.key !== " ") {
			stringRef.current = "";
			onTyping?.(false);
		}
	});
	const onBlur = useStableCallback((event) => {
		const next = event.relatedTarget;
		const currentDomReferenceElement = store.select("domReferenceElement");
		const currentFloatingElement = store.select("floatingElement");
		if (contains(currentDomReferenceElement, next) || contains(currentFloatingElement, next)) return;
		timeout.clear();
		stringRef.current = "";
		prevIndexRef.current = matchIndexRef.current;
		onTyping?.(false);
	});
	useIsoLayoutEffect(() => {
		if (!open && selectedIndex !== null) return;
		timeout.clear();
		matchIndexRef.current = null;
		if (stringRef.current !== "") stringRef.current = "";
	}, [
		open,
		selectedIndex,
		timeout
	]);
	const sharedProps = import_react.useMemo(() => ({
		onKeyDown,
		onBlur
	}), [onKeyDown, onBlur]);
	return import_react.useMemo(() => enabled ? {
		reference: sharedProps,
		floating: sharedProps
	} : {}, [enabled, sharedProps]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/safePolygon.mjs
var CURSOR_SPEED_THRESHOLD = .1;
var CURSOR_SPEED_THRESHOLD_SQUARED = CURSOR_SPEED_THRESHOLD * CURSOR_SPEED_THRESHOLD;
var POLYGON_BUFFER = .5;
function hasIntersectingEdge(pointX, pointY, xi, yi, xj, yj) {
	return yi >= pointY !== yj >= pointY && pointX <= (xj - xi) * (pointY - yi) / (yj - yi) + xi;
}
function isPointInQuadrilateral(pointX, pointY, x1, y1, x2, y2, x3, y3, x4, y4) {
	let isInsideValue = false;
	if (hasIntersectingEdge(pointX, pointY, x1, y1, x2, y2)) isInsideValue = !isInsideValue;
	if (hasIntersectingEdge(pointX, pointY, x2, y2, x3, y3)) isInsideValue = !isInsideValue;
	if (hasIntersectingEdge(pointX, pointY, x3, y3, x4, y4)) isInsideValue = !isInsideValue;
	if (hasIntersectingEdge(pointX, pointY, x4, y4, x1, y1)) isInsideValue = !isInsideValue;
	return isInsideValue;
}
function isInsideRect(pointX, pointY, rect) {
	return pointX >= rect.x && pointX <= rect.x + rect.width && pointY >= rect.y && pointY <= rect.y + rect.height;
}
function isInsideAxisAlignedRect(pointX, pointY, x1, y1, x2, y2) {
	return pointX >= Math.min(x1, x2) && pointX <= Math.max(x1, x2) && pointY >= Math.min(y1, y2) && pointY <= Math.max(y1, y2);
}
/**
* Generates a safe polygon area that the user can traverse without closing the
* floating element once leaving the reference element.
* @see https://floating-ui.com/docs/useHover#safepolygon
*/
function safePolygon(options = {}) {
	const { blockPointerEvents = false } = options;
	const timeout = new Timeout();
	const fn = ({ x, y, placement, elements, onClose, nodeId, tree }) => {
		const side = placement?.split("-")[0];
		let hasLanded = false;
		let lastX = null;
		let lastY = null;
		let lastCursorTime = typeof performance !== "undefined" ? performance.now() : 0;
		function isCursorMovingSlowly(nextX, nextY) {
			const currentTime = performance.now();
			const elapsedTime = currentTime - lastCursorTime;
			if (lastX === null || lastY === null || elapsedTime === 0) {
				lastX = nextX;
				lastY = nextY;
				lastCursorTime = currentTime;
				return false;
			}
			const deltaX = nextX - lastX;
			const deltaY = nextY - lastY;
			const distanceSquared = deltaX * deltaX + deltaY * deltaY;
			const thresholdSquared = elapsedTime * elapsedTime * CURSOR_SPEED_THRESHOLD_SQUARED;
			lastX = nextX;
			lastY = nextY;
			lastCursorTime = currentTime;
			return distanceSquared < thresholdSquared;
		}
		function close() {
			timeout.clear();
			onClose();
		}
		return function onMouseMove(event) {
			timeout.clear();
			const domReference = elements.domReference;
			const floating = elements.floating;
			if (!domReference || !floating || side == null || x == null || y == null) return;
			const { clientX, clientY } = event;
			const target = getTarget(event);
			const isLeave = event.type === "mouseleave";
			const isOverFloatingEl = contains(floating, target);
			const isOverReferenceEl = contains(domReference, target);
			if (isOverFloatingEl) {
				hasLanded = true;
				if (!isLeave) return;
			}
			if (isOverReferenceEl) {
				hasLanded = false;
				if (!isLeave) {
					hasLanded = true;
					return;
				}
			}
			if (isLeave && isElement(event.relatedTarget) && contains(floating, event.relatedTarget)) return;
			function hasOpenChildNode() {
				return Boolean(tree && getNodeChildren(tree.nodesRef.current, nodeId).length > 0);
			}
			function closeIfNoOpenChild() {
				if (!hasOpenChildNode()) close();
			}
			if (hasOpenChildNode()) return;
			const refRect = domReference.getBoundingClientRect();
			const rect = floating.getBoundingClientRect();
			const cursorLeaveFromRight = x > rect.right - rect.width / 2;
			const cursorLeaveFromBottom = y > rect.bottom - rect.height / 2;
			const isFloatingWider = rect.width > refRect.width;
			const isFloatingTaller = rect.height > refRect.height;
			const left = (isFloatingWider ? refRect : rect).left;
			const right = (isFloatingWider ? refRect : rect).right;
			const top = (isFloatingTaller ? refRect : rect).top;
			const bottom = (isFloatingTaller ? refRect : rect).bottom;
			if (side === "top" && y >= refRect.bottom - 1 || side === "bottom" && y <= refRect.top + 1 || side === "left" && x >= refRect.right - 1 || side === "right" && x <= refRect.left + 1) {
				closeIfNoOpenChild();
				return;
			}
			let isInsideTroughRect = false;
			switch (side) {
				case "top":
					isInsideTroughRect = isInsideAxisAlignedRect(clientX, clientY, left, refRect.top + 1, right, rect.bottom - 1);
					break;
				case "bottom":
					isInsideTroughRect = isInsideAxisAlignedRect(clientX, clientY, left, rect.top + 1, right, refRect.bottom - 1);
					break;
				case "left":
					isInsideTroughRect = isInsideAxisAlignedRect(clientX, clientY, rect.right - 1, bottom, refRect.left + 1, top);
					break;
				case "right": isInsideTroughRect = isInsideAxisAlignedRect(clientX, clientY, refRect.right - 1, bottom, rect.left + 1, top);
			}
			if (isInsideTroughRect) return;
			if (hasLanded && !isInsideRect(clientX, clientY, refRect)) {
				closeIfNoOpenChild();
				return;
			}
			if (!isLeave && isCursorMovingSlowly(clientX, clientY)) {
				closeIfNoOpenChild();
				return;
			}
			let isInsidePolygon = false;
			switch (side) {
				case "top": {
					const cursorXOffset = isFloatingWider ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
					const cursorPointOneX = isFloatingWider ? x + cursorXOffset : cursorLeaveFromRight ? x + cursorXOffset : x - cursorXOffset;
					const cursorPointTwoX = isFloatingWider ? x - cursorXOffset : cursorLeaveFromRight ? x + cursorXOffset : x - cursorXOffset;
					const cursorPointY = y + POLYGON_BUFFER + 1;
					const commonYLeft = cursorLeaveFromRight ? rect.bottom - POLYGON_BUFFER : isFloatingWider ? rect.bottom - POLYGON_BUFFER : rect.top;
					const commonYRight = cursorLeaveFromRight ? isFloatingWider ? rect.bottom - POLYGON_BUFFER : rect.top : rect.bottom - POLYGON_BUFFER;
					isInsidePolygon = isPointInQuadrilateral(clientX, clientY, cursorPointOneX, cursorPointY, cursorPointTwoX, cursorPointY, rect.left, commonYLeft, rect.right, commonYRight);
					break;
				}
				case "bottom": {
					const cursorXOffset = isFloatingWider ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
					const cursorPointOneX = isFloatingWider ? x + cursorXOffset : cursorLeaveFromRight ? x + cursorXOffset : x - cursorXOffset;
					const cursorPointTwoX = isFloatingWider ? x - cursorXOffset : cursorLeaveFromRight ? x + cursorXOffset : x - cursorXOffset;
					const cursorPointY = y - POLYGON_BUFFER;
					const commonYLeft = cursorLeaveFromRight ? rect.top + POLYGON_BUFFER : isFloatingWider ? rect.top + POLYGON_BUFFER : rect.bottom;
					const commonYRight = cursorLeaveFromRight ? isFloatingWider ? rect.top + POLYGON_BUFFER : rect.bottom : rect.top + POLYGON_BUFFER;
					isInsidePolygon = isPointInQuadrilateral(clientX, clientY, cursorPointOneX, cursorPointY, cursorPointTwoX, cursorPointY, rect.left, commonYLeft, rect.right, commonYRight);
					break;
				}
				case "left": {
					const cursorYOffset = isFloatingTaller ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
					const cursorPointOneY = isFloatingTaller ? y + cursorYOffset : cursorLeaveFromBottom ? y + cursorYOffset : y - cursorYOffset;
					const cursorPointTwoY = isFloatingTaller ? y - cursorYOffset : cursorLeaveFromBottom ? y + cursorYOffset : y - cursorYOffset;
					const cursorPointX = x + POLYGON_BUFFER + 1;
					const commonXTop = cursorLeaveFromBottom ? rect.right - POLYGON_BUFFER : isFloatingTaller ? rect.right - POLYGON_BUFFER : rect.left;
					const commonXBottom = cursorLeaveFromBottom ? isFloatingTaller ? rect.right - POLYGON_BUFFER : rect.left : rect.right - POLYGON_BUFFER;
					isInsidePolygon = isPointInQuadrilateral(clientX, clientY, commonXTop, rect.top, commonXBottom, rect.bottom, cursorPointX, cursorPointOneY, cursorPointX, cursorPointTwoY);
					break;
				}
				case "right": {
					const cursorYOffset = isFloatingTaller ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
					const cursorPointOneY = isFloatingTaller ? y + cursorYOffset : cursorLeaveFromBottom ? y + cursorYOffset : y - cursorYOffset;
					const cursorPointTwoY = isFloatingTaller ? y - cursorYOffset : cursorLeaveFromBottom ? y + cursorYOffset : y - cursorYOffset;
					const cursorPointX = x - POLYGON_BUFFER;
					const commonXTop = cursorLeaveFromBottom ? rect.left + POLYGON_BUFFER : isFloatingTaller ? rect.left + POLYGON_BUFFER : rect.right;
					const commonXBottom = cursorLeaveFromBottom ? isFloatingTaller ? rect.left + POLYGON_BUFFER : rect.right : rect.left + POLYGON_BUFFER;
					isInsidePolygon = isPointInQuadrilateral(clientX, clientY, cursorPointX, cursorPointOneY, cursorPointX, cursorPointTwoY, commonXTop, rect.top, commonXBottom, rect.bottom);
					break;
				}
			}
			if (!isInsidePolygon) closeIfNoOpenChild();
			else if (!hasLanded) timeout.start(40, closeIfNoOpenChild);
		};
	};
	fn.__options = {
		...options,
		blockPointerEvents
	};
	return fn;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/store/TooltipStore.mjs
var selectors$5 = {
	...popupStoreSelectors,
	disabled: (state) => state.disabled,
	instantType: (state) => state.instantType,
	isInstantPhase: (state) => state.isInstantPhase,
	trackCursorAxis: (state) => state.trackCursorAxis,
	disableHoverablePopup: (state) => state.disableHoverablePopup,
	lastOpenChangeReason: (state) => state.openChangeReason,
	closeOnClick: (state) => state.closeOnClick,
	closeDelay: (state) => state.closeDelay,
	adaptiveOrigin: (state) => state.adaptiveOrigin
};
/**
* The store view that detached handle-backed triggers read from. Both the real `TooltipStore` and
* the inert fallback store satisfy it, so a trigger can read from whichever store the handle
* currently exposes. Narrowed to the members a trigger actually uses — the trigger-data members plus
* `setOpen`/`cancelPendingOpen` (called directly by the trigger) and `useSyncedValue` — so the
* exposed surface can't bypass the open-change pipeline; on the detached fallback store every one of
* these mutations is a no-op.
*/
var TooltipStore = class extends ReactStore {
	constructor(initialState, floatingId, nested) {
		const triggerElements = new PopupTriggerMap();
		super(createInitialState$3(initialState, triggerElements, floatingId, nested), createInitialContext$3(triggerElements), selectors$5);
	}
	setOpen = (nextOpen, eventDetails) => {
		applyPopupOpenChange(this, nextOpen, eventDetails, { extraState: { openChangeReason: eventDetails.reason } });
	};
	cancelPendingOpen(event) {
		this.state.floatingRootContext.dispatchOpenChange(false, createChangeEventDetails(triggerPress, event));
	}
};
function createInitialState$3(initialState, triggerElements, floatingId, nested = false) {
	return {
		...createInitialPopupStoreState(triggerElements, floatingId, nested),
		disabled: false,
		instantType: void 0,
		isInstantPhase: false,
		trackCursorAxis: "none",
		disableHoverablePopup: false,
		openChangeReason: null,
		closeOnClick: true,
		closeDelay: 0,
		adaptiveOrigin: void 0,
		...initialState
	};
}
function createInitialContext$3(triggerElements) {
	return {
		popupRef: /*#__PURE__*/ import_react.createRef(),
		onOpenChange: void 0,
		onOpenChangeComplete: void 0,
		triggerElements
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/root/TooltipRoot.mjs
/**
* Groups all parts of the tooltip.
* Doesn't render its own HTML element.
*
* Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
*/
var TooltipRoot = fastComponent(function TooltipRoot(props) {
	const { disabled: disabled$1 = false, defaultOpen = false, open: openProp, disableHoverablePopup = false, trackCursorAxis = "none", actionsRef, onOpenChange, onOpenChangeComplete, handle, triggerId: triggerIdProp, defaultTriggerId: defaultTriggerIdProp = null, children } = props;
	const store = usePopupRootStore((floatingId, nested) => new TooltipStore({
		open: defaultOpen,
		openProp,
		activeTriggerId: defaultTriggerIdProp,
		triggerIdProp
	}, floatingId, nested));
	store.useControlledProp("openProp", openProp);
	store.useControlledProp("triggerIdProp", triggerIdProp);
	store.useContextCallback("onOpenChange", onOpenChange);
	store.useContextCallback("onOpenChangeComplete", onOpenChangeComplete);
	const openState = store.useState("open");
	const open = !disabled$1 && openState;
	const activeTriggerId = store.useState("activeTriggerId");
	const mounted = store.useState("mounted");
	const payload = store.useState("payload");
	store.useSyncedValues({
		trackCursorAxis,
		disableHoverablePopup,
		disabled: disabled$1
	});
	useImplicitActiveTrigger(store, { closeOnActiveTriggerUnmount: true });
	const { forceUnmount, transitionStatus } = useOpenStateTransitions(open, store);
	const isInstantPhase = store.useState("isInstantPhase");
	const instantType = store.useState("instantType");
	const lastOpenChangeReason = store.useState("lastOpenChangeReason");
	const previousInstantTypeRef = import_react.useRef(null);
	useIsoLayoutEffect(() => {
		if (openState && disabled$1) store.setOpen(false, createChangeEventDetails(disabled));
	}, [
		openState,
		disabled$1,
		store
	]);
	useIsoLayoutEffect(() => {
		if (transitionStatus === "ending" && lastOpenChangeReason === "none" || transitionStatus !== "ending" && isInstantPhase) {
			if (instantType !== "delay") previousInstantTypeRef.current = instantType;
			store.set("instantType", "delay");
		} else if (previousInstantTypeRef.current !== null) {
			store.set("instantType", previousInstantTypeRef.current);
			previousInstantTypeRef.current = null;
		}
	}, [
		transitionStatus,
		isInstantPhase,
		lastOpenChangeReason,
		instantType,
		store
	]);
	useIsoLayoutEffect(() => {
		if (open) {
			if (activeTriggerId == null) store.set("payload", void 0);
		}
	}, [
		store,
		activeTriggerId,
		open
	]);
	import_react.useImperativeHandle(actionsRef, () => ({
		unmount: forceUnmount,
		close: () => store.setOpen(false, createChangeEventDetails(imperativeAction))
	}), [forceUnmount, store]);
	const shouldRenderInteractions = open || mounted || !disabled$1 && trackCursorAxis !== "none";
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(TooltipRootContext.Provider, {
		value: store,
		children: [
			handle && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(PopupHandleAttachment, {
				handle,
				store
			}),
			shouldRenderInteractions && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(TooltipInteractions, {
				store,
				disabled: disabled$1,
				trackCursorAxis
			}),
			typeof children === "function" ? children({ payload }) : children
		]
	});
});
function TooltipInteractions({ store, disabled, trackCursorAxis }) {
	const floatingRootContext = store.useState("floatingRootContext");
	const dismiss = useDismiss(floatingRootContext, {
		enabled: !disabled,
		referencePress: () => store.select("closeOnClick")
	});
	const clientPoint = useClientPoint(floatingRootContext, {
		enabled: !disabled && trackCursorAxis !== "none",
		axis: trackCursorAxis === "none" ? void 0 : trackCursorAxis
	});
	const triggerProps = import_react.useMemo(() => mergeProps(clientPoint.reference, dismiss.reference), [clientPoint.reference, dismiss.reference]);
	usePopupInteractionProps(store, {
		activeTriggerProps: triggerProps,
		inactiveTriggerProps: triggerProps,
		popupProps: dismiss.floating ?? EMPTY_OBJECT
	});
	return null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/provider/TooltipProviderContext.mjs
/**
* Holds the provider's `delay` value. `closeDelay` is handled by the delay group.
*/
var TooltipProviderContext = /*#__PURE__*/ import_react.createContext(void 0);
function useTooltipProviderContext() {
	return import_react.useContext(TooltipProviderContext);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/trigger/TooltipTrigger.mjs
var TOOLTIP_TRIGGER_IDENTIFIER = "data-base-ui-tooltip-trigger";
function getTargetElement(event) {
	if ("composedPath" in event) {
		const path = event.composedPath();
		for (let i = 0; i < path.length; i += 1) {
			const element = path[i];
			if (isElement(element)) return element;
		}
	}
	const target = event.target;
	if (isElement(target)) return target;
	return null;
}
function closestEnabledTooltipTrigger(element) {
	let current = element;
	while (current) {
		const trigger = current.closest(`[${TOOLTIP_TRIGGER_IDENTIFIER}]`);
		if (trigger) return trigger;
		const root = current.getRootNode();
		current = "host" in root && isElement(root.host) ? root.host : null;
	}
	return null;
}
/**
* An element to attach the tooltip to.
* Renders a `<button>` element.
*
* Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
*/
var TooltipTrigger = fastComponentRef(function TooltipTrigger(componentProps, forwardedRef) {
	const { render, className, style, handle, payload, disabled: disabledProp, delay, closeOnClick = true, closeDelay, id: idProp, ...elementProps } = componentProps;
	const rootContext = useTooltipRootContext(true);
	const store = usePopupHandleStore(handle) ?? rootContext;
	if (!store) throw new Error(formatErrorMessage(82));
	const thisTriggerId = useBaseUiId(idProp);
	const isTriggerActive = store.useState("isTriggerActive", thisTriggerId);
	const isOpenedByThisTrigger = store.useState("isOpenedByTrigger", thisTriggerId);
	const floatingRootContext = store.useState("floatingRootContext");
	const triggerElementRef = import_react.useRef(null);
	const closeDelayWithDefault = closeDelay ?? 0;
	const { registerTrigger, isMountedByThisTrigger } = useTriggerDataForwarding(thisTriggerId, triggerElementRef, store, {
		payload,
		closeOnClick,
		closeDelay: closeDelayWithDefault
	});
	const providerDelay = useTooltipProviderContext();
	const { activeIdRef, delayRef, isInstantPhase, hasProvider } = useDelayGroup(floatingRootContext, { open: isOpenedByThisTrigger });
	const hoverInteraction = useHoverInteractionSharedState(floatingRootContext);
	store.useSyncedValue("isInstantPhase", isInstantPhase);
	const rootDisabled = store.useState("disabled");
	const disabled = disabledProp ?? rootDisabled;
	const disabledRef = useValueAsRef(disabled);
	const trackCursorAxis = store.useState("trackCursorAxis");
	const disableHoverablePopup = store.useState("disableHoverablePopup");
	const isNestedTriggerHoveredRef = import_react.useRef(false);
	const nestedTriggerOpenTimeout = useTimeout();
	const pointerTypeRef = import_react.useRef(void 0);
	function getOpenDelay() {
		if (hasProvider && activeIdRef.current != null) return 0;
		return delay ?? providerDelay ?? 600;
	}
	function isEnabledNestedTriggerTarget(target) {
		const triggerEl = triggerElementRef.current;
		if (!triggerEl || !target) return false;
		const nearestTrigger = closestEnabledTooltipTrigger(target);
		return nearestTrigger !== null && nearestTrigger !== triggerEl && contains(triggerEl, nearestTrigger);
	}
	function detectNestedTriggerHover(target) {
		const nestedTriggerHovered = isEnabledNestedTriggerTarget(target);
		isNestedTriggerHoveredRef.current = nestedTriggerHovered;
		if (nestedTriggerHovered) {
			hoverInteraction.openChangeTimeout.clear();
			hoverInteraction.restTimeout.clear();
			hoverInteraction.restTimeoutPending = false;
			nestedTriggerOpenTimeout.clear();
		}
		return nestedTriggerHovered;
	}
	const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
		enabled: !disabled,
		mouseOnly: true,
		move: false,
		handleClose: !disableHoverablePopup && trackCursorAxis !== "both" ? safePolygon() : null,
		restMs: getOpenDelay,
		delay() {
			if (closeDelay == null && hasProvider) return { close: getDelay(delayRef.current, "close") };
			return { close: closeDelayWithDefault };
		},
		triggerElementRef,
		isActiveTrigger: isTriggerActive,
		isClosing: () => store.select("transitionStatus") === "ending",
		shouldOpen() {
			return !isNestedTriggerHoveredRef.current;
		}
	});
	const focusProps = useFocus(floatingRootContext, { enabled: !disabled }).reference;
	const handleNestedTriggerHover = (event) => {
		const wasNestedTriggerHovered = isNestedTriggerHoveredRef.current;
		const target = getTargetElement(event);
		const nestedTriggerHovered = detectNestedTriggerHover(target);
		const triggerEl = triggerElementRef.current;
		const targetInsideTrigger = triggerEl && target && contains(triggerEl, target);
		if (nestedTriggerHovered && store.select("open") && store.select("lastOpenChangeReason") === "trigger-hover") {
			store.setOpen(false, createChangeEventDetails(triggerHover, event));
			return;
		}
		if (wasNestedTriggerHovered && !nestedTriggerHovered && targetInsideTrigger && !disabledRef.current && !store.select("open") && triggerEl && isMouseLikePointerType(pointerTypeRef.current)) {
			const open = () => {
				if (!isNestedTriggerHoveredRef.current && !disabledRef.current && !store.select("open")) store.setOpen(true, createChangeEventDetails(triggerHover, event, triggerEl));
			};
			const openDelay = getOpenDelay();
			if (openDelay === 0) {
				nestedTriggerOpenTimeout.clear();
				open();
			} else nestedTriggerOpenTimeout.start(openDelay, open);
		}
	};
	const rootTriggerProps = store.useState("triggerProps", isMountedByThisTrigger);
	return useRenderElement("button", componentProps, {
		state: { open: isOpenedByThisTrigger },
		ref: [
			forwardedRef,
			registerTrigger,
			triggerElementRef
		],
		props: [
			hoverProps,
			focusProps,
			isMountedByThisTrigger || trackCursorAxis !== "none" ? rootTriggerProps : void 0,
			{
				onMouseOver(event) {
					handleNestedTriggerHover(event.nativeEvent);
				},
				onFocus(event) {
					if (isEnabledNestedTriggerTarget(getTargetElement(event.nativeEvent))) event.preventBaseUIHandler();
				},
				onMouseLeave() {
					isNestedTriggerHoveredRef.current = false;
					nestedTriggerOpenTimeout.clear();
					pointerTypeRef.current = void 0;
				},
				onPointerEnter(event) {
					pointerTypeRef.current = event.pointerType;
				},
				onPointerDown(event) {
					pointerTypeRef.current = event.pointerType;
					store.set("closeOnClick", closeOnClick);
					if (closeOnClick && !store.select("open")) store.cancelPendingOpen(event.nativeEvent);
				},
				onClick(event) {
					if (closeOnClick && !store.select("open")) store.cancelPendingOpen(event.nativeEvent);
				},
				id: thisTriggerId,
				[triggerDisabled]: disabled ? "" : void 0,
				[TOOLTIP_TRIGGER_IDENTIFIER]: disabled ? void 0 : ""
			},
			elementProps
		],
		stateAttributesMapping: triggerOpenStateMapping
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/portal/TooltipPortalContext.mjs
var TooltipPortalContext = /*#__PURE__*/ import_react.createContext(void 0);
function useTooltipPortalContext() {
	const value = import_react.useContext(TooltipPortalContext);
	if (value === void 0) throw new Error(formatErrorMessage(70));
	return value;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/FloatingPortalLite.mjs
/**
* `FloatingPortal` includes tabbable logic handling for focus management.
* For components that don't need tabbable logic, use `FloatingPortalLite`.
* @internal
*/
var FloatingPortalLite = /*#__PURE__*/ import_react.forwardRef(function FloatingPortalLite(componentProps, forwardedRef) {
	const { children, container, className, render, style, ...elementProps } = componentProps;
	const { node: portalNode, subtree: portalSubtree } = useFloatingPortalNode({
		container,
		ref: forwardedRef,
		componentProps,
		elementProps
	});
	if (!portalSubtree && !portalNode) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [portalSubtree, portalNode && /*#__PURE__*/ import_react_dom.createPortal(children, portalNode)] });
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/portal/TooltipPortal.mjs
/**
* A portal element that moves the popup to a different part of the DOM.
* By default, the portal element is appended to `<body>`.
* Renders a `<div>` element.
*
* Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
*/
var TooltipPortal = /*#__PURE__*/ import_react.forwardRef(function TooltipPortal(props, forwardedRef) {
	const { keepMounted = false, ...portalProps } = props;
	if (!(useTooltipRootContext().useState("mounted") || keepMounted)) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(TooltipPortalContext.Provider, {
		value: keepMounted,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingPortalLite, {
			ref: forwardedRef,
			...portalProps
		})
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/positioner/TooltipPositionerContext.mjs
var TooltipPositionerContext = /*#__PURE__*/ import_react.createContext(void 0);
function useTooltipPositionerContext() {
	const context = import_react.useContext(TooltipPositionerContext);
	if (context === void 0) throw new Error(formatErrorMessage(71));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/direction-context/DirectionContext.mjs
var DirectionContext = /*#__PURE__*/ import_react.createContext(void 0);
function useDirection() {
	return import_react.useContext(DirectionContext)?.direction ?? "ltr";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/middleware/arrow.mjs
/**
* Fork of the original `arrow` middleware from Floating UI that allows
* configuring the offset parent.
*/
var baseArrow = (options) => ({
	name: "arrow",
	options,
	async fn(state) {
		const { x, y, placement, rects, platform, elements, middlewareData } = state;
		const { element, padding = 0, offsetParent = "real" } = evaluate(options, state) || {};
		if (element == null) return {};
		const paddingObject = getPaddingObject(padding);
		const coords = {
			x,
			y
		};
		const axis = getAlignmentAxis(placement);
		const length = getAxisLength(axis);
		const arrowDimensions = await platform.getDimensions(element);
		const isYAxis = axis === "y";
		const minProp = isYAxis ? "top" : "left";
		const maxProp = isYAxis ? "bottom" : "right";
		const clientProp = isYAxis ? "clientHeight" : "clientWidth";
		const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
		const startDiff = coords[axis] - rects.reference[axis];
		const arrowOffsetParent = offsetParent === "real" ? await platform.getOffsetParent?.(element) : elements.floating;
		let clientSize = elements.floating[clientProp] || rects.floating[length];
		if (!clientSize || !await platform.isElement?.(arrowOffsetParent)) clientSize = elements.floating[clientProp] || rects.floating[length];
		const centerToReference = endDiff / 2 - startDiff / 2;
		const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
		const minPadding = Math.min(paddingObject[minProp], largestPossiblePadding);
		const maxPadding = Math.min(paddingObject[maxProp], largestPossiblePadding);
		const min = minPadding;
		const max = clientSize - arrowDimensions[length] - maxPadding;
		const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
		const offset = clamp$1(min, center, max);
		const shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset && rects.reference[length] / 2 - (center < min ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
		const alignmentOffset = shouldAddOffset ? center < min ? center - min : center - max : 0;
		return {
			[axis]: coords[axis] + alignmentOffset,
			data: {
				[axis]: offset,
				centerOffset: center - offset - alignmentOffset,
				...shouldAddOffset && { alignmentOffset }
			},
			reset: shouldAddOffset
		};
	}
});
/**
* Provides data to position an inner element of the floating element so that it
* appears centered to the reference element.
* This wraps the core `arrow` middleware to allow React refs as the element.
* @see https://floating-ui.com/docs/arrow
*/
var arrow = (options, deps) => {
	const { name, fn } = baseArrow(options);
	return {
		name,
		fn,
		options: [options, deps]
	};
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/hideMiddleware.mjs
var hide = {
	name: "hide",
	async fn(state) {
		const { width, height, x, y } = state.rects.reference;
		const anchorHidden = width === 0 && height === 0 && x === 0 && y === 0;
		const overflow = await state.platform.detectOverflow(state, { elementContext: "reference" });
		return { data: { referenceHidden: overflow.top - height >= 0 || overflow.right - width >= 0 || overflow.bottom - height >= 0 || overflow.left - width >= 0 || anchorHidden } };
	}
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/adaptiveOriginConstants.mjs
var DEFAULT_SIDES = {
	sideX: "left",
	sideY: "top"
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/CommonPositionerCssVars.mjs
/**
* The available width between the trigger and the edge of the viewport.
* @type {number}
*/
var availableWidth = "--available-width";
/**
* The available height between the trigger and the edge of the viewport.
* @type {number}
*/
var availableHeight = "--available-height";
/**
* The anchor's width.
* @type {number}
*/
var anchorWidth = "--anchor-width";
/**
* The anchor's height.
* @type {number}
*/
var anchorHeight = "--anchor-height";
/**
* The coordinates that this element is anchored to. Used for animations and transitions.
* @type {string}
*/
var transformOrigin$1 = "--transform-origin";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useAnchorPositioning.mjs
var AVAILABLE_WIDTH_VAR = availableWidth;
var AVAILABLE_HEIGHT_VAR = availableHeight;
function getLogicalSide(sideParam, renderedSide, isRtl) {
	const isLogicalSideParam = sideParam === "inline-start" || sideParam === "inline-end";
	return {
		top: "top",
		right: isLogicalSideParam ? isRtl ? "inline-start" : "inline-end" : "right",
		bottom: "bottom",
		left: isLogicalSideParam ? isRtl ? "inline-end" : "inline-start" : "left"
	}[renderedSide];
}
function getOffsetData(state, sideParam, isRtl) {
	const { rects, placement } = state;
	return {
		side: getLogicalSide(sideParam, getSide(placement), isRtl),
		align: getAlignment(placement) || "center",
		anchor: {
			width: rects.reference.width,
			height: rects.reference.height
		},
		positioner: {
			width: rects.floating.width,
			height: rects.floating.height
		}
	};
}
/**
* Provides standardized anchor positioning behavior for floating elements. Wraps Floating UI's
* `useFloating` hook.
*/
function useAnchorPositioning(params) {
	return useAnchorPositioningWithHook(params, useBaseUIFloating);
}
function useAnchorPositioningWithHook(params, useFloatingHook) {
	const { anchor, positionMethod = "absolute", side: sideParam = "bottom", sideOffset = 0, align = "center", alignOffset = 0, collisionBoundary, collisionPadding: collisionPaddingParam = 5, sticky = false, arrowPadding = 5, disableAnchorTracking = false, inline: inlineMiddleware, keepMounted = false, floatingRootContext, mounted, collisionAvoidance, shift: shift$3, nodeId, adaptiveOrigin, lazyFlip = false, externalTree } = params;
	const [mountSide, setMountSide] = import_react.useState(null);
	if (!mounted && mountSide !== null) setMountSide(null);
	const collisionAvoidanceSide = collisionAvoidance.side || "flip";
	const collisionAvoidanceAlign = collisionAvoidance.align || "flip";
	const collisionAvoidanceFallbackAxisSide = collisionAvoidance.fallbackAxisSide || "end";
	const shiftCrossAxis = shift$3?.crossAxis ?? false;
	const shiftRootBoundary = shift$3?.rootBoundary;
	const anchorFn = typeof anchor === "function" ? anchor : void 0;
	const anchorFnCallback = useStableCallback(anchorFn);
	const anchorDep = anchorFn ? anchorFnCallback : anchor;
	const anchorValueRef = useValueAsRef(anchor);
	const mountedRef = useValueAsRef(mounted);
	const isRtl = useDirection() === "rtl";
	const side = mountSide || {
		top: "top",
		right: "right",
		bottom: "bottom",
		left: "left",
		"inline-end": isRtl ? "left" : "right",
		"inline-start": isRtl ? "right" : "left"
	}[sideParam];
	const placement = align === "center" ? side : `${side}-${align}`;
	let collisionPadding = collisionPaddingParam;
	if (typeof collisionPadding === "number") collisionPadding = {
		top: collisionPadding,
		right: collisionPadding,
		bottom: collisionPadding,
		left: collisionPadding
	};
	else if (collisionPadding) collisionPadding = {
		top: collisionPadding.top || 0,
		right: collisionPadding.right || 0,
		bottom: collisionPadding.bottom || 0,
		left: collisionPadding.left || 0
	};
	const bias = 1;
	const biasTop = sideParam === "bottom" ? bias : 0;
	const biasBottom = sideParam === "top" ? bias : 0;
	const biasLeft = sideParam === "right" ? bias : 0;
	const biasRight = sideParam === "left" ? bias : 0;
	const commonCollisionProps = {
		boundary: collisionBoundary === "clipping-ancestors" ? "clippingAncestors" : collisionBoundary,
		padding: collisionPadding
	};
	const arrowRef = import_react.useRef(null);
	const sideOffsetRef = useValueAsRef(sideOffset);
	const alignOffsetRef = useValueAsRef(alignOffset);
	const sideOffsetDep = typeof sideOffset !== "function" ? sideOffset : 0;
	const alignOffsetDep = typeof alignOffset !== "function" ? alignOffset : 0;
	const middleware = [];
	if (inlineMiddleware) middleware.push(inlineMiddleware);
	middleware.push(offset((state) => {
		const data = getOffsetData(state, sideParam, isRtl);
		const sideAxis = typeof sideOffsetRef.current === "function" ? sideOffsetRef.current(data) : sideOffsetRef.current;
		const alignAxis = typeof alignOffsetRef.current === "function" ? alignOffsetRef.current(data) : alignOffsetRef.current;
		return {
			mainAxis: sideAxis,
			crossAxis: alignAxis,
			alignmentAxis: alignAxis
		};
	}, [
		sideOffsetDep,
		alignOffsetDep,
		isRtl,
		sideParam
	]));
	const shiftDisabled = collisionAvoidanceAlign === "none" && collisionAvoidanceSide !== "shift";
	const crossAxisShiftEnabled = !shiftDisabled && (sticky || shiftCrossAxis || collisionAvoidanceSide === "shift");
	const flipMiddleware = collisionAvoidanceSide === "none" ? null : flip({
		...commonCollisionProps,
		padding: {
			top: collisionPadding.top + bias + biasTop,
			right: collisionPadding.right + bias + biasRight,
			bottom: collisionPadding.bottom + bias + biasBottom,
			left: collisionPadding.left + bias + biasLeft
		},
		mainAxis: !shiftCrossAxis && collisionAvoidanceSide === "flip",
		crossAxis: collisionAvoidanceAlign === "flip" ? "alignment" : false,
		fallbackAxisSideDirection: collisionAvoidanceFallbackAxisSide
	});
	const shiftMiddleware = shiftDisabled ? null : shift({
		...commonCollisionProps,
		rootBoundary: shiftRootBoundary,
		mainAxis: collisionAvoidanceAlign !== "none",
		crossAxis: crossAxisShiftEnabled,
		limiter: sticky || shiftCrossAxis ? void 0 : limitShift((limitData) => {
			if (!arrowRef.current) return {};
			const { width, height } = arrowRef.current.getBoundingClientRect();
			const sideAxis = getSideAxis(getSide(limitData.placement));
			const arrowSize = sideAxis === "y" ? width : height;
			const offsetAmount = sideAxis === "y" ? collisionPadding.left + collisionPadding.right : collisionPadding.top + collisionPadding.bottom;
			return { offset: arrowSize / 2 + offsetAmount / 2 };
		})
	}, [
		commonCollisionProps,
		sticky,
		shiftCrossAxis,
		shiftRootBoundary,
		collisionPadding,
		collisionAvoidanceAlign
	]);
	if (collisionAvoidanceSide === "shift" || collisionAvoidanceAlign === "shift" || align === "center") middleware.push(shiftMiddleware, flipMiddleware);
	else middleware.push(flipMiddleware, shiftMiddleware);
	middleware.push(size({
		...commonCollisionProps,
		apply({ elements: { floating }, availableWidth, availableHeight, rects }) {
			if (!mountedRef.current) return;
			const floatingStyle = floating.style;
			floatingStyle.setProperty(AVAILABLE_WIDTH_VAR, `${availableWidth}px`);
			floatingStyle.setProperty(AVAILABLE_HEIGHT_VAR, `${availableHeight}px`);
			const dpr = getWindow(floating).devicePixelRatio || 1;
			const { x, y, width, height } = rects.reference;
			const anchorWidth$1 = (Math.round((x + width) * dpr) - Math.round(x * dpr)) / dpr;
			const anchorHeight$1 = (Math.round((y + height) * dpr) - Math.round(y * dpr)) / dpr;
			floatingStyle.setProperty(anchorWidth, `${anchorWidth$1}px`);
			floatingStyle.setProperty(anchorHeight, `${anchorHeight$1}px`);
		}
	}), arrow((state) => ({
		element: arrowRef.current || ownerDocument(state.elements.floating).createElement("div"),
		padding: arrowRef.current ? arrowPadding : 0,
		offsetParent: "floating"
	}), [arrowPadding]), {
		name: "transformOrigin",
		fn(state) {
			const { elements: { floating }, middlewareData, placement: renderedPlacement, platform, rects, y } = state;
			const renderedSide = getSide(renderedPlacement);
			const renderedAlign = getAlignment(renderedPlacement);
			const isVertical = getSideAxis(renderedSide) === "y";
			const arrowEl = arrowRef.current;
			const sideOffsetValue = typeof sideOffset === "function" ? sideOffset(getOffsetData(state, sideParam, isRtl)) : sideOffset;
			let crossOrigin;
			if (!arrowEl && renderedAlign && Math.abs(isVertical ? middlewareData.shift?.x || 0 : middlewareData.shift?.y || 0) <= 1) crossOrigin = renderedAlign === "start" === (isVertical && platform.isRTL?.(floating) === true) ? "100%" : "0%";
			else crossOrigin = `${(isVertical ? middlewareData.arrow?.x || 0 : middlewareData.arrow?.y || 0) + (isVertical ? arrowEl?.clientWidth || 0 : arrowEl?.clientHeight || 0) / 2}px`;
			let sideOrigin = renderedSide === "top" || renderedSide === "left" ? `calc(100% + ${sideOffsetValue}px)` : `${-sideOffsetValue}px`;
			if (crossAxisShiftEnabled && isVertical && Math.abs(middlewareData.shift?.y || 0) > sideOffsetValue) sideOrigin = `${rects.reference.y + rects.reference.height / 2 - y}px`;
			floating.style.setProperty(transformOrigin$1, isVertical ? `${crossOrigin} ${sideOrigin}` : `${sideOrigin} ${crossOrigin}`);
			return {};
		}
	}, hide, adaptiveOrigin);
	useIsoLayoutEffect(() => {
		if (!mounted && floatingRootContext) floatingRootContext.update({
			referenceElement: null,
			floatingElement: null,
			domReferenceElement: null,
			positionReference: null
		});
	}, [mounted, floatingRootContext]);
	const autoUpdateOptions = import_react.useMemo(() => ({
		ancestorScroll: !disableAnchorTracking,
		elementResize: !disableAnchorTracking && typeof ResizeObserver !== "undefined",
		layoutShift: !disableAnchorTracking && typeof IntersectionObserver !== "undefined"
	}), [disableAnchorTracking]);
	const { refs, elements, x, y, middlewareData, update, placement: renderedPlacement, context, isPositioned, floatingStyles: originalFloatingStyles } = useFloatingHook({
		rootContext: floatingRootContext,
		open: keepMounted ? mounted : void 0,
		placement,
		middleware,
		strategy: positionMethod,
		whileElementsMounted: keepMounted ? void 0 : (...args) => autoUpdate(...args, autoUpdateOptions),
		nodeId,
		externalTree
	});
	const { sideX, sideY } = middlewareData.adaptiveOrigin || DEFAULT_SIDES;
	const resolvedPosition = isPositioned ? positionMethod : "fixed";
	const floatingStyles = import_react.useMemo(() => {
		let base;
		if (!isPositioned) base = {
			position: resolvedPosition,
			top: 0,
			left: 0
		};
		else if (adaptiveOrigin) base = {
			position: resolvedPosition,
			[sideX]: x,
			[sideY]: y
		};
		else base = {
			...originalFloatingStyles,
			position: resolvedPosition
		};
		base[AVAILABLE_WIDTH_VAR] = "100vw";
		base[AVAILABLE_HEIGHT_VAR] = "100vh";
		if (!isPositioned) base.opacity = 0;
		return base;
	}, [
		adaptiveOrigin,
		resolvedPosition,
		sideX,
		x,
		sideY,
		y,
		originalFloatingStyles,
		isPositioned
	]);
	const registeredPositionReferenceRef = import_react.useRef(null);
	useIsoLayoutEffect(() => {
		if (!mounted) return;
		const anchorValue = anchorValueRef.current;
		const resolvedAnchor = typeof anchorValue === "function" ? anchorValue() : anchorValue;
		const finalAnchor = (isRef(resolvedAnchor) ? resolvedAnchor.current : resolvedAnchor) || null;
		if (finalAnchor !== registeredPositionReferenceRef.current) {
			refs.setPositionReference(finalAnchor);
			registeredPositionReferenceRef.current = finalAnchor;
		}
	}, [
		mounted,
		refs,
		anchorDep,
		anchorValueRef
	]);
	import_react.useEffect(() => {
		if (!mounted) return;
		const anchorValue = anchorValueRef.current;
		if (typeof anchorValue === "function") return;
		if (isRef(anchorValue) && anchorValue.current !== registeredPositionReferenceRef.current) {
			refs.setPositionReference(anchorValue.current);
			registeredPositionReferenceRef.current = anchorValue.current;
		}
	}, [
		mounted,
		refs,
		anchorDep,
		anchorValueRef
	]);
	import_react.useEffect(() => {
		if (keepMounted && mounted && elements.reference && elements.floating) return autoUpdate(elements.reference, elements.floating, update, autoUpdateOptions);
	}, [
		keepMounted,
		mounted,
		elements,
		update,
		autoUpdateOptions
	]);
	const renderedSide = getSide(renderedPlacement);
	const logicalRenderedSide = getLogicalSide(sideParam, renderedSide, isRtl);
	const renderedAlign = getAlignment(renderedPlacement) || "center";
	const anchorHidden = Boolean(middlewareData.hide?.referenceHidden);
	useIsoLayoutEffect(() => {
		if (lazyFlip && mounted && isPositioned && renderedSide !== side) setMountSide(renderedSide);
	}, [
		lazyFlip,
		mounted,
		isPositioned,
		renderedSide,
		side
	]);
	const arrowStyles = import_react.useMemo(() => ({
		position: "absolute",
		top: middlewareData.arrow?.y,
		left: middlewareData.arrow?.x
	}), [middlewareData.arrow]);
	const arrowUncentered = middlewareData.arrow?.centerOffset !== 0;
	return import_react.useMemo(() => ({
		positionerStyles: floatingStyles,
		arrowStyles,
		arrowRef,
		arrowUncentered,
		side: logicalRenderedSide,
		align: renderedAlign,
		physicalSide: renderedSide,
		anchorHidden,
		refs,
		context,
		isPositioned,
		update
	}), [
		floatingStyles,
		arrowStyles,
		arrowRef,
		arrowUncentered,
		logicalRenderedSide,
		renderedAlign,
		renderedSide,
		anchorHidden,
		refs,
		context,
		isPositioned,
		update
	]);
}
function isRef(param) {
	return param != null && "current" in param;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/getDisabledMountTransitionStyles.mjs
function getDisabledMountTransitionStyles(transitionStatus) {
	return transitionStatus === "starting" ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/usePositioner.mjs
/**
* Renders the shared outer Positioner element used by popup components.
* Applies the common role, hidden state, transition styles, state attributes, and optional inert styling.
*/
function usePositioner(componentProps, state, { styles, transitionStatus, props, refs, hidden, inert = false }) {
	const style = { ...styles };
	if (inert) style.pointerEvents = "none";
	return useRenderElement("div", componentProps, {
		state,
		ref: refs,
		props: [
			{
				role: "presentation",
				hidden,
				style
			},
			getDisabledMountTransitionStyles(transitionStatus),
			props
		],
		stateAttributesMapping: popupStateMapping
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/positioner/TooltipPositioner.mjs
/**
* Positions the tooltip against the trigger.
* Renders a `<div>` element.
*
* Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
*/
var TooltipPositioner = /*#__PURE__*/ import_react.forwardRef(function TooltipPositioner(componentProps, forwardedRef) {
	const { render, className, anchor, positionMethod = "absolute", side = "top", align = "center", sideOffset = 0, alignOffset = 0, collisionBoundary = "clipping-ancestors", collisionPadding = 5, arrowPadding = 5, sticky = false, disableAnchorTracking = false, collisionAvoidance = POPUP_COLLISION_AVOIDANCE, style, ...elementProps } = componentProps;
	const store = useTooltipRootContext();
	const keepMounted = useTooltipPortalContext();
	const open = store.useState("open");
	const mounted = store.useState("mounted");
	const trackCursorAxis = store.useState("trackCursorAxis");
	const disableHoverablePopup = store.useState("disableHoverablePopup");
	const floatingRootContext = store.useState("floatingRootContext");
	const instantType = store.useState("instantType");
	const transitionStatus = store.useState("transitionStatus");
	const positioning = useAnchorPositioning({
		anchor,
		positionMethod,
		floatingRootContext,
		mounted,
		side,
		sideOffset,
		align,
		alignOffset,
		collisionBoundary,
		collisionPadding,
		sticky,
		arrowPadding,
		disableAnchorTracking,
		keepMounted,
		collisionAvoidance,
		adaptiveOrigin: store.useState("adaptiveOrigin")
	});
	const element = usePositioner(componentProps, import_react.useMemo(() => ({
		open,
		side: positioning.side,
		align: positioning.align,
		anchorHidden: positioning.anchorHidden,
		instant: trackCursorAxis !== "none" ? "tracking-cursor" : instantType
	}), [
		open,
		positioning.side,
		positioning.align,
		positioning.anchorHidden,
		trackCursorAxis,
		instantType
	]), {
		styles: positioning.positionerStyles,
		transitionStatus,
		props: elementProps,
		refs: [forwardedRef, store.useStateSetter("positionerElement")],
		hidden: !mounted,
		inert: !open || trackCursorAxis === "both" || disableHoverablePopup
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(TooltipPositionerContext.Provider, {
		value: positioning,
		children: element
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/popup/TooltipPopup.mjs
/**
* A container for the tooltip contents.
* Renders a `<div>` element.
*
* Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
*/
var TooltipPopup = /*#__PURE__*/ import_react.forwardRef(function TooltipPopup(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const store = useTooltipRootContext();
	const { side, align } = useTooltipPositionerContext();
	const open = store.useState("open");
	const instantType = store.useState("instantType");
	const transitionStatus = store.useState("transitionStatus");
	const popupProps = store.useState("popupProps");
	const floatingContext = store.useState("floatingRootContext");
	const disabled = store.useState("disabled");
	const closeDelay = store.useState("closeDelay");
	useOpenChangeComplete({
		open,
		ref: store.context.popupRef,
		onComplete() {
			if (open) store.context.onOpenChangeComplete?.(true);
		}
	});
	useHoverFloatingInteraction(floatingContext, {
		enabled: !disabled,
		closeDelay
	});
	const setPopupElement = store.useStateSetter("popupElement");
	return useRenderElement("div", componentProps, {
		state: {
			open,
			side,
			align,
			instant: instantType,
			transitionStatus
		},
		ref: [
			forwardedRef,
			store.context.popupRef,
			setPopupElement
		],
		props: [
			FOCUSABLE_POPUP_PROPS,
			popupProps,
			getDisabledMountTransitionStyles(transitionStatus),
			elementProps
		],
		stateAttributesMapping: popupTransitionStateMapping
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/arrow/TooltipArrow.mjs
/**
* Displays an element positioned against the tooltip anchor.
* Renders a `<div>` element.
*
* Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
*/
var TooltipArrow = /*#__PURE__*/ import_react.forwardRef(function TooltipArrow(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const store = useTooltipRootContext();
	const { arrowRef, side, align, arrowUncentered, arrowStyles } = useTooltipPositionerContext();
	return useRenderElement("div", componentProps, {
		state: {
			open: store.useState("open"),
			side,
			align,
			uncentered: arrowUncentered,
			instant: store.useState("instantType")
		},
		ref: [forwardedRef, arrowRef],
		props: [{
			style: arrowStyles,
			"aria-hidden": true
		}, elementProps],
		stateAttributesMapping: popupStateMapping
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/provider/TooltipProvider.mjs
/**
* Provides a shared delay for multiple tooltips. The grouping logic ensures that
* once a tooltip becomes visible, the adjacent tooltips will be shown instantly.
*
* Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
*/
var TooltipProvider = function TooltipProvider(props) {
	const { delay, closeDelay, timeout = 400 } = props;
	const delayValue = import_react.useMemo(() => ({
		open: delay,
		close: closeDelay
	}), [delay, closeDelay]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(TooltipProviderContext.Provider, {
		value: delay,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingDelayGroup, {
			delay: delayValue,
			timeoutMs: timeout,
			children: props.children
		})
	});
};
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/inertValue.mjs
function inertValue(value) {
	if (isReactVersionAtLeast(19)) return value;
	return value ? "true" : void 0;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/usePreviousValue.mjs
/**
* Returns a previous value of its argument.
* @param value Current value.
* @returns Previous value, or null if there is no previous value.
*/
function usePreviousValue(value) {
	const [state, setState] = import_react.useState({
		current: value,
		previous: null
	});
	if (!Object.is(value, state.current)) setState({
		current: value,
		previous: state.current
	});
	return state.previous;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/use-render/useRender.mjs
/**
* Renders a Base UI element.
*
* @public
*/
function useRender(params) {
	return useRenderElement(params.defaultTagName ?? "div", params, params);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/getDefaultFormSubmitter.mjs
/**
* Returns the default button a browser uses for implicit form submission.
*
* This is useful for custom form controls that need to mirror native Enter key behavior.
* Clicking the returned submitter preserves browser semantics such as the submitter's click
* event, `SubmitEvent.submitter`, and submitter-specific attributes.
*
* The function follows the controls exposed by `form.elements`, which includes controls associated
* through the `form` attribute. Disabled submitters can be returned because the default button is
* determined before disabled state is considered; clicking a disabled submitter is a no-op.
*/
function getDefaultFormSubmitter(form) {
	if (!form) return null;
	for (const candidate of form.elements) {
		const tagName = candidate.tagName;
		if (tagName === "BUTTON" || tagName === "INPUT") {
			const button = candidate;
			if (button.type === "submit") return button;
		}
	}
	return null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/checkbox/root/CheckboxRootDataAttributes.mjs
/**
* Present when the checkbox is checked.
*/
var checked$1 = "data-checked";
/**
* Present when the checkbox is not checked.
*/
var unchecked$1 = "data-unchecked";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/checkbox/utils/getCheckboxStateAttributesMapping.mjs
function getCheckboxStateAttributesMapping(state) {
	return {
		checked(value) {
			if (state.indeterminate) return {};
			if (value) return { [checked$1]: "" };
			return { [unchecked$1]: "" };
		},
		...fieldValidityMapping
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/checkbox-group/CheckboxGroupContext.mjs
var CheckboxGroupContext = /*#__PURE__*/ import_react.createContext(void 0);
function useCheckboxGroupContext() {
	return import_react.useContext(CheckboxGroupContext);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/checkbox/root/CheckboxRootContext.mjs
var CheckboxRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useCheckboxRootContext() {
	const context = import_react.useContext(CheckboxRootContext);
	if (context === void 0) throw new Error(formatErrorMessage(14));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/checkbox/root/CheckboxRoot.mjs
var PARENT_CHECKBOX = "data-parent";
/**
* Represents the checkbox itself.
* Renders a `<span>` element and a hidden `<input>` beside.
*
* Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
*/
var CheckboxRoot = /*#__PURE__*/ import_react.forwardRef(function CheckboxRoot(componentProps, forwardedRef) {
	const { checked: checkedProp, className, defaultChecked = false, "aria-labelledby": ariaLabelledByProp, disabled: disabledProp = false, form, id: idProp, indeterminate = false, inputRef: inputRefProp, name: nameProp, onCheckedChange, parent = false, readOnly = false, render, required = false, uncheckedValue, value: valueProp, nativeButton = false, style, ...elementProps } = componentProps;
	const { clearErrors } = useFormContext();
	const { disabled: rootDisabled, name: fieldName, setDirty, setFilled, setFocused, setTouched, state: fieldState, validationMode, validityData, validation: localValidation } = useFieldRootContext();
	const fieldItemContext = useFieldItemContext();
	const { labelId, registerControlId, getDescriptionProps } = useLabelableContext();
	const groupContext = useCheckboxGroupContext();
	const parentContext = groupContext?.allValues === void 0 ? void 0 : groupContext.parent;
	const isGroupedWithParent = parentContext !== void 0;
	const disabled = rootDisabled || fieldItemContext.disabled || groupContext?.disabled || disabledProp;
	const name = fieldName ?? nameProp;
	const value = valueProp ?? name;
	const id = useBaseUiId();
	const ownsControlId = groupContext?.registerControlId !== registerControlId;
	const controlId = useLabelableId({
		id: idProp || void 0,
		enabled: ownsControlId
	});
	const rootId = nativeButton ? controlId : id;
	let groupProps = {};
	if (isGroupedWithParent) {
		if (parent) groupProps = parentContext.getParentProps();
		else if (value !== void 0) groupProps = parentContext.getChildProps(value);
	}
	const { checked: groupChecked = checkedProp, indeterminate: groupIndeterminate = indeterminate, onCheckedChange: groupOnChange, ...otherGroupProps } = groupProps;
	const groupValue = groupContext?.value;
	const controlRef = import_react.useRef(null);
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	const validation = groupContext?.validation ?? localValidation;
	const [checked, setCheckedState] = useControlled({
		controlled: value !== void 0 && groupValue !== void 0 && !parent ? groupValue.includes(value) : groupChecked,
		default: defaultChecked,
		name: "Checkbox",
		state: "checked"
	});
	const computedChecked = isGroupedWithParent ? Boolean(groupChecked) : checked;
	const computedIndeterminate = isGroupedWithParent ? groupIndeterminate || indeterminate : indeterminate;
	useRegisterFieldControl(controlRef, id, checked, void 0, !groupContext && !disabled, nameProp);
	const registerChildId = parentContext?.registerChildId;
	const inputRef = import_react.useRef(null);
	const registerFieldInput = validation.registerInput;
	const registeredInputValue = groupContext ? value : void 0;
	const registerInput = import_react.useCallback((element) => registerFieldInput(element, {
		controlRef,
		value: registeredInputValue
	}), [registerFieldInput, registeredInputValue]);
	const mergedInputRef = useMergedRefs(inputRefProp, inputRef, parent ? void 0 : registerInput);
	const ariaLabelledBy = useAriaLabelledBy(ariaLabelledByProp, labelId, inputRef, !nativeButton, controlId);
	useIsoLayoutEffect(() => {
		if (inputRef.current) inputRef.current.indeterminate = computedIndeterminate;
		if (!groupContext) setFilled(checked);
	}, [
		checked,
		computedIndeterminate,
		groupContext,
		setFilled
	]);
	useValueChanged(checked, () => {
		if (groupContext) return;
		clearErrors(name);
		setDirty(checked !== validityData.initialValue);
		validation.change(checked);
	});
	const inputProps = mergeProps({
		checked,
		disabled,
		form,
		name: parent ? void 0 : name,
		id: nativeButton ? void 0 : controlId,
		required,
		ref: mergedInputRef,
		style: name ? visuallyHiddenInput : visuallyHidden,
		tabIndex: -1,
		type: "checkbox",
		"aria-hidden": true,
		onChange(event) {
			if (event.nativeEvent.defaultPrevented) return;
			if (readOnly) {
				event.preventDefault();
				return;
			}
			const nextChecked = event.currentTarget.checked;
			const details = createChangeEventDetails(none, event.nativeEvent);
			onCheckedChange?.(nextChecked, details);
			if (details.isCanceled) return;
			groupOnChange?.(nextChecked, details);
			if (details.isCanceled) return;
			setCheckedState(nextChecked);
			if (value !== void 0 && groupContext !== void 0 && !parent && !isGroupedWithParent) {
				const nextGroupValue = nextChecked ? [...groupContext.value, value] : groupContext.value.filter((item) => item !== value);
				groupContext.setValue(nextGroupValue, details);
			}
		},
		onClick(event) {
			event.stopPropagation();
		},
		onFocus() {
			controlRef.current?.focus();
		}
	}, valueProp !== void 0 ? { value: (groupContext ? checked && valueProp : valueProp) || "" } : EMPTY_OBJECT, getDescriptionProps, (props) => validation.getValidationProps(disabled, props));
	import_react.useEffect(() => {
		if (!parentContext || value === void 0) return;
		const disabledStates = parentContext.disabledStatesRef.current;
		disabledStates.set(value, disabled);
		return () => {
			disabledStates.delete(value);
		};
	}, [
		parentContext,
		disabled,
		value
	]);
	const state = import_react.useMemo(() => ({
		...fieldState,
		checked: computedChecked,
		disabled,
		readOnly,
		required,
		indeterminate: computedIndeterminate
	}), [
		fieldState,
		computedChecked,
		disabled,
		readOnly,
		required,
		computedIndeterminate
	]);
	const stateAttributesMapping = getCheckboxStateAttributesMapping(state);
	const element = useRenderElement("span", componentProps, {
		state,
		ref: [
			buttonRef,
			controlRef,
			forwardedRef
		],
		props: [
			{
				id: rootId,
				role: "checkbox",
				"aria-checked": computedIndeterminate ? "mixed" : computedChecked,
				"aria-readonly": readOnly || void 0,
				"aria-required": required || void 0,
				"aria-labelledby": ariaLabelledBy,
				[PARENT_CHECKBOX]: parent ? "" : void 0,
				onFocus() {
					if (!disabled) setFocused(true);
				},
				onBlur() {
					const inputEl = inputRef.current;
					if (!inputEl) return;
					setTouched(true);
					setFocused(false);
					if (validationMode === "onBlur") validation.commit(groupContext ? groupValue : inputEl.checked);
				},
				onKeyDown(event) {
					if (event.key !== "Enter") return;
					event.preventBaseUIHandler();
					if (event.defaultPrevented) return;
					const formToSubmit = inputRef.current?.form ?? null;
					const currentTarget = event.currentTarget;
					const nativeEvent = event.nativeEvent;
					const originalPreventDefault = event.preventDefault;
					const originalNativePreventDefault = nativeEvent.preventDefault;
					let preventDefaultCalledAfterPropagation = false;
					event.preventDefault = () => {
						preventDefaultCalledAfterPropagation = true;
						originalPreventDefault.call(event);
					};
					nativeEvent.preventDefault = () => {
						preventDefaultCalledAfterPropagation = true;
						originalNativePreventDefault.call(nativeEvent);
					};
					originalNativePreventDefault.call(nativeEvent);
					getWindow(currentTarget).queueMicrotask(() => {
						event.preventDefault = originalPreventDefault;
						nativeEvent.preventDefault = originalNativePreventDefault;
						if (!preventDefaultCalledAfterPropagation) getDefaultFormSubmitter(formToSubmit)?.click();
					});
				},
				onClick(event) {
					if (readOnly || disabled) return;
					event.preventDefault();
					const input = inputRef.current;
					if (!input) return;
					dispatchClickWithModifiers(input, event);
				}
			},
			elementProps,
			otherGroupProps,
			getButtonProps,
			getDescriptionProps,
			(props) => validation.getValidationProps(disabled, props)
		],
		stateAttributesMapping
	});
	const renderedId = element.props.id;
	useIsoLayoutEffect(() => {
		if (!registerChildId || parent || value === void 0 || renderedId === void 0) return;
		return registerChildId(value, renderedId);
	}, [
		registerChildId,
		parent,
		value,
		renderedId
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(CheckboxRootContext.Provider, {
		value: state,
		children: [
			element,
			!checked && !groupContext && name && !parent && uncheckedValue !== void 0 && /*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
				type: "hidden",
				form,
				name,
				value: uncheckedValue,
				disabled
			}),
			/*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
				...inputProps,
				suppressHydrationWarning: true
			})
		]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/checkbox/indicator/CheckboxIndicator.mjs
/**
* Indicates whether the checkbox is ticked.
* Renders a `<span>` element.
*
* Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
*/
var CheckboxIndicator = /*#__PURE__*/ import_react.forwardRef(function CheckboxIndicator(componentProps, forwardedRef) {
	const { render, className, style, keepMounted = false, ...elementProps } = componentProps;
	const rootState = useCheckboxRootContext();
	const rendered = rootState.checked || rootState.indeterminate;
	const { mounted, transitionStatus, setMounted } = useTransitionStatus(rendered);
	const indicatorRef = import_react.useRef(null);
	const state = {
		...rootState,
		transitionStatus
	};
	useOpenChangeComplete({
		batch: true,
		enabled: !rendered,
		open: rendered,
		ref: indicatorRef,
		onComplete() {
			if (!rendered) setMounted(false);
		}
	});
	const stateAttributesMapping = {
		...getCheckboxStateAttributesMapping(rootState),
		...transitionStatusMapping
	};
	const shouldRender = keepMounted || mounted;
	const element = useRenderElement("span", componentProps, {
		ref: [forwardedRef, indicatorRef],
		state,
		stateAttributesMapping,
		props: elementProps
	});
	if (!shouldRender) return null;
	return element;
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/separator/Separator.mjs
/**
* A separator element accessible to screen readers.
* Renders a `<div>` element.
*
* Documentation: [Base UI Separator](https://base-ui.com/react/components/separator)
*/
var Separator = /*#__PURE__*/ import_react.forwardRef(function SeparatorComponent(componentProps, forwardedRef) {
	const { className, render, orientation = "horizontal", style, ...elementProps } = componentProps;
	return useRenderElement("div", componentProps, {
		state: { orientation },
		ref: forwardedRef,
		props: [{
			role: "separator",
			"aria-orientation": orientation
		}, elementProps]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/list/CompositeListContext.mjs
var CompositeListContext = /*#__PURE__*/ import_react.createContext({
	register: () => {},
	unregister: () => {},
	subscribeMapChange: () => () => {},
	nextIndexRef: { current: 0 }
});
function useCompositeListContext() {
	return import_react.useContext(CompositeListContext);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/list/CompositeList.mjs
/**
* Provides context for a list of items in a composite component.
*/
function CompositeList(props) {
	const { children, elementsRef, labelsRef, onMapChange: onMapChangeProp } = props;
	const onMapChange = useStableCallback(onMapChangeProp);
	const [, setMapTick] = import_react.useState(false);
	const listeners = useRefWithInit(createListeners).current;
	const map = useRefWithInit(createMap).current;
	const nextIndexRef = import_react.useRef(0);
	const isDirtyRef = import_react.useRef(true);
	const itemsRef = import_react.useRef(null);
	const mutationObserverRef = import_react.useRef(null);
	const scheduleMapUpdate = useStableCallback(() => {
		if (isDirtyRef.current) return;
		isDirtyRef.current = true;
		setMapTick((tick) => !tick);
	});
	const register = useStableCallback((node, registration) => {
		map.set(node, registration);
		scheduleMapUpdate();
	});
	const unregister = useStableCallback((node) => {
		map.delete(node);
		scheduleMapUpdate();
	});
	const syncRefs = useStableCallback((items) => {
		const nextMap = /* @__PURE__ */ new Map();
		elementsRef.current.length = 0;
		if (labelsRef) labelsRef.current.length = 0;
		items.forEach((item) => {
			nextMap.set(item.element, {
				...item.registration.metadata ?? {},
				index: item.index
			});
			elementsRef.current[item.index] = item.element;
			if (labelsRef) labelsRef.current[item.index] = item.registration.label !== void 0 ? item.registration.label : item.registration.textRef?.current?.textContent ?? item.element.textContent;
		});
		nextIndexRef.current = elementsRef.current.length;
		return nextMap;
	});
	function observe(sortedNodes) {
		mutationObserverRef.current?.disconnect();
		mutationObserverRef.current = null;
		if (typeof MutationObserver !== "function" || sortedNodes.length < 2) return;
		const mutationObserver = new MutationObserver((entries) => {
			if (!hasMovedNode(entries)) return;
			let previousConnectedNode = null;
			for (const node of sortedNodes) {
				if (!node.isConnected) continue;
				if (previousConnectedNode && sortByDocumentPosition(previousConnectedNode, node) > 0) {
					mutationObserver.disconnect();
					scheduleMapUpdate();
					return;
				}
				previousConnectedNode = node;
			}
		});
		mutationObserverRef.current = mutationObserver;
		const roots = /* @__PURE__ */ new Set();
		for (let i = 1; i < sortedNodes.length; i += 1) {
			const root = getCommonAncestor(sortedNodes[i - 1], sortedNodes[i]);
			if (root) roots.add(root);
		}
		roots.forEach((root) => mutationObserver.observe(root, { childList: true }));
	}
	const flush = useStableCallback(() => {
		const [items, automaticNodes] = getCompositeListSnapshot(map);
		const nextMap = syncRefs(items);
		const previousItems = itemsRef.current;
		const changed = !previousItems || previousItems.length !== items.length || items.some((item, index) => {
			const previousItem = previousItems[index];
			return item.index !== previousItem.index || item.element !== previousItem.element || item.registration.index !== previousItem.registration.index || item.registration.metadata !== previousItem.registration.metadata;
		});
		observe(automaticNodes);
		itemsRef.current = items;
		isDirtyRef.current = false;
		if (!changed) return;
		listeners.forEach((listener) => listener(nextMap));
		onMapChange(nextMap);
	});
	useIsoLayoutEffect(() => {
		if (!isDirtyRef.current && itemsRef.current) syncRefs(itemsRef.current);
		return () => {
			elementsRef.current = [];
			if (labelsRef) labelsRef.current = [];
		};
	}, [
		elementsRef,
		labelsRef,
		syncRefs
	]);
	useIsoLayoutEffect(() => {
		if (isDirtyRef.current) flush();
	});
	useIsoLayoutEffect(() => {
		return () => {
			mutationObserverRef.current?.disconnect();
			isDirtyRef.current = true;
		};
	}, []);
	const subscribeMapChange = useStableCallback((fn) => {
		listeners.add(fn);
		return () => {
			listeners.delete(fn);
		};
	});
	const contextValue = import_react.useMemo(() => ({
		register,
		unregister,
		subscribeMapChange,
		nextIndexRef
	}), [
		register,
		unregister,
		subscribeMapChange,
		nextIndexRef
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeListContext.Provider, {
		value: contextValue,
		children
	});
}
function createMap() {
	return /* @__PURE__ */ new Map();
}
function createListeners() {
	return /* @__PURE__ */ new Set();
}
function getCompositeListSnapshot(map) {
	const reservedIndices = /* @__PURE__ */ new Set();
	const items = [];
	const automaticItems = [];
	map.forEach((registration, node) => {
		if (!node.isConnected) return;
		const index = registration.index;
		const item = {
			index: index ?? -1,
			element: node,
			registration
		};
		if (index === null) automaticItems.push(item);
		else if (index >= 0) {
			reservedIndices.add(index);
			items.push(item);
		}
	});
	let nextAutomaticIndex = 0;
	automaticItems.sort((a, b) => sortByDocumentPosition(a.element, b.element));
	automaticItems.forEach((item) => {
		while (reservedIndices.has(nextAutomaticIndex)) nextAutomaticIndex += 1;
		item.index = nextAutomaticIndex;
		items.push(item);
		nextAutomaticIndex += 1;
	});
	if (reservedIndices.size > 0) items.sort((a, b) => a.index - b.index);
	return [items, automaticItems.map((item) => item.element)];
}
function getCommonAncestor(firstNode, lastNode) {
	let ancestor = firstNode.parentElement;
	while (ancestor && !ancestor.contains(lastNode)) ancestor = ancestor.parentElement;
	return ancestor;
}
function hasMovedNode(entries) {
	for (const entry of entries) for (let i = 0; i < entry.removedNodes.length; i += 1) if (entry.removedNodes[i].isConnected) return true;
	return false;
}
function sortByDocumentPosition(a, b) {
	return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/list/useCompositeListItem.mjs
/**
* Used to register a list item and its index (DOM position) in the `CompositeList`.
*/
function useCompositeListItem(params = {}) {
	const { guess, label, metadata, textRef, index: externalIndex } = params;
	const { register, unregister, subscribeMapChange, nextIndexRef } = useCompositeListContext();
	const indexRef = import_react.useRef(-1);
	const [internalIndex, setInternalIndex] = import_react.useState(externalIndex == null && guess ? () => {
		if (indexRef.current === -1) {
			const newIndex = nextIndexRef.current;
			nextIndexRef.current += 1;
			indexRef.current = newIndex;
		}
		return indexRef.current;
	} : -1);
	const index = externalIndex ?? internalIndex;
	const componentRef = import_react.useRef(null);
	const ref = import_react.useCallback((node) => {
		const previousNode = componentRef.current;
		if (previousNode) unregister(previousNode);
		componentRef.current = node;
		if (node) register(node, {
			metadata: metadata ?? null,
			index: externalIndex ?? null,
			label,
			textRef
		});
	}, [
		externalIndex,
		register,
		unregister,
		metadata,
		label,
		textRef
	]);
	useIsoLayoutEffect(() => {
		if (externalIndex != null) return;
		return subscribeMapChange((map) => {
			const i = componentRef.current ? map.get(componentRef.current)?.index : null;
			if (i != null) setInternalIndex(i);
		});
	}, [externalIndex, subscribeMapChange]);
	return {
		ref,
		index
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useScrollLock.mjs
var originalHtmlStyles = {};
var originalBodyStyles = {};
var originalHtmlScrollBehavior = "";
function getViewportScroller(html, body) {
	return isOverflowElement(html) ? html : body;
}
function isPageScrollLocked(win, html, body) {
	return /hidden|clip/.test(win.getComputedStyle(getViewportScroller(html, body)).overflowY);
}
function hasInsetScrollbars(referenceElement) {
	if (typeof document === "undefined") return false;
	const doc = ownerDocument(referenceElement);
	return getWindow(doc).innerWidth - doc.documentElement.clientWidth > 0;
}
function supportsStableScrollbarGutter(referenceElement) {
	if (!(typeof CSS !== "undefined" && CSS.supports && CSS.supports("scrollbar-gutter", "stable")) || typeof document === "undefined") return false;
	const doc = ownerDocument(referenceElement);
	const html = doc.documentElement;
	const body = doc.body;
	const scrollContainer = getViewportScroller(html, body);
	const originalScrollContainerOverflowY = scrollContainer.style.overflowY;
	const originalHtmlStyleGutter = html.style.scrollbarGutter;
	html.style.scrollbarGutter = "stable";
	scrollContainer.style.overflowY = "scroll";
	const before = scrollContainer.offsetWidth;
	scrollContainer.style.overflowY = "hidden";
	const after = scrollContainer.offsetWidth;
	scrollContainer.style.overflowY = originalScrollContainerOverflowY;
	html.style.scrollbarGutter = originalHtmlStyleGutter;
	return before === after;
}
function preventScrollOverlayScrollbars(referenceElement) {
	const doc = ownerDocument(referenceElement);
	const html = doc.documentElement;
	const body = doc.body;
	const elementToLock = getViewportScroller(html, body);
	const originalElementToLockStyles = {
		overflowY: elementToLock.style.overflowY,
		overflowX: elementToLock.style.overflowX
	};
	Object.assign(elementToLock.style, {
		overflowY: "hidden",
		overflowX: "hidden"
	});
	return () => {
		Object.assign(elementToLock.style, originalElementToLockStyles);
	};
}
function preventScrollInsetScrollbars(referenceElement) {
	const doc = ownerDocument(referenceElement);
	const html = doc.documentElement;
	const body = doc.body;
	const win = getWindow(html);
	let scrollTop = 0;
	let scrollLeft = 0;
	let updateGutterOnly = false;
	const resizeFrame = AnimationFrame.create();
	if (webkit && (win.visualViewport?.scale ?? 1) !== 1) return () => {};
	function lockScroll() {
		const htmlStyles = win.getComputedStyle(html);
		const bodyStyles = win.getComputedStyle(body);
		const scrollbarGutterValue = (htmlStyles.scrollbarGutter || "").includes("both-edges") ? "stable both-edges" : "stable";
		scrollTop = html.scrollTop;
		scrollLeft = html.scrollLeft;
		originalHtmlStyles = {
			scrollbarGutter: html.style.scrollbarGutter,
			overflowY: html.style.overflowY,
			overflowX: html.style.overflowX
		};
		originalHtmlScrollBehavior = html.style.scrollBehavior;
		originalBodyStyles = {
			position: body.style.position,
			height: body.style.height,
			width: body.style.width,
			boxSizing: body.style.boxSizing,
			overflowY: body.style.overflowY,
			overflowX: body.style.overflowX,
			scrollBehavior: body.style.scrollBehavior
		};
		const isScrollableY = html.scrollHeight > html.clientHeight;
		const isScrollableX = html.scrollWidth > html.clientWidth;
		const hasConstantOverflowY = htmlStyles.overflowY === "scroll" || bodyStyles.overflowY === "scroll";
		const hasConstantOverflowX = htmlStyles.overflowX === "scroll" || bodyStyles.overflowX === "scroll";
		const scrollbarWidth = Math.max(0, win.innerWidth - body.clientWidth);
		const scrollbarHeight = Math.max(0, win.innerHeight - body.clientHeight);
		const marginY = parseFloat(bodyStyles.marginTop) + parseFloat(bodyStyles.marginBottom);
		const marginX = parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight);
		const elementToLock = getViewportScroller(html, body);
		updateGutterOnly = supportsStableScrollbarGutter(referenceElement);
		if (updateGutterOnly) {
			html.style.scrollbarGutter = scrollbarGutterValue;
			elementToLock.style.overflowY = "hidden";
			elementToLock.style.overflowX = "hidden";
			return;
		}
		Object.assign(html.style, {
			scrollbarGutter: scrollbarGutterValue,
			overflowY: "hidden",
			overflowX: "hidden"
		});
		if (isScrollableY || hasConstantOverflowY) html.style.overflowY = "scroll";
		if (isScrollableX || hasConstantOverflowX) html.style.overflowX = "scroll";
		Object.assign(body.style, {
			position: "relative",
			height: marginY || scrollbarHeight ? `calc(100dvh - ${marginY + scrollbarHeight}px)` : "100dvh",
			width: marginX || scrollbarWidth ? `calc(100vw - ${marginX + scrollbarWidth}px)` : "100vw",
			boxSizing: "border-box",
			overflowY: "hidden",
			overflowX: "hidden",
			scrollBehavior: "unset"
		});
		body.scrollTop = scrollTop;
		body.scrollLeft = scrollLeft;
		html.setAttribute("data-base-ui-scroll-locked", "");
		html.style.scrollBehavior = "unset";
	}
	function cleanup() {
		Object.assign(html.style, originalHtmlStyles);
		Object.assign(body.style, originalBodyStyles);
		if (!updateGutterOnly) {
			html.scrollTop = scrollTop;
			html.scrollLeft = scrollLeft;
			html.removeAttribute("data-base-ui-scroll-locked");
			html.style.scrollBehavior = originalHtmlScrollBehavior;
		}
	}
	function handleResize() {
		cleanup();
		resizeFrame.request(lockScroll);
	}
	lockScroll();
	const unsubscribeResize = addEventListener(win, "resize", handleResize);
	return () => {
		resizeFrame.cancel();
		cleanup();
		if (typeof win.removeEventListener === "function") unsubscribeResize();
	};
}
var ScrollLocker = class {
	lockCount = 0;
	restore = null;
	timeoutLock = Timeout.create();
	timeoutUnlock = Timeout.create();
	acquire(referenceElement) {
		this.lockCount += 1;
		if (this.lockCount === 1 && this.restore === null) this.timeoutLock.start(0, () => this.lock(referenceElement));
		return this.release;
	}
	release = () => {
		this.lockCount -= 1;
		if (this.lockCount === 0 && this.restore) this.timeoutUnlock.start(0, this.unlock);
	};
	unlock = () => {
		if (this.lockCount === 0 && this.restore) {
			this.restore?.();
			this.restore = null;
		}
	};
	lock(referenceElement) {
		if (this.lockCount === 0 || this.restore !== null) return;
		const doc = ownerDocument(referenceElement);
		const html = doc.documentElement;
		const body = doc.body;
		const win = getWindow(html);
		if (isPageScrollLocked(win, html, body)) {
			const observer = new win.MutationObserver(() => {
				if (isPageScrollLocked(win, html, body)) return;
				observer.disconnect();
				this.restore = null;
				this.lock(referenceElement);
			});
			const options = { attributes: true };
			observer.observe(html, options);
			observer.observe(body, options);
			this.restore = () => observer.disconnect();
			return;
		}
		const hasOverlayScrollbars = ios || !hasInsetScrollbars(referenceElement);
		this.restore = hasOverlayScrollbars ? preventScrollOverlayScrollbars(referenceElement) : preventScrollInsetScrollbars(referenceElement);
	}
};
var SCROLL_LOCKER = new ScrollLocker();
/**
* Locks the scroll of the document when enabled.
*
* @param enabled - Whether to enable the scroll lock.
* @param referenceElement - Element to use as a reference for lock calculations.
*/
function useScrollLock(enabled = true, referenceElement = null) {
	useIsoLayoutEffect(() => {
		if (!enabled) return;
		return SCROLL_LOCKER.acquire(referenceElement);
	}, [enabled, referenceElement]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/root/useDialogRoot.mjs
function DialogInteractions({ store, parentContext, isDrawer }) {
	const open = store.useState("open");
	const disablePointerDismissal = store.useState("disablePointerDismissal");
	const modal = store.useState("modal");
	const popupElement = store.useState("popupElement");
	const floatingRootContext = store.useState("floatingRootContext");
	const [ownNestedOpenDialogs, setOwnNestedOpenDialogs] = import_react.useState(0);
	const [ownNestedOpenDrawers, setOwnNestedOpenDrawers] = import_react.useState(0);
	const isTopmost = ownNestedOpenDialogs === 0;
	const dismiss = useDismiss(floatingRootContext, {
		outsidePressEvent() {
			if (store.context.internalBackdropRef.current || store.context.backdropRef.current) return "intentional";
			return {
				mouse: modal === "trap-focus" ? "sloppy" : "intentional",
				touch: "sloppy"
			};
		},
		outsidePress(event) {
			if (!store.context.outsidePressEnabledRef.current) return false;
			if ("button" in event && event.button !== 0) return false;
			if ("touches" in event) {
				if (event.type === "touchend") {
					if (event.changedTouches.length !== 1 || event.touches.length !== 0) return false;
				} else if (event.touches.length !== 1) return false;
			}
			const target = getTarget(event);
			if (isTopmost && !disablePointerDismissal) {
				if (modal) {
					const internalBackdrop = store.context.internalBackdropRef.current;
					const backdrop = store.context.backdropRef.current;
					return internalBackdrop || backdrop ? internalBackdrop === target || backdrop === target || contains(target, popupElement) && !target?.hasAttribute("data-base-ui-portal") : true;
				}
				return true;
			}
			return false;
		},
		escapeKey: isTopmost
	});
	useScrollLock(open && modal === true, popupElement);
	store.useContextCallback("onNestedDialogOpen", (dialogCount, drawerCount) => {
		setOwnNestedOpenDialogs(dialogCount);
		setOwnNestedOpenDrawers(drawerCount);
	});
	useIsoLayoutEffect(() => {
		if (parentContext?.onNestedDialogOpen) {
			if (open) parentContext.onNestedDialogOpen(ownNestedOpenDialogs + 1, ownNestedOpenDrawers + (isDrawer ? 1 : 0));
			else parentContext.onNestedDialogOpen(0, 0);
		}
		return () => {
			if (parentContext?.onNestedDialogOpen && open) parentContext.onNestedDialogOpen(0, 0);
		};
	}, [
		isDrawer,
		open,
		ownNestedOpenDialogs,
		ownNestedOpenDrawers,
		parentContext
	]);
	usePopupInteractionProps(store, {
		activeTriggerProps: dismiss.reference,
		inactiveTriggerProps: dismiss.trigger,
		popupProps: dismiss.floating,
		nestedOpenDialogCount: ownNestedOpenDialogs,
		nestedOpenDrawerCount: ownNestedOpenDrawers
	});
	return null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/root/DialogRootContext.mjs
var DialogRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useDialogRootContext(optional) {
	const store = import_react.useContext(DialogRootContext);
	if (!optional && store === void 0) throw new Error(formatErrorMessage(27));
	return store;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/store/DialogStore.mjs
var selectors$4 = {
	...popupStoreSelectors,
	modal: (state) => state.modal,
	nested: (state) => state.nested,
	nestedOpenDialogCount: (state) => state.nestedOpenDialogCount,
	nestedOpenDrawerCount: (state) => state.nestedOpenDrawerCount,
	disablePointerDismissal: (state) => state.disablePointerDismissal,
	openMethod: (state) => state.openMethod,
	descriptionElementId: (state) => state.descriptionElementId,
	titleElementId: (state) => state.titleElementId,
	viewportElement: (state) => state.viewportElement,
	role: (state) => state.role
};
/**
* The subset of `DialogStore` that detached handle-backed triggers rely on. Both the real
* `DialogStore` and the inert fallback store satisfy it, so a trigger can read from whichever
* store the handle currently exposes.
*/
var DialogStore = class extends ReactStore {
	constructor(initialState, floatingId, nested) {
		const triggerElements = new PopupTriggerMap();
		const state = createInitialState$2(initialState, triggerElements, floatingId, nested);
		super(state, createInitialContext$2(triggerElements), selectors$4);
	}
	setOpen = (nextOpen, eventDetails) => {
		eventDetails.preventUnmountOnClose = () => {
			this.set("preventUnmountingOnClose", true);
		};
		if (!nextOpen && eventDetails.trigger == null && this.state.activeTriggerId != null) eventDetails.trigger = this.state.activeTriggerElement ?? void 0;
		this.context.onOpenChange?.(nextOpen, eventDetails);
		if (eventDetails.isCanceled) return;
		this.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);
		this.update(createPopupOpenState(this.state, nextOpen, eventDetails.trigger));
	};
};
function createInitialState$2(initialState, triggerElements, floatingId, nested = false) {
	return {
		...createInitialPopupStoreState(triggerElements, floatingId, nested),
		modal: true,
		disablePointerDismissal: false,
		viewportElement: null,
		descriptionElementId: void 0,
		titleElementId: void 0,
		openMethod: null,
		nested: false,
		nestedOpenDialogCount: 0,
		nestedOpenDrawerCount: 0,
		role: "dialog",
		...initialState
	};
}
function createInitialContext$2(triggerElements) {
	return {
		popupRef: /*#__PURE__*/ import_react.createRef(),
		backdropRef: /*#__PURE__*/ import_react.createRef(),
		internalBackdropRef: /*#__PURE__*/ import_react.createRef(),
		outsidePressEnabledRef: { current: true },
		triggerElements,
		onOpenChange: void 0,
		onOpenChangeComplete: void 0
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/root/useRenderDialogRoot.mjs
function useRenderDialogRoot(mode, props) {
	const { children, open: openProp, defaultOpen = false, onOpenChange, onOpenChangeComplete, disablePointerDismissal: disablePointerDismissalProp = false, modal: modalProp = true, actionsRef, handle, triggerId: triggerIdProp, defaultTriggerId: defaultTriggerIdProp = null } = props;
	const isDrawer = mode === "drawer";
	const isAlertDialog = mode === "alert-dialog";
	const modal = isAlertDialog ? true : modalProp;
	const disablePointerDismissal = isAlertDialog || disablePointerDismissalProp;
	const role = isAlertDialog ? "alertdialog" : "dialog";
	const parentStore = useDialogRootContext(true);
	const rootState = {
		modal,
		disablePointerDismissal,
		nested: parentStore != null,
		role
	};
	const store = usePopupRootStore((floatingId, floatingNested) => new DialogStore({
		open: defaultOpen,
		openProp,
		activeTriggerId: defaultTriggerIdProp,
		triggerIdProp,
		...rootState
	}, floatingId, floatingNested), true);
	store.useControlledProp("openProp", openProp);
	store.useControlledProp("triggerIdProp", triggerIdProp);
	store.useSyncedValues(rootState);
	store.useContextCallback("onOpenChange", onOpenChange);
	store.useContextCallback("onOpenChangeComplete", onOpenChangeComplete);
	const open = store.useState("open");
	const mounted = store.useState("mounted");
	const payload = store.useState("payload");
	usePopupRootSync(store, open);
	useImplicitActiveTrigger(store);
	const { forceUnmount } = useOpenStateTransitions(open, store);
	import_react.useImperativeHandle(actionsRef, () => ({
		unmount: forceUnmount,
		close: () => store.setOpen(false, createChangeEventDetails(imperativeAction))
	}), [forceUnmount, store]);
	const shouldRenderInteractions = open || mounted;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(DialogRootContext.Provider, {
		value: store,
		children: [
			handle && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(PopupHandleAttachment, {
				handle,
				store
			}),
			shouldRenderInteractions && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(DialogInteractions, {
				store,
				parentContext: parentStore?.context,
				isDrawer
			}),
			typeof children === "function" ? children({ payload }) : children
		]
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/backdrop/DialogBackdrop.mjs
/**
* An overlay displayed beneath the popup.
* Renders a `<div>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogBackdrop = /*#__PURE__*/ import_react.forwardRef(function DialogBackdrop(componentProps, forwardedRef) {
	const { render, className, style, forceRender = false, ...elementProps } = componentProps;
	const store = useDialogRootContext();
	const open = store.useState("open");
	const nested = store.useState("nested");
	const mounted = store.useState("mounted");
	return useRenderElement("div", componentProps, {
		state: {
			open,
			transitionStatus: store.useState("transitionStatus")
		},
		ref: [store.context.backdropRef, forwardedRef],
		stateAttributesMapping: popupTransitionStateMapping,
		props: [{
			role: "presentation",
			hidden: !mounted,
			style: {
				userSelect: "none",
				WebkitUserSelect: "none"
			}
		}, elementProps],
		enabled: forceRender || !nested
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/close/DialogClose.mjs
/**
* A button that closes the dialog.
* Renders a `<button>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogClose = /*#__PURE__*/ import_react.forwardRef(function DialogClose(componentProps, forwardedRef) {
	const { render, className, style, disabled = false, nativeButton = true, ...elementProps } = componentProps;
	const store = useDialogRootContext();
	const open = store.useState("open");
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	const state = { disabled };
	function handleClick(event) {
		if (open) store.setOpen(false, createChangeEventDetails(closePress, event.nativeEvent));
	}
	return useRenderElement("button", componentProps, {
		state,
		ref: [forwardedRef, buttonRef],
		props: [
			{ onClick: handleClick },
			elementProps,
			getButtonProps
		]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/description/DialogDescription.mjs
/**
* A paragraph with additional information about the dialog.
* Renders a `<p>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogDescription = /*#__PURE__*/ import_react.forwardRef(function DialogDescription(componentProps, forwardedRef) {
	const { render, className, style, id: idProp, ...elementProps } = componentProps;
	const store = useDialogRootContext();
	const id = useBaseUiId(idProp);
	store.useSyncedValueWithCleanup("descriptionElementId", id);
	return useRenderElement("p", componentProps, {
		ref: forwardedRef,
		props: [{ id }, elementProps]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/portal/DialogPortalContext.mjs
var DialogPortalContext = /*#__PURE__*/ import_react.createContext(void 0);
function useDialogPortalContext() {
	const value = import_react.useContext(DialogPortalContext);
	if (value === void 0) throw new Error(formatErrorMessage(26));
	return value;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/composite.mjs
var ARROW_UP = "ArrowUp";
var ARROW_DOWN = "ArrowDown";
var ARROW_LEFT = "ArrowLeft";
var ARROW_RIGHT = "ArrowRight";
var HOME = "Home";
var PAGE_UP = "PageUp";
var PAGE_DOWN = "PageDown";
var COMPOSITE_KEYS = /* @__PURE__ */ new Set([
	ARROW_UP,
	ARROW_DOWN,
	ARROW_LEFT,
	ARROW_RIGHT,
	HOME,
	"End"
]);
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/popup/DialogPopupCssVars.mjs
/**
* Indicates how many dialogs are nested within.
* @type {number}
*/
var nestedDialogs = "--nested-dialogs";
/**
* Present when the dialog has other open dialogs nested within it.
*/
var nestedDialogOpen = "data-nested-dialog-open";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/utils/stateAttributesMapping.mjs
/**
* Shared by `Dialog.Popup` and `Dialog.Viewport`, whose states have the same shape.
* `nested` is not mapped: unmapped `true` booleans already render as `data-nested`.
*/
var dialogStateAttributesMapping = {
	...popupStateMapping,
	...transitionStatusMapping,
	nestedDialogOpen(value) {
		return value ? { [nestedDialogOpen]: "" } : null;
	}
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/popup/DialogPopup.mjs
/**
* A container for the dialog contents.
* Renders a `<div>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogPopup = /*#__PURE__*/ import_react.forwardRef(function DialogPopup(componentProps, forwardedRef) {
	const { render, className, style, finalFocus, initialFocus, ...elementProps } = componentProps;
	const store = useDialogRootContext();
	const descriptionElementId = store.useState("descriptionElementId");
	const disablePointerDismissal = store.useState("disablePointerDismissal");
	const floatingRootContext = store.useState("floatingRootContext");
	const rootPopupProps = store.useState("popupProps");
	const modal = store.useState("modal");
	const mounted = store.useState("mounted");
	const nested = store.useState("nested");
	const nestedOpenDialogCount = store.useState("nestedOpenDialogCount");
	const open = store.useState("open");
	const openMethod = store.useState("openMethod");
	const titleElementId = store.useState("titleElementId");
	const transitionStatus = store.useState("transitionStatus");
	const role = store.useState("role");
	const floatingId = floatingRootContext.useState("floatingId");
	useDialogPortalContext();
	useOpenChangeComplete({
		open,
		ref: store.context.popupRef,
		onComplete() {
			if (open) store.context.onOpenChangeComplete?.(true);
		}
	});
	const resolvedInitialFocus = initialFocus === void 0 ? createDefaultInitialFocus(store.context.popupRef) : initialFocus;
	const nestedDialogOpen = nestedOpenDialogCount > 0;
	const setPopupElement = store.useStateSetter("popupElement");
	const element = useRenderElement("div", componentProps, {
		state: {
			open,
			nested,
			transitionStatus,
			nestedDialogOpen
		},
		props: [
			rootPopupProps,
			{
				id: floatingId,
				"aria-labelledby": titleElementId,
				"aria-describedby": descriptionElementId,
				role,
				...FOCUSABLE_POPUP_PROPS,
				hidden: !mounted,
				onKeyDown(event) {
					if (COMPOSITE_KEYS.has(event.key)) event.stopPropagation();
				},
				style: { [nestedDialogs]: nestedOpenDialogCount }
			},
			elementProps
		],
		ref: [
			forwardedRef,
			store.context.popupRef,
			setPopupElement
		],
		stateAttributesMapping: dialogStateAttributesMapping
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingFocusManager, {
		context: floatingRootContext,
		openInteractionType: openMethod,
		disabled: !mounted,
		closeOnFocusOut: !disablePointerDismissal,
		initialFocus: resolvedInitialFocus,
		returnFocus: finalFocus,
		modal: modal !== false,
		restoreFocus: "popup",
		children: element
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/InternalBackdrop.mjs
/**
* @internal
*/
var InternalBackdrop = /*#__PURE__*/ import_react.forwardRef(function InternalBackdrop(props, ref) {
	const { cutout, ...otherProps } = props;
	let clipPath;
	if (cutout) {
		const rect = cutout.getBoundingClientRect();
		clipPath = `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${rect.left}px ${rect.top}px,${rect.left}px ${rect.bottom}px,${rect.right}px ${rect.bottom}px,${rect.right}px ${rect.top}px,${rect.left}px ${rect.top}px)`;
	}
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("div", {
		ref,
		role: "presentation",
		"data-base-ui-inert": "",
		...otherProps,
		style: {
			position: "fixed",
			inset: 0,
			userSelect: "none",
			WebkitUserSelect: "none",
			clipPath
		}
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/portal/DialogPortal.mjs
/**
* A portal element that moves the popup to a different part of the DOM.
* By default, the portal element is appended to `<body>`.
* Renders a `<div>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogPortal = /*#__PURE__*/ import_react.forwardRef(function DialogPortal(props, forwardedRef) {
	const { keepMounted = false, ...portalProps } = props;
	const store = useDialogRootContext();
	const mounted = store.useState("mounted");
	const modal = store.useState("modal");
	const open = store.useState("open");
	if (!(mounted || keepMounted)) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(DialogPortalContext.Provider, {
		value: keepMounted,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(FloatingPortal, {
			ref: forwardedRef,
			...portalProps,
			children: [mounted && modal === true && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(InternalBackdrop, {
				ref: store.context.internalBackdropRef,
				inert: inertValue(!open)
			}), props.children]
		})
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/title/DialogTitle.mjs
/**
* A heading that labels the dialog.
* Renders an `<h2>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogTitle = /*#__PURE__*/ import_react.forwardRef(function DialogTitle(componentProps, forwardedRef) {
	const { render, className, style, id: idProp, ...elementProps } = componentProps;
	const store = useDialogRootContext();
	const id = useBaseUiId(idProp);
	store.useSyncedValueWithCleanup("titleElementId", id);
	return useRenderElement("h2", componentProps, {
		ref: forwardedRef,
		props: [{ id }, elementProps]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useEnhancedClickHandler.mjs
/**
* Provides a cross-browser way to determine the type of the pointer used to click.
* Safari and Firefox do not provide the PointerEvent to the click handler (they use MouseEvent) yet.
* Additionally, this implementation detects if the click was triggered by the keyboard.
*
* @param handler The function to be called when the button is clicked. The first parameter is the original event and the second parameter is the pointer type.
*/
function useEnhancedClickHandler(handler) {
	const lastClickInteractionTypeRef = import_react.useRef("");
	const handlePointerDown = import_react.useCallback((event) => {
		if (event.defaultPrevented) return;
		lastClickInteractionTypeRef.current = event.pointerType;
		handler(event, event.pointerType);
	}, [handler]);
	return {
		onClick: import_react.useCallback((event) => {
			if (event.detail === 0) {
				handler(event, "keyboard");
				return;
			}
			if ("pointerType" in event) handler(event, event.pointerType);
			else handler(event, lastClickInteractionTypeRef.current);
			lastClickInteractionTypeRef.current = "";
		}, [handler]),
		onPointerDown: handlePointerDown
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useOpenInteractionType.mjs
function useOpenMethodTriggerProps(open, setOpenMethod) {
	const { onClick, onPointerDown } = useEnhancedClickHandler(useStableCallback((_, interactionType) => {
		if (!(typeof open === "function" ? open() : open)) setOpenMethod(interactionType || (ios ? "touch" : ""));
	}));
	return import_react.useMemo(() => ({
		onClick,
		onPointerDown
	}), [onClick, onPointerDown]);
}
/**
* Determines the interaction type (keyboard, mouse, touch, etc.) that opened the component.
*
* @param open The open state of the component.
*/
function useOpenInteractionType(open) {
	const [openMethod, setOpenMethod] = import_react.useState(null);
	const triggerProps = useOpenMethodTriggerProps(open, setOpenMethod);
	useValueChanged(open, (previousOpen) => {
		if (previousOpen && !open) setOpenMethod(null);
	});
	return import_react.useMemo(() => ({
		openMethod,
		triggerProps
	}), [openMethod, triggerProps]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/trigger/DialogTrigger.mjs
/**
* A button that opens the dialog.
* Renders a `<button>` element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogTrigger = fastComponentRef(function DialogTrigger(componentProps, forwardedRef) {
	const { render, className, style, disabled = false, nativeButton = true, id: idProp, payload, handle, ...elementProps } = componentProps;
	const dialogRootStore = useDialogRootContext(true);
	const store = usePopupHandleStore(handle) ?? dialogRootStore;
	if (!store) throw new Error(formatErrorMessage(79));
	const thisTriggerId = useBaseUiId(idProp);
	const floatingContext = store.useState("floatingRootContext");
	const isOpenedByThisTrigger = store.useState("isOpenedByTrigger", thisTriggerId);
	const popupId = store.useState("triggerPopupId", thisTriggerId);
	const triggerElementRef = import_react.useRef(null);
	const { registerTrigger, isMountedByThisTrigger } = useTriggerDataForwarding(thisTriggerId, triggerElementRef, store, { payload });
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	const click = useClick(floatingContext);
	const interactionTypeProps = useOpenMethodTriggerProps(() => store.select("open"), (interactionType) => {
		store.set("openMethod", interactionType);
	});
	const state = {
		disabled,
		open: isOpenedByThisTrigger
	};
	const rootTriggerProps = store.useState("triggerProps", isMountedByThisTrigger);
	return useRenderElement("button", componentProps, {
		state,
		ref: [
			buttonRef,
			forwardedRef,
			registerTrigger,
			triggerElementRef
		],
		props: [
			click.reference,
			rootTriggerProps,
			interactionTypeProps,
			{
				[CLICK_TRIGGER_IDENTIFIER]: "",
				id: thisTriggerId,
				"aria-haspopup": "dialog",
				"aria-expanded": isOpenedByThisTrigger,
				"aria-controls": popupId
			},
			elementProps,
			getButtonProps
		],
		stateAttributesMapping: triggerOpenStateMapping
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useOnFirstRender.mjs
function useOnFirstRender(fn) {
	const ref = import_react.useRef(true);
	if (ref.current) {
		ref.current = false;
		fn();
	}
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/gridNavigation.mjs
/**
* Positional arguments are deliberate: property names of an options object
* don't minify, and the signature is locked to the caller via `typeof` on the
* `grid` option of `useListNavigation`.
*
* The injected grid navigator only ever operates on a uniform 1x1 grid (sizes are
* always `1x1` and packing is never dense), so the cell-map machinery that supports
* multi-cell items collapses to an identity transform over the item list. Calling
* `getGridNavigatedIndex` directly keeps the cell-map helpers
* (`createGridCellMap`/`getGridCellIndexOfCorner`/`getGridCellIndices`) out of
* grid-combobox bundles.
*/
function gridNavigation(event, prevIndex, listRef, orientation, loopFocus, rtl, disabledIndices, minIndex, maxIndex, cols = 2) {
	const nextIndex = getGridNavigatedIndex(listRef.current, {
		event,
		orientation,
		loopFocus,
		rtl,
		cols,
		disabledIndices,
		minIndex,
		maxIndex,
		prevIndex: prevIndex > maxIndex ? minIndex : prevIndex,
		stopEvent: true
	});
	return isIndexOutOfListBounds(listRef.current, nextIndex) ? void 0 : nextIndex;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/root/ComboboxRootContext.mjs
var ComboboxRootContext = /*#__PURE__*/ import_react.createContext(void 0);
var ComboboxFloatingContext = /*#__PURE__*/ import_react.createContext(void 0);
var ComboboxDerivedItemsContext = /*#__PURE__*/ import_react.createContext(void 0);
var ComboboxHasItemsContext = /*#__PURE__*/ import_react.createContext(false);
var ComboboxInputValueContext = /*#__PURE__*/ import_react.createContext("");
function useComboboxRootContext() {
	const context = import_react.useContext(ComboboxRootContext);
	if (!context) throw new Error(formatErrorMessage(22));
	return context;
}
function useComboboxFloatingContext() {
	const context = import_react.useContext(ComboboxFloatingContext);
	if (!context) throw new Error(formatErrorMessage(23));
	return context;
}
function useComboboxDerivedItemsContext() {
	const context = import_react.useContext(ComboboxDerivedItemsContext);
	if (!context) throw new Error(formatErrorMessage(24));
	return context;
}
function useComboboxInputValueContext() {
	return import_react.useContext(ComboboxInputValueContext);
}
function useComboboxHasItemsContext() {
	return import_react.useContext(ComboboxHasItemsContext);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/areArraysEqual.mjs
/**
* Compares two arrays element-wise.
*
* The default comparison is `Object.is`, so `NaN` equals `NaN` and `0` does not equal `-0`.
*/
function areArraysEqual(array1, array2, itemComparer = Object.is) {
	const { length } = array1;
	if (length !== array2.length) return false;
	for (let i = 0; i < length; i += 1) if (!itemComparer(array1[i], array2[i])) return false;
	return true;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/itemEquality.mjs
var defaultItemEquality = (itemValue, selectedValue) => Object.is(itemValue, selectedValue);
function compareItemEquality(itemValue, selectedValue, comparer) {
	if (itemValue == null || selectedValue == null) return Object.is(itemValue, selectedValue);
	return comparer(itemValue, selectedValue);
}
function isSelectedValueDirty(currentValue, initialValue, comparer) {
	if (Array.isArray(currentValue) && Array.isArray(initialValue)) return !areArraysEqual(currentValue, initialValue, (itemValue, initialItemValue) => compareItemEquality(itemValue, initialItemValue, comparer));
	return currentValue !== initialValue;
}
function selectedValueIncludes(selectedValues, itemValue, comparer) {
	if (!selectedValues) return false;
	return selectedValues.some((selectedValue) => {
		if (selectedValue === void 0) return false;
		return compareItemEquality(itemValue, selectedValue, comparer);
	});
}
function findItemIndex(itemValues, selectedValue, comparer) {
	if (!itemValues) return -1;
	return itemValues.findIndex((itemValue) => {
		if (itemValue === void 0) return false;
		return compareItemEquality(itemValue, selectedValue, comparer);
	});
}
function createSelectionMatcher(selectedValues, comparer) {
	if (comparer !== defaultItemEquality) return (itemValue) => selectedValueIncludes(selectedValues, itemValue, comparer);
	const index = new Set(selectedValues);
	index.delete(void 0);
	return (itemValue) => index.has(itemValue) && (itemValue !== 0 || selectedValues.some((v) => Object.is(itemValue, v)));
}
function findSelectionIndex(itemValues, selectedValue, comparer, multiple) {
	const index = multiple && Array.isArray(selectedValue) ? itemValues.findIndex(createSelectionMatcher(selectedValue, comparer)) : findItemIndex(itemValues, selectedValue, comparer);
	return index === -1 ? null : index;
}
/** Resolves the first selected index as items register or change. */
function resolveSelectedIndex(index, itemValue, registry, selectedValues, comparer, currentIndex) {
	if (selectedValueIncludes(selectedValues, itemValue, comparer)) return currentIndex != null && index > currentIndex && selectedValueIncludes(selectedValues, registry[currentIndex], comparer) ? currentIndex : index;
	return index === currentIndex ? findSelectionIndex(registry, selectedValues, comparer, true) : currentIndex;
}
function removeItem(selectedValues, itemValue, comparer) {
	return selectedValues.filter((selectedValue) => !compareItemEquality(itemValue, selectedValue, comparer));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/serializeValue.mjs
function serializeValue(value) {
	if (value == null) return "";
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/resolveValueLabel.mjs
function isGroup(item) {
	return typeof item === "object" && item != null && Array.isArray(item.items);
}
function isGroupedItems(items) {
	return isGroup(items?.[0]);
}
function flattenLeafItems(items) {
	return isGroupedItems(items) ? items.flatMap((group) => group.items) : items;
}
/**
* Checks if the items array contains an item with a null value that has a non-null label.
*/
function hasNullItemLabel(items) {
	if (!Array.isArray(items)) return items != null && "null" in items;
	const arrayItems = items;
	if (isGroupedItems(arrayItems)) {
		for (const group of arrayItems) for (const item of group.items) if (item && item.value == null && item.label != null) return true;
		return false;
	}
	for (const item of arrayItems) if (item && item.value == null && item.label != null) return true;
	return false;
}
function stringifyAsLabel(item, itemToStringLabel) {
	if (itemToStringLabel && item != null) return itemToStringLabel(item) ?? "";
	if (item && typeof item === "object") {
		if ("label" in item && item.label != null) return String(item.label);
		if ("value" in item) return String(item.value);
	}
	return serializeValue(item);
}
function stringifyAsValue(item, itemToStringValue) {
	if (itemToStringValue && item != null) return itemToStringValue(item) ?? "";
	if (item && typeof item === "object" && "value" in item && "label" in item) return serializeValue(item.value);
	return serializeValue(item);
}
function resolveSelectedLabel(value, items, itemToStringLabel) {
	function fallback() {
		return stringifyAsLabel(value, itemToStringLabel);
	}
	if (itemToStringLabel && value != null) return itemToStringLabel(value);
	if (value && typeof value === "object" && "label" in value && value.label != null) return value.label;
	if (items && !Array.isArray(items)) return (Object.hasOwn(items, value) ? items[value] : void 0) ?? fallback();
	if (Array.isArray(items)) {
		const flatItems = flattenLeafItems(items);
		if (value == null || typeof value !== "object") {
			const match = flatItems.find((item) => item.value === value);
			if (match && match.label != null) return match.label;
			return fallback();
		}
		if ("value" in value) {
			const match = flatItems.find((item) => item && item.value === value.value);
			if (match && match.label != null) return match.label;
		}
	}
	return fallback();
}
function resolveMultipleLabels(values, items, itemToStringLabel) {
	return values.reduce((acc, value, index) => {
		if (index > 0) acc.push(", ");
		acc.push(/*#__PURE__*/ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: resolveSelectedLabel(value, items, itemToStringLabel) }, index));
		return acc;
	}, []);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/store.mjs
/**
* Non-reactive values shared with the combobox parts. Nothing here is observable through
* `selectors`, so writing to a ref never notifies subscribers.
*/
var selectors$3 = {
	id: (state) => state.id,
	labelId: (state) => state.labelId,
	items: (state) => state.items,
	selectedValue: (state) => state.selectedValue,
	hasSelectionChips: (state) => {
		const selectedValue = state.selectedValue;
		return Array.isArray(selectedValue) && selectedValue.length > 0;
	},
	hasSelectedValue: (state) => {
		const { selectedValue, selectionMode } = state;
		if (selectedValue == null) return false;
		if (selectionMode === "multiple" && Array.isArray(selectedValue)) return selectedValue.length > 0;
		return true;
	},
	hasNullItemLabel: (state, enabled) => {
		return enabled ? hasNullItemLabel(state.items) : false;
	},
	open: (state) => state.open,
	mounted: (state) => state.mounted,
	forceMounted: (state) => state.forceMounted,
	inline: (state) => state.inline,
	activeIndex: (state) => state.activeIndex,
	selectedIndex: (state) => state.selectedIndex,
	isActive: (state, index) => state.activeIndex === index,
	isSelected: (state, itemValue) => {
		const comparer = state.isItemEqualToValue;
		const selectedValue = state.selectedValue;
		if (Array.isArray(selectedValue)) return selectedValue.some((selectedItem) => compareItemEquality(itemValue, selectedItem, comparer));
		return compareItemEquality(itemValue, selectedValue, comparer);
	},
	transitionStatus: (state) => state.transitionStatus,
	popupProps: (state) => state.popupProps,
	listProps: (state) => state.listProps,
	inputProps: (state) => state.inputProps,
	triggerProps: (state) => state.triggerProps,
	itemProps: (state) => state.itemProps,
	positionerElement: (state) => state.positionerElement,
	listElement: (state) => state.listElement,
	popupId: (state) => state.popupId,
	triggerElement: (state) => state.triggerElement,
	inputElement: (state) => state.inputElement,
	inputGroupElement: (state) => state.inputGroupElement,
	popupSide: (state) => state.popupSide,
	openMethod: (state) => state.openMethod,
	inputInsidePopup: (state) => state.inputInsidePopup,
	inputOwnsFormValue: (state) => state.inputOwnsFormValue,
	selectionMode: (state) => state.selectionMode,
	name: (state) => state.name,
	form: (state) => state.form,
	disabled: (state) => state.disabled,
	readOnly: (state) => state.readOnly,
	required: (state) => state.required,
	grid: (state) => state.grid,
	virtualized: (state) => state.virtualized,
	itemToStringLabel: (state) => state.itemToStringLabel,
	isItemEqualToValue: (state) => state.isItemEqualToValue,
	modal: (state) => state.modal,
	autoHighlight: (state) => state.autoHighlight
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/root/utils/index.mjs
/**
* Derives the default id assigned to `Combobox.Popup` when the input is rendered inside it.
* Shared by the popup (which applies it) and the trigger (which references it via `aria-controls`)
* so the convention only lives in one place.
*/
function getComboboxPopupId(rootId) {
	return rootId == null ? void 0 : `${rootId}-popup`;
}
/**
* Enhanced filter using Intl.Collator for more robust string matching.
* Uses the provided `itemToStringLabel` function if available, otherwise falls back to:
* • When `item` is an object with a `value` property, that property is used.
* • When `item` is a primitive (e.g. `string`), it is used directly.
*/
function createCollatorItemFilter(collatorFilter, itemToStringLabel) {
	return (item, query) => {
		if (item == null) return false;
		return collatorFilter.contains(item, query, itemToStringLabel);
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/stringifyLocale.mjs
function stringifyLocale(locale) {
	if (Array.isArray(locale)) return locale.map((value) => stringifyLocale(value)).join(",");
	if (locale == null) return "";
	return String(locale);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/filter.mjs
var filterCache = /* @__PURE__ */ new Map();
function getFilter(options = {}) {
	const mergedOptions = {
		usage: "search",
		sensitivity: "base",
		ignorePunctuation: true,
		...options
	};
	const cacheKey = `${stringifyLocale(options.locale)}|${JSON.stringify(mergedOptions)}`;
	const cachedFilter = filterCache.get(cacheKey);
	if (cachedFilter) return cachedFilter;
	const collator = new Intl.Collator(options.locale, mergedOptions);
	const filter = {
		contains(item, query, itemToString) {
			if (!query) return true;
			const itemString = stringifyAsLabel(item, itemToString);
			for (let i = 0; i <= itemString.length - query.length; i += 1) if (collator.compare(itemString.slice(i, i + query.length), query) === 0) return true;
			return false;
		},
		startsWith(item, query, itemToString) {
			if (!query) return true;
			const itemString = stringifyAsLabel(item, itemToString);
			return collator.compare(itemString.slice(0, query.length), query) === 0;
		},
		endsWith(item, query, itemToString) {
			if (!query) return true;
			const itemString = stringifyAsLabel(item, itemToString);
			const queryLength = query.length;
			return itemString.length >= queryLength && collator.compare(itemString.slice(itemString.length - queryLength), query) === 0;
		}
	};
	filterCache.set(cacheKey, filter);
	return filter;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/root/utils/useFilter.mjs
/**
* Matches items against a query using `Intl.Collator` for robust string matching.
*/
var useCoreFilter = getFilter;
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/scrollable.mjs
function isScrollableY(element, allowOverflowIntent = false) {
	const { overflowY } = getComputedStyle$1(element);
	if (overflowY !== "auto" && overflowY !== "scroll") return false;
	return allowOverflowIntent ? element.clientHeight > 0 : element.scrollHeight > element.clientHeight;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/root/utils/constants.mjs
var NO_ACTIVE_VALUE = Symbol("none");
var INITIAL_LAST_HIGHLIGHT = {
	value: NO_ACTIVE_VALUE,
	index: -1
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/items/itemCollection.mjs
function findCollectionItem(valueToItem, itemValue, isEqual) {
	const exactItem = valueToItem.get(itemValue);
	if (exactItem !== void 0 || isEqual === defaultItemEquality) return exactItem;
	for (const [derivedValue, item] of valueToItem) if (compareItemEquality(derivedValue, itemValue, isEqual)) return item;
}
/**
* An opaque collection created by `createItems()`.
*
* It carries the source item and derived value types so the root can infer the list item and
* selection value types.
*
* Pass it directly to the root's `items` prop; it has no public members.
*/
/**
* Internal shape of a collection. The extra members let the root project items to
* their values and resolve a selected value back to its label while items are unmounted.
*/
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/root/AriaCombobox.mjs
/**
* @internal
*/
function AriaCombobox(props) {
	const { id: idProp, onOpenChangeComplete: onOpenChangeCompleteProp, defaultSelectedValue = null, selectedValue: selectedValueProp, onSelectedValueChange, defaultInputValue, inputValue: inputValueProp, open: openProp, defaultOpen = false, selectionMode, onItemHighlighted: onItemHighlightedProp, name: nameProp, form, disabled: disabledProp = false, readOnly = false, required = false, inputRef: inputRefProp, grid = false, items: itemsProp, filteredItems: filteredItemsProp, filter: filterProp, filterQuery: filterQueryProp, openOnInputClick = true, autoHighlight = false, keepHighlight = false, highlightItemOnHover = true, loopFocus = true, itemToStringLabel: itemToStringLabelProp, itemToStringValue, isItemEqualToValue = defaultItemEquality, virtualized = false, inline: inlineProp = false, fillInputOnItemPress = true, modal = false, limit = -1, autoComplete = "list", formAutoComplete, locale, submitOnItemClick = false } = props;
	const { clearErrors } = useFormContext();
	const { setDirty, validityData, setFilled, name: fieldName, disabled: fieldDisabled, setTouched, setFocused, validationMode, validation } = useFieldRootContext();
	const direction = useDirection();
	const id = useLabelableId({ id: idProp });
	const collatorFilter = useCoreFilter({ locale });
	const collection = Array.isArray(itemsProp) ? null : itemsProp;
	if (collection && typeof collection.label !== "function") throw new Error(formatErrorMessage(100));
	const items = collection ? collection.data : itemsProp;
	const itemToValue = collection?.value;
	const storeItems = itemToValue ? void 0 : items;
	const externalWindow = import_react.useMemo(() => {
		if (!filteredItemsProp || !itemToValue) return;
		const flat = flattenLeafItems(filteredItemsProp);
		const values = flat.map(itemToValue);
		let valueToItem;
		return {
			values,
			findItem(itemValue, isEqual) {
				if (!valueToItem) {
					valueToItem = /* @__PURE__ */ new Map();
					for (let i = 0; i < values.length; i += 1) if (!valueToItem.has(values[i])) valueToItem.set(values[i], flat[i]);
				}
				return findCollectionItem(valueToItem, itemValue, isEqual);
			}
		};
	}, [filteredItemsProp, itemToValue]);
	const itemToStringLabel = import_react.useMemo(() => {
		if (!collection) return itemToStringLabelProp;
		return (itemValue) => {
			return collection.label(itemValue, isItemEqualToValue, (unresolvedValue) => {
				const externalItem = externalWindow?.findItem(unresolvedValue, isItemEqualToValue);
				if (externalItem != null) return collection.itemLabel(externalItem);
				return stringifyAsLabel(unresolvedValue, itemToStringLabelProp);
			});
		};
	}, [
		collection,
		itemToStringLabelProp,
		externalWindow,
		isItemEqualToValue
	]);
	const filterItemToString = import_react.useMemo(() => {
		if (!collection) return itemToStringLabelProp;
		return Object.assign((item) => collection.itemLabel(item), { selected: (value) => stringifyAsLabel(value, itemToStringLabel) });
	}, [
		collection,
		itemToStringLabel,
		itemToStringLabelProp
	]);
	function stringifyValueLabel(item) {
		return stringifyAsLabel(item, itemToStringLabel);
	}
	const [queryChangedAfterOpen, setQueryChangedAfterOpen] = import_react.useState(false);
	const [closeQuery, setCloseQuery] = import_react.useState(null);
	const previousCloseQueryRef = import_react.useRef(closeQuery);
	const listRef = import_react.useRef([]);
	const labelsRef = import_react.useRef([]);
	const popupRef = import_react.useRef(null);
	const inputRef = import_react.useRef(null);
	const startDismissRef = import_react.useRef(null);
	const endDismissRef = import_react.useRef(null);
	const emptyRef = import_react.useRef(null);
	const keyboardActiveRef = import_react.useRef(true);
	const hadInputClearRef = import_react.useRef(false);
	const chipsContainerRef = import_react.useRef(null);
	const clearRef = import_react.useRef(null);
	const selectionEventRef = import_react.useRef(null);
	const lastHighlightRef = import_react.useRef(INITIAL_LAST_HIGHLIGHT);
	const pendingQueryHighlightRef = import_react.useRef(null);
	/**
	* Contains the currently visible list of item values post-filtering.
	*/
	const valuesRef = import_react.useRef([]);
	/**
	* The item element that received the last `pointerdown`, used to detect whether a
	* `mouseup` on an item belongs to a drag-select gesture that started elsewhere.
	*/
	const pointerDownItemRef = import_react.useRef(null);
	const disabled = fieldDisabled || disabledProp;
	const name = fieldName ?? nameProp;
	const multiple = selectionMode === "multiple";
	const single = selectionMode === "single";
	const hasInputValue = inputValueProp !== void 0 || defaultInputValue !== void 0;
	const hasItems = items !== void 0;
	const hasFilteredItemsProp = filteredItemsProp !== void 0;
	let autoHighlightMode;
	if (autoHighlight === "always") autoHighlightMode = "always";
	else autoHighlightMode = autoHighlight ? "input-change" : false;
	const [selectedValue, setSelectedValueUnwrapped] = useControlled({
		controlled: selectedValueProp,
		default: multiple ? defaultSelectedValue ?? EMPTY_ARRAY : defaultSelectedValue,
		name: "Combobox",
		state: "selectedValue"
	});
	const filter = import_react.useMemo(() => {
		if (filterProp === null) return () => true;
		if (filterProp !== void 0) return filterProp;
		return createCollatorItemFilter(collatorFilter, filterItemToString);
	}, [
		filterProp,
		collatorFilter,
		filterItemToString
	]);
	const initialDefaultInputValue = useRefWithInit(() => {
		if (hasInputValue) return defaultInputValue ?? "";
		if (single) return stringifyValueLabel(selectedValue);
		return "";
	}).current;
	const [inputValue, setInputValueUnwrapped] = useControlled({
		controlled: inputValueProp,
		default: initialDefaultInputValue,
		name: "Combobox",
		state: "inputValue"
	});
	const [open, setOpenUnwrapped] = useControlled({
		controlled: openProp,
		default: defaultOpen,
		name: "Combobox",
		state: "open"
	});
	const isGrouped = isGroupedItems(items);
	const query = !open && closeQuery !== null ? closeQuery : String(inputValue).trim();
	const selectedLabelString = single ? stringifyValueLabel(selectedValue) : "";
	const shouldBypassFiltering = single && !queryChangedAfterOpen && query !== "" && selectedLabelString.length === query.length && collatorFilter.contains(selectedLabelString, query);
	const filterQuery = shouldBypassFiltering ? "" : filterQueryProp ?? query;
	const shouldIgnoreExternalFiltering = hasItems && hasFilteredItemsProp && shouldBypassFiltering && (!collection || collection.hasValue(selectedValue, isItemEqualToValue));
	const flatItems = import_react.useMemo(() => items ? flattenLeafItems(items) : EMPTY_ARRAY, [items]);
	const filteredItems = import_react.useMemo(() => {
		if (filteredItemsProp && !shouldIgnoreExternalFiltering) return filteredItemsProp;
		if (!items) return EMPTY_ARRAY;
		if (isGrouped) {
			const groupedItems = items;
			const resultingGroups = [];
			let currentCount = 0;
			for (const group of groupedItems) {
				if (limit > -1 && currentCount >= limit) break;
				const remainingLimit = limit > -1 ? limit - currentCount : Infinity;
				const itemsToTake = filterQuery === "" ? group.items.slice(0, remainingLimit) : [];
				if (filterQuery !== "") for (const item of group.items) {
					if (itemsToTake.length >= remainingLimit) break;
					if (filter(item, filterQuery, filterItemToString)) itemsToTake.push(item);
				}
				if (itemsToTake.length > 0) {
					const newGroup = {
						...group,
						items: itemsToTake
					};
					resultingGroups.push(newGroup);
					currentCount += itemsToTake.length;
				}
			}
			return resultingGroups;
		}
		if (filterQuery === "") return limit > -1 ? flatItems.slice(0, limit) : flatItems;
		const limitedItems = [];
		for (const item of flatItems) {
			if (limit > -1 && limitedItems.length >= limit) break;
			if (filter(item, filterQuery, filterItemToString)) limitedItems.push(item);
		}
		return limitedItems;
	}, [
		filteredItemsProp,
		shouldIgnoreExternalFiltering,
		items,
		isGrouped,
		filterQuery,
		limit,
		filter,
		filterItemToString,
		flatItems
	]);
	/**
	* The filtered items flattened across groups and projected to their selection values.
	*/
	const flatFilteredValues = import_react.useMemo(() => {
		if (externalWindow && filteredItems === filteredItemsProp) return externalWindow.values;
		const flat = flattenLeafItems(filteredItems);
		return itemToValue ? flat.map((item) => itemToValue(item)) : flat;
	}, [
		filteredItems,
		filteredItemsProp,
		externalWindow,
		itemToValue
	]);
	const store = useRefWithInit(() => {
		let initialSelectedIndex = null;
		if (inlineProp && open && hasItems && selectionMode !== "none") initialSelectedIndex = findSelectionIndex(flatFilteredValues, selectedValue, isItemEqualToValue, multiple);
		return new ReactStore({
			id,
			labelId: void 0,
			selectedValue,
			open,
			items: storeItems,
			selectionMode,
			name,
			form,
			disabled,
			readOnly,
			required,
			grid,
			virtualized,
			openOnInputClick,
			itemToStringLabel,
			isItemEqualToValue,
			modal,
			autoHighlight: autoHighlightMode,
			submitOnItemClick,
			hasInputValue,
			mounted: false,
			forceMounted: false,
			transitionStatus: "idle",
			inline: inlineProp,
			activeIndex: null,
			selectedIndex: initialSelectedIndex,
			popupProps: {},
			listProps: {},
			inputProps: {},
			triggerProps: {},
			itemProps: EMPTY_OBJECT,
			positionerElement: null,
			listElement: null,
			popupId: void 0,
			triggerElement: null,
			inputElement: null,
			inputGroupElement: null,
			popupSide: null,
			openMethod: null,
			inputInsidePopup: true,
			inputOwnsFormValue: selectionMode === "none"
		}, {
			onOpenChangeComplete: NOOP,
			setOpen: NOOP,
			setInputValue: NOOP,
			setSelectedValue: NOOP,
			setIndices: NOOP,
			handleSelection: NOOP,
			forceMount: NOOP,
			requestSubmit: NOOP,
			listRef,
			labelsRef,
			popupRef,
			emptyRef,
			inputRef,
			startDismissRef,
			endDismissRef,
			keyboardActiveRef,
			chipsContainerRef,
			clearRef,
			valuesRef,
			pointerDownItemRef,
			selectionEventRef
		}, selectors$3);
	}).current;
	const fieldRawValue = selectionMode === "none" ? inputValue : selectedValue;
	const fieldStringValue = import_react.useMemo(() => {
		if (selectionMode === "none") return fieldRawValue;
		if (Array.isArray(selectedValue)) return selectedValue.map((value) => stringifyAsValue(value, itemToStringValue));
		return stringifyAsValue(selectedValue, itemToStringValue);
	}, [
		fieldRawValue,
		itemToStringValue,
		selectionMode,
		selectedValue
	]);
	const onItemHighlighted = useStableCallback(onItemHighlightedProp);
	const onOpenChangeComplete = useStableCallback(onOpenChangeCompleteProp);
	const activeIndex = store.useState("activeIndex");
	const selectedIndex = store.useState("selectedIndex");
	const positionerElement = store.useState("positionerElement");
	const listElement = store.useState("listElement");
	const triggerElement = store.useState("triggerElement");
	const inputElement = store.useState("inputElement");
	const inputGroupElement = store.useState("inputGroupElement");
	const inline = store.useState("inline");
	const inputInsidePopup = store.useState("inputInsidePopup");
	const inputOwnsFormValue = store.useState("inputOwnsFormValue");
	const inputMatchesSelectedValue = single && !inputInsidePopup && inputValue === selectedLabelString;
	const triggerRef = useValueAsRef(triggerElement);
	const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
	const { openMethod, triggerProps } = useOpenInteractionType(open);
	const getStringifiedValueForForm = useStableCallback(() => fieldStringValue);
	useRegisterFieldControl(inputInsidePopup ? triggerRef : inputRef, id, fieldRawValue, getStringifiedValueForForm, !disabled, nameProp);
	const forceMount = useStableCallback(() => {
		if (items) labelsRef.current = flatFilteredValues.map(stringifyValueLabel);
		else store.set("forceMounted", true);
	});
	/**
	* Emits `onItemHighlighted` for the item at `index`, or clears the highlight when `index` is `-1`
	* (a no-op if nothing was highlighted). Keeps `lastHighlightRef` in sync with what was emitted.
	*/
	const emitHighlight = useStableCallback((value, index, type) => {
		if (index === -1) {
			if (lastHighlightRef.current === INITIAL_LAST_HIGHLIGHT) return;
			lastHighlightRef.current = INITIAL_LAST_HIGHLIGHT;
		} else lastHighlightRef.current = {
			value,
			index
		};
		onItemHighlighted(value, createGenericEventDetails(type, void 0, { index }));
	});
	const setIndices = useStableCallback((options) => {
		const update = {};
		if (options.activeIndex !== void 0) update.activeIndex = options.activeIndex;
		if (options.selectedIndex !== void 0) update.selectedIndex = options.selectedIndex;
		store.update(update);
		const activeIndexOption = options.activeIndex;
		if (activeIndexOption === void 0) return;
		const type = options.type || "none";
		if (activeIndexOption === null) emitHighlight(void 0, -1, type);
		else emitHighlight(valuesRef.current[activeIndexOption], activeIndexOption, type);
	});
	const setInputValue = useStableCallback((next, eventDetails) => {
		props.onInputValueChange?.(next, eventDetails);
		if (eventDetails.isCanceled) return;
		hadInputClearRef.current = eventDetails.reason === inputClear;
		if (eventDetails.reason === "input-change") {
			if (open && closeQuery !== null) setCloseQuery(null);
			const event = eventDetails.event;
			const inputType = event.inputType;
			if (event.type === "compositionend" || inputType != null && inputType !== "" && inputType !== "insertReplacementText") {
				const hasQuery = next.trim() !== "";
				if (hasQuery) setQueryChangedAfterOpen(true);
				pendingQueryHighlightRef.current = { hasQuery };
				const list = store.state.listElement;
				if (!store.state.virtualized && list) {
					const popup = popupRef.current;
					for (const ancestor of getOverflowAncestors(list.firstElementChild ?? list)) {
						if (!isHTMLElement(ancestor) || (popup ? !contains(popup, ancestor) : ancestor.getAttribute("role") === "dialog")) break;
						if (isScrollableY(ancestor)) {
							ancestor.scrollTop = 0;
							break;
						}
					}
				}
				if (hasQuery && autoHighlightMode && store.state.activeIndex == null && (open || inline)) store.set("activeIndex", 0);
			}
		} else if (eventDetails.reason === "input-clear" && next === "" && store.state.inputInsidePopup) pendingQueryHighlightRef.current = {
			hasQuery: false,
			selection: true
		};
		setInputValueUnwrapped(next);
	});
	const handleInterruptedReopen = useStableCallback((isInputChange) => {
		const clearsPendingInput = !isInputChange && inputInsidePopup && !inline && inputValue !== "" && (String(inputValue).trim() === closeQuery || inputValue === selectedLabelString);
		if (!isInputChange && (clearsPendingInput || inputValue === "" || inputMatchesSelectedValue)) setQueryChangedAfterOpen(false);
		setCloseQuery(null);
		if (clearsPendingInput) setInputValue("", createChangeEventDetails(inputClear));
	});
	const setOpen = useStableCallback((nextOpen, eventDetails) => {
		if (open === nextOpen) return;
		if (eventDetails.reason === "escape-key" && hasItems && flatFilteredValues.length === 0 && !emptyRef.current) eventDetails.allowPropagation();
		props.onOpenChange?.(nextOpen, eventDetails);
		if (eventDetails.isCanceled) return;
		if (nextOpen && closeQuery !== null) handleInterruptedReopen(eventDetails.reason === inputChange);
		if (!nextOpen && queryChangedAfterOpen) {
			if (single) {
				if (!inline) setCloseQuery(query);
				if (query === "") setQueryChangedAfterOpen(false);
			} else if (multiple) {
				if (!inline) setCloseQuery(query);
				if (inputInsidePopup) setIndices({ activeIndex: null });
				if (!inputInsidePopup || inline) setInputValue("", createChangeEventDetails(inputClear, eventDetails.event, void 0, { isItemPress: eventDetails.reason === itemPress }));
			}
		}
		setOpenUnwrapped(nextOpen);
		if (!nextOpen && inputInsidePopup && (eventDetails.reason === "focus-out" || eventDetails.reason === "outside-press")) {
			setTouched(true);
			setFocused(false);
			if (validationMode === "onBlur") {
				const valueToValidate = selectionMode === "none" ? inputValue : selectedValue;
				validation.commit(valueToValidate);
			}
		}
	});
	const setSelectedValue = useStableCallback((nextValue, eventDetails) => {
		onSelectedValueChange?.(nextValue, eventDetails);
		if (eventDetails.isCanceled) return;
		setSelectedValueUnwrapped(nextValue);
		if (selectionMode === "none" && popupRef.current && fillInputOnItemPress || single && !store.state.inputInsidePopup) setInputValue(stringifyValueLabel(nextValue), createChangeEventDetails(eventDetails.reason, eventDetails.event));
	});
	const handleSelection = useStableCallback((event, itemValue) => {
		const targetEl = getTarget(event);
		const overrideEvent = selectionEventRef.current ?? event;
		selectionEventRef.current = null;
		const eventDetails = createChangeEventDetails(itemPress, overrideEvent);
		const href = targetEl?.closest("a")?.getAttribute("href");
		if (href) {
			if (href.startsWith("#")) setOpen(false, eventDetails);
			return;
		}
		if (multiple) {
			const currentSelectedValue = Array.isArray(selectedValue) ? selectedValue : [];
			const isCurrentlySelected = selectedValueIncludes(currentSelectedValue, itemValue, isItemEqualToValue);
			const nextValue = isCurrentlySelected ? removeItem(currentSelectedValue, itemValue, isItemEqualToValue) : [...currentSelectedValue, itemValue];
			setSelectedValue(nextValue, eventDetails);
			if (eventDetails.isCanceled) return;
			if (!(inputRef.current ? inputRef.current.value.trim() !== "" : false)) return;
			if (store.state.inputInsidePopup) {
				setInputValue("", createChangeEventDetails(inputClear, eventDetails.event, void 0, { isItemPress: true }));
				const pendingHighlight = pendingQueryHighlightRef.current;
				if (pendingHighlight && !isCurrentlySelected) pendingHighlight.toggledValue = itemValue;
			} else setOpen(false, eventDetails);
		} else {
			setSelectedValue(itemValue, eventDetails);
			if (eventDetails.isCanceled) return;
			setOpen(false, eventDetails);
		}
	});
	const requestSubmit = useStableCallback(() => {
		const formElement = validation.inputRef.current?.form ?? store.state.inputElement?.form;
		if (formElement && typeof formElement.requestSubmit === "function") formElement.requestSubmit();
	});
	const handleUnmount = useStableCallback(() => {
		setMounted(false);
		onOpenChangeComplete?.(false);
		setQueryChangedAfterOpen(false);
		setCloseQuery(null);
		if (selectionMode === "none") setIndices({
			activeIndex: null,
			selectedIndex: null
		});
		else setIndices({ activeIndex: null });
		if (multiple && inputRef.current && inputRef.current.value !== "" && !hadInputClearRef.current) setInputValue("", createChangeEventDetails(inputClear));
		if (single) {
			if (store.state.inputInsidePopup) {
				if (inputRef.current && inputRef.current.value !== "") setInputValue("", createChangeEventDetails(inputClear));
			} else {
				const stringVal = stringifyValueLabel(selectedValue);
				if (inputRef.current && inputRef.current.value !== stringVal) setInputValue(stringVal, createChangeEventDetails(stringVal === "" ? inputClear : none));
			}
		}
	});
	const resolvedPopupRef = import_react.useMemo(() => {
		if (inline && positionerElement) return { current: positionerElement.closest("[role=\"dialog\"]") };
		return popupRef;
	}, [inline, positionerElement]);
	useOpenChangeComplete({
		enabled: !props.actionsRef,
		open,
		ref: resolvedPopupRef,
		onComplete() {
			if (!open) handleUnmount();
		}
	});
	import_react.useImperativeHandle(props.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);
	useIsoLayoutEffect(function syncSelectedIndex() {
		const closeQueryReleased = previousCloseQueryRef.current !== null && closeQuery === null;
		previousCloseQueryRef.current = closeQuery;
		if (open && (!closeQueryReleased || !hasItems)) return;
		if (!open) pointerDownItemRef.current = null;
		if (selectionMode === "none") return;
		const registry = hasItems ? flatFilteredValues : valuesRef.current;
		setIndices({ selectedIndex: findSelectionIndex(registry, selectedValue, isItemEqualToValue, multiple) });
	}, [
		open,
		closeQuery,
		selectedValue,
		selectionMode,
		multiple,
		hasItems,
		flatFilteredValues,
		isItemEqualToValue,
		setIndices
	]);
	useIsoLayoutEffect(() => {
		if (items) {
			valuesRef.current = flatFilteredValues;
			listRef.current.length = flatFilteredValues.length;
		}
	}, [items, flatFilteredValues]);
	useIsoLayoutEffect(() => {
		const pendingHighlight = pendingQueryHighlightRef.current;
		if (pendingHighlight) {
			const listIsNavigable = open || inline || store.state.positionerElement?.hidden === false;
			if (pendingHighlight.hasQuery) {
				if (autoHighlightMode && listIsNavigable) store.set("activeIndex", 0);
				pendingQueryHighlightRef.current = null;
			} else if (String(inputValue).trim() === "") {
				pendingQueryHighlightRef.current = null;
				if (listIsNavigable) {
					const clearedBySelection = pendingHighlight.selection;
					if (autoHighlightMode === "always" && !clearedBySelection && store.state.selectionMode === "none") store.set("activeIndex", 0);
					queueMicrotask(() => {
						if (!store.state.open && !store.state.inline || inputRef.current && inputRef.current.value.trim() !== "") return;
						const currentSelectedValue = store.state.selectedValue;
						const isMultiple = store.state.selectionMode === "multiple";
						if (isMultiple && Array.isArray(currentSelectedValue) ? currentSelectedValue.length > 0 : store.state.selectionMode !== "none" && currentSelectedValue != null) {
							const registry = hasItems || hasFilteredItemsProp ? flatFilteredValues : valuesRef.current;
							const toggledIndex = findItemIndex(registry, pendingHighlight.toggledValue, store.state.isItemEqualToValue);
							store.set("activeIndex", toggledIndex !== -1 ? toggledIndex : findSelectionIndex(registry, currentSelectedValue, store.state.isItemEqualToValue, isMultiple));
						} else if (clearedBySelection) store.set("activeIndex", null);
						else if (autoHighlightMode === "always") store.set("activeIndex", 0);
					});
				}
			}
		}
		if (!open && !inline) return;
		const candidateItems = hasItems || hasFilteredItemsProp ? flatFilteredValues : valuesRef.current;
		const storeActiveIndex = store.state.activeIndex;
		if (storeActiveIndex == null) {
			if (autoHighlightMode === "always" && candidateItems.length > 0) {
				store.set("activeIndex", 0);
				return;
			}
			emitHighlight(void 0, -1, none);
			return;
		}
		if (storeActiveIndex >= candidateItems.length) {
			emitHighlight(void 0, -1, none);
			store.set("activeIndex", null);
			return;
		}
		const itemValue = candidateItems[storeActiveIndex];
		const previouslyHighlightedItemValue = lastHighlightRef.current.value;
		const isSameItem = previouslyHighlightedItemValue !== NO_ACTIVE_VALUE && compareItemEquality(itemValue, previouslyHighlightedItemValue, store.state.isItemEqualToValue);
		if (lastHighlightRef.current.index !== storeActiveIndex || !isSameItem) emitHighlight(itemValue, storeActiveIndex, none);
	}, [
		activeIndex,
		autoHighlightMode,
		emitHighlight,
		hasFilteredItemsProp,
		hasItems,
		flatFilteredValues,
		inline,
		open,
		store,
		inputValue
	]);
	useIsoLayoutEffect(() => {
		if (selectionMode === "none") {
			setFilled(String(inputValue) !== "");
			return;
		}
		setFilled(multiple ? Array.isArray(selectedValue) && selectedValue.length > 0 : selectedValue != null);
	}, [
		setFilled,
		selectionMode,
		inputValue,
		selectedValue,
		multiple
	]);
	import_react.useEffect(() => {
		if (hasItems && autoHighlightMode && flatFilteredValues.length === 0) setIndices({ activeIndex: null });
	}, [
		hasItems,
		autoHighlightMode,
		flatFilteredValues.length,
		setIndices
	]);
	function handleQueryChanged() {
		if (open && query !== "" && query !== String(initialDefaultInputValue) && !inputMatchesSelectedValue) setQueryChangedAfterOpen(true);
	}
	function handleOpenChanged() {
		if (open && closeQuery !== null) handleInterruptedReopen(false);
	}
	let syncedSelectedLabel = false;
	function syncInputToSelectedLabel() {
		if (!syncedSelectedLabel && inputValue !== selectedLabelString) {
			syncedSelectedLabel = true;
			setInputValue(selectedLabelString, createChangeEventDetails(none));
		}
	}
	function handleSelectedValueChanged() {
		if (selectionMode === "none") return;
		clearErrors(name);
		setDirty(isSelectedValueDirty(selectedValue, validityData.initialValue, isItemEqualToValue));
		validation.change(selectedValue);
		if (single && !hasInputValue && !inputInsidePopup) syncInputToSelectedLabel();
	}
	function syncInputAfterItemsOrLabelChange() {
		if (single && !hasInputValue && !inputInsidePopup && !queryChangedAfterOpen) syncInputToSelectedLabel();
	}
	function handleInputValueChanged() {
		if (selectionMode !== "none") return;
		clearErrors(name);
		setDirty(inputValue !== validityData.initialValue);
		validation.change(inputValue);
	}
	useValueChanged(query, handleQueryChanged);
	useValueChanged(open, handleOpenChanged);
	useValueChanged(selectedValue, handleSelectedValueChanged);
	useValueChanged(selectedLabelString, syncInputAfterItemsOrLabelChange);
	useValueChanged(items, syncInputAfterItemsOrLabelChange);
	useValueChanged(inputValue, handleInputValueChanged);
	const floatingRootContext = useFloatingRootContext({
		open: inline ? true : open,
		onOpenChange: setOpen,
		elements: {
			reference: inputInsidePopup ? triggerElement : inputElement,
			floating: positionerElement
		}
	});
	const ariaHasPopup = grid ? "grid" : "listbox";
	const expanded = open || inline;
	const ariaExpanded = expanded ? "true" : "false";
	const role = import_react.useMemo(() => {
		const isPlainInput = inputElement?.tagName === "INPUT";
		const shouldTreatAsInput = inputElement == null || isPlainInput;
		const shouldApplyAria = shouldTreatAsInput || expanded;
		const reference = shouldTreatAsInput ? {
			autoComplete: "off",
			spellCheck: "false",
			autoCorrect: "off",
			autoCapitalize: "none"
		} : {};
		if (shouldApplyAria) {
			reference.role = "combobox";
			reference["aria-expanded"] = ariaExpanded;
			reference["aria-haspopup"] = ariaHasPopup;
			reference["aria-controls"] = expanded ? listElement?.id : void 0;
			reference["aria-autocomplete"] = readOnly ? "none" : autoComplete;
		}
		return {
			reference,
			floating: { role: "presentation" }
		};
	}, [
		inputElement,
		expanded,
		ariaExpanded,
		ariaHasPopup,
		listElement?.id,
		autoComplete,
		readOnly
	]);
	const click = useClick(floatingRootContext, {
		enabled: !disabled && openOnInputClick,
		event: "mousedown-only",
		toggle: false,
		touchOpenDelay: inputInsidePopup ? 0 : 100,
		reason: inputPress
	});
	const dismiss = useDismiss(floatingRootContext, {
		enabled: !disabled && !inline,
		outsidePressEvent: {
			mouse: "sloppy",
			touch: "intentional"
		},
		bubbles: inline ? true : void 0,
		outsidePress(event) {
			const target = getTarget(event);
			return !contains(triggerElement, target) && !contains(clearRef.current, target) && !contains(chipsContainerRef.current, target) && !contains(inputGroupElement, target);
		}
	});
	const listNavigation = useListNavigation(floatingRootContext, {
		enabled: !disabled,
		id,
		listRef,
		activeIndex,
		selectedIndex,
		virtual: true,
		loopFocus,
		allowEscape: loopFocus && !autoHighlightMode,
		focusItemOnOpen: queryChangedAfterOpen || selectionMode === "none" && !autoHighlightMode ? false : "auto",
		focusItemOnHover: highlightItemOnHover,
		resetOnPointerLeave: !keepHighlight,
		orientation: grid ? "horizontal" : void 0,
		rtl: direction === "rtl",
		disabledIndices: EMPTY_ARRAY,
		grid: grid ? gridNavigation : void 0,
		onNavigate(nextActiveIndex, event) {
			if (!event && !open || transitionStatus === "ending") return;
			if (!event) setIndices({ activeIndex: nextActiveIndex });
			else setIndices({
				activeIndex: nextActiveIndex,
				type: keyboardActiveRef.current ? keyboard : pointer
			});
		}
	});
	const inputProps = import_react.useMemo(() => mergeProps(listNavigation.reference, { onKeyDown(event) {
		if (grid && store.state.activeIndex == null && (event.key === "ArrowLeft" || event.key === "ArrowRight")) event.preventBaseUIHandler();
	} }, dismiss.reference, click.reference, role.reference), [
		listNavigation.reference,
		dismiss.reference,
		click.reference,
		role.reference,
		grid,
		store
	]);
	const popupProps = import_react.useMemo(() => mergeProps(FOCUSABLE_POPUP_PROPS, dismiss.floating), [dismiss.floating]);
	const listProps = import_react.useMemo(() => mergeProps(listNavigation.floating, role.floating), [listNavigation.floating, role.floating]);
	const itemProps = import_react.useMemo(() => {
		const listNavigationItemProps = listNavigation.item;
		if (!listNavigationItemProps) return EMPTY_OBJECT;
		return {
			...listNavigationItemProps,
			onFocus: void 0
		};
	}, [listNavigation.item]);
	store.useContextCallback("setOpen", setOpen);
	store.useContextCallback("setInputValue", setInputValue);
	store.useContextCallback("setSelectedValue", setSelectedValue);
	store.useContextCallback("setIndices", setIndices);
	store.useContextCallback("handleSelection", handleSelection);
	store.useContextCallback("forceMount", forceMount);
	store.useContextCallback("requestSubmit", requestSubmit);
	store.useContextCallback("onOpenChangeComplete", onOpenChangeCompleteProp);
	useOnFirstRender(() => {
		store.update({
			inline: inlineProp,
			popupProps,
			listProps,
			inputProps,
			triggerProps,
			itemProps
		});
	});
	const syncedValues = {
		id,
		selectedValue,
		open,
		mounted,
		transitionStatus,
		items: storeItems,
		inline: inlineProp,
		popupProps,
		listProps,
		inputProps,
		triggerProps,
		itemProps,
		openMethod,
		selectionMode,
		name,
		form,
		disabled,
		readOnly,
		required,
		grid,
		virtualized,
		openOnInputClick,
		itemToStringLabel,
		modal,
		autoHighlight: autoHighlightMode,
		isItemEqualToValue,
		submitOnItemClick,
		hasInputValue
	};
	useIsoLayoutEffect(() => {
		store.update({
			...syncedValues,
			inputOwnsFormValue: selectionMode === "none" && (inlineProp || !store.state.inputInsidePopup)
		});
	}, [store, ...Object.values(syncedValues)]);
	const hiddenInputRef = useMergedRefs(inputRefProp, validation.inputRef);
	const itemsContextValue = import_react.useMemo(() => ({
		query,
		hasItems,
		filteredItems,
		flatFilteredValues
	}), [
		query,
		hasItems,
		filteredItems,
		flatFilteredValues
	]);
	const serializedValue = import_react.useMemo(() => {
		if (Array.isArray(fieldRawValue)) return "";
		return stringifyAsValue(fieldRawValue, itemToStringValue);
	}, [fieldRawValue, itemToStringValue]);
	const hasMultipleSelection = multiple && Array.isArray(selectedValue) && selectedValue.length > 0;
	const hiddenInputName = multiple || selectionMode === "none" && inputOwnsFormValue ? void 0 : name;
	const hiddenInputs = import_react.useMemo(() => {
		if (!multiple || !Array.isArray(selectedValue) || !name) return null;
		return selectedValue.map((value) => {
			const currentSerializedValue = stringifyAsValue(value, itemToStringValue);
			return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
				type: "hidden",
				form,
				name,
				value: currentSerializedValue,
				disabled
			}, currentSerializedValue);
		});
	}, [
		multiple,
		selectedValue,
		form,
		name,
		itemToStringValue,
		disabled
	]);
	const children = /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
		props.children,
		/*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
			...validation.getValidationProps(disabled, {
				onFocus() {
					if (inputInsidePopup) {
						triggerElement?.focus();
						return;
					}
					(inputRef.current || triggerElement)?.focus();
				},
				onChange(event) {
					if (event.nativeEvent.defaultPrevented || disabled || readOnly) return;
					const nextValue = event.currentTarget.value;
					const nextValueLower = nextValue.toLowerCase();
					const details = createChangeEventDetails(none, event.nativeEvent);
					const findSerializedMatchIndex = () => valuesRef.current.findIndex((candidate) => stringifyAsValue(candidate, itemToStringValue).toLowerCase() === nextValueLower || stringifyValueLabel(candidate).toLowerCase() === nextValueLower);
					function handleChange() {
						if (multiple) return;
						if (selectionMode === "none") {
							setInputValue(nextValue, details);
							return;
						}
						let matchingIndex = findSerializedMatchIndex();
						if (matchingIndex === -1) matchingIndex = valuesRef.current.findIndex((_, index) => {
							const renderedLabel = labelsRef.current[index];
							return renderedLabel != null && renderedLabel.toLowerCase() === nextValueLower;
						});
						const matchingValue = matchingIndex === -1 ? void 0 : valuesRef.current[matchingIndex];
						if (matchingValue != null) setSelectedValue?.(matchingValue, details);
					}
					if (single) {
						forceMount();
						if (items && findSerializedMatchIndex() === -1) store.set("forceMounted", true);
					}
					queueMicrotask(handleChange);
				}
			}),
			id: id && hiddenInputName == null ? `${id}-hidden-input` : void 0,
			form,
			name: hiddenInputName,
			autoComplete: formAutoComplete,
			disabled,
			required: required && !hasMultipleSelection,
			readOnly,
			value: serializedValue,
			ref: hiddenInputRef,
			style: hiddenInputName ? visuallyHiddenInput : visuallyHidden,
			tabIndex: -1,
			"aria-hidden": true,
			suppressHydrationWarning: true
		}),
		hiddenInputs
	] });
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxRootContext.Provider, {
		value: store,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxFloatingContext.Provider, {
			value: floatingRootContext,
			children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxHasItemsContext.Provider, {
				value: hasItems,
				children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxDerivedItemsContext.Provider, {
					value: itemsContextValue,
					children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxInputValueContext.Provider, {
						value: inputValue,
						children
					})
				})
			})
		})
	});
}
/**
* Indicates which side the corresponding popup is positioned relative to its anchor.
* @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start' | null}
*/
var popupSide$1 = "data-popup-side";
/**
* Present when the corresponding items list is empty.
*/
var listEmpty = "data-list-empty";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/utils/stateAttributesMapping.mjs
var triggerStateAttributesMapping = {
	...pressableTriggerOpenStateMapping,
	...fieldValidityMapping,
	popupSide: (side) => side ? { [popupSide$1]: side } : null,
	listEmpty: (empty) => empty ? { [listEmpty]: "" } : null
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/getPseudoElementBounds.mjs
var BOUNDARY_OFFSET = 5;
/**
* Determines if a mouse event occurred within the bounds of an element
* (including its pseudo-elements), with a small tolerance for pointer drift.
*/
function isMouseWithinBounds(event, element) {
	const bounds = getPseudoElementBounds(element);
	return event.clientX >= bounds.left - BOUNDARY_OFFSET && event.clientX <= bounds.right + BOUNDARY_OFFSET && event.clientY >= bounds.top - BOUNDARY_OFFSET && event.clientY <= bounds.bottom + BOUNDARY_OFFSET;
}
function getPseudoElementBounds(element) {
	const elementRect = element.getBoundingClientRect();
	const win = getWindow(element);
	if (jsdom) return elementRect;
	const beforeStyles = win.getComputedStyle(element, "::before");
	const afterStyles = win.getComputedStyle(element, "::after");
	if (!(beforeStyles.content !== "none" || afterStyles.content !== "none")) return elementRect;
	const beforeWidth = parseFloat(beforeStyles.width) || 0;
	const beforeHeight = parseFloat(beforeStyles.height) || 0;
	const afterWidth = parseFloat(afterStyles.width) || 0;
	const afterHeight = parseFloat(afterStyles.height) || 0;
	const totalWidth = Math.max(elementRect.width, beforeWidth, afterWidth);
	const totalHeight = Math.max(elementRect.height, beforeHeight, afterHeight);
	const widthDiff = totalWidth - elementRect.width;
	const heightDiff = totalHeight - elementRect.height;
	return {
		left: elementRect.left - widthDiff / 2,
		right: elementRect.right + widthDiff / 2,
		top: elementRect.top - heightDiff / 2,
		bottom: elementRect.bottom + heightDiff / 2
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/resolveAriaLabelledBy.mjs
function getDefaultLabelId(id) {
	return id == null ? void 0 : `${id}-label`;
}
function resolveAriaLabelledBy(fieldLabelId, localLabelId) {
	return fieldLabelId ?? localLabelId;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/utils/parts.mjs
/**
* The popup side is only meaningful while the positioner is mounted, as the store retains the
* last resolved side after the popup unmounts.
*/
function usePopupSide(store) {
	const mounted = store.useState("mounted");
	const popupSide = store.useState("popupSide");
	const positionerElement = store.useState("positionerElement");
	return mounted && positionerElement ? popupSide : null;
}
/**
* Whether the filtered list has no items to show.
*/
function useListEmpty() {
	return useComboboxDerivedItemsContext().filteredItems.length === 0;
}
/**
* The arrow keys that move the chip highlight backwards and forwards, in that order.
*/
function getChipNavigationKeys(direction) {
	return direction === "rtl" ? ["ArrowRight", "ArrowLeft"] : ["ArrowLeft", "ArrowRight"];
}
/**
* Where the highlight lands once the chip at `index` is removed, or `undefined` for no highlight.
*/
function getIndexAfterChipRemoval(index, chipCount) {
	const nextIndex = index >= chipCount - 1 ? chipCount - 2 : index;
	return nextIndex >= 0 ? nextIndex : void 0;
}
/**
* Commits the highlighted item by clicking it, tagging the originating event so the item's
* handler can attribute the selection to it.
*/
function clickHighlightedItem(store, activeIndex, nativeEvent) {
	const listItem = store.context.listRef.current[activeIndex];
	if (listItem) {
		store.context.selectionEventRef.current = nativeEvent;
		listItem.click();
		store.context.selectionEventRef.current = null;
	}
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/trigger/ComboboxTrigger.mjs
/**
* A button that opens the popup.
* Renders a `<button>` element.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
var ComboboxTrigger = /*#__PURE__*/ import_react.forwardRef(function ComboboxTrigger(componentProps, forwardedRef) {
	const { render, className, nativeButton = true, disabled: disabledProp = false, id: idProp, style, ...elementProps } = componentProps;
	const { state: fieldState, disabled: fieldDisabled, setTouched, setFocused, validationMode, validation } = useFieldRootContext();
	const { labelId: fieldLabelId } = useLabelableContext();
	const store = useComboboxRootContext();
	const selectionMode = store.useState("selectionMode");
	const comboboxDisabled = store.useState("disabled");
	const readOnly = store.useState("readOnly");
	const required = store.useState("required");
	const positionerElement = store.useState("positionerElement");
	const listElement = store.useState("listElement");
	const storedPopupId = store.useState("popupId");
	const triggerProps = store.useState("triggerProps");
	const inputInsidePopup = store.useState("inputInsidePopup");
	const rootId = store.useState("id");
	const comboboxLabelId = store.useState("labelId");
	const open = store.useState("open");
	const selectedValue = store.useState("selectedValue");
	const activeIndex = store.useState("activeIndex");
	const selectedIndex = store.useState("selectedIndex");
	const hasSelectedValue = store.useState("hasSelectedValue");
	const floatingRootContext = useComboboxFloatingContext();
	const inputValue = useComboboxInputValueContext();
	const focusTimeout = useTimeout();
	const disabled = fieldDisabled || comboboxDisabled || disabledProp;
	const listEmpty = useListEmpty();
	const popupSide = usePopupSide(store);
	useLabelableId({ id: inputInsidePopup ? idProp : void 0 });
	const id = inputInsidePopup ? idProp ?? rootId : idProp;
	const ariaLabelledBy = resolveAriaLabelledBy(fieldLabelId, comboboxLabelId);
	let ariaControls;
	if (open && inputInsidePopup) ariaControls = storedPopupId ?? getComboboxPopupId(rootId);
	else if (open) ariaControls = listElement?.id;
	const currentPointerTypeRef = import_react.useRef("");
	function trackPointerType(event) {
		currentPointerTypeRef.current = event.pointerType;
	}
	const { reference: triggerTypeaheadProps } = useTypeahead(floatingRootContext, {
		enabled: !open && !readOnly && !comboboxDisabled && selectionMode === "single",
		listRef: store.context.labelsRef,
		activeIndex,
		selectedIndex,
		onMatch(index) {
			const nextSelectedValue = store.context.valuesRef.current[index];
			if (nextSelectedValue !== void 0) store.context.setSelectedValue(nextSelectedValue, createChangeEventDetails(none));
		}
	});
	const { reference: triggerClickProps } = useClick(floatingRootContext, {
		enabled: !comboboxDisabled,
		event: "mousedown"
	});
	const { buttonRef, getButtonProps } = useButton({
		native: nativeButton,
		disabled
	});
	const state = {
		...fieldState,
		readOnly,
		open,
		disabled,
		popupSide,
		listEmpty,
		placeholder: selectionMode === "none" ? false : !hasSelectedValue
	};
	return useRenderElement("button", componentProps, {
		ref: [
			forwardedRef,
			buttonRef,
			useStableCallback((element) => {
				store.set("triggerElement", element);
			})
		],
		state,
		props: [
			triggerProps,
			triggerClickProps,
			triggerTypeaheadProps,
			{
				id,
				tabIndex: inputInsidePopup ? 0 : -1,
				role: inputInsidePopup ? "combobox" : void 0,
				"aria-expanded": open,
				"aria-haspopup": inputInsidePopup ? "dialog" : "listbox",
				"aria-controls": ariaControls,
				"aria-required": inputInsidePopup ? required || void 0 : void 0,
				"aria-readonly": inputInsidePopup ? readOnly || void 0 : void 0,
				"aria-labelledby": ariaLabelledBy,
				onPointerDown: trackPointerType,
				onPointerEnter: trackPointerType,
				onFocus() {
					setFocused(true);
					if (disabled) return;
					focusTimeout.start(0, store.context.forceMount);
				},
				onBlur(event) {
					if (contains(positionerElement, event.relatedTarget)) return;
					setTouched(true);
					setFocused(false);
					if (validationMode === "onBlur") {
						const valueToValidate = selectionMode === "none" ? inputValue : selectedValue;
						validation.commit(valueToValidate);
					}
				},
				onMouseDown(event) {
					if (disabled) return;
					if (!inputInsidePopup) floatingRootContext.set("domReferenceElement", event.currentTarget);
					store.context.forceMount();
					if (currentPointerTypeRef.current !== "touch") {
						store.context.inputRef.current?.focus();
						if (!inputInsidePopup) event.preventDefault();
					}
					if (open) return;
					const doc = ownerDocument(event.currentTarget);
					function handleMouseUp(mouseEvent) {
						const currentTriggerElement = store.state.triggerElement;
						if (!currentTriggerElement) return;
						const mouseUpTarget = getTarget(mouseEvent);
						const positioner = store.state.positionerElement;
						const list = store.state.listElement;
						if (contains(currentTriggerElement, mouseUpTarget) || contains(positioner, mouseUpTarget) || contains(list, mouseUpTarget)) return;
						if (isMouseWithinBounds(mouseEvent, currentTriggerElement)) return;
						store.context.setOpen(false, createChangeEventDetails(cancelOpen, mouseEvent));
					}
					if (inputInsidePopup) doc.addEventListener("mouseup", handleMouseUp, { once: true });
				},
				onKeyDown(event) {
					if (event.key === "ArrowDown" || event.key === "ArrowUp") {
						stopEvent(event);
						store.context.setOpen(true, createChangeEventDetails(listNavigation, event.nativeEvent));
						store.context.inputRef.current?.focus();
					}
				}
			},
			validation.getValidationProps(disabled, elementProps),
			getButtonProps
		],
		stateAttributesMapping: triggerStateAttributesMapping
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/chips/ComboboxChipsContext.mjs
var ComboboxChipsContext = /*#__PURE__*/ import_react.createContext(void 0);
function useComboboxChipsContext() {
	return import_react.useContext(ComboboxChipsContext);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/positioner/ComboboxPositionerContext.mjs
var ComboboxPositionerContext = /*#__PURE__*/ import_react.createContext(void 0);
function useComboboxPositionerContext(optional) {
	const context = import_react.useContext(ComboboxPositionerContext);
	if (context === void 0 && !optional) throw new Error(formatErrorMessage(21));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/utils/ComboboxInternalDismissButton.mjs
/**
* @internal
*/
var ComboboxInternalDismissButton = /*#__PURE__*/ import_react.forwardRef(function ComboboxInternalDismissButton(_, forwardedRef) {
	const store = useComboboxRootContext();
	const { buttonRef, getButtonProps } = useButton({ native: false });
	const mergedRef = useMergedRefs(forwardedRef, buttonRef);
	function handleDismiss(event) {
		store.context.setOpen(false, createChangeEventDetails(closePress, event.nativeEvent, event.currentTarget));
	}
	const dismissProps = getButtonProps({ onClick: handleDismiss });
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
		ref: mergedRef,
		...dismissProps,
		"aria-label": "Dismiss",
		tabIndex: void 0,
		style: visuallyHiddenInput
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/input/ComboboxInput.mjs
/**
* A text input to search for items in the list.
* Renders an `<input>` element.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
var ComboboxInput = /*#__PURE__*/ import_react.forwardRef(function ComboboxInput(componentProps, forwardedRef) {
	const { render, className, disabled: disabledProp = false, id: idProp, style, ...elementProps } = componentProps;
	const { state: fieldState, disabled: fieldDisabled, setTouched, setFocused, validationMode, validation } = useFieldRootContext();
	const { labelId: fieldLabelId } = useLabelableContext();
	const comboboxChipsContext = useComboboxChipsContext();
	const positioning = useComboboxPositionerContext(true);
	const hasPositionerParent = Boolean(positioning);
	const store = useComboboxRootContext();
	const inputValue = useComboboxInputValueContext();
	const direction = useDirection();
	const required = store.useState("required");
	const comboboxDisabled = store.useState("disabled");
	const readOnly = store.useState("readOnly");
	const name = store.useState("name");
	const form = store.useState("form");
	const selectionMode = store.useState("selectionMode");
	const autoHighlightMode = store.useState("autoHighlight");
	const inputProps = store.useState("inputProps");
	const triggerProps = store.useState("triggerProps");
	const open = store.useState("open");
	const mounted = store.useState("mounted");
	const selectedValue = store.useState("selectedValue");
	const rootId = store.useState("id");
	const inline = store.useState("inline");
	const modal = store.useState("modal");
	const autoHighlightEnabled = Boolean(autoHighlightMode);
	const popupSide = usePopupSide(store);
	const disabled = fieldDisabled || comboboxDisabled || disabledProp;
	const listEmpty = useListEmpty();
	const isInsidePopup = hasPositionerParent || inline;
	const focusManagerModal = !isInsidePopup || modal;
	const id = useBaseUiId(idProp ?? (!isInsidePopup ? rootId : void 0));
	const fieldStateForInput = hasPositionerParent ? DEFAULT_FIELD_STATE_ATTRIBUTES : fieldState;
	const [composingValue, setComposingValue] = import_react.useState(null);
	const isComposingRef = import_react.useRef(false);
	const lastActiveIndexRef = import_react.useRef(null);
	const shouldRestoreActiveIndexRef = import_react.useRef(false);
	const inputOwnsFormValue = selectionMode === "none" && !hasPositionerParent;
	const setInputElement = useStableCallback((element) => {
		const nextIsInsidePopup = hasPositionerParent || store.state.inline;
		if (nextIsInsidePopup && !store.state.hasInputValue) store.context.setInputValue("", createChangeEventDetails(none));
		store.update({
			inputElement: element,
			inputInsidePopup: nextIsInsidePopup,
			inputOwnsFormValue
		});
	});
	const validationProps = hasPositionerParent ? elementProps : validation.getValidationProps(disabled, elementProps);
	function clearHighlight() {
		store.context.setIndices({
			activeIndex: null,
			selectedIndex: null,
			type: store.context.keyboardActiveRef.current ? keyboard : pointer
		});
	}
	function markPointerActive() {
		store.context.keyboardActiveRef.current = false;
	}
	const state = {
		...fieldStateForInput,
		open,
		disabled,
		readOnly,
		popupSide,
		listEmpty
	};
	function handleKeyDown(event) {
		if (!comboboxChipsContext) return;
		let nextIndex;
		const { highlightedChipIndex } = comboboxChipsContext;
		const renderedChipsCount = comboboxChipsContext.chipsRef.current.length;
		const [previousChipKey, nextChipKey] = getChipNavigationKeys(direction);
		if (highlightedChipIndex !== void 0) {
			if (event.key === previousChipKey) {
				event.preventDefault();
				if (highlightedChipIndex > 0) nextIndex = highlightedChipIndex - 1;
				else nextIndex = void 0;
			} else if (event.key === nextChipKey) {
				event.preventDefault();
				if (highlightedChipIndex < renderedChipsCount - 1) nextIndex = highlightedChipIndex + 1;
				else nextIndex = void 0;
			} else if (event.key === "Backspace" || event.key === "Delete") {
				event.preventDefault();
				nextIndex = getIndexAfterChipRemoval(highlightedChipIndex, selectedValue.length);
				clearHighlight();
			}
			return nextIndex;
		}
		if (event.key === previousChipKey && (event.currentTarget.selectionStart ?? 0) === 0 && selectedValue.length > 0) {
			event.preventDefault();
			nextIndex = renderedChipsCount > 0 ? renderedChipsCount - 1 : void 0;
		}
		return nextIndex;
	}
	const element = useRenderElement("input", componentProps, {
		state,
		ref: [
			forwardedRef,
			store.context.inputRef,
			setInputElement
		],
		props: [
			inputProps,
			triggerProps,
			{
				value: composingValue ?? inputValue,
				"aria-readonly": readOnly || void 0,
				"aria-required": required || void 0,
				"aria-labelledby": fieldLabelId,
				disabled,
				readOnly,
				required: selectionMode === "none" ? required : void 0,
				form,
				...inputOwnsFormValue && name && { name },
				id,
				onFocus() {
					setFocused(true);
					if (!inline || !shouldRestoreActiveIndexRef.current) return;
					shouldRestoreActiveIndexRef.current = false;
					const nextActiveIndex = lastActiveIndexRef.current;
					if (nextActiveIndex == null || !Object.hasOwn(store.context.valuesRef.current, nextActiveIndex)) return;
					store.context.setIndices({ activeIndex: nextActiveIndex });
				},
				onBlur() {
					setTouched(true);
					setFocused(false);
					const activeIndex = store.state.activeIndex;
					if (inline && activeIndex !== null && autoHighlightMode !== "always") {
						lastActiveIndexRef.current = activeIndex;
						shouldRestoreActiveIndexRef.current = true;
						store.context.setIndices({ activeIndex: null });
					}
					if (validationMode === "onBlur") {
						const valueToValidate = selectionMode === "none" ? inputValue : selectedValue;
						validation.commit(valueToValidate);
					}
				},
				onCompositionStart(event) {
					if (android) return;
					isComposingRef.current = true;
					setComposingValue(event.currentTarget.value);
				},
				onCompositionEnd(event) {
					isComposingRef.current = false;
					const next = event.currentTarget.value;
					setComposingValue(null);
					store.context.setInputValue(next, createChangeEventDetails(inputChange, event.nativeEvent));
				},
				onChange(event) {
					const nativeEvent = event.nativeEvent;
					const inputType = nativeEvent.inputType;
					const autofillLikeInput = !inputType || inputType === "insertReplacementText";
					const shouldOpenOnInput = isComposingRef.current || !autofillLikeInput;
					function maybeOpenOnInput(trimmed) {
						if (readOnly || disabled || !trimmed || !shouldOpenOnInput) return;
						store.context.setOpen(true, createChangeEventDetails(inputChange, nativeEvent));
						if (!autoHighlightEnabled) clearHighlight();
					}
					if (isComposingRef.current) {
						const nextVal = event.currentTarget.value;
						setComposingValue(nextVal);
						if (nextVal === "" && !store.state.openOnInputClick && !store.state.inputInsidePopup) store.context.setOpen(false, createChangeEventDetails(inputClear, nativeEvent));
						const trimmed = nextVal.trim();
						const shouldMaintainHighlight = autoHighlightEnabled && trimmed !== "";
						maybeOpenOnInput(trimmed);
						if (open && store.state.activeIndex !== null && !shouldMaintainHighlight) clearHighlight();
						return;
					}
					const inputChangeDetails = createChangeEventDetails(inputChange, nativeEvent);
					store.context.setInputValue(event.currentTarget.value, inputChangeDetails);
					if (inputChangeDetails.isCanceled) return;
					const empty = event.currentTarget.value === "";
					const clearDetails = createChangeEventDetails(inputClear, nativeEvent);
					if (empty && !store.state.inputInsidePopup) {
						if (selectionMode === "single") store.context.setSelectedValue(null, clearDetails);
						if (!store.state.openOnInputClick) store.context.setOpen(false, clearDetails);
					}
					maybeOpenOnInput(event.currentTarget.value.trim());
					if (open && store.state.activeIndex !== null && !autoHighlightEnabled) clearHighlight();
				},
				onKeyDown(event) {
					if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;
					store.context.keyboardActiveRef.current = true;
					if (disabled || readOnly) {
						if (readOnly && event.key === "Enter" && open && store.state.activeIndex !== null) stopEvent(event);
						return;
					}
					const input = event.currentTarget;
					const scrollAmount = input.scrollWidth - input.clientWidth;
					const isRTL = direction === "rtl";
					if (event.key === "Home") {
						stopEvent(event);
						const cursor = gecko && isRTL ? input.value.length : 0;
						input.setSelectionRange(cursor, cursor);
						input.scrollLeft = 0;
						return;
					}
					if (event.key === "End") {
						stopEvent(event);
						const cursor = gecko && isRTL ? 0 : input.value.length;
						input.setSelectionRange(cursor, cursor);
						input.scrollLeft = isRTL ? -scrollAmount : scrollAmount;
						return;
					}
					if (!mounted && event.key === "Escape") {
						const isClear = selectionMode === "multiple" && Array.isArray(selectedValue) ? selectedValue.length === 0 : selectedValue === null;
						const details = createChangeEventDetails(escapeKey, event.nativeEvent);
						const value = selectionMode === "multiple" ? [] : null;
						store.context.setInputValue("", details);
						store.context.setSelectedValue(value, details);
						if (!isClear && !store.state.inline && !details.isPropagationAllowed) event.stopPropagation();
						return;
					}
					if (comboboxChipsContext && event.key === "Backspace" && input.value === "" && comboboxChipsContext.highlightedChipIndex === void 0 && Array.isArray(selectedValue) && selectedValue.length > 0) {
						const renderedChipsCount = comboboxChipsContext.chipsRef.current.length;
						const removalIndex = renderedChipsCount > 0 ? renderedChipsCount - 1 : selectedValue.length - 1;
						const newValue = selectedValue.filter((_, index) => index !== removalIndex);
						clearHighlight();
						store.context.setSelectedValue(newValue, createChangeEventDetails(none, event.nativeEvent));
						return;
					}
					const hadHighlightedChip = comboboxChipsContext?.highlightedChipIndex !== void 0;
					const nextIndex = handleKeyDown(event);
					comboboxChipsContext?.setHighlightedChipIndex(nextIndex);
					if (nextIndex !== void 0) comboboxChipsContext?.chipsRef.current[nextIndex]?.focus();
					else if (hadHighlightedChip) store.context.inputRef.current?.focus();
					if (event.which === 229) return;
					if (event.key === "Enter" && open) {
						const activeIndex = store.state.activeIndex;
						const nativeEvent = event.nativeEvent;
						if (activeIndex === null) {
							if (inline) return;
							store.context.setOpen(false, createChangeEventDetails(none, nativeEvent));
							return;
						}
						stopEvent(event);
						clickHighlightedItem(store, activeIndex, nativeEvent);
					}
				},
				onPointerMove: markPointerActive,
				onPointerDown: markPointerActive
			},
			validationProps
		],
		stateAttributesMapping: triggerStateAttributesMapping
	});
	const renderedInput = hasPositionerParent ? /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FieldRootContext.Provider, {
		value: DEFAULT_FIELD_ROOT_CONTEXT,
		children: element
	}) : element;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [open && focusManagerModal && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxInternalDismissButton, { ref: store.context.startDismissRef }), renderedInput] });
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/clear/ComboboxClear.mjs
var stateAttributesMapping$6 = {
	...transitionStatusMapping,
	...triggerOpenStateMapping
};
/**
* Clears the value when clicked.
* Renders a `<button>` element.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
var ComboboxClear = /*#__PURE__*/ import_react.forwardRef(function ComboboxClear(componentProps, forwardedRef) {
	const { render, className, disabled: disabledProp = false, nativeButton = true, keepMounted = false, style, ...elementProps } = componentProps;
	const { disabled: fieldDisabled } = useFieldRootContext();
	const store = useComboboxRootContext();
	const selectionMode = store.useState("selectionMode");
	const comboboxDisabled = store.useState("disabled");
	const readOnly = store.useState("readOnly");
	const open = store.useState("open");
	const selectedValue = store.useState("selectedValue");
	const hasSelectionChips = store.useState("hasSelectionChips");
	const inputValue = useComboboxInputValueContext();
	let visible = false;
	if (selectionMode === "none") visible = inputValue !== "";
	else if (selectionMode === "single") visible = selectedValue != null;
	else visible = hasSelectionChips;
	const disabled = fieldDisabled || comboboxDisabled || disabledProp;
	const { buttonRef, getButtonProps } = useButton({
		native: nativeButton,
		disabled
	});
	const { mounted, transitionStatus, setMounted } = useTransitionStatus(visible);
	const state = {
		disabled,
		visible,
		open,
		transitionStatus
	};
	useOpenChangeComplete({
		open: visible,
		ref: store.context.clearRef,
		onComplete() {
			if (!visible) setMounted(false);
		}
	});
	const element = useRenderElement("button", componentProps, {
		state,
		ref: [
			forwardedRef,
			buttonRef,
			store.context.clearRef
		],
		props: [
			{
				tabIndex: -1,
				children: "x",
				onMouseDown(event) {
					event.preventDefault();
				},
				onClick(event) {
					if (disabled || readOnly) return;
					const type = store.context.keyboardActiveRef.current ? keyboard : pointer;
					store.context.setInputValue("", createChangeEventDetails(clearPress, event.nativeEvent));
					if (selectionMode !== "none") {
						store.context.setSelectedValue(Array.isArray(selectedValue) ? [] : null, createChangeEventDetails(clearPress, event.nativeEvent));
						store.context.setIndices({
							activeIndex: null,
							selectedIndex: null,
							type
						});
					} else store.context.setIndices({
						activeIndex: null,
						type
					});
					store.context.inputRef.current?.focus();
				}
			},
			elementProps,
			getButtonProps
		],
		stateAttributesMapping: stateAttributesMapping$6
	});
	if (!(keepMounted || mounted)) return null;
	return element;
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/collection/GroupCollectionContext.mjs
var GroupCollectionContext = /*#__PURE__*/ import_react.createContext(null);
function useGroupCollectionContext() {
	return import_react.useContext(GroupCollectionContext);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/collection/ComboboxCollection.mjs
/**
* Renders filtered list items.
* Doesn't render its own HTML element.
*
* If rendering a flat list, pass a function child to the `List` component instead, which implicitly wraps it.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
function ComboboxCollection(props) {
	const { children } = props;
	const { filteredItems } = useComboboxDerivedItemsContext();
	const groupContext = useGroupCollectionContext();
	const itemsToRender = groupContext ? groupContext.items : filteredItems;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: itemsToRender.map(children) });
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/list/ComboboxList.mjs
/**
* A list container for the items.
* Renders a `<div>` element.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
var ComboboxList = /*#__PURE__*/ import_react.forwardRef(function ComboboxList(componentProps, forwardedRef) {
	var _ComboboxCollection;
	const { render, className, style, children, ...elementProps } = componentProps;
	const store = useComboboxRootContext();
	const floatingRootContext = useComboboxFloatingContext();
	const hasPositionerContext = Boolean(useComboboxPositionerContext(true));
	const { filteredItems, hasItems } = useComboboxDerivedItemsContext();
	const selectionMode = store.useState("selectionMode");
	const grid = store.useState("grid");
	const readOnly = store.useState("readOnly");
	const listProps = store.useState("listProps");
	const virtualized = store.useState("virtualized");
	const forceMounted = store.useState("forceMounted");
	const multiple = selectionMode === "multiple";
	const empty = filteredItems.length === 0;
	const setPositionerElement = useStableCallback((element) => {
		store.set("positionerElement", element);
	});
	const setListElement = useStableCallback((element) => {
		store.set("listElement", element);
	});
	const resolvedChildren = import_react.useMemo(() => {
		if (typeof children === "function") return _ComboboxCollection || (_ComboboxCollection = /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxCollection, { children }));
		return children;
	}, [children]);
	const state = { empty };
	const floatingId = floatingRootContext.useState("floatingId");
	const element = useRenderElement("div", componentProps, {
		state,
		ref: [
			forwardedRef,
			setListElement,
			hasPositionerContext ? null : setPositionerElement
		],
		props: [
			listProps,
			{
				children: resolvedChildren,
				tabIndex: -1,
				id: floatingId,
				role: grid ? "grid" : "listbox",
				"aria-multiselectable": multiple ? "true" : void 0,
				"aria-readonly": !grid && readOnly ? true : void 0,
				onKeyDown(event) {
					if (store.state.disabled || store.state.readOnly) return;
					if (event.key === "Enter") {
						const activeIndex = store.state.activeIndex;
						if (activeIndex == null) return;
						stopEvent(event);
						clickHighlightedItem(store, activeIndex, event.nativeEvent);
					}
				},
				onKeyDownCapture() {
					store.context.keyboardActiveRef.current = true;
				},
				onPointerMoveCapture() {
					store.context.keyboardActiveRef.current = false;
				}
			},
			elementProps
		]
	});
	if (virtualized) return element;
	const labelsRef = hasItems && !forceMounted ? void 0 : store.context.labelsRef;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeList, {
		elementsRef: store.context.listRef,
		labelsRef,
		children: element
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/utils/useInitialLiveRegionTextMutation.mjs
var LIVE_REGION_MARKER = "⁠";
function findLastTextNode(root) {
	const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	let lastTextNode = null;
	while (walker.nextNode()) {
		const textNode = walker.currentNode;
		if (textNode.nodeValue !== "") lastTextNode = textNode;
	}
	return lastTextNode;
}
function useInitialLiveRegionTextMutation() {
	const timeout = useTimeout();
	const rootRef = import_react.useRef(null);
	import_react.useEffect(() => {
		if (ios) return;
		const root = rootRef.current;
		if (root == null) return;
		const textNode = findLastTextNode(root);
		if (textNode == null) return;
		const originalValue = textNode.data;
		const markedValue = `${originalValue}${LIVE_REGION_MARKER}`;
		textNode.nodeValue = markedValue;
		timeout.start(200, () => {
			if (textNode.nodeValue === markedValue) textNode.nodeValue = originalValue;
		});
		return () => {
			timeout.clear();
			if (textNode.nodeValue === markedValue) textNode.nodeValue = originalValue;
		};
	}, [rootRef, timeout]);
	return rootRef;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/portal/ComboboxPortalContext.mjs
var ComboboxPortalContext = /*#__PURE__*/ import_react.createContext(void 0);
function useComboboxPortalContext() {
	const context = import_react.useContext(ComboboxPortalContext);
	if (context === void 0) throw new Error(formatErrorMessage(20));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/portal/ComboboxPortal.mjs
/**
* A portal element that moves the popup to a different part of the DOM.
* By default, the portal element is appended to `<body>`.
* Renders a `<div>` element.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
var ComboboxPortal = /*#__PURE__*/ import_react.forwardRef(function ComboboxPortal(props, forwardedRef) {
	const { keepMounted = false, ...portalProps } = props;
	const store = useComboboxRootContext();
	const mounted = store.useState("mounted");
	const forceMounted = store.useState("forceMounted");
	if (!(mounted || keepMounted || forceMounted)) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxPortalContext.Provider, {
		value: keepMounted,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingPortal, {
			ref: forwardedRef,
			...portalProps
		})
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useAnchoredPopupScrollLock.mjs
var VIEWPORT_WIDTH_TOLERANCE_PX = 20;
/**
* Manages scroll lock for anchored popups. For non-touch opens, scroll lock is applied when
* enabled. For touch opens, scroll lock is applied only when the positioner width is effectively
* viewport-sized.
*/
function useAnchoredPopupScrollLock(enabled, touchOpen, positionerElement, referenceElement) {
	const [touchOpenShouldLockScroll, setTouchOpenShouldLockScroll] = import_react.useState(false);
	useIsoLayoutEffect(() => {
		if (!enabled || !touchOpen || positionerElement == null) {
			setTouchOpenShouldLockScroll(false);
			return;
		}
		const viewportWidth = ownerDocument(positionerElement).documentElement.clientWidth;
		const popupWidth = positionerElement.offsetWidth;
		setTouchOpenShouldLockScroll(viewportWidth > 0 && popupWidth > 0 && popupWidth >= viewportWidth - VIEWPORT_WIDTH_TOLERANCE_PX);
	}, [
		enabled,
		touchOpen,
		positionerElement
	]);
	useScrollLock(enabled && (!touchOpen || touchOpenShouldLockScroll), referenceElement);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/positioner/ComboboxPositioner.mjs
/**
* Positions the popup against the trigger.
* Renders a `<div>` element.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
var ComboboxPositioner = /*#__PURE__*/ import_react.forwardRef(function ComboboxPositioner(componentProps, forwardedRef) {
	const { render, className, anchor, positionMethod, side, align, sideOffset, alignOffset, collisionBoundary = "clipping-ancestors", collisionPadding, arrowPadding, sticky, disableAnchorTracking = false, collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE, style: styleProp, ...elementProps } = componentProps;
	const store = useComboboxRootContext();
	const floatingRootContext = useComboboxFloatingContext();
	const keepMounted = useComboboxPortalContext();
	const modal = store.useState("modal");
	const open = store.useState("open");
	const mounted = store.useState("mounted");
	const openMethod = store.useState("openMethod");
	const positionerElement = store.useState("positionerElement");
	const triggerElement = store.useState("triggerElement");
	const inputElement = store.useState("inputElement");
	const inputGroupElement = store.useState("inputGroupElement");
	const inputInsidePopup = store.useState("inputInsidePopup");
	const transitionStatus = store.useState("transitionStatus");
	const empty = useListEmpty();
	const positioning = useAnchorPositioning({
		anchor: anchor ?? (inputInsidePopup ? triggerElement : inputGroupElement ?? inputElement),
		floatingRootContext,
		positionMethod,
		mounted,
		side,
		sideOffset,
		align,
		alignOffset,
		arrowPadding,
		collisionBoundary,
		collisionPadding,
		sticky,
		disableAnchorTracking,
		keepMounted,
		collisionAvoidance,
		lazyFlip: true
	});
	useAnchoredPopupScrollLock(open && modal, openMethod === "touch", positionerElement, triggerElement);
	const state = {
		open,
		side: positioning.side,
		align: positioning.align,
		anchorHidden: positioning.anchorHidden,
		empty
	};
	useIsoLayoutEffect(() => {
		store.set("popupSide", positioning.side);
	}, [store, positioning.side]);
	const setPositionerElement = useStableCallback((element) => {
		store.set("positionerElement", element);
	});
	const element = usePositioner(componentProps, state, {
		styles: positioning.positionerStyles,
		transitionStatus,
		props: elementProps,
		refs: [forwardedRef, setPositionerElement],
		hidden: !mounted,
		inert: !open
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(ComboboxPositionerContext.Provider, {
		value: positioning,
		children: [mounted && modal && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(InternalBackdrop, {
			inert: inertValue(!open),
			cutout: inputGroupElement ?? inputElement ?? triggerElement
		}), element]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/popup/ComboboxPopup.mjs
var stateAttributesMapping$5 = {
	...popupStateMapping,
	...transitionStatusMapping
};
/**
* A container for the list.
* Renders a `<div>` element.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
var ComboboxPopup = /*#__PURE__*/ import_react.forwardRef(function ComboboxPopup(componentProps, forwardedRef) {
	const { render, className, style, initialFocus, finalFocus, ...elementProps } = componentProps;
	const store = useComboboxRootContext();
	const positioning = useComboboxPositionerContext();
	const floatingRootContext = useComboboxFloatingContext();
	const mounted = store.useState("mounted");
	const open = store.useState("open");
	const openMethod = store.useState("openMethod");
	const popupProps = store.useState("popupProps");
	const transitionStatus = store.useState("transitionStatus");
	const inputInsidePopup = store.useState("inputInsidePopup");
	const inputElement = store.useState("inputElement");
	const modal = store.useState("modal");
	const rootId = store.useState("id");
	const empty = useListEmpty();
	const popupId = elementProps.id ?? (inputInsidePopup ? getComboboxPopupId(rootId) : void 0);
	useIsoLayoutEffect(() => {
		store.set("popupId", store.context.popupRef.current?.id || popupId);
		return () => {
			store.set("popupId", void 0);
		};
	}, [store, popupId]);
	useOpenChangeComplete({
		open,
		ref: store.context.popupRef,
		onComplete() {
			if (open) store.context.onOpenChangeComplete(true);
		}
	});
	const element = useRenderElement("div", componentProps, {
		state: {
			open,
			side: positioning.side,
			align: positioning.align,
			anchorHidden: positioning.anchorHidden,
			transitionStatus,
			empty
		},
		ref: [forwardedRef, store.context.popupRef],
		props: [
			popupProps,
			{
				id: popupId,
				role: inputInsidePopup ? "dialog" : "presentation",
				onFocus(event) {
					const target = getTarget(event.nativeEvent);
					if (openMethod !== "touch" && (contains(store.state.listElement, target) || target === event.currentTarget)) store.context.inputRef.current?.focus();
				}
			},
			getDisabledMountTransitionStyles(transitionStatus),
			elementProps
		],
		stateAttributesMapping: stateAttributesMapping$5
	});
	const resolvedInitialFocus = initialFocus === void 0 ? inputInsidePopup ? (interactionType) => interactionType === "touch" ? store.context.popupRef.current : inputElement : false : initialFocus;
	let resolvedFinalFocus;
	if (finalFocus != null) resolvedFinalFocus = finalFocus;
	else resolvedFinalFocus = inputInsidePopup ? void 0 : false;
	const focusManagerModal = !inputInsidePopup || modal;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingFocusManager, {
		context: floatingRootContext,
		disabled: !mounted,
		modal: focusManagerModal,
		openInteractionType: openMethod,
		initialFocus: resolvedInitialFocus,
		returnFocus: resolvedFinalFocus,
		getInsideElements: () => [store.context.startDismissRef.current, store.context.endDismissRef.current],
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [element, focusManagerModal && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxInternalDismissButton, { ref: store.context.endDismissRef })] })
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/item/ComboboxItemContext.mjs
var ComboboxItemContext = /*#__PURE__*/ import_react.createContext(void 0);
function useComboboxItemContext() {
	const context = import_react.useContext(ComboboxItemContext);
	if (!context) throw new Error(formatErrorMessage(19));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/row/ComboboxRowContext.mjs
var ComboboxRowContext = /*#__PURE__*/ import_react.createContext(false);
function useComboboxRowContext() {
	return import_react.useContext(ComboboxRowContext);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/item/ComboboxItem.mjs
function ComboboxItemInner(props) {
	const { componentProps, forwardedRef, virtualized, indexFromFilter } = props;
	const { render, className, style, value: itemValue = null, index: indexProp, disabled: disabledProp = false, nativeButton = false, ...elementProps } = componentProps;
	const textRef = import_react.useRef(null);
	const listItem = useCompositeListItem({
		guess: true,
		index: indexProp,
		textRef
	});
	const store = useComboboxRootContext();
	const isRow = useComboboxRowContext();
	const hasItems = useComboboxHasItemsContext();
	const selectionMode = store.useState("selectionMode");
	const rootDisabled = store.useState("disabled");
	const readOnly = store.useState("readOnly");
	const isItemEqualToValue = store.useState("isItemEqualToValue");
	const disabled = rootDisabled || disabledProp;
	const selectable = selectionMode !== "none";
	const index = indexProp ?? indexFromFilter ?? listItem.index;
	const hasRegistered = index !== -1;
	const rootId = store.useState("id");
	const highlighted = store.useState("isActive", index);
	const matchesSelectedValue = store.useState("isSelected", itemValue);
	const itemProps = store.useState("itemProps");
	const itemRef = import_react.useRef(null);
	const id = rootId != null && hasRegistered ? `${rootId}-${index}` : void 0;
	const selected = matchesSelectedValue && selectable;
	useIsoLayoutEffect(() => {
		if (!(hasRegistered && (virtualized || indexProp != null))) return;
		const list = store.context.listRef.current;
		list[index] = itemRef.current;
		return () => {
			delete list[index];
		};
	}, [
		hasRegistered,
		virtualized,
		index,
		indexProp,
		store
	]);
	useIsoLayoutEffect(() => {
		if (!hasRegistered || hasItems) return;
		const visibleValues = store.context.valuesRef.current;
		visibleValues[index] = itemValue;
		return () => {
			delete visibleValues[index];
		};
	}, [
		hasRegistered,
		hasItems,
		index,
		itemValue,
		store
	]);
	useIsoLayoutEffect(() => {
		if (!hasRegistered || hasItems) return;
		const selectedValue = store.state.selectedValue;
		let nextIndex = store.state.selectedIndex;
		if (store.state.selectionMode === "multiple" && Array.isArray(selectedValue)) nextIndex = resolveSelectedIndex(index, itemValue, store.context.valuesRef.current, selectedValue, isItemEqualToValue, nextIndex);
		else if (compareItemEquality(itemValue, selectedValue, isItemEqualToValue)) nextIndex = index;
		store.set("selectedIndex", nextIndex);
	}, [
		hasRegistered,
		hasItems,
		store,
		index,
		itemValue,
		isItemEqualToValue
	]);
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		focusableWhenDisabled: true,
		native: nativeButton,
		composite: true
	});
	const state = {
		disabled,
		selected,
		highlighted
	};
	function commitSelection(nativeEvent) {
		function selectItem() {
			store.context.handleSelection(nativeEvent, itemValue);
		}
		if (store.state.submitOnItemClick) {
			import_react_dom.flushSync(selectItem);
			store.context.requestSubmit();
		} else selectItem();
	}
	const defaultProps = {
		id,
		role: isRow ? "gridcell" : "option",
		"aria-selected": selectable ? selected : void 0,
		tabIndex: void 0,
		onPointerDownCapture(event) {
			if (event.isPrimary) store.context.pointerDownItemRef.current = event.currentTarget;
			event.preventDefault();
		},
		onMouseDown(event) {
			event.preventDefault();
		},
		onClick(event) {
			if (disabled || readOnly) return;
			commitSelection(event.nativeEvent);
		},
		onMouseUp(event) {
			const pointerStartedOnItem = store.context.pointerDownItemRef.current === event.currentTarget;
			store.context.pointerDownItemRef.current = null;
			if (disabled || readOnly || event.button !== 0 || pointerStartedOnItem || !highlighted) return;
			commitSelection(event.nativeEvent);
		}
	};
	const element = useRenderElement("div", componentProps, {
		ref: [
			buttonRef,
			forwardedRef,
			listItem.ref,
			itemRef
		],
		state,
		props: [
			itemProps,
			defaultProps,
			elementProps,
			getButtonProps
		]
	});
	const contextValue = import_react.useMemo(() => ({
		selected,
		textRef
	}), [selected, textRef]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxItemContext.Provider, {
		value: contextValue,
		children: element
	});
}
/**
* Resolves the index from the filtered items for the virtualized fallback (no `index` prop).
* Isolated here so that this per-keystroke subscription to the derived-items context is only
* paid by virtualized items. Those re-render on every input change anyway — the parent
* virtualizer re-windows the list as the filtered set changes — so the extra subscription costs
* them nothing, while it keeps every non-virtualized item off that context.
*/
function ComboboxItemVirtualizedIndex(props) {
	const { componentProps, forwardedRef } = props;
	const isItemEqualToValue = useComboboxRootContext().useState("isItemEqualToValue");
	const { flatFilteredValues } = useComboboxDerivedItemsContext();
	const indexFromFilter = findItemIndex(flatFilteredValues, componentProps.value ?? null, isItemEqualToValue);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxItemInner, {
		componentProps,
		forwardedRef,
		virtualized: true,
		indexFromFilter
	});
}
/**
* An individual item in the list.
* Renders a `<div>` element.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
var ComboboxItem = /*#__PURE__*/ import_react.memo(/*#__PURE__*/ import_react.forwardRef(function ComboboxItem(componentProps, forwardedRef) {
	const virtualized = useComboboxRootContext().useState("virtualized");
	if (virtualized && componentProps.index == null) return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxItemVirtualizedIndex, {
		componentProps,
		forwardedRef
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ComboboxItemInner, {
		componentProps,
		forwardedRef,
		virtualized,
		indexFromFilter: void 0
	});
}));
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/empty/ComboboxEmpty.mjs
/**
* Renders its children only when the list is empty.
* Requires the `items` prop on the root component.
* Announces changes politely to screen readers.
* This component's root element must remain mounted in the DOM to announce
* changes consistently across screen readers. Avoid hiding or removing the
* component itself with `display: none`, `hidden`, `aria-hidden`, or conditional
* rendering. Prefer updating or conditionally rendering its children instead.
* Renders a `<div>` element.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
var ComboboxEmpty = /*#__PURE__*/ import_react.forwardRef(function ComboboxEmpty(componentProps, forwardedRef) {
	const { render, className, style, children: childrenProp, ...elementProps } = componentProps;
	const { filteredItems } = useComboboxDerivedItemsContext();
	const store = useComboboxRootContext();
	const emptyRef = useInitialLiveRegionTextMutation();
	const children = filteredItems.length === 0 ? childrenProp : null;
	return useRenderElement("div", componentProps, {
		ref: [
			forwardedRef,
			store.context.emptyRef,
			emptyRef
		],
		props: [{
			children,
			role: "status",
			"aria-live": "polite",
			"aria-atomic": true
		}, elementProps]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/avatar/root/AvatarRootContext.mjs
var AvatarRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useAvatarRootContext() {
	const context = import_react.useContext(AvatarRootContext);
	if (context === void 0) throw new Error(formatErrorMessage(13));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/avatar/root/stateAttributesMapping.mjs
var avatarStateAttributesMapping = { imageLoadingStatus: () => null };
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/avatar/root/AvatarRoot.mjs
/**
* Displays a user's profile picture, initials, or fallback icon.
* Renders a `<span>` element.
*
* Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
*/
var AvatarRoot = /*#__PURE__*/ import_react.forwardRef(function AvatarRoot(componentProps, forwardedRef) {
	const { className, render, style, ...elementProps } = componentProps;
	const [imageLoadingStatus, setImageLoadingStatus] = import_react.useState("idle");
	const state = { imageLoadingStatus };
	const contextValue = import_react.useMemo(() => ({
		imageLoadingStatus,
		setImageLoadingStatus
	}), [imageLoadingStatus, setImageLoadingStatus]);
	const element = useRenderElement("span", componentProps, {
		state,
		ref: forwardedRef,
		props: elementProps,
		stateAttributesMapping: avatarStateAttributesMapping
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(AvatarRootContext.Provider, {
		value: contextValue,
		children: element
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/avatar/image/useImageLoadingStatus.mjs
function useImageLoadingStatus(src, { referrerPolicy, crossOrigin, sizes, srcSet }, enabled) {
	const state = import_react.useState("idle");
	const setLoadingStatus = state[1];
	useIsoLayoutEffect(() => {
		if (!enabled) return NOOP;
		if (!src && !srcSet) {
			setLoadingStatus("error");
			return NOOP;
		}
		let isMounted = true;
		const image = new window.Image();
		const updateStatus = (status) => () => {
			if (!isMounted) return;
			setLoadingStatus(status);
		};
		setLoadingStatus("loading");
		image.onload = updateStatus("loaded");
		image.onerror = updateStatus("error");
		if (referrerPolicy) image.referrerPolicy = referrerPolicy;
		image.crossOrigin = crossOrigin ?? null;
		if (sizes) image.sizes = sizes;
		if (srcSet) image.srcset = srcSet;
		if (src) image.src = src;
		if (image.complete) setLoadingStatus(image.naturalWidth > 0 ? "loaded" : "error");
		return () => {
			isMounted = false;
		};
	}, [
		enabled,
		src,
		srcSet,
		sizes,
		crossOrigin,
		referrerPolicy,
		setLoadingStatus
	]);
	return state;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/avatar/image/AvatarImage.mjs
var stateAttributesMapping$4 = {
	...avatarStateAttributesMapping,
	...transitionStatusMapping
};
/**
* The image to be displayed in the avatar.
* Renders an `<img>` element.
*
* Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
*/
var AvatarImage = /*#__PURE__*/ import_react.forwardRef(function AvatarImage(componentProps, forwardedRef) {
	const { className, render, onLoadingStatusChange: onLoadingStatusChangeProp, keepMounted = false, style, sizes, srcSet, src, ...elementProps } = componentProps;
	const { setImageLoadingStatus: setRootImageLoadingStatus } = useAvatarRootContext();
	const [imageLoadingStatus, setImageLoadingStatus] = useImageLoadingStatus(src, componentProps, !keepMounted);
	const isVisible = imageLoadingStatus === "loaded";
	const { mounted, transitionStatus, setMounted } = useTransitionStatus(isVisible);
	const imageRef = import_react.useRef(null);
	const initialCommitRef = import_react.useRef(true);
	useIsoLayoutEffect(() => {
		if (!keepMounted) return;
		const isInitialCommit = initialCommitRef.current;
		initialCommitRef.current = false;
		const image = imageRef.current;
		if (!image) return;
		if (!image.complete) {
			setImageLoadingStatus("loading");
			return;
		}
		const status = image.naturalWidth > 0 ? "loaded" : "error";
		setImageLoadingStatus(status);
		if (status === "loaded" && isInitialCommit) setMounted(true);
	}, [
		keepMounted,
		src,
		srcSet,
		sizes,
		elementProps.crossOrigin,
		elementProps.referrerPolicy,
		render,
		setImageLoadingStatus,
		setMounted
	]);
	const renderedStatusProps = keepMounted ? {
		"data-loading": imageLoadingStatus === "loading" ? "" : void 0,
		"data-error": imageLoadingStatus === "error" ? "" : void 0,
		"aria-hidden": imageLoadingStatus !== "loaded" || void 0,
		onLoad() {
			setImageLoadingStatus("loaded");
		},
		onError() {
			setImageLoadingStatus("error");
		}
	} : void 0;
	const handleLoadingStatusChange = useStableCallback((status) => {
		onLoadingStatusChangeProp?.(status);
		setRootImageLoadingStatus(status);
	});
	useIsoLayoutEffect(() => {
		if (imageLoadingStatus !== "idle") handleLoadingStatusChange(imageLoadingStatus);
	}, [imageLoadingStatus, handleLoadingStatusChange]);
	useIsoLayoutEffect(() => {
		return () => setRootImageLoadingStatus("idle");
	}, [setRootImageLoadingStatus]);
	useOpenChangeComplete({
		enabled: !isVisible,
		open: isVisible,
		ref: imageRef,
		onComplete() {
			if (!isVisible) setMounted(false);
		}
	});
	const state = {
		imageLoadingStatus,
		transitionStatus: keepMounted && transitionStatus === "ending" ? void 0 : transitionStatus
	};
	const shouldRender = keepMounted || mounted;
	const sourceProps = {};
	if (sizes !== void 0) sourceProps.sizes = sizes;
	if (srcSet !== void 0) sourceProps.srcSet = srcSet;
	if (src !== void 0) sourceProps.src = src;
	const element = useRenderElement("img", componentProps, {
		state,
		ref: [forwardedRef, imageRef],
		props: [
			renderedStatusProps,
			elementProps,
			sourceProps
		],
		stateAttributesMapping: stateAttributesMapping$4,
		enabled: shouldRender
	});
	if (!shouldRender) return null;
	return element;
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/avatar/fallback/AvatarFallback.mjs
/**
* Rendered when the image fails to load or when no image is provided.
* Renders a `<span>` element.
*
* Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
*/
var AvatarFallback = /*#__PURE__*/ import_react.forwardRef(function AvatarFallback(componentProps, forwardedRef) {
	const { className, render, delay = 0, style, ...elementProps } = componentProps;
	const { imageLoadingStatus } = useAvatarRootContext();
	const [delayPassed, setDelayPassed] = import_react.useState(delay === 0);
	const timeout = useTimeout();
	import_react.useEffect(() => {
		if (delay > 0) timeout.start(delay, () => setDelayPassed(true));
		else setDelayPassed(true);
		return timeout.clear;
	}, [timeout, delay]);
	return useRenderElement("span", componentProps, {
		state: { imageLoadingStatus },
		ref: forwardedRef,
		props: elementProps,
		stateAttributesMapping: avatarStateAttributesMapping,
		enabled: imageLoadingStatus !== "loaded" && (delay === 0 || delayPassed)
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/root/ComboboxRoot.mjs
/**
* Groups all parts of the combobox.
* Doesn't render its own HTML element.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
function ComboboxRoot(props) {
	const { multiple = false, defaultValue, value, onValueChange, autoComplete, ...other } = props;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(AriaCombobox, {
		...other,
		selectionMode: multiple ? "multiple" : "single",
		selectedValue: value,
		defaultSelectedValue: defaultValue,
		onSelectedValueChange: onValueChange,
		formAutoComplete: autoComplete
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/combobox/item-indicator/ComboboxItemIndicator.mjs
/**
* Indicates whether the item is selected.
* Renders a `<span>` element.
*
* Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
*/
var ComboboxItemIndicator = /*#__PURE__*/ import_react.forwardRef(function ComboboxItemIndicator(componentProps, forwardedRef) {
	const { selected } = useComboboxItemContext();
	if (!(componentProps.keepMounted || selected)) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(Inner$1, {
		...componentProps,
		ref: forwardedRef
	});
});
var Inner$1 = /*#__PURE__*/ import_react.memo(/*#__PURE__*/ import_react.forwardRef((componentProps, forwardedRef) => {
	const { render, className, style, keepMounted, ...elementProps } = componentProps;
	const { selected } = useComboboxItemContext();
	const indicatorRef = import_react.useRef(null);
	const { transitionStatus, setMounted } = useTransitionStatus(selected);
	const element = useRenderElement("span", componentProps, {
		ref: [forwardedRef, indicatorRef],
		state: {
			selected,
			transitionStatus
		},
		props: [{
			"aria-hidden": true,
			children: "✔️"
		}, elementProps],
		stateAttributesMapping: transitionStatusMapping
	});
	useOpenChangeComplete({
		batch: true,
		enabled: !selected,
		open: selected,
		ref: indicatorRef,
		onComplete() {
			if (!selected) setMounted(false);
		}
	});
	return element;
}));
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/context-menu/root/ContextMenuRootContext.mjs
var ContextMenuRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useContextMenuRootContext(optional = true) {
	const context = import_react.useContext(ContextMenuRootContext);
	if (context === void 0 && !optional) throw new Error(formatErrorMessage(25));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/positioner/MenuPositionerContext.mjs
var MenuPositionerContext = /*#__PURE__*/ import_react.createContext(void 0);
function useMenuPositionerContext(optional) {
	const context = import_react.useContext(MenuPositionerContext);
	if (context === void 0 && !optional) throw new Error(formatErrorMessage(33));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/root/MenuRootContext.mjs
var MenuRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useMenuRootContext(optional) {
	const context = import_react.useContext(MenuRootContext);
	if (context === void 0 && !optional) throw new Error(formatErrorMessage(36));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/item/useMenuItemCommonProps.mjs
/**
* Returns common props shared by all menu item types.
* This hook extracts the shared logic for id, role, tabIndex, onKeyDown,
* onMouseMove, onClick, and onMouseUp handlers.
*/
function useMenuItemCommonProps(params) {
	const { closeOnClick, highlighted, id, nodeId, store, typingRef, itemRef, itemMetadata } = params;
	const { events: menuEvents } = store.useState("floatingTreeRoot");
	const open = store.useState("open");
	const contextMenuContext = useContextMenuRootContext(true);
	const isContextMenu = contextMenuContext !== void 0;
	return import_react.useMemo(() => ({
		id,
		role: "menuitem",
		tabIndex: open && highlighted ? 0 : -1,
		onKeyDown(event) {
			if (event.key === " " && typingRef?.current) event.preventDefault();
		},
		onMouseMove(event) {
			if (!nodeId) return;
			menuEvents.emit("itemhover", {
				nodeId,
				target: event.currentTarget
			});
		},
		onClick(event) {
			if (closeOnClick) menuEvents.emit("close", {
				domEvent: event,
				reason: itemPress
			});
		},
		onMouseUp(event) {
			if (contextMenuContext) {
				const initialCursorPoint = contextMenuContext.initialCursorPointRef.current;
				contextMenuContext.initialCursorPointRef.current = null;
				if (isContextMenu && initialCursorPoint && Math.abs(event.clientX - initialCursorPoint.x) <= 1 && Math.abs(event.clientY - initialCursorPoint.y) <= 1) return;
				if (isContextMenu && !mac && event.button === 2) return;
			}
			if (itemRef.current && store.context.allowMouseUpTriggerRef.current && (!isContextMenu || event.button === 2)) {
				if (itemMetadata.type === "regular-item") dispatchClickWithModifiers(itemRef.current, event, { detail: 1 });
			}
		}
	}), [
		closeOnClick,
		highlighted,
		id,
		menuEvents,
		nodeId,
		open,
		store,
		typingRef,
		itemRef,
		contextMenuContext,
		isContextMenu,
		itemMetadata
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/item/useMenuItem.mjs
var REGULAR_ITEM = { type: "regular-item" };
function useMenuItem(params) {
	const { closeOnClick, disabled, highlighted, id, store, typingRef = store.context.typingRef, nativeButton, itemMetadata, nodeId } = params;
	const itemRef = import_react.useRef(null);
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		focusableWhenDisabled: true,
		native: nativeButton,
		composite: true
	});
	const commonProps = useMenuItemCommonProps({
		closeOnClick,
		highlighted,
		id,
		nodeId,
		store,
		typingRef,
		itemRef,
		itemMetadata
	});
	const getItemProps = import_react.useCallback((externalProps) => {
		return mergeProps(commonProps, { onMouseEnter() {
			if (itemMetadata.type !== "submenu-trigger") return;
			itemMetadata.setActive();
		} }, externalProps, getButtonProps);
	}, [
		commonProps,
		getButtonProps,
		itemMetadata
	]);
	const mergedRef = useMergedRefs(itemRef, buttonRef);
	return import_react.useMemo(() => ({
		getItemProps,
		itemRef: mergedRef
	}), [getItemProps, mergedRef]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/group/MenuGroupContext.mjs
var MenuGroupContext = /*#__PURE__*/ import_react.createContext(void 0);
function useMenuGroupRootContext() {
	const context = import_react.useContext(MenuGroupContext);
	if (context === void 0) throw new Error(formatErrorMessage(31));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/group/MenuGroup.mjs
/**
* Groups related menu items with the corresponding label.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuGroup = /*#__PURE__*/ import_react.forwardRef(function MenuGroup(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const [labelId, setLabelId] = import_react.useState(void 0);
	const element = useRenderElement("div", componentProps, {
		ref: forwardedRef,
		props: {
			role: "group",
			"aria-labelledby": labelId,
			...elementProps
		}
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(MenuGroupContext.Provider, {
		value: setLabelId,
		children: element
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/group-label/MenuGroupLabel.mjs
/**
* An accessible label that is automatically associated with its parent group.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuGroupLabel = /*#__PURE__*/ import_react.forwardRef(function MenuGroupLabel(componentProps, forwardedRef) {
	const { render, className, style, id: idProp, ...elementProps } = componentProps;
	const id = useBaseUiId(idProp);
	const setLabelId = useMenuGroupRootContext();
	useIsoLayoutEffect(() => {
		setLabelId(id);
		return () => {
			setLabelId((currentId) => currentId === id ? void 0 : currentId);
		};
	}, [setLabelId, id]);
	return useRenderElement("div", componentProps, {
		ref: forwardedRef,
		props: {
			id,
			"aria-hidden": true,
			...elementProps
		}
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/item/MenuItem.mjs
/**
* An individual interactive item in the menu.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuItem = /*#__PURE__*/ import_react.forwardRef(function MenuItem(componentProps, forwardedRef) {
	const { render, className, id: idProp, label, nativeButton = false, disabled: disabledProp = false, closeOnClick = true, style, ...elementProps } = componentProps;
	const listItem = useCompositeListItem({
		guess: true,
		label
	});
	const menuPositionerContext = useMenuPositionerContext(true);
	const id = useBaseUiId(idProp);
	const { store } = useMenuRootContext();
	const rootDisabled = store.useState("disabled");
	const disabled = disabledProp || rootDisabled;
	const highlighted = store.useState("isActive", listItem.index);
	const itemProps = store.useState("itemProps");
	const { getItemProps, itemRef } = useMenuItem({
		closeOnClick,
		disabled,
		highlighted,
		id,
		store,
		nativeButton,
		nodeId: menuPositionerContext?.context.nodeId,
		itemMetadata: REGULAR_ITEM
	});
	return useRenderElement("div", componentProps, {
		state: {
			disabled,
			highlighted
		},
		props: [
			itemProps,
			elementProps,
			getItemProps
		],
		ref: [
			itemRef,
			forwardedRef,
			listItem.ref
		]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/toolbar/root/ToolbarRootContext.mjs
var ToolbarRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useToolbarRootContext(optional) {
	const context = import_react.useContext(ToolbarRootContext);
	if (context === void 0 && !optional) throw new Error(formatErrorMessage(69));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/popup/MenuPopup.mjs
/**
* A container for the menu items.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuPopup = /*#__PURE__*/ import_react.forwardRef(function MenuPopup(componentProps, forwardedRef) {
	const { render, className, style, finalFocus, ...elementProps } = componentProps;
	const { store } = useMenuRootContext();
	const { side, align } = useMenuPositionerContext();
	const insideToolbar = useToolbarRootContext(true) != null;
	const open = store.useState("open");
	const transitionStatus = store.useState("transitionStatus");
	const popupProps = store.useState("popupProps");
	const mounted = store.useState("mounted");
	const instantType = store.useState("instantType");
	const activeTriggerElement = store.useState("activeTriggerElement");
	const parent = store.useState("parent");
	const lastOpenChangeReason = store.useState("lastOpenChangeReason");
	const rootId = store.useState("rootId");
	const floatingContext = store.useState("floatingRootContext");
	const floatingTreeRoot = store.useState("floatingTreeRoot");
	const closeDelay = store.useState("closeDelay");
	const hoverEnabled = store.useState("hoverEnabled");
	const disabled = store.useState("disabled");
	const openMethod = store.useState("openMethod");
	const isContextMenu = parent.type === "context-menu";
	useOpenChangeComplete({
		open,
		ref: store.context.popupRef,
		onComplete() {
			if (open) store.context.onOpenChangeComplete?.(true);
		}
	});
	import_react.useEffect(() => {
		function handleClose(event) {
			store.setOpen(false, createChangeEventDetails(event.reason, event.domEvent));
		}
		floatingTreeRoot.events.on("close", handleClose);
		return () => {
			floatingTreeRoot.events.off("close", handleClose);
		};
	}, [floatingTreeRoot.events, store]);
	useHoverFloatingInteraction(floatingContext, {
		enabled: hoverEnabled && !disabled && !isContextMenu && parent.type !== "menubar",
		closeDelay
	});
	const setPopupElement = store.useStateSetter("popupElement");
	const element = useRenderElement("div", componentProps, {
		state: {
			transitionStatus,
			side,
			align,
			open,
			nested: parent.type === "menu",
			instant: instantType
		},
		ref: [
			forwardedRef,
			store.context.popupRef,
			setPopupElement
		],
		stateAttributesMapping: popupTransitionStateMapping,
		props: [
			popupProps,
			{ onKeyDown(event) {
				if (insideToolbar && COMPOSITE_KEYS.has(event.key)) event.stopPropagation();
			} },
			getDisabledMountTransitionStyles(transitionStatus),
			elementProps,
			{ "data-rootownerid": rootId }
		]
	});
	let returnFocus = parent.type === void 0 || isContextMenu;
	if (activeTriggerElement || parent.type === "menubar" && lastOpenChangeReason !== "outside-press") returnFocus = true;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingFocusManager, {
		context: floatingContext,
		openInteractionType: openMethod,
		modal: isContextMenu,
		disabled: !mounted,
		returnFocus: finalFocus === void 0 ? returnFocus : finalFocus,
		initialFocus: parent.type !== "menu",
		restoreFocus: true,
		externalTree: parent.type !== "menubar" ? floatingTreeRoot : void 0,
		previousFocusableElement: activeTriggerElement,
		nextFocusableElement: parent.type === void 0 ? store.context.triggerFocusTargetRef : void 0,
		beforeContentFocusGuardRef: parent.type === void 0 ? store.context.beforeContentFocusGuardRef : void 0,
		children: element
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/portal/MenuPortalContext.mjs
var MenuPortalContext = /*#__PURE__*/ import_react.createContext(void 0);
function useMenuPortalContext() {
	const value = import_react.useContext(MenuPortalContext);
	if (value === void 0) throw new Error(formatErrorMessage(32));
	return value;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/portal/MenuPortal.mjs
/**
* A portal element that moves the popup to a different part of the DOM.
* By default, the portal element is appended to `<body>`.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuPortal = /*#__PURE__*/ import_react.forwardRef(function MenuPortal(props, forwardedRef) {
	const { keepMounted = false, ...portalProps } = props;
	const { store, parent } = useMenuRootContext();
	if (!(store.useState("mounted") || keepMounted)) return null;
	const portalOwnerRole = parent.type === "menu" || parent.type === "menubar" ? "group" : void 0;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(MenuPortalContext.Provider, {
		value: keepMounted,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingPortal, {
			ref: forwardedRef,
			...portalProps,
			portalOwnerRole
		})
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/positioner/MenuPositioner.mjs
/**
* Positions the menu popup against the trigger.
* Renders a `<div>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuPositioner = /*#__PURE__*/ import_react.forwardRef(function MenuPositioner(componentProps, forwardedRef) {
	const { anchor: anchorProp, positionMethod: positionMethodProp = "absolute", className, render, side, align: alignProp, sideOffset: sideOffsetProp = 0, alignOffset: alignOffsetProp = 0, collisionBoundary = "clipping-ancestors", collisionPadding = 5, arrowPadding = 5, sticky = false, disableAnchorTracking = false, collisionAvoidance: collisionAvoidanceProp = DROPDOWN_COLLISION_AVOIDANCE, style, ...elementProps } = componentProps;
	const { store } = useMenuRootContext();
	const keepMounted = useMenuPortalContext();
	const contextMenuContext = useContextMenuRootContext(true);
	const parent = store.useState("parent");
	const floatingRootContext = store.useState("floatingRootContext");
	const floatingTreeRoot = store.useState("floatingTreeRoot");
	const mounted = store.useState("mounted");
	const open = store.useState("open");
	const modal = store.useState("modal");
	const openMethod = store.useState("openMethod");
	const triggerElement = store.useState("activeTriggerElement");
	const transitionStatus = store.useState("transitionStatus");
	const positionerElement = store.useState("positionerElement");
	const instantType = store.useState("instantType");
	const adaptiveOrigin = store.useState("adaptiveOrigin");
	const lastOpenChangeReason = store.useState("lastOpenChangeReason");
	const floatingNodeId = store.useState("floatingNodeId");
	const floatingParentNodeId = store.useState("floatingParentNodeId");
	const domReference = floatingRootContext.useState("domReferenceElement");
	const previousTriggerRef = import_react.useRef(null);
	const runOnceAnimationsFinish = useAnimationsFinished(positionerElement);
	let anchor = anchorProp;
	let sideOffset = sideOffsetProp;
	let alignOffset = alignOffsetProp;
	let align = alignProp;
	let collisionAvoidance = collisionAvoidanceProp;
	if (parent.type === "context-menu") {
		anchor = anchorProp ?? parent.context?.anchor;
		align = align ?? "start";
		if (!side && align !== "center") {
			alignOffset = componentProps.alignOffset ?? 2;
			sideOffset = componentProps.sideOffset ?? -5;
		}
	}
	let computedSide = side;
	let computedAlign = align;
	if (parent.type === "menu") {
		computedSide = computedSide ?? "inline-end";
		computedAlign = computedAlign ?? "start";
		collisionAvoidance = componentProps.collisionAvoidance ?? POPUP_COLLISION_AVOIDANCE;
	} else if (parent.type === "menubar") {
		computedSide = computedSide ?? (parent.context.orientation === "vertical" ? "inline-end" : "bottom");
		computedAlign = computedAlign ?? "start";
	}
	const contextMenu = parent.type === "context-menu";
	const positioner = useAnchorPositioning({
		anchor,
		floatingRootContext,
		positionMethod: contextMenuContext ? "fixed" : positionMethodProp,
		mounted,
		side: computedSide,
		sideOffset,
		align: computedAlign,
		alignOffset,
		arrowPadding: contextMenu ? 0 : arrowPadding,
		collisionBoundary,
		collisionPadding,
		sticky,
		nodeId: floatingNodeId,
		keepMounted,
		disableAnchorTracking,
		collisionAvoidance,
		shift: contextMenu ? {
			crossAxis: !("side" in collisionAvoidance && collisionAvoidance.side === "flip"),
			rootBoundary: "layoutViewport"
		} : void 0,
		externalTree: floatingTreeRoot,
		adaptiveOrigin
	});
	import_react.useEffect(() => {
		function onMenuOpenChange(details) {
			if (details.open) {
				if (details.parentNodeId === floatingNodeId) store.set("hoverEnabled", false);
				if (details.nodeId !== floatingNodeId && details.parentNodeId === store.select("floatingParentNodeId")) store.setOpen(false, createChangeEventDetails(siblingOpen));
			}
		}
		floatingTreeRoot.events.on("menuopenchange", onMenuOpenChange);
		return () => {
			floatingTreeRoot.events.off("menuopenchange", onMenuOpenChange);
		};
	}, [
		store,
		floatingTreeRoot.events,
		floatingNodeId
	]);
	import_react.useEffect(() => {
		if (store.select("floatingParentNodeId") == null) return;
		function onParentClose(details) {
			if (details.open || details.nodeId !== store.select("floatingParentNodeId")) return;
			const reason = details.reason ?? "sibling-open";
			store.setOpen(false, createChangeEventDetails(reason));
		}
		floatingTreeRoot.events.on("menuopenchange", onParentClose);
		return () => {
			floatingTreeRoot.events.off("menuopenchange", onParentClose);
		};
	}, [floatingTreeRoot.events, store]);
	const closeTimeout = useTimeout();
	import_react.useEffect(() => {
		if (!open) closeTimeout.clear();
	}, [open, closeTimeout]);
	import_react.useEffect(() => {
		function onItemHover(event) {
			if (!open || event.nodeId !== store.select("floatingParentNodeId")) return;
			if (event.target && triggerElement && triggerElement !== event.target) {
				const delay = store.select("closeDelay");
				if (delay > 0) {
					if (!closeTimeout.isStarted()) closeTimeout.start(delay, () => {
						store.setOpen(false, createChangeEventDetails(siblingOpen));
					});
				} else store.setOpen(false, createChangeEventDetails(siblingOpen));
			} else closeTimeout.clear();
		}
		floatingTreeRoot.events.on("itemhover", onItemHover);
		return () => {
			floatingTreeRoot.events.off("itemhover", onItemHover);
		};
	}, [
		floatingTreeRoot.events,
		open,
		triggerElement,
		store,
		closeTimeout
	]);
	import_react.useEffect(() => {
		const eventDetails = {
			open,
			nodeId: floatingNodeId,
			parentNodeId: floatingParentNodeId,
			reason: store.select("lastOpenChangeReason")
		};
		floatingTreeRoot.events.emit("menuopenchange", eventDetails);
	}, [
		floatingTreeRoot.events,
		open,
		store,
		floatingNodeId,
		floatingParentNodeId
	]);
	useIsoLayoutEffect(() => {
		const currentTrigger = domReference;
		const previousTrigger = previousTriggerRef.current;
		if (currentTrigger) previousTriggerRef.current = currentTrigger;
		if (previousTrigger && currentTrigger && currentTrigger !== previousTrigger) {
			store.set("instantType", void 0);
			const abortController = new AbortController();
			runOnceAnimationsFinish(() => {
				store.set("instantType", "trigger-change");
			}, abortController.signal);
			return () => {
				abortController.abort();
			};
		}
	}, [
		domReference,
		runOnceAnimationsFinish,
		store
	]);
	const state = {
		open,
		side: positioner.side,
		align: positioner.align,
		anchorHidden: positioner.anchorHidden,
		nested: parent.type === "menu",
		instant: instantType
	};
	const menubarModal = parent.type === "menubar" && parent.context.modal;
	useAnchoredPopupScrollLock(open && (menubarModal || modal && lastOpenChangeReason !== "trigger-hover"), openMethod === "touch", positionerElement, triggerElement);
	const element = usePositioner(componentProps, state, {
		styles: positioner.positionerStyles,
		transitionStatus,
		props: elementProps,
		refs: [forwardedRef, store.useStateSetter("positionerElement")],
		hidden: !mounted,
		inert: !open
	});
	const shouldRenderBackdrop = mounted && parent.type !== "menu" && (parent.type !== "menubar" && modal && lastOpenChangeReason !== "trigger-hover" || parent.type === "menubar" && parent.context.modal);
	let backdropCutout = null;
	if (parent.type === "menubar") backdropCutout = parent.context.contentElement;
	else if (parent.type === void 0) backdropCutout = triggerElement;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(MenuPositionerContext.Provider, {
		value: positioner,
		children: [shouldRenderBackdrop && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(InternalBackdrop, {
			ref: parent.type === "context-menu" || parent.type === "nested-context-menu" ? parent.context.internalBackdropRef : null,
			inert: inertValue(!open),
			cutout: backdropCutout
		}), /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingNode, {
			id: floatingNodeId,
			children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeList, {
				elementsRef: store.context.itemDomElements,
				labelsRef: store.context.itemLabels,
				children: element
			})
		})]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menubar/MenubarContext.mjs
var MenubarContext = /*#__PURE__*/ import_react.createContext(null);
function useMenubarContext(optional) {
	const context = import_react.useContext(MenubarContext);
	if (context === null && !optional) throw new Error(formatErrorMessage(5));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/store/MenuStore.mjs
var selectors$2 = {
	...popupStoreSelectors,
	disabled: (state) => state.parent.type === "menubar" ? state.parent.context.disabled || state.disabled : state.disabled,
	modal: (state) => (state.parent.type === void 0 || state.parent.type === "context-menu") && (state.modal ?? true),
	openMethod: (state) => state.openMethod,
	allowMouseEnter: (state) => state.allowMouseEnter,
	highlightItemOnHover: (state) => state.highlightItemOnHover,
	parent: (state) => state.parent,
	rootId: (state) => {
		if (state.parent.type === "menu") return state.parent.store.select("rootId");
		return state.parent.type !== void 0 ? state.parent.context.rootId : state.rootId;
	},
	activeIndex: (state) => state.activeIndex,
	isActive: (state, itemIndex) => state.activeIndex === itemIndex,
	hoverEnabled: (state) => state.hoverEnabled,
	instantType: (state) => state.instantType,
	lastOpenChangeReason: (state) => state.openChangeReason,
	floatingTreeRoot: (state) => {
		if (state.parent.type === "menu") return state.parent.store.select("floatingTreeRoot");
		return state.floatingTreeRoot;
	},
	floatingNodeId: (state) => state.floatingNodeId,
	floatingParentNodeId: (state) => state.floatingParentNodeId,
	itemProps: (state) => state.itemProps,
	closeDelay: (state) => state.closeDelay,
	adaptiveOrigin: (state) => state.adaptiveOrigin,
	keyboardEventRelay: (state) => {
		if (state.keyboardEventRelay) return state.keyboardEventRelay;
		if (state.parent.type === "menu") return state.parent.store.select("keyboardEventRelay");
	}
};
/**
* The store view that detached handle-backed triggers read from. Both the real `MenuStore` and the
* inert fallback store satisfy it, so a trigger can read from whichever store the handle currently
* exposes. Narrowed to the members a trigger actually uses — the trigger-data members plus `setOpen`
* (called by the focus guards) — so the exposed surface can't bypass the open-change pipeline; on
* the detached fallback store every one of these mutations is a no-op.
*/
var MenuStore = class extends ReactStore {
	constructor(initialState, floatingId, nested = false) {
		const triggerElements = new PopupTriggerMap();
		const state = createInitialState$1(triggerElements, floatingId, nested, initialState);
		super(state, createInitialContext$1(triggerElements), selectors$2);
		this.unsubscribeParentListener = this.observe("parent", (parent) => {
			this.unsubscribeParentListener?.();
			if (parent.type === "menu") {
				let rootId = parent.store.select("rootId");
				let floatingTreeRoot = parent.store.select("floatingTreeRoot");
				let keyboardEventRelay = parent.store.select("keyboardEventRelay");
				this.unsubscribeParentListener = parent.store.subscribe(() => {
					const nextRootId = parent.store.select("rootId");
					const nextFloatingTreeRoot = parent.store.select("floatingTreeRoot");
					const nextKeyboardEventRelay = parent.store.select("keyboardEventRelay");
					if (rootId === nextRootId && floatingTreeRoot === nextFloatingTreeRoot && keyboardEventRelay === nextKeyboardEventRelay) return;
					rootId = nextRootId;
					floatingTreeRoot = nextFloatingTreeRoot;
					keyboardEventRelay = nextKeyboardEventRelay;
					this.notifyAll();
				});
				this.context.allowMouseUpTriggerRef = parent.store.context.allowMouseUpTriggerRef;
				return;
			}
			if (parent.type !== void 0) this.context.allowMouseUpTriggerRef = parent.context.allowMouseUpTriggerRef;
			this.unsubscribeParentListener = null;
		});
	}
	setOpen(open, eventDetails) {
		this.state.floatingRootContext.context.events.emit("setOpen", {
			open,
			eventDetails
		});
	}
	unsubscribeParentListener = null;
};
function createInitialContext$1(triggerElements) {
	return {
		positionerRef: /*#__PURE__*/ import_react.createRef(),
		popupRef: /*#__PURE__*/ import_react.createRef(),
		typingRef: { current: false },
		itemDomElements: { current: [] },
		itemLabels: { current: [] },
		allowMouseUpTriggerRef: { current: false },
		triggerFocusTargetRef: /*#__PURE__*/ import_react.createRef(),
		beforeContentFocusGuardRef: /*#__PURE__*/ import_react.createRef(),
		onOpenChangeComplete: void 0,
		triggerElements
	};
}
function createInitialState$1(triggerElements, floatingId, nested = false, initialState) {
	return {
		...createInitialPopupStoreState(triggerElements, floatingId, nested),
		disabled: false,
		modal: true,
		openMethod: null,
		allowMouseEnter: false,
		highlightItemOnHover: true,
		parent: { type: void 0 },
		rootId: void 0,
		activeIndex: null,
		hoverEnabled: true,
		instantType: void 0,
		openChangeReason: null,
		floatingTreeRoot: new FloatingTreeStore(),
		floatingNodeId: void 0,
		floatingParentNodeId: null,
		itemProps: EMPTY_OBJECT,
		keyboardEventRelay: void 0,
		closeDelay: 0,
		adaptiveOrigin: void 0,
		...initialState
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/submenu-root/MenuSubmenuRootContext.mjs
var MenuSubmenuRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useMenuSubmenuRootContext() {
	return import_react.useContext(MenuSubmenuRootContext);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/root/MenuRoot.mjs
/**
* Groups all parts of the menu.
* Doesn't render its own HTML element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuRoot = fastComponent(function MenuRoot(props) {
	const { children, open: openProp, onOpenChange, onOpenChangeComplete, defaultOpen = false, disabled: disabledProp = false, modal: modalProp, loopFocus = true, orientation = "vertical", actionsRef, closeParentOnEsc = false, handle, triggerId: triggerIdProp, defaultTriggerId: defaultTriggerIdProp = null, highlightItemOnHover = true } = props;
	const contextMenuContext = useContextMenuRootContext(true);
	const parentMenuRootContext = useMenuRootContext(true);
	const menubarContext = useMenubarContext(true);
	const isSubmenu = useMenuSubmenuRootContext();
	const parentFromContext = import_react.useMemo(() => {
		if (isSubmenu && parentMenuRootContext) return {
			type: "menu",
			store: parentMenuRootContext.store
		};
		if (menubarContext) return {
			type: "menubar",
			context: menubarContext
		};
		if (contextMenuContext && !parentMenuRootContext) return {
			type: "context-menu",
			context: contextMenuContext
		};
		return { type: void 0 };
	}, [
		contextMenuContext,
		parentMenuRootContext,
		menubarContext,
		isSubmenu
	]);
	const rootId = useId();
	const floatingId = useId();
	const floatingParentNodeIdFromContext = useFloatingParentNodeId();
	const parentMenuStore = parentFromContext.type === "menu" ? parentFromContext.store : void 0;
	const animateInitialOpen = (openProp ?? defaultOpen) && parentMenuStore?.state.transitionStatus === "starting";
	const seededInstantType = useRefWithInit(() => animateInitialOpen ? parentMenuStore?.state.instantType : void 0).current;
	const store = useMenuRootStore({
		open: defaultOpen,
		openProp,
		activeTriggerId: defaultTriggerIdProp,
		triggerIdProp,
		parent: parentFromContext,
		disabled: disabledProp,
		highlightItemOnHover,
		modal: parentFromContext.type === void 0 ? modalProp : void 0,
		rootId,
		instantType: seededInstantType
	}, floatingId, floatingParentNodeIdFromContext != null);
	store.useControlledProp("openProp", openProp);
	store.useControlledProp("triggerIdProp", triggerIdProp);
	store.useContextCallback("onOpenChangeComplete", onOpenChangeComplete);
	const floatingTreeRoot = store.useState("floatingTreeRoot");
	const floatingNodeIdFromContext = useFloatingNodeId(floatingTreeRoot);
	const open = store.useState("open");
	const activeTriggerElement = store.useState("activeTriggerElement");
	const positionerElement = store.useState("positionerElement");
	const hoverEnabled = store.useState("hoverEnabled");
	const disabled = store.useState("disabled");
	const lastOpenChangeReason = store.useState("lastOpenChangeReason");
	const parent = store.useState("parent");
	const activeIndex = store.useState("activeIndex");
	const payload = store.useState("payload");
	const floatingParentNodeId = store.useState("floatingParentNodeId");
	const openEventRef = import_react.useRef(null);
	const allowOutsidePressDismissalRef = import_react.useRef(parent.type !== "context-menu");
	const allowOutsidePressDismissalTimeout = useTimeout();
	const allowTouchToCloseRef = import_react.useRef(true);
	const allowTouchToCloseTimeout = useTimeout();
	const nested = floatingParentNodeId != null;
	const { openMethod, triggerProps: interactionTypeProps } = useOpenInteractionType(open);
	store.useSyncedValues({
		disabled: disabledProp,
		highlightItemOnHover,
		modal: parent.type === void 0 ? modalProp : void 0,
		openMethod,
		rootId
	});
	useImplicitActiveTrigger(store);
	const { forceUnmount, transitionStatus } = useOpenStateTransitions(open, store, () => {
		store.set("allowMouseEnter", false);
	}, animateInitialOpen);
	const runOnceAnimationsFinish = useAnimationsFinished(store.context.popupRef);
	import_react.useEffect(() => {
		if (seededInstantType === void 0) return;
		const clearSeededInstantType = () => {
			if (store.state.instantType === seededInstantType) store.set("instantType", void 0);
		};
		if (!open) {
			clearSeededInstantType();
			return;
		}
		if (transitionStatus !== void 0) return;
		if (store.context.popupRef.current == null) {
			clearSeededInstantType();
			return;
		}
		const abortController = new AbortController();
		runOnceAnimationsFinish(clearSeededInstantType, abortController.signal);
		return () => {
			abortController.abort();
		};
	}, [
		seededInstantType,
		open,
		transitionStatus,
		runOnceAnimationsFinish,
		store
	]);
	useIsoLayoutEffect(() => {
		if (contextMenuContext && !parentMenuRootContext) store.update({
			parent: {
				type: "context-menu",
				context: contextMenuContext
			},
			floatingNodeId: floatingNodeIdFromContext,
			floatingParentNodeId: floatingParentNodeIdFromContext
		});
		else if (parentMenuRootContext) store.update({
			floatingNodeId: floatingNodeIdFromContext,
			floatingParentNodeId: floatingParentNodeIdFromContext
		});
	}, [
		contextMenuContext,
		parentMenuRootContext,
		floatingNodeIdFromContext,
		floatingParentNodeIdFromContext,
		store
	]);
	import_react.useEffect(() => {
		if (!open) openEventRef.current = null;
		if (parent.type !== "context-menu") return;
		if (!open) {
			allowOutsidePressDismissalTimeout.clear();
			allowOutsidePressDismissalRef.current = false;
			return;
		}
		allowOutsidePressDismissalTimeout.start(500, () => {
			allowOutsidePressDismissalRef.current = true;
		});
	}, [
		allowOutsidePressDismissalTimeout,
		open,
		parent.type
	]);
	useIsoLayoutEffect(() => {
		if (!open && !hoverEnabled) store.set("hoverEnabled", true);
	}, [
		open,
		hoverEnabled,
		store
	]);
	const setOpen = useStableCallback((nextOpen, eventDetails) => {
		const reason = eventDetails.reason;
		if (!nextOpen && !store.select("open")) return;
		if (open === nextOpen && eventDetails.trigger === activeTriggerElement && lastOpenChangeReason === reason) return;
		const shouldPreventUnmountOnClose = attachPreventUnmountOnClose(eventDetails);
		if (!nextOpen && eventDetails.trigger == null) eventDetails.trigger = activeTriggerElement ?? void 0;
		onOpenChange?.(nextOpen, eventDetails);
		if (eventDetails.isCanceled) return;
		store.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);
		const nativeEvent = eventDetails.event;
		if (nextOpen === false && nativeEvent?.type === "click" && nativeEvent.pointerType === "touch" && !allowTouchToCloseRef.current) return;
		if (nextOpen && reason === "trigger-focus") {
			allowTouchToCloseRef.current = false;
			allowTouchToCloseTimeout.start(300, () => {
				allowTouchToCloseRef.current = true;
			});
		} else {
			allowTouchToCloseRef.current = true;
			allowTouchToCloseTimeout.clear();
		}
		const isKeyboardClick = (reason === "trigger-press" || reason === "item-press") && nativeEvent.detail === 0;
		const isDismissClose = !nextOpen && (reason === "escape-key" || reason == null);
		openEventRef.current = eventDetails.event;
		const popupOpenState = createPopupOpenState(store.state, nextOpen, eventDetails.trigger, shouldPreventUnmountOnClose());
		popupOpenState.openChangeReason = reason;
		if (parent.type === "menubar" && (reason === "trigger-focus" || reason === "focus-out" || reason === "trigger-hover" || reason === "list-navigation" || reason === "sibling-open")) popupOpenState.instantType = "group";
		else if (isKeyboardClick || isDismissClose) popupOpenState.instantType = isKeyboardClick ? "click" : "dismiss";
		else popupOpenState.instantType = void 0;
		store.update(popupOpenState);
	});
	const floatingRootContext = useSyncedFloatingRootContext({
		popupStore: store,
		floatingRootContext: store.state.floatingRootContext,
		floatingId,
		nested: floatingParentNodeIdFromContext != null,
		onOpenChange: setOpen
	});
	const floatingEvents = floatingRootContext.context.events;
	useIsoLayoutEffect(() => {
		const handleSetOpenEvent = ({ open: nextOpen, eventDetails }) => setOpen(nextOpen, eventDetails);
		floatingEvents.on("setOpen", handleSetOpenEvent);
		return () => {
			floatingEvents?.off("setOpen", handleSetOpenEvent);
		};
	}, [floatingEvents, setOpen]);
	const handleImperativeClose = import_react.useCallback(() => {
		store.setOpen(false, createChangeEventDetails(imperativeAction));
	}, [store]);
	import_react.useImperativeHandle(actionsRef, () => ({
		unmount: forceUnmount,
		close: handleImperativeClose
	}), [forceUnmount, handleImperativeClose]);
	let ctx;
	if (parent.type === "context-menu") ctx = parent.context;
	import_react.useImperativeHandle(ctx?.positionerRef, () => positionerElement, [positionerElement]);
	import_react.useImperativeHandle(ctx?.actionsRef, () => ({ setOpen }), [setOpen]);
	const dismiss = useDismiss(floatingRootContext, {
		enabled: !disabled,
		bubbles: { escapeKey: closeParentOnEsc && parent.type === "menu" },
		outsidePress() {
			if (parent.type !== "context-menu" || openEventRef.current?.type === "contextmenu") return true;
			return allowOutsidePressDismissalRef.current;
		},
		externalTree: nested ? floatingTreeRoot : void 0
	});
	const direction = useDirection();
	const setActiveIndex = import_react.useCallback((index) => {
		if (store.select("activeIndex") === index) return;
		store.set("activeIndex", index);
	}, [store]);
	const listNavigation$1 = useListNavigation(floatingRootContext, {
		enabled: !disabled,
		listRef: store.context.itemDomElements,
		activeIndex,
		nested: parent.type !== void 0,
		loopFocus,
		orientation,
		parentOrientation: parent.type === "menubar" ? parent.context.orientation : void 0,
		rtl: direction === "rtl",
		disabledIndices: EMPTY_ARRAY,
		onNavigate: setActiveIndex,
		openOnArrowKeyDown: parent.type !== "context-menu",
		externalTree: nested ? floatingTreeRoot : void 0,
		focusItemOnHover: highlightItemOnHover
	});
	const onTyping = import_react.useCallback((nextTyping) => {
		store.context.typingRef.current = nextTyping;
	}, [store]);
	const typeahead = useTypeahead(floatingRootContext, {
		enabled: !disabled,
		listRef: store.context.itemLabels,
		elementsRef: store.context.itemDomElements,
		activeIndex,
		resetMs: 500,
		onMatch: (index) => {
			if (open && index !== activeIndex) store.set("activeIndex", index);
		},
		onTyping
	});
	const activeTriggerProps = import_react.useMemo(() => {
		const mergedProps = mergeProps(typeahead.reference, listNavigation$1.reference, dismiss.reference, { onMouseMove() {
			store.set("allowMouseEnter", true);
		} }, interactionTypeProps);
		mergedProps["aria-haspopup"] = "menu";
		mergedProps["aria-expanded"] = open;
		return mergedProps;
	}, [
		store,
		typeahead.reference,
		listNavigation$1.reference,
		dismiss.reference,
		interactionTypeProps,
		open
	]);
	const inactiveTriggerProps = import_react.useMemo(() => {
		const mergedProps = mergeProps(listNavigation$1.trigger, dismiss.trigger, interactionTypeProps);
		mergedProps["aria-haspopup"] = "menu";
		mergedProps["aria-expanded"] = false;
		return mergedProps;
	}, [
		listNavigation$1.trigger,
		dismiss.trigger,
		interactionTypeProps
	]);
	useRefWithInit(() => {
		store.update({ inactiveTriggerProps });
		return null;
	});
	usePopupInteractionProps(store, {
		floatingRootContext,
		activeTriggerProps,
		inactiveTriggerProps,
		popupProps: import_react.useMemo(() => mergeProps(FOCUSABLE_POPUP_PROPS, {
			id: floatingId,
			role: "menu",
			"aria-orientation": orientation === "horizontal" ? "horizontal" : void 0,
			"aria-labelledby": activeTriggerElement?.id,
			onMouseMove() {
				store.set("allowMouseEnter", true);
				if (parent.type === "menu") store.set("hoverEnabled", false);
			},
			onClick() {
				if (store.select("hoverEnabled")) store.set("hoverEnabled", false);
			},
			onKeyDown(event) {
				const relay = store.select("keyboardEventRelay");
				if (relay && !event.isPropagationStopped()) relay(event);
			}
		}, typeahead.floating, listNavigation$1.floating, dismiss.floating), [
			activeTriggerElement,
			floatingId,
			orientation,
			parent.type,
			store,
			typeahead.floating,
			listNavigation$1.floating,
			dismiss.floating
		]),
		itemProps: listNavigation$1.item ?? EMPTY_OBJECT
	});
	const context = import_react.useMemo(() => ({
		store,
		parent: parentFromContext
	}), [store, parentFromContext]);
	const content = /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(MenuRootContext.Provider, {
		value: context,
		children: [handle && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(PopupHandleAttachment, {
			handle,
			store
		}), typeof children === "function" ? children({ payload }) : children]
	});
	if (parent.type === void 0 || parent.type === "context-menu") return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingTree, {
		externalTree: floatingTreeRoot,
		children: content
	});
	return content;
});
function useMenuRootStore(initialState, floatingId, nested) {
	return useRefWithInit(() => new MenuStore(initialState, floatingId, nested)).current;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/item/useCompositeItem.mjs
function useCompositeItem(params = {}) {
	const { highlightItemOnHover, highlightedIndex, onHighlightedIndexChange } = useCompositeRootContext();
	const { ref, index } = useCompositeListItem(params);
	const isHighlighted = highlightedIndex === index;
	const itemRef = import_react.useRef(null);
	const mergedRef = useMergedRefs(ref, itemRef);
	return {
		compositeProps: {
			tabIndex: isHighlighted ? 0 : -1,
			onFocus() {
				onHighlightedIndexChange(index);
			},
			onMouseMove() {
				const item = itemRef.current;
				if (!highlightItemOnHover || !item) return;
				const disabled = item.hasAttribute("disabled") || item.ariaDisabled === "true";
				if (!isHighlighted && !disabled) item.focus();
			}
		},
		compositeRef: mergedRef,
		index
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/item/CompositeItem.mjs
function CompositeItem(componentProps) {
	const { render, className, style, state = EMPTY_OBJECT, props = EMPTY_ARRAY, refs = EMPTY_ARRAY, metadata, stateAttributesMapping, tag = "div", ...elementProps } = componentProps;
	const { compositeProps, compositeRef } = useCompositeItem({ metadata });
	return useRenderElement(tag, componentProps, {
		state,
		ref: [compositeRef, ...refs],
		props: [
			compositeProps,
			...props,
			elementProps
		],
		stateAttributesMapping
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/utils/findRootOwnerId.mjs
function findRootOwnerId(node) {
	if (isHTMLElement(node) && node.hasAttribute("data-rootownerid")) return node.getAttribute("data-rootownerid");
	if (isLastTraversableNode(node)) return;
	return findRootOwnerId(getParentNode(node));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/useTriggerFocusGuards.mjs
/**
* Minimal store interface required by the focus guard hook.
* Both PopoverStore and MenuStore satisfy this interface.
*/
/**
* Provides focus guard handlers for popup triggers (Popover, Menu).
*
* When the popup is open, invisible focus guard elements are placed before and after
* the trigger. These handlers close the popup and move focus to the appropriate
* tabbable element when the guards receive focus (i.e. when the user tabs out).
*/
function useTriggerFocusGuards(store, triggerElementRef) {
	const preFocusGuardRef = import_react.useRef(null);
	function handlePreFocusGuardFocus(event) {
		import_react_dom.flushSync(() => {
			store.setOpen(false, createChangeEventDetails(focusOut, event.nativeEvent, event.currentTarget));
		});
		getTabbableBeforeElement(preFocusGuardRef.current)?.focus();
	}
	function handleFocusTargetFocus(event) {
		const positionerElement = store.select("positionerElement");
		if (positionerElement && isOutsideEvent(event, positionerElement)) store.context.beforeContentFocusGuardRef.current?.focus();
		else {
			import_react_dom.flushSync(() => {
				store.setOpen(false, createChangeEventDetails(focusOut, event.nativeEvent, event.currentTarget));
			});
			let nextTabbable = getTabbableAfterElement(store.context.triggerFocusTargetRef.current || triggerElementRef.current);
			while (nextTabbable !== null && contains(positionerElement, nextTabbable)) {
				const prevTabbable = nextTabbable;
				nextTabbable = getNextTabbable(nextTabbable);
				if (nextTabbable === prevTabbable) break;
			}
			nextTabbable?.focus();
		}
	}
	return {
		preFocusGuardRef,
		handlePreFocusGuardFocus,
		handleFocusTargetFocus
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useMixedToggleClickHandler.mjs
/**
* Returns `click` and `mousedown` handlers that fix the behavior of triggers of popups that are toggled by different events.
* For example, a button that opens a popup on mousedown and closes it on click.
* This hook prevents the popup from closing immediately after the mouse button is released.
*/
function useMixedToggleClickHandler(params) {
	const { enabled = true, mouseDownAction, open } = params;
	const ignoreClickRef = import_react.useRef(false);
	return import_react.useMemo(() => {
		if (!enabled) return EMPTY_OBJECT;
		return {
			onMouseDown: (event) => {
				if (mouseDownAction === "open" && !open || mouseDownAction === "close" && open) {
					ignoreClickRef.current = true;
					ownerDocument(event.currentTarget).addEventListener("click", () => {
						ignoreClickRef.current = false;
					}, { once: true });
				}
			},
			onClick: (event) => {
				if (ignoreClickRef.current) {
					ignoreClickRef.current = false;
					event.preventBaseUIHandler();
				}
			}
		};
	}, [
		enabled,
		mouseDownAction,
		open
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/trigger/MenuTrigger.mjs
/**
* A button that opens the menu.
* Renders a `<button>` element.
*
* Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
*/
var MenuTrigger = fastComponentRef(function MenuTrigger(componentProps, forwardedRef) {
	const { render, className, style, disabled: disabledProp = false, nativeButton = true, id: idProp, openOnHover: openOnHoverProp, delay = 100, closeDelay = 0, handle, payload, ...elementProps } = componentProps;
	const rootContext = useMenuRootContext(true);
	const store = usePopupHandleStore(handle) ?? rootContext?.store;
	if (!store) throw new Error(formatErrorMessage(85));
	const thisTriggerId = useBaseUiId(idProp);
	const isTriggerActive = store.useState("isTriggerActive", thisTriggerId);
	const floatingRootContext = store.useState("floatingRootContext");
	const isOpenedByThisTrigger = store.useState("isOpenedByTrigger", thisTriggerId);
	const popupId = store.useState("triggerPopupId", thisTriggerId);
	const triggerElementRef = import_react.useRef(null);
	const parent = useMenuParent();
	const compositeRootContext = useCompositeRootContext(true);
	const floatingTreeRootFromContext = useFloatingTree();
	const floatingTreeRoot = import_react.useMemo(() => {
		return floatingTreeRootFromContext ?? new FloatingTreeStore();
	}, [floatingTreeRootFromContext]);
	const { registerTrigger, isMountedByThisTrigger } = useTriggerDataForwarding(thisTriggerId, triggerElementRef, store, {
		payload,
		closeDelay,
		parent,
		floatingTreeRoot,
		floatingNodeId: useFloatingNodeId(floatingTreeRoot),
		floatingParentNodeId: useFloatingParentNodeId(),
		keyboardEventRelay: compositeRootContext?.relayKeyboardEvent
	});
	const isInMenubar = parent.type === "menubar";
	const rootDisabled = store.useState("disabled");
	const disabled = disabledProp || rootDisabled || isInMenubar && parent.context.disabled;
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	import_react.useEffect(() => {
		if (!isOpenedByThisTrigger && parent.type === void 0) store.context.allowMouseUpTriggerRef.current = false;
	}, [
		store,
		isOpenedByThisTrigger,
		parent.type
	]);
	const triggerRef = import_react.useRef(null);
	const allowMouseUpTriggerTimeout = useTimeout();
	const handleDocumentMouseUp = useStableCallback((mouseEvent) => {
		if (!triggerRef.current) return;
		allowMouseUpTriggerTimeout.clear();
		store.context.allowMouseUpTriggerRef.current = false;
		const mouseUpTarget = mouseEvent.target;
		if (contains(triggerRef.current, mouseUpTarget) || contains(store.select("positionerElement"), mouseUpTarget) || mouseUpTarget === triggerRef.current) return;
		if (mouseUpTarget != null && findRootOwnerId(mouseUpTarget) === store.select("rootId")) return;
		if (isMouseWithinBounds(mouseEvent, triggerRef.current)) return;
		floatingTreeRoot.events.emit("close", {
			domEvent: mouseEvent,
			reason: cancelOpen
		});
	});
	import_react.useEffect(() => {
		if (isOpenedByThisTrigger && store.select("lastOpenChangeReason") === "trigger-hover") ownerDocument(triggerRef.current).addEventListener("mouseup", handleDocumentMouseUp, { once: true });
	}, [
		isOpenedByThisTrigger,
		handleDocumentMouseUp,
		store
	]);
	const parentMenubarHasSubmenuOpen = isInMenubar && parent.context.hasSubmenuOpen;
	const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
		enabled: (openOnHoverProp ?? parentMenubarHasSubmenuOpen) && !disabled && (!isInMenubar || parentMenubarHasSubmenuOpen && !isMountedByThisTrigger),
		handleClose: safePolygon({ blockPointerEvents: !isInMenubar }),
		mouseOnly: true,
		move: false,
		restMs: parent.type === void 0 ? delay : void 0,
		delay: { close: closeDelay },
		triggerElementRef,
		externalTree: floatingTreeRoot,
		isActiveTrigger: isTriggerActive,
		isClosing: () => store.select("transitionStatus") === "ending"
	});
	const stickIfOpen = useStickIfOpen(isOpenedByThisTrigger, store.select("lastOpenChangeReason"));
	const click = useClick(floatingRootContext, {
		enabled: !disabled,
		event: isOpenedByThisTrigger && isInMenubar ? "click" : "mousedown",
		toggle: true,
		ignoreMouse: false,
		stickIfOpen: parent.type === void 0 ? stickIfOpen : false
	});
	const focus = useFocus(floatingRootContext, { enabled: !disabled && parentMenubarHasSubmenuOpen });
	const mixedToggleHandlers = useMixedToggleClickHandler({
		open: isOpenedByThisTrigger,
		enabled: isInMenubar,
		mouseDownAction: "open"
	});
	const localInteractionProps = import_react.useMemo(() => mergeProps(focus.reference, click.reference), [focus.reference, click.reference]);
	const rootTriggerProps = store.useState("triggerProps", isMountedByThisTrigger);
	const { preFocusGuardRef, handlePreFocusGuardFocus, handleFocusTargetFocus } = useTriggerFocusGuards(store, triggerElementRef);
	const state = {
		disabled,
		open: isOpenedByThisTrigger
	};
	const ref = [
		triggerRef,
		forwardedRef,
		buttonRef,
		registerTrigger,
		triggerElementRef
	];
	const props = [
		localInteractionProps,
		hoverProps ?? EMPTY_OBJECT,
		rootTriggerProps,
		{
			"aria-haspopup": "menu",
			"aria-controls": popupId,
			id: thisTriggerId,
			onMouseDown: (event) => {
				if (store.select("open")) return;
				allowMouseUpTriggerTimeout.start(200, () => {
					store.context.allowMouseUpTriggerRef.current = true;
				});
				ownerDocument(event.currentTarget).addEventListener("mouseup", handleDocumentMouseUp, { once: true });
			}
		},
		isInMenubar ? { role: "menuitem" } : {},
		mixedToggleHandlers,
		elementProps,
		getButtonProps
	];
	const element = useRenderElement("button", componentProps, {
		enabled: !isInMenubar,
		stateAttributesMapping: pressableTriggerOpenStateMapping,
		state,
		ref,
		props
	});
	if (isInMenubar) return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeItem, {
		tag: "button",
		render,
		className,
		style,
		state,
		refs: ref,
		props,
		stateAttributesMapping: pressableTriggerOpenStateMapping
	});
	if (isOpenedByThisTrigger) return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
		/*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
			ref: preFocusGuardRef,
			onFocus: handlePreFocusGuardFocus
		}, `${thisTriggerId}-pre-focus-guard`),
		/*#__PURE__*/ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: element }, thisTriggerId),
		/*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
			ref: store.context.triggerFocusTargetRef,
			onFocus: handleFocusTargetFocus
		}, `${thisTriggerId}-post-focus-guard`)
	] });
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: element }, thisTriggerId);
});
/**
* Determines whether to ignore clicks after a hover-open.
*/
function useStickIfOpen(open, openReason) {
	const stickIfOpenTimeout = useTimeout();
	const [stickIfOpen, setStickIfOpen] = import_react.useState(false);
	useIsoLayoutEffect(() => {
		if (open && openReason === "trigger-hover") {
			setStickIfOpen(true);
			stickIfOpenTimeout.start(500, () => {
				setStickIfOpen(false);
			});
		} else if (!open) {
			stickIfOpenTimeout.clear();
			setStickIfOpen(false);
		}
	}, [
		open,
		openReason,
		stickIfOpenTimeout
	]);
	return stickIfOpen;
}
function useMenuParent() {
	const menubarContext = useMenubarContext(true);
	return import_react.useMemo(() => {
		if (menubarContext) return {
			type: "menubar",
			context: menubarContext
		};
		return { type: void 0 };
	}, [menubarContext]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/isElementDisabled.mjs
function isElementDisabled(element) {
	return element == null || element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/csp-context/CSPContext.mjs
var CSPContext = /*#__PURE__*/ import_react.createContext(void 0);
var DEFAULT_CSP_CONTEXT_VALUE = { disableStyleElements: false };
function useCSPContext() {
	return import_react.useContext(CSPContext) ?? DEFAULT_CSP_CONTEXT_VALUE;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/root/DialogRoot.mjs
/**
* Groups all parts of the dialog.
* Doesn't render its own HTML element.
*
* Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
*/
var DialogRoot = fastComponent(function DialogRoot(props) {
	return useRenderDialogRoot("dialog", props);
});
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/clamp.mjs
function clamp(val, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
	return Math.max(min, Math.min(val, max));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.4.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/formatNumber.mjs
var cache = /* @__PURE__ */ new Map();
function getFormatter(locale, options) {
	const optionsString = JSON.stringify({
		locale: stringifyLocale(locale),
		options
	});
	const cachedFormatter = cache.get(optionsString);
	if (cachedFormatter) return cachedFormatter;
	const formatter = new Intl.NumberFormat(locale, options);
	cache.set(optionsString, formatter);
	return formatter;
}
function formatNumber(value, locale, options) {
	if (value == null) return "";
	return getFormatter(locale, options).format(value);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/valueToPercent.mjs
function valueToPercent(value, min, max) {
	return (value - min) * 100 / (max - min);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/root/PopoverRootContext.mjs
var PopoverRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function usePopoverRootContext(optional) {
	const context = import_react.useContext(PopoverRootContext);
	if (context === void 0 && !optional) throw new Error(formatErrorMessage(47));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/store/PopoverStore.mjs
var selectors$1 = {
	...popupStoreSelectors,
	disabled: (state) => state.disabled,
	instantType: (state) => state.instantType,
	openMethod: (state) => state.openMethod,
	openChangeReason: (state) => state.openChangeReason,
	modal: (state) => state.modal,
	focusManagerModal: (state) => state.focusManagerModal,
	stickIfOpen: (state) => state.stickIfOpen,
	titleElementId: (state) => state.titleElementId,
	descriptionElementId: (state) => state.descriptionElementId,
	openOnHover: (state) => state.openOnHover,
	closeDelay: (state) => state.closeDelay,
	adaptiveOrigin: (state) => state.adaptiveOrigin
};
/**
* The store view that detached handle-backed triggers read from. Both the real `PopoverStore` and
* the inert fallback store satisfy it, so a trigger can read from whichever store the handle
* currently exposes. Narrowed to the members a trigger actually uses — the trigger-data members plus
* `setOpen` (called by the focus guards) — so the exposed surface can't bypass the open-change
* pipeline; on the detached fallback store every one of these mutations is a no-op.
*/
var PopoverStore = class extends ReactStore {
	constructor(initialState, floatingId, nested) {
		const triggerElements = new PopupTriggerMap();
		super(createInitialState(initialState, triggerElements, floatingId, nested), createInitialContext(triggerElements), selectors$1);
	}
	setOpen = (nextOpen, eventDetails) => {
		const isHover = eventDetails.reason === triggerHover;
		const isKeyboardClick = eventDetails.reason === "trigger-press" && eventDetails.event.detail === 0;
		const isDismissClose = !nextOpen && (eventDetails.reason === "escape-key" || eventDetails.reason == null);
		const shouldPreventUnmountOnClose = attachPreventUnmountOnClose(eventDetails);
		const activeTriggerId = this.select("activeTriggerId");
		if (!nextOpen && eventDetails.reason === "close-press" && eventDetails.trigger == null && activeTriggerId != null) eventDetails.trigger = this.context.triggerElements.getById(activeTriggerId) ?? this.select("activeTriggerElement") ?? void 0;
		this.context.onOpenChange?.(nextOpen, eventDetails);
		if (eventDetails.isCanceled) return;
		this.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);
		const changeState = () => {
			const popupOpenState = createPopupOpenState(this.state, nextOpen, eventDetails.trigger, shouldPreventUnmountOnClose());
			popupOpenState.openChangeReason = eventDetails.reason;
			this.update(popupOpenState);
		};
		if (isHover) {
			this.set("stickIfOpen", true);
			this.context.stickIfOpenTimeout.start(500, () => {
				this.set("stickIfOpen", false);
			});
			import_react_dom.flushSync(changeState);
		} else changeState();
		let instantType;
		if (isKeyboardClick) instantType = "click";
		else if (isDismissClose) instantType = "dismiss";
		else if (eventDetails.reason === "focus-out") instantType = "focus";
		this.set("instantType", instantType);
	};
};
function createInitialState(initialState, triggerElements, floatingId, nested = false) {
	const state = {
		...createInitialPopupStoreState(triggerElements, floatingId, nested),
		disabled: false,
		modal: false,
		focusManagerModal: false,
		instantType: void 0,
		openMethod: null,
		openChangeReason: null,
		titleElementId: void 0,
		descriptionElementId: void 0,
		stickIfOpen: true,
		openOnHover: false,
		closeDelay: 0,
		adaptiveOrigin: void 0,
		...initialState
	};
	if (state.open && initialState?.mounted === void 0) state.mounted = true;
	return state;
}
function createInitialContext(triggerElements) {
	return {
		popupRef: /*#__PURE__*/ import_react.createRef(),
		onOpenChange: void 0,
		onOpenChangeComplete: void 0,
		triggerFocusTargetRef: /*#__PURE__*/ import_react.createRef(),
		beforeContentFocusGuardRef: /*#__PURE__*/ import_react.createRef(),
		stickIfOpenTimeout: new Timeout(),
		triggerElements
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/root/PopoverRoot.mjs
var PopoverRootComponent = fastComponent(function PopoverRootComponent({ props }) {
	const { children, open: openProp, defaultOpen = false, onOpenChange, onOpenChangeComplete, modal = false, handle, triggerId: triggerIdProp, defaultTriggerId: defaultTriggerIdProp = null } = props;
	const store = usePopoverRootStore(handle, {
		modal,
		open: defaultOpen,
		openProp,
		activeTriggerId: defaultTriggerIdProp,
		triggerIdProp
	});
	store.useControlledProp("openProp", openProp);
	store.useControlledProp("triggerIdProp", triggerIdProp);
	const open = store.useState("open");
	const mounted = store.useState("mounted");
	const payload = store.useState("payload");
	store.useContextCallback("onOpenChange", onOpenChange);
	store.useContextCallback("onOpenChangeComplete", onOpenChangeComplete);
	usePopupRootSync(store, open);
	useImplicitActiveTrigger(store);
	const { forceUnmount } = useOpenStateTransitions(open, store, () => {
		store.update({
			stickIfOpen: true,
			openChangeReason: null
		});
	});
	store.useSyncedValues({ modal });
	import_react.useEffect(() => {
		if (!open) store.context.stickIfOpenTimeout.clear();
	}, [store, open]);
	import_react.useImperativeHandle(props.actionsRef, () => ({
		unmount: forceUnmount,
		close: () => store.setOpen(false, createChangeEventDetails(imperativeAction))
	}), [forceUnmount, store]);
	const shouldRenderInteractions = open || mounted;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(PopoverRootContext.Provider, {
		value: store,
		children: [
			handle && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(PopupHandleAttachment, {
				handle,
				store
			}),
			shouldRenderInteractions && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(PopoverInteractions, {
				store,
				modal
			}),
			typeof children === "function" ? children({ payload }) : children
		]
	});
});
function PopoverRoot(props) {
	if (usePopoverRootContext(true)) return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(PopoverRootComponent, { props });
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingTree, { children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(PopoverRootComponent, { props }) });
}
function usePopoverRootStore(handle, initialState) {
	const store = usePopupRootStore((floatingId, nested) => new PopoverStore(initialState, floatingId, nested));
	import_react.useEffect(() => store.context.stickIfOpenTimeout.disposeEffect(), [store]);
	return store;
}
function PopoverInteractions({ store, modal }) {
	const dismiss = useDismiss(store.useState("floatingRootContext"), { outsidePressEvent: {
		mouse: modal === "trap-focus" ? "sloppy" : "intentional",
		touch: "sloppy"
	} });
	const triggerProps = dismiss.reference;
	const popupProps = dismiss.floating;
	usePopupInteractionProps(store, {
		activeTriggerProps: triggerProps,
		inactiveTriggerProps: triggerProps,
		popupProps
	});
	return null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/trigger/PopoverTrigger.mjs
/**
* A button that opens the popover.
* Renders a `<button>` element.
*
* Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
*/
var PopoverTrigger = fastComponentRef(function PopoverTrigger(componentProps, forwardedRef) {
	const { render, className, style, disabled = false, nativeButton = true, handle, payload, openOnHover = false, delay = 300, closeDelay = 0, id: idProp, ...elementProps } = componentProps;
	const rootStore = usePopoverRootContext(true);
	const store = usePopupHandleStore(handle) ?? rootStore;
	if (!store) throw new Error(formatErrorMessage(74));
	const thisTriggerId = useBaseUiId(idProp);
	const isTriggerActive = store.useState("isTriggerActive", thisTriggerId);
	const floatingContext = store.useState("floatingRootContext");
	const isOpenedByThisTrigger = store.useState("isOpenedByTrigger", thisTriggerId);
	const popupId = store.useState("triggerPopupId", thisTriggerId);
	const triggerElementRef = import_react.useRef(null);
	const { registerTrigger, isMountedByThisTrigger } = useTriggerDataForwarding(thisTriggerId, triggerElementRef, store, {
		payload,
		disabled,
		openOnHover,
		closeDelay
	});
	const openReason = store.useState("openChangeReason");
	const stickIfOpen = store.useState("stickIfOpen");
	const openMethod = store.useState("openMethod");
	const focusManagerModal = store.useState("focusManagerModal");
	const hoverProps = useHoverReferenceInteraction(floatingContext, {
		enabled: !disabled && openOnHover && (openMethod !== "touch" || openReason !== "trigger-press"),
		mouseOnly: true,
		move: false,
		handleClose: safePolygon(),
		restMs: delay,
		delay: { close: closeDelay },
		triggerElementRef,
		isActiveTrigger: isTriggerActive,
		isClosing: () => store.select("transitionStatus") === "ending"
	});
	const click = useClick(floatingContext, { stickIfOpen });
	const interactionTypeProps = useOpenMethodTriggerProps(() => store.select("open"), (interactionType) => {
		store.set("openMethod", interactionType);
	});
	const rootTriggerProps = store.useState("triggerProps", isMountedByThisTrigger);
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	const stateAttributesMapping = { open(value) {
		if (value && openReason === "trigger-press") return pressableTriggerOpenStateMapping.open(value);
		return triggerOpenStateMapping.open(value);
	} };
	const { preFocusGuardRef, handlePreFocusGuardFocus, handleFocusTargetFocus } = useTriggerFocusGuards(store, triggerElementRef);
	const element = useRenderElement("button", componentProps, {
		state: {
			disabled,
			open: isOpenedByThisTrigger
		},
		ref: [
			buttonRef,
			forwardedRef,
			registerTrigger,
			triggerElementRef
		],
		props: [
			click.reference,
			hoverProps,
			rootTriggerProps,
			interactionTypeProps,
			{
				[CLICK_TRIGGER_IDENTIFIER]: "",
				id: thisTriggerId,
				"aria-haspopup": "dialog",
				"aria-expanded": isOpenedByThisTrigger,
				"aria-controls": popupId
			},
			elementProps,
			getButtonProps
		],
		stateAttributesMapping
	});
	const keyedElement = /*#__PURE__*/ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: element }, thisTriggerId);
	if (isMountedByThisTrigger && !focusManagerModal) return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
		/*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
			ref: preFocusGuardRef,
			onFocus: handlePreFocusGuardFocus
		}),
		keyedElement,
		/*#__PURE__*/ (0, import_jsx_runtime.jsx)(FocusGuard, {
			ref: store.context.triggerFocusTargetRef,
			onFocus: handleFocusTargetFocus
		})
	] });
	return keyedElement;
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/portal/PopoverPortalContext.mjs
var PopoverPortalContext = /*#__PURE__*/ import_react.createContext(void 0);
function usePopoverPortalContext() {
	const value = import_react.useContext(PopoverPortalContext);
	if (value === void 0) throw new Error(formatErrorMessage(45));
	return value;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/portal/PopoverPortal.mjs
/**
* A portal element that moves the popup to a different part of the DOM.
* By default, the portal element is appended to `<body>`.
* Renders a `<div>` element.
*
* Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
*/
var PopoverPortal = /*#__PURE__*/ import_react.forwardRef(function PopoverPortal(props, forwardedRef) {
	const { keepMounted = false, ...portalProps } = props;
	if (!(usePopoverRootContext().useState("mounted") || keepMounted)) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(PopoverPortalContext.Provider, {
		value: keepMounted,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingPortal, {
			ref: forwardedRef,
			...portalProps
		})
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/positioner/PopoverPositionerContext.mjs
var PopoverPositionerContext = /*#__PURE__*/ import_react.createContext(void 0);
function usePopoverPositionerContext() {
	const context = import_react.useContext(PopoverPositionerContext);
	if (!context) throw new Error(formatErrorMessage(46));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/positioner/PopoverPositioner.mjs
/**
* Positions the popover against the trigger.
* Renders a `<div>` element.
*
* Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
*/
var PopoverPositioner = /*#__PURE__*/ import_react.forwardRef(function PopoverPositioner(componentProps, forwardedRef) {
	const { render, className, style, anchor, positionMethod, side, align, sideOffset, alignOffset, collisionBoundary = "clipping-ancestors", collisionPadding, arrowPadding, sticky, disableAnchorTracking = false, collisionAvoidance = POPUP_COLLISION_AVOIDANCE, ...elementProps } = componentProps;
	const store = usePopoverRootContext();
	const keepMounted = usePopoverPortalContext();
	const nodeId = useFloatingNodeId();
	const floatingRootContext = store.useState("floatingRootContext");
	const mounted = store.useState("mounted");
	const open = store.useState("open");
	const openReason = store.useState("openChangeReason");
	const triggerElement = store.useState("activeTriggerElement");
	const modal = store.useState("modal");
	const openMethod = store.useState("openMethod");
	const positionerElement = store.useState("positionerElement");
	const instantType = store.useState("instantType");
	const transitionStatus = store.useState("transitionStatus");
	const adaptiveOrigin = store.useState("adaptiveOrigin");
	const prevTriggerElementRef = import_react.useRef(null);
	const runOnceAnimationsFinish = useAnimationsFinished(positionerElement);
	const positioning = useAnchorPositioning({
		anchor,
		floatingRootContext,
		positionMethod,
		mounted,
		side,
		sideOffset,
		align,
		alignOffset,
		arrowPadding,
		collisionBoundary,
		collisionPadding,
		sticky,
		disableAnchorTracking,
		keepMounted,
		nodeId,
		collisionAvoidance,
		adaptiveOrigin
	});
	const domReference = floatingRootContext.useState("domReferenceElement");
	useIsoLayoutEffect(() => {
		const currentTriggerElement = domReference;
		const prevTriggerElement = prevTriggerElementRef.current;
		if (currentTriggerElement) prevTriggerElementRef.current = currentTriggerElement;
		if (prevTriggerElement && currentTriggerElement && currentTriggerElement !== prevTriggerElement) {
			store.set("instantType", void 0);
			const ac = new AbortController();
			runOnceAnimationsFinish(() => {
				store.set("instantType", "trigger-change");
			}, ac.signal);
			return () => {
				ac.abort();
			};
		}
	}, [
		domReference,
		runOnceAnimationsFinish,
		store
	]);
	const trueModalNonHover = modal === true && openReason !== "trigger-hover";
	useAnchoredPopupScrollLock(open && trueModalNonHover, openMethod === "touch", positionerElement, triggerElement);
	const setPositionerElement = store.useStateSetter("positionerElement");
	const element = usePositioner(componentProps, {
		open,
		side: positioning.side,
		align: positioning.align,
		anchorHidden: positioning.anchorHidden,
		instant: instantType
	}, {
		styles: positioning.positionerStyles,
		transitionStatus,
		props: elementProps,
		refs: [forwardedRef, setPositionerElement],
		hidden: !mounted,
		inert: !open
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(PopoverPositionerContext.Provider, {
		value: positioning,
		children: [mounted && trueModalNonHover && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(InternalBackdrop, {
			inert: inertValue(!open),
			cutout: triggerElement
		}), /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingNode, {
			id: nodeId,
			children: element
		})]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/closePart.mjs
var ClosePartContext = /*#__PURE__*/ import_react.createContext(void 0);
function useClosePartCount() {
	const [closePartCount, setClosePartCount] = import_react.useState(0);
	const register = useStableCallback(() => {
		setClosePartCount((count) => count + 1);
		return () => {
			setClosePartCount((count) => Math.max(0, count - 1));
		};
	});
	return {
		context: import_react.useMemo(() => ({ register }), [register]),
		hasClosePart: closePartCount > 0
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/popup/PopoverPopup.mjs
/**
* A container for the popover contents.
* Renders a `<div>` element.
*
* Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
*/
var PopoverPopup = /*#__PURE__*/ import_react.forwardRef(function PopoverPopup(componentProps, forwardedRef) {
	const { render, className, style, initialFocus, finalFocus, ...elementProps } = componentProps;
	const store = usePopoverRootContext();
	const positioner = usePopoverPositionerContext();
	const insideToolbar = useToolbarRootContext(true) != null;
	const { context: closePartContext, hasClosePart } = useClosePartCount();
	const open = store.useState("open");
	const openMethod = store.useState("openMethod");
	const instantType = store.useState("instantType");
	const transitionStatus = store.useState("transitionStatus");
	const popupProps = store.useState("popupProps");
	const titleId = store.useState("titleElementId");
	const descriptionId = store.useState("descriptionElementId");
	const modal = store.useState("modal");
	const mounted = store.useState("mounted");
	const openReason = store.useState("openChangeReason");
	const activeTriggerElement = store.useState("activeTriggerElement");
	const floatingContext = store.useState("floatingRootContext");
	const floatingId = floatingContext.useState("floatingId");
	const disabled = store.useState("disabled");
	const openOnHover = store.useState("openOnHover");
	const closeDelay = store.useState("closeDelay");
	useOpenChangeComplete({
		open,
		ref: store.context.popupRef,
		onComplete() {
			if (open) store.context.onOpenChangeComplete?.(true);
		}
	});
	useHoverFloatingInteraction(floatingContext, {
		enabled: openOnHover && !disabled,
		closeDelay
	});
	const resolvedInitialFocus = initialFocus === void 0 ? createDefaultInitialFocus(store.context.popupRef) : initialFocus;
	const focusManagerModal = modal !== false && hasClosePart;
	store.useSyncedValue("focusManagerModal", focusManagerModal);
	const setPopupElement = store.useStateSetter("popupElement");
	const element = useRenderElement("div", componentProps, {
		state: {
			open,
			side: positioner.side,
			align: positioner.align,
			instant: instantType,
			transitionStatus
		},
		ref: [
			forwardedRef,
			store.context.popupRef,
			setPopupElement
		],
		props: [
			popupProps,
			{
				id: floatingId,
				role: "dialog",
				...FOCUSABLE_POPUP_PROPS,
				"aria-labelledby": titleId,
				"aria-describedby": descriptionId,
				onKeyDown(event) {
					if (insideToolbar && COMPOSITE_KEYS.has(event.key)) event.stopPropagation();
				}
			},
			getDisabledMountTransitionStyles(transitionStatus),
			elementProps
		],
		stateAttributesMapping: popupTransitionStateMapping
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingFocusManager, {
		context: floatingContext,
		openInteractionType: openMethod,
		modal: focusManagerModal,
		disabled: !mounted || openReason === "trigger-hover",
		initialFocus: resolvedInitialFocus,
		returnFocus: finalFocus,
		restoreFocus: "popup",
		previousFocusableElement: isHTMLElement(activeTriggerElement) ? activeTriggerElement : void 0,
		nextFocusableElement: store.context.triggerFocusTargetRef,
		beforeContentFocusGuardRef: store.context.beforeContentFocusGuardRef,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ClosePartContext.Provider, {
			value: closePartContext,
			children: element
		})
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/styles.mjs
var DISABLE_SCROLLBAR_CLASS_NAME = "base-ui-disable-scrollbar";
var styleDisableScrollbar = {
	className: DISABLE_SCROLLBAR_CLASS_NAME,
	getElement(nonce) {
		return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("style", {
			nonce,
			href: DISABLE_SCROLLBAR_CLASS_NAME,
			precedence: "base-ui:low",
			children: `.${DISABLE_SCROLLBAR_CLASS_NAME}{scrollbar-width:none}.${DISABLE_SCROLLBAR_CLASS_NAME}::-webkit-scrollbar{display:none}`
		});
	}
};
function getMaxScrollOffset(scrollSize, clientSize) {
	return Math.max(0, scrollSize - clientSize);
}
function normalizeScrollOffset(value, max) {
	if (max <= 0) return 0;
	const clamped = clamp(value, 0, max);
	const startDistance = clamped;
	const endDistance = max - clamped;
	const withinStartTolerance = startDistance <= 1;
	const withinEndTolerance = endDistance <= 1;
	if (withinStartTolerance && withinEndTolerance) return startDistance <= endDistance ? 0 : max;
	if (withinStartTolerance) return 0;
	if (withinEndTolerance) return max;
	return clamped;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/root/SelectRootContext.mjs
/**
* Root values consumed during render. Keep these outside `useSyncedValues` so descendant ref
* callbacks see the current props during the same commit.
*/
var SelectRootContext = /*#__PURE__*/ import_react.createContext(void 0);
var SelectRootPropsContext = /*#__PURE__*/ import_react.createContext(void 0);
var SelectFloatingContext = /*#__PURE__*/ import_react.createContext(void 0);
function useSelectRootContext() {
	const store = import_react.useContext(SelectRootContext);
	if (store === void 0) throw new Error(formatErrorMessage(60));
	return store;
}
function useSelectRootPropsContext() {
	const context = import_react.useContext(SelectRootPropsContext);
	if (context === void 0) throw new Error(formatErrorMessage(101));
	return context;
}
function useSelectFloatingContext() {
	const context = import_react.useContext(SelectFloatingContext);
	if (context === void 0) throw new Error(formatErrorMessage(61));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/store.mjs
/**
* Non-reactive values shared with the select parts. Nothing here is observable through
* `selectors`, so writing to a ref never notifies subscribers.
*/
var selectors = {
	id: (state) => state.id,
	labelId: (state) => state.labelId,
	modal: (state) => state.modal,
	items: (state) => state.items,
	itemToStringLabel: (state) => state.itemToStringLabel,
	isItemEqualToValue: (state) => state.isItemEqualToValue,
	value: (state) => state.value,
	hasSelectedValue: (state) => {
		const { value, multiple, itemToStringValue } = state;
		if (value == null) return false;
		if (multiple && Array.isArray(value)) return value.length > 0;
		return stringifyAsValue(value, itemToStringValue) !== "";
	},
	hasNullItemLabel: (state, enabled) => {
		return enabled ? hasNullItemLabel(state.items) : false;
	},
	open: (state) => state.open,
	mounted: (state) => state.mounted,
	forceMount: (state) => state.forceMount,
	transitionStatus: (state) => state.transitionStatus,
	openMethod: (state) => state.openMethod,
	activeIndex: (state) => state.activeIndex,
	selectedIndex: (state) => state.selectedIndex,
	isActive: (state, index) => state.activeIndex === index,
	isSelected: (state, itemValue) => {
		const comparer = state.isItemEqualToValue;
		const storeValue = state.value;
		if (state.multiple) return Array.isArray(storeValue) && storeValue.some((selectedItem) => compareItemEquality(itemValue, selectedItem, comparer));
		return compareItemEquality(itemValue, storeValue, comparer);
	},
	isSelectedByFocus: (state, index) => {
		return state.selectedIndex === index;
	},
	popupProps: (state) => state.popupProps,
	triggerProps: (state) => state.triggerProps,
	triggerElement: (state) => state.triggerElement,
	positionerElement: (state) => state.positionerElement,
	listElement: (state) => state.listElement,
	popupSide: (state) => state.popupSide,
	scrollUpArrowVisible: (state) => state.scrollUpArrowVisible,
	scrollDownArrowVisible: (state) => state.scrollDownArrowVisible,
	hasScrollArrows: (state) => state.hasScrollArrows
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/root/SelectRoot.mjs
/**
* Groups all parts of the select.
* Doesn't render its own HTML element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
function SelectRoot(props) {
	const { id, value: valueProp, defaultValue = null, onValueChange, open: openProp, defaultOpen = false, onOpenChange, name: nameProp, form, autoComplete, disabled: disabledProp = false, readOnly = false, required = false, modal = true, actionsRef, inputRef, onOpenChangeComplete, items, multiple = false, itemToStringLabel, itemToStringValue, isItemEqualToValue = defaultItemEquality, highlightItemOnHover = true, children } = props;
	const { clearErrors } = useFormContext();
	const { setDirty, setTouched, setFocused, validityData, setFilled, name: fieldName, disabled: fieldDisabled, validation, validationMode } = useFieldRootContext();
	const generatedId = useLabelableId({ id });
	const disabled = fieldDisabled || disabledProp;
	const name = fieldName ?? nameProp;
	const [value, setValueUnwrapped] = useControlled({
		controlled: valueProp,
		default: multiple ? defaultValue ?? EMPTY_ARRAY : defaultValue,
		name: "Select",
		state: "value"
	});
	const [open, setOpenUnwrapped] = useControlled({
		controlled: openProp,
		default: defaultOpen,
		name: "Select",
		state: "open"
	});
	const listRef = import_react.useRef([]);
	const labelsRef = import_react.useRef([]);
	const popupRef = import_react.useRef(null);
	const scrollHandlerRef = import_react.useRef(null);
	const scrollArrowsMountedCountRef = import_react.useRef(0);
	const valueRef = import_react.useRef(null);
	const valuesRef = import_react.useRef([]);
	const typingRef = import_react.useRef(false);
	const firstItemTextRef = import_react.useRef(null);
	const selectedItemTextRef = import_react.useRef(null);
	const selectionRef = import_react.useRef({
		allowSelectedMouseUp: false,
		allowUnselectedMouseUp: false,
		dragY: 0
	});
	const alignItemWithTriggerActiveRef = import_react.useRef(false);
	const initialValueRef = import_react.useRef(value);
	const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
	const { openMethod, triggerProps: interactionTypeProps } = useOpenInteractionType(open);
	const store = useRefWithInit(() => new ReactStore({
		id: generatedId,
		labelId: void 0,
		modal,
		multiple,
		itemToStringLabel,
		itemToStringValue,
		isItemEqualToValue,
		value,
		open,
		mounted,
		transitionStatus,
		items,
		forceMount: false,
		openMethod: null,
		activeIndex: null,
		selectedIndex: null,
		popupProps: EMPTY_OBJECT,
		triggerProps: EMPTY_OBJECT,
		triggerElement: null,
		positionerElement: null,
		listElement: null,
		popupSide: null,
		scrollUpArrowVisible: false,
		scrollDownArrowVisible: false,
		hasScrollArrows: false
	}, {
		setValue: NOOP,
		setOpen: NOOP,
		handleScrollArrowVisibility: NOOP,
		onOpenChangeComplete: NOOP,
		listRef,
		popupRef,
		scrollHandlerRef,
		scrollArrowsMountedCountRef,
		valueRef,
		valuesRef,
		labelsRef,
		typingRef,
		selectionRef,
		firstItemTextRef,
		selectedItemTextRef,
		alignItemWithTriggerActiveRef,
		initialValueRef
	}, selectors)).current;
	const activeIndex = store.useState("activeIndex");
	const selectedIndex = store.useState("selectedIndex");
	const triggerElement = store.useState("triggerElement");
	const positionerElement = store.useState("positionerElement");
	const previousOpenMethod = usePreviousValue(openMethod);
	const renderedOpenMethod = openMethod ?? previousOpenMethod;
	const serializedValue = import_react.useMemo(() => {
		if (multiple) return "";
		return stringifyAsValue(value, itemToStringValue);
	}, [
		multiple,
		value,
		itemToStringValue
	]);
	const fieldStringValue = import_react.useMemo(() => {
		if (multiple && Array.isArray(value)) return value.map((currentValue) => stringifyAsValue(currentValue, itemToStringValue));
		return stringifyAsValue(value, itemToStringValue);
	}, [
		multiple,
		value,
		itemToStringValue
	]);
	useRegisterFieldControl(useValueAsRef(triggerElement), generatedId, value, useStableCallback(() => fieldStringValue), !disabled, nameProp);
	const hasSelectedValue = multiple ? Array.isArray(value) && value.length > 0 : value != null && serializedValue !== "";
	useIsoLayoutEffect(() => {
		setFilled(hasSelectedValue);
	}, [hasSelectedValue, setFilled]);
	useIsoLayoutEffect(function syncSelectedIndex() {
		const nextIndex = findSelectionIndex(valuesRef.current, value, isItemEqualToValue, multiple);
		if (nextIndex === null) selectedItemTextRef.current = null;
		if (open) return;
		store.set("selectedIndex", nextIndex);
	}, [
		multiple,
		open,
		value,
		isItemEqualToValue,
		store
	]);
	useValueChanged(value, () => {
		clearErrors(name);
		setDirty(isSelectedValueDirty(value, validityData.initialValue, isItemEqualToValue));
		validation.change(value);
	});
	const setOpen = useStableCallback((nextOpen, eventDetails) => {
		onOpenChange?.(nextOpen, eventDetails);
		if (eventDetails.isCanceled) return;
		setOpenUnwrapped(nextOpen);
		if (!nextOpen && (eventDetails.reason === "focus-out" || eventDetails.reason === "outside-press")) {
			setTouched(true);
			setFocused(false);
			if (validationMode === "onBlur") validation.commit(value);
		}
	});
	const handleUnmount = useStableCallback(() => {
		setMounted(false);
		store.update({
			activeIndex: null,
			openMethod: null,
			scrollUpArrowVisible: false,
			scrollDownArrowVisible: false
		});
		onOpenChangeComplete?.(false);
	});
	useOpenChangeComplete({
		enabled: !actionsRef,
		open,
		ref: popupRef,
		onComplete() {
			if (!open) handleUnmount();
		}
	});
	import_react.useImperativeHandle(actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);
	const setValue = useStableCallback((nextValue, eventDetails) => {
		onValueChange?.(nextValue, eventDetails);
		if (eventDetails.isCanceled) return;
		setValueUnwrapped(nextValue);
	});
	const handleScrollArrowVisibility = useStableCallback((scroller) => {
		const maxScrollTop = getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
		const scrollTop = normalizeScrollOffset(scroller.scrollTop, maxScrollTop);
		const shouldShowUp = scrollTop > 0;
		const shouldShowDown = scrollTop < maxScrollTop;
		store.set("scrollUpArrowVisible", shouldShowUp);
		store.set("scrollDownArrowVisible", shouldShowDown);
	});
	const floatingContext = useFloatingRootContext({
		open,
		onOpenChange: setOpen,
		elements: {
			reference: triggerElement,
			floating: positionerElement
		}
	});
	const click = useClick(floatingContext, {
		enabled: !disabled,
		event: "mousedown"
	});
	const dismiss = useDismiss(floatingContext);
	const listNavigation = useListNavigation(floatingContext, {
		enabled: !disabled,
		listRef,
		activeIndex,
		selectedIndex,
		disabledIndices: EMPTY_ARRAY,
		onNavigate(nextActiveIndex) {
			if (nextActiveIndex === null && !open) return;
			store.set("activeIndex", nextActiveIndex);
		},
		focusItemOnHover: highlightItemOnHover
	});
	const typeahead = useTypeahead(floatingContext, {
		enabled: !disabled && (open || !readOnly && !multiple),
		listRef: labelsRef,
		activeIndex,
		selectedIndex,
		disabledIndices: (index) => isElementDisabled(listRef.current[index]),
		onMatch(index) {
			if (open) store.set("activeIndex", index);
			else setValue(valuesRef.current[index], createChangeEventDetails(none));
		},
		onTyping(typing) {
			typingRef.current = typing;
		}
	});
	const mergedTriggerProps = import_react.useMemo(() => mergeProps(typeahead.reference, listNavigation.reference, dismiss.reference, click.reference, interactionTypeProps), [
		click.reference,
		typeahead.reference,
		listNavigation.reference,
		dismiss.reference,
		interactionTypeProps
	]);
	const popupProps = import_react.useMemo(() => mergeProps(FOCUSABLE_POPUP_PROPS, typeahead.floating, listNavigation.floating, dismiss.floating), [
		typeahead.floating,
		listNavigation.floating,
		dismiss.floating
	]);
	const itemProps = listNavigation.item ?? EMPTY_OBJECT;
	store.useContextCallback("setValue", setValue);
	store.useContextCallback("setOpen", setOpen);
	store.useContextCallback("handleScrollArrowVisibility", handleScrollArrowVisibility);
	store.useContextCallback("onOpenChangeComplete", onOpenChangeComplete);
	useOnFirstRender(() => {
		store.update({
			popupProps,
			triggerProps: mergedTriggerProps
		});
	});
	store.useSyncedValues({
		id: generatedId,
		modal,
		multiple,
		value,
		open,
		mounted,
		transitionStatus,
		popupProps,
		triggerProps: mergedTriggerProps,
		items,
		itemToStringLabel,
		itemToStringValue,
		isItemEqualToValue,
		openMethod: renderedOpenMethod
	});
	const rootPropsContextValue = import_react.useMemo(() => ({
		disabled,
		readOnly,
		required,
		multiple,
		highlightItemOnHover,
		itemProps
	}), [
		disabled,
		readOnly,
		required,
		multiple,
		highlightItemOnHover,
		itemProps
	]);
	const ref = useMergedRefs(inputRef, validation.inputRef);
	const hiddenInputName = multiple ? void 0 : name;
	const hiddenInputs = import_react.useMemo(() => {
		if (!multiple || !Array.isArray(value) || !name) return null;
		return value.map((v) => {
			const currentSerializedValue = stringifyAsValue(v, itemToStringValue);
			return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
				type: "hidden",
				form,
				name,
				value: currentSerializedValue,
				disabled
			}, currentSerializedValue);
		});
	}, [
		multiple,
		value,
		form,
		name,
		itemToStringValue,
		disabled
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(SelectRootContext.Provider, {
		value: store,
		children: [
			/*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectRootPropsContext.Provider, {
				value: rootPropsContextValue,
				children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectFloatingContext.Provider, {
					value: floatingContext,
					children
				})
			}),
			/*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
				...validation.getValidationProps(disabled, {
					onFocus() {
						store.state.triggerElement?.focus({ focusVisible: true });
					},
					onChange(event) {
						if (event.nativeEvent.defaultPrevented || disabled || readOnly) return;
						const nextValue = event.currentTarget.value;
						const details = createChangeEventDetails(none, event.nativeEvent);
						function handleChange() {
							if (multiple) return;
							const nextValueLower = nextValue.toLowerCase();
							let matchingIndex = valuesRef.current.findIndex((candidate) => stringifyAsValue(candidate, itemToStringValue).toLowerCase() === nextValueLower || stringifyAsLabel(candidate, itemToStringLabel).toLowerCase() === nextValueLower);
							if (matchingIndex === -1) matchingIndex = valuesRef.current.findIndex((_, index) => {
								const renderedLabel = labelsRef.current[index];
								return renderedLabel != null && renderedLabel.toLowerCase() === nextValueLower;
							});
							const matchingValue = valuesRef.current[matchingIndex];
							if (matchingValue != null) setValue(matchingValue, details);
						}
						store.set("forceMount", true);
						queueMicrotask(handleChange);
					}
				}),
				id: generatedId && hiddenInputName == null ? `${generatedId}-hidden-input` : void 0,
				form,
				name: hiddenInputName,
				autoComplete,
				value: serializedValue,
				disabled,
				required: required && !(multiple && hasSelectedValue),
				readOnly,
				ref,
				style: name ? visuallyHiddenInput : visuallyHidden,
				tabIndex: -1,
				"aria-hidden": true,
				suppressHydrationWarning: true
			}),
			hiddenInputs
		]
	});
}
/**
* Indicates which side the corresponding popup is positioned relative to its anchor.
* @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start' | null}
*/
var popupSide = "data-popup-side";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/trigger/SelectTrigger.mjs
var SELECTED_DELAY = 400;
var stateAttributesMapping$3 = {
	...pressableTriggerOpenStateMapping,
	...fieldValidityMapping,
	popupSide: (side) => side ? { [popupSide]: side } : null,
	value: () => null
};
/**
* A button that opens the select popup.
* Renders a `<button>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectTrigger = /*#__PURE__*/ import_react.forwardRef(function SelectTrigger(componentProps, forwardedRef) {
	const { render, className, id: idProp, disabled: disabledProp = false, nativeButton = true, style, ...elementProps } = componentProps;
	const { setTouched, setFocused, validationMode, validation, state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
	const { labelId: fieldLabelId } = useLabelableContext();
	const store = useSelectRootContext();
	const { readOnly, required, disabled: selectDisabled } = useSelectRootPropsContext();
	const disabled = fieldDisabled || selectDisabled || disabledProp;
	const open = store.useState("open");
	const mounted = store.useState("mounted");
	const value = store.useState("value");
	const triggerProps = store.useState("triggerProps");
	const positionerElement = store.useState("positionerElement");
	const listElement = store.useState("listElement");
	const popupSideValue = store.useState("popupSide");
	const rootId = store.useState("id");
	const selectLabelId = store.useState("labelId");
	const hasSelectedValue = store.useState("hasSelectedValue");
	const popupSide = mounted && positionerElement ? popupSideValue : null;
	const id = idProp ?? rootId;
	const ariaLabelledBy = resolveAriaLabelledBy(fieldLabelId, selectLabelId);
	useLabelableId({ id: idProp });
	const positionerRef = useValueAsRef(positionerElement);
	const triggerRef = import_react.useRef(null);
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	const setTriggerElement = store.useStateSetter("triggerElement");
	const timeoutFocus = useTimeout();
	const timeoutMouseDown = useTimeout();
	const selectedDelayTimeout = useTimeout();
	import_react.useEffect(() => {
		if (open) {
			selectedDelayTimeout.start(SELECTED_DELAY, () => {
				store.context.selectionRef.current.allowUnselectedMouseUp = true;
				store.context.selectionRef.current.allowSelectedMouseUp = true;
			});
			return () => {
				selectedDelayTimeout.clear();
			};
		}
		store.context.selectionRef.current = {
			allowSelectedMouseUp: false,
			allowUnselectedMouseUp: false,
			dragY: 0
		};
		timeoutMouseDown.clear();
	}, [
		open,
		store,
		timeoutMouseDown,
		selectedDelayTimeout
	]);
	const mergedProps = mergeProps(triggerProps, {
		id,
		role: "combobox",
		"aria-expanded": open,
		"aria-haspopup": "listbox",
		"aria-controls": open ? listElement?.id ?? getFloatingFocusElement(positionerElement)?.id : void 0,
		"aria-labelledby": ariaLabelledBy,
		"aria-readonly": readOnly || void 0,
		"aria-required": required || void 0,
		tabIndex: disabled ? -1 : 0,
		onFocus(event) {
			setFocused(true);
			if (open && store.context.alignItemWithTriggerActiveRef.current) store.context.setOpen(false, createChangeEventDetails(none, event.nativeEvent));
			timeoutFocus.start(0, () => {
				store.set("forceMount", true);
			});
		},
		onBlur(event) {
			if (contains(positionerElement, event.relatedTarget)) return;
			setTouched(true);
			setFocused(false);
			if (validationMode === "onBlur") validation.commit(value);
		},
		onMouseDown(event) {
			if (open) return;
			const doc = ownerDocument(event.currentTarget);
			function handleMouseUp(mouseEvent) {
				if (!triggerRef.current) return;
				const mouseUpTarget = mouseEvent.target;
				if (contains(triggerRef.current, mouseUpTarget) || contains(positionerRef.current, mouseUpTarget)) return;
				if (isMouseWithinBounds(mouseEvent, triggerRef.current)) return;
				store.context.setOpen(false, createChangeEventDetails(cancelOpen, mouseEvent));
			}
			timeoutMouseDown.start(0, () => {
				doc.addEventListener("mouseup", handleMouseUp, { once: true });
			});
		}
	}, elementProps, getButtonProps);
	const props = validation.getValidationProps(disabled, mergedProps);
	props.role = "combobox";
	const state = {
		...fieldState,
		open,
		disabled,
		value,
		readOnly,
		popupSide,
		placeholder: !hasSelectedValue
	};
	return useRenderElement("button", componentProps, {
		ref: [
			forwardedRef,
			triggerRef,
			buttonRef,
			setTriggerElement
		],
		state,
		stateAttributesMapping: stateAttributesMapping$3,
		props
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/value/SelectValue.mjs
var stateAttributesMapping$2 = { value: () => null };
/**
* A text label of the currently selected item.
* Renders a `<span>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectValue = /*#__PURE__*/ import_react.forwardRef(function SelectValue(componentProps, forwardedRef) {
	const { className, render, children: childrenProp, placeholder, style, ...elementProps } = componentProps;
	const store = useSelectRootContext();
	const value = store.useState("value");
	const items = store.useState("items");
	const itemToStringLabel = store.useState("itemToStringLabel");
	const hasSelectedValue = store.useState("hasSelectedValue");
	const shouldCheckNullItemLabel = !hasSelectedValue && placeholder != null && childrenProp == null;
	const hasNullLabel = store.useState("hasNullItemLabel", shouldCheckNullItemLabel);
	const state = {
		value,
		placeholder: !hasSelectedValue
	};
	let children = null;
	if (typeof childrenProp === "function") children = childrenProp(value);
	else if (childrenProp != null) children = childrenProp;
	else if (shouldCheckNullItemLabel && !hasNullLabel) children = placeholder;
	else if (Array.isArray(value)) children = resolveMultipleLabels(value, items, itemToStringLabel);
	else children = resolveSelectedLabel(value, items, itemToStringLabel);
	return useRenderElement("span", componentProps, {
		state,
		ref: [forwardedRef, store.context.valueRef],
		props: [{ children }, elementProps],
		stateAttributesMapping: stateAttributesMapping$2
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/icon/SelectIcon.mjs
/**
* An icon that indicates that the trigger button opens a select popup.
* Renders a `<span>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectIcon = /*#__PURE__*/ import_react.forwardRef(function SelectIcon(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	return useRenderElement("span", componentProps, {
		state: { open: useSelectRootContext().useState("open") },
		ref: forwardedRef,
		props: [{
			"aria-hidden": true,
			children: "▼"
		}, elementProps],
		stateAttributesMapping: triggerOpenStateMapping
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/portal/SelectPortal.mjs
/**
* A portal element that moves the popup to a different part of the DOM.
* By default, the portal element is appended to `<body>`.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectPortal = /*#__PURE__*/ import_react.forwardRef(function SelectPortal(portalProps, forwardedRef) {
	const store = useSelectRootContext();
	const mounted = store.useState("mounted");
	const forceMount = store.useState("forceMount");
	if (!(mounted || forceMount)) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingPortal, {
		ref: forwardedRef,
		...portalProps
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/positioner/SelectPositionerContext.mjs
var SelectPositionerContext = /*#__PURE__*/ import_react.createContext(void 0);
function useSelectPositionerContext() {
	const context = import_react.useContext(SelectPositionerContext);
	if (!context) throw new Error(formatErrorMessage(59));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/popup/utils.mjs
function clearStyles(element, originalStyles) {
	if (element) Object.assign(element.style, originalStyles);
}
var LIST_FUNCTIONAL_STYLES = {
	position: "relative",
	maxHeight: "100%",
	overflowX: "hidden",
	overflowY: "auto"
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/positioner/SelectPositioner.mjs
var FIXED = { position: "fixed" };
/**
* Positions the select popup.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectPositioner = /*#__PURE__*/ import_react.forwardRef(function SelectPositioner(componentProps, forwardedRef) {
	const { anchor, className, render, positionMethod, side, align, sideOffset, alignOffset, collisionBoundary = "clipping-ancestors", collisionPadding, arrowPadding, sticky, disableAnchorTracking, alignItemWithTrigger = true, collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE, style, ...elementProps } = componentProps;
	const store = useSelectRootContext();
	const floatingRootContext = useSelectFloatingContext();
	const open = store.useState("open");
	const mounted = store.useState("mounted");
	const modal = store.useState("modal");
	const value = store.useState("value");
	const openMethod = store.useState("openMethod");
	const positionerElement = store.useState("positionerElement");
	const triggerElement = store.useState("triggerElement");
	const isItemEqualToValue = store.useState("isItemEqualToValue");
	const transitionStatus = store.useState("transitionStatus");
	const scrollUpArrowRef = import_react.useRef(null);
	const scrollDownArrowRef = import_react.useRef(null);
	const [controlledAlignItemWithTrigger, setControlledAlignItemWithTrigger] = import_react.useState(alignItemWithTrigger);
	const alignItemWithTriggerActive = mounted && controlledAlignItemWithTrigger && openMethod !== "touch";
	if (!mounted && controlledAlignItemWithTrigger !== alignItemWithTrigger) setControlledAlignItemWithTrigger(alignItemWithTrigger);
	import_react.useImperativeHandle(store.context.alignItemWithTriggerActiveRef, () => alignItemWithTriggerActive);
	useAnchoredPopupScrollLock((alignItemWithTriggerActive || modal) && open, openMethod === "touch", positionerElement, triggerElement);
	const positioning = useAnchorPositioning({
		anchor,
		floatingRootContext,
		positionMethod,
		mounted,
		side,
		sideOffset,
		align,
		alignOffset,
		arrowPadding,
		collisionBoundary,
		collisionPadding,
		sticky,
		disableAnchorTracking: disableAnchorTracking ?? alignItemWithTriggerActive,
		collisionAvoidance,
		keepMounted: true
	});
	const renderedSide = alignItemWithTriggerActive ? "none" : positioning.side;
	const positionerStyles = alignItemWithTriggerActive ? FIXED : positioning.positionerStyles;
	const state = {
		open,
		side: renderedSide,
		align: positioning.align,
		anchorHidden: positioning.anchorHidden
	};
	useIsoLayoutEffect(() => {
		store.set("popupSide", positioning.side);
	}, [store, positioning.side]);
	const element = usePositioner(componentProps, state, {
		styles: positionerStyles,
		transitionStatus,
		props: elementProps,
		refs: [forwardedRef, store.useStateSetter("positionerElement")],
		hidden: !mounted,
		inert: !open
	});
	const prevMapSizeRef = import_react.useRef(0);
	const onMapChange = useStableCallback((map) => {
		if (store.context.valuesRef.current.length === 0) return;
		const prevSize = prevMapSizeRef.current;
		prevMapSizeRef.current = map.size;
		const eventDetails = createChangeEventDetails(none);
		if (prevSize !== 0 && !store.state.multiple && value !== null) {
			if (findItemIndex(store.context.valuesRef.current, value, isItemEqualToValue) === -1) {
				const initialSelectedValue = store.context.initialValueRef.current;
				const nextValue = initialSelectedValue != null && findItemIndex(store.context.valuesRef.current, initialSelectedValue, isItemEqualToValue) !== -1 ? initialSelectedValue : null;
				store.context.setValue(nextValue, eventDetails);
				if (nextValue === null) {
					store.set("selectedIndex", null);
					store.context.selectedItemTextRef.current = null;
				}
			}
		}
		if (prevSize !== 0 && store.state.multiple && Array.isArray(value)) {
			const nextValue = value.filter((selectedItemValue) => findItemIndex(store.context.valuesRef.current, selectedItemValue, isItemEqualToValue) !== -1);
			if (nextValue.length !== value.length) {
				store.context.setValue(nextValue, eventDetails);
				if (nextValue.length === 0) {
					store.set("selectedIndex", null);
					store.context.selectedItemTextRef.current = null;
				}
			}
		}
		if (open && alignItemWithTriggerActive) {
			store.update({
				scrollUpArrowVisible: false,
				scrollDownArrowVisible: false
			});
			const stylesToClear = { height: "" };
			clearStyles(positionerElement, stylesToClear);
			clearStyles(store.context.popupRef.current, stylesToClear);
		}
	});
	const contextValue = import_react.useMemo(() => ({
		...positioning,
		side: renderedSide,
		alignItemWithTriggerActive,
		setControlledAlignItemWithTrigger,
		scrollUpArrowRef,
		scrollDownArrowRef
	}), [
		positioning,
		renderedSide,
		alignItemWithTriggerActive,
		setControlledAlignItemWithTrigger
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeList, {
		elementsRef: store.context.listRef,
		labelsRef: store.context.labelsRef,
		onMapChange,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(SelectPositionerContext.Provider, {
			value: contextValue,
			children: [mounted && modal && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(InternalBackdrop, {
				inert: inertValue(!open),
				cutout: triggerElement
			}), element]
		})
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/positioner/SelectPositionerCssVars.mjs
/**
* The coordinates that this element is anchored to. Used for animations and transitions.
* @type {string}
*/
var transformOrigin = "--transform-origin";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/popup/SelectPopup.mjs
var stateAttributesMapping$1 = {
	...popupStateMapping,
	...transitionStatusMapping
};
/**
* A container for the select list.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectPopup = /*#__PURE__*/ import_react.forwardRef(function SelectPopup(componentProps, forwardedRef) {
	const { render, className, style, finalFocus, ...elementProps } = componentProps;
	const store = useSelectRootContext();
	const { multiple, readOnly, highlightItemOnHover } = useSelectRootPropsContext();
	const floatingRootContext = useSelectFloatingContext();
	const { side, align, alignItemWithTriggerActive, isPositioned, setControlledAlignItemWithTrigger } = useSelectPositionerContext();
	const insideToolbar = useToolbarRootContext(true) != null;
	const direction = useDirection();
	const { nonce, disableStyleElements } = useCSPContext();
	const id = store.useState("id");
	const open = store.useState("open");
	const openMethod = store.useState("openMethod");
	const mounted = store.useState("mounted");
	const popupProps = store.useState("popupProps");
	const transitionStatus = store.useState("transitionStatus");
	const triggerElement = store.useState("triggerElement");
	const positionerElement = store.useState("positionerElement");
	const listElement = store.useState("listElement");
	const reachedMaxHeightRef = import_react.useRef(false);
	const initialPlacedRef = import_react.useRef(false);
	const originalPositionerStylesRef = import_react.useRef({});
	const scrollArrowFrame = useAnimationFrame();
	const handleScroll = useStableCallback((scroller) => {
		if (!positionerElement || !store.context.popupRef.current || !initialPlacedRef.current) return;
		const isTopPositioned = positionerElement.style.top === "0px";
		const isBottomPositioned = positionerElement.style.bottom === "0px";
		if (reachedMaxHeightRef.current || !alignItemWithTriggerActive || !isTopPositioned && !isBottomPositioned) {
			store.context.handleScrollArrowVisibility(scroller);
			return;
		}
		const scale = getScale(positionerElement);
		const currentHeight = normalizeSize(positionerElement.getBoundingClientRect().height, "y", scale);
		const doc = ownerDocument(positionerElement);
		const win = getWindow(positionerElement);
		const positionerStyles = win.getComputedStyle(positionerElement);
		const marginTop = parseFloat(positionerStyles.marginTop);
		const marginBottom = parseFloat(positionerStyles.marginBottom);
		const maxPopupHeight = getMaxPopupHeight(win.getComputedStyle(store.context.popupRef.current));
		const maxAvailableHeight = Math.min(doc.documentElement.clientHeight - marginTop - marginBottom, maxPopupHeight);
		const scrollTop = scroller.scrollTop;
		const maxScrollTop = getMaxScrollTop(scroller);
		let nextScrollTop = null;
		const setHeight = (height) => {
			positionerElement.style.height = `${height}px`;
		};
		const diff = isTopPositioned ? maxScrollTop - scrollTop : scrollTop;
		const nextHeight = Math.min(currentHeight + diff, maxAvailableHeight);
		if (diff <= 1) {
			const heightDelta = clamp(diff, 0, maxAvailableHeight - currentHeight);
			if (heightDelta > 0) setHeight(currentHeight + heightDelta);
			scroller.scrollTop = isTopPositioned ? maxScrollTop : 0;
			if (maxAvailableHeight - (currentHeight + heightDelta) <= 1) reachedMaxHeightRef.current = true;
			store.context.handleScrollArrowVisibility(scroller);
			return;
		}
		if (maxAvailableHeight - nextHeight > 1) nextScrollTop = isTopPositioned ? Infinity : 0;
		else if (isBottomPositioned && scrollTop < maxScrollTop) nextScrollTop = scrollTop - (diff - (currentHeight + diff - maxAvailableHeight));
		const nextPositionerHeight = Math.ceil(nextHeight);
		if (nextPositionerHeight !== 0) setHeight(nextPositionerHeight);
		if (nextScrollTop != null) {
			const target = clamp(nextScrollTop, 0, getMaxScrollTop(scroller));
			if (Math.abs(scroller.scrollTop - target) > 1) scroller.scrollTop = target;
		}
		if (nextPositionerHeight >= maxAvailableHeight - 1) reachedMaxHeightRef.current = true;
		store.context.handleScrollArrowVisibility(scroller);
	});
	import_react.useImperativeHandle(store.context.scrollHandlerRef, () => handleScroll, [handleScroll]);
	useOpenChangeComplete({
		open,
		ref: store.context.popupRef,
		onComplete() {
			if (open) store.context.onOpenChangeComplete(true);
		}
	});
	const state = {
		open,
		transitionStatus,
		side,
		align
	};
	useIsoLayoutEffect(() => {
		if (!positionerElement || !store.context.popupRef.current || Object.keys(originalPositionerStylesRef.current).length) return;
		originalPositionerStylesRef.current = {
			top: positionerElement.style.top || "0",
			left: positionerElement.style.left || "0",
			right: positionerElement.style.right,
			height: positionerElement.style.height,
			bottom: positionerElement.style.bottom,
			minHeight: positionerElement.style.minHeight,
			maxHeight: positionerElement.style.maxHeight,
			marginTop: positionerElement.style.marginTop,
			marginBottom: positionerElement.style.marginBottom
		};
	}, [store, positionerElement]);
	useIsoLayoutEffect(() => {
		if (open || alignItemWithTriggerActive) return;
		initialPlacedRef.current = false;
		reachedMaxHeightRef.current = false;
		clearStyles(positionerElement, originalPositionerStylesRef.current);
	}, [
		open,
		alignItemWithTriggerActive,
		positionerElement
	]);
	useIsoLayoutEffect(() => {
		const popupElement = store.context.popupRef.current;
		if (!open || !triggerElement || !positionerElement || !popupElement || alignItemWithTriggerActive && !isPositioned || store.state.transitionStatus === "ending") return;
		initialPlacedRef.current = true;
		popupElement.style.removeProperty(transformOrigin);
		if (!alignItemWithTriggerActive) {
			scrollArrowFrame.request(() => store.context.handleScrollArrowVisibility(listElement || popupElement));
			return;
		}
		const restoreTransformStyles = unsetTransformStyles(popupElement);
		try {
			let textElement = store.context.selectedItemTextRef.current;
			if (!textElement?.isConnected) textElement = !store.select("hasSelectedValue") && store.context.firstItemTextRef.current?.isConnected ? store.context.firstItemTextRef.current : null;
			const valueElement = store.context.valueRef.current;
			const win = getWindow(positionerElement);
			const positionerStyles = win.getComputedStyle(positionerElement);
			const popupStyles = win.getComputedStyle(popupElement);
			const doc = ownerDocument(triggerElement);
			const scale = getScale(triggerElement);
			const triggerRect = normalizeRect(triggerElement.getBoundingClientRect(), scale);
			const positionerRect = normalizeRect(positionerElement.getBoundingClientRect(), scale);
			const triggerHeight = triggerRect.height;
			const scroller = listElement || popupElement;
			const scrollHeight = scroller.scrollHeight;
			const borderBottom = parseFloat(popupStyles.borderBottomWidth);
			const marginTop = parseFloat(positionerStyles.marginTop) || 10;
			const marginBottom = parseFloat(positionerStyles.marginBottom) || 10;
			const minHeight = parseFloat(positionerStyles.minHeight) || 100;
			const maxPopupHeight = getMaxPopupHeight(popupStyles);
			const paddingLeft = 5;
			const paddingRight = 5;
			const triggerCollisionThreshold = 20;
			const viewportHeight = doc.documentElement.clientHeight - marginTop - marginBottom;
			const viewportWidth = doc.documentElement.clientWidth;
			const availableSpaceBeneathTrigger = viewportHeight - triggerRect.bottom + triggerHeight;
			let textRect;
			let alignedLeft = direction === "rtl" ? triggerRect.right - positionerRect.width : triggerRect.left;
			let offsetY = 0;
			if (textElement && valueElement) {
				const valueRect = normalizeRect(valueElement.getBoundingClientRect(), scale);
				textRect = normalizeRect(textElement.getBoundingClientRect(), scale);
				alignedLeft = positionerRect.left + (direction === "rtl" ? valueRect.right - textRect.right : valueRect.left - textRect.left);
				const valueCenterFromTriggerTop = valueRect.top - triggerRect.top + valueRect.height / 2;
				offsetY = textRect.top - positionerRect.top + textRect.height / 2 - valueCenterFromTriggerTop;
			}
			const idealHeight = availableSpaceBeneathTrigger + offsetY + marginBottom + borderBottom;
			let height = Math.min(viewportHeight, idealHeight);
			const maxHeight = viewportHeight - marginTop - marginBottom;
			const scrollTop = idealHeight - height;
			const maxRight = viewportWidth - paddingRight;
			positionerElement.style.left = `${clamp(alignedLeft, paddingLeft, maxRight - positionerRect.width)}px`;
			positionerElement.style.height = `${height}px`;
			positionerElement.style.maxHeight = "none";
			positionerElement.style.marginTop = `${marginTop}px`;
			positionerElement.style.marginBottom = `${marginBottom}px`;
			popupElement.style.height = "100%";
			const maxScrollTop = getMaxScrollTop(scroller);
			const isTopPositioned = scrollTop >= maxScrollTop - 1;
			if (isTopPositioned) height = Math.min(viewportHeight, positionerRect.height) - (scrollTop - maxScrollTop);
			const fallbackToAlignPopupToTrigger = triggerRect.top < triggerCollisionThreshold || triggerRect.bottom > viewportHeight - triggerCollisionThreshold || Math.ceil(height) + 1 < Math.min(scrollHeight, minHeight);
			const isPinchZoomed = (win.visualViewport?.scale ?? 1) !== 1 && webkit;
			if (fallbackToAlignPopupToTrigger || isPinchZoomed) {
				clearStyles(positionerElement, originalPositionerStylesRef.current);
				setControlledAlignItemWithTrigger(false);
				return;
			}
			const initialHeight = Math.max(minHeight, height);
			if (isTopPositioned) {
				const topOffset = Math.max(0, viewportHeight - idealHeight);
				positionerElement.style.top = positionerRect.height >= maxHeight ? "0" : `${topOffset}px`;
				positionerElement.style.height = `${height}px`;
				scroller.scrollTop = getMaxScrollTop(scroller);
			} else {
				positionerElement.style.bottom = "0";
				scroller.scrollTop = scrollTop;
			}
			if (textRect) {
				const popupTop = positionerRect.top;
				const popupHeight = positionerRect.height;
				const textCenterY = textRect.top + textRect.height / 2;
				const clampedY = clamp(popupHeight > 0 ? (textCenterY - popupTop) / popupHeight * 100 : 50, 0, 100);
				popupElement.style.setProperty(transformOrigin, `50% ${clampedY}%`);
			}
			if (initialHeight === viewportHeight || height >= maxPopupHeight) reachedMaxHeightRef.current = true;
			store.context.handleScrollArrowVisibility(scroller);
			if (highlightItemOnHover && store.state.selectedIndex === null && store.state.activeIndex === null && store.context.listRef.current[0] != null) store.set("activeIndex", 0);
		} finally {
			restoreTransformStyles();
		}
	}, [
		store,
		open,
		positionerElement,
		triggerElement,
		alignItemWithTriggerActive,
		setControlledAlignItemWithTrigger,
		scrollArrowFrame,
		listElement,
		highlightItemOnHover,
		direction,
		isPositioned
	]);
	import_react.useEffect(() => {
		if (!alignItemWithTriggerActive || !positionerElement || !open) return;
		const win = getWindow(positionerElement);
		function handleResize(event) {
			store.context.setOpen(false, createChangeEventDetails(windowResize, event));
		}
		return addEventListener(win, "resize", handleResize);
	}, [
		store,
		alignItemWithTriggerActive,
		positionerElement,
		open
	]);
	const defaultProps = {
		...listElement ? { role: "presentation" } : {
			role: "listbox",
			"aria-multiselectable": multiple || void 0,
			"aria-readonly": readOnly || void 0,
			id: `${id}-list`
		},
		onKeyDown(event) {
			if (insideToolbar && COMPOSITE_KEYS.has(event.key)) event.stopPropagation();
		},
		onScroll(event) {
			if (listElement) return;
			handleScroll(event.currentTarget);
		},
		...alignItemWithTriggerActive && { style: listElement ? { height: "100%" } : LIST_FUNCTIONAL_STYLES },
		className: !listElement && alignItemWithTriggerActive ? styleDisableScrollbar.className : void 0
	};
	const element = useRenderElement("div", componentProps, {
		ref: [forwardedRef, store.context.popupRef],
		state,
		stateAttributesMapping: stateAttributesMapping$1,
		props: [
			popupProps,
			defaultProps,
			getDisabledMountTransitionStyles(transitionStatus),
			elementProps
		]
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [!disableStyleElements && styleDisableScrollbar.getElement(nonce), /*#__PURE__*/ (0, import_jsx_runtime.jsx)(FloatingFocusManager, {
		context: floatingRootContext,
		modal: false,
		disabled: !mounted,
		openInteractionType: openMethod,
		returnFocus: finalFocus,
		restoreFocus: true,
		children: element
	})] });
});
function getMaxPopupHeight(popupStyles) {
	const maxHeightStyle = popupStyles.maxHeight;
	return maxHeightStyle.endsWith("px") ? parseFloat(maxHeightStyle) || Infinity : Infinity;
}
function getMaxScrollTop(scroller) {
	return getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
}
function getScale(element) {
	return platform.getScale(element);
}
function normalizeSize(size, axis, scale) {
	return size / scale[axis];
}
function normalizeRect(rect, scale) {
	return rectToClientRect({
		x: normalizeSize(rect.x, "x", scale),
		y: normalizeSize(rect.y, "y", scale),
		width: normalizeSize(rect.width, "x", scale),
		height: normalizeSize(rect.height, "y", scale)
	});
}
var TRANSFORM_STYLE_RESETS = [
	["transform", "none"],
	["scale", "1"],
	["translate", "0 0"]
];
function unsetTransformStyles(popupElement) {
	const { style } = popupElement;
	const originalStyles = {};
	for (const [property, value] of TRANSFORM_STYLE_RESETS) {
		originalStyles[property] = style.getPropertyValue(property);
		style.setProperty(property, value, "important");
	}
	return () => {
		for (const [property] of TRANSFORM_STYLE_RESETS) {
			const originalValue = originalStyles[property];
			if (originalValue) style.setProperty(property, originalValue);
			else style.removeProperty(property);
		}
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/list/SelectList.mjs
/**
* A container for the select items.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectList = /*#__PURE__*/ import_react.forwardRef(function SelectList(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const store = useSelectRootContext();
	const { multiple, readOnly } = useSelectRootPropsContext();
	const { alignItemWithTriggerActive } = useSelectPositionerContext();
	const hasScrollArrows = store.useState("hasScrollArrows");
	const openMethod = store.useState("openMethod");
	const defaultProps = {
		id: `${store.useState("id")}-list`,
		role: "listbox",
		"aria-multiselectable": multiple || void 0,
		"aria-readonly": readOnly || void 0,
		onScroll(event) {
			store.context.scrollHandlerRef.current?.(event.currentTarget);
		},
		...alignItemWithTriggerActive && { style: LIST_FUNCTIONAL_STYLES },
		className: hasScrollArrows && openMethod !== "touch" ? styleDisableScrollbar.className : void 0
	};
	return useRenderElement("div", componentProps, {
		ref: [forwardedRef, store.useStateSetter("listElement")],
		props: [defaultProps, elementProps]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/item/SelectItemContext.mjs
var SelectItemContext = /*#__PURE__*/ import_react.createContext(void 0);
function useSelectItemContext() {
	const context = import_react.useContext(SelectItemContext);
	if (!context) throw new Error(formatErrorMessage(57));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/item/SelectItem.mjs
/**
* An individual option in the select popup.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectItem = /*#__PURE__*/ import_react.memo(/*#__PURE__*/ import_react.forwardRef(function SelectItem(componentProps, forwardedRef) {
	const { render, className, style, value: itemValue = null, label, disabled: disabledProp = false, nativeButton = false, ...elementProps } = componentProps;
	const textRef = import_react.useRef(null);
	const listItem = useCompositeListItem({
		guess: true,
		label,
		textRef
	});
	const store = useSelectRootContext();
	const { itemProps, multiple, disabled: selectDisabled, readOnly } = useSelectRootPropsContext();
	const disabled = selectDisabled || disabledProp;
	const highlighted = store.useState("isActive", listItem.index);
	const open = store.useState("open");
	const selected = store.useState("isSelected", itemValue);
	const selectedByFocus = store.useState("isSelectedByFocus", listItem.index);
	const isItemEqualToValue = store.useState("isItemEqualToValue");
	const index = listItem.index;
	const itemRef = import_react.useRef(null);
	useIsoLayoutEffect(() => {
		const values = store.context.valuesRef.current;
		values[index] = itemValue;
		return () => {
			delete values[index];
		};
	}, [
		index,
		itemValue,
		store
	]);
	useIsoLayoutEffect(() => {
		const selectedValue = store.state.value;
		const currentIndex = store.state.selectedIndex;
		let nextIndex = currentIndex;
		let claims;
		if (multiple && Array.isArray(selectedValue)) {
			nextIndex = resolveSelectedIndex(index, itemValue, store.context.valuesRef.current, selectedValue, isItemEqualToValue, currentIndex);
			claims = nextIndex === index;
			if (index === currentIndex && !claims) store.context.selectedItemTextRef.current = null;
		} else {
			claims = selectedValue !== void 0 && compareItemEquality(itemValue, selectedValue, isItemEqualToValue);
			if (claims) nextIndex = index;
		}
		store.set("selectedIndex", nextIndex);
		if (claims && textRef.current) store.context.selectedItemTextRef.current = textRef.current;
	}, [
		index,
		multiple,
		isItemEqualToValue,
		store,
		itemValue
	]);
	const pointerTypeRef = import_react.useRef("mouse");
	const allowMouseSelectionRef = import_react.useRef(false);
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		focusableWhenDisabled: true,
		native: nativeButton,
		composite: true
	});
	const state = {
		disabled,
		selected,
		highlighted
	};
	function commitSelection(event) {
		if (selectDisabled || readOnly) return;
		const selectedValue = store.state.value;
		if (multiple) {
			const currentValue = Array.isArray(selectedValue) ? selectedValue : [];
			const nextValue = selected ? removeItem(currentValue, itemValue, isItemEqualToValue) : [...currentValue, itemValue];
			store.context.setValue(nextValue, createChangeEventDetails(itemPress, event));
		} else {
			store.context.setValue(itemValue, createChangeEventDetails(itemPress, event));
			store.context.setOpen(false, createChangeEventDetails(itemPress, event));
		}
	}
	function resetDragMovement() {
		store.context.selectionRef.current.dragY = 0;
	}
	const defaultProps = {
		role: "option",
		"aria-selected": selected,
		tabIndex: open && highlighted ? 0 : -1,
		onKeyDown(event) {
			store.set("activeIndex", index);
			if (event.key === " " && store.context.typingRef.current) event.preventDefault();
		},
		onClick(event) {
			const isMouseClick = pointerTypeRef.current !== "touch";
			const clickPointerType = event.nativeEvent.pointerType;
			const isVirtualMouseClick = isMouseClick && isVirtualClick(event.nativeEvent) && (clickPointerType !== void 0 || highlighted);
			const isInvalidMouseClick = isMouseClick && !isVirtualMouseClick && !allowMouseSelectionRef.current;
			allowMouseSelectionRef.current = false;
			if (disabled || isInvalidMouseClick) return;
			commitSelection(event.nativeEvent);
		},
		onPointerEnter(event) {
			pointerTypeRef.current = event.pointerType;
		},
		onPointerMove(event) {
			if (event.pointerType === "mouse" && event.buttons === 1) {
				const selection = store.context.selectionRef.current;
				selection.dragY += event.movementY;
				if (selection.dragY ** 2 >= 64) selection.allowUnselectedMouseUp = true;
			}
		},
		onPointerDown(event) {
			pointerTypeRef.current = event.pointerType;
			allowMouseSelectionRef.current = true;
			resetDragMovement();
		},
		onMouseUp() {
			resetDragMovement();
			if (disabled || pointerTypeRef.current === "touch") return;
			if (allowMouseSelectionRef.current) return;
			const disallowSelectedMouseUp = !store.context.selectionRef.current.allowSelectedMouseUp && selected;
			const disallowUnselectedMouseUp = !store.context.selectionRef.current.allowUnselectedMouseUp && !selected;
			if (disallowSelectedMouseUp || disallowUnselectedMouseUp) return;
			allowMouseSelectionRef.current = true;
			itemRef.current?.click();
			allowMouseSelectionRef.current = false;
		}
	};
	const element = useRenderElement("div", componentProps, {
		ref: [
			buttonRef,
			forwardedRef,
			listItem.ref,
			itemRef
		],
		state,
		props: [
			itemProps,
			defaultProps,
			elementProps,
			getButtonProps
		]
	});
	const contextValue = import_react.useMemo(() => ({
		selected,
		index,
		textRef,
		selectedByFocus
	}), [
		selected,
		index,
		textRef,
		selectedByFocus
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectItemContext.Provider, {
		value: contextValue,
		children: element
	});
}));
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/item-indicator/SelectItemIndicator.mjs
/**
* Indicates whether the select item is selected.
* Renders a `<span>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectItemIndicator = /*#__PURE__*/ import_react.forwardRef(function SelectItemIndicator(componentProps, forwardedRef) {
	const { selected } = useSelectItemContext();
	if (!(componentProps.keepMounted || selected)) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(Inner, {
		...componentProps,
		ref: forwardedRef
	});
});
var Inner = /*#__PURE__*/ import_react.memo(/*#__PURE__*/ import_react.forwardRef((componentProps, forwardedRef) => {
	const { render, className, style, keepMounted, ...elementProps } = componentProps;
	const { selected } = useSelectItemContext();
	const indicatorRef = import_react.useRef(null);
	const { transitionStatus, setMounted } = useTransitionStatus(selected);
	const element = useRenderElement("span", componentProps, {
		ref: [forwardedRef, indicatorRef],
		state: {
			selected,
			transitionStatus
		},
		props: [{
			"aria-hidden": true,
			children: "✔️"
		}, elementProps],
		stateAttributesMapping: transitionStatusMapping
	});
	useOpenChangeComplete({
		batch: true,
		enabled: !selected,
		open: selected,
		ref: indicatorRef,
		onComplete() {
			if (!selected) setMounted(false);
		}
	});
	return element;
}));
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/item-text/SelectItemText.mjs
/**
* A text label of the select item.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectItemText = /*#__PURE__*/ import_react.memo(/*#__PURE__*/ import_react.forwardRef(function SelectItemText(componentProps, forwardedRef) {
	const { index, textRef, selectedByFocus } = useSelectItemContext();
	const store = useSelectRootContext();
	const { render, className, style, ...elementProps } = componentProps;
	return useRenderElement("div", componentProps, {
		ref: [
			import_react.useCallback((node) => {
				if (!node) return;
				if (index === 0) store.context.firstItemTextRef.current = node;
				if (selectedByFocus) store.context.selectedItemTextRef.current = node;
			}, [
				store,
				index,
				selectedByFocus
			]),
			forwardedRef,
			textRef
		],
		props: elementProps
	});
}));
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/scroll-arrow/SelectScrollArrow.mjs
/**
* @internal
*/
var SelectScrollArrow = /*#__PURE__*/ import_react.forwardRef(function SelectScrollArrow(componentProps, forwardedRef) {
	const { render, className, style, direction, keepMounted, ...elementProps } = componentProps;
	const isUp = direction === "up";
	const store = useSelectRootContext();
	const { side, scrollDownArrowRef, scrollUpArrowRef } = useSelectPositionerContext();
	const visibleSelector = isUp ? "scrollUpArrowVisible" : "scrollDownArrowVisible";
	const stateVisible = store.useState(visibleSelector);
	const openMethod = store.useState("openMethod");
	const visible = stateVisible && openMethod !== "touch";
	const timeout = useTimeout();
	const scrollArrowRef = isUp ? scrollUpArrowRef : scrollDownArrowRef;
	const { mounted, transitionStatus, setMounted } = useTransitionStatus(visible);
	useIsoLayoutEffect(() => {
		store.context.scrollArrowsMountedCountRef.current += 1;
		store.set("hasScrollArrows", true);
		return () => {
			store.context.scrollArrowsMountedCountRef.current = Math.max(0, store.context.scrollArrowsMountedCountRef.current - 1);
			if (store.context.scrollArrowsMountedCountRef.current === 0) store.set("hasScrollArrows", false);
		};
	}, [store]);
	useOpenChangeComplete({
		open: visible,
		ref: scrollArrowRef,
		onComplete() {
			if (!visible) setMounted(false);
		}
	});
	const element = useRenderElement("div", componentProps, {
		ref: [forwardedRef, scrollArrowRef],
		state: {
			direction,
			visible,
			side,
			transitionStatus
		},
		props: [{
			"aria-hidden": true,
			children: isUp ? "▲" : "▼",
			style: { position: "absolute" },
			onMouseMove(event) {
				if (event.movementX === 0 && event.movementY === 0 || timeout.isStarted()) return;
				store.set("activeIndex", null);
				function scrollNextItem() {
					const scroller = store.state.listElement ?? store.context.popupRef.current;
					if (!scroller) return;
					store.set("activeIndex", null);
					store.context.handleScrollArrowVisibility(scroller);
					const maxScrollTop = getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
					const scrollTop = normalizeScrollOffset(scroller.scrollTop, maxScrollTop);
					const isScrolledToEdge = scrollTop === (isUp ? 0 : maxScrollTop);
					const items = store.context.listRef.current;
					if (scrollTop !== scroller.scrollTop) scroller.scrollTop = scrollTop;
					if (isScrolledToEdge) {
						timeout.clear();
						return;
					}
					if (items.length > 0) {
						const scrollArrowHeight = scrollArrowRef.current?.offsetHeight || 0;
						scroller.scrollTop = getTargetScrollTop(items, isUp, scrollTop, scroller.clientHeight, scrollArrowHeight, maxScrollTop);
					}
					timeout.start(40, scrollNextItem);
				}
				timeout.start(40, scrollNextItem);
			},
			onMouseLeave() {
				timeout.clear();
			}
		}, elementProps],
		stateAttributesMapping: transitionStatusMapping
	});
	if (!(mounted || keepMounted)) return null;
	return element;
});
function getTargetScrollTop(items, isUp, scrollTop, clientHeight, scrollArrowHeight, maxScrollTop) {
	if (isUp) {
		let firstVisibleIndex = 0;
		const visibleTop = scrollTop + scrollArrowHeight - 1;
		for (let i = 0; i < items.length; i += 1) {
			const item = items[i];
			if (item && item.offsetTop >= visibleTop) {
				firstVisibleIndex = i;
				break;
			}
		}
		const targetIndex = Math.max(0, firstVisibleIndex - 1);
		const targetItem = items[targetIndex];
		return targetIndex < firstVisibleIndex && targetItem ? normalizeScrollOffset(targetItem.offsetTop - scrollArrowHeight, maxScrollTop) : 0;
	}
	let lastVisibleIndex = items.length - 1;
	const visibleBottom = scrollTop + clientHeight - scrollArrowHeight + 1;
	for (let i = 0; i < items.length; i += 1) {
		const item = items[i];
		if (item && item.offsetTop + item.offsetHeight > visibleBottom) {
			lastVisibleIndex = Math.max(0, i - 1);
			break;
		}
	}
	const targetIndex = Math.min(items.length - 1, lastVisibleIndex + 1);
	const targetItem = items[targetIndex];
	return targetIndex > lastVisibleIndex && targetItem ? normalizeScrollOffset(targetItem.offsetTop + targetItem.offsetHeight - clientHeight + scrollArrowHeight, maxScrollTop) : maxScrollTop;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/scroll-down-arrow/SelectScrollDownArrow.mjs
/**
* An element that scrolls the select popup down when hovered. Does not render when using touch input.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectScrollDownArrow = /*#__PURE__*/ import_react.forwardRef(function SelectScrollDownArrow(props, forwardedRef) {
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectScrollArrow, {
		...props,
		ref: forwardedRef,
		direction: "down"
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/scroll-up-arrow/SelectScrollUpArrow.mjs
/**
* An element that scrolls the select popup up when hovered. Does not render when using touch input.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectScrollUpArrow = /*#__PURE__*/ import_react.forwardRef(function SelectScrollUpArrow(props, forwardedRef) {
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectScrollArrow, {
		...props,
		ref: forwardedRef,
		direction: "up"
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/group/SelectGroupContext.mjs
var SelectGroupContext = /*#__PURE__*/ import_react.createContext(void 0);
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/group/SelectGroup.mjs
/**
* Groups related select items with the corresponding label.
* Renders a `<div>` element.
*
* Documentation: [Base UI Select](https://base-ui.com/react/components/select)
*/
var SelectGroup = /*#__PURE__*/ import_react.forwardRef(function SelectGroup(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const [labelId, setLabelId] = import_react.useState();
	const contextValue = import_react.useMemo(() => ({
		labelId,
		setLabelId
	}), [labelId, setLabelId]);
	const element = useRenderElement("div", componentProps, {
		ref: forwardedRef,
		props: [{
			role: "group",
			"aria-labelledby": labelId
		}, elementProps]
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SelectGroupContext.Provider, {
		value: contextValue,
		children: element
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/utils/asc.mjs
function asc(a, b) {
	return a - b;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/utils/getSliderValue.mjs
function getSliderValue(valueInput, index, min, max, range, values) {
	const clamped = clamp(valueInput, min, max);
	if (!range) return clamped;
	const output = values.slice();
	output[index] = clamp(clamped, values[index - 1] ?? -Infinity, values[index + 1] ?? Infinity);
	return output.sort(asc);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/utils/validateMinimumDistance.mjs
function validateMinimumDistance(values, step, minStepsBetweenValues) {
	if (!Array.isArray(values)) return true;
	const minDistance = step * minStepsBetweenValues;
	for (let i = 0; i < values.length - 1; i += 1) if (!(Math.abs(values[i] - values[i + 1]) >= minDistance)) return false;
	return true;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/root/stateAttributesMapping.mjs
var nullMapping = () => null;
var sliderStateAttributesMapping = {
	activeThumbIndex: nullMapping,
	max: nullMapping,
	min: nullMapping,
	minStepsBetweenValues: nullMapping,
	step: nullMapping,
	values: nullMapping,
	...fieldValidityMapping
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/root/SliderRootContext.mjs
var SliderRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useSliderRootContext() {
	const context = import_react.useContext(SliderRootContext);
	if (context === void 0) throw new Error(formatErrorMessage(62));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/root/SliderRoot.mjs
function areValuesEqual(newValue, oldValue) {
	return newValue === oldValue || Array.isArray(newValue) && Array.isArray(oldValue) && areArraysEqual(newValue, oldValue);
}
/**
* Groups all parts of the slider.
* Renders a `<div>` element.
*
* Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
*/
var SliderRoot = /*#__PURE__*/ import_react.forwardRef(function SliderRoot(componentProps, forwardedRef) {
	const { "aria-labelledby": ariaLabelledByProp, className, defaultValue, disabled: disabledProp = false, id: idProp, format, largeStep = 10, locale, render, max = 100, min = 0, minStepsBetweenValues = 0, form, name: nameProp, onValueChange: onValueChangeProp, onValueCommitted: onValueCommittedProp, orientation = "horizontal", step = 1, thumbCollisionBehavior = "push", thumbAlignment = "center", value: valueProp, style, ...elementProps } = componentProps;
	const id = useBaseUiId(idProp);
	const defaultLabelId = getDefaultLabelId(id);
	const onValueChange = useStableCallback(onValueChangeProp);
	const onValueCommitted = useStableCallback(onValueCommittedProp);
	const { clearErrors } = useFormContext();
	const { state: fieldState, disabled: fieldDisabled, name: fieldName, setTouched, setDirty, validityData, validation } = useFieldRootContext();
	const { labelId: fieldLabelId } = useLabelableContext();
	const [labelId, setLabelId] = import_react.useState();
	const ariaLabelledby = ariaLabelledByProp ?? resolveAriaLabelledBy(fieldLabelId, labelId);
	const disabled = fieldDisabled || disabledProp;
	const name = fieldName ?? nameProp;
	const [valueUnwrapped, setValueUnwrapped] = useControlled({
		controlled: valueProp,
		default: defaultValue ?? min,
		name: "Slider"
	});
	const sliderRef = import_react.useRef(null);
	const controlRef = import_react.useRef(null);
	const thumbRefs = import_react.useRef([]);
	const pressedThumbCenterOffsetRef = import_react.useRef(null);
	const pressedThumbIndexRef = import_react.useRef(-1);
	const pressedValuesRef = import_react.useRef(null);
	const lastChangeReasonRef = import_react.useRef(none);
	const [active, setActiveState] = import_react.useState(-1);
	const [lastUsedThumbIndex, setLastUsedThumbIndex] = import_react.useState(-1);
	const [dragging, setDragging] = import_react.useState(false);
	const [thumbMap, setThumbMap] = import_react.useState(() => /* @__PURE__ */ new Map());
	const [indicatorPosition, setIndicatorPosition] = import_react.useState([void 0, void 0]);
	const setActive = useStableCallback((value) => {
		setActiveState(value);
		if (value !== -1) setLastUsedThumbIndex(value);
	});
	const registerFieldControlRef = useStableCallback((element) => {
		if (element) controlRef.current = element;
	});
	const range = Array.isArray(valueUnwrapped);
	const values = import_react.useMemo(() => {
		if (!range) return [clamp(valueUnwrapped, min, max)];
		return valueUnwrapped.map((value) => clamp(value, min, max)).sort(asc);
	}, [
		max,
		min,
		range,
		valueUnwrapped
	]);
	const fieldValue = range ? values : values[0];
	useRegisterFieldControl(validation.inputRef, id, fieldValue, void 0, !disabled, nameProp);
	useValueChanged(fieldValue, () => {
		clearErrors(name);
		validation.change(fieldValue);
		const initialValue = validityData.initialValue;
		let isDirty;
		if (Array.isArray(fieldValue) && Array.isArray(initialValue)) isDirty = !areArraysEqual(fieldValue, initialValue);
		else isDirty = fieldValue !== initialValue;
		setDirty(isDirty);
	});
	const setValue = useStableCallback((newValue, details) => {
		if (Number.isNaN(newValue) || areValuesEqual(newValue, valueUnwrapped)) return false;
		const nativeEvent = details.event;
		const EventConstructor = nativeEvent.constructor;
		const clonedEvent = new EventConstructor(nativeEvent.type, nativeEvent);
		Object.defineProperty(clonedEvent, "target", {
			writable: true,
			value: {
				value: newValue,
				name
			}
		});
		details.event = clonedEvent;
		onValueChange(newValue, details);
		if (details.isCanceled) return false;
		lastChangeReasonRef.current = details.reason;
		setValueUnwrapped(newValue);
		return true;
	});
	const handleInputChange = useStableCallback((valueInput, index, event) => {
		const newValue = getSliderValue(valueInput, index, min, max, range, values);
		if (validateMinimumDistance(newValue, step, minStepsBetweenValues)) {
			const reason = "key" in event ? keyboard : inputChange;
			const applied = setValue(newValue, createChangeEventDetails(reason, event.nativeEvent, void 0, { activeThumbIndex: index }));
			setTouched(true);
			if (applied) onValueCommitted(newValue, createGenericEventDetails(reason, event.nativeEvent));
		}
	});
	useIsoLayoutEffect(() => {
		if (!disabled) return;
		const activeEl = activeElement(ownerDocument(sliderRef.current));
		if (contains(sliderRef.current, activeEl)) activeEl.blur();
		if (active !== -1) setActive(-1);
	}, [
		active,
		disabled,
		setActive
	]);
	const state = import_react.useMemo(() => ({
		...fieldState,
		activeThumbIndex: active,
		disabled,
		dragging,
		orientation,
		max,
		min,
		minStepsBetweenValues,
		step,
		values
	}), [
		fieldState,
		active,
		disabled,
		dragging,
		max,
		min,
		minStepsBetweenValues,
		orientation,
		step,
		values
	]);
	const contextValue = import_react.useMemo(() => ({
		active,
		controlRef,
		disabled,
		dragging,
		validation,
		format,
		handleInputChange,
		indicatorPosition,
		inset: thumbAlignment !== "center",
		labelId: ariaLabelledby,
		rootLabelId: defaultLabelId,
		largeStep,
		lastUsedThumbIndex,
		lastChangeReasonRef,
		form,
		locale,
		max,
		min,
		minStepsBetweenValues,
		name,
		onValueCommitted,
		orientation,
		pressedThumbCenterOffsetRef,
		pressedThumbIndexRef,
		pressedValuesRef,
		registerFieldControlRef,
		renderBeforeHydration: thumbAlignment === "edge",
		setActive,
		setDragging,
		setIndicatorPosition,
		setLabelId,
		setValue,
		state,
		step,
		thumbCollisionBehavior,
		thumbMap,
		thumbRefs,
		values
	}), [
		active,
		ariaLabelledby,
		defaultLabelId,
		disabled,
		dragging,
		validation,
		format,
		handleInputChange,
		indicatorPosition,
		largeStep,
		lastUsedThumbIndex,
		form,
		locale,
		max,
		min,
		minStepsBetweenValues,
		name,
		onValueCommitted,
		orientation,
		registerFieldControlRef,
		setActive,
		setValue,
		state,
		step,
		thumbCollisionBehavior,
		thumbAlignment,
		thumbMap,
		values
	]);
	const element = useRenderElement("div", componentProps, {
		state,
		ref: [forwardedRef, sliderRef],
		props: [
			{
				"aria-labelledby": ariaLabelledby,
				id,
				role: "group"
			},
			elementProps,
			(props) => validation.getValidationProps(disabled, props)
		],
		stateAttributesMapping: sliderStateAttributesMapping
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SliderRootContext.Provider, {
		value: contextValue,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CompositeList, {
			elementsRef: thumbRefs,
			onMapChange: setThumbMap,
			children: element
		})
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/utils/getMidpoint.mjs
function getMidpoint(element, vertical) {
	const rect = element.getBoundingClientRect();
	return vertical ? (rect.top + rect.bottom) / 2 : (rect.left + rect.right) / 2;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/utils/roundValueToStep.mjs
function getDecimalPrecision(num) {
	if (num === 0) return 0;
	if (Math.abs(num) < 1) {
		const parts = num.toExponential().split("e-");
		const matissaDecimalPart = parts[0].split(".")[1];
		return (matissaDecimalPart ? matissaDecimalPart.length : 0) + parseInt(parts[1], 10);
	}
	const decimalPart = num.toString().split(".")[1];
	return decimalPart ? decimalPart.length : 0;
}
function roundValueToStep(value, step, min) {
	const nearest = Math.round((value - min) / step) * step + min;
	return Number(nearest.toFixed(Math.max(getDecimalPrecision(step), getDecimalPrecision(min))));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/utils/getPushedThumbValues.mjs
/**
* Returns a new array of slider values where attempting to move the thumb at `index`
* beyond its neighbours "pushes" them while respecting `minStepsBetweenValues`.
*
* Positional arguments are deliberate: property names of an options object don't
* minify, so passing them positionally keeps this internal helper smaller in the bundle.
*/
function getPushedThumbValues(values, index, nextValue, min, max, step, minStepsBetweenValues, initialValues) {
	const nextValues = values.slice();
	const minValueDifference = step * minStepsBetweenValues;
	const lastIndex = nextValues.length - 1;
	const baseInitialValues = initialValues ?? values;
	nextValues[index] = clamp(nextValue, min + index * minValueDifference, max - (lastIndex - index) * minValueDifference);
	for (let i = index + 1; i <= lastIndex; i += 1) {
		const minAllowed = nextValues[i - 1] + minValueDifference;
		const maxAllowed = max - (lastIndex - i) * minValueDifference;
		const initialValue = baseInitialValues[i];
		let candidate = Math.max(nextValues[i], minAllowed);
		if (initialValue < candidate) candidate = Math.max(initialValue, minAllowed);
		nextValues[i] = clamp(candidate, minAllowed, maxAllowed);
	}
	for (let i = index - 1; i >= 0; i -= 1) {
		const maxAllowed = nextValues[i + 1] - minValueDifference;
		const minAllowed = min + i * minValueDifference;
		const initialValue = baseInitialValues[i];
		let candidate = Math.min(nextValues[i], maxAllowed);
		if (initialValue > candidate) candidate = Math.min(initialValue, maxAllowed);
		nextValues[i] = clamp(candidate, minAllowed, maxAllowed);
	}
	for (let i = 0; i <= lastIndex; i += 1) nextValues[i] = Number(nextValues[i].toFixed(12));
	return nextValues;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/utils/resolveThumbCollision.mjs
/**
* Positional arguments are deliberate: property names of an options object don't
* minify, so passing them positionally keeps this internal helper smaller in the bundle.
*/
function resolveThumbCollision(behavior, values, currentValues, initialValues, pressedIndex, nextValue, min, max, step, minStepsBetweenValues) {
	const activeValues = currentValues ?? values;
	const baselineValues = initialValues ?? values;
	if (!(activeValues.length > 1)) return {
		value: nextValue,
		thumbIndex: 0,
		didSwap: false
	};
	const minValueDifference = step * minStepsBetweenValues;
	if (behavior === "push") return {
		value: getPushedThumbValues(activeValues, pressedIndex, nextValue, min, max, step, minStepsBetweenValues),
		thumbIndex: pressedIndex,
		didSwap: false
	};
	const candidateValues = activeValues.slice();
	const previousNeighbor = candidateValues[pressedIndex - 1];
	const nextNeighbor = candidateValues[pressedIndex + 1];
	const lowerBound = previousNeighbor != null ? previousNeighbor + minValueDifference : min;
	const upperBound = nextNeighbor != null ? nextNeighbor - minValueDifference : max;
	const pressedValueAfterClamp = Number(clamp(nextValue, lowerBound, upperBound).toFixed(12));
	candidateValues[pressedIndex] = pressedValueAfterClamp;
	switch (behavior) {
		case "swap": {
			const pressedInitialValue = activeValues[pressedIndex];
			const epsilon = 1e-7;
			const movingForward = nextValue > pressedInitialValue;
			const movingBackward = nextValue < pressedInitialValue;
			const shouldSwapForward = movingForward && nextNeighbor != null && nextValue >= nextNeighbor - epsilon;
			const shouldSwapBackward = movingBackward && previousNeighbor != null && nextValue <= previousNeighbor + epsilon;
			if (!shouldSwapForward && !shouldSwapBackward) return {
				value: candidateValues,
				thumbIndex: pressedIndex,
				didSwap: false
			};
			const targetIndex = shouldSwapForward ? pressedIndex + 1 : pressedIndex - 1;
			const initialValuesForPush = candidateValues.map((_, index) => {
				if (index === pressedIndex) return pressedValueAfterClamp;
				const baseline = baselineValues[index];
				if (baseline != null) return baseline;
				return activeValues[index];
			});
			let nextValueForTarget = nextValue;
			if (shouldSwapForward) nextValueForTarget = Math.max(nextValue, candidateValues[targetIndex]);
			else nextValueForTarget = Math.min(nextValue, candidateValues[targetIndex]);
			const adjustedValues = getPushedThumbValues(candidateValues, targetIndex, nextValueForTarget, min, max, step, minStepsBetweenValues, initialValuesForPush);
			const neighborIndex = shouldSwapForward ? targetIndex - 1 : targetIndex + 1;
			const previousValue = adjustedValues[neighborIndex - 1];
			const nextValueAfter = adjustedValues[neighborIndex + 1];
			let neighborLowerBound = previousValue != null ? previousValue + minValueDifference : min;
			neighborLowerBound = Math.max(neighborLowerBound, min + neighborIndex * minValueDifference);
			let neighborUpperBound = nextValueAfter != null ? nextValueAfter - minValueDifference : max;
			neighborUpperBound = Math.min(neighborUpperBound, max - (adjustedValues.length - 1 - neighborIndex) * minValueDifference);
			const restoredValue = clamp(pressedValueAfterClamp, neighborLowerBound, neighborUpperBound);
			adjustedValues[neighborIndex] = Number(restoredValue.toFixed(12));
			return {
				value: adjustedValues,
				thumbIndex: targetIndex,
				didSwap: true
			};
		}
		default: return {
			value: candidateValues,
			thumbIndex: pressedIndex,
			didSwap: false
		};
	}
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/control/SliderControl.mjs
var INTENTIONAL_DRAG_COUNT_THRESHOLD = 2;
function getControlOffset(styles, vertical) {
	if (!styles) return {
		start: 0,
		end: 0
	};
	function parseSize(value) {
		const parsed = value != null ? parseFloat(value) : 0;
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	const start = !vertical ? "InlineStart" : "Top";
	const end = !vertical ? "InlineEnd" : "Bottom";
	return {
		start: parseSize(styles[`border${start}Width`]) + parseSize(styles[`padding${start}`]),
		end: parseSize(styles[`border${end}Width`]) + parseSize(styles[`padding${end}`])
	};
}
function getFingerCoords(event, touchIdRef) {
	if (touchIdRef.current != null && event.changedTouches) {
		const touchEvent = event;
		for (let i = 0; i < touchEvent.changedTouches.length; i += 1) {
			const touch = touchEvent.changedTouches[i];
			if (touch.identifier === touchIdRef.current) return {
				x: touch.clientX,
				y: touch.clientY
			};
		}
		return null;
	}
	return {
		x: event.clientX,
		y: event.clientY
	};
}
/**
* The clickable, interactive part of the slider.
* Renders a `<div>` element.
*
* Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
*/
var SliderControl = /*#__PURE__*/ import_react.forwardRef(function SliderControl(componentProps, forwardedRef) {
	const { render: renderProp, className, style, ...elementProps } = componentProps;
	const { disabled, dragging, inset, lastChangeReasonRef, max, min, minStepsBetweenValues, onValueCommitted, orientation, pressedThumbCenterOffsetRef, pressedThumbIndexRef, pressedValuesRef, registerFieldControlRef, renderBeforeHydration, setActive, setDragging, setValue, state, step, thumbCollisionBehavior, thumbRefs, values } = useSliderRootContext();
	const direction = useDirection();
	const range = values.length > 1;
	const vertical = orientation === "vertical";
	const controlRef = import_react.useRef(null);
	const stylesRef = import_react.useRef(null);
	const setStylesRef = useStableCallback((element) => {
		if (element && stylesRef.current == null) stylesRef.current = getWindow(element).getComputedStyle(element);
	});
	const touchIdRef = import_react.useRef(null);
	const moveCountRef = import_react.useRef(0);
	const insetThumbOffsetRef = import_react.useRef(0);
	const currentInteractionValueRef = import_react.useRef(null);
	const latestValuesRef = useValueAsRef(values);
	function getThumbInput(el) {
		return el?.querySelector("input[type=\"range\"]");
	}
	function updatePressedThumb(nextIndex) {
		pressedThumbIndexRef.current = nextIndex;
		if (!thumbRefs.current[nextIndex]) pressedThumbCenterOffsetRef.current = null;
	}
	function resetPressedThumb() {
		pressedThumbIndexRef.current = -1;
		pressedThumbCenterOffsetRef.current = null;
	}
	function isTargetDisabledThumb(target) {
		if (!isElement(target)) return false;
		return thumbRefs.current.some((thumbEl) => {
			if (!isElement(thumbEl) || !contains(thumbEl, target)) return false;
			return getThumbInput(thumbEl)?.disabled === true;
		});
	}
	function getFingerState(fingerCoords) {
		const control = controlRef.current;
		const thumbIndex = pressedThumbIndexRef.current;
		if (!control || thumbIndex < 0 || thumbIndex >= values.length) {
			if (thumbIndex >= values.length) currentInteractionValueRef.current = null;
			return null;
		}
		const { width, height, bottom, left, right } = control.getBoundingClientRect();
		const controlOffset = getControlOffset(stylesRef.current, vertical);
		const insetThumbOffset = insetThumbOffsetRef.current;
		const controlSize = (vertical ? height : width) - controlOffset.start - controlOffset.end - insetThumbOffset * 2;
		const thumbCenterOffset = pressedThumbCenterOffsetRef.current ?? 0;
		const fingerX = fingerCoords.x - thumbCenterOffset;
		const fingerY = fingerCoords.y - thumbCenterOffset;
		const valueRescaled = clamp(((vertical ? bottom - fingerY - controlOffset.end : (direction === "rtl" ? right - fingerX : fingerX - left) - controlOffset.start) - insetThumbOffset) / controlSize, 0, 1);
		let newValue = (max - min) * valueRescaled + min;
		newValue = roundValueToStep(newValue, step, min);
		newValue = clamp(newValue, min, max);
		if (!range) return {
			value: newValue,
			thumbIndex,
			didSwap: false
		};
		return resolveThumbCollision(thumbCollisionBehavior, values, latestValuesRef.current, pressedValuesRef.current, thumbIndex, newValue, min, max, step, minStepsBetweenValues);
	}
	function startPressing(fingerCoords) {
		pressedValuesRef.current = range ? values.slice() : null;
		currentInteractionValueRef.current = null;
		latestValuesRef.current = values;
		const pressedThumbIndex = pressedThumbIndexRef.current;
		let closestThumbIndex = pressedThumbIndex;
		if (pressedThumbIndex > -1 && pressedThumbIndex < values.length) {
			if (values[pressedThumbIndex] === max) {
				let candidateIndex = pressedThumbIndex;
				while (candidateIndex > 0 && values[candidateIndex - 1] === max) candidateIndex -= 1;
				closestThumbIndex = candidateIndex;
			}
		} else {
			const axis = !vertical ? "x" : "y";
			let minDistance;
			closestThumbIndex = -1;
			for (let i = 0; i < thumbRefs.current.length; i += 1) {
				const thumbEl = thumbRefs.current[i];
				if (isElement(thumbEl) && !getThumbInput(thumbEl)?.disabled) {
					const midpoint = getMidpoint(thumbEl, vertical);
					const distance = Math.abs(fingerCoords[axis] - midpoint);
					if (minDistance === void 0 || distance <= minDistance) {
						closestThumbIndex = i;
						minDistance = distance;
					}
				}
			}
		}
		if (closestThumbIndex > -1 && closestThumbIndex !== pressedThumbIndex) updatePressedThumb(closestThumbIndex);
		if (inset) {
			const thumbEl = thumbRefs.current[closestThumbIndex];
			if (isElement(thumbEl)) {
				const thumbRect = thumbEl.getBoundingClientRect();
				insetThumbOffsetRef.current = thumbRect[!vertical ? "width" : "height"] / 2;
			}
		}
	}
	function focusThumb(thumbIndex) {
		const input = getThumbInput(thumbRefs.current?.[thumbIndex]);
		if (!input) return;
		input.focus({
			preventScroll: true,
			focusVisible: false
		});
	}
	function setValueFromPointer(finger, reason, nativeEvent) {
		const applied = setValue(finger.value, createChangeEventDetails(reason, nativeEvent, void 0, { activeThumbIndex: finger.thumbIndex }));
		if (applied) {
			currentInteractionValueRef.current = finger.value;
			latestValuesRef.current = Array.isArray(finger.value) ? finger.value : [finger.value];
			if (finger.didSwap) {
				updatePressedThumb(finger.thumbIndex);
				focusThumb(finger.thumbIndex);
			}
		}
		return applied;
	}
	const handleTouchMove = useStableCallback((nativeEvent) => {
		const fingerCoords = getFingerCoords(nativeEvent, touchIdRef);
		if (fingerCoords == null) return;
		moveCountRef.current += 1;
		if (nativeEvent.type === "pointermove" && nativeEvent.buttons === 0) {
			handleTouchEnd(nativeEvent);
			return;
		}
		const finger = getFingerState(fingerCoords);
		if (finger == null) return;
		if (validateMinimumDistance(finger.value, step, minStepsBetweenValues)) {
			if (!dragging && moveCountRef.current > INTENTIONAL_DRAG_COUNT_THRESHOLD) setDragging(true);
			setValueFromPointer(finger, drag, nativeEvent);
		}
	});
	const handleTouchEnd = useStableCallback((nativeEvent) => {
		setActive(-1);
		setDragging(false);
		pressedThumbCenterOffsetRef.current = null;
		const interactionValue = currentInteractionValueRef.current;
		if (Array.isArray(interactionValue) && interactionValue.length !== values.length) currentInteractionValueRef.current = null;
		if (currentInteractionValueRef.current != null) {
			const commitReason = lastChangeReasonRef.current;
			onValueCommitted(currentInteractionValueRef.current, createGenericEventDetails(commitReason, nativeEvent));
		}
		if ("pointerType" in nativeEvent && controlRef.current?.hasPointerCapture(nativeEvent.pointerId)) controlRef.current?.releasePointerCapture(nativeEvent.pointerId);
		pressedThumbIndexRef.current = -1;
		touchIdRef.current = null;
		stopListening();
	});
	const handleTouchStart = useStableCallback((nativeEvent) => {
		if (disabled) return;
		if (isTargetDisabledThumb(getTarget(nativeEvent))) {
			resetPressedThumb();
			return;
		}
		const touch = nativeEvent.changedTouches[0];
		if (touch == null) return;
		touchIdRef.current = touch.identifier;
		const fingerCoords = {
			x: touch.clientX,
			y: touch.clientY
		};
		startPressing(fingerCoords);
		const finger = getFingerState(fingerCoords);
		if (finger == null) return;
		focusThumb(finger.thumbIndex);
		setValueFromPointer(finger, trackPress, nativeEvent);
		moveCountRef.current = 0;
		const doc = ownerDocument(controlRef.current);
		doc.addEventListener("touchmove", handleTouchMove, { passive: true });
		doc.addEventListener("touchend", handleTouchEnd, { passive: true });
	});
	const stopListening = useStableCallback(() => {
		const doc = ownerDocument(controlRef.current);
		doc.removeEventListener("pointermove", handleTouchMove);
		doc.removeEventListener("pointerup", handleTouchEnd);
		doc.removeEventListener("touchmove", handleTouchMove);
		doc.removeEventListener("touchend", handleTouchEnd);
		pressedValuesRef.current = null;
		currentInteractionValueRef.current = null;
	});
	const focusFrame = useAnimationFrame();
	import_react.useEffect(() => {
		const control = controlRef.current;
		if (!control) return () => stopListening();
		const unsubscribeTouchStart = addEventListener(control, "touchstart", handleTouchStart, { passive: true });
		return () => {
			unsubscribeTouchStart();
			focusFrame.cancel();
			stopListening();
		};
	}, [
		stopListening,
		handleTouchStart,
		controlRef,
		focusFrame
	]);
	import_react.useEffect(() => {
		if (disabled) stopListening();
	}, [disabled, stopListening]);
	return useRenderElement("div", componentProps, {
		state,
		ref: [
			forwardedRef,
			registerFieldControlRef,
			controlRef,
			setStylesRef
		],
		props: [{
			["data-base-ui-slider-control"]: renderBeforeHydration ? "" : void 0,
			onPointerDown(event) {
				const control = controlRef.current;
				const target = getTarget(event.nativeEvent);
				if (!control || disabled || event.defaultPrevented || !isElement(target) || event.button !== 0) return;
				if (isTargetDisabledThumb(target)) {
					resetPressedThumb();
					return;
				}
				const fingerCoords = {
					x: event.clientX,
					y: event.clientY
				};
				startPressing(fingerCoords);
				const finger = getFingerState(fingerCoords);
				if (finger == null) return;
				if (contains(thumbRefs.current[finger.thumbIndex], activeElement(ownerDocument(control)))) event.preventDefault();
				else focusFrame.request(() => {
					focusThumb(finger.thumbIndex);
				});
				setDragging(true);
				if (!(pressedThumbCenterOffsetRef.current != null)) setValueFromPointer(finger, trackPress, event.nativeEvent);
				if (event.nativeEvent.pointerId) control.setPointerCapture(event.nativeEvent.pointerId);
				moveCountRef.current = 0;
				const doc = ownerDocument(control);
				doc.addEventListener("pointermove", handleTouchMove, { passive: true });
				doc.addEventListener("pointerup", handleTouchEnd, { once: true });
			}
		}, elementProps],
		stateAttributesMapping: sliderStateAttributesMapping
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/track/SliderTrack.mjs
/**
* Contains the slider indicator and represents the entire range of the slider.
* Renders a `<div>` element.
*
* Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
*/
var SliderTrack = /*#__PURE__*/ import_react.forwardRef(function SliderTrack(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	const { state } = useSliderRootContext();
	return useRenderElement("div", componentProps, {
		state,
		ref: forwardedRef,
		props: [{ style: { position: "relative" } }, elementProps],
		stateAttributesMapping: sliderStateAttributesMapping
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useIsHydrating.mjs
function subscribe() {
	return NOOP;
}
function getSnapshot() {
	return false;
}
function getServerSnapshot() {
	return true;
}
/**
* Returns `true` while React is hydrating server-rendered markup and `false`
* for fresh client-only mounts.
*/
function useIsHydrating() {
	return (0, import_shim.useSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/PrehydrationScript.mjs
/**
* Renders an inline script that runs before React hydrates, used by components that need
* to position server-rendered content ahead of hydration (e.g. `Tabs.Indicator`,
* `Slider.Thumb`).
*
* The `script` source is imported by the caller through the package's `#prehydration/*`
* subpath import, whose `browser` condition resolves to a stub module exporting an empty
* string — so the script body is excluded from client bundles. It only ever executes from
* server-rendered HTML.
*
* Render this only when the script should be emitted (i.e. gate `renderBeforeHydration`
* and any structural conditions at the call site). The element is still rendered (with
* empty content) on the client during the hydration pass so the React tree matches the
* server markup; `suppressHydrationWarning` bridges the content difference and React keeps
* the already-executed server script. Once `isHydrating` flips to `false` the element
* unmounts.
*
* The component must stay in client bundles: returning `null` on the client (e.g. by
* stubbing the whole component) would drop an element the server emitted and trigger a
* recoverable hydration error (React #418) in consumers' apps. Only the script body is
* excluded from client bundles, via the `#prehydration/*` `browser` condition.
*
* When adding a new consumer, register a matching `#prehydration/*` entry (with `browser`
* and `default` conditions) in `packages/react/package.json` `imports`; the `browser`
* condition reuses the shared `internals/prehydrationScript.stub.ts`.
*/
function PrehydrationScript(props) {
	const { script } = props;
	const { nonce } = useCSPContext();
	if (!useIsHydrating()) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("script", {
		nonce,
		dangerouslySetInnerHTML: { __html: script },
		suppressHydrationWarning: true
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/thumb/SliderThumbDataAttributes.mjs
/**
* Indicates the index of the thumb in range sliders.
*/
var index = "data-index";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/thumb/SliderThumb.mjs
var _PrehydrationScript;
var ALL_KEYS = /* @__PURE__ */ new Set([
	...COMPOSITE_KEYS,
	PAGE_UP,
	PAGE_DOWN
]);
function getDefaultAriaValueText(values, index, format, locale) {
	if (index < 0) return;
	if (values.length === 2) return `${formatNumber(values[index], locale, format)} ${index === 0 ? "start" : "end"} range`;
	return format ? formatNumber(values[index], locale, format) : void 0;
}
function getNewValue(thumbValue, increment, direction, min, max) {
	const value = thumbValue + increment * direction;
	return clamp(Number(value.toFixed(Math.max(getDecimalPrecision(thumbValue), getDecimalPrecision(increment), getDecimalPrecision(min)))), min, max);
}
/**
* The draggable part of the slider at the tip of the indicator.
* Renders a `<div>` element and a nested `<input type="range">`.
*
* Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
*/
var SliderThumb = /*#__PURE__*/ import_react.forwardRef(function SliderThumb(componentProps, forwardedRef) {
	const { render, children: childrenProp, className, "aria-describedby": ariaDescribedByProp, "aria-label": ariaLabelProp, "aria-labelledby": ariaLabelledByProp, "aria-valuetext": ariaValueTextProp, disabled: disabledProp = false, getAriaLabel: getAriaLabelProp, getAriaValueText: getAriaValueTextProp, id: idProp, index: indexProp, inputRef: inputRefProp, onBlur: onBlurProp, onFocus: onFocusProp, onKeyDown: onKeyDownProp, tabIndex: tabIndexProp, style, ...elementProps } = componentProps;
	const id = useBaseUiId(idProp);
	const { active: activeIndex, lastUsedThumbIndex, controlRef, disabled: contextDisabled, validation, format, handleInputChange, inset, labelId, largeStep, locale, max, min, minStepsBetweenValues, form, name, orientation, pressedThumbCenterOffsetRef, pressedThumbIndexRef, renderBeforeHydration, setActive, setIndicatorPosition, state, step, thumbRefs, values: sliderValues } = useSliderRootContext();
	const direction = useDirection();
	const disabled = disabledProp || contextDisabled;
	const range = sliderValues.length > 1;
	const vertical = orientation === "vertical";
	const rtl = direction === "rtl";
	const { setTouched, setFocused, validationMode } = useFieldRootContext();
	const thumbRef = import_react.useRef(null);
	const inputRef = import_react.useRef(null);
	const restoringFocusVisibleRef = import_react.useRef(false);
	const handleFocusProp = useStableCallback((event) => {
		if (restoringFocusVisibleRef.current) return;
		onFocusProp?.(event);
	});
	const handleBlurProp = useStableCallback((event) => {
		if (restoringFocusVisibleRef.current) return;
		onBlurProp?.(event);
	});
	const defaultInputId = useBaseUiId();
	const labelableId = useLabelableId();
	const inputId = range ? defaultInputId : labelableId;
	const { ref: listItemRef, index: compositeIndex } = useCompositeListItem({ metadata: import_react.useMemo(() => ({ inputId }), [inputId]) });
	const index$2 = !range ? 0 : indexProp ?? compositeIndex;
	const last = index$2 === sliderValues.length - 1;
	const thumbValue = sliderValues[index$2];
	const thumbValuePercent = valueToPercent(thumbValue, min, max);
	const [positionPercent, setPositionPercent] = import_react.useState();
	const isHydrating = useIsHydrating();
	const safeLastUsedThumbIndex = lastUsedThumbIndex >= 0 && lastUsedThumbIndex < sliderValues.length ? lastUsedThumbIndex : -1;
	const getInsetPosition = useStableCallback(() => {
		const control = controlRef.current;
		const thumb = thumbRef.current;
		if (!control || !thumb) return;
		const thumbRect = thumb.getBoundingClientRect();
		const controlRect = control.getBoundingClientRect();
		const side = vertical ? "height" : "width";
		const controlSize = controlRect[side] - thumbRect[side];
		const nextPositionPercent = (thumbRect[side] / 2 + controlSize * thumbValuePercent / 100) / controlRect[side] * 100;
		const nextInsetPosition = Number.isFinite(nextPositionPercent) ? nextPositionPercent : void 0;
		setPositionPercent(nextInsetPosition);
		if (index$2 === 0) setIndicatorPosition((prevPosition) => [nextInsetPosition, prevPosition[1]]);
		else if (last) setIndicatorPosition((prevPosition) => [prevPosition[0], nextInsetPosition]);
	});
	useIsoLayoutEffect(() => {
		if (inset) queueMicrotask(getInsetPosition);
	}, [getInsetPosition, inset]);
	useIsoLayoutEffect(() => {
		if (inset) getInsetPosition();
	}, [
		getInsetPosition,
		inset,
		thumbValuePercent
	]);
	useIsoLayoutEffect(() => {
		if (!inset) return;
		const control = controlRef.current;
		const thumb = thumbRef.current;
		if (!control || !thumb) return;
		const ResizeObserverCtor = getWindow(control).ResizeObserver;
		if (typeof ResizeObserverCtor !== "function") return;
		const resizeObserver = new ResizeObserverCtor(getInsetPosition);
		resizeObserver.observe(control);
		resizeObserver.observe(thumb);
		return () => {
			resizeObserver.disconnect();
		};
	}, [
		controlRef,
		getInsetPosition,
		inset
	]);
	const startEdge = vertical ? "bottom" : "insetInlineStart";
	const crossOffsetProperty = vertical ? "left" : "top";
	let zIndex;
	if (range) {
		if (activeIndex === index$2) zIndex = 2;
		else if (safeLastUsedThumbIndex === index$2) zIndex = 1;
	} else if (activeIndex === index$2) zIndex = 1;
	let thumbStyle;
	if (!inset && !Number.isFinite(thumbValuePercent)) thumbStyle = visuallyHidden;
	else thumbStyle = {
		position: "absolute",
		[startEdge]: inset ? "var(--position)" : `${thumbValuePercent}%`,
		[crossOffsetProperty]: "50%",
		translate: `${(vertical || !rtl ? -1 : 1) * 50}% ${(vertical ? 1 : -1) * 50}%`,
		zIndex,
		...inset && {
			["--position"]: `${positionPercent ?? 0}%`,
			visibility: renderBeforeHydration && isHydrating || positionPercent === void 0 ? "hidden" : void 0
		}
	};
	let cssWritingMode;
	if (vertical) cssWritingMode = rtl ? "vertical-rl" : "vertical-lr";
	const ariaLabel = typeof getAriaLabelProp === "function" ? getAriaLabelProp(index$2) : ariaLabelProp;
	const inputProps = mergeProps({
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledByProp ?? (ariaLabel == null ? labelId : void 0),
		"aria-describedby": ariaDescribedByProp,
		"aria-orientation": orientation,
		"aria-valuenow": thumbValue,
		"aria-valuetext": typeof getAriaValueTextProp === "function" ? getAriaValueTextProp(formatNumber(thumbValue, locale, format), thumbValue, index$2) : ariaValueTextProp ?? getDefaultAriaValueText(sliderValues, index$2, format, locale),
		disabled,
		form,
		id: inputId,
		max,
		min,
		name,
		onChange(event) {
			handleInputChange(event.currentTarget.valueAsNumber, index$2, event);
		},
		onFocus(event) {
			const isRestoringFocusVisible = restoringFocusVisibleRef.current;
			restoringFocusVisibleRef.current = false;
			setActive(index$2);
			setFocused(true);
			if (isRestoringFocusVisible) event.stopPropagation();
		},
		onBlur(event) {
			if (restoringFocusVisibleRef.current) {
				event.stopPropagation();
				return;
			}
			setActive(-1);
			if (thumbRefs.current.some((thumb) => contains(thumb, event.relatedTarget))) return;
			setTouched(true);
			setFocused(false);
			if (validationMode === "onBlur") validation.commit(getSliderValue(thumbValue, index$2, min, max, range, sliderValues));
		},
		onKeyDown(event) {
			if (event.defaultPrevented) return;
			if (!ALL_KEYS.has(event.key)) return;
			if (COMPOSITE_KEYS.has(event.key)) event.stopPropagation();
			let newValue = null;
			let direction = 0;
			let increment = event.shiftKey ? largeStep : step;
			const roundedValue = roundValueToStep(thumbValue, step, min);
			switch (event.key) {
				case ARROW_UP:
					direction = 1;
					break;
				case ARROW_RIGHT:
					direction = rtl ? -1 : 1;
					break;
				case ARROW_DOWN:
					direction = -1;
					break;
				case ARROW_LEFT:
					direction = rtl ? 1 : -1;
					break;
				case PAGE_UP:
					increment = largeStep;
					direction = 1;
					break;
				case PAGE_DOWN:
					increment = largeStep;
					direction = -1;
					break;
				case "End":
					newValue = range && Number.isFinite(sliderValues[index$2 + 1]) ? sliderValues[index$2 + 1] - step * minStepsBetweenValues : max;
					break;
				case HOME: newValue = range && Number.isFinite(sliderValues[index$2 - 1]) ? sliderValues[index$2 - 1] + step * minStepsBetweenValues : min;
			}
			if (direction !== 0) newValue = getNewValue(roundedValue, increment, direction, min, max);
			if (newValue !== null) {
				const input = event.currentTarget;
				if (!matchesFocusVisible(input)) {
					restoringFocusVisibleRef.current = true;
					input.blur();
					input.focus({
						preventScroll: true,
						focusVisible: true
					});
				}
				handleInputChange(newValue, index$2, event);
				event.preventDefault();
			}
		},
		step,
		style: {
			...visuallyHidden,
			width: "100%",
			height: "100%",
			writingMode: cssWritingMode
		},
		tabIndex: tabIndexProp,
		type: "range",
		value: thumbValue ?? ""
	}, (props) => validation.getValidationProps(disabled, props), {
		onFocus: handleFocusProp,
		onBlur: handleBlurProp,
		onKeyDown: onKeyDownProp
	});
	const mergedInputRef = useMergedRefs(inputRef, validation.inputRef, inputRefProp);
	return useRenderElement("div", componentProps, {
		state,
		ref: [
			forwardedRef,
			listItemRef,
			thumbRef
		],
		props: [{
			[index]: index$2,
			children: /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
				childrenProp,
				/*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
					ref: mergedInputRef,
					...inputProps,
					suppressHydrationWarning: true
				}),
				inset && last && renderBeforeHydration && (_PrehydrationScript || (_PrehydrationScript = /*#__PURE__*/ (0, import_jsx_runtime.jsx)(PrehydrationScript, { script: "!function(){const t=document.currentScript?.parentElement;if(!t)return;const e=t.closest(\"[data-base-ui-slider-control]\");if(!e)return;const r=e.querySelector(\"[data-base-ui-slider-indicator]\"),i=e.getBoundingClientRect(),n=\"vertical\"===e.getAttribute(\"data-orientation\")?\"height\":\"width\",o=e.querySelectorAll('input[type=\"range\"]'),l=o.length>1,s=o.length-1;let a=null,u=null;for(let t=0;t<o.length;t+=1){const e=o[t],y=parseFloat(e.getAttribute(\"value\")??\"\");if(Number.isNaN(y))return;const c=e.parentElement;if(!c)return;const p=parseFloat(e.getAttribute(\"max\")??\"100\"),g=parseFloat(e.getAttribute(\"min\")??\"0\"),b=c?.getBoundingClientRect(),d=i[n]-b[n],m=100*(y-g)/(p-g),v=(b[n]/2+d*m/100)/i[n]*100;c.style.setProperty(\"--position\",`${v}%`),Number.isFinite(v)&&(c.style.removeProperty(\"visibility\"),r&&(0===t?(a=v,r.style.setProperty(\"--start-position\",`${v}%`),l||r.style.removeProperty(\"visibility\")):t===s&&(u=v-(a??0),r.style.setProperty(\"--end-position\",`${v}%`),r.style.setProperty(\"--relative-size\",`${u}%`),r.style.removeProperty(\"visibility\"))))}}();" })))
			] }),
			id,
			onPointerDown(event) {
				if (disabled) return;
				pressedThumbIndexRef.current = index$2;
				const midpoint = getMidpoint(event.currentTarget, vertical);
				pressedThumbCenterOffsetRef.current = (vertical ? event.clientY : event.clientX) - midpoint;
			},
			style: thumbStyle,
			suppressHydrationWarning: renderBeforeHydration || void 0
		}, elementProps],
		stateAttributesMapping: sliderStateAttributesMapping
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/slider/indicator/SliderIndicator.mjs
function getIndicatorStyles(vertical, range, inset, start, end, forceHidden) {
	const styles = {
		visibility: forceHidden || inset && (start === void 0 || range && end === void 0) ? "hidden" : void 0,
		position: vertical ? "absolute" : "relative",
		[vertical ? "width" : "height"]: "inherit"
	};
	let startValue = `${start ?? 0}%`;
	let sizeValue = `${(end ?? 0) - (start ?? 0)}%`;
	if (inset) {
		styles["--start-position"] = startValue;
		startValue = "var(--start-position)";
		if (range) {
			styles["--relative-size"] = sizeValue;
			sizeValue = "var(--relative-size)";
		}
	}
	styles[vertical ? "bottom" : "insetInlineStart"] = range ? startValue : 0;
	styles[vertical ? "height" : "width"] = range ? sizeValue : startValue;
	return styles;
}
/**
* Visualizes the current value of the slider.
* Renders a `<div>` element.
*
* Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
*/
var SliderIndicator = /*#__PURE__*/ import_react.forwardRef(function SliderIndicator(componentProps, forwardedRef) {
	const { render, className, style: styleProp, ...elementProps } = componentProps;
	const { indicatorPosition, inset, max, min, orientation, renderBeforeHydration, state, values } = useSliderRootContext();
	const isHydrating = useIsHydrating();
	const style = getIndicatorStyles(orientation === "vertical", values.length > 1, inset, inset ? indicatorPosition[0] : valueToPercent(values[0], min, max), inset ? indicatorPosition[1] : valueToPercent(values[values.length - 1], min, max), inset && renderBeforeHydration && isHydrating);
	return useRenderElement("div", componentProps, {
		state,
		ref: forwardedRef,
		props: [{
			["data-base-ui-slider-indicator"]: renderBeforeHydration ? "" : void 0,
			style,
			suppressHydrationWarning: renderBeforeHydration || void 0
		}, elementProps],
		stateAttributesMapping: sliderStateAttributesMapping
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/switch/root/SwitchRootContext.mjs
var SwitchRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useSwitchRootContext() {
	const context = import_react.useContext(SwitchRootContext);
	if (context === void 0) throw new Error(formatErrorMessage(63));
	return context;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/switch/root/SwitchRootDataAttributes.mjs
/**
* Present when the switch is checked.
*/
var checked = "data-checked";
/**
* Present when the switch is not checked.
*/
var unchecked = "data-unchecked";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/switch/stateAttributesMapping.mjs
var stateAttributesMapping = {
	...fieldValidityMapping,
	checked(value) {
		if (value) return { [checked]: "" };
		return { [unchecked]: "" };
	}
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/switch/root/SwitchRoot.mjs
/**
* Represents the switch itself.
* Renders a `<span>` element and a hidden `<input>` beside.
*
* Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
*/
var SwitchRoot = /*#__PURE__*/ import_react.forwardRef(function SwitchRoot(componentProps, forwardedRef) {
	const { checked: checkedProp, className, defaultChecked, "aria-labelledby": ariaLabelledByProp, form, id: idProp, inputRef: externalInputRef, name: nameProp, nativeButton = false, onCheckedChange, readOnly = false, required = false, disabled: disabledProp = false, render, uncheckedValue, value, style, ...elementProps } = componentProps;
	const { clearErrors } = useFormContext();
	const { state: fieldState, setTouched, setDirty, validityData, setFilled, setFocused, validationMode, disabled: fieldDisabled, name: fieldName, validation } = useFieldRootContext();
	const { labelId } = useLabelableContext();
	const disabled = fieldDisabled || disabledProp;
	const name = fieldName ?? nameProp;
	const inputRef = import_react.useRef(null);
	const handleInputRef = useMergedRefs(inputRef, externalInputRef, validation.inputRef);
	const switchRef = import_react.useRef(null);
	const id = useBaseUiId();
	const controlId = useLabelableId({ id: idProp });
	const hiddenInputId = nativeButton ? void 0 : controlId;
	const [checked, setCheckedState] = useControlled({
		controlled: checkedProp,
		default: Boolean(defaultChecked),
		name: "Switch",
		state: "checked"
	});
	useRegisterFieldControl(switchRef, id, checked, void 0, !disabled, nameProp);
	useIsoLayoutEffect(() => {
		setFilled(checked);
	}, [checked, setFilled]);
	useValueChanged(checked, () => {
		clearErrors(name);
		setDirty(checked !== validityData.initialValue);
		validation.change(checked);
	});
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	const ariaLabelledBy = useAriaLabelledBy(ariaLabelledByProp, labelId, inputRef, !nativeButton, hiddenInputId);
	const rootProps = {
		id: nativeButton ? controlId : id,
		role: "switch",
		"aria-checked": checked,
		"aria-readonly": readOnly || void 0,
		"aria-required": required || void 0,
		"aria-labelledby": ariaLabelledBy,
		onFocus() {
			if (!disabled) setFocused(true);
		},
		onBlur() {
			const element = inputRef.current;
			if (!element || disabled) return;
			setTouched(true);
			setFocused(false);
			if (validationMode === "onBlur") validation.commit(element.checked);
		},
		onClick(event) {
			if (readOnly || disabled) return;
			event.preventDefault();
			const input = inputRef.current;
			if (!input) return;
			dispatchClickWithModifiers(input, event);
		}
	};
	const inputProps = {
		...validation.getValidationProps(disabled),
		checked,
		disabled,
		form,
		id: hiddenInputId,
		name,
		required,
		style: name ? visuallyHiddenInput : visuallyHidden,
		tabIndex: -1,
		type: "checkbox",
		"aria-hidden": true,
		ref: handleInputRef,
		onChange(event) {
			if (event.nativeEvent.defaultPrevented) return;
			if (readOnly) {
				event.preventDefault();
				return;
			}
			const nextChecked = event.currentTarget.checked;
			const eventDetails = createChangeEventDetails(none, event.nativeEvent);
			onCheckedChange?.(nextChecked, eventDetails);
			if (eventDetails.isCanceled) return;
			setCheckedState(nextChecked);
		},
		onClick(event) {
			event.stopPropagation();
		},
		onFocus() {
			switchRef.current?.focus();
		},
		...value !== void 0 ? { value } : EMPTY_OBJECT
	};
	const state = import_react.useMemo(() => ({
		...fieldState,
		checked,
		disabled,
		readOnly,
		required
	}), [
		fieldState,
		checked,
		disabled,
		readOnly,
		required
	]);
	const element = useRenderElement("span", componentProps, {
		state,
		ref: [
			forwardedRef,
			switchRef,
			buttonRef
		],
		props: [
			rootProps,
			elementProps,
			getButtonProps,
			(props) => validation.getValidationProps(disabled, props)
		],
		stateAttributesMapping
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(SwitchRootContext.Provider, {
		value: state,
		children: [
			element,
			!checked && name && uncheckedValue !== void 0 && /*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
				type: "hidden",
				form,
				name,
				value: uncheckedValue,
				disabled
			}),
			/*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
				...inputProps,
				suppressHydrationWarning: true
			})
		]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.8.0_@date-fns+tz@1.5.0_@types+react@19.3.0_date-fns@4.4.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/switch/thumb/SwitchThumb.mjs
/**
* The movable part of the switch that indicates whether the switch is on or off.
* Renders a `<span>`.
*
* Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
*/
var SwitchThumb = /*#__PURE__*/ import_react.forwardRef(function SwitchThumb(componentProps, forwardedRef) {
	const { render, className, style, ...elementProps } = componentProps;
	return useRenderElement("span", componentProps, {
		state: useSwitchRootContext(),
		ref: forwardedRef,
		stateAttributesMapping,
		props: elementProps
	});
});
//#endregion
export { DialogPopup as $, MenuPositioner as A, AvatarRoot as B, PopoverPositioner as C, DialogRoot as D, PopoverRoot as E, MenuGroup as F, ComboboxPortal as G, ComboboxItem as H, ComboboxItemIndicator as I, ComboboxInput as J, ComboboxList as K, ComboboxRoot as L, MenuPopup as M, MenuItem as N, MenuTrigger as O, MenuGroupLabel as P, DialogPortal as Q, AvatarFallback as R, PopoverPopup as S, PopoverTrigger as T, ComboboxPopup as U, ComboboxEmpty as V, ComboboxPositioner as W, DialogTrigger as X, ComboboxTrigger as Y, DialogTitle as Z, SelectPortal as _, require_react_dom as _t, SliderTrack as a, CheckboxRoot as at, SelectTrigger as b, require_react as bt, SelectGroup as c, TooltipArrow as ct, SelectItemText as d, TooltipPortal as dt, DialogDescription as et, SelectItemIndicator as f, TooltipTrigger as ft, SelectPositioner as g, mergeProps as gt, SelectPopup as h, Button as ht, SliderThumb as i, CheckboxIndicator as it, MenuPortal as j, MenuRoot as k, SelectScrollUpArrow as l, TooltipPopup as lt, SelectList as m, Input as mt, SwitchRoot as n, DialogBackdrop as nt, SliderControl as o, useRender as ot, SelectItem as p, TooltipRoot as pt, ComboboxClear as q, SliderIndicator as r, Separator as rt, SliderRoot as s, TooltipProvider as st, SwitchThumb as t, DialogClose as tt, SelectScrollDownArrow as u, TooltipPositioner as ut, SelectIcon as v, require_with_selector as vt, PopoverPortal as w, SelectRoot as x, SelectValue as y, require_jsx_runtime as yt, AvatarImage as z };
