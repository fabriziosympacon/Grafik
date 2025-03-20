sap.ui.define([], function () {
    "use strict";

    return {
        printGraph: function () {
            // Inject CSS styles for landscape print layout
            const style = document.createElement('style');
            style.innerHTML = `
                @media print {
                    @page {
                        size: landscape; /* Set the page orientation to landscape */
                        margin: 0; /* Remove any margins */
                    }
                    body {
                        margin: 0; /* Remove body margin */
                        padding: 0; /* Remove body padding */
                        overflow: hidden; /* Ensure no extra overflow */
                    }
                }
            `;
            document.head.appendChild(style);

            // Trigger the print dialog
            window.print();
        }
    };
});