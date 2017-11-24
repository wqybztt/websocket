var util = require('util');
var _ = require('lodash');
var uuid  = require('uuid/v4');
var  WebSocket = require('ws');
var socket = {};

var areas = _.range(37,378);
var inds = [7,8,9,10,11,12,17,18];

socket.users = [];
socket.admins = [];

socket.parse = function(str){
    var res;
    try{
        res = JSON.parse(str);
    }catch(err){
        res = null;
    }
    return res;
}

socket.stringify = function(type,data){
    return JSON.stringify({type:type,data:data});
}

socket.getSocket = function(server){
    var that = this;
    var wss = new WebSocket.Server({server:server});

    wss.on('connection',function(ws,req){
        console.log('连接成功');
        if(!ws.id) ws.id = uuid();
        ws.on('message', function(message){
            var res = that.parse(message);
            if(!res) return false;
            if(!res.type || !res.auth) return false;
            var auth = res.auth;
            if(!auth.uuid) return false;
            var type = res.type;
            if(!!auth.token){//管理员
                if(!ws.type) ws.type = 1;
                if(type==='login'){
                    that.admins.push({
                        uuid:auth.uuid,
                        ws:ws,
                        time:+new Date()
                    });
                    ws.send(that.stringify('user_count',{toal:that.users.length}));
                }else if(type==='send_msg'){//推送消息
                    var data = res.data;
                    var num = 0;
                    that.users.forEach(function(user){
                        var udata = user.data;
                        if(user.ws && ( _.indexOf(data.moneys,udata.money)>=0 || _.indexOf(data.area,udata.area) >= 0 || _.indexOf(data.inds,udata.ind) >= 0 )){
                            var msg = {id:data.id,type:data.type,title:data.title,url:data.url};
                            user.ws.send(that.stringify('send_msg',msg));
                            num++;
                        }
                    });
                    ws.send(that.stringify('send_msg_suc',{num:num,id:data.id}));
                }
            }else{//普通访客
                if(!ws.type) ws.type = 2;
                if(type==='login'){//用户信息
                    var data = res.data;
                    var udata = {
                        area:data.area || (_.shuffle(areas))[0],
                        money:_.random(1,4),
                        ind:(_.shuffle(inds))[0]
                    };
                    that.users.push({
                        uuid:auth.uuid,
                        ws:ws,
                        data:udata,
                        time:+new Date()
                    });
                    that.admins.forEach(function(admin){
                        if(admin.ws) admin.ws.send(that.stringify('user_count',{toal:that.users.length}));
                    });
                }
            }
        });

        ws.on('close',function(){
            console.log('关闭连接');
            if(ws.type==1){//管理员
                var idx = _.findIndex(that.admins,function(admin){ return admin.ws.id === ws.id });
                if(idx >= 0) that.admins.splice(idx,1);
            }else if(ws.type==2){//访客
                var idx = _.findIndex(that.users,function(user){ return user.ws.id === ws.id});
                if(idx >= 0) that.users.splice(idx,1);
                that.admins.forEach(function(admin){
                    if(admin.ws) admin.ws.send(that.stringify('user_count',{toal:that.users.length}));
                });
            }
        });

    });

}



module.exports = socket;