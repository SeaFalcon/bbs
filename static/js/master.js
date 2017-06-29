(function(window){
  let User = {
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
  let Article = {
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
  
  window.bbs = {
    User: User,
    Article: Article,
  };
})(window);