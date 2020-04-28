module.exports = function(sockIO, i18n) {
    var express = require('express');
    const jwt = require("jsonwebtoken");
    var router = express.Router();
    var mysql = require('mariadb');
    const moment = require("moment");
    require('dotenv').config({ path: 'push-server-config.env' });
    var pool  = mysql.createPool({
      host: process.env.HOST,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      database: process.env.DATABASE
    });

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
                    case "send_message":

                        let findUserInfo = "SELECT * FROM `tbl_users` WHERE `userId` = " + data['tutor_id'];

                        pool.getConnection()
                        .then(conn => {
                        
                          conn.query(findUserInfo)
                            .then(rows => { // rows: [ {val: 1}, meta: ... ]
                                let tutorName = ''
                                if (rows.length > 0) {
                                    tutorName = rows[0].name;
                                }

                                const payload = {
                                    'eventName': data['eventName'], 
                                    'student_ids': data['student_ids'], 
                                    'tutor_id': data['tutor_id'],
                                    'tutor_name': data['tutor_name'] ? data['tutor_name'] : tutorName,
                                    'student_name': data['student_name'] ? data['student_name'] : "",
                                    'sent_by_student': data['sent_by_student'] ? data['sent_by_student'] : ""
                                };
                                res = response(1, "success", payload);
                                console.log(nspPrefixDefault + " response data: " + JSON.stringify(res));
                                socket.broadcast.emit("send_notification_callback", res);
                            })
                            .then(res => { // res: { affectedRows: 1, insertId: 1, warningStatus: 0 }
                              console.log('res', res);
                              conn.release(); // release to pool
                            })
                            .catch(err => {
                              console.log('query error', err);
                              conn.release(); // release to pool
                            })
                            
                        }).catch(err => {
                            console.log('connection error', err);
                          //not connected
                        });
                        
                    break;


                    case "invite_student_to_conference":
                        const payload = {
                            'eventName': data['eventName'], 
                            'student_ids': data['student_ids'], 
                            'sender_id': data['sender_id'] ? data['sender_id'] : "",
                            'sender_role': data['sender_role'] ? data['sender_role'] : "",
                            'sender_name': data['sender_name'] ? data['sender_name'] : ""
                        };
                        res = response(1, "success", payload);
                        console.log(nspPrefixDefault + " response data: " + JSON.stringify(res));
                        socket.broadcast.emit("send_notification_callback", res);
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

