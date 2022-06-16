const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const PORT = 8080;  // Default port

// Adding body-parser to app to make POST data readable from Buffer
app.use(bodyParser.urlencoded({extended: true}));

// Adding cookie-parser to read in our login information
app.use(cookieParser());

// Adding http request logger to app
app.use(morgan('dev'));

// Use EJS as Express app's templating engine
app.set('view engine', 'ejs');

// Test "database" for storing or retrieving shortened URLs
const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

// Test "database" for storing or retrieving user login credentials
const users = {
  'f8Sm3K': {
    id: 'f8Sm3K',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  '2HxL3A': {
    id: '2HxL3A',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

// Response to first page
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// Response to user entering a username and clicking Login
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// Response to user clicking Logout
app.post('/logout', (req, res) => {
  res.clearCookie('username', req.body.username);
  res.redirect('/urls');
});

// Response to user navigating to /register
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render('register', templateVars);
});

// Response to user submitting email/password when registering
app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  const newEmail = req.body.email;
  const newPassword = req.body.password;

  if (newEmail === '' || newPassword === '') {
    res.status(400);
    res.send('<html><h2>Error 400</h2><p>Empty email or password</p></html>');
  } else if (checkForExistingEmail(newEmail, users)) {
    res.status(400);
    res.send('<html><h2>Error 400</h2><p>Email already registered</p></html>');
  } else {
    users[newUserID] = { id: newUserID, email: newEmail, password: newPassword };
    res.cookie('user_id', newUserID);
    res.redirect('/urls');
  }

});

// TESTING PURPOSES TO SEE DATABASES
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
app.get('/users.json', (req, res) => {
  res.json(users);
});

// Response to /urls which sends urlDatabase to urls_index to be rendered on page
app.get('/urls', (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

// Response to user pressing Delete button for specific URL
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// Response to POST request to update shortURL with a newly given longURL
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL] = newLongURL;
  res.redirect('/urls');
});

// Response to POST request from /urls/new. We get longURL as object in req.body thanks to body-parser
// Saving new generated random shortURL key in urlDatabase with user's longURL value
app.post('/urls', (req, res) => {
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

// Response to /urls/new for POST requests from users of URLs to shorten
// Place above /urls/:shortURL as route order matters
app.get('/urls/new', (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render('urls_new', templateVars);
});

// Response to (for example) /url/a8tKA2G where a8tKA2G is route parameter found in req.params
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = {
    user: users[req.cookies['user_id']],
    shortURL,
    longURL: urlDatabase[shortURL] };
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
  console.log(`Listening on port ${PORT}`);
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

// Checks if user-submitted newEmail already exists in users object
const checkForExistingEmail = function(email, data) {
  for (const key in data) {
    if (data[key].email === email) {
      return true;
    }
  }
  return false;
};