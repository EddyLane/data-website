var Handlebars = require('Handlebars');
var _ = require('lodash');
var $ = require('jQuery');
var VFP_CONFIG_DATA = require('../../../config');
var Grapnel = require('Grapnel');
/**
 *
 * @param parentTab
 * @param map
 * @constructor
 */
function ChloroplethTab(parentTab, map) {

    var router = new Grapnel();

    this.parentTab = parentTab;
    this.templateFn = Handlebars.compile(document.querySelector('#party-trends-chrolopleth-template').innerHTML);
    this.element = this.parentTab.element;

    this.partiesPromise = $.getJSON(VFP_CONFIG_DATA.apiBaseUrl + '/parties.json').then(function (parties) {
        return parties.map(function (party) {
            return _.assign(party, { selected: false });
        })
    });

    $(this.element).on('click', '.btn-clear-filter', function () {
        this.resetSelected();
        this.parentTab.resetSelected();
    }.bind(this));

    /**
     * Party filter
     */
    router.get(/filter=strength-of-political-parties&party=(.*)$/i, function (req) {
        var partySlug = req.params[0];
        this.selectBySlug(partySlug);
        map.mapStrengthOfParty(partySlug);
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

module.exports = ChloroplethTab;