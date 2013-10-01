# jquery.flickmenu

jqeury.flickmenu is a tiny jQuery plugin that you can add a flick-menu and Pull-to-Refresh.

## Demo
[blog that is described.(ja)](http://akihiro.jugem.jp/?eid=291)

## Setup

```html
<body>
<head>
<link href="jquery.flickmenu/jquery.flickmenu.css" rel="stylesheet" type="text/css" />
<script type="text/javascript" src="jquery.flickmenu/jquery.flickmenu-0.0.1.js"></script>
<script type="text/javascript">
$(function(){
	
	$("#orgMenu").flickmenu({
		scrollContents:	"#contents",
		isPullRefresh:	true,
		onPullRefresh:	function(){
			alert("refresh!");
		}
	});
	
});
</script>
</head>
<body>
<div id="header"><a id="btnNavOpen"><img src="jquery.flickmenu/btn-menu.png" alt="Menu" width="37" height="27" /></a>HEADER</div>
<div id="orgMenu" style="display:none;">
  <div class="ttl">title of menu</div>
  <ul class="nav">
    <li class="child"><a href="example.html">menu1</a></li>
    <li class="child"><a href="example.html">menu1</a></li>
    <li class="child"><a href="example.html">menu1</a></li>
    <li class="child"><a href="example.html">menu1</a></li>
    <li class="child"><a href="example.html">menu1</a></li>
    <li class="child"><a href="example.html">menu1</a></li>
    <li class="child"><a href="example.html">menu1</a></li>
    <li class="child"><a href="example.html">menu1</a></li>
    <li class="child"><a href="example.html">menu1</a></li>
    <li class="child"><a href="example.html">menu1</a></li>
    <li class="child"><a href="example.html">menu1</a></li>
  </ul>
  <div class="ttl">title of menu</div>
  <ul class="nav">
    <li class="child"><a href="example.html">menu2</a></li>
    <li class="child"><a href="example.html">menu2</a></li>
    <li class="child"><a href="example.html">menu2</a></li>
    <li class="child"><a href="example.html">menu2</a></li>
    <li class="child"><a href="example.html">menu2</a></li>
  </ul>
</div>
<div id="contents">
  contents
</div>
</body>
</html>
```


## Options

### scrollContents

### btnNaviOpen

### isPullRefresh

### onPullRefresh


