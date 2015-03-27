
var postgres = require('./../postgres');

var photos = exports;

//the middleware function looks just like a route handler but it accepts a third argument, next)
//when the next function is called, it moves to the next middleware code!
//photos.lookupPhoto = function(req, res, next){
//    //we access the id param on the request object!
//    var photoID = req.params.id;
//
//    //Build sql query to select the resource object by ID
//    var sql = 'SELECT * FROM photo WHERE id = $1';
//    postgres.client.query(sql, [ photoID ], function(err, results){
//        if (err) {
//            console.error(err);
//            res.statusCode = 500;
//            return res.json({errors: ['Could not retrieve photo']});
//        }
//        //no result returned means that the object is not found
//        if(results.rows.length === 0) {
//            //We are able to set the HTTP status code on the respond object
//            res.statusCode = 404;
//            console.log('error 404 in lookup photoID');
//            return res.json({errors: ['Photo not found']});
//        }
//        //by attaching a photo property to the request the data is now available
//        //to our handler
//        req.photo = results.rows[0];
//        next();
//    });
//};

photos.challengePhotos = function(req, res, next){
  //we access the id param on the request object!
  var challengeID = req.params.id;

  //Build sql query to select the resource object by ID
  var sql = 'SELECT * FROM photo WHERE c_id = $1';
  postgres.client.query(sql, [ challengeID ], function(err, results){
    if (err) {
      console.error(err);
      res.statusCode = 500;
      return res.json({errors: ['Could not retrieve photo']});
    }
    //no result returned means that the object is not found
    if(results.rows.length === 0) {
      //We are able to set the HTTP status code on the respond object
      res.statusCode = 404;
      console.log('error 404 in lookup photoID');
      return res.json({errors: ['Photo not found']});
    }
    //by attaching a photo property to the request the data is now available
    //to our handler
    console.log(results.rows);
    req.photo = results.rows;
    next();
  });
};


//we want to validate the photo before we
photos.validatePhoto = function(req, res, next){
    // first we want to see if the files are the infact a photo and are not too big!
    console.log(req.files);
    if (!req.files.photo){
        console.log('photo failed');
        console.log('photo failed');
        return res.json({
            errors: ['File failed to upload']
        });
    }

    if (req.files.photo.truncated){ //if truncated then it was too big
        console.log('photo too large');
        return res.json({
            errors: ['File too large']
        });
    }

    req.checkBody('description', 'Invalid description').notEmpty();
    //the checkBody function is from Express Validator to confirm that the description field is filled
    req.checkBody('album_id', 'Invalid album_id').isNumeric();
    //this makes sure that the album id is a number

    //then on the resulting object we can chain specific tests on the values this is cascading!

    var errors = req.validationErrors();
    if (errors) {
        var response = {errors: []};
        errors.forEach(function (err) {
            response.errors.push(err.msg);
        });

        res.statusCode = 400;
        return res.json(response);
    }

    return next();
};
