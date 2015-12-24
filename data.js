var pg = require('pg');

function data() { }

data.prototype.update = function update(team) {
    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if (err) console.log(err);
        console.log('Connected to postgres! Getting schemas...');
        console.log('Attempting to update id: ' + team.id);
        client
        .query("update fantasybasketball.stats set averageScore = '" + team.avgscore + "', totalscore= '" + team.score + "', gamesplayed = '" + team.games + "' where id ='" + team.id + "';")
        .on('row', function (row) {
            done();
            console.log('Successfully updated team with ID: ' + team.id);
        }).on('error', function (e) { console.log(e) });
    });
}

module.exports = data;