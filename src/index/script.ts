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

let save : object = {}

get_save().then(ready);

function ready(){
	configure_shortcuts();
	set_background();
	if (is_currency_rates_enabled() || is_notes_enabled()){
		configure_notes();
		configure_currencies();
	}
	else{
		center_shortcuts();
	}
	set_settings_button();
	translate();
}

/// Save
async function get_save(){
	save = await browser.storage.local.get(null);
}

function set_save(){
	browser.storage.local.set(save);
}

/// Background
function get_bg_image() {
	if(save['bg_img'] != null){
		return ''.concat("url(",save['bg_img'],")");
	}
	else{
		return 'none';
	}
}

function get_bg_color() : string{
	return save['bg_color'] ?? '#031633';
}

function set_background() {
	document.body.style.cssText += `
		background-image: ${get_bg_image()};
		background-color: ${get_bg_color()};
	`;
	document.body.classList.remove('bg-black');
}

/// Shortcuts
async function configure_shortcuts(){
	if(save['shortcuts'] == null){
		const settings_button = document.getElementById('nav-button') as HTMLButtonElement;
		settings_button.hidden = true;
		const load_text = document.getElementById('loading') as HTMLDivElement;
		load_text.innerText = 'Finding Shortcuts Please Wait...';
		save['shortcuts'] = await find_user_sites();
		set_save();
		settings_button.hidden = false;
		load_text.innerText = '';
	}

	let active_shortcuts : number = 0;

	const colors = get_shortcut_col_colors();
	const transition = get_shortcut_transition();
	const circle = is_circle();

	const shortcut_base_node = document.getElementById('shortcut');
	shortcut_base_node.hidden = false;

	const link = shortcut_base_node.getElementsByTagName('a')[0] as HTMLAnchorElement;
	link.classList.replace('m-0',get_shortcut_size());
	if (transition != 'none'){
		link.classList.add(transition);
	}
	const img = shortcut_base_node.getElementsByTagName('img')[0] as HTMLImageElement;
	if (circle){
		img.classList.replace('rounded-3','rounded-circle');
		img.parentElement.classList.remove('card-header');
		link.classList.add('rounded-circle');
	}

	const container = shortcut_base_node.parentElement as HTMLElement;

	for(let index = 0; index < 12; index++){
		var shortcut : shortcut = save['shortcuts'][index] as shortcut;
		if (shortcut == null || shortcut.link.length == 0)
			continue;

		active_shortcuts++;

		const shortcut_node = shortcut_base_node.cloneNode(true) as HTMLDivElement;
		const link = shortcut_node.getElementsByTagName('a')[0] as HTMLAnchorElement;
		const img = shortcut_node.getElementsByTagName('img')[0] as HTMLImageElement;
		const name = shortcut_node.getElementsByTagName('h7')[0] as HTMLDivElement;
		
		link.classList.add(colors[index % 4]);	
		
		if (!shortcut.name || circle){
			name.hidden = true;
		}
		else{
			name.innerText = shortcut.name;
		}
		link.href = shortcut.link;

		container.appendChild(shortcut_node);

		if(shortcut.img == "") {
			get_shortcut_img(index, img);
			continue;
		};
		img.src = shortcut.img;
	};
	shortcut_base_node.remove();

	if (active_shortcuts > 4){
		container.classList.replace(
			"align-items-center","align-items-start"
		);
	}

	if (container.clientHeight > window.innerHeight){
		container.classList.add('col-md-10');
	}
}

async function find_user_sites() {
    const topSites = await browser.topSites.get({
		limit: 12,
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

function get_shortcut_img(i : number, node : HTMLImageElement){
	get_favicon_from_url(save['shortcuts'][i].link)
	.then(response => {
		var img_type = response.headers.get("Content-Type");
		if(img_type == 'image/svg+xml'){
			throw new Error('Cant display SVG file');
		}
		response.blob()
		.then(blob => {
			const b64 =  URL.createObjectURL(blob);
			var img = new Image();
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
		});
	})
	.catch((err)=>{
		console.log(err);
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
		context.fillText((save['shortcuts'][i].name[0] != null ? save['shortcuts'][i].name[0] : save['shortcuts'][i].link.replace("https://","").replace("http://","").replace("www.","").split("/")[0][0]).toUpperCase(), canvas.width/2, canvas.height/2);
		var image = canvas.toDataURL();
		node.src = image;
		save['shortcuts'][i].img = image;
		set_save();
	});
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
	document.getElementById('NCContainer').remove();
}

function is_circle() : boolean {
	return save['shortcut_shape'] == 'circle' ? true : false;
}

function get_shortcut_size() : string {
	return save['shortcut_size'] ?? 'm-0';
}

function get_shortcut_transition() : string {
	return save['shortcut_transition'] ?? 'glow';
}

function get_shortcut_col_colors() : Array<string>{
	return save['shortcut_col_colors'] ?? ['bg-primary','bg-danger','bg-success','bg-warning'];
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
	set_save();
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
	set_save();
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
		set_save();
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
	// or if we have reset currency values
	let fetch_currencies = did_a_day_pass();
	if(!fetch_currencies){
		if (currencies[0].rate == '-'){
			fetch_currencies = true;
		};
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

	const name_nodes = currency_container.getElementsByTagName('h5');
	const rate_nodes = currency_container.getElementsByTagName('p');

	for (let i = 0; i < 3; i++) {
		const currency = currencies[i];
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

/// Settings Button
function set_settings_button(){
	const nav = document.getElementById('nav-button') as HTMLButtonElement;
	nav.addEventListener('click', () => {
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