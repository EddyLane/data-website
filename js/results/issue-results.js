;
var IssueResults = (function (CONFIG, $, Handlebars) {

    var templatePromise = $.ajax({
        url: '/partials/results/issue-results.html',
        dataType: 'text'
    });

    /**
     * Calculate the total votes for all parties for a particular issue
     * @param issue
     * @returns {int}
     */
    function sumIssueVotes(issue) {
        return _.reduce(issue.results, function (total, results) {
            return total + parseInt(results.votes, 10);
        }, 0);
    }

    /**
     * Add the total votes and party percentage for each issue to the issue objects
     *
     * @param issues
     * @returns {*}
     */
    function formatIssuesForView(issues) {
        return _(issues)
            .forEach(function (issue) {
                issue.total = sumIssueVotes(issue);
                issue.results.forEach(function (partyResult) {
                    partyResult.percent = (parseInt(partyResult.votes, 10) / issue.total) * 100;
                });
            })
            .sortBy(function (issue) {
                return -issue.total;
            })
            .value()
        ;
    }

    /**
     * IssueResults is for displaying a collection of issue results
     *
     * @param issues
     * @constructor
     */
    function IssueResults(issues) {
        this.issues = formatIssuesForView(issues);
        this.render();
    }

    /**
     * Render this IssueResults
     */
    IssueResults.prototype.render = function render() {

        var target = document.querySelector('#issue-results');

        templatePromise.then(function (template) {
            target.innerHTML = Handlebars.compile(template)({
                issues: this.issues
            });
        }.bind(this));
    };

    /**
     * Increment helper
     */
    Handlebars.registerHelper('inc', function (value) {
        return parseInt(value) + 1;
    });

    /**
     * Round to 1 decimal place helper
     */
    Handlebars.registerHelper('round', function (value) {
        return Math.round(value * 10) / 10;
    });

    /**
     * Round to integer helper
     */
    Handlebars.registerHelper('roundToInt', function (value) {
        return Math.round(value);
    });

    /**
     * Format a number larger then 10,000 to "100.3k" format helper
     */
    Handlebars.registerHelper('thousands', function (value) {
        if (value < 10000) {
            return value;
        }
        var rounded = Math.round((value / 1000) * 10) / 10;
        return rounded + 'k';
    });

    return IssueResults;

})(VFP_DATA_CONFIG, jQuery.noConflict(), Handlebars);