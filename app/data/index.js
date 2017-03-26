import AppCharMap from '../charmap.js';

let AppData = {
	primary: null,

	setPrimary: function (pgf)
	{
		pgf.chars = [];
		for (var i = 0; i < pgf.header.firstGlyph; ++i)
			pgf.chars[i] = null;
		for (var i = 0; i < pgf.charMap.length; ++i)
			pgf.chars[pgf.header.firstGlyph + i] = $.extend(true, {}, pgf.glyphs[pgf.charMap[i]]);

		this.primary = pgf;

		AppCharMap.draw(pgf.chars);
		if (pgf.chars[65]) {
			AppCharMap.select(65);
		} else {
			AppCharMap.select(pgf.header.firstGlyph);
		}
	},

	getPrimary: function ()
	{
		return this.primary;
	},

	getPrimaryChar: function (n)
	{
		return this.primary.chars[n];
	},
};

export default AppData;
