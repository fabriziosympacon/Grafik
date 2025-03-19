sap.ui.define(["sap/m/MessageToast"], function (MessageToast) {
    "use strict";

    // Function to remove duplicate entries
    function removeDuplicates(data, key) {
        let uniqueData = [];
        let seen = new Set();

        data.forEach(item => {
            if (!seen.has(item[key])) {
                seen.add(item[key]);
                uniqueData.push(item);
            }
        });

        return uniqueData;
    }

    function sortDataAlphabetically(data, key) {
        return data.sort((a, b) => {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
            return 0;
        });
    }

    function loadData(oModel, filter, groupBy, baseUrl, callback) {
        if (!oModel) {
            MessageToast.show("Data model is not set");
            return;
        }

        // Reset main data
        oModel.setProperty("/selectedObject", null);

        var sUrl = baseUrl + "data"; // Use the baseUrl passed to the function

        var queryParams = [];
        if (groupBy) {
            queryParams.push("groupByArchivierungsobjekt=true");
        }

        if (filter) {
            console.log("Filter for data:", filter);
            queryParams.push("filter=" + encodeURIComponent(JSON.stringify(filter)));
        }

        sUrl += "?" + queryParams.join("&");

        console.log("Request URL:", sUrl);
        $.ajax({
            url: sUrl,
            method: "GET",
            success: function (data) {
                console.log("Data loaded successfully:", data);
                oModel.setProperty("/data", []);
                let  uniqueData = removeDuplicates(data, "Archivierungsobjekt");
                
                // Log the data after duplicates are removed
                console.log("Data after removing duplicates:", uniqueData);

                uniqueData = sortDataAlphabetically(uniqueData, "Archivierungsobjekt");

                // Set the cleaned data to the model
                oModel.setProperty("/data", uniqueData);

                if (filter && data.length > 0) {
                    var oSelectedObject = data[0];
                    oModel.setProperty("/selectedObject", oSelectedObject);
                    oModel.setProperty("/vorgaengerPanelHeader", "Vorgängerobjekt: " + oSelectedObject.Archivierungsobjekt);
                }
                if (callback) {
                    callback(data);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error(`Failed to load data (${jqXHR.status}): ${jqXHR.responseText}`);
                MessageToast.show("Failed to load data");
            }
        });
    }

    return {
        loadData: loadData  // This should ensure loadData is exported
    };
});
