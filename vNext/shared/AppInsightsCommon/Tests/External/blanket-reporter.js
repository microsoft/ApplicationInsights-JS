(function myReporter() {

    var reported = false;
    var a = document.createElement("a");

    document.body.appendChild(a);
    //your reporter code
    blanket.customReporter = function (coverage) {
        blanket.defaultReporter(coverage);

        var styleTags = document.getElementsByTagName("style");

        var styles = "";
        for (var i = 0; i < styleTags.length; i++) {
            styles += styleTags[i].outerHTML;
        }

        var scriptTags = document.getElementsByTagName("body")[0].getElementsByTagName("script");

        var scripts = "";
        for (var i = 0; i < scriptTags.length; i++) {
            scripts += scriptTags[i].outerHTML;
        }

        var title = document.getElementsByTagName("title")[0].text;
        var documentName = title.replace(/[^\w]/ig, '') + 'Coverage.html';

        var coverageReport = '';
        coverageReport += '<html>' + '<head>' + styles + "</head><body><h1>" + title.replace(/[^\w\s]/ig, '') + "</h1>" + scripts + document.getElementById("blanket-main").outerHTML + "</body></html>";

        var file = new Blob([coverageReport], { type: 'text/plain' });

        a.href = URL.createObjectURL(file);

        a.download = documentName;

        if (!reported) {
            a.click();
            reported = true;
        }
        
    };

})();