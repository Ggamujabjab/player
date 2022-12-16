// Ajax Script
$.doAjax = function (op) {
    var options = {
        type: "POST",
        async: true,
        timeout: 5000,
        data: {},
        dataType: "json",
        jsonpCallback: false,
        crossDomain: false,
        contentType: false,
        onSuccess: function (response) {
        },
        onFail: function () {
            //alert(msg);
        },
        onBeforeSend: function () {
        },
        onComplete: function () {
        }
    }

    var option = $.extend(options, op);

    return $.ajax({
        type: option.type,
        url: option.url,
        async: option.async,
        data: option.data,
        dataType: option.dataType,
        jsonpCallback: option.jsonpCallback,
        crossDomain: option.crossDomain,
        success: function (response) {
            option.onSuccess(response);
        },
        error: function () {
            option.onFail();
        },
        beforeSend: function () {
            option.onBeforeSend();
        },
        complete: function () {
            option.onComplete();
        }
    });
}

// 플레이어 커스터마이징
$.fn.playerCustomizing = function(m){
	return this.each(function(){
		var $this = $(this)
		, $obj = $this.data("playerCustomizing");

		$obj = new PlayerCustomizing(this, m);
		$this.data("playerCustomizing", $obj);
	});
}
$.playerCustomizing = function(m){
	return $("body").playerCustomizing(m);
}
// 생성자 함수
var PlayerCustomizing = function(content, m){
    // 전역적으로 사용하기 위한 변수
	this.opt = $.extend({}, $.fn.playerCustomizing.default, m || {}); // 옵션
}
// 프로토타입
PlayerCustomizing.prototype = {
	// 초기 작업
	initAction : function(m){
        console.log("시작");
    }
}
// 옵션
$.fn.playerCustomizing.default = {
	playList : [], // 플레이 리스트 목록
	banner_movie : false, // 광고 배너
	controlUse : true, // 컨트럴 기능 사용 여부
	autoplayUse : true, // 자동실행 사용 여부
	overTimeUse : false, // 앞뒤로 일정영역 건너뛰기(flase or 10)
	volumeUse : 1, // 볼륨조절
	initInfo : { // 초기 영화정보( link_idx : idx값, no : 목록 순서값, wp_idx : 구매번호, playTime : 현재 재생시간)
        link_idx : 1,
        no : 1,
        wp_idx : 1,
        playTime : 0,
        nextsrc : null,
        firstPass : 160,
        lastPass : 12
    }
}