'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
      let event = req.body.entry[0].messaging[i]
      let sender = event.sender.id
      if (event.message && event.message.text) {
        let text = event.message.text;
        if (text === "Generic") {
            sendGenericMessage(sender)
        } else {
            // No valid command so just show a recommendation.
            sendPendingRecommendation(sender)
        }
      } else if (event.postback) {
        if (event.postback.payload === "another") {
            sendPendingRecommendation(sender)
        } else if (event.postback.payload === "completed") {
            sendTextMessage(sender, "Cheers! Here is something else you should check out")
            sendPendingRecommendation(sender)
        } else {
            let text = JSON.stringify(event.postback)
            sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
        }
      }
    }
    res.sendStatus(200)
})

function sendMessageData(sender, messageData) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    sendMessageData(sender, messageData)
}

function sendPendingRecommendation(sender) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Watch House of Cards",
                    "subtitle": "Recommended by Ryan and Darek",
                    "image_url": "http://cdn.thefiscaltimes.com/sites/default/files/02212014_Kevin_Spacey_House_of_Cards_Netflix.jpg",
                    "buttons": [{
                        "type": "postback",
                        "title": "Watched It",
                        "payload": "completed",
                    }, {
                        "type": "postback",
                        "title": "Something Else",
                        "payload": "another",
                    }],
                }]
            }
        }
    }
    sendMessageData(sender, messageData)
}

function sendGenericMessage(sender) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    }
    sendMessageData(sender, messageData)
}

const token = process.env.FB_PAGE_TOKEN

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})
