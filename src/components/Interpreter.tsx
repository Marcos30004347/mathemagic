import React, { useState, useEffect, useRef } from 'react'

import { MagicInterpreter } from '../lib/interpreter'

import '../styles/magic-code-input.css'


const CodeInput = (args: {
	idiom: string,
	childs: JSX.Element[],
	setChilds: React.Dispatch<React.SetStateAction<JSX.Element[]>>
}) => {
	const [comment, setComment] = useState('');

	const parser = useRef(new MagicInterpreter());

	useEffect(() => {
		parser.current.init(args.idiom);

		return () => {
			parser.current.stop();
		}
	}, [args.idiom])

	const handleTextArea = (e: React.ChangeEvent<HTMLInputElement>) => {
		setComment(e.target.value);
	};

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const element = await parser.current.compileElement(comment, args.childs.length);

		const childs = [element].concat(args.childs);

		args.setChilds(childs);
	}

	return (
		<form onSubmit={(e) => onSubmit(e)}>
			<input className='magic-code-input' type="text" value={comment} onChange={(e) => { handleTextArea(e) }} placeholder="ex: reduce 3*x + 5*x" />
		</form>
	)
}

export const Interpreter = (props: { idiom: string }) => {

	const [childs, setChilds] = useState([<div key={0}></div>]);

	return (
		<div className='magic-interpreter'>
			<CodeInput key={0} idiom={props.idiom} childs={childs} setChilds={setChilds} />
			{childs.reverse()}
		</div>
	)
}
