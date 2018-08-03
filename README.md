A Slack bot for allowing users to create announcements that are moderated by Slack admins.

![build status](https://ci.codesink.net/api/badges/justinbarrick/announcebot/status.svg)
[![image version](https://images.microbadger.com/badges/version/justinbarrick/announcebot.svg)](https://microbadger.com/images/justinbarrick/announcebot)

Example request:

![](https://i.imgur.com/IOuUauF.png)

To install:

```
npm install
```

To run:

```
npm start
```

You must set:

* `SLACK_CLIENT_ID`: your slack client id
* `SLACK_CLIENT_SECRET`: your slack client secret
* `SLACK_APP_URL`: the base URL that your application is reachable at
* `SLACK_ANNOUNCEMENT_CHANNEL`: channel to send announcement requests to.
* `SLACK_MODERATION_CHANNEL`: channel to send moderation requests to.
* `ANNOUNCEBOT_DATABASE`: path to where announcebot should store oauth info.

Once started, navigate to `https://yourbot/login` to set it up in your workspace.
