
import { MagicLexer, Token, TokenKind } from "./lexer"

export enum ASTKind {
	AST_ERROR,
	AST_PHRASE,
	AST_STATEMENTS,
	AST_FUNC_ARG,
	AST_STRING,
	AST_NUMBER,
	AST_OP_ADD,
	AST_OP_SUB,
	AST_OP_MUL,
	AST_OP_DIV,
	AST_OP_EQUAL,
	AST_FUNC_CALL,
	AST_API_CALL,
}

export class ASTNode {
	kind: ASTKind;

	token?: Token;

	left?: ASTNode;

	right?: ASTNode;

	constructor(kind: ASTKind, value?: Token) {
		this.kind = kind;

		if (value != undefined) {
			this.token = value;
		} else {
			this.token = undefined;
		}

		this.left = undefined;
		this.right = undefined;
	}

	public setLeftOperator(node: ASTNode) {
		this.left = node;
	}

	public setRightOperator(node: ASTNode) {
		this.right = node;
	}

	public debugLogToConsole() {
		throw new Error("Debug to console not implemented for ast kind!");
	}
}

export function ParsingError(message: string, line: number, column: number) {
	throw new Error("Error: '" + message + "' at line '" + line + "' and column '" + column + "'!");
}

export class MagicParser {
	lex: MagicLexer;

	idiom: string;

	constructor(src: string, idiom: string) {
		this.idiom = idiom;

		this.lex = new MagicLexer(src, idiom);
	}


	parseIdentifier(): ASTNode {
		let curr = this.lex.curr;

		const name = new ASTNode(ASTKind.AST_STRING, curr);

		curr = this.lex.nextOf(TokenKind.IDENTIFIER);

		if (curr.kind == TokenKind.OPEN_PARENTHESIS) {
			curr = this.lex.nextOf(TokenKind.OPEN_PARENTHESIS);

			const args = new ASTNode(ASTKind.AST_FUNC_ARG);

			let carg = args;

			while (curr.kind != TokenKind.EOF && curr.kind != TokenKind.CLOSE_PARENTHESIS) {
				const arg = this.parseTerm();

				carg.setLeftOperator(arg);

				curr = this.lex.curr;

				if (curr.kind != TokenKind.CLOSE_PARENTHESIS) {
					curr = this.lex.nextOf(TokenKind.COMMA);

					if (curr.kind == TokenKind.CLOSE_PARENTHESIS) {
						ParsingError(
							"Function argument expected for funtion '" +
							name.token?.value +
							"', you likely added an extra " +
							"',' at the end of the arguments" +
							" or forget to add an argument",
							curr.line, curr.column);
					}

					const next = new ASTNode(ASTKind.AST_FUNC_ARG);

					carg.setRightOperator(next);

					carg = next;
				}
			}

			curr = this.lex.nextOf(TokenKind.CLOSE_PARENTHESIS);

			const node = new ASTNode(ASTKind.AST_FUNC_CALL);

			node.setLeftOperator(name);

			node.setRightOperator(args);

			return node;
		}


		if (curr.kind == TokenKind.IDENTIFIER) {
			const root = new ASTNode(ASTKind.AST_PHRASE);

			root.setLeftOperator(name);

			root.setRightOperator(this.parseIdentifier());

			return root;
		}

		return name;
	}

	parseLiteral(): ASTNode {
		const curr = this.lex.curr;

		if (curr.kind == TokenKind.IDENTIFIER) {
			const root = this.parseIdentifier();

			if(root.kind == ASTKind.AST_PHRASE) {
				const expr = this.parseTerm();

				const node = new ASTNode(ASTKind.AST_API_CALL);

				node.setLeftOperator(root);
				node.setRightOperator(expr);

				return node;
			}

			return root;
		}

		if (curr.kind == TokenKind.NUMBER_LITERAL) {

			this.lex.nextOf(TokenKind.NUMBER_LITERAL);

			return new ASTNode(ASTKind.AST_NUMBER, curr);
		}

		ParsingError("Unexpected literal '" + curr.value + "'", curr.line, curr.column);

		// never reached because above function throw an error,
		// this is here so typescript doesnt complain.
		return new ASTNode(ASTKind.AST_ERROR);
	}

	parsePrimary(): ASTNode {
		let curr = this.lex.curr;

		if (curr.kind == TokenKind.OPEN_PARENTHESIS) {
			curr = this.lex.nextOf(TokenKind.OPEN_PARENTHESIS);

			const node = this.parseExpression();

			curr = this.lex.nextOf(TokenKind.CLOSE_PARENTHESIS);

			return node;
		}

		return this.parseLiteral();
	}

	parseUnary(): ASTNode {
		const curr = this.lex.curr;

		if (curr.kind == TokenKind.MINUS) {
			this.lex.nextOf(TokenKind.MINUS);

			const c = new Token(TokenKind.NUMBER_LITERAL, curr.line, curr.column, "-1")

			const firs = new ASTNode(ASTKind.AST_NUMBER, c);

			const seco = this.parseUnary();

			const node = new ASTNode(ASTKind.AST_OP_MUL);

			node.setLeftOperator(firs);
			node.setRightOperator(seco);

			return node;
		}

		if (curr.kind == TokenKind.PLUS) {
			this.lex.nextOf(TokenKind.PLUS);
		}

		return this.parsePrimary();
	}

	parseFactor(): ASTNode {
		const root = this.parseUnary();

		const curr = this.lex.curr;

		if (curr.kind == TokenKind.DIV) {
			const node = new ASTNode(ASTKind.AST_OP_DIV, curr);

			const deno = this.parseFactor();

			node.setLeftOperator(root);
			node.setRightOperator(deno);

			return node;
		}

		if (curr.kind == TokenKind.MUL) {
			const node = new ASTNode(ASTKind.AST_OP_MUL, curr);

			const deno = this.parseFactor();

			node.setLeftOperator(root);
			node.setRightOperator(deno);

			return node;
		}

		return root;
	}

	parseTerm(): ASTNode {
		const root = this.parseFactor();

		const curr = this.lex.curr;

		if (curr.kind == TokenKind.PLUS) {
			const node = new ASTNode(ASTKind.AST_OP_ADD, curr);

			this.lex.nextOf(TokenKind.PLUS);

			const oper = this.parseTerm();

			node.setLeftOperator(root);
			node.setRightOperator(oper);

			return node;
		}


		if (curr.kind == TokenKind.MINUS) {
			const node = new ASTNode(ASTKind.AST_OP_SUB, curr);

			this.lex.nextOf(TokenKind.MINUS);

			const oper = this.parseTerm();

			node.setLeftOperator(root);
			node.setRightOperator(oper);

			return node;
		}

		return root;
	}

	parseAssignment(): ASTNode {
		const root = this.parseTerm();

		const curr = this.lex.curr;

		if (curr.kind == TokenKind.EQUAL) {
			const node = new ASTNode(ASTKind.AST_OP_EQUAL, curr);

			this.lex.nextOf(TokenKind.EQUAL);

			const oper = this.parseTerm();

			node.setLeftOperator(root);
			node.setRightOperator(oper);

			return node;
		}

		return root;
	}

	parseExpression(): ASTNode {
		return this.parseAssignment();
	}

	parseStatement(): ASTNode {
		return this.parseExpression();
	}

	parse() {
		this.lex.next();

		const root = new ASTNode(ASTKind.AST_STATEMENTS);

		let stmt = root;

		while (this.lex.curr.kind != TokenKind.EOF) {
			stmt.setLeftOperator(this.parseStatement());

			const next = new ASTNode(ASTKind.AST_STATEMENTS);

			stmt = next;
		}

		return root;
	}
}
