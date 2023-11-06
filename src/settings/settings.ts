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
	clock_color:string;
	clock_format:string;
	clock_time_format:boolean;

	is_firefox_watermark_enabled:boolean;
	firefox_watermark_color:string;
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
}
const node = {
	currency:{
		option:"currency_option_",
	},
	shortcut:{
		link:"select_link_",
		name:"select_name_",
		img:"select_img_",
		reset:"reset_img_",
		default:"set_back_",
		remove:"remove_",
	},
};

let save : save;

get_save().then(ready)

async function ready(){
	configure_shortcut_settings();
	configure_drag_and_drop();
	configure_background_settings();
	configure_clock_settings();
	configure_note_settings();
	configure_currency_settings();
	configure_firefox_watermark_settings();
	configure_home_button();
	translate();
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
	var fb_clr_node = document.getElementById("bg_color") as HTMLInputElement;
	fb_clr_node.value = get_bg_color();
	fb_clr_node.onchange = () => {
		save.bg_color = fb_clr_node.value.trim();
		set_save();
	};
	var img_node = document.getElementById("select_bg") as HTMLInputElement
	img_node.addEventListener("input",()=>{
		const reader = new FileReader();
		reader.addEventListener("loadend", (event) => {
			if(event.target == null) return;
			save.bg_img = ''.concat("url(", (event.target.result as string), ")");
			set_save();
		});
		const image = img_node.files.item(0);
		if(image == null)return;
		reader.readAsDataURL(image);
	});
	var delete_bg = document.getElementById("delete_bg") as HTMLInputElement;
	delete_bg.onclick = () => {
		save.bg_img = null;
		set_save();
	}
}

function get_bg_color() : string{
	return save.bg_color ?? 'black';
}

/// Shortcuts
let topSites : shortcut[];

async function configure_shortcut_settings(){
	const colors = get_shortcut_col_colors();

	const shortcut_shape_settings = document.getElementById('shortcut_shape_settings');
	shortcut_shape_settings.addEventListener('change',(event)=>{
		const input = event.target as HTMLSelectElement;
		switch (true) {
			case input.id.startsWith('shortcut_col_color'):
				colors[input.id.split('_')[3]] = input.value.trim();
				save.shortcut_col_colors = colors;
				break;
			default:
				save[input.id] = input.value.trim();
				break;
			}
		set_save();
	});
	const selects = shortcut_shape_settings.getElementsByTagName('select');
	for (const select of selects) {
		switch (select.id) {
			case 'shortcut_transition':
				select.value = get_shortcut_transition();
				break;
			case 'shortcut_size':
				select.value = get_shortcut_size();
				break;
			case 'shortcut_width':
				select.value = get_shortcut_width();
				break;
			case 'shortcut_v_align':
				select.value = get_shortcut_v_align();
				break;
			case 'shortcut_container_h_align':
				select.value = get_shortcut_container_h_align();
				break;
			case 'shortcut_container_width':
				select.value = get_shortcut_container_width();
				break;
			default:
				select.value = save[select.id] ?? select.options[0].value;
				break;
		}
	}
	const shortcut_color_container = document.getElementById('shortcut_color_container') as HTMLDivElement;
	const shortcut_col_color_select = document.getElementById('shortcut_col_color');

	function add_shortcut_col_color(idx : number) {
		const select = shortcut_col_color_select.cloneNode(true) as HTMLSelectElement;

		for (let i = idx; i >= colors.length; i--) {
			colors.push('bg-primary');
		}

		select.value = colors[idx];

		select.id = select.id + '_' + idx; 
		select.hidden = false;
		shortcut_color_container.append(select);
	}

	function remove_shortcut_col_color() {
		colors.pop();
		shortcut_color_container.lastChild.remove();
	}

	for (let i = 0; i < colors.length; i++) {
		add_shortcut_col_color(i);
	}

	shortcut_shape_settings.addEventListener('click',(event)=>{
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
			set_save();
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

	let shortcut_setting = document.getElementById("shortcut-setting") as HTMLDivElement;
	for (let i = 0; i < save.shortcuts.length; i++) {
		shortcut_container.insertBefore(
			create_shortcut_setting(i, shortcut_setting),
			suggestions
		);
	}
	shortcut_setting.remove();

	let random_recommend_idx = Date.now();

	const add_shortcut_container = document.getElementById('add_shortcut_container');
	add_shortcut_container.addEventListener('click',(event)=>{
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
		set_save();
	});
}

function create_shortcut_setting(id : number, elm : HTMLDivElement) : HTMLDivElement{
	elm = elm.cloneNode(true) as HTMLDivElement;
	const colors = get_shortcut_col_colors()
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
			case node.shortcut.link:
				inp.value = shortcut.link;
				break;
			case node.shortcut.name:
				inp.value = shortcut.name;
				break;
		}
	}
	elm.addEventListener('input',(event)=>{
		const input = event.target as HTMLInputElement;
		switch(input.id){
			case node.shortcut.link:
				var link = input.value.trim();
				shortcut.link = link;
				if(link.length == 0){
					shortcut.img = '';
					shortcut.name = '';
				}
				set_save();
				break;
			case node.shortcut.name:
				var name = input.value.trim();
				shortcut.name = name.length > 0 ? name : null;
				set_save();
				break;
			case node.shortcut.img:
				const reader = new FileReader();
				reader.addEventListener("loadend", (event) => {
					if(event.target == null) return;
					shortcut.img = event.target.result as string;
					set_save();
				});
				var image = input.files.item(0);
				if(image == null) return;
				reader.readAsDataURL(image);
				break;
		}
	});
	elm.addEventListener('click',(event)=>{
		const button = event.target as HTMLButtonElement;
		switch (button.id){
			case node.shortcut.reset:
				for (let i = 0; i < topSites.length; i++) {
					const site = topSites[i];
					if (site.link == shortcut.link){
						shortcut.img = site.img;
						set_save();
						return;
					}
				}
				if(shortcut.img == ''){
					return;
				}
				shortcut.img = '';
				set_save();
				break;
			case node.shortcut.remove:
				for (let i = 0; i < save.shortcuts.length; i++) {
					if (save.shortcuts[i] == shortcut){
						save.shortcuts.splice(i,1);
						break;
					}
				}
				elm.remove();
				set_save();
				break;
			case node.shortcut.default:
				if(shortcut.link == ''){
					return
				}
				let canvas = document.createElement("canvas");
				let context = canvas.getContext("2d") as CanvasRenderingContext2D;
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
				set_save();
				break;
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

function get_shortcut_width() : string {
	return save.shortcut_width ?? 'col-sm-3';
}

function get_shortcut_size() : string {
	return save.shortcut_size ?? 'm-0';
}

function get_shortcut_v_align() : string {
	return save.shortcut_v_align ?? 'align-items-center';
}

function get_shortcut_transition() : string {
	return save.shortcut_transition ?? 'glow';
}

function get_shortcut_col_colors() : string[]{
	return save.shortcut_col_colors ?? ['bg-primary','bg-danger','bg-success','bg-warning'];
}

function get_shortcut_container_h_align() : string{
	return save.shortcut_container_h_align ?? 'justify-content-center';
}

function get_shortcut_container_width() : string{
	return save.shortcut_container_width ?? 'col-md-6';
}

/// Drag & Drop
let draggedItem : HTMLElement = null;
let did_change_place : boolean = false;
let start_id : number = -1;

function configure_drag_and_drop(){	
	function move_shortcut(elm : HTMLElement){
		for (; elm.parentElement; elm = elm.parentElement){		
			if (elm.draggable) {
				if (draggedItem != elm) {
					const parent = elm.parentElement;
					if(parent.firstChild == elm){
						parent.insertBefore(draggedItem, parent.firstChild);
					}
					else{
						elm.after(draggedItem);
					}
					did_change_place = true;
				}
				return;
			}
		}
	}

	document.addEventListener('dragstart', (e) => {
		draggedItem = e.target as HTMLElement;
		var siblings = draggedItem.parentElement.childNodes;
		for(let i = 0; i < siblings.length; i++){
			if(siblings[i] == draggedItem){
				start_id = i;
				break;
			}
		}
	});

	document.addEventListener('dragover', (e) => {
		e.preventDefault();
		move_shortcut(e.target as HTMLElement);
	});

	document.addEventListener('drop', (e) => {
		e.preventDefault();
		if(did_change_place){
			var parent = draggedItem.parentElement;
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
			set_save();	
		}
	});
	
	document.addEventListener('dragend', (e) => {
		draggedItem = null;
		did_change_place = false;
	});
}

/// Notes
function configure_note_settings() {
	const check = document.getElementById('enable_notes') as HTMLInputElement;
	check.checked = is_notes_enabled();
	check.addEventListener('change', () => {
		save.is_notes_enabled = check.checked;
		set_save();
	});
}

function is_notes_enabled() : boolean {
	return save.is_notes_enabled ?? true;
}

/// Clock
function configure_clock_settings(){
	const settings = document.getElementById('clock_settings') as HTMLDivElement;
	settings.querySelectorAll('select , input').forEach(elm => {
		switch(elm.id){
			case 'enable_clock':
				(elm as HTMLInputElement).checked = is_clock_enabled();
				break;
			case 'clock_color':
				(elm as HTMLSelectElement).value = get_clock_color();
				break;
			case 'clock_format':
				(elm as HTMLSelectElement).value = get_clock_format();
				break;
			case 'clock_time_format':
				(elm as HTMLSelectElement).value = get_clock_time_format() ? 'true' : 'false';
				break;
		}
	});
	settings.addEventListener('change',(event)=>{
		const id = (event.target as HTMLElement).id;
		switch (id) {
			case 'enable_clock':
				save.is_clock_enabled = (event.target as HTMLInputElement).checked;
				break;
			case 'clock_time_format':
				save.clock_time_format = (event.target as HTMLSelectElement).value == 'true';
				break;
			default:
				save[id] = (event.target as HTMLSelectElement).value.trim();
				break;
		}
		set_save();
	});
}

function is_clock_enabled() : boolean{
	return save.is_clock_enabled ?? true;
}

function get_clock_color() : string{
	return save.clock_color ?? 'text-white';
}

function get_clock_format() : string {
	return save.clock_format ?? 'h:m';
}

function get_clock_time_format() : boolean {
	return save.clock_time_format ?? false;
}

/// Currencies
function configure_currency_settings(){
	const national_node = document.getElementById("national-currencies") as HTMLOptGroupElement;
	const crypto_node = document.getElementById("crypto-currencies") as HTMLOptGroupElement;

	const national = national_node.cloneNode(true) as HTMLOptGroupElement;
	const crypto = crypto_node.cloneNode(true) as HTMLOptGroupElement;

	national_node.remove();
	crypto_node.remove();

	national.hidden = false;
	crypto.hidden = false;

	const currencies = get_currencies();

	const container = document.getElementById('currency_setting');
	const selects = container.getElementsByTagName('select');
	const inputs = container.getElementsByTagName('input');
	for (let i = 0; i < selects.length + inputs.length; i++) {
		let elm : HTMLInputElement | HTMLSelectElement;
		if(i < selects.length)
			elm = selects[i];
		else
			elm = inputs[i - selects.length];
		switch (elm.id){
			case 'enable_api':
				(elm as HTMLInputElement).checked = is_currency_rates_enabled();
				break;
			case 'currency_container_color':
				elm.value = get_currency_container_color();
				break;
			default:
				elm.appendChild(national.cloneNode(true));
				elm.appendChild(crypto.cloneNode(true));
				if(elm.id == 'base_currency')
					elm.value = get_base_currency();
				else{
					const idx = elm.id.split('_')[2];
					elm.value = currencies[idx].name;
				}
				break;
		}
	}
	container.addEventListener('change',(event)=>{
		const elm = event.target as HTMLInputElement | HTMLSelectElement;
		switch (elm.id) {
			case 'enable_api':
				save.is_currency_rates_enabled = (elm as HTMLInputElement).checked;
				break;
			case 'currency_container_color':
				save.currency_container_color = elm.value.trim();
				break;
			case 'base_currency':
				save.base_currency = elm.value.trim();
				for (let i = 0; i < 3; i++) {
					save.currencies[i].rate = '-';
				}
				break;
			default:
				const idx = elm.id.split('_')[2];
				var cr = currencies[idx] as currency;
				cr.name = elm.value.trim();
				cr.rate = '-';
				save.currencies = currencies;
				break;
		}
		set_save();
	});
}

function is_currency_rates_enabled() : boolean {
	return save.is_currency_rates_enabled ?? true;
}

function get_currencies() : currency[]{
	return save.currencies ?? [
		{name:'USD',rate:'-'},
		{name:'EUR',rate:'-'},
		{name:'GBP',rate:'-'},
	];
}

function get_base_currency() : string{
	return save.base_currency ?? 'TRY';
}

function get_currency_container_color() : string{
	return save.currency_container_color ?? 'bg-primary';
}

/// Firefox Watermark
function configure_firefox_watermark_settings() {
	const check = document.getElementById('enable_firefox_watermark') as HTMLInputElement;
	check.checked = is_firefox_watermark_enabled();
	check.addEventListener('change',()=>{
		save.is_firefox_watermark_enabled = check.checked;
		set_save();
	});
	const color = document.getElementById('firefox_color') as HTMLSelectElement;
	color.value = get_firefox_watermark_color();
	color.addEventListener('change',()=>{
		save.firefox_watermark_color = color.value.trim();
		set_save();
	})
}

function get_firefox_watermark_color() : string{
	return save.firefox_watermark_color ?? 'text-warning';
}

function is_firefox_watermark_enabled() : boolean{
	return save.is_firefox_watermark_enabled ?? true;
}

/// Nav Button
function configure_home_button(){
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
			"name": "shortcut-col-color",
			"tr": "Sütun Rengi",
			"en": "Column Color",
			"de": "Spaltenfarbe",
			"es": "Color de Columna"
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
			"name": "save-info",
			"tr": "Lütfen bekleyiniz...",
			"en": "Please Wait...",
			"de": "Bitte Warten...",
			"es": "Por favor, espere...",
		}
	];
	let lang : string;
	switch (navigator.language.toLowerCase().split('-')[0]){
		case 'tr':
			lang = 'tr';
			break;
		case 'de':
			lang = 'de';
			break;
		case 'es':
			lang = 'es';
			break;
		default:
			lang = 'en';
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
		else if(elm_name == "base-currency-label" || elm_name == "crypto-currencies" || elm_name == "national-currencies" || elm_name == "shortcut-shape" || elm_name == "shortcut-size" || elm_name == "shortcut-transition" || elm_name == "shortcut-col-color" || elm_name == "shortcut-width" || elm_name == "shortcut-v-align" || elm_name == "shortcut-h-align" || elm_name == "color-label"){
			for (const element of document.getElementsByName(elm_name)){
				(element as HTMLOptGroupElement).label = translation;
			};
		}
		else if(elm_name == "delete-bg-button" || elm_name == "set-default-button"){
			for (const element of document.getElementsByName(elm_name)){
				(element as HTMLInputElement).value = translation;
			};
		}
		else{
			for (const element of document.getElementsByName(elm_name)){
				element.innerText = translation;
			};
		};
	};
}