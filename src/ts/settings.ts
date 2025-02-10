export = {};

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
    shortcut_recently_deleted: string[];

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
    clock_border_style: string;
    clock_border_color: string;
    clock_border_radius: string;
    clock_border_width: string;
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
    sh_link = "select_link_",
    sh_name = "select_name_",
    sh_img = "select_img_",
    sh_reset = "reset_img_",
    sh_default = "set_back_",
    sh_remove = "remove_",

    nt_color = "nt_color_",
};

let save: save;

get_save().then(ready)

async function ready() {
    if (save.is_settings_disabled ?? false) {
        location.href = 'index.html';
    }
    document.title = browser.i18n.getMessage("settings");
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
async function get_save() {
    save = await browser.storage.local.get(null) as save;
}
let saving = false;
const save_info = document.getElementById('save-info');
async function set_save() {
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
    fb_clr_node.onchange = async () => {
        save.bg_color = fb_clr_node.value.trim();
        await set_save();
    }

    const img_node = document.getElementById("select_bg") as HTMLInputElement
    img_node.addEventListener("input", () => {
        const reader = new FileReader();
        reader.addEventListener("loadend", async (event) => {
            if (!event.target) return;
            save.bg_img = ''.concat("url(", (event.target.result as string), ")");
            await set_save();
        });
        const image = img_node.files.item(0);
        if (!image) return;
        reader.readAsDataURL(image);
    });
    const delete_bg = document.getElementById("delete_bg") as HTMLInputElement;
    delete_bg.onclick = async () => {
        save.bg_img = null;
        await set_save();
    }
}

/// Shortcuts
let topSites: shortcut[];

async function configure_shortcut_settings() {
    const colors = save.shortcut_col_colors ?? ['bg-primary', 'bg-danger', 'bg-success', 'bg-warning'];

    const shortcut_shape_settings = document.getElementById('shortcut_shape_settings');
    shortcut_shape_settings.addEventListener('change', async (event) => {
        const input = event.target as HTMLInputElement;
        switch (true) {
            case 'shortcut_min_width' == input.id:
                save.shortcut_min_width = input.value;
                break;
            case 'shortcut_borderless' == input.id:
                save.shortcut_borderless = input.checked;
                break;
            case 'autoshort' == input.id:
                save.is_autoshort_enabled = input.checked;
                break;
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
    const width_opt_group = document.getElementById('shortcut-width-opt') as HTMLOptGroupElement;

    const selects = shortcut_shape_settings.getElementsByTagName('select');
    const inputs = shortcut_shape_settings.getElementsByTagName('input');
    const elements = [...selects, ...inputs];
    for (const inp of elements) {
        switch (inp.id) {
            case 'shortcut_min_width':
                (inp as HTMLInputElement).value = save.shortcut_min_width ?? 'mw-0';
                break;
            case 'autoshort':
                (inp as HTMLInputElement).checked = save.is_autoshort_enabled ?? false;
                break;
            case 'shortcut_borderless':
                (inp as HTMLInputElement).checked = save.shortcut_borderless ?? false;
                break;
            case 'shortcut_transition':
                inp.value = save.shortcut_transition ?? 'glow';
                break;
            case 'shortcut_size':
                inp.value = save.shortcut_size ?? 'p-2';
                break;
            case 'shortcut_width':
                const ch1 = width_opt_group.cloneNode(true) as HTMLOptGroupElement;
                ch1.hidden = false;
                inp.appendChild(ch1);
                inp.value = save.shortcut_width ?? 'col-3';
                break;
            case 'shortcut_v_align':
                inp.value = save.shortcut_v_align ?? 'align-items-center';
                break;
            case 'shortcut_container_h_align':
                inp.value = save.shortcut_container_h_align ?? 'justify-content-center';
                break;
            case 'shortcut_container_width':
                const ch2 = width_opt_group.cloneNode(true) as HTMLOptGroupElement;
                ch2.hidden = false;
                inp.appendChild(ch2);
                inp.value = save.shortcut_container_width ?? 'col-6';
                break;
            default:
                inp.value = save[inp.id] ?? (inp as HTMLSelectElement).options[0].value;
                break;
        }
    }
    width_opt_group.remove();

    const shortcut_color_container = document.getElementById('shortcut_color_container') as HTMLDivElement;
    const shortcut_col_color_select = document.createElement('select');
    shortcut_col_color_select.classList.add('col', 'form-select', 'm-1');

    const color_group = document.getElementById('colors').cloneNode(true) as HTMLOptGroupElement;
    color_group.hidden = false;
    shortcut_col_color_select.appendChild(color_group);

    function add_shortcut_col_color(idx: number) {
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

    shortcut_shape_settings.addEventListener('click', async (event) => {
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
    add_shortcut_container.addEventListener('click', async (event) => {
        const inp = event.target as HTMLInputElement;
        let sh: shortcut;
        switch (inp.id) {
            case 'add_shortcut':
                sh = { link: '', name: '', img: '' };
                break;
            case 'add_shortcut_fill':
                sh = topSites[random_recommend_idx++ % topSites.length];
                break;
            case 'recently_deleted_shortcut':
                show_recently_deleted_shortcuts();
                return;
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

function create_shortcut_setting(id: number, elm: HTMLDivElement): HTMLDivElement {
    elm = elm.cloneNode(true) as HTMLDivElement;
    const colors = save.shortcut_col_colors ?? ['bg-primary', 'bg-danger', 'bg-success', 'bg-warning'];
    const color = colors[id % colors.length];
    elm.classList.add(color);
    elm.hidden = false;
    let shortcut = save.shortcuts[id] as shortcut;

    if (!shortcut) {
        shortcut = { name: '', link: '', img: '' };
        save.shortcuts[id] = shortcut;
        set_save();
    }

    const inputs = elm.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
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
    elm.addEventListener('input', async (event) => {
        const input = event.target as HTMLInputElement;
        switch (input.id) {
            case node.sh_link: {
                const link = input.value.trim();
                shortcut.link = link;
                if (link.length == 0) {
                    shortcut.img = '';
                    shortcut.name = '';
                }
                await set_save();
                break;
            }
            case node.sh_name: {
                const name = input.value.trim();
                shortcut.name = name.length > 0 ? name : null;
                await set_save();
                break;
            }
            case node.sh_img: {
                const reader = new FileReader();
                reader.addEventListener("loadend", async (event) => {
                    if (!event.target) return;
                    shortcut.img = event.target.result as string;
                    await set_save();
                });
                const image = input.files.item(0);
                if (!image) return;
                reader.readAsDataURL(image);
                break;
            }
        }
    });
    elm.addEventListener('click', async (event) => {
        const button = event.target as HTMLButtonElement;
        switch (button.id) {
            case node.sh_reset:
                for (let i = 0; i < topSites.length; i++) {
                    const site = topSites[i];
                    if (site.link == shortcut.link) {
                        shortcut.img = site.img;
                        await set_save();
                        return;
                    }
                }
                if (shortcut.img == '') {
                    return;
                }
                shortcut.img = '';
                await set_save();
                break;
            case node.sh_remove:
                for (let i = 0; i < save.shortcuts.length; i++) {
                    if (save.shortcuts[i] == shortcut) {
                        if (shortcut.link.length > 0) {
                            if (!save.shortcut_recently_deleted)
                                save.shortcut_recently_deleted = [];
                            save.shortcut_recently_deleted.push(shortcut.link);
                            if (save.shortcut_recently_deleted.length > 10) {
                                save.shortcut_recently_deleted.shift();
                            }
                        }
                        save.shortcuts.splice(i, 1);
                        break;
                    }
                }
                elm.remove();
                await set_save();
                break;
            case node.sh_default: {
                if (shortcut.link == '') {
                    return
                }
                let canvas = document.createElement("canvas");
                const context = canvas.getContext("2d") as CanvasRenderingContext2D;
                canvas.width = 64;
                canvas.height = 64;
                context.fillStyle = "#442288aa";
                context.fillRect(0, 0, 64, 64);
                context.font = "bold 40px monospace";
                context.textAlign = "center";
                context.fillStyle = "white";
                context.textBaseline = "middle";
                context.fillText(shortcut.link.replace('https://', '').replace('http://', '').replace('www.', '').toUpperCase().slice(0, 2), canvas.width / 2, canvas.height / 2);
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
    const shortcuts: shortcut[] = [];

    topSites.forEach(site => {
        const shortcut: shortcut = {
            name: site.title,
            link: site.url,
            img: site.favicon ?? '',
        };
        shortcuts.push(shortcut);
    });
    return shortcuts;
}

function show_recently_deleted_shortcuts() {
    const translation = browser.i18n.getMessage("last-deleted-ten-urls");
    alert(translation + "\n\n"
        + (save.shortcut_recently_deleted ?? []).toReversed().join("\n")
    );
}

/// Drag & Drop
let draggedItem: HTMLElement = null;
let did_change_place: boolean = false;
let start_id: number = -1;

function configure_drag_and_drop() {
    function move_shortcut(elm: HTMLElement) {
        for (; elm; elm = elm.parentElement) {
            const parent = elm.parentElement;
            if (parent != draggedItem.parentElement) {
                continue;
            }
            if (parent.firstChild == elm) {
                parent.insertBefore(draggedItem, parent.firstChild);
            }
            else {
                elm.after(draggedItem);
            }
            did_change_place = true;
            return;
        }
    }

    document.addEventListener('dragstart', (e) => {
        draggedItem = (e.target as HTMLElement).parentElement.parentElement;
        const siblings = draggedItem.parentElement.childNodes;
        for (let i = 0; i < siblings.length; i++) {
            if (siblings[i] == draggedItem) {
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

    document.addEventListener('drop', async (e) => {
        e.preventDefault();
        if (did_change_place) {
            const parent = draggedItem.parentElement;
            let end_id = -1;
            for (let i = 0; i < parent.childNodes.length; i++) {
                if (parent.childNodes[i] == draggedItem) {
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

    function add_note(idx: number) {
        const select = note_col_color_select.cloneNode(true) as HTMLSelectElement;

        for (let i = idx; i >= notes.length; i--) {
            notes.push({ note: "", color: 'bg-primary' });
        }

        select.value = (notes[idx].color ?? 'bg-primary').split('-')[1];

        select.id = node.nt_color + idx;
        note_color_container.append(select);
    }

    function remove_note() {
        const translation = browser.i18n.getMessage("alert-not-empty-note");
        if (notes.length == 0)
            return;
        if (notes[notes.length - 1].note.length > 0
            && !confirm(translation)) {
            return;
        }
        notes.pop();
        note_color_container.lastChild.remove();
    }

    for (let i = 0; i < notes.length; i++) {
        add_note(i);
    }

    container.querySelectorAll('input').forEach(elm => {
        switch (elm.id) {
            case 'enable_notes':
                (elm as HTMLInputElement).checked = is_notes_enabled();
                break;
        }
    });

    container.addEventListener('click', async (event) => {
        const elm = event.target as HTMLInputElement;
        if (elm.id == 'add_note')
            add_note(get_notes().length);
        else if (elm.id == 'remove_note')
            remove_note();
        else
            return;
        await set_save();
    });

    container.addEventListener('change', async (event) => {
        const elm = event.target as HTMLInputElement;
        if (elm.id == 'enable_notes')
            save.is_notes_enabled = elm.checked;
        else if (elm.id.startsWith(node.nt_color)) {
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

function is_notes_enabled(): boolean {
    return save.is_notes_enabled ?? true;
}

function get_notes(): note[] {
    return save.notes ?? [
        { note: "", color: "bg-primary" },
        { note: "", color: "bg-danger" },
        { note: "", color: "bg-success" },
        { note: "", color: "bg-warning" },
    ];
}

/// Settings Button
function configure_nav_settings() {
    const check = document.getElementById('hide_settings_button') as HTMLInputElement;
    check.checked = save.is_settings_button_hiding ?? false;
    check.addEventListener('change', async () => {
        save.is_settings_button_hiding = check.checked;
        await set_save();
    });
}

/// Clock
function configure_clock_settings() {
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
            .replace('yy', date.getFullYear().toString().slice(2, 4))
            .replace('mm', (date.getMonth() + 1).toString().padStart(2, '0'))
            .replace('dd', date.getDate().toString().padStart(2, '0'))
            .replace('h', (!time_format || hour <= 12 ? hour : hour - 12).toString().padStart(2, '0'))
            .replace('m', date.getMinutes().toString().padStart(2, '0'))
            .replace('s', date.getSeconds().toString().padStart(2, '0'))
            .replace('&n', '\n');
    }
    configure_clock();

    const settings = document.getElementById('clock_settings') as HTMLDivElement;
    settings.querySelectorAll('select , input').forEach(elm => {
        switch (elm.id) {
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
            case 'clock_dark_bg':
                (elm as HTMLInputElement).checked = save.clock_dark_bg ?? false;
                break;
            case 'clock_boldness':
                (elm as HTMLInputElement).checked = (save.clock_boldness ?? "bold") == "bold";
                break;
            case 'clock_time_format':
                (elm as HTMLSelectElement).value = save.clock_time_format ?? false ? 'true' : 'false';
                break;
            default:
                (elm as HTMLInputElement).value = save[elm.id] ?? (elm as HTMLInputElement).value ?? 0;
                break;
        }
    });
    settings.addEventListener('change', async (event) => {
        const id = (event.target as HTMLElement).id;
        switch (id) {
            case 'enable_clock':
                save.is_clock_enabled = (event.target as HTMLInputElement).checked;
                break;
            case 'clock_time_format':
                save.clock_time_format = (event.target as HTMLSelectElement).value == 'true';
                break;
            case 'clock_dark_bg':
                save.clock_dark_bg = (event.target as HTMLInputElement).checked;
                break
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
function configure_currency_settings() {
    const national_node = document.getElementById("opt-national-currencies") as HTMLOptGroupElement;
    const crypto_node = document.getElementById("opt-crypto-currencies") as HTMLOptGroupElement;

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
        switch (elm.id) {
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
                if (elm.id == 'base_currency')
                    elm.value = save.base_currency ?? 'TRY';
                else {
                    const idx = elm.id.split('_')[2];
                    elm.value = currencies[idx].name;
                }
                break;
        }
    }
    container.addEventListener('change', async (event) => {
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
            default: {
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

function get_currencies(): currency[] {
    return save.currencies ?? [
        { name: 'USD', rate: '-' },
        { name: 'EUR', rate: '-' },
        { name: 'GBP', rate: '-' },
    ];
}

/// Firefox Watermark
function configure_firefox_watermark_settings() {
    const check = document.getElementById('enable_firefox_watermark') as HTMLInputElement;
    check.checked = save.is_firefox_watermark_enabled ?? true;
    check.addEventListener('change', async () => {
        save.is_firefox_watermark_enabled = check.checked;
        await set_save();
    });
    const color = document.getElementById('firefox_color') as HTMLSelectElement;
    const opt = document.getElementById('colors').cloneNode(true) as HTMLOptGroupElement;
    opt.hidden = false;
    color.appendChild(opt);
    color.value = (save.firefox_watermark_color ?? 'bg-orange').split('-')[1];
    color.addEventListener('change', async () => {
        save.firefox_watermark_color = 'bg-' + color.value.trim();
        await set_save();
    })
}

/// Import / Export
function configure_import_export() {
    const parent = document.getElementById('import_export_settings') as HTMLDivElement;
    parent.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        switch (target.id) {
            case "import-settings": {
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.click();
                fileInput.addEventListener('change', handleFileSelect);
                break;
            }
            case "export-settings": {
                const data = "data:text/json;charset=utf-8," 
                    + encodeURIComponent(JSON.stringify(save, null, 2));

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

function handleFileSelect(event: any) {
    const file = event.target.files[0];

    if (!file) {
        console.error('No file selected');
        return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
        let jsonData: any;

        try {
            jsonData = JSON.parse(e.target.result as string);
        }
        catch (error) {
            console.error(error);
            return;
        }

        let save_sh = confirm(browser.i18n.getMessage("keep-shortcuts-question"));
        let save_nt = confirm(browser.i18n.getMessage("keep-notes-question"));
        let save_cr = confirm(browser.i18n.getMessage("keep-currency-question"));
        let sh = save.shortcuts;
        let nt = save.notes;
        let cr = save.currencies;

        await browser.storage.local.clear();
        localStorage.clear();
        save = jsonData;

        if (save_sh) save.shortcuts = sh;
        if (save_nt) save.notes = nt;
        if (save_cr) save.currencies = cr;

        await set_save();
        location.href = "index.html";
    };
    reader.readAsText(file);
}

/// Nav Button
let countdown = 4;
function configure_home_button() {
    const removeButton = document.getElementById("remove-settings-button") as HTMLButtonElement;
    removeButton.addEventListener('click', async () => {
        if (--countdown == 0) {
            save.is_settings_disabled = true;
            await set_save();
            location.href = 'index.html';
        }
        removeButton.innerText = countdown.toString();
    });
    document.getElementById('nav-button').addEventListener('click', () => {
        if (!saving) location.href = 'index.html';
    });
}

/// Translations
function translate(): void {
    const translations = [
        "settings",                     "glow",
        "image-link",                   "fallback-default-icon-info",
        "shortcut-settings",            "reset-default-icon-info",
        "shortcut-container-settings",  "rate-update-info",
        "shortcut-color-settings",      "enable-api-label",
        "blue",                         "enable-clock-label",
        "red",                          "enable-firefox-label",
        "green",                        "enable-notes-label",
        "yellow",                       "bg-settings",
        "black",                        "bg-fallback-color-label",
        "dark",                         "bg-img-upload-info",
        "white",                        "currency-api-refresh-warning",
        "gray",                         "currencies-label",
        "lime",                         "hide-settings-button",
        "orange",                       "remove-settings-button-info",
        "violet",                       "remove-settings-button-label",
        "scarletred",                   "import-export-settings",
        "aqua",                         "save-info",
        "navyblue",                     "clock-boldness-label",
        "transparent",                  "clock-border-width-label",
        "center",                       "clock-border-radius-label",
        "top",                          "clock-darkness-label",
        "bottom",                       "label-autoshort",
        "left",                         "shortcut-borderless",
        "right",                        "clock_style_hidden",
        "spin",                         "none",
        "rotate",                       "move_down",
        "scale_down",                   "move_up",
        "scale_up",

        "opt-shortcut-v-align",         "opt-shortcut-shape",
        "opt-shortcut-h-align",         "opt-base-currency-label",
        "opt-color-label",              "opt-national-currencies",
        "opt-shortcut-width",           "opt-crypto-currencies",
        "opt-shortcut-transition",      "opt-shortcut-min-width",
        "opt-shortcut-size",
    ];

    for (const message of translations) {
        const translation = browser.i18n.getMessage(message);
        if (message.startsWith("opt-")) {
            for (const element of document.getElementsByName(message)) {
                (element as HTMLOptGroupElement).label = translation;
            }
        }
        else {
            for (const element of document.getElementsByName(message)) {
                element.innerText = translation;
            }
        }
    }
}
