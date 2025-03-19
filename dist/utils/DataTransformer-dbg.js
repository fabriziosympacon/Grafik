sap.ui.define([], function () {
    "use strict";

    return {
        transformApiDataToGraphData: function (apiResponse) {
            console.log("API Response in DataTransformer:", apiResponse);

            var oGraphData = { nodes: [], lines: [] };
            var oTableData = [];
            var oNodeMap = {};

            if (!Array.isArray(apiResponse)) {
                console.error("Invalid API response: Expected an array.", apiResponse);
                return { graphData: oGraphData, tableData: oTableData };
            }

            apiResponse.forEach(function (oRootData) {
                if (!oRootData || !oRootData.vorgaengerHierarchy) {
                    console.error("Invalid data in API object:", oRootData);
                    return;
                }

                var archivierungsObjekt = oRootData.Archivierungsobjekt;
                var archivierungsKnoten = "VORG_" + archivierungsObjekt;

                if (!oNodeMap[archivierungsKnoten]) {
                    oNodeMap[archivierungsKnoten] = {
                        key: archivierungsKnoten,
                        title: archivierungsObjekt,
                        attributes: [{ label: oRootData.O_DE }]
                    };
                    oGraphData.nodes.push(oNodeMap[archivierungsKnoten]);
                    oTableData.push({
                        Vorgaenger: archivierungsObjekt,
                        V_DE: oRootData.O_DE,
                        V_EN: oRootData.O_EN,
                        key: archivierungsKnoten
                    });
                }

                oRootData.vorgaengerHierarchy.forEach(function (oItem) {
                    if (!oItem) return;

                    var vorgaengerKey = "VORG_" + (oItem.Vorgaenger || oItem.Archivierungsobjekt);
                    var archivKey = "VORG_" + oItem.Archivierungsobjekt;

                    if (!oNodeMap[vorgaengerKey]) {
                        oNodeMap[vorgaengerKey] = {
                            key: vorgaengerKey,
                            title: oItem.Vorgaenger || oItem.Archivierungsobjekt,
                            attributes: [{ label: oItem.V_DE || oItem.O_DE }]
                        };
                        oGraphData.nodes.push(oNodeMap[vorgaengerKey]);
                        oTableData.push({
                            Vorgaenger: oItem.Vorgaenger || oItem.Archivierungsobjekt,
                            V_DE: oItem.V_DE || oItem.O_DE,
                            V_EN: oItem.V_EN || oItem.O_EN,
                            key: vorgaengerKey
                        });
                    }

                    if (!oNodeMap[archivKey]) {
                        oNodeMap[archivKey] = {
                            key: archivKey,
                            title: oItem.Archivierungsobjekt,
                            attributes: [{ label: oItem.O_DE }]
                        };
                        oGraphData.nodes.push(oNodeMap[archivKey]);
                        oTableData.push({
                            Vorgaenger: oItem.Archivierungsobjekt,
                            V_DE: oItem.O_DE,
                            V_EN: oItem.O_EN,
                            key: archivKey
                        });
                    }

                    if (vorgaengerKey !== archivKey) {
                        var lineExists = oGraphData.lines.some(function (line) {
                            return line.from === vorgaengerKey && line.to === archivKey;
                        });

                        if (!lineExists) {
                            oGraphData.lines.push({ from: vorgaengerKey, to: archivKey });
                        }
                    }

                    if (oItem.level === 0 && oNodeMap[archivKey] && !oGraphData.lines.some(line => line.from === archivKey && line.to === archivierungsKnoten)) {
                        oGraphData.lines.push({ from: archivKey, to: archivierungsKnoten });
                    }
                });
            });

            // Sort tableData alphabetically by Vorgaenger
            oTableData.sort(function (a, b) {
                var nameA = a.Vorgaenger.toUpperCase(); // Ignore case
                var nameB = b.Vorgaenger.toUpperCase(); // Ignore case
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0; // names must be equal
            });

            console.log("Final Combined Data:", { graphData: oGraphData, tableData: oTableData });
            return { graphData: oGraphData, tableData: oTableData };
        }
    };
});