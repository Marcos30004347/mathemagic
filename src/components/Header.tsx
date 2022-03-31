import React, { useState } from 'react';

import { LanguageSelection } from './CultureSelector'

import { Dropdown } from './Dropdown'

import '../styles/magic-header.css'

function Logo() {
	// <div className="magic-logo-text">Mathemagic</div>
	// <div className="magic-logo-text">MAGIC!</div>
	return (
		<header className="magic-logo">
			<div className="magic-logo-text">magicmath.xyz</div>
			<div className="magic-logo-beta">beta</div>
		</header>
	);
}

export const Header = ({ language, setLanguage }: {
	language: string,
	setLanguage: React.Dispatch<React.SetStateAction<string>>
}) => {
	return (
		<div className='magic-header'>
			<div className='menu'>
				<Logo />
			</div>
			<Dropdown lang={language} setLang={setLanguage} />
		</div>
	);
}
