import React, { useEffect, useState } from 'react';

import { MagicInterpreter } from './parser/interpreter';


// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import functionPlot from "function-plot";

import './styles/magic-header.css'
import './styles/magic-page.css'
import './styles/magic-lang-selection.css'

import br_flag from './svg/flags/br.svg'
import us_flag from './svg/flags/us.svg'

function Logo() {
	return (
		<header className="magic-logo">
			<div className="magic-logo-text1">MATHEMAGIC</div>
		</header>
	);
}

// function FunctionPlot(args: {
// 	fn: string,
// 	id: string,
// 	xAxis: { domain: { start: number, end: number } },
// 	yAxis: { domain: { start: number, end: number } },
// }) {

// 	useEffect(() => {
// 		functionPlot({
// 			target: "#" + args.id,
// 			grid: true,
// 			xAxis: { domain: [args.xAxis.domain.start, args.xAxis.domain.end] },
// 			yAxis: { domain: [args.yAxis.domain.start, args.yAxis.domain.end] },
// 			data: [
// 				{
// 					fn: args.fn,
// 					color: "#fc0388"
// 				},
// 			]
// 		});
// 	});

// 	return <div className="graphic" id={args.id}></div>;
// }

function LanguageSelection(props: { language: string, setLanguage: React.Dispatch<React.SetStateAction<string>> }) {
	return (<div>
		<button
			className={"magic-lang-button" + (props.language === "pt-BR" ? " magic-lang-selected" : "")}
			onClick={() => props.setLanguage('pt-BR')}
		>
			<img src={br_flag} className="magic-lang-image" alt="br-flag" />
		</button>
		<button
			className={"magic-lang-button" + (props.language === "en-US" ? " magic-lang-selected" : "")}
			onClick={() => props.setLanguage('en-US')}
		>
			<img src={us_flag} className="magic-lang-image" alt="us-flag" />
		</button>
		<span className="fi fi-gr"></span> <span className="fi fi-gr fis"></span>

	</div>)

}

const CodeInput = (args: { idiom: string }) => {
	const [comment, setComment] = useState('');

	const handleTextArea = (e: React.ChangeEvent<HTMLInputElement>) => {
		setComment(e.target.value);
	};


	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const parser = new MagicInterpreter(args.idiom);

		console.log(parser.compileElement(comment));
	}

	return (
		<form onSubmit={(e) => onSubmit(e)}>
			<input value={comment} onChange={(e) => { handleTextArea(e) }} />
		</form>
	)
}

function App() {
	const [language, setLanguage] = useState(navigator.language);

	const [childs, setChilds] = useState([]);


	return (
		<div className="magic-app">
			<div className="magic-header">
				<Logo />
			</div>
			<LanguageSelection language={language} setLanguage={setLanguage} />
			{
				childs
			}
			<CodeInput idiom={language}/>

		</div>
	);
}

/* <FunctionPlot
	id="func-0"
	fn="cos(x)"
	xAxis={{ domain: { start: -10, end: 10 } }}
	yAxis={{ domain: { start: -10, end: 10 } }}
/>
*/
export default App;
