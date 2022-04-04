import React from 'react'

import '../styles/social-media.scss'

import github_icon from '../static/iconmonstr-github-1.svg'

export const SocialMedia = () => {
	return (
		<div className='social-media-menu'>
			<a href="https://github.com/Marcos30004347/mathapp">
				<img className='social-icon' src={github_icon} alt="github" />
			</a>

		</div>
	)
}
