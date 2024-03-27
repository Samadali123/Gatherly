var express = require('express');
var router = express.Router();
const userModel = require(`./users`);
const passport = require('passport');
const localStrategy = require(`passport-local`);


passport.use(new localStrategy(userModel.authenticate()))

/* GET home page. */
router.get('/', function(req, res, next) {

    res.render('index');

});


router.get(`/login`, function(req, res) {

    const error = req.flash('error');

    res.render('login', { error });
})


router.get(`/profile`, isloggedIn, function(req, res) {
    const loggedinuser = req.user;
    res.render(`profile`, { loggedinuser })

})



router.post('/register', async(req, res, next) => {
    const { username, number, password } = req.body;

    if (!username || !number || !password) {
        return res.status(401).json({ success: false, message: "Please fill the details" })
    }


    try {
        var newUser = {
            //user data here
            username: username,
            number: number,
            //user data here
        };

        const User = await userModel.findOne({ username: username });
        if (User) {
            return res.status(401).json({ success: false, message: "User already registered" });
        }


        userModel
            .register(newUser, password)
            .then((result) => {
                passport.authenticate('local')(req, res, () => {
                    //destination after user register
                    res.redirect('/profile');
                });
            })
            .catch((err) => {
                res.send(err);
            });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});



router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true,
    }),
    (req, res, next) => {}
);


function isloggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    else res.redirect('/login');
}


router.get('/logout', (req, res, next) => {
    if (req.isAuthenticated())
        req.logout((err) => {
            if (err) res.send(err);
            else res.redirect('/login');
        });
    else {
        res.redirect('/');
    }
});





module.exports = router;