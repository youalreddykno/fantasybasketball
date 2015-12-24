//Load dependencies
var cheerio = require("cheerio");
var pg = require('pg');
var request = require("request");

//Job class constructor
function Job(){
    //Number of days since first day (10/27/15)
    this.dayNum = Math.ceil((new Date() - new Date(2015, 9, 27))  /  (1000  *  3600  *  24));
    //Uninitialized teams list
    this.teams = [];
}

//Job member functions
Job.prototype.extract = function extract(){
    var job = this;
    
    //Uninitialized async list
    var promises = [];
    
    //Get html for each team
    for (var i = 1; i <= 12; i++) {
        promises.push(new Promise(function (resolve, reject) {
            var index = i;
            request.get('http://games.espn.go.com/fba/boxscorequick?leagueId=273247&teamId=' + index + '&scoringPeriodId=' + job.dayNum + '&seasonId=2016&view=matchup', function (err, res) {
                if (err) reject(err);
                else {
                    var html = res.body;
                    var $ = cheerio.load(html);
                    
                    //Scrape html and compute values
                    var team = {};
                    team.score = $("#tmTotalPoints_" + index + "_sp_" + job.dayNum)[0].children[0].data;
                    team.games = $("#weekpace_" + index + "_0")[0].children[0].data;
                    team.avgscore = (team.score / team.games).toPrecision(4);
                    team.id = index;
                    
                    //Resolve async
                    resolve(team);
                }
            });
        }));
    }
    Promise.all(promises).then(function (values) {
        job.teams = values;
        job.load();
    });

}
Job.prototype.load = function load() {
    //Instantiate db client    
    var Client = pg.Client;
    var client = new Client(process.env.DATABASE_URL);
    
    //Uninitialized query list
    var queries = [];
    
    //create queries for each team
    this.teams.forEach(function (v, i) {
        queries.push(client.query("update fantasybasketball.stats set averageScore='" + v.avgscore + "', totalscore='" + v.score + "', gamesplayed='" + v.games + "' where id='" + v.id + "';"));
        queries[i].on('end', function () { console.log('Updated team with id: ' + v.id); });
    });
    
    //log event when query pool is empty
    client.on('drain', function () { console.log("drained"); });
    //log connection error event
    client.on('error', function (error) { console.log(error); });

    //initialize connection and execute queries defined above
    client.connect();
}

//ENTRY POINT
var job = new Job();
job.extract();
