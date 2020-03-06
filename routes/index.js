module.exports = function(sockIO, i18n) {
    var express = require('express');
    const jwt = require("jsonwebtoken");
    var router = express.Router();
    var mysql = require('mysql')
    const moment = require("moment");
    require('dotenv').config({ path: 'push-server-config.env' });
    // var connection = mysql.createConnection({
    //   host: process.env.HOST,
    //   user: process.env.USERNAME,
    //   password: process.env.PASSWORD,
    //   database: process.env.DATABASE
    // })
    // connection.connect()

    /* GET home page. */
    router.get('/', function(request, response, next) {
      i18n.setLocale('en');
      response.render('index', { title: i18n.__('NEW_NOTIFICATION') });
    });

    router.post('/', function (request, response, next) {
      var body = request.body;

      var lat = body.lat;
      var lng = body.lng;
      if (body.lang) {
        var lang = body.lang;
        i18n.setLocale(lang);
      }

      response.send('Got a POST request ' + body.job_id );
    });

    let allClients = [];
    let allClientRooms = {};
    allClientRooms['customer_room'] = {};
    allClientRooms['handyman_room'] = {};
    let noOfConnection = 0;
    const nspPrefixDefault = "[Default Namespace] ";
    const iochat = sockIO.of('/chat');
    sockIO.on('connection', function(socket){ 
      console.log('Notification service is running'); 
      const socketId = socket.id;
            noOfConnection++;
            console.log(nspPrefixDefault + " Detect new connection from: " + socketId);
            console.log(socket.request.headers);
            console.log(nspPrefixDefault + " No of connection: " + noOfConnection);
            allClients.push(socket);
            // let token = socket.request.headers['authorization'];
            //auto connect after detect connected although user don't subscribe (if user post token) //do later
            //emit list user
            // io.sockets.emit("list_users", users);

            // Error reporting
            socket.on('error', function (err) {
                console.log(nspPrefixDefault + " Socket.IO Error");
                console.log(err.stack);
            });
            //get disconnect
            socket.on("disconnect", function (reason) {
                noOfConnection--;
                let socketId = socket.id;

                // console.log(nspPrefixDefault + " chat server disconnect with socket id: " + socket.id);
                // res = response(1, "success", {socket_id: socket.id});
                // console.log(nspPrefixDefault + " response data: " + JSON.stringify(res));
                // socket.emit("disconnect_callback", res);
            });
            //listen subscribe from client (apply for mobile client)
            socket.on("subscribe", (data) => {
                console.log(nspPrefixDefault + " new subscribe: " + JSON.stringify(data) + " with socket id: " + socket.id);
                
                // const roomId = data['room_id'];
                
                const currentTime = moment().unix();
                res = response(1, "success", {socket_id: socket.id});
                console.log(nspPrefixDefault + " response data: " + JSON.stringify(res));
                socket.emit("subscribe_callback", res);
                // customerRoom = process.env.CUSTOMER_ROOM_SUFFIX;
                // let subscribeRoomSocketSQL = '';
                // subscribeRoomSocketSQL = "INSERT INTO `chat_group_socket`(`id`, `group_id`, `socket_id`, `created_at`) VALUES ('" + create_UUID() + "', '" + customerRoom + "','" + socket.id + "'," + currentTime + ");";
                // socket.join(customerRoom);

                // let findRoomSQL = "SELECT * FROM `chat_group_socket` WHERE `group_id` IN (" + roomString + ") AND socket_id = '" + oldSocketId + "' AND isEnabled = 1";
                // connection.query(findRoomSQL, function (err, rows, fields) {
                // });
                
                // connection.query(subscribeRoomSocketSQL, function (err, rows, fields) {
                    
                //         console.log(nspPrefixDefault + " insertRoomSocketSQL: insert/update Group Socket Successfully ");
                //         res = response(1, "success", {socket_id: socket.id});
                //         console.log(nspPrefixDefault + " response data: " + JSON.stringify(res));
                //         socket.emit("subscribe_callback", res);
                //     });


            })

            socket.on("send_message", (data) => {
                console.log(nspPrefixDefault + " get data send msg at: " + moment().unix() + " with data: " + JSON.stringify(data));
                if (!data) {
                    return null;
                }

                // const roomId = data['room_id'];
                // const currentTime = moment().unix();

                // const newGroupMessageId = create_UUID();
                // res = response(1, "success", messageInfo);
                // console.log(nspPrefixDefault + " response data: " + JSON.stringify(res));
                // sockIO.to((chatRoomType == process.env.CHAT_ROOM_TYPE_HANDYMAN) ? handymanRoom : customerRoom).emit("send_message_callback", res); 
                // sockIO.to(process.env.PUSH_NOTIFICATION_ROOM).emit("send_message_callback", res); 
                
            });

            //reconnect
            socket.on("reconnect", function (data) {
                console.log(nspPrefixDefault + " reconnect " + data['socket_id']);
                const oldSocketId = data['socket_id'];
                
                // let token = data['authorization'];
                // console.log("token input: " + token);
                // const tokenInfo = decodeToken(token);

            });
    });

    function create_UUID(){
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        return uuid;
    }
    function decodeToken(token) {
        if (token) {
            token = token.replace("JWT ", "");
            return jwt.decode(token);
        }
        return null;
    }

    function response(code = -1, msg = "failed", data = null) {
        return {
            status: {
                code: code,
                msg: msg
            },
            data: data
        }
    }

// module.exports = router;
    return router;
}

