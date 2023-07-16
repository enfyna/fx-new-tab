const currency_api = "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/";
const img_api = "https://icon.horse/icon/";
const elm_id = [
    "cur_name_",
    "cur_",
    "cur_select_",
    "select_link_",
    "select_name_",
    "select_img_",
    "link_",
    "name_",
    "img_",
];
window.addEventListener("load", ready);
function ready() {
    translate();
    configure_shortcuts();
    if (is_currency_rates_enabled()) {
        update_currency_html_elements();
        if (did_a_day_pass()) {
            get_updated_rates();
        }
        ;
    }
    ;
    config_settings_page();
}
function get_shortcuts() {
    let shortcuts = localStorage.getItem("shortcuts");
    if (shortcuts != null) {
        return JSON.parse(shortcuts);
    }
    ;
    let temp = [
        { name: "", img: "", link: "https://github.com" },
        { name: "", img: "", link: "https://youtube.com/" },
        { name: "", img: "", link: "https://chat.openai.com" },
        { name: "", img: "", link: "https://mail.google.com/mail/u/0/#inbox" },
        { name: "", img: "", link: "https://discord.com" },
        { name: "", img: "", link: "https://web.telegram.org/a/" },
        { name: "", img: "", link: "https://web.whatsapp.com/" },
        { name: "", img: "", link: "https://amazon.com" },
    ];
    localStorage.setItem("shortcuts", JSON.stringify(temp));
    return temp;
}
function configure_shortcuts() {
    let shortcuts = get_shortcuts();
    for (let i = 0; i < 8; i++) {
        var shortcut = shortcuts[i];
        var a_node = document.getElementById(elm_id[6] + i);
        var a_node_parent = a_node.parentElement;
        if (shortcut.link == "") {
            a_node_parent.hidden = true;
            continue;
        }
        ;
        if (shortcut.name == "") {
            shortcut.name = shortcut.link.replace("https://", "").replace("http://", "").split("/")[0];
        }
        ;
        a_node_parent.hidden = false;
        a_node.href = shortcut.link;
        var name_node = (document.getElementById(elm_id[7] + i));
        var img_node = (document.getElementById(elm_id[8] + i));
        name_node.innerHTML = shortcut.name;
        img_node.src = shortcut.img;
        if (shortcut.img == "" || img_node.naturalHeight < 64 || img_node.naturalWidth < 64) {
            get_favicon_from_url(shortcut.link, i);
            continue;
        }
        ;
    }
    ;
}
function get_favicon_from_url(url, idx) {
    if (navigator.onLine == false) {
        console.log("No internet connection. Cant get favicons.");
        return;
    }
    ;
    url = url.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0];
    let foreignImg = new Image();
    foreignImg.crossOrigin = "anonymous";
    foreignImg.src = img_api + url;
    foreignImg.addEventListener("load", imgload);
    function imgload() {
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
        canvas.width = foreignImg.width;
        canvas.height = foreignImg.height;
        context.drawImage(foreignImg, 0, 0);
        var image = canvas.toDataURL();
        var img_node = document.getElementById(elm_id[8] + idx);
        img_node.src = image;
        let shortcuts = get_shortcuts();
        shortcuts[idx.toString()]["img"] = image;
        localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
    }
}
function did_a_day_pass() {
    let date = localStorage.getItem("date");
    localStorage.setItem("date", new Date().getTime().toString());
    if (date == null) {
        return true;
    }
    ;
    let saved_date = new Date(parseInt(date));
    if (new Date().getTime() - saved_date.getTime() > 86400000) {
        return true;
    }
    ;
    return false;
}
function is_currency_rates_enabled() {
    let key = localStorage.getItem("is_currency_rates_enabled");
    if (key == null || key == "" || key == "false") {
        hide_currency_elements(true);
        return false;
    }
    hide_currency_elements(false);
    return true;
}
function get_base_currency() {
    let currency = localStorage.getItem("base_currency");
    if (currency == null) {
        currency = "TRY";
        localStorage.setItem("base_currency", currency);
    }
    ;
    return currency;
}
function get_currencies() {
    let currencies = localStorage.getItem("currencies");
    if (currencies == null) {
        let def = [
            { name: "USD", rate: "0.0" },
            { name: "EUR", rate: "0.0" },
            { name: "GBP", rate: "0.0" }
        ];
        localStorage.setItem("currencies", JSON.stringify(def));
        return def;
    }
    ;
    return JSON.parse(currencies);
}
function get_updated_rates() {
    if (navigator.onLine == false) {
        console.log("No internet connection. Cant get currency rates.");
        return;
    }
    const base_currency = get_base_currency().toLocaleLowerCase();
    const currencies = get_currencies();
    const req = new XMLHttpRequest();
    req.onreadystatechange = get;
    req.open("GET", currency_api.concat(base_currency, ".min.json"));
    req.send();
    function get() {
        if (this.readyState == 4 && this.status == 200) {
            const res = JSON.parse(this.responseText);
            for (let i = 0; i < 3; i++) {
                let currency = currencies[i];
                const updated_rate_string = (1.0 / parseFloat(res[base_currency][currency.name.toLocaleLowerCase()])).toFixed(2);
                const updated_rate_float = parseFloat(updated_rate_string);
                update_color(elm_id[1] + i, updated_rate_float - parseFloat(currency.rate));
                currency.rate = updated_rate_string;
            }
            ;
            localStorage.setItem("currencies", JSON.stringify(currencies));
            update_currency_html_elements();
        }
        ;
    }
}
function update_currency_html_elements() {
    const currencies = get_currencies();
    for (let i = 0; i < 3; i++) {
        const currency = currencies[i];
        let cur_node = document.getElementById(elm_id[0] + i);
        cur_node.innerHTML = currency.name;
        let val_node = document.getElementById(elm_id[1] + i);
        val_node.innerHTML = currency.rate;
    }
    ;
}
function hide_currency_elements(set = true) {
    const currency_parent_node = document.getElementById("currencies");
    const childElements = Object.values(currency_parent_node.childNodes);
    for (const child of childElements) {
        child.hidden = set;
    }
    ;
}
const card_class = "card p-2 text-center text-white fw-bold text-nowrap";
function update_color(child_id, diff) {
    const node = document.getElementById(child_id);
    const parent_node = node.parentElement;
    if (parent_node == null)
        return;
    let color = "bg-danger";
    if (diff >= 0) {
        color = "bg-success";
    }
    ;
    parent_node.className = card_class.concat(" ", color);
}
function save() {
    let base_currency_node = document.getElementById("base_currency");
    let base_currency = base_currency_node.value;
    localStorage.setItem("base_currency", base_currency);
    let api_node = document.getElementById("enable_api");
    localStorage.setItem("is_currency_rates_enabled", "" + api_node.checked);
    let currencies = get_currencies();
    let shortcuts = get_shortcuts();
    for (let i = 0; i < 8; i++) {
        if (i < 3) {
            const currency_node = document.getElementById(elm_id[2] + i);
            currencies[i].name = currency_node.value;
        }
        ;
        var shortcut = shortcuts[i];
        const link_node = document.getElementById(elm_id[3] + i);
        const name_node = document.getElementById(elm_id[4] + i);
        const img_node = document.getElementById(elm_id[5] + i);
        if (shortcut.link != link_node.value) {
            shortcut.link = link_node.value.trim();
            if (shortcut.name != name_node.value) {
                shortcut.name = name_node.value.trim();
            }
            else {
                shortcut.name = "";
            }
            ;
            if (img_node.value == "") {
                shortcut.img = "";
                save_shortcuts(shortcuts);
                continue;
            }
            ;
        }
        else {
            shortcut.name = name_node.value;
            var img = img_node.value;
            if (img == "") {
                save_shortcuts(shortcuts);
                continue;
            }
            ;
        }
        ;
        const reader = new FileReader();
        reader.addEventListener("loadend", (event) => {
            if (event.target == null)
                return;
            shortcut.img = event.target.result;
            save_shortcuts(shortcuts);
        });
        var image = img_node.files.item(0);
        if (image == null)
            continue;
        reader.readAsDataURL(image);
    }
    ;
    localStorage.setItem("currencies", JSON.stringify(currencies));
    if (api_node.checked) {
        hide_currency_elements(false);
        get_updated_rates();
    }
    else {
        hide_currency_elements(true);
    }
    ;
}
let check = 0;
function save_shortcuts(shortcuts) {
    if (++check == 8) {
        check = 0;
        localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
        configure_shortcuts();
        config_settings_page();
    }
    ;
}
function config_settings_page() {
    const api_node = document.getElementById("enable_api");
    api_node.checked = is_currency_rates_enabled();
    const base_cur_node = document.getElementById("base_currency");
    base_cur_node.value = get_base_currency();
    const shortcuts = get_shortcuts();
    const currencies = get_currencies();
    for (let i = 0; i < 8; i++) {
        const link_node = document.getElementById(elm_id[3] + i);
        const name_node = document.getElementById(elm_id[4] + i);
        const img_node = document.getElementById(elm_id[5] + i);
        var shortcut = shortcuts[i];
        link_node.value = shortcut.link;
        name_node.value = shortcut.name;
        img_node.value = "";
        if (!(i < 3))
            continue; // only 3 currencies
        const currency_node = document.getElementById(elm_id[2] + i);
        currency_node.value = currencies[i].name;
    }
    ;
    const save_button = document.getElementById("save-button");
    save_button.addEventListener("click", save);
}
function translate() {
    let lang;
    switch (navigator.language.toLowerCase()) {
        case "tr":
        case "tr-tr":
            lang = "tr";
            break;
        default:
            lang = "en";
            break;
    }
    ;
    const translations = [
        {
            "name": "greeting",
            "tr": ["Merhaba!", "Nasılsın?", "Nasıl gidiyor?", "İyi günler!", "Hoş geldin!",],
            "en": ["Hi!", "Hey!", "Hello!", "Hello there!", "Howdy!", "Nice to meet you!", "Welcome!",],
        },
        {
            "name": "motivational",
            "tr": ["Çalışmaya devam et!", "Her adım, hedefe yaklaşmanı sağlar.", "Başarı, pes etmeyenlere gelir.", "Pes etme!", "Zorluklar seni güçlendirir!", "Hatalarından ders al!", "Başarabilirsin!", "Yapmak istediğini gözünde büyütme!", "Başlamak bitirmenin yarısıdır!",],
            "en": ["Keep pushing forward!", "Believe in yourself!", "You can do it!", "Doing things is easier when you start!", "Always try to get better!", "Never give up!", "You've got this!", "Focus on progress, not perfection!", "Learn from your mistakes!", "Success is within reach!"],
        },
        {
            "name": "settings",
            "tr": ["Ayarlar"],
            "en": ["Settings"],
        },
        {
            "name": "delete-link",
            "tr": ["Bir linkin linkini silerek ana menüden kaldırabilirsin."],
            "en": ["Delete shortcut link to remove it from main menu."],
        },
        {
            "name": "image-link",
            "tr": ["Link ikonunu resim dosyası yükleyerek ayarlayabilirsin. (en az 64x64 boyutunda)"],
            "en": ["Set a custom link icon by uploading a image file. (at least 64x64 resolution)"],
        },
        {
            "name": "delete-cookie-warning",
            "tr": ["Bu site için çerezleri silersen ayarların sıfırlanır."],
            "en": ["If you delete cookies for this site all data will revert to the default values."],
        },
        {
            "name": "cookie-info",
            "tr": ["Bu site ayarları kaydetmek için çerez kullanır."],
            "en": ["This site uses cookies to save Settings."],
        },
        {
            "name": "rate-update-info",
            "tr": ["Döviz değerleri günlük yenilenir."],
            "en": ["Currency rates update daily."],
        },
        {
            "name": "enable-api-label",
            "tr": ["Kur bilgilerini göster"],
            "en": ["Enable currency rates"],
        },
        {
            "name": "currency-api-info",
            "tr": ["Döviz değerleri bu API kullanılarak alınmaktadır : https://github.com/fawazahmed0/currency-api"],
            "en": ["Currency rates are provided by this API : https://github.com/fawazahmed0/currency-api"],
        },
        {
            "name": "api-key-info",
            "tr": ["Ana sayfanda 3 tane kurun değerini görmek istiyorsan kullanabilirsin."],
            "en": ["This is a optional feature that adds 3 currency rate info to your main page."],
        },
        {
            "name": "save-button",
            "tr": ["Kaydet"],
            "en": ["Save"],
        },
        {
            "name": "base-currency-label",
            "tr": ["Ana para birimi"],
            "en": ["Base currency"],
        },
        {
            "name": "currencies-label",
            "tr": ["Para birimleri"],
            "en": ["Currencies"],
        },
        {
            "name": "link-label",
            "tr": ["Link"],
            "en": ["Link"],
        },
        {
            "name": "name-label",
            "tr": ["İsim"],
            "en": ["Name"],
        },
    ];
    translations.forEach(dict => {
        document.getElementsByName(dict.name).forEach(element => {
            const list = dict[lang];
            if (list.length > 1) {
                element.innerHTML = list[new Date().getTime() % list.length];
            }
            else {
                element.innerHTML = list[0];
            }
        });
    });
}
//# sourceMappingURL=script.js.map