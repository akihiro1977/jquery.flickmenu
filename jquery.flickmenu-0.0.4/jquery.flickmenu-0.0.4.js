/*
 *  Project: flickmenu - jQuery Plugin
 *  Description: for iOS / Android, flick menu, pull to refresh
 *  Author: Akihiro Koyanagi | http://i-section.net | http://akihiro.jugem.jp
 *  License: GPL
 */

;(function ( $, window, undefined ) {
    
	
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
			menuOpen:    null,
			isPullRefresh:  true,
			onPullRefresh:  function(){},
			fixedHeader:	null,
			isFlickMenu:    true
        }
        this.options = $.extend( {}, defaults, options) ;
		
        this.element = elem;
		
		var _self = this;
		
		// body wrap
		$("body").wrapInner('<div id="fmBodyWrapper"></div>');
		$("#fmBodyWrapper").css({
			width:		$(window).innerWidth(),
			overflow:	"hidden",
			background:	$("body").css("background") || $("body").css("background-color") || "#FFFFFF"
		});
		// ちらつき防止
		$("#fmBodyWrapper").css({
			"-webkit-transform":	"translate3d(0,0,0)",
			"-moz-transform":		"translate(0, 0)"
		});
		if (_self.options.fixedHeader){
			$(_self.options.fixedHeader).css({
				"-webkit-transform":	"translate3d(0,0,0)",
				"-moz-transform":		"translate(0, 0)",
				top:					0,
				left:					0,
				position:				"absolute",
				width:					"100%",
				"z-index":				99999,
			});
		}
		
		// add pull2refresh box
		if (_self.options.isPullRefresh){
			$("body").prepend('<div id="refreshBoxWrapper"><div id="refreshBox"></div></div>');
			$("#refreshBoxWrapper")
				.css({
					position:	"absolute",
					width:		$(window).innerWidth()-20,
					height:		window.innerHeight,
					top:		0,
					left:		10,
					display:	"block",
					"z-index":	99900,
					left:		0,
					top:		0
				})
				.hide(0);
		}

		// add slide menu
		$("body").append('<div id="fmSlidemenuWrapper"><div id="pageslide"></div></div>');
		if (this.element != null){
			// copy menu
			var menu = $(this.element).clone();
			$(this.element).remove();
			$("#fmSlidemenuWrapper #pageslide").append(menu);
			menu.show(0);
		}
		
		// init
		$.flickmenu.prototype.slidemenuInit();
		$("#fmSlidemenuWrapper").hide(0);
		
		$("#fmSlidemenuWrapper a").on("click", function(e){
			if ($(this).attr("href").match(/javascript/i)){
			} else {
				(function(url){
					
					var returnLeft = -$("#fmBodyWrapper").offset().left;
					
					$("#fmBodyWrapper")
						.one("webkitTransitionEnd transitionend",function(){
							$("#fmSlidemenuWrapper").hide(0);
							$(this).fadeOut(200, function(){
								location.href = url;
							})
						})
						.css({
							"-webkit-transition":	"all 0.2s ease-out",
							"-moz-transition":		"all 0.2s ease-out",
							'-webkit-transform':	'translate3d('+returnLeft+'px, 0, 0)',
							'-moz-transform':		'translate('+returnLeft+'px, 0)'
						});
				})($(this).attr("href"));
				
				e.preventDefault();
			}
		});
		
		
		setTimeout(function(){
			window.scrollTo(0, 0);
			if (_self.options.fixedHeader){
				$(_self.options.fixedHeader)
					.css({
						"-webkit-transition":	"all 0s",
						"-moz-transition":		"all 0s",
						'-webkit-transform':	'translate3d(0, 0, 0)',
						'-moz-transform':		'translate(  0, 0px)',
					});
			}
		}, 100);
		
		
		
		$("#fmSlidemenuWrapper").on("scroll", function(e){
			if ($(this).scrollTop()==0){
				$(this).scrollTop(1);
			}
			var maxScrollHeight = $(this)[0].scrollHeight - $(this).innerHeight();
			if ($(this).scrollTop()>=maxScrollHeight){
				$(this).scrollTop(maxScrollHeight-1);
			}
		});
		
		
		/*
			-webkit-transform すると ヘッダのposition:fixedが効かなくなるので以下で代用
		*/
		if (_self.options.fixedHeader){
			$(window).on("scroll", function(){
				
				if (scrollTimer) clearTimeout(scrollTimer);
				
				if (
					$(window).scrollTop()>$(_self.options.fixedHeader).outerHeight() ||
					$(_self.options.fixedHeader).offset().top!=0
				){
					scrollTimer = setTimeout(_reviewHeader, 300);
				}
			});
		}
		
		$("#fmBodyWrapper").on("touchstart", function(e){
			
			if (IS_MENUOPEN){
				e.preventDefault();
				return;
			}
			
			$("#fmBodyWrapper")
				.css({
					width:		$(window).innerWidth(),
				});
			
			
			if (isRefreshing==true) return;
			
			if (e.originalEvent){
				touchY = e.originalEvent.targetTouches[0].screenY;
				touchX = e.originalEvent.targetTouches[0].screenX;
			}
			
			if (_self.options.isFlickMenu==true){
				swipeSensor = true;
				setTimeout(function(){
					swipeSensor = false;
				}, 150);
			}
			
			$("#refreshBox").text("Pull to refresh");
			
		});
		
		$("#fmBodyWrapper").on("touchmove", function(e){
			
			if (isRefreshing==true) return;
			
			if (IS_MENUOPEN){
				e.preventDefault();
				return;
			}
			
			var distX = touchX - e.originalEvent.targetTouches[0].screenX;
			var distY = touchY - e.originalEvent.targetTouches[0].screenY;
			
			if (swipeSensor==true && swipeMode==false && distX>60 && distY<60){
				swipeMode = true;
				_hideRefreshBox();
				//_reviewHeader();
				if (_self.options.fixedHeader){
					$(_self.options.fixedHeader)
						.css({
							"-webkit-transition":	"all 0s",
							"-moz-transition":		"all 0s",
							'-webkit-transform':	'translate3d(0, 0, 0)',
							'-moz-transform':		'translate(  0, 0)',
							position:	"absolute",
							top:		$(window).scrollTop(),
						});
				}
			}
			if (swipeMode==true){
				
				//myConsoleLog("swipeMode:true");
				
				$.flickmenu.prototype.slidemenuInit();
				
				var left = e.originalEvent.targetTouches[0].screenX - touchX;
				if (left>0) left = 0;
				$("#fmBodyWrapper")
					.css({
						margin:					0,
						"-webkit-transition":	"all 0.01s ease-out",
						"-moz-transition":		"all 0.01s ease-out",
						'-webkit-transform':	'translate3d('+left+'px, 0, 0)',
						'-moz-transform':		'translate('  +left+'px, 0)'
					});
				
				e.preventDefault();
				
			} else
			if (_self.options.isPullRefresh==true && $(window).scrollTop()<=0 && distY<0 && _self.options.fixedHeader){
				// refreshBox
				
				var h = -parseInt(distY/3);
				var h2 = -$("#refreshBoxWrapper").outerHeight() + $(_self.options.fixedHeader).outerHeight() + h - 10;// 10:shadow
				
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
					_self.options.fixedHeader &&
					( $(window).scrollTop()>$(_self.options.fixedHeader).outerHeight() || $(_self.options.fixedHeader).offset().top!=0 )
				){
					
					//myConsoleLog("header hide");
					
					$(_self.options.fixedHeader)
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
		
		$("#fmBodyWrapper").on("touchend", function(e){
			
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
						$("#fmBodyWrapper").trigger("touchend");
					}, 1000);
				} else 
				if (swipeMode!=true){
					_hideRefreshBox(function(){
						isRefreshing = false;
					});
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
		
		$("#fmBodyWrapper")
			.on("click", function(e){
				if (IS_MENUOPEN){
					e.preventDefault();
				}
			});
		
		// open side navi
		if (_self.options.menuOpen){
			$(_self.options.menuOpen).on("touchend", function(e){
				if (IS_MENUOPEN){
					_self.slidemenuOff();
				} else {
					_self.slidemenuOn();
				}
				e.preventDefault();
				e.stopPropagation();
			});
		}
		
		_reviewHeader = function(){
			
			if (_self.options.fixedHeader){
				$(_self.options.fixedHeader)
					.one("webkitTransitionEnd transitionend",function(){
						$(_self.options.fixedHeader)
							.css({
								"-webkit-transition":	"all 0.1s ease-out",
								"-moz-transition":		"all 0.1s ease-out",
								'-webkit-transform':	'translate3d(0, '+$(_self.options.fixedHeader).outerHeight()+'px, 0)',
								'-moz-transform':		'translate(  0, '+$(_self.options.fixedHeader).outerHeight()+'px)',
							});
					})
					.css({
						"-webkit-transition":	"all 0.01s",
						"-moz-transition":		"all 0.01s",
						'-webkit-transform':	'translate3d(0, 0, 0)',
						'-moz-transform':		'translate(  0, 0)',
						position:	"absolute",
						top:		$(window).scrollTop() - $(_self.options.fixedHeader).outerHeight(),
					});
			}
		};
		
		_hideRefreshBox = function(callback){
			
			//myConsoleLog("_hideRefreshBox()");
			if (_self.options.fixedHeader){
				var y = -$("#refreshBoxWrapper").outerHeight() + $(_self.options.fixedHeader).outerHeight() - 10;//10:shadow
				
				$("#refreshBoxWrapper:visible")
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
			}
		};
		
	}
	
	$.extend( $.flickmenu.prototype , {
		slidemenuOn : function(){
			
			IS_MENUOPEN = true;
			
			$.flickmenu.prototype.slidemenuInit();
			
			$("#fmBodyWrapper")
				.one("webkitTransitionEnd transitionend",function(){
					$("#fmBodyWrapper")
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
							left: 					-$("#fmSlidemenuWrapper").width(),
							right:					"auto",
							top:					0
						});
					/*
					if (_self.options.fixedHeader){
						$(_self.options.fixedHeader)
							.css({
								"-webkit-transition":	"all 0s",
								"-moz-transition":		"all 0s",
								'-webkit-transform':	'translate3d(0, 0, 0)',
								'-moz-transform':		'translate(  0, 0)',
								position:	"absolute",
								top:		$(window).scrollTop(),
							});
					}
					*/
					// 念押し
					$.flickmenu.prototype.slidemenuInit();
					
				})
				.css({
					margin: 0,
					left:	0,
					"-webkit-transition":	"all 0.2s ease-out",
					"-moz-transition":		"all 0.2s ease-out",
					'-webkit-transform':'translate3d(-'+$("#fmSlidemenuWrapper").width()+'px, 0, 0)',
					'-moz-transform':	'translate(-'  +$("#fmSlidemenuWrapper").width()+'px, 0)'
				});
			
		},
		slidemenuOff : function(type){
			
			var returnLeft;
			if (type==2){
				// スワイプで開いた時
				returnLeft = 0;
			} else {
				// ボタンで開いた時
				returnLeft = -$("#fmBodyWrapper").offset().left;
			}
			
			$("#fmBodyWrapper")
				.one("webkitTransitionEnd transitionend",function(){
					
					$("#fmSlidemenuWrapper").hide(0);
					
					$("#fmBodyWrapper")
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
					/*
					if (_self.options.fixedHeader){
						$(_self.options.fixedHeader)
							.css({
								"-webkit-transition":	"all 0s",
								"-moz-transition":		"all 0s",
								'-webkit-transform':	'translate3d(0, 0, 0)',
								'-moz-transform':		'translate(  0, 0)',
								position:	"absolute",
								top:		$(window).scrollTop(),
							});
					}
					*/
					IS_MENUOPEN = false;
					
				})
				.css({
					"-webkit-transition":	"all 0.2s ease-out",
					"-moz-transition":		"all 0.2s ease-out",
					'-webkit-transform':	'translate3d('+returnLeft+'px, 0, 0)',
					'-moz-transform':		'translate('+returnLeft+'px, 0)'
				});
			
		},
		slidemenuInit : function(){
			$("#fmSlidemenuWrapper").show(0, function(){
//				setTimeout(function(){
					$("#fmSlidemenuWrapper")
						.css({
							display:						"block",
							"z-index":						-9999,
							position:						"absolute",
							left:							"auto",
							top:							0,
							right:							0,
							height:							window.innerHeight,
							"-webkit-touch-callout":		"none",
							"-moz-touch-callout":			"none",
							"touch-callout":				"none",
							"overflow-y":					"scroll",
							"-webkit-overflow-scrolling":	"touch",
							"overflow-scrolling":			"touch",
							"margin-top":					$(window).scrollTop()
						}).
						scrollTop(1);
					$("#fmSlidemenuWrapper #pageslide")
						.css({
							display:	"block",
							width:		$("#fmSlidemenuWrapper").width(),
							padding:	0,
							color:		"#C9BEAA",
							"font-size":"15px",
							"min-height": $("#fmSlidemenuWrapper").innerHeight()+2
						});
//				}, 0);
			});
		}
	});
	
	
    $.fn.flickmenu = function ( options ) {
        return this.each(function () {
			new $.flickmenu( this , options);
        });
    };

}(jQuery, window));
