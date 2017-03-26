class ReadStream
{
	constructor(buf)
	{
		this.view = new DataView(buf);
		this.pos = 0;
		this.bitpos = 0;
	}

	readU8()
	{
		const v = this.view.getUint8(this.pos);
		this.pos++;
		return v;
	}

	readS8()
	{
		const v = this.view.getInt8(this.pos);
		this.pos++;
		return v;
	}

	readU16()
	{
		const v = this.view.getUint16(this.pos, true);
		this.pos += 2;
		return v;
	}

	readS16()
	{
		const v = this.view.getInt16(this.pos, true);
		this.pos += 2;
		return v;
	}

	readU32()
	{
		const v = this.view.getUint32(this.pos, true);
		this.pos += 4;
		return v;
	}

	readS32()
	{
		const v = this.view.getInt32(this.pos, true);
		this.pos += 4;
		return v;
	}

	readF32()
	{
		const v = this.view.getFloat32(this.pos, true);
		this.pos += 4;
		return v;
	}

	readStr(len)
	{
		let s = "";
		let done = false;
		for (let i = 0; i < len; ++i)
		{
			const v = this.readU8();
			if (v == 0)
				done = true;
			if (!done)
				s += String.fromCharCode(v);
		}
		return s;
	}

	readBits(len)
	{
		let res = 0;
		if (this.bitpos + len < 32)
		{
			if (this.pos + 4 <= this.view.byteLength)
			{
				const dword = this.view.getUint32(this.pos, true);
				const mask = (1 << len) - 1;
				res = (dword >> this.bitpos) & mask;

				this.bitpos += len;
			}
			else
			{
				let remaining = len;
				while (remaining > 0)
				{
					const byte = this.view.getUint8(this.pos);
					const mask = (1 << remaining) - 1;
					res |= ((byte >> this.bitpos) & mask) << (len - remaining);

					const consumed = Math.min(8 - this.bitpos, remaining);
					this.bitpos += consumed;
					remaining -= consumed;

					if (this.bitpos > 8)
					{
						this.pos++;
						this.bitpos -= 8;
					}
				}
			}
		}
		else
		{
			const dword1 = this.view.getUint32(this.pos, true);
			const dword2 = this.view.getUint32(this.pos + 4, true);

			res = dword1 >> this.bitpos;

			const done = 32 - this.bitpos;
			const remaining = len - done;
			const mask = (1 << remaining) - 1;
			res |= (dword2 & mask) << done;

			this.bitpos += len;
		}

		while (this.bitpos >= 8)
		{
			this.bitpos -= 8;
			this.pos++;
		}

		return res;
	}

	align(bytes)
	{
		if (this.bitpos != 0)
		{
			this.pos++;
			this.bitpos = 0;
		}
		while ((this.pos % bytes) != 0)
			this.pos++;
	}

	tell()
	{
		return this.pos;
	}

	seek(pos)
	{
		this.bitpos = 0;
		this.pos = pos;
	}
}

module.exports = ReadStream;
