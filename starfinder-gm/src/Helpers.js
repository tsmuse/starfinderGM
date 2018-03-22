var Helpers = {
    rolldice(dice) {
        if (dice != "") {
            // find the "d" in the dmg entry and use it as a pivot point to slice the string
            var d = dice.indexOf("d");
            // count will be the first number indicating how many dice to roll
            var count = dice.slice(0, d);
            // type will be the 2nd number indicating what type of dice to roll
            var type = dice.slice(d + 1);

            var min = Math.ceil(1);
            var max = Math.floor(type);
            var result = [];
            for (let i = 0; i < count; i++) {
                let roll = Math.floor(Math.random() * (max - min + 1)) + min;
                console.log(`Roll: ${roll}`);
                result.push(roll);
                //result += Math.floor(Math.random() * (max - min + 1)) + min;
            }
            return result;
        }
        return undefined;
    },
    getStats(file){
        return new Promise(function promiseLoadStats(resolve,reject){
            try{
                Helpers.loadJSON(file, resolve, reject);
            }
            catch(err){
                reject(err);
            }
        });
    },
    loadJSON(file, resolve, reject) {
        // Load the local json files. H/T to https://codepen.io/KryptoniteDove/ for explaining this method
        // so I could stop using JQuery to do AJAX after all these years 
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', file, true);
        xobj.onreadystatechange = function responseReceived() {
            if (xobj.readyState == 4 && xobj.status == "200") {
                resolve(xobj.responseText);
            }
            else if(xobj.readyState == 4){
                reject(xobj.status);
            }
        };
        xobj.send(null);
    }
};

export default Helpers;