let AppCharEditor = {
	activeBrush: null,

	init: function ()
	{
		AppCharEditor.setBrush('up');
		AppCharEditor.setupPalette();
		AppCharEditor.listenMouse();
	},

	setupPalette: function ()
	{
		var $palette = $("#palette");

		var $list = $('<ul><li data-value="up" class="active" title="Shortcut ="></li></ul>');
		for (var i = 0; i < 16; ++i)
		{
			var shortcut = i < 10 ? i : "abcdef"[i - 10];
			$list.append($('<li></li>').attr("data-value", i).attr("title", "Shortcut " + shortcut));
		}
		$palette.html($list);

		$palette.on("click", "li", function (ev)
		{
			var $li = $(ev.target);
			var val = $li.attr("data-value");
			$li.siblings().removeClass("active");
			$li.addClass("active");
			AppCharEditor.setBrush(val);
		});

		$(document.body).on("keydown", function (ev)
		{
			if (ev.metaKey || ev.ctrlKey || (ev.shiftKey && ev.which != 61) || ev.altKey)
				return;

			var change = null;
			if (ev.which == 61)
				change = 'up';
			if (ev.which >= 48 && ev.which < 58)
				change = ev.which - 48;
			if (ev.which >= 65 && ev.which < 71)
				change = ev.which - 65 + 10;

			if (change !== null)
			{
				$palette.find("li").removeClass("active");
				$palette.find('[data-value="' + change + '"]').addClass("active");

				AppCharEditor.setBrush(change);
			}
		});
	},

	listenMouse: function ()
	{
		var down = false;
		var oldBrush = null;
		var $editor = $("#character-editor");

		$editor.on("mousedown", "td", function (ev)
		{
			if (ev.which > 1)
			{
				oldBrush = AppCharEditor.activeBrush;
				AppCharEditor.setBrush('down');
			}

			var $td = $(this);
			$td.attr("data-value", AppCharEditor.activeBrush($td.attr("data-value")));

			down = true;
			ev.preventDefault();
		});
		$(document.documentElement).on("mouseup", function (ev)
		{
			if (oldBrush)
				AppCharEditor.activeBrush = oldBrush;
			oldBrush = null;

			down = false;
			ev.preventDefault();
		});
		$editor.on("dragstart", function (ev)
		{
			ev.preventDefault();
			return false;
		});
		$editor.on("mouseenter", "td", function (ev)
		{
			var $td = $(this);
			if (down)
				$td.attr("data-value", AppCharEditor.activeBrush($td.attr("data-value")));
		});
	},

	setBrush: function (kind)
	{
		if (kind == 'up')
		{
			AppCharEditor.activeBrush = function (old)
			{
				return old >= 15 ? old : (old | 0) + 1;
			};
		}
		else if (kind == 'down')
		{
			AppCharEditor.activeBrush = function (old)
			{
				return old <= 0 ? (old | 0) : old - 1;
			};
		}
		else
		{
			AppCharEditor.activeBrush = function (old)
			{
				return kind;
			};
		}
	},

	serialize: function (char)
	{
		char.data = new Array(char.w * char.h);

		var $rows = $("#character-editor").find("tr");
		for (var y = 0; y < char.h; ++y)
		{
			var $row = $rows.eq(y).find("td");
			for (var x = 0; x < char.w; ++x)
				char.data[char.w * y + x] = $row.eq(x).attr("data-value");
		}

		return char;
	},

	draw: function (char)
	{
		var $table = $('<table></table>');
		for (var y = 0; y < char.h; ++y)
		{
			var $tr = $('<tr></tr>');
			for (var x = 0; x < char.w; ++x)
			{
				var $td = $('<td></td>');
				$td.attr("data-value", char.data[char.w * y + x] | 0);
				$tr.append($td);
			}
			$table.append($tr);
		}

		$("#character-editor").html($table);
	}
};

AppCharEditor.init();

export default AppCharEditor;
