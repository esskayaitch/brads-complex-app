const mongodb = require('mongodb')

const connectionString = 'mongodb+srv://todoApp1User:CwITI5RZBEDYlPiI@cluster0.dhphq.mongodb.net/OurComplexity?retryWrites=true&w=majority'

mongodb.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
  module.exports = client.db()
  const app = require('./app')
  app.listen(3003)
}) 

