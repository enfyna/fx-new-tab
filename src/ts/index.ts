export = {};

const currency_api = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/';
const img_api = 'https://icon.horse/icon/';
interface save {
    bg_img: string;
    bg_color: string;

    shortcuts: shortcut[];
    shortcut_shape: string;
    shortcut_width: string;
    shortcut_min_width: string;
    shortcut_v_align: string;
    shortcut_size: string;
    shortcut_transition: string;
    shortcut_borderless: boolean;
    shortcut_col_colors: string[];
    shortcut_container_h_align: string;
    shortcut_container_width: string;

    is_autoshort_enabled: boolean;

    notes: note[];
    is_notes_enabled: boolean;

    currencies: currency[];
    base_currency: string;
    is_currency_rates_enabled: boolean;
    date: number;
    currency_container_color: string;

    is_clock_enabled: boolean;
    clock_font: string;
    clock_color: string;
    clock_format: string;
    clock_boldness: string;
    clock_border_color: string;
    clock_border_style: string;
    clock_border_width: string;
    clock_border_radius: string;
    clock_time_format: boolean;
    clock_dark_bg: boolean;

    is_firefox_watermark_enabled: boolean;
    firefox_watermark_color: string;

    is_settings_disabled: boolean;
    is_settings_button_hiding: boolean;
}
interface shortcut {
    name: string;
    link: string;
    img: string;
}
interface currency {
    name: string;
    rate: string;
}
interface note {
    note: string;
    color: string;
}

enum node {
    nt_note = "nt_nt_",
    nt_input = "nt_input_",
}


let save: save;
let using_local_save: boolean = true;
const start = Date.now();

get_save().then(ready);

function ready() {
    configure_shortcuts();
    set_background();
    if (is_currency_rates_enabled() || is_notes_enabled() || is_clock_enabled()) {
        configure_notes();
        configure_currencies();
        configure_clock();
    }
    else {
        center_shortcuts();
    }
    configure_firefox_watermark();
    set_settings_button();
    translate();
    if (!using_local_save)
        set_local_save();
    console.info('time:' + (Date.now() - start).toString());
}

/// Save
async function get_save() {
    save = JSON.parse(localStorage.getItem('save')) as save;
    if (!save) {
        using_local_save = false;
        save = await browser.storage.local.get(null) as save;
    }
    else {
        console.info('ok!');
    }
}

function set_local_save() {
    try {
        localStorage.setItem('save', JSON.stringify(save));
    }
    catch {
        console.error('Caching cant be used!\nExceeded 5MB limit.');
        console.info('\
To optimize loading times through caching, consider the following steps:\n\
1) Compress high-resolution background images to reduce their size.\n\
2) Remove unnecessary shortcuts if you have an excessive number of them.\n\
3) Increase the localStorage storage limit by adjusting the value of \"dom.storage.default_quota\" in about:config. Please note: Increasing the localStorage storage limit using \"dom.storage.default_quota\" in about:config will affect all websites. Be cautious when adjusting this setting."\
		');
        localStorage.clear();
    }
}

/// Background
function set_background() {
    document.body.style.cssText += `
		background-image: ${save.bg_img ?? 'none'};
		background-color: ${save.bg_color ?? '#033633'};
	`;
}

/// Shortcuts
async function configure_shortcuts() {
    if (!save.shortcuts) {
        const load_text = document.getElementById('loading') as HTMLDivElement;
        load_text.innerText = 'Finding Shortcuts Please Wait...';
        save.shortcuts = await find_user_sites();
        await browser.storage.local.set(save);
        localStorage.clear();
        load_text.innerText = '';
    }
    const container_h_align = save.shortcut_container_h_align ?? 'justify-content-center';
    const container_v_align = save.shortcut_v_align ?? 'align-items-center';

    const container = document.getElementById('ShortcutContainer') as HTMLDivElement;
    container.classList.add(
        save.shortcut_container_width ?? 'col-6',
        container_h_align, container_v_align,
    );
    container.parentElement.classList.add(
        container_h_align, container_v_align,
    );

    const base_shortcut = container.firstChild as HTMLAnchorElement;
    base_shortcut.classList.add(
        save.shortcut_width ?? 'col-3',
        save.shortcut_size ?? 'p-2',
        save.shortcut_min_width ?? null,
    );

    const base_div = base_shortcut.firstChild as HTMLDivElement;
    base_div.classList.add(
        save.shortcut_transition ?? 'glow',
        save.shortcut_borderless ? 'border-0' : null
    );

    const is_circle = save.shortcut_shape == 'rounded-circle';
    if (is_circle) {
        const name = base_div.getElementsByTagName('h7')[0] as HTMLDivElement;
        name.remove();
    }

    const img = base_div.getElementsByTagName('img')[0] as HTMLImageElement;
    img.classList.add(save.shortcut_shape ?? 'rounded-3');
    base_div.classList.add(save.shortcut_shape ?? 'rounded-3');


    const colors = save.shortcut_col_colors ?? [
        'bg-primary', 'bg-danger', 'bg-success', 'bg-warning'
    ];

    for (let i = 0; i < save.shortcuts.length; i++) {
        const sh_data: shortcut = save.shortcuts[i];
        if (!sh_data || sh_data.link.length == 0)
            continue;

        const sh = base_shortcut.cloneNode(true) as HTMLAnchorElement;
        sh.href = sh_data.link;

        const sh_div = sh.firstChild as HTMLDivElement;

        const color = colors[i % colors.length];
        sh_div.classList.add(
            color, 'bd-' + color.split("-")[1],
        );

        if (!is_circle) {
            const name = sh_div.getElementsByTagName('h7')[0] as HTMLDivElement;
            if (sh_data.name)
                name.innerText = sh_data.name;
            else {
                name.hidden = true;
            }
        }
        container.appendChild(sh);

        const img = sh_div.getElementsByTagName('img')[0] as HTMLImageElement;
        if (sh_data.img.length == 0) {
            get_shortcut_img(i, img);
        }
        else {
            img.src = sh_data.img;
        }
    }
    base_shortcut.remove();

    if (!(save.is_autoshort_enabled ?? false)) {
        container.classList.remove('invisible')
    }
    else {
        setTimeout(() => {
            autoshort()
            container.classList.remove('invisible')
        }, 1)

        function autoshort() {
            let width = parseInt(save.shortcut_container_width.split('-')[1]) - 1
            while (container.offsetHeight + 100 > screen.height && save.shortcut_container_width != 'col-1') {
                let current_width = save.shortcut_container_width;
                save.shortcut_container_width = 'col-' + width.toString()
                width -= 1
                container.classList.replace(current_width, save.shortcut_container_width)
            }
            console.info("autoshort:", save.shortcut_container_width)
        }
    }
}

async function find_user_sites() {
    const topSites = await browser.topSites.get({
        limit: 8,
        includeFavicon: true,
        onePerDomain: true,
    });
    const shortcuts: shortcut[] = [];

    topSites.forEach(site => {
        const shortcut: shortcut = {
            name: site.title,
            link: site.url,
            img: site.favicon ?? '',
        };
        shortcuts.push(shortcut);
    });

    if (shortcuts.length == 0) {
        // If the user's browsing history contains 
        // no shortcuts, add the repo URL.
        // This ensures that when a user installs the addon 
        // for the first time, the main page is not empty.
        const shortcut: shortcut = {
            name: 'Github Repo',
            link: 'https://github.com/enfyna/fx-new-tab',
            img: '',
        };
        shortcuts.push(shortcut);
    }

    return shortcuts;
}

async function get_shortcut_img(i: number, node: HTMLImageElement) {
    try {
        const response = await get_favicon_from_url(save.shortcuts[i].link)

        const img_type = response.headers.get("Content-Type");
        if (img_type == 'image/svg+xml') {
            throw new Error('Cant display SVG file');
        }
        const blob = await response.blob()
        const b64 = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext("2d");
            context.drawImage(img, 0, 0);
            const dataurl = canvas.toDataURL(img_type);
            save.shortcuts[i].img = dataurl;
            node.src = dataurl;
        };
        img.src = b64;
    } catch (error) {
        console.error(error);
        // We couldnt get a favicon from the api
        // so we will try to create a basic replacement
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d") as CanvasRenderingContext2D;
        canvas.width = 64;
        canvas.height = 64;
        context.fillStyle = "#442288aa";
        context.fillRect(0, 0, 64, 64);
        context.font = "bold 40px monospace";
        context.textAlign = "center";
        context.fillStyle = "white";
        context.textBaseline = "middle";
        context.fillText(save.shortcuts[i].link.replace("https://", "").replace("http://", "").replace("www.", "").toUpperCase().slice(0, 2), canvas.width / 2, canvas.height / 2);
        const image = canvas.toDataURL();
        node.src = image;
        save.shortcuts[i].img = image;
    }
    await browser.storage.local.set(save);
    localStorage.clear();
}

async function get_favicon_from_url(url: string) {
    if (navigator.onLine == false) {
        throw new Error("No internet connection. Cant get favicon.");
    }
    if (!url.startsWith("http")) {
        throw new Error("Invalid URL format");
    }
    url = url.split('/')[2];
    const response = await Promise.race([
        fetch(img_api.concat(url), { method: "GET", mode: 'cors' }),
        new Promise<Response>((_, reject) =>
            setTimeout(() => reject({ status: 408 }), 4000)
        )
    ]);
    if (response.status == 408) {
        throw new Error("HTTP request timed out.")
    }
    if (response.status != 200) {
        throw new Error("HTTP request failed");
    }
    return response;
}

function center_shortcuts() {
    document.getElementById('ShortcutContainer').parentElement.classList.replace('col-md-8', 'col-md-12');
    document.getElementById('NCContainer').remove();
}

/// Notes
function get_notes(): note[] {
    return save.notes ?? [
        { note: "", color: "bg-primary" },
        { note: "", color: "bg-danger" },
        { note: "", color: "bg-success" },
        { note: "", color: "bg-warning" },
    ];
}

function is_notes_enabled(): boolean {
    return save.is_notes_enabled ?? true;
}

function configure_notes() {
    if (!is_notes_enabled()) {
        return
    }
    const notes: note[] = get_notes();

    const container = document.getElementById('notes') as HTMLDivElement;
    const note = document.getElementById('note') as HTMLDivElement;

    for (let i = 0; i < notes.length; i++) {
        const new_note = note.cloneNode(true) as HTMLDivElement;
        const button = new_note.getElementsByTagName('button')[0];
        const input = new_note.getElementsByTagName('textarea')[0];

        input.id = node.nt_input + i;
        button.id = node.nt_note + i;
        button.classList.add(notes[i].color ?? 'bg-primary');

        button.innerText = notes[i].note;
        button.hidden = false;

        input.addEventListener('blur', note_interaction);
        input.addEventListener('keydown', note_interaction);
        container.append(new_note);
    }
    container.addEventListener('change', note_interaction);
    container.addEventListener('click', note_interaction);

    async function note_interaction(event: Event) {
        const elm = event.target as HTMLElement;
        if (elm.id.startsWith(node.nt_note)) {
            const index = elm.id.slice(node.nt_note.length);
            const input = document.getElementById(node.nt_input + index) as HTMLInputElement;
            input.value = elm.innerText;
            input.hidden = false;
            input.focus();
            elm.hidden = true;
        }
        else if (elm.id.startsWith(node.nt_input)) {
            if (event.type == 'click') return;
            if (event instanceof KeyboardEvent && event.key != 'Enter') return;
            elm.hidden = true;
            const index = elm.id.slice(node.nt_input.length);
            const button = document.getElementById(node.nt_note + index) as HTMLButtonElement;
            const new_note = (elm as HTMLInputElement).value.trim();
            button.innerText = new_note;
            notes[index].note = new_note;
            save.notes = notes;
            await browser.storage.local.set(save);
            localStorage.clear();
            button.hidden = false;
        }
    }
    container.classList.replace('d-none', 'd-list');
    note.remove();
}

/// Currencies
function get_currencies(): currency[] {
    return save.currencies ?? [
        { name: 'USD', rate: '-' },
        { name: 'EUR', rate: '-' },
        { name: 'GBP', rate: '-' },
    ];
}

function is_currency_rates_enabled(): boolean {
    return save.is_currency_rates_enabled ?? true;
}

function did_a_day_pass(): boolean {
    return Date.now() - (save.date ?? 0) > 43200000;
}

async function configure_currencies() {
    if (!is_currency_rates_enabled()) {
        return;
    }
    const currencies = get_currencies();

    // Update the currency if a day has passed
    // or if we have reset the currency values
    if (did_a_day_pass() || currencies.some(currency => currency.rate === '-')) {
        try {
            const rates = await get_rates();
            for (let i = 0; i < 3; i++) {
                const currency = currencies[i];
                currency.rate = (1.0 / rates[currency.name.toLowerCase()]).toFixed(2);
            }
            save.currencies = currencies;
            save.date = Date.now();
            await browser.storage.local.set(save);
            localStorage.clear();
        }
        catch (err) {
            console.error(err);
        }
    }
    const currency_container = document.getElementById('currencies');

    const card_nodes = currency_container.getElementsByClassName('card');
    const name_nodes = currency_container.getElementsByTagName('h5');
    const rate_nodes = currency_container.getElementsByTagName('p');

    const color = save.currency_container_color ?? 'bg-primary';

    for (let i = 0; i < 3; i++) {
        const currency = currencies[i];
        card_nodes[i].classList.add(color);

        name_nodes[i].innerText = currency.name;
        rate_nodes[i].innerText = currency.rate;
    }

    currency_container.classList.replace('d-none', 'd-list');
}

function get_rates() {
    return new Promise<object>((resolve, reject) => {
        if (navigator.onLine == false) {
            return reject("No internet connection. Cant get currency rates.");
        }
        const base_currency = save.base_currency ?? 'TRY'.toLowerCase();
        const req: XMLHttpRequest = new XMLHttpRequest();
        req.onreadystatechange = () => {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    const res = JSON.parse(req.responseText)[base_currency];
                    return resolve(res);
                } else {
                    return reject("HTTP request failed");
                }
            }
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

/// Clock
function is_clock_enabled(): boolean {
    return save.is_clock_enabled ?? true;
}

function configure_clock() {
    if (!is_clock_enabled()) {
        return;
    }
    const clock = document.getElementById('clock') as HTMLHeadingElement;

    const bg_color = save.clock_color ?? 'bg-white';
    const bd_color = save.clock_border_color ?? 'bd-white';
    clock.classList.add(bg_color, bd_color, save.clock_dark_bg ? "darken" : null);

    clock.style.fontFamily = save.clock_font ?? "monospace";
    clock.style.fontWeight = save.clock_boldness ?? "bold";

    clock.style.borderStyle = save.clock_border_style ?? "hidden";
    clock.style.borderRadius = (save.clock_border_radius ?? "0") + "px";
    clock.style.borderWidth = (save.clock_border_width ?? "0") + "px";

    const clock_format = save.clock_format ?? 'h:m';
    const time_format = save.clock_time_format ?? false; // 12 or 24 hour time format

    function updateTime() {
        const date = new Date();
        const hour = date.getHours();

        clock.innerText = clock_format
            .replace('yy', date.getFullYear().toString().slice(2, 4))
            .replace('mm', (date.getMonth() + 1).toString().padStart(2, '0'))
            .replace('dd', date.getDate().toString().padStart(2, '0'))
            .replace('h', (!time_format || hour <= 12 ? hour : hour - 12).toString().padStart(2, '0'))
            .replace('m', date.getMinutes().toString().padStart(2, '0'))
            .replace('s', date.getSeconds().toString().padStart(2, '0'))
            .replace('&n', '\n');
    }
    updateTime();
    setInterval(updateTime, 1000);
}

/// Firefox Watermark
function configure_firefox_watermark() {
    const isFirefoxWatermarkEnabled = save.is_firefox_watermark_enabled ?? true;

    if (!isFirefoxWatermarkEnabled) {
        return;
    }

    const fx = document.getElementById('firefox_watermark') as HTMLDivElement;

    const color = save.firefox_watermark_color ?? 'bg-orange';

    fx.classList.add(color);
    fx.classList.replace('d-none', 'd-flex');
}

/// Settings Button
function set_settings_button() {
    const nav = document.getElementById('nav-button') as HTMLButtonElement;
    const is_settings_disabled = save.is_settings_disabled ?? false;
    if (is_settings_disabled) return;
    const is_settings_button_hiding = save.is_settings_button_hiding ?? false;
    if (is_settings_button_hiding) {
        nav.style.opacity = "0%";
        nav.addEventListener("mouseenter", () => {
            nav.style.opacity = "100%";
        });
    }
    nav.addEventListener('click', () => {
        localStorage.clear();
        location.href = 'settings.html';
    });
    nav.hidden = false;
}

/// Translations
function translate(): void {
    const translations = [
        {
            "name": "note-input",
            "tr": "Kısa bir not giriniz",
            "en": "Enter a brief note",
            "de": "Geben Sie eine kurze Notiz ein",
            "es": "Ingresa una nota breve",
        },
    ];

    const lang = ["en", "tr", "es", "de"].find(
        lang => navigator.language.startsWith(lang)
    ) || "en";

    for (const dict of translations) {
        const name: string = dict.name;
        const translation: string = dict[lang];
        if (name == "note-input") {
            for (const element of document.getElementsByName(name)) {
                (element as HTMLInputElement).placeholder = translation;
            }
        }
        else {
            for (const element of document.getElementsByName(name)) {
                element.innerText = translation;
            }
        }
    }
}
