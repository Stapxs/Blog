/**
 * Shiki 主题 */
const tokens = {
	dark: {
		bg: '#232323', // --surface
		fg: '#ffffff', // --fg
		gray: '#999ca6', // rgb(var(--gray))
		green: '#1beb9e',
		purple: '#b462ff',
		orange: '#ff9528',
		blue: '#18b6ff',
		pink: '#ff45b4',
		yellow: '#dddd25',
		red: '#ff5252',
	},
	light: {
		bg: '#f7fbf7', // --surface（亮色覆盖）
		fg: '#1a1a1a', // --fg（亮色覆盖）
		gray: '#646464', // rgb(var(--gray))（亮色覆盖）
		green: '#00996b',
		purple: '#8f3fd0',
		orange: '#d96e00',
		blue: '#0079b8',
		pink: '#d41c8f',
		yellow: '#8f8f00',
		red: '#d32f2f',
	},
};

/**
 * 主题 token 规则
 * @param {typeof tokens.dark} c
 */
const rules = (c) => [
	{ settings: { foreground: c.fg, background: c.bg } },

	{ name: 'Comment', scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.gray } },

	{ name: 'String', scope: ['string'], settings: { foreground: c.green } },
	{ name: 'Regexp', scope: ['string.regexp', 'constant.other.character-class.regexp', 'constant.other.character-class.set.regexp', 'constant.other.character-class.range.regexp'], settings: { foreground: c.pink } },

	{ name: 'Keyword', scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: c.purple } },
	{ name: 'Language variable', scope: ['variable.language'], settings: { foreground: c.purple } },
	{ name: 'Operator', scope: ['keyword.operator'], settings: { foreground: c.fg } },
	{ name: 'Punctuation', scope: ['punctuation'], settings: { foreground: c.gray } },
	{ name: 'String quotes', scope: ['punctuation.definition.string', 'punctuation.definition.template-string'], settings: { foreground: c.green } },

	{ name: 'Function', scope: ['entity.name.function', 'variable.function', 'support.function'], settings: { foreground: c.blue } },
	{ name: 'Type / Class', scope: ['entity.name.type', 'entity.name.class', 'support.class', 'support.type'], settings: { foreground: c.yellow } },
	{ name: 'Number / Constant', scope: ['constant.numeric', 'constant.language', 'constant.character.escape', 'constant.other.color', 'support.constant'], settings: { foreground: c.orange } },
	{ name: 'Constant variable', scope: ['variable.other.constant'], settings: { foreground: c.yellow } },
	{ name: 'Property / Key', scope: ['variable.other.property', 'variable.other.object.property', 'variable.other.constant.property', 'meta.object-literal.key', 'meta.objectmember', 'support.type.property-name', 'support.variable.property'], settings: { foreground: c.blue } },

	{ name: 'Tag', scope: ['entity.name.tag'], settings: { foreground: c.pink } },
	{ name: 'Attribute', scope: ['entity.other.attribute-name'], settings: { foreground: c.orange } },

	{ name: 'Shell variable', scope: ['variable.other.special', 'punctuation.definition.variable'], settings: { foreground: c.yellow } },

	{ name: 'Heading', scope: ['markup.heading'], settings: { foreground: c.green } },
	{ name: 'Inserted', scope: ['markup.inserted'], settings: { foreground: c.green } },
	{ name: 'Deleted', scope: ['markup.deleted'], settings: { foreground: c.red } },
	{ name: 'Changed', scope: ['markup.changed'], settings: { foreground: c.orange } },
	{ name: 'Invalid', scope: ['invalid.illegal'], settings: { foreground: c.red } },
];

const makeTheme = (type, c) => ({
	name: `pixel-${type}`,
	type,
	colors: { 'editor.background': c.bg, 'editor.foreground': c.fg },
	settings: rules(c),
});

export const pixelDark = makeTheme('dark', tokens.dark);
export const pixelLight = makeTheme('light', tokens.light);
