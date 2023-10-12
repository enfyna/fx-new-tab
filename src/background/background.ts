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
}

browser.browserAction.onClicked.addListener(()=>{
	setActiveTabAsShortcut();
});