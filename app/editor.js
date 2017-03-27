import chareditor from './chareditor.js';
import AppCharMap from './charmap.js';
import charmetrics from './charmetrics.js';
import AppData from './data/index.js';
import loadData from './data/load.js';
import saveData from './data/save.js';


// TODO

$(document).on('click', '#save', function (ev)
{
    var a = document.createElement('a');
    a.style = 'display: none;';
    document.body.appendChild(a);

	saveData().then(blob => {
		const url = window.URL.createObjectURL(blob);
		a.href = url;
		a.download = "test.pgf";
		a.click();
        window.URL.revokeObjectURL(url);
	}, err => {
		throw err;
	});
});

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
