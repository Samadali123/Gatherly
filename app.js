var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressSession = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var userModel = require(`./routes/users`);
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const flash = require(`connect-flash`);

require("dotenv").config()



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "syed samad ali",
}))

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

app.use(flash())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.all("*", function(req, res) {
    res.status(404).render("error");
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});



async function clearSockets() {
    var allUser = await userModel.find({})
    await Promise.all(
        allUser.map(async user => {
            user.socketId = ''
            await user.save()
        })
    )
}
clearSockets()

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;