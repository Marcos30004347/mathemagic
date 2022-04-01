import React, { useState } from 'react';


import { Header } from './components/Header'

import { Interpreter } from './components/Interpreter'

import {SocialMedia} from './components/SocialMedia'

import 'katex/dist/katex.min.css';

import './styles/magic-page.css'

function App() {
	const [language, setLanguage] = useState(navigator.language);

	return (
		<div className='magic-app'>
			<Header language={language} setLanguage={setLanguage}/>
			<Interpreter language={language} setLanguage={setLanguage}/>
			<SocialMedia/>
			<div style={{
				position: 'fixed',
				bottom: '0px',
				color: 'white',
				fontSize: '0.5em',
				backgroundColor: '#F77F00',
				padding: '20px'
			}}>This is an Open Source project and it still on development, currently by only one programmer on its free time. If you like the project, consider give it a star on github, and if you have any programming skills, consider contributing to the project.</div>
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
