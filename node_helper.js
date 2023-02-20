/* MagicMirror²
 * Node Helper: MMM-HourlyWeatherRange
 *
 * By Tara Dadah https://tarad.dev
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const CronJob = require("cron").CronJob;
const Log = require("logger");

module.exports = NodeHelper.create({
  // Override socketNotificationReceived received.
  cronJob: undefined,

  socketNotificationReceived: function (notification, payload) {
    if (notification === "SHOW_HIDE") {
      this.setInterval();
    }
  },

  stop: function () {
    this.stopCronJob(this.cronJob);
  },

  stopCronJob: function (cronJob) {
    try {
      cronJob.stop();
    } catch (ex) {
      this.log(this.name + " could not stop cronJob");
    }
  },

  setInterval: function () {
    var d = new Date();
    var hour = d.getHours();
    var min = d.getMinutes();
    var sec = d.getSeconds();

    if (min === "00" && sec === "00") {
      this.sendShowHide("Now");
    }

    var cronTime = "0 " + hour + " * * *";
    this.cronJob = this.createCronJob(cronTime);
  },

  sendShowHide: function (fromCall) {
    Log.log(
      fromCall + " Hourly show hide, socket notification sent. " + new Date()
    );
    this.sendSocketNotification("SHOW_HIDE_MODULE", this.config);
    this.setInterval();
  },

  createCronJob: function (cronTime) {
    try {
      var job = new CronJob({
        cronTime: cronTime,
        onTick: function () {
          self.log(self.name + " is triggering show hide");
          self.sendSocketNotification("SHOW_HIDE_MODULE", this.config);
        },
        onComplete: function () {
          self.log(
            self.name + " has completed the SHOW_HIDE at" + cronTime + '"'
          );
        },
        start: true
      });
      return job;
    } catch (ex) {
      Log.log(this.name + " could not create SHOW_HIDE at " + cronTime + '"');
    }
  }
});
