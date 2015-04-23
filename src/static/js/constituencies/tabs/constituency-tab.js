var $ = require('jQuery');
var VFP_CONFIG_DATA = require('../../config');
var Autocomplete = require('../../autocomplete');
var PieChart = require('../../results/pie-chart');
var Grapnel = require('Grapnel');
var Handlebars = require('Handlebars');
var _ = require('lodash');


/**
 * Get the API url for a specific constituency
 *
 * @param {string} slug
 * @returns {string}
 */
function getConstituencyUrl(slug) {
    return VFP_CONFIG_DATA.apiBaseUrl + '/constituencies/' + slug + '/results.json';
}


/**
 * ConsituencyTab
 * @param map
 * @param constituenciesPromise
 * @constructor
 */
function ConstituencyTab(map, constituenciesPromise) {

    this.constituenciesPromise = constituenciesPromise;

    this.router = new Grapnel();
    this.map = map;
    this.element = document.querySelector('#constituency-tab-container');
    this.$element = $(this.element);

    this.listTemplateFn = Handlebars.compile(document.querySelector('#constituency-list-template').innerHTML);
    this.listContainerElement = document.querySelector('#constituencies-list');

    if (constituenciesPromise.state() === 'pending') {
        $.getJSON(VFP_CONFIG_DATA.apiBaseUrl + '/constituencies.json', constituenciesPromise.resolve);
    }
}

ConstituencyTab.prototype.render = function render () {

    this.constituenciesPromise.then(function (constituencies) {
        var autocomplete;

        this.listContainerElement.innerHTML = this.listTemplateFn({
            constituencies: constituencies
        });

        autocomplete = new Autocomplete('constituency-search', {valueNames: ['constituency']});
        autocomplete.list.addEventListener('click', autocomplete.hideCompletions.bind(autocomplete));

        this.router.get('constituencies/:constituencySlug', function (req) {
            var constituencySlug = req.params.constituencySlug.split('?')[0];
            this.map.selectBySlug.call(this.map, constituencySlug);
            this.selectConstituencyBySlug(constituencySlug);
        }.bind(this));

    }.bind(this));
}


ConstituencyTab.prototype.display = function (display) {
    this.$element.toggle(display);
    if (display === false) {
        this.element.querySelector('#pie-chart-results').innerHTML = '';
        this.element.querySelector('.search').value = '';
    }
};


ConstituencyTab.prototype.selectConstituencyBySlug = function selectConstituencyBySlug(slug) {
    this.constituenciesPromise.then(function (constituencies) {
        var found = _.find(constituencies, {constituency_slug: slug});
        document.querySelector('.search').value = found.constituency_name;
        $.getJSON(getConstituencyUrl(found.constituency_slug)).then(function (constituency) {
            new PieChart(constituency, null, true);
        });
    });
};

module.exports = ConstituencyTab;