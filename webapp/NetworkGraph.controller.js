sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/OverflowToolbarButton",
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/DataLoader", // Import the DataLoader module
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/dataTable", // Import the datatable utility
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/vorgaengerLoader",  // Import the vorgaengerLoader module correctly
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/VorgaengerTableUtils"
], function (Controller, JSONModel, OverflowToolbarButton, DataLoader, dataTable, vorgaengerLoader, VorgaengerTableUtils) {
    "use strict";

    return Controller.extend("sap.suite.ui.commons.sample.NetworkGraphBidirectionalCollapsing.NetworkGraph", {
        onInit: function () {
            var oView = this.getView(),
                oGraph = oView.byId("graph"),
                oModel = new JSONModel({ isLoading: true, data: {} });

            oView.setModel(oModel);
            oGraph.setBusy(true);

            var oTableModel = new JSONModel({
                isLoading: true,
                tableData: [],
                vorgaengerData: []
            });
            oView.setModel(oTableModel, "dataModel");

           // this.baseUrl = window.location.hostname === "localhost"
           // ? "http://localhost:3000/api/"
           // : "https://grafik-flax.vercel.app/api/";

           // this.baseUrl = "http://localhost:3000/api/";

            // Load config.json
            var oConfigModel = new JSONModel("config.json");
            this.getView().setModel(oConfigModel, "config");

            oConfigModel.attachRequestCompleted(function () {
                console.log("Base URL:", this.baseUrl); // Add this line
                this.baseUrl = this.getView().getModel("config").getProperty("/baseUrl");


            dataTable.loadData(oTableModel, null, false, this.baseUrl, function (data) {
                oTableModel.setProperty("/tableData", data);
                oTableModel.setProperty("/isLoading", false);
                oTableModel.refresh(true); // Ensure UI updates
            });

            oGraph.getToolbar().addContent(new OverflowToolbarButton({
                icon: "sap-icon://collapse-all",
                tooltip: "Collapse all nodes",
                type: "Transparent",
                press: this.hideAllNodes.bind(this)
            }));

            oGraph.attachSelectionChange(this.selectionChange, this);

            //Selection in the table
            var oTable = oView.byId("dataTable");
            oTable.attachRowSelectionChange(this.onRowSelectionChange, this);
        }.bind(this)); // Bind 'this' to the callback function
    },


        onRowSelectionChange: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("rowContext");
            if (oSelectedItem) {
                var oSelectedData = oSelectedItem.getObject();
                console.log("Selected row data:", oSelectedData);
        
                var archivierungsObjekt = oSelectedData.Archivierungsobjekt;
                var sUrl = this.baseUrl + "vorgaenger?archivierungsobjekt=" + archivierungsObjekt;
                console.log("Constructed URL:", sUrl);
        
                vorgaengerLoader.loadVorgaengerData(sUrl, this);
        
                DataLoader.loadGraphData(this.getView().getModel(), this.getView().byId("graph"), sUrl, this.showAllNodes.bind(this));
        
        
            }
        },
        

        destroyGraph: function () {
            var oGraph = this.getView().byId("graph");
            oGraph.destroyNodes(); // Entfernt Nodes
            oGraph.destroyLines(); // Entfernt Lines
        },

        showAllNodes: function () {
            var oGraph = this.getView().byId("graph");
            oGraph.getNodes().forEach(function (oNode) {
                oNode.setVisible(true);
            });
        },

        hideAllNodes: function () {
            var oGraph = this.getView().byId("graph");
            oGraph.getNodes().forEach(function (oNode) {
                oNode.setVisible(false);
            });
        },


        selectionChange: function (oEvent) {
            console.log("Selection changed:", oEvent.getParameter("items"));
        },

        replaceGraphData: function (nodesArray, linesArray) {
            var oGraph = this.getView().byId("graph");
        
            //  Schritt 1: Alle Nodes & Lines sicher entfernen
            this.destroyGraph(); // Verhindert doppelte IDs
        
            // Schritt 2: Logging, um doppelte IDs zu erkennen
            console.log("Aktuelle Nodes vor Einfügen:", oGraph.getNodes().map(n => n.getKey()));
        
            // Schritt 3: Nodes einfügen, nur wenn sie nicht existieren
            if (Array.isArray(nodesArray)) {
                nodesArray.forEach(function (nodeData) {
                    var existingNode = oGraph.getNodes().find(n => n.getKey() === nodeData.key);
                    if (!existingNode) { // Nur neue Nodes einfügen
                        var newNode = new sap.suite.ui.commons.networkgraph.Node({
                            key: nodeData.key,
                            title: nodeData.title,
                            shape: "Box",
                            attributes: nodeData.V_DE ? [new sap.suite.ui.commons.networkgraph.ElementAttribute({
                                label: nodeData.V_DE
                            })] : [] // Conditional addition of attribute
                        });
                        oGraph.addNode(newNode);
                    } else {
                        console.warn("Doppelter Node verhindert:", nodeData.key);
                    }
                });
            } else {
                console.error("nodesArray ist nicht korrekt");
            }
        
            // Schritt 4: Lines einfügen, falls nötig
            if (Array.isArray(linesArray)) {
                linesArray.forEach(function (lineData) {
                    oGraph.addLine(new sap.suite.ui.commons.networkgraph.Line(lineData));
                });
            } else {
                console.error("linesArray ist nicht korrekt");
            }
        
            oGraph.setBusy(false);
        },

        onVorgaengerTableSelectionChange: function (oEvent) {
            var oFilteredGraphData = VorgaengerTableUtils.onVorgaengerTableSelectionChange(oEvent, this);
        
            if (oFilteredGraphData && oFilteredGraphData.nodes && oFilteredGraphData.lines) {
                // Extract nodes and lines arrays
                var filteredNodes = oFilteredGraphData.nodes;
                var filteredLines = oFilteredGraphData.lines;
        
                // Log the filtered data
                console.log("Filtered Nodes:", filteredNodes);
                console.log("Filtered Lines:", filteredLines);
        
                // Call modified replaceGraphData with the arrays
                this.replaceGraphData(filteredNodes, filteredLines);
            }
        },


    });
});
