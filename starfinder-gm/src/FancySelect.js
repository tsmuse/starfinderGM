import React, { Component } from "react";

/**
 * 
 * @param {*} props - The standard React props object
 * @param {string} props.selectID - The value to use in the id and for attributes
 * @param {string} props.label - The value to use in the label tag
 * @param {string} props.selectValue - The value to set the select tag to
 * @param {Object[]} props.options - an array of options objects
 * @param {string} props.options[].label - The value to use as the option's label
 * @param {string} props.options[].value - The value to use as the optiion's Value attribute 
 */
function FancySelect(props){
    
    return (
        <fieldset className="input_group">

            {props.label !== "" ? `<label className="form_instruction" htmlFor=${props.selectID}>${props.label}</label>` : ""}
            <div className="fancy_select">
                <select id={props.selectID} value={props.selectValue}>
                    {props.options.map(function(option, index){
                        return (
                            <option key={`{${index}_${option.value}`} defaultValue={option.value}>{option.label}</option>
                        );  
                    })}
                </select>
            </div>
        </fieldset>
    );
}

export default FancySelect;