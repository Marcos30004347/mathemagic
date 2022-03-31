
import { APILexer, APIToken, APITokenKind } from "./lexer"

export enum APIKind {
	API_ERROR,
	API_PHRASE,
	API_ARG,
	API_TEMPLATE,
	API_OUTPUT,
	API_NUMBER_LITERAL,
	API_STRING_LITERAL,
	API_EXP_TYPE,
	API_INT_TYPE,
	API_STR_TYPE,
}

export class APINode {
	kind: APIKind;

	token?: APIToken;

	left?: APINode;

	right?: APINode;

	constructor(kind: APIKind, value?: APIToken) {
		this.kind = kind;

		if (value != undefined) {
			this.token = value;
		} else {
			this.token = undefined;
		}

		this.left = undefined;
		this.right = undefined;
	}

	public setLeftOperator(node: APINode) {
		this.left = node;
	}

	public setRightOperator(node: APINode) {
		this.right = node;
	}
}

export function ParsingError(message: string, line: number, column: number) {
	throw new Error("Parsing Error: '" + message + "' at line '" + line + "' and column '" + column + "'!");
}

export class APIParser {
	lex: APILexer;

	constructor() {
		this.lex = new APILexer('');
	}

	parseIdentifier(): APINode {
		let curr = this.lex.curr;

		const name = new APINode(APIKind.API_STRING_LITERAL, curr);

		curr = this.lex.nextOf(APITokenKind.IDENTIFIER);

		return name;
	}

	parseNumber(): APINode {
		const curr = this.lex.curr;

		this.lex.nextOf(APITokenKind.NUMBER_LITERAL);

		return new APINode(APIKind.API_NUMBER_LITERAL, curr);
	}

	parseLiteral(): APINode {
		const curr = this.lex.curr;

		if (curr.kind == APITokenKind.IDENTIFIER) {
			return this.parseIdentifier();
		}

		if (curr.kind == APITokenKind.NUMBER_LITERAL) {
			return this.parseNumber();
		}

		ParsingError("Unexpected literal '" + curr.value + "'", curr.line, curr.column);

		return new APINode(APIKind.API_ERROR);
	}

	parseType(): APINode {
		const curr = this.lex.curr;

		if(curr.value === "expression") {
			this.lex.nextOf(APITokenKind.IDENTIFIER);
			return new APINode(APIKind.API_EXP_TYPE, curr);
		}

		if(curr.value === "string") {
			this.lex.nextOf(APITokenKind.IDENTIFIER);
			return new APINode(APIKind.API_STR_TYPE, curr);
		}

		if(curr.value === "integer") {
			this.lex.nextOf(APITokenKind.IDENTIFIER);
			return new APINode(APIKind.API_INT_TYPE, curr);
		}

		throw new Error("Undefined type");
	}

	parseStringArgument(): APINode {
		if(this.lex.curr.value === "output") {
			const curr = this.lex.curr;

			this.lex.nextOf(APITokenKind.IDENTIFIER);

			return new APINode(APIKind.API_OUTPUT,curr);
		}

		throw new Error('invalid template string argument');
	}

	parseArgument(): APINode {
		if(this.lex.curr.kind === APITokenKind.IDENTIFIER) {
			const node = new APINode(APIKind.API_TEMPLATE);

			const key = this.parseStringArgument();

			node.setLeftOperator(key);

			return node;
		}

		const key = this.parseNumber();

		if(this.lex.curr.kind === APITokenKind.TWO_POINTS) {
			this.lex.nextOf(APITokenKind.TWO_POINTS);

			const typ = this.parseType();

			const node = new APINode(APIKind.API_ARG);

			node.setLeftOperator(key);
			node.setRightOperator(typ);

			return node;
		}

		const node = new APINode(APIKind.API_TEMPLATE);

		node.setLeftOperator(key);

		return node;
	}

	parsePrimary(): APINode {
		let curr = this.lex.curr;

		if (curr.kind == APITokenKind.OPEN_CURLY_BRAKETS) {
			curr = this.lex.nextOf(APITokenKind.OPEN_CURLY_BRAKETS);

			const node = this.parseArgument();

			curr = this.lex.nextOf(APITokenKind.CLOSE_CURLY_BRAKETS);

			return node;
		}

		return this.parseLiteral();
	}


	parsePhrase(): APINode {
		const root = this.parsePrimary();

		const node = new APINode(APIKind.API_PHRASE);

		node.setLeftOperator(root);

		const curr = this.lex.curr;

		if(curr.kind != APITokenKind.EOF) {
			node.setRightOperator(this.parsePhrase());
		}

		return node;
	}

	parseAPI(): APINode {
		return this.parsePhrase();
	}

	parse(src: string) {
		this.lex = new APILexer(src);
		this.lex.next();
		return this.parseAPI();
	}
}
