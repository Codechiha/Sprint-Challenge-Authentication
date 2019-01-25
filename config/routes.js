const axios = require('axios');
const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs');
const db = require('../database/dbConfig.js')

const { authenticate, jwtKey } = require('../auth/authenticate');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {
  // implement user registration
  const user = req.body;

  const hash = bcrypt.hashSync(user.password);
  user.password = hash;
  db('users')
    .insert(user)
    .then(u => {
      res.status(200).json({ id: u[0]})
    })
    .catch(err => res.status(500).json(err))
}

function generateToken(user) {
  const payload = {
      username: user.username,
      roles: ['admin', 'accountant']
  };

  const secret = process.env.JWT_SECRET;

  const options = {
      expiresIn: '10m'
  };

  return jwt.sign(payload, secret, options);
}

function login(req, res) {
  // implement user login
  const userInput = req.body;
  db('users').where('username', userInput.username)
  .then(user => {
      //username valid password from client == password from db
      if(user.length && bcrypt.compareSync(userInput.password, user[0].password)){

          const loginToken = generateToken(user)
          res.status(200).json({ message: `welcome`, loginToken});
      } else {
          res.status(404).json({err: 'invalid username or password'})
      }
  })
  .catch(err => {
      res.status(500).send(err);
  })

}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
