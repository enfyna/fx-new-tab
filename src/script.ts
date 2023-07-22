interface shortcut_dict {
	name:string;
	link:string;
	img:string;
}
interface shortcut_arr {
    [index:number]:shortcut_dict;
}
interface currencies_dict {
	name:string;
	rate:string;
}
interface currencies_arr {
	[index:number]:currencies_dict;
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
};

window.addEventListener("DOMContentLoaded",ready);

function ready(){
	translate();
	configure_shortcuts();
	if(is_currency_rates_enabled()){
		update_currency_html_elements();
		if(did_a_day_pass()){
			get_updated_rates();
		};
	};
	config_settings_page();
}

function get_shortcuts() : shortcut_arr{
	let shortcuts = localStorage.getItem("shortcuts");
	if(shortcuts != null){
		return JSON.parse(shortcuts) as shortcut_arr;
	};
	let temp : shortcut_arr = [
		{name:"",img:"",link:"https://github.com"},
		{name:"",img:"",link:"https://youtube.com/"},
		{name:"",img:"",link:"https://chat.openai.com"},
		{name:"",img:"",link:"https://mail.google.com/mail/u/0/#inbox"},
		{name:"",img:"",link:"https://discord.com"},
		{name:"",img:"",link:"https://web.telegram.org/a/"},
		{name:"",img:"",link:"https://web.whatsapp.com/"},
		{name:"",img:"",link:"https://amazon.com"},
   	];
	localStorage.setItem("shortcuts",JSON.stringify(temp));
	return temp;
}

function configure_shortcuts(){
	let shortcuts : shortcut_arr = get_shortcuts();
	for (let i = 0; i < 8; i++){
		set_shortcut_node(shortcuts[i], i);
	};
}

function set_shortcut_node(shortcut : shortcut_dict, i : Number){
	var link_node = document.getElementById(node.shortcut.link+i) as HTMLAnchorElement;
	var link_node_parent = link_node.parentElement;
	if(link_node_parent == null) return;
	if(shortcut.link == ""){
		link_node_parent.hidden = true;
		return;
	};
	if(shortcut.name == ""){
		shortcut.name = shortcut.link.replace("https://","").replace("http://","").split("/")[0];
	};
	link_node_parent.hidden = false;
	link_node.href = shortcut.link;
	var name_node = (document.getElementById(node.shortcut.name+i)) as HTMLHeadingElement;
	var img_node = (document.getElementById(node.shortcut.img+i)) as HTMLImageElement;
	name_node.innerHTML = shortcut.name;
	img_node.src = shortcut.img;
	if(shortcut.img == "" || img_node.naturalHeight < 64 || img_node.naturalWidth < 64){
		get_favicon_from_url(shortcut.link,i);
		return;
	};
}

function get_favicon_from_url(url : string, idx : Number){
	if(navigator.onLine == false){
		console.log("No internet connection. Cant get favicons.");
		return;
	};
	url = url.replace("https://","").replace("http://","").replace("www.","").split("/")[0];

	let foreignImg = new Image();

	foreignImg.crossOrigin = "anonymous";
	foreignImg.src =  img_api + url;

	foreignImg.addEventListener("load", imgload);

	function imgload() {
		let canvas = document.createElement("canvas");
		let context = canvas.getContext("2d") as CanvasRenderingContext2D;
		canvas.width = foreignImg.width;
		canvas.height = foreignImg.height;
		context.drawImage(foreignImg, 0, 0);
		var image = canvas.toDataURL();
		var img_node = document.getElementById(node.shortcut.img+idx) as HTMLImageElement;
		img_node.src = image;
		let shortcuts = get_shortcuts();
		shortcuts[idx.toString()]["img"] = image;
		localStorage.setItem("shortcuts",JSON.stringify(shortcuts));
	}
}

function did_a_day_pass() : boolean{
	let date = localStorage.getItem("date");
	localStorage.setItem("date", new Date().getTime().toString());
	if (date == null){
		return true;
	};
	let saved_date = new Date(parseInt(date));
	if(new Date().getTime() - saved_date.getTime() > 86400000){
		return true;
	};
	return false;
}

function is_currency_rates_enabled() : boolean {
	let key = localStorage.getItem("is_currency_rates_enabled");
	if(key == null || key == "" || key == "false"){
		hide_currency_elements(true);
		return false
	}
	hide_currency_elements(false);
	return true;
}

function get_base_currency() : string{
	let currency = localStorage.getItem("base_currency");
	if (currency == null){
		currency = "TRY";
		localStorage.setItem("base_currency",currency);
	};
	return currency;
}

function get_currencies() : currencies_arr {
	let currencies = localStorage.getItem("currencies");
	if (currencies == null){
		let def : currencies_arr = [
			{name:"USD",rate:"0.0"},
			{name:"EUR",rate:"0.0"},
			{name:"GBP",rate:"0.0"}
		];
		localStorage.setItem("currencies",JSON.stringify(def));
		return def;
	};
	return JSON.parse(currencies) as currencies_arr;
}

function get_updated_rates(){
	if(navigator.onLine == false){
		console.log("No internet connection. Cant get currency rates.");
		return;
	}
	const base_currency = get_base_currency().toLocaleLowerCase();
	const currencies = get_currencies();
	const req = new XMLHttpRequest();

	req.onreadystatechange = get;
	req.open(
		"GET",
		currency_api.concat(base_currency,".min.json")
	);
	req.send();
	function get(){
		if (this.readyState == 4 && this.status == 200) {
			const res = JSON.parse(this.responseText);
			for (let i = 0; i < 3; i++) {
				let currency = currencies[i];
				const updated_rate_string = (1.0 / parseFloat(res[base_currency][currency.name.toLocaleLowerCase()])).toFixed(2);
				const updated_rate_float = parseFloat(updated_rate_string);

				update_color(node.currency.value+i, updated_rate_float - parseFloat(currency.rate));
				currency.rate = updated_rate_string;
			};
			localStorage.setItem("currencies", JSON.stringify(currencies));
			update_currency_html_elements();
		};
	}
}

function update_currency_html_elements(){
	const currencies = get_currencies();
	for (let i = 0; i < 3; i++) {
		const currency = currencies[i];
		let cur_node = document.getElementById(node.currency.name+i) as HTMLElement;
		cur_node.innerHTML = currency.name;
		let val_node = document.getElementById(node.currency.value+i) as HTMLElement;
		val_node.innerHTML = currency.rate;
	};
}

function hide_currency_elements(set = true){
	const currency_parent_node = document.getElementById("currencies") as HTMLElement;
	const childElements = Object.values(currency_parent_node.childNodes) as HTMLElement[]
	for (const child of childElements){
		child.hidden = set;
	};
}

const card_class = "card p-2 text-center text-white fw-bold text-nowrap"
function update_color(child_id : string, diff : number){
	const node = document.getElementById(child_id) as HTMLElement;
	const parent_node = node.parentElement;
	if(parent_node == null) return;
	let color = "bg-danger";
	if(diff >= 0){
		color = "bg-success";
	};
	parent_node.className = card_class.concat(" ",color);
}

function save(){
	let base_currency_node = document.getElementById("base_currency") as HTMLInputElement;
	let base_currency = base_currency_node.value;
	localStorage.setItem("base_currency",base_currency);

	let api_node = document.getElementById("enable_api") as HTMLInputElement;
	localStorage.setItem("is_currency_rates_enabled",""+api_node.checked);

	let currencies : currencies_arr = get_currencies();
	let shortcuts : shortcut_arr = get_shortcuts();
	for (let i = 0; i < 8; i++){
		if(i < 3){
			const currency_node = document.getElementById(node.currency.option+i) as HTMLInputElement;
			currencies[i].name = currency_node.value;
		};
		var shortcut : shortcut_dict = shortcuts[i];
		const link_node = document.getElementById(node.shortcut_setting.link+i) as HTMLInputElement;
		const name_node = document.getElementById(node.shortcut_setting.name+i) as HTMLInputElement;
		const img_node = document.getElementById(node.shortcut_setting.img+i) as HTMLInputElement;
		if(shortcut.link != link_node.value){
			shortcut.link = link_node.value.trim();
			if(shortcut.name != name_node.value){
				shortcut.name = name_node.value.trim();
			}else{
				shortcut.name = "";
			};
			if(img_node.value == ""){
				shortcut.img = "";
				save_shortcuts(shortcuts);
				continue;
			};
		}else{
			shortcut.name = name_node.value;
			var img = img_node.value;
			if(img == ""){
				save_shortcuts(shortcuts);
				continue;
			};
		};
		const reader = new FileReader();
			reader.addEventListener("loadend", (event) => {
				if(event.target == null)return;
				shortcut.img = event.target.result as string;
				save_shortcuts(shortcuts);
			});
		var files = img_node.files;
		if(files == null) continue;
		var image = files.item(0);
		if(image == null)continue;
		reader.readAsDataURL(image);
	};
	localStorage.setItem("currencies",JSON.stringify(currencies));
	if(api_node.checked){
		hide_currency_elements(false);
		get_updated_rates();
	}else{
		hide_currency_elements(true);
	};
}

let check = 0;
function save_shortcuts(shortcuts : shortcut_arr) {
	if(++check == 8){
		check = 0;
		localStorage.setItem("shortcuts",JSON.stringify(shortcuts));
		configure_shortcuts();
		config_settings_page();
	};
}

function config_settings_page(){
	const api_node = document.getElementById("enable_api") as HTMLInputElement;
	api_node.checked = is_currency_rates_enabled();

	const base_cur_node = document.getElementById("base_currency") as HTMLInputElement;
	base_cur_node.value = get_base_currency();

	const shortcuts = get_shortcuts();
	const currencies = get_currencies();

	for (let i = 0; i < 8; i++) {
		var shortcut = shortcuts[i];
		var link_setting_node = document.getElementById(node.shortcut_setting.link+i) as HTMLInputElement;
		var name_setting_node = document.getElementById(node.shortcut_setting.name+i) as HTMLInputElement;
		var img_setting_node = document.getElementById(node.shortcut_setting.img+i) as HTMLInputElement;
		name_setting_node.value = shortcut.name;
		link_setting_node.value = shortcut.link;
		img_setting_node.value = "";
		if(!(i < 3)) continue; // only 3 currencies
		const currency_node = document.getElementById(node.currency.option+i) as HTMLInputElement;
		currency_node.value = currencies[i].name;
	};
	const save_button = document.getElementById("save-button") as HTMLInputElement;
	save_button.addEventListener("click",save);
}

function translate() {
	const translations = [
		{
			"name": "greeting",
			"tr": ["Merhaba!", "Nasılsın?", "Nasıl gidiyor?", "İyi günler!", "Hoş geldin!"],
			"en": ["Hi!", "Hey!", "Hello!", "Hello there!", "Howdy!", "Nice to meet you!", "Welcome!"],
			"de": ["Hallo!", "Hey!", "Guten Tag!", "Hallo da!", "Grüß Gott!", "Freut mich, dich kennenzulernen!", "Willkommen!"],
			"es": ["¡Hola!", "¡Hola!", "¡Hola!", "¡Hola!", "¡Hola!", "¡Encantado de conocerte!", "¡Bienvenido!"],
		},
		{
			"name": "motivational",
			"tr": ["Çalışmaya devam et!", "Her adım, hedefe yaklaşmanı sağlar.", "Başarı, pes etmeyenlere gelir.", "Pes etme!", "Zorluklar seni güçlendirir!", "Hatalarından ders al!", "Başarabilirsin!", "Yapmak istediğini gözünde büyütme!", "Başlamak bitirmenin yarısıdır!"],
			"en": ["Keep pushing forward!", "Believe in yourself!", "You can do it!", "Doing things is easier when you start!", "Always try to get better!", "Never give up!", "You've got this!", "Focus on progress, not perfection!", "Learn from your mistakes!", "Success is within reach!"],
			"de": ["Immer weitermachen!", "Glaube an dich selbst!", "Du schaffst das!", "Dinge zu tun ist leichter, wenn du anfängst!", "Versuche immer, besser zu werden!", "Gib niemals auf!", "Du schaffst das!", "Fokussiere dich auf Fortschritt, nicht Perfektion!", "Lerne aus deinen Fehlern!", "Erfolg ist in Reichweite!"],
			"es": ["¡Sigue adelante!", "¡Cree en ti mismo!", "¡Tú puedes hacerlo!", "Hacer las cosas es más fácil cuando empiezas.", "¡Siempre trata de mejorar!", "¡Nunca te rindas!", "¡Tú puedes lograrlo!", "¡Enfócate en el progreso, no en la perfección!", "¡Aprende de tus errores!", "¡El éxito está al alcance!"],
		},
		{
			"name": "settings",
			"tr": ["Ayarlar"],
			"en": ["Settings"],
			"de": ["Einstellungen"],
			"es": ["Ajustes"],
		},
		{
			"name": "delete-link",
			"tr": ["Bir linkin linkini silerek ana menüden kaldırabilirsin."],
			"en": ["Delete shortcut link to remove it from the main menu."],
			"de": ["Entfernen Sie die URL, um sie aus dem Hauptmenü zu löschen."],
			"es": ["Elimina el enlace para quitarlo del menú principal."],
		},
		{
			"name": "image-link",
			"tr": ["Link ikonunu resim dosyası yükleyerek ayarlayabilirsin. (en az 64x64 boyutunda)"],
			"en": ["Set a custom link icon by uploading an image file. (at least 64x64 resolution)"],
			"de": ["Legen Sie ein benutzerdefiniertes Verknüpfungssymbol fest, indem Sie eine Bilddatei hochladen. (mindestens 64x64 Auflösung)"],
			"es": ["Establece un ícono de enlace personalizado subiendo un archivo de imagen. (al menos 64x64 de resolución)"],
		},
		{
			"name": "delete-cookie-warning",
			"tr": ["Bu site için çerezleri silersen ayarların sıfırlanır."],
			"en": ["If you delete cookies for this site, all data will revert to the default values."],
			"de": ["Wenn Sie die Cookies für diese Website löschen, werden alle Daten auf die Standardwerte zurückgesetzt."],
			"es": ["Si eliminas las cookies de este sitio, todos los datos volverán a los valores predeterminados."],
		},
		{
			"name": "cookie-info",
			"tr": ["Bu site ayarları kaydetmek için çerez kullanır."],
			"en": ["This site uses cookies to save settings."],
			"de": ["Diese Website verwendet Cookies, um Einstellungen zu speichern."],
			"es": ["Este sitio utiliza cookies para guardar la configuración."],
		},
		{
			"name": "rate-update-info",
			"tr": ["Döviz değerleri günlük yenilenir."],
			"en": ["Currency rates update daily."],
			"de": ["Währungskurse werden täglich aktualisiert."],
			"es": ["Los tipos de cambio de divisas se actualizan diariamente."],
		},
		{
			"name": "enable-api-label",
			"tr": ["Kur bilgilerini göster"],
			"en": ["Enable currency rates"],
			"de": ["Währungskurse aktivieren"],
			"es": ["Habilitar tasas de cambio de divisas"]
		},
		{
			"name": "currency-api-info",
			"tr": ["Döviz değerleri bu API kullanılarak alınmaktadır: https://github.com/fawazahmed0/currency-api"],
			"en": ["Currency rates are provided by this API: https://github.com/fawazahmed0/currency-api"],
			"de": ["Währungskurse werden von dieser API bereitgestellt: https://github.com/fawazahmed0/currency-api"],
			"es": ["Las tasas de cambio de divisas son proporcionadas por esta API: https://github.com/fawazahmed0/currency-api"],
		},
		{
			"name": "api-key-info",
			"tr": ["Ana sayfanda 3 tane kurun değerini görmek istiyorsan kullanabilirsin."],
			"en": ["This is an optional feature that adds 3 currency rate info to your main page."],
			"de": ["Dies ist eine optionale Funktion, die 3 Währungskursinformationen auf Ihrer Hauptseite hinzufügt."],
			"es": ["Esta es una característica opcional que agrega información de 3 tasas de cambio de divisas a tu página principal."],
		},
		{
			"name": "save-button",
			"tr": ["Kaydet"],
			"en": ["Save"],
			"de": ["Speichern"],
			"es": ["Guardar"],
		},
		{
			"name": "base-currency-label",
			"tr": ["Ana para birimini seç"],
			"en": ["Select base currency"],
			"de": ["Wählen Sie die Basiswährung"],
			"es": ["Selecciona la moneda base"],
		},
		{
			"name": "currencies-label",
			"tr": ["Para birimleri"],
			"en": ["Currencies"],
			"de": ["Währungen"],
			"es": ["Monedas"],
		},
		{
			"name": "link-label",
			"tr": ["Link"],
			"en": ["Link"],
			"de": ["URL"],
			"es": ["Enlace"],
		},
		{
			"name": "name-label",
			"tr": ["İsim"],
			"en": ["Name"],
			"de": ["Name"],
			"es": ["Nombre"],
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
			lang = "de";
			break;
	};
	translations.forEach(dict => {
		document.getElementsByName(dict.name).forEach(element => {
			const list : Array<string> = dict[lang];
			if(list.length > 1){
				element.innerHTML = list[new Date().getTime() % list.length];
			}else{
				element.innerHTML = list[0];
			}
		});
	});
}