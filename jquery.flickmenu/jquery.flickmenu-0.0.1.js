/*
 *  Project: flickmenu - jQuery Plugin
 *  Description: for iOS / Android, flick menu, pull to refresh
 *  Author: Akihiro Koyanagi | http://i-section.net | http://akihiro.jugem.jp
 *  License: GPL
 */

;(function ( $, window, undefined ) {
    
	var IS_ANDROID = (/android/gi).test(navigator.appVersion);
	var IS_IOS4    = navigator.userAgent.match(/OS 4_[0-9_]+ like Mac OS X/i) !== null;
	var IS_IOS5    = navigator.userAgent.match(/OS 5_[0-9_]+ like Mac OS X/i) !== null;
	var IS_IOS6    = navigator.userAgent.match(/OS 6_[0-9_]+ like Mac OS X/i) !== null;
	
	// スライドメニューを開いているフラグ
	var IS_MENUOPEN = false;
	
	// pull to refresh
	var touchY, touchX;
	var isCanRefresh = false;
	var isRefreshing = false;
	var swipeSensor = false;
	var swipeMode = false;
	
	$.flickmenu = function( elem , options ){
		
		// init
		
		var defaults = {
			scrollContents:	null,
			btnNaviOpen: null,
			// プルダウンリフレッシュ有効？
			isPullRefresh: true,
			onPullRefresh:	function(){},
        }
        this.options = $.extend( {}, defaults, options) ;
		
        this.element = elem;
		
		var _self = this;
		
		// body wrap
		$("body").wrapInner('<div id="bodyWrapper"></div>');
		
		// contents scroll
		if (_self.options.scrollContents){
			$(_self.options.scrollContents).wrap('<div id="scrollWrapper"></div>');
		}
		
		// add pull2refresh box
		if (_self.options.isPullRefresh){
			$("#header").after('<div id="refreshBox">リリースして更新</div>');
		}
		
		// add slide menu
		$("body").append('<div id="slidemenuWrapper"><div id="pageslide"></div></div>');
		
		// copy menu
		if (this.element != null){
			var menu = $(this.element).clone();
			$(this.element).remove();
			$("#slidemenuWrapper #pageslide").append(menu);
			menu.show(0);
		}
		
		
		// main
		if (this.options.isPullRefresh==false){
			$("#refreshBox").css({ display: "none" });
		}
		
		$("#slidemenuWrapper").hide(0);
		
		setTimeout(function(){
			$("#scrollWrapper").trigger("touchstart");
		}, 100);
		
		// for Android
		if (IS_ANDROID){
			$("#header")
				.css({
					position:	"absolute",
					overflow:	"visible",
					"overflow-y":	"",
				});
			$("#scrollWrapper")
				.css({
					position:	"static",
					overflow:	"visible",
					"overflow-y":	"",
				"margin-top":	$("#header").outerHeight(),
				});
			$("#refreshBox")
				.css({
					display:	"none",
				});
			$("#slidemenuWrapper")
				.css({
					overflow:		"visible",
					"overflow-y":	"visible",
				});
			
			$(window)
				.on("scroll", function(e){
					if (IS_MENUOPEN){
						
						var limit_scrollTop = $("#slidemenuWrapper").offset().top;
						var limit_scrollBtm = $("#slidemenuWrapper").offset().top + ($("#slidemenuWrapper").outerHeight()-$(window).innerHeight());
						limit_scrollBtm = limit_scrollBtm<limit_scrollTop ? limit_scrollTop : limit_scrollBtm;
						
						if ($(this).scrollTop() < limit_scrollTop){
							$("html, body").scrollTop(limit_scrollTop);
						} else
						if ($(this).scrollTop() > limit_scrollBtm){
							$("html, body").scrollTop(limit_scrollBtm);
						}
						$("#header")
							.css({
								top:	$(window).scrollTop()
							})
							.show(0);
					} else {
						$("#header, #slidemenuWrapper")
							.css({
								top:	$(window).scrollTop()
							});
						$("#header").show(0);
					}
				})
				.on("touchstart", function(e){
					if (IS_MENUOPEN==false){
						$("#slidemenuWrapper")
							.css({
								top:	$(window).scrollTop()
							});
						//$("#header").hide(0);
					}
				})
				.on("touchend", function(e){
					$("#header")
						.css({
							top:	$(window).scrollTop()
						})
						.show(0);
				});
		}
		
		
		$("#scrollWrapper, #slidemenuWrapper").on("scroll", function(e){
			
			if (IS_ANDROID) return;
			
			window.scrollTo(0, 0);
			if ($(this).scrollTop()==0){
				$(this).scrollTop(1);
			}
			var maxScrollHeight = $(this)[0].scrollHeight - $(this).innerHeight();
			if ($(this).scrollTop()>=maxScrollHeight){
				$(this).scrollTop(maxScrollHeight-1);
			}
		});
		
		$("#scrollWrapper").on("touchstart", function(e){
			
			if (IS_ANDROID) return;
			
			// re-size
			window.scrollTo(0, 0);
			$("#header").css({
				left: 0,
				top:  0
			});
			$("#bodyWrapper").height(window.innerHeight);
			$("#scrollWrapper")
				.height(window.innerHeight - $("#header").outerHeight())
				.css('margin-top', $("#header").outerHeight());
			if ($("#scrollWrapper").scrollTop()==0){
				$("#scrollWrapper").scrollTop(1);
			}
			
			if (isRefreshing==true) return;
			
			if (e.originalEvent){
				touchY = e.originalEvent.targetTouches[0].screenY;
				touchX = e.originalEvent.targetTouches[0].screenX;
			}
			
			swipeSensor = true;
			setTimeout(function(){
				swipeSensor = false;
			}, 150);
			
			$("#refreshBox").text("Pull to refresh");
			
		});
		
		$("#scrollWrapper").on("touchmove", function(e){
			
			if (IS_ANDROID) return;
			
			if (isRefreshing==true) return;
			
			if (IS_MENUOPEN){
				e.preventDefault();
				return;
			}
			
			
			var distX = touchX - e.originalEvent.targetTouches[0].screenX;
			if (swipeSensor==true && swipeMode==false && distX>60){
				swipeMode = true;
				$("#refreshBox").stop(true,true).animate({ top: "0px"}, "fast", "swing");
			}
			if (swipeMode==true){
				
				$("#slidemenuWrapper").show(0).height(window.innerHeight).scrollTop(1);
				
				var left = e.originalEvent.targetTouches[0].screenX - touchX;
				if (left>0) left = 0;
				$("#bodyWrapper").css({
					width:		$(window).innerWidth(),
					position:	'absolute',
					right:		'auto',
					left:		left,
				});
			} else {
				if (_self.options.isPullRefresh==true){
					if (parseInt($(this).scrollTop())<=1){
						var y = e.originalEvent.targetTouches[0].screenY;
						var dist = -parseInt($("#scrollWrapper").scrollTop());
						if (dist<44){
							$("#refreshBox")
								.text("Pull to refresh")
								.css("top", dist+"px")
								.show(0);
							
							isCanRefresh = false;
						} else {
							$("#refreshBox")
								.text("Release to refresh")
								.css("top", $("#header").outerHeight()+"px");
							
							isCanRefresh = true;
						}
					}
				}
			}
		});
		
		$("#scrollWrapper").on("touchend", function(e){
			
			// iOS & Android
			if (IS_MENUOPEN){
				_self.slidemenuOff();
				e.preventDefault();
				return;
			}
			
			if (IS_ANDROID) return;
			
			if (_self.options.isPullRefresh){
				if (isCanRefresh){
					isRefreshing = true;
					$("#refreshBox").text("loading...");
					
					_self.options.onPullRefresh();
					
					setTimeout(function(){
						isCanRefresh = false;
						$("#scrollWrapper").trigger("touchend");
					}, 1000);
				} else {
					$("#refreshBox").stop(true,true).animate({ top: "0px"}, "fast", "swing", function(){
						isRefreshing = false;
						$(this).hide(0);
					});
				}
			}
			
			if (swipeMode==true){
				swipeMode = false;
				
				// 1/3程度引っ張ってたらOpen
				if ($("#bodyWrapper").position().left<(-$(window).innerWidth()/3)){
					_self.slidemenuOn();
				} else{
					_self.slidemenuOff();
				}
				
			}
		});
		
		$("#scrollWrapper").on("click", function(e){
			if (IS_MENUOPEN){
				e.preventDefault();
			}
		});
		
		// open side navi
		if (_self.options.btnNaviOpen){
			$(_self.options.btnNaviOpen).on("touchend mouseup", function(e){
				if (IS_MENUOPEN){
					_self.slidemenuOff();
				} else {
					_self.slidemenuOn();
				}
			});
		}
	}
	
	$.extend( $.flickmenu.prototype , {
		slidemenuOn : function(){
			IS_MENUOPEN = true;
			
			if (IS_ANDROID){
				$("#slidemenuWrapper").show(0);
			} else {
				// iOS
				$("#slidemenuWrapper").show(0).height(window.innerHeight).scrollTop(1);
			}
			
			$("#bodyWrapper").css({
				width:		$(window).innerWidth(),
				position:	'absolute',
				right:		'auto',
			}).animate({
				left:		-$("#slidemenuWrapper").outerWidth(),
			}, 150);
		},
		slidemenuOff : function(){
			$("#bodyWrapper").animate({
				left: 0
			}, 150, function(){
				$(this).css({
					position:	'static',
					right:		'auto',
					left:		'auto',
				});
				$("#slidemenuWrapper").hide(0);
				
				IS_MENUOPEN = false;
				
			});
		}
	});
	
	
    $.fn.flickmenu = function ( options ) {
        return this.each(function () {
			new $.flickmenu( this , options);
        });
    };

}(jQuery, window));
