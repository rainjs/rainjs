// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

// register the coverage reporter with JSTestDriver
jstestdriver.pluginRegistrar.register({
    name: 'jsCoverage Reporter',
    onTestsFinish: function () {
        var data = JSON.stringify(computeReport(top._$jscoverage));
        $.post(window.location.origin + '/report', data, function () {});
    }
});


/**
 * Computes global coverage for a specific metric.
 *
 * @param {Object} stats the coverage statistics object
 * @param {String} metric the metric for which to compute the coverage
 *
 * @returns {Number} the coverage for the specific metric
 */
function calculateCoverage(stats, metric) {
    var covered = stats[metric + 'Covered'];
    var total = stats[metric + 'Total'];
    var coverage = Math.round(covered / total * 100);
    return coverage + '% (' + covered + '/' + total + ')';
}
/**
 * Computes global coverage statistics based on the JsCoverage data object
 *
 * @param {Object} coverage the JsCoverage data object
 *
 * @returns {Object} the computed statistics
 */
function calculateStats(coverage) {
    var stats = {
        packagesCovered: 1,
        packagesTotal: 1,
        classesCovered: 0,
        classesTotal: 0,
        methodsCovered: 1,
        methodsTotal: 1,
        srcfilesCovered: 0,
        srcfilesTotal: 0,
        srclinesCovered: 0,
        srclinesTotal: 0
    };

    for (var file in coverage) {
        if (coverage.hasOwnProperty(file)) {
            stats.classesCovered += 1;
            stats.classesTotal += 1;
            stats.srcfilesCovered += 1;
            stats.srcfilesTotal += 1;
            var srclinesTotal = 0;
            var srclinesCovered = 0;
            for (var i = 0; i < coverage[file].source.length; i += 1) {
                if (coverage[file][i + 1] !== void 0) {
                    srclinesTotal += 1;
                    if (coverage[file][i + 1] > 0) {
                        srclinesCovered += 1;
                    }
                }
            }
            stats.srclinesTotal += srclinesTotal;
            stats.srclinesCovered += srclinesCovered;
        }
    }
    return stats;
}

/**
 * Computes global coverage report based on the JsCoverage data object
 *
 * @param {Object} coverage the JsCoverage data object
 *
 * @returns {Object} the computed report
 */
function computeReport(_$jscoverage) {
    var json = {};
    for (var file in _$jscoverage) {
        var coverage = _$jscoverage[file],
            length = coverage.length,
            source = coverage.source,
            array = [],
            lines = [],
            line;

        if (! _$jscoverage.hasOwnProperty(file)) {
            continue;
        }
        for (line = 0; line < length; line += 1) {
            var value = coverage[line];
            if (typeof value === 'undefined') {
                value = null;
            }
            array.push(value);
        }
        length = source.length;
        for (line = 0; line < length; line += 1) {
            lines.push(source[line]);
        }

        json[file] = {
            coverage: array,
            source: lines
        };
    }

    return json;
}
