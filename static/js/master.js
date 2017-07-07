(function(window, $){
  var User = {
    logout: function(){
      var form = document.createElement('form');
      form.action = '/user/logout';
      form.method = 'post';
      document.body.append(form);
      form.submit();
    },
    pwCheck: function(){
      
    }
  };
  var Article = {
    delete: function(){
      if(!confirm('정말 삭제하시겠습니까?')) return;
      var form = document.createElement('form');
      form.action = '/delete' + window.location.search;
      form.method = 'post';
      document.body.append(form);
      form.submit();
    },
    update: function(id){
      location.href = '/update' + window.location.search;
    },
    onsubmit: function(form, e){
      if(form.title.value.trim().length == 0){
        alert('제목을 입력하세요!');
        form.title.focus();
        return false;
      }else if(form.content.value.trim().length == 0){
        alert('내용을 입력하세요!');
        form.content.focus();
        return false;
      }
      return true;
    }
  };

  /*let Comment = {
    delete: function(id){
      if(!confirm('정말 삭제하시겠습니까?')) return;
      let form = document.createElement('form');
      form.action = '/comment/delete/' + window.location.search;
      form.method = 'post';
      let hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.setAttribute('name', 'commentId');
      hidden.setAttribute('value', id);
      document.body.append(form);
      form.append(hidden);
      form.submit();
    },
    update: function(id, self){
      let contentTag = $(`#comment_${id} .com_content`)[0];
      let inputTag = $('<input>', {
        type: 'text',
        value: contentTag.innerText,
      })[0];
      contentTag.replaceWith(inputTag);

      let buttons = $(`#comment_${id} a`);
      let saveBtn = $('<a>', {
        href: '#',
        text: '저장',
        click: e => {
          e.preventDefault();
          $.ajax({
            type: 'POST',
            url: '/comment/update' + window.location.search,
            data: {
              id: id,
              content: inputTag.value
            },
            success: function(result){
              console.log(result);
              contentTag.innerText = inputTag.value;
              inputTag.replaceWith(contentTag);
              saveBtn.replaceWith(buttons[0]);
              cancelBtn.replaceWith(buttons[1]);
            },
            dataType: 'json'
          });
        }
      })[0];
      let cancelBtn = $('<a>', {
        href: '#',
        text: '취소',
        click: e => {
          e.preventDefault();
          inputTag.replaceWith(contentTag);
          saveBtn.replaceWith(buttons[0]);
          cancelBtn.replaceWith(buttons[1]);
        }
      })[0];

      buttons[0].replaceWith(saveBtn);
      buttons[1].replaceWith(cancelBtn);

    }
  }*/

  var Comment = function(data){
    this.id = data.id;
    this.content = data.content;
    this.author = data.author;
    this.editable = data.editable;
    this.createdAt = data.createdAt;
  };
  Comment.instaces = [];

  // Static Method
  Comment.get = function(articleId){
    $.get('/comments?articleId=' + articleId)
    .then(function(comments){
      Comment.instances = comments;
      Comment.render();
    })
    .catch(function(){
      //TODO
    });
  };
  Comment.create = function(articleId, content){
    $.post('/comments?articleId=' + articleId, {content: content})
    .then(function(data){
      new Comment(data.id, data.user_id, data.content, data.article_id);
      Comment.render();
    })
    .catch(function(){
      //TODO
    });
  };

  // Instance Method
  Comment.prototype.delete = function(){
    if (!confirm('정말 삭제하시겠습니까?')) return;

    $.ajax('/comments/'+thid.id, { method: 'delete' })
    .then(function(result){
      console.log(result);
      Comment.instances.splice(Comment.instances.indexOf(this), 1);
      Comment.render();
    })
    .catch(function(){

    });
  };

  Comment.prototype.update = function(commentId, content){
    $.ajax('/comments/'+commentId, { method: 'put', data: {content: content} })
    .then(function(result){
      console.log(result);
      var idx = Comment.instances.indexOf(commentId);
      Comment.instances[idx].content = content;
      Comment.render();
    })
    .catch(function(){

    });
  };

  Comment.render = function(){

  };

  var $view = {};

  $("[data-app]").each(_, function(el){
    var $el = $(el);
    var viewName = $el.data('app');
    $view[viewName] = $el;
  });

  var state = {
    item: Comment.instances
  };

  var handlers = {
    var comments = state.item;
    'update-view': function(e){
      if(comments){
        $views['author']
        $views['content']
        $views['date']
      }
    }
  }

  // register handlers
  Object.keys(handlers).forEach(name => {
    let eventName = 'app-' + name;
    $(window).on(eventName, handlers[name]);
  });

  window.bbs = {
    User: User,
    Article: Article,
    Comment: Comment
  };
})(window, $);