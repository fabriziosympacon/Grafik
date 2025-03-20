sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/OverflowToolbarButton",
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/DataLoader",
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/dataTable",
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/vorgaengerLoader",
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/VorgaengerTableUtils",
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/PrintUtil"
], function (Controller, JSONModel, OverflowToolbarButton, DataLoader, dataTable, vorgaengerLoader, VorgaengerTableUtils, PrintUtil) {
    "use strict";

    return Controller.extend("sap.suite.ui.commons.sample.NetworkGraphBidirectionalCollapsing.NetworkGraph", {
        onInit: function () {
            this.oView = this.getView();
            this.oGraph = this.oView.byId("graph");
            this.oTable = this.oView.byId("dataTable");
            this.baseUrl = "https://grafik-flax.vercel.app/api/";
                        
            this._initModels();
            this._loadTableData();
            this._setupGraphToolbar();
            
            this.oGraph.attachSelectionChange(this.selectionChange, this);
            this.oTable.attachRowSelectionChange(this.onRowSelectionChange, this);
        },

        onAfterRendering: function () {
            this._removeLegendButton();
        },
        
        _removeLegendButton: function () {
            if (this.oGraph && this.oGraph.getToolbar()) {
                const toolbar = this.oGraph.getToolbar();
                const buttons = toolbar.getContent();
        
                for (let i = 0; i < buttons.length; i++) {
                    if (buttons[i] instanceof sap.m.Button && buttons[i].getIcon() === "sap-icon://legend") {
                        toolbar.removeContent(buttons[i]);
                        break; // Exit the loop after removing the button
                    }
                }
            }
        },

        _initModels: function () {
            const oGraphModel = new JSONModel({ isLoading: true, data: {} });
            this.oView.setModel(oGraphModel);

            const oTableModel = new JSONModel({
                isLoading: true,
                tableData: [],
                vorgaengerData: []
            });
            this.oView.setModel(oTableModel, "dataModel");

            this.oGraph.setBusy(true);
        },

        _loadTableData: function () {
            const oTableModel = this.oView.getModel("dataModel");
            dataTable.loadData(oTableModel, null, false, this.baseUrl, (data) => {
                oTableModel.setProperty("/tableData", data);
                oTableModel.setProperty("/isLoading", false);
                oTableModel.refresh(true);
            });
        },

        _setupGraphToolbar: function () {
            if (this.oGraph && this.oGraph.getToolbar()) {
                const aButtons = [
                    {
                        icon: "sap-icon://print",
                        tooltip: "Print Graph",
                        press: this.printGraph.bind(this)
                    }
                ];
                aButtons.forEach((btn) => {
                    this.oGraph.getToolbar().addContent(new OverflowToolbarButton({
                        icon: btn.icon,
                        tooltip: btn.tooltip,
                        type: "Transparent",
                        press: btn.press
                    }));
                });
            }
        },

        printGraph: function () {
            if (this.oGraph) {
                PrintUtil.printGraph(this.oGraph);
            } else {
                console.warn("Graph not found!");
            }
        },

        onRowSelectionChange: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("rowContext");
            if (!oSelectedItem) return;

            const oSelectedData = oSelectedItem.getObject();
            console.log("Selected row data:", oSelectedData);

            // Get the data model
            const oDataModel = this.getView().getModel("dataModel");

            // Format the header text
            const headerText = "Archivierungsläufe: " + oSelectedData.Archivierungsobjekt;

            // Update the data model
            oDataModel.setProperty("/vorgaengerPanelHeader", headerText);

            const sUrl = `${this.baseUrl}vorgaenger?archivierungsobjekt=${oSelectedData.Archivierungsobjekt}`;
            console.log("Constructed URL:", sUrl);

            vorgaengerLoader.loadVorgaengerData(sUrl, this);
            DataLoader.loadGraphData(this.oView.getModel(), this.oGraph, sUrl, this.showAllNodes.bind(this));
        },

        destroyGraph: function () {
            this.oGraph.destroyNodes();
            this.oGraph.destroyLines();
        },

        showAllNodes: function () {
            this.oGraph.getNodes().forEach(oNode => oNode.setVisible(true));
        },

        hideAllNodes: function () {
            this.oGraph.getNodes().forEach(oNode => oNode.setVisible(false));
        },

        selectionChange: function (oEvent) {
            console.log("Selection changed:", oEvent.getParameter("items"));
        },

        replaceGraphData: function (nodesArray, linesArray) {
            this.destroyGraph();

            console.log("Aktuelle Nodes vor Einfügen:", this.oGraph.getNodes().map(n => n.getKey()));

            if (Array.isArray(nodesArray)) {
                nodesArray.forEach((nodeData) => {
                    if (!this.oGraph.getNodes().some(n => n.getKey() === nodeData.key)) {
                        this.oGraph.addNode(new sap.suite.ui.commons.networkgraph.Node({
                            key: nodeData.key,
                            title: nodeData.title,
                            shape: "Box",
                            attributes: nodeData.V_DE ? [
                                new sap.suite.ui.commons.networkgraph.ElementAttribute({ label: nodeData.V_DE })
                            ] : []
                        }));
                    } else {
                        console.warn("Doppelter Node verhindert:", nodeData.key);
                    }
                });
            } else {
                console.error("nodesArray ist nicht korrekt");
            }

            if (Array.isArray(linesArray)) {
                linesArray.forEach((lineData) => {
                    this.oGraph.addLine(new sap.suite.ui.commons.networkgraph.Line(lineData));
                });
            } else {
                console.error("linesArray ist nicht korrekt");
            }

            this.oGraph.setBusy(false);
        },

        onVorgaengerTableSelectionChange: function (oEvent) {
            const oFilteredGraphData = VorgaengerTableUtils.onVorgaengerTableSelectionChange(oEvent, this);
        
            if (oFilteredGraphData && oFilteredGraphData.nodes && oFilteredGraphData.lines) {
                console.log("Filtered Nodes:", oFilteredGraphData.nodes);
                console.log("Filtered Lines:", oFilteredGraphData.lines);
        
                this.replaceGraphData(oFilteredGraphData.nodes, oFilteredGraphData.lines);
        
                // Retrieve selected keys from VorgaengerTableUtils
                const aSelectedKeys = oEvent.getSource().getSelectedIndices().map(index => {
                    return this.getView().getModel("dataModel").getProperty("/vorgaengerData/" + index + "/key").replace("VORG_","");
                });
        
                // Format selected keys into a comma-separated string
                const excludedObjects = aSelectedKeys.join(", ");
        
                // Retrieve existing header text
                const oDataModel = this.getView().getModel("dataModel");
                let headerText = oDataModel.getProperty("/vorgaengerPanelHeader");
        
                // Find and replace the excluded objects part
                const excludedIndex = headerText.indexOf(" - Ausgeschlossene Objekte:");
                if (excludedIndex !== -1) {
                    headerText = headerText.substring(0, excludedIndex); // Remove existing excluded part
                }
        
                // Append excluded objects to header text only if exists
                if (excludedObjects) {
                    headerText += " - Ausgeschlossene Objekte: " + excludedObjects;
                }
        
                // Update data model with new header text
                oDataModel.setProperty("/vorgaengerPanelHeader", headerText);
            }
        
        }
    });
});