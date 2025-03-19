sap.ui.define([
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/DataTransformer"
], function (DataTransformer) {
    "use strict";

    return {
        loadVorgaengerData: function (sUrl, controller) {
            fetch(sUrl)
                .then(response => {
                    console.log("API response object:", response);
                    console.log(sUrl);
                    return response.json();
                })
                .then(apiResponse => {
                    console.log("API response for vorgaenger:", apiResponse);

                    var oModel = controller.getView().getModel("dataModel");

                    if (!Array.isArray(apiResponse)) {
                        console.error("Invalid API response: Expected an array.", apiResponse);
                        oModel.setProperty("/vorgaengerData", []);
                        oModel.refresh(true);
                        return;
                    }

                    // Use DataTransformer to get combined graph and table data
                    var combinedData = DataTransformer.transformApiDataToGraphData(apiResponse);

                    // Set table data
                    oModel.setProperty("/vorgaengerData", combinedData.tableData);
                    oModel.setProperty("/graphData", combinedData.graphData); // Set the graph data

                    oModel.refresh(true);
                    console.log("✅ vorgaengerData updated:", oModel.getProperty("/vorgaengerData"));
                    console.log("✅ graphData updated:", oModel.getProperty("/graphData"));

                    if (controller && typeof controller.callback === "function") {
                        controller.callback(apiResponse);
                    }

                    // Store the original graph data
                    oModel.setProperty("/originalGraphData", combinedData.graphData);

                })
                .catch(error => console.error("❌ Error fetching vorgaenger data:", error));
        }
    };
});