import AppData from './data/index.js';
import AppCharMetrics from './charmetrics.js';
import AppCharEditor from './chareditor.js';

let AppCharMap = {
	active: null,

	init: function ()
	{
		$("#character-map").on("click", "[data-char]", function (ev)
		{
			var c = $(ev.target).attr("data-char");
			AppCharMap.select(c);
		})
	},

	draw: function (chars)
	{
		this.active = null;

		var $list = $('<ul></ul>');
		for (var i = 0; i < chars.length; ++i)
		{
			if (chars[i] === null || chars[i].w === undefined)
				continue;

			var $li = $('<li></li>').text(String.fromCharCode(i)).attr("data-char", i);

			$li.attr("title", chars[i].w + "x" + chars[i].h);
			$list.append($li);
		}
		$("#character-map").html($list);
	},

	getActive: function ()
	{
		return AppCharMap.active;
	},

	select: function (c)
	{
		var $map = $("#character-map");
		$map.find(".active").removeClass("active");
		$map.find('[data-char="' + c + '"]').addClass("active");

		if (AppCharMap.active)
		{
			// Save the old one.
			AppCharEditor.serialize(AppData.getPrimaryChar(AppCharMap.active));
		}

		AppCharMap.active = c;
		AppCharEditor.draw(AppData.getPrimaryChar(c));
		AppCharMetrics.display(c);
	},
};

AppCharMap.init();

export default AppCharMap;
