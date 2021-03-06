var mongoose = require('mongoose')
  , util = require('nserver-util')

mongoose.connect('mongodb://localhost/nrecipe')

function fetch (Model, config, callback) {
  var callbacks = 0
    , response = { success: true }
    , sortInfo = {}
  sortInfo[config.sort] = config.dir

  Model.find( config.query ? {name: config.query} : {}
            , []
            , { skip: config.start
              , limit: config.limit
              , sort: sortInfo
              }
            , function (err, result) {
                response.rows = result
                respond(err)
              }
            )

  Model.count({}, function (err, result) {
    response.totalcount = result
    respond(err)
  } )

  function respond(err) {
    if (err != null) {
      console.log(err)
      callbacks = 2
      response = { success    : false
                 , rows       : []
                 , totalcount : 0
                 }
    }
    callbacks++
    if (callbacks == 2) {
      callback(response)
    }
  }
}

function save (Model, doc, callback) {
  if (doc._id == null || doc._id == '') {
    delete doc._id
    var instance = new Model(doc)
    instance.save(function (err) { callback(err) } )
  }
  else {
    Model.findById(doc._id, function(err, d) {
      delete doc._id
      if (d == undefined) {
        var instance = new Model(doc)
        instance.save(function (err) { callback(err) } )
      }
      else {
        util.apply(d,doc)
        d.save(function (err) { callback(err) } )
      }
    } )
  }
}

function remove (Model, id, callback) {
  Model.findById(id, function(err, d) {
    if (d == undefined) {
      callback(err)
    }
    else {
      d.remove(function (err) { callback(err) } )
    }
  } )
}

module.exports = { fetch: fetch
                 , save: save
                 , remove: remove
                 , mongoose: mongoose
                 }
