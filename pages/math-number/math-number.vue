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
			<uni-section title="选择答案" type="line" padding>
				<template v-slot:right>
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
	export default {
		data() {
			return {
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
					score: 'user_score'
				},
				currentAnswerId: -1,
				score: 0,
				alertPeriod: 600, //提醒周期,毫秒
				timer: null,
				skipTimes: 0,
				maxSkipTimes: 2
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
		methods: {
			init () {
				this.startTime = new Date().getTime()
				this.max = parseInt(this.getDataFromCache(this.cacheKey.max, 20))
				this.score = parseInt(this.getDataFromCache(this.cacheKey.score, 0))
				this.createNewQuestion()
				
				this.timer = setInterval(() => this.timeAlert(), 1000)
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
				console.info('new qustion, ' + newQuestion)
			},
			createAnswer (newQuestion) {
				
				let answerSet = new Set()
				answerSet.add((this.max - newQuestion))
				let times = 0
				let maxTimes = 100
				while(times < maxTimes && answerSet.size < this.answerTotal) {
					let newRandomAnswer = this.getRandomNumber(this.max)
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
				// this.answerClass = 'right'
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
				this.$refs.inputDialog.open('center')
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
					if (max > 1000) {
						max = 1000
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
				
				try{
					let music = uni.createInnerAudioContext(); //创建播放器对象
					 
					if (this.successTimes > 0 && this.successTimes % 10 === 0) {
						music.src = "/static/success10.mp3";
					} else {
						music.src = "/static/success.mp3";
					}
					
								 
					music.play(); //执行执行播放
				}catch(e){
					//TODO handle the exception
					console.error(e)
				}
			},
			playFailMusic () {
				try{
					let music = uni.createInnerAudioContext(); //创建播放器对象
					 
					music.src = "/static/error.mp3";
								 
					music.play(); //执行执行播放
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
				score = Math.max(0, this.score - score)
				this.score = score
				this.setDataToCache(this.cacheKey.score, this.score)
			},
			addScore () {
				let score = this.getQuestionScore()
				console.info('add score ' + score)
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
				
				if (secoend > 0 && secoend % this.alertPeriod === 0) {
					
					uni.showToast({
						title: '已经练习'+ parseInt(secoend / 60) + '分钟了，休息一下吧!',
						duration: 5000,
						mask: true,
						image: '/static/error.png'
						
					})
				}	
			},
			skipCurrentQuestion () {
				if (this.skipTimes >= this.maxSkipTimes) {
					uni.showToast({
						title: '最多可跳过' + this.maxSkipTimes + '题',
						duration: 2000,
						image: '/static/error.png'
					})
				} else {
					this.skipTimes++
					this.createNewQuestion()
				}
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
	}
</style>