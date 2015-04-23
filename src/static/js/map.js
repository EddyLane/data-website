'use strict';

var Handlebars = require('Handlebars');
var _ = require('lodash');
var d3 = require('d3');
var topojson = require('topojson');
var $ = require('jQuery');
var CONFIG = require('./config');

var parties = CONFIG.parties;
var leadingConstituenciesPromise = $.getJSON(CONFIG.apiBaseUrl + '/constituencies/results/parties.json?filters=leading');

/**
 * Gets a slugified version of a string
 *
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Map Class
 *
 * Intantiate a new map and data-table instance by passing in a css selector for where to place the map, and a css selector for where to put table results
 *
 * @param {string} mapSelector          Css selector
 * @param {string} tableSelector        Css selector
 * @constructor
 */
function Map(mapSelector, tableSelector) {

    this.clickCbs = [];

    this.marginalConstituenciesPromise = $.getJSON(CONFIG.apiBaseUrl + '/constituencies.json?filters=marginal');

    var parentElement = document.querySelector(mapSelector);
    var e = document.createElement('object');
    var $e = $(e);

    $e.attr('data', '/img/blank-simplified-map.svg');
    $e.attr('type', 'image/svg+xml');
    //$e.css('width', '100%');

    this.loadedSvg = $.Deferred();

    this.loadedGraphics = $.Deferred();

    this.loadedSvg.then(this.onSvgLoaded.bind(this));

    e.addEventListener('load', function (e) {
        this.loadedSvg.resolve(e.target.getSVGDocument().documentElement);
    }.bind(this));


    this.element = e;
    this.$element = $e;
    this.tableSelector = tableSelector;
    this.centered = null;
    this.unit = 'wpc';

    this.parentElement = parentElement;

    this.projection = d3.geo.albers().rotate([0, 0]);
    this.path = d3.geo.path().projection(this.projection);

    parentElement.appendChild(e);


}

/**
 * When the SVG is finished loading hook up D3 to the element and load the tpo_wpc.json so we can add click listeners
 * Requests the data from the API and initiates the data-table and maps the results to the SVG
 *
 * @param {Object} e     The 'load' event
 */
Map.prototype.onSvgLoaded = function onSvgLoaded(svgDocument) {

    $(svgDocument).attr('viewBox', '0 0 594 806');

    //Hook up D3 to the SVG element
    var svg = d3.select(svgDocument);
    var graphics = svg.select('g');

    svgDocument.addEventListener('click', _.bind(function (e) {
        if (e.target.nodeName === 'svg') {
            //Zoom back out of the map because click was not on a particular constituency path
            this.getToggleSelectedAreaFn(graphics)();
        }
    }, this));

    d3.json('/json/gb/topo_wpc.json', _.bind(function (error, boundaries) {
        this.addClickListeners(graphics, boundaries);
    }, this));

};

/**
 * From a given TopoJSON json file (https://github.com/mbostock/topojson) that matches the SVG that is saved
 * Create click event listeners on constituency paths to scale/translate the map
 *
 * @param {*} graphics      <g> SVG element
 * @param {Object} boundaries
 */
Map.prototype.addClickListeners = function addClickListeners(graphics, boundaries) {

    var b, s, t;
    var toggleFunction = this.getToggleSelectedAreaFn(graphics);

    graphics.selectAll('.area')
        .data(topojson.feature(boundaries, boundaries.objects[this.unit]).features)
        .on('click', function (constituencyPath) {
            toggleFunction(constituencyPath);
            this.clickCbs.forEach(function (cb) {
                cb(constituencyPath)
            });
        }.bind(this))
    ;

    this.projection
        .scale(1)
        .translate([0, 0]);

    // Compute correct bounds and scaling from the TopoJSON
    b = this.path.bounds(topojson.feature(boundaries, boundaries.objects[this.unit]));
    s = .95 / Math.max((b[1][0] - b[0][0]) / 594, (b[1][1] - b[0][1]) / 806);
    t = [(594 - s * (b[1][0] + b[0][0])) / 2, (806 - s * (b[1][1] + b[0][1])) / 2];

    this.projection
        .scale(s)
        .translate(t);

    this.loadedGraphics.resolve(graphics);

};

/**
 * Get a function that can be used to a zoom/scale to a particular path
 *
 * @param {*} graphics      <g> SVG element
 */
Map.prototype.getToggleSelectedAreaFn = function toggleSelectedArea(graphics) {

    /**
     * Scale and translate the map to a particular constituency, or zoom back out if already selected or nothing is passed in
     *
     * @param {Object} [constituencyPath]
     * @private
     */
    function toggleSelectedArea (constituencyPath) {
        // Handle map zooming
        var x, y, k;

        if (constituencyPath && this.centered !== constituencyPath) {
            var centroid = this.path.centroid(constituencyPath);
            x = centroid[0];
            y = centroid[1];
            k = 8;
            this.centered = constituencyPath;

        } else {
            x = 594 / 2;
            y = 806 / 2;
            k = 1;
            this.centered = null;
        }

        // Highlight area
        graphics.selectAll("path")
            .classed({
                selected: (this.centered && _.bind(function (d) {
                    return d === this.centered;
                }, this))
            });

        // Remove currently highlighted table row
        d3.select('#data_table .selected')
            .classed({selected: false});


        // Zoom in or out of area
        graphics.transition()
            .duration(750)
            .attr("transform", "translate(" + 594 / 2 + "," + 806 / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
            .style("stroke-width", 1 / k + "px");


    }

    return _.bind(toggleSelectedArea, this);

};

/**
 * Zoom in to a constituency by specifying its slug
 * @param slug
 */
Map.prototype.selectBySlug = function selectBySlug(slug) {
    this.loadedGraphics.then(function (graphics) {

        var mapElement = graphics.select('.' + slug);
        this.getToggleSelectedAreaFn(graphics)(mapElement.data()[0]);

    }.bind(this));
};


/**
 * Reset the map size
 */
Map.prototype.reset = function reset () {
    this.loadedGraphics.then(function (graphics) {

        this.getToggleSelectedAreaFn(graphics)(null);


    }.bind(this));
};

/**
 * Reset all map colours
 */
Map.prototype.resetColours = function resetColours () {
    this.removeRange();

    leadingConstituenciesPromise.then(function (constituencies) {

         this.loadedSvg.then(function (svgDoc) {

             console.log('resetting colours');
            _.forEach(constituencies, function (constituency) {
                var slug = slugify(constituency.constituency_name);
                var constituencyNode = svgDoc.querySelector('.' + slug);
                constituencyNode.setAttribute('class', 'area ' + slug);
                constituencyNode.style.fill = null;


            });

        });

    }.bind(this));

};

/**
 * Using handlebars create DOM for the data-table from a given set of constituencies
 * Add event listener on to the table that zooms to a particular constituency
 *
 * @param {*} graphics      <g> SVG element
 * @param {Object[]} constituencies   An array of constituency data from the API
 */
Map.prototype.tabulate = function tabulate(graphics, constituencies) {

    var table = document.querySelector(this.tableSelector);

    table.innerHTML = Handlebars.compile(document.querySelector('#constituency-list').innerHTML)({
        constituencies: constituencies
    });

    table.addEventListener('click', _.bind(function (e) {
        var mapElement = graphics.select('.' + e.target.parentNode.classList.item(0));
        this.getToggleSelectedAreaFn(graphics)(mapElement.data()[0]);
    }, this));
};


/**
 * Toggle different map modes
 */

Map.prototype.mapStrengthOfIssue = function mapStrengthOfIssue (issueSlug) {

    this.resetColours();
    $.getJSON(CONFIG.apiBaseUrl + '/constituencies/results/issues/' + issueSlug + '/parties.json?filters=leading')
        .then(this.mapConstituencyParties.bind(this));

};

Map.prototype.mapConstituencyParties = function mapConstituencyParties (constituencies) {

    this.loadedSvg.then(function (svgDoc) {

        _.forEach(constituencies, function (constituency) {
            var constituencyNode = svgDoc.querySelector('.' + slugify(constituency.constituency_name));
            constituencyNode.classList.add('party-' + constituency.party_name.toLowerCase().replace(/ /g, '-'));
        });
    });
};


Map.prototype.mapMarginalConstituencies = function mapMarginalConstituencies () {

    var mapFn = this.mapConstituencyParties.bind(this);

    this.resetColours();

    this.marginalConstituenciesPromise.then(function (marginalConstituencies) {
        leadingConstituenciesPromise.then(function (allConstituencies) {

            mapFn(_.filter(allConstituencies, function (constituency) {
                return _.find(marginalConstituencies, { constituency_name: constituency.constituency_name });
            }));
        });
    });

};

Map.prototype.renderRange = function renderRange(range) {
    this.rangeTemplateFn = Handlebars.compile(document.querySelector('#range-template').innerHTML);
    document.querySelector('#map-key').innerHTML = this.rangeTemplateFn({
        range: range
    });
};

Map.prototype.removeRange = function removeRange() {
    document.querySelector('#map-key').innerHTML = '';
};

Map.prototype.mapStrengthOfParty = function mapStrengthOfParty (partySlug) {

    this.resetColours();
    $.getJSON(CONFIG.apiBaseUrl + '/parties/' + partySlug + '/constituencies/results.json')

        .then(function (constituencies) {

            // Find maximum votes_percentage
            //var max = 0.0;
            //
            //_.forEach(constituencies, function (constituency) {
            //    if (constituency.votes_percentage > max) {
            //        max = constituency.votes_percentage;
            //    }
            //});

            var max = 60;

            // Find party colours
            for (var i = 0; i < parties.length; i++) {
                if (partySlug == parties[i]['slug']) {
                    var range = parties[i]['colour_scale'];
                }
            }

            this.renderRange(range);

            // Set colour scale
            var colours = d3.scale.quantize().domain([0, max]).range(range);

            this.loadedSvg.then(function (svgDoc) {
                _.forEach(constituencies, function (constituency) {
                    var constituencyNode = svgDoc.querySelector('.' + slugify(constituency.constituency_name));
                    d3.select(constituencyNode)
                        .style("fill", function () {
                            if (constituency.votes_percentage == 0.0) {
                                return "#c0c0c0"
                            } else {
                                return colours(constituency.votes_percentage * 2);
                            }
                        });
                });

            });

        }.bind(this))
    ;
};

/**
 * Add classes on to the constituency paths in the SVG from a given set of constituency results
 */
Map.prototype.mapLeadingConstituencyResults = function mapLeadingConstituencyResults() {
    leadingConstituenciesPromise.then(this.mapConstituencyParties.bind(this));
};

Handlebars.registerHelper('slugify', slugify);

module.exports = Map;
