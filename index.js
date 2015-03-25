var express = require('express');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

var multer = require('multer');
var app = express();


var passport = require('passport');
var flash = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var session      = require('express-session');

//configure ==========
require('./config/passport')(passport); // pass passport for configuration
app.use('/uploads', express.static(__dirname +'/uploads'));

app.set('views', './views');
app.set('view engine', 'ejs');

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json('application/json'));
app.use(bodyParser.urlencoded());

//make sure to add the validator after the body parser!!
app.use(expressValidator());

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8100');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');



  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
};

app.use(allowCrossDomain);


var postgres = require('./lib/postgres');
var photos = require('./lib/models/photo');
var votes = require('./lib/models/votes');
var challenges = require('./lib/models/challenge');


// required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// Create the express router object for Photos
var photoRouter = express.Router();
console.log ("photoRouter is set");

// A GET to the root of a resource returns a list of that resource
photoRouter.get('/', function(req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
    res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...
    var page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1){
        page = 1;
    }

    var limit = parseInt(req.query.limit, 10);
    if (isNaN(limit)){
        limit = 20;
    } else if (limit > 50){
        limit = 50;
    } else if (limit < 1) {
        limit = 1;
    }

    var sql = 'SELECT count(1) FROM photo';
    postgres.client.query(sql, function(err, result) {
        if (err) {
            console.error(err);
            res.statusCode = 500;
            return res.json({
                errors: ['Could not retrieve photos']
            });
        }

        var count = parseInt(result.rows[0].count, 10);
        var offset = (page - 1) * limit; //page - 1 * the limit so when we are on
        // page two the offset is 11.

        sql = 'SELECT photo.*, users.name as username FROM photo, users WHERE photo.u_id = users.u_id OFFSET $1 LIMIT $2';
        postgres.client.query(sql, [offset, limit], function (err, result) {
            if (err) {
                console.error(err);
                res.statusCode = 500;
                return res.json({
                    errors: ['Could not retrieve photos']
                });
            }
            return res.json(result.rows);
        });
    });
});


// A POST to the root of a resource should create a new object
photoRouter.post('/', multer({
    dest: './uploads/',
    rename: function(field, filename){
        filename = filename.replace(/\W+/g, '-').toLowerCase();
        return filename + '_' + Date.now();
    },
    limits: {
        files: 1,
        fileSize: 2 * 1024 * 1024
    }
}), photos.validatePhoto, function(req, res) {



    console.log("Post to /photo is happening");
    var sql = 'INSERT INTO photo (description, filepath, album_id, u_id, c_id) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    var data = [
        req.body.description,
        req.files.photo.path,
        req.body.album_id,
        req.user.id,
        req.body.c_id
    ];
    //multer appends the field name (photo)

    console.log(data);
    postgres.client.query(sql, data, function(err, result){
        if (err) {
            console.error(err);
            res.statusCode = 500;
            return res.json({
                errors: ['Failed to create photo']
            });
        }

        //consoles the id number we are at
        console.log('Insert result:', result.rows);


        // what does the client want if they have succeeded
        var photoId = result.rows[0].id;
        var sql = 'SELECT * FROM photo WHERE id = $1';
        postgres.client.query(sql, [ photoId ], function(err, result){
            if (err){
                console.error(err);
                res.statusCode=500;
                return res.json({ errors: ['Could not retrieve photo after it was created'] });
            }

            res.statusCode= 201;
            console.log('Select result', result); // check to make sure i'm sending back an object
            res.json(result.rows[0]);
        });

    });
});
// We specify a param in our path for the GET of a specific object
photoRouter.get('/:id([0-9]+)', photos.lookupPhoto, function(req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
    res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...

    res.json(req.photo);

});
// Similar to the GET on an object, to update it we can PATCH
photoRouter.patch('/:id', function(req, res) { });
// Delete a specific object

//photoRouter.delete('/:id', lookupPhoto, function(req, res) { });
// Attach the routers for their respective paths
app.use('/photo', photoRouter);

var uploadRouter = express.Router();
uploadRouter.get('/', function(req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
    res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...

    res.render('form');
});
app.use('/upload', uploadRouter);



////////////////////////////////Creating the Challenge Table////////////////////////////////////////

var challengeRouter = express.Router();
console.log ("challengeRouter is set");

// A GET to the root of a resource returns a list of that resource
challengeRouter.get('/', function(req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
    res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...
    var page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1){
        page = 1;
    }

    var limit = parseInt(req.query.limit, 10);
    if (isNaN(limit)){
        limit = 20;
    } else if (limit > 50){
        limit = 50;
    } else if (limit < 1) {
        limit = 1;
    }

    var sql = 'SELECT count(1) FROM challenge';
    postgres.client.query(sql, function(err, result) {
        if (err) {
            console.error(err);
            res.statusCode = 500;
            return res.json({
                errors: ['Could not retrieve challenges!']
            });
        }

        var count = parseInt(result.rows[0].count, 10);
        var offset = (page - 1) * limit; //page - 1 * the limit so when we are on
        // page two the offset is 11.

        sql = 'SELECT challenge.*, users.name as username FROM challenge, users WHERE challenge.u_id = users.u_id OFFSET $1 LIMIT $2';
        postgres.client.query(sql, [offset, limit], function (err, result) {
            if (err) {
                console.error(err);
                res.statusCode = 500;
                return res.json({
                    errors: ['Could not retrieve photos']
                });
            }
            return res.json(result.rows);
        });
    });
});


// A POST to the root of a resource should create a new object
challengeRouter.post('/', multer({
    dest: './uploads/',
    rename: function(field, filename){
      console.log(filename)
        filename = filename.replace(/\W+/g, '-').toLowerCase();
        return filename + '_' + Date.now();
    },
    limits: {
        files: 1,
        fileSize: 2 * 1024 * 1024
    }
}), photos.validatePhoto, function(req, res) {

    res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
    res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it



    console.log("Post to /challenge is happening");
    var sql = 'INSERT INTO challenge (name, filepath, description, created_on, u_id) VALUES ($1, $2, $3, now(), $4) RETURNING c_id';
    var data = [
        req.body.name,
        req.files.photo.path,
        req.body.description,
        req.user.id
    ];
    //multer appends the field name (photo)


    console.log(data);
    postgres.client.query(sql, data, function(err, result){
        if (err) {
            console.error(err);
            res.statusCode = 500;
            return res.json({
                errors: ['Failed to create challenge']
            });
        }

        //consoles the id number we are at
        console.log('Insert result:', result.rows);


        // what does the client want if they have succeeded
        var challengeId = result.rows[0].c_id;
        var sql = 'SELECT * FROM challenge WHERE c_id = $1';
        console.log(challengeId);
        postgres.client.query(sql, [ challengeId ], function(err, result){
            if (err){
                console.error(err);
                res.statusCode=500;
                return res.json({ errors: ['Could not retrieve photo after it was created'] });
            }

            res.statusCode= 201;
            console.log('Select result', result); // check to make sure i'm sending back an object
            res.json(result.rows[0]);
        });

    });
});
// We specify a param in our path for the GET of a specific object
challengeRouter.get('/:id([0-9]+)', challenges.lookupChallenge, function(req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
    res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...

    res.json(req.challenge);

});
// Similar to the GET on an object, to update it we can PATCH
challengeRouter.patch('/:id', function(req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
    res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...

});
// Delete a specific object

//photoRouter.delete('/:id', lookupPhoto, function(req, res) { });
// Attach the routers for their respective paths
app.use('/challenge', challengeRouter);


/////////////////////////////////////input form for challenge table /////////////////////

var inputRouter = express.Router();
inputRouter.get('/', function(req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
    res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...

    res.render('input');
});

app.use('/input', inputRouter);

//////////////////////////////accepted_challenge Table//////////////////

var acceptRouter = express.Router();
console.log ("acceptRouter is set");

// A GET to the root of a resource returns a list of that resource
acceptRouter.get('/', function(req, res) {
  res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
  res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...

  var page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  var limit = parseInt(req.query.limit, 10);
  if (isNaN(limit)) {
    limit = 20;
  } else if (limit > 50) {
    limit = 50;
  } else if (limit < 1) {
    limit = 1;
  }

  var sql = 'SELECT count(1) FROM accepted_challenge';
  postgres.client.query(sql, function (err, result) {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      return res.json({
        errors: ['Could not retrieve accepted challenges!']
      });
    }

    var count = parseInt(result.rows[0].count, 10);
    var offset = (page - 1) * limit; //page - 1 * the limit so when we are on
    // page two the offset is 11.


    var sql = 'SELECT accepted_challenge.*, challenge.name as challenge FROM accepted_challenge, challenge WHERE accepted_challenge.c_id = challenge.c_id AND accepted_challenge.u_id = $3 OFFSET $1 LIMIT $2';
    postgres.client.query(sql, [offset, limit, req.user.id], function (err, result) {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        return res.json({
          errors: ['Could not retrieve accepted challenges']
        });
      }
      return res.json(result.rows);
    });
  });
});
// A POST to the root of a resource should create a new object
acceptRouter.post('/', function(req, res) {
  res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
  res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...

  console.log("the request is in post accepted", req.user);
  //console.log("the request is in post accepted 2", req.user.id);

  console.log("Post to /accepted is happening");
  var sql = 'INSERT INTO accepted_challenge (u_id, c_id) VALUES ($1, $2) RETURNING id';
  var data = [
    req.user.id,
    req.body.c_id
  ];


  console.log(data);
  postgres.client.query(sql, data, function (err, result) {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      return res.json({
        errors: ['Failed to create challenge']
      });
    }

    //consoles the id number we are at
    console.log('Insert result:', result.rows);
  });
});

//delete a challenge from the table... i dont want to delete i want to deactivate.

    app.use('/accepted', acceptRouter);

//////////////////////////////votes Table//////////////////

var voteRouter = express.Router();
console.log ("voteRouter is set");

// A GET to the root of a resource returns a list of that resource
voteRouter.get('/', function(req, res) {
  res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
  res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...
  var page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  var limit = parseInt(req.query.limit, 10);
  if (isNaN(limit)) {
    limit = 20;
  } else if (limit > 50) {
    limit = 50;
  } else if (limit < 1) {
    limit = 1;
  }

  var sql = 'SELECT count(1) FROM votes';
  postgres.client.query(sql, function (err, result) {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      return res.json({
        errors: ['Could not retrieve votes challenges!']
      });
    }

    var count = parseInt(result.rows[0].count, 10);
    var offset = (page - 1) * limit; //page - 1 * the limit so when we are on
    // page two the offset is 11.
    //var sql = 'SELECT accepted_challenge.*, challenge.name as challenge FROM accepted_challenge, challenge WHERE accepted_challenge.c_id = challenge.c_id AND accepted_challenge.u_id = $3 OFFSET $1 LIMIT $2';


    var sql = 'SELECT votes.*, photo.c_id as c_id FROM votes, photo WHERE votes.p_id = photo.id AND votes.u_id = $3 OFFSET $1 LIMIT $2';
    postgres.client.query(sql, [offset, limit, req.user.id], function (err, result) {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        return res.json({
          errors: ['Could not retrieve votes']
        });
      }
      return res.json(result.rows);
    });
  });
});
// A POST to the root of a resource should create a new object
voteRouter.post('/', function(req, res) {
  res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
  res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...

  console.log("the request is in post accepted", req.user);
  //console.log("the request is in post accepted 2", req.user.id);

  console.log("Post to /votes is happening");
  var sql = 'INSERT INTO votes (u_id, p_id, vote) VALUES ($1, $2, $3) RETURNING v_id';
  var data = [
    req.user.id,
    req.body.p_id,
    true
  ];


  console.log(data);
  postgres.client.query(sql, data, function (err, result) {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      return res.json({
        errors: ['Failed to create vote']
      });
    }

    //consoles the id number we are at
    console.log('Insert result:', result.rows);
  });
});
voteRouter.get('/:id', votes.lookupPhoto, function(req, res) {
  res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
  res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...
  res.json(req.vote);
});
app.use('/votes', voteRouter);







///////////////////////////////////user data/////////////////////////////


var userRouter = express.Router();
console.log ("userRouter is set");

// A GET to the root of a resource returns a list of that resource
userRouter.get('/', function(req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
    res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...
    var page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1){
        page = 1;
    }

    var limit = parseInt(req.query.limit, 10);
    if (isNaN(limit)){
        limit = 10;
    } else if (limit > 50){
        limit = 50;
    } else if (limit < 1) {
        limit = 1;
    }

    var sql = 'SELECT count(1) FROM users';
    postgres.client.query(sql, function(err, result) {
        if (err) {
            console.error(err);
            res.statusCode = 500;
            return res.json({
                errors: ['Could not retrieve photos']
            });
        }

        var count = parseInt(result.rows[0].count, 10);
        var offset = (page - 1) * limit; //page - 1 * the limit so when we are on
        // page two the offset is 11.

        sql = 'SELECT * FROM users OFFSET $1 LIMIT $2';
        postgres.client.query(sql, [offset, limit], function (err, result) {
            if (err) {
                console.error(err);
                res.statusCode = 500;
                return res.json({
                    errors: ['Could not retrieve users']
                });
            }
            return res.json(result.rows);
        });
    });
});
app.use('/users', userRouter);


//var albumRouter = express.Router();
//albumRouter.get('/', function(req, res) { });
//albumRouter.post('/', function(req, res) { });
//albumRouter.get('/:id', function(req, res) { });
//albumRouter.patch('/:id', function(req, res) { });
//albumRouter.delete('/:id', function(req, res) { });
//app.use('/album', albumRouter);

// routes ======================================================================
require('./lib/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport


module.exports = app;



