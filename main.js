const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const app = express();
const exphbs = require('express-handlebars');
const path = require('path')

// Initialize Firebase
var firebase = require("firebase");
var firebaseConfig = {                      
    apiKey: "AIzaSyDie6CHWmBNSlGu4yr03Thmx9NsbcD7vBs",
    authDomain: "classum-assignment.firebaseapp.com",
    databaseURL: "https://classum-assignment.firebaseio.com",
    projectId: "classum-assignment",
    storageBucket: "classum-assignment.appspot.com",
    messagingSenderId: "878870176500",
    appId: "1:878870176500:web:fd44e4ee0acd679c3bb4a1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// View Engine
app.use(express.static('views/')); 
app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

// body-parser (Middleware)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({urlencoded : false}));
app.use(logger('dev'));

var port = 8080;

function check_email(email){
    return db.collection('coupon').where('email', '==', email).get();
}

function GenerateCode() {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i<16; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date) {
    return date.getFullYear() + '년 ' + 
      (date.getMonth() + 1) + '월 ' + 
      date.getDate() + '일 ' + 
      date.getHours() + '시 ' + 
      date.getMinutes() + '분';
}

app.get('/', function(req, res, next) {
    res.render('makecoupon');
}) 

app.post('/coupon/generate', function(req, res, next) {

    let email = req.body.email;
    check_email(email).then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            if (doc.data().email === email){
                res.render('makecoupon', {
                    error: "This email has already created coupon.",
                    coupon : doc.data()
                })
                return;
            }
        });

        var coupon = {
            email : email,
            code : GenerateCode(),
            creation_date : new Date(current_date),
            expired_date : new Date(end_date),
            used : false,
        }

        if (querySnapshot.empty) {

            var current_date = new Date().getTime();
            var end_date = addDays(current_date, 3);
            db.collection('coupon').add({
                email : coupon.email,
                code : coupon.code,
                creation_date : formatDate(coupon.creation_date),
                expired_date : formatDate(coupon.expired_date),
                expired_date_inTimeStamp : coupon.end_date,
                used : false
            })

            res.render('makecoupon', {
                error: "You can use your coupon !",
            })
            return;
        }
    });
});

app.get('/shop', function(req, res, next) {
    res.render('checkcoupon');
});

app.get('/coupon/search', function(req, res, next) {
    res.render('searchcoupon');
})

app.post('/coupon/search/', function(req, res, next) {
    let email = req.body.email;
    check_email(email).then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            if (doc.data().email === email){
                res.render('details', {
                    coupon : doc.data()
                })
            };
        });
        if (querySnapshot.empty) {
           res.render('makecoupon', {
               error : 'There is no coupon made by your email.'
           });
        }
    });
})

app.post('/coupon/check', function(req, res, next) {
    let email = req.body.email;
    var date = new Date().getTime();
    check_email(email).then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            if (doc.data().email === email){
                // console.log(doc.id);
                if (doc.data().expired_date_inTimeStamp.seconds * 1000 < date || doc.data().used === true ) {
                    db.collection('coupon').doc(doc.id).update({ used : true });
                    res.render('makecoupon', {
                        error : 'Your Coupon is expired.'
                    });
                } 
                else {
                    res.render('usecoupon', {
                        coupon : doc.data()
                })};  
            };
        });
        if (querySnapshot.empty) {
           res.render('makecoupon', {
               error : 'You have to create coupon.'
           });
        }
    });
});

app.post('/coupon/delete/:email', function(req, res, next){
    
    let email = req.params.email;

    check_email(email).then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            if (doc.data().email === email){
                db.collection('coupon').doc(doc.id).delete();
            };
        });
    });
    res.redirect('/');
  });

app.listen(port, function(){
    console.log('App running on port ' + port)
});