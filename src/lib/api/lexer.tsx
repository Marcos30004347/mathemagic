import { isAlphaNumeric, isNumericCharacter } from '../utils/string'

export enum APITokenKind {
	EOF,
	IDENTIFIER,
	NUMBER_LITERAL,
	OPEN_CURLY_BRAKETS,
	CLOSE_CURLY_BRAKETS,
	TWO_POINTS,
}

export class APIToken {
	kind: APITokenKind;

	line: number;

	column: number;

	value: string;

	constructor(kind: APITokenKind, line: number, column: number, value: string) {
		this.kind = kind;
		this.line = line;
		this.column = column;
		this.value = value;
	}
}



export class APILexer {
	head: number;
	line: number;
	col: number;
	src: string;

	curr: APIToken;

	prev: APIToken;

	constructor(src: string) {
		this.head = 0;
		this.line = 0;
		this.col = 0;
		this.src = src;
		this.curr = new APIToken(APITokenKind.EOF, -1, -1, "\0");
		this.prev = new APIToken(APITokenKind.EOF, -1, -1, "\0");
	}

	public eat(): APIToken {
		while (this.head < this.src.length && this.src.charCodeAt(this.head) === ' '.charCodeAt(0)) {
			this.head = this.head + 1;
			this.col += 1;
		}

		if (this.head === this.src.length) {
			return new APIToken(APITokenKind.EOF, this.line, this.col, 'EOF');
		}

		while (this.src.charCodeAt(this.head) === '\n'.charCodeAt(0)) {
			this.col = 0;
			this.line = this.line + 1;
			this.head += 1;
		}

		let v = "";

		if (isNumericCharacter(this.src.charCodeAt(this.head))) {

			while (this.head < this.src.length && isNumericCharacter(this.src.charCodeAt(this.head))) {
				v = v + this.src[this.head];

				this.head = this.head + 1;
			}

			if (this.src.charCodeAt(this.head) === '.'.charCodeAt(0)) {
				v = v + ".";
				this.head = this.head + 1;
			}

			while (this.head < this.src.length && isNumericCharacter(this.src.charCodeAt(this.head))) {
				v = v + this.src[this.head];
				this.head = this.head + 1;
			}

			if (this.src.charCodeAt(this.head) === '.'.charCodeAt(0)) {
				throw new Error("Invalid number of points '.' on numeric value at line " + this.line + " and column " + this.col + "!");
			}

			if(isAlphaNumeric(this.src, this.head)) {
				throw new Error("Invalid numeric literal");
			}

			return new APIToken(APITokenKind.NUMBER_LITERAL, this.line, this.col, v);
		}


		if (this.src[this.head] === "{") {
			this.head = this.head + 1;
			this.col += 1;
			return new APIToken(APITokenKind.OPEN_CURLY_BRAKETS, this.line, this.col, "{");
		}

		if (this.src[this.head] === "}") {
			this.head = this.head + 1;
			this.col += 1;
			return new APIToken(APITokenKind.CLOSE_CURLY_BRAKETS, this.line, this.col, "}");
		}

		if (this.src[this.head] === ":") {
			this.head = this.head + 1;
			this.col += 1;
			return new APIToken(APITokenKind.TWO_POINTS, this.line, this.col, ":");
		}

		while (
			this.head < this.src.length &&
			isAlphaNumeric(this.src,this.head)
		) {
			v = v + this.src[this.head];

			this.col += 1;
			this.head = this.head + 1;
		}

		return new APIToken(APITokenKind.IDENTIFIER, this.line, this.col, v);
	}

	public next(): APIToken {
		this.prev = this.curr;
		this.curr = this.eat();
		return this.curr;
	}

	public nextOf(k: APITokenKind): APIToken {
		if (this.curr.kind != k) {
			throw new Error("Expecting token of kind '" + k + "' at line '" + this.curr.line + "' and column '" + this.curr.column + "'!");
		}

		return this.next();
	}
}
