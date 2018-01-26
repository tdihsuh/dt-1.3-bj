/**
 * 设置Qiniu.uploader对象参数
 * @box 拖拽上传的容器
 * @img_box 图片预览容器
 */
function qiniuOption(box, img_box){
    return {
        runtimes: 'html5,flash,html4',    //上传模式,依次退化
        container: box,           //上传区域DOM ID，默认是browse_button的父元素，
        drop_element: box,        //拖曳上传区域元素的ID，拖曳文件或文件夹后可触发上传
		browse_button: img_box,         // 上传选择的点选按钮，必需
        // 在初始化时，uptoken，uptoken_url，uptoken_func三个参数中必须有一个被设置
		// 切如果提供了多个，其优先级为uptoken > uptoken_url > uptoken_func
		// 其中uptoken是直接提供上传凭证，uptoken_url是提供了获取上传凭证的地址，如果需要定制获取uptoken的过程则可以设置uptoken_func
		// uptoken : '<Your upload token>', // uptoken是上传凭证，由其他程序生成
		// uptoken_url: '/uptoken',         // Ajax请求uptoken的Url，强烈建议设置（服务端提供）
		uptoken_func: function(file){    // 在需要获取uptoken时，该方法会被调用
			var formData = new FormData();
			formData.append($("meta[name='csrf-param']").attr("content"),$("meta[name='csrf-token']").attr("content"));
			var token;
			$.ajax({
				type:"post",
				url:'/api/validate-code/qiniu-token',
				data:formData,
				processData:false,// 告诉jQuery不要去处理发送的数据
				contentType:false,// 告诉jQuery不要去设置Content-Type请求头
				async:false,
				success:function(data){
					data = eval("("+data+")");
					token = data.uptoken;
				},
				error:function(error){
					console.log(error);
				}
			});
		   return token;
		},
        save_key: false,   // 默认 false。若在服务端生成uptoken的上传策略中指定了 `sava_key`，则开启，SDK会忽略对key的处理
        domain: 'http://qiniu.meikeyun.com',   //bucket 域名，下载资源时用到，**必需**
        get_new_uptoken: false,  //设置上传文件的时候是否每次都重新获取新的token
		multi_selection: false,  //一次是否可以选择多个文件
        max_file_size: '10mb',           //最大文件体积限制
        flash_swf_url: '/js/plupload/Moxie.swf',  //引入flash,相 对路径
        max_retries: 1,                   //上传失败最大重试次数
        dragdrop: true,                   //开启可拖曳上传
        chunk_size: '0mb',                //分块上传时，每片的体积
        auto_start: false,                 //选择文件后自动上传，若关闭需要自己绑定事件触发上传
        unique_names: false,      //设置所有文件名唯一
        filters: {
            mime_types : [ //只允许上传图片
                { title : "Image files", extensions : "jpg,jpeg,gif,png" },
            ],
            prevent_duplicates : false //不允许选取重复文件
        },
        deleteAfterDays:'',
        init: {
			'Key': function(up, file) {
				// do something with key
				return '/image-tmp/'+file.id+file.name;
			},
            'FilesAdded': function(up, files) {
                // 设置预览图地址
                var img = new o.Image();
                img.onload = function (){
                    $("#" + img_box).attr('src', this.getAsDataURL());
                }
                img.load(files[0].getSource());
                
                plupload.each(files, function(file) {
                    // 如果上传文件大于1 ps：第一个文件上传的时候用户选择第二个文件
                    // 这时队列大于1，队列的第一个文件是正在上传的，第二个是新选的
                    if (up.files.length > 1) {
                        // 移除当前队列里第一个文件
                        up.removeFile(up.files[0]);
                    }
                    // 文件添加进队列后,处理相关的事情
                });
            },
            'BeforeUpload': function(up, file) {
                // 每个文件上传前,处理相关的事情
            },
            'UploadProgress': function(up, file) {
                // 当前进行的百分比up.total.percent
                // 每个文件上传时,处理相关的事情
            },
            'FileUploaded': function(up, file, info) {
                // var domain = up.getOption('domain');
                // var res = $.parseJSON(info);
                // var sourceLink = domain + res.key; //获取上传成功后的文件的Url
            },
            'Error': function(up, err, errTip) {
				if(err.message=="File extension error."){
					alert("目前只支持图片格式：jpg,jpeg,gif,png");
				}else{
					alert("未知错误"+err.code+"："+err.message);
				}
				console.log(err.code+":"+err.message);
            },
            'UploadComplete': function() {
                //队列文件处理完毕后,处理相关的事情
            },
        }
    };
}