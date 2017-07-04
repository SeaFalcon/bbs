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
  let page = Math.max(1, parseInt(req.query.page) || 1);  // 현재 페이지
  if(isNaN(page) || page < 1) page = 1;
  let nPage = 3;  // 페이지 단위
  let nBlock = 3; // 블록 단위
  let search = (req.query.search || '').trim();

  let query1, params1, query2, params2;
  if(search == ''){
    query1 = `SELECT a.id, a.title, a.hit, a.createdAt, u.name 
            FROM articles a LEFT JOIN users u ON a.user_id=u.id 
            WHERE board_id = ?
            ORDER BY id DESC
            LIMIT ?, ?`;
    params1 = [board.id, (page-1)*nPage, nPage];
    query2 = `SELECT count(*) count
            FROM articles a LEFT JOIN users u ON a.user_id=u.id 
            WHERE board_id = ?`;
    params2 = [board.id];
  }else{
    query1 = `SELECT a.id, a.title, a.hit, a.createdAt, u.name 
            FROM articles a LEFT JOIN users u ON a.user_id=u.id 
            WHERE board_id = ? AND a.title like ?
            ORDER BY id DESC
            LIMIT ?, ?`;
    params1 = [board.id, `%${search}%`, (page-1)*nPage, nPage];
    query2 = `SELECT count(*) count
            FROM articles a LEFT JOIN users u ON a.user_id=u.id 
            WHERE board_id = ? AND a.title like ?`;
    params2 = [board.id, `%${search}%`];
  }
  
  db.query(query1, params1, (err, articles) => {
      if(err) throw err;

      // pagination
      db.query(query2, params2, (err, results) => {
          if(err) throw err;

          let itemTotal = results[0].count;
          let pTotal = Math.ceil(itemTotal/nPage); // 페이지 갯수
          let bTotal = Math.ceil(pTotal/nBlock);   // 블록 갯수
          let curBlock = Math.ceil(page/nBlock);   // 현재 블록
          let paging = {
            current: page,
            prev: curBlock > 1 ? page-1 : null,
            next: curBlock < bTotal ? curBlock * nBlock + 1 : null,
            first: curBlock > 1 ? 1 : null,
            last: curBlock < bTotal ? pTotal : null,
            start: (curBlock-1)*nBlock + 1,
            end: curBlock == bTotal ? pTotal : curBlock*nBlock,
          };
          if(paging.first == paging.prev) paging.prev = null;
          if(paging.last == paging.next) paging.next = null;

          //console.log({page, pTotal, bTotal, curBlock}, paging);

          // article
          let id = req.query.id;
          if (id) {
            db.query('select a.*, u.name author from articles a left join users u on u.id=a.user_id where a.id = ?', [id], (err, articleRows) => {
              if(err) throw err;

              // hit up
              let article = articleRows[0] || null;
              if(article){
                if(!req.session.hits) {
                  req.session.hits = [];
                } 
                if(req.session.hits.indexOf(article.id == -1)){
                  db.query(`UPDATE articles SET hit=hit+1 where id=?`, [id]);
                  req.session.hits.push(article.id);
                }
              }
              
              db.query(`select c.*, u.name username from comments c left join articles a on c.article_id=a.id
                        left join users u on c.user_id=u.id where c.article_id=?`, [id], (err, comments) => {
                res.render('board', {
                  articles: articles,
                  paging,
                  article: articleRows[0],
                  comments: comments
                });
              });
            });
          } else {
            res.render('board', {
              articles: articles,
              paging,
              article: null
            });
          }
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
    res.render('article/write', {article: {}});
});
/*router.get('/write', (req, res) => {
  if(!req.session.user) return res.redirect('/user/login');
  db.query('select * from boards', (err, rows) => {
    if(err) throw err;
    res.render('article/write', {boards: rows});
  });
});*/
router.post('/write', (req, res) => {
  if(!req.session.user) return res.redirect('/user/login');

  let boardName = req.query.board;
  let board = res.locals.boards.find(b => b.name == boardName);
  let user = req.session.user;
  let title = (req.body.title || '').trim();
  let content = (req.body.content || '').trim();

  if(!board || !user || !title || !content) {
    console.log('내용이 읎어')
    return res.status(400).end();
  }

  db.query('insert into articles (board_id, user_id, title, content) values (?, ?, ?, ?)', 
  [board.id, user.id, title, content], (err, result) => {
    if(err) throw err;
    res.redirect(`/?board=${boardName}&id=${result.insertId}`);
  });
});
/*router.post('/write', (req, res) => {
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
});*/

// update
router.get('/update', (req, res) => {
  let articleId = req.query.id;
  db.query('select * from articles where id=?', [articleId], (err, rows) => {
    res.render('article/write', {article: rows[0]});
  });
});
/*router.get('/update/:article', (req, res) => {
  let article = JSON.parse(req.params.article);
  if(!req.session.user) return res.redirect('/user/login');
  db.query('select * from boards', (err, boards) => {
    if(err) throw err;
    res.render('article/update', {boards: boards, article: article});
  });
});*/
router.post('/update', (req, res) => {
  if(!req.session.user) return res.status(400).end();
  
  let articleId = req.query.id;
  let user = req.session.user;
  let boardName = req.query.board || res.locals.board;
  let board = res.locals.boards.find(b => b.name == boardName);
  let title = (req.body.title || '').trim();
  let content = (req.body.content || '').trim();

  if(!board || !user || !title || !content) return res.status(400).end();

  if(req.session.user.isAdmin){
    db.query('update articles set title=?, content=? where id=?', [title, content, articleId], (err) => {
      if(err) throw err;
      res.redirect('/?board='+boardName+'&id='+articleId);
    });
  } else {
    let userId = req.session.user.id;
    db.query('update articles set title=?, content=? where id=? and user_id=?', [title, content, articleId, userId], err => {
      if(err) throw err;
      res.redirect('/?board='+boardName+'&id='+articleId);
    });
  }
});
/*router.post('/update', (req, res) => {
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
});*/

// delete
router.post('/delete', (req, res) => {
  if(!req.session.user) return res.status(400).end();
  
  let articleId = req.query.id;
  let boardName = req.query.board;

  if(req.session.user.isAdmin){
    db.query('delete from articles where id=?', [articleId], err => {
      if(err) throw err;
      res.redirect('/?board='+boardName);
    });
  } else {
    let userId = req.session.user.id;
    db.query('delete from articles where id=? and user_id=?', [articleId, userId], err => {
      if(err) throw err;
      res.redirect('/?board='+boardName);
    });
  }

});


// comment insert
router.post('/comment', (req, res) => {
  if(!req.session.user) return res.status(400).end();

  let user = req.session.user;
  let formData = req.body;

  if(!formData.content) return res.status(400).end();

  db.query(`INSERT INTO comments (content, user_id, article_id) VALUES (?, ?, ?)`,
    [formData.content, user.id, formData.id], (err, result) => {
      if(err) throw err;
      res.redirect('/' + res.locals.buildQuery({board: formData.board, id: formData.id, search: formData.search}));
    });

});

// comment delete
router.post('/comment/delete', (req, res) => {
  if(!req.session.user) return res.status(400).end();
  
  let commentId = req.body.commentId;

  db.query('DELETE FROM comments WHERE id=?', [commentId], (err, result) => {
    if(err) throw err;
    res.redirect('/' + res.locals.buildQuery(req.query));
  });

});

// comment update
router.post('/comment/update', (req, res) => {
  if(!req.session.user) return res.status(400).end();
  
  let commentId = req.body.commentId;

  db.query('DELETE FROM comments WHERE id=?', [commentId], (err, result) => {
    if(err) throw err;
    res.redirect('/' + res.locals.buildQuery(req.query));
  });

});