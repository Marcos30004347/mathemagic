/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Link, Route, Routes, useNavigate, useLocation } from "react-router-dom";

import { MagicInterpreter } from '../lib/interpreter'

import { Spinner } from './Spinner'

import '../styles/interpreter.scss'

import search_icon from '../static/search_black_24dp.svg'

import { Dropdown } from './Dropdown'


function getQueryFromSearch(search: string) {
	const query = search.substring(1);
	const vars = query.split('&');

	for (let i = 0; i < vars.length; i++) {
		const pair = vars[i].split('=');

		if (decodeURIComponent(pair[0]) == 'query') {
			return decodeURIComponent(pair[1]);
		}
	}

	return '';
}

export const Interpreter = (args: {
	language: string,
	setLanguage: React.Dispatch<React.SetStateAction<string>>
}) => {

	const [childs, setChilds] = useState([<div key={0}></div>]);

	const [comment, setComment] = useState('');

	const [isLoading, setLoading] = useState(true);

	const navigate = useNavigate();
	const location = useLocation();


	const parser = useRef(new MagicInterpreter());

	const compileAndAppend = (query: string) => {
		const element = parser.current.compileElement(query, childs.length);

		const c = [element].concat(childs);

		setChilds(c);
	}

	const submit = () => {
		compileAndAppend(comment);
	}

	useEffect(() => {
		setLoading(true);

		if(location.pathname == "/") {
			navigate("query");
		}
		const init = async () => {
			await parser.current.init(args.language);

			setLoading(false);

			if(location.search.length > 0) {
				const query = getQueryFromSearch(location.search);

				setComment(query);
				compileAndAppend(query);
			}
		}

		init();

		return () => {
			parser.current.stop();
		}
	}, [args.language, location.search])

	const handleTextArea = (e: any) => {
		if(e.nativeEvent.inputType == 'insertLineBreak') {
			submit();
			return;
		}

		e.target.style.height = e.target.scrollHeight + 'px';

		setComment(e.target.value);
	};

	const renderQuery = () => {
		return (
			<div className='code-input-container'>
				<div>
					<textarea className='code-input' value={comment} onChange={(e) => { handleTextArea(e) }} placeholder="ask something, like 'factors of x^2*y^2 - 9', take a look at 'docs/' for more..." />
					<button className='code-button' onClick={() => submit()}>
						<img className='search-icon' src={search_icon} />
					</button>
				</div>
				{childs}
			</div>
		)

	}

	const renderDocs = () => {
		return parser.current.getAPIDocs();
	}

	const renderAbout = () => {
		return <div className='about'>
			<div className="about-title">What is mathemagic?</div>
			{"mathemagic is a open source web application designed to be a simple math application for young students."}
			<div className="about-title">What about that language selection on the menu?</div>
			{"The app let you select the language that you want to use to make the math queries, this can be usefull for teenager students from contries that dont speak english nativelly or at least dont have enough experience and knowledge with the language. To see how another languages can be used inside the app, if you go to docs/ and switch to another language, you will se the documentation page changing accordingly, the translated queries displayed are native queries that can be made inside the app. Because this app is early in development, the app have a very limited number of options and some languages have more queries than others, this should not be the case on a near future given how easy it is to add new queries and languages support."}
			<div className="about-title">What about the future of the mathemagic?</div>
			{"The app is really early in development so there will be a lot of new features on an near feature."}
			<ul>
				<li>{"The backbone ot this application is a library written in C++ called gauss, you can see the source conde on the"} <a href="https://github.com/Marcos30004347/gauss">github</a> {"repository. The gauss library have a JavaScript port throught WebAssembly that is used internally on mathemagic to speed up symbolic math computation. The fact is that there still a lot of features from that library that is not yet present on mathemagic, adding those functionalities is one of the first things that should be done in the future."}</li>
				<li>{"The support for another languages is still very limited, for instance, currently it is not possible to use unicode character or accented characters, that is a very upsetting limitation for the original author of the app given that he is a native portuguese speaker and portuguese have a lot of accented characters on its words. One of the next tasks that should be done is solving fixing this limitation."}</li>
				<li>{"When the app gets a little more features, new languages should be added, and not just in the form of new queries like it happens now, it is not very difficult to make all words displayed inside the app translated whitout external applications like google translator. This will receive more attention in the future!"}</li>
			</ul>
		</div>
	}

	return (
		<div className="interpreter">
			{
				isLoading ? <div style={{position: 'fixed', top: '50%', left: '50%'}}><Spinner /></div> : <div>
					<div style={{display: 'flex', justifyContent: 'space-between'}}>
						<nav className='code-input-menu'>
							<ul className='code-input-tabs' id="navigation">
								<Link className={'code-input-button' + (location.pathname === '/query' ? ' selected' : '')} to="/query">query/</Link>
								<Link className={'code-input-button' + (location.pathname === '/docs' ? ' selected' : '')} to="/docs">docs/</Link>
								<Link className={'code-input-button' + (location.pathname === '/about' ? ' selected' : '')} to="/about">about/</Link>
							</ul>
						</nav>
						<div style={{marginRight: '50px'}}>
							<Dropdown lang={args.language} setLang={args.setLanguage} />
						</div>
					</div>
					<Routes>
						<Route path="query" element={renderQuery()} />
						<Route path="docs" element={renderDocs()} />
						<Route path="about" element={renderAbout()} />
					</Routes>
				</div>
			}
		</div>
	)
}
