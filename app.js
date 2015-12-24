var pg = require('pg');
var request = require("request");
var cheerio = require("cheerio");
const dayone = new Date(2015, 9, 27);
const today = new Date();
var total = Date.parse(today) - Date.parse(dayone);
var numday = Math.ceil((total)  /  (1000  *  3600  *  24));

job(1, 12);

function job(start, end) {
    var promises = [];
    for (var i = start; i <= end; i++) {
        promises.push(new Promise(function (resolve, reject) {
            var index = i;
            request.get('http://games.espn.go.com/fba/boxscorequick?leagueId=273247&teamId=' + index + '&scoringPeriodId=' + numday + '&seasonId=2016&view=matchup', function (err, res) {
                if (err) reject(false);
                var html = res.body;
                var $ = cheerio.load(html);
                var team = {};
                team.score = $("#tmTotalPtsRaw_" + index)[0].children[0].data;
                team.games = $("#weekpace_" + index + "_0")[0].children[0].data;
                team.avgscore = (team.score / team.games).toPrecision(4);
                team.id = index;
                resolve(team)
            });
        }));
    }
    Promise.all(promises).then(function (values) {
        values.forEach(function (v, i) {
            pg.connect(process.env.DATABASE_URL, function (err, client, done) {
                if (err) console.log(err);
                console.log('Connected to postgres! Getting schemas...');
                console.log('Attempting to update id: ' + v.id);
                client
                    .query("update fantasybasketball.stats set averageScore = '" + v.avgscore + "', totalscore= '" + v.score + "', gamesplayed = '" + v.games + "' where id ='" + v.id + "';")
                    .on('row', function (row) {
                    done();
                    console.log('Successfully updated team with ID: ' + v.id);
                })
                    .on('error', function (e) { console.log(e) })
                    .on('end', function (d) { console.log(d) });
            });
        });
    });
}