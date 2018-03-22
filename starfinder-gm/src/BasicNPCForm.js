import React, { Component } from "react";
import RadioGroup from "./RadioGroup";
import FancySelect from "./FancySelect";

class BasicNPCForm extends Component {
    constructor(props){
        super(props);
        this.npcTypeRadios = [
            { id: "npc_type_combatant", value: "combatant", label: "Combatant", checked: true },
            { id: "npc_type_expert", value: "expert", label: "Expert", checked: false },
            { id: "npc_type_spellcaster", value: "spellcaster", label: "Spellcaster", checked: false }
        ];
        // eventually need to replace this with dynamically determined values based on the JSON 
        // files that are loaded at run
        this.npcCROptions = [
            { label: "1/3", value: "third" },
            { label: "1/2", value: "half" },
            { label: "1", value: "1" }
        ];
        this.skillsOptions = [
            { label: "Acrobatics", value: "Acrobatics" },
            { label: "Athletics", value: "Athletics" },
            { label: "Bluff", value: "Bluff" },
            { label: "Computers", value: "Computers" },
            { label: "Culture", value: "Culture" },
            { label: "Diplomacy", value: "Diplomacy" },
            { label: "Disguise", value: "Disguise" },
            { label: "Engineering", value: "Engineering" },
            { label: "Intimidate", value: "Intimidate" },
            { label: "Life Science", value: "Life Science" },
            { label: "Medicine", value: "Medicine" },
            { label: "Mysticism", value: "Mysticism" },
            { label: "Perception", value: "Perception" },
            { label: "Physical Science", value: "Physical Science" },
            { label: "Piloting", value: "Piloting" },
            { label: "Profession", value: "Profession" },
            { label: "Sense Motive", value: "Sense Motive" },
            { label: "Sleight of Hand", value: "Sleight of Hand" },
            { label: "Stealth", value: "Stealth" },
            { label: "Survival", value: "Survival" }
        ];
        this.state = {
            // initial values for all form fields?
        };

        this.handleNPCTypeChange = this.handleNPCTypeChange.bind(this);
        this.handleNPCAbilityChange = this.handleNPCAbilityChange.bind(this);
        this.handleNPCCreateButton = this.handleNPCCreateButton.bind(this);
    }
    handleNPCTypeChange(evt){
        // change the number of skill selectors in each setion of the app
        // check to make sure no more than one of each skill is selected
    }

    handleNPCAbilityChange(evt){
        // check to make sure no more than one of each ability is selected
    }

    handleNPCCreateButton(evt){
        // submit the form to the character generator functions
    }
    generateAbilityRadioObjects(number){
        return [
            { id: `npc_ability${number}_str`, value: "str", label: "Strength", checked: true },
            { id: `npc_ability${number}_dex`, value: "dex", label: "Dexterity", checked: false },
            { id: `npc_ability${number}_con`, value: "con", label: "Constitution", checked: false },
            { id: `npc_ability${number}_int`, value: "int", label: "Intelligence", checked: false },
            { id: `npc_ability${number}_wis`, value: "wis", label: "Wisdom", checked: false },
            { id: `npc_ability${number}_cha`, value: "cha", label: "Charisma", checked: false }
        ];
    }

    render(){
        return (
            <form className="BasicNPCForm creation_form">
                <section className="basic_info">
                    <fieldset className="input_group">
                        <label className="form_instruction" htmlFor="npc_name">NPC Type</label>
                        <input type="text" id="npc_name" />
                    </fieldset>
                    <FancySelect selectID="npc_cr" label="CR for NPC" selectValue="1/3" 
                        options={this.npcCROptions} />
                    <RadioGroup groupName="npc_type" groupLabel="NPC type" 
                        radioButtons={this.npcTypeRadios} changeHandler={this.handleNPCTypeChange}/>
                </section>
                <section className="ability_scores_section">
                    <RadioGroup groupName="npc_ability_0" groupLabel="Highest ability score modifier" 
                        radioButtons={this.generateAbilityRadioObjects(0)} 
                        changeHandler={this.handleNPCAbilityChange} />
                    <RadioGroup groupName="npc_ability_1" 
                        groupLabel="Second highest ability score modifier" 
                        radioButtons={this.generateAbilityRadioObjects(1)}
                        changeHandler={this.handleNPCAbilityChange} />
                    <RadioGroup groupName="npc_ability_2" 
                        groupLabel="Third highest ability score modifier" 
                        radioButtons={this.generateAbilityRadioObjects(2)} 
                        changeHandler={this.handleNPCAbilityChange} />
                </section>
                <section className="skills_section">
                    {/* TODO: Need to build a function to generate these fields because they need to 
                    change based on the value of the NPC type radio group */}
                    <div className="master_skills">
                        <h2 className="form_instruction">Master skills</h2>
                        <FancySelect selectID="master_skill_0" label="" selectValue="Acrobatics" options={this.skillsOptions} />
                    </div>
                    <div className="good_skills">
                        <h2 className="form_instruction">Good skills</h2>
                        <FancySelect selectID="good_skill_0" label="" selectValue="Acrobatics" options={this.skillsOptions} />
                        <FancySelect selectID="good_skill_1" label="" selectValue="Acrobatics" options={this.skillsOptions} />
                    </div>
                </section>
                <section className="submit_section">
                    <fieldset className="input_group">
                        <button className="submit_button">Roll NPC</button>
                    </fieldset>
                </section>
            </form>
        );
    }
}

export default BasicNPCForm;