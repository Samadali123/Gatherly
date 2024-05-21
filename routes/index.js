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
    res.render('login', );
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
            return res.status(401).render("user");
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
        return res.status(500).render("server");
    }
});


router.get("/loginError", (req, res, next) => {
    res.render("loginError")
})


router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/loginError',
        failureFlash: true,
    }),
    (req, res, next) => {}
);


function isloggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    else res.redirect('/unauthorized');
}

router.get("/unauthorized", (req, res, next) => {
    res.render("pleaselogin")
})

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