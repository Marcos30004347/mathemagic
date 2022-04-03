import React from 'react'

import {getLangId} from '../lib/utils/idioms'

import '../styles/dropdown.scss'

export const Submenu = ({ opts, setLang }: {
	opts: string[],
	lang: string,
	setLang: React.Dispatch<React.SetStateAction<string>>
}) => {
	return (
		<ul className="nav__submenu">
			{
				opts.map((l) => (
					<li key={l} className="nav__submenu-item" onClick={() => { setLang(l) }}>
						<a>{getLangId(l)}</a>
					</li>

				))
			}
		</ul>
	)
}

export const Dropdown = ({ lang, setLang }: {
	lang: string,
	setLang: React.Dispatch<React.SetStateAction<string>>
}) => {
	return (
		<nav className="nav">
			<ul className="nav__menu">
				<li
					className="nav__menu-item"
				>
					<a>Idiom: {getLangId(lang)}</a>
					<Submenu opts={['pt-BR', 'en-US']} lang={lang} setLang={setLang} />
				</li>
			</ul>
		</nav>
	)
}
