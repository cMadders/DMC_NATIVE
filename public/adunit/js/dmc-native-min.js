function escapeHtml(t){var e=document.createElement("div");return e.appendChild(document.createTextNode(t)),e.innerHTML}function unescapeHtml(t){var e=document.createElement("div");e.innerHTML=t;var i=e.childNodes[0];return i?i.nodeValue:""}window.dmc.Controller=function(){"use strict";var t=function(){i(),$("body").append('<div id="dmc-card"></div>'),$("body").append('<div id="dmc-overlay"></div>'),e(),window.dmc.initialized=!0},e=function(){var t=window.addEventListener?"addEventListener":"attachEvent",e=window[t],i="attachEvent"==t?"onmessage":"message";e(i,function(t){if("dmc-card-loaded"==t.data,"dmc-card-initialized"==t.data){var e=window.location.protocol+"//"+window.location.host+window.location.pathname,i="*",n=document.getElementById("dmc-card-iframe").contentWindow,o={type:"dmc-card-message",key:"page_url",value:e};n.postMessage(o,i)}"dmc-eject-card"==t.data&&d()},!1)},i=function(){function t(t){var e=document.createElement("div");e.innerHTML="<p>x</p><style>"+t+"</style>",document.body.appendChild(e.childNodes[1])}var e=function(){var t=document.createElement("style");return t.appendChild(document.createTextNode("")),document.head.appendChild(t),t.sheet}();e.insertRule(".dmc-native { cursor:pointer;overflow:hidden;}",0),e.insertRule("#dmc-native { cursor:pointer;overflow:hidden;}",0),e.insertRule("#dmc-overlay { position: fixed;width: 100%;height: 100%;visibility: hidden;top: 0;left: 0;z-index: 1000; opacity: 0; background: rgba(0, 0, 0, 0.8); transition: opacity 0.3s;}",0),e.insertRule("#dmc-overlay.show  {visibility:visible;opacity:1;}",0),e.insertRule("#dmc-card { background:white; width:100%; height: 30px; opacity: 0;position: absolute;box-shadow: 0 0 12px 0 rgba(0, 0, 0, 0.8);z-index:2000;transition: opacity 0.5s;visibility:hidden; }",0),e.insertRule("#dmc-card.show { visibility:visible; opacity:1; }",0),e.insertRule(".disable-scroll { overflow: hidden; position: fixed; height: 100%;width:100%; }",0)},d=function(){$("#dmc-overlay, #dmc-card").removeClass("show").empty(),$("#dmc-card").removeClass("expanded"),$("html, body").removeClass("disable-scroll"),window.scrollTo(0,window.dmc.viewportTop);var t=new Event("unitMinimized");window.dispatchEvent(t)},n=function(){window.dmc.activate(o)},o=function(t,e,i){e=JSON.parse(e),window.dmc.AdUnitController.createAdUnit(t,e,i)};return{initialize:t,activateAdUnit:n}}(),window.dmc.AdUnitController=function(){var t=function(t,e){return function(t,e){var i=t.uuid,d=t.adunit_id,n=t.adunit_short_id,o=!0,a={top:null,right:null,bottom:null,left:null,width:null,height:null},c=null,r=function(){console.log("AdUnit initialize",t.uuid),l(),s()},l=function(){var i=$(e).attr("id");$("script#"+i).after(unescapeHtml(t.template)).remove()},s=function(){c=$("#"+i),c.click(function(t){t.preventDefault(),m()}),window.addEventListener("unitMinimized",function(){})},m=function(){a.top=c.offset().top,a.right=c.offset().right,a.bottom=document.getElementById(i).style.bottom,a.left=c.offset().left,a.width=document.getElementById(i).offsetWidth,a.height=document.getElementById(i).offsetHeight,window.dmc.viewportTop=document.body.scrollTop,$("#dmc-overlay").addClass("show"),$("#dmc-card").css("top",a.top+"px").css("left",a.left).css("width",a.width).css("height",a.height),$("#dmc-card").height($("#dmc-card").height()/2);var t=a.top+a.height/2-$("#dmc-card").height()/2;$("#dmc-card").css("top",t),$("#dmc-card").addClass("show");var e=TweenLite.to($("#dmc-card"),.4,{top:window.dmc.viewportTop,left:0,delay:.3,height:"100%",width:"100%",ease:Power1.easeInOut,onComplete:u})},u=function(){window.scrollTo(0,0),$("#dmc-card").css("top","0"),$("#dmc-card").addClass("expanded"),$("html, body").addClass("disable-scroll"),$("#dmc-card").html('<iframe id="dmc-card-iframe" src="http://native.digitalmediacommunications.com/card/list/'+d+'" frameborder="0" style="width: 100%; height: 100%;"></iframe>')};return{uuid:i,activated:o,initialize:function(){return r()},getData:function(){return t}}}(t,e)};return{createAdUnit:function(e,i,d){var n=new t(i,d);n.initialize(),window.dmc.adunits[e]=n}}}(),window.dmc.initialized||window.dmc.Controller.initialize(),window.dmc.Controller.activateAdUnit();