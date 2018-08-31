function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
var myAvatar = "images/avatar_" + getRandomArbitrary(1, 10) + ".png"
var otherAvatar
var me = {};
me.avatar = myAvatar
var you = {};
var msgObjArray = [];

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
var readReceiptsChannel = ably.channels.get("read-receipts")
var presenceChannel = ably.channels.get("presence")

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

function insertChat(who, text, currentMsgId) {
    var control = "";
    var date = formatAMPM(new Date());
    var seenStatus = false

    console.log('Inserting Id' + currentMsgId)
    if (who == "me") {
        console.log('Entered me')
        control = '<li class="self">' +
            '<div style="color: #e0e0de" class="avatar">' +
            '<img src="' + me.avatar + '" />' +
            '/</div>' +
            '<div class="messages">' +
            '<p>' + text + '</p>' +
            '<div><time datetime="2009-11-13T20:00">' + date + '<div style="text-align:right;" id="' + currentMsgId + '"> sent </div>' + '</time>' +
            '</div>' +
            '</li>';
    } else {
        console.log('Entered you')
        control = '<li class="other">' +
            '<div style="color: #e0e0de" class="avatar">' +
            '<img src="' + you.avatar + '" />' +
            '/</div>' +
            '<div class="messages">' +
            '<p>' + text + '</p>' +
            '<div><time datetime="2009-11-13T20:00">' + date + '</time>' +
            '</div>' +
            '</li>';
        if (document.hasFocus()) {
            for (var i = 0; i < msgObjArray.length; i++) {
                seenStatus = true
            }
        }
        readReceiptsChannel.publish("receipt", {
            "delivered": true,
            "msgId": currentMsgId,
            "seen": seenStatus,
            "singleMsgSeen": true
        })
    }
    var seenObj = {}
    seenObj["msgId"] = currentMsgId
    seenObj["seen"] = seenStatus
    msgObjArray.push(seenObj)
    $("ul").append(control).scrollTop($("ul").prop('scrollHeight'));

}

window.onfocus = function () {
    console.log('Window now focused')
    readReceiptsChannel.publish("receipt", {
        "singleMsgSeen": false,
        "seen": true
    })

};


function resetChat() {
    $("ul").empty();
}

function sendMyMessage() {
    var currentMsgId = "msg-id-" + Math.random().toString(36).substr(2, 6)
    console.log('Send clicked by ' + myId)
    console.log(document.getElementById("myMsg"))
    var text = document.getElementById("myMsg").value
    console.log('Text is ' + text)
    if (text !== "") {
        insertChat("me", text, currentMsgId);
        chatChannel.publish("chatMessage", {
            message: text,
            msgId: currentMsgId
        })
        console.log('Published')
        $(this).val('');
    }
}

readReceiptsChannel.subscribe("receipt", (data) => {
    console.log('Receipt Received')
    var dataObj = JSON.parse(JSON.stringify(data))
    if (dataObj.data.singleMsgSeen) {
        var receiptMsgId = dataObj.data.msgId
        console.log(receiptMsgId)
        if (dataObj.data.seen) {
            if (document.getElementById(receiptMsgId)) {
                (document.getElementById(receiptMsgId)).innerHTML = 'seen'
            }
        } else if (dataObj.data.delivered) {
            if (document.getElementById(receiptMsgId)) {
                (document.getElementById(receiptMsgId)).innerHTML = 'delivered'
            }
        }
    } else if (!dataObj.data.singleMsgSeen) {
        for (var i = 0; i < msgObjArray.length; i++) {
            var id = msgObjArray[i].msgId
            console.log('Inside on focus ids are' + id)
            if (document.getElementById(id)) {
                (document.getElementById(id)).innerHTML = 'seen'
            }
        }
    }

})

//-- Clear Chat
resetChat();

//-- Print Messages
chatChannel.subscribe("chatMessage", (data) => {
    console.log('Received')
    var dataObj = JSON.parse(JSON.stringify(data))
    console.log(dataObj)
    var message = dataObj.data.message
    var myMsgId = dataObj.data.msgId
    insertChat("you", message, myMsgId);
})
