interface save{
	bg_img:string;
	bg_color:string;

	shortcuts:shortcut[];
	shortcut_shape:string;
	shortcut_width:string;
	shortcut_v_align:string;
	shortcut_size:string;
	shortcut_transition:string;
	shortcut_col_colors:string[];
	shortcut_container_h_align:string;
	shortcut_container_width:string;
	
	notes:note[];
	is_notes_enabled:boolean;
	
	currencies:currency[];
	base_currency:string;
	is_currency_rates_enabled:boolean;
	date:number;
	currency_container_color:string;
	
	is_clock_enabled:boolean;
	clock_font:string;
	clock_color:string;
	clock_format:string;
	clock_boldness:string;
	clock_border_style:string;
	clock_border_color:string;
	clock_border_radius:string;
	clock_border_width:string;
	clock_time_format:boolean;

	is_firefox_watermark_enabled:boolean;
	firefox_watermark_color:string;

	is_settings_disabled:boolean;
	is_settings_button_hiding:boolean;
}
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
	color:string;
}

enum node{
	sh_link = "select_link_", 
	sh_name = "select_name_",
	sh_img = "select_img_",
	sh_reset = "reset_img_",
	sh_default = "set_back_",
	sh_remove = "remove_",

	nt_color = "nt_color_",
};

let save : save;

get_save().then(ready)

async function ready(){
	if(save.is_settings_disabled ?? false){
		location.href = 'index.html';
	}
	translate();
	configure_shortcut_settings();
	configure_drag_and_drop();
	configure_background_settings();
	configure_clock_settings();
	configure_note_settings();
	configure_currency_settings();
	configure_firefox_watermark_settings();
	configure_import_export();
	configure_nav_settings();
	configure_home_button();
}

/// Save
async function get_save(){
	save = await browser.storage.local.get(null) as save;
}
let saving = false;
const save_info = document.getElementById('save-info');
async function set_save(){
	saving = true;
	save_info.hidden = false;
	localStorage.clear();
	await browser.storage.local.set(save);
	saving = false;
	save_info.hidden = true;
}

/// Background
function configure_background_settings() {
	const fb_clr_node = document.getElementById("bg_color") as HTMLInputElement;
	fb_clr_node.value = save.bg_color ?? 'black';
	fb_clr_node.onchange = async() => {
		save.bg_color = fb_clr_node.value.trim();
		await set_save();
	}

	const img_node = document.getElementById("select_bg") as HTMLInputElement
	img_node.addEventListener("input",()=>{
		const reader = new FileReader();
		reader.addEventListener("loadend", async(event) => {
			if(!event.target) return;
			save.bg_img = ''.concat("url(", (event.target.result as string), ")");
			await set_save();
		});
		const image = img_node.files.item(0);
		if(!image) return;
		reader.readAsDataURL(image);
	});
	const delete_bg = document.getElementById("delete_bg") as HTMLInputElement;
	delete_bg.onclick = async() => {
		save.bg_img = null;
		await set_save();
	}
}

/// Shortcuts
let topSites : shortcut[];

async function configure_shortcut_settings(){
	const colors = save.shortcut_col_colors ?? ['bg-primary','bg-danger','bg-success','bg-warning'];

	const shortcut_shape_settings = document.getElementById('shortcut_shape_settings');
	shortcut_shape_settings.addEventListener('change', async(event)=>{
		const input = event.target as HTMLSelectElement;
		switch (true) {
			case input.id.startsWith('shortcut_col_color'):
				colors[input.id.split('_')[3]] = 'bg-' + input.value.trim();
				save.shortcut_col_colors = colors;
				break;
			default:
				save[input.id] = input.value.trim();
				break;
			}
		await set_save();
	});
	const selects = shortcut_shape_settings.getElementsByTagName('select');
	for (const select of selects) {
		switch (select.id) {
			case 'shortcut_transition':
				select.value = save.shortcut_transition ?? 'glow';
				break;
			case 'shortcut_size':
				select.value = save.shortcut_size ?? 'm-0';
				break;
			case 'shortcut_width':
				select.value = save.shortcut_width ?? 'col-sm-3';
				break;
			case 'shortcut_v_align':
				select.value = save.shortcut_v_align ?? 'align-items-center';
				break;
			case 'shortcut_container_h_align':
				select.value = save.shortcut_container_h_align ?? 'justify-content-center';
				break;
			case 'shortcut_container_width':
				select.value = save.shortcut_container_width ?? 'col-md-6';
				break;
			default:
				select.value = save[select.id] ?? select.options[0].value;
				break;
		}
	}
	const shortcut_color_container = document.getElementById('shortcut_color_container') as HTMLDivElement;
	const shortcut_col_color_select = document.createElement('select');
	shortcut_col_color_select.classList.add('col', 'form-select', 'm-1');

	const color_group = document.getElementById('colors').cloneNode(true) as HTMLOptGroupElement;
	color_group.hidden = false;
	shortcut_col_color_select.appendChild(color_group);

	function add_shortcut_col_color(idx : number) {
		const select = shortcut_col_color_select.cloneNode(true) as HTMLSelectElement;

		for (let i = idx; i >= colors.length; i--) {
			colors.push('bg-primary');
		}

		select.value = colors[idx].split('-')[1];

		select.id = 'shortcut_col_color_' + idx; 
		shortcut_color_container.append(select);
	}

	function remove_shortcut_col_color() {
		colors.pop();
		shortcut_color_container.lastChild.remove();
	}

	for (let i = 0; i < colors.length; i++) {
		add_shortcut_col_color(i);
	}

	shortcut_shape_settings.addEventListener('click', async(event)=>{
		const inp = event.target as HTMLInputElement;
			switch (inp.id) {
				case 'add_shortcut_col_color':
					add_shortcut_col_color(colors.length);
					break;
				case 'remove_shortcut_col_color':
					remove_shortcut_col_color();
					break;
				default:
					return;
			}
			await set_save();
	});

	const shortcut_container = document.getElementById("shortcut-settings-container") as HTMLDivElement;

	const suggestions = document.createElement('datalist');
	suggestions.id = 'suggestions';

	topSites = await find_user_sites();
	topSites.forEach(site => {
		const url = document.createElement('option');
		url.value = site.link;
		suggestions.appendChild(url);
	});
	shortcut_container.appendChild(suggestions);

	const shortcut_setting = document.getElementById("shortcut-setting") as HTMLDivElement;
	for (let i = 0; i < save.shortcuts.length; i++) {
		shortcut_container.insertBefore(
			create_shortcut_setting(i, shortcut_setting),
			suggestions
		);
	}
	shortcut_setting.remove();

	let random_recommend_idx = Date.now();

	const add_shortcut_container = document.getElementById('add_shortcut_container');
	add_shortcut_container.addEventListener('click', async(event)=>{
		const inp = event.target as HTMLInputElement;
		let sh : shortcut;
			switch (inp.id) {
				case 'add_shortcut':
					sh = {link: '',name: '',img: ''};
					break;
				case 'add_shortcut_fill':
					sh = topSites[random_recommend_idx++ % topSites.length];
					break;
				default:
					return;
			}
		shortcut_container.appendChild(
			create_shortcut_setting(
				save.shortcuts.push(sh) - 1,
				shortcut_setting
			)
		);
		await set_save();
	});
}

function create_shortcut_setting(id : number, elm : HTMLDivElement) : HTMLDivElement{
	elm = elm.cloneNode(true) as HTMLDivElement;
	const colors = save.shortcut_col_colors ?? ['bg-primary','bg-danger','bg-success','bg-warning'];
	const color = colors[id % colors.length];
	elm.classList.add(color);
	elm.hidden = false;
	let shortcut = save.shortcuts[id] as shortcut;

	if(!shortcut){
		shortcut = {name:'',link:'',img:''};
		save.shortcuts[id] = shortcut;
		set_save();
	}

	const inputs = elm.getElementsByTagName('input');
	for(let i = 0; i < inputs.length; i++){
		const inp = inputs[i];
		switch (inp.id) {
			case node.sh_link:
				inp.value = shortcut.link;
				break;
			case node.sh_name:
				inp.value = shortcut.name;
				break;
		}
	}
	elm.addEventListener('input', async(event)=>{
		const input = event.target as HTMLInputElement;
		switch(input.id){
			case node.sh_link:{
				const link = input.value.trim();
				shortcut.link = link;
				if(link.length == 0){
					shortcut.img = '';
					shortcut.name = '';
				}
				await set_save();
				break;
			}
			case node.sh_name:{
				const name = input.value.trim();
				shortcut.name = name.length > 0 ? name : null;
				await set_save();
				break;
			}
			case node.sh_img:{
				const reader = new FileReader();
				reader.addEventListener("loadend", async(event) => {
					if(!event.target) return;
					shortcut.img = event.target.result as string;
					await set_save();
				});
				const image = input.files.item(0);
				if(!image) return;
				reader.readAsDataURL(image);
				break;
			}
		}
	});
	elm.addEventListener('click', async(event)=>{
		const button = event.target as HTMLButtonElement;
		switch (button.id){
			case node.sh_reset:
				for (let i = 0; i < topSites.length; i++) {
					const site = topSites[i];
					if (site.link == shortcut.link){
						shortcut.img = site.img;
						await set_save();
						return;
					}
				}
				if(shortcut.img == ''){
					return;
				}
				shortcut.img = '';
				await set_save();
				break;
			case node.sh_remove:
				for (let i = 0; i < save.shortcuts.length; i++) {
					if (save.shortcuts[i] == shortcut){
						save.shortcuts.splice(i,1);
						break;
					}
				}
				elm.remove();
				await set_save();
				break;
			case node.sh_default:{
				if(shortcut.link == ''){
					return
				}
				let canvas = document.createElement("canvas");
				const context = canvas.getContext("2d") as CanvasRenderingContext2D;
				canvas.width = 64;
				canvas.height = 64;
				context.fillStyle = "#442288aa";
				context.fillRect(0,0,64,64);
				context.font = "bold 40px monospace";
				context.textAlign = "center";
				context.fillStyle = "white";
				context.textBaseline = "middle";
				context.fillText(shortcut.link.replace('https://','').replace('http://','').replace('www.','').toUpperCase().slice(0,2), canvas.width/2, canvas.height/2);
				shortcut.img = canvas.toDataURL();
				await set_save();
				break;
			}
		}
	});
	return elm;
}

async function find_user_sites() {
    const topSites = await browser.topSites.get({
		limit: 100,
        includeFavicon: true,
		onePerDomain: false,
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

/// Drag & Drop
let draggedItem : HTMLElement = null;
let did_change_place : boolean = false;
let start_id : number = -1;

function configure_drag_and_drop(){	
	function move_shortcut(elm : HTMLElement){
		for (; elm; elm = elm.parentElement) {
			const parent = elm.parentElement;
			if(parent != draggedItem.parentElement){
				continue;
			}		
			if(parent.firstChild == elm){
				parent.insertBefore(draggedItem, parent.firstChild);
			}
			else{
				elm.after(draggedItem);
			}
			did_change_place = true;
			return;
		}
	}

	document.addEventListener('dragstart', (e) => {
		draggedItem = (e.target as HTMLElement).parentElement.parentElement;
		const siblings = draggedItem.parentElement.childNodes;
		for(let i = 0; i < siblings.length; i++){
			if(siblings[i] == draggedItem){
				start_id = i;
				break;
			}
		}
	});

	document.addEventListener('dragover', (e) => {
		e.preventDefault();
		const elm = (e.target as HTMLElement).parentElement.parentElement;
		move_shortcut(elm);
	});

	document.addEventListener('drop', async(e) => {
		e.preventDefault();
		if(did_change_place){
			const parent = draggedItem.parentElement;
			let end_id = -1;
			for(let i = 0; i < parent.childNodes.length; i++){
				if(parent.childNodes[i] == draggedItem){
					end_id = i;
					break;
				}
			}
			if (end_id == -1 || start_id == end_id) return;
			const sh = save.shortcuts[start_id];
			save.shortcuts.splice(start_id, 1);
			save.shortcuts.splice(end_id, 0, sh);
			await set_save();	
		}
	});
	
	document.addEventListener('dragend', () => {
		draggedItem = null;
		did_change_place = false;
	});
}

/// Notes
function configure_note_settings() {
	const notes = get_notes();

	const container = document.getElementById('note_settings') as HTMLDivElement;

	const note_color_container = document.getElementById('note_color_container') as HTMLDivElement;
	const note_col_color_select = document.createElement('select');
	note_col_color_select.classList.add('col', 'form-select', 'm-1');
	
	const color_group = document.getElementById('colors').cloneNode(true) as HTMLOptGroupElement;
	color_group.hidden = false;
	note_col_color_select.appendChild(color_group);

	function add_note(idx : number) {
		const select = note_col_color_select.cloneNode(true) as HTMLSelectElement;

		for (let i = idx; i >= notes.length; i--) {
			notes.push({note:"",color:'bg-primary'});
		}

		select.value = (notes[idx].color ?? 'bg-primary').split('-')[1];

		select.id = node.nt_color + idx; 
		note_color_container.append(select);
	}

	function remove_note() {
		notes.pop();
		note_color_container.lastChild.remove();
	}

	for (let i = 0; i < notes.length; i++) {
		add_note(i);
	}

	container.querySelectorAll('input').forEach(elm => {
		switch(elm.id){
			case 'enable_notes':
				(elm as HTMLInputElement).checked = is_notes_enabled();
				break;
		}
	});

	container.addEventListener('click', async(event)=>{
		const elm = event.target as HTMLInputElement;
		if(elm.id == 'add_note')
			add_note(get_notes().length);
		else if(elm.id =='remove_note')
			remove_note();
		else
			return;
		await set_save();
	});

	container.addEventListener('change', async(event)=>{
		const elm = event.target as HTMLInputElement;
		if(elm.id == 'enable_notes')
			save.is_notes_enabled = elm.checked;
		else if(elm.id.startsWith(node.nt_color)){
			const idx = elm.id.slice(node.nt_color.length);
			const note = notes[idx] as note;
			note.color = 'bg-' + elm.value.trim();
			notes[idx] = note;
			save.notes = notes;
		}
		else
			return;
		await set_save();
	});
}

function is_notes_enabled() : boolean {
	return save.is_notes_enabled ?? true;
}

function get_notes() : note[] {
	return save.notes ?? [
		{note: "", color: "bg-primary"},
		{note: "", color: "bg-danger"},
		{note: "", color: "bg-success"},
		{note: "", color: "bg-warning"},
	];
}

/// Settings Button
function configure_nav_settings() {
	const check = document.getElementById('hide_settings_button') as HTMLInputElement;
	check.checked = save.is_settings_button_hiding ?? false;
	check.addEventListener('change', async() => {
		save.is_settings_button_hiding = check.checked;
		await set_save();
	});
}

/// Clock
function configure_clock_settings(){
	function configure_clock() {
		const clock = document.getElementById('clock_preview') as HTMLHeadingElement;
		clock.classList.remove(...clock.classList);

		const bg_color = save.clock_color ?? 'bg-white';
		const bd_color = save.clock_border_color ?? 'bd-white';
		clock.classList.add("clock", bd_color, bg_color);

		clock.style.fontFamily = save.clock_font ?? "monospace";
		clock.style.fontWeight = save.clock_boldness ?? "bold";

		clock.style.borderStyle = save.clock_border_style ?? "hidden";
		clock.style.borderRadius = (save.clock_border_radius ?? "0") + "px";
		clock.style.borderWidth = (save.clock_border_width ?? "0") + "px";

		const clock_format = save.clock_format ?? 'h:m'; 
		const time_format = save.clock_time_format ?? false; // 12 or 24 hour time format
	
		const date = new Date();
		const hour = date.getHours();

		clock.innerText = clock_format
			.replace('yy',date.getFullYear().toString().slice(2,4))
			.replace('mm',(date.getMonth() + 1).toString().padStart(2, '0'))
			.replace('dd',date.getDate().toString().padStart(2, '0'))
			.replace('h',(!time_format || hour <= 12 ? hour : hour - 12).toString().padStart(2, '0'))
			.replace('m',date.getMinutes().toString().padStart(2, '0'))
			.replace('s',date.getSeconds().toString().padStart(2, '0'))
			.replace('&n','\n');
	}
	configure_clock();
	
	const settings = document.getElementById('clock_settings') as HTMLDivElement;
	settings.querySelectorAll('select , input').forEach(elm => {
		switch(elm.id){
			case 'enable_clock':
				(elm as HTMLInputElement).checked = save.is_clock_enabled ?? true;
				break;
			case 'clock_color':
				const color = document.getElementById('colors').cloneNode(true) as HTMLOptGroupElement;
				color.hidden = false;
				elm.appendChild(color);
				(elm as HTMLSelectElement).value = (save.clock_color ?? 'bg-white').split('-')[1];
				break;
			case 'clock_border_color':
				const border_color = document.getElementById('colors').cloneNode(true) as HTMLOptGroupElement;
				border_color.hidden = false;
				elm.appendChild(border_color);
				(elm as HTMLSelectElement).value = (save.clock_border_color ?? 'bg-white').split('-')[1];
				break;
			case 'clock_boldness':
				(elm as HTMLInputElement).checked = (save.clock_boldness ?? "bold") == "bold";
				break;
			case 'clock_time_format':
				(elm as HTMLSelectElement).value = save.clock_time_format ?? false ? 'true' : 'false';
				break;
			default:
				(elm as HTMLInputElement).value = save[elm.id] ?? (elm as HTMLInputElement).value;
				break;
		}
	});
	settings.addEventListener('change', async(event)=>{
		const id = (event.target as HTMLElement).id;
		switch (id) {
			case 'enable_clock':
				save.is_clock_enabled = (event.target as HTMLInputElement).checked;
				break;
			case 'clock_time_format':
				save.clock_time_format = (event.target as HTMLSelectElement).value == 'true';
				break;
			case 'clock_boldness':
				save.clock_boldness = (event.target as HTMLInputElement).checked ? "bold" : "normal";
				break
			case 'clock_color':
				save.clock_color = 'bg-' + (event.target as HTMLSelectElement).value.trim(); 
				break;
			case 'clock_border_color':
				save.clock_border_color = 'bd-' + (event.target as HTMLSelectElement).value.trim();
				break;
			default:
				save[id] = (event.target as HTMLSelectElement).value.trim();
				break;
		}
		await set_save();
		configure_clock();
	});
}

/// Currencies
function configure_currency_settings(){
	const national_node = document.getElementById("national-currencies") as HTMLOptGroupElement;
	const crypto_node = document.getElementById("crypto-currencies") as HTMLOptGroupElement;

	const national = national_node.cloneNode(true) as HTMLOptGroupElement;
	const crypto = crypto_node.cloneNode(true) as HTMLOptGroupElement;
	const color_group = document.getElementById('colors').cloneNode(true) as HTMLOptGroupElement;
	national_node.remove();
	crypto_node.remove();
	
	national.hidden = false;
	crypto.hidden = false;
	color_group.hidden = false;
	
	const currencies = get_currencies();

	const container = document.getElementById('currency_setting');
	const elements = Array.from(
		container.querySelectorAll('select, input')
	) as (HTMLInputElement | HTMLSelectElement)[];
	
	for (let i = 0; i < elements.length; i++) {
		const elm = elements[i];
		switch (elm.id){
			case 'enable_api':
				(elm as HTMLInputElement).checked = save.is_currency_rates_enabled ?? true;
				break;
			case 'currency_container_color':
				elm.appendChild(color_group);
				elm.value = (save.currency_container_color ?? 'bg-primary').split('-')[1];
				break;
			default:
				elm.appendChild(national.cloneNode(true));
				elm.appendChild(crypto.cloneNode(true));
				if(elm.id == 'base_currency')
					elm.value = save.base_currency ?? 'TRY';
				else{
					const idx = elm.id.split('_')[2];
					elm.value = currencies[idx].name;
				}
				break;
		}
	}
	container.addEventListener('change', async(event)=>{
		const elm = event.target as HTMLInputElement | HTMLSelectElement;
		switch (elm.id) {
			case 'enable_api':
				save.is_currency_rates_enabled = (elm as HTMLInputElement).checked;
				break;
			case 'currency_container_color':
				save.currency_container_color = 'bg-' + elm.value.trim();
				break;
			case 'base_currency':
				save.base_currency = elm.value.trim();
				for (let i = 0; i < 3; i++) {
					save.currencies[i].rate = '-';
				}
				break;
			default:{
				const idx = elm.id.split('_')[2];
				const cr = currencies[idx] as currency;
				cr.name = elm.value.trim();
				cr.rate = '-';
				save.currencies = currencies;
				break;
			}
		}
		await set_save();
	});
}

function get_currencies() : currency[]{
	return save.currencies ?? [
		{name:'USD',rate:'-'},
		{name:'EUR',rate:'-'},
		{name:'GBP',rate:'-'},
	];
}

/// Firefox Watermark
function configure_firefox_watermark_settings() {
	const check = document.getElementById('enable_firefox_watermark') as HTMLInputElement;
	check.checked = save.is_firefox_watermark_enabled ?? true;
	check.addEventListener('change', async()=>{
		save.is_firefox_watermark_enabled = check.checked;
		await set_save();
	});
	const color = document.getElementById('firefox_color') as HTMLSelectElement;
	const opt = document.getElementById('colors').cloneNode(true) as HTMLOptGroupElement;
	opt.hidden = false;
	color.appendChild(opt);
	color.value = (save.firefox_watermark_color ?? 'bg-orange').split('-')[1];
	color.addEventListener('change', async()=>{
		save.firefox_watermark_color = 'bg-' + color.value.trim();
		await set_save();
	})
}

/// Import / Export
function configure_import_export(){
	const parent = document.getElementById('import_export_settings') as HTMLDivElement;
	parent.addEventListener('click', (event)=>{
		const target = event.target as HTMLElement;
		switch (target.id) {
			case "import-settings":{
				const fileInput = document.createElement("input");
				fileInput.type = "file";
				fileInput.click();
				fileInput.addEventListener('change', handleFileSelect);

				function handleFileSelect(event) {
					const file = event.target.files[0];

					if (!file) {
						console.error('No file selected');
						return;
					}

					const reader = new FileReader();

					reader.onload = async(e) => {
						try {
							const jsonData = JSON.parse(e.target.result as string);

							await browser.storage.local.clear();
							localStorage.clear();
							save = jsonData;
							await set_save();
							location.href = "index.html";
						} 
						catch (error) {
							console.error('Error parsing JSON: ', error);
						}
						fileInput.remove();
					};
					reader.readAsText(file);
				}
				break;
			}
			case "export-settings":{
				const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(save, null, 2));

				const a = document.createElement('a');
				a.href = data;
				a.download = 'settings.json';

				parent.appendChild(a);
				a.click();
				a.remove();
				break;
			}
		}
	});
}

/// Nav Button
let countdown = 4;
function configure_home_button(){
	const removeButton = document.getElementById("remove-settings-button") as HTMLButtonElement;
	removeButton.addEventListener('click', async() => {
		if (--countdown == 0){
			save.is_settings_disabled = true;
			await set_save();
			location.href = 'index.html';
		}
		removeButton.innerText = countdown.toString();
	});
	document.getElementById('nav-button').addEventListener('click',()=>{
		if(!saving)
			location.href = 'index.html';
	});
}

/// Translations
function translate() : void {
	const translations = [
		{
			"name": "settings",
			"tr": "Ayarlar",
			"en": "Settings",
			"de": "Einstellungen",
			"es": "Ajustes",
		},
		{
			"name": "delete-link",
			"tr": "Kısayollarını sürükleyerek yerini değiştirebilirsin.",
			"en": "You can drag a shortcut to change its place.",
			"de": "Du kannst eine Verknüpfung ziehen, um ihren Platz zu ändern.",
			"es": "Puedes arrastrar un acceso directo para cambiar su ubicación.",
		},
		{
			"name": "image-link",
			"tr": "Kısayol ikonunu resim dosyası yükleyerek ayarlayabilirsin.",
			"en": "Set a custom link icon by uploading an image file.",
			"de": "Legen Sie ein benutzerdefiniertes Verknüpfungssymbol fest, indem Sie eine Bilddatei hochladen.",
			"es": "Establece un ícono de enlace personalizado subiendo un archivo de imagen.",
		},
		{
			"name": "shortcut-settings",
			"tr": "Kısayol Ayarları",
			"en": "Shortcut Settings",
			"de": "Verknüpfungseinstellungen",
			"es": "Configuración de Accesos Directos"
		},
		{
			"name": "shortcut-size",
			"tr": "Boyut",
			"en": "Size",
			"de": "Größe",
			"es": "Tamaño"
		},
		{
			"name": "shortcut-container-settings",
			"tr": "Kısayol Konteyner Ayarları",
			"en": "Shortcut Container Settings",
			"de": "Verknüpfungscontainer-Einstellungen",
			"es": "Configuración del contenedor de accesos directos"
		},
		{
			"name": "shortcut-color-settings",
			"tr": "Kısayol Sütun Renkleri",
			"en": "Shortcut Column Colors",
			"de": "Verknüpfungsspaltenfarben",
			"es": "Colores de Columnas de Acceso Directo"
		},		
		{
			"name": "shortcut-v-align",
			"tr": "Dikey Hizalanma",
			"en": "Vertical Alignment",
			"de": "Vertikale Ausrichtung",
			"es": "Alineación vertical"
		},
		{
			"name": "shortcut-h-align",
			"tr": "Yatay Hizalanma",
			"en": "Horizontal Alignment",
			"de": "Horizontale Ausrichtung",
			"es": "Alineación horizontal"
		},
		{
			"name": "shortcut-width",
			"tr": "Genişlik",
			"en": "Width",
			"de": "Breite",
			"es": "Ancho"
		},
		{
			"name": "shortcut-shape",
			"tr": "Şekil",
			"en": "Shape",
			"de": "Form",
			"es": "Forma"
		},
		{
			"name": "square",
			"tr": "Kare",
			"en": "Square",
			"de": "Quadrat",
			"es": "Cuadrado"
		},
		{
			"name": "blue",
			"tr": "Mavi",
			"en": "Blue",
			"de": "Blau",
			"es": "Azul"
		},
		{
			"name": "red",
			"tr": "Kırmızı",
			"en": "Red",
			"de": "Rot",
			"es": "Rojo"
		},
		{
			"name": "green",
			"tr": "Yeşil",
			"en": "Green",
			"de": "Grün",
			"es": "Verde"
		},
		{
			"name": "yellow",
			"tr": "Sarı",
			"en": "Yellow",
			"de": "Gelb",
			"es": "Amarillo"
		},
		{
			"name": "black",
			"tr": "Siyah",
			"en": "Black",
			"de": "Schwarz",
			"es": "Negro"
		},
		{
			"name": "dark",
			"tr": "Koyu",
			"en": "Dark",
			"de": "Dunkel",
			"es": "Oscuro"
		},
		{
			"name": "white",
			"tr": "Beyaz",
			"en": "White",
			"de": "Weiß",
			"es": "Blanco"
		},
		{
			"name": "gray",
			"tr": "Gri",
			"en": "Gray",
			"de": "Grau",
			"es": "Gris"
		},
		{
			"name": "lime",
			"tr": "Limon Yeşili",
			"en": "Lime",
			"de": "Limettengrün",
			"es": "Verde Lima"
		},
		{
			"name": "orange",
			"tr": "Turuncu",
			"en": "Orange",
			"de": "Orange",
			"es": "Naranja"
		},
		{
			"name": "violet",
			"tr": "Menekşe",
			"en": "Violet",
			"de": "Violett",
			"es": "Violeta"
		},
		{
			"name": "scarletred",
			"tr": "Alaca Kırmızı",
			"en": "Scarlet Red",
			"de": "Scharlachrot",
			"es": "Rojo Escarlata"
		},
		{
			"name": "aqua",
			"tr": "Aqua",
			"en": "Aqua",
			"de": "Aqua",
			"es": "Aqua"
		},
		{
			"name": "navyblue",
			"tr": "Lacivert",
			"en": "Navy Blue",
			"de": "Marineblau",
			"es": "Azul Marino"
		},
		{
			"name": "transparent",
			"tr": "Saydam",
			"en": "Transparent",
			"de": "Durchsichtig",
			"es": "Transparente"
		},
		{
			"name": "circle",
			"tr": "Daire",
			"en": "Circle",
			"de": "Kreis",
			"es": "Círculo"
		},
		{
			"name": "center",
			"tr": "Orta",
			"en": "Center",
			"de": "Mitte",
			"es": "Centro"
		},
		{
			"name": "top",
			"tr": "Üst",
			"en": "Top",
			"de": "Oben",
			"es": "Arriba"
		},
		{
			"name": "bottom",
			"tr": "Alt",
			"en": "Bottom",
			"de": "Unten",
			"es": "Abajo"
		},
		{
			"name": "left",
			"tr": "Sol",
			"en": "Left",
			"de": "Links",
			"es": "Izquierda"
		},
		{
			"name": "right",
			"tr": "Sağ",
			"en": "Right",
			"de": "Rechts",
			"es": "Derecha"
		},
		{
			"name": "shortcut-transition",
			"tr": "Geçiş Türü",
			"en": "Transition Type",
			"de": "Übergangstyp",
			"es": "Tipo de Transición"
		},
		{
			"name": "none",
			"tr": "Hiçbiri",
			"en": "None",
			"de": "Keiner",
			"es": "Ninguno"
		},
		{
			"name": "move_down",
			"tr": "Aşağı hareket et",
			"en": "Move down",
			"de": "Nach unten bewegen",
			"es": "Mover hacia abajo"
		},
		{
			"name": "move_up",
			"tr": "Yukarı hareket et",
			"en": "Move up",
			"de": "Nach oben bewegen",
			"es": "Mover hacia arriba"
		},
		{
			"name": "scale_down",
			"tr": "Küçült",
			"en": "Scale down",
			"de": "Verkleinern",
			"es": "Reducir tamaño"
		},
		{
			"name": "scale_up",
			"tr": "Büyüt",
			"en": "Scale up",
			"de": "Vergrößern",
			"es": "Aumentar tamaño"
		},
		{
			"name": "spin",
			"tr": "Döndür",
			"en": "Spin",
			"de": "Drehen",
			"es": "Girar"
		},
		{
			"name": "rotate",
			"tr": "Çevir",
			"en": "Rotate",
			"de": "Rotieren",
			"es": "Rotar"
		},
		{
			"name": "glow",
			"tr": "Parla",
			"en": "Glow",
			"de": "Leuchten",
			"es": "Resplandor"
		},
		{
			"name": "reset-default-icon-info",
			"tr": "Yenile: Bu işlem mevcut kısayol simgesini silecek ve ana sayfayı açtığınızda simge API'sından bir simge almaya çalışacak.\nVarsayılan: Bu işlem, temel bir yedek simgeyi kısayol simgesi olarak ayarlar. Bu seçeneği, simge API pikselli bir simge döndürürse kullanabilirsiniz.",
			"en": "Reset: This will delete the current shortcut icon and when you open the main page will try to fetch a icon from the icon API.\nDefault: This will set a basic fallback icon as the shortcut icon. You can use this if the icon API returns a pixelated icon.",
			"de": "Zurücksetzen: Dies löscht das aktuelle Verknüpfungssymbol, und wenn Sie die Hauptseite öffnen, wird versucht, ein Symbol vom Symbol-API abzurufen.\nStandard: Hiermit wird ein einfaches Ersatzsymbol als Verknüpfungssymbol festgelegt. Sie können dies verwenden, wenn das Symbol-API ein pixeliges Symbol zurückgibt.",
			"es": "Restablecer: Esto eliminará el icono de acceso directo actual y, al abrir la página principal, intentará obtener un icono de la API de iconos.\nPredeterminado: Esto establecerá un icono básico de respaldo como el icono de acceso directo. Puede utilizar esto si la API de iconos devuelve un icono pixelado.",
		},
		{
			"name": "rate-update-info",
			"tr": "Döviz değerleri günlük yenilenir.",
			"en": "Currency rates update daily.",
			"de": "Währungskurse werden täglich aktualisiert.",
			"es": "Los tipos de cambio de divisas se actualizan diariamente.",
		},
		{
			"name": "enable-api-label",
			"tr": "Kur bilgilerini göster",
			"en": "Enable currency rates",
			"de": "Währungskurse aktivieren",
			"es": "Habilitar tasas de cambio de divisas",
		},
		{
			"name": "enable-clock-label",
			"tr": "Saati etkinleştir",
			"en": "Enable clock",
			"de": "Uhr aktivieren",
			"es": "Habilitar reloj",
		},
		{
			"name": "enable-firefox-label",
			"tr": "Firefox logosunu etkinleştir",
			"en": "Enable firefox icon",
			"de": "Firefox logo aktivieren",
			"es": "Habilitar icono de Firefox",
		},
		{
			"name": "color-label",
			"tr": "Renk",
			"en": "Color",
			"de": "Farbe",
			"es": "Color",
		},
		{
			"name": "enable-notes-label",
			"tr": "Notları etkinleştir",
			"en": "Enable notes",
			"de": "Notizen aktivieren",
			"es": "Habilitar notas",
		},
		{
			"name": "bg-settings",
			"tr": "Arkaplan Ayarları",
			"en": "Background Settings",
			"de": "Hintergrund Einstellungen",
			"es": "Configuración de fondo",
		},
		{
			"name": "bg-fallback-color-label",
			"tr": "Arkaplan Rengi",
			"en": "Background Color",
			"de": "Hintergrund Farbe",
			"es": "Color de fondo",
		},
		{
			"name": "bg-img-upload-info",
			"tr": "Arka planı değiştirmek için bir resim dosyası yükleyebilirsiniz. \nNot: Yüklenen resim ne kadar büyükse o kadar yavaş açılır. Bu yüzden eğer resim çok yavaş yüklenirse, resmi sıkıştırmayı deneyebilirsiniz.",
			"en": "You can upload a image file to change the background.\nNote : The larger the uploaded image, the slower it loads. Therefore, if the image loads very slowly, you can try compressing the image.",
			"de": "Sie können eine Bilddatei hochladen, um den Hintergrund zu ändern. \nHinweis: Je größer das hochgeladene Bild ist, desto langsamer lädt es. Daher können Sie, wenn das Bild sehr langsam lädt, versuchen, das Bild zu komprimieren.",
			"es": "Puedes subir un archivo de imagen para cambiar el fondo. \nNota: Cuanto más grande sea la imagen cargada, más lento se carga. Por lo tanto, si la imagen se carga muy lentamente, puedes intentar comprimir la imagen.",
		},
		{
			"name": "currency-api-refresh-warning",
			"tr": "Eğer seçtiğiniz kur güncellenmezse bir kaç saniye beklemeyi deneyin.",
			"en": "If currency types do not update, try waiting a few seconds.",
			"de": "Wenn sich die Währungskurse nicht aktualisieren, versuchen Sie es nach einigen Sekunden erneut.",
			"es": "Si las tasas de cambio de divisas no se actualizan, intente esperar unos segundos.",
		},
		{
			"name": "base-currency-label",
			"tr": "Ana para birimini seç",
			"en": "Select base currency",
			"de": "Wählen Sie die Basiswährung",
			"es": "Selecciona la moneda base",
		},
		{
			"name": "currencies-label",
			"tr": "Para birimleri",
			"en": "Currencies",
			"de": "Währungen",
			"es": "Monedas"
		},
		{
			"name": "link-label",
			"tr": "Link",
			"en": "URL",
			"de": "URL",
			"es": "URL",
		},
		{
			"name": "name-label",
			"tr": "İsim",
			"en": "Name",
			"de": "Name",
			"es": "Nombre",
		},
		{
			"name": "github-repo-info",
			"tr": "Herhangi bir hata ile karşılaşırsanız veya yeni bir özellik isterseniz, buradan yeni bir issue açabilirsiniz:",
			"en": "If you encounter any issues or have a feature request, you can open a new issue at:",
			"de": "Wenn Sie auf einen Fehler gestoßen sind oder ein neues Feature wünschen, können Sie hier eine neue Issue öffnen:",
			"es": "Si has encontrado algún error o deseas una nueva función, puedes abrir un issue aquí:",
		},
		{
			"name": "national-currencies",
			"tr": "Ulusal para birimleri",
			"en": "National currencies",
			"de": "Nationale Währungen",
			"es": "Monedas nacionales",
		},
		{
			"name": "crypto-currencies",
			"tr": "Kripto para birimleri",
			"en": "Cryptocurrencies",
			"de": "Kryptowährungen",
			"es": "Criptomonedas",
		},
		{
			"name": "hide-settings-button",
			"tr": "Ayarlar Butonunu Gizle",
			"en": "Hide Settings Button",
			"de": "Einstellungsbutton verbergen",
			"es": "Ocultar botón de configuración"
		},		
		{
			"name": "remove-settings-button-info",
			"tr": "Bu ayar ofis veya okul bilgisayarları için kullanılabilir. Çalışma veya okula ait bazı URL'leri veya bir arkaplanı ayarlayabilir ve kullanıcı bunları değiştiremez. Ayrıca araç çubuğu eylemini devre dışı bırakır.",
			"en": "This setting could be used for office or school computers. You can set up some work or school related URLs or a background, and the user will not be able to change it. This will also disable the toolbar action.",
			"de": "Diese Einstellung kann für Büro- oder Schulcomputer verwendet werden. Sie können einige Arbeits- oder schulbezogene URLs oder einen Hintergrund einrichten, den der Benutzer nicht ändern kann. Dadurch wird auch die Symbolleistenaktion deaktiviert.",
			"es": "Esta configuración se puede utilizar para computadoras de oficina o escuela. Puede establecer algunas URL o un fondo relacionados con el trabajo o la escuela, y el usuario no podrá cambiarlo. Esto también desactivará la acción de la barra de herramientas."
		},	
		{
			"name": "remove-settings-button-label",
			"tr": "Ana Sayfadaki Ayarlar Butonunu Kaldır",
			"en": "Remove Settings Button From Main Page",
			"de": "Einstellungsbutton von der Hauptseite entfernen",
			"es": "Eliminar botón de configuración de la página principal"
		},
		{
			"name": "import-export-settings",
			"tr": "Ayarları Dışa Aktar / İçe Aktar",
			"en": "Export / Import Settings",
			"de": "Einstellungen exportieren / importieren",
			"es": "Exportar / Importar Configuraciones"
		},		
		{
			"name": "save-info",
			"tr": "Lütfen bekleyiniz...",
			"en": "Please Wait...",
			"de": "Bitte Warten...",
			"es": "Por favor, espere...",
		},		
		{
			"name": "clock-boldness-label",
			"tr": "Kalın",
			"en": "Bold",
			"de": "Fett",
			"es": "Negrita"
		},
		{
			"name": "clock-border-width-label",
			"tr": "Çerçeve Kalınlığı",
			"en": "Border Width",
			"de": "Rahmenbreite",
			"es": "Ancho del Borde"
		},
		{
			"name": "clock-border-radius-label",
			"tr": "Çerçeve Yarıçapı",
			"en": "Border Radius",
			"de": "Rahmenradius",
			"es": "Radio del Borde"
		},
		{
			"name": "clock_style_hidden",
			"tr": "Gizli",
			"en": "Hidden",
			"de": "Versteckt",
			"es": "Oculto"
		},
		{
			"name": "clock_style_solid",
			"tr": "Çizgi",
			"en": "Solid",
			"de": "Durchgezogen",
			"es": "Sólido"
		},
		{
			"name": "clock_style_dotted",
			"tr": "Noktalı",
			"en": "Dotted",
			"de": "Gepunktet",
			"es": "Punteado"
		},
		{
			"name": "clock_style_double",
			"tr": "Çift Çizgi",
			"en": "Double",
			"de": "Doppelt",
			"es": "Doble"
		},
		{
			"name": "clock_style_dashed",
			"tr": "Kesikli Çizgi",
			"en": "Dashed",
			"de": "Gestrichelt",
			"es": "Guión"
		}
	];

	const lang = ["en", "tr", "es", "de"].find(lang => navigator.language.startsWith(lang)) || "en";
	for (const dict of translations) {
		const name = dict.name;
		const translation = dict[lang];
		if(name == "note-input"){
			for (const element of document.getElementsByName(name)){
				(element as HTMLInputElement).placeholder = translation;
			}
		}
		else if(["base-currency-label", "crypto-currencies", "national-currencies", "shortcut-shape", "shortcut-size", "shortcut-transition", "shortcut-width", "shortcut-v-align", "shortcut-h-align", "color-label"].includes(name)){
			for (const element of document.getElementsByName(name)){
				(element as HTMLOptGroupElement).label = translation;
			}
		}
		else if(["delete-bg-button", "set-default-button"].includes(name)){
			for (const element of document.getElementsByName(name)){
				(element as HTMLInputElement).value = translation;
			}
		}
		else{
			for (const element of document.getElementsByName(name)){
				element.innerText = translation;
			}
		}
	}
}