sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/suite/ui/commons/sample/NetworkGraphBidirectionalCollapsing/utils/DataTransformer"
], function (JSONModel, DataTransformer) {
    "use strict";

    return {
        loadGraphData: function (oModel, oGraph, sUrl, showAllNodesCallback) {
            oModel.loadData(sUrl, null, true)
                .then(() => {
                    var oApiResponse = oModel.getData();
                    console.log("Full API Response:", oApiResponse);


                    if (oApiResponse && Array.isArray(oApiResponse) && oApiResponse.length > 0) {
                        try {
                            var combinedData = DataTransformer.transformApiDataToGraphData(oApiResponse); // Get combined data
                            console.log("Transformed Combined Data:", combinedData);

                            oModel.setData({ isLoading: false, data: combinedData.graphData }); // Set only graphData to /data
                            oModel.setProperty("/vorgaengerData", combinedData.tableData); //set table data to the vorgaengerData property of the model.

                            oModel.refresh(true);

                            oGraph.setBusy(false);
                            oGraph.invalidate();
                            oGraph.attachBeforeLayouting(showAllNodesCallback);
                        } catch (error) {
                            console.error("Error transforming data:", error);
                            oModel.setData({ isLoading: false });
                            oGraph.setBusy(false);
                        }
                    } else {
                        console.error("Invalid or empty API response");
                        oModel.setData({ isLoading: false });
                        oGraph.setBusy(false);
                    }
                })
                .catch((error) => {
                    console.error("Error loading data:", error);
                    oModel.setData({ isLoading: false });
                    oGraph.setBusy(false);
                });
        }
    };
});