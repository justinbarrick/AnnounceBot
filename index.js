var Botkit = require('botkit')
var prometheus = require('prom-client')
var util = require('util')

prometheus.collectDefaultMetrics({ timeout: 5000 })

const ICON_URL = 'https://i.imgur.com/D9XVBXb.png'

function makeAttachment (payload, heading, color) {
  if (color === undefined) {
    color = '#6BDAD5'
  }

  return {
    mrkdown_in: ['text', 'pretext'],
    color: color,
    pretext: heading,
    text: payload.body,
    author_name: payload.name,
    ts: payload.timestamp
  }
}

var controller = Botkit.slackbot({
  json_file_store: process.env.YIMBYBOT_DATABASE
}).configureSlackApp({
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  redirectUri: process.env.SLACK_APP_URL + '/oauth',
  scopes: ['bot', 'commands', 'chat:write:bot', 'chat:write:user']
})

controller.setupWebserver(8889, function (err, webserver) {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  controller.createWebhookEndpoints(webserver)

  controller.createOauthEndpoints(webserver, function (err, req, res) {
    if (err) {
      res.status(500).send('ERROR: ' + err)
    } else {
      res.send('Success!')
    }
  })

  var metricsCallback = function (req, res) {
    res.set('Content-Type', prometheus.register.contentType)
    res.end(prometheus.register.metrics())
  }

  webserver.get('/', metricsCallback)
  webserver.get('/metrics', metricsCallback)
})

controller.storage.teams.all(function (err, teams) {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  for (var t in teams) {
    if (teams[t].bot) {
      controller.spawn(teams[t])
    }
  }
})

controller.on('dialog_submission', function (bot, message) {
  console.log('dialog_submission', message)

  var payload = JSON.parse(message.callback_id)
  payload.body = message.submission.textarea
  payload.approver = message.user

  var attach = makeAttachment(payload,
    util.format('Announcement approved with changes by <@%s>', message.user), '#333333')

  attach.callback_id = 'announcement_authorization'
  attach.actions = [
    {
      name: 'Approve',
      text: 'Approve',
      type: 'button',
      value: JSON.stringify(Object.assign(payload, {vote: 'approve'}))
    },
    {
      name: 'Deny',
      text: 'Deny',
      type: 'button',
      value: JSON.stringify(Object.assign(payload, {vote: 'deny', approver: payload.user}))
    }
  ]

  bot.send({
    icon_url: ICON_URL,
    channel: payload.user,
    attachments: [ attach ]
  }, function (err) {
    var msg = 'Announcement edit submitted to author for approval.'
    var color = '#333333'
    if (err !== null) {
      console.log('Error sending edit request:', err)
      msg = 'Error: failed sending edit request, please try again.'
      color = '#FF6464'
    }

    bot.replyInteractive(Object.assign(message, {response_url: payload.response_url}), {
      icon_url: ICON_URL,
      attachments: [ makeAttachment(payload, msg, color) ]
    }, function (err) {
      if (err !== undefined) {
        console.log('Error notifying moderators of edit request:', err)
        bot.dialogError(err)
        return
      }

      bot.dialogOk()
    })
  })
})

controller.on('interactive_message_callback', function (bot, message) {
  console.log('interactive_message_callback', message)

  var payload = JSON.parse(message.text)
  var userId = payload.approver || message.raw_message.user.id

  message.response_url = payload.response_url || message.response_url

  if (payload.vote === 'deny') {
    bot.replyInteractive(message, {
      icon_url: ICON_URL,
      attachments: [
        makeAttachment(payload,
          util.format('Announcement from <@%s> was denied by <@%s>.', payload.user, userId),
          '#FF6464')
      ]
    }, function (err) {
      if (err !== undefined) {
        console.log('Error denying announcement request:', err)
        return
      }

      bot.send({
        icon_url: ICON_URL,
        channel: payload.user,
        attachments: [
          makeAttachment(payload,
            util.format('Your announcement was denied by <@%s>.', userId), '#FF6464')
        ]
      }, function (err) {
        if (err !== null) {
          console.log('Error notifying user of deny:', err)
        }
      })
    })

    return
  } else if (payload.vote === 'edit') {
    console.log(payload)
    var body = payload.body
    payload.body = undefined
    payload.response_url = message.response_url

    bot.replyWithDialog(message, bot.createDialog(
      'Editing request',
      JSON.stringify(payload),
      'Submit'
    ).addTextarea(
      'Editing request',
      'textarea', body).asObject(), function (err) {
      if (err !== null) {
        console.log('Error sending edit dialog to user:', err)
      }
    })

    return
  }

  bot.send({
    channel: process.env.SLACK_ANNOUNCEMENT_CHANNEL,
    icon_url: ICON_URL,
    attachments: [
      makeAttachment(payload, util.format('New announcement from <@%s>:', payload.user))
    ]
  }, function (err) {
    if (err !== null) {
      console.log('Error sending announcement:', err)
      return
    }

    bot.replyInteractive(message, {
      icon_url: ICON_URL,
      attachments: [
        makeAttachment(payload,
          util.format('Announcement from <@%s> was approved by <@%s>:', payload.user, userId))
      ]
    }, function (err) {
      if (err !== undefined) {
        console.log('Error updating authorization buttons:', err)
      }
    })
    bot.send({
      icon_url: ICON_URL,
      attachments: [
        makeAttachment(payload, util.format('Your announcement was approved by <@%s>!', userId))
      ],
      channel: payload.user
    }, function (err) {
      if (err !== null) {
        console.log('Error notifying user of announcement:', err)
      }
    })
  })
})

controller.on('slash_command', function (bot, message) {
  console.log('slash_command', message)
  var userId = message.raw_message.user_id

  bot.api.users.info({
    user: message.user
  }, function (err, response) {
    if (err !== null) {
      console.log('Failed looking up user info:', err)
      bot.replyPrivate(message, 'Error creating announcement request, try again?')
      return
    }

    var payload = {
      user: userId,
      body: message.text,
      timestamp: Math.floor(new Date() / 1000),
      name: response.user.real_name
    }
    var attach = makeAttachment(payload,
      util.format('New announcement from <@%s>:', userId), '#333333')
    attach.callback_id = 'announcement_authorization'
    attach.actions = [
      {
        name: 'Approve',
        text: 'Approve',
        type: 'button',
        value: JSON.stringify(Object.assign(payload, {vote: 'approve'}))
      },
      {
        name: 'Approve with changes',
        text: 'Approve with changes',
        type: 'button',
        value: JSON.stringify(Object.assign(payload, {vote: 'edit'}))
      },
      {
        name: 'Deny',
        text: 'Deny',
        type: 'button',
        value: JSON.stringify(Object.assign(payload, {vote: 'deny'}))
      }
    ]

    bot.send({
      icon_url: ICON_URL,
      channel: process.env.SLACK_MODERATION_CHANNEL,
      attachments: [ attach ]
    }, function (err) {
      var msg = 'Announcement request submitted for approval.'
      var color = '#333333'
      if (err !== null) {
        console.log('Error sending announcement request:', err)
        msg = 'Error: failed sending announcement request, please try again.'
        color = '#FF6464'
      }

      bot.replyPrivate(message, {
        icon_url: ICON_URL,
        attachments: [ makeAttachment(payload, msg, color) ]
      }, function (err) {
        if (err !== undefined) {
          console.log('Error notifying user of announcement request:', err)
        }
      })
    })
  })
})
