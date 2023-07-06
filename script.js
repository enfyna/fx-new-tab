const currency_api = "https://api.freecurrencyapi.com/v1/latest";
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
    if (get_api_key() != "") {
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
        { "link": "https://github.com/enfyna" },
        { "link": "https://chat.openai.com/" },
        { "link": "http://ekampus.btu.edu.tr" },
        { "link": "https://obs.btu.edu.tr/" },
        { "link": "https://mail.google.com/mail/u/0/#inbox" },
        { "link": "https://ask.godotengine.org/questions" },
        { "link": "https://web.whatsapp.com/" },
        { "link": "https://www.doviz.com/" },
    ];
    temp.forEach(dict => {
        dict["name"] = "";
        dict["img"] = "";
    });
    localStorage.setItem("shortcuts", JSON.stringify(temp));
    return temp;
}
function configure_shortcuts() {
    let shortcut = get_shortcuts();
    for (let i = 0; i < 8; i++) {
        var link = shortcut[i]["link"];
        var name = shortcut[i]["name"];
        var a_node = document.getElementById(elm_id[6].concat(i.toString()));
        if (a_node === null)
            continue;
        if (a_node.parentElement === null)
            continue;
        if (link == "") {
            // if shortcut has no link hide it from main menu
            a_node.parentElement.hidden = true;
            continue;
        }
        ;
        if (name == "") {
            // if shortcut has no name write the link
            name = link.replace("https://", "").replace("http://", "").split("/")[0];
        }
        ;
        a_node.parentElement.hidden = false;
        a_node.href = link;
        var name_node = (document.getElementById(elm_id[7] + i));
        var img_node = (document.getElementById(elm_id[8] + i));
        name_node.innerHTML = name;
        img_node.src = shortcut[i]["img"];
        if (shortcut[i]["img"] == null || shortcut[i]["img"] == "") {
            // if link has no icon try to get it
            get_favicon_from_url(link, i);
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
    url = url.replace("https://", "").replace("http://", "").split("/")[0];
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
        let shortcut = get_shortcuts();
        shortcut[idx.toString()]["img"] = image;
        localStorage.setItem("shortcuts", JSON.stringify(shortcut));
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
function get_api_key() {
    let key = localStorage.getItem("API_KEY");
    if (key == "") {
        hide_currency_elements(true);
        return "";
    }
    hide_currency_elements(false);
    return key;
}
function get_base_currency() {
    let currency = localStorage.getItem("base_currency");
    if (currency == null) {
        currency = "TRY"; // Default Value
        localStorage.setItem("base_currency", currency);
    }
    ;
    return currency;
}
function get_currencies() {
    let currencies = localStorage.getItem("currencies");
    if (currencies == null) {
        let def = ["USD", "EUR", "GBP"]; // Default Value
        localStorage.setItem("currencies", JSON.stringify(def));
        return def;
    }
    ;
    return JSON.parse(currencies);
}
function get_currency_rates(currencies) {
    let rates = {};
    for (let i = 0; i < currencies.length; i++) {
        let currency = currencies[i];
        if (localStorage.getItem(currency) != null) {
            let temp = localStorage.getItem(currency);
            rates[currency] = Number.parseFloat(temp);
            continue;
        }
        ;
        rates[currency] = 0.0;
    }
    ;
    return rates;
}
function get_updated_rates() {
    if (navigator.onLine == false) {
        console.log("No internet connection. Cant get currency rates.");
        return;
    }
    const API_KEY = get_api_key();
    const param1 = "base_currency=";
    const param2 = "currencies=";
    const base_currency = get_base_currency();
    const currencies = get_currencies();
    const currency_rates = get_currency_rates(currencies);
    const req = new XMLHttpRequest();
    req.addEventListener("readystatechange", () => {
        if (this.readyState == 4 && this.status == 200) {
            const res = JSON.parse(this.responseText);
            for (let i = 0; i < 3; i++) {
                let currency = currencies[i];
                const updated_rate_string = (1.0 / parseFloat(res["data"][currency])).toFixed(2);
                const updated_rate_float = parseFloat(updated_rate_string);
                update_color(elm_id[1] + i, updated_rate_float - currency_rates[currency]);
                currency_rates[currency] = updated_rate_float;
                localStorage.setItem(currency, updated_rate_string);
            }
            ;
            update_currency_html_elements();
        }
        ;
    });
    req.open("GET", currency_api.concat("?", param1, base_currency, "&", param2, currencies.toString()));
    req.setRequestHeader("apikey", API_KEY);
    req.send();
}
function update_currency_html_elements() {
    const currencies = get_currencies();
    const currency_rates = get_currency_rates(currencies);
    for (let i = 0; i < 3; i++) {
        const currency = currencies[i];
        let cur_node = document.getElementById(elm_id[0] + i);
        cur_node.innerHTML = currency;
        let val_node = document.getElementById(elm_id[1] + i);
        val_node.innerHTML = currency_rates[currency];
    }
    ;
}
function hide_currency_elements(set = true) {
    const currency = document.getElementById("currencies");
    const childElements = Object.values(currency.childNodes);
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
    let apikey_node = document.getElementById("api_key_select");
    localStorage.setItem("API_KEY", apikey_node.value);
    if (apikey_node.value != "") {
        // API_KEY = apikey_node.value;
        hide_currency_elements(false);
        get_updated_rates();
    }
    else {
        // API_KEY = null;
        hide_currency_elements(true);
    }
    ;
    let currencies = ["", "", ""];
    let shortcut = get_shortcuts();
    for (let i = 0; i < 8; i++) {
        if (i < 3) {
            const currency_node = document.getElementById(elm_id[2] + i);
            currencies[i] = currency_node.value;
        }
        ;
        const link_node = document.getElementById(elm_id[3] + i);
        const name_node = document.getElementById(elm_id[4] + i);
        const img_node = document.getElementById(elm_id[5] + i);
        if (shortcut[i]["link"] != link_node.value) {
            // User changed shortcut link
            // Check if he changed name and icon
            // if he didnt we will assume that the unchanged infos
            // were for the old link if he did we will assume that the changed
            // infos are for the new link
            shortcut[i]["link"] = link_node.value;
            if (shortcut[i]["name"] != name_node.value) {
                shortcut[i]["name"] = name_node.value;
            }
            else {
                shortcut[i]["name"] = "";
            }
            ;
            if (img_node.value == "") {
                shortcut[i]["img"] = "";
                save_shortcut(shortcut);
                continue;
            }
            ;
        }
        else {
            shortcut[i]["name"] = name_node.value;
            var img = img_node.value;
            if (img == "") {
                save_shortcut(shortcut);
                continue;
            }
            ;
        }
        ;
        // if user changed link icon we will read it here
        const reader = new FileReader();
        reader.addEventListener("loadend", (event) => {
            if (event.target == null)
                return;
            shortcut[i]["img"] = event.target.result;
            save_shortcut(shortcut);
        });
        if (img_node.files == null)
            continue;
        var image = img_node.files.item(0);
        if (image == null)
            continue;
        reader.readAsDataURL(image);
    }
    ;
    localStorage.setItem("currencies", JSON.stringify(currencies));
}
let check = 0;
function save_shortcut(shortcut) {
    if (++check == 8) {
        check = 0;
        localStorage.setItem("shortcuts", JSON.stringify(shortcut));
        configure_shortcuts();
        config_settings_page();
    }
    ;
}
function config_settings_page() {
    const api_node = document.getElementById("api_key_select");
    api_node.value = get_api_key();
    const base_cur_node = document.getElementById("base_currency");
    base_cur_node.value = get_base_currency();
    const shortcut = get_shortcuts();
    const currencies = get_currencies();
    for (let i = 0; i < 8; i++) {
        const link_node = document.getElementById(elm_id[3] + i);
        const name_node = document.getElementById(elm_id[4] + i);
        const img_node = document.getElementById(elm_id[5] + i);
        link_node.value = shortcut[i]["link"];
        name_node.value = shortcut[i]["name"];
        img_node.value = "";
        if (!(i < 3))
            continue; // only 3 currencies
        const currency_node = document.getElementById(elm_id[2] + i);
        currency_node.value = currencies[i];
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
            "tr": ["Merhaba!", "Nasılsın?", "Nasıl gidiyor?"],
            "en": ["Hi!", "Hello!", "Hello there!"],
        },
        {
            "name": "motivational",
            "tr": ["Başarabilirsin!", "Yapmak istediğini gözünde büyütme!", "Başlamak bitirmenin yarısıdır!",],
            "en": ["You can do it!", "Doing things is easier when you start!", "Always try to get better!",],
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
            "tr": ["Link ikonunu resim dosyası yükleyerek ayarlayabilirsin."],
            "en": ["Set a custom link icon by uploading a image file."],
        },
        {
            "name": "delete-cookie-warning",
            "tr": ["Bu site için çerezleri silersen ayarların sıfırlanır."],
            "en": ["If you delete cookies for this site link and currency data will be lost."],
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
            "name": "api-key-info",
            "tr": ["API key'i \"https://freecurrencyapi.com\" kayıt olup alabilirsin."],
            "en": ["To get your API Key sign in to : https://freecurrencyapi.com .(optional)"],
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
    translations.forEach((dict) => {
        document.getElementsByName(dict.name).forEach((element) => {
            const list = dict[lang];
            element.innerHTML = list[new Date().getTime() % list.length];
        });
    });
}
//# sourceMappingURL=script.js.map