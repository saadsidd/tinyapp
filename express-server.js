const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');

const { getUserByEmail, getUrlsForUser, generateRandomString, sendResError } = require('./helpers');
const PORT = 8080;  // Default port

// Middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({ name: 'user_id', keys: ['mykey5023', 'yourkey0692', 'ourkey1047'] }));
app.use(morgan('dev'));

app.set('view engine', 'ejs');

// Database for storing/retrieving shortened URLs associated with specific users
const urlDatabase = {};

// Database for storing/retrieving user login credentials
const users = {};

// If logged in go to /urls, otherwise /login
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// Render urls_index with user's saved URLs
// Error if not logged in
app.get('/urls', (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    sendResError(403, 'Login required', res);
  } else {
    const templateVars = {
      user: users[userID],
      urls: getUrlsForUser(userID, urlDatabase)
    };
    res.render('urls_index', templateVars);
  }
});

// Renders a page with form to create new short URL. Redirects to /login if logged out
// Place above /urls/:shortURL as route order matters
app.get('/urls/new', (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    res.redirect('/login');
  } else {
    const templateVars = { user: users[userID] };
    res.render('urls_new', templateVars);
  }
});

// Render urls_show to show generated short URL and an edit form to change if wanted
// Error if not logged in, invalid short URL, or URL not owned by current user
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;

  if (!userID) {
    sendResError(403, 'Login required', res);
  } else if (!urlDatabase[shortURL]) {
    sendResError(404, 'Page not found', res);
  } else if (urlDatabase[shortURL].userID !== userID) {
    sendResError(403, 'Access not allowed', res);
  } else {
    const templateVars = {
      user: users[userID],
      shortURL,
      longURL: urlDatabase[shortURL].longURL
    };
    res.render('urls_show', templateVars);
  }
});

// Redirect user to longURL from shortURL
// Error if shortURL does not exist in database
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    sendResError(400, `Unable to redirect to ${shortURL}`, res);
  } else {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  }
});

// Saving generated shortURL in database under user's login
// Error if not logged in
app.post('/urls', (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    sendResError(403, 'Login required', res);
  } else {
    const newShortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[newShortURL] = { longURL, userID: userID };
    res.redirect(`/urls/${newShortURL}`);
  }
});

// Updating shortURL with a newly given longURL
// Error if user not logged in, or shortURL is not associated with user
app.post('/urls/:shortURL', (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!userID) {
    sendResError(403, 'Login required', res);
  } else if (urlDatabase[shortURL].userID !== userID) {
    sendResError(403, 'Access not allowed', res);
  } else {
    const newLongURL = req.body.longURL;
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect('/urls');
  }
});

// Deleting specific URL from database
// Error if not logged in, or shortURL does not belong to user
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!userID) {
    sendResError(403, 'Login required', res);
  } else if (urlDatabase[shortURL].userID !== userID) {
    sendResError(403, 'Access not allowed', res);
  } else {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});

// If user already logged in then redirect to /urls, otherwise render login page
app.get('/login', (req, res) => {
  const userID = req.session.user_id;

  if (userID) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users[userID] };
    res.render('login', templateVars);
  }
});

// If user already logged in then redirect to /urls, otherwise render register page
app.get('/register', (req, res) => {
  const userID = req.session.user_id;

  if (userID) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users[userID] };
    res.render('register', templateVars);
  }
});

// Sets session cookie then redirects to /urls
// Error if email not in database, or password does not match email
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const existingUser = getUserByEmail(email, users);

  if (!existingUser) {
    sendResError(403, 'Email not found', res);
  } else if (!bcrypt.compareSync(password, users[existingUser].password)) {
    sendResError(403, 'Password does not match', res);
  } else {
    req.session.user_id = existingUser;
    res.redirect('/urls');
  }
});

// Sets session cookie, creates user in database with encrypted password, then redirects to /urls
// Error if empty email or password field, or email already exists
app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const existingUser = getUserByEmail(newEmail, users);

  if (newEmail === '' || newPassword === '') {
    sendResError(400, 'Empty email or password', res);
  } else if (existingUser) {
    sendResError(400, 'Email already registered', res);
  } else {
    users[newUserID] = { id: newUserID, email: newEmail, password: bcrypt.hashSync(newPassword, 10) };
    req.session.user_id = newUserID;
    res.redirect('/urls');
  }
});

// Clears session cookie, then redirects to /urls
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// Start listening for requests at port 8080
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});