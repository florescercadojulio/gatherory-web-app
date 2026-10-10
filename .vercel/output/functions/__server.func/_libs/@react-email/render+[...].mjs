import { o as __toESM, r as __exportAll, t as __commonJSMin } from "../../_runtime.mjs";
import { bt as require_react, yt as require_jsx_runtime } from "../@base-ui/react+[...].mjs";
import { Writable } from "node:stream";
//#region node_modules/.pnpm/prettier@3.9.9/node_modules/prettier/plugins/html.mjs
var html_exports = /* @__PURE__ */ __exportAll({
	default: () => Zi,
	languages: () => Ui$1,
	options: () => zi,
	parsers: () => Pr$1,
	printers: () => $o$1
});
var Nr$1 = Object.defineProperty;
var Dr$1 = (e) => {
	throw TypeError(e);
};
var es = (e, t, r) => t in e ? Nr$1(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: r
}) : e[t] = r;
var Ir$1 = (e, t) => {
	for (var r in t) Nr$1(e, r, {
		get: t[r],
		enumerable: !0
	});
};
var Wt$1 = (e, t, r) => es(e, typeof t != "symbol" ? t + "" : t, r);
var ts = (e, t, r) => t.has(e) || Dr$1("Cannot " + r);
var qe$1 = (e, t, r) => (ts(e, t, "read from private field"), r ? r.call(e) : t.get(e));
var Rr$1 = (e, t, r) => t.has(e) ? Dr$1("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r);
var Zi = {};
Ir$1(Zi, {
	languages: () => Ui$1,
	options: () => zi,
	parsers: () => Pr$1,
	printers: () => $o$1
});
var ke$1 = (e, t) => (r, n, ...i) => r | 1 && n == null ? void 0 : (t.call(n) ?? n[e]).apply(n, i);
var rs = String.prototype.replaceAll ?? function(e, t) {
	return e.global ? this.replace(e, t) : this.split(e).join(t);
};
var T$1 = ke$1("replaceAll", function() {
	if (typeof this == "string") return rs;
});
function is(e) {
	return this[e < 0 ? this.length + e : e];
}
var I$2 = ke$1("at", function() {
	if (Array.isArray(this) || typeof this == "string") return is;
});
var as = () => {};
var He$1 = as;
var Fe$1 = "string";
var Ve$1 = "array";
var ot$1 = "cursor";
var be$1 = "indent";
var we$1 = "align";
var lt$1 = "trim";
var Te$1 = "group";
var ye$1 = "fill";
var Ee$1 = "if-break";
var xe$1 = "indent-if-break";
var ct$1 = "line-suffix";
var ut$1 = "line-suffix-boundary";
var z$1 = "line";
var pt$1 = "label";
var Le$1 = "break-parent";
var ht$1 = /* @__PURE__ */ new Set([
	ot$1,
	be$1,
	we$1,
	lt$1,
	Te$1,
	ye$1,
	Ee$1,
	xe$1,
	ct$1,
	ut$1,
	z$1,
	pt$1,
	Le$1
]);
function mt$1(e, t, r) {
	if (!e.has(t)) {
		let n = r(t);
		e.set(t, n);
	}
	return e.get(t);
}
function os(e) {
	if (typeof e == "string") return Fe$1;
	if (Array.isArray(e)) return Ve$1;
	if (!e) return;
	let { type: t } = e;
	if (ht$1.has(t)) return t;
}
var ft$1 = os;
var ls = (e) => new Intl.ListFormat("en-US", { type: "disjunction" }).format(e);
function cs(e) {
	let t = e === null ? "null" : typeof e;
	if (t !== "string" && t !== "object") return `Unexpected doc '${t}', 
Expected it to be 'string' or 'object'.`;
	if (ft$1(e)) throw new Error("doc is valid.");
	let r = Object.prototype.toString.call(e);
	if (r !== "[object Object]") return `Unexpected doc '${r}'.`;
	let n = ls([...ht$1].map((i) => `'${i}'`));
	return `Unexpected doc.type '${e.type}'.
Expected it to be ${n}.`;
}
var zt$1 = class extends Error {
	name = "InvalidDocError";
	constructor(t) {
		super(cs(t)), this.doc = t;
	}
};
var Or$1 = zt$1;
function Gt$1(e, t) {
	if (typeof e == "string") return t(e);
	let r = /* @__PURE__ */ new Map();
	return n(e);
	function n(s) {
		return mt$1(r, s, i);
	}
	function i(s) {
		switch (ft$1(s)) {
			case Ve$1: return t(s.map(n));
			case ye$1: return t({
				...s,
				parts: s.parts.map(n)
			});
			case Ee$1: return t({
				...s,
				breakContents: n(s.breakContents),
				flatContents: n(s.flatContents)
			});
			case Te$1: {
				let { expandedStates: a, contents: o } = s;
				return a ? (a = a.map(n), o = a[0]) : o = n(o), t({
					...s,
					contents: o,
					expandedStates: a
				});
			}
			case we$1:
			case be$1:
			case xe$1:
			case pt$1:
			case ct$1: return t({
				...s,
				contents: n(s.contents)
			});
			case Fe$1:
			case ot$1:
			case lt$1:
			case ut$1:
			case z$1:
			case Le$1: return t(s);
			default: throw new Or$1(s);
		}
	}
}
function L$1(e, t = Mr$1) {
	return Gt$1(e, (r) => typeof r == "string" ? R$1(t, r.split(`
`)) : r);
}
var D = He$1;
var dt$1 = He$1;
var Br$1 = He$1;
var qr$1 = He$1;
function A(e) {
	return D(e), {
		type: be$1,
		contents: e
	};
}
function us(e, t) {
	return qr$1(e), D(t), {
		type: we$1,
		contents: t,
		n: e
	};
}
function Hr$1(e) {
	return us(Number.NEGATIVE_INFINITY, e);
}
var G$1 = { type: Le$1 };
function gt$1(e) {
	return Br$1(e), {
		type: ye$1,
		parts: e
	};
}
function C(e, t = {}) {
	return D(e), dt$1(t.expandedStates, !0), {
		type: Te$1,
		id: t.id,
		contents: e,
		break: !!t.shouldBreak,
		expandedStates: t.expandedStates
	};
}
function $$1(e, t = "", r = {}) {
	return D(e), t !== "" && D(t), {
		type: Ee$1,
		breakContents: e,
		flatContents: t,
		groupId: r.groupId
	};
}
function Fr$1(e, t) {
	return D(e), {
		type: xe$1,
		contents: e,
		groupId: t.groupId,
		negate: t.negate
	};
}
function R$1(e, t) {
	D(e), dt$1(t);
	let r = [];
	for (let n = 0; n < t.length; n++) n !== 0 && r.push(e), r.push(t[n]);
	return r;
}
var S$1 = { type: z$1 };
var y$1 = {
	type: z$1,
	soft: !0
};
var k$1 = [{
	type: z$1,
	hard: !0
}, G$1];
var Mr$1 = [{
	type: z$1,
	hard: !0,
	literal: !0
}, G$1];
var Vr$1 = Object.freeze({
	character: "'",
	codePoint: 39
});
var Ur$1 = Object.freeze({
	character: "\"",
	codePoint: 34
});
var ms = Object.freeze({
	preferred: Vr$1,
	alternate: Ur$1
});
var fs = Object.freeze({
	preferred: Ur$1,
	alternate: Vr$1
});
function Wr$1(e, t) {
	let { preferred: r, alternate: n } = t === !0 || t === "'" ? ms : fs, { length: i } = e, s = 0, a = 0;
	for (let o = 0; o < i; o++) {
		let l = e.charCodeAt(o);
		l === r.codePoint ? s++ : l === n.codePoint && a++;
	}
	return (s > a ? n : r).character;
}
function $t$1(e) {
	if (typeof e != "string") throw new TypeError("Expected a string");
	return e.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
var jt$1 = class {
	#e;
	constructor(t) {
		this.#e = new Set(t);
	}
	getLeadingWhitespaceCount(t) {
		let r = this.#e, n = 0;
		for (let i = 0; i < t.length && r.has(t.charAt(i)); i++) n++;
		return n;
	}
	getTrailingWhitespaceCount(t) {
		let r = this.#e, n = 0;
		for (let i = t.length - 1; i >= 0 && r.has(t.charAt(i)); i--) n++;
		return n;
	}
	getLeadingWhitespace(t) {
		let r = this.getLeadingWhitespaceCount(t);
		return t.slice(0, r);
	}
	getTrailingWhitespace(t) {
		let r = this.getTrailingWhitespaceCount(t);
		return t.slice(t.length - r);
	}
	hasLeadingWhitespace(t) {
		return this.#e.has(t.charAt(0));
	}
	hasTrailingWhitespace(t) {
		return this.#e.has(I$2(0, t, -1));
	}
	trimStart(t) {
		let r = this.getLeadingWhitespaceCount(t);
		return t.slice(r);
	}
	trimEnd(t) {
		let r = this.getTrailingWhitespaceCount(t);
		return t.slice(0, t.length - r);
	}
	trim(t) {
		return this.trimEnd(this.trimStart(t));
	}
	split(t, r = !1) {
		let n = `[${$t$1([...this.#e].join(""))}]+`, i = new RegExp(r ? `(${n})` : n);
		return t.split(i);
	}
	hasWhitespaceCharacter(t) {
		let r = this.#e;
		return Array.prototype.some.call(t, (n) => r.has(n));
	}
	hasNonWhitespaceCharacter(t) {
		let r = this.#e;
		return Array.prototype.some.call(t, (n) => !r.has(n));
	}
	isWhitespaceOnly(t) {
		let r = this.#e;
		return Array.prototype.every.call(t, (n) => r.has(n));
	}
	#t(t) {
		let r = Number.POSITIVE_INFINITY;
		for (let n of t.split(`
`)) {
			if (n.length === 0) continue;
			let i = this.getLeadingWhitespaceCount(n);
			if (i === 0) return 0;
			n.length !== i && i < r && (r = i);
		}
		return r === Number.POSITIVE_INFINITY ? 0 : r;
	}
	dedentString(t) {
		let r = this.#t(t);
		return r === 0 ? t : t.split(`
`).map((n) => n.slice(r)).join(`
`);
	}
};
var P = new jt$1([
	"	",
	`
`,
	"\f",
	"\r",
	" "
]);
var Yt$1 = class extends Error {
	name = "UnexpectedNodeError";
	constructor(t, r, n = "type") {
		super(`Unexpected ${r} node ${n}: ${JSON.stringify(t[n])}.`), this.node = t;
	}
};
var Gr$1 = Yt$1;
function j$1(e, t = !0) {
	return [A([y$1, e]), t ? y$1 : ""];
}
function q$1(e, t) {
	let r = e.type === "NGRoot" ? e.node.type === "NGMicrosyntax" && e.node.body.length === 1 && e.node.body[0].type === "NGMicrosyntaxExpression" ? e.node.body[0].expression : e.node : e.type === "JsExpressionRoot" ? e.node : e;
	return r && (r.type === "ObjectExpression" || r.type === "ArrayExpression" || (t.parser === "__vue_expression" || t.parser === "__vue_ts_expression" || t.parser === "__ng_binding" || t.parser === "__ng_directive") && (r.type === "TemplateLiteral" || r.type === "StringLiteral"));
}
async function E(e, t, r, n) {
	r = {
		__isInHtmlAttribute: !0,
		__embeddedInHtml: !0,
		...r
	};
	let i = !0;
	n && (r.__onHtmlBindingRoot = (a, o) => {
		i = n(a, o);
	});
	let s = await t(e, r, t);
	return i ? C(s) : j$1(s);
}
function _s(e, t, r, n) {
	let { node: i } = r, s = n.originalText.slice(i.sourceSpan.start.offset, i.sourceSpan.end.offset);
	return /^\s*$/.test(s) ? "" : E(s, e, {
		parser: "__ng_directive",
		__isInHtmlAttribute: !1
	}, q$1);
}
var $r$1 = _s;
var Y$1 = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty);
var vs = Array.prototype.toReversed ?? function() {
	return [...this].reverse();
};
var jr$1 = ke$1("toReversed", function() {
	if (Array.isArray(this)) return vs;
});
function ks() {
	let e = globalThis, t = e.process?.platform;
	if (typeof t == "string") return t.startsWith("win");
	let r = e.Deno?.build?.os;
	return typeof r == "string" ? r === "windows" : e.navigator?.platform?.startsWith("Win") ?? !1;
}
var bs = ks();
function Yr$1(e) {
	if (e = e instanceof URL ? e : new URL(e), e.protocol !== "file:") throw new TypeError(`URL must be a file URL: received "${e.protocol}"`);
	return e;
}
function ws$1(e) {
	return e = Yr$1(e), decodeURIComponent(e.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function Ts(e) {
	e = Yr$1(e);
	let t = decodeURIComponent(e.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
	return e.hostname !== "" && (t = `\\\\${e.hostname}${t}`), t;
}
function Kt$1(e) {
	return bs ? Ts(e) : ws$1(e);
}
var Kr$1 = (e) => String(e).split(/[/\\]/).pop();
var Qr$1 = (e) => String(e).startsWith("file:");
function ys(e) {
	return Array.isArray(e) && e.length > 0;
}
var J = ys;
function Xr$1(e, t) {
	if (!t) return;
	let r = Kr$1(t).toLowerCase();
	return e.find(({ filenames: n }) => n?.some((i) => i.toLowerCase() === r)) ?? e.find(({ extensions: n }) => n?.some((i) => r.endsWith(i)));
}
function Es(e, t) {
	if (t) return e.find(({ name: r }) => r.toLowerCase() === t) ?? e.find(({ aliases: r }) => r?.includes(t)) ?? e.find(({ extensions: r }) => r?.includes(`.${t}`));
}
var xs = void 0;
function Jr$1(e, t) {
	if (t) {
		if (Qr$1(t)) try {
			t = Kt$1(t);
		} catch {
			return;
		}
		if (typeof t == "string") return e.find(({ isSupported: r }) => r?.({ filepath: t }));
	}
}
function Ls(e, t) {
	let r = jr$1(0, e.plugins).flatMap((i) => i.languages ?? []);
	return (Es(r, t.language) ?? Xr$1(r, t.physicalFile) ?? Xr$1(r, t.file) ?? Jr$1(r, t.physicalFile) ?? Jr$1(r, t.file) ?? xs?.(r, t.physicalFile))?.parsers[0];
}
var _t = Ls;
var St$1 = Symbol.for("PRETTIER_IS_FRONT_MATTER");
function As(e) {
	return !!e?.[St$1];
}
var ae$1 = As;
function Ps(e) {
	return T$1(0, e, /[^\n]/g, " ");
}
var vt$1 = Ps;
var Ue$1 = 3;
function Ns(e) {
	let t = e.slice(0, Ue$1);
	if (t !== "---" && t !== "+++") return;
	let r = e.indexOf(`
`, Ue$1);
	if (r === -1) return;
	let n = e.slice(Ue$1, r).trim(), i = e.indexOf(`
${t}`, r), s = n;
	if (s || (s = t === "+++" ? "toml" : "yaml"), i === -1 && t === "---" && s === "yaml" && (i = e.indexOf(`
...`, r)), i === -1) return;
	let a = i + 1 + Ue$1, o = e.charAt(a + 1);
	if (!/\s?/.test(o)) return;
	let l = e.slice(0, a), c;
	return {
		language: s,
		explicitLanguage: n || null,
		value: e.slice(r + 1, i),
		startDelimiter: t,
		endDelimiter: l.slice(-Ue$1),
		raw: l,
		start: {
			line: 1,
			column: 0,
			index: 0
		},
		end: {
			index: l.length,
			get line() {
				return c ?? (c = l.split(`
`)), c.length;
			},
			get column() {
				return c ?? (c = l.split(`
`)), I$2(0, c, -1).length;
			}
		},
		[St$1]: !0
	};
}
function Ds(e) {
	let t = Ns(e);
	return t ? {
		frontMatter: t,
		get content() {
			let { raw: r } = t;
			return vt$1(r) + e.slice(r.length);
		}
	} : { content: e };
}
var Qt$1 = Ds;
var Zr$1 = "inline";
var Xt$1 = {
	area: "none",
	base: "none",
	basefont: "none",
	datalist: "none",
	head: "none",
	link: "none",
	meta: "none",
	noembed: "none",
	noframes: "none",
	param: "block",
	rp: "none",
	script: "block",
	style: "none",
	template: "inline",
	title: "none",
	html: "block",
	body: "block",
	address: "block",
	blockquote: "block",
	center: "block",
	dialog: "block",
	div: "block",
	figure: "block",
	figcaption: "block",
	footer: "block",
	form: "block",
	header: "block",
	hr: "block",
	legend: "block",
	listing: "block",
	main: "block",
	p: "block",
	plaintext: "block",
	pre: "block",
	search: "block",
	xmp: "block",
	slot: "contents",
	ruby: "ruby",
	rt: "ruby-text",
	article: "block",
	aside: "block",
	h1: "block",
	h2: "block",
	h3: "block",
	h4: "block",
	h5: "block",
	h6: "block",
	hgroup: "block",
	nav: "block",
	section: "block",
	dir: "block",
	dd: "block",
	dl: "block",
	dt: "block",
	menu: "block",
	ol: "block",
	ul: "block",
	li: "list-item",
	table: "table",
	caption: "table-caption",
	colgroup: "table-column-group",
	col: "table-column",
	thead: "table-header-group",
	tbody: "table-row-group",
	tfoot: "table-footer-group",
	tr: "table-row",
	td: "table-cell",
	th: "table-cell",
	input: "inline-block",
	button: "inline-block",
	fieldset: "block",
	details: "block",
	summary: "block",
	marquee: "inline-block",
	option: "block",
	optgroup: "block",
	select: "inline-block",
	source: "block",
	track: "block",
	meter: "inline-block",
	progress: "inline-block",
	object: "inline-block",
	video: "inline-block",
	audio: "inline-block"
};
var en$1 = "normal";
var Jt$1 = {
	listing: "pre",
	plaintext: "pre",
	pre: "pre",
	xmp: "pre",
	nobr: "nowrap",
	table: "initial",
	textarea: "pre-wrap"
};
function Is(e) {
	return e.kind === "element" && !e.hasExplicitNamespace && !["html", "svg"].includes(e.namespace);
}
var oe$1 = Is;
var Rs = (e) => T$1(0, e, /^[\t\f\r ]*\n/g, "");
var Zt$1 = (e) => Rs(P.trimEnd(e));
var tn$1 = (e) => {
	let t = e, r = P.getLeadingWhitespace(t);
	r && (t = t.slice(r.length));
	let n = P.getTrailingWhitespace(t);
	return n && (t = t.slice(0, -n.length)), {
		leadingWhitespace: r,
		trailingWhitespace: n,
		text: t
	};
};
function Ct$1(e, t) {
	return !!(e.kind === "ieConditionalComment" && e.lastChild && !e.lastChild.isSelfClosing && !e.lastChild.endSourceSpan || e.kind === "ieConditionalComment" && !e.complete || K$1(e) && e.children.some((r) => r.kind !== "text" && r.kind !== "interpolation") || wt$1(e, t) && !O$1(e, t) && e.kind !== "interpolation");
}
function le$1(e) {
	return e.kind === "attribute" || !e.parent || !e.prev ? !1 : Os(e.prev);
}
function Os(e) {
	return e.kind === "comment" && e.value.trim() === "prettier-ignore";
}
function N$1(e) {
	return e.kind === "text" || e.kind === "comment";
}
function O$1(e, t) {
	return e.kind === "element" && (e.fullName === "script" || e.fullName === "style" || e.fullName === "svg:style" || e.fullName === "svg:script" || e.fullName === "mj-style" && t.parser === "mjml" || oe$1(e) && (e.name === "script" || e.name === "style"));
}
function rn$1(e, t) {
	return e.children && !O$1(e, t);
}
function nn$1(e, t) {
	return O$1(e, t) || e.kind === "interpolation" || er$1(e);
}
function er$1(e) {
	return dn$1(e).startsWith("pre");
}
function sn$1(e, t) {
	let r = n();
	if (r && !e.prev && e.parent?.tagDefinition?.ignoreFirstLf) return e.kind === "interpolation";
	return r;
	function n() {
		return ae$1(e) || e.kind === "angularControlFlowBlock" ? !1 : (e.kind === "text" || e.kind === "interpolation") && e.prev && (e.prev.kind === "text" || e.prev.kind === "interpolation") ? !0 : !e.parent || e.parent.cssDisplay === "none" ? !1 : K$1(e.parent) ? !0 : !(!e.prev && (e.parent.kind === "root" || K$1(e) && e.parent || O$1(e.parent, t) || Ge$1(e.parent, t) || !Vs(e.parent.cssDisplay)) || e.prev && !zs(e.prev.cssDisplay));
	}
}
function an$1(e, t) {
	return ae$1(e) || e.kind === "angularControlFlowBlock" ? !1 : (e.kind === "text" || e.kind === "interpolation") && e.next && (e.next.kind === "text" || e.next.kind === "interpolation") ? !0 : !e.parent || e.parent.cssDisplay === "none" ? !1 : K$1(e.parent) ? !0 : !(!e.next && (e.parent.kind === "root" || K$1(e) && e.parent || O$1(e.parent, t) || Ge$1(e.parent, t) || !Us(e.parent.cssDisplay)) || e.next && !Ws(e.next.cssDisplay));
}
function on$1(e, t) {
	return Gs(e.cssDisplay) && !O$1(e, t);
}
function We$1(e) {
	return ae$1(e) || e.next && e.sourceSpan.end && e.sourceSpan.end.line + 1 < e.next.sourceSpan.start.line;
}
function ln$1(e) {
	return tr$1(e) || e.kind === "element" && e.children.length > 0 && ([
		"body",
		"script",
		"style"
	].includes(e.name) || e.children.some((t) => Bs(t))) || e.firstChild && e.firstChild === e.lastChild && e.firstChild.kind !== "text" && un$1(e.firstChild) && (!e.lastChild.isTrailingSpaceSensitive || pn$1(e.lastChild));
}
function tr$1(e) {
	return e.kind === "element" && e.children.length > 0 && ([
		"html",
		"head",
		"ul",
		"ol",
		"select"
	].includes(e.name) || e.cssDisplay.startsWith("table") && e.cssDisplay !== "table-cell");
}
function kt$1(e) {
	return hn$1(e) || e.prev && Ms(e.prev) || cn$1(e);
}
function Ms(e) {
	return hn$1(e) || e.kind === "element" && e.fullName === "br" || cn$1(e);
}
function cn$1(e) {
	return un$1(e) && pn$1(e);
}
function un$1(e) {
	return e.hasLeadingSpaces && (e.prev ? e.prev.sourceSpan.end.line < e.sourceSpan.start.line : e.parent.kind === "root" || e.parent.startSourceSpan.end.line < e.sourceSpan.start.line);
}
function pn$1(e) {
	return e.hasTrailingSpaces && (e.next ? e.next.sourceSpan.start.line > e.sourceSpan.end.line : e.parent.kind === "root" || e.parent.endSourceSpan && e.parent.endSourceSpan.start.line > e.sourceSpan.end.line);
}
function hn$1(e) {
	switch (e.kind) {
		case "ieConditionalComment":
		case "comment":
		case "directive": return !0;
		case "element": return ["script", "select"].includes(e.name);
	}
	return !1;
}
function bt$1(e) {
	return e.lastChild ? bt$1(e.lastChild) : e;
}
function Bs(e) {
	return e.children?.some((t) => t.kind !== "text");
}
function mn$1(e) {
	if (e) switch (e) {
		case "module":
		case "text/javascript":
		case "text/babel":
		case "text/jsx":
		case "application/javascript": return "babel";
		case "application/x-typescript": return "typescript";
		case "text/markdown": return "markdown";
		case "text/html": return "html";
		case "text/x-handlebars-template": return "glimmer";
		default: if (e.endsWith("json") || e.endsWith("importmap") || e === "speculationrules") return "json";
	}
}
function qs(e, t) {
	let { name: r, attrMap: n } = e;
	if (r !== "script" || Y$1(n, "src")) return;
	let { type: i, lang: s } = e.attrMap;
	return !s && !i ? "babel" : _t(t, { language: s }) ?? mn$1(i);
}
function Hs(e, t) {
	if (!wt$1(e, t)) return;
	let { attrMap: r } = e;
	if (Y$1(r, "src")) return;
	let { type: n, lang: i } = r;
	return _t(t, { language: i }) ?? mn$1(n);
}
function Fs(e, t) {
	if (e.name === "style") {
		let { lang: r } = e.attrMap;
		return r ? _t(t, { language: r }) : "css";
	}
	if (e.name === "mj-style" && t.parser === "mjml") return "css";
}
function rr$1(e, t) {
	return qs(e, t) ?? Fs(e, t) ?? Hs(e, t);
}
function ze$1(e) {
	return e === "block" || e === "list-item" || e.startsWith("table");
}
function Vs(e) {
	return !ze$1(e) && e !== "inline-block";
}
function Us(e) {
	return !ze$1(e) && e !== "inline-block";
}
function Ws(e) {
	return !ze$1(e);
}
function zs(e) {
	return !ze$1(e);
}
function Gs(e) {
	return !ze$1(e) && e !== "inline-block";
}
function K$1(e) {
	return dn$1(e).startsWith("pre");
}
function $s(e, t) {
	let r = e;
	for (; r;) {
		if (t(r)) return !0;
		r = r.parent;
	}
	return !1;
}
function fn$1(e, t) {
	if (ce$1(e, t)) return "block";
	if (e.prev?.kind === "comment") {
		let n = e.prev.value.match(/^\s*display:\s*([a-z]+)\s*$/);
		if (n) return n[1];
	}
	let r = !1;
	if (e.kind === "element" && e.namespace === "svg") if ($s(e, (n) => n.fullName === "svg:foreignObject")) r = !0;
	else return e.name === "svg" ? "inline-block" : "block";
	switch (t.htmlWhitespaceSensitivity) {
		case "strict": return "inline";
		case "ignore": return "block";
		default: if (e.kind === "element" && (!e.namespace || r || oe$1(e)) && Y$1(Xt$1, e.name)) return Xt$1[e.name];
	}
	return Zr$1;
}
function dn$1(e) {
	return e.kind === "element" && (!e.namespace || oe$1(e)) && Y$1(Jt$1, e.name) ? Jt$1[e.name] : en$1;
}
function nr$1(e) {
	return T$1(0, T$1(0, e, "&apos;", "'"), "&quot;", "\"");
}
function w$1(e) {
	return nr$1(e.value);
}
var js = /* @__PURE__ */ new Set([
	"template",
	"style",
	"script"
]);
function Ge$1(e, t) {
	return ce$1(e, t) && !js.has(e.fullName);
}
function ce$1(e, t) {
	return t.parser === "vue" && e.kind === "element" && e.parent.kind === "root" && e.fullName.toLowerCase() !== "html";
}
function wt$1(e, t) {
	return ce$1(e, t) && (Ge$1(e, t) || e.attrMap.lang && e.attrMap.lang !== "html");
}
function gn$1(e) {
	let t = e.fullName;
	return t.charAt(0) === "#" || t === "slot-scope" || t === "v-slot" || t.startsWith("v-slot:");
}
function _n$1(e, t) {
	let r = e.parent;
	if (!ce$1(r, t)) return !1;
	let n = r.fullName, i = e.fullName;
	return n === "script" && i === "setup" || n === "style" && i === "vars";
}
function Tt$1(e, t = e.value) {
	return e.parent.isWhitespaceSensitive ? e.parent.isIndentationSensitive ? L$1(t) : L$1(P.dedentString(Zt$1(t)), k$1) : R$1(S$1, P.split(t));
}
function yt$1(e, t) {
	return ce$1(e, t) && e.name === "script";
}
function Ys(e) {
	let { valueSpan: t, value: r } = e;
	return t.end.offset - t.start.offset === r.length + 2;
}
function Et$1(e, t) {
	if (Ys(e)) return !1;
	let { value: r } = e;
	return /^PRETTIER_HTML_PLACEHOLDER_\d+_\d+_IN_JS$/.test(r) || t.parser === "lwc" && r.startsWith("{") && r.endsWith("}");
}
var Sn$1 = /\{\{(.+?)\}\}/s;
var vn$1 = ({ node: { value: e } }) => Sn$1.test(e);
async function Cn$1(e, t, r) {
	let n = w$1(r.node), i = [];
	for (let [s, a] of n.split(Sn$1).entries()) if (s % 2 === 0) i.push(L$1(a));
	else try {
		i.push(C([
			"{{",
			A([S$1, await E(a, e, {
				parser: "__ng_interpolation",
				__isInHtmlInterpolation: !0
			})]),
			S$1,
			"}}"
		]));
	} catch {
		i.push("{{", L$1(a), "}}");
	}
	return i;
}
var ir$1 = (e) => (t, r, n) => E(w$1(n.node), t, { parser: e }, q$1);
var Ks = [
	{
		test(e) {
			let t = e.node.fullName;
			return t.startsWith("(") && t.endsWith(")") || t.startsWith("on-");
		},
		print: ir$1("__ng_action")
	},
	{
		test(e) {
			let t = e.node.fullName;
			return t.startsWith("[") && t.endsWith("]") || /^bind(?:on)?-/.test(t) || /^ng-(?:if|show|hide|class|style)$/.test(t);
		},
		print: ir$1("__ng_binding")
	},
	{
		test: (e) => e.node.fullName.startsWith("*"),
		print: ir$1("__ng_directive")
	},
	{
		test: (e) => /^i18n(?:-.+)?$/.test(e.node.fullName),
		print: Qs
	},
	{
		test: vn$1,
		print: Cn$1
	}
].map(({ test: e, print: t }) => ({
	test: (r, n) => n.parser === "angular" && e(r),
	print: t
}));
function Qs(e, t, { node: r }) {
	let n = w$1(r);
	return j$1(gt$1(Tt$1(r, n.trim())), !n.includes("@@"));
}
var kn$1 = Ks;
var bn$1 = ({ node: e }, t) => !t.parentParser && e.fullName === "class" && !e.value.includes("{{");
var wn$1 = (e, t, r) => T$1(0, w$1(r.node).trim(), /\s+/g, " ");
var Js = /* @__PURE__ */ new Set([
	"onabort",
	"onafterprint",
	"onauxclick",
	"onbeforeinput",
	"onbeforematch",
	"onbeforeprint",
	"onbeforetoggle",
	"onbeforeunload",
	"onblur",
	"oncancel",
	"oncanplay",
	"oncanplaythrough",
	"onchange",
	"onclick",
	"onclose",
	"oncommand",
	"oncontextlost",
	"oncontextmenu",
	"oncontextrestored",
	"oncopy",
	"oncuechange",
	"oncut",
	"ondblclick",
	"ondrag",
	"ondragend",
	"ondragenter",
	"ondragleave",
	"ondragover",
	"ondragstart",
	"ondrop",
	"ondurationchange",
	"onemptied",
	"onended",
	"onerror",
	"onfocus",
	"onformdata",
	"onhashchange",
	"oninput",
	"oninvalid",
	"onkeydown",
	"onkeypress",
	"onkeyup",
	"onlanguagechange",
	"onload",
	"onloadeddata",
	"onloadedmetadata",
	"onloadstart",
	"onmessage",
	"onmessageerror",
	"onmousedown",
	"onmouseenter",
	"onmouseleave",
	"onmousemove",
	"onmouseout",
	"onmouseover",
	"onmouseup",
	"onoffline",
	"ononline",
	"onpagehide",
	"onpagereveal",
	"onpageshow",
	"onpageswap",
	"onpaste",
	"onpause",
	"onplay",
	"onplaying",
	"onpopstate",
	"onprogress",
	"onratechange",
	"onrejectionhandled",
	"onreset",
	"onresize",
	"onscroll",
	"onscrollend",
	"onsecuritypolicyviolation",
	"onseeked",
	"onseeking",
	"onselect",
	"onslotchange",
	"onstalled",
	"onstorage",
	"onsubmit",
	"onsuspend",
	"ontimeupdate",
	"ontoggle",
	"onunhandledrejection",
	"onunload",
	"onvolumechange",
	"onwaiting",
	"onwheel"
]);
var Tn$1 = ({ node: e }, t) => Js.has(e.fullName) && !t.parentParser && !e.value.includes("{{");
var yn$1 = (e, t, r) => E(w$1(r.node), e, {
	parser: "babel",
	__isHtmlInlineEventHandler: !0
}, () => !1);
function Zs(e) {
	let t = [];
	for (let r of e.split(";")) {
		if (r = P.trim(r), !r) continue;
		let [n, ...i] = P.split(r);
		t.push({
			name: n,
			value: i
		});
	}
	return t;
}
var En$1 = Zs;
var xn$1 = ({ node: e }, t) => e.fullName === "allow" && !t.parentParser && e.parent.fullName === "iframe" && !e.value.includes("{{");
function Ln$1(e, t, r) {
	let { node: n } = r, i = En$1(w$1(n));
	return i.length === 0 ? [""] : j$1(i.map(({ name: s, value: a }, o) => [[s, ...a].join(" "), o === i.length - 1 ? $$1(";") : [";", S$1]]));
}
function An$1(e) {
	return e === "	" || e === `
` || e === "\f" || e === "\r" || e === " ";
}
var ea = /^[ \t\n\r\u000c]+/;
var ta = /^[, \t\n\r\u000c]+/;
var ra = /^[^ \t\n\r\u000c]+/;
var na = /[,]+$/;
var Pn$1 = /^\d+$/;
var ia = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/;
function sa(e) {
	let t = e.length, r, n, i, s, a, o = 0, l;
	function c(h) {
		let f, g = h.exec(e.substring(o));
		if (g) return [f] = g, o += f.length, f;
	}
	let u = [];
	for (;;) {
		if (c(ta), o >= t) {
			if (u.length === 0) throw new Error("Must contain one or more image candidate strings.");
			return u;
		}
		l = o, r = c(ra), n = [], r.slice(-1) === "," ? (r = r.replace(na, ""), _()) : d();
	}
	function d() {
		for (c(ea), i = "", s = "in descriptor";;) {
			if (a = e.charAt(o), s === "in descriptor") if (An$1(a)) i && (n.push(i), i = "", s = "after descriptor");
			else if (a === ",") {
				o += 1, i && n.push(i), _();
				return;
			} else if (a === "(") i += a, s = "in parens";
			else if (a === "") {
				i && n.push(i), _();
				return;
			} else i += a;
			else if (s === "in parens") if (a === ")") i += a, s = "in descriptor";
			else if (a === "") {
				n.push(i), _();
				return;
			} else i += a;
			else if (s === "after descriptor" && !An$1(a)) if (a === "") {
				_();
				return;
			} else s = "in descriptor", o -= 1;
			o += 1;
		}
	}
	function _() {
		let h = !1, f, g, v, W, se = {}, X, at, Ce, Be, Ut;
		for (W = 0; W < n.length; W++) X = n[W], at = X[X.length - 1], Ce = X.substring(0, X.length - 1), Be = parseInt(Ce, 10), Ut = parseFloat(Ce), Pn$1.test(Ce) && at === "w" ? ((f || g) && (h = !0), Be === 0 ? h = !0 : f = Be) : ia.test(Ce) && at === "x" ? ((f || g || v) && (h = !0), Ut < 0 ? h = !0 : g = Ut) : Pn$1.test(Ce) && at === "h" ? ((v || g) && (h = !0), Be === 0 ? h = !0 : v = Be) : h = !0;
		if (!h) se.source = {
			value: r,
			startOffset: l
		}, f && (se.width = { value: f }), g && (se.density = { value: g }), v && (se.height = { value: v }), u.push(se);
		else throw new Error(`Invalid srcset descriptor found in "${e}" at "${X}".`);
	}
}
var Nn$1 = sa;
var Dn$1 = (e) => e.node.fullName === "srcset" && (e.parent.fullName === "img" || e.parent.fullName === "source");
var In$1 = {
	width: "w",
	height: "h",
	density: "x"
};
var aa = Object.keys(In$1);
function Rn$1(e, t, r) {
	let i = Nn$1(w$1(r.node)), s = aa.filter((h) => i.some((f) => Y$1(f, h)));
	if (s.length > 1) throw new Error("Mixed descriptor in srcset is not supported");
	let [a] = s, o = In$1[a], l = i.map((h) => h.source.value), c = Math.max(...l.map((h) => h.length)), u = i.map((h) => h[a] ? String(h[a].value) : ""), d = u.map((h) => {
		let f = h.indexOf(".");
		return f === -1 ? h.length : f;
	}), _ = Math.max(...d);
	return j$1(R$1([",", S$1], l.map((h, f) => {
		let g = [h], v = u[f];
		if (v) {
			let W = c - h.length + 1, se = _ - d[f], X = " ".repeat(W + se);
			g.push($$1(X, " "), v + o);
		}
		return g;
	})));
}
var On$1 = ({ node: e }, t) => e.fullName === "style" && !t.parentParser && !e.value.includes("{{");
var Mn$1 = async (e, t, r) => j$1(await e(w$1(r.node), {
	parser: "css",
	__isHTMLStyleAttribute: !0
}));
var oa = /* @__PURE__ */ new WeakMap();
function la(e, t) {
	return mt$1(oa, e.root, (r) => r.children.some((n) => yt$1(n, t) && ["ts", "typescript"].includes(n.attrMap.lang)));
}
var H$1 = la;
function Bn$1(e, t, r) {
	return E(`type T<${w$1(r.node)}> = any`, e, {
		parser: "babel-ts",
		__isEmbeddedTypescriptGenericParameters: !0
	}, q$1);
}
function qn$1(e, t, r, n) {
	let i = w$1(r.node), s = H$1(r, n) ? "babel-ts" : "babel";
	return E(`function _(${i}) {}`, e, {
		parser: s,
		__isVueBindings: !0
	});
}
async function Hn$1(e, t, r, n) {
	let { left: s, operator: a, right: o } = ca(w$1(r.node)), l = H$1(r, n);
	return [
		C(await E(`function _(${s}) {}`, e, {
			parser: l ? "babel-ts" : "babel",
			__isVueForBindingLeft: !0
		})),
		" ",
		a,
		" ",
		await E(o, e, { parser: l ? "__ts_expression" : "__js_expression" })
	];
}
function ca(e) {
	let r = e.match(/(.*?)\s+(in|of)\s+(.*)/s);
	if (!r) return;
	let n = { for: r[3].trim() };
	if (!n.for) return;
	let i = /,([^,\]}]*)(?:,([^,\]}]*))?$/, a = T$1(0, r[1].trim(), /^\(|\)$/g, ""), o = a.match(i);
	o ? (n.alias = a.replace(i, ""), n.iterator1 = o[1].trim(), o[2] && (n.iterator2 = o[2].trim())) : n.alias = a;
	let l = [
		n.alias,
		n.iterator1,
		n.iterator2
	];
	if (!l.some((c, u) => !c && (u === 0 || l.slice(u + 1).some(Boolean)))) return {
		left: l.filter(Boolean).join(","),
		operator: r[2],
		right: n.for
	};
}
var ua = [
	{
		test: (e) => e.node.fullName === "v-for",
		print: Hn$1
	},
	{
		test: (e, t) => e.node.fullName === "generic" && yt$1(e.parent, t),
		print: Bn$1
	},
	{
		test: ({ node: e }, t) => gn$1(e) || _n$1(e, t),
		print: qn$1
	},
	{
		test(e) {
			let t = e.node.fullName;
			return t.startsWith("@") || t.startsWith("v-on:");
		},
		print: pa
	},
	{
		test(e) {
			let t = e.node.fullName;
			return t.startsWith(":") || t.startsWith(".") || t.startsWith("v-bind:");
		},
		print: ha
	},
	{
		test: (e) => e.node.fullName.startsWith("v-"),
		print: Fn$1
	}
].map(({ test: e, print: t }) => ({
	test: (r, n) => n.parser === "vue" && e(r, n),
	print: t
}));
async function pa(e, t, r, n) {
	try {
		return await Fn$1(e, t, r, n);
	} catch (a) {
		if (a.cause?.code !== "BABEL_PARSER_SYNTAX_ERROR") throw a;
	}
	return E(w$1(r.node), e, { parser: H$1(r, n) ? "__vue_ts_event_binding" : "__vue_event_binding" }, q$1);
}
function ha(e, t, r, n) {
	return E(w$1(r.node), e, { parser: H$1(r, n) ? "__vue_ts_expression" : "__vue_expression" }, q$1);
}
function Fn$1(e, t, r, n) {
	return E(w$1(r.node), e, { parser: H$1(r, n) ? "__ts_expression" : "__js_expression" }, q$1);
}
var ma = [
	{
		test: Dn$1,
		print: Rn$1
	},
	{
		test: On$1,
		print: Mn$1
	},
	{
		test: Tn$1,
		print: yn$1
	},
	{
		test: bn$1,
		print: wn$1
	},
	{
		test: xn$1,
		print: Ln$1
	},
	...ua,
	...kn$1
].map(({ test: e, print: t }) => ({
	test: e,
	print: da(t)
}));
function fa(e, t) {
	let { node: r } = e, { value: n } = r;
	if (n) return Et$1(r, t) ? [
		r.rawName,
		"=",
		n
	] : ma.find(({ test: i }) => i(e, t))?.print;
}
function da(e) {
	return async (t, r, n, i) => {
		let s = await e(t, r, n, i);
		if (s) return s = Gt$1(s, (a) => typeof a == "string" ? T$1(0, a, "\"", "&quot;") : a), [
			n.node.rawName,
			"=\"",
			C(s),
			"\""
		];
	};
}
var Un$1 = fa;
var F = (e) => e.sourceSpan.start.offset;
var Z$1 = (e) => e.sourceSpan.end.offset;
function $e(e, t) {
	return [e.isSelfClosing ? "" : ga(e, t), ue$1(e, t)];
}
function ga(e, t) {
	return e.lastChild && Q$1(e.lastChild) ? "" : [_a$1(e, t), xt$1(e, t)];
}
function ue$1(e, t) {
	return (e.next ? V$2(e.next) : he$1(e.parent)) ? "" : [pe$1(e, t), M$1(e, t)];
}
function _a$1(e, t) {
	return he$1(e) ? pe$1(e.lastChild, t) : "";
}
function M$1(e, t) {
	return Q$1(e) ? xt$1(e.parent, t) : je$1(e) ? Lt$1(e.next, t) : "";
}
function xt$1(e, t) {
	if (zn$1(e, t)) return "";
	switch (e.kind) {
		case "ieConditionalComment": return "<!";
		case "element": if (e.hasHtmComponentClosingTag) return "<//";
		default: return `</${e.rawName}`;
	}
}
function pe$1(e, t) {
	if (zn$1(e, t)) return "";
	switch (e.kind) {
		case "ieConditionalComment":
		case "ieConditionalEndComment": return "[endif]-->";
		case "ieConditionalStartComment": return "]><!-->";
		case "interpolation": return "}}";
		case "angularIcuExpression": return "}";
		case "element": if (e.isSelfClosing) return "/>";
		default: return ">";
	}
}
function zn$1(e, t) {
	return !e.isSelfClosing && !e.endSourceSpan && (le$1(e) || Ct$1(e.parent, t));
}
function V$2(e) {
	return e.prev && e.prev.kind !== "docType" && e.kind !== "angularControlFlowBlock" && !N$1(e.prev) && e.isLeadingSpaceSensitive && !e.hasLeadingSpaces;
}
function he$1(e) {
	return e.lastChild?.isTrailingSpaceSensitive && !e.lastChild.hasTrailingSpaces && !N$1(bt$1(e.lastChild)) && !K$1(e);
}
function Q$1(e) {
	return !e.next && !e.hasTrailingSpaces && e.isTrailingSpaceSensitive && N$1(bt$1(e));
}
function je$1(e) {
	return e.next && !N$1(e.next) && N$1(e) && e.isTrailingSpaceSensitive && !e.hasTrailingSpaces;
}
function Sa(e) {
	let t = e.trim().match(/^prettier-ignore-attribute(?:\s+(.+))?$/s);
	return t ? t[1] ? t[1].split(/\s+/) : !0 : !1;
}
function Ye$1(e) {
	return !e.prev && e.isLeadingSpaceSensitive && !e.hasLeadingSpaces;
}
function va(e, t, r) {
	let { node: n } = e, { attrs: i = [], startTagComments: s = [] } = n;
	if (i.length === 0 && s.length === 0) return n.isSelfClosing ? " " : "";
	let a = n.prev?.kind === "comment" && Sa(n.prev.value), o = typeof a == "boolean" ? () => a : Array.isArray(a) ? (g) => a.includes(g.rawName) : () => !1, l = ["attrs", "startTagComments"].filter((g) => J(n[g])), c = l.flatMap((g) => e.map(({ node: v }) => ({
		loc: F(v),
		printed: v.kind === "attribute" && o(v) ? L$1(t.originalText.slice(F(v), Z$1(v))) : r()
	}), g));
	l.length > 1 && c.sort((g, v) => g.loc - v.loc);
	let u = n.kind === "element" && n.fullName === "script" && i.length === 1 && i[0].fullName === "src" && n.children.length === 0 && s.length === 0, d = s.some((g) => g.type === "single"), h = d || t.singleAttributePerLine && i.length > 1 && !ce$1(n, t) ? k$1 : S$1, f = [A([u ? " " : d ? k$1 : S$1, R$1(h, c.map(({ printed: g }) => g))])];
	return n.firstChild && Ye$1(n.firstChild) || n.isSelfClosing && he$1(n.parent) || u ? f.push(n.isSelfClosing ? " " : "") : f.push(t.bracketSameLine ? n.isSelfClosing ? " " : "" : n.isSelfClosing ? S$1 : y$1), f;
}
function Ca(e) {
	return e.firstChild && Ye$1(e.firstChild) ? "" : At$1(e);
}
function Ke$1(e, t, r) {
	let { node: n } = e;
	return [
		me$1(n, t),
		va(e, t, r),
		n.isSelfClosing ? "" : Ca(n)
	];
}
function me$1(e, t) {
	return e.prev && je$1(e.prev) ? "" : [B(e, t), Lt$1(e, t)];
}
function B(e, t) {
	return Ye$1(e) ? At$1(e.parent) : V$2(e) ? pe$1(e.prev, t) : "";
}
var Wn$1 = "<!doctype";
function Lt$1(e, t) {
	switch (e.kind) {
		case "ieConditionalComment":
		case "ieConditionalStartComment": return `<!--[if ${e.condition}`;
		case "ieConditionalEndComment": return "<!--<!";
		case "interpolation": return "{{";
		case "docType": {
			if (e.value === "html") {
				let { filepath: n } = t;
				if (n && /\.html?$/.test(n)) return Wn$1;
			}
			let r = F(e);
			return t.originalText.slice(r, r + Wn$1.length);
		}
		case "angularIcuExpression": return "{";
		case "element": if (e.condition) return `<!--[if ${e.condition}]><!--><${e.rawName}`;
		default: return `<${e.rawName}`;
	}
}
function At$1(e) {
	switch (e.kind) {
		case "ieConditionalComment": return "]>";
		case "element": if (e.condition) return "><!--<![endif]-->";
		default: return ">";
	}
}
function ka(e, t) {
	if (!e.endSourceSpan) return "";
	let r = e.startSourceSpan.end.offset;
	e.firstChild && Ye$1(e.firstChild) && (r -= At$1(e).length);
	let n = e.endSourceSpan.start.offset;
	return e.lastChild && Q$1(e.lastChild) ? n += xt$1(e, t).length : he$1(e) && (n -= pe$1(e.lastChild, t).length), t.originalText.slice(r, n);
}
var Pt$1 = ka;
var ba = /* @__PURE__ */ new Set([
	"if",
	"else if",
	"for",
	"switch",
	"case"
]);
function wa(e, t) {
	let { node: r } = e;
	switch (r.kind) {
		case "element":
			if (O$1(r, t) || r.kind === "interpolation") return;
			if (!r.isSelfClosing && wt$1(r, t)) {
				let n = rr$1(r, t);
				return n ? async (i, s) => {
					let a = Pt$1(r, t), o = /^\s*$/.test(a), l = "";
					return o || (l = await i(Zt$1(a), {
						parser: n,
						__embeddedInHtml: !0
					}), o = l === ""), [
						B(r, t),
						C(Ke$1(e, t, s)),
						o ? "" : k$1,
						l,
						o ? "" : k$1,
						$e(r, t),
						M$1(r, t)
					];
				} : void 0;
			}
			break;
		case "text":
			if (O$1(r.parent, t)) {
				let n = rr$1(r.parent, t);
				if (n) return async (i) => {
					let s = n === "markdown" ? P.dedentString(r.value.replace(/^[^\S\n]*\n/, "")) : r.value, a = {
						parser: n,
						__embeddedInHtml: !0
					};
					if (t.parser === "html" && n === "babel") {
						let o = "script", { attrMap: l } = r.parent;
						l && (l.type === "module" || (l.type === "text/babel" || l.type === "text/jsx") && l["data-type"] === "module") && (o = "module"), a.__babelSourceType = o;
					}
					return [
						G$1,
						B(r, t),
						await i(s, a),
						M$1(r, t)
					];
				};
			} else if (r.parent.kind === "interpolation") return async (n) => {
				let i = {
					__isInHtmlInterpolation: !0,
					__embeddedInHtml: !0
				};
				return t.parser === "angular" ? i.parser = "__ng_interpolation" : t.parser === "vue" ? i.parser = H$1(e, t) ? "__vue_ts_expression" : "__vue_expression" : i.parser = "__js_expression", [A([S$1, await n(r.value, i)]), r.parent.next && V$2(r.parent.next) ? " " : S$1];
			};
			break;
		case "attribute": return Un$1(e, t);
		case "angularControlFlowBlockParameters": return ba.has(e.parent.name) ? $r$1 : void 0;
		case "angularLetDeclarationInitializer": return (n) => E(r.value, n, {
			parser: "__ng_binding",
			__isInHtmlAttribute: !1
		});
	}
}
var Gn$1 = wa;
var Qe$1 = null;
function Xe$1(e) {
	if (Qe$1 !== null && typeof Qe$1.property) {
		let t = Qe$1;
		return Qe$1 = Xe$1.prototype = null, t;
	}
	return Qe$1 = Xe$1.prototype = e ?? Object.create(null), new Xe$1();
}
var Ta = 10;
for (let e = 0; e <= Ta; e++) Xe$1();
function ar$1(e) {
	return Xe$1(e);
}
function ya(e, t = "type") {
	ar$1(e);
	function r(n) {
		let i = n[t], s = e[i];
		if (!Array.isArray(s)) throw Object.assign(/* @__PURE__ */ new Error(`Missing visitor keys for '${i}'.`), { node: n });
		return s;
	}
	return r;
}
var $n$1 = ya;
var Je$1 = [["children"]];
var Yn$1 = $n$1({
	root: Je$1[0],
	element: [
		"attrs",
		"startTagComments",
		"children"
	],
	ieConditionalComment: Je$1[0],
	ieConditionalStartComment: [],
	ieConditionalEndComment: [],
	interpolation: Je$1[0],
	text: Je$1[0],
	docType: [],
	comment: [],
	attribute: [],
	startTagComment: [],
	cdata: [],
	angularControlFlowBlock: ["children", "parameters"],
	angularControlFlowBlockParameters: Je$1[0],
	angularControlFlowBlockParameter: [],
	angularLetDeclaration: ["init"],
	angularLetDeclarationInitializer: [],
	angularIcuExpression: ["cases"],
	angularIcuCase: ["expression"]
}, "kind");
var xa = /* @__PURE__ */ new Set([
	"sourceSpan",
	"startSourceSpan",
	"endSourceSpan",
	"nameSpan",
	"valueSpan",
	"keySpan",
	"tagDefinition",
	"tokens",
	"valueTokens",
	"switchValueSourceSpan",
	"expSourceSpan",
	"valueSourceSpan"
]);
var La = /* @__PURE__ */ new Set([
	"if",
	"else if",
	"for",
	"switch",
	"case"
]);
function or$1(e, t, r) {
	if (e.kind === "text" || e.kind === "comment") return null;
	if (e.kind === "yaml" && delete t.value, e.kind === "attribute") {
		let { fullName: n, value: i } = e;
		n === "style" || n === "class" || n === "srcset" && (r.fullName === "img" || r.fullName === "source") || n === "allow" && r.fullName === "iframe" || n.startsWith("on") || n.startsWith("@") || n.startsWith(":") || n.startsWith(".") || n.startsWith("#") || n.startsWith("v-") || n === "vars" && r.fullName === "style" || (n === "setup" || n === "generic") && r.fullName === "script" || n === "slot-scope" || n.startsWith("(") || n.startsWith("[") || n.startsWith("*") || n.startsWith("bind") || n.startsWith("i18n") || n.startsWith("on-") || n.startsWith("ng-") || i?.includes("{{") ? delete t.value : i && (t.value = T$1(0, i, /'|&quot;|&apos;/g, "\""));
	}
	if (e.kind === "docType" && (t.value = T$1(0, e.value.toLowerCase(), /\s+/g, " ")), e.kind === "angularControlFlowBlock" && e.parameters?.children) for (let n of t.parameters.children) La.has(e.name) ? delete n.expression : n.expression = n.expression.trim();
	e.kind === "angularIcuExpression" && (t.switchValue = e.switchValue.trim()), e.kind === "angularLetDeclarationInitializer" && delete t.value, e.kind === "element" && e.isVoid && !e.isSelfClosing && (t.isSelfClosing = !0);
}
or$1.ignoredProperties = xa;
var Kn$1 = "format";
var Qn$1 = /^\s*<!--\s*@(?:noformat|noprettier)\s*-->/;
var Xn$1 = /^\s*<!--\s*@(?:format|prettier)\s*-->/;
var Jn$1 = (e) => Xn$1.test(e);
var Zn$1 = (e) => Qn$1.test(e);
var ei = (e) => `<!-- @${Kn$1} -->

${e}`;
var ti$1 = /* @__PURE__ */ new Map([
	["if", /* @__PURE__ */ new Set(["else if", "else"])],
	["else if", /* @__PURE__ */ new Set(["else if", "else"])],
	["for", /* @__PURE__ */ new Set(["empty"])],
	["defer", /* @__PURE__ */ new Set([
		"placeholder",
		"error",
		"loading"
	])],
	["placeholder", /* @__PURE__ */ new Set([
		"placeholder",
		"error",
		"loading"
	])],
	["error", /* @__PURE__ */ new Set([
		"placeholder",
		"error",
		"loading"
	])],
	["loading", /* @__PURE__ */ new Set([
		"placeholder",
		"error",
		"loading"
	])],
	["boundary", /* @__PURE__ */ new Set(["error"])]
]);
function ri$1(e) {
	let t = Z$1(e);
	return e.kind === "element" && !e.endSourceSpan && J(e.children) ? Math.max(t, ri$1(I$2(0, e.children, -1))) : t;
}
function Ze$1(e, t, r) {
	let n = e.node;
	if (le$1(n)) {
		let i = ri$1(n);
		return [
			B(n, t),
			L$1(P.trimEnd(t.originalText.slice(F(n) + (n.prev && je$1(n.prev) ? Lt$1(n).length : 0), i - (n.next && V$2(n.next) ? pe$1(n, t).length : 0)))),
			M$1(n, t)
		];
	}
	return r();
}
function Nt$1(e, t) {
	return N$1(e) && N$1(t) ? e.isTrailingSpaceSensitive ? e.hasTrailingSpaces ? kt$1(t) ? k$1 : S$1 : "" : kt$1(t) ? k$1 : y$1 : je$1(e) && (le$1(t) || t.firstChild || t.isSelfClosing || t.kind === "element" && t.attrs.length > 0) || e.kind === "element" && e.isSelfClosing && V$2(t) ? "" : t.kind === "comment" && t.isLeadingSpaceSensitive && !t.hasLeadingSpaces ? y$1 : !t.isLeadingSpaceSensitive || kt$1(t) || V$2(t) && e.lastChild && Q$1(e.lastChild) && e.lastChild.lastChild && Q$1(e.lastChild.lastChild) ? k$1 : t.hasLeadingSpaces ? S$1 : y$1;
}
function Ae$1(e, t, r) {
	let { node: n } = e;
	if (tr$1(n)) return [G$1, ...e.map(() => {
		let s = e.node, a = s.prev ? Nt$1(s.prev, s) : "";
		return [a ? [a, We$1(s.prev) ? k$1 : ""] : "", Ze$1(e, t, r)];
	}, "children")];
	let i = n.children.map(() => Symbol(""));
	return e.map(({ node: s, index: a }) => {
		if (N$1(s)) {
			if (s.prev && N$1(s.prev)) {
				let h = Nt$1(s.prev, s);
				if (h) return We$1(s.prev) ? [
					k$1,
					k$1,
					Ze$1(e, t, r)
				] : [h, Ze$1(e, t, r)];
			}
			return Ze$1(e, t, r);
		}
		let o = [], l = [], c = [], u = [], d = s.prev ? Nt$1(s.prev, s) : "", _ = s.next ? Nt$1(s, s.next) : "";
		return d && (We$1(s.prev) ? o.push(k$1, k$1) : d === k$1 ? o.push(k$1) : N$1(s.prev) ? l.push(d) : l.push($$1("", y$1, { groupId: i[a - 1] }))), _ && (We$1(s) ? N$1(s.next) && u.push(k$1, k$1) : _ === k$1 ? N$1(s.next) && u.push(k$1) : c.push(_)), [
			...o,
			C([...l, C([Ze$1(e, t, r), ...c], { id: i[a] })]),
			...u
		];
	}, "children");
}
function ni$1(e, t, r) {
	let { node: n } = e, i = [];
	Da(e) && i.push("} "), i.push("@", n.name);
	let s = Pa(n);
	if (n.parameters && (s || i.push(" "), i.push("(", C(r("parameters")), ")")), s) return i.push(";"), i;
	if (!Na(n)) {
		i.push(" {");
		let a = ii$1(n);
		n.children.length > 0 ? (n.firstChild.hasLeadingSpaces = !0, n.lastChild.hasTrailingSpaces = !0, i.push(A([k$1, Ae$1(e, t, r)])), a && i.push(k$1, "}")) : a && i.push("}");
	}
	return C(i, { shouldBreak: !0 });
}
function ii$1(e) {
	return !(e.next?.kind === "angularControlFlowBlock" && ti$1.get(e.name)?.has(e.next.name));
}
var Aa = (e) => e?.kind === "angularControlFlowBlock" && (e.name === "case" || e.name === "default");
var Pa = (e) => e?.kind === "angularControlFlowBlock" && e.name === "default never";
function Na(e) {
	return Aa(e) && e.endSourceSpan && e.endSourceSpan.start.offset === e.endSourceSpan.end.offset;
}
function Da(e) {
	let { previous: t } = e;
	return t?.kind === "angularControlFlowBlock" && !le$1(t) && !ii$1(t);
}
function si$1(e, t, r) {
	return [A([y$1, R$1([";", S$1], e.map(r, "children"))]), y$1];
}
function ai$1(e, t, r) {
	let { node: n } = e;
	return [
		me$1(n, t),
		C([
			n.switchValue.trim(),
			", ",
			n.type,
			n.cases.length > 0 ? [",", A([S$1, R$1(S$1, e.map(r, "cases"))])] : "",
			y$1
		]),
		ue$1(n, t)
	];
}
function oi$1(e, t, r) {
	let { node: n } = e;
	return [
		n.value,
		" {",
		C([A([y$1, e.map(({ node: i, isLast: s }) => {
			let a = [r()];
			return i.kind === "text" && (i.hasLeadingSpaces && a.unshift(S$1), i.hasTrailingSpaces && !s && a.push(S$1)), a;
		}, "expression")]), y$1]),
		"}"
	];
}
function li$1(e, t, r) {
	let { node: n } = e;
	if (Ct$1(n, t)) return [
		B(n, t),
		C(Ke$1(e, t, r)),
		L$1(Pt$1(n, t)),
		...$e(n, t),
		M$1(n, t)
	];
	let i = n.children.length === 1 && (n.firstChild.kind === "interpolation" || n.firstChild.kind === "angularIcuExpression") && n.firstChild.isLeadingSpaceSensitive && !n.firstChild.hasLeadingSpaces && n.lastChild.isTrailingSpaceSensitive && !n.lastChild.hasTrailingSpaces, s = Symbol("element-attr-group-id"), a = (u) => C([
		C(Ke$1(e, t, r), { id: s }),
		u,
		$e(n, t)
	]);
	if (n.children.length === 0) return a(n.hasDanglingSpaces && n.isDanglingSpaceSensitive ? S$1 : "");
	let o = (u) => i ? Fr$1(u, { groupId: s }) : (O$1(n, t) || Ge$1(n, t)) && n.parent.kind === "root" && t.parser === "vue" && !t.vueIndentScriptAndStyle ? u : A(u), l = () => i ? $$1(y$1, "", { groupId: s }) : n.firstChild.hasLeadingSpaces && n.firstChild.isLeadingSpaceSensitive ? S$1 : n.firstChild.kind === "text" && n.isWhitespaceSensitive && n.isIndentationSensitive ? Hr$1(y$1) : y$1, c = () => (n.next ? V$2(n.next) : he$1(n.parent)) ? n.lastChild.hasTrailingSpaces && n.lastChild.isTrailingSpaceSensitive ? " " : "" : K$1(n) && Q$1(n.lastChild) ? "" : i ? $$1(y$1, "", { groupId: s }) : n.lastChild.hasTrailingSpaces && n.lastChild.isTrailingSpaceSensitive ? S$1 : (n.lastChild.kind === "comment" || n.lastChild.kind === "text" && n.isWhitespaceSensitive && n.isIndentationSensitive) && new RegExp(`\\n[\\t ]{${t.tabWidth * (e.ancestors.length - 1)}}$`).test(n.lastChild.value) ? "" : y$1;
	return a([
		ln$1(n) ? G$1 : "",
		o([l(), Ae$1(e, t, r)]),
		c()
	]);
}
function ci$1(e) {
	let { node: { value: t, type: r } } = e;
	return r === "single" ? `//${t.trimEnd()}` : [
		"/*",
		L$1(t),
		"*/"
	];
}
var lr = (function(e) {
	return e[e.RAW_TEXT = 0] = "RAW_TEXT", e[e.ESCAPABLE_RAW_TEXT = 1] = "ESCAPABLE_RAW_TEXT", e[e.PARSABLE_DATA = 2] = "PARSABLE_DATA", e;
})({});
function ee$1(e, t = !0) {
	if (e[0] != ":") return [null, e];
	let r = e.indexOf(":", 1);
	if (r === -1) {
		if (t) throw new Error(`Unsupported format "${e}" expecting ":namespace:name"`);
		return [null, e];
	}
	return [e.slice(1, r), e.slice(r + 1)];
}
function cr$1(e) {
	return ee$1(e)[1] === "ng-container";
}
function ur$1(e) {
	return ee$1(e)[1] === "ng-content";
}
function Pe$1(e) {
	return e === null ? null : ee$1(e)[0];
}
function fe$1(e, t) {
	return e ? `:${e}:${t}` : t;
}
var et$1;
var Ia = "math";
var pr$1 = () => Object.create(null);
function Ra() {
	return et$1 || (et$1 = pr$1(), te$1(1, void 0, [["iframe", ["srcdoc"]], ["*", ["innerHTML", "outerHTML"]]]), te$1(2, void 0, [["*", ["style"]]]), te$1(4, void 0, [
		["*", ["formAction"]],
		["area", ["href"]],
		["a", ["href", "xlink:href"]],
		["form", ["action"]],
		["img", ["src"]],
		["video", ["src"]]
	]), te$1(4, Ia, [["*", ["href", "xlink:href"]]]), te$1(5, void 0, [
		["base", ["href"]],
		["embed", ["src"]],
		["frame", ["src"]],
		["iframe", ["src"]],
		["link", ["href"]],
		["object", ["codebase", "data"]]
	]), te$1(4, "svg", [["a", ["href", "xlink:href"]]]), te$1(6, "svg", [
		["animate", [
			"attributeName",
			"values",
			"to",
			"from"
		]],
		["set", ["to", "attributeName"]],
		["animateMotion", ["attributeName"]],
		["animateTransform", ["attributeName"]]
	]), te$1(6, void 0, [["unknown", [
		"attributeName",
		"values",
		"to",
		"from",
		"sandbox",
		"allow",
		"allowFullscreen",
		"referrerPolicy",
		"csp",
		"fetchPriority",
		"credentialless"
	]], ["iframe", [
		"sandbox",
		"allow",
		"allowFullscreen",
		"referrerPolicy",
		"csp",
		"fetchPriority",
		"credentialless"
	]]]), et$1);
}
function te$1(e, t, r) {
	let n = t ?? "";
	for (let [s, a] of r) {
		let o = s.toLowerCase();
		for (let l of a) {
			var i;
			let c = l.toLowerCase(), u = (i = et$1)[c] ?? (i[c] = pr$1()), d = u[n] ?? (u[n] = pr$1());
			d[o] = e;
		}
	}
}
function ui$1(e, t, r) {
	let n = Ra()[t.toLowerCase()];
	if (!n) return 0;
	let i = e.toLowerCase(), s;
	if (r) {
		let a = n[r];
		a && (s = a[i] ?? a["*"]);
	}
	if (s === void 0) {
		let a = n[""];
		a && (s = a[i] ?? a["*"]);
	}
	if (s === void 0 && (!r || r === "")) {
		let a = n.svg;
		a && (s = a[i]);
	}
	return s ?? 0;
}
var hr$1 = { name: "custom-elements" };
var mr = { name: "no-errors-schema" };
var Oa = /-+([a-z0-9])/g;
function pi(e) {
	return e.replace(Oa, (...t) => t[1].toUpperCase());
}
var hi$1 = class {};
var Ma = "boolean";
var Ba = "number";
var qa = "string";
var Ha = "object";
function Dt$1(e) {
	let [r, n] = ee$1(e.toLowerCase(), !1);
	return r === "svg" || r === "math" ? `:${r}:${n}` : n;
}
var Fa = [
	"[Element]|textContent,%ariaActiveDescendantElement,%ariaAtomic,%ariaAutoComplete,%ariaBusy,%ariaChecked,%ariaColCount,%ariaColIndex,%ariaColIndexText,%ariaColSpan,%ariaControlsElements,%ariaCurrent,%ariaDescribedByElements,%ariaDescription,%ariaDetailsElements,%ariaDisabled,%ariaErrorMessageElements,%ariaExpanded,%ariaFlowToElements,%ariaHasPopup,%ariaHidden,%ariaInvalid,%ariaKeyShortcuts,%ariaLabel,%ariaLabelledByElements,%ariaLevel,%ariaLive,%ariaModal,%ariaMultiLine,%ariaMultiSelectable,%ariaOrientation,%ariaOwnsElements,%ariaPlaceholder,%ariaPosInSet,%ariaPressed,%ariaReadOnly,%ariaRelevant,%ariaRequired,%ariaRoleDescription,%ariaRowCount,%ariaRowIndex,%ariaRowIndexText,%ariaRowSpan,%ariaSelected,%ariaSetSize,%ariaSort,%ariaValueMax,%ariaValueMin,%ariaValueNow,%ariaValueText,%classList,className,elementTiming,id,innerHTML,*beforecopy,*beforecut,*beforepaste,*fullscreenchange,*fullscreenerror,*search,*webkitfullscreenchange,*webkitfullscreenerror,outerHTML,%part,#scrollLeft,#scrollTop,slot,*message,*mozfullscreenchange,*mozfullscreenerror,*mozpointerlockchange,*mozpointerlockerror,*webglcontextcreationerror,*webglcontextlost,*webglcontextrestored",
	"[HTMLElement]^[Element]|accessKey,autocapitalize,!autofocus,contentEditable,dir,!draggable,enterKeyHint,!hidden,!inert,innerText,inputMode,lang,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,outerText,!spellcheck,%style,#tabIndex,title,!translate,virtualKeyboardPolicy",
	"abbr,address,article,aside,b,bdi,bdo,cite,content,code,dd,dfn,dt,em,figcaption,figure,footer,header,hgroup,i,kbd,main,mark,nav,noscript,rb,rp,rt,rtc,ruby,s,samp,search,section,small,strong,sub,sup,u,var,wbr^[HTMLElement]|accessKey,autocapitalize,!autofocus,contentEditable,dir,!draggable,enterKeyHint,!hidden,innerText,inputMode,lang,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,outerText,!spellcheck,%style,#tabIndex,title,!translate,virtualKeyboardPolicy",
	"media^[HTMLElement]|!autoplay,!controls,%controlsList,%crossOrigin,#currentTime,!defaultMuted,#defaultPlaybackRate,!disableRemotePlayback,!loop,!muted,*encrypted,*waitingforkey,#playbackRate,preload,!preservesPitch,src,%srcObject,#volume",
	":svg:^[HTMLElement]|!autofocus,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,%style,#tabIndex",
	":svg:graphics^:svg:|",
	":svg:animation^:svg:|*begin,*end,*repeat",
	":svg:geometry^:svg:|",
	":svg:componentTransferFunction^:svg:|",
	":svg:gradient^:svg:|",
	":svg:textContent^:svg:graphics|",
	":svg:textPositioning^:svg:textContent|",
	"a^[HTMLElement]|charset,coords,download,hash,host,hostname,href,hreflang,name,password,pathname,ping,port,protocol,referrerPolicy,rel,%relList,rev,search,shape,target,text,type,username",
	"area^[HTMLElement]|alt,coords,download,hash,host,hostname,href,!noHref,password,pathname,ping,port,protocol,referrerPolicy,rel,%relList,search,shape,target,username",
	"audio^media|",
	"br^[HTMLElement]|clear",
	"base^[HTMLElement]|href,target",
	"body^[HTMLElement]|aLink,background,bgColor,link,*afterprint,*beforeprint,*beforeunload,*blur,*error,*focus,*hashchange,*languagechange,*load,*message,*messageerror,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandled,*resize,*scroll,*storage,*unhandledrejection,*unload,text,vLink",
	"button^[HTMLElement]|!disabled,formAction,formEnctype,formMethod,!formNoValidate,formTarget,name,type,value",
	"canvas^[HTMLElement]|#height,#width",
	"content^[HTMLElement]|select",
	"dl^[HTMLElement]|!compact",
	"data^[HTMLElement]|value",
	"datalist^[HTMLElement]|",
	"details^[HTMLElement]|!open",
	"dialog^[HTMLElement]|!open,returnValue",
	"dir^[HTMLElement]|!compact",
	"div^[HTMLElement]|align",
	"embed^[HTMLElement]|align,height,name,src,type,width",
	"fieldset^[HTMLElement]|!disabled,name",
	"font^[HTMLElement]|color,face,size",
	"form^[HTMLElement]|acceptCharset,action,autocomplete,encoding,enctype,method,name,!noValidate,target",
	"frame^[HTMLElement]|frameBorder,longDesc,marginHeight,marginWidth,name,!noResize,scrolling,src",
	"frameset^[HTMLElement]|cols,*afterprint,*beforeprint,*beforeunload,*blur,*error,*focus,*hashchange,*languagechange,*load,*message,*messageerror,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandled,*resize,*scroll,*storage,*unhandledrejection,*unload,rows",
	"geolocation^[HTMLElement]|accuracymode,!autolocate,*location,*promptaction,*promptdismiss,*validationstatuschange,!watch",
	"hr^[HTMLElement]|align,color,!noShade,size,width",
	"head^[HTMLElement]|",
	"h1,h2,h3,h4,h5,h6^[HTMLElement]|align",
	"html^[HTMLElement]|version",
	"iframe^[HTMLElement]|align,allow,!allowFullscreen,!allowPaymentRequest,csp,!credentialless,frameBorder,height,loading,longDesc,marginHeight,marginWidth,name,referrerPolicy,%sandbox,scrolling,src,srcdoc,width",
	"img^[HTMLElement]|align,alt,border,%crossOrigin,decoding,#height,#hspace,!isMap,loading,longDesc,lowsrc,name,referrerPolicy,sizes,src,srcset,useMap,#vspace,#width",
	"input^[HTMLElement]|accept,align,alt,autocomplete,!checked,!defaultChecked,defaultValue,dirName,!disabled,%files,formAction,formEnctype,formMethod,!formNoValidate,formTarget,#height,!incremental,!indeterminate,max,#maxLength,min,#minLength,!multiple,name,pattern,placeholder,!readOnly,!required,selectionDirection,#selectionEnd,#selectionStart,#size,src,step,type,useMap,value,%valueAsDate,#valueAsNumber,#width",
	"li^[HTMLElement]|type,#value",
	"label^[HTMLElement]|htmlFor",
	"legend^[HTMLElement]|align",
	"link^[HTMLElement]|as,charset,%crossOrigin,!disabled,href,hreflang,imageSizes,imageSrcset,integrity,media,referrerPolicy,rel,%relList,rev,%sizes,target,type",
	"map^[HTMLElement]|name",
	"marquee^[HTMLElement]|behavior,bgColor,direction,height,#hspace,#loop,#scrollAmount,#scrollDelay,!trueSpeed,#vspace,width",
	"menu^[HTMLElement]|!compact",
	"meta^[HTMLElement]|content,httpEquiv,media,name,scheme",
	"meter^[HTMLElement]|#high,#low,#max,#min,#optimum,#value",
	"ins,del^[HTMLElement]|cite,dateTime",
	"ol^[HTMLElement]|!compact,!reversed,#start,type",
	"object^[HTMLElement]|align,archive,border,code,codeBase,codeType,data,!declare,height,#hspace,name,standby,type,useMap,#vspace,width",
	"optgroup^[HTMLElement]|!disabled,label",
	"option^[HTMLElement]|!defaultSelected,!disabled,label,!selected,text,value",
	"output^[HTMLElement]|defaultValue,%htmlFor,name,value",
	"p^[HTMLElement]|align",
	"param^[HTMLElement]|name,type,value,valueType",
	"picture^[HTMLElement]|",
	"pre^[HTMLElement]|#width",
	"progress^[HTMLElement]|#max,#value",
	"q,blockquote,cite^[HTMLElement]|",
	"script^[HTMLElement]|!async,charset,%crossOrigin,!defer,event,htmlFor,integrity,!noModule,%referrerPolicy,src,text,type",
	"select^[HTMLElement]|autocomplete,!disabled,#length,!multiple,name,!required,#selectedIndex,#size,value",
	"selectedcontent^[HTMLElement]|",
	"slot^[HTMLElement]|name",
	"source^[HTMLElement]|#height,media,sizes,src,srcset,type,#width",
	"span^[HTMLElement]|",
	"style^[HTMLElement]|!disabled,media,type",
	"search^[HTMLELement]|",
	"caption^[HTMLElement]|align",
	"th,td^[HTMLElement]|abbr,align,axis,bgColor,ch,chOff,#colSpan,headers,height,!noWrap,#rowSpan,scope,vAlign,width",
	"col,colgroup^[HTMLElement]|align,ch,chOff,#span,vAlign,width",
	"table^[HTMLElement]|align,bgColor,border,%caption,cellPadding,cellSpacing,frame,rules,summary,%tFoot,%tHead,width",
	"tr^[HTMLElement]|align,bgColor,ch,chOff,vAlign",
	"tfoot,thead,tbody^[HTMLElement]|align,ch,chOff,vAlign",
	"template^[HTMLElement]|",
	"textarea^[HTMLElement]|autocomplete,#cols,defaultValue,dirName,!disabled,#maxLength,#minLength,name,placeholder,!readOnly,!required,#rows,selectionDirection,#selectionEnd,#selectionStart,value,wrap",
	"time^[HTMLElement]|dateTime",
	"title^[HTMLElement]|text",
	"track^[HTMLElement]|!default,kind,label,src,srclang",
	"ul^[HTMLElement]|!compact,type",
	"unknown^[HTMLElement]|",
	"video^media|!disablePictureInPicture,#height,*enterpictureinpicture,*leavepictureinpicture,!playsInline,poster,#width",
	":svg:a^:svg:graphics|",
	":svg:animate^:svg:animation|",
	":svg:animateMotion^:svg:animation|",
	":svg:animateTransform^:svg:animation|",
	":svg:circle^:svg:geometry|",
	":svg:clipPath^:svg:graphics|",
	":svg:defs^:svg:graphics|",
	":svg:desc^:svg:|",
	":svg:discard^:svg:|",
	":svg:ellipse^:svg:geometry|",
	":svg:feBlend^:svg:|",
	":svg:feColorMatrix^:svg:|",
	":svg:feComponentTransfer^:svg:|",
	":svg:feComposite^:svg:|",
	":svg:feConvolveMatrix^:svg:|",
	":svg:feDiffuseLighting^:svg:|",
	":svg:feDisplacementMap^:svg:|",
	":svg:feDistantLight^:svg:|",
	":svg:feDropShadow^:svg:|",
	":svg:feFlood^:svg:|",
	":svg:feFuncA^:svg:componentTransferFunction|",
	":svg:feFuncB^:svg:componentTransferFunction|",
	":svg:feFuncG^:svg:componentTransferFunction|",
	":svg:feFuncR^:svg:componentTransferFunction|",
	":svg:feGaussianBlur^:svg:|",
	":svg:feImage^:svg:|",
	":svg:feMerge^:svg:|",
	":svg:feMergeNode^:svg:|",
	":svg:feMorphology^:svg:|",
	":svg:feOffset^:svg:|",
	":svg:fePointLight^:svg:|",
	":svg:feSpecularLighting^:svg:|",
	":svg:feSpotLight^:svg:|",
	":svg:feTile^:svg:|",
	":svg:feTurbulence^:svg:|",
	":svg:filter^:svg:|",
	":svg:foreignObject^:svg:graphics|",
	":svg:g^:svg:graphics|",
	":svg:image^:svg:graphics|decoding",
	":svg:line^:svg:geometry|",
	":svg:linearGradient^:svg:gradient|",
	":svg:mpath^:svg:|",
	":svg:marker^:svg:|",
	":svg:mask^:svg:|",
	":svg:metadata^:svg:|",
	":svg:path^:svg:geometry|",
	":svg:pattern^:svg:|",
	":svg:polygon^:svg:geometry|",
	":svg:polyline^:svg:geometry|",
	":svg:radialGradient^:svg:gradient|",
	":svg:rect^:svg:geometry|",
	":svg:svg^:svg:graphics|#currentScale,#zoomAndPan",
	":svg:script^:svg:|type",
	":svg:set^:svg:animation|",
	":svg:stop^:svg:|",
	":svg:style^:svg:|!disabled,media,title,type",
	":svg:switch^:svg:graphics|",
	":svg:symbol^:svg:|",
	":svg:tspan^:svg:textPositioning|",
	":svg:text^:svg:textPositioning|",
	":svg:textPath^:svg:textContent|",
	":svg:title^:svg:|",
	":svg:use^:svg:graphics|",
	":svg:view^:svg:|#zoomAndPan",
	"data^[HTMLElement]|value",
	"keygen^[HTMLElement]|!autofocus,challenge,!disabled,form,keytype,name",
	"menuitem^[HTMLElement]|type,label,icon,!disabled,!checked,radiogroup,!default",
	"summary^[HTMLElement]|",
	"time^[HTMLElement]|dateTime",
	":svg:cursor^:svg:|",
	":math:^[HTMLElement]|!autofocus,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforeinput,*beforematch,*beforetoggle,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contentvisibilityautostatechange,*contextlost,*contextmenu,*contextrestored,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*scrollend,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,%style,#tabIndex",
	":math:math^:math:|",
	":math:maction^:math:|",
	":math:menclose^:math:|",
	":math:merror^:math:|",
	":math:mfenced^:math:|",
	":math:mfrac^:math:|",
	":math:mi^:math:|",
	":math:mmultiscripts^:math:|",
	":math:mn^:math:|",
	":math:mo^:math:|",
	":math:mover^:math:|",
	":math:mpadded^:math:|",
	":math:mphantom^:math:|",
	":math:mroot^:math:|",
	":math:mrow^:math:|",
	":math:ms^:math:|",
	":math:mspace^:math:|",
	":math:msqrt^:math:|",
	":math:mstyle^:math:|",
	":math:msub^:math:|",
	":math:msubsup^:math:|",
	":math:msup^:math:|",
	":math:mtable^:math:|",
	":math:mtd^:math:|",
	":math:mtext^:math:|",
	":math:mtr^:math:|",
	":math:munder^:math:|",
	":math:munderover^:math:|",
	":math:semantics^:math:|"
];
var mi$1 = new Map(Object.entries({
	class: "className",
	for: "htmlFor",
	formaction: "formAction",
	innerHtml: "innerHTML",
	readonly: "readOnly",
	tabindex: "tabIndex",
	"aria-activedescendant": "ariaActiveDescendantElement",
	"aria-atomic": "ariaAtomic",
	"aria-autocomplete": "ariaAutoComplete",
	"aria-busy": "ariaBusy",
	"aria-checked": "ariaChecked",
	"aria-colcount": "ariaColCount",
	"aria-colindex": "ariaColIndex",
	"aria-colindextext": "ariaColIndexText",
	"aria-colspan": "ariaColSpan",
	"aria-controls": "ariaControlsElements",
	"aria-current": "ariaCurrent",
	"aria-describedby": "ariaDescribedByElements",
	"aria-description": "ariaDescription",
	"aria-details": "ariaDetailsElements",
	"aria-disabled": "ariaDisabled",
	"aria-errormessage": "ariaErrorMessageElements",
	"aria-expanded": "ariaExpanded",
	"aria-flowto": "ariaFlowToElements",
	"aria-haspopup": "ariaHasPopup",
	"aria-hidden": "ariaHidden",
	"aria-invalid": "ariaInvalid",
	"aria-keyshortcuts": "ariaKeyShortcuts",
	"aria-label": "ariaLabel",
	"aria-labelledby": "ariaLabelledByElements",
	"aria-level": "ariaLevel",
	"aria-live": "ariaLive",
	"aria-modal": "ariaModal",
	"aria-multiline": "ariaMultiLine",
	"aria-multiselectable": "ariaMultiSelectable",
	"aria-orientation": "ariaOrientation",
	"aria-owns": "ariaOwnsElements",
	"aria-placeholder": "ariaPlaceholder",
	"aria-posinset": "ariaPosInSet",
	"aria-pressed": "ariaPressed",
	"aria-readonly": "ariaReadOnly",
	"aria-required": "ariaRequired",
	"aria-roledescription": "ariaRoleDescription",
	"aria-rowcount": "ariaRowCount",
	"aria-rowindex": "ariaRowIndex",
	"aria-rowindextext": "ariaRowIndexText",
	"aria-rowspan": "ariaRowSpan",
	"aria-selected": "ariaSelected",
	"aria-setsize": "ariaSetSize",
	"aria-sort": "ariaSort",
	"aria-valuemax": "ariaValueMax",
	"aria-valuemin": "ariaValueMin",
	"aria-valuenow": "ariaValueNow",
	"aria-valuetext": "ariaValueText"
}));
var Va = Array.from(mi$1).reduce((e, [t, r]) => (e.set(t, r), e), /* @__PURE__ */ new Map());
var fi$1 = class extends hi$1 {
	_schema = /* @__PURE__ */ new Map();
	_eventSchema = /* @__PURE__ */ new Map();
	constructor() {
		super(), Fa.forEach((e) => {
			let t = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Set(), [n, i] = e.split("|"), s = i.split(","), [a, o] = n.split("^");
			a.split(",").forEach((c) => {
				this._schema.set(c.toLowerCase(), t), this._eventSchema.set(c.toLowerCase(), r);
			});
			let l = o && this._schema.get(o.toLowerCase());
			if (l) {
				for (let [c, u] of l) t.set(c, u);
				for (let c of this._eventSchema.get(o.toLowerCase())) r.add(c);
			}
			s.forEach((c) => {
				if (c.length > 0) switch (c[0]) {
					case "*":
						r.add(c.substring(1));
						break;
					case "!":
						t.set(c.substring(1), Ma);
						break;
					case "#":
						t.set(c.substring(1), Ba);
						break;
					case "%":
						t.set(c.substring(1), Ha);
						break;
					default: t.set(c, qa);
				}
			});
		});
	}
	hasProperty(e, t, r) {
		if (r.some((i) => i.name === mr.name)) return !0;
		let n = Dt$1(e);
		if (n.includes("-")) {
			if (cr$1(n) || ur$1(n)) return !1;
			if (r.some((i) => i.name === hr$1.name)) return !0;
		}
		return (this._schema.get(n) || this._schema.get("unknown")).has(t);
	}
	hasElement(e, t) {
		if (t.some((n) => n.name === mr.name)) return !0;
		let r = Dt$1(e);
		return r.includes("-") && (cr$1(r) || ur$1(r) || t.some((n) => n.name === hr$1.name)) ? !0 : this._schema.has(r);
	}
	securityContext(e, t, r) {
		r && (t = this.getMappedPropName(t));
		let [n, i] = ee$1(e, !1);
		return ui$1(i, t, n);
	}
	getMappedPropName(e) {
		return mi$1.get(e) ?? e;
	}
	getDefaultComponentElementName() {
		return "ng-component";
	}
	validateProperty(e) {
		return e.toLowerCase().startsWith("on") ? {
			error: !0,
			msg: `Binding to event property '${e}' is disallowed for security reasons, please use (${e.slice(2)})=...
If '${e}' is a directive input, make sure the directive is imported by the current module.`
		} : { error: !1 };
	}
	validateAttribute(e) {
		return e.toLowerCase().startsWith("on") ? {
			error: !0,
			msg: `Binding to event attribute '${e}' is disallowed for security reasons, please use (${e.slice(2)})=...`
		} : { error: !1 };
	}
	allKnownElementNames() {
		return Array.from(this._schema.keys());
	}
	allKnownAttributesOfElement(e) {
		let t = Dt$1(e), r = this._schema.get(t) || this._schema.get("unknown");
		return Array.from(r.keys()).map((n) => Va.get(n) ?? n);
	}
	allKnownEventsOfElement(e) {
		let t = Dt$1(e);
		return Array.from(this._eventSchema.get(t) ?? []);
	}
	normalizeAnimationStyleProperty(e) {
		return pi(e);
	}
	normalizeAnimationStyleValue(e, t, r) {
		let n = "", i = r.toString().trim(), s = null;
		if (Ua(e) && r !== 0 && r !== "0") if (typeof r == "number") n = "px";
		else {
			let a = r.match(/^[+-]?[\d\.]+([a-z]*)$/);
			a && a[1].length == 0 && (s = `Please provide a CSS unit value for ${t}:${r}`);
		}
		return {
			error: s,
			value: i + n
		};
	}
};
function Ua(e) {
	switch (e) {
		case "width":
		case "height":
		case "minWidth":
		case "minHeight":
		case "maxWidth":
		case "maxHeight":
		case "left":
		case "top":
		case "bottom":
		case "right":
		case "fontSize":
		case "outlineWidth":
		case "outlineOffset":
		case "paddingTop":
		case "paddingLeft":
		case "paddingBottom":
		case "paddingRight":
		case "marginTop":
		case "marginLeft":
		case "marginBottom":
		case "marginRight":
		case "borderRadius":
		case "borderWidth":
		case "borderTopWidth":
		case "borderLeftWidth":
		case "borderRightWidth":
		case "borderBottomWidth":
		case "textIndent": return !0;
		default: return !1;
	}
}
var m = class {
	closedByChildren = {};
	contentType;
	closedByParent = !1;
	implicitNamespacePrefix;
	isVoid;
	ignoreFirstLf;
	canSelfClose;
	preventNamespaceInheritance;
	constructor({ closedByChildren: e, implicitNamespacePrefix: t, contentType: r = 2, closedByParent: n = !1, isVoid: i = !1, ignoreFirstLf: s = !1, preventNamespaceInheritance: a = !1, canSelfClose: o = !1 } = {}) {
		e && e.length > 0 && e.forEach((l) => this.closedByChildren[l] = !0), this.isVoid = i, this.closedByParent = n || i, this.implicitNamespacePrefix = t || null, this.contentType = r, this.ignoreFirstLf = s, this.preventNamespaceInheritance = a, this.canSelfClose = o ?? i;
	}
	isClosedByChild(e) {
		return this.isVoid || e.toLowerCase() in this.closedByChildren;
	}
	getContentType(e) {
		return typeof this.contentType == "object" ? (e === void 0 ? void 0 : this.contentType[e]) ?? this.contentType.default : this.contentType;
	}
};
var di$1;
var tt$1;
function Ne$1(e) {
	return tt$1 || (di$1 = new m({ canSelfClose: !0 }), tt$1 = Object.assign(Object.create(null), {
		base: new m({ isVoid: !0 }),
		meta: new m({ isVoid: !0 }),
		area: new m({ isVoid: !0 }),
		embed: new m({ isVoid: !0 }),
		link: new m({ isVoid: !0 }),
		img: new m({ isVoid: !0 }),
		input: new m({ isVoid: !0 }),
		param: new m({ isVoid: !0 }),
		hr: new m({ isVoid: !0 }),
		br: new m({ isVoid: !0 }),
		source: new m({ isVoid: !0 }),
		track: new m({ isVoid: !0 }),
		wbr: new m({ isVoid: !0 }),
		p: new m({
			closedByChildren: [
				"address",
				"article",
				"aside",
				"blockquote",
				"div",
				"dl",
				"fieldset",
				"footer",
				"form",
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6",
				"header",
				"hgroup",
				"hr",
				"main",
				"nav",
				"ol",
				"p",
				"pre",
				"section",
				"table",
				"ul"
			],
			closedByParent: !0
		}),
		thead: new m({ closedByChildren: ["tbody", "tfoot"] }),
		tbody: new m({
			closedByChildren: ["tbody", "tfoot"],
			closedByParent: !0
		}),
		tfoot: new m({
			closedByChildren: ["tbody"],
			closedByParent: !0
		}),
		tr: new m({
			closedByChildren: ["tr"],
			closedByParent: !0
		}),
		td: new m({
			closedByChildren: ["td", "th"],
			closedByParent: !0
		}),
		th: new m({
			closedByChildren: ["td", "th"],
			closedByParent: !0
		}),
		col: new m({ isVoid: !0 }),
		svg: new m({ implicitNamespacePrefix: "svg" }),
		foreignObject: new m({
			implicitNamespacePrefix: "svg",
			preventNamespaceInheritance: !0
		}),
		math: new m({ implicitNamespacePrefix: "math" }),
		li: new m({
			closedByChildren: ["li"],
			closedByParent: !0
		}),
		dt: new m({ closedByChildren: ["dt", "dd"] }),
		dd: new m({
			closedByChildren: ["dt", "dd"],
			closedByParent: !0
		}),
		rb: new m({
			closedByChildren: [
				"rb",
				"rt",
				"rtc",
				"rp"
			],
			closedByParent: !0
		}),
		rt: new m({
			closedByChildren: [
				"rb",
				"rt",
				"rtc",
				"rp"
			],
			closedByParent: !0
		}),
		rtc: new m({
			closedByChildren: [
				"rb",
				"rtc",
				"rp"
			],
			closedByParent: !0
		}),
		rp: new m({
			closedByChildren: [
				"rb",
				"rt",
				"rtc",
				"rp"
			],
			closedByParent: !0
		}),
		optgroup: new m({
			closedByChildren: ["optgroup"],
			closedByParent: !0
		}),
		option: new m({
			closedByChildren: ["option", "optgroup"],
			closedByParent: !0
		}),
		pre: new m({ ignoreFirstLf: !0 }),
		listing: new m({ ignoreFirstLf: !0 }),
		style: new m({ contentType: 0 }),
		script: new m({ contentType: 0 }),
		title: new m({ contentType: {
			default: 1,
			svg: 2
		} }),
		textarea: new m({
			contentType: 1,
			ignoreFirstLf: !0
		})
	}), new fi$1().allKnownElementNames().forEach((t) => {
		!tt$1[t] && Pe$1(t) === null && (tt$1[t] = new m({ canSelfClose: !1 }));
	})), tt$1[e] ?? di$1;
}
var De$1 = class gi {
	file;
	offset;
	line;
	col;
	constructor(t, r, n, i) {
		this.file = t, this.offset = r, this.line = n, this.col = i;
	}
	toString() {
		return this.offset != null ? `${this.file.url}@${this.line}:${this.col}` : this.file.url;
	}
	moveBy(t) {
		let r = this.file.content, n = r.length, i = this.offset, s = this.line, a = this.col;
		for (; i > 0 && t < 0;) if (i--, t++, r.charCodeAt(i) == 10) {
			s--;
			let o = r.substring(0, i - 1).lastIndexOf(`
`);
			a = o > 0 ? i - o : i;
		} else a--;
		for (; i < n && t > 0;) {
			let o = r.charCodeAt(i);
			i++, t--, o == 10 ? (s++, a = 0) : a++;
		}
		return new gi(this.file, i, s, a);
	}
	getContext(t, r) {
		let n = this.file.content, i = this.offset;
		if (i != null) {
			i > n.length - 1 && (i = n.length - 1);
			let s = i, a = 0, o = 0;
			for (; a < t && i > 0 && (i--, a++, !(n[i] == `
` && ++o == r)););
			for (a = 0, o = 0; a < t && s < n.length - 1 && (s++, a++, !(n[s] == `
` && ++o == r)););
			return {
				before: n.substring(i, this.offset),
				after: n.substring(this.offset, s + 1)
			};
		}
		return null;
	}
};
var rt$1 = class {
	content;
	url;
	constructor(e, t) {
		this.content = e, this.url = t;
	}
};
var p = class {
	start;
	end;
	fullStart;
	details;
	constructor(e, t, r = e, n = null) {
		this.start = e, this.end = t, this.fullStart = r, this.details = n;
	}
	toString() {
		return this.start.file.content.substring(this.start.offset, this.end.offset);
	}
};
var Wa = (function(e) {
	return e[e.WARNING = 0] = "WARNING", e[e.ERROR = 1] = "ERROR", e;
})({});
var re$1 = class extends Error {
	span;
	msg;
	level;
	relatedError;
	constructor(e, t, r = 1, n) {
		super(t), this.span = e, this.msg = t, this.level = r, this.relatedError = n, Object.setPrototypeOf(this, new.target.prototype);
	}
	contextualMessage() {
		let e = this.span.start.getContext(100, 3);
		return e ? `${this.msg} ("${e.before}[${Wa[this.level]} ->]${e.after}")` : this.msg;
	}
	toString() {
		let e = this.span.details ? `, ${this.span.details}` : "";
		return `${this.contextualMessage()}: ${this.span.start}${e}`;
	}
};
var de$1 = class {
	sourceSpan;
	i18n;
	constructor(e, t) {
		this.sourceSpan = e, this.i18n = t;
	}
};
var _i$1 = class extends de$1 {
	value;
	tokens;
	constructor(e, t, r, n) {
		super(t, n), this.value = e, this.tokens = r;
	}
	visit(e, t) {
		return e.visitText(this, t);
	}
	kind = "text";
};
var Si$1 = class extends de$1 {
	value;
	tokens;
	constructor(e, t, r, n) {
		super(t, n), this.value = e, this.tokens = r;
	}
	visit(e, t) {
		return e.visitCdata(this, t);
	}
	kind = "cdata";
};
var vi$1 = class extends de$1 {
	switchValue;
	type;
	cases;
	switchValueSourceSpan;
	constructor(e, t, r, n, i, s) {
		super(n, s), this.switchValue = e, this.type = t, this.cases = r, this.switchValueSourceSpan = i;
	}
	visit(e, t) {
		return e.visitExpansion(this, t);
	}
	kind = "expansion";
};
var Ci$1 = class {
	value;
	expression;
	sourceSpan;
	valueSourceSpan;
	expSourceSpan;
	constructor(e, t, r, n, i) {
		this.value = e, this.expression = t, this.sourceSpan = r, this.valueSourceSpan = n, this.expSourceSpan = i;
	}
	visit(e, t) {
		return e.visitExpansionCase(this, t);
	}
	kind = "expansionCase";
};
var ki$1 = class extends de$1 {
	name;
	value;
	keySpan;
	valueSpan;
	valueTokens;
	constructor(e, t, r, n, i, s, a) {
		super(r, a), this.name = e, this.value = t, this.keySpan = n, this.valueSpan = i, this.valueTokens = s;
	}
	visit(e, t) {
		return e.visitAttribute(this, t);
	}
	kind = "attribute";
	get nameSpan() {
		return this.keySpan;
	}
};
var bi$1 = class {
	value;
	type;
	sourceSpan;
	constructor(e, t, r) {
		this.value = e, this.type = t, this.sourceSpan = r;
	}
	visit(e, t) {
		return e.visitStartTagComment ? e.visitStartTagComment(this, t) : void 0;
	}
	kind = "startTagComment";
};
var ne$1 = class extends de$1 {
	name;
	attrs;
	directives;
	children;
	isSelfClosing;
	startSourceSpan;
	endSourceSpan;
	nameSpan;
	isVoid;
	comments;
	constructor(e, t, r, n, i, s, a, o = null, l = null, c, u, d = []) {
		super(s, u), this.name = e, this.attrs = t, this.directives = r, this.children = n, this.isSelfClosing = i, this.startSourceSpan = a, this.endSourceSpan = o, this.nameSpan = l, this.isVoid = c, this.comments = d;
	}
	visit(e, t) {
		return e.visitElement(this, t);
	}
	kind = "element";
};
var wi$1 = class {
	value;
	sourceSpan;
	constructor(e, t) {
		this.value = e, this.sourceSpan = t;
	}
	visit(e, t) {
		return e.visitComment(this, t);
	}
	kind = "comment";
};
var Ti$1 = class {
	value;
	sourceSpan;
	constructor(e, t) {
		this.value = e, this.sourceSpan = t;
	}
	visit(e, t) {
		return e.visitDocType(this, t);
	}
	kind = "docType";
};
var ge$1 = class extends de$1 {
	name;
	parameters;
	children;
	nameSpan;
	startSourceSpan;
	endSourceSpan;
	constructor(e, t, r, n, i, s, a = null, o) {
		super(n, o), this.name = e, this.parameters = t, this.children = r, this.nameSpan = i, this.startSourceSpan = s, this.endSourceSpan = a;
	}
	visit(e, t) {
		return e.visitBlock(this, t);
	}
	kind = "block";
};
var U$1 = class extends de$1 {
	componentName;
	tagName;
	fullName;
	attrs;
	directives;
	children;
	isSelfClosing;
	startSourceSpan;
	endSourceSpan;
	comments;
	constructor(e, t, r, n, i, s, a, o, l, c = null, u, d = []) {
		super(o, u), this.componentName = e, this.tagName = t, this.fullName = r, this.attrs = n, this.directives = i, this.children = s, this.isSelfClosing = a, this.startSourceSpan = l, this.endSourceSpan = c, this.comments = d;
	}
	visit(e, t) {
		return e.visitComponent(this, t);
	}
	kind = "component";
};
var yi$1 = class {
	name;
	attrs;
	sourceSpan;
	startSourceSpan;
	endSourceSpan;
	constructor(e, t, r, n, i = null) {
		this.name = e, this.attrs = t, this.sourceSpan = r, this.startSourceSpan = n, this.endSourceSpan = i;
	}
	visit(e, t) {
		return e.visitDirective(this, t);
	}
	kind = "directive";
};
var fr$1 = class {
	expression;
	sourceSpan;
	constructor(e, t) {
		this.expression = e, this.sourceSpan = t;
	}
	visit(e, t) {
		return e.visitBlockParameter(this, t);
	}
	kind = "blockParameter";
	startSourceSpan = null;
	endSourceSpan = null;
};
var dr$1 = class {
	name;
	value;
	sourceSpan;
	nameSpan;
	valueSpan;
	constructor(e, t, r, n, i) {
		this.name = e, this.value = t, this.sourceSpan = r, this.nameSpan = n, this.valueSpan = i;
	}
	visit(e, t) {
		return e.visitLetDeclaration(this, t);
	}
	kind = "letDeclaration";
	startSourceSpan = null;
	endSourceSpan = null;
};
function It$1(e, t, r = null) {
	let n = [], i = e.visit ? (s) => e.visit(s, r) || s.visit(e, r) : (s) => s.visit(e, r);
	return t.forEach((s) => {
		let a = i(s);
		a && n.push(a);
	}), n;
}
var gr$1 = class {
	constructor() {}
	visitElement(e, t) {
		this.visitChildren(t, (r) => {
			r(e.attrs), r(e.directives), r(e.comments), r(e.children);
		});
	}
	visitAttribute(e, t) {}
	visitStartTagComment(e, t) {}
	visitText(e, t) {}
	visitCdata(e, t) {}
	visitComment(e, t) {}
	visitDocType(e, t) {}
	visitExpansion(e, t) {
		return this.visitChildren(t, (r) => {
			r(e.cases);
		});
	}
	visitExpansionCase(e, t) {}
	visitBlock(e, t) {
		this.visitChildren(t, (r) => {
			r(e.parameters), r(e.children);
		});
	}
	visitBlockParameter(e, t) {}
	visitLetDeclaration(e, t) {}
	visitComponent(e, t) {
		this.visitChildren(t, (r) => {
			r(e.attrs), r(e.comments), r(e.children);
		});
	}
	visitDirective(e, t) {
		this.visitChildren(t, (r) => {
			r(e.attrs);
		});
	}
	visitChildren(e, t) {
		let r = [], n = this;
		function i(s) {
			s && r.push(It$1(n, s, e));
		}
		return t(i), Array.prototype.concat.apply([], r);
	}
};
function nt$1(e) {
	return e >= 9 && e <= 32 || e == 160;
}
function Ie$1(e) {
	return 48 <= e && e <= 57;
}
function Re$1(e) {
	return e >= 97 && e <= 122 || e >= 65 && e <= 90;
}
function Ei$1(e) {
	return e >= 97 && e <= 102 || e >= 65 && e <= 70 || Ie$1(e);
}
function Oe$1(e) {
	return e === 10 || e === 13;
}
function _r$1(e) {
	return 48 <= e && e <= 55;
}
function Rt$1(e) {
	return e === 39 || e === 34 || e === 96;
}
var _e$1 = {
	AElig: "Æ",
	AMP: "&",
	amp: "&",
	Aacute: "Á",
	Abreve: "Ă",
	Acirc: "Â",
	Acy: "А",
	Afr: "𝔄",
	Agrave: "À",
	Alpha: "Α",
	Amacr: "Ā",
	And: "⩓",
	Aogon: "Ą",
	Aopf: "𝔸",
	ApplyFunction: "⁡",
	af: "⁡",
	Aring: "Å",
	angst: "Å",
	Ascr: "𝒜",
	Assign: "≔",
	colone: "≔",
	coloneq: "≔",
	Atilde: "Ã",
	Auml: "Ä",
	Backslash: "∖",
	setminus: "∖",
	setmn: "∖",
	smallsetminus: "∖",
	ssetmn: "∖",
	Barv: "⫧",
	Barwed: "⌆",
	doublebarwedge: "⌆",
	Bcy: "Б",
	Because: "∵",
	becaus: "∵",
	because: "∵",
	Bernoullis: "ℬ",
	Bscr: "ℬ",
	bernou: "ℬ",
	Beta: "Β",
	Bfr: "𝔅",
	Bopf: "𝔹",
	Breve: "˘",
	breve: "˘",
	Bumpeq: "≎",
	HumpDownHump: "≎",
	bump: "≎",
	CHcy: "Ч",
	COPY: "©",
	copy: "©",
	Cacute: "Ć",
	Cap: "⋒",
	CapitalDifferentialD: "ⅅ",
	DD: "ⅅ",
	Cayleys: "ℭ",
	Cfr: "ℭ",
	Ccaron: "Č",
	Ccedil: "Ç",
	Ccirc: "Ĉ",
	Cconint: "∰",
	Cdot: "Ċ",
	Cedilla: "¸",
	cedil: "¸",
	CenterDot: "·",
	centerdot: "·",
	middot: "·",
	Chi: "Χ",
	CircleDot: "⊙",
	odot: "⊙",
	CircleMinus: "⊖",
	ominus: "⊖",
	CirclePlus: "⊕",
	oplus: "⊕",
	CircleTimes: "⊗",
	otimes: "⊗",
	ClockwiseContourIntegral: "∲",
	cwconint: "∲",
	CloseCurlyDoubleQuote: "”",
	rdquo: "”",
	rdquor: "”",
	CloseCurlyQuote: "’",
	rsquo: "’",
	rsquor: "’",
	Colon: "∷",
	Proportion: "∷",
	Colone: "⩴",
	Congruent: "≡",
	equiv: "≡",
	Conint: "∯",
	DoubleContourIntegral: "∯",
	ContourIntegral: "∮",
	conint: "∮",
	oint: "∮",
	Copf: "ℂ",
	complexes: "ℂ",
	Coproduct: "∐",
	coprod: "∐",
	CounterClockwiseContourIntegral: "∳",
	awconint: "∳",
	Cross: "⨯",
	Cscr: "𝒞",
	Cup: "⋓",
	CupCap: "≍",
	asympeq: "≍",
	DDotrahd: "⤑",
	DJcy: "Ђ",
	DScy: "Ѕ",
	DZcy: "Џ",
	Dagger: "‡",
	ddagger: "‡",
	Darr: "↡",
	Dashv: "⫤",
	DoubleLeftTee: "⫤",
	Dcaron: "Ď",
	Dcy: "Д",
	Del: "∇",
	nabla: "∇",
	Delta: "Δ",
	Dfr: "𝔇",
	DiacriticalAcute: "´",
	acute: "´",
	DiacriticalDot: "˙",
	dot: "˙",
	DiacriticalDoubleAcute: "˝",
	dblac: "˝",
	DiacriticalGrave: "`",
	grave: "`",
	DiacriticalTilde: "˜",
	tilde: "˜",
	Diamond: "⋄",
	diam: "⋄",
	diamond: "⋄",
	DifferentialD: "ⅆ",
	dd: "ⅆ",
	Dopf: "𝔻",
	Dot: "¨",
	DoubleDot: "¨",
	die: "¨",
	uml: "¨",
	DotDot: "⃜",
	DotEqual: "≐",
	doteq: "≐",
	esdot: "≐",
	DoubleDownArrow: "⇓",
	Downarrow: "⇓",
	dArr: "⇓",
	DoubleLeftArrow: "⇐",
	Leftarrow: "⇐",
	lArr: "⇐",
	DoubleLeftRightArrow: "⇔",
	Leftrightarrow: "⇔",
	hArr: "⇔",
	iff: "⇔",
	DoubleLongLeftArrow: "⟸",
	Longleftarrow: "⟸",
	xlArr: "⟸",
	DoubleLongLeftRightArrow: "⟺",
	Longleftrightarrow: "⟺",
	xhArr: "⟺",
	DoubleLongRightArrow: "⟹",
	Longrightarrow: "⟹",
	xrArr: "⟹",
	DoubleRightArrow: "⇒",
	Implies: "⇒",
	Rightarrow: "⇒",
	rArr: "⇒",
	DoubleRightTee: "⊨",
	vDash: "⊨",
	DoubleUpArrow: "⇑",
	Uparrow: "⇑",
	uArr: "⇑",
	DoubleUpDownArrow: "⇕",
	Updownarrow: "⇕",
	vArr: "⇕",
	DoubleVerticalBar: "∥",
	par: "∥",
	parallel: "∥",
	shortparallel: "∥",
	spar: "∥",
	DownArrow: "↓",
	ShortDownArrow: "↓",
	darr: "↓",
	downarrow: "↓",
	DownArrowBar: "⤓",
	DownArrowUpArrow: "⇵",
	duarr: "⇵",
	DownBreve: "̑",
	DownLeftRightVector: "⥐",
	DownLeftTeeVector: "⥞",
	DownLeftVector: "↽",
	leftharpoondown: "↽",
	lhard: "↽",
	DownLeftVectorBar: "⥖",
	DownRightTeeVector: "⥟",
	DownRightVector: "⇁",
	rhard: "⇁",
	rightharpoondown: "⇁",
	DownRightVectorBar: "⥗",
	DownTee: "⊤",
	top: "⊤",
	DownTeeArrow: "↧",
	mapstodown: "↧",
	Dscr: "𝒟",
	Dstrok: "Đ",
	ENG: "Ŋ",
	ETH: "Ð",
	Eacute: "É",
	Ecaron: "Ě",
	Ecirc: "Ê",
	Ecy: "Э",
	Edot: "Ė",
	Efr: "𝔈",
	Egrave: "È",
	Element: "∈",
	in: "∈",
	isin: "∈",
	isinv: "∈",
	Emacr: "Ē",
	EmptySmallSquare: "◻",
	EmptyVerySmallSquare: "▫",
	Eogon: "Ę",
	Eopf: "𝔼",
	Epsilon: "Ε",
	Equal: "⩵",
	EqualTilde: "≂",
	eqsim: "≂",
	esim: "≂",
	Equilibrium: "⇌",
	rightleftharpoons: "⇌",
	rlhar: "⇌",
	Escr: "ℰ",
	expectation: "ℰ",
	Esim: "⩳",
	Eta: "Η",
	Euml: "Ë",
	Exists: "∃",
	exist: "∃",
	ExponentialE: "ⅇ",
	ee: "ⅇ",
	exponentiale: "ⅇ",
	Fcy: "Ф",
	Ffr: "𝔉",
	FilledSmallSquare: "◼",
	FilledVerySmallSquare: "▪",
	blacksquare: "▪",
	squarf: "▪",
	squf: "▪",
	Fopf: "𝔽",
	ForAll: "∀",
	forall: "∀",
	Fouriertrf: "ℱ",
	Fscr: "ℱ",
	GJcy: "Ѓ",
	GT: ">",
	gt: ">",
	Gamma: "Γ",
	Gammad: "Ϝ",
	Gbreve: "Ğ",
	Gcedil: "Ģ",
	Gcirc: "Ĝ",
	Gcy: "Г",
	Gdot: "Ġ",
	Gfr: "𝔊",
	Gg: "⋙",
	ggg: "⋙",
	Gopf: "𝔾",
	GreaterEqual: "≥",
	ge: "≥",
	geq: "≥",
	GreaterEqualLess: "⋛",
	gel: "⋛",
	gtreqless: "⋛",
	GreaterFullEqual: "≧",
	gE: "≧",
	geqq: "≧",
	GreaterGreater: "⪢",
	GreaterLess: "≷",
	gl: "≷",
	gtrless: "≷",
	GreaterSlantEqual: "⩾",
	geqslant: "⩾",
	ges: "⩾",
	GreaterTilde: "≳",
	gsim: "≳",
	gtrsim: "≳",
	Gscr: "𝒢",
	Gt: "≫",
	NestedGreaterGreater: "≫",
	gg: "≫",
	HARDcy: "Ъ",
	Hacek: "ˇ",
	caron: "ˇ",
	Hat: "^",
	Hcirc: "Ĥ",
	Hfr: "ℌ",
	Poincareplane: "ℌ",
	HilbertSpace: "ℋ",
	Hscr: "ℋ",
	hamilt: "ℋ",
	Hopf: "ℍ",
	quaternions: "ℍ",
	HorizontalLine: "─",
	boxh: "─",
	Hstrok: "Ħ",
	HumpEqual: "≏",
	bumpe: "≏",
	bumpeq: "≏",
	IEcy: "Е",
	IJlig: "Ĳ",
	IOcy: "Ё",
	Iacute: "Í",
	Icirc: "Î",
	Icy: "И",
	Idot: "İ",
	Ifr: "ℑ",
	Im: "ℑ",
	image: "ℑ",
	imagpart: "ℑ",
	Igrave: "Ì",
	Imacr: "Ī",
	ImaginaryI: "ⅈ",
	ii: "ⅈ",
	Int: "∬",
	Integral: "∫",
	int: "∫",
	Intersection: "⋂",
	bigcap: "⋂",
	xcap: "⋂",
	InvisibleComma: "⁣",
	ic: "⁣",
	InvisibleTimes: "⁢",
	it: "⁢",
	Iogon: "Į",
	Iopf: "𝕀",
	Iota: "Ι",
	Iscr: "ℐ",
	imagline: "ℐ",
	Itilde: "Ĩ",
	Iukcy: "І",
	Iuml: "Ï",
	Jcirc: "Ĵ",
	Jcy: "Й",
	Jfr: "𝔍",
	Jopf: "𝕁",
	Jscr: "𝒥",
	Jsercy: "Ј",
	Jukcy: "Є",
	KHcy: "Х",
	KJcy: "Ќ",
	Kappa: "Κ",
	Kcedil: "Ķ",
	Kcy: "К",
	Kfr: "𝔎",
	Kopf: "𝕂",
	Kscr: "𝒦",
	LJcy: "Љ",
	LT: "<",
	lt: "<",
	Lacute: "Ĺ",
	Lambda: "Λ",
	Lang: "⟪",
	Laplacetrf: "ℒ",
	Lscr: "ℒ",
	lagran: "ℒ",
	Larr: "↞",
	twoheadleftarrow: "↞",
	Lcaron: "Ľ",
	Lcedil: "Ļ",
	Lcy: "Л",
	LeftAngleBracket: "⟨",
	lang: "⟨",
	langle: "⟨",
	LeftArrow: "←",
	ShortLeftArrow: "←",
	larr: "←",
	leftarrow: "←",
	slarr: "←",
	LeftArrowBar: "⇤",
	larrb: "⇤",
	LeftArrowRightArrow: "⇆",
	leftrightarrows: "⇆",
	lrarr: "⇆",
	LeftCeiling: "⌈",
	lceil: "⌈",
	LeftDoubleBracket: "⟦",
	lobrk: "⟦",
	LeftDownTeeVector: "⥡",
	LeftDownVector: "⇃",
	dharl: "⇃",
	downharpoonleft: "⇃",
	LeftDownVectorBar: "⥙",
	LeftFloor: "⌊",
	lfloor: "⌊",
	LeftRightArrow: "↔",
	harr: "↔",
	leftrightarrow: "↔",
	LeftRightVector: "⥎",
	LeftTee: "⊣",
	dashv: "⊣",
	LeftTeeArrow: "↤",
	mapstoleft: "↤",
	LeftTeeVector: "⥚",
	LeftTriangle: "⊲",
	vartriangleleft: "⊲",
	vltri: "⊲",
	LeftTriangleBar: "⧏",
	LeftTriangleEqual: "⊴",
	ltrie: "⊴",
	trianglelefteq: "⊴",
	LeftUpDownVector: "⥑",
	LeftUpTeeVector: "⥠",
	LeftUpVector: "↿",
	uharl: "↿",
	upharpoonleft: "↿",
	LeftUpVectorBar: "⥘",
	LeftVector: "↼",
	leftharpoonup: "↼",
	lharu: "↼",
	LeftVectorBar: "⥒",
	LessEqualGreater: "⋚",
	leg: "⋚",
	lesseqgtr: "⋚",
	LessFullEqual: "≦",
	lE: "≦",
	leqq: "≦",
	LessGreater: "≶",
	lessgtr: "≶",
	lg: "≶",
	LessLess: "⪡",
	LessSlantEqual: "⩽",
	leqslant: "⩽",
	les: "⩽",
	LessTilde: "≲",
	lesssim: "≲",
	lsim: "≲",
	Lfr: "𝔏",
	Ll: "⋘",
	Lleftarrow: "⇚",
	lAarr: "⇚",
	Lmidot: "Ŀ",
	LongLeftArrow: "⟵",
	longleftarrow: "⟵",
	xlarr: "⟵",
	LongLeftRightArrow: "⟷",
	longleftrightarrow: "⟷",
	xharr: "⟷",
	LongRightArrow: "⟶",
	longrightarrow: "⟶",
	xrarr: "⟶",
	Lopf: "𝕃",
	LowerLeftArrow: "↙",
	swarr: "↙",
	swarrow: "↙",
	LowerRightArrow: "↘",
	searr: "↘",
	searrow: "↘",
	Lsh: "↰",
	lsh: "↰",
	Lstrok: "Ł",
	Lt: "≪",
	NestedLessLess: "≪",
	ll: "≪",
	Map: "⤅",
	Mcy: "М",
	MediumSpace: " ",
	Mellintrf: "ℳ",
	Mscr: "ℳ",
	phmmat: "ℳ",
	Mfr: "𝔐",
	MinusPlus: "∓",
	mnplus: "∓",
	mp: "∓",
	Mopf: "𝕄",
	Mu: "Μ",
	NJcy: "Њ",
	Nacute: "Ń",
	Ncaron: "Ň",
	Ncedil: "Ņ",
	Ncy: "Н",
	NegativeMediumSpace: "​",
	NegativeThickSpace: "​",
	NegativeThinSpace: "​",
	NegativeVeryThinSpace: "​",
	ZeroWidthSpace: "​",
	NewLine: `
`,
	Nfr: "𝔑",
	NoBreak: "⁠",
	NonBreakingSpace: "\xA0",
	nbsp: "\xA0",
	Nopf: "ℕ",
	naturals: "ℕ",
	Not: "⫬",
	NotCongruent: "≢",
	nequiv: "≢",
	NotCupCap: "≭",
	NotDoubleVerticalBar: "∦",
	npar: "∦",
	nparallel: "∦",
	nshortparallel: "∦",
	nspar: "∦",
	NotElement: "∉",
	notin: "∉",
	notinva: "∉",
	NotEqual: "≠",
	ne: "≠",
	NotEqualTilde: "≂̸",
	nesim: "≂̸",
	NotExists: "∄",
	nexist: "∄",
	nexists: "∄",
	NotGreater: "≯",
	ngt: "≯",
	ngtr: "≯",
	NotGreaterEqual: "≱",
	nge: "≱",
	ngeq: "≱",
	NotGreaterFullEqual: "≧̸",
	ngE: "≧̸",
	ngeqq: "≧̸",
	NotGreaterGreater: "≫̸",
	nGtv: "≫̸",
	NotGreaterLess: "≹",
	ntgl: "≹",
	NotGreaterSlantEqual: "⩾̸",
	ngeqslant: "⩾̸",
	nges: "⩾̸",
	NotGreaterTilde: "≵",
	ngsim: "≵",
	NotHumpDownHump: "≎̸",
	nbump: "≎̸",
	NotHumpEqual: "≏̸",
	nbumpe: "≏̸",
	NotLeftTriangle: "⋪",
	nltri: "⋪",
	ntriangleleft: "⋪",
	NotLeftTriangleBar: "⧏̸",
	NotLeftTriangleEqual: "⋬",
	nltrie: "⋬",
	ntrianglelefteq: "⋬",
	NotLess: "≮",
	nless: "≮",
	nlt: "≮",
	NotLessEqual: "≰",
	nle: "≰",
	nleq: "≰",
	NotLessGreater: "≸",
	ntlg: "≸",
	NotLessLess: "≪̸",
	nLtv: "≪̸",
	NotLessSlantEqual: "⩽̸",
	nleqslant: "⩽̸",
	nles: "⩽̸",
	NotLessTilde: "≴",
	nlsim: "≴",
	NotNestedGreaterGreater: "⪢̸",
	NotNestedLessLess: "⪡̸",
	NotPrecedes: "⊀",
	npr: "⊀",
	nprec: "⊀",
	NotPrecedesEqual: "⪯̸",
	npre: "⪯̸",
	npreceq: "⪯̸",
	NotPrecedesSlantEqual: "⋠",
	nprcue: "⋠",
	NotReverseElement: "∌",
	notni: "∌",
	notniva: "∌",
	NotRightTriangle: "⋫",
	nrtri: "⋫",
	ntriangleright: "⋫",
	NotRightTriangleBar: "⧐̸",
	NotRightTriangleEqual: "⋭",
	nrtrie: "⋭",
	ntrianglerighteq: "⋭",
	NotSquareSubset: "⊏̸",
	NotSquareSubsetEqual: "⋢",
	nsqsube: "⋢",
	NotSquareSuperset: "⊐̸",
	NotSquareSupersetEqual: "⋣",
	nsqsupe: "⋣",
	NotSubset: "⊂⃒",
	nsubset: "⊂⃒",
	vnsub: "⊂⃒",
	NotSubsetEqual: "⊈",
	nsube: "⊈",
	nsubseteq: "⊈",
	NotSucceeds: "⊁",
	nsc: "⊁",
	nsucc: "⊁",
	NotSucceedsEqual: "⪰̸",
	nsce: "⪰̸",
	nsucceq: "⪰̸",
	NotSucceedsSlantEqual: "⋡",
	nsccue: "⋡",
	NotSucceedsTilde: "≿̸",
	NotSuperset: "⊃⃒",
	nsupset: "⊃⃒",
	vnsup: "⊃⃒",
	NotSupersetEqual: "⊉",
	nsupe: "⊉",
	nsupseteq: "⊉",
	NotTilde: "≁",
	nsim: "≁",
	NotTildeEqual: "≄",
	nsime: "≄",
	nsimeq: "≄",
	NotTildeFullEqual: "≇",
	ncong: "≇",
	NotTildeTilde: "≉",
	nap: "≉",
	napprox: "≉",
	NotVerticalBar: "∤",
	nmid: "∤",
	nshortmid: "∤",
	nsmid: "∤",
	Nscr: "𝒩",
	Ntilde: "Ñ",
	Nu: "Ν",
	OElig: "Œ",
	Oacute: "Ó",
	Ocirc: "Ô",
	Ocy: "О",
	Odblac: "Ő",
	Ofr: "𝔒",
	Ograve: "Ò",
	Omacr: "Ō",
	Omega: "Ω",
	ohm: "Ω",
	Omicron: "Ο",
	Oopf: "𝕆",
	OpenCurlyDoubleQuote: "“",
	ldquo: "“",
	OpenCurlyQuote: "‘",
	lsquo: "‘",
	Or: "⩔",
	Oscr: "𝒪",
	Oslash: "Ø",
	Otilde: "Õ",
	Otimes: "⨷",
	Ouml: "Ö",
	OverBar: "‾",
	oline: "‾",
	OverBrace: "⏞",
	OverBracket: "⎴",
	tbrk: "⎴",
	OverParenthesis: "⏜",
	PartialD: "∂",
	part: "∂",
	Pcy: "П",
	Pfr: "𝔓",
	Phi: "Φ",
	Pi: "Π",
	PlusMinus: "±",
	plusmn: "±",
	pm: "±",
	Popf: "ℙ",
	primes: "ℙ",
	Pr: "⪻",
	Precedes: "≺",
	pr: "≺",
	prec: "≺",
	PrecedesEqual: "⪯",
	pre: "⪯",
	preceq: "⪯",
	PrecedesSlantEqual: "≼",
	prcue: "≼",
	preccurlyeq: "≼",
	PrecedesTilde: "≾",
	precsim: "≾",
	prsim: "≾",
	Prime: "″",
	Product: "∏",
	prod: "∏",
	Proportional: "∝",
	prop: "∝",
	propto: "∝",
	varpropto: "∝",
	vprop: "∝",
	Pscr: "𝒫",
	Psi: "Ψ",
	QUOT: "\"",
	quot: "\"",
	Qfr: "𝔔",
	Qopf: "ℚ",
	rationals: "ℚ",
	Qscr: "𝒬",
	RBarr: "⤐",
	drbkarow: "⤐",
	REG: "®",
	circledR: "®",
	reg: "®",
	Racute: "Ŕ",
	Rang: "⟫",
	Rarr: "↠",
	twoheadrightarrow: "↠",
	Rarrtl: "⤖",
	Rcaron: "Ř",
	Rcedil: "Ŗ",
	Rcy: "Р",
	Re: "ℜ",
	Rfr: "ℜ",
	real: "ℜ",
	realpart: "ℜ",
	ReverseElement: "∋",
	SuchThat: "∋",
	ni: "∋",
	niv: "∋",
	ReverseEquilibrium: "⇋",
	leftrightharpoons: "⇋",
	lrhar: "⇋",
	ReverseUpEquilibrium: "⥯",
	duhar: "⥯",
	Rho: "Ρ",
	RightAngleBracket: "⟩",
	rang: "⟩",
	rangle: "⟩",
	RightArrow: "→",
	ShortRightArrow: "→",
	rarr: "→",
	rightarrow: "→",
	srarr: "→",
	RightArrowBar: "⇥",
	rarrb: "⇥",
	RightArrowLeftArrow: "⇄",
	rightleftarrows: "⇄",
	rlarr: "⇄",
	RightCeiling: "⌉",
	rceil: "⌉",
	RightDoubleBracket: "⟧",
	robrk: "⟧",
	RightDownTeeVector: "⥝",
	RightDownVector: "⇂",
	dharr: "⇂",
	downharpoonright: "⇂",
	RightDownVectorBar: "⥕",
	RightFloor: "⌋",
	rfloor: "⌋",
	RightTee: "⊢",
	vdash: "⊢",
	RightTeeArrow: "↦",
	map: "↦",
	mapsto: "↦",
	RightTeeVector: "⥛",
	RightTriangle: "⊳",
	vartriangleright: "⊳",
	vrtri: "⊳",
	RightTriangleBar: "⧐",
	RightTriangleEqual: "⊵",
	rtrie: "⊵",
	trianglerighteq: "⊵",
	RightUpDownVector: "⥏",
	RightUpTeeVector: "⥜",
	RightUpVector: "↾",
	uharr: "↾",
	upharpoonright: "↾",
	RightUpVectorBar: "⥔",
	RightVector: "⇀",
	rharu: "⇀",
	rightharpoonup: "⇀",
	RightVectorBar: "⥓",
	Ropf: "ℝ",
	reals: "ℝ",
	RoundImplies: "⥰",
	Rrightarrow: "⇛",
	rAarr: "⇛",
	Rscr: "ℛ",
	realine: "ℛ",
	Rsh: "↱",
	rsh: "↱",
	RuleDelayed: "⧴",
	SHCHcy: "Щ",
	SHcy: "Ш",
	SOFTcy: "Ь",
	Sacute: "Ś",
	Sc: "⪼",
	Scaron: "Š",
	Scedil: "Ş",
	Scirc: "Ŝ",
	Scy: "С",
	Sfr: "𝔖",
	ShortUpArrow: "↑",
	UpArrow: "↑",
	uarr: "↑",
	uparrow: "↑",
	Sigma: "Σ",
	SmallCircle: "∘",
	compfn: "∘",
	Sopf: "𝕊",
	Sqrt: "√",
	radic: "√",
	Square: "□",
	squ: "□",
	square: "□",
	SquareIntersection: "⊓",
	sqcap: "⊓",
	SquareSubset: "⊏",
	sqsub: "⊏",
	sqsubset: "⊏",
	SquareSubsetEqual: "⊑",
	sqsube: "⊑",
	sqsubseteq: "⊑",
	SquareSuperset: "⊐",
	sqsup: "⊐",
	sqsupset: "⊐",
	SquareSupersetEqual: "⊒",
	sqsupe: "⊒",
	sqsupseteq: "⊒",
	SquareUnion: "⊔",
	sqcup: "⊔",
	Sscr: "𝒮",
	Star: "⋆",
	sstarf: "⋆",
	Sub: "⋐",
	Subset: "⋐",
	SubsetEqual: "⊆",
	sube: "⊆",
	subseteq: "⊆",
	Succeeds: "≻",
	sc: "≻",
	succ: "≻",
	SucceedsEqual: "⪰",
	sce: "⪰",
	succeq: "⪰",
	SucceedsSlantEqual: "≽",
	sccue: "≽",
	succcurlyeq: "≽",
	SucceedsTilde: "≿",
	scsim: "≿",
	succsim: "≿",
	Sum: "∑",
	sum: "∑",
	Sup: "⋑",
	Supset: "⋑",
	Superset: "⊃",
	sup: "⊃",
	supset: "⊃",
	SupersetEqual: "⊇",
	supe: "⊇",
	supseteq: "⊇",
	THORN: "Þ",
	TRADE: "™",
	trade: "™",
	TSHcy: "Ћ",
	TScy: "Ц",
	Tab: "	",
	Tau: "Τ",
	Tcaron: "Ť",
	Tcedil: "Ţ",
	Tcy: "Т",
	Tfr: "𝔗",
	Therefore: "∴",
	there4: "∴",
	therefore: "∴",
	Theta: "Θ",
	ThickSpace: "  ",
	ThinSpace: " ",
	thinsp: " ",
	Tilde: "∼",
	sim: "∼",
	thicksim: "∼",
	thksim: "∼",
	TildeEqual: "≃",
	sime: "≃",
	simeq: "≃",
	TildeFullEqual: "≅",
	cong: "≅",
	TildeTilde: "≈",
	ap: "≈",
	approx: "≈",
	asymp: "≈",
	thickapprox: "≈",
	thkap: "≈",
	Topf: "𝕋",
	TripleDot: "⃛",
	tdot: "⃛",
	Tscr: "𝒯",
	Tstrok: "Ŧ",
	Uacute: "Ú",
	Uarr: "↟",
	Uarrocir: "⥉",
	Ubrcy: "Ў",
	Ubreve: "Ŭ",
	Ucirc: "Û",
	Ucy: "У",
	Udblac: "Ű",
	Ufr: "𝔘",
	Ugrave: "Ù",
	Umacr: "Ū",
	UnderBar: "_",
	lowbar: "_",
	UnderBrace: "⏟",
	UnderBracket: "⎵",
	bbrk: "⎵",
	UnderParenthesis: "⏝",
	Union: "⋃",
	bigcup: "⋃",
	xcup: "⋃",
	UnionPlus: "⊎",
	uplus: "⊎",
	Uogon: "Ų",
	Uopf: "𝕌",
	UpArrowBar: "⤒",
	UpArrowDownArrow: "⇅",
	udarr: "⇅",
	UpDownArrow: "↕",
	updownarrow: "↕",
	varr: "↕",
	UpEquilibrium: "⥮",
	udhar: "⥮",
	UpTee: "⊥",
	bot: "⊥",
	bottom: "⊥",
	perp: "⊥",
	UpTeeArrow: "↥",
	mapstoup: "↥",
	UpperLeftArrow: "↖",
	nwarr: "↖",
	nwarrow: "↖",
	UpperRightArrow: "↗",
	nearr: "↗",
	nearrow: "↗",
	Upsi: "ϒ",
	upsih: "ϒ",
	Upsilon: "Υ",
	Uring: "Ů",
	Uscr: "𝒰",
	Utilde: "Ũ",
	Uuml: "Ü",
	VDash: "⊫",
	Vbar: "⫫",
	Vcy: "В",
	Vdash: "⊩",
	Vdashl: "⫦",
	Vee: "⋁",
	bigvee: "⋁",
	xvee: "⋁",
	Verbar: "‖",
	Vert: "‖",
	VerticalBar: "∣",
	mid: "∣",
	shortmid: "∣",
	smid: "∣",
	VerticalLine: "|",
	verbar: "|",
	vert: "|",
	VerticalSeparator: "❘",
	VerticalTilde: "≀",
	wr: "≀",
	wreath: "≀",
	VeryThinSpace: " ",
	hairsp: " ",
	Vfr: "𝔙",
	Vopf: "𝕍",
	Vscr: "𝒱",
	Vvdash: "⊪",
	Wcirc: "Ŵ",
	Wedge: "⋀",
	bigwedge: "⋀",
	xwedge: "⋀",
	Wfr: "𝔚",
	Wopf: "𝕎",
	Wscr: "𝒲",
	Xfr: "𝔛",
	Xi: "Ξ",
	Xopf: "𝕏",
	Xscr: "𝒳",
	YAcy: "Я",
	YIcy: "Ї",
	YUcy: "Ю",
	Yacute: "Ý",
	Ycirc: "Ŷ",
	Ycy: "Ы",
	Yfr: "𝔜",
	Yopf: "𝕐",
	Yscr: "𝒴",
	Yuml: "Ÿ",
	ZHcy: "Ж",
	Zacute: "Ź",
	Zcaron: "Ž",
	Zcy: "З",
	Zdot: "Ż",
	Zeta: "Ζ",
	Zfr: "ℨ",
	zeetrf: "ℨ",
	Zopf: "ℤ",
	integers: "ℤ",
	Zscr: "𝒵",
	aacute: "á",
	abreve: "ă",
	ac: "∾",
	mstpos: "∾",
	acE: "∾̳",
	acd: "∿",
	acirc: "â",
	acy: "а",
	aelig: "æ",
	afr: "𝔞",
	agrave: "à",
	alefsym: "ℵ",
	aleph: "ℵ",
	alpha: "α",
	amacr: "ā",
	amalg: "⨿",
	and: "∧",
	wedge: "∧",
	andand: "⩕",
	andd: "⩜",
	andslope: "⩘",
	andv: "⩚",
	ang: "∠",
	angle: "∠",
	ange: "⦤",
	angmsd: "∡",
	measuredangle: "∡",
	angmsdaa: "⦨",
	angmsdab: "⦩",
	angmsdac: "⦪",
	angmsdad: "⦫",
	angmsdae: "⦬",
	angmsdaf: "⦭",
	angmsdag: "⦮",
	angmsdah: "⦯",
	angrt: "∟",
	angrtvb: "⊾",
	angrtvbd: "⦝",
	angsph: "∢",
	angzarr: "⍼",
	aogon: "ą",
	aopf: "𝕒",
	apE: "⩰",
	apacir: "⩯",
	ape: "≊",
	approxeq: "≊",
	apid: "≋",
	apos: "'",
	aring: "å",
	ascr: "𝒶",
	ast: "*",
	midast: "*",
	atilde: "ã",
	auml: "ä",
	awint: "⨑",
	bNot: "⫭",
	backcong: "≌",
	bcong: "≌",
	backepsilon: "϶",
	bepsi: "϶",
	backprime: "‵",
	bprime: "‵",
	backsim: "∽",
	bsim: "∽",
	backsimeq: "⋍",
	bsime: "⋍",
	barvee: "⊽",
	barwed: "⌅",
	barwedge: "⌅",
	bbrktbrk: "⎶",
	bcy: "б",
	bdquo: "„",
	ldquor: "„",
	bemptyv: "⦰",
	beta: "β",
	beth: "ℶ",
	between: "≬",
	twixt: "≬",
	bfr: "𝔟",
	bigcirc: "◯",
	xcirc: "◯",
	bigodot: "⨀",
	xodot: "⨀",
	bigoplus: "⨁",
	xoplus: "⨁",
	bigotimes: "⨂",
	xotime: "⨂",
	bigsqcup: "⨆",
	xsqcup: "⨆",
	bigstar: "★",
	starf: "★",
	bigtriangledown: "▽",
	xdtri: "▽",
	bigtriangleup: "△",
	xutri: "△",
	biguplus: "⨄",
	xuplus: "⨄",
	bkarow: "⤍",
	rbarr: "⤍",
	blacklozenge: "⧫",
	lozf: "⧫",
	blacktriangle: "▴",
	utrif: "▴",
	blacktriangledown: "▾",
	dtrif: "▾",
	blacktriangleleft: "◂",
	ltrif: "◂",
	blacktriangleright: "▸",
	rtrif: "▸",
	blank: "␣",
	blk12: "▒",
	blk14: "░",
	blk34: "▓",
	block: "█",
	bne: "=⃥",
	bnequiv: "≡⃥",
	bnot: "⌐",
	bopf: "𝕓",
	bowtie: "⋈",
	boxDL: "╗",
	boxDR: "╔",
	boxDl: "╖",
	boxDr: "╓",
	boxH: "═",
	boxHD: "╦",
	boxHU: "╩",
	boxHd: "╤",
	boxHu: "╧",
	boxUL: "╝",
	boxUR: "╚",
	boxUl: "╜",
	boxUr: "╙",
	boxV: "║",
	boxVH: "╬",
	boxVL: "╣",
	boxVR: "╠",
	boxVh: "╫",
	boxVl: "╢",
	boxVr: "╟",
	boxbox: "⧉",
	boxdL: "╕",
	boxdR: "╒",
	boxdl: "┐",
	boxdr: "┌",
	boxhD: "╥",
	boxhU: "╨",
	boxhd: "┬",
	boxhu: "┴",
	boxminus: "⊟",
	minusb: "⊟",
	boxplus: "⊞",
	plusb: "⊞",
	boxtimes: "⊠",
	timesb: "⊠",
	boxuL: "╛",
	boxuR: "╘",
	boxul: "┘",
	boxur: "└",
	boxv: "│",
	boxvH: "╪",
	boxvL: "╡",
	boxvR: "╞",
	boxvh: "┼",
	boxvl: "┤",
	boxvr: "├",
	brvbar: "¦",
	bscr: "𝒷",
	bsemi: "⁏",
	bsol: "\\",
	bsolb: "⧅",
	bsolhsub: "⟈",
	bull: "•",
	bullet: "•",
	bumpE: "⪮",
	cacute: "ć",
	cap: "∩",
	capand: "⩄",
	capbrcup: "⩉",
	capcap: "⩋",
	capcup: "⩇",
	capdot: "⩀",
	caps: "∩︀",
	caret: "⁁",
	ccaps: "⩍",
	ccaron: "č",
	ccedil: "ç",
	ccirc: "ĉ",
	ccups: "⩌",
	ccupssm: "⩐",
	cdot: "ċ",
	cemptyv: "⦲",
	cent: "¢",
	cfr: "𝔠",
	chcy: "ч",
	check: "✓",
	checkmark: "✓",
	chi: "χ",
	cir: "○",
	cirE: "⧃",
	circ: "ˆ",
	circeq: "≗",
	cire: "≗",
	circlearrowleft: "↺",
	olarr: "↺",
	circlearrowright: "↻",
	orarr: "↻",
	circledS: "Ⓢ",
	oS: "Ⓢ",
	circledast: "⊛",
	oast: "⊛",
	circledcirc: "⊚",
	ocir: "⊚",
	circleddash: "⊝",
	odash: "⊝",
	cirfnint: "⨐",
	cirmid: "⫯",
	cirscir: "⧂",
	clubs: "♣",
	clubsuit: "♣",
	colon: ":",
	comma: ",",
	commat: "@",
	comp: "∁",
	complement: "∁",
	congdot: "⩭",
	copf: "𝕔",
	copysr: "℗",
	crarr: "↵",
	cross: "✗",
	cscr: "𝒸",
	csub: "⫏",
	csube: "⫑",
	csup: "⫐",
	csupe: "⫒",
	ctdot: "⋯",
	cudarrl: "⤸",
	cudarrr: "⤵",
	cuepr: "⋞",
	curlyeqprec: "⋞",
	cuesc: "⋟",
	curlyeqsucc: "⋟",
	cularr: "↶",
	curvearrowleft: "↶",
	cularrp: "⤽",
	cup: "∪",
	cupbrcap: "⩈",
	cupcap: "⩆",
	cupcup: "⩊",
	cupdot: "⊍",
	cupor: "⩅",
	cups: "∪︀",
	curarr: "↷",
	curvearrowright: "↷",
	curarrm: "⤼",
	curlyvee: "⋎",
	cuvee: "⋎",
	curlywedge: "⋏",
	cuwed: "⋏",
	curren: "¤",
	cwint: "∱",
	cylcty: "⌭",
	dHar: "⥥",
	dagger: "†",
	daleth: "ℸ",
	dash: "‐",
	hyphen: "‐",
	dbkarow: "⤏",
	rBarr: "⤏",
	dcaron: "ď",
	dcy: "д",
	ddarr: "⇊",
	downdownarrows: "⇊",
	ddotseq: "⩷",
	eDDot: "⩷",
	deg: "°",
	delta: "δ",
	demptyv: "⦱",
	dfisht: "⥿",
	dfr: "𝔡",
	diamondsuit: "♦",
	diams: "♦",
	digamma: "ϝ",
	gammad: "ϝ",
	disin: "⋲",
	div: "÷",
	divide: "÷",
	divideontimes: "⋇",
	divonx: "⋇",
	djcy: "ђ",
	dlcorn: "⌞",
	llcorner: "⌞",
	dlcrop: "⌍",
	dollar: "$",
	dopf: "𝕕",
	doteqdot: "≑",
	eDot: "≑",
	dotminus: "∸",
	minusd: "∸",
	dotplus: "∔",
	plusdo: "∔",
	dotsquare: "⊡",
	sdotb: "⊡",
	drcorn: "⌟",
	lrcorner: "⌟",
	drcrop: "⌌",
	dscr: "𝒹",
	dscy: "ѕ",
	dsol: "⧶",
	dstrok: "đ",
	dtdot: "⋱",
	dtri: "▿",
	triangledown: "▿",
	dwangle: "⦦",
	dzcy: "џ",
	dzigrarr: "⟿",
	eacute: "é",
	easter: "⩮",
	ecaron: "ě",
	ecir: "≖",
	eqcirc: "≖",
	ecirc: "ê",
	ecolon: "≕",
	eqcolon: "≕",
	ecy: "э",
	edot: "ė",
	efDot: "≒",
	fallingdotseq: "≒",
	efr: "𝔢",
	eg: "⪚",
	egrave: "è",
	egs: "⪖",
	eqslantgtr: "⪖",
	egsdot: "⪘",
	el: "⪙",
	elinters: "⏧",
	ell: "ℓ",
	els: "⪕",
	eqslantless: "⪕",
	elsdot: "⪗",
	emacr: "ē",
	empty: "∅",
	emptyset: "∅",
	emptyv: "∅",
	varnothing: "∅",
	emsp13: " ",
	emsp14: " ",
	emsp: " ",
	eng: "ŋ",
	ensp: " ",
	eogon: "ę",
	eopf: "𝕖",
	epar: "⋕",
	eparsl: "⧣",
	eplus: "⩱",
	epsi: "ε",
	epsilon: "ε",
	epsiv: "ϵ",
	straightepsilon: "ϵ",
	varepsilon: "ϵ",
	equals: "=",
	equest: "≟",
	questeq: "≟",
	equivDD: "⩸",
	eqvparsl: "⧥",
	erDot: "≓",
	risingdotseq: "≓",
	erarr: "⥱",
	escr: "ℯ",
	eta: "η",
	eth: "ð",
	euml: "ë",
	euro: "€",
	excl: "!",
	fcy: "ф",
	female: "♀",
	ffilig: "ﬃ",
	fflig: "ﬀ",
	ffllig: "ﬄ",
	ffr: "𝔣",
	filig: "ﬁ",
	fjlig: "fj",
	flat: "♭",
	fllig: "ﬂ",
	fltns: "▱",
	fnof: "ƒ",
	fopf: "𝕗",
	fork: "⋔",
	pitchfork: "⋔",
	forkv: "⫙",
	fpartint: "⨍",
	frac12: "½",
	half: "½",
	frac13: "⅓",
	frac14: "¼",
	frac15: "⅕",
	frac16: "⅙",
	frac18: "⅛",
	frac23: "⅔",
	frac25: "⅖",
	frac34: "¾",
	frac35: "⅗",
	frac38: "⅜",
	frac45: "⅘",
	frac56: "⅚",
	frac58: "⅝",
	frac78: "⅞",
	frasl: "⁄",
	frown: "⌢",
	sfrown: "⌢",
	fscr: "𝒻",
	gEl: "⪌",
	gtreqqless: "⪌",
	gacute: "ǵ",
	gamma: "γ",
	gap: "⪆",
	gtrapprox: "⪆",
	gbreve: "ğ",
	gcirc: "ĝ",
	gcy: "г",
	gdot: "ġ",
	gescc: "⪩",
	gesdot: "⪀",
	gesdoto: "⪂",
	gesdotol: "⪄",
	gesl: "⋛︀",
	gesles: "⪔",
	gfr: "𝔤",
	gimel: "ℷ",
	gjcy: "ѓ",
	glE: "⪒",
	gla: "⪥",
	glj: "⪤",
	gnE: "≩",
	gneqq: "≩",
	gnap: "⪊",
	gnapprox: "⪊",
	gne: "⪈",
	gneq: "⪈",
	gnsim: "⋧",
	gopf: "𝕘",
	gscr: "ℊ",
	gsime: "⪎",
	gsiml: "⪐",
	gtcc: "⪧",
	gtcir: "⩺",
	gtdot: "⋗",
	gtrdot: "⋗",
	gtlPar: "⦕",
	gtquest: "⩼",
	gtrarr: "⥸",
	gvertneqq: "≩︀",
	gvnE: "≩︀",
	hardcy: "ъ",
	harrcir: "⥈",
	harrw: "↭",
	leftrightsquigarrow: "↭",
	hbar: "ℏ",
	hslash: "ℏ",
	planck: "ℏ",
	plankv: "ℏ",
	hcirc: "ĥ",
	hearts: "♥",
	heartsuit: "♥",
	hellip: "…",
	mldr: "…",
	hercon: "⊹",
	hfr: "𝔥",
	hksearow: "⤥",
	searhk: "⤥",
	hkswarow: "⤦",
	swarhk: "⤦",
	hoarr: "⇿",
	homtht: "∻",
	hookleftarrow: "↩",
	larrhk: "↩",
	hookrightarrow: "↪",
	rarrhk: "↪",
	hopf: "𝕙",
	horbar: "―",
	hscr: "𝒽",
	hstrok: "ħ",
	hybull: "⁃",
	iacute: "í",
	icirc: "î",
	icy: "и",
	iecy: "е",
	iexcl: "¡",
	ifr: "𝔦",
	igrave: "ì",
	iiiint: "⨌",
	qint: "⨌",
	iiint: "∭",
	tint: "∭",
	iinfin: "⧜",
	iiota: "℩",
	ijlig: "ĳ",
	imacr: "ī",
	imath: "ı",
	inodot: "ı",
	imof: "⊷",
	imped: "Ƶ",
	incare: "℅",
	infin: "∞",
	infintie: "⧝",
	intcal: "⊺",
	intercal: "⊺",
	intlarhk: "⨗",
	intprod: "⨼",
	iprod: "⨼",
	iocy: "ё",
	iogon: "į",
	iopf: "𝕚",
	iota: "ι",
	iquest: "¿",
	iscr: "𝒾",
	isinE: "⋹",
	isindot: "⋵",
	isins: "⋴",
	isinsv: "⋳",
	itilde: "ĩ",
	iukcy: "і",
	iuml: "ï",
	jcirc: "ĵ",
	jcy: "й",
	jfr: "𝔧",
	jmath: "ȷ",
	jopf: "𝕛",
	jscr: "𝒿",
	jsercy: "ј",
	jukcy: "є",
	kappa: "κ",
	kappav: "ϰ",
	varkappa: "ϰ",
	kcedil: "ķ",
	kcy: "к",
	kfr: "𝔨",
	kgreen: "ĸ",
	khcy: "х",
	kjcy: "ќ",
	kopf: "𝕜",
	kscr: "𝓀",
	lAtail: "⤛",
	lBarr: "⤎",
	lEg: "⪋",
	lesseqqgtr: "⪋",
	lHar: "⥢",
	lacute: "ĺ",
	laemptyv: "⦴",
	lambda: "λ",
	langd: "⦑",
	lap: "⪅",
	lessapprox: "⪅",
	laquo: "«",
	larrbfs: "⤟",
	larrfs: "⤝",
	larrlp: "↫",
	looparrowleft: "↫",
	larrpl: "⤹",
	larrsim: "⥳",
	larrtl: "↢",
	leftarrowtail: "↢",
	lat: "⪫",
	latail: "⤙",
	late: "⪭",
	lates: "⪭︀",
	lbarr: "⤌",
	lbbrk: "❲",
	lbrace: "{",
	lcub: "{",
	lbrack: "[",
	lsqb: "[",
	lbrke: "⦋",
	lbrksld: "⦏",
	lbrkslu: "⦍",
	lcaron: "ľ",
	lcedil: "ļ",
	lcy: "л",
	ldca: "⤶",
	ldrdhar: "⥧",
	ldrushar: "⥋",
	ldsh: "↲",
	le: "≤",
	leq: "≤",
	leftleftarrows: "⇇",
	llarr: "⇇",
	leftthreetimes: "⋋",
	lthree: "⋋",
	lescc: "⪨",
	lesdot: "⩿",
	lesdoto: "⪁",
	lesdotor: "⪃",
	lesg: "⋚︀",
	lesges: "⪓",
	lessdot: "⋖",
	ltdot: "⋖",
	lfisht: "⥼",
	lfr: "𝔩",
	lgE: "⪑",
	lharul: "⥪",
	lhblk: "▄",
	ljcy: "љ",
	llhard: "⥫",
	lltri: "◺",
	lmidot: "ŀ",
	lmoust: "⎰",
	lmoustache: "⎰",
	lnE: "≨",
	lneqq: "≨",
	lnap: "⪉",
	lnapprox: "⪉",
	lne: "⪇",
	lneq: "⪇",
	lnsim: "⋦",
	loang: "⟬",
	loarr: "⇽",
	longmapsto: "⟼",
	xmap: "⟼",
	looparrowright: "↬",
	rarrlp: "↬",
	lopar: "⦅",
	lopf: "𝕝",
	loplus: "⨭",
	lotimes: "⨴",
	lowast: "∗",
	loz: "◊",
	lozenge: "◊",
	lpar: "(",
	lparlt: "⦓",
	lrhard: "⥭",
	lrm: "‎",
	lrtri: "⊿",
	lsaquo: "‹",
	lscr: "𝓁",
	lsime: "⪍",
	lsimg: "⪏",
	lsquor: "‚",
	sbquo: "‚",
	lstrok: "ł",
	ltcc: "⪦",
	ltcir: "⩹",
	ltimes: "⋉",
	ltlarr: "⥶",
	ltquest: "⩻",
	ltrPar: "⦖",
	ltri: "◃",
	triangleleft: "◃",
	lurdshar: "⥊",
	luruhar: "⥦",
	lvertneqq: "≨︀",
	lvnE: "≨︀",
	mDDot: "∺",
	macr: "¯",
	strns: "¯",
	male: "♂",
	malt: "✠",
	maltese: "✠",
	marker: "▮",
	mcomma: "⨩",
	mcy: "м",
	mdash: "—",
	mfr: "𝔪",
	mho: "℧",
	micro: "µ",
	midcir: "⫰",
	minus: "−",
	minusdu: "⨪",
	mlcp: "⫛",
	models: "⊧",
	mopf: "𝕞",
	mscr: "𝓂",
	mu: "μ",
	multimap: "⊸",
	mumap: "⊸",
	nGg: "⋙̸",
	nGt: "≫⃒",
	nLeftarrow: "⇍",
	nlArr: "⇍",
	nLeftrightarrow: "⇎",
	nhArr: "⇎",
	nLl: "⋘̸",
	nLt: "≪⃒",
	nRightarrow: "⇏",
	nrArr: "⇏",
	nVDash: "⊯",
	nVdash: "⊮",
	nacute: "ń",
	nang: "∠⃒",
	napE: "⩰̸",
	napid: "≋̸",
	napos: "ŉ",
	natur: "♮",
	natural: "♮",
	ncap: "⩃",
	ncaron: "ň",
	ncedil: "ņ",
	ncongdot: "⩭̸",
	ncup: "⩂",
	ncy: "н",
	ndash: "–",
	neArr: "⇗",
	nearhk: "⤤",
	nedot: "≐̸",
	nesear: "⤨",
	toea: "⤨",
	nfr: "𝔫",
	nharr: "↮",
	nleftrightarrow: "↮",
	nhpar: "⫲",
	nis: "⋼",
	nisd: "⋺",
	njcy: "њ",
	nlE: "≦̸",
	nleqq: "≦̸",
	nlarr: "↚",
	nleftarrow: "↚",
	nldr: "‥",
	nopf: "𝕟",
	not: "¬",
	notinE: "⋹̸",
	notindot: "⋵̸",
	notinvb: "⋷",
	notinvc: "⋶",
	notnivb: "⋾",
	notnivc: "⋽",
	nparsl: "⫽⃥",
	npart: "∂̸",
	npolint: "⨔",
	nrarr: "↛",
	nrightarrow: "↛",
	nrarrc: "⤳̸",
	nrarrw: "↝̸",
	nscr: "𝓃",
	nsub: "⊄",
	nsubE: "⫅̸",
	nsubseteqq: "⫅̸",
	nsup: "⊅",
	nsupE: "⫆̸",
	nsupseteqq: "⫆̸",
	ntilde: "ñ",
	nu: "ν",
	num: "#",
	numero: "№",
	numsp: " ",
	nvDash: "⊭",
	nvHarr: "⤄",
	nvap: "≍⃒",
	nvdash: "⊬",
	nvge: "≥⃒",
	nvgt: ">⃒",
	nvinfin: "⧞",
	nvlArr: "⤂",
	nvle: "≤⃒",
	nvlt: "<⃒",
	nvltrie: "⊴⃒",
	nvrArr: "⤃",
	nvrtrie: "⊵⃒",
	nvsim: "∼⃒",
	nwArr: "⇖",
	nwarhk: "⤣",
	nwnear: "⤧",
	oacute: "ó",
	ocirc: "ô",
	ocy: "о",
	odblac: "ő",
	odiv: "⨸",
	odsold: "⦼",
	oelig: "œ",
	ofcir: "⦿",
	ofr: "𝔬",
	ogon: "˛",
	ograve: "ò",
	ogt: "⧁",
	ohbar: "⦵",
	olcir: "⦾",
	olcross: "⦻",
	olt: "⧀",
	omacr: "ō",
	omega: "ω",
	omicron: "ο",
	omid: "⦶",
	oopf: "𝕠",
	opar: "⦷",
	operp: "⦹",
	or: "∨",
	vee: "∨",
	ord: "⩝",
	order: "ℴ",
	orderof: "ℴ",
	oscr: "ℴ",
	ordf: "ª",
	ordm: "º",
	origof: "⊶",
	oror: "⩖",
	orslope: "⩗",
	orv: "⩛",
	oslash: "ø",
	osol: "⊘",
	otilde: "õ",
	otimesas: "⨶",
	ouml: "ö",
	ovbar: "⌽",
	para: "¶",
	parsim: "⫳",
	parsl: "⫽",
	pcy: "п",
	percnt: "%",
	period: ".",
	permil: "‰",
	pertenk: "‱",
	pfr: "𝔭",
	phi: "φ",
	phiv: "ϕ",
	straightphi: "ϕ",
	varphi: "ϕ",
	phone: "☎",
	pi: "π",
	piv: "ϖ",
	varpi: "ϖ",
	planckh: "ℎ",
	plus: "+",
	plusacir: "⨣",
	pluscir: "⨢",
	plusdu: "⨥",
	pluse: "⩲",
	plussim: "⨦",
	plustwo: "⨧",
	pointint: "⨕",
	popf: "𝕡",
	pound: "£",
	prE: "⪳",
	prap: "⪷",
	precapprox: "⪷",
	precnapprox: "⪹",
	prnap: "⪹",
	precneqq: "⪵",
	prnE: "⪵",
	precnsim: "⋨",
	prnsim: "⋨",
	prime: "′",
	profalar: "⌮",
	profline: "⌒",
	profsurf: "⌓",
	prurel: "⊰",
	pscr: "𝓅",
	psi: "ψ",
	puncsp: " ",
	qfr: "𝔮",
	qopf: "𝕢",
	qprime: "⁗",
	qscr: "𝓆",
	quatint: "⨖",
	quest: "?",
	rAtail: "⤜",
	rHar: "⥤",
	race: "∽̱",
	racute: "ŕ",
	raemptyv: "⦳",
	rangd: "⦒",
	range: "⦥",
	raquo: "»",
	rarrap: "⥵",
	rarrbfs: "⤠",
	rarrc: "⤳",
	rarrfs: "⤞",
	rarrpl: "⥅",
	rarrsim: "⥴",
	rarrtl: "↣",
	rightarrowtail: "↣",
	rarrw: "↝",
	rightsquigarrow: "↝",
	ratail: "⤚",
	ratio: "∶",
	rbbrk: "❳",
	rbrace: "}",
	rcub: "}",
	rbrack: "]",
	rsqb: "]",
	rbrke: "⦌",
	rbrksld: "⦎",
	rbrkslu: "⦐",
	rcaron: "ř",
	rcedil: "ŗ",
	rcy: "р",
	rdca: "⤷",
	rdldhar: "⥩",
	rdsh: "↳",
	rect: "▭",
	rfisht: "⥽",
	rfr: "𝔯",
	rharul: "⥬",
	rho: "ρ",
	rhov: "ϱ",
	varrho: "ϱ",
	rightrightarrows: "⇉",
	rrarr: "⇉",
	rightthreetimes: "⋌",
	rthree: "⋌",
	ring: "˚",
	rlm: "‏",
	rmoust: "⎱",
	rmoustache: "⎱",
	rnmid: "⫮",
	roang: "⟭",
	roarr: "⇾",
	ropar: "⦆",
	ropf: "𝕣",
	roplus: "⨮",
	rotimes: "⨵",
	rpar: ")",
	rpargt: "⦔",
	rppolint: "⨒",
	rsaquo: "›",
	rscr: "𝓇",
	rtimes: "⋊",
	rtri: "▹",
	triangleright: "▹",
	rtriltri: "⧎",
	ruluhar: "⥨",
	rx: "℞",
	sacute: "ś",
	scE: "⪴",
	scap: "⪸",
	succapprox: "⪸",
	scaron: "š",
	scedil: "ş",
	scirc: "ŝ",
	scnE: "⪶",
	succneqq: "⪶",
	scnap: "⪺",
	succnapprox: "⪺",
	scnsim: "⋩",
	succnsim: "⋩",
	scpolint: "⨓",
	scy: "с",
	sdot: "⋅",
	sdote: "⩦",
	seArr: "⇘",
	sect: "§",
	semi: ";",
	seswar: "⤩",
	tosa: "⤩",
	sext: "✶",
	sfr: "𝔰",
	sharp: "♯",
	shchcy: "щ",
	shcy: "ш",
	shy: "­",
	sigma: "σ",
	sigmaf: "ς",
	sigmav: "ς",
	varsigma: "ς",
	simdot: "⩪",
	simg: "⪞",
	simgE: "⪠",
	siml: "⪝",
	simlE: "⪟",
	simne: "≆",
	simplus: "⨤",
	simrarr: "⥲",
	smashp: "⨳",
	smeparsl: "⧤",
	smile: "⌣",
	ssmile: "⌣",
	smt: "⪪",
	smte: "⪬",
	smtes: "⪬︀",
	softcy: "ь",
	sol: "/",
	solb: "⧄",
	solbar: "⌿",
	sopf: "𝕤",
	spades: "♠",
	spadesuit: "♠",
	sqcaps: "⊓︀",
	sqcups: "⊔︀",
	sscr: "𝓈",
	star: "☆",
	sub: "⊂",
	subset: "⊂",
	subE: "⫅",
	subseteqq: "⫅",
	subdot: "⪽",
	subedot: "⫃",
	submult: "⫁",
	subnE: "⫋",
	subsetneqq: "⫋",
	subne: "⊊",
	subsetneq: "⊊",
	subplus: "⪿",
	subrarr: "⥹",
	subsim: "⫇",
	subsub: "⫕",
	subsup: "⫓",
	sung: "♪",
	sup1: "¹",
	sup2: "²",
	sup3: "³",
	supE: "⫆",
	supseteqq: "⫆",
	supdot: "⪾",
	supdsub: "⫘",
	supedot: "⫄",
	suphsol: "⟉",
	suphsub: "⫗",
	suplarr: "⥻",
	supmult: "⫂",
	supnE: "⫌",
	supsetneqq: "⫌",
	supne: "⊋",
	supsetneq: "⊋",
	supplus: "⫀",
	supsim: "⫈",
	supsub: "⫔",
	supsup: "⫖",
	swArr: "⇙",
	swnwar: "⤪",
	szlig: "ß",
	target: "⌖",
	tau: "τ",
	tcaron: "ť",
	tcedil: "ţ",
	tcy: "т",
	telrec: "⌕",
	tfr: "𝔱",
	theta: "θ",
	thetasym: "ϑ",
	thetav: "ϑ",
	vartheta: "ϑ",
	thorn: "þ",
	times: "×",
	timesbar: "⨱",
	timesd: "⨰",
	topbot: "⌶",
	topcir: "⫱",
	topf: "𝕥",
	topfork: "⫚",
	tprime: "‴",
	triangle: "▵",
	utri: "▵",
	triangleq: "≜",
	trie: "≜",
	tridot: "◬",
	triminus: "⨺",
	triplus: "⨹",
	trisb: "⧍",
	tritime: "⨻",
	trpezium: "⏢",
	tscr: "𝓉",
	tscy: "ц",
	tshcy: "ћ",
	tstrok: "ŧ",
	uHar: "⥣",
	uacute: "ú",
	ubrcy: "ў",
	ubreve: "ŭ",
	ucirc: "û",
	ucy: "у",
	udblac: "ű",
	ufisht: "⥾",
	ufr: "𝔲",
	ugrave: "ù",
	uhblk: "▀",
	ulcorn: "⌜",
	ulcorner: "⌜",
	ulcrop: "⌏",
	ultri: "◸",
	umacr: "ū",
	uogon: "ų",
	uopf: "𝕦",
	upsi: "υ",
	upsilon: "υ",
	upuparrows: "⇈",
	uuarr: "⇈",
	urcorn: "⌝",
	urcorner: "⌝",
	urcrop: "⌎",
	uring: "ů",
	urtri: "◹",
	uscr: "𝓊",
	utdot: "⋰",
	utilde: "ũ",
	uuml: "ü",
	uwangle: "⦧",
	vBar: "⫨",
	vBarv: "⫩",
	vangrt: "⦜",
	varsubsetneq: "⊊︀",
	vsubne: "⊊︀",
	varsubsetneqq: "⫋︀",
	vsubnE: "⫋︀",
	varsupsetneq: "⊋︀",
	vsupne: "⊋︀",
	varsupsetneqq: "⫌︀",
	vsupnE: "⫌︀",
	vcy: "в",
	veebar: "⊻",
	veeeq: "≚",
	vellip: "⋮",
	vfr: "𝔳",
	vopf: "𝕧",
	vscr: "𝓋",
	vzigzag: "⦚",
	wcirc: "ŵ",
	wedbar: "⩟",
	wedgeq: "≙",
	weierp: "℘",
	wp: "℘",
	wfr: "𝔴",
	wopf: "𝕨",
	wscr: "𝓌",
	xfr: "𝔵",
	xi: "ξ",
	xnis: "⋻",
	xopf: "𝕩",
	xscr: "𝓍",
	yacute: "ý",
	yacy: "я",
	ycirc: "ŷ",
	ycy: "ы",
	yen: "¥",
	yfr: "𝔶",
	yicy: "ї",
	yopf: "𝕪",
	yscr: "𝓎",
	yucy: "ю",
	yuml: "ÿ",
	zacute: "ź",
	zcaron: "ž",
	zcy: "з",
	zdot: "ż",
	zeta: "ζ",
	zfr: "𝔷",
	zhcy: "ж",
	zigrarr: "⇝",
	zopf: "𝕫",
	zscr: "𝓏",
	zwj: "‍",
	zwnj: "‌"
};
_e$1.ngsp = "";
var za = class {
	tokens;
	errors;
	nonNormalizedIcuExpressions;
	constructor(e, t, r) {
		this.tokens = e, this.errors = t, this.nonNormalizedIcuExpressions = r;
	}
};
function Di$1(e, t, r, n = {}) {
	let i = new Qa(new rt$1(e, t), r, n);
	return i.tokenize(), new za(no$1(i.tokens), i.errors, i.nonNormalizedIcuExpressions);
}
var Ga = /\r\n?/g;
function Se$1(e) {
	return `Unexpected character "${e === 0 ? "EOF" : String.fromCharCode(e)}"`;
}
function xi$1(e) {
	return `Unknown entity "${e}" - use the "&#<decimal>;" or  "&#x<hex>;" syntax`;
}
function $a(e, t) {
	return `Unable to parse entity "${t}" - ${e} character reference entities must end with ";"`;
}
var ja = [
	"@if",
	"@else",
	"@for",
	"@switch",
	"@case",
	"@default",
	"@empty",
	"@defer",
	"@placeholder",
	"@loading",
	"@boundary",
	"@error",
	"@content"
];
var it$1 = {
	start: "{{",
	end: "}}"
};
var Ya = /^default[^\S\r\n]+never/;
var Ka = /^else[^\S\r\n]+if/;
var Qa = class {
	_getTagContentType;
	_cursor;
	_tokenizeIcu;
	_leadingTriviaCodePoints;
	_canSelfClose;
	_allowHtmComponentClosingTags;
	_allowStartTagComments;
	_currentTokenStart = null;
	_currentTokenType = null;
	_expansionCaseStack = [];
	_openDirectiveCount = 0;
	_inInterpolation = !1;
	_preserveLineEndings;
	_i18nNormalizeLineEndingsInICUs;
	_fullNameStack = [];
	_tokenizeBlocks;
	_tokenizeLet;
	_selectorlessEnabled;
	tokens = [];
	errors = [];
	nonNormalizedIcuExpressions = [];
	constructor(e, t, r) {
		this._getTagContentType = t, this._tokenizeIcu = r.tokenizeExpansionForms || !1, this._leadingTriviaCodePoints = r.leadingTriviaChars && r.leadingTriviaChars.map((i) => i.codePointAt(0) || 0), this._canSelfClose = r.canSelfClose || !1, this._allowHtmComponentClosingTags = r.allowHtmComponentClosingTags || !1, this._allowStartTagComments = r.allowStartTagComments ?? !0;
		let n = r.range || {
			endPos: e.content.length,
			startPos: 0,
			startLine: 0,
			startCol: 0
		};
		this._cursor = r.escapedString ? new io$1(e, n) : new Ii$1(e, n), this._preserveLineEndings = r.preserveLineEndings || !1, this._i18nNormalizeLineEndingsInICUs = r.i18nNormalizeLineEndingsInICUs || !1, this._tokenizeBlocks = r.tokenizeBlocks ?? !0, this._tokenizeLet = r.tokenizeLet ?? !0, this._selectorlessEnabled = r.selectorlessEnabled ?? !1;
		try {
			this._cursor.init();
		} catch (i) {
			this.handleError(i);
		}
	}
	_processCarriageReturns(e) {
		return this._preserveLineEndings ? e : e.replace(Ga, `
`);
	}
	tokenize() {
		for (; this._cursor.peek() !== 0;) {
			let e = this._cursor.clone();
			try {
				if (this._attemptCharCode(60)) if (this._attemptCharCode(33)) this._attemptStr("[CDATA[") ? this._consumeCdata(e) : this._attemptStr("--") ? this._consumeComment(e) : this._attemptStrCaseInsensitive("doctype") ? this._consumeDocType(e) : this._consumeBogusComment(e);
				else if (this._attemptCharCode(47)) this._consumeTagClose(e);
				else {
					let t = this._cursor.clone();
					this._attemptCharCode(63) ? (this._cursor = t, this._consumeBogusComment(e)) : this._consumeTagOpen(e);
				}
				else this._tokenizeLet && this._cursor.peek() === 64 && !this._inInterpolation && this._isLetStart() ? this._consumeLetDeclaration(e) : this._tokenizeBlocks && this._isBlockStart() ? this._consumeBlockStart(e) : this._tokenizeBlocks && !this._inInterpolation && !this._isInExpansionCase() && !this._isInExpansionForm() && this._attemptCharCode(125) ? this._consumeBlockEnd(e) : this._tokenizeIcu && this._tokenizeExpansionForm() || this._consumeWithInterpolation(5, 8, () => this._isTextEnd(), () => this._isTagStart());
			} catch (t) {
				this.handleError(t);
			}
		}
		this._beginToken(44), this._endToken([]);
	}
	_getBlockName() {
		let e = !1, t = this._cursor.clone();
		this._attemptCharCodeUntilFn((n) => nt$1(n) ? !e : ro$1(n) ? (e = !0, !1) : !0);
		let r = this._cursor.getChars(t).trim();
		return Ka.test(r) ? r = "else if" : Ya.test(r) && (r = "default never"), r;
	}
	_consumeBlockStart(e) {
		this._requireCharCode(64), this._beginToken(26, e);
		let t = this._endToken([this._getBlockName()]);
		if (this._cursor.peek() === 40) if (this._cursor.advance(), this._consumeBlockParameters(), this._attemptCharCodeUntilFn(b$1), this._attemptCharCode(41)) this._attemptCharCodeUntilFn(b$1);
		else {
			t.type = 30;
			return;
		}
		if (t.parts[0] === "default never" && this._attemptCharCode(59)) {
			this._beginToken(27), this._endToken([]), this._beginToken(28), this._endToken([]);
			return;
		}
		this._attemptCharCode(123) ? (this._beginToken(27), this._endToken([])) : this._isBlockStart() && (t.parts[0] === "case" || t.parts[0] === "default") ? (this._beginToken(27), this._endToken([]), this._beginToken(28), this._endToken([])) : t.type = 30;
	}
	_consumeBlockEnd(e) {
		this._beginToken(28, e), this._endToken([]);
	}
	_consumeBlockParameters() {
		for (this._attemptCharCodeUntilFn(Ai$1); this._cursor.peek() !== 41 && this._cursor.peek() !== 0;) {
			this._beginToken(29);
			let e = this._cursor.clone(), t = null, r = 0;
			for (; this._cursor.peek() !== 59 && this._cursor.peek() !== 0 || t !== null;) {
				let n = this._cursor.peek();
				if (n === 92) this._cursor.advance();
				else if (n === t) t = null;
				else if (t === null && Rt$1(n)) t = n;
				else if (n === 40 && t === null) r++;
				else if (n === 41 && t === null) {
					if (r === 0) break;
					r > 0 && r--;
				}
				this._cursor.advance();
			}
			this._endToken([this._cursor.getChars(e)]), this._attemptCharCodeUntilFn(Ai$1);
		}
	}
	_consumeLetDeclaration(e) {
		if (this._requireStr("@let"), this._beginToken(31, e), nt$1(this._cursor.peek())) this._attemptCharCodeUntilFn(b$1);
		else {
			let r = this._endToken([this._cursor.getChars(e)]);
			r.type = 34;
			return;
		}
		let t = this._endToken([this._getLetDeclarationName()]);
		if (this._attemptCharCodeUntilFn(b$1), !this._attemptCharCode(61)) {
			t.type = 34;
			return;
		}
		this._attemptCharCodeUntilFn((r) => b$1(r) && !Oe$1(r)), this._consumeLetDeclarationValue(), this._cursor.peek() === 59 ? (this._beginToken(33), this._cursor.advance(), this._endToken([])) : (t.type = 34, t.sourceSpan = this._cursor.getSpan(e));
	}
	_getLetDeclarationName() {
		let e = this._cursor.clone(), t = !1;
		return this._attemptCharCodeUntilFn((r) => Re$1(r) || r === 36 || r === 95 || t && Ie$1(r) ? (t = !0, !1) : !0), this._cursor.getChars(e).trim();
	}
	_consumeLetDeclarationValue() {
		let e = this._cursor.clone();
		this._beginToken(32, e), this._attemptUntilIgnoreQuotes((t) => t === 59), this._endToken([this._cursor.getChars(e)]);
	}
	_tokenizeExpansionForm() {
		if (this.isExpansionFormStart()) return this._consumeExpansionFormStart(), !0;
		if (eo$1(this._cursor.peek()) && this._isInExpansionForm()) return this._consumeExpansionCaseStart(), !0;
		if (this._cursor.peek() === 125) {
			if (this._isInExpansionCase()) return this._consumeExpansionCaseEnd(), !0;
			if (this._isInExpansionForm()) return this._consumeExpansionFormEnd(), !0;
		}
		return !1;
	}
	_beginToken(e, t = this._cursor.clone()) {
		this._currentTokenStart = t, this._currentTokenType = e;
	}
	_endToken(e, t) {
		if (this._currentTokenStart === null) throw new re$1(this._cursor.getSpan(t), "Programming error - attempted to end a token when there was no start to the token");
		if (this._currentTokenType === null) throw new re$1(this._cursor.getSpan(this._currentTokenStart), "Programming error - attempted to end a token which has no token type");
		let r = {
			type: this._currentTokenType,
			parts: e,
			sourceSpan: (t ?? this._cursor).getSpan(this._currentTokenStart, this._leadingTriviaCodePoints)
		};
		return this.tokens.push(r), this._currentTokenStart = null, this._currentTokenType = null, r;
	}
	_createError(e, t) {
		this._isInExpansionForm() && (e += ` (Do you have an unescaped "{" in your template? Use "{{ '{' }}") to escape it.)`);
		let r = new re$1(t, e);
		return this._currentTokenStart = null, this._currentTokenType = null, r;
	}
	handleError(e) {
		if (e instanceof Cr$1 && (e = this._createError(e.msg, this._cursor.getSpan(e.cursor))), e instanceof re$1) this.errors.push(e);
		else throw e;
	}
	_attemptCharCode(e) {
		return this._cursor.peek() === e ? (this._cursor.advance(), !0) : !1;
	}
	_attemptCharCodeCaseInsensitive(e) {
		return to$1(this._cursor.peek(), e) ? (this._cursor.advance(), !0) : !1;
	}
	_requireCharCode(e) {
		let t = this._cursor.clone();
		if (!this._attemptCharCode(e)) throw this._createError(Se$1(this._cursor.peek()), this._cursor.getSpan(t));
	}
	_attemptStr(e) {
		let t = e.length;
		if (this._cursor.charsLeft() < t) return !1;
		let r = this._cursor.clone();
		for (let n = 0; n < t; n++) if (!this._attemptCharCode(e.charCodeAt(n))) return this._cursor = r, !1;
		return !0;
	}
	_attemptStrCaseInsensitive(e) {
		for (let t = 0; t < e.length; t++) if (!this._attemptCharCodeCaseInsensitive(e.charCodeAt(t))) return !1;
		return !0;
	}
	_requireStr(e) {
		let t = this._cursor.clone();
		if (!this._attemptStr(e)) throw this._createError(Se$1(this._cursor.peek()), this._cursor.getSpan(t));
	}
	_requireStrCaseInsensitive(e) {
		let t = this._cursor.clone();
		if (!this._attemptStrCaseInsensitive(e)) throw this._createError(Se$1(this._cursor.peek()), this._cursor.getSpan(t));
	}
	_attemptCharCodeUntilFn(e) {
		for (; !e(this._cursor.peek());) this._cursor.advance();
	}
	_requireCharCodeUntilFn(e, t) {
		let r = this._cursor.clone();
		if (this._attemptCharCodeUntilFn(e), this._cursor.diff(r) < t) throw this._createError(Se$1(this._cursor.peek()), this._cursor.getSpan(r));
	}
	_attemptUntilChar(e) {
		for (; this._cursor.peek() !== e;) this._cursor.advance();
	}
	_attemptUntilIgnoreQuotes(e) {
		for (; this._cursor.peek() !== 0;) {
			let t = this._cursor.peek();
			if (e(t)) break;
			Rt$1(t) && (this._cursor.advance(), this._attemptCharCodeUntilFn((r) => r === 92 ? (this._cursor.advance(), !1) : r === t)), this._cursor.advance();
		}
	}
	_readChar() {
		let e = String.fromCodePoint(this._cursor.peek());
		return this._cursor.advance(), e;
	}
	_peekStr(e) {
		let t = e.length;
		if (this._cursor.charsLeft() < t) return !1;
		let r = this._cursor.clone();
		for (let n = 0; n < t; n++) {
			if (r.peek() !== e.charCodeAt(n)) return !1;
			r.advance();
		}
		return !0;
	}
	_isBlockStart() {
		return this._cursor.peek() === 64 && ja.some((e) => this._peekStr(e));
	}
	_isLetStart() {
		return this._cursor.peek() === 64 && this._peekStr("@let");
	}
	_consumeEntity(e) {
		this._beginToken(9);
		let t = this._cursor.clone();
		if (this._cursor.advance(), this._attemptCharCode(35)) {
			let r = this._attemptCharCode(120) || this._attemptCharCode(88), n = this._cursor.clone();
			if (this._attemptCharCodeUntilFn(Ja), this._cursor.peek() != 59) {
				this._cursor.advance();
				let s = r ? "hexadecimal" : "decimal";
				throw this._createError($a(s, this._cursor.getChars(t)), this._cursor.getSpan());
			}
			let i = this._cursor.getChars(n);
			this._cursor.advance();
			try {
				let s = parseInt(i, r ? 16 : 10);
				this._endToken([String.fromCodePoint(s), this._cursor.getChars(t)]);
			} catch {
				throw this._createError(xi$1(this._cursor.getChars(t)), this._cursor.getSpan());
			}
		} else {
			let r = this._cursor.clone();
			if (this._attemptCharCodeUntilFn(Za), this._cursor.peek() != 59) this._beginToken(e, t), this._cursor = r, this._endToken(["&"]);
			else {
				let n = this._cursor.getChars(r);
				this._cursor.advance();
				let i = Y$1(_e$1, n) && _e$1[n];
				if (!i) throw this._createError(xi$1(n), this._cursor.getSpan(t));
				this._endToken([i, `&${n};`]);
			}
		}
	}
	_consumeRawText(e, t) {
		this._beginToken(e ? 6 : 7);
		let r = [];
		for (;;) {
			let n = this._cursor.clone(), i = t();
			if (this._cursor = n, i) break;
			e && this._cursor.peek() === 38 ? (this._endToken([this._processCarriageReturns(r.join(""))]), r.length = 0, this._consumeEntity(6), this._beginToken(6)) : r.push(this._readChar());
		}
		this._endToken([this._processCarriageReturns(r.join(""))]);
	}
	_consumeComment(e) {
		this._beginToken(10, e), this._endToken([]), this._consumeRawText(!1, () => this._attemptStr("-->")), this._beginToken(11), this._requireStr("-->"), this._endToken([]);
	}
	_consumeBogusComment(e) {
		this._beginToken(10, e), this._endToken([]), this._consumeRawText(!1, () => this._cursor.peek() === 62), this._beginToken(11), this._cursor.advance(), this._endToken([]);
	}
	_consumeCdata(e) {
		this._beginToken(13, e), this._endToken([]), this._consumeRawText(!1, () => this._attemptStr("]]>")), this._beginToken(14), this._requireStr("]]>"), this._endToken([]);
	}
	_consumeDocType(e) {
		this._beginToken(19, e), this._endToken([]), this._consumeRawText(!1, () => this._cursor.peek() === 62), this._beginToken(20), this._cursor.advance(), this._endToken([]);
	}
	_consumeProcessingInstruction(e) {
		this._beginToken(43, e);
		let t = this._cursor.clone();
		this._attemptUntilIgnoreQuotes((i) => i === 63 || i === 62);
		let r = this._cursor.peek(), n = this._cursor.getChars(t);
		this._cursor.advance(), r === 63 && this._requireCharCode(62), this._endToken([n]);
	}
	_consumePrefixAndName(e) {
		let t = this._cursor.clone(), r = "";
		for (; this._cursor.peek() !== 58 && !Xa(this._cursor.peek());) this._cursor.advance();
		let n;
		this._cursor.peek() === 58 ? (r = this._cursor.getChars(t), this._cursor.advance(), n = this._cursor.clone()) : n = t, this._requireCharCodeUntilFn(e, r === "" ? 0 : 1);
		let i = this._cursor.getChars(n);
		return [r, i];
	}
	_consumeSingleLineComment(e) {
		let t = this._cursor.clone();
		this._attemptCharCodeUntilFn((i) => Oe$1(i) || i === 0);
		let r = this._cursor.clone(), n = r.getChars(t);
		this._beginToken(12, e), this._endToken([n, "single"], r), this._attemptCharCodeUntilFn(b$1);
	}
	_consumeMultiLineComment(e) {
		let t = this._cursor.clone();
		this._attemptCharCodeUntilFn((s) => {
			if (s === 0) return !0;
			if (s === 42) {
				let a = this._cursor.clone();
				return a.advance(), a.peek() === 47;
			}
			return !1;
		});
		let r = this._cursor.clone(), n = r.getChars(t), i = r;
		this._attemptStr("*/") && (i = this._cursor.clone(), this._attemptCharCodeUntilFn(b$1)), this._beginToken(12, e), this._endToken([n, "multi"], i);
	}
	_consumeTagOpen(e) {
		let t, r, n, i, s = [];
		try {
			if (this._selectorlessEnabled && Ot$1(this._cursor.peek())) i = this._consumeComponentOpenStart(e), [n, r, t] = i.parts, r && (n += `:${r}`), t && (n += `:${t}`), this._attemptCharCodeUntilFn(b$1);
			else {
				if (!Re$1(this._cursor.peek())) throw this._createError(Se$1(this._cursor.peek()), this._cursor.getSpan(e));
				i = this._consumeTagOpenStart(e), r = i.parts[0], t = n = i.parts[1], this._attemptCharCodeUntilFn(b$1);
			}
			for (;;) {
				if (this._allowStartTagComments) {
					let o = this._cursor.clone();
					if (this._attemptStr("//")) {
						this._consumeSingleLineComment(o);
						continue;
					}
					if (this._attemptStr("/*")) {
						this._consumeMultiLineComment(o);
						continue;
					}
				}
				if (Ni$1(this._cursor.peek())) break;
				if (this._selectorlessEnabled && this._cursor.peek() === 64) {
					let o = this._cursor.clone(), l = o.clone();
					l.advance(), Ot$1(l.peek()) && this._consumeDirective(o, l);
				} else {
					let o = this._consumeAttribute();
					s.push(o);
				}
			}
			i.type === 35 ? this._consumeComponentOpenEnd() : this._consumeTagOpenEnd();
		} catch (o) {
			if (o instanceof re$1) {
				i ? i.type = i.type === 35 ? 39 : 4 : (this._beginToken(5, e), this._endToken(["<"]));
				return;
			}
			throw o;
		}
		if (this._canSelfClose && this.tokens[this.tokens.length - 1].type === 2) return;
		let a = this._getTagContentType(t, r, this._fullNameStack.length > 0, s);
		this._handleFullNameStackForTagOpen(r, t), a === 0 ? this._consumeRawTextWithTagClose(r, i, n, !1) : a === 1 && this._consumeRawTextWithTagClose(r, i, n, !0);
	}
	_consumeRawTextWithTagClose(e, t, r, n) {
		this._consumeRawText(n, () => !this._attemptCharCode(60) || !this._attemptCharCode(47) || (this._attemptCharCodeUntilFn(b$1), !this._attemptStrCaseInsensitive(e && t.type !== 35 ? `${e}:${r}` : r)) ? !1 : (this._attemptCharCodeUntilFn(b$1), this._attemptCharCode(62))), this._beginToken(t.type === 35 ? 38 : 3), this._requireCharCodeUntilFn((i) => i === 62, 3), this._cursor.advance(), this._endToken(t.parts), this._handleFullNameStackForTagClose(e, r);
	}
	_consumeTagOpenStart(e) {
		this._beginToken(0, e);
		let t = this._consumePrefixAndName(ve$1);
		return this._endToken(t);
	}
	_consumeComponentOpenStart(e) {
		this._beginToken(35, e);
		let t = this._consumeComponentName();
		return this._endToken(t);
	}
	_consumeComponentName() {
		let e = this._cursor.clone();
		for (; Pi$1(this._cursor.peek());) this._cursor.advance();
		let t = this._cursor.getChars(e), r = "", n = "";
		return this._cursor.peek() === 58 && (this._cursor.advance(), [r, n] = this._consumePrefixAndName(ve$1)), [
			t,
			r,
			n
		];
	}
	_consumeAttribute() {
		let [e, t] = this._consumeAttributeName(), r;
		return this._attemptCharCodeUntilFn(b$1), this._attemptCharCode(61) && (this._attemptCharCodeUntilFn(b$1), r = this._consumeAttributeValue()), this._attemptCharCodeUntilFn(b$1), {
			prefix: e,
			name: t,
			value: r
		};
	}
	_consumeAttributeName() {
		let e = this._cursor.peek();
		if (e === 39 || e === 34) throw this._createError(Se$1(e), this._cursor.getSpan());
		this._beginToken(15);
		let t;
		if (this._openDirectiveCount > 0) {
			let n = 0;
			t = (i) => {
				if (this._openDirectiveCount > 0) {
					if (i === 40) n++;
					else if (i === 41) {
						if (n === 0) return !0;
						n--;
					}
				}
				return ve$1(i);
			};
		} else if (e === 91) {
			let n = 0;
			t = (i) => (i === 91 ? n++ : i === 93 && n--, n <= 0 ? ve$1(i) : Oe$1(i));
		} else t = ve$1;
		let r = this._consumePrefixAndName(t);
		return this._endToken(r), r;
	}
	_consumeAttributeValue() {
		let e;
		if (this._cursor.peek() === 39 || this._cursor.peek() === 34) {
			let t = this._cursor.peek();
			this._consumeQuote(t);
			let r = () => this._cursor.peek() === t;
			e = this._consumeWithInterpolation(17, 18, r, r), this._consumeQuote(t);
		} else {
			let t = () => ve$1(this._cursor.peek());
			e = this._consumeWithInterpolation(17, 18, t, t);
		}
		return e;
	}
	_consumeQuote(e) {
		this._beginToken(16), this._requireCharCode(e), this._endToken([String.fromCodePoint(e)]);
	}
	_consumeTagOpenEnd() {
		let e = this._attemptCharCode(47) ? 2 : 1;
		this._beginToken(e), this._requireCharCode(62), this._endToken([]);
	}
	_consumeComponentOpenEnd() {
		let e = this._attemptCharCode(47) ? 37 : 36;
		this._beginToken(e), this._requireCharCode(62), this._endToken([]);
	}
	_consumeTagClose(e) {
		if (this._selectorlessEnabled) {
			let t = e.clone();
			for (; t.peek() !== 62 && !Ot$1(t.peek());) t.advance();
			if (Ot$1(t.peek())) {
				this._beginToken(38, e);
				let r = this._consumeComponentName();
				this._attemptCharCodeUntilFn(b$1), this._requireCharCode(62), this._endToken(r);
				return;
			}
		}
		if (this._beginToken(3, e), this._attemptCharCodeUntilFn(b$1), this._allowHtmComponentClosingTags && this._attemptCharCode(47)) this._attemptCharCodeUntilFn(b$1), this._requireCharCode(62), this._endToken([]);
		else {
			let [t, r] = this._consumePrefixAndName(ve$1);
			this._attemptCharCodeUntilFn(b$1), this._requireCharCode(62), this._endToken([t, r]), this._handleFullNameStackForTagClose(t, r);
		}
	}
	_consumeExpansionFormStart() {
		this._beginToken(21), this._requireCharCode(123), this._endToken([]), this._expansionCaseStack.push(21), this._beginToken(7);
		let e = this._readUntil(44), t = this._processCarriageReturns(e);
		if (this._i18nNormalizeLineEndingsInICUs) this._endToken([t]);
		else {
			let n = this._endToken([e]);
			t !== e && this.nonNormalizedIcuExpressions.push(n);
		}
		this._requireCharCode(44), this._attemptCharCodeUntilFn(b$1), this._beginToken(7);
		let r = this._readUntil(44);
		this._endToken([r]), this._requireCharCode(44), this._attemptCharCodeUntilFn(b$1);
	}
	_consumeExpansionCaseStart() {
		this._beginToken(22);
		let e = this._readUntil(123).trim();
		this._endToken([e]), this._attemptCharCodeUntilFn(b$1), this._beginToken(23), this._requireCharCode(123), this._endToken([]), this._attemptCharCodeUntilFn(b$1), this._expansionCaseStack.push(23);
	}
	_consumeExpansionCaseEnd() {
		this._beginToken(24), this._requireCharCode(125), this._endToken([]), this._attemptCharCodeUntilFn(b$1), this._expansionCaseStack.pop();
	}
	_consumeExpansionFormEnd() {
		this._beginToken(25), this._requireCharCode(125), this._endToken([]), this._expansionCaseStack.pop();
	}
	_consumeWithInterpolation(e, t, r, n) {
		this._beginToken(e);
		let i = [];
		for (; !r();) {
			let a = this._cursor.clone();
			this._attemptStr(it$1.start) ? (this._endToken([this._processCarriageReturns(i.join(""))], a), i.length = 0, this._consumeInterpolation(t, a, n), this._beginToken(e)) : this._cursor.peek() === 38 ? (this._endToken([this._processCarriageReturns(i.join(""))]), i.length = 0, this._consumeEntity(e), this._beginToken(e)) : i.push(this._readChar());
		}
		this._inInterpolation = !1;
		let s = this._processCarriageReturns(i.join(""));
		return this._endToken([s]), s;
	}
	_consumeInterpolation(e, t, r) {
		let n = [];
		this._beginToken(e, t), n.push(it$1.start);
		let i = this._cursor.clone(), s = null, a = !1;
		for (; this._cursor.peek() !== 0 && (r === null || !r());) {
			let o = this._cursor.clone();
			if (this._isTagStart()) {
				this._cursor = o, n.push(this._getProcessedChars(i, o)), this._endToken(n);
				return;
			}
			if (s === null) if (this._attemptStr(it$1.end)) {
				n.push(this._getProcessedChars(i, o)), n.push(it$1.end), this._endToken(n);
				return;
			} else this._attemptStr("//") && (a = !0);
			let l = this._cursor.peek();
			this._cursor.advance(), l === 92 ? this._cursor.advance() : l === s ? s = null : !a && s === null && Rt$1(l) && (s = l);
		}
		n.push(this._getProcessedChars(i, this._cursor)), this._endToken(n);
	}
	_consumeDirective(e, t) {
		for (this._requireCharCode(64), this._cursor.advance(); Pi$1(this._cursor.peek());) this._cursor.advance();
		this._beginToken(40, e);
		let r = this._cursor.getChars(t);
		if (this._endToken([r]), this._attemptCharCodeUntilFn(b$1), this._cursor.peek() === 40) {
			for (this._openDirectiveCount++, this._beginToken(41), this._cursor.advance(), this._endToken([]), this._attemptCharCodeUntilFn(b$1); !Ni$1(this._cursor.peek()) && this._cursor.peek() !== 41;) this._consumeAttribute();
			if (this._attemptCharCodeUntilFn(b$1), this._openDirectiveCount--, this._cursor.peek() !== 41) {
				if (this._cursor.peek() === 62 || this._cursor.peek() === 47) return;
				throw this._createError(Se$1(this._cursor.peek()), this._cursor.getSpan(e));
			}
			this._beginToken(42), this._cursor.advance(), this._endToken([]), this._attemptCharCodeUntilFn(b$1);
		}
	}
	_getProcessedChars(e, t) {
		return this._processCarriageReturns(t.getChars(e));
	}
	_isTextEnd() {
		return !!(this._isTagStart() || this._cursor.peek() === 0 || this._tokenizeIcu && !this._inInterpolation && (this.isExpansionFormStart() || this._cursor.peek() === 125 && this._isInExpansionCase()) || this._tokenizeBlocks && !this._inInterpolation && !this._isInExpansion() && (this._isBlockStart() || this._isLetStart() || this._cursor.peek() === 125));
	}
	_isTagStart() {
		if (this._cursor.peek() === 60) {
			let e = this._cursor.clone();
			e.advance();
			let t = e.peek();
			if (97 <= t && t <= 122 || 65 <= t && t <= 90 || t === 47 || t === 33 || t === 63) return !0;
		}
		return !1;
	}
	_readUntil(e) {
		let t = this._cursor.clone();
		return this._attemptUntilChar(e), this._cursor.getChars(t);
	}
	_isInExpansion() {
		return this._isInExpansionCase() || this._isInExpansionForm();
	}
	_isInExpansionCase() {
		return this._expansionCaseStack.length > 0 && this._expansionCaseStack[this._expansionCaseStack.length - 1] === 23;
	}
	_isInExpansionForm() {
		return this._expansionCaseStack.length > 0 && this._expansionCaseStack[this._expansionCaseStack.length - 1] === 21;
	}
	isExpansionFormStart() {
		if (this._cursor.peek() !== 123) return !1;
		let e = this._cursor.clone(), t = this._attemptStr(it$1.start);
		return this._cursor = e, !t;
	}
	_handleFullNameStackForTagOpen(e, t) {
		let r = fe$1(e, t);
		(this._fullNameStack.length === 0 || this._fullNameStack[this._fullNameStack.length - 1] === r) && this._fullNameStack.push(r);
	}
	_handleFullNameStackForTagClose(e, t) {
		let r = fe$1(e, t);
		this._fullNameStack.length !== 0 && this._fullNameStack[this._fullNameStack.length - 1] === r && this._fullNameStack.pop();
	}
};
function b$1(e) {
	return !nt$1(e) || e === 0;
}
function ve$1(e) {
	return nt$1(e) || e === 62 || e === 60 || e === 47 || e === 39 || e === 34 || e === 61 || e === 0;
}
function Xa(e) {
	return (e < 97 || 122 < e) && (e < 65 || 90 < e) && (e < 48 || e > 57);
}
function Ja(e) {
	return e === 59 || e === 0 || !Ei$1(e);
}
function Za(e) {
	return e === 59 || e === 0 || !(Re$1(e) || Ie$1(e));
}
function eo$1(e) {
	return e !== 125;
}
function to$1(e, t) {
	return Li$1(e) === Li$1(t);
}
function Li$1(e) {
	return e >= 97 && e <= 122 ? e - 97 + 65 : e;
}
function ro$1(e) {
	return Re$1(e) || Ie$1(e) || e === 95;
}
function Ai$1(e) {
	return e !== 59 && b$1(e);
}
function Ot$1(e) {
	return e === 95 || e >= 65 && e <= 90;
}
function Pi$1(e) {
	return Re$1(e) || Ie$1(e) || e === 95;
}
function Ni$1(e) {
	return e === 47 || e === 62 || e === 60 || e === 0;
}
function no$1(e) {
	let t = [], r;
	for (let n = 0; n < e.length; n++) {
		let i = e[n];
		r && r.type === 5 && i.type === 5 || r && r.type === 17 && i.type === 17 ? (r.parts[0] += i.parts[0], r.sourceSpan.end = i.sourceSpan.end) : (r = i, t.push(r));
	}
	return t;
}
var Ii$1 = class Sr {
	state;
	file;
	input;
	end;
	constructor(t, r) {
		if (t instanceof Sr) {
			this.file = t.file, this.input = t.input, this.end = t.end;
			let n = t.state;
			this.state = {
				peek: n.peek,
				offset: n.offset,
				line: n.line,
				column: n.column
			};
		} else {
			if (!r) throw new Error("Programming error: the range argument must be provided with a file argument.");
			this.file = t, this.input = t.content, this.end = r.endPos, this.state = {
				peek: -1,
				offset: r.startPos,
				line: r.startLine,
				column: r.startCol
			};
		}
	}
	clone() {
		return new Sr(this);
	}
	peek() {
		return this.state.peek;
	}
	charsLeft() {
		return this.end - this.state.offset;
	}
	diff(t) {
		return this.state.offset - t.state.offset;
	}
	advance() {
		this.advanceState(this.state);
	}
	init() {
		this.updatePeek(this.state);
	}
	getSpan(t, r) {
		t = t || this;
		let n = t;
		if (r) for (; this.diff(t) > 0 && r.indexOf(t.peek()) !== -1;) n === t && (t = t.clone()), t.advance();
		let i = this.locationFromCursor(t);
		return new p(i, this.locationFromCursor(this), n !== t ? this.locationFromCursor(n) : i);
	}
	getChars(t) {
		return this.input.substring(t.state.offset, this.state.offset);
	}
	charAt(t) {
		return this.input.charCodeAt(t);
	}
	advanceState(t) {
		if (t.offset >= this.end) throw this.state = t, new Cr$1("Unexpected character \"EOF\"", this);
		let r = this.charAt(t.offset);
		r === 10 ? (t.line++, t.column = 0) : Oe$1(r) || t.column++, t.offset++, this.updatePeek(t);
	}
	updatePeek(t) {
		t.peek = t.offset >= this.end ? 0 : this.charAt(t.offset);
	}
	locationFromCursor(t) {
		return new De$1(t.file, t.state.offset, t.state.line, t.state.column);
	}
};
var io$1 = class vr extends Ii$1 {
	internalState;
	constructor(t, r) {
		t instanceof vr ? (super(t), this.internalState = { ...t.internalState }) : (super(t, r), this.internalState = this.state);
	}
	advance() {
		this.state = this.internalState, super.advance(), this.processEscapeSequence();
	}
	init() {
		super.init(), this.processEscapeSequence();
	}
	clone() {
		return new vr(this);
	}
	getChars(t) {
		let r = t.clone(), n = "";
		for (; r.internalState.offset < this.internalState.offset;) n += String.fromCodePoint(r.peek()), r.advance();
		return n;
	}
	processEscapeSequence() {
		let t = () => this.internalState.peek;
		if (t() === 92) if (this.internalState = { ...this.state }, this.advanceState(this.internalState), t() === 110) this.state.peek = 10;
		else if (t() === 114) this.state.peek = 13;
		else if (t() === 118) this.state.peek = 11;
		else if (t() === 116) this.state.peek = 9;
		else if (t() === 98) this.state.peek = 8;
		else if (t() === 102) this.state.peek = 12;
		else if (t() === 117) if (this.advanceState(this.internalState), t() === 123) {
			this.advanceState(this.internalState);
			let r = this.clone(), n = 0;
			for (; t() !== 125;) this.advanceState(this.internalState), n++;
			this.state.peek = this.decodeHexDigits(r, n);
		} else {
			let r = this.clone();
			this.advanceState(this.internalState), this.advanceState(this.internalState), this.advanceState(this.internalState), this.state.peek = this.decodeHexDigits(r, 4);
		}
		else if (t() === 120) {
			this.advanceState(this.internalState);
			let r = this.clone();
			this.advanceState(this.internalState), this.state.peek = this.decodeHexDigits(r, 2);
		} else if (_r$1(t())) {
			let r = "", n = 0, i = this.clone();
			for (; _r$1(t()) && n < 3;) i = this.clone(), r += String.fromCodePoint(t()), this.advanceState(this.internalState), n++;
			this.state.peek = parseInt(r, 8), this.internalState = i.internalState;
		} else Oe$1(this.internalState.peek) ? (this.advanceState(this.internalState), this.state = this.internalState) : this.state.peek = this.internalState.peek;
	}
	decodeHexDigits(t, r) {
		let n = this.input.slice(t.internalState.offset, t.internalState.offset + r), i = parseInt(n, 16);
		if (isNaN(i)) throw t.state = t.internalState, new Cr$1("Invalid hexadecimal escape sequence", t);
		return i;
	}
};
var Cr$1 = class extends Error {
	msg;
	cursor;
	constructor(e, t) {
		super(e), this.msg = e, this.cursor = t, Object.setPrototypeOf(this, new.target.prototype);
	}
};
var x$1 = class Mi extends re$1 {
	elementName;
	static create(t, r, n) {
		return new Mi(t, r, n);
	}
	constructor(t, r, n) {
		super(r, n), this.elementName = t;
	}
};
var so$1 = class {
	rootNodes;
	errors;
	constructor(e, t) {
		this.rootNodes = e, this.errors = t;
	}
};
var Bi$1 = class {
	getTagDefinition;
	constructor(e) {
		this.getTagDefinition = e;
	}
	parse(e, t, r, n = !1, i) {
		let s = (h) => (f, ...g) => h(f.toLowerCase(), ...g), a = n ? this.getTagDefinition : s(this.getTagDefinition), o = (h) => a(h).getContentType(), l = n ? i : s(i), c = Di$1(e, t, i ? (h, f, g, v) => {
			let W = l(h, f, g, v);
			return W !== void 0 ? W : o(h);
		} : o, r), u = r && r.canSelfClose || !1, d = r && r.allowHtmComponentClosingTags || !1, _ = new ao$1(c.tokens, a, u, d, n);
		return _.build(), new so$1(_.rootNodes, [...c.errors, ..._.errors]);
	}
};
var ao$1 = class qi {
	tokens;
	tagDefinitionResolver;
	canSelfClose;
	allowHtmComponentClosingTags;
	isTagNameCaseSensitive;
	_index = -1;
	_peek;
	_containerStack = [];
	rootNodes = [];
	errors = [];
	constructor(t, r, n, i, s) {
		this.tokens = t, this.tagDefinitionResolver = r, this.canSelfClose = n, this.allowHtmComponentClosingTags = i, this.isTagNameCaseSensitive = s, this._advance();
	}
	build() {
		for (; this._peek.type !== 44;) this._peek.type === 0 || this._peek.type === 4 ? this._consumeElementStartTag(this._advance()) : this._peek.type === 3 ? (this._closeVoidElement(), this._consumeElementEndTag(this._advance())) : this._peek.type === 13 ? (this._closeVoidElement(), this._consumeCdata(this._advance())) : this._peek.type === 10 ? (this._closeVoidElement(), this._consumeComment(this._advance())) : this._peek.type === 5 || this._peek.type === 7 || this._peek.type === 6 ? (this._closeVoidElement(), this._consumeText(this._advance())) : this._peek.type === 21 ? this._consumeExpansion(this._advance()) : this._peek.type === 26 ? (this._closeVoidElement(), this._consumeBlockOpen(this._advance())) : this._peek.type === 28 ? (this._closeVoidElement(), this._consumeBlockClose(this._advance())) : this._peek.type === 30 ? (this._closeVoidElement(), this._consumeIncompleteBlock(this._advance())) : this._peek.type === 31 ? (this._closeVoidElement(), this._consumeLet(this._advance())) : this._peek.type === 19 ? this._consumeDocType(this._advance()) : this._peek.type === 34 ? (this._closeVoidElement(), this._consumeIncompleteLet(this._advance())) : this._peek.type === 35 || this._peek.type === 39 ? this._consumeComponentStartTag(this._advance()) : this._peek.type === 38 ? this._consumeComponentEndTag(this._advance()) : this._advance();
		for (let t of this._containerStack) t instanceof ge$1 && this.errors.push(x$1.create(t.name, t.sourceSpan, `Unclosed block "${t.name}"`));
	}
	_advance() {
		let t = this._peek;
		return this._index < this.tokens.length - 1 && this._index++, this._peek = this.tokens[this._index], t;
	}
	_advanceIf(t) {
		return this._peek.type === t ? this._advance() : null;
	}
	_consumeCdata(t) {
		let r = this._advance(), n = this._getText(r), i = this._advanceIf(14);
		this._addToParent(new Si$1(n, new p(t.sourceSpan.start, (i || r).sourceSpan.end), [r]));
	}
	_consumeComment(t) {
		let r = this._advanceIf(7), n = this._advanceIf(11), i = r != null ? r.parts[0].trim() : null, s = n == null ? t.sourceSpan : new p(t.sourceSpan.start, n.sourceSpan.end, t.sourceSpan.fullStart);
		this._addToParent(new wi$1(i, s));
	}
	_consumeDocType(t) {
		let r = this._advanceIf(7), n = this._advanceIf(20), i = r != null ? r.parts[0].trim() : null, s = new p(t.sourceSpan.start, (n || r || t).sourceSpan.end);
		this._addToParent(new Ti$1(i, s));
	}
	_consumeExpansion(t) {
		let r = this._advance(), n = this._advance(), i = [];
		for (; this._peek.type === 22;) {
			let a = this._parseExpansionCase();
			if (!a) return;
			i.push(a);
		}
		if (this._peek.type !== 25) {
			this.errors.push(x$1.create(null, this._peek.sourceSpan, "Invalid ICU message. Missing '}'."));
			return;
		}
		let s = new p(t.sourceSpan.start, this._peek.sourceSpan.end, t.sourceSpan.fullStart);
		this._addToParent(new vi$1(r.parts[0], n.parts[0], i, s, r.sourceSpan)), this._advance();
	}
	_parseExpansionCase() {
		let t = this._advance();
		if (this._peek.type !== 23) return this.errors.push(x$1.create(null, this._peek.sourceSpan, "Invalid ICU message. Missing '{'.")), null;
		let r = this._advance(), n = this._collectExpansionExpTokens(r);
		if (!n) return null;
		let i = this._advance();
		n.push({
			type: 44,
			parts: [],
			sourceSpan: i.sourceSpan
		});
		let s = new qi(n, this.tagDefinitionResolver, this.canSelfClose, this.allowHtmComponentClosingTags, this.isTagNameCaseSensitive);
		if (s.build(), s.errors.length > 0) return this.errors = this.errors.concat(s.errors), null;
		let a = new p(t.sourceSpan.start, i.sourceSpan.end, t.sourceSpan.fullStart), o = new p(r.sourceSpan.start, i.sourceSpan.end, r.sourceSpan.fullStart);
		return new Ci$1(t.parts[0], s.rootNodes, a, t.sourceSpan, o);
	}
	_collectExpansionExpTokens(t) {
		let r = [], n = [23];
		for (;;) {
			if ((this._peek.type === 21 || this._peek.type === 23) && n.push(this._peek.type), this._peek.type === 24) if (Ri$1(n, 23)) {
				if (n.pop(), n.length === 0) return r;
			} else return this.errors.push(x$1.create(null, t.sourceSpan, "Invalid ICU message. Missing '}'.")), null;
			if (this._peek.type === 25) if (Ri$1(n, 21)) n.pop();
			else return this.errors.push(x$1.create(null, t.sourceSpan, "Invalid ICU message. Missing '}'.")), null;
			if (this._peek.type === 44) return this.errors.push(x$1.create(null, t.sourceSpan, "Invalid ICU message. Missing '}'.")), null;
			r.push(this._advance());
		}
	}
	_getText(t) {
		let r = t.parts[0];
		if (r.length > 0 && r[0] == `
`) {
			var n;
			let i = this._getClosestElementLikeParent();
			i != null && i.children.length == 0 && (n = this._getTagDefinition(i)) !== null && n !== void 0 && n.ignoreFirstLf && (r = r.substring(1));
		}
		return r;
	}
	_consumeText(t) {
		let r = [t], n = t.sourceSpan, i = t.parts[0];
		if (i.length > 0 && i[0] === `
`) {
			var s;
			let a = this._getContainer();
			a != null && a.children.length === 0 && (s = this._getTagDefinition(a)) !== null && s !== void 0 && s.ignoreFirstLf && (i = i.substring(1), r[0] = {
				type: t.type,
				sourceSpan: t.sourceSpan,
				parts: [i]
			});
		}
		for (; this._peek.type === 8 || this._peek.type === 5 || this._peek.type === 9;) t = this._advance(), r.push(t), t.type === 8 ? i += t.parts.join("").replace(/&([^;]+);/g, Oi$1) : t.type === 9 ? i += t.parts[0] : i += t.parts.join("");
		if (i.length > 0) {
			let a = t.sourceSpan;
			this._addToParent(new _i$1(i, new p(n.start, a.end, n.fullStart, n.details), r));
		}
	}
	_closeVoidElement() {
		var t;
		let r = this._getContainer();
		r !== null && (t = this._getTagDefinition(r)) !== null && t !== void 0 && t.isVoid && this._containerStack.pop();
	}
	_consumeElementStartTag(t) {
		var r;
		let n = [], i = [], s = [];
		this._consumeAttributesAndDirectives(n, i, s);
		let a = this._getElementFullName(t, this._getClosestElementLikeParent()), o = this._getTagDefinition(a), l = !1;
		if (this._peek.type === 2) {
			this._advance(), l = !0;
			let v = this._getTagDefinition(a);
			this.canSelfClose || v?.canSelfClose || Pe$1(a) !== null || v?.isVoid || this.errors.push(x$1.create(a, t.sourceSpan, `Only void, custom and foreign elements can be self closed "${t.parts[1]}"`));
		} else this._peek.type === 1 && (this._advance(), l = !1);
		let c = this._peek.sourceSpan.fullStart, u = new p(t.sourceSpan.start, c, t.sourceSpan.fullStart), d = new p(t.sourceSpan.start, c, t.sourceSpan.fullStart), _ = new p(t.sourceSpan.start.moveBy(1), t.sourceSpan.end), h = new ne$1(a, n, i, [], l, u, d, void 0, _, o?.isVoid ?? !1, void 0, s), f = this._getContainer(), g = f !== null && !!(!((r = this._getTagDefinition(f)) === null || r === void 0) && r.isClosedByChild(h.name));
		this._pushContainer(h, g), l ? this._popContainer(a, ne$1, u) : t.type === 4 && (this._popContainer(a, ne$1, null), this.errors.push(x$1.create(a, u, `Opening tag "${a}" not terminated.`)));
	}
	_consumeComponentStartTag(t) {
		var r;
		let n = t.parts[0], i = [], s = [], a = [];
		this._consumeAttributesAndDirectives(i, s, a);
		let o = this._getClosestElementLikeParent(), l = this._getComponentTagName(t, o), c = this._getComponentFullName(t, o), u = this._peek.type === 37;
		this._advance();
		let d = this._peek.sourceSpan.fullStart, _ = new p(t.sourceSpan.start, d, t.sourceSpan.fullStart), f = new U$1(n, l, c, i, s, [], u, _, new p(t.sourceSpan.start, d, t.sourceSpan.fullStart), void 0, void 0, a), g = this._getContainer(), v = g !== null && f.tagName !== null && !!(!((r = this._getTagDefinition(g)) === null || r === void 0) && r.isClosedByChild(f.tagName));
		this._pushContainer(f, v), u ? this._popContainer(c, U$1, _) : t.type === 39 && (this._popContainer(c, U$1, null), this.errors.push(x$1.create(c, _, `Opening tag "${c}" not terminated.`)));
	}
	_consumeAttributesAndDirectives(t, r, n) {
		for (; this._peek.type === 15 || this._peek.type === 40 || this._peek.type === 12;) if (this._peek.type === 40) r.push(this._consumeDirective(this._peek));
		else if (this._peek.type === 15) t.push(this._consumeAttr(this._advance()));
		else {
			let i = this._advance();
			n.push(new bi$1(i.parts[0], i.parts[1], i.sourceSpan));
		}
	}
	_consumeComponentEndTag(t) {
		let r = this._getComponentFullName(t, this._getClosestElementLikeParent());
		if (!this._popContainer(r, U$1, t.sourceSpan)) {
			let n = this._containerStack[this._containerStack.length - 1], i;
			n instanceof U$1 && n.componentName === t.parts[0] ? i = `, did you mean "${n.fullName}"?` : i = ". It may happen when the tag has already been closed by another tag.";
			let s = `Unexpected closing tag "${r}"${i}`;
			this.errors.push(x$1.create(r, t.sourceSpan, s));
		}
	}
	_getTagDefinition(t) {
		return typeof t == "string" ? this.tagDefinitionResolver(t) : t instanceof ne$1 ? this.tagDefinitionResolver(t.name) : t instanceof U$1 && t.tagName !== null ? this.tagDefinitionResolver(t.tagName) : null;
	}
	_pushContainer(t, r) {
		r && this._containerStack.pop(), this._addToParent(t), this._containerStack.push(t);
	}
	_consumeElementEndTag(t) {
		var r;
		let n = this.allowHtmComponentClosingTags && t.parts.length === 0 ? null : this._getElementFullName(t, this._getClosestElementLikeParent());
		if (n && !((r = this._getTagDefinition(n)) === null || r === void 0) && r.isVoid) this.errors.push(x$1.create(n, t.sourceSpan, `Void elements do not have end tags "${t.parts[1]}"`));
		else if (!this._popContainer(n, ne$1, t.sourceSpan)) {
			let i = `Unexpected closing tag "${n}". It may happen when the tag has already been closed by another tag. For more info see https://www.w3.org/TR/html5/syntax.html#closing-elements-that-have-implied-end-tags`;
			this.errors.push(x$1.create(n, t.sourceSpan, i));
		}
	}
	_popContainer(t, r, n) {
		let i = !1;
		for (let a = this._containerStack.length - 1; a >= 0; a--) {
			var s;
			let o = this._containerStack[a], l = o instanceof U$1 ? o.fullName : o.name;
			if (Pe$1(l) ? l === t : (l === t || t === null) && o instanceof r) return o.endSourceSpan = n, o.sourceSpan.end = n !== null ? n.end : o.sourceSpan.end, this._containerStack.splice(a, this._containerStack.length - a), !i;
			(o instanceof ge$1 || (s = this._getTagDefinition(o)) === null || s === void 0 || !s.closedByParent) && (i = !0);
		}
		return !1;
	}
	_consumeAttr(t) {
		let r = fe$1(t.parts[0], t.parts[1]), n = t.sourceSpan.end, i;
		this._peek.type === 16 && (i = this._advance());
		let s = "", a = [], o, l;
		if (this._peek.type === 17) for (o = this._peek.sourceSpan, l = this._peek.sourceSpan.end; this._peek.type === 17 || this._peek.type === 18 || this._peek.type === 9;) {
			let u = this._advance();
			a.push(u), u.type === 18 ? s += u.parts.join("").replace(/&([^;]+);/g, Oi$1) : u.type === 9 ? s += u.parts[0] : s += u.parts.join(""), l = n = u.sourceSpan.end;
		}
		this._peek.type === 16 && (l = n = this._advance().sourceSpan.end);
		let c = o && l && new p(i?.sourceSpan.start ?? o.start, l, i?.sourceSpan.fullStart ?? o.fullStart);
		return new ki$1(r, s, new p(t.sourceSpan.start, n, t.sourceSpan.fullStart), t.sourceSpan, c, a.length > 0 ? a : void 0, void 0);
	}
	_consumeDirective(t) {
		let r = [], n = t.sourceSpan.end, i = null;
		if (this._advance(), this._peek.type === 41) {
			for (n = this._peek.sourceSpan.end, this._advance(); this._peek.type === 15;) r.push(this._consumeAttr(this._advance()));
			this._peek.type === 42 ? (i = this._peek.sourceSpan, this._advance()) : this.errors.push(x$1.create(null, t.sourceSpan, "Unterminated directive definition"));
		}
		let s = new p(t.sourceSpan.start, n, t.sourceSpan.fullStart), a = new p(s.start, i === null ? t.sourceSpan.end : i.end, s.fullStart);
		return new yi$1(t.parts[0], r, a, s, i);
	}
	_consumeBlockOpen(t) {
		let r = [];
		for (; this._peek.type === 29;) {
			let o = this._advance();
			r.push(new fr$1(o.parts[0], o.sourceSpan));
		}
		this._peek.type === 27 && this._advance();
		let n = this._peek.sourceSpan.fullStart, i = new p(t.sourceSpan.start, n, t.sourceSpan.fullStart), s = new p(t.sourceSpan.start, n, t.sourceSpan.fullStart), a = new ge$1(t.parts[0], r, [], i, t.sourceSpan, s);
		this._pushContainer(a, !1);
	}
	_consumeBlockClose(t) {
		let r = this._containerStack.length, n = this._containerStack[r - 1];
		if (!this._popContainer(null, ge$1, t.sourceSpan)) {
			if (this._containerStack.length < r) {
				let i = n instanceof U$1 ? n.fullName : n.name;
				this.errors.push(x$1.create(null, t.sourceSpan, `Unexpected closing block. The block may have been closed earlier. Did you forget to close the <${i}> element? If you meant to write the \`}\` character, you should use the "&#125;" HTML entity instead.`));
				return;
			}
			this.errors.push(x$1.create(null, t.sourceSpan, "Unexpected closing block. The block may have been closed earlier. If you meant to write the `}` character, you should use the \"&#125;\" HTML entity instead."));
		}
	}
	_consumeIncompleteBlock(t) {
		let r = [];
		for (; this._peek.type === 29;) {
			let o = this._advance();
			r.push(new fr$1(o.parts[0], o.sourceSpan));
		}
		let n = this._peek.sourceSpan.fullStart, i = new p(t.sourceSpan.start, n, t.sourceSpan.fullStart), s = new p(t.sourceSpan.start, n, t.sourceSpan.fullStart), a = new ge$1(t.parts[0], r, [], i, t.sourceSpan, s);
		this._pushContainer(a, !1), this._popContainer(null, ge$1, null), this.errors.push(x$1.create(t.parts[0], i, `Incomplete block "${t.parts[0]}". If you meant to write the @ character, you should use the "&#64;" HTML entity instead.`));
	}
	_consumeLet(t) {
		let r = t.parts[0], n, i;
		if (this._peek.type !== 32) {
			this.errors.push(x$1.create(t.parts[0], t.sourceSpan, `Invalid @let declaration "${r}". Declaration must have a value.`));
			return;
		} else n = this._advance();
		if (this._peek.type !== 33) {
			this.errors.push(x$1.create(t.parts[0], t.sourceSpan, `Unterminated @let declaration "${r}". Declaration must be terminated with a semicolon.`));
			return;
		} else i = this._advance();
		let s = i.sourceSpan.end, a = new p(t.sourceSpan.start, s, t.sourceSpan.fullStart), o = t.sourceSpan.toString().lastIndexOf(r), c = new p(t.sourceSpan.start.moveBy(o), t.sourceSpan.end), u = new dr$1(r, n.parts[0], a, c, n.sourceSpan);
		this._addToParent(u);
	}
	_consumeIncompleteLet(t) {
		let r = t.parts[0] ?? "", n = r ? ` "${r}"` : "";
		if (r.length > 0) {
			let i = t.sourceSpan.toString().lastIndexOf(r), a = new p(t.sourceSpan.start.moveBy(i), t.sourceSpan.end), o = new p(t.sourceSpan.start, t.sourceSpan.start.moveBy(0)), l = new dr$1(r, "", t.sourceSpan, a, o);
			this._addToParent(l);
		}
		this.errors.push(x$1.create(t.parts[0], t.sourceSpan, `Incomplete @let declaration${n}. @let declarations must be written as \`@let <name> = <value>;\``));
	}
	_getContainer() {
		return this._containerStack.length > 0 ? this._containerStack[this._containerStack.length - 1] : null;
	}
	_getClosestElementLikeParent() {
		for (let t = this._containerStack.length - 1; t > -1; t--) {
			let r = this._containerStack[t];
			if (r instanceof ne$1 || r instanceof U$1) return r;
		}
		return null;
	}
	_addToParent(t) {
		let r = this._getContainer();
		r === null ? this.rootNodes.push(t) : r.children.push(t);
	}
	_getElementFullName(t, r) {
		return fe$1(this._getPrefix(t, r), t.parts[1]);
	}
	_getComponentFullName(t, r) {
		let n = t.parts[0], i = this._getComponentTagName(t, r);
		return i === null ? n : i.startsWith(":") ? n + i : `${n}:${i}`;
	}
	_getComponentTagName(t, r) {
		let n = this._getPrefix(t, r), i = t.parts[2];
		return !n && !i ? null : !n && i ? i : fe$1(n, i || "ng-component");
	}
	_getPrefix(t, r) {
		var n;
		let i, s;
		if (t.type === 35 || t.type === 39 || t.type === 38 ? (i = t.parts[1], s = t.parts[2]) : (i = t.parts[0], s = t.parts[1]), i = i || ((n = this._getTagDefinition(s)) === null || n === void 0 ? void 0 : n.implicitNamespacePrefix) || "", !i && r) {
			let a = r instanceof ne$1 ? r.name : r.tagName;
			if (a !== null) {
				let o = ee$1(a)[1], l = this._getTagDefinition(o);
				l !== null && !l.preventNamespaceInheritance && (i = Pe$1(a));
			}
		}
		return i;
	}
};
function Ri$1(e, t) {
	return e.length > 0 && e[e.length - 1] === t;
}
function Oi$1(e, t) {
	return _e$1[t] !== void 0 ? _e$1[t] || e : /^#x[a-f0-9]+$/i.test(t) ? String.fromCodePoint(parseInt(t.slice(2), 16)) : /^#\d+$/.test(t) ? String.fromCodePoint(parseInt(t.slice(1), 10)) : e;
}
var Hi = class extends Bi$1 {
	constructor() {
		super(Ne$1);
	}
	parse(e, t, r, n = !1, i) {
		return super.parse(e, t, r, n, i);
	}
};
var kr$1;
function Mt$1(e, t = {}) {
	let { canSelfClose: r = !1, allowHtmComponentClosingTags: n = !1, allowStartTagComments: i = !1, isTagNameCaseSensitive: s = !1, getTagContentType: a, tokenizeAngularBlocks: o = !1, tokenizeAngularLetDeclaration: l = !1, enableAngularSelectorlessSyntax: c = !1 } = t;
	return kr$1 ?? (kr$1 = new Hi()), kr$1.parse(e, "angular-html-parser", {
		tokenizeExpansionForms: o,
		canSelfClose: r,
		allowHtmComponentClosingTags: n,
		allowStartTagComments: i,
		tokenizeBlocks: o,
		tokenizeLet: l,
		selectorlessEnabled: c
	}, s, a);
}
var oo$1 = [
	co$1,
	uo$1,
	ho$1,
	fo$1,
	go$1,
	vo$1,
	_o$1,
	So$1,
	Co$1,
	mo$1
];
function lo$1(e, t) {
	for (let r of oo$1) r(e, t);
	return e;
}
function co$1(e) {
	e.walk((t) => {
		if (t.kind === "element" && t.tagDefinition.ignoreFirstLf && t.children.length > 0 && t.children[0].kind === "text" && t.children[0].value[0] === `
`) {
			let r = t.children[0];
			r.value.length === 1 ? t.removeChild(r) : r.value = r.value.slice(1);
		}
	});
}
function uo$1(e) {
	let t = (r) => r.kind === "element" && r.prev?.kind === "ieConditionalStartComment" && r.prev.sourceSpan.end.offset === r.startSourceSpan.start.offset && r.firstChild?.kind === "ieConditionalEndComment" && r.firstChild.sourceSpan.start.offset === r.startSourceSpan.end.offset;
	e.walk((r) => {
		if (r.children) for (let n = 0; n < r.children.length; n++) {
			let i = r.children[n];
			if (!t(i)) continue;
			let s = i.prev, a = i.firstChild;
			r.removeChild(s), n--;
			let o = new p(s.sourceSpan.start, a.sourceSpan.end), l = new p(o.start, i.sourceSpan.end);
			i.condition = s.condition, i.sourceSpan = l, i.startSourceSpan = o, i.removeChild(a);
		}
	});
}
function po$1(e, t, r) {
	e.walk((n) => {
		if (n.children) for (let i = 0; i < n.children.length; i++) {
			let s = n.children[i];
			if (s.kind !== "text" && !t(s)) continue;
			s.kind !== "text" && (s.kind = "text", s.value = r(s));
			let a = s.prev;
			!a || a.kind !== "text" || (a.value += s.value, a.sourceSpan = new p(a.sourceSpan.start, s.sourceSpan.end), n.removeChild(s), i--);
		}
	});
}
function ho$1(e) {
	return po$1(e, (t) => t.kind === "cdata", (t) => `<![CDATA[${t.value}]]>`);
}
function mo$1(e) {
	let t = (r) => r.kind === "element" && r.attrs.length === 0 && !J(r.startTagComments) && r.children.length === 1 && r.firstChild.kind === "text" && !P.hasWhitespaceCharacter(r.children[0].value) && !r.firstChild.hasLeadingSpaces && !r.firstChild.hasTrailingSpaces && r.isLeadingSpaceSensitive && !r.hasLeadingSpaces && r.isTrailingSpaceSensitive && !r.hasTrailingSpaces && r.prev?.kind === "text" && r.next?.kind === "text";
	e.walk((r) => {
		if (r.children) for (let n = 0; n < r.children.length; n++) {
			let i = r.children[n];
			if (!t(i)) continue;
			let s = i.prev, a = i.next;
			s.value += `<${i.rawName}>` + i.firstChild.value + `</${i.rawName}>` + a.value, s.sourceSpan = new p(s.sourceSpan.start, a.sourceSpan.end), s.isTrailingSpaceSensitive = a.isTrailingSpaceSensitive, s.hasTrailingSpaces = a.hasTrailingSpaces, r.removeChild(i), n--, r.removeChild(a);
		}
	});
}
function fo$1(e, t) {
	if (t.parser === "html") return;
	let r = /\{\{(.+?)\}\}/s;
	e.walk((n) => {
		if (rn$1(n, t)) for (let i of n.children) {
			if (i.kind !== "text") continue;
			let s = i.sourceSpan.start, a, o = i.value.split(r);
			for (let l = 0; l < o.length; l++, s = a) {
				let c = o[l];
				if (l % 2 === 0) {
					a = s.moveBy(c.length), c.length > 0 && n.insertChildBefore(i, {
						kind: "text",
						value: c,
						sourceSpan: new p(s, a)
					});
					continue;
				}
				a = s.moveBy(c.length + 4), n.insertChildBefore(i, {
					kind: "interpolation",
					sourceSpan: new p(s, a),
					children: c.length === 0 ? [] : [{
						kind: "text",
						value: c,
						sourceSpan: new p(s.moveBy(2), a.moveBy(-2))
					}]
				});
			}
			n.removeChild(i);
		}
	});
}
function go$1(e, t) {
	e.walk((r) => {
		let n = r.$children;
		if (!n) return;
		if (n.length === 0 || n.length === 1 && n[0].kind === "text" && P.trim(n[0].value).length === 0) {
			r.hasDanglingSpaces = n.length > 0, r.$children = [];
			return;
		}
		let i = nn$1(r, t), s = er$1(r);
		if (!i) for (let a = 0; a < n.length; a++) {
			let o = n[a];
			if (o.kind !== "text") continue;
			let { leadingWhitespace: l, text: c, trailingWhitespace: u } = tn$1(o.value), d = o.prev, _ = o.next;
			c ? (o.value = c, o.sourceSpan = new p(o.sourceSpan.start.moveBy(l.length), o.sourceSpan.end.moveBy(-u.length)), l && (d && (d.hasTrailingSpaces = !0), o.hasLeadingSpaces = !0), u && (o.hasTrailingSpaces = !0, _ && (_.hasLeadingSpaces = !0))) : (r.removeChild(o), a--, (l || u) && (d && (d.hasTrailingSpaces = !0), _ && (_.hasLeadingSpaces = !0)));
		}
		r.isWhitespaceSensitive = i, r.isIndentationSensitive = s;
	});
}
function _o$1(e) {
	e.walk((t) => {
		t.isSelfClosing = !t.children || t.kind === "element" && (t.tagDefinition.isVoid || t.endSourceSpan && t.startSourceSpan.start === t.endSourceSpan.start && t.startSourceSpan.end === t.endSourceSpan.end);
	});
}
function So$1(e, t) {
	e.walk((r) => {
		r.kind === "element" && (r.hasHtmComponentClosingTag = r.endSourceSpan && /^<\s*\/\s*\/\s*>$/.test(t.originalText.slice(r.endSourceSpan.start.offset, r.endSourceSpan.end.offset)));
	});
}
function vo$1(e, t) {
	e.walk((r) => {
		r.cssDisplay = fn$1(r, t);
	});
}
function Co$1(e, t) {
	e.walk((r) => {
		let { children: n } = r;
		if (n) {
			if (n.length === 0) {
				r.isDanglingSpaceSensitive = on$1(r, t);
				return;
			}
			for (let i of n) i.isLeadingSpaceSensitive = sn$1(i, t), i.isTrailingSpaceSensitive = an$1(i, t);
			for (let i = 0; i < n.length; i++) {
				let s = n[i];
				s.isLeadingSpaceSensitive = (i === 0 || s.prev.isTrailingSpaceSensitive) && s.isLeadingSpaceSensitive, s.isTrailingSpaceSensitive = (i === n.length - 1 || s.next.isLeadingSpaceSensitive) && s.isTrailingSpaceSensitive;
			}
		}
	});
}
var Fi$1 = lo$1;
function ko$1(e, t, r) {
	let { node: n } = e;
	switch (n.kind) {
		case "root": return t.__onHtmlRoot && t.__onHtmlRoot(n), [C(Ae$1(e, t, r)), k$1];
		case "element":
		case "ieConditionalComment": return li$1(e, t, r);
		case "angularControlFlowBlock": return ni$1(e, t, r);
		case "angularControlFlowBlockParameters": return si$1(e, t, r);
		case "angularControlFlowBlockParameter": return P.trim(n.expression);
		case "angularLetDeclaration": return C([
			"@let ",
			C([
				n.id,
				" =",
				C(A([S$1, r("init")]))
			]),
			";"
		]);
		case "angularLetDeclarationInitializer": return n.value;
		case "angularIcuExpression": return ai$1(e, t, r);
		case "angularIcuCase": return oi$1(e, t, r);
		case "ieConditionalStartComment":
		case "ieConditionalEndComment": return [me$1(n), ue$1(n)];
		case "interpolation": return [
			me$1(n, t),
			...e.map(r, "children"),
			ue$1(n, t)
		];
		case "text": {
			if (n.parent.kind === "interpolation") {
				let o = /\n[^\S\n]*$/, l = o.test(n.value);
				return [L$1(l ? n.value.replace(o, "") : n.value), l ? k$1 : ""];
			}
			let i = B(n, t), s = Tt$1(n), a = M$1(n, t);
			return s[0] = [i, s[0]], s.push([s.pop(), a]), gt$1(s);
		}
		case "docType": return [C([
			me$1(n, t),
			" ",
			T$1(0, n.value.replace(/^html\b/i, "html"), /\s+/g, " ")
		]), ue$1(n, t)];
		case "comment": return [
			B(n, t),
			L$1(t.originalText.slice(F(n), Z$1(n))),
			M$1(n, t)
		];
		case "attribute": {
			if (n.value === null) return n.rawName;
			let i = nr$1(n.value), s = Et$1(n, t) ? "" : Wr$1(i, "\"");
			return [
				n.rawName,
				"=",
				s,
				L$1(s === "\"" ? T$1(0, i, "\"", "&quot;") : T$1(0, i, "'", "&apos;")),
				s
			];
		}
		case "startTagComment": return ci$1(e);
		default: throw new Gr$1(n, "HTML");
	}
}
var Vi$1 = {
	features: { experimental_frontMatterSupport: {
		massageAstNode: !0,
		embed: !0,
		print: !0
	} },
	preprocess: Fi$1,
	print: ko$1,
	insertPragma: ei,
	massageAstNode: or$1,
	embed: Gn$1,
	getVisitorKeys: Yn$1
};
var Ui$1 = [
	{
		name: "Angular",
		type: "markup",
		aceMode: "html",
		extensions: [".component.html"],
		tmScope: "text.html.basic",
		aliases: ["xhtml"],
		codemirrorMode: "htmlmixed",
		codemirrorMimeType: "text/html",
		parsers: ["angular"],
		vscodeLanguageIds: ["html"],
		filenames: [],
		linguistLanguageId: 146
	},
	{
		name: "HTML",
		type: "markup",
		aceMode: "html",
		extensions: [
			".html",
			".hta",
			".htm",
			".html.hl",
			".inc",
			".xht",
			".xhtml"
		],
		tmScope: "text.html.basic",
		aliases: ["xhtml"],
		codemirrorMode: "htmlmixed",
		codemirrorMimeType: "text/html",
		parsers: ["html"],
		vscodeLanguageIds: ["html"],
		linguistLanguageId: 146
	},
	{
		name: "Lightning Web Components",
		type: "markup",
		aceMode: "html",
		extensions: [],
		tmScope: "text.html.basic",
		aliases: ["LWC", "lwc"],
		codemirrorMode: "htmlmixed",
		codemirrorMimeType: "text/html",
		parsers: ["lwc"],
		vscodeLanguageIds: ["html"],
		filenames: [],
		linguistLanguageId: 146
	},
	{
		name: "MJML",
		type: "markup",
		aceMode: "html",
		extensions: [".mjml"],
		tmScope: "text.mjml.basic",
		aliases: ["MJML", "mjml"],
		codemirrorMode: "htmlmixed",
		codemirrorMimeType: "text/html",
		parsers: ["mjml"],
		filenames: [],
		vscodeLanguageIds: ["mjml"],
		linguistLanguageId: 146
	},
	{
		name: "Vue",
		type: "markup",
		aceMode: "vue",
		extensions: [".vue"],
		tmScope: "text.html.vue",
		codemirrorMode: "vue",
		codemirrorMimeType: "text/x-vue",
		parsers: ["vue"],
		vscodeLanguageIds: ["vue"],
		linguistLanguageId: 391
	}
];
var br$1 = {
	bracketSpacing: {
		category: "Common",
		type: "boolean",
		default: !0,
		description: "Print spaces between brackets.",
		oppositeDescription: "Do not print spaces between brackets."
	},
	objectWrap: {
		category: "Common",
		type: "choice",
		default: "preserve",
		description: "How to wrap object literals.",
		choices: [{
			value: "preserve",
			description: "Keep as multi-line, if there is a newline between the opening brace and first property."
		}, {
			value: "collapse",
			description: "Fit to a single line when possible."
		}]
	},
	singleQuote: {
		category: "Common",
		type: "boolean",
		default: !1,
		description: "Use single quotes instead of double quotes."
	},
	proseWrap: {
		category: "Common",
		type: "choice",
		default: "preserve",
		description: "How to wrap prose.",
		choices: [
			{
				value: "always",
				description: "Wrap prose if it exceeds the print width."
			},
			{
				value: "never",
				description: "Do not wrap prose."
			},
			{
				value: "preserve",
				description: "Wrap prose as-is."
			}
		]
	},
	bracketSameLine: {
		category: "Common",
		type: "boolean",
		default: !1,
		description: "Put > of opening tags on the last line instead of on a new line."
	},
	singleAttributePerLine: {
		category: "Common",
		type: "boolean",
		default: !1,
		description: "Enforce single attribute per line in HTML, Vue and JSX."
	}
};
var Wi$1 = "HTML";
var zi = {
	bracketSameLine: br$1.bracketSameLine,
	htmlWhitespaceSensitivity: {
		category: Wi$1,
		type: "choice",
		default: "css",
		description: "How to handle whitespaces in HTML.",
		choices: [
			{
				value: "css",
				description: "Respect the default value of CSS display property."
			},
			{
				value: "strict",
				description: "Whitespaces are considered sensitive."
			},
			{
				value: "ignore",
				description: "Whitespaces are considered insensitive."
			}
		]
	},
	singleAttributePerLine: br$1.singleAttributePerLine,
	vueIndentScriptAndStyle: {
		category: Wi$1,
		type: "boolean",
		default: !1,
		description: "Indent script and style tags in Vue files."
	}
};
var Pr$1 = {};
Ir$1(Pr$1, {
	angular: () => Wo$1,
	html: () => Fo$1,
	lwc: () => Go$1,
	mjml: () => Uo$1,
	vue: () => zo
});
function To$1(e, t) {
	let r = /* @__PURE__ */ new SyntaxError(e + " (" + t.loc.start.line + ":" + t.loc.start.column + ")");
	return Object.assign(r, t);
}
var Gi = To$1;
var yo$1 = {
	canSelfClose: !0,
	normalizeTagName: !1,
	normalizeAttributeName: !1,
	allowHtmComponentClosingTags: !1,
	allowStartTagComments: !1,
	isTagNameCaseSensitive: !1,
	shouldParseFrontMatter: !0
};
function Bt$1(e) {
	return {
		...yo$1,
		...e
	};
}
function wr$1(e) {
	let { canSelfClose: t, allowHtmComponentClosingTags: r, allowStartTagComments: n, isTagNameCaseSensitive: i, shouldParseAsRawText: s, tokenizeAngularBlocks: a, tokenizeAngularLetDeclaration: o } = e;
	return {
		canSelfClose: t,
		allowHtmComponentClosingTags: r,
		allowStartTagComments: n,
		isTagNameCaseSensitive: i,
		getTagContentType: s ? (...l) => s(...l) ? lr.RAW_TEXT : void 0 : void 0,
		tokenizeAngularBlocks: a,
		tokenizeAngularLetDeclaration: o
	};
}
var qt$1 = /* @__PURE__ */ new Map([
	["*", /* @__PURE__ */ new Set([
		"accesskey",
		"autocapitalize",
		"autocorrect",
		"autofocus",
		"class",
		"contenteditable",
		"dir",
		"draggable",
		"enterkeyhint",
		"exportparts",
		"hidden",
		"id",
		"inert",
		"inputmode",
		"is",
		"itemid",
		"itemprop",
		"itemref",
		"itemscope",
		"itemtype",
		"lang",
		"nonce",
		"part",
		"popover",
		"slot",
		"spellcheck",
		"style",
		"tabindex",
		"title",
		"translate",
		"writingsuggestions"
	])],
	["a", /* @__PURE__ */ new Set([
		"charset",
		"coords",
		"download",
		"href",
		"hreflang",
		"name",
		"ping",
		"referrerpolicy",
		"rel",
		"rev",
		"shape",
		"target",
		"type"
	])],
	["applet", /* @__PURE__ */ new Set([
		"align",
		"alt",
		"archive",
		"code",
		"codebase",
		"height",
		"hspace",
		"name",
		"object",
		"vspace",
		"width"
	])],
	["area", /* @__PURE__ */ new Set([
		"alt",
		"coords",
		"download",
		"href",
		"hreflang",
		"nohref",
		"ping",
		"referrerpolicy",
		"rel",
		"shape",
		"target",
		"type"
	])],
	["audio", /* @__PURE__ */ new Set([
		"autoplay",
		"controls",
		"crossorigin",
		"loop",
		"muted",
		"preload",
		"src"
	])],
	["base", /* @__PURE__ */ new Set(["href", "target"])],
	["basefont", /* @__PURE__ */ new Set([
		"color",
		"face",
		"size"
	])],
	["blockquote", /* @__PURE__ */ new Set(["cite"])],
	["body", /* @__PURE__ */ new Set([
		"alink",
		"background",
		"bgcolor",
		"link",
		"text",
		"vlink"
	])],
	["br", /* @__PURE__ */ new Set(["clear"])],
	["button", /* @__PURE__ */ new Set([
		"command",
		"commandfor",
		"disabled",
		"form",
		"formaction",
		"formenctype",
		"formmethod",
		"formnovalidate",
		"formtarget",
		"name",
		"popovertarget",
		"popovertargetaction",
		"type",
		"value"
	])],
	["canvas", /* @__PURE__ */ new Set(["height", "width"])],
	["caption", /* @__PURE__ */ new Set(["align"])],
	["col", /* @__PURE__ */ new Set([
		"align",
		"char",
		"charoff",
		"span",
		"valign",
		"width"
	])],
	["colgroup", /* @__PURE__ */ new Set([
		"align",
		"char",
		"charoff",
		"span",
		"valign",
		"width"
	])],
	["data", /* @__PURE__ */ new Set(["value"])],
	["del", /* @__PURE__ */ new Set(["cite", "datetime"])],
	["details", /* @__PURE__ */ new Set(["name", "open"])],
	["dialog", /* @__PURE__ */ new Set(["closedby", "open"])],
	["dir", /* @__PURE__ */ new Set(["compact"])],
	["div", /* @__PURE__ */ new Set(["align"])],
	["dl", /* @__PURE__ */ new Set(["compact"])],
	["embed", /* @__PURE__ */ new Set([
		"height",
		"src",
		"type",
		"width"
	])],
	["fieldset", /* @__PURE__ */ new Set([
		"disabled",
		"form",
		"name"
	])],
	["font", /* @__PURE__ */ new Set([
		"color",
		"face",
		"size"
	])],
	["form", /* @__PURE__ */ new Set([
		"accept",
		"accept-charset",
		"action",
		"autocomplete",
		"enctype",
		"method",
		"name",
		"novalidate",
		"target"
	])],
	["frame", /* @__PURE__ */ new Set([
		"frameborder",
		"longdesc",
		"marginheight",
		"marginwidth",
		"name",
		"noresize",
		"scrolling",
		"src"
	])],
	["frameset", /* @__PURE__ */ new Set(["cols", "rows"])],
	["h1", /* @__PURE__ */ new Set(["align"])],
	["h2", /* @__PURE__ */ new Set(["align"])],
	["h3", /* @__PURE__ */ new Set(["align"])],
	["h4", /* @__PURE__ */ new Set(["align"])],
	["h5", /* @__PURE__ */ new Set(["align"])],
	["h6", /* @__PURE__ */ new Set(["align"])],
	["head", /* @__PURE__ */ new Set(["profile"])],
	["hr", /* @__PURE__ */ new Set([
		"align",
		"noshade",
		"size",
		"width"
	])],
	["html", /* @__PURE__ */ new Set(["manifest", "version"])],
	["iframe", /* @__PURE__ */ new Set([
		"align",
		"allow",
		"allowfullscreen",
		"allowpaymentrequest",
		"allowusermedia",
		"frameborder",
		"height",
		"loading",
		"longdesc",
		"marginheight",
		"marginwidth",
		"name",
		"referrerpolicy",
		"sandbox",
		"scrolling",
		"src",
		"srcdoc",
		"width"
	])],
	["img", /* @__PURE__ */ new Set([
		"align",
		"alt",
		"border",
		"crossorigin",
		"decoding",
		"fetchpriority",
		"height",
		"hspace",
		"ismap",
		"loading",
		"longdesc",
		"name",
		"referrerpolicy",
		"sizes",
		"src",
		"srcset",
		"usemap",
		"vspace",
		"width"
	])],
	["input", /* @__PURE__ */ new Set([
		"accept",
		"align",
		"alpha",
		"alt",
		"autocomplete",
		"checked",
		"colorspace",
		"dirname",
		"disabled",
		"form",
		"formaction",
		"formenctype",
		"formmethod",
		"formnovalidate",
		"formtarget",
		"height",
		"ismap",
		"list",
		"max",
		"maxlength",
		"min",
		"minlength",
		"multiple",
		"name",
		"pattern",
		"placeholder",
		"popovertarget",
		"popovertargetaction",
		"readonly",
		"required",
		"size",
		"src",
		"step",
		"type",
		"usemap",
		"value",
		"width"
	])],
	["ins", /* @__PURE__ */ new Set(["cite", "datetime"])],
	["isindex", /* @__PURE__ */ new Set(["prompt"])],
	["label", /* @__PURE__ */ new Set(["for", "form"])],
	["legend", /* @__PURE__ */ new Set(["align"])],
	["li", /* @__PURE__ */ new Set(["type", "value"])],
	["link", /* @__PURE__ */ new Set([
		"as",
		"blocking",
		"charset",
		"color",
		"crossorigin",
		"disabled",
		"fetchpriority",
		"href",
		"hreflang",
		"imagesizes",
		"imagesrcset",
		"integrity",
		"media",
		"referrerpolicy",
		"rel",
		"rev",
		"sizes",
		"target",
		"type"
	])],
	["map", /* @__PURE__ */ new Set(["name"])],
	["menu", /* @__PURE__ */ new Set(["compact"])],
	["meta", /* @__PURE__ */ new Set([
		"charset",
		"content",
		"http-equiv",
		"media",
		"name",
		"scheme"
	])],
	["meter", /* @__PURE__ */ new Set([
		"high",
		"low",
		"max",
		"min",
		"optimum",
		"value"
	])],
	["object", /* @__PURE__ */ new Set([
		"align",
		"archive",
		"border",
		"classid",
		"codebase",
		"codetype",
		"data",
		"declare",
		"form",
		"height",
		"hspace",
		"name",
		"standby",
		"type",
		"typemustmatch",
		"usemap",
		"vspace",
		"width"
	])],
	["ol", /* @__PURE__ */ new Set([
		"compact",
		"reversed",
		"start",
		"type"
	])],
	["optgroup", /* @__PURE__ */ new Set(["disabled", "label"])],
	["option", /* @__PURE__ */ new Set([
		"disabled",
		"label",
		"selected",
		"value"
	])],
	["output", /* @__PURE__ */ new Set([
		"for",
		"form",
		"name"
	])],
	["p", /* @__PURE__ */ new Set(["align"])],
	["param", /* @__PURE__ */ new Set([
		"name",
		"type",
		"value",
		"valuetype"
	])],
	["pre", /* @__PURE__ */ new Set(["width"])],
	["progress", /* @__PURE__ */ new Set(["max", "value"])],
	["q", /* @__PURE__ */ new Set(["cite"])],
	["script", /* @__PURE__ */ new Set([
		"async",
		"blocking",
		"charset",
		"crossorigin",
		"defer",
		"fetchpriority",
		"integrity",
		"language",
		"nomodule",
		"referrerpolicy",
		"src",
		"type"
	])],
	["select", /* @__PURE__ */ new Set([
		"autocomplete",
		"disabled",
		"form",
		"multiple",
		"name",
		"required",
		"size"
	])],
	["slot", /* @__PURE__ */ new Set(["name"])],
	["source", /* @__PURE__ */ new Set([
		"height",
		"media",
		"sizes",
		"src",
		"srcset",
		"type",
		"width"
	])],
	["style", /* @__PURE__ */ new Set([
		"blocking",
		"media",
		"type"
	])],
	["table", /* @__PURE__ */ new Set([
		"align",
		"bgcolor",
		"border",
		"cellpadding",
		"cellspacing",
		"frame",
		"rules",
		"summary",
		"width"
	])],
	["tbody", /* @__PURE__ */ new Set([
		"align",
		"char",
		"charoff",
		"valign"
	])],
	["td", /* @__PURE__ */ new Set([
		"abbr",
		"align",
		"axis",
		"bgcolor",
		"char",
		"charoff",
		"colspan",
		"headers",
		"height",
		"nowrap",
		"rowspan",
		"scope",
		"valign",
		"width"
	])],
	["template", /* @__PURE__ */ new Set([
		"shadowrootclonable",
		"shadowrootcustomelementregistry",
		"shadowrootdelegatesfocus",
		"shadowrootmode",
		"shadowrootserializable"
	])],
	["textarea", /* @__PURE__ */ new Set([
		"autocomplete",
		"cols",
		"dirname",
		"disabled",
		"form",
		"maxlength",
		"minlength",
		"name",
		"placeholder",
		"readonly",
		"required",
		"rows",
		"wrap"
	])],
	["tfoot", /* @__PURE__ */ new Set([
		"align",
		"char",
		"charoff",
		"valign"
	])],
	["th", /* @__PURE__ */ new Set([
		"abbr",
		"align",
		"axis",
		"bgcolor",
		"char",
		"charoff",
		"colspan",
		"headers",
		"height",
		"nowrap",
		"rowspan",
		"scope",
		"valign",
		"width"
	])],
	["thead", /* @__PURE__ */ new Set([
		"align",
		"char",
		"charoff",
		"valign"
	])],
	["time", /* @__PURE__ */ new Set(["datetime"])],
	["tr", /* @__PURE__ */ new Set([
		"align",
		"bgcolor",
		"char",
		"charoff",
		"valign"
	])],
	["track", /* @__PURE__ */ new Set([
		"default",
		"kind",
		"label",
		"src",
		"srclang"
	])],
	["ul", /* @__PURE__ */ new Set(["compact", "type"])],
	["video", /* @__PURE__ */ new Set([
		"autoplay",
		"controls",
		"crossorigin",
		"height",
		"loop",
		"muted",
		"playsinline",
		"poster",
		"preload",
		"src",
		"width"
	])]
]);
var $i$1 = /* @__PURE__ */ new Set([
	"a",
	"abbr",
	"acronym",
	"address",
	"applet",
	"area",
	"article",
	"aside",
	"audio",
	"b",
	"base",
	"basefont",
	"bdi",
	"bdo",
	"bgsound",
	"big",
	"blink",
	"blockquote",
	"body",
	"br",
	"button",
	"canvas",
	"caption",
	"center",
	"cite",
	"code",
	"col",
	"colgroup",
	"command",
	"content",
	"data",
	"datalist",
	"dd",
	"del",
	"details",
	"dfn",
	"dialog",
	"dir",
	"div",
	"dl",
	"dt",
	"em",
	"embed",
	"fencedframe",
	"fieldset",
	"figcaption",
	"figure",
	"font",
	"footer",
	"form",
	"frame",
	"frameset",
	"geolocation",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"head",
	"header",
	"hgroup",
	"hr",
	"html",
	"i",
	"iframe",
	"image",
	"img",
	"input",
	"ins",
	"isindex",
	"kbd",
	"keygen",
	"label",
	"legend",
	"li",
	"link",
	"listing",
	"main",
	"map",
	"mark",
	"marquee",
	"math",
	"menu",
	"menuitem",
	"meta",
	"meter",
	"multicol",
	"nav",
	"nextid",
	"nobr",
	"noembed",
	"noframes",
	"noscript",
	"object",
	"ol",
	"optgroup",
	"option",
	"output",
	"p",
	"param",
	"picture",
	"plaintext",
	"pre",
	"progress",
	"q",
	"rb",
	"rbc",
	"rp",
	"rt",
	"rtc",
	"ruby",
	"s",
	"samp",
	"script",
	"search",
	"section",
	"select",
	"selectedcontent",
	"shadow",
	"slot",
	"small",
	"source",
	"spacer",
	"span",
	"strike",
	"strong",
	"style",
	"sub",
	"summary",
	"sup",
	"svg",
	"table",
	"tbody",
	"td",
	"template",
	"textarea",
	"tfoot",
	"th",
	"thead",
	"time",
	"title",
	"tr",
	"track",
	"tt",
	"u",
	"ul",
	"var",
	"video",
	"wbr",
	"xmp"
]);
var Ht$1 = {
	attrs: !0,
	children: !0,
	cases: !0,
	expression: !0
};
var ji$1 = /* @__PURE__ */ new Set(["parent"]);
var ie$1;
var Tr$1;
var yr$1;
var Me$1 = class Me {
	constructor(t = {}) {
		Rr$1(this, ie$1);
		Wt$1(this, "kind");
		Wt$1(this, "parent");
		for (let r of /* @__PURE__ */ new Set([...ji$1, ...Object.keys(t)])) this.setProperty(r, t[r]);
		if (ae$1(t)) for (let r of Object.getOwnPropertySymbols(t)) this.setProperty(r, t[r]);
	}
	setProperty(t, r) {
		if (this[t] !== r) {
			if (t in Ht$1 && (r = r.map((n) => this.createChild(n))), !ji$1.has(t)) {
				this[t] = r;
				return;
			}
			Object.defineProperty(this, t, {
				value: r,
				enumerable: !1,
				configurable: !0
			});
		}
	}
	map(t) {
		let r;
		for (let n in Ht$1) {
			let i = this[n];
			if (i) {
				let s = Eo$1(i, (a) => a.map(t));
				r !== i && (r ?? (r = new Me({ parent: this.parent })), r.setProperty(n, s));
			}
		}
		if (r) for (let n in this) n in Ht$1 || (r[n] = this[n]);
		return t(r || this);
	}
	walk(t) {
		for (let r in Ht$1) {
			let n = this[r];
			if (n) for (let i = 0; i < n.length; i++) n[i].walk(t);
		}
		t(this);
	}
	createChild(t) {
		let r = t instanceof Me ? t.clone() : new Me(t);
		return r.setProperty("parent", this), r;
	}
	insertChildBefore(t, r) {
		let n = this.$children;
		n.splice(n.indexOf(t), 0, this.createChild(r));
	}
	removeChild(t) {
		let r = this.$children;
		r.splice(r.indexOf(t), 1);
	}
	replaceChild(t, r) {
		let n = this.$children;
		n[n.indexOf(t)] = this.createChild(r);
	}
	clone() {
		return new Me(this);
	}
	get $children() {
		return this[qe$1(this, ie$1, Tr$1)];
	}
	set $children(t) {
		this[qe$1(this, ie$1, Tr$1)] = t;
	}
	get firstChild() {
		return this.$children?.[0];
	}
	get lastChild() {
		return I$2(1, this.$children, -1);
	}
	get prev() {
		let t = qe$1(this, ie$1, yr$1);
		return t[t.indexOf(this) - 1];
	}
	get next() {
		let t = qe$1(this, ie$1, yr$1);
		return t[t.indexOf(this) + 1];
	}
	get rawName() {
		return this.hasExplicitNamespace ? this.fullName : this.name;
	}
	get fullName() {
		return this.namespace ? this.namespace + ":" + this.name : this.name;
	}
	get attrMap() {
		return Object.fromEntries(this.attrs.map((t) => [t.fullName, t.value]));
	}
};
ie$1 = /* @__PURE__ */ new WeakSet(), Tr$1 = function() {
	return this.kind === "angularIcuCase" ? "expression" : this.kind === "angularIcuExpression" ? "cases" : "children";
}, yr$1 = function() {
	return this.parent?.$children ?? [];
};
var Ft$1 = Me$1;
function Eo$1(e, t) {
	let r = e.map(t);
	return r.some((n, i) => n !== e[i]) ? r : e;
}
var xo$1 = [
	{
		regex: /^(?<openingTagSuffix>\[if(?<condition>[^\]]*)\]>)(?<data>.*?)<!\s*\[endif\]$/s,
		parse: Lo$1
	},
	{
		regex: /^\[if(?<condition>[^\]]*)\]><!$/,
		parse: Ao$1
	},
	{
		regex: /^<!\s*\[endif\]$/,
		parse: Po$1
	}
];
function Yi$1(e, t) {
	if (e.value) for (let { regex: r, parse: n } of xo$1) {
		let i = e.value.match(r);
		if (i) return n(e, i, t);
	}
	return null;
}
function Lo$1(e, t, r) {
	let { openingTagSuffix: n, condition: i, data: s } = t.groups, a = 4 + n.length, o = e.sourceSpan.start.moveBy(a), l = o.moveBy(s.length), [c, u] = (() => {
		try {
			return [!0, r(s, o).children];
		} catch {
			return [!1, [{
				kind: "text",
				value: s,
				sourceSpan: new p(o, l)
			}]];
		}
	})();
	return {
		kind: "ieConditionalComment",
		complete: c,
		children: u,
		condition: T$1(0, i.trim(), /\s+/g, " "),
		sourceSpan: e.sourceSpan,
		startSourceSpan: new p(e.sourceSpan.start, o),
		endSourceSpan: new p(l, e.sourceSpan.end)
	};
}
function Ao$1(e, t) {
	let { condition: r } = t.groups;
	return {
		kind: "ieConditionalStartComment",
		condition: T$1(0, r.trim(), /\s+/g, " "),
		sourceSpan: e.sourceSpan
	};
}
function Po$1(e) {
	return {
		kind: "ieConditionalEndComment",
		sourceSpan: e.sourceSpan
	};
}
var Er$1 = class extends gr$1 {
	visitExpansionCase(t, r) {
		r.parseOptions.name === "angular" && this.visitChildren(r, (n) => {
			n(t.expression);
		});
	}
	visit(t, { parseOptions: r }) {
		Ro$1(t), Oo(t, r), Bo(t, r), Mo$1(t);
	}
};
function Xi(e, t, r, n) {
	let i = r.name === "angular";
	It$1(new Er$1(), e.children, { parseOptions: r }), t && e.children.unshift(t);
	let s = new Ft$1(e);
	return s.walk((a) => {
		if (a.kind === "comment") {
			let o = Yi$1(a, n);
			o && a.parent.replaceChild(a, o);
		} else i && a.kind === "element" && a.comments && (a.startTagComments = a.comments, delete a.comments);
		i && (No$1(a), Do$1(a), Io$1(a));
	}), s;
}
function No$1(e) {
	if (e.kind === "block") {
		if (e.name = T$1(0, e.name.toLowerCase(), /\s+/g, " ").trim(), e.kind = "angularControlFlowBlock", !J(e.parameters)) {
			delete e.parameters;
			return;
		}
		for (let t of e.parameters) t.kind = "angularControlFlowBlockParameter";
		e.parameters = {
			kind: "angularControlFlowBlockParameters",
			children: e.parameters,
			sourceSpan: new p(e.parameters[0].sourceSpan.start, I$2(0, e.parameters, -1).sourceSpan.end)
		};
	}
}
function Do$1(e) {
	e.kind === "letDeclaration" && (e.kind = "angularLetDeclaration", e.id = e.name, e.init = {
		kind: "angularLetDeclarationInitializer",
		sourceSpan: new p(e.valueSpan.start, e.valueSpan.end),
		value: e.value
	}, delete e.name, delete e.value);
}
function Io$1(e) {
	e.kind === "expansion" && (e.kind = "angularIcuExpression"), e.kind === "expansionCase" && (e.kind = "angularIcuCase");
}
function Ki(e, t) {
	let r = e.toLowerCase();
	return t(r) ? r : e;
}
function Qi(e) {
	let t = e.name.startsWith(":") ? e.name.slice(1).split(":", 1)[0] : null, r = e.nameSpan.toString(), n = t !== null && r.startsWith(`${t}:`);
	e.name = n ? r.slice(t.length + 1) : r, e.namespace = t, e.hasExplicitNamespace = n;
}
function Ro$1(e) {
	switch (e.kind) {
		case "element":
			Qi(e);
			for (let t of e.attrs) Qi(t), t.valueSpan ? (t.value = t.valueSpan.toString(), /["']/.test(t.value[0]) && (t.value = t.value.slice(1, -1))) : t.value = null;
			break;
		case "comment":
			e.value = e.sourceSpan.toString().slice(4, -3);
			break;
		case "text": e.value = e.sourceSpan.toString();
	}
}
function Oo(e, t) {
	if (e.kind === "element") {
		let r = Ne$1(t.isTagNameCaseSensitive ? e.name : e.name.toLowerCase());
		!e.namespace || e.namespace === r.implicitNamespacePrefix || oe$1(e) ? e.tagDefinition = r : e.tagDefinition = Ne$1("");
	}
}
function Mo$1(e) {
	e.sourceSpan && e.endSourceSpan && (e.sourceSpan = new p(e.sourceSpan.start, e.endSourceSpan.end));
}
function Bo(e, t) {
	if (e.kind === "element" && (t.normalizeTagName && (!e.namespace || e.namespace === e.tagDefinition.implicitNamespacePrefix || oe$1(e)) && (e.name = Ki(e.name, (r) => $i$1.has(r))), t.normalizeAttributeName)) for (let r of e.attrs) r.namespace || (r.name = Ki(r.name, (n) => qt$1.has(e.name) && (qt$1.get("*").has(n) || qt$1.get(e.name).has(n))));
}
function Lr$1(e, t) {
	let { rootNodes: r, errors: n } = Mt$1(e, wr$1(t));
	return n.length > 0 && xr$1(n[0]), {
		parseOptions: t,
		rootNodes: r
	};
}
function Ji(e, t) {
	let r = wr$1(t), { rootNodes: n, errors: i } = Mt$1(e, r);
	if (n.some((c) => c.kind === "docType" && c.value === "html" || c.kind === "element" && c.name.toLowerCase() === "html")) return Lr$1(e, Vt$1);
	let a, o = () => a ?? (a = Mt$1(e, {
		...r,
		getTagContentType: void 0
	})), l = (c) => {
		let { offset: u } = c.startSourceSpan.start;
		return o().rootNodes.find((d) => d.kind === "element" && d.startSourceSpan.start.offset === u) ?? c;
	};
	for (let [c, u] of n.entries()) if (u.kind === "element") {
		if (u.isVoid) i = o().errors, n[c] = l(u);
		else if (qo$1(u)) {
			let { endSourceSpan: d, startSourceSpan: _ } = u, h = o().errors.find((f) => f.span.start.offset > _.start.offset && f.span.start.offset < d.end.offset);
			h && xr$1(h), n[c] = l(u);
		}
	}
	return i.length > 0 && xr$1(i[0]), {
		parseOptions: t,
		rootNodes: n
	};
}
function qo$1(e) {
	if (e.kind !== "element" || e.name !== "template") return !1;
	let t = e.attrs.find((r) => r.name === "lang")?.value;
	return !t || t === "html";
}
function xr$1(e) {
	let { msg: t, span: { start: r, end: n } } = e;
	throw Gi(t, {
		loc: {
			start: {
				line: r.line + 1,
				column: r.col + 1
			},
			end: {
				line: n.line + 1,
				column: n.col + 1
			}
		},
		cause: e
	});
}
function Ho$1(e, t, r, n, i, s) {
	let { offset: a } = n, l = Ar$1(vt$1(t.slice(0, a)) + r, e, {
		...i,
		shouldParseFrontMatter: !1
	}, s);
	l.sourceSpan = new p(n, I$2(0, l.children, -1).sourceSpan.end);
	let c = l.children[0];
	return c.length === a ? l.children.shift() : (c.sourceSpan = new p(c.sourceSpan.start.moveBy(a), c.sourceSpan.end), c.value = c.value.slice(a)), l;
}
function Ar$1(e, t, r, n = {}) {
	let { frontMatter: i, content: s } = r.shouldParseFrontMatter ? Qt$1(e) : { content: e }, a = new rt$1(e, n.filepath), o = new De$1(a, 0, 0, 0), l = o.moveBy(e.length), { parseOptions: c, rootNodes: u } = t(s, r), d = {
		kind: "root",
		sourceSpan: new p(o, l),
		children: u
	}, _;
	if (i) {
		let [f, g] = [i.start, i.end].map((v) => new De$1(a, v.index, v.line - 1, v.column));
		_ = {
			...i,
			kind: "frontMatter",
			sourceSpan: new p(f, g)
		};
	}
	return Xi(d, _, c, (f, g) => Ho$1(t, e, f, g, c, n));
}
var Vt$1 = Bt$1({
	name: "html",
	normalizeTagName: !0,
	normalizeAttributeName: !0,
	allowHtmComponentClosingTags: !0
});
function st$1(e) {
	let t = Bt$1(e), r = t.name === "vue" ? Ji : Lr$1;
	return {
		parse: (n, i) => Ar$1(n, r, t, i),
		hasPragma: Jn$1,
		hasIgnorePragma: Zn$1,
		astFormat: "html",
		locStart: F,
		locEnd: Z$1
	};
}
var Fo$1 = st$1(Vt$1);
var Vo$1 = /* @__PURE__ */ new Set(["mj-style", "mj-raw"]);
var Uo$1 = st$1({
	...Vt$1,
	name: "mjml",
	shouldParseAsRawText: (e) => Vo$1.has(e)
});
var Wo$1 = st$1({
	name: "angular",
	tokenizeAngularBlocks: !0,
	tokenizeAngularLetDeclaration: !0,
	allowStartTagComments: !0
});
var zo = st$1({
	name: "vue",
	isTagNameCaseSensitive: !0,
	shouldParseAsRawText(e, t, r, n) {
		return e.toLowerCase() !== "html" && !r && (e !== "template" || n.some(({ name: i, value: s }) => i === "lang" && s !== "html" && s !== "" && s !== void 0));
	}
});
var Go$1 = st$1({
	name: "lwc",
	canSelfClose: !1
});
var $o$1 = { html: Vi$1 };
//#endregion
//#region node_modules/.pnpm/prettier@3.9.9/node_modules/prettier/standalone.mjs
var Ru = Object.defineProperty;
var yt = (t, e) => {
	for (var r in e) Ru(t, r, {
		get: e[r],
		enumerable: !0
	});
};
yt({}, {
	__debug: () => $i,
	check: () => Vi,
	doc: () => ar,
	format: () => Pu,
	formatWithCursor: () => Ou,
	getSupportInfo: () => Wi,
	util: () => fr,
	version: () => gu
});
var X = (t, e) => (r, n, ...u) => r | 1 && n == null ? void 0 : (e.call(n) ?? n[t]).apply(n, u);
var vu = String.prototype.replaceAll ?? function(t, e) {
	return t.global ? this.replace(t, e) : this.split(t).join(e);
};
var ne = X("replaceAll", function() {
	if (typeof this == "string") return vu;
});
var Ne = class {
	diff(e, r, n = {}) {
		let u;
		typeof n == "function" ? (u = n, n = {}) : "callback" in n && (u = n.callback);
		let o = this.castInput(e, n), i = this.castInput(r, n), D = this.removeEmpty(this.tokenize(o, n)), s = this.removeEmpty(this.tokenize(i, n));
		return this.diffWithOptionsObj(D, s, n, u);
	}
	diffWithOptionsObj(e, r, n, u) {
		var o;
		let i = (C) => {
			if (C = this.postProcess(C, n), u) {
				setTimeout(function() {
					u(C);
				}, 0);
				return;
			} else return C;
		}, D = r.length, s = e.length, a = 1, c = D + s;
		n.maxEditLength != null && (c = Math.min(c, n.maxEditLength));
		let p = (o = n.timeout) !== null && o !== void 0 ? o : 1 / 0, l = Date.now() + p, m = [{
			oldPos: -1,
			lastComponent: void 0
		}], f = this.extractCommon(m[0], r, e, 0, n);
		if (m[0].oldPos + 1 >= s && f + 1 >= D) return i(this.buildValues(m[0].lastComponent, r, e));
		let F = -1 / 0, d = 1 / 0, E = () => {
			for (let C = Math.max(F, -a); C <= Math.min(d, a); C += 2) {
				let h, _ = m[C - 1], P = m[C + 1];
				_ && (m[C - 1] = void 0);
				let A = !1;
				if (P) {
					let J = P.oldPos - C;
					A = P && 0 <= J && J < D;
				}
				let B = _ && _.oldPos + 1 < s;
				if (!A && !B) {
					m[C] = void 0;
					continue;
				}
				if (!B || A && _.oldPos < P.oldPos ? h = this.addToPath(P, !0, !1, 0, n) : h = this.addToPath(_, !1, !0, 1, n), f = this.extractCommon(h, r, e, C, n), h.oldPos + 1 >= s && f + 1 >= D) return i(this.buildValues(h.lastComponent, r, e)) || !0;
				m[C] = h, h.oldPos + 1 >= s && (d = Math.min(d, C - 1)), f + 1 >= D && (F = Math.max(F, C + 1));
			}
			a++;
		};
		if (u) (function C() {
			setTimeout(function() {
				if (a > c || Date.now() > l) return u(void 0);
				E() || C();
			}, 0);
		})();
		else for (; a <= c && Date.now() <= l;) {
			let C = E();
			if (C) return C;
		}
	}
	addToPath(e, r, n, u, o) {
		let i = e.lastComponent;
		return i && !o.oneChangePerToken && i.added === r && i.removed === n ? {
			oldPos: e.oldPos + u,
			lastComponent: {
				count: i.count + 1,
				added: r,
				removed: n,
				previousComponent: i.previousComponent
			}
		} : {
			oldPos: e.oldPos + u,
			lastComponent: {
				count: 1,
				added: r,
				removed: n,
				previousComponent: i
			}
		};
	}
	extractCommon(e, r, n, u, o) {
		let i = r.length, D = n.length, s = e.oldPos, a = s - u, c = 0;
		for (; a + 1 < i && s + 1 < D && this.equals(n[s + 1], r[a + 1], o);) a++, s++, c++, o.oneChangePerToken && (e.lastComponent = {
			count: 1,
			previousComponent: e.lastComponent,
			added: !1,
			removed: !1
		});
		return c && !o.oneChangePerToken && (e.lastComponent = {
			count: c,
			previousComponent: e.lastComponent,
			added: !1,
			removed: !1
		}), e.oldPos = s, a;
	}
	equals(e, r, n) {
		return n.comparator ? n.comparator(e, r) : e === r || !!n.ignoreCase && e.toLowerCase() === r.toLowerCase();
	}
	removeEmpty(e) {
		let r = [];
		for (let n = 0; n < e.length; n++) e[n] && r.push(e[n]);
		return r;
	}
	castInput(e, r) {
		return e;
	}
	tokenize(e, r) {
		return Array.from(e);
	}
	join(e) {
		return e.join("");
	}
	postProcess(e, r) {
		return e;
	}
	get useLongestToken() {
		return !1;
	}
	buildValues(e, r, n) {
		let u = [], o;
		for (; e;) u.push(e), o = e.previousComponent, delete e.previousComponent, e = o;
		u.reverse();
		let i = u.length, D = 0, s = 0, a = 0;
		for (; D < i; D++) {
			let c = u[D];
			if (c.removed) c.value = this.join(n.slice(a, a + c.count)), a += c.count;
			else {
				if (!c.added && this.useLongestToken) {
					let p = r.slice(s, s + c.count);
					p = p.map(function(l, m) {
						let f = n[a + m];
						return f.length > l.length ? f : l;
					}), c.value = this.join(p);
				} else c.value = this.join(r.slice(s, s + c.count));
				s += c.count, c.added || (a += c.count);
			}
		}
		return u;
	}
};
var At = class extends Ne {
	tokenize(e) {
		return e.slice();
	}
	join(e) {
		return e;
	}
	removeEmpty(e) {
		return e;
	}
};
var pr = new At();
function xt(t, e, r) {
	return pr.diff(t, e, r);
}
var Mu = () => {};
var k = Mu;
var dr = "cr";
var Fr = "crlf";
var ju = "lf";
var Bt = "\r";
var Er = `\r
`;
var ze = `
`;
var Uu = ze;
function Cr(t) {
	let e = t.indexOf(Bt);
	return e !== -1 ? t.charAt(e + 1) === ze ? Fr : dr : ju;
}
function we(t) {
	return t === dr ? Bt : t === Fr ? Er : Uu;
}
var Vu = /* @__PURE__ */ new Map([
	[ze, /\n/g],
	[Bt, /\r/g],
	[Er, /\r\n/g]
]);
function Tt(t, e) {
	let r = Vu.get(e);
	return t.match(r)?.length ?? 0;
}
var Wu = /\r\n?/g;
function hr(t) {
	return ne(0, t, Wu, ze);
}
var ue = Symbol.for("comments");
function $u(t) {
	return this[t < 0 ? this.length + t : t];
}
var y = X("at", function() {
	if (Array.isArray(this) || typeof this == "string") return $u;
});
var G = "string";
var U = "array";
var V$1 = "cursor";
var I$1 = "indent";
var R = "align";
var v = "trim";
var x = "group";
var S = "fill";
var T = "if-break";
var L = "indent-if-break";
var M = "line-suffix";
var Y = "line-suffix-boundary";
var g = "line";
var b = "label";
var N = "break-parent";
var Ge = /* @__PURE__ */ new Set([
	V$1,
	I$1,
	R,
	v,
	x,
	S,
	T,
	L,
	M,
	Y,
	g,
	b,
	N
]);
function gr(t) {
	let e = t.length;
	for (; e > 0 && (t[e - 1] === "\r" || t[e - 1] === `
`);) e--;
	return e < t.length ? t.slice(0, e) : t;
}
function Fe(t, e, r) {
	if (!t.has(e)) {
		let n = r(e);
		t.set(e, n);
	}
	return t.get(e);
}
function Gu(t) {
	if (typeof t == "string") return G;
	if (Array.isArray(t)) return U;
	if (!t) return;
	let { type: e } = t;
	if (Ge.has(e)) return e;
}
var q = Gu;
var Ku = (t) => new Intl.ListFormat("en-US", { type: "disjunction" }).format(t);
function Hu(t) {
	let e = t === null ? "null" : typeof t;
	if (e !== "string" && e !== "object") return `Unexpected doc '${e}', 
Expected it to be 'string' or 'object'.`;
	if (q(t)) throw new Error("doc is valid.");
	let r = Object.prototype.toString.call(t);
	if (r !== "[object Object]") return `Unexpected doc '${r}'.`;
	let n = Ku([...Ge].map((u) => `'${u}'`));
	return `Unexpected doc.type '${t.type}'.
Expected it to be ${n}.`;
}
var Nt = class extends Error {
	name = "InvalidDocError";
	constructor(e) {
		super(Hu(e)), this.doc = e;
	}
};
var Z = Nt;
var _r = {};
function Ju(t, e, r, n) {
	let u = [t];
	for (; u.length > 0;) {
		let o = u.pop();
		if (o === _r) {
			r(u.pop());
			continue;
		}
		r && u.push(o, _r);
		let i = q(o);
		if (!i) throw new Z(o);
		if (e?.(o) !== !1) switch (i) {
			case U:
			case S: {
				let D = i === U ? o : o.parts;
				for (let a = D.length - 1; a >= 0; --a) u.push(D[a]);
				break;
			}
			case T:
				u.push(o.flatContents, o.breakContents);
				break;
			case x:
				if (n && o.expandedStates) for (let D = o.expandedStates.length, s = D - 1; s >= 0; --s) u.push(o.expandedStates[s]);
				else u.push(o.contents);
				break;
			case R:
			case I$1:
			case L:
			case b:
			case M:
				u.push(o.contents);
				break;
			case G:
			case V$1:
			case v:
			case Y:
			case g:
			case N: break;
			default: throw new Z(o);
		}
	}
}
var Oe = Ju;
function Se(t, e) {
	if (typeof t == "string") return e(t);
	let r = /* @__PURE__ */ new Map();
	return n(t);
	function n(o) {
		return Fe(r, o, u);
	}
	function u(o) {
		switch (q(o)) {
			case U: return e(o.map(n));
			case S: return e({
				...o,
				parts: o.parts.map(n)
			});
			case T: return e({
				...o,
				breakContents: n(o.breakContents),
				flatContents: n(o.flatContents)
			});
			case x: {
				let { expandedStates: i, contents: D } = o;
				return i ? (i = i.map(n), D = i[0]) : D = n(D), e({
					...o,
					contents: D,
					expandedStates: i
				});
			}
			case R:
			case I$1:
			case L:
			case b:
			case M: return e({
				...o,
				contents: n(o.contents)
			});
			case G:
			case V$1:
			case v:
			case Y:
			case g:
			case N: return e(o);
			default: throw new Z(o);
		}
	}
}
function Ke(t, e, r) {
	let n = r, u = !1;
	function o(i) {
		if (u) return !1;
		let D = e(i);
		D !== void 0 && (u = !0, n = D);
	}
	return Oe(t, o), n;
}
function qu(t) {
	if (t.type === x && t.break || t.type === g && t.hard || t.type === N) return !0;
}
function xr(t) {
	return Ke(t, qu, !1);
}
function yr(t) {
	if (t.length > 0) {
		let e = y(0, t, -1);
		!e.expandedStates && !e.break && (e.break = "propagated");
	}
	return null;
}
function Br(t) {
	let e = /* @__PURE__ */ new Set(), r = [];
	function n(o) {
		if (o.type === N && yr(r), o.type === x) {
			if (r.push(o), e.has(o)) return !1;
			e.add(o);
		}
	}
	function u(o) {
		o.type === x && r.pop().break && yr(r);
	}
	Oe(t, n, u, !0);
}
function Xu(t) {
	return t.type === g && !t.hard ? t.soft ? "" : " " : t.type === T ? t.flatContents : t;
}
function Tr(t) {
	return Se(t, Xu);
}
function Ar(t) {
	for (t = [...t]; t.length >= 2 && y(0, t, -2).type === g && y(0, t, -1).type === N;) t.length -= 2;
	if (t.length > 0) {
		let e = Pe(y(0, t, -1));
		t[t.length - 1] = e;
	}
	return t;
}
function Pe(t) {
	switch (q(t)) {
		case I$1:
		case L:
		case x:
		case M:
		case b: {
			let e = Pe(t.contents);
			return {
				...t,
				contents: e
			};
		}
		case T: return {
			...t,
			breakContents: Pe(t.breakContents),
			flatContents: Pe(t.flatContents)
		};
		case S: return {
			...t,
			parts: Ar(t.parts)
		};
		case U: return Ar(t);
		case G: return gr(t);
		case R:
		case V$1:
		case v:
		case Y:
		case g:
		case N: break;
		default: throw new Z(t);
	}
	return t;
}
function He(t) {
	return Pe(Zu(t));
}
function Qu(t) {
	switch (q(t)) {
		case S: {
			let { parts: e } = t;
			if (e.every((r) => r === "")) return "";
			if (e.length === 1) return e[0];
			break;
		}
		case x:
			if (!t.contents && !t.id && !t.break && !t.expandedStates) return "";
			if (t.contents.type === x && t.contents.id === t.id && t.contents.break === t.break && t.contents.expandedStates === t.expandedStates) return t.contents;
			break;
		case R:
		case I$1:
		case L:
		case M:
			if (!t.contents) return "";
			break;
		case T:
			if (!t.flatContents && !t.breakContents) return "";
			break;
		case U: {
			let e = [];
			for (let r of t) {
				if (!r) continue;
				let [n, ...u] = Array.isArray(r) ? r : [r];
				typeof n == "string" && typeof y(0, e, -1) == "string" ? e[e.length - 1] += n : e.push(n), e.push(...u);
			}
			return e.length === 0 ? "" : e.length === 1 ? e[0] : e;
		}
		case G:
		case V$1:
		case v:
		case Y:
		case g:
		case b:
		case N: break;
		default: throw new Z(t);
	}
	return t;
}
function Zu(t) {
	return Se(t, (e) => Qu(e));
}
function Nr(t, e = Je) {
	return Se(t, (r) => typeof r == "string" ? be(e, r.split(`
`)) : r);
}
function eo(t) {
	if (t.type === g) return !0;
}
function wr(t) {
	return Ke(t, eo, !1);
}
function Ee(t, e) {
	return t.type === b ? {
		...t,
		contents: e(t.contents)
	} : e(t);
}
var w = k;
var qe = k;
var Or = k;
var Pr = k;
function oe(t) {
	return w(t), {
		type: I$1,
		contents: t
	};
}
function De(t, e) {
	return Pr(t), w(e), {
		type: R,
		contents: e,
		n: t
	};
}
function Sr(t) {
	return De(Number.NEGATIVE_INFINITY, t);
}
function Xe(t) {
	return De({ type: "root" }, t);
}
function br(t) {
	return De(-1, t);
}
function Qe(t, e, r) {
	w(t);
	let n = t;
	if (e > 0) {
		for (let u = 0; u < Math.floor(e / r); ++u) n = oe(n);
		n = De(e % r, n), n = De(Number.NEGATIVE_INFINITY, n);
	}
	return n;
}
var ae = { type: N };
var ee = { type: V$1 };
function kr(t) {
	return Or(t), {
		type: S,
		parts: t
	};
}
function wt(t, e = {}) {
	return w(t), qe(e.expandedStates, !0), {
		type: x,
		id: e.id,
		contents: t,
		break: !!e.shouldBreak,
		expandedStates: e.expandedStates
	};
}
function Ir(t, e) {
	return wt(t[0], {
		...e,
		expandedStates: t
	});
}
function Rr(t, e = "", r = {}) {
	return w(t), e !== "" && w(e), {
		type: T,
		breakContents: t,
		flatContents: e,
		groupId: r.groupId
	};
}
function vr(t, e) {
	return w(t), {
		type: L,
		contents: t,
		groupId: e.groupId,
		negate: e.negate
	};
}
function be(t, e) {
	w(t), qe(e);
	let r = [];
	for (let n = 0; n < e.length; n++) n !== 0 && r.push(t), r.push(e[n]);
	return r;
}
function Lr(t, e) {
	return w(e), t ? {
		type: b,
		label: t,
		contents: e
	} : e;
}
var Ze = { type: g };
var Mr = {
	type: g,
	soft: !0
};
var ke = {
	type: g,
	hard: !0
};
var W = [ke, ae];
var Ot = {
	type: g,
	hard: !0,
	literal: !0
};
var Je = [Ot, ae];
function Ie(t) {
	return w(t), {
		type: M,
		contents: t
	};
}
var Yr = { type: Y };
var jr = { type: v };
function te(t) {
	if (!t) return "";
	if (Array.isArray(t)) {
		let e = [];
		for (let r of t) if (Array.isArray(r)) e.push(...te(r));
		else {
			let n = te(r);
			n !== "" && e.push(n);
		}
		return e;
	}
	return t.type === T ? {
		...t,
		breakContents: te(t.breakContents),
		flatContents: te(t.flatContents)
	} : t.type === x ? {
		...t,
		contents: te(t.contents),
		expandedStates: t.expandedStates?.map(te)
	} : t.type === S ? {
		type: "fill",
		parts: t.parts.map(te)
	} : t.contents ? {
		...t,
		contents: te(t.contents)
	} : t;
}
function Ur(t) {
	let e = Object.create(null), r = /* @__PURE__ */ new Set();
	return n(te(t));
	function n(o, i, D) {
		if (typeof o == "string") return JSON.stringify(o);
		if (Array.isArray(o)) {
			let s = o.map(n).filter(Boolean);
			return s.length === 1 ? s[0] : `[${s.join(", ")}]`;
		}
		if (o.type === g) {
			let s = D?.[i + 1]?.type === N;
			return o.literal ? s ? "literalline" : "literallineWithoutBreakParent" : o.hard ? s ? "hardline" : "hardlineWithoutBreakParent" : o.soft ? "softline" : "line";
		}
		if (o.type === N) return D?.[i - 1]?.type === g && D[i - 1].hard ? void 0 : "breakParent";
		if (o.type === v) return "trim";
		if (o.type === I$1) return "indent(" + n(o.contents) + ")";
		if (o.type === R) return o.n === Number.NEGATIVE_INFINITY ? "dedentToRoot(" + n(o.contents) + ")" : o.n < 0 ? "dedent(" + n(o.contents) + ")" : o.n.type === "root" ? "markAsRoot(" + n(o.contents) + ")" : "align(" + JSON.stringify(o.n) + ", " + n(o.contents) + ")";
		if (o.type === T) return "ifBreak(" + n(o.breakContents) + (o.flatContents ? ", " + n(o.flatContents) : "") + (o.groupId ? (o.flatContents ? "" : ", \"\"") + `, { groupId: ${u(o.groupId)} }` : "") + ")";
		if (o.type === L) {
			let s = [];
			o.negate && s.push("negate: true"), o.groupId && s.push(`groupId: ${u(o.groupId)}`);
			let a = s.length > 0 ? `, { ${s.join(", ")} }` : "";
			return `indentIfBreak(${n(o.contents)}${a})`;
		}
		if (o.type === x) {
			let s = [];
			o.break && o.break !== "propagated" && s.push("shouldBreak: true"), o.id && s.push(`id: ${u(o.id)}`);
			let a = s.length > 0 ? `, { ${s.join(", ")} }` : "";
			return o.expandedStates ? `conditionalGroup([${o.expandedStates.map((c) => n(c)).join(",")}]${a})` : `group(${n(o.contents)}${a})`;
		}
		if (o.type === S) return `fill([${o.parts.map((s) => n(s)).join(", ")}])`;
		if (o.type === M) return "lineSuffix(" + n(o.contents) + ")";
		if (o.type === Y) return "lineSuffixBoundary";
		if (o.type === b) return `label(${JSON.stringify(o.label)}, ${n(o.contents)})`;
		if (o.type === V$1) return "cursor";
		throw new Error("Unknown doc type " + o.type);
	}
	function u(o) {
		if (typeof o != "symbol") return JSON.stringify(String(o));
		if (o in e) return e[o];
		let i = o.description || "symbol";
		for (let D = 0;; D++) {
			let s = i + (D > 0 ? ` #${D}` : "");
			if (!r.has(s)) return r.add(s), e[o] = `Symbol.for(${JSON.stringify(s)})`;
		}
	}
}
var Vr = () => /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
var Wr = 12288;
var $r = 65510;
var zr = [
	12288,
	12288,
	65281,
	65376,
	65504,
	65510
];
var Gr = 4352;
var Kr = 262141;
var Pt = [
	4352,
	4447,
	8986,
	8987,
	9001,
	9002,
	9193,
	9196,
	9200,
	9200,
	9203,
	9203,
	9725,
	9726,
	9748,
	9749,
	9776,
	9783,
	9800,
	9811,
	9855,
	9855,
	9866,
	9871,
	9875,
	9875,
	9889,
	9889,
	9898,
	9899,
	9917,
	9918,
	9924,
	9925,
	9934,
	9934,
	9940,
	9940,
	9962,
	9962,
	9970,
	9971,
	9973,
	9973,
	9978,
	9978,
	9981,
	9981,
	9989,
	9989,
	9994,
	9995,
	10024,
	10024,
	10060,
	10060,
	10062,
	10062,
	10067,
	10069,
	10071,
	10071,
	10133,
	10135,
	10160,
	10160,
	10175,
	10175,
	11035,
	11036,
	11088,
	11088,
	11093,
	11093,
	11904,
	11929,
	11931,
	12019,
	12032,
	12245,
	12272,
	12287,
	12289,
	12350,
	12353,
	12438,
	12441,
	12543,
	12549,
	12591,
	12593,
	12686,
	12688,
	12773,
	12783,
	12830,
	12832,
	12871,
	12880,
	42124,
	42128,
	42182,
	43360,
	43388,
	44032,
	55203,
	63744,
	64255,
	65040,
	65049,
	65072,
	65106,
	65108,
	65126,
	65128,
	65131,
	94176,
	94180,
	94192,
	94198,
	94208,
	101589,
	101631,
	101662,
	101760,
	101874,
	110576,
	110579,
	110581,
	110587,
	110589,
	110590,
	110592,
	110882,
	110898,
	110898,
	110928,
	110930,
	110933,
	110933,
	110948,
	110951,
	110960,
	111355,
	119552,
	119638,
	119648,
	119670,
	126980,
	126980,
	127183,
	127183,
	127374,
	127374,
	127377,
	127386,
	127488,
	127490,
	127504,
	127547,
	127552,
	127560,
	127568,
	127569,
	127584,
	127589,
	127744,
	127776,
	127789,
	127797,
	127799,
	127868,
	127870,
	127891,
	127904,
	127946,
	127951,
	127955,
	127968,
	127984,
	127988,
	127988,
	127992,
	128062,
	128064,
	128064,
	128066,
	128252,
	128255,
	128317,
	128331,
	128334,
	128336,
	128359,
	128378,
	128378,
	128405,
	128406,
	128420,
	128420,
	128507,
	128591,
	128640,
	128709,
	128716,
	128716,
	128720,
	128722,
	128725,
	128728,
	128732,
	128735,
	128747,
	128748,
	128756,
	128764,
	128992,
	129003,
	129008,
	129008,
	129292,
	129338,
	129340,
	129349,
	129351,
	129535,
	129648,
	129660,
	129664,
	129674,
	129678,
	129734,
	129736,
	129736,
	129741,
	129756,
	129759,
	129770,
	129775,
	129784,
	131072,
	196605,
	196608,
	262141
];
var St = (t, e) => {
	let r = 0, n = Math.floor(t.length / 2) - 1;
	for (; r <= n;) {
		let u = Math.floor((r + n) / 2), o = u * 2;
		if (e < t[o]) n = u - 1;
		else if (e > t[o + 1]) r = u + 1;
		else return !0;
	}
	return !1;
};
var Hr = 19968, [to, ro] = no(Pt);
function no(t) {
	let e = t[0], r = t[1];
	for (let n = 0; n < t.length; n += 2) {
		let u = t[n], o = t[n + 1];
		if (Hr >= u && Hr <= o) return [u, o];
		o - u > r - e && (e = u, r = o);
	}
	return [e, r];
}
var bt = (t) => t < Wr || t > $r ? !1 : St(zr, t);
var kt = (t) => t >= to && t <= ro ? !0 : t < Gr || t > Kr ? !1 : St(Pt, t);
var uo = /^(?:[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u2764\u27A1\u2934\u2935\u2B05-\u2B07]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF3\uDFF5\uDFF7]|\uD83D[\uDC3F\uDC41\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])$/;
var Jr = (t) => uo.test(t);
var oo = /[^\x20-\x7F]/;
function io(t) {
	if (!t) return 0;
	if (!oo.test(t)) return t.length;
	let e = 0;
	t = t.replace(Vr(), (r) => (e += Jr(r) ? 1 : 2, ""));
	for (let r of t) {
		let n = r.codePointAt(0);
		n <= 31 || n >= 127 && n <= 159 || n >= 768 && n <= 879 || n >= 65024 && n <= 65039 || (e += bt(n) || kt(n) ? 2 : 1);
	}
	return e;
}
var Re = io;
var so = { type: 0 };
var Do = { type: 1 };
var It = {
	value: "",
	length: 0,
	queue: [],
	get root() {
		return It;
	}
};
function qr(t, e, r) {
	let n = e.type === 1 ? t.queue.slice(0, -1) : [...t.queue, e], u = "", o = 0, i = 0, D = 0;
	for (let f of n) switch (f.type) {
		case 0:
			c(), r.useTabs ? s(1) : a(r.tabWidth);
			break;
		case 3: {
			let { string: F } = f;
			c(), u += F, o += F.length;
			break;
		}
		case 2: {
			let { width: F } = f;
			i += 1, D += F;
			break;
		}
		default: throw new Error(`Unexpected indent comment '${f.type}'.`);
	}
	return l(), {
		...t,
		value: u,
		length: o,
		queue: n
	};
	function s(f) {
		u += "	".repeat(f), o += r.tabWidth * f;
	}
	function a(f) {
		u += " ".repeat(f), o += f;
	}
	function c() {
		r.useTabs ? p() : l();
	}
	function p() {
		i > 0 && s(i), m();
	}
	function l() {
		D > 0 && a(D), m();
	}
	function m() {
		i = 0, D = 0;
	}
}
function Xr(t, e, r) {
	if (!e) return t;
	if (e.type === "root") return {
		...t,
		root: t
	};
	if (e === Number.NEGATIVE_INFINITY) return t.root;
	let n;
	return typeof e == "number" ? e < 0 ? n = Do : n = {
		type: 2,
		width: e
	} : n = {
		type: 3,
		string: e
	}, qr(t, n, r);
}
function Qr(t, e) {
	return qr(t, so, e);
}
function ao(t) {
	let e = 0;
	for (let r = t.length - 1; r >= 0; r--) {
		let n = t[r];
		if (n === " " || n === "	") e++;
		else break;
	}
	return e;
}
function et(t) {
	let e = ao(t);
	return {
		text: e === 0 ? t : t.slice(0, t.length - e),
		count: e
	};
}
var Rt = class {
	#t = [];
	#e = "";
	#n = 0;
	#u = [];
	#r = [];
	#o() {
		let e = this.#e;
		e !== "" && (this.#t.push(e), this.#n += e.length, this.#e = "");
		for (let r of this.#r) this.#u.push(Math.min(r, this.#n));
		this.#r.length = 0;
	}
	markPosition() {
		if (this.#u.length + this.#r.length >= 2) throw new Error("There are too many 'cursor' in doc.");
		this.#r.push(this.#n + this.#e.length);
	}
	write(e) {
		this.#e += e;
	}
	trim() {
		let { text: e, count: r } = et(this.#e);
		return this.#e = e, this.#o(), r;
	}
	finish() {
		return this.#o(), {
			text: this.#t.join(""),
			positions: this.#u
		};
	}
};
var Zr = Rt;
var K = Symbol("MODE_BREAK");
var Q = Symbol("MODE_FLAT");
var vt = Symbol("DOC_FILL_PRINTED_LENGTH");
function tt(t, e, r, n, u, o) {
	if (r === Number.POSITIVE_INFINITY) return !0;
	let i = e.length, D = !1, s = [t], a = "";
	for (; r >= 0;) {
		if (s.length === 0) {
			if (i === 0) return !0;
			s.push(e[--i]);
			continue;
		}
		let { mode: c, doc: p } = s.pop(), l = q(p);
		switch (l) {
			case G:
				p && (D && (a += " ", r -= 1, D = !1), a += p, r -= Re(p));
				break;
			case U:
			case S: {
				let m = l === U ? p : p.parts, f = p[vt] ?? 0;
				for (let F = m.length - 1; F >= f; F--) s.push({
					mode: c,
					doc: m[F]
				});
				break;
			}
			case I$1:
			case R:
			case L:
			case b:
				s.push({
					mode: c,
					doc: p.contents
				});
				break;
			case v: {
				let { text: m, count: f } = et(a);
				a = m, r += f;
				break;
			}
			case x: {
				if (o && p.break) return !1;
				let m = p.break ? K : c, f = p.expandedStates && m === K ? y(0, p.expandedStates, -1) : p.contents;
				s.push({
					mode: m,
					doc: f
				});
				break;
			}
			case T: {
				let f = (p.groupId ? u[p.groupId] || Q : c) === K ? p.breakContents : p.flatContents;
				f && s.push({
					mode: c,
					doc: f
				});
				break;
			}
			case g:
				if (c === K || p.hard) return !0;
				p.soft || (D = !0);
				break;
			case M:
				n = !0;
				break;
			case Y: if (n) return !1;
		}
	}
	return !1;
}
function Ce(t, e) {
	let r = Object.create(null), n = e.printWidth, u = we(e.endOfLine), o = 0, i = [{
		indent: It,
		mode: K,
		doc: t
	}], D = !1, s = [], a = new Zr();
	for (Br(t); i.length > 0;) {
		let { indent: f, mode: F, doc: d } = i.pop();
		switch (q(d)) {
			case G: {
				let E = u !== `
` ? ne(0, d, `
`, u) : d;
				E && (a.write(E), i.length > 0 && (o += Re(E)));
				break;
			}
			case U:
				for (let E = d.length - 1; E >= 0; E--) i.push({
					indent: f,
					mode: F,
					doc: d[E]
				});
				break;
			case V$1:
				a.markPosition();
				break;
			case I$1:
				i.push({
					indent: Qr(f, e),
					mode: F,
					doc: d.contents
				});
				break;
			case R:
				i.push({
					indent: Xr(f, d.n, e),
					mode: F,
					doc: d.contents
				});
				break;
			case v:
				o -= a.trim();
				break;
			case x: {
				let E = (function() {
					if (F === Q && !D) return {
						indent: f,
						mode: d.break ? K : Q,
						doc: d.contents
					};
					D = !1;
					let h = n - o, _ = s.length > 0, P = {
						indent: f,
						mode: Q,
						doc: d.contents
					};
					if (!d.break && tt(P, i, h, _, r)) return P;
					if (!d.expandedStates) return {
						indent: f,
						mode: K,
						doc: d.contents
					};
					if (!d.break) for (let A = 1; A < d.expandedStates.length - 1; A++) {
						let B = {
							indent: f,
							mode: Q,
							doc: d.expandedStates[A]
						};
						if (tt(B, i, h, _, r)) return B;
					}
					return {
						indent: f,
						mode: K,
						doc: y(0, d.expandedStates, -1)
					};
				})();
				i.push(E), d.id && (r[d.id] = E.mode);
				break;
			}
			case S: {
				let E = n - o, C = d[vt] ?? 0, { parts: h } = d, _ = h.length - C;
				if (_ === 0) break;
				let P = h[C + 0], A = h[C + 1], B = {
					indent: f,
					mode: Q,
					doc: P
				}, J = {
					indent: f,
					mode: K,
					doc: P
				}, $e = tt(B, [], E, s.length > 0, r, !0);
				if (_ === 1) {
					$e ? i.push(B) : i.push(J);
					break;
				}
				let lr = {
					indent: f,
					mode: Q,
					doc: A
				}, _t = {
					indent: f,
					mode: K,
					doc: A
				};
				if (_ === 2) {
					$e ? i.push(lr, B) : i.push(_t, J);
					break;
				}
				let bu = h[C + 2], ku = {
					indent: f,
					mode: F,
					doc: {
						...d,
						[vt]: C + 2
					}
				}, Iu = tt({
					indent: f,
					mode: Q,
					doc: [
						P,
						A,
						bu
					]
				}, [], E, s.length > 0, r, !0);
				i.push(ku), Iu ? i.push(lr, B) : $e ? i.push(_t, B) : i.push(_t, J);
				break;
			}
			case T:
			case L: {
				let E = d.groupId ? r[d.groupId] : F;
				if (E === K) {
					let C = d.type === T ? d.breakContents : d.negate ? d.contents : oe(d.contents);
					C && i.push({
						indent: f,
						mode: F,
						doc: C
					});
				}
				if (E === Q) {
					let C = d.type === T ? d.flatContents : d.negate ? oe(d.contents) : d.contents;
					C && i.push({
						indent: f,
						mode: F,
						doc: C
					});
				}
				break;
			}
			case M:
				s.push({
					indent: f,
					mode: F,
					doc: d.contents
				});
				break;
			case Y:
				s.length > 0 && i.push({
					indent: f,
					mode: F,
					doc: ke
				});
				break;
			case g:
				switch (F) {
					case Q:
						if (!d.hard) {
							d.soft || (a.write(" "), o += 1);
							break;
						}
						D = !0;
					case K:
						if (s.length > 0) {
							i.push({
								indent: f,
								mode: F,
								doc: d
							}, ...s.reverse()), s.length = 0;
							break;
						}
						d.literal ? (a.write(u), o = 0, f.root && (f.root.value && a.write(f.root.value), o = f.root.length)) : (a.trim(), a.write(u + f.value), o = f.length);
				}
				break;
			case b:
				i.push({
					indent: f,
					mode: F,
					doc: d.contents
				});
				break;
			case N: break;
			default: throw new Z(d);
		}
		i.length === 0 && s.length > 0 && (i.push(...s.reverse()), s.length = 0);
	}
	let { text: c, positions: p } = a.finish();
	if (p.length !== 2) return { formatted: c };
	let [l, m] = p;
	return {
		formatted: c,
		cursorNodeStart: l,
		cursorNodeText: c.slice(l, m)
	};
}
function co(t, e, r = 0) {
	let n = 0;
	for (let u = r; u < t.length; ++u) t[u] === "	" ? n = n + e - n % e : n++;
	return n;
}
var he = co;
var Lt = class {
	constructor(e) {
		this.stack = [e];
	}
	get key() {
		let { stack: e, siblings: r } = this;
		return y(0, e, r === null ? -2 : -4) ?? null;
	}
	get index() {
		return this.siblings === null ? null : y(0, this.stack, -2);
	}
	get node() {
		return y(0, this.stack, -1);
	}
	get parent() {
		return this.getNode(1);
	}
	get grandparent() {
		return this.getNode(2);
	}
	get isInArray() {
		return this.siblings !== null;
	}
	get siblings() {
		let { stack: e } = this, r = y(0, e, -3);
		return Array.isArray(r) ? r : null;
	}
	get next() {
		let { siblings: e } = this;
		return e === null ? null : e[this.index + 1];
	}
	get previous() {
		let { siblings: e } = this;
		return e === null ? null : e[this.index - 1];
	}
	get isFirst() {
		return this.index === 0;
	}
	get isLast() {
		let { siblings: e, index: r } = this;
		return e !== null && r === e.length - 1;
	}
	get isRoot() {
		return this.stack.length === 1;
	}
	get root() {
		return this.stack[0];
	}
	get ancestors() {
		return [...this.#e()];
	}
	getName() {
		let { stack: e } = this, { length: r } = e;
		return r > 1 ? y(0, e, -2) : null;
	}
	getValue() {
		return y(0, this.stack, -1);
	}
	getNode(e = 0) {
		let r = this.#t(e);
		return r === -1 ? null : this.stack[r];
	}
	getParentNode(e = 0) {
		return this.getNode(e + 1);
	}
	#t(e) {
		let { stack: r } = this;
		for (let n = r.length - 1; n >= 0; n -= 2) if (!Array.isArray(r[n]) && --e < 0) return n;
		return -1;
	}
	call(e, ...r) {
		let { stack: n } = this, { length: u } = n, o = y(0, n, -1);
		for (let i of r) o = o?.[i], n.push(i, o);
		try {
			return e(this);
		} finally {
			n.length = u;
		}
	}
	callParent(e, r = 0) {
		let n = this.#t(r + 1), u = this.stack.splice(n + 1);
		try {
			return e(this);
		} finally {
			this.stack.push(...u);
		}
	}
	each(e, ...r) {
		let { stack: n } = this, { length: u } = n, o = y(0, n, -1);
		for (let i of r) o = o[i], n.push(i, o);
		try {
			for (let i = 0; i < o.length; ++i) n.push(i, o[i]), e(this, i, o), n.length -= 2;
		} finally {
			n.length = u;
		}
	}
	map(e, ...r) {
		let n = [];
		return this.each((u, o, i) => {
			n[o] = e(u, o, i);
		}, ...r), n;
	}
	match(...e) {
		let r = this.stack.length - 1, n = null, u = this.stack[r--];
		for (let o of e) {
			if (u === void 0) return !1;
			let i = null;
			if (typeof n == "number" && (i = n, n = this.stack[r--], u = this.stack[r--]), o && !o(u, n, i)) return !1;
			n = this.stack[r--], u = this.stack[r--];
		}
		return !0;
	}
	findAncestor(e) {
		for (let r of this.#e()) if (e(r)) return r;
	}
	hasAncestor(e) {
		for (let r of this.#e()) if (e(r)) return !0;
		return !1;
	}
	*#e() {
		let { stack: e } = this;
		for (let r = e.length - 3; r >= 0; r -= 2) {
			let n = e[r];
			Array.isArray(n) || (yield n);
		}
	}
};
var en = Lt;
function fo(t) {
	return Array.isArray(t) && t.length > 0;
}
var rt = fo;
function lo(t) {
	return t !== null && typeof t == "object";
}
var ge = lo;
function _e(t) {
	return (e, r, n) => {
		if (r === !1) return !1;
		let u = !!n?.backwards, { length: o } = e, i = r;
		for (; i >= 0 && i < o;) {
			let D = e.charAt(i);
			if (t instanceof RegExp) {
				if (!t.test(D)) return i;
			} else if (!t.includes(D)) return i;
			u ? i-- : i++;
		}
		return i === -1 || i === o ? i : !1;
	};
}
var tn = _e(/\s/);
var j = _e(" 	");
var nt = _e(",; 	");
var ut = _e(/[^\n\r]/);
var rn = (t) => t === `
` || t === "\r" || t === "\u2028" || t === "\u2029";
function po(t, e, r) {
	if (e === !1) return !1;
	let n = !!r?.backwards, u = t.charAt(e);
	if (n) {
		if (t.charAt(e - 1) === "\r" && u === `
`) return e - 2;
		if (rn(u)) return e - 1;
	} else {
		if (u === "\r" && t.charAt(e + 1) === `
`) return e + 2;
		if (rn(u)) return e + 1;
	}
	return e;
}
var $ = po;
function mo(t, e, r = {}) {
	let n = j(t, r.backwards ? e - 1 : e, r);
	return n !== $(t, n, r);
}
var H = mo;
function* ye(t, e) {
	let { getVisitorKeys: r, filter: n = () => !0 } = e, u = (o) => ge(o) && n(o);
	for (let o of r(t)) {
		let i = t[o];
		if (Array.isArray(i)) for (let D of i) u(D) && (yield D);
		else u(i) && (yield i);
	}
}
function* nn(t, e) {
	let r = [t];
	for (let n = 0; n < r.length; n++) {
		let u = r[n];
		for (let o of ye(u, e)) yield o, r.push(o);
	}
}
function un(t, e) {
	return ye(t, e).next().done;
}
function Fo(t, e, r) {
	let { filter: n } = r;
	if (!n) return [];
	let u, o = (r.getChildren?.(t, r) ?? [...ye(t, { getVisitorKeys: r.getVisitorKeys })]).flatMap((s) => (u ?? (u = [t, ...e]), n(s, u) ? [s] : on(s, u, r))), { locStart: i, locEnd: D } = r;
	return o.sort((s, a) => i(s) - i(a) || D(s) - D(a)), o;
}
function on(t, e, r) {
	return Fe(r.cache, t, (n) => Fo(n, e, r));
}
var ot = on;
function Eo(t) {
	let e = t.type || t.kind || "(unknown type)", r = String(t.name || t.id && (typeof t.id == "object" ? t.id.name : t.id) || t.key && (typeof t.key == "object" ? t.key.name : t.key) || t.value && (typeof t.value == "object" ? "" : String(t.value)) || t.operator || "");
	return r.length > 20 && (r = r.slice(0, 19) + "…"), e + (r ? " " + r : "");
}
function Mt(t, e) {
	(t.comments ?? (t.comments = [])).push(e), e.printed = !1, e.nodeDescription = Eo(t);
}
function ce(t, e) {
	e.leading = !0, e.trailing = !1, Mt(t, e);
}
function re(t, e, r) {
	e.leading = !1, e.trailing = !1, r && (e.marker = r), Mt(t, e);
}
function fe(t, e) {
	e.leading = !1, e.trailing = !0, Mt(t, e);
}
var Ut = /* @__PURE__ */ new WeakMap();
function Dn(t, e, r, n, u = []) {
	let { locStart: o, locEnd: i } = r, D = o(e), s = i(e), a = ot(t, u, {
		cache: Ut,
		locStart: o,
		locEnd: i,
		getVisitorKeys: r.getVisitorKeys,
		filter: r.printer.canAttachComment,
		getChildren: r.printer.getCommentChildNodes
	}), c, p, l = 0, m = a.length;
	for (; l < m;) {
		let f = l + m >> 1, F = a[f], d = o(F), E = i(F);
		if (d <= D && s <= E) return Dn(F, e, r, F, [F, ...u]);
		if (E <= D) {
			c = F, l = f + 1;
			continue;
		}
		if (s <= d) {
			p = F, m = f;
			continue;
		}
		throw new Error("Comment location overlaps with node location");
	}
	if (n?.type === "TemplateLiteral") {
		let { quasis: f } = n, F = jt(f, e, r);
		c && jt(f, c, r) !== F && (c = null), p && jt(f, p, r) !== F && (p = null);
	}
	return {
		enclosingNode: n,
		precedingNode: c,
		followingNode: p
	};
}
var Yt = () => !1;
function an(t, e) {
	let { comments: r } = t;
	if (delete t.comments, !rt(r) || !e.printer.canAttachComment) return;
	let n = [], { printer: { features: { experimental_avoidAstMutation: u }, handleComments: o = {} }, originalText: i } = e, { ownLine: D = Yt, endOfLine: s = Yt, remaining: a = Yt } = o, c = r.map((l, m) => ({
		...Dn(t, l, e),
		comment: l,
		text: i,
		options: e,
		ast: t,
		isLastComment: r.length - 1 === m,
		placement: void 0
	})), p = !u;
	for (let [l, m] of c.entries()) {
		let { comment: f, precedingNode: F, enclosingNode: d, followingNode: E, text: C, options: h, ast: _, isLastComment: P } = m, A = Co(C, h, c, l) ? "ownLine" : ho(C, h, c, l) ? "endOfLine" : "remaining", B;
		if (u ? (m.placement = A, B = [m]) : B = [
			f,
			C,
			h,
			_,
			P
		], p && (f.enclosingNode = d, f.precedingNode = F, f.followingNode = E), f.placement = A, A === "ownLine") D(...B) || (E ? ce(E, f) : F ? fe(F, f) : d ? re(d, f) : re(_, f));
		else if (A === "endOfLine") s(...B) || (F ? fe(F, f) : E ? ce(E, f) : d ? re(d, f) : re(_, f));
		else if (!a(...B)) if (F && E) {
			let J = n.length;
			J > 0 && n[J - 1].followingNode !== E && sn(n, h), n.push(m);
		} else F ? fe(F, f) : E ? ce(E, f) : d ? re(d, f) : re(_, f);
	}
	if (sn(n, e), p) for (let l of r) delete l.precedingNode, delete l.enclosingNode, delete l.followingNode;
}
var cn = (t) => !/[\S\n\u2028\u2029]/.test(t);
function Co(t, e, r, n) {
	let { comment: u, precedingNode: o } = r[n], { locStart: i, locEnd: D } = e, s = i(u);
	if (o) for (let a = n - 1; a >= 0; a--) {
		let { comment: c, precedingNode: p } = r[a];
		if (p !== o || !cn(t.slice(D(c), s))) break;
		s = i(c);
	}
	return H(t, s, { backwards: !0 });
}
function ho(t, e, r, n) {
	let { comment: u, followingNode: o } = r[n], { locStart: i, locEnd: D } = e, s = D(u);
	if (o) for (let a = n + 1; a < r.length; a++) {
		let { comment: c, followingNode: p } = r[a];
		if (p !== o || !cn(t.slice(s, i(c)))) break;
		s = D(c);
	}
	return H(t, s);
}
function sn(t, e) {
	let r = t.length;
	if (r === 0) return;
	let { precedingNode: n, followingNode: u } = t[0], o = e.locStart(u), i;
	for (i = r; i > 0; --i) {
		let { comment: D, precedingNode: s, followingNode: a } = t[i - 1];
		k(s, n), k(a, u);
		let c = e.originalText.slice(e.locEnd(D), o);
		if (e.printer.isGap?.(c, e) ?? /^[\s(]*$/.test(c)) o = e.locStart(D);
		else break;
	}
	for (let [D, { comment: s }] of t.entries()) D < i ? fe(n, s) : ce(u, s);
	for (let D of [n, u]) D.comments && D.comments.length > 1 && D.comments.sort((s, a) => e.locStart(s) - e.locStart(a));
	t.length = 0;
}
function jt(t, e, r) {
	let n = r.locStart(e) - 1;
	for (let u = 1; u < t.length; ++u) if (n < r.locStart(t[u])) return u - 1;
	return 0;
}
function go(t, e) {
	let r = e - 1;
	r = j(t, r, { backwards: !0 }), r = $(t, r, { backwards: !0 }), r = j(t, r, { backwards: !0 });
	let n = $(t, r, { backwards: !0 });
	return r !== n;
}
var ve = go;
var fn = () => !0;
function ln(t, e) {
	let r = t.node;
	return r.printed = !0, e.printer.printComment(t, e);
}
function _o(t, e) {
	let r = t.node, n = [ln(t, e)], { printer: u, originalText: o, locStart: i, locEnd: D } = e;
	if (u.isBlockComment?.(r)) {
		let c = " ";
		H(o, D(r)) && (H(o, i(r), { backwards: !0 }) ? c = W : c = Ze), n.push(c);
	} else n.push(W);
	let a = $(o, j(o, D(r)));
	return a !== !1 && H(o, a) && n.push(W), n;
}
function yo(t, e, r) {
	let n = t.node, u = ln(t, e), { printer: o, originalText: i, locStart: D } = e, s = o.isBlockComment?.(n);
	if (r?.hasLineSuffix && !r?.isBlock || H(i, D(n), { backwards: !0 })) return {
		doc: Ie([
			W,
			ve(i, D(n)) ? W : "",
			u
		]),
		isBlock: s,
		hasLineSuffix: !0
	};
	return !s || r?.hasLineSuffix ? {
		doc: [Ie([" ", u]), ae],
		isBlock: s,
		hasLineSuffix: !0
	} : {
		doc: [" ", u],
		isBlock: s,
		hasLineSuffix: !1
	};
}
function Ao(t, e, r) {
	let n = e[Symbol.for("printedComments")], u = r?.filter ?? fn, o = new Set(t.node?.comments?.filter((i) => !n?.has(i) && i.leading && u(i)));
	return o.size === 0 ? "" : t.map(({ node: i }) => o.has(i) ? _o(t, e) : "", "comments").filter(Boolean);
}
function xo(t, e, r) {
	let n = t.node?.comments, u = new Set(n?.filter((c) => c.trailing)), o = e[Symbol.for("printedComments")], i = r?.filter ?? fn, D = new Set(n?.filter((c) => u.has(c) && !o?.has(c) && i(c)));
	if (D.size === 0) return "";
	let s = [], a;
	return t.each(({ node: c }) => {
		u.has(c) && (a = yo(t, e, a), D.has(c) && s.push(a.doc));
	}, "comments"), s;
}
function pn(t, e, r, n) {
	let u = Ao(t, r, n), o = xo(t, r, n);
	return u || o ? Ee(e, (i) => [
		u,
		i,
		o
	]) : e;
}
function mn(t) {
	let { [ue]: e, [Symbol.for("printedComments")]: r } = t;
	for (let n of e) {
		if (!n.printed && !r.has(n)) throw new Error("Comment \"" + n.value.trim() + "\" was not printed. Please report this error!");
		delete n.printed;
	}
}
var dn = () => k;
var Le = class extends Error {
	name = "ConfigError";
};
var Me = class extends Error {
	name = "UndefinedParserError";
};
var le = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty);
var Fn = {
	checkIgnorePragma: {
		category: "Special",
		type: "boolean",
		default: !1,
		description: "Check whether the file's first docblock comment contains '@noprettier' or '@noformat' to determine if it should be formatted.",
		cliCategory: "Other"
	},
	cursorOffset: {
		category: "Special",
		type: "int",
		default: -1,
		range: {
			start: -1,
			end: 1 / 0,
			step: 1
		},
		description: "Print (to stderr) where a cursor at the given position would move to after formatting.",
		cliCategory: "Editor"
	},
	endOfLine: {
		category: "Global",
		type: "choice",
		default: "lf",
		description: "Which end of line characters to apply.",
		choices: [
			{
				value: "lf",
				description: "Line Feed only (\\n), common on Linux and macOS as well as inside git repos"
			},
			{
				value: "crlf",
				description: "Carriage Return + Line Feed characters (\\r\\n), common on Windows"
			},
			{
				value: "cr",
				description: "Carriage Return character only (\\r), used very rarely"
			},
			{
				value: "auto",
				description: `Maintain existing
(mixed values within one file are normalised by looking at what's used after the first line)`
			}
		]
	},
	filepath: {
		category: "Special",
		type: "path",
		description: "Specify the input filepath. This will be used to do parser inference.",
		cliName: "stdin-filepath",
		cliCategory: "Other",
		cliDescription: "Path to the file to pretend that stdin comes from."
	},
	insertPragma: {
		category: "Special",
		type: "boolean",
		default: !1,
		description: "Insert @format pragma into file's first docblock comment.",
		cliCategory: "Other"
	},
	parser: {
		category: "Global",
		type: "choice",
		default: void 0,
		description: "Which parser to use.",
		exception: (t) => typeof t == "string" || typeof t == "function",
		choices: [
			{
				value: "flow",
				description: "Flow"
			},
			{
				value: "babel",
				description: "JavaScript"
			},
			{
				value: "babel-flow",
				description: "Flow"
			},
			{
				value: "babel-ts",
				description: "TypeScript"
			},
			{
				value: "typescript",
				description: "TypeScript"
			},
			{
				value: "acorn",
				description: "JavaScript"
			},
			{
				value: "espree",
				description: "JavaScript"
			},
			{
				value: "meriyah",
				description: "JavaScript"
			},
			{
				value: "css",
				description: "CSS"
			},
			{
				value: "less",
				description: "Less"
			},
			{
				value: "scss",
				description: "SCSS"
			},
			{
				value: "json",
				description: "JSON"
			},
			{
				value: "json5",
				description: "JSON5"
			},
			{
				value: "jsonc",
				description: "JSON with Comments"
			},
			{
				value: "json-stringify",
				description: "JSON.stringify"
			},
			{
				value: "graphql",
				description: "GraphQL"
			},
			{
				value: "markdown",
				description: "Markdown"
			},
			{
				value: "mdx",
				description: "MDX"
			},
			{
				value: "vue",
				description: "Vue"
			},
			{
				value: "yaml",
				description: "YAML"
			},
			{
				value: "glimmer",
				description: "Ember / Handlebars"
			},
			{
				value: "html",
				description: "HTML"
			},
			{
				value: "angular",
				description: "Angular"
			},
			{
				value: "lwc",
				description: "Lightning Web Components"
			},
			{
				value: "mjml",
				description: "MJML"
			}
		]
	},
	plugins: {
		type: "path",
		array: !0,
		default: [{ value: [] }],
		category: "Global",
		description: "Add a plugin. Multiple plugins can be passed as separate `--plugin`s.",
		exception: (t) => typeof t == "string" || typeof t == "object",
		cliName: "plugin",
		cliCategory: "Config"
	},
	printWidth: {
		category: "Global",
		type: "int",
		default: 80,
		description: "The line length where Prettier will try wrap.",
		range: {
			start: 0,
			end: 1 / 0,
			step: 1
		}
	},
	rangeEnd: {
		category: "Special",
		type: "int",
		default: 1 / 0,
		range: {
			start: 0,
			end: 1 / 0,
			step: 1
		},
		description: `Format code ending at a given character offset (exclusive).
The range will extend forwards to the end of the selected statement.`,
		cliCategory: "Editor"
	},
	rangeStart: {
		category: "Special",
		type: "int",
		default: 0,
		range: {
			start: 0,
			end: 1 / 0,
			step: 1
		},
		description: `Format code starting at a given character offset.
The range will extend backwards to the start of the first line containing the selected statement.`,
		cliCategory: "Editor"
	},
	requirePragma: {
		category: "Special",
		type: "boolean",
		default: !1,
		description: "Require either '@prettier' or '@format' to be present in the file's first docblock comment in order for it to be formatted.",
		cliCategory: "Other"
	},
	tabWidth: {
		type: "int",
		category: "Global",
		default: 2,
		description: "Number of spaces per indentation level.",
		range: {
			start: 0,
			end: 1 / 0,
			step: 1
		}
	},
	useTabs: {
		category: "Global",
		type: "boolean",
		default: !1,
		description: "Indent with tabs instead of spaces."
	},
	embeddedLanguageFormatting: {
		category: "Global",
		type: "choice",
		default: "auto",
		description: "Control how Prettier formats quoted code embedded in the file.",
		choices: [{
			value: "auto",
			description: "Format embedded code if Prettier can automatically identify it."
		}, {
			value: "off",
			description: "Never automatically format embedded code."
		}]
	}
};
function it({ plugins: t = [], showDeprecated: e = !1 } = {}) {
	let r = t.flatMap((u) => u.languages ?? []), n = [];
	for (let u of No(Object.assign({}, ...t.map(({ options: o }) => o), Fn))) !e && u.deprecated || (Array.isArray(u.choices) && (e || (u.choices = u.choices.filter((o) => !o.deprecated)), u.name === "parser" && (u.choices = [...u.choices, ...To(u.choices, r, t)])), u.pluginDefaults = Object.fromEntries(t.filter((o) => o.defaultOptions?.[u.name] !== void 0).map((o) => [o.name, o.defaultOptions[u.name]])), n.push(u));
	return {
		languages: r,
		options: n
	};
}
function* To(t, e, r) {
	let n = new Set(t.map((u) => u.value));
	for (let u of e) if (u.parsers) {
		for (let o of u.parsers) if (!n.has(o)) {
			n.add(o);
			let i = r.find((s) => s.parsers && le(s.parsers, o)), D = u.name;
			i?.name && (D += ` (plugin: ${i.name})`), yield {
				value: o,
				description: D
			};
		}
	}
}
function No(t) {
	let e = [];
	for (let [r, n] of Object.entries(t)) {
		let u = {
			name: r,
			...n
		};
		Array.isArray(u.default) && (u.default = y(0, u.default, -1).value), e.push(u);
	}
	return e;
}
var wo = Array.prototype.toReversed ?? function() {
	return [...this].reverse();
};
var En = X("toReversed", function() {
	if (Array.isArray(this)) return wo;
});
function Po() {
	let t = globalThis, e = t.process?.platform;
	if (typeof e == "string") return e.startsWith("win");
	let r = t.Deno?.build?.os;
	return typeof r == "string" ? r === "windows" : t.navigator?.platform?.startsWith("Win") ?? !1;
}
var So = Po();
function Cn(t) {
	if (t = t instanceof URL ? t : new URL(t), t.protocol !== "file:") throw new TypeError(`URL must be a file URL: received "${t.protocol}"`);
	return t;
}
function bo(t) {
	return t = Cn(t), decodeURIComponent(t.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function ko(t) {
	t = Cn(t);
	let e = decodeURIComponent(t.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
	return t.hostname !== "" && (e = `\\\\${t.hostname}${e}`), e;
}
function Vt(t) {
	return So ? ko(t) : bo(t);
}
var hn = (t) => String(t).split(/[/\\]/).pop();
var gn = (t) => String(t).startsWith("file:");
function _n(t, e) {
	if (!e) return;
	let r = hn(e).toLowerCase();
	return t.find(({ filenames: n }) => n?.some((u) => u.toLowerCase() === r)) ?? t.find(({ extensions: n }) => n?.some((u) => r.endsWith(u)));
}
function Io(t, e) {
	if (e) return t.find(({ name: r }) => r.toLowerCase() === e) ?? t.find(({ aliases: r }) => r?.includes(e)) ?? t.find(({ extensions: r }) => r?.includes(`.${e}`));
}
var Ro = void 0;
function yn(t, e) {
	if (e) {
		if (gn(e)) try {
			e = Vt(e);
		} catch {
			return;
		}
		if (typeof e == "string") return t.find(({ isSupported: r }) => r?.({ filepath: e }));
	}
}
function vo(t, e) {
	let r = En(0, t.plugins).flatMap((u) => u.languages ?? []);
	return (Io(r, e.language) ?? _n(r, e.physicalFile) ?? _n(r, e.file) ?? yn(r, e.physicalFile) ?? yn(r, e.file) ?? Ro?.(r, e.physicalFile))?.parsers[0];
}
var st = vo;
var ie = {
	key: (t) => /^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(t) ? t : JSON.stringify(t),
	value(t) {
		if (t === null || typeof t != "object") return JSON.stringify(t);
		if (Array.isArray(t)) return `[${t.map((r) => ie.value(r)).join(", ")}]`;
		let e = Object.keys(t);
		return e.length === 0 ? "{}" : `{ ${e.map((r) => `${ie.key(r)}: ${ie.value(t[r])}`).join(", ")} }`;
	},
	pair: ({ key: t, value: e }) => ie.value({ [t]: e })
};
var An = new Proxy(String, { get: () => An });
var z = An;
var xn = (t, e, { descriptor: r }) => {
	let n = [`${z.yellow(typeof t == "string" ? r.key(t) : r.pair(t))} is deprecated`];
	return e && n.push(`we now treat it as ${z.blue(typeof e == "string" ? r.key(e) : r.pair(e))}`), n.join("; ") + ".";
};
var Dt = Symbol.for("vnopts.VALUE_NOT_EXIST");
var Ae = Symbol.for("vnopts.VALUE_UNCHANGED");
var Bn = " ".repeat(2);
var Nn = (t, e, r) => {
	let { text: n, list: u } = r.normalizeExpectedResult(r.schemas[t].expected(r)), o = [];
	return n && o.push(Tn(t, e, n, r.descriptor)), u && o.push([Tn(t, e, u.title, r.descriptor)].concat(u.values.map((i) => wn(i, r.loggerPrintWidth))).join(`
`)), On(o, r.loggerPrintWidth);
};
function Tn(t, e, r, n) {
	return [
		`Invalid ${z.red(n.key(t))} value.`,
		`Expected ${z.blue(r)},`,
		`but received ${e === Dt ? z.gray("nothing") : z.red(n.value(e))}.`
	].join(" ");
}
function wn({ text: t, list: e }, r) {
	let n = [];
	return t && n.push(`- ${z.blue(t)}`), e && n.push([`- ${z.blue(e.title)}:`].concat(e.values.map((u) => wn(u, r - Bn.length).replace(/^|\n/g, `$&${Bn}`))).join(`
`)), On(n, r);
}
function On(t, e) {
	if (t.length === 1) return t[0];
	let [r, n] = t, [u, o] = t.map((i) => i.split(`
`, 1)[0].length);
	return u > e && u > o ? n : r;
}
var xe = [];
var Wt = [];
function at(t, e, r) {
	if (t === e) return 0;
	let n = r?.maxDistance, u = t;
	t.length > e.length && (t = e, e = u);
	let o = t.length, i = e.length;
	for (; o > 0 && t.charCodeAt(~-o) === e.charCodeAt(~-i);) o--, i--;
	let D = 0;
	for (; D < o && t.charCodeAt(D) === e.charCodeAt(D);) D++;
	if (o -= D, i -= D, n !== void 0 && i - o > n) return n;
	if (o === 0) return n !== void 0 && i > n ? n : i;
	let s, a, c, p, l = 0, m = 0;
	for (; l < o;) Wt[l] = t.charCodeAt(D + l), xe[l] = ++l;
	for (; m < i;) {
		for (s = e.charCodeAt(D + m), c = m++, a = m, l = 0; l < o; l++) p = s === Wt[l] ? c : c + 1, c = xe[l], a = xe[l] = c > a ? p > a ? a + 1 : p : p > c ? c + 1 : p;
		if (n !== void 0) {
			let f = a;
			for (l = 0; l < o; l++) xe[l] < f && (f = xe[l]);
			if (f > n) return n;
		}
	}
	return xe.length = o, Wt.length = o, n !== void 0 && a > n ? n : a;
}
function Pn(t, e, r) {
	if (!Array.isArray(e) || e.length === 0) return;
	let n = r?.maxDistance, u = t.length;
	for (let s of e) if (s === t) return s;
	if (n === 0) return;
	let o, i = Number.POSITIVE_INFINITY, D = /* @__PURE__ */ new Set();
	for (let s of e) {
		if (D.has(s)) continue;
		D.add(s);
		let a = Math.abs(s.length - u);
		if (a >= i || n !== void 0 && a > n) continue;
		let c = Number.isFinite(i) ? n === void 0 ? i : Math.min(i, n) : n, p = c === void 0 ? at(t, s) : at(t, s, { maxDistance: c });
		if (n !== void 0 && p > n) continue;
		let l = p;
		if (c !== void 0 && p === c && c === n && (l = at(t, s)), l < i && (i = l, o = s, i === 0)) break;
	}
	if (!(n !== void 0 && i > n)) return o;
}
var ct = (t, e, { descriptor: r, logger: n, schemas: u }) => {
	let o = [`Ignored unknown option ${z.yellow(r.pair({
		key: t,
		value: e
	}))}.`], i = Pn(t, Object.keys(u), { maxDistance: 3 });
	i && o.push(`Did you mean ${z.blue(r.key(i))}?`), n.warn(o.join(" "));
};
var Lo = [
	"default",
	"expected",
	"validate",
	"deprecated",
	"forward",
	"redirect",
	"overlap",
	"preprocess",
	"postprocess"
];
function Mo(t, e) {
	let r = new t(e), n = Object.create(r);
	for (let u of Lo) u in e && (n[u] = Yo(e[u], r, O.prototype[u].length));
	return n;
}
var O = class {
	static create(e) {
		return Mo(this, e);
	}
	constructor(e) {
		this.name = e.name;
	}
	default(e) {}
	expected(e) {
		return "nothing";
	}
	validate(e, r) {
		return !1;
	}
	deprecated(e, r) {
		return !1;
	}
	forward(e, r) {}
	redirect(e, r) {}
	overlap(e, r, n) {
		return e;
	}
	preprocess(e, r) {
		return e;
	}
	postprocess(e, r) {
		return Ae;
	}
};
function Yo(t, e, r) {
	return typeof t == "function" ? (...n) => t(...n.slice(0, r - 1), e, ...n.slice(r - 1)) : () => t;
}
var ft = class extends O {
	constructor(e) {
		super(e), this._sourceName = e.sourceName;
	}
	expected(e) {
		return e.schemas[this._sourceName].expected(e);
	}
	validate(e, r) {
		return r.schemas[this._sourceName].validate(e, r);
	}
	redirect(e, r) {
		return this._sourceName;
	}
};
var lt = class extends O {
	expected() {
		return "anything";
	}
	validate() {
		return !0;
	}
};
var pt = class extends O {
	constructor({ valueSchema: e, name: r = e.name, ...n }) {
		super({
			...n,
			name: r
		}), this._valueSchema = e;
	}
	expected(e) {
		let { text: r, list: n } = e.normalizeExpectedResult(this._valueSchema.expected(e));
		return {
			text: r && `an array of ${r}`,
			list: n && {
				title: "an array of the following values",
				values: [{ list: n }]
			}
		};
	}
	validate(e, r) {
		if (!Array.isArray(e)) return !1;
		let n = [];
		for (let u of e) {
			let o = r.normalizeValidateResult(this._valueSchema.validate(u, r), u);
			o !== !0 && n.push(o.value);
		}
		return n.length === 0 ? !0 : { value: n };
	}
	deprecated(e, r) {
		let n = [];
		for (let u of e) {
			let o = r.normalizeDeprecatedResult(this._valueSchema.deprecated(u, r), u);
			o !== !1 && n.push(...o.map(({ value: i }) => ({ value: [i] })));
		}
		return n;
	}
	forward(e, r) {
		let n = [];
		for (let u of e) {
			let o = r.normalizeForwardResult(this._valueSchema.forward(u, r), u);
			n.push(...o.map(Sn));
		}
		return n;
	}
	redirect(e, r) {
		let n = [], u = [];
		for (let o of e) {
			let i = r.normalizeRedirectResult(this._valueSchema.redirect(o, r), o);
			"remain" in i && n.push(i.remain), u.push(...i.redirect.map(Sn));
		}
		return n.length === 0 ? { redirect: u } : {
			redirect: u,
			remain: n
		};
	}
	overlap(e, r) {
		return e.concat(r);
	}
};
function Sn({ from: t, to: e }) {
	return {
		from: [t],
		to: e
	};
}
var mt = class extends O {
	expected() {
		return "true or false";
	}
	validate(e) {
		return typeof e == "boolean";
	}
};
function kn(t, e) {
	let r = Object.create(null);
	for (let n of t) {
		let u = n[e];
		if (r[u]) throw new Error(`Duplicate ${e} ${JSON.stringify(u)}`);
		r[u] = n;
	}
	return r;
}
function In(t, e) {
	let r = /* @__PURE__ */ new Map();
	for (let n of t) {
		let u = n[e];
		if (r.has(u)) throw new Error(`Duplicate ${e} ${JSON.stringify(u)}`);
		r.set(u, n);
	}
	return r;
}
function Rn() {
	let t = Object.create(null);
	return (e) => {
		let r = JSON.stringify(e);
		return t[r] ? !0 : (t[r] = !0, !1);
	};
}
function vn(t, e) {
	let r = [], n = [];
	for (let u of t) e(u) ? r.push(u) : n.push(u);
	return [r, n];
}
function Ln(t) {
	return t === Math.floor(t);
}
function Mn(t, e) {
	if (t === e) return 0;
	let r = typeof t, n = typeof e, u = [
		"undefined",
		"object",
		"boolean",
		"number",
		"string"
	];
	return r !== n ? u.indexOf(r) - u.indexOf(n) : r !== "string" ? Number(t) - Number(e) : t.localeCompare(e);
}
function Yn(t) {
	return (...e) => {
		let r = t(...e);
		return typeof r == "string" ? new Error(r) : r;
	};
}
function $t(t) {
	return t === void 0 ? {} : t;
}
function zt(t) {
	if (typeof t == "string") return { text: t };
	let { text: e, list: r } = t;
	return jo((e || r) !== void 0, "Unexpected `expected` result, there should be at least one field."), r ? {
		text: e,
		list: {
			title: r.title,
			values: r.values.map(zt)
		}
	} : { text: e };
}
function Gt(t, e) {
	return t === !0 ? !0 : t === !1 ? { value: e } : t;
}
function Kt(t, e, r = !1) {
	return t === !1 ? !1 : t === !0 ? r ? !0 : [{ value: e }] : "value" in t ? [t] : t.length === 0 ? !1 : t;
}
function bn(t, e) {
	return typeof t == "string" || "key" in t ? {
		from: e,
		to: t
	} : "from" in t ? {
		from: t.from,
		to: t.to
	} : {
		from: e,
		to: t.to
	};
}
function dt(t, e) {
	return t === void 0 ? [] : Array.isArray(t) ? t.map((r) => bn(r, e)) : [bn(t, e)];
}
function Ht(t, e) {
	let r = dt(typeof t == "object" && "redirect" in t ? t.redirect : t, e);
	return r.length === 0 ? {
		remain: e,
		redirect: r
	} : typeof t == "object" && "remain" in t ? {
		remain: t.remain,
		redirect: r
	} : { redirect: r };
}
function jo(t, e) {
	if (!t) throw new Error(e);
}
var Ft = class extends O {
	constructor(e) {
		super(e), this._choices = In(e.choices.map((r) => r && typeof r == "object" ? r : { value: r }), "value");
	}
	expected({ descriptor: e }) {
		let r = Array.from(this._choices.keys()).map((i) => this._choices.get(i)).filter(({ hidden: i }) => !i).map((i) => i.value).sort(Mn).map(e.value), n = r.slice(0, -2), u = r.slice(-2);
		return {
			text: n.concat(u.join(" or ")).join(", "),
			list: {
				title: "one of the following values",
				values: r
			}
		};
	}
	validate(e) {
		return this._choices.has(e);
	}
	deprecated(e) {
		let r = this._choices.get(e);
		return r && r.deprecated ? { value: e } : !1;
	}
	forward(e) {
		let r = this._choices.get(e);
		return r ? r.forward : void 0;
	}
	redirect(e) {
		let r = this._choices.get(e);
		return r ? r.redirect : void 0;
	}
};
var Et = class extends O {
	expected() {
		return "a number";
	}
	validate(e, r) {
		return typeof e == "number";
	}
};
var Ct = class extends Et {
	expected() {
		return "an integer";
	}
	validate(e, r) {
		return r.normalizeValidateResult(super.validate(e, r), e) === !0 && Ln(e);
	}
};
var Ye = class extends O {
	expected() {
		return "a string";
	}
	validate(e) {
		return typeof e == "string";
	}
};
var jn = ie;
var Un = ct;
var Vn = Nn;
var Wn = xn;
var ht = class {
	constructor(e, r) {
		let { logger: n = console, loggerPrintWidth: u = 80, descriptor: o = jn, unknown: i = Un, invalid: D = Vn, deprecated: s = Wn, missing: a = () => !1, required: c = () => !1, preprocess: p = (m) => m, postprocess: l = () => Ae } = r || {};
		this._utils = {
			descriptor: o,
			logger: n || { warn: () => {} },
			loggerPrintWidth: u,
			schemas: kn(e, "name"),
			normalizeDefaultResult: $t,
			normalizeExpectedResult: zt,
			normalizeDeprecatedResult: Kt,
			normalizeForwardResult: dt,
			normalizeRedirectResult: Ht,
			normalizeValidateResult: Gt
		}, this._unknownHandler = i, this._invalidHandler = Yn(D), this._deprecatedHandler = s, this._identifyMissing = (m, f) => !(m in f) || a(m, f), this._identifyRequired = c, this._preprocess = p, this._postprocess = l, this.cleanHistory();
	}
	cleanHistory() {
		this._hasDeprecationWarned = Rn();
	}
	normalize(e) {
		let r = {}, u = [this._preprocess(e, this._utils)], o = () => {
			for (; u.length !== 0;) {
				let i = u.shift(), D = this._applyNormalization(i, r);
				u.push(...D);
			}
		};
		o();
		for (let i of Object.keys(this._utils.schemas)) {
			let D = this._utils.schemas[i];
			if (!(i in r)) {
				let s = $t(D.default(this._utils));
				"value" in s && u.push({ [i]: s.value });
			}
		}
		o();
		for (let i of Object.keys(this._utils.schemas)) {
			if (!(i in r)) continue;
			let D = this._utils.schemas[i], s = r[i], a = D.postprocess(s, this._utils);
			a !== Ae && (this._applyValidation(a, i, D), r[i] = a);
		}
		return this._applyPostprocess(r), this._applyRequiredCheck(r), r;
	}
	_applyNormalization(e, r) {
		let n = [], { knownKeys: u, unknownKeys: o } = this._partitionOptionKeys(e);
		for (let i of u) {
			let D = this._utils.schemas[i], s = D.preprocess(e[i], this._utils);
			this._applyValidation(s, i, D);
			let a = ({ from: m, to: f }) => {
				n.push(typeof f == "string" ? { [f]: m } : { [f.key]: f.value });
			}, c = ({ value: m, redirectTo: f }) => {
				let F = Kt(D.deprecated(m, this._utils), s, !0);
				if (F !== !1) if (F === !0) this._hasDeprecationWarned(i) || this._utils.logger.warn(this._deprecatedHandler(i, f, this._utils));
				else for (let { value: d } of F) {
					let E = {
						key: i,
						value: d
					};
					if (!this._hasDeprecationWarned(E)) {
						let C = typeof f == "string" ? {
							key: f,
							value: d
						} : f;
						this._utils.logger.warn(this._deprecatedHandler(E, C, this._utils));
					}
				}
			};
			dt(D.forward(s, this._utils), s).forEach(a);
			let l = Ht(D.redirect(s, this._utils), s);
			if (l.redirect.forEach(a), "remain" in l) {
				let m = l.remain;
				r[i] = i in r ? D.overlap(r[i], m, this._utils) : m, c({ value: m });
			}
			for (let { from: m, to: f } of l.redirect) c({
				value: m,
				redirectTo: f
			});
		}
		for (let i of o) {
			let D = e[i];
			this._applyUnknownHandler(i, D, r, (s, a) => {
				n.push({ [s]: a });
			});
		}
		return n;
	}
	_applyRequiredCheck(e) {
		for (let r of Object.keys(this._utils.schemas)) if (this._identifyMissing(r, e) && this._identifyRequired(r)) throw this._invalidHandler(r, Dt, this._utils);
	}
	_partitionOptionKeys(e) {
		let [r, n] = vn(Object.keys(e).filter((u) => !this._identifyMissing(u, e)), (u) => u in this._utils.schemas);
		return {
			knownKeys: r,
			unknownKeys: n
		};
	}
	_applyValidation(e, r, n) {
		let u = Gt(n.validate(e, this._utils), e);
		if (u !== !0) throw this._invalidHandler(r, u.value, this._utils);
	}
	_applyUnknownHandler(e, r, n, u) {
		let o = this._unknownHandler(e, r, this._utils);
		if (o) for (let i of Object.keys(o)) {
			if (this._identifyMissing(i, o)) continue;
			let D = o[i];
			i in this._utils.schemas ? u(i, D) : n[i] = D;
		}
	}
	_applyPostprocess(e) {
		let r = this._postprocess(e, this._utils);
		if (r !== Ae) {
			if (r.delete) for (let n of r.delete) delete e[n];
			if (r.override) {
				let { knownKeys: n, unknownKeys: u } = this._partitionOptionKeys(r.override);
				for (let o of n) {
					let i = r.override[o];
					this._applyValidation(i, o, this._utils.schemas[o]), e[o] = i;
				}
				for (let o of u) {
					let i = r.override[o];
					this._applyUnknownHandler(o, i, e, (D, s) => {
						let a = this._utils.schemas[D];
						this._applyValidation(s, D, a), e[D] = s;
					});
				}
			}
		}
	}
};
var Jt;
function Uo(t, e, { logger: r = !1, isCLI: n = !1, passThrough: u = !1, FlagSchema: o, descriptor: i } = {}) {
	if (n) {
		if (!o) throw new Error("'FlagSchema' option is required.");
		if (!i) throw new Error("'descriptor' option is required.");
	} else i = ie;
	let D = u ? Array.isArray(u) ? (l, m) => u.includes(l) ? { [l]: m } : void 0 : (l, m) => ({ [l]: m }) : (l, m, f) => {
		let { _: F, ...d } = f.schemas;
		return ct(l, m, {
			...f,
			schemas: d
		});
	}, a = new ht(Vo(e, {
		isCLI: n,
		FlagSchema: o
	}), {
		logger: r,
		unknown: D,
		descriptor: i
	}), c = r !== !1;
	c && Jt && (a._hasDeprecationWarned = Jt);
	let p = a.normalize(t);
	return c && (Jt = a._hasDeprecationWarned), p;
}
function Vo(t, { isCLI: e, FlagSchema: r }) {
	let n = [];
	e && n.push(lt.create({ name: "_" }));
	for (let u of t) n.push(Wo(u, {
		isCLI: e,
		optionInfos: t,
		FlagSchema: r
	})), u.alias && e && n.push(ft.create({
		name: u.alias,
		sourceName: u.name
	}));
	return n;
}
function Wo(t, { isCLI: e, optionInfos: r, FlagSchema: n }) {
	let { name: u } = t, o = { name: u }, i, D = {};
	switch (t.type) {
		case "int":
			i = Ct, e && (o.preprocess = Number);
			break;
		case "string":
			i = Ye;
			break;
		case "choice":
			i = Ft, o.choices = t.choices.map((s) => s?.redirect ? {
				...s,
				redirect: { to: {
					key: t.name,
					value: s.redirect
				} }
			} : s);
			break;
		case "boolean":
			i = mt;
			break;
		case "flag":
			i = n, o.flags = r.flatMap((s) => [
				s.alias,
				s.description && s.name,
				s.oppositeDescription && `no-${s.name}`
			].filter(Boolean));
			break;
		case "path":
			i = Ye;
			break;
		default: throw new Error(`Unexpected type ${t.type}`);
	}
	if (t.exception ? o.validate = (s, a, c) => t.exception(s) || a.validate(s, c) : o.validate = (s, a, c) => s === void 0 || a.validate(s, c), t.redirect && (D.redirect = (s) => s ? { to: typeof t.redirect == "string" ? t.redirect : {
		key: t.redirect.option,
		value: t.redirect.value
	} } : void 0), t.deprecated && (D.deprecated = !0), e && !t.array) {
		let s = o.preprocess || ((a) => a);
		o.preprocess = (a, c, p) => c.preprocess(s(Array.isArray(a) ? y(0, a, -1) : a), p);
	}
	return t.array ? pt.create({
		...e ? { preprocess: (s) => Array.isArray(s) ? s : [s] } : {},
		...D,
		valueSchema: i.create(o)
	}) : i.create({
		...o,
		...D
	});
}
var $n = Uo;
var $o = Array.prototype.findLast ?? function(t) {
	for (let e = this.length - 1; e >= 0; e--) {
		let r = this[e];
		if (t(r, e, this)) return r;
	}
};
var qt = X("findLast", function() {
	if (Array.isArray(this)) return $o;
});
var zn = Symbol.for("PRETTIER_IS_FRONT_MATTER");
var Xt = [];
function Go(t) {
	return !!t?.[zn];
}
var pe = Go;
var Gn = /* @__PURE__ */ new Set(["yaml", "toml"]);
var je = ({ node: t }) => pe(t) && Gn.has(t.language);
async function Qt(t, e, r, n) {
	let { node: u } = r, { language: o } = u;
	if (!Gn.has(o)) return;
	let i = u.value.trim(), D;
	if (i) {
		let s = o === "yaml" ? o : st(n, { language: o });
		if (!s) return;
		D = i ? await t(i, { parser: s }) : "";
	} else D = i;
	return Xe([
		u.startDelimiter,
		u.explicitLanguage ?? "",
		W,
		D,
		D ? W : "",
		u.endDelimiter
	]);
}
function Ko(t, e) {
	return je({ node: t }) && (delete e.end, delete e.raw, delete e.value), e;
}
var Zt = Ko;
function Ho({ node: t }) {
	return t.raw;
}
var er = Ho;
var Kn = /* @__PURE__ */ new Set([
	"tokens",
	"comments",
	"parent",
	"enclosingNode",
	"precedingNode",
	"followingNode"
]);
var Jo = (t) => Object.keys(t).filter((e) => !Kn.has(e));
function qo(t, e) {
	let r = t ? (n) => t(n, Kn) : Jo;
	return e ? new Proxy(r, { apply: (n, u, o) => pe(o[0]) ? Xt : Reflect.apply(n, u, o) }) : r;
}
var tr = qo;
function rr(t, e) {
	if (!e) throw new Error("parserName is required.");
	let r = qt(0, t, (u) => u.parsers && le(u.parsers, e));
	if (r) return r;
	let n = `Couldn't resolve parser "${e}".`;
	throw n += " Plugins must be explicitly added to the standalone bundle.", new Le(n);
}
function Hn(t, e) {
	if (!e) throw new Error("astFormat is required.");
	let r = qt(0, t, (u) => u.printers && le(u.printers, e));
	if (r) return r;
	let n = `Couldn't find plugin for AST format "${e}".`;
	throw n += " Plugins must be explicitly added to the standalone bundle.", new Le(n);
}
function Ue({ plugins: t, parser: e }) {
	return nr(rr(t, e), e);
}
function nr(t, e) {
	let r = t.parsers[e];
	return typeof r == "function" ? r() : r;
}
async function Jn(t, e) {
	let r = t.printers[e];
	return Zo(typeof r == "function" ? await r() : r);
}
function Xo(t) {
	let { features: e, getVisitorKeys: r, embed: n, massageAstNode: u, print: o, ...i } = t;
	e = ni(e);
	let D = e.experimental_frontMatterSupport;
	r = tr(r, D.massageAstNode || D.embed || D.print);
	let s = u;
	u && D.massageAstNode && (s = new Proxy(u, { apply(l, m, f) {
		return Zt(...f), Reflect.apply(l, m, f);
	} }));
	let a = n;
	if (n) {
		let l;
		a = new Proxy(n, {
			get(m, f, F) {
				return f === "getVisitorKeys" ? (l ?? (l = n.getVisitorKeys ? tr(n.getVisitorKeys, D.massageAstNode || D.embed) : r), l) : Reflect.get(m, f, F);
			},
			apply: (m, f, F) => D.embed && je(...F) ? Qt : Reflect.apply(m, f, F)
		});
	}
	let c = o;
	return D.print && (c = new Proxy(o, { apply(l, m, f) {
		let [F] = f;
		return pe(F.node) ? er(F) : Reflect.apply(l, m, f);
	} })), {
		features: e,
		getVisitorKeys: r,
		embed: a,
		massageAstNode: s,
		print: c,
		...i
	};
}
var Qo = /* @__PURE__ */ new WeakMap();
function Zo(t) {
	return Fe(Qo, t, Xo);
}
var ti = Object.fromEntries([
	"clean",
	"embed",
	"print"
].map((t) => [t, !1]));
function ri(t) {
	return {
		...ti,
		...t
	};
}
function ni(t) {
	return {
		experimental_avoidAstMutation: !1,
		...t,
		experimental_frontMatterSupport: ri(t?.experimental_frontMatterSupport)
	};
}
var qn = {
	astFormat: "estree",
	printer: {},
	originalText: void 0,
	locStart: null,
	locEnd: null,
	getVisitorKeys: null
};
async function ui(t, e = {}) {
	let r = { ...t };
	if (!r.parser) {
		if (!r.filepath) throw new Me("No parser and no file path given, couldn't infer a parser.");
		if (r.parser = st(r, { physicalFile: r.filepath }), !r.parser) throw new Me(`No parser could be inferred for file "${r.filepath}".`);
	}
	let n = it({
		plugins: t.plugins,
		showDeprecated: !0
	}).options, u = {
		...qn,
		...Object.fromEntries(n.filter((p) => p.default !== void 0).map((p) => [p.name, p.default]))
	}, o = rr(r.plugins, r.parser), i = await nr(o, r.parser);
	r.astFormat = i.astFormat, r.locEnd = i.locEnd, r.locStart = i.locStart;
	let D = o.printers?.[i.astFormat] ? o : Hn(r.plugins, i.astFormat), s = await Jn(D, i.astFormat);
	r.printer = s, r.getVisitorKeys = s.getVisitorKeys;
	let a = D.defaultOptions ? Object.fromEntries(Object.entries(D.defaultOptions).filter(([, p]) => p !== void 0)) : {}, c = {
		...u,
		...a
	};
	for (let [p, l] of Object.entries(c)) r[p] ?? (r[p] = l);
	return r.parser === "json" && (r.trailingComma = "none"), $n(r, n, {
		passThrough: Object.keys(qn),
		...e
	});
}
var se = ui;
var Xn = /\r\n|[\n\r\u2028\u2029]/;
function oi(t, e, r, n) {
	let u = {
		column: null,
		line: -1,
		...t.start
	}, o = {
		...u,
		...t.end
	}, { linesAbove: i = 2, linesBelow: D = 3 } = r || {}, s = u.line - n, a = u.column, c = o.line - n, p = o.column, l = Math.max(s - (i + 1), 0), m = Math.min(e.length, c + D);
	s === -1 && (l = 0), c === -1 && (m = e.length);
	let f = c - s, F = {};
	if (f) for (let d = 0; d <= f; d++) {
		let E = d + s;
		if (a == null) F[E] = !0;
		else if (d === 0) F[E] = [a, e[E - 1].length - a];
		else if (d === f) F[E] = [0, p];
		else F[E] = [0, e[E - 1].length];
	}
	else if (a === p) a != null ? F[s] = [a, 0] : F[s] = !0;
	else {
		let d = a ?? 0;
		F[s] = [d, (p ?? d) - d];
	}
	return {
		start: l,
		end: m,
		markerLines: F
	};
}
function Qn(t, e, r = {}, n) {
	let { defs: u, highlight: o } = n || {
		defs: {
			gutter: String,
			marker: String,
			message: String,
			reset: String
		},
		highlight: String
	}, i = (r.startLine || 1) - 1, { start: s, end: a, markerLines: c } = oi(e, t.split(Xn), r, i), p = e.start && typeof e.start.column == "number", l = String(a + i).length, f = o(t).split(Xn, a).slice(s, a).map((F, d) => {
		let E = s + 1 + d, h = ` ${` ${E + i}`.slice(-l)} |`, _ = c[E], P = !c[E + 1];
		if (_) {
			let A = "";
			if (Array.isArray(_)) {
				let B = F.slice(0, _[0]).replace(/[^\t]/g, " "), J = _[1] || 1;
				A = [
					`
 `,
					u.gutter(h.replace(/\d/g, " ")),
					" ",
					B,
					u.marker("^").repeat(J)
				].join(""), P && r.message && (A += " " + u.message(r.message));
			}
			return [
				u.marker(">"),
				u.gutter(h),
				F.length > 0 ? ` ${F}` : "",
				A
			].join("");
		} else return ` ${u.gutter(h)}${F.length > 0 ? ` ${F}` : ""}`;
	}).join(`
`);
	return r.message && !p && (f = `${" ".repeat(l + 1)}${r.message}
${f}`), u.reset(f);
}
function Zn(t, e, r = {}) {
	return Qn(t, e, r);
}
async function ii(t, e) {
	let r = await Ue(e), n = r.preprocess ? await r.preprocess(t, e) : t;
	e.originalText = n;
	let u;
	try {
		u = await r.parse(n, e, e);
	} catch (o) {
		si(o, t);
	}
	return {
		text: n,
		ast: u
	};
}
function si(t, e) {
	let { loc: r } = t;
	if (r) {
		let { start: n, end: u } = r;
		n && (n = {
			line: n.line,
			column: n.column - 1
		}), u && (u = {
			line: u.line,
			column: u.column - 1
		});
		let o = Zn(e, {
			start: n,
			end: u
		}, { highlightCode: !0 });
		t.message += `
` + o, t.codeFrame = o;
	}
	throw t;
}
var me = ii;
async function eu(t, e, r, n, u) {
	if (r.embeddedLanguageFormatting !== "auto") return;
	let { printer: o } = r, { embed: i } = o;
	if (!i) return;
	if (i.length > 2) throw new Error("printer.embed has too many parameters. The API changed in Prettier v3. Please update your plugin. See https://prettier.io/docs/plugins#optional-embed");
	let { hasPrettierIgnore: D } = o, { getVisitorKeys: s } = i, a = [];
	l();
	let c = t.stack;
	for (let { print: m, node: f, pathStack: F } of a) try {
		t.stack = F;
		let d = await m(p, e, t, r);
		d && u.set(f, d);
	} catch (d) {
		if (globalThis.PRETTIER_DEBUG) throw d;
	}
	t.stack = c;
	function p(m, f) {
		return Di(m, f, r, n);
	}
	function l() {
		let { node: m } = t;
		if (m === null || typeof m != "object" || D?.(t)) return;
		for (let F of s(m)) Array.isArray(m[F]) ? t.each(l, F) : t.call(l, F);
		let f = i(t, r);
		if (f) {
			if (typeof f == "function") {
				a.push({
					print: f,
					node: m,
					pathStack: [...t.stack]
				});
				return;
			}
			u.set(m, f);
		}
	}
}
async function Di(t, e, r, n) {
	let u = await se({
		...r,
		...e,
		parentParser: r.parser,
		originalText: t,
		cursorOffset: void 0,
		rangeStart: void 0,
		rangeEnd: void 0
	}, { passThrough: !0 }), { ast: o } = await me(t, u);
	return He(await n(o, u));
}
function ai(t, e, r, n) {
	let { originalText: u, [ue]: o, locStart: i, locEnd: D, [Symbol.for("printedComments")]: s } = e, { node: a } = t, c = i(a), p = D(a);
	for (let m of o) i(m) >= c && D(m) <= p && s.add(m);
	let { printPrettierIgnored: l } = e.printer;
	return l ? l(t, e, r, n) : u.slice(c, p);
}
var tu = ai;
async function Ve(t, e) {
	({ast: t} = await ur(t, e));
	let r = /* @__PURE__ */ new Map(), n = new en(t), u = dn(e), o = /* @__PURE__ */ new Map();
	await eu(n, D, e, Ve, o);
	let i = await ru(n, e, D, void 0, o);
	if (mn(e), e.cursorOffset >= 0) {
		if (e.nodeAfterCursor && !e.nodeBeforeCursor) return [ee, i];
		if (e.nodeBeforeCursor && !e.nodeAfterCursor) return [i, ee];
	}
	return i;
	function D(a, c) {
		return a === void 0 || a === n ? s(c) : Array.isArray(a) ? n.call(() => s(c), ...a) : n.call(() => s(c), a);
	}
	function s(a) {
		u(n);
		let c = n.node;
		if (c == null) return "";
		let p = ge(c) && a === void 0;
		if (p && r.has(c)) return r.get(c);
		let l = ru(n, e, D, a, o);
		return p && r.set(c, l), l;
	}
}
function ru(t, e, r, n, u) {
	let { node: o } = t, { printer: i } = e, D;
	switch (i.hasPrettierIgnore?.(t) ? D = tu(t, e, r, n) : u.has(o) ? D = u.get(o) : D = i.print(t, e, r, n), o) {
		case e.cursorNode:
			D = Ee(D, (s) => [
				ee,
				s,
				ee
			]);
			break;
		case e.nodeBeforeCursor:
			D = Ee(D, (s) => [s, ee]);
			break;
		case e.nodeAfterCursor: D = Ee(D, (s) => [ee, s]);
	}
	return i.printComment && rt(o.comments) && !i.willPrintOwnComments?.(t, e) && (D = pn(t, D, e)), D;
}
async function ur(t, e) {
	let r = t.comments ?? [];
	e[ue] = r, e[Symbol.for("printedComments")] = /* @__PURE__ */ new Set(), an(t, e);
	let { printer: { preprocess: n } } = e;
	return t = n ? await n(t, e) : t, {
		ast: t,
		comments: r
	};
}
function ci(t, e) {
	let { cursorOffset: r, locStart: n, locEnd: u, getVisitorKeys: o } = e, i = (m) => n(m) <= r && u(m) >= r, D = t, s = [t];
	for (let m of nn(t, {
		getVisitorKeys: o,
		filter: i
	})) s.push(m), D = m;
	if (un(D, { getVisitorKeys: o })) return { cursorNode: D };
	let a, c, p = -1, l = Number.POSITIVE_INFINITY;
	for (; s.length > 0 && (a === void 0 || c === void 0);) {
		D = s.pop();
		let m = a !== void 0, f = c !== void 0;
		for (let F of ye(D, { getVisitorKeys: o })) {
			if (!m) {
				let d = u(F);
				d <= r && d > p && (a = F, p = d);
			}
			if (!f) {
				let d = n(F);
				d >= r && d < l && (c = F, l = d);
			}
		}
	}
	return {
		nodeBeforeCursor: a,
		nodeAfterCursor: c
	};
}
var or = ci;
function fi(t, e) {
	let { printer: r } = e, n = r.massageAstNode;
	if (!n) return t;
	let { getVisitorKeys: u } = r, { ignoredProperties: o } = n;
	return i(t);
	function i(D, s) {
		if (!ge(D)) return D;
		if (Array.isArray(D)) return D.map((l) => i(l, s)).filter(Boolean);
		let a = {}, c = new Set(u(D));
		for (let l in D) !le(D, l) || o?.has(l) || (c.has(l) ? a[l] = i(D[l], D) : a[l] = D[l]);
		let p = n(D, a, s);
		if (p !== null) return p ?? a;
	}
}
var nu = fi;
var li = Array.prototype.findLastIndex ?? function(t) {
	for (let e = this.length - 1; e >= 0; e--) {
		let r = this[e];
		if (t(r, e, this)) return e;
	}
	return -1;
};
var uu = X("findLastIndex", function() {
	if (Array.isArray(this)) return li;
});
function mi(t, e) {
	return e = new Set(e), t.find((r) => su.has(r.type) && e.has(r));
}
function ou(t) {
	let e = uu(0, t, (r) => r.type !== "Program" && r.type !== "File");
	return e === -1 ? t : t.slice(0, e + 1);
}
function di(t, e, { locStart: r, locEnd: n }) {
	let [u, ...o] = t, [i, ...D] = e;
	if (u === i) return [u, i];
	let s = r(u);
	for (let c of ou(D)) if (r(c) >= s) i = c;
	else break;
	let a = n(i);
	for (let c of ou(o)) {
		if (n(c) <= a) u = c;
		else break;
		if (u === i) break;
	}
	return [u, i];
}
function ir(t, e, r, n, u = [], o, i) {
	let { locStart: D, locEnd: s } = i, a = D(t), c = s(t);
	if (e > c || e < a || o === "rangeEnd" && e === a || o === "rangeStart" && e === c) return;
	let p = [t, ...u], l = ot(t, p, {
		cache: Ut,
		locStart: D,
		locEnd: s,
		getVisitorKeys: r.getVisitorKeys,
		filter: r.printer.canAttachComment,
		getChildren: r.printer.getCommentChildNodes
	});
	for (let m of l) {
		let f = ir(m, e, r, n, p, o, i);
		if (f) return f;
	}
	if (n(t, u[0])) return p;
}
function Fi(t, e) {
	return e !== "DeclareExportDeclaration" && t !== "TypeParameterDeclaration" && (t === "Directive" || t === "TypeAlias" || t === "TSExportAssignment" || t.startsWith("Declare") || t.startsWith("TSDeclare") || t.endsWith("Statement") || t.endsWith("Declaration"));
}
var su = /* @__PURE__ */ new Set([
	"JsonRoot",
	"ObjectExpression",
	"ArrayExpression",
	"StringLiteral",
	"NumericLiteral",
	"BooleanLiteral",
	"NullLiteral",
	"UnaryExpression",
	"TemplateLiteral"
]);
var Ei = /* @__PURE__ */ new Set([
	"OperationDefinition",
	"FragmentDefinition",
	"VariableDefinition",
	"TypeExtensionDefinition",
	"ObjectTypeDefinition",
	"FieldDefinition",
	"DirectiveDefinition",
	"EnumTypeDefinition",
	"EnumValueDefinition",
	"InputValueDefinition",
	"InputObjectTypeDefinition",
	"SchemaDefinition",
	"OperationTypeDefinition",
	"InterfaceTypeDefinition",
	"UnionTypeDefinition",
	"ScalarTypeDefinition"
]);
function iu(t, e, r) {
	if (!e) return !1;
	switch (t.parser) {
		case "flow":
		case "hermes":
		case "babel":
		case "babel-flow":
		case "babel-ts":
		case "typescript":
		case "acorn":
		case "espree":
		case "meriyah":
		case "oxc":
		case "oxc-ts":
		case "yuku":
		case "yuku-ts":
		case "__babel_estree": return Fi(e.type, r?.type);
		case "json":
		case "json5":
		case "jsonc":
		case "json-stringify": return su.has(e.type);
		case "graphql": return Ei.has(e.kind);
		case "vue": return e.tag !== "root";
	}
	return !1;
}
function Du(t, e, r) {
	let { rangeStart: n, rangeEnd: u } = e;
	k(u > n);
	let o = t.slice(n, u).search(/\S/), i = o === -1;
	if (!i) for (n += o; u > n && !/\S/.test(t[u - 1]); --u);
	let D = e.printer.features?.experimental_locForRangeFormat ?? e, s = ir(r, n, e, (f, F) => iu(e, f, F), [], "rangeStart", D);
	if (!s) return;
	let a = i ? s : ir(r, u, e, (f) => iu(e, f), [], "rangeEnd", D);
	if (!a) return;
	let c, p;
	if (r.type === "JsonRoot") {
		let f = mi(s, a);
		c = f, p = f;
	} else [c, p] = di(s, a, e);
	let { locStart: l, locEnd: m } = D;
	return [Math.min(l(c), l(p)), Math.max(m(c), m(p))];
}
var lu = "﻿";
var au = Symbol("cursor");
async function pu(t, e, r = 0) {
	if (!t || t.trim().length === 0) return {
		formatted: "",
		cursorOffset: -1,
		comments: []
	};
	let { ast: n, text: u } = await me(t, e);
	e.cursorOffset >= 0 && (e = {
		...e,
		...or(n, e)
	});
	let o = await Ve(n, e, r);
	r > 0 && (o = Qe([W, o], r, e.tabWidth));
	let i = Ce(o, e);
	if (r > 0) {
		let s = i.formatted.trim();
		i.cursorNodeStart !== void 0 && (i.cursorNodeStart -= i.formatted.indexOf(s), i.cursorNodeStart < 0 && (i.cursorNodeStart = 0, i.cursorNodeText = i.cursorNodeText.trimStart()), i.cursorNodeStart + i.cursorNodeText.length > s.length && (i.cursorNodeText = i.cursorNodeText.trimEnd())), i.formatted = s + we(e.endOfLine);
	}
	let D = e[ue];
	if (e.cursorOffset >= 0) {
		let s, a, c, p;
		if ((e.cursorNode || e.nodeBeforeCursor || e.nodeAfterCursor) && i.cursorNodeText) if (c = i.cursorNodeStart, p = i.cursorNodeText, e.cursorNode) s = e.locStart(e.cursorNode), a = u.slice(s, e.locEnd(e.cursorNode));
		else {
			if (!e.nodeBeforeCursor && !e.nodeAfterCursor) throw new Error("Cursor location must contain at least one of cursorNode, nodeBeforeCursor, nodeAfterCursor");
			s = e.nodeBeforeCursor ? e.locEnd(e.nodeBeforeCursor) : 0;
			let E = e.nodeAfterCursor ? e.locStart(e.nodeAfterCursor) : u.length;
			a = u.slice(s, E);
		}
		else s = 0, a = u, c = 0, p = i.formatted;
		let l = e.cursorOffset - s;
		if (a === p) return {
			formatted: i.formatted,
			cursorOffset: c + l,
			comments: D
		};
		let m = a.split("");
		m.splice(l, 0, au);
		let F = xt(m, p.split("")), d = c;
		for (let E of F) if (E.removed) {
			if (E.value.includes(au)) break;
		} else d += E.count;
		return {
			formatted: i.formatted,
			cursorOffset: d,
			comments: D
		};
	}
	return {
		formatted: i.formatted,
		cursorOffset: -1,
		comments: D
	};
}
async function Ci(t, e) {
	let { ast: r, text: n } = await me(t, e), [u, o] = Du(n, e, r) ?? [0, 0], i = n.slice(u, o), D = Math.min(u, n.lastIndexOf(`
`, u) + 1), s = n.slice(D, u).match(/^\s*/)[0], a = he(s, e.tabWidth), c = await pu(i, {
		...e,
		rangeStart: 0,
		rangeEnd: Number.POSITIVE_INFINITY,
		cursorOffset: e.cursorOffset > u && e.cursorOffset <= o ? e.cursorOffset - u : -1,
		endOfLine: "lf"
	}, a), p = c.formatted.trimEnd(), { cursorOffset: l } = e;
	l > o ? l += p.length - i.length : c.cursorOffset >= 0 && (l = c.cursorOffset + u);
	let m = n.slice(0, u) + p + n.slice(o);
	if (e.endOfLine !== "lf") {
		let f = we(e.endOfLine);
		l >= 0 && f === `\r
` && (l += Tt(m.slice(0, l), `
`)), m = ne(0, m, `
`, f);
	}
	return {
		formatted: m,
		cursorOffset: l,
		comments: c.comments
	};
}
function sr(t, e, r) {
	return typeof e != "number" || Number.isNaN(e) || e < 0 || e > t.length ? r : e;
}
function cu(t, e) {
	let { cursorOffset: r, rangeStart: n, rangeEnd: u } = e;
	return r = sr(t, r, -1), n = sr(t, n, 0), u = sr(t, u, t.length), {
		...e,
		cursorOffset: r,
		rangeStart: n,
		rangeEnd: u
	};
}
function mu(t, e) {
	let { cursorOffset: r, rangeStart: n, rangeEnd: u, endOfLine: o } = cu(t, e), i = t.charAt(0) === lu;
	if (i && (t = t.slice(1), r--, n--, u--), o === "auto" && (o = Cr(t)), t.includes("\r")) {
		let D = (s) => Tt(t.slice(0, Math.max(s, 0)), `\r
`);
		r -= D(r), n -= D(n), u -= D(u), t = hr(t);
	}
	return {
		hasBOM: i,
		text: t,
		options: cu(t, {
			...e,
			cursorOffset: r,
			rangeStart: n,
			rangeEnd: u,
			endOfLine: o
		})
	};
}
async function fu(t, e) {
	let r = await Ue(e);
	return !r.hasPragma || r.hasPragma(t);
}
async function hi(t, e) {
	return (await Ue(e)).hasIgnorePragma?.(t);
}
async function Dr(t, e) {
	let { hasBOM: r, text: n, options: u } = mu(t, await se(e));
	if (u.rangeStart >= u.rangeEnd && n !== "" || u.requirePragma && !await fu(n, u) || u.checkIgnorePragma && await hi(n, u)) return {
		formatted: t,
		cursorOffset: e.cursorOffset,
		comments: []
	};
	let o;
	return u.rangeStart > 0 || u.rangeEnd < n.length ? o = await Ci(n, u) : (!u.requirePragma && u.insertPragma && u.printer.insertPragma && !await fu(n, u) && (n = u.printer.insertPragma(n)), o = await pu(n, u)), r && (o.formatted = lu + o.formatted, o.cursorOffset >= 0 && o.cursorOffset++), o;
}
async function du(t, e, r) {
	let { text: n, options: u } = mu(t, await se(e)), o = await me(n, u);
	return r && (r.preprocessForPrint && (o.ast = await ur(o.ast, u)), r.massage && (o.ast = nu(o.ast, u))), o;
}
async function Fu(t, e) {
	e = await se(e);
	return Ce(await Ve(t, e), e);
}
async function Eu(t, e) {
	let { formatted: n } = await Dr(Ur(t), {
		...e,
		parser: "__js_expression"
	});
	return n;
}
async function Cu(t, e) {
	e = await se(e);
	let { ast: r } = await me(t, e);
	return e.cursorOffset >= 0 && (e = {
		...e,
		...or(r, e)
	}), Ve(r, e);
}
async function hu(t, e) {
	return Ce(t, await se(e));
}
var ar = {};
yt(ar, {
	builders: () => _i,
	printer: () => yi,
	utils: () => Ai
});
var _i = {
	join: be,
	line: Ze,
	softline: Mr,
	hardline: W,
	literalline: Je,
	group: wt,
	conditionalGroup: Ir,
	fill: kr,
	lineSuffix: Ie,
	lineSuffixBoundary: Yr,
	cursor: ee,
	breakParent: ae,
	ifBreak: Rr,
	trim: jr,
	indent: oe,
	indentIfBreak: vr,
	align: De,
	addAlignmentToDoc: Qe,
	markAsRoot: Xe,
	dedentToRoot: Sr,
	dedent: br,
	hardlineWithoutBreakParent: ke,
	literallineWithoutBreakParent: Ot,
	label: Lr,
	concat: (t) => t
};
var yi = { printDocToString: Ce };
var Ai = {
	willBreak: xr,
	traverseDoc: Oe,
	findInDoc: Ke,
	mapDoc: Se,
	removeLines: Tr,
	stripTrailingHardline: He,
	replaceEndOfLine: Nr,
	canBreak: wr
};
var gu = "3.9.9";
var fr = {};
yt(fr, {
	addDanglingComment: () => re,
	addLeadingComment: () => ce,
	addTrailingComment: () => fe,
	getAlignmentSize: () => he,
	getIndentSize: () => _u,
	getMaxContinuousCount: () => yu,
	getNextNonSpaceNonCommentCharacter: () => Au,
	getNextNonSpaceNonCommentCharacterIndex: () => vi,
	getPreferredQuote: () => Tu,
	getStringWidth: () => Re,
	hasNewline: () => H,
	hasNewlineInRange: () => Nu,
	hasSpaces: () => wu,
	isNextLineEmpty: () => Ui,
	isNextLineEmptyAfterIndex: () => gt,
	isPreviousLineEmpty: () => Mi,
	makeString: () => ji,
	skip: () => _e,
	skipEverythingButNewLine: () => ut,
	skipInlineComment: () => Be,
	skipNewline: () => $,
	skipSpaces: () => j,
	skipToLineEnd: () => nt,
	skipTrailingComment: () => Te,
	skipWhitespace: () => tn
});
function xi(t, e) {
	if (e === !1) return !1;
	if (t.charAt(e) === "/" && t.charAt(e + 1) === "*") {
		for (let r = e + 2; r < t.length; ++r) if (t.charAt(r) === "*" && t.charAt(r + 1) === "/") return r + 2;
	}
	return e;
}
var Be = xi;
function Bi(t, e) {
	return e === !1 ? !1 : t.charAt(e) === "/" && t.charAt(e + 1) === "/" ? ut(t, e) : e;
}
var Te = Bi;
function Ti(t, e) {
	let r = null, n = e;
	for (; n !== r;) r = n, n = j(t, n), n = Be(t, n), n = Te(t, n), n = $(t, n);
	return n;
}
var We = Ti;
function Ni(t, e) {
	let r = null, n = e;
	for (; n !== r;) r = n, n = nt(t, n), n = Be(t, n), n = j(t, n);
	return n = Te(t, n), n = $(t, n), n !== !1 && H(t, n);
}
var gt = Ni;
function wi(t, e) {
	let r = t.lastIndexOf(`
`);
	return r === -1 ? 0 : he(t.slice(r + 1).match(/^[\t ]*/)[0], e);
}
var _u = wi;
function cr(t) {
	if (typeof t != "string") throw new TypeError("Expected a string");
	return t.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
function Oi(t, e) {
	let r = t.matchAll(new RegExp(`(?:${cr(e)})+`, "g"));
	return r.reduce || (r = [...r]), r.reduce((n, [u]) => Math.max(n, u.length), 0) / e.length;
}
var yu = Oi;
function Pi(t, e) {
	let r = We(t, e);
	return r === !1 ? "" : t.charAt(r);
}
var Au = Pi;
var xu = Object.freeze({
	character: "'",
	codePoint: 39
});
var Bu = Object.freeze({
	character: "\"",
	codePoint: 34
});
var Si = Object.freeze({
	preferred: xu,
	alternate: Bu
});
var bi = Object.freeze({
	preferred: Bu,
	alternate: xu
});
function Tu(t, e) {
	let { preferred: r, alternate: n } = e === !0 || e === "'" ? Si : bi, { length: u } = t, o = 0, i = 0;
	for (let D = 0; D < u; D++) {
		let s = t.charCodeAt(D);
		s === r.codePoint ? o++ : s === n.codePoint && i++;
	}
	return (o > i ? n : r).character;
}
function ki(t, e, r) {
	for (let n = e; n < r; ++n) if (t.charAt(n) === `
`) return !0;
	return !1;
}
var Nu = ki;
function Ii(t, e, r = {}) {
	return j(t, r.backwards ? e - 1 : e, r) !== e;
}
var wu = Ii;
function Ri(t, e, r) {
	return We(t, r(e));
}
function vi(t, e) {
	return arguments.length === 2 || typeof e == "number" ? We(t, e) : Ri(...arguments);
}
function Li(t, e, r) {
	return ve(t, r(e));
}
function Mi(t, e) {
	return arguments.length === 2 || typeof e == "number" ? ve(t, e) : Li(...arguments);
}
function Yi(t, e, r) {
	return gt(t, r(e));
}
function ji(t, e, r) {
	let n = e === "\"" ? "'" : "\"";
	return e + ne(0, t, /\\(.)|(["'])/gs, (i, D, s) => D === n ? D : s === e ? "\\" + s : s || (r && /^[^\n\r"'0-7\\bfnrt-vx\u2028\u2029]$/.test(D) ? D : "\\" + D)) + e;
}
function Ui(t, e) {
	return arguments.length === 2 || typeof e == "number" ? gt(t, e) : Yi(...arguments);
}
function de(t, e = 1) {
	return async (...r) => {
		let n = r[e] ?? {}, u = n.plugins ?? [];
		return r[e] = {
			...n,
			plugins: Array.isArray(u) ? u : Object.values(u)
		}, await t(...r);
	};
}
var Ou = de(Dr);
async function Pu(t, e) {
	let { formatted: r } = await Ou(t, {
		...e,
		cursorOffset: -1
	});
	return r;
}
async function Vi(t, e) {
	return await Pu(t, e) === t;
}
var Wi = de(it, 0);
var $i = {
	parse: de(du),
	formatAST: de(Fu),
	formatDoc: de(Eu),
	printToDoc: de(Cu),
	printDocToString: de(hu)
};
//#endregion
//#region node_modules/.pnpm/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js
/** Types of elements found in htmlparser2's DOM */
var ElementType;
(function(ElementType) {
	/** Type for the root element of a document */
	ElementType["Root"] = "root";
	/** Type for Text */
	ElementType["Text"] = "text";
	/** Type for <? ... ?> */
	ElementType["Directive"] = "directive";
	/** Type for <!-- ... --> */
	ElementType["Comment"] = "comment";
	/** Type for <script> tags */
	ElementType["Script"] = "script";
	/** Type for <style> tags */
	ElementType["Style"] = "style";
	/** Type for Any tag */
	ElementType["Tag"] = "tag";
	/** Type for <![CDATA[ ... ]]> */
	ElementType["CDATA"] = "cdata";
	/** Type for <!doctype ...> */
	ElementType["Doctype"] = "doctype";
})(ElementType || (ElementType = {}));
/**
* Tests whether an element is a tag or not.
*
* @param elem Element to test
*/
function isTag$1(elem) {
	return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
}
/** Type for the root element of a document */
var Root = ElementType.Root;
/** Type for Text */
var Text$1 = ElementType.Text;
/** Type for <? ... ?> */
var Directive = ElementType.Directive;
/** Type for <!-- ... --> */
var Comment$1 = ElementType.Comment;
/** Type for <script> tags */
var Script = ElementType.Script;
/** Type for <style> tags */
var Style = ElementType.Style;
/** Type for Any tag */
var Tag = ElementType.Tag;
/** Type for <![CDATA[ ... ]]> */
var CDATA$1 = ElementType.CDATA;
/** Type for <!doctype ...> */
var Doctype = ElementType.Doctype;
//#endregion
//#region node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/node.js
/**
* This object will be used as the prototype for Nodes when creating a
* DOM-Level-1-compliant structure.
*/
var Node = class {
	constructor() {
		/** Parent of the node */
		this.parent = null;
		/** Previous sibling */
		this.prev = null;
		/** Next sibling */
		this.next = null;
		/** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
		this.startIndex = null;
		/** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
		this.endIndex = null;
	}
	/**
	* Same as {@link parent}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get parentNode() {
		return this.parent;
	}
	set parentNode(parent) {
		this.parent = parent;
	}
	/**
	* Same as {@link prev}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get previousSibling() {
		return this.prev;
	}
	set previousSibling(prev) {
		this.prev = prev;
	}
	/**
	* Same as {@link next}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get nextSibling() {
		return this.next;
	}
	set nextSibling(next) {
		this.next = next;
	}
	/**
	* Clone this node, and optionally its children.
	*
	* @param recursive Clone child nodes as well.
	* @returns A clone of the node.
	*/
	cloneNode(recursive = false) {
		return cloneNode(this, recursive);
	}
};
/**
* A node that contains some data.
*/
var DataNode = class extends Node {
	/**
	* @param data The content of the data node
	*/
	constructor(data) {
		super();
		this.data = data;
	}
	/**
	* Same as {@link data}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get nodeValue() {
		return this.data;
	}
	set nodeValue(data) {
		this.data = data;
	}
};
/**
* Text within the document.
*/
var Text = class extends DataNode {
	constructor() {
		super(...arguments);
		this.type = ElementType.Text;
	}
	get nodeType() {
		return 3;
	}
};
/**
* Comments within the document.
*/
var Comment = class extends DataNode {
	constructor() {
		super(...arguments);
		this.type = ElementType.Comment;
	}
	get nodeType() {
		return 8;
	}
};
/**
* Processing instructions, including doc types.
*/
var ProcessingInstruction = class extends DataNode {
	constructor(name, data) {
		super(data);
		this.name = name;
		this.type = ElementType.Directive;
	}
	get nodeType() {
		return 1;
	}
};
/**
* A `Node` that can have children.
*/
var NodeWithChildren = class extends Node {
	/**
	* @param children Children of the node. Only certain node types can have children.
	*/
	constructor(children) {
		super();
		this.children = children;
	}
	/** First child of the node. */
	get firstChild() {
		var _a;
		return (_a = this.children[0]) !== null && _a !== void 0 ? _a : null;
	}
	/** Last child of the node. */
	get lastChild() {
		return this.children.length > 0 ? this.children[this.children.length - 1] : null;
	}
	/**
	* Same as {@link children}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get childNodes() {
		return this.children;
	}
	set childNodes(children) {
		this.children = children;
	}
};
var CDATA = class extends NodeWithChildren {
	constructor() {
		super(...arguments);
		this.type = ElementType.CDATA;
	}
	get nodeType() {
		return 4;
	}
};
/**
* The root node of the document.
*/
var Document = class extends NodeWithChildren {
	constructor() {
		super(...arguments);
		this.type = ElementType.Root;
	}
	get nodeType() {
		return 9;
	}
};
/**
* An element within the DOM.
*/
var Element = class extends NodeWithChildren {
	/**
	* @param name Name of the tag, eg. `div`, `span`.
	* @param attribs Object mapping attribute names to attribute values.
	* @param children Children of the node.
	*/
	constructor(name, attribs, children = [], type = name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag) {
		super(children);
		this.name = name;
		this.attribs = attribs;
		this.type = type;
	}
	get nodeType() {
		return 1;
	}
	/**
	* Same as {@link name}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get tagName() {
		return this.name;
	}
	set tagName(name) {
		this.name = name;
	}
	get attributes() {
		return Object.keys(this.attribs).map((name) => {
			var _a, _b;
			return {
				name,
				value: this.attribs[name],
				namespace: (_a = this["x-attribsNamespace"]) === null || _a === void 0 ? void 0 : _a[name],
				prefix: (_b = this["x-attribsPrefix"]) === null || _b === void 0 ? void 0 : _b[name]
			};
		});
	}
};
/**
* @param node Node to check.
* @returns `true` if the node is a `Element`, `false` otherwise.
*/
function isTag(node) {
	return isTag$1(node);
}
/**
* @param node Node to check.
* @returns `true` if the node has the type `CDATA`, `false` otherwise.
*/
function isCDATA(node) {
	return node.type === ElementType.CDATA;
}
/**
* @param node Node to check.
* @returns `true` if the node has the type `Text`, `false` otherwise.
*/
function isText(node) {
	return node.type === ElementType.Text;
}
/**
* @param node Node to check.
* @returns `true` if the node has the type `Comment`, `false` otherwise.
*/
function isComment(node) {
	return node.type === ElementType.Comment;
}
/**
* @param node Node to check.
* @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
*/
function isDirective(node) {
	return node.type === ElementType.Directive;
}
/**
* @param node Node to check.
* @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
*/
function isDocument(node) {
	return node.type === ElementType.Root;
}
/**
* Clone a node, and optionally its children.
*
* @param recursive Clone child nodes as well.
* @returns A clone of the node.
*/
function cloneNode(node, recursive = false) {
	let result;
	if (isText(node)) result = new Text(node.data);
	else if (isComment(node)) result = new Comment(node.data);
	else if (isTag(node)) {
		const children = recursive ? cloneChildren(node.children) : [];
		const clone = new Element(node.name, { ...node.attribs }, children);
		children.forEach((child) => child.parent = clone);
		if (node.namespace != null) clone.namespace = node.namespace;
		if (node["x-attribsNamespace"]) clone["x-attribsNamespace"] = { ...node["x-attribsNamespace"] };
		if (node["x-attribsPrefix"]) clone["x-attribsPrefix"] = { ...node["x-attribsPrefix"] };
		result = clone;
	} else if (isCDATA(node)) {
		const children = recursive ? cloneChildren(node.children) : [];
		const clone = new CDATA(children);
		children.forEach((child) => child.parent = clone);
		result = clone;
	} else if (isDocument(node)) {
		const children = recursive ? cloneChildren(node.children) : [];
		const clone = new Document(children);
		children.forEach((child) => child.parent = clone);
		if (node["x-mode"]) clone["x-mode"] = node["x-mode"];
		result = clone;
	} else if (isDirective(node)) {
		const instruction = new ProcessingInstruction(node.name, node.data);
		if (node["x-name"] != null) {
			instruction["x-name"] = node["x-name"];
			instruction["x-publicId"] = node["x-publicId"];
			instruction["x-systemId"] = node["x-systemId"];
		}
		result = instruction;
	} else throw new Error(`Not implemented yet: ${node.type}`);
	result.startIndex = node.startIndex;
	result.endIndex = node.endIndex;
	if (node.sourceCodeLocation != null) result.sourceCodeLocation = node.sourceCodeLocation;
	return result;
}
function cloneChildren(childs) {
	const children = childs.map((child) => cloneNode(child, true));
	for (let i = 1; i < children.length; i++) {
		children[i].prev = children[i - 1];
		children[i - 1].next = children[i];
	}
	return children;
}
//#endregion
//#region node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js
var defaultOpts = {
	withStartIndices: false,
	withEndIndices: false,
	xmlMode: false
};
var DomHandler = class {
	/**
	* @param callback Called once parsing has completed.
	* @param options Settings for the handler.
	* @param elementCB Callback whenever a tag is closed.
	*/
	constructor(callback, options, elementCB) {
		/** The elements of the DOM */
		this.dom = [];
		/** The root element for the DOM */
		this.root = new Document(this.dom);
		/** Indicated whether parsing has been completed. */
		this.done = false;
		/** Stack of open tags. */
		this.tagStack = [this.root];
		/** A data node that is still being written to. */
		this.lastNode = null;
		/** Reference to the parser instance. Used for location information. */
		this.parser = null;
		if (typeof options === "function") {
			elementCB = options;
			options = defaultOpts;
		}
		if (typeof callback === "object") {
			options = callback;
			callback = void 0;
		}
		this.callback = callback !== null && callback !== void 0 ? callback : null;
		this.options = options !== null && options !== void 0 ? options : defaultOpts;
		this.elementCB = elementCB !== null && elementCB !== void 0 ? elementCB : null;
	}
	onparserinit(parser) {
		this.parser = parser;
	}
	onreset() {
		this.dom = [];
		this.root = new Document(this.dom);
		this.done = false;
		this.tagStack = [this.root];
		this.lastNode = null;
		this.parser = null;
	}
	onend() {
		if (this.done) return;
		this.done = true;
		this.parser = null;
		this.handleCallback(null);
	}
	onerror(error) {
		this.handleCallback(error);
	}
	onclosetag() {
		this.lastNode = null;
		const elem = this.tagStack.pop();
		if (this.options.withEndIndices) elem.endIndex = this.parser.endIndex;
		if (this.elementCB) this.elementCB(elem);
	}
	onopentag(name, attribs) {
		const element = new Element(name, attribs, void 0, this.options.xmlMode ? ElementType.Tag : void 0);
		this.addNode(element);
		this.tagStack.push(element);
	}
	ontext(data) {
		const { lastNode } = this;
		if (lastNode && lastNode.type === ElementType.Text) {
			lastNode.data += data;
			if (this.options.withEndIndices) lastNode.endIndex = this.parser.endIndex;
		} else {
			const node = new Text(data);
			this.addNode(node);
			this.lastNode = node;
		}
	}
	oncomment(data) {
		if (this.lastNode && this.lastNode.type === ElementType.Comment) {
			this.lastNode.data += data;
			return;
		}
		const node = new Comment(data);
		this.addNode(node);
		this.lastNode = node;
	}
	oncommentend() {
		this.lastNode = null;
	}
	oncdatastart() {
		const text = new Text("");
		const node = new CDATA([text]);
		this.addNode(node);
		text.parent = node;
		this.lastNode = text;
	}
	oncdataend() {
		this.lastNode = null;
	}
	onprocessinginstruction(name, data) {
		const node = new ProcessingInstruction(name, data);
		this.addNode(node);
	}
	handleCallback(error) {
		if (typeof this.callback === "function") this.callback(error, this.dom);
		else if (error) throw error;
	}
	addNode(node) {
		const parent = this.tagStack[this.tagStack.length - 1];
		const previousSibling = parent.children[parent.children.length - 1];
		if (this.options.withStartIndices) node.startIndex = this.parser.startIndex;
		if (this.options.withEndIndices) node.endIndex = this.parser.endIndex;
		parent.children.push(node);
		if (previousSibling) {
			node.prev = previousSibling;
			previousSibling.next = node;
		}
		node.parent = parent;
		this.lastNode = null;
	}
};
//#endregion
//#region node_modules/.pnpm/leac@0.6.0/node_modules/leac/lib/leac.mjs
var e = /\n/g;
function n(n) {
	const o = [...n.matchAll(e)].map(((e) => e.index || 0));
	o.unshift(-1);
	const s = t(o, 0, o.length);
	return (e) => r(s, e);
}
function t(e, n, r) {
	if (r - n == 1) return {
		offset: e[n],
		index: n + 1
	};
	const o = Math.ceil((n + r) / 2), s = t(e, n, o), l = t(e, o, r);
	return {
		offset: s.offset,
		low: s,
		high: l
	};
}
function r(e, n) {
	return function(e) {
		return Object.prototype.hasOwnProperty.call(e, "index");
	}(e) ? {
		line: e.index,
		column: n - e.offset
	} : r(e.high.offset < n ? e.high : e.low, n);
}
function o(e, t = "", r = {}) {
	const o = "string" != typeof t ? t : r, l = "string" == typeof t ? t : "", c = e.map(s), f = !!o.lineNumbers;
	return function(e, t = 0) {
		const r = f ? n(e) : () => ({
			line: 0,
			column: 0
		});
		let o = t;
		const s = [];
		e: for (; o < e.length;) {
			let n = !1;
			for (const t of c) {
				t.regex.lastIndex = o;
				const c = t.regex.exec(e);
				if (c && c[0].length > 0) {
					if (!t.discard) {
						const e = r(o), n = "string" == typeof t.replace ? c[0].replace(new RegExp(t.regex.source, t.regex.flags), t.replace) : c[0];
						s.push({
							state: l,
							name: t.name,
							text: n,
							offset: o,
							len: c[0].length,
							line: e.line,
							column: e.column
						});
					}
					if (o = t.regex.lastIndex, n = !0, t.push) {
						const n = t.push(e, o);
						s.push(...n.tokens), o = n.offset;
					}
					if (t.pop) break e;
					break;
				}
			}
			if (!n) break;
		}
		return {
			tokens: s,
			offset: o,
			complete: e.length <= o
		};
	};
}
function s(e, n) {
	return {
		...e,
		regex: l(e, n)
	};
}
function l(e, n) {
	if (0 === e.name.length) throw new Error(`Rule #${n} has empty name, which is not allowed.`);
	if (function(e) {
		return Object.prototype.hasOwnProperty.call(e, "regex");
	}(e)) return function(e) {
		if (e.global) throw new Error(`Regular expression /${e.source}/${e.flags} contains the global flag, which is not allowed.`);
		return e.sticky ? e : new RegExp(e.source, e.flags + "y");
	}(e.regex);
	if (function(e) {
		return Object.prototype.hasOwnProperty.call(e, "str");
	}(e)) {
		if (0 === e.str.length) throw new Error(`Rule #${n} ("${e.name}") has empty "str" property, which is not allowed.`);
		return new RegExp(c(e.str), "y");
	}
	return new RegExp(c(e.name), "y");
}
function c(e) {
	return e.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, "\\$&");
}
//#endregion
//#region node_modules/.pnpm/peberminta@0.9.0/node_modules/peberminta/lib/core.mjs
function token$1(onToken, onEnd) {
	return (data, i) => {
		let position = i;
		let value = void 0;
		if (i < data.tokens.length) {
			value = onToken(data.tokens[i], data, i);
			if (value !== void 0) position++;
		} else onEnd?.(data, i);
		return value === void 0 ? { matched: false } : {
			matched: true,
			position,
			value
		};
	};
}
function mapInner(r, f) {
	return r.matched ? {
		matched: true,
		position: r.position,
		value: f(r.value, r.position)
	} : r;
}
function mapOuter(r, f) {
	return r.matched ? f(r) : r;
}
function map(p, mapper) {
	return (data, i) => mapInner(p(data, i), (v, j) => mapper(v, data, i, j));
}
function option(p, def) {
	return (data, i) => {
		const r = p(data, i);
		return r.matched ? r : {
			matched: true,
			position: i,
			value: def
		};
	};
}
function choice(...ps) {
	return (data, i) => {
		for (const p of ps) {
			const result = p(data, i);
			if (result.matched) return result;
		}
		return { matched: false };
	};
}
function otherwise(pa, pb) {
	return (data, i) => {
		const r1 = pa(data, i);
		return r1.matched ? r1 : pb(data, i);
	};
}
function takeWhile(p, test) {
	return (data, i) => {
		const values = [];
		let success = true;
		do {
			const r = p(data, i);
			if (r.matched && test(r.value, values.length + 1, data, i, r.position)) {
				values.push(r.value);
				i = r.position;
			} else success = false;
		} while (success);
		return {
			matched: true,
			position: i,
			value: values
		};
	};
}
function many(p) {
	return takeWhile(p, () => true);
}
function many1(p) {
	return ab(p, many(p), (head, tail) => [head, ...tail]);
}
function ab(pa, pb, join) {
	return (data, i) => mapOuter(pa(data, i), (ma) => mapInner(pb(data, ma.position), (vb, j) => join(ma.value, vb, data, i, j)));
}
function left(pa, pb) {
	return ab(pa, pb, (va) => va);
}
function right(pa, pb) {
	return ab(pa, pb, (va, vb) => vb);
}
function abc(pa, pb, pc, join) {
	return (data, i) => mapOuter(pa(data, i), (ma) => mapOuter(pb(data, ma.position), (mb) => mapInner(pc(data, mb.position), (vc, j) => join(ma.value, mb.value, vc, data, i, j))));
}
function middle(pa, pb, pc) {
	return abc(pa, pb, pc, (ra, rb) => rb);
}
function all(...ps) {
	return (data, i) => {
		const result = [];
		let position = i;
		for (const p of ps) {
			const r1 = p(data, position);
			if (r1.matched) {
				result.push(r1.value);
				position = r1.position;
			} else return { matched: false };
		}
		return {
			matched: true,
			position,
			value: result
		};
	};
}
function flatten(...ps) {
	return flatten1(all(...ps));
}
function flatten1(p) {
	return map(p, (vs) => vs.flatMap((v) => v));
}
function chainReduce(acc, f) {
	return (data, i) => {
		let loop = true;
		let acc1 = acc;
		let pos = i;
		do {
			const r = f(acc1, data, pos)(data, pos);
			if (r.matched) {
				acc1 = r.value;
				pos = r.position;
			} else loop = false;
		} while (loop);
		return {
			matched: true,
			position: pos,
			value: acc1
		};
	};
}
function reduceLeft(acc, p, reducer) {
	return chainReduce(acc, (acc) => map(p, (v, data, i, j) => reducer(acc, v, data, i, j)));
}
function leftAssoc2(pLeft, pOper, pRight) {
	return chain(pLeft, (v0) => reduceLeft(v0, ab(pOper, pRight, (f, y) => [f, y]), (acc, [f, y]) => f(acc, y)));
}
function chain(p, f) {
	return (data, i) => mapOuter(p(data, i), (m1) => f(m1.value, data, i, m1.position)(data, m1.position));
}
//#endregion
//#region node_modules/.pnpm/parseley@0.12.1/node_modules/parseley/lib/parseley.mjs
var ws = `(?:[ \\t\\r\\n\\f]*)`;
var nl = `(?:\\n|\\r\\n|\\r|\\f)`;
var nonascii = `[^\\x00-\\x7F]`;
var unicode = `(?:\\\\[0-9a-f]{1,6}(?:\\r\\n|[ \\n\\r\\t\\f])?)`;
var escape = `(?:\\\\[^\\n\\r\\f0-9a-f])`;
var nmstart = `(?:[_a-z]|${nonascii}|${unicode}|${escape})`;
var nmchar = `(?:[_a-z0-9-]|${nonascii}|${unicode}|${escape})`;
var name = `(?:${nmchar}+)`;
var ident = `(?:[-]?${nmstart}${nmchar}*)`;
var string1 = `'([^\\n\\r\\f\\\\']|\\\\${nl}|${nonascii}|${unicode}|${escape})*'`;
var string2 = `"([^\\n\\r\\f\\\\"]|\\\\${nl}|${nonascii}|${unicode}|${escape})*"`;
var lexSelector = o([
	{
		name: "ws",
		regex: new RegExp(ws)
	},
	{
		name: "hash",
		regex: new RegExp(`#${name}`, "i")
	},
	{
		name: "ident",
		regex: new RegExp(ident, "i")
	},
	{
		name: "str1",
		regex: new RegExp(string1, "i")
	},
	{
		name: "str2",
		regex: new RegExp(string2, "i")
	},
	{ name: "*" },
	{ name: "." },
	{ name: "," },
	{ name: "[" },
	{ name: "]" },
	{ name: "=" },
	{ name: ">" },
	{ name: "|" },
	{ name: "+" },
	{ name: "~" },
	{ name: "^" },
	{ name: "$" }
]);
var lexEscapedString = o([
	{
		name: "unicode",
		regex: new RegExp(unicode, "i")
	},
	{
		name: "escape",
		regex: new RegExp(escape, "i")
	},
	{
		name: "any",
		regex: /* @__PURE__ */ new RegExp("[\\s\\S]", "i")
	}
]);
function sumSpec([a0, a1, a2], [b0, b1, b2]) {
	return [
		a0 + b0,
		a1 + b1,
		a2 + b2
	];
}
function sumAllSpec(ss) {
	return ss.reduce(sumSpec, [
		0,
		0,
		0
	]);
}
var escapedString_ = map(many(choice(token$1((t) => t.name === "unicode" ? String.fromCodePoint(parseInt(t.text.slice(1), 16)) : void 0), token$1((t) => t.name === "escape" ? t.text.slice(1) : void 0), token$1((t) => t.name === "any" ? t.text : void 0))), (cs) => cs.join(""));
function unescape(escapedString) {
	return escapedString_({
		tokens: lexEscapedString(escapedString).tokens,
		options: void 0
	}, 0).value;
}
function literal(name) {
	return token$1((t) => t.name === name ? true : void 0);
}
var whitespace_ = token$1((t) => t.name === "ws" ? null : void 0);
var optionalWhitespace_ = option(whitespace_, null);
function optionallySpaced(parser) {
	return middle(optionalWhitespace_, parser, optionalWhitespace_);
}
var identifier_ = token$1((t) => t.name === "ident" ? unescape(t.text) : void 0);
var hashId_ = token$1((t) => t.name === "hash" ? unescape(t.text.slice(1)) : void 0);
var string_ = token$1((t) => t.name.startsWith("str") ? unescape(t.text.slice(1, -1)) : void 0);
var namespace_ = left(option(identifier_, ""), literal("|"));
var qualifiedName_ = otherwise(ab(namespace_, identifier_, (ns, name) => ({
	name,
	namespace: ns
})), map(identifier_, (name) => ({
	name,
	namespace: null
})));
var uniSelector_ = otherwise(ab(namespace_, literal("*"), (ns) => ({
	type: "universal",
	namespace: ns,
	specificity: [
		0,
		0,
		0
	]
})), map(literal("*"), () => ({
	type: "universal",
	namespace: null,
	specificity: [
		0,
		0,
		0
	]
})));
var tagSelector_ = map(qualifiedName_, ({ name, namespace }) => ({
	type: "tag",
	name,
	namespace,
	specificity: [
		0,
		0,
		1
	]
}));
var classSelector_ = ab(literal("."), identifier_, (fullstop, name) => ({
	type: "class",
	name,
	specificity: [
		0,
		1,
		0
	]
}));
var idSelector_ = map(hashId_, (name) => ({
	type: "id",
	name,
	specificity: [
		1,
		0,
		0
	]
}));
var attrModifier_ = token$1((t) => {
	if (t.name === "ident") {
		if (t.text === "i" || t.text === "I") return "i";
		if (t.text === "s" || t.text === "S") return "s";
	}
});
var attrValue_ = otherwise(ab(string_, option(right(optionalWhitespace_, attrModifier_), null), (v, mod) => ({
	value: v,
	modifier: mod
})), ab(identifier_, option(right(whitespace_, attrModifier_), null), (v, mod) => ({
	value: v,
	modifier: mod
})));
var attrMatcher_ = choice(map(literal("="), () => "="), ab(literal("~"), literal("="), () => "~="), ab(literal("|"), literal("="), () => "|="), ab(literal("^"), literal("="), () => "^="), ab(literal("$"), literal("="), () => "$="), ab(literal("*"), literal("="), () => "*="));
var attrSelector_ = otherwise(abc(literal("["), optionallySpaced(qualifiedName_), literal("]"), (lbr, { name, namespace }) => ({
	type: "attrPresence",
	name,
	namespace,
	specificity: [
		0,
		1,
		0
	]
})), middle(literal("["), abc(optionallySpaced(qualifiedName_), attrMatcher_, optionallySpaced(attrValue_), ({ name, namespace }, matcher, { value, modifier }) => ({
	type: "attrValue",
	name,
	namespace,
	matcher,
	value,
	modifier,
	specificity: [
		0,
		1,
		0
	]
})), literal("]")));
var typeSelector_ = otherwise(uniSelector_, tagSelector_);
var subclassSelector_ = choice(idSelector_, classSelector_, attrSelector_);
var compoundSelector_ = map(otherwise(flatten(typeSelector_, many(subclassSelector_)), many1(subclassSelector_)), (ss) => {
	return {
		type: "compound",
		list: ss,
		specificity: sumAllSpec(ss.map((s) => s.specificity))
	};
});
var complexSelector_ = leftAssoc2(compoundSelector_, map(otherwise(optionallySpaced(choice(map(literal(">"), () => ">"), map(literal("+"), () => "+"), map(literal("~"), () => "~"), ab(literal("|"), literal("|"), () => "||"))), map(whitespace_, () => " ")), (c) => (left, right) => ({
	type: "compound",
	list: [...right.list, {
		type: "combinator",
		combinator: c,
		left,
		specificity: left.specificity
	}],
	specificity: sumSpec(left.specificity, right.specificity)
})), compoundSelector_);
leftAssoc2(map(complexSelector_, (s) => ({
	type: "list",
	list: [s]
})), map(optionallySpaced(literal(",")), () => (acc, next) => ({
	type: "list",
	list: [...acc.list, next]
})), complexSelector_);
function parse_(parser, str) {
	if (!(typeof str === "string" || str instanceof String)) throw new Error("Expected a selector string. Actual input is not a string!");
	const lexerResult = lexSelector(str);
	if (!lexerResult.complete) throw new Error(`The input "${str}" was only partially tokenized, stopped at offset ${lexerResult.offset}!\n` + prettyPrintPosition(str, lexerResult.offset));
	const result = optionallySpaced(parser)({
		tokens: lexerResult.tokens,
		options: void 0
	}, 0);
	if (!result.matched) throw new Error(`No match for "${str}" input!`);
	if (result.position < lexerResult.tokens.length) {
		const token = lexerResult.tokens[result.position];
		throw new Error(`The input "${str}" was only partially parsed, stopped at offset ${token.offset}!\n` + prettyPrintPosition(str, token.offset, token.len));
	}
	return result.value;
}
function prettyPrintPosition(str, offset, len = 1) {
	return `${str.replace(/(\t)|(\r)|(\n)/g, (m, t, r) => t ? "␉" : r ? "␍" : "␊")}\n${"".padEnd(offset)}${"^".repeat(len)}`;
}
function parse1(str) {
	return parse_(complexSelector_, str);
}
function serialize(selector) {
	if (!selector.type) throw new Error("This is not an AST node.");
	switch (selector.type) {
		case "universal": return _serNs(selector.namespace) + "*";
		case "tag": return _serNs(selector.namespace) + _serIdent(selector.name);
		case "class": return "." + _serIdent(selector.name);
		case "id": return "#" + _serIdent(selector.name);
		case "attrPresence": return `[${_serNs(selector.namespace)}${_serIdent(selector.name)}]`;
		case "attrValue": return `[${_serNs(selector.namespace)}${_serIdent(selector.name)}${selector.matcher}"${_serStr(selector.value)}"${selector.modifier ? selector.modifier : ""}]`;
		case "combinator": return serialize(selector.left) + selector.combinator;
		case "compound": return selector.list.reduce((acc, node) => {
			if (node.type === "combinator") return serialize(node) + acc;
			else return acc + serialize(node);
		}, "");
		case "list": return selector.list.map(serialize).join(",");
	}
}
function _serNs(ns) {
	return ns || ns === "" ? _serIdent(ns) + "|" : "";
}
function _codePoint(char) {
	return `\\${char.codePointAt(0).toString(16)} `;
}
function _serIdent(str) {
	return str.replace(/(^[0-9])|(^-[0-9])|(^-$)|([-0-9a-zA-Z_]|[^\x00-\x7F])|(\x00)|([\x01-\x1f]|\x7f)|([\s\S])/g, (m, d1, d2, hy, safe, nl, ctrl, other) => d1 ? _codePoint(d1) : d2 ? "-" + _codePoint(d2.slice(1)) : hy ? "\\-" : safe ? safe : nl ? "�" : ctrl ? _codePoint(ctrl) : "\\" + other);
}
function _serStr(str) {
	return str.replace(/(")|(\\)|(\x00)|([\x01-\x1f]|\x7f)/g, (m, dq, bs, nl, ctrl) => dq ? "\\\"" : bs ? "\\\\" : nl ? "�" : _codePoint(ctrl));
}
function normalize(selector) {
	if (!selector.type) throw new Error("This is not an AST node.");
	switch (selector.type) {
		case "compound":
			selector.list.forEach(normalize);
			selector.list.sort((a, b) => _compareArrays(_getSelectorPriority(a), _getSelectorPriority(b)));
			break;
		case "combinator":
			normalize(selector.left);
			break;
		case "list":
			selector.list.forEach(normalize);
			selector.list.sort((a, b) => serialize(a) < serialize(b) ? -1 : 1);
	}
	return selector;
}
function _getSelectorPriority(selector) {
	switch (selector.type) {
		case "universal": return [1];
		case "tag": return [1];
		case "id": return [2];
		case "class": return [3, selector.name];
		case "attrPresence": return [4, serialize(selector)];
		case "attrValue": return [5, serialize(selector)];
		case "combinator": return [15, serialize(selector)];
	}
}
function compareSpecificity(a, b) {
	return _compareArrays(a, b);
}
function _compareArrays(a, b) {
	if (!Array.isArray(a) || !Array.isArray(b)) throw new Error("Arguments must be arrays.");
	const shorter = a.length < b.length ? a.length : b.length;
	for (let i = 0; i < shorter; i++) {
		if (a[i] === b[i]) continue;
		return a[i] < b[i] ? -1 : 1;
	}
	return a.length - b.length;
}
//#endregion
//#region node_modules/.pnpm/selderee@0.11.0/node_modules/selderee/lib/selderee.mjs
var DecisionTree = class {
	constructor(input) {
		this.branches = weave(toAstTerminalPairs(input));
	}
	build(builder) {
		return builder(this.branches);
	}
};
function toAstTerminalPairs(array) {
	const len = array.length;
	const results = new Array(len);
	for (let i = 0; i < len; i++) {
		const [selectorString, val] = array[i];
		const ast = preprocess(parse1(selectorString));
		results[i] = {
			ast,
			terminal: {
				type: "terminal",
				valueContainer: {
					index: i,
					value: val,
					specificity: ast.specificity
				}
			}
		};
	}
	return results;
}
function preprocess(ast) {
	reduceSelectorVariants(ast);
	normalize(ast);
	return ast;
}
function reduceSelectorVariants(ast) {
	const newList = [];
	ast.list.forEach((sel) => {
		switch (sel.type) {
			case "class":
				newList.push({
					matcher: "~=",
					modifier: null,
					name: "class",
					namespace: null,
					specificity: sel.specificity,
					type: "attrValue",
					value: sel.name
				});
				break;
			case "id":
				newList.push({
					matcher: "=",
					modifier: null,
					name: "id",
					namespace: null,
					specificity: sel.specificity,
					type: "attrValue",
					value: sel.name
				});
				break;
			case "combinator":
				reduceSelectorVariants(sel.left);
				newList.push(sel);
				break;
			case "universal": break;
			default: newList.push(sel);
		}
	});
	ast.list = newList;
}
function weave(items) {
	const branches = [];
	while (items.length) {
		const topKind = findTopKey(items, (sel) => true, getSelectorKind);
		const { matches, nonmatches, empty } = breakByKind(items, topKind);
		items = nonmatches;
		if (matches.length) branches.push(branchOfKind(topKind, matches));
		if (empty.length) branches.push(...terminate(empty));
	}
	return branches;
}
function terminate(items) {
	const results = [];
	for (const item of items) {
		const terminal = item.terminal;
		if (terminal.type === "terminal") results.push(terminal);
		else {
			const { matches, rest } = partition(terminal.cont, (node) => node.type === "terminal");
			matches.forEach((node) => results.push(node));
			if (rest.length) {
				terminal.cont = rest;
				results.push(terminal);
			}
		}
	}
	return results;
}
function breakByKind(items, selectedKind) {
	const matches = [];
	const nonmatches = [];
	const empty = [];
	for (const item of items) {
		const simpsels = item.ast.list;
		if (simpsels.length) (simpsels.some((node) => getSelectorKind(node) === selectedKind) ? matches : nonmatches).push(item);
		else empty.push(item);
	}
	return {
		matches,
		nonmatches,
		empty
	};
}
function getSelectorKind(sel) {
	switch (sel.type) {
		case "attrPresence": return `attrPresence ${sel.name}`;
		case "attrValue": return `attrValue ${sel.name}`;
		case "combinator": return `combinator ${sel.combinator}`;
		default: return sel.type;
	}
}
function branchOfKind(kind, items) {
	if (kind === "tag") return tagNameBranch(items);
	if (kind.startsWith("attrValue ")) return attrValueBranch(kind.substring(10), items);
	if (kind.startsWith("attrPresence ")) return attrPresenceBranch(kind.substring(13), items);
	if (kind === "combinator >") return combinatorBranch(">", items);
	if (kind === "combinator +") return combinatorBranch("+", items);
	throw new Error(`Unsupported selector kind: ${kind}`);
}
function tagNameBranch(items) {
	const groups = spliceAndGroup(items, (x) => x.type === "tag", (x) => x.name);
	return {
		type: "tagName",
		variants: Object.entries(groups).map(([name, group]) => ({
			type: "variant",
			value: name,
			cont: weave(group.items)
		}))
	};
}
function attrPresenceBranch(name, items) {
	for (const item of items) spliceSimpleSelector(item, (x) => x.type === "attrPresence" && x.name === name);
	return {
		type: "attrPresence",
		name,
		cont: weave(items)
	};
}
function attrValueBranch(name, items) {
	const groups = spliceAndGroup(items, (x) => x.type === "attrValue" && x.name === name, (x) => `${x.matcher} ${x.modifier || ""} ${x.value}`);
	const matchers = [];
	for (const group of Object.values(groups)) {
		const sel = group.oneSimpleSelector;
		const predicate = getAttrPredicate(sel);
		const continuation = weave(group.items);
		matchers.push({
			type: "matcher",
			matcher: sel.matcher,
			modifier: sel.modifier,
			value: sel.value,
			predicate,
			cont: continuation
		});
	}
	return {
		type: "attrValue",
		name,
		matchers
	};
}
function getAttrPredicate(sel) {
	if (sel.modifier === "i") {
		const expected = sel.value.toLowerCase();
		switch (sel.matcher) {
			case "=": return (actual) => expected === actual.toLowerCase();
			case "~=": return (actual) => actual.toLowerCase().split(/[ \t]+/).includes(expected);
			case "^=": return (actual) => actual.toLowerCase().startsWith(expected);
			case "$=": return (actual) => actual.toLowerCase().endsWith(expected);
			case "*=": return (actual) => actual.toLowerCase().includes(expected);
			case "|=": return (actual) => {
				const lower = actual.toLowerCase();
				return expected === lower || lower.startsWith(expected) && lower[expected.length] === "-";
			};
		}
	} else {
		const expected = sel.value;
		switch (sel.matcher) {
			case "=": return (actual) => expected === actual;
			case "~=": return (actual) => actual.split(/[ \t]+/).includes(expected);
			case "^=": return (actual) => actual.startsWith(expected);
			case "$=": return (actual) => actual.endsWith(expected);
			case "*=": return (actual) => actual.includes(expected);
			case "|=": return (actual) => expected === actual || actual.startsWith(expected) && actual[expected.length] === "-";
		}
	}
}
function combinatorBranch(combinator, items) {
	const groups = spliceAndGroup(items, (x) => x.type === "combinator" && x.combinator === combinator, (x) => serialize(x.left));
	const leftItems = [];
	for (const group of Object.values(groups)) {
		const rightCont = weave(group.items);
		const leftAst = group.oneSimpleSelector.left;
		leftItems.push({
			ast: leftAst,
			terminal: {
				type: "popElement",
				cont: rightCont
			}
		});
	}
	return {
		type: "pushElement",
		combinator,
		cont: weave(leftItems)
	};
}
function spliceAndGroup(items, predicate, keyCallback) {
	const groups = {};
	while (items.length) {
		const bestKey = findTopKey(items, predicate, keyCallback);
		const bestKeyPredicate = (sel) => predicate(sel) && keyCallback(sel) === bestKey;
		const hasBestKeyPredicate = (item) => item.ast.list.some(bestKeyPredicate);
		const { matches, rest } = partition1(items, hasBestKeyPredicate);
		let oneSimpleSelector = null;
		for (const item of matches) {
			const splicedNode = spliceSimpleSelector(item, bestKeyPredicate);
			if (!oneSimpleSelector) oneSimpleSelector = splicedNode;
		}
		if (oneSimpleSelector == null) throw new Error("No simple selector is found.");
		groups[bestKey] = {
			oneSimpleSelector,
			items: matches
		};
		items = rest;
	}
	return groups;
}
function spliceSimpleSelector(item, predicate) {
	const simpsels = item.ast.list;
	const matches = new Array(simpsels.length);
	let firstIndex = -1;
	for (let i = simpsels.length; i-- > 0;) if (predicate(simpsels[i])) {
		matches[i] = true;
		firstIndex = i;
	}
	if (firstIndex == -1) throw new Error(`Couldn't find the required simple selector.`);
	const result = simpsels[firstIndex];
	item.ast.list = simpsels.filter((sel, i) => !matches[i]);
	return result;
}
function findTopKey(items, predicate, keyCallback) {
	const candidates = {};
	for (const item of items) {
		const candidates1 = {};
		for (const node of item.ast.list.filter(predicate)) candidates1[keyCallback(node)] = true;
		for (const key of Object.keys(candidates1)) if (candidates[key]) candidates[key]++;
		else candidates[key] = 1;
	}
	let topKind = "";
	let topCounter = 0;
	for (const entry of Object.entries(candidates)) if (entry[1] > topCounter) {
		topKind = entry[0];
		topCounter = entry[1];
	}
	return topKind;
}
function partition(src, predicate) {
	const matches = [];
	const rest = [];
	for (const x of src) if (predicate(x)) matches.push(x);
	else rest.push(x);
	return {
		matches,
		rest
	};
}
function partition1(src, predicate) {
	const matches = [];
	const rest = [];
	for (const x of src) if (predicate(x)) matches.push(x);
	else rest.push(x);
	return {
		matches,
		rest
	};
}
var Picker = class {
	constructor(f) {
		this.f = f;
	}
	pickAll(el) {
		return this.f(el);
	}
	pick1(el, preferFirst = false) {
		const results = this.f(el);
		const len = results.length;
		if (len === 0) return null;
		if (len === 1) return results[0].value;
		const comparator = preferFirst ? comparatorPreferFirst : comparatorPreferLast;
		let result = results[0];
		for (let i = 1; i < len; i++) {
			const next = results[i];
			if (comparator(result, next)) result = next;
		}
		return result.value;
	}
};
function comparatorPreferFirst(acc, next) {
	const diff = compareSpecificity(next.specificity, acc.specificity);
	return diff > 0 || diff === 0 && next.index < acc.index;
}
function comparatorPreferLast(acc, next) {
	const diff = compareSpecificity(next.specificity, acc.specificity);
	return diff > 0 || diff === 0 && next.index > acc.index;
}
//#endregion
//#region node_modules/.pnpm/@selderee+plugin-htmlparser2@0.11.0/node_modules/@selderee/plugin-htmlparser2/lib/hp2-builder.mjs
function hp2Builder(nodes) {
	return new Picker(handleArray(nodes));
}
function handleArray(nodes) {
	const matchers = nodes.map(handleNode);
	return (el, ...tail) => matchers.flatMap((m) => m(el, ...tail));
}
function handleNode(node) {
	switch (node.type) {
		case "terminal": {
			const result = [node.valueContainer];
			return (el, ...tail) => result;
		}
		case "tagName": return handleTagName(node);
		case "attrValue": return handleAttrValueName(node);
		case "attrPresence": return handleAttrPresenceName(node);
		case "pushElement": return handlePushElementNode(node);
		case "popElement": return handlePopElementNode(node);
	}
}
function handleTagName(node) {
	const variants = {};
	for (const variant of node.variants) variants[variant.value] = handleArray(variant.cont);
	return (el, ...tail) => {
		const continuation = variants[el.name];
		return continuation ? continuation(el, ...tail) : [];
	};
}
function handleAttrPresenceName(node) {
	const attrName = node.name;
	const continuation = handleArray(node.cont);
	return (el, ...tail) => Object.prototype.hasOwnProperty.call(el.attribs, attrName) ? continuation(el, ...tail) : [];
}
function handleAttrValueName(node) {
	const callbacks = [];
	for (const matcher of node.matchers) {
		const predicate = matcher.predicate;
		const continuation = handleArray(matcher.cont);
		callbacks.push((attr, el, ...tail) => predicate(attr) ? continuation(el, ...tail) : []);
	}
	const attrName = node.name;
	return (el, ...tail) => {
		const attr = el.attribs[attrName];
		return attr || attr === "" ? callbacks.flatMap((cb) => cb(attr, el, ...tail)) : [];
	};
}
function handlePushElementNode(node) {
	const continuation = handleArray(node.cont);
	const leftElementGetter = node.combinator === "+" ? getPrecedingElement : getParentElement;
	return (el, ...tail) => {
		const next = leftElementGetter(el);
		if (next === null) return [];
		return continuation(next, el, ...tail);
	};
}
var getPrecedingElement = (el) => {
	const prev = el.prev;
	if (prev === null) return null;
	return isTag(prev) ? prev : getPrecedingElement(prev);
};
var getParentElement = (el) => {
	const parent = el.parent;
	return parent && isTag(parent) ? parent : null;
};
function handlePopElementNode(node) {
	const continuation = handleArray(node.cont);
	return (el, next, ...tail) => continuation(next, ...tail);
}
//#endregion
//#region node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/generated/decode-data-html.js
var decode_data_html_default = new Uint16Array("ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻\"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻\xA0ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌".split("").map((c) => c.charCodeAt(0)));
//#endregion
//#region node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/generated/decode-data-xml.js
var decode_data_xml_default = new Uint16Array("Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map((c) => c.charCodeAt(0)));
//#endregion
//#region node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/decode_codepoint.js
var _a;
var decodeMap = /* @__PURE__ */ new Map([
	[0, 65533],
	[128, 8364],
	[130, 8218],
	[131, 402],
	[132, 8222],
	[133, 8230],
	[134, 8224],
	[135, 8225],
	[136, 710],
	[137, 8240],
	[138, 352],
	[139, 8249],
	[140, 338],
	[142, 381],
	[145, 8216],
	[146, 8217],
	[147, 8220],
	[148, 8221],
	[149, 8226],
	[150, 8211],
	[151, 8212],
	[152, 732],
	[153, 8482],
	[154, 353],
	[155, 8250],
	[156, 339],
	[158, 382],
	[159, 376]
]);
/**
* Polyfill for `String.fromCodePoint`. It is used to create a string from a Unicode code point.
*/
var fromCodePoint = (_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : function(codePoint) {
	let output = "";
	if (codePoint > 65535) {
		codePoint -= 65536;
		output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
		codePoint = 56320 | codePoint & 1023;
	}
	output += String.fromCharCode(codePoint);
	return output;
};
/**
* Replace the given code point with a replacement character if it is a
* surrogate or is outside the valid range. Otherwise return the code
* point unchanged.
*/
function replaceCodePoint(codePoint) {
	var _a;
	if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) return 65533;
	return (_a = decodeMap.get(codePoint)) !== null && _a !== void 0 ? _a : codePoint;
}
//#endregion
//#region node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/decode.js
var CharCodes$1;
(function(CharCodes) {
	CharCodes[CharCodes["NUM"] = 35] = "NUM";
	CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
	CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
	CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
	CharCodes[CharCodes["NINE"] = 57] = "NINE";
	CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
	CharCodes[CharCodes["LOWER_F"] = 102] = "LOWER_F";
	CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
	CharCodes[CharCodes["LOWER_Z"] = 122] = "LOWER_Z";
	CharCodes[CharCodes["UPPER_A"] = 65] = "UPPER_A";
	CharCodes[CharCodes["UPPER_F"] = 70] = "UPPER_F";
	CharCodes[CharCodes["UPPER_Z"] = 90] = "UPPER_Z";
})(CharCodes$1 || (CharCodes$1 = {}));
/** Bit that needs to be set to convert an upper case ASCII character to lower case */
var TO_LOWER_BIT = 32;
var BinTrieFlags;
(function(BinTrieFlags) {
	BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
	BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
	BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
})(BinTrieFlags || (BinTrieFlags = {}));
function isNumber$1(code) {
	return code >= CharCodes$1.ZERO && code <= CharCodes$1.NINE;
}
function isHexadecimalCharacter(code) {
	return code >= CharCodes$1.UPPER_A && code <= CharCodes$1.UPPER_F || code >= CharCodes$1.LOWER_A && code <= CharCodes$1.LOWER_F;
}
function isAsciiAlphaNumeric(code) {
	return code >= CharCodes$1.UPPER_A && code <= CharCodes$1.UPPER_Z || code >= CharCodes$1.LOWER_A && code <= CharCodes$1.LOWER_Z || isNumber$1(code);
}
/**
* Checks if the given character is a valid end character for an entity in an attribute.
*
* Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
* See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
*/
function isEntityInAttributeInvalidEnd(code) {
	return code === CharCodes$1.EQUALS || isAsciiAlphaNumeric(code);
}
var EntityDecoderState;
(function(EntityDecoderState) {
	EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
	EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
	EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
	EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
	EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function(DecodingMode) {
	/** Entities in text nodes that can end with any character. */
	DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
	/** Only allow entities terminated with a semicolon. */
	DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
	/** Entities in attributes have limitations on ending characters. */
	DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));
/**
* Token decoder with support of writing partial entities.
*/
var EntityDecoder = class {
	constructor(decodeTree, emitCodePoint, errors) {
		this.decodeTree = decodeTree;
		this.emitCodePoint = emitCodePoint;
		this.errors = errors;
		/** The current state of the decoder. */
		this.state = EntityDecoderState.EntityStart;
		/** Characters that were consumed while parsing an entity. */
		this.consumed = 1;
		/**
		* The result of the entity.
		*
		* Either the result index of a numeric entity, or the codepoint of a
		* numeric entity.
		*/
		this.result = 0;
		/** The current index in the decode tree. */
		this.treeIndex = 0;
		/** The number of characters that were consumed in excess. */
		this.excess = 1;
		/** The mode in which the decoder is operating. */
		this.decodeMode = DecodingMode.Strict;
	}
	/** Resets the instance to make it reusable. */
	startEntity(decodeMode) {
		this.decodeMode = decodeMode;
		this.state = EntityDecoderState.EntityStart;
		this.result = 0;
		this.treeIndex = 0;
		this.excess = 1;
		this.consumed = 1;
	}
	/**
	* Write an entity to the decoder. This can be called multiple times with partial entities.
	* If the entity is incomplete, the decoder will return -1.
	*
	* Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
	* entity is incomplete, and resume when the next string is written.
	*
	* @param string The string containing the entity (or a continuation of the entity).
	* @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
	* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
	*/
	write(str, offset) {
		switch (this.state) {
			case EntityDecoderState.EntityStart:
				if (str.charCodeAt(offset) === CharCodes$1.NUM) {
					this.state = EntityDecoderState.NumericStart;
					this.consumed += 1;
					return this.stateNumericStart(str, offset + 1);
				}
				this.state = EntityDecoderState.NamedEntity;
				return this.stateNamedEntity(str, offset);
			case EntityDecoderState.NumericStart: return this.stateNumericStart(str, offset);
			case EntityDecoderState.NumericDecimal: return this.stateNumericDecimal(str, offset);
			case EntityDecoderState.NumericHex: return this.stateNumericHex(str, offset);
			case EntityDecoderState.NamedEntity: return this.stateNamedEntity(str, offset);
		}
	}
	/**
	* Switches between the numeric decimal and hexadecimal states.
	*
	* Equivalent to the `Numeric character reference state` in the HTML spec.
	*
	* @param str The string containing the entity (or a continuation of the entity).
	* @param offset The current offset.
	* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
	*/
	stateNumericStart(str, offset) {
		if (offset >= str.length) return -1;
		if ((str.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes$1.LOWER_X) {
			this.state = EntityDecoderState.NumericHex;
			this.consumed += 1;
			return this.stateNumericHex(str, offset + 1);
		}
		this.state = EntityDecoderState.NumericDecimal;
		return this.stateNumericDecimal(str, offset);
	}
	addToNumericResult(str, start, end, base) {
		if (start !== end) {
			const digitCount = end - start;
			this.result = this.result * Math.pow(base, digitCount) + parseInt(str.substr(start, digitCount), base);
			this.consumed += digitCount;
		}
	}
	/**
	* Parses a hexadecimal numeric entity.
	*
	* Equivalent to the `Hexademical character reference state` in the HTML spec.
	*
	* @param str The string containing the entity (or a continuation of the entity).
	* @param offset The current offset.
	* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
	*/
	stateNumericHex(str, offset) {
		const startIdx = offset;
		while (offset < str.length) {
			const char = str.charCodeAt(offset);
			if (isNumber$1(char) || isHexadecimalCharacter(char)) offset += 1;
			else {
				this.addToNumericResult(str, startIdx, offset, 16);
				return this.emitNumericEntity(char, 3);
			}
		}
		this.addToNumericResult(str, startIdx, offset, 16);
		return -1;
	}
	/**
	* Parses a decimal numeric entity.
	*
	* Equivalent to the `Decimal character reference state` in the HTML spec.
	*
	* @param str The string containing the entity (or a continuation of the entity).
	* @param offset The current offset.
	* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
	*/
	stateNumericDecimal(str, offset) {
		const startIdx = offset;
		while (offset < str.length) {
			const char = str.charCodeAt(offset);
			if (isNumber$1(char)) offset += 1;
			else {
				this.addToNumericResult(str, startIdx, offset, 10);
				return this.emitNumericEntity(char, 2);
			}
		}
		this.addToNumericResult(str, startIdx, offset, 10);
		return -1;
	}
	/**
	* Validate and emit a numeric entity.
	*
	* Implements the logic from the `Hexademical character reference start
	* state` and `Numeric character reference end state` in the HTML spec.
	*
	* @param lastCp The last code point of the entity. Used to see if the
	*               entity was terminated with a semicolon.
	* @param expectedLength The minimum number of characters that should be
	*                       consumed. Used to validate that at least one digit
	*                       was consumed.
	* @returns The number of characters that were consumed.
	*/
	emitNumericEntity(lastCp, expectedLength) {
		var _a;
		if (this.consumed <= expectedLength) {
			(_a = this.errors) === null || _a === void 0 || _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
			return 0;
		}
		if (lastCp === CharCodes$1.SEMI) this.consumed += 1;
		else if (this.decodeMode === DecodingMode.Strict) return 0;
		this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
		if (this.errors) {
			if (lastCp !== CharCodes$1.SEMI) this.errors.missingSemicolonAfterCharacterReference();
			this.errors.validateNumericCharacterReference(this.result);
		}
		return this.consumed;
	}
	/**
	* Parses a named entity.
	*
	* Equivalent to the `Named character reference state` in the HTML spec.
	*
	* @param str The string containing the entity (or a continuation of the entity).
	* @param offset The current offset.
	* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
	*/
	stateNamedEntity(str, offset) {
		const { decodeTree } = this;
		let current = decodeTree[this.treeIndex];
		let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
		for (; offset < str.length; offset++, this.excess++) {
			const char = str.charCodeAt(offset);
			this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
			if (this.treeIndex < 0) return this.result === 0 || this.decodeMode === DecodingMode.Attribute && (valueLength === 0 || isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
			current = decodeTree[this.treeIndex];
			valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
			if (valueLength !== 0) {
				if (char === CharCodes$1.SEMI) return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
				if (this.decodeMode !== DecodingMode.Strict) {
					this.result = this.treeIndex;
					this.consumed += this.excess;
					this.excess = 0;
				}
			}
		}
		return -1;
	}
	/**
	* Emit a named entity that was not terminated with a semicolon.
	*
	* @returns The number of characters consumed.
	*/
	emitNotTerminatedNamedEntity() {
		var _a;
		const { result, decodeTree } = this;
		const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
		this.emitNamedEntityData(result, valueLength, this.consumed);
		(_a = this.errors) === null || _a === void 0 || _a.missingSemicolonAfterCharacterReference();
		return this.consumed;
	}
	/**
	* Emit a named entity.
	*
	* @param result The index of the entity in the decode tree.
	* @param valueLength The number of bytes in the entity.
	* @param consumed The number of characters consumed.
	*
	* @returns The number of characters consumed.
	*/
	emitNamedEntityData(result, valueLength, consumed) {
		const { decodeTree } = this;
		this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~BinTrieFlags.VALUE_LENGTH : decodeTree[result + 1], consumed);
		if (valueLength === 3) this.emitCodePoint(decodeTree[result + 2], consumed);
		return consumed;
	}
	/**
	* Signal to the parser that the end of the input was reached.
	*
	* Remaining data will be emitted and relevant errors will be produced.
	*
	* @returns The number of characters consumed.
	*/
	end() {
		var _a;
		switch (this.state) {
			case EntityDecoderState.NamedEntity: return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
			case EntityDecoderState.NumericDecimal: return this.emitNumericEntity(0, 2);
			case EntityDecoderState.NumericHex: return this.emitNumericEntity(0, 3);
			case EntityDecoderState.NumericStart:
				(_a = this.errors) === null || _a === void 0 || _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
				return 0;
			case EntityDecoderState.EntityStart: return 0;
		}
	}
};
/**
* Creates a function that decodes entities in a string.
*
* @param decodeTree The decode tree.
* @returns A function that decodes entities in a string.
*/
function getDecoder(decodeTree) {
	let ret = "";
	const decoder = new EntityDecoder(decodeTree, (str) => ret += fromCodePoint(str));
	return function decodeWithTrie(str, decodeMode) {
		let lastIndex = 0;
		let offset = 0;
		while ((offset = str.indexOf("&", offset)) >= 0) {
			ret += str.slice(lastIndex, offset);
			decoder.startEntity(decodeMode);
			const len = decoder.write(str, offset + 1);
			if (len < 0) {
				lastIndex = offset + decoder.end();
				break;
			}
			lastIndex = offset + len;
			offset = len === 0 ? lastIndex + 1 : lastIndex;
		}
		const result = ret + str.slice(lastIndex);
		ret = "";
		return result;
	};
}
/**
* Determines the branch of the current node that is taken given the current
* character. This function is used to traverse the trie.
*
* @param decodeTree The trie.
* @param current The current node.
* @param nodeIdx The index right after the current node and its value.
* @param char The current character.
* @returns The index of the next node, or -1 if no branch is taken.
*/
function determineBranch(decodeTree, current, nodeIdx, char) {
	const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
	const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
	if (branchCount === 0) return jumpOffset !== 0 && char === jumpOffset ? nodeIdx : -1;
	if (jumpOffset) {
		const value = char - jumpOffset;
		return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIdx + value] - 1;
	}
	let lo = nodeIdx;
	let hi = lo + branchCount - 1;
	while (lo <= hi) {
		const mid = lo + hi >>> 1;
		const midVal = decodeTree[mid];
		if (midVal < char) lo = mid + 1;
		else if (midVal > char) hi = mid - 1;
		else return decodeTree[mid + branchCount];
	}
	return -1;
}
var htmlDecoder = getDecoder(decode_data_html_default);
getDecoder(decode_data_xml_default);
/**
* Decodes an HTML string.
*
* @param str The string to decode.
* @param mode The decoding mode.
* @returns The decoded string.
*/
function decodeHTML(str, mode = DecodingMode.Legacy) {
	return htmlDecoder(str, mode);
}
/**
* Decodes an HTML string in an attribute.
*
* @param str The string to decode.
* @returns The decoded string.
*/
function decodeHTMLAttribute(str) {
	return htmlDecoder(str, DecodingMode.Attribute);
}
//#endregion
//#region node_modules/.pnpm/htmlparser2@8.0.2/node_modules/htmlparser2/lib/esm/Tokenizer.js
var CharCodes;
(function(CharCodes) {
	CharCodes[CharCodes["Tab"] = 9] = "Tab";
	CharCodes[CharCodes["NewLine"] = 10] = "NewLine";
	CharCodes[CharCodes["FormFeed"] = 12] = "FormFeed";
	CharCodes[CharCodes["CarriageReturn"] = 13] = "CarriageReturn";
	CharCodes[CharCodes["Space"] = 32] = "Space";
	CharCodes[CharCodes["ExclamationMark"] = 33] = "ExclamationMark";
	CharCodes[CharCodes["Number"] = 35] = "Number";
	CharCodes[CharCodes["Amp"] = 38] = "Amp";
	CharCodes[CharCodes["SingleQuote"] = 39] = "SingleQuote";
	CharCodes[CharCodes["DoubleQuote"] = 34] = "DoubleQuote";
	CharCodes[CharCodes["Dash"] = 45] = "Dash";
	CharCodes[CharCodes["Slash"] = 47] = "Slash";
	CharCodes[CharCodes["Zero"] = 48] = "Zero";
	CharCodes[CharCodes["Nine"] = 57] = "Nine";
	CharCodes[CharCodes["Semi"] = 59] = "Semi";
	CharCodes[CharCodes["Lt"] = 60] = "Lt";
	CharCodes[CharCodes["Eq"] = 61] = "Eq";
	CharCodes[CharCodes["Gt"] = 62] = "Gt";
	CharCodes[CharCodes["Questionmark"] = 63] = "Questionmark";
	CharCodes[CharCodes["UpperA"] = 65] = "UpperA";
	CharCodes[CharCodes["LowerA"] = 97] = "LowerA";
	CharCodes[CharCodes["UpperF"] = 70] = "UpperF";
	CharCodes[CharCodes["LowerF"] = 102] = "LowerF";
	CharCodes[CharCodes["UpperZ"] = 90] = "UpperZ";
	CharCodes[CharCodes["LowerZ"] = 122] = "LowerZ";
	CharCodes[CharCodes["LowerX"] = 120] = "LowerX";
	CharCodes[CharCodes["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
})(CharCodes || (CharCodes = {}));
/** All the states the tokenizer can be in. */
var State;
(function(State) {
	State[State["Text"] = 1] = "Text";
	State[State["BeforeTagName"] = 2] = "BeforeTagName";
	State[State["InTagName"] = 3] = "InTagName";
	State[State["InSelfClosingTag"] = 4] = "InSelfClosingTag";
	State[State["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
	State[State["InClosingTagName"] = 6] = "InClosingTagName";
	State[State["AfterClosingTagName"] = 7] = "AfterClosingTagName";
	State[State["BeforeAttributeName"] = 8] = "BeforeAttributeName";
	State[State["InAttributeName"] = 9] = "InAttributeName";
	State[State["AfterAttributeName"] = 10] = "AfterAttributeName";
	State[State["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
	State[State["InAttributeValueDq"] = 12] = "InAttributeValueDq";
	State[State["InAttributeValueSq"] = 13] = "InAttributeValueSq";
	State[State["InAttributeValueNq"] = 14] = "InAttributeValueNq";
	State[State["BeforeDeclaration"] = 15] = "BeforeDeclaration";
	State[State["InDeclaration"] = 16] = "InDeclaration";
	State[State["InProcessingInstruction"] = 17] = "InProcessingInstruction";
	State[State["BeforeComment"] = 18] = "BeforeComment";
	State[State["CDATASequence"] = 19] = "CDATASequence";
	State[State["InSpecialComment"] = 20] = "InSpecialComment";
	State[State["InCommentLike"] = 21] = "InCommentLike";
	State[State["BeforeSpecialS"] = 22] = "BeforeSpecialS";
	State[State["SpecialStartSequence"] = 23] = "SpecialStartSequence";
	State[State["InSpecialTag"] = 24] = "InSpecialTag";
	State[State["BeforeEntity"] = 25] = "BeforeEntity";
	State[State["BeforeNumericEntity"] = 26] = "BeforeNumericEntity";
	State[State["InNamedEntity"] = 27] = "InNamedEntity";
	State[State["InNumericEntity"] = 28] = "InNumericEntity";
	State[State["InHexEntity"] = 29] = "InHexEntity";
})(State || (State = {}));
function isWhitespace(c) {
	return c === CharCodes.Space || c === CharCodes.NewLine || c === CharCodes.Tab || c === CharCodes.FormFeed || c === CharCodes.CarriageReturn;
}
function isEndOfTagSection(c) {
	return c === CharCodes.Slash || c === CharCodes.Gt || isWhitespace(c);
}
function isNumber(c) {
	return c >= CharCodes.Zero && c <= CharCodes.Nine;
}
function isASCIIAlpha(c) {
	return c >= CharCodes.LowerA && c <= CharCodes.LowerZ || c >= CharCodes.UpperA && c <= CharCodes.UpperZ;
}
function isHexDigit(c) {
	return c >= CharCodes.UpperA && c <= CharCodes.UpperF || c >= CharCodes.LowerA && c <= CharCodes.LowerF;
}
var QuoteType;
(function(QuoteType) {
	QuoteType[QuoteType["NoValue"] = 0] = "NoValue";
	QuoteType[QuoteType["Unquoted"] = 1] = "Unquoted";
	QuoteType[QuoteType["Single"] = 2] = "Single";
	QuoteType[QuoteType["Double"] = 3] = "Double";
})(QuoteType || (QuoteType = {}));
/**
* Sequences used to match longer strings.
*
* We don't have `Script`, `Style`, or `Title` here. Instead, we re-use the *End
* sequences with an increased offset.
*/
var Sequences = {
	Cdata: new Uint8Array([
		67,
		68,
		65,
		84,
		65,
		91
	]),
	CdataEnd: new Uint8Array([
		93,
		93,
		62
	]),
	CommentEnd: new Uint8Array([
		45,
		45,
		62
	]),
	ScriptEnd: new Uint8Array([
		60,
		47,
		115,
		99,
		114,
		105,
		112,
		116
	]),
	StyleEnd: new Uint8Array([
		60,
		47,
		115,
		116,
		121,
		108,
		101
	]),
	TitleEnd: new Uint8Array([
		60,
		47,
		116,
		105,
		116,
		108,
		101
	])
};
var Tokenizer = class {
	constructor({ xmlMode = false, decodeEntities = true }, cbs) {
		this.cbs = cbs;
		/** The current state the tokenizer is in. */
		this.state = State.Text;
		/** The read buffer. */
		this.buffer = "";
		/** The beginning of the section that is currently being read. */
		this.sectionStart = 0;
		/** The index within the buffer that we are currently looking at. */
		this.index = 0;
		/** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */
		this.baseState = State.Text;
		/** For special parsing behavior inside of script and style tags. */
		this.isSpecial = false;
		/** Indicates whether the tokenizer has been paused. */
		this.running = true;
		/** The offset of the current buffer. */
		this.offset = 0;
		this.currentSequence = void 0;
		this.sequenceIndex = 0;
		this.trieIndex = 0;
		this.trieCurrent = 0;
		/** For named entities, the index of the value. For numeric entities, the code point. */
		this.entityResult = 0;
		this.entityExcess = 0;
		this.xmlMode = xmlMode;
		this.decodeEntities = decodeEntities;
		this.entityTrie = xmlMode ? decode_data_xml_default : decode_data_html_default;
	}
	reset() {
		this.state = State.Text;
		this.buffer = "";
		this.sectionStart = 0;
		this.index = 0;
		this.baseState = State.Text;
		this.currentSequence = void 0;
		this.running = true;
		this.offset = 0;
	}
	write(chunk) {
		this.offset += this.buffer.length;
		this.buffer = chunk;
		this.parse();
	}
	end() {
		if (this.running) this.finish();
	}
	pause() {
		this.running = false;
	}
	resume() {
		this.running = true;
		if (this.index < this.buffer.length + this.offset) this.parse();
	}
	/**
	* The current index within all of the written data.
	*/
	getIndex() {
		return this.index;
	}
	/**
	* The start of the current section.
	*/
	getSectionStart() {
		return this.sectionStart;
	}
	stateText(c) {
		if (c === CharCodes.Lt || !this.decodeEntities && this.fastForwardTo(CharCodes.Lt)) {
			if (this.index > this.sectionStart) this.cbs.ontext(this.sectionStart, this.index);
			this.state = State.BeforeTagName;
			this.sectionStart = this.index;
		} else if (this.decodeEntities && c === CharCodes.Amp) this.state = State.BeforeEntity;
	}
	stateSpecialStartSequence(c) {
		const isEnd = this.sequenceIndex === this.currentSequence.length;
		if (!(isEnd ? isEndOfTagSection(c) : (c | 32) === this.currentSequence[this.sequenceIndex])) this.isSpecial = false;
		else if (!isEnd) {
			this.sequenceIndex++;
			return;
		}
		this.sequenceIndex = 0;
		this.state = State.InTagName;
		this.stateInTagName(c);
	}
	/** Look for an end tag. For <title> tags, also decode entities. */
	stateInSpecialTag(c) {
		if (this.sequenceIndex === this.currentSequence.length) {
			if (c === CharCodes.Gt || isWhitespace(c)) {
				const endOfText = this.index - this.currentSequence.length;
				if (this.sectionStart < endOfText) {
					const actualIndex = this.index;
					this.index = endOfText;
					this.cbs.ontext(this.sectionStart, endOfText);
					this.index = actualIndex;
				}
				this.isSpecial = false;
				this.sectionStart = endOfText + 2;
				this.stateInClosingTagName(c);
				return;
			}
			this.sequenceIndex = 0;
		}
		if ((c | 32) === this.currentSequence[this.sequenceIndex]) this.sequenceIndex += 1;
		else if (this.sequenceIndex === 0) {
			if (this.currentSequence === Sequences.TitleEnd) {
				if (this.decodeEntities && c === CharCodes.Amp) this.state = State.BeforeEntity;
			} else if (this.fastForwardTo(CharCodes.Lt)) this.sequenceIndex = 1;
		} else this.sequenceIndex = Number(c === CharCodes.Lt);
	}
	stateCDATASequence(c) {
		if (c === Sequences.Cdata[this.sequenceIndex]) {
			if (++this.sequenceIndex === Sequences.Cdata.length) {
				this.state = State.InCommentLike;
				this.currentSequence = Sequences.CdataEnd;
				this.sequenceIndex = 0;
				this.sectionStart = this.index + 1;
			}
		} else {
			this.sequenceIndex = 0;
			this.state = State.InDeclaration;
			this.stateInDeclaration(c);
		}
	}
	/**
	* When we wait for one specific character, we can speed things up
	* by skipping through the buffer until we find it.
	*
	* @returns Whether the character was found.
	*/
	fastForwardTo(c) {
		while (++this.index < this.buffer.length + this.offset) if (this.buffer.charCodeAt(this.index - this.offset) === c) return true;
		this.index = this.buffer.length + this.offset - 1;
		return false;
	}
	/**
	* Comments and CDATA end with `-->` and `]]>`.
	*
	* Their common qualities are:
	* - Their end sequences have a distinct character they start with.
	* - That character is then repeated, so we have to check multiple repeats.
	* - All characters but the start character of the sequence can be skipped.
	*/
	stateInCommentLike(c) {
		if (c === this.currentSequence[this.sequenceIndex]) {
			if (++this.sequenceIndex === this.currentSequence.length) {
				if (this.currentSequence === Sequences.CdataEnd) this.cbs.oncdata(this.sectionStart, this.index, 2);
				else this.cbs.oncomment(this.sectionStart, this.index, 2);
				this.sequenceIndex = 0;
				this.sectionStart = this.index + 1;
				this.state = State.Text;
			}
		} else if (this.sequenceIndex === 0) {
			if (this.fastForwardTo(this.currentSequence[0])) this.sequenceIndex = 1;
		} else if (c !== this.currentSequence[this.sequenceIndex - 1]) this.sequenceIndex = 0;
	}
	/**
	* HTML only allows ASCII alpha characters (a-z and A-Z) at the beginning of a tag name.
	*
	* XML allows a lot more characters here (@see https://www.w3.org/TR/REC-xml/#NT-NameStartChar).
	* We allow anything that wouldn't end the tag.
	*/
	isTagStartChar(c) {
		return this.xmlMode ? !isEndOfTagSection(c) : isASCIIAlpha(c);
	}
	startSpecial(sequence, offset) {
		this.isSpecial = true;
		this.currentSequence = sequence;
		this.sequenceIndex = offset;
		this.state = State.SpecialStartSequence;
	}
	stateBeforeTagName(c) {
		if (c === CharCodes.ExclamationMark) {
			this.state = State.BeforeDeclaration;
			this.sectionStart = this.index + 1;
		} else if (c === CharCodes.Questionmark) {
			this.state = State.InProcessingInstruction;
			this.sectionStart = this.index + 1;
		} else if (this.isTagStartChar(c)) {
			const lower = c | 32;
			this.sectionStart = this.index;
			if (!this.xmlMode && lower === Sequences.TitleEnd[2]) this.startSpecial(Sequences.TitleEnd, 3);
			else this.state = !this.xmlMode && lower === Sequences.ScriptEnd[2] ? State.BeforeSpecialS : State.InTagName;
		} else if (c === CharCodes.Slash) this.state = State.BeforeClosingTagName;
		else {
			this.state = State.Text;
			this.stateText(c);
		}
	}
	stateInTagName(c) {
		if (isEndOfTagSection(c)) {
			this.cbs.onopentagname(this.sectionStart, this.index);
			this.sectionStart = -1;
			this.state = State.BeforeAttributeName;
			this.stateBeforeAttributeName(c);
		}
	}
	stateBeforeClosingTagName(c) {
		if (isWhitespace(c)) {} else if (c === CharCodes.Gt) this.state = State.Text;
		else {
			this.state = this.isTagStartChar(c) ? State.InClosingTagName : State.InSpecialComment;
			this.sectionStart = this.index;
		}
	}
	stateInClosingTagName(c) {
		if (c === CharCodes.Gt || isWhitespace(c)) {
			this.cbs.onclosetag(this.sectionStart, this.index);
			this.sectionStart = -1;
			this.state = State.AfterClosingTagName;
			this.stateAfterClosingTagName(c);
		}
	}
	stateAfterClosingTagName(c) {
		if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
			this.state = State.Text;
			this.baseState = State.Text;
			this.sectionStart = this.index + 1;
		}
	}
	stateBeforeAttributeName(c) {
		if (c === CharCodes.Gt) {
			this.cbs.onopentagend(this.index);
			if (this.isSpecial) {
				this.state = State.InSpecialTag;
				this.sequenceIndex = 0;
			} else this.state = State.Text;
			this.baseState = this.state;
			this.sectionStart = this.index + 1;
		} else if (c === CharCodes.Slash) this.state = State.InSelfClosingTag;
		else if (!isWhitespace(c)) {
			this.state = State.InAttributeName;
			this.sectionStart = this.index;
		}
	}
	stateInSelfClosingTag(c) {
		if (c === CharCodes.Gt) {
			this.cbs.onselfclosingtag(this.index);
			this.state = State.Text;
			this.baseState = State.Text;
			this.sectionStart = this.index + 1;
			this.isSpecial = false;
		} else if (!isWhitespace(c)) {
			this.state = State.BeforeAttributeName;
			this.stateBeforeAttributeName(c);
		}
	}
	stateInAttributeName(c) {
		if (c === CharCodes.Eq || isEndOfTagSection(c)) {
			this.cbs.onattribname(this.sectionStart, this.index);
			this.sectionStart = -1;
			this.state = State.AfterAttributeName;
			this.stateAfterAttributeName(c);
		}
	}
	stateAfterAttributeName(c) {
		if (c === CharCodes.Eq) this.state = State.BeforeAttributeValue;
		else if (c === CharCodes.Slash || c === CharCodes.Gt) {
			this.cbs.onattribend(QuoteType.NoValue, this.index);
			this.state = State.BeforeAttributeName;
			this.stateBeforeAttributeName(c);
		} else if (!isWhitespace(c)) {
			this.cbs.onattribend(QuoteType.NoValue, this.index);
			this.state = State.InAttributeName;
			this.sectionStart = this.index;
		}
	}
	stateBeforeAttributeValue(c) {
		if (c === CharCodes.DoubleQuote) {
			this.state = State.InAttributeValueDq;
			this.sectionStart = this.index + 1;
		} else if (c === CharCodes.SingleQuote) {
			this.state = State.InAttributeValueSq;
			this.sectionStart = this.index + 1;
		} else if (!isWhitespace(c)) {
			this.sectionStart = this.index;
			this.state = State.InAttributeValueNq;
			this.stateInAttributeValueNoQuotes(c);
		}
	}
	handleInAttributeValue(c, quote) {
		if (c === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
			this.cbs.onattribdata(this.sectionStart, this.index);
			this.sectionStart = -1;
			this.cbs.onattribend(quote === CharCodes.DoubleQuote ? QuoteType.Double : QuoteType.Single, this.index);
			this.state = State.BeforeAttributeName;
		} else if (this.decodeEntities && c === CharCodes.Amp) {
			this.baseState = this.state;
			this.state = State.BeforeEntity;
		}
	}
	stateInAttributeValueDoubleQuotes(c) {
		this.handleInAttributeValue(c, CharCodes.DoubleQuote);
	}
	stateInAttributeValueSingleQuotes(c) {
		this.handleInAttributeValue(c, CharCodes.SingleQuote);
	}
	stateInAttributeValueNoQuotes(c) {
		if (isWhitespace(c) || c === CharCodes.Gt) {
			this.cbs.onattribdata(this.sectionStart, this.index);
			this.sectionStart = -1;
			this.cbs.onattribend(QuoteType.Unquoted, this.index);
			this.state = State.BeforeAttributeName;
			this.stateBeforeAttributeName(c);
		} else if (this.decodeEntities && c === CharCodes.Amp) {
			this.baseState = this.state;
			this.state = State.BeforeEntity;
		}
	}
	stateBeforeDeclaration(c) {
		if (c === CharCodes.OpeningSquareBracket) {
			this.state = State.CDATASequence;
			this.sequenceIndex = 0;
		} else this.state = c === CharCodes.Dash ? State.BeforeComment : State.InDeclaration;
	}
	stateInDeclaration(c) {
		if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
			this.cbs.ondeclaration(this.sectionStart, this.index);
			this.state = State.Text;
			this.sectionStart = this.index + 1;
		}
	}
	stateInProcessingInstruction(c) {
		if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
			this.cbs.onprocessinginstruction(this.sectionStart, this.index);
			this.state = State.Text;
			this.sectionStart = this.index + 1;
		}
	}
	stateBeforeComment(c) {
		if (c === CharCodes.Dash) {
			this.state = State.InCommentLike;
			this.currentSequence = Sequences.CommentEnd;
			this.sequenceIndex = 2;
			this.sectionStart = this.index + 1;
		} else this.state = State.InDeclaration;
	}
	stateInSpecialComment(c) {
		if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
			this.cbs.oncomment(this.sectionStart, this.index, 0);
			this.state = State.Text;
			this.sectionStart = this.index + 1;
		}
	}
	stateBeforeSpecialS(c) {
		const lower = c | 32;
		if (lower === Sequences.ScriptEnd[3]) this.startSpecial(Sequences.ScriptEnd, 4);
		else if (lower === Sequences.StyleEnd[3]) this.startSpecial(Sequences.StyleEnd, 4);
		else {
			this.state = State.InTagName;
			this.stateInTagName(c);
		}
	}
	stateBeforeEntity(c) {
		this.entityExcess = 1;
		this.entityResult = 0;
		if (c === CharCodes.Number) this.state = State.BeforeNumericEntity;
		else if (c === CharCodes.Amp) {} else {
			this.trieIndex = 0;
			this.trieCurrent = this.entityTrie[0];
			this.state = State.InNamedEntity;
			this.stateInNamedEntity(c);
		}
	}
	stateInNamedEntity(c) {
		this.entityExcess += 1;
		this.trieIndex = determineBranch(this.entityTrie, this.trieCurrent, this.trieIndex + 1, c);
		if (this.trieIndex < 0) {
			this.emitNamedEntity();
			this.index--;
			return;
		}
		this.trieCurrent = this.entityTrie[this.trieIndex];
		const masked = this.trieCurrent & BinTrieFlags.VALUE_LENGTH;
		if (masked) {
			const valueLength = (masked >> 14) - 1;
			if (!this.allowLegacyEntity() && c !== CharCodes.Semi) this.trieIndex += valueLength;
			else {
				const entityStart = this.index - this.entityExcess + 1;
				if (entityStart > this.sectionStart) this.emitPartial(this.sectionStart, entityStart);
				this.entityResult = this.trieIndex;
				this.trieIndex += valueLength;
				this.entityExcess = 0;
				this.sectionStart = this.index + 1;
				if (valueLength === 0) this.emitNamedEntity();
			}
		}
	}
	emitNamedEntity() {
		this.state = this.baseState;
		if (this.entityResult === 0) return;
		switch ((this.entityTrie[this.entityResult] & BinTrieFlags.VALUE_LENGTH) >> 14) {
			case 1:
				this.emitCodePoint(this.entityTrie[this.entityResult] & ~BinTrieFlags.VALUE_LENGTH);
				break;
			case 2:
				this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
				break;
			case 3:
				this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
				this.emitCodePoint(this.entityTrie[this.entityResult + 2]);
		}
	}
	stateBeforeNumericEntity(c) {
		if ((c | 32) === CharCodes.LowerX) {
			this.entityExcess++;
			this.state = State.InHexEntity;
		} else {
			this.state = State.InNumericEntity;
			this.stateInNumericEntity(c);
		}
	}
	emitNumericEntity(strict) {
		const entityStart = this.index - this.entityExcess - 1;
		if (entityStart + 2 + Number(this.state === State.InHexEntity) !== this.index) {
			if (entityStart > this.sectionStart) this.emitPartial(this.sectionStart, entityStart);
			this.sectionStart = this.index + Number(strict);
			this.emitCodePoint(replaceCodePoint(this.entityResult));
		}
		this.state = this.baseState;
	}
	stateInNumericEntity(c) {
		if (c === CharCodes.Semi) this.emitNumericEntity(true);
		else if (isNumber(c)) {
			this.entityResult = this.entityResult * 10 + (c - CharCodes.Zero);
			this.entityExcess++;
		} else {
			if (this.allowLegacyEntity()) this.emitNumericEntity(false);
			else this.state = this.baseState;
			this.index--;
		}
	}
	stateInHexEntity(c) {
		if (c === CharCodes.Semi) this.emitNumericEntity(true);
		else if (isNumber(c)) {
			this.entityResult = this.entityResult * 16 + (c - CharCodes.Zero);
			this.entityExcess++;
		} else if (isHexDigit(c)) {
			this.entityResult = this.entityResult * 16 + ((c | 32) - CharCodes.LowerA + 10);
			this.entityExcess++;
		} else {
			if (this.allowLegacyEntity()) this.emitNumericEntity(false);
			else this.state = this.baseState;
			this.index--;
		}
	}
	allowLegacyEntity() {
		return !this.xmlMode && (this.baseState === State.Text || this.baseState === State.InSpecialTag);
	}
	/**
	* Remove data that has already been consumed from the buffer.
	*/
	cleanup() {
		if (this.running && this.sectionStart !== this.index) {
			if (this.state === State.Text || this.state === State.InSpecialTag && this.sequenceIndex === 0) {
				this.cbs.ontext(this.sectionStart, this.index);
				this.sectionStart = this.index;
			} else if (this.state === State.InAttributeValueDq || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueNq) {
				this.cbs.onattribdata(this.sectionStart, this.index);
				this.sectionStart = this.index;
			}
		}
	}
	shouldContinue() {
		return this.index < this.buffer.length + this.offset && this.running;
	}
	/**
	* Iterates through the buffer, calling the function corresponding to the current state.
	*
	* States that are more likely to be hit are higher up, as a performance improvement.
	*/
	parse() {
		while (this.shouldContinue()) {
			const c = this.buffer.charCodeAt(this.index - this.offset);
			switch (this.state) {
				case State.Text:
					this.stateText(c);
					break;
				case State.SpecialStartSequence:
					this.stateSpecialStartSequence(c);
					break;
				case State.InSpecialTag:
					this.stateInSpecialTag(c);
					break;
				case State.CDATASequence:
					this.stateCDATASequence(c);
					break;
				case State.InAttributeValueDq:
					this.stateInAttributeValueDoubleQuotes(c);
					break;
				case State.InAttributeName:
					this.stateInAttributeName(c);
					break;
				case State.InCommentLike:
					this.stateInCommentLike(c);
					break;
				case State.InSpecialComment:
					this.stateInSpecialComment(c);
					break;
				case State.BeforeAttributeName:
					this.stateBeforeAttributeName(c);
					break;
				case State.InTagName:
					this.stateInTagName(c);
					break;
				case State.InClosingTagName:
					this.stateInClosingTagName(c);
					break;
				case State.BeforeTagName:
					this.stateBeforeTagName(c);
					break;
				case State.AfterAttributeName:
					this.stateAfterAttributeName(c);
					break;
				case State.InAttributeValueSq:
					this.stateInAttributeValueSingleQuotes(c);
					break;
				case State.BeforeAttributeValue:
					this.stateBeforeAttributeValue(c);
					break;
				case State.BeforeClosingTagName:
					this.stateBeforeClosingTagName(c);
					break;
				case State.AfterClosingTagName:
					this.stateAfterClosingTagName(c);
					break;
				case State.BeforeSpecialS:
					this.stateBeforeSpecialS(c);
					break;
				case State.InAttributeValueNq:
					this.stateInAttributeValueNoQuotes(c);
					break;
				case State.InSelfClosingTag:
					this.stateInSelfClosingTag(c);
					break;
				case State.InDeclaration:
					this.stateInDeclaration(c);
					break;
				case State.BeforeDeclaration:
					this.stateBeforeDeclaration(c);
					break;
				case State.BeforeComment:
					this.stateBeforeComment(c);
					break;
				case State.InProcessingInstruction:
					this.stateInProcessingInstruction(c);
					break;
				case State.InNamedEntity:
					this.stateInNamedEntity(c);
					break;
				case State.BeforeEntity:
					this.stateBeforeEntity(c);
					break;
				case State.InHexEntity:
					this.stateInHexEntity(c);
					break;
				case State.InNumericEntity:
					this.stateInNumericEntity(c);
					break;
				default: this.stateBeforeNumericEntity(c);
			}
			this.index++;
		}
		this.cleanup();
	}
	finish() {
		if (this.state === State.InNamedEntity) this.emitNamedEntity();
		if (this.sectionStart < this.index) this.handleTrailingData();
		this.cbs.onend();
	}
	/** Handle any trailing data. */
	handleTrailingData() {
		const endIndex = this.buffer.length + this.offset;
		if (this.state === State.InCommentLike) {
			if (this.currentSequence === Sequences.CdataEnd) this.cbs.oncdata(this.sectionStart, endIndex, 0);
			else this.cbs.oncomment(this.sectionStart, endIndex, 0);
		} else if (this.state === State.InNumericEntity && this.allowLegacyEntity()) this.emitNumericEntity(false);
		else if (this.state === State.InHexEntity && this.allowLegacyEntity()) this.emitNumericEntity(false);
		else if (this.state === State.InTagName || this.state === State.BeforeAttributeName || this.state === State.BeforeAttributeValue || this.state === State.AfterAttributeName || this.state === State.InAttributeName || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueDq || this.state === State.InAttributeValueNq || this.state === State.InClosingTagName) {} else this.cbs.ontext(this.sectionStart, endIndex);
	}
	emitPartial(start, endIndex) {
		if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) this.cbs.onattribdata(start, endIndex);
		else this.cbs.ontext(start, endIndex);
	}
	emitCodePoint(cp) {
		if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) this.cbs.onattribentity(cp);
		else this.cbs.ontextentity(cp);
	}
};
//#endregion
//#region node_modules/.pnpm/htmlparser2@8.0.2/node_modules/htmlparser2/lib/esm/Parser.js
var formTags = /* @__PURE__ */ new Set([
	"input",
	"option",
	"optgroup",
	"select",
	"button",
	"datalist",
	"textarea"
]);
var pTag = /* @__PURE__ */ new Set(["p"]);
var tableSectionTags = /* @__PURE__ */ new Set(["thead", "tbody"]);
var ddtTags = /* @__PURE__ */ new Set(["dd", "dt"]);
var rtpTags = /* @__PURE__ */ new Set(["rt", "rp"]);
var openImpliesClose = /* @__PURE__ */ new Map([
	["tr", /* @__PURE__ */ new Set([
		"tr",
		"th",
		"td"
	])],
	["th", /* @__PURE__ */ new Set(["th"])],
	["td", /* @__PURE__ */ new Set([
		"thead",
		"th",
		"td"
	])],
	["body", /* @__PURE__ */ new Set([
		"head",
		"link",
		"script"
	])],
	["li", /* @__PURE__ */ new Set(["li"])],
	["p", pTag],
	["h1", pTag],
	["h2", pTag],
	["h3", pTag],
	["h4", pTag],
	["h5", pTag],
	["h6", pTag],
	["select", formTags],
	["input", formTags],
	["output", formTags],
	["button", formTags],
	["datalist", formTags],
	["textarea", formTags],
	["option", /* @__PURE__ */ new Set(["option"])],
	["optgroup", /* @__PURE__ */ new Set(["optgroup", "option"])],
	["dd", ddtTags],
	["dt", ddtTags],
	["address", pTag],
	["article", pTag],
	["aside", pTag],
	["blockquote", pTag],
	["details", pTag],
	["div", pTag],
	["dl", pTag],
	["fieldset", pTag],
	["figcaption", pTag],
	["figure", pTag],
	["footer", pTag],
	["form", pTag],
	["header", pTag],
	["hr", pTag],
	["main", pTag],
	["nav", pTag],
	["ol", pTag],
	["pre", pTag],
	["section", pTag],
	["table", pTag],
	["ul", pTag],
	["rt", rtpTags],
	["rp", rtpTags],
	["tbody", tableSectionTags],
	["tfoot", tableSectionTags]
]);
var voidElements = /* @__PURE__ */ new Set([
	"area",
	"base",
	"basefont",
	"br",
	"col",
	"command",
	"embed",
	"frame",
	"hr",
	"img",
	"input",
	"isindex",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
]);
var foreignContextElements = /* @__PURE__ */ new Set(["math", "svg"]);
var htmlIntegrationElements = /* @__PURE__ */ new Set([
	"mi",
	"mo",
	"mn",
	"ms",
	"mtext",
	"annotation-xml",
	"foreignobject",
	"desc",
	"title"
]);
var reNameEnd = /\s|\//;
var Parser = class {
	constructor(cbs, options = {}) {
		var _a, _b, _c, _d, _e;
		this.options = options;
		/** The start index of the last event. */
		this.startIndex = 0;
		/** The end index of the last event. */
		this.endIndex = 0;
		/**
		* Store the start index of the current open tag,
		* so we can update the start index for attributes.
		*/
		this.openTagStart = 0;
		this.tagname = "";
		this.attribname = "";
		this.attribvalue = "";
		this.attribs = null;
		this.stack = [];
		this.foreignContext = [];
		this.buffers = [];
		this.bufferOffset = 0;
		/** The index of the last written buffer. Used when resuming after a `pause()`. */
		this.writeIndex = 0;
		/** Indicates whether the parser has finished running / `.end` has been called. */
		this.ended = false;
		this.cbs = cbs !== null && cbs !== void 0 ? cbs : {};
		this.lowerCaseTagNames = (_a = options.lowerCaseTags) !== null && _a !== void 0 ? _a : !options.xmlMode;
		this.lowerCaseAttributeNames = (_b = options.lowerCaseAttributeNames) !== null && _b !== void 0 ? _b : !options.xmlMode;
		this.tokenizer = new ((_c = options.Tokenizer) !== null && _c !== void 0 ? _c : Tokenizer)(this.options, this);
		(_e = (_d = this.cbs).onparserinit) === null || _e === void 0 || _e.call(_d, this);
	}
	/** @internal */
	ontext(start, endIndex) {
		var _a, _b;
		const data = this.getSlice(start, endIndex);
		this.endIndex = endIndex - 1;
		(_b = (_a = this.cbs).ontext) === null || _b === void 0 || _b.call(_a, data);
		this.startIndex = endIndex;
	}
	/** @internal */
	ontextentity(cp) {
		var _a, _b;
		const index = this.tokenizer.getSectionStart();
		this.endIndex = index - 1;
		(_b = (_a = this.cbs).ontext) === null || _b === void 0 || _b.call(_a, fromCodePoint(cp));
		this.startIndex = index;
	}
	isVoidElement(name) {
		return !this.options.xmlMode && voidElements.has(name);
	}
	/** @internal */
	onopentagname(start, endIndex) {
		this.endIndex = endIndex;
		let name = this.getSlice(start, endIndex);
		if (this.lowerCaseTagNames) name = name.toLowerCase();
		this.emitOpenTag(name);
	}
	emitOpenTag(name) {
		var _a, _b, _c, _d;
		this.openTagStart = this.startIndex;
		this.tagname = name;
		const impliesClose = !this.options.xmlMode && openImpliesClose.get(name);
		if (impliesClose) while (this.stack.length > 0 && impliesClose.has(this.stack[this.stack.length - 1])) {
			const element = this.stack.pop();
			(_b = (_a = this.cbs).onclosetag) === null || _b === void 0 || _b.call(_a, element, true);
		}
		if (!this.isVoidElement(name)) {
			this.stack.push(name);
			if (foreignContextElements.has(name)) this.foreignContext.push(true);
			else if (htmlIntegrationElements.has(name)) this.foreignContext.push(false);
		}
		(_d = (_c = this.cbs).onopentagname) === null || _d === void 0 || _d.call(_c, name);
		if (this.cbs.onopentag) this.attribs = {};
	}
	endOpenTag(isImplied) {
		var _a, _b;
		this.startIndex = this.openTagStart;
		if (this.attribs) {
			(_b = (_a = this.cbs).onopentag) === null || _b === void 0 || _b.call(_a, this.tagname, this.attribs, isImplied);
			this.attribs = null;
		}
		if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) this.cbs.onclosetag(this.tagname, true);
		this.tagname = "";
	}
	/** @internal */
	onopentagend(endIndex) {
		this.endIndex = endIndex;
		this.endOpenTag(false);
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	onclosetag(start, endIndex) {
		var _a, _b, _c, _d, _e, _f;
		this.endIndex = endIndex;
		let name = this.getSlice(start, endIndex);
		if (this.lowerCaseTagNames) name = name.toLowerCase();
		if (foreignContextElements.has(name) || htmlIntegrationElements.has(name)) this.foreignContext.pop();
		if (!this.isVoidElement(name)) {
			const pos = this.stack.lastIndexOf(name);
			if (pos !== -1) {
				if (this.cbs.onclosetag) {
					let count = this.stack.length - pos;
					while (count--) this.cbs.onclosetag(this.stack.pop(), count !== 0);
				} else this.stack.length = pos;
			} else if (!this.options.xmlMode && name === "p") {
				this.emitOpenTag("p");
				this.closeCurrentTag(true);
			}
		} else if (!this.options.xmlMode && name === "br") {
			(_b = (_a = this.cbs).onopentagname) === null || _b === void 0 || _b.call(_a, "br");
			(_d = (_c = this.cbs).onopentag) === null || _d === void 0 || _d.call(_c, "br", {}, true);
			(_f = (_e = this.cbs).onclosetag) === null || _f === void 0 || _f.call(_e, "br", false);
		}
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	onselfclosingtag(endIndex) {
		this.endIndex = endIndex;
		if (this.options.xmlMode || this.options.recognizeSelfClosing || this.foreignContext[this.foreignContext.length - 1]) {
			this.closeCurrentTag(false);
			this.startIndex = endIndex + 1;
		} else this.onopentagend(endIndex);
	}
	closeCurrentTag(isOpenImplied) {
		var _a, _b;
		const name = this.tagname;
		this.endOpenTag(isOpenImplied);
		if (this.stack[this.stack.length - 1] === name) {
			(_b = (_a = this.cbs).onclosetag) === null || _b === void 0 || _b.call(_a, name, !isOpenImplied);
			this.stack.pop();
		}
	}
	/** @internal */
	onattribname(start, endIndex) {
		this.startIndex = start;
		const name = this.getSlice(start, endIndex);
		this.attribname = this.lowerCaseAttributeNames ? name.toLowerCase() : name;
	}
	/** @internal */
	onattribdata(start, endIndex) {
		this.attribvalue += this.getSlice(start, endIndex);
	}
	/** @internal */
	onattribentity(cp) {
		this.attribvalue += fromCodePoint(cp);
	}
	/** @internal */
	onattribend(quote, endIndex) {
		var _a, _b;
		this.endIndex = endIndex;
		(_b = (_a = this.cbs).onattribute) === null || _b === void 0 || _b.call(_a, this.attribname, this.attribvalue, quote === QuoteType.Double ? "\"" : quote === QuoteType.Single ? "'" : quote === QuoteType.NoValue ? void 0 : null);
		if (this.attribs && !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) this.attribs[this.attribname] = this.attribvalue;
		this.attribvalue = "";
	}
	getInstructionName(value) {
		const index = value.search(reNameEnd);
		let name = index < 0 ? value : value.substr(0, index);
		if (this.lowerCaseTagNames) name = name.toLowerCase();
		return name;
	}
	/** @internal */
	ondeclaration(start, endIndex) {
		this.endIndex = endIndex;
		const value = this.getSlice(start, endIndex);
		if (this.cbs.onprocessinginstruction) {
			const name = this.getInstructionName(value);
			this.cbs.onprocessinginstruction(`!${name}`, `!${value}`);
		}
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	onprocessinginstruction(start, endIndex) {
		this.endIndex = endIndex;
		const value = this.getSlice(start, endIndex);
		if (this.cbs.onprocessinginstruction) {
			const name = this.getInstructionName(value);
			this.cbs.onprocessinginstruction(`?${name}`, `?${value}`);
		}
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	oncomment(start, endIndex, offset) {
		var _a, _b, _c, _d;
		this.endIndex = endIndex;
		(_b = (_a = this.cbs).oncomment) === null || _b === void 0 || _b.call(_a, this.getSlice(start, endIndex - offset));
		(_d = (_c = this.cbs).oncommentend) === null || _d === void 0 || _d.call(_c);
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	oncdata(start, endIndex, offset) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
		this.endIndex = endIndex;
		const value = this.getSlice(start, endIndex - offset);
		if (this.options.xmlMode || this.options.recognizeCDATA) {
			(_b = (_a = this.cbs).oncdatastart) === null || _b === void 0 || _b.call(_a);
			(_d = (_c = this.cbs).ontext) === null || _d === void 0 || _d.call(_c, value);
			(_f = (_e = this.cbs).oncdataend) === null || _f === void 0 || _f.call(_e);
		} else {
			(_h = (_g = this.cbs).oncomment) === null || _h === void 0 || _h.call(_g, `[CDATA[${value}]]`);
			(_k = (_j = this.cbs).oncommentend) === null || _k === void 0 || _k.call(_j);
		}
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	onend() {
		var _a, _b;
		if (this.cbs.onclosetag) {
			this.endIndex = this.startIndex;
			for (let index = this.stack.length; index > 0; this.cbs.onclosetag(this.stack[--index], true));
		}
		(_b = (_a = this.cbs).onend) === null || _b === void 0 || _b.call(_a);
	}
	/**
	* Resets the parser to a blank state, ready to parse a new HTML document
	*/
	reset() {
		var _a, _b, _c, _d;
		(_b = (_a = this.cbs).onreset) === null || _b === void 0 || _b.call(_a);
		this.tokenizer.reset();
		this.tagname = "";
		this.attribname = "";
		this.attribs = null;
		this.stack.length = 0;
		this.startIndex = 0;
		this.endIndex = 0;
		(_d = (_c = this.cbs).onparserinit) === null || _d === void 0 || _d.call(_c, this);
		this.buffers.length = 0;
		this.bufferOffset = 0;
		this.writeIndex = 0;
		this.ended = false;
	}
	/**
	* Resets the parser, then parses a complete document and
	* pushes it to the handler.
	*
	* @param data Document to parse.
	*/
	parseComplete(data) {
		this.reset();
		this.end(data);
	}
	getSlice(start, end) {
		while (start - this.bufferOffset >= this.buffers[0].length) this.shiftBuffer();
		let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
		while (end - this.bufferOffset > this.buffers[0].length) {
			this.shiftBuffer();
			slice += this.buffers[0].slice(0, end - this.bufferOffset);
		}
		return slice;
	}
	shiftBuffer() {
		this.bufferOffset += this.buffers[0].length;
		this.writeIndex--;
		this.buffers.shift();
	}
	/**
	* Parses a chunk of data and calls the corresponding callbacks.
	*
	* @param chunk Chunk to parse.
	*/
	write(chunk) {
		var _a, _b;
		if (this.ended) {
			(_b = (_a = this.cbs).onerror) === null || _b === void 0 || _b.call(_a, /* @__PURE__ */ new Error(".write() after done!"));
			return;
		}
		this.buffers.push(chunk);
		if (this.tokenizer.running) {
			this.tokenizer.write(chunk);
			this.writeIndex++;
		}
	}
	/**
	* Parses the end of the buffer and clears the stack, calls onend.
	*
	* @param chunk Optional final chunk to parse.
	*/
	end(chunk) {
		var _a, _b;
		if (this.ended) {
			(_b = (_a = this.cbs).onerror) === null || _b === void 0 || _b.call(_a, /* @__PURE__ */ new Error(".end() after done!"));
			return;
		}
		if (chunk) this.write(chunk);
		this.ended = true;
		this.tokenizer.end();
	}
	/**
	* Pauses parsing. The parser won't emit events until `resume` is called.
	*/
	pause() {
		this.tokenizer.pause();
	}
	/**
	* Resumes parsing after `pause` was called.
	*/
	resume() {
		this.tokenizer.resume();
		while (this.tokenizer.running && this.writeIndex < this.buffers.length) this.tokenizer.write(this.buffers[this.writeIndex++]);
		if (this.ended) this.tokenizer.end();
	}
	/**
	* Alias of `write`, for backwards compatibility.
	*
	* @param chunk Chunk to parse.
	* @deprecated
	*/
	parseChunk(chunk) {
		this.write(chunk);
	}
	/**
	* Alias of `end`, for backwards compatibility.
	*
	* @param chunk Optional final chunk to parse.
	* @deprecated
	*/
	done(chunk) {
		this.end(chunk);
	}
};
//#endregion
//#region node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/escape.js
var xmlReplacer = /["&'<>$\x80-\uFFFF]/g;
var xmlCodeMap = /* @__PURE__ */ new Map([
	[34, "&quot;"],
	[38, "&amp;"],
	[39, "&apos;"],
	[60, "&lt;"],
	[62, "&gt;"]
]);
var getCodePoint = String.prototype.codePointAt != null ? (str, index) => str.codePointAt(index) : (c, index) => (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index);
/**
* Encodes all non-ASCII characters, as well as characters not valid in XML
* documents using XML entities.
*
* If a character has no equivalent entity, a
* numeric hexadecimal reference (eg. `&#xfc;`) will be used.
*/
function encodeXML(str) {
	let ret = "";
	let lastIdx = 0;
	let match;
	while ((match = xmlReplacer.exec(str)) !== null) {
		const i = match.index;
		const char = str.charCodeAt(i);
		const next = xmlCodeMap.get(char);
		if (next !== void 0) {
			ret += str.substring(lastIdx, i) + next;
			lastIdx = i + 1;
		} else {
			ret += `${str.substring(lastIdx, i)}&#x${getCodePoint(str, i).toString(16)};`;
			lastIdx = xmlReplacer.lastIndex += Number((char & 64512) === 55296);
		}
	}
	return ret + str.substr(lastIdx);
}
/**
* Creates a function that escapes all characters matched by the given regular
* expression using the given map of characters to escape to their entities.
*
* @param regex Regular expression to match characters to escape.
* @param map Map of characters to escape to their entities.
*
* @returns Function that escapes all characters matched by the given regular
* expression using the given map of characters to escape to their entities.
*/
function getEscaper(regex, map) {
	return function escape(data) {
		let match;
		let lastIdx = 0;
		let result = "";
		while (match = regex.exec(data)) {
			if (lastIdx !== match.index) result += data.substring(lastIdx, match.index);
			result += map.get(match[0].charCodeAt(0));
			lastIdx = match.index + 1;
		}
		return result + data.substring(lastIdx);
	};
}
/**
* Encodes all characters that have to be escaped in HTML attributes,
* following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
*
* @param data String to escape.
*/
var escapeAttribute = getEscaper(/["&\u00A0]/g, /* @__PURE__ */ new Map([
	[34, "&quot;"],
	[38, "&amp;"],
	[160, "&nbsp;"]
]));
/**
* Encodes all characters that have to be escaped in HTML text,
* following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
*
* @param data String to escape.
*/
var escapeText = getEscaper(/[&<>\u00A0]/g, /* @__PURE__ */ new Map([
	[38, "&amp;"],
	[60, "&lt;"],
	[62, "&gt;"],
	[160, "&nbsp;"]
]));
//#endregion
//#region node_modules/.pnpm/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/foreignNames.js
var elementNames = new Map([
	"altGlyph",
	"altGlyphDef",
	"altGlyphItem",
	"animateColor",
	"animateMotion",
	"animateTransform",
	"clipPath",
	"feBlend",
	"feColorMatrix",
	"feComponentTransfer",
	"feComposite",
	"feConvolveMatrix",
	"feDiffuseLighting",
	"feDisplacementMap",
	"feDistantLight",
	"feDropShadow",
	"feFlood",
	"feFuncA",
	"feFuncB",
	"feFuncG",
	"feFuncR",
	"feGaussianBlur",
	"feImage",
	"feMerge",
	"feMergeNode",
	"feMorphology",
	"feOffset",
	"fePointLight",
	"feSpecularLighting",
	"feSpotLight",
	"feTile",
	"feTurbulence",
	"foreignObject",
	"glyphRef",
	"linearGradient",
	"radialGradient",
	"textPath"
].map((val) => [val.toLowerCase(), val]));
var attributeNames = new Map([
	"definitionURL",
	"attributeName",
	"attributeType",
	"baseFrequency",
	"baseProfile",
	"calcMode",
	"clipPathUnits",
	"diffuseConstant",
	"edgeMode",
	"filterUnits",
	"glyphRef",
	"gradientTransform",
	"gradientUnits",
	"kernelMatrix",
	"kernelUnitLength",
	"keyPoints",
	"keySplines",
	"keyTimes",
	"lengthAdjust",
	"limitingConeAngle",
	"markerHeight",
	"markerUnits",
	"markerWidth",
	"maskContentUnits",
	"maskUnits",
	"numOctaves",
	"pathLength",
	"patternContentUnits",
	"patternTransform",
	"patternUnits",
	"pointsAtX",
	"pointsAtY",
	"pointsAtZ",
	"preserveAlpha",
	"preserveAspectRatio",
	"primitiveUnits",
	"refX",
	"refY",
	"repeatCount",
	"repeatDur",
	"requiredExtensions",
	"requiredFeatures",
	"specularConstant",
	"specularExponent",
	"spreadMethod",
	"startOffset",
	"stdDeviation",
	"stitchTiles",
	"surfaceScale",
	"systemLanguage",
	"tableValues",
	"targetX",
	"targetY",
	"textLength",
	"viewBox",
	"viewTarget",
	"xChannelSelector",
	"yChannelSelector",
	"zoomAndPan"
].map((val) => [val.toLowerCase(), val]));
//#endregion
//#region node_modules/.pnpm/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/index.js
/**
* Mixed-case SVG and MathML tags & attributes
* recognized by the HTML parser.
*
* @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
*/
var unencodedElements = /* @__PURE__ */ new Set([
	"style",
	"script",
	"xmp",
	"iframe",
	"noembed",
	"noframes",
	"plaintext",
	"noscript"
]);
function replaceQuotes(value) {
	return value.replace(/"/g, "&quot;");
}
/**
* Format attributes
*/
function formatAttributes(attributes, opts) {
	var _a;
	if (!attributes) return;
	const encode = ((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) === false ? replaceQuotes : opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML : escapeAttribute;
	return Object.keys(attributes).map((key) => {
		var _a, _b;
		const value = (_a = attributes[key]) !== null && _a !== void 0 ? _a : "";
		if (opts.xmlMode === "foreign") key = (_b = attributeNames.get(key)) !== null && _b !== void 0 ? _b : key;
		if (!opts.emptyAttrs && !opts.xmlMode && value === "") return key;
		return `${key}="${encode(value)}"`;
	}).join(" ");
}
/**
* Self-enclosing tags
*/
var singleTag = /* @__PURE__ */ new Set([
	"area",
	"base",
	"basefont",
	"br",
	"col",
	"command",
	"embed",
	"frame",
	"hr",
	"img",
	"input",
	"isindex",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
]);
/**
* Renders a DOM node or an array of DOM nodes to a string.
*
* Can be thought of as the equivalent of the `outerHTML` of the passed node(s).
*
* @param node Node to be rendered.
* @param options Changes serialization behavior
*/
function render$1(node, options = {}) {
	const nodes = "length" in node ? node : [node];
	let output = "";
	for (let i = 0; i < nodes.length; i++) output += renderNode(nodes[i], options);
	return output;
}
function renderNode(node, options) {
	switch (node.type) {
		case Root: return render$1(node.children, options);
		case Doctype:
		case Directive: return renderDirective(node);
		case Comment$1: return renderComment(node);
		case CDATA$1: return renderCdata(node);
		case Script:
		case Style:
		case Tag: return renderTag(node, options);
		case Text$1: return renderText(node, options);
	}
}
var foreignModeIntegrationPoints = /* @__PURE__ */ new Set([
	"mi",
	"mo",
	"mn",
	"ms",
	"mtext",
	"annotation-xml",
	"foreignObject",
	"desc",
	"title"
]);
var foreignElements = /* @__PURE__ */ new Set(["svg", "math"]);
function renderTag(elem, opts) {
	var _a;
	if (opts.xmlMode === "foreign") {
		elem.name = (_a = elementNames.get(elem.name)) !== null && _a !== void 0 ? _a : elem.name;
		if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) opts = {
			...opts,
			xmlMode: false
		};
	}
	if (!opts.xmlMode && foreignElements.has(elem.name)) opts = {
		...opts,
		xmlMode: "foreign"
	};
	let tag = `<${elem.name}`;
	const attribs = formatAttributes(elem.attribs, opts);
	if (attribs) tag += ` ${attribs}`;
	if (elem.children.length === 0 && (opts.xmlMode ? opts.selfClosingTags !== false : opts.selfClosingTags && singleTag.has(elem.name))) {
		if (!opts.xmlMode) tag += " ";
		tag += "/>";
	} else {
		tag += ">";
		if (elem.children.length > 0) tag += render$1(elem.children, opts);
		if (opts.xmlMode || !singleTag.has(elem.name)) tag += `</${elem.name}>`;
	}
	return tag;
}
function renderDirective(elem) {
	return `<${elem.data}>`;
}
function renderText(elem, opts) {
	var _a;
	let data = elem.data || "";
	if (((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) data = opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML(data) : escapeText(data);
	return data;
}
function renderCdata(elem) {
	return `<![CDATA[${elem.children[0].data}]]>`;
}
function renderComment(elem) {
	return `<!--${elem.data}-->`;
}
//#endregion
//#region node_modules/.pnpm/htmlparser2@8.0.2/node_modules/htmlparser2/lib/esm/index.js
/**
* Parses the data, returns the resulting document.
*
* @param data The data that should be parsed.
* @param options Optional options for the parser and DOM builder.
*/
function parseDocument(data, options) {
	const handler = new DomHandler(void 0, options);
	new Parser(handler, options).end(data);
	return handler.root;
}
//#endregion
//#region node_modules/.pnpm/html-to-text@9.0.5/node_modules/html-to-text/lib/html-to-text.mjs
var import_cjs = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isMergeableObject = function isMergeableObject(value) {
		return isNonNullObject(value) && !isSpecial(value);
	};
	function isNonNullObject(value) {
		return !!value && typeof value === "object";
	}
	function isSpecial(value) {
		var stringValue = Object.prototype.toString.call(value);
		return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
	}
	var REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol.for ? Symbol.for("react.element") : 60103;
	function isReactElement(value) {
		return value.$$typeof === REACT_ELEMENT_TYPE;
	}
	function emptyTarget(val) {
		return Array.isArray(val) ? [] : {};
	}
	function cloneUnlessOtherwiseSpecified(value, options) {
		return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
	}
	function defaultArrayMerge(target, source, options) {
		return target.concat(source).map(function(element) {
			return cloneUnlessOtherwiseSpecified(element, options);
		});
	}
	function getMergeFunction(key, options) {
		if (!options.customMerge) return deepmerge;
		var customMerge = options.customMerge(key);
		return typeof customMerge === "function" ? customMerge : deepmerge;
	}
	function getEnumerableOwnPropertySymbols(target) {
		return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
			return Object.propertyIsEnumerable.call(target, symbol);
		}) : [];
	}
	function getKeys(target) {
		return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
	}
	function propertyIsOnObject(object, property) {
		try {
			return property in object;
		} catch (_) {
			return false;
		}
	}
	function propertyIsUnsafe(target, key) {
		return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
	}
	function mergeObject(target, source, options) {
		var destination = {};
		if (options.isMergeableObject(target)) getKeys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
		});
		getKeys(source).forEach(function(key) {
			if (propertyIsUnsafe(target, key)) return;
			if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
			else destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
		});
		return destination;
	}
	function deepmerge(target, source, options) {
		options = options || {};
		options.arrayMerge = options.arrayMerge || defaultArrayMerge;
		options.isMergeableObject = options.isMergeableObject || isMergeableObject;
		options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
		var sourceIsArray = Array.isArray(source);
		if (!(sourceIsArray === Array.isArray(target))) return cloneUnlessOtherwiseSpecified(source, options);
		else if (sourceIsArray) return options.arrayMerge(target, source, options);
		else return mergeObject(target, source, options);
	}
	deepmerge.all = function deepmergeAll(array, options) {
		if (!Array.isArray(array)) throw new Error("first argument should be an array");
		return array.reduce(function(prev, next) {
			return deepmerge(prev, next, options);
		}, {});
	};
	module.exports = deepmerge;
})))(), 1);
/**
* Make a recursive function that will only run to a given depth
* and switches to an alternative function at that depth. \
* No limitation if `n` is `undefined` (Just wraps `f` in that case).
*
* @param   { number | undefined } n   Allowed depth of recursion. `undefined` for no limitation.
* @param   { Function }           f   Function that accepts recursive callback as the first argument.
* @param   { Function }           [g] Function to run instead, when maximum depth was reached. Do nothing by default.
* @returns { Function }
*/
function limitedDepthRecursive(n, f, g = () => void 0) {
	if (n === void 0) {
		const f1 = function(...args) {
			return f(f1, ...args);
		};
		return f1;
	}
	if (n >= 0) return function(...args) {
		return f(limitedDepthRecursive(n - 1, f, g), ...args);
	};
	return g;
}
/**
* Return the same string or a substring with
* the given character occurrences removed from each side.
*
* @param   { string } str  A string to trim.
* @param   { string } char A character to be trimmed.
* @returns { string }
*/
function trimCharacter(str, char) {
	let start = 0;
	let end = str.length;
	while (start < end && str[start] === char) ++start;
	while (end > start && str[end - 1] === char) --end;
	return start > 0 || end < str.length ? str.substring(start, end) : str;
}
/**
* Return the same string or a substring with
* the given character occurrences removed from the end only.
*
* @param   { string } str  A string to trim.
* @param   { string } char A character to be trimmed.
* @returns { string }
*/
function trimCharacterEnd(str, char) {
	let end = str.length;
	while (end > 0 && str[end - 1] === char) --end;
	return end < str.length ? str.substring(0, end) : str;
}
/**
* Return a new string will all characters replaced with unicode escape sequences.
* This extreme kind of escaping can used to be safely compose regular expressions.
*
* @param { string } str A string to escape.
* @returns { string } A string of unicode escape sequences.
*/
function unicodeEscape(str) {
	return str.replace(/[\s\S]/g, (c) => "\\u" + c.charCodeAt().toString(16).padStart(4, "0"));
}
/**
* Deduplicate an array by a given key callback.
* Item properties are merged recursively and with the preference for last defined values.
* Of items with the same key, merged item takes the place of the last item,
* others are omitted.
*
* @param { any[] } items An array to deduplicate.
* @param { (x: any) => string } getKey Callback to get a value that distinguishes unique items.
* @returns { any[] }
*/
function mergeDuplicatesPreferLast(items, getKey) {
	const map = /* @__PURE__ */ new Map();
	for (let i = items.length; i-- > 0;) {
		const item = items[i];
		const key = getKey(item);
		map.set(key, map.has(key) ? (0, import_cjs.default)(item, map.get(key), { arrayMerge: overwriteMerge$1 }) : item);
	}
	return [...map.values()].reverse();
}
var overwriteMerge$1 = (acc, src, options) => [...src];
/**
* Get a nested property from an object.
*
* @param   { object }   obj  The object to query for the value.
* @param   { string[] } path The path to the property.
* @returns { any }
*/
function get(obj, path) {
	for (const key of path) {
		if (!obj) return;
		obj = obj[key];
	}
	return obj;
}
/**
* Convert a number into alphabetic sequence representation (Sequence without zeroes).
*
* For example: `a, ..., z, aa, ..., zz, aaa, ...`.
*
* @param   { number } num              Number to convert. Must be >= 1.
* @param   { string } [baseChar = 'a'] Character for 1 in the sequence.
* @param   { number } [base = 26]      Number of characters in the sequence.
* @returns { string }
*/
function numberToLetterSequence(num, baseChar = "a", base = 26) {
	const digits = [];
	do {
		num -= 1;
		digits.push(num % base);
		num = num / base >> 0;
	} while (num > 0);
	const baseCode = baseChar.charCodeAt(0);
	return digits.reverse().map((n) => String.fromCharCode(baseCode + n)).join("");
}
var I = [
	"I",
	"X",
	"C",
	"M"
];
var V = [
	"V",
	"L",
	"D"
];
/**
* Convert a number to it's Roman representation. No large numbers extension.
*
* @param   { number } num Number to convert. `0 < num <= 3999`.
* @returns { string }
*/
function numberToRoman(num) {
	return [...num + ""].map((n) => +n).reverse().map((v, i) => v % 5 < 4 ? (v < 5 ? "" : V[i]) + I[i].repeat(v % 5) : I[i] + (v < 5 ? V[i] : I[i + 1])).reverse().join("");
}
/**
* Helps to build text from words.
*/
var InlineTextBuilder = class {
	/**
	* Creates an instance of InlineTextBuilder.
	*
	* If `maxLineLength` is not provided then it is either `options.wordwrap` or unlimited.
	*
	* @param { Options } options           HtmlToText options.
	* @param { number }  [ maxLineLength ] This builder will try to wrap text to fit this line length.
	*/
	constructor(options, maxLineLength = void 0) {
		/** @type { string[][] } */
		this.lines = [];
		/** @type { string[] }   */
		this.nextLineWords = [];
		this.maxLineLength = maxLineLength || options.wordwrap || Number.MAX_VALUE;
		this.nextLineAvailableChars = this.maxLineLength;
		this.wrapCharacters = get(options, ["longWordSplit", "wrapCharacters"]) || [];
		this.forceWrapOnLimit = get(options, ["longWordSplit", "forceWrapOnLimit"]) || false;
		this.stashedSpace = false;
		this.wordBreakOpportunity = false;
	}
	/**
	* Add a new word.
	*
	* @param { string } word A word to add.
	* @param { boolean } [noWrap] Don't wrap text even if the line is too long.
	*/
	pushWord(word, noWrap = false) {
		if (this.nextLineAvailableChars <= 0 && !noWrap) this.startNewLine();
		const isLineStart = this.nextLineWords.length === 0;
		const cost = word.length + (isLineStart ? 0 : 1);
		if (cost <= this.nextLineAvailableChars || noWrap) {
			this.nextLineWords.push(word);
			this.nextLineAvailableChars -= cost;
		} else {
			const [first, ...rest] = this.splitLongWord(word);
			if (!isLineStart) this.startNewLine();
			this.nextLineWords.push(first);
			this.nextLineAvailableChars -= first.length;
			for (const part of rest) {
				this.startNewLine();
				this.nextLineWords.push(part);
				this.nextLineAvailableChars -= part.length;
			}
		}
	}
	/**
	* Pop a word from the currently built line.
	* This doesn't affect completed lines.
	*
	* @returns { string }
	*/
	popWord() {
		const lastWord = this.nextLineWords.pop();
		if (lastWord !== void 0) {
			const isLineStart = this.nextLineWords.length === 0;
			const cost = lastWord.length + (isLineStart ? 0 : 1);
			this.nextLineAvailableChars += cost;
		}
		return lastWord;
	}
	/**
	* Concat a word to the last word already in the builder.
	* Adds a new word in case there are no words yet in the last line.
	*
	* @param { string } word A word to be concatenated.
	* @param { boolean } [noWrap] Don't wrap text even if the line is too long.
	*/
	concatWord(word, noWrap = false) {
		if (this.wordBreakOpportunity && word.length > this.nextLineAvailableChars) {
			this.pushWord(word, noWrap);
			this.wordBreakOpportunity = false;
		} else {
			const lastWord = this.popWord();
			this.pushWord(lastWord ? lastWord.concat(word) : word, noWrap);
		}
	}
	/**
	* Add current line (and more empty lines if provided argument > 1) to the list of complete lines and start a new one.
	*
	* @param { number } n Number of line breaks that will be added to the resulting string.
	*/
	startNewLine(n = 1) {
		this.lines.push(this.nextLineWords);
		if (n > 1) this.lines.push(...Array.from({ length: n - 1 }, () => []));
		this.nextLineWords = [];
		this.nextLineAvailableChars = this.maxLineLength;
	}
	/**
	* No words in this builder.
	*
	* @returns { boolean }
	*/
	isEmpty() {
		return this.lines.length === 0 && this.nextLineWords.length === 0;
	}
	clear() {
		this.lines.length = 0;
		this.nextLineWords.length = 0;
		this.nextLineAvailableChars = this.maxLineLength;
	}
	/**
	* Join all lines of words inside the InlineTextBuilder into a complete string.
	*
	* @returns { string }
	*/
	toString() {
		return [...this.lines, this.nextLineWords].map((words) => words.join(" ")).join("\n");
	}
	/**
	* Split a long word up to fit within the word wrap limit.
	* Use either a character to split looking back from the word wrap limit,
	* or truncate to the word wrap limit.
	*
	* @param   { string }   word Input word.
	* @returns { string[] }      Parts of the word.
	*/
	splitLongWord(word) {
		const parts = [];
		let idx = 0;
		while (word.length > this.maxLineLength) {
			const firstLine = word.substring(0, this.maxLineLength);
			const remainingChars = word.substring(this.maxLineLength);
			const splitIndex = firstLine.lastIndexOf(this.wrapCharacters[idx]);
			if (splitIndex > -1) {
				word = firstLine.substring(splitIndex + 1) + remainingChars;
				parts.push(firstLine.substring(0, splitIndex + 1));
			} else {
				idx++;
				if (idx < this.wrapCharacters.length) word = firstLine + remainingChars;
				else {
					if (this.forceWrapOnLimit) {
						parts.push(firstLine);
						word = remainingChars;
						if (word.length > this.maxLineLength) continue;
					} else word = firstLine + remainingChars;
					break;
				}
			}
		}
		parts.push(word);
		return parts;
	}
};
var StackItem = class {
	constructor(next = null) {
		this.next = next;
	}
	getRoot() {
		return this.next ? this.next : this;
	}
};
var BlockStackItem = class extends StackItem {
	constructor(options, next = null, leadingLineBreaks = 1, maxLineLength = void 0) {
		super(next);
		this.leadingLineBreaks = leadingLineBreaks;
		this.inlineTextBuilder = new InlineTextBuilder(options, maxLineLength);
		this.rawText = "";
		this.stashedLineBreaks = 0;
		this.isPre = next && next.isPre;
		this.isNoWrap = next && next.isNoWrap;
	}
};
var ListStackItem = class extends BlockStackItem {
	constructor(options, next = null, { interRowLineBreaks = 1, leadingLineBreaks = 2, maxLineLength = void 0, maxPrefixLength = 0, prefixAlign = "left" } = {}) {
		super(options, next, leadingLineBreaks, maxLineLength);
		this.maxPrefixLength = maxPrefixLength;
		this.prefixAlign = prefixAlign;
		this.interRowLineBreaks = interRowLineBreaks;
	}
};
var ListItemStackItem = class extends BlockStackItem {
	constructor(options, next = null, { leadingLineBreaks = 1, maxLineLength = void 0, prefix = "" } = {}) {
		super(options, next, leadingLineBreaks, maxLineLength);
		this.prefix = prefix;
	}
};
var TableStackItem = class extends StackItem {
	constructor(next = null) {
		super(next);
		this.rows = [];
		this.isPre = next && next.isPre;
		this.isNoWrap = next && next.isNoWrap;
	}
};
var TableRowStackItem = class extends StackItem {
	constructor(next = null) {
		super(next);
		this.cells = [];
		this.isPre = next && next.isPre;
		this.isNoWrap = next && next.isNoWrap;
	}
};
var TableCellStackItem = class extends StackItem {
	constructor(options, next = null, maxColumnWidth = void 0) {
		super(next);
		this.inlineTextBuilder = new InlineTextBuilder(options, maxColumnWidth);
		this.rawText = "";
		this.stashedLineBreaks = 0;
		this.isPre = next && next.isPre;
		this.isNoWrap = next && next.isNoWrap;
	}
};
var TransformerStackItem = class extends StackItem {
	constructor(next = null, transform) {
		super(next);
		this.transform = transform;
	}
};
function charactersToCodes(str) {
	return [...str].map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
}
/**
* Helps to handle HTML whitespaces.
*
* @class WhitespaceProcessor
*/
var WhitespaceProcessor = class {
	/**
	* Creates an instance of WhitespaceProcessor.
	*
	* @param { Options } options    HtmlToText options.
	* @memberof WhitespaceProcessor
	*/
	constructor(options) {
		this.whitespaceChars = options.preserveNewlines ? options.whitespaceCharacters.replace(/\n/g, "") : options.whitespaceCharacters;
		const whitespaceCodes = charactersToCodes(this.whitespaceChars);
		this.leadingWhitespaceRe = new RegExp(`^[${whitespaceCodes}]`);
		this.trailingWhitespaceRe = new RegExp(`[${whitespaceCodes}]$`);
		this.allWhitespaceOrEmptyRe = new RegExp(`^[${whitespaceCodes}]*$`);
		this.newlineOrNonWhitespaceRe = new RegExp(`(\\n|[^\\n${whitespaceCodes}])`, "g");
		this.newlineOrNonNewlineStringRe = new RegExp(`(\\n|[^\\n]+)`, "g");
		if (options.preserveNewlines) {
			const wordOrNewlineRe = new RegExp(`\\n|[^\\n${whitespaceCodes}]+`, "gm");
			/**
			* Shrink whitespaces and wrap text, add to the builder.
			*
			* @param { string }                  text              Input text.
			* @param { InlineTextBuilder }       inlineTextBuilder A builder to receive processed text.
			* @param { (str: string) => string } [ transform ]     A transform to be applied to words.
			* @param { boolean }                 [noWrap] Don't wrap text even if the line is too long.
			*/
			this.shrinkWrapAdd = function(text, inlineTextBuilder, transform = ((str) => str), noWrap = false) {
				if (!text) return;
				const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
				let anyMatch = false;
				let m = wordOrNewlineRe.exec(text);
				if (m) {
					anyMatch = true;
					if (m[0] === "\n") inlineTextBuilder.startNewLine();
					else if (previouslyStashedSpace || this.testLeadingWhitespace(text)) inlineTextBuilder.pushWord(transform(m[0]), noWrap);
					else inlineTextBuilder.concatWord(transform(m[0]), noWrap);
					while ((m = wordOrNewlineRe.exec(text)) !== null) if (m[0] === "\n") inlineTextBuilder.startNewLine();
					else inlineTextBuilder.pushWord(transform(m[0]), noWrap);
				}
				inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch || this.testTrailingWhitespace(text);
			};
		} else {
			const wordRe = new RegExp(`[^${whitespaceCodes}]+`, "g");
			this.shrinkWrapAdd = function(text, inlineTextBuilder, transform = ((str) => str), noWrap = false) {
				if (!text) return;
				const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
				let anyMatch = false;
				let m = wordRe.exec(text);
				if (m) {
					anyMatch = true;
					if (previouslyStashedSpace || this.testLeadingWhitespace(text)) inlineTextBuilder.pushWord(transform(m[0]), noWrap);
					else inlineTextBuilder.concatWord(transform(m[0]), noWrap);
					while ((m = wordRe.exec(text)) !== null) inlineTextBuilder.pushWord(transform(m[0]), noWrap);
				}
				inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch || this.testTrailingWhitespace(text);
			};
		}
	}
	/**
	* Add text with only minimal processing.
	* Everything between newlines considered a single word.
	* No whitespace is trimmed.
	* Not affected by preserveNewlines option - `\n` always starts a new line.
	*
	* `noWrap` argument is `true` by default - this won't start a new line
	* even if there is not enough space left in the current line.
	*
	* @param { string }            text              Input text.
	* @param { InlineTextBuilder } inlineTextBuilder A builder to receive processed text.
	* @param { boolean }           [noWrap] Don't wrap text even if the line is too long.
	*/
	addLiteral(text, inlineTextBuilder, noWrap = true) {
		if (!text) return;
		const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
		let anyMatch = false;
		let m = this.newlineOrNonNewlineStringRe.exec(text);
		if (m) {
			anyMatch = true;
			if (m[0] === "\n") inlineTextBuilder.startNewLine();
			else if (previouslyStashedSpace) inlineTextBuilder.pushWord(m[0], noWrap);
			else inlineTextBuilder.concatWord(m[0], noWrap);
			while ((m = this.newlineOrNonNewlineStringRe.exec(text)) !== null) if (m[0] === "\n") inlineTextBuilder.startNewLine();
			else inlineTextBuilder.pushWord(m[0], noWrap);
		}
		inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch;
	}
	/**
	* Test whether the given text starts with HTML whitespace character.
	*
	* @param   { string }  text  The string to test.
	* @returns { boolean }
	*/
	testLeadingWhitespace(text) {
		return this.leadingWhitespaceRe.test(text);
	}
	/**
	* Test whether the given text ends with HTML whitespace character.
	*
	* @param   { string }  text  The string to test.
	* @returns { boolean }
	*/
	testTrailingWhitespace(text) {
		return this.trailingWhitespaceRe.test(text);
	}
	/**
	* Test whether the given text contains any non-whitespace characters.
	*
	* @param   { string }  text  The string to test.
	* @returns { boolean }
	*/
	testContainsWords(text) {
		return !this.allWhitespaceOrEmptyRe.test(text);
	}
	/**
	* Return the number of newlines if there are no words.
	*
	* If any word is found then return zero regardless of the actual number of newlines.
	*
	* @param   { string }  text  Input string.
	* @returns { number }
	*/
	countNewlinesNoWords(text) {
		this.newlineOrNonWhitespaceRe.lastIndex = 0;
		let counter = 0;
		let match;
		while ((match = this.newlineOrNonWhitespaceRe.exec(text)) !== null) if (match[0] === "\n") counter++;
		else return 0;
		return counter;
	}
};
/**
* Helps to build text from inline and block elements.
*
* @class BlockTextBuilder
*/
var BlockTextBuilder = class {
	/**
	* Creates an instance of BlockTextBuilder.
	*
	* @param { Options } options HtmlToText options.
	* @param { import('selderee').Picker<DomNode, TagDefinition> } picker Selectors decision tree picker.
	* @param { any} [metadata] Optional metadata for HTML document, for use in formatters.
	*/
	constructor(options, picker, metadata = void 0) {
		this.options = options;
		this.picker = picker;
		this.metadata = metadata;
		this.whitespaceProcessor = new WhitespaceProcessor(options);
		/** @type { StackItem } */
		this._stackItem = new BlockStackItem(options);
		/** @type { TransformerStackItem } */
		this._wordTransformer = void 0;
	}
	/**
	* Put a word-by-word transform function onto the transformations stack.
	*
	* Mainly used for uppercasing. Can be bypassed to add unformatted text such as URLs.
	*
	* Word transformations applied before wrapping.
	*
	* @param { (str: string) => string } wordTransform Word transformation function.
	*/
	pushWordTransform(wordTransform) {
		this._wordTransformer = new TransformerStackItem(this._wordTransformer, wordTransform);
	}
	/**
	* Remove a function from the word transformations stack.
	*
	* @returns { (str: string) => string } A function that was removed.
	*/
	popWordTransform() {
		if (!this._wordTransformer) return;
		const transform = this._wordTransformer.transform;
		this._wordTransformer = this._wordTransformer.next;
		return transform;
	}
	/**
	* Ignore wordwrap option in followup inline additions and disable automatic wrapping.
	*/
	startNoWrap() {
		this._stackItem.isNoWrap = true;
	}
	/**
	* Return automatic wrapping to behavior defined by options.
	*/
	stopNoWrap() {
		this._stackItem.isNoWrap = false;
	}
	/** @returns { (str: string) => string } */
	_getCombinedWordTransformer() {
		const wt = this._wordTransformer ? ((str) => applyTransformer(str, this._wordTransformer)) : void 0;
		const ce = this.options.encodeCharacters;
		return wt ? ce ? (str) => ce(wt(str)) : wt : ce;
	}
	_popStackItem() {
		const item = this._stackItem;
		this._stackItem = item.next;
		return item;
	}
	/**
	* Add a line break into currently built block.
	*/
	addLineBreak() {
		if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) return;
		if (this._stackItem.isPre) this._stackItem.rawText += "\n";
		else this._stackItem.inlineTextBuilder.startNewLine();
	}
	/**
	* Allow to break line in case directly following text will not fit.
	*/
	addWordBreakOpportunity() {
		if (this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem) this._stackItem.inlineTextBuilder.wordBreakOpportunity = true;
	}
	/**
	* Add a node inline into the currently built block.
	*
	* @param { string } str
	* Text content of a node to add.
	*
	* @param { object } [param1]
	* Object holding the parameters of the operation.
	*
	* @param { boolean } [param1.noWordTransform]
	* Ignore word transformers if there are any.
	* Don't encode characters as well.
	* (Use this for things like URL addresses).
	*/
	addInline(str, { noWordTransform = false } = {}) {
		if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) return;
		if (this._stackItem.isPre) {
			this._stackItem.rawText += str;
			return;
		}
		if (str.length === 0 || this._stackItem.stashedLineBreaks && !this.whitespaceProcessor.testContainsWords(str)) return;
		if (this.options.preserveNewlines) {
			const newlinesNumber = this.whitespaceProcessor.countNewlinesNoWords(str);
			if (newlinesNumber > 0) {
				this._stackItem.inlineTextBuilder.startNewLine(newlinesNumber);
				return;
			}
		}
		if (this._stackItem.stashedLineBreaks) this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
		this.whitespaceProcessor.shrinkWrapAdd(str, this._stackItem.inlineTextBuilder, noWordTransform ? void 0 : this._getCombinedWordTransformer(), this._stackItem.isNoWrap);
		this._stackItem.stashedLineBreaks = 0;
	}
	/**
	* Add a string inline into the currently built block.
	*
	* Use this for markup elements that don't have to adhere
	* to text layout rules.
	*
	* @param { string } str Text to add.
	*/
	addLiteral(str) {
		if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) return;
		if (str.length === 0) return;
		if (this._stackItem.isPre) {
			this._stackItem.rawText += str;
			return;
		}
		if (this._stackItem.stashedLineBreaks) this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
		this.whitespaceProcessor.addLiteral(str, this._stackItem.inlineTextBuilder, this._stackItem.isNoWrap);
		this._stackItem.stashedLineBreaks = 0;
	}
	/**
	* Start building a new block.
	*
	* @param { object } [param0]
	* Object holding the parameters of the block.
	*
	* @param { number } [param0.leadingLineBreaks]
	* This block should have at least this number of line breaks to separate it from any preceding block.
	*
	* @param { number }  [param0.reservedLineLength]
	* Reserve this number of characters on each line for block markup.
	*
	* @param { boolean } [param0.isPre]
	* Should HTML whitespace be preserved inside this block.
	*/
	openBlock({ leadingLineBreaks = 1, reservedLineLength = 0, isPre = false } = {}) {
		const maxLineLength = Math.max(20, this._stackItem.inlineTextBuilder.maxLineLength - reservedLineLength);
		this._stackItem = new BlockStackItem(this.options, this._stackItem, leadingLineBreaks, maxLineLength);
		if (isPre) this._stackItem.isPre = true;
	}
	/**
	* Finalize currently built block, add it's content to the parent block.
	*
	* @param { object } [param0]
	* Object holding the parameters of the block.
	*
	* @param { number } [param0.trailingLineBreaks]
	* This block should have at least this number of line breaks to separate it from any following block.
	*
	* @param { (str: string) => string } [param0.blockTransform]
	* A function to transform the block text before adding to the parent block.
	* This happens after word wrap and should be used in combination with reserved line length
	* in order to keep line lengths correct.
	* Used for whole block markup.
	*/
	closeBlock({ trailingLineBreaks = 1, blockTransform = void 0 } = {}) {
		const block = this._popStackItem();
		const blockText = blockTransform ? blockTransform(getText(block)) : getText(block);
		addText(this._stackItem, blockText, block.leadingLineBreaks, Math.max(block.stashedLineBreaks, trailingLineBreaks));
	}
	/**
	* Start building a new list.
	*
	* @param { object } [param0]
	* Object holding the parameters of the list.
	*
	* @param { number } [param0.maxPrefixLength]
	* Length of the longest list item prefix.
	* If not supplied or too small then list items won't be aligned properly.
	*
	* @param { 'left' | 'right' } [param0.prefixAlign]
	* Specify how prefixes of different lengths have to be aligned
	* within a column.
	*
	* @param { number } [param0.interRowLineBreaks]
	* Minimum number of line breaks between list items.
	*
	* @param { number } [param0.leadingLineBreaks]
	* This list should have at least this number of line breaks to separate it from any preceding block.
	*/
	openList({ maxPrefixLength = 0, prefixAlign = "left", interRowLineBreaks = 1, leadingLineBreaks = 2 } = {}) {
		this._stackItem = new ListStackItem(this.options, this._stackItem, {
			interRowLineBreaks,
			leadingLineBreaks,
			maxLineLength: this._stackItem.inlineTextBuilder.maxLineLength,
			maxPrefixLength,
			prefixAlign
		});
	}
	/**
	* Start building a new list item.
	*
	* @param {object} param0
	* Object holding the parameters of the list item.
	*
	* @param { string } [param0.prefix]
	* Prefix for this list item (item number, bullet point, etc).
	*/
	openListItem({ prefix = "" } = {}) {
		if (!(this._stackItem instanceof ListStackItem)) throw new Error("Can't add a list item to something that is not a list! Check the formatter.");
		const list = this._stackItem;
		const prefixLength = Math.max(prefix.length, list.maxPrefixLength);
		const maxLineLength = Math.max(20, list.inlineTextBuilder.maxLineLength - prefixLength);
		this._stackItem = new ListItemStackItem(this.options, list, {
			prefix,
			maxLineLength,
			leadingLineBreaks: list.interRowLineBreaks
		});
	}
	/**
	* Finalize currently built list item, add it's content to the parent list.
	*/
	closeListItem() {
		const listItem = this._popStackItem();
		const list = listItem.next;
		const prefixLength = Math.max(listItem.prefix.length, list.maxPrefixLength);
		const spacing = "\n" + " ".repeat(prefixLength);
		addText(list, (list.prefixAlign === "right" ? listItem.prefix.padStart(prefixLength) : listItem.prefix.padEnd(prefixLength)) + getText(listItem).replace(/\n/g, spacing), listItem.leadingLineBreaks, Math.max(listItem.stashedLineBreaks, list.interRowLineBreaks));
	}
	/**
	* Finalize currently built list, add it's content to the parent block.
	*
	* @param { object } param0
	* Object holding the parameters of the list.
	*
	* @param { number } [param0.trailingLineBreaks]
	* This list should have at least this number of line breaks to separate it from any following block.
	*/
	closeList({ trailingLineBreaks = 2 } = {}) {
		const list = this._popStackItem();
		const text = getText(list);
		if (text) addText(this._stackItem, text, list.leadingLineBreaks, trailingLineBreaks);
	}
	/**
	* Start building a table.
	*/
	openTable() {
		this._stackItem = new TableStackItem(this._stackItem);
	}
	/**
	* Start building a table row.
	*/
	openTableRow() {
		if (!(this._stackItem instanceof TableStackItem)) throw new Error("Can't add a table row to something that is not a table! Check the formatter.");
		this._stackItem = new TableRowStackItem(this._stackItem);
	}
	/**
	* Start building a table cell.
	*
	* @param { object } [param0]
	* Object holding the parameters of the cell.
	*
	* @param { number } [param0.maxColumnWidth]
	* Wrap cell content to this width. Fall back to global wordwrap value if undefined.
	*/
	openTableCell({ maxColumnWidth = void 0 } = {}) {
		if (!(this._stackItem instanceof TableRowStackItem)) throw new Error("Can't add a table cell to something that is not a table row! Check the formatter.");
		this._stackItem = new TableCellStackItem(this.options, this._stackItem, maxColumnWidth);
	}
	/**
	* Finalize currently built table cell and add it to parent table row's cells.
	*
	* @param { object } [param0]
	* Object holding the parameters of the cell.
	*
	* @param { number } [param0.colspan] How many columns this cell should occupy.
	* @param { number } [param0.rowspan] How many rows this cell should occupy.
	*/
	closeTableCell({ colspan = 1, rowspan = 1 } = {}) {
		const cell = this._popStackItem();
		const text = trimCharacter(getText(cell), "\n");
		cell.next.cells.push({
			colspan,
			rowspan,
			text
		});
	}
	/**
	* Finalize currently built table row and add it to parent table's rows.
	*/
	closeTableRow() {
		const row = this._popStackItem();
		row.next.rows.push(row.cells);
	}
	/**
	* Finalize currently built table and add the rendered text to the parent block.
	*
	* @param { object } param0
	* Object holding the parameters of the table.
	*
	* @param { TablePrinter } param0.tableToString
	* A function to convert a table of stringified cells into a complete table.
	*
	* @param { number } [param0.leadingLineBreaks]
	* This table should have at least this number of line breaks to separate if from any preceding block.
	*
	* @param { number } [param0.trailingLineBreaks]
	* This table should have at least this number of line breaks to separate it from any following block.
	*/
	closeTable({ tableToString, leadingLineBreaks = 2, trailingLineBreaks = 2 }) {
		const output = tableToString(this._popStackItem().rows);
		if (output) addText(this._stackItem, output, leadingLineBreaks, trailingLineBreaks);
	}
	/**
	* Return the rendered text content of this builder.
	*
	* @returns { string }
	*/
	toString() {
		return getText(this._stackItem.getRoot());
	}
};
function getText(stackItem) {
	if (!(stackItem instanceof BlockStackItem || stackItem instanceof ListItemStackItem || stackItem instanceof TableCellStackItem)) throw new Error("Only blocks, list items and table cells can be requested for text contents.");
	return stackItem.inlineTextBuilder.isEmpty() ? stackItem.rawText : stackItem.rawText + stackItem.inlineTextBuilder.toString();
}
function addText(stackItem, text, leadingLineBreaks, trailingLineBreaks) {
	if (!(stackItem instanceof BlockStackItem || stackItem instanceof ListItemStackItem || stackItem instanceof TableCellStackItem)) throw new Error("Only blocks, list items and table cells can contain text.");
	const parentText = getText(stackItem);
	const lineBreaks = Math.max(stackItem.stashedLineBreaks, leadingLineBreaks);
	stackItem.inlineTextBuilder.clear();
	if (parentText) stackItem.rawText = parentText + "\n".repeat(lineBreaks) + text;
	else {
		stackItem.rawText = text;
		stackItem.leadingLineBreaks = lineBreaks;
	}
	stackItem.stashedLineBreaks = trailingLineBreaks;
}
/**
* @param { string } str A string to transform.
* @param { TransformerStackItem } transformer A transformer item (with possible continuation).
* @returns { string }
*/
function applyTransformer(str, transformer) {
	return transformer ? applyTransformer(transformer.transform(str), transformer.next) : str;
}
/**
* Compile selectors into a decision tree,
* return a function intended for batch processing.
*
* @param   { Options } [options = {}]   HtmlToText options (defaults, formatters, user options merged, deduplicated).
* @returns { (html: string, metadata?: any) => string } Pre-configured converter function.
* @static
*/
function compile$1(options = {}) {
	const selectorsWithoutFormat = options.selectors.filter((s) => !s.format);
	if (selectorsWithoutFormat.length) throw new Error("Following selectors have no specified format: " + selectorsWithoutFormat.map((s) => `\`${s.selector}\``).join(", "));
	const picker = new DecisionTree(options.selectors.map((s) => [s.selector, s])).build(hp2Builder);
	if (typeof options.encodeCharacters !== "function") options.encodeCharacters = makeReplacerFromDict(options.encodeCharacters);
	const baseSelectorsPicker = new DecisionTree(options.baseElements.selectors.map((s, i) => [s, i + 1])).build(hp2Builder);
	function findBaseElements(dom) {
		return findBases(dom, options, baseSelectorsPicker);
	}
	const limitedWalk = limitedDepthRecursive(options.limits.maxDepth, recursiveWalk, function(dom, builder) {
		builder.addInline(options.limits.ellipsis || "");
	});
	return function(html, metadata = void 0) {
		return process(html, metadata, options, picker, findBaseElements, limitedWalk);
	};
}
/**
* Convert given HTML according to preprocessed options.
*
* @param { string } html HTML content to convert.
* @param { any } metadata Optional metadata for HTML document, for use in formatters.
* @param { Options } options HtmlToText options (preprocessed).
* @param { import('selderee').Picker<DomNode, TagDefinition> } picker
* Tag definition picker for DOM nodes processing.
* @param { (dom: DomNode[]) => DomNode[] } findBaseElements
* Function to extract elements from HTML DOM
* that will only be present in the output text.
* @param { RecursiveCallback } walk Recursive callback.
* @returns { string }
*/
function process(html, metadata, options, picker, findBaseElements, walk) {
	const maxInputLength = options.limits.maxInputLength;
	if (maxInputLength && html && html.length > maxInputLength) {
		console.warn(`Input length ${html.length} is above allowed limit of ${maxInputLength}. Truncating without ellipsis.`);
		html = html.substring(0, maxInputLength);
	}
	const bases = findBaseElements(parseDocument(html, { decodeEntities: options.decodeEntities }).children);
	const builder = new BlockTextBuilder(options, picker, metadata);
	walk(bases, builder);
	return builder.toString();
}
function findBases(dom, options, baseSelectorsPicker) {
	const results = [];
	function recursiveWalk(walk, dom) {
		dom = dom.slice(0, options.limits.maxChildNodes);
		for (const elem of dom) {
			if (elem.type !== "tag") continue;
			const pickedSelectorIndex = baseSelectorsPicker.pick1(elem);
			if (pickedSelectorIndex > 0) results.push({
				selectorIndex: pickedSelectorIndex,
				element: elem
			});
			else if (elem.children) walk(elem.children);
			if (results.length >= options.limits.maxBaseElements) return;
		}
	}
	limitedDepthRecursive(options.limits.maxDepth, recursiveWalk)(dom);
	if (options.baseElements.orderBy !== "occurrence") results.sort((a, b) => a.selectorIndex - b.selectorIndex);
	return options.baseElements.returnDomByDefault && results.length === 0 ? dom : results.map((x) => x.element);
}
/**
* Function to walk through DOM nodes and accumulate their string representations.
*
* @param   { RecursiveCallback } walk    Recursive callback.
* @param   { DomNode[] }         [dom]   Nodes array to process.
* @param   { BlockTextBuilder }  builder Passed around to accumulate output text.
* @private
*/
function recursiveWalk(walk, dom, builder) {
	if (!dom) return;
	const options = builder.options;
	if (dom.length > options.limits.maxChildNodes) {
		dom = dom.slice(0, options.limits.maxChildNodes);
		dom.push({
			data: options.limits.ellipsis,
			type: "text"
		});
	}
	for (const elem of dom) switch (elem.type) {
		case "text":
			builder.addInline(elem.data);
			break;
		case "tag": {
			const tagDefinition = builder.picker.pick1(elem);
			const format = options.formatters[tagDefinition.format];
			format(elem, walk, builder, tagDefinition.options || {});
			break;
		}
	}
}
/**
* @param { Object<string,string | false> } dict
* A dictionary where keys are characters to replace
* and values are replacement strings.
*
* First code point from dict keys is used.
* Compound emojis with ZWJ are not supported (not until Node 16).
*
* @returns { ((str: string) => string) | undefined }
*/
function makeReplacerFromDict(dict) {
	if (!dict || Object.keys(dict).length === 0) return;
	/** @type { [string, string][] } */
	const entries = Object.entries(dict).filter(([, v]) => v !== false);
	const regex = new RegExp(entries.map(([c]) => `(${unicodeEscape([...c][0])})`).join("|"), "g");
	const values = entries.map(([, v]) => v);
	const replacer = (m, ...cgs) => values[cgs.findIndex((cg) => cg)];
	return (str) => str.replace(regex, replacer);
}
/**
* Dummy formatter that discards the input and does nothing.
*
* @type { FormatCallback }
*/
function formatSkip(elem, walk, builder, formatOptions) {}
/**
* Insert the given string literal inline instead of a tag.
*
* @type { FormatCallback }
*/
function formatInlineString(elem, walk, builder, formatOptions) {
	builder.addLiteral(formatOptions.string || "");
}
/**
* Insert a block with the given string literal instead of a tag.
*
* @type { FormatCallback }
*/
function formatBlockString(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	builder.addLiteral(formatOptions.string || "");
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Process an inline-level element.
*
* @type { FormatCallback }
*/
function formatInline(elem, walk, builder, formatOptions) {
	walk(elem.children, builder);
}
/**
* Process a block-level container.
*
* @type { FormatCallback }
*/
function formatBlock$1(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	walk(elem.children, builder);
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function renderOpenTag(elem) {
	const attrs = elem.attribs && elem.attribs.length ? " " + Object.entries(elem.attribs).map(([k, v]) => v === "" ? k : `${k}=${v.replace(/"/g, "&quot;")}`).join(" ") : "";
	return `<${elem.name}${attrs}>`;
}
function renderCloseTag(elem) {
	return `</${elem.name}>`;
}
/**
* Render an element as inline HTML tag, walk through it's children.
*
* @type { FormatCallback }
*/
function formatInlineTag(elem, walk, builder, formatOptions) {
	builder.startNoWrap();
	builder.addLiteral(renderOpenTag(elem));
	builder.stopNoWrap();
	walk(elem.children, builder);
	builder.startNoWrap();
	builder.addLiteral(renderCloseTag(elem));
	builder.stopNoWrap();
}
/**
* Render an element as HTML block bag, walk through it's children.
*
* @type { FormatCallback }
*/
function formatBlockTag(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	builder.startNoWrap();
	builder.addLiteral(renderOpenTag(elem));
	builder.stopNoWrap();
	walk(elem.children, builder);
	builder.startNoWrap();
	builder.addLiteral(renderCloseTag(elem));
	builder.stopNoWrap();
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Render an element with all it's children as inline HTML.
*
* @type { FormatCallback }
*/
function formatInlineHtml(elem, walk, builder, formatOptions) {
	builder.startNoWrap();
	builder.addLiteral(render$1(elem, { decodeEntities: builder.options.decodeEntities }));
	builder.stopNoWrap();
}
/**
* Render an element with all it's children as HTML block.
*
* @type { FormatCallback }
*/
function formatBlockHtml(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	builder.startNoWrap();
	builder.addLiteral(render$1(elem, { decodeEntities: builder.options.decodeEntities }));
	builder.stopNoWrap();
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Render inline element wrapped with given strings.
*
* @type { FormatCallback }
*/
function formatInlineSurround(elem, walk, builder, formatOptions) {
	builder.addLiteral(formatOptions.prefix || "");
	walk(elem.children, builder);
	builder.addLiteral(formatOptions.suffix || "");
}
var genericFormatters = /*#__PURE__*/ Object.freeze({
	__proto__: null,
	block: formatBlock$1,
	blockHtml: formatBlockHtml,
	blockString: formatBlockString,
	blockTag: formatBlockTag,
	inline: formatInline,
	inlineHtml: formatInlineHtml,
	inlineString: formatInlineString,
	inlineSurround: formatInlineSurround,
	inlineTag: formatInlineTag,
	skip: formatSkip
});
function getRow(matrix, j) {
	if (!matrix[j]) matrix[j] = [];
	return matrix[j];
}
function findFirstVacantIndex(row, x = 0) {
	while (row[x]) x++;
	return x;
}
function transposeInPlace(matrix, maxSize) {
	for (let i = 0; i < maxSize; i++) {
		const rowI = getRow(matrix, i);
		for (let j = 0; j < i; j++) {
			const rowJ = getRow(matrix, j);
			if (rowI[j] || rowJ[i]) {
				const temp = rowI[j];
				rowI[j] = rowJ[i];
				rowJ[i] = temp;
			}
		}
	}
}
function putCellIntoLayout(cell, layout, baseRow, baseCol) {
	for (let r = 0; r < cell.rowspan; r++) {
		const layoutRow = getRow(layout, baseRow + r);
		for (let c = 0; c < cell.colspan; c++) layoutRow[baseCol + c] = cell;
	}
}
function getOrInitOffset(offsets, index) {
	if (offsets[index] === void 0) offsets[index] = index === 0 ? 0 : 1 + getOrInitOffset(offsets, index - 1);
	return offsets[index];
}
function updateOffset(offsets, base, span, value) {
	offsets[base + span] = Math.max(getOrInitOffset(offsets, base + span), getOrInitOffset(offsets, base) + value);
}
/**
* Render a table into a string.
* Cells can contain multiline text and span across multiple rows and columns.
*
* Modifies cells to add lines array.
*
* @param { TablePrinterCell[][] } tableRows Table to render.
* @param { number } rowSpacing Number of spaces between columns.
* @param { number } colSpacing Number of empty lines between rows.
* @returns { string }
*/
function tableToString(tableRows, rowSpacing, colSpacing) {
	const layout = [];
	let colNumber = 0;
	const rowNumber = tableRows.length;
	const rowOffsets = [0];
	for (let j = 0; j < rowNumber; j++) {
		const layoutRow = getRow(layout, j);
		const cells = tableRows[j];
		let x = 0;
		for (let i = 0; i < cells.length; i++) {
			const cell = cells[i];
			x = findFirstVacantIndex(layoutRow, x);
			putCellIntoLayout(cell, layout, j, x);
			x += cell.colspan;
			cell.lines = cell.text.split("\n");
			const cellHeight = cell.lines.length;
			updateOffset(rowOffsets, j, cell.rowspan, cellHeight + rowSpacing);
		}
		colNumber = layoutRow.length > colNumber ? layoutRow.length : colNumber;
	}
	transposeInPlace(layout, rowNumber > colNumber ? rowNumber : colNumber);
	const outputLines = [];
	const colOffsets = [0];
	for (let x = 0; x < colNumber; x++) {
		let y = 0;
		let cell;
		const rowsInThisColumn = Math.min(rowNumber, layout[x].length);
		while (y < rowsInThisColumn) {
			cell = layout[x][y];
			if (cell) {
				if (!cell.rendered) {
					let cellWidth = 0;
					for (let j = 0; j < cell.lines.length; j++) {
						const line = cell.lines[j];
						const lineOffset = rowOffsets[y] + j;
						outputLines[lineOffset] = (outputLines[lineOffset] || "").padEnd(colOffsets[x]) + line;
						cellWidth = line.length > cellWidth ? line.length : cellWidth;
					}
					updateOffset(colOffsets, x, cell.colspan, cellWidth + colSpacing);
					cell.rendered = true;
				}
				y += cell.rowspan;
			} else {
				const lineOffset = rowOffsets[y];
				outputLines[lineOffset] = outputLines[lineOffset] || "";
				y++;
			}
		}
	}
	return outputLines.join("\n");
}
/**
* Process a line-break.
*
* @type { FormatCallback }
*/
function formatLineBreak(elem, walk, builder, formatOptions) {
	builder.addLineBreak();
}
/**
* Process a `wbr` tag (word break opportunity).
*
* @type { FormatCallback }
*/
function formatWbr(elem, walk, builder, formatOptions) {
	builder.addWordBreakOpportunity();
}
/**
* Process a horizontal line.
*
* @type { FormatCallback }
*/
function formatHorizontalLine(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	builder.addInline("-".repeat(formatOptions.length || builder.options.wordwrap || 40));
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Process a paragraph.
*
* @type { FormatCallback }
*/
function formatParagraph(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	walk(elem.children, builder);
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Process a preformatted content.
*
* @type { FormatCallback }
*/
function formatPre(elem, walk, builder, formatOptions) {
	builder.openBlock({
		isPre: true,
		leadingLineBreaks: formatOptions.leadingLineBreaks || 2
	});
	walk(elem.children, builder);
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Process a heading.
*
* @type { FormatCallback }
*/
function formatHeading(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	if (formatOptions.uppercase !== false) {
		builder.pushWordTransform((str) => str.toUpperCase());
		walk(elem.children, builder);
		builder.popWordTransform();
	} else walk(elem.children, builder);
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Process a blockquote.
*
* @type { FormatCallback }
*/
function formatBlockquote(elem, walk, builder, formatOptions) {
	builder.openBlock({
		leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
		reservedLineLength: 2
	});
	walk(elem.children, builder);
	builder.closeBlock({
		trailingLineBreaks: formatOptions.trailingLineBreaks || 2,
		blockTransform: (str) => (formatOptions.trimEmptyLines !== false ? trimCharacter(str, "\n") : str).split("\n").map((line) => "> " + line).join("\n")
	});
}
function withBrackets(str, brackets) {
	if (!brackets) return str;
	const lbr = typeof brackets[0] === "string" ? brackets[0] : "[";
	const rbr = typeof brackets[1] === "string" ? brackets[1] : "]";
	return lbr + str + rbr;
}
function pathRewrite(path, rewriter, baseUrl, metadata, elem) {
	const modifiedPath = typeof rewriter === "function" ? rewriter(path, metadata, elem) : path;
	return modifiedPath[0] === "/" && baseUrl ? trimCharacterEnd(baseUrl, "/") + modifiedPath : modifiedPath;
}
/**
* Process an image.
*
* @type { FormatCallback }
*/
function formatImage(elem, walk, builder, formatOptions) {
	const attribs = elem.attribs || {};
	const alt = attribs.alt ? attribs.alt : "";
	const src = !attribs.src ? "" : pathRewrite(attribs.src, formatOptions.pathRewrite, formatOptions.baseUrl, builder.metadata, elem);
	const text = !src ? alt : !alt ? withBrackets(src, formatOptions.linkBrackets) : alt + " " + withBrackets(src, formatOptions.linkBrackets);
	builder.addInline(text, { noWordTransform: true });
}
/**
* Process an anchor.
*
* @type { FormatCallback }
*/
function formatAnchor(elem, walk, builder, formatOptions) {
	function getHref() {
		if (formatOptions.ignoreHref) return "";
		if (!elem.attribs || !elem.attribs.href) return "";
		let href = elem.attribs.href.replace(/^mailto:/, "");
		if (formatOptions.noAnchorUrl && href[0] === "#") return "";
		href = pathRewrite(href, formatOptions.pathRewrite, formatOptions.baseUrl, builder.metadata, elem);
		return href;
	}
	const href = getHref();
	if (!href) walk(elem.children, builder);
	else {
		let text = "";
		builder.pushWordTransform((str) => {
			if (str) text += str;
			return str;
		});
		walk(elem.children, builder);
		builder.popWordTransform();
		if (!(formatOptions.hideLinkHrefIfSameAsText && href === text)) builder.addInline(!text ? href : " " + withBrackets(href, formatOptions.linkBrackets), { noWordTransform: true });
	}
}
/**
* @param { DomNode }           elem               List items with their prefixes.
* @param { RecursiveCallback } walk               Recursive callback to process child nodes.
* @param { BlockTextBuilder }  builder            Passed around to accumulate output text.
* @param { FormatOptions }     formatOptions      Options specific to a formatter.
* @param { () => string }      nextPrefixCallback Function that returns increasing index each time it is called.
*/
function formatList(elem, walk, builder, formatOptions, nextPrefixCallback) {
	const isNestedList = get(elem, ["parent", "name"]) === "li";
	let maxPrefixLength = 0;
	const listItems = (elem.children || []).filter((child) => child.type !== "text" || !/^\s*$/.test(child.data)).map(function(child) {
		if (child.name !== "li") return {
			node: child,
			prefix: ""
		};
		const prefix = isNestedList ? nextPrefixCallback().trimStart() : nextPrefixCallback();
		if (prefix.length > maxPrefixLength) maxPrefixLength = prefix.length;
		return {
			node: child,
			prefix
		};
	});
	if (!listItems.length) return;
	builder.openList({
		interRowLineBreaks: 1,
		leadingLineBreaks: isNestedList ? 1 : formatOptions.leadingLineBreaks || 2,
		maxPrefixLength,
		prefixAlign: "left"
	});
	for (const { node, prefix } of listItems) {
		builder.openListItem({ prefix });
		walk([node], builder);
		builder.closeListItem();
	}
	builder.closeList({ trailingLineBreaks: isNestedList ? 1 : formatOptions.trailingLineBreaks || 2 });
}
/**
* Process an unordered list.
*
* @type { FormatCallback }
*/
function formatUnorderedList(elem, walk, builder, formatOptions) {
	const prefix = formatOptions.itemPrefix || " * ";
	return formatList(elem, walk, builder, formatOptions, () => prefix);
}
/**
* Process an ordered list.
*
* @type { FormatCallback }
*/
function formatOrderedList(elem, walk, builder, formatOptions) {
	let nextIndex = Number(elem.attribs.start || "1");
	const indexFunction = getOrderedListIndexFunction(elem.attribs.type);
	const nextPrefixCallback = () => " " + indexFunction(nextIndex++) + ". ";
	return formatList(elem, walk, builder, formatOptions, nextPrefixCallback);
}
/**
* Return a function that can be used to generate index markers of a specified format.
*
* @param   { string } [olType='1'] Marker type.
* @returns { (i: number) => string }
*/
function getOrderedListIndexFunction(olType = "1") {
	switch (olType) {
		case "a": return (i) => numberToLetterSequence(i, "a");
		case "A": return (i) => numberToLetterSequence(i, "A");
		case "i": return (i) => numberToRoman(i).toLowerCase();
		case "I": return (i) => numberToRoman(i);
		default: return (i) => i.toString();
	}
}
/**
* Given a list of class and ID selectors (prefixed with '.' and '#'),
* return them as separate lists of names without prefixes.
*
* @param { string[] } selectors Class and ID selectors (`[".class", "#id"]` etc).
* @returns { { classes: string[], ids: string[] } }
*/
function splitClassesAndIds(selectors) {
	const classes = [];
	const ids = [];
	for (const selector of selectors) if (selector.startsWith(".")) classes.push(selector.substring(1));
	else if (selector.startsWith("#")) ids.push(selector.substring(1));
	return {
		classes,
		ids
	};
}
function isDataTable(attr, tables) {
	if (tables === true) return true;
	if (!attr) return false;
	const { classes, ids } = splitClassesAndIds(tables);
	const attrClasses = (attr["class"] || "").split(" ");
	const attrIds = (attr["id"] || "").split(" ");
	return attrClasses.some((x) => classes.includes(x)) || attrIds.some((x) => ids.includes(x));
}
/**
* Process a table (either as a container or as a data table, depending on options).
*
* @type { FormatCallback }
*/
function formatTable(elem, walk, builder, formatOptions) {
	return isDataTable(elem.attribs, builder.options.tables) ? formatDataTable(elem, walk, builder, formatOptions) : formatBlock(elem, walk, builder, formatOptions);
}
function formatBlock(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks });
	walk(elem.children, builder);
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks });
}
/**
* Process a data table.
*
* @type { FormatCallback }
*/
function formatDataTable(elem, walk, builder, formatOptions) {
	builder.openTable();
	elem.children.forEach(walkTable);
	builder.closeTable({
		tableToString: (rows) => tableToString(rows, formatOptions.rowSpacing ?? 0, formatOptions.colSpacing ?? 3),
		leadingLineBreaks: formatOptions.leadingLineBreaks,
		trailingLineBreaks: formatOptions.trailingLineBreaks
	});
	function formatCell(cellNode) {
		const colspan = +get(cellNode, ["attribs", "colspan"]) || 1;
		const rowspan = +get(cellNode, ["attribs", "rowspan"]) || 1;
		builder.openTableCell({ maxColumnWidth: formatOptions.maxColumnWidth });
		walk(cellNode.children, builder);
		builder.closeTableCell({
			colspan,
			rowspan
		});
	}
	function walkTable(elem) {
		if (elem.type !== "tag") return;
		const formatHeaderCell = formatOptions.uppercaseHeaderCells !== false ? (cellNode) => {
			builder.pushWordTransform((str) => str.toUpperCase());
			formatCell(cellNode);
			builder.popWordTransform();
		} : formatCell;
		switch (elem.name) {
			case "thead":
			case "tbody":
			case "tfoot":
			case "center":
				elem.children.forEach(walkTable);
				return;
			case "tr":
				builder.openTableRow();
				for (const childOfTr of elem.children) {
					if (childOfTr.type !== "tag") continue;
					switch (childOfTr.name) {
						case "th":
							formatHeaderCell(childOfTr);
							break;
						case "td": formatCell(childOfTr);
					}
				}
				builder.closeTableRow();
		}
	}
}
var textFormatters = /*#__PURE__*/ Object.freeze({
	__proto__: null,
	anchor: formatAnchor,
	blockquote: formatBlockquote,
	dataTable: formatDataTable,
	heading: formatHeading,
	horizontalLine: formatHorizontalLine,
	image: formatImage,
	lineBreak: formatLineBreak,
	orderedList: formatOrderedList,
	paragraph: formatParagraph,
	pre: formatPre,
	table: formatTable,
	unorderedList: formatUnorderedList,
	wbr: formatWbr
});
/**
* Default options.
*
* @constant
* @type { Options }
* @default
* @private
*/
var DEFAULT_OPTIONS = {
	baseElements: {
		selectors: ["body"],
		orderBy: "selectors",
		returnDomByDefault: true
	},
	decodeEntities: true,
	encodeCharacters: {},
	formatters: {},
	limits: {
		ellipsis: "...",
		maxBaseElements: void 0,
		maxChildNodes: void 0,
		maxDepth: void 0,
		maxInputLength: 1 << 24
	},
	longWordSplit: {
		forceWrapOnLimit: false,
		wrapCharacters: []
	},
	preserveNewlines: false,
	selectors: [
		{
			selector: "*",
			format: "inline"
		},
		{
			selector: "a",
			format: "anchor",
			options: {
				baseUrl: null,
				hideLinkHrefIfSameAsText: false,
				ignoreHref: false,
				linkBrackets: ["[", "]"],
				noAnchorUrl: true
			}
		},
		{
			selector: "article",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "aside",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "blockquote",
			format: "blockquote",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2,
				trimEmptyLines: true
			}
		},
		{
			selector: "br",
			format: "lineBreak"
		},
		{
			selector: "div",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "footer",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "form",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "h1",
			format: "heading",
			options: {
				leadingLineBreaks: 3,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "h2",
			format: "heading",
			options: {
				leadingLineBreaks: 3,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "h3",
			format: "heading",
			options: {
				leadingLineBreaks: 3,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "h4",
			format: "heading",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "h5",
			format: "heading",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "h6",
			format: "heading",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "header",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "hr",
			format: "horizontalLine",
			options: {
				leadingLineBreaks: 2,
				length: void 0,
				trailingLineBreaks: 2
			}
		},
		{
			selector: "img",
			format: "image",
			options: {
				baseUrl: null,
				linkBrackets: ["[", "]"]
			}
		},
		{
			selector: "main",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "nav",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "ol",
			format: "orderedList",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2
			}
		},
		{
			selector: "p",
			format: "paragraph",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2
			}
		},
		{
			selector: "pre",
			format: "pre",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2
			}
		},
		{
			selector: "section",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "table",
			format: "table",
			options: {
				colSpacing: 3,
				leadingLineBreaks: 2,
				maxColumnWidth: 60,
				rowSpacing: 0,
				trailingLineBreaks: 2,
				uppercaseHeaderCells: true
			}
		},
		{
			selector: "ul",
			format: "unorderedList",
			options: {
				itemPrefix: " * ",
				leadingLineBreaks: 2,
				trailingLineBreaks: 2
			}
		},
		{
			selector: "wbr",
			format: "wbr"
		}
	],
	tables: [],
	whitespaceCharacters: " 	\r\n\f​",
	wordwrap: 80
};
var concatMerge = (acc, src, options) => [...acc, ...src];
var overwriteMerge = (acc, src, options) => [...src];
var selectorsMerge = (acc, src, options) => acc.some((s) => typeof s === "object") ? concatMerge(acc, src) : overwriteMerge(acc, src);
/**
* Preprocess options, compile selectors into a decision tree,
* return a function intended for batch processing.
*
* @param   { Options } [options = {}]   HtmlToText options.
* @returns { (html: string, metadata?: any) => string } Pre-configured converter function.
* @static
*/
function compile(options = {}) {
	options = (0, import_cjs.default)(DEFAULT_OPTIONS, options, {
		arrayMerge: overwriteMerge,
		customMerge: (key) => key === "selectors" ? selectorsMerge : void 0
	});
	options.formatters = Object.assign({}, genericFormatters, textFormatters, options.formatters);
	options.selectors = mergeDuplicatesPreferLast(options.selectors, ((s) => s.selector));
	handleDeprecatedOptions(options);
	return compile$1(options);
}
/**
* Convert given HTML content to plain text string.
*
* @param   { string }  html           HTML content to convert.
* @param   { Options } [options = {}] HtmlToText options.
* @param   { any }     [metadata]     Optional metadata for HTML document, for use in formatters.
* @returns { string }                 Plain text string.
* @static
*
* @example
* const { convert } = require('html-to-text');
* const text = convert('<h1>Hello World</h1>', {
*   wordwrap: 130
* });
* console.log(text); // HELLO WORLD
*/
function convert(html, options = {}, metadata = void 0) {
	return compile(options)(html, metadata);
}
/**
* Map previously existing and now deprecated options to the new options layout.
* This is a subject for cleanup in major releases.
*
* @param { Options } options HtmlToText options.
*/
function handleDeprecatedOptions(options) {
	if (options.tags) {
		const tagDefinitions = Object.entries(options.tags).map(([selector, definition]) => ({
			...definition,
			selector: selector || "*"
		}));
		options.selectors.push(...tagDefinitions);
		options.selectors = mergeDuplicatesPreferLast(options.selectors, ((s) => s.selector));
	}
	function set(obj, path, value) {
		const valueKey = path.pop();
		for (const key of path) {
			let nested = obj[key];
			if (!nested) {
				nested = {};
				obj[key] = nested;
			}
			obj = nested;
		}
		obj[valueKey] = value;
	}
	if (options["baseElement"]) {
		const baseElement = options["baseElement"];
		set(options, ["baseElements", "selectors"], Array.isArray(baseElement) ? baseElement : [baseElement]);
	}
	if (options["returnDomByDefault"] !== void 0) set(options, ["baseElements", "returnDomByDefault"], options["returnDomByDefault"]);
	for (const definition of options.selectors) if (definition.format === "anchor" && get(definition, ["options", "noLinkBrackets"])) set(definition, ["options", "linkBrackets"], false);
}
//#endregion
//#region node_modules/.pnpm/html5parser@3.0.0/node_modules/html5parser/dist/index.js
var SyntaxKind = /* @__PURE__ */ ((SyntaxKind2) => {
	SyntaxKind2["Text"] = "Text";
	SyntaxKind2["Tag"] = "Tag";
	return SyntaxKind2;
})(SyntaxKind || {});
var selfCloseTags = /* @__PURE__ */ new Set([
	"area",
	"base",
	"basefont",
	"bgsound",
	"br",
	"col",
	"command",
	"embed",
	"frame",
	"hr",
	"image",
	"img",
	"input",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
	"!doctype",
	"",
	"!",
	"!--"
]);
var noNestedTags = /* @__PURE__ */ new Set([
	"li",
	"option",
	"select",
	"textarea"
]);
var rcDataTags = /* @__PURE__ */ new Set(["title", "textarea"]);
var rawTextTags = /* @__PURE__ */ new Set([
	"style",
	"xmp",
	"iframe",
	"noembed",
	"noframes"
]);
var scriptDataTags = /* @__PURE__ */ new Set(["script"]);
var scriptingRawTextTags = /* @__PURE__ */ new Set(["noscript"]);
var plainTextTags = /* @__PURE__ */ new Set(["plaintext"]);
var state;
var buffer;
var bufSize;
var sectionStart;
var index;
var tokens;
var char;
var offset;
var textMode;
var textEndTag;
var pendingTextMode;
var pendingTextTag;
var tokenizeOptions;
function makeCodePoints(input) {
	return {
		lower: input.toLowerCase().split("").map((c) => c.charCodeAt(0)),
		upper: input.toUpperCase().split("").map((c) => c.charCodeAt(0)),
		length: input.length
	};
}
var doctype = makeCodePoints("!doctype");
function isWhiteSpace() {
	return char === 32 || char === 10 || char === 9 || char === 9 || char === 13 || char === 12;
}
function init(input, options) {
	state = 0;
	buffer = input;
	bufSize = input.length;
	sectionStart = 0;
	index = 0;
	tokens = [];
	offset = 0;
	textMode = 0;
	textEndTag = void 0;
	pendingTextMode = 0;
	pendingTextTag = "";
	tokenizeOptions = options;
}
function getTextMode(tagName) {
	if (rcDataTags.has(tagName)) return 1;
	if (rawTextTags.has(tagName)) return 2;
	if (scriptDataTags.has(tagName)) return 3;
	if (plainTextTags.has(tagName)) return 4;
	if (tokenizeOptions.scriptingEnabled && scriptingRawTextTags.has(tagName)) return 2;
	return 0;
}
function setPendingTextMode(tagName) {
	pendingTextTag = tagName;
	pendingTextMode = getTextMode(tagName);
}
function activatePendingTextMode(openTagEnd) {
	if (openTagEnd !== "/" && pendingTextMode !== 0) {
		textMode = pendingTextMode;
		textEndTag = makeCodePoints(pendingTextTag);
		if (pendingTextTag === "textarea" && buffer.charCodeAt(sectionStart) === 10) {
			sectionStart++;
			index++;
		}
	}
	pendingTextMode = 0;
	pendingTextTag = "";
}
function resetTextMode() {
	textMode = 0;
	textEndTag = void 0;
}
function resetTextClosingTag() {
	sectionStart -= 2;
	state = 0;
}
function tokenize(input, options = {}) {
	init(input, { scriptingEnabled: options.scriptingEnabled !== false });
	while (index < bufSize) {
		char = buffer.charCodeAt(index);
		switch (state) {
			case 0:
				parseLiteral();
				break;
			case 1:
				parseBeforeOpenTag();
				break;
			case 2:
				parseOpeningTag();
				break;
			case 3:
				parseAfterOpenTag();
				break;
			case 4:
				parseInValueNq();
				break;
			case 5:
				parseInValueSq();
				break;
			case 6:
				parseInValueDq();
				break;
			case 7:
				parseClosingOpenTag();
				break;
			case 8:
				parseOpeningSpecial();
				break;
			case 9:
				parseOpeningDoctype();
				break;
			case 10:
				parseOpeningNormalComment();
				break;
			case 11:
				parseNormalComment();
				break;
			case 12:
				parseShortComment();
				break;
			case 13:
				parseClosingNormalComment();
				break;
			case 14:
				parseClosingTag();
				break;
			default: unexpected();
		}
		index++;
	}
	switch (state) {
		case 0:
		case 1:
		case 4:
		case 5:
		case 6:
		case 7:
		case 11:
		case 12:
		case 13:
			emitToken(0);
			break;
		case 2:
			emitToken(1);
			break;
		case 3: break;
		case 8:
			emitToken(1, 12);
			break;
		case 9:
			if (index - sectionStart === doctype.length) emitToken(1);
			else {
				emitToken(1, void 0, sectionStart + 1);
				emitToken(0);
			}
			break;
		case 10:
			if (index - sectionStart === 2) emitToken(1);
			else {
				emitToken(1, void 0, sectionStart + 1);
				emitToken(0);
			}
			break;
		case 14: emitToken(3);
	}
	const _tokens = tokens;
	init("", tokenizeOptions);
	return _tokens;
}
function emitToken(kind, newState = state, end = index) {
	let value = buffer.substring(sectionStart, end);
	if (kind === 1 || kind === 3) value = value.toLowerCase();
	if (kind === 1) setPendingTextMode(value);
	if (kind === 3) resetTextMode();
	if (!((kind === 0 || kind === 4) && end === sectionStart)) tokens.push({
		type: kind,
		start: sectionStart,
		end,
		value
	});
	if (kind === 2 || kind === 3) {
		sectionStart = end + 1;
		state = 0;
		if (kind === 2) activatePendingTextMode(value);
	} else {
		sectionStart = end;
		state = newState;
	}
}
function parseLiteral() {
	if (textMode === 4) return;
	if (char === 60) emitToken(0, 1);
}
function parseBeforeOpenTag() {
	if (textMode !== 0) {
		if (char === 47) {
			state = 14;
			sectionStart = index + 1;
		} else state = 0;
		return;
	}
	if (char >= 97 && char <= 122 || char >= 65 && char <= 90) {
		state = 2;
		sectionStart = index;
	} else if (char === 47) {
		state = 14;
		sectionStart = index + 1;
	} else if (char === 60) emitToken(0);
	else if (char === 33) {
		state = 8;
		sectionStart = index;
	} else if (char === 63) {
		sectionStart = index;
		emitToken(1, 12);
	} else state = 0;
}
function parseOpeningTag() {
	if (isWhiteSpace()) emitToken(1, 3);
	else if (char === 62) {
		emitToken(1);
		emitToken(2);
	} else if (char === 47) emitToken(1, 7);
}
function parseAfterOpenTag() {
	if (char === 62) {
		emitToken(4);
		emitToken(2);
	} else if (char === 47) emitToken(4, 7);
	else if (char === 61) {
		emitToken(4);
		emitToken(5, void 0, index + 1);
	} else if (char === 39) emitToken(4, 5);
	else if (char === 34) emitToken(4, 6);
	else if (!isWhiteSpace()) emitToken(4, 4);
}
function parseInValueNq() {
	if (char === 62) {
		emitToken(6);
		emitToken(2);
	} else if (char === 47) emitToken(6, 7);
	else if (char === 61) {
		emitToken(6);
		emitToken(5, 3, index + 1);
	} else if (isWhiteSpace()) emitToken(6, 3);
}
function parseInValueSq() {
	if (char === 39) emitToken(7, 3, index + 1);
}
function parseInValueDq() {
	if (char === 34) emitToken(8, 3, index + 1);
}
function parseClosingOpenTag() {
	if (char === 62) emitToken(2);
	else {
		emitToken(6, 3);
		parseAfterOpenTag();
	}
}
function parseOpeningSpecial() {
	switch (char) {
		case 45:
			state = 10;
			break;
		case 100:
		case 68:
			state = 9;
			break;
		default: emitToken(1, 12);
	}
}
function parseOpeningDoctype() {
	offset = index - sectionStart;
	if (offset === doctype.length) {
		if (isWhiteSpace()) emitToken(1, 3);
		else unexpected();
	} else if (char === 62) {
		emitToken(1, void 0, sectionStart + 1);
		emitToken(0);
		emitToken(2);
	} else if (doctype.lower[offset] !== char && doctype.upper[offset] !== char) emitToken(1, 12, sectionStart + 1);
}
function parseOpeningNormalComment() {
	if (char === 45) emitToken(1, 11, index + 1);
	else emitToken(1, 12, sectionStart + 1);
}
function parseNormalComment() {
	if (char === 45) emitToken(0, 13);
}
function parseShortComment() {
	if (char === 62) {
		emitToken(0);
		emitToken(2);
	}
}
function parseClosingNormalComment() {
	offset = index - sectionStart;
	if (offset === 2) {
		if (char === 62) emitToken(2);
		else if (char === 45) emitToken(0, void 0, sectionStart + 1);
		else state = 11;
	} else if (char !== 45) state = 11;
}
function parseClosingTag() {
	offset = index - sectionStart;
	if (textMode !== 0) {
		const endTag = textEndTag;
		if (!endTag) unexpected();
		if (char === 60) {
			resetTextClosingTag();
			emitToken(0, 1);
		} else if (offset < endTag.length) {
			if (endTag.lower[offset] !== char && endTag.upper[offset] !== char) resetTextClosingTag();
		} else if (char === 62) emitToken(3);
		else if (!isWhiteSpace()) resetTextClosingTag();
	} else if (char === 62) emitToken(3);
}
function unexpected() {
	throw new SyntaxError(`Unexpected token "${buffer.charAt(index)}" at ${index} when parse ${state}`);
}
function getLineRanges(input) {
	return input.split("\n").reduce((arr, line) => {
		arr.push(line.length + 1 + arr[arr.length - 1]);
		return arr;
	}, [0]);
}
function getPosition(ranges, offset2) {
	let line = NaN;
	let column = NaN;
	for (let i = 1; i < ranges.length; i++) if (ranges[i] > offset2) {
		line = i;
		column = offset2 - ranges[i - 1] + 1;
		break;
	}
	return [line, column];
}
function visit(node2, parent, index3, options) {
	options.enter && options.enter(node2, parent, index3);
	if (node2.type === "Tag" && Array.isArray(node2.body)) for (let i = 0; i < node2.body.length; i++) visit(node2.body[i], node2, i, options);
	options.leave && options.leave(node2, parent, index3);
}
function walk(ast, options) {
	for (let i = 0; i < ast.length; i++) visit(ast[i], void 0, i, options);
}
var index2;
var count;
var tokens2;
var tagChain;
var nodes;
var token;
var node;
var buffer2;
var lines;
var parseOptions;
function init2(input, options) {
	if (input === void 0) {
		count = 0;
		tokens2.length = 0;
		buffer2 = "";
	} else {
		tokens2 = tokenize(input, { scriptingEnabled: options?.scriptingEnabled });
		count = tokens2.length;
		buffer2 = input;
	}
	index2 = 0;
	tagChain = void 0;
	nodes = [];
	token = void 0;
	node = void 0;
	lines = void 0;
	parseOptions = options;
}
function pushNode(_node) {
	if (!tagChain) nodes.push(_node);
	else if (_node.type === "Tag" && _node.name === tagChain.tag.name && noNestedTags.has(_node.name)) {
		tagChain = tagChain.parent;
		pushNode(_node);
	} else if (tagChain.tag.body) {
		tagChain.tag.end = _node.end;
		tagChain.tag.body.push(_node);
	}
}
function pushTagChain(tag) {
	tagChain = {
		parent: tagChain,
		tag
	};
	node = void 0;
}
function createLiteral(start = token.start, end = token.end, value = token.value) {
	return {
		start,
		end,
		value,
		type: "Text"
	};
}
function createTag() {
	return {
		start: token.start - 1,
		end: token.end,
		type: "Tag",
		open: createLiteral(token.start - 1),
		name: token.value,
		rawName: buffer2.substring(token.start, token.end),
		attributes: [],
		attributeMap: void 0,
		body: null,
		close: null
	};
}
function createAttribute() {
	return {
		start: token.start,
		end: token.end,
		name: createLiteral(),
		value: void 0
	};
}
function createAttributeValue() {
	return {
		start: token.start,
		end: token.end,
		value: token.type === 6 ? token.value : token.value.substr(1, token.value.length - 2),
		quote: token.type === 6 ? void 0 : token.type === 7 ? "'" : "\""
	};
}
function appendLiteral(_node = node) {
	_node.value += token.value;
	_node.end = token.end;
}
function unexpected2() {
	if (lines === void 0) lines = getLineRanges(buffer2);
	const [line, column] = getPosition(lines, token.start);
	throw new Error(`Unexpected token "${token.value}(${token.type})" at [${line},${column}]` + (tagChain ? ` when parsing tag: ${JSON.stringify(tagChain.tag.name)}.` : ""));
}
function buildAttributeMap(tag) {
	tag.attributeMap = {};
	for (const attr of tag.attributes) tag.attributeMap[attr.name.value] = attr;
}
function parseOpenTag() {
	let state2 = 0;
	let attr = void 0;
	const tag = createTag();
	pushNode(tag);
	if (tag.name === "" || tag.name === "!" || tag.name === "!--") {
		tag.open.value = "<" + tag.open.value;
		if (index2 === count) return;
		else {
			token = tokens2[++index2];
			if (token.type !== 2) {
				node = createLiteral();
				tag.body = [node];
				while (++index2 < count) {
					token = tokens2[index2];
					if (token.type === 2) {
						node = void 0;
						break;
					}
					appendLiteral();
				}
			}
			tag.close = createLiteral(token.start, token.end + 1, `${token.value}>`);
			tag.end = tag.close.end;
		}
		return;
	}
	while (++index2 < count) {
		token = tokens2[index2];
		if (token.type === 2) {
			tag.end = tag.open.end = token.end + 1;
			tag.open.value = buffer2.substring(tag.open.start, tag.open.end);
			if (token.value === "" && !selfCloseTags.has(tag.name)) {
				tag.body = [];
				pushTagChain(tag);
			} else tag.body = void 0;
			break;
		} else if (state2 === 0) {
			if (token.type !== 4) {
				attr = createAttribute();
				state2 = 1;
				tag.attributes.push(attr);
			}
		} else if (state2 === 1) {
			if (token.type === 4) state2 = 2;
			else if (token.type === 5) state2 = 3;
			else appendLiteral(attr.name);
		} else if (state2 === 2) {
			if (token.type !== 4) {
				if (token.type === 5) state2 = 3;
				else {
					attr = createAttribute();
					state2 = 1;
					tag.attributes.push(attr);
				}
			}
		} else if (state2 === 3) {
			if (token.type !== 4) {
				attr.value = createAttributeValue();
				if (token.type === 6) state2 = 4;
				else {
					attr.end = attr.value.end;
					state2 = 0;
				}
			}
		} else if (token.type === 4) {
			attr.end = attr.value.end;
			state2 = 0;
		} else appendLiteral(attr.value);
	}
}
function parseCloseTag() {
	let _context = tagChain;
	while (true) {
		if (!_context || token.value.trim() === _context.tag.name) break;
		_context = _context.parent;
	}
	if (!_context) return;
	_context.tag.close = createLiteral(token.start - 2, token.end + 1, buffer2.substring(token.start - 2, token.end + 1));
	_context.tag.end = _context.tag.close.end;
	_context = _context.parent;
	tagChain = _context;
}
function parse(input, options) {
	init2(input, {
		setAttributeMap: false,
		scriptingEnabled: true,
		...options
	});
	while (index2 < count) {
		token = tokens2[index2];
		switch (token.type) {
			case 0:
				if (!node) {
					node = createLiteral();
					pushNode(node);
				} else appendLiteral(node);
				break;
			case 1:
				node = void 0;
				parseOpenTag();
				break;
			case 3:
				node = void 0;
				parseCloseTag();
				break;
			default: unexpected2();
		}
		index2++;
	}
	const _nodes = nodes;
	if (parseOptions?.setAttributeMap) walk(_nodes, { enter(node2) {
		if (node2.type === "Tag") buildAttributeMap(node2);
	} });
	init2();
	return _nodes;
}
//#endregion
//#region node_modules/.pnpm/@react-email+render@2.1.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@react-email/render/dist/node/index.mjs
var node_exports = /* @__PURE__ */ __exportAll({
	plainTextSelectors: () => plainTextSelectors,
	pretty: () => pretty,
	render: () => render,
	toPlainText: () => toPlainText,
	unstableToPlainText: () => unstableToPlainText
});
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function getHtmlNode(path) {
	const topNode = path.node;
	if (topNode) return topNode;
	return path.stack?.[path.stack.length - 1];
}
function recursivelyMapDoc(doc, callback) {
	if (Array.isArray(doc)) return doc.map((innerDoc) => recursivelyMapDoc(innerDoc, callback));
	if (typeof doc === "object") {
		if (doc.type === "line") return callback(doc.soft ? "" : " ");
		if (doc.type === "group") return {
			...doc,
			contents: recursivelyMapDoc(doc.contents, callback),
			expandedStates: recursivelyMapDoc(doc.expandedStates, callback)
		};
		if ("contents" in doc) return {
			...doc,
			contents: recursivelyMapDoc(doc.contents, callback)
		};
		if ("parts" in doc) return {
			...doc,
			parts: recursivelyMapDoc(doc.parts, callback)
		};
		if (doc.type === "if-break") return {
			...doc,
			breakContents: recursivelyMapDoc(doc.breakContents, callback),
			flatContents: recursivelyMapDoc(doc.flatContents, callback)
		};
		const nextDoc = { ...doc };
		for (const [key, value] of Object.entries(nextDoc)) if (value && typeof value === "object") nextDoc[key] = recursivelyMapDoc(value, callback);
		return nextDoc;
	}
	return callback(doc);
}
var modifiedHtml = { ...html_exports };
if (modifiedHtml.printers) {
	const previousPrint = modifiedHtml.printers.html.print;
	modifiedHtml.printers.html.print = (path, options, print, args) => {
		const node = getHtmlNode(path);
		const rawPrintingResult = previousPrint(path, options, print, args);
		if (node?.type === "ieConditionalComment" || node?.kind === "ieConditionalComment") return recursivelyMapDoc(rawPrintingResult, (doc) => {
			if (typeof doc === "object" && doc.type === "line") return doc.soft ? "" : " ";
			return doc;
		});
		return rawPrintingResult;
	};
}
var defaults = {
	endOfLine: "lf",
	tabWidth: 2,
	plugins: [modifiedHtml],
	bracketSameLine: true,
	parser: "html"
};
var pretty = (str, options = {}) => {
	return Pu(str.replaceAll("\0", ""), {
		...defaults,
		...options
	});
};
var plainTextSelectors = [
	{
		selector: "img",
		format: "skip"
	},
	{
		selector: "[data-skip-in-text=true]",
		format: "skip"
	},
	{
		selector: "a",
		options: {
			linkBrackets: false,
			hideLinkHrefIfSameAsText: true
		}
	},
	{
		selector: "[data-text-format=\"dataTable\"]",
		format: "dataTable"
	}
];
function toPlainText(html, options) {
	return convert(html, {
		wordwrap: false,
		...options,
		selectors: [...plainTextSelectors, ...options?.selectors ?? []]
	});
}
var SKIPPED_TAGS = /* @__PURE__ */ new Set([
	"img",
	"noscript",
	"script",
	"style",
	"template"
]);
var WHITESPACE_RUN = /([ \t\n\r\f\u200b]+)/;
var TAG_BLOCKS = {
	article: {
		open: 2,
		close: 2
	},
	aside: {
		open: 2,
		close: 2
	},
	blockquote: {
		open: 2,
		close: 2,
		prefix: {
			first: "> ",
			rest: "> "
		}
	},
	div: {
		open: 2,
		close: 2
	},
	footer: {
		open: 2,
		close: 2
	},
	form: {
		open: 2,
		close: 2
	},
	h1: {
		open: 3,
		close: 2
	},
	h2: {
		open: 3,
		close: 2
	},
	h3: {
		open: 3,
		close: 2
	},
	h4: {
		open: 3,
		close: 2
	},
	h5: {
		open: 3,
		close: 2
	},
	h6: {
		open: 3,
		close: 2
	},
	header: {
		open: 2,
		close: 2
	},
	hr: {
		open: 2,
		close: 2
	},
	main: {
		open: 2,
		close: 2
	},
	nav: {
		open: 2,
		close: 2
	},
	p: {
		open: 2,
		close: 2
	},
	pre: {
		open: 2,
		close: 2
	},
	section: {
		open: 2,
		close: 2
	},
	table: {
		open: 2,
		close: 2
	}
};
function unstableToPlainText(html) {
	const tree = parse(html, { setAttributeMap: true });
	const body = findBody(tree);
	const blocks = [{
		block: {
			open: 0,
			close: 0
		},
		text: [],
		leading: 0,
		stash: 0,
		space: false
	}];
	const stack = [{
		parent: body,
		children: body?.body ?? tree,
		index: 0,
		pre: false,
		opened: false,
		textFrom: 0,
		orderedList: void 0
	}];
	while (stack.length > 0) {
		const frame = stack[stack.length - 1];
		const node = frame.children[frame.index];
		if (node === void 0) {
			stack.pop();
			exitElement(frame.parent, frame);
			continue;
		}
		frame.index += 1;
		enterNode(node, frame);
	}
	function top() {
		return blocks[blocks.length - 1];
	}
	function writeWord(value) {
		const block = top();
		if (block.stash > 0) block.text.push("\n".repeat(block.stash));
		else if (block.space && block.text.length > 0) block.text.push(" ");
		block.stash = 0;
		block.space = false;
		block.text.push(value);
	}
	function enterNode(node, frame) {
		if (node.type === SyntaxKind.Text) {
			const value = decodeHTML(node.value);
			if (frame.pre) {
				if (value.length > 0) writeWord(value);
			} else {
				const segments = value.split(WHITESPACE_RUN);
				for (let i = 0; i < segments.length; i++) {
					const segment = segments[i];
					if (segment.length === 0) continue;
					if (i % 2 === 1) top().space = true;
					else writeWord(segment);
				}
			}
			return;
		}
		if (SKIPPED_TAGS.has(node.name) || decodeHTMLAttribute(node.attributeMap?.["data-skip-in-text"]?.value?.value ?? "") === "true") return;
		const parentTag = frame.parent?.name;
		let block = TAG_BLOCKS[node.name];
		let orderedList;
		if (node.name === "ul") {
			const breaks = parentTag === "li" ? 1 : 2;
			block = {
				open: breaks,
				close: breaks
			};
		} else if (node.name === "li" && parentTag === "ul") block = {
			open: 1,
			close: 1,
			prefix: (stack[stack.length - 2]?.parent)?.name === "li" ? {
				first: "* ",
				rest: "  "
			} : {
				first: " * ",
				rest: "   "
			}
		};
		else if (node.name === "ol") {
			const nested = parentTag === "li";
			const parsedStart = Number.parseInt(decodeHTMLAttribute(node.attributeMap?.start?.value?.value ?? "1"), 10);
			const start = Number.isNaN(parsedStart) ? 1 : parsedStart;
			const itemCount = node.body?.filter((child) => child.type === SyntaxKind.Tag && child.name === "li").length ?? 0;
			let prefixLength = 0;
			for (let index = start; index < start + itemCount; index++) {
				const prefix = `${nested ? "" : " "}${index}. `;
				prefixLength = Math.max(prefixLength, prefix.length);
			}
			const breaks = nested ? 1 : 2;
			block = {
				open: breaks,
				close: breaks
			};
			orderedList = {
				next: start,
				prefixLength,
				nested
			};
		} else if (node.name === "li" && parentTag === "ol" && frame.orderedList) {
			const list = frame.orderedList;
			block = {
				open: 1,
				close: 1,
				prefix: {
					first: `${list.nested ? "" : " "}${list.next++}. `.padEnd(list.prefixLength),
					rest: " ".repeat(list.prefixLength)
				}
			};
		}
		if (block) blocks.push({
			block,
			text: [],
			leading: block.open,
			stash: 0,
			space: false
		});
		if (node.name === "hr") writeWord("-".repeat(40));
		else if (node.name === "br") {
			top().space = false;
			top().text.push("\n");
		}
		stack.push({
			parent: node,
			children: node.body ?? [],
			index: 0,
			pre: frame.pre || node.name === "pre",
			opened: block !== void 0,
			textFrom: top().text.length,
			orderedList
		});
	}
	function exitElement(element, frame) {
		if (element === void 0) return;
		if (element.name === "a") {
			const href = decodeHTMLAttribute(element.attributeMap?.href?.value?.value ?? "").replace(/^mailto:/, "");
			if (href.length > 0 && !href.startsWith("#")) {
				const anchorText = top().text.slice(frame.textFrom).join("");
				if (anchorText !== href) {
					if (anchorText.length > 0) top().space = true;
					writeWord(href);
				}
			}
		}
		if (frame.opened) closeBlock();
	}
	function closeBlock() {
		const child = blocks.pop();
		if (child === void 0) return;
		const parent = blocks[blocks.length - 1];
		let content = child.text.join("");
		const prefix = child.block.prefix;
		if (prefix !== void 0) {
			const trimmed = content.replace(/^\n+|\n+$/g, "");
			content = prefix.first + trimmed.replaceAll("\n", `\n${prefix.rest}`);
		}
		const breaks = Math.max(parent.stash, child.leading);
		if (parent.text.length > 0) {
			parent.text.push("\n".repeat(breaks));
			if (content.length > 0) parent.text.push(content);
		} else {
			if (content.length > 0) parent.text.push(content);
			parent.leading = breaks;
		}
		parent.stash = Math.max(child.stash, child.block.close);
	}
	return blocks[0].text.join("");
}
function findBody(tree) {
	for (const child of tree) {
		if (child.type !== SyntaxKind.Tag || child.name !== "html") continue;
		for (const inner of child.body ?? []) if (inner.type === SyntaxKind.Tag && inner.name === "body") return inner;
	}
}
function createErrorBoundary(reject) {
	if (!import_react.Component) return (props) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: props.children });
	return class ErrorBoundary extends import_react.Component {
		componentDidCatch(error) {
			reject(error);
		}
		render() {
			return this.props.children;
		}
	};
}
/**
* React injects `<link rel="preload" as="image" />` resource hints into the
* document `<head>` for every `<img>` it renders during server-side rendering.
*
* These hints are meant for browsers loading a web page, where they can speed
* up the initial paint. In an email they are dead weight: email clients ignore
* `<link rel="preload">`, and the tags only add noise to the rendered HTML.
*
* @see https://github.com/resend/react-email/issues/3034
*
* This removes only those auto-injected image preload links, leaving every
* other `<link>` (stylesheets, fonts, user-authored non-image preloads, ...)
* untouched. It parses each `<link>` tag's attributes instead of relying on a
* fixed string match, so it is not affected by attribute order or spacing.
*/
var stripImagePreloadLinks = (html) => {
	return html.replace(/<link\b[^>]*\/?>/gi, (tag) => isImagePreloadLink(tag) ? "" : tag);
};
var isImagePreloadLink = (tag) => {
	const attributes = parseAttributes(tag);
	return attributes.rel === "preload" && attributes.as === "image";
};
var ATTRIBUTE_PATTERN = /([a-z][a-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi;
/**
* Parses the attributes of a single, already-isolated HTML tag string (e.g.
* `<link rel="preload" as="image" href="..." />`) into a name → value map.
* Attribute names are lower-cased; values are read from double, single, or
* unquoted forms.
*/
var parseAttributes = (tag) => {
	const attributeSection = tag.replace(/^<[a-z][a-z0-9-]*/i, "");
	const attributes = {};
	for (const [, name, doubleQuoted, singleQuoted, unquoted] of attributeSection.matchAll(ATTRIBUTE_PATTERN)) attributes[name.toLowerCase()] = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
	return attributes;
};
var readStream = async (stream) => {
	let result = "";
	const decoder = new TextDecoder("utf-8");
	if ("pipeTo" in stream) {
		const writableStream = new WritableStream({
			write(chunk) {
				result += decoder.decode(chunk, { stream: true });
			},
			close() {
				result += decoder.decode();
			}
		});
		await stream.pipeTo(writableStream);
	} else {
		const writable = new Writable({
			write(chunk, _encoding, callback) {
				result += decoder.decode(chunk, { stream: true });
				callback();
			},
			final(callback) {
				result += decoder.decode();
				callback();
			}
		});
		await new Promise((resolve, reject) => {
			writable.on("pipe", (source) => {
				source.on("error", (err) => {
					writable.destroy(err);
				});
			});
			writable.on("error", reject);
			writable.on("close", () => {
				resolve();
			});
			stream.pipe(writable);
		});
	}
	return result;
};
var render = async (node, options) => {
	const reactDOMServer = await import("../@tanstack/react-router+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.n(), 1)).then((m) => {
		if ("default" in m) return m.default;
		return m;
	});
	let html;
	await new Promise((resolve, reject) => {
		if (Object.hasOwn(reactDOMServer, "renderToReadableStream") && typeof WritableStream !== "undefined") {
			const ErrorBoundary = createErrorBoundary(reject);
			reactDOMServer.renderToReadableStream(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorBoundary, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, { children: node }) }), {
				progressiveChunkSize: Number.POSITIVE_INFINITY,
				onError(error) {
					reject(error);
				}
			}).then(async (stream) => {
				await stream.allReady;
				return readStream(stream);
			}).then((result) => {
				html = result;
				resolve();
			}).catch(reject);
		} else {
			const ErrorBoundary = createErrorBoundary(reject);
			const stream = reactDOMServer.renderToPipeableStream(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorBoundary, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, { children: node }) }), {
				async onAllReady() {
					html = await readStream(stream).then((s) => {
						return s.replaceAll("\0", "");
					});
					resolve();
				},
				onError(error) {
					reject(error);
				},
				progressiveChunkSize: Number.POSITIVE_INFINITY
			});
		}
	});
	html = stripImagePreloadLinks(html);
	if (options?.plainText) return options.unstableTextConversion ? unstableToPlainText(html) : toPlainText(html, options.htmlToTextOptions);
	const document = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html.replace(/<!DOCTYPE.*?>/, "")}`;
	if (options?.pretty) return pretty(document);
	return document;
};
//#endregion
export { node_exports as t };
