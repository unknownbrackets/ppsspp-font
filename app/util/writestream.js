// Basic usage:
//
// let stream = new WriteStream();
// stream.writeU8(42);
// ...
// let finished = stream.asBlob();
class WriteStream
{
	static CHUNK_SIZE = 8192;

	constructor(size = undefined)
	{
		this.chunks = [];

		this.buf = new ArrayBuffer(size || WriteStream.CHUNK_SIZE);
		this.view = new DataView(this.buf);
		this.pos = 0;
		this.pendingBits = 0;
		this.bitpos = 0;
	}

	flushBits()
	{
		// Anything to flush?
		if (this.bitpos === 0)
			return;
		if (this.bitpos > 32)
			throw new Error('Should never queue more than 32 bits');

		const size = Math.floor((this.bitpos + 7) / 8);

		// Before writing, zero bitpos for prep().
		this.bitpos = 0;
		if (size == 1)
			this.writeU8(this.pendingBits);
		else if (size == 2)
			this.writeU16(this.pendingBits);
		else if (size == 3)
		{
			this.writeU16(this.pendingBits & 0xFFFF);
			this.writeU8(this.pendingBits >> 16);
		}
		else if (size == 4)
			this.writeU32(this.pendingBits);
		this.pendingBits = 0;
	}

	flush()
	{
		this.flushBits();
		if (this.pos != 0)
			this.chunks.push(new DataView(this.buf, 0, this.pos));
		this.buf = null;
		this.view = null;
		this.pos = 0;
	}

	asBlob()
	{
		this.flush();
		return new Blob(this.chunks, { type: 'application/octet-stream' });
	}

	add(viewOrBlob)
	{
		this.flush();
		if (viewOrBlob instanceof WriteStream)
			this.chunks.push(viewOrBlob.asBlob());
		else
			this.chunks.push(viewOrBlob);
	}

	prep(len)
	{
		if (this.bitpos !== 0)
			throw new Error('Only supported when aligned');

		if (this.buf === null || this.pos + len > this.view.byteLength)
		{
			// Time for a new chunk.
			this.flush();
			this.buf = new ArrayBuffer(Math.max(WriteStream.CHUNK_SIZE, len));
			this.view = new DataView(this.buf);
		}
	}

	writeU8(v)
	{
		this.prep(1);
		this.view.setUint8(this.pos, v);
		this.pos++;
	}

	writeS8(v)
	{
		this.prep(1);
		this.view.setInt8(this.pos, v);
		this.pos++;
	}

	writeU16(v)
	{
		this.prep(2);
		this.view.setUint16(this.pos, v, true);
		this.pos += 2;
	}

	writeS16(v)
	{
		this.prep(2);
		this.view.getInt16(this.pos, v, true);
		this.pos += 2;
	}

	writeU32(v)
	{
		this.prep(4);
		this.view.setUint32(this.pos, v, true);
		this.pos += 4;
	}

	writeS32(v)
	{
		this.prep(4);
		this.view.setInt32(this.pos, v, true);
		this.pos += 4;
	}

	writeF32(v)
	{
		this.prep(4);
		this.view.setFloat32(this.pos, v, true);
		this.pos += 4;
	}

	writeStr(len, v)
	{
		this.prep(len);

		let i;
		for (i = 0; i < len && i < v.length; ++i)
			this.writeU8(v.charCodeAt(i));
		for (; i < len; ++i)
			this.writeU8(0);
	}

	// When using, make sure to flushBits() before writing bytes other ways again.
	writeBits(len, v)
	{
		if (this.bitpos + len > 32)
		{
			const left = 32 - this.bitpos;
			this.writeBits(left, v);
			return this.writeBits(len - left, v >> left);
		}
		else if (len == 32)
		{
			// Must be at this.bitpos === 0.
			return this.writeU32(v);
		}

		// At this point, we're doing one of these things:
		// 1. Not at an offset, queuing 31 or less bits (protected by above.)
		// 2. At an offset, queuing more bits.
		// 3. At an offset, completing 32 bits (protected from more by above.)

		const mask = (1 << len) - 1;
		this.pendingBits |= (v & mask) << this.bitpos;
		this.bitpos += len;

		// Now, flush if we just completed 32 bits.
		if (this.bitpos == 32)
			this.flushBits();
	}

	align(bytes)
	{
		this.flushBits();
		while ((this.pos % bytes) != 0)
			this.writeU8(0);
	}

	tell()
	{
		let chunksLen = 0;
		for (chunk of this.chunks)
			chunksLen += chunk.byteLength;
		if (this.bitpos != 0)
			chunksLen++;

		return chunksLen + this.pos;
	}
}

module.exports = WriteStream;
