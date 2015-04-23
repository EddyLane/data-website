var Handlebars = require('Handlebars');
var _ = require('lodash');
var $ = require('jQuery');
var Grapnel = require('Grapnel');
var ChloroplethTab = require('./party-trends-tab/chloropleth-tab');
var LeadingPartyByIssueTab = require('./party-trends-tab/leading-party-by-issue');



/**
 * PartyTrendsTab
 * @constructor
 */
function PartyTrendsTab(map, parentTab) {


    this.map = map;
    this.parentTab = parentTab;
    this.templateFn = Handlebars.compile(document.querySelector('#party-trends-navigation-template').innerHTML);
    this.element = document.querySelector('#trends-tab-container');

    this.navItems = [
        {
            name: 'Leading party for each constituency',
            link: 'leading-party-for-each-constituency',
            selected: false
        },
        {
            name: 'Leading parties in marginal constituencies',
            link: 'leading-parties-in-marginal-constituencies',
            selected: false
        },
        {
            name: 'Strength of political parties',
            link: 'strength-of-political-parties',
            selected: false,
            tab: new ChloroplethTab(this, map)
        },
        {
            name: 'Leading party by issue',
            link: 'leading-party-by-issue',
            selected: false,
            tab: new LeadingPartyByIssueTab(this, map)
        }
    ];

    this.render();

}

PartyTrendsTab.prototype.resetSelected = function resetSelected () {

    window.location.href = '#party-trends';
    this.parentTab.filter = null;

    this.navItems.forEach(function (navItem) {
        navItem.selected = false;
    });

    this.map.reset();
    this.map.resetColours();

    this.render();
};

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

module.exports = PartyTrendsTab;