import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import Helpers from './Helpers';

const combatant = Helpers.getStats("../public/json/combatant_array.json"),
    expert = Helpers.getStats("../public/json/expert_array.json"),
    spellcaster = Helpers.getStats("../public/json/spellcaster_array.json"),
    statsArrays = {};


combatant.then(
    function loadCombatants(result){
        statsArrays["combatant"] = result;
    }
)
    .then(()=> expert)
    .then(
        function loadExperts(result){
            statsArrays["expert"] = result;
        }
    )
    .then(() => spellcaster)
    .then(
        function loadSpellcasters(result){
            statsArrays["spellcaster"] = result;
        }
    )
    .then( function loadReactApp(){
        ReactDOM.render(<App arrays = {statsArrays}/>, document.getElementById('root'));
        registerServiceWorker();
    })
    .catch(
        function (err){
            console.log(err);
        }
    );


