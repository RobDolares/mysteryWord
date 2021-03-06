const express = require('express');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const fs = require('fs');
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");
const morgan = require('morgan');
const expressValidator = require('express-validator');
const session = require('express-session');

const app = express();

// tell express to use handlebars
app.engine('handlebars', handlebars());
app.set('views', './views');
app.set('view engine', 'handlebars');

// configure session support middleware with express-session
app.use(
  session({
    secret: 'password', // this is a password. make it unique
    resave: false, // don't resave the session into memory if it hasn't changed
    saveUninitialized: true // always create a session, even if we're not storing anything in it.
  })
);

// setup morgan for logging requests
// put above other stuff to log static resources
app.use(morgan('dev'));

// tell express how to serve static files
app.use(express.static('public'));

//tell express to use the bodyParser middleware to parse form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// add express-validator middleware. This adds the checkBody() and presumably
// other methods to the req.
app.use(expressValidator());

// this middleware creates a default session

app.use((req, res, next) => {
  if (!req.session.word) {
    req.session.word = [];
  }
  console.log(req.session);
  next();
});

let word;
let wordArray;
let emptyArray = [];//empty array for initial setup
let spentCharArray = [];
let remTurns = 8;

// word = words[Math.floor(Math.random() * words.length)]; //selects random word from library
// let wordArray = (word.toUpperCase()).split(""); //splits random word into array
// let emptyArray = []; //empty array for initial setup
// for (var i = 0; i < word.length; i++) {
//   emptyArray.push("_"); //creates empty array of same length as word
// }
// let spentCharArray = [];
// console.log(wordArray);

// configure the webroot and set emptyArray of word.length
app.get('/', function(req, res) {
  if (req.session.word.length === 0) {
    word = words[Math.floor(Math.random() * words.length)]; //selects random word from library
    wordArray = (word.toUpperCase()).split(""); //splits random word into array
    req.session.word = wordArray;
    for (var i = 0; i < word.length; i++) {
      emptyArray.push("_"); //creates empty array of same length as word
    }
  }

  res.render('home', {
    emptyArray: emptyArray,
    remTurns: remTurns
  })
});

app.post("/charGuess", function(req, res) {

  let character = req.body.character.toUpperCase();

  req.checkBody('character', '- Please enter a character ').notEmpty();
  req.checkBody('character', '- Only 1 character allowed').len(1, 1);

  req.getValidationResult()

    .then((result) => {
      // do something with the validation result -
        // throw error method:
    if (!result.isEmpty()) {
      throw new Error(result.array().map((item) => item.msg).join(' - '));
        } else if (spentCharArray.includes(character)) {
        throw new Error('Letter has already been guessed');
      } else {
        console.log('No errors')
      }
    })

    .then(() => {
      //if guessed letter is present run this block:
      if (wordArray.includes(character)) {
        if (!spentCharArray.includes(character)) {
          spentCharArray.push(character);
        }
        for (var i = 0; i < wordArray.length; i++) {
          if (character === wordArray[i]) {
            emptyArray.splice(i, 1, character);
            console.log(emptyArray);
          }
        }
        //setup link to winpage
        if (wordArray.join("").toString() === emptyArray.join("").toString()) {
           return res.render('winner', {
            word: word
          });
        }
      }
      //if guessed letter is not present
      else {
        remTurns--;
        spentCharArray.push(character);
        if (remTurns === 0) {
          return res.render('loser', {
            word: word
          })
        }
      }
      res.render('home', {
        emptyArray: emptyArray,
        spentCharArray: spentCharArray,
        remTurns: remTurns
      });
    })

    .catch((error) => {
      res.render('home', {
        emptyArray: emptyArray,
        error: error,
        spentCharArray: spentCharArray,
        remTurns: remTurns
      });
    })
});

app.post('/reset', (req,res)=>{
  req.session.word = [];
    emptyArray = [];
    spentCharArray = [];
    remTurns = 8;
    res.redirect('/');
})


app.listen(3000, () => console.log('up and running'));
