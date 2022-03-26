import React from 'react'
import { MagicParser, ASTNode, ASTKind } from './parser'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { gaussInit } from 'gauss-js'

function InterpreterError(msg:string) {
	throw new Error("Interpreter error: '" + msg + "'!");
}

export class MagicInterpreter {
	culture : string;

	constructor(culture: string) {
		this.culture = culture;
	}


	private parse(src: string) : ASTNode {
		const parser = new MagicParser(src, this.culture);

		return parser.parse();
	}

	// private compileExprToGauss(expr: ASTNode) {
	// 	if(expr.kind == ASTKind.AST_NUMBER) {
	// 	}
	// 	return null;
	// }

	public async compileElement(src:string): Promise<JSX.Element> {
		const program = this.parse(src);

		if(program.left == undefined) {
			return <div></div>
		}

		console.log(gaussInit);

		const t = gaussInit();

		console.log(t);

		const node = program.left;

		if(node.kind != ASTKind.AST_API_CALL) {
			return <div>Error: Expecting a function call</div>
		}

		return <div>Compiled</div>
	}

}
