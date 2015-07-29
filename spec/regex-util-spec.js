/*global require, describe, it, expect, beforeEach */
describe('regex util', function () {
	'use strict';
	var RegexUtil = require('../src/regex-util'),
		underTest;
	beforeEach(function () {
		underTest = new RegexUtil();
	});
	describe('replaceMatchGroup', function () {
		it('replaces a substring corresponding to a match group by index', function () {
			expect(underTest.replaceMatchGroup(
				'Simple arithmetic: 22 plus 222 is 2 and 43',
				/Simple arithmetic: (\d*) plus (\d*) is (\d*) and (\d*)/,
				[{index:2, value:'XXX'}]
				)).toEqual('Simple arithmetic: 22 plus 222 is XXX and 43');
		});
		it('replaces multiple substrings corresponding to match groups by index', function () {
			expect(underTest.replaceMatchGroup(
				'Simple arithmetic: 22 plus 222 is 2 and 43',
				/Simple arithmetic: (\d*) plus (\d*) is (\d*) and (\d*)/,
				[{index:2, value:'XXX'}, {index:3, value: 'YYY'}]
				)).toEqual('Simple arithmetic: 22 plus 222 is XXX and YYY');
		});
		it('deals with non-capturing regexes', function () {
			expect(underTest.replaceMatchGroup(
				'arithmetic: 22 plus 222 is 2 and 43',
				/[a-z]*: (\d*) plus (\d*) is (\d*) and (\d*)/,
				[{index:2, value:'XXX'}, {index:3, value: 'YYY'}]
				)).toEqual('arithmetic: 22 plus 222 is XXX and YYY');
		});
		it('deals with initial and trailing parts of the string', function () {
			expect(underTest.replaceMatchGroup(
				'initial arithmetic: 22 plus 222 is 2 and 43 trailing',
				/[a-z]*: (\d*) plus (\d*) is (\d*) and (\d*)/,
				[{index:2, value:'XXX'}, {index:3, value: 'YYY'}]
				)).toEqual('initial arithmetic: 22 plus 222 is XXX and YYY trailing');
		});
		it('works when regex has escape characters', function () {
			expect(underTest.replaceMatchGroup(
				'|Simple arithmetic|22 plus 222 is 2 and 43|',
				/\|Simple arithmetic\|(\d*) plus (\d*) is (\d*) and (\d*)\|/,
				[{index:2, value:'XXX'}, {index:3, value: 'YYY'}]
				)).toEqual('|Simple arithmetic|22 plus 222 is XXX and YYY|');
		});
		it('works when regex has double-escape characters', function () {
			expect(underTest.replaceMatchGroup(
				'|Simple arithmetic\\22 plus 222 is 2 and 43|',
				/\|Simple arithmetic\\(\d*) plus (\d*) is (\d*) and (\d*)\|/,
				[{index:2, value:'XXX'}, {index:3, value: 'YYY'}]
				)).toEqual('|Simple arithmetic\\22 plus 222 is XXX and YYY|');
		});
		it('works with capture groups at start', function () {
			expect(underTest.replaceMatchGroup(
				'hello there how are you',
				/([a-z]*) [a-z]* ([a-z]*) [a-z ]*/,
				[{index:1, value:'XXX'}, {index:0, value: 'YYY'}]
				)).toEqual('YYY there XXX are you');
		});
		it('works with capture groups at end', function () {
			expect(underTest.replaceMatchGroup(
				'hello there how are you',
				/[a-z]* ([a-z]*) [a-z]* ([a-z ]*)/,
				[{index:1, value:'XXX'}, {index:0, value: 'YYY'}]
				)).toEqual('hello YYY how XXX');
		});
		it('works with escaped brackets', function () {
			expect(underTest.replaceMatchGroup(
				'hello the(re how are you',
				/[a-z]* ([a-z\(]*) [a-z]* ([a-z ]*)/,
				[{index:1, value:'XXX'}, {index:0, value: 'YYY'}]
				)).toEqual('hello YYY how XXX');
		});
		it('ignores overrides for negative or out of range indexes', function () {
			expect(underTest.replaceMatchGroup(
				'hello there how are you',
				/[a-z]* ([a-z]*) [a-z]* ([a-z ]*)/,
				[{index:2, value:'XXX'}, {index:0, value: 'YYY'}, {index: -1, value: '888'}]
				)).toEqual('hello YYY how are you');
		});
		it('works with no capture groups', function () {
			expect(underTest.replaceMatchGroup(
				'hello there how are you',
				/[a-z]* [a-z]* [a-z]* [a-z ]*/,
				[{index:2, value:'XXX'}, {index:0, value: 'YYY'}, {index: -1, value: '888'}]
				)).toEqual('hello there how are you');

		});
	});
	describe('stripListSymbol', function () {
		it('ignores lines that are not list items', function () {
			expect(underTest.stripListSymbol('**SHOUT**')).toBe('**SHOUT**');
		});
		it('removes list symbols from items', function () {
			expect(underTest.stripListSymbol('* **SHOUT**')).toBe('**SHOUT**');
			expect(underTest.stripListSymbol(' * **SHOUT**')).toBe('**SHOUT**');
			expect(underTest.stripListSymbol(' - **SHOUT**')).toBe('**SHOUT**');
			expect(underTest.stripListSymbol('- **SHOUT**')).toBe('**SHOUT**');
		});
	});
	describe('isListItem', function () {
		it('ignores horizontal lines', function () {
			expect(underTest.isListItem('****')).toBeFalsy();
			expect(underTest.isListItem('* * * *')).toBeFalsy();
			expect(underTest.isListItem('---')).toBeFalsy();
			expect(underTest.isListItem('===')).toBeFalsy();
		});
		it('ignores lines that have bold formatting', function () {
			expect(underTest.isListItem('**SHOUT**')).toBeFalsy();
			expect(underTest.isListItem('** SHOUT **')).toBeFalsy();
			expect(underTest.isListItem('* SHOUT *')).toBeFalsy();
		});
		it('recognises lists', function () {
			expect(underTest.isListItem('* **SHOUT**')).toBeTruthy();
			expect(underTest.isListItem(' * **SHOUT**')).toBeTruthy();
			expect(underTest.isListItem(' - **SHOUT**')).toBeTruthy();
			expect(underTest.isListItem('- **SHOUT**')).toBeTruthy();
		});
	});
});
