"use strict";

var path = require('path'),
    fs = require('fs'),
    wrench = require('wrench');

/**
 * Generates a number of stylesheets, each having the same number of css rules.
 *
 * To run the tool and start the rain server:
 *      node components/css_renderer/server/stylesheets.js 10 400 2; raind
 *
 * @param {Number} sheetCount the number of stylesheets to generate
 * @param {Number} ruleCount the number of rules per sheet
 * @param {Number} step the step for the color codes
 */
function generateStyleSheet(sheetCount, ruleCount, step) {
    var sheetsPath = path.join(__dirname, '../client/css/sheets');

    try {
        wrench.rmdirSyncRecursive(sheetsPath);
        fs.mkdirSync(sheetsPath);
    } catch (err) {
        console.log('An error occurred when cleaning the previous stylesheet information: ', err);
        return;
    }

    var colors = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'],
        colorsLength = colors.length,
        htmlContent = '{{css path="index.css"}}';

    for (var i = 1; i <= sheetCount; i++) {
        htmlContent += '{{css path="sheets/sheet' + i + '.css"}}\n';
    }

    var cssContent, c1 = 0, c2 = 0, c3 = 0, c4 = 0, c5 = 0, c6 = 0,
        rulesTotal = 1;

    for (var i = 1; i <= sheetCount; i++) {
        var rules = 1;
        cssContent = '';

        while (rules <= ruleCount) {
            for (; c1 < colorsLength; c1 = c1 + step) {
                for (; c2 < colorsLength; c2 = c2 + step) {
                    for (; c3 < colorsLength; c3 = c3 + step) {
                        for (; c4 < colorsLength; c4 = c4 + step) {
                            for (; c5 < colorsLength; c5 = c5 + step) {
                                for (; c6 < colorsLength; c6 = c6 + step) {
                                    if (rules > ruleCount) {
                                        break;
                                    }

                                    var color = colors[c1] + colors[c2] + colors[c3] + colors[c4] +
                                                colors[c5] + colors[c6];

                                    cssContent += '.rule' + rulesTotal +
                                                  '{ background-color: #' + color + '; }\n';
                                    htmlContent += '<div class="rule' + rulesTotal + '">' +
                                                    rulesTotal + '</div>\n';
                                    rules++;
                                    rulesTotal++;
                                }
                                c6 = normalize(c6, colorsLength);
                                if (rules > ruleCount) {
                                    break;
                                }
                            }
                            c5 = normalize(c5, colorsLength);
                            if (rules > ruleCount) {
                                break;
                            }
                        }
                        c4 = normalize(c4, colorsLength);
                        if (rules > ruleCount) {
                            break;
                        }
                    }
                    c3 = normalize(c3, colorsLength);
                    if (rules > ruleCount) {
                        break;
                    }
                }
                c2 = normalize(c2, colorsLength);
                if (rules > ruleCount) {
                    break;
                }
            }
            c1 = normalize(c1, colorsLength);
        }

        try {
            var filePath = path.join(__dirname, '../client/css/sheets/sheet' + i + '.css');
            fs.writeFileSync(filePath, cssContent);
        } catch (err) {
            console.log('An error occurred when writing a stylesheet file: ', err);
            return;
        }
    }

    try {
        var filePath = path.join(__dirname, '../client/templates/stylesheets.html');
        fs.writeFileSync(filePath, htmlContent);
    } catch (err) {
        console.log('An error occurred when updating the stylesheet.html file: ', err);
        return;
    }
}

function normalize(index, count) {
    return index % count;
}

var usageString = 'Usage: node stylesheets.js <number-of-stylesheets> ' +
                                             '<number-of-rules-per-sheet>' +
                                             '<[step]>';

if (process.argv.length > 3) {
    try {
        var sheetCount = parseInt(process.argv[2], 10),
            ruleCount = parseInt(process.argv[3], 10),
            step = process.argv[4] ? parseInt(process.argv[4], 10) : 1;
        generateStyleSheet(sheetCount, ruleCount, step);
    } catch (err) {
        console.log(usageString, err);
    }
} else {
    console.log(usageString);
}
