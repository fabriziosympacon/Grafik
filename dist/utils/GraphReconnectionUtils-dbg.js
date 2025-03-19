sap.ui.define([], function () {
    "use strict";

    return {
        reconnectGraphLines: function (oFilteredGraphData, oController) {
            var oNodeMap = {};
            oFilteredGraphData.nodes.forEach(function (node) {
                oNodeMap[node.key] = node;
            });

            var aLinesToAdd = [];
            var aDeletedNodes = [];

            // Store 'this' in a variable
            var that = oController;

            // Find deleted nodes
            var aOriginalNodes = that.getView().getModel("dataModel").getProperty("/originalGraphData/nodes");
            aOriginalNodes.forEach(function(node){
              if(!oNodeMap[node.key]){
                aDeletedNodes.push(node.key);
              }
            });

            // Identify and create new lines
            aDeletedNodes.forEach(function (deletedNode) {
                var aPotentialFromNodes = [];
                var aPotentialToNodes = [];

                //Find Lines that are connected to the deleted node in the original graph
                var aOriginalLines = that.getView().getModel("dataModel").getProperty("/originalGraphData/lines");
                aOriginalLines.forEach(function(line){
                    if(line.to === deletedNode){
                        aPotentialFromNodes.push(line.from);
                    }
                    if(line.from === deletedNode){
                        aPotentialToNodes.push(line.to);
                    }
                });

                //Create new lines
                aPotentialFromNodes.forEach(function(fromNode){
                    aPotentialToNodes.forEach(function(toNode){
                        if(oNodeMap[fromNode] && oNodeMap[toNode]){
                            aLinesToAdd.push({from: fromNode, to: toNode});
                        }
                    });
                });
            });

            // Add new lines (if any)
            aLinesToAdd.forEach(function (newLine) {
                if (!oFilteredGraphData.lines.some(function (line) {
                    return line.from === newLine.from && line.to === newLine.to;
                })) {
                    oFilteredGraphData.lines.push(newLine);
                }
            });

            // Remove broken lines
            oFilteredGraphData.lines = oFilteredGraphData.lines.filter(function (line) {
                return oNodeMap[line.from] && oNodeMap[line.to];
            });

            //Dynamic check for combined deletions (refined)
            if(aDeletedNodes.length > 1){
                var aOriginalLines = that.getView().getModel("dataModel").getProperty("/originalGraphData/lines");
                aOriginalLines.forEach(function(originalLine){
                    if(aDeletedNodes.includes(originalLine.from) && aDeletedNodes.includes(originalLine.to)){
                        //Find nodes that were connected to the deleted nodes
                        var fromNode = null;
                        var toNode = null;
                        aOriginalLines.forEach(function(checkLine){
                            if(checkLine.to === originalLine.from && oNodeMap[checkLine.from]){
                                fromNode = checkLine.from;
                            }
                            if(checkLine.from === originalLine.to && oNodeMap[checkLine.to]){
                                toNode = checkLine.to;
                            }
                        });
                        if(fromNode && toNode){
                            if(!oFilteredGraphData.lines.some(line => line.from === fromNode && line.to === toNode)){
                                oFilteredGraphData.lines.push({from: fromNode, to: toNode});
                            }
                        }
                    }
                });
            }
        }
    };
});