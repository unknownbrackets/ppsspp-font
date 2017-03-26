const ReadStream = require('../util/readstream.js');
import AppData from './index.js';

function readHeader(view)
{
	return {
		offset: view.readU16(),
		size: view.readU16(),
		magic: view.readStr(4),
		revision: view.readS32(),
		version: view.readS32(),
		charMapLength: view.readU32(),
		charPointerLength: view.readU32(),
		charMapBpe: view.readU32(),
		charPointerBpe: view.readU32(),

		unk1: view.readU8(),
		unk2: view.readU8(),
		bpp: view.readU8(),
		unk3: view.readU8(),
		hSize: view.readS32(),
		vSize: view.readS32(),
		hResolution: view.readS32(),
		vResolution: view.readS32(),

		unk4: view.readU8(),
		fontName: view.readStr(64),
		fontType: view.readStr(64),
		unk5: view.readU8(),

		firstGlyph: view.readU16(),
		lastGlyph: view.readU16(),
		unk6: view.readStr(26),

		maxAscender: view.readS32(),
		maxDescender: view.readS32(),
		maxLeftXAdjust: view.readS32(),
		maxBaseYAdjust: view.readS32(),
		minCenterXAdjust: view.readS32(),
		maxTopYAdjust: view.readS32(),

		maxAdvanceX: view.readS32(),
		maxAdvanceY: view.readS32(),
		maxSizeX: view.readS32(),
		maxSizeY: view.readS32(),
		maxGlyphWidth: view.readU16(),
		maxGlyphHeight: view.readU16(),
		unk7: view.readU8(),
		unk8: view.readU8(),

		dimTableLength: view.readU8(),
		xAdjustTableLength: view.readU8(),
		yAdjustTableLength: view.readU8(),
		advanceTableLength: view.readU8(),
		unk9: view.readStr(102),

		shadowMapLength: view.readS32(),
		shadowMapBpe: view.readS32(),
		unk10: view.readF32(),
		shadowScale0: view.readS32(),
		shadowScale1: view.readS32(),
		unk11: view.readStr(8),
	};
}

function readV3Header(view)
{
	return {
		compCharMapBpe1: view.readS32(),
		compCharMapLength1: view.readS32(),
		compCharMapBpe2: view.readS32(),
		compCharMapLength2: view.readS32(),
		unk1: view.readU32(),
	};
}

function readCharGlyph(view, pgf)
{
	// 64 total bits, 8 bytes.
	var info = {
		size: view.readBits(14),
		w: view.readBits(7),
		h: view.readBits(7),
		left: view.readBits(7),
		top: view.readBits(7),
		flags: view.readBits(6),
		shadowFlags: (view.readBits(2) << 5) | (view.readBits(2) << 3) | (view.readBits(3) << 0),
		shadowID: view.readBits(9),
	};
	if (info.left >= 64)
		info.left -= 128;
	if (info.top >= 64)
		info.top -= 128;

	const FONT_PGF_BMP_H_ROWS = 1;
	const FONT_PGF_BMP_V_ROWS = 2;
	const FONT_PGF_BMP_OVERLAY = 3;
	const FONT_PGF_METRIC_DIMENSION_INDEX = 4;
	const FONT_PGF_METRIC_BEARING_X_INDEX = 8;
	const FONT_PGF_METRIC_BEARING_Y_INDEX = 16;
	const FONT_PGF_METRIC_ADVANCE_INDEX = 32;

	if (info.flags & FONT_PGF_METRIC_DIMENSION_INDEX)
	{
		var idx = view.readU8();
		if (idx < pgf.dimTable.length)
		{
			info.dimensionWidth = pgf.dimTable[idx].w;
			info.dimensionHeight = pgf.dimTable[idx].h;
		}
	}
	else
	{
		info.dimensionWidth = view.readS32();
		info.dimensionHeight = view.readS32();
	}

	if (info.flags & FONT_PGF_METRIC_BEARING_X_INDEX)
	{
		var idx = view.readU8();
		if (idx < pgf.xAdjustTable.length)
		{
			info.xAdjustH = pgf.xAdjustTable[idx].horiz;
			info.xAdjustV = pgf.xAdjustTable[idx].vert;
		}
	}
	else
	{
		info.xAdjustH = view.readS32();
		info.xAdjustV = view.readS32();
	}

	if (info.flags & FONT_PGF_METRIC_BEARING_Y_INDEX)
	{
		var idx = view.readU8();
		if (idx < pgf.yAdjustTable.length)
		{
			info.yAdjustH = pgf.yAdjustTable[idx].horiz;
			info.yAdjustV = pgf.yAdjustTable[idx].vert;
		}
	}
	else
	{
		info.yAdjustH = view.readS32();
		info.yAdjustV = view.readS32();
	}

	if (info.flags & FONT_PGF_METRIC_ADVANCE_INDEX)
	{
		var idx = view.readU8();
		if (idx < pgf.advanceTable.length)
		{
			info.advanceH = pgf.advanceTable[idx].horiz;
			info.advanceV = pgf.advanceTable[idx].vert;
		}
	}
	else
	{
		info.advanceH = view.readS32();
		info.advanceV = view.readS32();
	}

	var useH = (info.flags & FONT_PGF_BMP_OVERLAY) == FONT_PGF_BMP_H_ROWS;
	var useV = (info.flags & FONT_PGF_BMP_OVERLAY) == FONT_PGF_BMP_V_ROWS;
	if (useH || useV)
	{
		info.data = new Array(info.w * info.h);
		var i = 0;
		while (i < info.data.length)
		{
			var nibble = view.readBits(4);
			if (nibble < 8)
			{
				var color = view.readBits(4);
				var count = nibble + 1;
				for (var j = 0; j < count; j++)
					info.data[i + j] = color;
				i += count;
			}
			else
			{
				var count = 16 - nibble;
				for (var j = 0; j < count; j++)
					info.data[i + j] = view.readBits(4);
				i += count;
			}
		}
		while (i < info.data.length)
		{
			// Ran out of file, let's zero out the remaining pixels.
			info.data[i] = 0;
		}

		if (useV)
		{
			// Let's just fix it here.
			var newdata = new Array(info.w * info.h);
			for (var y = 0; y < info.h; ++y)
			{
				for (var x = 0; x < info.w; ++x)
				{
					var i = y * info.w + x;
					var newx = Math.floor(i / info.h);
					var newy = i % info.h;
					newdata[newy * info.w + newx] = info.data[i];
				}
			}
			info.data = newdata;
		}
	}

	return info;
}

function executeLoad(buf)
{
	var view = new ReadStream(buf);
	var pgf = {};

	var header = readHeader(view);
	var v3header = header.revision == 3 ? readV3Header(view) : null;
	pgf.header = header;
	pgf.v3header = v3header;

	pgf.dimTable = new Array(header.dimTableLength);
	for (var i = 0; i < pgf.dimTable.length; ++i)
		pgf.dimTable[i] = {w: view.readU32(), h: view.readU32()};

	pgf.xAdjustTable = new Array(header.xAdjustTableLength);
	for (var i = 0; i < pgf.xAdjustTable.length; ++i)
		pgf.xAdjustTable[i] = {horiz: view.readS32(), vert: view.readS32()};

	pgf.yAdjustTable = new Array(header.yAdjustTableLength);
	for (var i = 0; i < pgf.yAdjustTable.length; ++i)
		pgf.yAdjustTable[i] = {horiz: view.readS32(), vert: view.readS32()};

	pgf.advanceTable = new Array(header.advanceTableLength);
	for (var i = 0; i < pgf.advanceTable.length; ++i)
		pgf.advanceTable[i] = {horiz: view.readS32(), vert: view.readS32()};

	pgf.shadowMap = new Array(header.shadowMapLength);
	for (var i = 0; i < pgf.shadowMap.length; ++i)
		pgf.shadowMap[i] = view.readBits(header.shadowMapBpe);
	view.align(4);

	pgf.charmapCompressionTable1 = null;
	pgf.charmapCompressionTable2 = null;
	if (v3header !== null)
	{
		// TODO: What are the other bits?
		pgf.charmapCompressionTable1 = new Array(v3header.compCharMapLength1 & 0xFFFF);
		for (var i = 0; i < pgf.charmapCompressionTable1.length; ++i)
			pgf.charmapCompressionTable1[i] = {unk1: view.readU16(), unk2: view.readU16()};

		pgf.charmapCompressionTable2 = new Array(v3header.compCharMapLength2 & 0xFFFF);
		for (var i = 0; i < pgf.charmapCompressionTable2.length; ++i)
			pgf.charmapCompressionTable2[i] = {unk1: view.readU16(), unk2: view.readU16()};
	}

	pgf.charMap = new Array(header.charMapLength);
	for (var i = 0; i < pgf.charMap.length; ++i)
		pgf.charMap[i] = view.readBits(header.charMapBpe);
	view.align(4);

	pgf.charPointers = new Array(header.charPointerLength);
	for (var i = 0; i < pgf.charPointers.length; ++i)
		pgf.charPointers[i] = view.readBits(header.charPointerBpe);
	view.align(4);

	var fontdata = view.tell();

	pgf.glyphs = new Array(header.charPointerLength);
	for (var i = 0; i < pgf.glyphs.length; ++i)
	{
		view.seek(fontdata + pgf.charPointers[i] * 4);
		pgf.glyphs[i] = readCharGlyph(view, pgf);
	}

	// TODO: Shadows later?

	AppData.setPrimary(pgf);
}

export default executeLoad;
