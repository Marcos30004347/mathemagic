
import React, { useState } from 'react';

import '../styles/magic-lang-selection.css'

function CultureName(id: string) {
	if (id === 'pt-BR') return "Brasil";
	if (id === 'en-US') return "United States";
}

function fetchFlag(id: string) {
	if (id === "pt-BR") {
		return "br";
	}

	if (id === "en-US") {
		return "us";
	}

	return 'br';
}

export const LanguageSelection = (props: {
	language: string,
	setLanguage: React
	.Dispatch<React.SetStateAction<string>>
}) => {
	const [flag, setFlag] = useState('');

	// useEffect(() => {
	// 	async function getFlag() {
	// 		const flag = await fetchFlag(props.language)
	// 		setFlag(flag);
	// 		console.log(flag)
	// 	}

	// 	getFlag();
	// }, []);

	// console.log(br_flag)

	return (
		<div className='magic-culture-selector '>
			<button className={"magic-lang-button"}>
				<div>{CultureName(props.language)}</div>
				<img src={'./svg/flags/' + fetchFlag(props.language) + '.svg'} className="magic-lang-image" alt="br-flag" />
			</button>
		</div>
	)
}
