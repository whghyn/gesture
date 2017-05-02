var vm = new Vue({
		el:"#app",
		mounted:function(){
			var ctx = this.initDrawCircles(30);
			this.moveTo(ctx);
		},
		data:{
			path:{
				pageX:'',
				pageY:''
			},
			radius:0,
			imgData:{},
			centerPoints:[],
			pointList:[],
			base:0,
			password:[],
			lineColor:'',
			pointColor:'',
			defaultWidth:300,
			defaultHeight:300,
			setOption:'setPwd',
			message:'请输入手势密码',
			showAlert:false,
			notifyStyle:''
		},
		methods:{
			resetPsw:function(){
				window.localStorage.setItem('self_touch_password','');
				this.showAlert = true;
				this.message='密码已重置,请重新设置密码!';
				this.notify($('.alert'),'alert-success');
			},
			closeImmediatly:function(){//重写bootstrap的关闭函数
				this.showAlert = false;
			},
			notify:function(container,style){//提示显示和隐藏动画
				this.showAlert = true;
				this.notifyStyle = style;
				container.animate({
			           opacity: "show"
			     }, "slow");
				setTimeout(function(){
					container.animate({
				           opacity: "hide"
				       }, "slow");
					this.showAlert = false;
				},2000);
			},
			drawCircle:function(ctx,x,y,radius,start,end,circleColor){//画九宫格圆圈
				if(!ctx)return;
				ctx.beginPath();
				ctx.arc(x,y,radius,start,end);
				ctx.strokeStyle = circleColor||'#81C0C0';
				ctx.stroke();
				ctx.closePath();	
			},
			initDrawCircles:function(radius){//初始化九宫格界面
				var c=document.getElementById("myCanvas");
				var ctx=c.getContext("2d");
				this.base = (300 - 3*2*radius)/(3*2)+radius;
				for(var i=0;i<3;i++){
					for(var j=0;j<3;j++){
						var x = (j*2+1)*this.base;
						var y = (i*2+1)*this.base;
						this.centerPoints.push({'x':x,'y':y});
						this.drawCircle(ctx,x,y,radius,0,2*Math.PI);
					}
				}
				
				this.radius = radius;
				this.imgData=ctx.getImageData(0,0,300,300);//缓存初始状态
				return ctx;
			},
			drawPoint:function(ctx,x,y,r){//绘制选中圆圈中的小圆点（重复部分）
				if(!ctx)return;
				ctx.beginPath();
				ctx.arc(x,y,r,0,2*Math.PI);
				ctx.strokeStyle = this.pointColor;
				ctx.fillStyle=this.pointColor;
				ctx.fill();
				ctx.stroke();
				ctx.closePath();
			},
			isInCircle:function(x1,y1,x2,y2,r){//判断该点是否在圆圈内
				if(Math.sqrt(Math.pow((x1-x2),2)+Math.pow((y1-y2),2))<r)
					return true;
				else
					return false;
			},
			findPoint:function(point){//找到选中的圆圈
				for(var i=0;i<this.centerPoints.length;i++){
					var p = this.centerPoints[i];
					if(this.isInCircle(p.x,p.y,point.pageX,point.pageY,this.radius)){
						return p;
					}
				}
			},
			transToNumber:function(x,y){//由坐标转换为数字(目前的画布及半径来计算恰好是整数，除不尽的情况暂未考虑)
				var l = (x/this.base+1)/2;
				var r = (y/this.base+1)/2;
				var num = l+(r-1)*3;
				return num;
			},
			drawPointList:function(ctx,pointList,r){//绘制已经选中的圆圈（遍历）
				for(var i=0;i<pointList.length;i++){
					this.drawPoint(ctx,pointList[i].x,pointList[i].y,r);
				}
			},
			drawLine:function(ctx,x,y){//绘制线条（重复部分）
				ctx.lineWidth=4;
				ctx.beginPath();
				ctx.moveTo(this.path.pageX,this.path.pageY);
				ctx.lineTo(x,y);
				ctx.strokeStyle=this.lineColor;
				ctx.stroke();
			},
			drawPointsLine:function(ctx){//绘制已选中的线条（遍历）
				for(var i=0;i<this.pointList.length;i++){
					ctx.lineWidth=4;
					ctx.beginPath();
					ctx.moveTo(this.pointList[i].x,this.pointList[i].y);
					if(this.pointList[i+1])
						ctx.lineTo(this.pointList[i+1].x,this.pointList[i+1].y);
					else{
						this.path.pageX = this.pointList[i].x;
						this.path.pageY = this.pointList[i].y;
						ctx.lineTo(this.pointList[i].x,this.pointList[i].y);
					}
					ctx.strokeStyle=this.lineColor;
					ctx.stroke();
				}
			},
			getRelativePosition:function(event){//当canvas位置调整后,获取相对位置
				var px,py;
				if(event.originalEvent.type.substring(0,5)=="mouse"){
					px = event.offsetX;
					py = event.offsetY;
				}else{
					var rect = event.currentTarget.getBoundingClientRect();
	                px = event.originalEvent.touches[0].clientX - rect.left,
	                py = event.originalEvent.touches[0].clientY - rect.top
				}
				return {x:px,y:py};
			},
			moveTo:function(ctx){//滑动事件
				var that = this;
				$('#myCanvas').on('mousedown touchstart',function(e){
					that.path.pageX = that.getRelativePosition(e).x;//e.clientX || e.originalEvent.targetTouches[0].pageX;
					that.path.pageY = that.getRelativePosition(e).y;//e.clientY || e.originalEvent.targetTouches[0].pageY;
					//console.log('path',JSON.stringify(that.path));
					var point;
					if(that.path.pageX&&that.path.pageY)
						point = that.findPoint(that.path);
					that.pointList.push(point);
					//console.log(point);
					if(point){
						that.password.push(that.transToNumber(point.x,point.y));
					$('#myCanvas').on('mousemove touchmove',function(event){
						//console.log(event);
						var px = that.getRelativePosition(event).x;//event.pageX||event.originalEvent.targetTouches[0].pageX;
						var py = that.getRelativePosition(event).y;//event.pageY||event.originalEvent.targetTouches[0].pageY;
						//$("span").text(px+ ", " + py);
						that.initCanvas(ctx,'#00CACA');
						var p = that.findPoint({pageX:px,pageY:py});
						var flag = that.isInPointList(p);
						if(!flag&&p){
							that.addToPointList(p);
						}else{
							that.drawLine(ctx,px,py);
						}
					})
				   }
				});
				$('#myCanvas').on('mouseup  touchend',function(e){//绑定鼠标按键弹起或触摸松开
					var localstroage = window.localStorage; 
					ctx.closePath();
					that.setPasswordMode(ctx,localstroage);
					that.validPasswordMode(ctx,localstroage);
					$(this).off('mousemove');
					$(this).off('touchmove');
				})
			},
			setPasswordMode:function(ctx,localstorage){//设置密码模式
				var self = this;
				if(self.setOption=='setPwd'){
					var storePwd = localstorage.getItem('self_touch_password');
					if(!storePwd){
						if(self.pointList.length<=4){
							//self.message = '密码太短,至少需要5个点!';
							self.message='密码太短,至少需要5个点!';
							self.notify($('.alert'),'alert-danger');
							self.initCanvas(ctx,'red');
							self.pointList = [];
							self.password = [];
							setTimeout(function(){
								self.initCanvas(ctx,'#00CACA');
							},1500); 
						}else{
							var pawd = self.password.join('');
							localstorage.setItem('self_touch_password',pawd);
							self.initCanvas(ctx,'#00CACA');//为了平滑过渡
							self.message='请再次输入手势密码!';
							self.notify($('.alert'),'alert-info');
							self.pointList = [];
							self.password = [];
							setTimeout(function(){
								self.initCanvas(ctx,'#00CACA');
								//self.message = '请再次输入手势密码!';
								/* self.message='请再次输入手势密码!';
								self.notify($('.alert'),'alert-info'); */
							},1000);
						}
					}else{
						var pawd = self.password.join('');
						if(pawd!=storePwd){
							//self.message = '两次密码输入不一致!';
							self.message='两次密码输入不一致!';
							self.notify($('.alert'),'alert-danger');
							self.initCanvas(ctx,'red');
							self.pointList = [];
							self.password = [];
							setTimeout(function(){
								self.initCanvas(ctx,'#00CACA');
								//self.message = '请再次输入手势密码';
								self.message='请再次输入手势密码!';
								self.notify($('.alert'),'alert-info');
							},1500);
						}else{
							self.initCanvas(ctx,'green');
							//self.message = '密码设置成功!';
							self.message='密码设置成功!';
							self.notify($('.alert'),'alert-success');
							self.pointList = [];
							self.password = [];
							setTimeout(function(){
								self.initCanvas(ctx,'#00CACA');
							},1500);
						}
					}
				}
			},
			validPasswordMode:function(ctx,localstorage){//验证密码的模式
				var self = this;
				if(this.setOption=='validPwd'){
					var storePwd = localstorage.getItem('self_touch_password');
					if(!storePwd){
						self.initCanvas(ctx,'red');
						self.pointList = [];
						self.password = [];
						self.message = '请先设置密码!';
						self.notify($('.alert'),'alert-warning');
						setTimeout(function(){
							self.initCanvas(ctx,'#00CACA');
							self.message = '请输入手势密码';
							self.notify($('.alert'),'alert-info');
						},1500);
					}else{
						if(storePwd == self.password.join('')){
							self.initCanvas(ctx,'green');
							self.pointList = [];
							self.password = [];
							setTimeout(function(){
								self.initCanvas(ctx,'#00CACA');
								self.message = '密码正确!';
								self.notify($('.alert'),'alert-success');
							},1500);
						}else{
							self.message = '输入的密码不正确!';
							self.notify($('.alert'),'alert-danger');
							self.initCanvas(ctx,'red');
							self.pointList = [];
							self.password = [];
							setTimeout(function(){
								self.initCanvas(ctx,'#00CACA');
								self.message = '请输入手势密码';
								self.notify($('.alert'),'alert-info');
							},1500);
						}
					}
				}
			},
			initCanvas:function(ctx,color){//清除之前画布内容，重新初始化
				ctx.clearRect(0,0,300,300);
				ctx.putImageData(this.imgData,0,0);
				this.pointColor = color;
				this.lineColor = color;
				this.drawPointList(ctx,this.pointList,5);
				this.drawPointsLine(ctx);
			},
			addToPointList:function(point) {//数组去重&拼接密码
				if(point){
					this.pointList.push(point);
					this.password.push(this.transToNumber(point.x,point.y));
				}
			},
			isInPointList:function(point){//判断该点是否在pointList中
				var flag = false;
				if(point){
					for(var i=0; i<this.pointList.length;i++){
						if(point.x==this.pointList[i].x&&point.y==this.pointList[i].y){
							flag = true;
							break;
						}
					}
				}
				return flag;
			}
		},
	});