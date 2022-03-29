/**
 * @file      gauss.js
 * @author    Marcos Vinicius Moreira Santos <marcos30004347@gmail.com>
 * @copyright BSD-3-Clause
 *
 * @fileoverview This file ports all the methods of the c++ library to javascript.
 * It takes all glue code generated be emscripten and create nice abstractions
 * for a better programming experience.
 *
 */

const Module = require('./gauss-bindings')

let gauss = null;

/**
 * The Expression class. This is the main expression class
 * and it is stored as a abstract syntax tree for algebraic
 * expressions. The implementation is internall to the C++
 * implementation.
 * @class
 */
let Expr = null;

/**
 * Enum for all error codes.
 * @readonly
 * @enum {number}
 */
let ErrorCode = null;

/**
 * Enumeration of all kinds possible for expressions.
 */
let Kind = null;

/**
 * Class used as the container for errors.
 * @class
 */
let Error = null;

async function init() {
	gauss = await Module();
	Expr = gauss.expr;
	ErrorCode = {
		/** Error Code throwed because a big integer is bigget than the maximum unsigned integer value*/
		INT_BIGGER_THAN_MAX_ULL: gauss.ErrorCode.INT_BIGGET_THAN_MAX_ULL,

		/** Error Code throwed because a Integer value is too big to fit on a 64 bits float */
		DOUBLE_OVERFLOW: gauss.ErrorCode.DoubleOverflow,

		/** Error Code throwed because a Integer value is too big to fit on a 64 bits integer*/
		LONG_LONG_OVERFLOW: gauss.ErrorCode.LONG_LONG_OVERFLOW,

		/** Error Code throwed because a division by zero occured */
		DIVISION_BY_ZERO: gauss.ErrorCode.DIVISION_BY_ZERO,

		/** Error Code throwed because an argument is invalid */
		ARG_IS_INVALID: gauss.ErrorCode.ARG_IS_INVALID,

		/** Error Code throwed because a reduction encounter a invalid matrix addition */
		MATRIX_INVALID_ADDITION: gauss.ErrorCode.MATRIX_INVALID_ADDITION,

		/** Error Code throwed because a reduction encounter a invalid matrix multiplication */
		MATRIX_INVALID_MULTIPLICATION: gauss.ErrorCode.MATRIX_INVALID_MULTIPLICATION,

		/** Error Code throwed because a number have no modular inverse */
		NUMBER_HAVE_NO_MODULAR_INVERSE: gauss.ErrorCode.NUMBER_HAVE_NO_MODULAR_INVERSE,

		/** Error Code throwed by methods that expects polynomial with integer degrees */
		POLY_HAVE_NON_INTEGER_DEGREE: gauss.ErrorCode.POLY_HAVE_NON_INTEGER_DEGREE,

		/** Error Code throwed by methods that expects polynomial expressions with constant coefficients */
		POLY_HAVE_NON_CONSTANT_COEFFICIENT: gauss.ErrorCode.POLY_HAVE_NON_CONSTANT_COEFFICIENT,

		/** Error Code throwed by methods that do not receive a symbol expr when expected */
		ARG_IS_NOT_SYM_EXPR: gauss.ErrorCode.ARG_IS_NOT_SYM_EXPR,

		/** Error Code throwed by methods that do not receive a power expr when expected */
		ARG_IS_NOT_POW_EXPR: gauss.ErrorCode.ARG_IS_NOT_POW_EXPR,

		/** Error Code throwed by methods that do not receive a integer expr when expected */
		ARG_IS_NOT_INT_EXPR: gauss.ErrorCode.ARG_IS_NOT_INT_EXPR,

		/** Error Code throwed by methods that do not receive a fraction expr when expected */
		ARG_IS_NOT_FRA_EXPR: gauss.ErrorCode.ARG_IS_NOT_FRA_EXPR,

		/** Error Code throwed by methods that do not receive a add expr when expected */
		ARG_IS_NOT_ADD_EXPR: gauss.ErrorCode.ARG_IS_NOT_ADD_EXPR,

		/** Error Code throwed by methods that do not receive a sub expr when expected */
		ARG_IS_NOT_SUB_EXPR: gauss.ErrorCode.ARG_IS_NOT_SUB_EXPR,

		/** Error Code throwed by methods that do not receive a root expr when expected */
		ARG_IS_NOT_ROOT_EXPR: gauss.ErrorCode.ARG_IS_NOT_ROOT_EXPR,

		/** Error Code throwed by methods that do not receive a poly expr when expected */
		ARG_IS_NOT_POLY_EXPR: gauss.ErrorCode.ARG_IS_NOT_POLY_EXPR,

		/** Error Code throwed by methods that do not receive a list when expected */
		ARG_IS_NOT_LIST_EXPR: gauss.ErrorCode.ARG_IS_NOT_LIST_EXPR,

		/** Error Code throwed by methods that do not accept multivariate polynomials */
		ARG_IS_NOT_UNIVARIATE_POLY: gauss.ErrorCode.ARG_IS_NOT_UNIVARIATE_POLY,

		/** Error Code throwed by methods that do not accept imaginary inputs */
		ARG_IS_IMAGINARY: gauss.ErrorCode.ARG_IS_IMAGINARY,
	};

	Kind = {
		/** Factorial kind */
		FACT: gauss.kind.FACT,

		/** Power kind */
		POW: gauss.kind.POW,

		/** Multiplication kind */
		MUL: gauss.kind.MUL,

		/** Addition kind*/
		ADD: gauss.kind.ADD,

		/** Subtraction kind*/
		SUB: gauss.kind.SUB,

		/** Division kind*/
		DIV: gauss.kind.DIV,

		/** Root kind*/
		ROOT: gauss.kind.ROOT,

		/** Infinity kind*/
		INF: gauss.kind.INF,

		/** Undefined kind*/
		UNDEF: gauss.kind.UNDEF,

		/** Symbol kind */
		SYM: gauss.kind.SYM,

		/** Integer kind */
		INT: gauss.kind.INT,

		/** Fraction kind */
		FRAC: gauss.kind.FRAC,

		/** Fail Kind */
		FAIL: gauss.kind.FAIL,

		/** Function call kind */
		FUNC: gauss.kind.FUNC,
	};
	Error = gauss.Error;

}


/**
 * Class used to store and retrieve expressions.
 *
 * Motivation: This is a new class not present on the base
 * C++ implementation. Sinse JavaScript and WebAssembly
 * don't have good support for destructors/finalizers
 * at the time of writting this documentation, the Scope
 * class is used to store a reference to allocated
 * expressions and can deallocate all resources used by
 * its expressions at once. If this class wasn't used,
 * the programmer will have to manually call a function
 * on each expression to deallocate its resources.
 *
 */
class Scope {
	constructor() {
		this.map = {};
		this.context = [];
	}
};

/**
 * Creates a scope, scopes are needed for
 * creating and assigning expresions.
 * @return {Scope} A scope object that can be used to create
 * and assign expressions.
 */
function scopeCreate() {
	return new Scope();
}

/**
 * Assign one expression to a string key
 * inside a scope, so the expression can be retrieved
 * by querying it using the key.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} key The string key.
 * @param {Expr} a A expression object.
 *
 */
function scopeAssign(scope, key, a) {
	scope.map[key] = a;
}

/**
 * Return the expression from the scope
 * using the string key.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} key The key string.
 *
 * @return {Expr} The expresion object assigned to the key.
 */
function scopeGet(scope, key) {
	return scope.map[key];
}


/**
 * Destroy a scope and deallocate all resources
 * reserved by it and the expressions that it holds. This
 * function is neccessary to avoid leaks when using this
 * library.
 *
 * @param {Scope} scope The scope object to be destroyed.
 */
function scopeDestroy(scope) {
	for (let a of scope.context) {
		a.delete();
	}
}

/**
 * Creates an expression of numeric type.
 * This expression is stored internally as a fraction or a big
 * integer to avoid precision problems with floating point values.
 *
 * @param {Scope} scope scope The scope object.
 * @param {number} v A number value.
 *
 * @return {Expr} The numeric expression.
 */
function numberFromDouble(scope, v) {
	let t = gauss.numberFromDouble(v);
	scope.context.push(t);
	return t;
}

/**
 * Creates an expression of string type.
 * This expression is stored internally as a fraction or a big
 * integer to avoid precision problems with floating point values.
 *
 * @param {Scope} scope scope The scope object.
 * @param {number} v A string value.
 *
 * @return {Expr} The numeric expression.
 */
function numberFromString(scope, v) {
	let t = gauss.numberFromString(v);
	scope.context.push(t);
	return t;
}

/**
 * Creates an expression of symbol type.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x A string value.
 *
 * @return {Expr} The symbol expression.
 */
function symbol(scope, x) {
	let t = gauss.symbol(x);
	scope.context.push(t);
	return t;
}

/**
 * Creates an addition expression inside
 * a scope, the expression is not evaluated, only the
 * abstract tree of the expressions is created during
 * the execution of this method.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 2.5);
 * let y = symbol(scope, 'y');
 *
 * // call add
 * let z = add(scope, x, y);
 * let t = toString(z); // 5/2 + y
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The first operand.
 * @param {Expr} b The second operand.
 *
 * @return {Expr} The addition expression.
 */
function add(scope, a, b) {
	let t = gauss.add(a, b);
	scope.context.push(t);
	return t;
}

/**
 * Creates a subtraction expression inside
 * a scope, the expression is not evaluated, only the
 * abstract tree of the expressions is created during
 * the execution of this method.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 2.5);
 * let y = symbol(scope, 'y');
 *
 * // call sub
 * let z = sub(scope, x, y);
 * let t = toString(z); // 5/2 - y
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The first operand.
 * @param {Expr} b The second operand.
 *
 * @return {Expr} The subtraction expression.
 */
function sub(scope, a, b) {
	let t = gauss.sub(a, b);
	scope.context.push(t);
	return t;
}

/**
 * Creates a multiplication expression inside
 * a scope, the expression is not evaluated, only the
 * abstract tree of the expressions is created during
 * the execution of this method.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 2.5);
 * let y = symbol(scope, 'y');
 *
 * // call mul
 * let z = mul(scope, x, y);
 * let t = toString(z); // 5/2 * y
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The first operand.
 * @param {Expr} b The second operand.
 *
 * @return {Expr} The multiplication expression.
 */
function mul(scope, a, b) {
	let t = gauss.mul(a, b);
	scope.context.push(t);
	return t;
}

/**
 * Creates a division expression inside
 * a scope, the expression is not evaluated, only the
 * abstract tree of the expressions is created during
 * the execution of this method.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 2.5);
 * let y = symbol(scope, 'y');
 *
 * // call div
 * let z = div(scope, x, y);
 * let t = toString(z); // (5/2) / y
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The first operand.
 * @param {Expr} b The second operand.
 *
 * @return {Expr} The division expression.
 */
function div(scope, a, b) {
	let t = gauss.div(a, b);
	scope.context.push(t);
	return t;
}

/**
 * Creates a power expression inside
 * a scope, the expression is not evaluated, only the
 * abstract tree of the expressions is created during
 * the execution of this method.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 2.5);
 * let y = symbol(scope, 'y');
 *
 * // call pow
 * let z = pow(scope, x, y);
 * let t = toString(z); // (5/2)^y
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The base operand.
 * @param {Expr} b The expoent operand.
 *
 * @return {Expr} The power expression.
 */
function pow(scope, a, b) {
	let t = gauss.pow(a, b);
	scope.context.push(t);
	return t;
}


/**
 * Creates a root call expression inside a scope, the
 * expression is not evaluated, only the abstract
 * tree of the expressions is created during the
 * execution of this method.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 4);
 * let y = numberFromDouble(scope, 2);
 *
 * // call root
 * let z = root(scope, x, y);
 * let t = toString(z); // root(4, 2)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The radicand.
 * @param {Expr} b The index.
 *
 * @return {Expr} The root expression.
 */
function root(scope, a, b) {
	let t = gauss.root(a, b);
	scope.context.push(t);
	return t;
}

/**
 * Creates a square root call expression inside a scope,
 * the expression is not evaluated, only the abstract
 * tree of the expressions is created during the
 * execution of this method.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 4);
 *
 * // call sqrt
 * let z = sqrt(scope, x);
 * let t = toString(z); // root(4, 2)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The radicand.
 *
 * @return {Expr} The root expression.
 */
function sqrt(scope, a) {
	let t = gauss.sqrt(a);
	scope.context.push(t);
	return t;
}

/**
 * Creates a abs call expression inside a scope, the
 * expression is not evaluated, only the abstract
 * tree of the expressions is created during the
 * execution of this method.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 4);
 *
 * // call abs
 * let z = abs(scope, x);
 * let t = toString(z); // abs(4)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The operand.
 *
 * @return {Expr} The call to abs function expression.
 */
function abs(scope, a) {
	let t = gauss.abs(a);
	scope.context.push(t);
	return t;
}

/**
 * Get the i'th operand of an expression.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 1);
 * let y = numberFromDouble(scope, 2);
 * let z = numberFromDouble(scope, 3);
 *
 * let a = add(scope, x, y);
 * let b = add(scope, a, z);
 *
 * toString(b); // (1 + 2) + 3
 * toString(getOperand(scope, b, 0)); // 1 + 2
 * toString(getOperand(scope, b, 1)); // 3
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The expression object.
 * @param {number} i The index of the operand.
 *
 * @return {Expr} The i'th operand expression.
 */
function getOperand(scope, a, i) {
	let t = gauss.getOperand(a, i);
	scope.context.push(t);
	return t;
}

/**
 * Set the i'th operand of an expression.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 1);
 * let y = numberFromDouble(scope, 2);
 * let z = numberFromDouble(scope, 3);
 *
 * let a = add(scope, x, y);
 * let b = add(scope, a, z);
 *
 * console.log(toString(b)); // (1 + 2) + 3
 * setOperand(b, 0, x);
 * console.log(toString(b)); // 1 + 3
 *
 * scopeDestroy(scope);
 *
 * @param {Expr} a The expression object.
 * @param {number} i The index of the operand.
 * @param {Expr} b The new operand.
 *
 */
function setOperand(a, i, b) {
	gauss.setOperand(a, i, b);
}

/**
 * Computes if two expressions are equal.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 1);
 * let y = numberFromDouble(scope, 1);
 * let z = numberFromDouble(scope, 3);
 *
 * console.log(isEqual(x, y)); // true
 * console.log(isEqual(x, z)); // false
 *
 * scopeDestroy(scope);
 *
 * @param {Expr} a The first operand.
 * @param {Expr} b The second operand.
 *
 * @return {Bool} The result of the comparison.
 */
function isEqual(a, b) {
	return gauss.isEqual(a, b);
}

/**
 * Return a new expression equal to the degree of
 * a pow expression.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 1);
 * let y = numberFromDouble(scope, 2);
 * let z = pow(scope, x, y);
 *
 * let w = powDegree(scope, z);
 * console.log(toString(w)); // 2
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The pow expression.
 *
 * @return {Expr} The degree expresion.
 */
function powDegree(scope, a) {
	let t = gauss.powDegree(a);
	scope.context.push(t);
	return t;
}

/**
 * Return a new expression equal to the degree of
 * a pow expression.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 1);
 * let y = numberFromDouble(scope, 2);
 * let z = pow(scope, x, y);
 *
 * let w = powBase(scope, z);
 * console.log(toString(w)); // 1
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The pow expression.
 *
 * @return {Expr} The base expresion.
 */
function powBase(scope, a) {
	let t = gauss.powBase(a);
	scope.context.push(t);
	return t;
}

/**
 * Return a new expression equal to the index of
 * a root expression.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 1);
 * let y = numberFromDouble(scope, 2);
 * let z = root(scope, x, y);
 *
 * let w = rootIndex(scope, z);
 * console.log(toString(w)); // 2
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The root expression.
 *
 * @return {Expr} The index expresion.
 */
function rootIndex(scope, a) {
	let t = gauss.rootIndex(a);
	scope.context.push(t);
	return t;
}


/**
 * Return a new expression equal to the radicand of
 * a root expression.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 1);
 * let y = numberFromDouble(scope, 2);
 * let z = root(scope, x, y);
 *
 * let w = rootRadicand(scope, z);
 * console.log(toString(w)); // 1
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The root expression.
 *
 * @return {Expr} The radicand expresion.
 */
function rootRadicand(scope, a) {
	let t = gauss.rootRadicand(a);
	scope.context.push(t);
	return t;
}

/**
 * Return a new expression equal to the numerator of
 * an expression.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 1);
 * let y = numberFromDouble(scope, 2);
 * let z = div(scope, x, y);
 *
 * let w = numerator(scope, z);
 * console.log(toString(w)); // 1
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The expression.
 *
 * @return {Expr} The numerator expresion.
 */
function numerator(scope, a) {
	let t = gauss.numerator(a);
	scope.context.push(t);
	return t;
}

/**
 * Return a new expression equal to the denominator of
 * an expression.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 1);
 * let y = numberFromDouble(scope, 2);
 * let z = div(scope, x, y);
 *
 * let w = denominator(scope, z);
 * console.log(toString(w)); // 1
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The expression.
 *
 * @return {Expr} The denominator expresion.
 */
function denominator(scope, a) {
	let t = gauss.denominator(a);
	scope.context.push(t);
	return t;
}

/**
 * Return the kind of the expression.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 1);
 * let y = symbol(scope,'x');
 * let z = div(scope, x, y);
 *
 * console.log(kindOf(x) == Kind.INT); // true
 * console.log(kindOf(y) == Kind.SYM); // true
 * console.log(kindOf(z) == Kind.DIV); // true
 *
 * scopeDestroy(scope);
 *
 * @param {Expr} a The expression.
 *
 * @return {Kind} The Kind of the expresion.
 */
function kindOf(a) {
	return gauss.kindOf(a);
}

/**
 * Return if an expression is of a given set of kinds.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = numberFromDouble(scope, 1);
d *
 * console.log(is(x, Kind.INT)); // true
 * console.log(is(x, Kind.DIV)); // false
 * console.log(is(x, Kind.INT | Kind.DIV)); // true
 *
 * scopeDestroy(scope);
 *
 * @param {Expr} a The expression.
 * @param {Kind} k The kind value.
 *
 * @return {Bool} true if the expression is of at least one
 * of the given kinds, false otherwise.
 */
function is(a, k) {
	return gauss.is(a, k);
}

/**
 * Return a reduced expression without expanding.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let z = add(scope,
 *	add(scope,
 *		numberFromDouble(scope, 1),
 *		symbol(scope, 'x'),
 *	),
 *	add(scope,
 *		symbol(scope, 'x'),
 *		numberFromDouble(scope 3)
 *	)
 * );
 *
 * console.log(toString(z)); // (1 + x) + (x + 3)
 *
 * let w = reduce(scope, z);
 *
 * console.log(toString(w)); // 2*x + 4
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The expression.
 *
 * @return {Expr} The reduced expresion.
 */
function reduce(scope, a) {
	let t = gauss.reduce(a);
	scope.context.push(t);
	return t;
}

/**
 * Return a expanded and reduced expression.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let z = mul(scope,
 *	add(scope,
 *		numberFromDouble(scope, 2),
 *		symbol(scope, 'x'),
 *	),
 *	add(scope,
 *		symbol(scope, 'x'),
 *		numberFromDouble(scope 3)
 *	)
 * );
 *
 * console.log(toString(z)); // (2 + x) * (x + 3)
 *
 * let w = expand(scope, z);
 *
 * console.log(toString(w)); // x^2 + 5x + 6
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The expression.
 *
 * @return {Expr} The expanded expression.
 */
function expand(scope, a) {
	let t = gauss.expand(a);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the log function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let y = symbol(scope, 'y');
 * let z = log(scope, x, y);
 *
 * console.log(toString(z)); // log(x, y)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The power for the log expression.
 * @param {Expr} b The base for the log expression.
 *
 * @return {Expr} A call expression to the log function.
 */
function log(scope, a, b) {
	let t = gauss.log(a, b);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the ln function.
 *
G * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = ln(scope, x);
 *
 * console.log(toString(z)); // ln(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The power for the ln expression.
 *
 * @return {Expr} A call expression to the ln function.
 */
function ln(scope, a) {
	let t = gauss.ln(a);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the exp function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = exp(scope, x);
 *
 * console.log(toString(z)); // exp(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The argument for the exp expression.
 *
 * @return {Expr} A call expression to the exp function.
 */
function exp(scope, a) {
	let t = gauss.exp(a);
	scope.context.push(t);
	return t;
}

/**
 * Return a new expression where the symbol 'x' on 'a'
 * is replaced by 'v'.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let y = symbol(scope, 'y');
 * let z = add(scope, x, y);
 *
 * console.log(toString(z)); // x + y
 *
 * let k = replace(scope, z, x, y);
 *
 * console.log(toString(k)); // y + y
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The expression object.
 * @param {Expr} x The symbol to be replaced.
 * @param {Expr} v The expression that will replace x.
 *
 * @return {Expr} A expression object.
 */
function replace(scope, a, x, v) {
	let t = gauss.replace(a, x, v);
	scope.context.push(t);
	return t;
}

/**
 * Return a new expression where the symbol 'x' on 'a'
 * is replaced by 'v' and the resulting expression is
 * reduced.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let y = symbol(scope, 'y');
 * let z = add(scope, x, y);
 *
 * console.log(toString(z)); // x + y
 *
 * let k = evalSymbol(scope, z, x, y);
 *
 * console.log(toString(k)); // 2*y
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The expression object.
 * @param {Expr} x The symbol to be replaced.
 * @param {Expr} v The expression that will replace x.
 *
 * @return {Expr} A expression object.
 */
function evalSymbol(scope, a, x, v) {
	let t = gauss.eval(a, x, v);
	scope.context.push(t);
	return t;
}

/**
 * Return a set with the free symbols of an expression.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let y = symbol(scope, 'y');
 * let z = numberFromDouble(scope, 2);
 *
 * let w = add(scope, x, add(y, z));
 *
 * let k = freeSymbols(scope, 2);
 *
 * console.log(toString(k)); // {x, y}
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} u The expression object.
 *
 * @return {Expr} A set of symbols.
 */
function freeSymbols(scope, u) {
	let t = gauss.freeVariables(u);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the sinh function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = sinh(scope, x);
 *
 * console.log(toString(z)); // sinh(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The sinh argument.
 *
 * @return {Expr} A call expression to the sinh function.
 */
function sinh(scope, x) {
	let t = gauss.sinh(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the cosh function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = cosh(scope, x);
 *
 * console.log(toString(z)); // cosh(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The cosh argument.
 *
 * @return {Expr} A call expression to the cosh function.
 */
function cosh(scope, x) {
	let t = gauss.sinh(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the tanh function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = tanh(scope, x);
 *
 * console.log(toString(z)); // tanh(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The tanh argument.
 *
 * @return {Expr} A call expression to the tanh function.
 */
function tanh(scope, x) {
	let t = gauss.tanh(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the cos function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = cos(scope, x);
 *
 * console.log(toString(z)); // cos(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The cos argument.
 *
 * @return {Expr} A call expression to the cos function.
 */
function cos(scope, x) {
	let t = gauss.cos(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the sin function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = sin(scope, x);
 *
 * console.log(toString(z)); // sin(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The sin argument.
 *
 * @return {Expr} A call expression to the sin function.
 */
function sin(scope, x) {
	let t = gauss.sin(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the tan function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = tan(scope, x);
 *
 * console.log(toString(z)); // tan(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The tan argument.
 *
 * @return {Expr} A call expression to the tan function.
 */
function tan(scope, x) {
	let t = gauss.tan(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the csc function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = csc(scope, x);
 *
 * console.log(toString(z)); // csc(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The csc argument.
 *
 * @return {Expr} A call expression to the csc function.
 */
function csc(scope, x) {
	let t = gauss.csc(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the cot function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = cot(scope, x);
 *
 * console.log(toString(z)); // cot(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The cot argument.
 *
 * @return {Expr} A call expression to the cot function.
 */
function cot(scope, x) {
	let t = gauss.cot(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the sec function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = sec(scope, x);
 *
 * console.log(toString(z)); // sec(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The sec argument.
 *
 * @return {Expr} A call expression to the sec function.
 */
function sec(scope, x) {
	let t = gauss.sec(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the coth function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = coth(scope, x);
 *
 * console.log(toString(z)); // coth(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The coth argument.
 *
 * @return {Expr} A call expression to the coth function.
 */
function coth(scope, x) {
	let t = gauss.coth(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the sech function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = sech(scope, x);
 *
 * console.log(toString(z)); // sech(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The sech argument.
 *
 * @return {Expr} A call expression to the sech function.
 */
function sech(scope, x) {
	let t = gauss.sech(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the csch function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = csch(scope, x);
 *
 * console.log(toString(z)); // csch(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The csch argument.
 *
 * @return {Expr} A call expression to the csch function.
 */
function csch(scope, x) {
	let t = gauss.csch(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the arccos function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = arccos(scope, x);
 *
 * console.log(toString(z)); // arccos(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The arccos argument.
 *
 * @return {Expr} A call expression to the arccos function.
 */
function arccos(scope, x) {
	let t = gauss.arccos(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the arcsin function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = arcsin(scope, x);
 *
 * console.log(toString(z)); // arcsin(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The arcsin argument.
 *
 * @return {Expr} A call expression to the arcsin function.
 */
function arcsin(scope, x) {
	let t = gauss.arcsin(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the arctan function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = arctan(scope, x);
 *
 * console.log(toString(z)); // arctan(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The arctan argument.
 *
 * @return {Expr} A call expression to the arctan function.
 */
function arctan(scope, x) {
	let t = gauss.arctan(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the arccot function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = arccot(scope, x);
 *
 * console.log(toString(z)); // arccot(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The arccot argument.
 *
 * @return {Expr} A call expression to the arccot function.
 */
function arccot(scope, x) {
	let t = gauss.arccot(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the arcsec function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = arcsec(scope, x);
 *
 * console.log(toString(z)); // arcsec(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The arcsec argument.
 *
 * @return {Expr} A call expression to the arcsec function.
 */
function arcsec(scope, x) {
	let t = gauss.arcsec(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the arccsc function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = arccsc(scope, x);
 *
 * console.log(toString(z)); // arccsc(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The arccsc argument.
 *
 * @return {Expr} A call expression to the arccsc function.
 */
function arccsc(scope, x) {
	let t = gauss.arccsc(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the arccosh function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = arccosh(scope, x);
 *
 * console.log(toString(z)); // arccosh(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The arccosh argument.
 *
 * @return {Expr} A call expression to the arccosh function.
 */
function arccosh(scope, x) {
	let t = gauss.arccosh(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a call to the arctanh function.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let x = symbol(scope, 'x');
 * let z = arctanh(scope, x);
 *
 * console.log(toString(z)); // arctanh(x)
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} x The arctanh argument.
 *
 * @return {Expr} A call expression to the arctanh function.
 */
function arctanh(scope, x) {
	let t = gauss.arctanh(x);
	scope.context.push(t);
	return t;
}

/**
 * Return a matrix filled with zeros.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let z = matrixZeros(scope, 2, 2);
 *
 * console.log(toString(z)); // [[0,0],[0,0]]
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {number} rows The number of rows of the matrix.
 * @param {number} columns The number of columns of the matrix.
 *
 * @return {Expr} A matrix expression.
 */
function matrixZeros(scope, rows, columns) {
	let t = gauss.matrix(rows, columns);
	scope.context.push(t);
	return t;
}

/**
 * Return a identity matrix.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let z = matrixIdentity(scope, 2, 2);
 *
 * console.log(toString(z)); // [[1,0],[0,1]]
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {number} rows The number of rows of the matrix.
 * @param {number} columns The number of columns of the matrix.
 *
 * @return {Expr} A matrix expression.
 */
function matrixIdentity(scope, rows, columns) {
	let t = gauss.identity(rows, columns);
	scope.context.push(t);
	return t;
}

/**
 * Return a copy of an element inside a matrix.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let z = matrixIdentity(scope, 2, 2);
 *
 * console.log(toString(matrixGet(scope, z, 0, 0))); // 1
 * console.log(toString(matrixGet(scope, z, 0, 1))); // 0
 *
 * scopeDestroy(scope);
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} M The matrix expression.
 * @param {number} row The rows of element inside the matrix.
 * @param {number} column The column of the element inside the matrix.
 *
 * @return {Expr} A matrix expression.
 */
function matrixGet(scope, M, row, column) {
	let t = gauss.matrixGet(M, row, column);
	scope.context.push(t);
	return t;
}

/**
 * Set an element inside a matrix.
 *
 * @example
 * let scope = scopeCreate();
 *
 * let z = matrixIdentity(scope, 2, 2);
 *
 * console.log(toString(z)); // [[1,0],[0,1]]
 * matrixSet(z, 0, 0, 2);
 * console.log(toString(z)); // [[2,0],[0,1]]
 *
 * scopeDestroy(scope);
 *
 * @param {Expr} M The matrix expression.
 * @param {number} row The rows of element inside the matrix.
 * @param {number} column The column of the element inside the matrix.
 * @param {number} a The number to be placed on the matrix.
 *
 */
function matrixSet(M, row, column, a) {
	gauss.matrixSet(M, row, column, a);
}

/**
 * Compute the singular value decomposition of a matrix
 * expression.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} M The matrix expression.
 *
 * @return {Expr} A list expression with three matrices
 * representing the singular value decomposition of M.
 */
function matrixSVD(scope, M) {
	let t = gauss.svd(M);
	scope.context.push(t);
	return t;
}

/**
 * Compute the inverse of a matrix expression.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} M The matrix expression.
 *
 * @return {Expr} A matrix expression corresponding
 * to the inverse of M.
 */
function matrixInverse(scope, M) {
	let t = gauss.inverse(M);
	scope.context.push(t);
	return t;
}

/**
 * Compute the determinant of a matrix expression.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} M The matrix expression.
 *
 * @return {Expr} The determinant of the matrix
 * expression.
 */
function matrixDeterminant(scope, M) {
	let t = gauss.det(M);
	scope.context.push(t);
	return t;
}

/**
 * Compute the transpose of a matrix expression.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} M The matrix expression.
 *
 * @return {Expr} The determinant of the matrix
 * expression.
 */
function matrixTranspose(scope, M) {
	let t = gauss.transpose(M);
	scope.context.push(t);
	return t;
}

/**
 * Compute the solution of a linear system.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} M The matrix with the equation coefficients.
 * @param {Expr} b The matrix with the equation values.
 *
 * @return {Expr} The matrix expression with the solutions.
 */
function solveLinearSystem(scope, M, b) {
	let t = gauss.solveLinear(M, b);
	scope.context.push(t);
	return t;
}

/**
 * Get the degree of a polynomial on a given symbol.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} p The polynomial expression.
 * @param {Expr} x The symbol in p.
 *
 * @return {Expr} The degree expression.
 */
function polynomialDegree(scope, p, x) {
	let t = gauss.degreePoly(p, x);
	scope.context.push(t);
	return t;
}

/**
 * Get the coefficient of a polynomial on a given
 * symbol and degree.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} p The polynomial expression.
 * @param {Expr} x The symbol in p.
 * @param {Expr} x The symbol in p.
 *
 * @return {Expr} The coefficient expression.
 */
function polynomialCoefficient(scope, p, x, d) {
	let t = gauss.coefficientPoly(p, x, d);
	scope.context.push(t);
	return t;
}

/**
 * Get the leading coefficient of a polynomial on a
 * given symbol.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} p The polynomial expression.
 * @param {Expr} x The symbol in p.
 *
 * @return {Expr} The leading coeffient expression.
 */
function polynomialLeadingCoefficient(scope, p, x) {
	let t = gauss.leadingCoefficientPoly(p, x);
	scope.context.push(t);
	return t;
}

/**
 * Compute all the real and imaginary roots of an
 * univariate polynomial with real coefficients.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} p The polynomial expression.
 *
 * @return {Expr} A list with all the roots withing
 * a reasonable precision.
 */
function polynomialRoots(scope, p) {
	let t = gauss.rootsOfPoly(p, x);
	scope.context.push(t);
	return t;
}

/**
 * Compute irreducible factorization of a
 * multivariate polynomial.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} p The polynomial expression.
 *
 * @return {Expr} The factorized form of a polynomial expression.
 */
function polynomialFactors(scope, p) {
	let t = gauss.factorPoly(p);
	scope.context.push(t);
	return t;
}

/**
 * Compute the resultant between two polynomial
 * expressions.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} u A polynomial expression.
 * @param {Expr} v A polynomial expression.
 *
 * @return {Expr} The resultant between u and v.
 */
function polynomialResultant(scope, u, v) {
	let t = gauss.resultantOfPoly(u, v);
	scope.context.push(t);
	return t;
}

/**
 * Compute division between two polynomials and return
 * a expression of form 'quotient + remainder'
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} u A polynomial expression.
 * @param {Expr} v A polynomial expression.
 *
 * @return {Expr} A addition expression where the first
 * operand is the quotient and the second is the
 * remainder of the division.
 */
function polynomialDiv(scope, u, v) {
	let t = gauss.divPoly(u, v);
	scope.context.push(t);
	return t;
}

/**
 * Compute greatest commom divisor between two polynomials.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} u A polynomial expression.
 * @param {Expr} v A polynomial expression.
 *
 * @return {Expr} The gcd expression.
 */
function polynomialGCD(scope, u, v) {
	let t = gauss.gcdPoly(u, v);
	scope.context.push(t);
	return t;
}

/**
 * Compute least commom multiple between two polynomials.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} u A polynomial expression.
 * @param {Expr} v A polynomial expression.
 *
 * @return {Expr} The lcm expression.
 */
function polynomialLCM(scope, u, v) {
	let t = gauss.lcmPoly(u, v);
	scope.context.push(t);
	return t;
}

/**
 * Compute the projection of a polynomial expression
 * on a finite field of length p.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} u A polynomial expression.
 * @param {number} p A integer number.
 *
 * @return {Expr} The projection of u on Z_{p}.
 */
function polynomialProjectFiniteField(scope, u, p) {
	let t = gauss.projectPolyFiniteField(u, u, p);
	scope.context.push(t);
	return t;
}

/**
 * Compute the Division of two polynomial expressions
 * on a finite field of length p.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} u A polynomial expression.
 * @param {Expr} v A polynomial expression.
 * @param {number} p A integer number.
 *
 * @return {Expr} The division of u by v on Z_{p}, the
 * the expression is returned as an addition of quotient
 * and remainder.
 */
function polynomialDivFiniteField(scope, u, v, p) {
	let t = gauss.divPolyFiniteField(u, u, v, p);
	scope.context.push(t);
	return t;
}

/**
 * Compute the derivative of an expression by a given
 * symbol.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} u A polynomial expression.
 * @param {Expr} x A symbol expression.
 *
 * @return {Expr} The derivative of u by x.
 */
function derivative(scope, u, x) {
	let t = gauss.derivative(u, x);
	scope.context.push(t);
	return t;
}

/**
 * Compute a string representation of
 * a expression.
 *
 * @param {Expr} a The expression.
 *
 * @return {String} The string representation
 * of the expression.
 */
function toString(a) {
	return gauss.toString(a);
}

/**
 * Compute a latex representation of
 * a expression.
 *
 * @param {Expr} a The expression.
 *
 * @return {String} The latex representation
 * of the expression.
 */
function toLatex(a) {
	return gauss.toLatex(a, true, 999999);
}

/**
 * Compute the i'th prime number.
 *
 * @param {Scope} scope The scope object.
 * @param {number} i The index of the prime number.
 *
 * @return {Expr} The prime number.
 */
function prime(scope, i) {
	let t = gauss.prime(i);
	scope.context.push(t);
	return t;
}

/**
 * Compute the prime factorization of a integer
 * expression.
 *
 * @param {Scope} scope The scope object.
 * @param {Expr} a The integer expression.
 *
 * @return {Expr} The product of all prime factors of a.
 * The first number returned is 1 or -1, meaning the sign of a.
 */
function primeFactors(scope, a) {
	let t = gauss.primeFactors(a);
	scope.context.push(t);
	return t;
}

/**
 * Get the error code of an error object.
 *
 * @param {GaussError} The error object.
 *
 * @return {ErrorCode} The error code of the
 * error object.
 */
function errorCode(a) {
	return gauss.errorCode(a);
}

/**
 * Get the error argument, this argument is an
 * number where its meaning is dependent on the
 * context and errro code throwed.
 *
 * @param {GaussError} The error object.
 *
 * @return {number} The error argument.
 */
function errorArg(a) {
	return gauss.errorArg(a);
}

module.exports = {
	Expr,
	ErrorCode,
	Kind,
	Error,
	init,
	Scope,
	scopeCreate,
	scopeAssign,
	scopeGet,
	scopeDestroy,
	numberFromDouble,
	numberFromDouble,
	symbol,
	add,
	sub,
	mul,
	div,
	pow,
	root,
	sqrt,
	abs,
	getOperand,
	setOperand,
	isEqual,
	powDegree,
	powBase,
	rootIndex,
	rootRadicand,
	numerator,
	denominator,
	kindOf,
	is,
	reduce,
	expand,
	log,
	ln,
	exp,
	replace,
	evalSymbol,
	freeSymbols,
	sinh,
	cosh,
	tanh,
	cos,
	sin,
	tan,
	csc,
	cot,
	sec,
	coth,
	sech,
	csch,
	arccos,
	arcsin,
	arctan,
	arccot,
	arcsec,
	arccsc,
	arccosh,
	arctanh,
	matrixZeros,
	matrixIdentity,
	matrixGet,
	matrixSet,
	matrixSVD,
	matrixInverse,
	matrixDeterminant,
	matrixTranspose,
	solveLinearSystem,
	polynomialDegree,
	polynomialCoefficient,
	polynomialLeadingCoefficient,
	polynomialRoots,
	polynomialFactors,
	polynomialResultant,
	polynomialDiv,
	polynomialGCD,
	polynomialLCM,
	polynomialProjectFiniteField,
	polynomialDivFiniteField,
	derivative,
	toString,
	toLatex,
	prime,
	primeFactors,
	errorCode,
	errorArg,
}
