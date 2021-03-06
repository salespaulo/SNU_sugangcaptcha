var convnetjs = require('convnetjs'), fs = require('fs'), pngparse = require('pngparse-sync');;
var net = new convnetjs.Net();
var net_past = JSON.parse(fs.readFileSync("./net.json"));
net.fromJSON(net_past);

samples = fs.readdirSync('./read');

console.time("reading");
for(var i in samples) {
	if (samples[i] == '.DS_Store' || samples[i] == '.gitignore') continue;
	var text = samples[i].split('_')[0];
	var data = pngparse(fs.readFileSync('./read/' + samples[i]));

	var character_old = false;
	var cut1 = 26, cut2 = 26;
	var found = false;
	var failed = false;
	var prefix = '';

	for(var j = 0; j < 52; j++) {
		var character = false;
		for(var k = 0; k < 26; k++) {
			if (data.getPixel(j, k) != 1) {
				character = true;
				break;
			}
		}
		if (character == false && character_old == true) {
			cut1 = j;
			found = true;
		}
		if (character == true && character_old == false && found) {
			cut2 = j;
			break;
		}
		if (j == 51) failed = true;
		character_old = character;
	}

	if (failed) {
		failed = false;
		prefix = 'sep_';
		var character = 12632256, character_old = 12632256;
		for(var j = 0; j < 52; j++) {
			for(var k = 0; k < 26; k++) {
				if (data.getRawPixel(j, k) != 12632256) {
					character = data.getRawPixel(j, k);
					break;
				}
			}
			if (character != character_old && character_old != 12632256) {
				cut1 = j;
				cut2 = j;
				break;
			}
			if (j == 51) failed = true;
			character_old = character;
		}
	}

	if (failed) {
		fs.rename('./read/' + samples[i], './failed/failed_' + (0|Math.random()*1000000) + '.png');
		continue;
	}

	var input = new convnetjs.Vol(26, 26, 1, 0.0);
	var offset = cut1 - 26;
	for(var j = cut1 - 26; j < cut1; j++) {
		if (j < 0) {
			for(var k = 0; k < 26; k++) {
				input.w[(j-offset)*26 + k] = 1;
			}
		} else {
			for(var k = 0; k < 26; k++) {
				input.w[(j-offset)*26 + k] = data.getPixel(j, k);
			}
		}
	}
	var letter1 = net.forward(input).w;

	var input = new convnetjs.Vol(26, 26, 1, 0.0);
	offset = cut2;
	for(var j = cut2; j < cut2 + 26; j++) {
		if (j >= 52) {
			for(var k = 0; k < 26; k++) {
				input.w[(j-offset)*26 + k] = 1;
			}
		} else {
			for(var k = 0; k < 26; k++) {
				input.w[(j-offset)*26 + k] = data.getPixel(j, k);
			}
		}
	}
	var letter2 = net.forward(input).w;

	var max1 = 0, max2 = 0, ans1, ans2;
	for (var j in letter1) {
		if (letter1[j] > max1) {
			max1 = letter1[j];
			ans1 = j;
		}
	}
	for (var j in letter2) {
		if (letter2[j] > max2) {
			max2 = letter2[j];
			ans2 = j;
		}
	}
	max1 = (0|max1*100000)/100000;
	max2 = (0|max2*100000)/100000;
	/*if (max1 > 0.98 && max2 > 0.98)*/ fs.rename('./read/' + samples[i], './result/' + prefix + ans1 + ans2 + '_' + max1 + ',' + max2 + '_' + (0|Math.random()*100000) + '.png');
}
console.timeEnd("reading");