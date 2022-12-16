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

    var that = this
	, videoForm = this.videoUiCreate(content, m) // 비디오 UI 생성
    , videoLoading = this.loadingUiCreate({ cont : content }); // 로딩바 생성

    // 전역적으로 사용하기 위한 변수(버튼 요소)
	this.videoForm = videoForm; // 생성된 video
    this.content = $(content); // 전체 영역

    // 로딩 시작
	$(this.videoForm).off("seeking");
	$(this.videoForm).on("seeking", function(){
		videoLoading.addClass("py_loading_spinner_active").show();
	});

	// 로딩 끝
	$(this.videoForm).off("seeked");
	$(this.videoForm).on("seeked", function(){
		videoLoading.removeClass("py_loading_spinner_active").hide();
	});

    // video 초기 로딩이 완료된 후
	$(this.videoForm).off("loadedmetadata");
	$(this.videoForm).on("loadedmetadata", function(){
		// 타이틀 적용
		that.title.text( that.opt.playList[that.playCount].title );

		// 비디오 로드후 초기작업
		that.initAction({ wrap : content });
	});

    // video 재생중일때
	$(this.videoForm).off("playing");
	$(this.videoForm).on("playing", function(){
		$(content).addClass("py_playing");
	});

    // video 재생시간이 변화가 있을경우 실행
	$(this.videoForm).off("timeupdate");
	$(this.videoForm).on("timeupdate", function(){
		
	});

    // video 재생이 완료됐을경우
	$(this.videoForm).off("ended");
	$(this.videoForm).on("ended", function(){
		
	});
}
// 프로토타입
PlayerCustomizing.prototype = {
	// 초기 작업
	initAction : function(m){
        console.log("시작");
    },
    // video 생성
	videoUiCreate : function(content, m){
		// 타이틀 생성
		$("<h1 />").addClass("py_title").text( this.opt.playList[this.playCount].title ).appendTo( $(content) );

		// 비디오 생성
		var $video = $("<video />", { "name" : "media", "autoplay" : true })
			.append(
				$("<source />")
			);
		$video.appendTo( $(content) );

		// 컨트럴 박스 생성 여부
		if( this.opt.controlUse ){
			// 컨트럴 박스 전체 영역
			var $controlBox = $("<div />").addClass("py_controlbox_wrap");

			// 재생 상태바(모바일)
			if( this.deviceVersionCheck() === "mobile" ){
				// 재생 상태바 영역
				var $playprogress = $("<div />").addClass("py_playprogress_control")
					.append(
						$("<div />").addClass("py_current_time").text("00:00")
					)
					.append(
						$("<div />").addClass("py_progress_bar")
							.append(
								$("<div />").addClass("py_progress_bar_box")
									.append(
										$("<div />").addClass("py_play_progress")
											.append(
												$("<div />").addClass("py_tooltip")
													.append(
														$("<span />").addClass("py_tooltip_time").text("00:00")
													)
											)
									)
							)
					)
					.append(
						$("<div />").addClass("py_duration_time").text("00:00")
					)
					.appendTo( $controlBox );
			} else { // 재생 상태바(웹)
				// 재생 상태바 영역
				var $playprogress = $("<div />").addClass("py_playprogress_control")
					.append(
						$("<div />").addClass("py_progress_bar")
							.append(
								$("<div />").addClass("py_progress_bar_box")
									.append(
										$("<div />").addClass("py_play_progress")
											.append(
												$("<div />").addClass("py_tooltip")
													.append(
														$("<span />").addClass("py_tooltip_time").text("00:00")
													)
											)
									)
							)
					)
					.appendTo( $controlBox );
			}

			// 리스트 시간 썸네일이 있을경우
			if( this.opt.playList[0].timeSumImg ){
				$("<div />").addClass("py_tooltip")
					.append(
						$("<span />").addClass("py_tooltip_time").text("00:00")
					).appendTo( $playprogress.find(".py_play_progress") );
			}

			// 재생, 정지 버튼
			var $btnPlay = $("<button />", { type : "button" }).addClass("py_play_control py_play")
				.append(
					$("<span />").addClass("py_play_control_icon")
				)
				.append(
					$("<span />").addClass("py_play_control_text")
				);

			// 일정부분 건너뛰기 기능
			if( this.opt.overTimeUse ){
				var $btnPrevMove = $("<button />", { type : "button" }).addClass("py_prev_control")
					.append(
						$("<span />").addClass("py_prev_control_icon")
					)
					.append(
						$("<span />").addClass("py_prev_control_text").text( this.opt.overTimeUse )
					);

				var $btnNextMove = $("<button />", { type : "button" }).addClass("py_next_control")
					.append(
						$("<span />").addClass("py_next_control_icon")
					)
					.append(
						$("<span />").addClass("py_next_control_text").text( this.opt.overTimeUse )
					);
			}

			// 볼륨 기능
			var $volumePanel = $("<div />").addClass("py_volume_panel")
				.append(
					$("<button />", { type : "button" }).addClass("py_mute_control")
						.append(
							$("<span />").addClass("py_mute_control_icon")
						)
						.append(
							$("<span />").addClass("py_mute_control_text")
						)
				)
				.append(
					$("<div />").addClass("py_volume_bar")
						.append(
							$("<div />").addClass("py_volume_level")
								.append(
									$("<span />").addClass("py_volume_level_icon")
								)
						)
				);

			// 웹, 타블렛
			if( this.deviceVersionCheck() !== "mobile" ){
				// 재생시간 및 총시간
				var $playTimeForm = $("<div />").addClass("py_time_panel")
					.append(
						$("<span />").addClass("py_current_time").text("00:00")
					)
					.append(" / ")
					.append(
						$("<span />").addClass("py_duration_time").text("00:00")
					);
			}

			// 다음화 및 시리즈 목록 버튼 영역
			if( this.opt.playList.length > 1 ){
				// 다음화 버튼
				var $btnNextLink = $("<button />").addClass("py_listNext_control")
					.append(
						$("<span />").addClass("py_listNext_control_icon")
					)
					.append(
						$("<span />").addClass("py_listNext_control_text")
					);

				// 리스트 목록 버튼
				var $btnSeries = $("<button />").addClass("py_listSeries_control")
					.append(
						$("<span />").addClass("py_listSeries_control_icon")
					)
					.append(
						$("<span />").addClass("py_listSeries_control_text")
					);

				// 리스트 목록
				var $seriesList = $("<div />").addClass("py_series_list")
					.append(
						$("<div />").addClass("py_series_list_in")
							.append(
								$("<h2 />").addClass("py_list_title")
									.append(
										$("<img />", { src : "./image/py_list_title.gif", alt : "목록보기" })
									)
							)
							.append(
								$("<div />").addClass("py_series_scroll")
									.append(
										$("<ul />")
									)
							)
					);

				for( var i=0; i<this.opt.playList.length; i++ ){
					var $li = $("<li />")
						.append(
							$("<div />").addClass("unit")
								.append(
									$("<a />", { href : "#" })
										.append(
											$("<div />").addClass("sumnail")
												.append(
													$("<img />", { src : this.opt.playList[i].sumImg, alt : "" })
												)
										)
										.append(
											$("<div />").addClass("content")
												.append(
													$("<p />").addClass("tit").text( this.opt.playList[i].title )
												)
												.append(
													$("<p />").addClass("counting")
														.append(
															$("<span />").addClass("current_time").text( this.timeCalculate(this.opt.playList[i].cTime) )
														)
														.append( " / " )
														.append(
															$("<span />").addClass("last_time").text( this.opt.playList[i].lTime )
														)
												)
										)
								)
						)

						// 모바일
						if( this.deviceVersionCheck() === "mobile" ){
							$li.find(".sumnail").append(
								$("<span />").addClass("seekbar")
									.append(
										$("<span />")
									)
							)
						} else { // 웹, 타블릿
							$li.find(".content").append(
								$("<span />").addClass("seekbar")
									.append(
										$("<span />")
									)
							)
							$li.find(".tit").after( $li.find(".seekbar") );
						}
						$li.appendTo( $seriesList.find("ul") )
				}

				// 닫기 버튼
				$seriesList.append(
					$("<p />").addClass("close")
						.append(
							$("<a />", { href : "#" })
								.append( "닫기" )
						)
				)

				$seriesList.appendTo( $(content) );
			}

			// 전체화면 확대 기능
			var $btnFullscreen = $("<button />").addClass("py_fullscreen_control")
				.append(
					$("<span />").addClass("py_fullscreen_control_icon")
				)
				.append(
					$("<span />").addClass("py_fullscreen_control_text")
				);

			// 모바일 체크
			if( this.deviceVersionCheck() === "mobile" ){
				// 기능별 영역
				var $listMControll = $("<div />").addClass("py_list_m_control");
				$listMControll.appendTo( $controlBox );

				// 재생, 정지 버튼
				$btnPlay.appendTo( $(content) );

				// 일정부분 건너뛰기 기능
				if( this.opt.overTimeUse ){
					$(content).append(
						$btnPrevMove,
						$btnNextMove
					);
				}

				// 볼륨
				$volumePanel.appendTo( $listMControll );

				// 다음화 및 시리즈 목록 버튼 영역
				if( this.opt.playList.length > 1 ){
					// 다음화 버튼
					$btnNextLink.appendTo( $listMControll );

					// 리스트 목록 버튼
					$btnSeries.appendTo( $listMControll );
				}

				// 전체화면 확대 기능
				$btnFullscreen.appendTo( $listMControll );

				$controlBox.appendTo( $(content) );
			} else {
				// 재생 레이어바
				$("<div />").addClass("py_btn_playing")
					.append(
						$("<a />", { href : "#"})
					)
					.appendTo( $(content) );

				// 기능별 영역
				var $funcControll = $("<div />").addClass("py_func_control"); //py_listseries_wrap
				var $listControll = $("<div />").addClass("py_list_control"); //py_listseries_wrap
				$funcControll.appendTo( $controlBox );
				$listControll.appendTo( $controlBox );

				// 재생, 정지 버튼
				$btnPlay.appendTo( $funcControll );

				// 일정부분 건너뛰기 기능
				if( this.opt.overTimeUse ){
					// 이전버튼
					$btnPrevMove.appendTo( $funcControll );
					// 다음버튼
					$btnNextMove.appendTo( $funcControll );
				}

				// 볼륨 기능
				$volumePanel.appendTo( $funcControll );

				// 재생시간 및 총시간
				$playTimeForm.appendTo( $funcControll );

				// 다음화 및 시리즈 목록 버튼 영역
				if( this.opt.playList.length > 1 ){
					// 다음화 버튼
					$btnNextLink.appendTo( $listControll );

					// 리스트 목록 버튼
					$btnSeries.appendTo( $listControll );
				}

				// 전체화면 확대 기능
				$btnFullscreen.appendTo( $listControll );

				$controlBox.appendTo( $(content) );
			}
		}

		// 닫기 버튼
		$("<p />").addClass("py_btn_close")
			.append(
				$("<a />", { href : "#" }).text("닫기")
			)
			.appendTo( $(content) );

		return $video[0];
	},
    // 데이터 로딩바
	loadingUiCreate : function(m){
		var $spinner = $("<div />").addClass("py_loading_spinner")
			.appendTo( $(m.cont) );

		return $spinner;
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