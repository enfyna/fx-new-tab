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
const currency_api = "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/";
const img_api = "https://icon.horse/icon/";
const node = {
	"currency":{
		"name":"currency_name_",
		"value":"currency_value_",
		"option":"currency_option_",
	},
	"shortcut":{
		"link":"link_",
		"name":"name_",
		"img":"img_",
	},
	"shortcut_setting":{
		"link":"select_link_",
		"name":"select_name_",
		"img":"select_img_",
	},
	"note":{
		"note":"note_",
		"input":"note_input_",
	},
};

window.addEventListener("DOMContentLoaded",ready);

function ready(){
	configure_background();
	configure_shortcuts();
	configure_notes();
	configure_currencies();
	translate();
}
/// Background
async function get_bg_image() {
	const bg = await browser.storage.local.get("bg_img");
	if (bg != null) {
		return "url(".concat(bg['bg_img'],")");
	}
	return "none";
}

function get_bg_fallback_color() {
	const bg = localStorage.getItem("bg_fallback");
	if (bg != null && bg != "") {
		return bg;
	}
	return "black";
}

var bodyStyle : CSSStyleDeclaration
function get_document_body_style(){
	if (bodyStyle != null){
		return bodyStyle;
	}
	bodyStyle = document.body.style
	return bodyStyle;
}

function configure_background() {
	get_document_body_style().cssText = `background-size: cover; background-position: center center;`;
	set_bg_color();
	set_bg_image();
	var fb_clr_node = document.getElementById("bg_fallback_color") as HTMLInputElement;
	fb_clr_node.value = get_bg_fallback_color();
	fb_clr_node.onchange = () => {
		localStorage.setItem("bg_fallback",fb_clr_node.value.trim());
		set_bg_color();
	};
	var img_node = document.getElementById("select_bg") as HTMLInputElement
	img_node.addEventListener("input",()=>{
		const reader = new FileReader();
		reader.addEventListener("loadend", (event) => {
			if(event.target == null)return;
			browser.storage.local.set({'bg_img':event.target.result as string})
			.then(()=>set_bg_image());
		});
		var files = img_node.files;
		if(files == null) return;
		var image = files.item(0);
		if(image == null)return;
		reader.readAsDataURL(image);
	});
	var delete_bg = document.getElementById("delete_bg") as HTMLInputElement;
	delete_bg.onclick = () => {
		browser.storage.local.remove('bg_img')
		.then(()=>set_bg_image());
	}
}

async function set_bg_image(){
	get_document_body_style().backgroundImage = await get_bg_image();
}

function set_bg_color(){
	get_document_body_style().backgroundColor = get_bg_fallback_color();
}
/// Shortcuts
function align_shortcuts(){
	var active_shortcuts : number = 0
	var shortcuts = get_shortcut(null);
	for (let i = 0; i < 8; i++){
		if (shortcuts[i].link != ""){
			active_shortcuts += 1
		};
	}
	var container = document.getElementById("ShortcutContainer") as HTMLElement;
	container.classList.replace(
		active_shortcuts <= 4 ? "align-items-start" : "align-items-center",
		active_shortcuts <= 4 ? "align-items-center" : "align-items-start"
	);
}

function configure_shortcuts(){
	align_shortcuts();
	for (let i = 0; i < 8; i++){
		set_shortcut_node(i);
		set_shortcut_setting(i);
	};
}
let shortcuts : shortcut[];
function get_shortcut(idx : number | null){
	if (shortcuts != null)
		return idx == null ? shortcuts : shortcuts[idx];
	let data = localStorage.getItem("shortcuts");
	if(data != null){
		shortcuts = JSON.parse(data) as shortcut[];
	}
	else{
		shortcuts = [
			{name:"",img:"",link:"https://github.com"},
			{name:"",img:"",link:"https://youtube.com/"},
			{name:"",img:"",link:"https://chat.openai.com"},
			{name:"",img:"",link:"https://mail.google.com/mail/u/0/#inbox"},
			{name:"",img:"",link:"https://discord.com"},
			{name:"",img:"",link:"https://web.telegram.org/a/"},
			{name:"",img:"",link:"https://web.whatsapp.com/"},
			{name:"",img:"",link:"https://amazon.com"},
		];
		localStorage.setItem("shortcuts",JSON.stringify(shortcuts));
	};
	return idx == null ? shortcuts : shortcuts[idx];
}

function set_shortcut(shortcut : shortcut, idx : number){
	let arr = get_shortcut(null);
	arr[idx] = shortcut;
	localStorage.setItem("shortcuts",JSON.stringify(arr));
	align_shortcuts();
	set_shortcut_node(idx);
}

function set_shortcut_node(i : number){
	var shortcut : shortcut = get_shortcut(i) as shortcut;
	var link_node = document.getElementById(node.shortcut.link+i) as HTMLAnchorElement;
	var link_node_parent = link_node.parentElement;
	if(link_node_parent == null)
		return;
	if(shortcut.link == ""){
		link_node_parent.hidden = true;
		return;
	};
	if(shortcut.name == ""){
		shortcut.name = shortcut.link.replace("https://","").replace("http://","").split("/")[0];
	};
	var name_node = (document.getElementById(node.shortcut.name+i)) as HTMLHeadingElement;
	name_node.innerText = shortcut.name;
	link_node.href = shortcut.link;
	link_node_parent.hidden = false;

	var img_node = document.getElementById(node.shortcut.img+i) as HTMLImageElement;

	if(shortcut.img == "") {
		get_shortcut_img(shortcut, i, img_node);
		return;
	};
	img_node.src = shortcut.img;
}

function get_shortcut_img(shortcut : shortcut,i : number, node : HTMLImageElement){
	get_favicon_from_url(shortcut.link)
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
				shortcut.img = dataurl;
				node.src = dataurl;
				set_shortcut(shortcut, i);
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
		context.fillText(shortcut.name[0].toUpperCase(), canvas.width/2, canvas.height/2);
		var image = canvas.toDataURL();
		node.src = image;
		shortcut = get_shortcut(i) as shortcut;
		shortcut.img = image;
		set_shortcut(shortcut, i);
	});
}

async function get_favicon_from_url(url : string){
	if(navigator.onLine == false){
		throw new Error("No internet connection. Cant get favicon.");
	};
	if(!url.startsWith("http")){
		throw new Error("Invalid URL format");
	};
	url = url.replace("https://","").replace("http://","").replace("www.","").split("/")[0];
	const response = await Promise.race([
		fetch(img_api.concat(url), {method: "GET", mode: 'cors'}),
		new Promise<Response>((_, reject) =>
		 	setTimeout(() => reject({status:408}), 4000)
		) // I dont like this but it is what it is
	])
	if (response.status == 408){
		throw new Error("HTTP request timed out.")
	}
	if (response.status != 200){
		throw new Error("HTTP request failed");
	}
	return response;
}

function set_shortcut_setting(i : number){
	var shortcut : shortcut = get_shortcut(i) as shortcut;
	var link_node = document.getElementById(node.shortcut_setting.link+i) as HTMLInputElement;
	var name_node = document.getElementById(node.shortcut_setting.name+i) as HTMLInputElement;
	var img_node = document.getElementById(node.shortcut_setting.img+i) as HTMLInputElement;
	link_node.value = shortcut.link;
	name_node.value = (shortcut.name == null || shortcut.name == "") ? shortcut.link.replace("https://","").replace("http://","").split("/")[0] : shortcut.name;
	img_node.value = "";
	link_node.addEventListener("change",() =>{
		var link = link_node.value.trim();
		shortcut.link = link;
		if(link == ""){
			shortcut.img = "";
			shortcut.name = "";
			name_node.value = "";
			img_node.value = "";
		}
		set_shortcut(shortcut,i);
	});
	name_node.addEventListener("change",()=>{
		var name = name_node.value.trim();
		shortcut.name = name;
		set_shortcut(shortcut,i);
	});
	img_node.addEventListener("input",()=>{
		const reader = new FileReader();
		reader.addEventListener("loadend", (event) => {
			if(event.target == null)return;
			shortcut.img = event.target.result as string;
			set_shortcut(shortcut,i);
		});
		var files = img_node.files;
		if(files == null) return;
		var image = files.item(0);
		if(image == null)return;
		reader.readAsDataURL(image);
	});
}
/// Notes
let notes : note[]
function get_notes() : note[] {
	if (notes != null){
		return notes;
	}
	const arr = localStorage.getItem("notes");
	if (arr != null && arr != "") {
		notes = JSON.parse(arr)
		return notes;
	}
	notes = [
		{note: ""},
		{note: ""},
		{note: ""},
		{note: ""},
	];
	localStorage.setItem("notes", JSON.stringify(notes));
	return notes;
}

function configure_notes(){
	var notes : note[] = get_notes();
	for	(let i = 0; i < 4; i++){
		var button : HTMLButtonElement = document.getElementById(node.note.note + i) as HTMLButtonElement;
		button.innerText = notes[i].note;
		var note : HTMLInputElement = document.getElementById(node.note.input + i) as HTMLInputElement;
		button.addEventListener("click", () => {
			var button : HTMLButtonElement = document.getElementById(node.note.note + i) as HTMLButtonElement;
			var note : HTMLInputElement = document.getElementById(node.note.input + i) as HTMLInputElement;
			note.value = button.innerText;
			button.hidden = true;
			note.hidden = false;
			note.focus();
		});
		note.addEventListener("change", () => {
			save_note(i);
		});
		note.addEventListener("blur", () => {
			save_note(i);
		});
	};
}

function save_note(i : number){
	var button : HTMLButtonElement = document.getElementById(node.note.note + i) as HTMLButtonElement;
	var note : HTMLInputElement = document.getElementById(node.note.input + i) as HTMLInputElement;
	note.value = note.value.trim()
	var notes : note[] = get_notes();
	notes[i].note = note.value;
	localStorage.setItem("notes", JSON.stringify(notes));
	button.innerText = note.value;
	note.hidden = true;
	button.hidden = false;
}
/// Currencies
function configure_currencies(){
	if(did_a_day_pass()){
		get_rates().then(() => {
			for (let i = 0; i < 3; i++) {
				reset_currency_rate(i);
				update_currency_node(i);
			};
		}).catch(err=>{console.log(err)});
	}else{
		for (let i = 0; i < 3; i++) {
			update_currency_node(i);
		};
	};

	var national = document.getElementById("national-currencies") as HTMLOptGroupElement;
	var crypto = document.getElementById("crypto-currencies") as HTMLOptGroupElement;

	national = national.cloneNode(true) as HTMLOptGroupElement;
	crypto = crypto.cloneNode(true) as HTMLOptGroupElement;

	national.hidden = false;
	crypto.hidden = false;

	var select_ids = [node.currency.option+0, node.currency.option+1,node.currency.option+2,"base_currency"]

	for (let i = 0; i < select_ids.length; i++) {
		var select = document.getElementById(select_ids[i]) as HTMLSelectElement;
		select.appendChild(national.cloneNode(true));
		select.appendChild(crypto.cloneNode(true));
		if (i == select_ids.length - 1) {
			select.value = get_base_currency();
			select.addEventListener("change",()=>{
				localStorage.setItem("base_currency",select.value);
				currencies_json = null;
				get_rates().then(() => {
					for (let i = 0; i < 3; i++) {
						reset_currency_rate(i);
						update_currency_node(i);
					};
				},err => {console.log(err)});
			});
			continue;
		};
		select.value = (get_currency(i) as currency).name;
		select.addEventListener("change",()=>{
			var select = document.getElementById(node.currency.option + i) as HTMLSelectElement;
			var cr = get_currency(i) as currency;
			cr.name = select.value;
			cr.rate = "-";
			set_currency(cr,i);
			update_currency_node(i)
		});
	}
	var check = document.getElementById("enable_api") as HTMLInputElement
	check.checked = is_currency_rates_enabled();
	hide_currency_elements(!check.checked);
	check.addEventListener("change",()=>{
		hide_currency_elements(!check.checked);
		localStorage.setItem("is_currency_rates_enabled",check.checked.toString());
	});

	var nav = document.getElementById("nav-button") as HTMLButtonElement;
	nav.addEventListener("click",()=>{
		var navbar = document.getElementById("navbar");
		if (navbar.classList.replace("bg-transparent","bg-black"))
			return;
		navbar.classList.replace("bg-black","bg-transparent");
	});
}

function reset_currency_rate(i : number){
	var cr = get_currency(i) as currency;
	cr.rate = "-";
	set_currency(cr,i);
}

function did_a_day_pass() : boolean{
	let saved_date_str : string = localStorage.getItem("date");
	let now : number = Date.now();
	if (saved_date_str == null || now - parseInt(saved_date_str) > 70000000){
		localStorage.setItem("date",now.toString());
		return true;
	};
	return false;
}

function is_currency_rates_enabled() : boolean {
	let key = localStorage.getItem("is_currency_rates_enabled") as string;
	return key == "true" ? true : false;
}
let currencies : currency[]
function get_currency(idx : number | null) : currency[] | currency {
	if (currencies != null){
		return idx == null ? currencies : currencies[idx] as currency;
	}
	var arr : string = localStorage.getItem("currencies");
	if (arr != null){
		currencies = JSON.parse(arr);
	}else{
		currencies = [
			{name:"USD",rate:"-"},
			{name:"EUR",rate:"-"},
			{name:"GBP",rate:"-"}
		];
		localStorage.setItem("currencies",JSON.stringify(currencies));
	};
	return idx == null ? currencies : currencies[idx] as currency;
}

function set_currency(currency : currency, idx : number){
	let arr = get_currency(null);
	arr[idx] = currency;
	localStorage.setItem("currencies",JSON.stringify(arr));
}

function update_currency_node(idx : number)  {
	var name_node = document.getElementById(node.currency.name + idx) as HTMLDivElement;
	var rate_node = document.getElementById(node.currency.value + idx) as HTMLDivElement;

	var currency = get_currency(idx) as currency;

	name_node.innerText = currency.name;
	rate_node.innerText = currency.rate;

	if (currency.rate == "-"){
		get_rates().then(res => {
			currency.rate = (1.0 / res[currency.name.toLowerCase()]).toFixed(2);
			rate_node.innerText = currency.rate;
			set_currency(currency,idx);
			update_currency_node(idx);
		}).catch(err => {console.log(err)});
	};
}

function get_base_currency() : string{
	let currency = localStorage.getItem("base_currency") as string;
	if (currency == null || currency.length == 0) {
		currency = "TRY";
		localStorage.setItem("base_currency",currency);
	};
	return currency;
}

function hide_currency_elements(set : boolean = true) : void {
	const parent = document.getElementById("currencies");
	for (const child of parent.children){
		(child as HTMLElement).hidden = set;
	};
}
var currencies_json : object
function get_rates(){
	return new Promise<object>((resolve, reject) => {
		if(navigator.onLine == false){
			return reject("No internet connection. Cant get currency rates.");
		};
		if(currencies_json != null){
			return resolve(currencies_json);
		}
		const base_currency = get_base_currency().toLowerCase();
		const req : XMLHttpRequest = new XMLHttpRequest();
		req.onreadystatechange = () => {
			if (req.readyState == 4) {
				if(req.status == 200){
					currencies_json = JSON.parse(req.responseText)[base_currency];
					return resolve(currencies_json);
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
			currency_api.concat(base_currency, ".min.json"),
			true
		);
		req.timeout = 5000;
		req.send();
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
			"tr": "Bir kısayolun linkini silerek ana menüden kaldırabilirsin.",
			"en": "Delete shortcut link to remove it from the main menu.",
			"de": "Entfernen Sie die URL, um sie aus dem Hauptmenü zu löschen.",
			"es": "Elimina el URL para quitarlo del menú principal.",
		},
		{
			"name": "image-link",
			"tr": "Kısayol ikonunu resim dosyası yükleyerek ayarlayabilirsin. (en az 64x64 boyutunda)",
			"en": "Set a custom link icon by uploading an image file. (at least 64x64 resolution)",
			"de": "Legen Sie ein benutzerdefiniertes Verknüpfungssymbol fest, indem Sie eine Bilddatei hochladen. (mindestens 64x64 Auflösung)",
			"es": "Establece un ícono de enlace personalizado subiendo un archivo de imagen. (al menos 64x64 de resolución)",
		},
		{
			"name": "delete-cookie-warning",
			"tr": "Bu site için çerezleri silersen ayarların sıfırlanır.",
			"en": "If you delete cookies for this site, all data will revert to the default values.",
			"de": "Wenn Sie die Cookies für diese Website löschen, werden alle Daten auf die Standardwerte zurückgesetzt.",
			"es": "Si eliminas las cookies de este sitio, todos los datos volverán a los valores predeterminados.",
		},
		{
			"name": "cookie-info",
			"tr": "Bu site ayarları kaydetmek için çerez kullanır.",
			"en": "This site uses cookies to save settings.",
			"de": "Diese Website verwendet Cookies, um Einstellungen zu speichern.",
			"es": "Este sitio utiliza cookies para guardar la configuración.",
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
			"name": "bg-color-options",
			"tr": "Arka plan rengini değiştirmek için herhangi bir onaltılık değer (#abc123) veya geçerli bir HTML renk adı kullanabilirsiniz. \nGeçerli HTML renk adlarının listesini buradan bulabilirsiniz: https://www.w3schools.com/tags/ref_colornames.asp",
			"en": "To change the background color you can use any hex value (#abc123) or a valid HTML color name. \nYou can find a list of valid HTML color names from here : https://www.w3schools.com/tags/ref_colornames.asp",
			"de": "Um die Hintergrundfarbe zu ändern, können Sie einen beliebigen Hex-Wert (#abc123) oder einen gültigen HTML-Farbnamen verwenden. \nEine Liste gültiger HTML-Farbnamen finden Sie hier: https://www.w3schools.com/tags/ref_colornames.asp",
			"es": "Para cambiar el color de fondo, puedes usar cualquier valor hexadecimal (#abc123) o un nombre de color HTML válido. \nPuedes encontrar una lista de nombres de colores HTML válidos aquí: https://www.w3schools.com/tags/ref_colornames.asp",
		},
		{
			"name": "bg-img-upload-info",
			"tr": "Arka planı değiştirmek için bir resim dosyası yükleyebilirsiniz. \nNot: Yüklenen tüm resim dosyaları yerel olarak kaydedilir.",
			"en": "You can upload a image file to change the background.\nNote : All uploaded image files are saved locally.",
			"de": "Sie können eine Bilddatei hochladen, um den Hintergrund zu ändern. \nHinweis: Alle hochgeladenen Bilddateien werden lokal gespeichert.",
			"es": "Puedes subir un archivo de imagen para cambiar el fondo. \nNota: Todos los archivos de imagen subidos se guardan localmente.",
		},
		{
			"name": "delete-bg-button",
			"tr": "Sil",
			"en": "Delete",
			"de": "Löschen",
			"es": "Borrar",
		},
		{
			"name": "currency-api-info",
			"tr": "Döviz değerleri bu API kullanılarak alınmaktadır: https://github.com/fawazahmed0/currency-api",
			"en": "Currency rates are provided by this API: https://github.com/fawazahmed0/currency-api",
			"de": "Währungskurse werden von dieser API bereitgestellt: https://github.com/fawazahmed0/currency-api",
			"es": "Las tasas de cambio de divisas son proporcionadas por esta API: https://github.com/fawazahmed0/currency-api",
		},
		{
			"name": "currency-api-refresh-warning",
			"tr": "Eğer seçtiğiniz kur güncellenmezse bir kaç saniye beklemeyi deneyin.",
			"en": "If currency types do not update, try waiting a few seconds.",
			"de": "Wenn sich die Währungskurse nicht aktualisieren, versuchen Sie es nach einigen Sekunden erneut.",
			"es": "Si las tasas de cambio de divisas no se actualizan, intente esperar unos segundos.",
		},
		{
			"name": "api-key-info",
			"tr": "Ana sayfanda 3 tane kurun değerini görmek istiyorsan kullanabilirsin.",
			"en": "This is an optional feature that adds 3 currency rate info to your main page.",
			"de": "Dies ist eine optionale Funktion, die 3 Währungskursinformationen auf Ihrer Hauptseite hinzufügt.",
			"es": "Esta es una característica opcional que agrega información de 3 tasas de cambio de divisas a tu página principal.",
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
			"name": "note-input",
			"tr": "Kısa bir not giriniz",
			"en": "Enter a brief note",
			"de": "Geben Sie eine kurze Notiz ein",
			"es": "Ingresa una nota breve",
		},
		{
			"name": "github-repo-info",
			"tr": "Herhangi bir hata ile karşılaşırsanız veya yeni bir özellik isterseniz, buradan yeni bir issue açabilirsiniz: https://github.com/enfyna/fx-new-tab/issues",
			"en": "If you encounter any issues or have a feature request, you can open a new issue at: https://github.com/enfyna/fx-new-tab/issues",
			"de": "Wenn Sie auf einen Fehler gestoßen sind oder ein neues Feature wünschen, können Sie hier eine neue Issue öffnen: https://github.com/enfyna/fx-new-tab/issues",
			"es": "Si has encontrado algún error o deseas una nueva función, puedes abrir un issue aquí: https://github.com/enfyna/fx-new-tab/issues",
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
		}
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
		else if(elm_name == "base-currency-label" || elm_name == "crypto-currencies" || elm_name == "national-currencies"){
			for (const element of document.getElementsByName(elm_name)){
				(element as HTMLOptGroupElement).label = translation;
			};
		}
		else if(elm_name == "delete-bg-button"){
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