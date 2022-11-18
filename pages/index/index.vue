<template>
	<view class="container">
		<uni-section title="凑数练习" type="line">
			<uni-list :border="true">
				<!-- 显示圆形头像 -->
				<uni-list-chat :avatar-circle="true" to="/pages/math-number/math-number" title="自由练习" avatar="/static/logo1.png" note="自由设定目标进行练习" :time="`最高分: ${customScore}`" :badge-text="`${customMax}`"></uni-list-chat>
				<!-- 右侧带角标 -->
				<uni-list-chat :avatar-circle="true" to="/pages/math-number/math-number?mode=auto_grade" title="升级练习" avatar="/static/logo1.png" note="每答对10道题将会提升难度" :time="`最高分: ${autoUpgradeScore}`" :badge-text="`${autoUpgradeMax}`"></uni-list-chat>
				<!-- 头像显示圆点 -->
			</uni-list>
		</uni-section>
		
		
	</view>
</template>

<script>
	import common from '../common/common.js'
	export default {
		data() {
			return {
				customScore: 0,
				customMax: 0,
				autoUpgradeScore: 0,
				autoUpgradeMax: 0
			}
		},
		mounted() {
			
		},
		onShow() {
			this.init()
		},
		methods: {
			init() {
				this.customScore = common.getDataFromCache('user_score', 0)
				this.customMax = common.getDataFromCache('max_number', 20)
				this.autoUpgradeScore = common.getDataFromCache('auto_grade_user_score', 0)
				this.autoUpgradeMax = common.getDataFromCache('auto_grade_max_number', 20)
				
				console.info('load')
			}

		}
	}
</script>

<style>
	.container {
		padding: 20px;
		font-size: 14px;
		line-height: 24px;
	}
</style>
