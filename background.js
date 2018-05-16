function resetStates() {
	
	for (var lsLength=0; lsLength < localStorage.length; lsLength++) {
		key = localStorage.key(lsLength);
		if (key == "undefined" || typeof (key) == undefined|| key == "firstRun") {
			continue;
		}
		var storedEntry = JSON.parse(localStorage.getItem(key));
		storedEntry.bActivated = false;
		localStorage.setItem(key, JSON.stringify(storedEntry))
	}
}

function checkForValidUrl(tab) {
	for (var lsLength=0; lsLength < localStorage.length; lsLength++) {
		key = localStorage.key(lsLength);
		if (key == "undefined" || typeof (key) == undefined|| key == "firstRun") {
			continue;
		}
		var storedEntry = JSON.parse(localStorage.getItem(key));
		if (storedEntry.bActivated == false) {
			for (q in storedEntry.filterWords) {
				var patt = new RegExp(storedEntry.filterWords[q], 'i');
				if (patt.test(tab.url)) {
					//console.log(tab.url,storedEntry.name)
					storedEntry.bActivated = true;
					localStorage.setItem(key, JSON.stringify(storedEntry))
					
				}
			}
		}
	}
}

function setExt() {
	//go through and disable/enable extensions marked for activation
	chrome.browserAction.setBadgeBackgroundColor({
		color: [0, 0, 0, 0]
	});
	chrome.browserAction.setBadgeText({
		text: ""
	});
	for (var lsLength=0; lsLength < localStorage.length; lsLength++) {
		key = localStorage.key(lsLength);
		if (key == "undefined" || typeof (key) == undefined || key == "firstRun") {
			continue;
		}
		var storedEntry = JSON.parse(localStorage.getItem(key));
		chrome.management.get(key, function (ext) {
			var storedEntry = JSON.parse(localStorage.getItem(ext.id));
			if (storedEntry.bEnable == true) {
				if (storedEntry.bActivated == true) {
					chrome.management.setEnabled(storedEntry.id, true);
					chrome.browserAction.setBadgeBackgroundColor({
						color: [100, 250, 100, 120]
					});
					chrome.browserAction.setBadgeText({
						text: "ON"
					});
				} else {
					chrome.management.setEnabled(storedEntry.id, false);
				}
			} else {
				if (storedEntry.bActivated == true) {
					chrome.management.setEnabled(storedEntry.id, false);
					chrome.browserAction.setBadgeBackgroundColor({
						color: [250, 100, 100, 120]
					});
					chrome.browserAction.setBadgeText({
						text: "ON"
					});
				} else {
					chrome.management.setEnabled(storedEntry.id, true);
				}
			}
			localStorage.setItem(ext.id, JSON.stringify(storedEntry));
			//console.log("Enabled?", ext.enabled, " Set to Enable?", storedEntry.bEnable, "Set to Activate (enable/disable)?", storedEntry.bActivated);
		});
	}
}
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'loading') {
        //Execute script when the page is fully (DOM) ready, otherwise EVENT FIRES TWICE!
	resetStates();
	chrome.windows.getAll({
		"populate": true
	}, function (window) {
		for (w in window) {
			for (t in window[w].tabs) {
				checkForValidUrl(window[w].tabs[t]);
			}
		}
	setExt();
	});
    }
});
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	resetStates();
	chrome.windows.getAll({
		"populate": true
	}, function (window) {
		for (w in window) {
			for (t in window[w].tabs) {
				checkForValidUrl(window[w].tabs[t]);
			}
		}
	setExt();
	});
});
//on init get all
chrome.browserAction.setBadgeText({
	text: ""
});

chrome.windows.getAll({
	"populate": true
}, function (window) {
	resetStates();
	for (w in window) {
		for (t in window[w].tabs) {
			checkForValidUrl(window[w].tabs[t]);
		}
	}
	setExt();
});