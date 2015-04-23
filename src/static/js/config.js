'use strict';

var range = ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#de2d26', '#a50f15'];
var altRange = ['#f1eef6', '#d4b9da', '#c994c7', '#df65b0', '#dd1c77', '#980043'];

range = altRange;

module.exports = {
    apiBaseUrl: 'https://api.voteforpolicies.org.uk/v1',

    parties: [
        {
            party: "Conservatives", slug: "conservatives", colour: "#0087DC",
            colour_scale: range
            //colour_scale: ["#FFFFFF", "#F8E7C6", "#CEF190", "#9BED76", "#2DE3AE", "#0087DC"]
        },

        {
            party: "Green Party", slug: "green-party", colour: "#75A92D",
            colour_scale: range
            //colour_scale: ["#FFFFFF", "#EDD4CA", "#DCC09B", "#CBBE71", "#ABBA4C", "#75A92D"]
        },
        {
            party: "Scottish Green Party", slug: "scottish-green-party", colour: "#75A92D",
            colour_scale: range
            //colour_scale: ["#FFFFFF", "#EDD4CA", "#DCC09B", "#CBBE71", "#ABBA4C", "#75A92D"]
        },
        {
            party: "Labour", slug: "labour", colour: "#D50000",
            colour_scale: range
            //colour_scale: ["#FFFFFF", "#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#D50000"]
        },

        {
            party: "Liberal Democrats", slug: "liberal-democrats", colour: "#FE8300",
            colour_scale: range
            //colour_scale: ["#FFFFFF", "#B4B5FE", "#87EFFE", "#5AFE83", "#ADFE2D", "#FE8300"]
        },

        {
            party: "Plaid Cymru", slug: "plaid-cymru", colour: "#3E8424",
            colour_scale: range
            //colour_scale: ["#FFFFFF", "#E6D0C4", "#CDBB91", "#B2B566", "#799C41", "#3E8424"]
        },

        {
            party: "Scottish National Party", slug: "scottish-national-party", colour: "#EBC31C",
            colour_scale: range
            //colour_scale: ["#FFFFFF", "#FBD5CE", "#F7BC9F", "#F3B072", "#EFB346", "#EBC31C"]
        },

        {
            party: "UK Independence Party", slug: "ukip", colour: "#800080",
            colour_scale: range
            //colour_scale: ["#FFFFFF", "#E5E5B7", "#7ACC7A", "#47B2B2", "#316BA6", "#800080"]
        }
    ]

};