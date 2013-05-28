/**
 *
 */

'use strict';

(function(jQuery) {

	jQuery('#header')
	.css('position', 'relative')
	;
	jQuery('#footer')
	.css('position', 'relative')
	;

	jQuery('body').append(
		'<div id="screennavi">'
		+'<div id="navitab"><a href="" onclick="jQuery(\'#screennavi\').tabToggle();return false;">◇ 閉じる</a></div>'
		+'<div id="marker"><img src="indi.gif" alt="読み込み中..." width="10" height="10" /> 読み込み中...</div>'
		+'<div id="sort_div"><input id="sort1" type="radio" name="sort" onchange="jQuery(\'#map_archives\').markerToggle(undefined);return false;" checked><a href="" onclick="jQuery(\'#map_archives\').sortToggle();return false;">時間順</a> <input id="sort2" type="radio" name="sort" onchange="jQuery(\'#map_archives\').markerToggle(undefined);return false;"><a href="" onclick="jQuery(\'#map_archives\').sortToggle();return false;">距離順</a></div>'
		+'<div id="search_div"><input id="search_button" type="button" value="周辺を再検索" onclick="jQuery(\'#map_archives\').markerToggle(undefined);return false;" disabled="disabled" /></div>'
		+'<div id="polyline_div"><input id="polyline" type="checkbox" onchange="jQuery(\'#map_archives\').polylineToggle();return false;"> <a href="" onclick="document.getElementById(\'polyline\').checked=(document.getElementById(\'polyline\').checked==true)?false:true;jQuery(\'#map_archives\').polylineToggle();return false;">ポリライン表示</a></div>'
		+'<div id="current_div"><input id="current_button" type="button" value="現在地に移動" onclick="jQuery(\'#map_archives\').getCurrentPosition();return false;"></div>'
		+'<div><input id="screen" type="checkbox" onchange="jQuery(\'#map_archives\').screenToggle();return false;"> <a href="" onclick="document.getElementById(\'screen\').checked=(document.getElementById(\'screen\').checked==true)?false:true;jQuery(\'#map_archives\').screenToggle();return false;">全画面表示</a></div>'
		+'</div>'
	);
	jQuery('#sort_div').hide();
	jQuery('#search_div').hide();
	jQuery('#polyline_div').hide();
	jQuery('#sidenavi')
	.css('position', 'fixed')
	.css('background', '#cccccc')
	.css('padding', '5px')
	.css('top', '50%')
	.css('right', '0px')
	.css('z-index', '2000')
	.css('opacity', '0.9')
	.css('filter', 'alpha(opacity=90)')
	;
	jQuery('#screennavi')
	.css('position', 'fixed')
	.css('background', '#cccccc')
	.css('padding', '5px')
	.css('bottom', '0px')
	.css('right', '0px')
	.css('z-index', '2000')
	.css('opacity', '0.9')
	.css('filter', 'alpha(opacity=90)')
	;

	var thisElem = jQuery('#map_archives');
	var myLatlng = new google.maps.LatLng(35.681597,139.766092);
	var myOptions = {
		zoom: 13,
		center: myLatlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
	};
	var map = new google.maps.Map(document.getElementById('map_archives'), myOptions);
	var polyPath = new google.maps.Polyline({
		path: [],
		strokeColor: "#FF0000",
		strokeOpacity: 1.0,
		strokeWeight: 2,
	});
	polyPath.setMap(map);
	var pathCnt = 0;
	var preInfowindow = new google.maps.InfoWindow();
	var preMarker = new google.maps.Marker();
	var markerList = new google.maps.MVCArray();
	var infowindowList = new google.maps.MVCArray();
	var orgSize = {
		width: thisElem.css('width'),
		height: thisElem.css('height'),
		zindex: thisElem.css('z-index'),
	};
	var selectTerm = "0-0";
	var selectForm = undefined;
	var itemData = [];

	jQuery.ajax({
		url: '<$mt:BlogURL$>archives_jsonp.php',
		dataType: 'jsonp',
		callback: 'callback',
                timeout: 5000,
		success: function(data, status){
			itemData = data;
			thisElem.loadMarker();
		},
		error: function(xhr, status, errorThrown) {jQuery('#marker').empty();}
	});

	jQuery.fn.loadMarker = function() {
		var items = itemData["items"];
		var yearMonthMap = new Array();
		var centerLatlng = undefined;
		var directQueryValueLatLng = undefined;
		if(location.search){
			var query = location.search;
			query = query.substring(1, query.length);
			var querys = new Array();
			querys = query.split("&");
			for(var i=0; i<querys.length; i++){
				var pram = new Array();
				pram = querys[i].split("=");
				var name = pram[0];
				var value = pram[1];
				if(name=="q" && value!="") {
					directQueryValueLatLng = new google.maps.LatLng(value.split(",")[0], value.split(",")[1]);
					if(selectForm==undefined) selectTerm = "3-3";
					break;
				}
			}
		}
		if(jQuery('#sort1').is(':checked')==true) {
			items.sort(function(a, b) {
			//	return (a["date"] < b["date"])?1:-1;
				return (a["year"]+a["month"]+a["date"] < b["year"]+b["month"]+b["date"])?1:-1;
			});
		} else {
			items.sort(function(a, b) {
				var centerLatlng = map.getCenter();
				var aCheckLat = centerLatlng.lat()-a["latlng"].split(",")[0];
				var aCheckLng = centerLatlng.lng()-a["latlng"].split(",")[1];
				var aCheckDistance = Math.sqrt(Math.pow(aCheckLat, 2)+Math.pow(aCheckLng, 2));
				var bCheckLat = centerLatlng.lat()-b["latlng"].split(",")[0];
				var bCheckLng = centerLatlng.lng()-b["latlng"].split(",")[1];
				var bCheckDistance = Math.sqrt(Math.pow(bCheckLat, 2)+Math.pow(bCheckLng, 2));
				return aCheckDistance-bCheckDistance;
			});
		}
		var seq = 0;
		for(var i = 0; i < items.length; i++) {
			var item = items[i];
			if(item["latlng"]==",") {
				continue;
			}
			if(yearMonthMap[item["year"]+"-"+item["month"]]==undefined) {
				yearMonthMap[item["year"]+"-"+item["month"]] = 1;
			} else {
				yearMonthMap[item["year"]+"-"+item["month"]]++;
			}
			var itemContent = "<div style=\"height:80px; width:200px; overflow:auto;\">";
			itemContent += "<div>[ <a href=\"\" onclick=\"jQuery(this).slideMarker("+(seq+1)+");return false;\">←</a> ] [ <a href="" onclick=\"jQuery(this).slideMarker("+(seq-1)+");return false;\">→</a> ]</div>";
			itemContent += "<a href=\""+item["link"]+"\" target=\"_blank\"><img class=\"asset-img-thumb\" src=\""+item["thumbnail"]+"\" height=\"45\" width=\"45\" alt=\""+item["title"]+"\" title=\""+item["title"]+"\" /></a>";
			itemContent += "<a href=\""+item["link"]+"\" target=\"_blank\">"+item["title"]+"</a><br />";
			itemContent += item["date"]+"<br />";
			itemContent += item["body"]+"...";
			itemContent += "</div>";
			if(selectTerm!=undefined && (selectTerm=="0-0" || selectTerm=="4-4" || selectTerm=="1-1" || selectTerm==item["year"]+"-"+item["month"] || selectTerm=="3-3")) {
				var itemLatlng = new google.maps.LatLng(item["latlng"].split(",")[0], item["latlng"].split(",")[1]);
				if(centerLatlng==undefined) centerLatlng = itemLatlng;
				if(selectTerm=="3-3") {
					if(directQueryValueLatLng!=undefined && directQueryValueLatLng.lat()==itemLatlng.lat() && directQueryValueLatLng.lng()==itemLatlng.lng()) {
						alert(i+" "+seq);
						jQuery.createMarker(itemLatlng, item["title"], itemContent, seq);
						if(selectForm==undefined) {
							jQuery('title').append(": "+item["title"]);
							jQuery('.archive-header').append(": "+item["title"]);
						}
					}
				} else if(!(selectTerm=="0-0" && i>=10) && !(selectTerm=="4-4" && i>=100)) {
					jQuery.createMarker(itemLatlng, item["title"], itemContent, seq);
				}
			}
			seq++;
		}
		map.panTo(centerLatlng);
		if(selectForm==undefined) {
			var selectFormBuf = '';
			var allCnt = 0;
			for (var k in yearMonthMap) {
				selectFormBuf += "<option value=\""+k+"\">"+k.split("-")[0]+"年"+k.split("-")[1]+"月（"+yearMonthMap[k]+"）</option>";
				allCnt += yearMonthMap[k];
			}
			selectForm = "";
			selectForm += "<select onchange=\"jQuery(this).markerToggle(this[this.selectedIndex].value);return false;\">";
			if(directQueryValueLatLng!=undefined) selectForm += "<option value=\"3-3\">リンク地点</option>";
			selectForm += "<option value=\"0-0\">直近10件</option>";
			selectForm += "<option value=\"4-4\">直近100件</option>";
			selectForm += selectFormBuf;
			selectForm += "<option value=\"1-1\">全マーク（"+allCnt+"）</option><option value=\"2-2\">全て削除</option></select>";
			jQuery('#marker').empty().append(selectForm);
		}
		if(selectTerm!=undefined && selectTerm=="3-3") {
			if(directQueryValueLatLng!=undefined) {
				jQuery.directMarker(directQueryValueLatLng);
			}
			jQuery('#sort_div').hide('fast');
			jQuery('#search_div').hide('fast');
			jQuery('#polyline_div').hide('fast');
		} else {
			jQuery('#sort_div').show('fast');
			jQuery('#search_div').show('fast');
			jQuery('#polyline_div').show('fast');
		}
	};

	jQuery.createMarker = function(latlng, title, content, zIn) {
		var marker = new google.maps.Marker({
				position: latlng,
				map: map,
				title: title,
				zIndex: zIn
		});
		var contentBuf = content;
		for(var i=0; i<markerList.length; i++) {
			if(markerList.getAt(i).getPosition()==latlng) {
				contentBuf += infowindowList.getAt(i).getContent();
				break;
			}
		}
		var infowindow = new google.maps.InfoWindow({
			content: contentBuf,
			zIndex: 10000
		});
		google.maps.event.addListener(marker, 'click', function() {
			preInfowindow.close();
			if(preMarker.getPosition()
			&& preMarker.getPosition().equals(marker.getPosition())
			&& preMarker.getPosition().equals(marker.getPosition())) {
				preMarker = new google.maps.Marker();
				return false;
			}
			infowindow.open(map, marker);
			preInfowindow = infowindow;
			preMarker = marker;
		});
		if(jQuery('#polyline').is(':checked')==true) polyPath.getPath().insertAt(pathCnt++, latlng);
		markerList.push(marker);
		infowindowList.push(infowindow);
	};

	jQuery.fn.sortToggle = function() {
		if(jQuery('#sort1').is(':checked')==true) {
			jQuery('#sort2').prop('checked', true);
			jQuery('#search_button').attr('disabled', false);
			jQuery('#search_button').removeAttr('disabled');
		} else {
			jQuery('#sort1').prop('checked', true);
			jQuery('#search_button').attr('disabled', true);
		}
		jQuery(this).markerToggle(undefined);
	};

	jQuery.fn.markerToggle = function(term) {
		if(term!=undefined) selectTerm = term;
		while(markerList.getLength()>0) markerList.pop().setVisible(false);
		while(infowindowList.getLength()>0) infowindowList.pop().close();
		var path = polyPath.getPath();
		while(path.getLength()>0) path.pop();
		if(selectTerm!="2-2") jQuery(this).loadMarker();
	};

	jQuery.fn.polylineToggle = function() {
		if(jQuery('#polyline').is(':checked')==true) {
			if(markerList.getLength()<=0) {
				jQuery(this).loadMarker();
			}
			for(var i=0; i<markerList.getLength(); i++) {
				var latlng = markerList.getAt(i).getPosition();
				polyPath.getPath().insertAt(i+1, latlng);
			}
		} else {
			var path = polyPath.getPath();
			while(path.getLength()>0) path.pop();
		}
	};

	jQuery.fn.screenToggle = function() {
		if(jQuery('#screen').is(':checked')==true) {
			var latlng = map.getCenter();
			thisElem.css('position', 'fixed');
			thisElem.css('top', '0px');
			thisElem.css('left', '0px');
			thisElem.css('width', '100%');
			thisElem.css('height', '100%');
			//thisElem.css('z-index', '1');
			google.maps.event.trigger(map, 'resize');
			map.panTo(latlng);
		} else {
			var latlng = map.getCenter();
			thisElem.css('position', 'relative');
			thisElem.css('width', orgSize['width']);
			thisElem.css('height', orgSize['height']);
			//thisElem.css('z-index', orgSize['zindex']);
			google.maps.event.trigger(map, 'resize');
			map.panTo(latlng);
		}
	};

	jQuery.fn.tabToggle = function() {
		if(jQuery('#screennavi').css('right')=='0px') {
				jQuery('#screennavi').animate({right: '-'+(jQuery('#screennavi').width()-50)+'px', bottom: '-'+(jQuery('#screennavi').height()-17)+'px'}, 200);
				jQuery('#navitab a').text('◆ 開く');
		} else {
				jQuery('#screennavi').animate({right: '0px', bottom: '0px'}, 200);
				jQuery('#navitab a').text('◇ 閉じる');
		}
	};

	jQuery.fn.slideMarker = function(zIn) {
		var minZIn = markerList.getAt(0).getZIndex();
		var maxZIn = markerList.getAt(markerList.length-1).getZIndex();
		if(zIn<minZIn) zIn = maxZIn;
		else if(maxZIn<zIn) zIn = minZIn;
		for(var i=0; i<markerList.length; i++) {
			if(markerList.getAt(i).getZIndex()==zIn) {
				preInfowindow.close();
				var marker = markerList.getAt(i);
				var infowindow = infowindowList.getAt(i);
				infowindow.open(map, marker);
				map.panTo(marker.getPosition());
				preInfowindow = infowindow;
				preMarker = marker;
				break;
			}
		}
	};

	jQuery.directMarker = function(latlng) {
		for(var i=0; i<markerList.length; i++) {
			if(markerList.getAt(i).getPosition().lat()==latlng.lat()
				&& markerList.getAt(i).getPosition().lng()==latlng.lng()) {
				preInfowindow.close();
				var marker = markerList.getAt(i);
				var infowindow = infowindowList.getAt(i);
				infowindow.open(map, marker);
				map.panTo(marker.getPosition());
				preInfowindow = infowindow;
				preMarker = marker;
				break;
			}
		}
	};

	jQuery.fn.getCurrentPosition = function() {
		jQuery('#current_button').attr('disabled', true);
		jQuery('#current_div').append(' <img src="indi.gif" alt="読み込み中..." width="10" height="10" />');
		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			//	var infowindow = new google.maps.InfoWindow({
			//		map: map,
			//		position: pos,
			//		content: '現在地',
			//	});
				map.panTo(pos);
				jQuery('#current_button').attr('disabled', false);
				jQuery('#current_button').removeAttr('disabled');
				jQuery('#current_div > img').remove();
			},
			function() {
				jQuery('#current_button').attr('disabled', false);
				jQuery('#current_button').removeAttr('disabled');
				jQuery('#current_div > img').remove();
			});
		} else {
			jQuery('#current_button').attr('disabled', false);
			jQuery('#current_button').removeAttr('disabled');
			jQuery('#current_div > img').remove();
		}
	};
})(jQuery);
