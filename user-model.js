'use strict';

let mongoose            = require('mongoose'),
    db                  = require('./db-conn').dbConnection,
    Promise             = require('bluebird'),
    bcrypt              = require('bcrypt')

mongoose.Promise = Promise


let Schema = mongoose.Schema



let userSchema = Schema({
  googleId                      : { type: String, },
  email                         : { type: String, required : true, index: true },
  password                      : { type: String, },
  google_token                  : { type: String },
  photoUrl                      : { type: String },
  created                       : { type: Date, default: Date.now },
  updated                       : { type: Date, default: Date.now },
  
})


userSchema.static('Exists', function(user, callback){
  return this.findOne({email:user.email}, function(err, doc){
    if(err) console.log(err)
    
    if(doc === null){      
      return false
    }else{
      return true
    }

  })
})

let User = db.model('user', userSchema);

module.exports = User


module.exports.createUser = function(newUser, callback){
  bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(newUser.password, salt, function(err, hash) {
          newUser.password = hash;
          newUser.save(callback);
      });
  });
}

module.exports.getUserByEmail = function(email){ 
  
  return User.findOne({email: email})
  .then(user => {

    return user
  })
}

module.exports.getUserById = function(id, callback){
  User.findById(id, callback);
}


module.exports.comparePassword = function(candidatePassword, hash){

  var q = new Promise(function (resolve, reject) {
    bcrypt.compare(candidatePassword, hash, function (err, res) {
      if (err) { return reject(err) }

      resolve(res)
    })
  })

  return q
}

module.exports.findOrCreate = function(user){

  return this.findOne({email: user.email})
  .then( doc => {
    return doc || Promise.props({
          googleId: user.googleId,
          email: user.email,
          publicName: user.publicName,
          photoUrl: user.photo,
          google_token: user.google_token,
        }).then(function(newuser){
          
          return new User(newuser).save()
      })

  })

}