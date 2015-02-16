var assert = require('assert');
var request = require('supertest');

var app = require('../index');

var pg = require('../lib/postgres');
var DATABASE_URL ="postgres://carolinelouie@localhost/api";


describe('Tutorial REST API', function(){
    before(function(done){
        pg.initialize(DATABASE_URL, done);
    });

    describe('Create photo', function() {
        it('returns the created resource on success', function (done) {

            var validPhotoResource = {
                description: 'Photo created on ' + Date.now(),
                filepath: '/path/to/photo.jpg',
                album_id: 1
            };

            request(app)
                .post('/photo')
                .attach('photo', __dirname + '/testphoto.jpg')
                .field('description', validPhotoResource.description)
                .field('album_id', validPhotoResource.album_id)
                .expect(201)
                .end(function (err, res) {
                    console.log(res);
                    if (err) {
                        return done(err);
                    }

                    assert.equal(res.body.description, validPhotoResource.description);
                    assert.equal(res.body.album_id, validPhotoResource.album_id);
                    assert.ok(res.body.filepath.indexOf('uploads/testphoto_')===0);
                    done();
                });
        });
        it('returns 400 with no description', function (done) {

            var validPhotoResource = {
                filepath: '/path/to/photo.jpg',
                album_id: 1
            };

            request(app)
                .post('/photo')
                .attach('photo', __dirname + '/testphoto.jpg')

                .field('album_id', validPhotoResource.album_id)
                .expect(400)
                .end(function (err, res) {
                    console.log(res);
                    if (err) {
                        return done(err);
                    }

                   assert.equal(res.body.errors[0], 'Invalid description')
                    done();
                });
        });
    });
});