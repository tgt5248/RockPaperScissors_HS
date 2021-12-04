const express = require("express");
const socket = require("socket.io");
const http = require("http");
const fs = require("fs");
const app = express();
const server = http.createServer(app);
const io = socket(server);

app.use("/img", express.static("./static/img"));

app.get("/", (req, res) => {
  fs.readFile("./static/client.html", (err, data) => {
    if (err) {
      res.send("err");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(data);
      res.end();
    }
  });
});

let user = {};
let count = 0;
let select = [];
let playerList = [];

io.sockets.on("connection", (socket) => {
  count++;
  playerList = [];

  user[socket.id] = {};

  const req = socket.request;
  const ip = req.headers["x-fowarded-for"] || req.connection.remoteAdress;
  let user_id = socket.id;
  console.log("새로운 클라이언트 접속", ip, socket.id, req.ip);
  console.log(user);

  io.sockets.emit("num_people", count);
  console.log(count + "명이 접속했다고 메세지를 보냈습니다.");

  io.to(socket.id).emit("user_id", user_id);
  console.log(user_id + "가 접속했다고 메세지를 보냈습니다.");

  //오류 확인
  socket.on("msg", (msg) => {
    console.log(msg);
  });

  //두명 접속 확인
  if (count == 2) {
    io.sockets.emit("gameStart");
    console.log("버튼 활성화하라고 메세지를 보냈습니다.");
  } else {
    io.sockets.emit("btn_disable");
    console.log("버튼 비활성화하라고 메세지를 보냈습니다.");
  }

  //게임끝난거 확인
  socket.on("end", (p_name) => {
    console.log(p_name + "한테 end 받음");
    playerList.push(p_name);

    if (playerList.length == 2) {
      console.log(playerList + "한테 check_player보냄");
      playerList = [];
      io.sockets.emit("check_player"); //한번만 둘다한테 보내야함
    } else {
      console.log("두명이 아님");
      io.sockets.emit("btn_disable");
    }
  });

  socket.on("istwo?", (p_name) => {
    console.log(p_name + "한테 istwo? 받음");
    playerList.push(p_name);
    if (playerList.length == 2) {
      playerList = [];
      io.sockets.emit("gameStart");
      console.log("게임을 시작합니다.");
    } else {
      io.sockets.emit("btn_disable");
    }
  });

  //버튼입력받기 (data= rock,scissors,paper)
  socket.on("select_btn", (p_name, btn_id) => {
    io.to(p_name).emit("stop_count");
    select.push({ player_name: p_name, player_select: btn_id });
    console.log("%s 는 %s 선택.", p_name, btn_id);
    console.log(select);

    if (select.length == 2) {
      let p1_select = select[0]["player_select"];
      let p1_name = select[0]["player_name"];
      let p2_select = select[1]["player_select"];
      let p2_name = select[1]["player_name"];
      console.log(p1_name, p1_select, p2_name, p2_select);
      if (p1_select == "rock") {
        if (p2_select == "rock") {
          io.sockets.emit("result_draw", p1_select, p2_select);
          console.log(p1_select + " " + p2_select + "으로 비겼다.");
        } else if (p2_select == "scissors") {
          io.to(p1_name).emit("result_win", p1_select, p2_select);
          console.log(p1_name + "이 이겼다.");
          io.to(p2_name).emit("result_lose", p1_select, p2_select);
          console.log(p2_name + "이 졌다.");
        } else {
          io.to(p2_name).emit("result_win", p1_select, p2_select);
          console.log(p2_name + "이 이겼다.");
          io.to(p1_name).emit("result_lose", p1_select, p2_select);
          console.log(p1_name + "이 졌다.");
        }
      } else if (p1_select == "scissors") {
        if (p2_select == "scissors") {
          io.sockets.emit("result_draw", p1_select, p2_select);
          console.log(p1_select + " " + p2_select + "으로 비겼다.");
        } else if (p2_select == "paper") {
          io.to(p1_name).emit("result_win", p1_select, p2_select);
          console.log(p1_name + "이 이겼다.");
          io.to(p2_name).emit("result_lose", p1_select, p2_select);
          console.log(p2_name + "이 졌다.");
        } else {
          io.to(p2_name).emit("result_win", p1_select, p2_select);
          console.log(p2_name + "이 이겼다.");
          io.to(p1_name).emit("result_lose", p1_select, p2_select);
          console.log(p1_name + "이 졌다.");
        }
      } else {
        if (p2_select == "paper") {
          io.sockets.emit("result_draw", p1_select, p2_select);
          console.log(p1_select + " " + p2_select + "으로 비겼다.");
        } else if (p2_select == "rock") {
          io.to(p1_name).emit("result_win", p1_select, p2_select);
          console.log(p1_name + "이 이겼다.");
          io.to(p2_name).emit("result_lose", p1_select, p2_select);
          console.log(p2_name + "이 졌다.");
        } else {
          io.to(p2_name).emit("result_win", p1_select, p2_select);
          console.log(p2_name + "이 이겼다.");
          io.to(p1_name).emit("result_lose", p1_select, p2_select);
          console.log(p1_name + "이 졌다.");
        }
      }
      select = [];
    }
  });

  socket.on("disconnect", () => {
    count--;
    console.log(socket.id + "퇴장");
    delete user[socket.id];
  });
});

server.listen(80, function () {
  console.log("서버시작");
});
