const currency_api = 'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/';
const img_api = 'https://icon.horse/icon/';
interface shortcut {
	name:string;
	link:string;
	img:string;
}
interface currency {
	name:string;
	rate:string;
}
interface note {
	note:string;
}
const node = {
	currency:{
		name:"currency_name_",
		value:"currency_value_",
	},
	shortcut:{
		link:"link_",
		name:"name_",
		img:"img_",
	},
	note:{
		note:"note_",
		input:"note_input_",
	},
};

let save : object = {};
let using_local_save : boolean = true;
const start = Date.now();

get_save().then(ready);

function ready(){
	configure_shortcuts();
	set_background();
	if (is_currency_rates_enabled() || is_notes_enabled() || is_clock_enabled()){
		configure_notes();
		configure_currencies();
		configure_clock();
	}
	else{
		center_shortcuts();
	}
	configure_firefox_watermark();
	set_settings_button();
	translate();
	if(!using_local_save)
		set_local_save();
	console.info('time:' + (Date.now()-start).toString());
}

/// Save
async function get_save(){
	save = JSON.parse(localStorage.getItem('save'));
	if(save == null){
		using_local_save = false;
		save = await browser.storage.local.get(null);
	}else{
		console.info('ok!');
	}
}

function set_save(){
	browser.storage.local.set(save);
}

function set_local_save(){
	try{
		localStorage.setItem('save', JSON.stringify(save));
	}
	catch{
		console.error('Caching cant be used!\nExceeded 5MB limit.');
	}
}

function clear_local_save(){
	localStorage.clear();
}

/// Background
function set_background() {
	document.body.style.cssText += `
		background-image: ${save['bg_img'] ?? 'none'};
		background-color: ${save['bg_color'] ?? '#033633'};
	`;
}

/// Shortcuts
async function configure_shortcuts(){
	if(save['shortcuts'] == null){
		const load_text = document.getElementById('loading') as HTMLDivElement;
		load_text.innerText = 'Finding Shortcuts Please Wait...';
		save['shortcuts'] = await find_user_sites();
		set_save();
		load_text.innerText = '';
	}

	const colors = get_shortcut_col_colors();
	const transition = get_shortcut_transition();
	const circle = is_circle();

	const shortcut_base_node = document.getElementById('shortcut');
	shortcut_base_node.hidden = false;

	const size = get_shortcut_width();
	shortcut_base_node.classList.add(size);

	const link = shortcut_base_node.getElementsByTagName('a')[0] as HTMLAnchorElement;
	link.classList.replace('m-0',get_shortcut_size());
	if (transition != 'none'){
		link.classList.add(transition);
	}

	if (circle){
		const img = shortcut_base_node.getElementsByTagName('img')[0] as HTMLImageElement;
		img.classList.replace('rounded-3','rounded-circle');
		img.parentElement.classList.remove('card-header');
		link.classList.add('rounded-circle');

		const name = shortcut_base_node.getElementsByTagName('h7')[0] as HTMLDivElement;
		name.remove();
	}

	const container = shortcut_base_node.parentElement as HTMLElement;
	container.classList.add(get_shortcut_container_width(),get_shortcut_container_h_align(),get_shortcut_v_align());

	for(let i = 0; i < save['shortcuts'].length; i++){
		var shortcut : shortcut = save['shortcuts'][i];
		if (shortcut == null || shortcut.link.length == 0)
			continue;

		const shortcut_node = shortcut_base_node.cloneNode(true) as HTMLDivElement;
		const link = shortcut_node.getElementsByTagName('a')[0] as HTMLAnchorElement;
		link.classList.add(colors[i % 4]);
		link.href = shortcut.link;

		if (!circle){
			const name = shortcut_node.getElementsByTagName('h7')[0] as HTMLDivElement;
			if(shortcut.name)
				name.innerText = shortcut.name;
			else{
				name.hidden = true;
			}
		}
		container.appendChild(shortcut_node);

		const img = shortcut_node.getElementsByTagName('img')[0] as HTMLImageElement;
		if(shortcut.img == "") {
			get_shortcut_img(i, img);
			continue;
		};
		img.src = shortcut.img;
	};
	shortcut_base_node.remove();

	container.parentElement.classList.add(get_shortcut_v_align(),get_shortcut_container_h_align());
}

async function find_user_sites() {
	const topSites = await browser.topSites.get({
		limit: 8,
		includeFavicon: true,
		onePerDomain: true,
	});
	const shortcuts : shortcut[] = [];

	topSites.forEach(site => {
		const shortcut : shortcut = {
			name: site.title,
			link: site.url,
			img: site.favicon ?? '',
		};
		shortcuts.push(shortcut);
	});
	return shortcuts;
}

async function get_shortcut_img(i : number, node : HTMLImageElement){
	try {
		const response = await get_favicon_from_url(save['shortcuts'][i].link)

		const img_type = response.headers.get("Content-Type");
		if(img_type == 'image/svg+xml'){
			throw new Error('Cant display SVG file');
		}
		const blob = await response.blob()
		const b64 =  URL.createObjectURL(blob);
		let img = new Image();
		img.onload = () => {
			var canvas = document.createElement("canvas")
			canvas.width = img.width;
			canvas.height = img.height;
			var context = canvas.getContext("2d");
			context.drawImage(img, 0, 0);
			var dataurl = canvas.toDataURL(img_type);
			save['shortcuts'][i].img = dataurl;
			node.src = dataurl;
			set_save();
		};
		img.src = b64;
	} catch (error) {
		console.error(error);
		// We couldnt get a favicon from the api
		// so we will try to create a basic replacement
		let canvas = document.createElement("canvas");
		let context = canvas.getContext("2d") as CanvasRenderingContext2D;
		canvas.width = 256;
		canvas.height = 256;
		context.fillStyle = "#442288aa";
		context.fillRect(0,0,256,256);
		context.font = "bold 160px monospace";
		context.textAlign = "center";
		context.fillStyle = "white";
		context.textBaseline = "middle";
		context.fillText(save['shortcuts'][i].link.replace("https://","").replace("http://","").replace("www.","").toUpperCase().slice(0,2), canvas.width/2, canvas.height/2);
		var image = canvas.toDataURL();
		node.src = image;
		save['shortcuts'][i].img = image;
		set_save();
	}
}

async function get_favicon_from_url(url : string){
	if(navigator.onLine == false){
		throw new Error("No internet connection. Cant get favicon.");
	};
	if(!url.startsWith("http")){
		throw new Error("Invalid URL format");
	};
	url = url.split('/')[2];
	const response = await Promise.race([
		fetch(img_api.concat(url), {method: "GET", mode: 'cors'}),
		new Promise<Response>((_, reject) =>
		 	setTimeout(() => reject({status:408}), 4000)
		)
	]);
	if (response.status == 408){
		throw new Error("HTTP request timed out.")
	}
	if (response.status != 200){
		throw new Error("HTTP request failed");
	}
	return response;
}

function center_shortcuts() {
	document.getElementById('ShortcutContainer').parentElement.classList.replace('col-md-8','col-md-12');
	document.getElementById('NCContainer').remove();
}

function is_circle() : boolean {
	return save['shortcut_shape'] == 'circle';
}

function get_shortcut_width() : string {
	return save['shortcut_width'] ?? 'col-sm-3';
}

function get_shortcut_v_align() : string {
	return save['shortcut_v_align'] ?? 'align-items-center';
}

function get_shortcut_size() : string {
	return save['shortcut_size'] ?? 'm-0';
}

function get_shortcut_transition() : string {
	return save['shortcut_transition'] ?? 'glow';
}

function get_shortcut_col_colors() : string[]{
	return save['shortcut_col_colors'] ?? ['bg-primary','bg-danger','bg-success','bg-warning'];
}

function get_shortcut_container_h_align() : string{
	return save['shortcut_container_h_align'] ?? 'justify-content-center';
}

function get_shortcut_container_width() : string{
	return save['shortcut_container_width'] ?? 'col-md-6';
}

/// Notes
function get_notes() : note[] {
	if (save['notes'] != null){
		return save['notes'];
	}
	save['notes'] = [
		{note: ""},
		{note: ""},
		{note: ""},
		{note: ""},
	];
	return save['notes'];
}

function is_notes_enabled() : boolean {
	return save['is_notes_enabled'] ?? false;
}

function configure_notes(){
	if(!is_notes_enabled()){
		document.getElementById('notes').remove();
		return
	}
	var notes : note[] = get_notes();
	for	(let i = 0; i < 4; i++){
		var button : HTMLButtonElement = document.getElementById(node.note.note + i) as HTMLButtonElement;
		button.innerText = notes[i].note;
		button.hidden = false;
		var note : HTMLInputElement = document.getElementById(node.note.input + i) as HTMLInputElement;
		button.addEventListener('click', () => {
			var button : HTMLButtonElement = document.getElementById(node.note.note + i) as HTMLButtonElement;
			var note : HTMLInputElement = document.getElementById(node.note.input + i) as HTMLInputElement;
			note.value = button.innerText;
			button.hidden = true;
			note.hidden = false;
			note.focus();
		});
		['change', 'blur'].forEach(event => {
			note.addEventListener((event), () => {
				save_note(i);
			});
		});
	};
}

function save_note(i : number){
	var button : HTMLButtonElement = document.getElementById(node.note.note + i) as HTMLButtonElement;
	var note : HTMLInputElement = document.getElementById(node.note.input + i) as HTMLInputElement;
	note.value = note.value.trim()
	save['notes'][i].note = note.value;
	button.innerText = note.value;
	note.hidden = true;
	button.hidden = false;
	set_save();
}

/// Currencies
function get_currencies() : currency[] {
	if (save['currencies'] != null){
		return save['currencies'];
	}
	save['currencies'] = [
		{name:'USD',rate:'-'},
		{name:'EUR',rate:'-'},
		{name:'GBP',rate:'-'},
	];
	return save['currencies'];
}

function get_base_currency() : string{
	return save['base_currency'] ?? 'TRY';
}

function is_currency_rates_enabled() : boolean {
	return save['is_currency_rates_enabled'] ?? false;
}

function did_a_day_pass() : boolean {
	const saved_date_str : string = save["date"] ?? '0';
	const now : number = Date.now();
	if (now - parseInt(saved_date_str) > 43200000){
		save['date'] = now;
		return true;
	};
	return false;
}

async function configure_currencies(){
	if(!is_currency_rates_enabled()){
		return;
	}
	const currencies = get_currencies();

	// Update the currency if a day has passed
	// or if we have reset the currency values
	let fetch_currencies = did_a_day_pass();
	if(!fetch_currencies){
		for (let i = 0; i < currencies.length; i++) {
			if (currencies[i].rate == '-'){
				fetch_currencies = true;
			};
		}
	}

	if(fetch_currencies){
		try {
			const rates = await get_rates();
			for (let i = 0; i < 3; i++) {
				const currency = currencies[i];
				currency.rate = (1.0 / rates[currency.name.toLowerCase()]).toFixed(2);
			};
			save['currencies'] = currencies;
			set_save();
		}
		catch (error) {
			console.log(error);
		}
	}

	const currency_container = document.getElementById('currencies');

	const card_nodes = currency_container.getElementsByClassName('card');
	const name_nodes = currency_container.getElementsByTagName('h5');
	const rate_nodes = currency_container.getElementsByTagName('p');

	const color = get_currency_container_color();

	for (let i = 0; i < 3; i++) {
		const currency = currencies[i];
		card_nodes[i].classList.add(color);
		name_nodes[i].innerText = currency.name;
		rate_nodes[i].innerText = currency.rate;
	};

	currency_container.classList.replace('d-none','d-list');
}

function get_rates(){
	return new Promise<object>((resolve, reject) => {
		if(navigator.onLine == false){
			return reject("No internet connection. Cant get currency rates.");
		};
		const base_currency = get_base_currency().toLowerCase();
		const req : XMLHttpRequest = new XMLHttpRequest();
		req.onreadystatechange = () => {
			if (req.readyState == 4) {
				if(req.status == 200){
					const res = JSON.parse(req.responseText)[base_currency];
					return resolve(res);
				}else{
					return reject("HTTP request failed");
				};
			};
		};
		req.ontimeout = () => {
			return reject("Request timed out");
		};
		req.open(
			"GET",
			currency_api.concat(base_currency, ".min.json?", Date.now().toString()),
			true
		);
		req.timeout = 5000;
		req.send();
	});
}

function get_currency_container_color() : string{
	return save['currency_container_color'] ?? 'bg-primary';
}

/// Clock
function is_clock_enabled() : boolean{
	return save['is_clock_enabled'] ?? false;
}

function configure_clock() {
	if(!is_clock_enabled()){
		return;
	}
	const clock = document.getElementById('clock') as HTMLHeadingElement;
	clock.classList.add(get_clock_color());

	const clock_format = get_clock_format();
	const time_format = get_clock_time_format();

	function updateTime() {
		const date = new Date();
		const hour = date.getHours();

		clock.innerText = clock_format
			.replace('yy',date.getFullYear().toString().slice(2,4))
			.replace('mm',(date.getMonth() + 1).toString().padStart(2, '0'))
			.replace('dd',date.getDate().toString().padStart(2, '0'))
			.replace('h',(time_format ? (hour < 12 ? hour : hour - 12) : hour).toString().padStart(2, '0'))
			.replace('m',date.getMinutes().toString().padStart(2, '0'))
			.replace('s',date.getSeconds().toString().padStart(2, '0'))
			.replace('&n','\n');
	}

	updateTime();

	setInterval(updateTime, 1000);
}

function get_clock_color() : string {
	return save['clock_color'] ?? 'text-white';
}

function get_clock_format() : string {
	return save['clock_format'] ?? 'h:m';
}

function get_clock_time_format() : boolean {
	return save['clock_time_format'] ?? false;
}

/// Firefox Watermark
function is_firefox_watermark_enabled() : boolean{
	return save['is_firefox_watermark_enabled'] ?? true;
}

function configure_firefox_watermark() {
	if(!is_firefox_watermark_enabled())
		return
	const fx = document.getElementById('firefox_watermark') as HTMLDivElement;
	fx.classList.add(get_firefox_watermark_color());
	fx.classList.replace('d-none','d-flex');
}

function get_firefox_watermark_color() : string{
	return save['firefox_watermark_color'] ?? 'text-warning';
}

/// Settings Button
function set_settings_button(){
	const nav = document.getElementById('nav-button') as HTMLButtonElement;
	nav.addEventListener('click', () => {
		clear_local_save();
		location.href = 'settings.html';
	});
	nav.hidden = false;
}

/// Translations
function translate() : void {
	const translations = [
		{
			"name": "note-input",
			"tr": "Kısa bir not giriniz",
			"en": "Enter a brief note",
			"de": "Geben Sie eine kurze Notiz ein",
			"es": "Ingresa una nota breve",
		},
	];
	let lang : string;
	switch (navigator.language.toLowerCase().split("-")[0]){
		case "tr":
			lang = "tr";
			break;
		case "de":
			lang = "de";
			break;
		case "es":
			lang = "es";
			break;
		default:
			lang = "en";
			break;
	};
	for (const dict of translations) {
		const elm_name : string = dict.name;
		const translation : string = dict[lang];
		if(elm_name == "note-input"){
			for (const element of document.getElementsByName(elm_name)){
				(element as HTMLInputElement).placeholder = translation;
			};
		}
		else{
			for (const element of document.getElementsByName(elm_name)){
				element.innerText = translation;
			};
		};
	};
}