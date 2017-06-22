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
    delete: function(id){
      var form = document.createElement('form');
      form.action = '/delete/' + id;
      form.method = 'post';
      document.body.append(form);
      form.submit();
    }
  };
  
  window.bbs = {
    User: User,
    Article: Article,
  };
})(window);