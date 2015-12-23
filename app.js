var request = require("request");
var cheerio = require("cheerio");
const dayone = new Date(2015, 9, 27);
const today = new Date();
var total = Date.parse(today) - Date.parse(dayone);
var numday = Math.ceil((total)  /  (1000  *  3600  *  24));

var promises = [];

for (var i = 1; i <= 12; i++) {
    promises.push(new Promise(function (resolve, reject) {
        var index = i;
        request.get('http://games.espn.go.com/fba/boxscorequick?leagueId=273247&teamId=' + index + '&scoringPeriodId=' + numday + '&seasonId=2016&view=matchup', function (err, res) {
            if (err) reject(false);            
            var html = res.body;
            var $ = cheerio.load(html);
            var score = $("#tmTotalPtsRaw_" + index)[0].children[0].data;
            var games = $("#weekpace_" + index + "_0")[0].children[0].data;
            console.log("teamid: "+index+" "+(score / games).toPrecision(4));
            resolve(true);
        });
    }));
}

Promise.all(promises).then(function (values) { 
    console.log();
});
