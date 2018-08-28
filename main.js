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
console.log("My ID is "+ myId)
var apiKey = '<ABLY-API-KEY>'
var ably = new Ably.Realtime({
    key: apiKey,
    clientId: myId
})
console.log("My avatar is " + myAvatar)
var chatChannel = ably.channels.get("chat")
var readReceiptsChannel = ably.channels.get("read-recipts")
var presenceChannel = ably.channels.get("presence")
//presenceChannel.presence.enter();

chatChannel.subscribe("userAvatar", (data) => {
    var dataObj = JSON.parse(JSON.stringify(data))
    if(dataObj.clientId != myId){
        otherAvatar = dataObj.data.avatar
        you.avatar = otherAvatar
        console.log('Other users\'s avatar is ' + otherAvatar)
    }
    
})

presenceChannel.presence.subscribe('enter', function(member) {
    if(member.clientId != myId){
        chatChannel.publish("userAvatar", {
            "avatar": myAvatar
        })
    }
  });
presenceChannel.presence.enter();
presenceChannel.presence.get(function (err, members) {
    for (var i in members) {
        if(members[i].clientId != myId){
            chatChannel.publish("userAvatar", {
                "avatar": myAvatar
            })
        }
    }
});
//----------------------------



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
        control = '<li style="width:100%">' +
            '<div class="msj macro">' +
            '<div class="avatar"><img class="img-circle" style="width:100%;" src="' + me.avatar + '" /></div>' +
            '<div class="text text-l">' +
            '<p>' + text + '</p>' +
            '<p><small>' + date + '</small></p>' +
            '</div>' +
            '</div>' +
            '</li>';
    } else {
        control = '<li style="width:100%;">' +
            '<div class="msj-rta macro">' +
            '<div class="text text-r">' +
            '<p>' + text + '</p>' +
            '<p><small>' + date + '</small></p>' +
            '</div>' +
            '<div class="avatar" style="padding:0px 0px 0px 10px !important"><img class="img-circle" style="width:100%;" src="' + you.avatar + '" /></div>' +
            '</li>';
    }
    setTimeout(
        function () {
            $("ul").append(control).scrollTop($("ul").prop('scrollHeight'));
        }, time);

}

function resetChat() {
    $("ul").empty();
}

$(".sendMessage").on("click", () => {
    //if (e.which == 13){
    console.log('Send clicked by ' + myId)
    var text = $(this).val();
    if (text !== "") {
        insertChat("me", text);
        chatChannel.publish("chatMessage", {
            message: text
        })
        console.log('Published')
        $(this).val('');
    }
    //}
});

$('body > div > div > div:nth-child(2) > span').click(function () {
    $(".mytext").trigger({ type: 'keydown', which: 13, keyCode: 13 });
})

//-- Clear Chat
resetChat();

//-- Print Messages
chatChannel.subscribe("chatMessage", (data) => {
    console.log('Received')
    var dataObj = JSON.parse(JSON.stringify(data))
    var message = dataObj.data.message
    insertChat("you", message);
})