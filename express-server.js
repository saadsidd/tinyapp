const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const PORT = 8080;  // Default port

// Adding body-parser to app to make POST data readable from Buffer
app.use(bodyParser.urlencoded({extended: true}));

// Adding http request logger to app
app.use(morgan('dev'));

// Use EJS as Express app's templating engine
app.set('view engine', 'ejs');

// Test "database" for storing or retrieving shortened URLs
const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

// Response to first page
app.get('/', (req, res) => {
  res.send('Hello!');
});

// Response to /urls.json which sends urlDatabase object
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// Response to /hello which sends some html
app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

// Response to /urls which sends urlDatabase to urls_index to be rendered on page
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// Response to POST request from /urls/new. We get longURL as object in req.body thanks to body-parser
// Saving new generated random shortURL key in urlDatabase with user's longURL value
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

// Response to /urls/new for POST requests from users of URLs to shorten
// Place above /urls/:shortURL as route order matters
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

// Response to (for example) /url/a8tKA2G where a8tKA2G is route parameter found in req.params
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { shortURL, longURL: urlDatabase[shortURL] };
  res.render('urls_show', templateVars);
});

// Redirect user back to longURL when shortURL is clicked on after generating it
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// Start listening at port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

// Generates a random 6 character alphanumeric string
const generateRandomString = function() {

  const chars = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    1, 2, 3, 4, 5, 6, 7, 8, 9, 0
  ];

  let shortURL = '';

  for (let i = 0; i < 6; i++) {
    const lowerUpperOrNum = Math.random();

    if (lowerUpperOrNum < 0.3) {
      // Get a lowercase letter
      shortURL += chars[Math.floor(Math.random() * 26)];
    } else if (lowerUpperOrNum >= 0.3 && lowerUpperOrNum < 0.6) {
      // Get an uppercase letter
      shortURL += chars[Math.floor(Math.random() * 26 + 26)];
    } else {
      // Get a number
      shortURL += chars[Math.floor(Math.random() * 10 + 52)];
    }
  }

  return shortURL;
};