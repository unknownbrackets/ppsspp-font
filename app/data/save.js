const WriteStream = require('../util/writestream.js');
import AppData from './index.js';

// TODO: Move somewhere better.
const FONT_PGF_BMP_H_ROWS = 1;
const FONT_PGF_BMP_V_ROWS = 2;
const FONT_PGF_BMP_OVERLAY = 3;
const FONT_PGF_METRIC_DIMENSION_INDEX = 4;
const FONT_PGF_METRIC_BEARING_X_INDEX = 8;
const FONT_PGF_METRIC_BEARING_Y_INDEX = 16;
const FONT_PGF_METRIC_ADVANCE_INDEX = 32;

class PGFSerializer
{
	constructor(pgf)
	{
		this.pgf = { ...pgf };
	}

	asBlob()
	{
		let header = { ...this.pgf.header };
		let headerStream = new WriteStream();

		// First, let's generate the glyphs, since we need their lengths.
		let glyphs = new Array(header.charPointerLength);
		for (var i = 0; i < glyphs.length; ++i)
			glyphs[i] = this.makeCharGlyph({ ...this.pgf.glyphs[i] });

		// TODO: Let's avoid the charmap compression tables, which we don't use yet (maybe bad...)
		header.revision = 2;
		header.size = header.revision == 3 ? 392 : 372;
		// TODO: Hmm?
		header.version = 6;

		// TODO: Calculate max/min values?

		// TODO: Use and write the tables.
		header.dimTableLength = 0;
		header.xAdjustTableLength = 0;
		header.yAdjustTableLength = 0;
		header.advanceTableLength = 0;

		// TODO: Shadows unsupported for now.
		header.shadowMapLength = 0;

		// TODO: We need the tables and such to calculate charPointerBpe.
		// TODO: For now, let's set it to a very safe value.
		header.charPointerBpe = 24;

		this.writeHeader(headerStream, header);
		// TODO: Write v3 header when v3?

		// TODO: Here's where we write the tables + shadows, then align.
		headerStream.align(4);

		// TODO: Here's where we'd write the charmap compression table.

		for (let i = 0; i < this.pgf.charMap.length; ++i)
			headerStream.writeBits(header.charMapBpe, this.pgf.charMap[i]);
		headerStream.align(4);

		let nextCharPointer = 0;
		for (let i = 0; i < header.charPointerLength; ++i)
		{
			headerStream.writeBits(header.charPointerBpe, nextCharPointer);
			nextCharPointer += glyphs[i].size / 4;
		}
		headerStream.align(4);

		// TODO: Shadows later?

		return new Blob([headerStream.asBlob()].concat(glyphs), { type: 'application/octet-stream' });
	}

	writeHeader(headerStream, header)
	{
		headerStream.writeU16(header.offset);
		headerStream.writeU16(header.size);
		headerStream.writeStr(4, header.magic);
		headerStream.writeS32(header.revision);
		headerStream.writeS32(header.version);
		headerStream.writeU32(header.charMapLength);
		headerStream.writeU32(header.charPointerLength);
		headerStream.writeU32(header.charMapBpe);
		headerStream.writeU32(header.charPointerBpe);

		headerStream.writeU8(header.unk1);
		headerStream.writeU8(header.unk2);
		headerStream.writeU8(header.bpp);
		headerStream.writeU8(header.unk3);
		headerStream.writeS32(header.hSize);
		headerStream.writeS32(header.vSize);
		headerStream.writeS32(header.hResolution);
		headerStream.writeS32(header.vResolution);

		headerStream.writeU8(header.unk4);
		headerStream.writeStr(64, header.fontName);
		headerStream.writeStr(64, header.fontType);
		headerStream.writeU8(header.unk5);

		headerStream.writeU16(header.firstGlyph);
		headerStream.writeU16(header.lastGlyph);
		headerStream.writeStr(26, header.unk6);

		headerStream.writeS32(header.maxAscender);
		headerStream.writeS32(header.maxDescender);
		headerStream.writeS32(header.maxLeftXAdjust);
		headerStream.writeS32(header.maxBaseYAdjust);
		headerStream.writeS32(header.minCenterXAdjust);
		headerStream.writeS32(header.maxTopYAdjust);
		headerStream.writeS32(header.maxAdvanceX);
		headerStream.writeS32(header.maxAdvanceY);
		headerStream.writeS32(header.maxSizeX);
		headerStream.writeS32(header.maxSizeY);
		headerStream.writeU16(header.maxGlyphWidth);
		headerStream.writeU16(header.maxGlyphHeight);
		headerStream.writeU8(header.unk7);
		headerStream.writeU8(header.unk8);

		headerStream.writeU8(header.dimTableLength);
		headerStream.writeU8(header.xAdjustTableLength);
		headerStream.writeU8(header.yAdjustTableLength);
		headerStream.writeU8(header.advanceTableLength);
		headerStream.writeStr(102, header.unk9);

		headerStream.writeS32(header.shadowMapLength);
		headerStream.writeS32(header.shadowMapBpe);
		headerStream.writeU32(header.unk10);
		headerStream.writeS32(header.shadowScale0);
		headerStream.writeS32(header.shadowScale1);
		headerStream.writeStr(8, header.unk11);
	}

	calcCharGlyphSize(info, glyphStream)
	{
		// The header is 8 bytes.
		let size = 8 + glyphStream.tell();

		// Account for any tabled dimensions.
		if (info.flags & FONT_PGF_METRIC_DIMENSION_INDEX)
			size++;
		else
			size += 8;
		if (info.flags & FONT_PGF_METRIC_BEARING_X_INDEX)
			size++;
		else
			size += 8;
		if (info.flags & FONT_PGF_METRIC_BEARING_Y_INDEX)
			size++;
		else
			size += 8;
		if (info.flags & FONT_PGF_METRIC_ADVANCE_INDEX)
			size++;
		else
			size += 8;

		return size;
	}

	makeCharGlyph(info)
	{
		// TODO: For now, we're not encoding any metrics in tables, or flipping h/v.
		info.flags = (info.flags & FONT_PGF_BMP_OVERLAY) ? FONT_PGF_BMP_H_ROWS : 0;

		// Most are probably fairly small.
		let glyphStream = new WriteStream(512);
		if (info.flags & FONT_PGF_BMP_OVERLAY)
		{
			// TODO: Here's where we COULD optimize writing the glyph.
			for (let i = 0; i < info.data.length; ++i)
			{
				// 1 at a time.
				glyphStream.writeBits(4, 0);
				glyphStream.writeBits(4, info.data[i]);
			}

			// Glyphs always align to 4 bytes, so do that here.
			glyphStream.align(4);
		}

		// 40 is the largest the char header will likely be.
		// We retain most properties from read.
		let headerStream = new WriteStream(40);
		info.size = this.calcCharGlyphSize(info, glyphStream);
		// TODO: Shadows not yet supported.
		info.shadowFlags = 0;
		info.shadowID = 0;

		headerStream.writeBits(14, info.size);
		headerStream.writeBits(7, info.w);
		headerStream.writeBits(7, info.h);
		headerStream.writeBits(7, info.left < 0 ? info.left + 128 : info.left);
		headerStream.writeBits(7, info.top < 0 ? info.top + 128 : info.top);
		headerStream.writeBits(6, info.flags);
		// TODO: Why even bother flipping the bits around?  This is from PPSSPP.
		headerStream.writeBits(7, (info.shadowFlags >> 5) | ((info.shadowFlags & 0x18) >> 1) | ((info.shadowFlags & 0x07) << 4));
		headerStream.writeBits(9, info.shadowID);
		headerStream.flushBits();

		// TODO: Use a table later.
		headerStream.writeS32(info.dimensionWidth);
		headerStream.writeS32(info.dimensionHeight);

		headerStream.writeS32(info.xAdjustH);
		headerStream.writeS32(info.xAdjustV);

		headerStream.writeS32(info.yAdjustH);
		headerStream.writeS32(info.yAdjustV);

		headerStream.writeS32(info.advanceH);
		headerStream.writeS32(info.advanceV);

		return new Blob([headerStream.asBlob(), glyphStream.asBlob()], { type: 'application/octet-stream' });
	}
}

function executeSave()
{
	return new Promise((resolve, reject) => {
		try {
			const pgf = AppData.getPrimary();
			let serializer = new PGFSerializer(pgf);
			resolve(serializer.asBlob());
		} catch (e) {
			reject(e);
		}
	});
}

export default executeSave;
