export function getLangId(lang: string) {
	if(lang === 'en-US') {
		return 'english(US)'
	}
	if(lang === 'pt-BR') {
		return 'portuguese(BR)'
	}
	return lang;
}
