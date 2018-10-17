const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs'); 

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'poojabhatia',
    database : 'smartbraindata'
  }
});

db.select('*').from('users');

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req,res) => {
	res.send(database.users);
})

app.post('/signin', (req,res) => {
	const {email, password} = req.body;
	if(!email || !password) {
		return res.json('incorrect form submission').status(400)
	}
	db.select('email', 'hash').from('login')
	.where('email', '=', email)
	.then(data => {
		const isValid = bcrypt.compareSync(password, data[0].hash);
		if(isValid) {
			return db.select('*').from('users')
			.where('email', '=', email)
			.then(user => {
				res.json(user[0])
			})
			.catch(err => res.json('Unable to get user').status(400))
		} else {
			res.status(400).json('Wrong credentials')
		}
	})
	.catch(err => res.status(400).json('Wrong credentials'))
})

app.post('/register', (req,res) => {
	const {	email, password, name } = req.body;
	if(!email || !password || !name) {
		return res.json('incorrect form submission').status(400)
	}
	const hash = bcrypt.hashSync(password);

	db.transaction(trx => {
		trx.insert ({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
			.returning('*')
			.insert({
				name: name,
				email: loginEmail[0],
				joined: new Date()
			})
			.then(user => {
				res.json(user[0])
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.status(400).json('Unable to register'))	
})

app.get('/profile/:id', (req,res) => {
	const { id } = req.params;
	let found = false;
	db.select('*').from('users')
	.where({
		id: id
	})
	.then(user => {
		if(user.length) {
			res.json(user[0])
		} else {
			res.json('Not found').status(400)
		}
	})
	.catch(err => res.json('error finding user'))
})

app.put('/image', (req,res) => {
	const { id } = req.body;
	db('users')
	.where({
		id: id
	})
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	})
	.catch(err => res.json('Error').status(400))
})

app.listen(3000, () => {
	console.log('app is running on port 3000');
})