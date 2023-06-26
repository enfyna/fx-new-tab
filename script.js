const currency_api = "https://api.freecurrencyapi.com/v1/latest";
const param1 = "base_currency=";
const param2 = "currencies=";
var API_KEY;
var base_currency;
var currencies;

var currency_rates = {};

const twelve_hours_in_ms = 43200000;
var did_12hours_pass = false;

function ready(){
    load_variables();
    if(did_12hours_pass){
        get_updated_rates();
    }
    else{
        update_currency_html_elements();
    };
    config_settings_page();
}

function calculate_date(){
    var date = localStorage.getItem("date");
    if (date == null){
        date = new Date();
        localStorage.setItem("date", date.getTime());
        did_12hours_pass = true;
    }
    else{
        date = new Date(parseInt(date));
    };
    var now = new Date();
    if(now.getTime() - date.getTime() > twelve_hours_in_ms){
        did_12hours_pass = true;
    }
}

function load_variables(){
    API_KEY = localStorage.getItem("API_KEY");
    if(API_KEY == null){
        hide_currency_elements(true);
    }
    else{
        hide_currency_elements(false);
    }

    base_currency = localStorage.getItem("base_currency");
    if (base_currency == null){
        base_currency = "TRY"; // Default Value
        localStorage.setItem("base_currency",base_currency);
    }
    currencies = JSON.parse(localStorage.getItem("currencies"));
    if (currencies == null){
        currencies = ["USD","EUR","GBP"]; // Default Value
        localStorage.setItem("currencies",JSON.stringify(currencies));
    }
    currencies.forEach(element => {
        if (localStorage.getItem(element) != null){
            currency_rates[element] = Number.parseFloat(localStorage.getItem(element));
        }
    });
    calculate_date();
}

function get_updated_rates(){
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", update_rates);
    oReq.open("GET", currency_api+"?"+param1+base_currency+"&"+param2+currencies);
    oReq.setRequestHeader("apikey", API_KEY);
    oReq.send();
}

function update_rates(){
    var res = JSON.parse(this.responseText); 
    
    var cur_node = "cur_";
    for (let idx = 0; idx < currencies.length; idx++) {
        var updated_rate = 1.0 / parseFloat(res["data"][currencies[idx]]);
        update_color(cur_node+(idx+1), updated_rate - currency_rates[currencies[idx]]);

        currency_rates[currencies[idx]] = updated_rate;

        localStorage.setItem(currencies[idx], updated_rate.toString());
    };
    update_currency_html_elements();
}

function update_currency_html_elements(){
    var cur_name = "cur_name_";
    var cur_value = "cur_";
    for (let idx = 0; idx < currencies.length; idx++) {
        var currency = currencies[idx];
        document.getElementById(cur_name+(idx+1)).innerHTML = currency;
        document.getElementById(cur_value+(idx+1)).innerHTML = currency_rates[currency].toFixed(2);
    };
}

function hide_currency_elements(set){
    var cur_name = "cur_name_";
    for (let idx = 0; idx < 3; idx++) {
        document.getElementById(cur_name+(idx+1)).parentElement.hidden = set;
    };
}

const card_class = "card p-2 text-center text-white fw-bold text-nowrap"
function update_color(element_name, change){
    if(change >= 0){
        document.getElementById(element_name).parentElement.className = card_class + " " + "bg-success";
    }
    else{
        document.getElementById(element_name).parentElement.className = card_class + " " + "bg-danger";
    };
}

function save(){
    console.log("saving...");
    var apikey = document.getElementById("api_key_select");
    API_KEY = apikey.value;
    localStorage.setItem("API_KEY",API_KEY);

    var base_currency_selector = document.getElementById("base_currency");
    base_currency = base_currency_selector.value;
    localStorage.setItem("base_currency",base_currency);

    var cur_select_name = "cur_select_";
    for (let idx = 0; idx < currencies.length; idx++) {
        var selector = document.getElementById(cur_select_name+(idx+1));
        currencies[idx] = selector.value;
    };
    localStorage.setItem("currencies",JSON.stringify(currencies));

    if(API_KEY != ""){
        hide_currency_elements(false);
        get_updated_rates();
    }else{
        hide_currency_elements(true);
    };
}

function config_settings_page(){
    var base_currency_selector = document.getElementById("base_currency");
    base_currency_selector.value = base_currency;

    var cur_select_name = "cur_select_";
    for (let idx = 0; idx < currencies.length; idx++) {
        var selector = document.getElementById(cur_select_name+(idx+1));
        selector.value = currencies[idx];
    };

    var api_key_select = document.getElementById("api_key_select");
    api_key_select.value = API_KEY;
}

function print(foo){
    console.log(foo);
}