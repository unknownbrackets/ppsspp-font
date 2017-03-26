import AppData from './data/index.js';

let AppCharMetrics = {
	active: null,

	display: function (c)
	{
		AppCharMetrics.active = c;
		var char = AppData.getPrimaryChar(c);

		var $metrics = $('<ul></ul>');
		$metrics.append(AppCharMetrics.makeMetric("Width", "w", char, 1));
		$metrics.append(AppCharMetrics.makeMetric("Height", "h", char, 1));
		$metrics.append(AppCharMetrics.makeMetric("Left offset", "left", char, 1));
		$metrics.append(AppCharMetrics.makeMetric("Top offset", "top", char, 1));
		$metrics.append(AppCharMetrics.makeMetric("Subpixel width", "dimensionWidth", char, 64));
		$metrics.append(AppCharMetrics.makeMetric("Subpixel height", "dimensionHeight", char, 64));
		$metrics.append(AppCharMetrics.makeMetric("Subpixel left (horiz text)", "xAdjustH", char, 64));
		$metrics.append(AppCharMetrics.makeMetric("Subpixel left (vert text)", "xAdjustV", char, 64));
		$metrics.append(AppCharMetrics.makeMetric("Subpixel top (horiz text)", "yAdjustH", char, 64));
		$metrics.append(AppCharMetrics.makeMetric("Subpixel top (vert text)", "yAdjustV", char, 64));
		$metrics.append(AppCharMetrics.makeMetric("Subpixel advance (horiz text)", "advanceH", char, 64));
		$metrics.append(AppCharMetrics.makeMetric("Subpixel advance (vert text)", "advanceV", char, 64));
		// TODO
		console.log(char);

		$("#character-metrics").html($metrics);
	},

	makeMetric: function (title, id, char, fmt)
	{
		var $label = $('<label></label>').text(title);
		var val = char[id];
		if (fmt == 64)
			val /= 64;
		var $value = $('<input type="text" />').attr("name", id).val(val);

		return $('<li></li>').append($label, $value);
	},
};

export default AppCharMetrics;
