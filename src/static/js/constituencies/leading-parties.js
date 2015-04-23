'use strict';

var Handlebars = require('Handlebars');
var Map = require('../map');
var $ = require('jQuery');
var Grapnel = require('Grapnel');
var _ = require('lodash');
var VFP_CONFIG_DATA = require('../config');
var IssueResults = require('../results/issue-results');
var ConstituencyTab = require('./tabs/constituency-tab');

var constituenciesPromise = $.Deferred();
var filter;


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

    this.navItems = [
        {name: 'Party trends', link: 'party-trends', selected: false, tab: new PartyTrendsTab(map)},
        {
            name: 'Constituencies',
            link: 'constituencies',
            selected: false,
            tab: new ConstituencyTab(map, constituenciesPromise)
        }
    ];


    window.addEventListener("hashchange", function (e) {

        var newFilter = e.newURL.split('?');

        if (newFilter.length > 1) {
            map.resetColours();
        } else if (filter) {
            window.history.pushState({path: e.newURL}, e.newURL, e.newURL + '?filter=' + filter);
        }

    }, false);

    var router = new Grapnel();

    this.navItems.forEach(function (item) {
        item.tab.render();
    });


    /**
     * Party filter
     */
    router.get(/filter=strength-of-political-parties&party=(.*)$/i, function (req) {

        var partySlug = req.params[0];
        var chloroplethTab = this.navItems[0].tab.navItems[0].tab;
        chloroplethTab.selectBySlug(partySlug);
        map.mapStrengthOfParty(partySlug);

    }.bind(this));

    /**
     * Main filter
     */
    router.get(/filter=(.*)$/i, function (req) {

        filter = req.params[0];

        var filterItem = req.params[0].split('&')[0];

        this.navItems[0].tab.navItems.forEach(function (navItem) {
            navItem.selected = false;
        });

        var foundItem = _.find(this.navItems[0].tab.navItems, {link: filterItem});

        if (foundItem) {
            foundItem.selected = true;
            this.navItems[0].tab.render();
        }

        switch (filterItem) {

            case 'leading-party-for-each-constituency':
                map.mapLeadingConstituencyResults();
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

            if (this.tab instanceof PartyTrendsTab) {
                this.tab.navItems.forEach(function (tab) {
                    tab.selected = false;
                });
            }
        }

        this.render();

    }.bind(this));


    map.clickCbs.push(function (constituencyPath) {
        constituenciesPromise.then(function (constituencies) {

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
            var url = "#constituencies/" + found.constituency_slug;

            if (filter) {
                url += '?filter=' + filter;
            }

            window.history.pushState(found, found.constituency_name, url);

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

    this.templateFn = Handlebars.compile(document.querySelector('#party-trends-navigation-template').innerHTML);
    this.element = document.querySelector('#trends-tab-container');

    this.navItems = [
        {
            name: 'Strength of political parties across the UK',
            link: 'strength-of-political-parties',
            selected: false,
            tab: new ChloroplethTab(this, map)
        },
        //{name: 'Leading party by issue', link: 'leading-party-by-issue', selected: false},
        {name: 'Leading party for each constituency', link: 'leading-party-for-each-constituency', selected: false}
        //{
        //    name: 'Leading parties in the marginal constituencies',
        //    link: 'leading-parties-in-marginal-constituencies',
        //    selected: false
        //}
    ];



    this.render();

}
PartyTrendsTab.prototype.render = function render() {

    var selected = _.find(this.navItems, 'selected');

    if (selected && selected.tab) {

        selected.tab.render();

    } else {
        this.element.innerHTML = this.templateFn({
            items: this.navItems
        });
    }
};

PartyTrendsTab.prototype.display = function (display) {
    $(this.element).toggle(display);
};

/**
 *
 * @param parentTab
 * @param map
 * @constructor
 */
function ChloroplethTab(parentTab, map) {

    this.parentTab = parentTab;
    this.templateFn = Handlebars.compile(document.querySelector('#party-trends-chrolopleth-template').innerHTML);
    this.element = this.parentTab.element;

    this.partiesPromise = $.getJSON(VFP_CONFIG_DATA.apiBaseUrl + '/parties.json').then(function (parties) {
        return parties.map(function (party) {
            return _.assign(party, { selected: false });
        })
    });

    $(this.element).on('click', '.btn-clear-filter', function () {

        window.location.href = '#party-trends';
        filter = null;

        parentTab.navItems.forEach(function (navItem) {
            navItem.selected = false;
        });

        this.resetSelected();

        map.reset();
        map.resetColours();

        parentTab.render();

    }.bind(this));
}

ChloroplethTab.prototype.selectBySlug = function selectBySlug (slug) {

    this.resetSelected();

    this.partiesPromise.then(function (parties) {

        var select = _.find(parties, {slug : slug});
        select.selected = true;
        this.render();

    }.bind(this));

};

ChloroplethTab.prototype.resetSelected = function resetSelected () {
    this.partiesPromise.then(function (parties) {

        parties.forEach(function (party) {
            party.selected = false;
        });

    });
};

ChloroplethTab.prototype.render = function render() {

    //@TODO These are returning borked responses...
    var rejected = [
        'alliance-party-of-northern-ireland',
        'democratic-unionist-party',
        'social-democratic-and-labour-party',
        'sinn-fein'
    ];

    this.partiesPromise.then(function (parties) {

        parties = _.reject(parties, function (party) {
            return rejected.indexOf(party.slug) !== -1;
        });

        this.element.innerHTML = this.templateFn({
            items: parties
        });

    }.bind(this));

};


module.exports = LeadingParties;