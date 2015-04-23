var Handlebars = require('Handlebars');
var _ = require('lodash');
var $ = require('jQuery');
var VFP_CONFIG_DATA = require('../../../config');
var Grapnel = require('Grapnel');

function LeadingPartyByIssue (parentTab, map) {

    var router = new Grapnel();

    this.parentTab = parentTab;
    this.templateFn = Handlebars.compile(document.querySelector('#leading-party-by-issue-template').innerHTML);
    this.element = this.parentTab.element;

    $(this.element).on('click', '.btn-clear-filter', function () {
        this.parentTab.resetSelected();
        this.resetSelected();
    }.bind(this));

    this.issuesPromise = $.getJSON(VFP_CONFIG_DATA.apiBaseUrl + '/issues.json').then(function (issues) {
        return issues.map(function (issue) {
            return _.assign(issue, { selected: false });
        });
    });

    /**
     * Party filter
     */
    router.get(/filter=leading-party-by-issue&issue=(.*)$/i, function (req) {

        var issueSlug = req.params[0];

        console.log('Issue', issueSlug);

        this.selectBySlug(issueSlug);
        map.mapStrengthOfIssue(issueSlug);

    }.bind(this));

}


LeadingPartyByIssue.prototype.selectBySlug = function selectBySlug (slug) {

    this.resetSelected();

    this.issuesPromise.then(function (issues) {
        var select = _.find(issues, {slug : slug});
        select.selected = true;
        this.render();
    }.bind(this));

};

LeadingPartyByIssue.prototype.resetSelected = function resetSelected () {
    this.issuesPromise.then(function (issues) {

        issues.forEach(function (issue) {
            issue.selected = false;
        });

    });
};
LeadingPartyByIssue.prototype.render = function render () {
    this.issuesPromise.then(function (issues) {

        this.parentTab.element.innerHTML = this.templateFn({
            items: issues
        });

    }.bind(this));
};


module.exports = LeadingPartyByIssue;