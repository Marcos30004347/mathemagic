import React from 'react'

import {getLangId} from '../lib/utils/idioms'

import '../styles/dropdown.scss'

import drop_icon from '../static/arrow_drop_down_black_24dp.svg'

export const Submenu = ({ opts, setLang }: {
	opts: string[],
	lang: string,
	setLang: (idiom: string) => string
}) => {
	return (
		<ul className="nav__submenu">
			{
				opts.map((l) => (
					<li key={l} className="nav__submenu-item" onClick={() => { setLang(l) }}>
						<a>
							{getLangId(l)}
						</a>
					</li>

				))
			}
		</ul>
	)
}

export const Dropdown = ({ lang, setLang }: {
	lang: string,
	setLang: (idiom: string) => string
}) => {
	return (
		<nav className="nav">
			<ul className="nav__menu">
				<li
					className="nav__menu-item"
				>
					<a>
						{ getLangId(lang)}
						<img className='drop-icon' src={drop_icon} />
					</a>
					<Submenu opts={['pt-BR', 'en-US']} lang={lang} setLang={setLang} />
				</li>
			</ul>
		</nav>
	)
}
