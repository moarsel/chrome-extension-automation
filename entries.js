//Copyright © Russell Hoy 2012 All Right Reserved. 
//No parts of this document may be used in any published or commercial
//materials without prior consent. I would happy to share this code, but I prefer being asked first.

function init() {
	getStored(); //fill export box
	firstRun();
	//bind accordians
	//$(".toggle").slideUp(); //start up
	$(".trigger").click(function(){
		$(this).next(".toggle").slideToggle("medium");
	});

	form = document.getElementById("prefs-form");
	chrome.management.getAll(load_extensions);
	form.addEventListener("submit", function (event) {
		var selectedExt = document.getElementById("dropdown_ext_list").value;
		var filterWords = document.getElementById("txtEnter").value;
		var bEnable = document.getElementById("bEnable").value;
		addStore(selectedExt, filterWords, bEnable);		
	});
	makeTable();

}

function firstRun(){
	//make sure old users don't have corrupt data from old localStorage.
	var firstRun = (localStorage['firstRun'] == 'true');
	if (!firstRun) {
		localStorage.clear();
 	 	localStorage['firstRun'] = 'true';
	}
}

function popupInit() {
	popupForm = document.getElementById("popup-form");
	chrome.tabs.getSelected(function (tab) {
		var getUrl = tab.url;
		var domainUrl = getUrl.split('/');
		var setUrl = document.getElementById('currentUrl');
		setUrl.outerHTML = '<input type = text id = "currentUrl" value =' + domainUrl[2] + '/>';
	});

	chrome.management.getAll(load_extensions);
	popupForm.addEventListener("submit", function (event) {
		var selectedExt = document.getElementById("dropdown_ext_list").value;
		var filterWords = document.getElementById("currentUrl").value;
		var bEnable = document.getElementById("bEnable").value;
		addStore(selectedExt, filterWords, bEnable);
		window.close();
	});
}

function load_extensions(extensions) {
	var x = document.getElementById("dropdown_ext_list");
	var optionArray = [];
	for (i in extensions) {
		if (extensions[i].isApp != 1 && (extensions[i].name != 'Extension Automation')) {
			optionArray[i] = [extensions[i].name, extensions[i].id];
		}
	}
	optionArray.sort();
	while (x.options.length > 0) {
		x.options[0] = null;
	}
	for (var p in optionArray) {
		var op = new Option(optionArray[p][0], optionArray[p][1]);
		x.options[p] = op;
	}
}
function addStore(extId, filterText, bEnable) {	
	chrome.management.get(extId, function (ext) {
		if (ext.isApp){
			return;
		}
		var storedEntry = JSON.parse(localStorage.getItem(ext.id));
		var filterWords = [];
		var enable = true;
		if (storedEntry != null) {
			for (i in storedEntry.filterWords) {
				filterWords.push(storedEntry.filterWords[i]);
			}
		}
		filterWords.push(filterText);
		if (bEnable == "Enable") {
			enable = true;
		} else {
			enable = false;
		}
		var entry = {
			id: ext.id,
			name: ext.name,
			bEnable: enable,
			bActivated: false,
			filterWords: filterWords
		}
		localStorage.setItem(ext.id, JSON.stringify(entry));
	});
}

function makeTable() {

	var table = document.getElementById("prefs-table");
	table.innerHTML = "";
	if (localStorage.length > 1){
		table.innerHTML = '<tr><th>Extension</th> <th>Filter</th></tr>';
	}
	var $tbody = document.createElement("tbody");
	for (extId in localStorage) {
		if (extId == "undefined" || extId == "firstRun") {continue;}
		chrome.management.get(extId, function (ext) {
			var entry = JSON.parse(localStorage.getItem(ext.id));
			if (entry == null){return;}
			var $tr = document.createElement("tr");
			$tr.setAttribute('id', entry.bEnable);
			var $td = document.createElement("td");
			var extensionName = document.createElement('a');
			document.createTextNode(entry.name);
			
			//add icons if possible
			try {
				if (ext.icons[1]) { 
					extensionName.innerHTML = "<img src=" + ext.icons[1].url + " width = 30 height = 30 />  "
				} 
				else if(ext.icons[0]) {
					extensionName.innerHTML = "<img src=" + ext.icons[0].url + " width = 30 height = 30 />  "
				}
				else if(ext.icons[2]) {
					extensionName.innerHTML = "<img src=" + ext.icons[2].url + " width = 30 height = 30 />  "
				}
				else {
					extensionName.innerHTML = "<img src='blank.png'; width = 30; height = 30 />  "
				}
			}
			catch(err){
				extensionName.innerHTML = "<img src='blank.png'; width = 30; height = 30 />  "
			}
			//add disable sign
			extensionName.innerHTML += "<img src= 'nosign1.png'; class = 'nosign'/>"
			extensionName.innerHTML += ext.name;
			$td.appendChild(extensionName);
			$td.setAttribute('class', entry.id);
			$td.setAttribute('onclick', 'switchMode(this.className)')
			$tr.appendChild($td);
			$td = document.createElement("td");

			for (i in entry.filterWords) {
				var enable_words = document.createElement('span');
				enable_words.innerHTML = entry.filterWords[i] + "," + "<br>";
				enable_words.setAttribute('class', entry.id);
				enable_words.setAttribute('id', i);
				enable_words.setAttribute('onclick', 'removeItem(this.className, this.id)');
				$td.appendChild(enable_words);
			}
			$tr.appendChild($td);
			$tbody.appendChild($tr)
			table.appendChild($tbody)
		});
	}
	getStored();
}

function getStored(){
	$('#export').val(JSON.stringify(localStorage));
}

function setStored(){
	var string = $('#import').val();
	try {
		var data = JSON.parse(string);
		for (var key in data) {
			localStorage[key] = data[key];
		}
		firstRun();
		makeTable();

		$('#flash').fadeIn('medium', function() {
	        		$('#flash').fadeOut(2000);
	      	});
	}
	catch(err){ 
		alert("Sorry, there was a problem importing data. Most likely, the imported data has a formatting mistake. Details: " + err);
	}
}

function selectAll(id){
	document.getElementById(id).focus();
    	document.getElementById(id).select();
}

function removeItem(entryId, word) {
	var storedEntry = JSON.parse(localStorage.getItem(entryId));
	storedEntry.filterWords.splice(word, 1);
	if (storedEntry.filterWords.length == 0) { //if no filter words left, delete entry
		localStorage.removeItem(entryId);
	} else {
		localStorage.setItem(entryId, JSON.stringify(storedEntry));
	}
	makeTable();
}

function switchMode(entryId) {
	var storedEntry = JSON.parse(window.localStorage.getItem(entryId))
	if (storedEntry.bEnable == false) { //if disabled, enable
		storedEntry.bEnable = true;
		window.localStorage.setItem(entryId, JSON.stringify(storedEntry));
	} else {
		storedEntry.bEnable = false;
		window.localStorage.setItem(entryId, JSON.stringify(storedEntry));
	}
	makeTable();
}

function doClear() {
	var r=confirm("Erase all saved settings?");
	if (r==true)
	  {
	  	localStorage.clear();
	  	firstRun();
		makeTable();
	  }	
}