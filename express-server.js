const express = require('express');
const app = express();
const morgan = require('morgan');
const PORT = 8080;  // Default port

// Adding http request logger to app
app.use(morgan('dev'));

// Use EJS as Express app's templating engine
app.set('view engine', 'ejs');

// Test object for /urls.json GET
const urlDatabase = {
  'b2xVn2': 'http://www.ligthouselabs.ca',
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

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// Start listening at port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});