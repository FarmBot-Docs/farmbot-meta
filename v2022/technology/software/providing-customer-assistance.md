---
title: "Providing customer assistance"
slug: "providing-customer-assistance"
---

Server admins can create admin tokens to remotely assist users when requested.

 * Enter the following command to start the Rails console:
  ```
  heroku run rails console --app=farmbot-staging
  ```
 * Enter the following command to send a troubleshooting ticket to the feedback webhook URL. Replace the `id` number with the device id of the user requesting assistance and `name` with your name.
 ```
 Device.find_by(id: 000).provide_feedback("created by staff member name")
 ```
 * Paste the token contents into the Javascript console of a browser while using the web app.
 * Refresh the page.
 * Visit `/terminal` for device shell access if needed.
 * Use `Logout and destroy token` when remote assistance has been completed.
