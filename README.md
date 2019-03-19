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

# You must set the following as Environment Variables:

* `SLACK_CLIENT_ID`: your slack client id
* `SLACK_CLIENT_SECRET`: your slack client secret
* `SLACK_SIGNING_SECRET`: Your slack signing secret
* `SLACK_APP_URL`: the base URL that your application is reachable at
* `SLACK_ANNOUNCEMENT_CHANNEL`: channel to send announcement requests to.
* `SLACK_MODERATION_CHANNEL`: channel to send moderation requests to.
* `ANNOUNCEBOT_DATABASE`: path to where announcebot should store oauth info. (In the format <yourdirectory>)

# Get your API Info

1.You can get these from going to: https://api.slack.com/apps    
2. Create New App   
3. Name your app   
4. Set your workspace (if required)   
5. Click Create App   
6. Click Interactive Components   
7. Turn the slider on the right on   
8. Enter your request url (https://yourbot/slack/recieve) and click Save Changes   
9. Click Slash Commands   
10. Click Create New Command    
11. Type your command option, in our case its /announce   
12. Enter the request url (https://yourbot/slack/recieve)   
13. Create A description and usage hint   
14. Click OAuth & Permissions   
15. Select Add New Redirect URL and enter https://yourbot/oauth    
16. Select Add and Save URL   
16. Under Scopes Select `incoming-webhook`, `bot`,`commands`, and `team:read`   
17. Save Changes   
18. Now Select Install App in workspace   
19. Under Bot Users, create a name and username   
20. On the General page, copy and paste the Client ID, Client Secret, and signing secret.

# To Find Channels
1. Login to slack on your web-browser
2. After /messages on the URL there's a alphanumeric value, this is your channel id's.



Once started, navigate to `https://yourbot/login` to set it up in your workspace.
