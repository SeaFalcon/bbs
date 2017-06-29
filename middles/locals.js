const db = require('../db');

module.exports = (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  res.locals.forms = {};
  res.locals.query = req.query;
  // request에 따라 다르게 작동... app.locals에 붙이면 req에 접근할 수 없다.
	/*res.locals.query = (obj = {}) => {
		let query = req.query;
		let resultQuery = {};
		// copy
  	for(let key in query){
  		resultQuery[key] = query[key];
  	}
  	// overwrite
  	for(let key in obj){
  		resultQuery[key] = obj[key];
  	}
  	// convert to string
  	let strings = [];
  	for(let key in resultQuery){
  		strings.push(`${key}=${query[key]}`);
  	}
  	return strings.length == 0 ? "" : `?${strings.join('&')}`;
  	//let newResult = Object.extends({}, req.query, obj);
  };*/

  res.locals.buildQuery = (obj = {}) => {
  	console.log(obj);
 		let newQuery = {};
 		let query = req.query;
 		for(let key in query) newQuery[key] = query[key];
 		for(let key in obj) {
 			if(obj[key] == null) delete newQuery[key];
 			newQuery[key] = obj[key];
 		}
 		
 		let newString = [];
 		for(let key in newQuery) newString.push(`${key}=${encodeURIComponent(newQuery[key])}`);
  	return newString.length == 0 ? '' : `?${newString.join('&')}`;
  };

  res.locals.buildHiddens = (obj = {}) => {
		let newQuery = {};
 		for(let key in req.query) newQuery[key] = req.query[key];
 		for(let key in obj) {
 			if(obj[key] == null) delete newQuery[key];
 			else newQuery[key] = obj[key];
 		}

  	let inputs = [];
 		for(let key in newQuery) inputs.push(`<input type=hidden name="${key}" value="${newQuery[key]}">`);
 		return inputs.join("\n");
  }

  db.query('select * from boards', (err, rows) => {
    if(err) return next(err);
    res.locals.boards = rows;
    next();
  });
}