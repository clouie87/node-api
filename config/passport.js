
var passport = require('passport'),
    LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var InstagramStrategy = require('passport-instagram').Strategy;

var postgres = require('./../lib/postgres');

var User = require('./../lib/models/user.js');

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        console.log('the user got serizalized');
        done(null, user.id);

    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        //console.log(id, ' is starting to be deserialized with passport.js');
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, email, password, done) {
            console.log('local signup is starting');

            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function (callback) {


                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                User.findOne(email, function (err, isNotAvailable, user) {
                    //console.log('userfound: ' + isNotAvailable);
                    // if there are any errors, return the error
                    if (err) {
                        return done(err);
                    }

                    // check to see if theres already a user with that email
                    if (isNotAvailable == true) {
                        //console.log(user.email +' is not available');
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {
                        console.log('new local user');


                        // if there is no user with that email
                        User.save(req, function(userData){

                            return done(null, userData);
                        });


                        //newUser.password = newUser.generateHash(password);
                    }
                });

            });

        }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },

        function(req, email, password, done) { // callback with email and password from our form

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            //console.log("who is the user ",  User);
            console.log('the password we are checking is', password);
            User.localfindOne(email, password, function(err, returningUser, data, user) {
                // if there are any errors, return the error before anything else

                var user = data;
                console.log(user);
                if (err) {
                    return done(err);

                }
                // if no user is found, return the message
                if (!returningUser) {
                    //res.json({
                    //  status: false,
                    //  message: 'this is not right'
                    //});
                  //return done('there is an error'); debugging
                    return done(null, false, {'message': 'No user found.', status: false}); // req.flash is the way to set flashdata using connect-flash
                }
                // if the user is found but the password is wrong
                if (returningUser === true && req.body.password !== password) {
                    console.log('the user is found but the password does not match!');
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
                }
                // all is well, return successful user
                else {
                    console.log('the user', user, 'should go to profile!');
                    return done(null, user);
                }
            });

        }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({
            // pull in our app id and secret from our auth.js file
            clientID        : '813365472032554',
            clientSecret    : 'f32ed4d4b39008a290686ae744f88c8f',
            callbackURL     : 'http://clouie.ca/auth/facebook/callback'

        },

        // facebook will send back the token and profile
        function(req, token, refreshToken, profile, done) {
            console.log('facebook login is starting');
            //console.log(profile);

            var id  = profile.id; // set the users facebook id
            var token = token; // we will save the token that facebook provides to the user
            var name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
            var email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first


            console.log(name, email, id);
            // asynchronous
            process.nextTick(function(callback) {

                // find the user in the database based on their facebook id
                User.snfindOne(id, function(err, returningUser, data, user) {
                    console.log(data);

                    user = data;
                    console.log(data +'is found');

                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);

                    // if the user is found, then log them in
                    if (returningUser === true) {
                        //console.log(data);
                        console.log(returningUser);

                        console.log('already a fb member '+ data);
                        return done(null, user); // user found, return that user
                    } else {
                        //if there is no user found with that facebook id, create them

                        // set all of the facebook information in our user model

                        var account_type = profile.provider;
                        var id  = (profile.id); // set the users facebook id
                        var token = token; // we will save the token that facebook provides to the user
                        var name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                        var email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                        console.log(token, name, email, id);

                        data = [
                            name,
                            email,
                            token,
                            account_type,
                            null,
                            id

                        ];


                        // save our user to the database
                        User.fbsave(data, req, function(userData){
                            console.log('the user is being saved', userData);

                            return done(null, userData);
                        });


                    }

                });
            });

        }));

    // =========================================================================
    // INSTAGRAM ================================================================
    // =========================================================================
    passport.use(new InstagramStrategy({

            // pull in our app id and secret from our auth.js file
            clientID        : '76f69ff2e0564fce894b6ab73de814a1',
            clientSecret    : '45b2298dd368416b996a1f19625c7eb9',
            callbackURL     : 'http://clouie.ca/auth/instagram/callback'

        },

        // facebook will send back the token and profile
        function(req, token, refreshToken, profile, done) {
            console.log('instagram login is starting');
            //console.log(profile);




            var id  = profile.id; // set the users facebook id
            //var token = token; // we will save the token that facebook provides to the user
            var name  = profile.displayName; // look at the passport user profile to see how names are returned
            //var email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first


            console.log('name: ', name,'id: ', id);
            // asynchronous
            process.nextTick(function(callback) {

                // find the user in the database based on their facebook id

                User.snfindOne(id, function(err, returningUser, data, user) {
                    console.log(data);

                    user = data;
                    console.log(user +'is found');

                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);

                    // if the user is found, then log them in
                    if (returningUser === true) {
                        //console.log(data);
                        console.log(returningUser);

                        console.log('already a insta member '+ data);
                        return done(null, user); // user found, return that user

                    } else {
                        var account_type = profile.provider;
                        var id  = (profile.id); // set the users facebook id
                        var token = token; // we will save the token that facebook provides to the user
                        var name  = profile.displayName; // look at the passport user profile to see how names are returned
                        //var email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                        console.log(token, name, id);

                        data = [
                            name,
                            null,
                            token,
                            account_type,
                            null,
                            id

                        ];
                        // save our user to the database
                        User.instasave(data, req, function(userData){

                            return done(null, userData);
                        });


                    }

                });
            });

        }));

};
