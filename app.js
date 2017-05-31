let app = new (require('koa'))(),
	router = require('koa-router')(),
	path = require('path'),
	co = require('co'),
	logger = require('koa-logger'),
	bodyParser = require('koa-bodyparser'),
	convert = require('koa-convert'),
	//session = require('koa-generic-session'),
	session = require('koa-session-redis'),
	render = require('koa-swig'),
	mongoose = require('mongoose'),
	passport  =require('koa-passport'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	LocalStrategy = require('passport-local').Strategy,
	User = require('./user-model')

/**
* https://console.developers.google.com
* Create app
* Create credentials
* Set urls (origin callback)
* Enable google+ API
**/

const googleClientID = 'xxxxxxxxxxxxxxx',
	googleClientSecret = 'xxxxxxxxxx',
	googleCallbackURL = 'http://localhost:3000/auth/google/callback'


app.use(logger());


app.use(bodyParser())

app.keys = ['937fiot4pd32n32845fmuuupv4eh4ew9hgcpu5wghki34']
app.use(session({
	store: {
		host:  '127.0.0.1',
		port:  6379,
		ttl: 60 * 60 * 24 * 14
	}
}, app))

// Whitout  Redis
//app.use(convert(session()))



/**
* Define passport strategies
 **/

 /** Local Strategy **/
passport.use(new LocalStrategy(
  function(username, password, done) {
  	let user = null

  	new Promise(function(resolve, reject){
  		resolve(User.getUserByEmail(username))

  	}).then(function(usr){
	   	if(!usr){
	   		
	   		return done(null, false, {message: 'Unknown User'});
	   	}else{
	   		user = usr
	   	}

	   	return User.comparePassword(password, user.password)

  	}).then(function(passwordMatch){

	   		if(passwordMatch){
	   			return done(null, user, {message: 'Login success'});
	   		} else {
	   			return done(null, false, {message: 'Invalid password'});
	   		}
  	}).catch(function(err){
  		console.log(err)
  	})
   
  }))

/** Google Strategy **/
passport.use(new GoogleStrategy({
    clientID: googleClientID,
    clientSecret: googleClientSecret,
    callbackURL: googleCallbackURL
  },
  function(accessToken, refreshToken, profile, done) {

   	new Promise(function(resolve, reject){

   		resolve(User.findOrCreate({ 
		   			googleId: profile.id, 
		   			email: profile.emails[0].value,
		   			publicName : profile.displayName,
		   			photo: profile.photos[0].value, 
		   			google_token: accessToken
		   		}))

 
   	}).then(function(user){

  		return done(null, user)
   	})

  }
))


passport.serializeUser(function(user, done) {
  done(null, user);
})

passport.deserializeUser(function(user, done) {
  done(null, user);
})


/**
* Initialize passport
**/
app.use(passport.initialize())
app.use(passport.session())


// swig config
app.context.render = co.wrap(render({
  root: path.join(__dirname, 'views'),
  autoescape: true,
  cache: 'memory', 

}))




router.get('/', async ctx => {
	
	ctx.body = await ctx.render('sign-in', {})
})

router.get('/home', async ctx => {

	ctx.body = await ctx.render('home', {user: ctx.passport.user})
})


router.post('/login', 
	passport.authenticate('local', {
		successRedirect: '/home', 
		failureRedirect: '/',
	}))

router.get('/google/',
  passport.authenticate('google', 
  	{ scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
  passport.authenticate('google', { 
  	successRedirect: '/home',
  	failureRedirect: '/' 
  }))


router.get('/logout', ctx => {
	
	ctx.session = null
	ctx.redirect('/')	
})

app.use(router.routes())
  .use(router.allowedMethods())


app.listen(3000, () => {
  console.log('Running app.js in port 3000');
})