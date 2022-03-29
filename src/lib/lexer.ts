

export enum TokenKind {
	EOF,
	IDENTIFIER,
	POINT,
	NUMBER_LITERAL,
	OPEN_PARENTHESIS,
	CLOSE_PARENTHESIS,
	PLUS,
	MINUS,
	MUL,
	POW,
	DIV,
	EQUAL,
	COMMA,
	LET,
}

export class Token {
	kind: TokenKind;

	line: number;
	column: number;
	value: string;

	constructor(kind: TokenKind, line: number, column: number, value: string) {
		this.kind = kind;
		this.line = line;
		this.column = column;
		this.value = value;
	}
}


function isNumericCharacter(code: number) {
	if ((code > 47 && code < 58)) {
		return true;
	}

	return false;
}

function isAlphaNumeric(str: string, i: number) {
	const code = str.charCodeAt(i);

	if (!(code > 47 && code < 58) && // numeric (0-9)
		!(code > 64 && code < 91) && // upper alpha (A-Z)
		!(code > 96 && code < 123)) { // lower alpha (a-z)
		return false;
	}

	return true;
}

export class MagicLexer {
	head: number;
	line: number;
	col: number;
	src: string;
	spaced: boolean;
	idiom: string;

	curr: Token;
	prev: Token;

	constructor(src: string, idiom: string) {
		this.head = 0;
		this.line = 0;
		this.col = 0;
		this.src = src;
		this.idiom = idiom;
		this.spaced = false;
		this.curr = new Token(TokenKind.EOF, -1, -1, "EOF");
		this.prev = new Token(TokenKind.EOF, -1, -1, "EOF");
	}

	public eat(): Token {
		// ignore white spaces.
		this.spaced = false;

		while (this.head < this.src.length && this.src.charCodeAt(this.head) === ' '.charCodeAt(0)) {
			this.head = this.head + 1;
			this.col += 1;
			this.spaced = true;
		}

		// verify if we are at EOF.
		if (this.head === this.src.length) {
			return new Token(TokenKind.EOF, this.line, this.col, '\0');
		}

		// update lines and columns.
		while (this.src.charCodeAt(this.head) === '\n'.charCodeAt(0)) {
			this.col = 0;
			this.line = this.line + 1;
			this.head += 1;
		}

		// Token value.
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

			return new Token(TokenKind.NUMBER_LITERAL, this.line, this.col, v);
		}


		if (this.src[this.head] === "=") {
			this.head = this.head + 1;
			this.col += 1;
			return new Token(TokenKind.EQUAL, this.line, this.col, "=");
		}

		if (this.src[this.head] === "^") {
			this.head = this.head + 1;
			this.col += 1;
			return new Token(TokenKind.POW, this.line, this.col, "^");
		}

		if (this.src[this.head] === "+") {
			this.head = this.head + 1;
			this.col += 1;
			return new Token(TokenKind.PLUS, this.line, this.col, "+");
		}

		if (this.src[this.head] === "-") {
			this.head = this.head + 1;
			this.col += 1;
			return new Token(TokenKind.MINUS, this.line, this.col, "-");
		}

		if (this.src[this.head] === "*") {
			this.head = this.head + 1;
			this.col += 1;
			return new Token(TokenKind.MUL, this.line, this.col, "*");
		}

		if (this.src[this.head] === "/") {
			this.head = this.head + 1;
			this.col += 1;
			return new Token(TokenKind.DIV, this.line, this.col, "/");
		}

		if (this.src[this.head] === "(") {
			this.head = this.head + 1;
			this.col += 1;
			return new Token(TokenKind.OPEN_PARENTHESIS, this.line, this.col, "(");
		}

		if (this.src[this.head] === ")") {
			this.head = this.head + 1;
			this.col += 1;
			return new Token(TokenKind.CLOSE_PARENTHESIS, this.line, this.col, ")");
		}

		if (this.src[this.head] === ".") {
			this.head = this.head + 1;
			this.col += 1;
			return new Token(TokenKind.POINT, this.line, this.col, ".");
		}

		if (this.src[this.head] === ",") {
			this.head = this.head + 1;
			this.col += 1;
			return new Token(TokenKind.COMMA, this.line, this.col, ",");
		}

		while (this.head < this.src.length && isAlphaNumeric(this.src, this.head)) {
			v = v + this.src[this.head];
			this.col += 1;
			this.head = this.head + 1;
		}

		return new Token(TokenKind.IDENTIFIER, this.line, this.col, v);
	}

	public next(): Token {
		this.prev = this.curr;
		this.curr = this.eat();
		return this.curr;
	}

	public nextOf(k: TokenKind): Token {
		if (this.curr.kind != k) {
			throw new Error("Expecting token of kind '" + k + "' at line '" + this.curr.line + "' and column '" + this.curr.column + "'!");
		}

		return this.next();
	}
}
