import React, { Component } from "react";
// import logo from './logo.svg';
// import './App.css';
import CreationForms from "./CreationForms";
// import NPCPortfolio from "./NPCPortfolio";

class App extends Component {
    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <h1>Starfinder NPC Generator</h1>
                </header>
                <CreationForms />
                {/* <NPCPortfolio /> */}
            </div>
        );
    }
}

export default App;
