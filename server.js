var app = require('express')()
var path = require('path')

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/index.html'))
})

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, req.path))
})

app.listen(process.env.PORT || 3000)

process.on('uncaughtException', function (err) {
  console.log(err.stack)
})
