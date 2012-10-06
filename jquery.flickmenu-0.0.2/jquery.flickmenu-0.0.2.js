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
	var lastTouchY = [];
	var lastScrollWrapperY;
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
		$("#bodyWrapper").css({
			width:		$(window).innerWidth()
		});
		
		// contents scroll
		if (_self.options.scrollContents){
			$(_self.options.scrollContents).wrap('<div id="scrollWrapper"></div>');
		}
		
		// add pull2refresh box
		if (_self.options.isPullRefresh){
			$("#header").before('<div id="refreshBoxWrapper"><div id="refreshBox">リリースして更新</div></div>');
		}
		
		// add slide menu
		$("body").append('<div id="slidemenuWrapper"><div id="pageslide"></div></div>');
		if (this.element != null){
			// copy menu
			var menu = $(this.element).clone();
			$(this.element).remove();
			$("#slidemenuWrapper #pageslide").append(menu);
			menu.show(0);
		}
		$("#slidemenuWrapper").hide(0);
		
		
		setTimeout(function(){
			$("#scrollWrapper").trigger("touchstart");
		}, 100);
		
		
		$(window).on("scroll", function(e){
			if ($(this).scrollTop()==0){
				window.scrollTo(0, 1);
				$("#scrollWrapper").animate({ top: "0px"}, "fast", "swing");
			}
			
			if (IS_ANDROID && IS_MENUOPEN){
				var maxScrollHeight = $("#slidemenuWrapper").height() - $(this).innerHeight();
				if ($(this).scrollTop()>=maxScrollHeight){
					$(this).scrollTop(maxScrollHeight-1);
				}
			}
		});
		
		//$("#scrollWrapper, #slidemenuWrapper").on("scroll", function(e){
		$("#slidemenuWrapper").on("scroll", function(e){
			window.scrollTo(0, 1);
			if ($(this).scrollTop()==0){
				$(this).scrollTop(1);
			}
			var maxScrollHeight = $(this)[0].scrollHeight - $(this).innerHeight();
			if ($(this).scrollTop()>=maxScrollHeight){
				$(this).scrollTop(maxScrollHeight-1);
			}
		});
		
		$("#scrollWrapper").on("touchstart", function(e){
			
			//if (IS_ANDROID) return;
			if (IS_MENUOPEN){
				e.preventDefault();
				return;
			}
			
			window.scrollTo(0, 1);
			$("#header").css({
				left: 0,
				top:  0
			});
			$("#bodyWrapper")
				//.height(window.innerHeight+1)
				.css({
					width:		$(window).innerWidth(),
				});
			$("#scrollWrapper")
				.css('margin-top', $("#header").outerHeight())
				.stop(true, false);
			
			lastScrollWrapperY = $("#scrollWrapper").position().top;
			lastTouchY = [];
			
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
			
			if (isRefreshing==true) return;
			
			if (IS_MENUOPEN){
				e.preventDefault();
				return;
			}
			
			lastTouchY.push(e.originalEvent.targetTouches[0].screenY);
			while(lastTouchY.length>2) lastTouchY.shift();
			
			var distX = touchX - e.originalEvent.targetTouches[0].screenX;
			var distY = touchY - e.originalEvent.targetTouches[0].screenY;
			
			if (swipeSensor==true && swipeMode==false && distX>60){
				swipeMode = true;
				$("#refreshBoxWrapper").stop(true,true).animate({ height: $("#scrollWrapper").css("margin-top")}, "fast", "swing");
			}
			if (swipeMode==true){
				
				if (IS_ANDROID){
					$("#slidemenuWrapper").show(0);
				} else {
					$("#slidemenuWrapper").show(0).height(window.innerHeight).scrollTop(1);
				}
				
				var left = e.originalEvent.targetTouches[0].screenX - touchX;
				if (left>0) left = 0;
				$("#bodyWrapper").css({
					position:	'absolute',
					right:		'auto',
					left:		left,
				});
			} else {
				
				if ($(this).position().top>0){
					$(this).css("top", ((lastScrollWrapperY-distY)/2)+"px");
				} else {
					$(this).css("top", (lastScrollWrapperY-distY)+"px");
				}
				
				if (_self.options.isPullRefresh==true && $(this).position().top>0){
					var h = ($(this).position().top + parseInt($("#scrollWrapper").css("margin-top")))+"px";
					$("#refreshBoxWrapper").css("height", h);
					if ($(this).position().top<60){
						$("#refreshBox").text("Pull to refresh");
						isCanRefresh = false;
					} else {
						$("#refreshBox").text("Release to refresh");
						isCanRefresh = true;
					}
				}
			}
			
			e.preventDefault();
			
		});
		
		$("#scrollWrapper").on("touchend", function(e){
			
			if (IS_MENUOPEN){
				_self.slidemenuOff();
				e.preventDefault();
				return;
			}
			
			if (_self.options.isPullRefresh){
				if (isCanRefresh){
					isRefreshing = true;
					$("#refreshBox").text("loading...");
					
					_self.options.onPullRefresh();
					
					setTimeout(function(){
						isCanRefresh = false;
						$("#scrollWrapper")
							.trigger("touchend")
							.animate({ top: "0px"}, 300, "swing");
					}, 1000);
				} else {
					$("#refreshBoxWrapper")
						.stop(true,false)
						.animate({ height: $(this).css("margin-top")}, 300, "swing", function(){
							isRefreshing = false;
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
				
			} else {
				// 慣性スクロール
				if (lastTouchY.length>=2){
					var dist = lastTouchY[1] - lastTouchY[0];
					if (dist>0){
						dist = dist * dist / 3;
					} else {
						dist = -dist * dist / 3;
					}
					var top = $("#scrollWrapper").position().top + dist;
					$("#scrollWrapper")
						.stop(true, false)
						.animate(
							{top: top+"px"},
							{
								duration: 1000,
								easing: "easeOutCubic",
								step: function(now, fx) {
									if ($("#scrollWrapper").position().top < (-$("#scrollWrapper").outerHeight()+$(window).innerHeight())){
										$("#scrollWrapper")
											.stop(true, false)
											.animate({ top: -$("#scrollWrapper").innerHeight()+$(window).innerHeight() }, 500, "swing");
									} else
									if ($("#scrollWrapper").position().top > 0){
										$("#scrollWrapper")
											.stop(true, false)
											.animate({ top: 0 }, 500, "swing");
									}
								}
							}
						);
				}
			}
		});
		
		$("#scrollWrapper")
			.on("click", function(e){
				if (IS_MENUOPEN){
					e.preventDefault();
				}
			});
		
		// open side navi
		if (_self.options.btnNaviOpen){
			$(_self.options.btnNaviOpen).on("touchend", function(e){
				if (IS_MENUOPEN){
					_self.slidemenuOff();
				} else {
					_self.slidemenuOn();
				}
				e.preventDefault();
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
			
			$("#bodyWrapper")
				.css({
					position:	'absolute',
					right:		'auto',
				})
				.animate({
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
