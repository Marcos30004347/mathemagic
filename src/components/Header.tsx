import React from 'react';

import '../styles/magic-header.css'

function Logo() {
	return (
		<header className="magic-logo">
			<div className="magic-logo-text0">MATHE</div>
			<div className="magic-logo-text1">MAGIC</div>
		</header>
	);
}

export const Header = () => {
	return (
		<div className='magic-header'>
			<div className='menu'>
				<Logo />
			</div>
		</div>
	);
}
