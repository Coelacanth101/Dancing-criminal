const { Console } = require("console");
const { emit } = require("process");

//サーバー用変数
const app  = require("express")();
const http = require("http").createServer(app);
const io   = require("socket.io")(http);
const DOCUMENT_ROOT = __dirname + "/public";
const SECRET_TOKEN = "abcdefghijklmn12345";

app.get("/", (req, res)=>{
  res.sendFile(DOCUMENT_ROOT + "/Dancing criminal.html");
});

app.get("/:file", (req, res)=>{
  res.sendFile(DOCUMENT_ROOT + "/" + req.params.file);
});

/**
 * 3000番でサーバを起動する
 */
 http.listen(process.env.PORT || 3000, ()=>{
  console.log("listening on *:3000");
});


/*------------------------------------------
------------------------------------------*/


//ゲーム用変数
let nop;
let playersName = ['','','','','','','','']
let players
let defaultCards;
let usingCards;
let turn;
let phase;
let criminal
let publicSide
let criminalSide
let turnPlayer
let winner
let loser
let clickedPlayer
let cardHolder
let cardType
let cardNumber
let whoHasChosen
let chosenPlayer
let myCardNumber
let hisCardNumber
let person
let e


class Player{
  constructor(name, hands, usedCards, choice, score, id, socketID){
      this.name = name;
      this.hands = hands;
      this.usedCards = usedCards;
      this.choice = choice;
      this.score = score;
      this.id= id;
      this.socketID = socketID
  }
}



io.on("connection", (socket)=>{
  //名前の入力
  socket.on("nameInput", (data)=>{
    if(!arrayHasID(playersName, socket.id)){
      playersName[data.number] = {name:data.name, socketID:data.socketID};
      io.emit("nameInput", data);     
    }
  });

  //スタートボタンクリック
  socket.on('start', ()=>{
    let i = 1
    while(i <= 8){
        discard('', playersName);
        i += 1;
    };
    nop = playersName.length;
    gameStart()
  })

  //newgame
  socket.on('newGame', (e)=>{
    newGame();
  })

  //initialize
  socket.on('initialize', (e)=>{
    initialize();
  })

  //turnOver
  socket.on('turnOver', (e)=>{
    turnOver();
  })

  //カードをクリック
  socket.on('clickCard', (data)=>{
    clickCard(data);
  })

  //プレーヤーをクリック
  socket.on('clickPlayer', (data)=>{
    clickPlayer(data);
  })

  //確認ボタンをクリック
  socket.on('clickCheck', (data)=>{
    if(phase === 'checking' && data === turnPlayer.socketID){
      check();
    };
  });

});

//初期化 html書き換え
function initialize(){
  playersName = ['','','','','','','','']
  players = []
  io.emit('initialize', players)
}



function gameStart(){
  if(nop >= 3){
      playerMake();
      newGame();
      playerDisplay();
      reload();
      io.emit('nameInputHide', players);
  }
}
//プレーヤー作成
function playerMake(){
  let i = 1
  while(i <= nop){
      let name = playersName[i-1].name
      let socketID = playersName[i-1].socketID
      const player = new Player(name, [], [], [], 0, `player${i}`,socketID)
      players.push(player)
      i += 1
  }
}
//進行状況初期化
function newGame(){
  defaultCards = ['discoverer', 'criminal', 'detective', 'alibi','dog','boy','ordinary','ordinary','trick','trick','witness','witness','witness','control','control','control','detective','detective','detective','rumour','rumour','rumour','rumour','alibi','alibi','alibi','alibi','trade','trade','trade','trade','trade'];
  usingCards = [];
  for(player of players){
      player.hands = [];
      player.usedCards = [];
      player.choice = [];
  }
  turn = 1;
  phase = 'play';
  publicSide = players.slice();
  criminalSide = [];
  winner = [];
  loser = [];
  deckMake(nop);
  deal();
  io.emit('newGame', players)
}

function playerDisplay(){
  io.emit('playerDisplay', players)
}

function reload(){
  io.emit('reload', players)
}

//リストから削除
function discard(item,list){
  if(list.includes(item)){
      let i = list.indexOf(item);
      list.splice(i, 1);
  }
}

function turnOver(){
  let checkingPlayer = nextPlayer(turnPlayer);
  while(true){
      if(checkingPlayer.hands.length !== 0){
          turnPlayer = checkingPlayer;
          break;
      } else{
          checkingPlayer = nextPlayer(checkingPlayer);
      }
  }
  turn += 1
  if(winner.length !== 0 || loser.length !== 0){

  } else if(turn === 1){
      return
  } else {
      io.emit('turnOver', turnPlayer)
  }
  reload();
  phase = 'play'
}

//市民からたくらみ使用済みに移動
function ptoc(player){
  discard(player, publicSide);
  if(!criminalSide.includes(player)){
      criminalSide.push(player);
  };
};

//人数に応じてカードを抜き出す
function deckMake(nop){
  let i = 1
  if(nop === 3){
      requiredCards = ['discoverer', 'criminal', 'detective', 'alibi'];
      for (let item of requiredCards){
          const index = defaultCards.indexOf(item);
          usingCards.push(defaultCards[index]);
          defaultCards.splice(index, 1);
      };
      while(i <= 8){
          let randomNumber = Math.floor(Math.random()*defaultCards.length)
          usingCards.push(defaultCards[randomNumber]);
          defaultCards.splice(randomNumber, 1);
          i += 1;
      };
  } else if(nop === 4){
      requiredCards = ['discoverer', 'criminal', 'detective', 'alibi','trick'];
      for (let item of requiredCards){
          const index = defaultCards.indexOf(item);
          usingCards.push(defaultCards[index]);
          defaultCards.splice(index, 1);
      };
      while(i <= 11){
          let randomNumber = Math.floor(Math.random()*defaultCards.length)
          usingCards.push(defaultCards[randomNumber]);
          defaultCards.splice(randomNumber, 1);
          i += 1;
      };
  } else if(nop === 5){
      requiredCards = ['discoverer', 'criminal', 'detective', 'alibi', 'alibi','trick'];
      for (let item of requiredCards){
          const index = defaultCards.indexOf(item);
          usingCards.push(defaultCards[index]);
          defaultCards.splice(index, 1);
      };
      while(i <= 14){
          let randomNumber = Math.floor(Math.random()*defaultCards.length)
          usingCards.push(defaultCards[randomNumber]);
          defaultCards.splice(randomNumber, 1);
          i += 1;
      };
  } else if(nop === 6){
      requiredCards = ['discoverer', 'criminal', 'detective', 'detective', 'alibi', 'alibi','trick', 'trick'];
      for (let item of requiredCards){
          const index = defaultCards.indexOf(item);
          usingCards.push(defaultCards[index]);
          defaultCards.splice(index, 1);
      };
      while(i <= 16){
          let randomNumber = Math.floor(Math.random()*defaultCards.length)
          usingCards.push(defaultCards[randomNumber]);
          defaultCards.splice(randomNumber, 1);
          i += 1;
      };
  } else if(nop === 7){
      requiredCards = ['discoverer', 'criminal', 'detective', 'detective', 'alibi', 'alibi', 'alibi','trick', 'trick'];
      for (let item of requiredCards){
          const index = defaultCards.indexOf(item);
          usingCards.push(defaultCards[index]);
          defaultCards.splice(index, 1);
      };
      while(i <= 19){
          let randomNumber = Math.floor(Math.random()*defaultCards.length)
          usingCards.push(defaultCards[randomNumber]);
          defaultCards.splice(randomNumber, 1);
          i += 1;
      };
  } else if(nop === 8){
      while(i <= 32){
          let randomNumber = Math.floor(Math.random()*defaultCards.length)
          usingCards.push(defaultCards[randomNumber]);
          defaultCards.splice(randomNumber, 1);
          i += 1;
      };
  };
};

//カードを配る
function deal(){
  for(player of players){
      let i = 1;
      while(i <= 4){
          let randomNumber = Math.floor(Math.random()*usingCards.length);
          player.hands.push(usingCards[randomNumber]);
          if(usingCards[randomNumber] === 'discoverer'){
              turnPlayer = player
          }
          usingCards.splice(randomNumber,1);
          i += 1;
      }
  }
  criminalCheck();
  reload()
}

//次のプレーヤー
function nextPlayer(cp){
  if(players.indexOf(cp) === nop-1){
      return players[0];
  } else {
      return players[players.indexOf(cp)+1];
  }
}

//前のプレーヤー
function prePlayer(cp){
  if(players.indexOf(cp) === 0){
      return players[nop-1];
  } else {
      return players[players.indexOf(cp)-1];
  }
}

//犯人
function criminalCheck(){
  let p = 1
  while(p <= players.length){
      if(players[p-1].hands.includes('criminal')){
          criminal = players[p-1];
      };
      p += 1
  };
}

//ゲーム終了
function gameover(){
  let win = ''
  let lose = ''
  if(winner.length !== 0){
      win = winner[0].name;
      i = 1;
      while(i <= winner.length-1){
          win += `,${winner[i].name}`
          i += 1;
      }
      win += 'の勝ち、'
  }
  lose = loser[0].name;
  i = 1;
  while(i <= loser.length-1){
      lose += `,${loser[i].name}`
      i += 1;
  }
  lose += 'の負け'
  let result = win + lose + 'です。'
  phase = 'finished';
  for(w of winner){
      w.score += 1;
  };
  for(l of loser){
      l.score -= 1;
  };
  data = {players:players, result:result}
  io.emit('gameOver', data)
}

//idからオブジェクトに変換
function idToObject(id){
  for(player of players){
      if(player.id === id){
          return player
      }
  }
}

//カードを使う
function play(cardname){
  discard(cardname, turnPlayer.hands);
  turnPlayer.usedCards.push(cardname);
  reload()
  let playCardName = 'play' + cardname
  data = {turnPlayer:turnPlayer, criminal:criminal}
  io.emit(playCardName, data)
}


function playDiscoverer(){
  play("discoverer");
  turnOver();
}

function playCriminal(){
  play('criminal');
  discard(turnPlayer, publicSide);
  discard(turnPlayer, criminalSide);
  criminalSide.unshift(turnPlayer);
  winner = criminalSide;
  loser = publicSide;
  gameover();
}

function playDetective(){
  phase = "detective";
  play("detective");
}

function detectiveChoice(){
  detectivechoicedata = {detectiveright:false, clickedPlayer:clickedPlayer}
  if(criminal === clickedPlayer && !clickedPlayer.hands.includes('alibi')){
      discard(clickedPlayer, criminalSide);
      criminalSide.unshift(clickedPlayer);
      if(!criminalSide.includes(turnPlayer)){
          winner.push(turnPlayer);
      }
      loser = criminalSide;
      gameover();
      detectivechoicedata.detectiveright = true
  } else {
    turnOver();
  };
  io.emit('detectiveChoice', detectivechoicedata)
}

function playAlibi(){
  play('alibi');
  turnOver();
}

function playTrick(){
  play('trick');
  ptoc(turnPlayer);
  turnOver();
}

function playDog(){
  phase = 'dog'
  play('dog');
}

function dogChoice(){
  dogchoicedata = {dogright:false, cardType:cardType, cardHolder:cardHolder, criminal:criminal, cardNumber:cardNumber, turnPlayer:turnPlayer}
  if(cardType ==='criminal'){
    dogchoicedata.dogright = true
    discard(cardHolder, criminalSide);
    criminalSide.unshift(cardHolder);
    if(!criminalSide.includes(turnPlayer)){
        winner.push(turnPlayer);
    }
    loser = criminalSide;
    gameover();
  } else {
    phase ='checking'
  }
  io.emit('dogChoice', dogchoicedata)
}

function check(){
  io.emit('clickCheck', e)
  turnOver();
}

function playBoy(){
  play('boy')
  phase = 'checking'
}

function playOrdinary(){
  play("ordinary");
  turnOver();
}

function playRumour(){
  play("rumour");
  let i = 1;
  let chosenCards =[];
  while(i <= players.length){
      let rightPlayer = prePlayer(players[i-1]);
      if(rightPlayer.hands.length !== 0){
          let random = Math.floor(Math.random()*rightPlayer.hands.length);
          let card = rightPlayer.hands[random];
          chosenCards.push(card);
          rightPlayer.hands.splice(random, 1);
      } else {
          chosenCards.push('');
      }
      i += 1;
  }
  i = 1;
  while(i <= players.length){
      if(chosenCards[0] !== ''){
          players[i-1].hands.push(chosenCards[0]);
      }
      chosenCards.splice(0,1);
      i += 1;
  }
  criminalCheck();
  turnOver();
}

function playTrade(){
  play("trade");
  if(!turnPlayer.hands.length){
    turnOver();
  }else{
    phase = 'tradeplayerchoice'
  }
}
function makeTrade(tradedata){
  let newHisCard = tradedata.turnPlayer.hands.splice(tradedata.myCardNumber-1, 1)[0]
  let newMyCard = tradedata.chosenPlayer.hands.splice(tradedata.hisCardNumber-1, 1)[0]
  turnPlayer.hands.push(newMyCard);
  chosenPlayer.hands.push(newHisCard);
  io.emit('maketrade', tradedata)
  criminalCheck();
  turnOver();
}

function playControl(){
  phase = 'control'
  play("control");
}
function whoNotChosen(){
  person = ''
  for(player of players){
      if(!whoHasChosen.includes(player)){
          person += `,${player.name}`
      }
  }
  person = person.slice(1)
  io.emit('whoNotChosen', person)
}  
function passCard(){
  let i = 1
  while(i <= nop){
      if(players[i-1].choice.length){
          nextPlayer(players[i-1]).hands.push(players[i-1].choice[0]);
          players[i-1].hands.splice(players[i-1].choice[1]-1, 1)
          players[i-1].choice = []
      }else{
      }
      i += 1;
  };
  io.emit('passCard', data)
  criminalCheck();
  turnOver();
};


function playWitness(){
  phase = 'witness'
  play("witness");
}
function witnessChoice(){
  data = {clickedPlayer:clickedPlayer, turnPlayer:turnPlayer}
  io.emit('witnessChoice', data)
  phase = 'checking';
}

function clickPlayer(data){
  clickedPlayer = idToObject(data.clickedPlayerID);
  if(data.socketID === turnPlayer.socketID){
    switch(phase){
      case 'detective':
          if(clickedPlayer !== turnPlayer && clickedPlayer.hands.length){
              detectiveChoice();
          }
          break;
      case 'tradeplayerchoice':
        tradeplayerchoicedata = {chosenPlayer:clickedPlayer, turnPlayer:turnPlayer}
          if(clickedPlayer !== turnPlayer && clickedPlayer.hands.length){
              phase = 'trade'
              chosenPlayer = clickedPlayer
              io.emit('tradeplayerchoice', tradeplayerchoicedata)
          }
          
          break;
      case 'witness':
          if(clickedPlayer !== turnPlayer && clickedPlayer.hands.length){
              witnessChoice();
          }
          break;
    };
  };
}

function clickCard(data){
  cardHolder  = idToObject(data.cardHolderID)
  cardType = data.cardType
  cardNumber = data.cardNumber
  switch(phase){
    case 'play':
      if(cardHolder === turnPlayer && data.socketID === turnPlayer.socketID){
        if(turn !== 1){
          switch(cardType){
            case 'criminal':
              if(turnPlayer.hands.length === 1){
                playCriminal();
              }
              break;
            case 'detective':
              if(turn > players.length){
                playDetective();
              }else{
                c = turnPlayer.hands.slice();
                let i = 1;
                while(i <= turnPlayer.hands.length){
                  discard('detective', c);
                  i += 1;
                }
                discard('criminal', c)
                if(c === []){
                  playDetective();
                }
              }
              break;
            case 'alibi':
              playAlibi();
              break;
            case 'trick':
              playTrick();
              break;
            case 'dog':
              playDog();
              break;
            case 'boy':
              playBoy();
              break;
            case 'ordinary':
              playOrdinary();
              break;
            case 'rumour':
              playRumour();
              break;
            case 'trade':
              playTrade();
              break;
            case 'control':
              playControl();
              whoHasChosen = []
              for(player of players){
                if(player.hands.length === 0){
                  whoHasChosen.push(player);
                };
              }
              whoNotChosen()
              break;
            case 'witness':
              playWitness();
              break;
          }
        } else if(cardType === 'discoverer'){
          playDiscoverer();
          break;
        }
      }
      break;
    case 'dog':
      if(cardHolder !== turnPlayer && data.socketID === turnPlayer.socketID){
        dogChoice();
      }
      break;
    case 'trade':
      tradedata = {myCardNumber:myCardNumber, hisCardNumber:hisCardNumber, chosenPlayer:chosenPlayer, turnPlayer:turnPlayer}
      if(cardHolder === turnPlayer && data.socketID === turnPlayer.socketID){
        myCardNumber = cardNumber
        tradedata.myCardNumber = myCardNumber
        io.emit('tradecardselect', tradedata)
      }else if(cardHolder === chosenPlayer && data.socketID === cardHolder.socketID){
        hisCardNumber = cardNumber
        tradedata.hisCardNumber = hisCardNumber
        io.emit('tradecardselect', tradedata)
      }
      if(tradedata.myCardNumber && tradedata.hisCardNumber){
        makeTrade(tradedata);
        myCardNumber = ''
        hisCardNumber = ''
        tradedata.myCardNumber = ''
        tradedata.hisCardNumber = ''
      }
      break;
    case 'control':
      if(data.socketID === cardHolder.socketID){
        cardHolder.choice = [];
        cardHolder.choice.push(cardHolder.hands[cardNumber-1]);
        cardHolder.choice.push(cardNumber)
        discard(cardHolder, whoHasChosen)
        whoHasChosen.push(cardHolder);
        whoNotChosen()
        io.emit('controlcardselect', cardHolder)
        if(whoHasChosen.length === nop){
          passCard();
        }
        break;
      }
      break
  };
}

function arrayHasID(array, number){
  for(item of array){
    if(item.socketID === number){
      return true
      break
    }
  }
  return false
}
