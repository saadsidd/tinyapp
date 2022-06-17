const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const PORT = 8080;  // Default port

// Adding body-parser to app to make POST data readable from Buffer
app.use(bodyParser.urlencoded({extended: true}));

// Adding cookie-session to encrypt as well as read in our user_id cookie
app.use(cookieSession({ name: 'user_id', keys: ['mykey5023', 'yourkey0692', 'ourkey1047'] }));

// Adding http request logger to app
app.use(morgan('dev'));

// Use EJS as Express app's templating engine
app.set('view engine', 'ejs');

// Test "database" for storing or retrieving shortened URLs associated with specific users
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "f8Sm3K"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

// Test "database" for storing or retrieving user login credentials
const users = {
  'f8Sm3K': {
    id: 'f8Sm3K',
    email: 'user@example.com',
    password: 'purple-monkey'
  },
  '2HxL3A': {
    id: '2HxL3A',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  },
  'aJ48lW': {
    id: 'aJ48lW',
    email: 'asdf@asdf',
    password: 'asdf'
  }
};

// TESTING PURPOSES TO SEE DATABASES
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
app.get('/users.json', (req, res) => {
  res.json(users);
});

// Response to first page
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Response to /login
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render('login', templateVars);
});

// Response to user entering an email and clicking Login
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const existingEmailId = getUserByEmail(email, users);

  if (!existingEmailId) {
    res.status(403);
    res.send('<html><h2>Error 403</h2><p>Email not found</p></html>');
  } else if (!bcrypt.compareSync(password, users[existingEmailId].password)) {
    res.status(403);
    res.send('<html><h2>Error 403</h2><p>Password does not match</p></html>');
  } else {
    req.session.user_id = existingEmailId;
    res.redirect('/urls');
  }
});

// Response to user clicking Logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// Response to user navigating to /register
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render('register', templateVars);
});

// Response to user submitting email/password when registering
app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const existingEmailId = getUserByEmail(newEmail, users);

  if (newEmail === '' || newPassword === '') {
    res.status(400);
    res.send('<html><h2>Error 400</h2><p>Empty email or password</p></html>');
  } else if (existingEmailId) {
    res.status(400);
    res.send('<html><h2>Error 400</h2><p>Email already registered</p></html>');
  } else {
    users[newUserID] = { id: newUserID, email: newEmail, password: bcrypt.hashSync(newPassword, 10) };
    req.session.user_id = newUserID;
    res.redirect('/urls');
  }

});

// Response to /urls which sends urlDatabase to urls_index to be rendered on page
app.get('/urls', (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    res.status(403);
    res.send('<html><h2>Error 403</h2><p>User must be logged in</p></html>');
  } else {
    const templateVars = {
      user: users[userID],
      urls: urlsForUser(userID)
    };
    res.render('urls_index', templateVars);
  }
});

// Response to user pressing Delete button for specific URL
app.post('/urls/:shortURL/delete', (req, res) => {
  if (!req.session.user_id) {
    res.status(403);
    res.send('<html><h2>Error 403</h2><p>User must be logged in</p></html>');
  } else {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});

// Response to POST request to update shortURL with a newly given longURL
app.post('/urls/:shortURL', (req, res) => {
  if (!req.session.user_id) {
    res.status(403);
    res.send('<html><h2>Error 403</h2><p>User must be logged in</p></html>');
  } else {
    const shortURL = req.params.shortURL;
    const newLongURL = req.body.longURL;
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect('/urls');
  }
});

// Response to POST request from /urls/new. We get longURL as object in req.body thanks to body-parser
// Saving new generated random shortURL key in urlDatabase with user's longURL and login ID
app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    res.status(403);
    res.send('<html><h2>Error 403</h2><p>User must be logged in</p></html>');
  } else {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.session.user_id};
    res.redirect(`/urls/${newShortURL}`);
  }
});

// Response to /urls/new for POST requests from users of URLs to shorten
// Place above /urls/:shortURL as route order matters
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render('urls_new', templateVars);
  }
});

// Response to (for example) /url/a8tKA2G where a8tKA2G is route parameter found in req.params
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;

  if (!urlDatabase[shortURL]) {
    res.status(404);
    res.send('<html><h2>Error 404</h2><p>Page not found</p></html>');
  } else if (!userID) {
    res.status(403);
    res.send('<html><h2>Error 403</h2><p>User must be logged in</p></html>');
  } else if (urlDatabase[shortURL].userID !== userID) {
    res.status(403);
    res.send('<html><h2>Error 403</h2><p>Incorrect user</p></html>');
  } else {
    const templateVars = {
      user: users[userID],
      shortURL,
      longURL: urlDatabase[shortURL].longURL
    };
    res.render('urls_show', templateVars);
  }
});

// Redirect user to longURL when shortURL is clicked on after generating it
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status(400);
    res.send(`<html><h2>Error 400</h2><p>Unable to redirect to ${shortURL}</p></html>`);
  } else {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  }
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

  let randomString = '';

  for (let i = 0; i < 6; i++) {
    const lowerUpperOrNum = Math.random();

    if (lowerUpperOrNum < 0.3) {
      // Get a lowercase letter
      randomString += chars[Math.floor(Math.random() * 26)];
    } else if (lowerUpperOrNum >= 0.3 && lowerUpperOrNum < 0.6) {
      // Get an uppercase letter
      randomString += chars[Math.floor(Math.random() * 26 + 26)];
    } else {
      // Get a number
      randomString += chars[Math.floor(Math.random() * 10 + 52)];
    }
  }

  return randomString;
};

// Checks if email matches in users database, and returns the id if it does
const getUserByEmail = function(email, data) {
  for (const key in data) {
    if (data[key].email === email) {
      return key;
    }
  }
  return false;
};

const urlsForUser = function(id) {
  const filteredUrlDatabase = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredUrlDatabase[url] = urlDatabase[url];
    }
  }
  return filteredUrlDatabase;
};