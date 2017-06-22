const express = require('express');
const router = express.Router();
module.exports = router;

const db = require('../db');

router.get('/', (req, res) => {
  res.redirect('user/login');
});

router.get('/login', (req, res) => {
  if(req.session.user) res.redirect('/');
  res.render('user/login');
});

router.post('/login', (req, res) => {
  var values = req.body;
  var errors = [];
  
  if(!values.uid || values.uid.trim().length == 0)
    errors.push({field: 'uid', msg: '아이디 입력해!!'});
  
  if(!values.pw || values.pw.trim().length == 0)
    errors.push({field: 'pw', msg: '패스워드 입력해!!'});
    
  if(errors.length > 0){
    delete values.pw;
    res.render('user/login', {
      forms: {
        login: {
           values: {uid: req.body.uid},
           errors: errors
        }      
      }
    });
  }
  
  db.query('select * from users where uid like ? and password like ?', 
  [req.body.uid, req.body.pw], (err, rows) => {
    if(err){ 
        console.log(err);
    }
    if(!rows[0]){
      res.render('user/login', {
        forms: {
          login: {
             values: {uid: req.body.uid},
             errors: [{msg: '로그인 정보 틀림'}]
          }      
        }
      });
    }else{
      console.log(rows);
      req.session.user = rows[0];
      res.redirect('/');
    }
  });
});

router.post('/logout', (req, res) => {
  req.session.user = null;
  res.redirect('/');
});

router.get('/join', (req, res) => {
  if(req.session.user) return res.redirect('/');
  res.render('user/join');
});

router.post('/join', (req, res) => {
  var values = req.body;
  var errors = [];
  
  if(!values.uid || values.uid.trim().length == 0)
    errors.push({field: 'uid', msg: '아이디 입력해!!'});
  
  if(!values.name || values.name.trim().length == 0)
    errors.push({field: 'name', msg: '이름 입력해!!'});
  
  if(!values.pw || values.pw.trim().length == 0)
    errors.push({field: 'pw', msg: '패스워드 입력해!!'});
  
  if(values.pw != values.pwConfirm)
    errors.push({field: 'pwConfirm', msg: '패스워드 확인해!!'});
  
  if(errors.length > 0){
    delete values.pw;
    delete values.pwConfirm;
    res.render('user/join', {
      forms: {
        join: { values, errors }
      }
    });
    return;
  }
  
  db.query('insert into users (uid, password, name) values (?, ?, ?)', 
  [req.body.uid || null, req.body.pw || null, req.body.name || null], (err, data) => {
    if(err) {
      switch(err.code){
        case 'ER_DUP_ENTRY':
          errors.push({field: 'uid', msg: '중복되는 아이디야~!'});
        break;
        default:
          errors.push({msg: '알수 없는 오류!!'});
      }
      res.render('user/join', {
        forms: {
          join: {values, errors}
        }
      });
    }else{
      db.query('select * from users where id like ?', [data.insertId], (err, rows) => {
        if(err) return res.redirect('/');
        
        var user = rows[0];
        req.session.user = user;
        res.redirect('/');
      });
    }
  });
});