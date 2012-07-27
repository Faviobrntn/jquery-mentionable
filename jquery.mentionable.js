/*!
 * jQuery Mentionable
 *
 * A jQuery plugin that enables the user to mention other people
 *
 * Copyright(c) 2011 Oozou Limited. by Warut Surapat <warut@oozou.com>
 * MIT Licensed.
 *
 * http://www.oozou.com
 * https://github.com/oozou/jquery-mentionable
 */
(function( $ ) {
  var cachedName            = "";
  var fullCachedName        = "";
  var mentioningUser        = false;
  var textArea              = null;
  var container             = null;
  var userListWrapper       = $("<ul id='mentioned-user-list'></ul>");
  var userList              = null;
  var inputText             = null;
  var targetURL             = null;
  var onComplete            = null;
  var options               = null;
  var debugMode             = true;
  var debuggerBlock         = "<div id='mentionable-debugger'></div>"
  var caretStartPosition    = 0;
  var keyRespondingTimeOut  = null;
  var keyRespondTime        = 500;

  var KEY = {
    BACKSPACE: 8,
    DELETE: 46,
    TAB: 9,
    ENTER: 13,
    ESCAPE: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    NUMPAD_ENTER: 108,
    COMMA: 188,
    ATSIGN: 64
  };

  /*
   * make a textarea support user mentioning
   *
   * param usersURL             A url to fire an ajax call to retrieve user list.
   * param opts                 An options: (id) to set the id of the user list block.
   * param onCompleteFunction   A callback function when user list is retrieved. Expected to be a user item generation.
   *
   */
  $.fn.mentionable = function(usersURL, opts, onCompleteFunction) {
    textArea  = this;
    container = textArea.parent();
    targetURL = usersURL;
    options   = $.extend({
      "id" : "mentioned-user-list"
    }, opts);
    userListWrapper = $("<ul id='" + options.id + "'></ul>");

    if(debugMode){
      container.before(debuggerBlock);
    }

    this.keypress(function(e){

      watchKey();

      switch(e.keyCode){
        case KEY.ATSIGN:
          showUserFrame();
          caretStartPosition = currentCaretPosition();
          break;
        case KEY.ENTER:
        case KEY.SPACE:
          hideUserFrame();
          break;
        default:
          // append pressed character to cache
          if(cachedName != ""){
            cachedName += String.fromCharCode(e.charCode);
          }
      }

      // if user typed any letter while the caret is not at the end
      // completely remove the string behind the caret.
      fullCachedName = cachedName;
    });
    this.keyup(function(e){
      switch(e.keyCode){
        case KEY.DELETE:
        case KEY.BACKSPACE:
          // delete or backspace key is pressed
          cachedName = cachedName.substring(0, cachedName.length -1);
          fullCachedName = cachedName;
          if(cachedName==""){
            hideUserFrame();
          }
          break;
        case KEY.ESCAPE:
          hideUserFrame();
          break;
        case KEY.LEFT:
          watchKey();
          caretMoveLeft();
          break;
        case KEY.UP:
          caretMoveUp();
          break;
        case KEY.RIGHT:
          watchKey();
          caretMoveRight();
          break;
        case KEY.DOWN:
        caretMoveDown();
          break;
      }
    });
  };

  function hideUserFrame(){
    getUserList();
    cachedName     = "";
    fullCachedName = "";
    mentioningUser = false;
    userList.remove();
  }
  function showUserFrame(){
    container.append(userListWrapper);
    mentioningUser = true;
    cachedName     = "@";

    getUserList();
    userList.css("left", -1 * userList.outerWidth());
    userList.css("top", 0);
    userList.show();
  }

  function populateItems(keyword){
    getUserList();
    userList.html("");
    var data = null;
    if(keyword != undefined){
      data = { mentioning: keyword.replace("@", "") };
    }
    if(onComplete != undefined){
      $.getJSON(targetURL, data, onComplete);
    }
    else{
      $.getJSON(targetURL, data, function(data){
        fillItems(data);
      });
    }
    bindItemClicked();
  }

  function fillItems(data){
    $.each(data, function(key, value){
      userList.append("<li><img src='" + value.image_url + "' /><span>" + value.name + "</span></li>");
    });
    bindItemClicked();
  }

  function bindItemClicked(){
    // handle when user item is clicked.
    var userListItems = userList.find("li");
    userListItems.click(function(){
      var item     = $(this);
      inputText    = textArea.val();

      replacedText = replaceString(caretStartPosition, caretStartPosition +
                                    fullCachedName.length, inputText, "@" +
                                    item.find("span").html());
      textArea.focus();
      textArea.val(replacedText);
      hideUserFrame();
    });
  }

  function caretMoveLeft(){
    if(mentioningUser){
      //remove last char from cachedName while maintaining the fullCachedName
      if(cachedName != "@"){
        cachedName = fullCachedName.substring(0, cachedName.length - 1);
      }
      else{
        hideUserFrame();
      }
    }
  }

  function caretMoveRight(){
    if(mentioningUser){
      if(cachedName == fullCachedName){
        hideUserFrame();
      }
      else{
        //append to the tail the next character retrieved from fullCachedName
        cachedName = fullCachedName.substring(0, cachedName.length + 1);
      }
    }
  }

  function caretMoveUp(){

  }

  function caretMoveDown(){

  }

  function getUserList(){
    userList = $("#" + options.id);
  }

  function debug(){
    myDebugger = $("#mentionable-debugger");
    myDebugger.html("<b>cache : </b>" + cachedName +" | <b>full cache : </b>" + fullCachedName);
  }

  function currentCaretPosition(){
    caretContainer = document.getElementById(textArea.attr("id"));
    return caretContainer.selectionStart;
  }

  function replaceString(from, to, originalString, addedString){
    try{
      if(from == 0){
        return addedString + originalString.substring(to, originalString.length);
      }
      if(from != 0){
        firstChunk = originalString.substring(0, from);
        lastChunk  = originalString.substring(to, originalString.length);
        return firstChunk + addedString + lastChunk;
      }
    }
    catch(error){
      return originalString;
    }
  }

  function watchKey(){
    clearTimeout(keyRespondingTimeOut);
    keyRespondingTimeOut = setTimeout(
      function(){
        populateItems(cachedName);
      },
      keyRespondTime
    );
  }

})( jQuery );