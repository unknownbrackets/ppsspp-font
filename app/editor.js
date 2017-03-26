import chareditor from './chareditor.js';
import AppCharMap from './charmap.js';
import charmetrics from './charmetrics.js';
import AppData from './data/index.js';
import loadData from './data/load.js';
import saveData from './data/save.js';


// TODO

var $html = $(document.documentElement);

$.event.props.push('dataTransfer');

$html.on("dragenter dragover", function (ev)
{
	ev.stopPropagation();
	ev.preventDefault();
});

$html.on("drop", function (ev)
{
	ev.stopPropagation();
	ev.preventDefault();

	var file = ev.dataTransfer.files[0];
	var reader = new FileReader();
	reader.onload = function ()
	{
		loadData(reader.result);
	};

	reader.readAsArrayBuffer(file);
});
