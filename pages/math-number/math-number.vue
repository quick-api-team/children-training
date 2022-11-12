<template>
	<view class="container">
		<view class="question item">
			<uni-section :title="`题目： ${max} = ${currentQuestion} + ？`" type="line" padding>
				<template v-slot:right>
					<!-- <button size="mini">设置</button>	 -->
					<uni-icons type="settings" size="20" style="cursor: pointer;" @click="openSetting"></uni-icons>

				</template>
				<view class="number-view">
					<view :class="['number', answerClass]" @click="createNewQuestion">
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
					<uni-tag :text="`${successTimes}`" :inverted="true"  :circle="true" type="success"></uni-tag>
				</template>
				<uni-grid :column="2" :square="false" :highlight="true">
					<uni-grid-item v-for="(item, index) in answer" :index="index" :key="index">
						<view class="grid-item-box" @click="submitAnswer(item)">
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
				answer: [
					1,2,3,4
				],
				max: 20,
				currentQuestion: 0,
				successTimes: 0,
				startTime: 0,
				currentQuestionStartTime: 0,
				answerTotal: 4,
				answerClass: '',
				showResult: false,
				lastResult: true,
				msgType: 'success',
				messageText: '这是一条成功提示',
				cacheKey: {
					max: 'max_number'
				}
			}
		},
		mounted() {
			this.init()
		},
		methods: {
			init () {
				this.max = parseInt(this.getDataFromCache(this.cacheKey.max, 20))
				this.createNewQuestion()
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
			submitAnswer (answer) {
				if (this.showResult) {
					//正在显示结果，静止点击
					return
				}
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
				this.handleShowResult(true)
				// this.answerClass = 'right'
			},
			/**
			 * 处理答案错误
			 */
			handleAnswerError () {
				this.handleShowResult(false)
			},
			handleShowResult (result) {
				this.lastResult = result
				this.showResult = true
				setTimeout(()=>{
					this.createNewQuestion()
					this.showResult = false
				}, 1000)
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
					top: 68px;
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
		}
	}
</style>