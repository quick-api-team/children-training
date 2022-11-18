export default {
	
		getRandomNumber (max) {
			let result = Math.floor(Math.random() * max)
			return result === 0 ? 1 : result
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
		}
}