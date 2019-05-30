// Render Multiple URLs to file

"use strict";
var RenderUrlsToFile, arrayOfUrls, system, inputFile, outputFile, visited;
var now = new Date();
var dt = now.toLocaleString().replace(/[\. ,]/g, "_").split("__")[0];



var fs = require('fs'),
system = require("system");





/**
* Consulta si una url ya se ha visitado
* @param <String> url: URL a visitar.
* @param <boolean> showIsChecked
*/
visited = function(url, showIsChecked){
    console.log("visited", url, showIsChecked);
    if(showIsChecked){
        var visitedLinks = fs.read("data/out/visited.txt");
        return visitedLinks.indexOf(url+" ")!=-1;
    }else{
        fs.write("data/out/visited.txt", url+" \n", 'a');    
        return true;
    }
    return false;
};

/*
Render given urls
@param array of URLs to render
@param callbackPerUrl Function called after finishing each URL, including the last URL
@param callbackFinal Function called after finishing everything
*/
RenderUrlsToFile = function(urls, callbackPerUrl, callbackFinal) {
    console.log("inicio");
    var getFilename, next, saveToOutputFile, page, retrieve, webpage;
    
    webpage = require("webpage");
    page = null;
    /**
    * Obtiene una ruta para guardar una captura de pantalla.
    * @param {String} url: La url de la página visitada.
    * @return {String} Ruta generada a partir de la fecha y la url.
    */
    getFilename = function(url) {
        return "data/img/rendermulti_" + dt + "_" + url.replace(/[\./]/g, "_") + ".png";
    };
    next = function(status, url, file) {
        if(page!=null) page.close();
        callbackPerUrl(status, url, file);
        return retrieve();
    };
    /**
    * Guarda la información de la página visitada con la ruta de su imagen
    * @param {String} pageUrl: URL de la página visitada.
    * @param {String} imageName: Ruta de la imagen de pantallazo de la página.
    */
    saveToOutputFile=function(pageUrl, imageName, links){
        console.log("Save to output");
        var ofile= outputFile;
        var obj={
            page: pageUrl,
            img: imageName,
            title: "",
            links: links,
            lvl:0, 
            categorias:[0, 1]
        };
        fs.write(ofile, JSON.stringify(obj)+",\n", 'a');
    };
    retrieve = function() {
        page=null;
        var url;
        if (urls.length > 0) {
            url = urls.shift();
            console.log("->     "+url);
            
            if(visited(url, true)){
               console.log("La url "+url + "Ya había sido visitada.");
               return next("Visitado", url, "none");
           }

            page = webpage.create();
            page.viewportSize = {
                width: 800,
                height: 600
            };
            page.settings.userAgent = "Phantom.js bot";
            return page.open("http://" + url, function(status) {
                var file;
                file = getFilename(url);
                if (status === "success") {
                    return window.setTimeout((function() {
                        console.log("Rendering file");
                        page.render(file);




                        var resultLinks = page.evaluate(function() {
                            infoLinks = function(jsLinks,cssLinks, aLinks ){
                                var jsl= Array.prototype.slice.call(jsLinks).filter(function(s){return s.src!="";}).map(function(l){return l.src;}).join(",");
                                var cssl = Array.prototype.slice.call(cssLinks).filter(function(s){return s.src!="";}).map(function(l){return l.src;}).join(",");
                                var al = Array.prototype.slice.call(aLinks).filter(function(s){return s.href!="";}).map(function(l){return l.href;}).join(",");
                                arr = "{js:["+jsl+"],css:["+cssl+"],a:["+al+"]}";
                                return arr;
                            };
                            var r = infoLinks(document.getElementsByTagName("script"),document.getElementsByTagName("style"),document.getElementsByTagName("a"));
                            return r;
                        });



                        var fileArchive = file.replace("img", "file").replace(".png", ".html");
                        fs.write(fileArchive, page.content, 'w');
                        saveToOutputFile(url, file, resultLinks);


                        visited(url, false);
                        return next(status, url, file);
                    }), 200);
                } else {
                    return next(status, url, file);
                }
            });
        } else {
            return callbackFinal();
        }
    };
    return retrieve();
};



// Inicializa los valores a escrapear.
arrayOfUrls=[];
inputFile = (system.args.length >= 2 && system.args[1] != "na")? system.args[1]: "data/in/list.txt";
outputFile = (system.args.length >= 3 && system.args[2] != "na")? system.args[2]:"data/out/result.txt";

    // carga las URLs del input
    var input = fs.open(inputFile, "r");
    while(!input.atEnd()) {
        var line = input.readLine();
        arrayOfUrls.push(line);
    }
    input.close();
    console.log(arrayOfUrls);

// agrega urls adicionales
if (system.args.length > 3) {
    arrayOfUrls.concat(Array.prototype.slice.call(system.args, 3));
}
// Si no hay urls registradas, usa una lista por defecto.
if(arrayOfUrls.length <= 0){
    console.log("Usage: phantomjs scrapper.js file_input_urls.txt file_outputResult.txt [domain.name1, domain.name2, ...]");
    arrayOfUrls = ["www.google.com", "www.bbc.co.uk", "phantomjs.org"];
}

RenderUrlsToFile(arrayOfUrls, (function(status, url, file) {
    if(status=="Visitado"){
        return console.log("visited '" + url + "'");
    }else if (status !== "success") {
        return console.log("Unable to render '" + url + "'");
    } else {
        return console.log("Rendered '" + url + "' at '" + file + "'");
    }
}), function() {
    return phantom.exit();
});
