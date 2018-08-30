function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
var myAvatar = "images/avatar_" + getRandomArbitrary(1, 10) + ".png"
var otherAvatar
//avatar2 = "images/avatar_"+getRandomArbitrary(1,10)+".png"
var me = {};
me.avatar = myAvatar
var you = {};
//you.avatar = avatar2

//----------------------------AblyStuff
var myId = "id-" + Math.random().toString(36).substr(2, 16)
console.log("My ID is " + myId)
var apiKey = '<ABLY-API-KEY>'
var ably = new Ably.Realtime({
    key: apiKey,
    clientId: myId,
    echoMessages: false
})
console.log("My avatar is " + myAvatar)
var chatChannel = ably.channels.get("chat")
var readReceiptsChannel = ably.channels.get("read-recipts")
var presenceChannel = ably.channels.get("presence")
//presenceChannel.presence.enter();

chatChannel.subscribe("userAvatar", (data) => {
    var dataObj = JSON.parse(JSON.stringify(data))
    if (dataObj.clientId != myId) {
        otherAvatar = dataObj.data.avatar
        you.avatar = otherAvatar
        console.log('Other users\'s avatar is ' + otherAvatar)
    }
})

presenceChannel.presence.subscribe('enter', function (member) {
    if (member.clientId != myId) {
        chatChannel.publish("userAvatar", {
            "avatar": myAvatar
        })
    }
});
presenceChannel.presence.enter();
presenceChannel.presence.get(function (err, members) {
    for (var i in members) {
        if (members[i].clientId != myId) {
            chatChannel.publish("userAvatar", {
                "avatar": myAvatar
            })
        }
    }
});
//----------------------------
/*
function sendMyMessage() {
    
    console.log('Send clicked by ' + myId)
    console.log(document.getElementById("myMsg"))
    var text = document.getElementById("myMsg").val
    if (text !== "") {
        insertChat("me", text);
        chatChannel.publish("chatMessage", {
            message: text
        })
        console.log('Published')
        $(this).val('');
    }
}*/


function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function insertChat(who, text) {
    var control = "";
    var date = formatAMPM(new Date());

    if (who == "me") {
        console.log('Entered me')
        control = '<li class="self">' +
            '<div style="color: #e0e0de" class="avatar">' +
            '<img src="' + me.avatar + '" />' +
            '/</div>' +
            '<div class="messages">' +
            '<p>' + text + '</p>' +
            '<div><time id="meTime" datetime="2009-11-13T20:00">' + date + ' status'+ '</time>' +
            '</div>' +
            '</li>';


            /*
            <li class="other">
                <div class="avatar">
                    <img src="images/avatar_3.png" />
                </div>
                <div class="messages">
                    <p>yeah, they do early flights cause they connect with big airports. they wanna get u to your connection</p>
                    <time datetime="2009-11-13T20:00">Timothy • 51 min</time>
                </div>
            </li>
            */
    } else {
        console.log('Entered you')
        control = '<li class="other">' +
        '<div style="color: #e0e0de" class="avatar">' +
        '<img src="' + you.avatar + '" />' +
        '/</div>' +
        '<div class="messages">' +
        '<p>' + text + '</p>' +
        '<time id="youTime" datetime="2009-11-13T20:00">' + date + '</time>' +
        '</div>' +
        '</li>';
    }
      $("ul").append(control).scrollTop($("ul").prop('scrollHeight'));
    
}

function resetChat() {
    $("ul").empty();
}

function sendMyMessage() {
    console.log('Send clicked by ' + myId)
    console.log(document.getElementById("myMsg"))
    var text = document.getElementById("myMsg").value
    console.log('Text is '+text)
    if (text !== "") {
        insertChat("me", text);
        chatChannel.publish("chatMessage", {
            message: text
        })
        console.log('Published')
        $(this).val('');
    }
}
/*
$('body > div > div > div:nth-child(2) > span').click(function () {
    $(".mytext").trigger({ type: 'keydown', which: 13, keyCode: 13 });
})*/

//-- Clear Chat
resetChat();

//-- Print Messages
chatChannel.subscribe("chatMessage", (data) => {
    console.log('Received')
    var dataObj = JSON.parse(JSON.stringify(data))
    console.log(dataObj)
    var message = dataObj.data.message
    insertChat("you", message);
})
