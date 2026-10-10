import { r as __exportAll } from "../../_runtime.mjs";
import { $t as BetterAuthError, Bt as createAdapterFactory, Gt as createSchemaCheck, Ht as initGetFieldName, Jt as getExpectedSchema, Kt as registerSchemaCheck, Qt as resolveDatabaseSchemaIndexes, Ut as logger, Vt as initGetModelName, Wt as checksSchema, Xt as getDatabaseFieldIndexName, Yt as getAuthTables, Zt as getDatabaseIndexStringLength, qt as diffSchema } from "./core+[...].mjs";
import { existsSync } from "node:fs";
import path from "node:path";
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/entity.js
var entityKind = Symbol.for("drizzle:entityKind");
function is(value, type) {
	if (!value || typeof value !== "object") return false;
	if (value instanceof type) return true;
	if (!Object.prototype.hasOwnProperty.call(type, entityKind)) throw new Error(`Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`);
	let cls = Object.getPrototypeOf(value)?.constructor;
	if (cls) while (cls) {
		if (entityKind in cls && cls[entityKind] === type[entityKind]) return true;
		cls = Object.getPrototypeOf(cls);
	}
	return false;
}
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/column-common.js
var OriginalColumn = Symbol.for("drizzle:OriginalColumn");
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/column.js
var noop = (v) => v;
noop.isNoop = true;
var Column = class {
	static [entityKind] = "Column";
	/** @internal */
	codec;
	name;
	keyAsName;
	primary;
	notNull;
	default;
	defaultFn;
	onUpdateFn;
	hasDefault;
	isUnique;
	uniqueName;
	uniqueType;
	dataType;
	columnType;
	enumValues = void 0;
	generated = void 0;
	generatedIdentity = void 0;
	length;
	isLengthExact;
	isAlias;
	/** @internal */
	config;
	/** @internal */
	table;
	/** @internal */
	onInit() {}
	constructor(table, config) {
		this.config = config;
		this.onInit();
		this.table = table;
		this.name = config.name;
		this.isAlias = false;
		this.keyAsName = config.keyAsName;
		this.notNull = config.notNull;
		this.default = config.default;
		this.defaultFn = config.defaultFn;
		this.onUpdateFn = config.onUpdateFn;
		this.hasDefault = config.hasDefault;
		this.primary = config.primaryKey;
		this.isUnique = config.isUnique;
		this.uniqueName = config.uniqueName;
		this.uniqueType = config.uniqueType;
		this.dataType = config.dataType;
		this.columnType = config.columnType;
		this.generated = config.generated;
		this.generatedIdentity = config.generatedIdentity;
		this.length = config["length"];
		this.isLengthExact = config["isLengthExact"];
	}
	mapFromDriverValue = noop;
	mapToDriverValue = noop;
	/** @internal */
	postBuild() {
		return this;
	}
	/** @internal */
	shouldDisableInsert() {
		return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
	}
	/** @internal */
	[OriginalColumn]() {
		return this;
	}
};
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/table.utils.js
/** @internal */
var TableName = Symbol.for("drizzle:Name");
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/table.js
/** @internal */
var TableSchema = Symbol.for("drizzle:Schema");
/** @internal */
var TableColumns = Symbol.for("drizzle:Columns");
/** @internal */
var ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
/** @internal */
var OriginalName = Symbol.for("drizzle:OriginalName");
/** @internal */
var BaseName = Symbol.for("drizzle:BaseName");
/** @internal */
var IsAlias = Symbol.for("drizzle:IsAlias");
/** @internal */
var ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
	static [entityKind] = "Table";
	/** @internal */
	static Symbol = {
		Name: TableName,
		Schema: TableSchema,
		OriginalName,
		Columns: TableColumns,
		ExtraConfigColumns,
		BaseName,
		IsAlias,
		ExtraConfigBuilder
	};
	/**
	* @internal
	* Can be changed if the table is aliased.
	*/
	[TableName];
	/**
	* @internal
	* Used to store the original name of the table, before any aliasing.
	*/
	[OriginalName];
	/** @internal */
	[TableSchema];
	/** @internal */
	[TableColumns];
	/** @internal */
	[ExtraConfigColumns];
	/**
	*  @internal
	* Used to store the table name before the transformation via the `tableCreator` functions.
	*/
	[BaseName];
	/** @internal */
	[IsAlias] = false;
	/** @internal */
	[IsDrizzleTable] = true;
	/** @internal */
	[ExtraConfigBuilder] = void 0;
	constructor(name, schema, baseName) {
		this[TableName] = this[OriginalName] = name;
		this[TableSchema] = schema;
		this[BaseName] = baseName;
	}
};
function getTableName(table) {
	return table[TableName];
}
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/subquery.js
var Subquery = class {
	static [entityKind] = "Subquery";
	constructor(sql, fields, alias, isWith = false, usedTables = []) {
		this._ = {
			brand: "Subquery",
			sql,
			selectedFields: fields,
			alias,
			isWith,
			usedTables
		};
	}
};
var WithSubquery = class extends Subquery {
	static [entityKind] = "WithSubquery";
};
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
	return fn(...args);
}
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/tracing.js
/** @internal */
var tracer = { startActiveSpan(name, fn) {
	return fn();
} };
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/sql/sql.js
function isSQLWrapper(value) {
	return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
	const result = {
		sql: "",
		params: []
	};
	for (const query of queries) {
		result.sql += query.sql;
		result.params.push(...query.params);
	}
	return result;
}
function _mergeQueries(queries) {
	const result = {
		sql: "",
		params: []
	};
	const sqls = [];
	for (const query of queries) {
		sqls.push(query.sql);
		result.params.push(...query.params);
	}
	result._sql = Object.assign(sqls, { raw: sqls });
	return result;
}
var StringChunk = class {
	static [entityKind] = "StringChunk";
	value;
	constructor(value) {
		this.value = Array.isArray(value) ? value : [value];
	}
	getSQL() {
		return new SQL([this]);
	}
};
var SQL = class SQL {
	static [entityKind] = "SQL";
	/** @internal */
	decoder = noopDecoder;
	/** @internal */
	shouldInlineParams = false;
	/** @internal */
	usedTables = [];
	constructor(queryChunks) {
		this.queryChunks = queryChunks;
		for (const chunk of queryChunks) if (is(chunk, Table)) {
			const schemaName = chunk[Table.Symbol.Schema];
			this.usedTables.push(schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]);
		}
	}
	append(query) {
		this.queryChunks.push(...query.queryChunks);
		return this;
	}
	toQuery(config) {
		return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
			const query = this.buildQueryFromSourceParams(this.queryChunks, config);
			span?.setAttributes({
				"drizzle.query.text": query.sql,
				"drizzle.query.params": JSON.stringify(query.params)
			});
			return query;
		});
	}
	buildQueryFromSourceParams(chunks, _config) {
		const config = Object.assign({}, _config, {
			inlineParams: _config.inlineParams || this.shouldInlineParams,
			paramStartIndex: _config.paramStartIndex || { value: 0 }
		});
		const { escapeName, escapeParam, codecs, inlineParams, paramStartIndex, invokeSource } = config;
		const mappedChunks = chunks.map((chunk) => {
			if (is(chunk, StringChunk)) return {
				sql: chunk.value.join(""),
				params: []
			};
			if (is(chunk, Name)) return {
				sql: escapeName(chunk.value),
				params: []
			};
			if (chunk === void 0) return {
				sql: "",
				params: []
			};
			if (Array.isArray(chunk)) {
				const result = [new StringChunk("(")];
				for (const [i, p] of chunk.entries()) {
					result.push(p);
					if (i < chunk.length - 1) result.push(new StringChunk(", "));
				}
				result.push(new StringChunk(")"));
				return this.buildQueryFromSourceParams(result, config);
			}
			if (is(chunk, SQL)) return this.buildQueryFromSourceParams(chunk.queryChunks, {
				...config,
				inlineParams: inlineParams || chunk.shouldInlineParams
			});
			if (is(chunk, Table)) {
				const schemaName = chunk[Table.Symbol.Schema];
				const tableName = chunk[Table.Symbol.Name];
				if (invokeSource === "mssql-view-with-schemabinding") return {
					sql: (schemaName === void 0 ? escapeName("dbo") : escapeName(schemaName)) + "." + escapeName(tableName),
					params: []
				};
				return {
					sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
					params: []
				};
			}
			if (is(chunk, Column)) {
				const columnName = chunk.name;
				if (_config.invokeSource === "indexes") return {
					sql: escapeName(columnName),
					params: []
				};
				const schemaName = invokeSource === "mssql-check" ? void 0 : chunk.table[Table.Symbol.Schema];
				return {
					sql: chunk.isAlias ? escapeName(chunk.name) : chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
					params: []
				};
			}
			if (is(chunk, View)) {
				const schemaName = chunk[ViewBaseConfig].schema;
				const viewName = chunk[ViewBaseConfig].name;
				return {
					sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
					params: []
				};
			}
			if (is(chunk, Param)) {
				if (is(chunk.value, SQL)) return this.buildQueryFromSourceParams([chunk.value], config);
				const useCodecs = codecs && is(chunk.encoder, Column);
				if (is(chunk.value, Placeholder)) {
					const escaped = escapeParam(paramStartIndex.value++, chunk);
					chunk.codec = useCodecs ? (value) => codecs.apply(chunk.encoder, "normalizeParam", value) : void 0;
					return {
						sql: useCodecs ? codecs.apply(chunk.encoder, "castParam", escaped) : escaped,
						params: [chunk]
					};
				}
				let mappedValue;
				if (chunk.value === null) mappedValue = chunk.value;
				else {
					mappedValue = chunk.encoder.mapToDriverValue.isNoop ? chunk.value : chunk.encoder.mapToDriverValue(chunk.value);
					if (is(mappedValue, SQL)) return this.buildQueryFromSourceParams([mappedValue], config);
					if (useCodecs) mappedValue = codecs.apply(chunk.encoder, "normalizeParam", mappedValue);
				}
				if (inlineParams) return {
					sql: this.mapInlineParam(mappedValue, config),
					params: []
				};
				const escaped = escapeParam(paramStartIndex.value++, mappedValue);
				return {
					sql: useCodecs ? codecs.apply(chunk.encoder, "castParam", escaped) : escaped,
					params: [mappedValue]
				};
			}
			if (is(chunk, Placeholder)) return {
				sql: escapeParam(paramStartIndex.value++, chunk),
				params: [chunk]
			};
			if (is(chunk, SQL.Aliased) && chunk.fieldAlias !== void 0) return {
				sql: (chunk.origin !== void 0 ? escapeName(chunk.origin) + "." : "") + escapeName(chunk.fieldAlias),
				params: []
			};
			if (is(chunk, Subquery)) {
				if (chunk._.isWith) return {
					sql: escapeName(chunk._.alias),
					params: []
				};
				return this.buildQueryFromSourceParams([
					new StringChunk("("),
					chunk._.sql,
					new StringChunk(") "),
					new Name(chunk._.alias)
				], config);
			}
			if (typeof chunk === "function" && "enumName" in chunk) {
				if ("schema" in chunk && chunk.schema) return {
					sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName),
					params: []
				};
				return {
					sql: escapeName(chunk.enumName),
					params: []
				};
			}
			if (isSQLWrapper(chunk)) {
				if (chunk.shouldOmitSQLParens?.()) return this.buildQueryFromSourceParams([chunk.getSQL()], config);
				return this.buildQueryFromSourceParams([
					new StringChunk("("),
					chunk.getSQL(),
					new StringChunk(")")
				], config);
			}
			if (inlineParams) return {
				sql: this.mapInlineParam(chunk, config),
				params: []
			};
			return {
				sql: escapeParam(paramStartIndex.value++, chunk),
				params: [chunk]
			};
		});
		if (_config.tagged) return _mergeQueries(mappedChunks);
		return mergeQueries(mappedChunks);
	}
	mapInlineParam(chunk, { escapeString }) {
		if (chunk === null) return "null";
		if (typeof chunk === "number" || typeof chunk === "boolean" || typeof chunk === "bigint") return chunk.toString();
		if (typeof chunk === "string") return escapeString(chunk);
		if (typeof chunk === "object") {
			const mappedValueAsString = chunk.toString();
			if (mappedValueAsString === "[object Object]") return escapeString(JSON.stringify(chunk));
			return escapeString(mappedValueAsString);
		}
		throw new Error("Unexpected param value: " + chunk);
	}
	getSQL() {
		return this;
	}
	as(alias) {
		if (alias === void 0) return this;
		return new SQL.Aliased(this, alias);
	}
	mapWith(decoder) {
		this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
		return this;
	}
	nullable() {
		return this;
	}
	inlineParams() {
		this.shouldInlineParams = true;
		return this;
	}
	/**
	* This method is used to conditionally include a part of the query.
	*
	* @param condition - Condition to check
	* @returns itself if the condition is `true`, otherwise `undefined`
	*/
	if(condition) {
		return condition ? this : void 0;
	}
};
/**
* Any DB name (table, column, index etc.)
*/
var Name = class {
	static [entityKind] = "Name";
	brand;
	constructor(value) {
		this.value = value;
	}
	getSQL() {
		return new SQL([this]);
	}
};
function isDriverValueEncoder(value) {
	return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = { mapFromDriverValue: (value) => value };
noopDecoder.mapFromDriverValue.isNoop = true;
var noopEncoder = { mapToDriverValue: (value) => value };
noopEncoder.mapToDriverValue.isNoop = true;
({
	...noopDecoder,
	...noopEncoder
});
/** Parameter value that is optionally bound to an encoder (for example, a column). */
var Param = class {
	static [entityKind] = "Param";
	brand;
	/**
	* @param value - Parameter value
	* @param encoder - Encoder to convert the value to a driver parameter
	*/
	constructor(value, encoder = noopEncoder, codec) {
		this.value = value;
		this.encoder = encoder;
		this.codec = codec;
	}
	getSQL() {
		return new SQL([this]);
	}
};
function sql(strings, ...params) {
	const queryChunks = [];
	if (params.length > 0 || strings.length > 0 && strings[0] !== "") queryChunks.push(new StringChunk(strings[0]));
	for (const [paramIndex, param] of params.entries()) queryChunks.push(param, new StringChunk(strings[paramIndex + 1]));
	return new SQL(queryChunks);
}
(function(_sql) {
	function empty() {
		return new SQL([]);
	}
	_sql.empty = empty;
	function fromList(list) {
		return new SQL(list);
	}
	_sql.fromList = fromList;
	function raw(str) {
		return new SQL([new StringChunk(str)]);
	}
	_sql.raw = raw;
	function join(chunks, separator) {
		const result = [];
		for (const [i, chunk] of chunks.entries()) {
			if (i > 0 && separator !== void 0) result.push(separator);
			result.push(chunk);
		}
		return new SQL(result);
	}
	_sql.join = join;
	function identifier(value) {
		return new Name(value);
	}
	_sql.identifier = identifier;
	function placeholder(name) {
		return new Placeholder(name);
	}
	_sql.placeholder = placeholder;
	function param(value, encoder) {
		return new Param(value, encoder);
	}
	_sql.param = param;
	function comment(input) {
		const encoded = sqlCommenter(input);
		if (!encoded.length) return void 0;
		return sql.raw(encoded);
	}
	_sql.comment = comment;
})(sql || (sql = {}));
function sqlCommenter(input) {
	const encoded = sqlCommenter.encodeInput(input);
	if (!encoded.length) return "";
	return `/*${encoded}*/`;
}
(function(_sqlCommenter) {
	function merge(input1, input2) {
		let encoded;
		if (typeof input1 === "object" && typeof input2 === "object") encoded = encodeInput({
			...input1,
			...input2
		});
		else if (input1 && input2) encoded = [encodeInput(input1), encodeInput(input2)].filter((i) => i.length).join(",");
		else if (input2) encoded = encodeInput(input2);
		else if (input1) encoded = encodeInput(input1);
		else return "";
		if (!encoded.length) return "";
		return `/*${encoded}*/`;
	}
	_sqlCommenter.merge = merge;
	function encodeInput(input) {
		if (typeof input === "string") {
			if (!input.length) return input;
			return sanitizeStringInput(input);
		}
		const parts = [];
		for (const [key, value] of Object.entries(input)) {
			if (value === null || value === void 0 || value === "") continue;
			const encodedKey = sanitizeObjectElement(key);
			const encodedValue = sanitizeObjectElement(String(value));
			parts.push(`${encodedKey}='${encodedValue}'`);
		}
		if (!parts.length) return "";
		return parts.sort().join(",");
	}
	_sqlCommenter.encodeInput = encodeInput;
	function sanitizeObjectElement(key) {
		return encodeURIComponent(key).replace(/'/g, `\\'`);
	}
	_sqlCommenter.sanitizeObjectElement = sanitizeObjectElement;
	function sanitizeStringInput(input) {
		return input.replace(/\/\*/g, "/ *").replace(/\*\//g, "* /");
	}
	_sqlCommenter.sanitizeStringInput = sanitizeStringInput;
})(sqlCommenter || (sqlCommenter = {}));
(function(_SQL) {
	class Aliased {
		static [entityKind] = "SQL.Aliased";
		/** @internal */
		isSelectionField = false;
		/** @internal */
		origin;
		constructor(sql, fieldAlias) {
			this.sql = sql;
			this.fieldAlias = fieldAlias;
		}
		getSQL() {
			return this.sql;
		}
		/** @internal */
		clone() {
			return new Aliased(this.sql, this.fieldAlias);
		}
	}
	_SQL.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
	static [entityKind] = "Placeholder";
	constructor(name) {
		this.name = name;
	}
	getSQL() {
		return new SQL([this]);
	}
};
function fillPlaceholders(params, values) {
	return params.map((p) => {
		if (is(p, Placeholder)) {
			if (!(p.name in values)) throw new Error(`No value for placeholder "${p.name}" was provided`);
			return values[p.name];
		}
		if (is(p, Param) && is(p.value, Placeholder)) {
			if (!(p.value.name in values)) throw new Error(`No value for placeholder "${p.value.name}" was provided`);
			const value = values[p.value.name];
			if (value === null) return value;
			const mapped = p.encoder.mapToDriverValue.isNoop ? value : p.encoder.mapToDriverValue(value);
			return p.codec ? p.codec(mapped) : mapped;
		}
		return p;
	});
}
var IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");
var View = class {
	static [entityKind] = "View";
	/** @internal */
	[ViewBaseConfig];
	/** @internal */
	[IsDrizzleView] = true;
	/** @internal */
	get [TableName]() {
		return this[ViewBaseConfig].name;
	}
	/** @internal */
	get [TableSchema]() {
		return this[ViewBaseConfig].schema;
	}
	/** @internal */
	get [IsAlias]() {
		return this[ViewBaseConfig].isAlias;
	}
	/** @internal */
	get [OriginalName]() {
		return this[ViewBaseConfig].originalName;
	}
	/** @internal */
	get [TableColumns]() {
		return this[ViewBaseConfig].selectedFields;
	}
	constructor({ name, schema, selectedFields, query }) {
		this[ViewBaseConfig] = {
			name,
			originalName: name,
			schema,
			selectedFields,
			query,
			isExisting: !query,
			isAlias: false
		};
	}
};
Column.prototype.getSQL = function() {
	return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
	return new SQL([this]);
};
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
	if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) return new Param(value, column);
	return value;
}
/**
* Test that two values are equal.
*
* Remember that the SQL standard dictates that
* two NULL values are not equal, so if you want to test
* whether a value is null, you may want to use
* `isNull` instead.
*
* ## Examples
*
* ```ts
* // Select cars made by Ford
* db.select().from(cars)
*   .where(eq(cars.make, 'Ford'))
* ```
*
* @see isNull for a way to test equality to NULL.
*/
var eq = (left, right) => {
	return sql`${left} = ${bindIfParam(right, left)}`;
};
/**
* Test that two values are not equal.
*
* Remember that the SQL standard dictates that
* two NULL values are not equal, so if you want to test
* whether a value is not null, you may want to use
* `isNotNull` instead.
*
* ## Examples
*
* ```ts
* // Select cars not made by Ford
* db.select().from(cars)
*   .where(ne(cars.make, 'Ford'))
* ```
*
* @see isNotNull for a way to test whether a value is not null.
*/
var ne = (left, right) => {
	return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
	const conditions = unfilteredConditions.filter((c) => c !== void 0);
	if (conditions.length === 0) return;
	if (conditions.length === 1) return new SQL(conditions);
	return new SQL([
		new StringChunk("("),
		sql.join(conditions.map((c) => sql`(${c})`), new StringChunk(" and ")),
		new StringChunk(")")
	]);
}
function or(...unfilteredConditions) {
	const conditions = unfilteredConditions.filter((c) => c !== void 0);
	if (conditions.length === 0) return;
	if (conditions.length === 1) return new SQL(conditions);
	return new SQL([
		new StringChunk("("),
		sql.join(conditions.map((c) => sql`(${c})`), new StringChunk(" or ")),
		new StringChunk(")")
	]);
}
/**
* Negate the meaning of an expression using the `not` keyword.
*
* ## Examples
*
* ```ts
* // Select cars _not_ made by GM or Ford.
* db.select().from(cars)
*   .where(not(inArray(cars.make, ['GM', 'Ford'])))
* ```
*/
function not(condition) {
	return is(condition, SQL) ? sql`not (${condition})` : sql`not ${condition}`;
}
/**
* Test that the first expression passed is greater than
* the second expression.
*
* ## Examples
*
* ```ts
* // Select cars made after 2000.
* db.select().from(cars)
*   .where(gt(cars.year, 2000))
* ```
*
* @see gte for greater-than-or-equal
*/
var gt = (left, right) => {
	return sql`${left} > ${bindIfParam(right, left)}`;
};
/**
* Test that the first expression passed is greater than
* or equal to the second expression. Use `gt` to
* test whether an expression is strictly greater
* than another.
*
* ## Examples
*
* ```ts
* // Select cars made on or after 2000.
* db.select().from(cars)
*   .where(gte(cars.year, 2000))
* ```
*
* @see gt for a strictly greater-than condition
*/
var gte = (left, right) => {
	return sql`${left} >= ${bindIfParam(right, left)}`;
};
/**
* Test that the first expression passed is less than
* the second expression.
*
* ## Examples
*
* ```ts
* // Select cars made before 2000.
* db.select().from(cars)
*   .where(lt(cars.year, 2000))
* ```
*
* @see lte for less-than-or-equal
*/
var lt = (left, right) => {
	return sql`${left} < ${bindIfParam(right, left)}`;
};
/**
* Test that the first expression passed is less than
* or equal to the second expression.
*
* ## Examples
*
* ```ts
* // Select cars made before 2000.
* db.select().from(cars)
*   .where(lte(cars.year, 2000))
* ```
*
* @see lt for a strictly less-than condition
*/
var lte = (left, right) => {
	return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
	if (Array.isArray(values)) {
		if (values.length === 0) return sql`false`;
		return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
	}
	return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
	if (Array.isArray(values)) {
		if (values.length === 0) return sql`true`;
		return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
	}
	return sql`${column} not in ${bindIfParam(values, column)}`;
}
/**
* Test whether an expression is NULL. By the SQL standard,
* NULL is neither equal nor not equal to itself, so
* it's recommended to use `isNull` and `notIsNull` for
* comparisons to NULL.
*
* ## Examples
*
* ```ts
* // Select cars that have no discontinuedAt date.
* db.select().from(cars)
*   .where(isNull(cars.discontinuedAt))
* ```
*
* @see isNotNull for the inverse of this test
*/
function isNull(value) {
	return sql`(${value} is null)`;
}
/**
* Test whether an expression is not NULL. By the SQL standard,
* NULL is neither equal nor not equal to itself, so
* it's recommended to use `isNull` and `notIsNull` for
* comparisons to NULL.
*
* ## Examples
*
* ```ts
* // Select cars that have been discontinued.
* db.select().from(cars)
*   .where(isNotNull(cars.discontinuedAt))
* ```
*
* @see isNull for the inverse of this test
*/
function isNotNull(value) {
	return sql`(${value} is not null)`;
}
/**
* Test whether a subquery evaluates to have any rows.
*
* ## Examples
*
* ```ts
* // Users whose `homeCity` column has a match in a cities
* // table.
* db
*   .select()
*   .from(users)
*   .where(
*     exists(db.select()
*       .from(cities)
*       .where(eq(users.homeCity, cities.id))),
*   );
* ```
*
* @see notExists for the inverse of this test
*/
function exists(subquery) {
	return sql`exists ${subquery}`;
}
/**
* Test whether a subquery doesn't include any result
* rows.
*
* ## Examples
*
* ```ts
* // Users whose `homeCity` column doesn't match
* // a row in the cities table.
* db
*   .select()
*   .from(users)
*   .where(
*     notExists(db.select()
*       .from(cities)
*       .where(eq(users.homeCity, cities.id))),
*   );
* ```
*
* @see exists for the inverse of this test
*/
function notExists(subquery) {
	return sql`not exists ${subquery}`;
}
function between(column, min, max) {
	return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(max, column)}`;
}
function notBetween(column, min, max) {
	return sql`${column} not between ${bindIfParam(min, column)} and ${bindIfParam(max, column)}`;
}
/**
* Compare a column to a pattern, which can include `%` and `_`
* characters to match multiple variations. Including `%`
* in the pattern matches zero or more characters, and including
* `_` will match a single character.
*
* ## Examples
*
* ```ts
* // Select all cars with 'Turbo' in their names.
* db.select().from(cars)
*   .where(like(cars.name, '%Turbo%'))
* ```
*
* @see ilike for a case-insensitive version of this condition
*/
function like(column, value) {
	return sql`${column} like ${value}`;
}
/**
* The inverse of like - this tests that a given column
* does not match a pattern, which can include `%` and `_`
* characters to match multiple variations. Including `%`
* in the pattern matches zero or more characters, and including
* `_` will match a single character.
*
* ## Examples
*
* ```ts
* // Select all cars that don't have "ROver" in their name.
* db.select().from(cars)
*   .where(notLike(cars.name, '%Rover%'))
* ```
*
* @see like for the inverse condition
* @see notIlike for a case-insensitive version of this condition
*/
function notLike(column, value) {
	return sql`${column} not like ${value}`;
}
/**
* Case-insensitively compare a column to a pattern,
* which can include `%` and `_`
* characters to match multiple variations. Including `%`
* in the pattern matches zero or more characters, and including
* `_` will match a single character.
*
* Unlike like, this performs a case-insensitive comparison.
*
* ## Examples
*
* ```ts
* // Select all cars with 'Turbo' in their names.
* db.select().from(cars)
*   .where(ilike(cars.name, '%Turbo%'))
* ```
*
* @see like for a case-sensitive version of this condition
*/
function ilike(column, value) {
	return sql`${column} ilike ${value}`;
}
/**
* The inverse of ilike - this case-insensitively tests that a given column
* does not match a pattern, which can include `%` and `_`
* characters to match multiple variations. Including `%`
* in the pattern matches zero or more characters, and including
* `_` will match a single character.
*
* ## Examples
*
* ```ts
* // Select all cars that don't have "Rover" in their name.
* db.select().from(cars)
*   .where(notLike(cars.name, '%Rover%'))
* ```
*
* @see ilike for the inverse condition
* @see notLike for a case-sensitive version of this condition
*/
function notIlike(column, value) {
	return sql`${column} not ilike ${value}`;
}
function arrayContains(column, values) {
	if (Array.isArray(values)) {
		if (values.length === 0) throw new Error("arrayContains requires at least one value");
		const par = bindIfParam(values, column);
		return sql`${column} @> ${sql`${Array.isArray(par) ? new Param(par) : par}`}`;
	}
	return sql`${column} @> ${bindIfParam(values, column)}`;
}
function arrayContained(column, values) {
	if (Array.isArray(values)) {
		if (values.length === 0) throw new Error("arrayContained requires at least one value");
		const par = bindIfParam(values, column);
		return sql`${column} <@ ${sql`${Array.isArray(par) ? new Param(par) : par}`}`;
	}
	return sql`${column} <@ ${bindIfParam(values, column)}`;
}
function arrayOverlaps(column, values) {
	if (Array.isArray(values)) {
		if (values.length === 0) throw new Error("arrayOverlaps requires at least one value");
		const par = bindIfParam(values, column);
		return sql`${column} && ${sql`${Array.isArray(par) ? new Param(par) : par}`}`;
	}
	return sql`${column} && ${bindIfParam(values, column)}`;
}
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/sql/expressions/select.js
/**
* Used in sorting, this specifies that the given
* column or expression should be sorted in ascending
* order. By the SQL standard, ascending order is the
* default, so it is not usually necessary to specify
* ascending sort order.
*
* ## Examples
*
* ```ts
* // Return cars, starting with the oldest models
* // and going in ascending order to the newest.
* db.select().from(cars)
*   .orderBy(asc(cars.year));
* ```
*
* @see desc to sort in descending order
*/
function asc(column) {
	return sql`${column} asc`;
}
/**
* Used in sorting, this specifies that the given
* column or expression should be sorted in descending
* order.
*
* ## Examples
*
* ```ts
* // Select users, with the most recently created
* // records coming first.
* db.select().from(users)
*   .orderBy(desc(users.createdAt));
* ```
*
* @see asc to sort in ascending order
*/
function desc(column) {
	return sql`${column} desc`;
}
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/utils.js
/** @internal bypass bundle-time filtering */
var FnConstructor = Object.getPrototypeOf(() => null).constructor;
/** @internal */
function makeJitQueryMapperInner(columns, joinsNotNullableMap = {}) {
	const preFn = [];
	const fn = [];
	fn.push(`const [ ${columns.map((_, i) => `c${i}`).join(", ")} ] = rows[i];`);
	const nullifyMap = {};
	const objectIds = {};
	const decodes = Array.from({ length: columns.length });
	for (let idx = 0; idx < columns.length; ++idx) {
		const { field, path, codec, arrayDimensions } = columns[idx];
		let decoder;
		let decoderStr;
		let decoderFieldDestructure;
		let isColumn = false;
		if (is(field, Column)) {
			isColumn = true;
			decoder = field;
			decoderFieldDestructure = `field: decoder${idx}`;
		} else if (is(field, SQL)) {
			decoder = field.decoder;
			decoderFieldDestructure = `field: { decoder: decoder${idx} }`;
		} else if (is(field, Subquery)) {
			decoder = field._.sql.decoder;
			decoderFieldDestructure = `field: { _: { sql: { decoder: decoder${idx} } } }`;
		} else {
			decoder = field.sql.decoder;
			decoderFieldDestructure = `field: { sql: { decoder: decoder${idx} } }`;
		}
		decoderStr = `decoder${idx}.mapFromDriverValue`;
		if (decoder.mapFromDriverValue.isNoop) decoderStr = "";
		if (decoderStr) preFn.push(`const { ${decoderFieldDestructure}${codec ? `, codec: codec${idx}` : ""} } = columns[${idx}];`);
		else if (codec) preFn.push(`const { codec: codec${idx} } = columns[${idx}];`);
		const colStr = `c${idx}`;
		let decodedValue = colStr;
		if (codec) decodedValue = `codec${idx}(${decodedValue}, ${arrayDimensions})`;
		if (decoderStr) decodedValue = `${decoderStr}(${decodedValue})`;
		decodes[idx] = colStr === decodedValue ? `${colStr}` : `${colStr} === null ? ${colStr} : ${decodedValue}`;
		if (path.length !== 2 || !isColumn) continue;
		if (objectIds[path[0]] === void 0) objectIds[path[0]] = [`c${idx}`];
		else objectIds[path[0]]?.push(`c${idx}`);
		const [objectName] = path;
		const tableName = getTableName(field.table);
		nullifyMap[objectName] = joinsNotNullableMap[tableName] ? false : typeof nullifyMap[objectName] === "string" ? nullifyMap[objectName] === tableName ? tableName : false : tableName;
	}
	fn.push(`mapped[i] = {`);
	let currentObjectPath = [];
	for (let idx = 0; idx < columns.length; ++idx) {
		const { path } = columns[idx];
		const jsonPath = path.map((e) => JSON.stringify(e));
		const decodedValue = decodes[idx];
		const objectPath = path.slice(0, -1);
		let commonLen = 0;
		while (commonLen < currentObjectPath.length && commonLen < objectPath.length && currentObjectPath[commonLen] === objectPath[commonLen]) commonLen++;
		for (let d = currentObjectPath.length - 1; d >= commonLen; --d) fn.push(`${"	".repeat(d + 1)}},`);
		for (let d = commonLen; d < objectPath.length; ++d) fn.push(`${"	".repeat(d + 1)}${jsonPath[d]}: ${d === 0 && objectPath.length === 1 && typeof nullifyMap[path[0]] === "string" ? `${objectIds[path[0]]?.map((c) => `${c} === null`).join(" && ")} ? null : {` : "{"}`);
		currentObjectPath = objectPath;
		fn.push(`${"	".repeat(path.length)}${jsonPath[path.length - 1]}: ${decodedValue},`);
	}
	for (let d = currentObjectPath.length - 1; d >= 0; --d) fn.push(`${"	".repeat(d + 1)}},`);
	fn.push(`};`);
	return `${preFn.length ? `${preFn.join("\n	")}\n\t` : ""}for (let i = 0; i < length; ++i) {
		${fn.join("\n		")}
	}`;
}
function makeJitQueryMapper(columns, joinsNotNullableMap) {
	const internals = `\t"use strict";
	const { columns } = this;
	const { length } = rows;
	const mapped = Array.from({ length });
	${makeJitQueryMapperInner(columns, joinsNotNullableMap)}
	return mapped;
	//# sourceURL=drizzle:jit-query-mapper`;
	return Object.assign(new FnConstructor("rows", internals).bind({ columns }), { body: `function jitQueryMapper (rows) {\n${internals}\n}` });
}
/** @internal */
function jitCompatCheck(isEnabled) {
	if (!isEnabled) return false;
	try {
		const res = new FnConstructor("input", "\"use strict\"; return input;")(true);
		if (res !== true) {
			console.warn("Unable to use jit mappers due to incompatibility: corrupted jit function output.\nFalling back to premade mappers.\nError details:");
			console.error(`Expected to receive \`true\`, got: ${res}`);
		}
		return true;
	} catch (e) {
		console.warn("Unable to use jit mappers due to incompatibility.\nFalling back to premade mappers.\nError details:");
		console.error(e);
		return false;
	}
}
function makeDefaultQueryMapper(columns, joinsNotNullableMap) {
	const interpretedData = columns.map(({ field, codec, arrayDimensions, path }) => {
		let processNullifyMap;
		let decoderSrc;
		if (is(field, Column)) {
			decoderSrc = field;
			if (joinsNotNullableMap && path.length === 2) {
				const objectName = path[0];
				processNullifyMap = (nullifyMap, value) => {
					if (!(objectName in nullifyMap)) nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
					else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) nullifyMap[objectName] = false;
				};
			}
		} else if (is(field, SQL)) decoderSrc = field.decoder;
		else if (is(field, Subquery)) decoderSrc = field._.sql.decoder;
		else decoderSrc = field.sql.decoder;
		let decoder;
		if (decoderSrc.mapFromDriverValue.isNoop) decoder = codec ? (v) => codec(v, arrayDimensions) : void 0;
		else decoder = codec ? (v) => decoderSrc.mapFromDriverValue(codec(v, arrayDimensions)) : (v) => decoderSrc.mapFromDriverValue(v);
		return [decoder, processNullifyMap];
	});
	return ((rows) => rows.map((row) => {
		const nullifyMap = {};
		const result = columns.reduce((result, { path }, columnIndex) => {
			let node = result;
			for (const [pathChunkIndex, pathChunk] of path.entries()) if (pathChunkIndex < path.length - 1) {
				if (!(pathChunk in node)) node[pathChunk] = {};
				node = node[pathChunk];
			} else {
				const [decoder, processNullifyMap] = interpretedData[columnIndex];
				const rawValue = row[columnIndex];
				const value = node[pathChunk] = rawValue === null ? null : decoder ? decoder(rawValue) : rawValue;
				processNullifyMap?.(nullifyMap, value);
			}
			return result;
		}, {});
		if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
			for (const [objectName, tableName] of Object.entries(nullifyMap)) if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) result[objectName] = null;
		}
		return result;
	}));
}
/** @internal */
function orderSelectedFields(fields, pathPrefix, codecs) {
	return Object.entries(fields).reduce((result, [name, field]) => {
		if (typeof name !== "string") return result;
		const newPath = pathPrefix ? [...pathPrefix, name] : [name];
		if (is(field, Column)) result.push({
			path: newPath,
			field,
			codec: codecs?.get(field, "normalize"),
			arrayDimensions: field.dimensions,
			column: field
		});
		else if (is(field, SQL) || is(field, SQL.Aliased)) {
			const col = getColumnFromDecoder(field);
			result.push(col ? {
				path: newPath,
				field,
				codec: codecs?.get(col, "normalize"),
				arrayDimensions: col.dimensions,
				column: col
			} : {
				path: newPath,
				field
			});
		} else if (is(field, Subquery)) {
			let column;
			const entry = Object.values(field._.selectedFields)[0];
			let fieldDecoder;
			if (is(entry, Column)) {
				column = entry;
				fieldDecoder = entry;
			} else if (is(entry, SQL)) {
				column = getColumnFromDecoder(entry);
				fieldDecoder = entry.decoder;
			} else {
				column = getColumnFromDecoder(entry);
				fieldDecoder = entry.sql.decoder;
			}
			if (fieldDecoder) field._.sql.decoder = fieldDecoder;
			result.push(column ? {
				path: newPath,
				field,
				codec: codecs?.get(column, "normalize"),
				arrayDimensions: column.dimensions,
				column
			} : {
				path: newPath,
				field
			});
		} else if (is(field, Table)) result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath, codecs));
		else result.push(...orderSelectedFields(field, newPath, codecs));
		return result;
	}, []);
}
function getColumnFromDecoder(source) {
	const query = source.getSQL();
	if (is(query.decoder, Column)) return query.decoder;
}
function haveSameKeys(left, right) {
	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	if (leftKeys.length !== rightKeys.length) return false;
	for (const [index, key] of leftKeys.entries()) if (key !== rightKeys[index]) return false;
	return true;
}
/** @internal */
function mapUpdateSet(table, values) {
	const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
		if (is(value, SQL) || is(value, Column)) return [key, value];
		else return [key, new Param(value, table[Table.Symbol.Columns][key])];
	});
	if (entries.length === 0) throw new Error("No values to set");
	return Object.fromEntries(entries);
}
/** @internal */
function applyMixins(baseClass, extendedClasses) {
	for (const extendedClass of extendedClasses) for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
		if (name === "constructor") continue;
		Object.defineProperty(baseClass.prototype, name, Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || Object.create(null));
	}
}
/**
* @deprecated
* Use `getColumns` instead
*/
function getTableColumns(table) {
	return table[Table.Symbol.Columns];
}
/** @internal */
function getTableLikeName(table) {
	return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
/** @internal */
function getColumnNameAndConfig(a, b) {
	return {
		name: typeof a === "string" && a.length > 0 ? a : "",
		config: typeof a === "object" ? a : b
	};
}
typeof TextDecoder === "undefined" || new TextDecoder();
function assertUnreachable(_x) {
	throw new Error("Didn't expect to get here");
}
//#endregion
//#region node_modules/.pnpm/drizzle-orm@1.0.0-rc.4_@effect+sql-pg@4.0.2_effect@4.0.2__@opentelemetry+api@1.9.1_@typ_a5605b719fd00fbbeddc66b64a41c2f4/node_modules/drizzle-orm/sql/functions/aggregate.js
/**
* Returns the number of values in `expression`.
*
* ## Examples
*
* ```ts
* // Number employees with null values
* db.select({ value: count() }).from(employees)
* // Number of employees where `name` is not null
* db.select({ value: count(employees.name) }).from(employees)
* ```
*
* @see countDistinct to get the number of non-duplicate values in `expression`
*/
function count(expression) {
	return sql`count(${expression || sql.raw("*")})`.mapWith(Number);
}
//#endregion
//#region node_modules/.pnpm/@better-auth+drizzle-adapter@1.7.7_@better-auth+core@1.7.7_@better-auth+utils@0.4.2_@be_389dfee39f1c79f9b9b60c5464052133/node_modules/@better-auth/drizzle-adapter/dist/schema-check-DFZjRat1.mjs
/**
* Reads the relation registry used to build Drizzle relational queries.
*
* - Drizzle 0.x (Relations v1): `db._.schema`
* - Drizzle 1.x (Relations v2): `db._.relations`
*/
function buildRelationKeysByModel(relationRegistry) {
	const relationKeysByModel = /* @__PURE__ */ new Map();
	for (const [model, tableMetadata] of Object.entries(relationRegistry ?? {})) {
		if (!tableMetadata.relations) continue;
		relationKeysByModel.set(model, new Set(Object.keys(tableMetadata.relations)));
	}
	return relationKeysByModel;
}
function getOneToOneRelationKey({ baseModel, joinModel, baseModelKey, joinModelKey, relationKeys, schema, getDefaultModelName }) {
	const defaultBaseModelName = baseModelKey ?? getDefaultModelName(baseModel);
	const defaultJoinModelName = joinModelKey ?? getDefaultModelName(joinModel);
	const joinModelFields = schema[defaultJoinModelName]?.fields ?? {};
	const generatedRelationKey = Object.values(joinModelFields).some((field) => field.references && getDefaultModelName(field.references.model) === defaultBaseModelName) ? joinModel : schema[defaultJoinModelName]?.modelName ?? defaultJoinModelName;
	if (!relationKeys?.size) return joinModel;
	if (relationKeys.has(generatedRelationKey)) return generatedRelationKey;
	if (relationKeys.has(joinModel)) return joinModel;
	return generatedRelationKey;
}
/**
* LIKE/ILIKE with an explicit backslash escape character so callers can match a
* literal `%` or `_`. SQLite has no default LIKE escape, so the ESCAPE clause is
* always supplied. The escape character is passed as a bound parameter.
*
* This does not support MySQL's `NO_BACKSLASH_ESCAPES` sql_mode, under which the
* bound backslash is rejected as a two-character ESCAPE argument.
*
* @see https://www.sqlite.org/lang_expr.html
*/
function escapedLike(column, pattern, provider, mode = "sensitive") {
	const escape = "\\";
	if (mode === "insensitive") return provider === "pg" ? sql`${column} ILIKE ${pattern} ESCAPE ${escape}` : sql`LOWER(${column}) LIKE LOWER(${pattern}) ESCAPE ${escape}`;
	return sql`${column} LIKE ${pattern} ESCAPE ${escape}`;
}
/**
* Case-insensitive IN for string arrays.
*/
function insensitiveInArray(column, values) {
	if (values.length === 0) return sql`false`;
	return sql`LOWER(${column}) IN (${sql.join(values.map((v) => sql`LOWER(${v})`), sql`, `)})`;
}
/**
* Case-insensitive NOT IN for string arrays.
*/
function insensitiveNotInArray(column, values) {
	if (values.length === 0) return sql`true`;
	return sql`LOWER(${column}) NOT IN (${sql.join(values.map((v) => sql`LOWER(${v})`), sql`, `)})`;
}
/**
* Case-insensitive equality for strings.
*/
function insensitiveEq(column, value) {
	return sql`LOWER(${column}) = LOWER(${value})`;
}
/**
* Case-insensitive inequality for strings.
*/
function insensitiveNe(column, value) {
	return sql`LOWER(${column}) <> LOWER(${value})`;
}
/**
* Reads a Drizzle schema object the way the adapter addresses it: each table
* by the key it is exported under, each column by its property name. Values
* that are not tables, such as relations, are skipped.
*/
function introspectDrizzleSchema(schema) {
	const tables = [];
	for (const [name, table] of Object.entries(schema)) {
		if (!is(table, Table)) continue;
		const columns = Object.entries(getTableColumns(table)).map(([key, column]) => ({
			name: key,
			nullable: !column.notNull,
			hasDefault: column.hasDefault || column.generated !== void 0 || column.generatedIdentity !== void 0
		}));
		tables.push({
			name,
			columns
		});
	}
	return tables;
}
/**
* Compares a Drizzle schema object with the tables this configuration writes.
*/
function findDrizzleSchemaProblems(schema, options, usePlural) {
	return diffSchema(getExpectedSchema(options, { usePlural }), introspectDrizzleSchema(schema));
}
//#endregion
//#region node_modules/.pnpm/@better-auth+drizzle-adapter@1.7.7_@better-auth+core@1.7.7_@better-auth+utils@0.4.2_@be_389dfee39f1c79f9b9b60c5464052133/node_modules/@better-auth/drizzle-adapter/dist/relations-v2/index.mjs
function escapeLikePattern(value) {
	if (value == null) return "";
	return String(value).replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
function readDriverRowCount(result) {
	if (!result || typeof result !== "object") return void 0;
	if ("affectedRows" in result) return result.affectedRows;
	if ("rowsAffected" in result) return result.rowsAffected;
	if ("changes" in result) return result.changes;
	if ("meta" in result) {
		const meta = result.meta;
		if (meta && typeof meta === "object" && "changes" in meta) return meta.changes;
	}
}
function hasDriverRowCount(result) {
	return readDriverRowCount(result) !== void 0;
}
function getAffectedRowCount(result, operation, context) {
	let count = 0;
	if (result && typeof result === "object" && "rowCount" in result) count = result.rowCount;
	else if (result && typeof result === "object" && typeof result.count === "number") count = result.count;
	else if (Array.isArray(result)) count = result.length > 0 && hasDriverRowCount(result[0]) ? readDriverRowCount(result[0]) : result.length;
	else if (hasDriverRowCount(result)) count = readDriverRowCount(result);
	if (typeof count !== "number" || !Number.isFinite(count)) {
		logger.error(`[Drizzle Adapter] The result of the ${operation} operation is not a finite number. This is likely a bug in the adapter. Please report this issue to the Better Auth team.`, {
			result,
			...context
		});
		throw new BetterAuthError(`Drizzle adapter ${operation} returned an invalid affected row count`);
	}
	return count;
}
/**
* Maps a single Where entry to a drizzle SQL expression.
* Shared by convertWhereClause across single / AND / OR branches.
*/
function applyWhereOperator(column, w, fieldLabel, provider) {
	const isInsensitive = (w.mode ?? "sensitive") === "insensitive" && (typeof w.value === "string" || Array.isArray(w.value) && w.value.every((v) => typeof v === "string"));
	if (w.operator === "in") {
		if (!Array.isArray(w.value)) throw new BetterAuthError(`The value for the field "${fieldLabel}" must be an array when using the "in" operator.`);
		if (isInsensitive) return insensitiveInArray(column, w.value);
		return inArray(column, w.value);
	}
	if (w.operator === "not_in") {
		if (!Array.isArray(w.value)) throw new BetterAuthError(`The value for the field "${fieldLabel}" must be an array when using the "not_in" operator.`);
		if (isInsensitive) return insensitiveNotInArray(column, w.value);
		return notInArray(column, w.value);
	}
	const likeMode = isInsensitive && typeof w.value === "string" ? "insensitive" : "sensitive";
	if (w.operator === "contains") return escapedLike(column, `%${escapeLikePattern(w.value)}%`, provider, likeMode);
	if (w.operator === "starts_with") return escapedLike(column, `${escapeLikePattern(w.value)}%`, provider, likeMode);
	if (w.operator === "ends_with") return escapedLike(column, `%${escapeLikePattern(w.value)}`, provider, likeMode);
	if (w.operator === "lt") return lt(column, w.value);
	if (w.operator === "lte") return lte(column, w.value);
	if (w.operator === "ne") {
		if (w.value === null) return isNotNull(column);
		if (isInsensitive && typeof w.value === "string") return insensitiveNe(column, w.value);
		return ne(column, w.value);
	}
	if (w.operator === "gt") return gt(column, w.value);
	if (w.operator === "gte") return gte(column, w.value);
	if (w.value === null) return isNull(column);
	if (isInsensitive && typeof w.value === "string") return insensitiveEq(column, w.value);
	return eq(column, w.value);
}
var drizzleAdapter = (db, config) => {
	let lazyOptions = null;
	let mysqlNoIdWarned = false;
	let relationKeysByModel;
	const getRelationKeysByModel = () => relationKeysByModel ??= buildRelationKeysByModel(db._?.relations);
	const createCustomAdapter = (db, inTransaction = false) => ({ getFieldName, getDefaultModelName, options, schema: baSchema }) => {
		if (config.provider === "mysql" && options.advanced?.database?.generateId === false && !mysqlNoIdWarned) {
			mysqlNoIdWarned = true;
			logger.warn("[Drizzle Adapter] MySQL does not support INSERT...RETURNING. With generateId set to false, the adapter uses best-effort fallback strategies (unique columns, full-field match) to retrieve inserted rows. For reliable behavior, use Better Auth's default ID generation, a custom generateId function, or generateId: \"serial\" for auto-increment.");
		}
		function getSchema(model) {
			const schemaModel = config.schema?.[model] ?? db._?.relations?.[model]?.table ?? db._?.fullSchema?.[model];
			if (!schemaModel) throw new BetterAuthError(`[# Drizzle Adapter]: The model "${model}" was not found in the schema object. Please pass the schema directly to the adapter options.`);
			return schemaModel;
		}
		/**
		* Resolve the `db.query` key for a model.
		*
		* `db.query` is keyed by the Drizzle schema export names, which are
		* often plural ("users") even when Better Auth uses singular model
		* names. Try the model directly, then the `usePlural` variant, then
		* scan the schema for the key pointing at the same table.
		*/
		function getQueryModel(model) {
			if (!db.query) return null;
			if (db.query[model]) return model;
			if (config.usePlural) {
				const plural = `${model}s`;
				if (db.query[plural]) return plural;
			}
			if (config.schema) {
				const targetTable = config.schema[model];
				if (targetTable) {
					const relations = db._?.relations;
					const fullSchema = db._?.fullSchema;
					for (const key of Object.keys(db.query)) if ((relations?.[key]?.table ?? fullSchema?.[key]) === targetTable) return key;
				}
			}
			return null;
		}
		function getJoinRelationKey(baseModel, joinModel, baseModelKey, joinModelKey, relationKeys, isUnique) {
			if (isUnique) return getOneToOneRelationKey({
				baseModel,
				joinModel,
				baseModelKey,
				joinModelKey,
				relationKeys,
				schema: baSchema,
				getDefaultModelName
			});
			if (config.usePlural || joinModel.endsWith("s")) return joinModel;
			return `${joinModel}s`;
		}
		const withReturning = async (model, modelKey, builder, data, where) => {
			if (config.provider !== "mysql") return (await builder.returning())[0];
			const isSerialInsert = where === void 0 && options.advanced?.database?.generateId === "serial";
			const insertResult = isSerialInsert ? await builder.$returningId().execute() : await builder.execute();
			const schemaModel = getSchema(model);
			const builderVal = builder.config?.values;
			if (where?.length) {
				const clause = convertWhereClause(where.map((w) => {
					if (data[w.field] !== void 0) return {
						...w,
						value: data[w.field]
					};
					return w;
				}), model, modelKey);
				return (await db.select().from(schemaModel).where(...clause))[0];
			}
			const fetchInserted = async (tx) => {
				const builderId = builderVal?.[0]?.id?.value;
				if (builderId) return (await tx.select().from(schemaModel).where(eq(schemaModel.id, builderId)).limit(1).execute())[0] ?? null;
				if (data.id) return (await tx.select().from(schemaModel).where(eq(schemaModel.id, data.id)).limit(1).execute())[0] ?? null;
				const insertId = isSerialInsert ? insertResult?.[0]?.id : void 0;
				if (insertId && schemaModel.id) return (await tx.select().from(schemaModel).where(eq(schemaModel.id, insertId)).limit(1).execute())[0] ?? null;
				const modelSchema = baSchema[modelKey]?.fields;
				if (modelSchema) for (const [fieldKey, fieldAttr] of Object.entries(modelSchema)) {
					if (!fieldAttr.unique) continue;
					const dbFieldName = getFieldName({
						model: modelKey,
						field: fieldKey
					});
					const val = data[dbFieldName];
					if (val === void 0 || val === null) continue;
					if (!schemaModel[dbFieldName]) continue;
					const res = await tx.select().from(schemaModel).where(eq(schemaModel[dbFieldName], val)).limit(1).execute();
					if (res[0]) return res[0];
				}
				const conditions = [];
				for (const [key, val] of Object.entries(data)) {
					if (val === void 0 || !schemaModel[key]) continue;
					conditions.push(val === null ? isNull(schemaModel[key]) : eq(schemaModel[key], val));
				}
				if (conditions.length > 0) {
					const combined = and(...conditions);
					if (combined) {
						const res = await tx.select().from(schemaModel).where(combined).limit(2).execute();
						if (res.length === 1) return res[0];
					}
				}
				logger.warn(`[Drizzle Adapter] Unable to safely identify the inserted "${model}" row on MySQL. Enable Better Auth ID generation or use generateId: "serial" for reliable behavior.`);
				return null;
			};
			return inTransaction ? fetchInserted(db) : db.transaction(fetchInserted);
		};
		function resolveColumn(model, modelKey, w) {
			const schemaModel = getSchema(model);
			const field = getFieldName({
				model: modelKey,
				field: w.field
			});
			if (!schemaModel[field]) throw new BetterAuthError(`The field "${w.field}" does not exist in the schema for the model "${model}". Please update your schema.`);
			return {
				column: schemaModel[field],
				field
			};
		}
		function convertWhereClause(where, model, modelKey) {
			if (!where) return [];
			if (where.length === 1) {
				const w = where[0];
				if (!w) return [];
				const { column } = resolveColumn(model, modelKey, w);
				return [applyWhereOperator(column, w, w.field, config.provider)];
			}
			const andGroup = where.filter((w) => w.connector === "AND" || !w.connector);
			const orGroup = where.filter((w) => w.connector === "OR");
			const combined = and(and(...andGroup.map((w) => {
				const { column } = resolveColumn(model, modelKey, w);
				return applyWhereOperator(column, w, w.field, config.provider);
			})), or(...orGroup.map((w) => {
				const { column } = resolveColumn(model, modelKey, w);
				return applyWhereOperator(column, w, w.field, config.provider);
			})));
			return combined ? [combined] : [];
		}
		function convertNewWhereClause(where, model, modelKey) {
			const schemaModel = getSchema(model);
			if (!where || where.length === 0) return {};
			const rawCondition = (w, field) => ({ RAW: (table) => applyWhereOperator(table[field], w, w.field, config.provider) });
			const convertWhereToColumn = (w) => {
				const field = getFieldName({
					model: modelKey,
					field: w.field
				});
				if (!schemaModel[field]) throw new BetterAuthError(`The field "${w.field}" does not exist in the schema for the model "${model}". Please update your schema.`);
				const columnObj = {};
				let raw;
				const isInsensitive = w.mode === "insensitive" && (typeof w.value === "string" || Array.isArray(w.value) && w.value.every((v) => typeof v === "string"));
				if (w.operator === "contains" || w.operator === "starts_with" || w.operator === "ends_with" || isInsensitive) raw = rawCondition(w, field);
				else if (w.operator === "in") {
					if (!Array.isArray(w.value)) throw new BetterAuthError(`The value for the field "${w.field}" must be an array when using the "in" operator.`);
					columnObj.in = w.value;
				} else if (w.operator === "not_in") {
					if (!Array.isArray(w.value)) throw new BetterAuthError(`The value for the field "${w.field}" must be an array when using the "not_in" operator.`);
					columnObj.notIn = w.value;
				} else if (w.operator === "lt") columnObj.lt = w.value;
				else if (w.operator === "lte") columnObj.lte = w.value;
				else if (w.operator === "ne") if (w.value === null) columnObj.isNotNull = true;
				else columnObj.ne = w.value;
				else if (w.operator === "gt") columnObj.gt = w.value;
				else if (w.operator === "gte") columnObj.gte = w.value;
				else if (w.value === null) columnObj.isNull = true;
				else columnObj.eq = w.value;
				return {
					field,
					columnObj,
					raw
				};
			};
			if (where.length === 1) {
				const w = where[0];
				if (!w) return {};
				const { field, columnObj, raw } = convertWhereToColumn(w);
				return raw ?? { [field]: columnObj };
			}
			const andGroup = where.filter((w) => w.connector === "AND" || !w.connector);
			const orGroup = where.filter((w) => w.connector === "OR");
			const result = {};
			if (andGroup.length > 0) {
				const fieldMap = {};
				const rawConditions = [];
				for (const w of andGroup) {
					const { field, columnObj, raw } = convertWhereToColumn(w);
					if (raw) {
						rawConditions.push(raw);
						continue;
					}
					if (!fieldMap[field]) fieldMap[field] = [];
					fieldMap[field].push(columnObj);
				}
				for (const [field, conditions] of Object.entries(fieldMap)) if (conditions.length === 1) result[field] = conditions[0];
				else result[field] = { AND: conditions };
				if (rawConditions.length > 0) result.AND = rawConditions;
			}
			if (orGroup.length > 0) {
				const orConditions = [];
				for (const w of orGroup) {
					const { field, columnObj, raw } = convertWhereToColumn(w);
					orConditions.push(raw ?? { [field]: columnObj });
				}
				if (orConditions.length > 0) result.OR = orConditions;
			}
			return result;
		}
		function checkMissingFields(schema, model, values) {
			if (!schema) throw new BetterAuthError("Drizzle adapter failed to initialize. Drizzle Schema not found. Please provide a schema object in the adapter options object.");
			for (const key in values) if (!schema[key]) throw new BetterAuthError(`The field "${key}" does not exist in the "${model}" Drizzle schema. Please update your drizzle schema or re-generate using "npx auth@latest generate".`);
		}
		return {
			async create({ model, modelKey = model, data: values }) {
				const table = getSchema(model);
				checkMissingFields(table, modelKey, values);
				return await withReturning(model, modelKey, db.insert(table).values(values), values);
			},
			async findOne({ model, modelKey = model, where, select, join }) {
				const table = getSchema(model);
				const clause = convertWhereClause(where, model, modelKey);
				if (join) {
					const queryModel = getQueryModel(model);
					if (!db.query || !queryModel) {
						logger.error(`[# Drizzle Adapter]: The model "${model}" was not found in the query object. Please update your Drizzle schema to include relations or re-generate using "npx auth@latest generate".`);
						logger.info("Falling back to regular query");
					} else {
						let includes;
						const renamedJoinResults = [];
						const relationKeys = getRelationKeysByModel().get(queryModel);
						includes = {};
						const joinEntries = Object.entries(join);
						for (const [joinModel, joinAttr] of joinEntries) {
							const limit = joinAttr.limit ?? options.advanced?.database?.defaultFindManyLimit ?? 100;
							const isUnique = joinAttr.relation === "one-to-one";
							const relationKey = getJoinRelationKey(model, joinModel, modelKey, joinAttr.modelKey ?? joinModel, relationKeys, isUnique);
							includes[relationKey] = isUnique ? true : { limit };
							if (relationKey !== joinModel) renamedJoinResults.push({
								key: relationKey,
								target: joinModel
							});
						}
						const clause = convertNewWhereClause(where, model, modelKey);
						const res = await db.query[queryModel].findFirst({
							where: clause,
							columns: select?.length && select.length > 0 ? select.reduce((acc, field) => {
								acc[getFieldName({
									model: modelKey,
									field
								})] = true;
								return acc;
							}, {}) : void 0,
							with: includes
						});
						if (res) for (const { key, target } of renamedJoinResults) {
							res[target] = res[key];
							delete res[key];
						}
						return res;
					}
				}
				const res = await db.select(select?.length && select.length > 0 ? select.reduce((acc, field) => {
					const fieldName = getFieldName({
						model: modelKey,
						field
					});
					return {
						...acc,
						[fieldName]: table[fieldName]
					};
				}, {}) : void 0).from(table).where(...clause);
				if (!res.length) return null;
				return res[0];
			},
			async findMany({ model, modelKey = model, where, sortBy, limit, select, offset, join }) {
				const table = getSchema(model);
				const clause = where ? convertWhereClause(where, model, modelKey) : [];
				const sortFn = sortBy?.direction === "desc" ? desc : asc;
				if (join) {
					const queryModel = getQueryModel(model);
					if (!db.query || !queryModel) {
						logger.error(`[# Drizzle Adapter]: The model "${model}" was not found in the query object. Please update your Drizzle schema to include relations or re-generate using "npx auth@latest generate".`);
						logger.info("Falling back to regular query");
					} else {
						let includes;
						const renamedJoinResults = [];
						const relationKeys = getRelationKeysByModel().get(queryModel);
						includes = {};
						const joinEntries = Object.entries(join);
						for (const [joinModel, joinAttr] of joinEntries) {
							const isUnique = joinAttr.relation === "one-to-one";
							const limit = joinAttr.limit ?? options.advanced?.database?.defaultFindManyLimit ?? 100;
							const relationKey = getJoinRelationKey(model, joinModel, modelKey, joinAttr.modelKey ?? joinModel, relationKeys, isUnique);
							includes[relationKey] = isUnique ? true : { limit };
							if (relationKey !== joinModel) renamedJoinResults.push({
								key: relationKey,
								target: joinModel
							});
						}
						let orderBy = void 0;
						if (sortBy?.field) orderBy = { [getFieldName({
							model: modelKey,
							field: sortBy.field
						})]: sortBy.direction === "desc" ? "desc" : "asc" };
						const res = await db.query[queryModel].findMany({
							where: where ? convertNewWhereClause(where, model, modelKey) : void 0,
							with: includes,
							columns: select?.length && select.length > 0 ? select.reduce((acc, field) => {
								acc[getFieldName({
									model: modelKey,
									field
								})] = true;
								return acc;
							}, {}) : void 0,
							limit: limit ?? 100,
							offset: offset ?? 0,
							orderBy
						});
						if (res) for (const item of res) for (const { key, target } of renamedJoinResults) {
							item[target] = item[key];
							delete item[key];
						}
						return res;
					}
				}
				let builder = db.select(select?.length && select.length > 0 ? select.reduce((acc, field) => {
					const fieldName = getFieldName({
						model: modelKey,
						field
					});
					return {
						...acc,
						[fieldName]: table[fieldName]
					};
				}, {}) : void 0).from(table);
				const effectiveLimit = limit;
				const effectiveOffset = offset;
				if (typeof effectiveLimit !== "undefined") builder = builder.limit(effectiveLimit);
				if (typeof effectiveOffset !== "undefined") builder = builder.offset(effectiveOffset);
				if (sortBy?.field) builder = builder.orderBy(sortFn(table[getFieldName({
					model: modelKey,
					field: sortBy?.field
				})]));
				return await builder.where(...clause);
			},
			async count({ model, modelKey = model, where }) {
				const table = getSchema(model);
				const clause = where ? convertWhereClause(where, model, modelKey) : [];
				return (await db.select({ count: count() }).from(table).where(...clause))[0].count;
			},
			async update({ model, modelKey = model, where, update: values }) {
				const table = getSchema(model);
				const clause = convertWhereClause(where, model, modelKey);
				return await withReturning(model, modelKey, db.update(table).set(values).where(...clause), values, where);
			},
			async updateMany({ model, modelKey = model, where, update: values }) {
				const table = getSchema(model);
				const clause = convertWhereClause(where, model, modelKey);
				return getAffectedRowCount(await db.update(table).set(values).where(...clause), "updateMany", {
					model,
					where
				});
			},
			async delete({ model, modelKey = model, where }) {
				const table = getSchema(model);
				const clause = convertWhereClause(where, model, modelKey);
				return await db.delete(table).where(...clause);
			},
			async deleteMany({ model, modelKey = model, where }) {
				const table = getSchema(model);
				const clause = convertWhereClause(where, model, modelKey);
				return getAffectedRowCount(await db.delete(table).where(...clause), "deleteMany", {
					model,
					where
				});
			},
			async consumeOne({ model, modelKey = model, where }) {
				const table = getSchema(model);
				const clause = convertWhereClause(where, model, modelKey);
				const idField = getFieldName({
					model: modelKey,
					field: "id"
				});
				const idColumn = table[idField];
				if (config.provider === "mysql") {
					const claimFromTransaction = async (tx) => {
						const target = (await tx.select().from(table).where(...clause).for("update").limit(1))[0];
						if (!target) return null;
						const targetId = target[idField] ?? target.id;
						if (targetId === void 0 || targetId === null || !idColumn) return null;
						return getAffectedRowCount(await tx.delete(table).where(eq(idColumn, targetId)).execute(), "consumeOne", {
							model,
							where
						}) > 0 ? target : null;
					};
					return inTransaction ? claimFromTransaction(db) : db.transaction(claimFromTransaction);
				}
				if (!idColumn) return null;
				const targetIds = db.select({ id: idColumn }).from(table).where(...clause).limit(1);
				return (await db.delete(table).where(inArray(idColumn, targetIds)).returning())[0] ?? null;
			},
			async incrementOne({ model, modelKey = model, where, increment, set }) {
				const table = getSchema(model);
				const clause = convertWhereClause(where, model, modelKey);
				const idField = getFieldName({
					model: modelKey,
					field: "id"
				});
				const idColumn = table[idField];
				const assignments = {};
				for (const [field, delta] of Object.entries(increment)) {
					const columnName = getFieldName({
						model: modelKey,
						field
					});
					const column = table[columnName];
					if (!column) throw new BetterAuthError(`The field "${field}" does not exist in the schema for the model "${model}". Please update your schema.`);
					assignments[columnName] = sql`${column} + ${sql.param(delta)}`;
				}
				if (set) for (const [field, value] of Object.entries(set)) {
					const columnName = getFieldName({
						model: modelKey,
						field
					});
					if (!table[columnName]) throw new BetterAuthError(`The field "${field}" does not exist in the schema for the model "${model}". Please update your schema.`);
					assignments[columnName] = value;
				}
				if (config.provider === "mysql") {
					const mutateInTransaction = async (tx) => {
						const target = (await tx.select().from(table).where(...clause).for("update").limit(1))[0];
						if (!target) return null;
						const targetId = target[idField] ?? target.id;
						if (targetId === void 0 || targetId === null || !idColumn) return null;
						await tx.update(table).set(assignments).where(eq(idColumn, targetId)).execute();
						return (await tx.select().from(table).where(eq(idColumn, targetId)).limit(1).execute())[0] ?? null;
					};
					return inTransaction ? mutateInTransaction(db) : db.transaction(mutateInTransaction);
				}
				if (!idColumn) return null;
				const targetIds = db.select({ id: idColumn }).from(table).where(...clause).limit(1);
				return (await db.update(table).set(assignments).where(and(...clause, inArray(idColumn, targetIds))).returning())[0] ?? null;
			},
			async createSchema(props) {
				const { generateDrizzleSchema } = await Promise.resolve().then(() => generate_drizzle_schema_iWvrXnu0_exports);
				return await generateDrizzleSchema({
					adapterConfig: config,
					options,
					provider: config.provider,
					camelCase: config.camelCase,
					file: props.file,
					tables: props.tables
				});
			},
			options: config
		};
	};
	let adapterOptions = null;
	adapterOptions = {
		config: {
			adapterId: "drizzle",
			adapterName: "Drizzle Adapter",
			usePlural: config.usePlural ?? false,
			debugLogs: config.debugLogs ?? false,
			supportsUUIDs: config.provider === "pg" ? true : false,
			supportsJSON: true,
			supportsArrays: true,
			transaction: config.transaction ?? false ? (cb) => db.transaction((tx) => {
				return cb(createAdapterFactory({
					config: {
						...adapterOptions.config,
						transaction: false
					},
					adapter: createCustomAdapter(tx, true)
				})(lazyOptions));
			}) : false
		},
		adapter: createCustomAdapter(db)
	};
	const adapter = createAdapterFactory(adapterOptions);
	return (options) => {
		lazyOptions = options;
		const instance = adapter(options);
		registerSchemaCheck(instance, createSchemaCheck(() => {
			const relations = db._?.relations ?? {};
			return findDrizzleSchemaProblems({
				...db._?.fullSchema,
				...Object.fromEntries(Object.entries(relations).map(([name, relation]) => [name, relation.table])),
				...config.schema
			}, options, config.usePlural);
		}, "drizzle"), { runtimeEnabled: checksSchema(options) });
		return instance;
	};
};
//#endregion
//#region node_modules/.pnpm/@better-auth+drizzle-adapter@1.7.7_@better-auth+core@1.7.7_@better-auth+utils@0.4.2_@be_389dfee39f1c79f9b9b60c5464052133/node_modules/@better-auth/drizzle-adapter/dist/generate-drizzle-schema-iWvrXnu0.mjs
var generate_drizzle_schema_iWvrXnu0_exports = /* @__PURE__ */ __exportAll({ generateDrizzleSchema: () => generateDrizzleSchema });
function convertToSnakeCase(str, camelCase) {
	if (camelCase) return str;
	return str.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").toLowerCase();
}
/**
* Convert a schema namespace into a valid JavaScript identifier so it can be
* used as the `export const <name>Schema = pgSchema(...)` variable name.
* e.g. "my-auth" -> "myAuth", "123schema" -> "_123schema".
*/
function toValidIdentifier(str) {
	let result = str.replace(/[^a-zA-Z0-9]+([a-zA-Z0-9])/g, (_, char) => char.toUpperCase()).replace(/[^a-zA-Z0-9]/g, "").replace(/^[0-9]/, "_$&");
	if (result.length > 0 && /[A-Z]/.test(result[0])) result = result[0].toLowerCase() + result.slice(1);
	return result || "schema";
}
var generateDrizzleSchema = async ({ options, file, provider, adapterConfig, camelCase, tables: propsTables }) => {
	const tables = propsTables ?? getAuthTables(options);
	const filePath = file || "./auth-schema.ts";
	const databaseType = provider;
	const schemaName = adapterConfig?.schemaName;
	if (!databaseType) throw new Error(`Database provider type is undefined during Drizzle schema generation. Please define a \`provider\` in the Drizzle adapter config. Read more at https://better-auth.com/docs/adapters/drizzle`);
	const fileExist = existsSync(filePath);
	let code = generateImport({
		databaseType,
		tables,
		options,
		schemaName
	});
	let schemaVarName;
	if (databaseType === "pg" && schemaName) {
		schemaVarName = `${toValidIdentifier(schemaName)}Schema`;
		if (schemaVarName === "pgSchema") schemaVarName = "pgCustomSchema";
		code += `\nexport const ${schemaVarName} = pgSchema(${JSON.stringify(schemaName)});\n`;
	}
	const tableFunction = databaseType === "pg" && schemaName && schemaVarName ? `${schemaVarName}.table` : `${databaseType}Table`;
	const getModelName = initGetModelName({
		schema: tables,
		usePlural: adapterConfig?.usePlural
	});
	const getSingularModelName = initGetModelName({
		schema: tables,
		usePlural: false
	});
	const getFieldName = initGetFieldName({
		schema: tables,
		usePlural: adapterConfig?.usePlural
	});
	const resolvedIndexesByTable = resolveDatabaseSchemaIndexes(Object.keys(tables).filter((tableKey) => !tables[tableKey].disableMigrations).map((tableKey) => ({
		fields: tables[tableKey].fields,
		indexes: tables[tableKey].indexes,
		tableName: getModelName(tableKey)
	})));
	for (const tableKey in tables) {
		const table = tables[tableKey];
		if (table.disableMigrations) continue;
		const modelName = getModelName(tableKey);
		const fields = table.fields;
		const resolvedTableIndexes = resolvedIndexesByTable.get(modelName) ?? [];
		function getType(name, field, tableIndexStringLength) {
			if (!databaseType) throw new Error(`Database provider type is undefined during Drizzle schema generation. Please define a \`provider\` in the Drizzle adapter config. Read more at https://better-auth.com/docs/adapters/drizzle`);
			name = convertToSnakeCase(name, camelCase);
			if (field.references?.field === "id") {
				const useNumberId = options.advanced?.database?.generateId === "serial";
				const useUUIDs = options.advanced?.database?.generateId === "uuid";
				if (useNumberId) if (databaseType === "pg") return `integer('${name}')`;
				else if (databaseType === "mysql") return `int('${name}')`;
				else return `integer('${name}')`;
				if (useUUIDs && databaseType === "pg") return `uuid('${name}')`;
				if (field.references.field) {
					if (databaseType === "mysql") return `varchar('${name}', { length: 36 })`;
				}
				return `text('${name}')`;
			}
			const type = field.type;
			if (typeof type !== "string") if (Array.isArray(type) && type.every((x) => typeof x === "string")) return {
				sqlite: `text('${name}', { enum: [${type.map((x) => `'${x}'`).join(", ")}] })`,
				pg: `text('${name}', { enum: [${type.map((x) => `'${x}'`).join(", ")}] })`,
				mysql: `mysqlEnum('${name}', [${type.map((x) => `'${x}'`).join(", ")}])`
			}[databaseType];
			else throw new TypeError(`Invalid field type for field ${name} in model ${modelName}`);
			const dbTypeMap = {
				string: {
					sqlite: `text('${name}')`,
					pg: `text('${name}')`,
					mysql: tableIndexStringLength ? `varchar('${name}', { length: ${tableIndexStringLength} })` : field.unique ? `varchar('${name}', { length: 255 })` : field.references ? `varchar('${name}', { length: 36 })` : field.sortable ? `varchar('${name}', { length: 255 })` : field.index ? `varchar('${name}', { length: 255 })` : `text('${name}')`
				},
				boolean: {
					sqlite: `integer('${name}', { mode: 'boolean' })`,
					pg: `boolean('${name}')`,
					mysql: `boolean('${name}')`
				},
				number: {
					sqlite: `integer('${name}')`,
					pg: field.bigint ? `bigint('${name}', { mode: 'number' })` : `integer('${name}')`,
					mysql: field.bigint ? `bigint('${name}', { mode: 'number' })` : `int('${name}')`
				},
				date: {
					sqlite: `integer('${name}', { mode: 'timestamp_ms' })`,
					pg: `timestamp('${name}')`,
					mysql: `timestamp('${name}', { fsp: 3 })`
				},
				"number[]": {
					sqlite: `text('${name}', { mode: "json" })`,
					pg: field.bigint ? `bigint('${name}', { mode: 'number' }).array()` : `integer('${name}').array()`,
					mysql: `json('${name}')`
				},
				"string[]": {
					sqlite: `text('${name}', { mode: "json" })`,
					pg: `text('${name}').array()`,
					mysql: `json('${name}')`
				},
				json: {
					sqlite: `text('${name}', { mode: "json" })`,
					pg: `jsonb('${name}')`,
					mysql: `json('${name}')`
				}
			}[type];
			if (!dbTypeMap) throw new Error(`Unsupported field type '${field.type}' for field '${name}'.`);
			return dbTypeMap[databaseType];
		}
		let id = "";
		const useNumberId = options.advanced?.database?.generateId === "serial";
		if (options.advanced?.database?.generateId === "uuid" && databaseType === "pg") id = `uuid("id").default(sql\`pg_catalog.gen_random_uuid()\`).primaryKey()`;
		else if (useNumberId) if (databaseType === "pg") id = `integer("id").generatedByDefaultAsIdentity().primaryKey()`;
		else if (databaseType === "sqlite") id = `integer("id", { mode: "number" }).primaryKey({ autoIncrement: true })`;
		else id = `int("id").autoincrement().primaryKey()`;
		else if (databaseType === "mysql") id = `varchar('id', { length: 36 }).primaryKey()`;
		else if (databaseType === "pg") id = `text('id').primaryKey()`;
		else id = `text('id').primaryKey()`;
		const indexes = [];
		const assignIndexes = (indexes) => {
			if (!indexes.length) return "";
			const code = [`, (table) => [`];
			for (const index of indexes) code.push(`  ${index.type}(${JSON.stringify(index.name)}).on(${index.on.map((fieldName) => `table.${fieldName}`).join(", ")}),`);
			code.push(`]`);
			return code.join("\n");
		};
		for (const tableIndex of resolvedTableIndexes) indexes.push({
			type: tableIndex.unique ? "uniqueIndex" : "index",
			name: tableIndex.name,
			on: tableIndex.columns
		});
		const schema = `export const ${modelName} = ${tableFunction}("${convertToSnakeCase(modelName, camelCase)}", {
					id: ${id},
					${Object.keys(fields).map((field) => {
			const attr = fields[field];
			const fieldName = attr.fieldName || field;
			let type = getType(fieldName, attr, databaseType === "mysql" ? getDatabaseIndexStringLength({
				columnName: fieldName,
				dialect: "mysql",
				fields,
				indexes: resolvedTableIndexes
			}) : void 0);
			if (attr.index && !attr.unique) indexes.push({
				type: "index",
				name: getDatabaseFieldIndexName(modelName, fieldName, false),
				on: [fieldName]
			});
			else if (attr.index && attr.unique) indexes.push({
				type: "uniqueIndex",
				name: getDatabaseFieldIndexName(modelName, fieldName, true),
				on: [fieldName]
			});
			if (attr.defaultValue !== null && typeof attr.defaultValue !== "undefined") if (typeof attr.defaultValue === "function") {
				if (attr.type === "date" && attr.defaultValue.toString().includes("new Date()")) if (databaseType === "sqlite") type += `.default(sql\`(cast(unixepoch('subsecond') * 1000 as integer))\`)`;
				else type += `.defaultNow()`;
			} else if (typeof attr.defaultValue === "string") type += `.default(${JSON.stringify(attr.defaultValue)})`;
			else if (Array.isArray(attr.defaultValue)) {
				const elements = attr.defaultValue.map((value) => JSON.stringify(value)).join(", ");
				type += `.default([${elements}])`;
			} else if (typeof attr.defaultValue === "object" && attr.defaultValue !== null) type += `.default(${JSON.stringify(attr.defaultValue)})`;
			else type += `.default(${attr.defaultValue})`;
			if (attr.onUpdate && attr.type === "date") {
				if (typeof attr.onUpdate === "function") type += `.$onUpdate(${attr.onUpdate})`;
			}
			return `${fieldName}: ${type}${attr.required ? ".notNull()" : ""}${attr.unique ? ".unique()" : ""}${attr.references ? `.references(()=> ${getModelName(attr.references.model)}.${getFieldName({
				model: attr.references.model,
				field: attr.references.field
			})}, { onDelete: '${attr.references.onDelete || "cascade"}' })` : ""}`;
		}).join(",\n ")}
					}${assignIndexes(indexes)});`;
		code += `\n${schema}\n`;
	}
	const schemaObjectKeys = [];
	for (const tableKey in tables) {
		if (tables[tableKey].disableMigrations) continue;
		const modelName = getModelName(tableKey);
		schemaObjectKeys.push(modelName);
	}
	const schemaObject = `{ ${schemaObjectKeys.join(", ")} }`;
	const relationsMap = /* @__PURE__ */ new Map();
	for (const tableKey in tables) {
		const table = tables[tableKey];
		if (table.disableMigrations) continue;
		const modelName = getModelName(tableKey);
		const modelRelations = [];
		const foreignFields = Object.entries(table.fields).filter(([_, field]) => field.references);
		for (const [fieldName, field] of foreignFields) {
			const referencedModel = field.references.model;
			if (tables[referencedModel]?.disableMigrations) continue;
			const targetModelName = getModelName(referencedModel);
			const fromField = getFieldName({
				model: tableKey,
				field: fieldName
			});
			const toField = getFieldName({
				model: referencedModel,
				field: field.references.field || "id"
			});
			const existingToSameModel = modelRelations.filter((r) => r.targetModel === targetModelName && r.type === "one");
			const singularName = getSingularModelName(referencedModel);
			const relationKey = existingToSameModel.length > 0 ? `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}${singularName.charAt(0).toUpperCase() + singularName.slice(1)}` : singularName;
			modelRelations.push({
				key: relationKey,
				type: "one",
				targetModel: targetModelName,
				fromField,
				toField,
				sourceModel: modelName
			});
		}
		const otherModels = Object.entries(tables).filter(([modelName, otherTable]) => modelName !== tableKey && !otherTable.disableMigrations);
		for (const [otherTableKey, otherTable] of otherModels) {
			const foreignKeysPointingHere = Object.entries(otherTable.fields).filter(([_, field]) => field.references?.model === tableKey || field.references?.model === modelName);
			if (foreignKeysPointingHere.length === 0) continue;
			const otherModelName = getModelName(otherTableKey);
			if (foreignKeysPointingHere.some(([_, field]) => !field.unique)) {
				const nonUniqueFKs = foreignKeysPointingHere.filter(([_, field]) => !field.unique);
				for (let i = 0; i < nonUniqueFKs.length; i++) {
					const fkField = nonUniqueFKs[i];
					if (!fkField) continue;
					const [fkFieldName, fkFieldAttr] = fkField;
					const fromField = getFieldName({
						model: tableKey,
						field: fkFieldAttr.references?.field || "id"
					});
					const toField = getFieldName({
						model: otherTableKey,
						field: fkFieldName
					});
					let relationKey = otherModelName;
					if (!adapterConfig?.usePlural) relationKey = otherModelName.endsWith("s") ? otherModelName : `${otherModelName}s`;
					if (nonUniqueFKs.length > 1) {
						const capitalizedField = fkFieldName.charAt(0).toUpperCase() + fkFieldName.slice(1);
						relationKey = `${relationKey}By${capitalizedField}`;
					}
					modelRelations.push({
						key: relationKey,
						type: "many",
						targetModel: otherModelName,
						fromField,
						toField,
						sourceModel: modelName
					});
				}
			} else {
				const fkField = foreignKeysPointingHere.find(([_, field]) => field.unique);
				if (fkField) {
					const [fkFieldName, fieldAttr] = fkField;
					const fromField = getFieldName({
						model: tableKey,
						field: fieldAttr.references?.field || "id"
					});
					const toField = getFieldName({
						model: otherTableKey,
						field: fkFieldName
					});
					const relationKey = otherModelName;
					modelRelations.push({
						key: relationKey,
						type: "one",
						targetModel: otherModelName,
						fromField,
						toField,
						sourceModel: modelName
					});
				}
			}
		}
		if (modelRelations.length > 0) relationsMap.set(modelName, modelRelations);
	}
	let relationsString = "";
	if (relationsMap.size > 0) {
		const relationsEntries = [];
		for (const [modelName, relations] of relationsMap.entries()) {
			const relationDefs = [];
			for (const relation of relations) if (relation.type === "one") relationDefs.push(`    ${relation.key}: r.one.${relation.targetModel}({\n      from: r.${relation.sourceModel}.${relation.fromField},\n      to: r.${relation.targetModel}.${relation.toField},\n    })`);
			else relationDefs.push(`    ${relation.key}: r.many.${relation.targetModel}({\n      from: r.${relation.sourceModel}.${relation.fromField},\n      to: r.${relation.targetModel}.${relation.toField},\n    })`);
			if (relationDefs.length > 0) relationsEntries.push(`  ${modelName}: {\n${relationDefs.join(",\n")}\n  }`);
		}
		if (relationsEntries.length > 0) relationsString = `\n\nexport const authRelations = defineRelationsPart(${schemaObject}, (r) => ({\n${relationsEntries.join(",\n")}\n}));\n`;
	}
	code += relationsString;
	let formattedCode = code;
	try {
		const { format } = await new Function("moduleName", "return import(moduleName);")("prettier");
		formattedCode = await format(code, { parser: "typescript" });
	} catch {}
	return {
		code: formattedCode,
		fileName: path.basename(filePath),
		overwrite: fileExist,
		path: filePath,
		append: false
	};
};
function generateImport({ databaseType, tables, options, schemaName }) {
	const rootImports = ["defineRelationsPart"];
	const coreImports = [];
	if (databaseType === "pg" && schemaName) coreImports.push("pgSchema");
	if (!(databaseType === "pg" && schemaName)) coreImports.push(`${databaseType}Table`);
	let hasBigint = false;
	let hasJson = false;
	for (const table of Object.values(tables)) {
		for (const field of Object.values(table.fields)) {
			if (field.bigint) hasBigint = true;
			if (field.type === "json" || databaseType === "mysql" && (field.type === "number[]" || field.type === "string[]")) hasJson = true;
		}
		if (hasJson && hasBigint) break;
	}
	const useNumberId = options.advanced?.database?.generateId === "serial";
	const useUUIDs = options.advanced?.database?.generateId === "uuid";
	coreImports.push(databaseType === "mysql" ? "varchar, text" : databaseType === "pg" ? "text" : "text");
	coreImports.push(hasBigint ? databaseType !== "sqlite" ? "bigint" : "" : "");
	coreImports.push(databaseType !== "sqlite" ? "timestamp, boolean" : "");
	if (databaseType === "mysql") {
		const hasNonBigintNumber = Object.values(tables).some((table) => Object.values(table.fields).some((field) => (field.type === "number" || field.type === "number[]") && !field.bigint));
		if (!!useNumberId || hasNonBigintNumber) coreImports.push("int");
		if (Object.values(tables).some((table) => Object.values(table.fields).some((field) => typeof field.type !== "string" && Array.isArray(field.type) && field.type.every((x) => typeof x === "string")))) coreImports.push("mysqlEnum");
	} else if (databaseType === "pg") {
		if (useUUIDs) rootImports.push("sql");
		if (Object.values(tables).some((table) => Object.values(table.fields).some((field) => (field.type === "number" || field.type === "number[]") && !field.bigint)) || options.advanced?.database?.generateId === "serial") coreImports.push("integer");
	} else coreImports.push("integer");
	if (databaseType === "pg" && useUUIDs) coreImports.push("uuid");
	if (hasJson) {
		if (databaseType === "pg") coreImports.push("jsonb");
		if (databaseType === "mysql") coreImports.push("json");
	}
	if (databaseType === "sqlite" && Object.values(tables).some((table) => Object.values(table.fields).some((field) => field.type === "date" && field.defaultValue && typeof field.defaultValue === "function" && field.defaultValue.toString().includes("new Date()")))) rootImports.push("sql");
	const hasIndexes = Object.values(tables).some((table) => Object.values(table.fields).some((field) => field.index && !field.unique) || (table.indexes?.some((index) => !index.unique) ?? false));
	const hasUniqueIndexes = Object.values(tables).some((table) => Object.values(table.fields).some((field) => field.unique && field.index) || (table.indexes?.some((index) => index.unique) ?? false));
	if (hasIndexes) coreImports.push("index");
	if (hasUniqueIndexes) coreImports.push("uniqueIndex");
	return `${rootImports.length > 0 ? `import { ${rootImports.join(", ")} } from "drizzle-orm";\n` : ""}import { ${coreImports.map((x) => x.trim()).filter((x) => x !== "").join(", ")} } from "drizzle-orm/${databaseType}-core";\n`;
}
//#endregion
export { WithSubquery as $, like as A, or as B, exists as C, inArray as D, ilike as E, notBetween as F, fillPlaceholders as G, Placeholder as H, notExists as I, sql as J, isSQLWrapper as K, notIlike as L, lte as M, ne as N, isNotNull as O, not as P, Subquery as Q, notInArray as R, eq as S, gte as T, SQL as U, Param as V, View as W, tracer as X, ViewBaseConfig as Y, iife as Z, and as _, getColumnFromDecoder as a, getTableName as at, arrayOverlaps as b, getTableLikeName as c, OriginalColumn as ct, makeDefaultQueryMapper as d, IsAlias as et, makeJitQueryMapper as f, desc as g, asc as h, assertUnreachable as i, TableSchema as it, lt as j, isNull as k, haveSameKeys as l, entityKind as lt, orderSelectedFields as m, FnConstructor as n, Table as nt, getColumnNameAndConfig as o, TableName as ot, mapUpdateSet as p, noopDecoder as q, applyMixins as r, TableColumns as rt, getTableColumns as s, Column as st, drizzleAdapter as t, OriginalName as tt, jitCompatCheck as u, is as ut, arrayContained as v, gt as w, between as x, arrayContains as y, notLike as z };
