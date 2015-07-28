(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*global module*/
module.exports = function () {
	'use strict';
	var self = this;
	self.executed = 0;
	self.passed = 0;
	self.failed = 0;
	self.error = 0;
	self.skipped = 0;
	self.increment = function (assertion) {
		self.executed++;
		if (assertion.passed) {
			self.passed++;
		} else {
			self.failed++;
		}
	};
	self.recordException = function (exception) {
		if (exception) {
			self.error++;
		}
	};
	self.currentCounts = function () {
		return JSON.parse(JSON.stringify(self));
	};
};

},{}],2:[function(require,module,exports){
/*global module*/
module.exports = function (expected, actual, passed, outputIndex) {
	'use strict';
	var self = this;
	self.value = actual;
	self.index = outputIndex;
	self.passed = passed;
	self.expected = expected;
};

},{}],3:[function(require,module,exports){
(function (global){
/*global require, global*/

global.DaSpec = {
	Runner: require('./daspec-runner'),
	StepDefinitions: require('../test-data/test-steps')
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../test-data/test-steps":11,"./daspec-runner":5}],4:[function(require,module,exports){
/*global module, require*/
module.exports = function () {
	'use strict';
	var self = this,
		RegexUtil = require('./regex-util'),
		regexUtil = new RegexUtil(),
		Assertion = require('./assertion'),
		MarkDownFormatter = require('./markdown-formatter'),
		ListUtil = require('./list-util'),
		listUtil = new ListUtil(),
		markDownFormatter = new MarkDownFormatter(),
		steps = [],
		currentAssertions;
	self.defineStep = function (regexMatcher, processFunction) {
		steps.push({
			matcher: regexMatcher,
			processor: processFunction
		});
	};
	self.assertEquals = function (expected, actual, optionalOutputIndex) {
		var	passed = expected == actual;
		currentAssertions.push(new Assertion(expected, markDownFormatter.formatPrimitiveResult(expected, actual, passed), passed, optionalOutputIndex));
	};
	self.assertSetEquals = function (expected, actual, optionalOutputIndex) {
		var result = listUtil.unorderedMatch(expected, actual);
		currentAssertions.push(new Assertion(expected, markDownFormatter.formatListResult(result), result.matches, optionalOutputIndex));
	};
	self.executeStep = function (stepText, counts, resultBuffer) {
		self.executeListStep(stepText, undefined, counts, resultBuffer);
	};
	self.executeListStep = function (stepText, list, counts, resultBuffer) {
		var markResult = function () {
				var withoutIndex = function (assertion) {
						return !assertion.index;
					},
					withIndex = function (assertion) {
						return assertion.index;
					},
					failed = function (assertion) {
						return !assertion.passed;
					},
					failedForList = function (assertion) {
						return assertion.expected === list.items && !assertion.passed;
					},
					noIndexAssertions = currentAssertions.filter(withoutIndex),
					headingLine = function () {
						if (noIndexAssertions.length === 0) {
							return regexUtil.replaceMatchGroup(stepText, step.matcher, currentAssertions);
						}
						if (noIndexAssertions.some(failed)) {
							return '**~~' + stepText + '~~**';
						}
						if (currentAssertions.some(failed)) {
							return regexUtil.replaceMatchGroup(stepText, step.matcher, currentAssertions.filter(withIndex));
						}
						if (currentAssertions.length) {
							return '**' + stepText + '**';
						}
						return stepText;
					},
					attachmentLines = function () {
						if (!list) {
							return '';
						}
						var listAssertions = currentAssertions.filter(failedForList),
								values = list.items;
						if (listAssertions && listAssertions.length > 0) {
							values = listAssertions[0].value;
						}
						return values.map(function (e) {
							return '\n* ' + e;
						}).join(''); // TODO: deal with ordered lists
					};
				return headingLine() + attachmentLines();
			},
			matchingSteps = steps.filter(function (step) {
				return step.matcher.test(stepText);
			}),
			match,
			resultText,
			step,
			stepArgs;

		if (!regexUtil.assertionLine(stepText)) {
			resultBuffer.push(stepText);
			return;
		}

		if (matchingSteps.length === 0) {
			resultBuffer.push(stepText);
			counts.skipped++;
			return;
		} else if (matchingSteps.length > 1) {
			/* bork on multiple options possible */
			throw new Error('multiple steps match line ' + stepText);
		}
		step = matchingSteps[0];
		match = stepText.match(step.matcher);
		currentAssertions = [];
		stepArgs = match.slice(1);
		if (list) { /* we know it's a list and the symbol */
			stepArgs.push(list);
		}
		try {
			step.processor.apply(self, stepArgs);
			resultText = stepText;
			currentAssertions.forEach(function (assertion) {
				counts.increment(assertion);
			});
			resultBuffer.push(markResult());
		} catch (e) {
			/* geniuine error, not assertion fail */
			resultBuffer.push('~~' + resultText + '~~');
			resultBuffer.push('\t' + e.stack);
			counts.recordException(e);
		}
	};
};

},{"./assertion":2,"./list-util":8,"./markdown-formatter":9,"./regex-util":10}],5:[function(require,module,exports){
/*global module, require*/
module.exports = function (stepFunc) {
	'use strict';
	var Context = require('./daspec-context'),
		AssertionCounts = require('./assertion-counts'),
		ExampleBlocks = require('./example-blocks'),
		context = new Context(),
		self = this,
		countDescription = function (counts) {
			var labels = ['executed', 'passed', 'failed', 'error', 'skipped'],
				description = '> **In da spec:** ',
				comma = false;

			labels.forEach(function (label) {
				if (counts[label]) {
					if (comma) {
						description = description + ', ';
					} else {
						comma = true;
					}
					description = description + label + ': ' + counts[label];
				}
			});
			if (!comma) {
				description = description + 'Nada';
			}
			return description;
		};
	stepFunc(context);

	self.example = function (inputText) {
		var counts = new AssertionCounts(),
			resultBuffer = [],
			blocks = new ExampleBlocks(inputText);
		blocks.getBlocks().forEach(function (block) {
			var blockLines = block.getMatchText(),
				blockList = block.getList();
			if (blockLines) {

				if (blockList) {
					context.executeListStep(blockLines[0], blockList, counts, resultBuffer);
				} else {
					blockLines.forEach(function (line) {
						context.executeStep(line, counts, resultBuffer);
					});
				}
			}
		});
		resultBuffer.unshift('');
		resultBuffer.unshift(countDescription(counts));
		return resultBuffer.join('\n');
	};
};

},{"./assertion-counts":1,"./daspec-context":4,"./example-blocks":7}],6:[function(require,module,exports){
/*global module, require*/
module.exports = function () {
	'use strict';
	var self = this,
		RegexUtil = require('./regex-util'),
		regexUtil = new RegexUtil(),
		lines = [];
	self.addLine = function (lineText) {
		lines.unshift(lineText);
	};
	self.isComplete = function () {
		if (lines.length === 0) {
			return false;
		}
		if (regexUtil.isListItem(lines[0])) {
			return false;
		}
		return true;
	};
	self.getList = function () {
		if (lines.length === 0) {
			return false;
		}
		var topLine = lines[0];
		if (!regexUtil.isListItem(topLine) && regexUtil.assertionLine(topLine)) {
			return {ordered: false, items: lines.filter(regexUtil.isListItem).map(regexUtil.stripListSymbol)};
		}
		return false;
	};
	self.getMatchText = function () {
		if (lines.length === 0) {
			return false;
		}
		var topLine = lines[0];
		if (!regexUtil.isListItem(topLine) && regexUtil.assertionLine(topLine)) {
			return [topLine];
		} else {
			return lines;
		}
	};

};

},{"./regex-util":10}],7:[function(require,module,exports){
/*global module, require*/
module.exports = function (inputText) {
	'use strict';
	var self = this,
		ExampleBlock = require('./example-block');
	self.getBlocks = function () {
		var lines = inputText && inputText.split('\n').reverse(),
			current = new ExampleBlock(),
			blocks = [];
		lines.forEach(function (line) {
			current.addLine(line);
			if (current.isComplete()) {
				blocks.push(current);
				current = new ExampleBlock();
			}
		});
		if (current.getMatchText()) {
			blocks.push(current);
		}
		return blocks.reverse();
	};
};

},{"./example-block":6}],8:[function(require,module,exports){
/*global module*/
module.exports = function () {
	'use strict';
	var self = this;
	self.unorderedMatch = function (array1, array2) {
		var matching = array1.filter(function (el) {
				return array2.indexOf(el) >= 0;
			}),
			missing = array1.filter(function (el) {
				return array2.indexOf(el) < 0;
			}),
			additional = array2.filter(function (el) {
				return array1.indexOf(el) < 0;
			});
		return {
			matches: missing.length === 0 && additional.length === 0,
			missing: missing,
			additional: additional,
			matching: matching
		};
	};
};

},{}],9:[function(require,module,exports){
/*global module*/
module.exports = function () {
	'use strict';
	var self = this,
			dash = String.fromCharCode(8211),
			tick = String.fromCharCode(10003);

	self.formatPrimitiveResult = function (expected, actual, passed) {
		if (passed) {
			return '**' + expected + '**';
		} else {
			return '**~~' + expected + '~~ ['  + actual + ']**';
		}
	};
	self.formatListResult = function (listResult) {
		var tickEl = function (e) {
			return '[' + tick + '] ' + e;
		}, crossEl = function (e) {
			return '**[' + dash + '] ~~' + e + '~~**';
		}, plusEl = function (e) {
			return '**[+] ' + e + '**';
		},
			matching = (listResult.matching || []).map(tickEl),
			missing = (listResult.missing || []).map(crossEl),
			additional = (listResult.additional || []).map(plusEl);
		return matching.concat(missing, additional);
	};
};

},{}],10:[function(require,module,exports){
/*global module*/
module.exports = function () {
	'use strict';
	var self = this;
	this.replaceMatchGroup = function (string, regex, overrides) {
		var match = string.match(regex),
			literalReplacement = regex.source,
			capturingGroup = /\([^)]*\)/,  /* todo: deal with non-capture groups */
			values = match.slice(1);
		overrides.forEach(function (replacement) {
			values[replacement.index] = replacement.value;
		});
		values.forEach(function (groupValue) {
			literalReplacement = literalReplacement.replace(capturingGroup, groupValue);
		});
		return string.replace(regex, literalReplacement);
	};
	this.isListItem = function (line) {
		if (/^[\*\s-=]*$/.test(line)) {
			return false;
		}
		if (!/^\s*[\*-]\s/.test(line)) {
			return false;
		}
		if (/^\s*\*\s/.test(line) && line.replace(/[^*]/g, '').length % 2 === 0) {
			return false;
		}
		return true;
	};
	this.stripListSymbol = function (line) {
		if (!self.isListItem(line)) {
			return line;
		}
		return line.replace(/^\s*[^\s]+\s/, '');
	};
	this.assertionLine = function (stepText) {
		if (stepText.length === 0 || stepText.trim().length === 0) {
			return false;
		}
		var linestartignores = ['#', '\t', '>', '    ', '![', '[', '***', '* * *', '---', '- - -', '===', '= = ='],
			result = true;
		linestartignores.forEach(function (lineStart) {
			if (stepText.substring(0, lineStart.length) === lineStart) {
				result = false;
			}
		});
		return result;
	};
};

},{}],11:[function(require,module,exports){
/*global module*/
module.exports = function (ctx) {
	'use strict';
	ctx.defineStep(/Simple arithmetic: (\d*) plus (\d*) is (\d*)/, function (firstArg, secondArg, expectedResult) {
		ctx.assertEquals(expectedResult, parseFloat(firstArg) + parseFloat(secondArg), 2);
	});
	ctx.defineStep(/Simple arithmetic: (\d*) and (\d*) added is (\d*) and multiplied is (\d*)/, function (firstArg, secondArg, expectedAdd, expectedMultiply) {
		ctx.assertEquals(expectedAdd, parseFloat(firstArg) + parseFloat(secondArg), 2);
		ctx.assertEquals(expectedMultiply, parseFloat(firstArg) * parseFloat(secondArg), 3);
	});
	ctx.defineStep(/Multiple Assertions (\d*) is (\d*) and (.*)/, function (num1, num2, lineStatus) {
		ctx.assertEquals(num2, num1, 1);
		ctx.assertEquals(lineStatus, 'passes');
	});
	ctx.defineStep(/Multiple Assertions line ([a-z]*) and ([a-z]*)/, function (lineStatus1, lineStatus2) {
		ctx.assertEquals(lineStatus1, 'passes');
		ctx.assertEquals(lineStatus2, 'passes');
	});
	ctx.defineStep(/Star Wars has the following episodes:/, function (listOfEpisodes) {
		var episodes = [
			'A New Hope',
			'The Empire Strikes Back',
			'Return of the Jedi'];
		ctx.assertSetEquals(listOfEpisodes.items, episodes);
	});
};

},{}]},{},[3]);