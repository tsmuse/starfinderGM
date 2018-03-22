'use strict';
// create an object to namespace all the helper functions
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
    loadStats(file, callback) {
        // Load the local json files. H/T to https://codepen.io/KryptoniteDove/ for explaining this method
        // so I could stop using JQuery to do AJAX after all these years 
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', file, true);
        xobj.onreadystatechange = function responseReceived() {
            if (xobj.readyState == 4 && xobj.status == "200") {
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    }
};
// create an application object
var App = setupMobGenerator();
// create the var to hold the UI
var UI;
// load the json files. This should be quick because they're local but because this is 
// an async call this has to happen in a weird chain to avoid loading the UI before
// we have all the table data. This feels like a good place for promises...
Helpers.loadStats("js/json/combatant_array.json",function loadCombatantTable(response){
    App.combantant_stats = JSON.parse(response);
    Helpers.loadStats("js/json/expert_array.json",function loadExpertTable(response){
        App.expert_stats = JSON.parse(response);
        Helpers.loadStats("js/json/spellcaster_array.json", function loadSpellCasterTable(response){
            App.spellcaster_stats = JSON.parse(response);
            // init the UI here
            UI = setupUI(App);
        });
    });
});

// ***************************

// The UI application
function setupUI(myApp){

    // templates used by various parts of the UI app
    const creatureBlockTemplate = `<div class='creature_block'><h2 class='creature_name'></h2><p class="creature_cr"></p><h3 class="form_instruction">Ability modifiers</h3><table class='creature_abilities'><thead><tr><th class="label js_str_entry">Strength</th><th class="label js_dex_entry">Dexterity</th><th class="label js_con_entry">Constitution</th><th class="label js_int_entry">Intelligence</th><th class="label js_wis_entry">Wisdom</th><th class="label js_cha_entry">Charisma</th></tr></thead><tbody><tr><td class="value js_str_value"></td><td class="value js_dex_value"></td><td class="value js_con_value"></td><td class="value js_int_value"></td><td class="value js_wis_value"></td><td class="value js_cha_value"></td></tr></tbody></table><h3 class="form_instruction">Defensive stats</h3><table class="creature_defense"><thead><tr><th class="label js_initive_entry">Initive</th><th class="label js_kac_entry">KAC</th><th class="label js_eac_entry">EAC</th></tr></thead><tbody><tr><td class="value js_initive_value"></td><td class="value js_kac_value"></td><td class="value js_eac_value"></td></tr></tbody></table><h3 class="form_instruction">Offensive stats</h3><table class="creature_offense"><thead><tr><th class="label js_hattack_entry">High Attack</th><th class="label js_lattack_entry">Low Attack</th><th class="label js_edmg_entry">Base Energy Damage</th><th class="label js_kdmg_entry">Base Kinetic Damage</th><th class="label js_mdmg_entry">Base Melee Damage</th><th class="label js_3mdmg_entry hidden">3 Melee Attacks Damage</th><th class="label js_4mdmg_entry hidden">4 Melee Attacks Damage</th></tr></thead><tbody><tr><td class="value js_hattack_value"></td><td class="value js_lattack_value"></td><td class="value js_edmg_value"></td><td class="value js_kdmg_value"></td><td class="value js_mdmg_value"></td><td class="value js_3mdmg_value hidden"></td><td class="value js_4mdmg_value hidden"></td></tr><tr><td class="action js_hattack_action"><button class="roll_button js_roll_hattack">Roll</button></td><td class="action js_lattack_action"><button class="roll_button js_roll_lattack">Roll</button></td><td class="action js_edmg_action"><button class="roll_button js_roll_edmg">Roll</button></td><td class="action js_kdmg_action"><button class="roll_button js_roll_kdmg">Roll</button></td><td class="action js_mdmg_action"><button class="roll_button js_roll_mdmg">Roll</button></td><td class="action js_3mdmg_action hidden"><button class="roll_button js_roll_3mdmg">Roll</button></td><td class="action js_4mdmg_action hidden"><button class="roll_button js_roll_4mdmg">Roll</button></td></tr></tbody></table><h3 class="form_instruction">Weapons</h3><table class="creature_weapons"><tbody></tbody></table><h3 class="form_instruction">Skills</h3><table class="creature_skills"><tbody></tbody></table><h3 class="form_instruction">Special abilities/class features</h3><table class="creature_sas"><tbody></tbody></table><div class="roll_results"></div></div>`;
    const skillsSelectorTemplate = `<li class="input_group"><label></label><div class="fancy_select"><select class="skill_selector"><option>Acrobatics</option><option>Athletics</option><option>Bluff</option><option>Computers</option><option>Culture</option><option>Diplomacy</option><option>Disguise</option><option>Engineering</option><option>Intimidate</option><option>Life Science</option><option>Medicine</option><option>Mysticism</option><option>Perception</option><option>Physical Science</option><option>Piloting</option><option>Profession</option><option>Sense Motive</option><option>Sleight of Hand</option><option>Stealth</option><option>Survival</option></select></div></li>`;
    const validationErrorTemplate = "<p class='validation_error'></p>";
    const rollReportTemplate = `<div class="dice_roll"><p class="result"></p><p class="report"></p></div>`;
    const goodSkillsID = "good_skill";
    const masterSkillsID = "master_skill";

    var $statblocs = [];
    var $createButton = $(".submit_button");
    var $npcNameField = $("#npc_name");
    var $npcCRField = $("#npc_cr");
    var $npcTypeRadios = $("input[name='npc_type']");
    var $npcAbility0Radios = $("input[name='npc_ability0']");
    var $npcAbility1Radios = $("input[name='npc_ability1']");
    var $npcAbility2Radios = $("input[name='npc_ability2']");
    
    // set sane defaults to all the fields except name
    $($npcTypeRadios[0]).attr("checked", "true");
    $($npcAbility0Radios[0]).attr("checked", "true");
    $($npcAbility1Radios[1]).attr("checked", "true");
    $($npcAbility2Radios[2]).attr("checked", "true");

    // define the selected types so they can be passed around the UI from jump
    var $npcSelectedType = $("input[name='npc_type']:checked");
    var $npcSelectedAbility0 = $("input[name='npc_ability0']:checked");
    var $npcSelectedAbility1 = $("input[name='npc_ability1']:checked");
    var $npcSelectedAbility2 = $("input[name='npc_ability2']:checked");

    //TODO: check to make sure all of these actually still need to be available to the outside
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
        $statblocs
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

    // *****************************************************
    
    // Event Handlers

    // Handle the click of the "roll character" button
    function handleSubmit(e){
        var absValid = validateAbilityScores(publicAPI.$npcSelectedAbility0);
        var skillsValid = validateSkillSelections();
        console.log(`handle submit -- absValid: ${absValid}, skillsValid: ${skillsValid}`);
        if (absValid && skillsValid ){
            var npcName = $npcNameField.val();
            var npcCR = $npcCRField.val();
            var npcType;
            var abilities = [publicAPI.$npcSelectedAbility0.val(), publicAPI.$npcSelectedAbility1.val(), publicAPI.$npcSelectedAbility2.val()];
            var $skills = $(".skill_selector");
            var skills = [];
            
            // set up the variables to be given to the generator
            if(npcName === ""){
                npcName = undefined;
            }
            // This hackey shit can be replaced when I build a better control for the CP selector
            if (npcCR === "0.33") {
                npcCR = "third";
            }
            else if (npcCR === "0.5") {
                npcCR = "half";
            }
            // gather all the skill values
            for(let i = 0; i < $skills.length; i++){
                skills.push($($skills[i]).val());
            }
            // choose an array to use based on the type input selected
            switch (publicAPI.$npcSelectedType.val()){
                case "combatant":
                    npcType = myApp.combantant_stats;
                    break;
                case "expert":
                    npcType = myApp.expert_stats;
                    break;
                case "spellcaster":
                    npcType = myApp.spellcaster_stats;
            }
            // generate a generic NPC object
            var npc = myApp.generateGenericNPC(npcType, npcName, npcCR, abilities, skills);
            // construct the NPC stat block
            displayStatBlock(npc);
        }
        else{
            let errorMessage = absValid ? "Skills must all be unique." : "Ability modifiers must all be unique.";
            console.log(errorMessage);
        }
    }

    // Handle a change in the npc_type radio group
    function handleTypeChange(e){
        //update the selectedType object
        publicAPI.$npcSelectedType = $(this);
        // update the available skills to select based on the new matrix
        //debug string
        console.log(`Type changed to ${publicAPI.$npcSelectedType.val()}`);
        updateAvailableSkillsSelectors();
    }

    // Handle a change in the npc_ability0, npc_ability1,and npc_ability2 radio groups
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

    // Handle a click of the "roll" button to roll a high attack
    function handleRollBasicHighAttack(e) {
        var npcID = findMyCreatureBlockID($(this));
        var npc = myApp.npcs[npcID];
        var roll = npc.rollBasicAttack("high");
        displayRollResult(npcID, roll, "Basic High Attack");
    }

    // Handle a click of the "roll" button to roll a low attack
    function handleRollBasicLowAttack(e) {
        var npcID = findMyCreatureBlockID($(this));
        var npc = myApp.npcs[npcID];
        var roll = npc.rollBasicAttack("low");
        displayRollResult(npcID, roll, "Basic Low Attack");
    }

    // Handle a click of the "roll" button to roll Base Energy Damage
    function handleRollBasicEnergyDmg(e) {
        var npcID = findMyCreatureBlockID($(this));
        var npc = myApp.npcs[npcID];
        var roll = npc.rollBasicDamage("energy");
        displayRollResult(npcID, roll, "Basic Energy DMG");
    }

    // Handle a click of the "roll" button to roll Base Kinetic Damage
    function handleRollBasicKineticDmg(e) {
        var npcID = findMyCreatureBlockID($(this));
        var npc = myApp.npcs[npcID];
        var roll = npc.rollBasicDamage("kinetic");
        displayRollResult(npcID, roll, "Basic Kinetic DMG");
    }

    // Handle a click of the "roll" button to roll Base Melee Damage
    function handleRollBasicMeleeDmg(e) {
        var npcID = findMyCreatureBlockID($(this));
        var npc = myApp.npcs[npcID];
        var roll = npc.rollBasicDamage("melee");
        displayRollResult(npcID, roll, "Basic Melee DMG");
    }

    // Handle a click of the "roll" button to roll Base Three Attacks Melee Damage
    function handleRollBasicThreeMeleeDmg(e) {
        var npcID = findMyCreatureBlockID($(this));
        var npc = myApp.npcs[npcID];
        var roll = npc.rollBasicDamage("threemelee");
        displayRollResult(npcID, roll, "Basic Three Melee DMG");
    }

    // Handle a click of the "roll" button to roll Base Four Attacks Melee Damage
    function handleRollBasicFourMeleeDmg(e) {
        var npcID = findMyCreatureBlockID($(this));
        var npc = myApp.npcs[npcID];
        var roll = npc.rollBasicDamage("fourmelee");
        displayRollResult(npcID, roll, "Basic Four Melee DMG");
    }

    // A helper function for the roll click handlers to find their parent creature_block's ID in $statblocs
    function findMyCreatureBlockID(node) {
        var search = node.parents();
        var $parent;
        for (let i = 0; i < search.length; i++) {
            if ($(search[i]).hasClass(`creature_block`)) {
                $parent = $(search[i]);
                break;
            }
        }
        for (let i = 0; i < publicAPI.$statblocs.length; i++) {
            if ($parent[0] === publicAPI.$statblocs[i][0]) {
                return i;
            }
        }
        return undefined;
    }

    // DOM manipulators

    // Function to adjust the number of Skill selectors in the creation form based on changes in NPC Type
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

    // Helper function for updateAvailableSkillsSelectors(), creates and inserts new skill selector nodes
    function addSkillSelectors(skillType, start, newCount){
        for(let i = start; i < newCount; i++){
            let $skillSelector = $(skillsSelectorTemplate);
            $(".input_group > label", $skillSelector).attr("for", `${skillType}_${i}`);
            $(".skill_selector", $skillSelector).attr("id", `${skillType}_${i}`);
            $skillSelector.change(validateSkillSelections);
            $(`.${skillType}_list`).append($skillSelector);
        }
    }

    // Helper function for updateAvailableSkillsSelectors(), removes extra skill selector nodes
    function removeSkillSelectors(skillType, newCount){
        for (let i = $(`.${skillType}_list .skill_selector`).length; i > newCount; i--) {
            $(`#${skillType}_${i-1}`).parent().remove();
        }
    }

    // A function to add validaton error messages to the UI
    function insertValidationError(node, errorName, message) {
        //set error message 
        let $error = $(validationErrorTemplate);
        $error.addClass(`${errorName}_error`);
        $error.text(message);
        $(node).before($error);
    }

    // A function to build and insert a completed creature_block into the UI
    function displayStatBlock(npc) {
        var $statbloc = $(creatureBlockTemplate);
        var creature_id_class = `js_creature_${$statblocs.length}`;
        $statbloc.addClass(creature_id_class);
        $(`.creature_name`, $statbloc).text(npc.name);
        $(`.creature_cr`, $statbloc).text(npc.cr);
        // fill in the abilities table
        $(`.js_str_value`, $statbloc).text(`+${npc.str}`);
        $(`.js_dex_value`, $statbloc).text(`+${npc.dex}`);
        $(`.js_con_value`, $statbloc).text(`+${npc.con}`);
        $(`.js_int_value`, $statbloc).text(`+${npc.int}`);
        $(`.js_wis_value`, $statbloc).text(`+${npc.wis}`);
        $(`.js_cha_value`, $statbloc).text(`+${npc.cha}`);
        // fill in the defense table
        $(`.js_initive_value`, $statbloc).text(`+${npc.initive}`);
        $(`.js_kac_value`, $statbloc).text(`+${npc.kac}`);
        $(`.js_eac_value`, $statbloc).text(`+${npc.eac}`);
        // fill in the offense table
        $(`.js_hattack_value`, $statbloc).text(`+${npc.highattack}`);
        $(`.js_roll_hattack`, $statbloc).click(handleRollBasicHighAttack);
        $(`.js_lattack_value`, $statbloc).text(`+${npc.lowattack}`);
        $(`.js_roll_lattack`, $statbloc).click(handleRollBasicLowAttack);
        $(`.js_edmg_value`, $statbloc).text(npc.defaultenergydmg);
        $(`.js_roll_edmg`, $statbloc).click(handleRollBasicEnergyDmg);
        $(`.js_kdmg_value`, $statbloc).text(npc.defaultkineticdmg);
        $(`.js_roll_kdmg`, $statbloc).click(handleRollBasicKineticDmg);
        $(`.js_mdmg_value`, $statbloc).text(npc.defautmeleedmg);
        $(`.js_roll_mdmg`, $statbloc).click(handleRollBasicMeleeDmg);

        // check if the npc has three melee attacks
        if (npc.defaultmeleethreedmg != "") {
            // add the entries for the three attacks damage to the table
            $(`.js_3mdmg_entry`, $statbloc).removeClass("hidden");
            $(`.js_3mdmg_value`, $statbloc).removeClass("hidden");
            $(`.js_3mdmg_action`, $statbloc).removeClass("hidden");
            $(`.js_3mdmg_value`, $statbloc).text(npc.defaultmeleethreedmg);
            $(`.js_roll_3mdmg`, $statbloc).click(handleRollBasicThreeMeleeDmg);
        }
        if (npc.defaultmeleefourdmg != "") {
            // add the entries for the four attacks damage to the table
            $(`.js_4mdmg_entry`, $statbloc).removeClass("hidden");
            $(`.js_4mdmg_value`, $statbloc).removeClass("hidden");
            $(`.js_4mdmg_action`, $statbloc).removeClass("hidden");
            $(`.js_4mdmg_value`, $statbloc).text(npc.defaultmeleefourdmg);
            $(`.js_roll_4mdmg`, $statbloc).click(handleRollBasicFourMeleeDmg);
        }
        // fill in the skills table
        for (let i = 0; i < npc.skills.length; i++) {
            let skill = `<tr><td class="label ${npc.skills[i].name}_skill_label">${npc.skills[i].name}</td><td class="value ${npc.skills[i].modifier}_skill_value">+${npc.skills[i].modifier}</td></tr>`;
            $(`.creature_skills tbody`, $statbloc).append(skill);
        }
        // save the entry for later access
        $statblocs.push($statbloc);
        $(".statblocs_section").append($statbloc);
    }

    // A function to create and insert a dice_roll node into the UI
    function displayRollResult(npcID, roll, label) {
        var $activity = $(rollReportTemplate);
        $("p.result", $activity).text(`${label}: ${roll.result}`);
        $("p.report", $activity).text(roll.report);
        if ($(`div.js_creature_${npcID} .dice_roll`).length > 0) {
            $(`div.js_creature_${npcID} .dice_roll`).remove();
        }
        $(`div.js_creature_${npcID} .roll_results`).append($activity);
    }

    // Validators

    // Check the skill selectors for duplicates, return false if duplicate skills are selected
    function validateSkillSelections(){
        // if there are errors clear them here, we'll replace them if they aren't fixed
        $('.skills_section .validation_error').remove();
        var $skills = $(".skill_selector");
        var result = true;
        console.log(`Starting skill validation. Result: ${result}`);
        for(let j = 0; j < $skills.length; j++){
            for(let i = $skills.length - 1; i > j; i--){
                if( $($skills[j]).val() === $($skills[i]).val()){
                    // Two skills are the same, fire an error message
                    console.log("two skills are the same!!!!");
                    result = false;
                    let skillType = $skills[j].id.slice(0, $skills[j].id.lastIndexOf("_"));
                    if ($(`.skills_section .${skillType}_error`).length < 1){
                        insertValidationError(`.${skillType}_list`, skillType, "You cannot choose the same skill more than once"); 
                    }
                }
            }
        }
        console.log(`Ending skill validation. Result: ${result}`);
        return result;
    }

    // Check that the selected item in each ability modifier radio group is unique, 
    // return false if an ability is selected more than once
    function validateAbilityScores($newScore){
        console.log(`validating: newScore.name = ${$newScore.attr('name')}`);
        //var changed = $newscore.attr("name").slice(-1);
        var $rg = [publicAPI.$npcSelectedAbility0, publicAPI.$npcSelectedAbility1, publicAPI.$npcSelectedAbility2];
        var result = true;
        var errorMessage = "You cannot choose the same ability more than once";
        var $leftovers = [];
        $('.ability_scores_section .validation_error').remove();
        for(let i = 0; i < $rg.length; i++){
            // check if that we're not comparing something to itself & that they are the same value
            if($newScore.attr("name") != $rg[i].attr("name")){  
                // push the item being compared into an array so the left overs can be compared to themselves at the end
                $leftovers.push($rg[i]);
                if ($newScore.val() === $rg[i].val()){
                    console.log("it's a dupe!");
                    result = false;
                    if ($(`.ability_scores_section .${$newScore.attr("name")}_error`).length < 1) {
                        insertValidationError(`.js_${$newScore.attr("name")}_list`, $newScore.attr("name"), errorMessage);
                    }
                    if ($(`.ability_scores_section .${$rg[i].attr("name")}_error`).length < 1) {
                        insertValidationError(`.js_${$rg[i].attr("name")}_list`, $rg[i].attr("name"), errorMessage);
                    }
                }
            }
        }
        // there are only three radio groups so the leftover check will always be between the two that weren't selected
        if($leftovers[0].val() === $leftovers[1].val()){
            result = false;
            if ($(`.ability_scores_section .${$leftovers[0].attr("name")}_error`).length < 1) {
                insertValidationError(`.js_${$leftovers[0].attr("name")}_list`, $leftovers[0].attr("name"), errorMessage);
            }
            if ($(`.ability_scores_section .${$leftovers[1].attr("name")}_error`).length < 1) {
                insertValidationError(`.js_${$leftovers[1].attr("name")}_list`, $leftovers[1].attr("name"), errorMessage);
            }
        }
        return result;
    }
}

// The logic powering the application
function setupMobGenerator(){
    var combatant_stats;
    var expert_stats;
    var spellcaster_stats;
    var npcs = [];
    var publicAPI = {
        npcs,
        combatant_stats,
        expert_stats,
        spellcaster_stats,
        generateGenericNPC
    }; 
    return publicAPI

    // **************************

    // Factory for general combatant type mobs. 
    // Takes as arguments: 
    // base:      A base tempalate array to use. This will always be one of: combatant_stats, expert_stats, 
    //            or spellcaster_stats which will contain an object holding all the information from the book.
    // name:      The name of the NPC. Defaults to "rando NPC" 'cos that's fun :p 
    // cr:        A string that is a number from 1 to 25 or "half" or "third" representing the CR of the NPC to be created, 
    // abilities: an array of three strings in order from highest ability scrore to lowest. The only valid
    //            strings are: "str","dex","con","int","wis", or "cha" 
    // skills:    An array of strings represnting skill names in the order master skills before good skills.
    function generateGenericNPC(base, name = "rando NPC", cr, abilities, skills) {
        var mob = {
            "id": `npc_${name}_${cr}_${skills.length}`,
            "cr": cr, 
            "name": name,
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
            var damagedice;
            var damagemod;
            switch (damageType) {
                case "energy":
                    damagedice = mob.defaultenergydmg;
                    damagemod = 0;
                    break;
                case "kinetic":
                    damagedice = mob.defaultkineticdmg;
                    damagemod = 0;
                    break;
                case "melee":
                    damagedice = mob.defautmeleedmg;
                    damagemod = mob.str;
                    break;
                case "threemelee":
                    damagedice = mob.defaultmeleethreedmg;
                    damagemod = mob.str;
                    break;
                case "fourmelee":
                    damagedice = mob.defaultmeleefourdmg;
                    damagemod = mob.str;
            }
            var crToAdd = !isNaN(cr) ? Number(cr) : 0;
            var rolls = Helpers.rolldice(damagedice);
            var die = damagedice.slice(damagedice.indexOf("d"));
            var damage = 0;
            var report = "[";

            for (let i = 0; i < rolls.length; i++) {
                damage += rolls[i] + crToAdd + damagemod;
                report += ` ${rolls[i]} on ${die} `;
            }
            report += "]";
            return {"result":damage, report};
        }

        function rollAttack(attackType) {
            var attackbonus;
            switch (attackType) {
                case "high":
                    attackbonus = mob.highattack;
                    break;
                case "low":
                    attackbonus = mob.lowattack;
            }
            var roll = Helpers.rolldice("1d20")[0];
            var attack = roll + attackbonus;
            if(roll === 20){
                var report = "[ POTENTIAL CRITICAL! ]";
            }
            else{
                var report = `[ ${roll} on 1d20 ]`;
            }
            return {"result":attack, report};
            

        }

        function rollSkill(skillnumber){
            var roll = Helpers.rolldice("1d20")[0];
            var result = roll + mob.skills[skillnumber].modifier;
            var report = `[ ${roll} on 1d20 ]`;
            return {result, report};
        }

        npcs.push(mob);
        return mob;
    } 
}

// function calcAbilityMod(ability) {
//     return Math.floor((ability - 10) / 2);
// }





