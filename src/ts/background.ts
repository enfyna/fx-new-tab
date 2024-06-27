export = {};

let is_tab_saved : boolean = false;

async function translate(){
	const translations = {
		"tr": "Bu sayfayı kısayol olarak kaydet",
		"de": "Diese Seite als Verknüpfung speichern",
		"en": "Save this page as a shortcut",
		"es": "Guardar esta página como acceso directo"
	};	  

	const lang = ["en", "tr", "es", "de"].find(
        lang => navigator.language.startsWith(lang)
    ) || "en";

	await browser.browserAction.setTitle({
		title:translations[lang]
	});
}

translate();

async function setActiveTabAsShortcut() {
	const currentTab : browser.tabs.Tab = (await browser.tabs.query({
		active: true,
		currentWindow: true
	})).reverse().pop();

	if(!currentTab){
		return;
	}

	const save = await browser.storage.local.get();
	save['shortcuts'].push({
		name:currentTab.title,
		link:currentTab.url,
		img:currentTab.favIconUrl ?? ''
	});
	localStorage.clear();
	await browser.storage.local.set(save);
	await browser.browserAction.setIcon({
		path:'success.svg',
	});
	is_tab_saved = true;
}

async function resetIcon(){
	const save = await browser.storage.local.get();
	if(save.is_settings_disabled ?? false){
		browser.browserAction.onClicked.removeListener(setActiveTabAsShortcut);
		browser.browserAction.disable();
		browser.tabs.onUpdated.removeListener(resetIcon);
		browser.tabs.onActivated.removeListener(resetIcon);
		browser.windows.onFocusChanged.removeListener(resetIcon);
	}
	if (is_tab_saved) {
		await browser.browserAction.setIcon({
			path:'icon.svg',
		});
		is_tab_saved = false;
	}
}

browser.storage.local.get().then((save)=>{
	if(save.is_settings_disabled ?? false){
		browser.browserAction.disable();
		return;
	}
	browser.browserAction.onClicked.addListener(()=>{
		if(is_tab_saved){
			return;
		}
		setActiveTabAsShortcut();
	});
	
	// listen to tab URL changes
	browser.tabs.onUpdated.addListener(resetIcon);
	
	// listen to tab switching
	browser.tabs.onActivated.addListener(resetIcon);
	
	// listen for window switching
	browser.windows.onFocusChanged.addListener(resetIcon);
});
