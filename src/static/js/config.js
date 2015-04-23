'use strict';


module.exports = {
    apiBaseUrl: 'https://api.voteforpolicies.org.uk/v1',
    parties: [
        {
            party: "Conservatives", slug: "conservatives", colour: "#0087DC",
            colour_scale: ["#FFFFFF", "#CCE7F8", "#99CFF1", "#66B7EA", "#339FE3", "#0087DC"]
        },
        {
            party: "Green Party", slug: "green-party", colour: "#75A92D",
            colour_scale: ["#FFFFFF", "#E3EED5", "#C8DDAB", "#ACCB81", "#91BA57", "#75A92D"]
        },
        {
            party: "Scottish Green Party", slug: "scottish-green-party", colour: "#00B543",
            colour_scale: ["#FFFFFF", "#CCF0D9", "#99E1B4", "#66D38E", "#33C469", "#00B543"]
        },
        {
            party: "Labour", slug: "labour", colour: "#D50000",
            colour_scale: ["#FFFFFF", "#F7CCCC", "#EE9999", "#E66666", "#DD3333", "#D50000"]
        },
        {
            party: "Liberal Democrats", slug: "liberal-democrats", colour: "#FE8300",
            colour_scale: ["#FFFFFF", "#B4B5FE", "#87EFFE", "#5AFE83", "#ADFE2D", "#FE8300"]
        },

        {
            party: "Plaid Cymru", slug: "plaid-cymru", colour: "#3E8424",
            colour_scale: ["#FFFFFF", "#E6D0C4", "#CDBB91", "#B2B566", "#799C41", "#3E8424"]
        },

        {
            party: "Scottish National Party", slug: "scottish-national-party", colour: "#EBC31C",
            colour_scale: ["#FFFFFF", "#FBD5CE", "#F7BC9F", "#F3B072", "#EFB346", "#EBC31C"]
        },

        {
            party: "UK Independence Party", slug: "ukip", colour: "#800080",
            colour_scale: ["#FFFFFF", "#E5E5B7", "#7ACC7A", "#47B2B2", "#316BA6", "#800080"]
        }
    ]

};