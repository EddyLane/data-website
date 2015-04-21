'use strict';

var Handlebars = require('Handlebars');
var Map = require('../map');
var $ = require('jQuery');
var Grapnel = require('Grapnel');
var _ = require('lodash');
var Autocomplete = require('../autocomplete');
var VFP_CONFIG_DATA = require('../config');
var IssueResults = require('../results/issue-results');
var PieChart = require('../results/pie-chart');
var constituenciesPromise = $.Deferred();

function LeadingParties() {

    this.map = new Map('#map', '#constituency-rows');
    var tabs = new TabNavigation(this.map);

    tabs.render();
}

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
 * TabNavigation
 * @param map
 * @constructor
 */
function TabNavigation(map) {

    this.templateFn = Handlebars.compile(document.querySelector('#tabber-navigation-template').innerHTML);
    this.target = document.querySelector('.tabber__nav');
    this.tab = null;

    this.navItems = [
        {name: 'Party trends', link: 'party-trends', selected: false},
        {name: 'Constituencies', link: 'constituencies', selected: false}
    ];

    var router = new Grapnel();

    this.constituencyTab = new ConstituencyTab(map);
    this.trendsTab = new PartyTrendsTab(map);

    router.get(':tabItem/:item?', function (req) {
        var found;

        _.each(this.navItems, function (e) {
            e.selected = false;
        });

        found = _.find(this.navItems, {link: req.params.tabItem});
        found.selected = true;

        this.render();

        if (this.tab) {
            this.tab.display(false);
            map.reset();
        }

        switch (found.name) {

            case 'Constituencies':
                this.tab = this.constituencyTab;
                break;

            case 'Party trends':
                this.tab = this.trendsTab;
                break;

        }

        this.tab.display(true);

    }.bind(this));


    map.clickCbs.push(function (constituencyPath) {
        constituenciesPromise.then(function (constituencies) {

            var found = _.find(constituencies, {constituency_name: constituencyPath.properties.PCON13NM});

            if (this.tab instanceof PartyTrendsTab) {
                this.tab.display(false);
                this.navItems[0].selected = false;
                this.tab = this.constituencyTab;
                this.navItems[1].selected = true;
                this.tab.display(true);
                this.render();
            }

            this.constituencyTab.selectConstituencyBySlug(found.constituency_slug);
            window.history.pushState(found, found.constituency_name, "#constituencies/" + found.constituency_slug);

        }.bind(this));
    }.bind(this));



}

TabNavigation.prototype.render = function render() {
    this.target.innerHTML = this.templateFn({
        items: this.navItems
    });
};

/**
 * PartyTrendsTab
 * @constructor
 */
function PartyTrendsTab(map) {

    var router = new Grapnel();

    this.navItems = [
        { name: 'Strength of political parties across the UK', link: 'strength-of-political-parties-across-the-uk', selected: false },
        { name: 'Leading party by issue', link: 'leading-party-by-issue', selected: false },
        { name: 'Leading party for each constituency', link: 'leading-party-for-each-constituency', selected: false },
        { name: 'Leading parties in the marginal constituencies', link: 'leading-parties-in-marginal-constituencies', selected: false }
    ];

    this.templateFn = Handlebars.compile(document.querySelector('#party-trends-navigation-template').innerHTML);
    this.element = document.querySelector('#trends-tab-container');

    router.get('party-trends/:trendType', function (req) {

        var found = _.find(this.navItems, { link: req.params.trendType });
        this.navItems.forEach(function(navItem) {
            navItem.selected = false;
        });

        if (found) {

            found.selected = true;
            map.reset();
            map.resetColours();
            this.render();

            switch(found.name) {

                case 'Strength of political parties across the UK':
                    new ChloroplethTab(this);
                    break;

                case 'Leading party for each constituency':
                    map.mapLeadingConstituencyResults();
                    break;

                default:
                    break;

            }
        }


    }.bind(this));

    this.render();

    function ChloroplethTab (parentTab) {
        console.log('errrrr');
        this.parentTab = parentTab;
        parentTab.element.innerHTML = '';
    }

    ChloroplethTab.prototype.render = function render () {

    };



}

PartyTrendsTab.prototype.render = function render () {
    this.element.innerHTML = this.templateFn({
        items: this.navItems
    });
};

PartyTrendsTab.prototype.display = function (display) {
    $(this.element).toggle(display);
};


/**
 * ConsituencyTab
 * @param map
 * @constructor
 */
function ConstituencyTab(map) {

    var router = new Grapnel();

    this.element = document.querySelector('#constituency-tab-container');
    this.$element = $(this.element);

    this.listTemplateFn = Handlebars.compile(document.querySelector('#constituency-list-template').innerHTML);
    this.listContainerElement = document.querySelector('#constituencies-list');

    if (constituenciesPromise.state() === 'pending') {
        $.getJSON(VFP_CONFIG_DATA.apiBaseUrl + '/constituencies.json', constituenciesPromise.resolve);
    }

    constituenciesPromise.then(function (constituencies) {
        var autocomplete;

        this.listContainerElement.innerHTML = this.listTemplateFn({
            constituencies: constituencies
        });
        autocomplete = new Autocomplete('constituency-search', {valueNames: ['constituency']});
        autocomplete.list.addEventListener('click', autocomplete.hideCompletions.bind(autocomplete));

        router.get('constituencies/:constituencySlug', function (req) {

            map.selectBySlug.call(map, req.params.constituencySlug);
            this.selectConstituencyBySlug(req.params.constituencySlug);
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
    constituenciesPromise.then(function (constituencies) {

        var found = _.find(constituencies, {constituency_slug: slug});

        document.querySelector('.search').value = found.constituency_name;

        $.getJSON(getConstituencyUrl(found.constituency_slug)).then(function (constituency) {
            new PieChart(constituency, null, true);
        });
    });
};



module.exports = LeadingParties;