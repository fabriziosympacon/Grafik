sap.ui.require([
	"sap/m/Shell",
	"sap/m/App",
	"sap/m/Page",
	"sap/ui/core/ComponentContainer",
	"sap/ui/core/Core"
], function(
	Shell, App, Page, ComponentContainer, Core) {
	"use strict";

	Core.attachInit(function() {
		new Shell ({
			app : new App ({
				pages : [
					new Page({
						title : "Bidirectional Custom Collapsing",
						enableScrolling : false,
						content : [
							new ComponentContainer({
								height : "100%", name : "sap.suite.ui.commons.sample.NetworkGraphBidirectionalCollapsing",
								settings : {
									id : "sap.suite.ui.commons.sample.NetworkGraphBidirectionalCollapsing"
								}
							})
						]
					})
				]
			})
		}).placeAt("content");
	});
});
