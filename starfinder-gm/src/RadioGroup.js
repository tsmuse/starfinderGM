import React, { Component } from "react";
/**
 * 
 * @param {Object} props - The standard props that react uses
 * @param {string} props.groupName - The name to be used by all the inputs in the radio group
 * @param {string} props.groupLabel - The Text to be used in the field label for the radio group
 * @param {Object[]} props.radioButtons - An array of radio objects
 * @param {string} props.radioButtons[].id - The value to use in the ID and For properties on the radio button's input and label tags
 * @param {string} props.radioButtons[].value - The value to use in the Value property for the radio button's input
 * @param {string} props.radioButtons[].label - The value to use in the radio button's Label tag 
 * @param {boolean} props.radioButtons[].checked - Boolean representing if the button should have the Checked property
 */
function RadioGroup(props){
    return (
        <fieldset className="input_group">
            <h2 className="form_instruction">{props.groupLabel}</h2>
            <ul className="radio_choice_list">
                {props.radioButtons.map(function(radio, index){
                    return (
                        <li key={`{${index}_${radio.name}`}> 
                            <div className="radio-button">
                                <input 
                                    type="radio" name={props.groupName} id={radio.id} 
                                    value={radio.value} checked={radio.checked}
                                    onChange={props.changeHandler} />
                                <label htmlFor={radio.id}>{radio.label}</label>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </fieldset>
    );
}

export default RadioGroup;