/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

import { MagicParser, ASTNode, ASTKind } from './parser'

import { Spinner } from '../components/Spinner'

// eslint-disable-next-line
// @ts-ignore
import * as gauss from 'gauss-js'

import katex from 'katex'

import parse from 'html-react-parser'

import '../styles/interpreter.scss'

import { APIKind, APINode, APIParser } from './api/parser'

import search_icon from '../static/search_black_24dp.svg'

// eslint-disable-next-line
// @ts-ignore
import functionPlot from "function-plot";


type APIQueryDesc = {
	query: string,
	exec: string,
	brief: string,
	example: string,
	output: string,
};

type APIFunctionDesc = {
	name: string,
	args: string[],
	func: string,
};

type APIDesc = {
	querys: APIQueryDesc[],
	functions: APIFunctionDesc[],
}

type APIDocDesc = {
	kind: "query",
	brief: string,
	output: APINode,
	example: string,
	exec: string,
}

type MagicAPIWord = {
	kind: "word"
	next: { [key: string]: MagicAPINode },
};

type MagicAPIArgument = {
	key: number
	kind: "input"
	type: string
	next: { [key: string]: MagicAPINode },
};

type MagicAPINode = MagicAPIArgument | MagicAPIWord | APIDocDesc;

type APIFunction = {
	exec: string,
	args: string[],
};

type API = {
	querys: MagicAPINode,
	functions: { [key: string]: APIFunction }
};

function InterpreterError(msg: string) {
	throw new Error(msg);
}

function FunctionPlot(args: {
	fn: string,
	id: string,
	// xAxis: { domain: { start: number, end: number } },
	// yAxis: { domain: { start: number, end: number } },
}) {

	useEffect(() => {
		functionPlot({
			target: "#" + args.id,
			grid: true,
			data: [
				{
					fn: args.fn,
					color: "#000000"
				},
			]
		});
	});

	return <div className="graphic" id={args.id}></div>;
}

function AsyncContent({ element }: { element: Promise<JSX.Element> }) {
	const [content, setContent] = useState(<div style={{ marginLeft: '45%' }}><Spinner/></div>);

	useEffect(() => {
		const resolve = async () => {
			setContent(await element);
		}

		resolve();
	}, [content])

	return (
		<div>
			{
				content
			}
		</div>
	)
}


export class MagicInterpreter {
	culture: string;

	api: API;

	scope: gauss.Scope | null;


	constructor() {
		this.culture = "en-US";

		this.api = {
			querys: {
				kind: 'word',
				next: {}
			},
			functions: {},
		};

		this.scope = null;
	}


	private async fetchAPI(culture: string) {
		this.culture = culture;

		const req = await fetch('./api/' + this.culture + ".json", {
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		});

		const api = await req.json();

		const dsc: APIDesc = api;

		this.registerAPI(dsc);
	}

	public async init(culture: string) {
		this.culture = culture;

		this.api = {
			querys: {
				kind: 'word',
				next: {}
			},
			functions: {},
		};

		await this.fetchAPI(culture);

		await gauss.init();

		this.scope = gauss.scopeCreate();

	}

	public stop() {
		if (!this.scope) {
			throw new Error("Interpreter wasnt initialized!");
		}

		gauss.scopeDestroy(this.scope)
	}


	private registerAPI(dsc: APIDesc) {
		const parser = new APIParser();

		this.api.functions = {};

		for (const func of dsc.functions) {
			this.api.functions[func.name] = {
				exec: func.func,
				args: func.args
			};
		}

		for (const func of dsc.querys) {
			let node: APINode | undefined = parser.parse(func.query);

			let api = this.api.querys;

			while (node) {
				if (!node.left) {
					throw new Error('Expecting left argument');
				}

				const curr = node.left;

				if(!api.kind) {
					throw new Error("the query is not valid!");
				}

				if (api.kind === "query") {
					throw new Error('something went wrong!');
				}

				if(!curr.kind) {
					throw new Error("the query is not valid");
				}

				if (curr.kind === APIKind.API_TEMPLATE) {
					throw new Error('API Query cant have templates');
				}

				if (curr.kind === APIKind.API_STRING_LITERAL) {
					if (!curr.token) {
						throw new Error('api string does not have a token');
					}

					api.next[curr.token.value] = {
						kind: "word",
						next: {},
					};

					api = api.next[curr.token.value];
				}

				if (curr.kind === APIKind.API_ARG) {
					if (!curr.left) {
						throw new Error('APINode left operand is undefined');
					}

					if (!curr.right) {
						throw new Error('APINode left operand is undefined');
					}

					const key = curr.left;

					if (key.kind != APIKind.API_NUMBER_LITERAL) {
						throw new Error('argument key should be a number');
					}

					if (!key.token) {
						throw new Error('argument key token is undefined');
					}

					const typ = curr.right;

					if (!typ.token) {
						throw new Error('argument type token is undefined');
					}

					if (api.kind === "query") {
						throw new Error('something went wrong!');
					}

					api.next['input'] = {
						key: Number(key.token.value),
						kind: "input",
						type: typ.token.value,
						next: {}
					};

					api = api.next['input'];
				}

				node = node.right;
			}

			if(!api.kind) {
				throw new Error("the query is not valid!");
			}

			if (api.kind === "query") {
				throw new Error("query node shouldn't be registered at this point");
			}

			api.next['query'] = {
				kind: "query",
				brief: func.brief,
				exec: func.exec,
				example: func.example,
				output: parser.parse(func.output)
			}
		}
	}

	private parse(src: string): ASTNode {
		const parser = new MagicParser(src, this.culture);

		return parser.parse();
	}

	private compileAlgExpression(tree: ASTNode): any {
		if (this.scope === null) {
			return InterpreterError('scope not initialized');
		}

		if(!tree.kind) {
			throw new Error("the query is not valid!");
		}

		if (tree.kind == ASTKind.AST_NUMBER) {
			return gauss.numberFromDouble(this.scope, Number(tree.token?.value));
		}

		if (tree.kind == ASTKind.AST_STRING) {
			return gauss.symbol(this.scope, tree.token?.value);
		}

		if (tree.kind == ASTKind.AST_OP_ADD) {
			if (tree.left == null) {
				return InterpreterError('left operand is not defined');
			}

			if (tree.right == null) {
				return InterpreterError('right operand is not defined');
			}

			return gauss.add(this.scope, this.compileAlgExpression(tree.left), this.compileAlgExpression(tree.right));
		}


		if (tree.kind == ASTKind.AST_OP_SUB) {
			if (tree.left == null) {
				return InterpreterError('left operand is not defined');
			}

			if (tree.right == null) {
				return InterpreterError('right operand is not defined');
			}
			return gauss.sub(this.scope, this.compileAlgExpression(tree.left), this.compileAlgExpression(tree.right));
		}

		if (tree.kind == ASTKind.AST_OP_MUL) {
			if (tree.left == null) {
				return InterpreterError('left operand is not defined');
			}

			if (tree.right == null) {
				return InterpreterError('right operand is not defined');
			}
			return gauss.mul(this.scope, this.compileAlgExpression(tree.left), this.compileAlgExpression(tree.right));
		}

		if (tree.kind == ASTKind.AST_OP_POW) {
			if (tree.left == null) {
				return InterpreterError('left operand is not defined');
			}

			if (tree.right == null) {
				return InterpreterError('right operand is not defined');
			}
			return gauss.pow(this.scope, this.compileAlgExpression(tree.left), this.compileAlgExpression(tree.right));
		}


		if (tree.kind == ASTKind.AST_OP_DIV) {
			if (tree.left == null) {
				return InterpreterError('left operand is not defined');
			}

			if (tree.right == null) {
				return InterpreterError('right operand is not defined');
			}
			return gauss.div(this.scope, this.compileAlgExpression(tree.left), this.compileAlgExpression(tree.right));
		}

		if (tree.kind == ASTKind.AST_FUNC_CALL) {
			if (!tree.left || !tree.left.token) throw new Error('Invalid Function name');
			if (!tree.right) throw new Error('Invalid function arguments');

			const name = tree.left.token.value;

			let arg: ASTNode | undefined = tree.right;

			let args: any[] = [];

			while (arg) {
				if (!arg.left) throw new Error('Function argument is undefined');

				args = args.concat([
					this.compileAlgExpression(arg.left)
				]);

				arg = arg.right;
			}

			if (this.api.functions[name].exec === 'sin') {
				if (args.length != 1) throw new Error('The sine function expects exactly 1 argument!');
				return gauss.sin(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'cos') {
				if (args.length != 1) throw new Error('The cosine function expects exactly 1 argument!');
				return gauss.cos(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'tan') {
				if (args.length != 1) throw new Error('The tangent function expects exactly 1 argument!');
				return gauss.tan(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'sinh') {
				if (args.length != 1) throw new Error('The hyperbolic sine function expects exactly 1 argument!');
				return gauss.sinh(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'cosh') {
				if (args.length != 1) throw new Error('The hyperbolic cosine function expects exactly 1 argument!');
				return gauss.cosh(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'tanh') {
				if (args.length != 1) throw new Error('The hyperbolic tangent function expects exactly 1 argument!');
				return gauss.tanh(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'csc') {
				if (args.length != 1) throw new Error('The cosecant function expects exactly 1 argument!');
				return gauss.csc(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'cot') {
				if (args.length != 1) throw new Error('The cotangent function expects exactly 1 argument!');
				return gauss.cot(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'sec') {
				if (args.length != 1) throw new Error('The secant function expects exactly 1 argument!');
				return gauss.sec(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'coth') {
				if (args.length != 1) throw new Error('The hyperbolic cotangent function expects exactly 1 argument!');
				return gauss.coth(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'sech') {
				if (args.length != 1) throw new Error('The hyperbolic secant function expects exactly 1 argument!');
				return gauss.sech(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'csch') {
				if (args.length != 1) throw new Error('The hyperbolic cosecant function expects exactly 1 argument!');
				return gauss.csch(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'arccsch') {
				if (args.length != 1) throw new Error('The inverse hyperbolic cosecant function expects exactly 1 argument!');
				return gauss.arccsch(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'arccsc') {
				if (args.length != 1) throw new Error('The inverse cosecant function expects exactly 1 argument!');
				return gauss.arccsc(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'arcsech') {
				if (args.length != 1) throw new Error('The inverse hyperbolic secant function expects exactly 1 argument!');
				return gauss.arcsech(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'arccosh') {
				if (args.length != 1) throw new Error('The inverse hyperbolic cosine function expects exactly 1 argument!');
				return gauss.arccosh(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'arctanh') {
				if (args.length != 1) throw new Error('The inverse hyperbolic tanhent function expects exactly 1 argument!');
				return gauss.arccosh(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'arcsec') {
				if (args.length != 1) throw new Error('The inverse secant function expects exactly 1 argument!');
				return gauss.arcsec(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'arccot') {
				if (args.length != 1) throw new Error('The inverse cotangent function expects exactly 1 argument!');
				return gauss.arccot(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'arccos') {
				if (args.length != 1) throw new Error('The inverse cosine function expects exactly 1 argument!');
				return gauss.arccos(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'arcsin') {
				if (args.length != 1) throw new Error('The inverse sine function expects exactly 1 argument!');
				return gauss.arcsin(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'arctan') {
				if (args.length != 1) throw new Error('The inverse tangent function expects exactly 1 argument!');
				return gauss.arctan(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'sqrt') {
				if (args.length != 1) throw new Error('The square root function expects exactly 1 argument!');
				return gauss.sqrt(this.scope, args[0]);
			}

			if (this.api.functions[name].exec === 'root') {
				if (args.length != 2) throw new Error('The root function expects exactly 1 argument!');
				return gauss.root(this.scope, args[0], args[1]);
			}

			throw new Error("Function '" + name + "' is not defined on the API");
		}

		return InterpreterError('tree is not a valid expression');
	}

	private compileCompListExpression(tree: ASTNode): any[] {
		let nodes: any[] = [];

		if (tree.left) {
			nodes = nodes.concat(this.compileAlgExpression(tree.left));
		}

		if (tree.right) {
			nodes = nodes.concat(this.compileAlgExpression(tree.right));
		}

		return nodes;
	}

	private compileExpression(tree: ASTNode): any[] {
		if (tree.kind == ASTKind.AST_COMPOUND_LIST) {
			return this.compileCompListExpression(tree);
		}

		return [this.compileAlgExpression(tree)];
	}


	private handleAPICall(api: MagicAPINode, call?: ASTNode) {
		if (!call) {
			throw new Error('call tree not defined');
		}

		// TODO: change any to GaussExpr type when that
		// gets implemented
		const args: {
			[key: number]: {
				type: string,
				expr?: any,
				str?: string,
				int?: number,
			}
		} = {};

		while (api && api.kind != "query") {
			if (!call) {
				if (!api.next['query']) {
					throw new Error('query is not defined');
				}

				api = api.next['query'];

				break;
			}

			if (call.kind != ASTKind.AST_PHRASE || !call.left) {
				throw new Error('API call shoud be a phrase!');
			}


			if (call.left.kind !== ASTKind.AST_STRING) {
				api = api.next['input'];

				if(!api || !api.kind) {
					throw new Error("invalid query!");
				}

				if (api.kind != 'input') {
					throw new Error('Expecting an input!');
				}

				if (api.type === "expression") {
					args[api.key] = { expr: this.compileExpression(call.left)[0], type: "expression" };
				}

				if (api.type === "string") {
					if (!call.left || !call.left.token) {
						throw new Error('Left node of phrase is note defined');
					}

					args[api.key] = { str: call.left.token.value, type: "string" };
				}

				if (api.type === "integer") {
					if (!call.left || !call.left.token) {
						throw new Error('Left node of phrase is note defined');
					}

					args[api.key] = { int: Number(call.left.token.value), type: "integer" };
				}
			}

			if (call.left.kind === ASTKind.AST_STRING) {
				if (!call.left.token) {
					throw new Error('Left node of phrase is note defined');
				}

				const word = call.left.token.value;

				const n = api.next[word];

				if(n === undefined) {
					api = api.next['input'];

					if(api === undefined) {
						throw new Error('Invalid Query');
					}

					if (api.kind != 'input') {
						throw new Error('Expecting an input!');
					}

					if (api.type === "expression") {
						args[api.key] = { expr: this.compileExpression(call.left)[0], type: "expression" };
					}

					if (api.type === "string") {
						if (!call.left || !call.left.token) {
							throw new Error('Left node of phrase is note defined');
						}

						args[api.key] = { str: call.left.token.value, type: "string" };
					}
				} else {
					api = n;

					if (api.kind === 'query') {
						break;
					}
				}
			}
			call = call.right;
		}

		return { query: api, args: args };
	}

	private formatOutput(args: {
		[key: number]: {
			type: string,
			expr?: any,
			str?: string,
			int?: number,
		}
	}, result: string, output: APINode | undefined) {

		let out = "";


		while (output) {
			const node = output.left;

			if (!node) {
				throw new Error('Left node is undefined');
			}

			if(!node.kind) {
				throw new Error("the query is not valid!");
			}

			if (node.kind === APIKind.API_STRING_LITERAL) {
				if (!node.token) {
					throw new Error('Token is not defined for node!');
				}

				out += (out.length > 0 ? " \\space " : "") + "\\text{" + node.token.value + "}";
			}

			if (node.kind === APIKind.API_TEMPLATE) {

				const root = node.left;

				if (!root || !root.token) {
					throw new Error('Key is not defined for template');
				}


				if (root.kind === APIKind.API_NUMBER_LITERAL) {
					const key = Number(root.token.value);

					const arg = args[key];

					if (arg.type === "expression") {
						if (!arg.expr) {
							throw new Error('expr is undefined');
						}

						// const add_extra_space = output.right &&
						// 	output.right.left &&
						// 	output.right.left.token &&
						// 	output.right.left.token.value === "=";


						out += (out.length > 0 ? " \\space " : "") +
							gauss.toLatex(arg.expr);
					}

					if (arg.type === "integer") {
						if (!arg.expr) {
							throw new Error('int is undefined');
						}

						out += (out.length > 0 ? " " : "") + arg.int;
					}

					if (arg.type === "string") {
						if (!arg.str) {
							throw new Error('str is undefined');
						}

						out += (out.length > 0 ? " \\space " : "") + "\\text{" + arg.str + "}";
					}
				}

				if (root.kind === APIKind.API_OUTPUT) {
					out += (out.length > 0 ? " \\space " : "") + result;
				}
			}

			output = output.right;
		}

		return out;
	}

	private async executeHandler(key: number, { query, args }: { query: MagicAPINode, args: { [key: number]: { type: string, int?: number, str?: string, expr?: any } } }): Promise<JSX.Element> {
		return new Promise((resolve) => {
			if (!this.scope) {
				throw new Error("Interpreter not initialized!");
			}

			if(!query.kind) {
				throw new Error("the query is not valid!");
			}

			if (query.kind != "query") {
				throw new Error("query should be of 'query' kind!");
			}

			if (query.exec === "reduce") {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const expr = gauss.reduce(this.scope, args[0].expr);

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				resolve(parse(katex.renderToString(this.formatOutput(args, gauss.toLatex(expr), query.output))));
			}

			if (query.exec === "expand") {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const expr = gauss.expand(this.scope, args[0].expr);

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				resolve(parse(katex.renderToString(this.formatOutput(args, gauss.toLatex(expr), query.output))));
			}

			if (query.exec === "polyRoots") {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const expr = gauss.polynomialRoots(this.scope, args[0].expr);

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				resolve(parse(katex.renderToString(this.formatOutput(args, gauss.toLatex(expr), query.output))));
			}

			if (query.exec === "polyFactors") {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const expr = gauss.polynomialFactors(this.scope, args[0].expr);
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				resolve(parse(katex.renderToString(this.formatOutput(args, gauss.toLatex(expr), query.output))));
			}

			if (query.exec === "polyResultant") {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const expr = gauss.polynomialResultant(this.scope, args[0].expr, args[1].expr);

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				resolve(parse(katex.renderToString(this.formatOutput(args, gauss.toLatex(expr), query.output))));
			}

			if (query.exec === "polyDiv") {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const expr = gauss.polynomialDiv(this.scope, args[0].expr, args[1].expr);

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				resolve(parse(katex.renderToString(this.formatOutput(args, gauss.toLatex(expr), query.output))));
			}

			if (query.exec === "polyGDC") {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const expr = gauss.polynomialDiv(this.scope, args[0].expr, args[1].expr);

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				resolve(parse(katex.renderToString(this.formatOutput(args, gauss.toLatex(expr), query.output))));
			}

			if (query.exec === "polyLCM") {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const expr = gauss.polynomialDiv(this.scope, args[0].expr, args[1].expr);

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				resolve(parse(katex.renderToString(this.formatOutput(args, gauss.toLatex(expr), query.output))));
			}

			if (query.exec === "derivative") {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const expr = gauss.derivative(this.scope, args[0].expr, args[1].expr);

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				resolve(parse(katex.renderToString(this.formatOutput(args, gauss.toLatex(expr), query.output))));
			}


			if (query.exec === "plot") {
				resolve(
					<div>
						{parse(katex.renderToString(this.formatOutput(args, gauss.toLatex(args[0].expr), query.output)))}
						<FunctionPlot
							id={'function-plot-' + key}
							fn={gauss.toString(args[0].expr)}
						/>
					</div>
				)
				//console.log(gauss.toString(args[0].expr))
			}

			throw new Error("Execute not implemented for '" + query.exec + "'!");
		});
	}

	private getDocsBranch(api: MagicAPINode): {
		query: string,
		brief: string,
		example: string
	}[] {

		if (api.kind === "query") {
			return [{
				query: '',
				brief: api.brief,
				example: api.example,
			}]
		}

		if (api.kind === "word" || api.kind === "input") {
			let data: {
				query: string,
				brief: string,
				example: string
			}[] = [];

			for (const [key, val] of Object.entries(api.next)) {
				const rest = this.getDocsBranch(api.next[key]);

				let name = "";

				if (val.kind === "word") {
					name = key;
				}

				if (val.kind === "input") {
					name = "'" + val.type + "'"
				}

				for (const r of rest) {
					data = data.concat([{
						query: name + (r.query.length > 0 ? ' ' + r.query : ''),
						brief: r.brief,
						example: r.example
					}]);
				}
			}

			return data;
		}

		throw new Error("Unexpected api kind");
	}

	public getAPIDocs() {
		const querys = this.getDocsBranch(this.api.querys);

		let docs: JSX.Element[] = [];

		for (const query of querys) {
			docs = docs.concat([
				<div className='docs' key={docs.length}>
					<div>
						<div className='docs-title'>
							<div className='docs-query'><span className='docs-query-word'>Query:</span> {query.query}</div>
						</div>
						<div className='docs-description-title'>Description:</div>
						<div className='docs-brief'>{query.brief}</div>
						<div className='docs-example'>
							<div className='docs-example-title'>Example:</div>

							<div className='docs-example-content'>
								<div className='code-input-container'>

									<textarea className='code-input' onChange={(e) => { e.preventDefault() }} value={query.example} />
									<Link className='code-button' to={"/query?query=" + encodeURIComponent(query.example)+"&lang="+this.culture}>
										<img className='search-icon' src={search_icon} />
									</Link>
								</div>
								<div>{this.compileElement(query.example, 0)}</div>
							</div>
						</div>
					</div>
				</div>
			]);
		}


		return docs;
	}

	public compileElement(src: string, key: number): JSX.Element {
		try {
			let program = new ASTNode(ASTKind.AST_ERROR);

			try {
				program = this.parse(src);
			} catch (err) {
				return <div key={key}> {(err as Error).message} </div>
			}

			if (program.left == undefined) {
				return <div key={key}></div>
			}

			const node = program.left;

			const api = this.api;

			const call = this.handleAPICall(api.querys, node);

			return (
				<div key={key} className="code-output-cell">
					<div className='code-output-header'>
						<div className='code-output-title'>{src}:</div>
					</div>
					<div className='code-output-content'>
						<AsyncContent element={
							new Promise((resolve) => {
								this.executeHandler(key, call).then(
									(content) => {
										resolve(content)
									}
								)
							})
						} />
					</div>
				</div>
			);
		} catch (e) {
			const err = e as Error;
			return (
				<div key={key} className="code-output-cell">
					<div className='code-output-header'>
						<div className='code-output-title'>{src}:</div>
					</div>
					<div className='code-output-content'>
						<div>
							<span style={{ backgroundColor: 'red', padding: '5px', color: 'white' }}>Error:</span> {err.message}
						</div>
						<div style={{ marginTop: '20px' }}>
				Please, take a look at the docs/ tab for more information on how to form queries.
						</div>
					</div>
				</div>
			);
		}
	}

}
