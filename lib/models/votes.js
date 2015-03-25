
var postgres = require('./../postgres');

var votes = exports;

//the middleware function looks just like a route handler but it accepts a third argument, next)
//when the next function is called, it moves to the next middleware code!
votes.lookupPhoto = function(req, res, next){
    //we access the id param on the request object!
    var voteID = req.params.v_id;
  console.log('vote id', voteID);

    //Build sql query to select the resource object by ID
    var sql = 'SELECT * FROM votes WHERE id = $1';
    postgres.client.query(sql, [ voteID ], function(err, results){
        if (err) {
            console.error(err);
            res.statusCode = 500;
            return res.json({errors: ['Could not retrieve votes']});
        }
        //no result returned means that the object is not found
        if(results.rows.length === 0) {
            //We are able to set the HTTP status code on the respond object
            res.statusCode = 404;
            console.log('error 404 in lookup photoID');
            return res.json({errors: ['Votes not found']});
        }
        //by attaching a photo property to the request the data is now available
        //to our handler
        req.vote = results.rows[0];

    });

    return next();
};
