// create an application object
var App = setupMobGenerator();
// load the json files. This should be quick because they're local but because this is 
// an async call this has to happen in a weird chain to avoid loading the UI before
// we have all the table data. This feels like a good place for promises...
loadStats("js/json/combatant_array.json",function loadCombatantTable(response){
    App.combantant_stats = JSON.parse(response);
    loadStats("js/json/expert_array.json",function loadExpertTable(response){
        App.expert_stats = JSON.parse(response);
        loadStats("js/json/spellcaster_array.json", function loadSpellCasterTable(response){
            App.spellcaster_stats = JSON.parse(response);
            // init the UI here
        });
    });
});

// ***************************
function setupUI(){
    const creatureBlockTemplate = "<div class='creature_block'><h2 class='creature_name'></h2><table class='creature_abilities'></table><div class='creature_utilities'></div></div>";
     
}

function setupMobGenerator(){
    var combatant_stats;
    var expert_stats;
    var spellcaster_stats;
    var publicAPI = {
        "combantant_stats": combatant_stats,
        "expert_stats": expert_stats,
        "spellcaster_stats": spellcaster_stats,
        generateGenericNPC
    }; 
    return publicAPI

    // **************************

    // Factory for general combatant type mobs. 
    // Takes as arguments: base (base template array object: e.g. combantant_stats),
    // CR(string), abilities(array of ints), 
    // skills(array of skills objects with master skills listed first)
    function generateGenericNPC(base, cr, abilities, skills) {
        var mob = {
            "str": 0,
            "dex": 0,
            "con": 0,
            "int": 0,
            "wis": 0,
            "cha": 0,
            "hp": base[cr].hp,
            "initive": 0,
            "eac": base[cr].eac,
            "kac": base[cr].kac,
            "fort": base[cr].fort,
            "ref": base[cr].ref,
            "will": base[cr].will,
            "lowattack": base[cr].lowattack,
            "highattack": base[cr].highattack,
            "defaultenergydmg": base[cr].energydmg,
            "defaultkineticdmg": base[cr].kineticdmg,
            "defautmeleedmg": base[cr].stdmeleedmg,
            "defaultmeleethreedmg": base[cr].threemeleedmg,
            "defaultmeleefourdmg": base[cr].fourmeleedmg,
            "abilitydc": base[cr].abilitydc,
            "spelldc": base[cr].spelldc,
            "skills": [],
            "weapons": [],
            rollBasicDamage: rollDamage,
            rollBasicAttack: rollAttack,
            rollSkillCheck: rollSkill
        };

        // assign abilities
        for (let i = 0; i < abilities.length; i++) {
            switch (abilities[i]) {
                case "str":
                    mob.str += base[cr].abilitymods[i];
                    console.log(`Str now ${mob.str}`);
                    break;
                case "dex":
                    mob.dex += base[cr].abilitymods[i];
                    console.log(`Dex now ${mob.dex}`);
                    break;
                case "con":
                    mob.con += base[cr].abilitymods[i];
                    console.log(`Con now ${mob.con}`);
                    break;
                case "int":
                    mob.int += base[cr].abilitymods[i];
                    console.log(`Int now ${mob.int}`);
                    break;
                case "wis":
                    mob.wis += base[cr].abilitymods[i];
                    console.log(`Wis now ${mob.wis}`);
                    break;
                case "cha":
                    mob.cha += base[cr].abilitymods[i];
                    console.log(`Cha now ${mob.cha}`);
            }

        }
        //assign skills: the skills in the array will always be considered to be in order
        //Master Skills -> Good Skills 

        for (let i = 0; i < skills.length; i++) {
            let ability = 0;
            let skill = { "name": skills[i], "modifier": 0 };

            // determine the ability modifier to use
            if (skill.name === "Computers" ||
                skill.name === "Culture" ||
                skill.name === "Engineering" ||
                skill.name === "Life Science" ||
                skill.name === "Medicine" ||
                skill.name === "Physical Science"
            ) {
                skill.modifier += mob.int;
            }
            else if (skill.name === "Acrobatics" ||
                skill.name === "Piloting" ||
                skill.name === "Sleight of Hand" ||
                skill.name === "Stealth"
            ) {
                skill.modifier += mob.dex;
            }
            else if (skill.name === "Mysticicm" ||
                skill.name === "Perception" ||
                skill.name === "Sense Motive" ||
                skill.name === "Survival"
            ) {
                skill.modifier += mob.wis;
            }
            else if (skill.name === "Bluff" ||
                skill.name === "Diplomacy" ||
                skill.name === "Disguise" ||
                skill.name === "Intimidate"
            ) {
                skill.modifier += mob.cha;
            }
            else if (skill.name === "Athletics") {
                skill.modifier += mob.str;
            }

            if (i <= base[cr].masterskillcount - 1) {
                //assign master skills
                skill.modifier += base[cr].masterskill;
            }
            else {
                //assign good skills
                skill.modifier += base[cr].goodskill;
            }

            mob.skills.push(skill);
        }



        // generates a random die roll based on the damage dice in the mob entry and addes the appropriate modifiers
        function rollDamage(damageType) {
            switch (damageType) {
                case "energy":
                    return !isNaN(cr) ? rolldice(mob.defaultenergydmg) + Number(cr) : rolldice(mob.defaultenergydmg);
                case "kinetic":
                    return !isNaN(cr) ? rolldice(mob.defaultkineticdmg) + Number(cr) : rolldice(mob.defaultkineticdmg);
                case "melee":
                    return !isNaN(cr) ? rolldice(mob.defautmeleedmg) + Number(cr) + mob.str : rolldice(mob.defautmeleedmg) + mob.str;
                case "threemelee":
                    return !isNaN(cr) ? rolldice(mob.defaultmeleethreedmg) + Number(cr) + mob.str : rolldice(mob.defaultmeleethreedmg) + mob.str;
                case "fourmelee":
                    return !isNaN(cr) ? rolldice(mob.defaultmeleefourdmg) + Number(cr) + mob.str : rolldice(mob.defaultmeleefourdmg) + mob.str;
            }
        }

        function rollAttack(attackType) {
            switch (attackType) {
                case "high":
                    return rolldice("1d20") + mob.highattack;
                case "low":
                    return rolldice("1d20") + mob.lowattack;
            }
        }

        function rollSkill(skillnumber){
            return rolldice("1d20") + mob.skills[skillnumber].modifier;
        }

        function rolldice(dice) {
            if (dice != "") {
                // find the "d" in the dmg entry and use it as a pivot point to slice the string
                var d = dice.indexOf("d");
                // count will be the first number indicating how many dice to roll
                var count = dice.slice(0, d);
                // type will be the 2nd number indicating what type of dice to roll
                var type = dice.slice(d + 1);

                var min = Math.ceil(1);
                var max = Math.floor(type);
                var result = 0;
                for (let i = 0; i < count; i++) {
                    roll = Math.floor(Math.random() * (max - min + 1)) + min;
                    console.log(`Roll: ${roll}`);
                    result += roll;
                    //result += Math.floor(Math.random() * (max - min + 1)) + min;
                }
                return result;
            }
            return undefined;

        }
        return mob;
    } 
}

// function calcAbilityMod(ability) {
//     return Math.floor((ability - 10) / 2);
// }

// Load the local json files. H/T to https://codepen.io/KryptoniteDove/ for explaining this method
// so I could stop using JQuery to do AJAX after all these years 
function loadStats(file, callback){
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true);
    xobj.onreadystatechange = function responseReceived(){
        if(xobj.readyState == 4 && xobj.status == "200"){
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}


