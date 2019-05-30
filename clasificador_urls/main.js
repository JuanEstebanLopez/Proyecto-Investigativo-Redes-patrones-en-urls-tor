


/**
* Carga la configuración de una versión anterior
*/
var openSettings= function(){
	var file = document.getElementById("open").files[0];
	var fr = new FileReader();
	fr.onload = function(e) {
		var text = fr.result;
		console.log(text);
		var json = JSON.parse(text);
		console.log(json);
		if(json.listURL)app.listURL=json.listURL;
		if(json.categories)app.categories=json.categories;
		if(json.words)app.words=json.words;
	}
	fr.readAsText(file);
};
/**
* Carga valores para agregar a la lista de urls
*/
var importFile= function(){
	var file = document.getElementById("import").files[0];
	var fr = new FileReader();
	fr.onload = function(e) {
		var text = fr.result;
		if(text!=""){
			var infoData=['url', 'title', 'category','numcategory', 'reported', 'illegal', 'malicious'];
			var list = text.split("\n");
			list.forEach(function(info){
				var uinfo= info.split(",");
				if(uinfo.length>=infoData.length){
					var nurl= newElement();
					infoData.forEach((k,i)=>nurl[k]=uinfo[i]);
					app.verifyCategory(nurl, true);
					console.log(uinfo, nurl);
					app.calculate(nurl);
					if(nurl.url!="" && app.listURL.some(u=>u.url==nurl.url)){
						console.error("Elemento Repetido: ", nurl);
					}else{
						app.listURL.push(nurl);	
					}
				}	
			});	
		}		
		// console.log(text);

	}
	fr.readAsText(file);
};
/**
* Guarda la configuración actual
*/
var saveSettings= function(){
	var json = {
		listURL:app.listURL,
		categories:app.categories,
		words:app.words
	};
	var text = JSON.stringify(json);
	download("settings.json", text);
};
/**
* Exporta los datos en formato csv
*/
var exportFile= function(){
	var data ="";
	// 'url':'', 'title':'', 'category':'',  'numcategory':0, 'reported':0, 'illegal':0, 'malicious':0, 'length':0,'uppercase':0,'digits':0,'consonants':0,'vowels':0, 'sum':0, 'concat':0
	var listCategories = {};
	var numC = 1;
	app.categories.forEach(cate=>{
		listCategories[cate]=numC;
		numC ++;
	});
	console.log("categories: ",listCategories)
	app.listURL.forEach(url=>url.numcategory=listCategories[url.category]);
	var text = app.listURL.map(lurl=>Object.values(lurl).join(",")).join("\n");
	download("data.csv", text, 'text/csv');
	
};
/**
* Descarga un archivo
*/
var download=function(filename="download.txt", content="", type="text/plain"){
	blob = new Blob([content], { type: type }),
	anchor = document.createElement('a');
	anchor.download = filename;
	anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
	anchor.dataset.downloadurl = ['text/plain', anchor.download, anchor.href].join(':');
	anchor.click();
};

function newElement(){
	var obj = {
		'url':'', 'title':'', 'category':'', 'numcategory':0, 'reported':0, 'illegal':0, 'malicious':0, 'length':0,'uppercase':0,'digits':0,'consonants':0,'vowels':0,
		'sum':0, 'concat':0
	};
	return obj;
}

let app = new Vue({
	el: '#app',
	data: {
		newURL:{},
		listURL:[],
		categories:[],
		words:[],
		newCategory:"",
		newURLExist:false,
		showAttr:[],
		allColors:[ "#6200ea", "#64dd17", "#d500f9", "#18ffff", "#d50000", "#ff6f00", "#3e2723", "#ffff00", "#827717", "#1b5e20", "#cddc39", "#006064", "#64ffda", "#eeff41", "#c51162" ],
		selectedColors:[]
	},
	methods:{
		addURL:function(){
			var nurl = this.newURL;
			this.listURL.push(nurl);
			this.newURL=newElement();
			this.newURLExist=false;
		},
		calculate: function(element){
			element.length = element.url.length;
			var l = Math.max(1,element.length);
			var arr = Array.prototype.slice.call(element.url);
			element.uppercase = (arr.filter(c=>c<='Z' && c>='A').length)/l;
			element.digits = (arr.filter(c=>c<='9' && c>='0').length)/l;
			var letters = arr.filter(c=>(c<='z' && c>='a')||(c<='Z' && c>='A'));
			var vowels = letters.filter(c=>"aeiouAEIOU".indexOf(c)!=-1).length;
			element.vowels = (vowels)/l;
			element.consonants = (letters.length-vowels)/l;

			var codes = arr.map(c=>c.charCodeAt(0));
			element.sum = codes.reduce((a,b)=>a+b);
			element.concat=codes.join("");

			if(element==this.newURL){
				this.newURLExist = element.url!="" && this.listURL.some(u=>u.url==this.newURL.url);
			}
		},
		addCategory:function(){
			if(this.newCategory!=""){
				if(!this.categories.includes(this.newCategory))
					this.categories.push(this.newCategory);
				this.newCategory = "";
			}
		},
		verifyCategory:function(element, create=false){
			var createRemove =true;
			if(!this.categories.includes(element.category)){
				if(!create)
					createRemove = confirm('La categoría "'+element.category+'" no existe, ¿Desea crearla?');
			}else{
				create=false;
			}
			if(create && createRemove){
				this.categories.push(element.category);
			}else if(!createRemove && element===this.newURL){
				this.newURL.category="";
			}
			
		},
		addColor:function(color){
			if(color!="" && !this.allColors.includes(color)){
				this.allColors.push(color);
			}
		},

	},
	created: function(){
		this.newURL=newElement();
	}
});