const usd = document.getElementById("usd");
const eur = document.getElementById("eur");
const gbp = document.getElementById("gbp");

var usd_current = 25;
var eur_current = 27;
var gbp_current = 30;

const currency_api = "https://api.freecurrencyapi.com/v1/latest";
const param1 = "base_currency=TRY";
const param2 = "currencies=USD,EUR,GBP";

function ready(){
    // setInterval(get_rates,60 * 1000);
    get_rates();
}

function get_rates(){
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", update_rates);
    oReq.open("GET", currency_api + "?" + param1 + "&" +param2);
    oReq.setRequestHeader("apikey", "UbPNzJJTJyNpDedslXMu7Nfo41o36QiNtCijASu3");
    oReq.setRequestHeader("base_currency", "TRY");
    oReq.setRequestHeader("currencies", "USD,EUR,GBP");
    oReq.send();
}

function update_rates(){
    var res = JSON.parse(this.responseText); 

    var usd_new = 1.0 / parseFloat(res["data"]["USD"]);
    update_color(usd, usd_new - usd_current);
    var eur_new = 1.0 / parseFloat(res["data"]["EUR"]);
    update_color(eur, eur_new - eur_current);
    var gbp_new = 1.0 / parseFloat(res["data"]["GBP"]);
    update_color(gbp, gbp_new - gbp_current);

    usd.innerHTML = (usd_new).toFixed(2);
    eur.innerHTML = (eur_new).toFixed(2);
    gbp.innerHTML = (gbp_new).toFixed(2);

    usd_current = usd_new;
    eur_current = eur_new;
    gbp_current = gbp_new;
}

const card_class = "card text-center text-white fw-bold text-nowrap"
function update_color(element, change){
    if(change >= 0){
        element.parentElement.parentElement.className = card_class + " bg-success";
    }
    else{
        element.parentElement.parentElement.className = card_class + " bg-danger";
    };
}