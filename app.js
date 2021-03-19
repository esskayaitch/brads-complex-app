let express = require ('express')
const app = express()

app.use(express.static('public'))
app.set('views', 'views') // where views are stored
app.set('view engine', 'ejs') // name of view engine

app.get('/', function(req,res) {
  res.render("home-guest")
})


app.listen(3003)
