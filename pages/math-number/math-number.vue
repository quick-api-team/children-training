<template>
	<view class="container">
		<view class="question item">
			<uni-section :title="`${id}. ${max} = ${currentQuestion}+？`" type="line" padding>
				<template v-slot:right>
					<!-- <button size="mini">设置</button>	 -->
					
					<view class="question-title-right-item score-item" >
						<uni-icons type="vip" size="20"  color="#f57f17"></uni-icons>
						<text class="text">{{score}}</text>
					</view>
					<view class="question-title-right-item success-item" >
						<uni-icons type="medal" size="20"  color="#388e3c"></uni-icons>
						<text class="text">{{(successTimes + failTimes) > 0 ? parseInt(successTimes*100.0 / (successTimes + failTimes)) : ''}}%</text>
					</view>
					<view class="question-title-right-item success-item" >
						<uni-icons type="hand-up" size="20"  color="#388e3c"></uni-icons>
						<text class="text">{{successTimes}}</text>
					</view>
					<view class="question-title-right-item fail-item">
						<uni-icons  type="close" size="20" color="#e4941e"></uni-icons>
						<text class="text">{{failTimes}}</text>
					</view>
					
					<!-- <uni-icons class="question-title-right-item" type="settings" size="20" style="cursor: pointer;" @click="openSetting"></uni-icons> -->

				</template>
				<view class="number-view">
					<view :class="['number', answerClass]" @click="skipCurrentQuestion">
						<view :class="[acquireAwardScore ? 'acquire-award-score' : 'acquire-score']" v-if="showResult && acquireScore !== 0" :style="{color: acquireScore > 0 ? '#388e3c' : '#e4941e'}">{{acquireScore}}</view>
						<view v-if="showResult">
							<uni-icons v-if="lastResult" type="hand-up" size="200" color="#388e3c"></uni-icons>
							<uni-icons v-else type="close"  size="200" color="#e4941e"></uni-icons>
						</view>
						<text v-else>
							{{currentQuestion}}
						</text>
					</view>
					<view class="number-max" @click="openSetting">{{max}}</view>
					
				</view>
			</uni-section>
				
		</view>
		<view class="answer item">
			<uni-section :title="`选择答案 ( ${currentQuestionTimeString} )`" type="line" padding>
				<template v-slot:right>
					{{timeString}}
				</template>
				<uni-grid :column="2" :square="false" :highlight="true">
					<uni-grid-item v-for="(item, index) in answer" :index="index" :key="index">
						<view :class="['grid-item-box', index === currentAnswerId ? 'answer-item-selected' : '']" @click="submitAnswer(item, index)">
							<text class="text answer-item">{{ item }}</text>
						</view>
					</uni-grid-item>
				</uni-grid>
			</uni-section>
				
		</view>
		<uni-popup ref="inputDialog" type="dialog">
			<uni-popup-dialog ref="inputClose"  mode="input" title="设置凑数的目标值" :value="max"
				placeholder="请输入内容" @confirm="handleSetMax"></uni-popup-dialog>
		</uni-popup>
		<uni-popup ref="message" type="message">
			<uni-popup-message :type="msgType" :message="messageText" :duration="2000"></uni-popup-message>
		</uni-popup>
		

	</view>
	</view>
</template>

<script>
	import * as dayjs from 'dayjs'
	const MODE_CUSTOM = 'custom' //自定义模式
	const MODE_AUTO_UPGRADE = 'auto_grade' //自动升级模式

	export default {
		data() {
			return {
				mode: MODE_CUSTOM, //custom 自定义 upgrade 升级
				id: 1,
				answer: [
					1,2,3,4
				],
				max: 20,
				currentQuestion: 0,
				successTimes: 0,
				failTimes: 0,
				startTime: 0,
				currentQuestionStartTime: 0,
				answerTotal: 4,
				answerClass: '',
				showResult: false,
				lastResult: true,
				msgType: 'success',
				messageText: '这是一条成功提示',
				cacheKey: {
					max: 'max_number',
					score: 'user_score',
					fail: 'fail_number',
					success: 'success_number',
				},
				currentAnswerId: -1,
				score: 0,
				alertPeriod: 600, //提醒周期,毫秒
				timer: null,
				skipTimes: 0,
				maxSkipTimes: 2,
				timeString: '',
				currentQuestionTimeString: '',
				currentQuestionStartTime: 0,
				showFailMsg: false,
				config: {
					defaultMax: 20,
					gameMax: 1000
				},
				recoverSuccessAndFailTimes: false,
				acquireScore: 0,
				acquireAwardScore: false //是否获得了奖励分
				
			}
		},
		mounted() {			
			this.init()
		},
		beforeDestroy() {
		    // js提供的clearInterval方法用来清除定时器
			if (this.timer !== null) {
				console.info('清理timer')
				clearInterval(this.timer);
			}
		    
		},
		onLoad: function (option) { 
			if (typeof option.mode !== 'undefined' && option.mode !== null) {
				this.mode = option.mode
				console.log('mode = ' + this.mode)
			}
		},
		methods: {
			init () {
				this.startTime = new Date().getTime()
				this.updateCacheKey()
				if (this.mode === MODE_AUTO_UPGRADE) {
					this.config.gameMax = 10000
					this.recoverSuccessAndFailTimes = true
				}
				this.max = parseInt(this.getDataFromCache(this.cacheKey.max, this.config.defaultMax))
				this.score = parseInt(this.getDataFromCache(this.cacheKey.score, 0))
				
				if (this.recoverSuccessAndFailTimes) {
					
					this.successTimes = parseInt(this.getDataFromCache(this.cacheKey.success, 0))
					this.failTimes = parseInt(this.getDataFromCache(this.cacheKey.fail, 0))
				}
				this.createNewQuestion()
				
				this.timer = setInterval(() => this.timeAlert(), 300)
			},
			updateCacheKey () {
				
				if (this.mode !== MODE_CUSTOM) {
					this.cacheKey.max = this.mode + '_' + this.cacheKey.max
					this.cacheKey.score = this.mode + '_' + this.cacheKey.score
				}
			},
			getRandomNumber (max) {
				let result = Math.floor(Math.random() * max)
				return result === 0 ? 1 : result
			},
			getNewQuestionNumber () {
				let newQuestion = this.getRandomNumber(this.max)
				while (this.currentQuestion === newQuestion) {
					newQuestion = this.getRandomNumber(this.max)
				}
				return newQuestion
			},
			createNewQuestion () {
				this.currentAnswerId = -1
				let newQuestion = this.getNewQuestionNumber()
				
				this.createAnswer(newQuestion)
				this.currentQuestion = newQuestion
				this.currentQuestionStartTime = new Date().getTime()
				
				console.info('new qustion, ' + newQuestion)
			},
			createAnswer (newQuestion) {
				
				let answerSet = new Set()
				let answer = this.max - newQuestion
				answerSet.add(answer)
				let times = 0
				let maxTimes = 20
				
				// 生成干扰项答案
				let createTimes = 0
				let maxCreateTimes = 1
				let createFlag = true
				
				
				if (answer > 100 && createFlag && maxCreateTimes > 0) {
					let newRandomAnswer = parseInt(answer / 100) * 100 + (this.getRandomNumber(10) * 10) + (answer % 10)
					createTimes++
					if (!answerSet.has(newRandomAnswer)) {
						answerSet.add(newRandomAnswer)
					}
					console.info('生成十位随机干扰答案 ' + newRandomAnswer + ', 原答案 ' + answer)
				}
				
				while(times < maxTimes && answerSet.size < this.answerTotal) {
					let newRandomAnswer = this.getRandomNumber(this.max)
					if (createFlag && createTimes < maxCreateTimes) {
						let originRandomAnswer = newRandomAnswer
						
						// 生成一个位数相同的干扰答案
						if (originRandomAnswer > 10) {
							
							newRandomAnswer = parseInt(originRandomAnswer / 10) * 10 + (answer % 10)
							createTimes++
							console.info('生成干扰答案 ' + newRandomAnswer + ', 原答案 ' + answer)
						}
					}
					if (!answerSet.has(newRandomAnswer)) {
						answerSet.add(newRandomAnswer)
					}
					times++
				}
				
				let answerList = []
				
				for (let answer of answerSet) {
				  answerList.push(answer)
				}
				// 打乱答案
				const shuffeled = answerList.sort(() => {
				  const randomTrueOrFalse = Math.random() > 0.5;
				  return randomTrueOrFalse ? 1 : -1
				});
				this.answer = shuffeled
				
				
			},
			submitAnswer (answer, index) {
				if (this.showResult) {
					//正在显示结果，静止点击
					return
				}
				this.skipTimes = 0
				this.currentAnswerId = index
				this.acquireAwardScore = false
				let isSuccess = (this.max - this.currentQuestion - answer) === 0 ? true : false
				
				console.info('answer ' + answer + ', success? ' + isSuccess)
				if (isSuccess) {
					this.handleAnswerRight()
				} else {
					this.handleAnswerError()
				}
			},
			/**
			 * 处理答案正确
			 */
			handleAnswerRight () {
				this.successTimes++
				this.id++
				this.handleShowResult(true)
				this.addScore()
				this.playSuccessMusic()
				this.setDataToCache(this.cacheKey.success, this.successTimes)
				// this.answerClass = 'right'
				
				
				if (this.mode === MODE_AUTO_UPGRADE) {
					if (this.successTimes > 0 && this.successTimes % 10 === 0) {
					// if (true) {
						//升级难度
						let max = this.max
						if (max <= 100) {
							// 加5或者10
							max +=  (this.getRandomNumber(3) === 1 ? 5 : 10)
						} else {
							max +=  this.getRandomNumber(50)
						}
						this.handleSetMax(max)
					} 
				}
				
			},
			/**
			 * 处理答案错误
			 */
			handleAnswerError () {
				this.failTimes++
				this.id++
				this.handleShowResult(false)
				this.reduceScore()
				this.playFailMusic()
				this.setDataToCache(this.cacheKey.fail, this.failTimes)
				
				if (this.mode === MODE_AUTO_UPGRADE && this.failTimes >= 30) {
					// 游戏结束
					this.showFailMsg = true
					
					uni.showToast({
						title: '挑战失败',
						duration: 5000,
						mask: true,
						image: '/static/error.png'
					})
					setTimeout(() => {this.handleFailConfirm()}, 2000)
					
				}
				
			},
			handleShowResult (result) {
				this.lastResult = result
				this.showResult = true
				setTimeout(()=>{
					this.createNewQuestion()
					this.showResult = false
				}, 800)
			},
			openSetting () {
				if (this.mode === MODE_CUSTOM) {
					this.$refs.inputDialog.open('center')
				} else {
					uni.showToast({
						title: '该模式不支持自定义',
						duration: 2000,
						mask: true,
						image: '/static/error.png'
					})
					
				}
				
			},
			handleSetMax (val) {
				let max = parseInt(val)
				if (Number.isNaN(max)) {
					this.msgType = 'error'
					this.messageText = `设置错误，请重新设置`
					this.$refs.message.open()
				} else {
					if (max < 5) {
						max = 5
					}
					if (max > this.config.gameMax) {
						max = this.config.gameMax
					}
					this.max = max
					this.createNewQuestion()
					this.setDataToCache(this.cacheKey.max, max)
					console.info('设置凑数目标 ' + val)
				}
			},
			setDataToCache (key, value) {
				uni.setStorageSync(key, value);
			}, 
			getDataFromCache (key, defaultValue) {
				try {
					const value = uni.getStorageSync(key);
					if (value) {
						return value
					} else {
						return defaultValue
					}
				} catch (e) {
					// error
					console.error(e)
					return defaultValue
				}
			},
			playSuccessMusic () {
				
				if (this.successTimes > 0 && this.successTimes % 10 === 0) {
					this.playMusic("/static/success10.mp3")
				} else {
					this.playMusic("/static/success.mp3")
				}
			},
			playFailMusic () {
				this.playMusic("/static/error.mp3")
			},
			playMusic (file) {
				try{
					let music = uni.createInnerAudioContext(); //创建播放器对象
					 
					music.src = file;
								 
					music.play(); //执行执行播放
					music.onEnded(() => {
					
						music.destroy()  
					})
				}catch(e){
					//TODO handle the exception
					console.error(e)
				}
			},
			reduceScore () {
				// if (this.max < 20) {
				// 	return
				// }
				let score = this.getQuestionScore()
				console.info('reduce score ' + score)
				this.acquireScore = score * -1
				score = Math.max(0, this.score - score)
				this.score = score
				this.setDataToCache(this.cacheKey.score, this.score)
			},
			addScore () {
				let score = this.getQuestionScore()
				
				if (new Date().getTime() - this.currentQuestionStartTime <= 10000) {
					this.acquireAwardScore = true
					score = score + Math.max(3, parseInt(score * 0.2))
				} 
				console.info('add score mode = ' + this.mode + ', key = ' + this.cacheKey.score + ', score = ' + score)
				this.acquireScore = score
				this.score += score
				this.setDataToCache(this.cacheKey.score, this.score)
			},
			getQuestionScore () {
				
				let baseSocre = parseInt(this.max / 10) 
				baseSocre = Math.min(100, baseSocre)
				baseSocre = Math.max(1, baseSocre)
				
				if (baseSocre === 1) {
					return baseSocre
				} else {
					let randomScore = this.getRandomNumber(Math.max(1, parseInt(baseSocre / 2)))
					randomScore = Math.max(1, randomScore)
					
					return baseSocre + randomScore
				}
				
			},
			timeAlert () {
			
				console.info('time alert')
				let now = new Date().getTime()
				let secoend = parseInt((now - this.startTime)/1000)
				this.showTime()
				this.showCurrentQuestionTime()
				if (secoend > 0 && secoend % this.alertPeriod === 0) {
					
					uni.showToast({
						title: '练习'+ parseInt(secoend / 60) + '分钟了，休息一下吧!',
						duration: 5000,
						mask: true,
						image: '/static/error.png'
					})
				}	
			},
			skipCurrentQuestion () {
				if (this.skipTimes >= this.maxSkipTimes) {
					this.playMusic("/static/skipFail.mp3")
					uni.showToast({
						title: '最多可跳过' + this.maxSkipTimes + '题',
						duration: 2000,
						image: '/static/error.png'
					})
				} else {
					this.playMusic("/static/skip.mp3")
					this.skipTimes++
					this.createNewQuestion()
				}
			},
			showTime () {
				let now = new Date().getTime()
				this.timeString = this.getRelativeTime(this.startTime, now)
			},
			showCurrentQuestionTime () {
				let now = new Date().getTime()
				this.currentQuestionTimeString = this.getRelativeTime(this.currentQuestionStartTime, now)
			},
			getRelativeTime (start, end) {
				
				let secoend = parseInt((end - start)/1000)
				
				let hour = parseInt(secoend / 3600)
				let minute = parseInt((secoend % 3600) / 60)
				let s = parseInt(secoend % 60)
				
				let timeString = 
					(hour > 0 ? hour + ':' : '') +
					(minute >= 10 ? minute : '0' + minute) + ':' +
					(s >= 10 ? s : '0' + s)
				return timeString
			},
			handleFailConfirm () {
				this.handleSetMax(this.config.defaultMax)
				this.setDataToCache(this.cacheKey.success, 0)
				this.setDataToCache(this.cacheKey.fail, 0)
				uni.redirectTo({
					url: '/pages/index/index'
				})
			}
		}
	}
</script>

<style lang="less">
	.container {
		padding: 10px;
		.uni-section {
			background-color: #eeeeee;
		}
		
		.question {
			height: calc(100vh - 340px);
			
			.toolbar {
				height: 24px;
				// padding: 8px;
				border-bottom: 1px solid red;
			}
			.question-title-right-item {
				display: inline;
				margin-left: 8px;
				line-height: 20px;
				font-size: 20px;
				.text {
					padding-left: 4px;
				}
			}
			.score-item {
				color: #f57f17;
			}
			.success-item {
				color: #388e3c;
			}
			.fail-item {
				color: #e4941e;
			}
			
			.number-view {
				// padding: 12px;
				height: calc(100vh - 380px);
				text-align: center;
				background-color: aliceblue;
				vertical-align: middle;
				
				
				.number {
					line-height: calc(100vh - 400px);
					font-size: 200px;
					color: cadetblue;
				}
				.number-max {
					position: absolute;
					top: 67px;
					right: 20px;
					background: #b2dfdb;
					padding: 10px;
					font-size: 22px;
					color: #004d40;
				}
				
				.error {
					background-color: #ffcdd2;
				}
				.right {
					border: 1px solid green;
				}
			}
			
		}
		.answer {
			height: 200px;
			
			.grid-item-box {
				// border: 1px solid red;
				text-align: center;
				background-color: aliceblue;
				// padding: 10px;
			}
			.answer-item {
				width: 100%;
				height: 100%;
				font-size: 68px;
				line-height: 100px;
				color: cornflowerblue;
			}
			.answer-item-selected {
				background-color: #bbdefb;
			}
		}
		
		.acquire-score {
			font-size: 24px;
			position:absolute;
			left: calc(50vw - 10px);
			top: -30px;
			animation:score-frames 2s;
			-webkit-animation:score-frames 2s; /* Safari and Chrome */
		}

		@keyframes score-frames
		{
			0%   {top: -30px;}
			50%  {top: -50px;}
			100% {display: none; top: -70px;}
		}

		@-webkit-keyframes score-frames /* Safari and Chrome */
		{
			0%   {top: -30px;}
			50%  {top: -50px;}
			100% {display: none; top: -70px;}
		}
		
		
		.acquire-award-score {
			// color: #50c255 !important;
			font-size: 24px;
			position:absolute;
			left: calc(50vw - 10px);
			top: -30px;
			animation:acquire-award-score-frames 2s;
			-webkit-animation:acquire-award-score-frames 2s; /* Safari and Chrome */
		}
		
		@keyframes acquire-award-score-frames
		{
			0%   {top: -30px;font-size: 24px;}
			50%  {top: -50px;font-size: 96px;}
			100% {top: -60px;font-size: 122px;}
		}
		
		@-webkit-keyframes acquire-award-score-frames /* Safari and Chrome */
		{
			0%   {top: -30px;font-size: 24px;}
			50%  {top: -50px;font-size: 96px;}
			100% {top: -60px;font-size: 122px;}
		}
	}
</style>