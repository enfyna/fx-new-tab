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
		"option":"currency_option_",
	},
	shortcut_setting:{
		link:"select_link_",
		name:"select_name_",
		img:"select_img_",
		reset:"reset_img_",
		default:"set_back_",
	},
};

let save : object = {}

get_save().then(ready)

async function ready(){
	await get_save();
	configure_shortcut_settings();
	configure_background_settings();
	configure_note_settings();
	configure_currency_settings();
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
function configure_background_settings() {
	var fb_clr_node = document.getElementById("bg_color") as HTMLInputElement;
	fb_clr_node.value = get_bg_color();
	fb_clr_node.onchange = () => {
		save['bg_color'] = fb_clr_node.value.trim();
		set_save();
	};
	var img_node = document.getElementById("select_bg") as HTMLInputElement
	img_node.addEventListener("input",()=>{
		const reader = new FileReader();
		reader.addEventListener("loadend", (event) => {
			if(event.target == null)return;
			save['bg_img'] = event.target.result as string;
			set_save();
		});
		var files = img_node.files;
		if(files == null) return;
		var image = files.item(0);
		if(image == null)return;
		reader.readAsDataURL(image);
	});
	var delete_bg = document.getElementById("delete_bg") as HTMLInputElement;
	delete_bg.onclick = () => {
		save['bg_img'] = null;
		set_save();
	}
}

function get_bg_color() : string{
	return save['bg_color'] ?? 'black';
}

/// Shortcuts
function configure_shortcut_settings(){
	let shape = document.getElementById('shortcut_shape') as HTMLSelectElement;
	shape.value = save['shortcut_shape'] != null ? save['shortcut_shape'] : 'square';
	shape.addEventListener('change',()=>{
		save['shortcut_shape'] = shape.value.trim();
		set_save();
	});
	let translation = document.getElementById('shortcut_transition') as HTMLSelectElement;
	translation.value = save['shortcut_transition'] != null ? save['shortcut_transition'] : 'move_up';
	translation.addEventListener('change',()=>{
		save['shortcut_transition'] = translation.value.trim();
		set_save();
	});
	let size = document.getElementById('shortcut_size') as HTMLSelectElement;
	size.value = save['shortcut_size'] != null ? save['shortcut_size'] : 'm-0';
	size.addEventListener('change',()=>{
		save['shortcut_size'] = size.value.trim();
		set_save();
	});
	const shortcut_container = document.getElementById("shortcut-settings-container") as HTMLDivElement;
	let shortcut_setting = document.getElementById("shortcut-setting") as HTMLDivElement;
	for (let i = 0; i < 12; i++) {
		shortcut_container.appendChild(
			create_shortcut_setting(i, shortcut_setting)
		);
	}
	shortcut_setting.remove();
}

function set_shortcut(shortcut : shortcut, i : number) {
	save['shortcuts'][i] = shortcut;
	set_save();
}

function create_shortcut_setting(id : number, elm : HTMLDivElement) : HTMLDivElement{
	elm = elm.cloneNode(true) as HTMLDivElement;
	const colors = ['bg-primary','bg-danger','bg-success','bg-warning'];
	elm.classList.add(colors[id%4]);
	elm.hidden = false;
	let root = elm.getElementsByTagName('input');
	let shortcut = save['shortcuts'][id] as shortcut;
	if (shortcut.link == null) {
		shortcut = {
			link: '',
			name: '',
			img: ''
		}
	}
	for (let i = 0; i < root.length; i++) {
		let input = root[i] as HTMLInputElement;
		switch(true){
			case input.id.startsWith(node.shortcut_setting.link):
				input.value = shortcut.link;
				input.addEventListener("change",() =>{
					var link = input.value.trim();
					shortcut.link = link;
					if(link.length == 0){
						shortcut.img = "";
						shortcut.name = "";
					}
					set_shortcut(shortcut, id);
				});
				break;
			case input.id.startsWith(node.shortcut_setting.name):
				input.value = shortcut.name;
				input.addEventListener("change",()=>{
					var name = input.value.trim();
					shortcut.name = name.length > 0 ? name : null;
					set_shortcut(shortcut, id);
				});
				break;
			case input.id.startsWith(node.shortcut_setting.img):
				input.addEventListener("input",()=>{
					const reader = new FileReader();
					reader.addEventListener("loadend", (event) => {
						if(event.target == null) return;
						shortcut.img = event.target.result as string;
						set_shortcut(shortcut, id);
					});
					var files = input.files;
					if(files == null) return;
					var image = files.item(0);
					if(image == null)return;
					reader.readAsDataURL(image);
				});
				break;
			case input.id.startsWith(node.shortcut_setting.reset):
				input.addEventListener('click',()=>{
					if(shortcut.img == ''){
						return
					}
					shortcut.img = '';
					set_shortcut(shortcut, id);
				});
				break;
			case input.id.startsWith(node.shortcut_setting.default):
				input.addEventListener('click',()=>{
					if(shortcut.link == ''){
						return
					}
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
					context.fillText((shortcut.name ?? shortcut.link).replace('https://','').replace('http://','').replace('www.','').toUpperCase().slice(0,2), canvas.width/2, canvas.height/2);
					var image = canvas.toDataURL();
					shortcut.img = image;
					set_shortcut(shortcut, id);
				});			
				break;
		}
	}
	return elm;
}

/// Notes
function configure_note_settings() {
	const check = document.getElementById('enable_notes') as HTMLInputElement;
	check.checked = is_notes_enabled();
	check.addEventListener('change', () => {
		save['is_notes_enabled'] = check.checked;
		set_save();
	});
}

function is_notes_enabled() : boolean {
	return save['is_notes_enabled'] ?? false;
}

/// Currencies
function configure_currency_settings(){
	var national = document.getElementById("national-currencies") as HTMLOptGroupElement;
	var crypto = document.getElementById("crypto-currencies") as HTMLOptGroupElement;

	national = national.cloneNode(true) as HTMLOptGroupElement;
	crypto = crypto.cloneNode(true) as HTMLOptGroupElement;

	national.hidden = false;
	crypto.hidden = false;

	get_currencies();

	var select_ids = [node.currency.option+0, node.currency.option+1,node.currency.option+2,"base_currency"]

	for (let i = 0; i < select_ids.length; i++) {
		var select = document.getElementById(select_ids[i]) as HTMLSelectElement;
		select.appendChild(national.cloneNode(true));
		select.appendChild(crypto.cloneNode(true));

		if (i == select_ids.length - 1) {
			select.value = get_base_currency();
			select.addEventListener("change",()=>{
				save['base_currency'] = select.value;
				for (let i = 0; i < 3; i++) {
					save['currencies'][i].rate = '-';
				}
				set_save()
			});
			continue;
		};
		select.value = save['currencies'][i].name;
		select.addEventListener("change",()=>{
			var select = document.getElementById(node.currency.option + i) as HTMLSelectElement;
			var cr = save['currencies'][i] as currency;
			cr.name = select.value;
			cr.rate = "-";
			save['currencies'][i] = cr;
			set_save();
		});
	}
	var check = document.getElementById("enable_api") as HTMLInputElement
	check.checked = is_currency_rates_enabled();
	check.addEventListener("change",()=>{
		save['is_currency_rates_enabled'] = check.checked;
		set_save();
	});
}

function is_currency_rates_enabled() : boolean {
	return save['is_currency_rates_enabled'] ?? false;
}

function get_currencies(){
	if (save['currencies'] != null){
		return save['notes'];
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
			"name": "circle",
			"tr": "Daire",
			"en": "Circle",
			"de": "Kreis",
			"es": "Círculo"
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
			"name": "rotate",
			"tr": "Döndür",
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
			"name": "reset-icon-button",
			"tr": "Yenile",
			"en": "Reset",
			"de": "Zurücksetzen",
			"es": "Restablecer",
		},
		{
			"name": "set-default-button",
			"tr": "Varsayılan",
			"en": "Default",
			"de": "Standard",
			"es": "Predeterminado",
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
			"name": "delete-bg-button",
			"tr": "Sil",
			"en": "Delete",
			"de": "Löschen",
			"es": "Borrar",
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
		else if(elm_name == "base-currency-label" || elm_name == "crypto-currencies" || elm_name == "national-currencies" || elm_name == "shortcut-shape" || elm_name == "shortcut-size" || elm_name == "shortcut-transition"){
			for (const element of document.getElementsByName(elm_name)){
				(element as HTMLOptGroupElement).label = translation;
			};
		}
		else if(elm_name == "delete-bg-button" || elm_name == "reset-icon-button" || elm_name == "set-default-button"){
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