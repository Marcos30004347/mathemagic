/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'

import { MagicParser, ASTNode, ASTKind } from './parser'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import gauss from './gauss/gauss'

import katex from 'katex'

import parse from 'html-react-parser'

import '../styles/magic-code-input.css'
import { APIKind, APINode, APIParser } from './api/parser'


// type MagicAPIDescWord = {
// 	key: string
// 	kind: "word"
// 	args: number
// 	exec?: Execute
// 	next?: MagicAPIDescNode[]
// }

// type MagicAPIDescArg = {
// 	kind: "arg"
// 	key: number
// 	type: "expr" | "number" | "string"
// 	size: number
// 	exec?: Execute
// 	next?: MagicAPIDescNode[],
// };

// type MagicAPIDescNode = MagicAPIDescWord | MagicAPIDescArg;

// type MagicAPIDesc = {
// 	api: MagicAPIDescNode[]
// };

type APIQueryDesc = {
	func: string,
	exec: string,
};

type APIDesc = {
	querys: APIQueryDesc[]
}

type MagicAPIWord = {
	kind: "word"
	exec?: string
	next: { [key: string]: MagicAPINode },
};

type MagicAPIArgument = {
	key: number
	kind: "input"
	type: string
	exec?: string
	next: { [key: string]: MagicAPINode },
};

type MagicAPINode = MagicAPIArgument | MagicAPIWord


type CallArguments = {
	kind: MagicAPINode
	data: ASTNode
}

type Tuple<T, K> = {
	frst: T
	scnd: K
}

function InterpreterError(msg: string) {
	throw new Error(msg);
}

export class MagicInterpreter {
	culture: string;
	api: MagicAPINode;
	scope: gauss.Scope | null;

	constructor() {
		this.culture = "en-US";
		this.api = { kind: 'word', next: {} };
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

		const dsc : APIDesc = api;
		console.log(dsc);
		this.registerAPI(dsc);
	}

	public async init(culture: string) {
		await this.fetchAPI(culture);
		await gauss.init();

		this.scope = gauss.scopeCreate();
	}

	public stop() {
		if(!this.scope) {
			throw new Error("Interpreter wasnt initialized!");
		}

		gauss.scopeDestroy(this.scope)
	}

	private registerAPI(dsc: APIDesc) {
		for(const func of dsc.querys) {
			const parser = new APIParser(func.func);

			let node : APINode | undefined = parser.parse();

			console.log(node);

			let api = this.api;

			while(node) {
				if(!node.left) {
					throw new Error('Expecting left argument');
				}

				const curr = node.left;

				console.log(curr);

				if(curr.kind === APIKind.API_STRING_LITERAL) {
					if(!curr.token) {
						throw new Error('api string does not have a token');
					}

					api.next[curr.token.value] = {
						kind: "word",
						next: {},
					};

					api = api.next[curr.token.value];
				}

				if(curr.kind === APIKind.API_ARG) {
					if(!curr.left) {
						throw new Error('APINode left operand is undefined');
					}

					if(!curr.right) {
						throw new Error('APINode left operand is undefined');
					}

					const key = curr.left;

					if(key.kind != APIKind.API_NUMBER_LITERAL) {
						throw new Error('argument key should be a number');
					}

					if(!key.token) {
						throw new Error('argument key token is undefined');
					}

					const typ = curr.right;

					if(!typ.token) {
						throw new Error('argument type token is undefined');
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

			api.exec = func.exec;
		}


		console.log("this.api")
		console.log(this.api)
	}

	private parse(src: string): ASTNode {
		const parser = new MagicParser(src, this.culture);

		return parser.parse();
	}

	private compileAlgExpression(tree: ASTNode): any {
		if (this.scope === null) {
			return InterpreterError('scope not initialized');
		}
		if (tree.kind == ASTKind.AST_NUMBER) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return gauss.numberFromDouble(this.scope, Number(tree.token?.value));
		}

		if (tree.kind == ASTKind.AST_STRING) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return gauss.symbol(this.scope, tree.token?.value);
		}

		if (tree.kind == ASTKind.AST_OP_ADD) {
			if (tree.left == null) {
				return InterpreterError('left operand is not defined');
			}

			if (tree.right == null) {
				return InterpreterError('right operand is not defined');
			}

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return gauss.add(this.scope, this.compileAlgExpression(tree.left), this.compileAlgExpression(tree.right));
		}


		if (tree.kind == ASTKind.AST_OP_SUB) {
			if (tree.left == null) {
				return InterpreterError('left operand is not defined');
			}

			if (tree.right == null) {
				return InterpreterError('right operand is not defined');
			}

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return gauss.sub(this.scope, this.compileAlgExpression(tree.left), this.compileAlgExpression(tree.right));
		}

		if (tree.kind == ASTKind.AST_OP_MUL) {
			if (tree.left == null) {
				return InterpreterError('left operand is not defined');
			}

			if (tree.right == null) {
				return InterpreterError('right operand is not defined');
			}

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return gauss.mul(this.scope, this.compileAlgExpression(tree.left), this.compileAlgExpression(tree.right));
		}

		if (tree.kind == ASTKind.AST_OP_POW) {
			if (tree.left == null) {
				return InterpreterError('left operand is not defined');
			}

			if (tree.right == null) {
				return InterpreterError('right operand is not defined');
			}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return gauss.pow(this.scope, this.compileAlgExpression(tree.left), this.compileAlgExpression(tree.right));
		}


		if (tree.kind == ASTKind.AST_OP_DIV) {
			if (tree.left == null) {
				return InterpreterError('left operand is not defined');
			}

			if (tree.right == null) {
				return InterpreterError('right operand is not defined');
			}

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return gauss.div(this.scope, this.compileAlgExpression(tree.left), this.compileAlgExpression(tree.right));
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
		console.log(tree);
		if (tree.kind == ASTKind.AST_COMPOUND_LIST) {
			return this.compileCompListExpression(tree);
		}

		return [this.compileAlgExpression(tree)];
	}

	private handleAPICallRec(data: CallArguments[], api: MagicAPINode, call?: ASTNode): Tuple<CallArguments[], string> {
		if (!call) {
			throw new Error('call tree not defined');
		}
		if (call.kind === ASTKind.AST_PHRASE) {
			if (!call.left) {
				throw new Error('left operator of phrase is undefined');
			}
			const node = call.left;
			//if (api.tag === "word") {
			if (!api.next) {
				throw new Error('api.next is not defined');
			}

			if (api.next["input"]) {
				if (!api.next['input']) {
					throw new Error('input key is undefined');
				}

				const kind = api.next['input'];

				data = data.concat([{
					kind: kind,
					data: node
				}]);

				return this.handleAPICallRec(data, kind, call.right);
			}

			if (!call.left.token) {
				throw new Error('token is undefined');
			}

			const name = call.left.token.value;
			console.log(api);
			if (!api.next[name]) {
				throw new Error('api is not defined ????');
			}

			api = api.next[name];

			return this.handleAPICallRec(data, api, call.right);
		}

		if (!api.next) {
			throw new Error('api.next is undefined');
		}

		if (!api.next['input']) {
			throw new Error('expecting argument');
		}


		if (!api.next['input'].exec) {
			throw new Error('exec undefined');
		}

		data = data.concat([{
			kind: api.next['input'],
			data: call
		}]);

		return { frst: data, scnd: api.next['input'].exec };
		//console.log(call)
		//throw new Error('handle api not defined');
	}

	private handleAPICall(api: MagicAPINode, call?: ASTNode): Tuple<CallArguments[], string> {
		const data: CallArguments[] = [];
		return this.handleAPICallRec(data, api, call);
	}

	private executeHandler(exec: string, call: CallArguments[]) : string {
		if(!this.scope) {
			throw new Error("Interpreter not initialized!");
		}

		if(exec === "reduce") {
			if(call.length > 1) {
				throw new Error("reduce method expects only one argument expression");
			}

			const args = this.compileExpression(call[0].data);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const expr = gauss.reduce(this.scope, args[0]);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			console.log(gauss.toString(expr));

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return gauss.toLatex(expr);
		}

		throw new Error("Execute not implemented for '" + exec + "'!");
	}

	public async compileElement(src: string, key: number): Promise<JSX.Element> {
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

		const call = this.handleAPICall(api, node);

		return (
			<div key={key} className="magic-interpreter-cell">
				{
					parse(katex.renderToString(this.executeHandler(call.scnd, call.frst)))
				}
			</div>
		);
	}

}
