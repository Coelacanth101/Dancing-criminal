const socket = io();
let e
let nop;
let playersName
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
let cardHolderID
let cardType
let cardNumer
let whoHasChosen
let chosenPlayer
let myCard
let hisCard
let person
class Player{
    constructor(name, hands, usedCards, choice, score, id){
        this.name = name;
        this.hands = hands;
        this.usedCards = usedCards;
        this.choice = choice;
        this.score = score;
        this.id= id
    }
}
initialize()
clickCheck()
clickplayer()
clickCard()

socket.on('initialize', (players)=>{
    initialize()
})
//初期化 html書き換え
function initialize(){
    /*playersName = ['','','','','','','','']
    players = []*/
    $('#nameinputarea').show()
    $('#names').html(``)
    $('#action').html(``)
    $('#action').hide()
    $('#whoseturn').html(``)
    $('#whoseturn').hide()
    $('#players').html(``)
    $('#players').hide()
    $('#scorearea').html(``)
    $('#scorearea').hide()
    $('#checkbuttonarea').hide()
    $('#newgamebuttonarea').hide()
    $('#initializebuttonarea').hide()
    inputAreaCreate()
}

function inputAreaCreate(){
    let i = 1
    while(i<=8){
        $('#names').append(
            `<div class="player${i-1}">
            <input type="text" class="nameinput" id="${i-1}">
            <input type="button" value="決定" class="namebutton">
            </div>`
        );
        i += 1;
    }
}

//名前の入力発信
$('#nameinputarea').on('click', '.namebutton', function(){
    if($(this).prev().val()){
        myName = $(this).prev().val()
        let playerNumber = Number($(this).prev().attr('id'));
        data = {name:myName, number:playerNumber, socketID:socket.id}
        socket.emit("nameInput", data)
    }
})
//名前の入力受信
socket.on("nameInput", (data)=>{
    $(`.player${data.number}`).html(`<p><strong>${data.name}</strong></p>`)
})

//スタートボタンクリック発信
$('#startbuttonarea').on('click', '#startbutton', function(){
    socket.emit('start', e)
})
socket.on('nameInputHide', (players)=>{
    $('#nameinputarea').hide();
})

$('#newgamebuttonarea').on('click', 'button', function(){
    socket.emit('newGame', e)
})

$('#initializebuttonarea').on('click', 'button', function(){
    socket.emit('initialize', e)
})

//プレーヤーを表示 html書き換え
socket.on('playerDisplay', (players)=>{
    i = 1
    while(i <= players.length){
        $('#players').append(
            `<div id="player${i}" class="player" data-name="${players[i-1].name}">
                <div class='name'><strong>${players[i-1].name}</strong></div>
                <div class='cardarea'>
                    <div class="hands"></div>
                    <div class="used"></div>
                </div>
            </div>`
        )
        $('#scorearea').append(
            `<li id='player${i}score' class='score'>${players[i-1].name}:0点</li>`
        )
        i += 1
    }

})

//進行状況初期化 html書き換え
socket.on('newGame', (data)=>{
    $('#action').html('');
    $('#whoseturn').html('');
    $('#action').show();
    $('#whoseturn').show();
    $('#players').show();
    $('#scorearea').show();
    $('#checkbuttonarea').hide()
    $('#newgamebuttonarea').show();
    $('#initializebuttonarea').show();
})

//ターン終了 html書き換え
socket.on('turnOver', (turnPlayer)=>{
    $('#whoseturn').html(`<p><strong>${turnPlayer.name}のターンです。</strong></p>`)
})

//場を更新 html書き換え
socket.on('reload', (players)=>{
    let p = 1;
    while(p <= players.length){
        $(`#player${p} .hands`).html('');
        if(players[p-1].socketID === socket.id){
            let i = 1
            while(i <= players[p-1].hands.length){
                $(`#player${p} .hands`).append(
                    `<img src="./${players[p-1].hands[i-1]}.jpg" alt="${players[p-1].hands[i-1]}" id="player${p}card${i}" class="card ${players[p-1].hands[i-1]}" data-cardnumber="${i}">`
                );
                i += 1;
            };
            p += 1;
        }else{
            let i = 1
            while(i <= players[p-1].hands.length){
                $(`#player${p} .hands`).append(
                    `<img src="./back.jpg" alt="back" id="player${p}card${i}" data-cardnumber="${i}" class="card ${players[p-1].hands[i-1]}">`
                );
                i += 1;
            };
            p += 1;
        }
    };
    p = 1;
    while(p <= players.length){
        $(`#player${p} .used`).html('');
        let i = 1
        while(i <= players[p-1].usedCards.length){
            $(`#player${p} .used`).append(
                `<img src="./${players[p-1].usedCards[i-1]}.jpg" alt="${players[p-1].usedCards[i-1]}" class="card ${players[p-1].usedCards[i-1]}">`
            );
            i += 1;
        };
        p += 1;
    };
    $('.player').css('border-color', 'black');
})

//ゲーム終了 html書き換え
socket.on('gameOver', (data)=>{
    players = data.players
    openHand(players)
    $('#whoseturn').html(`<p><strong>${data.result}</strong></p>`)
    i = 1;
    $('#scorearea').html('');
    while(i <= data.players.length){
        $('#scorearea').append(
            `<li id='player${i}score' class='score'>${data.players[i-1].name}:${data.players[i-1].score}点</li>`
        );
        i += 1;
    };
})

//日本語名に変換
function jpName(card){
    switch(card){
        case 'discoverer':
            return '第一発見者';
        case 'criminal':
            return '犯人';
        case 'detective':
            return '探偵';
        case 'alibi':
            return 'アリバイ';
        case 'dog':
            return 'いぬ';
        case 'boy':
            return '少年';
        case 'ordinary':
            return '一般人';
        case 'trick':
            return 'たくらみ';
        case 'witness':
            return '目撃者';
        case 'control':
            return '情報操作';
        case 'rumour':
            return 'うわさ';
        case 'trade':
            return '取り引き';
    }
}

//カードの使用 html書き換え
socket.on('playdiscoverer', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}が第一発見者を出しました。</strong></p>`)
})



socket.on('playcriminal', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}が犯人を出しました。</strong></p>`)
})



socket.on('playdetective', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}が探偵を出しました。</strong></p>`)
    $('#whoseturn').html(`<p><strong>犯人を指定してください。</strong></p>`);
})

socket.on('detectiveChoice', (detectivechoicedata)=>{
    if(detectivechoicedata.detectiveright){
        $('#action').html(`<p><strong>${detectivechoicedata.clickedPlayer.name}が犯人でした。</strong></p>`)
    } else {
        $('#action').html(`<p><strong>${detectivechoicedata.clickedPlayer.name}は犯人ではありません。</strong></p>`)
    };
})

socket.on('playalibi', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}がアリバイを出しました。</strong></p>`)
})

socket.on('playtrick', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}がたくらみを出しました。</strong></p>`)
})

socket.on('playdog', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}がいぬを出しました。</strong></p>`)
    $('#whoseturn').html(`<p><strong>犯人カードを指定してください。</strong></p>`);
})

socket.on('dogChoice', (dogchoicedata)=>{
    $(`#${dogchoicedata.cardHolder.id}card${dogchoicedata.cardNumber}`).attr("src", `./${dogchoicedata.cardHolder.hands[dogchoicedata.cardNumber-1]}.jpg`)
    $(`#${dogchoicedata.cardHolder.id}card${dogchoicedata.cardNumber}`).css('background-color', 'red');
    if(dogchoicedata.dogright){
        $('#action').html(`<p><strong>${dogchoicedata.criminal.name}が犯人でした。</strong></p>`)
    } else {
        $('#whoseturn').html(`<p><strong>${dogchoicedata.cardHolder.name}の${jpName(dogchoicedata.cardType)}を見ました。</strong></p>`)
        if(socket.id === dogchoicedata.turnPlayer.socketID){
            $('#checkbuttonarea').show();
        }
    }
})

socket.on('clickCheck', (data)=>{
    $('#checkbuttonarea').hide();
})

socket.on('playboy', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}が少年を出しました。</strong></p>`)
    if(data.turnPlayer.socketID === socket.id){
        $('#whoseturn').html(`<p><strong>${data.criminal.name}が犯人カードを持っています。</strong></p>`);
    }else{
        $('#whoseturn').html(`<p><strong>${data.turnPlayer.name}が犯人カードを確認しています。</strong></p>`);
    } 
    if(socket.id === data.turnPlayer.socketID){
        $('#checkbuttonarea').show();
    };
})

socket.on('playordinary', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}が一般人を出しました。</strong></p>`)
})

socket.on('playrumour', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}がうわさを出しました。前の人からカードを1枚ずつ引きました。</strong></p>`)
})

socket.on('playtrade', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}が取り引きを出しました。</strong></p>`)
    $('#whoseturn').html(`<p><strong>カードを交換する相手を選んでください。</strong></p>`);    
})

socket.on('tradeplayerchoice', (tradeplayerchoicedata)=>{
    $(`#${tradeplayerchoicedata.chosenPlayer.id}`).css('border-color', 'red');
    $('#whoseturn').html(`<p><strong>${tradeplayerchoicedata.turnPlayer.name}と${tradeplayerchoicedata.chosenPlayer.name}は交換するカードを選んでください。</strong></p>`);
})

socket.on('tradecardselect', (tradedata)=>{
    if(tradedata.myCardNumber){
        let i = 1
        while(i <= tradedata.turnPlayer.hands.length){
            $(`#${tradedata.turnPlayer.id}card${i}`).css('background-color', '');
            i += 1
        }
        $(`#${tradedata.turnPlayer.id}card${tradedata.myCardNumber}`).css('background-color', 'red');
    }
    if(tradedata.hisCardNumber){
        let i = 1
        while(i <= tradedata.chosenPlayer.hands.length){
            $(`#${tradedata.chosenPlayer.id}card${i}`).css('background-color', '');
            i += 1
        }
        $(`#${tradedata.chosenPlayer.id}card${tradedata.hisCardNumber}`).css('background-color', 'red');
    }
})

socket.on('maketrade', (tradedata)=>{
    $('#action').html(`<p><strong>${tradedata.turnPlayer.name}と${tradedata.chosenPlayer.name}がカードを交換しました。</strong></p>`)
})


socket.on('playcontrol', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}が情報操作を出しました。</strong></p>`)
})

socket.on('controlcardselect', (cardHolder)=>{
    if(cardHolder.choice){
        let i = 1
        while(i <= cardHolder.hands.length){
            $(`#${cardHolder.id}card${i}`).css('background-color', '');
            i += 1
        }
        $(`#${cardHolder.id}card${cardHolder.choice[1]}`).css('background-color', 'red');
    }
})

socket.on('whoNotChosen',(person)=>{
    $('#whoseturn').html(`<p><strong>${person}は次の人に渡すカードを1枚選んでください。</strong></p>`); 
})

socket.on('passCard', (data)=>{
    $('#action').html(`<p><strong>カードを交換しました。</strong></p>`);
})

socket.on('playwitness', (data)=>{
    $('#action').html(`<p><strong>${data.turnPlayer.name}が目撃者を出しました。</strong></p>`);
    $('#whoseturn').html(`<p><strong>誰の手札を見ますか。</strong></p>`);
})

socket.on('witnessChoice', (data)=>{
    $(`#${data.clickedPlayer.id}`).css('border-color', 'red');
    if(data.turnPlayer.socketID === socket.id){
        let c = 1
        while(c <= data.clickedPlayer.hands.length){
            $(`#${data.clickedPlayer.id}card${c}`).attr("src", `./${data.clickedPlayer.hands[c-1]}.jpg`);
            c += 1;
        }
        $('#checkbuttonarea').show()
    }
    let cards = '';
    let i = 1;
    while(i <= data.clickedPlayer.hands.length){
        cards += `,${jpName(data.clickedPlayer.hands[i-1])}`;
        i += 1;
    }
    cards = cards.slice(1);
    $('#whoseturn').html(`<p><strong>${data.turnPlayer.name}が${data.clickedPlayer.name}の手札を見ています。</strong></p>`);
})

function clickCheck(){
    $('#checkbuttonarea').on('click', '#checkbutton', function(){
        data = socket.id
        socket.emit('clickCheck', data)
    })
}

function clickplayer(){
    $('#players').on('click', '.player', function(){
        clickedPlayerID = $(this).attr('id');
        data = {clickedPlayerID:clickedPlayerID, socketID:socket.id}
        socket.emit('clickPlayer', data)
    })
}

function clickCard(){
    $('#players').on('click', '.player .cardarea .hands .card',function(){
        cardHolderID  = $(this).parent().parent().parent().attr('id')
        cardType = $(this).attr('class').slice(5)
        cardNumber = Number($(this).data('cardnumber'))
        data = {cardHolderID:cardHolderID, cardType:cardType, socketID:socket.id, cardNumber:cardNumber}
        socket.emit('clickCard', data)
    })
}

function openHand(players){
    let p = 1;
    while(p <= players.length){
        $(`#player${p} .hands`).html('');
        let i = 1
        while(i <= players[p-1].hands.length){
            $(`#player${p} .hands`).append(
                `<img src="./${players[p-1].hands[i-1]}.jpg" alt="${players[p-1].hands[i-1]}" class="card ${players[p-1].hands[i-1]}">`
            );
            i += 1;
        };
        p += 1;
    };
    p = 1;
    while(p <= nop){
        $(`#player${p} .used`).html('');
        let i = 1
        while(i <= players[p-1].usedCards.length){
            $(`#player${p} .used`).append(
                `<img src="./${players[p-1].usedCards[i-1]}.jpg" alt="${players[p-1].usedCards[i-1]}" class="card ${players[p-1].usedCards[i-1]}">`
            );
            i += 1;
        };
        p += 1;
    };
}
