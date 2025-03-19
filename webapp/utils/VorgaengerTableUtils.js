sap.ui.define([
    "sap/base/util/deepClone",
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/GraphReconnectionUtils"
], function (deepClone, GraphReconnectionUtils) {
    "use strict";

    return {
        onVorgaengerTableSelectionChange: function (oEvent, oController) {
            console.log("onVorgaengerTableSelectionChange called");

            var oTable = oEvent.getSource();
            var aSelectedIndices = oTable.getSelectedIndices();
            var oModel = oController.getView().getModel("dataModel");
            var aVorgaengerData = oModel.getProperty("/vorgaengerData");
            var aOriginalGraphData = oModel.getProperty("/originalGraphData");

            //if (aSelectedIndices.length === 0) {
            //    console.log("No selections: Restoring original graph data");
            //    oModel.setProperty("/graphData", deepClone(aOriginalGraphData));
            //    oController.getView().byId("graph").rerender();
            //    return deepClone(aOriginalGraphData); // return original data when no selection
            //}

            var aSelectedKeys = aSelectedIndices.map(function (iIndex) {
                return aVorgaengerData[iIndex].key;
            });
            console.log("aSelectedKeys:", aSelectedKeys);

            var oFilteredGraphData = deepClone(aOriginalGraphData);

            // Filter nodes
            oFilteredGraphData.nodes = oFilteredGraphData.nodes.filter(function (node) {
                return !aSelectedKeys.includes(node.key);
            });
            console.log("oFilteredGraphData.nodes (after filter):", oFilteredGraphData.nodes);

            // Extend node data with V_DE
            oFilteredGraphData.nodes.forEach(function(node) {
                var correspondingVorgaenger = aVorgaengerData.find(function(vorgaenger) {
                    return vorgaenger.key === node.key;
                });
                if (correspondingVorgaenger) {
                    node.V_DE = correspondingVorgaenger.V_DE; // Add V_DE property
                }
            });

            console.log("oFilteredGraphData.nodes (after filter and V_DE addition):", oFilteredGraphData.nodes);


            // Filter lines
            oFilteredGraphData.lines = oFilteredGraphData.lines.filter(function (line) {
                return !aSelectedKeys.includes(line.from) && !aSelectedKeys.includes(line.to);
            });
            console.log("oFilteredGraphData.lines (after filter):", oFilteredGraphData.lines);

            // Reconnect lines logic
            GraphReconnectionUtils.reconnectGraphLines(oFilteredGraphData, oController);

            // Remove this line: oModel.setProperty("/originalGraphData", deepClone(oFilteredGraphData));

            // Set filtered data to model
            oModel.setProperty("/graphData", oFilteredGraphData);

            // Log the lines after reconnection
            console.log("graphData lines after reconnection:", oFilteredGraphData.lines);

            oController.getView().byId("graph").rerender();

            return oFilteredGraphData; // Return the filtered data
        }
    };
});