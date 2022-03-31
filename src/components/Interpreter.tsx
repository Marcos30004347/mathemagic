import React, { useState, useEffect, useRef } from 'react'

import { MagicInterpreter } from '../lib/interpreter'

import { Spinner } from './Spinner'

import '../styles/interpreter.scss'


const CodeInput = (args: {
	idiom: string,
}) => {

	const [tab, setTab] = useState('query');

	const [childs, setChilds] = useState([<div key={0}></div>]);

	const [comment, setComment] = useState('');

	const [isLoading, setLoading] = useState(true);

	const parser = useRef(new MagicInterpreter());

	useEffect(() => {
		setLoading(true);

		const init = async () => {
			await parser.current.init(args.idiom);

			setLoading(false);
		}

		init();

		return () => {
			parser.current.stop();
		}
	}, [args.idiom])

	const handleTextArea = (e: React.ChangeEvent<HTMLInputElement>) => {
		setComment(e.target.value);
	};

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const element = parser.current.compileElement(comment, childs.length);

		const c = [element].concat(childs);

		setChilds(c);
	}

	const renderContent = (tab: string) => {
		if (tab === "query") {
			return (
				<div>
					<form className='code-input-container' onSubmit={(e) => onSubmit(e)}>
						<div>
							<input className='code-input' type="text" value={comment} onChange={(e) => { handleTextArea(e) }} placeholder="query" />
							<input type="submit" className='code-button' value="Submit" />
						</div>
					</form>
					{childs}
				</div>
			)
		}

		if (tab === "docs") {
			return parser.current.getAPIDocs();
		}
	}

	return (
		<div>
			<ul className='code-input-menu'>
				<button className={'code-input-button' + (tab === 'query' ? ' selected' : '')} onClick={() => setTab('query')}>query</button>
				<button className={'code-input-button' + (tab === 'docs' ? ' selected' : '')} onClick={() => setTab('docs')}>docs</button>
			</ul>

			{
				isLoading ? <Spinner /> : renderContent(tab)
			}

		</div>
	)
}

export const Interpreter = (props: { idiom: string }) => {

	return (
		<div className='magic-interpreter'>
			<CodeInput key={0} idiom={props.idiom} />
		</div>
	)
}
