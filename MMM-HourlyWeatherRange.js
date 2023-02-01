/* global WeatherProvider, WeatherUtils */

/* MagicMirror²
 * Module: Weather
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
Module.register("MMM-HourlyWeatherRange", {
	// Default module config.
	defaults: {
		hourStart: 7,
		weatherProvider: "weathergov",
		roundTemp: false,
		units: config.units,
		tempUnits: config.units,
		windUnits: config.units,
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		animationSpeed: 1000,
		timeFormat: config.timeFormat,
		showPeriod: true,
		showPeriodUpper: false,
		lang: config.language,
		degreeLabel: false,
		decimalSymbol: ".",
		maxNumberOfDays: 5,
		maxEntries: 2,
		fade: true,
		fadePoint: 0.25, // Start on 1/4th of the list.
		initialLoadDelay: 0, // 0 seconds delay
		appendLocationNameToHeader: false,
		calendarClass: "calendar",
		tableClass: "small",
		onlyTemp: false,
		showPrecipitationAmount: false,
		colored: false
	},

	// Module properties.
	weatherProvider: null,

	// Can be used by the provider to display location of event if nothing else is specified
	firstEvent: null,

	// Define required scripts.
	getStyles: function () {
		return ["font-awesome.css", "weather-icons.css", "weather.css"];
	},

	// Override getHeader method.
	getHeader: function () {
		if (this.config.appendLocationNameToHeader && this.weatherProvider) {
			if (this.data.header) return this.data.header + " " + this.weatherProvider.fetchedLocation();
			else return this.weatherProvider.fetchedLocation();
		}

		return this.data.header ? this.data.header : "";
	},

	// Start the weather module.
	start: function () {
		moment.locale(this.config.lang);

		// Initialize the weather provider.
		this.weatherProvider = WeatherProvider.initialize(this.config.weatherProvider, this);

		// Let the weather provider know we are starting.
		this.weatherProvider.start();

		// Add custom filters
		this.addFilters();

		// Schedule the first update.
		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// Select the template depending on the display type.
	getTemplate: function () {
		return "hourly.njk";
	},

	// Add all the data to the template.
	getTemplateData: function () {
		return {
			config: this.config,
			hourly: this.weatherProvider.weatherHourly()
		};
	},

	// What to do when the weather provider has new information available?
	updateAvailable: function () {
		Log.log("New weather information available.");
		this.updateDom(0);
		this.scheduleUpdate();

		const notificationPayload = {
			hourlyArray: this.weatherProvider?.weatherHourlyArray?.map((ar) => ar.simpleClone()) ?? [],
			locationName: this.weatherProvider?.fetchedLocationName,
			providerName: this.weatherProvider.providerName
		};
		this.sendNotification("WEATHER_UPDATED", notificationPayload);
	},

	scheduleUpdate: function (delay = null) {
		let nextLoad = this.config.updateInterval;
		if (delay !== null && delay >= 0) {
			nextLoad = delay;
		}

		setTimeout(() => this.weatherProvider.fetchWeatherHourly(), nextLoad);
	},

	roundValue: function (temperature) {
		const decimals = this.config.roundTemp ? 0 : 1;
		const roundValue = parseFloat(temperature).toFixed(decimals);
		return roundValue === "-0" ? 0 : roundValue;
	},

	addFilters() {
		this.nunjucksEnvironment().addFilter(
			"formatTime",
			function (date) {
				date = moment(date);

				if (this.config.timeFormat !== 24) {
					if (this.config.showPeriod) {
						if (this.config.showPeriodUpper) {
							return date.format("h:mm A");
						} else {
							return date.format("h:mm a");
						}
					} else {
						return date.format("h:mm");
					}
				}

				return date.format("HH:mm");
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"unit",
			function (value, type) {
				if (type === "temperature") {
					value = this.roundValue(WeatherUtils.convertTemp(value, this.config.tempUnits)) + "°";
					if (this.config.degreeLabel) {
						if (this.config.tempUnits === "metric") {
							value += "C";
						} else if (this.config.tempUnits === "imperial") {
							value += "F";
						} else {
							value += "K";
						}
					}
				} else if (type === "precip") {
					if (value === null || isNaN(value) || value === 0 || value.toFixed(2) === "0.00") {
						value = "";
					} else {
						if (this.config.weatherProvider === "ukmetoffice" || this.config.weatherProvider === "ukmetofficedatahub") {
							value += "%";
						} else {
							value = `${value.toFixed(2)} ${this.config.units === "imperial" ? "in" : "mm"}`;
						}
					}
				} else if (type === "humidity") {
					value += "%";
				} else if (type === "wind") {
					value = WeatherUtils.convertWind(value, this.config.windUnits);
				}
				return value;
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"roundValue",
			function (value) {
				return this.roundValue(value);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"decimalSymbol",
			function (value) {
				return value.toString().replace(/\./g, this.config.decimalSymbol);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"calcStartEntries",
			function (dataArray) {
				const dateObj = new Date();
				const dateStr = dateObj.toISOString().split("T").shift();

				let hour = this.config.hourStart.toString();
				if (this.config.hourStart < 10) {
					hour = "0" + hour;
				}

				let current = moment(dateStr + "T" + hour + ":00");

				if (current < moment()) {
					current.add(1, "d");
				}

				Log.log(current);

				for (let i = 0; i < dataArray.length; i++) {
					let date = moment(dataArray[i].date);
					if (date >= current) {
						Log.log(i);
						Log.log(date);
						return i;
					}
				}

				return 0;
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"calcEndEntries",
			function (dataArray, startIndex) {
				let index = startIndex + this.config.maxEntries;
				return Math.min(dataArray.length, index);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"opacity",
			function (currentStep, numSteps) {
				if (this.config.fade && this.config.fadePoint < 1) {
					if (this.config.fadePoint < 0) {
						this.config.fadePoint = 0;
					}
					const startingPoint = numSteps * this.config.fadePoint;
					const numFadesteps = numSteps - startingPoint;
					if (currentStep >= startingPoint) {
						return 1 - (currentStep - startingPoint) / numFadesteps;
					} else {
						return 1;
					}
				} else {
					return 1;
				}
			}.bind(this)
		);
	}
});
