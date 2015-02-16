var postgres = require('./../postgres');

//need to define User object//

var User = exports;

User.fbsave = function(data, req, callback) {

        console.log('saving the new User');

        var sql = 'INSERT INTO users(name, email, password, account_type, profile_id, token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING u_id';


        console.log(data);
        postgres.client.query(sql, data, function(err, result){
            if (err) {
                console.error('error in adding new user', err);

            }

            //consoles the id number we are at
            console.log('Insert result:', result.rows);


            console.log("checked", data);
            //req.User = results.rows[0];

            //next();
            var userData= {
                id: result.rows[0].u_id
            };

            console.log(userData);
            callback(userData);
        });

    };

User.instasave = function(data, req, callback) {

    console.log('saving the new User');


    var sql = 'INSERT INTO users(name, email, password, account_type, profile_id, token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING u_id';

    console.log(data);
    postgres.client.query(sql, data, function(err, result){
        if (err) {
            console.error('error in adding new user', err);

        }

        //consoles the id number we are at
        console.log('Insert result:', result.rows);


        console.log("checked", data);
        //req.User = results.rows[0];

        //next();
        var userData= {
            id: result.rows[0].u_id
        };
        callback(userData);
    });

};

User.save = function(req, callback) {
    console.log('saving the new User');


    var email = req.body.email;
    var password = req.body.password;

    //User.facebook.id    = profile.id; // set the users facebook id
    //var token = token; // we will save the token that facebook provides to the user
    //User.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
    //var email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first


    console.log( email, password);

    var local = 'local';

    var sql = 'INSERT INTO users(email, password, account_type) VALUES ($1, $2, $3) RETURNING u_id';
    var data = [
        req.body.email,
        req.body.password,
        local
    ];

    console.log(data);
    postgres.client.query(sql, data, function(err, result){
        if (err) {
            console.error('error in adding new user', err);

        }

        //consoles the id number we are at
        console.log('Insert result:', result.rows);
        console.log(User);

    console.log("checked", data);
    //req.User = results.rows[0];

    //next();
    var userData= {
        id: result.rows[0].u_id
    };
    callback(userData);
    });

};

//needd to create a userData id with name, email pass etc. for each time we find one
//because it is no longer defined with this.email etc etc
User.localfindOne = function(email, password, callback) {

    var returningUser = false; //we are assuming the email is taking

    //console.log(password);
    console.log(email + ' is in the findOne function test');
    //check if there is a user available for this email;
    var sql = 'SELECT * FROM users WHERE email = $1 AND password = $2';
    var data = [
        email,
        password
    ];

    console.log(password);
    postgres.client.query(sql, data, function (err, result) {
        if (err) {
            console.error(err);
            return callback(err, returningUser, this);
        }
        if (result.rows.length > 0) {
            returningUser = true; // update the user for return in callback
            ///email = email;
            //password = result.rows[0].password;
            console.log(email + ' is found in the database!');
        }
        else {
            returningUser = false;
            //email = email;
            console.log(email + ' is available');
        }
        return callback(false, returningUser, this);
    });
};

User.findOne = function(email, callback) {

    var isNotAvailable = false; //we are assuming the email is taking

    console.log(email + ' is in the findOne function test');
    //check if there is a user available for this email;
    var sql = 'SELECT * FROM users WHERE email = $1';
    var data = [
        email
    ];

    console.log(data);
    postgres.client.query(sql, data, function (err, result) {
        if (err) {
            console.error(err);
            return callback(err, isNotAvailable, this);
        }
        if (result.rows.length > 0) {
            isNotAvailable = true; // update the user for return in callback
            ///email = email;
            //password = result.rows[0].password;
            console.log(email + ' is found in the database!');
        }
        else {
            isNotAvailable = false;
            //email = email;
            console.log(email + ' is available');
        }
        return callback(false, isNotAvailable, this);
    });
};

User.snfindOne = function(email, callback) {

    var sql = 'SELECT * FROM users WHERE token = $1';
    var data = [
        email
    ];


    console.log(data);
    postgres.client.query(sql, data, function (err, result) {
        if (err) {
            console.error(err);
        }


        console.log(id + ' is found in the database');


        var user = {

            id: result.rows[0].u_id,
            name: result.rows[0].name,
            email: result.rows[0].email,
            account: result.rows[0].account_type,
            password: result.rows[0].password

        };

        console.log(user);
        callback(false, user);
    });

};



User.findById = function(id, callback){
    console.log('finding the user to deserialize');

    var sql = 'SELECT * FROM users WHERE u_id = $1';
    var data = [
       id
    ];


    console.log(data);
    postgres.client.query(sql, data, function (err, result) {
        if (err) {
            console.error(err);
        }


        console.log(id + ' is found to be deserialized');


        var user = {

            id: result.rows[0].u_id,
            name: result.rows[0].name,
            email: result.rows[0].email,
            account: result.rows[0].account_type,
            password: result.rows[0].password

        };

        console.log(user);
        callback(false, user);
    });
};


User.query = function(callback){

};


//module.exports = ('User', User);