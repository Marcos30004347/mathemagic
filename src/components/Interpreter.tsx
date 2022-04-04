/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react'

import { MagicInterpreter } from '../lib/interpreter'

import { Spinner } from './Spinner'

import '../styles/interpreter.scss'

import search_icon from '../static/search_black_24dp.svg'

import { Dropdown } from './Dropdown'


const CodeInput = (args: {
	idiom: string,
	setLanguage: React.Dispatch<React.SetStateAction<string>>
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

	const handleTextArea = (e: any) => {
		if(e.nativeEvent.inputType == 'insertLineBreak') {
			onSubmit();

			return;
		}

		e.target.style.height = e.target.scrollHeight + 'px';

		setComment(e.target.value);
	};

	const onSubmit = () => {
		const element = parser.current.compileElement(comment, childs.length);

		const c = [element].concat(childs);

		setChilds(c);
	}

	const renderContent = (tab: string) => {
		if (tab === "query") {
			return (
				<div className='code-input-container'>
					<div>
						<textarea className='code-input' value={comment} onChange={(e) => { handleTextArea(e) }} placeholder="make a request, something like 'factors of x^2*y^2 - 9', for more examples click on 'docs'!" />
						<button className='code-button' onClick={() => onSubmit()}>
							<img className='search-icon' src={search_icon} />
						</button>
					</div>
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
			{
				isLoading ? <div style={{position: 'fixed', top: '50%', left: '50%'}}><Spinner /></div> : <div>
					<div className='code-input-menu'>
						<ul className='code-input-tabs'>
							<button className={'code-input-button' + (tab === 'query' ? ' selected' : '')} onClick={() => setTab('query')}>query</button>
							<button className={'code-input-button' + (tab === 'docs' ? ' selected' : '')} onClick={() => setTab('docs')}>docs</button>


						</ul>
						<Dropdown lang={args.idiom} setLang={args.setLanguage} />
					</div>
					{
						renderContent(tab)
					}
				</div>
			}

		</div>
	)
}

export const Interpreter = ({ language, setLanguage }: {
	language: string,
	setLanguage: React.Dispatch<React.SetStateAction<string>>
}) => {

	return (
		<div className='interpreter'>
			<CodeInput key={0} idiom={language} setLanguage={setLanguage}/>
		</div>
	)
}
