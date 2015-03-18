var postgres = require('./postgres');


module.exports = function(app, passport) {
// =====================================
// HOME PAGE (with login links) ========
// =====================================

    app.all('/signup', function(req, res){
        //res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
        //res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...

    });

    app.get('/', function (req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

// =====================================
// LOGIN ===============================
// =====================================
// show the login form
    app.get('/login', function (req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', {message: req.flash('loginMessage')});
    });

// process the login form
// app.post('/login', do all our passport stuff here);
// process the login form
    app.post('/login', passport.authenticate('local-login', {
      //res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
      //res.header("Access-Control-Allow-Headers", "X-Requested-With");//make
      //  successRedirect: 'http://localhost:8100/#/tab/dash', // redirect to the secure profile section
        failureRedirect: 'http://localhost:8100/#/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

// =====================================
// SIGNUP ==============================
// =====================================
// show the signup form
    app.get('/signup', function (req, res) {
        //res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
        //res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

// process the signup form
// app.post('/signup', do all our passport stuff here);
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

// =====================================
// PROFILE SECTION =====================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
    app.get('http://localhost:8100/#/tab-dash', isLoggedIn, function(req, res) {
      res.header("Access-Control-Allow-Origin", "http://localhost:8100");//set cross domain so localhost:8100 can access clouie.ca
      res.header("Access-Control-Allow-Headers", "X-Requested-With");//make it so allow headers with x request. Without it we get similar error: "XMLHttpRequest cannot load http://...

      console.log("in profile page");
        var sql = 'SELECT * FROM photo WHERE u_id = $1';
        postgres.client.query(sql, [req.user.id], function (err, results) {
            if (err) {
                console.error(err);
                res.statusCode = 500;
                return res.json({errors: ['Could not retrieve photo']});
            }


            //res.render('profile.ejs', {
            //    user: req.user, // get the user out of session and pass to template
            //    photos: results.rows
            //});
        });
    });
// =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));

    // =====================================
    // INSTAGRAM ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/instagram',
        passport.authenticate('instagram'));


    // handle the callback after facebook has authenticated the user
    app.get('/auth/instagram/callback',
        passport.authenticate('instagram', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));
        //function(req, res) {
        //    // Successful authentication, redirect home.
        //    res.redirect('/');
        //});

// =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, user) {
    console.log("isloggedinfunction");

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
      return res.json({
        'loginstatus' : 'success',
        'userid' : user.id
      })

    // if they aren't redirect them to the home page
    res.redirect('/');
}
