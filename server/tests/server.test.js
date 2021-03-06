var expect = require('expect')
// console.log(expect('abc'));
var createSpy = expect.createSpy
var spyOn = expect.spyOn
var isSpy = expect.isSpy
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('../server');
const {Todo} = require('../models/todo');

const todos = [
	{
		_id: new ObjectID(),
		text: 'First test todo'
	},
	{
		_id: new ObjectID(),
		text: 'Second test todo',
		completed: false,
		completedAt: 123
	}
]

beforeEach((done) => {
	// Todo.remove({}).then(() => done());	
	Todo.remove({}).then(() => {
		return Todo.insertMany(todos);
	}).then(() => done());
});

describe('POST /todos', () => {
	it('should create a new todo', (done) => {
		var text = 'Test todo text';

		request(app)
			.post('/todos')
			.send({text})
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(text);
			})
			.end((err) => {
				if(err){
					return done(err);					
				}
				Todo.find({text}).then((todos) => {
					expect(todos.length).toBe(1);
					expect(todos[0].text).toBe(text);
					done();
				}).catch((e) => done(e));
			});
	});

	it('should not create todo with invalid body data', (done) => {
		var text = '';
			request(app)
				.post('/todos')
				.send({text})
				.expect(400)
				.end((err) => {
					if(err){
						return done(err);
					}
					Todo.find().then((todos) => {
						expect(todos.length).toBe(2);
						done();						
					}).catch((e) => done(e));
				});
	});
});

describe('GET /todos', () => {
	it('should get all todos', (done) => {
		request(app)
			.get('/todos')
			.expect(200)
			.expect((res) => {
				expect(res.body.docs.length).toBe(2);
			})
			.end(done);
	});
})

describe('GET /todos/:id', () => {
		it('should return todo doc', (done) => {
			request(app)
				.get(`/todos/${todos[0]._id.toHexString()}`)
				.expect(200)
				.expect((res) => {
					expect(res.body.todo.text).toBe(todos[0].text);
				})
				.end(done);
		});

		it('should return 404 if todo not found', (done) => {
			request(app)
				.get(`/todos/${new ObjectID().toHexString()}`)
				.expect(404)
				.end(done);
		});

		it('should return 400 if non object id', (done) => {
			request(app)
				.get(`/todos/123`)
				.expect(400)
				.end(done);
		});
})

describe('DELETE /todos/:id', () => {
	it('should remove a todo', (done) => {
		var hexId = todos[1]._id.toHexString();		
		
		request(app)
			.delete(`/todos/${hexId}`)
			.expect(200)
			.expect((res) => {				
				expect(res.body.todo._id).toBe(hexId);
			})
			.end((err, res) => {
				if(err){
					return done(err);
				}
				Todo.findById(hexId).then((todo) => {					
					expect(todo).toBeFalsy();
					done();					
				}).catch((e) => done(e));
			})
	})

	it('should return 404 if todo not found', (done) => {
		request(app)
			.delete(`/todos/${new ObjectID().toHexString()}`)
			.expect(404)
			.end(done);
	})

	it('should return 404 if todo not valid', (done) => {
		request(app)
			.delete('/todos/123')
			.expect(404)
			.end(done);		
	})
})

describe('PATCH /todos/:id', () => {
	it('should update the todo', (done) => {
		var newDoc = {
			text: 'This is already updated',
			completed: true
		};
		request(app)		
			.patch(`/todos/${todos[1]._id.toHexString()}`)
			.send(newDoc)
			.expect(200)
			.expect((res) => {				
				expect(res.body.todo.text).toBe(newDoc.text);
				expect(res.body.todo.completed).toBe(newDoc.completed);
				expect(res.body.todo.completedAt).not.toBeFalsy();
			})
			.end(done);
	});

	it('should clear completedAt when todo is not completed', (done) => {
		var newDoc = {
			text : 'This is already updated',
			completed: false
		};
		request(app)
			.patch(`/todos/${todos[1]._id.toHexString()}`)
			.send(newDoc)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.completedAt).toBeFalsy();
				expect(res.body.todo.text).toBe(newDoc.text);
				expect(res.body.todo.completed).toBeFalsy();
			})
			.end(done);
	})

// 	it('should ')
})