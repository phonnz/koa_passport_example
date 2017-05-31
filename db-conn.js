'use strict';

const mongoose 					= require('mongoose')

exports.dbConnection = mongoose.createConnection('mongodb://localhost:27017/passport',
    {
      	
    })
