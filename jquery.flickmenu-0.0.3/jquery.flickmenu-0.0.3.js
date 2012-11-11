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
	
	// スクロールしているかどうかのタイマー
	var scrollTimer;
	// ヘッダ表示タイマー
	var headerTimer;
	
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
		$("#bodyWrapper").css({
			width:		$(window).innerWidth(),
			overflow:	"hidden",
		});
		
		// ちらつき防止
		$("#bodyWrapper, #header").css({
			"-webkit-transform":	"translate3d(0,0,0)",
			"-moz-transform":		"translate(0, 0)",
		});
		
		// contents scroll
		if (_self.options.scrollContents){
			$(_self.options.scrollContents).wrap('<div id="scrollWrapper"></div>');
		}
		
		// add pull2refresh box
		if (_self.options.isPullRefresh){
			$("#header").before('<div id="refreshBoxWrapper"><div id="refreshBox"></div></div>');
			$("#refreshBoxWrapper")
				.css({
					width:		$(window).innerWidth()-20,
					height:		$(window).innerHeight(),
					top:		0,
					left:		10,
				})
				.hide(0);
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
		$("#slidemenuWrapper")
			.height($(window).innerHeight())
			.hide(0);
		$("#slidemenuWrapper #pageslide").height($(window).innerHeight()+1);
		
		
		setTimeout(function(){
			window.scrollTo(0, 0);
			$("#scrollWrapper").css('margin-top', $("#header").outerHeight());
					$("#header")
						.css({
							"-webkit-transition":	"all 0s",
							"-moz-transition":		"all 0s",
							'-webkit-transform':	'translate3d(0, 0, 0)',
							'-moz-transform':		'translate(  0, 0px)',
						});
		}, 100);
		
		
		
		$("#slidemenuWrapper").on("scroll", function(e){
			if ($(this).scrollTop()==0){
				$(this).scrollTop(1);
			}
			var maxScrollHeight = $(this)[0].scrollHeight - $(this).innerHeight();
			if ($(this).scrollTop()>=maxScrollHeight){
				$(this).scrollTop(maxScrollHeight-1);
			}
		});
		
		
		/*
			-webkit-transform すると #headerのposition:fixedが効かなくなるので以下で代用
		*/
		$(window).on("scroll", function(){
			
			if (scrollTimer) clearTimeout(scrollTimer);
			
			if (
				$(window).scrollTop()>$("#header").outerHeight() ||
				$("#header").offset().top!=0
			){
				scrollTimer = setTimeout(_reviewHeader, 300);
			}
		});
		
		
		$("#scrollWrapper").on("touchstart", function(e){
			
			//if (IS_ANDROID) return;
			if (IS_MENUOPEN){
				e.preventDefault();
				return;
			}
			
			if ($(window).scrollTop()<=0){
				window.scrollTo(0, 0);
			}
			
			$("#bodyWrapper")
				.css({
					width:		$(window).innerWidth(),
				});
			$("#scrollWrapper").css('margin-top', $("#header").outerHeight());
			
			
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
			
			var distX = touchX - e.originalEvent.targetTouches[0].screenX;
			var distY = touchY - e.originalEvent.targetTouches[0].screenY;
			
			if (swipeSensor==true && swipeMode==false && distX>60){
				swipeMode = true;
				_hideRefreshBox();
				//_reviewHeader();
					$("#header")
						.css({
							"-webkit-transition":	"all 0s",
							"-moz-transition":		"all 0s",
							'-webkit-transform':	'translate3d(0, 0, 0)',
							'-moz-transform':		'translate(  0, 0)',
							position:	"absolute",
							top:		$(window).scrollTop(),
						});
			}
			if (swipeMode==true){
				
				//myConsoleLog("swipeMode:true");
				
				$("#slidemenuWrapper")
					.show(0)
					.css({
						"margin-top":	$(window).scrollTop(),
					})
					.scrollTop(1);
				
				var left = e.originalEvent.targetTouches[0].screenX - touchX;
				if (left>0) left = 0;
				$("#bodyWrapper")
					.css({
						margin:					0,
						"-webkit-transition":	"all 0.01s ease-out",
						"-moz-transition":		"all 0.01s ease-out",
						'-webkit-transform':	'translate3d('+left+'px, 0, 0)',
						'-moz-transform':		'translate('  +left+'px, 0)'
					});
				
				e.preventDefault();
				
			} else
			if (_self.options.isPullRefresh==true && $(window).scrollTop()<=0 && distY<0){
				
				var h = -parseInt(distY/3);
				var h2 = -$("#refreshBoxWrapper").outerHeight() + $("#header").outerHeight() + h - 10;// 10:shadow
				
				//myConsoleLog("refreshBoxWrapper:"+h);
				//$("#refreshBox").text(h2);
				
				if (h < 60){
					$("#refreshBoxWrapper #refreshBox").text("Pull to refresh");
					isCanRefresh = false;
				} else {
					$("#refreshBoxWrapper #refreshBox").text("Release to refresh");
					isCanRefresh = true;
				}
				
				$("#refreshBoxWrapper").css({
					"-webkit-transition":	"all 0.05s",
					"-moz-transition":		"all 0.05s",
					'-webkit-transform':	'translate3d(0,' + h2 + 'px, 0)',
					'-moz-transform':		'translate(  0,' + h2 + 'px)'
				});
				$("#refreshBoxWrapper:not(:visible)").show(0);
				
				
				e.preventDefault();
				
			} else {
				
				if (
					$(window).scrollTop()>$("#header").outerHeight() ||
					$("#header").offset().top!=0
				){
					
					//myConsoleLog("header hide");
					
					$("#header")
						.css({
							"-webkit-transition":	"all 0s",
							"-moz-transition":		"all 0s",
							'-webkit-transform':	'translate3d(0, 0, 0)',
							'-moz-transform':		'translate(0, 0)',
							top:		0,
						});
				}
				
			}
			
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
					$("#refreshBoxWrapper #refreshBox").text("loading...");
					
					_self.options.onPullRefresh();
					
					setTimeout(function(){
						isCanRefresh = false;
						$("#scrollWrapper").trigger("touchend");
					}, 1000);
				} else 
				if (swipeMode!=true){
					_hideRefreshBox(function(){
						isRefreshing = false;
					});
					//$("#scrollWrapper").animate({"margin-top":$("#header").outerHeight()}, 300, "swing");
				}
			}
			
			if (swipeMode==true){
				swipeMode = false;
				// 1/4程度引っ張ってたらOpen
				var left = e.originalEvent.changedTouches[0].screenX - touchX;
				if (-left > $(window).innerWidth()/4){
					_self.slidemenuOn();
				} else{
					_self.slidemenuOff(2);
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
		
		_reviewHeader = function(){
			
			//myConsoleLog("_reviewHeader()");
			
			//if ($("#header:visible").offset().top==$(window).scrollTop()){
			//	return;
			//}
			
			$("#header")
				.one("webkitTransitionEnd transitionend",function(){
					$("#header")
						.css({
							"-webkit-transition":	"all 0.1s ease-out",
							"-moz-transition":		"all 0.1s ease-out",
							'-webkit-transform':	'translate3d(0, '+$("#header").outerHeight()+'px, 0)',
							'-moz-transform':		'translate(  0, '+$("#header").outerHeight()+'px)',
						});
				})
				.css({
					"-webkit-transition":	"all 0.01s",
					"-moz-transition":		"all 0.01s",
					'-webkit-transform':	'translate3d(0, 0, 0)',
					'-moz-transform':		'translate(  0, 0)',
					position:	"absolute",
					top:		$(window).scrollTop() - $("#header").outerHeight(),
				});
		};
		
		_hideRefreshBox = function(callback){
			
			//myConsoleLog("_hideRefreshBox()");
			var y = -$("#refreshBoxWrapper").outerHeight() + $("#header").outerHeight() - 10;//10:shadow
			
			$("#refreshBoxWrapper")
				.one("webkitTransitionEnd transitionend",function(){
					$("#refreshBoxWrapper").hide(0);
					if (callback) callback();
				})
				.css({
					"-webkit-transition":	"all 0.3s ease-out",
					"-moz-transition":		"all 0.3s ease-out",
					'-webkit-transform':	'translate3d(0,' + y + 'px, 0)',
					'-moz-transform':		'translate(  0,' + y + 'px)'
				});
		};
		
	}
	
	$.extend( $.flickmenu.prototype , {
		slidemenuOn : function(){
			
			IS_MENUOPEN = true;
			
			$("#slidemenuWrapper")
				.show(0, function(){
					$(this)
					.css({
						height:			window.innerHeight,
						"margin-top":	$(window).scrollTop(),
					})
				})
				.scrollTop(1);
			
			
			$("#bodyWrapper")
				.one("webkitTransitionEnd transitionend",function(){
					$("#bodyWrapper")
						.css({
								// リセットするとちらつくためリセットNG
								//'-webkit-transition': '',
								//'-moz-transition': '',
								//'-webkit-transform': '',
								//'-moz-transform':    '',
							//position: 'static',
							//left: 0,
							"-webkit-transition":	"all 0s",
							"-moz-transition":		"all 0s",
							'-webkit-transform':	'translate3d(0, 0, 0)',
							'-moz-transform':		'translate(0, 0)',
							position: 				"absolute",
							left: 					-$("#slidemenuWrapper").outerWidth(),
							right:					"auto",
							top:					0,
						});
					
					$("#header")
						.css({
							"-webkit-transition":	"all 0s",
							"-moz-transition":		"all 0s",
							'-webkit-transform':	'translate3d(0, 0, 0)',
							'-moz-transform':		'translate(  0, 0)',
							position:	"absolute",
							top:		$(window).scrollTop(),
						});
					
					// 念押し
					$("#slidemenuWrapper")
						.css({
							height:			window.innerHeight,
							"margin-top":	$(window).scrollTop(),
						})
						.scrollTop(1);
				})
				.css({
					margin: 0,
					left:	0,
					"-webkit-transition":	"all 0.2s ease-out",
					"-moz-transition":		"all 0.2s ease-out",
					'-webkit-transform':'translate3d(-'+$("#slidemenuWrapper").outerWidth()+'px, 0, 0)',
					'-moz-transform':	'translate(-'  +$("#slidemenuWrapper").outerWidth()+'px, 0)'
				});
			
		},
		slidemenuOff : function(type){
			
			var returnLeft;
			if (type==2){
				// スワイプで開いた時
				returnLeft = 0;
			} else {
				// ボタンで開いた時
				returnLeft = -$("#bodyWrapper").offset().left;
			}
			
			$("#bodyWrapper")
				.one("webkitTransitionEnd transitionend",function(){
					
					$("#slidemenuWrapper").hide(0);
					
					$("#bodyWrapper")
						.css({
								// リセットするとちらつくためリセットNG
								//'-webkit-transition': '',
								//'-moz-transition': '',
								//'-webkit-transform': '',
								//'-moz-transform': '',
							"-webkit-transition":	"all 0s",
							"-moz-transition":		"all 0s",
							'-webkit-transform':	'translate3d(0, 0, 0)',
							'-moz-transform':		'translate(0, 0)',
							position: 'static',
							left: 0,
							margin: 0,
						});
					
					//_reviewHeader();
					$("#header")
						.css({
							"-webkit-transition":	"all 0s",
							"-moz-transition":		"all 0s",
							'-webkit-transform':	'translate3d(0, 0, 0)',
							'-moz-transform':		'translate(  0, 0)',
							position:	"absolute",
							top:		$(window).scrollTop(),
						});
					
					$("#scrollWrapper").css({
						position:		"static",
						"margin-top":	$("#header").outerHeight()
					});
					IS_MENUOPEN = false;
					
				})
				.css({
					"-webkit-transition":	"all 0.2s ease-out",
					"-moz-transition":		"all 0.2s ease-out",
					'-webkit-transform':	'translate3d('+returnLeft+'px, 0, 0)',
					'-moz-transform':		'translate('+returnLeft+'px, 0)'
				});
			
		}
	});
	
	
    $.fn.flickmenu = function ( options ) {
        return this.each(function () {
			new $.flickmenu( this , options);
        });
    };

}(jQuery, window));
