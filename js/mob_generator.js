'use strict';
// create an application object
var App = setupMobGenerator();
var UI;

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
            UI = setupUI(App);
        });
    });
});

// ***************************
function setupUI(myApp){
    const creatureBlockTemplate = "<div class='creature_block'><h2 class='creature_name'></h2><table class='creature_abilities'></table><div class='creature_utilities'></div></div>";
    const skillsSelectorTemplate = "<li class='input_group'><label></label><select class='skill_selector'><option>Acrobatics</option><option>Athletics</option><option>Bluff</option><option>Computers</option><option>Culture</option><option>Diplomacy</option><option>Disguise</option><option>Engineering</option><option>Intimidate</option><option>Life Science</option><option>Medicine</option><option>Mysticism</option><option>Perception</option><option>Physical Science</option><option>Piloting</option><option>Profession</option><option>Sense Motive</option><option>Sleight of Hand</option><option>Stealth</option><option>Survival</option></select></li>";
    const validationErrorTemplate = "<p class='validation_error'></p>";
    const goodSkillsID = "good_skill";
    const masterSkillsID = "master_skill";

    var $createButton = $(".submit_button");
    var $npcNameField = $("#npc_name");
    var $npcCRField = $("#npc_cr");
    var $npcTypeRadios = $("input[name='npc_type']");
    var $npcAbility0Radios = $("input[name='npc_ability0']");
    var $npcAbility1Radios = $("input[name='npc_ability1']");
    var $npcAbility2Radios = $("input[name='npc_ability2']");
    
    // set sane defaults to all the fields except name
    $npcCRField.val("0.33");// this needs to change when this field is replaced with a better control
    $($npcTypeRadios[0]).attr("checked", "true");
    $($npcAbility0Radios[0]).attr("checked", "true");
    $($npcAbility1Radios[1]).attr("checked", "true");
    $($npcAbility2Radios[2]).attr("checked", "true");

    // define the selected types so they can be passed around the UI from jump
    var $npcSelectedType = $("input[name='npc_type']:checked");
    var $npcSelectedAbility0 = $("input[name='npc_ability0']:checked");
    var $npcSelectedAbility1 = $("input[name='npc_ability1']:checked");
    var $npcSelectedAbility2 = $("input[name='npc_ability2']:checked");

    var publicAPI = {
        $npcCRField,
        $npcTypeRadios,
        $npcSelectedType,
        $npcAbility0Radios,
        $npcAbility1Radios,
        $npcAbility2Radios,
        $npcSelectedAbility0,
        $npcSelectedAbility1,
        $npcSelectedAbility2,
        updateAvailableSkillsSelectors
    };

    
    // add the initial skills selectors
    updateAvailableSkillsSelectors();
    //set event listeners
    $npcTypeRadios.change(handleTypeChange);
    $npcAbility0Radios.change(handleAbilityChange);
    $npcAbility1Radios.change(handleAbilityChange);
    $npcAbility2Radios.change(handleAbilityChange);
    $createButton.click(handleSubmit);

    return publicAPI;
    
    function handleSubmit(e){
        var npcName = $npcNameField.val();
        var npcCR = $npcCRField.val();
        var npcType = publicAPI.$npcSelectedType.val();
        var npcAbility0 = publicAPI.$npcSelectedAbility0.val();
        var npcAbility1 = publicAPI.$npcSelectedAbility1.val();
        var npcAbility2 = publicAPI.$npcSelectedAbility2.val();

        console.log(`Testing... NPC Name: ${npcName}, CR: ${npcCR}, Type: ${npcType}, Ability0: ${npcAbility0}, Ability1: ${npcAbility1}, Ability2: ${npcAbility2}`);
    }

    function handleTypeChange(e){
        //update the selectedType object
        publicAPI.$npcSelectedType = $(this);
        // update the available skills to select based on the new matrix
        //debug string
        console.log(`Type changed to ${publicAPI.$npcSelectedType.val()}`);
        publicAPI.updateAvailableSkillsSelectors();
    }

    function handleAbilityChange(e){
        //update the correct selectAbility object
        switch ($(this).attr("name").slice(-1)){
            case "0":
                publicAPI.$npcSelectedAbility0 = $(this);
                break;
            case "1":
                publicAPI.$npcSelectedAbility1 = $(this);
                break;
            case "2":
                publicAPI.$npcSelectedAbility2 = $(this);
        }
        // validate the selections for the whole matrix
        validateAbilityScores($(this));
        // debug string
        console.log(`Selected Ability is ${$(this).attr('name')} set to ${$(this).val()}`);
    }

    function updateAvailableSkillsSelectors(){
        var currentCR = publicAPI.$npcCRField.val();
        var currentType = publicAPI.$npcSelectedType.val();
        var masterSkillCount = 0;
        var goodSkillCount = 0;
        var $masterSkillsList = $(`.${masterSkillsID}_list .skill_selector`);
        var $goodSkillsList = $(`.${goodSkillsID}_list .skill_selector`);

        // This hackey shit can be replaced when I build a better control for the CP selector
        if(currentCR === "0.33"){
            currentCR = "third";
        }
        else if (currentCR === "0.5"){
            currentCR = "half";
        }

        switch(currentType){
            case "combatant":
                masterSkillCount = myApp.combantant_stats[currentCR].masterskillcount;
                goodSkillCount = myApp.combantant_stats[currentCR].goodskillcount;
                break;
            case "expert":
                masterSkillCount = myApp.expert_stats[currentCR].masterskillcount;
                goodSkillCount = myApp.expert_stats[currentCR].goodskillcount;
                break;
            case "spellcaster":
                masterSkillCount = myApp.spellcaster_stats[currentCR].masterskillcount;
                goodSkillCount = myApp.spellcaster_stats[currentCR].goodskillcount;
                break;
        }

         // Check for existing skill selectors, we just want to add new ones or lop off the last extras
        // if the current UI is wrong, that way they don't all get reset
        if( $(".skill_selector").length < 1){
            // this is the initial call, just add all new selectors
            addSkillSelectors(masterSkillsID, 0, masterSkillCount);
            addSkillSelectors(goodSkillsID, 0, goodSkillCount);
        }
        else{
            if($masterSkillsList.length > masterSkillCount){
                // there are too many master skill selectors for the current settings, remove the extras from the end
                removeSkillSelectors(masterSkillsID,masterSkillCount);
            }
            else if ($masterSkillsList.length < masterSkillCount){
                // there are not enough master skill selectors for the current settings, add the requied new selectors to the end
                addSkillSelectors(masterSkillsID, $masterSkillsList.length, masterSkillCount);
            }
            if ($goodSkillsList.length > goodSkillCount){
                // there are too many good skill selectors for the current settings, remove the extras from the end
                removeSkillSelectors(goodSkillsID, goodSkillCount);
            }
            else if ($goodSkillsList.length < goodSkillCount) {
                addSkillSelectors(goodSkillsID, $goodSkillsList.length, goodSkillCount);
            }
        }
    }
    function addSkillSelectors(skillType, start, newCount){
        for(let i = start; i < newCount; i++){
            let $skillSelector = $(skillsSelectorTemplate);
            $(".input_group > label", $skillSelector).attr("for", `${skillType}_${i}`);
            $(".skill_selector", $skillSelector).attr("id", `${skillType}_${i}`);
            $skillSelector.change(validateSkillSelections);
            $(`.${skillType}_list`).append($skillSelector);
        }
    }
    function removeSkillSelectors(skillType, newCount){
        for (let i = $(`.${skillType}_list .skill_selector`).length; i > newCount; i--) {
            $(`#${skillType}_${i-1}`).parent().remove();
        }
    }

    function validateSkillSelections(){
        // if there are errors clear them here, we'll replace them if they aren't fixed
        $('#skills_section .validation_error').remove();
        var $skills = $(".skill_selector");
        for(let j = 0; j < $skills.length; j++){
            for(let i = $skills.length - 1; i > j; i--){
                if( $($skills[j]).val() === $($skills[i]).val()){
                    // Two skills are the same, fire an error message
                    console.log("two skills are the same!!!!");
                    let $error = $(validationErrorTemplate);
                    let skillType = $skills[j].id.slice(0, $skills[j].id.lastIndexOf("_")); 
                    $error.attr("id", `${skillType}_error`);
                    $error.text("You cannot choose the same skill more than once");
                    $(`.${skillType}_list`).before($error);
                }
            }
        }

    }
    function validateAbilityScores(newScore){
        // Still not leaving errors where they need to stay and posting new errors
        // maybe instead of doing the || check do two individual ifs to I can 
        // drop an error message where ever there is a match?
        console.log(`validating: newScore.name = ${newScore.attr('name')}`);
        //var changed = $newscore.attr("name").slice(-1);
        var rg0 = publicAPI.$npcSelectedAbility0;
        var rg1 = publicAPI.$npcSelectedAbility1;
        var rg2 = publicAPI.$npcSelectedAbility2;
        // figure out which other two radio groups we need to compare to
        if (newScore.attr("name") === rg0.attr("name")){
            console.log("Ability 0 just changed...");
            // if there are errors clear them here, we'll replace them if they aren't fixed
            $('#ability_scores .validation_error').remove();
            if(newScore.val() === rg1.val() || newScore.val() === rg2.val()){
                console.log("it's a dupe!");
                //set error message 
                let $error = $(validationErrorTemplate);
                $error.attr("id", "ability0_error");
                $error.text("You cannot choose the same ability more than once");
                $("#ability0_list").before($error);
            }
        }
        else if (newScore.attr("name") === rg1.attr("name")){
            console.log("Ability 1 just changed...");
            // if there are errors clear them here, we'll replace them if they aren't fixed
            $('#ability_scores .validation_error').remove();
            if (newScore.val() === rg0.val() || newScore.val() === rg2.val()) {
                console.log("it's a dupe!");
                //set error message 
                let $error = $(validationErrorTemplate);
                $error.attr("id", "ability1_error");
                $error.text("You cannot choose the same ability more than once");
                $("#ability1_list").before($error);
            }
        }
        else if (newScore.attr("name") === rg2.attr("name")){
            console.log("Ability 2 just changed...");
            // if there are errors clear them here, we'll replace them if they aren't fixed
            $('#ability_scores .validation_error').remove();
            if (newScore.val() === rg0.val() || newScore.val() === rg1.val()) {
                console.log("it's a dupe!");
                //set error message 
                let $error = $(validationErrorTemplate);
                $error.attr("id", "ability2_error");
                $error.text("You cannot choose the same ability more than once");
                $("#ability2_list").before($error);
            }
        }
    }

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


