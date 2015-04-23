'use strict';

var Handlebars = require('Handlebars');
var Map = require('../map');
var $ = require('jQuery');
var Grapnel = require('Grapnel');
var _ = require('lodash');
var VFP_CONFIG_DATA = require('../config');
var ConstituencyTab = require('./tabs/constituency-tab');
var PartyTrendsTab = require('./tabs/party-trends-tab');

var constituenciesPromise = $.Deferred();

function LeadingParties() {
    this.map = new Map('#map', '#constituency-rows');
    var tabs = new TabNavigation(this.map);
    tabs.render();
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

    this.filter = null;

    var trendsTab = {
        name: 'Party trends',
        link: 'party-trends',
        selected: false,
        tab: new PartyTrendsTab(map, this)
    };

    var constituencyTab = {
        name: 'Constituencies',
        link: 'constituencies',
        selected: false,
        tab: new ConstituencyTab(map, constituenciesPromise)
    };

    this.navItems = [
        trendsTab,
        constituencyTab
    ];

    var router = new Grapnel();

    this.navItems.forEach(function (item) {
        item.tab.render();
    });

    /**
     * Main filter
     */
    router.get(/filter=(.*)$/i, function (req) {

        this.filter = req.params[0];

        var filterItem = req.params[0].split('&')[0];

        trendsTab.tab.navItems.forEach(function (navItem) {
            navItem.selected = false;
        });

        var foundItem = _.find(trendsTab.tab.navItems, {link: filterItem});

        if (foundItem) {
            foundItem.selected = true;
            trendsTab.tab.render();
        }

        switch (filterItem) {

            case 'leading-party-for-each-constituency':
                map.mapLeadingConstituencyResults.call(map);
                break;

            case 'leading-parties-in-marginal-constituencies':
                map.mapMarginalConstituencies.call(map);
                break;

            default:
                map.resetColours();
                break;

        }

    }.bind(this));


    router.get(':tabItem/:item?', function (req) {

        var found,
            tabItem = req.params.tabItem.split('?')[0];

        _.each(this.navItems, function (e) {
            e.selected = false;
        });

        found = _.find(this.navItems, {link: tabItem});

        if (this.tab && this.tab !== found.tab) {
            this.tab.display(false);
            map.reset();
        }

        if (found) {
            found.selected = true;
            found.tab.display(true);

            this.tab = found.tab;
        }

        this.render();

    }.bind(this));

    map.clickCbs.push(function (constituencyPath) {
        constituenciesPromise.then(function (constituencies) {
            var url;
            var found = _.find(constituencies, {constituency_name: constituencyPath.properties.PCON13NM});
            if (this.tab instanceof PartyTrendsTab) {
                this.tab.display(false);
                this.navItems[0].selected = false;
                this.tab = this.navItems[1].tab;
                this.navItems[1].selected = true;
                this.tab.display(true);
                this.render();
            }
            this.navItems[1].tab.selectConstituencyBySlug(found.constituency_slug);
            url = "#constituencies/" + found.constituency_slug;
            if (this.filter) {
                url += '?filter=' + this.filter;
            }
            window.history.pushState(found, found.constituency_name, url);
        }.bind(this));
    }.bind(this));



    window.addEventListener("hashchange", function (e) {

        var newFilter = e.newURL.split('?');

        if (newFilter.length > 1) {
            //console.log('resetting colours');
            //map.resetColours();
        } else if (this.filter) {
            window.history.pushState({path: e.newURL}, e.newURL, e.newURL + '?filter=' + this.filter);
        }

    }.bind(this), false);

}

TabNavigation.prototype.render = function render() {
    this.target.innerHTML = this.templateFn({
        items: this.navItems
    });
};


module.exports = LeadingParties;