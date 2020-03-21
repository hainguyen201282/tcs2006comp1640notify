module.exports = function(sockIO, i18n) {
    var express = require('express');
    const jwt = require("jsonwebtoken");
    var router = express.Router();
    var mysql = require('mysql')
    const moment = require("moment");
    require('dotenv').config({ path: 'push-server-config.env' });
    var connection = mysql.createConnection({
      host: process.env.HOST,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      database: process.env.DATABASE
    })
    connection.connect()

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
 
            socket.on("send_notification", (data) => {
                console.log(nspPrefixDefault + " new notification: " + JSON.stringify(data) + " with socket id: " + socket.id);
                const currentTime = moment().unix();
                
                const eventName = data['eventName'];

                switch(eventName){
                    case "assign_student_to_tutor":

                        let findUserInfo = "SELECT * FROM `tbl_users` WHERE `userId` = " + data['tutor_id'];
                        connection.query(findUserInfo, function (err, rows, fields) {
                            let tutorName = ''
                            if (rows.length > 0) {
                                tutorName = rows[0].name;
                            }

                            const payload = {
                                'eventName': data['eventName'], 
                                'student_ids': data['student_ids'], 
                                'tutor_id': data['tutor_id'],
                                'tutor_name': tutorName
                            };
                            res = response(1, "success", payload);
                            console.log(nspPrefixDefault + " response data: " + JSON.stringify(res));
                            socket.broadcast.emit("send_notification_callback", res);
                        
                        });
                        
                    break;
                }

            })
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

