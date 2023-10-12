let is_tab_saved : boolean = false;
async function setActiveTabAsShortcut() {
	const currentTab : browser.tabs.Tab = (await browser.tabs.query(
		{
			active: true,
			currentWindow: true
		}
	)).reverse().pop();

	if(!currentTab){
		return;
	}

	const save = await browser.storage.local.get();
	save['shortcuts'].push(
		{
			name:currentTab.title,
			link:currentTab.url,
			img:currentTab.favIconUrl ?? ''
		}
	);
	localStorage.clear();
	await browser.storage.local.set(save);
	await browser.browserAction.setIcon({
		path:'icons/success.svg',
	});
	is_tab_saved = true;
}

async function resetIcon(){
	if (is_tab_saved) {
		await browser.browserAction.setIcon({
			path:'icons/icon.svg',
		});
		is_tab_saved = false;
	}
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