const express = require('express');
const router = express.Router();
module.exports = router;

const db = require('../db');

router.use((req, res, next) => {
  let board = res.locals.boards.find(board => board.name == req.query.board);
  if(!board) board = res.locals.boards[0];
  res.locals.board = board;
  next();
});

/*router.get('/', (req, res) => {
  db.query('select a.*, b.name board_name, b.title board_title from articles a left join boards b on a.board_id=b.id', (err, articles) => {
    if(err) throw err;
    db.query('select * from boards', (err, boards) => {
      if(err) throw err;
      res.render('board', {articles: articles, boards: boards});
    });
  });
});*/

router.get('/', (req, res) => {
  let board = res.locals.board;
  let page = Math.max(1, parseInt(req.query.page) || 1);
  if(isNaN(page) || page < 1) page = 1;
  let nPage = 3;
  let nBlock = 3;
  
  db.query(`SELECT a.id, a.title, a.hit, a.createdAt, u.name 
            FROM articles a LEFT JOIN users u ON a.user_id=u.id 
            WHERE board_id = ?
            ORDER BY id DESC
            LIMIT ?, ?`, [board.id, (page-1)*nPage, nPage], (err, articles) => {
      if(err) throw err;

      // pagination
      db.query(`SELECT count(*) count
            FROM articles a LEFT JOIN users u ON a.user_id=u.id 
            WHERE board_id = ?`, [board.id], (err, results) => {
              if(err) throw err;

              let itemTotal = results[0].count;
              let pTotal = Math.ceil(itemTotal/nPage); //itemTotal;
              let bTotal = Math.ceil(pTotal/nBlock);
              let curBlock = Math.ceil(page/nBlock);
              let paging = {
                current: page,
                prev: curBlock > 1 ? page-1 : null,
                next: curBlock < bTotal ? curBlock * nBlock + 1 : null,
                first: curBlock > 1 ? 1 : null,
                last: curBlock < bTotal ? pTotal : null,
                start: (curBlock-1)*nBlock + 1,
                end: curBlock == bTotal ? pTotal : curBlock*nBlock,
              };

              console.log({page, pTotal, bTotal, curBlock}, paging);

              res.render('board', {
                articles: articles,
                paging
              });

            });
      // render 꼭 지워줘 두번하면 안됨
      //res.render('board', {articles: articles});
  });
});

router.get('/article/:id', (req, res) => {
  db.query('select a.*, u.id userId, u.name userName from articles a join users u on a.user_id=u.id where a.id = ?', 
  [req.params.id], (err, rows) => {
    if(err) throw err;
    res.render('article/read', {article: rows[0]});
  });
});

// write 
router.get('/write', (req, res) => {
  if(!req.session.user) return res.redirect('/user/login');
  db.query('select * from boards', (err, rows) => {
    if(err) throw err;
    res.render('article/write', {boards: rows});
  });
});
router.post('/write', (req, res) => {
  let values = req.body;
  console.log(values);
  let errors = [];
  
  if(!values.boardName || values.boardName.trim().length == 0)
    errors.push({field: 'boardName', code:'NOT_SELECTED', msg: '카테고리 선택해!!'}); 
  
  if(!values.title || values.title.trim().length == 0)
    errors.push({field: 'title', code:'REQUIRED', msg: '제목 입력해!!'});
  
  if(!values.content || values.content.trim().length == 0)
    errors.push({field: 'content', code:'REQUIRED', msg: '내용 입력해!!'});
  
  if(errors.length > 0){
    db.query('select * from boards', (err, rows) => {
      if(err) throw err;
      res.render('article/write', {values, errors, boards: rows});
    });
    return;
  }
  
  db.query('insert into articles (title, content, user_id, board_id) value (?, ?, ?, ?)', 
  [req.body.title, req.body.content, res.locals.user.id, req.body.boardName], (err, rows) => {
    if(err) throw err;
    res.redirect('/');
  });
});

// update
router.get('/update/:article', (req, res) => {
  let article = JSON.parse(req.params.article);
  if(!req.session.user) return res.redirect('/user/login');
  db.query('select * from boards', (err, boards) => {
    if(err) throw err;
    res.render('article/update', {boards: boards, article: article});
  });
});
router.post('/update', (req, res) => {
  if(!req.session.user) return res.redirect('/user/login');
  let values = req.body;
  let errors = [];
  
  if(!values.boardName || values.boardName.trim().length == 0)
    errors.push({field: 'boardName', code:'NOT_SELECTED', msg: '카테고리 선택해!!'});
  
  if(!values.title || values.title.trim().length == 0)
    errors.push({field: 'title', code:'REQUIRED', msg: '제목 입력해!!'});
  
  if(!values.content || values.content.trim().length == 0)
    errors.push({field: 'content', code:'REQUIRED', msg: '내용 입력해!!'});
  
  if(errors.length > 0){
    db.query('select * from boards', (err, rows) => {
      if(err) throw err;
      res.render('article/write', {values, errors, boards: rows});
      return;
    });
  }
  
  db.query('update articles set title=?, content=? where id=?',
  [req.body.title, req.body.content, req.body.id], (err, rows) => {
    if(err) throw err;
    res.redirect('/article/' + req.body.id);
  });
});

// delete
router.post('/delete/:id', (req, res) => {
  if(!req.session.user) return res.redirect('/user/login');
  db.query('delete from articles where id=?', [req.params.id], (err, rows) => {
    if(err) throw err;
    res.redirect('/');
  });
});