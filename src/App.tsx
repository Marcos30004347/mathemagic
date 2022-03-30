import React, { useState } from 'react';


import { Header } from './components/Header'

import { Interpreter } from './components/Interpreter'

import {SocialMedia} from './components/SocialMedia'

import 'katex/dist/katex.min.css';

import './styles/magic-page.css'

import { APIParser } from './lib/api/parser';

function App() {
	const [language, setLanguage] = useState(navigator.language);

	const parser = new APIParser("reduced form of {0:expression}");

	console.log(parser.parse());

	return (
		<div className='magic-app'>
			<Header language={language} setLanguage={setLanguage}/>
			<Interpreter idiom={language} />
			<SocialMedia/>
		</div>
	);
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import functionPlot from "function-plot";


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




/* <FunctionPlot
	id="func-0"
	fn="cos(x)"
	xAxis={{ domain: { start: -10, end: 10 } }}
	yAxis={{ domain: { start: -10, end: 10 } }}
/>
*/
export default App;
