import React from 'react'

import '../styles/social-media.scss'

export const SocialMedia = () => {
	return (
		<div className='social-media-menu'>
			<a href="https://github.com/Marcos30004347/mathapp">
				<img style={{
					width: '60px',
					height: '60px',
				}} src={'./svg/social/iconmonstr-github-2.svg'} className="social-media-item" alt="github" />
			</a>

		</div>
	)
}
