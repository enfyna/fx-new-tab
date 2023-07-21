const currency_api="https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/",img_api="https://icon.horse/icon/",node={currency:{name:"currency_name_",value:"currency_value_",option:"currency_option_"},shortcut:{link:"link_",name:"name_",img:"img_"},shortcut_setting:{link:"select_link_",name:"select_name_",img:"select_img_"}};function ready(){translate(),configure_shortcuts(),is_currency_rates_enabled()&&(update_currency_html_elements(),did_a_day_pass()&&get_updated_rates()),config_settings_page()}function get_shortcuts(){let e=localStorage.getItem("shortcuts");if(null!=e)return JSON.parse(e);let t=[{name:"",img:"",link:"https://github.com"},{name:"",img:"",link:"https://youtube.com/"},{name:"",img:"",link:"https://chat.openai.com"},{name:"",img:"",link:"https://mail.google.com/mail/u/0/#inbox"},{name:"",img:"",link:"https://discord.com"},{name:"",img:"",link:"https://web.telegram.org/a/"},{name:"",img:"",link:"https://web.whatsapp.com/"},{name:"",img:"",link:"https://amazon.com"}];return localStorage.setItem("shortcuts",JSON.stringify(t)),t}function configure_shortcuts(){let e=get_shortcuts();for(let t=0;t<8;t++)set_shortcut_node(e[t],t)}function set_shortcut_node(e,t){var n=document.getElementById(node.shortcut.link+t),a=n.parentElement;if(null!=a)if(""!=e.link){""==e.name&&(e.name=e.link.replace("https://","").replace("http://","").split("/")[0]),a.hidden=!1,n.href=e.link;var r=document.getElementById(node.shortcut.name+t),i=document.getElementById(node.shortcut.img+t);r.innerHTML=e.name,i.src=e.img,(""==e.img||i.naturalHeight<64||i.naturalWidth<64)&&get_favicon_from_url(e.link,t)}else a.hidden=!0}function get_favicon_from_url(e,t){if(0==navigator.onLine)return void console.log("No internet connection. Cant get favicons.");e=e.replace("https://","").replace("http://","").replace("www.","").split("/")[0];let n=new Image;n.crossOrigin="anonymous",n.src=img_api+e,n.addEventListener("load",(function(){let e=document.createElement("canvas"),a=e.getContext("2d");e.width=n.width,e.height=n.height,a.drawImage(n,0,0);var r=e.toDataURL();document.getElementById(node.shortcut.img+t).src=r;let i=get_shortcuts();i[t.toString()].img=r,localStorage.setItem("shortcuts",JSON.stringify(i))}))}function did_a_day_pass(){let e=localStorage.getItem("date");if(localStorage.setItem("date",(new Date).getTime().toString()),null==e)return!0;let t=new Date(parseInt(e));return(new Date).getTime()-t.getTime()>864e5}function is_currency_rates_enabled(){let e=localStorage.getItem("is_currency_rates_enabled");return null==e||""==e||"false"==e?(hide_currency_elements(!0),!1):(hide_currency_elements(!1),!0)}function get_base_currency(){let e=localStorage.getItem("base_currency");return null==e&&(e="TRY",localStorage.setItem("base_currency",e)),e}function get_currencies(){let e=localStorage.getItem("currencies");if(null==e){let e=[{name:"USD",rate:"0.0"},{name:"EUR",rate:"0.0"},{name:"GBP",rate:"0.0"}];return localStorage.setItem("currencies",JSON.stringify(e)),e}return JSON.parse(e)}function get_updated_rates(){if(0==navigator.onLine)return void console.log("No internet connection. Cant get currency rates.");const e=get_base_currency().toLocaleLowerCase(),t=get_currencies(),n=new XMLHttpRequest;n.onreadystatechange=function(){if(4==this.readyState&&200==this.status){const n=JSON.parse(this.responseText);for(let a=0;a<3;a++){let r=t[a];const i=(1/parseFloat(n[e][r.name.toLocaleLowerCase()])).toFixed(2),c=parseFloat(i);update_color(node.currency.value+a,c-parseFloat(r.rate)),r.rate=i}localStorage.setItem("currencies",JSON.stringify(t)),update_currency_html_elements()}},n.open("GET",currency_api.concat(e,".min.json")),n.send()}function update_currency_html_elements(){const e=get_currencies();for(let t=0;t<3;t++){const n=e[t];document.getElementById(node.currency.name+t).innerHTML=n.name,document.getElementById(node.currency.value+t).innerHTML=n.rate}}function hide_currency_elements(e=!0){const t=document.getElementById("currencies"),n=Object.values(t.childNodes);for(const t of n)t.hidden=e}window.addEventListener("load",ready);const card_class="card p-2 text-center text-white fw-bold text-nowrap";function update_color(e,t){const n=document.getElementById(e).parentElement;if(null==n)return;let a="bg-danger";t>=0&&(a="bg-success"),n.className=card_class.concat(" ",a)}function save(){let e=document.getElementById("base_currency").value;localStorage.setItem("base_currency",e);let t=document.getElementById("enable_api");localStorage.setItem("is_currency_rates_enabled",""+t.checked);let n=get_currencies(),a=get_shortcuts();for(let e=0;e<8;e++){if(e<3){const t=document.getElementById(node.currency.option+e);n[e].name=t.value}var r=a[e];const t=document.getElementById(node.shortcut_setting.link+e),o=document.getElementById(node.shortcut_setting.name+e),s=document.getElementById(node.shortcut_setting.img+e);if(r.link!=t.value){if(r.link=t.value.trim(),r.name!=o.value?r.name=o.value.trim():r.name="",""==s.value){r.img="",save_shortcuts(a);continue}}else if(r.name=o.value,""==s.value){save_shortcuts(a);continue}const l=new FileReader;l.addEventListener("loadend",(e=>{null!=e.target&&(r.img=e.target.result,save_shortcuts(a))}));var i=s.files;if(null!=i){var c=i.item(0);null!=c&&l.readAsDataURL(c)}}localStorage.setItem("currencies",JSON.stringify(n)),t.checked?(hide_currency_elements(!1),get_updated_rates()):hide_currency_elements(!0)}let check=0;function save_shortcuts(e){8==++check&&(check=0,localStorage.setItem("shortcuts",JSON.stringify(e)),configure_shortcuts(),config_settings_page())}function config_settings_page(){document.getElementById("enable_api").checked=is_currency_rates_enabled(),document.getElementById("base_currency").value=get_base_currency();const e=get_shortcuts(),t=get_currencies();for(let c=0;c<8;c++){var n=e[c],a=document.getElementById(node.shortcut_setting.link+c),r=document.getElementById(node.shortcut_setting.name+c),i=document.getElementById(node.shortcut_setting.img+c);r.value=n.name,a.value=n.link,i.value="",c<3&&(document.getElementById(node.currency.option+c).value=t[c].name)}document.getElementById("save-button").addEventListener("click",save)}function translate(){let e;switch(navigator.language.toLowerCase()){case"tr":case"tr-tr":e="tr";break;default:e="en"}[{name:"greeting",tr:["Merhaba!","Nasılsın?","Nasıl gidiyor?","İyi günler!","Hoş geldin!"],en:["Hi!","Hey!","Hello!","Hello there!","Howdy!","Nice to meet you!","Welcome!"]},{name:"motivational",tr:["Çalışmaya devam et!","Her adım, hedefe yaklaşmanı sağlar.","Başarı, pes etmeyenlere gelir.","Pes etme!","Zorluklar seni güçlendirir!","Hatalarından ders al!","Başarabilirsin!","Yapmak istediğini gözünde büyütme!","Başlamak bitirmenin yarısıdır!"],en:["Keep pushing forward!","Believe in yourself!","You can do it!","Doing things is easier when you start!","Always try to get better!","Never give up!","You've got this!","Focus on progress, not perfection!","Learn from your mistakes!","Success is within reach!"]},{name:"settings",tr:["Ayarlar"],en:["Settings"]},{name:"delete-link",tr:["Bir linkin linkini silerek ana menüden kaldırabilirsin."],en:["Delete shortcut link to remove it from main menu."]},{name:"image-link",tr:["Link ikonunu resim dosyası yükleyerek ayarlayabilirsin. (en az 64x64 boyutunda)"],en:["Set a custom link icon by uploading a image file. (at least 64x64 resolution)"]},{name:"delete-cookie-warning",tr:["Bu site için çerezleri silersen ayarların sıfırlanır."],en:["If you delete cookies for this site all data will revert to the default values."]},{name:"cookie-info",tr:["Bu site ayarları kaydetmek için çerez kullanır."],en:["This site uses cookies to save Settings."]},{name:"rate-update-info",tr:["Döviz değerleri günlük yenilenir."],en:["Currency rates update daily."]},{name:"enable-api-label",tr:["Kur bilgilerini göster"],en:["Enable currency rates"]},{name:"currency-api-info",tr:["Döviz değerleri bu API kullanılarak alınmaktadır : https://github.com/fawazahmed0/currency-api"],en:["Currency rates are provided by this API : https://github.com/fawazahmed0/currency-api"]},{name:"api-key-info",tr:["Ana sayfanda 3 tane kurun değerini görmek istiyorsan kullanabilirsin."],en:["This is a optional feature that adds 3 currency rate info to your main page."]},{name:"save-button",tr:["Kaydet"],en:["Save"]},{name:"base-currency-label",tr:["Ana para birimini seç"],en:["Select base currency"]},{name:"currencies-label",tr:["Para birimleri"],en:["Currencies"]},{name:"link-label",tr:["Link"],en:["Link"]},{name:"name-label",tr:["İsim"],en:["Name"]}].forEach((t=>{document.getElementsByName(t.name).forEach((n=>{const a=t[e];a.length>1?n.innerHTML=a[(new Date).getTime()%a.length]:n.innerHTML=a[0]}))}))}