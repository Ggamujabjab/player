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
    this.playCount = 0; // 플레이 리스트 카운터

    var that = this
	, videoForm = this.videoUiCreate(content, m) // 비디오 UI 생성
    , videoLoading = this.loadingUiCreate({ cont : content }) // 로딩바 생성
    , bnnrFlag = false
	, $completeLayer;

    // 전역적으로 사용하기 위한 변수(버튼 요소)
	this.videoForm = videoForm; // 생성된 video
    this.content = $(content); // 전체 영역
    this.title = $(".py_title"); // 타이틀
    this.layerPlay = $(".py_btn_playing") // 플레이 레이어
	this.btnPlay = $(".py_play_control"); // 시작, 정지 버튼
	this.btnPrev = $(".py_prev_control"); // 10초전 버튼
	this.btnNext = $(".py_next_control"); // 10초후 버튼
	this.volumePanel = $(".py_volume_panel"); // 볼륨
	this.volumeButton = this.volumePanel.find(".py_mute_control") // 볼륨 버튼
	this.volumeProgBar = this.volumePanel.find(".py_volume_bar") // 볼륨
	this.progCurrentTime = $(".py_current_time"); // 현재시간
	this.controllBox = $(".py_controlbox_wrap") // 컨트럴박스
	this.progressBar = $(".py_progress_bar"); // 재생 상태바
	this.progDurationTime = $(".py_duration_time"); // 완료시간
	this.btnListnext = $(".py_listNext_control"); // 다음화 버튼
	this.btnListseries = $(".py_listSeries_control"); // 리스트 목록 버튼
	this.btnFullscreen = $(".py_fullscreen_control"); // 전체보기 버튼
	this.seriesList = $(".py_series_list") // 리스트 목록 레이어
	this.playerClose = $(".py_btn_close a") // 플레이어 닫기
	// 전역적으로 사용하기 위한 변수(시간 요소)
	this.timeCurrent = 0;
	this.timeDuration = 0;

    // 초기 파일 적용
    $(this.videoForm).attr({ "autoplay" : this.opt.autoplayUse });
    $(this.videoForm).find("source").attr({ src : this.opt.playList[this.playCount].src, type : this.opt.playList[this.playCount].type });
    // 초기 파일 로드
    this.videoForm.load();

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
		that.timeCurrent = this.currentTime;
		that.timeDuration = this.duration ? this.duration : 0;

		// 현재, 최종시간 설정
		if( !isNaN(that.timeCurrent) && !isNaN(that.timeDuration) ){
			that.progCurrentTime.text( that.timeCalculate(that.timeCurrent) );
			that.progDurationTime.text( that.timeCalculate(that.timeDuration) );
		}

		// 현재 시간을 기준으로 하단 프로그래스바 이동
		that.progressBar.find(".py_play_progress").css({ width : that.percentValue({ currentX : that.timeCurrent, totalX : that.timeDuration, progBar : that.progressBar.outerWidth(), type : "px" }) });
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
        var that = this
		, eleContent = m.wrap
		, tooltipActiveFlag = null
		, timer = null
		, touchtime = null
		, dbEventTime = null
		, currentVolume = this.opt.volumeUse
		, evtMoveFlag = false;

        // 초기 볼륨 적용
		this.videoForm.volume = this.opt.volumeUse;
		// 초기 볼륨 UI 적용
		that.volumeSetup({ cutX : this.opt.volumeUse*100, totalX : this.volumeProgBar.outerWidth() });

		// 썸네일 이미지 추가
		if( this.opt.playList[this.playCount].sumImg ){
			// 기존 이미지가 있을경우 삭제
			if( this.progressBar.find(".py_tooltip").find("img").length ){
				this.progressBar.find(".py_tooltip").find("img").remove();
			}

			this.progressBar.find(".py_tooltip")
				.prepend(
					$("<img />", { src : this.opt.playList[this.playCount].timeSumImg, alt : "" })
				);

			tooltipActiveFlag = true;
		}

        // 비디오 전체영역 클릭
		$(this.videoForm).on("click", function(e){
			if( !touchtime ){
				touchtime = true;

				dbEventTime = setTimeout(function(){
					touchtime = false;

					if( timer ){
						clearTimeout( timer );
					}

					// 컨트럴러 활성화 여부
					if( $(eleContent).hasClass("py_user_active") ){
						$(eleContent).removeClass("py_user_active");

						// 재생중
						if( $(eleContent).hasClass("py_playing") ){
							timer = that.userControlFlag({ wrap : eleContent });
						}
					} else {
						$(eleContent).addClass("py_user_active");
					}
				}, 200);
			} else {
				clearTimeout(dbEventTime);

				touchtime = false;

				if( e.originalEvent.pageX >= $(window).width()-Math.floor($(window).width()/2) ){
					// 재생중인지 체크
					if( $(eleContent).hasClass("py_playing") ){
						if( timer ){
							clearTimeout( timer );
						}

						// 컨트럴러 숨김 기능
						timer = that.userControlFlag({ wrap : eleContent });
					}

					if( $(eleContent).hasClass("py_user_active") ){
						$(eleContent).append( that.btnNext );
					}

					that.btnNext.addClass("py_next_control_active");
					setTimeout(() => {
						that.btnNext.removeClass("py_next_control_active");

						if( $(eleContent).hasClass("py_user_active") ){
							that.btnPrev.after( that.btnNext );
						}
					}, 500);

					// 현재시간을 기준으로 10초후으로 적용
					that.videoForm.currentTime = that.videoForm.currentTime + that.opt.overTimeUse;
				} else if( e.originalEvent.pageX <= $(window).width()-(Math.floor($(window).width()/2))) {
					// 재생중인지 체크
					if( $(eleContent).hasClass("py_playing") ){
						if( timer ){
							clearTimeout( timer );
						}

						// 컨트럴러 숨김 기능
						timer = that.userControlFlag({ wrap : eleContent });
					}

					if( $(eleContent).hasClass("py_user_active") ){
						$(eleContent).append( that.btnPrev );
					}

					that.btnPrev.addClass("py_prev_control_active");
					setTimeout(() => {
						that.btnPrev.removeClass("py_prev_control_active");

						if( $(eleContent).hasClass("py_user_active") ){
							that.btnNext.before( that.btnPrev );
						}
					}, 500);

					// 현재시간을 기준으로 10초전으로 적용
					that.videoForm.currentTime = that.videoForm.currentTime - that.opt.overTimeUse;
				}
			}

			return false;
		});

        // 타이틀 마우스 오버
		this.title.on("mouseenter", function(){
            // 재생중인지 체크
			if( $(eleContent).hasClass("py_playing") && !that.seriesList.hasClass("py_series_list_active") ){
				// 전체 컨트럴러 사라짐 타이머
				if( timer ){
					clearTimeout( timer );
				}
			}
		});
        // 타이틀 마우스 아웃
		this.title.on("mouseleave", function(){
            // 재생중인지 체크
			if( $(eleContent).hasClass("py_playing") && !that.seriesList.hasClass("py_series_list_active") ){
				// 컨트럴러 숨김 기능
				timer = that.userControlFlag({ wrap : eleContent });
			}
		});

        // 컨트롤러 마우스 오버
		this.controllBox.on("mouseenter", function(){
            // 재생중인지 체크
			if( $(eleContent).hasClass("py_playing") && !that.seriesList.hasClass("py_series_list_active") ){
				// 전체 컨트럴러 사라짐 타이머
				if( timer ){
					clearTimeout( timer );
				}
			}
		});
        // 컨트롤러 마우스 아웃
		this.controllBox.on("mouseleave", function(){
            // 재생중인지 체크
			if( $(eleContent).hasClass("py_playing") && !that.seriesList.hasClass("py_series_list_active") ){
				// 컨트럴러 숨김 기능
				timer = that.userControlFlag({ wrap : eleContent });
			}
		});

        // 플레이어 닫기 버튼
		this.playerClose.on("click", function(){
			self.close();
		});
		// 플레이어 마우스 오버
		this.playerClose.on("mouseenter", function(){
			if( $(eleContent).hasClass("py_playing") ){
				// 전체 컨트럴러 사라짐 타이머
				if( timer ){
					clearTimeout( timer );
				}
			}
		});
		// 플레이어 마우스 아웃
		this.playerClose.on("mouseleave", function(){
            // 재생중인지 체크
			if( $(eleContent).hasClass("py_playing") ){
				// 컨트럴러 숨김 기능
				timer = that.userControlFlag({ wrap : eleContent });
			}
		});

        // 메인 플레이 레이어 오버
        this.layerPlay.on("mouseenter", function(){
            $(this).addClass("py_btn_playing_active");
        });
        // 메인 플레이 레이어 아웃
        this.layerPlay.on("mouseleave", function(){
            $(this).removeClass("py_btn_playing_active");
        });
        // 메인 플레이 레이어 클릭
        this.layerPlay.on("click", function(){
            // 재생
            that.videoForm.play();

            // 숨김
            $(this).addClass("py_btn_playing_hide");

            // 컨트럴러 숨김 기능
            timer = that.userControlFlag({ wrap : eleContent });
        });

        // 재생 및 정지 버튼 클릭
		this.btnPlay.on("click", function(){
			// 전체 컨트럴러 사라짐 타이머
			if( timer ){
				clearTimeout( timer );
			}

            // 목록보기 리스트가 활성화 되어있을경우
            if( that.seriesList.hasClass("py_series_list_active") ){
                that.seriesList.removeClass("py_series_list_active");
            }

            // 재생중인지 체크
			if( $(eleContent).hasClass("py_playing") ){
				// 정지
				that.videoForm.pause();

				// 정지일경우 전체 영역에 클래스 삭제
				$(eleContent).removeClass("py_playing");
				$(eleContent).removeClass("py_user_active");
                // 버튼 레이어 숨김
                that.layerPlay.removeClass("py_btn_playing_hide");

				// 데이터 저장(현재 시간 저장)
				that.postDataSend({ time : that.timeCurrent, tTime : that.timeDuration });
			} else {
				// 재생
				that.videoForm.play();
                // 버튼 레이어 숨김
                that.layerPlay.addClass("py_btn_playing_hide");
			}

			return false;
		});

        // 10초전 이동 버튼 클릭
		this.btnPrev.on("click", function(){
			// 재생중인지 체크
			if( $(eleContent).hasClass("py_playing") ){
				if( timer ){
					clearTimeout( timer );
				}
			}

			$(this).addClass("py_prev_control_active");
			setTimeout(() => {
				$(this).removeClass("py_prev_control_active");
			}, 300);

			// 현재시간을 기준으로 10초전으로 적용
			that.videoForm.currentTime = that.videoForm.currentTime - that.opt.overTimeUse;

			return false;
		});

        // 10초후 이동 버튼 클릭
		this.btnNext.on("click", function(){
			// 재생중인지 체크
			if( $(eleContent).hasClass("py_playing") ){
				if( timer ){
					clearTimeout( timer );
				}
			}

			$(this).addClass("py_next_control_active");
			setTimeout(() => {
				$(this).removeClass("py_next_control_active");
			}, 300);

			// 현재시간을 기준으로 10초후으로 적용
			that.videoForm.currentTime = that.videoForm.currentTime + that.opt.overTimeUse;

			return false;
		});

        // 상태바 마우스다운
		this.progressBar.on("mousedown", function(e){
			e.preventDefault();

			var posX = ( $(eleContent).offset().left == 0 ) ? e.pageX : e.pageX - $(eleContent).offset().left
			, progress = that.progressBar.find(".py_play_progress")
			, progressBarWidth = that.progressBar.outerWidth()
			, progressBarHeight = that.progressBar.outerHeight()
			, tooltip = progress.find(".py_tooltip")
			, tooltipImg = tooltip.find("img")
			, blankX = ($(eleContent).width() - progressBarWidth) / 2
			, initProgPos = that.percentValue({ currentX : posX - blankX, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" })
			, wnPosX = null
			, pageTotalX = posX - Math.floor(($(eleContent).width() - progressBarWidth) / 2)
			, tooltipImgWidth = null
			, tooltipImgHeight = null
			, progSpace = null
			, progResultX = null;

			// 재생중이였을때
			if( $(eleContent).hasClass("py_playing") ){
				// 정지
				that.videoForm.pause();

				// 타이머가 존재할경우
				if( timer ){
					clearTimeout( timer );
				}
			}

			setTimeout(() => {
				// 툴팁 활성화
				if( tooltipActiveFlag ){
					tooltip.addClass("py_tooltip_active").show();
				} else {
					tooltip.show();
				}

				tooltipImgWidth = tooltipImg.outerWidth()/160;
				tooltipImgHeight = tooltipImg.outerHeight()/90;
				progSpace = progressBarWidth/(tooltipImgWidth*tooltipImgHeight);
				progResultX = Math.floor(pageTotalX/progSpace);

				// 상태바 영역에서 값 추출
				if( posX >= blankX && posX <= $(eleContent).width() - blankX ){
					progress.css({ width : that.percentValue({ currentX : posX - blankX, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" }) });

					// 툴팁 활성화
					if( tooltipActiveFlag ){
						tooltipActive({
							curtX : posX - blankX,
							imgFlag : "center",
							imgTop : -(tooltip.height() * Math.floor(progResultX/tooltipImgWidth)),
							imgLeft : -(tooltip.width() * (progResultX%tooltipImgWidth)),
							resultX : progResultX
						});

                        // 툴팁 시간
            			tooltip.find(".py_tooltip_time").text( that.timeCalculate(initProgPos * (that.timeDuration/progressBarWidth)) ? that.timeCalculate(initProgPos * (that.timeDuration/progressBarWidth)) : that.timeCalculate(0) );
					}
				}

				// 상태바 오버 이벤트 기능 삭제
				that.progressBar.off("mouseenter");
				that.progressBar.off("mousemove");
				that.progressBar.off("mouseleave");
			});

			// 전체 마우스무브
			$(window).on("mousemove", function(e){
				wnPosX = ( $(eleContent).offset().left == 0 ) ? e.pageX : e.pageX - $(eleContent).offset().left;
				wnPosY = ( $(eleContent).offset().top == 0 ) ? e.pageY : e.pageY - $(eleContent).offset().top;
				pageTotalX = wnPosX - Math.floor(($(eleContent).width() - progressBarWidth) / 2);
				progResultX = Math.floor(pageTotalX/progSpace);

				var wnBlankX = ($(eleContent).width() - progressBarWidth) / 2
				, wnBlankY = $(eleContent).height() - progressBarHeight
				, wnResultBlankY = wnBlankY + progressBarHeight
				, wnProgPos = that.percentValue({ currentX : wnPosX - wnBlankX, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" });

				// 상태바 영역에서 값 추출
				if( wnPosX >= blankX && wnPosX <= $(eleContent).width() - wnBlankX ){
					// 이동할 프로그래스바
					progress.css({ width : that.percentValue({ currentX : wnPosX - wnBlankX, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" }) });

					// 현재 시간 재적용
					that.progCurrentTime.text( that.timeCalculate(wnProgPos * (that.timeDuration/progressBarWidth)) );
                    // 툴팁 시간
                    tooltip.find(".py_tooltip_time").text( that.timeCalculate(wnProgPos * (that.timeDuration/progressBarWidth)) ? that.timeCalculate(wnProgPos * (that.timeDuration/progressBarWidth)) : that.timeCalculate(0) );

					if( wnPosX >= tooltip.outerWidth()/2 && wnPosX < $(eleContent).width() - tooltip.outerWidth()/2 ){
						// 툴팁 활성화
						if( tooltipActiveFlag ){
							tooltipActive({
								curtX : wnPosX - wnBlankX,
								imgFlag : "center",
								imgTop : -(tooltip.height() * Math.floor(progResultX/tooltipImgWidth)),
								imgLeft : -(tooltip.width() * (progResultX%tooltipImgWidth)),
								resultX : progResultX
							});
						}
					}
				} else if( wnPosX < blankX ){
					// 이동할 프로그래스바
					progress.css({ width : 0 });

					// 현재 시간 재적용
					that.progCurrentTime.text( that.timeCalculate(0) );
                    // 툴팁 시간
                    tooltip.find(".py_tooltip_time").text( that.timeCalculate(0) );

					// 툴팁 활성화
					if( tooltipActiveFlag ){
						tooltipActive({
							curtX : 0,
							imgFlag : "first",
							imgTop : 0,
							imgLeft : 0
						});
					}
				} else if( wnPosX > $(eleContent).width() - wnBlankX ){
					// 이동할 프로그래스바
					progress.css({ width : progressBarWidth });

					// 현재 시간 재적용
					that.progCurrentTime.text( that.timeCalculate(that.timeDuration) );
                    // 툴팁 시간
                    tooltip.find(".py_tooltip_time").text( that.timeCalculate(that.timeDuration) ? that.timeCalculate(that.timeDuration) : that.timeCalculate(0));

					// 툴팁 활성화
					if( tooltipActiveFlag ){
						tooltipActive({
							curtX : progressBarWidth,
							imgFlag : "last",
							imgTop : -(tooltip.height() * (tooltipImgWidth+1)),
							imgLeft : -(tooltip.width() * (tooltipImgWidth-1))
						});
					}
				}
			});

			// 마우스 업
			$(window).on("mouseup", function(e){
				var upPosX = (wnPosX) ? wnPosX : posX
				, wnBlankX = ($(eleContent).width() - that.progressBar.outerWidth()) / 2
				, wnProgBarWidth = that.progressBar.outerWidth()
				, wnProgPos = that.percentValue({ currentX : upPosX - wnBlankX, totalX : wnProgBarWidth, progBar : wnProgBarWidth, type : "px" });

				// 재생중일경우 체크
				if( $(eleContent).hasClass("py_playing") ){
					// 재생
					that.videoForm.play();
				}

				// 현재 재생시간 설정
				if( upPosX < blankX ){
					that.videoForm.currentTime = 0;
				} else if( upPosX > $(eleContent).width() - wnBlankX ) {
					that.videoForm.currentTime = that.timeDuration;
				} else {
					that.videoForm.currentTime = Math.abs(wnProgPos * (that.timeDuration/wnProgBarWidth));
				}

				// 툴팁 활성화
				if( tooltipActiveFlag ){
					tooltip.removeClass("py_tooltip_active").hide();
				} else {
					tooltip.hide();
				}

				// 이벤트 삭제
				$(window).off("mousemove");
				$(window).off("mouseup");

				// 상태바 오버 이벤트 기능 실행
				stateBarEvtOver();
			});

			return false;
		});

		// 상태바 오버 이벤트 기능 실행
		stateBarEvtOver();

        // 볼륨 버튼
		this.volumeButton.on("click", function(e){
            // 기본링크 기능삭제
			e.preventDefault();

			if( that.videoForm.volume != 0 ){
				that.videoForm.volume = 0;

				that.volumeSetup({ cutX : 0, totalX : that.volumeProgBar.outerWidth() });
			} else {
				that.videoForm.volume = currentVolume;

				that.volumeSetup({ cutX : currentVolume*100, totalX : that.volumeProgBar.outerWidth() });
			}
		});
		this.volumePanel.on("mouseenter", function(e){
			$(this).addClass("py_volume_panel_enter");

			evtMoveFlag = false;
		});
		this.volumePanel.on("mouseleave", function(e){
			if( !evtMoveFlag ){
				$(this).removeClass("py_volume_panel_enter");
			}
		});
        // 불륨 상태바
		this.volumeProgBar.on("mousedown", function(e){
            // 기본링크 기능삭제
			e.preventDefault();

			var posX = e.pageX
			, progress = that.volumeProgBar.find(".py_volume_level_icon")
			, progressBarWidth = that.volumeProgBar.outerWidth()
			, blankX = that.volumeProgBar.offset().left
			, wnPosX = null;

			setTimeout(() => {
				// 상태바 영역에서 값 추출
				if( posX >= blankX && posX <= blankX + progressBarWidth ){
					that.volumeSetup({ cutX : posX - blankX, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" });
				}
			}, 10);

			// 전체 마우스무브
			$(window).on("mousemove", function(e){
				wnPosX = e.pageX;
				wnPosY = e.pageY;

				// 상태바 영역에서 값 추출
				if( wnPosX >= blankX && wnPosX <= progressBarWidth + blankX ){
					that.volumeSetup({ cutX : wnPosX - blankX, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" });
				} else if( wnPosX < blankX ){
					that.volumeSetup({ cutX : 0, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" });
				} else if( wnPosX > $(eleContent).width() - blankX ){
					that.volumeSetup({ cutX : progressBarWidth, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" });
				}

				if( !evtMoveFlag ){
					evtMoveFlag = true;
				}
			});

			// 마우스 업
			$(window).on("mouseup", function(e){
				var pageX = e.pageX
				, pageY = e.pageY

				currentVolume = Number(progress.outerWidth()/100).toFixed(1);

				// 볼률바가 활성화 되어있을경우 숨김
				if( pageX >= that.volumePanel.offset().left &&
					pageX <= that.volumePanel.offset().left + that.volumePanel.outerWidth() &&
					pageY >= that.volumePanel.offset().top &&
					pageY <= that.volumePanel.offset().top + that.volumePanel.outerHeight()
				){
					evtMoveFlag = false;
				} else {
					if( that.volumePanel.hasClass("py_volume_panel_enter") && evtMoveFlag ){
						that.volumePanel.removeClass("py_volume_panel_enter");
					}
				}

				// 이벤트 삭제
				$(window).off("mousemove");
				$(window).off("mouseup");
			});
		});

        // 전체보기 버튼 클릭
		this.btnFullscreen.on("click", function(){
			// 전체 컨트럴러 활성화
			if( $(eleContent).hasClass("py_playing") ){
				if( timer ){
					clearTimeout( timer );
				}
			}

			// 전체화면 함수
			that.fullSizeFlag({ content : eleContent });
		});

        // 전체보기 ESC키 이벤트
        document.addEventListener("fullscreenchange", evtFullEsc);
        document.addEventListener("webkitfullscreenchange", evtFullEsc);
        document.addEventListener("mozfullscreenchange", evtFullEsc);
        document.addEventListener("MSFullscreenChange", evtFullEsc);

        // 키보드 클릭
		$(window).on("keyup", function(e){
			if( e.keyCode == 37 ){ // 좌
				// 전체 컨트럴러 사라짐 타이머
				if( timer ){
					clearTimeout( timer );
				}

				// 현재시간을 기준으로 10초전으로 적용
				that.videoForm.currentTime = that.videoForm.currentTime - that.opt.overTimeUse;

				// 컨트럴러 숨김 기능
				timer = that.userControlFlag({ wrap : eleContent });
			} else if( e.keyCode == 39 ){ // 우
				// 전체 컨트럴러 사라짐 타이머
				if( timer ){
					clearTimeout( timer );
				}

				// 현재시간을 기준으로 10초후으로 적용
				that.videoForm.currentTime = that.videoForm.currentTime + that.opt.overTimeUse;

				// 컨트럴러 숨김 기능
				timer = that.userControlFlag({ wrap : eleContent });
			} else if( e.keyCode == 32 ){ // 스페이스바
				that.btnPlay.trigger("click");
			} else if( e.keyCode == 13 ){ // 엔터
				that.btnFullscreen.trigger("click");
            }
		});

        // 전체보기 ESC키 인식 이벤트
        function evtFullEsc(){
            // 엣지 및 크롬
            if( document.webkitIsFullScreen == false ){
                that.content.removeClass("py_fullsize_active");
            }
            // 파이어폭스
            if( document.mozFullScreen == false ){
                that.content.removeClass("py_fullsize_active");
            }
            // 익스 하위버전
            if( document.msFullscreenEnabled == true ){
                if( document.msFullscreenElement == null ){
                    that.content.removeClass("py_fullsize_active");
                }
            }
        }

        // 상태바 오버 이벤트 기능
		function stateBarEvtOver(){
			// 상태바 마우스오버
			that.progressBar.on("mouseenter", function(e){
				var posX = ( $(eleContent).offset().left == 0 ) ? e.pageX : e.pageX - $(eleContent).offset().left
				, progress = that.progressBar.find(".py_play_progress")
				, progressBarWidth = that.progressBar.outerWidth()
				, tooltip = progress.find(".py_tooltip")
				, tooltipImg = tooltip.find("img")
				, blankX = ($(eleContent).width() - progressBarWidth) / 2
				, initProgPos = that.percentValue({ currentX : posX - blankX, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" })
				, pageTotalX = posX - Math.floor(($(eleContent).width() - progressBarWidth) / 2)
				, tooltipImgWidth = null
				, tooltipImgHeight = null
				, progSpace = null
				, progResultX = null;

                // 클래스 추가
                $(this).addClass("py_progress_bar_active");

				// 툴팁 활성화
				if( tooltipActiveFlag ){
					tooltip.addClass("py_tooltip_active").show();
				} else {
					tooltip.show();
				}

				tooltipImgWidth = tooltipImg.outerWidth()/160;
				tooltipImgHeight = tooltipImg.outerHeight()/90;
				progSpace = progressBarWidth/(tooltipImgWidth*tooltipImgHeight);
				progResultX = Math.floor(pageTotalX/progSpace);

				// 상태바 영역에서 값 추출
				if( posX >= blankX && posX <= $(eleContent).width() - blankX ){
					// 툴팁 활성화
					if( tooltipActiveFlag ){
						tooltipActive({
							curtX : posX - blankX,
							//time : that.timeCalculate(initProgPos * (that.timeDuration/progressBarWidth)),
							imgFlag : "center",
							imgTop : -(tooltip.height() * Math.floor(progResultX/tooltipImgWidth)),
							imgLeft : -(tooltip.width() * (progResultX%tooltipImgWidth)),
							resultX : progResultX
						});
					}

                    // 툴팁 시간
                    tooltip.find(".py_tooltip_time").text( that.timeCalculate(initProgPos * (that.timeDuration/progressBarWidth)) ? that.timeCalculate(initProgPos * (that.timeDuration/progressBarWidth)) : that.timeCalculate(0) );
				}
			});

			// 상태바 마우스무브
			that.progressBar.on("mousemove", function(e){
				var wnPosX = ( $(eleContent).offset().left == 0 ) ? e.pageX : e.pageX - $(eleContent).offset().left
				, progress = that.progressBar.find(".py_play_progress")
				, progressBarWidth = that.progressBar.outerWidth()
				, wnBlankX = ($(eleContent).width() - progressBarWidth) / 2
				, wnProgPos = that.percentValue({ currentX : wnPosX - wnBlankX, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" })
				, tooltip = progress.find(".py_tooltip")
				, tooltipImg = tooltip.find("img");

                // 툴팁이 display:none 되어있을경우
				if( tooltip.css("display") == "none" ){
					tooltip.show();
				}

				var tooltipImgWidth = tooltipImg.outerWidth()/160
				, tooltipImgHeight = tooltipImg.outerHeight()/90
				, progSpace = progressBarWidth/(tooltipImgWidth*tooltipImgHeight)
				, pageTotalX = wnPosX - Math.floor(($(eleContent).width() - progressBarWidth) / 2)
				, progResultX = Math.floor(pageTotalX/progSpace);

                // 프로그래스바 영역
				if( wnPosX >= wnBlankX && wnPosX <= $(eleContent).width() - wnBlankX ){
					// 툴팁 활성화
					if( tooltipActiveFlag ){
						tooltipActive({
							curtX : wnPosX - wnBlankX,
							imgFlag : "center",
							imgTop : -(tooltip.height() * Math.floor(progResultX/tooltipImgWidth)),
							imgLeft : -(tooltip.width() * (progResultX%tooltipImgWidth)),
							resultX : progResultX
						});
					}

                    // 툴팁 시간
                    tooltip.find(".py_tooltip_time").text( that.timeCalculate(wnProgPos * (that.timeDuration/progressBarWidth)) ? that.timeCalculate(wnProgPos * (that.timeDuration/progressBarWidth)) : that.timeCalculate(0) );
				}
			});

			// 상태바 마우스아웃
			that.progressBar.on("mouseleave", function(e){
                // 클래스 추가
                $(this).removeClass("py_progress_bar_active");

				// 툴팁 활성화
				if( tooltipActiveFlag ){
					var progress = that.progressBar.find(".py_play_progress")
					, tooltip = progress.find(".py_tooltip");

					tooltip.removeClass("py_tooltip_active").hide();
				}
			});
		}

        // Tootip
		function tooltipActive(m){
			var currentX = m.curtX
			, tooltipImgFlag = m.imgFlag
			, tooltipImgTop = m.imgTop
			, tooltipImgLeft = m.imgLeft
			, tooltipCourse = m.resultX
			, progress = that.progressBar.find(".py_play_progress")
			, progressBarWidth = that.progressBar.outerWidth()
			, tooltip = progress.find(".py_tooltip")
			, tooltipImg = tooltip.find("img")
			, tooltipImgWidth = tooltipImg.outerWidth()/160
			, tooltipImgHeight = tooltipImg.outerHeight()/90
			, tooltipPosX = that.percentValue({ currentX : currentX, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" }) - (tooltip.outerWidth()/2);

			// 툴팁 위치
			if( tooltipPosX < 0 ){
				tooltip.css({ left : 0 });
			} else if( tooltipPosX > progressBarWidth - tooltip.outerWidth() ){
				tooltip.css({ left : progressBarWidth - tooltip.outerWidth() });
			} else {
				tooltip.css({ left : that.percentValue({ currentX : currentX, totalX : progressBarWidth, progBar : progressBarWidth, type : "px" }) - (tooltip.outerWidth()/2) })
			}

			// 툴팁 이미지 위치
			if( tooltipImgFlag == "center" ){
				if( tooltipCourse < tooltipImgWidth*tooltipImgHeight ){
					tooltipImg.css({ margin : tooltipImgTop + "px 0 0 " + tooltipImgLeft + "px " });
				}
			} else if( tooltipImgFlag == "first" ){
				tooltipImg.css({ margin : "0 0 0 0" });
			} else if( tooltipImgFlag == "last" ){
				tooltipImg.css({ margin : -(tooltip.height() * (tooltipImgWidth+1)) + "px 0 0 " + -(tooltip.width() * (tooltipImgWidth-1)) + "px " });
			}
		}
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
    // volume 생성
	volumeUiCreate : function(){
		var $volumeLayer = $("<div />").addClass("volume_layer")
			.append( $("<span />") );

		return $volumeLayer;
	},
    // 전체 화면 보기
	fullSizeFlag : function(m){
		var node = $(m.content);

		if( !node.hasClass("py_fullsize_active") ){
			var requestMethod = document.body.requestFullScreen || document.body.webkitRequestFullScreen || document.body.mozRequestFullScreen || document.body.msRequestFullscreen;

			node.addClass("py_fullsize_active");

            if ( requestMethod ) { // Native full screen.
                requestMethod.call(document.body);
            } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
                var wscript = new ActiveXObject("WScript.Shell");
                if (wscript !== null) {
                    wscript.SendKeys("{F11}");
                }
            }
		} else {
			var requestMethod = document.cancelFullScreen||document.webkitCancelFullScreen||document.mozCancelFullScreen||document.exitFullscreen;

			node.removeClass("py_fullsize_active");

			if (requestMethod) { // cancel full screen.
				requestMethod.call(document);
			} else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
				var wscript = new ActiveXObject("WScript.Shell");
				if (wscript !== null) {
					wscript.SendKeys("{F11}");
				}
			}
		}
	},
    // 볼륨 조절
	volumeSetup : function(m){
		var progress = this.volumeProgBar.find(".py_volume_level_icon")
		, cutX = m.cutX
		, totX = m.totalX
		, pgBar = m.progBar
		, types = ( m.type ) ? m.type : "percent"
		, wnWidthPs = parseFloat(this.percentValue({ currentX : cutX, totalX : totX }))

		// 이동할 프로그래스바
		progress.css({ width : this.percentValue({ currentX : cutX, totalX : totX, progBar : pgBar, type : types }) });

		// 볼륨 조절
		this.videoForm.volume = wnWidthPs/100;

		// 클래스 적용(아이콘 적용)
		if( wnWidthPs == 0 ){
			// 아이콘 변경
			this.volumeButton.attr({ class : "py_mute_control py_mute_control_process0" });
		} else if( wnWidthPs > 0 && wnWidthPs <= 33 ){
			// 아이콘 변경
			this.volumeButton.attr({ class : "py_mute_control py_mute_control_process1" });
		} else if( wnWidthPs > 33 && wnWidthPs <= 66 ){
			// 아이콘 변경
			this.volumeButton.attr({ class : "py_mute_control py_mute_control_process2" });
		} else {
			// 아이콘 변경
			this.volumeButton.attr({ class : "py_mute_control py_mute_control_process3" });
		}
	},
    // 컨트롤박스 활성화 여부
	userControlFlag : function(m){
		var controlTimer = setTimeout(() => {
			$(m.wrap).addClass("py_user_active");
		}, 3000);

		return controlTimer;
	},
    // 데이터 로딩바
	loadingUiCreate : function(m){
		var $spinner = $("<div />").addClass("py_loading_spinner")
			.appendTo( $(m.cont) );

		return $spinner;
	},
    // 시계 계산
	timeCalculate : function(count){
	    var numCount = parseInt(count, 10)
	    , hours = Math.floor(numCount / 3600)
	    , minutes = Math.floor((numCount - (hours * 3600)) / 60)
	    , seconds = numCount - (hours * 3600) - (minutes * 60)
		, total = null;

		// 한자리일경우 앞에 0을 추가
	    if( minutes < 10 ){
			minutes = "0" + minutes;
		}
	    if( seconds < 10 ){
			seconds = "0" + seconds;
		}

		// 시간에 시간이 없을경우 삭제
		if( hours ){
			total = hours + ':' + minutes + ':' + seconds;
		} else {
			total = minutes + ':' + seconds;
		}

	    return total;
	},
    // 퍼센트 계산
	percentValue : function(m){
		var currentX = m.currentX
		, totalX = m.totalX
		, progWidth = m.progBar
		, type = ( m.type ) ? m.type : "percent"
		, total = 0;

		if( type == "percent" ){
			total = (currentX / totalX) * 100;

			total = Math.floor( total ) + "%";
		} else {
			total = (currentX / totalX) * progWidth

			total = total;
		}

		return total;
	},
    // 데이터 전송
	postDataSend : function(m){
		var time = m.time
		, totalTime = m.tTime;

		/*$.ajax({
			type : "POST", // 호출 방식
			url : "/api/down/player_time.php" + "?link_idx=" + this.opt.initInfo.link_idx + "&no=" + this.opt.initInfo.no + "&wp_idx=" + this.opt.initInfo.wp_idx + "&playtime=" + time + "&totaltime=" + totalTime, // 호출 URL
			async : true, // 동기, 비동기 방식(true : 비동기, false : 동기)
			timeout : 5000,
			data : {},
			dataType : "json",
			jsonpCallback: false,
	        crossDomain: false,
	        contentType: false,
			success : function(response){
				console.log(response);
			},
			error : function(error){
				console.log(error);
			}
		});*/
	},
    // Device 체크(웹 또는 모바일)
	deviceVersionCheck : function(){
		//모바일 Device종류(윈도우 폰은 앞으로 나오지 않기 때문에 빼도 무방하나 아직 쓰는 사람이 존재하기에..)
        var mobileFlag = /Mobile|iP(hone|od)|Windows (CE|Phone)|Minimo|Opera M(obi|ini)|BlackBerry|Nokia/
		, result = null;

        //모바일일경우
        if (navigator.userAgent.match(mobileFlag) && !navigator.userAgent.match(/iPad/)) {
            result = "mobile";
        } else if (navigator.userAgent.match(/iPad|Android/)) { // 모바일 Device와 Android가 포함이 안되어 있을 경우
            result = "tablet";
        } else { //그 외의 경우 모두 PC
            result = "PC(Mobile, Tablet 외)";
        }

		return result;
	},
	// Device 체크(사이즈 기준)
	deviceSizeCheck : function(){
		var result = null;

        if( window.innerWidth < 800 ){
            result = "mobile";
        } else {
            result = "web";
        }

        return result;
	},
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